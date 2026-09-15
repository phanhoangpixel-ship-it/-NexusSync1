import React, { useState, useMemo, useCallback } from 'react';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckSquare, Square, Plus, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import { EnterpriseTable, ColumnDef } from './EnterpriseTable';

export interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'number';
  options?: { label: string; value: string | number }[];
  placeholder?: string;
}

export interface EnterpriseSortState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface EnterpriseDataViewProps<T = any> {
  title?: string;
  description?: string;
  columns: ColumnDef[];
  data: T[];
  keyField?: string;
  
  // Module & Column Presets Persistence
  moduleId?: string;
  tableId?: string;
  tableName?: string;
  moduleName?: string;
  enableColumnPresets?: boolean;
  defaultHiddenColumns?: string[];
  mandatoryColumns?: string[];
  onVisibleColumnsChange?: (visibleKeys: string[]) => void;

  // Search & Filters
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filters?: FilterOption[];
  filterValues?: Record<string, any>;
  onFilterChange?: (key: string, val: any) => void;
  onResetFilters?: () => void;

  // Sorting
  sort?: EnterpriseSortState;
  onSortChange?: (field: string, direction: 'asc' | 'desc') => void;

  // Pagination
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };

  // Selection & Bulk Actions
  selectable?: boolean;
  selectedRowKeys?: (string | number)[];
  onSelectionChange?: (selectedKeys: (string | number)[]) => void;
  bulkActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: (selectedKeys: (string | number)[]) => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }[];

  // Primary & Toolbar Actions
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  secondaryActions?: React.ReactNode;
  toolbarExtra?: React.ReactNode;

  // Row Click & Detail Drawer
  onRowClick?: (row: T) => void;
  detailRenderer?: (row: T, onClose: () => void) => React.ReactNode;

  // States
  loading?: boolean;
  emptyMessage?: string;
  error?: string | null;
  className?: string;
}

const DEFAULT_HIDDEN_EMPTY: string[] = [];
const DEFAULT_MANDATORY_KEYS: string[] = ['_selection_checkbox'];

