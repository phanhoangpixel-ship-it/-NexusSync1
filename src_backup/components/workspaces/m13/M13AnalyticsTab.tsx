import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  PieChart,
  BarChart3,
  ShieldCheck,
  Target,
  CheckCircle2,
} from 'lucide-react';

interface M13AnalyticsTabProps {
  orders: any[];
}

export const M13AnalyticsTab: React.FC<M13AnalyticsTabProps> = ({ orders }) => {
  const totalOrders = orders.length;
  const issuedVatOrders = orders.filter((o) => o.vatStatus === 'ISSUED');
  const vatRatePercent =
    totalOrders > 0
      ? ((issuedVatOrders.length / totalOrders) * 100).toFixed(1)
      : '0';

  const totalNetRevenue = orders.reduce((sum, o) => {
    return sum + (Number(o.subtotalAmount) || 0);
  }, 0);

  const totalVatTax = orders.reduce((sum, o) => {
    return sum + (Number(o.taxAmount) || 0);
  }, 0);

  const avgOrderValue =
    totalOrders > 0 ? Math.round(totalNetRevenue / totalOrders) : 0;

  // Channel Distribution
  const channelStats: Record<string, { count: number; value: number }> = {
    B2B_ENTERPRISE: { count: 0, value: 0 },
    POS_RETAIL: { count: 0, value: 0 },
  };

  orders.forEach((o) => {
    const isPos = o.sourceModule === 'M16_POS';
    const ch = isPos ? 'POS_RETAIL' : 'B2B_ENTERPRISE';
    channelStats[ch].count += 1;
    channelStats[ch].value += Number(o.subtotalAmount) || 0;
  });

  const statuses = [
    { key: 'CONFIRMED', label: '1. Đã Xác Nhận (CONFIRMED)', color: 'bg-blue-500' },
    { key: 'INVOICED', label: '2. Đã Xuất Hóa Đơn VAT (INVOICED)', color: 'bg-purple-500' },
    { key: 'FULFILLED', label: '3. Đã Giao Hàng Xong (FULFILLED)', color: 'bg-emerald-500' },
    { key: 'DRAFT', label: '4. Bản Nháp (DRAFT)', color: 'bg-slate-400' },
    { key: 'CANCELLED', label: '5. Đã Hủy Đơn (CANCELLED)', color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-4">
      {/* Top 3 Summary KPIs matching M12 pattern */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Giá Trị Đơn Trung Bình (AOV)
            </span>
            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {(avgOrderValue / 1000000).toLocaleString('vi-VN')} Tr VND
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Doanh số bình quân trên mỗi chứng từ bán hàng B2B & POS
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tỷ Lệ Xuất Hóa Đơn Điện Tử (VAT)
            </span>
            <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 tabular-nums">
            {vatRatePercent}% ({issuedVatOrders.length} / {totalOrders} HĐ)
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Tuân thủ pháp lý NĐ 123/2020 & TT 78
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tổng Thuế GTGT Phải Nộp (TK 33311)
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {(totalVatTax / 1000000).toLocaleString('vi-VN')} Tr VND
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Hạch toán tự động vào Sổ cái Kế toán GL
          </p>
        </div>
      </div>

      {/* Funnel & Channel Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Distribution Funnel */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Phân Phối Vòng Đời Đơn Hàng (Order Lifecycle Funnel)
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400">{totalOrders} Đơn</span>
          </div>

          <div className="space-y-3 pt-2">
            {statuses.map((st) => {
              const count = orders.filter((o) => o.status === st.key).length;
              const val = orders
                .filter((o) => o.status === st.key)
                .reduce((sum, o) => sum + (Number(o.subtotalAmount) || 0), 0);
              const percent = totalOrders > 0 ? (count / totalOrders) * 100 : 0;

              return (
                <div key={st.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {st.label}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {count} đơn ({(val / 1000000).toLocaleString('vi-VN')} Tr)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${st.color} transition-all duration-500`}
                      style={{ width: `${Math.max(percent, count > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Cơ Cấu Kênh Bán Hàng (B2B vs Bán Lẻ POS)
              </h4>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                key: 'B2B_ENTERPRISE',
                label: 'Hợp Đồng Bán Buôn Doanh Nghiệp (B2B)',
                color: 'bg-blue-600',
              },
              {
                key: 'POS_RETAIL',
                label: 'Bán Lẻ Chuỗi Cửa Hàng POS (M16)',
                color: 'bg-purple-600',
              },
            ].map((ch) => {
              const stat = channelStats[ch.key] || { count: 0, value: 0 };
              const percent = totalOrders > 0 ? (stat.count / totalOrders) * 100 : 0;

              return (
                <div key={ch.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {ch.label}
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                      {stat.count} đơn ({percent.toFixed(0)}%) •{' '}
                      {(stat.value / 1000000).toLocaleString('vi-VN')} Tr
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${ch.color} transition-all duration-500`}
                      style={{ width: `${percent}%` }}
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
