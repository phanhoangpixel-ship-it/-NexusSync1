import React, { useState } from 'react';
import { X, Truck, Plus } from 'lucide-react';

interface NewVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    plateNumber: string;
    vehicleType: string;
    capacityKg: number;
    fuelType: string;
    mileageKm: number;
    registrationExpiry: string;
    insuranceExpiry: string;
  }) => void;
}

export const NewVehicleModal: React.FC<NewVehicleModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    plateNumber: '',
    vehicleType: 'TRUCK_5T',
    capacityKg: 5000,
    fuelType: 'DIESEL',
    mileageKm: 15000,
    registrationExpiry: '2027-12-31',
    insuranceExpiry: '2027-06-30',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
            <span>Đăng Ký Phương Tiện Mới (Fleet Vehicle)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Biển Số Xe (BKS):
              </label>
              <input
                type="text"
                required
                placeholder="VD: 29C-882.14"
                value={form.plateNumber}
                onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
                className="w-full font-mono uppercase font-bold px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Loại Phương Tiện:
              </label>
              <select
                value={form.vehicleType}
                onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="VAN_1T">Xe Tải Nhỏ / Van 1 Tấn</option>
                <option value="TRUCK_2.5T">Xe Tải Thùng Kín 2.5 Tấn</option>
                <option value="TRUCK_5T">Xe Tải Trung 5 Tấn</option>
                <option value="TRUCK_10T">Xe Tải Nặng 10 Tấn</option>
                <option value="CONTAINER_40FT">Đầu Kéo Container 40 Feet</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Tải Trọng (Kg):
              </label>
              <input
                type="number"
                required
                value={form.capacityKg}
                onChange={(e) => setForm({ ...form, capacityKg: Number(e.target.value) })}
                className="w-full font-mono tabular-nums px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Nhiên Liệu:
              </label>
              <select
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="DIESEL">Dầu Diesel</option>
                <option value="GASOLINE">Xăng RON 95</option>
                <option value="ELECTRIC">Điện (EV Truck)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Odometer (Km):
              </label>
              <input
                type="number"
                required
                value={form.mileageKm}
                onChange={(e) => setForm({ ...form, mileageKm: Number(e.target.value) })}
                className="w-full font-mono tabular-nums px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Hạn Đăng Kiểm:
              </label>
              <input
                type="date"
                required
                value={form.registrationExpiry}
                onChange={(e) => setForm({ ...form, registrationExpiry: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Hạn Bảo Hiểm Dân Sự:
              </label>
              <input
                type="date"
                required
                value={form.insuranceExpiry}
                onChange={(e) => setForm({ ...form, insuranceExpiry: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              <span>Thêm Phương Tiện</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
