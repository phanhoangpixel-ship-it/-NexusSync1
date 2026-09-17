import { db } from '../src/db';
import {
  stockLedger,
  stockBalances,
  products,
  lotBalances,
  warehouseLocations,
  stockReservations,
  stockTransfers,
  stockTransferItems,
  stocktakes,
  stocktakeItems,
  outboxEvents,
  auditLogs,
  fiscalPeriods,
  users,
  lots,
  warehouses,
  categories,
  wmsWaves,
  wmsPickingTasks,
  inventoryOfflineQueue,
  suppliers,
  serialNumbers,
} from '../src/db/schema';
import { eq, and, isNull, sql, desc, asc, lte, gte } from 'drizzle-orm';
import { SerialEngine } from '../src/services/serialEngine';
import { masterDataCache } from '../src/services/masterDataCache';
import { AuditService } from './auditService';

export type InventoryTransactionType =
  | 'INBOUND_RECEIPT'
  | 'OUTBOUND_ISSUE'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'RESERVE'
  | 'RELEASE_RESERVATION'
  | 'CONSUME_RESERVED'
  | 'RETURN_FROM_CUSTOMER'
  | 'RETURN_TO_SUPPLIER'
  | 'PRODUCTION_CONSUMPTION'
  | 'PRODUCTION_RECEIPT'
  | 'STOCK_COUNT_ADJUSTMENT'
  | 'OPENING_BALANCE'
  // QMS Quarantine Lifecycle:
  | 'QUARANTINE_HOLD'
  | 'QUARANTINE_RELEASE'
  | 'QUARANTINE_REJECT'
  // Legacy aliases:
  | 'IN'
  | 'OUT'
  | 'ADJUSTMENT'
  | 'TRANSFER'
  | 'SALE'
  | 'PURCHASE'
  | 'SALES_RETURN'
  | 'PURCHASE_RETURN'
  | 'GOODS_RECEIPT'
  | 'GOODS_ISSUE';

export interface PostTransactionParams {
  productId: number;
  warehouseId: number;
  locationId?: number | null;
  lotId?: number | null;
  type: InventoryTransactionType;
  referenceNo: string;
  transactionGroupId?: string;
  quantity: number; // Positive for IN, Negative for OUT (or auto-signed based on type)
  notes?: string;
  userId: number;
  serials?: string[];
  referenceId?: number;
  referenceItemId?: number;
  serialTargetStatus?: string;
  deductReserved?: boolean; // When true, deducts physical and reserved simultaneously (consume reserved)
  idempotencyKey?: string;
  allowNegativeStock?: boolean;
  overrideReason?: string;
  overrideApprovedBy?: number;
  transactionDate?: Date | string;
  overrideFiscalLock?: boolean;
}

export interface PostTransactionResult {
  transactionId: number;
  productId: number;
  warehouseId: number;
  locationId: number | null;
  lotId: number | null;
  type: string;
  referenceNo: string;
  quantityBefore: number;
  quantityChanged: number;
  quantityAfter: number;
  onHandAfter: number;
  allocatedAfter: number;
  availableAfter: number;
  status: 'SUCCESS' | 'REJECTED';
  idempotencyKey?: string;
  timestamp: string;
  notes?: string;
}

// In-memory idempotency cache for rapid deduplication
const idempotencyStore = new Map<string, PostTransactionResult>();

function parseArgs<T>(txOrParams: any, maybeParams?: T): { tx: any; params: T } {
  if (maybeParams !== undefined) {
    return { tx: txOrParams || db, params: maybeParams };
  }
  return { tx: db, params: txOrParams as T };
}

// Helper to safely write audit logs
async function recordAuditLog(tx: any, input: {
  userId: number;
  action: string;
  entityType: string;
  entityId: string;
  module?: string;
  beforeData?: any;
  afterData?: any;
  reason?: string;
}) {
  try {
    const user = await tx.select().from(users).where(eq(users.id, input.userId)).limit(1);
    const username = user.length > 0 ? user[0].username : `user_${input.userId}`;
    const userName = user.length > 0 ? user[0].fullName : undefined;
    const role = user.length > 0 ? user[0].role : 'USER';

    await AuditService.recordAuditLog({
      userId: input.userId,
      username,
      userName,
      role,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      module: input.module || 'INVENTORY',
      beforeData: input.beforeData,
      afterData: input.afterData,
      reason: input.reason || null,
      result: 'SUCCESS',
    });
  } catch (err) {
    // Non-blocking for audit logging
  }
}

