import React from 'react';
import { Search, Table, LayoutGrid, RotateCcw } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDropdownConfig {
  id: string;
  label?: string;
  value: string;
  options: FilterOption[];
  onChange: (val: string) => void;
  className?: string;
}

export interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  dropdowns?: FilterDropdownConfig[];
  viewMode?: 'table' | 'cards' | 'auto';
  onViewModeChange?: (mode: 'table' | 'cards' | 'auto') => void;
  onResetFilters?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm nhanh mã, tên, đối tác...',
  dropdowns = [],
  viewMode,
  onViewModeChange,
  onResetFilters,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${className}`}
    >
      {/* Search and Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {dropdowns.map((drop) => (
          <div key={drop.id} className="relative">
            <select
              value={drop.value}
              onChange={(e) => drop.onChange(e.target.value)}
              className={`px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                drop.className || ''
              }`}
            >
              {drop.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right side: View Mode Toggle & Custom Action Buttons */}
      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
        {onViewModeChange && viewMode && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
              title="Xem dạng Bảng (Table)"
            >
              <Table className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
              title="Xem dạng Thẻ (Cards)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {actions}
      </div>
    </div>
  );
};
