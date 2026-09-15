import fs from "fs";

let content = fs.readFileSync("src/components/workspaces/M16POSRetailWorkspace.tsx", "utf-8");

const oldFunc = `  const handleConfirmPayment = () => {
    const txId = \`POS-2026-00\${513 + transactions.length}\`;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const receipt = {
      txId,
      time: nowStr,
      registerId: shiftData.registerId,
      storeName: shiftData.storeName,
      cashier: shiftData.cashierName,
      customer: selectedCustomer,
      items: [...cart],
      subtotal,
      tax,
      grandTotal,
      paymentMethod,
      tenderedCash: Number(cashTendered) || grandTotal,
      changeDue: Math.max(0, (Number(cashTendered) || grandTotal) - grandTotal),
    };

    setLatestReceipt(receipt);
    setTransactions(prev => [receipt, ...prev]);
    setCart([]);
    setPaymentModalOpen(false);
    setReceiptModalOpen(true);
    setCashTendered('');
    onNotify('success', 'Thanh toán thành công', \`Giao dịch \${txId} đã hoàn tất.\`);
  };`;

const newFunc = `  const handleConfirmPayment = async () => {
    try {
      const response = await fetch('/api/sales/pos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: cart.map(c => ({
             sku: c.sku,
             category: (c as any).category || 'General',
             unitPrice: c.price,
             quantity: c.quantity,
             discountPercent: c.discount
          })),
          customerId: selectedCustomer?.id || null,
          branchId: shiftData.registerId
        })
      });

      const data = await response.json();
      if (data.success) {
        const txId = data.orderRef;
        const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

        const receipt = {
          txId,
          time: nowStr,
          registerId: shiftData.registerId,
          storeName: shiftData.storeName,
          cashier: shiftData.cashierName,
          customer: selectedCustomer,
          items: [...cart],
          subtotal,
          tax,
          grandTotal,
          paymentMethod,
          tenderedCash: Number(cashTendered) || grandTotal,
          changeDue: Math.max(0, (Number(cashTendered) || grandTotal) - grandTotal),
        };

        setLatestReceipt(receipt);
        setTransactions(prev => [receipt, ...prev]);
        setCart([]);
        setPaymentModalOpen(false);
        setReceiptModalOpen(true);
        setCashTendered('');
        onNotify('success', 'Thanh toán thành công', \`Giao dịch \${txId} đã hoàn tất qua Backend API.\`);
      } else {
        onNotify('danger', 'Lỗi Thanh toán', data.error || 'Có lỗi xảy ra khi gọi API POS');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi Kết nối', err.message);
    }
  };`;

content = content.replace(oldFunc, newFunc);

// Responsiveness patch
content = content.replace(
  `className="flex-1 flex min-h-0 overflow-hidden p-6 gap-6"`,
  `className="flex-1 flex flex-col md:flex-row min-h-0 overflow-auto md:overflow-hidden p-6 gap-6"`
);

// We should also patch the receipt modal so that it prints nicely.
// Currently window.print() prints the whole page. We can use a print stylesheet.
// Let's add an ID "print-receipt" to the receipt modal.
content = content.replace(
  `className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6"`,
  `id="print-receipt" className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 print:shadow-none print:w-full print:max-w-none"`
);

fs.writeFileSync("src/components/workspaces/M16POSRetailWorkspace.tsx", content);
