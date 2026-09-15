import React, { useState, useEffect } from 'react';
import { CurrencyInput } from '../common/CurrencyInput';
import { SelectedEntityContext } from '../../types';
import { downloadPayslipPdf } from '../../utils/pdfExporter';
import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';
import { useWorkspaceAction } from '../shell/DomainWorkspaceShell';
import { EmployeeDossier360Modal } from './hr/EmployeeDossier360Modal';
import { PayrollCalculationGLModal } from './hr/PayrollCalculationGLModal';
import {
  Users,
  Clock,
  Calendar,
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Building,
  Check,
  X,
  Calculator,
  Eye,
  FileDown,
  Award,
  GraduationCap,
  TrendingUp,
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  CalendarCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface HRWorkspaceProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  showCreateModal?: boolean;
  onCloseCreateModal?: () => void;
}

export const HRWorkspace: React.FC<HRWorkspaceProps> = ({
  onSelectEntity,
  showCreateModal = false,
  onCloseCreateModal,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'EMPLOYEES' | 'ATTENDANCE' | 'LEAVES' | 'PAYROLL' | 'ESS' | 'PERFORMANCE' | 'TRAINING'>('M28', 'EMPLOYEES');
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [performanceRecords, setPerformanceRecords] = useState<any[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleGPSCheckIn = async () => {
    try {
      const res = await fetch('/api/hr/ess/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: 1, locationName: 'Nhà máy chính (GPS: 10.7769, 106.7009)', method: 'GPS / WiFi Nhà máy' }),
      });
      const data = await res.json();
      onNotify('success', 'Check-in Thành công', data.message);
    } catch (err) {
      onNotify('danger', 'Lỗi Check-in', 'Không thể kết nối định vị GPS nhà máy.');
    }
  };

  const handleDownloadPayslip = (emp: any) => {
    try {
      const fileName = downloadPayslipPdf(emp);
      onNotify('success', 'Đã Tải File PDF Phiếu Lương', `File [${fileName}] đã được xuất và tải về máy thành công (Xác thực SHA-256).`);
    } catch (err) {
      onNotify('danger', 'Lỗi Xuất PDF', 'Không thể tạo file PDF phiếu lương. Vui lòng thử lại.');
    }
  };

  // Local Modal States
  const [selectedEmployee360, setSelectedEmployee360] = useState<any | null>(null);
  const [isEmpModalOpen, setIsEmpModalOpen] = useState<boolean>(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
  const [isPayrollGLModalOpen, setIsPayrollGLModalOpen] = useState<boolean>(false);
  const [selectedPayrollForModal, setSelectedPayrollForModal] = useState<any | null>(null);
  const [newEmpForm, setNewEmpForm] = useState({
    fullName: '',
    gender: 'NAM',
    departmentName: 'Khối Sản xuất & MES',
    position: 'Kỹ sư Vận hành',
    phone: '',
    email: '',
    baseSalary: 16000000,
  });
  const [newLeaveForm, setNewLeaveForm] = useState({
    employeeId: 1,
    leaveType: 'ANNUAL_LEAVE',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    totalDays: 1,
    reason: '',
  });

  useEffect(() => {
    if (showCreateModal) {
      setIsEmpModalOpen(true);
    }
  }, [showCreateModal]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [empRes, attRes, leaveRes, payRes, perfRes, trainRes] = await Promise.all([
        fetch('/api/hr/employees'),
        fetch('/api/hr/attendance'),
        fetch('/api/hr/leaves'),
        fetch('/api/hr/payrolls'),
        fetch('/api/hr/performance'),
        fetch('/api/hr/training'),
      ]);
      const [empData, attData, leaveData, payData, perfData, trainData] = await Promise.all([
        empRes.json(),
        attRes.json(),
        leaveRes.json(),
        payRes.json(),
        perfRes.json(),
        trainRes.json(),
      ]);
      setEmployees(Array.isArray(empData) ? empData : []);
      setAttendance(Array.isArray(attData) ? attData : []);
      setLeaves(Array.isArray(leaveData) ? leaveData : []);
      setPayrolls(Array.isArray(payData) ? payData : []);
      setPerformanceRecords(Array.isArray(perfData) ? perfData : []);
      setTrainingRecords(Array.isArray(trainData) ? trainData : []);
    } catch (err) {
      console.error('Error fetching HR data:', err);
      onNotify('danger', 'Lỗi tải dữ liệu', 'Không thể kết nối tới máy chủ HR Core.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSelectEmployee = (emp: any) => {
    onSelectEntity({
      type: 'HR_EMPLOYEE',
      id: emp.id,
      code: emp.code,
      title: `${emp.fullName} - ${emp.position}`,
      status: emp.status,
      lineage: [
        { id: `emp-${emp.id}`, type: 'Hồ sơ Nhân sự HRM', code: emp.code, relation: 'ROOT_EMPLOYEE', status: emp.status },
        { id: `dept-${emp.departmentId || 1}`, type: 'Phòng ban công tác', code: emp.departmentName || 'Phòng Kỹ thuật', relation: 'DEPARTMENT_ASSIGNMENT', status: 'ACTIVE' },
        { id: `gl-pay-${emp.id}`, type: 'Định khoản Lương GL', code: `TK-334-${emp.code}`, relation: 'PAYROLL_POSTING', status: 'LINKED' },
      ],
      auditTrail: [
        { id: 1, action: 'Ký kết Hợp đồng Lao động', timestamp: emp.hireDate || '2023-03-15', user: 'Admin HR', sha256Checksum: '112233445566778899aabbcc' },
        { id: 2, action: 'Đóng BHXH & Đăng ký Thuế TNCN', timestamp: '2023-04-01', user: 'CFO / Kế toán trưởng', sha256Checksum: '998877665544332211aabbcc' },
      ],
      glEntries: [
        { account: 'TK 642 / 622', accountName: 'Chi phí Lương Quản lý / Sản xuất', debit: emp.baseSalary, credit: 0, description: `Hạch toán chi phí lương ${emp.fullName}` },
        { account: 'TK 334', accountName: 'Phải trả người lao động', debit: 0, credit: emp.baseSalary, description: `Khoản phải trả lương ${emp.fullName}` },
      ],
    });
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmpForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thêm nhân viên thất bại');
      onNotify('success', 'Thêm nhân viên thành công', `Hồ sơ mã ${data.code} đã được cấp vào hệ thống.`);
      setIsEmpModalOpen(false);
      
      fetchAllData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi tạo nhân sự', err.message);
    }
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hr/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeaveForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nộp đơn nghỉ phép thất bại');
      onNotify('success', 'Nộp đơn thành công', 'Đơn xin nghỉ phép đã được chuyển tới Trưởng bộ phận.');
      setIsLeaveModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi nộp đơn', err.message);
    }
  };

  const handleApproveLeave = async (leaveId: number) => {
    try {
      const res = await fetch(`/api/hr/leaves/${leaveId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Phê duyệt thất bại');
      onNotify('success', 'Phê duyệt hoàn tất', 'Đơn xin nghỉ phép đã được phê duyệt chính thức.');
      fetchAllData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi phê duyệt', err.message);
    }
  };

  const handleOpenCalculatePayroll = (payrollItem?: any) => {
    setSelectedPayrollForModal(payrollItem || null);
    setIsPayrollGLModalOpen(true);
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.departmentName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="hr-workspace" className="space-y-6">
      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div id="kpi-total-emp" className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng nhân sự</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{employees.length}</div>
          <p className="text-xs text-slate-500 mt-1">100% HĐLĐ đang hiệu lực</p>
        </div>

        <div id="kpi-attendance" className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Điểm danh hôm nay</span>
            <Clock className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">80%</div>
          <p className="text-xs text-slate-500 mt-1">4/5 nhân sự đúng giờ</p>
        </div>

        <div id="kpi-leaves-pending" className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Đơn nghỉ chờ duyệt</span>
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">
            {leaves.filter((l) => l.status === 'PENDING').length}
          </div>
          <p className="text-xs text-slate-500 mt-1">SLA duyệt trong 24h</p>
        </div>

        <div
          id="kpi-payroll-fund"
          onClick={() => handleOpenCalculatePayroll()}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Quỹ lương tháng</span>
            <DollarSign className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-600">
            {payrolls[0] ? `${(payrolls[0].totalNet / 1000000).toFixed(1)} Tr` : '80.3 Tr'}
          </div>
          <p className="text-xs text-purple-700 font-semibold mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-500" /> Bấm tính lương & ghi sổ GL 360°
          </p>
        </div>
      </div>

      {/* Workspace Action Bar & Tabs (M41 Master Spec) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1">
          <button
            id="tab-emp-list"
            onClick={() => setActiveTab('EMPLOYEES')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'EMPLOYEES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Hồ sơ Nhân sự</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeTab === 'EMPLOYEES' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {employees.length}
            </span>
          </button>

          <button
            id="tab-attendance"
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ATTENDANCE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Chấm công &amp; Điểm danh</span>
          </button>

          <button
            id="tab-leaves"
            onClick={() => setActiveTab('LEAVES')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'LEAVES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Đơn Nghỉ phép</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeTab === 'LEAVES' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {leaves.length}
            </span>
          </button>

          <button
            id="tab-payroll"
            onClick={() => setActiveTab('PAYROLL')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'PAYROLL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Bảng lương &amp; Hạch toán GL</span>
          </button>

          <button
            id="tab-ess"
            onClick={() => setActiveTab('ESS')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ESS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Cổng ESS</span>
          </button>

          <button
            id="tab-performance"
            onClick={() => setActiveTab('PERFORMANCE')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'PERFORMANCE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Đánh giá KPI &amp; OKR</span>
          </button>

          <button
            id="tab-training"
            onClick={() => setActiveTab('TRAINING')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'TRAINING'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Đào tạo &amp; Chứng chỉ</span>
          </button>
        </div>

        {/* Global HR Actions */}
        <div className="flex items-center gap-2 px-3 py-1">
          {activeTab === 'EMPLOYEES' && (
            <button
              id="btn-add-emp"
              onClick={() => setIsEmpModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm nhân viên
            </button>
          )}
          {activeTab === 'LEAVES' && (
            <button
              id="btn-create-leave"
              onClick={() => setIsLeaveModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tạo đơn nghỉ phép
            </button>
          )}
          {activeTab === 'PAYROLL' && (
            <button
              id="btn-calc-payroll"
              onClick={() => handleOpenCalculatePayroll()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              Tính lương & Ghi sổ GL 360°
            </button>
          )}
          <button
            onClick={fetchAllData}
            title="Làm mới dữ liệu"
            className="p-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, mã NV, phòng ban..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="text-xs text-slate-500">
            Hiển thị kết nối trực tiếp với <strong>Authoritative HCM & GL Engine</strong>
          </div>
        </div>

        {/* Tab 1: Employees List */}
        {activeTab === 'EMPLOYEES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/75 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Mã NV</th>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Phòng ban</th>
                  <th className="py-3 px-4">Chức danh / Vị trí</th>
                  <th className="py-3 px-4">Lương cơ bản</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Hồ Sơ 360°</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Không tìm thấy nhân viên phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => {
                        handleSelectEmployee(emp);
                        setSelectedEmployee360(emp);
                      }}
                      className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-indigo-600">{emp.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {emp.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div>{emp.fullName}</div>
                          <div className="text-xs text-slate-400">{emp.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{emp.departmentName}</td>
                      <td className="py-3 px-4 text-slate-700">{emp.position}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {emp.baseSalary.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectEmployee(emp);
                            setSelectedEmployee360(emp);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Hồ sơ 360°</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Attendance Records */}
        {activeTab === 'ATTENDANCE' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/75 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Nhân viên</th>
                  <th className="py-3 px-4">Ngày làm việc</th>
                  <th className="py-3 px-4">Giờ vào (Check-in)</th>
                  <th className="py-3 px-4">Giờ ra (Check-out)</th>
                  <th className="py-3 px-4">Tổng giờ</th>
                  <th className="py-3 px-4">Tăng ca OT</th>
                  <th className="py-3 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {attendance.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{att.employeeName}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{att.workDate}</td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-medium">{att.checkIn}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{att.checkOut}</td>
                    <td className="py-3 px-4 font-mono">{att.workHours}h</td>
                    <td className="py-3 px-4 font-mono text-purple-600 font-semibold">{att.otHours > 0 ? `+${att.otHours}h` : '0h'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          att.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {att.status === 'PRESENT' ? 'Đúng giờ' : 'Đi muộn'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Leave Requests */}
        {activeTab === 'LEAVES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/75 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Nhân viên</th>
                  <th className="py-3 px-4">Loại nghỉ phép</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Số ngày</th>
                  <th className="py-3 px-4">Lý do</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{l.employeeName}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {l.leaveType === 'ANNUAL_LEAVE' ? 'Nghỉ phép năm' : 'Nghỉ ốm'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {l.startDate} → {l.endDate}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">{l.totalDays} ngày</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{l.reason}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          l.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {l.status === 'APPROVED' ? 'Đã duyệt' : 'Chờ duyệt'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {l.status === 'PENDING' && (
                        <button
                          onClick={() => handleApproveLeave(l.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Check className="w-3 h-3" /> Phê duyệt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Payroll & GL Posting */}
        {activeTab === 'PAYROLL' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/75 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Kỳ tính lương</th>
                  <th className="py-3 px-4">Tên bảng lương</th>
                  <th className="py-3 px-4">Số nhân sự</th>
                  <th className="py-3 px-4">Tổng Gross</th>
                  <th className="py-3 px-4">BHXH (10.5%)</th>
                  <th className="py-3 px-4">Thuế TNCN</th>
                  <th className="py-3 px-4">Thực lĩnh Net</th>
                  <th className="py-3 px-4">Sổ cái GL</th>
                  <th className="py-3 px-4 text-right">Thao tác 360°</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{p.periodCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 font-mono">{p.totalEmployees} người</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {(p.totalGross || 0).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-600">
                      -{(p.totalInsurance || 0).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-600">
                      -{(p.totalTax || 0).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      {(p.totalNet || 0).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-indigo-600" />
                        Đã ghi sổ TK 334/642
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenCalculatePayroll(p)}
                        className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Layers className="w-3 h-3" />
                        Bảng Kê & GL 360°
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 5: Employee Self-Service (ESS Portal) */}
        {activeTab === 'ESS' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between bg-slate-900 text-white p-6 rounded-2xl shadow-md">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-600 rounded text-white font-bold">MOBILE ESS PORTAL</span>
                <h3 className="text-lg font-bold mt-2">Cổng Thông Tin Tự Phục Vụ (Employee Self-Service)</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Cho phép nhân sự thực hiện check-in định vị GPS/WiFi tại nhà máy, tra cứu lịch làm việc và tải xuống phiếu lương điện tử PDF có mã băm chữ ký số bảo mật.
                </p>
              </div>
              <button
                onClick={handleGPSCheckIn}
                className="mt-4 md:mt-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                📍 Check-in GPS/WiFi Nhà Máy
              </button>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">Tra Cứu Phiếu Lương Điện Tử (Payslip PDF)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {employees.slice(0, 3).map((emp) => (
                  <div key={emp.id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-600">{emp.code}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">LOCKED</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{emp.fullName}</div>
                      <div className="text-xs text-slate-500">{emp.position} — {emp.departmentName}</div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-600">Thực lĩnh Net:</span>
                      <strong className="font-mono text-emerald-700 font-bold">
                        {(emp.baseSalary * 0.85).toLocaleString('vi-VN')} ₫
                      </strong>
                    </div>
                    <button
                      onClick={() => handleDownloadPayslip(emp)}
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      📥 Tải Xuống Phiếu Lương PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: KPI & OKR Performance Review */}
        {activeTab === 'PERFORMANCE' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between bg-slate-900 text-white p-6 rounded-2xl shadow-md">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-600 rounded text-white font-bold">PERFORMANCE MANAGEMENT</span>
                <h3 className="text-lg font-bold mt-2">Đánh Giá Hiệu Suất Định Kỳ (KPI & OKR Review)</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Hệ thống chấm điểm hiệu suất làm việc tự động tích hợp với cơ chế điều chỉnh hệ số lương thưởng cuối năm cho từng nhân sự.
                </p>
              </div>
              <div className="text-right mt-4 md:mt-0 font-mono">
                <div className="text-xs text-slate-400">Điểm KPI Trung Bình</div>
                <div className="text-xl font-bold text-amber-400">91.2 / 100</div>
              </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase font-mono text-[10px]">
                    <th className="p-3">Mã & Nhân Sự</th>
                    <th className="p-3">Phòng Ban</th>
                    <th className="p-3">Điểm KPI</th>
                    <th className="p-3">Xếp Loại OKR</th>
                    <th className="p-3">Hệ Số Lương Thưởng</th>
                    <th className="p-3 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {performanceRecords.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{p.employeeName}</td>
                      <td className="p-3 text-slate-600">{p.department}</td>
                      <td className="p-3 font-mono font-bold text-indigo-600">{p.kpiScore}</td>
                      <td className="p-3 font-medium text-emerald-700">{p.okrRating}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">x {p.salaryCoefficient}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] font-bold">ĐÃ CHỐT</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 7: L&D Training & Certifications */}
        {activeTab === 'TRAINING' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between bg-slate-900 text-white p-6 rounded-2xl shadow-md">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-600 rounded text-white font-bold">L&D SAFETY & CERTIFICATIONS</span>
                <h3 className="text-lg font-bold mt-2">Quản Lý Đào Tạo & Chứng Chỉ Nghề Nghiệp (L&D Management)</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Theo dõi lịch sử đào tạo an toàn lao động, chứng chỉ vận hành máy móc và tự động cảnh báo thời hạn gia hạn chứng chỉ trước khi phân công công việc.
                </p>
              </div>
              <div className="text-right mt-4 md:mt-0 font-mono">
                <div className="text-xs text-slate-400">Chứng Chỉ Hợp Lệ</div>
                <div className="text-xl font-bold text-emerald-400">2 / 3 Đạt Chuẩn</div>
              </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase font-mono text-[10px]">
                    <th className="p-3">Nhân Sự</th>
                    <th className="p-3">Tên Khóa Đào Tạo / Chứng Chỉ</th>
                    <th className="p-3">Số Giờ</th>
                    <th className="p-3">Mã Chứng Chỉ</th>
                    <th className="p-3">Ngày Hết Hạn</th>
                    <th className="p-3 text-center">Trạng Thái An Toàn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {trainingRecords.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{t.employeeName}</td>
                      <td className="p-3 text-slate-800 font-medium">{t.courseName}</td>
                      <td className="p-3 font-mono">{t.hours} giờ</td>
                      <td className="p-3 font-mono text-indigo-600">{t.certificateNo}</td>
                      <td className="p-3 font-mono">{t.expiresAt}</td>
                      <td className="p-3 text-center">
                        {t.status === 'VALID' ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">HỢP LỆ</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold animate-pulse">SẮP HẾT HẠN (CẦN GIA HẠN)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Thêm Nhân Viên Mới */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                Thêm Hồ Sơ Nhân Viên Mới
              </h3>
              <button
                onClick={() => {
                  setIsEmpModalOpen(false);
                  
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEmployee} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Họ và tên nhân viên</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Minh Trí"
                  value={newEmpForm.fullName}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Giới tính</label>
                  <select
                    value={newEmpForm.gender}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="NAM">Nam</option>
                    <option value="NU">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="0912 345 678"
                    value={newEmpForm.phone}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phòng ban</label>
                  <select
                    value={newEmpForm.departmentName}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, departmentName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Khối Sản xuất & MES">Khối Sản xuất & MES</option>
                    <option value="Tài chính - Kế toán">Tài chính - Kế toán</option>
                    <option value="Quản lý Kho vận WMS">Quản lý Kho vận WMS</option>
                    <option value="Kiểm soát Chất lượng QMS">Kiểm soát Chất lượng QMS</option>
                    <option value="Kỹ thuật & Bảo trì EAM">Kỹ thuật & Bảo trì EAM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Chức danh</label>
                  <input
                    type="text"
                    placeholder="Chuyên viên Kỹ thuật"
                    value={newEmpForm.position}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, position: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <CurrencyInput
                  label="Lương cơ bản (VNĐ)"
                  value={newEmpForm.baseSalary}
                  onChange={(val) => setNewEmpForm({ ...newEmpForm, baseSalary: val })}
                  placeholder="VD: 16.000.000"
                  required
                  showBadge={true}
                  showPresets={true}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEmpModalOpen(false);
                    
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-semibold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  Lưu hồ sơ nhân sự
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tạo Đơn Nghỉ Phép */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Tạo Đơn Xin Nghỉ Phép
              </h3>
              <button onClick={() => setIsLeaveModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLeave} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nhân viên xin nghỉ</label>
                <select
                  value={newLeaveForm.employeeId}
                  onChange={(e) => setNewLeaveForm({ ...newLeaveForm, employeeId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.code}) - {emp.departmentName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Từ ngày</label>
                  <input
                    type="date"
                    required
                    value={newLeaveForm.startDate}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Đến ngày</label>
                  <input
                    type="date"
                    required
                    value={newLeaveForm.endDate}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Lý do xin nghỉ</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Lý do cá nhân, khám chữa bệnh..."
                  value={newLeaveForm.reason}
                  onChange={(e) => setNewLeaveForm({ ...newLeaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-semibold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  Nộp đơn phê duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Hồ Sơ Nhân Viên 360° */}
      {selectedEmployee360 && (
        <EmployeeDossier360Modal
          employee={selectedEmployee360}
          attendanceList={attendance}
          leavesList={leaves}
          performanceList={performanceRecords}
          trainingList={trainingRecords}
          onClose={() => setSelectedEmployee360(null)}
          onNotify={onNotify}
        />
      )}

      {/* Modal: Tính Lương & Ghi Sổ GL 360° */}
      {isPayrollGLModalOpen && (
        <PayrollCalculationGLModal
          existingPayroll={selectedPayrollForModal}
          onClose={() => {
            setIsPayrollGLModalOpen(false);
            setSelectedPayrollForModal(null);
          }}
          onSuccess={() => {
            fetchAllData();
          }}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};
