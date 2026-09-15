import React, { useState, useRef, useEffect } from 'react';
import {
  Monitor,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Wand2,
  Laptop,
  Tv,
  CheckCircle2,
  Eye,
  X,
} from 'lucide-react';
import { useGlobalTheme, SmartFitResult, calculateSmartFit } from './GlobalThemeProvider';
import { DisplayScaleMode } from '../../types/systemPreferences';

interface DisplayScaleSelectorProps {
  variant?: 'compact' | 'full' | 'header' | 'drawer';
}

export const DisplayScaleSelector: React.FC<DisplayScaleSelectorProps> = ({ variant = 'header' }) => {
  const {
    displayScaleMode,
    previewScaleMode,
    isPreviewingScale,
    effectiveScalePercentage,
    deviceResolution,
    setDisplayScaleMode,
    setPreviewScaleMode,
    commitPreviewScale,
    cancelPreviewScale,
    applySmartFit,
  } = useGlobalTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [smartFitNotification, setSmartFitNotification] = useState<SmartFitResult | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const scalePresets: { mode: DisplayScaleMode; label: string; desc: string; icon?: string }[] = [
    { mode: 'auto', label: 'Tự động thích ứng (Auto Scale)', desc: `Tự tính theo màn hình: ${effectiveScalePercentage}%`, icon: '🎯' },
    { mode: '75', label: '75% — Siêu gọn (Ultra Compact)', desc: 'Màn hình nhỏ, máy tính bảng hoặc chia đôi cửa sổ' },
    { mode: '80', label: '80% — Gọn nhẹ (Compact)', desc: 'Độ phân giải 1280×720 / Netbook' },
    { mode: '85', label: '85% — Laptop 13"/14"', desc: 'Chuẩn tối ưu cho laptop độ phân giải 1366×768 / 1440×900' },
    { mode: '90', label: '90% — Cân đối ERP (Khuyên dùng)', desc: 'Hiển thị đầy đủ bảng dữ liệu, chống tràn layout' },
    { mode: '95', label: '95% — Vừa vặn (Laptop 15.6")', desc: 'Cân đối chữ & giao diện cho màn hình 1600×900' },
    { mode: '100', label: '100% — Tiêu chuẩn gốc (1080p)', desc: 'Màn hình Full HD 1920×1080 gốc' },
    { mode: '110', label: '110% — Màn hình lớn', desc: 'Màn hình 2K (1440p) / 4K siêu nét' },
    { mode: '125', label: '125% — Phóng lớn', desc: 'Văn bản lớn, dễ đọc từ khoảng cách xa' },
  ];

  const handleStepZoom = (delta: number) => {
    const current = effectiveScalePercentage;
    const next = Math.min(125, Math.max(75, Math.round((current + delta) / 5) * 5));
    const nextMode = `${next}` as DisplayScaleMode;
    if (isPreviewingScale) {
      setPreviewScaleMode(nextMode);
    } else {
      setDisplayScaleMode(nextMode);
    }
  };

  const handleTriggerSmartFit = () => {
    const result = applySmartFit();
    setSmartFitNotification(result);
    setTimeout(() => {
      setSmartFitNotification(null);
    }, 4000);
  };

  const handleStartLivePreview = (targetMode?: DisplayScaleMode) => {
    const initialMode = targetMode || (effectiveScalePercentage.toString() as DisplayScaleMode);
    setPreviewScaleMode(initialMode);
    setIsOpen(false);
  };

  const previewSmartFit = calculateSmartFit(deviceResolution.width, deviceResolution.height);
  const isAuto = displayScaleMode === 'auto';

  // DRAWER VARIANT (Rendered inside SystemPreferencesDrawer)
  if (variant === 'drawer') {
    return (
      <div className="space-y-3 bg-slate-50 dark:bg-slate-850/80 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
            <span>Tỷ Lệ Hiển Thị & Thu Phóng Màn Hình (Display Scale)</span>
          </label>
          <div className="flex items-center gap-1.5">
            {isPreviewingScale && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 animate-pulse">
                Đang Preview
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
              {effectiveScalePercentage}%
            </span>
          </div>
        </div>

        {/* Smart Fit Hero Box */}
        <div className="p-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl shadow-xs border border-blue-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Wand2 className="w-4 h-4 text-cyan-300 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Smart Fit Engine</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-500/30 text-cyan-200 rounded border border-cyan-400/30 font-semibold">
                    1920×1080 Calibrated
                  </span>
                </div>
                <div className="text-[10px] text-slate-300">
                  So sánh độ phân giải thực tế với chuẩn Full HD 1920×1080
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-smart-fit-drawer"
                type="button"
                onClick={handleTriggerSmartFit}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Tính toán và áp dụng tỷ lệ scale tối ưu ngay lập tức"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Smart Fit ({previewSmartFit.scalePercentage}%)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-black/20 p-2 rounded-lg border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Thiết bị hiện tại:</span>
              <span className="font-bold text-slate-200">{deviceResolution.width} × {deviceResolution.height} px</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Chuẩn đối chiếu:</span>
              <span className="font-bold text-cyan-300">1920 × 1080 (1080p)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Tỷ lệ khung nhìn:</span>
              <span className="font-bold text-amber-300">{previewSmartFit.comparisonRatio}x</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Mức Scale đề xuất:</span>
              <span className="font-bold text-emerald-400">{previewSmartFit.scalePercentage}% ({previewSmartFit.scaleMode})</span>
            </div>
          </div>
        </div>

        {/* Live Preview Scaling Mode Controller Box */}
        <div className="p-2.5 bg-cyan-950/30 border border-cyan-500/30 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0">
              <Eye className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Chế Độ Thử Nghiệm Tỷ Lệ (Preview Scaling)</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Xem thử layout và kiểm tra độ vừa vặn trước khi lưu thay đổi.
              </p>
            </div>
          </div>

          <button
            id="btn-toggle-preview-scaling-drawer"
            type="button"
            onClick={() => (isPreviewingScale ? cancelPreviewScale() : handleStartLivePreview())}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              isPreviewingScale
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isPreviewingScale ? 'Đóng Thử Nghiệm' : 'Bật Thử Nghiệm'}</span>
          </button>
        </div>

        {/* Smart Fit Success Notification */}
        {smartFitNotification && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-bold">Đã áp dụng Smart Fit {smartFitNotification.scalePercentage}%: </span>
              <span className="text-[11px]">{smartFitNotification.description}</span>
            </div>
          </div>
        )}

        {/* Presets Grid */}
        <div className="grid grid-cols-3 gap-2">
          {scalePresets.slice(0, 6).map((opt) => (
            <button
              key={opt.mode}
              type="button"
              onClick={() => {
                if (isPreviewingScale) {
                  setPreviewScaleMode(opt.mode);
                } else {
                  setDisplayScaleMode(opt.mode);
                }
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                (isPreviewingScale ? previewScaleMode === opt.mode : displayScaleMode === opt.mode)
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/60 dark:border-blue-700 shadow-xs ring-1 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>{opt.mode === 'auto' ? 'Auto-Fit' : `${opt.mode}%`}</span>
                {(isPreviewingScale ? previewScaleMode === opt.mode : displayScaleMode === opt.mode) && (
                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // HEADER / COMPACT DROPDOWN VARIANT
  return (
    <div className="relative inline-flex items-center shrink-0" ref={menuRef}>
      {/* Trigger Button */}
      <button
        id="btn-display-scale-selector"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-8 flex items-center gap-1.5 px-2.5 rounded-lg border transition-all shrink-0 cursor-pointer shadow-2xs select-none ${
          isPreviewingScale
            ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400 ring-2 ring-amber-300/50 animate-pulse'
            : isAuto
            ? 'bg-blue-50/80 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200 border-blue-200 dark:border-blue-800'
            : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
        }`}
        title={`Điều chỉnh tỷ lệ hiển thị & Scale màn hình: Hiện tại ${effectiveScalePercentage}% (${
          isPreviewingScale ? 'Đang thử nghiệm live' : isAuto ? 'Tự động thích ứng' : 'Thủ công'
        }) — Độ phân giải: ${deviceResolution.width}x${deviceResolution.height}`}
      >
        {isPreviewingScale ? (
          <Eye className="w-3.5 h-3.5 shrink-0 text-white animate-spin" />
        ) : (
          <Monitor className={`w-3.5 h-3.5 shrink-0 ${isAuto ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`} />
        )}
        <span className="text-xs font-mono font-bold whitespace-nowrap">
          {isPreviewingScale ? `Preview: ${effectiveScalePercentage}%` : isAuto ? `Auto (${effectiveScalePercentage}%)` : `${effectiveScalePercentage}%`}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''} opacity-60 shrink-0`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="display-scale-dropdown-panel"
          className="absolute right-0 top-full mt-1.5 w-84 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-2.5 animate-in fade-in zoom-in-95 duration-150 select-none"
        >
          {/* Header Info */}
          <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>Tỷ Lệ Hiển Thị & Mật Độ UI</span>
              </div>
              <div className="flex items-center gap-1">
                {isPreviewingScale && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                    Preview
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  {effectiveScalePercentage}%
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
              Tự động co giãn nội dung theo từng loại thiết bị & độ phân giải màn hình, chống tràn bảng.
            </p>
            {/* Device Info Badge */}
            <div className="mt-2 flex items-center justify-between text-[10px] font-mono bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-400">
              <span>Độ phân giải hiện tại:</span>
              <span className="font-bold text-slate-900 dark:text-slate-200">
                {deviceResolution.width} × {deviceResolution.height} px
              </span>
            </div>
          </div>

          {/* SMART FIT PROMINENT ACTION BUTTON */}
          <div className="mb-2 p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-cyan-200" />
                <span className="text-xs font-bold">Smart Fit (Tối Ưu Thông Minh)</span>
              </div>
              <span className="text-[10px] font-mono font-semibold bg-white/20 px-1.5 py-0.2 rounded">
                vs 1920×1080
              </span>
            </div>
            <p className="text-[10px] text-blue-100 leading-tight">
              So sánh khung nhìn ({deviceResolution.width}px) với chuẩn Full HD 1080p và áp dụng tỷ lệ {previewSmartFit.scalePercentage}%.
            </p>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                id="btn-smart-fit-dropdown"
                type="button"
                onClick={handleTriggerSmartFit}
                className="w-full py-1.5 bg-white hover:bg-blue-50 text-blue-900 font-bold text-[11px] rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Áp Dụng ({previewSmartFit.scalePercentage}%)</span>
              </button>
              <button
                id="btn-smart-fit-preview"
                type="button"
                onClick={() => handleStartLivePreview(previewSmartFit.scaleMode)}
                className="w-full py-1.5 bg-blue-700/80 hover:bg-blue-800 text-white font-bold text-[11px] rounded-lg border border-blue-400/40 transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Bật chế độ thử nghiệm tỷ lệ này trước khi lưu"
              >
                <Eye className="w-3 h-3 text-cyan-300" />
                <span>Thử Nghiệm</span>
              </button>
            </div>
          </div>

          {/* PREVIEW SCALING TOGGLE BAR */}
          <div className="mb-2 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Thử Nghiệm Tỷ Lệ (Preview)</span>
            </div>
            <button
              type="button"
              onClick={() => (isPreviewingScale ? cancelPreviewScale() : handleStartLivePreview())}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isPreviewingScale
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-cyan-600 hover:text-white'
              }`}
            >
              {isPreviewingScale ? 'Đang Bật' : 'Bật Thử'}
            </button>
          </div>

          {/* Smart Fit Success Notification */}
          {smartFitNotification && (
            <div className="mb-2 p-2 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-900 dark:text-emerald-200 text-[11px] flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="font-bold">Đã áp dụng {smartFitNotification.scalePercentage}%! </span>
                <span className="opacity-90">{smartFitNotification.detectedScreenType}</span>
              </div>
            </div>
          )}

          {/* Quick Fine-Tuning Step Controls */}
          <div className="flex items-center justify-between gap-1.5 px-2 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-2 border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => handleStepZoom(-5)}
              disabled={effectiveScalePercentage <= 75}
              className="flex-1 h-7 flex items-center justify-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-600 transition-all disabled:opacity-40 cursor-pointer"
              title="Thu nhỏ 5%"
            >
              <ZoomOut className="w-3.5 h-3.5" />
              <span>- 5%</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (isPreviewingScale) {
                  setPreviewScaleMode('auto');
                } else {
                  setDisplayScaleMode('auto');
                }
              }}
              className={`h-7 px-2.5 flex items-center justify-center gap-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                isAuto && !isPreviewingScale
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-blue-50'
              }`}
              title="Khôi phục chế độ tự động tính theo thiết bị"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto</span>
            </button>
            <button
              type="button"
              onClick={() => handleStepZoom(5)}
              disabled={effectiveScalePercentage >= 125}
              className="flex-1 h-7 flex items-center justify-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-600 transition-all disabled:opacity-40 cursor-pointer"
              title="Phóng to 5%"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>+ 5%</span>
            </button>
          </div>

          {/* Presets List */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {scalePresets.map((preset) => {
              const isSelected = isPreviewingScale
                ? previewScaleMode === preset.mode
                : displayScaleMode === preset.mode;
              return (
                <div
                  key={preset.mode}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-xs transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-bold border border-blue-200 dark:border-blue-800 shadow-2xs'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (isPreviewingScale) {
                        setPreviewScaleMode(preset.mode);
                      } else {
                        setDisplayScaleMode(preset.mode);
                        setIsOpen(false);
                      }
                    }}
                    className="min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      {preset.icon && <span>{preset.icon}</span>}
                      <span className="truncate">{preset.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5">
                      {preset.desc}
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartLivePreview(preset.mode)}
                      className="p-1 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all cursor-pointer"
                      title="Thử nghiệm tỷ lệ này"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


