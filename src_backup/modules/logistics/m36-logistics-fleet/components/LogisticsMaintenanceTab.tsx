import React from 'react';
import { Plus, Wrench, Calendar, DollarSign, Building2 } from 'lucide-react';
import { MaintenanceRecord, formatVND } from './types';

interface LogisticsMaintenanceTabProps {
  maintenanceRecords: MaintenanceRecord[];
  onOpenNewMaintModal: () => void;
}

export const LogisticsMaintenanceTab: React.FC<LogisticsMaintenanceTabProps> = ({
  maintenanceRecords,
  onOpenNewMaintModal,
}) => {
  return (
    <div className="space-y-4">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Lịch Bảo Dưỡng &amp; Sửa Chữa Phương Tiện</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Liên kết Phân Hệ M38 (Asset Management)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý nhu cầu bảo trì định kỳ, sửa chữa bất thường và chuyển giao thẩm quyền kỹ thuật sang phân hệ M38
          </p>
        </div>
        <button
          onClick={onOpenNewMaintModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đăng Ký Bảo Trì</span>
        </button>
      </div>

      {/* MAINTENANCE RECORDS TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4">Biển Số Xe</th>
                <th className="py-3 px-4">Loại Bảo Dưỡng / Sửa Chữa</th>
                <th className="py-3 px-4">Ngày Dự Kiến</th>
                <th className="py-3 px-4 text-right">Chi Phí Dự Kiến</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4">Ghi Chú Chuyển Giao Asset (M38)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs text-slate-700 dark:text-slate-300">
              {maintenanceRecords.map((m) => (
                <tr
                  key={m.id}
                  className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150"
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {m.vehiclePlate}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {m.serviceType}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                    {m.scheduledDate}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-right font-bold text-blue-600 dark:text-blue-400">
                    {formatVND(m.estimatedCost)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        m.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                          : m.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-700'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 italic">
                    {m.notes || 'Chuyển tự động từ Logistics Workspace M36'}
                  </td>
                </tr>
              ))}
              {maintenanceRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    Chưa có hồ sơ bảo dưỡng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
