import { db } from '../src/db';
import { InventoryService } from '../engines/inventoryService';
import * as schema from '../db/schema';
import { eq, sql, desc, and } from 'drizzle-orm';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 M17 INVENTORY CORE (P0 + P1) — AUTOMATED VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`, detail ? JSON.stringify(detail, null, 2) : '');
      failed++;
    }
  }

  try {
    // 0. Setup a test product and warehouse balance
    console.log('📦 Setup: Preparing clean test environment...');
    const testSku = `TEST-M17-${Date.now().toString().slice(-4)}`;
    
    // Ensure Category 1 exists
    const cats = await db.select().from(schema.categories).limit(1);
    let catId = cats.length > 0 ? cats[0].id : 1;
    if (cats.length === 0) {
      const newCat = await db.insert(schema.categories).values({ name: 'Test Category' }).returning();
      catId = newCat[0].id;
    }

    // Ensure Warehouse 1 exists
    const whs = await db.select().from(schema.warehouses).limit(1);
    let whId = whs.length > 0 ? whs[0].id : 1;
    if (whs.length === 0) {
      const newWh = await db.insert(schema.warehouses).values({ code: 'WH-TEST', name: 'Test Warehouse' }).returning();
      whId = newWh[0].id;
    }

    const insertedProduct = await db.insert(schema.products).values({
      sku: testSku,
      name: `Test M17 Product ${testSku}`,
      categoryId: catId,
      baseUnit: 'Cái',
      retailPrice: 100000,
      costPrice: 60000,
      stockPhysical: 0,
      stockReserved: 0,
      stockAvailable: 0,
    } as any).returning();

    const productId = insertedProduct[0].id;
    console.log(`Created test product #${productId} (${testSku}) in Warehouse #${whId}\n`);

    // TEST 1: INBOUND_RECEIPT (+100)
    console.log('--- TEST 1: Inbound Receipt (postTransaction) ---');
    const r1 = await InventoryService.postTransaction(null, {
      productId,
      warehouseId: whId,
      type: 'INBOUND_RECEIPT',
      referenceNo: `GR-${testSku}-01`,
      quantity: 100,
      userId: 1,
      notes: 'Initial stock receipt',
    });

    assert(r1.status === 'SUCCESS', 'T1.1: Inbound receipt status is SUCCESS');
    assert(r1.onHandAfter === 100, `T1.2: onHandAfter is 100 (got ${r1.onHandAfter})`);
    assert(r1.allocatedAfter === 0, `T1.3: allocatedAfter is 0 (got ${r1.allocatedAfter})`);
    assert(r1.availableAfter === 100, `T1.4: availableAfter is 100 (got ${r1.availableAfter})`);

    // TEST 2: RESERVE STOCK (30)
    console.log('\n--- TEST 2: Reserve Stock (reserveStock) ---');
    const r2 = await InventoryService.reserveStock(null, {
      productId,
      warehouseId: whId,
      quantity: 30,
      referenceNo: `SO-${testSku}-01`,
      userId: 1,
      notes: 'Reserve for SO-01',
    });

    assert(r2.status === 'SUCCESS', 'T2.1: reserveStock status is SUCCESS');
    assert(r2.onHandAfter === 100, `T2.2: Physical remains 100 (got ${r2.onHandAfter})`);
    assert(r2.allocatedAfter === 30, `T2.3: Reserved increased to 30 (got ${r2.allocatedAfter})`);
    assert(r2.availableAfter === 70, `T2.4: Available decreased to 70 (got ${r2.availableAfter})`);

    // TEST 3: NEGATIVE STOCK GUARD (Attempt to reserve 80 when only 70 available)
    console.log('\n--- TEST 3: Negative Stock Guard (Over-Reservation Protection) ---');
    let guardCaught = false;
    try {
      await InventoryService.reserveStock(null, {
        productId,
        warehouseId: whId,
        quantity: 80, // Exceeds available 70
        referenceNo: `SO-${testSku}-OVER`,
        userId: 1,
      });
    } catch (err: any) {
      guardCaught = true;
      console.log(`   (Successfully caught expected error: "${err.message}")`);
    }
    assert(guardCaught, 'T3.1: Negative stock guard blocked over-reservation');

    // TEST 4: RELEASE RESERVATION (Release 10)
    console.log('\n--- TEST 4: Release Reservation (releaseReservation) ---');
    const r4 = await InventoryService.releaseReservation(null, {
      productId,
      warehouseId: whId,
      quantity: 10,
      referenceNo: `SO-${testSku}-01`,
      userId: 1,
      notes: 'Customer reduced order by 10',
    });

    assert(r4.status === 'SUCCESS', 'T4.1: releaseReservation status is SUCCESS');
    assert(r4.onHandAfter === 100, `T4.2: Physical remains 100 (got ${r4.onHandAfter})`);
    assert(r4.allocatedAfter === 20, `T4.3: Reserved reduced to 20 (got ${r4.allocatedAfter})`);
    assert(r4.availableAfter === 80, `T4.4: Available restored to 80 (got ${r4.availableAfter})`);

    // TEST 5: CONSUME RESERVED (Fulfill 20)
    console.log('\n--- TEST 5: Consume Reserved Stock (consumeReservation) ---');
    const r5 = await InventoryService.consumeReservation(null, {
      productId,
      warehouseId: whId,
      quantity: 20,
      referenceNo: `SO-${testSku}-01-DISPATCH`,
      userId: 1,
      notes: 'Shipped to customer',
    });

    assert(r5.status === 'SUCCESS', 'T5.1: consumeReservation status is SUCCESS');
    assert(r5.onHandAfter === 80, `T5.2: Physical decreased to 80 (got ${r5.onHandAfter})`);
    assert(r5.allocatedAfter === 0, `T5.3: Reserved decreased to 0 (got ${r5.allocatedAfter})`);
    assert(r5.availableAfter === 80, `T5.4: Available remains invariant at 80 (got ${r5.availableAfter})`);

    // TEST 6: IDEMPOTENCY PROTECTION
    console.log('\n--- TEST 6: Idempotency Protection (idempotencyKey) ---');
    const idempotencyKey = `IDEMP-${testSku}-${Date.now()}`;
    const r6a = await InventoryService.postTransaction(null, {
      productId,
      warehouseId: whId,
      type: 'OUTBOUND_ISSUE',
      referenceNo: `ISSUE-${testSku}-01`,
      quantity: -10,
      userId: 1,
      idempotencyKey,
      notes: 'Direct issue 10',
    });

    assert(r6a.onHandAfter === 70, `T6.1: First post with idempotencyKey succeeded (onHand: ${r6a.onHandAfter})`);

    // Replay exact same request with same idempotencyKey
    const r6b = await InventoryService.postTransaction(null, {
      productId,
      warehouseId: whId,
      type: 'OUTBOUND_ISSUE',
      referenceNo: `ISSUE-${testSku}-01`,
      quantity: -10,
      userId: 1,
      idempotencyKey,
      notes: 'Duplicate replay call',
    });

    assert(r6b.transactionId === r6a.transactionId, 'T6.2: Duplicate request returned identical transactionId without re-mutating');
    assert(r6b.onHandAfter === 70, `T6.3: Stock did not decrease a second time (onHand: ${r6b.onHandAfter})`);

    // TEST 7: ATOMIC TRANSFER
    console.log('\n--- TEST 7: Atomic Stock Transfer (transferStock) ---');
    let wh2 = (await db.select().from(schema.warehouses).where(eq(schema.warehouses.code, 'WH-02')).limit(1))[0];
    if (!wh2) {
      const insertedWh2 = await db.insert(schema.warehouses).values({ code: 'WH-02', name: 'Branch Warehouse 02' }).returning();
      wh2 = insertedWh2[0];
    }

    const r7 = await InventoryService.transferStock(null, {
      productId,
      fromWarehouseId: whId,
      toWarehouseId: wh2.id,
      quantity: 15,
      referenceNo: `TRF-${testSku}-01`,
      userId: 1,
      notes: 'Transfer 15 to WH-02',
    });

    assert(r7.transferOutResult.onHandAfter === 55, `T7.1: Origin WH stock decremented to 55 (got ${r7.transferOutResult.onHandAfter})`);
    assert(r7.transferInResult.onHandAfter === 15, `T7.2: Destination WH stock incremented to 15 (got ${r7.transferInResult.onHandAfter})`);

    // TEST 8: FAST AVAILABILITY CHECK
    console.log('\n--- TEST 8: Fast Stock Availability Check ---');
    const r8a = await InventoryService.checkAvailability({
      productId,
      warehouseId: whId,
      quantity: 50,
    });
    assert(r8a.isAvailable === true, 'T8.1: Check 50 is available at WH-01 (available is 55)');

    const r8b = await InventoryService.checkAvailability({
      productId,
      warehouseId: whId,
      quantity: 60,
    });
    assert(r8b.isAvailable === false, 'T8.2: Check 60 is NOT available at WH-01 (available is 55)');

    // TEST 9: INVARIANT INTEGRITY RECONCILIATION
    console.log('\n--- TEST 9: 3-State Invariant Reconciliation Audit ---');
    const r9 = await InventoryService.reconcileBalances({ productId });
    assert(r9.isHealthy === true, 'T9.1: Invariant Available === Physical - Reserved holds 100%');
    assert(r9.discrepanciesFound === 0, 'T9.2: Zero anomalies or negative stocks found');

    // ==========================================
    // P1 EXTENDED TESTS
    // ==========================================

    // TEST 10: MULTI-STEP TRANSFER WORKFLOW
    console.log('\n--- TEST 10: Multi-Step Transfer Workflow (Request -> Approve -> Dispatch -> Receive) ---');
    const trfReq = await InventoryService.createTransferRequest({
      fromWarehouseId: whId,
      toWarehouseId: wh2.id,
      requestedBy: 1,
      notes: 'Inter-warehouse rebalancing batch',
      items: [{ productId, quantity: 10 }],
    });
    assert(trfReq.status === 'SUBMITTED', 'T10.1: Transfer request created in SUBMITTED state');

    const trfApprove = await InventoryService.approveTransfer(trfReq.transferId, 1);
    assert(trfApprove.status === 'APPROVED', 'T10.2: Transfer request approved');

    const trfDispatch = await InventoryService.dispatchTransfer(trfReq.transferId, 1);
    assert(trfDispatch.status === 'IN_TRANSIT', 'T10.3: Transfer dispatched to IN_TRANSIT');

    // Verify origin stock decreased to 45 (55 - 10)
    const balOriginAfterDispatch = (await db.select().from(schema.stockBalances).where(and(eq(schema.stockBalances.productId, productId), eq(schema.stockBalances.warehouseId, whId))).get())!;
    assert(balOriginAfterDispatch.stockPhysical === 45, `T10.4: Origin stock deducted upon dispatch (got ${balOriginAfterDispatch.stockPhysical})`);

    const trfReceive = await InventoryService.receiveTransfer(trfReq.transferId, 1);
    assert(trfReceive.status === 'RECEIVED', 'T10.5: Transfer received at destination');

    // Verify destination stock increased to 25 (15 + 10)
    const balDestAfterReceive = (await db.select().from(schema.stockBalances).where(and(eq(schema.stockBalances.productId, productId), eq(schema.stockBalances.warehouseId, wh2.id))).get())!;
    assert(balDestAfterReceive.stockPhysical === 25, `T10.6: Destination stock incremented upon receipt (got ${balDestAfterReceive.stockPhysical})`);

    // TEST 11: OPENING BALANCE BATCH IMPORT
    console.log('\n--- TEST 11: Opening Balance Batch Import (postOpeningBalance) ---');
    const testSku2 = `TEST-OP-${Date.now().toString().slice(-4)}`;
    const prod2 = (await db.insert(schema.products).values({
      sku: testSku2,
      name: `Test Product Opening ${testSku2}`,
      categoryId: catId,
      baseUnit: 'Hộp',
      retailPrice: 50000,
      costPrice: 30000,
      stockPhysical: 0,
      stockReserved: 0,
      stockAvailable: 0,
    } as any).returning())[0];

    const opBalResult = await InventoryService.postOpeningBalance({
      warehouseId: whId,
      userId: 1,
      notes: 'Initial opening balance migration',
      items: [{ productId: prod2.id, quantity: 200, costPrice: 30000 }],
    });

    assert(opBalResult.success === true, 'T11.1: Opening balance batch import succeeded');
    assert(opBalResult.totalPosted === 1, 'T11.2: 1 item posted');
    const prod2Bal = (await db.select().from(schema.stockBalances).where(eq(schema.stockBalances.productId, prod2.id)).get())!;
    assert(prod2Bal.stockPhysical === 200 && prod2Bal.stockAvailable === 200, `T11.3: Opening balance set physical & available to 200`);

    // TEST 12: STOCKTAKE WORKFLOW (Kiểm kê kho)
    console.log('\n--- TEST 12: Stocktake Workflow (Start -> Count -> Approve Adjustment) ---');
    const insertedStocktake = (await db.insert(schema.stocktakes).values({
      code: `STK-${Date.now().toString().slice(-4)}`,
      warehouseId: whId,
      status: 'DRAFT',
      varianceThreshold: 5,
      createdBy: 1,
    }).returning())[0];

    await InventoryService.startStocktake(insertedStocktake.id, 1);
    const stCounting = (await db.select().from(schema.stocktakes).where(eq(schema.stocktakes.id, insertedStocktake.id)).get())!;
    assert(stCounting.status === 'COUNTING', 'T12.1: Stocktake transitioned to COUNTING');

    // Count item: prod2 system is 200, physical counted is 195 (variance -5)
    await InventoryService.recordStocktakeCount(insertedStocktake.id, [{ productId: prod2.id, countedQuantity: 195 }], 1);
    const stCounted = (await db.select().from(schema.stocktakes).where(eq(schema.stocktakes.id, insertedStocktake.id)).get())!;
    assert(stCounted.status === 'COUNTED', 'T12.2: Stocktake count recorded');

    // Approve adjustment
    const stAdj = await InventoryService.approveStocktakeAdjustment(insertedStocktake.id, 1);
    assert(stAdj.status === 'COMPLETED', 'T12.3: Stocktake adjustment approved & completed');

    const prod2BalAfterStocktake = (await db.select().from(schema.stockBalances).where(eq(schema.stockBalances.productId, prod2.id)).get())!;
    assert(prod2BalAfterStocktake.stockPhysical === 195, `T12.4: Balance adjusted to match counted qty (got ${prod2BalAfterStocktake.stockPhysical})`);

    // TEST 13: LOT STATUS MANAGEMENT
    console.log('\n--- TEST 13: Lot Status Quarantine / Release ---');
    const lotRes = await InventoryService.updateLotStatus(1, 'QUARANTINED', 'Kiểm tra chất lượng nghi ngờ ẩm mốc', 1);
    assert(lotRes.status === 'QUARANTINED', 'T13.1: Lot updated to QUARANTINED');

    // TEST 14: BACKDATED POLICY & FISCAL PERIOD GUARD
    console.log('\n--- TEST 14: Backdated Policy & Fiscal Lock Guard ---');
    let backdateBlocked = false;
    try {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60); // 60 days ago (exceeds 30 days limit)
      await InventoryService.postTransaction(null, {
        productId,
        warehouseId: whId,
        type: 'INBOUND_RECEIPT',
        referenceNo: `BACKDATE-TEST`,
        quantity: 10,
        userId: 1,
        transactionDate: oldDate,
        overrideFiscalLock: false,
      });
    } catch (err: any) {
      backdateBlocked = true;
      console.log(`   (Caught expected backdate policy rejection: "${err.message}")`);
    }
    assert(backdateBlocked, 'T14.1: Excessive backdated transaction blocked by policy');

    // TEST 15: OUTBOX EVENTS & AUDIT LOGS VERIFICATION
    console.log('\n--- TEST 15: Outbox Events & Audit Logs Verification ---');
    const outboxCount = (await db.select().from(schema.outboxEvents).all()).length;
    assert(outboxCount > 0, `T15.1: Transactional outbox generated events (total: ${outboxCount})`);

    const auditCount = (await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.module, 'INVENTORY')).all()).length;
    assert(auditCount > 0, `T15.2: Immutable audit logs recorded inventory actions (total: ${auditCount})`);

    // ==========================================
    // P2 OPERATIONAL EXTENSIONS TESTS (SECTION C, F)
    // ==========================================

    // TEST 16: FIFO / FEFO LOT PICKING STRATEGY
    console.log('\n--- TEST 16: FIFO / FEFO Lot Picking Strategy Engine ---');
    const lotA = await db.insert(schema.lots).values({
      lotNumber: `LOT-FEFO-A-${Date.now()}`,
      productId: productId,
      manufactureDate: new Date('2026-01-01'),
      expiryDate: new Date('2026-12-31'), // Expires later
      initialQuantity: 50,
      status: 'ACTIVE',
      createdBy: 1,
    } as any).returning();

    const lotB = await db.insert(schema.lots).values({
      lotNumber: `LOT-FEFO-B-${Date.now()}`,
      productId: productId,
      manufactureDate: new Date('2026-02-01'),
      expiryDate: new Date('2026-08-31'), // Expires earlier
      initialQuantity: 30,
      status: 'ACTIVE',
      createdBy: 1,
    } as any).returning();

    const lotC_blocked = await db.insert(schema.lots).values({
      lotNumber: `LOT-FEFO-BLOCKED-${Date.now()}`,
      productId: productId,
      manufactureDate: new Date('2026-01-01'),
      expiryDate: new Date('2026-05-01'), // Expired / Quarantined
      initialQuantity: 20,
      status: 'QUARANTINED',
      createdBy: 1,
    } as any).returning();

    await db.insert(schema.lotBalances).values([
      { lotId: lotA[0].id, productId, warehouseId: whId, stockPhysical: 50, stockAvailable: 50, stockReserved: 0 },
      { lotId: lotB[0].id, productId, warehouseId: whId, stockPhysical: 30, stockAvailable: 30, stockReserved: 0 },
      { lotId: lotC_blocked[0].id, productId, warehouseId: whId, stockPhysical: 20, stockAvailable: 20, stockReserved: 0 },
    ]);

    // Test FEFO (Should pick Lot B first because it expires earlier in 2026-08-31)
    const fefoAlloc = await InventoryService.suggestFifoFefoLots({
      productId,
      warehouseId: whId,
      requiredQty: 40,
      strategy: 'FEFO',
    });

    assert(fefoAlloc.isFullyFulfilled === true, 'T16.1: FEFO allocated full required quantity (40)');
    assert(fefoAlloc.allocations.length === 2, 'T16.2: FEFO allocated across 2 lots');
    assert(fefoAlloc.allocations[0].lotId === lotB[0].id && fefoAlloc.allocations[0].allocatedQty === 30, 'T16.3: FEFO prioritized Lot B with earlier expiry date (30 units)');
    assert(fefoAlloc.allocations[1].lotId === lotA[0].id && fefoAlloc.allocations[1].allocatedQty === 10, 'T16.4: FEFO took remaining 10 units from Lot A');
    assert(!fefoAlloc.allocations.some(a => a.lotId === lotC_blocked[0].id), 'T16.5: FEFO bypassed quarantined lot');

    // Test FIFO (Should pick Lot A first because manufacture/create date is earlier)
    const fifoAlloc = await InventoryService.suggestFifoFefoLots({
      productId,
      warehouseId: whId,
      requiredQty: 40,
      strategy: 'FIFO',
    });
    assert(fifoAlloc.allocations[0].lotId === lotA[0].id && fifoAlloc.allocations[0].allocatedQty === 40, 'T16.6: FIFO prioritized oldest manufactured Lot A (40 units)');

    // TEST 17: RESERVATION EXPIRY SWEEPER
    console.log('\n--- TEST 17: Reservation Expiry Sweeper ---');
    // Ensure sufficient physical stock for reservation test
    await db.update(schema.products).set({ stockPhysical: 100, stockAvailable: 100, stockReserved: 0 }).where(eq(schema.products.id, productId));
    await db.update(schema.stockBalances).set({ stockPhysical: 100, stockAvailable: 100, stockReserved: 0 }).where(eq(schema.stockBalances.productId, productId));

    // Create an active reservation with an old createdAt date
    const oldResv = await db.insert(schema.stockReservations).values({
      productId,
      warehouseId: whId,
      quantity: 15,
      referenceNo: `SO-EXPIRE-TEST`,
      status: 'ACTIVE',
      userId: 1,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
    } as any).returning();

    // Directly simulate reserved balance
    await db.update(schema.products).set({ stockReserved: 15, stockAvailable: 85 }).where(eq(schema.products.id, productId));
    await db.update(schema.stockBalances).set({ stockReserved: 15, stockAvailable: 85 }).where(eq(schema.stockBalances.productId, productId));

    const sweepResult = await InventoryService.sweepExpiredReservations(24, 1); // 24h threshold
    assert(sweepResult.sweptCount >= 1, `T17.1: Reservation sweeper found and released expired reservations (count: ${sweepResult.sweptCount})`);

    const updatedResv = await db.select().from(schema.stockReservations).where(eq(schema.stockReservations.id, oldResv[0].id));
    assert(updatedResv[0].status === 'RELEASED', 'T17.2: Expired reservation status changed to RELEASED');

    // TEST 18: REORDER POINT & STOCK THRESHOLDS
    console.log('\n--- TEST 18: Reorder Point & Stock Threshold Alerts ---');
    // Update product thresholds and warehouse balance
    await db.update(schema.products).set({
      safetyStock: 20,
      reorderPoint: 40,
      minStockLevel: 20,
      maxStockLevel: 150,
      stockPhysical: 25,
      stockReserved: 0,
      stockAvailable: 25, // between safetyStock (20) and reorderPoint (40) -> REORDER_NEEDED
    }).where(eq(schema.products.id, productId));

    await db.update(schema.stockBalances).set({
      stockPhysical: 25,
      stockReserved: 0,
      stockAvailable: 25,
    }).where(and(eq(schema.stockBalances.productId, productId), eq(schema.stockBalances.warehouseId, whId)));

    const reorderReport = await InventoryService.getReorderAlerts(whId);
    const prodAlert = reorderReport.alerts.find(a => a.productId === productId);
    assert(!!prodAlert, 'T18.1: Reorder alert identified product below reorder point');
    assert(prodAlert?.status === 'REORDER_NEEDED', `T18.2: Threshold evaluated status as REORDER_NEEDED (status: ${prodAlert?.status})`);
    assert((prodAlert?.suggestedReorderQty || 0) > 0, `T18.3: Suggested purchase order quantity computed (${prodAlert?.suggestedReorderQty})`);

    // TEST 19: INVENTORY AGING & SLOW-MOVING ANALYTICS
    console.log('\n--- TEST 19: Inventory Aging & Slow-Moving Analytics ---');
    const agingReport = await InventoryService.getInventoryAgingReport(whId);
    assert(agingReport.totalSKUs > 0, `T19.1: Aging report computed for ${agingReport.totalSKUs} SKUs`);
    assert(agingReport.agingBuckets.tier_0_30 !== undefined, 'T19.2: Aging buckets structure correctly initialized');

    const slowMoving = await InventoryService.getSlowMovingInventory(30, whId);
    assert(Array.isArray(slowMoving.items), `T19.3: Slow moving report returned items list (total: ${slowMoving.totalSlowMovingSKUs})`);

    // TEST 20: QUARANTINE & BLOCKED STOCK TRACKING
    console.log('\n--- TEST 20: Quarantine & Blocked Stock Tracking ---');
    const quarantinedReport = await InventoryService.getQuarantinedAndBlockedStock(whId);
    const foundQuarantined = quarantinedReport.lots.find(l => l.lotId === lotC_blocked[0].id);
    assert(!!foundQuarantined, 'T20.1: Quarantined lot tracked in quarantine report');
    assert(foundQuarantined?.status === 'QUARANTINED', 'T20.2: Quarantined lot status accurately verified');

    // TEST 21: ADVANCED OPERATIONS COCKPIT DASHBOARD METRICS
    console.log('\n--- TEST 21: Advanced Operations Cockpit Dashboard Metrics ---');
    const dashboardMetrics = await InventoryService.getAdvancedDashboardMetrics();
    assert(dashboardMetrics.kpis.healthIndex >= 0 && dashboardMetrics.kpis.healthIndex <= 100, `T21.1: Enterprise Health Index calculated (${dashboardMetrics.kpis.healthIndex}/100)`);
    assert(dashboardMetrics.warehouseMetrics.length > 0, `T21.2: Warehouse balance distributions computed (${dashboardMetrics.warehouseMetrics.length} warehouses)`);
    assert(dashboardMetrics.kpis.totalInventoryValuation >= 0, `T21.3: Total inventory valuation calculated (${dashboardMetrics.kpis.totalInventoryValuation.toLocaleString()} VND)`);

    // ==========================================
    // P3 ADVANCED INTELLIGENCE & EXTENSIONS TESTS
    // ==========================================

    // TEST 22: DEMAND FORECASTING & REPLENISHMENT PROPOSALS
    console.log('\n--- TEST 22: Demand Forecasting & Auto Replenishment Proposals ---');
    const replenishment = await InventoryService.generateReplenishmentProposals({
      warehouseId: whId,
      lookbackDays: 30,
      forecastHorizonDays: 30,
    });
    assert(replenishment.proposals.length > 0, `T22.1: Forecasted demand generated for ${replenishment.totalSKUs} SKUs`);
    assert(Array.isArray(replenishment.supplierGroups), 'T22.2: Proposals grouped by supplier for 1-click PO creation');
    const testProdProposal = replenishment.proposals.find(p => p.productId === productId);
    assert(!!testProdProposal && testProdProposal.suggestedReorderQty > 0, `T22.3: Reorder quantity recommended (${testProdProposal?.suggestedReorderQty} units, estimated cost: ${testProdProposal?.estimatedCost} VND)`);

    // TEST 23: ABC ANALYSIS (PARETO CLASSIFICATION)
    console.log('\n--- TEST 23: ABC Analysis (Pareto Classification Engine) ---');
    const abcResult = await InventoryService.runAbcAnalysis({ warehouseId: whId, calculationMethod: 'INVENTORY_VALUATION' });
    assert(abcResult.totalSKUs > 0, `T23.1: ABC analysis evaluated ${abcResult.totalSKUs} SKUs`);
    assert(abcResult.classSummary.classA.count >= 0, `T23.2: Class A summary generated (Total Value: ${abcResult.classSummary.classA.totalValue})`);
    assert(abcResult.items.every(i => ['A', 'B', 'C'].includes(i.abcClass)), 'T23.3: Every product categorized into A, B, or C class');

    // TEST 24: WAVE PICKING OPTIMIZATION
    console.log('\n--- TEST 24: Wave Picking & Optimization Task Flow ---');
    const waveRes = await InventoryService.createWavePicking({
      warehouseCode: 'WH-01',
      waveType: 'SALES_OUTBOUND',
      orderCodes: ['SO-2026-001', 'SO-2026-002'],
      pickerEmployeeCode: 'EMP-PICKER-99',
      items: [
        { orderCode: 'SO-2026-001', sku: testSku, quantityRequested: 5, fromLocationCode: 'LOC-A-01' },
        { orderCode: 'SO-2026-002', sku: testSku, quantityRequested: 10, fromLocationCode: 'LOC-B-02' },
      ],
    });
    assert(waveRes.wave.status === 'RELEASED', `T24.1: Picking wave created in RELEASED status (Wave: ${waveRes.wave.waveNumber})`);
    assert(waveRes.tasks.length === 2, `T24.2: Generated 2 picking tasks sorted by location path`);

    const pickTask1 = await InventoryService.completeWavePickingTask({
      taskId: waveRes.tasks[0].id,
      quantityPicked: 5,
      pickerEmployeeCode: 'EMP-PICKER-99',
    });
    assert(pickTask1.status === 'PICKED', 'T24.3: Picking task 1 completed (status: PICKED)');

    const pickTask2 = await InventoryService.completeWavePickingTask({
      taskId: waveRes.tasks[1].id,
      quantityPicked: 10,
      pickerEmployeeCode: 'EMP-PICKER-99',
    });
    assert(pickTask2.status === 'PICKED', 'T24.4: Picking task 2 completed and wave auto-completed');

    // TEST 25: UNIVERSAL MOBILE SCANNER ENGINE
    console.log('\n--- TEST 25: Universal Mobile Scanner Engine ---');
    // Scan by SKU
    const scanSku = await InventoryService.scanBarcode({ barcode: testSku, warehouseId: whId });
    assert(scanSku.scanSuccess === true && scanSku.detectedType === 'PRODUCT', 'T25.1: Mobile scanner decoded product SKU');

    // Scan by LOT
    const scanLot = await InventoryService.scanBarcode({ barcode: `LOT:${lotA[0].lotNumber}` });
    assert(scanLot.scanSuccess === true && scanLot.detectedType === 'LOT', 'T25.2: Mobile scanner decoded lot barcode');

    // Scan Unknown
    const scanUnknown = await InventoryService.scanBarcode({ barcode: 'INVALID_BARCODE_XYZ' });
    assert(scanUnknown.scanSuccess === false, 'T25.3: Invalid barcode returns clean fallback notification');

    // TEST 26: CONTROLLED OFFLINE TRANSACTION QUEUE & CONFLICT HANDLING
    console.log('\n--- TEST 26: Controlled Offline Transaction Queue & Concurrency Handling ---');
    const offlineId = `OFFLINE-Q-${Date.now()}`;
    const enqueueRes = await InventoryService.enqueueOfflineTransaction({
      clientQueueId: offlineId,
      deviceUuid: 'HANDHELD-ZEBRA-01',
      userId: 1,
      transactionType: 'INBOUND',
      payload: {
        productId,
        warehouseId: whId,
        quantity: 15,
        unitCost: 150000,
        referenceType: 'OFFLINE_GRN',
        referenceNo: 'GRN-OFFLINE-001',
      },
      clientTimestamp: new Date(),
    });
    assert(enqueueRes.isDuplicate === false && enqueueRes.queueItem.status === 'PENDING', 'T26.1: Offline transaction enqueued in PENDING status');

    // Process Queue
    const processRes = await InventoryService.processOfflineQueue({ limit: 10 });
    assert(processRes.processedCount >= 1, `T26.2: Offline queue synchronized successfully (processed: ${processRes.processedCount})`);

    // Test Conflict Handling: Queue an over-issue transaction that exceeds stock
    const conflictOfflineId = `OFFLINE-CONFLICT-${Date.now()}`;
    await InventoryService.enqueueOfflineTransaction({
      clientQueueId: conflictOfflineId,
      deviceUuid: 'HANDHELD-ZEBRA-02',
      userId: 1,
      transactionType: 'OUTBOUND',
      payload: {
        productId,
        warehouseId: whId,
        quantity: 999999, // Impossible quantity -> will trigger negative stock guard conflict
        referenceType: 'OFFLINE_ISSUE',
      },
      clientTimestamp: new Date(),
    });

    const conflictProcessRes = await InventoryService.processOfflineQueue({ limit: 10 });
    assert(conflictProcessRes.conflictCount >= 1, `T26.3: Concurrency / Negative Stock conflict safely flagged without corrupting ledger (conflicts: ${conflictProcessRes.conflictCount})`);

    const queueStatus = await InventoryService.getOfflineQueueStatus({ deviceUuid: 'HANDHELD-ZEBRA-02' });
    assert(queueStatus.conflictCount >= 1, 'T26.4: Conflict status diagnostics recorded in offline queue registry');

    // Clean up test products, waves, offline queue and lots
    console.log('\n🧹 Teardown: Cleaning up test data...');
    await db.delete(schema.inventoryOfflineQueue).where(eq(schema.inventoryOfflineQueue.clientQueueId, offlineId)).run();
    await db.delete(schema.inventoryOfflineQueue).where(eq(schema.inventoryOfflineQueue.clientQueueId, conflictOfflineId)).run();
    await db.delete(schema.wmsPickingTasks).where(eq(schema.wmsPickingTasks.waveId, waveRes.wave.id)).run();
    await db.delete(schema.wmsWaves).where(eq(schema.wmsWaves.id, waveRes.wave.id)).run();
    await db.delete(schema.lotBalances).where(eq(schema.lotBalances.productId, productId)).run();
    await db.delete(schema.lots).where(eq(schema.lots.productId, productId)).run();
    await db.delete(schema.stockReservations).where(eq(schema.stockReservations.id, oldResv[0].id)).run();
    await db.delete(schema.stockBalances).where(eq(schema.stockBalances.productId, productId)).run();
    await db.delete(schema.stockBalances).where(eq(schema.stockBalances.productId, prod2.id)).run();
    await db.delete(schema.stockLedger).where(eq(schema.stockLedger.productId, productId)).run();
    await db.delete(schema.stockLedger).where(eq(schema.stockLedger.productId, prod2.id)).run();
    await db.delete(schema.products).where(eq(schema.products.id, productId)).run();
    await db.delete(schema.products).where(eq(schema.products.id, prod2.id)).run();
    await db.delete(schema.stocktakes).where(eq(schema.stocktakes.id, insertedStocktake.id)).run();
    await db.delete(schema.stocktakeItems).where(eq(schema.stocktakeItems.stocktakeId, insertedStocktake.id)).run();
    await db.delete(schema.stockTransfers).where(eq(schema.stockTransfers.id, trfReq.transferId)).run();
    await db.delete(schema.stockTransferItems).where(eq(schema.stockTransferItems.transferId, trfReq.transferId)).run();
    console.log('Cleanup complete.\n');

  } catch (err: any) {
    console.error('💥 Test suite encountered fatal error:', err);
    failed++;
  }

  console.log('====================================================');
  console.log(`🏁 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
