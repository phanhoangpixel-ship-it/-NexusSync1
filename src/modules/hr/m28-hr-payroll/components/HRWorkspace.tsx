import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SelectedEntityContext } from '../../../../types/index';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { useWorkspaceAction } from '../../../../components/shell/DomainWorkspaceShell';
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
  User,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { EmployeeRegistryTab } from './EmployeeRegistryTab';
import { TimeAttendanceTab } from './TimeAttendanceTab';
import { LeaveManagementTab } from './LeaveManagementTab';
import { PayrollGlLedgerTab } from './PayrollGlLedgerTab';
import { EmployeeSelfServiceTab } from './EmployeeSelfServiceTab';
import { PerformanceKpiTab } from './PerformanceKpiTab';
import { TrainingCertificationTab } from './TrainingCertificationTab';
import { HrDmsAuditTab } from './HrDmsAuditTab';

import { CreateEmployeeModal } from './CreateEmployeeModal';
import { CreateLeaveRequestModal } from './CreateLeaveRequestModal';
import { EmployeeDossier360Modal } from './EmployeeDossier360Modal';
import { PayrollCalculationGLModal } from './PayrollCalculationGLModal';
import { HrDossierSealModal } from './HrDossierSealModal';

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
  const { setPrimaryAction } = useWorkspaceAction();
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<
    'EMPLOYEES' | 'ATTENDANCE' | 'LEAVES' | 'PAYROLL' | 'ESS' | 'PERFORMANCE' | 'TRAINING' | 'AUDIT_DMS'
  >('M28', 'EMPLOYEES');

  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [performanceRecords, setPerformanceRecords] = useState<any[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  // Modals state
  const [isCreateEmpModalOpen, setIsCreateEmpModalOpen] = useState(false);
  const [isCreateLeaveModalOpen, setIsCreateLeaveModalOpen] = useState(false);
  const [isEmployee360Open, setIsEmployee360Open] = useState(false);
  const [employee360Target, setEmployee360Target] = useState<any | null>(null);
  const [isPayrollGLModalOpen, setIsPayrollGLModalOpen] = useState(false);
  const [selectedPayrollForModal, setSelectedPayrollForModal] = useState<any | null>(null);
  const [isSealModalOpen, setIsSealModalOpen] = useState(false);

  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (showCreateModal) {
      setIsCreateEmpModalOpen(true);
    }
  }, [showCreateModal]);

  const fetchAllData = useCallback(async () => {
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

      const emps = Array.isArray(empData) ? empData : [];
      setEmployees(emps);
      setAttendance(Array.isArray(attData) ? attData : []);
      setLeaves(Array.isArray(leaveData) ? leaveData : []);
      setPayrolls(Array.isArray(payData) ? payData : []);
      setPerformanceRecords(Array.isArray(perfData) ? perfData : []);
      setTrainingRecords(Array.isArray(trainData) ? trainData : []);

      if (emps.length > 0 && !selectedEmployee) {
        handleSelectEmployee(emps[0]);
      }
    } catch (err) {
      console.error('Error fetching HR data:', err);
      onNotify('danger', 'Lỗi tải dữ liệu', 'Không thể kết nối tới máy chủ HR Core.');
    } finally {
      setLoading(false);
    }
  }, [selectedEmployee, onNotify]);

  useEffect(() => {
    fetchAllData();
  }, []);

  // Primary Action in Global Shell
  useEffect(() => {
    if (activeTab === 'PAYROLL') {
      setPrimaryAction(() => () => setIsPayrollGLModalOpen(true), 'Thẩm Định & Tính Lương 360°');
    } else if (activeTab === 'LEAVES') {
      setPrimaryAction(() => () => setIsCreateLeaveModalOpen(true), 'Tạo Đơn Xin Phép');
    } else if (activeTab === 'AUDIT_DMS') {
      setPrimaryAction(() => () => setIsSealModalOpen(true), 'Niêm Phong Hồ Sơ HR');
    } else {
      setPrimaryAction(() => () => setIsCreateEmpModalOpen(true), 'Thêm Hồ Sơ Nhân Sự');
    }
    return () => setPrimaryAction(undefined, undefined);
  }, [activeTab, setPrimaryAction]);

  const handleSelectEmployee = (emp: any) => {
    setSelectedEmployee(emp);
    onSelectEntity({
      type: 'HR_EMPLOYEE',
      id: emp.id,
      code: emp.code,
      title: `${emp.fullName} — ${emp.position} (${emp.status})`,
      status: emp.status,
      lineage: [
        {
          id: `emp-${emp.id}`,
          type: 'Hồ sơ Nhân sự HRM',
          code: emp.code,
          relation: 'ROOT_EMPLOYEE',
          status: emp.status,
        },
        {
          id: `dept-${emp.departmentId || 1}`,
          type: 'Phòng ban công tác',
          code: emp.departmentName || 'Phòng Kỹ thuật Sản xuất',
          relation: 'DEPARTMENT_ASSIGNMENT',
          status: 'ACTIVE',
        },
        {
          id: `gl-pay-${emp.id}`,
          type: 'Định khoản Lương GL',
          code: `TK-334-${emp.code}`,
          relation: 'PAYROLL_POSTING',
          status: 'LINKED',
        },
      ],
      auditTrail: [
        {
          id: 1,
          action: 'Ký kết Hợp đồng Lao động & Định biên nhân sự',
          timestamp: emp.hireDate || '2023-03-15',
          user: 'Admin HR',
          sha256Checksum: '112233445566778899aabbcc',
        },
        {
          id: 2,
          action: 'Đóng BHXH & Đăng ký Mã số Thuế TNCN',
          timestamp: '2023-04-01',
          user: 'Kế toán trưởng (M30 GL)',
          sha256Checksum: '998877665544332211aabbcc',
        },
      ],
      glEntries: [
        {
          account: 'TK 642 / 622',
          accountName: 'Chi phí Lương Quản lý / Sản xuất',
          debit: emp.baseSalary || 15000000,
          credit: 0,
          description: `Hạch toán chi phí lương ${emp.fullName}`,
        },
        {
          account: 'TK 334',
          accountName: 'Phải trả người lao động',
          debit: 0,
          credit: emp.baseSalary || 15000000,
          description: `Khoản phải trả lương ${emp.fullName}`,
        },
      ],
    });
  };

  const handleOpenEmployee360 = (emp: any) => {
    setEmployee360Target(emp);
    setIsEmployee360Open(true);
  };

  const handleOpenCalculatePayroll = (payrollItem?: any) => {
    setSelectedPayrollForModal(payrollItem || null);
    setIsPayrollGLModalOpen(true);
  };

  return (
    <div id="hr-workspace" className="space-y-6">
      {/* 4 Metric KPI Cards matching Enterprise Standard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div id="kpi-total-emp" className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng nhân sự</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{employees.length}</div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            100% HĐLĐ đang hiệu lực
          </p>
        </div>

        {/* KPI 2 */}
        <div id="kpi-attendance" className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Điểm danh hôm nay</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">80%</div>
          <p className="text-xs text-slate-500 mt-1">4/5 nhân sự đúng giờ ca sáng</p>
        </div>

        {/* KPI 3 */}
        <div id="kpi-leaves-pending" className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Đơn nghỉ chờ duyệt</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">
            {leaves.filter((l) => l.status === 'PENDING').length}
          </div>
          <p className="text-xs text-slate-500 mt-1">SLA phê duyệt trong 24h</p>
        </div>

        {/* KPI 4 */}
        <div
          id="kpi-payroll-fund"
          onClick={() => handleOpenCalculatePayroll()}
          className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Quỹ lương tháng</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-600">
            {payrolls[0] ? `${(payrolls[0].totalNet / 1000000).toFixed(1)} Tr` : '80.3 Tr'}
          </div>
          <p className="text-xs text-purple-700 dark:text-purple-400 font-semibold mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-500" /> Bấm tính lương &amp; ghi sổ GL 360°
          </p>
        </div>
      </div>

      {/* Navigation Tab Bar (Master Enterprise Spec with Smooth Scroll & Full Visibility) */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center gap-1">
        {/* Left Scroll Button */}
        <button
          type="button"
          onClick={() => scrollTabs('left')}
          title="Cuộn sang trái"
          className="shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex items-center justify-center cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Tab Scroll Track */}
        <div 
          ref={tabsContainerRef}
          className="flex items-center gap-1.5 overflow-x-auto scroll-smooth no-scrollbar flex-1 py-0.5"
        >
          {/* Tab 1: Employees */}
          <button
            id="tab-emp-list"
            onClick={() => setActiveTab('EMPLOYEES')}
            className={`px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'EMPLOYEES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Hồ sơ Nhân sự</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                activeTab === 'EMPLOYEES'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {employees.length}
            </span>
          </button>

          {/* Tab 2: Attendance */}
          <button
            id="tab-attendance"
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'ATTENDANCE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Chấm công &amp; Điểm danh</span>
          </button>

          {/* Tab 3: Leaves */}
          <button
            id="tab-leaves"
            onClick={() => setActiveTab('LEAVES')}
            className={`px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'LEAVES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Đơn Nghỉ phép</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                activeTab === 'LEAVES'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {leaves.length}
            </span>
          </button>

          {/* Tab 4: Payroll & GL */}
          <button
            id="tab-payroll"
            onClick={() => setActiveTab('PAYROLL')}
            className={`px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'PAYROLL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>Bảng Lương &amp; Hạch toán GL</span>
          </button>

          {/* Tab 5: ESS Portal */}
          <button
            id="tab-ess"
            onClick={() => setActiveTab('ESS')}
            className={`px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'ESS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Cổng ESS Cá nhân</span>
          </button>

          {/* Tab 6: Performance */}
          <button
            id="tab-performance"
            onClick={() => setActiveTab('PERFORMANCE')}
            className={`px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'PERFORMANCE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>Đánh giá KPI</span>
          </button>

          {/* Tab 7: Training */}
          <button
            id="tab-training"
            onClick={() => setActiveTab('TRAINING')}
            className={`px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'TRAINING'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4 shrink-0" />
            <span>Đào tạo &amp; Chứng chỉ</span>
          </button>

          {/* Tab 8: Audit & DMS */}
          <button
            id="tab-dms-audit"
            onClick={() => setActiveTab('AUDIT_DMS')}
            className={`px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'AUDIT_DMS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Hồ sơ DMS &amp; Kiểm toán</span>
          </button>
        </div>

        {/* Right Scroll Button */}
        <button
          type="button"
          onClick={() => scrollTabs('right')}
          title="Cuộn sang phải"
          className="shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex items-center justify-center cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'EMPLOYEES' && (
        <EmployeeRegistryTab
          employees={employees}
          loading={loading}
          selectedEmployee={selectedEmployee}
          onSelectEmployee={handleSelectEmployee}
          onOpenEmployee360={handleOpenEmployee360}
          onOpenCreateEmpModal={() => setIsCreateEmpModalOpen(true)}
          onOpenCalculatePayroll={handleOpenCalculatePayroll}
          onRefresh={fetchAllData}
          onNotify={onNotify}
        />
      )}

      {activeTab === 'ATTENDANCE' && (
        <TimeAttendanceTab
          attendanceList={attendance}
          loading={loading}
          onRefresh={fetchAllData}
          onNotify={onNotify}
        />
      )}

      {activeTab === 'LEAVES' && (
        <LeaveManagementTab
          leaves={leaves}
          employees={employees}
          loading={loading}
          onOpenCreateLeaveModal={() => setIsCreateLeaveModalOpen(true)}
          onRefresh={fetchAllData}
          onNotify={onNotify}
        />
      )}

      {activeTab === 'PAYROLL' && (
        <PayrollGlLedgerTab
          payrolls={payrolls}
          employees={employees}
          loading={loading}
          onOpenCalculatePayroll={handleOpenCalculatePayroll}
          onRefresh={fetchAllData}
          onNotify={onNotify}
        />
      )}

      {activeTab === 'ESS' && (
        <EmployeeSelfServiceTab
          currentEmployee={selectedEmployee || employees[0]}
          attendanceList={attendance}
          leavesList={leaves}
          onOpenCreateLeaveModal={() => setIsCreateLeaveModalOpen(true)}
          onRefresh={fetchAllData}
          onNotify={onNotify}
        />
      )}

      {activeTab === 'PERFORMANCE' && (
        <PerformanceKpiTab
          performanceRecords={performanceRecords}
          loading={loading}
          onRefresh={fetchAllData}
          onNotify={onNotify}
        />
      )}

      {activeTab === 'TRAINING' && (
        <TrainingCertificationTab
          trainingRecords={trainingRecords}
          loading={loading}
          onRefresh={fetchAllData}
          onNotify={onNotify}
        />
      )}

      {activeTab === 'AUDIT_DMS' && (
        <HrDmsAuditTab
          onOpenSealModal={() => setIsSealModalOpen(true)}
          onRefresh={fetchAllData}
          onNotify={onNotify}
        />
      )}

      {/* Modals */}
      <CreateEmployeeModal
        isOpen={isCreateEmpModalOpen}
        onClose={() => {
          setIsCreateEmpModalOpen(false);
          if (onCloseCreateModal) onCloseCreateModal();
        }}
        onSuccess={fetchAllData}
        onNotify={onNotify}
      />

      <CreateLeaveRequestModal
        isOpen={isCreateLeaveModalOpen}
        onClose={() => setIsCreateLeaveModalOpen(false)}
        employees={employees}
        onSuccess={fetchAllData}
        onNotify={onNotify}
      />

      <EmployeeDossier360Modal
        employee={employee360Target}
        attendanceList={attendance}
        leavesList={leaves}
        performanceList={performanceRecords}
        trainingList={trainingRecords}
        onClose={() => {
          setIsEmployee360Open(false);
          setEmployee360Target(null);
        }}
        onNotify={onNotify}
      />

      <PayrollCalculationGLModal
        isOpen={isPayrollGLModalOpen}
        onClose={() => {
          setIsPayrollGLModalOpen(false);
          setSelectedPayrollForModal(null);
        }}
        onSuccess={fetchAllData}
        onNotify={onNotify}
      />

      <HrDossierSealModal
        isOpen={isSealModalOpen}
        onClose={() => setIsSealModalOpen(false)}
        employeesCount={employees.length}
        payrollsCount={payrolls.length}
        onSuccess={fetchAllData}
        onNotify={onNotify}
      />
    </div>
  );
};

export default HRWorkspace;
