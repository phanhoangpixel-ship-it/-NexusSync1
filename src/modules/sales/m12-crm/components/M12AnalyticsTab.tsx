import React, { useState, useEffect } from 'react';
import { LeadItem, CrmQuotationItem } from './m12Types';
import { BarChart3, TrendingUp, PieChart, Users, DollarSign, Award, Target, Activity } from 'lucide-react';

interface M12AnalyticsTabProps {
  leads: LeadItem[];
  quotations: CrmQuotationItem[];
}

export const M12AnalyticsTab: React.FC<M12AnalyticsTabProps> = ({ leads, quotations }) => {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    // Feature 4: Tái dùng GET /api/reports/summary (M37 BI)
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/reports/summary');
        if (res.ok) {
          const data = await res.json();
          setMetrics(data.crmMetrics || null);
        }
      } catch (err) {
        console.error("Lỗi lấy báo cáo analytics", err);
      }
    };
    fetchAnalytics();
  }, []);

  if (!metrics) {
    return <div className="p-8 text-center text-slate-500"><Activity className="w-6 h-6 animate-spin mx-auto mb-2" /> Đang tải dữ liệu BI...</div>;
  }

  const avgDealSize = metrics.totalLeads > 0 ? Math.round(metrics.totalPipelineValue / metrics.totalLeads) : 0;

  const stages = [
    { key: 'NEW', label: '1. Tiếp nhận (NEW)', color: 'bg-slate-400' },
    { key: 'QUALIFIED', label: '2. Đủ điều kiện (QUALIFIED)', color: 'bg-blue-500' },
    { key: 'PROPOSAL', label: '3. Đề xuất & Báo giá (PROPOSAL)', color: 'bg-purple-500' },
    { key: 'NEGOTIATION', label: '4. Thương thảo hợp đồng (NEGOTIATION)', color: 'bg-amber-500' },
    { key: 'WON', label: '5. Thắng chốt đơn (WON)', color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-4">
      {/* Top 3 Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Quy Mô Đơn Hàng TB</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {(avgDealSize / 1000000).toLocaleString('vi-VN')} Tr VND
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tỷ Lệ Thắng (Win Rate)</span>
            <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
            {metrics.winRate}% ({metrics.wonLeads} / {metrics.totalLeads} Deals)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tổng Pipeline M12</span>
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {(metrics.totalPipelineValue / 1000000).toLocaleString('vi-VN')} Tr VND
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stage Funnel Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Phễu Chuyển Đổi CRM (Từ M37 BI)
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400">{metrics.totalLeads} Đầu mối</span>
          </div>
          <div className="space-y-3 pt-2">
            {stages.map((st) => {
              const count = metrics.stageDistribution[st.key] || 0;
              const pct = metrics.totalLeads > 0 ? (count / metrics.totalLeads) * 100 : 0;
              return (
                <div key={st.key} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{st.label}</span>
                    <span className="font-mono text-slate-500">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                    <div
                      className={`${st.color} h-1.5 rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
