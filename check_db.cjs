const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:sqlite.db' });
client.execute("SELECT * FROM outbox_events WHERE event_id = 'test-idemp-key-1'").then(res => console.log("Events:", res.rows));
client.execute("SELECT * FROM srm_rfqs").then(res => console.log("RFQs:", res.rows));
