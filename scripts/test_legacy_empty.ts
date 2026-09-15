import { db, recreateDatabaseClient } from "../db/index";
import { cashShifts } from "../db/schema";
import { ensureSchemaSynchronized } from "../db/bootstrap";
import { ShiftEngine } from "../engines/shiftEngine";
import { eq } from "drizzle-orm";
import fetch from 'node-fetch';

async function testTrulyEmptyMovements() {
  recreateDatabaseClient();
  await ensureSchemaSynchronized();

  // Insert a shift directly into database with NO movements (simulating legacy mock or orphaned shift)
  const inserted = await db.insert(cashShifts).values({
    shiftNo: 'SHIFT-LEGACY-001',
    cashDrawerId: 1,
    cashierUserId: 'USER-LEGACY',
    cashierName: 'Legacy User',
    status: 'ACTIVE',
    openingFloat: 2000000,
    expectedCash: 3500000, // static stale column value
    openedAt: new Date()
  }).returning();

  const shiftId = inserted[0].id;
  const reconstructed = await ShiftEngine.reconstructExpectedCash(shiftId);
  console.log("Reconstructed expected cash for legacy shift with 0 movements:", reconstructed);

  const res = await fetch(`http://localhost:3000/api/shift/${shiftId}/summary`, {
    headers: { 'Authorization': 'Bearer dev-token' }
  });
  const data = await res.json();
  console.log("Response /api/shift/legacy/summary:", JSON.stringify(data, null, 2));
}

testTrulyEmptyMovements().catch(console.error);
