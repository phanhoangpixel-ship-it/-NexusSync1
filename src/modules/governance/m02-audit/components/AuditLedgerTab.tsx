import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  Check,
  XCircle,
  AlertTriangle,
  User,
  ShieldCheck,
  RefreshCw,
  Copy,
  Lock,
  ArrowUpDown,
  Download
} from 'lucide-react';

interface AuditLedgerTabProps {
  logs: any[];
  loading: boolean;
  onRefresh: () => void;
  onSelectLog: (log: any) => void;
  onOpenDetailModal: (log: any) => void;
  selectedLogId?: number | null;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  onRequestExportCSV: () => void;
}

export const AuditLedgerTab: React.FC<AuditLedgerTabProps> = ({
  logs,
  loading,
  onRefresh,
  onSelectLog,
  onOpenDetailModal,
  selectedLogId,
  onNotify,
  onRequestExportCSV
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [selectedResultFilter, setSelectedResultFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (log.auditCode || '').toLowerCase().includes(query) ||
      (log.username || '').toLowerCase().includes(query) ||
      (log.entityId || '').toLowerCase().includes(query) ||
      (log.entityType || '').toLowerCase().includes(query) ||
      (log.action || '').toLowerCase().includes(query);

    const matchesModule = selectedModuleFilter === 'ALL' || log.module === selectedModuleFilter;
    const matchesResult = selectedResultFilter === 'ALL' || log.result === selectedResultFilter;

    return matchesSearch && matchesModule && matchesResult;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getBorderLeftClass = (log: any) => {
    if (selectedLogId && log.id === selectedLogId) {
      return 'border-l-4 border-blue-600 bg-blue-50/70 dark:bg-slate-700/80';
    }
    if (log.result === 'FAILED') {
      return 'border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20';
    }
    if (log.result === 'PERMISSION_DENIED') {
      return 'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10';
    }
    return 'border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10';
  };

  const getBadgeClass = (result: string) => {
    if (result === 'SUCCESS') {
      return 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold';
    }
    if (result === 'PERMISSION_DENIED') {
      return 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold';
    }
    return 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold';
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L2: BỘ LỌC ĐA CHIỀU (FILTER BAR & SEARCH OMNIBAR)                         */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-3.5 sm:p-4 flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search Omnibar */}
          <div className="relative flex-1 sm:w-80 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Tìm theo mã AUD, user, entity ID, action..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Module Filter */}
          <select
            value={selectedModuleFilter}
            onChange={(e) => {
              setSelectedModuleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Tất cả Phân hệ</option>
            <option value="INVENTORY">INVENTORY (Kho vận)</option>
            <option value="SALES">SALES (Bán hàng)</option>
            <option value="PURCHASE">PURCHASE (Mua hàng)</option>
            <option value="FINANCE">FINANCE (Tài chính &amp; GL)</option>
            <option value="AUTH">AUTH (Xác thực)</option>
            <option value="SYSTEM">SYSTEM (Hệ thống)</option>
            <option value="HRM">HRM (Nhân sự)</option>
          </select>

          {/* Result Filter */}
          <select
            value={selectedResultFilter}
            onChange={(e) => {
              setSelectedResultFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Tất cả Kết quả</option>
            <option value="SUCCESS">SUCCESS (Thành công)</option>
            <option value="PERMISSION_DENIED">PERMISSION_DENIED (Từ chối quyền)</option>
            <option value="FAILED">FAILED (Thất bại / Lỗi)</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-600"
            title="Tải lại nhật ký kiểm toán mới nhất từ máy chủ"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={onRequestExportCSV}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Xuất danh sách nhật ký kiểm toán sang tệp CSV bảo mật (Rule #19 Confirmed)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Báo Cáo CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L3: DATA GRID BẢNG NHẬT KÝ KIỂM TOÁN (ENTERPRISE STANDARDS WCAG AA)      */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Nhật Ký Kiểm Toán Toàn Hệ Thống (Immutable Security Ledger)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 text-[10px] font-mono font-bold border border-blue-200 dark:border-blue-700">
              {filteredLogs.length} bản ghi
            </span>
          </div>

          <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 rounded-full text-[11px] font-bold border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Immutable Ledger Active</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4">Mã Audit</th>
                <th className="py-3 px-4">Thời Gian</th>
                <th className="py-3 px-4">Người Thực Hiện</th>
                <th className="py-3 px-4">Phân Hệ</th>
                <th className="py-3 px-4">Hành Động</th>
                <th className="py-3 px-4">Đối Tượng</th>
                <th className="py-3 px-4">Kết Quả</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                      <span>Đang tải nhật ký kiểm toán hệ thống từ máy chủ...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldCheck className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                      <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                        Không tìm thấy sự kiện kiểm toán nào phù hợp với bộ lọc
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Thử điều chỉnh từ khóa tìm kiếm hoặc chọn "Tất cả Phân hệ / Kết quả".
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const borderLeft = getBorderLeftClass(log);
                  const isSuccess = log.result === 'SUCCESS';
                  const isDenied = log.result === 'PERMISSION_DENIED';

                  return (
                    <tr
                      key={log.id}
                      onClick={() => onSelectLog(log)}
                      className={`${borderLeft} hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer group`}
                    >
                      {/* Mã Audit */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {log.auditCode || `AUD-${log.id}`}
                      </td>

                      {/* Thời Gian */}
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : 'N/A'}
                      </td>

                      {/* Người Thực Hiện */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-900 dark:text-white">{log.username || 'system'}</span>
                          <span className="font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded-md border border-slate-300 dark:border-slate-600">
                            {log.role || 'USER'}
                          </span>
                        </div>
                      </td>

                      {/* Phân Hệ */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          {log.module || 'SYS'}
                        </span>
                      </td>

                      {/* Hành Động */}
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {log.action}
                      </td>

                      {/* Đối Tượng */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">{log.entityType}</div>
                        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          ID: {log.entityId}
                        </div>
                      </td>

                      {/* Kết Quả */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1 border ${getBadgeClass(log.result)}`}>
                          {isSuccess ? (
                            <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
                          ) : isDenied ? (
                            <AlertTriangle className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-700 dark:text-rose-300" />
                          )}
                          <span>{log.result || 'SUCCESS'}</span>
                        </span>
                      </td>

                      {/* Thao Tác */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetailModal(log);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-600"
                          title="Xem toàn vẹn payload và chữ ký SHA-256"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang (Pagination) */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850">
          <div>
            Hiển thị <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{filteredLogs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> - <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{Math.min(currentPage * pageSize, filteredLogs.length)}</span> trong tổng số <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{filteredLogs.length}</span> bản ghi
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-semibold cursor-pointer"
              >
                Trước
              </button>
              <span className="font-mono text-xs px-2 font-bold text-slate-800 dark:text-slate-200">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-semibold cursor-pointer"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
