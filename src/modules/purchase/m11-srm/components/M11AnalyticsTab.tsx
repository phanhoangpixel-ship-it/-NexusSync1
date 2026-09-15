import React from 'react';
import { SupplierItem, ScorecardItem, SupplierAuditItem } from './m11Types';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Star, ShieldCheck, ArrowUpRight, Award, DollarSign } from 'lucide-react';

interface M11AnalyticsTabProps {
  suppliers: SupplierItem[];
  scorecards: ScorecardItem[];
  audits: SupplierAuditItem[];
}

export const M11AnalyticsTab: React.FC<M11AnalyticsTabProps> = ({
  suppliers,
  scorecards,
  audits,
}) => {
  const tierACount = suppliers.filter((s) => s.performanceTier?.includes('Tier A')).length;
  const tierBCount = suppliers.filter((s) => s.performanceTier?.includes('Tier B') || !s.performanceTier).length;
  const tierCCount = suppliers.filter((s) => s.performanceTier?.includes('Tier C')).length;
  const totalCount = suppliers.length || 1;

  const passedAudits = audits.filter((a) => a.result === 'PASSED' || a.result === 'PASSED_WITH_CONDITIONS').length;
  const auditPassRate = audits.length > 0 ? Math.round((passedAudits / audits.length) * 100) : 100;

  const totalSpend = suppliers.reduce((sum, s) => sum + (s.totalSpend || 0), 0);

  const topSuppliers = [...suppliers]
    .sort((a, b) => (b.compositeScore || 85) - (a.compositeScore || 85))
    .slice(0, 5);

  const riskSuppliers = suppliers.filter(
    (s) => s.performanceTier?.includes('Tier C') || parseFloat(s.otifRate || '95') < 90
  );

  return (
    <div className="space-y-4">
      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
            Tổng Kim Ngạch Mua Hàng
          </span>
          <p className="font-mono font-bold text-slate-900 dark:text-white text-lg sm:text-xl">
            {(totalSpend / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr VND
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
            Dữ liệu tích hợp đơn PO M08
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
            Tỷ Lệ Đối Tác Chiến Lược
          </span>
          <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-lg sm:text-xl">
            {Math.round((tierACount / totalCount) * 100)}% (Tier A)
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
            {tierACount} / {suppliers.length} đối tác chủ lực
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
            Tỷ Lệ Đạt Kiểm Toán Xưởng
          </span>
          <p className="font-mono font-bold text-purple-600 dark:text-purple-400 text-lg sm:text-xl">
            {auditPassRate}%
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
            {passedAudits} / {audits.length} đợt audit đạt chuẩn
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
            Cảnh Báo Rủi Ro (Tier C)
          </span>
          <p className="font-mono font-bold text-amber-600 dark:text-amber-400 text-lg sm:text-xl">
            {riskSuppliers.length} Nhà cung cấp
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
            Cần rà soát hợp đồng &amp; kiểm toán lại
          </span>
        </div>
      </div>

      {/* Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tier Distribution Bar */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500" />
              <span>Phân Bổ Xếp Hạng Đối Tác (Vendor Tier Pyramid)</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">M09 &amp; M11 SRM</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-emerald-700 dark:text-emerald-400">
                  Tier A - Đối Tác Chiến Lược (&ge;90 điểm)
                </span>
                <span className="font-mono">{tierACount} NCC ({Math.round((tierACount / totalCount) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(tierACount / totalCount) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-blue-700 dark:text-blue-400">
                  Tier B - Đối Tác Ưu Tiên (75 - 89 điểm)
                </span>
                <span className="font-mono">{tierBCount} NCC ({Math.round((tierBCount / totalCount) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(tierBCount / totalCount) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-amber-700 dark:text-amber-400">
                  Tier C - Cần Cải Thiện &amp; Theo Dõi (&lt;75 điểm)
                </span>
                <span className="font-mono">{tierCCount} NCC ({Math.round((tierCCount / totalCount) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(tierCCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Strategic Partners */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-500" />
              <span>Top 5 Nhà Cung Cấp Xuất Sắc Nhất</span>
            </h3>
            <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded font-bold">
              Top Ranked
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {topSuppliers.map((s, idx) => (
              <div key={s.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {s.name}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">{s.code}</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    OTIF: {s.otifRate || '98.5%'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Score: {s.compositeScore || 90}/100
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
