import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  ArrowRight,
  ShieldAlert,
  ShoppingCart,
  Factory,
  RefreshCw,
  Table,
  LayoutGrid,
  Sliders,
  Check,
  Zap,
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';

interface MrpExceptionsTabProps {
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const MrpExceptionsTab: React.FC<MrpExceptionsTabProps> = ({ onNotify }) => {
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [exceptionTypeFilter, setExceptionTypeFilter] = useState<string>('ALL');
  const [resolvedFilter, setResolvedFilter] = useState<'ALL' | 'UNRESOLVED' | 'RESOLVED'>('UNRESOLVED');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>('auto');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scm/mrp/exceptions').then((r) => r.json());
      setExceptions(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error fetching exceptions:', err);
      onNotify('danger', 'Lỗi tải cảnh báo', 'Không thể tải danh sách ngoại lệ MRP.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  const handleResolveException = (ex: any) => {
    setConfirmDialog({
      isOpen: true,
      title: `Xác nhận giải quyết cảnh báo cho ${ex.sku}?`,
      message: `Hệ thống sẽ đánh dấu cảnh báo này là Đã Xử Lý với người duyệt là Chuyên viên SCM Lead Planner.`,
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/scm/mrp/exceptions/${ex.id}/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolvedBy: 'SCM Lead Planner' }),
          });
          if (!res.ok) throw new Error('Không thể cập nhật trạng thái');
          onNotify('success', 'Đã xử lý ngoại lệ', `Cảnh báo cho sản phẩm ${ex.sku} đã được đánh dấu hoàn tất.`);
          fetchExceptions();
        } catch (err: any) {
          onNotify('danger', 'Lỗi', err.message);
        }
      },
    });
  };

  const filtered = exceptions.filter((ex) => {
    const matchSearch =
      (ex.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.message || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchSeverity = severityFilter === 'ALL' || ex.severity === severityFilter;
    const matchType = exceptionTypeFilter === 'ALL' || ex.exceptionType === exceptionTypeFilter;
    const matchResolved =
      resolvedFilter === 'ALL'
        ? true
        : resolvedFilter === 'RESOLVED'
        ? ex.isResolved
        : !ex.isResolved;
    return matchSearch && matchSeverity && matchType && matchResolved;
  });

  const criticalCount = exceptions.filter((e) => e.severity === 'CRITICAL' && !e.isResolved).length;
  const highCount = exceptions.filter((e) => e.severity === 'HIGH' && !e.isResolved).length;
  const mediumCount = exceptions.filter((e) => e.severity === 'MEDIUM' && !e.isResolved).length;
  const resolvedCount = exceptions.filter((e) => e.isResolved).length;

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L2: KPI METRIC STRIP (M25 COMPATIBLE 4-METRIC GRID)                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
              Thiếu Nguy Cấp (Critical)
            </span>
            <div className="font-mono tabular-nums font-bold text-2xl text-rose-600 dark:text-rose-400">
              {criticalCount}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Cần can thiệp khẩn cấp
            </span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
              Vi Phạm Lead-Time (High)
            </span>
            <div className="font-mono tabular-nums font-bold text-2xl text-amber-600 dark:text-amber-400">
              {highCount}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Không đủ thời gian đặt hàng
            </span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
              Chạm Tồn An Toàn
            </span>
            <div className="font-mono tabular-nums font-bold text-2xl text-blue-600 dark:text-blue-400">
              {mediumCount}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Safety Stock Breach
            </span>
          </div>
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
              Đã Khắc Phục / Xử Lý
            </span>
            <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400">
              {resolvedCount}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Đã ủy quyền tạo PO/MO
            </span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1 COMMAND BAR: SEARCH, EXCEPTION FILTERS, SEVERITY, STATUS, VIEW MODES   */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo SKU, tên sản phẩm, thông điệp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white transition-all"
            />
          </div>

          {/* Type Filter */}
          <select
            value={exceptionTypeFilter}
            onChange={(e) => setExceptionTypeFilter(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Tất cả 6 nhóm bất thường</option>
            <option value="CRITICAL_STOCKOUT">Thiếu hụt nguy cấp (CRITICAL_STOCKOUT)</option>
            <option value="LEAD_TIME_VIOLATION">Vi phạm Lead Time (LEAD_TIME_VIOLATION)</option>
            <option value="PAST_DUE_ORDER">Đơn hàng quá hạn (PAST_DUE_ORDER)</option>
            <option value="SAFETY_STOCK_BREACH">Xâm phạm tồn an toàn (SAFETY_STOCK_BREACH)</option>
            <option value="EXCESS_INVENTORY">Tồn kho vượt trần (EXCESS_INVENTORY)</option>
            <option value="NO_BOM_FOUND">Chưa có định mức BOM (NO_BOM_FOUND)</option>
            <option value="NO_SUPPLIER_DEFINED">Chưa có Nhà cung cấp (NO_SUPPLIER_DEFINED)</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Tất cả mức độ</option>
            <option value="CRITICAL">Khẩn cấp (Critical)</option>
            <option value="HIGH">Nghiêm trọng (High)</option>
            <option value="MEDIUM">Trung bình (Medium)</option>
            <option value="LOW">Thấp (Low)</option>
          </select>

          {/* Status Filter */}
          <select
            value={resolvedFilter}
            onChange={(e) => setResolvedFilter(e.target.value as any)}
            className="text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="UNRESOLVED">Chưa xử lý (Active)</option>
            <option value="RESOLVED">Đã xử lý (Resolved)</option>
            <option value="ALL">Tất cả trạng thái</option>
          </select>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Chế độ Bảng (Table View)"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Bảng</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Chế độ Thẻ (Card View)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Thẻ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('auto')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'auto'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Tự động tối ưu"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Tự động</span>
            </button>
          </div>

          <button
            onClick={fetchExceptions}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DATA PRESENTATION: EXCEPTIONS LIST (TABLE / CARDS)                        */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 shadow-2xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50 text-blue-600" />
          Đang nạp danh sách cảnh báo ngoại lệ...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 shadow-2xs">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-500" />
          Không có cảnh báo ngoại lệ nào trong bộ lọc. Chuỗi cung ứng đang vận hành ổn định.
        </div>
      ) : (
        <>
          {/* 1. TABLE VIEW */}
          {(viewMode === 'table' || viewMode === 'auto') && (
            <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden ${viewMode === 'auto' ? 'hidden md:block' : 'block'}`}>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs whitespace-nowrap min-w-[900px] lg:min-w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mức Độ</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sản Phẩm &amp; SKU</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Loại Bất Thường</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Thông Điệp Chi Tiết</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Thiếu Hụt</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Trễ (Ngày)</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Khuyến Nghị Xử Lý</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Trạng Thái</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filtered.map((ex) => {
                      const isCritical = ex.severity === 'CRITICAL';
                      const isHigh = ex.severity === 'HIGH';
                      const isMedium = ex.severity === 'MEDIUM';

                      return (
                        <tr
                          key={ex.id}
                          className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 ${
                            ex.isResolved
                              ? 'border-l-4 border-slate-300 dark:border-slate-600 opacity-80'
                              : isCritical
                              ? 'border-l-4 border-rose-500 bg-rose-50/10 dark:bg-rose-950/10'
                              : isHigh
                              ? 'border-l-4 border-amber-500 bg-amber-50/10 dark:bg-amber-950/10'
                              : isMedium
                              ? 'border-l-4 border-blue-500 bg-blue-50/10 dark:bg-blue-950/10'
                              : 'border-l-4 border-slate-400'
                          }`}
                        >
                          <td className="p-2.5 sm:p-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                isCritical
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800'
                                  : isHigh
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isCritical ? 'bg-rose-500' : isHigh ? 'bg-amber-500' : 'bg-blue-500'
                                }`}
                              />
                              {ex.severity}
                            </span>
                          </td>
                          <td className="p-2.5 sm:p-3">
                            <div className="font-bold text-slate-900 dark:text-white">{ex.productName}</div>
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600 inline-block mt-0.5">
                              {ex.sku}
                            </span>
                          </td>
                          <td className="p-2.5 sm:p-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                              {ex.exceptionType}
                            </span>
                          </td>
                          <td className="p-2.5 sm:p-3 max-w-xs truncate text-slate-700 dark:text-slate-300 font-medium">
                            {ex.message}
                          </td>
                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
                            {ex.shortageQty || 0}
                          </td>
                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums text-amber-600 dark:text-amber-400 font-bold">
                            {ex.daysPastDue || 0}
                          </td>
                          <td className="p-2.5 sm:p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                            {ex.suggestedRemediation}
                          </td>
                          <td className="p-2.5 sm:p-3 text-center">
                            {ex.isResolved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> Đã xử lý
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" /> Chưa xử lý
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 sm:p-3 text-center">
                            {!ex.isResolved ? (
                              <button
                                onClick={() => handleResolveException(ex)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1 mx-auto"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Giải Quyết</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                {ex.resolvedBy || 'Lead Planner'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. CARD VIEW (Adaptive for mobile or cards toggle) */}
          {(viewMode === 'cards' || viewMode === 'auto') && (
            <div className={`space-y-3 ${viewMode === 'auto' ? 'block md:hidden' : 'block'}`}>
              {filtered.map((ex) => {
                const isCritical = ex.severity === 'CRITICAL';
                const isHigh = ex.severity === 'HIGH';

                return (
                  <div
                    key={ex.id}
                    className={`p-4 rounded-xl border transition-all shadow-2xs bg-white dark:bg-slate-800 space-y-3 ${
                      ex.isResolved
                        ? 'border-slate-200 dark:border-slate-700 opacity-75'
                        : isCritical
                        ? 'border-rose-300 dark:border-rose-800'
                        : isHigh
                        ? 'border-amber-300 dark:border-amber-800'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCritical
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                              : isHigh
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                          }`}
                        >
                          {ex.severity}
                        </span>
                        <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                          {ex.exceptionType}
                        </span>
                      </div>

                      {ex.isResolved && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Đã xử lý
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{ex.productName}</h4>
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600 inline-block mt-0.5">
                        {ex.sku}
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-2">{ex.message}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Thiếu hụt: <strong className="font-mono text-rose-600 dark:text-rose-400">{ex.shortageQty || 0}</strong>
                      </div>
                      {!ex.isResolved && (
                        <button
                          onClick={() => handleResolveException(ex)}
                          className="px-3 py-1 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Giải Quyết</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};
