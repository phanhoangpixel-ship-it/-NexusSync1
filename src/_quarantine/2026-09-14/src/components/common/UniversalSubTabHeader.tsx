import React, { useState } from 'react';
import { Search, RefreshCw, SlidersHorizontal, Plus, Download, ChevronDown } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { TabErrorIndicator } from './TabErrorIndicator';

export interface SubTabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
  alert?: boolean;
  hasErrors?: boolean;
  errorCount?: number;
}

export interface UniversalSubTabHeaderProps {
  tabs: SubTabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  statusFilters?: { id: string; label: string; count?: number }[];
  activeStatusFilter?: string;
  onStatusFilterChange?: (statusId: string) => void;
  density?: 'compact' | 'normal' | 'comfortable';
  onDensityChange?: (density: 'compact' | 'normal' | 'comfortable') => void;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export const UniversalSubTabHeader: React.FC<UniversalSubTabHeaderProps> = ({
  tabs,
  activeTab,
  onTabChange,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm theo mã, tên, từ khóa...',
  statusFilters = [],
  activeStatusFilter = 'ALL',
  onStatusFilterChange,
  density = 'normal',
  onDensityChange,
  primaryActionLabel,
  onPrimaryAction,
  onExport,
  onRefresh,
  isRefreshing = false,
  className = '',
}) => {
  const [showDensityMenu, setShowDensityMenu] = useState(false);

  return (
    <div className={`bg-white border-b border-slate-200 shadow-2xs ${className}`}>
      {/* Zone 1: Tab Navigation */}
      <div className="flex items-center overflow-x-auto px-4 pt-3 border-b border-slate-100 scrollbar-none">
        <div className="flex space-x-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-colors rounded-t-lg border-t border-x ${
                  isActive
                    ? 'bg-blue-50/30 text-blue-700 border-slate-200 border-b-2 border-b-blue-600'
                    : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {(tab.hasErrors || (tab.errorCount !== undefined && tab.errorCount > 0)) ? (
                  <TabErrorIndicator hasError={true} count={tab.errorCount} />
                ) : tab.alert ? (
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse ring-2 ring-white" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Zone 2 & Zone 3: Smart Filter Toolbar & Primary Actions */}
      <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/50">
        {/* Zone 2: Smart Filter & Search */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {onSearchChange && (
            <div className="relative min-w-[260px] max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* Status Chips */}
          {statusFilters.length > 0 && onStatusFilterChange && (
            <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
              {statusFilters.map((st) => {
                const isSelected = activeStatusFilter === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => onStatusFilterChange(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shadow-2xs ${
                      isSelected
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {st.label}
                    {st.count !== undefined && <span className="ml-1 opacity-75 font-mono">({st.count})</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Zone 3: Primary Action Center */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Density Selector */}
          {onDensityChange && (
            <div className="relative">
              <button
                onClick={() => setShowDensityMenu(!showDensityMenu)}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-1.5 text-xs font-medium shadow-2xs"
                title="Mật độ hiển thị"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="capitalize">{density === 'compact' ? 'Dày' : density === 'comfortable' ? 'Rộng' : 'Chuẩn'}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>

              {showDensityMenu && (
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-200 z-30 py-1 text-xs">
                  <button
                    onClick={() => {
                      onDensityChange('compact');
                      setShowDensityMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium ${density === 'compact' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'}`}
                  >
                    Dày (Compact)
                  </button>
                  <button
                    onClick={() => {
                      onDensityChange('normal');
                      setShowDensityMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium ${density === 'normal' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'}`}
                  >
                    Chuẩn (Normal)
                  </button>
                  <button
                    onClick={() => {
                      onDensityChange('comfortable');
                      setShowDensityMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium ${density === 'comfortable' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'}`}
                  >
                    Rộng (Comfortable)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          )}

          {/* Export Button */}
          {onExport && (
            <button
              onClick={onExport}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
              title="Xuất dữ liệu Excel/PDF"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Xuất File</span>
            </button>
          )}

          {/* Primary CTA Button */}
          {primaryActionLabel && onPrimaryAction && (
            <button
              onClick={onPrimaryAction}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{primaryActionLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
