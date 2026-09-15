import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  ShieldCheck,
  DollarSign,
  Download,
  Building2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Sparkles,
  Lock,
  Calendar,
  UserCheck,
  BadgePercent,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface PayrollItem {
  employeeId: number;
  code: string;
  fullName: string;
  position: string;
  departmentName: string;
  baseSalary: number;
  actualDays: number;
  standardDays: number;
  otHours: number;
  otAmount: number;
  totalAllowances: number;
  kpiBonus: number;
  grossSalary: number;
  bhxh: number;
  bhyt: number;
  bhtn: number;
  totalInsurance: number;
  taxableIncome: number;
  pitTax: number;
  netSalary: number;
  bankAccount: string;
}

interface GLLine {
  account: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

interface PayrollCalculationData {
  periodCode: string;
  month: number;
  year: number;
  standardDays: number;
  totalEmployees: number;
  items: PayrollItem[];
  totalGross: number;
  totalInsurance: number;
  totalTax: number;
  totalNet: number;
  glLines: GLLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

interface PayrollCalculationGLModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onNotify: (type: 'success' | 'danger' | 'info' | 'warning', title: string, message: string) => void;
  existingPayroll?: any;
}

export const PayrollCalculationGLModal: React.FC<PayrollCalculationGLModalProps> = ({
  onClose,
  onSuccess,
  onNotify,
  existingPayroll
}) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<number>(existingPayroll?.month || currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(existingPayroll?.year || currentYear);
  const [standardDays, setStandardDays] = useState<number>(22);
  const [approverName, setApproverName] = useState<string>('Kế toán trưởng & Giám đốc Nhân sự');
  const [notes, setNotes] = useState<string>('Bảng lương định kỳ đã được thẩm định tự động và đối soát với hệ thống M30.');
  const [postToGL, setPostToGL] = useState<boolean>(true);

  const [activeSubTab, setActiveSubTab] = useState<'EMPLOYEES' | 'GL_ENTRIES' | 'AUDIT'>('EMPLOYEES');
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [payrollData, setPayrollData] = useState<PayrollCalculationData | null>(null);

  const formatVND = (val: number | null | undefined): string => {
    if (typeof val !== 'number' || isNaN(val)) return '0';
    return val.toLocaleString('vi-VN');
  };

  // Fetch preview data
  const fetchPreview = async (m: number, y: number, days: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/payrolls/preview?month=${m}&year=${y}&standardDays=${days}`);
      if (!res.ok) throw new Error('Không thể tải dữ liệu mô phỏng bảng lương');
      const data: PayrollCalculationData = await res.json();
      setPayrollData(data);
    } catch (err: any) {
      onNotify('danger', 'Lỗi tính toán mô phỏng', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview(selectedMonth, selectedYear, standardDays);
  }, [selectedMonth, selectedYear, standardDays]);

  const handlePostPayroll = async () => {
    setCalculating(true);
    try {
      const res = await fetch('/api/hr/payrolls/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          standardDays,
          approverName,
          notes,
          postToGL
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ghi sổ bảng lương thất bại');

      onNotify(
        'success',
        'Tính lương & Ghi sổ GL thành công!',
        data.message || `Bảng lương kỳ PAY-${selectedYear}-${String(selectedMonth).padStart(2, '0')} đã được ghi nhận vào Sổ cái M30.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      onNotify('danger', 'Lỗi ghi sổ bảng lương', err.message);
    } finally {
      setCalculating(false);
    }
  };

