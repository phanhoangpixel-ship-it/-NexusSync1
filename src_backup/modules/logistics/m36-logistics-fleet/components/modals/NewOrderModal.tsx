import React, { useState } from 'react';
import { X, Navigation, Plus, DollarSign, Calendar, MapPin, Package, ShieldCheck } from 'lucide-react';
import { TransportOrder } from '../types';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    customerName: string;
    originAddress: string;
    destinationAddress: string;
    stops: string;
    weightKg: number;
    volumeCbm: number;
    freightCost: number;
    plannedDate: string;
  }) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    customerName: '',
    originAddress: 'Kho Tổng HQ Hà Nội (WH-MAIN)',
    destinationAddress: '',
    stops: '',
    weightKg: 1000,
    volumeCbm: 4.5,
    freightCost: 3500000,
    plannedDate: new Date().toISOString().split('T')[0],
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
              <Navigation className="w-5 h-5" />
            </div>
            <span>Khởi Tạo Lệnh Vận Chuyển Mới (Transport Order)</span>
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
              Khách Hàng / Điểm Nhận Hàng:
            </label>
            <input
              type="text"
              required
              placeholder="VD: Tập đoàn Viettel Post, Samsung Electronics..."
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Điểm Xuất Phát (Origin):
              </label>
              <input
                type="text"
                required
                value={form.originAddress}
                onChange={(e) => setForm({ ...form, originAddress: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Điểm Giao Đích (Destination):
              </label>
              <input
                type="text"
                required
                placeholder="VD: Cảng Đình Vũ, Hải Phòng"
                value={form.destinationAddress}
                onChange={(e) => setForm({ ...form, destinationAddress: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Các Điểm Dừng Phụ (Waypoints / Stops - phân cách bằng dấu phẩy):
            </label>
            <input
              type="text"
              placeholder="VD: Trạm dừng chân Vực Vòng, Kho trung chuyển Phố Nối..."
              value={form.stops}
              onChange={(e) => setForm({ ...form, stops: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Trọng Lượng (Kg):
              </label>
              <input
                type="number"
                required
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
                className="w-full font-mono tabular-nums px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Thể Tích (m³):
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={form.volumeCbm}
                onChange={(e) => setForm({ ...form, volumeCbm: Number(e.target.value) })}
                className="w-full font-mono tabular-nums px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Ngày Dự Kiến:
              </label>
              <input
                type="date"
                required
                value={form.plannedDate}
                onChange={(e) => setForm({ ...form, plannedDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Cước Vận Chuyển Kế Hoạch (VNĐ):
            </label>
            <input
              type="number"
              step="50000"
              required
              value={form.freightCost}
              onChange={(e) => setForm({ ...form, freightCost: Number(e.target.value) })}
              className="w-full font-mono tabular-nums px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-right"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Lệnh Vận Chuyển</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
