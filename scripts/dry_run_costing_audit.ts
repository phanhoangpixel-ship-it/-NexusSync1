import { createClient } from "@libsql/client";

async function dryRunCostLayers() {
  const client = createClient({ url: "file:nexus_erp.db" });

  console.log("=== DRY-RUN AUDIT: KIỂM TRA PRODUCTS VÀ TỒN KHO THIẾU COST_LAYERS ===");

  // 1. Lấy tất cả products active
  const productsRs = await client.execute(
    "SELECT id, sku, name, status, cost_price FROM products WHERE status = 'ACTIVE' OR status IS NULL"
  );
  const activeProducts = productsRs.rows;
  console.log(`\nTổng số sản phẩm ACTIVE: ${activeProducts.length}`);

  // 2. Lấy tồn kho hiện tại theo kho (bảng stock_balances)
  let stockRows: any[] = [];
  try {
    const stockRs = await client.execute(`
      SELECT sb.product_id, sb.warehouse_id, w.name as warehouse_name, p.sku, p.name as product_name, sb.stock_physical, sb.stock_available, sb.stock_reserved
      FROM stock_balances sb
      LEFT JOIN warehouses w ON sb.warehouse_id = w.id
      LEFT JOIN products p ON sb.product_id = p.id
      WHERE sb.stock_physical > 0
    `);
    stockRows = stockRs.rows;
  } catch (e: any) {
    console.log("Lỗi đọc bảng stock_balances:", e.message);
  }

  console.log(`Tổng số vị trí kho có tồn kho vật lý thực tế (> 0): ${stockRows.length}`);

  // 3. Lấy toàn bộ cost_layers còn tồn (quantity_remaining > 0)
  let costLayerRows: any[] = [];
  try {
    const layersRs = await client.execute(`
      SELECT id, product_id, warehouse_id, quantity_original, quantity_remaining, unit_cost, status
      FROM cost_layers
      WHERE quantity_remaining > 0
    `);
    costLayerRows = layersRs.rows;
  } catch (e: any) {
    console.log("Lỗi đọc bảng cost_layers:", e.message);
  }
  console.log(`Tổng số cost_layers còn số lượng (quantity_remaining > 0): ${costLayerRows.length}`);

  // 4. Phân tích đối chiếu: Những cặp (product_id, warehouse_id) có tồn kho > 0 mà KHÔNG CÓ cost_layer tương ứng
  const layerMap = new Set<string>();
  const productWithAnyLayer = new Set<number>();
  for (const l of costLayerRows) {
    layerMap.add(`${l.product_id}_${l.warehouse_id}`);
    productWithAnyLayer.add(Number(l.product_id));
  }

  const atRiskStock: any[] = [];
  for (const s of stockRows) {
    const key = `${s.product_id}_${s.warehouse_id}`;
    if (!layerMap.has(key)) {
      atRiskStock.push(s);
    }
  }

  // 5. Kiểm tra toàn bộ Active Products xem có sản phẩm nào không có bất kỳ cost_layer nào không
  const productsWithoutAnyLayer: any[] = [];
  for (const p of activeProducts) {
    if (!productWithAnyLayer.has(Number(p.id))) {
      productsWithoutAnyLayer.push(p);
    }
  }

  console.log("\n================ KẾT QUẢ PHÂN TÍCH DRY-RUN ================");
  console.log(`1. Số SKU/Kho đang có tồn kho (>0) nhưng THIẾU cost_layer hợp lệ: ${atRiskStock.length}`);
  if (atRiskStock.length > 0) {
    console.log("Chi tiết các SKU/Kho có nguy cơ bị chặn xuất kho nếu bật fail-fast ngay:");
    for (const item of atRiskStock) {
      console.log(`  - Product ID ${item.product_id} tại Kho [${item.warehouse_name || item.warehouse_id}]: Tồn ${item.quantity_on_hand} SP`);
    }
  } else {
    console.log("  => Không có SKU/Kho nào có tồn kho dương mà thiếu cost_layer!");
  }

  console.log(`\n2. Số sản phẩm ACTIVE trên danh mục chưa từng có cost_layer: ${productsWithoutAnyLayer.length} / ${activeProducts.length}`);
  for (const p of productsWithoutAnyLayer.slice(0, 10)) {
    console.log(`  - SKU: ${p.sku} | Name: ${p.name} | Giá vốn danh mục (cost_price): ${p.cost_price}`);
  }
  if (productsWithoutAnyLayer.length > 10) {
    console.log(`  ... và ${productsWithoutAnyLayer.length - 10} sản phẩm khác.`);
  }

  console.log("\n===========================================================");
}

dryRunCostLayers().catch(console.error);
