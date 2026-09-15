import { createClient } from "@libsql/client";

async function check() {
  const client = createClient({ url: "file:nexus_erp.db" });
  const rs = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE '%cash%' OR name LIKE '%shift%' OR name LIKE '%movement%');");
  console.log("Matching tables:", rs.rows);
}

check().catch(console.error);
