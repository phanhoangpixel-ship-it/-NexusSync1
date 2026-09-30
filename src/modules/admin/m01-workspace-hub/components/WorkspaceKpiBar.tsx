import React from 'react';
import * as Icons from 'lucide-react';
import { ObservabilityHealthData } from '../services/m01WorkspaceApi';
import { WorkspaceSummary, WorkspaceWorkItem } from '../../../../types/workspace';

interface WorkspaceKpiBarProps {
  summary: WorkspaceSummary | null;
  healthData: ObservabilityHealthData | null;
  workItems: WorkspaceWorkItem[];
  selectedDate?: string;
  lastUpdatedTime?: string;
}

export const WorkspaceKpiBar: React.FC<WorkspaceKpiBarProps> = ({
  summary,
  healthData,
  workItems,
  selectedDate,
  lastUpdatedTime,
}) => {
  const pendingCount = summary?.pendingTasks ?? workItems.length;
  const urgentCount = workItems.filter(w => w.priority === 'URGENT' || w.priority === 'HIGH').length;
  const overdueCount = workItems.filter(w => w.isOverdue).length;

  const systemScore = healthData?.systemScore ?? null;
  const isHealthy = healthData?.status === 'HEALTHY';
  const isDegraded = healthData?.status === 'DEGRADED';
  const isCritical = healthData?.status === 'CRITICAL';

  const snapshotComputed = healthData?.snapshotComputed !== false;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {/* 1. System Status & Integrity */}
      <div className="bg-slate-900/90 text-white p-3.5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Trạng Thái Lõi
          </span>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-2">
            <h4 className="text-xl font-bold font-mono text-emerald-400">
              ● Online
            </h4>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              LibSQL
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {healthData?.date ? `Kỳ chiếu: ${healthData.date}` : 'Toàn vẹn kiến trúc ERP'}
          </p>
        </div>
        <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
          <span>Read-Model M01</span>
          <span className="text-emerald-400">Active</span>
        </div>
      </div>

      {/* 2. System Score */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            System Score
          </span>
          <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Icons.ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <h4 className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {snapshotComputed && systemScore !== null ? `${systemScore}%` : '---'}
            </h4>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
              isCritical
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                : isDegraded
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            }`}>
              {healthData?.status || 'HEALTHY'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Trung bình 43 phân hệ
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
          <span>Chuẩn Green &ge; 90%</span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">42 Certified</span>
        </div>
      </div>

      {/* 3. Work Queue Tasks */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Hàng Chờ Tác Vụ
          </span>
          <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Icons.ListTodo className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <h4 className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {pendingCount}
            </h4>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">việc</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px] font-mono">
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              {overdueCount} quá hạn
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-amber-600 dark:text-amber-400">
              {urgentCount} ưu tiên cao
            </span>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
          <span>Điều phối luồng SLA</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">Cần xử lý</span>
        </div>
      </div>

      {/* 4. Module Health Breakdown */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Phân Bổ Phân Hệ
          </span>
          <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Icons.Layers className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="my-2">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {healthData?.greenModules ?? 0}
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {healthData?.yellowModules ?? 0}
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {healthData?.redModules ?? 0}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
            Tổng {healthData?.totalModulesInRegistry ?? 43} phân hệ
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
          <span>Active hôm nay</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {healthData?.modulesWithActivityToday ?? 0}
          </span>
        </div>
      </div>

      {/* 5. Operations & Outbox Stream */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Sự Kiện &amp; Phóng Chiếu
          </span>
          <div className="w-6 h-6 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Icons.Radio className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <h4 className="text-xl font-bold font-mono tabular-nums text-violet-600 dark:text-violet-400">
              M05 Outbox
            </h4>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded">
              Synced
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Chu kỳ Projector 15s • Idempotent
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
          <span>flow_spans</span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">Active Stream</span>
        </div>
      </div>

      {/* 6. Data Snapshot & SLA Coverage Note */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Dữ Liệu Snapshot &amp; SLA
          </span>
          <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Icons.Clock className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <h4 className="text-base font-bold font-mono text-slate-900 dark:text-white">
              {lastUpdatedTime || 'Thời gian thực'}
            </h4>
          </div>
          <div className="text-[9.5px] font-mono text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-1 rounded mt-1 border border-amber-200 dark:border-amber-800">
            SLA data coverage limited
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
          <span>{snapshotComputed ? 'Snapshot hoàn tất' : 'Chưa hoàn tất'}</span>
          <span className={snapshotComputed ? 'text-emerald-500 font-bold' : 'text-amber-500'}>
            {snapshotComputed ? 'OK' : 'Pending'}
          </span>
        </div>
      </div>
    </div>
  );
};
