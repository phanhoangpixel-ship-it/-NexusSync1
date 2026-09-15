import React, { useState, useMemo } from 'react';
import { 
  Scale, AlertTriangle, CheckCircle2, ShieldAlert, Search, Filter, 
  RefreshCw, RotateCcw, Check, FileSpreadsheet, Download, FileText, 
  ArrowUpRight, ArrowDownRight, Layers, HelpCircle, ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { ConfirmDialogState, SelectedEntityContext } from '../../../types';
import { usePagination } from '../../../hooks/usePagination';
import { PaginationControl } from '../../common/PaginationControl';
import { L3ContentState } from '../../common/L3ContentState';

export interface VarianceRecord {
  id: string;
  sessionCode: string;
  sku: string;
  productName: string;
  category: string;
  uom: string;
  binLocation: string;
  systemQty: number; // Sổ sách
  actualQty: number; // Thực đếm
  varianceQty: number; // Lệch SL
  unitCost: number; // Đơn giá vốn bình quân (VND)
  varianceValue: number; // Giá trị lệch (VND)
  variancePercent: number; // % Lệch
  rootCause: 'MISPLACEMENT' | 'SHRINKAGE' | 'DAMAGE' | 'DATA_ENTRY' | 'PENDING_INVESTIGATION';
  toleranceThresholdPercent: number; // Ngưỡng dung sai cho phép (e.g. 0.5%)
  isExceedTolerance: boolean;
  status: 'PENDING_EXPLANATION' | 'RECOUNT_REQUESTED' | 'ADJUSTMENT_PROPOSED' | 'APPROVED';
  proposedAdjustmentDoc: string;
  notes: string;
}

interface StocktakeVarianceReconciliationTabProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  onSelectEntity?: (context: SelectedEntityContext) => void;
}

