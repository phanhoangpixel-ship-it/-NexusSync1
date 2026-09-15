import { db } from '../db/index';
import { cashShifts, cashMovements, cashCounts, cashVariances, salesOrders, cashDrawers, outboxEvents } from '../db/schema';
import { eq, and, desc, sql, inArray, or } from 'drizzle-orm';

export class CashMovementService {
  static async postMovement(params: {
    shiftId?: number;
    cashDrawerId: number;
    movementType: string;
    amount: number;
    direction: 'IN' | 'OUT';
    custodianId: string;
    fromLocation: string;
    toLocation: string;
    referenceNo?: string;
    idempotencyKey: string;
    notes?: string;
  }, txObj: any = db) {
    const existing = await txObj.select().from(cashMovements).where(eq(cashMovements.idempotencyKey, params.idempotencyKey)).limit(1);
    if (existing.length > 0) return existing[0];

    const movementNo = `CM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const result = await txObj.insert(cashMovements).values({
      movementNo,
      shiftId: params.shiftId,
      cashDrawerId: params.cashDrawerId,
      movementType: params.movementType,
      amount: params.amount,
      direction: params.direction,
      custodianId: params.custodianId,
      fromLocation: params.fromLocation,
      toLocation: params.toLocation,
      referenceNo: params.referenceNo,
      idempotencyKey: params.idempotencyKey,
      notes: params.notes,
    }).returning();

    await txObj.insert(outboxEvents).values({
      eventId: `EVT-CM-${params.idempotencyKey}`,
      eventType: 'CASH_MOVEMENT_POSTED',
      aggregateType: 'CASH_MOVEMENT',
      aggregateId: String(result[0].id),
      source: 'CASH_ENGINE',
      payload: JSON.stringify({ movement: result[0] }),
    } as any);

    return result[0];
  }
}

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
  }) {
    return await db.transaction(async (tx) => {
      const shiftNo = `SHIFT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900) + 100}`;

      const newShift = await tx.insert(cashShifts).values({
        shiftNo,
        cashDrawerId: params.cashDrawerId,
        cashierUserId: params.cashierUserId,
        cashierName: params.cashierName,
        status: 'ACTIVE',
        openingFloat: params.openingFloat,
        expectedCash: params.openingFloat,
        notes: params.notes,
      } as any).returning();

      await CashMovementService.postMovement({
        shiftId: newShift[0].id,
        cashDrawerId: params.cashDrawerId,
        movementType: 'OPENING_FLOAT',
        amount: params.openingFloat,
        direction: 'IN',
        custodianId: params.cashierUserId,
        fromLocation: 'SAFE',
        toLocation: 'DRAWER',
        idempotencyKey: `OPEN-${newShift[0].id}`,
        notes: 'Khởi tạo quỹ tiền thối đầu ca',
      }, tx);

      await tx.insert(outboxEvents).values({
        eventId: `EVT-SHIFT-OPEN-${newShift[0].id}-${Date.now()}`,
        eventType: 'SHIFT_OPENED',
        aggregateType: 'SHIFT',
        aggregateId: String(newShift[0].id),
        source: 'SHIFT_ENGINE',
        payload: JSON.stringify({ shift: newShift[0] }),
      } as any);

      return newShift[0];
    });
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

  static async closeShift(shiftId: string | number, denominations: DenominationLine[], notes?: string, overrideActualCash?: number) {
    return await db.transaction(async (tx) => {
      const numericId = Number(shiftId) || 0;
      const stringId = String(shiftId);
      // Use serializable/exclusive locking read if supported, or re-verify status
      const shift = await tx.select().from(cashShifts).where(or(eq(cashShifts.id, numericId), eq(cashShifts.shiftNo, stringId))).limit(1);
      if (!shift.length) throw new Error('Shift not found');

      // Closed shift immutability or already closed
      if (shift[0].status === 'CLOSED' || shift[0].status === 'PENDING_RECONCILIATION') {
        throw new Error('Shift is already closed or pending reconciliation. Immutable.');
      }

      let actualCash = 0;
      if (overrideActualCash !== undefined && overrideActualCash !== null && !isNaN(overrideActualCash) && overrideActualCash >= 0) {
        actualCash = overrideActualCash;
      } else if (denominations && denominations.length > 0) {
        for (const line of denominations) {
          if (line.quantity < 0 || line.denomination <= 0) {
            throw new Error("Invalid denomination or quantity");
          }
          actualCash += line.denomination * line.quantity;
        }
      } else {
        throw new Error("Denominations required for cash count");
      }

      // Expected cash reconstruction from source of truth
      const expectedCash = await this.reconstructExpectedCash(shift[0].id, tx);
      const variance = actualCash - expectedCash;
      let newStatus = 'CLOSED';
      let varianceStatus = 'EXACT';

      // Tolerance check
      const TOLERANCE = 0; // strict
      if (variance > TOLERANCE) varianceStatus = 'OVER';
      else if (variance < -TOLERANCE) varianceStatus = 'SHORT';

      if (variance !== 0) newStatus = 'PENDING_RECONCILIATION';

      // Atomic update conditioned on status still being ACTIVE to prevent race conditions
      const closed = await tx.update(cashShifts)
        .set({
          expectedCash: expectedCash,
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
        denominationsJson: JSON.stringify(denominations),
        countedBy: shift[0].cashierUserId
      } as any);
      
      await tx.insert(outboxEvents).values({
        eventId: `EVT-COUNT-${closed[0].id}-${Date.now()}`,
        eventType: 'CASH_COUNT_COMPLETED',
        aggregateType: 'SHIFT',
        aggregateId: String(closed[0].id),
        source: 'SHIFT_ENGINE',
        payload: JSON.stringify({ shiftId: closed[0].id, actualCash, expectedCash })
      } as any);

      await tx.insert(outboxEvents).values({
        eventId: `EVT-SHIFT-CLOSE-${closed[0].id}-${Date.now()}`,
        eventType: 'SHIFT_CLOSED',
        aggregateType: 'SHIFT',
        aggregateId: String(closed[0].id),
        source: 'SHIFT_ENGINE',
        payload: JSON.stringify({ shift: closed[0] }),
      } as any);

      if (variance !== 0) {
        await tx.insert(cashVariances).values({
          shiftId: closed[0].id,
          expectedAmount: expectedCash,
          countedAmount: actualCash,
          varianceAmount: variance,
          status: 'PENDING_REVIEW',
          reviewNotes: notes,
        } as any);
        
        await tx.insert(outboxEvents).values({
          eventId: `EVT-VARIANCE-${closed[0].id}-${Date.now()}`,
          eventType: 'CASH_VARIANCE_DETECTED',
          aggregateType: 'SHIFT',
          aggregateId: String(closed[0].id),
          source: 'SHIFT_ENGINE',
          payload: JSON.stringify({ shift: closed[0], variance })
        } as any);
      }

      return closed[0];
    });
  }
}
