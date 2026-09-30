import React from 'react';
import { KpiBar, KpiMetricItem } from './KpiBar';
import { FilterBar, FilterDropdownConfig } from './FilterBar';
import { TablePagination } from './TablePagination';
import { BulkActionBar, BulkActionItem } from './BulkActionBar';
import { ConfirmDialog } from './ConfirmDialog';
import { ConfirmDialogState } from '../../types';

export interface StandardModuleLayoutProps {
  title?: string;
  subtitle?: string;
  headerIcon?: React.ReactNode;
  headerActions?: React.ReactNode;
  kpiMetrics?: KpiMetricItem[];
  kpiColumns?: 2 | 3 | 4 | 5 | 6;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchPlaceholder?: string;
  filterDropdowns?: FilterDropdownConfig[];
  viewMode?: 'table' | 'cards' | 'auto';
  onViewModeChange?: (mode: 'table' | 'cards' | 'auto') => void;
  onResetFilters?: () => void;
  filterActions?: React.ReactNode;
  children: React.ReactNode;
  // Pagination
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  // Bulk Action Bar
  selectedCount?: number;
  totalCount?: number;
  itemName?: string;
  onClearSelection?: () => void;
  bulkActions?: BulkActionItem[];
  // Confirm Dialog
  confirmDialog?: ConfirmDialogState | null;
  className?: string;
}

export const StandardModuleLayout: React.FC<StandardModuleLayoutProps> = ({
  title,
  subtitle,
  headerIcon,
  headerActions,
  kpiMetrics,
  kpiColumns = 4,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  filterDropdowns,
  viewMode,
  onViewModeChange,
  onResetFilters,
  filterActions,
  children,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 25, 50, 100],
  selectedCount = 0,
  totalCount,
  itemName = 'mục',
  onClearSelection,
  bulkActions = [],
  confirmDialog,
  className = '',
}) => {
  return (
    <div className={`space-y-4 animate-in fade-in duration-200 ${className}`}>
      {/* Optional Top Header Strip */}
      {(title || headerActions) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            {headerIcon && (
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                {headerIcon}
              </div>
            )}
            <div>
              {title && (
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 shrink-0">{headerActions}</div>
          )}
        </div>
      )}

      {/* KPI Metric Strip */}
      {kpiMetrics && kpiMetrics.length > 0 && (
        <KpiBar metrics={kpiMetrics} columns={kpiColumns} />
      )}

      {/* Filter Bar */}
      {onSearchChange !== undefined && searchQuery !== undefined && (
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          dropdowns={filterDropdowns}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          onResetFilters={onResetFilters}
          actions={filterActions}
        />
      )}

      {/* Main Content Area (Table or Cards) */}
      <div>{children}</div>

      {/* Standard Table Pagination */}
      {currentPage !== undefined &&
        pageSize !== undefined &&
        totalItems !== undefined &&
        onPageChange !== undefined && (
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={pageSizeOptions}
          />
        )}

      {/* Bulk Action Floating Bar */}
      {selectedCount > 0 && onClearSelection && (
        <BulkActionBar
          selectedCount={selectedCount}
          totalCount={totalCount ?? totalItems ?? selectedCount}
          itemName={itemName}
          onClearSelection={onClearSelection}
          actions={bulkActions}
        />
      )}

      {/* Enterprise Confirm Dialog */}
      {confirmDialog && <ConfirmDialog state={confirmDialog} />}
    </div>
  );
};
