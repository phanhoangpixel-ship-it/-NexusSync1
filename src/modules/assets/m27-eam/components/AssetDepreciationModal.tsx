import React, { useState } from 'react';
import { X, DollarSign, ShieldCheck, Calculator, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { CurrencyInput } from '../../../../components/common/CurrencyInput';

interface AssetDepreciationModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: any;
  allAssets: any[];
  onSuccess: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const AssetDepreciationModal: React.FC<AssetDepreciationModalProps> = ({
  isOpen,
  onClose,
  asset,
  allAssets,
  onSuccess,
  onNotify,
}) => {
  const [mode, setMode] = useState<'single' | 'batch'>(asset ? 'single' : 'batch');
  const [selectedAssetId, setSelectedAssetId] = useState<number>(asset?.id || allAssets[0]?.id || 1);
  const [period, setPeriod] = useState<string>(new Date().toISOString().slice(0, 7)); // e.g. "2026-09"
  
  // Calculate recommended monthly straight-line depreciation for single asset
  const currentAsset = allAssets.find((a) => a.id === selectedAssetId) || asset;
  const initialCost = Number(currentAsset?.purchaseCost || 0);
  const currentBookVal = Number(currentAsset?.bookValue ?? initialCost);
  const usefulLife = Number(currentAsset?.usefulLifeMonths || 60);
  const calculatedMonthly = Math.round(initialCost / usefulLife) || 5000000;

  const [depreciationAmount, setDepreciationAmount] = useState<number>(calculatedMonthly);
  const [loading, setLoading] = useState(false);

  // Update amount when selected asset changes
  const handleAssetChange = (id: number) => {
    setSelectedAssetId(id);
    const ast = allAssets.find((a) => a.id === id);
    if (ast) {
      const cost = Number(ast.purchaseCost || 0);
      const life = Number(ast.usefulLifeMonths || 60);
      setDepreciationAmount(Math.round(cost / life) || 5000000);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        period,
      };

      if (mode === 'single') {
        payload.assetId = selectedAssetId;
        payload.depreciationAmount = Number(depreciationAmount);
      } else {
        payload.batch = true;
      }

      const res = await fetch('/api/eam/assets/depreciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi hạch toán khấu hao TSCĐ');
      }

      const result = await res.json();
      onNotify(
        'success',
        'Khấu hao hoàn tất (M30 GL Delegate)',
        result.message || `Đã hạch toán khấu hao ${result.totalDepreciated?.toLocaleString('vi-VN')} ₫ vào sổ cái kế toán.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      onNotify('danger', 'Hạch toán thất bại', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Khấu Hao Tài Sản Cố Định (EAM / M30)</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> M30 GL Delegate
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Trích khấu hao định kỳ &amp; ghi nhận sổ cái tổng hợp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'single'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Trích Khấu Hao Đơn Lẻ (Theo Máy)
            </button>
            <button
              type="button"
              onClick={() => setMode('batch')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'batch'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Trích Hàng Loạt (Toàn Danh Mục)
            </button>
          </div>

          {/* Period Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kỳ Kế Toán Trích Khấu Hao (Tháng / Năm) <span className="text-rose-500">*</span>
            </label>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-medium"
              required
            />
          </div>

          {/* Single Mode: Asset Selector & Amount */}
          {mode === 'single' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn Thiết Bị Cần Khấu Hao <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => handleAssetChange(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-medium"
                >
                  {allAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name} (Giá trị còn lại: {Number(a.bookValue || 0).toLocaleString('vi-VN')} ₫)
                    </option>
                  ))}
                </select>
              </div>

              {/* Asset Financial Summary */}
              {currentAsset && (
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nguyên Giá (TK 211):</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">
                      {Number(currentAsset.purchaseCost || 0).toLocaleString('vi-VN')} ₫
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Giá Trị Sổ Sách:</span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                      {currentBookVal.toLocaleString('vi-VN')} ₫
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Thời Gian SD:</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">
                      {usefulLife} tháng
                    </strong>
                  </div>
                </div>
              )}

              <div>
                <CurrencyInput
                  label="Số Tiền Khấu Hao Kỳ Này (₫) *"
                  value={depreciationAmount}
                  onChange={(val) => setDepreciationAmount(val)}
                  placeholder="5.000.000"
                  required
                  showBadge={true}
                  showPresets={true}
                />
              </div>
            </>
          )}

          {/* Batch Mode Notice */}
          {mode === 'batch' && (
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Tự Động Tính Toán Khấu Hao Cho Toàn Bộ {allAssets.length} Thiết Bị
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                Hệ thống áp dụng phương pháp khấu hao đường thẳng (Straight-Line) theo thời gian sử dụng hữu ích của từng máy.
                Toàn bộ bút toán sẽ được chuyển trực tiếp sang M30 Sổ cái tổng hợp với cặp tài khoản:
              </p>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
                Nợ TK 627 (Chi phí SXC khấu hao) / Có TK 214 (Hao mòn TSCĐ)
              </div>
            </div>
          )}

          {/* GL Accounting Preview */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-white block">Định Khoản Kế Toán Sổ Cái M30:</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Tài khoản Nợ:</span>
                <strong className="font-mono text-blue-600 dark:text-blue-400">TK 627</strong> — Chi phí sản xuất chung
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Tài khoản Có:</span>
                <strong className="font-mono text-emerald-600 dark:text-emerald-400">TK 214</strong> — Hao mòn TSCĐ lũy kế
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Calculator className="w-4 h-4" />
              <span>{loading ? 'Đang hạch toán M30...' : 'Xác Nhận Trích Khấu Hao (M30)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
