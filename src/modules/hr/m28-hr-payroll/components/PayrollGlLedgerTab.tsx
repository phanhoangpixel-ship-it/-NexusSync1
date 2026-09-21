import React from 'react';
import {
  DollarSign,
  Calculator,
  ShieldCheck,
  FileSpreadsheet,
  FileDown,
  Building2,
  CheckCircle2,
  Lock,
  Sparkles,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { downloadPayslipPdf } from '../../../../utils/pdfExporter';

interface PayrollGlLedgerTabProps {
  payrolls: any[];
  employees: any[];
  loading: boolean;
  onOpenCalculatePayroll: (payroll?: any) => void;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const PayrollGlLedgerTab: React.FC<PayrollGlLedgerTabProps> = ({
  payrolls,
  employees,
  loading,
  onOpenCalculatePayroll,
  onRefresh,
  onNotify,
}) => {
  const handleDownloadAllPayslips = () => {
    if (!employees || employees.length === 0) return;
    try {
      employees.forEach((emp) => downloadPayslipPdf(emp));
      onNotify('success', 'Xuất Hàng Loạt Phiếu Lương PDF', `Đã tạo và tải về phiếu lương của ${employees.length} nhân sự.`);
    } catch (err: any) {
      onNotify('danger', 'Lỗi Xuất PDF', err.message);
    }
  };

  const getStatusBadge = (status: string, postedGL?: boolean) => {
    return (
      <div className="flex items-center gap-1.5 justify-center">
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {status === 'APPROVED' ? 'Đã duyệt' : status === 'PAID' ? 'Đã chi trả' : status}
        </span>
        {postedGL && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            GL POSTED
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner GL Accounting Integration */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-medium text-blue-200 border border-white/10">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Chuẩn Mực Kế Toán VAS 334 / 642 / 622 / 338</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight">Hạch Toán Lương &amp; Chi Phí Nhân Công Trực Tiếp</h3>
            <p className="text-xs text-blue-200/90 leading-relaxed">
              Tự động phân bổ quỹ lương Gross vào TK 642 (Quản lý) &amp; TK 622 (Nhân công trực tiếp SX), khấu trừ BHXH 10.5% (TK 338) &amp; Thuế TNCN (TK 3335), ghi nhận khoản phải trả người lao động TK 334 cân bằng 100%.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadAllPayslips}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-xs border border-white/20 transition-all flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              <span>Tải Hàng Loạt PDF</span>
            </button>
            <button
              onClick={() => onOpenCalculatePayroll()}
              className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Thẩm Định &amp; Tính Lương 360°</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payroll Periods Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Lịch Sử Các Kỳ Bảng Lương Đã Chốt &amp; Định Khoản GL</h4>
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Kỳ bảng lương</th>
                <th className="py-3 px-4 text-center">Nhân sự</th>
                <th className="py-3 px-4 text-right">Tổng lương Gross</th>
                <th className="py-3 px-4 text-right">Trích BHXH (10.5%)</th>
                <th className="py-3 px-4 text-right">Thuế TNCN (PIT)</th>
                <th className="py-3 px-4 text-right">Lương Net thực lĩnh</th>
                <th className="py-3 px-4 text-center">Trạng thái &amp; GL</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {payrolls.map((pr) => (
                <tr key={pr.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    <div>{pr.name || `Bảng lương Tháng ${pr.month}/${pr.year}`}</div>
                    <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{pr.periodCode}</span>
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    {pr.totalEmployees || employees.length} người
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {(pr.totalGross || 94500000).toLocaleString('vi-VN')} ₫
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-amber-600">
                    -{(pr.totalInsurance || 9922500).toLocaleString('vi-VN')} ₫
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-rose-600">
                    -{(pr.totalTax || 4250000).toLocaleString('vi-VN')} ₫
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-600 text-sm">
                    {(pr.totalNet || 80327500).toLocaleString('vi-VN')} ₫
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {getStatusBadge(pr.status, pr.postedGL)}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onOpenCalculatePayroll(pr)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 ml-auto transition-colors"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Xem GL 360°</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
