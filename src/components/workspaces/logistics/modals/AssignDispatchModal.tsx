import React, { useState } from 'react';
import { X, Truck, Users, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TransportOrder, Vehicle, Driver } from '../types';

interface AssignDispatchModalProps {
  isOpen: boolean;
  order: TransportOrder | null;
  vehicles: Vehicle[];
  drivers: Driver[];
  onClose: () => void;
  onSubmit: (assignData: { vehicleId: string; driverId: string }) => void;
}

export const AssignDispatchModal: React.FC<AssignDispatchModalProps> = ({
  isOpen,
  order,
  vehicles,
  drivers,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    vehicleId: '',
    driverId: '',
  });

  if (!isOpen || !order) return null;

  const selectedVehicle = vehicles.find((v) => v.id === Number(form.vehicleId));
  const selectedDriver = drivers.find((d) => d.id === Number(form.driverId));

  // Pre-dispatch checklist check
  const isVehicleMaintenance = selectedVehicle && (selectedVehicle.status === 'MAINTENANCE' || selectedVehicle.status === 'OUT_OF_SERVICE');
  const isDriverOnLeave = selectedDriver && selectedDriver.status === 'ON_LEAVE';
  const isLicenseExpired = selectedDriver && new Date(selectedDriver.licenseExpiryDate) < new Date();

  const hasPreDispatchIssue = isVehicleMaintenance || isDriverOnLeave || isLicenseExpired;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPreDispatchIssue) return;
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
            <div>
              <span>Điều Vận: Gán Phương Tiện &amp; Tài Xế</span>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold mt-0.5">
                Lệnh: {order.orderCode} • {order.customerName}
              </p>
            </div>
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
              Chọn Phương Tiện Vận Tải (Fleet):
            </label>
            <select
              required
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn xe theo danh sách sẵn sàng --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} ({v.vehicleType}) - Tải: {v.capacityKg} kg - TT: {v.status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Chọn Tài Xế Điều Khiển (Driver Roster):
            </label>
            <select
              required
              value={form.driverId}
              onChange={(e) => setForm({ ...form, driverId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn tài xế hợp lệ --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} (Hạng {d.licenseClass || 'C'} - {d.phone}) - TT: {d.status}
                </option>
              ))}
            </select>
          </div>

          {/* PRE-DISPATCH VALIDATION CHECKLIST */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Pre-Dispatch Safety Checklist (Kiểm Tra Điều Kiện An Toàn)
            </span>

            <div className="space-y-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
              <div className="flex items-center gap-2">
                {isVehicleMaintenance ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <span>
                  Phương tiện đạt chuẩn kỹ thuật &amp; không trong thời gian bảo dưỡng.
                  {isVehicleMaintenance && (
                    <strong className="text-rose-600 dark:text-rose-400 ml-1">
                      (Cảnh báo: Xe đang ở trạng thái {selectedVehicle?.status}!)
                    </strong>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isDriverOnLeave ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <span>
                  Tài xế trong trạng thái sẵn sàng (không nghỉ phép).
                  {isDriverOnLeave && (
                    <strong className="text-rose-600 dark:text-rose-400 ml-1">
                      (Cảnh báo: Tài xế đang nghỉ phép!)
                    </strong>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isLicenseExpired ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <span>
                  Bằng lái GPLX còn hiệu lực pháp lý (Hạn: {selectedDriver?.licenseExpiryDate || 'Chưa chọn'}).
                  {isLicenseExpired && (
                    <strong className="text-rose-600 dark:text-rose-400 ml-1">
                      (Cảnh báo: Bằng lái đã hết hạn!)
                    </strong>
                  )}
                </span>
              </div>
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
              disabled={hasPreDispatchIssue || !form.vehicleId || !form.driverId}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
            >
              Xác Nhận Phân Công &amp; Cấp Lệnh
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
