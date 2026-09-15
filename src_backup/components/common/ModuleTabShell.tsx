import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw, AlertCircle, Loader2, Plus, Download } from 'lucide-react';
import { PaginationControl, PaginationControlProps } from './PaginationControl';

export interface ModuleTabShellFilter {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'select' | 'text' | 'date';
  options?: { label: string; value: string | number }[];
  value: any;
  onChange: (value: any) => void;
}

export interface ModuleTabShellAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  tooltip?: string;
}

export interface ModuleTabShellProps {
  // Header Props
  title: string;
  description?: string;
  totalCount?: number;
  totalCountLabel?: string;
  actions?: ModuleTabShellAction[];
  headerExtra?: React.ReactNode;

  // Search & Filter Props
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchDebounceMs?: number;

  filters?: ModuleTabShellFilter[];
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
  filterExtra?: React.ReactNode;

  // State Props
  loading?: boolean;
  loadingMessage?: string;
  error?: string | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };

  // Pagination Props
  pagination?: Omit<PaginationControlProps, 'isLoading'>;

  // Layout & Container Props
  className?: string;
  contentClassName?: string;
  minHeight?: string; // e.g. "min-h-[500px]"
  children: React.ReactNode;
}

export const ModuleTabShell: React.FC<ModuleTabShellProps> = ({
  title,
  description,
  totalCount,
  totalCountLabel = 'bản ghi',
  actions = [],
  headerExtra,

  searchable = true,
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  searchValue = '',
  onSearchChange,
  searchDebounceMs = 300,

  filters = [],
  onResetFilters,
  hasActiveFilters = false,
  filterExtra,

  loading = false,
  loadingMessage = 'Đang tải dữ liệu hệ thống...',
  error = null,
  onRetry,
  isEmpty = false,
  emptyTitle = 'Không tìm thấy dữ liệu',
  emptyMessage = 'Không có bản ghi nào phù hợp với điều kiện tìm kiếm hoặc bộ lọc hiện tại.',
  emptyAction,

  pagination,

  className = '',
  contentClassName = '',
  minHeight = 'min-h-[480px]',
  children,
}) => {
  const [internalSearch, setInternalSearch] = useState(searchValue);

  // Debounced search sync
  useEffect(() => {
    setInternalSearch(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (!onSearchChange) return;
    const timer = setTimeout(() => {
      if (internalSearch !== searchValue) {
        onSearchChange(internalSearch);
      }
    }, searchDebounceMs);
    return () => clearTimeout(timer);
  }, [internalSearch, searchDebounceMs, onSearchChange, searchValue]);

  return (
    <div className={`flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden ${className}`}>
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h2>
              {totalCount !== undefined && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  {totalCount.toLocaleString()} {totalCountLabel}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right Actions & Extra Header */}
        <div className="flex flex-wrap items-center gap-2.5">
          {headerExtra}
          {actions.map((act, idx) => {
            const isPrimary = act.variant === 'primary';
            const isDanger = act.variant === 'danger';
            const isOutline = act.variant === 'outline';
            return (
              <button
                key={idx}
                type="button"
                onClick={act.onClick}
                disabled={act.disabled}
                title={act.tooltip}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isPrimary
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                    : isDanger
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
                    : isOutline
                    ? 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                {act.icon}
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      {(searchable || filters.length > 0 || filterExtra || hasActiveFilters) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
            {searchable && (
              <div className="relative min-w-[260px] flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={internalSearch}
                  onChange={(e) => setInternalSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-9 pl-9 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            )}

            {/* Dynamic Quick Filters */}
            {filters.map((f) => (
              <div key={f.key} className="flex items-center gap-1.5">
                {f.type === 'select' || f.options ? (
                  <select
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    className="h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">{f.placeholder || f.label}</option>
                    {f.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={f.value || ''}
                    onChange={(e) => f.onChange(e.target.value)}
                    placeholder={f.placeholder || f.label}
                    className="h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                )}
              </div>
            ))}

            {hasActiveFilters && onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                title="Xóa tất cả bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại bộ lọc</span>
              </button>
            )}
          </div>

          {filterExtra && (
            <div className="flex items-center gap-2">
              {filterExtra}
            </div>
          )}
        </div>
      )}

      {/* 3. Content Area with independent scroll & min-height */}
      <div className={`relative flex-1 overflow-auto bg-white dark:bg-slate-900 ${minHeight} ${contentClassName}`}>
        {loading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-3">{loadingMessage}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Đã xảy ra lỗi hệ thống</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Thử lại ngay
              </button>
            )}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
              <Filter className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{emptyTitle}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{emptyMessage}</p>
            {emptyAction && (
              <button
                type="button"
                onClick={emptyAction.onClick}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {emptyAction.icon}
                <span>{emptyAction.label}</span>
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>

      {/* 4. Footer / Pagination (Pinned) */}
      {pagination && (
        <div className="sticky bottom-0 z-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <PaginationControl {...pagination} isLoading={loading} />
        </div>
      )}
    </div>
  );
};
