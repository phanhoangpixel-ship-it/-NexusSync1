import React, { useState } from 'react';
import { X, Calendar, Plus } from 'lucide-react';

interface CreateMaintenancePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: any[];
  onSuccess: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const CreateMaintenancePlanModal: React.FC<CreateMaintenancePlanModalProps> = ({
  isOpen,
  onClose,
  assets,
  onSuccess,
  onNotify,
}) => {
  const [assetId, setAssetId] = useState<number>(assets[0]?.id || 1);
  const [title, setTitle] = useState('Bảo dưỡng định kỳ 30 ngày');
  const [intervalDays, setIntervalDays] = useState<number>(30);
  const [maintenanceType, setMaintenanceType] = useState('PREVENTIVE');
  const [description, setDescription] = useState('Kiểm tra dầu bôi trơn, siết ốc và hiệu chuẩn cảm biến');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tiêu đề kế hoạch PM.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/eam/maintenance-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId,
          title: title.trim(),
          intervalDays: Number(intervalDays),
          maintenanceType,
          description: description.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi tạo kế hoạch PM');
      }

      onNotify('success', 'Tạo kế hoạch PM thành công', `Đã lập kế hoạch "${title}" với chu kỳ ${intervalDays} ngày.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      onNotify('danger', 'Lỗi tạo kế hoạch PM', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Thiết Lập Kế Hoạch Bảo Dưỡng Định Kỳ (PM Plan)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Chu kỳ kiểm tra, thay dầu và ngăn ngừa sự cố máy móc</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Thiết Bị Áp Dụng <span className="text-rose-500">*</span>
            </label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name} ({a.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tiêu Đề Kế Hoạch PM <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Bảo dưỡng trục chính và lọc dầu CNC"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chu Kỳ Bảo Dưỡng (Ngày) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={intervalDays}
                onChange={(e) => setIntervalDays(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phương Thức
              </label>
              <select
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              >
                <option value="PREVENTIVE">Định kỳ theo lịch (Preventive)</option>
                <option value="CONDITION_BASED">Theo tình trạng (Condition-based)</option>
                <option value="PREDICTIVE">Dự đoán AI / IoT (Predictive)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Quy Trình &amp; Hạng Mục Kiểm Tra <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Đang Lưu...' : 'Lưu Kế Hoạch PM'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
