import { db, recreateDatabaseClient } from "../db/index";
import { cashShifts, cashMovements } from "../db/schema";
import { ensureSchemaSynchronized } from "../db/bootstrap";
import { ShiftEngine, CashMovementService } from "../engines/shiftEngine";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function verifyReconstructTest() {
  recreateDatabaseClient();
  await ensureSchemaSynchronized();

  // Step a: Open a brand new shift through ShiftEngine.openShift (simulating POST /api/shift/open)
  const shift = await ShiftEngine.openShift({
    cashDrawerId: 1,
    cashierUserId: "CASHIER-TEST-01",
    cashierName: "Nguyễn Kiểm Định",
    openingFloat: 2000000,
    notes: "Test shift opening float"
  });

  console.log("Opened Shift ID:", shift.id, "ShiftNo:", shift.shiftNo);

  // Step b: Post 2 real CASH movements (300,000 and 500,000) via CashMovementService
  await CashMovementService.postMovement({
    shiftId: shift.id,
    cashDrawerId: 1,
    movementType: 'SALE_CASH',
    amount: 300000,
    direction: 'IN',
    custodianId: 'CASHIER-TEST-01',
    fromLocation: 'CUSTOMER',
    toLocation: 'DRAWER',
    idempotencyKey: `TEST-MOV-1-${Date.now()}`,
    notes: 'Tiền bán hàng ca 1'
  });

  await CashMovementService.postMovement({
    shiftId: shift.id,
    cashDrawerId: 1,
    movementType: 'SALE_CASH',
    amount: 500000,
    direction: 'IN',
    custodianId: 'CASHIER-TEST-01',
    fromLocation: 'CUSTOMER',
    toLocation: 'DRAWER',
    idempotencyKey: `TEST-MOV-2-${Date.now()}`,
    notes: 'Tiền bán hàng ca 2'
  });

  // Step c: Reconstruct expected cash and fetch movements (simulating GET /api/shift/:id/summary)
  const movements = await db.select().from(cashMovements).where(eq(cashMovements.shiftId, shift.id));
  const reconstructedExpectedCash = await ShiftEngine.reconstructExpectedCash(shift.id);

  const summaryResult = {
    shift,
    movements,
    reconstructedExpectedCash
  };

  console.log("Summary Result JSON:", JSON.stringify(summaryResult, null, 2));

  const outDir = path.resolve("docs/evidence");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outDir, "m16_reconstruct_verification.json"), JSON.stringify(summaryResult, null, 2), "utf-8");
}

verifyReconstructTest().catch(console.error);
