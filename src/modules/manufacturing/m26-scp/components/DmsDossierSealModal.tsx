import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck,
  Lock,
  Copy,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCode,
  Hash,
  Layers,
  Award,
  Check,
} from 'lucide-react';
import { MrpRun } from '../types';

interface DmsDossierSealModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRun: MrpRun | null;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  onSealSuccess?: () => void;
}

export const DmsDossierSealModal: React.FC<DmsDossierSealModalProps> = ({
  isOpen,
  onClose,
  currentRun,
  onNotify,
  onSealSuccess,
}) => {
  const [sealedBy, setSealedBy] = useState('Hoàng Nam (SCM Lead Planner)');
  const [notes, setNotes] = useState('Niêm phong hồ sơ kế hoạch cung ứng & cân bằng nhu cầu MRP định kỳ chu kỳ Q3/2026');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sealResult, setSealResult] = useState<any>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  if (!isOpen || !currentRun) return null;

  const handleSeal = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/scm/mrp/seal-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: currentRun.id,
          sealedBy,
          notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi niêm phong hồ sơ');
      }

      const data = await res.json();
      setSealResult(data);
      onNotify('success', 'Niêm phong hồ sơ thành công', `Đã lưu trữ hồ sơ ${data.docCode} vào M29 DMS với mã băm SHA-256.`);
      if (onSealSuccess) onSealSuccess();
    } catch (err: any) {
      onNotify('danger', 'Lỗi niêm phong', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Niêm Phong Hồ Sơ Kế Hoạch (M29 DMS Dossier Sealing)</h3>
              <p className="text-xs text-slate-300">
                Đóng gói bản chụp kế hoạch MRP &amp; ghi nhận sổ cái kiểm toán bất biến M02 với mã băm SHA-256
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {!sealResult ? (
            <>
              {/* Plan Snapshot Summary */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>Phiên Chạy MRP Được Niêm Phong:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white px-2.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-md">
                    {currentRun.runCode} ({currentRun.runType.toUpperCase()})
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-center p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Sản phẩm phân tích</span>
                    <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">{currentRun.totalProductsAnalyzed || 0}</span>
                  </div>
                  <div className="text-center p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Tổng nhu cầu ròng</span>
                    <span className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400">{currentRun.totalNetRequirements || 0}</span>
                  </div>
                  <div className="text-center p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Ngoại lệ phát hiện</span>
                    <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">{currentRun.totalExceptions || 0}</span>
                  </div>
                </div>
              </div>

              {/* Sealing Input Fields */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Người Ký Xác Nhận &amp; Chức Danh
                  </label>
                  <input
                    type="text"
                    value={sealedBy}
                    onChange={(e) => setSealedBy(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white"
                    placeholder="Nhập họ tên và chức danh người ký..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ghi Chú Niêm Phong / Căn Cứ Kế Hoạch
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    placeholder="Mục đích niêm phong, kỳ kế hoạch, căn cứ phê duyệt..."
                  />
                </div>
              </div>

              {/* Compliance & Security Guarantee Notice */}
              <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                  <strong className="block mb-0.5 font-bold">Cam Kết Toàn Vẹn &amp; Pháp Lý Số:</strong>
                  Hồ sơ sau khi niêm phong sẽ được lưu trữ bất biến tại module <strong>M29 DMS</strong> kèm mã băm <strong>SHA-256</strong>. Hệ thống <strong>M02 Audit Trail</strong> sẽ ghi nhận thời điểm và chữ ký của người phê duyệt, không thể chỉnh sửa hay hủy bỏ.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSeal}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang Tính Toán Băm &amp; Lưu Trữ...' : 'Xác Nhận Niêm Phong &amp; Ký Số'}</span>
                </button>
              </div>
            </>
          ) : (
            /* Seal Result Display */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Hồ Sơ Kế Hoạch Đã Được Niêm Phong &amp; Lưu Trữ Thành Công!</span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                  Bản chụp kế hoạch MRP đã được cấp mã hồ sơ chính thức tại M29 DMS và đóng dấu kiểm toán M02.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Mã Hồ Sơ (DMS Code):</span>
                  <strong className="font-mono text-blue-600 dark:text-blue-400 font-bold">{sealResult.docCode}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Tiêu Đề:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{sealResult.title}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Thời Gian Niêm Phong:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{sealResult.signedAt}</span>
                </div>
                <div className="py-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold">
                      <Hash className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Mã Băm SHA-256 (Tính Toàn Vẹn):
                    </span>
                    <button
                      onClick={() => copyToClipboard(sealResult.sha256Hash)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedHash ? 'Đã Sao Chép' : 'Sao Chép'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg break-all border border-slate-800">
                    {sealResult.sha256Hash}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowJsonPreview(!showJsonPreview)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{showJsonPreview ? 'Ẩn Snapshot' : 'Xem Cấu Trúc Dossier JSON'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Hoàn Tất &amp; Đóng
                </button>
              </div>

              {showJsonPreview && sealResult.snapshot && (
                <div className="mt-3 p-3 bg-slate-900 rounded-xl max-h-48 overflow-y-auto custom-scrollbar border border-slate-800">
                  <pre className="text-[10px] font-mono text-slate-300">
                    {JSON.stringify(sealResult.snapshot, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
