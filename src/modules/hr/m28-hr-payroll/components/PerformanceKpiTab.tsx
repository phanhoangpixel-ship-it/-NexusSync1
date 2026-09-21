import React from 'react';
import {
  Award,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Star,
  Percent,
} from 'lucide-react';

interface PerformanceKpiTabProps {
  performanceRecords: any[];
  loading: boolean;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const PerformanceKpiTab: React.FC<PerformanceKpiTabProps> = ({
  performanceRecords,
  loading,
  onRefresh,
  onNotify,
}) => {
  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Hạng {grade} (Xuất sắc)
          </span>
        );
      case 'B':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Hạng B (Đạt yêu cầu)
          </span>
        );
      case 'C':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Hạng C (Cần cải thiện)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {grade}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Đánh Giá Hiệu Suất KPI &amp; Hệ Số Lương Thưởng</h4>
          <p className="text-xs text-slate-500">Chu kỳ đánh giá Q3/2026 gắn liền hệ số nhân thưởng lương kỳ</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Nhân sự</th>
                <th className="py-3 px-4">Kỳ đánh giá</th>
                <th className="py-3 px-4 text-center">Điểm KPI</th>
                <th className="py-3 px-4 text-center">Xếp loại</th>
                <th className="py-3 px-4 text-center">Hệ số lương thưởng</th>
                <th className="py-3 px-4">Người đánh giá</th>
                <th className="py-3 px-4">Nhận xét &amp; Định hướng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {performanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Chưa có hồ sơ đánh giá hiệu suất trong kỳ.
                  </td>
                </tr>
              ) : (
                performanceRecords.map((perf, idx) => (
                  <tr key={perf.id || idx} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div>{perf.employeeName}</div>
                      <span className="text-[11px] font-mono text-slate-400">Mã NV: #{perf.employeeId}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {perf.reviewPeriod || 'Q3/2026'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">
                        {perf.kpiScore || 95}
                      </span>
                      <span className="text-xs text-slate-400"> / 100</span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {getGradeBadge(perf.grade || 'A')}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-purple-600">
                      {perf.salaryCoefficient || 1.15}x
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {perf.reviewerName || 'Giám đốc Vận hành'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-sm">
                      {perf.feedback || 'Hoàn thành vượt định mức năng suất ca dây chuyền.'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
