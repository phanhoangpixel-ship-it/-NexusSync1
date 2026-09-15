import React, { useState, useMemo } from 'react';
import {
  Columns,
  Search,
  Check,
  Plus,
  Trash2,
  RotateCcw,
  SlidersHorizontal,
  Bookmark,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
} from 'lucide-react';
import type { ColumnDef } from './EnterpriseTable';
import type { ColumnPreset } from '../../hooks/useColumnPresets';

export interface ColumnPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnDef[];
  visibleColumnKeys: string[];
  presets: ColumnPreset[];
  customPresets: ColumnPreset[];
  activePresetId: string;
  mandatoryKeys?: string[];
  tableName?: string;
  moduleName?: string;
  onToggleColumn: (key: string) => void;
  onApplyPreset: (presetId: string) => void;
  onSavePreset: (name: string) => void;
  onDeletePreset: (presetId: string) => void;
  onShowAll: () => void;
  onResetToDefault: () => void;
}

export const ColumnPresetsModal: React.FC<ColumnPresetsModalProps> = ({
  isOpen,
  onClose,
  columns,
  visibleColumnKeys,
  presets,
  customPresets,
  activePresetId,
  mandatoryKeys = ['_selection_checkbox'],
  tableName = 'Bảng dữ liệu',
  moduleName = 'Phân hệ',
  onToggleColumn,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  onShowAll,
  onResetToDefault,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Filter columns based on search
  const filteredColumns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return columns;
    return columns.filter(
      (col) =>
        col.header.toLowerCase().includes(query) ||
        col.key.toLowerCase().includes(query) ||
        (col.type && col.type.toLowerCase().includes(query))
    );
  }, [columns, searchQuery]);

  // Handle Save New Preset
  const handleSavePresetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    onSavePreset(newPresetName.trim());
    setNewPresetName('');
    setIsCreatingPreset(false);
  };

  if (!isOpen) return null;

  const totalCount = columns.length;
  const visibleCount = visibleColumnKeys.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/80 dark:border-blue-800/60 shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Tùy Chỉnh Cột &amp; Mẫu Hiển Thị
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold">
                  {visibleCount}/{totalCount} Cột
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {moduleName} • {tableName} (Lưu cấu hình tự động cho tài khoản)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Preset Selector Bar */}
        <div className="px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Mẫu cột đã lưu (Presets):</span>
            </span>

            {!isCreatingPreset ? (
              <button
                type="button"
                onClick={() => setIsCreatingPreset(true)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Lưu góc nhìn hiện tại...</span>
              </button>
            ) : null}
          </div>

          {/* New Preset Form Inline */}
          {isCreatingPreset && (
            <form
              onSubmit={handleSavePresetSubmit}
              className="flex items-center gap-2 p-2 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl"
            >
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Nhập tên mẫu (VD: Báo cáo Kế toán, Kiểm toán 2026...)"
                autoFocus
                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!newPresetName.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingPreset(false);
                  setNewPresetName('');
                }}
                className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Hủy
              </button>
            </form>
          )}

          {/* Preset Pills List */}
          <div className="flex flex-wrap items-center gap-1.5">
            {presets.map((preset) => {
              const isActive = activePresetId === preset.id;
              const isCustom = !preset.isSystem;

              return (
                <div
                  key={preset.id}
                  className={`inline-flex items-center rounded-xl transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onApplyPreset(preset.id)}
                    className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {preset.isSystem ? (
                      <Sparkles className="w-3 h-3 text-amber-300" />
                    ) : (
                      <Bookmark className="w-3 h-3 text-blue-300" />
                    )}
                    <span>{preset.name}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {preset.columnKeys.length}
                    </span>
                  </button>

                  {isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePreset(preset.id);
                      }}
                      title="Xóa mẫu tùy chỉnh này"
                      className={`pr-2 pl-1 py-1.5 text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'text-blue-200 hover:text-white'
                          : 'text-slate-400 hover:text-red-500'
                      }`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Search & Quick Actions Bar */}
        <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2">
          {/* Column Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tên cột hoặc mã trường..."
              className="w-full pl-8.5 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onShowAll}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Hiện tất cả</span>
            </button>
            <button
              type="button"
              onClick={() => onApplyPreset('system_compact')}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              <span>Tối giản</span>
            </button>
          </div>
        </div>

        {/* Columns Checkbox Grid */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredColumns.map((col) => {
              const isMandatory = mandatoryKeys.includes(col.key);
              const isVisible = visibleColumnKeys.includes(col.key) || isMandatory;
              const isNumeric =
                col.isNumeric || col.type === 'number' || col.type === 'currency' || col.align === 'right';

              return (
                <div
                  key={col.key}
                  onClick={() => !isMandatory && onToggleColumn(col.key)}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 select-none ${
                    isMandatory
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 opacity-80 cursor-default'
                      : isVisible
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 hover:border-blue-300 cursor-pointer'
                      : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      disabled={isMandatory}
                      className="text-slate-400 dark:text-slate-500 focus:outline-none shrink-0"
                    >
                      {isMandatory ? (
                        <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      ) : isVisible ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {col.header || col.key}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                        key: {col.key}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {col.type && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {col.type}
                      </span>
                    )}
                    {isNumeric && !col.type && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        Số
                      </span>
                    )}
                    {isMandatory && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                        Cố định
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredColumns.length === 0 && (
            <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
              Không tìm thấy cột nào khớp với từ khóa &ldquo;{searchQuery}&rdquo;.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!showConfirmReset ? (
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục mặc định</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800">
                <span className="text-xs font-bold text-red-700 dark:text-red-300">
                  Xóa tất cả mẫu và khôi phục?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onResetToDefault();
                    setShowConfirmReset(false);
                  }}
                  className="px-2 py-0.5 bg-red-600 text-white rounded text-xs font-bold cursor-pointer"
                >
                  Xác nhận
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs font-bold"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Hoàn tất &amp; Áp dụng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnPresetsModal;
