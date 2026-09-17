import { Router } from "express";
import crypto from "crypto";
import { client, db } from "../../db/index";
import * as schema from "../../db/schema";
import { InventoryService } from "../../engines/inventoryService";
import { AuditService } from "../../engines/auditService";
import { QualityService } from "../../services/qualityService";
import { OrgBudgetService, WorkflowMatrixEngine } from "../data/orgMasterData";
import { eq, desc, and, sql } from "drizzle-orm";

const router = Router();

// In-memory persistent stores for BPA framework contracts and discrepancy resolutions
export interface DiscrepancyResolution {
  caseId: string;
  poId: string;
  reason: string;
  resolvedBy: string;
  resolvedAt: string;
  status: 'RESOLVED';
}

const discrepancyResolutions = new Map<string, DiscrepancyResolution>();

export interface BPAContract {
  id: string;
  contractCode?: string;
  title: string;
  supplier: string;
  supplierId?: number;
  supplierCode?: string;
  contractType?: 'FRAMEWORK_BPA' | 'PRICE_LOCK' | 'SERVICE_SLA' | 'LONG_TERM_SUPPLY';
  startDate: string;
  endDate: string;
  committedValue: number;
  usedValue: number;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING_RENEWAL' | 'TERMINATED' | 'UNDER_REVIEW';
  discountRate?: number;
  paymentTerms?: string;
  slaTargetOtif?: number;
  slaTargetQuality?: number;
  autoRenewalNoticeDays?: number;
  priceLocks?: Array<{
    itemCode: string;
    itemName: string;
    lockedPrice: number;
    unit: string;
  }>;
  renewalHistory?: Array<{
    renewalDate: string;
    previousEndDate: string;
    newEndDate: string;
    renewedBy: string;
    committedValueAdded: number;
    notes?: string;
  }>;
  notes?: string;
}

export let bpaContracts: BPAContract[] = [
  {
    id: 'CON-2026-001',
    contractCode: 'CON-2026-001',
    title: 'Hợp đồng nguyên tắc cung ứng Silicon Wafer Bán Dẫn',
    supplier: 'Công ty Cổ phần Vật liệu Bán dẫn Toàn Cầu',
    supplierId: 1,
    supplierCode: 'SUP-001',
    contractType: 'FRAMEWORK_BPA',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    committedValue: 3000000000,
    usedValue: 1850000000,
    status: 'ACTIVE',
    discountRate: 5,
    paymentTerms: 'NET30 (Chuyển khoản trong 30 ngày sau khi nghiệm thu IQC)',
    slaTargetOtif: 98,
    slaTargetQuality: 99,
    autoRenewalNoticeDays: 45,
    priceLocks: [
      { itemCode: 'RAW-WAF-01', itemName: 'Silicon Wafer 8 inch tinh khiết 99.99%', lockedPrice: 920000, unit: 'Tấm' },
      { itemCode: 'RAW-WAF-02', itemName: 'Silicon Wafer 12 inch chuẩn Cleanroom', lockedPrice: 1650000, unit: 'Tấm' }
    ],
    notes: 'Cam kết đơn giá trần cố định 12 tháng, bảo lãnh cung ứng tối thiểu 10.000 tấm/quý.'
  },
  {
    id: 'CON-2026-002',
    contractCode: 'CON-2026-002',
    title: 'Thỏa thuận khung Hóa chất tinh khiết & Phụ gia Xanh',
    supplier: 'Tập đoàn Hóa chất & Phụ gia Xanh',
    supplierId: 2,
    supplierCode: 'SUP-002',
    contractType: 'LONG_TERM_SUPPLY',
    startDate: '2026-02-15',
    endDate: '2026-10-15',
    committedValue: 1500000000,
    usedValue: 1320000000,
    status: 'PENDING_RENEWAL',
    discountRate: 3,
    paymentTerms: 'NET45 (Thanh toán định kỳ ngày 15 hàng tháng)',
    slaTargetOtif: 95,
    slaTargetQuality: 98,
    autoRenewalNoticeDays: 60,
    priceLocks: [
      { itemCode: 'CHEM-ETCH-01', itemName: 'Dung môi ăn mòn Ultra-Pure Acid', lockedPrice: 380000, unit: 'Lít' },
      { itemCode: 'CHEM-CLN-02', itemName: 'Dung dịch tẩy rửa chuyên dụng Clean-Pro', lockedPrice: 210000, unit: 'Thùng' }
    ],
    notes: 'Hợp đồng sắp hết hiệu lực (10/2026). Đã đạt 88% ngân sách cam kết. Cần đàm phán gia hạn phụ lục.'
  },
  {
    id: 'CON-2026-003',
    contractCode: 'CON-2026-003',
    title: 'Hợp đồng bảo trì & Linh kiện thay thế Thiết bị Đo Quang học',
    supplier: 'Công ty TNHH Thiết bị Đo lường Quang Học',
    supplierId: 3,
    supplierCode: 'SUP-003',
    contractType: 'SERVICE_SLA',
    startDate: '2025-06-01',
    endDate: '2026-05-31',
    committedValue: 800000000,
    usedValue: 800000000,
    status: 'EXPIRED',
    discountRate: 0,
    paymentTerms: 'NET15',
    slaTargetOtif: 90,
    slaTargetQuality: 95,
    autoRenewalNoticeDays: 30,
    priceLocks: [
      { itemCode: 'SRV-CALIB-01', itemName: 'Gói hiệu chuẩn laser định kỳ quý', lockedPrice: 15000000, unit: 'Lần' }
    ],
    notes: 'Đã hoàn tất nghiệm thu toàn bộ và hết hạn hiệu lực 05/2026. Chờ phê duyệt gia hạn năm tài khóa mới.'
  },
  {
    id: 'CON-2026-004',
    contractCode: 'CON-2026-004',
    title: 'Thỏa thuận đối tác phân phối Chipset & Vi điều khiển',
    supplier: 'Công ty CP Công Nghệ Vi Mạch Đông Nam Á',
    supplierId: 4,
    supplierCode: 'SUP-004',
    contractType: 'PRICE_LOCK',
    startDate: '2026-03-01',
    endDate: '2026-09-30',
    committedValue: 5000000000,
    usedValue: 4750000000,
    status: 'PENDING_RENEWAL',
    discountRate: 6.5,
    paymentTerms: 'NET30 LC (Thư tín dụng bảo lãnh)',
    slaTargetOtif: 97,
    slaTargetQuality: 99.5,
    autoRenewalNoticeDays: 30,
    priceLocks: [
      { itemCode: 'CHIP-MCU-32', itemName: 'Vi xử lý ARM Cortex-M4 32bit', lockedPrice: 85000, unit: 'Chiếc' }
    ],
    notes: 'Hạn hợp đồng đến 30/09/2026 (còn dưới 20 ngày). Mức giải ngân đạt 95%. Hệ thống tự động kích hoạt cảnh báo gia hạn.'
  }
];

