import React, { useState } from 'react';
import { X, ShieldCheck, Lock, FileText, CheckCircle2, Copy } from 'lucide-react';

interface HrDossierSealModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeesCount: number;
  payrollsCount: number;
  onSuccess: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const HrDossierSealModal: React.FC<HrDossierSealModalProps> = ({
  isOpen,
  onClose,
  employeesCount,
  payrollsCount,
  onSuccess,
  onNotify,
}) => {
  const [sealedBy, setSealedBy] = useState('Phan Hoàng (Giám đốc Nhân sự & Kế toán trưởng)');
  const [notes, setNotes] = useState('Niêm phong toàn diện hồ sơ định biên nhân sự, bảng lương và định khoản GL kỳ hiện tại');
  const [submitting, setSubmitting] = useState(false);
  const [sealResult, setSealResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/hr/seal-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sealedBy, notes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi niêm phong hồ sơ HR');

      setSealResult(data);
      onNotify('success', 'Niêm phong hoàn tất', `Chứng từ ${data.docCode} đã được đóng dấu mật mã SHA-256 vào sổ kiểm toán M02.`);
      onSuccess();
    } catch (err: any) {
      onNotify('danger', 'Niêm phong thất bại', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    onNotify('info', 'Đã sao chép', 'Mã băm SHA-256 đã được lưu vào clipboard.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Niêm Phong Hồ Sơ HR &amp; Bảng Lương (DMS-M02)</h3>
              <p className="text-xs text-slate-500">Tạo mã băm SHA-256 bất biến &amp; khóa chứng từ nhân sự vào sổ kiểm toán</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sealResult ? (
          <div className="p-6 space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Hồ Sơ Đã Được Niêm Phong Bất Biến Thành Công</span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Toàn bộ dữ liệu hồ sơ nhân sự, dữ liệu chấm công và bút toán lương GL đã được lưu trữ an toàn trong chuỗi khối kiểm toán.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Mã chứng từ niêm phong:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{sealResult.docCode}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Thời gian đóng dấu:</span>
                <span className="font-mono text-slate-900 dark:text-white">{sealResult.signedAt}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Người ký xác thực:</span>
                <span className="font-bold text-slate-900 dark:text-white">{sealResult.snapshot.sealedBy}</span>
              </div>
              <div className="py-2">
                <span className="text-slate-500 font-medium block mb-1">Mã băm mật mã SHA-256 Checksum:</span>
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-between gap-2 border border-slate-200 dark:border-slate-700">
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all select-all">
                    {sealResult.sha256Hash}
                  </span>
                  <button
                    onClick={() => copyHash(sealResult.sha256Hash)}
                    className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors"
                    title="Sao chép SHA-256"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-xs"
              >
                Đóng &amp; Trở Về Workspace
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSeal} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-500">Số lượng nhân sự:</span>
                <p className="font-bold font-mono text-slate-900 dark:text-white text-sm mt-0.5">{employeesCount} nhân sự</p>
              </div>
              <div>
                <span className="text-slate-500">Kỳ bảng lương:</span>
                <p className="font-bold font-mono text-slate-900 dark:text-white text-sm mt-0.5">{payrollsCount} kỳ đã chốt</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Người chịu trách nhiệm niêm phong <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sealedBy}
                onChange={(e) => setSealedBy(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ghi chú / Mục đích niêm phong <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>

            <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-xl text-xs text-purple-900 dark:text-purple-300 flex items-start gap-2">
              <Lock className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <span>
                Sau khi niêm phong, bản chụp (snapshot) dữ liệu sẽ được mã hóa bất biến và liên kết chặt chẽ với Sổ kiểm toán M02 và DMS M29.
              </span>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? 'Đang mã hóa & niêm phong...' : 'Niêm Phong Mật Mã SHA-256'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
