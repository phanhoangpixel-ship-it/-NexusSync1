import React from 'react';
import { Award, TrendingUp, CheckCircle2, ShieldCheck, Star, Users } from 'lucide-react';

interface M11MetricCardsProps {
  totalSuppliers: number;
  totalScorecards: number;
  avgOtif: string;
  avgQuality: string;
  tierACount: number;
  tierBCount: number;
  tierCCount: number;
}

export const M11MetricCards: React.FC<M11MetricCardsProps> = ({
  totalSuppliers,
  totalScorecards,
  avgOtif,
  avgQuality,
  tierACount,
  tierBCount,
  tierCCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tổng Thẻ Điểm Đã Phát Hành
          </span>
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white">
            {totalScorecards}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            / {totalSuppliers} Đối tác M09
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
          <Users className="w-3 h-3 text-indigo-500" />
          <span>Tích hợp Single Source of Truth M09</span>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            OTIF Toàn Hệ Thống (SLA)
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400">
            {avgOtif}
          </p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            On-Time In-Full
          </span>
        </div>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
          Mục tiêu cam kết SLA chuẩn &ge;95.0%
        </span>
      </div>

      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Chất Lượng Kiểm Định GR
          </span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="font-mono tabular-nums font-bold text-2xl text-blue-600 dark:text-blue-400">
            {avgQuality}
          </p>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
            Đạt chuẩn IQC
          </span>
        </div>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
          Đối soát tự động phiếu nhận kho M10
        </span>
      </div>

      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Cơ Cấu Phân Hạng Đối Tác
          </span>
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400">
            <Star className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold pt-1">
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Tier A: {tierACount}
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Tier B: {tierBCount}
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Tier C: {tierCCount}
          </span>
        </div>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
          Dựa trên Composite Score &gt;= 90 (Tier A)
        </span>
      </div>
    </div>
  );
};
