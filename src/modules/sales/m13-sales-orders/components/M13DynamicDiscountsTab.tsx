import React, { useState, useEffect } from 'react';
import { PricingService } from './utils';
import {
  Percent,
  Calculator,
  ShieldAlert,
  Sparkles,
  Users,
  Layers,
  CreditCard,
  Tag,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Lock
} from 'lucide-react';

interface CustomerOption {
  id: number;
  name: string;
  code: string;
  tier: string;
  creditLimit: number;
  paymentTerms: string;
}

interface M13DynamicDiscountsTabProps {
  onNotify?: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  onApplyDiscount?: (result: any) => void;
}

export const M13DynamicDiscountsTab: React.FC<M13DynamicDiscountsTabProps> = ({ onNotify, onApplyDiscount }) => {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  
  // Simulation Inputs
  const [unitPrice, setUnitPrice] = useState<number>(25000000); // 25,000,000 VND
  const [quantity, setQuantity] = useState<number>(60);
  const [costBasis, setCostBasis] = useState<number>(16000000); // 16,000,000 VND
  const [customerTier, setCustomerTier] = useState<string>('GOLD');
  const [paymentTerm, setPaymentTerm] = useState<string>('PREPAID');
  const [promoCode, setPromoCode] = useState<string>('NEXUS2026');
  const [minMarginPercent, setMinMarginPercent] = useState<number>(15);

  // Computed result
  const [result, setResult] = useState<any>(null);

  // Fetch M07 Customers for real customer tier linking
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/customers');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCustomers(
              data.map((c: any) => ({
                id: c.id,
                name: c.name,
                code: c.customerCode || `CUST-${c.id}`,
                tier: c.customerTier || (c.groupName?.includes('VIP') ? 'VIP' : 'GOLD'),
                creditLimit: c.creditLimit || 500000000,
                paymentTerms: c.paymentTerms || 'NET30'
              }))
            );
          }
        }
      } catch (err) {
        console.error('Error loading M07 customers:', err);
      }
    };
    fetchCustomers();
  }, []);

  // Recalculate dynamic discount
  useEffect(() => {
    if (!costBasis || costBasis <= 0 || !unitPrice || unitPrice <= 0) {
      setResult(null);
      return;
    }
    try {
      const res = PricingService.calculateDynamicDiscount({
        unitPrice,
        quantity,
        costBasis,
        customerTier,
        paymentTerm,
        promoCode,
        minMarginPercent
      });
      setResult(res);
    } catch (err) {
      console.warn('PricingService.calculateDynamicDiscount warning:', err);
      setResult(null);
    }
  }, [unitPrice, quantity, costBasis, customerTier, paymentTerm, promoCode, minMarginPercent]);

  const handleSelectCustomer = (idStr: string) => {
    if (!idStr) {
      setSelectedCustomerId('');
      return;
    }
    const id = Number(idStr);
    setSelectedCustomerId(id);
    const target = customers.find(c => c.id === id);
    if (target) {
      setCustomerTier(target.tier);
      setPaymentTerm(target.paymentTerms);
      onNotify('info', 'Đã tải thông tin Khách hàng M07', `Đã đồng bộ Hạng [${target.tier}] & Điều khoản [${target.paymentTerms}] của ${target.name}.`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 to-slate-900 border border-purple-800/40 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
              PRICING & DISCOUNT ENGINE • M13 / M41 / M07
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              Chốt Chặn Biên Lợi Nhuận An Toàn (Margin Floor Guard)
            </span>
          </div>
          <h2 className="text-lg font-bold mt-1 text-white flex items-center gap-2">
            <Percent className="w-5 h-5 text-purple-400" />
            Ma Trận Quản Lý Chiết Khấu Động (Dynamic Discount Matrix)
          </h2>
          <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
            Tự động giải quyết chính sách chiết khấu đa tầng: Bậc số lượng (Volume), Hạng khách hàng M07 (Loyalty Tier), Phương thức thanh toán (Cash/Term), và Mã Voucher Khuyến mãi mà không làm thủng sàn biên lợi nhuận quy định.
          </p>
        </div>
      </div>

      {/* Main Grid: Inputs vs Real-time Matrix Resolution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Simulation Parameters */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-600" />
              <span>Thiết Lập Tham Số Đơn Hàng & Khách Hàng (M07)</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Auto-calculated</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chọn Khách Hàng Master Data (M07 Customers)
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="">-- Chọn khách hàng để tự động lấy Hạng & Điều khoản --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.tier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Đơn Giá Niêm Yết (VND)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={unitPrice !== undefined && unitPrice !== null ? Number(unitPrice).toLocaleString('vi-VN') : '0'}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setUnitPrice(raw ? Number(raw) : 0);
                }}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số Lượng Đặt Mua (Qty)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={quantity !== undefined && quantity !== null ? Number(quantity).toLocaleString('vi-VN') : '1'}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setQuantity(raw ? Number(raw) : 1);
                }}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Giá Vốn Sản Phẩm (Cost Basis)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={costBasis !== undefined && costBasis !== null ? Number(costBasis).toLocaleString('vi-VN') : '0'}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setCostBasis(raw ? Number(raw) : 0);
                }}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hạng Khách Hàng (Customer Tier)
              </label>
              <select
                value={customerTier}
                onChange={(e) => setCustomerTier(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="STANDARD">STANDARD (0%)</option>
                <option value="SILVER">SILVER (Chiết khấu 3%)</option>
                <option value="GOLD">GOLD (Chiết khấu 6%)</option>
                <option value="VIP">VIP (Chiết khấu 10%)</option>
                <option value="ENTERPRISE">ENTERPRISE (Chiết khấu 10%)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Điều Khoản Thanh Toán
              </label>
              <select
                value={paymentTerm}
                onChange={(e) => setPaymentTerm(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="PREPAID">Trả trước 100% / Tiền mặt (-2%)</option>
                <option value="NET15">NET 15 ngày (-1%)</option>
                <option value="NET30">NET 30 ngày (Chuẩn 0%)</option>
                <option value="NET60">NET 60 ngày (0%)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mã Khuyến Mãi (Promo Voucher)
              </label>
              <input
                type="text"
                placeholder="Vd: NEXUS2026, SUMMER50"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sàn Biên Lợi Nhuận Tối Thiểu Yêu Cầu (Minimum Margin Floor %): {minMarginPercent}%
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={minMarginPercent}
                onChange={(e) => setMinMarginPercent(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Right Output: Breakdown & Margin Floor Analysis */}
        <div className="lg:col-span-6 space-y-4">
          {result && (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Kết Quả Giải Quyết Chiết Khấu Đa Tầng</span>
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                  result.isMarginBreached
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                }`}>
                  Tổng Chiết Khấu: -{result.totalDiscountPercent}%
                </span>
              </div>

              {/* Breakdown List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Các Tầng Chiết Khấu Được Áp Dụng:</span>
                <div className="space-y-1.5">
                  {result.breakdownDetails.map((b: string, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Tổng Tiền Chưa Giảm</span>
                  <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    {result.originalTotal.toLocaleString('vi-VN')} VND
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Tổng Tiền Chiết Khấu</span>
                  <div className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                    -{result.discountAmount.toLocaleString('vi-VN')} VND
                  </div>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 space-y-0.5">
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 uppercase font-semibold">Giá Bán Thực Tế / SP</span>
                  <div className="text-xs font-mono font-bold text-purple-900 dark:text-purple-100">
                    {Math.round(result.effectiveUnitPrice).toLocaleString('vi-VN')} VND
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-0.5">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-semibold">Thành Tiền Sau Giảm</span>
                  <div className="text-xs font-mono font-bold text-emerald-900 dark:text-emerald-100">
                    {result.discountedTotal.toLocaleString('vi-VN')} VND
                  </div>
                </div>
              </div>

              {/* Margin & Governance Gate Status */}
              <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                result.isMarginBreached
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-1.5">
                    {result.isMarginBreached ? (
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>Biên Lợi Nhuận Đơn Hàng (Actual Margin):</span>
                  </div>
                  <span className="font-mono text-sm">{result.actualMarginPercent.toFixed(1)}%</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {result.isMarginBreached
                    ? `Mức giảm giá làm tỷ suất lợi nhuận rơi xuống ${result.actualMarginPercent.toFixed(1)}% (thấp hơn sàn ${minMarginPercent}%). Khi tạo SO tại M13, đơn sẽ tự động chuyển sang trạng thái PENDING_DIRECTOR_APPROVAL.`
                    : `Biên lợi nhuận ${result.actualMarginPercent.toFixed(1)}% đạt chuẩn an toàn doanh nghiệp (≥ ${minMarginPercent}%). Đơn hàng đủ điều kiện tự động duyệt nhanh (Auto-Approve).`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
