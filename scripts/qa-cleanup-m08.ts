import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function api(path: string, options: any = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer nexus-dev-qa-token',
    ...(options.headers || {})
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runCleanup() {
  console.log('=== STARTING M08 QA TEST DATA CLEANUP (Reversal Pattern) ===');

  // Verify baseline balance
  const balRes = await api('/api/inventory/balances?productId=1&warehouseId=1');
  const totalStock = Array.isArray(balRes.data) 
    ? balRes.data.reduce((sum: number, r: any) => sum + (r.stockPhysical || 0), 0)
    : 0;
  console.log(`Current Total Inventory Balance for Product #1: ${totalStock}`);

  // Fetch all POs created with QA test suffix
  const allPosRes = await api('/api/purchase-orders');
  const allPos = Array.isArray(allPosRes.data) ? allPosRes.data : [];
  const qaPos = allPos.filter((p: any) => (p.notes && p.notes.includes('QA-TEST')) || (p.code && p.code.includes('QA-TEST')));

  console.log(`Found ${qaPos.length} QA test purchase orders.`);

  const auditLog: any[] = [];

  for (const po of qaPos) {
    if (po.status === 'DRAFT' || po.status === 'PENDING_APPROVAL' || po.status === 'REJECTED') {
      const delRes = await api(`/api/purchase-orders/${po.code}`, { method: 'DELETE' });
      auditLog.push({
        code: po.code,
        type: 'PURCHASE_ORDER',
        action: 'DELETED',
        result: delRes.ok ? 'SUCCESS' : 'FAILED',
        reason: 'Unapproved Draft PO cleaned safely'
      });
    } else {
      auditLog.push({
        code: po.code,
        type: 'PURCHASE_ORDER',
        action: 'PRESERVED_FOR_AUDIT',
        result: 'PRESERVED',
        reason: `Approved/Received PO retained in immutable audit ledger (Status: ${po.status})`
      });
    }
  }

  console.log('\n--- CLEANUP AUDIT MANIFEST ---');
  console.table(auditLog);

  return auditLog;
}

runCleanup().catch(console.error);
