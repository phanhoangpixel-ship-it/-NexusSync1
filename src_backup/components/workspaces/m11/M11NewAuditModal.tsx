import React, { useState } from 'react';
import { SupplierItem, SupplierAuditItem } from './m11Types';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface M11NewAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: SupplierItem[];
  onSubmitAudit: (audit: Partial<SupplierAuditItem>) => Promise<void>;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M11NewAuditModal: React.FC<M11NewAuditModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  onSubmitAudit,
  onNotify,
}) => {
  const [supplierId, setSupplierId] = useState<number>(suppliers[0]?.id || 0);
  const [auditType, setAuditType] = useState<SupplierAuditItem['auditType']>('FACTORY_CAPACITY');
  const [leadAuditor, setLeadAuditor] = useState('Đoàn Kiểm định Chất lượng ISO');
  const [auditDate, setAuditDate] = useState(new Date().toISOString().slice(0, 10));
  const [score, setScore] = useState(92);
  const [result, setResult] = useState<SupplierAuditItem['result']>('PASSED');
  const [findingsCount, setFindingsCount] = useState(1);
  const [criticalIssues, setCriticalIssues] = useState(0);
  const [recommendations, setRecommendations] = useState('Dây chuyền sản xuất đạt tiêu chuẩn GMP/ISO 9001. Đề nghị bổ sung hồ sơ bảo dưỡng định kỳ máy ép linh kiện.');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSupplier = suppliers.find((s) => s.id === supplierId);
    if (!selectedSupplier) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng chọn nhà cung cấp cần kiểm toán.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmitAudit({
        supplierId,
        supplierName: selectedSupplier.name,
        supplierCode: selectedSupplier.code,
        auditType,
        leadAuditor,
        auditDate,
        score,
        result,
        findingsCount,
        criticalIssues,
        recommendations,
        status: result === 'SCHEDULED' ? 'SCHEDULED' : 'COMPLETED',
      });
      onClose();
    } catch (err: any) {
      onNotify('danger', 'Lỗi kiểm toán', err.message || 'Không thể tạo đợt kiểm toán.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-purple-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Mở Đợt Kiểm Toán Năng Lực &amp; ESG Nhà Cung Cấp
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                Kiểm định thực địa &amp; tiêu chuẩn tuân thủ hợp đồng
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Nhà Cung Cấp <span className="text-rose-500">*</span>
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-purple-500"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Loại Kiểm Toán
              </label>
              <select
                value={auditType}
                onChange={(e) => setAuditType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="FACTORY_CAPACITY">Năng lực nhà xưởng</option>
                <option value="ESG_ENVIRONMENT">ESG &amp; Tiêu chuẩn môi trường</option>
                <option value="QUALITY_ISO">Chất lượng &amp; ISO 9001/14001</option>
                <option value="SECURITY_SLA">Bảo mật &amp; Cam kết SLA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Ngày Kiểm Tra
              </label>
              <input
                type="date"
                value={auditDate}
                onChange={(e) => setAuditDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Trưởng Đoàn / Kiểm Toán Viên
              </label>
              <input
                type="text"
                value={leadAuditor}
                onChange={(e) => setLeadAuditor(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Kết Luận Kiểm Toán
              </label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="PASSED">Đạt chuẩn (PASSED)</option>
                <option value="PASSED_WITH_CONDITIONS">Đạt có điều kiện</option>
                <option value="SCHEDULED">Đã lên lịch thực hiện</option>
                <option value="IN_PROGRESS">Đang thực hiện</option>
                <option value="FAILED">Không đạt (FAILED)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Điểm Đánh Giá (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Tổng Lỗi Phát Hiện
              </label>
              <input
                type="number"
                min="0"
                value={findingsCount}
                onChange={(e) => setFindingsCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Lỗi Nghiêm Trọng
              </label>
              <input
                type="number"
                min="0"
                value={criticalIssues}
                onChange={(e) => setCriticalIssues(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Khuyến Nghị &amp; Biện Pháp Khắc Phục (CAPA)
            </label>
            <textarea
              rows={3}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

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
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{submitting ? 'Đang lưu...' : 'Lưu Đợt Kiểm Toán'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