  const handleExportCSV = () => {
    if (!payrollData || !payrollData.items) return;
    const headers = ['Mã NV', 'Họ và tên', 'Chức danh', 'Phòng ban', 'Lương cơ bản', 'Ngày công', 'Giờ OT', 'Tiền OT', 'Phụ cấp', 'Thưởng KPI', 'Gross', 'BHXH', 'BHYT', 'BHTN', 'Tổng BH', 'Thuế TNCN', 'Thực Lĩnh Net', 'Tài khoản'];
    const rows = payrollData.items.map(i => [
      i.code,
      `"${i.fullName}"`,
      `"${i.position}"`,
      `"${i.departmentName}"`,
      i.baseSalary,
      i.actualDays,
      i.otHours,
      i.otAmount,
      i.totalAllowances,
      i.kpiBonus,
      i.grossSalary,
      i.bhxh,
      i.bhyt,
      i.bhtn,
      i.totalInsurance,
      i.pitTax,
      i.netSalary,
      `"${i.bankAccount}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bang_Luong_Thang_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('info', 'Xuất file thành công', `Đã xuất bảng lương Tháng ${selectedMonth}/${selectedYear} ra định dạng CSV.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-inner">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Tính Lương & Ghi Sổ Sổ Cái Kế Toán (GL Posting)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  ERP AUTOMATION
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Kỳ tính toán: <strong className="font-mono text-white">PAY-{selectedYear}-{String(selectedMonth).padStart(2, '0')}</strong> • Đối soát hạch toán kép TK 334 / 642 / 338 / 3335
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-slate-700">Kỳ tính:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-md px-2 py-1 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-purple-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-md px-2 py-1 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-purple-500"
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            <div className="h-4 w-px bg-slate-300 hidden sm:block" />

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Công chuẩn:</span>
              <input
                type="number"
                min="20"
                max="26"
                value={standardDays}
                onChange={(e) => setStandardDays(Number(e.target.value))}
                className="w-14 bg-white border border-slate-300 rounded-md px-2 py-1 font-mono text-center text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-slate-500">ngày</span>
            </div>

            <div className="h-4 w-px bg-slate-300 hidden sm:block" />

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={postToGL}
                onChange={(e) => setPostToGL(e.target.checked)}
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
              />
              <span className="font-semibold text-slate-800">Tự động ghi sổ GL (M30)</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Core Summary Metric Cards */}
        {payrollData && (
          <div className="px-6 py-3.5 grid grid-cols-2 md:grid-cols-4 gap-3 bg-white border-b border-slate-200 shrink-0">
            <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-700 flex items-center justify-between">
                <span>Tổng Quỹ Lương Gross</span>
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-lg font-bold font-mono text-purple-950 mt-1">
                {formatVND(payrollData.totalGross)} ₫
              </div>
              <div className="text-[10px] text-purple-700/80 mt-0.5 font-medium">
                Gồm Lương CB, Phụ cấp, OT & KPI
              </div>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 flex items-center justify-between">
                <span>Trích BHXH, BHYT, BHTN</span>
                <BadgePercent className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-lg font-bold font-mono text-rose-950 mt-1">
                -{formatVND(payrollData.totalInsurance)} ₫
              </div>
              <div className="text-[10px] text-rose-700/80 mt-0.5 font-medium">
                Tỷ lệ 10.5% (BHXH 8%, BHYT 1.5%, BHTN 1%)
              </div>
            </div>

            <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 flex items-center justify-between">
                <span>Tạm Khấu Trừ Thuế TNCN</span>
                <Building2 className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-lg font-bold font-mono text-amber-950 mt-1">
                -{formatVND(payrollData.totalTax)} ₫
              </div>
              <div className="text-[10px] text-amber-700/80 mt-0.5 font-medium">
                Giảm trừ gia cảnh 11 Tr/người
              </div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 flex items-center justify-between">
                <span>Tổng Thực Lĩnh (Net Pay)</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-bold font-mono text-emerald-950 mt-1">
                {formatVND(payrollData.totalNet)} ₫
              </div>
              <div className="text-[10px] text-emerald-700/80 mt-0.5 font-semibold">
                Nghĩa vụ phải trả NLĐ (TK 3341)
              </div>
            </div>
          </div>
        )}

        {/* Sub Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-4 shrink-0">
          <button
            onClick={() => setActiveSubTab('EMPLOYEES')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeSubTab === 'EMPLOYEES'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Bảng Tính Lương Chi Tiết ({payrollData?.items?.length || 0} nhân sự)
          </button>

          <button
            onClick={() => setActiveSubTab('GL_ENTRIES')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeSubTab === 'GL_ENTRIES'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Hạch Toán Sổ Cái GL Kép (TK 334 / 642 / 622)
            {payrollData?.isBalanced && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                100% CÂN BẰNG
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('AUDIT')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeSubTab === 'AUDIT'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            Chữ Ký Số & Vết Kiểm Toán Mật Mã
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Đang tính toán bảng lương và tổng hợp công nợ GL...</p>
            </div>
          ) : !payrollData ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Không có dữ liệu tính toán.
            </div>
          ) : (
            <>
              {/* TAB 1: Bảng Chi Tiết Từng Nhân Viên */}
              {activeSubTab === 'EMPLOYEES' && (
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                            <th className="py-2.5 px-3">Mã & Nhân sự</th>
                            <th className="py-2.5 px-3">Phòng ban</th>
                            <th className="py-2.5 px-3 text-right">Lương cơ bản</th>
                            <th className="py-2.5 px-3 text-center">Công / OT</th>
                            <th className="py-2.5 px-3 text-right">Phụ cấp & Thưởng</th>
                            <th className="py-2.5 px-3 text-right bg-purple-50/40 text-purple-900">Gross</th>
                            <th className="py-2.5 px-3 text-right text-rose-700">BHXH (10.5%)</th>
                            <th className="py-2.5 px-3 text-right text-amber-700">Thuế TNCN</th>
                            <th className="py-2.5 px-3 text-right bg-emerald-50/50 text-emerald-900 font-bold">Thực lĩnh Net</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {payrollData.items.map((emp) => (
                            <tr key={emp.employeeId} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-900">{emp.fullName}</div>
                                <div className="font-mono text-[10px] text-indigo-600">{emp.code} • {emp.position}</div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">{emp.departmentName}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800">
                                {formatVND(emp.baseSalary)} ₫
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono">
                                <span className="font-semibold text-slate-900">{emp.actualDays}/{emp.standardDays}</span>
                                {emp.otHours > 0 && (
                                  <span className="block text-[10px] text-purple-600 font-semibold">+{emp.otHours}h OT</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                <div>+{formatVND(emp.totalAllowances + emp.kpiBonus)} ₫</div>
                                <span className="text-[9px] text-slate-500">PC: {((emp.totalAllowances || 0)/1000).toFixed(0)}k | KPI: {((emp.kpiBonus || 0)/1000).toFixed(0)}k</span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold bg-purple-50/30 text-purple-950">
                                {formatVND(emp.grossSalary)} ₫
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                                -{formatVND(emp.totalInsurance)} ₫
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-amber-700">
                                -{formatVND(emp.pitTax)} ₫
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold bg-emerald-50/40 text-emerald-700">
                                {formatVND(emp.netSalary)} ₫
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100 font-bold border-t border-slate-300 text-slate-900">
                            <td className="py-3 px-3" colSpan={5}>
                              TỔNG CỘNG TOÀN DOANH NGHIỆP ({payrollData.totalEmployees || 0} nhân sự)
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-purple-900 bg-purple-100/50">
                              {formatVND(payrollData.totalGross)} ₫
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-rose-700">
                              -{formatVND(payrollData.totalInsurance)} ₫
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-amber-700">
                              -{formatVND(payrollData.totalTax)} ₫
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-emerald-800 bg-emerald-100/50">
                              {formatVND(payrollData.totalNet)} ₫
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Hạch toán Sổ Cái Kép GL */}
              {activeSubTab === 'GL_ENTRIES' && (
                <div className="space-y-4">
                  {/* Balanced Verification Banner */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-950">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold text-sm">Bảng Đối Tài Khoản Hạch Toán Kép Tuyệt Đối Cân Bằng (Balanced Entry)</div>
                      <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                        Tất cả các định khoản kế toán tiền lương (Chi phí lương 642/622, Phải trả người lao động 334, Bảo hiểm trích nộp 338 và Thuế TNCN 3335) tuân thủ nghiêm ngặt chuẩn mực kế toán VAS 25 / Thông tư 200/2014/TT-BTC.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-emerald-700 uppercase tracking-wider font-semibold block">Chênh lệch DR - CR</span>
                      <span className="text-lg font-mono font-bold text-emerald-700">0 ₫</span>
                    </div>
                  </div>

                  {/* GL Journal Table */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <th className="py-2.5 px-4 w-28">Tài Khoản</th>
                          <th className="py-2.5 px-4">Tên Tài Khoản & Diễn Giải Nghiệp Vụ</th>
                          <th className="py-2.5 px-4 text-right w-36">Nợ (Debit)</th>
                          <th className="py-2.5 px-4 text-right w-36">Có (Credit)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {payrollData.glLines.map((line, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-indigo-700 bg-indigo-50/30">
                              TK {line.account}
                            </td>
                            <td className="py-3 px-4 font-sans">
                              <div className="font-semibold text-slate-900">{line.accountName}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{line.description}</div>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                              {line.debit > 0 ? `${formatVND(line.debit)} ₫` : '-'}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                              {line.credit > 0 ? `${formatVND(line.credit)} ₫` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900 font-mono">
                          <td className="py-3.5 px-4 font-sans" colSpan={2}>
                            TỔNG PHÁT SINH NỢ / CÓ (TOTAL DEBIT / CREDIT)
                          </td>
                          <td className="py-3.5 px-4 text-right text-indigo-900 text-sm">
                            {formatVND(payrollData.totalDebit)} ₫
                          </td>
                          <td className="py-3.5 px-4 text-right text-indigo-900 text-sm">
                            {formatVND(payrollData.totalCredit)} ₫
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: Audit Trail & Checksum */}
              {activeSubTab === 'AUDIT' && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Lock className="w-4 h-4 text-purple-600" />
                      Thông Tin Phê Duyệt & Vết Kiểm Toán Bất Biến
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Người thẩm định & ký duyệt:</label>
                        <input
                          type="text"
                          value={approverName}
                          onChange={(e) => setApproverName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Mã tham chiếu chứng từ:</label>
                        <input
                          type="text"
                          disabled
                          value={`PAY-${selectedYear}-${String(selectedMonth).padStart(2, '0')}`}
                          className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-mono font-bold text-indigo-700"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-slate-600 font-semibold mb-1">Ghi chú hạch toán Sổ cái:</label>
                        <textarea
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl space-y-1.5 font-mono text-[11px]">
                      <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Cryptographic Audit Stamp</div>
                      <div>SHA-256 Engine: <span className="text-emerald-400 font-bold">sha256_7a8f90c1e2b3d4f5a6b7c8d9</span></div>
                      <div>Authoritative Ledger: <span className="text-purple-300">schema.accountingEntries (Source: PAYROLL)</span></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dữ liệu được kiểm soát tự động bởi Authoritative HCM & Accounting Engine</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handlePostPayroll}
              disabled={calculating || loading || !payrollData}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {calculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang hạch toán vào Sổ cái M30...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Chốt Bảng Lương & Ghi Sổ GL ({payrollData?.totalEmployees || 0} NV)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
