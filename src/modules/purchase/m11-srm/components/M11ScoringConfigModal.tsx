import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface M11ScoringConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  onRefresh?: () => void;
}

export const M11ScoringConfigModal: React.FC<M11ScoringConfigModalProps> = ({
  isOpen,
  onClose,
  onNotify,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [otifWeight, setOtifWeight] = useState<number>(40);
  const [qualityWeight, setQualityWeight] = useState<number>(40);
  const [priceWeight, setPriceWeight] = useState<number>(10);
  const [complianceWeight, setComplianceWeight] = useState<number>(10);
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(2);
  const [tier1Threshold, setTier1Threshold] = useState<number>(90);
  const [tier2Threshold, setTier2Threshold] = useState<number>(75);
  const [tier3Threshold, setTier3Threshold] = useState<number>(60);

  const totalWeight = otifWeight + qualityWeight + priceWeight + complianceWeight;
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/srm/scoring-config', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        setOtifWeight(data.otifWeight ?? 40);
        setQualityWeight(data.qualityWeight ?? 40);
        setPriceWeight(data.priceWeight ?? 10);
        setComplianceWeight(data.complianceWeight ?? 10);
        setGracePeriodDays(data.gracePeriodDays ?? 2);
        setTier1Threshold(data.tier1Threshold ?? 90);
        setTier2Threshold(data.tier2Threshold ?? 75);
        setTier3Threshold(data.tier3Threshold ?? 60);
      }
    } catch (err: any) {
      console.warn('Could not fetch scoring config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWeightValid) {
      onNotify('danger', 'Lỗi Trọng Số', 'Tổng trọng số (OTIF + Chất lượng + Giá + Tuân thủ) bắt buộc phải bằng đúng 100%.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/srm/scoring-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          otifWeight,
          qualityWeight,
          priceWeight,
          complianceWeight,
          gracePeriodDays,
          tier1Threshold,
          tier2Threshold,
          tier3Threshold
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Lỗi máy chủ (${res.status})`);
      }

      onNotify('success', 'Đã Cập Nhật Cấu Hình', 'Đã lưu cấu hình trọng số & ngưỡng phân hạng SRM kèm SHA-256 Audit Log.');
      if (onRefresh) onRefresh();
      onClose();
    } catch (err: any) {
      onNotify('danger', 'Không Thể Lưu', err.message || 'Lỗi khi cập nhật cấu hình chấm điểm.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Cấu Hình Trọng Số Chấm Điểm &amp; Ngưỡng Phân Hạng SRM (M11-F02)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Thiết lập công thức composite score, ngày dung sai giao hàng &amp; hạn mức Tier A/B/C/D.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center font-mono text-xs text-slate-400">Đang tải cấu hình...</div>
        ) : (
          <form onSubmit={handleSave} className="p-5 space-y-5">
            {/* Weights Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  1. Tỷ Trọng Các Tiêu Chí (Tổng bắt buộc = 100%)
                </h4>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isWeightValid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  Tổng: {totalWeight.toFixed(1)}% {isWeightValid ? '✓ Hợp lệ' : '✗ Phải bằng 100%'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">OTIF (Đúng hạn &amp; Đủ lượng)</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{otifWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={otifWeight}
                    onChange={(e) => setOtifWeight(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">Chất lượng Kiểm định (QMS)</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{qualityWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={qualityWeight}
                    onChange={(e) => setQualityWeight(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">Biến động Giá (BPA Contract)</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{priceWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={priceWeight}
                    onChange={(e) => setPriceWeight(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">Tuân thủ Pháp lý &amp; ESG</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{complianceWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={complianceWeight}
                    onChange={(e) => setComplianceWeight(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Thresholds & Grace Period */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                2. Ngưỡng Phân Hạng &amp; Ngày Dung Sai (Grace Period)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Dung Sai (Ngày)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="14"
                    value={gracePeriodDays}
                    onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Tier 1 (Xuất sắc ≥)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={tier1Threshold}
                    onChange={(e) => setTier1Threshold(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Tier 2 (Đạt chuẩn ≥)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="90"
                    value={tier2Threshold}
                    onChange={(e) => setTier2Threshold(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Tier 3 (Cảnh báo ≥)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="80"
                    value={tier3Threshold}
                    onChange={(e) => setTier3Threshold(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl p-3 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Bảo mật &amp; Kiểm toán (M02 Audit Trail):</strong> Mọi thay đổi về cấu hình trọng số &amp; ngưỡng phân hạng sẽ được ghi vào nhật ký kiểm toán SHA-256 và yêu cầu quyền quản trị SRM (`srm.config.manage`).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Huỷ Bỏ
              </button>
              <button
                type="submit"
                disabled={saving || !isWeightValid}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {saving ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Lưu Cấu Hình M11</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
