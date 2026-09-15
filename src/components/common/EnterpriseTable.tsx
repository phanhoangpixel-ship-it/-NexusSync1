import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Layers, Zap, ArrowUp, ArrowDown, SlidersHorizontal } from 'lucide-react';
import { useColumnPresets } from '../../hooks/useColumnPresets';
import { ColumnPresetsModal } from './ColumnPresetsModal';

export interface ColumnDef {
  key: string;
  header: string;
  width?: number; // Initial width in pixels
  minWidth?: number;
  className?: string;
  align?: 'left' | 'center' | 'right';
  isNumeric?: boolean;
  type?: 'text' | 'number' | 'currency' | 'code' | 'badge' | 'date';
  render?: (row: any, index: number) => React.ReactNode;
}

export interface EnterpriseTableProps {
  columns: ColumnDef[];
  data: any[];
  keyField?: string;
  stickyFirstColumn?: boolean;
  stickyHeader?: boolean;
  resizableColumns?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: any) => void;
  // Module & Column Presets Persistence:
  moduleId?: string;
  tableId?: string;
  tableName?: string;
  moduleName?: string;
  enableColumnPresets?: boolean; // Defaults to true
  defaultHiddenColumns?: string[];
  mandatoryColumns?: string[];
  onVisibleColumnsChange?: (visibleKeys: string[]) => void;
  // Virtual Scrolling Extensions:
  virtualized?: boolean; // When true or auto (data > 50), enables virtual rendering
  rowHeight?: number; // Estimated/fixed row height in pixels (default 44)
  maxHeight?: number | string; // Maximum container height (e.g. 520, '65vh')
  overscan?: number; // Buffer rows rendered outside viewport (default 10)
  showVirtualMetrics?: boolean; // Show virtual rendering stats badge
  toolbar?: React.ReactNode;
}

const DEFAULT_EMPTY_COLUMNS: string[] = [];
const DEFAULT_MANDATORY_COLS: string[] = ['_selection_checkbox'];

