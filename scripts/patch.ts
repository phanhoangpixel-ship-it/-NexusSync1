import fs from "fs";

let content = fs.readFileSync('src/components/workspaces/M16POSRetailWorkspace.tsx', 'utf-8');

// 1. ADD NEW STATES & OFFLINE QUEUE
const stateInsert = `
  // Offline-first Mode States
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  // Split Payment States
  const [cardTendered, setCardTendered] = useState('');
  const [transferTendered, setTransferTendered] = useState('');

  // Z-Report State
  const [zReportModalOpen, setZReportModalOpen] = useState(false);
  const [actualCash, setActualCash] = useState('');

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const savedQueue = localStorage.getItem('posOfflineQueue');
    if (savedQueue) {
      try {
        setOfflineQueue(JSON.parse(savedQueue));
      } catch (e) {}
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('posOfflineQueue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    onNotify('info', 'Đang đồng bộ', \`Bắt đầu đồng bộ \${offlineQueue.length} đơn hàng...\`);
    let synced = 0;
    for (const order of offlineQueue) {
      try {
        await fetch('/api/sales/pos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
        synced++;
      } catch (e) {
        break; // Stop on first error
      }
    }
    setOfflineQueue(prev => prev.slice(synced));
    if (synced > 0) {
      onNotify('success', 'Đồng bộ thành công', \`Đã đẩy \${synced} đơn hàng lên Backend.\`);
    }
  };
`;
content = content.replace("const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'QR' | 'MIXED'>('CASH');", 
  "const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'QR' | 'MIXED'>('CASH');\n" + stateInsert);

// Fallback logic
content = content.replace('const handleConfirmPayment = async () => {', 'const handleConfirmPaymentOld = async () => {');

const newConfirmPaymentStr = `
  const handleConfirmPayment = async () => {
    let txId = 'POS-2026-00' + (513 + transactions.length);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    // Split payment logic
    const cashAmt = Number(cashTendered) || (paymentMethod === 'CASH' ? grandTotal : 0);
    const cardAmt = Number(cardTendered) || (paymentMethod === 'CARD' ? grandTotal : 0);
    const transferAmt = Number(transferTendered) || (paymentMethod === 'TRANSFER' || paymentMethod === 'QR' ? grandTotal : 0);
    const totalTendered = cashAmt + cardAmt + transferAmt;
    const changeDue = Math.max(0, totalTendered - grandTotal);

    if (totalTendered < grandTotal) {
      onNotify('danger', 'Lỗi thanh toán', 'Số tiền khách đưa chưa đủ để thanh toán hóa đơn.');
      return;
    }

    const payload = {
      items: cart.map(c => ({
        sku: c.sku,
        category: (c as any).category || 'General',
        unitPrice: c.price,
        quantity: c.quantity,
        discountPercent: c.discount
      })),
      customerId: selectedCustomer,
      branchId: shiftData.registerId
    };

    if (isOffline) {
      setOfflineQueue(prev => [...prev, payload]);
      onNotify('warning', 'Chế độ Offline', 'Giao dịch đã được lưu tạm offline, sẽ đồng bộ khi có mạng.');
    } else {
      try {
        const response = await fetch('/api/sales/pos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.success && data.orderRef) {
          txId = data.orderRef;
        } else {
           throw new Error(data.error || 'Lỗi từ Backend');
        }
      } catch (err) {
        setOfflineQueue(prev => [...prev, payload]);
        onNotify('warning', 'Lỗi kết nối Backend', 'Giao dịch đã được lưu tạm offline do lỗi mạng.');
      }
    }

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
      tenderedCash: cashAmt,
      tenderedCard: cardAmt,
      tenderedTransfer: transferAmt,
      changeDue,
    };

    setLatestReceipt(receipt);
    setTransactions([{
      id: txId,
      time: nowStr,
      customer: selectedCustomer,
      total: grandTotal,
      payment: paymentMethod,
      cashier: shiftData.cashierName,
      status: 'COMPLETED'
    }, ...transactions]);

    // Update shift totals
    setShiftData(prev => ({
      ...prev,
      cashSales: prev.cashSales + Math.min(grandTotal, cashAmt - changeDue),
      expectedCash: prev.expectedCash + Math.min(grandTotal, cashAmt - changeDue),
      cardSales: prev.cardSales + cardAmt,
      qrSales: prev.qrSales + transferAmt
    }));

    setCart([]);
    setPaymentModalOpen(false);
    setReceiptModalOpen(true);
    setCashTendered('');
    setCardTendered('');
    setTransferTendered('');
  };
`;

