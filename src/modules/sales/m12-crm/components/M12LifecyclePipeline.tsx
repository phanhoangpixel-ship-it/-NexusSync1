import React from 'react';
import { UserCheck, Target, FileText, Activity, BarChart3, Layers } from 'lucide-react';

interface M12LifecyclePipelineProps {
  activeTab: 'leads' | 'pipeline' | 'quotations' | 'activities' | 'analytics';
  onSelectTab: (tab: 'leads' | 'pipeline' | 'quotations' | 'activities' | 'analytics') => void;
  leadsCount: number;
  oppsCount: number;
  quotationsCount: number;
  activitiesCount: number;
}

export const M12LifecyclePipeline: React.FC<M12LifecyclePipelineProps> = ({
  activeTab,
  onSelectTab,
  leadsCount,
  oppsCount,
  quotationsCount,
  activitiesCount,
}) => {
  const steps = [
    {
      id: 'leads' as const,
      step: '1',
      title: 'Tiếp Nhận & Hồ Sơ Leads',
      desc: 'Sàng lọc đầu mối, phân loại nguồn & chuyển đổi Khách hàng M03',
      tag: `${leadsCount} Đầu mối`,
      icon: <UserCheck className="w-3.5 h-3.5" />,
    },
    {
      id: 'pipeline' as const,
      step: '2',
      title: 'Phễu Cơ Hội & Deals',
      desc: 'Kanban 5 giai đoạn: New → Qualified → Proposal → Negotiation → Won',
      tag: `${oppsCount} Deals`,
      icon: <Target className="w-3.5 h-3.5" />,
    },
    {
      id: 'quotations' as const,
      step: '3',
      title: 'Báo Giá Thương Mại (BPA)',
      desc: 'Báo giá vật tư, khóa giá trần, thuế VAT & chuyển đổi sang SO (M13)',
      tag: `${quotationsCount} Báo giá`,
      icon: <FileText className="w-3.5 h-3.5" />,
    },
    {
      id: 'activities' as const,
      step: '4',
      title: 'Nhật Ký Chăm Sóc Khách Hàng',
      desc: 'Dòng thời gian tương tác: Cuộc gọi, Email chào hàng, Họp Demo & Khảo sát',
      tag: `${activitiesCount} Tương tác`,
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    {
      id: 'analytics' as const,
      step: '5',
      title: 'Phân Tích & Dự Báo Doanh Thu',
      desc: 'Tỷ lệ thắng (Win Rate), giá trị dự kiến (Expected Revenue) & năng suất Sales',
      tag: 'Báo cáo',
      icon: <BarChart3 className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Tiến Trình Chuyển Đổi Khách Hàng CRM (CRM Lifecycle Stages)
          </span>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
          Quy trình 5 bước: Leads → Phễu Deals → Báo Giá → Nhật Ký → Dự Báo
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {steps.map((s, idx) => {
          const isCurrent = activeTab === s.id;
          return (
            <button
              key={`${s.step}-${idx}`}
              type="button"
              onClick={() => onSelectTab(s.id)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isCurrent
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-slate-100/70 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 w-full">
                <span className={`text-[10px] font-mono tabular-nums font-bold flex items-center gap-1 ${
                  isCurrent ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {s.icon}
                  <span>BƯỚC {s.step}</span>
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  isCurrent
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}>
                  {s.tag}
                </span>
              </div>
              <div>
                <h4 className={`text-xs font-bold ${
                  isCurrent ? 'text-emerald-950 dark:text-emerald-100' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {s.title}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {s.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
