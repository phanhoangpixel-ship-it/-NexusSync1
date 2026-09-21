import React, { useState } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Plus,
  Eye,
  FileDown,
  Building,
  Phone,
  Mail,
  CreditCard,
  Layers,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { downloadPayslipPdf } from '../../../../utils/pdfExporter';

interface EmployeeRegistryTabProps {
  employees: any[];
  loading: boolean;
  selectedEmployee: any | null;
  onSelectEmployee: (emp: any) => void;
  onOpenEmployee360: (emp: any) => void;
  onOpenCreateEmpModal: () => void;
  onOpenCalculatePayroll: (emp?: any) => void;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const EmployeeRegistryTab: React.FC<EmployeeRegistryTabProps> = ({
  employees,
  loading,
  selectedEmployee,
  onSelectEmployee,
  onOpenEmployee360,
  onOpenCreateEmpModal,
  onOpenCalculatePayroll,
  onRefresh,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const departments = Array.from(new Set(employees.map((e) => e.departmentName).filter(Boolean)));

  const filteredEmployees = employees.filter((e) => {
    const matchesSearch =
      e.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.phone?.includes(searchQuery) ||
      e.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = departmentFilter === 'ALL' || e.departmentName === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleDownloadPayslip = (emp: any) => {
    try {
      const fileName = downloadPayslipPdf(emp);
      onNotify('success', 'Đã Xuất Phiếu Lương PDF', `File [${fileName}] đã được xuất và tải về máy thành công.`);
    } catch (err) {
      onNotify('danger', 'Lỗi Xuất File', 'Không thể tạo file PDF phiếu lương.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Chính thức (Active)
          </span>
        );
      case 'PROBATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Thử việc
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Nghỉ chế độ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo mã nhân viên, họ tên, vị trí, email..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="ALL">Tất cả phòng ban</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Chính thức (Active)</option>
            <option value="PROBATION">Thử việc</option>
            <option value="ON_LEAVE">Nghỉ chế độ</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Chế độ bảng"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Chế độ thẻ"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenCreateEmpModal}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Nhân Viên</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Nhân sự</th>
                  <th className="py-3 px-4">Mã NV</th>
                  <th className="py-3 px-4">Phòng ban &amp; Vị trí</th>
                  <th className="py-3 px-4">Liên hệ</th>
                  <th className="py-3 px-4 text-right">Lương cơ bản</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      Không tìm thấy hồ sơ nhân sự phù hợp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isSelected = selectedEmployee?.id === emp.id;
                    return (
                      <tr
                        key={emp.id}
                        onClick={() => onSelectEmployee(emp)}
                        className={`hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50/60 dark:bg-blue-950/30' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                              {emp.fullName
                                ? emp.fullName
                                    .split(' ')
                                    .slice(-2)
                                    .map((n: string) => n[0])
                                    .join('')
                                : 'NV'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{emp.fullName}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal">
                                  {emp.gender === 'NAM' ? 'Nam' : 'Nữ'}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {emp.email || 'nv@nexussync.vn'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {emp.code}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900 dark:text-slate-200">
                            {emp.departmentName || 'Khối Sản xuất'}
                          </div>
                          <div className="text-xs text-slate-500">{emp.position || 'Nhân viên'}</div>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                          <div>{emp.phone || '0908 123 456'}</div>
                          <div className="text-[11px] text-slate-400">{emp.bankAccount || 'Đang cập nhật'}</div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {(emp.baseSalary || 15000000).toLocaleString('vi-VN')} ₫
                        </td>

                        <td className="py-3.5 px-4 text-center">{getStatusBadge(emp.status)}</td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onOpenEmployee360(emp)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Hồ sơ 360° & Hạch toán"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>360°</span>
                            </button>
                            <button
                              onClick={() => handleDownloadPayslip(emp)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Tải phiếu lương PDF (Xác thực SHA-256)"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const isSelected = selectedEmployee?.id === emp.id;
            return (
              <div
                key={emp.id}
                onClick={() => onSelectEmployee(emp)}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-xs hover:shadow-md transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200/90 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {emp.fullName
                        ? emp.fullName
                            .split(' ')
                            .slice(-2)
                            .map((n: string) => n[0])
                            .join('')
                        : 'NV'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{emp.fullName}</h4>
                      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {emp.code}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(emp.status)}
                </div>

                <div className="space-y-2 py-2 border-y border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Phòng ban:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{emp.departmentName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Vị trí:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{emp.position}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Lương cơ bản:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {(emp.baseSalary || 15000000).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onOpenEmployee360(emp)}
                    className="flex-1 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem Hồ Sơ 360°</span>
                  </button>
                  <button
                    onClick={() => handleDownloadPayslip(emp)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Xuất PDF"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
