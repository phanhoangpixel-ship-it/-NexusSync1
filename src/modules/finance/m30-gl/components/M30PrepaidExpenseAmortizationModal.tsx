import React, { useState } from 'react';
import { Layers, Calendar, DollarSign, CheckCircle2, X, Plus, Play, RefreshCw, AlertCircle, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currencyFormatter';

interface M30PrepaidExpenseAmortizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M30PrepaidExpenseAmortizationModal: React.FC<M30PrepaidExpenseAmortizationModalProps> = ({
  isOpen,
  onClose,
  onNotify
}) => {
  if (!isOpen) return null;

  const [prepaidList, setPrepaidList] = useState([
    {
      id: 'PPE-2026-001',
      name: 'Chi phí thuê văn phòng Tòa nhà Nexus Tower (24 tháng)',
      costCenter: 'CC-ADMIN (Khối Văn Phòng Tổng)',
      debitAccount: '6422 (Chi phí quản lý doanh nghiệp)',
      totalAmount: 480000000,
      amortizedAmount: 160000000,
      monthlyAmount: 20000000,
      totalMonths: 24,
      remainingMonths: 16,
      status: 'ACTIVE',
      lastPostedPeriod: '2026-08'
    },
    {
      id: 'PPE-2026-002',
      name: 'Phần mềm bản quyền bảo mật Cloud & Firewall Nexus Enterprise (12 tháng)',
      costCenter: 'CC-IT (Khối Kỹ Thuật Số)',
      debitAccount: '6428 (Chi phí bằng tiền khác)',
      totalAmount: 180000000,
      amortizedAmount: 90000000,
      monthlyAmount: 15000000,
      totalMonths: 12,
      remainingMonths: 6,
      status: 'ACTIVE',
      lastPostedPeriod: '2026-08'
    },
    {
      id: 'PPE-2026-003',
      name: 'Chi phí bảo dưỡng nâng cấp dây chuyền gắn chip SMT Nhà máy (36 tháng)',
      costCenter: 'CC-FACTORY (Nhà Máy Sản Xuất)',
      debitAccount: '6277 (Chi phí dịch vụ mua ngoài)',
      totalAmount: 360000000,
      amortizedAmount: 120000000,
      monthlyAmount: 10000000,
      totalMonths: 36,
      remainingMonths: 24,
      status: 'ACTIVE',
      lastPostedPeriod: '2026-08'
    }
  ]);

  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [targetPeriod, setTargetPeriod] = useState<string>('2026-09');

  const totalOriginal = prepaidList.reduce((s, i) => s + i.totalAmount, 0);
  const totalAmortized = prepaidList.reduce((s, i) => s + i.amortizedAmount, 0);
  const totalMonthly = prepaidList.reduce((s, i) => s + i.monthlyAmount, 0);
  const totalRemaining = totalOriginal - totalAmortized;

  const handlePostMonthlyAmortization = () => {
    setIsPosting(true);
    setTimeout(() => {
      setPrepaidList(prev => prev.map(item => ({
        ...item,
        amortizedAmount: item.amortizedAmount + item.monthlyAmount,
        remainingMonths: Math.max(0, item.remainingMonths - 1),
        lastPostedPeriod: targetPeriod
      })));
      setIsPosting(false);
      onNotify('success', 'Đã Hạch Toán Phân Bổ TK 242', `Đã sinh bút toán phân bổ tự động tổng cộng ${formatCurrency(totalMonthly)} cho kỳ ${targetPeriod} vào Sổ Cái.`);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Quản Lý & Phân Bổ Chi Phí Trả Trước Dài Hạn (TK 242)</h3>
              <p className="text-[11px] text-slate-300">Lịch trình phân bổ đa kỳ tự động • Chuẩn mực kế toán VAS Thông tư 200</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* KPI Metrics */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Tổng Nguyên Giá (TK 242)</span>
              <span className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(totalOriginal)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Đã Phân Bổ Lũy Kế</span>
              <span className="text-sm font-mono tabular-nums font-bold text-emerald-800 dark:text-emerald-300">
                {formatCurrency(totalAmortized)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase block">Giá Trị Còn Lại</span>
              <span className="text-sm font-mono tabular-nums font-bold text-blue-800 dark:text-blue-300">
                {formatCurrency(totalRemaining)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase block">Mức Phân Bổ / Tháng</span>
              <span className="text-sm font-mono tabular-nums font-bold text-teal-800 dark:text-teal-300">
                {formatCurrency(totalMonthly)}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5">Mã & Tên Chi Phí Trả Trước</th>
                  <th className="p-2.5">Tài Khoản Chi Phí Nhận</th>
                  <th className="p-2.5 text-right">Nguyên Giá</th>
                  <th className="p-2.5 text-right">Đã Phân Bổ</th>
                  <th className="p-2.5 text-right">Hàng Tháng</th>
                  <th className="p-2.5 text-center">Thời Hạn</th>
                  <th className="p-2.5 text-center">Kỳ Gần Nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {prepaidList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5">
                      <div className="font-mono text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">{item.id}</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{item.name}</div>
                      <div className="text-[10px] text-slate-500">{item.costCenter}</div>
                    </td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.debitAccount}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-mono tabular-nums font-semibold">{formatCurrency(item.totalAmount)}</td>
                    <td className="p-2.5 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(item.amortizedAmount)}</td>
                    <td className="p-2.5 text-right font-mono tabular-nums font-bold text-teal-600 dark:text-teal-400">{formatCurrency(item.monthlyAmount)}</td>
                    <td className="p-2.5 text-center font-mono text-slate-600 dark:text-slate-400">
                      {item.totalMonths - item.remainingMonths}/{item.totalMonths} thg
                    </td>
                    <td className="p-2.5 text-center font-mono text-xs">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        {item.lastPostedPeriod}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer with Execute Button */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Kỳ Phân Bổ Tiếp Theo:</span>
            <input
              type="month"
              value={targetPeriod}
              onChange={(e) => setTargetPeriod(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-mono font-bold text-xs"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 text-xs transition-colors"
            >
              Đóng
            </button>
            
            <button
              type="button"
              disabled={isPosting}
              onClick={handlePostMonthlyAmortization}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-500/20 disabled:opacity-50 transition-all"
            >
              {isPosting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Chạy Phân Bổ Tự Động & Hạch Toán Sổ Cái
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