content = content.replace('const handleConfirmPaymentOld = async () => {', newConfirmPaymentStr + '\n/* old');
content = content.replace("onNotify('danger', 'Lỗi Kết nối', err.message);\n    }\n  };", '*/');

// 3. SMART PROMOTION ENGINE
const cartContextReplacementStr = `
  // Delegated to PricingService authoritative tax calculation domain.
  // SMART PROMO ENGINE
  const isVip = selectedCustomer.includes('VIP');
  
  const taxContexts = cart.map(item => {
    let autoDiscount = item.discount;
    if (isVip && autoDiscount === 0) autoDiscount = 5; // Auto 5% for VIP
    if (item.quantity >= 3 && autoDiscount === 0) autoDiscount = 10; // Buy 3 get 10%
    
    return {
      sku: item.sku,
      category: (item as any).category || 'General',
      unitPrice: item.price,
      quantity: item.quantity,
      discountPercent: autoDiscount,
    };
  });
`;
content = content.replace(
  /.*Delegated to PricingService authoritative tax calculation domain\.[\s\S]*?discountPercent: item\.discount,\s*}\)\);/,
  cartContextReplacementStr
);

const oldLineTaxResult = `const lineTaxResult = PricingService.calculateLinePricing({
                      sku: item.sku,
                      category: (item as any).category || 'General',
                      unitPrice: item.price,
                      quantity: item.quantity,
                      discountPercent: item.discount,
                    });`;
const newLineTaxResult = `
                    let autoDiscount = item.discount;
                    if (isVip && autoDiscount === 0) autoDiscount = 5;
                    if (item.quantity >= 3 && autoDiscount === 0) autoDiscount = 10;
                    
                    const lineTaxResult = PricingService.calculateLinePricing({
                      sku: item.sku,
                      category: (item as any).category || 'General',
                      unitPrice: item.price,
                      quantity: item.quantity,
                      discountPercent: autoDiscount,
                    });`;
content = content.replace(oldLineTaxResult, newLineTaxResult);


// 4. OFFLINE SYNC BUTTON & SHIFT CLOSING BUTTON
const offlineButtonHtml = `
              <button onClick={syncOfflineQueue} className={\`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center space-x-1.5 \${isOffline ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}\`}>
                <RotateCcw className="w-4 h-4" />
                <span>{isOffline ? 'Offline' : 'Online'} ({offlineQueue.length})</span>
              </button>
`;
content = content.replace('<div>', '<div>' + offlineButtonHtml);

// 5. Z-REPORT / SHIFT CLOSING MODAL
const zReportLogic = `
  const handleCloseShift = () => {
    const diff = Number(actualCash) - shiftData.expectedCash;
    onNotify('success', 'Đã chốt ca', \`Đóng ca thành công. Tiền mặt chênh lệch: \${diff.toLocaleString()} đ\`);
    setShiftData(prev => ({ ...prev, cashSales: 0, cardSales: 0, qrSales: 0, expectedCash: prev.openingFloat }));
    setIsShiftOpen(false);
    setZReportModalOpen(false);
    setActualCash('');
  };
`;
content = content.replace('const handleAddToCart', zReportLogic + '\n  const handleAddToCart');

const zReportButton = `
                <button
                  onClick={() => setZReportModalOpen(true)}
                  disabled={!isShiftOpen}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow transition-all flex items-center justify-center space-x-2 disabled:bg-slate-300"
                >
                  <Lock className="w-4 h-4" />
                  <span>Chốt & Đóng Ca (Z-Report)</span>
                </button>
`;
content = content.replace(
  /<button\s*onClick=\{\(\) => setIsShiftOpen\(!isShiftOpen\)\}[\s\S]*?<\/button>/,
  zReportButton
);

