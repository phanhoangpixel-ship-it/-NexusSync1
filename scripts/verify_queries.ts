import { createClient } from "@libsql/client";
import { ensureSchemaSynchronized } from "../db/bootstrap";
import { db } from "../db/index";
import fs from "fs";
import path from "path";

async function runQueries() {
  await ensureSchemaSynchronized();
  const client = createClient({ url: process.env.DATABASE_URL || "file:nexus_erp.db" });
  let output = "";

  output += "=== 1. CASH MOVEMENTS FOR SHIFT ID 104 (Chronological Order) ===\n";
  const cm104 = await client.execute({
    sql: "SELECT id, movement_no, shift_id, movement_type, amount, direction, created_at, notes FROM cash_movements WHERE shift_id = ? ORDER BY created_at ASC;",
    args: [104]
  });
  output += `Rows found for shift_id = 104: ${cm104.rows.length}\n`;
  output += JSON.stringify(cm104.rows, null, 2) + "\n\n";

  output += "=== 2. ALL CASH MOVEMENTS ACROSS ALL SHIFTS (Chronological Order) ===\n";
  const cmAll = await client.execute("SELECT id, movement_no, shift_id, movement_type, amount, direction, created_at, notes FROM cash_movements ORDER BY created_at ASC;");
  output += JSON.stringify(cmAll.rows, null, 2) + "\n\n";

  output += "=== 3. SHIFTS DATA & EXPECTED CASH CALCULATION ===\n";
  const shifts = await client.execute("SELECT id, shift_no, status, opening_float, expected_cash, opened_at, closed_at FROM cash_shifts;");
  output += JSON.stringify(shifts.rows, null, 2) + "\n\n";

  output += "=== 4. EXPECTED CASH COMPUTED PER SHIFT (Opening Float + SUM(IN) - SUM(OUT)) ===\n";
  for (const shift of shifts.rows) {
    const sId = shift.id as number;
    const opFloat = Number(shift.opening_float) || 0;
    const movs = await client.execute({
      sql: "SELECT direction, SUM(amount) as total FROM cash_movements WHERE shift_id = ? GROUP BY direction;",
      args: [sId]
    });
    let sumIn = 0;
    let sumOut = 0;
    for (const m of movs.rows) {
      if (m.direction === 'IN') sumIn = Number(m.total) || 0;
      if (m.direction === 'OUT') sumOut = Number(m.total) || 0;
    }
    const computedExpected = opFloat + sumIn - sumOut;
    output += `Shift ID ${sId}: Opening Float = ${opFloat}, Total IN = ${sumIn}, Total OUT = ${sumOut}, Computed Expected = ${computedExpected}\n`;
  }
  output += "\n";

  output += "=== 5. MULTI-SHIFT ISOLATION CHECK (Checking unassigned or misallocated movements) ===\n";
  const unassigned = await client.execute("SELECT * FROM cash_movements WHERE shift_id IS NULL;");
  output += `Unassigned cash movements (shift_id IS NULL): ${unassigned.rows.length}\n`;
  output += JSON.stringify(unassigned.rows, null, 2) + "\n\n";

  const outDir = path.resolve("docs/evidence");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, "m16_queries_RAW_output.txt");
  fs.writeFileSync(outFile, output, "utf-8");
  console.log("Raw query output generated at:", outFile);
}

runQueries().catch(console.error);
