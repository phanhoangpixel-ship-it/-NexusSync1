import React, { useState } from 'react';
import { X, Fuel, Plus } from 'lucide-react';
import { Vehicle, Driver, formatVND } from '../types';

interface NewFuelModalProps {
  isOpen: boolean;
  vehicles: Vehicle[];
  drivers: Driver[];
  onClose: () => void;
  onSubmit: (formData: {
    vehicleId: number;
    driverId?: number;
    liters: number;
    pricePerLiter: number;
    mileageAtRefuel: number;
  }) => void;
}

export const NewFuelModal: React.FC<NewFuelModalProps> = ({
  isOpen,
  vehicles,
  drivers,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    vehicleId: vehicles[0]?.id || 1,
    driverId: drivers[0]?.id || 1,
    liters: 120,
    pricePerLiter: 23500,
    mileageAtRefuel: 24500,
  });

  if (!isOpen) return null;

  const totalCost = form.liters * form.pricePerLiter;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      vehicleId: Number(form.vehicleId),
      driverId: form.driverId ? Number(form.driverId) : undefined,
      liters: Number(form.liters),
      pricePerLiter: Number(form.pricePerLiter),
      mileageAtRefuel: Number(form.mileageAtRefuel),
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
              <Fuel className="w-5 h-5" />
            </div>
            <span>Ghi Nhận Giao Dịch Nhiên Liệu (Fuel Log)</span>
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
              Chọn Phương Tiện Tiếp Nhiên Liệu:
            </label>
            <select
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} ({v.vehicleType} - Nhiên liệu: {v.fuelType})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Tài Xế Thực Hiện Tiếp Nhiên Liệu:
            </label>
            <select
              value={form.driverId}
              onChange={(e) => setForm({ ...form, driverId: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} ({d.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Số Lượng Lít:
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={form.liters}
                onChange={(e) => setForm({ ...form, liters: Number(e.target.value) })}
                className="w-full font-mono tabular-nums px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Đơn Giá / Lít (VNĐ):
              </label>
              <input
                type="number"
                step="100"
                required
                value={form.pricePerLiter}
                onChange={(e) => setForm({ ...form, pricePerLiter: Number(e.target.value) })}
                className="w-full font-mono tabular-nums px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Chỉ Số Odometer Lúc Đổ Dầu (Km):
            </label>
            <input
              type="number"
              required
              value={form.mileageAtRefuel}
              onChange={(e) => setForm({ ...form, mileageAtRefuel: Number(e.target.value) })}
              className="w-full font-mono tabular-nums px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-right"
            />
          </div>

          {/* TOTAL PREVIEW */}
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Tổng Chi Phí Nhiên Liệu:</span>
            <span className="font-mono tabular-nums font-bold text-sm text-blue-600 dark:text-blue-400">
              {formatVND(totalCost)}
            </span>
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
              <span>Ghi Nhật Ký Nhiên Liệu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
