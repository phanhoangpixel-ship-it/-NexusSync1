import React, { useState, useMemo } from 'react';
import { 
  ClipboardCheck, Search, Filter, RefreshCw, Plus, CheckCircle2, 
  AlertTriangle, ShieldAlert, ArrowUpRight, FileSpreadsheet, Eye, 
  Send, CheckSquare, Download, MapPin, Layers, X, User, Check,
  Calendar, ShieldCheck, Clock, FileText, Lock, Unlock, Boxes
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState, SelectedEntityContext } from '../../../../types';
import { usePagination } from '../../../../hooks/usePagination';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { L3ContentState } from '../../../../components/common/L3ContentState';
import { ENTERPRISE_MASTER_PRODUCTS } from '../../../../data/enterpriseMaster';

export interface StocktakeMasterSession {
  id: string;
  sessionCode: string;
  title: string;
  warehouseCode: string;
  warehouseName: string;
  zone: string;
  type: 'BLIND_COUNT' | 'DOUBLE_BLIND' | 'FULL_COUNT' | 'CYCLE_COUNT';
  scope: string;
  status: 'DRAFT' | 'COUNTING' | 'RECOUNT' | 'PENDING_APPROVAL' | 'APPROVED' | 'CLOSED';
  createdAt: string;
  createdBy: string;
  totalSkus: number;
  countedSkus: number;
  varianceCount: number;
  totalVarianceValue: number;
  supervisor: string;
  isFrozen: boolean;
  notes: string;
}

interface StocktakeMasterSessionsTabProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  onSelectEntity?: (context: SelectedEntityContext) => void;
  onOpenSessionCount?: (sessionId: string) => void;
}

