import { db, recreateDatabaseClient } from "../db/index";
import { cashShifts, cashMovements } from "../db/schema";
import { ensureSchemaSynchronized } from "../db/bootstrap";
import { CashMovementService, ShiftRequiredError, ShiftNotActiveError } from "../engines/CashMovementService";
import { ShiftEngine } from "../engines/shiftEngine";
import { eq, count, desc } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function runRigorousTestsAndDumpRaw() {
  recreateDatabaseClient();
  await ensureSchemaSynchronized();

  const service = new CashMovementService(db);
  const testResults: any = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  const addResult = (name: string, passed: boolean, details: string) => {
    testResults.tests.push({ name, passed, details });
  };

  // T1: postMovement with shiftId: null and SALE_CASH should throw ShiftRequiredError
  try {
    await service.postMovement({
      shiftId: null,
      cashDrawerId: 1,
      movementType: "SALE_CASH",
      amount: 100000,
      direction: "IN",
      custodianId: "USER-1"
    });
    addResult("T1", false, "Expected ShiftRequiredError but call succeeded.");
  } catch (e: any) {
    if (e instanceof ShiftRequiredError || e.name === "ShiftRequiredError") {
      addResult("T1", true, `Successfully caught expected error: ${e.message}`);
    } else {
      addResult("T1", false, `Caught unexpected error type: ${e.name}: ${e.message}`);
    }
  }

  // Setup shift for T2, T4, T5
  const shiftRes = await db.insert(cashShifts).values({
    shiftNo: `SHIFT-TEST-${Date.now()}`,
    cashDrawerId: 1,
    cashierUserId: "USER-1",
    cashierName: "Test Cashier",
    status: "ACTIVE",
    openingFloat: 300000,
    openedAt: new Date()
  }).returning();
  const shiftId = shiftRes[0].id;

  // T2: Idempotency test (same idempotencyKey)
  try {
    const idempKey = `IDEMP-TEST-${Date.now()}`;
    const first = await service.postMovement({
      shiftId,
      cashDrawerId: 1,
      movementType: "SALE_CASH",
      amount: 500000,
      direction: "IN",
      custodianId: "USER-1",
      idempotencyKey: idempKey
    });
    const second = await service.postMovement({
      shiftId,
      cashDrawerId: 1,
      movementType: "SALE_CASH",
      amount: 500000,
      direction: "IN",
      custodianId: "USER-1",
      idempotencyKey: idempKey
    });

    const movCountRes = await db.select({ count: count() }).from(cashMovements).where(eq(cashMovements.idempotencyKey, idempKey));
    if (first.id === second.id && movCountRes[0].count === 1) {
      addResult("T2", true, "Idempotency successfully verified (same record returned, count = 1).");
    } else {
      addResult("T2", false, "Idempotency failed (records duplicated or IDs mismatch).");
    }
  } catch (e: any) {
    addResult("T2", false, `Exception in T2: ${e.message}`);
  }

  // T4: Expected cash calculation with IN and OUT
  try {
    await service.postMovement({
      shiftId,
      cashDrawerId: 1,
      movementType: "REFUND_CASH",
      amount: 100000,
      direction: "OUT",
      custodianId: "USER-1"
    });
    const expected = await service.getExpectedCash(shiftId);
    if (expected === 700000) {
      addResult("T4", true, `Expected cash calculated correctly: ${expected}`);
    } else {
      addResult("T4", false, `Expected cash mismatch: expected 700000, got ${expected}`);
    }
  } catch (e: any) {
    addResult("T4", false, `Exception in T4: ${e.message}`);
  }

  // T5: Post movement to closed shift
  try {
    await db.update(cashShifts).set({ status: "CLOSED", closedAt: new Date() }).where(eq(cashShifts.id, shiftId));
    await service.postMovement({
      shiftId,
      cashDrawerId: 1,
      movementType: "SALE_CASH",
      amount: 200000,
      direction: "IN",
      custodianId: "USER-1"
    });
    addResult("T5", false, "Expected ShiftNotActiveError but call succeeded.");
  } catch (e: any) {
    if (e instanceof ShiftNotActiveError || e.name === "ShiftNotActiveError") {
      addResult("T5", true, `Successfully caught expected error on closed shift: ${e.message}`);
    } else {
      addResult("T5", false, `Caught unexpected error type: ${e.name}: ${e.message}`);
    }
  }

  // T3: Multi-shift isolation test
  try {
    const shiftBRes = await db.insert(cashShifts).values({
      shiftNo: `SHIFT-TEST-B-${Date.now()}`,
      cashDrawerId: 1,
      cashierUserId: "USER-1",
      cashierName: "Test Cashier",
      status: "ACTIVE",
      openingFloat: 500000,
      openedAt: new Date()
    }).returning();
    const shiftBId = shiftBRes[0].id;
    const expectedB = await service.getExpectedCash(shiftBId);
    if (expectedB === 500000) {
      addResult("T3", true, "Shift B is fully isolated from Shift A (expected cash = 500000).");
    } else {
      addResult("T3", false, `Shift B expected cash contaminated: got ${expectedB}`);
    }
  } catch (e: any) {
    addResult("T3", false, `Exception in T3: ${e.message}`);
  }

  // T6: CONCURRENT closeShift() simulation using Promise.allSettled()
  try {
    const shiftCRes = await db.insert(cashShifts).values({
      shiftNo: `SHIFT-CONCURRENT-${Date.now()}`,
      cashDrawerId: 1,
      cashierUserId: "USER-1",
      cashierName: "Test Cashier",
      status: "ACTIVE",
      openingFloat: 200000,
      openedAt: new Date()
    }).returning();
    const shiftCNo = shiftCRes[0].shiftNo;

    console.log(`[T6 CONCURRENCY TEST] Executing 2 simultaneous closeShift calls on shiftNo: ${shiftCNo}`);
    const results = await Promise.allSettled([
      ShiftEngine.closeShift(shiftCNo, [{ denomination: 100000, quantity: 2 }], "Concurrent close 1"),
      ShiftEngine.closeShift(shiftCNo, [{ denomination: 100000, quantity: 2 }], "Concurrent close 2")
    ]);

    const fulfilledCount = results.filter(r => r.status === 'fulfilled').length;
    const rejectedCount = results.filter(r => r.status === 'rejected').length;
    const rejectedReason = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;

    console.log(`[T6 CONCURRENCY TEST] fulfilledCount = ${fulfilledCount}, rejectedCount = ${rejectedCount}`);
    if (rejectedReason) {
      console.log(`[T6 CONCURRENCY TEST] Rejected error message:`, rejectedReason.reason?.message);
    }

    // Query DB for shift status count
    const shiftRows = await db.select().from(cashShifts).where(eq(cashShifts.shiftNo, shiftCNo));
    const closedCountInDb = shiftRows.filter(s => s.status === 'CLOSED' || s.status === 'PENDING_RECONCILIATION').length;

    console.log(`[T6 CONCURRENCY TEST] DB rows with CLOSED / PENDING_RECONCILIATION status = ${closedCountInDb}`);

    if (fulfilledCount === 1 && rejectedCount === 1 && closedCountInDb === 1) {
      addResult("T6", true, `Concurrent closeShift verified via Promise.allSettled: exactly 1 fulfilled, 1 rejected (${rejectedReason?.reason?.message}), DB closed rows = 1.`);
    } else {
      addResult("T6", false, `Concurrent closeShift validation failed: fulfilled=${fulfilledCount}, rejected=${rejectedCount}, DB closed rows=${closedCountInDb}`);
    }
  } catch (e: any) {
    addResult("T6", false, `Exception in T6: ${e.message}`);
  }

  // Dump last 5 cash movements to verify real UUID idempotency keys
  const recentMovements = await db.select({
    id: cashMovements.id,
    movementNo: cashMovements.movementNo,
    idempotencyKey: cashMovements.idempotencyKey,
    shiftId: cashMovements.shiftId,
    movementType: cashMovements.movementType,
    direction: cashMovements.direction,
    amount: cashMovements.amount,
    createdAt: cashMovements.createdAt,
  }).from(cashMovements).orderBy(desc(cashMovements.id)).limit(5);

  const evidencePayload = {
    testResults,
    recentMovementsSample: recentMovements
  };

  const outDir = path.resolve("docs/evidence");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outFile = path.join(outDir, "m16_v2_test_results.json");
  fs.writeFileSync(outFile, JSON.stringify(evidencePayload, null, 2), "utf-8");
  console.log("Rigorous verification report written to:", outFile);
}

runRigorousTestsAndDumpRaw().catch(console.error);