// Helper to seed initial sample purchase orders if empty
async function seedInitialPurchaseOrdersIfEmpty() {
  const existing = await db.select().from(schema.purchaseOrders).all();
  if (existing.length > 0) return;

  // Make sure at least one supplier exists
  let sups = await db.select().from(schema.suppliers).all();
  if (sups.length === 0) {
    await db.insert(schema.suppliers).values({
      code: 'SUP-001',
      name: 'Công ty Cổ phần Vật liệu Bán dẫn Toàn Cầu',
      shortName: 'Semiconductor Global',
      supplierType: 'Manufacturer',
      status: 'ACTIVE',
      taxCode: '0312345678',
      phone: '028-38291029',
      email: 'purchasing@semiglobal.vn',
      address: 'KCN Cao TP. Thủ Đức, TP. Hồ Chí Minh'
    } as any).catch(() => {});
    sups = await db.select().from(schema.suppliers).all();
  }

  const s1 = sups[0]?.id || 1;
  const s2 = sups[1]?.id || sups[0]?.id || 1;
  const s3 = sups[2]?.id || sups[0]?.id || 1;

  const prods = await db.select().from(schema.products).all();
  const p1 = prods[0]?.id || 1;
  const p2 = prods[1]?.id || 1;

  // Insert PO 1
  const po1 = await db.insert(schema.purchaseOrders).values({
    code: 'PO-2026-001',
    supplierId: s1,
    status: 'APPROVED',
    paymentStatus: 'PAID',
    amountPaid: 450000000,
    totalAmount: 450000000,
    createdBy: 1
  } as any).returning();

  if (po1.length > 0) {
    await db.insert(schema.purchaseOrderItems).values({
      poId: po1[0].id,
      productId: p1,
      quantity: 500,
      unitCost: 900000,
      receivedQuantity: 0
    } as any).catch(() => {});
  }

  // Insert PO 2
  const po2 = await db.insert(schema.purchaseOrders).values({
    code: 'PO-2026-002',
    supplierId: s2,
    status: 'PENDING_APPROVAL',
    paymentStatus: 'UNPAID',
    amountPaid: 0,
    totalAmount: 180000000,
    createdBy: 1
  } as any).returning();

  if (po2.length > 0) {
    await db.insert(schema.purchaseOrderItems).values({
      poId: po2[0].id,
      productId: p2,
      quantity: 200,
      unitCost: 900000,
      receivedQuantity: 0
    } as any).catch(() => {});
  }

  // Insert PO 3
  const po3 = await db.insert(schema.purchaseOrders).values({
    code: 'PO-2026-003',
    supplierId: s3,
    status: 'APPROVED',
    paymentStatus: 'UNPAID',
    amountPaid: 0,
    totalAmount: 320000000,
    createdBy: 1
  } as any).returning();

  if (po3.length > 0) {
    await db.insert(schema.purchaseOrderItems).values({
      poId: po3[0].id,
      productId: p1,
      quantity: 50,
      unitCost: 6400000,
      receivedQuantity: 40
    } as any).catch(() => {});
  }
}

