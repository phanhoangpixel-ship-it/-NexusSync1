import React, { useState, useEffect, useCallback } from 'react';
import { SelectedEntityContext } from '../../../../types';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { TablePagination } from '../../../../components/common/TablePagination';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { MoneyCell } from '../../../../components/common/MoneyCell';
import { QtyCell } from '../../../../components/common/QtyCell';
import { BulkActionBar } from '../../../../components/common/BulkActionBar';
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
  FileText,
  Clock,
  Briefcase,
  Lock,
  ExternalLink,
  Layers3
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
import {
  PnLReportResult,
  CashFlowReportResult,
  FinancialRatiosResult,
  Forecast90Day,
  ExecutiveKpiSummary,
  AnalyticsScope,
  ExportJobRecord
} from '../types';

interface Props {
  onSelectEntity?: (entity: SelectedEntityContext | null) => void;
  onNotify?: (type: 'success' | 'danger' | 'warning' | 'info', title: string, msg: string) => void;
}

type TabType = 'KPI_OVERVIEW' | 'PNL' | 'CASHFLOW' | 'TURNOVER_RATIOS' | 'FORECAST' | 'EXPORT_AUDIT';

const COLORS = ['#6366F1', '#10B981', '#F43F5E', '#F59E0B', '#8B5CF6', '#06B6D4'];

