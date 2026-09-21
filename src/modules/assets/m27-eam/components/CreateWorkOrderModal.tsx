import React, { useState } from 'react';
import { X, Wrench, Plus } from 'lucide-react';

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: any[];
  initialAssetId?: number;
  onSuccess: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({
  isOpen,
  onClose,
  assets,
  initialAssetId,
  onSuccess,
  onNotify,
}) => {
  const [assetId, setAssetId] = useState<number>(initialAssetId || (assets[0]?.id || 1));
  const [maintenanceType, setMaintenanceType] = useState('PREVENTIVE');
  const [priority, setPriority] = useState('NORMAL');
  const [description, setDescription] = useState('Bảo dưỡng & tra dầu trục vít me định kỳ');
  const [assignedTechnicianName, setAssignedTechnicianName] = useState('Kỹ thuật viên Trần Văn Hùng');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập mô tả công việc bảo trì.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/eam/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId,
          maintenanceType,
          priority,
          description: description.trim(),
          assignedTechnicianName: assignedTechnicianName.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi khởi tạo phiếu bảo trì');
      }

      onNotify('success', 'Tạo phiếu thành công', 'Phiếu bảo trì công tác WO đã được phát thành công.');
      onSuccess();
      onClose();
    } catch (err: any) {
      onNotify('danger', 'Lỗi phát phiếu WO', err.message);
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
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Khởi Tạo Phiếu Bảo Trì (Work Order)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Phát phiếu công tác sửa chữa hoặc bảo dưỡng thiết bị</p>
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
              Thiết Bị Cần Bảo Trì / Sửa Chữa <span className="text-rose-500">*</span>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Loại Bảo Trì
              </label>
              <select
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              >
                <option value="PREVENTIVE">Bảo dưỡng định kỳ (Preventive)</option>
                <option value="CORRECTIVE">Sửa chữa đột xuất (Corrective)</option>
                <option value="PREDICTIVE">Dự đoán cảm biến IoT (Predictive)</option>
                <option value="EMERGENCY">Khẩn cấp dừng máy (Emergency)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mức Độ Ưu Tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-semibold"
              >
                <option value="NORMAL">Bình thường (NORMAL)</option>
                <option value="HIGH">Ưu tiên cao (HIGH)</option>
                <option value="URGENT">Khẩn cấp (URGENT)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kỹ Thuật Viên Phụ Trách
            </label>
            <input
              type="text"
              required
              value={assignedTechnicianName}
              onChange={(e) => setAssignedTechnicianName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nội Dung &amp; Yêu Cầu Công Tác <span className="text-rose-500">*</span>
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
              <span>{loading ? 'Đang Tạo...' : 'Phát Phiếu Công Tác WO'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
