/**
 * COMPREHENSIVE TEST SUITE FOR M41 PRICING ENGINE & M42 COSTING ENGINE
 *
 * Requirements from User:
 * 41.1 Ưu tiên giá theo hợp đồng (customerContractPrices > priceLists)
 * 41.2 Chiết khấu bậc thang đa tầng (Volume + Tier + Payment + Promo)
 * 41.3 Margin Guard (checkMinimumMargin)
 * 41.4 Toán học định giá + rounding modes (Markup, Margin, Rounding)
 * 42.1 FIFO Layer Consumption (Xuất đúng thứ tự layer cũ nhất đến mới nhất)
 * 42.2 Moving Weighted Average (Tính đúng đơn giá bình quân gia quyền di động)
 * 42.3 Landed Cost Allocation (Phân bổ chi phí mua hàng theo VALUE/WEIGHT/VOLUME/QUANTITY)
 * 42.4 Khớp bút toán COGS với M30 (Gọi qua AccountingEngine.postJournal, ghi nợ 632 / có 156)
 * Error.1 Không còn fallback *0.7 khi thiếu cost layer (Strict Flag=true chặn ERR_COSTING_LAYER_DEPLETED)
 * Error.2 Snapshot Immutability (chứng từ cũ không bị tính lại)
 * Migration.1 Idempotent + khớp tổng giá trị vốn hóa (Khớp 122.811.633.280 ₫)
 */

import { PricingService } from '../engines/pricingService';
import { costingEngine } from '../engines/costingEngine';
import { CostingShadowRunner } from '../engines/costingShadowRunner';
import { db } from '../db';
import {
  products,
  costLayers,
  cogsTransactions,
  customerContractPrices,
  priceLists,
  priceListItems,
  accountingEntries,
  salesOrders,
  salesOrderItems,
  costingSettings
} from '../db/schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';

