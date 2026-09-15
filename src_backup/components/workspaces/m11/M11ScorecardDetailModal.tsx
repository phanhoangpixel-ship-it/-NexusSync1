import React from 'react';
import { ScorecardItem } from './m11Types';
import { X, Award, ShieldCheck, CheckCircle2, TrendingUp, Star, UserCheck, Calendar, FileText, ExternalLink } from 'lucide-react';

interface M11ScorecardDetailModalProps {
  scorecard: ScorecardItem | null;
  onClose: () => void;
  onNavigateToM09?: () => void;
}

export const M11ScorecardDetailModal: React.FC<M11ScorecardDetailModalProps> = ({
  scorecard,
  onClose,
  onNavigateToM09,
}) => {
  if (!scorecard) return null;

  const isExcellent = scorecard.status === 'EXCELLENT' || (scorecard.compositeScore && scorecard.compositeScore >= 90);
  const isGood = scorecard.status === 'GOOD' || (scorecard.compositeScore && scorecard.compositeScore >= 75 && scorecard.compositeScore < 90);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold font-mono">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200">
                  {scorecard.id}
                </span>
                <span className="text-[10px] font-mono text-slate-300">
                  Kỳ: {scorecard.period || 'Q3/2026'}
                </span>
              </div>
              <h3 className="text-base font-bold tracking-tight text-white mt-0.5">
                {scorecard.supplierName}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Top Score Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                Tỷ Lệ Giao Hàng (OTIF)
              </span>
              <p className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">
                {scorecard.otifRate}
              </p>
              <span className="text-[10px] text-slate-400 block font-medium">Trọng số 35%</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                Chất Lượng GR (IQC)
              </span>
              <p className="font-mono font-bold text-lg text-blue-600 dark:text-blue-400">
                {scorecard.qualityScore}
              </p>
              <span className="text-[10px] text-slate-400 block font-medium">Trọng số 35%</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                Tuân Thủ Hợp Đồng
              </span>
              <p className="font-mono font-bold text-lg text-purple-600 dark:text-purple-400">
                {scorecard.complianceScore}
              </p>
              <span className="text-[10px] text-slate-400 block font-medium">Trọng số 15%</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                Dịch Vụ &amp; Hậu Mãi
              </span>
              <p className="font-mono font-bold text-lg text-amber-600 dark:text-amber-400">
                {scorecard.serviceScore || '90%'}
              </p>
              <span className="text-[10px] text-slate-400 block font-medium">Trọng số 15%</span>
            </div>
          </div>

          {/* Assessment Summary Box */}
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-indigo-950 dark:text-indigo-200">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Đánh Giá Tổng Hợp: {scorecard.overallRating}</span>
              </div>
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${
                  isExcellent
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                    : isGood
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                }`}
              >
                {isExcellent ? 'TIER A (Chiến lược)' : isGood ? 'TIER B (Ưu tiên)' : 'TIER C (Theo dõi)'}
              </span>
            </div>
            <p className="text-[11px] text-indigo-900 dark:text-indigo-300 leading-relaxed">
              {scorecard.notes ||
                'Đối tác đáp ứng toàn diện cam kết hợp đồng, giao hàng đúng hẹn và cung cấp đầy đủ chứng chỉ chất lượng CO/CQ trong kỳ.'}
            </p>
          </div>

          {/* Metadata & Governance Lineage */}
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-500" />
              <div>
                <span className="text-slate-400 block font-medium">Người/Hội đồng chấm:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{scorecard.evaluator || 'Hội đồng Mua sắm SRM'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <div>
                <span className="text-slate-400 block font-medium">Ngày ban hành thẻ điểm:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{scorecard.evaluationDate || new Date().toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          {onNavigateToM09 && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToM09();
              }}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Xem Hồ Sơ NCC Tại M09</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ml-auto"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
