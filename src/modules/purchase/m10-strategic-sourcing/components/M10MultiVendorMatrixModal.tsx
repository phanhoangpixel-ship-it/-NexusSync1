import React, { useState } from 'react';
import { Scale, CheckCircle2, Award, Building, DollarSign, Clock, ShieldCheck, X, ArrowRight, Zap, Check, AlertTriangle, Sparkles, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currencyFormatter';

interface M10MultiVendorMatrixModalProps {
  isOpen: boolean;
  rfqId: string;
  onClose: () => void;
  onAwardVendor: (vendor: any) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M10MultiVendorMatrixModal: React.FC<M10MultiVendorMatrixModalProps> = ({
  isOpen,
  rfqId,
  onClose,
  onAwardVendor,
  onNotify
}) => {
  if (!isOpen) return null;

  const [vendorBids] = useState([
    {
      id: 'BID-001',
      vendorCode: 'SUP-001',
      vendorName: 'Công ty Cổ phần Vật liệu Bán dẫn Toàn Cầu',
      unitPrice: 185000,
      totalAmount: 925000000,
      leadTimeDays: 7,
      paymentTerms: 'Trả chậm 30 ngày (Net 30)',
      warrantyMonths: 24,
      qualityScore: 96,
      deliveryScore: 94,
      commercialScore: 92,
      totalWeightedScore: 94.2,
      isBpaCompliant: true,
      priceVarianceVsTarget: -5.2, // Cheaper than target by 5.2%
      isBestPrice: true,
      isBestOverall: true,
      origin: 'Nhật Bản (Chính Hãng)'
    },
    {
      id: 'BID-002',
      vendorCode: 'SUP-002',
      vendorName: 'Tập đoàn Phụ gia & Vi mạch Việt Sơn',
      unitPrice: 192000,
      totalAmount: 960000000,
      leadTimeDays: 5,
      paymentTerms: 'Trả chậm 45 ngày (Net 45)',
      warrantyMonths: 18,
      qualityScore: 92,
      deliveryScore: 98,
      commercialScore: 88,
      totalWeightedScore: 91.8,
      isBpaCompliant: true,
      priceVarianceVsTarget: -1.5,
      isBestPrice: false,
      isBestOverall: false,
      origin: 'Việt Nam (Lắp ráp tại chỗ)'
    },
    {
      id: 'BID-003',
      vendorCode: 'SUP-003',
      vendorName: 'Công ty TNHH Thiết bị Công nghệ Asia-Pacific',
      unitPrice: 205000,
      totalAmount: 1025000000,
      leadTimeDays: 14,
      paymentTerms: 'Đặt cọc 20% + 80% khi giao',
      warrantyMonths: 12,
      qualityScore: 88,
      deliveryScore: 82,
      commercialScore: 80,
      totalWeightedScore: 83.6,
      isBpaCompliant: false,
      priceVarianceVsTarget: +5.1,
      isBestPrice: false,
      isBestOverall: false,
      origin: 'Đài Loan'
    }
  ]);

  const [selectedBid, setSelectedBid] = useState<any>(vendorBids[0]);

  const handleConfirmAward = () => {
    if (!selectedBid) return;
    onAwardVendor(selectedBid);
    onNotify('success', 'Trao Thầu Thành Công', `Đã chọn ${selectedBid.vendorName} cho gói thầu ${rfqId}. Đang tự động tạo Đơn Đặt Hàng Mua (PO).`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                Ma Trận So Sánh Đa Báo Giá Nhà Cung Cấp (Multi-Vendor Grid)
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Gói {rfqId}
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">Chấm điểm đa tiêu chí: Đơn giá, Lead Time, Điều khoản công nợ, KCS và Khung giá BPA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Comparison Cards Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vendorBids.map((bid) => {
              const isSelected = selectedBid?.id === bid.id;
              return (
                <div
                  key={bid.id}
                  onClick={() => setSelectedBid(bid)}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-md ring-2 ring-indigo-500/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="font-mono text-[10px] font-bold text-slate-500">{bid.vendorCode}</span>
                    <div className="flex items-center gap-1">
                      {bid.isBestPrice && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                          Giá Tốt Nhất
                        </span>
                      )}
                      {bid.isBestOverall && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 flex items-center gap-1">
                          <Award className="w-2.5 h-2.5" /> Top 1 Đánh Giá
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vendor Info */}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug">{bid.vendorName}</h4>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Xuất xứ: {bid.origin}</span>
                  </div>

                  {/* Price & Variance */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Tổng Giá Trị Chào Thầu</span>
                    <span className="text-base font-mono tabular-nums font-extrabold text-indigo-600 dark:text-indigo-400 block">
                      {formatCurrency(bid.totalAmount)}
                    </span>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Đơn giá: <strong>{formatCurrency(bid.unitPrice)}</strong></span>
                      <span className={`font-bold ${bid.priceVarianceVsTarget <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {bid.priceVarianceVsTarget <= 0 ? `${bid.priceVarianceVsTarget}% (Rẻ hơn)` : `+${bid.priceVarianceVsTarget}% (Cao hơn)`}
                      </span>
                    </div>
                  </div>

                  {/* Terms & Criteria */}
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-500" /> Thời gian giao:</span>
                      <strong className="font-mono">{bid.leadTimeDays} ngày</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Bảo hành:</span>
                      <strong className="font-mono">{bid.warrantyMonths} tháng</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500 flex items-center gap-1">Điều khoản:</span>
                      <strong className="text-right text-[10px] truncate max-w-[140px]">{bid.paymentTerms}</strong>
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Điểm tổng hợp:</span>
                    <span className="font-mono font-extrabold text-sm text-indigo-700 dark:text-indigo-300">
                      {bid.totalWeightedScore}/100
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-600 dark:text-slate-300">
            Đang chọn trao thầu cho: <strong className="text-indigo-600 dark:text-indigo-400">{selectedBid?.vendorName}</strong> ({formatCurrency(selectedBid?.totalAmount || 0)})
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmAward}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-300" />
              Xác Nhận Trao Thầu & Lập PO Mua Hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
