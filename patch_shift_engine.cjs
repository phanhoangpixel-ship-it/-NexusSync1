const fs = require('fs');
let code = fs.readFileSync('engines/shiftEngine.ts', 'utf-8');

// We need to fix the openShift and closeShift methods to use db.transaction
const patchTarget = `  static async openShift(params: {
    cashDrawerId: number;
    cashierUserId: string;
    cashierName: string;
    openingFloat: number;
    notes?: string;
  }) {
    const shiftNo = \`SHIFT-\${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-\${Math.floor(Math.random() * 900) + 100}\`;

    const newShift = await txObj.insert(cashShifts).values({
      shiftNo,
      cashDrawerId: params.cashDrawerId,
      cashierUserId: params.cashierUserId,
      cashierName: params.cashierName,
      status: 'ACTIVE',
      openingFloat: params.openingFloat,
      expectedCash: params.openingFloat,
      notes: params.notes,
    }).returning();

    await CashMovementService.postMovement({
      shiftId: newShift[0].id,
      cashDrawerId: params.cashDrawerId,
      movementType: 'OPENING_FLOAT',
      amount: params.openingFloat,
      direction: 'IN',
      custodianId: params.cashierUserId,
      fromLocation: 'SAFE',
      toLocation: 'DRAWER',
      idempotencyKey: \`OPEN-\${newShift[0].id}\`,
      notes: 'Khởi tạo quỹ tiền thối đầu ca',
    });

    await txObj.insert(outboxEvents).values({
      eventType: 'SHIFT_OPENED',
      payload: JSON.stringify({ shift: newShift[0] }),
    });

    return newShift[0];
  }`;

const replacement = `  static async openShift(params: {
    cashDrawerId: number;
    cashierUserId: string;
    cashierName: string;
    openingFloat: number;
    notes?: string;
  }) {
    return await db.transaction(async (tx) => {
      const shiftNo = \`SHIFT-\${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-\${Math.floor(Math.random() * 900) + 100}\`;

      const newShift = await tx.insert(cashShifts).values({
        shiftNo,
        cashDrawerId: params.cashDrawerId,
        cashierUserId: params.cashierUserId,
        cashierName: params.cashierName,
        status: 'ACTIVE',
        openingFloat: params.openingFloat,
        expectedCash: params.openingFloat,
        notes: params.notes,
      }).returning();

      await CashMovementService.postMovement({
        shiftId: newShift[0].id,
        cashDrawerId: params.cashDrawerId,
        movementType: 'OPENING_FLOAT',
        amount: params.openingFloat,
        direction: 'IN',
        custodianId: params.cashierUserId,
        fromLocation: 'SAFE',
        toLocation: 'DRAWER',
        idempotencyKey: \`OPEN-\${newShift[0].id}\`,
        notes: 'Khởi tạo quỹ tiền thối đầu ca',
      }, tx);

      await tx.insert(outboxEvents).values({
        eventType: 'SHIFT_OPENED',
        payload: JSON.stringify({ shift: newShift[0] }),
      });

      return newShift[0];
    });
  }`;

code = code.replace(patchTarget, replacement);

