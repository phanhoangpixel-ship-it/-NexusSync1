import React from 'react';
import { SearchCode, RefreshCw, Download, ShieldCheck, ShoppingCart } from 'lucide-react';

interface M10WorkspaceHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onExportCSV: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M10WorkspaceHeader: React.FC<M10WorkspaceHeaderProps> = ({
  loading,
  onRefresh,
  onExportCSV,
  onNotify,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-600 dark:bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-xs">
          <SearchCode className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-mono font-bold rounded-md border border-slate-200 dark:border-slate-600">
              M10 • STRATEGIC SOURCING
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
              NEXUS-SRM-SOURCING // WAVE 2 BID → EVALUATION → AWARD
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
            Quản Trị Nguồn Cung Chiến Lược &amp; Đấu Thầu (Strategic Sourcing Suite)
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Rule #19 Confirmed</span>
        </div>

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('nexus-navigate', { detail: { route: '/purchase', moduleId: 'M08' } }));
            onNotify('info', 'Chuyển Hướng', 'Đang mở Phân hệ M08 Đơn Đặt Hàng Mua (Purchase Orders Boundary).');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">M08 PO Boundary</span>
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 px-2.5 disabled:opacity-50"
          title="Đồng bộ dữ liệu"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Đồng bộ</span>
        </button>

        <button
          type="button"
          onClick={onExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Xuất CSV</span>
        </button>
      </div>
    </div>
  );
};
