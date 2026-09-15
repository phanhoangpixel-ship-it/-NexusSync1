import React from 'react';
import { Users, DollarSign, Award, FileText } from 'lucide-react';

interface M12MetricCardsProps {
  totalLeads: number;
  totalPipelineValue: number;
  winRate: string;
  totalQuotations: number;
  totalQuotationsValue: number;
}

export const M12MetricCards: React.FC<M12MetricCardsProps> = ({
  totalLeads,
  totalPipelineValue,
  winRate,
  totalQuotations,
  totalQuotationsValue,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Leads */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tổng Đầu Mối (Leads)
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {totalLeads}
          </span>
          <span className="text-xs text-emerald-600 font-semibold">Khách tiềm năng</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Thu thập từ Website, Hội chợ & Giới thiệu
        </p>
      </div>

      {/* 2. Total Pipeline Value */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Quy Mô Phễu (Pipeline)
          </span>
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400 tabular-nums">
            {(totalPipelineValue / 1000000000).toFixed(2)} Tỷ
          </span>
          <span className="text-xs text-slate-400">VND</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Tổng giá trị cơ hội đang đàm phán
        </p>
      </div>

      {/* 3. Conversion Win Rate */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tỷ Lệ Chốt Thắng (Win Rate)
          </span>
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-purple-700 dark:text-purple-400 tabular-nums">
            {winRate}
          </span>
          <span className="text-xs text-purple-600 font-semibold">Chuyển đổi thành công</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Tỷ lệ Lead trở thành Khách hàng M03 / SO M13
        </p>
      </div>

      {/* 4. Total Quotations */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Báo Giá Thương Mại
          </span>
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 tabular-nums">
            {totalQuotations}
          </span>
          <span className="text-xs text-slate-500 font-semibold">
            {(totalQuotationsValue / 1000000000).toFixed(2)} Tỷ VND
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Bản chào giá & Phụ lục thỏa thuận khung
        </p>
      </div>
    </div>
  );
};