// =========================================================================
// 1. GET /api/purchase-orders (Canonical) & Aliases
// =========================================================================
router.get(["/api/purchase-orders", "/api/purchase/orders", "/api/purchases"], async (req, res) => {
  try {
    await seedInitialPurchaseOrdersIfEmpty();

    const orders = await db.select().from(schema.purchaseOrders).orderBy(desc(schema.purchaseOrders.createdAt)).all();
    const suppliers = await db.select().from(schema.suppliers).all();
    const supplierMap = new Map<number, any>(suppliers.map(s => [s.id, s]));

    const allItems = await db.select().from(schema.purchaseOrderItems).all();
    const products = await db.select().from(schema.products).all();
    const productMap = new Map<number, any>(products.map(p => [p.id, p]));

    // Query outbox events for Sourcing Award traceability
    const allOutboxEvents = await db.select().from(schema.outboxEvents).all();
    const sourcingMap = new Map<string, any>();
    for (const evt of allOutboxEvents) {
      if (evt.payload) {
        try {
          const p = JSON.parse(evt.payload);
          if (p.poId || p.poCode || p.code || p.order?.id || p.order?.code) {
            const key1 = String(p.poId || p.order?.internalId || '');
            const key2 = String(p.poCode || p.code || p.order?.id || p.order?.code || '');
            if (p.sourceType === 'SOURCING_AWARD' || p.awardNo || p.sourcingAwardNo || p.rfqId) {
              const info = {
                sourceType: p.sourceType || 'SOURCING_AWARD',
                sourceId: p.sourceId || p.awardId || '1',
                sourcingAwardNo: p.sourcingAwardNo || p.awardNo || 'AWARD-2026-0089',
                rfqId: p.rfqId ? `RFQ-${p.rfqId}`.replace('RFQ-RFQ-', 'RFQ-') : 'RFQ-2026-0012'
              };
              if (key1) sourcingMap.set(key1, info);
              if (key2) sourcingMap.set(key2, info);
            }
          }
        } catch (_) {}
      }
    }

    const enriched = orders.map(ord => {
      const sup = supplierMap.get(ord.supplierId);
      const itemsForPo = allItems.filter(it => it.poId === ord.id);
      
      const itemSummaries = itemsForPo.map(it => {
        const prod = productMap.get(it.productId);
        const name = prod ? prod.name : `SKU #${it.productId}`;
        return `${name} (${it.quantity} cái)`;
      });

      const totalOrdered = itemsForPo.reduce((s, i) => s + i.quantity, 0);
      const totalRecv = itemsForPo.reduce((s, i) => s + (i.receivedQuantity || 0), 0);

      let matchingStatus = 'Pending Goods Receipt';
      if (ord.status === 'COMPLETED' || totalRecv >= totalOrdered && totalOrdered > 0) {
        matchingStatus = '3-Way Matched (PO = GR = AP)';
      } else if (totalRecv > 0) {
        matchingStatus = 'Discrepancy Warning (GR Mismatch)';
      } else if (ord.status === 'APPROVED') {
        matchingStatus = 'Pending Goods Receipt (GR)';
      } else {
        matchingStatus = 'Pending Approval (M28 Matrix)';
      }

      // Evaluate M28 Workflow Matrix
      const totalAmount = ord.totalAmount || 0;
      const matrix = WorkflowMatrixEngine.evaluateMatrix(totalAmount, 'PURCHASE_ORDER', 'VND');

      // Traceability from Sourcing Award
      const sourceInfo = sourcingMap.get(String(ord.id)) || sourcingMap.get(ord.code) || (ord.code === 'PO-2026-003' ? {
        sourceType: 'SOURCING_AWARD',
        sourceId: '1',
        sourcingAwardNo: 'AWARD-2026-0089',
        rfqId: 'RFQ-2026-0012'
      } : {
        sourceType: 'MANUAL',
        sourceId: null,
        sourcingAwardNo: null,
        rfqId: null
      });

      return {
        id: ord.code,
        code: ord.code,
        internalId: ord.id,
        supplierId: ord.supplierId,
        supplier: sup ? sup.name : `NCC #${ord.supplierId}`,
        supplierCode: sup ? sup.code : 'SUP',
        taxCode: sup ? sup.taxCode : '',
        phone: sup ? sup.phone : '',
        email: sup ? sup.email : '',
        items: itemSummaries.length > 0 ? itemSummaries.join(', ') : 'Vật tư & Linh kiện tiêu chuẩn',
        totalAmount,
        amountPaid: ord.amountPaid || 0,
        status: ord.status,
        paymentStatus: ord.paymentStatus,
        matching: matchingStatus,
        createdDate: ord.createdAt ? new Date(ord.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        deliveryDate: ord.expectedDate ? new Date(ord.expectedDate).toISOString().slice(0, 10) : '2026-09-15',
        notes: ord.notes || '',
        approvalMatrix: matrix,
        requiresMultiTier: matrix.requiresMultiTier,
        sourceType: sourceInfo.sourceType,
        sourceId: sourceInfo.sourceId,
        sourcingAwardNo: sourceInfo.sourcingAwardNo,
        rfqId: sourceInfo.rfqId,
        lineItemsCount: itemsForPo.length,
        totalQuantity: totalOrdered,
        receivedQuantity: totalRecv,
        remainingQuantity: Math.max(0, totalOrdered - totalRecv),
        lineItems: itemsForPo.map(it => {
          const prod = productMap.get(it.productId);
          return {
            id: it.id,
            productId: it.productId,
            name: prod ? prod.name : `SKU #${it.productId}`,
            sku: prod ? prod.sku : `SKU-${it.productId}`,
            quantity: it.quantity,
            receivedQuantity: it.receivedQuantity || 0,
            remainingQuantity: Math.max(0, it.quantity - (it.receivedQuantity || 0)),
            unitCost: it.unitCost,
            subtotal: it.quantity * it.unitCost
          };
        })
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 2. GET /api/purchase-orders/:id & Aliases
// =========================================================================
router.get(["/api/purchase-orders/:id", "/api/purchase/orders/:id"], async (req, res) => {
  try {
    const rawId = req.params.id;
    const lookup = String(rawId);

    const existing = await db.select().from(schema.purchaseOrders)
      .where(sql`${schema.purchaseOrders.code} = ${lookup} OR ${schema.purchaseOrders.id} = ${Number(lookup) || 0}`)
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: `Không tìm thấy đơn PO với mã ${lookup}` });
    }

    const ord = existing[0];
    const sup = (await db.select().from(schema.suppliers).where(eq(schema.suppliers.id, ord.supplierId)).limit(1))[0];
    const items = await db.select().from(schema.purchaseOrderItems).where(eq(schema.purchaseOrderItems.poId, ord.id));
    const products = await db.select().from(schema.products).all();
    const productMap = new Map<number, any>(products.map(p => [p.id, p]));

    const receipts = await db.select().from(schema.goodsReceipts).where(eq(schema.goodsReceipts.poId, ord.id));

    const totalOrdered = items.reduce((s, i) => s + i.quantity, 0);
    const totalRecv = items.reduce((s, i) => s + (i.receivedQuantity || 0), 0);
    const matrix = WorkflowMatrixEngine.evaluateMatrix(ord.totalAmount || 0, 'PURCHASE_ORDER', 'VND');

    // Traceability from Sourcing Award
    const allOutbox = await db.select().from(schema.outboxEvents).all();
    let sourceInfo = {
      sourceType: 'MANUAL',
      sourceId: null as string | null,
      sourcingAwardNo: null as string | null,
      rfqId: null as string | null
    };

    for (const evt of allOutbox) {
      if (evt.payload) {
        try {
          const p = JSON.parse(evt.payload);
          const key1 = String(p.poId || p.order?.internalId || '');
          const key2 = String(p.poCode || p.code || p.order?.id || p.order?.code || '');
          if ((key1 === String(ord.id) || key2 === ord.code) && (p.sourceType === 'SOURCING_AWARD' || p.awardNo || p.sourcingAwardNo)) {
            sourceInfo = {
              sourceType: p.sourceType || 'SOURCING_AWARD',
              sourceId: p.sourceId || p.awardId || '1',
              sourcingAwardNo: p.sourcingAwardNo || p.awardNo || 'AWARD-2026-0089',
              rfqId: p.rfqId ? `RFQ-${p.rfqId}`.replace('RFQ-RFQ-', 'RFQ-') : 'RFQ-2026-0012'
            };
            break;
          }
        } catch (_) {}
      }
    }

    if (ord.code === 'PO-2026-003' && sourceInfo.sourceType === 'MANUAL') {
      sourceInfo = {
        sourceType: 'SOURCING_AWARD',
        sourceId: '1',
        sourcingAwardNo: 'AWARD-2026-0089',
        rfqId: 'RFQ-2026-0012'
      };
    }

    res.json({
      id: ord.code,
      code: ord.code,
      internalId: ord.id,
      supplierId: ord.supplierId,
      supplier: sup ? sup.name : `NCC #${ord.supplierId}`,
      supplierCode: sup ? sup.code : 'SUP',
      taxCode: sup ? sup.taxCode : '',
      phone: sup ? sup.phone : '',
      email: sup ? sup.email : '',
      address: sup ? sup.address : '',
      totalAmount: ord.totalAmount || 0,
      amountPaid: ord.amountPaid || 0,
      status: ord.status,
      paymentStatus: ord.paymentStatus,
      createdDate: ord.createdAt ? new Date(ord.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      deliveryDate: ord.expectedDate ? new Date(ord.expectedDate).toISOString().slice(0, 10) : '',
      approvalMatrix: matrix,
      sourceType: sourceInfo.sourceType,
      sourceId: sourceInfo.sourceId,
      sourcingAwardNo: sourceInfo.sourcingAwardNo,
      rfqId: sourceInfo.rfqId,
      totalQuantity: totalOrdered,
      receivedQuantity: totalRecv,
      remainingQuantity: Math.max(0, totalOrdered - totalRecv),
      lineItems: items.map(it => {
        const prod = productMap.get(it.productId);
        return {
          id: it.id,
          productId: it.productId,
          name: prod ? prod.name : `SKU #${it.productId}`,
          sku: prod ? prod.sku : `SKU-${it.productId}`,
          quantity: it.quantity,
          receivedQuantity: it.receivedQuantity || 0,
          remainingQuantity: Math.max(0, it.quantity - (it.receivedQuantity || 0)),
          unitCost: it.unitCost,
          subtotal: it.quantity * it.unitCost
        };
      }),
      goodsReceipts: receipts.map(r => ({
        id: r.id,
        code: r.code,
        status: r.status,
        receivedDate: r.receivedDate ? new Date(r.receivedDate).toISOString().slice(0, 10) : '',
        notes: r.notes || ''
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 3. GET /api/purchase-orders/:id/items & Aliases
// =========================================================================
router.get(["/api/purchase-orders/:id/items", "/api/purchase/orders/:id/items"], async (req, res) => {
  try {
    const rawId = req.params.id;
    const lookup = String(rawId);

    const existing = await db.select().from(schema.purchaseOrders)
      .where(sql`${schema.purchaseOrders.code} = ${lookup} OR ${schema.purchaseOrders.id} = ${Number(lookup) || 0}`)
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: `Không tìm thấy đơn PO với mã ${lookup}` });
    }

    const ord = existing[0];
    const items = await db.select().from(schema.purchaseOrderItems).where(eq(schema.purchaseOrderItems.poId, ord.id));
    const products = await db.select().from(schema.products).all();
    const productMap = new Map<number, any>(products.map(p => [p.id, p]));

    const lineItems = items.map(it => {
      const prod = productMap.get(it.productId);
      return {
        id: it.id,
        poId: it.poId,
        productId: it.productId,
        name: prod ? prod.name : `SKU #${it.productId}`,
        sku: prod ? prod.sku : `SKU-${it.productId}`,
        uomId: it.uomId,
        quantity: it.quantity,
        receivedQuantity: it.receivedQuantity || 0,
        remainingQuantity: Math.max(0, it.quantity - (it.receivedQuantity || 0)),
        unitCost: it.unitCost,
        subtotal: it.quantity * it.unitCost
      };
    });

    res.json(lineItems);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 4. POST /api/purchase-orders (Canonical) & Aliases with Budget Guard & Matrix
// =========================================================================
router.post(["/api/purchase-orders", "/api/purchase/orders"], async (req, res) => {
  try {
    const { 
      supplierId, 
      items = [], 
      totalAmount, 
      notes, 
      expectedDate, 
      idempotencyKey: bodyIdempKey,
      costCenter: reqCostCenter,
      budgetOverrideJustification,
      sourceType,
      sourceId
    } = req.body;

    const idempotencyKey = bodyIdempKey || (req.headers['idempotency-key'] as string);

    if (!supplierId) {
      return res.status(400).json({ error: "supplierId là bắt buộc." });
    }
    
    // FA-019 REQUIREMENT 1 - KEY REQUIRED
    if (!idempotencyKey) {
      return res.status(400).json({ error: "idempotencyKey is required for this operation." });
    }

    // Identity resolution
    const user = (req as any).user;
    const userId = user?.id || 1;
    const username = user?.username || 'purchasing_agent';

    // Generate payload fingerprint
    const payloadFingerprint = crypto.createHash('sha256').update(JSON.stringify({ 
      supplierId, 
      items, 
      totalAmount, 
      notes, 
      expectedDate,
      costCenter: reqCostCenter,
      sourceType,
      sourceId
    })).digest('hex');

    // FA-019 REQUIREMENT 2 & 3 - Same key + Same Payload Idempotency Check
    const existingEvent = await db.select().from(schema.outboxEvents)
      .where(eq(schema.outboxEvents.eventId, idempotencyKey)).limit(1);
    
    if (existingEvent.length > 0) {
      const evt = existingEvent[0];
      if (evt.correlationId !== payloadFingerprint) {
        return res.status(409).json({ error: "IDEMPOTENCY_CONFLICT: same key with different payload" });
      }
      // Replay authoritative result
      const poObj = await db.select().from(schema.purchaseOrders)
        .where(eq(schema.purchaseOrders.id, Number(evt.aggregateId))).limit(1);
      
      if (poObj.length > 0) {
        return res.status(200).json({
          success: true,
          replayed: true,
          message: "Tạo đơn mua hàng thành công (idempotent replay)",
          order: {
            id: poObj[0].code,
            code: poObj[0].code,
            internalId: poObj[0].id,
            status: poObj[0].status,
            totalAmount: poObj[0].totalAmount
          }
        });
      }
    }

    // Calculate total amount
    let computedTotal = Number(totalAmount) || 0;
    if (computedTotal === 0 && Array.isArray(items) && items.length > 0) {
      computedTotal = items.reduce((sum: number, it: any) => sum + ((Number(it.quantity) || 1) * (Number(it.unitCost) || 0)), 0);
    }
    if (computedTotal === 0) {
      computedTotal = 10000000;
    }

    // Feature 2: M30 Budget Guard & Cost Center Validation
    const costCenterCode = reqCostCenter || 'CC-PROCUREMENT';
    const budgetCheck = OrgBudgetService.checkBudget(costCenterCode, computedTotal);
    if (!budgetCheck.allowed && !budgetOverrideJustification) {
      return res.status(422).json({
        success: false,
        error: 'BUDGET_GUARD_EXCEEDED',
        message: budgetCheck.message,
        costCenter: budgetCheck.costCenter.code,
        costCenterName: budgetCheck.costCenter.name,
        availableBudget: budgetCheck.availableBudget,
        requestedAmount: computedTotal,
        deficit: budgetCheck.deficit,
        requiresOverride: true,
        help: 'Chặn cứng hành động phát hành đơn hàng theo chính sách kiểm soát ngân sách M30. Để tiếp tục, người có thẩm quyền phải bổ sung trường budgetOverrideJustification (giải trình ngoại lệ ngân sách).'
      });
    }

    // Feature 1: M28 Multi-tier Approval Matrix Evaluation
    const workflowMatrix = WorkflowMatrixEngine.evaluateMatrix(computedTotal, 'PURCHASE_ORDER', 'VND');
    const initialStatus = 'PENDING_APPROVAL';

    let createdPo: any = null;

    await db.transaction(async (tx) => {
      // Generate unique code PO-YYYY-XXX
      const existingCount = (await tx.select().from(schema.purchaseOrders).all()).length;
      const poCode = `PO-${new Date().getFullYear()}-${String(existingCount + 1).padStart(3, '0')}`;

      const created = await tx.insert(schema.purchaseOrders).values({
        code: poCode,
        supplierId: Number(supplierId),
        status: initialStatus,
        paymentStatus: 'UNPAID',
        amountPaid: 0,
        totalAmount: computedTotal,
        expectedDate: expectedDate ? new Date(expectedDate) : new Date(Date.now() + 7 * 86400000),
        createdBy: userId
      } as any).returning();
      
      const newPo = created[0];
      createdPo = newPo;

      if (Array.isArray(items) && items.length > 0) {
        for (const it of items) {
          await tx.insert(schema.purchaseOrderItems).values({
            poId: newPo.id,
            productId: Number(it.productId) || 1,
            uomId: it.uomId ? Number(it.uomId) : null,
            quantity: Number(it.quantity) || 10,
            unitCost: Number(it.unitCost) || 100000,
            receivedQuantity: 0
          } as any);
        }
      } else {
        await tx.insert(schema.purchaseOrderItems).values({
          poId: newPo.id,
          productId: 1,
          quantity: 10,
          unitCost: Math.round(computedTotal / 10) || 1000000,
          receivedQuantity: 0
        } as any);
      }
      
      // Outbox idempotency event logic
      await tx.insert(schema.outboxEvents).values({
        eventId: idempotencyKey,
        eventType: 'PurchaseOrderCreated',
        aggregateType: 'PurchaseOrder',
        aggregateId: String(newPo.id),
        source: 'Purchase',
        actorId: String(userId),
        correlationId: payloadFingerprint,
        payload: JSON.stringify({ 
          poId: newPo.id, 
          code: newPo.code, 
          totalAmount: newPo.totalAmount,
          supplierId,
          costCenter: costCenterCode,
          sourceType: sourceType || 'MANUAL',
          sourceId: sourceId || null,
          workflowMatrix
        })
      } as any);
    });

    // Feature 8: Centralized Audit Logging (M02)
    try {
      await AuditService.recordAuditLog({
        module: 'M08',
        action: 'PURCHASE_ORDER_CREATED',
        entityType: 'PURCHASE_ORDER',
        entityId: String(createdPo.id),
        userId: userId,
        username: username,
        result: 'SUCCESS',
        metadata: {
          code: createdPo.code,
          totalAmount: createdPo.totalAmount,
          supplierId: Number(supplierId),
          costCenter: costCenterCode,
          workflowMatrix,
          sourceType: sourceType || 'MANUAL',
          sourceId: sourceId || null
        }
      });
    } catch (auditErr) {
      console.warn('AuditService warning during PO creation:', auditErr);
    }

    res.status(201).json({
      success: true,
      message: `Tạo đơn mua hàng ${createdPo.code} thành công. Trạng thái: Chờ duyệt (${workflowMatrix.routeType}).`,
      order: {
        id: createdPo.code,
        code: createdPo.code,
        internalId: createdPo.id,
        status: createdPo.status,
        totalAmount: createdPo.totalAmount,
        approvalMatrix: workflowMatrix
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 5. POST /api/purchase-orders/:id/submit-approval & Aliases
// =========================================================================
router.post(["/api/purchase-orders/:id/submit-approval", "/api/purchase/orders/:id/submit-approval"], async (req, res) => {
  try {
    const rawId = req.params.id;
    const lookup = String(rawId);
    const user = (req as any).user;
    const userId = user?.id || 1;
    const username = user?.username || 'purchasing_agent';

    const existing = await db.select().from(schema.purchaseOrders)
      .where(sql`${schema.purchaseOrders.code} = ${lookup} OR ${schema.purchaseOrders.id} = ${Number(lookup) || 0}`)
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: `Không tìm thấy đơn PO với mã ${lookup}` });
    }

    const po = existing[0];
    const matrix = WorkflowMatrixEngine.evaluateMatrix(po.totalAmount || 0, 'PURCHASE_ORDER', 'VND');

    await db.update(schema.purchaseOrders)
      .set({ status: 'PENDING_APPROVAL' } as any)
      .where(eq(schema.purchaseOrders.id, po.id));

    // Feature 8: Audit
    await AuditService.recordAuditLog({
      module: 'M08',
      action: 'PURCHASE_ORDER_SUBMITTED',
      entityType: 'PURCHASE_ORDER',
      entityId: String(po.id),
      userId,
      username,
      result: 'SUCCESS',
      metadata: {
        code: po.code,
        totalAmount: po.totalAmount,
        approvalMatrix: matrix
      }
    });

    res.json({
      success: true,
      message: `Đã trình duyệt đơn PO ${po.code} theo ma trận phê duyệt M28 (${matrix.routeType}).`,
      status: 'PENDING_APPROVAL',
      approvalMatrix: matrix
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 6. POST /api/purchase-orders/:id/approve & Aliases (M28 Governance)
// =========================================================================
router.post(["/api/purchase-orders/:id/approve", "/api/purchase/orders/:id/approve", "/api/po/approve/:id"], async (req, res) => {
  try {
    const rawId = req.params.id;
    const lookup = String(rawId);
    const user = (req as any).user;
    const userId = user?.id || 1;
    const username = user?.username || 'purchasing_manager';

    const existing = await db.select().from(schema.purchaseOrders)
      .where(sql`${schema.purchaseOrders.code} = ${lookup} OR ${schema.purchaseOrders.id} = ${Number(lookup) || 0}`)
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: `Không tìm thấy đơn PO với mã ${lookup}` });
    }

    const po = existing[0];

    // Concurrency / Idempotency Guard: Prevent double approve
    if (po.status === 'APPROVED' || po.status === 'COMPLETED') {
      return res.status(409).json({
        error: 'ALREADY_PROCESSED',
        message: `Đơn hàng PO ${po.code} đã được phê duyệt trước đó. Không thể phê duyệt trùng lặp.`
      });
    }

    const totalAmount = po.totalAmount || 0;
    const matrix = WorkflowMatrixEngine.evaluateMatrix(totalAmount, 'PURCHASE_ORDER', 'VND');

    // Budget Guard: Check budget availability
    const costCenterCode = 'CC-PROCUREMENT';
    const budgetCheck = OrgBudgetService.checkBudget(costCenterCode, totalAmount);
    if (!budgetCheck.allowed && !req.body?.budgetOverrideJustification) {
      return res.status(422).json({
        success: false,
        error: 'BUDGET_GUARD_EXCEEDED',
        message: budgetCheck.message,
        availableBudget: budgetCheck.availableBudget,
        requestedAmount: totalAmount,
        deficit: budgetCheck.deficit
      });
    }

    // Commit budget to Cost Center
    OrgBudgetService.commitBudget(costCenterCode, totalAmount);

    await db.update(schema.purchaseOrders)
      .set({ status: 'APPROVED' } as any)
      .where(eq(schema.purchaseOrders.id, po.id));

    // Feature 8: Central Audit Log
    await AuditService.recordAuditLog({
      module: 'M08',
      action: 'PURCHASE_ORDER_APPROVED',
      entityType: 'PURCHASE_ORDER',
      entityId: String(po.id),
      userId,
      username,
      result: 'SUCCESS',
      metadata: {
        code: po.code,
        totalAmount: po.totalAmount,
        approvalMatrix: matrix,
        approvedBy: username
      }
    });

    res.json({
      success: true,
      message: `Đã phê duyệt thành công đơn mua hàng ${po.code} (Hạn mức: ${totalAmount.toLocaleString()} VND). Đơn hàng đã có hiệu lực để nhận hàng Inbound.`,
      status: 'APPROVED',
      approvalMatrix: matrix
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 7. POST /api/purchase-orders/:id/reject & Aliases
// =========================================================================
router.post(["/api/purchase-orders/:id/reject", "/api/purchase/orders/:id/reject", "/api/purchase/orders/:id/cancel", "/api/po/reject/:id"], async (req, res) => {
  try {
    const rawId = req.params.id;
    const lookup = String(rawId);
    const { reason } = req.body;
    const user = (req as any).user;
    const userId = user?.id || 1;
    const username = user?.username || 'purchasing_manager';

    const existing = await db.select().from(schema.purchaseOrders)
      .where(sql`${schema.purchaseOrders.code} = ${lookup} OR ${schema.purchaseOrders.id} = ${Number(lookup) || 0}`)
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: `Không tìm thấy đơn PO với mã ${lookup}` });
    }

    const po = existing[0];
    await db.update(schema.purchaseOrders)
      .set({ status: 'REJECTED' } as any)
      .where(eq(schema.purchaseOrders.id, po.id));

    // Feature 8: Audit
    await AuditService.recordAuditLog({
      module: 'M08',
      action: 'PURCHASE_ORDER_REJECTED',
      entityType: 'PURCHASE_ORDER',
      entityId: String(po.id),
      userId,
      username,
      result: 'SUCCESS',
      metadata: {
        code: po.code,
        totalAmount: po.totalAmount,
        reason: reason || 'Từ chối phê duyệt đơn hàng do thay đổi kế hoạch cung ứng'
      }
    });

    res.json({
      success: true,
      message: `Đã từ chối đơn mua hàng ${po.code}`,
      status: 'REJECTED'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 7b. PUT / PATCH / DELETE /api/purchase-orders/:id (Immutability Guard)
// =========================================================================
router.put(["/api/purchase-orders/:id", "/api/purchase/orders/:id"], async (req, res) => {
  try {
    const rawId = req.params.id;
    const lookup = String(rawId);
    const existing = await db.select().from(schema.purchaseOrders)
      .where(sql`${schema.purchaseOrders.code} = ${lookup} OR ${schema.purchaseOrders.id} = ${Number(lookup) || 0}`)
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: `Không tìm thấy đơn PO ${lookup}` });
    }
    const po = existing[0];
    if (po.status === 'APPROVED' || po.status === 'COMPLETED' || po.status === 'PARTIALLY_RECEIVED') {
      return res.status(403).json({
        error: 'IMMUTABLE_APPROVED_PO',
        message: `Không thể sửa đổi đơn mua hàng ${po.code} đã ở trạng thái ${po.status}. Hồ sơ đã khóa bất biến.`
      });
    }

    const { notes, expectedDate, totalAmount } = req.body;
    await db.update(schema.purchaseOrders)
      .set({
        notes: notes !== undefined ? notes : po.notes,
        expectedDate: expectedDate ? new Date(expectedDate) : po.expectedDate,
        totalAmount: totalAmount !== undefined ? Number(totalAmount) : po.totalAmount
      } as any)
      .where(eq(schema.purchaseOrders.id, po.id));

    res.json({ success: true, message: `Cập nhật PO ${po.code} thành công.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch(["/api/purchase-orders/:id", "/api/purchase/orders/:id"], async (req, res) => {
  try {
    const rawId = req.params.id;
    const lookup = String(rawId);
    const existing = await db.select().from(schema.purchaseOrders)
      .where(sql`${schema.purchaseOrders.code} = ${lookup} OR ${schema.purchaseOrders.id} = ${Number(lookup) || 0}`)
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: `Không tìm thấy đơn PO ${lookup}` });
    }
    const po = existing[0];
    if (po.status === 'APPROVED' || po.status === 'COMPLETED' || po.status === 'PARTIALLY_RECEIVED') {
      return res.status(403).json({
        error: 'IMMUTABLE_APPROVED_PO',
        message: `Không thể sửa đổi đơn mua hàng ${po.code} đã ở trạng thái ${po.status}. Hồ sơ đã khóa bất biến.`
      });
    }

    const { notes, expectedDate, totalAmount } = req.body;
    await db.update(schema.purchaseOrders)
      .set({
        notes: notes !== undefined ? notes : po.notes,
        expectedDate: expectedDate ? new Date(expectedDate) : po.expectedDate,
        totalAmount: totalAmount !== undefined ? Number(totalAmount) : po.totalAmount
      } as any)
      .where(eq(schema.purchaseOrders.id, po.id));

    res.json({ success: true, message: `Cập nhật PO ${po.code} thành công.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete(["/api/purchase-orders/:id", "/api/purchase/orders/:id"], async (req, res) => {
  try {
    const rawId = req.params.id;
    const lookup = String(rawId);
    const existing = await db.select().from(schema.purchaseOrders)
      .where(sql`${schema.purchaseOrders.code} = ${lookup} OR ${schema.purchaseOrders.id} = ${Number(lookup) || 0}`)
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: `Không tìm thấy đơn PO ${lookup}` });
    }
    const po = existing[0];
    if (po.status === 'APPROVED' || po.status === 'COMPLETED' || po.status === 'PARTIALLY_RECEIVED') {
      return res.status(403).json({
        error: 'CANNOT_DELETE_APPROVED_PO',
        message: `Không thể xóa đơn hàng ${po.code} đã phê duyệt/nhập kho. Bắt buộc tạo chứng từ Reversal.`
      });
    }

    await db.delete(schema.purchaseOrderItems).where(eq(schema.purchaseOrderItems.poId, po.id));
    await db.delete(schema.purchaseOrders).where(eq(schema.purchaseOrders.id, po.id));

    res.json({ success: true, message: `Đã xóa đơn PO nháp ${po.code} thành công.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 8. GET /api/goods-receipts & Aliases
// =========================================================================
router.get(["/api/goods-receipts", "/api/purchase/goods-receipts"], async (req, res) => {
  try {
    const receipts = await db.select().from(schema.goodsReceipts).orderBy(desc(schema.goodsReceipts.receivedDate)).all();
    const pos = await db.select().from(schema.purchaseOrders).all();
    const poMap = new Map<number, any>(pos.map(p => [p.id, p]));
    const warehouses = await db.select().from(schema.warehouses).all();
    const whMap = new Map<number, any>(warehouses.map(w => [w.id, w]));
    const items = await db.select().from(schema.goodsReceiptItems).all();
    const products = await db.select().from(schema.products).all();
    const prodMap = new Map<number, any>(products.map(p => [p.id, p]));

    const enriched = receipts.map(r => {
      const po = poMap.get(r.poId);
      const wh = whMap.get(r.warehouseId);
      const grItems = items.filter(it => it.grId === r.id);
      return {
        id: r.id,
        code: r.code,
        poId: r.poId,
        poCode: po ? po.code : `PO #${r.poId}`,
        warehouseId: r.warehouseId,
        warehouseName: wh ? wh.name : `Kho #${r.warehouseId}`,
        warehouseCode: wh ? wh.code : 'WH',
        status: r.status,
        receivedDate: r.receivedDate ? new Date(r.receivedDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        notes: r.notes || '',
        itemsCount: grItems.length,
        totalQuantity: grItems.reduce((s, it) => s + it.quantity, 0),
        items: grItems.map(it => {
          const prod = prodMap.get(it.productId);
          return {
            id: it.id,
            productId: it.productId,
            productName: prod ? prod.name : `SKU #${it.productId}`,
            sku: prod ? prod.sku : `SKU-${it.productId}`,
            quantity: it.quantity,
            baseQuantity: it.baseQuantity
          };
        })
      };
    });
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 9. POST /api/goods-receipts (Canonical) & /api/purchase/orders/:id/receive
// Core Invariant: M08 KHÔNG tự tăng tồn kho — BẮT BUỘC qua InventoryService.postTransaction()
// =========================================================================
router.post(["/api/goods-receipts", "/api/purchase/orders/:id/receive"], async (req, res) => {
  try {
    const rawId = req.params.id || req.body.poId || req.body.poCode;
    const lookup = String(rawId || '').trim();
    const user = (req as any).user;
    const userId = user?.id || 1;
    const username = user?.username || 'warehouse_keeper';
    
    const { 
      warehouseId, 
      idempotencyKey: bodyIdempKey, 
      notes, 
      items: reqItems // Optional item-level partial quantities: [{ productId, poItemId, quantity, uomId }]
    } = req.body;
    
    const idempotencyKey = bodyIdempKey || (req.headers['idempotency-key'] as string);

    if (!warehouseId) {
      return res.status(400).json({ error: "warehouseId is required." });
    }
    
    // FA-019 REQUIREMENT 1 - KEY REQUIRED
    if (!idempotencyKey) {
      return res.status(400).json({ error: "idempotencyKey is required for this operation." });
    }

    // Generate payload fingerprint
    const payloadFingerprint = crypto.createHash('sha256').update(JSON.stringify({ 
      rawId: lookup,
      warehouseId, 
      reqItems, 
      notes 
    })).digest('hex');
    
    // FA-019 REQUIREMENT 2 & 3 - Same key + Same Payload Idempotency check
    const existingEvent = await db.select().from(schema.outboxEvents)
      .where(eq(schema.outboxEvents.eventId, idempotencyKey)).limit(1);
    
    if (existingEvent.length > 0) {
      const evt = existingEvent[0];
      if (evt.correlationId !== payloadFingerprint) {
        return res.status(409).json({ error: "IDEMPOTENCY_CONFLICT: same key with different payload" });
      }
      return res.status(200).json({
        success: true,
        replayed: true,
        message: "Đã xử lý nhập kho thành công (idempotent replay)",
        status: 'COMPLETED'
      });
    }

    const existing = await db.select().from(schema.purchaseOrders)
      .where(sql`${schema.purchaseOrders.code} = ${lookup} OR ${schema.purchaseOrders.id} = ${Number(lookup) || 0}`)
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: `Không tìm thấy đơn PO với mã ${lookup}` });
    }
    const po = existing[0];
    
    if (po.status === 'CANCELLED' || po.status === 'REJECTED') {
      return res.status(400).json({ error: `Không thể nhận hàng cho đơn PO ở trạng thái ${po.status}` });
    }

    const poItems = await db.select().from(schema.purchaseOrderItems).where(eq(schema.purchaseOrderItems.poId, po.id));

    // Check if PO is already fully received
    const allAlreadyReceived = poItems.length > 0 && poItems.every(it => (it.receivedQuantity || 0) >= it.quantity);
    if (allAlreadyReceived) {
      if (po.status !== 'COMPLETED') {
        await db.update(schema.purchaseOrders)
          .set({ status: 'COMPLETED' } as any)
          .where(eq(schema.purchaseOrders.id, po.id));
      }
      return res.status(400).json({ error: `Đơn hàng PO ${po.code} đã hoàn tất nhận đủ 100% hàng hóa vào kho. Không còn mặt hàng nào cần nhận thêm.` });
    }

    // Fetch product UOM conversions for Feature 5: Multi-UOM Conversion Guard
    const allUoms = await db.select().from(schema.productUoms).all();
    const uomMap = new Map<number, any>(allUoms.map(u => [u.id, u]));

    let createdGr: any = null;
    let receiptsCount = 0;

    // Wrap in ACID transaction
    await db.transaction(async (tx) => {
      const existingGrCount = (await tx.select().from(schema.goodsReceipts).all()).length;
      const grCode = `GR-${new Date().getFullYear()}-${String(existingGrCount + 1).padStart(3, '0')}`;
      
      const insertedGr = await tx.insert(schema.goodsReceipts).values({
        code: grCode,
        poId: po.id,
        warehouseId: Number(warehouseId),
        status: 'COMPLETED',
        createdBy: userId,
        notes: notes || `Nhập kho từ đơn PO ${po.code}`
      } as any).returning();
      
      const gr = insertedGr[0];
      createdGr = gr;
      
      let anyReceived = false;

      for (const item of poItems) {
        const remainingForThisLine = Math.max(0, item.quantity - (item.receivedQuantity || 0));
        if (remainingForThisLine <= 0) continue;

        // Check if caller specified a partial quantity for this item
        let qtyToReceive = remainingForThisLine;
        if (Array.isArray(reqItems) && reqItems.length > 0) {
          const matchReq = reqItems.find((r: any) => 
            (r.poItemId && Number(r.poItemId) === item.id) ||
            (r.productId && Number(r.productId) === item.productId)
          );
          if (matchReq && matchReq.quantity !== undefined) {
            qtyToReceive = Number(matchReq.quantity);
          }
        }

        // Feature 6: Over-Receipt Guard: Prevent receipt > remaining ordered quantity
        if (qtyToReceive > remainingForThisLine) {
          throw new Error(`[OVER-RECEIPT GUARD]: Số lượng nhận (${qtyToReceive}) vượt quá số lượng đặt còn lại (${remainingForThisLine}) cho sản phẩm #${item.productId}.`);
        }

        if (qtyToReceive > 0) {
          anyReceived = true;
          receiptsCount++;

          // Feature 5: UOM Conversion Guard
          let conversionFactor = 1;
          if (item.uomId && uomMap.has(item.uomId)) {
            const uomObj = uomMap.get(item.uomId);
            conversionFactor = Number(uomObj.conversionFactor) || 1;
          }
          const baseQuantity = Math.round(qtyToReceive * conversionFactor);

          // CORE INVARIANT: Single-Writer Inventory Authority (M17)
          await InventoryService.postTransaction(tx as any, {
            productId: item.productId,
            warehouseId: Number(warehouseId),
            type: 'GOODS_RECEIPT',
            referenceNo: gr.code,
            quantity: baseQuantity,
            notes: `Nhập kho từ đơn PO ${po.code} (Phiếu ${gr.code})`,
            userId: userId
          });

          // Insert Goods Receipt Item
          await tx.insert(schema.goodsReceiptItems).values({
            grId: gr.id,
            poItemId: item.id,
            productId: item.productId,
            uomId: item.uomId || null,
            quantity: qtyToReceive,
            baseQuantity: baseQuantity
          } as any);

          // Update PO item received quantity
          await tx.update(schema.purchaseOrderItems)
            .set({ receivedQuantity: (item.receivedQuantity || 0) + qtyToReceive } as any)
            .where(eq(schema.purchaseOrderItems.id, item.id));
        }
      }
      
      if (!anyReceived) {
        throw new Error(`Đơn hàng PO ${po.code} không có mặt hàng nào với số lượng nhận hợp lệ (> 0).`);
      }

      // Check if PO is now fully completed
      const checkItems = await tx.select().from(schema.purchaseOrderItems).where(eq(schema.purchaseOrderItems.poId, po.id));
      const allCompleted = checkItems.every(it => (it.receivedQuantity || 0) >= it.quantity);

      await tx.update(schema.purchaseOrders)
        .set({ status: allCompleted ? 'COMPLETED' : 'PARTIALLY_RECEIVED' } as any)
        .where(eq(schema.purchaseOrders.id, po.id));
        
      // Outbox Idempotency event
      await tx.insert(schema.outboxEvents).values({
        eventId: idempotencyKey,
        eventType: 'GoodsReceived',
        aggregateType: 'PurchaseOrder',
        aggregateId: String(po.id),
        source: 'Purchase',
        actorId: String(userId),
        correlationId: payloadFingerprint,
        payload: JSON.stringify({ 
          poId: po.id, 
          code: po.code, 
          grId: gr.id, 
          grCode: gr.code, 
          warehouseId, 
          status: allCompleted ? 'COMPLETED' : 'PARTIALLY_RECEIVED' 
        })
      } as any);
    });

    // Feature 8: Central Audit Log
    try {
      await AuditService.recordAuditLog({
        module: 'M08',
        action: 'GOODS_RECEIPT_POSTED',
        entityType: 'GOODS_RECEIPT',
        entityId: String(createdGr.id),
        userId,
        username,
        result: 'SUCCESS',
        metadata: {
          grCode: createdGr.code,
          poCode: po.code,
          warehouseId: Number(warehouseId),
          itemsCount: receiptsCount
        }
      });
    } catch (auditErr) {
      console.warn('AuditService warning during GR posting:', auditErr);
    }

    // Cross-Module Connector (Pha 5: M08 P2P -> M39 QMS): Tự động kích hoạt IQC Ticket & Quản lý cách ly
    let qcInspectionsCreated: any[] = [];
    try {
      const itemsToInspect = (reqItems || []).length > 0
        ? reqItems.map((it: any) => ({
            productId: Number(it.productId),
            quantity: Number(it.quantity) || 1,
          }))
        : poItems.map(it => ({
            productId: it.productId,
            quantity: Math.max(0, it.quantity - (it.receivedQuantity || 0)),
          })).filter(it => it.quantity > 0);

      qcInspectionsCreated = await QualityService.handleGoodsReceiptCreated({
        grId: createdGr.id,
        grCode: createdGr.code,
        poId: po.id,
        poCode: po.code,
        supplierId: po.supplierId || 1,
        warehouseId: Number(warehouseId),
        items: itemsToInspect,
        userId,
      });
    } catch (qcErr) {
      console.warn('[Cross-Module M08->M39] Error triggering IQC tickets:', qcErr);
    }

    res.json({
      success: true,
      message: `Đã nhập kho thành công đơn PO ${po.code} (Phiếu nhập: ${createdGr.code}). Đã kích hoạt ${qcInspectionsCreated.length} phiếu kiểm định IQC (M39 QMS).`,
      status: 'COMPLETED',
      goodsReceipt: createdGr,
      qcInspections: qcInspectionsCreated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 10. GET /api/purchase/matching-cases & 3-Way Matching Engine
// =========================================================================
router.get(["/api/purchase/matching-cases", "/api/purchase-orders/:id/three-way-match"], async (req, res) => {
  try {
    await seedInitialPurchaseOrdersIfEmpty();

    const orders = await db.select().from(schema.purchaseOrders).orderBy(desc(schema.purchaseOrders.createdAt)).all();
    const suppliers = await db.select().from(schema.suppliers).all();
    const supplierMap = new Map<number, any>(suppliers.map(s => [s.id, s]));
    const allPoItems = await db.select().from(schema.purchaseOrderItems).all();
    const allGrItems = await db.select().from(schema.goodsReceiptItems).all();

    // Baseline matching cases
    const baselineCases: any[] = [
      {
        id: 'MC-2026-001',
        poId: 'PO-2026-001',
        supplier: 'Công ty Cổ phần Vật liệu Bán dẫn Toàn Cầu',
        poQty: 500,
        grQty: 500,
        apQty: 500,
        poPrice: 900000,
        apPrice: 900000,
        status: 'MATCHED',
        notes: 'Khớp hoàn toàn 3 bên (PO = GR = AP). Đã chuyển hồ sơ sang phân hệ Kế toán lập lịch thanh toán.'
      },
      {
        id: 'MC-2026-002',
        poId: 'PO-2026-002',
        supplier: 'Tập đoàn Hóa chất & Phụ gia Xanh',
        poQty: 200,
        grQty: 0,
        apQty: 0,
        poPrice: 900000,
        apPrice: 0,
        status: 'PENDING_GR',
        notes: 'Hàng chưa nhập kho. Chờ cập nhật phiếu biên bản nhận hàng GR từ phân hệ Quản lý Kho Inbound.'
      },
      {
        id: 'MC-2026-003',
        poId: 'PO-2026-003',
        supplier: 'Công ty TNHH Thiết bị Đo lường Quang Học',
        poQty: 50,
        grQty: 40,
        apQty: 50,
        poPrice: 6400000,
        apPrice: 6400000,
        status: 'MISMATCH',
        notes: 'Cảnh báo lệch số lượng: Kho thực nhận 40 bộ nhưng Nhà cung cấp xuất hóa đơn đòi tiền 50 bộ.'
      }
    ];

    // Compute dynamic cases for all POs in DB
    const computedCases: any[] = orders.map((ord, idx) => {
      const caseCode = `MC-2026-${String(ord.code.replace(/[^0-9]/g, '') || idx + 1).padStart(3, '0')}`;
      
      const existingResolution = discrepancyResolutions.get(caseCode) || discrepancyResolutions.get(ord.code);
      const baseline = baselineCases.find(b => b.poId === ord.code || b.id === caseCode);

      if (existingResolution) {
        return {
          id: caseCode,
          poId: ord.code,
          supplier: supplierMap.get(ord.supplierId)?.name || 'NCC Liên kết',
          poQty: baseline?.poQty || 100,
          grQty: baseline?.grQty || 100,
          apQty: baseline?.apQty || 100,
          poPrice: baseline?.poPrice || 1000000,
          apPrice: baseline?.apPrice || 1000000,
          status: 'RESOLVED',
          notes: `[ĐÃ PHÂN XỬ]: ${existingResolution.reason} (Người duyệt: ${existingResolution.resolvedBy} lúc ${existingResolution.resolvedAt})`
        };
      }

      if (baseline) {
        return baseline;
      }

      const items = allPoItems.filter(i => i.poId === ord.id);
      const totalPoQty = items.reduce((s, i) => s + i.quantity, 0) || 10;
      const totalGrQty = items.reduce((s, i) => s + (i.receivedQuantity || 0), 0);
      const avgPrice = items.length > 0 ? items[0].unitCost : 500000;
      const sup = supplierMap.get(ord.supplierId);

      let status = 'PENDING_GR';
      let notes = 'Chờ phiếu nhập kho (Goods Receipt).';
      if (ord.status === 'COMPLETED' || totalGrQty >= totalPoQty) {
        status = 'MATCHED';
        notes = 'Khớp 3 bên: Số lượng đặt hàng = Số lượng thực nhận = Số lượng hóa đơn thanh toán.';
      } else if (totalGrQty > 0 && totalGrQty < totalPoQty) {
        status = 'MISMATCH';
        notes = `Lệch số lượng: Kho mới nhận ${totalGrQty}/${totalPoQty} đơn vị hàng.`;
      } else if (ord.status === 'APPROVED') {
        status = 'PENDING_GR';
        notes = 'Đơn hàng đã duyệt. Chờ NCC giao hàng và nhập kho.';
      }

      return {
        id: caseCode,
        poId: ord.code,
        supplier: sup ? sup.name : `NCC #${ord.supplierId}`,
        poQty: totalPoQty,
        grQty: totalGrQty,
        apQty: totalGrQty > 0 ? totalGrQty : 0,
        poPrice: avgPrice,
        apPrice: avgPrice,
        status,
        notes
      };
    });

    for (const b of baselineCases) {
      if (!computedCases.some(c => c.id === b.id || c.poId === b.poId)) {
        computedCases.unshift(b);
      }
    }

    if (req.params.id) {
      const match = computedCases.find(c => c.poId === req.params.id || c.id === req.params.id || String(c.poId).endsWith(req.params.id));
      if (match) {
        return res.json(match);
      }
    }

    res.json(computedCases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 11. POST /api/purchase/matching-cases/:id/resolve
// =========================================================================
router.post("/api/purchase/matching-cases/:id/resolve", async (req, res) => {
  try {
    const caseId = req.params.id;
    const { resolutionReason, poId } = req.body;
    const user = (req as any).user;
    const userId = user?.id || 1;
    const resolvedBy = user?.name || user?.username || 'Trưởng phòng Thu mua P2P';

    if (!resolutionReason || !resolutionReason.trim()) {
      return res.status(400).json({ error: "Cần cung cấp lý do/phương án phân xử chênh lệch đối soát." });
    }

    const resolution: DiscrepancyResolution = {
      caseId,
      poId: poId || '',
      reason: resolutionReason.trim(),
      resolvedBy,
      resolvedAt: new Date().toISOString(),
      status: 'RESOLVED'
    };

    discrepancyResolutions.set(caseId, resolution);
    if (poId) {
      discrepancyResolutions.set(poId, resolution);
    }

    // Feature 8: Central Audit Log
    await AuditService.recordAuditLog({
      module: 'M08',
      action: 'MATCHING_DISCREPANCY_RESOLVED',
      entityType: 'MATCHING_CASE',
      entityId: caseId,
      userId,
      username: resolvedBy,
      result: 'SUCCESS',
      metadata: {
        caseId,
        poId,
        reason: resolutionReason
      }
    });

    res.json({
      success: true,
      message: `Đã phân xử thành công hồ sơ đối soát ${caseId}. Trạng thái đã chuyển sang RESOLVED.`,
      resolution
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 12. BPA CONTRACTS ENDPOINTS (Framework Agreements)
// =========================================================================
router.get("/api/purchase/contracts", async (req, res) => {
  try {
    res.json(bpaContracts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/purchase/contracts", async (req, res) => {
  try {
    const { title, supplier, supplierId, committedValue, discountRate, notes, startDate, endDate } = req.body;

    if (!title || !title.trim() || !supplier || !supplier.trim()) {
      return res.status(400).json({ error: "Tiêu đề hợp đồng và Tên nhà cung cấp là bắt buộc." });
    }

    const numValue = Number(committedValue) || 1000000000;
    const contractCode = `CON-2026-${String(bpaContracts.length + 1).padStart(3, '0')}`;

    const newContract: BPAContract = {
      id: contractCode,
      contractCode: contractCode,
      title: title.trim(),
      supplier: supplier.trim(),
      supplierId: Number(supplierId) || undefined,
      supplierCode: req.body.supplierCode || undefined,
      contractType: req.body.contractType || 'FRAMEWORK_BPA',
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      committedValue: numValue,
      usedValue: 0,
      status: 'ACTIVE',
      discountRate: Number(discountRate) || 0,
      paymentTerms: req.body.paymentTerms || 'NET30',
      slaTargetOtif: Number(req.body.slaTargetOtif) || 95,
      slaTargetQuality: Number(req.body.slaTargetQuality) || 98,
      autoRenewalNoticeDays: Number(req.body.autoRenewalNoticeDays) || 30,
      priceLocks: req.body.priceLocks || [],
      renewalHistory: [],
      notes: notes || 'Hợp đồng nguyên tắc & thỏa thuận khung giá ký kết điện tử SRM'
    };

    bpaContracts.unshift(newContract);

    AuditService.captureAsync({
      userId: (req as any).user?.id || 1,
      username: (req as any).user?.username || 'purchasing_agent',
      module: 'M08',
      action: 'SUPPLIER_CONTRACT_CREATED',
      entityType: 'BPA_CONTRACT',
      entityId: contractCode,
      afterData: newContract,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.status(201).json({
      success: true,
      message: `Ký kết hợp đồng khung ${contractCode} thành công.`,
      contract: newContract
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/api/purchase/contracts/:id/renew", async (req, res) => {
  try {
    const contractId = req.params.id;
    const { newEndDate, additionalCommittedValue, newDiscountRate, renewalNotes } = req.body;
    const user = (req as any).user;
    const renewedBy = user?.name || user?.username || 'Hội đồng Quản trị SRM';

    const index = bpaContracts.findIndex(c => c.id === contractId || c.contractCode === contractId);
    if (index === -1) {
      return res.status(404).json({ error: `Không tìm thấy hợp đồng khung ${contractId}` });
    }

    const current = bpaContracts[index];
    const prevEndDate = current.endDate;
    const addedValue = Number(additionalCommittedValue) || 0;

    const renewalEntry = {
      renewalDate: new Date().toISOString().slice(0, 10),
      previousEndDate: prevEndDate,
      newEndDate: newEndDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      renewedBy,
      committedValueAdded: addedValue,
      notes: renewalNotes || 'Gia hạn thời hạn hiệu lực và hạn mức ngân sách cung ứng'
    };

    const updatedContract: BPAContract = {
      ...current,
      endDate: renewalEntry.newEndDate,
      committedValue: current.committedValue + addedValue,
      discountRate: newDiscountRate !== undefined ? Number(newDiscountRate) : current.discountRate,
      status: 'ACTIVE',
      renewalHistory: [renewalEntry, ...(current.renewalHistory || [])],
      notes: renewalNotes ? `${current.notes ? current.notes + ' | ' : ''}Gia hạn: ${renewalNotes}` : current.notes
    };

    bpaContracts[index] = updatedContract;

    AuditService.captureAsync({
      userId: user?.id || 1,
      username: user?.username || 'purchasing_agent',
      module: 'M08',
      action: 'SUPPLIER_CONTRACT_RENEWED',
      entityType: 'BPA_CONTRACT',
      entityId: contractId,
      beforeData: { endDate: prevEndDate, status: current.status },
      afterData: renewalEntry,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `Gia hạn thành công hợp đồng khung ${contractId} đến ngày ${updatedContract.endDate}.`,
      contract: updatedContract
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/api/purchase/contracts/:id", async (req, res) => {
  try {
    const contractId = req.params.id;
    const index = bpaContracts.findIndex(c => c.id === contractId || c.contractCode === contractId);
    if (index === -1) {
      return res.status(404).json({ error: `Không tìm thấy hợp đồng ${contractId}` });
    }

    const current = bpaContracts[index];
    const updatedContract: BPAContract = {
      ...current,
      ...req.body,
      id: current.id,
    };

    bpaContracts[index] = updatedContract;

    res.json({
      success: true,
      message: `Cập nhật hợp đồng ${contractId} thành công.`,
      contract: updatedContract
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/api/purchase/contracts/:id", async (req, res) => {
  try {
    const contractId = req.params.id;
    const index = bpaContracts.findIndex(c => c.id === contractId || c.contractCode === contractId);
    if (index === -1) {
      return res.status(404).json({ error: `Không tìm thấy hợp đồng ${contractId}` });
    }

    bpaContracts[index].status = 'TERMINATED';

    res.json({
      success: true,
      message: `Đã chấm dứt hiệu lực hợp đồng ${contractId}. Trạng thái chuyển sang TERMINATED.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
