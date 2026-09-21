import { CashMovementService } from "./CashMovementService";
import { db } from '../db/index';
import { cashShifts, cashMovements, cashCounts, cashVariances, salesOrders, cashDrawers, outboxEvents } from '../db/schema';
import { eq, and, desc, sql, inArray, or } from 'drizzle-orm';

export type DenominationLine = { denomination: number; quantity: number };

export class ShiftEngine {
  static async reconstructExpectedCash(shiftId: number, txObj: any = db): Promise<number> {
    const movements = await txObj.select().from(cashMovements).where(eq(cashMovements.shiftId, shiftId));
    let expected = 0;
    for (const mov of movements) {
      if (mov.direction === 'IN') {
        expected += mov.amount;
      } else if (mov.direction === 'OUT') {
        expected -= mov.amount;
      }
    }
    return expected;
  }

  static async openShift(params: {
    cashDrawerId: number;
    cashierUserId: string;
    cashierName: string;
    openingFloat: number;
    notes?: string;
  }, txContext?: any) {
    if (params.openingFloat === undefined || params.openingFloat === null || isNaN(Number(params.openingFloat)) || Number(params.openingFloat) < 0) {
      const err: any = new Error("ERR_INVALID_OPENING_FLOAT: Tiền quỹ đầu ca (openingFloat) là bắt buộc và phải là số không âm (>= 0).");
      err.code = "ERR_INVALID_OPENING_FLOAT";
      err.status = 400;
      throw err;
    }

    const drawerId = Number(params.cashDrawerId) || 1;
    const floatAmount = Number(params.openingFloat);

    const execute = async (tx: any) => {
      // 1. Check if this cashier already has an active shift
      const activeCashierShift = await tx.select().from(cashShifts)
        .where(and(
          eq(cashShifts.cashierUserId, String(params.cashierUserId)),
          eq(cashShifts.status, 'ACTIVE')
        ))
        .limit(1);

      if (activeCashierShift.length > 0) {
        const err: any = new Error(
          `ERR_ACTIVE_SHIFT_EXISTS: Thu ngân #${params.cashierUserId} (${params.cashierName}) hiện đang có một ca làm việc đang hoạt động (${activeCashierShift[0].shiftNo}). Vui lòng chốt ca hiện tại trước khi mở ca mới.`
        );
        err.code = "ERR_ACTIVE_SHIFT_EXISTS";
        err.status = 409;
        err.activeShift = activeCashierShift[0];
        throw err;
      }

      // 2. Check if this cash drawer is already occupied by an active shift
      const activeDrawerShift = await tx.select().from(cashShifts)
        .where(and(
          eq(cashShifts.cashDrawerId, drawerId),
          eq(cashShifts.status, 'ACTIVE')
        ))
        .limit(1);

      if (activeDrawerShift.length > 0) {
        const err: any = new Error(
          `ERR_DRAWER_ALREADY_IN_USE: Két tiền #${drawerId} hiện đang được sử dụng trong ca làm việc đang hoạt động (${activeDrawerShift[0].shiftNo} của thu ngân ${activeDrawerShift[0].cashierName}). Vui lòng chốt ca trước khi mở ca mới.`
        );
        err.code = "ERR_DRAWER_ALREADY_IN_USE";
        err.status = 409;
        err.activeShift = activeDrawerShift[0];
        throw err;
      }

      const shiftNo = `SHIFT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900) + 100}`;

      const newShift = await tx.insert(cashShifts).values({
        shiftNo,
        cashDrawerId: drawerId,
        cashierUserId: String(params.cashierUserId),
        cashierName: params.cashierName,
        status: 'ACTIVE',
        openingFloat: floatAmount,
        expectedCash: floatAmount,
        notes: params.notes,
        openedAt: new Date(),
      } as any).returning();

      // 3. Post FLOAT_IN cash movement to register opening float
      if (floatAmount > 0) {
        await new CashMovementService().postMovement({
          shiftId: newShift[0].id,
          cashDrawerId: drawerId,
          movementType: 'FLOAT_IN',
          amount: floatAmount,
          direction: 'IN',
          custodianId: String(params.cashierUserId),
          fromLocation: 'SAFE',
          toLocation: 'DRAWER',
          referenceNo: shiftNo,
          idempotencyKey: `FLOAT_IN-${newShift[0].id}-${Date.now()}`,
          notes: 'Khởi tạo tiền quỹ đầu ca (Opening Float)',
        }, tx);
      }

      // 4. Outbox Event
      await tx.insert(outboxEvents).values({
        eventId: `EVT-SHIFT-OPEN-${newShift[0].id}-${Date.now()}`,
        eventType: 'SHIFT_OPENED',
        aggregateType: 'SHIFT',
        aggregateId: String(newShift[0].id),
        source: 'SHIFT_ENGINE',
        payload: JSON.stringify({ shift: newShift[0] }),
      } as any);

      return newShift[0];
    };

    return await execute(txContext || db);
  }

