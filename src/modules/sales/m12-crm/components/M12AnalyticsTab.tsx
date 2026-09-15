import React from 'react';
import { LeadItem, CrmQuotationItem } from './m12Types';
import { BarChart3, TrendingUp, PieChart, Users, DollarSign, Award, Target } from 'lucide-react';

interface M12AnalyticsTabProps {
  leads: LeadItem[];
  quotations: CrmQuotationItem[];
}

export const M12AnalyticsTab: React.FC<M12AnalyticsTabProps> = ({ leads, quotations }) => {
  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.status === 'WON');
  const winRate = totalLeads > 0 ? ((wonLeads.length / totalLeads) * 100).toFixed(1) : '0';

  const totalPipelineValue = leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
  const avgDealSize = totalLeads > 0 ? Math.round(totalPipelineValue / totalLeads) : 0;

  // Source Distribution
  const sourcesCount: Record<string, { count: number; value: number }> = {};
  leads.forEach((l) => {
    const src = l.source || 'KHÁC';
    if (!sourcesCount[src]) sourcesCount[src] = { count: 0, value: 0 };
    sourcesCount[src].count += 1;
    sourcesCount[src].value += Number(l.value) || 0;
  });

  // Sales Rep Performance
  const repStats: Record<string, { count: number; value: number; won: number }> = {};
  leads.forEach((l) => {
    const rep = l.salespersonName || 'Chưa gán';
    if (!repStats[rep]) repStats[rep] = { count: 0, value: 0, won: 0 };
    repStats[rep].count += 1;
    repStats[rep].value += Number(l.value) || 0;
    if (l.status === 'WON') repStats[rep].won += 1;
  });

  // Stage Breakdown
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
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Quy Mô Đơn Hàng Trung Bình</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {(avgDealSize / 1000000).toLocaleString('vi-VN')} Tr VND
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Giá trị trung bình trên mỗi cơ hội bán hàng</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tỷ Lệ Thắng (Win Rate)</span>
            <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
            {winRate}% ({wonLeads.length} / {totalLeads} Deals)
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Chuyển đổi thành hợp đồng chính thức</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tổng Báo Giá Đang Chờ</span>
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {quotations.filter((q) => q.status === 'SENT' || q.status === 'DRAFT').length} Báo Giá
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Bản chào giá đã gửi đang chờ phản hồi từ khách hàng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stage Funnel Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Phân Phối Phễu Chuyển Đổi (Conversion Funnel)
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400">{totalLeads} Đầu mối</span>
          </div>

          <div className="space-y-3 pt-2">
            {stages.map((st) => {
              const count = leads.filter((l) => l.status === st.key).length;
              const val = leads
                .filter((l) => l.status === st.key)
                .reduce((sum, l) => sum + (Number(l.value) || 0), 0);
              const percent = totalLeads > 0 ? (count / totalLeads) * 100 : 0;

              return (
                <div key={st.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{st.label}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {count} deals ({(val / 1000000).toLocaleString('vi-VN')} Tr)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${st.color} transition-all duration-500`}
                      style={{ width: `${Math.max(percent, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Source Effectiveness */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Hiệu Quả Kênh Thu Hút (Lead Sources)
              </h4>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(sourcesCount).map(([src, stat]) => {
              const percent = totalLeads > 0 ? (stat.count / totalLeads) * 100 : 0;
              return (
                <div key={src} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{src}</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      {stat.count} leads ({percent.toFixed(0)}%) • {(stat.value / 1000000).toLocaleString('vi-VN')} Tr
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sales Rep Productivity */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Năng Suất Chuyên Viên Kinh Doanh (Sales Rep Performance)
            </h4>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/60">
                <th className="py-2.5 px-3">Chuyên Viên Kinh Doanh</th>
                <th className="py-2.5 px-3 text-center">Số Lượng Leads</th>
                <th className="py-2.5 px-3 text-center">Số Deal Thắng (Won)</th>
                <th className="py-2.5 px-3 text-right">Tổng Doanh Số Phụ Trách</th>
                <th className="py-2.5 px-3 text-center">Tỷ Lệ Chốt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {Object.entries(repStats).map(([rep, stat], idx) => {
                const repRate = stat.count > 0 ? ((stat.won / stat.count) * 100).toFixed(0) : '0';
                return (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{rep}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{stat.count}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{stat.won}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">
                      {Number(stat.value).toLocaleString('vi-VN')} VND
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold font-mono text-[10px] border border-emerald-200 dark:border-emerald-800">
                        {repRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