const patchTarget2 = `  static async closeShift(shiftId: string, denominations: DenominationLine[], notes?: string) {
    const shift = await db.select().from(cashShifts).where(eq(cashShifts.shiftNo, shiftId)).limit(1);
    if (!shift.length) throw new Error('Shift not found');

    // Closed shift immutability
    if (shift[0].status === 'CLOSED') {
      throw new Error('Shift is already closed. Immutable. Corrections must go through CORRECTION_REQUEST.');
    }

    let actualCash = 0;
    if (denominations && denominations.length > 0) {
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
    const expectedCash = await this.reconstructExpectedCash(shift[0].id);
    const variance = actualCash - expectedCash;
    let newStatus = 'CLOSED';
    let varianceStatus = 'EXACT';

    // Tolerance check
    const TOLERANCE = 0; // strict
    if (variance > TOLERANCE) varianceStatus = 'OVER';
    else if (variance < -TOLERANCE) varianceStatus = 'SHORT';

    if (variance !== 0) newStatus = 'PENDING_RECONCILIATION';

    const closed = await db.update(cashShifts)
      .set({
        expectedCash: expectedCash, // update to reconstructed
        actualCountedCash: actualCash,
        varianceAmount: variance,
        varianceStatus,
        status: newStatus,
        closedAt: new Date(),
        notes: notes || shift[0].notes,
      })
      .where(eq(cashShifts.shiftNo, shiftId))
      .returning();

    await txObj.insert(cashCounts).values({
      shiftId: closed[0].id,
      countType: 'CLOSING',
      totalCounted: actualCash,
      denominationsJson: JSON.stringify(denominations),
      countedBy: shift[0].cashierUserId
    });
    
    await txObj.insert(outboxEvents).values({
      eventType: 'CASH_COUNT_COMPLETED',
      payload: JSON.stringify({ shiftId: closed[0].id, actualCash, expectedCash })
    });

    await txObj.insert(outboxEvents).values({
      eventType: 'SHIFT_CLOSED',
      payload: JSON.stringify({ shift: closed[0] }),
    });

    if (variance !== 0) {
      await txObj.insert(cashVariances).values({
        shiftId: closed[0].id,
        expectedAmount: expectedCash,
        countedAmount: actualCash,
        varianceAmount: variance,
        status: 'PENDING_REVIEW',
        reviewNotes: notes,
      });
      
      await txObj.insert(outboxEvents).values({
        eventType: 'CASH_VARIANCE_DETECTED',
        payload: JSON.stringify({ shift: closed[0], variance })
      });
    }

    return closed[0];
  }`;

const replacement2 = `  static async closeShift(shiftId: string, denominations: DenominationLine[], notes?: string) {
    return await db.transaction(async (tx) => {
      const shift = await tx.select().from(cashShifts).where(eq(cashShifts.shiftNo, shiftId)).limit(1);
      if (!shift.length) throw new Error('Shift not found');

      // Closed shift immutability
      if (shift[0].status === 'CLOSED') {
        throw new Error('Shift is already closed. Immutable. Corrections must go through CORRECTION_REQUEST.');
      }

      let actualCash = 0;
      if (denominations && denominations.length > 0) {
        for (const line of denominations) {
          if (line.quantity < 0 || line.denomination <= 0) {
            throw new Error("Invalid denomination or quantity");
          }
          actualCash += line.denomination * line.quantity;
        }
      } else {
        throw new Error("Denominations required for cash count");
      }

      // Expected cash reconstruction from source of truth inside transaction
      const expectedCash = await this.reconstructExpectedCash(shift[0].id, tx);
      const variance = actualCash - expectedCash;
      let newStatus = 'CLOSED';
      let varianceStatus = 'EXACT';

      // Tolerance check
      const TOLERANCE = 0; // strict
      if (variance > TOLERANCE) varianceStatus = 'OVER';
      else if (variance < -TOLERANCE) varianceStatus = 'SHORT';

      if (variance !== 0) newStatus = 'PENDING_RECONCILIATION';

      const closed = await tx.update(cashShifts)
        .set({
          expectedCash: expectedCash, // update to reconstructed
          actualCountedCash: actualCash,
          varianceAmount: variance,
          varianceStatus,
          status: newStatus,
          closedAt: new Date(),
          notes: notes || shift[0].notes,
        })
        .where(eq(cashShifts.shiftNo, shiftId))
        .returning();

      await tx.insert(cashCounts).values({
        shiftId: closed[0].id,
        countType: 'CLOSING',
        totalCounted: actualCash,
        denominationsJson: JSON.stringify(denominations),
        countedBy: shift[0].cashierUserId
      });
      
      await tx.insert(outboxEvents).values({
        eventType: 'CASH_COUNT_COMPLETED',
        payload: JSON.stringify({ shiftId: closed[0].id, actualCash, expectedCash })
      });

      await tx.insert(outboxEvents).values({
        eventType: 'SHIFT_CLOSED',
        payload: JSON.stringify({ shift: closed[0] }),
      });

      if (variance !== 0) {
        await tx.insert(cashVariances).values({
          shiftId: closed[0].id,
          expectedAmount: expectedCash,
          countedAmount: actualCash,
          varianceAmount: variance,
          status: 'PENDING_REVIEW',
          reviewNotes: notes,
        });
        
        await tx.insert(outboxEvents).values({
          eventType: 'CASH_VARIANCE_DETECTED',
          payload: JSON.stringify({ shift: closed[0], variance })
        });
      }

      return closed[0];
    });
  }`;

code = code.replace(patchTarget2, replacement2);
fs.writeFileSync('engines/shiftEngine.ts', code);