export const StocktakeVarianceReconciliationTab: React.FC<StocktakeVarianceReconciliationTabProps> = ({ 
  onNotify,
  onSelectEntity 
}) => {
  const [variances, setVariances] = useState<VarianceRecord[]>([
    {
      id: 'VAR-001',
      sessionCode: 'STK-HN-2026-09A',
      sku: 'SKU-PLC-102',
      productName: 'Bộ lập trình PLC Siemens S7-1200',
      category: 'Tự động hóa',
      uom: 'Bộ',
      binLocation: 'BIN-A01-02',
      systemQty: 45,
      actualQty: 43,
      varianceQty: -2,
      unitCost: 2250000,
      varianceValue: -4500000,
      variancePercent: -4.44,
      rootCause: 'MISPLACEMENT',
      toleranceThresholdPercent: 0.5,
      isExceedTolerance: true,
      status: 'ADJUSTMENT_PROPOSED',
      proposedAdjustmentDoc: 'ADJ-2026-09A-01',
      notes: 'Thùng carton mở nắp, nghi ngờ để nhầm sang kệ phụ tùng dự án'
    },
    {
      id: 'VAR-002',
      sessionCode: 'STK-HN-2026-09A',
      sku: 'SKU-VAL-012',
      productName: 'Van điện từ khí nén 24V SMC',
      category: 'Khí nén',
      uom: 'Cái',
      binLocation: 'BIN-B02-01',
      systemQty: 80,
      actualQty: 82,
      varianceQty: 2,
      unitCost: 600000,
      varianceValue: 1200000,
      variancePercent: 2.5,
      rootCause: 'DATA_ENTRY',
      toleranceThresholdPercent: 1.0,
      isExceedTolerance: true,
      status: 'ADJUSTMENT_PROPOSED',
      proposedAdjustmentDoc: 'ADJ-2026-09A-02',
      notes: 'Dôi dư do đơn hàng xuất mẫu chưa trừ kho thực tế'
    },
    {
      id: 'VAR-003',
      sessionCode: 'STK-CNC-2026-09C',
      sku: 'SKU-END-008',
      productName: 'Dao phay ngón hợp kim Carbide 4F D8.0',
      category: 'Dao cụ CNC',
      uom: 'Cây',
      binLocation: 'BIN-D01-04',
      systemQty: 100,
      actualQty: 95,
      varianceQty: -5,
      unitCost: 780000,
      varianceValue: -3900000,
      variancePercent: -5.0,
      rootCause: 'SHRINKAGE',
      toleranceThresholdPercent: 0.5,
      isExceedTolerance: true,
      status: 'RECOUNT_REQUESTED',
      proposedAdjustmentDoc: 'Chưa tạo',
      notes: 'Lệch 5 cây dao phay có giá trị cao, đã yêu cầu đếm lại lần 2'
    },
    {
      id: 'VAR-004',
      sessionCode: 'STK-HCM-2026-09B',
      sku: 'SKU-CYL-032',
      productName: 'Xylanh khí nén tác động kép Airtac SC50',
      category: 'Khí nén',
      uom: 'Cái',
      binLocation: 'BIN-C02-05',
      systemQty: 30,
      actualQty: 30,
      varianceQty: 0,
      unitCost: 850000,
      varianceValue: 0,
      variancePercent: 0,
      rootCause: 'PENDING_INVESTIGATION',
      toleranceThresholdPercent: 0.5,
      isExceedTolerance: false,
      status: 'APPROVED',
      proposedAdjustmentDoc: 'Không cần',
      notes: 'Khớp 100% sổ sách'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sessionFilter, setSessionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [rootCauseFilter, setRootCauseFilter] = useState('ALL');

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      onNotify('info', 'Làm Mới Đối Soát', 'Đã tính toán lại giá trị chênh lệch và cập nhật tỷ lệ dung sai.');
    }, 450);
  };

  const filteredVariances = useMemo(() => {
    return variances.filter(v => {
      const matchSearch = v.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.sessionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.binLocation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSession = sessionFilter === 'ALL' || v.sessionCode === sessionFilter;
      const matchStatus = statusFilter === 'ALL' || v.status === statusFilter;
      const matchCause = rootCauseFilter === 'ALL' || v.rootCause === rootCauseFilter;
      return matchSearch && matchSession && matchStatus && matchCause;
    });
  }, [variances, searchTerm, sessionFilter, statusFilter, rootCauseFilter]);

  const pagination = usePagination({
    totalItems: filteredVariances.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedVariances = useMemo(() => {
    return pagination.paginatedData(filteredVariances);
  }, [filteredVariances, pagination]);

  const rootCauseMap: Record<string, { label: string; className: string }> = {
    MISPLACEMENT: { label: 'Để Nhầm Kệ/Vị Trí', className: 'text-amber-950 bg-amber-100 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700' },
    SHRINKAGE: { label: 'Thất Thoát / Hao Hụt', className: 'text-rose-950 bg-rose-100 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold' },
    DAMAGE: { label: 'Hỏng Hóc / Phế Phẩm', className: 'text-orange-950 bg-orange-100 border-orange-300 dark:bg-orange-950/90 dark:text-orange-200 dark:border-orange-700' },
    DATA_ENTRY: { label: 'Sai Sót Nhập Liệu ERP', className: 'text-blue-950 bg-blue-100 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700' },
    PENDING_INVESTIGATION: { label: 'Đang Điều Tra', className: 'text-slate-800 bg-slate-100 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600' }
  };

  const statusBadgeMap: Record<string, { label: string; className: string }> = {
    PENDING_EXPLANATION: { label: 'Chờ Giải Trình', className: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold' },
    RECOUNT_REQUESTED: { label: 'Yêu Cầu Đếm Lại', className: 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold' },
    ADJUSTMENT_PROPOSED: { label: 'Đã Đề Xuất Bút Toán', className: 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200 dark:border-purple-700 font-semibold' },
    APPROVED: { label: 'Đã Duyệt Điều Chỉnh', className: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold' }
  };

  const handleRequestRecount = (record: VarianceRecord) => {
    setConfirmDialog({
      isOpen: true,
      title: `Yêu Cầu Đếm Lại (Recount) SKU ${record.sku}?`,
      message: `Tỷ lệ lệch hiện tại là ${record.variancePercent}% (vượt ngưỡng dung sai cho phép ${record.toleranceThresholdPercent}%). Lệnh đếm lại lần 2 sẽ được chuyển sang Bàn Thực Thi Hiện Trường.`,
      onConfirm: () => {
        setVariances(prev => prev.map(v => v.id === record.id ? { ...v, status: 'RECOUNT_REQUESTED' } : v));
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        onNotify('warning', 'Đã Gửi Lệnh Đếm Lại', `Lệnh đếm lại SKU ${record.sku} tại ${record.binLocation} đã được ban hành.`);
      }
    });
  };

  const handleApproveAdjustment = (record: VarianceRecord) => {
    setConfirmDialog({
      isOpen: true,
      title: `Phê Duyệt Điều Chỉnh Tồn Kho SKU ${record.sku}?`,
      message: `Hệ thống sẽ ghi nhận điều chỉnh ${record.varianceQty > 0 ? '+' : ''}${record.varianceQty} ${record.uom} (giá trị: ${record.varianceValue.toLocaleString('vi-VN')} ₫) vào Sổ cái GL và Cập nhật Inventory Core theo Rule #03. Thao tác này không thể hoàn tác.`,
      onConfirm: () => {
        setVariances(prev => prev.map(v => v.id === record.id ? { ...v, status: 'APPROVED' } : v));
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        onNotify('success', 'Đã Phê Duyệt Điều Chỉnh Kho', `Bút toán điều chỉnh cho SKU ${record.sku} đã được ghi nhận vào sổ cái.`);
      }
    });
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredVariances.map(v => ({
        'Mã Phiên': v.sessionCode,
        'Mã SKU': v.sku,
        'Tên Hàng Hóa': v.productName,
        'Vị Trí Kệ': v.binLocation,
        'ĐVT': v.uom,
        'Tồn Sổ Sách': v.systemQty,
        'Thực Đếm': v.actualQty,
        'Chênh Lệch (SL)': v.varianceQty,
        'Tỷ Lệ Lệch (%)': v.variancePercent,
        'Đơn Giá Vốn (VNĐ)': v.unitCost,
        'Giá Trị Chênh Lệch (VNĐ)': v.varianceValue,
        'Nguyên Nhân': rootCauseMap[v.rootCause]?.label || v.rootCause,
        'Trạng Thái Xử Lý': statusBadgeMap[v.status]?.label || v.status,
        'Ghi Chú': v.notes
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bao_Cao_Chenh_Lech_Ton_Kho');
      XLSX.writeFile(wb, `NexusSync_Variance_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
      onNotify('success', 'Xuất File Excel Thành Công', 'Đã xuất biên bản đối soát chênh lệch kiểm kê ra Excel.');
    } catch (err) {
      onNotify('error', 'Lỗi Xuất File', 'Không thể xuất báo cáo chênh lệch ra Excel.');
    }
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
              placeholder="Tìm SKU, tên sản phẩm, phiên, kệ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
          >
            <option value="ALL">Tất cả Phiên Kiểm Kê</option>
            <option value="STK-HN-2026-09A">STK-HN-2026-09A</option>
            <option value="STK-HCM-2026-09B">STK-HCM-2026-09B</option>
            <option value="STK-CNC-2026-09C">STK-CNC-2026-09C</option>
          </select>

          <select
            value={rootCauseFilter}
            onChange={(e) => setRootCauseFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả Nhóm Nguyên Nhân</option>
            <option value="MISPLACEMENT">Để Nhầm Kệ/Vị Trí</option>
            <option value="SHRINKAGE">Thất Thoát / Hao Hụt</option>
            <option value="DAMAGE">Hỏng Hóc / Phế Phẩm</option>
            <option value="DATA_ENTRY">Sai Sót Nhập Liệu ERP</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả Trạng Thái Xử Lý</option>
            <option value="PENDING_EXPLANATION">Chờ Giải Trình</option>
            <option value="RECOUNT_REQUESTED">Yêu Cầu Đếm Lại</option>
            <option value="ADJUSTMENT_PROPOSED">Đã Đề Xuất Bút Toán</option>
            <option value="APPROVED">Đã Duyệt</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
            title="Xuất Biên Bản Đối Soát"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Xuất Biên Bản Đối Soát</span>
          </button>
          <button
            onClick={handleRefresh}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: KPI SUMMARY CARDS (COMPACT & PROPORTIONAL)                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng SKU Có Chênh Lệch</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Scale className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {variances.filter(v => v.varianceQty !== 0).length}
            </span>
            <span className="text-[11px] text-rose-600 font-medium">SKU sai lệch tồn</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vượt Ngưỡng Dung Sai (Tolerance)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
              {variances.filter(v => v.isExceedTolerance).length}
            </span>
            <span className="text-[11px] text-rose-600 font-medium">vượt &gt; 0.5%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đang Yêu Cầu Đếm Lại</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
              {variances.filter(v => v.status === 'RECOUNT_REQUESTED').length}
            </span>
            <span className="text-[11px] text-blue-600 font-medium">đợt 2 (Recount)</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Giá Trị Hao Hụt Ròng</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-1 flex-wrap">
            <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
              {variances.reduce((acc, v) => acc + v.varianceValue, 0).toLocaleString('vi-VN')} ₫
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Sẵn sàng hạch toán Rule #03</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L3: DATA TABLE CONTENT AREA                                               */}
      {/* ========================================================================= */}
      <L3ContentState
        isLoading={isLoading}
        error={error}
        isEmpty={filteredVariances.length === 0}
        onRetry={handleRefresh}
        emptyTitle="Không có dữ liệu chênh lệch nào"
        emptyDescription="Dữ liệu kiểm kê hoàn toàn khớp với sổ sách hoặc không có chênh lệch nào theo bộ lọc hiện tại."
        emptyAction={{
          label: 'Đặt lại bộ lọc đối soát',
          onClick: () => {
            setSearchTerm('');
            setSessionFilter('ALL');
            setStatusFilter('ALL');
            setRootCauseFilter('ALL');
          },
          variant: 'outline'
        }}
        skeletonRows={5}
        minHeight="min-h-[380px]"
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 min-w-[120px]">Mã SKU &amp; Phiên</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Tên Hàng &amp; Vị Trí Kệ</th>
                  <th className="py-2.5 px-2 text-center w-16">Tồn Sổ</th>
                  <th className="py-2.5 px-2 text-center w-16">Thực Đếm</th>
                  <th className="py-2.5 px-2 text-center min-w-[85px]">Lệch (SL/%)</th>
                  <th className="py-2.5 px-3 text-right min-w-[120px]">Giá Trị Lệch (VNĐ)</th>
                  <th className="py-2.5 px-3 min-w-[140px]">Nguyên Nhân Gốc</th>
                  <th className="py-2.5 px-2 text-center min-w-[110px]">Trạng Thái</th>
                  <th className="py-2.5 px-3 text-center min-w-[120px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                {paginatedVariances.map((record) => {
                  const rootCauseBadge = rootCauseMap[record.rootCause] || rootCauseMap.PENDING_INVESTIGATION;
                  const statusBadge = statusBadgeMap[record.status] || statusBadgeMap.PENDING_EXPLANATION;
                  const isLoss = record.varianceQty < 0;
                  const isGain = record.varianceQty > 0;
                  const isExceed = record.isExceedTolerance;
                  return (
                    <tr 
                      key={record.id} 
                      className={`transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 ${
                        isExceed
                          ? 'border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                          : isLoss
                          ? 'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10'
                          : isGain
                          ? 'border-l-4 border-emerald-500 bg-emerald-50/15 dark:bg-emerald-950/10'
                          : 'border-l-4 border-transparent'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                            {record.sku}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {record.sessionCode}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                          {record.productName}
                        </div>
                        <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {record.binLocation} • ĐVT: {record.uom}
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                        {record.systemQty.toLocaleString('vi-VN')}
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {record.actualQty.toLocaleString('vi-VN')}
                      </td>

                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <div className={`font-mono font-bold ${record.varianceQty < 0 ? 'text-rose-700 dark:text-rose-300' : record.varianceQty > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                          {record.varianceQty > 0 ? '+' : ''}{record.varianceQty}
                        </div>
                        <div className={`text-[10px] font-mono ${record.isExceedTolerance ? 'text-rose-700 dark:text-rose-300 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                          ({record.variancePercent > 0 ? '+' : ''}{record.variancePercent}%)
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono tabular-nums font-bold">
                        <span className={record.varianceValue < 0 ? 'text-rose-700 dark:text-rose-300' : record.varianceValue > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}>
                          {record.varianceValue > 0 ? '+' : ''}{record.varianceValue.toLocaleString('vi-VN')} ₫
                        </span>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${rootCauseBadge.className}`}>
                          {rootCauseBadge.label}
                        </span>
                        <div className="text-[10px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                          {record.notes}
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {record.status === 'RECOUNT_REQUESTED' ? (
                            <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                              <RotateCcw className="w-3 h-3 animate-spin" /> Đang đếm lại
                            </span>
                          ) : record.status === 'ADJUSTMENT_PROPOSED' ? (
                            <button
                              onClick={() => handleApproveAdjustment(record)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              title="Duyệt hạch toán điều chỉnh"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Duyệt Hạch Toán</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRequestRecount(record)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              title="Yêu cầu đếm lại"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Đếm Lại</span>
                            </button>
                          )}
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
              totalItems={filteredVariances.length}
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
      {/* CONFIRM DIALOG (Rule #19 Compliance)                                      */}
      {/* ========================================================================= */}
      <ConfirmDialog 
        state={confirmDialog} 
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
};
