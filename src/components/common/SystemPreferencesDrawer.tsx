import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Settings,
  Monitor,
  Volume2,
  VolumeX,
  Languages,
  DollarSign,
  ShieldAlert,
  Database,
  Printer,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Layout,
  Sliders,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Keyboard,
  Sun,
  Moon,
  Clock,
  Laptop,
  Eye,
  Cpu,
  Trash2,
  Zap,
  HardDrive,
  RefreshCw,
  Server,
  FileJson,
  BookOpen,
  Network,
  Route,
  ShieldCheck,
  ArrowRight,
  Layers,
} from 'lucide-react';
import {
  SystemPreferences,
  DisplayDensity,
  AppTheme,
  AutoThemeMode,
  SystemLanguage,
  CurrencyFormat,
} from '../../types/systemPreferences';
import { MODULE_REGISTRY } from '../../config/moduleRegistry';
import { workspaceCacheManager, CacheManagerStats } from '../../utils/workspaceCacheManager';
import { DisplayScaleSelector } from './DisplayScaleSelector';

interface SystemPreferencesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: SystemPreferences;
  onUpdatePreferences: (prefs: SystemPreferences) => void;
  effectiveTheme?: AppTheme;
}

export const SystemPreferencesDrawer: React.FC<SystemPreferencesDrawerProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  effectiveTheme,
}) => {
  const [activeTab, setActiveTab] = useState<'ui' | 'localization' | 'system' | 'guide'>('ui');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheManagerStats>(() => workspaceCacheManager.getStats());
  const [isPurgingMemory, setIsPurgingMemory] = useState(false);
  const [masterCacheMetrics, setMasterCacheMetrics] = useState<{
    hitRatio: number;
    totalHits: number;
    totalMisses: number;
    keysCount: number;
    invalidationsCount: number;
  } | null>(null);
  const [isFlushingMasterCache, setIsFlushingMasterCache] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMasterCacheMetrics = async () => {
    try {
      const token = localStorage.getItem('nexus_token') || 'token_dev_hoangnam';
      const res = await fetch('/api/master-data/cache/metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMasterCacheMetrics(data.data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'system') {
      fetchMasterCacheMetrics();
      const interval = setInterval(fetchMasterCacheMetrics, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeTab]);

  const handleFlushMasterCache = async (tag?: string) => {
    setIsFlushingMasterCache(true);
    try {
      const token = localStorage.getItem('nexus_token') || 'token_dev_hoangnam';
      const res = await fetch('/api/master-data/cache/flush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(tag ? { tag } : {})
      });
      const data = await res.json();
      if (data.success) {
        showInternalToast(`⚡ ${data.message}`);
        await fetchMasterCacheMetrics();
      }
    } catch {
      showInternalToast("❌ Không thể làm mới cache Master Data.");
    } finally {
      setIsFlushingMasterCache(false);
    }
  };

  useEffect(() => {
    return workspaceCacheManager.subscribe((stats) => {
      setCacheStats(stats);
    });
  }, []);

  useEffect(() => {
    workspaceCacheManager.configure({
      autoCleaningEnabled: preferences.autoCacheCleaningEnabled,
      retentionMinutes: preferences.cacheRetentionMinutes || 3,
      maxInactiveWorkspaces: preferences.maxCachedWorkspaces || 3,
    });
  }, [preferences.autoCacheCleaningEnabled, preferences.cacheRetentionMinutes, preferences.maxCachedWorkspaces]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showInternalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateField = <K extends keyof SystemPreferences>(key: K, value: SystemPreferences[K]) => {
    const updated = { ...preferences, [key]: value };
    onUpdatePreferences(updated);
    showInternalToast(`Đã lưu cấu hình: ${String(key).toUpperCase()} = ${String(value)}`);
  };

  // Play a synthesized confirmation alert sound using standard Web Audio API
  const playSampleSound = () => {
    if (!preferences.alertSoundEnabled) {
      showInternalToast("Âm thanh đang bị tắt trong cài đặt!");
      return;
    }
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Dual tone synth
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(293.66, ctx.currentTime); // D4
      osc2.frequency.setValueAtTime(440.00, ctx.currentTime + 0.15); // A4
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.4);
      
      showInternalToast("🔊 Đã phát âm thanh thử nghiệm (EDA Dual-Tone Alert)");
    } catch (e) {
      console.warn("Web Audio không được hỗ trợ hoặc bị chặn bởi trình duyệt:", e);
    }
  };

  const handlePurgeAllMemory = () => {
    setIsPurgingMemory(true);
    setTimeout(() => {
      const result = workspaceCacheManager.purgeAllInactiveWorkspaces();
      setIsPurgingMemory(false);
      if (result.count > 0) {
        showInternalToast(`🧹 Đã giải phóng ${result.freedMB} MB RAM từ ${result.count} phân hệ không hoạt động.`);
      } else {
        showInternalToast("✨ Toàn bộ bộ nhớ đệm phân hệ đã ở trạng thái tối ưu.");
      }
    }, 300);
  };

  const handleResetDefaults = () => {
    const defaultPrefs: SystemPreferences = {
      density: 'cozy',
      theme: 'light',
      autoThemeMode: 'system',
      scheduleStartDark: '18:00',
      scheduleEndDark: '06:00',
      language: 'vi',
      currency: 'VND',
      currencySymbol: '₫',
      currencyPosition: 'suffix',
      thousandSeparator: '.',
      decimalSeparator: ',',
      defaultLandingModule: 'M01',
      sessionTimeoutMinutes: 30,
      offlineCachingEnabled: true,
      alertSoundEnabled: true,
      keyboardShortcutsEnabled: true,
      autoCacheCleaningEnabled: true,
      cacheRetentionMinutes: 3,
      maxCachedWorkspaces: 3,
    };
    onUpdatePreferences(defaultPrefs);
    showInternalToast("Đã khôi phục cài đặt mặc định gốc của hệ thống.");
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Cấu hình Thiết lập Hệ thống - NexusSync ERP</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
            h1 { font-size: 24px; color: #0f172a; margin-bottom: 5px; }
            p { font-size: 13px; color: #64748b; margin-bottom: 30px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
            .card-title { font-weight: bold; font-size: 14px; text-transform: uppercase; margin-bottom: 10px; color: #1e3a8a; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
            .row { display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0; border-bottom: 1px solid #f8fafc; }
            .row span:last-child { font-weight: bold; color: #0f172a; }
          </style>
        </head>
        <body>
          <h1>Báo cáo Thiết lập Cá nhân & Hệ thống (System Preferences Log)</h1>
          <p>NexusSync ERP | Ngày cấu hình cuối: ${new Date().toLocaleString('vi-VN')} | Người lập: phanhoangpixel@gmail.com</p>
          
          <div class="grid">
            <div class="card">
              <div class="card-title">Giao diện & Hiển thị</div>
              <div class="row"><span>Mật độ hiển thị (Density)</span><span>${preferences.density.toUpperCase()}</span></div>
              <div class="row"><span>Chế độ Theme tự động</span><span>${preferences.autoThemeMode === 'system' ? 'THEO HỆ ĐIỀU HÀNH (OS)' : preferences.autoThemeMode === 'schedule' ? `THEO KHUNG GIỜ (${preferences.scheduleStartDark} - ${preferences.scheduleEndDark})` : 'THỦ CÔNG'}</span></div>
              <div class="row"><span>Theme đang áp dụng</span><span>${(effectiveTheme || preferences.theme).toUpperCase()}</span></div>
              <div class="row"><span>Lối tắt bàn phím (Hotkeys)</span><span>${preferences.keyboardShortcutsEnabled ? 'ĐÃ BẬT' : 'ĐÃ TẮT'}</span></div>
            </div>
            
            <div class="card">
              <div class="card-title">Định dạng & Địa phương hóa</div>
              <div class="row"><span>Ngôn ngữ làm việc</span><span>${preferences.language === 'vi' ? 'Tiếng Việt' : preferences.language === 'en' ? 'English' : 'Japanese'}</span></div>
              <div class="row"><span>Định dạng tiền tệ</span><span>${preferences.currency}</span></div>
              <div class="row"><span>Màn hình khởi chạy</span><span>${preferences.defaultLandingModule}</span></div>
            </div>

            <div class="card">
              <div class="card-title">Bảo mật & Cố định dữ liệu</div>
              <div class="row"><span>Thời gian tự khóa phiên (SLA)</span><span>${preferences.sessionTimeoutMinutes} phút</span></div>
              <div class="row"><span>Đồng bộ đệm ngoại tuyến</span><span>${preferences.offlineCachingEnabled ? 'ĐÃ KÍCH HOẠT' : 'ĐÃ TẮT'}</span></div>
              <div class="row"><span>Âm thanh cảnh báo sự kiện</span><span>${preferences.alertSoundEnabled ? 'ĐÃ BẬT' : 'ĐÃ MUTE'}</span></div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportJSON = () => {
    const payload = {
      app: 'NexusSync ERP',
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      user: 'phanhoangpixel@gmail.com',
      preferences
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nexussync_preferences_${new Date().toISOString().slice(0, 10)}.json`);
    downloadAnchor.click();
    showInternalToast("📥 Đã xuất và tải tệp sao lưu JSON cấu hình về máy.");
  };

  const handleImportJSONClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Support both raw SystemPreferences JSON or wrapped format
        const importedPrefs: Partial<SystemPreferences> = parsed.preferences ? parsed.preferences : parsed;

        // Validation of essential preference fields
        if (
          !importedPrefs ||
          typeof importedPrefs !== 'object' ||
          (!importedPrefs.density && !importedPrefs.theme && !importedPrefs.language && !importedPrefs.currency)
        ) {
          throw new Error("Định dạng JSON cấu hình không hợp lệ.");
        }

        // Merge with current preferences ensuring safety and completeness
        const merged: SystemPreferences = {
          ...preferences,
          ...importedPrefs,
        };

        // Specific enum safety guards
        if (importedPrefs.density && ['cozy', 'compact', 'spaced'].includes(importedPrefs.density)) {
          merged.density = importedPrefs.density;
        }
        if (importedPrefs.theme && ['light', 'cool-dark', 'warm-sepia'].includes(importedPrefs.theme)) {
          merged.theme = importedPrefs.theme;
        }
        if (importedPrefs.autoThemeMode && ['manual', 'system', 'schedule'].includes(importedPrefs.autoThemeMode)) {
          merged.autoThemeMode = importedPrefs.autoThemeMode;
        }
        if (importedPrefs.language && ['vi', 'en', 'ja'].includes(importedPrefs.language)) {
          merged.language = importedPrefs.language;
        }
        if (importedPrefs.currency && ['VND', 'USD', 'EUR'].includes(importedPrefs.currency)) {
          merged.currency = importedPrefs.currency;
        }

        onUpdatePreferences(merged);
        showInternalToast("✅ Đã nhập và áp dụng thành công cấu hình từ tệp JSON!");
      } catch (err: any) {
        showInternalToast(`❌ Lỗi nhập cấu hình: ${err?.message || "Tệp JSON không đúng định dạng"}`);
      }
    };
    reader.readAsText(file);
  };

  const currentActiveTheme = effectiveTheme || preferences.theme;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end animate-fade-in cursor-pointer select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-left border-l border-slate-200 cursor-default select-text"
      >
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-950 text-white">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-blue-500 animate-spin-slow" />
            <div>
              <h3 className="text-sm font-bold">Preferences Control Panel</h3>
              <p className="text-[10px] text-slate-400">Thiết lập cấu hình vận hành và hệ thống</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4">
          <button
            onClick={() => setActiveTab('ui')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ui'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Giao diện & UI</span>
          </button>
          <button
            onClick={() => setActiveTab('localization')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'localization'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>Định dạng & Địa phương</span>
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'system'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Hệ thống</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Trợ giúp & Định hướng</span>
          </button>
        </div>

        {/* Toolbar & Backups */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-1.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset mặc định</span>
          </button>

          {/* Hidden File Input for JSON Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json,application/json"
            className="hidden"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handlePrint}
              title="In cấu hình hoạt động"
              className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleImportJSONClick}
              title="Nhập cấu hình từ tệp JSON (Import)"
              className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-blue-600 rounded-lg transition-colors shadow-2xs flex items-center gap-1 text-[11px] font-semibold"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden xs:inline">Nhập</span>
            </button>
            <button
              onClick={handleExportJSON}
              title="Xuất tệp sao lưu JSON (Export)"
              className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-blue-600 rounded-lg transition-colors shadow-2xs flex items-center gap-1 text-[11px] font-semibold"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden xs:inline">Xuất</span>
            </button>
          </div>
        </div>

        {/* Internal micro toast feedback */}
        {toastMessage && (
          <div className="mx-4 mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[10px] font-bold flex items-center gap-1.5 animate-pulse">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Form Fields */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {activeTab === 'ui' && (
            <div className="space-y-5">
              
              {/* Eye-Care & Auto Theme Mode Selector */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Bảo vệ mắt & Chuyển Theme tự động
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Sync</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('autoThemeMode', 'system')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      preferences.autoThemeMode === 'system'
                        ? 'border-blue-500 bg-blue-600/30 text-white ring-1 ring-blue-400/40'
                        : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <Laptop className="w-3.5 h-3.5 text-blue-400" />
                      <span>Theo OS</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1">Đồng bộ theo hệ điều hành</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateField('autoThemeMode', 'schedule')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      preferences.autoThemeMode === 'schedule'
                        ? 'border-blue-500 bg-blue-600/30 text-white ring-1 ring-blue-400/40'
                        : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Khung giờ</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1">Tối chuyển Dark, sáng Light</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateField('autoThemeMode', 'manual')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      preferences.autoThemeMode === 'manual'
                        ? 'border-blue-500 bg-blue-600/30 text-white ring-1 ring-blue-400/40'
                        : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <Sliders className="w-3.5 h-3.5 text-slate-400" />
                      <span>Thủ công</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1">Chọn cố định theo ý muốn</div>
                  </button>
                </div>

                {/* Schedule Configuration Detail if 'schedule' mode */}
                {preferences.autoThemeMode === 'schedule' && (
                  <div className="mt-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2.5 animate-fade-in">
                    <div className="text-[11px] font-semibold text-slate-200 flex items-center justify-between">
                      <span>Cài đặt giờ bật Cool-Dark bảo vệ mắt:</span>
                      <span className="text-[10px] text-amber-400 font-mono">
                        {preferences.scheduleStartDark || '18:00'} ➔ {preferences.scheduleEndDark || '06:00'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                          <Moon className="w-3 h-3 text-blue-400" />
                          <span>Bắt đầu ca tối (Dark):</span>
                        </label>
                        <input
                          type="time"
                          value={preferences.scheduleStartDark || '18:00'}
                          onChange={(e) => updateField('scheduleStartDark', e.target.value)}
                          className="w-full text-xs font-mono bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                          <Sun className="w-3 h-3 text-amber-400" />
                          <span>Bắt đầu ca sáng (Light):</span>
                        </label>
                        <input
                          type="time"
                          value={preferences.scheduleEndDark || '06:00'}
                          onChange={(e) => updateField('scheduleEndDark', e.target.value)}
                          className="w-full text-xs font-mono bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Live theme status pill */}
                <div className="mt-3 flex items-center justify-between text-[10px] pt-2 border-t border-slate-800 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    {currentActiveTheme === 'cool-dark' ? (
                      <Moon className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>
                      Đang áp dụng:{' '}
                      <strong className="text-white">
                        {currentActiveTheme === 'cool-dark'
                          ? 'Cool Tech Dark'
                          : currentActiveTheme === 'warm-sepia'
                          ? 'Warm Sepia'
                          : 'Light Minimalist'}
                      </strong>
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 italic">
                    {preferences.autoThemeMode === 'system'
                      ? '(Tự động theo OS)'
                      : preferences.autoThemeMode === 'schedule'
                      ? '(Theo khung giờ)'
                      : '(Lựa chọn thủ công)'}
                  </span>
                </div>
              </div>

              {/* Theme Selector (Custom Palette) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-500" />
                  <span>Bảng màu chủ đạo (Theme Palette)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateField('theme', 'light');
                      if (preferences.autoThemeMode !== 'manual') {
                        updateField('autoThemeMode', 'manual');
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      preferences.theme === 'light'
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900">Light Minimalist</div>
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Giao diện sáng ấm tiêu chuẩn</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateField('theme', 'cool-dark');
                      if (preferences.autoThemeMode !== 'manual') {
                        updateField('autoThemeMode', 'manual');
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      preferences.theme === 'cool-dark'
                        ? 'border-blue-600 bg-slate-900 text-white shadow-sm ring-1 ring-blue-500/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold">Cool Tech Dark</div>
                      <Moon className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Bảo vệ mắt khi làm ca tối</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateField('theme', 'warm-sepia');
                      if (preferences.autoThemeMode !== 'manual') {
                        updateField('autoThemeMode', 'manual');
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      preferences.theme === 'warm-sepia'
                        ? 'border-blue-600 bg-amber-50/70 shadow-sm ring-1 ring-blue-500/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-amber-900">Warm Sepia</div>
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="text-[10px] text-amber-800/80 mt-1">Dịu mắt, phù hợp đọc chứng từ</div>
                  </button>
                </div>
              </div>

              {/* Display Density */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5 text-blue-500" />
                  <span>Mật độ hiển thị (Display Density)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'spaced', label: 'Spaced (Thông thoáng)', desc: '16px padding' },
                    { id: 'cozy', label: 'Cozy (Tiêu chuẩn)', desc: '12px padding' },
                    { id: 'compact', label: 'Compact (Tinh gọn)', desc: '8px padding' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => updateField('density', opt.id as DisplayDensity)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        preferences.density === opt.id
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/10'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{opt.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Resolution Scaling & Zoom Engine */}
              <div>
                <DisplayScaleSelector variant="drawer" />
              </div>

              {/* Keyboard Shortcuts Toggle */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Keyboard className="w-4 h-4 text-slate-500" />
                    <span>Lối tắt bàn phím thông minh (Hotkeys)</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">Kích hoạt phím nhanh để điều hướng nhanh các phân hệ chính.</p>
                </div>
                <button
                  onClick={() => updateField('keyboardShortcutsEnabled', !preferences.keyboardShortcutsEnabled)}
                  className={`w-10 h-6 rounded-full p-1 transition-all ${preferences.keyboardShortcutsEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${preferences.keyboardShortcutsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'localization' && (
            <div className="space-y-5">
              {/* Language Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-blue-500" />
                  <span>Ngôn ngữ làm việc (System Language)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'vi', title: 'Tiếng Việt', subtitle: 'Hệ thống chuẩn' },
                    { id: 'en', title: 'English', subtitle: 'Global format' },
                    { id: 'ja', title: '日本語', subtitle: 'Bản dịch bổ trợ' }
                  ].map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => updateField('language', lang.id as SystemLanguage)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        preferences.language === lang.id
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{lang.title}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{lang.subtitle}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency & Number Formatting Advanced Settings */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Cấu hình Tiền tệ & Định dạng số học</h4>
                  </div>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-bold">
                    Global Sync
                  </span>
                </div>

                {/* Currency Symbol Customizer */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ký hiệu Tiền tệ Tùy chỉnh (Currency Symbol)</label>
                  <div className="flex items-center gap-2 mb-2">
                    {['₫', '$', '€', '¥', '£', 'CHF'].map((sym) => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => updateField('currencySymbol', sym)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono transition-all ${
                          (preferences.currencySymbol || '₫') === sym
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={preferences.currencySymbol || '₫'}
                    onChange={(e) => updateField('currencySymbol', e.target.value)}
                    placeholder="Nhập ký hiệu tùy chỉnh (VD: VNĐ, USD, CR...)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white text-slate-800"
                  />
                </div>

                {/* Currency Position */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Vị trí Ký hiệu Tiền tệ (Currency Position)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateField('currencyPosition', 'prefix')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        (preferences.currencyPosition || 'suffix') === 'prefix'
                          ? 'border-blue-600 bg-blue-50/70 font-bold text-blue-900'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">Tiền tố (Prefix)</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">VD: {(preferences.currencySymbol || '₫')}1.250.000</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('currencyPosition', 'suffix')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        (preferences.currencyPosition || 'suffix') === 'suffix'
                          ? 'border-blue-600 bg-blue-50/70 font-bold text-blue-900'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">Hậu tố (Suffix)</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">VD: 1.250.000 {(preferences.currencySymbol || '₫')}</div>
                    </button>
                  </div>
                </div>

                {/* Separators Configuration */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phân cách Hàng nghìn</label>
                    <select
                      value={preferences.thousandSeparator || '.'}
                      onChange={(e) => updateField('thousandSeparator', e.target.value as '.' | ',')}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono text-slate-800"
                    >
                      <option value=".">Dấu chấm (.) [1.250.000]</option>
                      <option value=",">Dấu phẩy (,) [1,250,000]</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phân cách Thập phân</label>
                    <select
                      value={preferences.decimalSeparator || ','}
                      onChange={(e) => updateField('decimalSeparator', e.target.value as ',' | '.')}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono text-slate-800"
                    >
                      <option value=",">Dấu phẩy (,) [172,30]</option>
                      <option value=".">Dấu chấm (.) [172.30]</option>
                    </select>
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] font-bold text-blue-900 uppercase">Xem trước định dạng (Live Preview):</div>
                    <div className="font-mono font-bold text-blue-800 text-sm mt-0.5">
                      {(() => {
                        const sym = preferences.currencySymbol || '₫';
                        const pos = preferences.currencyPosition || 'suffix';
                        const th = preferences.thousandSeparator || '.';
                        const dec = preferences.decimalSeparator || ',';
                        const raw = '1250000000';
                        const formattedInt = raw.replace(/\B(?=(\d{3})+(?!\d))/g, th === '.' ? '.' : ',');
                        const sampleNum = `${formattedInt}${dec}50`;
                        return pos === 'prefix' ? `${sym} ${sampleNum}` : `${sampleNum} ${sym}`;
                      })()}
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-600 bg-white px-2 py-1 rounded-lg border border-blue-200 font-mono">
                    Áp dụng toàn ERP
                  </span>
                </div>
              </div>

              {/* Default Landing Module */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Màn hình mặc định khi khởi động (Default Landing Module)
                </label>
                <select
                  value={preferences.defaultLandingModule}
                  onChange={(e) => updateField('defaultLandingModule', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                >
                  {MODULE_REGISTRY.slice(0, 15).map(mod => (
                    <option key={mod.moduleId} value={mod.moduleId}>
                      {mod.moduleId} - {mod.moduleName}
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 mt-1.5">
                  Phân hệ này sẽ tự động tải lên ngay lập tức sau khi người dùng vượt qua chốt đăng nhập hệ thống.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-5">
              {/* Session SLA Timeout */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Thời hạn tự động khóa phiên (Session Timeout SLA)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 60, 1440].map(mins => (
                    <button
                      key={mins}
                      onClick={() => updateField('sessionTimeoutMinutes', mins)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        preferences.sessionTimeoutMinutes === mins
                          ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-700'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                      }`}
                    >
                      <div className="text-xs">{mins === 1440 ? '24 giờ' : `${mins} phút`}</div>
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-slate-400 mt-1.5">
                  Hệ thống tự khóa phiên và yêu cầu xác thực lại mã pin bảo mật để tránh rò rỉ dữ liệu ngoài ý muốn.
                </p>
              </div>

              {/* Auto Cache Cleaning & RAM Management */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Tự động dọn dẹp bộ nhớ đệm (Cache Cleaning)</span>
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          Rule #Auto-GC
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Tự động giải phóng RAM và hủy bỏ dữ liệu đệm của các Workspace đã đóng trong các phiên làm việc kéo dài.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateField('autoCacheCleaningEnabled', !preferences.autoCacheCleaningEnabled)}
                    className={`w-10 h-6 rounded-full p-1 transition-all shrink-0 ${preferences.autoCacheCleaningEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-all ${preferences.autoCacheCleaningEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Memory Health Live Monitor Card */}
                <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                      <span>Giám sát Bộ nhớ Heap / RAM:</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {cacheStats.estimatedTotalMemoryMB} MB
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-slate-400">Đang hoạt động</div>
                      <div className="font-mono font-bold text-blue-600 text-xs mt-0.5">
                        {cacheStats.activeWorkspacesCount} Workspace
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-slate-400">Đang lưu đệm</div>
                      <div className="font-mono font-bold text-amber-600 text-xs mt-0.5">
                        {cacheStats.inactiveWorkspacesCount} Closed
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-slate-400">Đã giải phóng</div>
                      <div className="font-mono font-bold text-emerald-600 text-xs mt-0.5">
                        {cacheStats.estimatedFreedMemoryMB} MB
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Chu kỳ GC: <span className="font-mono font-bold text-slate-600">{cacheStats.totalCleaningCycles}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handlePurgeAllMemory}
                      disabled={isPurgingMemory}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all shadow-2xs"
                    >
                      {isPurgingMemory ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                      ) : (
                        <Trash2 className="w-3 h-3 text-blue-600" />
                      )}
                      <span>Dọn dẹp RAM ngay</span>
                    </button>
                  </div>
                </div>

                {/* Master Data In-Memory Cache Monitoring */}
                <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Server className="w-3.5 h-3.5 text-blue-500" />
                      <span>Master Data In-Memory Caching:</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-600">
                      {masterCacheMetrics ? `${masterCacheMetrics.hitRatio}% Hit Ratio` : 'Sẵn sàng'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-slate-400">Tỉ lệ Hit</div>
                      <div className="font-mono font-bold text-emerald-600 text-xs mt-0.5">
                        {masterCacheMetrics?.hitRatio ?? 0}%
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-slate-400">Tổng Hits</div>
                      <div className="font-mono font-bold text-blue-600 text-xs mt-0.5">
                        {masterCacheMetrics?.totalHits ?? 0}
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-slate-400">Keys hoạt động</div>
                      <div className="font-mono font-bold text-indigo-600 text-xs mt-0.5">
                        {masterCacheMetrics?.keysCount ?? 0}
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-slate-400">Đã Invalidate</div>
                      <div className="font-mono font-bold text-amber-600 text-xs mt-0.5">
                        {masterCacheMetrics?.invalidationsCount ?? 0}
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      TTL: <span className="font-mono font-bold text-slate-600">60-120s</span> (Auto-eviction)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleFlushMasterCache('products')}
                        disabled={isFlushingMasterCache}
                        className="px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-all"
                        title="Xóa đệm danh mục sản phẩm & tồn kho"
                      >
                        Flush Products
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFlushMasterCache()}
                        disabled={isFlushingMasterCache}
                        className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-all shadow-2xs"
                      >
                        {isFlushingMasterCache ? (
                          <RefreshCw className="w-2.5 h-2.5 animate-spin text-emerald-600" />
                        ) : (
                          <Zap className="w-2.5 h-2.5 text-emerald-600" />
                        )}
                        <span>Làm mới toàn bộ</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Eviction Retention Time */}
                {preferences.autoCacheCleaningEnabled && (
                  <div className="space-y-2 pt-1 border-t border-slate-200/50">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">
                        Thời gian lưu đệm Workspace đã đóng (Retention TTL):
                      </label>
                      <span className="text-xs font-mono font-bold text-blue-600">
                        {preferences.cacheRetentionMinutes || 3} phút
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 3, 5, 10].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => updateField('cacheRetentionMinutes', mins)}
                          className={`p-1.5 rounded-lg border text-center text-xs transition-all ${
                            (preferences.cacheRetentionMinutes || 3) === mins
                              ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-700'
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                          }`}
                        >
                          {mins} phút
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Offline Caching */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-slate-500" />
                    <span>Bộ nhớ đệm ngoại tuyến (Offline cache)</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">Tự động đồng bộ hóa hóa đơn, chứng từ tạm thời khi mất kết nối mạng.</p>
                </div>
                <button
                  onClick={() => updateField('offlineCachingEnabled', !preferences.offlineCachingEnabled)}
                  className={`w-10 h-6 rounded-full p-1 transition-all ${preferences.offlineCachingEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${preferences.offlineCachingEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Alert Sound Controller */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    {preferences.alertSoundEnabled ? <Volume2 className="w-4 h-4 text-blue-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    <span>Âm thanh cảnh báo Sự kiện (Sound Alert)</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">Phát cảnh báo âm lượng vừa phải khi có phát sinh thông báo khẩn.</p>
                </div>
                <div className="flex items-center gap-2">
                  {preferences.alertSoundEnabled && (
                    <button
                      onClick={playSampleSound}
                      className="px-2 py-0.5 text-[9px] font-bold text-blue-600 border border-blue-200 hover:bg-blue-50 rounded transition-colors"
                    >
                      Thử âm
                    </button>
                  )}
                  <button
                    onClick={() => updateField('alertSoundEnabled', !preferences.alertSoundEnabled)}
                    className={`w-10 h-6 rounded-full p-1 transition-all ${preferences.alertSoundEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-all ${preferences.alertSoundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* Export / Import JSON Configuration Section */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <FileJson className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Sao lưu & Di chuyển cấu hình cá nhân</h4>
                      <p className="text-[10px] text-slate-500">Xuất/nhập tệp JSON để di chuyển thiết lập ERP sang thiết bị khác.</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                    JSON Format
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs transition-all shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Xuất tệp JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleImportJSONClick}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-white" />
                    <span>Nhập tệp JSON</span>
                  </button>
                </div>

                <p className="text-[9px] text-slate-400 italic">
                  * Tệp sao lưu chứa đầy đủ: Bảng màu (Theme), Chế độ bảo vệ mắt, Mật độ hiển thị, Định dạng tiền tệ, Ngôn ngữ và Phân hệ khởi động.
                </p>
              </div>
            </div>
          )}

          {/* Guide & API Workflow Tab */}
          {activeTab === 'guide' && (
            <div className="space-y-4 animate-fade-in text-xs">
              {/* Architecture Intro */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900 to-slate-900 text-white space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">NexusSync Enterprise Architecture</h4>
                    <p className="text-[10px] text-blue-200">Chuẩn hóa 244 API Endpoints • Single Writer Domain Authority</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  NexusSync ERP là một hệ sinh thái đồng nhất với cơ chế hạch toán tự động qua Event-driven Architecture (EDA), giao dịch phân tán Outbox Pattern và nhật ký kiểm toán SHA-256.
                </p>
              </div>

              {/* Core Features Overview */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Các tính năng cốt lõi hiện tại (M01 - M42)</span>
                </h4>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">📊 Kế toán Tổng hợp & VAS (M30, M31, M32)</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">Sổ cái GL</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Bảng cân đối phát sinh tài khoản, định khoản kép tự động, hóa đơn AR/AP, đối soát sao kê ngân hàng VietQR (M33) và báo cáo tài chính mẫu 08-TT.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">📦 Quản lý Kho & Tồn kho (M17, M18, M09, M10)</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">Single Writer</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Mô hình 3 trạng thái bất biến (<span className="font-mono text-blue-700 font-bold">Physical = Reserved + Available</span>), kiểm kê kho tức thời, điều chuyển nội bộ và quản lý theo Lô/Serial.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">🛒 Điểm bán POS & Quản lý Ca (M16)</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800">Cash Flow</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Mở/chốt ca tiền mặt độc lập, đối soát mệnh giá, phát hiện chênh lệch tự động và luồng phê duyệt phân quyền nghiêm ngặt (Separation of Duties).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">👥 Tiền lương & Nhân sự (M27, M28)</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">Payroll Engine</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Tính lương tự động cho hàng trăm nhân sự, trích nộp Thuế TNCN & BHXH, tự động sinh bút toán trích chi phí và tất toán qua tài khoản ngân hàng.
                    </p>
                  </div>
                </div>
              </div>

              {/* API Endpoints & Workflows */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5 text-blue-600" />
                  <span>Quy trình nghiệp vụ chính & Luồng API</span>
                </h4>

                <div className="space-y-2.5">
                  {/* Workflow 1: GL Posting */}
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-2 border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span>1. GL Posting Cycle (Chu kỳ hạch toán Sổ cái)</span>
                      </span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">M30 • &lt;500ms</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-300 font-sans">
                      <p><span className="text-emerald-400 font-semibold font-mono">B1:</span> Người dùng/Service gửi yêu cầu hạch toán qua <code className="font-mono text-emerald-300 bg-slate-950 px-1 py-0.5 rounded">POST /api/gl/entries</code>.</p>
                      <p><span className="text-emerald-400 font-semibold font-mono">B2:</span> <code className="text-blue-300">accountingEngine</code> kiểm tra hợp lệ tài khoản VAS và quy tắc bất biến <code className="font-mono text-amber-300">Tổng Nợ = Tổng Có</code>.</p>
                      <p><span className="text-emerald-400 font-semibold font-mono">B3:</span> Ghi sổ cái <code className="text-slate-300">accounting_entries</code> trong Transaction nguyên tử, cập nhật số dư TK và lưu vết audit log SHA-256.</p>
                      <p><span className="text-emerald-400 font-semibold font-mono">B4:</span> Báo cáo tài chính, Sổ nhật ký chung và Bảng cân đối tài khoản tự động phản ánh tức thì.</p>
                    </div>
                  </div>

                  {/* Workflow 2: Sales to Cash */}
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-2 border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-blue-400 font-bold flex items-center gap-1">
                        <span>2. Sales-to-Cash Cycle (Bán hàng thu tiền)</span>
                      </span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">M13 ➔ M31 • O2C</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-300 font-sans">
                      <p><span className="text-blue-400 font-semibold font-mono">B1:</span> Tạo đơn đặt hàng bán <code className="font-mono text-blue-300 bg-slate-950 px-1 py-0.5 rounded">POST /api/sales/orders</code> (M13).</p>
                      <p><span className="text-blue-400 font-semibold font-mono">B2:</span> Kho xác nhận xuất hàng <code className="font-mono text-blue-300 bg-slate-950 px-1 py-0.5 rounded">POST /api/stock/movements</code> ➔ xuất bản sự kiện <code className="text-purple-300">OrderShipped</code>.</p>
                      <p><span className="text-blue-400 font-semibold font-mono">B3:</span> Tự động tạo hóa đơn AR Invoice <code className="font-mono text-blue-300 bg-slate-950 px-1 py-0.5 rounded">POST /api/invoices</code> (M31) và tăng công nợ khách hàng.</p>
                      <p><span className="text-blue-400 font-semibold font-mono">B4:</span> Tự động hạch toán GL doanh thu: <code className="font-mono text-amber-300">Nợ TK 131 / Có TK 511, 3331</code>.</p>
                      <p><span className="text-blue-400 font-semibold font-mono">B5:</span> Khách hàng thanh toán qua VietQR/Ngân hàng (M33) ➔ Hạch toán <code className="font-mono text-emerald-300">Nợ TK 112 / Có TK 131</code>, đóng hóa đơn.</p>
                    </div>
                  </div>

                  {/* Workflow 3: Monthly Payroll */}
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-2 border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <span>3. Monthly Payroll Processing (Tính & Chi lương)</span>
                      </span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">M28 • Payroll Engine</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-300 font-sans">
                      <p><span className="text-amber-400 font-semibold font-mono">B1:</span> Chốt chấm công và kích hoạt tính toán qua <code className="font-mono text-amber-300 bg-slate-950 px-1 py-0.5 rounded">POST /api/payroll/calculate</code>.</p>
                      <p><span className="text-amber-400 font-semibold font-mono">B2:</span> Hệ thống tự động tính Lương Gross, Thuế TNCN (10%), BHXH/BHYT (10.5%) và Lương Net.</p>
                      <p><span className="text-amber-400 font-semibold font-mono">B3:</span> Quản lý duyệt bảng lương qua <code className="font-mono text-amber-300 bg-slate-950 px-1 py-0.5 rounded">PUT /api/payroll/:id/approve</code> ➔ Khóa niêm phong SHA-256.</p>
                      <p><span className="text-amber-400 font-semibold font-mono">B4:</span> Tự động hạch toán chi phí lương GL: <code className="font-mono text-amber-300">Nợ TK 642 / Có TK 334, TK 338</code>.</p>
                      <p><span className="text-amber-400 font-semibold font-mono">B5:</span> Chi trả lương qua tài khoản ngân hàng liên kết (M33) ➔ Bút toán tất toán <code className="font-mono text-emerald-300">Nợ TK 334 / Có TK 112</code>.</p>
                    </div>
                  </div>

                  {/* Workflow 4: POS & Shift Management */}
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-2 border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-purple-400 font-bold flex items-center gap-1">
                        <span>4. POS Shift & Cash Cycle (Quản lý Ca & Tiền mặt)</span>
                      </span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">M16 • Shift Engine</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-300 font-sans">
                      <p><span className="text-purple-400 font-semibold font-mono">B1:</span> Thu ngân khai báo tiền đầu ca qua <code className="font-mono text-purple-300 bg-slate-950 px-1 py-0.5 rounded">POST /api/shift/open</code>.</p>
                      <p><span className="text-purple-400 font-semibold font-mono">B2:</span> Giao dịch bán lẻ hoặc thu/chi phát sinh qua <code className="font-mono text-purple-300 bg-slate-950 px-1 py-0.5 rounded">POST /api/shift/cash-movement</code>.</p>
                      <p><span className="text-purple-400 font-semibold font-mono">B3:</span> Kiểm đếm và chốt ca qua <code className="font-mono text-purple-300 bg-slate-950 px-1 py-0.5 rounded">POST /api/shift/:id/close</code>. Tự động đối soát chênh lệch.</p>
                      <p><span className="text-purple-400 font-semibold font-mono">B4:</span> Quản lý phê duyệt chênh lệch (nếu có) tuân thủ nghiêm ngặt nguyên tắc phân tách trách nhiệm (Separation of Duties).</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Standards */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chuẩn bảo mật & Độ trễ (SLA)</span>
                </div>
                <ul className="list-disc list-inside text-[10px] text-slate-600 space-y-1">
                  <li>Bắt buộc Header: <span className="font-mono font-bold text-slate-800">Authorization: Bearer &lt;JWT&gt;</span></li>
                  <li>Giới hạn lưu lượng: <span className="font-bold text-slate-800">100 requests/phút</span> cho mỗi phiên làm việc.</li>
                  <li>Độ trễ phản hồi API: Giao dịch &lt;500ms, Truy vấn sổ sách &lt;1000ms.</li>
                  <li>Lưu vết Kiểm toán: Mã hóa SHA-256 cho 100% giao dịch có thay đổi trạng thái.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Simulator info panel */}
        <div className="p-4 bg-blue-50/70 border-t border-blue-200/50 text-[10px] text-blue-800 space-y-1.5 leading-relaxed">
          <div className="font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Xác thực hệ thống (System Invariants check)</span>
          </div>
          <p>
            Cấu hình này đồng bộ hóa toàn diện xuống `localStorage` và tác động trực tiếp lên hệ thống layout (density), bảng màu (theme) và bảo vệ mắt người dùng theo thời gian thực.
          </p>
        </div>

      </div>
    </div>
  );
};
