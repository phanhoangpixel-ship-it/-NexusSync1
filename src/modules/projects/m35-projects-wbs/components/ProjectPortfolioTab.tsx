import React from 'react';
import { Briefcase, Layers, ArrowRight, ShieldCheck, CheckCircle2, TrendingUp, DollarSign, PieChart, Users, Building2 } from 'lucide-react';
import { ProjectMaster, ProjectStatus } from '../../../../types/m35Types';

interface ProjectPortfolioTabProps {
  projects: ProjectMaster[];
  currentProject: ProjectMaster;
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onUpdateStatus: (status: ProjectStatus) => void;
  filteredProjects: ProjectMaster[];
  progressPct: number;
}

export const ProjectPortfolioTab: React.FC<ProjectPortfolioTabProps> = ({
  projects,
  currentProject,
  selectedProjectId,
  onSelectProject,
  onUpdateStatus,
  filteredProjects,
  progressPct,
}) => {
  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'APPROVED':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'COMPLETED':
        return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
      case 'ON_HOLD':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'CLOSED':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      default:
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Project Detail Card */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                01. PROJECT PORTFOLIO & STATUS LIFECYCLE
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadge(currentProject?.status || 'PLANNED')}`}>
                {currentProject?.status}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              {currentProject?.code} — {currentProject?.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{currentProject?.description || 'Dự án chiến lược doanh nghiệp NexusSync'}</p>
          </div>

          {/* Status Change Lifecycle Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Chuyển trạng thái:</span>
            {(['DRAFT', 'PLANNED', 'APPROVED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED'] as ProjectStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => onUpdateStatus(st)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-xl border transition cursor-pointer active:scale-95 ${
                  currentProject?.status === st
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Khách Hàng / Đối Tác:</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm block truncate">{currentProject?.client}</span>
            <span className="text-[11px] text-slate-400 block pt-1 font-mono">Số HĐ: {currentProject?.contractNumber}</span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Khối Nghiệp Vụ / BU:</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm block truncate">{currentProject?.businessUnit}</span>
            <span className="text-[11px] text-slate-400 block pt-1">PM: {currentProject?.manager}</span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Thời Gian Thực Hiện:</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm block font-mono">
              {currentProject?.startDate} &rarr; {currentProject?.endDate}
            </span>
            <span className="text-[11px] text-slate-400 block pt-1">Chi nhánh: {currentProject?.branch}</span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Phân Loại & Rủi Ro:</span>
            <span className="font-bold text-blue-700 dark:text-blue-400 text-sm block">{currentProject?.category}</span>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block pt-1">
              RỦI RO: MỨC {currentProject?.riskLevel}
            </span>
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">Tiến Độ Thi Công Tổng Thể Dự Án:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{progressPct}% Hoàn Thành</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Portfolio Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-3">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Danh Sách Portfolio Dự Án Tập Đoàn ({filteredProjects.length})
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">Mã Dự Án</th>
                <th className="py-2.5 px-3">Tên Dự Án</th>
                <th className="py-2.5 px-3">Khách Hàng</th>
                <th className="py-2.5 px-3">PM Phụ Trách</th>
                <th className="py-2.5 px-3 text-right">Giá Trị HĐ (VND)</th>
                <th className="py-2.5 px-3 text-right">Ngân Sách (BAC)</th>
                <th className="py-2.5 px-3 text-center">Tiến Độ</th>
                <th className="py-2.5 px-3 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredProjects.map((prj) => (
                <tr
                  key={prj.id}
                  onClick={() => onSelectProject(prj.id)}
                  className={`hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition cursor-pointer ${
                    selectedProjectId === prj.id
                      ? 'bg-blue-50/70 dark:bg-blue-950/50 font-semibold'
                      : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{prj.code}</td>
                  <td className="py-2.5 px-3 text-slate-900 dark:text-white font-medium">{prj.name}</td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{prj.client}</td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{prj.manager}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900 dark:text-white font-bold">
                    {prj.contractValueVND.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-600 dark:text-blue-400 font-bold">
                    {prj.budgetVND.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-14 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${prj.progressPct}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300">{prj.progressPct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadge(prj.status)}`}>
                      {prj.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
