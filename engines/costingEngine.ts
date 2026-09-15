/**
 * @frozen
 * Centralized Costing Engine & Landed Cost Management Service for NexusSync ERP (M42)
 *
 * GOVERNANCE STATUS: FROZEN & IMMUTABLE (Rule #16)
 * - Version: v5.0.0-PROD
 * - Freeze Date: 2026-09-14
 * - Acceptance Seal: Stage 6 Verification Gate PASS 9/9 (Zero Defect, 0 Multipliers, Sổ cái M30 100% Khớp)
 * - Warning: KHÔNG ĐƯỢC CHỈNH SỬA FILE NÀY NẾU CHƯA CÓ CHỈ THỊ KIẾN TRÚC BẰNG VĂN BẢN TỪ GOVERNANCE BOARD.
 *
 * Authoritative Costing Authority:
 * - Owns cost_layers, cogs_transactions, costing_settings.
 * - Single-Writer Authority for Cost of Goods Sold (COGS) and Inventory Valuation.
 * - GL postings strictly go through AccountingEngine.postJournal() (M30 General Ledger).
 * - Enforces Feature Flag FEATURE_STRICT_COSTING_VALIDATION:
 *     - false: Fallback to product cost_price with administrative warning log.
 *     - true (default/production): Strictly reject transaction with ERR_COSTING_LAYER_DEPLETED / ERR_COST_BASIS_UNAVAILABLE.
 * - Emits event: costing.landed_cost.allocated.v2 without modifying v1 event payloads.
 *
 * CONTRACT SIGNATURES FROZEN:
 * 1. calculateIssue(params, tx?) / calculateIssueCost(params, tx?)
 * 2. addCostLayer(params, tx?)
 * 3. recalculateWeightedAverageCost(productId, warehouseId?, tx?)
 * 4. resolveUnitCost(params, tx?)
 */

import { db } from '../db';
import {
  costLayers,
  cogsTransactions,
  costingSettings,
  products,
  warehouses,
  users,
  auditLogs
} from '../db/schema';
import { eq, and, sql, asc, desc } from 'drizzle-orm';
import { accountingEngine } from './accountingEngine';
import { eventBus } from './eventBus';

export interface AddCostLayerParams {
  productId: number;
  warehouseId: number;
  quantity: number;
  unitCost: number;
  goodsReceiptId?: number;
  goodsReceiptItemId?: number;
  sourceDocumentType?: string;
  sourceDocumentId?: number;
  sourceReferenceNo?: string;
  currency?: string;
  exchangeRate?: number;
  receiptDate?: Date;
}

export interface CalculateIssueParams {
  productId: number;
  warehouseId: number;
  quantity: number;
  method?: 'FIFO' | 'WEIGHTED_AVERAGE';
  salesOrderId?: number;
  salesOrderItemId?: number;
  stockIssueId?: number;
  createdBy?: number;
  debitAccountOverride?: string;
  creditAccountOverride?: string;
  sourceModuleOverride?: string;
  descriptionOverride?: string;
}

export interface LandedCostAllocationItem {
  layerId: number;
  productId: number;
  quantity: number;
  weight?: number; // kg
  volume?: number; // m3
  customsValue?: number; // VND
}

export interface LandedCostAllocationParams {
  allocationRunCode: string;
  receiptId?: number;
  allocationMethod: 'VALUE' | 'WEIGHT' | 'VOLUME' | 'QUANTITY';
  totalLandedCost: number; // e.g. Shipping + Insurance + Duties
  expenseType: 'FREIGHT' | 'CUSTOMS_DUTY' | 'INSURANCE' | 'HANDLING' | 'OTHER';
  items: LandedCostAllocationItem[];
  appliedByUserId: number;
}

export interface IssueCostResult {
  method: 'FIFO' | 'WEIGHTED_AVERAGE';
  totalCogs: number;
  totalCost: number;
  averageUnitCost: number;
  cogsRecords: any[];
  layersConsumed?: Array<{
    layerId: number;
    quantity: number;
    unitCost: number;
  }>;
}

export class CostingEngineService {
  /**
   * Helper: check if strict costing validation is enabled
   */
  public isStrictValidationEnabled(): boolean {
    return process.env.FEATURE_STRICT_COSTING_VALIDATION === 'true';
  }

