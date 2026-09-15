import React, { useState, useEffect, useRef } from 'react';
import { BRANCHES, ENVIRONMENT_PROFILES, ModuleDefinition } from '../../config/moduleRegistry';
import { UserSession } from '../../types';
import { FavoriteItem } from '../../types/recentFavorites';
import { RoleSwitcher } from './RoleSwitcher';
import { DisplayScaleSelector } from '../common/DisplayScaleSelector';
import {
  Layers,
  Search,
  Building2,
  User,
  BookOpen,
  Clock,
  Shield,
  Maximize2,
  Minimize2,
  Wifi,
  WifiOff,
  RefreshCw,
  FileSpreadsheet,
  Compass,
  GraduationCap,
  Bell,
  GitBranch,
  CheckSquare,
  Settings,
  LogOut,
  ArrowLeft,
  Pin,
  MoreVertical,
} from 'lucide-react';

interface GlobalHeaderProps {
  currentUser: UserSession;
  currentBranch?: string;
  onBranchChange?: (branchId: string) => void;
  currentProfile?: string;
  onProfileChange?: (profileId: string) => void;
  onOpenOmnibar: () => void;
  onOpenLogin: () => void;
  onOpenWorkQueue: () => void;
  onOpenNotifications?: () => void;
  onOpenContextRail?: () => void;
  onOpenUnifiedPipeline?: () => void;
  onOpenExport?: () => void;
  onOpenDecisionAssistant?: () => void;
  onOpenGuidance?: () => void;
  onOpenAcademy?: () => void;
  onOpenGlossary?: () => void;
  onOpenPreferences?: () => void;
  onLogout?: () => void;
  pendingWorkCount: number;
  unreadNotifCount?: number;
  onPrintPage: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  canGoBack?: boolean;
  previousModule?: ModuleDefinition | null;
  onGoBack?: () => void;
  pinnedModules?: FavoriteItem[];
  currentModuleId?: string;
  onSelectPinnedModule?: (moduleId: string) => void;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  currentUser,
  currentBranch,
  onBranchChange,
  currentProfile,
  onProfileChange,
  onOpenOmnibar,
  onOpenLogin,
  onOpenWorkQueue,
  onOpenNotifications,
  onOpenContextRail,
  onOpenUnifiedPipeline,
  onOpenExport,
  onOpenDecisionAssistant,
  onOpenGuidance,
  onOpenAcademy,
  onOpenGlossary,
  onOpenPreferences,
  onLogout,
  pendingWorkCount,
  unreadNotifCount = 0,
  onPrintPage,
  isFullscreen = false,
  onToggleFullscreen,
  canGoBack = false,
  previousModule = null,
  onGoBack,
  pinnedModules = [],
  currentModuleId,
  onSelectPinnedModule,
}) => {
  const activeBranchObj = BRANCHES.find((b) => b.id === currentBranch) || BRANCHES[0];
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  // Online / Offline State with navigator.onLine API
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastOfflineTime, setLastOfflineTime] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setLastOfflineTime(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleClickOutside = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <header
        id="nexus-l0-header"
        className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0 sticky top-0 shadow-md select-none gap-3 text-slate-100"
      >
        {/* ================= CLUSTER 1: Brand, Back & Connection ================= */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="shrink-0 hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-tight text-sm whitespace-nowrap">NexusSync</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                  ERP
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono -mt-0.5 tracking-wide">Core v1.0 • Frozen</p>
            </div>
          </div>

          {/* Global Back Button */}
          {onGoBack && canGoBack && previousModule && (
            <button
              id="header-btn-back-feature"
              type="button"
              onClick={onGoBack}
              className="h-8 flex items-center gap-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shrink-0 select-none shadow-2xs cursor-pointer active:scale-95"
              title={`Quay lại phân hệ trước: [${previousModule.moduleId}] ${previousModule.moduleName}`}
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-mono font-bold whitespace-nowrap">{previousModule.moduleId}</span>
            </button>
          )}

          {/* Real-time Connection Indicator */}
          <div className="hidden md:flex items-center pl-2 border-l border-slate-800 shrink-0">
            {isOnline ? (
              <div
                id="header-online-status"
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[11px] font-medium"
                title="Đang kết nối máy chủ ERP ổn định"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-semibold whitespace-nowrap">Online</span>
              </div>
            ) : (
              <div
                id="header-offline-status"
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] font-bold animate-pulse"
                title="Mất kết nối máy chủ! Dữ liệu đang đệm cục bộ"
              >
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shrink-0"></span>
                <span className="text-[11px] whitespace-nowrap">Offline</span>
              </div>
            )}
          </div>
        </div>

        {/* ================= CLUSTER 2: Unified Search & Pinned Quick Toolbar ================= */}
        <div className="flex-1 max-w-xl mx-2 flex items-center gap-2.5 min-w-0">
          {/* Omnibar Search Trigger */}
          <button
            type="button"
            onClick={onOpenOmnibar}
            className="flex-1 max-w-xs h-9 flex items-center justify-between px-3 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all text-xs shadow-2xs group cursor-pointer"
            title="Tìm kiếm toàn cục (Ctrl+K)"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2 overflow-hidden">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-400 shrink-0 transition-colors" />
              <span className="text-slate-400 group-hover:text-slate-200 font-medium truncate text-left">
                Tìm kiếm phân hệ, chứng từ, SKU...
              </span>
            </div>
            <kbd className="font-mono text-[10px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400 shadow-2xs shrink-0 group-hover:border-slate-600 hidden sm:inline-block">
              Ctrl+K
            </kbd>
          </button>

          {/* Pinned Modules Compact Bar */}
          {pinnedModules && pinnedModules.length > 0 && (
            <div
              id="header-quick-access-toolbar"
              className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-slate-800 border border-slate-700 rounded-xl shrink-0 max-w-xs overflow-x-auto no-scrollbar"
              title="Phân hệ đã ghim"
            >
              <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-0.5" />
              <div className="flex items-center gap-1 shrink-0">
                {pinnedModules.slice(0, 4).map((fav) => {
                  const isActive = fav.moduleId === currentModuleId;
                  return (
                    <button
                      key={fav.moduleId}
                      type="button"
                      onClick={() => onSelectPinnedModule?.(fav.moduleId)}
                      className={`h-7 px-2 flex items-center gap-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-2xs'
                      }`}
                      title={`[${fav.moduleId}] ${fav.moduleName}`}
                    >
                      <span className="font-mono text-[10px] font-bold">{fav.moduleId}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ================= CLUSTER 3: Primary Operational Actions (Icon + Tooltip) ================= */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={onOpenOmnibar}
            className="md:hidden h-9 w-9 flex items-center justify-center text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors shrink-0"
            title="Tìm kiếm (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Truy vết 360° (Context Rail) */}
          {onOpenContextRail && (
            <button
              type="button"
              onClick={onOpenContextRail}
              className="h-9 w-9 sm:w-auto sm:px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 rounded-xl transition-colors shrink-0 cursor-pointer shadow-2xs"
              title="Sơ đồ Truy vết Chứng từ 360° & Sổ cái GL (Context Rail)"
            >
              <GitBranch className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="hidden xl:inline">Truy vết 360°</span>
            </button>
          )}

          {/* Nhiệm vụ (Work Queue) */}
          <button
            type="button"
            onClick={onOpenWorkQueue}
            className="relative h-9 w-9 sm:w-auto sm:px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-blue-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors shrink-0 cursor-pointer shadow-2xs"
            title="Hàng đợi công việc cần xử lý (Work Queue)"
          >
            <CheckSquare className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="hidden xl:inline">Nhiệm vụ</span>
            {pendingWorkCount > 0 && (
              <span className="absolute -top-1 -right-1 sm:static sm:top-auto sm:right-auto px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white shadow-xs">
                {pendingWorkCount}
              </span>
            )}
          </button>

          {/* Thông báo (Notifications) */}
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative h-9 w-9 flex items-center justify-center text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors shrink-0 cursor-pointer shadow-2xs"
              title="Trung tâm Thông báo nghiệp vụ"
            >
              <Bell className="w-4 h-4 text-slate-300" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold flex items-center justify-center border-2 border-slate-900 shadow-xs">
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
            </button>
          )}

          {/* Trợ Giúp & Định Hướng (Guidance Hub) */}
          {onOpenGuidance && (
            <button
              type="button"
              onClick={onOpenGuidance}
              className="h-9 w-9 sm:w-auto sm:px-3 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shrink-0 shadow-xs cursor-pointer"
              title="Trợ Giúp & Định Hướng Doanh Nghiệp"
            >
              <Compass className="w-4 h-4 text-blue-200 shrink-0" />
              <span className="hidden xl:inline">Trợ Giúp</span>
            </button>
          )}
        </div>

        {/* ================= CLUSTER 4: User Profile & Overflow Secondary Menu (...) ================= */}
        <div className="flex items-center gap-2 shrink-0 border-l border-slate-800 pl-3">
          {/* Role & Simulated Login Switcher */}
          <RoleSwitcher currentUser={currentUser} onOpenLogin={onOpenLogin} />

          {/* Overflow Menu (...) for Secondary/Infrequent Controls */}
          <div className="relative" ref={overflowRef}>
            <button
              type="button"
              onClick={() => setOverflowOpen(!overflowOpen)}
              className="h-9 w-9 flex items-center justify-center text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Cài đặt, Hiển thị & Tùy chọn khác"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {overflowOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 text-slate-100">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cấu hình hiển thị</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-medium">Tỷ lệ hiển thị (Zoom)</span>
                    <DisplayScaleSelector variant="header" />
                  </div>
                </div>

                <div className="p-1.5">
                  {onToggleFullscreen && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleFullscreen();
                        setOverflowOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4 text-slate-400" /> : <Maximize2 className="w-4 h-4 text-slate-400" />}
                      <span>{isFullscreen ? 'Thu nhỏ (Thoát toàn màn hình)' : 'Toàn màn hình / Chế độ tập trung'}</span>
                    </button>
                  )}

                  {onOpenPreferences && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenPreferences();
                        setOverflowOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Cài đặt hệ thống & Bộ nhớ đệm</span>
                    </button>
                  )}

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        setOverflowOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/60 rounded-xl transition-colors border-t border-slate-800 mt-1"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Đăng xuất / Chuyển phiên</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Offline Alert Strip Notification */}
      {!isOnline && (
        <div
          id="nexus-offline-alert-banner"
          className="bg-rose-600 text-white px-4 py-1.5 flex items-center justify-between text-xs font-semibold shadow-md animate-in slide-in-from-top duration-200 z-20"
        >
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-white shrink-0 animate-bounce" />
            <span>
              <strong>Cảnh báo mất kết nối:</strong> Hệ thống ERP hiện đang ngoại tuyến (Offline). Các thay đổi sẽ được đệm cục bộ và tự động đồng bộ khi kết nối lại.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (navigator.onLine) setIsOnline(true);
            }}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Thử lại</span>
          </button>
        </div>
      )}
    </>
  );
};

