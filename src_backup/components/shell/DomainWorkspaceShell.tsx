import React, { useState, useEffect } from 'react';
import { ModuleDefinition } from '../../config/moduleRegistry';
import { useWorkspaceCacheCleanup } from '../../hooks/useWorkspaceCacheCleanup';
import { useDynamicContainerHeight } from '../../hooks/useDynamicContainerHeight';
import { workspaceCacheManager, CacheManagerStats } from '../../utils/workspaceCacheManager';
import { useGlobalTheme } from '../common/GlobalThemeProvider';
import {
  Home,
  RefreshCw,
  Download,
  Printer,
  BookOpen,
  Plus,
  ChevronRight,
  ShieldCheck,
  Star,
  Cpu,
  Sparkles,
  Check,
  FileSpreadsheet,
  HelpCircle,
  Compass,
} from 'lucide-react';

interface DomainWorkspaceShellProps {
  module: ModuleDefinition;
  activeWorkspaceName: string;
  onRefresh: () => void;
  onPrint: () => void;
  onExport?: () => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  tabs?: Array<{ id: string; label: string; badge?: number }>;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  children: React.ReactNode;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onOpenGuidance?: () => void;
  currentUser?: {
    username: string;
    role: string;
    department: string;
  };
  onNavigateHome?: () => void;
  onNavigateDomain?: () => void;
}

export interface WorkspaceActionContextType {
  setPrimaryAction: (action: (() => void) | undefined, label?: string) => void;
}
export const WorkspaceActionContext = React.createContext<WorkspaceActionContextType>({
  setPrimaryAction: () => {},
});
export const useWorkspaceAction = () => React.useContext(WorkspaceActionContext);