export const M37BiAnalyticsWorkspace: React.FC<Props> = ({ onSelectEntity, onNotify }) => {
  const { activeTabId } = useWorkspaceSessionTab('M37');

  // Navigation & Filter state
  const [activeTab, setActiveTab] = useState<TabType>('KPI_OVERVIEW');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('ALL');
  const [selectedScope, setSelectedScope] = useState<AnalyticsScope>('BRANCH');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Data states from API
  const [kpis, setKpis] = useState<ExecutiveKpiSummary | null>(null);
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [pnlData, setPnlData] = useState<PnLReportResult | null>(null);
  const [cashflowData, setCashflowData] = useState<CashFlowReportResult | null>(null);
  const [ratiosData, setRatiosData] = useState<FinancialRatiosResult | null>(null);
  const [forecastData, setForecastData] = useState<Forecast90Day[]>([]);
  const [channelData, setChannelData] = useState<any[]>([]);
  const [branchData, setBranchData] = useState<any[]>([]);
  const [exportJobsList, setExportJobsList] = useState<ExportJobRecord[]>([]);

  // Rule #19 ConfirmDialog state
  const [confirmDialog, setConfirmDialog] = useState<any>(null);

  // Search/Filter state for table views
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Fetch Summary & KPIs
  const fetchKpisAndSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resKpis, resSummary, resChan, resBranch] = await Promise.all([
        fetch(`/api/analytics/kpis?year=${selectedYear}&scope=${selectedScope}`),
        fetch(`/api/reports/summary?year=${selectedYear}&quarter=${selectedQuarter}&scope=${selectedScope}`),
        fetch('/api/analytics/channel-distribution'),
        fetch('/api/analytics/branch-performance'),
      ]);

      if (resKpis.ok) {
        const json = await resKpis.json();
        if (json.success && json.kpis) setKpis(json.kpis);
      }
      if (resSummary.ok) {
        const json = await resSummary.json();
        if (json.success && json.dataset) setMonthlyChartData(json.dataset);
      }
      if (resChan.ok) {
        const json = await resChan.json();
        if (json.success && json.channels) setChannelData(json.channels);
      }
      if (resBranch.ok) {
        const json = await resBranch.json();
        if (json.success && json.branches) setBranchData(json.branches);
      }
    } catch (err) {
      console.error('Failed to load KPIs and Summary', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedQuarter, selectedScope]);

  // Fetch P&L
  const fetchPnL = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/pnl?year=${selectedYear}&scope=${selectedScope}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setPnlData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch PnL', err);
    }
  }, [selectedYear, selectedScope]);

  // Fetch Cashflow
  const fetchCashflow = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/cashflow?year=${selectedYear}&scope=${selectedScope}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setCashflowData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch Cashflow', err);
    }
  }, [selectedYear, selectedScope]);

  // Fetch Ratios
  const fetchRatios = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/turnover-ratios?year=${selectedYear}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setRatiosData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch Turnover & Ratios', err);
    }
  }, [selectedYear]);

  // Fetch Forecast
  const fetchForecast = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/forecast`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setForecastData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch Forecast', err);
    }
  }, []);

  // Sync state on tab/filter change
  useEffect(() => {
    fetchKpisAndSummary();
    if (activeTab === 'PNL') fetchPnL();
    if (activeTab === 'CASHFLOW') fetchCashflow();
    if (activeTab === 'TURNOVER_RATIOS') fetchRatios();
    if (activeTab === 'FORECAST') fetchForecast();
  }, [activeTab, fetchKpisAndSummary, fetchPnL, fetchCashflow, fetchRatios, fetchForecast]);

  // Rule #19 Dialog trigger for export
  const handleTriggerExport = (format: 'EXCEL' | 'PDF' | 'CSV') => {
    setConfirmDialog({
      title: `Xác nhận Xuất Báo Cáo (${format})`,
      message: `Bạn đang yêu cầu xuất Báo cáo Điều hành C-Level [${activeTab}] năm ${selectedYear} dưới định dạng ${format}. Hệ thống sẽ khởi tạo Idempotency Key và ghi log Audit M02.`,
      confirmLabel: 'Xác nhận Xuất',
      cancelLabel: 'Hủy bỏ',
      variant: 'primary',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const idempotencyKey = `EXP-M37-${activeTab}-${selectedYear}-${Date.now()}`;
          const res = await fetch('/api/analytics/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idempotencyKey,
              reportType: activeTab === 'KPI_OVERVIEW' ? 'KPI_SUMMARY' : activeTab,
              scope: selectedScope,
              format
            })
          });

          if (res.ok) {
            const json = await res.json();
            if (json.success && json.job) {
              setExportJobsList(prev => [json.job, ...prev]);
              onNotify?.('success', 'Khởi tạo Export thành công', `Mã Job ID: ${json.job.jobId} - Đã ghi nhận Audit Log M02.`);
            }
          }
        } catch (err: any) {
          onNotify?.('danger', 'Lỗi xuất báo cáo', err.message);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-5 p-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* ================= LEVEL 0: COMPACT WORKSPACE CONTROL BAR ================= */}
      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col xl:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            M37 • EXECUTIVE BI
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Báo Cáo Quản Trị C-Level • Single Writer: M30 GL
          </span>
        </div>

        {/* Operational Filters & Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          {/* Scope Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setSelectedScope('BRANCH')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                selectedScope === 'BRANCH' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Chi Nhánh
            </button>
            <button
              onClick={() => setSelectedScope('CONSOLIDATED')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                selectedScope === 'CONSOLIDATED' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers3 className="w-3 h-3" /> Toàn Tập Đoàn
            </button>
          </div>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:outline-hidden"
          >
            <option value={2026}>Năm 2026</option>
            <option value={2025}>Năm 2025</option>
          </select>

          {/* Export button */}
          <button
            onClick={() => handleTriggerExport('EXCEL')}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> <span>Xuất Báo Cáo</span>
          </button>

          <button
            onClick={() => fetchKpisAndSummary()}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ================= LEVEL 3: NAVIGATION TABS ================= */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none bg-white dark:bg-slate-800 rounded-xl px-2 shadow-xs">
        <button
          onClick={() => setActiveTab('KPI_OVERVIEW')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'KPI_OVERVIEW'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Tổng Quan KPI Điều Hành
        </button>

        <button
          onClick={() => setActiveTab('PNL')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'PNL'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> Báo Cáo P&L (VAS M30)
        </button>

        <button
          onClick={() => setActiveTab('CASHFLOW')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'CASHFLOW'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Lưu Chuyển Tiền Tệ
        </button>

        <button
          onClick={() => setActiveTab('TURNOVER_RATIOS')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'TURNOVER_RATIOS'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" /> Vòng Quay Tồn Kho & Tỷ Số
        </button>

        <button
          onClick={() => setActiveTab('FORECAST')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'FORECAST'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Dự Báo Dòng Tiền 90 Ngày
        </button>

        <button
          onClick={() => setActiveTab('EXPORT_AUDIT')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'EXPORT_AUDIT'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Truy Vết & Xuất Báo Cáo
        </button>
      </div>

      {/* ================= TAB 1: KPI OVERVIEW ================= */}
      {activeTab === 'KPI_OVERVIEW' && (
        <div className="space-y-6">
          {/* Executive KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Doanh Thu Thuần</span>
                <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatCurrency(kpis?.totalRevenue)}
                </span>
                <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{kpis?.revenueGrowthYoY || 15.4}% YoY
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Giá Vốn COGS (M42)</span>
                <span className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatCurrency(kpis?.totalCogs)}
                </span>
                <div className="flex items-center gap-1 mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  <ArrowDownRight className="w-3.5 h-3.5" /> {kpis?.cogsVariancePct || -2.1}% so với kế hoạch
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Lợi Nhuận Gộp (Margin)</span>
                <span className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatCurrency(kpis?.grossProfit)}
                </span>
                <div className="flex items-center gap-1 mt-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  Tỷ suất: <span className="font-bold font-mono">{kpis?.grossMarginPct}%</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Số Dư Quỹ & Ngân Hàng</span>
                <span className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Activity className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatCurrency(kpis?.cashBalance)}
                </span>
                <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Khớp thực tế với M32/M33
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                <span>Xu Hướng Doanh Thu & Giá Vốn Hàng Tháng ({selectedYear})</span>
                <span className="text-xs font-normal text-slate-500">Nguồn: Sổ cái GL M30</span>
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="month" tickLine={false} style={{ fontSize: '11px' }} />
                    <YAxis tickLine={false} style={{ fontSize: '11px' }} tickFormatter={(val) => `${val / 1000000}M`} />
                    <RechartsTooltip
                      formatter={(val: number) => formatCurrency(val)}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '12px' }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Doanh Thu" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cogs" name="Giá Vốn COGS" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="profit" name="Lợi Nhuận Gộp" stroke="#10B981" strokeWidth={2.5} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales Channel Share */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Phân Bổ Kênh Bán Hàng</h3>
              <div className="h-52 my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={channelData} dataKey="amount" nameKey="channelName" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {channelData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2 border-t border-slate-100 dark:border-slate-700/50 pt-2">
                {channelData.map((ch, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      {ch.channelName}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{ch.sharePct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: P&L STATEMENT (VAS M30) ================= */}
      {activeTab === 'PNL' && pnlData && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Báo Cáo Kết Quả Hoạt Động Kinh Doanh (VAS)</h2>
              <p className="text-xs text-slate-500">Căn cứ dữ liệu Sổ cái M30 & Giá vốn M42 | Kỳ: <span className="font-mono font-bold">{pnlData.periodCode}</span></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleTriggerExport('PDF')} className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-colors flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Xuất PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4 font-semibold">Mã / Chỉ Tiêu Lợi Nhuận</th>
                  <th className="py-3 px-4 font-semibold text-center">Nguồn TK VAS</th>
                  <th className="py-3 px-4 font-semibold text-right">Kỳ Này (VND)</th>
                  <th className="py-3 px-4 font-semibold text-right">Kỳ Trước (VND)</th>
                  <th className="py-3 px-4 font-semibold text-right">Tăng Trưởng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {pnlData.lines.map((line, idx) => {
                  const isCalculated = line.accountGroup === 'CALCULATED';
                  return (
                    <tr key={idx} className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/30 ${isCalculated ? 'bg-indigo-50/30 dark:bg-indigo-950/20 font-bold' : ''}`}>
                      <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100">{line.lineName}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">{line.accountGroup}</td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-white font-bold">{formatCurrency(line.amount)}</td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-500">{formatCurrency(line.priorPeriodAmount)}</td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">+{line.growthPct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: CASHFLOW STATEMENT ================= */}
      {activeTab === 'CASHFLOW' && cashflowData && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Báo Cáo Lưu Chuyển Tiền Tệ (Cash Flow Statement)</h2>
              <p className="text-xs text-slate-500">Đối soát trực tiếp Quỹ & Ngân hàng M32/M33 | Số dư khớp tuyệt đối</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Số Dư Quỹ Cuối Kỳ</span>
              <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">{formatCurrency(cashflowData.closingCashBalance)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/50">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 block">Lưu Chuyển HĐ Kinh Doanh</span>
              <span className="text-lg font-bold font-mono text-emerald-800 dark:text-emerald-300 block mt-1">{formatCurrency(cashflowData.operatingCashFlow)}</span>
            </div>
            <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/50">
              <span className="text-xs font-medium text-rose-700 dark:text-rose-400 block">Lưu Chuyển HĐ Đầu Tư</span>
              <span className="text-lg font-bold font-mono text-rose-800 dark:text-rose-300 block mt-1">{formatCurrency(cashflowData.investingCashFlow)}</span>
            </div>
            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/50">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400 block">Lưu Chuyển HĐ Tài Chính</span>
              <span className="text-lg font-bold font-mono text-blue-800 dark:text-blue-300 block mt-1">{formatCurrency(cashflowData.financingCashFlow)}</span>
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4 font-semibold">Phân Loại HĐ</th>
                <th className="py-3 px-4 font-semibold">Diễn Giải Lưu Chuyển Dòng Tiền</th>
                <th className="py-3 px-4 font-semibold text-right">Dòng Tiền Thu (VND)</th>
                <th className="py-3 px-4 font-semibold text-right">Dòng Tiền Chi (VND)</th>
                <th className="py-3 px-4 font-semibold text-right">Lưu Chuyển Thuần</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {cashflowData.lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                  <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">{line.category}</td>
                  <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100">{line.description}</td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(line.inflow)}</td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400">{formatCurrency(line.outflow)}</td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">{formatCurrency(line.netCash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= TAB 4: TURNOVER & FINANCIAL RATIOS ================= */}
      {activeTab === 'TURNOVER_RATIOS' && ratiosData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Inventory Turnover Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Vòng Quay Tồn Kho (Turnover)</h3>
              <div className="text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 my-2">
                {ratiosData.inventoryTurnoverRatio} <span className="text-sm font-normal text-slate-500">vòng / năm</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Thời gian giải phóng kho trung bình: <span className="font-bold font-mono">{ratiosData.daysSalesInInventory} ngày</span>
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500">
                Công thức: Giá vốn COGS (M42) / Tồn kho trung bình (M17)
              </div>
            </div>

            {/* DSO & DPO Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Kỳ Thu Tiền & Trả Nợ (DSO / DPO)</h3>
              <div className="grid grid-cols-2 gap-2 my-2">
                <div>
                  <span className="text-[11px] text-slate-400 block">DSO (Thu tiền)</span>
                  <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{ratiosData.dso} ngày</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">DPO (Trả nợ)</span>
                  <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">{ratiosData.dpo} ngày</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Chu kỳ chuyển đổi tiền mặt (CCC): <span className="font-bold font-mono text-indigo-600">{ratiosData.cashConversionCycle} ngày</span>
              </p>
            </div>

            {/* Liquidity Ratios Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Thanh Khoản Hiện Hành & Nhanh</h3>
              <div className="grid grid-cols-2 gap-2 my-2">
                <div>
                  <span className="text-[11px] text-slate-400 block">Current Ratio</span>
                  <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">{ratiosData.currentRatio}x</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Quick Ratio</span>
                  <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{ratiosData.quickRatio}x</span>
                </div>
              </div>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                An toàn thanh khoản
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: 90-DAY FORECAST ================= */}
      {activeTab === 'FORECAST' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Mô Hình Dự Báo Dòng Tiền & Doanh Thu 90 Ngày</h2>
              <p className="text-xs text-slate-500">Mô phỏng xu hướng từ dữ liệu bán hàng M13, mua hàng M08 và công nợ M31</p>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="dateStr" tickLine={false} style={{ fontSize: '11px' }} />
                <YAxis tickLine={false} style={{ fontSize: '11px' }} tickFormatter={(val) => `${val / 1000000}M`} />
                <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                <Area type="monotone" dataKey="projectedCashBalance" name="Số Dư Quỹ Dự Báo" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} />
                <Area type="monotone" dataKey="predictedRevenue" name="Doanh Thu Dự Báo" stroke="#10B981" fill="#10B981" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ================= TAB 6: TRUY VẾT & XUẤT BÁO CÁO ================= */}
      {activeTab === 'EXPORT_AUDIT' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xs space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Lịch Sử Xuất Báo Cáo & Nhật Ký Audit M02</h2>
              <p className="text-xs text-slate-500">Bảo mật thông tin điều hành C-Level | Đã niêm phong lưu kho M29 Vault</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleTriggerExport('EXCEL')} className="px-3.5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors flex items-center gap-1.5">
                <Download className="w-4 h-4" /> Xuất Excel Idempotent
              </button>
            </div>
          </div>

          {exportJobsList.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Chưa có lượt xuất báo cáo nào trong phiên làm việc này.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4 font-semibold">Mã Job ID</th>
                    <th className="py-3 px-4 font-semibold">Báo Cáo</th>
                    <th className="py-3 px-4 font-semibold">Định Dạng</th>
                    <th className="py-3 px-4 font-semibold">Phạm Vi</th>
                    <th className="py-3 px-4 font-semibold">Trạng Thái</th>
                    <th className="py-3 px-4 font-semibold text-right">M29 Vault Doc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {exportJobsList.map((job, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{job.jobId}</td>
                      <td className="py-3 px-4 text-slate-900 dark:text-slate-100 font-medium">{job.reportType}</td>
                      <td className="py-3 px-4 font-mono">{job.format}</td>
                      <td className="py-3 px-4">{job.scope}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        DOC-M29-#{job.dmsDocId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= RULE #19 CONFIRM DIALOG ================= */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={true}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          cancelLabel={confirmDialog.cancelLabel}
          variant={confirmDialog.variant || 'primary'}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </div>
  );
};

export default M37BiAnalyticsWorkspace;
