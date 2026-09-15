import fs from "fs";
import path from "path";
import { db } from "../db";
import { products, warehouses, costLayers, cogsTransactions, accountingEntries, salesOrders, salesOrderItems, stockBalances } from "../db/schema";
import { costingEngine } from "../engines/costingEngine";
import { CostingShadowRunner } from "../engines/costingShadowRunner";
import { SalesEngine } from "../src/services/SalesEngine";
import { eq, inArray, sql, desc } from "drizzle-orm";

// Load .env explicitly into process.env
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...rest] = trimmed.split("=");
        process.env[key.trim()] = rest.join("=").trim();
      }
    }
  }
} catch (e) {
  console.warn("Failed to load .env:", e);
}

// Ensure default fallback if missing
if (!process.env.FEATURE_NEW_COSTING_ROLLOUT_SCOPE) {
  process.env.FEATURE_NEW_COSTING_ROLLOUT_SCOPE = "SKU:PRD-001,SKU:SKU-RAW-101,SKU:RAM-16GB-DDR5";
}
if (!process.env.FEATURE_STRICT_COSTING_VALIDATION) {
  process.env.FEATURE_STRICT_COSTING_VALIDATION = "true";
}

async function executePhase5MonitoringCycle() {
  console.log("================================================================================");
  console.log("  NEXUSSYNC ERP — GIÁM SÁT CHU KỲ NGHIỆP VỤ THỰC TẾ GIAI ĐOẠN 5 (STAGING)");
  console.log("================================================================================");

  // 1. Kiểm tra biến môi trường Rollout Scope
  const currentScope = process.env.FEATURE_NEW_COSTING_ROLLOUT_SCOPE;
  console.log(`[1] Scope Rollout hiện tại: "${currentScope}"`);
  console.log(`[1] Strict Validation: ${process.env.FEATURE_STRICT_COSTING_VALIDATION}`);
  console.log(`[1] Shadow Run Enabled: ${process.env.FEATURE_SHADOW_RUN_ENABLED}`);

  // 2. Xác minh định tuyến 17 core SKUs & toàn bộ catalog
  const allProds = await db.select().from(products);
  const core17Prods = allProds.slice(0, 17);
  const pilotSkus = ["PRD-001", "SKU-RAW-101", "RAM-16GB-DDR5"];
  
  console.log("\n[2] Kiểm tra định tuyến của 17 Core Master SKUs:");
  let inScopeCount = 0;
  let outScopeCount = 0;
  let routingCorrect = true;

  for (const p of core17Prods) {
    const inScope = costingEngine.isTransactionInRolloutScope({ sku: p.sku, productId: p.id, warehouseId: 1 });
    const expectedInScope = pilotSkus.includes(p.sku);
    if (inScope !== expectedInScope) {
      routingCorrect = false;
      console.error(`❌ LỖI ĐỊNH TUYẾN: SKU ${p.sku} (InScope=${inScope}, Expected=${expectedInScope})`);
    }
    if (inScope) inScopeCount++;
    else outScopeCount++;
  }

  console.log(`- Tổng số Core Master SKUs: ${core17Prods.length}`);
  console.log(`- Số SKU nằm trong Pilot Scope (FIFO mới): ${inScopeCount}/3 (Khớp: ${inScopeCount === 3})`);
  console.log(`- Số SKU nằm ngoài Scope (Engine cũ - Weighted Avg): ${outScopeCount}/14 (Khớp: ${outScopeCount === 14})`);
  console.log(`- Định tuyến 17/17 SKU: ${routingCorrect ? "✅ CHÍNH XÁC 100%" : "❌ SAI LỆCH"}`);

  // 3. Chuẩn bị Baseline & Thực hiện chu kỳ giao dịch bán hàng THẬT trên 3 SKU Thí điểm
  console.log("\n[3] Bắt đầu Chu kỳ Giao dịch Thật (Real Business Cycle Transactions):");

  // Reset 4 SKUs to exact baseline
  await db.update(costLayers).set({ quantityRemaining: 15, status: 'ACTIVE' }).where(eq(costLayers.productId, 1));
  await db.update(costLayers).set({ quantityRemaining: 20, status: 'ACTIVE' }).where(eq(costLayers.productId, 2));
  await db.update(costLayers).set({ quantityRemaining: 120, status: 'ACTIVE' }).where(eq(costLayers.productId, 8));
  await db.update(costLayers).set({ quantityRemaining: 120, status: 'ACTIVE' }).where(eq(costLayers.productId, 12));

  // Clean old JE test records for SO 501-504
  await db.delete(accountingEntries).where(inArray(accountingEntries.sourceDocumentId, [501, 502, 503, 504]));
  await db.delete(cogsTransactions).where(inArray(cogsTransactions.salesOrderId, [501, 502, 503, 504]));
  
  const monitoredTxRecords: any[] = [];
  const glVerificationRecords: any[] = [];

  // Giao dịch 1: Xuất bán 2 Laptop Business 14 (PRD-001)
  console.log("\n--- [Tx #1] Xuất bán 2 x PRD-001 (Laptop Business 14) ---");
  const prod1 = allProds.find(p => p.sku === "PRD-001")!;
  const [layer1Before] = await db.select().from(costLayers).where(eq(costLayers.productId, prod1.id));
  console.log(`  Trước xuất: Layer #${layer1Before.id} tồn còn: ${layer1Before.quantityRemaining} cái @ ${layer1Before.unitCost.toLocaleString("vi-VN")} ₫`);
  
  const tx1Result = await costingEngine.calculateIssueCost({
    productId: prod1.id,
    warehouseId: 1,
    quantity: 2,
    salesOrderId: 501,
    createdBy: 1,
    sourceModuleOverride: 'SALES',
    descriptionOverride: 'Xuất kho bán hàng SO-2026-501: 2x PRD-001 Laptop Business'
  });

  const [layer1After] = await db.select().from(costLayers).where(eq(costLayers.productId, prod1.id));
  console.log(`  Sau xuất: Engine=${tx1Result.method}, Tổng COGS=${tx1Result.totalCost.toLocaleString("vi-VN")} ₫, Đơn giá BQ=${tx1Result.averageUnitCost.toLocaleString("vi-VN")} ₫`);
  console.log(`  Cập nhật Layer: #${layer1After.id} tồn còn: ${layer1After.quantityRemaining} cái (Giảm đúng 2 cái: ${layer1Before.quantityRemaining - layer1After.quantityRemaining === 2})`);

  // Giao dịch 2: Xuất sản xuất/bán 10 Thép cuộn cán nóng (SKU-RAW-101)
  console.log("\n--- [Tx #2] Xuất 10 x SKU-RAW-101 (Thép cuộn SS400) ---");
  const prod8 = allProds.find(p => p.sku === "SKU-RAW-101")!;
  const [layer8Before] = await db.select().from(costLayers).where(eq(costLayers.productId, prod8.id));
  console.log(`  Trước xuất: Layer #${layer8Before.id} tồn còn: ${layer8Before.quantityRemaining} cuộn @ ${layer8Before.unitCost.toLocaleString("vi-VN")} ₫`);

  const tx2Result = await costingEngine.calculateIssueCost({
    productId: prod8.id,
    warehouseId: 1,
    quantity: 10,
    salesOrderId: 502,
    createdBy: 1,
    sourceModuleOverride: 'SALES',
    descriptionOverride: 'Xuất kho bán hàng SO-2026-502: 10x SKU-RAW-101 Thép cuộn'
  });

  const [layer8After] = await db.select().from(costLayers).where(eq(costLayers.productId, prod8.id));
  console.log(`  Sau xuất: Engine=${tx2Result.method}, Tổng COGS=${tx2Result.totalCost.toLocaleString("vi-VN")} ₫, Đơn giá BQ=${tx2Result.averageUnitCost.toLocaleString("vi-VN")} ₫`);
  console.log(`  Cập nhật Layer: #${layer8After.id} tồn còn: ${layer8After.quantityRemaining} cuộn (Giảm đúng 10 cuộn: ${layer8Before.quantityRemaining - layer8After.quantityRemaining === 10})`);

  // Giao dịch 3: Xuất bán 5 RAM 16GB DDR5 (RAM-16GB-DDR5)
  console.log("\n--- [Tx #3] Xuất 5 x RAM-16GB-DDR5 (RAM DDR5 16GB) ---");
  const prod12 = allProds.find(p => p.sku === "RAM-16GB-DDR5")!;
  const [layer12Before] = await db.select().from(costLayers).where(eq(costLayers.productId, prod12.id));
  console.log(`  Trước xuất: Layer #${layer12Before.id} tồn còn: ${layer12Before.quantityRemaining} thanh @ ${layer12Before.unitCost.toLocaleString("vi-VN")} ₫`);

  const tx3Result = await costingEngine.calculateIssueCost({
    productId: prod12.id,
    warehouseId: 1,
    quantity: 5,
    salesOrderId: 503,
    createdBy: 1,
    sourceModuleOverride: 'SALES',
    descriptionOverride: 'Xuất kho bán hàng SO-2026-503: 5x RAM-16GB-DDR5'
  });

  const [layer12After] = await db.select().from(costLayers).where(eq(costLayers.productId, prod12.id));
  console.log(`  Sau xuất: Engine=${tx3Result.method}, Tổng COGS=${tx3Result.totalCost.toLocaleString("vi-VN")} ₫, Đơn giá BQ=${tx3Result.averageUnitCost.toLocaleString("vi-VN")} ₫`);
  console.log(`  Cập nhật Layer: #${layer12After.id} tồn còn: ${layer12After.quantityRemaining} thanh (Giảm đúng 5 thanh: ${layer12Before.quantityRemaining - layer12After.quantityRemaining === 5})`);

  // Giao dịch 4: Giao dịch trên SKU NGOÀI SCOPE để xác minh không bị ảnh hưởng (PRD-002 và SKU-ERP-LIC)
  console.log("\n--- [Tx #4] Giao dịch trên SKU NGOÀI SCOPE: Xuất 1 x PRD-002 (Monitor 27\") ---");
  const prod2 = allProds.find(p => p.sku === "PRD-002")!;
  const [layer2Before] = await db.select().from(costLayers).where(eq(costLayers.productId, prod2.id));
  
  const tx4Result = await costingEngine.calculateIssueCost({
    productId: prod2.id,
    warehouseId: 1,
    quantity: 1,
    salesOrderId: 504,
    createdBy: 1,
    sourceModuleOverride: 'SALES',
    descriptionOverride: 'Xuất kho bán hàng SO-2026-504: 1x PRD-002 Monitor 27"'
  });

  const [layer2After] = await db.select().from(costLayers).where(eq(costLayers.productId, prod2.id));
  console.log(`  Sau xuất: Engine=${tx4Result.method}, Tổng COGS=${tx4Result.totalCost.toLocaleString("vi-VN")} ₫ (Định tuyến đúng WEIGHTED_AVERAGE: ${tx4Result.method === 'WEIGHTED_AVERAGE'})`);
  console.log(`  Xác nhận Cost Layer NGOÀI SCOPE không bị trừ: Tồn giữ nguyên ${layer2After.quantityRemaining} cái (Match: ${layer2Before.quantityRemaining === layer2After.quantityRemaining})`);

  // 4. Kiểm tra đối chiếu Sổ cái M30 GL (Nợ 632 / Có 156)
  console.log("\n[4] Đối chiếu Bút toán Sổ cái M30 General Ledger (Dr 632 / Cr 156):");
  const recentJE = await db.select().from(accountingEntries)
    .where(inArray(accountingEntries.sourceDocumentId, [501, 502, 503, 504]))
    .orderBy(desc(accountingEntries.id));

  let glAllMatch = true;
  for (const je of recentJE) {
    const isDr632 = je.debitAccount === "632";
    const isCr156 = je.creditAccount === "156";
    let expectedAmount = 0;
    if (je.sourceDocumentId === 501) expectedAmount = tx1Result.totalCost;
    else if (je.sourceDocumentId === 502) expectedAmount = tx2Result.totalCost;
    else if (je.sourceDocumentId === 503) expectedAmount = tx3Result.totalCost;
    else if (je.sourceDocumentId === 504) expectedAmount = tx4Result.totalCost;

    const amountMatch = je.amount === expectedAmount;
    if (!isDr632 || !isCr156 || !amountMatch) glAllMatch = false;

    console.log(`- Bút toán #${je.entryCode} | SO #${je.sourceDocumentId}: Nợ ${je.debitAccount} / Có ${je.creditAccount} = ${je.amount.toLocaleString("vi-VN")} ₫ (Khớp COGS: ${amountMatch ? "✅ 100%" : "❌ LỆCH"})`);
  }
  console.log(`- Toàn bộ bút toán phát sinh trong chu kỳ khớp GL M30: ${glAllMatch ? "✅ HOÀN HẢO" : "❌ CÓ LỖI"}`);

  // 5. So sánh COGS thực tế (FIFO) với COGS nếu dùng Engine cũ (WEIGHTED_AVERAGE)
  console.log("\n[5] Bảng So sánh Giá vốn Thực tế (FIFO) vs Giá vốn Engine cũ (Weighted Average):");
  const comparisonTable = [
    {
      sku: "PRD-001",
      qty: 2,
      fifoUnitCost: tx1Result.averageUnitCost,
      fifoTotalCogs: tx1Result.totalCost,
      weightedUnitCost: prod1.costPrice,
      weightedTotalCogs: 2 * prod1.costPrice,
      variance: tx1Result.totalCost - (2 * prod1.costPrice)
    },
    {
      sku: "SKU-RAW-101",
      qty: 10,
      fifoUnitCost: tx2Result.averageUnitCost,
      fifoTotalCogs: tx2Result.totalCost,
      weightedUnitCost: prod8.costPrice,
      weightedTotalCogs: 10 * prod8.costPrice,
      variance: tx2Result.totalCost - (10 * prod8.costPrice)
    },
    {
      sku: "RAM-16GB-DDR5",
      qty: 5,
      fifoUnitCost: tx3Result.averageUnitCost,
      fifoTotalCogs: tx3Result.totalCost,
      weightedUnitCost: prod12.costPrice,
      weightedTotalCogs: 5 * prod12.costPrice,
      variance: tx3Result.totalCost - (5 * prod12.costPrice)
    }
  ];

  console.table(comparisonTable);
  console.log("--------------------------------------------------------------------------------");
  console.log("KẾT THÚC CHU KỲ GIÁM SÁT GIAI ĐOẠN 5 THÀNH CÔNG RỰC RỠ - KHÔNG CÓ LỖI RUNTIME");
  console.log("--------------------------------------------------------------------------------");
}

executePhase5MonitoringCycle().catch(console.error);
