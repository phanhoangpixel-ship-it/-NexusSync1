import React from 'react';
import { Award, CheckCircle2, AlertTriangle, Star, TrendingUp, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

export interface ScorecardTabPanelProps {
  supplierId?: string;
  supplierName?: string;
  scorecards?: any[];
  canManage?: boolean;
  onOpenM11?: () => void;
  onNewScorecard?: () => void;
  onNotify?: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const ScorecardTabPanel: React.FC<ScorecardTabPanelProps> = ({
  supplierId,
  supplierName = 'Nhà Cung Cấp',
  scorecards,
  canManage = true,
  onOpenM11,
  onNewScorecard,
  onNotify,
}) => {
  const defaultScorecards = [
    {
      id: 'SC-2026-001',
      period: 'Q3/2026',
      otifRate: '98.5%',
      qualityScore: '99.2%',
      complianceScore: '100%',
      overallRating: '4.9 / 5.0 (Strategic Partner)',
      status: 'EXCELLENT',
      evaluator: 'Hội đồng Mua sắm & SRM',
      evaluationDate: '15/08/2026',
      notes: 'Giao hàng đúng hẹn tuyệt đối, nguyên vật liệu đạt chuẩn 100% chứng chỉ CO/CQ.',
    },
    {
      id: 'SC-2026-000',
      period: 'Q2/2026',
      otifRate: '96.2%',
      qualityScore: '97.8%',
      complianceScore: '98.5%',
      overallRating: '4.7 / 5.0 (Strategic Partner)',
      status: 'EXCELLENT',
      evaluator: 'Trưởng ban Đấu thầu',
      evaluationDate: '15/05/2026',
      notes: 'Dịch vụ hậu mãi tốt, thời gian phản hồi kỹ thuật nhanh trong 2h.',
    },
  ];

  const activeScorecards = scorecards && scorecards.length > 0 ? scorecards : defaultScorecards;
  const currentSc = activeScorecards[0];

  const handleNavigateToM11 = () => {
    if (onOpenM11) {
      onOpenM11();
    }
    window.dispatchEvent(
      new CustomEvent('nexus-navigate', {
        detail: {
          route: '/srm-scorecard',
          moduleId: 'M11',
        },
      })
    );
  };

  return (
    <div id="scorecard-tab-panel" className="space-y-4">
      {/* Overview Stat Cards - M19 Standard Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tỷ Lệ Giao Hàng (OTIF)
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400">
            {currentSc.otifRate ?? '98.5%'}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
            On-Time In-Full (SLA: &ge;95%)
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Chất Lượng GR
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono tabular-nums font-bold text-2xl text-blue-600 dark:text-blue-400">
            {currentSc.qualityScore ?? '99.2%'}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
            Kiểm định IQC Đạt Chuẩn
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tuân Thủ Hợp Đồng
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono tabular-nums font-bold text-2xl text-indigo-600 dark:text-indigo-400">
            {currentSc.complianceScore ?? '100%'}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
            Pháp lý &amp; Điều khoản CO/CQ
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Phân Hạng Đối Tác
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono font-bold text-base text-amber-600 dark:text-amber-400 truncate" title={currentSc.overallRating}>
            {currentSc.overallRating ?? '4.9 / 5.0 (Strategic)'}
          </p>
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
            {currentSc.status ?? 'EXCELLENT'}
          </span>
        </div>
      </div>

      {/* Detail Scorecard History */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shadow-2xs">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Lịch Sử Đánh Giá Thẻ Điểm ({supplierName})
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">
              Thẩm quyền: M11 SRM Suite
            </span>
            {canManage ? (
              <button
                type="button"
                onClick={onNewScorecard || handleNavigateToM11}
                className="px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                + Chấm Điểm Kỳ Mới
              </button>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-md">
                Chỉ Đọc (Read-Only)
              </span>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
          {activeScorecards.map((sc, idx) => (
            <div 
              key={sc.id || idx} 
              className="p-4 space-y-2.5 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 border-l-4 border-emerald-500/60"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">{sc.id}</span>
                  {sc.period && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-mono font-bold border border-slate-200 dark:border-slate-600">
                      {sc.period}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      sc.status === 'EXCELLENT'
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                        : 'bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700'
                    }`}
                  >
                    {sc.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Ngày đánh giá: <strong className="text-slate-700 dark:text-slate-300">{sc.evaluationDate || '15/08/2026'}</strong> • Người chấm: <strong className="text-slate-700 dark:text-slate-300">{sc.evaluator || 'Hội đồng SRM'}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">OTIF Giao hàng:</span>
                  <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{sc.otifRate}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Kiểm định GR:</span>
                  <span className="font-bold tabular-nums text-blue-600 dark:text-blue-400">{sc.qualityScore}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Tuân thủ Pháp lý:</span>
                  <span className="font-bold tabular-nums text-indigo-600 dark:text-indigo-400">{sc.complianceScore}</span>
                </div>
              </div>

              {sc.notes && (
                <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 leading-relaxed">
                  &ldquo;{sc.notes}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Deep Link to M11 */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
          <p className="text-xs text-blue-950 dark:text-blue-100 leading-snug">
            Muốn mở đợt kiểm định Audit nhà xưởng hoặc phát hành Scorecard mới? Quản trị đầy đủ tại <strong>M11 SRM Supplier Mgmt</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleNavigateToM11}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer"
        >
          <span>Mở M11 SRM</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
