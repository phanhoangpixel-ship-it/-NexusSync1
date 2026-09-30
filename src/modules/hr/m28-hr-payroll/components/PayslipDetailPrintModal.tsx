import React from "react";
import {
  X,
  Printer,
  FileSpreadsheet,
  Download,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  User,
  ShieldCheck,
  CreditCard,
  Layers,
  Award,
} from "lucide-react";
import { StatusBadge } from "../../../../components/common/StatusBadge";

export interface PayslipItemData {
  id: string | number;
  employeeCode: string;
  employeeName: string;
  department: string;
  position: string;
  period: string;
  baseSalary: number;
  workingDays: number;
  actualWorkingDays: number;
  overtimeHours: number;
  overtimePay: number;
  allowances: {
    lunch: number;
    phone: number;
    transport: number;
    responsibility: number;
  };
  kpiBonus: number;
  grossIncome: number;
  deductions: {
    socialInsurance: number;
    healthInsurance: number;
    unemploymentInsurance: number;
    pit: number;
    advance: number;
  };
  totalDeductions: number;
  netPay: number;
  paymentMethod: string;
  bankAccount: string;
  bankName: string;
  status: "DRAFT" | "APPROVED" | "PAID";
}

export interface PayslipDetailPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  payslip: PayslipItemData | null;
  onConfirmPay?: (payslipId: string | number) => void;
}

export const PayslipDetailPrintModal: React.FC<PayslipDetailPrintModalProps> = ({
  isOpen,
  onClose,
  payslip,
  onConfirmPay,
}) => {
  if (!isOpen || !payslip) return null;

  const totalAllowances =
    (payslip.allowances?.lunch || 0) +
    (payslip.allowances?.phone || 0) +
    (payslip.allowances?.transport || 0) +
    (payslip.allowances?.responsibility || 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Phiếu Lương Chi Tiết & Bút Toán Sổ Cái
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kỳ lương: <strong className="text-blue-600 dark:text-blue-400 font-mono">{payslip.period}</strong> | Nhân viên: <strong className="text-slate-800 dark:text-slate-200">{payslip.employeeName}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Phiếu</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
          {/* Header Info */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">TẬP ĐOÀN CÔNG NGHỆ & SẢN XUẤT NEXUSSYNC</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  PHIẾU THANH TOÁN TIỀN LƯƠNG & CÁC KHOẢN TRÍCH NỘP
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold">
                  Mã NV: {payslip.employeeCode} | Chức vụ: {payslip.position} | Phòng ban: {payslip.department}
                </div>
              </div>
              <div className="sm:text-right">
                <StatusBadge
                  variant={payslip.status === "PAID" ? "success" : payslip.status === "APPROVED" ? "purple" : "warning"}
                  label={payslip.status === "PAID" ? "Đã Thanh Toán" : payslip.status === "APPROVED" ? "Đã Duyệt Lương" : "Bảng Lương Dự Thảo"}
                />
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                  TK: {payslip.bankAccount} ({payslip.bankName})
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Thu Nhập (Earnings) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
              <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/60 font-bold text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                <span>I. CÁC KHOẢN THU NHẬP</span>
                <span className="font-mono tabular-nums">{(payslip.grossIncome || 0).toLocaleString("vi-VN")} VNĐ</span>
              </div>
              <div className="p-3.5 space-y-2.5">
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-600 dark:text-slate-300">Lương cơ bản (HĐLĐ):</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                    {(payslip.baseSalary || 0).toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-600 dark:text-slate-300">Ngày công thực tế ({payslip.actualWorkingDays}/{payslip.workingDays} ngày):</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                    {(((payslip.baseSalary || 0) / (payslip.workingDays || 22)) * (payslip.actualWorkingDays || 22)).toLocaleString("vi-VN", { maximumFractionDigits: 0 })} VNĐ
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-600 dark:text-slate-300">Làm thêm giờ ({payslip.overtimeHours || 0} giờ x 150%):</span>
                  <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    {(payslip.overtimePay || 0).toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-600 dark:text-slate-300">Tổng phụ cấp (Ăn trưa, xăng xe, ĐT):</span>
                  <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    {totalAllowances.toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">Thưởng hiệu suất KPI:</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                    +{(payslip.kpiBonus || 0).toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
              </div>
            </div>

            {/* Các Khoản Giảm Trừ (Deductions) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
              <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/60 font-bold text-rose-900 dark:text-rose-300 flex items-center justify-between">
                <span>II. CÁC KHOẢN GIẢM TRỪ</span>
                <span className="font-mono tabular-nums">-{(payslip.totalDeductions || 0).toLocaleString("vi-VN")} VNĐ</span>
              </div>
              <div className="p-3.5 space-y-2.5">
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-600 dark:text-slate-300">BHXH bắt buộc (8%):</span>
                  <span className="font-mono tabular-nums text-rose-700 dark:text-rose-400 font-semibold">
                    -{(payslip.deductions?.socialInsurance || 0).toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-600 dark:text-slate-300">BHYT (1.5%):</span>
                  <span className="font-mono tabular-nums text-rose-700 dark:text-rose-400 font-semibold">
                    -{(payslip.deductions?.healthInsurance || 0).toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-600 dark:text-slate-300">Bảo hiểm thất nghiệp BHTN (1%):</span>
                  <span className="font-mono tabular-nums text-rose-700 dark:text-rose-400 font-semibold">
                    -{(payslip.deductions?.unemploymentInsurance || 0).toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-600 dark:text-slate-300">Thuế thu nhập cá nhân (TNCN):</span>
                  <span className="font-mono tabular-nums text-rose-700 dark:text-rose-400 font-semibold">
                    -{(payslip.deductions?.pit || 0).toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600 dark:text-slate-300">Tạm ứng lương đã nhận:</span>
                  <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    -{(payslip.deductions?.advance || 0).toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay Highlight Banner */}
          <div className="p-4 bg-blue-600 text-white rounded-xl flex items-center justify-between shadow-md">
            <div>
              <div className="text-xs text-blue-100 uppercase tracking-wider font-bold">
                THỰC LĨNH CHUYỂN KHOẢN (NET PAY)
              </div>
              <div className="text-[11px] text-blue-200 mt-0.5">
                Đã chuyển khoản qua hệ thống Gateway Ngân hàng liên kết M33 / M32
              </div>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums">
              {(payslip.netPay || 0).toLocaleString("vi-VN")} VNĐ
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between shrink-0">
          <div className="text-slate-500 dark:text-slate-400 text-[11px]">
            Chứng từ điện tử trích xuất từ Hệ thống Quản trị Nhân sự & Tiền lương M28
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              Đóng
            </button>
            {payslip.status !== "PAID" && onConfirmPay && (
              <button
                onClick={() => {
                  onConfirmPay(payslip.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Duyệt Chi & Chuyển Khoản Ngân Hàng</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
