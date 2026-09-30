import React from 'react';
import { Users, Plus, RefreshCw, Download, FileText, Target } from 'lucide-react';

interface M12WorkspaceHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onOpenNewLead: () => void;
  onOpenNewQuotation: () => void;
  onExportCSV: () => void;
}

export const M12WorkspaceHeader: React.FC<M12WorkspaceHeaderProps> = ({
  loading,
  onRefresh,
  onOpenNewLead,
  onOpenNewQuotation,
  onExportCSV,
}) => {
  return (
    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          M12 • CRM & LEADS PIPELINE
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400 hidden lg:inline">
          Quản lý Khách hàng Tiềm năng, Báo giá & Phễu Bán hàng
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500 dark:text-slate-400'}`} />
          <span>Làm mới</span>
        </button>

        <button
          type="button"
          onClick={onExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Xuất CSV</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewQuotation}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Lập Báo Giá</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewLead}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm Lead Mới</span>
        </button>
      </div>
    </div>
  );
};
