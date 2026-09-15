import { createClient } from "@libsql/client";

async function inspect() {
  const client = createClient({ url: "file:nexus_erp.db" });
  console.log("--- cash_shifts columns ---");
  const cs = await client.execute("PRAGMA table_info(cash_shifts);");
  console.log(cs.rows);

  console.log("--- cash_movements columns ---");
  const cm = await client.execute("PRAGMA table_info(cash_movements);");
  console.log(cm.rows);

  console.log("--- cash_shifts rows ---");
  const shifts = await client.execute("SELECT * FROM cash_shifts;");
  console.log(shifts.rows);

  console.log("--- cash_movements rows ---");
  const movements = await client.execute("SELECT * FROM cash_movements;");
  console.log(movements.rows);
}

inspect().catch(console.error);