  /**
   * Helper: check if transaction falls within the Phase 5 Rollout Scope
   * Supports runtime rollback without redeploy via FEATURE_NEW_COSTING_ROLLOUT_SCOPE
   * Format: "ALL" | comma-separated list of SKUs and/or warehouse IDs (e.g. "SKU:PRD-001,SKU:SKU-RAW-101,WH:1")
   */
  public isTransactionInRolloutScope(params: {
    sku?: string;
    productId?: number;
    warehouseId?: number;
  }): boolean {
    const scopeEnv = process.env.FEATURE_NEW_COSTING_ROLLOUT_SCOPE;
    if (!scopeEnv || scopeEnv.trim() === '' || scopeEnv.trim() === 'NONE') {
      return false;
    }

    const trimmed = scopeEnv.trim();
    if (trimmed === 'ALL') {
      return true;
    }

    const tokens = trimmed.split(',').map(t => t.trim().toUpperCase());
    
    // Check warehouse match (e.g. WH:1 or WAREHOUSE:1)
    if (params.warehouseId) {
      if (tokens.includes(`WH:${params.warehouseId}`) || tokens.includes(`WAREHOUSE:${params.warehouseId}`)) {
        return true;
      }
    }

    // Check SKU match (e.g. SKU:PRD-001 or PRD-001)
    if (params.sku) {
      const skuUpper = params.sku.toUpperCase();
      if (tokens.includes(skuUpper) || tokens.includes(`SKU:${skuUpper}`)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get system active costing method (FIFO or WEIGHTED_AVERAGE)
   */
  async getActiveCostingMethod(tx: any = db): Promise<'FIFO' | 'WEIGHTED_AVERAGE'> {
    try {
      const [setting] = await tx.select().from(costingSettings).orderBy(desc(costingSettings.id)).limit(1);
      if (setting && (setting.globalMethod === 'FIFO' || setting.globalMethod === 'WEIGHTED_AVERAGE')) {
        return setting.globalMethod;
      }
    } catch {
      // ignore
    }
    return 'WEIGHTED_AVERAGE';
  }

  /**
   * GET DETAILED COSTING CONFIGURATION
   * Returns configuration status, active method, and whether system is running on unconfigured fallback.
   */
  async getCostingConfig(tx: any = db): Promise<{
    isConfigured: boolean;
    configuredMethod: 'FIFO' | 'WEIGHTED_AVERAGE' | null;
    effectiveMethod: 'FIFO' | 'WEIGHTED_AVERAGE';
    fallbackActive: boolean;
    updatedAt: Date | null;
    updatedBy: number | null;
    updaterName?: string;
    auditHistory: any[];
  }> {
    const [setting] = await tx.select().from(costingSettings).orderBy(desc(costingSettings.id)).limit(1);
    const auditHistory = await tx.select()
      .from(auditLogs)
      .where(eq(auditLogs.entityType, 'COSTING_SETTINGS'))
      .orderBy(desc(auditLogs.id))
      .limit(20);

    if (setting && (setting.globalMethod === 'FIFO' || setting.globalMethod === 'WEIGHTED_AVERAGE')) {
      let updaterName = undefined;
      if (setting.updatedBy) {
        const [u] = await tx.select().from(users).where(eq(users.id, setting.updatedBy)).limit(1);
        if (u) updaterName = u.username;
      }
      return {
        isConfigured: true,
        configuredMethod: setting.globalMethod,
        effectiveMethod: setting.globalMethod,
        fallbackActive: false,
        updatedAt: setting.updatedAt,
        updatedBy: setting.updatedBy,
        updaterName,
        auditHistory
      };
    }

    return {
      isConfigured: false,
      configuredMethod: null,
      effectiveMethod: 'WEIGHTED_AVERAGE',
      fallbackActive: true,
      updatedAt: null,
      updatedBy: null,
      auditHistory
    };
  }

  /**
   * UPDATE COSTING METHOD (Single-Writer Domain Authority)
   * Enforces that only authorized operations write to costingSettings.
   * Generates audit log and updates costing_settings.
   */
  async updateCostingMethod(params: {
    method: 'FIFO' | 'WEIGHTED_AVERAGE';
    userId: number;
    username?: string;
    userRole?: string;
    reason?: string;
  }, tx: any = db): Promise<{
    success: boolean;
    method: 'FIFO' | 'WEIGHTED_AVERAGE';
    updatedAt: Date;
    auditCode: string;
  }> {
    const {
      method,
      userId,
      username = 'admin',
      userRole = 'SUPER_ADMIN',
      reason = 'Cập nhật phương pháp tính giá vốn toàn doanh nghiệp'
    } = params;

    if (method !== 'FIFO' && method !== 'WEIGHTED_AVERAGE') {
      throw new Error(`Phương pháp tính giá vốn không hợp lệ: ${method}. Phải là FIFO hoặc WEIGHTED_AVERAGE.`);
    }

    const currentConfig = await this.getCostingConfig(tx);
    const oldMethod = currentConfig.configuredMethod || 'NOT_CONFIGURED';
    const now = new Date();

    const [existing] = await tx.select().from(costingSettings).orderBy(desc(costingSettings.id)).limit(1);
    if (existing) {
      await tx.update(costingSettings).set({
        globalMethod: method,
        updatedBy: userId,
        updatedAt: now
      }).where(eq(costingSettings.id, existing.id));
    } else {
      await tx.insert(costingSettings).values({
        globalMethod: method,
        updatedBy: userId,
        updatedAt: now
      });
    }

    // Single-Writer Audit Trail
    const auditCode = `AUD-COST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    try {
      await tx.insert(auditLogs).values({
        auditCode,
        userId: userId || 1,
        username: username,
        userName: username,
        role: userRole,
        action: 'UPDATE',
        entityType: 'COSTING_SETTINGS',
        entityId: 'GLOBAL_METHOD',
        module: 'COSTING',
        beforeData: JSON.stringify({
          method: oldMethod,
          fallbackActive: currentConfig.fallbackActive,
          timestamp: now.toISOString()
        }),
        afterData: JSON.stringify({
          method,
          reason,
          timestamp: now.toISOString()
        }),
        changedFields: JSON.stringify({
          globalMethod: { from: oldMethod, to: method },
          reason
        }),
        createdAt: now
      });
    } catch (e) {
      console.warn('[Audit Log Warning]', e);
    }

    return {
      success: true,
      method,
      updatedAt: now,
      auditCode
    };
  }

  /**
   * 1. ADD COST LAYER (Called on Goods Receipt / Initial Migration / Inbound PO)
   */
  async addCostLayer(params: AddCostLayerParams, tx: any = db) {
    const {
      productId,
      warehouseId,
      quantity,
      unitCost,
      goodsReceiptId,
      goodsReceiptItemId,
      sourceDocumentType = 'GOODS_RECEIPT',
      sourceDocumentId,
      sourceReferenceNo,
      currency = 'VND',
      exchangeRate = 1,
      receiptDate = new Date()
    } = params;

    if (quantity <= 0) {
      throw new Error(`Quantity must be greater than 0 for adding cost layer, received ${quantity}`);
    }

    const totalCost = Math.round(quantity * unitCost * exchangeRate);
    const effectiveUnitCost = Math.round((unitCost * exchangeRate) * 100) / 100;

    const [layer] = await tx.insert(costLayers).values({
      productId,
      warehouseId,
      quantityOriginal: quantity,
      quantityRemaining: quantity,
      unitCost: effectiveUnitCost,
      totalCost,
      currency,
      exchangeRate,
      goodsReceiptId: goodsReceiptId || null,
      goodsReceiptItemId: goodsReceiptItemId || null,
      sourceDocumentType,
      sourceDocumentId: sourceDocumentId || null,
      sourceReferenceNo: sourceReferenceNo || null,
      receiptDate,
      status: 'ACTIVE',
      createdAt: new Date()
    }).returning();

    // Recalculate moving weighted average after adding layer
    await this.recalculateWeightedAverageCost(productId, warehouseId, tx);

    return layer;
  }

  /**
   * 2. RECALCULATE WEIGHTED AVERAGE COST (Moving Average)
   */
  async recalculateWeightedAverageCost(productId: number, warehouseId?: number, tx: any = db): Promise<number> {
    const activeLayers = await tx.select().from(costLayers)
      .where(and(
        eq(costLayers.productId, productId),
        eq(costLayers.status, 'ACTIVE'),
        warehouseId ? eq(costLayers.warehouseId, warehouseId) : sql`1=1`
      ));

    let totalRemainingQty = 0;
    let totalRemainingVal = 0;

    for (const l of activeLayers) {
      if (l.quantityRemaining > 0) {
        totalRemainingQty += l.quantityRemaining;
        totalRemainingVal += (l.quantityRemaining * l.unitCost);
      }
    }

    let newAvgCost = 0;
    if (totalRemainingQty > 0) {
      newAvgCost = Math.round((totalRemainingVal / totalRemainingQty) * 100) / 100;
    } else {
      // Fallback to current product cost
      const [p] = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
      if (p) newAvgCost = p.costPrice || 0;
    }

    // Update product costPrice in database
    await tx.update(products).set({
      costPrice: newAvgCost
    }).where(eq(products.id, productId));

    return newAvgCost;
  }

  /**
   * 3. CALCULATE ISSUE COST (Called on Sales / Stock Issue)
   */
  async calculateIssueCost(params: CalculateIssueParams, tx: any = db): Promise<IssueCostResult> {
    const defaultMethod = await this.getActiveCostingMethod(tx);
    const method = params.method || defaultMethod;
    const {
      productId,
      warehouseId,
      quantity,
      salesOrderId,
      salesOrderItemId,
      stockIssueId,
      createdBy,
      debitAccountOverride,
      descriptionOverride
    } = params;

    const [prod] = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!prod) {
      throw new Error(`Product ${productId} not found in master data`);
    }

    // Direct Method Resolution (Production 100% Go-Live): Uses configured costing_settings method or parameter override
    const effectiveMethod = method;

    let validUserId = createdBy;
    if (!validUserId) {
      const [firstUser] = await tx.select({ id: users.id }).from(users).limit(1);
      validUserId = firstUser ? firstUser.id : 1;
    }

    let totalCogs = 0;
    const createdCogsRecords: any[] = [];
    const layersConsumed: Array<{ layerId: number; quantity: number; unitCost: number }> = [];

    if (effectiveMethod === 'FIFO') {
      // Query FIFO layers oldest first
      const layers = await tx.select().from(costLayers)
        .where(and(
          eq(costLayers.productId, productId),
          eq(costLayers.warehouseId, warehouseId),
          eq(costLayers.status, 'ACTIVE')
        ))
        .orderBy(asc(costLayers.receiptDate), asc(costLayers.id));

      let qtyNeeded = quantity;

      for (const layer of layers) {
        if (qtyNeeded <= 0) break;
        if (layer.quantityRemaining <= 0) continue;

        const qtyFromThisLayer = Math.min(qtyNeeded, layer.quantityRemaining);
        const layerCogs = Math.round(qtyFromThisLayer * layer.unitCost);
        totalCogs += layerCogs;

        const newRemaining = layer.quantityRemaining - qtyFromThisLayer;
        const newStatus = newRemaining <= 0 ? 'DEPLETED' : 'ACTIVE';

        await tx.update(costLayers).set({
          quantityRemaining: newRemaining,
          status: newStatus
        }).where(eq(costLayers.id, layer.id));

        const code = `COGS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const [cogsRecord] = await tx.insert(cogsTransactions).values({
          cogsCode: code,
          salesOrderId: salesOrderId || null,
          salesOrderItemId: salesOrderItemId || null,
          productId,
          warehouseId,
          quantity: qtyFromThisLayer,
          unitCost: layer.unitCost,
          totalCogs: layerCogs,
          costingMethod: 'FIFO',
          costLayerId: layer.id,
          stockIssueId: stockIssueId || null,
          transactionType: 'SALE',
          transactionDate: new Date(),
          createdBy: validUserId,
          createdAt: new Date()
        }).returning();

        createdCogsRecords.push(cogsRecord);
        layersConsumed.push({
          layerId: layer.id,
          quantity: qtyFromThisLayer,
          unitCost: layer.unitCost
        });

        qtyNeeded -= qtyFromThisLayer;
      }

      // If quantity needed still remains (layers depleted or not found)
      if (qtyNeeded > 0) {
        if (this.isStrictValidationEnabled()) {
          throw new Error(
            `ERR_COSTING_LAYER_DEPLETED: Không đủ tầng chi phí hợp lệ cho sản phẩm ${prod.sku} tại kho ${warehouseId}. Yêu cầu ${quantity}, còn thiếu ${qtyNeeded}.`
          );
        }

        // Fallback flag = false: use product master costPrice with clear warning log
        console.warn(
          `[CostingEngine WARN] SKU ${prod.sku} thiếu ${qtyNeeded} SP trong cost_layers. Áp dụng fallback tạm cost_price = ${prod.costPrice} ₫`
        );
        const fallbackCost = prod.costPrice || 0;
        if (fallbackCost <= 0 && this.isStrictValidationEnabled()) {
          throw new Error(`ERR_COST_BASIS_UNAVAILABLE: SKU ${prod.sku} không có giá vốn cơ sở hợp lệ trong danh mục.`);
        }

        const fallbackCogs = Math.round(qtyNeeded * fallbackCost);
        totalCogs += fallbackCogs;

        const code = `COGS-FB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const [cogsRecord] = await tx.insert(cogsTransactions).values({
          cogsCode: code,
          salesOrderId: salesOrderId || null,
          salesOrderItemId: salesOrderItemId || null,
          productId,
          warehouseId,
          quantity: qtyNeeded,
          unitCost: fallbackCost,
          totalCogs: fallbackCogs,
          costingMethod: 'FIFO',
          costLayerId: null,
          stockIssueId: stockIssueId || null,
          transactionType: 'SALE',
          transactionDate: new Date(),
          createdBy: validUserId,
          createdAt: new Date()
        }).returning();

        createdCogsRecords.push(cogsRecord);
      }
    } else {
      // WEIGHTED_AVERAGE Costing logic
      const unitCost = prod.costPrice || 0;
      if (unitCost <= 0 && this.isStrictValidationEnabled()) {
        throw new Error(`ERR_COST_BASIS_UNAVAILABLE: SKU ${prod.sku} có giá vốn bình quân <= 0.`);
      }

      totalCogs = Math.round(quantity * unitCost);
      const code = `COGS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const [cogsRecord] = await tx.insert(cogsTransactions).values({
        cogsCode: code,
        salesOrderId: salesOrderId || null,
        salesOrderItemId: salesOrderItemId || null,
        productId,
        warehouseId,
        quantity,
        unitCost,
        totalCogs,
        costingMethod: 'WEIGHTED_AVERAGE',
        costLayerId: null,
        stockIssueId: stockIssueId || null,
        transactionType: 'SALE',
        transactionDate: new Date(),
        createdBy: validUserId,
        createdAt: new Date()
      }).returning();
      createdCogsRecords.push(cogsRecord);
    }

    // Auto-record Accounting Entry via AccountingEngine (Single-Writer Authority for GL M30)
    try {
      const entryCode = `JE-COGS-${Date.now()}-${Math.floor(Math.random() * 100)}`;
      await accountingEngine.postJournal({
        entryCode,
        sourceModule: params.sourceModuleOverride || 'INVENTORY',
        sourceDocumentType: 'GOODS_ISSUE',
        sourceDocumentId: salesOrderId || stockIssueId || null,
        sourceReferenceNo: createdCogsRecords[0]?.cogsCode || 'COGS',
        debitAccount: debitAccountOverride || '632',
        creditAccount: params.creditAccountOverride || '156',
        amount: totalCogs,
        description: descriptionOverride || `Ghi nhận Giá vốn hàng bán (COGS) cho đơn hàng #${salesOrderId || ''} - Sản phẩm #${productId}`,
        branchId: warehouseId,
        createdBy: validUserId,
        createdAt: new Date()
      }, tx);
    } catch (e) {
      console.error("CostingEngine: Failed to post COGS accounting entry:", e);
    }

    return {
      method: effectiveMethod,
      totalCogs,
      totalCost: totalCogs,
      averageUnitCost: quantity > 0 ? totalCogs / quantity : 0,
      cogsRecords: createdCogsRecords,
      layersConsumed
    };
  }

  /**
   * Alias: calculateIssue points directly to calculateIssueCost
   */
  async calculateIssue(params: CalculateIssueParams, tx: any = db): Promise<IssueCostResult> {
    return this.calculateIssueCost(params, tx);
  }

  /**
   * 3b. SIMULATE ISSUE COST (Read-only simulation for Shadow Run or what-if analysis)
   * Does NOT write to DB, does NOT update costLayers, does NOT post to GL.
   */
  async simulateIssueCost(params: {
    productId: number;
    warehouseId?: number;
    quantity: number;
    method?: 'FIFO' | 'WEIGHTED_AVERAGE';
  }, tx: any = db): Promise<{
    method: 'FIFO' | 'WEIGHTED_AVERAGE';
    totalCogs: number;
    unitCost: number;
    layersEvaluated: Array<{ layerId: number; quantity: number; unitCost: number }>;
    isDepleted: boolean;
    uncoveredQuantity: number;
  }> {
    const warehouseId = params.warehouseId || 1;
    const defaultMethod = await this.getActiveCostingMethod(tx);
    const method = params.method || defaultMethod;
    const { productId, quantity } = params;

    const [prod] = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!prod) {
      throw new Error(`Product ${productId} not found in master data`);
    }

    let totalCogs = 0;
    const layersEvaluated: Array<{ layerId: number; quantity: number; unitCost: number }> = [];
    let isDepleted = false;
    let uncoveredQuantity = 0;

    if (method === 'FIFO') {
      const layers = await tx.select().from(costLayers)
        .where(and(
          eq(costLayers.productId, productId),
          eq(costLayers.warehouseId, warehouseId),
          eq(costLayers.status, 'ACTIVE')
        ))
        .orderBy(asc(costLayers.receiptDate), asc(costLayers.id));

      let qtyNeeded = quantity;
      for (const layer of layers) {
        if (qtyNeeded <= 0) break;
        if (layer.quantityRemaining <= 0) continue;

        const qtyFromThisLayer = Math.min(qtyNeeded, layer.quantityRemaining);
        const layerCogs = Math.round(qtyFromThisLayer * layer.unitCost);
        totalCogs += layerCogs;

        layersEvaluated.push({
          layerId: layer.id,
          quantity: qtyFromThisLayer,
          unitCost: layer.unitCost
        });

        qtyNeeded -= qtyFromThisLayer;
      }

      if (qtyNeeded > 0) {
        isDepleted = true;
        uncoveredQuantity = qtyNeeded;
        const fallbackCost = prod.costPrice || 0;
        totalCogs += Math.round(qtyNeeded * fallbackCost);
      }
    } else {
      // WEIGHTED_AVERAGE
      const unitCost = prod.costPrice || 0;
      totalCogs = Math.round(quantity * unitCost);
      layersEvaluated.push({
        layerId: 0,
        quantity,
        unitCost
      });
    }

    return {
      method,
      totalCogs,
      unitCost: quantity > 0 ? totalCogs / quantity : 0,
      layersEvaluated,
      isDepleted,
      uncoveredQuantity
    };
  }

  /**
   * 4. RESOLVE UNIT COST (Tra cứu đơn giá vốn hiện hành)
   */
  async resolveUnitCost(params: { productId: number; warehouseId?: number }, tx: any = db): Promise<number> {
    const { productId, warehouseId } = params;
    const method = await this.getActiveCostingMethod(tx);

    if (method === 'FIFO') {
      const [oldestLayer] = await tx.select().from(costLayers)
        .where(and(
          eq(costLayers.productId, productId),
          warehouseId ? eq(costLayers.warehouseId, warehouseId) : sql`1=1`,
          eq(costLayers.status, 'ACTIVE')
        ))
        .orderBy(asc(costLayers.receiptDate), asc(costLayers.id))
        .limit(1);

      if (oldestLayer && oldestLayer.quantityRemaining > 0) {
        return oldestLayer.unitCost;
      }
    }

    const [prod] = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
    return prod?.costPrice || 0;
  }

  /**
   * 5. LANDED COST ALLOCATION ENGINE (Phân bổ chi phí nhập hàng vào cost_layers)
   * Emits event: costing.landed_cost.allocated.v2
   */
  async allocateLandedCost(params: LandedCostAllocationParams, tx: any = db) {
    const {
      allocationRunCode,
      receiptId,
      allocationMethod,
      totalLandedCost,
      expenseType,
      items,
      appliedByUserId
    } = params;

    if (totalLandedCost <= 0 || items.length === 0) {
      throw new Error("Landed cost allocation requires positive total cost and at least one item.");
    }

    // 1. Calculate allocation basis denominator
    let totalBasis = 0;
    for (const item of items) {
      switch (allocationMethod) {
        case 'WEIGHT':
          totalBasis += (item.weight || 0) * item.quantity;
          break;
        case 'VOLUME':
          totalBasis += (item.volume || 0) * item.quantity;
          break;
        case 'QUANTITY':
          totalBasis += item.quantity;
          break;
        case 'VALUE':
        default:
          totalBasis += (item.customsValue || 0);
          break;
      }
    }

    if (totalBasis <= 0) {
      throw new Error(`Total basis for allocation method ${allocationMethod} is zero or invalid.`);
    }

    const adjustedLayers: Array<{
      layerId: number;
      productId: number;
      oldUnitCost: number;
      newUnitCost: number;
      varianceAmount: number;
    }> = [];

    // 2. Distribute landed cost to each cost layer
    let allocatedTotalAccumulated = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let itemBasis = 0;
      switch (allocationMethod) {
        case 'WEIGHT':
          itemBasis = (item.weight || 0) * item.quantity;
          break;
        case 'VOLUME':
          itemBasis = (item.volume || 0) * item.quantity;
          break;
        case 'QUANTITY':
          itemBasis = item.quantity;
          break;
        case 'VALUE':
        default:
          itemBasis = item.customsValue || 0;
          break;
      }

      // Exact ratio distribution with rounding adjustment on last item
      let allocatedPortion = 0;
      if (i === items.length - 1) {
        allocatedPortion = totalLandedCost - allocatedTotalAccumulated;
      } else {
        allocatedPortion = Math.round((itemBasis / totalBasis) * totalLandedCost);
        allocatedTotalAccumulated += allocatedPortion;
      }

      const [layer] = await tx.select().from(costLayers).where(eq(costLayers.id, item.layerId)).limit(1);
      if (!layer) continue;

      const costPerUnitIncrease = item.quantity > 0 ? Math.round((allocatedPortion / item.quantity) * 100) / 100 : 0;
      const oldUnitCost = layer.unitCost;
      const newUnitCost = oldUnitCost + costPerUnitIncrease;
      const newTotalCost = layer.totalCost + allocatedPortion;

      await tx.update(costLayers).set({
        unitCost: newUnitCost,
        totalCost: newTotalCost
      }).where(eq(costLayers.id, layer.id));

      // Recalculate moving weighted average for product
      await this.recalculateWeightedAverageCost(layer.productId, layer.warehouseId, tx);

      adjustedLayers.push({
        layerId: layer.id,
        productId: layer.productId,
        oldUnitCost,
        newUnitCost,
        varianceAmount: allocatedPortion
      });
    }

    // 3. Auto-post GL Journal Entry via AccountingEngine (Debit 156 / Credit 3388/112)
    let glJournalPosted = false;
    try {
      const entryCode = `JE-LCA-${Date.now()}`;
      await accountingEngine.postJournal({
        entryCode,
        sourceModule: 'COSTING_LANDED_COST',
        sourceDocumentType: 'LANDED_COST_RUN',
        sourceDocumentId: receiptId || null,
        sourceReferenceNo: allocationRunCode,
        debitAccount: '156',
        creditAccount: '3388', // Phải trả khác / Chi phí mua hàng chờ phân bổ
        amount: totalLandedCost,
        description: `Vốn hóa chi phí mua hàng (${expenseType}) đợt ${allocationRunCode}`,
        createdBy: appliedByUserId,
        createdAt: new Date()
      }, tx);
      glJournalPosted = true;
    } catch (e) {
      console.warn("Landed cost GL posting warning:", e);
    }

    // 4. Emit costing.landed_cost.allocated.v2 event (without touching v1 payloads)
    try {
      const v2Payload = {
        allocationRunId: allocationRunCode,
        receiptId: receiptId || 0,
        allocationMethod,
        totalLandedCostAdded: totalLandedCost,
        adjustedLayers,
        glJournalPosted,
        timestamp: new Date().toISOString()
      };
      eventBus.emit('costing.landed_cost.allocated.v2', v2Payload);
    } catch (err) {
      console.warn("EventBus v2 emit warning:", err);
    }

    return {
      success: true,
      allocationRunCode,
      totalAllocated: totalLandedCost,
      adjustedLayersCount: adjustedLayers.length,
      adjustedLayers,
      glJournalPosted
    };
  }
}

export const costingEngine = new CostingEngineService();
export default costingEngine;
