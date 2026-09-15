import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Search, Filter, 
  RefreshCw, Scale, ArrowUpRight, ArrowDownRight, Layers, FileSpreadsheet, 
  HelpCircle, Eye, Check, X, ShieldAlert, Lock, Boxes, Building
} from 'lucide-react';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { ConfirmDialogState, SelectedEntityContext } from '../../../types';
import { usePagination } from '../../../hooks/usePagination';
import { PaginationControl } from '../../common/PaginationControl';
import { L3ContentState } from '../../common/L3ContentState';
import { StockAdjustmentRecord } from './StockAdjustmentMasterTab';

interface StockAdjustmentApprovalDeskTabProps {
  adjustments: StockAdjustmentRecord[];
  warehouses: Array<{ id: number; code: string; name: string }>;
  loading: boolean;
  onRefresh: () => void;
  onApprove: (adj: StockAdjustmentRecord) => void;
  onReject: (adj: StockAdjustmentRecord) => void;
  onSelectEntity?: (context: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const StockAdjustmentApprovalDeskTab: React.FC<StockAdjustmentApprovalDeskTabProps> = ({
  adjustments,
  warehouses,
  loading,
  onRefresh,
  onApprove,
  onReject,
  onSelectEntity,
  onNotify
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [toleranceFilter, setToleranceFilter] = useState<string>('ALL');
  const [selectedAdj, setSelectedAdj] = useState<StockAdjustmentRecord | null>(null);

  // Confirm dialog state (Rule #19)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Filter only DRAFT or pending review
  const draftAdjustments = useMemo(() => {
    return adjustments.filter(adj => adj.status === 'DRAFT');
  }, [adjustments]);

  const filteredData = useMemo(() => {
    return draftAdjustments.filter(adj => {
      const matchSearch = searchTerm === '' || 
        adj.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adj.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (adj.warehouseName && adj.warehouseName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchWarehouse = warehouseFilter === 'ALL' || String(adj.warehouseId) === warehouseFilter;

      // Calculate total value
      let totalVal = 0;
      adj.items?.forEach(it => {
        const cost = it.unitCost || 500000;
        totalVal += Math.abs(it.quantity * cost);
      });

      const isHighValue = totalVal >= 5000000;
      const matchTolerance = toleranceFilter === 'ALL' || 
        (toleranceFilter === 'HIGH_VALUE' && isHighValue) ||
        (toleranceFilter === 'NORMAL' && !isHighValue);

      return matchSearch && matchWarehouse && matchTolerance;
    });
  }, [draftAdjustments, searchTerm, warehouseFilter, toleranceFilter]);

  // Pagination
  const pagination = usePagination({
    totalItems: filteredData.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedData = useMemo(() => {
    return pagination.paginatedData(filteredData);
  }, [filteredData, pagination]);

  // Metrics
  const metrics = useMemo(() => {
    const totalPending = draftAdjustments.length;
    let highToleranceCount = 0;
    let totalPendingValue = 0;

    draftAdjustments.forEach(a => {
      let val = 0;
      a.items?.forEach(it => {
        val += Math.abs(it.quantity * (it.unitCost || 500000));
      });
      totalPendingValue += val;
      if (val >= 5000000) highToleranceCount++;
    });

    return { totalPending, highToleranceCount, totalPendingValue };
  }, [draftAdjustments]);

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L2: APPROVAL KPI METRIC STRIP                                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
              Phiếu Chờ Phê Duyệt
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                {metrics.totalPending}
              </span>
              <span className="text-xs text-slate-500 font-medium">Bản nháp DRAFT</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
              Vượt Dung Sai (&gt;5.000.000 ₫)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                {metrics.highToleranceCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">Cần KTT / BGĐ duyệt</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
              Tổng Giá Trị Đề Xuất Điều Chỉnh
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
                {metrics.totalPendingValue.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1: COMMAND BAR                                                           */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã phiếu, lý do..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Tất cả kho hàng</option>
            {warehouses.map(w => (
              <option key={w.id} value={String(w.id)}>{w.code} - {w.name}</option>
            ))}
          </select>

          <select
            value={toleranceFilter}
            onChange={(e) => setToleranceFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Tất cả mức dung sai</option>
            <option value="HIGH_VALUE">Vượt ngưỡng (&gt; 5 triệu ₫)</option>
            <option value="NORMAL">Trong ngưỡng chuẩn (≤ 5 triệu ₫)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L3: APPROVAL MASTER TABLE                                                 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="p-3">Mã Phiếu</th>
                <th className="p-3">Kho Hàng</th>
                <th className="p-3">Lý Do Điều Chỉnh</th>
                <th className="p-3 text-right">Số Dòng SKU</th>
                <th className="p-3 text-right">Giá Trị Dự Kiến (VND)</th>
                <th className="p-3 text-center">Phân Cấp Phê Duyệt</th>
                <th className="p-3">Định Khoản GL Dự Kiến</th>
                <th className="p-3 text-right">Quyết Định Duyệt (Rule #19)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8">
                    <L3ContentState state="loading" loadingMessage="Đang tải danh sách chờ phê duyệt..." />
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8">
                    <L3ContentState 
                      state="empty" 
                      emptyMessage="Hiện tại không có phiếu điều chỉnh nào đang chờ phê duyệt."
                    />
                  </td>
                </tr>
              ) : (
                paginatedData.map((adj) => {
                  let totalVal = 0;
                  adj.items?.forEach(it => {
                    totalVal += Math.abs(it.quantity * (it.unitCost || 500000));
                  });
                  const isExceed = totalVal >= 5000000;

                  return (
                    <tr
                      key={adj.id}
                      className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 ${
                        isExceed 
                          ? 'border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20' 
                          : 'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10'
                      }`}
                    >
                      <td className="p-3">
                        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                          {adj.code}
                        </span>
                      </td>

                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {adj.warehouseName || `Kho #${adj.warehouseId}`}
                      </td>

                      <td className="p-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {adj.reason}
                      </td>

                      <td className="p-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {adj.totalLines || adj.items?.length || 0} SKU
                      </td>

                      <td className="p-3 text-right font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white">
                        {totalVal.toLocaleString('vi-VN')} ₫
                      </td>

                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isExceed 
                            ? 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700' 
                            : 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                        }`}>
                          {isExceed ? 'CẤP KTT / BAN GIÁM ĐỐC' : 'CẤP QUẢN LÝ KHO'}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 block">
                          Nợ 1388 / Có 1561
                        </span>
                      </td>

                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: `Từ chối phiếu điều chỉnh ${adj.code}?`,
                              message: `Phiếu sẽ bị từ chối và ghi nhận lý do vào nhật ký kiểm toán.`,
                              confirmText: 'Từ Chối Phiếu',
                              cancelText: 'Hủy',
                              variant: 'danger',
                              onConfirm: () => onReject(adj)
                            });
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          Từ Chối
                        </button>

                        <button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: `Phê Duyệt & Ghi Sổ Kho M17: ${adj.code}?`,
                              message: `Hệ thống sẽ thực hiện gọi InventoryService.postTransaction() để cập nhật số dư tồn kho tức thời và khóa chứng từ bất biến. Bạn có chắc chắn?`,
                              confirmText: 'Phê Duyệt & Post M17',
                              cancelText: 'Hủy Bỏ',
                              variant: 'primary',
                              onConfirm: () => onApprove(adj)
                            });
                          }}
                          className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          Phê Duyệt
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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

      {/* Single Writer Compliance Callout */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Quy Tắc Thẩm Quyền Bất Biến (Single-Writer Rule #03 &amp; Rule #19)</p>
          <p>
            Tất cả thao tác phê duyệt tại Bàn Phê Duyệt đều phải được xác thực thông qua hộp thoại bảo vệ <code className="font-mono bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded">ConfirmDialog</code>. Dữ liệu khi post sẽ được ủy quyền cho máy chủ giao dịch <code className="font-mono bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded">InventoryService.postTransaction()</code> nhằm loại trừ triệt để nguy cơ sai lệch số dư.
          </p>
        </div>
      </div>

      {/* Confirm Dialog (Rule #19 Compliance) */}
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
