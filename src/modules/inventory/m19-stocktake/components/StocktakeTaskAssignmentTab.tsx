import React, { useState, useMemo } from 'react';
import { 
  Users, UserCheck, Search, Filter, RefreshCw, CheckCircle2, 
  AlertTriangle, ShieldAlert, ArrowLeftRight, Clock, Plus, 
  MapPin, Check, Edit3, Eye, ShieldCheck, Layers, Boxes, UserPlus
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState, SelectedEntityContext } from '../../../../types';
import { usePagination } from '../../../../hooks/usePagination';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { L3ContentState } from '../../../../components/common/L3ContentState';

export interface StocktakeTask {
  id: string;
  taskCode: string;
  sessionCode: string;
  warehouseName: string;
  zone: string;
  aisle: string;
  binRange: string;
  totalSkusInZone: number;
  completedSkus: number;
  primaryAssignee: string;
  secondaryAssignee: string; // Đối chiếu chéo (Cross Counter)
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  slaDeadline: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'DOUBLE_CHECKING' | 'COMPLETED';
  notes: string;
}

interface StocktakeTaskAssignmentTabProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  onSelectEntity?: (context: SelectedEntityContext) => void;
}

export const StocktakeTaskAssignmentTab: React.FC<StocktakeTaskAssignmentTabProps> = ({ 
  onNotify,
  onSelectEntity 
}) => {
  const [tasks, setTasks] = useState<StocktakeTask[]>([
    {
      id: 'TSK-001',
      taskCode: 'TSK-STK-09A-01',
      sessionCode: 'STK-HN-2026-09A',
      warehouseName: 'Kho Tổng Hà Nội',
      zone: 'Zone A (Tự động hóa)',
      aisle: 'Dãy Kệ 01 & 02',
      binRange: 'BIN-A01-01 ➔ BIN-A02-12',
      totalSkusInZone: 12,
      completedSkus: 10,
      primaryAssignee: 'Nguyễn Văn Kiểm (Tổ trưởng)',
      secondaryAssignee: 'Phạm Đức Anh (Kế toán kho)',
      priority: 'HIGH',
      slaDeadline: '08/09/2026 12:00',
      status: 'IN_PROGRESS',
      notes: 'Đang kiểm đếm các mã động cơ servo và cảm biến quang'
    },
    {
      id: 'TSK-002',
      taskCode: 'TSK-STK-09A-02',
      sessionCode: 'STK-HN-2026-09A',
      warehouseName: 'Kho Tổng Hà Nội',
      zone: 'Zone B (Linh kiện điện)',
      aisle: 'Dãy Kệ 03 & 04',
      binRange: 'BIN-B01-01 ➔ BIN-B02-08',
      totalSkusInZone: 12,
      completedSkus: 8,
      primaryAssignee: 'Trần Văn Nam (KTV Kho)',
      secondaryAssignee: 'Đỗ Hải Đăng (Kiểm soát viên)',
      priority: 'NORMAL',
      slaDeadline: '08/09/2026 15:30',
      status: 'IN_PROGRESS',
      notes: 'Kiểm đếm cáp tín hiệu và van điện từ'
    },
    {
      id: 'TSK-003',
      taskCode: 'TSK-STK-09C-01',
      sessionCode: 'STK-CNC-2026-09C',
      warehouseName: 'Kho Cơ khí & Phụ tùng CNC',
      zone: 'Zone D (Dao cụ Carbide)',
      aisle: 'Tủ chuyên dụng D01',
      binRange: 'BIN-D01-01 ➔ BIN-D01-20',
      totalSkusInZone: 10,
      completedSkus: 10,
      primaryAssignee: 'Đặng Quốc Huy (KTV Cơ khí)',
      secondaryAssignee: 'Lê Hoàng Sơn (Trưởng kho)',
      priority: 'URGENT',
      slaDeadline: '09/09/2026 11:00',
      status: 'DOUBLE_CHECKING',
      notes: 'Phát hiện sai lệch 4 SKU -> Đang đối chiếu chéo lần 2'
    },
    {
      id: 'TSK-004',
      taskCode: 'TSK-STK-09B-01',
      sessionCode: 'STK-HCM-2026-09B',
      warehouseName: 'Kho Chi nhánh Nam',
      zone: 'Zone C (Phụ tùng)',
      aisle: 'Dãy Kệ C01 ➔ C03',
      binRange: 'BIN-C01-01 ➔ BIN-C03-15',
      totalSkusInZone: 15,
      completedSkus: 15,
      primaryAssignee: 'Trần Thị Kho (Thủ kho)',
      secondaryAssignee: 'Võ Minh Trí (Giám sát)',
      priority: 'NORMAL',
      slaDeadline: '07/09/2026 17:00',
      status: 'COMPLETED',
      notes: 'Đã hoàn tất kiểm đếm và ký biên bản hiện trường'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal / Drawer State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<StocktakeTask | null>(null);

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
      onNotify('info', 'Làm Mới Nhiệm Vụ', 'Đã đồng bộ tiến độ phân công nhiệm vụ kiểm đếm thời gian thực.');
    }, 450);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = t.taskCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.sessionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.primaryAssignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.secondaryAssignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.zone.toLowerCase().includes(searchTerm.toLowerCase());
      const matchZone = zoneFilter === 'ALL' || t.zone.includes(zoneFilter);
      const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchSearch && matchZone && matchPriority && matchStatus;
    });
  }, [tasks, searchTerm, zoneFilter, priorityFilter, statusFilter]);

  const pagination = usePagination({
    totalItems: filteredTasks.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedTasks = useMemo(() => {
    return pagination.paginatedData(filteredTasks);
  }, [filteredTasks, pagination]);

  const statusBadgeMap: Record<string, { label: string; className: string }> = {
    ASSIGNED: { label: 'Đã Phân Công', className: 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 font-semibold' },
    IN_PROGRESS: { label: 'Đang Thực Hiện', className: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 font-bold' },
    DOUBLE_CHECKING: { label: 'Đang Đếm Chéo', className: 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200 dark:border-purple-700 font-bold' },
    COMPLETED: { label: 'Hoàn Tất Nhiệm Vụ', className: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold' }
  };

  const priorityBadgeMap: Record<string, { label: string; className: string }> = {
    URGENT: { label: 'Khẩn Cấp', className: 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold' },
    HIGH: { label: 'Ưu Tiên Cao', className: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold' },
    NORMAL: { label: 'Bình Thường', className: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600' }
  };

  const handleCompleteTask = (task: StocktakeTask) => {
    setConfirmDialog({
      isOpen: true,
      title: `Xác Nhận Hoàn Tất Nhiệm Vụ ${task.taskCode}?`,
      message: `Đội kiểm đếm đã ghi nhận đầy đủ ${task.completedSkus}/${task.totalSkus} SKU trong vùng ${task.zone}. Xác nhận đóng nhiệm vụ?`,
      onConfirm: () => {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'COMPLETED' } : t));
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        onNotify('success', 'Nhiệm Vụ Đã Hoàn Tất', `Đã ghi nhận hoàn tất kiểm đếm cho khu vực ${task.binRange}.`);
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
              placeholder="Tìm mã task, nhân viên, vị trí kệ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả Vùng / Zone</option>
            <option value="Zone A">Zone A (Tự động hóa)</option>
            <option value="Zone B">Zone B (Linh kiện điện)</option>
            <option value="Zone C">Zone C (Phụ tùng)</option>
            <option value="Zone D">Zone D (Dao cụ CNC)</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả Độ Ưu Tiên</option>
            <option value="URGENT">Khẩn Cấp</option>
            <option value="HIGH">Ưu Tiên Cao</option>
            <option value="NORMAL">Bình Thường</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả Trạng Thái</option>
            <option value="IN_PROGRESS">Đang Thực Hiện</option>
            <option value="DOUBLE_CHECKING">Đang Đếm Chéo</option>
            <option value="COMPLETED">Hoàn Tất</option>
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
            onClick={() => setShowAssignModal(true)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Phân Công Nhiệm Vụ</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: KPI SUMMARY CARDS                                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng Nhiệm Vụ Phân Công</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {tasks.length}
            </span>
            <span className="text-[11px] font-medium text-slate-500">tổ kiểm kê</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đang Kiểm Đếm &amp; Đếm Chéo</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
              {tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'DOUBLE_CHECKING').length}
            </span>
            <span className="text-[11px] text-indigo-600 font-medium">hiện trường</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đã Hoàn Tất Khu Vực</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {tasks.filter(t => t.status === 'COMPLETED').length}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">
              ({tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ưu Tiên Khẩn Cấp / Lệch</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
              {tasks.filter(t => t.priority === 'URGENT').length}
            </span>
            <span className="text-[11px] text-rose-600 font-medium">cần xử lý ngay</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L3: DATA TABLE CONTENT AREA                                               */}
      {/* ========================================================================= */}
      <L3ContentState
        isLoading={isLoading}
        error={error}
        isEmpty={filteredTasks.length === 0}
        onRetry={handleRefresh}
        emptyTitle="Không tìm thấy nhiệm vụ kiểm đếm nào"
        emptyDescription="Hãy thử điều chỉnh bộ lọc hoặc phân công thêm nhiệm vụ kiểm đếm mới cho các tổ kho."
        emptyAction={{
          label: 'Phân công nhiệm vụ mới',
          onClick: () => setShowAssignModal(true),
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
                  <th className="py-2.5 px-3 min-w-[130px]">Mã Task &amp; Phiên</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Vùng Kiểm Đếm (Zone / Bin)</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Cặp Nhân Viên Đối Chiếu Chéo</th>
                  <th className="py-2.5 px-2 text-center min-w-[100px]">Tiến Độ SKU</th>
                  <th className="py-2.5 px-3 min-w-[110px]">Hạn Chót SLA</th>
                  <th className="py-2.5 px-2 text-center min-w-[95px]">Độ Ưu Tiên</th>
                  <th className="py-2.5 px-2 text-center min-w-[100px]">Trạng Thái</th>
                  <th className="py-2.5 px-3 text-center min-w-[110px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                {paginatedTasks.map((task) => {
                  const statusBadge = statusBadgeMap[task.status] || statusBadgeMap.ASSIGNED;
                  const priorityBadge = priorityBadgeMap[task.priority] || priorityBadgeMap.NORMAL;
                  const isOverdue = task.status === 'OVERDUE' || task.priority === 'URGENT';
                  const isCompleted = task.status === 'COMPLETED';
                  return (
                    <tr 
                      key={task.id} 
                      className={`transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 ${
                        isOverdue
                          ? 'border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                          : isCompleted
                          ? 'border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10'
                          : 'border-l-4 border-blue-600/30'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                            {task.taskCode}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          {task.sessionCode}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {task.zone}
                        </div>
                        <div className="font-mono text-[10px] text-slate-600 dark:text-slate-300">
                          {task.binRange}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 text-slate-900 dark:text-white font-medium text-xs">
                          <span className="text-blue-700 dark:text-blue-400 font-bold">1:</span> {task.primaryAssignee}
                        </div>
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 text-[10px]">
                          <span className="text-purple-700 dark:text-purple-400 font-bold">2:</span> {task.secondaryAssignee}
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-xs">
                          {task.completedSkus}/{task.totalSkusInZone} SKU
                        </div>
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1 rounded-full mx-auto mt-1 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full transition-all"
                            style={{ width: `${(task.completedSkus / task.totalSkusInZone) * 100}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-mono text-slate-800 dark:text-slate-200 text-xs">
                          {task.slaDeadline}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Theo SLA 4h
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${priorityBadge.className}`}>
                          {priorityBadge.label}
                        </span>
                      </td>

                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {task.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleCompleteTask(task)}
                              className="px-2 py-0.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Hoàn tất nhiệm vụ"
                            >
                              <Check className="w-3 h-3" />
                              <span>Xong</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setShowAssignModal(true);
                            }}
                            className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-all cursor-pointer"
                            title="Điều chuyển nhân sự"
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
              totalItems={filteredTasks.length}
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
      {/* MODAL: ASSIGN / REASSIGN TASK                                             */}
      {/* ========================================================================= */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {selectedTask ? 'Điều Chuyển Phân Công Kiểm Đếm' : 'Phân Công Nhiệm Vụ Kiểm Đếm Mới'}
              </h3>
              <button 
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              setShowAssignModal(false);
              onNotify('success', 'Đã Cập Nhật Phân Công', 'Nhiệm vụ kiểm đếm đã được điều phối cho nhân sự phụ trách.');
            }} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Khu Vực &amp; Dải Kệ (Bin Range) *</label>
                <input
                  type="text"
                  defaultValue={selectedTask?.binRange || 'BIN-A01-01 ➔ BIN-A01-20'}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Kiểm Đếm Viên 1 (Primary)</label>
                  <select 
                    defaultValue={selectedTask?.primaryAssignee || 'Nguyễn Văn Kiểm'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Nguyễn Văn Kiểm">Nguyễn Văn Kiểm (KTV Trưởng)</option>
                    <option value="Trần Văn Nam">Trần Văn Nam (KTV Kho)</option>
                    <option value="Đặng Quốc Huy">Đặng Quốc Huy (KTV Cơ khí)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Đối Chiếu Chéo 2 (Cross-Check)</label>
                  <select 
                    defaultValue={selectedTask?.secondaryAssignee || 'Phạm Đức Anh'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Phạm Đức Anh">Phạm Đức Anh (Kế toán kho)</option>
                    <option value="Đỗ Hải Đăng">Đỗ Hải Đăng (Kiểm soát viên)</option>
                    <option value="Lê Hoàng Sơn">Lê Hoàng Sơn (Trưởng kho)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mức Độ Ưu Tiên</label>
                  <select 
                    defaultValue={selectedTask?.priority || 'NORMAL'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="NORMAL">Bình Thường</option>
                    <option value="HIGH">Ưu Tiên Cao</option>
                    <option value="URGENT">Khẩn Cấp</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hạn Chót SLA</label>
                  <input
                    type="text"
                    defaultValue="08/09/2026 17:00"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Xác Nhận Phân Công
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