export const StocktakeMasterSessionsTab: React.FC<StocktakeMasterSessionsTabProps> = ({ 
  onNotify, 
  onSelectEntity,
  onOpenSessionCount 
}) => {
  const [sessions, setSessions] = useState<StocktakeMasterSession[]>([
    {
      id: 'STK-2026-001',
      sessionCode: 'STK-HN-2026-09A',
      title: 'Kiểm kê định kỳ Kho Tổng Hà Nội Q3/2026',
      warehouseCode: 'WH-HN-01',
      warehouseName: 'Kho Tổng Hà Nội (Miền Bắc)',
      zone: 'Zone A & Zone B',
      type: 'BLIND_COUNT',
      scope: 'Danh mục Thiết bị tự động hóa & Động cơ Servo',
      status: 'COUNTING',
      createdAt: '2026-09-08 08:30',
      createdBy: 'Nguyễn Văn Kiểm (KTV Kho)',
      totalSkus: 24,
      countedSkus: 18,
      varianceCount: 3,
      totalVarianceValue: -12500000,
      supervisor: 'Lê Hoàng Sơn (Trưởng kho HN)',
      isFrozen: true,
      notes: 'Đang triển khai đếm mù đợt 1 tại Aisle 01-04'
    },
    {
      id: 'STK-2026-002',
      sessionCode: 'STK-HCM-2026-09B',
      title: 'Kiểm kê đột xuất Kho Linh kiện Chi nhánh Nam',
      warehouseCode: 'WH-HCM-02',
      warehouseName: 'Kho Chi nhánh Nam (Bình Dương)',
      zone: 'Zone C (Phụ tùng)',
      type: 'CYCLE_COUNT',
      scope: 'Nhóm vật tư Van điện từ & Khí nén cao cấp',
      status: 'PENDING_APPROVAL',
      createdAt: '2026-09-07 14:00',
      createdBy: 'Trần Thị Kho (Thủ kho)',
      totalSkus: 15,
      countedSkus: 15,
      varianceCount: 2,
      totalVarianceValue: 4200000,
      supervisor: 'Võ Minh Trí (Giám sát Kho Vận)',
      isFrozen: true,
      notes: 'Đã hoàn tất kiểm đếm chéo 2 lần. Chờ Giám đốc Vận hành ký duyệt bù trừ.'
    },
    {
      id: 'STK-2026-003',
      sessionCode: 'STK-CNC-2026-09C',
      title: 'Cycle Count Dao phay & Mũi khoan CNC tuần 36',
      warehouseCode: 'WH-CNC-03',
      warehouseName: 'Kho Cơ khí & Phụ tùng CNC',
      zone: 'Zone D (Dao cụ)',
      type: 'BLIND_COUNT',
      scope: 'Toàn bộ Dao cụ Carbide & Collet Chuck',
      status: 'RECOUNT',
      createdAt: '2026-09-09 09:15',
      createdBy: 'Đặng Quốc Huy (KTV Cơ khí)',
      totalSkus: 10,
      countedSkus: 10,
      varianceCount: 4,
      totalVarianceValue: -8900000,
      supervisor: 'Lê Hoàng Sơn (Trưởng kho HN)',
      isFrozen: true,
      notes: 'Chênh lệch vượt ngưỡng dung sai 0.5% -> Yêu cầu đếm lại lần 2 (Recount).'
    },
    {
      id: 'STK-2026-004',
      sessionCode: 'STK-HN-2026-08FIN',
      title: 'Tổng kiểm kê đối soát tháng 08/2026 đã chốt sổ',
      warehouseCode: 'WH-HN-01',
      warehouseName: 'Kho Tổng Hà Nội (Miền Bắc)',
      zone: 'Toàn bộ Kho',
      type: 'FULL_COUNT',
      scope: 'Tất cả 100% SKU lưu kho',
      status: 'APPROVED',
      createdAt: '2026-08-31 17:00',
      createdBy: 'Hội đồng Kiểm Kê',
      totalSkus: 120,
      countedSkus: 120,
      varianceCount: 6,
      totalVarianceValue: -2100000,
      supervisor: 'Phạm Đức Anh (Kế toán trưởng)',
      isFrozen: false,
      notes: 'Đã hoàn tất hạch toán Stock Adjustment vào Sổ cái GL và khôi phục hoạt động kho.'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drawer / Modals
  const [selectedSession, setSelectedSession] = useState<StocktakeMasterSession | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      onNotify('info', 'Làm Mới Phiên Kiểm Kê', 'Đã tải danh sách phiên kiểm kê và trạng thái hiện trường mới nhất.');
    }, 450);
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchSearch = s.sessionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.scope.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.supervisor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchWh = warehouseFilter === 'ALL' || s.warehouseCode === warehouseFilter;
      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const matchType = typeFilter === 'ALL' || s.type === typeFilter;
      return matchSearch && matchWh && matchStatus && matchType;
    });
  }, [sessions, searchTerm, warehouseFilter, statusFilter, typeFilter]);

  const pagination = usePagination({
    totalItems: filteredSessions.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedSessions = useMemo(() => {
    return pagination.paginatedData(filteredSessions);
  }, [filteredSessions, pagination]);

  const statusBadgeMap: Record<string, { label: string; className: string }> = {
    DRAFT: { label: 'Bản Nháp', className: 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 font-semibold' },
    COUNTING: { label: 'Đang Kiểm Đếm', className: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 font-bold' },
    RECOUNT: { label: 'Yêu Cầu Đếm Lại', className: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold' },
    PENDING_APPROVAL: { label: 'Chờ Phê Duyệt', className: 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200 dark:border-purple-700 font-bold' },
    APPROVED: { label: 'Đã Duyệt & Đồng Bộ', className: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold' },
    CLOSED: { label: 'Đã Đóng Sổ', className: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600' }
  };

  const typeLabelMap: Record<string, string> = {
    BLIND_COUNT: 'Kiểm Đếm Mù (Blind)',
    DOUBLE_BLIND: 'Mù Kép (Double Blind)',
    CYCLE_COUNT: 'Kiểm Đếm Vòng Tròn',
    FULL_COUNT: 'Tổng Kiểm Kê Toàn Bộ'
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredSessions.map(s => ({
        'Mã Phiên': s.sessionCode,
        'Tiêu Đề': s.title,
        'Kho Vận': s.warehouseName,
        'Zone': s.zone,
        'Phương Thức': typeLabelMap[s.type] || s.type,
        'Tổng SKU': s.totalSkus,
        'Đã Đếm': s.countedSkus,
        'Số SKU Lệch': s.varianceCount,
        'Giá Trị Chênh Lệch (VNĐ)': s.totalVarianceValue,
        'Trạng Thái': statusBadgeMap[s.status]?.label || s.status,
        'Người Giám Sát': s.supervisor,
        'Ngày Tạo': s.createdAt
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach_Phien_Kiem_Ke');
      XLSX.writeFile(wb, `NexusSync_Stocktake_Sessions_${new Date().toISOString().slice(0, 10)}.xlsx`);
      onNotify('success', 'Xuất File Excel Thành Công', 'Đã xuất dữ liệu phiên kiểm kê ra file Excel.');
    } catch (err) {
      onNotify('error', 'Lỗi Xuất File', 'Không thể xuất dữ liệu ra file Excel.');
    }
  };

  const handleOpenDrawer = (session: StocktakeMasterSession) => {
    setSelectedSession(session);
    setIsDetailDrawerOpen(true);
    if (onSelectEntity) {
      onSelectEntity({
        type: 'INVENTORY_ITEM',
        id: session.id,
        code: session.sessionCode,
        title: session.title,
        data: session
      });
    }
  };

  const handleApproveSession = (session: StocktakeMasterSession) => {
    setConfirmDialog({
      isOpen: true,
      title: `Phê Duyệt Kết Quả Kiểm Kê ${session.sessionCode}?`,
      message: `Hệ thống sẽ tự động tạo Bút toán Điều chỉnh tồn kho (Stock Adjustment) với giá trị sai lệch ${session.totalVarianceValue.toLocaleString('vi-VN')} ₫ và đồng bộ trực tiếp vào Inventory Core & Sổ cái GL theo Rule #03. Đồng thời mở khóa đóng băng kho.`,
      onConfirm: () => {
        setSessions(prev => prev.map(s => s.id === session.id ? { ...s, status: 'APPROVED', isFrozen: false } : s));
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        onNotify('success', 'Đã Phê Duyệt Thành Công', `Phiên kiểm kê ${session.sessionCode} đã được phê duyệt và ghi sổ cái bất biến.`);
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
              placeholder="Tìm theo mã phiên STK, tiêu đề..."
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
            <option value="WH-CNC-03">Kho Cơ khí CNC</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả Trạng Thái</option>
            <option value="DRAFT">Bản Nháp</option>
            <option value="COUNTING">Đang Kiểm Đếm</option>
            <option value="RECOUNT">Yêu Cầu Đếm Lại</option>
            <option value="PENDING_APPROVAL">Chờ Phê Duyệt</option>
            <option value="APPROVED">Đã Duyệt</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả Phương Thức</option>
            <option value="BLIND_COUNT">Blind Count (Đếm Mù)</option>
            <option value="DOUBLE_BLIND">Double Blind (Mù Kép)</option>
            <option value="CYCLE_COUNT">Cycle Count (Vòng Tròn)</option>
            <option value="FULL_COUNT">Full Count (Tổng Kiểm Kê)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
            title="Xuất Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>
          <button
            onClick={handleRefresh}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Phiên Mới</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: KPI SUMMARY CARDS                                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng Phiên Kiểm Kê</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ClipboardCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {sessions.length}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              {sessions.filter(s => s.status === 'APPROVED').length} đã hoàn tất
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đang Thực Hiện Đếm</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Clock className="w-3.5 h-3.5 animate-spin" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {sessions.filter(s => s.status === 'COUNTING' || s.status === 'RECOUNT').length}
            </span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Hiện trường WMS</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chờ Ban Giám Đốc Duyệt</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {sessions.filter(s => s.status === 'PENDING_APPROVAL').length}
            </span>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Cần ký duyệt</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng Giá Trị Lệch Tồn</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
              {sessions.reduce((acc, s) => acc + s.totalVarianceValue, 0).toLocaleString('vi-VN')} ₫
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Tổng hao hụt / dôi thừa ròng</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L3: DATA TABLE CONTENT AREA                                               */}
      {/* ========================================================================= */}
      <L3ContentState
        isLoading={isLoading}
        error={error}
        isEmpty={filteredSessions.length === 0}
        onRetry={handleRefresh}
        emptyTitle="Không có kỳ kiểm kê nào"
        emptyDescription="Không tìm thấy kỳ kiểm kê nào phù hợp với điều kiện tìm kiếm hoặc bộ lọc hiện tại."
        emptyAction={{
          label: 'Tạo kỳ kiểm kê mới',
          onClick: () => setShowCreateModal(true),
          variant: 'primary'
        }}
        skeletonRows={6}
        minHeight="min-h-[420px]"
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 min-w-[140px]">Mã Phiên / Tiêu Đề</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Kho &amp; Vùng Kiểm Đếm</th>
                  <th className="py-2.5 px-3 min-w-[130px]">Phương Thức &amp; Khóa Kho</th>
                  <th className="py-2.5 px-2 text-center min-w-[90px]">Tiến Độ SKU</th>
                  <th className="py-2.5 px-2 text-center min-w-[85px]">SKU Lệch</th>
                  <th className="py-2.5 px-3 text-right min-w-[120px]">Giá Trị Chênh Lệch</th>
                  <th className="py-2.5 px-2 text-center min-w-[100px]">Trạng Thái</th>
                  <th className="py-2.5 px-3 text-center min-w-[120px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                {paginatedSessions.map((session) => {
                  const statusBadge = statusBadgeMap[session.status] || statusBadgeMap.DRAFT;
                  const isSelected = selectedSession?.id === session.id;
                  const isFrozen = session.isFrozen;
                  return (
                    <tr 
                      key={session.id} 
                      onClick={() => handleOpenDrawer(session)}
                      className={`transition-all duration-150 cursor-pointer group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 ${
                        isSelected
                          ? 'border-l-4 border-blue-600 bg-blue-50/70 dark:bg-slate-700/80 shadow-2xs'
                          : isFrozen
                          ? 'border-l-4 border-amber-500 bg-amber-50/20 dark:bg-amber-950/20'
                          : 'border-l-4 border-transparent'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                            {session.sessionCode}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-white mt-1 line-clamp-1">
                          {session.title}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" /> {session.createdAt}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {session.warehouseName}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-400" /> {session.zone}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          {typeLabelMap[session.type] || session.type}
                        </div>
                        <div className="mt-0.5">
                          {session.isFrozen ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 dark:text-rose-300 font-bold">
                              <Lock className="w-3 h-3" /> Đang khóa kho
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                              <Unlock className="w-3 h-3" /> Mở khóa xuất nhập
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-xs">
                          {session.countedSkus}/{session.totalSkus}
                        </div>
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full transition-all"
                            style={{ width: `${(session.countedSkus / session.totalSkus) * 100}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                          session.varianceCount > 0 
                            ? 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700' 
                            : 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                        }`}>
                          {session.varianceCount} SKU lệch
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono tabular-nums font-bold">
                        <span className={session.totalVarianceValue < 0 ? 'text-rose-700 dark:text-rose-300' : session.totalVarianceValue > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}>
                          {session.totalVarianceValue > 0 ? '+' : ''}{session.totalVarianceValue.toLocaleString('vi-VN')} ₫
                        </span>
                      </td>

                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              if (onOpenSessionCount) {
                                onOpenSessionCount(session.id);
                              } else {
                                handleOpenDrawer(session);
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                            title="Mở Bàn Kiểm Đếm"
                          >
                            <Boxes className="w-3.5 h-3.5" />
                            <span>Vào Đếm</span>
                          </button>

                          {session.status === 'PENDING_APPROVAL' && (
                            <button
                              onClick={() => handleApproveSession(session)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Phê duyệt kết quả"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Duyệt</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenDrawer(session)}
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                            title="Xem chi tiết 360"
                          >
                            <Eye className="w-4 h-4" />
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
              totalItems={filteredSessions.length}
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
      {/* DRAWER 360: SESSION DETAIL & RECONCILIATION AUDIT                         */}
      {/* ========================================================================= */}
      {isDetailDrawerOpen && selectedSession && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-700 animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                    {selectedSession.sessionCode}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {selectedSession.type}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {selectedSession.title}
                </h2>
              </div>
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 block mb-0.5">Kho Kiểm Kê:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedSession.warehouseName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Vùng / Zone:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedSession.zone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Người Giám Sát:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedSession.supervisor}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Ngày Khởi Tạo:</span>
                  <span className="font-mono text-slate-900 dark:text-white">{selectedSession.createdAt}</span>
                </div>
              </div>

              {/* Progress & Variance Banner */}
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Tiến Độ Thực Hiện</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {selectedSession.countedSkus} / {selectedSession.totalSkus} SKUs ({Math.round((selectedSession.countedSkus / selectedSession.totalSkus) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${(selectedSession.countedSkus / selectedSession.totalSkus) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600 dark:text-slate-400">
                  <span>Số SKU chênh lệch: <strong className="text-rose-600 font-mono">{selectedSession.varianceCount}</strong></span>
                  <span>Tổng giá trị lệch: <strong className="text-rose-600 font-mono">{selectedSession.totalVarianceValue.toLocaleString('vi-VN')} ₫</strong></span>
                </div>
              </div>

              {/* Sample Items in Session */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2">
                  Danh Mục Mặt Hàng Trong Phiên
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                      <tr>
                        <th className="p-2.5">Mã SKU</th>
                        <th className="p-2.5">Tên Sản Phẩm</th>
                        <th className="p-2.5 text-center">Tồn Sách</th>
                        <th className="p-2.5 text-center">Thực Tế</th>
                        <th className="p-2.5 text-right">Lệch (₫)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      <tr>
                        <td className="p-2.5 font-mono text-blue-600 font-bold">SKU-ENG-088</td>
                        <td className="p-2.5 text-slate-900 dark:text-white font-medium">Động cơ servo AC 750W Delta</td>
                        <td className="p-2.5 text-center font-mono">120</td>
                        <td className="p-2.5 text-center font-mono font-bold text-emerald-600">120</td>
                        <td className="p-2.5 text-right font-mono text-emerald-600">0 ₫</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-blue-600 font-bold">SKU-PLC-102</td>
                        <td className="p-2.5 text-slate-900 dark:text-white font-medium">Bộ lập trình PLC Siemens S7-1200</td>
                        <td className="p-2.5 text-center font-mono">45</td>
                        <td className="p-2.5 text-center font-mono font-bold text-rose-600">43</td>
                        <td className="p-2.5 text-right font-mono text-rose-600 font-bold">-4.500.000 ₫</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-blue-600 font-bold">SKU-SEN-305</td>
                        <td className="p-2.5 text-slate-900 dark:text-white font-medium">Cảm biến quang điện Panasonic</td>
                        <td className="p-2.5 text-center font-mono">310</td>
                        <td className="p-2.5 text-center font-mono text-slate-400 italic">Đang đếm</td>
                        <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Sổ cái SHA-256 đối soát tự động theo Rule #03.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDetailDrawerOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  Đóng
                </button>
                {selectedSession.status === 'PENDING_APPROVAL' && (
                  <button
                    onClick={() => {
                      setIsDetailDrawerOpen(false);
                      handleApproveSession(selectedSession);
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Phê Duyệt Phiên</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW STOCKTAKE SESSION                                       */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Khởi Tạo Phiên Kiểm Kê Kho Mới
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              setShowCreateModal(false);
              onNotify('success', 'Tạo Phiên Thành Công', 'Phiên kiểm kê mới đã được khởi tạo và phân bổ sang Bàn Thực Thi Hiện Trường.');
            }} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tiêu Đề Phiên Kiểm Kê *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kiểm kê định kỳ Kho Tổng Hà Nội Q3/2026..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Kho Áp Dụng</label>
                  <select 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="WH-HN-01">Kho Tổng Hà Nội</option>
                    <option value="WH-HCM-02">Kho Chi nhánh Nam</option>
                    <option value="WH-CNC-03">Kho Cơ khí CNC</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phương Thức Kiểm Kê</label>
                  <select 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="BLIND_COUNT">Blind Count (Kiểm Đếm Mù)</option>
                    <option value="DOUBLE_BLIND">Double Blind (Mù Kép)</option>
                    <option value="CYCLE_COUNT">Cycle Count (Vòng Tròn)</option>
                    <option value="FULL_COUNT">Tổng Kiểm Kê Toàn Bộ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phạm Vi Hàng Hóa &amp; Zone</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Toàn bộ Zone A & Zone B, Danh mục động cơ servo..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Người Giám Sát / Trưởng Đội</label>
                <input
                  type="text"
                  defaultValue="Nguyễn Văn Kiểm (KTV Trưởng Kho)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="modalFreeze"
                  defaultChecked
                  className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="modalFreeze" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  Khóa đóng băng nghiệp vụ xuất/nhập tại vùng kiểm kê trong thời gian đếm
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Bắt Đầu Phiên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG (Rule #19 Compliance)                                      */}
      {/* ========================================================================= */}
      <ConfirmDialog state={confirmDialog} />
    </div>
  );
};
