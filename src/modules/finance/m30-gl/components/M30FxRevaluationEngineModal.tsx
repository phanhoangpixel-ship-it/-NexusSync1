import React, { useState } from 'react';
import { DollarSign, CheckCircle2, RefreshCw, X, TrendingUp, TrendingDown, Scale, ShieldCheck, Play, ArrowRight, Building } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currencyFormatter';

interface M30FxRevaluationEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostFxEntry: (fxData: any) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M30FxRevaluationEngineModal: React.FC<M30FxRevaluationEngineModalProps> = ({
  isOpen,
  onClose,
  onPostFxEntry,
  onNotify
}) => {
  if (!isOpen) return null;

  const [period, setPeriod] = useState<string>('2026-09');
  const [bankRateUsd, setBankRateUsd] = useState<number>(25420); // Vietcombank closing rate
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  const [fxAccounts, setFxAccounts] = useState([
    {
      accountCode: '1122.USD',
      accountName: 'Tiền gửi ngân hàng bằng USD (Vietcombank USD)',
      foreignCurrencyBalance: 150000, // 150,000 USD
      currency: 'USD',
      bookRate: 25100, // Book exchange rate
      currentBookValue: 3765000000,
      revaluedValue: 3813000000, // 150,000 * 25,420
      fxGainLoss: 48000000, // +48,000,000 (Lãi tỷ giá TK 515)
      targetAccount: '515 (Doanh thu tài chính)'
    },
    {
      accountCode: '1312.USD',
      accountName: 'Phải thu khách hàng quốc tế bằng USD',
      foreignCurrencyBalance: 85000, // 85,000 USD
      currency: 'USD',
      bookRate: 25250,
      currentBookValue: 2146250000,
      revaluedValue: 2160700000,
      fxGainLoss: 14450000, // +14,450,000 (Lãi tỷ giá)
      targetAccount: '515 (Doanh thu tài chính)'
    },
    {
      accountCode: '3312.USD',
      accountName: 'Phải trả người bán nước ngoài bằng USD (Linh kiện IC)',
      foreignCurrencyBalance: 120000, // 120,000 USD
      currency: 'USD',
      bookRate: 25150,
      currentBookValue: 3018000000,
      revaluedValue: 3050400000,
      fxGainLoss: -32400000, // -32,400,000 (Lỗ tỷ giá TK 635 do nợ phải trả tăng)
      targetAccount: '635 (Chi phí tài chính)'
    }
  ]);

  const totalGain = fxAccounts.filter(a => a.fxGainLoss > 0).reduce((s, a) => s + a.fxGainLoss, 0);
  const totalLoss = Math.abs(fxAccounts.filter(a => a.fxGainLoss < 0).reduce((s, a) => s + a.fxGainLoss, 0));
  const netFxProfit = totalGain - totalLoss;

  const handlePostRevaluation = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      setIsEvaluating(false);
      onPostFxEntry({
        period,
        bankRateUsd,
        totalGain,
        totalLoss,
        netFxProfit
      });
      onNotify('success', 'Đã Đánh Giá Lại Tỷ Giá Ngoại Tệ', `Đã sinh bút toán chênh lệch tỷ giá cuối kỳ ${period}: Lãi ${formatCurrency(totalGain)} (TK 515), Lỗ ${formatCurrency(totalLoss)} (TK 635).`);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                Động Cơ Đánh Giá Chênh Lệch Tỷ Giá Ngoại Tệ Cuối Kỳ (FX Revaluation)
              </h3>
              <p className="text-[11px] text-slate-300">Chuẩn mực kế toán VAS 10 & Thông tư 200/2014/TT-BTC • TK 413, 515, 635</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Rate Parameters Bar */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kỳ Khóa Sổ</label>
                <input
                  type="month"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tỷ Giá Mua/Bán Chốt VCB (USD/VND)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={bankRateUsd}
                    onChange={(e) => setBankRateUsd(Number(e.target.value))}
                    className="w-28 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400"
                  />
                  <span className="font-semibold text-slate-500">VNĐ/USD</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-right">
              <div>
                <span className="text-[10px] text-slate-500 block">Lãi Tỷ Giá (TK 515):</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">+{formatCurrency(totalGain)}</span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
              <div>
                <span className="text-[10px] text-slate-500 block">Lỗ Tỷ Giá (TK 635):</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">-{formatCurrency(totalLoss)}</span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
              <div>
                <span className="text-[10px] text-slate-500 block">Lãi Thuần Tỷ Giá:</span>
                <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">+{formatCurrency(netFxProfit)}</span>
              </div>
            </div>
          </div>

          {/* Accounts Revaluation Table */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5">Mã & Tên Tài Khoản Gốc</th>
                  <th className="p-2.5 text-right">Số Dư Nguyên Tệ</th>
                  <th className="p-2.5 text-right">Tỷ Giá Sổ</th>
                  <th className="p-2.5 text-right">Giá Trị Sổ Sách</th>
                  <th className="p-2.5 text-right">Giá Trị Sau Đánh Giá</th>
                  <th className="p-2.5 text-right">Chênh Lệch (VNĐ)</th>
                  <th className="p-2.5 text-center">Tài Khoản Kết Chuyển</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fxAccounts.map((acc) => (
                  <tr key={acc.accountCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5">
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{acc.accountCode}</div>
                      <div className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">{acc.accountName}</div>
                    </td>
                    <td className="p-2.5 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                      ${acc.foreignCurrencyBalance.toLocaleString('en-US')}
                    </td>
                    <td className="p-2.5 text-right font-mono tabular-nums text-slate-500">
                      {acc.bookRate.toLocaleString('vi-VN')}
                    </td>
                    <td className="p-2.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {formatCurrency(acc.currentBookValue)}
                    </td>
                    <td className="p-2.5 text-right font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(acc.revaluedValue)}
                    </td>
                    <td className="p-2.5 text-right font-mono tabular-nums font-extrabold">
                      <span className={acc.fxGainLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {acc.fxGainLoss >= 0 ? `+${formatCurrency(acc.fxGainLoss)}` : `-${formatCurrency(Math.abs(acc.fxGainLoss))}`}
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-mono text-[10px] font-bold">
                      <span className={`px-2 py-0.5 rounded-full ${acc.fxGainLoss >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 border border-emerald-300' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 border border-rose-300'}`}>
                        {acc.targetAccount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Tự động sinh bút toán đảo vào ngày đầu tiên của kỳ kế toán kế tiếp (Reversal Entry)
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
              disabled={isEvaluating}
              onClick={handlePostRevaluation}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              {isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Hạch Toán Đánh Giá Lại Vào Sổ Cái
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
