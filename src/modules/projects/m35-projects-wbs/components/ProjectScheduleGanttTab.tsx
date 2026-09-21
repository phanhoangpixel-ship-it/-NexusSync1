import React from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { WbsNode } from '../../../../types/m35Types';

interface ProjectScheduleGanttTabProps {
  wbsNodes: WbsNode[];
}

export const ProjectScheduleGanttTab: React.FC<ProjectScheduleGanttTabProps> = ({ wbsNodes }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            05. Tiến Độ Thực Hiện &amp; Đường Găng Dự Án (Schedule &amp; Critical Path)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Trực quan hóa lộ trình tiến độ, mốc hoàn thành và cảnh báo các hạng mục có nguy cơ trễ hạn.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {wbsNodes.map((node) => (
          <div
            key={node.id}
            className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
          >
            <div className="min-w-[240px]">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">[{node.code}]</span>
                <span className="font-bold text-slate-900 dark:text-white">{node.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Phụ trách: <strong>{node.assignee || 'Chưa gán'}</strong></span>
                {node.isCriticalPath && (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">• Đường găng (Critical Path)</span>
                )}
              </div>
            </div>

            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-500 dark:text-slate-400">Tiến độ:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{node.progressPct}%</span>
              </div>
              <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    node.progressPct === 100
                      ? 'bg-emerald-500'
                      : node.isCriticalPath
                      ? 'bg-rose-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${node.progressPct}%` }}
                />
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                node.status === 'COMPLETED'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                  : node.status === 'IN_PROGRESS'
                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
              }`}>
                {node.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
