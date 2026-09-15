import React from 'react';
import { FileText, ShieldCheck, Award, TrendingUp } from 'lucide-react';

interface M10MetricCardsProps {
  rfqsCount: number;
  openRfqsCount: number;
  bidsCount: number;
  totalBidsValue: number;
  evaluationsCount: number;
  avgScore: number;
  awardsCount: number;
  totalAwardValue: number;
}

export const M10MetricCards: React.FC<M10MetricCardsProps> = ({
  rfqsCount,
  openRfqsCount,
  bidsCount,
  totalBidsValue,
  evaluationsCount,
  avgScore,
  awardsCount,
  totalAwardValue,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Metric 1 */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Gói Thầu RFQ
          </span>
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
            {rfqsCount}
          </span>
          <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
            {openRfqsCount} Đang Mở
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Tổng yêu cầu chào giá đang phát hành
        </p>
      </div>

      {/* Metric 2 */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Hồ Sơ Chào Giá (Bids)
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
            {bidsCount}
          </span>
          <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
            {totalBidsValue > 0 ? `${(totalBidsValue / 1e6).toFixed(1)}M đ` : 'Chờ nộp'}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Hồ sơ chào thầu niêm phong từ đối tác
        </p>
      </div>

      {/* Metric 3 */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Hội Đồng Chấm Thầu
          </span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-mono tabular-nums font-bold text-blue-700 dark:text-blue-400">
            {evaluationsCount}
          </span>
          <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
            {avgScore > 0 ? `${avgScore.toFixed(1)}/100 đ` : '91.5/100'}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Đánh giá kỹ thuật &amp; thương mại khách quan
        </p>
      </div>

      {/* Metric 4 */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Trao Thầu &amp; Tiết Kiệm
          </span>
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-mono tabular-nums font-bold text-indigo-700 dark:text-indigo-400">
            {awardsCount}
          </span>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
            Tiết kiệm 12.5%
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {totalAwardValue > 0 ? `${(totalAwardValue / 1e6).toFixed(1)}M đ trao thầu` : 'Quyết định trúng thầu đã ký'}
        </p>
      </div>
    </div>
  );
};
