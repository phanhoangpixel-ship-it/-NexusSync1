import React from 'react';
import { DollarSign, PieChart, Layers, ArrowUpRight, TrendingUp, AlertCircle } from 'lucide-react';
import { ProjectMaster } from '../../../../types/m35Types';

interface ProjectJobCostingTabProps {
  currentProject: ProjectMaster;
  onSyncToM30?: () => void;
}

export const ProjectJobCostingTab: React.FC<ProjectJobCostingTabProps> = ({ currentProject, onSyncToM30 }) => {
  const actualCost = currentProject?.actualCostVND || 0;
  const budget = currentProject?.budgetVND || 1;
  const costVariance = budget - actualCost;

  const costBreakdown = [
    { category: 'Chi Phí Nhân Công Trực Tiếp (Labor)', pct: 45, amount: actualCost * 0.45, color: 'bg-blue-500' },
    { category: 'Chi Phí Vật Tư / Bản Quyền (Material & Lic)', pct: 25, amount: actualCost * 0.25, color: 'bg-emerald-500' },
    { category: 'Chi Phí Thuê Ngoài & Thầu Phụ (Subcontractor)', pct: 15, amount: actualCost * 0.15, color: 'bg-amber-500' },
    { category: 'Chi Phí Máy Móc & Hạ Tầng Cloud (Infra/Equipment)', pct: 10, amount: actualCost * 0.1, color: 'bg-purple-500' },
    { category: 'Chi Phí Quản Lý Dự Án & Chung (Overhead)', pct: 5, amount: actualCost * 0.05, color: 'bg-slate-500' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-5">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            06. Hạch Toán Chi Phí Dự Án &amp; Giá Thành Công Việc (Job Costing Engine)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tổng hợp 5 cấu phần chi phí (Nhân công, vật tư, máy móc, thầu phụ, chi phí chung) liên kết đồng bộ Sổ cái GL (M30).
          </p>
        </div>
        {onSyncToM30 && (
          <button
            type="button"
            onClick={onSyncToM30}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Đồng bộ sang M30 (GL)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Tổng Ngân Sách Phê Duyệt (BAC):</span>
          <span className="text-lg font-mono font-bold text-slate-900 dark:text-white block">
            {budget.toLocaleString('vi-VN')} VNĐ
          </span>
          <span className="text-[11px] text-slate-400 block pt-1">Theo quyết định phê duyệt dự án</span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Chi Phí Thực Tế Đã Ghi Nhận (AC):</span>
          <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400 block">
            {actualCost.toLocaleString('vi-VN')} VNĐ
          </span>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold block pt-1">
            Đạt {((actualCost / budget) * 100).toFixed(1)}% ngân sách
          </span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Ngân Sách Còn Lại (Remaining):</span>
          <span className={`text-lg font-mono font-bold block ${costVariance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {costVariance.toLocaleString('vi-VN')} VNĐ
          </span>
          <span className="text-[11px] text-slate-400 block pt-1">
            {costVariance >= 0 ? 'Trong hạn mức ngân sách' : 'Vượt hạn mức ngân sách!'}
          </span>
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
        <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
          Phân Rã 5 Cấu Phần Chi Phí Thực Tế (Job Costing Breakdown)
        </h4>

        <div className="space-y-3">
          {costBreakdown.map((item, idx) => (
            <div key={idx} className="space-y-1 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-slate-700 dark:text-slate-300">{item.category}</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {item.amount.toLocaleString('vi-VN')} VNĐ ({item.pct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