  static async getActiveShifts() {
    return db.select().from(cashShifts).where(eq(cashShifts.status, 'ACTIVE')).orderBy(desc(cashShifts.openedAt));
  }

  static async getClosedShifts(filters: any) {
    let query = db.select().from(cashShifts).where(eq(cashShifts.status, 'CLOSED'));
    
    // Server-side filtering
    if (filters.employeeId) {
      query = db.select().from(cashShifts).where(and(eq(cashShifts.status, 'CLOSED'), eq(cashShifts.cashierUserId, filters.employeeId)));
    }
    
    // pagination
    const page = filters.page ? parseInt(filters.page) : 1;
    const pageSize = filters.pageSize ? parseInt(filters.pageSize) : 50;
    
    return query.orderBy(desc(cashShifts.closedAt)).limit(pageSize).offset((page - 1) * pageSize);
  }

  static async getShiftDetail(shiftId: string) {
    const shift = await db.select().from(cashShifts).where(eq(cashShifts.shiftNo, shiftId)).limit(1);
    if (!shift.length) throw new Error('Shift not found');
    
    // Hardening: reconstruct expected cash on the fly for detail view
    const expectedCash = await this.reconstructExpectedCash(shift[0].id);
    return {
      ...shift[0],
      reconstructedExpectedCash: expectedCash
    };
  }

