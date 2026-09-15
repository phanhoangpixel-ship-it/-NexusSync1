import React from 'react';
import { Plus, Users, ShieldAlert, Award, Phone, Calendar, ShieldCheck } from 'lucide-react';
import { Driver, DriverSafetyScore, formatVND } from './types';

interface LogisticsDriversTabProps {
  drivers: Driver[];
  safetyScores: DriverSafetyScore[];
  onOpenNewDriverModal: () => void;
}

export const LogisticsDriversTab: React.FC<LogisticsDriversTabProps> = ({
  drivers,
  safetyScores,
  onOpenNewDriverModal,
}) => {
  return (
    <div className="space-y-6">
      {/* DRIVERS PROFILE SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Hồ Sơ &amp; Năng Lực Đội Ngũ Tài Xế
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Giấy phép lái xe (GPLX), thời hạn, độ khả dụng và đánh giá hiệu suất
            </p>
          </div>
          <button
            onClick={onOpenNewDriverModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Tài Xế Mới</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {drivers.map((d) => {
            const isAvailable = d.status === 'AVAILABLE';
            const isOnTrip = d.status === 'ON_TRIP' || d.status === 'ASSIGNED';

            return (
              <div
                key={d.id}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                    {d.code}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 font-bold rounded-md ${
                      isAvailable
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : isOnTrip
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {d.status}
                  </span>
                </div>

                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">{d.fullName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium font-mono mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{d.phone}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Hạng GPLX:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                      {d.licenseClass || 'FC'} ({d.licenseNumber})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Hạn GPLX:</span>
                    <span className="font-medium font-mono text-emerald-600 dark:text-emerald-400">
                      {d.licenseExpiryDate}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ECO-DRIVING & SAFETY SCOREBOARD */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Bảng Điểm Lái Xe An Toàn &amp; Tiết Kiệm Nhiên Liệu (Eco-Driving)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Phân tích dữ liệu vận tốc, phanh gấp từ thiết bị Telematics để xếp hạng và thưởng tài xế
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">Tài Xế</th>
                  <th className="py-3 px-4 text-center">Điểm An Toàn</th>
                  <th className="py-3 px-4">Phân Hạng</th>
                  <th className="py-3 px-4 text-center">Phanh Gấp</th>
                  <th className="py-3 px-4 text-center">Quá Tốc Độ</th>
                  <th className="py-3 px-4 text-center">Tiết Kiệm (Eco)</th>
                  <th className="py-3 px-4 text-right">Thưởng An Toàn (VND)</th>
                  <th className="py-3 px-4">Đề Xuất Đào Tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs text-slate-700 dark:text-slate-300">
                {safetyScores.map((s) => (
                  <tr
                    key={s.driverId}
                    className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{s.fullName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {s.driverCode} - GPLX {s.licenseClass}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-sm font-extrabold font-mono ${
                          s.safetyScore >= 90
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : s.safetyScore >= 80
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {s.safetyScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {s.tier}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {s.hardBrakingCount} lần
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {s.overspeedEvents} lần
                    </td>
                    <td className="py-3 px-4 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {s.ecoSavingsLiters} Lít
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-right font-bold text-blue-600 dark:text-blue-400">
                      {formatVND(s.safetyBonusVND)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 italic">
                      {s.courseRecommendation}
                    </td>
                  </tr>
                ))}
                {safetyScores.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                      Chưa có dữ liệu phân tích an toàn.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
