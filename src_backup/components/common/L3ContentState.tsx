import React from 'react';
import { RefreshCw, AlertTriangle, Inbox, SearchX, Plus, RotateCcw, ArrowRight } from 'lucide-react';

export interface L3ContentStateProps {
  /**
   * Current loading state
   */
  isLoading?: boolean;
  /**
   * Error message if any
   */
  error?: string | null;
  /**
   * Whether the dataset is empty
   */
  isEmpty?: boolean;
  /**
   * Callback when clicking retry
   */
  onRetry?: () => void;
  /**
   * Custom message or title for empty state
   */
  emptyTitle?: string;
  emptyDescription?: string;
  /**
   * Primary action for empty state (e.g., Reset filter, Add new, Refresh)
   */
  emptyAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  /**
   * Skeleton configuration
   */
  skeletonRows?: number;
  skeletonCols?: number;
  /**
   * Type of skeleton layout: 'table' | 'cards' | 'metrics'
   */
  skeletonType?: 'table' | 'cards' | 'metrics';
  /**
   * Minimum height to avoid layout shift (CLS)
   */
  minHeight?: string;
  /**
   * Children to render when ready
   */
  children?: React.ReactNode;
}

export const L3ContentState: React.FC<L3ContentStateProps> = ({
  isLoading = false,
  error = null,
  isEmpty = false,
  onRetry,
  emptyTitle = 'Không tìm thấy dữ liệu',
  emptyDescription = 'Hiện chưa có bản ghi nào phù hợp với điều kiện tìm kiếm hoặc lọc hiện tại.',
  emptyAction,
  skeletonRows = 6,
  skeletonCols = 7,
  skeletonType = 'table',
  minHeight = 'min-h-[420px]',
  children,
}) => {
  // 1. LOADING STATE (High-fidelity skeleton with zero layout shift)
  if (isLoading) {
    return (
      <div className={`w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden ${minHeight} flex flex-col justify-between animate-pulse`} id="l3-loading-skeleton">
        {skeletonType === 'table' ? (
          <div className="w-full">
            {/* Table Header Skeleton */}
            <div className="bg-slate-50 dark:bg-slate-900/80 px-4 py-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-32" />
              <div className="flex items-center gap-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-24" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-20" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-28" />
              </div>
            </div>

            {/* Table Rows Skeleton */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {Array.from({ length: skeletonRows }).map((_, rIdx) => (
                <div key={rIdx} className="px-4 py-3.5 flex items-center justify-between gap-4">
                  {/* Col 1: Code / ID */}
                  <div className="flex items-center gap-2.5 w-1/5">
                    <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 shrink-0" />
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                  </div>
                  {/* Col 2: Badge */}
                  <div className="w-1/6">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
                  </div>
                  {/* Col 3: Title & Subtitle */}
                  <div className="w-1/4 space-y-1.5">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-700/60 rounded w-1/2" />
                  </div>
                  {/* Col 4: Mono Number */}
                  <div className="w-1/8 text-center flex justify-center">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                  </div>
                  {/* Col 5: Location / Date */}
                  <div className="w-1/6">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                  </div>
                  {/* Col 6: Status */}
                  <div className="w-1/8 flex justify-center">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-16" />
                  </div>
                  {/* Col 7: Actions */}
                  <div className="w-16 flex justify-end gap-1.5">
                    <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                    <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : skeletonType === 'cards' ? (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, cIdx) => (
              <div key={cIdx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-16" />
                </div>
                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
            <div className="h-48 bg-slate-100 dark:bg-slate-700/50 rounded-xl" />
          </div>
        )}

        {/* Skeleton Footer Bar */}
        <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-36" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    );
  }

  // 2. ERROR STATE (With prominent Retry CTA)
  if (error) {
    return (
      <div 
        className={`w-full bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-xl p-8 flex flex-col items-center justify-center text-center ${minHeight}`}
        id="l3-error-container"
      >
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 shadow-xs">
          <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h3 className="text-base font-bold text-rose-900 dark:text-rose-200 mb-1">
          Không thể tải dữ liệu Content Area (L3)
        </h3>
        <p className="text-xs text-rose-700 dark:text-rose-300/80 max-w-md mb-6 leading-relaxed">
          {error || 'Đã có lỗi xảy ra trong quá trình truy vấn hệ thống kho vận hoặc kết nối bị gián đoạn.'}
        </p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-md"
            id="btn-l3-retry"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử lại ngay</span>
          </button>
        )}
      </div>
    );
  }

  // 3. EMPTY STATE (With Quick Action Button)
  if (isEmpty) {
    return (
      <div 
        className={`w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center text-center ${minHeight}`}
        id="l3-empty-container"
      >
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
          <Inbox className="w-8 h-8 stroke-[1.8]" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1.5">
          {emptyTitle}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
          {emptyDescription}
        </p>

        {emptyAction && (
          <button
            onClick={emptyAction.onClick}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer ${
              emptyAction.variant === 'primary'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : emptyAction.variant === 'outline'
                ? 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200'
            }`}
            id="btn-l3-empty-action"
          >
            {emptyAction.icon || <RotateCcw className="w-3.5 h-3.5" />}
            <span>{emptyAction.label}</span>
          </button>
        )}
      </div>
    );
  }

  // Render children content directly when data is ready
  return <>{children}</>;
};
