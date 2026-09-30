import React, { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { WorkspaceWorkItem } from '../../../../types/workspace';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';

export type WorkQueueFilter = 'ALL' | 'URGENT' | 'OVERDUE' | 'RMA' | 'TODAY';

interface WorkspaceWorkQueueProps {
  workItems: WorkspaceWorkItem[];
  loading: boolean;
  onSelectWorkItem: (item: WorkspaceWorkItem) => void;
  onExecuteAction: (itemId: string, actionId: string, endpoint: string) => Promise<void>;
  onOpenWorkQueueDrawer?: () => void;
}

export const WorkspaceWorkQueue: React.FC<WorkspaceWorkQueueProps> = ({
  workItems,
  loading,
  onSelectWorkItem,
  onExecuteAction,
  onOpenWorkQueueDrawer,
}) => {
  const [filter, setFilter] = useState<WorkQueueFilter>('ALL');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const itemsPerPage = 6;

  // Filter & Search
  const filteredItems = useMemo(() => {
    return workItems.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchRef = (item.businessReference || '').toLowerCase().includes(q);
        const matchMod = (item.sourceModule || '').toLowerCase().includes(q);
        if (!matchTitle && !matchRef && !matchMod) return false;
      }

      // Quick filter
      if (filter === 'URGENT') {
        return item.priority === 'URGENT' || item.priority === 'HIGH';
      }
      if (filter === 'OVERDUE') {
        return item.isOverdue === true;
      }
      if (filter === 'RMA') {
        return (item.sourceModule || '').includes('M15') || (item.title || '').includes('RMA') || (item.title || '').includes('QC');
      }
      if (filter === 'TODAY') {
        const today = new Date().toISOString().slice(0, 10);
        return (item.createdAt || '').slice(0, 10) === today;
      }

      return true;
    });
  }, [workItems, search, filter]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, page, itemsPerPage]);

  const promptActionConfirm = (item: WorkspaceWorkItem, act: { id: string; label: string; endpoint: string; variant?: string }) => {
    const isDestructive = act.variant === 'danger' || act.id.includes('reject');
    setConfirmDialog({
      isOpen: true,
      title: isDestructive ? `Xác nhận từ chối: ${act.label}` : `Xác nhận thực thi: ${act.label}`,
      message: `Bạn đang thực hiện thao tác "${act.label}" cho chứng từ ${item.businessReference || item.id}. Thao tác này sẽ ghi nhận vào Sổ cái Kiểm toán & Quy trình phê duyệt của phân hệ chủ quản.`,
      variant: isDestructive ? 'danger' : 'primary',
      confirmText: act.label,
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        setExecutingId(item.id);
        try {
          await onExecuteAction(item.id, act.id, act.endpoint);
        } finally {
          setExecutingId(null);
        }
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-2xs flex flex-col h-full min-h-[580px]">
      {/* Rule #19 ConfirmDialog */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Icons.ListTodo className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Hàng Chờ Tác Vụ</span>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {filteredItems.length}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Phê duyệt &amp; chỉ thị luồng công việc
            </p>
          </div>
        </div>

        {onOpenWorkQueueDrawer && (
          <button
            type="button"
            onClick={onOpenWorkQueueDrawer}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all cursor-pointer"
            title="Mở toàn bộ WorkQueue Drawer"
          >
            <Icons.Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Segmented Control */}
      <div className="flex items-center gap-1 py-2.5 overflow-x-auto scrollbar-none border-b border-slate-100 dark:border-slate-700/60">
        {(['ALL', 'URGENT', 'OVERDUE', 'RMA', 'TODAY'] as WorkQueueFilter[]).map((f) => {
          const labels: Record<WorkQueueFilter, string> = {
            ALL: 'Tất cả',
            URGENT: 'Khẩn cấp',
            OVERDUE: 'Quá hạn',
            RMA: 'RMA / QC',
            TODAY: 'Hôm nay',
          };
          return (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                filter === f
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              {labels[f]}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative my-2.5">
        <Icons.Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Lọc tác vụ theo mã hoặc tên..."
          className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Work Items List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 min-h-[300px]">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Icons.Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs">Đang tải danh sách tác vụ...</span>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Icons.CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Không có công việc cần xử lý.
            </p>
            <p className="text-[11px] text-slate-400">
              Hàng chờ hiện tại đã được giải quyết hoặc không khớp bộ lọc.
            </p>
          </div>
        ) : (
          paginatedItems.map((item) => {
            const isUrgent = item.priority === 'URGENT';
            const isHigh = item.priority === 'HIGH';
            const isOverdue = item.isOverdue;

            return (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-xs group space-y-2"
              >
                {/* Header row of card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                      isUrgent
                        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                        : isHigh
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                        : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                    }`}>
                      {item.priority}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      {item.sourceModule}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-slate-900 dark:text-white">
                    {item.businessReference || item.id}
                  </span>
                </div>

                {/* Title & Preview Click */}
                <div
                  onClick={() => onSelectWorkItem(item)}
                  className="cursor-pointer"
                >
                  <h5 className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {item.title}
                  </h5>
                  {item.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Amount if present */}
                {item.amount !== undefined && (
                  <div className="text-[10px] font-mono text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span>Giá trị:</span>
                    <strong className="text-slate-900 dark:text-white tabular-nums">
                      {item.amount.toLocaleString('vi-VN')} {item.currency || 'VND'}
                    </strong>
                  </div>
                )}

                {/* Footer of card: SLA & Actions */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Icons.Clock className="w-3 h-3" />
                    <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                      {isOverdue 
                        ? 'Đã quá hạn SLA' 
                        : item.dueAt 
                        ? new Date(item.dueAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                        : 'Theo SLA chuẩn'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onSelectWorkItem(item)}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                      title="Xem trước chứng từ"
                    >
                      Xem
                    </button>
                    {item.actions && item.actions.length > 0 && (
                      <button
                        type="button"
                        disabled={executingId === item.id}
                        onClick={() => promptActionConfirm(item, item.actions![0])}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold text-white transition-all cursor-pointer disabled:opacity-50 ${
                          item.actions[0].variant === 'danger'
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {executingId === item.id ? (
                          <Icons.Loader2 className="w-2.5 h-2.5 animate-spin inline mr-0.5" />
                        ) : null}
                        <span>{item.actions[0].label}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs mt-auto">
          <span className="text-[11px] text-slate-400 font-mono">
            Trang {page} / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer text-[10px]"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer text-[10px]"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
