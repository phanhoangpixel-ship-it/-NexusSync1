import React from 'react';
import { PieChart, Download, DollarSign, TrendingUp, AlertTriangle, ShieldCheck, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { ProjectMaster } from '../../../../types/m35Types';

interface ProjectReportsTabProps {
  currentProject: ProjectMaster;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

export const ProjectReportsTab: React.FC<ProjectReportsTabProps> = ({
  currentProject,
  onExportPdf,
  onExportExcel,
}) => {
  const contractVal = currentProject?.contractValueVND || 0;
  const budgetVal = currentProject?.budgetVND || 0;
  const actualVal = currentProject?.actualCostVND || 0;
  const grossProfit = contractVal - actualVal;
  const profitMarginPct = contractVal > 0 ? ((grossProfit / contractVal) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            10. Báo Cáo Hiệu Quả Kinh Tế &amp; Lợi Nhuận Dự Án (Project P&amp;L &amp; Risk Dashboard)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tổng hợp kết quả kinh doanh, tỷ suất lợi nhuận gộp và đánh giá rủi ro dự án.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportExcel}
            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Xuất Excel
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            Xuất Báo Cáo PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <span className="text-slate-500 dark:text-slate-400 font-semibold block">Doanh Thu Hợp Đồng:</span>
          <span className="text-lg font-mono font-bold text-slate-900 dark:text-white block">
            {contractVal.toLocaleString('vi-VN')} đ
          </span>
          <span className="text-[11px] text-slate-400 block pt-1">Tổng giá trị nghiệm thu dự kiến</span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <span className="text-slate-500 dark:text-slate-400 font-semibold block">Chi Phí Đã Thực Hiện:</span>
          <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400 block">
            {actualVal.toLocaleString('vi-VN')} đ
          </span>
          <span className="text-[11px] text-slate-400 block pt-1">Chi phí nhân sự + vật tư + khác</span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <span className="text-slate-500 dark:text-slate-400 font-semibold block">Lợi Nhuận Gộp Ước Tính:</span>
          <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
            {grossProfit.toLocaleString('vi-VN')} đ
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block pt-1">
            Margin: {profitMarginPct}%
          </span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <span className="text-slate-500 dark:text-slate-400 font-semibold block">Xếp Hạng Rủi Ro Dự Án:</span>
          <span className="text-lg font-bold text-amber-600 dark:text-amber-400 block">
            MỨC {currentProject?.riskLevel} (AN TOÀN)
          </span>
          <span className="text-[11px] text-slate-400 block pt-1">Đánh giá theo EVM &amp; Milestone</span>
        </div>
      </div>
    </div>
  );
};
