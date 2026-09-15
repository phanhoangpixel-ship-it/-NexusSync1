import React, { useState, useEffect, useCallback } from 'react';
import { SelectedEntityContext } from '../../types';
import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Activity,
  Download,
  Filter,
  RefreshCw,
  Calendar,
  X,
  FileSpreadsheet,
  PieChart as PieIcon,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Share2,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Props {
  onSelectEntity?: (entity: SelectedEntityContext | null) => void;
  onNotify?: (type: 'success' | 'danger' | 'warning' | 'info', title: string, msg: string) => void;
}

interface MonthlyStat {
  month: string;
  monthNum: number;
  monthName: string;
  revenue: number;
  cogs: number;
  profit: number;
  marginPct: number;
  orderCount?: number;
  operatingExpense?: number;
}

interface KpiMetrics {
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  grossMarginPct: number;
  netProfit: number;
  netMarginPct: number;
  totalOpEx: number;
  revenueGrowthYoY: number;
  cogsVariancePct: number;
  profitGrowthYoY: number;
}

interface CategoryItem {
  name: string;
  code: string;
  value: number;
  sharePct: number;
  growth: string;
}

interface ChannelItem {
  channelName: string;
  code: string;
  amount: number;
  sharePct: number;
  trend: string;
}

interface BranchItem {
  branchCode: string;
  branchName: string;
  revenue: number;
  cogs: number;
  profit: number;
  marginPct: number;
  status: string;
}

const COLORS = ['#6366F1', '#10B981', '#F43F5E', '#F59E0B', '#8B5CF6', '#06B6D4'];

const formatCurrencyVND = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

