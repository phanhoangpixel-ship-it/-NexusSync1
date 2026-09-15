import fetch from 'node-fetch';

async function testHttpEndpoints() {
  console.log("=== 1. Testing POST /api/shift/open ==. ");
  const openRes = await fetch('http://localhost:3000/api/shift/open', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer dev-token' },
    body: JSON.stringify({
      cashDrawerId: 1,
      cashierUserId: 'USER-1',
      cashierName: 'Hoàng Nam',
      openingFloat: 2000000,
      notes: 'HTTP Test Open Shift'
    })
  });
  const openData = await openRes.json();
  console.log("Open Shift Response:", JSON.stringify(openData, null, 2));

  const shiftId = (openData as any).id || (openData as any).shiftNo;

  console.log("=== 2. Testing POST /api/shift/cash-movement (300,000 IN) ===");
  const mov1Res = await fetch('http://localhost:3000/api/shift/cash-movement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer dev-token' },
    body: JSON.stringify({
      shiftId: (openData as any).id,
      cashDrawerId: 1,
      movementType: 'SALE_CASH',
      amount: 300000,
      direction: 'IN',
      custodianId: 'USER-1',
      idempotencyKey: `HTTP-MOV-1-${Date.now()}`,
      notes: 'Bán hàng ca 1'
    })
  });
  const text1 = await mov1Res.text();
  let mov1Data;
  try {
    mov1Data = JSON.parse(text1);
  } catch (e) {
    console.error("Failed to parse JSON 1. Raw text:", text1);
    throw e;
  }
  console.log("Movement 1 Response:", JSON.stringify(mov1Data, null, 2));

  console.log("=== 3. Testing POST /api/shift/cash-movement (500,000 IN) ===");
  const mov2Res = await fetch('http://localhost:3000/api/shift/cash-movement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer dev-token' },
    body: JSON.stringify({
      shiftId: (openData as any).id,
      cashDrawerId: 1,
      movementType: 'SALE_CASH',
      amount: 500000,
      direction: 'IN',
      custodianId: 'USER-1',
      idempotencyKey: `HTTP-MOV-2-${Date.now()}`,
      notes: 'Bán hàng ca 2'
    })
  });
  const text2 = await mov2Res.text();
  let mov2Data;
  try {
    mov2Data = JSON.parse(text2);
  } catch (e) {
    console.error("Failed to parse JSON 2. Raw text:", text2);
    throw e;
  }
  console.log("Movement 2 Response:", JSON.stringify(mov2Data, null, 2));

  console.log(`=== 4. Testing GET /api/shift/${shiftId}/summary ===`);
  const summaryRes = await fetch(`http://localhost:3000/api/shift/${shiftId}/summary`, {
    headers: { 'Authorization': 'Bearer dev-token' }
  });
  const summaryData = await summaryRes.json();
  console.log("Summary Response JSON:", JSON.stringify(summaryData, null, 2));
}

testHttpEndpoints().catch(console.error);
