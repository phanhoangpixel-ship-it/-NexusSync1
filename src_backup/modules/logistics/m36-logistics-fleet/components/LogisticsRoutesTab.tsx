import React from 'react';
import { MapPin, Truck, Play, X, RotateCcw, Activity, Navigation, Radio } from 'lucide-react';

interface LogisticsRoutesTabProps {
  isSimulating: boolean;
  simProgress: number;
  onToggleSimulating: () => void;
  onResetSimulation: () => void;
}

export const LogisticsRoutesTab: React.FC<LogisticsRoutesTabProps> = ({
  isSimulating,
  simProgress,
  onToggleSimulating,
  onResetSimulation,
}) => {
  return (
    <div className="space-y-4">
      {/* HEADER CONTROL BAR */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Giám Sát Định Tuyến GPS &amp; Tiến Độ Hành Trình Chuyến Xe</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Mô phỏng tọa độ GPS thời gian thực, cảnh báo tốc độ km/h và giám sát điểm dừng Stops
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSimulating}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer ${
              isSimulating
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSimulating ? <X className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isSimulating ? 'Tạm Dừng Giả Lập' : 'Chạy Tọa Độ GPS Chuyến Xe'}</span>
          </button>
          <button
            onClick={onResetSimulation}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-all border border-slate-300 dark:border-slate-600"
            title="Reset vị trí"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TELEMETRY & ROUTE PROGRESS PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* TELEMETRY METRICS */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center justify-between">
            <span>Thông Số Telemetry Xe 29C-882.14</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>4G ONLINE</span>
            </span>
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Tốc độ hiện tại:</span>
              <span className="font-extrabold font-mono text-blue-600 dark:text-blue-400 text-sm">
                {isSimulating ? '58 km/h' : '0 km/h'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Mức nhiên liệu:</span>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                78% (Dầu Diesel)
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Tọa độ GPS:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 text-xs">
                21.0285° N, 105.8542° E
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Nhiệt độ thùng lạnh:</span>
              <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                +4.2 °C (Đạt chuẩn)
              </span>
            </div>
          </div>
        </div>

        {/* ROUTE PROGRESS & TERMINAL */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Tiến Độ Hành Trình Tuyến TRP-2026-001
          </h3>

          <div className="relative pt-4 pb-2">
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${simProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mt-3">
              <div className="flex items-center gap-1 text-slate-900 dark:text-white">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Kho HQ Hà Nội (Origin)</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-mono">
                <Truck className="w-4 h-4 animate-pulse" />
                <span>{simProgress}% hoàn tất</span>
              </div>
              <div className="flex items-center gap-1 text-slate-900 dark:text-white">
                <MapPin className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Viettel Post Nam Từ Liêm (Destination)</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl h-44 overflow-y-auto space-y-1.5 border border-slate-800 shadow-inner">
            <div className="text-slate-500">[SYSTEM] Telematics IoT Gateway v2.4 initialized</div>
            <div>[10:00:12] GPS Ping: Lat 21.0285, Lng 105.8542 | Speed: 0 km/h</div>
            <div>[10:02:45] Geofence Event: Departed [Kho Tổng HQ Hà Nội]</div>
            <div>[10:10:00] Telemetry Normal: Speed 54 km/h | Engine RPM 1850</div>
            {isSimulating && (
              <div className="text-amber-400 animate-pulse">
                [LIVE SIGNAL] GPS location updated via 4G Telematics Gateway... Lat 21.0310, Lng 105.8420
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