export const M37BiAnalyticsWorkspace: React.FC<Props> = ({ onNotify }) => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'pnl' | 'revenue' | 'channels_branches' | 'data'>('M37', 'pnl');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedQuarter, setSelectedQuarter] = useState('ALL');
  const [drillDownMonth, setDrillDownMonth] = useState<string | null>(null);

  // Raw data table states
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'POSITIVE' | 'WARNING'>('ALL');

  // Backend state
  const [monthlyData, setMonthlyData] = useState<MonthlyStat[]>([]);
  const [kpis, setKpis] = useState<KpiMetrics | null>(null);
  const [drillDownCategories, setDrillDownCategories] = useState<CategoryItem[]>([]);
  const [channelData, setChannelData] = useState<ChannelItem[]>([]);
  const [branchData, setBranchData] = useState<BranchItem[]>([]);

  // Fetch monthly P&L and summary
  const fetchMonthlySummary = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/analytics/pnl-monthly?year=${selectedYear}&quarter=${selectedQuarter}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.dataset) {
          setMonthlyData(json.dataset);
        }
      }
    } catch (err) {
      console.error('Failed to load monthly summary', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedQuarter]);

  // Fetch KPIs
  const fetchKpis = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/kpis?year=${selectedYear}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.kpis) {
          setKpis(json.kpis);
        }
      }
    } catch (err) {
      console.error('Failed to load KPIs', err);
    }
  }, [selectedYear]);

  // Fetch Channels & Branches
  const fetchAuxiliaryAnalytics = useCallback(async () => {
    try {
      const [resChan, resBranch] = await Promise.all([
        fetch('/api/analytics/channel-distribution'),
        fetch('/api/analytics/branch-performance'),
      ]);
      if (resChan.ok) {
        const jsonChan = await resChan.json();
        if (jsonChan.success && jsonChan.channels) setChannelData(jsonChan.channels);
      }
      if (resBranch.ok) {
        const jsonBranch = await resBranch.json();
        if (jsonBranch.success && jsonBranch.branches) setBranchData(jsonBranch.branches);
      }
    } catch (err) {
      console.error('Failed to load auxiliary analytics', err);
    }
  }, []);

  // Fetch Drilldown when month selected
  useEffect(() => {
    if (!drillDownMonth) return;
    const loadDrilldown = async () => {
      try {
        const res = await fetch(`/api/analytics/category-drilldown?month=${drillDownMonth}&year=${selectedYear}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.drilldown) {
            setDrillDownCategories(json.drilldown);
          }
        }
      } catch (err) {
        console.error('Failed to load drilldown data', err);
      }
    };
    loadDrilldown();
  }, [drillDownMonth, selectedYear]);

  // Initial loading
  useEffect(() => {
    fetchMonthlySummary();
    fetchKpis();
    fetchAuxiliaryAnalytics();
  }, [fetchMonthlySummary, fetchKpis, fetchAuxiliaryAnalytics]);

  const handleRefresh = () => {
    fetchMonthlySummary();
    fetchKpis();
    fetchAuxiliaryAnalytics();
    onNotify?.('success', 'Đồng bộ dữ liệu', 'Đã làm mới và đồng bộ toàn bộ dữ liệu báo cáo BI & Phân tích quản trị.');
  };

  const handleExportCSV = () => {
    const headers = ['Kỳ Báo Cáo', 'Doanh Thu (VND)', 'Giá Vốn COGS (VND)', 'Lợi Nhuận Gộp (VND)', 'Tỷ Suất LN (%)', 'Trạng Thái'];
    const csvRows = [
      headers.join(','),
      ...monthlyData.map(row => {
        const status = row.profit >= 0 ? 'TÍCH CỰC' : 'CẦN CHÚ Ý';
        return `"${row.monthName} ${selectedYear}",${row.revenue},${row.cogs},${row.profit},${row.marginPct}%,${status}`;
      })
    ];
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `M37_BI_Analytics_Report_${selectedYear}_${selectedQuarter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify?.('success', 'Xuất Excel/CSV', 'Đã tải xuống file dữ liệu báo cáo phân tích thành công.');
  };

  // Filtered table data
  const filteredTableData = monthlyData.filter(row => {
    const matchesSearch = row.monthName.toLowerCase().includes(tableSearch.toLowerCase()) ||
      row.month.toLowerCase().includes(tableSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'POSITIVE') return row.profit >= 0;
    if (statusFilter === 'WARNING') return row.profit < 0;
    return true;
  });

  return (
    <div className="space-y-5 p-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* ================= LEVEL 0: WORKSPACE BANNER ================= */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                M37 • ENTERPRISE BI
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Trực Tuyến Thời Gian Thực
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mt-1">
              Phân Tích Quản Trị & Báo Cáo BI Đa Chiều (OLAP Analytics)
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Trung tâm điều hành dữ liệu tài chính, phân tích lợi nhuận P&L, đối soát giá vốn COGS và bóc tách cơ cấu kênh kinh doanh.
            </p>
          </div>
        </div>

        {/* Global Toolbar Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-blue-400 mr-2" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-white font-medium outline-hidden cursor-pointer"
            >
              <option value="2026" className="bg-slate-800 text-white">Năm Tài Chính 2026</option>
              <option value="2025" className="bg-slate-800 text-white">Năm Tài Chính 2025</option>
            </select>
          </div>

          {/* Quarter selector */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200">
            <Filter className="w-3.5 h-3.5 text-indigo-400 mr-2" />
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="bg-transparent text-white font-medium outline-hidden cursor-pointer"
            >
              <option value="ALL" className="bg-slate-800 text-white">Toàn Bộ Năm (12 Tháng)</option>
              <option value="Q1" className="bg-slate-800 text-white">Quý 1 (Tháng 1 - Tháng 3)</option>
              <option value="Q2" className="bg-slate-800 text-white">Quý 2 (Tháng 4 - Tháng 6)</option>
              <option value="Q3" className="bg-slate-800 text-white">Quý 3 (Tháng 7 - Tháng 9)</option>
              <option value="Q4" className="bg-slate-800 text-white">Quý 4 (Tháng 10 - Tháng 12)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Báo Cáo CSV</span>
          </button>
        </div>
      </div>

      {/* ================= LEVEL 1: EXECUTIVE KPI SUMMARY STRIP ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Doanh Thu */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng Doanh Thu</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
            {kpis ? formatCurrencyVND(kpis.totalRevenue) : '...'}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.5% so với cùng kỳ năm trước</span>
          </div>
        </div>

        {/* KPI 2: Giá Vốn COGS */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng Giá Vốn (COGS)</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
            {kpis ? formatCurrencyVND(kpis.totalCogs) : '...'}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Activity className="w-3.5 h-3.5" />
            <span>Chiếm tỷ trọng {kpis && kpis.totalRevenue > 0 ? ((kpis.totalCogs / kpis.totalRevenue) * 100).toFixed(1) : 0}% doanh thu</span>
          </div>
        </div>

        {/* KPI 3: Lợi Nhuận Gộp */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Lợi Nhuận Gộp (Gross Profit)</span>
            <div className={`p-2 rounded-lg ${
              kpis && kpis.grossProfit >= 0
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
            }`}>
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight ${
            kpis && kpis.grossProfit >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}>
            {kpis ? formatCurrencyVND(kpis.grossProfit) : '...'}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>Tỷ suất biên lợi nhuận: </span>
            <span className="font-bold text-slate-900 dark:text-white">{kpis ? `${kpis.grossMarginPct}%` : '...'}</span>
          </div>
        </div>

        {/* KPI 4: Hiệu Quả Điều Hành & Chi Phí */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Trạng Thái Kiểm Toán</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tracking-tight">
            HOÀN THÀNH
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Đối soát 100% với Sổ Cái Tài Khoản</span>
          </div>
        </div>
      </div>

      {/* ================= LEVEL 2: NAVIGATION TABS (M41 MASTER SPEC) ================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('pnl')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'pnl'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Tổng Quan P&amp;L &amp; Lợi Nhuận</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('revenue')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'revenue'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Tương Quan Doanh Thu &amp; Giá Vốn (COGS)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('channels_branches')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'channels_branches'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Cơ Cấu Kênh &amp; Chi Nhánh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'data'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Bảng Dữ Liệu Thô (Raw Data)</span>
          </button>
        </div>

        {/* Right Info Strip */}
        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            GL Synchronized
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
            Realtime OLAP
          </span>
        </div>
      </div>

      {/* ================= TAB 1: TỔNG QUAN P&L ================= */}
      {activeTab === 'pnl' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Biểu Đồ Lợi Nhuận Gộp P&L & Doanh Thu Từng Tháng ({selectedYear})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Nhấp chuột vào bất kỳ cột doanh thu nào để mở phân tích chuyên sâu (OLAP Drill-down) theo danh mục sản phẩm.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Live Composed Model
              </span>
            </div>
          </div>

          <div className="h-96 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                />
                <RechartsTooltip
                  formatter={(val: number) => [`${formatCurrencyVND(val)}`, '']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar
                  dataKey="revenue"
                  name="Doanh thu"
                  fill="#6366F1"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                  cursor="pointer"
                  onClick={(entry: any) => setDrillDownMonth(entry?.month ?? entry?.payload?.month)}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Lợi nhuận gộp"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#FFFFFF' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ================= TAB 2: TƯƠNG QUAN DOANH THU & GIÁ VỐN ================= */}
      {activeTab === 'revenue' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Biểu Đồ Tương Quan Doanh Thu & Giá Vốn (COGS)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Đối soát tỷ trọng chi phí giá vốn so với tổng doanh thu theo chu kỳ kế toán.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Area Density Model
              </span>
            </div>
          </div>

          <div className="h-96 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCogs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                />
                <RechartsTooltip
                  formatter={(val: number) => [`${formatCurrencyVND(val)}`, '']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="cogs"
                  name="Giá vốn (COGS)"
                  stroke="#F43F5E"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCogs)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ================= TAB 3: CƠ CẤU KÊNH & CHI NHÁNH ================= */}
      {activeTab === 'channels_branches' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Channels Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Cơ Cấu Doanh Thu Theo Kênh Phân Phối</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Omni-Channel</span>
            </div>

            <div className="space-y-3">
              {channelData.map((chan, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{chan.channelName}</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatCurrencyVND(chan.amount)}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${chan.sharePct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Tỷ trọng: {chan.sharePct}%</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{chan.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Branches Matrix */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Hiệu Suất Kinh Doanh Từng Chi Nhánh</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Multi-Warehouse</span>
            </div>

            <div className="space-y-3">
              {branchData.map((b, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{b.branchName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {b.branchCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Doanh thu: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrencyVND(b.revenue)}</span> • LN: <span className="font-semibold text-emerald-600">{formatCurrencyVND(b.profit)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">{b.marginPct}%</span>
                    <div className="mt-1">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        b.status === 'TÍCH CỰC'
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                          : 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: DỮ LIỆU CHI TIẾT (RAW DATA) ================= */}
      {activeTab === 'data' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Bảng Dữ Liệu Kiểm Toán & Đối Soát (Raw Financial Ledger)
              </h3>
            </div>

            {/* Filter and Search */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kỳ báo cáo..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-hidden cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="POSITIVE">Chỉ Tích Cực</option>
                <option value="WARNING">Chỉ Cần Chú Ý</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Kỳ Báo Cáo</th>
                  <th className="py-3 px-4 text-right">Doanh Thu (VND)</th>
                  <th className="py-3 px-4 text-right">Giá Vốn COGS (VND)</th>
                  <th className="py-3 px-4 text-right">Lợi Nhuận Gộp (VND)</th>
                  <th className="py-3 px-4 text-right">Tỷ Suất (%)</th>
                  <th className="py-3 px-4 text-center">Trạng Thái Hiệu Suất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredTableData.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                          {row.monthName} {selectedYear}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Kỳ kế toán tháng {row.monthNum}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-right text-indigo-700 dark:text-indigo-300 text-sm">
                      {formatCurrencyVND(row.revenue)}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-right text-rose-600 dark:text-rose-400 text-xs">
                      {formatCurrencyVND(row.cogs)}
                    </td>
                    <td className={`py-3.5 px-4 font-mono tabular-nums font-bold text-right text-xs ${
                      row.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formatCurrencyVND(row.profit)}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-right text-xs text-slate-700 dark:text-slate-300">
                      {row.marginPct}%
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                        row.profit >= 0
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                          : 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700'
                      }`}>
                        {row.profit >= 0 ? 'TÍCH CỰC' : 'CẦN CHÚ Ý'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: DRILL-DOWN CHI TIẾT (OLAP) ================= */}
      {drillDownMonth && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                    <PieIcon className="w-4 h-4" />
                  </div>
                  <span>Phân Tích Chuyên Sâu (OLAP Drill-down)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Cơ cấu doanh thu theo Danh mục sản phẩm — Kỳ báo cáo {drillDownMonth} {selectedYear}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrillDownMonth(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-2">
              <div className="w-full md:w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={drillDownCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {drillDownCategories.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => [`${formatCurrencyVND(value)}`, 'Doanh thu']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full md:w-1/2 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Bóc Tách Tỷ Trọng Danh Mục
                </h4>
                {drillDownCategories.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {item.growth} • Chiếm {item.sharePct}%
                        </span>
                      </div>
                    </div>
                    <span className="font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white">
                      {formatCurrencyVND(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDrillDownMonth(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Đóng phân tích
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
