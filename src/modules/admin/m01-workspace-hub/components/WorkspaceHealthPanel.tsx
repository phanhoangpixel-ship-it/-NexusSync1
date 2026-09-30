import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { ModuleDefinition, MODULE_REGISTRY } from '../../../../config/moduleRegistry';
import { ObservabilityHealthData, ModuleTopologyItem, ModuleTrendDetail, m01WorkspaceApi } from '../services/m01WorkspaceApi';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export type HealthFilter = 'ALL' | 'HEALTHY' | 'WARNING' | 'ERROR' | 'NO_DATA';

interface WorkspaceHealthPanelProps {
  healthData: ObservabilityHealthData | null;
  topologyModules: ModuleTopologyItem[];
  onSelectModuleNode: (moduleId: string) => void;
  onSwitchToObservabilityTab: () => void;
}

export const WorkspaceHealthPanel: React.FC<WorkspaceHealthPanelProps> = ({
  healthData,
  topologyModules,
  onSelectModuleNode,
  onSwitchToObservabilityTab,
}) => {
  const [filter, setFilter] = useState<HealthFilter>('ALL');
  const [search, setSearch] = useState<string>('');
  const [selectedModuleCode, setSelectedModuleCode] = useState<string>('M17');
  const [trendDetail, setTrendDetail] = useState<ModuleTrendDetail | null>(null);
  const [loadingTrend, setLoadingTrend] = useState<boolean>(false);

  // Load trend for selected module
  useEffect(() => {
    let isCancelled = false;
    const loadTrend = async () => {
      setLoadingTrend(true);
      try {
        const data = await m01WorkspaceApi.getModuleTrendDetail(selectedModuleCode, 30);
        if (!isCancelled) {
          setTrendDetail(data);
        }
      } catch (err) {
        console.error('Error loading module trend sparkline:', err);
        if (!isCancelled) setTrendDetail(null);
      } finally {
        if (!isCancelled) setLoadingTrend(false);
      }
    };

    loadTrend();
    return () => {
      isCancelled = true;
    };
  }, [selectedModuleCode]);

  // Merge registry with topology
  const moduleHealthList = useMemo(() => {
    const topoMap = new Map<string, ModuleTopologyItem>();
    topologyModules.forEach(m => topoMap.set(m.moduleId, m));

    return MODULE_REGISTRY.map((mod) => {
      const topo = topoMap.get(mod.moduleId);
      const score = topo?.efficiencyScore ?? null;
      const errorCount = topo?.errorCount ?? 0;
      const totalActions = topo?.totalActions ?? 0;

      let status: 'HEALTHY' | 'WARNING' | 'ERROR' | 'NO_DATA' = 'HEALTHY';
      if (!topo || (score === null && totalActions === 0)) {
        status = 'NO_DATA';
      } else if (errorCount > 0 || (score !== null && score < 70)) {
        status = 'ERROR';
      } else if (score !== null && score < 90) {
        status = 'WARNING';
      }

      return {
        moduleId: mod.moduleId,
        moduleName: mod.moduleName,
        category: mod.category,
        route: mod.route,
        status,
        score,
        errorCount,
        totalActions,
      };
    });
  }, [topologyModules]);

  // Filtered list
  const filteredModules = useMemo(() => {
    return moduleHealthList.filter((m) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchId = m.moduleId.toLowerCase().includes(q);
        const matchName = m.moduleName.toLowerCase().includes(q);
        if (!matchId && !matchName) return false;
      }

      if (filter === 'HEALTHY') return m.status === 'HEALTHY';
      if (filter === 'WARNING') return m.status === 'WARNING';
      if (filter === 'ERROR') return m.status === 'ERROR';
      if (filter === 'NO_DATA') return m.status === 'NO_DATA';

      return true;
    });
  }, [moduleHealthList, search, filter]);

  const systemScore = healthData?.systemScore ?? null;
  const snapshotComputed = healthData?.snapshotComputed !== false;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-2xs flex flex-col h-full min-h-[580px] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Icons.Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Sức Khỏe Phân Hệ
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Trạng thái &amp; xu hướng 43 phân hệ
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSwitchToObservabilityTab}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          title="Chuyển sang Tab 2 Observability"
        >
          <span>NexusFlow</span>
          <Icons.ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* System Score Meter (Rule: labeled 'System Score') */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            System Score
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h3 className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {snapshotComputed && systemScore !== null ? `${systemScore}%` : '---'}
            </h3>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {healthData?.status || 'HEALTHY'}
            </span>
          </div>
          <p className="text-[9.5px] text-slate-400 mt-0.5 leading-tight">
            Trung bình cộng đều theo module • Chuẩn Green &ge; 90%
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Icons.ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* 30-Day Trend Sparkline for Selected Module */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Icons.TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
              {selectedModuleCode} — 30-Day Trend
            </span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {trendDetail?.trendStatus || 'STABLE'}
          </span>
        </div>

        {/* Recharts Sparkline */}
        <div className="h-16 w-full">
          {loadingTrend ? (
            <div className="h-full flex items-center justify-center text-[10px] text-slate-400">
              <Icons.Loader2 className="w-3.5 h-3.5 animate-spin mr-1 text-blue-500" />
              <span>Đang tải chuỗi dữ liệu...</span>
            </div>
          ) : trendDetail?.dataPoints && trendDetail.dataPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendDetail.dataPoints} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                <YAxis domain={[50, 100]} hide />
                <XAxis dataKey="snapshotDate" hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '10px',
                    color: '#f8fafc',
                    fontFamily: 'monospace'
                  }}
                  formatter={(val: any) => [`${val}%`, 'Điểm hiệu năng']}
                  labelFormatter={(lbl: any) => `Ngày: ${lbl}`}
                />
                <Line
                  type="monotone"
                  dataKey="efficiencyScore"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: '#60a5fa' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[10px] text-slate-400 font-mono">
              Chưa đủ điểm dữ liệu 30 ngày (INSUFFICIENT_DATA)
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {(['ALL', 'HEALTHY', 'WARNING', 'ERROR'] as HealthFilter[]).map((f) => {
            const labels: Record<HealthFilter, string> = {
              ALL: 'Tất cả',
              HEALTHY: 'Chuẩn',
              WARNING: 'Cảnh báo',
              ERROR: 'Lỗi',
              NO_DATA: 'Trống',
            };
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2 py-1 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${
                  filter === f
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Icons.Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã phân hệ (M08, M17...)"
            className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Modules List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 max-h-[220px]">
        {filteredModules.map((m) => {
          const isSelected = selectedModuleCode === m.moduleId;
          const isErr = m.status === 'ERROR';
          const isWarn = m.status === 'WARNING';
          const isOk = m.status === 'HEALTHY';

          const statusBg = isErr
            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
            : isWarn
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
            : isOk
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';

          return (
            <div
              key={m.moduleId}
              onClick={() => {
                setSelectedModuleCode(m.moduleId);
                onSelectModuleNode(m.moduleId);
              }}
              className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                  {m.moduleId}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[130px]">
                  {m.moduleName}
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                {m.score !== null ? (
                  <span className="font-bold tabular-nums">{m.score}%</span>
                ) : (
                  <span className="text-slate-400">---</span>
                )}
                <span className={`px-1.5 py-0.2 rounded-full font-bold ${statusBg}`}>
                  {m.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SLA Coverage Note (Mandatory Section 18) */}
      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
        <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
          <Icons.Info className="w-3 h-3 text-amber-500" />
          <span>SLA Data Coverage Limited</span>
        </p>
        <p className="leading-tight">
          Chính sách giám sát SLA dựa trên hàng chờ tác vụ nội bộ. Dữ liệu span và vi phạm được cập nhật chu kỳ 15s qua Observability Projector.
        </p>
      </div>

      {/* Bottom CTA to Tab 2 */}
      <button
        type="button"
        onClick={onSwitchToObservabilityTab}
        className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs mt-auto"
      >
        <Icons.Activity className="w-4 h-4" />
        <span>Khám Phá Spans &amp; RCA (Tab 2)</span>
      </button>
    </div>
  );
};
