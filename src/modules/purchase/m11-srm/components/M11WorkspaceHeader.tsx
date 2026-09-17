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
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            M11 • SRM SUPPLIER PERFORMANCE &amp; SCORECARDS
          </span>
          <span className="text-[11px] text-slate-300 font-mono">
            P2P &amp; Sourcing Suite • Single Writer &amp; Outbox Auditing
          </span>
        </div>
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-400" />
          <span>Quản Trị Thẻ Điểm &amp; Đánh Giá Hiệu Suất Nhà Cung Cấp</span>
        </h2>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Đo lường chỉ số OTIF, chất lượng kiểm định GR, kiểm toán xưởng &amp; ESG định kỳ, tự động phân loại đối tác chiến lược (Tier A, B, C) tích hợp kho dữ liệu tập trung M09.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onNavigateToM09}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-600/90 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>M09 Master Suppliers</span>
        </button>

        <button
          type="button"
          onClick={onOpenScoringConfig}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
          title="Cấu hình trọng số chấm điểm SRM"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Cấu Hình Trọng Số</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewAudit}
          className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/90 hover:bg-purple-600 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>+ Đợt Kiểm Toán Xưởng</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewScorecard}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Chấm Điểm Thẻ Điểm</span>
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs transition-all border border-white/10 cursor-pointer disabled:opacity-50"
          title="Làm mới dữ liệu M11"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <button
          type="button"
          onClick={onExportCSV}
          className="p-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs transition-all border border-white/10 cursor-pointer"
          title="Xuất Báo cáo CSV"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
