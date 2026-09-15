import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, Plus, Search, Filter, RefreshCw, CheckCircle2, 
  AlertTriangle, ShieldAlert, Edit3, Trash2, Eye, Play, Check, 
  Layers, MapPin, Sliders, ArrowUpRight, FileSpreadsheet, Lock
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';
import { usePagination } from '../../../../hooks/usePagination';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { L3ContentState } from '../../../../components/common/L3ContentState';

export interface StocktakeSchedule {
  id: string;
  code: string;
  name: string;
  warehouseCode: string;
  warehouseName: string;
  frequency: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY_CYCLE' | 'WEEKLY_ABC';
  targetScope: string;
  method: 'BLIND_COUNT' | 'DOUBLE_BLIND' | 'OPEN_COUNT';
  tolerancePercent: number;
  autoFreezeStock: boolean;
  assignedTeam: string;
  nextScheduledDate: string;
  lastRunDate: string;
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT';
}

interface StocktakeSchedulesTabProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const StocktakeSchedulesTab: React.FC<StocktakeSchedulesTabProps> = ({ onNotify }) => {
  const [schedules, setSchedules] = useState<StocktakeSchedule[]>([
    {
      id: 'SCH-001',
      code: 'SCH-HN-CYCLE-A',
      name: 'Kiểm đếm vòng tròn Hàng Nhóm A - Kho Tổng Hà Nội',
      warehouseCode: 'WH-HN-01',
      warehouseName: 'Kho Tổng Hà Nội (Miền Bắc)',
      frequency: 'MONTHLY_CYCLE',
      targetScope: 'SKU Phân hạng Class A (Giá trị cao & Luân chuyển nhanh)',
      method: 'BLIND_COUNT',
      tolerancePercent: 0.5,
      autoFreezeStock: true,
      assignedTeam: 'Đội Kiểm kê 01 (Trưởng nhóm: Nguyễn Văn Kiểm)',
      nextScheduledDate: '25/09/2026',
      lastRunDate: '25/08/2026',
      status: 'ACTIVE'
    },
    {
      id: 'SCH-002',
      code: 'SCH-HCM-QUARTER',
      name: 'Kiểm kê định kỳ Quý 3/2026 - Kho Chi nhánh TP.HCM',
      warehouseCode: 'WH-HCM-02',
      warehouseName: 'Kho Chi nhánh Nam (Bình Dương)',
      frequency: 'QUARTERLY',
      targetScope: 'Toàn bộ Zone A & Zone B (Linh kiện & Thành phẩm)',
      method: 'DOUBLE_BLIND',
      tolerancePercent: 1.0,
      autoFreezeStock: true,
      assignedTeam: 'Đội Kiểm kê Phía Nam (Trưởng nhóm: Trần Văn Nam)',
      nextScheduledDate: '30/09/2026',
      lastRunDate: '30/06/2026',
      status: 'ACTIVE'
    },
    {
      id: 'SCH-003',
      code: 'SCH-CNC-WEEKLY',
      name: 'Kiểm đếm hàng tuần Dao cụ & Phụ tùng CNC',
      warehouseCode: 'WH-CNC-03',
      warehouseName: 'Kho Cơ khí & Phụ tùng CNC',
      frequency: 'WEEKLY_ABC',
      targetScope: 'Danh mục Vật tư tiêu hao có nguy cơ thất thoát',
      method: 'BLIND_COUNT',
      tolerancePercent: 0.2,
      autoFreezeStock: false,
      assignedTeam: 'Tổ Thủ kho CNC (Lê Quốc Tuấn)',
      nextScheduledDate: '15/09/2026',
      lastRunDate: '08/09/2026',
      status: 'ACTIVE'
    },
    {
      id: 'SCH-004',
      code: 'SCH-ANNUAL-ALL',
      name: 'Tổng kiểm kê tài sản & tồn kho toàn quốc Niên độ 2026',
      warehouseCode: 'ALL_WH',
      warehouseName: 'Tất cả các kho trực thuộc NexusSync',
      frequency: 'ANNUAL',
      targetScope: '100% SKU, Tài sản Cố định & Bán thành phẩm',
      method: 'DOUBLE_BLIND',
      tolerancePercent: 0.0,
      autoFreezeStock: true,
      assignedTeam: 'Hội đồng Kiểm kê Trung ương & Kiểm toán độc lập',
      nextScheduledDate: '31/12/2026',
      lastRunDate: '31/12/2025',
      status: 'DRAFT'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [frequencyFilter, setFrequencyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<StocktakeSchedule | null>(null);

  // Confirm Dialog (Rule #19 Compliance)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      setIsLoading(false);
      onNotify('info', 'Làm Mới Lịch Kiểm Kê', 'Đã tải danh sách lịch kiểm đếm và tham số mới nhất.');
    }, 450);
  };

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.targetScope.toLowerCase().includes(searchTerm.toLowerCase());
      const matchWh = warehouseFilter === 'ALL' || s.warehouseCode === warehouseFilter;
      const matchFreq = frequencyFilter === 'ALL' || s.frequency === frequencyFilter;
      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchSearch && matchWh && matchFreq && matchStatus;
    });
  }, [schedules, searchTerm, warehouseFilter, frequencyFilter, statusFilter]);

  const pagination = usePagination({
    totalItems: filteredSchedules.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedSchedules = useMemo(() => {
    return pagination.paginatedData(filteredSchedules);
  }, [filteredSchedules, pagination]);

  const statusBadgeMap: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: 'Đang Áp Dụng', className: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold' },
    PAUSED: { label: 'Tạm Dừng', className: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold' },
    DRAFT: { label: 'Bản Nháp', className: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600' }
  };

  const frequencyLabelMap: Record<string, string> = {
    ANNUAL: 'Hàng Năm (Annual)',
    QUARTERLY: 'Định Kỳ Quý (Quarterly)',
    MONTHLY_CYCLE: 'Cycle Count Hàng Tháng',
    WEEKLY_ABC: 'Hàng Tuần (ABC Focus)'
  };

  const methodLabelMap: Record<string, string> = {
    BLIND_COUNT: 'Kiểm Đếm Mù (Blind)',
    DOUBLE_BLIND: 'Mù Kép (2 Tổ Độc Lập)',
    OPEN_COUNT: 'Kiểm Kê Mở (Thấy Tồn)'
  };

  const handleTriggerNow = (sch: StocktakeSchedule) => {
    setConfirmDialog({
      isOpen: true,
      title: `Khởi Kích Hoạt Phiên Kiểm Kê Ngay?`,
      message: `Hệ thống sẽ tạo ngay một Phiên Kiểm Kê chính thức dựa trên cấu hình "${sch.name}". ${sch.autoFreezeStock ? 'CẢNH BÁO: Vị trí liên quan sẽ tự động bị đóng băng xuất nhập tồn.' : ''}`,
      onConfirm: () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        onNotify('success', 'Đã Kích Hoạt Phiên Kiểm Kê', `Khởi tạo phiên kiểm kê thành công cho ${sch.warehouseName}.`);
      }
    });
  };

  return (
    <div className="space-y-3.5">
      {/* ========================================================================= */}
      {/* L1: COMMAND BAR & FILTER STRIP                                            */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="flex flex-1 items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
            <input
              type="text"
              placeholder="Tìm kiếm mã lịch, tên kế hoạch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả Kho Lưu Trữ</option>
            <option value="WH-HN-01">Kho Tổng Hà Nội</option>
            <option value="WH-HCM-02">Kho Chi nhánh Nam</option>
            <option value="WH-CNC-03">Kho Phụ tùng CNC</option>
          </select>
          <select
            value={frequencyFilter}
            onChange={(e) => setFrequencyFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả Tần Suất</option>
            <option value="ANNUAL">Hàng Năm</option>
            <option value="QUARTERLY">Định Kỳ Quý</option>
            <option value="MONTHLY_CYCLE">Hàng Tháng (Cycle Count)</option>
            <option value="WEEKLY_ABC">Hàng Tuần (ABC)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleRefresh}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingSchedule(null);
              setShowModal(true);
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thiết Lập Lịch Mới</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: KPI SUMMARY CARDS                                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng Lịch Định Kỳ</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {schedules.length}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              {schedules.filter(s => s.status === 'ACTIVE').length} đang áp dụng
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tần Suất Cycle Count</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {schedules.filter(s => s.frequency === 'MONTHLY_CYCLE' || s.frequency === 'WEEKLY_ABC').length}
            </span>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Lịch luân phiên</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đóng Băng Kho Tự Động</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {schedules.filter(s => s.autoFreezeStock).length}
            </span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Bảo vệ toàn vẹn</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dung Sai Cho Phép TB</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Sliders className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {schedules.length > 0 ? (schedules.reduce((acc, s) => acc + s.tolerancePercent, 0) / schedules.length).toFixed(1) : 0}%
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Ngưỡng cảnh báo</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L3: DATA TABLE CONTENT AREA                                               */}
      {/* ========================================================================= */}
      <L3ContentState
        isLoading={isLoading}
        error={error}
        isEmpty={filteredSchedules.length === 0}
        onRetry={handleRefresh}
        emptyTitle="Không tìm thấy lịch kiểm kê nào"
        emptyDescription="Chưa có lịch kiểm kê nào được thiết lập hoặc bộ lọc không tìm thấy kết quả phù hợp."
        emptyAction={{
          label: 'Thiết lập lịch kiểm kê mới',
          onClick: () => setShowModal(true),
          variant: 'primary'
        }}
        skeletonRows={5}
        minHeight="min-h-[380px]"
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 min-w-[150px]">Mã Lịch &amp; Tên Kế Hoạch</th>
                  <th className="py-2.5 px-3 min-w-[150px]">Kho Áp Dụng</th>
                  <th className="py-2.5 px-3 min-w-[130px]">Tần Suất</th>
                  <th className="py-2.5 px-3 min-w-[130px]">Phương Thức</th>
                  <th className="py-2.5 px-2 text-center min-w-[85px]">Dung Sai (%)</th>
                  <th className="py-2.5 px-3 min-w-[110px]">Lịch Kế Tiếp</th>
                  <th className="py-2.5 px-2 text-center min-w-[100px]">Trạng Thái</th>
                  <th className="py-2.5 px-3 text-center min-w-[110px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                {paginatedSchedules.map((sch) => {
                  const statusBadge = statusBadgeMap[sch.status] || statusBadgeMap.DRAFT;
                  const isActive = sch.status === 'ACTIVE';
                  const isAutoFreeze = sch.autoFreezeStock;
                  return (
                    <tr 
                      key={sch.id} 
                      className={`transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 ${
                        isAutoFreeze
                          ? 'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10'
                          : isActive
                          ? 'border-l-4 border-emerald-500/60'
                          : 'border-l-4 border-transparent'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                            {sch.code}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-white mt-1 line-clamp-1">
                          {sch.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {sch.targetScope}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {sch.warehouseName}
                        </div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                          {sch.assignedTeam}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600">
                          {frequencyLabelMap[sch.frequency] || sch.frequency}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                          {methodLabelMap[sch.method] || sch.method}
                        </span>
                        {sch.autoFreezeStock && (
                          <div className="text-[10px] text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1 mt-0.5">
                            <Lock className="w-3 h-3" /> Đóng băng kho
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono tabular-nums font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        ±{sch.tolerancePercent.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200 font-mono text-xs">
                          {sch.nextScheduledDate}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Gần nhất: {sch.lastRunDate}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleTriggerNow(sch)}
                            className="px-2 py-0.5 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                            title="Chạy phiên kiểm kê ngay"
                          >
                            <Play className="w-3 h-3" />
                            <span>Chạy</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingSchedule(sch);
                              setShowModal(true);
                            }}
                            className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-all cursor-pointer"
                            title="Sửa cấu hình"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ========================================================================= */}
          {/* L4: STICKY PAGINATION CONTROL                                             */}
          {/* ========================================================================= */}
          <div className="sticky bottom-0 z-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <PaginationControl
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalItems={filteredSchedules.length}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              onPageChange={pagination.goToPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[5, 10, 20, 50, 100]}
            />
          </div>
        </div>
      </L3ContentState>

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT SCHEDULE                                             */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingSchedule ? 'Chỉnh Sửa Lịch Kiểm Kê' : 'Thiết Lập Kế Hoạch Kiểm Kê Mới'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              setShowModal(false);
              onNotify('success', 'Đã Lưu Thành Công', 'Lịch kiểm kê định kỳ đã được cập nhật vào cơ sở dữ liệu WMS.');
            }} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên Kế Hoạch Kiểm Kê *</label>
                <input
                  type="text"
                  defaultValue={editingSchedule?.name || ''}
                  required
                  placeholder="Ví dụ: Kiểm đếm vòng tròn Hàng Nhóm A..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Kho Áp Dụng</label>
                  <select 
                    defaultValue={editingSchedule?.warehouseCode || 'WH-HN-01'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="WH-HN-01">Kho Tổng Hà Nội</option>
                    <option value="WH-HCM-02">Kho Chi nhánh Nam</option>
                    <option value="WH-CNC-03">Kho Cơ khí CNC</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tần Suất</label>
                  <select 
                    defaultValue={editingSchedule?.frequency || 'MONTHLY_CYCLE'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="MONTHLY_CYCLE">Hàng Tháng (Cycle Count)</option>
                    <option value="WEEKLY_ABC">Hàng Tuần (ABC)</option>
                    <option value="QUARTERLY">Định Kỳ Quý</option>
                    <option value="ANNUAL">Hàng Năm</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phương Thức Kiểm Đếm</label>
                  <select 
                    defaultValue={editingSchedule?.method || 'BLIND_COUNT'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="BLIND_COUNT">Kiểm Đếm Mù (Blind Count)</option>
                    <option value="DOUBLE_BLIND">Mù Kép (Double Blind)</option>
                    <option value="OPEN_COUNT">Kiểm Kê Mở</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Dung Sai Cho Phép (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    defaultValue={editingSchedule?.tolerancePercent || 0.5}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="freezeCheck"
                  defaultChecked={editingSchedule?.autoFreezeStock ?? true}
                  className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="freezeCheck" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  Tự động đóng băng xuất/nhập các Bin liên quan khi kích hoạt phiên đếm
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Lưu Cấu Hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG (Rule #19 Compliance)                                      */}
      {/* ========================================================================= */}
      <ConfirmDialog 
        state={confirmDialog} 
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
};
