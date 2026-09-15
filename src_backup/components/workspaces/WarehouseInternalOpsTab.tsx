import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, Boxes, Search, Filter, RefreshCw, Plus, CheckCircle2, 
  Clock, AlertTriangle, ShieldAlert, ArrowUpRight, FileSpreadsheet, Eye, 
  Send, CheckSquare, Download, MapPin, Layers, X, User, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ConfirmDialogState, SelectedEntityContext } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import { PaginationControl } from '../common/PaginationControl';
import { L3ContentState } from '../common/L3ContentState';

export interface InternalTask {
  id: string;
  type: 'REPLENISHMENT' | 'RESLOTTING' | 'PUTAWAY' | 'BIN_TRANSFER';
  typeName: string;
  sourceLocation: string;
  destLocation: string;
  sku: string;
  productName: string;
  qty: number;
  unit: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignee: string;
  createdDate: string;
  completedDate?: string;
  warehouseCode: string;
}

interface WarehouseInternalOpsTabProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  onSelectEntity?: (context: SelectedEntityContext) => void;
}

export const WarehouseInternalOpsTab: React.FC<WarehouseInternalOpsTabProps> = ({ onNotify, onSelectEntity }) => {
  const [tasks, setTasks] = useState<InternalTask[]>([
    {
      id: 'TSK-INT-001',
      type: 'REPLENISHMENT',
      typeName: 'Bổ sung kệ lấy hàng (Replenish Pick Face)',
      sourceLocation: 'BIN-B04 (Khu Bulk Lưu Trữ)',
      destLocation: 'BIN-A01 (Khu Pick Nhanh)',
      sku: 'SKU-RAM-16G',
      productName: 'RAM DDR5 16GB Kingston Fury',
      qty: 50,
      unit: 'Thanh',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assignee: 'Nguyễn Văn Kho',
      createdDate: '09/09/2026 08:30',
      warehouseCode: 'WH-MAIN'
    },
    {
      id: 'TSK-INT-002',
      type: 'RESLOTTING',
      typeName: 'Tối ưu hóa vị trí lưu kho (Re-slotting ABC)',
      sourceLocation: 'BIN-C10 (Khu Tầng Cao)',
      destLocation: 'BIN-A02 (Khu Tầng Trệt Mặt Tiền)',
      sku: 'SKU-MED-MON',
      productName: 'Màn hình theo dõi bệnh nhân 7 thông số',
      qty: 10,
      unit: 'Bộ',
      priority: 'NORMAL',
      status: 'PENDING',
      assignee: 'Trần Văn Vận Hành',
      createdDate: '09/09/2026 09:15',
      warehouseCode: 'WH-MAIN'
    },
    {
      id: 'TSK-INT-003',
      type: 'BIN_TRANSFER',
      typeName: 'Điều chuyển Bin phân vùng kiểm tra',
      sourceLocation: 'BIN-A02 (Khu Lưu Trữ)',
      destLocation: 'BIN-QA01 (Khu KCS/Kiểm Tra)',
      sku: 'SKU-MED-ECG',
      productName: 'Máy đo ECG 12 đạo trình',
      qty: 5,
      unit: 'Bộ',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      assignee: 'Lê Văn Kiểm Soát',
      createdDate: '09/09/2026 10:00',
      warehouseCode: 'WH-MAIN'
    },
    {
      id: 'TSK-INT-004',
      type: 'PUTAWAY',
      typeName: 'Xếp hàng sau kiểm nhận (Inbound Putaway)',
      sourceLocation: 'STAGING-IN (Cửa Nhập Hàng)',
      destLocation: 'BIN-B03 (Dãy Kệ B - Tầng 2)',
      sku: 'SKU-SSD-1TB',
      productName: 'Ổ Cứng SSD NVMe 1TB Samsung 980 Pro',
      qty: 30,
      unit: 'Cái',
      priority: 'NORMAL',
      status: 'COMPLETED',
      assignee: 'Phạm Văn Xếp Dỡ',
      createdDate: '08/09/2026 14:20',
      completedDate: '08/09/2026 15:45',
      warehouseCode: 'WH-MAIN'
    },
    {
      id: 'TSK-INT-005',
      type: 'REPLENISHMENT',
      typeName: 'Bổ sung linh kiện dự phòng chuyền lắp ráp',
      sourceLocation: 'BIN-S01 (Kho Linh Kiện)',
      destLocation: 'BIN-LINE01 (Chuyền SMT 01)',
      sku: 'SKU-RES-10K',
      productName: 'Điện trở dán SMD 10K Ohm 0805',
      qty: 2000,
      unit: 'Con',
      priority: 'HIGH',
      status: 'PENDING',
      assignee: 'Chưa phân công',
      createdDate: '09/09/2026 10:45',
      warehouseCode: 'WH-SOUTH'
    }
  ]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // L3 Content Area Loading / Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      setIsLoading(false);
      onNotify('info', 'Làm Mới Dữ Liệu', 'Đã tải lại danh sách nhiệm vụ nội bộ kho.');
    }, 450);
  };

  // Drawers / Dialogs
  const [selectedTask, setSelectedTask] = useState<InternalTask | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ isOpen: false });

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = 
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.assignee.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'ALL' || t.type === typeFilter;
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchSearch && matchType && matchStatus && matchPriority;
    });
  }, [tasks, searchTerm, typeFilter, statusFilter, priorityFilter]);

  // Pagination
  const pagination = usePagination({
    totalItems: filteredTasks.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedItems = useMemo(() => {
    return pagination.paginatedData(filteredTasks);
  }, [pagination, filteredTasks]);

  // KPI Metrics
  const kpis = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const pending = tasks.filter(t => t.status === 'PENDING').length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const urgent = tasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;

    return { total, inProgress, pending, completed, urgent };
  }, [tasks]);

  // Handlers
  const handleCompleteTask = (task: InternalTask) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Hoàn Tất Nhiệm Vụ Kho',
      message: `Xác nhận đã di chuyển thành công ${task.qty} ${task.unit} (${task.sku}) từ ${task.sourceLocation} tới ${task.destLocation}?`,
      confirmLabel: 'Hoàn Tất Ngay',
      variant: 'primary',
      onConfirm: () => {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'COMPLETED', completedDate: new Date().toLocaleString() } : t));
        setConfirmDialog(p => ({ ...p, isOpen: false }));
        onNotify('success', 'Nhiệm vụ hoàn tất', `Nhiệm vụ ${task.id} đã hoàn thành và cập nhật vị trí Bin.`);
      }
    });
  };

  const handleExportExcel = () => {
    const data = tasks.map(t => ({
      'Mã Nhiệm Vụ': t.id,
      'Loại Nhiệm Vụ': t.typeName,
      'Mã SKU': t.sku,
      'Tên Sản Phẩm': t.productName,
      'Số Lượng': t.qty,
      'ĐVT': t.unit,
      'Từ Vị Trí': t.sourceLocation,
      'Tới Vị Trí': t.destLocation,
      'Độ Ưu Tiên': t.priority,
      'Trạng Thái': t.status,
      'Người Phụ Trách': t.assignee,
      'Ngày Tạo': t.createdDate
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Internal_Tasks');
    XLSX.writeFile(wb, `NexusSync_Internal_Tasks_${new Date().toISOString().split('T')[0]}.xlsx`);
    onNotify('info', 'Xuất dữ liệu', 'Đã tải xuống danh sách nhiệm vụ nội bộ Excel.');
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L0: TOP HEADER BAR                                                        */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg">
              <ArrowLeftRight className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              D. Internal Operations &amp; Task Monitoring
            </h2>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-mono font-bold rounded-full border border-indigo-200 dark:border-indigo-800">
              {tasks.length} Nhiệm vụ
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Trung tâm giám sát điều phối nội bộ kho: Bổ sung kệ (Replenish), Tái quy hoạch vị trí (Re-slotting) và Dịch chuyển vị trí Bin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Xuất Excel
          </button>
          
          <button
            onClick={() => {
              const context = {
                action: 'create',
                fromBin: 'BIN-A01',
                toBin: 'BIN-B05',
                sku: 'SKU-RAM-16G',
                productName: 'RAM DDR5 16GB Kingston Fury',
                qty: 10,
                sourceWarehouse: 'WH-MAIN',
                destWarehouse: 'WH-SOUTH',
                title: 'Tạo lệnh chuyển kho liên phân hệ từ M18 sang M21',
              };
              try {
                sessionStorage.setItem('nexus_transfer_context', JSON.stringify(context));
              } catch {}
              window.dispatchEvent(new CustomEvent('nexus-navigate', {
                detail: {
                  route: '/internal-transfers',
                  moduleId: 'M21',
                  context,
                },
              }));
              onNotify('info', 'Chuyển Hướng M21', 'Mở Phân hệ M21 Chuyển Kho Nội Bộ (Single-Writer Authority).');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <span>Tạo Lệnh Chuyển Tại M21 →</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1: KPI METRICS STRIP                                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Tổng Nhiệm Vụ</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1">
            {kpis.total}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tác vụ vận hành kho</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Đang Thực Hiện</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-blue-600 mt-1">
            {kpis.inProgress}
          </div>
          <div className="text-[10px] text-blue-600 font-medium mt-0.5">Đang di dời &amp; cất hàng</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Chờ Xử Lý</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-amber-600 mt-1">
            {kpis.pending}
          </div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">Chưa phân công / chờ thực hiện</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Ưu Tiên Khẩn</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-rose-600 mt-1">
            {kpis.urgent}
          </div>
          <div className="text-[10px] text-rose-600 font-medium mt-0.5">Yêu cầu xử lý tức thì</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Đã Hoàn Tất</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-emerald-600 mt-1">
            {kpis.completed}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Đã cập nhật Bin Location</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: ADVANCED FILTER TOOLBAR                                              */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã task, SKU, tên sản phẩm, nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden"
          >
            <option value="ALL">Tất cả loại nghiệp vụ</option>
            <option value="REPLENISHMENT">Bổ Sung Kệ (Replenish)</option>
            <option value="RESLOTTING">Tái Quy Hoạch (Re-slotting)</option>
            <option value="BIN_TRANSFER">Chuyển Bin (Transfer)</option>
            <option value="PUTAWAY">Cất Hàng (Putaway)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ Xử Lý</option>
            <option value="IN_PROGRESS">Đang Thực Hiện</option>
            <option value="COMPLETED">Đã Hoàn Tất</option>
          </select>
        </div>

        {(searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('ALL');
              setStatusFilter('ALL');
            }}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
          >
            Đặt lại lọc
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* L3: DATA TABLE                                                            */}
      {/* ========================================================================= */}
      <L3ContentState
        isLoading={isLoading}
        error={error}
        isEmpty={paginatedItems.length === 0}
        onRetry={handleRefresh}
        emptyTitle="Không tìm thấy nhiệm vụ nội bộ nào"
        emptyDescription="Không có nhiệm vụ di dời, bổ sung kệ hoặc cất hàng nào phù hợp với bộ lọc hiện tại."
        emptyAction={{
          label: 'Tạo Lệnh Điều Phối Mới',
          onClick: () => setIsCreateModalOpen(true),
          variant: 'primary'
        }}
        skeletonRows={5}
        minHeight="min-h-[380px]"
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Mã Task</th>
                  <th className="py-3 px-4">Loại Nghiệp Vụ</th>
                  <th className="py-3 px-4">Sản Phẩm &amp; SKU</th>
                  <th className="py-3 px-4 text-center">Số Lượng</th>
                  <th className="py-3 px-4">Từ Vị Trí ➔ Tới Vị Trí</th>
                  <th className="py-3 px-4">Phụ Trách</th>
                  <th className="py-3 px-4 text-center">Độ Ưu Tiên</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {paginatedItems.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {task.id}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {task.typeName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{task.productName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{task.sku}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {task.qty.toLocaleString()} {task.unit}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      <span className="text-amber-600 dark:text-amber-400 font-bold">{task.sourceLocation}</span>
                      <span className="mx-1 text-slate-400">➔</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{task.destLocation}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {task.assignee}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold ${
                        task.priority === 'URGENT'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          : task.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : task.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      }`}>
                        {task.status === 'COMPLETED' ? 'HOÀN TẤT' : task.status === 'IN_PROGRESS' ? 'ĐANG LÀM' : 'CHỜ XỬ LÝ'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setIsDetailDrawerOpen(true);
                          }}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                          title="Xem chi tiết nhiệm vụ"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {task.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleCompleteTask(task)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-2xs cursor-pointer"
                          >
                            Hoàn Tất
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ========================================================================= */}
          {/* L4: PINNED PAGINATION FOOTER                                              */}
          {/* ========================================================================= */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
            <PaginationControl
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalItems={filteredTasks.length}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              onPageChange={pagination.goToPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        </div>
      </L3ContentState>

      {/* ========================================================================= */}
      {/* DRAWER: TASK DETAILS                                                      */}
      {/* ========================================================================= */}
      {isDetailDrawerOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                      {selectedTask.id}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {selectedTask.typeName}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Kho: {selectedTask.warehouseCode}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã SKU:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedTask.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tên Sản Phẩm:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTask.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số Lượng Di Chuyển:</span>
                  <span className="font-mono font-bold text-indigo-600">{selectedTask.qty.toLocaleString()} {selectedTask.unit}</span>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                <h4 className="font-bold uppercase text-indigo-900 tracking-wider">Lộ Trình Di Chuyển Bin</h4>
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="p-2 bg-white rounded-lg border border-indigo-200 text-center flex-1">
                    <span className="text-[10px] text-slate-400 block">Nguồn (From)</span>
                    <strong className="text-amber-600">{selectedTask.sourceLocation}</strong>
                  </div>
                  <div className="px-3 text-indigo-600 font-bold">➔</div>
                  <div className="p-2 bg-white rounded-lg border border-indigo-200 text-center flex-1">
                    <span className="text-[10px] text-slate-400 block">Đích (To)</span>
                    <strong className="text-emerald-600">{selectedTask.destLocation}</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nhân viên phụ trách:</span>
                  <span className="font-semibold text-slate-800">{selectedTask.assignee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian tạo lệnh:</span>
                  <span className="font-mono text-slate-700">{selectedTask.createdDate}</span>
                </div>
                {selectedTask.completedDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Thời gian hoàn tất:</span>
                    <span className="font-mono text-emerald-600">{selectedTask.completedDate}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50">
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>
              {selectedTask.status !== 'COMPLETED' && (
                <button
                  onClick={() => {
                    setIsDetailDrawerOpen(false);
                    handleCompleteTask(selectedTask);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Xác Nhận Hoàn Tất
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG (Mandatory Rule #19)                                       */}
      {/* ========================================================================= */}
      <ConfirmDialog
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default WarehouseInternalOpsTab;