export const EnterpriseDataView = <T extends Record<string, any> = any>({
  title,
  description,
  columns,
  data,
  keyField = 'id',
  moduleId = 'general',
  tableId = 'data_view_table',
  tableName,
  moduleName,
  enableColumnPresets = true,
  defaultHiddenColumns = DEFAULT_HIDDEN_EMPTY,
  mandatoryColumns = DEFAULT_MANDATORY_KEYS,
  onVisibleColumnsChange,
  searchable = true,
  searchPlaceholder = 'Tìm kiếm bản ghi...',
  searchValue = '',
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  onResetFilters,
  sort,
  onSortChange,
  pagination,
  selectable = false,
  selectedRowKeys = [],
  onSelectionChange,
  bulkActions = [],
  primaryAction,
  secondaryActions,
  toolbarExtra,
  onRowClick,
  detailRenderer,
  loading = false,
  emptyMessage = 'Không có dữ liệu phù hợp.',
  error = null,
  className = '',
}: EnterpriseDataViewProps<T>) => {
  const [internalSearch, setInternalSearch] = useState(searchValue);
  const [activeDetailRow, setActiveDetailRow] = useState<T | null>(null);

  // Synchronize internal search state if searchValue prop updates
  React.useEffect(() => {
    setInternalSearch(searchValue);
  }, [searchValue]);

  // Handle Search Input
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalSearch(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  // Selection Logic
  const allCurrentKeys = useMemo(() => data.map(d => d[keyField]), [data, keyField]);
  const isAllPageSelected = useMemo(() => {
    if (allCurrentKeys.length === 0) return false;
    return allCurrentKeys.every(k => selectedRowKeys.includes(k));
  }, [allCurrentKeys, selectedRowKeys]);

  const handleToggleRow = (rowKey: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    if (selectedRowKeys.includes(rowKey)) {
      onSelectionChange(selectedRowKeys.filter(k => k !== rowKey));
    } else {
      onSelectionChange([...selectedRowKeys, rowKey]);
    }
  };

  // Enhance columns with selection checkbox if selectable
  const enhancedColumns = useMemo(() => {
    if (!selectable) return columns;
    const selectionCol: ColumnDef = {
      key: '_selection_checkbox',
      header: '',
      width: 50,
      align: 'center',
      className: 'w-12 text-center',
      render: (row: any) => {
        const rowKey = row[keyField];
        const isSelected = selectedRowKeys.includes(rowKey);
        return (
          <button
            type="button"
            onClick={(e) => handleToggleRow(rowKey, e)}
            className="text-slate-400 hover:text-blue-600 transition-colors"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-600 fill-blue-50" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        );
      },
    };
    return [selectionCol, ...columns];
  }, [columns, selectable, selectedRowKeys, keyField]);

  // Enhanced row click handler to trigger detail drawer if detailRenderer is provided
  const handleRowClickInternal = (row: T) => {
    if (onRowClick) {
      onRowClick(row);
    }
    if (detailRenderer) {
      setActiveDetailRow(row);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Title & Header Bar */}
      {(title || primaryAction || secondaryActions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div>
            {title && <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>}
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {secondaryActions}
            {primaryAction && (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95"
              >
                {primaryAction.icon || <Plus className="w-4 h-4" />}
                <span>{primaryAction.label}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search, Filters & Toolbar Container */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={internalSearch}
                onChange={handleSearchInput}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          )}

          {/* Bulk Actions Bar (when rows are selected) */}
          {selectable && selectedRowKeys.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs text-blue-800 animate-fadeIn">
              <span className="font-semibold font-mono">{selectedRowKeys.length}</span> bản ghi đã chọn
              <div className="h-4 w-px bg-blue-200 mx-1" />
              <div className="flex items-center gap-1.5">
                {bulkActions.map((act, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => act.onClick(selectedRowKeys)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      act.variant === 'danger'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-white hover:bg-blue-100 text-blue-700 border border-blue-300'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toolbar Extra */}
          {toolbarExtra && <div className="flex items-center gap-2 ml-auto">{toolbarExtra}</div>}
        </div>

        {/* Filters Bar */}
        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium inline-flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Bộ lọc:
            </span>
            {filters.map((f) => {
              const val = filterValues[f.key] !== undefined ? filterValues[f.key] : '';
              if (f.type === 'select') {
                return (
                  <select
                    key={f.key}
                    value={val}
                    onChange={(e) => onFilterChange && onFilterChange(f.key, e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">{f.placeholder || `Tất cả ${f.label}`}</option>
                    {f.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                );
              }
              return (
                <input
                  key={f.key}
                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                  value={val}
                  onChange={(e) => onFilterChange && onFilterChange(f.key, e.target.value)}
                  placeholder={f.placeholder || f.label}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              );
            })}
            {Object.keys(filterValues).length > 0 && onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-2 underline"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      {/* Main Table View */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-xs z-20 flex items-center justify-center rounded-xl">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              <span>Đang tải dữ liệu...</span>
            </div>
          </div>
        )}

        <EnterpriseTable
          columns={enhancedColumns}
          data={data}
          keyField={keyField}
          moduleId={moduleId}
          tableId={tableId}
          tableName={tableName || title}
          moduleName={moduleName}
          enableColumnPresets={enableColumnPresets}
          defaultHiddenColumns={defaultHiddenColumns}
          mandatoryColumns={mandatoryColumns}
          onVisibleColumnsChange={onVisibleColumnsChange}
          emptyMessage={emptyMessage}
          onRowClick={handleRowClickInternal}
        />
      </div>

      {/* Pagination Bar */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span>
              Hiển thị bản ghi{' '}
              <strong className="font-mono tabular-nums text-slate-900">
                {pagination.totalRecords === 0
                  ? 0
                  : (pagination.currentPage - 1) * pagination.pageSize + 1}
                –
                {Math.min(
                  pagination.currentPage * pagination.pageSize,
                  pagination.totalRecords
                )}
              </strong>{' '}
              trong tổng số{' '}
              <strong className="font-mono tabular-nums text-slate-900">
                {pagination.totalRecords.toLocaleString('vi-VN')}
              </strong>{' '}
              bản ghi
            </span>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Số dòng/trang:</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-medium text-slate-700"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              onClick={() => pagination.onPageChange(1)}
              className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang đầu"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-mono text-xs font-semibold text-slate-800">
              Trang {pagination.currentPage} / {Math.max(1, Math.ceil(pagination.totalRecords / pagination.pageSize))}
            </span>

            <button
              type="button"
              disabled={pagination.currentPage * pagination.pageSize >= pagination.totalRecords}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={pagination.currentPage * pagination.pageSize >= pagination.totalRecords}
              onClick={() =>
                pagination.onPageChange(
                  Math.ceil(pagination.totalRecords / pagination.pageSize) || 1
                )
              }
              className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang cuối"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Slide-over Detail Drawer */}
      {detailRenderer && activeDetailRow && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 transform transition-transform animate-slideInRight">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Chi tiết bản ghi</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveDetailRow(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-xs font-medium"
              >
                Đóng ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {detailRenderer(activeDetailRow, () => setActiveDetailRow(null))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseDataView;
