import fetch from 'node-fetch';

async function testEmptyMovementsSummary() {
  const res = await fetch('http://localhost:3000/api/shift/1/summary', {
    headers: { 'Authorization': 'Bearer dev-token' }
  });
  const data = await res.json();
  console.log("Response /api/shift/1/summary:", JSON.stringify(data, null, 2));
}

testEmptyMovementsSummary().catch(console.error);
