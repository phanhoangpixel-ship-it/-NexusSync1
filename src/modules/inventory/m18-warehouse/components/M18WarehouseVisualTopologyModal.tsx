import React, { useState } from 'react';
import { Warehouse, Box, Search, CheckCircle2, AlertTriangle, Layers, X, Eye, ShieldCheck, Thermometer, Droplets } from 'lucide-react';

interface M18WarehouseVisualTopologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M18WarehouseVisualTopologyModal: React.FC<M18WarehouseVisualTopologyModalProps> = ({
  isOpen,
  onClose,
  onNotify
}) => {
  if (!isOpen) return null;

  const [selectedZone, setSelectedZone] = useState<'A' | 'B' | 'C'>('A');
  const [selectedBin, setSelectedBin] = useState<any>({
    binCode: 'BIN-A-01-02',
    zone: 'Zone A (Khu Bán Dẫn)',
    capacityPercent: 85,
    maxWeightKg: 1000,
    currentWeightKg: 850,
    temperature: '22.4°C',
    humidity: '45%',
    skuContained: 'PRD-001 (Laptop Business 14)',
    quantity: 45,
    lotNo: 'LOT-2026-0925',
    status: 'ACTIVE'
  });

  // Mock layout grid for Zone A
  const binsGrid = [
    { code: 'BIN-A-01-01', occupancy: 95, color: 'bg-rose-500', label: '95%' },
    { code: 'BIN-A-01-02', occupancy: 85, color: 'bg-amber-500', label: '85%' },
    { code: 'BIN-A-01-03', occupancy: 40, color: 'bg-emerald-500', label: '40%' },
    { code: 'BIN-A-01-04', occupancy: 10, color: 'bg-emerald-400', label: '10%' },
    { code: 'BIN-A-02-01', occupancy: 100, color: 'bg-rose-600', label: 'FULL' },
    { code: 'BIN-A-02-02', occupancy: 70, color: 'bg-amber-400', label: '70%' },
    { code: 'BIN-A-02-03', occupancy: 0, color: 'bg-slate-300 dark:bg-slate-700', label: 'EMPTY' },
    { code: 'BIN-A-02-04', occupancy: 60, color: 'bg-amber-400', label: '60%' },
    { code: 'BIN-A-03-01', occupancy: 80, color: 'bg-amber-500', label: '80%' },
    { code: 'BIN-A-03-02', occupancy: 35, color: 'bg-emerald-500', label: '35%' },
    { code: 'BIN-A-03-03', occupancy: 50, color: 'bg-emerald-500', label: '50%' },
    { code: 'BIN-A-03-04', occupancy: 90, color: 'bg-rose-500', label: '90%' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                Sơ Đồ Trực Quan Không Gian Kho Hàng 2D/3D (Warehouse Visual Topology)
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Heatmap Ô Kệ &amp; Tải Trọng
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">Giám sát sức chứa kệ, nhiệt độ độ ẩm cảm biến IoT và định vị chính xác vị trí hàng</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Zone Selector & Color Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Chọn Khu Vực:</span>
              <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 p-0.5 bg-white dark:bg-slate-900">
                {(['A', 'B', 'C'] as const).map(z => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setSelectedZone(z)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                      selectedZone === z ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Khu Vực {z}
                  </button>
                ))}
              </div>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-300 dark:bg-slate-700"></span> Trống (0%)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> An Toàn (&lt;60%)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Cảnh Báo (60-85%)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-600"></span> Đầy Kệ (&gt;85%)</span>
            </div>
          </div>

          {/* Main 2D Grid + Inspection Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Visual Heatmap Grid */}
            <div className="lg:col-span-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">Mặt Bằng Tầng Kệ (Floor Grid - Zone {selectedZone})</span>
                <span className="font-mono text-slate-500">12 Vị Trí Ô Kệ (Bins)</span>
              </div>

              <div className="grid grid-cols-4 gap-3 py-2">
                {binsGrid.map(bin => {
                  const isSelected = selectedBin.binCode === bin.code;
                  return (
                    <div
                      key={bin.code}
                      onClick={() => setSelectedBin({
                        binCode: bin.code,
                        zone: `Zone ${selectedZone}`,
                        capacityPercent: bin.occupancy,
                        maxWeightKg: 1000,
                        currentWeightKg: Math.round(1000 * (bin.occupancy / 100)),
                        temperature: '22.8°C',
                        humidity: '46%',
                        skuContained: bin.occupancy > 0 ? 'PRD-001 (Laptop Business 14)' : 'Chưa có hàng',
                        quantity: Math.round(bin.occupancy / 2),
                        lotNo: bin.occupancy > 0 ? 'LOT-2026-0925' : 'N/A',
                        status: 'ACTIVE'
                      })}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-24 ${
                        isSelected
                          ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/40 shadow-md'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">{bin.code}</span>
                        <span className={`w-2.5 h-2.5 rounded-full ${bin.color}`}></span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-extrabold text-slate-900 dark:text-white">{bin.label}</span>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                          <div className={`h-full ${bin.color}`} style={{ width: `${bin.occupancy}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Bin Real-time Inspector */}
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-200 dark:border-indigo-800 pb-2">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Chi Tiết Vị Trí Ô Kệ</span>
                  <span className="font-mono font-extrabold text-sm text-indigo-700 dark:text-indigo-400">{selectedBin.binCode}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                  {selectedBin.capacityPercent}% Đầy
                </span>
              </div>

              <div className="space-y-2.5 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Sản Phẩm Tồn Chứa:</span>
                  <strong className="text-slate-900 dark:text-white block mt-0.5">{selectedBin.skuContained}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Số Lượng Thực Tế:</span>
                  <strong className="font-mono">{selectedBin.quantity} đơn vị</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Số Lô (Lot Number):</span>
                  <strong className="font-mono text-indigo-600 dark:text-indigo-400">{selectedBin.lotNo}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tải Trọng Kệ:</span>
                  <strong className="font-mono">{selectedBin.currentWeightKg} / {selectedBin.maxWeightKg} kg</strong>
                </div>

                <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                    <span>Nhiệt độ: <strong>{selectedBin.temperature}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" />
                    <span>Độ ẩm: <strong>{selectedBin.humidity}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Đồng bộ thời gian thực với Inventory Core Ledger (M18 &amp; M24)
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
