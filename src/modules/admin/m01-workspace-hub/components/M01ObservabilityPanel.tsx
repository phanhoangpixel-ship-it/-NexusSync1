import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { Pagination } from '../../../../components/common/Pagination';
import { ConfirmDialogState } from '../../../../types';
import { m01WorkspaceApi } from '../services/m01WorkspaceApi';

interface HealthSummary {
  date: string;
  snapshotComputed?: boolean;
  warning?: string;
  projectorBackpressure?: {
    active: boolean;
    consecutiveBusyErrors: number;
    consecutiveSuccess: number;
    skippedCycles?: number;
  };
  systemScore: number;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  totalModulesInRegistry: number;
  modulesWithActivityToday: number;
  greenModules: number;
  yellowModules: number;
  redModules: number;
  note?: string;
}

interface TopologyModule {
  moduleId: string;
  moduleName: string;
  group: string;
  route: string;
  workspaceId: string | null;
  registryOnly: boolean;
  hasActivityToday: boolean;
  efficiencyScore: number | null;
  totalActions: number;
  errorCount: number;
}

export interface ModuleTrendItem {
  moduleCode: string;
  moduleName: string;
  currentScore: number | null;
  baselineAvg: number | null;
  dataPointsUsed: number;
  trendStatus: 'IMPROVING' | 'DEGRADING' | 'STABLE' | 'INSUFFICIENT_DATA' | 'NO_DATA';
}

export interface ModuleTrendPoint {
  snapshotDate: string;
  efficiencyScore: number;
  totalActions: number;
}

export interface ModuleForecastItem {
  moduleCode: string;
  moduleName: string;
  currentScore: number | null;
  ratePerDay: number | null;
  dataPointsUsed: number;
  forecastStatus: 'DEGRADING_TREND' | 'STABLE_OR_IMPROVING' | 'INSUFFICIENT_DATA' | 'NO_DATA';
  projectedBreachDate: string | null;
}

export interface ModuleForecastDetail extends ModuleForecastItem {
  slope: number | null;
  intercept: number | null;
  dataPoints: Array<{ snapshotDate: string; efficiencyScore: number; totalActions: number }>;
}

interface FlowSpanItem {
  id: number;
  sourceType: 'AUDIT' | 'EVENT';
  sourceRefId: number;
  correlationId: string | null;
  moduleCode: string;
  moduleRaw: string;
  branchId: number | null;
  userId: number | null;
  actionName: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  occurredAt: string;
  durationMs: number | null;
  metadataMasked: string | null;
  sourceEventId: string | null;
  projectedAt: string;
}

interface RcaChainResult {
  correlationId: string;
  spans: FlowSpanItem[];
  rootCause: FlowSpanItem | null;
  totalSpans: number;
  failedSpans: number;
}

