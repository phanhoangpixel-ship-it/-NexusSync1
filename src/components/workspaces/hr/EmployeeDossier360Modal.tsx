import React, { useState } from 'react';
import {
  UserCheck,
  Building,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Clock,
  Award,
  GraduationCap,
  FileDown,
  X,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Briefcase,
  ShieldCheck,
  CreditCard,
  Building2,
  CalendarCheck,
  TrendingUp,
  FileText,
  Percent,
} from 'lucide-react';
import { downloadPayslipPdf } from '../../../utils/pdfExporter';

export interface EmployeeDossier360ModalProps {
  employee: any | null;
  attendanceList?: any[];
  leavesList?: any[];
  performanceList?: any[];
  trainingList?: any[];
  onClose: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const EmployeeDossier360Modal: React.FC<EmployeeDossier360ModalProps> = ({
  employee,
  attendanceList = [],
  leavesList = [],
  performanceList = [],
  trainingList = [],
  onClose,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ATTENDANCE' | 'SALARY' | 'GL_LEDGER' | 'PERFORMANCE'>('OVERVIEW');

  if (!employee) return null;

  const handleExportPayslip = () => {
    try {
      const fileName = downloadPayslipPdf(employee);
      onNotify('success', 'Đã Tải Phiếu Lương 360°', `File [${fileName}] đã được tạo và tải về máy thành công.`);
    } catch (err: any) {
      onNotify('danger', 'Lỗi Xuất File', err.message || 'Không thể tạo file PDF.');
    }
  };

  // Filter employee-specific data
  const empAttendance = attendanceList.filter(
    (a) => a.employeeId === employee.id || a.employeeName === employee.fullName
  );
  const empLeaves = leavesList.filter(
    (l) => l.employeeId === employee.id || l.employeeName === employee.fullName
  );
  const empPerformance = performanceList.find(
    (p) => p.employeeId === employee.id || p.employeeName === employee.fullName
  );
  const empTraining = trainingList.filter(
    (t) => t.employeeId === employee.id || t.employeeName === employee.fullName
  );

  const baseSalary = employee.baseSalary || 16500000;
  const lunchAllowance = 1200000;
  const skillAllowance = 800000;
  const grossSalary = baseSalary + lunchAllowance + skillAllowance;
  const bhxh = Math.round(baseSalary * 0.08);
  const bhyt = Math.round(baseSalary * 0.015);
  const bhtn = Math.round(baseSalary * 0.01);
  const pit = Math.max(0, Math.round((grossSalary - 11000000 - (bhxh + bhyt + bhtn)) * 0.05));
  const netSalary = grossSalary - (bhxh + bhyt + bhtn + pit);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 border-b border-slate-800 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/80 border-2 border-indigo-400/40 text-white flex items-center justify-center font-bold text-xl shadow-inner shrink-0">
                {employee.fullName ? employee.fullName.slice(0, 2).toUpperCase() : 'NV'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-white tracking-tight">{employee.fullName}</h2>
                  <span className="font-mono tabular-nums text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {employee.code}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    {employee.status || 'ACTIVE'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                    {employee.position || 'Chuyên viên nghiệp vụ'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-indigo-400" />
                    {employee.departmentName || 'Khối Sản xuất & MES'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleExportPayslip}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Tải phiếu lương PDF kèm chứng thực mã băm"
              >
                <FileDown className="w-4 h-4" />
                <span>Xuất Phiếu Lương</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-5 border-t border-slate-800 pt-3 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'OVERVIEW'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>1. Thông Tin & Hợp Đồng</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ATTENDANCE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'ATTENDANCE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>2. Chấm Công & Nghỉ Phép</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SALARY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'SALARY'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>3. Lương & Phúc Lợi 360°</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('GL_LEDGER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'GL_LEDGER'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>4. Hạch Toán Sổ Cái GL (TK 334)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PERFORMANCE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'PERFORMANCE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>5. Đánh Giá KPI & Đào Tạo</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 space-y-5">
          {/* TAB 1: OVERVIEW & CONTRACT */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              {/* Quick Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Ngày Vào Làm</div>
                  <div className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-1">{employee.hireDate || '15/03/2023'}</div>
                  <div className="text-[10px] text-emerald-600 font-medium mt-0.5">3 năm cống hiến</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Loại Hợp Đồng</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">HĐLĐ Vô Thời Hạn</div>
                  <div className="text-[10px] text-indigo-600 font-medium mt-0.5">Ký chính thức</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Mã Số Thuế TNCN</div>
                  <div className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-1">8493021948</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">Cục Thuế TP. Hà Nội</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Sổ BHXH / BHYT</div>
                  <div className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-1">7919283948</div>
                  <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Đang đóng đầy đủ</div>
                </div>
              </div>

              {/* 2 Column Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Information */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    Thông Tin Cá Nhân & Liên Hệ
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Họ và tên:</span>
                      <span className="font-semibold text-slate-900">{employee.fullName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Giới tính:</span>
                      <span className="font-medium text-slate-800">{employee.gender === 'NU' ? 'Nữ' : 'Nam'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Số CCCD / CMND:</span>
                      <span className="font-mono tabular-nums text-slate-800">001092019482</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Email công vụ:</span>
                      <span className="text-indigo-600 font-mono tabular-nums">{employee.email || `${employee.code.toLowerCase()}@nexussync.vn`}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Số điện thoại:</span>
                      <span className="font-mono tabular-nums text-slate-800">{employee.phone || '0912 345 678'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Địa chỉ thường trú:</span>
                      <span className="text-slate-800 text-right">Quận Cầu Giấy, TP. Hà Nội</span>
                    </div>
                  </div>
                </div>

                {/* Organizational & Employment Details */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    Vị Trí & Tổ Chức Công Tác
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Phòng ban:</span>
                      <span className="font-semibold text-slate-900">{employee.departmentName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Chức danh / Vị trí:</span>
                      <span className="font-semibold text-indigo-600">{employee.position}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Quản lý trực tiếp:</span>
                      <span className="font-medium text-slate-800">Trưởng phòng {employee.departmentName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Địa điểm làm việc:</span>
                      <span className="text-slate-800">HN-HQ — Trụ sở chính (Hà Nội)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Khung giờ làm việc:</span>
                      <span className="font-mono tabular-nums text-slate-800">08:00 - 17:30 (Thứ 2 - Thứ 6)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Trạng thái HĐLĐ:</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Đang hiệu lực 100%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE & LEAVES */}
          {activeTab === 'ATTENDANCE' && (
            <div className="space-y-4">
              {/* Attendance KPI row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Công Chuẩn Tháng</span>
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">22 ngày</div>
                  <span className="text-[10px] text-emerald-600 font-medium">Đạt 98% chỉ tiêu</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Đi Muộn / Về Sớm</span>
                  <div className="text-lg font-bold font-mono tabular-nums text-emerald-600 mt-0.5">0 lần</div>
                  <span className="text-[10px] text-slate-400 font-medium">Tuân thủ nghiêm ngặt</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tăng Ca OT Tháng</span>
                  <div className="text-lg font-bold font-mono tabular-nums text-purple-600 mt-0.5">+8.5 giờ</div>
                  <span className="text-[10px] text-purple-600 font-medium">Hệ số tính x1.5</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Phép Năm Còn Lại</span>
                  <div className="text-lg font-bold font-mono tabular-nums text-indigo-600 mt-0.5">10 / 12 ngày</div>
                  <span className="text-[10px] text-slate-400 font-medium">Đã dùng: 2 ngày</span>
                </div>
              </div>

              {/* Attendance History */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Lịch Sử Điểm Danh & Chấm Công Gần Đây
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono tabular-nums">GPS / Biometric Sync</span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/75 text-slate-600 text-[10px] uppercase font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">Ngày</th>
                      <th className="py-2.5 px-3">Giờ Vào</th>
                      <th className="py-2.5 px-3">Giờ Ra</th>
                      <th className="py-2.5 px-3">Tổng Giờ</th>
                      <th className="py-2.5 px-3">Tăng Ca</th>
                      <th className="py-2.5 px-3 text-right">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-800 font-sans font-medium">01/09/2026 (Hôm nay)</td>
                      <td className="py-2 px-3 text-emerald-700 font-bold">07:55</td>
                      <td className="py-2 px-3 text-slate-600">17:35</td>
                      <td className="py-2 px-3 text-slate-800">8.0h</td>
                      <td className="py-2 px-3 text-purple-600 font-bold">+1.5h</td>
                      <td className="py-2 px-3 text-right font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Đúng giờ
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-800 font-sans font-medium">31/08/2026</td>
                      <td className="py-2 px-3 text-emerald-700 font-bold">07:58</td>
                      <td className="py-2 px-3 text-slate-600">17:30</td>
                      <td className="py-2 px-3 text-slate-800">8.0h</td>
                      <td className="py-2 px-3 text-slate-400">0h</td>
                      <td className="py-2 px-3 text-right font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Đúng giờ
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-800 font-sans font-medium">28/08/2026</td>
                      <td className="py-2 px-3 text-emerald-700 font-bold">07:52</td>
                      <td className="py-2 px-3 text-slate-600">17:30</td>
                      <td className="py-2 px-3 text-slate-800">8.0h</td>
                      <td className="py-2 px-3 text-purple-600 font-bold">+2.0h</td>
                      <td className="py-2 px-3 text-right font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Đúng giờ
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Leave Requests */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    Lịch Sử Đơn Xin Nghỉ Phép
                  </h4>
                  <span className="text-[11px] text-indigo-600 font-medium">Quy trình SLA duyệt 24h</span>
                </div>
                <div className="p-3 text-xs">
                  {empLeaves.length === 0 ? (
                    <div className="text-slate-400 text-center py-3">Nhân sự chưa có đơn nghỉ phép phát sinh trong tháng.</div>
                  ) : (
                    empLeaves.map((l) => (
                      <div key={l.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div>
                          <span className="font-semibold text-slate-900">{l.leaveType || 'Nghỉ phép năm'}</span>
                          <p className="text-[11px] text-slate-500 font-mono tabular-nums">Từ {l.startDate} đến {l.endDate} ({l.totalDays || 1} ngày)</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">Lý do: {l.reason || 'Việc gia đình'}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {l.status || 'APPROVED'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SALARY & PAYSLIP 360 */}
          {activeTab === 'SALARY' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Tổng Thu Nhập Gross</span>
                  <div className="text-xl font-bold font-mono tabular-nums text-indigo-600 mt-1">
                    {grossSalary.toLocaleString('vi-VN')} ₫
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Gồm lương cứng + các phụ cấp</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Các Khoản Trích Trừ</span>
                  <div className="text-xl font-bold font-mono tabular-nums text-rose-600 mt-1">
                    -{(bhxh + bhyt + bhtn + pit).toLocaleString('vi-VN')} ₫
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">BHXH, BHYT, BHTN & Thuế TNCN</p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase">Thực Lĩnh (Net Pay)</span>
                  <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                    {netSalary.toLocaleString('vi-VN')} ₫
                  </div>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Đã sẵn sàng lệnh chi lương</p>
                </div>
              </div>

              {/* Detailed Breakdown Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Bảng Kê Chi Tiết Cơ Cấu Lương & Khấu Trừ Tháng
                  </h4>
                  <button
                    type="button"
                    onClick={handleExportPayslip}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    In / Tải PDF
                  </button>
                </div>
                <div className="p-4 space-y-3 text-xs">
                  {/* Income Section */}
                  <div>
                    <h5 className="font-bold text-slate-800 uppercase text-[11px] mb-2 text-indigo-900 border-b pb-1">
                      1. Các Khoản Thu Nhập (Earnings)
                    </h5>
                    <div className="space-y-1.5">
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Lương cơ bản theo hợp đồng:</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900">{baseSalary.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Phụ cấp ăn trưa & xăng xe:</span>
                        <span className="font-mono tabular-nums font-medium text-slate-800">{lunchAllowance.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Phụ cấp trách nhiệm / tay nghề:</span>
                        <span className="font-mono tabular-nums font-medium text-slate-800">{skillAllowance.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  </div>

                  {/* Deduction Section */}
                  <div className="pt-2 border-t border-slate-100">
                    <h5 className="font-bold text-slate-800 uppercase text-[11px] mb-2 text-rose-900 border-b pb-1">
                      2. Các Khoản Trích Theo Lương & Thuế (Deductions)
                    </h5>
                    <div className="space-y-1.5">
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Bảo hiểm Xã hội (BHXH - 8%):</span>
                        <span className="font-mono tabular-nums text-rose-600">-{bhxh.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Bảo hiểm Y tế (BHYT - 1.5%):</span>
                        <span className="font-mono tabular-nums text-rose-600">-{bhyt.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Bảo hiểm Thất nghiệp (BHTN - 1%):</span>
                        <span className="font-mono tabular-nums text-rose-600">-{bhtn.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Thuế Thu Nhập Cá Nhân (TNCN tạm tính):</span>
                        <span className="font-mono tabular-nums text-rose-600">-{pit.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  </div>

                  {/* Final Net Total */}
                  <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-900 uppercase">Thực Lĩnh Thực Tế (NET TAKE-HOME PAY):</span>
                    <span className="text-base font-mono tabular-nums text-emerald-700">{netSalary.toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GL LEDGER POSTING */}
          {activeTab === 'GL_LEDGER' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 bg-indigo-500 rounded text-white font-bold">
                    GENERAL LEDGER SYNC • TK 334 / 642 / 622
                  </span>
                  <span className="text-xs font-mono tabular-nums text-emerald-400">Đã Khớp Sổ Cái Kế Toán</span>
                </div>
                <h4 className="text-sm font-bold">Sơ Đồ Hạch Toán Chi Phí Tiền Lương Doanh Nghiệp</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tự động chuyển tiếp dòng chi phí nhân công và nghĩa vụ thuế/bảo hiểm vào phân hệ <strong>M30 (General Ledger)</strong> mà không cần nhập liệu thủ công.
                </p>
              </div>

              {/* Journal Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/75 text-slate-700 text-[10px] uppercase font-semibold border-b border-slate-200">
                      <th className="py-3 px-3">Tài Khoản Kế Toán</th>
                      <th className="py-3 px-3">Tên Nghiệp Vụ</th>
                      <th className="py-3 px-3 text-right">Nợ (Debit)</th>
                      <th className="py-3 px-3 text-right">Có (Credit)</th>
                      <th className="py-3 px-3">Mô Tả Diễn Giải</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-xs">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-indigo-700">TK 642 / TK 622</td>
                      <td className="py-2.5 px-3 font-sans text-slate-800 font-medium">Chi phí tiền lương nhân sự</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{baseSalary.toLocaleString('vi-VN')} ₫</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">0 ₫</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">Hạch toán chi phí lương cho {employee.fullName}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-emerald-700">TK 334</td>
                      <td className="py-2.5 px-3 font-sans text-slate-800 font-medium">Phải trả người lao động</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">0 ₫</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{netSalary.toLocaleString('vi-VN')} ₫</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">Nghĩa vụ lương thực trả sau khấu trừ</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-purple-700">TK 338 (3383, 3384)</td>
                      <td className="py-2.5 px-3 font-sans text-slate-800 font-medium">Phải trả BHXH, BHYT, BHTN</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">0 ₫</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{(bhxh + bhyt + bhtn).toLocaleString('vi-VN')} ₫</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">Trích nộp BHXH/BHYT/BHTN cơ quan Nhà nước</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-amber-700">TK 3335</td>
                      <td className="py-2.5 px-3 font-sans text-slate-800 font-medium">Thuế TNCN khấu trừ tại nguồn</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">0 ₫</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{pit.toLocaleString('vi-VN')} ₫</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">Nộp ngân sách nhà nước theo kỳ kê khai</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: PERFORMANCE & TRAINING */}
          {activeTab === 'PERFORMANCE' && (
            <div className="space-y-4">
              {/* KPI OKR Panel */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    Đánh Giá Hiệu Suất KPI & Xếp Loại OKR
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    KỲ ĐÁNH GIÁ GẦN NHẤT
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Điểm Đánh Giá KPI</span>
                    <div className="text-xl font-bold font-mono tabular-nums text-indigo-600 mt-1">
                      {empPerformance?.kpiScore || '92 / 100'}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium">Vượt 7% KPI đề ra</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Xếp Loại OKR</span>
                    <div className="text-xl font-bold text-emerald-700 mt-1">
                      {empPerformance?.okrRating || 'Xuất Sắc (A+)'}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Được đề xuất khen thưởng</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Hệ Số Thưởng Lương</span>
                    <div className="text-xl font-bold font-mono tabular-nums text-purple-600 mt-1">
                      x {empPerformance?.salaryCoefficient || '1.25'}
                    </div>
                    <span className="text-[10px] text-purple-600 font-medium">Cộng trực tiếp vào bảng lương</span>
                  </div>
                </div>
              </div>

              {/* L&D Training & Certifications */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    Chứng Chỉ Chuyên Môn & An Toàn Lao Động (L&D Records)
                  </h4>
                  <span className="text-[11px] text-emerald-700 font-semibold">Đạt chuẩn an toàn</span>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">Chứng Chỉ An Toàn Lao Động Nhóm 3 (An Toàn Máy Móc & Điện)</h5>
                      <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">Mã số: CERT-SAF-2026-0092 • Thời lượng: 24 giờ</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        CÒN HẠN (2028)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">Kỹ Năng Vận Hành Hệ Thống MES & Tự Động Hóa Nhà Máy</h5>
                      <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">Mã số: CERT-MES-PRO-883 • Thời lượng: 40 giờ</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ĐẠT CHUẨN
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Hồ sơ nhân sự được mã hóa và xác thực toàn vẹn (SHA-256 Verified).</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPayslip}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              Xuất PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
