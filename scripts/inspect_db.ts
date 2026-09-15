import { createClient } from "@libsql/client";

async function inspect() {
  const client = createClient({ url: "file:nexus_erp.db" });
  const rs = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
  console.log("Tables in DB:", rs.rows.map(r => r.name));
  
  for (const table of rs.rows.map(r => r.name)) {
    try {
      const info = await client.execute(`PRAGMA table_info(${table});`);
      console.log(`\nTable ${table} columns:`, info.rows.map(col => col.name));
      const count = await client.execute(`SELECT COUNT(*) as cnt FROM ${table};`);
      console.log(`Table ${table} row count:`, count.rows[0].cnt);
    } catch (e: any) {
      console.log(`Error inspecting ${table}:`, e.message);
    }
  }
}

inspect().catch(console.error);
