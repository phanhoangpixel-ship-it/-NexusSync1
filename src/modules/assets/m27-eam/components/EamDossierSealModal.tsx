import React, { useState } from 'react';
import { X, ShieldCheck, Copy, Check, Lock, Award, FileText } from 'lucide-react';

interface EamDossierSealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const EamDossierSealModal: React.FC<EamDossierSealModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const [sealedBy, setSealedBy] = useState('Trưởng Ban Quản Lý & Bảo Trì Thiết Bị (EAM Director)');
  const [notes, setNotes] = useState('Niêm phong hồ sơ kiểm kê kỹ thuật, lịch trình bảo dưỡng định kỳ và nhật ký vận hành máy móc Q3/2026.');
  const [sealedResult, setSealedResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/eam/seal-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sealedBy, notes }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi niêm phong hồ sơ');
      }

      const data = await res.json();
      setSealedResult(data);
      onNotify('success', 'Niêm phong DMS thành công', `Hồ sơ ${data.docCode} đã được niêm phong với mã băm SHA-256 bất biến.`);
    } catch (err: any) {
      onNotify('danger', 'Lỗi niêm phong', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHash = () => {
    if (sealedResult?.sha256Hash) {
      navigator.clipboard.writeText(sealedResult.sha256Hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onNotify('info', 'Đã sao chép', 'Mã băm SHA-256 đã được sao chép vào bộ nhớ tạm.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Niêm Phong Hồ Sơ Thiết Bị (M29 DMS &amp; M02 Audit)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tạo chữ ký số SHA-256 bất biến chứng thực kiểm định máy móc</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!sealedResult ? (
          <form onSubmit={handleSeal} className="p-6 space-y-4">
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
              <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block">Bảo Chứng Toàn Vẹn Theo Chuẩn ISO 55000 &amp; VAS 211</strong>
                Khi niêm phong, ảnh chụp trạng thái toàn bộ danh mục tài sản máy móc, lịch trình PM và phiếu bảo trì sẽ được đóng dấu mã băm SHA-256 và lưu trữ vào kho lưu trữ tài liệu M29 DMS.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Người Đại Diện Niêm Phong / Ký Duyệt <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sealedBy}
                onChange={(e) => setSealedBy(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ghi Chú &amp; Căn Cứ Pháp Lý / Biên Bản <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Đang Đóng Dấu Số...' : 'Ký Số &amp; Niêm Phong Hồ Sơ'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  {sealedResult.docCode}
                </span>
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded">
                  ĐÃ NIÊM PHONG BẤT BIẾN
                </span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{sealedResult.title}</h4>
              <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                Thời gian ký: <strong>{sealedResult.signedAt}</strong>
              </p>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">
                Mã Băm Mật Mã SHA-256 (DMS Integrity Hash):
              </span>
              <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl flex items-center justify-between gap-2 break-all">
                <span>{sealedResult.sha256Hash}</span>
                <button
                  onClick={handleCopyHash}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors shrink-0 cursor-pointer"
                  title="Sao chép mã băm"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
              <div className="text-slate-500 dark:text-slate-400">Thống Kê Tập Dữ Liệu Niêm Phong:</div>
              <div className="grid grid-cols-3 gap-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                <div>Thiết bị: {sealedResult.snapshot?.totalAssets}</div>
                <div>Phiếu WO: {sealedResult.snapshot?.totalWorkOrders}</div>
                <div>Kế hoạch PM: {sealedResult.snapshot?.totalPlans}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setSealedResult(null);
                  onClose();
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Hoàn Tất &amp; Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
