import React from 'react';
import { Target, Award, Layers, CheckCircle2, Calendar, FileText, ArrowRight } from 'lucide-react';
import { ProjectMaster } from '../../../../types/m35Types';

interface ProjectPlanningTabProps {
  currentProject: ProjectMaster;
}

export const ProjectPlanningTab: React.FC<ProjectPlanningTabProps> = ({ currentProject }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-5">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            02. Project Charter, Scope &amp; Baseline Objectives
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dự án: <strong className="text-slate-700 dark:text-slate-300">{currentProject?.code}</strong> — {currentProject?.name}
          </p>
        </div>
        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold text-xs rounded-full border border-blue-200 dark:border-blue-800 font-mono">
          Số HĐ: {currentProject?.contractNumber}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wider">
            <Award className="w-4 h-4 text-amber-500" />
            Mục Tiêu Chiến Lược (Project Objectives)
          </h4>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {currentProject?.charterObjective || 'Xác lập chuẩn mực quản lý dự án, nâng cao hiệu suất lao động và kiểm soát tài chính tự động.'}
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Tóm Tắt Phạm Vi (Project Scope Summary)
          </h4>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {currentProject?.scopeSummary || 'Triển khai đầy đủ phân hệ quản lý WBS 4 cấp, tính toán chi phí Job Costing và chỉ số EVM.'}
          </p>
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
        <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
          Các Mốc Nghiệm Thu Quan Trọng (Project Baseline Milestones)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 block">MILESTONE M1</span>
            <span className="font-bold text-slate-900 dark:text-white text-xs block">Phê Duyệt Blueprint &amp; Charter</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã Phê Duyệt (15/03/2026)
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 block">MILESTONE M2</span>
            <span className="font-bold text-slate-900 dark:text-white text-xs block">Hoàn Thành Lập Trình Core</span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold block">
              ⏳ Đang Thi Công (Target 31/07)
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 block">MILESTONE M3</span>
            <span className="font-bold text-slate-900 dark:text-white text-xs block">Nghiệm Thu UAT &amp; Go-Live</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              Chờ nghiệm thu (Target 30/10)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