export const M01ObservabilityPanel: React.FC = () => {
  const [health, setHealth] = useState<HealthSummary | null>(null);
  const [modules, setModules] = useState<TopologyModule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRIFT' | 'ERROR'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Time-Travel & Trend Detection states (Phase 3)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [trends, setTrends] = useState<ModuleTrendItem[]>([]);
  const [forecasts, setForecasts] = useState<ModuleForecastItem[]>([]);
  const [selectedModuleTrend, setSelectedModuleTrend] = useState<{
    moduleCode: string;
    moduleName: string;
    points: ModuleTrendPoint[];
    forecast?: ModuleForecastDetail | null;
  } | null>(null);
  const [trendDetailLoading, setTrendDetailLoading] = useState<boolean>(false);

  // Span Explorer & RCA states (Phase 2)
  const [spans, setSpans] = useState<FlowSpanItem[]>([]);
  const [spansTotal, setSpansTotal] = useState<number>(0);
  const [spansPage, setSpansPage] = useState<number>(1);
  const [spansPageSize, setSpansPageSize] = useState<number>(10);
  const [spansLoading, setSpansLoading] = useState<boolean>(false);
  const [spanModuleFilter, setSpanModuleFilter] = useState<string>('');
  const [spanStatusFilter, setSpanStatusFilter] = useState<string>('');
  const [spanCorrelationFilter, setSpanCorrelationFilter] = useState<string>('');

  const [selectedCorrelationId, setSelectedCorrelationId] = useState<string | null>(null);
  const [rcaChain, setRcaChain] = useState<RcaChainResult | null>(null);
  const [rcaLoading, setRcaLoading] = useState<boolean>(false);
  const [remediatingId, setRemediatingId] = useState<number | null>(null);

  const fetchSpans = async (page = spansPage, size = spansPageSize) => {
    setSpansLoading(true);
    try {
      const data = await m01WorkspaceApi.getSpans({
        page,
        pageSize: size,
        moduleCode: spanModuleFilter || undefined,
        status: spanStatusFilter || undefined,
        correlationId: spanCorrelationFilter || undefined
      });
      setSpans(data.items || data.spans || []);
      setSpansTotal(data.total || 0);
    } catch (err: any) {
      console.error('Error fetching spans:', err);
    } finally {
      setSpansLoading(false);
    }
  };

  const fetchRcaChain = async (correlationId: string) => {
    setSelectedCorrelationId(correlationId);
    setRcaLoading(true);
    setRcaChain(null);
    try {
      const data = await m01WorkspaceApi.getRcaChain(correlationId);
      setRcaChain(data);
    } catch (err: any) {
      console.error('Error fetching RCA chain:', err);
    } finally {
      setRcaLoading(false);
    }
  };

  const handleRetrySpan = (span: FlowSpanItem) => {
    setConfirmDialog({
      isOpen: true,
      title: `Thử lại sự kiện lỗi [${span.sourceEventId || span.id}]`,
      message: 'Hệ thống sẽ gọi lại cơ chế xử lý sự kiện lỗi của M05 EventBus cho bản ghi này. Không ảnh hưởng tới dữ liệu tồn kho/kế toán/giá/giá vốn.',
      variant: 'warning',
      confirmText: 'Xác nhận thử lại',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        setRemediatingId(span.id);
        try {
          await m01WorkspaceApi.remediateSpan(span.id);
          await Promise.all([
            fetchObservabilityData(),
            fetchSpans(spansPage, spansPageSize)
          ]);
          if (selectedCorrelationId) {
            await fetchRcaChain(selectedCorrelationId);
          }
        } catch (err: any) {
          setError(err?.message || 'Lỗi khi gọi remediation');
        } finally {
          setRemediatingId(null);
        }
      }
    });
  };

  const fetchObservabilityData = async (targetDate = selectedDate) => {
    setLoading(true);
    setError(null);
    try {
      const [hData, tData, trData, fcData] = await Promise.all([
        m01WorkspaceApi.getObservabilityHealth(targetDate),
        m01WorkspaceApi.getObservabilityTopology(targetDate),
        m01WorkspaceApi.getAllModuleTrends(7).catch(() => []),
        m01WorkspaceApi.getForecasts(30).catch(() => []),
      ]);

      if (!hData || !tData) {
        throw new Error('Không thể tải dữ liệu giám sát hệ thống');
      }

      setTrends(Array.isArray(trData) ? trData : []);
      setForecasts(Array.isArray(fcData) ? fcData : []);
      setHealth(hData as any);
      setModules(tData.modules || []);
    } catch (err: any) {
      setError(err?.message || 'Lỗi nạp dữ liệu Observability');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    if (newDate > todayStr) return;
    setSelectedDate(newDate);
    fetchObservabilityData(newDate);
  };

  const fetchModuleTrendDetail = async (moduleCode: string, moduleName: string) => {
    if (selectedModuleTrend?.moduleCode === moduleCode) {
      setSelectedModuleTrend(null);
      return;
    }
    setTrendDetailLoading(true);
    try {
      const [trendDetail, forecast] = await Promise.all([
        m01WorkspaceApi.getModuleTrendDetail(moduleCode, 30),
        m01WorkspaceApi.getForecastDetail(moduleCode, 30).catch(() => null),
      ]);
      setSelectedModuleTrend({
        moduleCode,
        moduleName,
        points: trendDetail?.dataPoints || [],
        forecast,
      });
    } catch (err: any) {
      console.error('Error fetching trend detail:', err);
    } finally {
      setTrendDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchObservabilityData();
    fetchSpans(1, 10);
  }, []);

  const handleManualSync = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kích hoạt Đồng bộ Chiếu Chiếu Observability',
      message: 'Hệ thống sẽ tổng hợp lại các bản ghi từ Audit Logs & Outbox Events theo thời gian thực và cập nhật Snapshot chỉ số SLA/KPI của 42 phân hệ. Bạn có muốn tiếp tục?',
      variant: 'primary',
      confirmText: 'Đồng bộ ngay',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        setSyncing(true);
        try {
          await m01WorkspaceApi.triggerSnapshotSync(true);
          await Promise.all([
            fetchObservabilityData(),
            fetchSpans(spansPage, spansPageSize)
          ]);
        } catch (err: any) {
          setError(err?.message || 'Lỗi khi kích hoạt đồng bộ snapshot');
        } finally {
          setSyncing(false);
        }
      }
    });
  };

  const uniqueGroups = useMemo(() => {
    const set = new Set<string>();
    modules.forEach((m) => {
      if (m.group) set.add(m.group);
    });
    return Array.from(set);
  }, [modules]);

  const trendsMap = useMemo(() => new Map(trends.map((t) => [t.moduleCode, t])), [trends]);

  const nearTermDegradingModules = useMemo(() => {
    const todayMs = new Date(todayStr).getTime();
    const maxWarningMs = todayMs + 3 * 24 * 60 * 60 * 1000;
    return forecasts.filter((f) => {
      if (f.forecastStatus !== 'DEGRADING_TREND' || !f.projectedBreachDate) return false;
      const breachMs = new Date(f.projectedBreachDate).getTime();
      return breachMs <= maxWarningMs;
    });
  }, [forecasts, todayStr]);

  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      const matchSearch =
        m.moduleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.moduleName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchGroup = selectedGroup === 'ALL' || m.group === selectedGroup;

      let matchStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchStatus = m.hasActivityToday;
      } else if (statusFilter === 'DRIFT') {
        matchStatus = m.registryOnly;
      } else if (statusFilter === 'ERROR') {
        matchStatus = m.errorCount > 0 || (m.efficiencyScore !== null && m.efficiencyScore < 90);
      }

      return matchSearch && matchGroup && matchStatus;
    });
  }, [modules, searchTerm, selectedGroup, statusFilter]);

  const totalPages = Math.ceil(filteredModules.length / pageSize) || 1;
  const paginatedModules = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredModules.slice(start, start + pageSize);
  }, [filteredModules, currentPage, pageSize]);

  // Listen to WorkspaceHub global toolbar refresh and sync events
  useEffect(() => {
    const handleRemoteRefresh = () => {
      fetchObservabilityData(selectedDate);
    };
    window.addEventListener('nexus:m01_observability_refresh', handleRemoteRefresh);
    return () => window.removeEventListener('nexus:m01_observability_refresh', handleRemoteRefresh);
  }, [fetchObservabilityData, selectedDate]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-2xs space-y-6">
      {/* Rule #19 ConfirmDialog */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

      {/* Header Section (Streamlined - No Duplicate Buttons) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Icons.Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
                NexusFlow Observability • Phase 5
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Statistical Forecast Projection • Trend Detection • Time-Travel Viewer • Rule-Based RCA
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Giám Sát Khả Dụng &amp; Bản Đồ Vận Hành Toàn Doanh Nghiệp
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time-Travel Date Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600">
            <Icons.Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Ngày:</span>
            <input
              type="date"
              value={selectedDate}
              max={todayStr}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-slate-100 border-none outline-none cursor-pointer"
              title="Chọn ngày trong quá khứ để xem lại lịch sử (Time-Travel)"
            />
            {selectedDate !== todayStr && (
              <button
                type="button"
                onClick={() => handleDateChange(todayStr)}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-1 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 cursor-pointer"
                title="Quay lại ngày hiện tại"
              >
                Hôm nay
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Live Flow Spans</span>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-200">
          <Icons.AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Time-Travel Notice Banner / Snapshot Warning Banner */}
      {health && health.snapshotComputed === false ? (
        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-start sm:items-center gap-2.5">
            <Icons.AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-bold text-amber-950 dark:text-amber-100">
                Chưa có bản ghi snapshot tổng hợp cho ngày <span className="font-mono">{selectedDate}</span>
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                Ngày này chưa từng được tính toán snapshot qua chu kỳ tổng hợp hàng ngày. Dữ liệu lịch sử có thể tồn tại trong <span className="font-mono font-semibold">flow_spans</span> nhưng chưa có chỉ số KPI.
              </p>
            </div>
          </div>
          {selectedDate !== todayStr && (
            <button
              type="button"
              onClick={() => handleDateChange(todayStr)}
              className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-all text-xs cursor-pointer shrink-0"
            >
              Quay lại hôm nay
            </button>
          )}
        </div>
      ) : selectedDate !== todayStr ? (
        <div className="p-3 sm:p-3.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center gap-2">
            <Icons.History className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              Chế độ <strong>Time-Travel</strong>: Đang xem lại ảnh chụp vận hành ngày <strong className="font-mono">{selectedDate}</strong> (Đã tổng hợp {health?.modulesWithActivityToday ?? 0} phân hệ có hoạt động).
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleDateChange(todayStr)}
            className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all text-[11px] cursor-pointer"
          >
            Quay lại hôm nay
          </button>
        </div>
      ) : null}

      {/* Projector Backpressure Banner (Phase 4) */}
      {health?.projectorBackpressure?.active && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-start sm:items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <Icons.PauseCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <p className="font-bold text-amber-950 dark:text-amber-100">
              Bộ đồng bộ M01 đang tạm nghỉ do phát hiện SQLite bận (SQLITE_BUSY liên tiếp)
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
              Dữ liệu quan sát có thể trễ hơn bình thường, không ảnh hưởng tới giao dịch nghiệp vụ.
            </p>
          </div>
        </div>
      )}

      {/* Early Warning Forecast Banner (Phase 5 - Statistical Least-Squares) */}
      {nearTermDegradingModules.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-start sm:items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <Icons.TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <p className="font-bold text-amber-950 dark:text-amber-100">
              {nearTermDegradingModules.length} phân hệ có xu hướng giảm điểm khả dụng, dự kiến chạm ngưỡng cảnh báo trong vài ngày tới nếu xu hướng tiếp diễn (tính bằng hồi quy tuyến tính đơn giản, không phải dự đoán AI).
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
              Các phân hệ: {nearTermDegradingModules.map((m) => `${m.moduleCode} (${m.projectedBreachDate})`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Bar (Standard 4-metric grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: System Score */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Điểm Toàn Vẹn Hệ Thống</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h4 className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {health?.snapshotComputed === false ? '---' : health ? `${health.systemScore}%` : '---'}
              </h4>
              {health && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    health.snapshotComputed === false
                      ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      : health.status === 'HEALTHY'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : health.status === 'DEGRADED'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {health.snapshotComputed === false ? 'CHƯA TÍNH' : health.status}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
              {health?.snapshotComputed === false ? 'Chưa có snapshot cho ngày này' : 'Chuẩn Green \u2265 90%'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Icons.ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Modules Active Today */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Phân Hệ Có Phát Sinh Hôm Nay</p>
            <div className="flex items-baseline gap-1 mt-1">
              <h4 className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {health?.modulesWithActivityToday ?? 0}
              </h4>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                / {health?.totalModulesInRegistry ?? 43}
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              42 Certified + 1 Registry
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Icons.Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Healthy / Warning Breakdown */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Phân Phối Sức Khỏe Phân Hệ</p>
            <div className="flex items-center gap-3 mt-1.5 font-mono text-sm font-bold tabular-nums">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                ● {health?.greenModules ?? 0}
                <span className="text-[10px] font-normal text-slate-500">Tốt</span>
              </span>
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                ● {health?.yellowModules ?? 0}
                <span className="text-[10px] font-normal text-slate-500">Cảnh báo</span>
              </span>
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                ● {health?.redModules ?? 0}
                <span className="text-[10px] font-normal text-slate-500">Lỗi</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Phát hiện suy thoái sớm
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Icons.PieChart className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Architecture Drift & Observability Mode */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cơ Chế Khử Nhạy Cảm (Masking)</p>
            <h4 className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
              Rule #02 Masking Engine
            </h4>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
              Read-Only Projection
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Icons.Lock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="relative w-full sm:w-72">
          <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo mã M01..M43 hoặc tên..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="ALL">Tất cả Khối Nghiệp Vụ</option>
            {uniqueGroups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="ALL">Tất cả Trạng Thái</option>
            <option value="ACTIVE">Có Hoạt Động Hôm Nay</option>
            <option value="ERROR">Cần Chú Ý / Có Lỗi</option>
            <option value="DRIFT">Chỉ Có Trong Danh Mục (Drift)</option>
          </select>
        </div>
      </div>

      {/* Module Topology Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-3 px-4 font-mono">Mã Module</th>
              <th className="py-3 px-4">Tên Phân Hệ &amp; Khối</th>
              <th className="py-3 px-4 text-center">Thao Tác (Audit/Event)</th>
              <th className="py-3 px-4 text-center">Lỗi Phát Sinh</th>
              <th className="py-3 px-4 text-center">Điểm Khả Dụng</th>
              <th className="py-3 px-4 text-center">Xu Hướng</th>
              <th className="py-3 px-4 text-center">Trạng Thái Sức Khỏe</th>
              <th className="py-3 px-4">Kiến Trúc &amp; Chứng Nhận</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
            {paginatedModules.map((m) => {
              const score = m.efficiencyScore;
              let scoreColor = 'text-slate-400 bg-slate-100 dark:bg-slate-700';
              let badgeText = 'Chưa có hoạt động';
              let badgeClass = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';

              if (score !== null && m.hasActivityToday) {
                if (score >= 90) {
                  scoreColor = 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60';
                  badgeText = 'Tốt (Healthy)';
                  badgeClass = 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700';
                } else if (score >= 70) {
                  scoreColor = 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60';
                  badgeText = 'Cảnh báo (Degraded)';
                  badgeClass = 'bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300 dark:border-amber-700';
                } else {
                  scoreColor = 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60';
                  badgeText = 'Suy giảm (Critical)';
                  badgeClass = 'bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 border-rose-300 dark:border-rose-700';
                }
              }

              const trend = trendsMap.get(m.moduleId);

              return (
                <tr
                  key={m.moduleId}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                        {m.moduleId}
                      </span>
                      <button
                        type="button"
                        onClick={() => fetchModuleTrendDetail(m.moduleId, m.moduleName)}
                        className={`p-1 rounded-md border transition-all cursor-pointer ${
                          selectedModuleTrend?.moduleCode === m.moduleId
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-slate-200 dark:border-slate-700'
                        }`}
                        title="Xem biểu đồ xu hướng 30 ngày (Sparkline)"
                      >
                        <Icons.TrendingUp className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {m.moduleName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {m.group}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                    {m.totalActions}
                  </td>

                  <td className="py-3 px-4 text-center font-mono font-bold tabular-nums">
                    <span
                      className={`px-2 py-0.5 rounded-md ${
                        m.errorCount > 0
                          ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {m.errorCount}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center font-mono font-bold tabular-nums">
                    <span className={`px-2 py-0.5 rounded-md ${scoreColor}`}>
                      {score !== null ? `${score}%` : '---'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {trend?.trendStatus === 'IMPROVING' ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400"
                        title={`Xu hướng cải thiện (+${Math.round(((trend.currentScore ?? 0) - (trend.baselineAvg ?? 0)) * 10) / 10} điểm so với TB ${trend.baselineAvg}%)`}
                      >
                        <Icons.TrendingUp className="w-3.5 h-3.5" />
                        <span>Tăng</span>
                      </span>
                    ) : trend?.trendStatus === 'DEGRADING' ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400"
                        title={`Xu hướng suy thoái (${Math.round(((trend.currentScore ?? 0) - (trend.baselineAvg ?? 0)) * 10) / 10} điểm so với TB ${trend.baselineAvg}%)`}
                      >
                        <Icons.TrendingDown className="w-3.5 h-3.5" />
                        <span>Giảm</span>
                      </span>
                    ) : trend?.trendStatus === 'STABLE' ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400"
                        title={`Ổn định (TB ${trend.baselineAvg}%)`}
                      >
                        <Icons.Minus className="w-3.5 h-3.5" />
                        <span>Ổn định</span>
                      </span>
                    ) : (
                      <span
                        className="text-slate-400 text-xs font-mono"
                        title={trend?.trendStatus === 'INSUFFICIENT_DATA' ? 'Cần tối thiểu 3 ngày dữ liệu để tính xu hướng (INSUFFICIENT_DATA)' : 'Chưa có dữ liệu snapshot (NO_DATA)'}
                      >
                        —
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {m.registryOnly ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[11px] font-semibold"
                        title="Phân hệ này có trong MODULE_REGISTRY frontend nhưng chưa nằm trong phạm vi 42 phân hệ chứng nhận MODULE_MAP.md"
                      >
                        <Icons.AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>⚠ Có trong danh mục nhưng chưa được chứng nhận trong MODULE_MAP.md</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <Icons.CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Certified Enterprise Subsystem</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {paginatedModules.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Không tìm thấy phân hệ nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredModules.length}
        onPageChange={(page) => setCurrentPage(page)}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 20, 50]}
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          PHASE 2: SPAN EXPLORER & ROOT CAUSE ANALYSIS (RULE-BASED) & REMEDIATION
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-5">
        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Icons.GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Span Explorer &amp; Phân Tích Nguyên Nhân Gốc (Rule-Based RCA)</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700">
                  Phase 2 Remediation
                </span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Khảo sát chi tiết luồng xử lý (Flow Spans), truy vết chuỗi theo correlationId và tái kích hoạt an toàn qua M05 EventBus.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchSpans(spansPage, spansPageSize)}
              disabled={spansLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-all cursor-pointer disabled:opacity-50"
            >
              <Icons.RefreshCw className={`w-3.5 h-3.5 ${spansLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới Spans</span>
            </button>
          </div>
        </div>

        {/* Module Trend Sparkline Card (Phase 3) */}
        {selectedModuleTrend && (
          <div className="p-4 sm:p-5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-slate-900/80 space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-indigo-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Icons.TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Lịch Sử Xu Hướng 30 Ngày (Sparkline):
                </span>
                <span className="text-xs font-mono font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-indigo-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300">
                  {selectedModuleTrend.moduleCode} — {selectedModuleTrend.moduleName}
                </span>
                {selectedModuleTrend.points.length < 3 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Đang tích luỹ dữ liệu ({selectedModuleTrend.points.length}/3 ngày tối thiểu)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedModuleTrend(null)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
                title="Đóng biểu đồ xu hướng"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            {trendDetailLoading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
                <Icons.Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Đang tải chuỗi dữ liệu xu hướng...</span>
              </div>
            ) : selectedModuleTrend.points.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Chưa có dữ liệu snapshot nào được ghi nhận cho phân hệ này trong 30 ngày qua.
              </div>
            ) : (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedModuleTrend.points} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="snapshotDate"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '11px',
                        padding: '8px 12px',
                      }}
                      formatter={(val: any) => [`${val}%`, 'Điểm Khả Dụng']}
                      labelFormatter={(label: any) => `Ngày: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="efficiencyScore"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#6366f1', strokeWidth: 1, stroke: '#ffffff' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Forecast Statistical Note (Phase 5) */}
            <div className="pt-2.5 border-t border-indigo-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Icons.LineChart className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  {selectedModuleTrend.forecast?.forecastStatus === 'INSUFFICIENT_DATA' ? (
                    <>
                      Chưa đủ dữ liệu để dự báo (cần tối thiểu 3 ngày, hiện có{' '}
                      <strong className="font-mono">{selectedModuleTrend.forecast.dataPointsUsed}</strong> ngày)
                    </>
                  ) : selectedModuleTrend.forecast?.forecastStatus === 'NO_DATA' ? (
                    'Chưa có dữ liệu snapshot nào trong 30 ngày qua để tính toán dự báo.'
                  ) : selectedModuleTrend.forecast?.forecastStatus === 'DEGRADING_TREND' ? (
                    <>
                      Tốc độ biến thiên: <strong className="font-mono text-amber-600 dark:text-amber-400">{selectedModuleTrend.forecast.ratePerDay} điểm/ngày</strong>.
                      {selectedModuleTrend.forecast.projectedBreachDate ? (
                        <> Dự kiến chạm ngưỡng cảnh báo (70%) vào ngày <strong className="font-mono text-amber-700 dark:text-amber-300">{selectedModuleTrend.forecast.projectedBreachDate}</strong> nếu xu hướng tiếp diễn.</>
                      ) : (
                        ' Chưa có nguy cơ chạm ngưỡng cảnh báo trong 365 ngày.'
                      )}
                    </>
                  ) : selectedModuleTrend.forecast?.forecastStatus === 'STABLE_OR_IMPROVING' ? (
                    <>
                      Tốc độ biến thiên: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{selectedModuleTrend.forecast.ratePerDay != null && selectedModuleTrend.forecast.ratePerDay > 0 ? `+${selectedModuleTrend.forecast.ratePerDay}` : selectedModuleTrend.forecast.ratePerDay ?? 0} điểm/ngày</strong> (Ổn định/cải thiện).
                    </>
                  ) : (
                    'Đang tính toán dự báo thống kê...'
                  )}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                Hồi quy tuyến tính OLS • Không dùng AI/ML
              </span>
            </div>
          </div>
        )}

        {/* RCA Expanded Panel (if selected) */}
        {selectedCorrelationId && (
          <div className="p-4 sm:p-5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-slate-900/80 space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-indigo-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Icons.Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Phân Tích Nguyên Nhân Gốc Chuỗi:
                </span>
                <code className="text-xs font-mono font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-indigo-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300">
                  {selectedCorrelationId}
                </code>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCorrelationId(null);
                  setRcaChain(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
                title="Đóng bảng phân tích RCA"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            {rcaLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
                <Icons.Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span>Đang phân tích chuỗi spans theo thuật toán Rule-Based Heuristic...</span>
              </div>
            ) : rcaChain ? (
              <div className="space-y-4">
                {/* Root Cause Banner */}
                {rcaChain.rootCause ? (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200">
                        <Icons.AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
                        <span className="font-bold text-xs uppercase tracking-wide">
                          Phát Hiện Nguyên Nhân Gốc (Root Cause Span #{rcaChain.rootCause.id})
                        </span>
                      </div>
                      {rcaChain.rootCause.sourceType === 'EVENT' &&
                        rcaChain.rootCause.status === 'FAILED' &&
                        rcaChain.rootCause.sourceEventId && (
                          <button
                            type="button"
                            onClick={() => handleRetrySpan(rcaChain.rootCause!)}
                            disabled={remediatingId === rcaChain.rootCause.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Icons.RotateCw className={`w-3.5 h-3.5 ${remediatingId === rcaChain.rootCause.id ? 'animate-spin' : ''}`} />
                            <span>Khắc phục ngay: Thử lại qua M05</span>
                          </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Module: </span>
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{rcaChain.rootCause.moduleCode}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Hành động: </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{rcaChain.rootCause.actionName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Thời điểm lỗi: </span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          {new Date(rcaChain.rootCause.occurredAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    {rcaChain.rootCause.metadataMasked && rcaChain.rootCause.metadataMasked !== '{}' && (
                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-rose-200 dark:border-rose-900 font-mono text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto">
                        {rcaChain.rootCause.metadataMasked}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
                    <Icons.CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Toàn bộ {rcaChain.totalSpans} span trong chuỗi này đều hoàn thành thành công (không phát hiện lỗi ban đầu).</span>
                  </div>
                )}

                {/* Spans in Chain Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Thứ tự</th>
                        <th className="py-2.5 px-3">Nguồn / ID</th>
                        <th className="py-2.5 px-3">Module</th>
                        <th className="py-2.5 px-3">Hành động</th>
                        <th className="py-2.5 px-3 text-center">Trạng thái</th>
                        <th className="py-2.5 px-3">Thời điểm</th>
                        <th className="py-2.5 px-3 text-right">Đánh giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {rcaChain.spans.map((s, idx) => {
                        const isRootCause = rcaChain.rootCause?.id === s.id;
                        return (
                          <tr
                            key={s.id}
                            className={`transition-colors ${
                              isRootCause
                                ? 'bg-rose-50/80 dark:bg-rose-950/30 font-semibold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono text-slate-400">
                              #{idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  s.sourceType === 'EVENT'
                                    ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                }`}
                              >
                                {s.sourceType}
                              </span>{' '}
                              <span className="text-slate-500">#{s.id}</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                              {s.moduleCode}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                              {s.actionName}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  s.status === 'SUCCESS'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : s.status === 'FAILED'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {s.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {new Date(s.occurredAt).toLocaleTimeString('vi-VN')}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {isRootCause && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80">
                                  ● Root Cause
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Spans Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 flex-wrap">
            <input
              type="text"
              value={spanCorrelationFilter}
              onChange={(e) => setSpanCorrelationFilter(e.target.value)}
              placeholder="Lọc correlationId..."
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-full sm:w-48 font-mono"
            />
            <input
              type="text"
              value={spanModuleFilter}
              onChange={(e) => setSpanModuleFilter(e.target.value)}
              placeholder="Lọc module (M01..M43)..."
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-full sm:w-40 font-mono"
            />
            <select
              value={spanStatusFilter}
              onChange={(e) => setSpanStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">Tất cả Trạng thái Span</option>
              <option value="SUCCESS">Thành công (SUCCESS)</option>
              <option value="FAILED">Thất bại (FAILED)</option>
              <option value="PENDING">Chờ xử lý (PENDING)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setSpansPage(1);
                fetchSpans(1, spansPageSize);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-all"
            >
              Áp dụng lọc
            </button>
            {(spanCorrelationFilter || spanModuleFilter || spanStatusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSpanCorrelationFilter('');
                  setSpanModuleFilter('');
                  setSpanStatusFilter('');
                  setSpansPage(1);
                  fetchSpans(1, spansPageSize);
                }}
                className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* Spans Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 font-mono">Nguồn / ID</th>
                <th className="py-3 px-4 font-mono">Module</th>
                <th className="py-3 px-4">Hành Động Nghiệp Vụ</th>
                <th className="py-3 px-4">Correlation ID (RCA)</th>
                <th className="py-3 px-4">Thời Điểm</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-center">Khắc Phục (M05)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {spans.map((s) => {
                const canRemediate = s.sourceType === 'EVENT' && s.status === 'FAILED' && !!s.sourceEventId;
                const isSelected = selectedCorrelationId === s.correlationId;

                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors ${
                      isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          s.sourceType === 'EVENT'
                            ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        {s.sourceType}
                      </span>{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">#{s.id}</span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                        {s.moduleCode}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {s.actionName}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {s.correlationId ? (
                        <button
                          type="button"
                          onClick={() => fetchRcaChain(s.correlationId!)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold transition-all cursor-pointer"
                          title="Click để xem phân tích nguyên nhân gốc chuỗi này"
                        >
                          <Icons.GitBranch className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span>{s.correlationId.length > 20 ? s.correlationId.slice(0, 18) + '...' : s.correlationId}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(s.occurredAt).toLocaleString('vi-VN')}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : s.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {canRemediate ? (
                        <button
                          type="button"
                          onClick={() => handleRetrySpan(s)}
                          disabled={remediatingId === s.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                          title="Thử lại sự kiện lỗi này qua M05 EventBus"
                        >
                          <Icons.RotateCw className={`w-3 h-3 ${remediatingId === s.id ? 'animate-spin' : ''}`} />
                          <span>Thử lại</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-mono">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {spans.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {spansLoading ? 'Đang nạp dữ liệu spans...' : 'Không có span nào phù hợp với bộ lọc.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Spans Pagination */}
        <Pagination
          currentPage={spansPage}
          totalPages={Math.ceil(spansTotal / spansPageSize) || 1}
          pageSize={spansPageSize}
          totalItems={spansTotal}
          onPageChange={(p) => {
            setSpansPage(p);
            fetchSpans(p, spansPageSize);
          }}
          onPageSizeChange={(s) => {
            setSpansPageSize(s);
            setSpansPage(1);
            fetchSpans(1, s);
          }}
          pageSizeOptions={[10, 20, 50]}
        />
      </div>
    </div>
  );
};
