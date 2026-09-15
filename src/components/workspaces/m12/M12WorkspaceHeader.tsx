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
    <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            M12 • CRM & LEADS PIPELINE
          </span>
          <span className="text-xs text-slate-400">Sales, CRM & O2C Suite • Quản lý Khách hàng Tiềm năng, Báo giá & Phễu Bán hàng</span>
        </div>
        <h2 className="text-lg font-bold tracking-tight mt-1">CRM & Quản Trị Khách Hàng Tiềm Năng (Leads & Quotations)</h2>
        <p className="text-xs text-slate-300 mt-0.5">
          Theo dõi vòng đời khách hàng từ Tiếp nhận Lead, Nuôi dưỡng Deals, Báo giá thương mại (BPA) đến Chuyển đổi Khách hàng B2B (M03) & Đơn bán hàng (M13).
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>

        <button
          type="button"
          onClick={onExportCSV}
          className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Xuất CSV</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewQuotation}
          className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Lập Báo Giá</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewLead}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm Lead Mới</span>
        </button>
      </div>
    </div>
  );
};
