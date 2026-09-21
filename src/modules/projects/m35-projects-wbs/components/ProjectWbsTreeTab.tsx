import React from 'react';
import { GitFork, Plus, Edit2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { WbsNode } from '../../../../types/m35Types';

interface ProjectWbsTreeTabProps {
  wbsNodes: WbsNode[];
  onOpenEditModal: (node: WbsNode) => void;
  onOpenCreateModal: () => void;
}

export const ProjectWbsTreeTab: React.FC<ProjectWbsTreeTabProps> = ({
  wbsNodes,
  onOpenEditModal,
  onOpenCreateModal,
}) => {
  const getLevelBadge = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 2:
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 3:
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'BLOCKED':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GitFork className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            03. Cấu Trúc Phân Chia Công Việc 4 Cấp (Work Breakdown Structure - WBS)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Phân rã phạm vi dự án từ Cấp 1 (Giai đoạn) đến Cấp 4 (Công việc thi công), gán ngân sách và theo dõi tiến độ.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Thêm Hạng Mục WBS
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 px-3">Mã WBS</th>
              <th className="py-2.5 px-3">Tên Giai Đoạn / Hạng Mục WBS</th>
              <th className="py-2.5 px-3 text-center">Cấp Độ</th>
              <th className="py-2.5 px-3">Phụ Trách</th>
              <th className="py-2.5 px-3 text-right">Kế Hoạch (PV)</th>
              <th className="py-2.5 px-3 text-right">Thực Tế (AC)</th>
              <th className="py-2.5 px-3 text-center">Tiến Độ</th>
              <th className="py-2.5 px-3 text-center">Trạng Thái</th>
              <th className="py-2.5 px-3 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {wbsNodes.map((node) => (
              <tr
                key={node.id}
                className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition"
              >
                <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                  <span
                    style={{
                      paddingLeft: `${(node.level - 1) * 16}px`,
                    }}
                    className="inline-block"
                  >
                    {node.code}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-900 dark:text-white font-medium">
                  <div className="flex items-center gap-2">
                    <span className={node.level === 1 ? 'font-bold text-slate-900 dark:text-white' : ''}>
                      {node.name}
                    </span>
                    {node.isCriticalPath && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 rounded-md border border-rose-300 dark:border-rose-800">
                        CRITICAL
                      </span>
                    )}
                    {node.isMilestone && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-md border border-amber-300 dark:border-amber-800">
                        MILESTONE
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getLevelBadge(node.level)}`}>
                    L{node.level}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{node.assignee || '—'}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                  {node.plannedCostVND?.toLocaleString('vi-VN')}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                  {node.actualCostVND?.toLocaleString('vi-VN')}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-12 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${node.progressPct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${node.progressPct}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300">{node.progressPct}%</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadge(node.status)}`}>
                    {node.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => onOpenEditModal(node)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer"
                    title="Chỉnh sửa WBS"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
