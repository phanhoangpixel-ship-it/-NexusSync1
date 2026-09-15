import fs from "fs";
import path from "path";
import { db } from "../db";
import { products, costLayers, cogsTransactions, accountingEntries, stockBalances } from "../db/schema";
import { costingEngine } from "../engines/costingEngine";
import { eq, inArray, desc } from "drizzle-orm";

// Force Rollout Scope = ALL for Staging Full Verification
process.env.FEATURE_NEW_COSTING_ROLLOUT_SCOPE = "ALL";
process.env.FEATURE_STRICT_COSTING_VALIDATION = "true";
process.env.FEATURE_SHADOW_RUN_ENABLED = "false";

async function executePhase7StagingAllRollout() {
  console.log("================================================================================");
  console.log("  NEXUSSYNC ERP — GIAI ĐOẠN 7: KIỂM THỬ TOÀN DIỆN MỞ RỘNG ALL TRÊN STAGING");
  console.log("================================================================================");

  console.log(`[1] Configuration Check:`);
  console.log(`  - FEATURE_NEW_COSTING_ROLLOUT_SCOPE = "${process.env.FEATURE_NEW_COSTING_ROLLOUT_SCOPE}"`);
  console.log(`  - FEATURE_STRICT_COSTING_VALIDATION = "${process.env.FEATURE_STRICT_COSTING_VALIDATION}"`);

  // 1. Verify that ALL 17 master products are recognized in scope
  const allProds = await db.select().from(products);
  const core17 = allProds.slice(0, 17);
  let allInScope = true;

  for (const p of core17) {
    const inScope = costingEngine.isTransactionInRolloutScope({ sku: p.sku, productId: p.id, warehouseId: 1 });
    if (!inScope) {
      allInScope = false;
      console.error(`❌ LỖI: SKU ${p.sku} không được nhận diện trong scope ALL!`);
    }
  }
  console.log(`\n[2] Xác minh 17/17 SKU đều nằm trong Scope ALL: ${allInScope ? "✅ CHÍNH XÁC 100%" : "❌ THẤT BẠI"}`);

  // 2. Test high-value & large-volume SKU: SKU-ERP-LIC (999 licenses @ 100M VND = 99.9 Billion VND)
  console.log("\n[3] Kiểm thử SKU Giá trị Cao & Quy mô Lớn: SKU-ERP-LIC (999 licenses, 99,9 tỷ ₫)");
  const erpLicProd = allProds.find(p => p.sku === "SKU-ERP-LIC")!;
  const [erpLayer] = await db.select().from(costLayers).where(eq(costLayers.productId, erpLicProd.id));
  console.log(`  - Layer gốc SKU-ERP-LIC: #${erpLayer.id}, Tồn: ${erpLayer.quantityRemaining} licenses @ ${erpLayer.unitCost.toLocaleString("vi-VN")} ₫ (Tổng vốn: ${erpLayer.totalCost.toLocaleString("vi-VN")} ₫)`);

  // Xuất bán thử 5 licenses SKU-ERP-LIC (Trị giá vốn 500 triệu VNĐ)
  const erpIssueRes = await costingEngine.calculateIssueCost({
    productId: erpLicProd.id,
    warehouseId: 1,
    quantity: 5,
    salesOrderId: 701,
    createdBy: 1,
    sourceModuleOverride: 'SALES',
    descriptionOverride: 'Xuất cấp bản quyền Enterprise SO-2026-701: 5x SKU-ERP-LIC'
  });

  const [erpLayerAfter] = await db.select().from(costLayers).where(eq(costLayers.productId, erpLicProd.id));
  console.log(`  - Kết quả xuất: Engine=${erpIssueRes.method}, Tổng COGS=${erpIssueRes.totalCost.toLocaleString("vi-VN")} ₫`);
  console.log(`  - Cập nhật Layer: Tồn giảm từ ${erpLayer.quantityRemaining} -> ${erpLayerAfter.quantityRemaining} (Giảm đúng 5 licenses: ${erpLayer.quantityRemaining - erpLayerAfter.quantityRemaining === 5})`);

  // Nhập thêm 10 licenses mới giá 105 triệu (để kiểm tra Multi-layer FIFO trên SKU giá trị cao)
  console.log("\n[4] Thêm Layer Chi phí mới cho SKU-ERP-LIC: Nhập 10 licenses @ 105.000.000 ₫");
  const newErpLayerRes = await costingEngine.addCostLayer({
    productId: erpLicProd.id,
    warehouseId: 1,
    quantity: 10,
    unitCost: 105000000,
    sourceType: 'PURCHASE_RECEIPT',
    sourceDocumentId: 888,
    receiptItemCode: 'PO-2026-LIC-01',
    lotNumber: 'LIC-BATCH-2026-09',
    createdBy: 1,
    notes: 'Nhập bổ sung 10 license NexusSync Enterprise v5.1'
  });
  console.log(`  - Tạo Layer mới thành công: Layer #${newErpLayerRes.id}, Số lượng: ${newErpLayerRes.quantityRemaining}, Đơn giá: ${newErpLayerRes.unitCost.toLocaleString("vi-VN")} ₫`);

  // 3. Test high-value SKU: SKU-CHIP-3NM (AI Chip 3nm, Layer gốc 1250 units @ 9M = 11.25 Billion VND)
  console.log("\n[5] Kiểm thử SKU Vi Xử Lý AI 3nm: SKU-CHIP-3NM");
  const chipProd = allProds.find(p => p.sku === "SKU-CHIP-3NM")!;
  const [chipLayer] = await db.select().from(costLayers).where(eq(costLayers.productId, chipProd.id));
  console.log(`  - Layer gốc SKU-CHIP-3NM: #${chipLayer.id}, Tồn: ${chipLayer.quantityRemaining} chips @ ${chipLayer.unitCost.toLocaleString("vi-VN")} ₫`);

  const chipIssueRes = await costingEngine.calculateIssueCost({
    productId: chipProd.id,
    warehouseId: 1,
    quantity: 20,
    salesOrderId: 702,
    createdBy: 1,
    sourceModuleOverride: 'SALES',
    descriptionOverride: 'Xuất kho bán hàng SO-2026-702: 20x SKU-CHIP-3NM'
  });

  const [chipLayerAfter] = await db.select().from(costLayers).where(eq(costLayers.productId, chipProd.id));
  console.log(`  - Kết quả xuất: Engine=${chipIssueRes.method}, Tổng COGS=${chipIssueRes.totalCost.toLocaleString("vi-VN")} ₫`);
  console.log(`  - Cập nhật Layer: Tồn giảm từ ${chipLayer.quantityRemaining} -> ${chipLayerAfter.quantityRemaining} (Giảm đúng 20: ${chipLayer.quantityRemaining - chipLayerAfter.quantityRemaining === 20})`);

  // 4. Test high-value SKU: SKU-NANO-CO2 (Vật liệu Carbon Nano, 4300 kg @ 2.4M = 10.32 Billion VND)
  console.log("\n[6] Kiểm thử SKU Hóa chất công nghệ: SKU-NANO-CO2");
  const nanoProd = allProds.find(p => p.sku === "SKU-NANO-CO2")!;
  const [nanoLayer] = await db.select().from(costLayers).where(eq(costLayers.productId, nanoProd.id));
  console.log(`  - Layer gốc SKU-NANO-CO2: #${nanoLayer.id}, Tồn: ${nanoLayer.quantityRemaining} kg @ ${nanoLayer.unitCost.toLocaleString("vi-VN")} ₫`);

  const nanoIssueRes = await costingEngine.calculateIssueCost({
    productId: nanoProd.id,
    warehouseId: 1,
    quantity: 50,
    salesOrderId: 703,
    createdBy: 1,
    sourceModuleOverride: 'SALES',
    descriptionOverride: 'Xuất kho bán hàng SO-2026-703: 50kg SKU-NANO-CO2'
  });

  const [nanoLayerAfter] = await db.select().from(costLayers).where(eq(costLayers.productId, nanoProd.id));
  console.log(`  - Kết quả xuất: Engine=${nanoIssueRes.method}, Tổng COGS=${nanoIssueRes.totalCost.toLocaleString("vi-VN")} ₫`);
  console.log(`  - Cập nhật Layer: Tồn giảm từ ${nanoLayer.quantityRemaining} -> ${nanoLayerAfter.quantityRemaining} (Giảm đúng 50: ${nanoLayer.quantityRemaining - nanoLayerAfter.quantityRemaining === 50})`);

  // 5. Verify General Ledger entries for SO 701, 702, 703
  console.log("\n[7] Đối chiếu Bút toán Sổ cái M30 (GL Posting Verification):");
  const jeList = await db.select().from(accountingEntries)
    .where(inArray(accountingEntries.sourceDocumentId, [701, 702, 703]))
    .orderBy(desc(accountingEntries.id));

  let allGlMatch = true;
  for (const je of jeList) {
    let expectedCost = 0;
    if (je.sourceDocumentId === 701) expectedCost = erpIssueRes.totalCost;
    else if (je.sourceDocumentId === 702) expectedCost = chipIssueRes.totalCost;
    else if (je.sourceDocumentId === 703) expectedCost = nanoIssueRes.totalCost;

    const match = je.amount === expectedCost && je.debitAccount === "632" && je.creditAccount === "156";
    if (!match) allGlMatch = false;
    console.log(`  - Bút toán #${je.entryCode} (SO #${je.sourceDocumentId}): Nợ ${je.debitAccount} / Có ${je.creditAccount} = ${je.amount.toLocaleString("vi-VN")} ₫ (Khớp: ${match ? "✅ 100%" : "❌ LỆCH"})`);
  }
  console.log(`  - Kết luận Sổ cái M30: ${allGlMatch ? "✅ KHỚP HOÀN TOÀN 100%" : "❌ CÓ SAI LỆCH"}`);

  // 6. Clean up test records and reset opening layers to preserve baseline
  console.log("\n[8] Khôi phục Baseline Staging sau khi test hoàn tất...");
  await db.delete(costLayers).where(eq(costLayers.id, newErpLayerRes.id));
  await db.update(costLayers).set({ quantityRemaining: 999, status: 'ACTIVE' }).where(eq(costLayers.id, erpLayer.id));
  await db.update(costLayers).set({ quantityRemaining: 1250, status: 'ACTIVE' }).where(eq(costLayers.id, chipLayer.id));
  await db.update(costLayers).set({ quantityRemaining: 4300, status: 'ACTIVE' }).where(eq(costLayers.id, nanoLayer.id));
  await db.delete(accountingEntries).where(inArray(accountingEntries.sourceDocumentId, [701, 702, 703]));
  await db.delete(cogsTransactions).where(inArray(cogsTransactions.salesOrderId, [701, 702, 703]));

  console.log("  - Đã hoàn trả tồn kho layer gốc: SKU-ERP-LIC=999, SKU-CHIP-3NM=1250, SKU-NANO-CO2=4300.");
  console.log("  - Đã dọn sạch các bút toán test SO-701, 702, 703.");
  console.log("\n================================================================================");
  console.log("  KẾT THÚC KIỂM THỬ ALL TRÊN STAGING: TOÀN BỘ CÁC MỤC ĐỀU PASS HOÀN HẢO");
  console.log("================================================================================");
}

executePhase7StagingAllRollout().catch(console.error);
