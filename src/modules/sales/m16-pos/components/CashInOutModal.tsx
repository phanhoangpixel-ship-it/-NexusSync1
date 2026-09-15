import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatVNDCurrency } from '../../../../utils/currencyFormatter';

interface CashInOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift: any;
  onSubmit: (params: {
    type: 'CASH_IN' | 'SAFE_DROP';
    amount: number;
    reason: string;
  }) => void;
}

export const CashInOutModal: React.FC<CashInOutModalProps> = ({
  isOpen,
  onClose,
  activeShift,
  onSubmit
}) => {
  const [movementType, setMovementType] = useState<'CASH_IN' | 'SAFE_DROP'>('CASH_IN');
  const [amountInput, setAmountInput] = useState<string>('500000');
  const [reasonInput, setReasonInput] = useState<string>('');

  if (!isOpen || !activeShift) return null;

  const quickAmounts = [100000, 200000, 500000, 1000000, 2000000, 5000000];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(amountInput);
    if (isNaN(amount) || amount <= 0) return;
    if (!reasonInput.trim()) return;

    onSubmit({
      type: movementType,
      amount,
      reason: reasonInput.trim()
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
              movementType === 'CASH_IN' ? 'bg-emerald-600' : 'bg-amber-600'
            }`}>
              {movementType === 'CASH_IN' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold">Nộp / Rút Tiền Két Giữa Ca (Cash In/Out)</h3>
              <p className="text-[11px] text-slate-400">
                Ca #{activeShift.shiftNo ?? activeShift.id} • Két #{activeShift.cashDrawerId ?? 1}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Movement Type Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setMovementType('CASH_IN');
                if (!reasonInput) setReasonInput('Nạp thêm tiền lẻ đầu/giữa ca (Float Top-up)');
              }}
              className={`min-h-[44px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                movementType === 'CASH_IN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Nộp tiền két (Cash In)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMovementType('SAFE_DROP');
                if (!reasonInput) setReasonInput('Rút tiền mặt cất vào két an toàn (Safe Drop)');
              }}
              className={`min-h-[44px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                movementType === 'SAFE_DROP'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Rút tiền két (Safe Drop)</span>
            </button>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Số tiền giao dịch (VND):
            </label>
            <div className="relative">
              <input
                type="number"
                value={amountInput}
                onChange={e => setAmountInput(e.target.value)}
                placeholder="Nhập số tiền..."
                className="w-full pl-3 pr-16 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl font-mono font-bold text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 tabular-nums"
                required
              />
              <span className="absolute right-3 top-2 text-xs font-bold font-mono text-slate-400">
                VND
              </span>
            </div>

            {/* Quick amount presets */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountInput(String(amt))}
                  className="py-1 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {formatVNDCurrency(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Reason input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Lý do / Mục đích (bắt buộc):</span>
              <span className="text-[10px] text-rose-500">* Bắt buộc đối soát</span>
            </label>
            <textarea
              rows={2}
              value={reasonInput}
              onChange={e => setReasonInput(e.target.value)}
              placeholder="VD: Nạp thêm 500k tiền lẻ 10k/20k hoặc Rút 5tr về két an toàn do đầy két..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {/* Notice */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              Giao dịch này sẽ được ghi nhận trực tiếp vào sổ nhật ký két và tự động cập nhật số dư kỳ vọng <span className="font-mono font-bold">reconstructedExpectedCash</span> của ca làm việc.
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy bỏ (Esc)
            </button>
            <button
              type="submit"
              disabled={!amountInput || Number(amountInput) <= 0 || !reasonInput.trim()}
              className={`min-h-[44px] flex-1 py-2 px-4 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer ${
                movementType === 'CASH_IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Xác nhận {movementType === 'CASH_IN' ? 'Nộp Tiền' : 'Rút Tiền'} ({formatVNDCurrency(Number(amountInput) || 0)})
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
