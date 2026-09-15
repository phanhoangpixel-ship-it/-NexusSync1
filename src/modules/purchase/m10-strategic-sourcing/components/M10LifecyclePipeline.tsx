import React from 'react';
import { FileText, ShieldCheck, Award, Scale, CheckCircle2 } from 'lucide-react';

interface M10LifecyclePipelineProps {
  activeTab: 'rfqs' | 'bids' | 'evaluation' | 'comparison' | 'awards' | 'analytics';
  onSelectTab: (tab: 'rfqs' | 'bids' | 'evaluation' | 'comparison' | 'awards' | 'analytics') => void;
  rfqsCount: number;
  bidsCount: number;
  evaluationsCount: number;
  awardsCount: number;
}

export const M10LifecyclePipeline: React.FC<M10LifecyclePipelineProps> = ({
  activeTab,
  onSelectTab,
  rfqsCount,
  bidsCount,
  evaluationsCount,
  awardsCount,
}) => {
  const steps = [
    {
      id: 'rfqs' as const,
      step: '1',
      title: 'Khởi Tạo Gói Thầu RFQ',
      desc: 'Phát hành yêu cầu chào giá, tiêu chuẩn kỹ thuật & hạn định thầu',
      tag: `${rfqsCount} Gói thầu`,
      icon: <FileText className="w-3.5 h-3.5" />,
    },
    {
      id: 'bids' as const,
      step: '2',
      title: 'Tiếp Nhận Chào Giá Bids',
      desc: 'Hồ sơ niêm phong, đơn giá chào thầu & cam kết thời gian lead time',
      tag: `${bidsCount} Hồ sơ`,
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
    {
      id: 'evaluation' as const,
      step: '3',
      title: 'Hội Đồng Chấm Thầu',
      desc: 'Chấm điểm 4 tiêu chí: Giá (40%), Chất lượng (30%), Tiến độ, Bảo hành',
      tag: `${evaluationsCount} Đánh giá`,
      icon: <Award className="w-3.5 h-3.5" />,
    },
    {
      id: 'comparison' as const,
      step: '4',
      title: 'Ma Trận So Sánh & Xếp Hạng',
      desc: 'So sánh đa chiều, tính toán điểm tổng hợp & xếp hạng thứ bậc 1, 2, 3...',
      tag: 'Rank Matrix',
      icon: <Scale className="w-3.5 h-3.5" />,
    },
    {
      id: 'awards' as const,
      step: '5',
      title: 'Phê Duyệt Trao Thầu',
      desc: 'Ban hành quyết định trúng thầu & phát sinh sự kiện M08 PO Boundary',
      tag: `${awardsCount} Quyết định`,
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            Tiến Trình Đấu Thầu Chiến Lược (Strategic Sourcing Lifecycle Pipeline)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-mono font-bold">
            Standard Flow
          </span>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
          Quy trình 5 bước khép kín RFQ → Bids → Eval → Matrix → Award
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {steps.map(s => {
          const isCurrent = activeTab === s.id;
          return (
            <button
              key={s.step}
              type="button"
              onClick={() => onSelectTab(s.id)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isCurrent
                  ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-600 ring-2 ring-purple-500/20 shadow-xs'
                  : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/80 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-slate-100/70 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 w-full">
                <span className={`text-[10px] font-mono tabular-nums font-bold flex items-center gap-1 ${
                  isCurrent ? 'text-purple-700 dark:text-purple-300' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {s.icon}
                  <span>BƯỚC {s.step}</span>
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  isCurrent
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}>
                  {s.tag}
                </span>
              </div>
              <div>
                <h4 className={`text-xs font-bold leading-tight ${
                  isCurrent ? 'text-purple-950 dark:text-purple-100' : 'text-slate-800 dark:text-slate-200'
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
