const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:nexus_erp.db' }); 
async function run() {
  const outboxCheck = await client.execute({ sql: "SELECT * FROM outbox_events" });
  console.log("Outbox events count:", outboxCheck.rows.length);
  const rfqCheck = await client.execute({ sql: "SELECT * FROM srm_rfqs" });
  console.log("RFQ count:", rfqCheck.rows.length);
}
run();
