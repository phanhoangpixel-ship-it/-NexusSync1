import React, { useState } from 'react';
import { X, Wrench, Plus } from 'lucide-react';
import { Vehicle } from '../types';

interface NewMaintModalProps {
  isOpen: boolean;
  vehicles: Vehicle[];
  onClose: () => void;
  onSubmit: (formData: {
    vehiclePlate: string;
    serviceType: string;
    scheduledDate: string;
    estimatedCost: number;
    notes: string;
  }) => void;
}

export const NewMaintModal: React.FC<NewMaintModalProps> = ({
  isOpen,
  vehicles,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    vehiclePlate: vehicles[0]?.plateNumber || '29C-882.14',
    serviceType: 'Bảo dưỡng cấp 2 (20,000 km)',
    scheduledDate: new Date().toISOString().split('T')[0],
    estimatedCost: 3500000,
    notes: 'Thay dầu động cơ, lọc dầu, kiểm tra hệ thống phanh khí nén.',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      vehiclePlate: form.vehiclePlate,
      serviceType: form.serviceType,
      scheduledDate: form.scheduledDate,
      estimatedCost: Number(form.estimatedCost),
      notes: form.notes,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
              <Wrench className="w-5 h-5" />
            </div>
            <span>Lập Lịch Bảo Dưỡng / Sửa Chữa Phương Tiện</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Phương Tiện Bảo Dưỡng:
            </label>
            <select
              value={form.vehiclePlate}
              onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.plateNumber}>
                  {v.plateNumber} ({v.vehicleType} - Odo: {v.mileageKm} km)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Gói Dịch Vụ / Nội Dung Bảo Dưỡng:
            </label>
            <select
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="Bảo dưỡng cấp 1 (5,000 km)">Bảo dưỡng cấp 1 (5,000 km - Thay nhớt + kiểm tra nhanh)</option>
              <option value="Bảo dưỡng cấp 2 (20,000 km)">Bảo dưỡng cấp 2 (20,000 km - Bảo dưỡng phanh + lọc)</option>
              <option value="Bảo dưỡng cấp 3 (40,000 km)">Bảo dưỡng cấp 3 (40,000 km - Thay toàn bộ dầu truyền động)</option>
              <option value="Thay Lốp & Cân Chỉnh Thước Lái">Thay Lốp Mới &amp; Cân Chỉnh Thước Lái</option>
              <option value="Sửa chữa đột xuất">Sửa chữa đột xuất sự cố kỹ thuật</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Ngày Dự Kiến Đưa Vào Xưởng:
              </label>
              <input
                type="date"
                required
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Chi Phí Ước Tính (VNĐ):
              </label>
              <input
                type="number"
                step="100000"
                required
                value={form.estimatedCost}
                onChange={(e) => setForm({ ...form, estimatedCost: Number(e.target.value) })}
                className="w-full font-mono tabular-nums px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Ghi Chú Hạng Mục &amp; Đơn Vị Thực Hiện:
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Lịch Bảo Dưỡng</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
