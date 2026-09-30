import React from 'react';
import { Award, RefreshCw, Download, Plus, Truck, ShieldCheck, SlidersHorizontal } from 'lucide-react';

interface M11WorkspaceHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onExportCSV: () => void;
  onOpenNewScorecard: () => void;
  onOpenNewAudit: () => void;
  onOpenScoringConfig: () => void;
  onNavigateToM09: () => void;
}

export const M11WorkspaceHeader: React.FC<M11WorkspaceHeaderProps> = ({
  loading,
  onRefresh,
  onExportCSV,
  onOpenNewScorecard,
  onOpenNewAudit,
  onOpenScoringConfig,
  onNavigateToM09,
}) => {
  return (
    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          M11 • SRM SCORECARDS
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400 hidden lg:inline">
          Quản Trị Thẻ Điểm & Hiệu Suất Nhà Cung Cấp
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={onNavigateToM09}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg text-xs font-semibold transition-all border border-amber-200 dark:border-amber-800 cursor-pointer"
        >
          <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>M09 Suppliers</span>
        </button>

        <button
          type="button"
          onClick={onOpenScoringConfig}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
          title="Cấu hình trọng số chấm điểm SRM"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>Trọng Số</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewAudit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-lg text-xs font-semibold transition-all border border-purple-200 dark:border-purple-800 cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>+ Kiểm Toán Xưởng</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewScorecard}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Chấm Điểm</span>
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
          title="Làm mới dữ liệu M11"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500 dark:text-slate-400'}`} />
        </button>

        <button
          type="button"
          onClick={onExportCSV}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
          title="Xuất Báo cáo CSV"
        >
          <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
        </button>
      </div>
    </div>
  );
};