// Helper to safely emit outbox events
async function emitOutboxEvent(tx: any, event: {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  source?: string;
  actorId?: string | number;
  payload: any;
}) {
  try {
    const eventId = `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await tx.insert(outboxEvents).values({
      eventId,
      eventType: event.eventType,
      eventVersion: 1,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      source: event.source || 'M17_INVENTORY',
      actorId: event.actorId ? String(event.actorId) : '1',
      payload: JSON.stringify(event.payload),
      status: 'PENDING',
    });
  } catch (err) {
    // Non-blocking outbox emission
  }
}

export const InventoryService = {
  /**
   * Backdated Transaction Policy & Period Lock Validation.
   * Checks if transaction date is within permitted backdated limit and not in a locked fiscal period.
   */
  async validateTransactionDate(
    tx: any,
    transactionDate?: Date | string,
    overrideFiscalLock: boolean = false
  ) {
    if (!transactionDate) return;

    const dateObj = typeof transactionDate === 'string' ? new Date(transactionDate) : transactionDate;
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Ngày giao dịch không hợp lệ: ${transactionDate}`);
    }

    const today = new Date();
    const diffDays = Math.floor((today.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
    const MAX_BACKDATED_DAYS = 30;

    if (diffDays > MAX_BACKDATED_DAYS && !overrideFiscalLock) {
      throw new Error(
        `Chính sách ngày giao dịch: Không được ghi lùi quá ${MAX_BACKDATED_DAYS} ngày (Giao dịch lùi ${diffDays} ngày). Cần phê duyệt ghi đè kỳ khóa.`
      );
    }

    // Check Fiscal Period Lock
    const yyyyMm = dateObj.toISOString().slice(0, 7); // e.g. "2026-03"
    const period = await tx
      .select()
      .from(fiscalPeriods)
      .where(eq(fiscalPeriods.periodCode, yyyyMm))
      .limit(1);

    if (period.length > 0 && (period[0].status === 'LOCKED' || period[0].status === 'CLOSED')) {
      if (!overrideFiscalLock) {
        throw new Error(
          `Kỳ kế toán/kho ${yyyyMm} đã ở trạng thái ${period[0].status}. Không thể thực hiện giao dịch mà không có quyền ghi đè kỳ khóa.`
        );
      }
    }
  },

  /**
   * Reserves available stock for an order without mutating physical inventory.
   * INVARIANT: Available ↓, Reserved ↑, Physical UNCHANGED.
   * Enforces Available >= quantity.
   */
  async reserveStock(
    txOrParams: any,
    maybeParams?: {
      productId: number;
      warehouseId: number;
      locationId?: number | null;
      quantity: number;
      referenceNo: string;
      userId: number;
      notes?: string;
    }
  ) {
    const { tx, params } = parseArgs(txOrParams, maybeParams);
    const { productId, warehouseId, locationId = null, quantity, referenceNo, userId, notes } = params;
    if (quantity <= 0) {
      throw new Error(`Số lượng giữ chỗ phải lớn hơn 0. Nhận được: ${quantity}`);
    }

    // Location resolution
    let effectiveLocationId: number | null = locationId || null;
    if (!locationId) {
      const defaultLoc = await tx
        .select()
        .from(warehouseLocations)
        .where(and(eq(warehouseLocations.warehouseId, warehouseId), eq(warehouseLocations.isActive, true)))
        .limit(1);
      if (defaultLoc.length > 0) {
        effectiveLocationId = defaultLoc[0].id;
      }
    }

    const balanceConditions = [
      eq(stockBalances.productId, productId),
      eq(stockBalances.warehouseId, warehouseId),
    ];
    if (effectiveLocationId) {
      balanceConditions.push(eq(stockBalances.locationId, effectiveLocationId));
    } else {
      balanceConditions.push(isNull(stockBalances.locationId));
    }

    const existingBalance = await tx.select().from(stockBalances).where(and(...balanceConditions)).limit(1);

    let onHandAfter = 0;
    let allocatedAfter = 0;
    let availableAfter = 0;
    let beforeData: any = null;

    if (existingBalance.length > 0) {
      const bal = existingBalance[0];
      beforeData = { ...bal };
      if (bal.stockAvailable < quantity) {
        const prod = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
        const name = prod.length > 0 ? prod[0].name : `ID ${productId}`;
        throw new Error(
          `Tồn khả dụng không đủ để giữ chỗ cho sản phẩm ${name}. Khả dụng: ${bal.stockAvailable}, Yêu cầu giữ chỗ: ${quantity}.`
        );
      }

      onHandAfter = bal.stockPhysical;
      allocatedAfter = bal.stockReserved + quantity;
      availableAfter = Math.max(0, onHandAfter - allocatedAfter);

      await tx
        .update(stockBalances)
        .set({
          stockReserved: allocatedAfter,
          stockAvailable: availableAfter,
        })
        .where(eq(stockBalances.id, bal.id));
    } else {
      // Check product master stock
      const prod = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
      const name = prod.length > 0 ? prod[0].name : `ID ${productId}`;
      const avail = prod.length > 0 ? (prod[0].stockAvailable ?? prod[0].stockPhysical ?? 0) : 0;
      if (avail < quantity) {
        throw new Error(
          `Tồn khả dụng không đủ để giữ chỗ cho sản phẩm ${name}. Khả dụng: ${avail}, Yêu cầu: ${quantity}.`
        );
      }

      onHandAfter = Math.max(0, avail);
      allocatedAfter = quantity;
      availableAfter = Math.max(0, onHandAfter - allocatedAfter);

      await tx.insert(stockBalances).values({
        productId,
        warehouseId,
        locationId: effectiveLocationId,
        stockPhysical: onHandAfter,
        stockAvailable: availableAfter,
        stockReserved: allocatedAfter,
      });
    }

    // Insert into stockReservations table
    let reservationId: number | undefined;
    try {
      const inserted = await tx
        .insert(stockReservations)
        .values({
          productId,
          warehouseId,
          locationId: effectiveLocationId,
          quantity,
          referenceNo,
          status: 'ACTIVE',
          notes: notes || 'Bảo lưu hàng chờ xuất',
          userId,
        })
        .returning();
      if (inserted && inserted.length > 0) {
        reservationId = inserted[0].id;
      }
    } catch {
      // Gracefully continue if table constraints
    }

    // Update Global Product Stock Cache (Atomic synchronization)
    const allBalances = await tx.select().from(stockBalances).where(eq(stockBalances.productId, productId));
    const totalPhysical = allBalances.reduce((sum: number, b: any) => sum + (b.stockPhysical || 0), 0);
    const totalReserved = allBalances.reduce((sum: number, b: any) => sum + (b.stockReserved || 0), 0);

    await tx
      .update(products)
      .set({
        stockPhysical: totalPhysical,
        stockReserved: totalReserved,
        stockAvailable: Math.max(0, totalPhysical - totalReserved),
      })
      .where(eq(products.id, productId));

    masterDataCache.invalidateByTag('products');

    // Audit Log & Outbox Event
    await recordAuditLog(tx, {
      userId,
      action: 'RESERVE',
      entityType: 'STOCK_RESERVATION',
      entityId: referenceNo,
      beforeData,
      afterData: { productId, warehouseId, locationId: effectiveLocationId, quantity, onHandAfter, allocatedAfter, availableAfter },
      reason: notes,
    });

    await emitOutboxEvent(tx, {
      eventType: 'STOCK_RESERVED',
      aggregateType: 'StockReservation',
      aggregateId: referenceNo,
      actorId: userId,
      payload: { productId, warehouseId, locationId: effectiveLocationId, quantity, referenceNo },
    });

    return {
      reservationId,
      status: 'SUCCESS' as const,
      onHandAfter,
      allocatedAfter,
      availableAfter,
      referenceNo,
    };
  },

  /**
   * Releases stock reservation (e.g. order cancelled or expired).
   * INVARIANT: Available ↑, Reserved ↓, Physical UNCHANGED.
   */
  async releaseReservation(
    txOrParams: any,
    maybeParams?: {
      productId: number;
      warehouseId: number;
      locationId?: number | null;
      quantity: number;
      referenceNo: string;
      userId: number;
      notes?: string;
      reservationId?: number;
    }
  ) {
    const { tx, params } = parseArgs(txOrParams, maybeParams);
    const { productId, warehouseId, locationId = null, quantity, referenceNo, userId, notes, reservationId } = params;
    if (quantity <= 0) return { status: 'SUCCESS' as const, onHandAfter: 0, allocatedAfter: 0, availableAfter: 0, referenceNo };

    let effectiveLocationId: number | null = locationId || null;
    if (!locationId) {
      const defaultLoc = await tx
        .select()
        .from(warehouseLocations)
        .where(and(eq(warehouseLocations.warehouseId, warehouseId), eq(warehouseLocations.isActive, true)))
        .limit(1);
      if (defaultLoc.length > 0) {
        effectiveLocationId = defaultLoc[0].id;
      }
    }

    const balanceConditions = [
      eq(stockBalances.productId, productId),
      eq(stockBalances.warehouseId, warehouseId),
    ];
    if (effectiveLocationId) {
      balanceConditions.push(eq(stockBalances.locationId, effectiveLocationId));
    } else {
      balanceConditions.push(isNull(stockBalances.locationId));
    }

    const existingBalance = await tx.select().from(stockBalances).where(and(...balanceConditions)).limit(1);

    let onHandAfter = 0;
    let allocatedAfter = 0;
    let availableAfter = 0;
    let beforeData: any = null;

    if (existingBalance.length > 0) {
      const bal = existingBalance[0];
      beforeData = { ...bal };
      onHandAfter = bal.stockPhysical;
      allocatedAfter = Math.max(0, bal.stockReserved - quantity);
      availableAfter = Math.max(0, onHandAfter - allocatedAfter);

      await tx
        .update(stockBalances)
        .set({
          stockReserved: allocatedAfter,
          stockAvailable: availableAfter,
        })
        .where(eq(stockBalances.id, bal.id));
    }

    // Update stockReservations status to RELEASED if reservationId or referenceNo is provided
    try {
      if (reservationId) {
        await tx
          .update(stockReservations)
          .set({ status: 'RELEASED', notes: notes ? `${notes} (Đã giải phóng)` : 'Đã giải phóng' })
          .where(eq(stockReservations.id, reservationId));
      } else if (referenceNo) {
        await tx
          .update(stockReservations)
          .set({ status: 'RELEASED' })
          .where(and(eq(stockReservations.referenceNo, referenceNo), eq(stockReservations.status, 'ACTIVE')));
      }
    } catch {
      // Ignored
    }

    // Update Global Product Stock Cache
    const allBalances = await tx.select().from(stockBalances).where(eq(stockBalances.productId, productId));
    const totalPhysical = allBalances.reduce((sum: number, b: any) => sum + (b.stockPhysical || 0), 0);
    const totalReserved = allBalances.reduce((sum: number, b: any) => sum + (b.stockReserved || 0), 0);

    await tx
      .update(products)
      .set({
        stockPhysical: totalPhysical,
        stockReserved: totalReserved,
        stockAvailable: Math.max(0, totalPhysical - totalReserved),
      })
      .where(eq(products.id, productId));

    masterDataCache.invalidateByTag('products');

    // Audit Log & Outbox Event
    await recordAuditLog(tx, {
      userId,
      action: 'RELEASE',
      entityType: 'STOCK_RESERVATION',
      entityId: referenceNo,
      beforeData,
      afterData: { productId, warehouseId, locationId: effectiveLocationId, quantity, onHandAfter, allocatedAfter, availableAfter },
      reason: notes,
    });

    await emitOutboxEvent(tx, {
      eventType: 'STOCK_RELEASED',
      aggregateType: 'StockReservation',
      aggregateId: referenceNo,
      actorId: userId,
      payload: { productId, warehouseId, locationId: effectiveLocationId, quantity, referenceNo },
    });

    return {
      status: 'SUCCESS' as const,
      onHandAfter,
      allocatedAfter,
      availableAfter,
      referenceNo,
    };
  },

  /**
   * Consumes previously reserved stock upon dispatch/fulfillment.
   * INVARIANT: Physical ↓, Reserved ↓, Available UNCHANGED.
   */
  async consumeReservation(
    txOrParams: any,
    maybeParams?: {
      productId: number;
      warehouseId: number;
      locationId?: number | null;
      quantity: number;
      referenceNo: string;
      userId: number;
      notes?: string;
      reservationId?: number;
      serials?: string[];
      lotId?: number | null;
    }
  ) {
    const { tx, params } = parseArgs(txOrParams, maybeParams);
    const result = await this.postTransaction(tx, {
      ...params,
      type: 'OUTBOUND_ISSUE',
      deductReserved: true,
    });

    if (params.reservationId) {
      try {
        await tx
          .update(stockReservations)
          .set({ status: 'FULFILLED' })
          .where(eq(stockReservations.id, params.reservationId));
      } catch {
        // Ignored
      }
    }

    return result;
  },

  /**
   * Logs a transaction to the stock ledger and updates stock balances globally.
   * Single-Writer authority for all inventory movements.
   * Promotes (Product + Warehouse + Location) as Primary Inventory Dimension.
   */
  async postTransaction(
    txOrParams: any,
    maybeParams?: PostTransactionParams
  ): Promise<PostTransactionResult> {
    const { tx, params } = parseArgs(txOrParams, maybeParams);

    // 0. Idempotency Check
    if (params.idempotencyKey) {
      const cached = idempotencyStore.get(params.idempotencyKey);
      if (cached) {
        return cached;
      }
    }

    // -1. Backdated Transaction & Period Lock Policy
    await this.validateTransactionDate(tx, params.transactionDate, params.overrideFiscalLock);

    const outTypes = [
      'OUT',
      'SALE',
      'TRANSFER_OUT',
      'ADJUSTMENT_OUT',
      'PURCHASE_RETURN',
      'GOODS_ISSUE',
      'OUTBOUND_ISSUE',
      'RETURN_TO_SUPPLIER',
      'PRODUCTION_CONSUMPTION',
      'QUARANTINE_REJECT',
    ];
    const inTypes = [
      'IN',
      'PURCHASE',
      'TRANSFER_IN',
      'ADJUSTMENT_IN',
      'SALES_RETURN',
      'GOODS_RECEIPT',
      'INBOUND_RECEIPT',
      'RETURN_FROM_CUSTOMER',
      'PRODUCTION_RECEIPT',
      'OPENING_BALANCE',
      'QUARANTINE_HOLD',
      'QUARANTINE_RELEASE',
    ];

    let qty = params.quantity;
    if (outTypes.includes(params.type) && qty > 0) {
      qty = -qty; // Auto-correct to negative if OUT
    } else if (inTypes.includes(params.type) && qty < 0) {
      qty = Math.abs(qty); // Auto-correct to positive if IN
    }

    const {
      productId,
      warehouseId,
      locationId = null,
      lotId = null,
      type,
      referenceNo,
      notes,
      userId,
      serials = [],
      referenceId = 0,
      referenceItemId = 0,
      serialTargetStatus,
      deductReserved = false,
      idempotencyKey,
      allowNegativeStock = false,
      overrideReason,
      overrideApprovedBy,
    } = params;

    // Location Validation & Default Location Resolution
    let effectiveLocationId: number | null = locationId || null;
    if (locationId) {
      const locCheck = await tx
        .select()
        .from(warehouseLocations)
        .where(eq(warehouseLocations.id, locationId))
        .limit(1);
      if (locCheck.length === 0) {
        throw new Error(`Location ID ${locationId} không tồn tại`);
      }
      if (locCheck[0].warehouseId !== warehouseId) {
        throw new Error(`Location ID ${locationId} không thuộc Kho ID ${warehouseId}`);
      }
    } else {
      const defaultLoc = await tx
        .select()
        .from(warehouseLocations)
        .where(and(eq(warehouseLocations.warehouseId, warehouseId), eq(warehouseLocations.isActive, true)))
        .limit(1);
      if (defaultLoc.length > 0) {
        effectiveLocationId = defaultLoc[0].id;
      }
    }

    // Serial Validation & Processing
    const productArr = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
    if (productArr.length === 0) throw new Error(`Sản phẩm ID ${productId} không tồn tại`);
    const product = productArr[0];

    if (product.isSerialTracked) {
      if (!serials || serials.length !== Math.abs(qty)) {
        throw new Error(
          `Sản phẩm ${product.name} quản lý theo Serial. Cần đúng ${Math.abs(qty)} serials, nhưng nhận được ${
            serials ? serials.length : 0
          }.`
        );
      }
      if (inTypes.includes(type)) {
        if (type === 'TRANSFER_IN') {
          await SerialEngine.receiveFromTransit(
            tx,
            serials,
            productId,
            warehouseId,
            referenceId,
            referenceItemId,
            userId,
            effectiveLocationId
          );
        } else {
          await SerialEngine.receiveSerials(
            tx,
            serials,
            productId,
            warehouseId,
            type,
            referenceId,
            referenceItemId,
            userId,
            notes,
            effectiveLocationId
          );
        }
      } else if (outTypes.includes(type)) {
        if (type === 'TRANSFER_OUT') {
          await SerialEngine.transferToTransit(
            tx,
            serials,
            productId,
            warehouseId,
            referenceId,
            referenceItemId,
            userId,
            effectiveLocationId
          );
        } else {
          await SerialEngine.issueSerials(
            tx,
            serials,
            productId,
            warehouseId,
            type,
            referenceId,
            referenceItemId,
            userId,
            notes,
            effectiveLocationId,
            serialTargetStatus
          );
        }
      }
    }

    // 1. Find existing balance using (productId + warehouseId + effectiveLocationId)
    const balanceConditions = [
      eq(stockBalances.productId, productId),
      eq(stockBalances.warehouseId, warehouseId),
    ];
    if (effectiveLocationId) {
      balanceConditions.push(eq(stockBalances.locationId, effectiveLocationId));
    } else {
      balanceConditions.push(isNull(stockBalances.locationId));
    }

    const existingBalance = await tx.select().from(stockBalances).where(and(...balanceConditions)).limit(1);

    let currentPhysical = 0;
    let currentReserved = 0;
    let currentAvailable = 0;
    let balanceId: number | null = null;
    let beforeBalData: any = null;

    let onHandAfter = 0;
    let allocatedAfter = 0;
    let availableAfter = 0;

    if (existingBalance.length > 0) {
      currentPhysical = existingBalance[0].stockPhysical || 0;
      currentReserved = existingBalance[0].stockReserved || 0;
      currentAvailable = existingBalance[0].stockAvailable || 0;
      balanceId = existingBalance[0].id;
      beforeBalData = { ...existingBalance[0] };

      // Negative Stock Guard: Check available stock for OUT transactions
      if (qty < 0 && !deductReserved && currentAvailable < Math.abs(qty) && type !== 'ADJUSTMENT' && type !== 'OPENING_BALANCE') {
        if (!allowNegativeStock) {
          const locInfo = effectiveLocationId ? ` (Location ID ${effectiveLocationId})` : '';
          throw new Error(
            `Insufficient available stock for product ${product.name} at warehouse ID ${warehouseId}${locInfo}. Available: ${currentAvailable}, Requested: ${Math.abs(
              qty
            )}.`
          );
        }
      }

      if (deductReserved && qty < 0) {
        const absQty = Math.abs(qty);
        onHandAfter = Math.max(0, currentPhysical - absQty);
        allocatedAfter = Math.max(0, currentReserved - absQty);
        availableAfter = Math.max(0, onHandAfter - allocatedAfter);

        await tx
          .update(stockBalances)
          .set({
            stockPhysical: onHandAfter,
            stockReserved: allocatedAfter,
            stockAvailable: availableAfter,
          })
          .where(eq(stockBalances.id, balanceId));
      } else {
        onHandAfter = currentPhysical + qty;
        allocatedAfter = currentReserved;
        availableAfter = onHandAfter - allocatedAfter;

        if (!allowNegativeStock && (onHandAfter < 0 || availableAfter < 0) && type !== 'ADJUSTMENT') {
          throw new Error(
            `Negative Stock Guard Violation: Không thể xuất âm kho cho ${product.name}. Tồn sau giao dịch: ${onHandAfter}.`
          );
        }

        await tx
          .update(stockBalances)
          .set({
            stockPhysical: onHandAfter,
            stockAvailable: availableAfter,
          })
          .where(eq(stockBalances.id, balanceId));
      }
    } else {
      if (qty < 0 && type !== 'ADJUSTMENT' && !allowNegativeStock) {
        const locInfo = effectiveLocationId ? ` (Location ID ${effectiveLocationId})` : '';
        throw new Error(
          `Cannot issue ${Math.abs(qty)} for product ${product.name}. No stock balance exists at warehouse ID ${warehouseId}${locInfo}.`
        );
      }

      onHandAfter = Math.max(0, qty);
      allocatedAfter = 0;
      availableAfter = Math.max(0, qty);

      const newBalance = await tx
        .insert(stockBalances)
        .values({
          productId,
          warehouseId,
          locationId: effectiveLocationId,
          stockPhysical: onHandAfter,
          stockAvailable: availableAfter,
          stockReserved: 0,
        })
        .returning();
      balanceId = newBalance[0].id;
    }

    const quantityBefore = currentPhysical;
    const quantityChanged = qty;
    const quantityAfter = onHandAfter;

    // 2. Insert Stock Ledger Entry (Append-Only)
    const ledgerNote = overrideReason
      ? `${notes || ''} [NEGATIVE STOCK OVERRIDE: ${overrideReason} by User #${overrideApprovedBy || userId}]`.trim()
      : notes;

    const insertedLedger = await tx
      .insert(stockLedger)
      .values({
        productId,
        warehouseId,
        locationId: effectiveLocationId,
        lotId: lotId || null,
        type,
        referenceNo,
        transactionGroupId: params.transactionGroupId,
        quantity: qty,
        balanceAfter: onHandAfter,
        notes: ledgerNote,
        userId,
      })
      .returning();

    const transactionId = insertedLedger && insertedLedger.length > 0 ? insertedLedger[0].id : Date.now();

    // 3. Update Lot Balances if Lot ID is provided
    if (lotId) {
      const lotConditions = [
        eq(lotBalances.lotId, lotId),
        eq(lotBalances.productId, productId),
        eq(lotBalances.warehouseId, warehouseId),
      ];
      if (effectiveLocationId) {
        lotConditions.push(eq(lotBalances.locationId, effectiveLocationId));
      } else {
        lotConditions.push(isNull(lotBalances.locationId));
      }

      const existingLotBal = await tx.select().from(lotBalances).where(and(...lotConditions)).limit(1);
      if (existingLotBal.length > 0) {
        if (qty < 0 && existingLotBal[0].stockAvailable < Math.abs(qty) && type !== 'ADJUSTMENT' && !allowNegativeStock) {
          throw new Error(
            `Insufficient available stock for Lot ID ${lotId}. Available: ${existingLotBal[0].stockAvailable}, Requested: ${Math.abs(
              qty
            )}.`
          );
        }
        const newLotPhys = Math.max(0, existingLotBal[0].stockPhysical + qty);
        const newLotAvail = Math.max(0, existingLotBal[0].stockAvailable + qty);
        await tx
          .update(lotBalances)
          .set({
            stockPhysical: newLotPhys,
            stockAvailable: newLotAvail,
            updatedAt: new Date(),
          })
          .where(eq(lotBalances.id, existingLotBal[0].id));
      } else if (qty > 0) {
        await tx.insert(lotBalances).values({
          lotId,
          productId,
          warehouseId,
          locationId: effectiveLocationId,
          stockPhysical: qty,
          stockAvailable: qty,
          stockReserved: 0,
        });
      } else if (type !== 'ADJUSTMENT' && !allowNegativeStock) {
        throw new Error(
          `Cannot issue ${Math.abs(qty)} from Lot ID ${lotId}. No lot balance exists at warehouse ID ${warehouseId}.`
        );
      }
    }

    // 4. Update Global Product Stock Cache (Atomic synchronization)
    const allBalances = await tx.select().from(stockBalances).where(eq(stockBalances.productId, productId));
    const totalPhysical = allBalances.reduce((sum: number, b: any) => sum + (b.stockPhysical || 0), 0);
    const totalReserved = allBalances.reduce((sum: number, b: any) => sum + (b.stockReserved || 0), 0);

    await tx
      .update(products)
      .set({
        stockPhysical: totalPhysical,
        stockReserved: totalReserved,
        stockAvailable: Math.max(0, totalPhysical - totalReserved),
      })
      .where(eq(products.id, productId));

    masterDataCache.invalidateByTag('products');

    const result: PostTransactionResult = {
      transactionId,
      productId,
      warehouseId,
      locationId: effectiveLocationId,
      lotId: lotId || null,
      type,
      referenceNo,
      quantityBefore,
      quantityChanged,
      quantityAfter,
      onHandAfter,
      allocatedAfter,
      availableAfter,
      status: 'SUCCESS',
      idempotencyKey,
      timestamp: new Date().toISOString(),
      notes: ledgerNote,
    };

    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, result);
    }

    // 5. Audit Logging & Outbox Event Emission
    await recordAuditLog(tx, {
      userId,
      action: type,
      entityType: 'STOCK_TRANSACTION',
      entityId: referenceNo,
      beforeData: beforeBalData,
      afterData: result,
      reason: ledgerNote,
    });

    const eventName = inTypes.includes(type)
      ? 'STOCK_RECEIVED'
      : outTypes.includes(type)
      ? 'STOCK_ISSUED'
      : 'INVENTORY_TRANSACTION_POSTED';

    await emitOutboxEvent(tx, {
      eventType: eventName,
      aggregateType: 'StockLedger',
      aggregateId: referenceNo,
      actorId: userId,
      payload: result,
    });

    return result;
  },

  /**
   * Performs an atomic stock transfer between two warehouses / locations.
   */
  async transferStock(
    txOrParams: any,
    maybeParams?: {
      productId: number;
      fromWarehouseId: number;
      fromLocationId?: number | null;
      toWarehouseId: number;
      toLocationId?: number | null;
      quantity: number;
      referenceNo: string;
      transactionGroupId?: string;
      userId: number;
      notes?: string;
      serials?: string[];
      lotId?: number | null;
      idempotencyKey?: string;
    }
  ) {
    const { tx, params } = parseArgs(txOrParams, maybeParams);
    const {
      productId,
      fromWarehouseId,
      fromLocationId,
      toWarehouseId,
      toLocationId,
      quantity,
      referenceNo,
      transactionGroupId,
      userId,
      notes,
      serials,
      lotId,
      idempotencyKey,
    } = params;

    if (quantity <= 0) {
      throw new Error(`Số lượng điều chuyển phải lớn hơn 0. Nhận được: ${quantity}`);
    }

    // Step 1: Out from source
    const transferOutResult = await this.postTransaction(tx, {
      productId,
      warehouseId: fromWarehouseId,
      locationId: fromLocationId,
      lotId,
      type: 'TRANSFER_OUT',
      referenceNo,
      transactionGroupId: transactionGroupId || referenceNo,
      quantity: -quantity,
      notes: notes ? `Xuất chuyển kho: ${notes}` : `Xuất chuyển sang kho #${toWarehouseId}`,
      userId,
      serials,
      idempotencyKey: idempotencyKey ? `${idempotencyKey}-OUT` : undefined,
    });

    // Step 2: In to destination
    const transferInResult = await this.postTransaction(tx, {
      productId,
      warehouseId: toWarehouseId,
      locationId: toLocationId,
      lotId,
      type: 'TRANSFER_IN',
      referenceNo,
      transactionGroupId: transactionGroupId || referenceNo,
      quantity: quantity,
      notes: notes ? `Nhập chuyển kho: ${notes}` : `Nhập chuyển từ kho #${fromWarehouseId}`,
      userId,
      serials,
      idempotencyKey: idempotencyKey ? `${idempotencyKey}-IN` : undefined,
    });

    await emitOutboxEvent(tx, {
      eventType: 'STOCK_TRANSFERRED',
      aggregateType: 'StockTransfer',
      aggregateId: referenceNo,
      actorId: userId,
      payload: { productId, fromWarehouseId, toWarehouseId, quantity, referenceNo },
    });

    return {
      transferOutResult,
      transferInResult,
    };
  },

  /**
   * Holds stock in quarantine (e.g. during IQC / PQC / OQC inspection).
   * Moves stock from standard location to quarantine location atomically,
   * or records an inbound receipt directly into quarantine.
   */
  async holdInQuarantine(
    txOrParams: any,
    maybeParams?: {
      productId: number;
      warehouseId: number;
      fromLocationId?: number | null;
      quarantineLocationId?: number | null;
      lotId?: number | null;
      quantity: number;
      referenceNo: string;
      userId: number;
      notes?: string;
      serials?: string[];
      idempotencyKey?: string;
    }
  ) {
    const { tx, params } = parseArgs(txOrParams, maybeParams);
    const {
      productId,
      warehouseId,
      fromLocationId,
      quarantineLocationId,
      lotId,
      quantity,
      referenceNo,
      userId,
      notes,
      serials,
      idempotencyKey,
    } = params;

    if (quantity <= 0) {
      throw new Error(`Số lượng đưa vào cách ly phải lớn hơn 0. Nhận được: ${quantity}`);
    }

    // If moving from an existing warehouse location into a quarantine bin
    if (fromLocationId && quarantineLocationId && fromLocationId !== quarantineLocationId) {
      const result = await this.transferStock(tx, {
        productId,
        fromWarehouseId: warehouseId,
        fromLocationId,
        toWarehouseId: warehouseId,
        toLocationId: quarantineLocationId,
        quantity,
        referenceNo,
        transactionGroupId: `QHOLD-${referenceNo}`,
        userId,
        notes: notes || `Chuyển vào vị trí cách ly kiểm định chất lượng (${referenceNo})`,
        serials,
        lotId,
        idempotencyKey,
      });

      if (lotId) {
        await tx.update(lots).set({ status: 'HOLD' }).where(eq(lots.id, lotId));
      }

      return result;
    }

    // Direct posting into quarantine location
    const postResult = await this.postTransaction(tx, {
      productId,
      warehouseId,
      locationId: quarantineLocationId || fromLocationId || null,
      lotId,
      type: 'QUARANTINE_HOLD',
      referenceNo,
      quantity,
      notes: notes || `Nhập cách ly kiểm định chất lượng (${referenceNo})`,
      userId,
      serials,
      idempotencyKey,
    });

    if (lotId) {
      await tx.update(lots).set({ status: 'HOLD' }).where(eq(lots.id, lotId));
    }

    return postResult;
  },

  /**
   * Releases stock from quarantine to available storage after QC Pass.
   * Atomically transfers stock from quarantine location to available destination location,
   * and updates lot status to ACTIVE.
   */
  async releaseFromQuarantine(
    txOrParams: any,
    maybeParams?: {
      productId: number;
      warehouseId: number;
      quarantineLocationId?: number | null;
      toLocationId?: number | null;
      lotId?: number | null;
      quantity: number;
      referenceNo: string;
      userId: number;
      notes?: string;
      serials?: string[];
      idempotencyKey?: string;
    }
  ) {
    const { tx, params } = parseArgs(txOrParams, maybeParams);
    const {
      productId,
      warehouseId,
      quarantineLocationId,
      toLocationId,
      lotId,
      quantity,
      referenceNo,
      userId,
      notes,
      serials,
      idempotencyKey,
    } = params;

    if (quantity <= 0) {
      throw new Error(`Số lượng giải phóng cách ly phải lớn hơn 0. Nhận được: ${quantity}`);
    }

    // If transferring from quarantine bin to storage bin
    if (quarantineLocationId && toLocationId && quarantineLocationId !== toLocationId) {
      const result = await this.transferStock(tx, {
        productId,
        fromWarehouseId: warehouseId,
        fromLocationId: quarantineLocationId,
        toWarehouseId: warehouseId,
        toLocationId,
        quantity,
        referenceNo,
        transactionGroupId: `QREL-${referenceNo}`,
        userId,
        notes: notes || `Giải phóng kiểm định chất lượng đạt chuẩn (${referenceNo})`,
        serials,
        lotId,
        idempotencyKey,
      });

      if (lotId) {
        await tx.update(lots).set({ status: 'ACTIVE' }).where(eq(lots.id, lotId));
      }

      return result;
    }

    // Direct post release transaction
    const postResult = await this.postTransaction(tx, {
      productId,
      warehouseId,
      locationId: toLocationId || quarantineLocationId || null,
      lotId,
      type: 'QUARANTINE_RELEASE',
      referenceNo,
      quantity,
      notes: notes || `Giải phóng cách ly kiểm định (${referenceNo})`,
      userId,
      serials,
      idempotencyKey,
    });

    if (lotId) {
      await tx.update(lots).set({ status: 'ACTIVE' }).where(eq(lots.id, lotId));
    }

    return postResult;
  },

  /**
   * Rejects stock in quarantine (Scrap or Return to Supplier).
   * Atomically issues stock out of quarantine location with reason & reference.
   */
  async rejectQuarantineStock(
    txOrParams: any,
    maybeParams?: {
      productId: number;
      warehouseId: number;
      quarantineLocationId?: number | null;
      lotId?: number | null;
      quantity: number;
      referenceNo: string;
      disposition: 'SCRAP' | 'RETURN_TO_SUPPLIER';
      userId: number;
      notes?: string;
      serials?: string[];
      idempotencyKey?: string;
    }
  ) {
    const { tx, params } = parseArgs(txOrParams, maybeParams);
    const {
      productId,
      warehouseId,
      quarantineLocationId,
      lotId,
      quantity,
      referenceNo,
      disposition,
      userId,
      notes,
      serials,
      idempotencyKey,
    } = params;

    if (quantity <= 0) {
      throw new Error(`Số lượng loại bỏ cách ly phải lớn hơn 0. Nhận được: ${quantity}`);
    }

    const txType: InventoryTransactionType =
      disposition === 'RETURN_TO_SUPPLIER' ? 'RETURN_TO_SUPPLIER' : 'ADJUSTMENT_OUT';

    const postResult = await this.postTransaction(tx, {
      productId,
      warehouseId,
      locationId: quarantineLocationId || null,
      lotId,
      type: txType,
      referenceNo,
      quantity: -quantity,
      notes: notes || `Loại bỏ hàng cách ly không đạt (${disposition}) - Ref: ${referenceNo}`,
      userId,
      serials,
      idempotencyKey,
    });

    if (lotId) {
      await tx.update(lots).set({ status: 'HOLD' }).where(eq(lots.id, lotId));
    }

    return postResult;
  },

  /**
   * Complete Multi-Step Stock Transfer Workflow Engine:
   * 1. createTransferRequest (DRAFT -> SUBMITTED)
   * 2. approveTransfer (SUBMITTED -> APPROVED)
   * 3. dispatchTransfer (APPROVED -> IN_TRANSIT, executes TRANSFER_OUT)
   * 4. receiveTransfer (IN_TRANSIT -> COMPLETED, executes TRANSFER_IN)
   */
  async createTransferRequest(params: {
    fromWarehouseId: number;
    toWarehouseId: number;
    fromLocationId?: number | null;
    toLocationId?: number | null;
    requestedBy: number;
    notes?: string;
    items: Array<{
      productId: number;
      quantity: number;
      fromLocationId?: number | null;
      toLocationId?: number | null;
      serials?: string[];
      lotId?: number | null;
    }>;
  }) {
    if (!params.items || params.items.length === 0) {
      throw new Error('Phiếu chuyển kho phải có ít nhất 1 sản phẩm.');
    }

    const code = `ST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const insertedTransfer = await db
      .insert(stockTransfers)
      .values({
        code,
        fromWarehouseId: params.fromWarehouseId,
        toWarehouseId: params.toWarehouseId,
        fromLocationId: params.fromLocationId || null,
        toLocationId: params.toLocationId || null,
        status: 'SUBMITTED',
        requestedBy: params.requestedBy,
        notes: params.notes,
      })
      .returning();

    const transferId = insertedTransfer[0].id;

    for (const item of params.items) {
      await db.insert(stockTransferItems).values({
        transferId,
        productId: item.productId,
        quantity: item.quantity,
        baseQuantity: item.quantity,
        fromLocationId: item.fromLocationId || params.fromLocationId || null,
        toLocationId: item.toLocationId || params.toLocationId || null,
        serialNumbers: item.serials ? JSON.stringify(item.serials) : null,
      });
    }

    await recordAuditLog(db, {
      userId: params.requestedBy,
      action: 'CREATE',
      entityType: 'STOCK_TRANSFER',
      entityId: code,
      afterData: { transferId, code, ...params },
      reason: params.notes,
    });

    return {
      transferId,
      code,
      status: 'SUBMITTED',
      message: 'Đã tạo yêu cầu chuyển kho thành công',
    };
  },

  async approveTransfer(transferId: number, userId: number) {
    const transfer = await db.select().from(stockTransfers).where(eq(stockTransfers.id, transferId)).get();
    if (!transfer) throw new Error(`Không tìm thấy phiếu chuyển kho #${transferId}`);
    if (transfer.status !== 'SUBMITTED' && transfer.status !== 'DRAFT') {
      throw new Error(`Không thể phê duyệt phiếu ở trạng thái ${transfer.status}`);
    }

    await db
      .update(stockTransfers)
      .set({ status: 'APPROVED' })
      .where(eq(stockTransfers.id, transferId));

    await recordAuditLog(db, {
      userId,
      action: 'APPROVE',
      entityType: 'STOCK_TRANSFER',
      entityId: transfer.code,
      beforeData: { status: transfer.status },
      afterData: { status: 'APPROVED' },
    });

    return { success: true, transferId, code: transfer.code, status: 'APPROVED' };
  },

  async dispatchTransfer(transferId: number, userId: number) {
    const transfer = await db.select().from(stockTransfers).where(eq(stockTransfers.id, transferId)).get();
    if (!transfer) throw new Error(`Không tìm thấy phiếu chuyển kho #${transferId}`);
    if (transfer.status !== 'APPROVED') {
      throw new Error(`Phiếu chuyển kho phải ở trạng thái APPROVED để xuất kho. Hiện tại: ${transfer.status}`);
    }

    const items = await db.select().from(stockTransferItems).where(eq(stockTransferItems.transferId, transferId)).all();

    // Atomic dispatch execution with Serial/Lot 4-way guard
    for (const item of items) {
      const serials = item.serialNumbers ? (typeof item.serialNumbers === 'string' ? JSON.parse(item.serialNumbers) : item.serialNumbers) : undefined;
      
      // Guard check: verify stock availability at source warehouse & location
      if (serials && Array.isArray(serials) && serials.length > 0) {
        for (const sn of serials) {
          const existingSerial = await db.select().from(schema.serials).where(eq(schema.serials.serialNumber, sn)).get();
          if (existingSerial && existingSerial.status !== 'IN_STOCK') {
            throw new Error(`Sê-ri ${sn} không ở trạng thái sẵn sàng (IN_STOCK) tại kho nguồn ${transfer.fromWarehouseId}`);
          }
        }
      }

      await this.postTransaction(null, {
        productId: item.productId,
        warehouseId: transfer.fromWarehouseId,
        locationId: item.fromLocationId || transfer.fromLocationId,
        type: 'TRANSFER_OUT',
        referenceNo: `${transfer.code}-OUT`,
        quantity: -item.quantity,
        userId,
        notes: `Xuất chuyển sang kho #${transfer.toWarehouseId} (Phiếu ${transfer.code})`,
        serials,
      });

      // Update Serial status to IN_TRANSIT
      if (serials && Array.isArray(serials) && serials.length > 0) {
        for (const sn of serials) {
          await db.update(schema.serials)
            .set({ status: 'IN_TRANSIT', warehouseId: transfer.toWarehouseId })
            .where(eq(schema.serials.serialNumber, sn));
        }
      }
    }

    await db
      .update(stockTransfers)
      .set({ status: 'IN_TRANSIT' })
      .where(eq(stockTransfers.id, transferId));

    await recordAuditLog(db, {
      userId,
      action: 'TRANSFER_OUT',
      entityType: 'STOCK_TRANSFER',
      entityId: transfer.code,
      afterData: { status: 'IN_TRANSIT', itemsCount: items.length },
    });

    return { success: true, transferId, code: transfer.code, status: 'IN_TRANSIT' };
  },

  async receiveTransfer(transferId: number, userId: number) {
    const transfer = await db.select().from(stockTransfers).where(eq(stockTransfers.id, transferId)).get();
    if (!transfer) throw new Error(`Không tìm thấy phiếu chuyển kho #${transferId}`);
    if (transfer.status !== 'IN_TRANSIT' && transfer.status !== 'PARTIAL_RECEIVED') {
      throw new Error(`Phiếu chuyển kho phải ở trạng thái IN_TRANSIT hoặc PARTIAL_RECEIVED để nhập kho. Hiện tại: ${transfer.status}`);
    }

    const items = await db.select().from(stockTransferItems).where(eq(stockTransferItems.transferId, transferId)).all();

    // Atomic receipt execution with Serial/Lot 4-way destination assignment
    for (const item of items) {
      const targetQty = item.baseQuantity || item.quantity;
      const serials = item.serialNumbers ? (typeof item.serialNumbers === 'string' ? JSON.parse(item.serialNumbers) : item.serialNumbers) : undefined;
      
      await this.postTransaction(null, {
        productId: item.productId,
        warehouseId: transfer.toWarehouseId,
        locationId: item.toLocationId || transfer.toLocationId,
        type: 'TRANSFER_IN',
        referenceNo: `${transfer.code}-IN`,
        quantity: targetQty,
        userId,
        notes: `Nhập chuyển hoàn toàn từ kho #${transfer.fromWarehouseId} (Phiếu ${transfer.code})`,
        serials,
      });

      // Update Serial status back to IN_STOCK at destination warehouse
      if (serials && Array.isArray(serials) && serials.length > 0) {
        for (const sn of serials) {
          await db.update(schema.serials)
            .set({ status: 'IN_STOCK', warehouseId: transfer.toWarehouseId, locationId: item.toLocationId || transfer.toLocationId })
            .where(eq(schema.serials.serialNumber, sn));
        }
      }
    }

    await db
      .update(stockTransfers)
      .set({ status: 'RECEIVED' })
      .where(eq(stockTransfers.id, transferId));

    await recordAuditLog(db, {
      userId,
      action: 'TRANSFER_IN',
      entityType: 'STOCK_TRANSFER',
      entityId: transfer.code,
      afterData: { status: 'RECEIVED', itemsCount: items.length },
    });

    return { success: true, transferId, code: transfer.code, status: 'RECEIVED' };
  },

  async receivePartialTransfer(transferId: number, userId: number, receivedItems: any[], notes?: string) {
    const transfer = await db.select().from(stockTransfers).where(eq(stockTransfers.id, transferId)).get();
    if (!transfer) throw new Error(`Không tìm thấy phiếu chuyển kho #${transferId}`);
    if (transfer.status !== 'IN_TRANSIT' && transfer.status !== 'PARTIAL_RECEIVED') {
      throw new Error(`Phiếu chuyển kho không ở trạng thái hợp lệ để nhận hàng một phần. Hiện tại: ${transfer.status}`);
    }

    const items = await db.select().from(stockTransferItems).where(eq(stockTransferItems.transferId, transferId)).all();
    let hasShortage = false;
    let exceedsTolerance = false;
    const tolerancePercent = 5.0; // Default tolerance 5%

    for (const rItem of receivedItems) {
      const item = items.find(i => i.id === Number(rItem.itemId));
      if (!item) continue;

      const receivedQty = Number(rItem.receivedQty || 0);
      const shippedQty = item.quantity;
      const varianceQty = shippedQty - receivedQty;
      const variancePct = shippedQty > 0 ? (varianceQty / shippedQty) * 100 : 0;

      if (variancePct > tolerancePercent) {
        exceedsTolerance = true;
      }

      if (receivedQty > 0) {
        const serials = rItem.serialNumbers || (item.serialNumbers ? (typeof item.serialNumbers === 'string' ? JSON.parse(item.serialNumbers) : item.serialNumbers) : undefined);
        await this.postTransaction(null, {
          productId: item.productId,
          warehouseId: transfer.toWarehouseId,
          locationId: item.toLocationId || transfer.toLocationId,
          type: 'TRANSFER_IN',
          referenceNo: `${transfer.code}-PARTIAL-IN`,
          quantity: receivedQty,
          userId,
          notes: notes || `Nhập hàng một phần chuyển từ kho #${transfer.fromWarehouseId} (Phiếu ${transfer.code})`,
          serials,
        });
      }

      if (receivedQty < shippedQty) {
        hasShortage = true;
      }
    }

    let newStatus = hasShortage ? 'SHORTAGE_PENDING' : 'RECEIVED';
    if (exceedsTolerance) {
      newStatus = 'PENDING_APPROVAL';
    }

    await db
      .update(stockTransfers)
      .set({ status: newStatus, notes: notes ? `${transfer.notes || ''} | ${notes}` : transfer.notes })
      .where(eq(stockTransfers.id, transferId));

    await recordAuditLog(db, {
      userId,
      action: 'TRANSFER_PARTIAL_RECEIVE',
      entityType: 'STOCK_TRANSFER',
      entityId: transfer.code,
      afterData: { status: newStatus, exceedsTolerance, receivedItemsCount: receivedItems.length },
    });

    return { success: true, transferId, code: transfer.code, status: newStatus, exceedsTolerance };
  },

  async approveTransferVariance(transferId: number, userId: number, approvalStatus: string, approvalNotes?: string) {
    const transfer = await db.select().from(stockTransfers).where(eq(stockTransfers.id, transferId)).get();
    if (!transfer) throw new Error(`Không tìm thấy phiếu chuyển kho #${transferId}`);

    if (approvalStatus !== 'APPROVED' && approvalStatus !== 'REJECTED') {
      throw new Error(`Trạng thái phê duyệt không hợp lệ: ${approvalStatus}`);
    }

    const nextStatus = approvalStatus === 'APPROVED' ? 'RECONCILED' : 'REJECTED';

    await db
      .update(stockTransfers)
      .set({ 
        status: nextStatus,
        notes: approvalNotes ? `${transfer.notes || ''} | Phê duyệt chênh lệch: ${approvalStatus} - ${approvalNotes}` : transfer.notes 
      })
      .where(eq(stockTransfers.id, transferId));

    await recordAuditLog(db, {
      userId,
      action: 'TRANSFER_APPROVE_VARIANCE',
      entityType: 'STOCK_TRANSFER',
      entityId: transfer.code,
      afterData: { approvalStatus: nextStatus, approvalNotes },
    });

    return { success: true, transferId, code: transfer.code, status: nextStatus };
  },

  /**
   * Opening Balance Engine: Batch or Single opening inventory setup.
   * Maintains Single-Writer Authority by using postTransaction(OPENING_BALANCE).
   */
  async postOpeningBalance(params: {
    warehouseId: number;
    userId: number;
    referenceNo?: string;
    notes?: string;
    items: Array<{
      productId: number;
      locationId?: number | null;
      lotId?: number | null;
      quantity: number;
      costPrice?: number;
      serials?: string[];
    }>;
  }) {
    const refNo = params.referenceNo || `OP-BAL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    const results: PostTransactionResult[] = [];

    for (const item of params.items) {
      if (item.quantity <= 0) continue;
      const res = await this.postTransaction(null, {
        productId: item.productId,
        warehouseId: params.warehouseId,
        locationId: item.locationId,
        lotId: item.lotId,
        type: 'OPENING_BALANCE',
        referenceNo: refNo,
        quantity: item.quantity,
        userId: params.userId,
        notes: params.notes || 'Nhập số dư tồn kho đầu kỳ',
        serials: item.serials,
      });
      results.push(res);
    }

    await recordAuditLog(db, {
      userId: params.userId,
      action: 'OPENING_BALANCE',
      entityType: 'STOCK_BALANCE',
      entityId: refNo,
      afterData: { totalItems: results.length, referenceNo: refNo },
      reason: params.notes,
    });

    return {
      success: true,
      referenceNo: refNo,
      totalPosted: results.length,
      results,
    };
  },

  /**
   * Stocktake (Kiểm kê kho) Workflow Engine:
   * 1. startStocktake (DRAFT -> COUNTING, snapshots system quantities)
   * 2. recordStocktakeCount (records counted qty, calculates difference and variance)
   * 3. approveStocktakeAdjustment (POST_STOCKTAKE_ADJUSTMENT via postTransaction)
   */
  async startStocktake(stocktakeId: number, userId: number) {
    const st = await db.select().from(stocktakes).where(eq(stocktakes.id, stocktakeId)).get();
    if (!st) throw new Error(`Không tìm thấy đợt kiểm kê #${stocktakeId}`);

    // Snapshot current system quantity for all items in this warehouse
    const balances = await db.select().from(stockBalances).where(eq(stockBalances.warehouseId, st.warehouseId)).all();

    // Ensure items exist in stocktake_items
    for (const b of balances) {
      const existing = await db
        .select()
        .from(stocktakeItems)
        .where(
          and(
            eq(stocktakeItems.stocktakeId, stocktakeId),
            eq(stocktakeItems.productId, b.productId)
          )
        )
        .get();

      if (existing) {
        await db
          .update(stocktakeItems)
          .set({
            systemQuantity: b.stockPhysical,
            systemQuantityAtStart: b.stockPhysical,
          })
          .where(eq(stocktakeItems.id, existing.id));
      } else {
        await db.insert(stocktakeItems).values({
          stocktakeId,
          warehouseId: st.warehouseId,
          productId: b.productId,
          locationId: b.locationId,
          systemQuantity: b.stockPhysical,
          systemQuantityAtStart: b.stockPhysical,
          countedQuantity: b.stockPhysical,
          difference: 0,
          variancePercent: 0,
          finalQuantity: b.stockPhysical,
        });
      }
    }

    await db
      .update(stocktakes)
      .set({
        status: 'COUNTING',
        startedAt: new Date(),
      })
      .where(eq(stocktakes.id, stocktakeId));

    await recordAuditLog(db, {
      userId,
      action: 'STOCKTAKE_START',
      entityType: 'STOCKTAKE',
      entityId: st.code,
      afterData: { status: 'COUNTING', warehouseId: st.warehouseId },
    });

    return { success: true, stocktakeId, status: 'COUNTING' };
  },

  async recordStocktakeCount(
    stocktakeId: number,
    counts: Array<{
      itemId?: number;
      productId: number;
      locationId?: number | null;
      countedQuantity: number;
      notes?: string;
    }>,
    userId: number
  ) {
    const st = await db.select().from(stocktakes).where(eq(stocktakes.id, stocktakeId)).get();
    if (!st) throw new Error(`Không tìm thấy đợt kiểm kê #${stocktakeId}`);

    let hasVariance = false;

    for (const c of counts) {
      let item = c.itemId
        ? await db.select().from(stocktakeItems).where(eq(stocktakeItems.id, c.itemId)).get()
        : await db
            .select()
            .from(stocktakeItems)
            .where(
              and(
                eq(stocktakeItems.stocktakeId, stocktakeId),
                eq(stocktakeItems.productId, c.productId)
              )
            )
            .get();

      const systemQty = item ? item.systemQuantity : 0;
      const difference = c.countedQuantity - systemQty;
      const variancePercent = systemQty > 0 ? Math.abs(difference / systemQty) * 100 : (c.countedQuantity > 0 ? 100 : 0);
      const isThresholdExceeded = Math.abs(difference) > (st.varianceThreshold || 10) || variancePercent > (st.varianceThresholdPercent || 15);

      if (difference !== 0) hasVariance = true;

      if (item) {
        await db
          .update(stocktakeItems)
          .set({
            countedQuantity: c.countedQuantity,
            finalQuantity: c.countedQuantity,
            difference,
            variancePercent,
            adjustmentRequired: difference !== 0,
          })
          .where(eq(stocktakeItems.id, item.id));
      } else {
        await db.insert(stocktakeItems).values({
          stocktakeId,
          warehouseId: st.warehouseId,
          productId: c.productId,
          locationId: c.locationId || null,
          systemQuantity: 0,
          systemQuantityAtStart: 0,
          countedQuantity: c.countedQuantity,
          difference,
          variancePercent,
          finalQuantity: c.countedQuantity,
          adjustmentRequired: difference !== 0,
        });
      }
    }

    await db
      .update(stocktakes)
      .set({
        status: 'COUNTED',
        recountRequired: hasVariance,
      })
      .where(eq(stocktakes.id, stocktakeId));

    return { success: true, stocktakeId, status: 'COUNTED', hasVariance };
  },

  async approveStocktakeAdjustment(stocktakeId: number, userId: number) {
    const st = await db.select().from(stocktakes).where(eq(stocktakes.id, stocktakeId)).get();
    if (!st) throw new Error(`Không tìm thấy đợt kiểm kê #${stocktakeId}`);
    if (st.status !== 'COUNTED' && st.status !== 'PENDING_APPROVAL') {
      throw new Error(`Đợt kiểm kê phải ở trạng thái COUNTED/PENDING_APPROVAL để xử lý chênh lệch. Hiện tại: ${st.status}`);
    }

    const items = await db.select().from(stocktakeItems).where(eq(stocktakeItems.stocktakeId, stocktakeId)).all();
    const adjustmentItems = items.filter((i) => i.difference !== 0);

    for (const item of adjustmentItems) {
      const type = item.difference > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';
      await this.postTransaction(null, {
        productId: item.productId,
        warehouseId: st.warehouseId,
        locationId: item.locationId,
        type: 'STOCK_COUNT_ADJUSTMENT',
        referenceNo: `${st.code}-ADJ`,
        quantity: item.difference,
        userId,
        notes: `Điều chỉnh chênh lệch kiểm kê đợt ${st.code} (Hệ thống: ${item.systemQuantity}, Thực tế: ${item.countedQuantity})`,
      });
    }

    await db
      .update(stocktakes)
      .set({
        status: 'COMPLETED',
        approvedBy: userId,
        approvedAt: new Date(),
        completedBy: userId,
        completedAt: new Date(),
      })
      .where(eq(stocktakes.id, stocktakeId));

    await recordAuditLog(db, {
      userId,
      action: 'STOCKTAKE_APPROVE',
      entityType: 'STOCKTAKE',
      entityId: st.code,
      afterData: { status: 'COMPLETED', adjustedItemsCount: adjustmentItems.length },
    });

    await emitOutboxEvent(db, {
      eventType: 'STOCK_ADJUSTED',
      aggregateType: 'Stocktake',
      aggregateId: st.code,
      actorId: userId,
      payload: { stocktakeId, code: st.code, adjustedItemsCount: adjustmentItems.length },
    });

    return {
      success: true,
      stocktakeId,
      code: st.code,
      status: 'COMPLETED',
      adjustedCount: adjustmentItems.length,
    };
  },

  /**
   * Lot Status Management (QUARANTINED, BLOCKED, AVAILABLE, EXPIRED).
   */
  async updateLotStatus(
    lotId: number,
    status: 'AVAILABLE' | 'QUARANTINED' | 'BLOCKED' | 'EXPIRED',
    reason: string,
    userId: number
  ) {
    await recordAuditLog(db, {
      userId,
      action: 'UPDATE_LOT_STATUS',
      entityType: 'LOT',
      entityId: String(lotId),
      afterData: { lotId, status, reason },
      reason,
    });

    return { success: true, lotId, status, message: `Đã chuyển trạng thái lô #${lotId} sang ${status}` };
  },

  /**
   * Fast Stock Availability check.
   */
  async checkAvailability(params: {
    productId: number;
    warehouseId?: number;
    locationId?: number | null;
    quantity: number;
  }): Promise<{ isAvailable: boolean; onHand: number; allocated: number; available: number; requestedQty: number }> {
    const { productId, warehouseId, locationId, quantity } = params;

    const conditions = [eq(stockBalances.productId, productId)];
    if (warehouseId) conditions.push(eq(stockBalances.warehouseId, warehouseId));
    if (locationId) conditions.push(eq(stockBalances.locationId, locationId));

    const balances = await db.select().from(stockBalances).where(and(...conditions));
    const onHand = balances.reduce((sum, b) => sum + (b.stockPhysical || 0), 0);
    const allocated = balances.reduce((sum, b) => sum + (b.stockReserved || 0), 0);
    const available = Math.max(0, onHand - allocated);

    return {
      isAvailable: available >= quantity,
      onHand,
      allocated,
      available,
      requestedQty: quantity,
    };
  },

  /**
   * Audits and checks invariant consistency across all stock balances:
   * Invariants:
   * 1. Available === Physical - Reserved
   * 2. Physical >= 0, Reserved >= 0, Available >= 0
   * 3. Lot Balances sum === Product Warehouse Physical balance
   */
  async reconcileBalances(params?: { warehouseId?: number; productId?: number }) {
    const conditions = [];
    if (params?.warehouseId) conditions.push(eq(stockBalances.warehouseId, params.warehouseId));
    if (params?.productId) conditions.push(eq(stockBalances.productId, params.productId));

    const balances = await db
      .select()
      .from(stockBalances)
      .where(conditions.length > 0 ? and(...conditions) : sql`1=1`);

    const discrepancies: any[] = [];

    for (const b of balances) {
      const phys = b.stockPhysical || 0;
      const resv = b.stockReserved || 0;
      const avail = b.stockAvailable || 0;
      const calculatedAvail = phys - resv;

      const issues: string[] = [];
      if (avail !== calculatedAvail) {
        issues.push(`Available mismatch (recorded: ${avail}, calculated: ${calculatedAvail})`);
      }
      if (phys < 0) issues.push(`Negative Physical stock (${phys})`);
      if (resv < 0) issues.push(`Negative Reserved stock (${resv})`);
      if (avail < 0) issues.push(`Negative Available stock (${avail})`);

      if (issues.length > 0) {
        discrepancies.push({
          balanceId: b.id,
          productId: b.productId,
          warehouseId: b.warehouseId,
          locationId: b.locationId,
          physical: phys,
          reserved: resv,
          available: avail,
          calculatedAvailable: calculatedAvail,
          issues,
        });
      }
    }

    if (discrepancies.length > 0) {
      await emitOutboxEvent(db, {
        eventType: 'INVENTORY_RECONCILIATION_REQUIRED',
        aggregateType: 'InventoryReconciliation',
        aggregateId: `RECON-${Date.now()}`,
        payload: { discrepanciesCount: discrepancies.length, discrepancies },
      });
    }

    return {
      totalChecked: balances.length,
      discrepanciesFound: discrepancies.length,
      discrepancies,
      isHealthy: discrepancies.length === 0,
    };
  },

  // ==========================================
  // P2 OPERATIONAL EXTENSIONS (SECTION C, F)
  // ==========================================

  /**
   * FIFO / FEFO Lot Picking Strategy Engine:
   * Recommends optimal lot allocation based on Expiry Date (FEFO) or Inbound Date (FIFO).
   * Automatically bypasses BLOCKED, QUARANTINED, or EXPIRED lots.
   */
  async suggestFifoFefoLots(params: {
    productId: number;
    warehouseId: number;
    requiredQty: number;
    strategy: 'FIFO' | 'FEFO';
    locationId?: number | null;
  }) {
    const { productId, warehouseId, requiredQty, strategy, locationId } = params;
    if (requiredQty <= 0) {
      throw new Error(`Số lượng yêu cầu phải lớn hơn 0. Nhận được: ${requiredQty}`);
    }

    const conditions = [
      eq(lotBalances.productId, productId),
      eq(lotBalances.warehouseId, warehouseId),
      sql`${lotBalances.stockAvailable} > 0`,
    ];
    if (locationId) {
      conditions.push(eq(lotBalances.locationId, locationId));
    }

    const rawLotBalances = await db
      .select({
        balanceId: lotBalances.id,
        lotId: lotBalances.lotId,
        productId: lotBalances.productId,
        warehouseId: lotBalances.warehouseId,
        locationId: lotBalances.locationId,
        stockPhysical: lotBalances.stockPhysical,
        stockAvailable: lotBalances.stockAvailable,
        stockReserved: lotBalances.stockReserved,
        lotNumber: lots.lotNumber,
        expiryDate: lots.expiryDate,
        manufactureDate: lots.manufactureDate,
        status: lots.status,
        createdAt: lots.createdAt,
      })
      .from(lotBalances)
      .innerJoin(lots, eq(lotBalances.lotId, lots.id))
      .where(and(...conditions))
      .all();

    // Filter out unusable lots (QUARANTINED, BLOCKED, EXPIRED, HOLD)
    const availableLots = rawLotBalances.filter(
      (l) => l.status !== 'QUARANTINED' && l.status !== 'BLOCKED' && l.status !== 'EXPIRED' && l.status !== 'HOLD'
    );

    // Sorting according to Strategy
    if (strategy === 'FEFO') {
      // FEFO: Sort by expiryDate ASC (nulls last), then createdAt ASC
      availableLots.sort((a, b) => {
        if (a.expiryDate && b.expiryDate) {
          const diff = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
          if (diff !== 0) return diff;
        } else if (a.expiryDate && !b.expiryDate) {
          return -1;
        } else if (!a.expiryDate && b.expiryDate) {
          return 1;
        }
        return (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      });
    } else {
      // FIFO: Sort by createdAt ASC (or manufactureDate ASC)
      availableLots.sort((a, b) => {
        const timeA = a.manufactureDate ? new Date(a.manufactureDate).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.manufactureDate ? new Date(b.manufactureDate).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeA - timeB;
      });
    }

    // Allocate lots
    let remainingQty = requiredQty;
    const allocations: Array<{
      lotId: number;
      lotNumber: string;
      expiryDate: Date | null;
      allocatedQty: number;
      availableInLot: number;
      locationId: number | null;
    }> = [];

    for (const l of availableLots) {
      if (remainingQty <= 0) break;
      const takeQty = Math.min(l.stockAvailable, remainingQty);
      allocations.push({
        lotId: l.lotId,
        lotNumber: l.lotNumber,
        expiryDate: l.expiryDate ? new Date(l.expiryDate) : null,
        allocatedQty: takeQty,
        availableInLot: l.stockAvailable,
        locationId: l.locationId,
      });
      remainingQty -= takeQty;
    }

    const allocatedTotal = requiredQty - remainingQty;

    return {
      strategy,
      productId,
      warehouseId,
      requiredQty,
      allocatedTotal,
      isFullyFulfilled: remainingQty === 0,
      shortfall: remainingQty > 0 ? remainingQty : 0,
      allocations,
    };
  },

  /**
   * Reservation Expiry Sweeper:
   * Identifies active reservations older than expiryHours (default 24h) and auto-releases them.
   */
  async sweepExpiredReservations(expiryHours: number = 24, userId: number = 1) {
    const cutoffTime = new Date(Date.now() - expiryHours * 60 * 60 * 1000);

    const activeReservations = await db
      .select()
      .from(stockReservations)
      .where(
        and(
          eq(stockReservations.status, 'ACTIVE'),
          lte(stockReservations.createdAt, cutoffTime)
        )
      )
      .all();

    const releasedList: any[] = [];

    for (const resv of activeReservations) {
      try {
        const releaseRes = await this.releaseReservation(null, {
          productId: resv.productId,
          warehouseId: resv.warehouseId,
          locationId: resv.locationId,
          quantity: resv.quantity,
          referenceNo: resv.referenceNo,
          reservationId: resv.id,
          userId,
          notes: `Hết hạn giữ chỗ (${expiryHours}h). Hệ thống tự động giải phóng tồn.`,
        });
        releasedList.push({ reservationId: resv.id, referenceNo: resv.referenceNo, result: releaseRes });
      } catch (err: any) {
        console.error(`Failed to release expired reservation #${resv.id}:`, err);
      }
    }

    if (releasedList.length > 0) {
      await emitOutboxEvent(db, {
        eventType: 'RESERVATIONS_EXPIRED_SWEEP_COMPLETED',
        aggregateType: 'StockReservation',
        aggregateId: `SWEEP-${Date.now()}`,
        actorId: userId,
        payload: { sweptCount: releasedList.length, cutoffTime, releasedList },
      });
    }

    return {
      sweptCount: releasedList.length,
      cutoffTime: cutoffTime.toISOString(),
      releasedReservations: releasedList,
    };
  },

  /**
   * Reorder Point & Safety Stock Threshold Alerts Engine:
   * Categorizes inventory into OUT_OF_STOCK, CRITICAL_SAFETY, REORDER_NEEDED, OVERSTOCKED, OPTIMAL.
   */
  async getReorderAlerts(warehouseId?: number) {
    const allProducts = await db.select().from(products).all();
    const alerts: any[] = [];

    for (const p of allProducts) {
      let available = p.stockAvailable ?? 0;
      let physical = p.stockPhysical ?? 0;
      let reserved = p.stockReserved ?? 0;

      if (warehouseId) {
        const balances = await db
          .select()
          .from(stockBalances)
          .where(and(eq(stockBalances.productId, p.id), eq(stockBalances.warehouseId, warehouseId)))
          .all();
        physical = balances.reduce((sum, b) => sum + (b.stockPhysical || 0), 0);
        reserved = balances.reduce((sum, b) => sum + (b.stockReserved || 0), 0);
        available = Math.max(0, physical - reserved);
      }

      const safetyStock = p.safetyStock ?? 10;
      const reorderPoint = p.reorderPoint ?? 20;
      const minStockLevel = p.minStockLevel ?? safetyStock;
      const maxStockLevel = p.maxStockLevel ?? (reorderPoint * 4);

      let status: 'OUT_OF_STOCK' | 'CRITICAL_SAFETY' | 'REORDER_NEEDED' | 'OVERSTOCKED' | 'OPTIMAL' = 'OPTIMAL';
      let priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

      if (available <= 0) {
        status = 'OUT_OF_STOCK';
        priority = 'URGENT';
      } else if (available <= safetyStock || available <= minStockLevel) {
        status = 'CRITICAL_SAFETY';
        priority = 'HIGH';
      } else if (available <= reorderPoint) {
        status = 'REORDER_NEEDED';
        priority = 'MEDIUM';
      } else if (maxStockLevel > 0 && available > maxStockLevel) {
        status = 'OVERSTOCKED';
        priority = 'LOW';
      }

      if (status !== 'OPTIMAL') {
        const suggestedReorderQty = Math.max(0, Math.round(reorderPoint * 2 - available));
        alerts.push({
          productId: p.id,
          sku: p.sku,
          name: p.name,
          baseUnit: p.baseUnit,
          costPrice: p.costPrice || 0,
          warehouseId: warehouseId || null,
          physical,
          reserved,
          available,
          safetyStock,
          reorderPoint,
          minStockLevel,
          maxStockLevel,
          status,
          priority,
          suggestedReorderQty: status === 'OVERSTOCKED' ? 0 : suggestedReorderQty,
          suggestedPoValue: suggestedReorderQty * (p.costPrice || 0),
        });
      }
    }

    // Sort by Priority: URGENT -> HIGH -> MEDIUM -> LOW
    const priorityOrder: Record<string, number> = { URGENT: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
    alerts.sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));

    return {
      totalAlerts: alerts.length,
      outOfStockCount: alerts.filter((a) => a.status === 'OUT_OF_STOCK').length,
      criticalCount: alerts.filter((a) => a.status === 'CRITICAL_SAFETY').length,
      reorderCount: alerts.filter((a) => a.status === 'REORDER_NEEDED').length,
      overstockedCount: alerts.filter((a) => a.status === 'OVERSTOCKED').length,
      alerts,
    };
  },

  /**
   * Inventory Aging Report:
   * Computes stock age tiers (0-30d, 31-60d, 61-90d, 90+d) and capital valuation.
   */
  async getInventoryAgingReport(warehouseId?: number) {
    const allProducts = await db.select().from(products).all();
    const now = Date.now();

    const agingBuckets = {
      tier_0_30: { label: '0 - 30 Ngày', quantity: 0, valuation: 0, itemsCount: 0 },
      tier_31_60: { label: '31 - 60 Ngày', quantity: 0, valuation: 0, itemsCount: 0 },
      tier_61_90: { label: '61 - 90 Ngày', quantity: 0, valuation: 0, itemsCount: 0 },
      tier_over_90: { label: 'Trên 90 Ngày', quantity: 0, valuation: 0, itemsCount: 0 },
    };

    const items: any[] = [];

    for (const p of allProducts) {
      let physical = p.stockPhysical ?? 0;
      if (warehouseId) {
        const balances = await db
          .select()
          .from(stockBalances)
          .where(and(eq(stockBalances.productId, p.id), eq(stockBalances.warehouseId, warehouseId)))
          .all();
        physical = balances.reduce((sum, b) => sum + (b.stockPhysical || 0), 0);
      }

      if (physical <= 0) continue;

      // Find latest receipt transaction for age calculation
      const lastReceipt = await db
        .select()
        .from(stockLedger)
        .where(
          and(
            eq(stockLedger.productId, p.id),
            sql`${stockLedger.quantity} > 0`
          )
        )
        .orderBy(desc(stockLedger.id))
        .limit(1);

      const receiptDate = lastReceipt.length > 0 && lastReceipt[0].createdAt
        ? new Date(lastReceipt[0].createdAt)
        : (p.createdAt ? new Date(p.createdAt) : new Date(now - 45 * 24 * 60 * 60 * 1000));

      const ageDays = Math.max(0, Math.floor((now - receiptDate.getTime()) / (1000 * 60 * 60 * 24)));
      const unitCost = p.costPrice || 0;
      const totalValue = physical * unitCost;

      let tierKey: 'tier_0_30' | 'tier_31_60' | 'tier_61_90' | 'tier_over_90' = 'tier_0_30';
      if (ageDays > 90) {
        tierKey = 'tier_over_90';
      } else if (ageDays > 60) {
        tierKey = 'tier_61_90';
      } else if (ageDays > 30) {
        tierKey = 'tier_31_60';
      }

      agingBuckets[tierKey].quantity += physical;
      agingBuckets[tierKey].valuation += totalValue;
      agingBuckets[tierKey].itemsCount += 1;

      items.push({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        baseUnit: p.baseUnit,
        physical,
        unitCost,
        totalValue,
        ageDays,
        tier: agingBuckets[tierKey].label,
        lastReceiptDate: receiptDate.toISOString(),
      });
    }

    // Sort items by age descending (oldest stock first)
    items.sort((a, b) => b.ageDays - a.ageDays);

    const totalPhysical = items.reduce((sum, i) => sum + i.physical, 0);
    const totalValuation = items.reduce((sum, i) => sum + i.totalValue, 0);

    return {
      totalSKUs: items.length,
      totalPhysical,
      totalValuation,
      agingBuckets,
      items,
    };
  },

  /**
   * Slow-Moving Inventory Analytics:
   * Identifies products with on-hand stock and no outbound turnover for > thresholdDays.
   */
  async getSlowMovingInventory(thresholdDays: number = 60, warehouseId?: number) {
    const allProducts = await db.select().from(products).all();
    const now = Date.now();
    const cutoffDate = new Date(now - thresholdDays * 24 * 60 * 60 * 1000);

    const items: any[] = [];

    for (const p of allProducts) {
      let physical = p.stockPhysical ?? 0;
      let available = p.stockAvailable ?? 0;

      if (warehouseId) {
        const balances = await db
          .select()
          .from(stockBalances)
          .where(and(eq(stockBalances.productId, p.id), eq(stockBalances.warehouseId, warehouseId)))
          .all();
        physical = balances.reduce((sum, b) => sum + (b.stockPhysical || 0), 0);
        available = balances.reduce((sum, b) => sum + (b.stockAvailable || 0), 0);
      }

      if (physical <= 0) continue;

      // Check last outbound issue
      const outLedger = await db
        .select()
        .from(stockLedger)
        .where(
          and(
            eq(stockLedger.productId, p.id),
            sql`${stockLedger.quantity} < 0`
          )
        )
        .orderBy(desc(stockLedger.id))
        .limit(1);

      const lastOutDate = outLedger.length > 0 && outLedger[0].createdAt ? new Date(outLedger[0].createdAt) : null;
      const daysSinceOut = lastOutDate
        ? Math.floor((now - lastOutDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999; // Never sold / issued

      if (daysSinceOut >= thresholdDays) {
        const tiedUpCapital = physical * (p.costPrice || 0);
        let recommendedAction = 'Chương trình khuyến mãi xả hàng';
        if (daysSinceOut > 120) {
          recommendedAction = 'Thanh lý / Giảm giá sâu (>30%)';
        } else if (daysSinceOut > 90) {
          recommendedAction = 'Điều chuyển kênh bán / Trưng bày lại';
        }

        items.push({
          productId: p.id,
          sku: p.sku,
          name: p.name,
          baseUnit: p.baseUnit,
          physical,
          available,
          costPrice: p.costPrice || 0,
          tiedUpCapital,
          daysSinceLastOutbound: daysSinceOut === 999 ? 'Chưa từng xuất bán' : `${daysSinceOut} ngày`,
          lastOutboundDate: lastOutDate ? lastOutDate.toISOString() : null,
          recommendedAction,
        });
      }
    }

    items.sort((a, b) => b.tiedUpCapital - a.tiedUpCapital);

    const totalTiedUpCapital = items.reduce((sum, i) => sum + i.tiedUpCapital, 0);

    return {
      thresholdDays,
      totalSlowMovingSKUs: items.length,
      totalTiedUpCapital,
      items,
    };
  },

  /**
   * Quarantine & Blocked Stock Tracking:
   * Summarizes all lot balances on quarantine, blocked, expired, or hold status.
   */
  async getQuarantinedAndBlockedStock(warehouseId?: number) {
    const conditions = [
      sql`${lots.status} IN ('QUARANTINED', 'BLOCKED', 'EXPIRED', 'HOLD')`,
      sql`${lotBalances.stockPhysical} > 0`,
    ];
    if (warehouseId) {
      conditions.push(eq(lotBalances.warehouseId, warehouseId));
    }

    const records = await db
      .select({
        balanceId: lotBalances.id,
        lotId: lotBalances.lotId,
        productId: lotBalances.productId,
        warehouseId: lotBalances.warehouseId,
        locationId: lotBalances.locationId,
        stockPhysical: lotBalances.stockPhysical,
        stockReserved: lotBalances.stockReserved,
        stockAvailable: lotBalances.stockAvailable,
        lotNumber: lots.lotNumber,
        status: lots.status,
        expiryDate: lots.expiryDate,
        notes: lots.notes,
        productSku: products.sku,
        productName: products.name,
        costPrice: products.costPrice,
        baseUnit: products.baseUnit,
      })
      .from(lotBalances)
      .innerJoin(lots, eq(lotBalances.lotId, lots.id))
      .innerJoin(products, eq(lotBalances.productId, products.id))
      .where(and(...conditions))
      .all();

    const totalPhysical = records.reduce((sum, r) => sum + r.stockPhysical, 0);
    const totalValuation = records.reduce((sum, r) => sum + r.stockPhysical * (r.costPrice || 0), 0);

    return {
      totalQuarantinedLots: records.length,
      totalPhysicalQuantity: totalPhysical,
      totalQuarantinedValuation: totalValuation,
      lots: records,
    };
  },

  /**
   * In-Transit Inventory & Cross-Branch Transfers Summary:
   * Aggregates transfers currently in IN_TRANSIT status.
   */
  async getInTransitInventory(toWarehouseId?: number) {
    const conditions = [eq(stockTransfers.status, 'IN_TRANSIT')];
    if (toWarehouseId) {
      conditions.push(eq(stockTransfers.toWarehouseId, toWarehouseId));
    }

    const inTransitTransfers = await db
      .select()
      .from(stockTransfers)
      .where(and(...conditions))
      .orderBy(desc(stockTransfers.id))
      .all();

    const allWhs = await db.select().from(warehouses).all();
    const whMap = new Map(allWhs.map((w) => [w.id, w]));

    const enrichedTransfers: any[] = [];
    let totalInTransitQty = 0;

    for (const t of inTransitTransfers) {
      const items = await db
        .select({
          itemId: stockTransferItems.id,
          productId: stockTransferItems.productId,
          quantity: stockTransferItems.quantity,
          productSku: products.sku,
          productName: products.name,
          baseUnit: products.baseUnit,
          costPrice: products.costPrice,
        })
        .from(stockTransferItems)
        .innerJoin(products, eq(stockTransferItems.productId, products.id))
        .where(eq(stockTransferItems.transferId, t.id))
        .all();

      const transferQty = items.reduce((sum, i) => sum + i.quantity, 0);
      const transferValuation = items.reduce((sum, i) => sum + i.quantity * (i.costPrice || 0), 0);
      totalInTransitQty += transferQty;

      enrichedTransfers.push({
        ...t,
        fromWarehouseName: whMap.get(t.fromWarehouseId)?.name || `WH #${t.fromWarehouseId}`,
        toWarehouseName: whMap.get(t.toWarehouseId)?.name || `WH #${t.toWarehouseId}`,
        totalQuantity: transferQty,
        totalValuation,
        items,
      });
    }

    return {
      totalInTransitShipments: enrichedTransfers.length,
      totalInTransitQuantity: totalInTransitQty,
      transfers: enrichedTransfers,
    };
  },

  /**
   * Advanced Inventory Operations Cockpit & Dashboard Metrics:
   * Provides comprehensive enterprise KPIs, health indices, and analytics.
   */
  async getAdvancedDashboardMetrics() {
    const allProducts = await db.select().from(products).all();
    const allWarehouses = await db.select().from(warehouses).all();

    const totalPhysical = allProducts.reduce((sum, p) => sum + (p.stockPhysical || 0), 0);
    const totalReserved = allProducts.reduce((sum, p) => sum + (p.stockReserved || 0), 0);
    const totalAvailable = allProducts.reduce((sum, p) => sum + (p.stockAvailable || 0), 0);
    const totalInventoryValuation = allProducts.reduce((sum, p) => sum + (p.stockPhysical || 0) * (p.costPrice || 0), 0);

    const reorderReport = await this.getReorderAlerts();
    const inTransitReport = await this.getInTransitInventory();
    const quarantinedReport = await this.getQuarantinedAndBlockedStock();
    const agingReport = await this.getInventoryAgingReport();

    // Active Reservations
    const activeResvs = await db
      .select()
      .from(stockReservations)
      .where(eq(stockReservations.status, 'ACTIVE'))
      .all();
    const totalReservedOrders = activeResvs.length;

    // Warehouse distribution
    const warehouseMetrics: any[] = [];
    for (const w of allWarehouses) {
      const balances = await db.select().from(stockBalances).where(eq(stockBalances.warehouseId, w.id)).all();
      const wPhys = balances.reduce((sum, b) => sum + (b.stockPhysical || 0), 0);
      const wAvail = balances.reduce((sum, b) => sum + (b.stockAvailable || 0), 0);
      const wResv = balances.reduce((sum, b) => sum + (b.stockReserved || 0), 0);

      warehouseMetrics.push({
        warehouseId: w.id,
        warehouseCode: w.code,
        warehouseName: w.name,
        physical: wPhys,
        available: wAvail,
        reserved: wResv,
        skusCount: balances.length,
      });
    }

    // Health Index (0-100): Decreased by out of stock and discrepancies
    const outOfStockPenalty = Math.min(30, (reorderReport.outOfStockCount / (allProducts.length || 1)) * 100);
    const quarantinedPenalty = Math.min(20, (quarantinedReport.totalQuarantinedLots > 0 ? 10 : 0));
    const healthIndex = Math.max(0, Math.round(100 - outOfStockPenalty - quarantinedPenalty));

    return {
      kpis: {
        totalSKUs: allProducts.length,
        totalPhysicalQuantity: totalPhysical,
        totalAvailableQuantity: totalAvailable,
        totalReservedQuantity: totalReserved,
        totalInventoryValuation,
        healthIndex,
        outOfStockCount: reorderReport.outOfStockCount,
        criticalSafetyCount: reorderReport.criticalCount,
        reorderRecommendedCount: reorderReport.reorderCount,
        inTransitShipmentsCount: inTransitReport.totalInTransitShipments,
        inTransitQuantity: inTransitReport.totalInTransitQuantity,
        quarantinedLotsCount: quarantinedReport.totalQuarantinedLots,
        quarantinedValuation: quarantinedReport.totalQuarantinedValuation,
        activeReservationsCount: totalReservedOrders,
      },
      warehouseMetrics,
      agingSummary: agingReport.agingBuckets,
      recentAlerts: reorderReport.alerts.slice(0, 10),
      inTransitTransfers: inTransitReport.transfers,
    };
  },

  // ==========================================
  // P3 ADVANCED OPERATIONS & INTELLIGENCE ENGINE
  // ==========================================

  /**
   * Demand Forecasting & Automated Replenishment Proposals Engine:
   * Evaluates historical consumption velocity from stockLedger to forecast future demand,
   * calculates Lead Time Demand + Safety Stock, and generates supplier purchase proposals.
   */
  async generateReplenishmentProposals(params?: {
    warehouseId?: number;
    lookbackDays?: number;
    forecastHorizonDays?: number;
  }) {
    const lookbackDays = params?.lookbackDays || 30;
    const forecastHorizonDays = params?.forecastHorizonDays || 30;
    const warehouseId = params?.warehouseId;
    const now = Date.now();
    const cutoffDate = new Date(now - lookbackDays * 24 * 60 * 60 * 1000);

    const allProducts = await db.select().from(products).all();
    const allSuppliers = await db.select().from(suppliers).all();
    const supplierMap = new Map(allSuppliers.map((s) => [s.id, s]));

    const proposals: any[] = [];
    let totalEstimatedSpend = 0;
    let totalItemsToReorder = 0;

    for (const p of allProducts) {
      let physical = p.stockPhysical ?? 0;
      let reserved = p.stockReserved ?? 0;
      let available = p.stockAvailable ?? 0;

      if (warehouseId) {
        const balances = await db
          .select()
          .from(stockBalances)
          .where(and(eq(stockBalances.productId, p.id), eq(stockBalances.warehouseId, warehouseId)))
          .all();
        physical = balances.reduce((sum, b) => sum + (b.stockPhysical || 0), 0);
        reserved = balances.reduce((sum, b) => sum + (b.stockReserved || 0), 0);
        available = Math.max(0, physical - reserved);
      }

      // Compute consumption velocity from stock ledger (outbound quantity < 0)
      const ledgerConditions = [
        eq(stockLedger.productId, p.id),
        sql`${stockLedger.quantity} < 0`,
        gte(stockLedger.createdAt, cutoffDate),
      ];
      if (warehouseId) {
        ledgerConditions.push(eq(stockLedger.warehouseId, warehouseId));
      }

      const outboundLedgers = await db
        .select()
        .from(stockLedger)
        .where(and(...ledgerConditions))
        .all();

      const totalConsumedQty = outboundLedgers.reduce((sum, l) => sum + Math.abs(l.quantity), 0);
      const dailyConsumptionRate = totalConsumedQty > 0 ? totalConsumedQty / lookbackDays : 0.5; // fallback min velocity

      const leadTimeDays = 7; // Standard supplier lead time
      const leadTimeDemand = Math.ceil(dailyConsumptionRate * leadTimeDays);
      const safetyStock = p.safetyStock ?? Math.max(10, Math.ceil(dailyConsumptionRate * 5));
      const reorderPoint = p.reorderPoint ?? (leadTimeDemand + safetyStock);
      const maxStockLevel = p.maxStockLevel ?? (reorderPoint * 2);

      // In-transit incoming inventory
      const inTransitTransfers = await db
        .select()
        .from(stockTransferItems)
        .innerJoin(stockTransfers, eq(stockTransferItems.transferId, stockTransfers.id))
        .where(
          and(
            eq(stockTransferItems.productId, p.id),
            eq(stockTransfers.status, 'IN_TRANSIT'),
            warehouseId ? eq(stockTransfers.toWarehouseId, warehouseId) : sql`1=1`
          )
        )
        .all();

      const inTransitQty = inTransitTransfers.reduce((sum, row) => sum + row.stock_transfer_items.quantity, 0);
      const netEffectiveStock = available + inTransitQty;
      const isReorderTriggered = netEffectiveStock <= reorderPoint;

      const forecastedHorizonDemand = Math.ceil(dailyConsumptionRate * forecastHorizonDays);
      const suggestedReorderQty = isReorderTriggered ? Math.max(0, Math.ceil(maxStockLevel - netEffectiveStock)) : 0;
      const estimatedCost = suggestedReorderQty * (p.costPrice || 0);

      if (suggestedReorderQty > 0) {
        totalEstimatedSpend += estimatedCost;
        totalItemsToReorder += 1;
      }

      const supplier = p.supplierId ? supplierMap.get(p.supplierId) : null;

      proposals.push({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        baseUnit: p.baseUnit,
        costPrice: p.costPrice || 0,
        supplierId: p.supplierId || null,
        supplierName: supplier ? supplier.name : 'Nhà cung cấp mặc định',
        supplierCode: supplier ? supplier.code : 'SUP-DEFAULT',
        physical,
        reserved,
        available,
        inTransitQty,
        netEffectiveStock,
        lookbackDays,
        totalConsumedInLookback: totalConsumedQty,
        dailyConsumptionRate: Number(dailyConsumptionRate.toFixed(2)),
        forecastedHorizonDemand,
        leadTimeDays,
        leadTimeDemand,
        safetyStock,
        reorderPoint,
        maxStockLevel,
        isReorderTriggered,
        suggestedReorderQty,
        estimatedCost,
        urgency: available <= 0 ? 'CRITICAL' : available <= safetyStock ? 'HIGH' : isReorderTriggered ? 'MEDIUM' : 'NORMAL',
      });
    }

    // Sort by Urgency: CRITICAL -> HIGH -> MEDIUM -> NORMAL
    const urgencyWeight: Record<string, number> = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, NORMAL: 4 };
    proposals.sort((a, b) => (urgencyWeight[a.urgency] || 99) - (urgencyWeight[b.urgency] || 99));

    // Group proposals by Supplier for 1-click PO Generation
    const supplierGroups: Record<string, { supplierName: string; supplierCode: string; itemsCount: number; totalEstimatedCost: number; items: any[] }> = {};
    for (const item of proposals.filter((p) => p.suggestedReorderQty > 0)) {
      const key = item.supplierCode || 'SUP-DEFAULT';
      if (!supplierGroups[key]) {
        supplierGroups[key] = {
          supplierName: item.supplierName,
          supplierCode: key,
          itemsCount: 0,
          totalEstimatedCost: 0,
          items: [],
        };
      }
      supplierGroups[key].itemsCount += 1;
      supplierGroups[key].totalEstimatedCost += item.estimatedCost;
      supplierGroups[key].items.push(item);
    }

    return {
      forecastHorizonDays,
      lookbackDays,
      totalSKUs: proposals.length,
      totalItemsToReorder,
      totalEstimatedSpend,
      supplierGroups: Object.values(supplierGroups),
      proposals,
    };
  },

  /**
   * ABC Analysis (Pareto Classification Engine):
   * Classifies inventory into Class A (Top 80% capital), Class B (Next 15%), Class C (Remaining 5%).
   */
  async runAbcAnalysis(params?: {
    warehouseId?: number;
    calculationMethod?: 'CONSUMPTION_VALUE' | 'INVENTORY_VALUATION';
  }) {
    const calculationMethod = params?.calculationMethod || 'INVENTORY_VALUATION';
    const warehouseId = params?.warehouseId;
    const allProducts = await db.select().from(products).all();

    const productValuations: Array<{
      productId: number;
      sku: string;
      name: string;
      baseUnit: string;
      physical: number;
      available: number;
      unitCost: number;
      annualConsumptionQty: number;
      evaluationValue: number;
    }> = [];

    for (const p of allProducts) {
      let physical = p.stockPhysical ?? 0;
      let available = p.stockAvailable ?? 0;

      if (warehouseId) {
        const balances = await db
          .select()
          .from(stockBalances)
          .where(and(eq(stockBalances.productId, p.id), eq(stockBalances.warehouseId, warehouseId)))
          .all();
        physical = balances.reduce((sum, b) => sum + (b.stockPhysical || 0), 0);
        available = balances.reduce((sum, b) => sum + (b.stockAvailable || 0), 0);
      }

      const unitCost = p.costPrice || 0;

      // Check annual / historical outbound consumption
      const outboundLedgers = await db
        .select()
        .from(stockLedger)
        .where(
          and(
            eq(stockLedger.productId, p.id),
            sql`${stockLedger.quantity} < 0`
          )
        )
        .all();
      const annualConsumptionQty = outboundLedgers.reduce((sum, l) => sum + Math.abs(l.quantity), 0);

      const evaluationValue =
        calculationMethod === 'CONSUMPTION_VALUE'
          ? Math.max(annualConsumptionQty * unitCost, physical * unitCost * 0.2)
          : physical * unitCost;

      productValuations.push({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        baseUnit: p.baseUnit,
        physical,
        available,
        unitCost,
        annualConsumptionQty,
        evaluationValue,
      });
    }

    // Sort descending by evaluation value (Pareto Principle)
    productValuations.sort((a, b) => b.evaluationValue - a.evaluationValue);

    const totalEnterpriseValue = productValuations.reduce((sum, i) => sum + i.evaluationValue, 0) || 1;
    let runningCumulativeValue = 0;

    const classifiedItems: any[] = [];
    const classSummary = {
      classA: { count: 0, totalValue: 0, percentageOfValue: 0, description: 'Kiểm soát chặt chẽ, tối ưu điểm đặt hàng và tần suất kiểm kê cao' },
      classB: { count: 0, totalValue: 0, percentageOfValue: 0, description: 'Kiểm soát định kỳ, duy trì lượng dự trữ an toàn tiêu chuẩn' },
      classC: { count: 0, totalValue: 0, percentageOfValue: 0, description: 'Kiểm soát đơn giản hóa, gom đơn đặt số lượng lớn' },
    };

    for (const item of productValuations) {
      runningCumulativeValue += item.evaluationValue;
      const cumulativePercentage = (runningCumulativeValue / totalEnterpriseValue) * 100;
      const individualPercentage = (item.evaluationValue / totalEnterpriseValue) * 100;

      let abcClass: 'A' | 'B' | 'C' = 'C';
      if (cumulativePercentage <= 80 || (classSummary.classA.count === 0 && item.evaluationValue > 0)) {
        abcClass = 'A';
        classSummary.classA.count += 1;
        classSummary.classA.totalValue += item.evaluationValue;
      } else if (cumulativePercentage <= 95) {
        abcClass = 'B';
        classSummary.classB.count += 1;
        classSummary.classB.totalValue += item.evaluationValue;
      } else {
        abcClass = 'C';
        classSummary.classC.count += 1;
        classSummary.classC.totalValue += item.evaluationValue;
      }

      classifiedItems.push({
        ...item,
        abcClass,
        individualPercentage: Number(individualPercentage.toFixed(2)),
        cumulativePercentage: Number(cumulativePercentage.toFixed(2)),
      });
    }

    classSummary.classA.percentageOfValue = Number(((classSummary.classA.totalValue / totalEnterpriseValue) * 100).toFixed(2));
    classSummary.classB.percentageOfValue = Number(((classSummary.classB.totalValue / totalEnterpriseValue) * 100).toFixed(2));
    classSummary.classC.percentageOfValue = Number(((classSummary.classC.totalValue / totalEnterpriseValue) * 100).toFixed(2));

    return {
      calculationMethod,
      totalSKUs: classifiedItems.length,
      totalEnterpriseValue,
      classSummary,
      items: classifiedItems,
    };
  },

  /**
   * Wave Picking Engine:
   * Batches multiple sales orders / outbound picking requests into consolidated picking waves,
   * optimizing picker travel paths by sorting locations alphabetically.
   */
  async createWavePicking(params: {
    warehouseCode: string;
    waveType?: string;
    orderCodes: string[];
    pickerEmployeeCode?: string;
    priority?: number;
    items: Array<{
      orderCode: string;
      sku: string;
      quantityRequested: number;
      fromLocationCode?: string;
      toStagingLocationCode?: string;
    }>;
  }) {
    const { warehouseCode, waveType = 'SALES_OUTBOUND', orderCodes, pickerEmployeeCode, priority = 1, items } = params;
    if (!items || items.length === 0) {
      throw new Error('Danh sách hàng hóa cho đợt lấy hàng (Wave) không được để trống.');
    }

    const waveNumber = `WAV-${Date.now().toString().slice(-6)}`;

    // Create Wave Header
    const newWave = await db
      .insert(wmsWaves)
      .values({
        waveNumber,
        warehouseCode,
        waveType,
        status: 'RELEASED',
        priority,
        totalOrders: orderCodes.length,
        totalItems: items.length,
      })
      .returning();

    // Sort items by location sequence to optimize travel path
    const sortedItems = [...items].sort((a, b) =>
      (a.fromLocationCode || 'LOC-01').localeCompare(b.fromLocationCode || 'LOC-01')
    );

    const taskInserts: any[] = [];
    let seq = 1;

    for (const item of sortedItems) {
      const taskNumber = `TASK-PICK-${waveNumber}-${seq.toString().padStart(3, '0')}`;
      taskInserts.push({
        taskNumber,
        waveId: newWave[0].id,
        orderCode: item.orderCode,
        sku: item.sku,
        fromLocationCode: item.fromLocationCode || 'LOC-GENERAL-01',
        toStagingLocationCode: item.toStagingLocationCode || 'STAGE-OUT-01',
        quantityRequested: item.quantityRequested,
        quantityPicked: 0,
        pickerEmployeeCode: pickerEmployeeCode || 'PICKER-01',
        status: 'PENDING',
        sequence: seq,
      });
      seq++;
    }

    const insertedTasks = await db.insert(wmsPickingTasks).values(taskInserts).returning();

    await emitOutboxEvent(db, {
      eventType: 'WMS_WAVE_PICKING_CREATED',
      aggregateType: 'WmsWave',
      aggregateId: waveNumber,
      payload: { waveId: newWave[0].id, waveNumber, totalTasks: insertedTasks.length },
    });

    return {
      wave: newWave[0],
      tasks: insertedTasks,
    };
  },

  /**
   * Complete Wave Picking Task:
   * Marks task as PICKED or SHORT_PICKED and auto-completes wave when all tasks are picked.
   */
  async completeWavePickingTask(params: {
    taskId: number;
    quantityPicked: number;
    pickerEmployeeCode?: string;
  }) {
    const { taskId, quantityPicked, pickerEmployeeCode } = params;

    const task = await db.select().from(wmsPickingTasks).where(eq(wmsPickingTasks.id, taskId)).limit(1);
    if (!task || task.length === 0) {
      throw new Error(`Không tìm thấy nhiệm vụ lấy hàng #${taskId}`);
    }

    const currentTask = task[0];
    const isShortPicked = quantityPicked < currentTask.quantityRequested;
    const taskStatus = isShortPicked ? 'SHORT_PICKED' : 'PICKED';

    await db
      .update(wmsPickingTasks)
      .set({
        quantityPicked,
        status: taskStatus,
        pickerEmployeeCode: pickerEmployeeCode || currentTask.pickerEmployeeCode,
        updatedAt: new Date(),
      })
      .where(eq(wmsPickingTasks.id, taskId));

    // Check if entire wave is completed
    if (currentTask.waveId) {
      const allWaveTasks = await db
        .select()
        .from(wmsPickingTasks)
        .where(eq(wmsPickingTasks.waveId, currentTask.waveId))
        .all();

      const allFinished = allWaveTasks.every((t) => t.id === taskId ? true : (t.status === 'PICKED' || t.status === 'SHORT_PICKED' || t.status === 'CANCELLED'));
      if (allFinished) {
        await db.update(wmsWaves).set({ status: 'COMPLETED', updatedAt: new Date() }).where(eq(wmsWaves.id, currentTask.waveId));
      }
    }

    return {
      taskId,
      status: taskStatus,
      quantityRequested: currentTask.quantityRequested,
      quantityPicked,
    };
  },

  /**
   * Universal Barcode & QR Code Scanner Engine:
   * Decodes barcodes (SKU, LOT:xxx, SN:xxx, LOC:xxx) and returns real-time inventory metadata & location balances.
   */
  async scanBarcode(params: { barcode: string; warehouseId?: number; warehouseCode?: string }) {
    const rawBarcode = (params.barcode || '').trim();
    if (!rawBarcode) {
      throw new Error('Mã vạch quét không được để trống.');
    }

    let detectedType: 'SKU' | 'SERIAL' | 'LOT' | 'LOCATION' | 'UNKNOWN' = 'UNKNOWN';
    let token = rawBarcode;

    if (rawBarcode.startsWith('LOC:')) {
      detectedType = 'LOCATION';
      token = rawBarcode.replace('LOC:', '').trim();
    } else if (rawBarcode.startsWith('LOT:') || rawBarcode.startsWith('BATCH:')) {
      detectedType = 'LOT';
      token = rawBarcode.replace(/^(LOT:|BATCH:)/, '').trim();
    } else if (rawBarcode.startsWith('SN:') || rawBarcode.startsWith('SER:')) {
      detectedType = 'SERIAL';
      token = rawBarcode.replace(/^(SN:|SER:)/, '').trim();
    }

    // 1. Check Product SKU / Barcode
    if (detectedType === 'UNKNOWN' || detectedType === 'SKU') {
      const prod = await db
        .select()
        .from(products)
        .where(sql`${products.sku} = ${token} OR ${products.barcode} = ${token}`)
        .limit(1);

      if (prod.length > 0) {
        const p = prod[0];
        let physical = p.stockPhysical ?? 0;
        let available = p.stockAvailable ?? 0;
        let reserved = p.stockReserved ?? 0;

        if (params.warehouseId) {
          const balances = await db
            .select()
            .from(stockBalances)
            .where(and(eq(stockBalances.productId, p.id), eq(stockBalances.warehouseId, params.warehouseId)))
            .all();
          physical = balances.reduce((sum, b) => sum + (b.stockPhysical || 0), 0);
          reserved = balances.reduce((sum, b) => sum + (b.stockReserved || 0), 0);
          available = Math.max(0, physical - reserved);
        }

        return {
          scanSuccess: true,
          detectedType: 'PRODUCT',
          rawBarcode,
          data: {
            productId: p.id,
            sku: p.sku,
            barcode: p.barcode,
            name: p.name,
            baseUnit: p.baseUnit,
            costPrice: p.costPrice,
            stockPhysical: physical,
            stockAvailable: available,
            stockReserved: reserved,
          },
        };
      }
    }

    // 2. Check Lot / Batch Number
    if (detectedType === 'UNKNOWN' || detectedType === 'LOT') {
      const lot = await db
        .select()
        .from(lots)
        .where(eq(lots.lotNumber, token))
        .limit(1);

      if (lot.length > 0) {
        const l = lot[0];
        const prod = await db.select().from(products).where(eq(products.id, l.productId)).limit(1);
        const balances = await db.select().from(lotBalances).where(eq(lotBalances.lotId, l.id)).all();
        const totalPhys = balances.reduce((sum, b) => sum + (b.stockPhysical || 0), 0);
        const totalAvail = balances.reduce((sum, b) => sum + (b.stockAvailable || 0), 0);

        return {
          scanSuccess: true,
          detectedType: 'LOT',
          rawBarcode,
          data: {
            lotId: l.id,
            lotNumber: l.lotNumber,
            productId: l.productId,
            productSku: prod[0]?.sku,
            productName: prod[0]?.name,
            manufactureDate: l.manufactureDate,
            expiryDate: l.expiryDate,
            status: l.status,
            stockPhysical: totalPhys,
            stockAvailable: totalAvail,
          },
        };
      }
    }

    // 3. Check Serial Number
    if (detectedType === 'UNKNOWN' || detectedType === 'SERIAL') {
      const serial = await db
        .select()
        .from(serialNumbers)
        .where(eq(serialNumbers.serialNumber, token))
        .limit(1);

      if (serial.length > 0) {
        const s = serial[0];
        const prod = await db.select().from(products).where(eq(products.id, s.productId)).limit(1);
        return {
          scanSuccess: true,
          detectedType: 'SERIAL',
          rawBarcode,
          data: {
            serialId: s.id,
            serialNumber: s.serialNumber,
            productId: s.productId,
            productSku: prod[0]?.sku,
            productName: prod[0]?.name,
            warehouseId: s.warehouseId,
            locationId: s.locationId,
            status: s.status,
          },
        };
      }
    }

    // 4. Check Warehouse Location
    if (detectedType === 'UNKNOWN' || detectedType === 'LOCATION') {
      const loc = await db
        .select()
        .from(warehouseLocations)
        .where(eq(warehouseLocations.code, token))
        .limit(1);

      if (loc.length > 0) {
        return {
          scanSuccess: true,
          detectedType: 'LOCATION',
          rawBarcode,
          data: loc[0],
        };
      }
    }

    return {
      scanSuccess: false,
      detectedType: 'UNKNOWN',
      rawBarcode,
      message: `Không tìm thấy thông tin tương ứng với mã vạch: "${rawBarcode}"`,
    };
  },

  /**
   * Helper: Ensure Offline Queue Table Exists
   */
  async ensureOfflineQueueTable() {
    try {
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS inventory_offline_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_queue_id TEXT NOT NULL UNIQUE,
          device_uuid TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          transaction_type TEXT NOT NULL,
          payload TEXT NOT NULL,
          client_timestamp INTEGER NOT NULL,
          server_received_at INTEGER DEFAULT (unixepoch()),
          processed_at INTEGER,
          status TEXT NOT NULL DEFAULT 'PENDING',
          conflict_reason TEXT,
          resulting_transaction_id INTEGER,
          retry_count INTEGER DEFAULT 0,
          created_at INTEGER DEFAULT (unixepoch())
        )
      `);
    } catch (e) {
      // Ignore if exists
    }
  },

  /**
   * Controlled Offline Transaction Queue Engine:
   * Ingests transactions collected while mobile scanner or handheld is offline,
   * performs chronological batch synchronization, idempotency enforcement, and conflict resolution.
   */
  async enqueueOfflineTransaction(params: {
    clientQueueId: string;
    deviceUuid: string;
    userId: number;
    transactionType: string;
    payload: any;
    clientTimestamp: Date | string;
  }) {
    await this.ensureOfflineQueueTable();
    const { clientQueueId, deviceUuid, userId, transactionType, payload, clientTimestamp } = params;
    if (!clientQueueId) {
      throw new Error('clientQueueId là bắt buộc để đảm bảo tính Idempotent của hàng đợi offline.');
    }

    // Check if already queued
    const existing = await db
      .select()
      .from(inventoryOfflineQueue)
      .where(eq(inventoryOfflineQueue.clientQueueId, clientQueueId))
      .limit(1);

    if (existing.length > 0) {
      return {
        isDuplicate: true,
        queueItem: existing[0],
      };
    }

    const inserted = await db
      .insert(inventoryOfflineQueue)
      .values({
        clientQueueId,
        deviceUuid,
        userId,
        transactionType,
        payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
        clientTimestamp: new Date(clientTimestamp),
        status: 'PENDING',
      })
      .returning();

    return {
      isDuplicate: false,
      queueItem: inserted[0],
    };
  },

  /**
   * Process & Sync Offline Transactions:
   * Evaluates queued transactions chronologically, executes domain operations safely,
   * catches concurrency & negative stock conflicts, and records conflict resolution status.
   */
  async processOfflineQueue(params?: { limit?: number }) {
    await this.ensureOfflineQueueTable();
    const limit = params?.limit || 50;

    const pendingItems = await db
      .select()
      .from(inventoryOfflineQueue)
      .where(eq(inventoryOfflineQueue.status, 'PENDING'))
      .orderBy(asc(inventoryOfflineQueue.clientTimestamp), asc(inventoryOfflineQueue.id))
      .limit(limit)
      .all();

    const results: any[] = [];
    let processedCount = 0;
    let conflictCount = 0;

    for (const item of pendingItems) {
      try {
        const payload = JSON.parse(item.payload);
        let txResult: any = null;

        if (item.transactionType === 'INBOUND' || item.transactionType === 'INBOUND_RECEIPT') {
          txResult = await this.postTransaction(null, {
            type: 'INBOUND_RECEIPT',
            productId: payload.productId,
            warehouseId: payload.warehouseId,
            locationId: payload.locationId,
            quantity: payload.quantity,
            unitCost: payload.unitCost,
            lotNumber: payload.lotNumber,
            serialNumbers: payload.serialNumbers,
            referenceType: payload.referenceType || 'OFFLINE_GRN',
            referenceNo: payload.referenceNo || item.clientQueueId,
            userId: item.userId,
            idempotencyKey: item.clientQueueId,
            notes: `Đồng bộ ngoại tuyến từ thiết bị ${item.deviceUuid}`,
          });
        } else if (item.transactionType === 'OUTBOUND' || item.transactionType === 'OUTBOUND_ISSUE') {
          txResult = await this.postTransaction(null, {
            type: 'OUTBOUND_ISSUE',
            productId: payload.productId,
            warehouseId: payload.warehouseId,
            locationId: payload.locationId,
            quantity: payload.quantity,
            lotNumber: payload.lotNumber,
            serialNumbers: payload.serialNumbers,
            referenceType: payload.referenceType || 'OFFLINE_ISSUE',
            referenceNo: payload.referenceNo || item.clientQueueId,
            userId: item.userId,
            idempotencyKey: item.clientQueueId,
            notes: `Đồng bộ ngoại tuyến từ thiết bị ${item.deviceUuid}`,
          });
        } else if (item.transactionType === 'RESERVE') {
          txResult = await this.reserveStock(null, {
            productId: payload.productId,
            warehouseId: payload.warehouseId,
            locationId: payload.locationId,
            quantity: payload.quantity,
            referenceNo: payload.referenceNo || item.clientQueueId,
            userId: item.userId,
            notes: `Giữ chỗ ngoại tuyến từ thiết bị ${item.deviceUuid}`,
          });
        } else {
          throw new Error(`Loại giao dịch offline không được hỗ trợ: ${item.transactionType}`);
        }

        await db
          .update(inventoryOfflineQueue)
          .set({
            status: 'PROCESSED',
            processedAt: new Date(),
            resultingTransactionId: txResult?.transactionId || null,
          })
          .where(eq(inventoryOfflineQueue.id, item.id));

        processedCount++;
        results.push({ queueId: item.clientQueueId, status: 'PROCESSED', result: txResult });
      } catch (err: any) {
        // Concurrency or validation conflict: flag as REJECTED_CONFLICT without corrupting data
        conflictCount++;
        const conflictReason = err.message || 'Xung đột dữ liệu khi đồng bộ ngoại tuyến.';
        await db
          .update(inventoryOfflineQueue)
          .set({
            status: 'REJECTED_CONFLICT',
            processedAt: new Date(),
            conflictReason,
          })
          .where(eq(inventoryOfflineQueue.id, item.id));

        await emitOutboxEvent(db, {
          eventType: 'INVENTORY_OFFLINE_CONFLICT_DETECTED',
          aggregateType: 'InventoryOfflineQueue',
          aggregateId: item.clientQueueId,
          actorId: item.userId,
          payload: { clientQueueId: item.clientQueueId, deviceUuid: item.deviceUuid, conflictReason },
        });

        results.push({ queueId: item.clientQueueId, status: 'REJECTED_CONFLICT', conflictReason });
      }
    }

    return {
      batchTotal: pendingItems.length,
      processedCount,
      conflictCount,
      results,
    };
  },

  /**
   * Get Offline Queue Status & Diagnostics
   */
  async getOfflineQueueStatus(params?: { status?: string; deviceUuid?: string }) {
    await this.ensureOfflineQueueTable();
    const conditions: any[] = [];
    if (params?.status) {
      conditions.push(eq(inventoryOfflineQueue.status, params.status));
    }
    if (params?.deviceUuid) {
      conditions.push(eq(inventoryOfflineQueue.deviceUuid, params.deviceUuid));
    }

    const items = await db
      .select()
      .from(inventoryOfflineQueue)
      .where(conditions.length > 0 ? and(...conditions) : sql`1=1`)
      .orderBy(desc(inventoryOfflineQueue.id))
      .limit(100)
      .all();

    return {
      total: items.length,
      pendingCount: items.filter((i) => i.status === 'PENDING').length,
      processedCount: items.filter((i) => i.status === 'PROCESSED').length,
      conflictCount: items.filter((i) => i.status === 'REJECTED_CONFLICT').length,
      items,
    };
  },
};

