import React from 'react';
import { Eye, Check, X, Wand2, Monitor, ZoomIn, ZoomOut, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useGlobalTheme, calculateSmartFit } from './GlobalThemeProvider';
import { DisplayScaleMode } from '../../types/systemPreferences';

export const PreviewScaleOverlayGuide: React.FC = () => {
  const {
    displayScaleMode,
    previewScaleMode,
    effectiveScalePercentage,
    deviceResolution,
    setPreviewScaleMode,
    commitPreviewScale,
    cancelPreviewScale,
    isPreviewingScale,
  } = useGlobalTheme();

  if (!isPreviewingScale || !previewScaleMode) {
    return null;
  }

  const smartFit = calculateSmartFit(deviceResolution.width, deviceResolution.height);
  const presets: { mode: DisplayScaleMode; label: string }[] = [
    { mode: '75', label: '75%' },
    { mode: '80', label: '80%' },
    { mode: '85', label: '85%' },
    { mode: '90', label: '90%' },
    { mode: '95', label: '95%' },
    { mode: '100', label: '100%' },
    { mode: '110', label: '110%' },
    { mode: '125', label: '125%' },
  ];

  const handleStep = (delta: number) => {
    const numericScales = [75, 80, 85, 90, 95, 100, 105, 110, 125];
    const current = effectiveScalePercentage;
    const closestIdx = numericScales.reduce((prevIdx, currVal, currIdx) => {
      return Math.abs(currVal - current) < Math.abs(numericScales[prevIdx] - current) ? currIdx : prevIdx;
    }, 0);
    const nextIdx = Math.max(0, Math.min(numericScales.length - 1, closestIdx + delta));
    setPreviewScaleMode(numericScales[nextIdx].toString() as DisplayScaleMode);
  };

  return (
    <aside
      id="preview-scale-overlay-guide"
      aria-label="Thử nghiệm tỷ lệ hiển thị"
      className="fixed bottom-5 right-5 z-[99999] w-[360px] max-w-[calc(100vw-40px)] bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md rounded-2xl shadow-2xl border border-blue-500/40 p-4 animate-in fade-in slide-in-from-bottom-4 duration-200 select-none ring-1 ring-blue-400/20"
    >
      {/* Header with Pulse Live Indicator */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white tracking-wide uppercase">Chế độ Thử Nghiệm Tỷ Lệ</span>
          </div>
        </div>

        <button
          id="btn-close-preview-guide"
          type="button"
          onClick={cancelPreviewScale}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          title="Hủy thử nghiệm và quay về tỷ lệ cũ"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Preview Metric HUD */}
      <div className="py-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tỷ lệ đang thử nghiệm</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black font-mono tracking-tight text-cyan-300">
              {effectiveScalePercentage}%
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              ({(effectiveScalePercentage / 100).toFixed(2)}x)
            </span>
          </div>
        </div>

        {/* Step Controls */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            type="button"
            onClick={() => handleStep(-1)}
            disabled={effectiveScalePercentage <= 75}
            className="p-1.5 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-30 rounded-lg text-slate-200 transition-all cursor-pointer"
            title="Giảm 5%"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleStep(1)}
            disabled={effectiveScalePercentage >= 125}
            className="p-1.5 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-30 rounded-lg text-slate-200 transition-all cursor-pointer"
            title="Tăng 5%"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real-time Resolution & Benchmark Diagnostics */}
      <div className="mb-3 p-2 bg-slate-800/60 rounded-xl border border-slate-700/40 text-[11px] space-y-1">
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Monitor className="w-3 h-3 text-slate-400" />
            Khung nhìn:
          </span>
          <span className="font-mono font-bold text-slate-100">{deviceResolution.width} × {deviceResolution.height} px</span>
        </div>
        <div className="flex items-center justify-between text-slate-300">
          <span className="text-[10px] text-slate-400">So với Full HD 1080p:</span>
          <span className="font-mono text-cyan-300">
            {(deviceResolution.width / 1920).toFixed(2)}x chuẩn
          </span>
        </div>
      </div>

      {/* Quick Switch Presets */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400">Chọn nhanh mức thử nghiệm:</span>
          <button
            type="button"
            onClick={() => setPreviewScaleMode(smartFit.scaleMode)}
            className="text-[10px] text-cyan-300 hover:text-cyan-200 flex items-center gap-1 font-bold cursor-pointer"
          >
            <Wand2 className="w-2.5 h-2.5" />
            Smart Fit ({smartFit.scalePercentage}%)
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {presets.map((p) => {
            const isSelected = previewScaleMode === p.mode || (previewScaleMode === 'auto' && effectiveScalePercentage.toString() === p.mode);
            return (
              <button
                key={p.mode}
                type="button"
                onClick={() => setPreviewScaleMode(p.mode)}
                className={`py-1 px-1.5 rounded-lg text-xs font-mono font-bold text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs ring-1 ring-cyan-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Commitment Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
        <button
          id="btn-cancel-preview-scale"
          type="button"
          onClick={cancelPreviewScale}
          className="py-2 px-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Hủy Bỏ</span>
        </button>

        <button
          id="btn-commit-preview-scale"
          type="button"
          onClick={commitPreviewScale}
          className="py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Áp Dụng ({effectiveScalePercentage}%)</span>
        </button>
      </div>
    </aside>
  );
};