export const EnterpriseTable: React.FC<EnterpriseTableProps> = ({
  columns,
  data,
  keyField = 'id',
  stickyFirstColumn = true,
  stickyHeader = true,
  resizableColumns = true,
  emptyMessage = 'Không có dữ liệu hiển thị.',
  className = '',
  onRowClick,
  moduleId = 'general',
  tableId = 'default_table',
  tableName,
  moduleName,
  enableColumnPresets = true,
  defaultHiddenColumns = DEFAULT_EMPTY_COLUMNS,
  mandatoryColumns = DEFAULT_MANDATORY_COLS,
  onVisibleColumnsChange,
  virtualized,
  rowHeight = 44,
  maxHeight = 520,
  overscan = 10,
  showVirtualMetrics = true,
  toolbar,
}) => {
  // Column Presets Hook
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

  const columnPresetsState = useColumnPresets({
    moduleId,
    tableId,
    columns,
    defaultHiddenKeys: defaultHiddenColumns,
    mandatoryKeys: mandatoryColumns,
    onColumnsChange: onVisibleColumnsChange,
  });

  const effectiveColumns = useMemo(() => {
    if (!enableColumnPresets) return columns;
    return columnPresetsState.visibleColumns;
  }, [enableColumnPresets, columns, columnPresetsState.visibleColumns]);

  // Determine if virtualization should be active
  // By default, auto-activate if dataset has 50+ rows or virtualized is explicitly true
  const isVirtualActive = virtualized !== undefined ? virtualized : data.length >= 50;

  // Container & Scroll references
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(
    typeof maxHeight === 'number' ? maxHeight : 520
  );

  // Measure container height with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          setContainerHeight(entry.contentRect.height);
        }
      }
    });

    observer.observe(el);
    if (el.clientHeight > 0) {
      setContainerHeight(el.clientHeight);
    }

    return () => observer.disconnect();
  }, []);

  // Passive high-performance scroll listener
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    setScrollTop(currentScrollTop);
  }, []);

  // Virtual slice calculation
  const totalRows = data.length;
  const { startIndex, endIndex, topSpacerHeight, bottomSpacerHeight, visibleRows } = useMemo(() => {
    if (!isVirtualActive || totalRows === 0) {
      return {
        startIndex: 0,
        endIndex: totalRows,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
        visibleRows: data,
      };
    }

    const effectiveRowHeight = Math.max(24, rowHeight);
    // Calculate raw indices
    const calculatedStart = Math.floor(scrollTop / effectiveRowHeight);
    const visibleCount = Math.ceil(containerHeight / effectiveRowHeight);

    const start = Math.max(0, calculatedStart - overscan);
    const end = Math.min(totalRows, calculatedStart + visibleCount + overscan);

    const topSpacer = start * effectiveRowHeight;
    const bottomSpacer = Math.max(0, (totalRows - end) * effectiveRowHeight);

    return {
      startIndex: start,
      endIndex: end,
      topSpacerHeight: topSpacer,
      bottomSpacerHeight: bottomSpacer,
      visibleRows: data.slice(start, end),
    };
  }, [isVirtualActive, data, totalRows, scrollTop, containerHeight, rowHeight, overscan]);

  // Scroll to row or top/bottom helpers
  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: totalRows * rowHeight,
        behavior: 'smooth',
      });
    }
  };

  // Column widths state
  const [colWidths, setColWidths] = useState<{ [key: string]: number }>(() => {
    const initial: { [key: string]: number } = {};
    columns.forEach((col) => {
      initial[col.key] = col.width || 150;
    });
    return initial;
  });

  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      key,
      startX: e.clientX,
      startWidth: colWidths[key] || 150,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const { key, startX, startWidth } = resizingRef.current;
      const delta = moveEvent.clientX - startX;
      const colDef = columns.find((c) => c.key === key);
      const minW = colDef?.minWidth || 80;
      const newWidth = Math.max(minW, startWidth + delta);

      setColWidths((prev) => ({
        ...prev,
        [key]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Calculate percentage of DOM nodes saved
  const domSavedPercentage =
    totalRows > 0 ? Math.max(0, Math.round((1 - visibleRows.length / totalRows) * 100)) : 0;

  const hasToolbarContent = Boolean(
    toolbar || enableColumnPresets || (isVirtualActive && showVirtualMetrics && totalRows >= 50)
  );

  return (
    <div className={`border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-2xs overflow-hidden flex flex-col ${className}`}>
      {/* Optional Toolbar, Column Presets & Virtual Metrics Header */}
      {hasToolbarContent && (
        <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {toolbar}
            {enableColumnPresets && (
              <button
                type="button"
                onClick={() => setIsColumnModalOpen(true)}
                title="Tùy chỉnh chọn cột hiển thị & lưu mẫu (Column Presets)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Cột:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {columnPresetsState.visibleColumnCount}/{columnPresetsState.totalColumnCount}
                </span>
                {columnPresetsState.activePreset && columnPresetsState.activePreset.id !== 'system_all' && (
                  <span className="hidden sm:inline-block text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate max-w-[90px]">
                    ({columnPresetsState.activePreset.name})
                  </span>
                )}
              </button>
            )}
          </div>

          {isVirtualActive && showVirtualMetrics && totalRows >= 50 && (
            <div className="flex items-center gap-3 ml-auto text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-mono font-semibold">
                <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400 animate-pulse" />
                Virtual Scrolling: Dựng {visibleRows.length}/{totalRows} dòng ({domSavedPercentage}% DOM saved)
              </span>
              <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={scrollToTop}
                  title="Cuộn lên đầu trang"
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={scrollToBottom}
                  title="Cuộn xuống cuối danh sách"
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Scrollable Viewport */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
          overflowY: 'auto',
          overflowX: 'auto',
          position: 'relative',
        }}
        className="w-full will-change-scroll scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-400"
      >
        <table className="w-full text-left border-collapse text-xs">
          <thead className={`select-none ${stickyHeader ? 'sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700' : ''}`}>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider shadow-2xs">
              {effectiveColumns.map((col, index) => {
                const isSticky = stickyFirstColumn && index === 0;
                const width = colWidths[col.key] || col.width || 150;
                const isNumeric = col.isNumeric || col.type === 'number' || col.type === 'currency' || col.align === 'right';
                const alignClass = isNumeric ? 'justify-end text-right' : col.align === 'center' ? 'justify-center text-center' : 'justify-start text-left';

                return (
                  <th
                    key={col.key}
                    style={{ width, minWidth: width }}
                    className={`p-3 relative group transition-colors ${
                      isSticky
                        ? 'sticky left-0 z-40 bg-slate-100 dark:bg-slate-800 border-r-2 border-slate-300 dark:border-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]'
                        : 'bg-slate-50 dark:bg-slate-800'
                    } ${col.className || ''}`}
                  >
                    <div className={`flex items-center ${alignClass} truncate pr-2`}>
                      <span className="truncate">{col.header}</span>
                    </div>

                    {/* Resizer Handle */}
                    {resizableColumns && (
                      <div
                        onMouseDown={(e) => handleMouseDown(e, col.key)}
                        className="absolute top-0 right-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400/55 transition-colors group-hover:bg-slate-300 dark:group-hover:bg-slate-600 flex items-center justify-center"
                        title="Kéo để thay đổi độ rộng cột"
                      >
                        <div className="w-0.5 h-4 bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-600 rounded-full" />
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            {totalRows === 0 ? (
              <tr>
                <td colSpan={effectiveColumns.length} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              <>
                {/* Virtual Top Spacer */}
                {topSpacerHeight > 0 && (
                  <tr style={{ height: `${topSpacerHeight}px` }}>
                    <td
                      colSpan={effectiveColumns.length}
                      style={{ height: `${topSpacerHeight}px`, padding: 0, border: 'none' }}
                      aria-hidden="true"
                    />
                  </tr>
                )}

                {/* Visible Virtual Rows */}
                {visibleRows.map((row, relativeIndex) => {
                  const absoluteIndex = startIndex + relativeIndex;
                  const rowKey = row[keyField] || absoluteIndex;
                  return (
                    <tr
                      key={rowKey}
                      onClick={() => onRowClick && onRowClick(row)}
                      style={{ height: `${rowHeight}px` }}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                    >
                      {effectiveColumns.map((col, colIndex) => {
                        const isSticky = stickyFirstColumn && colIndex === 0;
                        const width = colWidths[col.key] || col.width || 150;
                        const isNumeric = col.isNumeric || col.type === 'number' || col.type === 'currency' || col.align === 'right';
                        const isCode = col.type === 'code';
                        const cellAlignment = isNumeric
                          ? 'text-right font-mono tabular-nums'
                          : isCode
                          ? 'font-mono'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left';

                        const cellContent = col.render ? col.render(row, absoluteIndex) : row[col.key];

                        return (
                          <td
                            key={col.key}
                            style={{ width, minWidth: width }}
                            className={`p-3 truncate ${cellAlignment} ${
                              isSticky
                                ? 'sticky left-0 z-10 bg-white dark:bg-slate-900 border-r-2 border-slate-200 dark:border-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]'
                                : ''
                            } ${col.className || ''}`}
                          >
                            <div className="truncate">{cellContent}</div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Virtual Bottom Spacer */}
                {bottomSpacerHeight > 0 && (
                  <tr style={{ height: `${bottomSpacerHeight}px` }}>
                    <td
                      colSpan={effectiveColumns.length}
                      style={{ height: `${bottomSpacerHeight}px`, padding: 0, border: 'none' }}
                      aria-hidden="true"
                    />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary Info */}
      <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>Tổng số bản ghi: <strong className="font-mono tabular-nums text-slate-700 dark:text-slate-300">{totalRows.toLocaleString('vi-VN')}</strong></span>
        </div>
        {isVirtualActive && totalRows >= 50 && (
          <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">
            Hiển thị dòng {startIndex + 1}–{endIndex} (Virtual Buffer: ±{overscan})
          </span>
        )}
      </div>

      {/* Column Presets Modal Dialog */}
      {enableColumnPresets && (
        <ColumnPresetsModal
          isOpen={isColumnModalOpen}
          onClose={() => setIsColumnModalOpen(false)}
          columns={columns}
          visibleColumnKeys={columnPresetsState.visibleColumnKeys}
          presets={columnPresetsState.presets}
          customPresets={columnPresetsState.customPresets}
          activePresetId={columnPresetsState.activePresetId}
          mandatoryKeys={mandatoryColumns}
          tableName={tableName || tableId}
          moduleName={moduleName || moduleId}
          onToggleColumn={columnPresetsState.toggleColumn}
          onApplyPreset={columnPresetsState.applyPreset}
          onSavePreset={columnPresetsState.saveCurrentAsPreset}
          onDeletePreset={columnPresetsState.deletePreset}
          onShowAll={columnPresetsState.showAllColumns}
          onResetToDefault={columnPresetsState.resetToDefault}
        />
      )}
    </div>
  );
};

export default EnterpriseTable;

