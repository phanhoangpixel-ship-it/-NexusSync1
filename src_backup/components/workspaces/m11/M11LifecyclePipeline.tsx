import React from 'react';
import { UserCheck, Sliders, Activity, Award, Star, FileText } from 'lucide-react';

interface M11LifecyclePipelineProps {
  activeTab: 'scorecards' | 'performance' | 'contracts' | 'audits' | 'analytics';
  onSelectTab: (tab: 'scorecards' | 'performance' | 'contracts' | 'audits' | 'analytics') => void;
  scorecardsCount: number;
  suppliersCount: number;
  contractsCount: number;
  auditsCount: number;
}

export const M11LifecyclePipeline: React.FC<M11LifecyclePipelineProps> = ({
  activeTab,
  onSelectTab,
  scorecardsCount,
  suppliersCount,
  contractsCount,
  auditsCount,
}) => {
  const steps = [
    {
      id: 'scorecards' as const,
      step: '1',
      title: 'Thẻ Điểm Scorecards',
      desc: 'Điểm tổng hợp Composite Score & phân cấp đối tác Tier 1-4',
      tag: `${scorecardsCount} Thẻ điểm`,
      icon: <Award className="w-3.5 h-3.5" />,
    },
    {
      id: 'performance' as const,
      step: '2',
      title: 'Chỉ Số OTIF & KPIs',
      desc: 'Trọng số giao hàng đúng hạn, chất lượng GR & tuân thủ SLA',
      tag: 'Chuẩn SLA',
      icon: <Sliders className="w-3.5 h-3.5" />,
    },
    {
      id: 'contracts' as const,
      step: '3',
      title: 'Hợp Đồng Khung & BPA',
      desc: 'Thỏa thuận khung, khóa giá trần & cảnh báo tự động gia hạn',
      tag: `${contractsCount} Hợp đồng`,
      icon: <FileText className="w-3.5 h-3.5" />,
    },
    {
      id: 'audits' as const,
      step: '4',
      title: 'Kiểm Toán Xưởng & ESG',
      desc: 'Thanh tra thực địa, tiêu chuẩn môi trường & chứng chỉ ISO',
      tag: `${auditsCount} Đợt Audit`,
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    {
      id: 'analytics' as const,
      step: '5',
      title: 'Phân Tích Hiệu Suất',
      desc: 'Báo cáo xu hướng, ma trận tương quan & phân hạng đối tác',
      tag: `${suppliersCount} Đối tác`,
      icon: <Star className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            Tiến Trình Đánh Giá SRM Toàn Diện (Supplier Lifecycle Performance Framework)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono font-bold">
            Standard M11 Flow
          </span>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
          Quy trình 5 bước khép kín Thẻ điểm → SLA/KPIs → Hợp đồng Khung → Kiểm toán → Phân tích
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {steps.map((s, idx) => {
          const isCurrent = activeTab === s.id;
          return (
            <button
              key={`${s.step}-${idx}`}
              type="button"
              onClick={() => onSelectTab(s.id)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isCurrent
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-slate-100/70 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 w-full">
                <span className={`text-[10px] font-mono tabular-nums font-bold flex items-center gap-1 ${
                  isCurrent ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {s.icon}
                  <span>BƯỚC {s.step}</span>
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  isCurrent
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}>
                  {s.tag}
                </span>
              </div>
              <div>
                <h4 className={`text-xs font-bold leading-tight ${
                  isCurrent ? 'text-indigo-950 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'
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

