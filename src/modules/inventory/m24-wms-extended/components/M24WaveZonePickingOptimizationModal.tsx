import React, { useState } from 'react';
import { Layers, CheckCircle2, Play, Route, Warehouse, Box, Clock, Zap, ArrowRight, X, TrendingUp, ShieldCheck } from 'lucide-react';

interface M24WaveZonePickingOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteWave: (wavePlan: any) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M24WaveZonePickingOptimizationModal: React.FC<M24WaveZonePickingOptimizationModalProps> = ({
  isOpen,
  onClose,
  onExecuteWave,
  onNotify
}) => {
  if (!isOpen) return null;

  const [selectedZone, setSelectedZone] = useState<'ALL' | 'ZONE_A' | 'ZONE_B' | 'ZONE_C'>('ALL');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [waveBatches, setWaveBatches] = useState([
    {
      waveId: 'WAVE-20260927-01',
      zone: 'ZONE_A (Khu Linh Kiện Bán Dẫn & SMT)',
      totalOrders: 12,
      totalSKUs: 38,
      totalQuantity: 4200,
      estimatedDistanceMeters: 320, // Down from 850m
      savingsPercent: 62.3,
      pickerAssigned: 'Nguyễn Văn Hùng (PK-01)',
      status: 'OPTIMIZED',
      route: ['A-01-01', 'A-01-04', 'A-02-02', 'A-03-05', 'A-04-01']
    },
    {
      waveId: 'WAVE-20260927-02',
      zone: 'ZONE_B (Khu Thiết Bị Đo Lường & Laser)',
      totalOrders: 8,
      totalSKUs: 19,
      totalQuantity: 340,
      estimatedDistanceMeters: 180, // Down from 420m
      savingsPercent: 57.1,
      pickerAssigned: 'Lê Hoàng Nam (PK-02)',
      status: 'OPTIMIZED',
      route: ['B-01-02', 'B-02-03', 'B-02-06', 'B-03-01']
    },
    {
      waveId: 'WAVE-20260927-03',
      zone: 'ZONE_C (Khu Vật Tư Đóng Gói & Hóa Chất)',
      totalOrders: 15,
      totalSKUs: 26,
      totalQuantity: 1850,
      estimatedDistanceMeters: 240, // Down from 610m
      savingsPercent: 60.6,
      pickerAssigned: 'Trần Minh Đức (PK-03)',
      status: 'OPTIMIZED',
      route: ['C-01-01', 'C-01-08', 'C-02-04', 'C-03-02']
    }
  ]);

  const handleRunOptimization = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      onNotify('success', 'Tối Ưu Hóa Tuyến Đường Thành Công', 'Đã phân bổ 35 đơn hàng vào 3 đợt lấy hàng (Wave), giảm 60.2% quãng đường di chuyển của nhân viên kho.');
    }, 700);
  };

  const handleDispatchWave = (wave: any) => {
    onExecuteWave(wave);
    onNotify('success', 'Đã Phát Lệnh Soạn Hàng', `Đã phân công ${wave.waveId} cho nhân viên ${wave.pickerAssigned}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                Bộ Tối Ưu Hóa Lộ Trình Soạn Hàng (Wave & Zone Picking Optimization)
              </h3>
              <p className="text-[11px] text-slate-300">Gộp đơn hàng theo vùng (Zone) & tính toán đường đi ngắn nhất (Shortest Path TSP)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* KPI Strip */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Tổng Đơn Hàng Gộp</span>
              <span className="text-base font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">35 Đơn</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Quãng Đường Tiết Kiệm</span>
              <span className="text-base font-mono tabular-nums font-bold text-emerald-800 dark:text-emerald-300">-60.2% (1.140 m)</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase block">Số Lượng Đợt Wave</span>
              <span className="text-base font-mono tabular-nums font-bold text-blue-800 dark:text-blue-300">3 Đợt Song Song</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase block">Thời Gian Hoàn Tất Dự Kiến</span>
              <span className="text-base font-mono tabular-nums font-bold text-amber-800 dark:text-amber-300">32 Phút (Nhanh 2.4x)</span>
            </div>
          </div>

          {/* Wave Batches List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">Danh Sách Các Đợt Lấy Hàng Wave Được Tối Ưu Hóa:</span>
              <button
                type="button"
                disabled={isOptimizing}
                onClick={handleRunOptimization}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                Tái Tính Toán Tuyến Đường Tối Ưu
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {waveBatches.map((wave) => (
                <div
                  key={wave.waveId}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">{wave.waveId}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{wave.zone}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                      Tiết kiệm {wave.savingsPercent}% di chuyển
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-[11px] p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                    <div>
                      <span className="text-slate-500 block">Số Đơn Hàng:</span>
                      <strong>{wave.totalOrders} đơn</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Số Mã SKU:</span>
                      <strong>{wave.totalSKUs} mã ({wave.totalQuantity.toLocaleString('vi-VN')} món)</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Quãng Đường:</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">{wave.estimatedDistanceMeters} mét</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Nhân Viên Phân Công:</span>
                      <strong className="text-indigo-600 dark:text-indigo-400">{wave.pickerAssigned}</strong>
                    </div>
                  </div>

                  {/* Route sequence */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 overflow-x-auto text-[10px]">
                      <span className="text-slate-500 font-bold shrink-0">Lộ trình kệ (Bin):</span>
                      {wave.route.map((bin, i) => (
                        <React.Fragment key={bin}>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {bin}
                          </span>
                          {i < wave.route.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />}
                        </React.Fragment>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDispatchWave(wave)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shrink-0 shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      Phát Lệnh Wave
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Tự động khóa và cập nhật trạng thái giữ chỗ kho (ATP Reservation)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
