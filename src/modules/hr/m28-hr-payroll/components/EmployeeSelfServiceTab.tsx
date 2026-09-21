import React, { useState } from 'react';
import {
  User,
  Clock,
  Calendar,
  FileDown,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  Phone,
  CreditCard,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { downloadPayslipPdf } from '../../../../utils/pdfExporter';

interface EmployeeSelfServiceTabProps {
  currentEmployee: any;
  attendanceList: any[];
  leavesList: any[];
  onOpenCreateLeaveModal: () => void;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const EmployeeSelfServiceTab: React.FC<EmployeeSelfServiceTabProps> = ({
  currentEmployee,
  attendanceList,
  leavesList,
  onOpenCreateLeaveModal,
  onRefresh,
  onNotify,
}) => {
  const [checkingIn, setCheckingIn] = useState(false);
  const emp = currentEmployee || {
    id: 1,
    code: 'EMP-00101',
    fullName: 'Trần Văn Hùng',
    gender: 'NAM',
    departmentName: 'Khối Sản xuất & MES',
    position: 'Kỹ sư Vận hành SMT Trưởng',
    phone: '0908 123 456',
    email: 'hung.tran@nexussync.vn',
    baseSalary: 18500000,
    hireDate: '2023-03-15',
    status: 'ACTIVE',
    bankAccount: '19034567890019 (Techcombank)',
  };

  const myAttendance = attendanceList.filter((a) => a.employeeId === emp.id || a.employeeName === emp.fullName);
  const myLeaves = leavesList.filter((l) => l.employeeId === emp.id || l.employeeName === emp.fullName);

  const handleGPSCheckIn = async () => {
    setCheckingIn(true);
    try {
      const res = await fetch('/api/hr/ess/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: emp.id,
          locationName: 'Nhà máy SMT Khu Công Nghệ Cao (GPS: 10.7769, 106.7009)',
          method: 'GPS Di Động & Nhận Diện AI',
        }),
      });
      const data = await res.json();
      onNotify('success', 'Điểm danh ESS Thành công', data.message || 'Đã ghi nhận quẹt thẻ hợp lệ.');
      onRefresh();
    } catch (err: any) {
      onNotify('danger', 'Lỗi Check-in', err.message);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleDownloadMyPayslip = () => {
    try {
      const fileName = downloadPayslipPdf(emp);
      onNotify('success', 'Đã Tải Phiếu Lương Cá Nhân', `File [${fileName}] đã được tải về máy thành công.`);
    } catch (err: any) {
      onNotify('danger', 'Lỗi Xuất File', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
              {emp.fullName
                ? emp.fullName
                    .split(' ')
                    .slice(-2)
                    .map((n: string) => n[0])
                    .join('')
                : 'NV'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{emp.fullName}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {emp.status === 'ACTIVE' ? 'Đang làm việc' : emp.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {emp.code} • {emp.position} — {emp.departmentName}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {emp.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {emp.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Ngày vào làm: {emp.hireDate || '15/03/2023'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGPSCheckIn}
              disabled={checkingIn}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <MapPin className="w-4 h-4" />
              <span>{checkingIn ? 'Đang chấm công GPS...' : 'Chấm Công GPS Bây Giờ'}</span>
            </button>
            <button
              onClick={onOpenCreateLeaveModal}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Gửi Đơn Xin Nghỉ</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Quick ESS Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Leave Balance */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Phép năm hiện tại</span>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">10</span>
            <span className="text-xs text-slate-400">/ 12 ngày còn lại</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '83%' }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Đã nghỉ: 2 ngày có phép • Hạn dùng: 31/12/2026</p>
        </div>

        {/* Latest Payslip */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Phiếu lương Tháng 08/2026</span>
            <CreditCard className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-600">
            {((emp.baseSalary || 18500000) * 0.88).toLocaleString('vi-VN')} ₫
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Đã khấu trừ BHXH 10.5% &amp; Thuế TNCN</p>
          <button
            onClick={handleDownloadMyPayslip}
            className="mt-3 w-full py-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Tải Phiếu Lương PDF (SHA-256)</span>
          </button>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Chuyên cần tháng này</span>
            <Clock className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-600">22</span>
            <span className="text-xs text-slate-400">/ 22 ngày công chuẩn</span>
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-3 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đạt tỷ lệ chuyên cần 100% (Thưởng chuyên cần 500k)
          </p>
        </div>
      </div>
    </div>
  );
};
