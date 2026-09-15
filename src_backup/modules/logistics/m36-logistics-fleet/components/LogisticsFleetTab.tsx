import React from 'react';
import { Plus, Truck, Calendar, Gauge, Fuel, ShieldCheck } from 'lucide-react';
import { Vehicle } from './types';

interface LogisticsFleetTabProps {
  vehicles: Vehicle[];
  onOpenNewVehicleModal: () => void;
}

export const LogisticsFleetTab: React.FC<LogisticsFleetTabProps> = ({
  vehicles,
  onOpenNewVehicleModal,
}) => {
  return (
    <div className="space-y-4">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Quản Lý Đội Phương Tiện (Fleet Assets)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý hồ sơ phương tiện, đăng kiểm, bảo hiểm và chỉ số Odometer
          </p>
        </div>
        <button
          onClick={onOpenNewVehicleModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Phương Tiện Mới</span>
        </button>
      </div>

      {/* VEHICLES CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {vehicles.map((v) => {
          const isAvailable = v.status === 'ACTIVE' || (v.status as string) === 'AVAILABLE';
          const isBusy = v.status === 'ASSIGNED' || v.status === 'IN_TRANSIT';

          return (
            <div
              key={v.id}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                  {v.code}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 font-bold rounded-md ${
                    isAvailable
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : isBusy
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {v.status}
                </span>
              </div>

              <div>
                <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
                  {v.plateNumber}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {v.vehicleType} - Tải trọng:{' '}
                  <strong className="font-mono">{v.capacityKg?.toLocaleString('vi-VN')} kg</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 font-sans">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Nhiên liệu:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{v.fuelType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Số KM Odometer:</span>
                  <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                    {v.mileageKm?.toLocaleString('vi-VN')} km
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Hạn đăng kiểm:</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    {v.registrationExpiry || '2027-12-31'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