const zReportModalJSX = `
      {/* Z-Report Modal */}
      {zReportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 border-b pb-4">
              <Layers className="w-5 h-5 text-indigo-600" />
              Kết Toán Bàn Giao Ca (Z-Report)
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Tiền mặt đầu ca:</span>
                <span className="font-mono font-bold text-slate-900">{shiftData.openingFloat.toLocaleString()} đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Thu nhập tiền mặt trong ca:</span>
                <span className="font-mono font-bold text-emerald-600">+{shiftData.cashSales.toLocaleString()} đ</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3">
                <span className="text-slate-900 font-semibold">TỔNG TIỀN MẶT LÝ THUYẾT:</span>
                <span className="font-mono font-bold text-indigo-700 text-lg">{shiftData.expectedCash.toLocaleString()} đ</span>
              </div>
              
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Nhập số tiền mặt thực đếm trong két</label>
                <CurrencyInput
                  value={actualCash}
                  onChange={setActualCash}
                  placeholder="VD: 5,000,000"
                />
              </div>
              
              {actualCash && (
                <div className={\`flex justify-between p-3 rounded-lg border \${Number(actualCash) === shiftData.expectedCash ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}\`}>
                  <span className="font-semibold">Chênh lệch (Lệch két):</span>
                  <span className="font-mono font-bold">{(Number(actualCash) - shiftData.expectedCash).toLocaleString()} đ</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setZReportModalOpen(false)}
                className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-xl text-sm transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleCloseShift}
                disabled={!actualCash}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Xác nhận Đóng Ca</span>
              </button>
            </div>
          </div>
        </div>
      )}
`;
content = content.substring(0, content.lastIndexOf("</div>")) + zReportModalJSX + "</div>\n  );\n};\n";

// 6. SPLIT PAYMENT UI IN PAYMENT MODAL
const paymentMethodRadios = `
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: 'CASH', label: 'Tiền mặt' },
                    { id: 'CARD', label: 'Thẻ POS' },
                    { id: 'TRANSFER', label: 'Chuyển khoản' },
                    { id: 'MIXED', label: 'Hỗn hợp' },
                  ].map((m) => (
`;
content = content.replace(`<div className="grid grid-cols-3 gap-3">\n                  {[\n                    { id: 'CASH', label: 'Tiền mặt (Cash)' },\n                    { id: 'CARD', label: 'Thẻ POS' },\n                    { id: 'TRANSFER', label: 'Chuyển khoản QR' },\n                  ].map((m) => (`, paymentMethodRadios);


const mixedPaymentInputs = `
              {/* Payment Amount Inputs based on Method */}
              <div className="space-y-3 mt-4">
                {(paymentMethod === 'CASH' || paymentMethod === 'MIXED') && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Tiền mặt khách đưa (VNĐ)</label>
                    <CurrencyInput value={cashTendered} onChange={setCashTendered} />
                  </div>
                )}
                
                {(paymentMethod === 'CARD' || paymentMethod === 'MIXED') && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Cà thẻ POS (VNĐ)</label>
                    <CurrencyInput value={cardTendered} onChange={setCardTendered} />
                  </div>
                )}
                
                {(paymentMethod === 'TRANSFER' || paymentMethod === 'MIXED' || paymentMethod === 'QR') && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Chuyển khoản / QR (VNĐ)</label>
                    <CurrencyInput value={transferTendered} onChange={setTransferTendered} />
                  </div>
                )}
              </div>

              {/* Dynamic Change Due Logic */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Tiền thừa trả khách (Change Due):</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {Math.max(0, ((Number(cashTendered)||0) + (Number(cardTendered)||0) + (Number(transferTendered)||0)) - grandTotal).toLocaleString()} đ
                  </span>
                </div>
              </div>
`;

const oldCashTenderedSection = `              {paymentMethod === 'CASH' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tiền khách đưa (Cash Tendered)</label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Tiền thừa trả khách (Change Due):</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {Math.max(0, (Number(cashTendered) || 0) - grandTotal).toLocaleString()} đ
                    </span>
                  </div>
                </div>
              )}`;
              
content = content.replace(oldCashTenderedSection, mixedPaymentInputs);

fs.writeFileSync('src/components/workspaces/M16POSRetailWorkspace.tsx', content);
console.log('Done patching successfully');
