import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, Search, Filter, RefreshCw, Plus, CheckCircle2, 
  AlertTriangle, PauseCircle, PlayCircle, ShieldCheck, Lock, Unlock, 
  MapPin, Eye, ArrowRight, CornerDownRight, Navigation, Truck, Boxes
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';
import { usePagination } from '../../../../hooks/usePagination';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { L3ContentState } from '../../../../components/common/L3ContentState';

export interface RouteScheduleRecord {
  id: string;
  routeCode: string;
  routeName: string;
  sourceHub: string;
  destHub: string;
  frequency: 'DAILY_FIXED' | 'BI_WEEKLY' | 'WEEKLY_HUB' | 'ON_DEMAND';
  dispatchTime: string;
  transitDurationHours: number;
  assignedTruckCategory: string;
  isStagingFrozen: boolean;
  stagingBin: string;
  status: 'ACTIVE' | 'PAUSED';
  nextRunDate: string;
  notes: string;
}

interface TransferRoutesSchedulesTabProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const TransferRoutesSchedulesTab: React.FC<TransferRoutesSchedulesTabProps> = ({
  onNotify
}) => {
  const [routes, setRoutes] = useState<RouteScheduleRecord[]>([
    {
      id: 'RTE-001',
      routeCode: 'RTE-HN-HCM-DAILY',
      routeName: 'Tuyến Bắc Nam Thường Nhật (Hà Nội ➔ TP.HCM / Bình Dương)',
      sourceHub: 'WH-HN-01 (Kho Tổng Hà Nội)',
      destHub: 'WH-HCM-02 (Kho Chi nhánh Nam)',
      frequency: 'DAILY_FIXED',
      dispatchTime: '14:00 hàng ngày',
      transitDurationHours: 36,
      assignedTruckCategory: 'Xe Container 8 Tấn Kín Lạnh',
      isStagingFrozen: true,
      stagingBin: 'STAGING-OUT-HN01',
      status: 'ACTIVE',
      nextRunDate: '10/09/2026 14:00',
      notes: 'Tuyến huyết mạch luân chuyển linh kiện tự động hóa và vật tư dự phòng.'
    },
    {
      id: 'RTE-002',
      routeCode: 'RTE-HN-DN-BIWEEKLY',
      routeName: 'Tuyến Miền Trung Định Kỳ (Hà Nội ➔ Đà Nẵng)',
      sourceHub: 'WH-HN-01 (Kho Tổng Hà Nội)',
      destHub: 'WH-DN-03 (Kho Đà Nẵng)',
      frequency: 'BI_WEEKLY',
      dispatchTime: 'Thứ 3 & Thứ 6 (08:00)',
      transitDurationHours: 16,
      assignedTruckCategory: 'Xe Tải 3.5 Tấn Chuyên Dụng',
      isStagingFrozen: false,
      stagingBin: 'STAGING-OUT-HN02',
      status: 'ACTIVE',
      nextRunDate: '12/09/2026 08:00',
      notes: 'Phục vụ tiếp tế linh kiện thay thế cho xưởng lắp ráp miền Trung.'
    },
    {
      id: 'RTE-003',
      routeCode: 'RTE-CNC-HN-SHUTTLE',
      routeName: 'Tuyến Con Thoi Xưởng Cơ Khí (CNC Thạch Thất ➔ Kho Tổng)',
      sourceHub: 'WH-CNC-03 (Kho Cơ Khí CNC)',
      destHub: 'WH-HN-01 (Kho Tổng Hà Nội)',
      frequency: 'DAILY_FIXED',
      dispatchTime: '17:00 hàng ngày',
      transitDurationHours: 2,
      assignedTruckCategory: 'Xe Bán Tải 1.5 Tấn',
      isStagingFrozen: true,
      stagingBin: 'STAGING-CNC-OUT',
      status: 'ACTIVE',
      nextRunDate: '09/09/2026 17:00',
      notes: 'Thu hồi dụng cụ cắt gọt kim loại và dao phay sau ca tiện CNC.'
    },
    {
      id: 'RTE-004',
      routeCode: 'RTE-HCM-CT-WEEKLY',
      routeName: 'Tuyến Phụ Miền Tây (Bình Dương ➔ Cần Thơ)',
      sourceHub: 'WH-HCM-02 (Kho Chi nhánh Nam)',
      destHub: 'WH-CT-04 (Kho Cần Thơ Hub)',
      frequency: 'WEEKLY_HUB',
      dispatchTime: 'Thứ 2 hàng tuần (07:00)',
      transitDurationHours: 5,
      assignedTruckCategory: 'Xe Tải 2.5 Tấn',
      isStagingFrozen: false,
      stagingBin: 'STAGING-HCM-SW',
      status: 'PAUSED',
      nextRunDate: '15/09/2026 07:00',
      notes: 'Tạm dừng điều chuyển do điều chỉnh lịch trình mùa mưa lũ miền Tây.'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal Create
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  const [newSource, setNewSource] = useState('WH-HN-01');
  const [newDest, setNewDest] = useState('WH-HCM-02');
  const [newFrequency, setNewFrequency] = useState<'DAILY_FIXED' | 'BI_WEEKLY' | 'WEEKLY_HUB' | 'ON_DEMAND'>('DAILY_FIXED');

  // Confirm Dialog (Rule #19)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Filters
  const filteredRoutes = useMemo(() => {
    return routes.filter(r => {
      const matchSearch = 
        r.routeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.sourceHub.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.destHub.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchFreq = frequencyFilter === 'ALL' || r.frequency === frequencyFilter;
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;

      return matchSearch && matchFreq && matchStatus;
    });
  }, [routes, searchQuery, frequencyFilter, statusFilter]);

  // Pagination
  const pagination = usePagination({
    totalItems: filteredRoutes.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedRoutes = useMemo(() => {
    return pagination.paginatedData(filteredRoutes);
  }, [filteredRoutes, pagination]);

  // Metrics
  const totalRoutesCount = routes.length;
  const activeRoutesCount = routes.filter(r => r.status === 'ACTIVE').length;
  const frozenStagingCount = routes.filter(r => r.isStagingFrozen).length;
  const pausedRoutesCount = routes.filter(r => r.status === 'PAUSED').length;

  // Toggle Route Active / Paused (Rule #19)
  const handleToggleRouteStatus = (route: RouteScheduleRecord) => {
    const nextStatus = route.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const actionText = nextStatus === 'ACTIVE' ? 'Kích hoạt lại' : 'Tạm dừng tuyến';

    setConfirmDialog({
      isOpen: true,
      title: `${actionText} ${route.routeCode}?`,
      message: `Hành động này sẽ ${nextStatus === 'ACTIVE' ? 'mở lại lịch trình vận tải cố định định kỳ' : 'tạm ngưng phát hành chuyến tự động'} cho tuyến "${route.routeName}". Xác nhận?`,
      confirmText: actionText,
      cancelText: 'Hủy Bỏ',
      variant: nextStatus === 'ACTIVE' ? 'primary' : 'warning',
      onConfirm: () => {
        setRoutes(prev => prev.map(r => r.id === route.id ? { ...r, status: nextStatus } : r));
        setConfirmDialog(null);
        onNotify('info', `Đã ${actionText}`, `Tuyến ${route.routeCode} hiện đang ở trạng thái ${nextStatus}.`);
      }
    });
  };

  // Toggle Staging Bin Freeze (Rule #19)
  const handleToggleStagingFreeze = (route: RouteScheduleRecord) => {
    const nextFreeze = !route.isStagingFrozen;
    const actionText = nextFreeze ? 'Đóng băng khu vực đệm (Staging Freeze)' : 'Mở khóa khu vực đệm';

    setConfirmDialog({
      isOpen: true,
      title: `${actionText} Vị Trí ${route.stagingBin}?`,
      message: `Hành động này sẽ ${nextFreeze ? 'khóa vị trí bin tập kết hàng xuất điều chuyển, ngăn chặn các tác vụ xuất bán/kiểm kê khác can thiệp' : 'mở lại quyền truy cập tự do cho bin'}. Tuân thủ quy tắc quản trị kho an toàn.`,
      confirmText: actionText,
      cancelText: 'Hủy Bỏ',
      variant: nextFreeze ? 'danger' : 'primary',
      onConfirm: () => {
        setRoutes(prev => prev.map(r => r.id === route.id ? { ...r, isStagingFrozen: nextFreeze } : r));
        setConfirmDialog(null);
        onNotify('success', `Đã ${actionText}`, `Vị trí ${route.stagingBin} đã được ${nextFreeze ? 'đóng băng' : 'mở khóa'}.`);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L1: COMMAND BAR                                                           */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 sm:w-80 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã tuyến, tên tuyến, hub xuất / nhận..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Frequency Filter */}
          <select
            value={frequencyFilter}
            onChange={(e) => setFrequencyFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-900 dark:text-white"
          >
            <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tất cả tần suất</option>
            <option value="DAILY_FIXED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Hàng ngày (Daily Fixed)</option>
            <option value="BI_WEEKLY" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">2 lần / tuần</option>
            <option value="WEEKLY_HUB" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Hàng tuần (Weekly)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-900 dark:text-white"
          >
            <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tất cả trạng thái tuyến</option>
            <option value="ACTIVE" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Đang kích hoạt (Active)</option>
            <option value="PAUSED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tạm dừng (Paused)</option>
          </select>
        </div>

        {/* Create Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thiết Lập Tuyến Cố Định</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: KPI STRIP                                                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Tuyến Vận Chuyển
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
              {totalRoutesCount} <span className="text-xs font-sans font-normal text-slate-500">tuyến</span>
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
              Mạng lưới logistics nội bộ
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
            <Navigation className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tuyến Đang Kích Hoạt
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
              {activeRoutesCount} <span className="text-xs font-sans font-normal text-slate-500">tuyến</span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              Lịch chạy định kỳ chuẩn giờ
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Khu Vực Đệm Đang Đóng Băng
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
              {frozenStagingCount} <span className="text-xs font-sans font-normal text-slate-500">bin</span>
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
              Cách ly hàng hóa chờ bốc xếp
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tuyến Tạm Dừng Hoạt Động
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
              {pausedRoutesCount} <span className="text-xs font-sans font-normal text-slate-500">tuyến</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Chờ đánh giá hiệu suất
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600">
            <PauseCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L3: DATA GRID                                                             */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <L3ContentState
          isLoading={false}
          isEmpty={paginatedRoutes.length === 0}
          emptyMessage="Không có tuyến định kỳ nào phù hợp."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Mã Tuyến & Tên Tuyến</th>
                  <th className="p-3">Hành Trình (Kho Đi ➔ Kho Đến)</th>
                  <th className="p-3">Tần Suất & Giờ Xuất Bến</th>
                  <th className="p-3">Loại Phương Tiện Phục Vụ</th>
                  <th className="p-3 text-center">Đóng Băng Khu Vực Đệm</th>
                  <th className="p-3 text-center">Trạng Thái Tuyến</th>
                  <th className="p-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {paginatedRoutes.map((route, idx) => {
                  const globalIdx = (pagination.currentPage - 1) * pagination.pageSize + idx + 1;

                  return (
                    <tr
                      key={route.id}
                      className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 ${
                        route.status === 'ACTIVE' ? 'border-l-4 border-emerald-500/60' : 'border-l-4 border-slate-300'
                      }`}
                    >
                      {/* STT */}
                      <td className="p-3 text-center font-mono font-bold text-slate-500">
                        {globalIdx}
                      </td>

                      {/* Mã & Tên Tuyến */}
                      <td className="p-3">
                        <div className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          {route.routeCode}
                        </div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-white mt-0.5">
                          {route.routeName}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {route.notes}
                        </div>
                      </td>

                      {/* Tuyến Hub */}
                      <td className="p-3 text-xs">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {route.sourceHub}
                        </div>
                        <div className="font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                          ➔ {route.destHub}
                        </div>
                      </td>

                      {/* Tần Suất */}
                      <td className="p-3">
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          {route.dispatchTime}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          Thời gian chạy: ~{route.transitDurationHours}h
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                          Lần tới: {route.nextRunDate}
                        </div>
                      </td>

                      {/* Loại Phương Tiện */}
                      <td className="p-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {route.assignedTruckCategory}
                      </td>

                      {/* Đóng Băng Khu Vực Đệm (Staging Freeze) */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleStagingFreeze(route)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                            route.isStagingFrozen
                              ? 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 hover:bg-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200'
                          }`}
                          title="Bấm để Đóng Băng / Mở Khóa Vị Trí"
                        >
                          {route.isStagingFrozen ? <Lock className="w-3 h-3 text-rose-700" /> : <Unlock className="w-3 h-3 text-slate-500" />}
                          <span>{route.stagingBin}</span>
                        </button>
                      </td>

                      {/* Trạng Thái Tuyến */}
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 text-[11px] rounded-full border font-bold inline-flex items-center gap-1 ${
                          route.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200'
                            : 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200'
                        }`}>
                          {route.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3 text-emerald-700" /> : <PauseCircle className="w-3 h-3 text-slate-500" />}
                          <span>{route.status}</span>
                        </span>
                      </td>

                      {/* Thao Tác */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleRouteStatus(route)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 ${
                            route.status === 'ACTIVE'
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {route.status === 'ACTIVE' ? <PauseCircle className="w-3 h-3" /> : <PlayCircle className="w-3 h-3" />}
                          <span>{route.status === 'ACTIVE' ? 'Tạm Dừng' : 'Kích Hoạt'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </L3ContentState>

        {/* L4: STICKY FOOTER */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <PaginationControl
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={filteredRoutes.length}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            onPageChange={pagination.goToPage}
            onPageSizeChange={pagination.setPageSize}
            pageSizeOptions={[5, 10, 20, 50, 100]}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG (RULE #19 COMPLIANCE)                                      */}
      {/* ========================================================================= */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
};
