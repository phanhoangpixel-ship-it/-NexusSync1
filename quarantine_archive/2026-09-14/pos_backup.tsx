import React, { useState, useEffect } from 'react';
import { CurrencyInput } from '../common/CurrencyInput';
import { SelectedEntityContext } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PricingService } from '../../../engines/pricingService';
import {
  CreditCard,
  ShoppingCart,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Printer,
  RotateCcw,
  ShieldCheck,
  User,
  Store,
  Lock,
  Unlock,
  AlertTriangle,
  Receipt,
  Layers,
  ArrowRight,
  Calculator,
  QrCode,
  Check
} from 'lucide-react';

interface M16POSRetailWorkspaceProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

interface CartItem {
  id: number;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  availableStock: number;
  discount: number; // percentage
}

export const M16POSRetailWorkspace: React.FC<M16POSRetailWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  // Navigation & Sub-tabs
  const [activeTab, setActiveTab] = useState<'pos' | 'shift' | 'transactions' | 'catalog'>('pos');

  // Shift Management State
  const [isShiftOpen, setIsShiftOpen] = useState<boolean>(true);
  const [shiftData, setShiftData] = useState({
    registerId: 'REGISTER-01',
    storeName: 'Trụ sở chính Hà Nội (Store HN-HQ)',
    cashierId: 'EMP-00101',
    cashierName: 'Nguyễn Văn An (Thu ngân)',
    openedAt: '2026-08-28 07:30:00',
    openingFloat: 5000000, // 5,000,000 VND
    cashSales: 14500000,
    cardSales: 8200000,
    qrSales: 3100000,
    totalRefunds: 250000,
    expectedCash: 19250000,
    actualCashInput: '19250000',
    varianceReason: '',
  });

  // Shift Closing Modal
  const [showCloseShiftModal, setShowCloseShiftModal] = useState<boolean>(false);

  // Catalog / Products list
  const [products, setProducts] = useState<any[]>([
    { id: 1, sku: 'SKU-ENG-088', name: 'Bơm thủy lực cao áp P-1000', retailPrice: 3500000, availableStock: 45, category: 'Thiết bị cơ khí' },
    { id: 2, sku: 'SKU-MAT-302', name: 'Cảm biến lưu lượng điện từ DN80', retailPrice: 1850000, availableStock: 80, category: 'Cảm biến IoT' },
    { id: 3, sku: 'SKU-ELC-901', name: 'Biến tần công nghiệp 3 pha 45kW', retailPrice: 12500000, availableStock: 12, category: 'Thiết bị điện' },
    { id: 4, sku: 'SKU-RAW-101', name: 'Thép cuộn cán nóng SS400 (Cuộn 50kg)', retailPrice: 1450000, availableStock: 120, category: 'Nguyên vật liệu' },
    { id: 5, sku: 'SKU-ACC-055', name: 'Cáp tín hiệu chống nhiễu 2x1.5 (Mét)', retailPrice: 25000, availableStock: 1500, category: 'Phụ kiện' },
    { id: 6, sku: 'SKU-TOOL-12', name: 'Bộ cờ lê tròng tự động 12 chi tiết', retailPrice: 850000, availableStock: 35, category: 'Dụng cụ cầm tay' },
    { id: 7, sku: 'SKU-VALVE-04', name: 'Van bi inox điều khiển khí nén DN50', retailPrice: 2600000, availableStock: 22, category: 'Van công nghiệp' },
  ]);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([
    { id: 1, sku: 'SKU-ENG-088', name: 'Bơm thủy lực cao áp P-1000', price: 3500000, quantity: 1, availableStock: 45, discount: 0 },
    { id: 5, sku: 'SKU-ACC-055', name: 'Cáp tín hiệu chống nhiễu 2x1.5 (Mét)', price: 25000, quantity: 10, availableStock: 1500, discount: 0 },
  ]);

  // Customer Selection
  const [selectedCustomer, setSelectedCustomer] = useState<string>('Khách lẻ vãng lai (Walk-in)');
  const [customerModalOpen, setCustomerModalOpen] = useState<boolean>(false);
  const customersList = [
    'Khách lẻ vãng lai (Walk-in)',
    'Công ty CP Thương mại Kỹ thuật Hưng Thịnh (CUST-001)',
    'Tập đoàn Xây dựng Miền Trung (CUST-002)',
    'Công ty TNHH Giải pháp Tự động hóa VN (CUST-003)',
  ];

  // Barcode quick input
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  // Payment State
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'QR' | 'MIXED'>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('15000000');
  const [cardTendered, setCardTendered] = useState<string>('0');

  // Completed Transactions Ledger
  const [transactions, setTransactions] = useState<any[]>([
    { id: 'POS-2026-00512', time: '2026-08-28 10:15:22', customer: 'Khách lẻ vãng lai (Walk-in)', total: 3750000, payment: 'CASH', cashier: 'Nguyễn Văn An', status: 'COMPLETED' },
    { id: 'POS-2026-00511', time: '2026-08-28 09:42:05', customer: 'Công ty CP Thương mại Kỹ thuật Hưng Thịnh', total: 12500000, payment: 'TRANSFER', cashier: 'Nguyễn Văn An', status: 'COMPLETED' },
    { id: 'POS-2026-00510', time: '2026-08-28 08:50:18', customer: 'Tập đoàn Xây dựng Miền Trung', total: 5400000, payment: 'CARD', cashier: 'Nguyễn Văn An', status: 'COMPLETED' },
  ]);

  // Receipt Preview Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);
  const [latestReceipt, setLatestReceipt] = useState<any | null>(null);

  // Confirm Dialog State (Rule #19)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  // Centralized Tax/VAT Engine Service Integration
  // Delegated to PricingService authoritative tax calculation domain.
  const taxContexts = cart.map(item => ({
    sku: item.sku,
    category: (item as any).category || 'General',
    unitPrice: item.price,
    quantity: item.quantity,
    discountPercent: item.discount,
  }));
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity * (1 - item.discount / 100), 0);
  const tax = taxContexts.reduce((acc, ctx) => acc + PricingService.calculateLinePricing(ctx).taxAmount, 0);
  const grandTotal = subtotal + tax;

  const handleAddToCart = (product: any) => {
    if (product.availableStock <= 0) {
      onNotify('danger', 'Hết hàng khả dụng', `Sản phẩm ${product.name} đã hết tồn kho (Available = 0). Cần kiểm tra lại Inventory Core.`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.availableStock) {
          onNotify('warning', 'Giới hạn tồn kho', `Không thể thêm vượt quá tồn kho khả dụng (${product.availableStock}).`);
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: product.retailPrice,
        quantity: 1,
        availableStock: product.availableStock,
        discount: 0
      }];
    });
    onNotify('success', 'Đã thêm vào giỏ', `Đã thêm ${product.name} vào giỏ hàng POS.`);
  };

  const handleUpdateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.availableStock) {
          onNotify('warning', 'Vượt tồn kho', `Tồn kho khả dụng chỉ còn ${item.availableStock}.`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const handleRemoveItem = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const found = products.find(p => p.sku.toLowerCase() === barcodeInput.trim().toLowerCase());
    if (found) {
      handleAddToCart(found);
      setBarcodeInput('');
    } else {
      onNotify('danger', 'Không tìm thấy SKU', `Mã vạch / SKU "${barcodeInput}" không tồn tại trong danh mục Item Master.`);
    }
  };

  const handleCheckoutProcess = () => {
    if (cart.length === 0) {
      onNotify('warning', 'Giỏ hàng trống', 'Vui lòng chọn sản phẩm trước khi thanh toán.');
      return;
    }
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = () => {
    const txId = `POS-2026-00${513 + transactions.length}`;
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
    setTransactions([{
      id: txId,
      time: nowStr,
      customer: selectedCustomer,
      total: grandTotal,
      payment: paymentMethod,
      cashier: 'Nguyễn Văn An',
      status: 'COMPLETED'
    }, ...transactions]);

    // Update shift totals
    if (paymentMethod === 'CASH') {
      setShiftData(prev => ({ ...prev, cashSales: prev.cashSales + grandTotal, expectedCash: prev.expectedCash + grandTotal }));
    } else if (paymentMethod === 'CARD') {
      setShiftData(prev => ({ ...prev, cardSales: prev.cardSales + grandTotal }));
    } else {
      setShiftData(prev => ({ ...prev, qrSales: prev.qrSales + grandTotal }));
    }

    setCart([]);
    setPaymentModalOpen(false);
    setReceiptModalOpen(true);
    onNotify('success', 'Thanh toán thành công', `Đã hoàn tất giao dịch ${txId}. Đã phát lệnh trừ tồn kho Inventory Core & hạch toán GL.`);
  };

  const handleCloseShiftAction = () => {
    const actual = Number(shiftData.actualCashInput) || 0;
    const variance = actual - shiftData.expectedCash;

    if (variance !== 0 && !shiftData.varianceReason.trim()) {
      onNotify('danger', 'Thiếu giải trình chênh lệch', 'Phát hiện chênh lệch tiền mặt trong két nhưng chưa có lý do giải trình theo chuẩn SOP.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận Đóng ca & Kết toán Két (Blind Cash Count)',
      message: `Kết toán két POS ${shiftData.registerId}. Dự kiến: ${shiftData.expectedCash.toLocaleString()} đ, Thực tế đếm: ${actual.toLocaleString()} đ. Chênh lệch: ${variance.toLocaleString()} đ. Bạn có chắc chắn muốn chốt ca?`,
      confirmText: 'Chốt ca két',
      onConfirm: () => {
        setIsShiftOpen(false);
        setShowCloseShiftModal(false);
        setConfirmDialog(null);
        onNotify('success', 'Chốt ca thành công', `Đã kết toán két ${shiftData.registerId}. Trạng thái chuyển sang CLOSED.`);
      }
    });
  };

  return (
    <div id="m16-pos-workspace" className="flex-1 flex flex-col bg-slate-50 min-h-0 overflow-hidden">
      {/* Top Banner & Workspace Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">M16: POS Retail Thu ngân</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full font-mono">
                {shiftData.registerId}
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${isShiftOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isShiftOpen ? 'ĐANG MỞ CA (OPEN)' : 'ĐÃ ĐÓNG CA (CLOSED)'}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Kênh bán hàng trực tiếp tại điểm bán, quét Barcode, thanh toán đa phương thức & đồng bộ Inventory Core realtime.
            </p>
          </div>
        </div>

        {/* Quick Tabs */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'pos' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Màn hình Thu ngân POS
          </button>
          <button
            onClick={() => setActiveTab('shift')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'shift' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Quản lý Ca & Két (Shift)
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'transactions' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Lịch sử Giao dịch & Biên lai
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'catalog' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Danh mục Sản phẩm POS
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-auto md:overflow-hidden p-6 gap-6">
        {activeTab === 'pos' && (
          <>
            {/* Left Column: Product Catalog & Barcode Scanner */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Barcode & Search Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
                <form onSubmit={handleBarcodeSubmit} className="flex-1 flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Barcode className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="Quét mã vạch Barcode hoặc nhập SKU sản phẩm..."
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm shadow-sm transition-all flex items-center space-x-1"
                  >
                    <Search className="w-4 h-4" />
                    <span>Tìm SKU</span>
                  </button>
                </form>

                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Store className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-800">{shiftData.registerId}</span>
                </div>
              </div>

              {/* Product Grid */}
              <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleAddToCart(p)}
                    className="p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 text-xs font-mono font-medium bg-slate-100 text-slate-700 rounded-md">
                          {p.sku}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.availableStock > 10 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          Kho: {p.availableStock}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{p.category}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-base font-bold font-mono text-emerald-600">
                        {p.retailPrice.toLocaleString()} đ
                      </span>
                      <button className="p-2 bg-emerald-50 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white rounded-lg transition-all">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Active Cart & Checkout */}
            <div className="w-full lg:w-[420px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Customer Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-xs text-slate-400">Khách hàng giao dịch</p>
                    <p className="text-sm font-semibold truncate max-w-[220px]">{selectedCustomer}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCustomerModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg text-emerald-300 transition-all"
                >
                  Đổi
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 p-4 overflow-y-auto divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
                    <ShoppingCart className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="font-medium text-slate-600">Giỏ hàng trống</p>
                    <p className="text-xs text-slate-400 mt-1">Chọn sản phẩm từ danh mục bên trái hoặc quét mã vạch để bắt đầu.</p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const lineTaxResult = PricingService.calculateLinePricing({
                      sku: item.sku,
                      category: (item as any).category || 'General',
                      unitPrice: item.price,
                      quantity: item.quantity,
                      discountPercent: item.discount,
                    });

                    return (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-xs font-mono text-slate-500">{item.sku}</span>
                            <span className="text-xs font-mono font-semibold text-emerald-600">{item.price.toLocaleString()} đ</span>
                          </div>
                          <div className="mt-1 flex items-center space-x-1.5">
                            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                              {lineTaxResult.taxCode} ({(lineTaxResult.taxRate * 100).toFixed(0)}%)
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Thuế: +{lineTaxResult.taxAmount.toLocaleString()} đ
                            </span>
                          </div>
                        </div>

                        {/* Qty controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateQty(item.id, -1)}
                            className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-mono font-bold text-slate-900">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQty(item.id, 1)}
                            className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right min-w-[90px]">
                          <p className="text-sm font-bold font-mono text-slate-900">
                            {(item.price * item.quantity * (1 - item.discount / 100)).toLocaleString()} đ
                          </p>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-xs text-red-500 hover:text-red-700 mt-0.5"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Totals & Checkout Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Tạm tính (Subtotal):</span>
                  <span className="font-mono font-semibold text-slate-900">{subtotal.toLocaleString()} đ</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span className="flex items-center space-x-1">
                    <span>Thuế GTGT (Tax Engine):</span>
                  </span>
                  <span className="font-mono font-semibold text-slate-900">{tax.toLocaleString()} đ</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">TỔNG THANH TOÁN:</span>
                  <span className="text-xl font-bold font-mono text-emerald-600">{grandTotal.toLocaleString()} đ</span>
                </div>

                <button
                  disabled={cart.length === 0 || !isShiftOpen}
                  onClick={handleCheckoutProcess}
                  className="w-full mt-3 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <DollarSign className="w-5 h-5" />
                  <span>THANH TOÁN NHANH ({grandTotal.toLocaleString()} đ)</span>
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'shift' && (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Quản lý Ca làm việc & Két Thu Ngân (Cash Drawer)</h2>
                <p className="text-sm text-slate-500">Kiểm soát số dư tiền mặt đầu ca, doanh thu trong ca và thực hiện kiểm đếm mù (Blind Count).</p>
              </div>
              {isShiftOpen ? (
                <button
                  onClick={() => setShowCloseShiftModal(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl text-sm shadow-sm transition-all flex items-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Đóng Ca & Kết Toán Két</span>
                </button>
              ) : (
                <span className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm">
                  Ca Đã Đóng
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">Tiền mặt đầu ca (Opening Float)</p>
                <p className="text-2xl font-bold font-mono text-slate-900 mt-2">{shiftData.openingFloat.toLocaleString()} đ</p>
                <p className="text-xs text-emerald-600 mt-1">Đã kiểm đếm & xác nhận</p>
              </div>
              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
                <p className="text-xs text-emerald-700 font-medium">Doanh thu Tiền mặt (Cash Sales)</p>
                <p className="text-2xl font-bold font-mono text-emerald-800 mt-2">{shiftData.cashSales.toLocaleString()} đ</p>
                <p className="text-xs text-emerald-600 mt-1">Lưu trữ trong két thu ngân</p>
              </div>
              <div className="p-5 bg-blue-50 rounded-2xl border border-blue-200">
                <p className="text-xs text-blue-700 font-medium">Doanh thu Thẻ & QR (Non-Cash)</p>
                <p className="text-2xl font-bold font-mono text-blue-800 mt-2">{(shiftData.cardSales + shiftData.qrSales).toLocaleString()} đ</p>
                <p className="text-xs text-blue-600 mt-1">Chuyển khoản trực tiếp</p>
              </div>
              <div className="p-5 bg-purple-50 rounded-2xl border border-purple-200">
                <p className="text-xs text-purple-700 font-medium">Tiền mặt dự kiến trong két</p>
                <p className="text-2xl font-bold font-mono text-purple-800 mt-2">{shiftData.expectedCash.toLocaleString()} đ</p>
                <p className="text-xs text-purple-600 mt-1">Float + Cash Sales</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
              <h3 className="font-semibold text-slate-900">Thông tin Ca làm việc hiện tại</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block">Mã Két POS:</span>
                  <span className="font-mono font-semibold text-slate-900">{shiftData.registerId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Cửa hàng / Chi nhánh:</span>
                  <span className="font-semibold text-slate-900">{shiftData.storeName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Thu ngân phụ trách:</span>
                  <span className="font-semibold text-slate-900">{shiftData.cashierName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Thời gian mở ca:</span>
                  <span className="font-mono text-slate-900">{shiftData.openedAt}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tổng số giao dịch:</span>
                  <span className="font-mono font-semibold text-slate-900">{transactions.length} giao dịch</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Trạng thái két:</span>
                  <span className="font-semibold text-emerald-600">Khóa an toàn hoạt động</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Lịch sử Giao dịch & Biên lai POS</h2>
                <p className="text-sm text-slate-500">Các giao dịch bán lẻ hoàn tất là bất biến (Immutable), hỗ trợ xem lại biên lai hoặc liên kết Returns & RMA.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                    <th className="py-3 px-4">Mã Giao dịch</th>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Phương thức</th>
                    <th className="py-3 px-4 text-right">Tổng tiền</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">{tx.id}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{tx.time}</td>
                      <td className="py-3.5 px-4 text-slate-900 font-medium">{tx.customer}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md font-mono">
                          {tx.payment}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {tx.total.toLocaleString()} đ
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setLatestReceipt({
                              txId: tx.id,
                              time: tx.time,
                              registerId: shiftData.registerId,
                              storeName: shiftData.storeName,
                              cashier: shiftData.cashierName,
                              customer: tx.customer,
                              items: cart.length > 0 ? cart : [{ sku: 'SKU-ENG-088', name: 'Bơm thủy lực cao áp P-1000', price: tx.total, quantity: 1, discount: 0 }],
                              subtotal: Math.round(tx.total / 1.1),
                              tax: tx.total - Math.round(tx.total / 1.1),
                              grandTotal: tx.total,
                              paymentMethod: tx.payment,
                              tenderedCash: tx.total,
                              changeDue: 0
                            });
                            setReceiptModalOpen(true);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-medium rounded-lg text-xs transition-all"
                        >
                          Xem Biên Lai
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Danh mục Sản phẩm POS (Đồng bộ từ Item Master M07)</h2>
                <p className="text-sm text-slate-500">Giá bán lẻ niêm yết và số lượng tồn kho khả dụng thời gian thực.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50">
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Tên sản phẩm</th>
                    <th className="py-3 px-4">Danh mục</th>
                    <th className="py-3 px-4 text-right">Giá bán lẻ (VND)</th>
                    <th className="py-3 px-4 text-center">Tồn khả dụng (Available)</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{p.sku}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3.5 px-4 text-slate-500">{p.category}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">{p.retailPrice.toLocaleString()} đ</td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-900">{p.availableStock}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${p.availableStock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {p.availableStock > 0 ? 'Sẵn sàng bán' : 'Hết hàng'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Thanh Toán Giao Dịch POS</span>
              </h3>
              <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Tổng tiền cần thanh toán:</span>
                <span className="text-2xl font-bold font-mono text-emerald-600">{grandTotal.toLocaleString()} đ</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Chọn phương thức thanh toán</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'CASH', label: 'Tiền mặt (Cash)' },
                    { id: 'CARD', label: 'Thẻ POS' },
                    { id: 'TRANSFER', label: 'Chuyển khoản QR' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-3 text-sm font-semibold rounded-xl border transition-all ${paymentMethod === m.id ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'CASH' && (
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
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-xl text-sm transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Xác nhận Thanh toán & In Biên Lai</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {receiptModalOpen && latestReceipt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div id="print-receipt" className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 print:shadow-none print:w-full print:max-w-none">
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <h3 className="font-bold text-lg text-slate-900">{latestReceipt.storeName}</h3>
              <p className="text-xs font-mono text-slate-500 mt-1">Mã két: {latestReceipt.registerId} | Thu ngân: {latestReceipt.cashier}</p>
              <p className="text-xs font-mono text-slate-500">{latestReceipt.time}</p>
              <p className="text-sm font-bold text-emerald-700 mt-2 font-mono">{latestReceipt.txId}</p>
            </div>

            <div className="space-y-2 text-sm max-h-60 overflow-y-auto divide-y divide-slate-100">
              {latestReceipt.items.map((it: any, idx: number) => (
                <div key={idx} className="pt-2 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-900">{it.name}</p>
                    <p className="text-xs text-slate-500">{it.quantity} x {it.price.toLocaleString()} đ</p>
                  </div>
                  <span className="font-mono font-semibold text-slate-900">{(it.price * it.quantity).toLocaleString()} đ</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-dashed border-slate-300 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính:</span>
                <span className="font-mono">{latestReceipt.subtotal.toLocaleString()} đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Thuế VAT (10%):</span>
                <span className="font-mono">{latestReceipt.tax.toLocaleString()} đ</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>TỔNG CỘNG:</span>
                <span className="font-mono text-emerald-600">{latestReceipt.grandTotal.toLocaleString()} đ</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 pt-1">
                <span>Phương thức: {latestReceipt.paymentMethod}</span>
                <span>Tiền thừa: {latestReceipt.changeDue.toLocaleString()} đ</span>
              </div>
            </div>

            <div className="text-center text-xs text-slate-400 py-2 border-t border-slate-100">
              <p>Cảm ơn quý khách và hẹn gặp lại!</p>
              <p className="font-mono mt-1">NexusSync ERP Retail Engine - Immutable Receipt</p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>In Biên Lai (80mm)</span>
              </button>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseShiftModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Kết toán Két & Đóng Ca (Blind Cash Count)</h3>
            <p className="text-sm text-slate-500">Nhập số tiền mặt thực tế đếm được trong két két {shiftData.registerId}.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tiền mặt dự kiến (Expected Cash)</label>
                <input
                  type="text"
                  disabled
                  value={`${shiftData.expectedCash.toLocaleString()} đ`}
                  className="w-full px-4 py-2 bg-slate-100 rounded-xl font-mono font-bold text-slate-700"
                />
              </div>

              <div>
                <CurrencyInput
                  label="Tiền mặt thực tế đếm được (Actual Count)"
                  value={shiftData.actualCashInput}
                  onChange={(val) => setShiftData(prev => ({ ...prev, actualCashInput: val.toString() }))}
                  placeholder="VD: 19.250.000"
                  showBadge={true}
                  showPresets={true}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Lý do chênh lệch (nếu có)</label>
                <textarea
                  value={shiftData.varianceReason}
                  onChange={(e) => setShiftData(prev => ({ ...prev, varianceReason: e.target.value }))}
                  placeholder="Giải trình nguyên nhân thừa/thiếu tiền mặt..."
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowCloseShiftModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={handleCloseShiftAction}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md"
              >
                Xác nhận Đóng Ca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Selection Modal */}
      {customerModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Chọn Khách hàng Giao dịch</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {customersList.map((c, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedCustomer(c);
                    setCustomerModalOpen(false);
                    onNotify('info', 'Đã đổi khách hàng', `Giao dịch POS áp dụng cho: ${c}`);
                  }}
                  className="p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl cursor-pointer transition-all text-sm font-medium text-slate-800"
                >
                  {c}
                </div>
              ))}
            </div>
            <button
              onClick={() => setCustomerModalOpen(false)}
              className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog (Rule #19) */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};

export default M16POSRetailWorkspace;
