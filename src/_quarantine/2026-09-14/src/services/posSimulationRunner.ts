/**
 * POS Retail & Centralized Tax Engine End-to-End Simulation Script
 * Refactored: Gọi API thật thay vì giả lập
 */

export async function runPOSSalesSimulation() {
  console.log('==================================================');
  console.log(' NEXUSSYNC ERP - POS RETAIL (GỌI API THẬT) ');
  console.log('==================================================\n');

  const cartItems = [
    {
      id: 'item-001',
      sku: 'SKU-ENG-088',
      name: 'Bơm thủy lực cao áp P-1000',
      category: 'Thiết bị công nghiệp',
      unitPrice: 3500000,
      quantity: 1,
      discountPercent: 0,
    },
    {
      id: 'item-002',
      sku: 'SKU-RAW-101',
      name: 'Phôi thép hợp kim đặc biệt',
      category: 'Nguyên vật liệu',
      unitPrice: 250000,
      quantity: 10,
      discountPercent: 5, 
    },
    {
      id: 'item-003',
      sku: 'SKU-EXEMPT-01',
      name: 'Sách hướng dẫn vận hành hệ thống',
      category: 'Miễn thuế',
      unitPrice: 150000,
      quantity: 2,
      discountPercent: 0,
    },
  ];

  console.log(`[Bước 1] Gửi Request Tới API POST /api/sales/pos với ${cartItems.length} mặt hàng:\n`);
  
  try {
    const res = await fetch('http://localhost:3000/api/sales/pos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cartItems, customerId: 1, branchId: 'BR_HO' })
    });
    
    const data = await res.json();
    
    if (data.success) {
       console.log(`[Bước 2] Phản hồi từ API (Thành công):\n`);
       console.log(`  => Mã Giao dịch: ${data.orderRef}`);
       console.log(`  => Tổng tiền hàng: ${data.subtotal.toLocaleString()} đ`);
       console.log(`  => Tổng thuế: ${data.tax.toLocaleString()} đ`);
       console.log(`  => TỔNG THANH TOÁN: ${data.grandTotal.toLocaleString()} đ\n`);
       
       console.log('[Bước 3] Chi tiết từng mặt hàng tính thuế:');
       data.items.forEach((item: any) => {
         console.log(`  - [${item.sku}] ${item.name}`);
         console.log(`    + Giá trị tính thuế: ${item.taxResult.taxableAmount.toLocaleString()} đ`);
         console.log(`    + Mã thuế: ${item.taxResult.taxCode} (${(item.taxResult.taxRate * 100).toFixed(0)}%)`);
         console.log(`    + Thuế suất: ${item.taxResult.taxAmount.toLocaleString()} đ`);
       });
       
       return data;
    } else {
       console.error("Lỗi từ API:", data.error);
       return null;
    }
  } catch (err: any) {
    console.error("Giao dịch thất bại:", err.message);
    return null;
  }
}

// Auto-run if executed directly in Node
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('posSimulationRunner')) {
  runPOSSalesSimulation();
}