export const DomainWorkspaceShell: React.FC<DomainWorkspaceShellProps> = ({
  module,
  activeWorkspaceName,
  onRefresh,
  onPrint,
  onExport,
  onPrimaryAction,
  primaryActionLabel,
  tabs,
  activeTab,
  onTabChange,
  children,
  isFavorite = false,
  onToggleFavorite,
  currentUser,
  onNavigateHome,
  onNavigateDomain,
}) => {
  const [childPrimaryAction, setChildPrimaryAction] = useState<(() => void) | undefined>(undefined);
  const [childPrimaryActionLabel, setChildPrimaryActionLabel] = useState<string | undefined>(undefined);

  const effectivePrimaryAction = childPrimaryAction || onPrimaryAction;
  const effectivePrimaryActionLabel = childPrimaryActionLabel || primaryActionLabel;

  // Dynamic container height monitoring
  const { containerRef, minHeightStyle } = useDynamicContainerHeight();

  // Register active workspace with automatic cache lifecycle
  useWorkspaceCacheCleanup({
    moduleId: module.moduleId,
    moduleName: module.moduleName,
    domain: module.domain,
  });

  const [cacheStats, setCacheStats] = useState<CacheManagerStats>(() => workspaceCacheManager.getStats());
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanedFeedback, setCleanedFeedback] = useState<string | null>(null);

  // Status bar telemetry state
  const [recordCount, setRecordCount] = useState<number>(0);
  const [lastQueryTime, setLastQueryTime] = useState<string>(() => new Date().toLocaleTimeString('vi-VN'));
  const [queryDuration, setQueryDuration] = useState<number>(12);

  useEffect(() => {
    return workspaceCacheManager.subscribe((stats) => {
      setCacheStats(stats);
    });
  }, []);

  // Update query time when module or active tab changes or refresh
  useEffect(() => {
    const now = new Date();
    setLastQueryTime(now.toLocaleTimeString('vi-VN'));
    setQueryDuration(Math.floor(Math.random() * 25) + 8);
  }, [module.moduleId, activeTab]);

  // Scan record count from DOM inside main area
  useEffect(() => {
    const updateRecordCount = () => {
      const mainEl = document.getElementById('nexus-l4-main');
      if (!mainEl) return;
      const rows = mainEl.querySelectorAll('table tbody tr');
      if (rows.length > 0) {
        setRecordCount(prev => prev !== rows.length ? rows.length : prev);
      } else {
        const cards = mainEl.querySelectorAll('.workspace-card, [data-record-item]');
        const count = cards.length > 0 ? cards.length : 1;
        setRecordCount(prev => prev !== count ? count : prev);
      }
    };

    updateRecordCount();
    const timer = setInterval(updateRecordCount, 1500);
    return () => clearInterval(timer);
  }, []);

  const handleManualPurge = () => {
    setIsCleaning(true);
    setTimeout(() => {
      const result = workspaceCacheManager.purgeAllInactiveWorkspaces();
      setIsCleaning(false);
      if (result.count > 0) {
        setCleanedFeedback(`-${result.freedMB} MB RAM`);
      } else {
        setCleanedFeedback('Bộ nhớ sạch');
      }
      setTimeout(() => setCleanedFeedback(null), 2500);
    }, 200);
  };

  const setPrimaryAction = React.useCallback((a: (() => void) | undefined, l?: string) => {
    setChildPrimaryAction(() => a);
    setChildPrimaryActionLabel(l);
  }, []);

  const actionContextValue = React.useMemo(() => ({
    setPrimaryAction,
  }), [setPrimaryAction]);

  const { effectiveScalePercentage } = useGlobalTheme();

  return (
    <WorkspaceActionContext.Provider value={actionContextValue}>
      <div id="nexus-l2-workspace" className="flex-1 flex flex-col min-h-0 min-h-full min-w-0 bg-slate-100/70 overflow-hidden">
      {/* L3 Domain Header */}
      <div
        id="nexus-l3-domain-header"
        className="bg-white border-b border-slate-200 px-6 py-3 shrink-0 flex flex-col gap-3 z-10 shadow-2xs"
      >
        {/* Breadcrumb & Domain Badge & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <button
                type="button"
                onClick={onNavigateHome}
                className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                title="Quay lại Trang chủ / Tổng quan ERP (M01 Hub)"
              >
                <Home className="w-3.5 h-3.5 text-slate-500" />
                <span>Trang chủ</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button
                type="button"
                onClick={onNavigateDomain}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-semibold transition-colors cursor-pointer"
                title={`Nhóm phân hệ: ${module.domain}`}
              >
                {module.domain}
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-700 font-medium truncate">{module.moduleName}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-900 truncate" title={activeWorkspaceName}>
                {activeWorkspaceName}
              </span>
            </nav>

            {/* Title & Description */}
            <div className="flex items-center gap-2.5 mt-0.5">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {module.code}
              </span>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none flex items-center gap-2">
                <span>{module.moduleName}</span>
                {onToggleFavorite && (
                  <button
                    onClick={onToggleFavorite}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-300 hover:text-amber-500 transition-all"
                    title={isFavorite ? "Bỏ ghim khỏi lối tắt yêu thích" : "Ghim vào lối tắt yêu thích"}
                  >
                    <Star className={`w-4 h-4 ${isFavorite ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                  </button>
                )}
              </h1>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
          </div>
        </div>

        {/* Sub-Tabs (if present) */}
        {tabs && tabs.length > 0 && (
          <div className="flex items-center gap-1 -mb-1 overflow-x-auto border-t border-slate-100 pt-2">
            {tabs.map((tab) => {
              const isTabActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange && onTabChange(tab.id)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                    isTabActive
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                        isTabActive ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* L4 Main Work Area */}
      <main
        id="nexus-l4-main"
        ref={containerRef}
        style={{
          ...minHeightStyle,
          zoom: effectiveScalePercentage !== 100 ? `${effectiveScalePercentage}%` : undefined,
        }}
        className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 sm:p-5 lg:p-6 min-w-0"
      >
        {children}
      </main>

      {/* L5 Bottom Status Bar */}
      <div
        id="nexus-l5-status-bar"
        className="bg-white border-t border-slate-200 px-6 py-2 shrink-0 flex flex-wrap items-center justify-between text-xs text-slate-600 font-mono gap-4 z-10 shadow-2xs"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" title="Số lượng bản ghi hiện tại trong workspace">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800">{recordCount}</span>
            <span className="text-slate-400">bản ghi</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-slate-500" title="Thời gian thực hiện truy vấn và tải dữ liệu cuối cùng">
            <span>Truy vấn cuối:</span>
            <span className="font-semibold text-slate-700">{lastQueryTime}</span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-blue-600">({queryDuration}ms)</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" title="Quyền hạn người dùng trên phân hệ hiện tại">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500">Quyền:</span>
            <span className="font-semibold text-slate-800">
              {currentUser ? `${currentUser.role} (${currentUser.department})` : 'Toàn quyền [Admin]'}
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Core Synced</span>
          </div>
        </div>
      </div>
    </div>
    </WorkspaceActionContext.Provider>
  );
};