  static async closeShift(
    shiftId: string | number,
    denominations: DenominationLine[] | Record<string, number>,
    notes?: string,
    overrideActualCash?: number,
    forceClose?: boolean,
    txContext?: any
  ) {
    const execute = async (tx: any) => {
      const numericId = Number(shiftId) || 0;
      const stringId = String(shiftId);
      // Use serializable/exclusive locking read if supported, or re-verify status
      const shift = await tx.select().from(cashShifts).where(or(eq(cashShifts.id, numericId), eq(cashShifts.shiftNo, stringId))).limit(1);
      if (!shift.length) throw new Error('Shift not found');

      // Closed shift immutability or already closed
      if (shift[0].status === 'CLOSED' || shift[0].status === 'PENDING_RECONCILIATION') {
        throw new Error('Shift is already closed or pending reconciliation. Immutable.');
      }

      // Normalize denominations format
      const normalizedDenominations: DenominationLine[] = [];
      let calculatedDenomCash = 0;

      if (Array.isArray(denominations)) {
        for (const line of denominations) {
          const denom = Number(line.denomination) || 0;
          const qty = Number(line.quantity) || 0;
          if (qty < 0 || denom <= 0) {
            throw new Error(`Mệnh giá (${denom}) hoặc số lượng (${qty}) không hợp lệ.`);
          }
          if (qty > 0) {
            normalizedDenominations.push({ denomination: denom, quantity: qty });
            calculatedDenomCash += denom * qty;
          }
        }
      } else if (typeof denominations === 'object' && denominations !== null) {
        for (const [key, val] of Object.entries(denominations)) {
          let denom = 0;
          const cleanKey = key.toLowerCase().trim();
          if (cleanKey.endsWith('k')) {
            denom = Number(cleanKey.replace('k', '')) * 1000;
          } else {
            denom = Number(cleanKey.replace(/[^0-9]/g, ''));
          }
          const qty = Number(val) || 0;
          if (qty < 0 || denom <= 0) {
            throw new Error(`Mệnh giá (${denom}) hoặc số lượng (${qty}) không hợp lệ.`);
          }
          if (qty > 0) {
            normalizedDenominations.push({ denomination: denom, quantity: qty });
            calculatedDenomCash += denom * qty;
          }
        }
      }

      let actualCash = 0;
      if (overrideActualCash !== undefined && overrideActualCash !== null && !isNaN(Number(overrideActualCash)) && Number(overrideActualCash) >= 0) {
        actualCash = Number(overrideActualCash);
      } else if (normalizedDenominations.length > 0) {
        actualCash = calculatedDenomCash;
      } else {
        throw new Error("ERR_DENOMINATIONS_REQUIRED: Bắt buộc nhập bảng kê mệnh giá tiền kiểm đếm cuối ca.");
      }

      // Expected cash reconstruction and movement breakdown from source of truth
      const movements = await tx.select().from(cashMovements).where(eq(cashMovements.shiftId, shift[0].id));
      let totalCashIn = 0;
      let totalCashOut = 0;
      for (const m of movements) {
        if (m.direction === 'IN') totalCashIn += m.amount;
        if (m.direction === 'OUT') totalCashOut += m.amount;
      }
      const expectedCash = totalCashIn - totalCashOut;
      const variance = actualCash - expectedCash;
      
      let varianceStatus = 'EXACT';
      if (variance > 0) varianceStatus = 'OVER';
      else if (variance < 0) varianceStatus = 'SHORT';

      let newStatus = 'CLOSED';
      if (variance !== 0 && !forceClose) {
        newStatus = 'PENDING_RECONCILIATION';
      }

      // Atomic update conditioned on status still being ACTIVE to prevent race conditions
      const closed = await tx.update(cashShifts)
        .set({
          expectedCash,
          actualCountedCash: actualCash,
          varianceAmount: variance,
          varianceStatus,
          status: newStatus,
          closedAt: new Date(),
          notes: notes || shift[0].notes,
        } as any)
        .where(and(or(eq(cashShifts.id, numericId), eq(cashShifts.shiftNo, stringId)), eq(cashShifts.status, 'ACTIVE')))
        .returning();

      if (!closed.length) {
        throw new Error('Shift was already closed concurrently by another transaction.');
      }

      await tx.insert(cashCounts).values({
        shiftId: closed[0].id,
        countType: 'CLOSING',
        totalCounted: actualCash,
        denominationsJson: JSON.stringify(normalizedDenominations),
        countedBy: shift[0].cashierUserId
      } as any);
      
      await tx.insert(outboxEvents).values({
        eventId: `EVT-COUNT-${closed[0].id}-${Date.now()}`,
        eventType: 'CASH_COUNT_COMPLETED',
        aggregateType: 'SHIFT',
        aggregateId: String(closed[0].id),
        source: 'SHIFT_ENGINE',
        payload: JSON.stringify({ shiftId: closed[0].id, actualCash, expectedCash, denominations: normalizedDenominations })
      } as any);

      await tx.insert(outboxEvents).values({
        eventId: `EVT-SHIFT-CLOSE-${closed[0].id}-${Date.now()}`,
        eventType: 'SHIFT_CLOSED',
        aggregateType: 'SHIFT',
        aggregateId: String(closed[0].id),
        source: 'SHIFT_ENGINE',
        payload: JSON.stringify({ shift: closed[0], summary: { expectedCash, actualCash, variance } }),
      } as any);

      if (variance !== 0) {
        await tx.insert(cashVariances).values({
          shiftId: closed[0].id,
          expectedAmount: expectedCash,
          countedAmount: actualCash,
          varianceAmount: variance,
          status: 'PENDING_REVIEW',
          reviewNotes: notes || `Chênh lệch ${varianceStatus}: ${variance > 0 ? '+' : ''}${variance.toLocaleString('vi-VN')} đ`,
        } as any);
        
        await tx.insert(outboxEvents).values({
          eventId: `EVT-VARIANCE-${closed[0].id}-${Date.now()}`,
          eventType: 'CASH_VARIANCE_DETECTED',
          aggregateType: 'SHIFT',
          aggregateId: String(closed[0].id),
          source: 'SHIFT_ENGINE',
          payload: JSON.stringify({ shift: closed[0], variance, expectedCash, actualCash })
        } as any);
      }

      return {
        ...closed[0],
        summary: {
          shiftId: closed[0].id,
          shiftNo: shift[0].shiftNo,
          cashierName: shift[0].cashierName,
          openingFloat: shift[0].openingFloat,
          totalCashIn,
          totalCashOut,
          expectedCash,
          actualCash,
          difference: variance,
          varianceAmount: variance,
          varianceStatus,
          status: closed[0].status,
          closedAt: closed[0].closedAt,
          denominations: normalizedDenominations
        }
      };
    };

    return await execute(txContext || db);
  }
}
