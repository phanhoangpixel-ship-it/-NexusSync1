import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, Bookmark, Sparkles } from 'lucide-react';
import type { ColumnDef } from './EnterpriseTable';
import { useColumnPresets, type ColumnPreset } from '../../hooks/useColumnPresets';
import { ColumnPresetsModal } from './ColumnPresetsModal';

export interface ColumnPresetsButtonProps {
  moduleId?: string;
  tableId?: string;
  tableName?: string;
  moduleName?: string;
  columns: ColumnDef[];
  defaultHiddenKeys?: string[];
  mandatoryKeys?: string[];
  onColumnsChange?: (visibleKeys: string[]) => void;
  className?: string;
  variant?: 'compact' | 'standard' | 'minimal';
}

export const ColumnPresetsButton: React.FC<ColumnPresetsButtonProps> = ({
  moduleId = 'general',
  tableId = 'default_table',
  tableName,
  moduleName,
  columns,
  defaultHiddenKeys,
  mandatoryKeys,
  onColumnsChange,
  className = '',
  variant = 'standard',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columnPresets = useColumnPresets({
    moduleId,
    tableId,
    columns,
    defaultHiddenKeys,
    mandatoryKeys,
    onColumnsChange,
  });

  const {
    visibleColumnCount,
    totalColumnCount,
    activePreset,
    presets,
    customPresets,
    activePresetId,
    visibleColumnKeys,
    toggleColumn,
    applyPreset,
    saveCurrentAsPreset,
    deletePreset,
    showAllColumns,
    resetToDefault,
  } = columnPresets;

  const isCustomOrPartial = visibleColumnCount < totalColumnCount || activePresetId !== 'system_all';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        title="Tùy chỉnh cột và lưu mẫu hiển thị (Presets)"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer select-none ${
          isCustomOrPartial
            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 shadow-xs'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
        } ${className}`}
      >
        <SlidersHorizontal className={`w-3.5 h-3.5 ${isCustomOrPartial ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`} />
        
        {variant !== 'minimal' && (
          <span>
            {variant === 'compact' ? 'Cột' : 'Tùy chỉnh cột'}
          </span>
        )}

        <span
          className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
            isCustomOrPartial
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          {visibleColumnCount}/{totalColumnCount}
        </span>

        {activePreset && activePreset.id !== 'system_all' && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium border-l border-blue-200 dark:border-blue-800 pl-1.5">
            {activePreset.isSystem ? <Sparkles className="w-2.5 h-2.5" /> : <Bookmark className="w-2.5 h-2.5" />}
            <span className="truncate max-w-[80px]">{activePreset.name}</span>
          </span>
        )}

        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {/* Modal Dialog */}
      <ColumnPresetsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        presets={presets}
        customPresets={customPresets}
        activePresetId={activePresetId}
        mandatoryKeys={mandatoryKeys}
        tableName={tableName || tableId}
        moduleName={moduleName || moduleId}
        onToggleColumn={toggleColumn}
        onApplyPreset={applyPreset}
        onSavePreset={saveCurrentAsPreset}
        onDeletePreset={deletePreset}
        onShowAll={showAllColumns}
        onResetToDefault={resetToDefault}
      />
    </>
  );
};

export default ColumnPresetsButton;
