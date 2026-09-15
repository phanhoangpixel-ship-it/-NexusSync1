import React, { useState, useMemo } from 'react';
import { 
  SlidersHorizontal, Search, Filter, RefreshCw, Plus, CheckCircle2, 
  AlertTriangle, ShieldAlert, ArrowUpRight, FileSpreadsheet, Eye, 
  Send, CheckSquare, Download, MapPin, Layers, X, User, Check,
  Calendar, ShieldCheck, Clock, FileText, Lock, Unlock, Boxes, Copy,
  ArrowDownRight, XCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { ConfirmDialogState, SelectedEntityContext } from '../../../types';
import { usePagination } from '../../../hooks/usePagination';
import { PaginationControl } from '../../common/PaginationControl';
import { L3ContentState } from '../../common/L3ContentState';
import { ENTERPRISE_MASTER_PRODUCTS } from '../../../data/enterpriseMaster';

export interface StockAdjustmentItem {
  id?: number;
  productId: number;
  productSku?: string;
  productName?: string;
  baseUnit?: string;
  locationId?: number;
  direction: 'INCREASE' | 'DECREASE';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  currentStockSnapshot?: number;
  newStockSnapshot?: number;
  notes?: string;
}

export interface StockAdjustmentRecord {
  id: number;
  code: string;
  warehouseId: number;
  warehouseCode?: string;
  warehouseName?: string;
  adjustmentType: string;
  direction: string;
  reason: string;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED';
  notes?: string;
  createdBy: number | string;
  approvedBy?: number | string;
  rejectedBy?: number | string;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  postedAt?: string;
  items: StockAdjustmentItem[];
  totalLines: number;
  totalVarianceValue?: number;
  costCenter?: string;
}

interface StockAdjustmentMasterTabProps {
  adjustments: StockAdjustmentRecord[];
  warehouses: Array<{ id: number; code: string; name: string }>;
  loading: boolean;
  onRefresh: () => void;
  onApprove: (adj: StockAdjustmentRecord) => void;
  onReject: (adj: StockAdjustmentRecord) => void;
  onDuplicate: (adj: StockAdjustmentRecord) => void;
  onCreateNew: () => void;
  onSelectEntity?: (context: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const StockAdjustmentMasterTab: React.FC<StockAdjustmentMasterTabProps> = ({
  adjustments,
  warehouses,
  loading,
  onRefresh,
  onApprove,
  onReject,
  onDuplicate,
  onCreateNew,
  onSelectEntity,
  onNotify
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [selectedAdj, setSelectedAdj] = useState<StockAdjustmentRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Confirm dialog state for Rule #19
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Filter logic
  const filteredData = useMemo(() => {
    return adjustments.filter(adj => {
      const matchSearch = searchTerm === '' || 
        adj.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adj.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (adj.warehouseName && adj.warehouseName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchStatus = statusFilter === 'ALL' || adj.status === statusFilter;
      const matchWarehouse = warehouseFilter === 'ALL' || String(adj.warehouseId) === warehouseFilter;

      return matchSearch && matchStatus && matchWarehouse;
    });
  }, [adjustments, searchTerm, statusFilter, warehouseFilter]);

  // Pagination
  const pagination = usePagination({
    totalItems: filteredData.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedData = useMemo(() => {
    return pagination.paginatedData(filteredData);
  }, [filteredData, pagination]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const total = adjustments.length;
    const draftCount = adjustments.filter(a => a.status === 'DRAFT').length;
    const approvedCount = adjustments.filter(a => a.status === 'APPROVED').length;
    
    let netVarianceValue = 0;
    adjustments.forEach(a => {
      if (a.items && a.items.length > 0) {
        a.items.forEach(it => {
          const cost = it.unitCost || 500000;
          const val = (it.direction === 'INCREASE' ? 1 : -1) * it.quantity * cost;
          netVarianceValue += val;
        });
      }
    });

    return { total, draftCount, approvedCount, netVarianceValue };
  }, [adjustments]);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      onNotify('warning', 'Không có dữ liệu', 'Danh sách hiện tại rỗng để xuất Excel.');
      return;
    }

    const exportRows = filteredData.map(adj => ({
      'Mã Phiếu': adj.code,
      'Kho Hàng': adj.warehouseName || `Kho #${adj.warehouseId}`,
      'Lý Do Điều Chỉnh': adj.reason,
      'Loại Điều Chỉnh': adj.adjustmentType || 'MANUAL',
      'Số Dòng SKU': adj.totalLines || adj.items?.length || 0,
      'Trạng Thái': adj.status === 'APPROVED' ? 'ĐÃ DUYỆT (POSTED)' : adj.status === 'REJECTED' ? 'TỪ CHỐI' : 'BẢN NHÁP (DRAFT)',
      'Người Tạo': `User #${adj.createdBy}`,
      'Ngày Tạo': new Date(adj.createdAt).toLocaleString('vi-VN')
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ChungTuDieuChinhM20');
    XLSX.writeFile(wb, `M20_Stock_Adjustments_${new Date().toISOString().slice(0, 10)}.xlsx`);

    onNotify('success', 'Xuất Excel thành công', `Đã xuất ${filteredData.length} chứng từ điều chỉnh kho.`);
  };

  const handleOpenDrawer = (adj: StockAdjustmentRecord) => {
    setSelectedAdj(adj);
    setIsDrawerOpen(true);
    if (onSelectEntity) {
      onSelectEntity({
        id: String(adj.id),
        type: 'STOCK_ADJUSTMENT',
        code: adj.code,
        name: adj.reason,
        module: 'M20',
        metadata: { warehouseId: adj.warehouseId, status: adj.status }
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L2: KPI METRIC STRIP (4 CARDS)                                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Adjustments */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Tổng Chứng Từ Điều Chỉnh
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {metrics.total}
              </span>
              <span className="text-xs text-slate-500 font-medium">Phiếu</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Pending Approval */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
              Chờ Phê Duyệt (DRAFT)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                {metrics.draftCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">Cần duyệt</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Posted / Approved */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
              Đã Ghi Sổ Kho M17 (POSTED)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {metrics.approvedCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">Bất biến</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Net Variance Value */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">
              Giá Trị Lệch Net (VND)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-bold font-mono tabular-nums ${
                metrics.netVarianceValue < 0 ? 'text-rose-600 dark:text-rose-400' :
                metrics.netVarianceValue > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                'text-slate-900 dark:text-white'
              }`}>
                {metrics.netVarianceValue > 0 ? '+' : ''}{metrics.netVarianceValue.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/80 dark:text-purple-400 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1: COMMAND BAR (SEARCH, FILTERS, ACTIONS)                                */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã phiếu, lý do, kho..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Warehouse Filter */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tất cả kho hàng</option>
              {warehouses.map(w => (
                <option key={w.id} value={String(w.id)} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  {w.code} - {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tất cả trạng thái</option>
              <option value="DRAFT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">DRAFT (Bản nháp)</option>
              <option value="APPROVED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">APPROVED (Đã post M17)</option>
              <option value="REJECTED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">REJECTED (Từ chối)</option>
            </select>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={onRefresh}
            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={onCreateNew}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Lập Phiếu Điều Chỉnh</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L3: DATA GRID (MASTER TABLE)                                              */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="p-3">Mã Phiếu</th>
                <th className="p-3">Kho Hàng</th>
                <th className="p-3">Lý Do Điều Chỉnh</th>
                <th className="p-3 text-center">Loại & Hướng</th>
                <th className="p-3 text-right">Số Dòng SKU</th>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3">Người Tạo / Thời Gian</th>
                <th className="p-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8">
                    <L3ContentState state="loading" loadingMessage="Đang đồng bộ danh sách chứng từ điều chỉnh kho..." />
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8">
                    <L3ContentState 
                      state="empty" 
                      emptyMessage="Không tìm thấy chứng từ điều chỉnh kho phù hợp."
                      onRetry={onCreateNew}
                      retryLabel="Lập phiếu mới ngay"
                    />
                  </td>
                </tr>
              ) : (
                paginatedData.map((adj) => {
                  const isApproved = adj.status === 'APPROVED';
                  const isRejected = adj.status === 'REJECTED';
                  const isDraft = adj.status === 'DRAFT';

                  return (
                    <tr
                      key={adj.id}
                      onClick={() => handleOpenDrawer(adj)}
                      className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer ${
                        selectedAdj?.id === adj.id ? 'border-l-4 border-blue-600 bg-blue-50/70 dark:bg-slate-700/80' :
                        isApproved ? 'border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10' :
                        isRejected ? 'border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20' :
                        'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10'
                      }`}
                    >
                      {/* Code */}
                      <td className="p-3">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                          {adj.code}
                        </span>
                      </td>

                      {/* Warehouse */}
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">
                        {adj.warehouseName || `Kho #${adj.warehouseId}`}
                      </td>

                      {/* Reason */}
                      <td className="p-3 text-slate-700 dark:text-slate-300 max-w-xs truncate font-medium">
                        {adj.reason}
                      </td>

                      {/* Type & Direction */}
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
                          {adj.adjustmentType || 'MANUAL'}
                        </span>
                      </td>

                      {/* Total Lines */}
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {adj.totalLines || adj.items?.length || 0} SKU
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] border ${
                          isApproved ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold' :
                          isRejected ? 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold' :
                          'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold'
                        }`}>
                          {isApproved ? 'ĐÃ DUYỆT (POST M17)' : isRejected ? 'TỪ CHỐI' : 'BẢN NHÁP (DRAFT)'}
                        </span>
                      </td>

                      {/* Created By & Date */}
                      <td className="p-3">
                        <div className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                          User #{adj.createdBy}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                          {new Date(adj.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenDrawer(adj)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Xem chi tiết 360°"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {isDraft && (
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: `Phê Duyệt & Ghi Sổ Kho M17: ${adj.code}?`,
                                message: `Thao tác này sẽ khóa vĩnh viễn phiếu điều chỉnh và gọi authoritative InventoryService.postTransaction() để cập nhật số dư tồn kho M17 và Sổ cái kế toán. Bạn có chắc chắn muốn tiếp tục?`,
                                confirmText: 'Phê Duyệt & Post Ngay',
                                cancelText: 'Hủy Bỏ',
                                variant: 'primary',
                                onConfirm: () => onApprove(adj)
                              });
                            }}
                            className="p-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-lg transition-colors cursor-pointer"
                            title="Phê duyệt & Post M17"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isDraft && (
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: `Từ Chối Phiếu Điều Chỉnh: ${adj.code}?`,
                                message: `Phiếu điều chỉnh sẽ chuyển sang trạng thái REJECTED và không làm thay đổi tồn kho thực tế.`,
                                confirmText: 'Xác Nhận Từ Chối',
                                cancelText: 'Hủy Bỏ',
                                variant: 'danger',
                                onConfirm: () => onReject(adj)
                              });
                            }}
                            className="p-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 rounded-lg transition-colors cursor-pointer"
                            title="Từ chối phiếu"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: `Nhân Bản Phiếu Điều Chỉnh: ${adj.code}?`,
                              message: `Tạo một bản sao mới ở trạng thái DRAFT chứa đầy đủ danh sách SKU của phiếu này.`,
                              confirmText: 'Nhân Bản Ngay',
                              cancelText: 'Hủy',
                              variant: 'info',
                              onConfirm: () => onDuplicate(adj)
                            });
                          }}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg transition-colors cursor-pointer"
                          title="Nhân bản phiếu"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ========================================================================= */}
        {/* L4: STICKY FOOTER PAGINATION                                              */}
        {/* ========================================================================= */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700">
          <PaginationControl
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={filteredData.length}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            onPageChange={pagination.goToPage}
            onPageSizeChange={pagination.setPageSize}
            pageSizeOptions={[5, 10, 20, 50, 100]}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DRAWER CHI TIẾT 360 ĐỘ (QUICK PREVIEW DRAWER)                             */}
      {/* ========================================================================= */}
      {isDrawerOpen && selectedAdj && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-800 h-full shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono font-bold text-base text-slate-900 dark:text-white">
                      {selectedAdj.code}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedAdj.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700' :
                      selectedAdj.status === 'REJECTED' ? 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700' :
                      'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700'
                    }`}>
                      {selectedAdj.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kho: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAdj.warehouseName || `Kho #${selectedAdj.warehouseId}`}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* General Info Card */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Lý do điều chỉnh</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedAdj.reason}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Người tạo phiếu</span>
                  <span className="font-mono text-slate-900 dark:text-white">User #{selectedAdj.createdBy}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Ngày tạo</span>
                  <span className="font-mono text-slate-900 dark:text-white">{new Date(selectedAdj.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                {selectedAdj.approvedAt && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Ngày phê duyệt</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{new Date(selectedAdj.approvedAt).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                {selectedAdj.notes && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Ghi chú</span>
                    <span className="text-slate-700 dark:text-slate-300 italic">{selectedAdj.notes}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Danh Sách SKU Điều Chỉnh ({selectedAdj.items?.length || 0})</span>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">M17 Single-Writer Reconciled</span>
                </h4>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-2.5">SKU & Tên Sản Phẩm</th>
                        <th className="p-2.5 text-center">Hướng</th>
                        <th className="p-2.5 text-right">SL Lệch</th>
                        <th className="p-2.5 text-right">Tồn Cũ</th>
                        <th className="p-2.5 text-right">Tồn Mới</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {selectedAdj.items?.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="p-2.5">
                            <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                              {it.productSku || `SKU-${it.productId}`}
                            </div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                              {it.productName || `Sản phẩm #${it.productId}`}
                            </div>
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              it.direction === 'INCREASE' 
                                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200' 
                                : 'bg-rose-100 text-rose-950 border border-rose-300 dark:bg-rose-950/90 dark:text-rose-200'
                            }`}>
                              {it.direction === 'INCREASE' ? '+ TĂNG' : '- GIẢM'}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                            {it.quantity} {it.baseUnit || 'Cái'}
                          </td>
                          <td className="p-2.5 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                            {it.currentStockSnapshot ?? '-'}
                          </td>
                          <td className="p-2.5 text-right font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                            {it.newStockSnapshot ?? '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Single Writer Banner */}
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Thẩm quyền ghi sổ độc quyền:</strong> Khi được duyệt, M20 phát lệnh gọi qua <code className="font-mono font-bold bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">InventoryService.postTransaction()</code>, bảo đảm 100% tính toàn vẹn và bất biến của sổ kho M17.
                </p>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Đóng
              </button>
              {selectedAdj.status === 'DRAFT' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: `Từ Chối Phiếu ${selectedAdj.code}?`,
                        message: `Hành động này sẽ chuyển trạng thái sang REJECTED.`,
                        confirmText: 'Từ Chối',
                        cancelText: 'Hủy',
                        variant: 'danger',
                        onConfirm: () => {
                          onReject(selectedAdj);
                          setIsDrawerOpen(false);
                        }
                      });
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl cursor-pointer"
                  >
                    Từ Chối
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: `Phê Duyệt & Post Sổ Kho M17: ${selectedAdj.code}?`,
                        message: `Hệ thống sẽ cập nhật số dư tồn kho M17 ngay lập tức.`,
                        confirmText: 'Phê Duyệt Ngay',
                        cancelText: 'Hủy',
                        variant: 'primary',
                        onConfirm: () => {
                          onApprove(selectedAdj);
                          setIsDrawerOpen(false);
                        }
                      });
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                  >
                    Phê Duyệt & Post M17
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
          onConfirm={() => {
            confirmDialog.onConfirm();
            setConfirmDialog(null);
          }}
          onClose={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
};
