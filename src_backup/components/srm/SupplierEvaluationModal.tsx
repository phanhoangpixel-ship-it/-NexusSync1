import React, { useState, useMemo } from 'react';
import { Award, X, SlidersHorizontal, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface SupplierEvaluationModalProps {
  supplier: any;
  onClose: () => void;
  onCompleted: (newSupplierData: any) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  userToken?: string;
}

export const SupplierEvaluationModal: React.FC<SupplierEvaluationModalProps> = ({
  supplier,
  onClose,
  onCompleted,
  onNotify,
  userToken
}) => {
  const [period, setPeriod] = useState<string>(`Q${Math.floor((new Date().getMonth() + 3) / 3)}/${new Date().getFullYear()}`);
  const [otifRate, setOtifRate] = useState<number>(96);
  const [qualityScore, setQualityScore] = useState<number>(98);
  const [complianceScore, setComplianceScore] = useState<number>(100);
  const [serviceScore, setServiceScore] = useState<number>(92);
  const [evalNotes, setEvalNotes] = useState<string>('Hoàn thành tốt cam kết giao hàng và tiêu chuẩn kiểm định GR.');
  const [evaluator, setEvaluator] = useState<string>('Hội đồng SRM & Mua sắm P2P');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Real-time Composite Score: 35% OTIF + 35% Quality + 15% Compliance + 15% Service
  const compositeScore = useMemo(() => {
    const raw = (otifRate * 0.35) + (qualityScore * 0.35) + (complianceScore * 0.15) + (serviceScore * 0.15);
    return Math.round(raw * 10) / 10;
  }, [otifRate, qualityScore, complianceScore, serviceScore]);

  const performanceTier = useMemo(() => {
    if (compositeScore >= 90) return 'Tier A (Chiến lược)';
    if (compositeScore >= 75) return 'Tier B (Ưu tiên)';
    return 'Tier C (Theo dõi)';
  }, [compositeScore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier?.id) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken || ''}`
        },
        body: JSON.stringify({
          period,
          otifRate,
          qualityScore,
          complianceScore,
          serviceScore,
          notes: evalNotes,
          evaluator
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể lưu kết quả đánh giá');

      onNotify('success', 'Đánh Giá Hoàn Tất', `Đã cập nhật Thẻ điểm SRM cho ${supplier.name}. Xếp hạng: ${performanceTier} (${compositeScore}/100)`);
      onCompleted(data.data);
      onClose();
    } catch (err: any) {
      onNotify('danger', 'Lỗi', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">Chấm Điểm Thẻ Điểm SRM Định Kỳ</h3>
              <p className="text-[11px] text-slate-400">
                Đối tác: <strong className="text-white">{supplier.name}</strong> ({supplier.code || `SUP-${supplier.id}`})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Period & Evaluator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Kỳ Đánh Giá (Period) *
              </label>
              <input
                type="text"
                required
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Q3/2026 hoặc Tháng 09/2026"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Người Đánh Giá / Hội Đồng *
              </label>
              <input
                type="text"
                required
                value={evaluator}
                onChange={(e) => setEvaluator(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Criteria Sliders */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3.5">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
                Các Trụ Cột Đánh Giá Hiệu Suất (Weighted SLA Criteria)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Tổng trọng số: 100%</span>
            </h4>

            {/* Criterion 1: OTIF (35%) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  1. Tỷ Lệ Giao Hàng Đúng Hạn & Đủ Lượng (OTIF Rate)
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono ml-1.5">[Trọng số: 35%]</span>
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {otifRate}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="1"
                value={otifRate}
                onChange={(e) => setOtifRate(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Criterion 2: GR Quality (35%) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  2. Chất Lượng Nghiệm Thu Kho Hàng (GR / IQC Quality)
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono ml-1.5">[Trọng số: 35%]</span>
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                  {qualityScore}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="1"
                value={qualityScore}
                onChange={(e) => setQualityScore(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Criterion 3: Legal & CO/CQ Compliance (15%) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  3. Tuân Thủ Hồ Sơ Pháp Lý, CO/CQ, Hóa Đơn Hợp Chuẩn
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono ml-1.5">[Trọng số: 15%]</span>
                </span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400 text-sm">
                  {complianceScore}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="1"
                value={complianceScore}
                onChange={(e) => setComplianceScore(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Criterion 4: Service & Price (15%) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  4. Dịch Vụ Kỹ Thuật, Tốc Độ Phản Hồi & Giá Cạnh Tranh
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono ml-1.5">[Trọng số: 15%]</span>
                </span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                  {serviceScore}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="1"
                value={serviceScore}
                onChange={(e) => setServiceScore(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Real-Time Composite Score Preview */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Điểm Tổng Hợp SRM (Composite Score)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-extrabold text-blue-700 dark:text-blue-300">
                  {compositeScore}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ 100 điểm</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Phân Hạng Dự Kiến</span>
              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                compositeScore >= 90
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : compositeScore >= 75
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
              }`}>
                {performanceTier}
              </span>
            </div>
          </div>

          {/* Evaluation Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Ghi Chú Nhận Xét Của Hội Đồng Đánh Giá
            </label>
            <textarea
              rows={2}
              value={evalNotes}
              onChange={(e) => setEvalNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              placeholder="Nhận xét chi tiết..."
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang Lưu...' : 'Phát Hành Thẻ Điểm Đánh Giá'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