interface TestResult {
  testCode: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

function recordResult(testCode: string, name: string, pass: boolean, details: string) {
  results.push({
    testCode,
    name,
    status: pass ? 'PASS' : 'FAIL',
    details
  });
  const symbol = pass ? '✅ PASS' : '❌ FAIL';
  console.log(`[${symbol}] [${testCode}] ${name} - ${details}`);
}

async function runTestSuite() {
  console.log("================================================================================");
  console.log("  BẮT ĐẦU CHẠY BỘ KIỂM THỬ NỘI BỘ M41 PRICING ENGINE & M42 COSTING ENGINE");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // 41.1 ƯU TIÊN GIÁ THEO HỢP ĐỒNG (customerContractPrices > priceLists)
  // ---------------------------------------------------------------------------
  try {
    // Chuẩn bị: tạo 1 hợp đồng giá đặc thù cho Customer 100, Product 1 (Laptop Business 14)
    // Giá niêm yết trong Price List = 22.000.000 ₫, Giá theo Hợp đồng riêng = 18.500.000 ₫
    await db.delete(customerContractPrices).where(and(
      eq(customerContractPrices.customerId, '100'),
      eq(customerContractPrices.productId, '1')
    ));

    await db.insert(customerContractPrices).values({
      id: 'CCP-TEST-001',
      contractCode: 'CTR-TEST-001',
      customerId: '100',
      productId: '1',
      contractPrice: 18500000,
      currency: 'VND',
      validFrom: '2026-01-01',
      validTo: '2026-12-31'
    });

    const resolved = await PricingService.resolveUnitPrice({
      productId: 1,
      customerId: 100,
      quantity: 5
    });

    const isPass = resolved.unitPrice === 18500000 && resolved.source === 'CONTRACT_PRICE';
    recordResult(
      '41.1',
      'Ưu tiên giá theo hợp đồng',
      isPass,
      `Giá giải quyết: ${resolved.unitPrice.toLocaleString('vi-VN')} ₫ (Source: ${resolved.source}). Mong đợi: 18.500.000 ₫ (CONTRACT_PRICE)`
    );
  } catch (err: any) {
    recordResult('41.1', 'Ưu tiên giá theo hợp đồng', false, `Lỗi ngoại lệ: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // 41.2 CHIẾT KHẤU BẬC THANG ĐA TẦNG
  // ---------------------------------------------------------------------------
  try {
    // Kịch bản: Đơn giá 100.000, Qty 100 (Volume: 15%), Customer VIP (Tier: 10%), PREPAID (Pay: 2%), Promo NEXUS2026 (Promo: 5%)
    // Tổng chiết khấu lý thuyết: 15 + 10 + 2 + 5 = 32% (Trần trần 35%)
    const discountRes = PricingService.calculateDynamicDiscount({
      unitPrice: 100000,
      quantity: 100,
      costBasis: 50000,
      customerTier: 'VIP',
      paymentTerm: 'PREPAID',
      promoCode: 'NEXUS2026'
    });

    const expectedTotalPercent = 32;
    const expectedDiscountAmount = 100000 * 100 * 0.32; // 3.200.000 ₫
    const isPass = discountRes.totalDiscountPercent === expectedTotalPercent &&
                   discountRes.discountAmount === expectedDiscountAmount &&
                   discountRes.volumeDiscountPercent === 15 &&
                   discountRes.customerTierDiscountPercent === 10 &&
                   discountRes.paymentDiscountPercent === 2 &&
                   discountRes.promoDiscountPercent === 5;

    recordResult(
      '41.2',
      'Chiết khấu bậc thang đa tầng',
      isPass,
      `Tổng chiết khấu: ${discountRes.totalDiscountPercent}% (Tiền CK: ${discountRes.discountAmount.toLocaleString('vi-VN')} ₫). Từng tầng: Vol=${discountRes.volumeDiscountPercent}%, Tier=${discountRes.customerTierDiscountPercent}%, Pay=${discountRes.paymentDiscountPercent}%, Promo=${discountRes.promoDiscountPercent}%`
    );
  } catch (err: any) {
    recordResult('41.2', 'Chiết khấu bậc thang đa tầng', false, `Lỗi: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // 41.3 MARGIN GUARD (checkMinimumMargin)
  // ---------------------------------------------------------------------------
  try {
    // Giá vốn 80.000 ₫, Giá bán 90.000 ₫ -> Margin = (90k - 80k)/90k = 11.11%
    // Ngưỡng tối thiểu minMargin = 15% -> Margin Guard phải cảnh báo vi phạm
    const guardRes = PricingService.checkMinimumMargin(80000, 90000, 15);
    const isPass = guardRes.isBelowMin === true &&
                   guardRes.actualMargin === 11.11 &&
                   guardRes.difference === 3.89 &&
                   typeof guardRes.warningMessage === 'string';

    recordResult(
      '41.3',
      'Margin Guard (checkMinimumMargin)',
      isPass,
      `Vi phạm sàn margin: ${guardRes.isBelowMin}, Biên thực tế: ${guardRes.actualMargin}%, Chênh lệch: ${guardRes.difference}%`
    );
  } catch (err: any) {
    recordResult('41.3', 'Margin Guard (checkMinimumMargin)', false, `Lỗi: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // 41.3b KIỂM TRA BẮT BUỘC costBasis (Throw ERR_COST_BASIS_REQUIRED khi thiếu)
  // ---------------------------------------------------------------------------
  try {
    let errDynamic = '';
    let errCheckMin = '';
    let errActualMargin = '';

    // 1. Thử gọi calculateDynamicDiscount khi không truyền costBasis
    try {
      PricingService.calculateDynamicDiscount({
        unitPrice: 100000,
        quantity: 5
      } as any);
    } catch (e: any) {
      errDynamic = e.message;
    }

    // 2. Thử gọi checkMinimumMargin khi costBasis undefined
    try {
      PricingService.checkMinimumMargin(undefined as any, 100000, 15);
    } catch (e: any) {
      errCheckMin = e.message;
    }

    // 3. Thử gọi calculateActualMargin khi costBasis <= 0
    try {
      PricingService.calculateActualMargin(0, 100000);
    } catch (e: any) {
      errActualMargin = e.message;
    }

    const isPass = errDynamic.includes('ERR_COST_BASIS_REQUIRED') &&
                   errCheckMin.includes('ERR_COST_BASIS_REQUIRED') &&
                   errActualMargin.includes('ERR_COST_BASIS_REQUIRED');

    recordResult(
      '41.3b',
      'Bắt buộc costBasis (ERR_COST_BASIS_REQUIRED)',
      isPass,
      `Throw đúng lỗi: DynamicDiscount="${errDynamic.slice(0, 30)}...", checkMin="${errCheckMin.slice(0, 30)}...", actualMargin="${errActualMargin.slice(0, 30)}..."`
    );
  } catch (err: any) {
    recordResult('41.3b', 'Bắt buộc costBasis (ERR_COST_BASIS_REQUIRED)', false, `Lỗi không mong muốn: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // 41.4 TOÁN HỌC ĐỊNH GIÁ + ROUNDING MODES
  // ---------------------------------------------------------------------------
  try {
    // 1. Markup: Cost 100.000, Markup 25% -> Raw = 125.000
    const markupExact = PricingService.calculateMarkupPrice(100000, 25, 'EXACT');
    // 2. Margin: Cost 80.000, Target Margin 20% -> Raw = 80.000 / (1 - 0.20) = 100.000
    const marginExact = PricingService.calculateMarginPrice(80000, 20, 'EXACT');
    // 3. Rounding NEAREST_1000: 123.456 -> 123.000; CEIL_1000: 123.001 -> 124.000; ROUND_500: 123.300 -> 123.500
    const r1000 = PricingService.applyRounding(123456, 'NEAREST_1000');
    const rCeil = PricingService.applyRounding(123001, 'CEIL_1000');
    const r500 = PricingService.applyRounding(123300, 'ROUND_500');

    const isPass = markupExact === 125000 &&
                   marginExact === 100000 &&
                   r1000 === 123000 &&
                   rCeil === 124000 &&
                   r500 === 123500;

    recordResult(
      '41.4',
      'Toán học định giá + rounding modes',
      isPass,
      `Markup=125k (${markupExact}), Margin=100k (${marginExact}), Round1k=${r1000}, Ceil1k=${rCeil}, Round500=${r500}`
    );
  } catch (err: any) {
    recordResult('41.4', 'Toán học định giá + rounding modes', false, `Lỗi: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // 42.1 FIFO LAYER CONSUMPTION
  // ---------------------------------------------------------------------------
  try {
    // Tạo 1 SKU test riêng (SKU-TEST-FIFO) để không ảnh hưởng dữ liệu sản xuất
    // Tạo 2 layers: Layer 1 (Cũ): 10 cái @ 10.000 ₫; Layer 2 (Mới): 10 cái @ 20.000 ₫
    const [testProd] = await db.insert(products).values({
      sku: `SKU-FIFO-${Date.now()}`,
      name: 'Test FIFO Product',
      category: 'TEST',
      retailPrice: 15000,
      costPrice: 10000,
      stockPhysical: 20
    }).returning();

    const layer1 = await costingEngine.addCostLayer({
      productId: testProd.id,
      warehouseId: 1,
      quantity: 10,
      unitCost: 10000,
      receiptDate: new Date('2026-01-01')
    });

    const layer2 = await costingEngine.addCostLayer({
      productId: testProd.id,
      warehouseId: 1,
      quantity: 10,
      unitCost: 20000,
      receiptDate: new Date('2026-01-05')
    });

    // Xuất kho 15 cái: Bắt buộc tiêu thụ hết 10 cái @ 10.000 ₫ từ Layer 1, và 5 cái @ 20.000 ₫ từ Layer 2
    // Tổng COGS = 10 * 10k + 5 * 20k = 200.000 ₫
    // Tạm thời bật setting FIFO
    await db.update(costLayers).set({ status: 'ACTIVE' }).where(eq(costLayers.id, layer1.id));
    await db.update(costLayers).set({ status: 'ACTIVE' }).where(eq(costLayers.id, layer2.id));

    // Thực hiện tính giá xuất với FIFO
    const issueRes = await costingEngine.calculateIssue({
      productId: testProd.id,
      warehouseId: 1,
      quantity: 15,
      method: 'FIFO',
      salesOrderId: 99999
    });

    // Kiểm tra trạng thái của layer 1 và layer 2
    const [l1Updated] = await db.select().from(costLayers).where(eq(costLayers.id, layer1.id)).limit(1);
    const [l2Updated] = await db.select().from(costLayers).where(eq(costLayers.id, layer2.id)).limit(1);

    const isPass = issueRes.totalCogs === 200000 &&
                   l1Updated.quantityRemaining === 0 &&
                   l1Updated.status === 'DEPLETED' &&
                   l2Updated.quantityRemaining === 5 &&
                   l2Updated.status === 'ACTIVE';

    recordResult(
      '42.1',
      'FIFO Layer Consumption',
      isPass,
      `Tổng COGS xuất: ${issueRes.totalCogs.toLocaleString('vi-VN')} ₫. Layer 1 (cũ) tồn: ${l1Updated.quantityRemaining} (${l1Updated.status}), Layer 2 (mới) tồn: ${l2Updated.quantityRemaining} (${l2Updated.status})`
    );
  } catch (err: any) {
    recordResult('42.1', 'FIFO Layer Consumption', false, `Lỗi: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // 42.2 MOVING WEIGHTED AVERAGE
  // ---------------------------------------------------------------------------
  try {
    // Tạo 1 SKU test (SKU-TEST-MWA):
    // Layer 1: 10 cái @ 100.000 ₫ (Tổng 1.000.000 ₫)
    // Layer 2: 20 cái @ 130.000 ₫ (Tổng 2.600.000 ₫)
    // Tổng số lượng: 30 cái. Tổng giá trị: 3.600.000 ₫
    // Bình quân gia quyền = 3.600.000 / 30 = 120.000 ₫
    const [mwaProd] = await db.insert(products).values({
      sku: `SKU-MWA-${Date.now()}`,
      name: 'Test Moving Weighted Avg Product',
      category: 'TEST',
      retailPrice: 150000,
      costPrice: 0,
      stockPhysical: 30
    }).returning();

    await costingEngine.addCostLayer({
      productId: mwaProd.id,
      warehouseId: 1,
      quantity: 10,
      unitCost: 100000
    });

    await costingEngine.addCostLayer({
      productId: mwaProd.id,
      warehouseId: 1,
      quantity: 20,
      unitCost: 130000
    });

    const avgCost = await costingEngine.recalculateWeightedAverageCost(mwaProd.id, 1);
    const [pUpdated] = await db.select().from(products).where(eq(products.id, mwaProd.id)).limit(1);

    const isPass = avgCost === 120000 && pUpdated.costPrice === 120000;
    recordResult(
      '42.2',
      'Moving Weighted Average',
      isPass,
      `Đơn giá BQGQ tính được: ${avgCost.toLocaleString('vi-VN')} ₫, Đã cập nhật vào products.costPrice: ${pUpdated.costPrice.toLocaleString('vi-VN')} ₫`
    );
  } catch (err: any) {
    recordResult('42.2', 'Moving Weighted Average', false, `Lỗi: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // 42.3 LANDED COST ALLOCATION
  // ---------------------------------------------------------------------------
  try {
    // Tạo SKU và Layer để phân bổ chi phí vận chuyển đường biển
    // Layer: 100 cái, unitCost ban đầu = 50.000 ₫ (Total Cost = 5.000.000 ₫)
    // Phí vận chuyển phân bổ: 500.000 ₫ (Method = QUANTITY)
    // Đơn giá sau phân bổ = 50.000 + (500.000 / 100) = 55.000 ₫
    const [lcProd] = await db.insert(products).values({
      sku: `SKU-LC-${Date.now()}`,
      name: 'Test Landed Cost Product',
      category: 'TEST',
      retailPrice: 80000,
      costPrice: 50000,
      stockPhysical: 100
    }).returning();

    const layer = await costingEngine.addCostLayer({
      productId: lcProd.id,
      warehouseId: 1,
      quantity: 100,
      unitCost: 50000
    });

    const allocRes = await costingEngine.allocateLandedCost({
      allocationRunCode: `LCA-TEST-${Date.now()}`,
      allocationMethod: 'QUANTITY',
      totalLandedCost: 500000,
      expenseType: 'FREIGHT',
      items: [{
        layerId: layer.id,
        productId: lcProd.id,
        quantity: 100
      }],
      appliedByUserId: 1
    });

    const [updatedLayer] = await db.select().from(costLayers).where(eq(costLayers.id, layer.id)).limit(1);
    const [updatedProd] = await db.select().from(products).where(eq(products.id, lcProd.id)).limit(1);

    const isPass = allocRes.success === true &&
                   updatedLayer.unitCost === 55000 &&
                   updatedLayer.totalCost === 5500000 &&
                   updatedProd.costPrice === 55000;

    recordResult(
      '42.3',
      'Landed Cost Allocation',
      isPass,
      `Đơn giá vốn ban đầu: 50.000 ₫ -> Sau phân bổ: ${updatedLayer.unitCost.toLocaleString('vi-VN')} ₫ (Tổng layer: ${updatedLayer.totalCost.toLocaleString('vi-VN')} ₫)`
    );
  } catch (err: any) {
    recordResult('42.3', 'Landed Cost Allocation', false, `Lỗi: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // 42.4 KHỚP BÚT TOÁN COGS VỚI M30
  // ---------------------------------------------------------------------------
  try {
    // Khi xuất kho qua calculateIssue, một bút toán Nợ 632 / Có 156 phải được ghi vào accounting_entries qua accountingEngine.postJournal()
    const [glProd] = await db.insert(products).values({
      sku: `SKU-GL-${Date.now()}`,
      name: 'Test GL COGS Product',
      category: 'TEST',
      retailPrice: 50000,
      costPrice: 30000,
      stockPhysical: 10
    }).returning();

    await costingEngine.addCostLayer({
      productId: glProd.id,
      warehouseId: 1,
      quantity: 10,
      unitCost: 30000
    });

    const salesOrderId = 88888;
    const issueRes = await costingEngine.calculateIssue({
      productId: glProd.id,
      warehouseId: 1,
      quantity: 2,
      salesOrderId
    });

    // Truy vấn bút toán kế toán được tạo
    const [entry] = await db.select().from(accountingEntries)
      .where(and(
        eq(accountingEntries.sourceDocumentId, salesOrderId),
        eq(accountingEntries.debitAccount, '632'),
        eq(accountingEntries.creditAccount, '156')
      ))
      .orderBy(desc(accountingEntries.id))
      .limit(1);

    const isPass = !!entry && entry.amount === issueRes.totalCogs && entry.amount === 60000;
    recordResult(
      '42.4',
      'Khớp bút toán COGS với M30',
      isPass,
      entry
        ? `Bút toán #${entry.entryCode}: Nợ ${entry.debitAccount} / Có ${entry.creditAccount} = ${entry.amount.toLocaleString('vi-VN')} ₫ (Khớp COGS: ${issueRes.totalCogs.toLocaleString('vi-VN')} ₫)`
        : 'Không tìm thấy bút toán kế toán đối ứng Nợ 632 / Có 156!'
    );
  } catch (err: any) {
    recordResult('42.4', 'Khớp bút toán COGS với M30', false, `Lỗi: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // ERROR.1 KHÔNG CÒN FALLBACK *0.7 KHI THIẾU COST LAYER
  // ---------------------------------------------------------------------------
  try {
    // Khi FEATURE_STRICT_COSTING_VALIDATION = true:
    // Nếu sản phẩm không có cost layer và yêu cầu xuất kho -> Bắt buộc ném ERR_COSTING_LAYER_DEPLETED
    process.env.FEATURE_STRICT_COSTING_VALIDATION = 'true';

    const [emptyProd] = await db.insert(products).values({
      sku: `SKU-EMPTY-${Date.now()}`,
      name: 'Empty Layer Product',
      category: 'TEST',
      retailPrice: 70000,
      costPrice: 50000,
      stockPhysical: 0
    }).returning();

    let threwExpectedError = false;
    let errorMessage = '';

    try {
      await costingEngine.calculateIssue({
        productId: emptyProd.id,
        warehouseId: 1,
        quantity: 5,
        method: 'FIFO',
        salesOrderId: 77777
      });
    } catch (e: any) {
      errorMessage = e.message;
      if (errorMessage.includes('ERR_COSTING_LAYER_DEPLETED')) {
        threwExpectedError = true;
      }
    } finally {
      process.env.FEATURE_STRICT_COSTING_VALIDATION = 'false';
    }

    recordResult(
      'Error.1',
      'Không còn fallback *0.7 khi thiếu cost layer',
      threwExpectedError,
      `Strict flag = true chặn thành công với ngoại lệ: "${errorMessage}"`
    );
  } catch (err: any) {
    recordResult('Error.1', 'Không còn fallback *0.7 khi thiếu cost layer', false, `Lỗi: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // ERROR.2 SNAPSHOT IMMUTABILITY (Chứng từ cũ không bị tính lại)
  // ---------------------------------------------------------------------------
  try {
    // Kiểm tra tính bất biến của salesOrderItems và cogsTransactions:
    // Đơn giá bán price và cogsRecord đã ghi nhận lịch sử không bị thay đổi khi giá danh mục thay đổi
    const [snapProd] = await db.insert(products).values({
      sku: `SKU-SNAP-${Date.now()}`,
      name: 'Snapshot Test Product',
      category: 'TEST',
      retailPrice: 60000,
      costPrice: 40000,
      stockPhysical: 50
    }).returning();

    const layer = await costingEngine.addCostLayer({
      productId: snapProd.id,
      warehouseId: 1,
      quantity: 50,
      unitCost: 40000
    });

    const issueRes = await costingEngine.calculateIssue({
      productId: snapProd.id,
      warehouseId: 1,
      quantity: 10,
      salesOrderId: 66666
    });

    const originalCogs = issueRes.totalCogs; // 400.000 ₫
    const originalRecordId = issueRes.cogsRecords[0].id;

    // Giả sử có biến động giá danh mục products.costPrice tăng lên 100.000 ₫
    await db.update(products).set({ costPrice: 100000 }).where(eq(products.id, snapProd.id));

    // Truy vấn lại bản ghi cogsTransactions đã phát sinh trong quá khứ
    const [cogsAfter] = await db.select().from(cogsTransactions).where(eq(cogsTransactions.id, originalRecordId)).limit(1);

    const isPass = cogsAfter.totalCogs === originalCogs && cogsAfter.unitCost === 40000;
    recordResult(
      'Error.2',
      'Snapshot Immutability (chứng từ cũ không bị tính lại)',
      isPass,
      `Bản ghi COGS lịch sử vẫn giữ nguyên: unitCost=${cogsAfter.unitCost.toLocaleString('vi-VN')} ₫, totalCogs=${cogsAfter.totalCogs.toLocaleString('vi-VN')} ₫ (Mặc dù giá danh mục đã đổi thành 100.000 ₫)`
    );
  } catch (err: any) {
    recordResult('Error.2', 'Snapshot Immutability (chứng từ cũ không bị tính lại)', false, `Lỗi: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // MIGRATION.1 IDEMPOTENT + KHỚP TỔNG GIÁ TRỊ VỐN HÓA
  // ---------------------------------------------------------------------------
  try {
    // Kiểm tra 17 SKU gốc: Tổng giá trị vốn hóa trong cost_layers (loại trừ các SKU test vừa tạo trong test suite)
    // Các SKU gốc là PRD-001 -> PRD-004, SKU-ENG-088, SKU-MAT-302, SKU-ELC-901, SKU-RAW-101, SKU-ACC-055,
    // SKU-TOOL-12, SKU-VALVE-04, RAM-16GB-DDR5, SSD-1TB-NVME, CPU-INTEL-I7, SKU-CHIP-3NM, SKU-NANO-CO2, SKU-ERP-LIC
    const originalSkus = [
      'PRD-001', 'PRD-002', 'PRD-003', 'PRD-004', 'SKU-ENG-088', 'SKU-MAT-302',
      'SKU-ELC-901', 'SKU-RAW-101', 'SKU-ACC-055', 'SKU-TOOL-12', 'SKU-VALVE-04',
      'RAM-16GB-DDR5', 'SSD-1TB-NVME', 'CPU-INTEL-I7', 'SKU-CHIP-3NM', 'SKU-NANO-CO2', 'SKU-ERP-LIC'
    ];

    const layersRs = await db.select({
      sku: products.sku,
      unitCost: costLayers.unitCost,
      qtyOriginal: costLayers.quantityOriginal,
      qtyRemaining: costLayers.quantityRemaining,
      totalCost: costLayers.totalCost
    })
    .from(costLayers)
    .innerJoin(products, eq(costLayers.productId, products.id))
    .where(and(
      sql`${products.sku} IN (${sql.join(originalSkus.map(s => sql`${s}`), sql`, `)})`,
      eq(costLayers.sourceReferenceNo, 'OPENING_BALANCE_MIGRATION')
    ));

    let totalVal = 0;
    let totalQty = 0;
    for (const r of layersRs) {
      totalVal += r.totalCost;
      totalQty += r.qtyOriginal;
    }

    const expectedVal = 122811633280;
    const isPass = layersRs.length === 17 && totalVal === expectedVal && totalQty === 8723;

    recordResult(
      'Migration.1',
      'Idempotent + khớp tổng giá trị vốn hóa',
      isPass,
      `Số lượng layer gốc: ${layersRs.length}/17 SKU, Tổng tồn kho ban đầu: ${totalQty} sp, Tổng vốn hóa: ${totalVal.toLocaleString('vi-VN')} ₫ (Khớp chuẩn 122.811.633.280 ₫)`
    );
  } catch (err: any) {
    recordResult('Migration.1', 'Idempotent + khớp tổng giá trị vốn hóa', false, `Lỗi: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // SHADOW.1 HẠ TẦNG SHADOW RUN (Disabled by default + Read-Only Simulation)
  // ---------------------------------------------------------------------------
  try {
    // 1. Xác nhận cờ tính năng FEATURE_SHADOW_RUN_ENABLED đang TẮT
    const isFlagDisabled = CostingShadowRunner.isShadowRunActive() === false;

    // 2. Thử gọi evaluateTransactionShadow khi cờ tắt -> Phải trả về null ngay lập tức, không ghi log
    const shadowRes = await CostingShadowRunner.evaluateTransactionShadow({
      transactionId: 'TEST-TX-001',
      productId: 1,
      quantity: 5,
      engineOldResult: { totalCogs: 500000, unitCost: 100000, source: 'TEST' }
    });
    const returnsNullWhenDisabled = shadowRes === null;
    const logsEmpty = CostingShadowRunner.getShadowLogs().length === 0;

    // 3. Kiểm tra tính năng tính toán Read-Only (simulateIssueCost):
    // Đếm số lượng costLayers và cogsTransactions trước khi simulate
    const countLayersBefore = (await db.select().from(costLayers)).length;
    const countCogsBefore = (await db.select().from(cogsTransactions)).length;

    // Chạy mô phỏng tính giá vốn FIFO cho 2 sản phẩm
    const simResult = await costingEngine.simulateIssueCost({
      productId: 1,
      quantity: 2,
      method: 'FIFO'
    });

    const countLayersAfter = (await db.select().from(costLayers)).length;
    const countCogsAfter = (await db.select().from(cogsTransactions)).length;

    // Tuyệt đối không thay đổi DB
    const zeroDbWrites = (countLayersBefore === countLayersAfter) && (countCogsBefore === countCogsAfter);
    const validSimCalculation = simResult.totalCogs > 0 && simResult.layersEvaluated.length > 0;

    const isPass = isFlagDisabled && returnsNullWhenDisabled && logsEmpty && zeroDbWrites && validSimCalculation;

    recordResult(
      'Shadow.1',
      'Hạ tầng Shadow Run (Disabled Flag + Zero DB Writes)',
      isPass,
      `Flag=${isFlagDisabled ? 'DISABLED (OK)' : 'ENABLED (VIOLATION)'}, ReturnNull=${returnsNullWhenDisabled}, ZeroDBWrites=${zeroDbWrites}, Simulated COGS=${simResult.totalCogs.toLocaleString('vi-VN')} ₫`
    );
  } catch (err: any) {
    recordResult('Shadow.1', 'Hạ tầng Shadow Run (Disabled Flag + Zero DB Writes)', false, `Lỗi: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // SETTINGS.1 XÁC MINH SINGLE SOURCE OF TRUTH (2 UI ENTRY POINTS: M42 & M03 TAB 5)
  // ---------------------------------------------------------------------------
  try {
    // 1. Lưu cấu hình từ M42 UI Entry Point (gọi costingEngine.updateCostingMethod)
    const updateResM42 = await costingEngine.updateCostingMethod({
      method: 'FIFO',
      userId: 1,
      username: 'chief_accountant',
      userRole: 'CHIEF_ACCOUNTANT',
      reason: 'Phê duyệt chuyển đổi phương pháp sang FIFO từ M42 Cost Allocation Tab'
    });

    // 2. Xác nhận đọc từ M03 Settings Tab (gọi costingEngine.getCostingConfig)
    // Phải trả về đúng phương pháp FIFO vừa cập nhật, isConfigured = true, không phải fallback
    const configReadFromM03 = await costingEngine.getCostingConfig();

    const m42WriteMatchesM03Read =
      updateResM42.success === true &&
      configReadFromM03.isConfigured === true &&
      configReadFromM03.configuredMethod === 'FIFO' &&
      configReadFromM03.effectiveMethod === 'FIFO' &&
      configReadFromM03.fallbackActive === false;

    // 3. Ngược lại: Cập nhật từ M03 Tab 5 -> Đọc lại từ M42 Tab
    const updateResM03 = await costingEngine.updateCostingMethod({
      method: 'WEIGHTED_AVERAGE',
      userId: 2,
      username: 'cfo_admin',
      userRole: 'CFO',
      reason: 'Phê duyệt phương pháp Bình Quân Gia Quyền từ M03 Global Settings Tab 5'
    });

    const configReadFromM42 = await costingEngine.getCostingConfig();

    const m03WriteMatchesM42Read =
      updateResM03.success === true &&
      configReadFromM42.isConfigured === true &&
      configReadFromM42.configuredMethod === 'WEIGHTED_AVERAGE' &&
      configReadFromM42.effectiveMethod === 'WEIGHTED_AVERAGE' &&
      configReadFromM42.fallbackActive === false;

    // 4. Khôi phục lại trạng thái chưa cấu hình để giữ nguyên trạng thái CHỜ cho kế toán trưởng
    await db.delete(costingSettings);
    const restoredConfig = await costingEngine.getCostingConfig();
    const isStateResetToWaiting =
      restoredConfig.isConfigured === false &&
      restoredConfig.configuredMethod === null &&
      restoredConfig.fallbackActive === true;

    const isPass = m42WriteMatchesM03Read && m03WriteMatchesM42Read && isStateResetToWaiting;

    recordResult(
      'Settings.1',
      'Xác minh Single-Writer Authority (M42 <-> M03)',
      isPass,
      `M42->M03=${m42WriteMatchesM03Read ? 'FIFO (OK)' : 'FAIL'}, M03->M42=${m03WriteMatchesM42Read ? 'WEIGHTED_AVG (OK)' : 'FAIL'}, ResetState=${isStateResetToWaiting ? 'CHỜ (OK)' : 'FAIL'}`
    );
  } catch (err: any) {
    recordResult('Settings.1', 'Xác minh Single-Writer Authority (M42 <-> M03)', false, `Lỗi: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TỔNG HỢP KẾT QUẢ
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("  BẢNG TỔNG HỢP KẾT QUẢ TEST SUITE NỘI BỘ (M41 & M42 ENGINES)");
  console.log("================================================================================");
  let allPass = true;
  for (const r of results) {
    if (r.status === 'FAIL') allPass = false;
    console.log(`| ${r.testCode.padEnd(12)} | ${r.status.padEnd(6)} | ${r.name.padEnd(45)} |`);
  }
  console.log("================================================================================");
  console.log(`KẾT LUẬN: ${allPass ? `TOÀN BỘ ${results.length}/${results.length} TEST CASES ĐỀU PASS` : 'CÓ TEST CASE BỊ FAIL - CẦN ĐIỀU CHỈNH'}`);
}

runTestSuite().catch(console.error);
