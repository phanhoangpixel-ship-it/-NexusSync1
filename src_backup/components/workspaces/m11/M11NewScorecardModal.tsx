import React, { useState, useMemo } from 'react';
import { SupplierItem } from './m11Types';
import { X, Award, Star, TrendingUp, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';

interface M11NewScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: SupplierItem[];
  preSelectedSupplierId?: number;
  onSubmitScorecard: (payload: {
    supplierId: number;
    period: string;
    otifRate: number;
    qualityScore: number;
    complianceScore: number;
    serviceScore: number;
    evaluator: string;
    notes: string;
  }) => Promise<void>;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M11NewScorecardModal: React.FC<M11NewScorecardModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  preSelectedSupplierId,
  onSubmitScorecard,
  onNotify,
}) => {
  const [supplierId, setSupplierId] = useState<number>(preSelectedSupplierId || (suppliers[0]?.id ?? 0));
  const [period, setPeriod] = useState<string>(`Q${Math.floor((new Date().getMonth() + 3) / 3)}/${new Date().getFullYear()}`);
  const [otifRate, setOtifRate] = useState<number>(96);
  const [qualityScore, setQualityScore] = useState<number>(98);
  const [complianceScore, setComplianceScore] = useState<number>(100);
  const [serviceScore, setServiceScore] = useState<number>(90);
  const [evaluator, setEvaluator] = useState<string>('Hội đồng Mua sắm & SRM');
  const [notes, setNotes] = useState<string>('Đánh giá định kỳ hiệu suất NCC. Đáp ứng đầy đủ chỉ tiêu giao hàng và chất lượng.');
  const [submitting, setSubmitting] = useState(false);

  // Calculate live composite score:
  // OTIF 35%, GR Quality 35%, Compliance 15%, Service 15%
  const compositeScore = useMemo(() => {
    return Math.round((otifRate * 0.35 + qualityScore * 0.35 + complianceScore * 0.15 + serviceScore * 0.15) * 10) / 10;
  }, [otifRate, qualityScore, complianceScore, serviceScore]);

  const predictedTier = useMemo(() => {
    if (compositeScore >= 90) return { label: 'TIER A (Chiến lược)', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
    if (compositeScore >= 75) return { label: 'TIER B (Ưu tiên)', color: 'text-blue-700 bg-blue-50 border-blue-300' };
    return { label: 'TIER C (Theo dõi)', color: 'text-amber-700 bg-amber-50 border-amber-300' };
  }, [compositeScore]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng chọn nhà cung cấp cần phát hành thẻ điểm.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmitScorecard({
        supplierId,
        period,
        otifRate,
        qualityScore,
        complianceScore,
        serviceScore,
        evaluator,
        notes,
      });
      onClose();
    } catch (err: any) {
      onNotify('danger', 'Lỗi phát hành', err.message || 'Không thể lưu thẻ điểm đánh giá.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Chấm Điểm &amp; Phát Hành Thẻ Điểm SRM Mới
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                Cập nhật điểm Composite &amp; phân hạng đối tác tự động
              </p>
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Nhà Cung Cấp Mục Tiêu <span className="text-rose-500">*</span>
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Kỳ Đánh Giá <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="VD: Q3/2026 hoặc T09/2026"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Sliders for the 4 Weighted Metrics */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3.5">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>1. Tỷ lệ Giao Hàng Đúng Hạn (OTIF - 35%)</span>
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {otifRate}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={otifRate}
                onChange={(e) => setOtifRate(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>2. Điểm Chất Lượng Kiểm Định GR (35%)</span>
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                  {qualityScore}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={qualityScore}
                onChange={(e) => setQualityScore(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>3. Tuân Thủ Hợp Đồng &amp; CO/CQ (15%)</span>
                </span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400 text-sm">
                  {complianceScore}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={complianceScore}
                onChange={(e) => setComplianceScore(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5" />
                  <span>4. Dịch Vụ &amp; Thời Gian Phản Hồi (15%)</span>
                </span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                  {serviceScore}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={serviceScore}
                onChange={(e) => setServiceScore(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Composite Score Preview Box */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Điểm Đánh Giá Tổng Hợp (Composite Score)
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-mono font-bold text-indigo-700 dark:text-indigo-300">
                  {compositeScore}
                </span>
                <span className="text-xs text-slate-500">/ 100 Điểm</span>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-xl text-xs font-bold border ${predictedTier.color}`}>
              {predictedTier.label}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Hội Đồng / Người Đánh Giá
              </label>
              <input
                type="text"
                value={evaluator}
                onChange={(e) => setEvaluator(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Nhận Xét &amp; Khuyến Nghị
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2 -mx-5 -mb-5 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Award className="w-3.5 h-3.5" />
              <span>{submitting ? 'Đang phát hành...' : 'Phát Hành Scorecard'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
