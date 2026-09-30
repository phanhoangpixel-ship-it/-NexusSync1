import React, { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { ModuleDefinition, MODULE_REGISTRY } from '../../../../config/moduleRegistry';
import { UserSession } from '../../../../types';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ExecutiveOverviewDashboardProps {
  currentUser?: UserSession;
  onSelectModule: (module: ModuleDefinition) => void;
  onOpenWorkQueue: () => void;
  onOpenOmnibar: () => void;
  onSwitchToApiMap?: () => void;
  onSwitchToObservability?: () => void;
}

// 30-day Revenue & Profit chart data
const REVENUE_PROFIT_DATA = [
  { date: '01/09', revenue: 4.8, profit: 1.6 },
  { date: '03/09', revenue: 5.2, profit: 1.7 },
  { date: '05/09', revenue: 5.9, profit: 1.9 },
  { date: '08/09', revenue: 6.4, profit: 2.1 },
  { date: '10/09', revenue: 6.8, profit: 2.3 },
  { date: '12/09', revenue: 7.1, profit: 2.4 },
  { date: '15/09', revenue: 7.6, profit: 2.5 },
  { date: '18/09', revenue: 7.2, profit: 2.4 },
  { date: '20/09', revenue: 7.8, profit: 2.6 },
  { date: '22/09', revenue: 8.1, profit: 2.7 },
  { date: '25/09', revenue: 8.3, profit: 2.8 },
  { date: '27/09', revenue: 8.2, profit: 2.75 },
  { date: '29/09', revenue: 8.45, profit: 2.84 },
];

// Donut data for sales by category
const CATEGORY_DONUT_DATA = [
  { name: 'Điện tử & CNTT', value: 32.5, color: '#0ea5e9' },
  { name: 'Thời trang', value: 18.7, color: '#f97316' },
  { name: 'Gia dụng', value: 15.3, color: '#10b981' },
  { name: 'Thực phẩm', value: 12.6, color: '#f43f5e' },
  { name: 'Khác', value: 20.9, color: '#8b5cf6' },
];

// Work Queue items matching image
const WORK_QUEUE_ROWS = [
  {
    id: 1,
    content: 'Duyệt đơn hàng SO-2026-00123',
    module: 'M13',
    type: 'Phê duyệt',
    deadline: '29/09/2026 10:00',
    status: 'Chờ duyệt',
    statusColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
    dotColor: 'bg-rose-500'
  },
  {
    id: 2,
    content: 'Kiểm tra công nợ KH Công ty ABC',
    module: 'M31',
    type: 'Cảnh báo',
    deadline: '29/09/2026 12:00',
    status: 'Cần xử lý',
    statusColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
    dotColor: 'bg-amber-500'
  },
  {
    id: 3,
    content: 'Nhập kho PO-2026-00876',
    module: 'M08',
    type: 'Nhập kho',
    deadline: '29/09/2026 14:00',
    status: 'Đang xử lý',
    statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
    dotColor: 'bg-emerald-500'
  },
  {
    id: 4,
    content: 'Kiểm kê kho TPHCM',
    module: 'M19',
    type: 'Kiểm kê',
    deadline: '29/09/2026 16:00',
    status: 'Chưa bắt đầu',
    statusColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
    dotColor: 'bg-amber-400'
  },
  {
    id: 5,
    content: 'Xử lý đơn trả hàng RT-2026-00045',
    module: 'M15',
    type: 'Trả hàng',
    deadline: '30/09/2026 09:00',
    status: 'Chưa bắt đầu',
    statusColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
    dotColor: 'bg-amber-400'
  },
];

// SLA metrics matching image
const SLA_MODULES = [
  { code: 'M01 - Workspace Hub', percentage: 100 },
  { code: 'M07 - Master Data', percentage: 99 },
  { code: 'M13 - Sales Orders', percentage: 98 },
  { code: 'M17 - Inventory', percentage: 97 },
  { code: 'M30 - Accounting', percentage: 100 },
  { code: 'M31 - AR/AP', percentage: 98 },
  { code: 'M37 - BI & Reports', percentage: 96 },
];

export const ExecutiveOverviewDashboard: React.FC<ExecutiveOverviewDashboardProps> = ({
  currentUser,
  onSelectModule,
  onOpenWorkQueue,
  onOpenOmnibar,
  onSwitchToApiMap,
  onSwitchToObservability,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('Hà Nội');

  const handleQuickNav = (moduleCode: string) => {
    const mod = MODULE_REGISTRY.find(m => m.moduleId === moduleCode);
    if (mod) onSelectModule(mod);
  };

  return (
    <div className="w-full bg-[#f1f5f9] dark:bg-[#070d1a] text-slate-800 dark:text-slate-200 font-sans select-none antialiased">
      {/* 
          MAIN CONTENT CANVAS 
          Unified single-sidebar enterprise architecture
      */}
      <main className="w-full p-4 sm:p-5 space-y-4">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                <Icons.Home className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Workspace Hub</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tổng quan hoạt động kinh doanh và điều phối hệ thống
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] hidden md:block">
                Thứ Hai, 29/09/2026 &nbsp; 08:45
              </div>

              {/* Branch Selector Dropdown */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold">
                <span className="text-slate-400">Chi nhánh:</span>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Toàn hệ thống">Toàn hệ thống</option>
                </select>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              4. TOP 5 KPI SUMMARY CARDS
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Tổng đơn hàng */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                    Tổng đơn hàng <span className="text-[11px] font-normal text-slate-400">(Tất cả)</span>
                  </span>
                  <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                    1.248
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Icons.FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                  <span>↑ 12.5%</span>
                  <span className="font-normal text-slate-400 font-sans">so với tuần trước</span>
                </div>
              </div>
              {/* Sparkline curve */}
              <div className="w-full h-8 mt-1">
                <svg viewBox="0 0 100 25" className="w-full h-full overflow-visible">
                  <path
                    d="M 0 18 Q 20 22, 40 14 T 70 8 T 100 4"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Card 2: Doanh thu (Tạm tính) */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                    Doanh thu <span className="text-[11px] font-normal text-slate-400">(Tạm tính)</span>
                  </span>
                  <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums truncate">
                    8.452.000.000
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Icons.DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                  <span>↑ 18.3%</span>
                  <span className="font-normal text-slate-400 font-sans">so với tuần trước</span>
                </div>
              </div>
              {/* Sparkline curve */}
              <div className="w-full h-8 mt-1">
                <svg viewBox="0 0 100 25" className="w-full h-full overflow-visible">
                  <path
                    d="M 0 20 Q 25 10, 50 18 T 75 8 T 100 3"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Card 3: Tồn kho thực tế */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                    Tồn kho thực tế
                  </span>
                  <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                    156.320
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Icons.Package className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-orange-600 dark:text-orange-400 font-bold font-mono">
                  <span>↑ 5.7%</span>
                  <span className="font-normal text-slate-400 font-sans">so với tuần trước</span>
                </div>
              </div>
              {/* Sparkline curve */}
              <div className="w-full h-8 mt-1">
                <svg viewBox="0 0 100 25" className="w-full h-full overflow-visible">
                  <path
                    d="M 0 16 Q 30 18, 55 12 T 80 8 T 100 5"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Card 4: Công nợ phải thu */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                    Công nợ phải thu
                  </span>
                  <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums truncate">
                    2.843.000.000
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Icons.Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-bold font-mono">
                  <span>↓ 8.2%</span>
                  <span className="font-normal text-slate-400 font-sans">so với tuần trước</span>
                </div>
              </div>
              {/* Sparkline curve */}
              <div className="w-full h-8 mt-1">
                <svg viewBox="0 0 100 25" className="w-full h-full overflow-visible">
                  <path
                    d="M 0 14 Q 25 18, 50 10 T 75 16 T 100 9"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Card 5: Công nợ phải trả */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                    Công nợ phải trả
                  </span>
                  <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums truncate">
                    3.672.000.000
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Icons.Landmark className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 font-bold font-mono">
                  <span>↓ 6.9%</span>
                  <span className="font-normal text-slate-400 font-sans">so với tuần trước</span>
                </div>
              </div>
              {/* Sparkline curve */}
              <div className="w-full h-8 mt-1">
                <svg viewBox="0 0 100 25" className="w-full h-full overflow-visible">
                  <path
                    d="M 0 18 Q 30 14, 55 20 T 80 10 T 100 6"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              5. CHARTS & QUICK ACTIONS SECTION (3 COLUMNS)
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Chart 1: Doanh thu & Lợi nhuận (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Doanh thu &amp; Lợi nhuận (30 ngày gần nhất)
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Doanh thu</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Lợi nhuận gộp</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 mt-4 items-center">
                  {/* Chart Left */}
                  <div className="col-span-8 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={REVENUE_PROFIT_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 10]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            fontSize: '11px',
                            color: '#fff',
                            fontFamily: 'monospace'
                          }}
                        />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Summary Metrics Right */}
                  <div className="col-span-4 pl-3 border-l border-slate-100 dark:border-slate-700/60 space-y-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Tổng doanh thu</span>
                      <strong className="text-sm font-bold font-mono text-slate-900 dark:text-white block tabular-nums">
                        8.452.000.000
                      </strong>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        ↑ 18.3%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Lợi nhuận gộp</span>
                      <strong className="text-sm font-bold font-mono text-slate-900 dark:text-white block tabular-nums">
                        2.841.000.000
                      </strong>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        ↑ 16.7%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Tỷ suất lợi nhuận</span>
                      <strong className="text-sm font-bold font-mono text-slate-900 dark:text-white block tabular-nums">
                        33.6%
                      </strong>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        ↑ 2.1%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: Cơ cấu doanh thu theo nhóm hàng (4 cols) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  Cơ cấu doanh thu theo nhóm hàng
                </h4>

                <div className="flex items-center justify-between mt-3">
                  {/* Donut Chart with center label */}
                  <div className="relative w-44 h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={CATEGORY_DONUT_DATA}
                          innerRadius={50}
                          outerRadius={72}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {CATEGORY_DONUT_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Centered label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        8.45 tỷ
                      </span>
                      <span className="text-[9px] text-slate-400">
                        Tổng doanh thu
                      </span>
                    </div>
                  </div>

                  {/* Donut Legend */}
                  <div className="space-y-1.5 text-[11px] font-mono pr-2">
                    {CATEGORY_DONUT_DATA.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-600 dark:text-slate-300 font-sans truncate max-w-[90px]">
                            {item.name}
                          </span>
                        </div>
                        <strong className="text-slate-900 dark:text-white tabular-nums">
                          {item.value}%
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Thao tác nhanh & Trạng thái hệ thống (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Thao tác nhanh */}
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Thao tác nhanh
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickNav('M13')}
                    className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0">
                      <Icons.ShoppingCart className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[11px] text-slate-900 dark:text-white leading-tight">Tạo đơn hàng</p>
                      <span className="text-[9px] font-mono text-slate-400">M13</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickNav('M08')}
                    className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 hover:bg-orange-100 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
                      <Icons.PackagePlus className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[11px] text-slate-900 dark:text-white leading-tight">Tạo phiếu nhập</p>
                      <span className="text-[9px] font-mono text-slate-400">M08</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickNav('M17')}
                    className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Icons.Boxes className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[11px] text-slate-900 dark:text-white leading-tight">Kiểm tra tồn kho</p>
                      <span className="text-[9px] font-mono text-slate-400">M17</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickNav('M31')}
                    className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <Icons.Receipt className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[11px] text-slate-900 dark:text-white leading-tight">Tạo hóa đơn</p>
                      <span className="text-[9px] font-mono text-slate-400">M31</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickNav('M37')}
                    className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                      <Icons.BarChart2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[11px] text-slate-900 dark:text-white leading-tight">Xem báo cáo</p>
                      <span className="text-[9px] font-mono text-slate-400">M37</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickNav('M03')}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-600 text-white flex items-center justify-center shrink-0">
                      <Icons.Settings className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[11px] text-slate-900 dark:text-white leading-tight">Cài đặt hệ thống</p>
                      <span className="text-[9px] font-mono text-slate-400">M03</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Trạng thái hệ thống */}
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Trạng thái hệ thống
                </h4>

                <div className="flex items-center gap-3">
                  {/* Circular 99.2% Gauge */}
                  <div className="relative w-16 h-16 rounded-full border-4 border-emerald-500/20 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      99.2%
                    </span>
                    <span className="text-[8px] font-mono text-slate-400 leading-tight">
                      API Online
                    </span>
                  </div>

                  {/* Checklist */}
                  <div className="flex-1 space-y-1 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300 font-sans">Database</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Online</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300 font-sans">API Gateway</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Online</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300 font-sans">EventBus</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Online</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300 font-sans">Background Jobs</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Online</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              6. SƠ ĐỒ QUY TRÌNH NGHIỆP VỤ CHÍNH (PROCESS CHEVRON STRIP)
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Sơ đồ quy trình nghiệp vụ chính
            </h4>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              {[
                { label: 'Khách hàng', code: 'M07', icon: Icons.Users, bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' },
                { label: 'Đơn hàng bán', code: 'M13', icon: Icons.ShoppingCart, bg: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300' },
                { label: 'Kho vận', code: 'M17', icon: Icons.Home, bg: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300' },
                { label: 'Sản xuất', code: 'M25', icon: Icons.Factory, bg: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300' },
                { label: 'Công nợ', code: 'M31/M32', icon: Icons.DollarSign, bg: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300' },
                { label: 'Kế toán', code: 'M30', icon: Icons.Package, bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' },
                { label: 'Báo cáo', code: 'M37', icon: Icons.BarChart2, bg: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300' },
              ].map((step, idx) => {
                const StepIcon = step.icon;
                return (
                  <React.Fragment key={step.code}>
                    <div
                      onClick={() => handleQuickNav(step.code.split('/')[0])}
                      className={`px-3 py-2 rounded-xl border flex items-center gap-2 text-xs font-semibold shrink-0 cursor-pointer shadow-2xs hover:scale-[1.02] transition-transform ${step.bg}`}
                    >
                      <StepIcon className="w-4 h-4 shrink-0" />
                      <div>
                        <p className="leading-tight font-bold">{step.label}</p>
                        <span className="text-[10px] font-mono opacity-80">{step.code}</span>
                      </div>
                    </div>
                    {idx < 6 && (
                      <Icons.ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              7. BOTTOM SECTION: WORK QUEUE + SLA + NOTIFICATIONS (3 COLS)
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Col 1: Công việc cần xử lý (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Công việc cần xử lý (12)
                </h4>
                <button
                  type="button"
                  onClick={onOpenWorkQueue}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Xem tất cả</span>
                  <Icons.ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Work Queue Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-2 w-6">#</th>
                      <th className="pb-2">Nội dung</th>
                      <th className="pb-2">Module</th>
                      <th className="pb-2">Loại</th>
                      <th className="pb-2">Hạn xử lý</th>
                      <th className="pb-2 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {WORK_QUEUE_ROWS.map((row) => (
                      <tr
                        key={row.id}
                        onClick={onOpenWorkQueue}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 font-mono text-[11px] text-slate-400">{row.id}</td>
                        <td className="py-2.5 font-medium text-slate-900 dark:text-white max-w-[150px] truncate">
                          {row.content}
                        </td>
                        <td className="py-2.5 font-mono font-bold text-[11px] text-blue-600 dark:text-blue-400">
                          {row.module}
                        </td>
                        <td className="py-2.5 text-slate-500 text-[11px]">{row.type}</td>
                        <td className="py-2.5 font-mono text-[10px] text-slate-400">{row.deadline}</td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.statusColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${row.dotColor}`} />
                            <span>{row.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Col 2: SLA theo module (3.5 cols) */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 sm:p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                SLA theo module
              </h4>

              {/* Circular 98% Gauge */}
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <div className="relative w-14 h-14 rounded-full border-4 border-emerald-500/20 flex flex-col items-center justify-center shrink-0">
                  <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    98%
                  </span>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Đúng hạn</h5>
                  <p className="text-[10px] font-mono text-slate-400">47/48 module đạt chuẩn</p>
                </div>
              </div>

              {/* Progress bars by module */}
              <div className="space-y-2 text-xs">
                {SLA_MODULES.map((mod) => (
                  <div key={mod.code} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-600 dark:text-slate-300 font-sans truncate max-w-[150px]">
                        {mod.code}
                      </span>
                      <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {mod.percentage}%
                      </strong>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${mod.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Col 3: Thông báo & Sự kiện gần đây (3.5 cols) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Thông báo &amp; Sự kiện gần đây
                </h4>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                  Xem tất cả →
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Event 1 */}
                <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Icons.Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Đơn hàng SO-2026-00123 đã được duyệt
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono block">2 phút trước</span>
                  </div>
                </div>

                {/* Event 2 */}
                <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Icons.PackageCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Phiếu nhập kho PN-2026-00456 đã hoàn tất
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono block">8 phút trước</span>
                  </div>
                </div>

                {/* Event 3 */}
                <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Icons.AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Cảnh báo tồn kho thấp: SP001 (Còn 5)
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono block">15 phút trước</span>
                  </div>
                </div>

                {/* Event 4 */}
                <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Icons.FileCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Hóa đơn INV-2026-00890 đã phát hành
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono block">22 phút trước</span>
                  </div>
                </div>

                {/* Event 5 */}
                <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Icons.RefreshCw className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Sự kiện đồng bộ dữ liệu hoàn tất
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono block">30 phút trước</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
    </div>
  );
};
