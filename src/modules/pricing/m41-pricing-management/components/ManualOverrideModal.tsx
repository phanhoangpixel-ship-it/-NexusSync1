import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, CheckCircle2, DollarSign, X } from 'lucide-react';
import { ProductPriceItem } from '../../../../types/pricingManagement';
import { calculateMarkupPrice, calculateMarginPrice, calculateActualMargin, calculateActualMarkup, checkMinimumMargin } from '../utils/pricingMath';
import { formatVND } from '../../../../lib/currency';
import { CurrencyInputField } from '../../../../components/common/CurrencyInputField';

interface ManualOverrideModalProps {
  item: ProductPriceItem | null;
  onClose: () => void;
  onConfirmOverride: (params: {
    productId: string;
    priceListId: string;
    newPrice: number;
    reason: string;
    changedBy: string;
    approvedBy: string;
  }) => void;
}

export const ManualOverrideModal: React.FC<ManualOverrideModalProps> = ({
  item,
  onClose,
  onConfirmOverride
}) => {
  if (!item) return null;

  const [newPrice, setNewPrice] = useState<number>(item.finalPrice);
  const [reason, setReason] = useState('');
  const [changedBy, setChangedBy] = useState('Nguyễn Văn Kinh (Pricing Manager)');
  const [approvedBy, setApprovedBy] = useState('Trần Văn Giám (CFO)');

  const hasValidCost = typeof item.costBasis === 'number' && item.costBasis > 0;
  let newMargin = 0;
  let marginCheck: { isBelowMin: boolean; actualMargin: number; difference: number; warningMessage?: string } = {
    isBelowMin: true,
    actualMargin: 0,
    difference: item.minMarginPercent || 15,
    warningMessage: 'Thiếu giá vốn hợp lệ (costBasis) từ Costing Engine'
  };

  if (hasValidCost && newPrice > 0) {
    try {
      newMargin = calculateActualMargin(item.costBasis, newPrice);
      marginCheck = checkMinimumMargin(item.costBasis, newPrice, item.minMarginPercent || 15);
    } catch {
      newMargin = 0;
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !hasValidCost) return;

    onConfirmOverride({
      productId: item.productId,
      priceListId: item.priceListId,
      newPrice: Number(newPrice),
      reason,
      changedBy,
      approvedBy
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
        <div className="flex justify-between items-start mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded">
              GOVERNANCE CONTROL
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Ghi Đè Giá Thủ Công (Manual Price Override)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Target product info */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-white text-sm">{item.productName}</div>
            <div className="text-slate-500 dark:text-slate-400 font-mono">
              SKU: {item.sku} | Bảng giá: {item.priceListName} ({item.priceListCode})
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              <span>Giá vốn gốc (Costing Engine): <strong className="font-mono">{formatVND(item.costBasis)}</strong></span>
              <span>Giá niêm yết hiện tại: <strong className="font-mono text-indigo-700 dark:text-indigo-300">{formatVND(item.finalPrice)}</strong></span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Giá Ghi Đè Mới (Selling Price Override) *</label>
            <CurrencyInputField
              required
              value={newPrice}
              onChange={setNewPrice}
              placeholder="VD: 1.500.000"
            />
          </div>

          {/* Margin impact assessment */}
          <div className={`p-3 rounded-xl border flex justify-between items-center ${
            marginCheck.isBelowMin
              ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-200'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-200'
          }`}>
            <div>
              <span className="font-semibold block">Biên Lợi Nhuận Dự Kiến:</span>
              <span className="font-mono text-base font-bold">{newMargin.toFixed(2)}%</span>
            </div>
            <span className="text-[11px] font-bold px-2 py-1 rounded bg-white/80 dark:bg-slate-800 border dark:border-slate-700">
              {marginCheck.isBelowMin ? `CẢNH BÁO: Dưới sàn ${item.minMarginPercent}%` : 'ĐẠT CHUẨN'}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lý Do Ghi Đè (Bắt Buộc Kiểm Toán) *</label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Cạnh tranh giá đấu thầu dự án phòng máy trường học, được phê duyệt đặc cách..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Người Thực Hiện (Maker)</label>
              <input
                type="text"
                value={changedBy}
                onChange={(e) => setChangedBy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Người Duyệt Đặc Cách (Checker)</label>
              <input
                type="text"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Lưu & Ghi Nhận Nhật Ký Kiểm Toán
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

