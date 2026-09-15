import React from 'react';
import { Gauge, Fuel, Truck, TrendingUp, BarChart3, PieChart, ShieldCheck } from 'lucide-react';
import { LogisticsKPIs, formatVND } from './types';

interface LogisticsAnalyticsTabProps {
  kpis: LogisticsKPIs;
}

export const LogisticsAnalyticsTab: React.FC<LogisticsAnalyticsTabProps> = ({ kpis }) => {
  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
          Báo Cáo Phân Tích Hiệu Suất Vận Tải &amp; Đội Xe
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Đánh giá tỷ lệ giao đúng hạn SLA (OTD), hiệu suất tiêu thụ nhiên liệu L/100km &amp; phân bổ chi phí vận tải
        </p>
      </div>

      {/* TOP KPI ANALYTIC TILES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tỷ Lệ Giao Đúng Hạn (SLA OTD)
            </h3>
            <Gauge className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
            {kpis.onTimeRate}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mục tiêu Doanh nghiệp: &ge; 92.0%. Tổng số chuyến hoàn tất đúng hẹn theo cam kết hợp đồng khách hàng.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Định Mức Tiêu Thụ Dầu Trung Bình
            </h3>
            <Fuel className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
            18.5 L / 100km
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tải trọng trung bình: 6.2 Tấn. Tối ưu hơn 4.2% so với định mức kỹ thuật ban hành.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Hệ Số Khai Thác Đội Xe
            </h3>
            <Truck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
            85.0%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {kpis.activeVehicles} / {kpis.totalVehicles} phương tiện đang vận hành trực tiếp trên các cung đường.
          </p>
        </div>
      </div>

      {/* DETAILED DRILLDOWN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Structure Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
            <PieChart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Cơ Cấu Chi Phí Vận Hành Logistics</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700 dark:text-slate-300">1. Nhiên liệu Dầu Diesel (Fuel)</span>
                <span className="font-mono text-slate-900 dark:text-white">54.5%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '54.5%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700 dark:text-slate-300">2. Phí BOT Cầu Đường VETC / ePass</span>
                <span className="font-mono text-slate-900 dark:text-white">22.0%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '22%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700 dark:text-slate-300">3. Chi phí Nhân công &amp; Thưởng Tài Xế</span>
                <span className="font-mono text-slate-900 dark:text-white">15.5%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '15.5%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700 dark:text-slate-300">4. Bảo trì &amp; Khấu hao Phương tiện (M38)</span>
                <span className="font-mono text-slate-900 dark:text-white">8.0%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: '8%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Efficiency & SLA Compliance Highlights */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Chỉ Số Tối Ưu Lộ Trình &amp; Trách Nhiệm Xã Hội</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Giảm Phát Thải CO2</span>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">-12.8 Tấn</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Nhờ thuật toán gom đơn tối ưu tải</p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Hạn Chế Xe Chạy Rỗng</span>
              <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">8.4%</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Tỷ lệ chạy xe không hàng thấp kỉ lục</p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Thời Gian Dừng Trung Bình</span>
              <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">18 Phút</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Bốc dỡ &amp; ký nghiệm thu POD</p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Chỉ Số Khiếu Nại Hàng Hóa</span>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">0.02%</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Không có mất mát hoặc hư hỏng nặng</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
