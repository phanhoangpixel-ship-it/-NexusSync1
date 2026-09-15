import { db } from '../db';
import { products, costLayers, cogsTransactions, accountingEntries } from '../db/schema';
import { costingEngine } from '../engines/costingEngine';
import { eq, and, asc, desc } from 'drizzle-orm';

interface DivergenceCaseResult {
  sku: string;
  name: string;
  qtyIssued: number;
  layersBefore: Array<{ layerId: number; qty: number; unitCost: number; label: string }>;
  weightedAvgUnitCost: number;
  cogsWeightedAvg: number;
  cogsFifo: number;
  varianceAbs: number;
  variancePercent: number;
  fifoLayersConsumed: Array<{ layerId: number; quantity: number; unitCost: number }>;
  glEntry?: { entryCode: string; debitAccount: string; creditAccount: string; amount: number };
}

async function runMultiLayerDivergence() {
  console.log("================================================================================");
  console.log("  KIỂM CHỨNG PHÂN KỲ ĐA LỚP (MULTI-LAYER DIVERGENCE) TRÊN STAGING");
  console.log("================================================================================\n");

  // 1. Chọn 3 SKU mục tiêu: PRD-001, SKU-RAW-101, RAM-16GB-DDR5
  const targetSkus = [
    { sku: 'PRD-001', newCostDelta: 0.15, newQty: 25, issueQty: 25, label: '+15% (Lạm phát giá nhập)' },
    { sku: 'SKU-RAW-101', newCostDelta: -0.10, newQty: 100, issueQty: 150, label: '-10% (Giảm giá nguyên liệu)' },
    { sku: 'RAM-16GB-DDR5', newCostDelta: 0.20, newQty: 80, issueQty: 160, label: '+20% (Chipset tăng giá)' }
  ];

  const results: DivergenceCaseResult[] = [];

  for (const item of targetSkus) {
    const [prod] = await db.select().from(products).where(eq(products.sku, item.sku)).limit(1);
    if (!prod) {
      throw new Error(`SKU ${item.sku} không tồn tại!`);
    }

    console.log(`--------------------------------------------------------------------------------`);
    console.log(`[BƯỚC 1 & 2] Chuẩn bị Cost Layer cho SKU: ${prod.sku} (${prod.name})`);
    
    // Lấy opening layer hiện có
    const existingLayers = await db.select().from(costLayers).where(and(
      eq(costLayers.productId, prod.id),
      eq(costLayers.warehouseId, 1),
      eq(costLayers.status, 'ACTIVE')
    )).orderBy(asc(costLayers.id));

    const openingLayer = existingLayers[0];
    console.log(`- Lớp 1 (Opening Layer ID: ${openingLayer.id}): Tồn = ${openingLayer.quantityRemaining}, Đơn giá vốn = ${openingLayer.unitCost.toLocaleString('vi-VN')} ₫`);

    // Tạo Lớp 2 (Inbound Goods Receipt mới) qua đúng costingEngine.addCostLayer()
    const newUnitCost = Math.round(openingLayer.unitCost * (1 + item.newCostDelta));
    console.log(`- Nhập thêm Lớp 2 (Inbound Lô mới ${item.label}): Số lượng = ${item.newQty}, Đơn giá vốn mới = ${newUnitCost.toLocaleString('vi-VN')} ₫`);

    const receiptDate = new Date(Date.now() + 1000 * 3600); // 1 giờ sau
    const layer2 = await costingEngine.addCostLayer({
      productId: prod.id,
      warehouseId: 1,
      quantity: item.newQty,
      unitCost: newUnitCost,
      sourceDocumentType: 'GOODS_RECEIPT',
      sourceReferenceNo: `GR-STAGING-L2-${prod.sku}`,
      receiptDate
    });

    // Lấy lại danh sách các layer đang ACTIVE trước khi xuất
    const layersBefore = await db.select().from(costLayers).where(and(
      eq(costLayers.productId, prod.id),
      eq(costLayers.warehouseId, 1),
      eq(costLayers.status, 'ACTIVE')
    )).orderBy(asc(costLayers.receiptDate), asc(costLayers.id));

    // Tính toán theo phương pháp WEIGHTED_AVERAGE (Bình quân gia quyền 2 lớp)
    const totalRemainingQty = layersBefore.reduce((acc, l) => acc + l.quantityRemaining, 0);
    const totalRemainingValue = layersBefore.reduce((acc, l) => acc + (l.quantityRemaining * l.unitCost), 0);
    const weightedAvgUnitCost = Math.round((totalRemainingValue / totalRemainingQty) * 100) / 100;
    const cogsWeightedAvg = Math.round(item.issueQty * weightedAvgUnitCost);

    console.log(`\n[BƯỚC 3] Tiến hành Xuất kho số lượng = ${item.issueQty} (VƯỢT QUA lớp 1 tồn ${openingLayer.quantityRemaining})`);
    console.log(`- [Engine Cũ - WEIGHTED_AVERAGE] Đơn giá BQGQ = ${weightedAvgUnitCost.toLocaleString('vi-VN')} ₫ -> COGS = ${cogsWeightedAvg.toLocaleString('vi-VN')} ₫`);

    // Chạy xuất kho THỰC TẾ qua costingEngine.calculateIssueCost với method = 'FIFO'
    const fifoIssueResult = await costingEngine.calculateIssueCost({
      productId: prod.id,
      warehouseId: 1,
      quantity: item.issueQty,
      method: 'FIFO',
      descriptionOverride: `Xuất kho kiểm chứng Multi-Layer Divergence SKU ${prod.sku}`
    });

    const cogsFifo = fifoIssueResult.totalCogs;
    const varianceAbs = cogsFifo - cogsWeightedAvg;
    const variancePercent = Math.round((varianceAbs / cogsWeightedAvg) * 10000) / 100;

    console.log(`- [Engine Mới - FIFO THẬT] COGS = ${cogsFifo.toLocaleString('vi-VN')} ₫`);
    console.log(`  -> Tiêu hao:`, fifoIssueResult.layersConsumed.map(l => `Layer #${l.layerId}: ${l.quantity} SP @ ${l.unitCost.toLocaleString('vi-VN')} ₫`).join(' + '));
    console.log(`- [CHÊNH LỆCH] Độ lệch tuyệt đối: ${varianceAbs.toLocaleString('vi-VN')} ₫ (${variancePercent > 0 ? '+' : ''}${variancePercent}%)`);

    // Lấy bút toán Sổ cái GL M30 vừa ghi nhận
    const [lastJe] = await db.select().from(accountingEntries).orderBy(desc(accountingEntries.id)).limit(1);
    console.log(`- [BƯỚC 5 - SỔ CÁI M30] Bút toán #${lastJe.entryCode}: Nợ ${lastJe.debitAccount} / Có ${lastJe.creditAccount} = ${lastJe.amount.toLocaleString('vi-VN')} ₫ (Khớp FIFO: ${lastJe.amount === cogsFifo ? 'CHÍNH XÁC 100%' : 'SAI LỆCH'})`);

    results.push({
      sku: prod.sku,
      name: prod.name,
      qtyIssued: item.issueQty,
      layersBefore: [
        { layerId: openingLayer.id, qty: openingLayer.quantityRemaining, unitCost: openingLayer.unitCost, label: 'Lớp 1 (Gốc)' },
        { layerId: layer2.id, qty: item.newQty, unitCost: newUnitCost, label: `Lớp 2 (${item.label})` }
      ],
      weightedAvgUnitCost,
      cogsWeightedAvg,
      cogsFifo,
      varianceAbs,
      variancePercent,
      fifoLayersConsumed: fifoIssueResult.layersConsumed,
      glEntry: lastJe ? {
        entryCode: lastJe.entryCode,
        debitAccount: lastJe.debitAccount,
        creditAccount: lastJe.creditAccount,
        amount: lastJe.amount
      } : undefined
    });
  }

  // --------------------------------------------------------------------------------
  // BƯỚC 6: KỊCH BẢN XUẤT KHO VƯỢT QUA CẢ 2 LỚP (3 LỚP LIÊN TIẾP)
  // --------------------------------------------------------------------------------
  console.log(`\n================================================================================`);
  console.log(`  [BƯỚC 6] KỊCH BẢN VƯỢT QUA CẢ 2 LỚP -> TIÊU HAO 3 LỚP LIÊN TIẾP (3-LAYER STACK)`);
  console.log(`================================================================================`);
  
  const [sku3] = await db.select().from(products).where(eq(products.sku, 'PRD-003')).limit(1); // Keyboard Mechanical
  console.log(`Sản phẩm thử nghiệm 3 lớp: ${sku3.sku} (${sku3.name})`);

  // Thêm Lớp 2 (+20%) và Lớp 3 (+40%)
  const [l1] = await db.select().from(costLayers).where(and(eq(costLayers.productId, sku3.id), eq(costLayers.status, 'ACTIVE')));
  console.log(`- Lớp 1 hiện tại (ID ${l1.id}): ${l1.quantityRemaining} SP @ ${l1.unitCost.toLocaleString('vi-VN')} ₫`);

  const l2 = await costingEngine.addCostLayer({
    productId: sku3.id,
    warehouseId: 1,
    quantity: 20,
    unitCost: 600000, // 500k -> 600k (+20%)
    sourceReferenceNo: 'GR-PRD003-LAYER-2',
    receiptDate: new Date(Date.now() + 1000 * 3600 * 2)
  });
  console.log(`- Nhập thêm Lớp 2 (ID ${l2.id}): 20 SP @ 600.000 ₫`);

  const l3 = await costingEngine.addCostLayer({
    productId: sku3.id,
    warehouseId: 1,
    quantity: 50,
    unitCost: 700000, // 500k -> 700k (+40% so với gốc)
    sourceReferenceNo: 'GR-PRD003-LAYER-3',
    receiptDate: new Date(Date.now() + 1000 * 3600 * 4)
  });
  console.log(`- Nhập thêm Lớp 3 (ID ${l3.id}): 50 SP @ 700.000 ₫`);

  // Xuất 65 SP -> Yêu cầu tiêu hao:
  // Hết Lớp 1 (30 SP @ 500k = 15.000.000 ₫)
  // Hết Lớp 2 (20 SP @ 600k = 12.000.000 ₫)
  // Một phần Lớp 3 (15 SP @ 700k = 10.500.000 ₫)
  // Tổng COGS kỳ vọng: 15.000.000 + 12.000.000 + 10.500.000 = 37.500.000 ₫
  console.log(`\nTiến hành xuất kho 65 SP (vượt qua Lớp 1=30, vượt qua Lớp 2=20, ăn vào Lớp 3=15):`);
  const issue3Layers = await costingEngine.calculateIssueCost({
    productId: sku3.id,
    warehouseId: 1,
    quantity: 65,
    method: 'FIFO',
    descriptionOverride: 'Xuất kho tiêu hao 3 lớp chi phí liên tiếp PRD-003'
  });

  console.log(`- Kết quả COGS FIFO thực tế: ${issue3Layers.totalCogs.toLocaleString('vi-VN')} ₫`);
  console.log(`- Chi tiết các lớp tiêu hao thực tế:`, issue3Layers.layersConsumed.map(l => `Layer #${l.layerId}: ${l.quantity} SP @ ${l.unitCost.toLocaleString('vi-VN')} ₫`).join(' | '));
  
  const expectedCogs = 30 * 500000 + 20 * 600000 + 15 * 700000;
  console.log(`- Kỳ vọng lý thuyết: ${expectedCogs.toLocaleString('vi-VN')} ₫`);
  const is3LayerPass = issue3Layers.totalCogs === expectedCogs;
  console.log(`- Kiểm chứng tính toàn vẹn 3 lớp: ${is3LayerPass ? 'CHÍNH XÁC TUYỆT ĐỐI (PASS)' : 'SAI LỆCH (FAIL)'}`);

  // Kiểm tra trạng thái các layer sau xuất
  const layersAfter = await db.select().from(costLayers).where(eq(costLayers.productId, sku3.id)).orderBy(asc(costLayers.id));
  console.log(`- Trạng thái 3 lớp sau xuất:`, layersAfter.map(l => `ID #${l.id}: Tồn=${l.quantityRemaining}/${l.quantityOriginal} (${l.status})`).join(' | '));

  return { results, issue3Layers, is3LayerPass };
}

runMultiLayerDivergence().catch(console.error);
