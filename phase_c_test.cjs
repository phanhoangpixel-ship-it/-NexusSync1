const http = require('http');
const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:sqlite.db' }); // or nexus_erp.db depending on what is used. Let's check db/index.ts

async function run() {
  // Let's use fetch instead to make it easier, but native Node 18+ has fetch.
  try {
    console.log("--- 1. Testing GET /api/sourcing/rfqs ---");
    const getRes = await fetch('http://localhost:3000/api/sourcing/rfqs', {
        headers: { 'Authorization': 'Bearer test', 'X-User-Role': 'PROCUREMENT_MANAGER' }
    });
    console.log("GET status:", getRes.status);
    const getData = await getRes.json();
    console.log("GET count:", getData.length);

    console.log("\n--- 2. Testing POST Idempotency ---");
    const idempKey = `PHASE-C-${Date.now()}`;
    const payload = {
        title: "Phase C Test RFQ",
        deadline: "2026-10-10",
        targetQuantity: 100,
        productId: 1,
        idempotencyKey: idempKey
    };
    
    // First POST
    const postRes1 = await fetch('http://localhost:3000/api/sourcing/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test', 'X-User-Role': 'SUPER_ADMIN' },
        body: JSON.stringify(payload)
    });
    console.log("POST 1 status:", postRes1.status);
    const postData1 = await postRes1.json();
    console.log("POST 1 data:", postData1);
    
    // Second POST (Same Payload)
    const postRes2 = await fetch('http://localhost:3000/api/sourcing/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test', 'X-User-Role': 'SUPER_ADMIN' },
        body: JSON.stringify(payload)
    });
    console.log("POST 2 status:", postRes2.status);
    const postData2 = await postRes2.json();
    console.log("POST 2 data:", postData2);

    // Third POST (Different Payload)
    const payload2 = { ...payload, title: "Different Title" };
    const postRes3 = await fetch('http://localhost:3000/api/sourcing/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test', 'X-User-Role': 'SUPER_ADMIN' },
        body: JSON.stringify(payload2)
    });
    console.log("POST 3 (Conflict) status:", postRes3.status);
    const postData3 = await postRes3.json();
    console.log("POST 3 data:", postData3);

    console.log("\n--- 3. Testing RBAC ---");
    const postRes4 = await fetch('http://localhost:3000/api/sourcing/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test', 'X-User-Role': 'GUEST' },
        body: JSON.stringify({...payload, idempotencyKey: idempKey + '-guest'})
    });
    console.log("POST (GUEST) status:", postRes4.status);

    console.log("\n--- 4. Checking Database (Outbox) ---");
    const outboxCheck = await client.execute({ sql: "SELECT * FROM outbox_events WHERE event_id = ?", args: [idempKey] });
    console.log("Outbox events for idempKey:", outboxCheck.rows.length);
    if(outboxCheck.rows.length > 0) {
        console.log("Event Type:", outboxCheck.rows[0].event_type);
    }

  } catch (err) {
    console.error("Test failed:", err);
  }
}
run();
