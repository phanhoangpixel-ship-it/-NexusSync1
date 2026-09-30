import React, { useState, useEffect, useCallback } from 'react';
import { ModuleDefinition } from '../../../../config/moduleRegistry';
import { UserSession, ConfirmDialogState } from '../../../../types/index';
import * as Icons from 'lucide-react';
import { M01ObservabilityPanel } from './M01ObservabilityPanel';
import { ControlTowerTab } from './ControlTowerTab';
import { ExecutiveOverviewDashboard } from './ExecutiveOverviewDashboard';
import { OperationalActivityTaskCenter } from './OperationalActivityTaskCenter';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { useWorkspaceAction } from '../../../../components/shell/DomainWorkspaceShell';
import { m01WorkspaceApi } from '../services/m01WorkspaceApi';

export type M01MainTab = 'overview' | 'activity_tasks' | 'control_tower' | 'observability';

interface WorkspaceHubProps {
  onSelectModule: (module: ModuleDefinition) => void;
  onOpenWorkQueue: () => void;
  onOpenOmnibar: () => void;
  onOpenDecisionAssistant?: () => void;
  onOpenGuidance?: () => void;
  onOpenAcademy?: () => void;
  onOpenGlossary?: () => void;
  currentUser?: UserSession;
  allowedModules?: string[];
  activeProfileName?: string;
  activeProfileDesc?: string;
  density?: 'cozy' | 'compact' | 'spaced';
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({
  onSelectModule,
  onOpenWorkQueue,
  onOpenOmnibar,
  onOpenDecisionAssistant,
  onOpenGuidance,
  onOpenAcademy,
  onOpenGlossary,
  currentUser,
  allowedModules,
  activeProfileName,
  activeProfileDesc,
  density,
}) => {
  // Session tab state - persisted across navigations
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<M01MainTab>('M01', 'overview');

  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      if (
        e.detail &&
        (e.detail === 'overview' ||
          e.detail === 'activity_tasks' ||
          e.detail === 'control_tower' ||
          e.detail === 'observability')
      ) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('nexus:m01_switch_tab', handleSwitchTab);
    return () => window.removeEventListener('nexus:m01_switch_tab', handleSwitchTab);
  }, [setActiveTab]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('nexus:m01_active_tab_changed', { detail: activeTab }));
  }, [activeTab]);

  // Shared Health & Topology state for both tabs
  const [healthData, setHealthData] = useState<any>(null);
  const [topologyModules, setTopologyModules] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [syncingProjector, setSyncingProjector] = useState<boolean>(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const { setHeaderActions } = useWorkspaceAction();

  const fetchGlobalObservability = useCallback(async () => {
    try {
      const [hData, tData] = await Promise.all([
        m01WorkspaceApi.getObservabilityHealth(),
        m01WorkspaceApi.getObservabilityTopology()
      ]);

      if (hData) {
        setHealthData(hData);
      }

      if (tData) {
        setTopologyModules(tData.modules || []);
      }

      setLastUpdatedTime(new Date().toLocaleTimeString('vi-VN'));
    } catch (err) {
      console.error('Failed to load global observability state:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setInitialLoading(true);
      await fetchGlobalObservability();
      setInitialLoading(false);
    };
    init();
  }, [fetchGlobalObservability]);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    await fetchGlobalObservability();
    window.dispatchEvent(new CustomEvent('nexus:m01_observability_refresh'));
    setRefreshing(false);
  };

  const handleTriggerProjectorSync = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Đồng bộ Snapshot Dữ liệu (Observability Projector)',
      message: 'Kích hoạt chu kỳ phóng chiếu đọc từ Sổ cái Kiểm toán (M02) và Hàng đợi Outbox (M05) sang bảng dẫn xuất flow_spans & module_kpi_snapshots. Thao tác này an toàn (idempotent), không thay đổi dữ liệu nghiệp vụ của M17, M30, M41, M42.',
      variant: 'primary',
      confirmText: 'Đồng bộ Snapshot',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        setSyncingProjector(true);
        try {
          await m01WorkspaceApi.triggerSnapshotSync(true);
          await fetchGlobalObservability();
          window.dispatchEvent(new CustomEvent('nexus:m01_observability_refresh'));
        } catch (err) {
          console.error('Observability sync trigger error:', err);
        } finally {
          setSyncingProjector(false);
        }
      }
    });
  };

  useEffect(() => {
    setHeaderActions(
      <div className="flex items-center gap-2 flex-wrap">
        {lastUpdatedTime && (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700/70">
            <Icons.Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cập nhật lúc: <strong className="text-white font-semibold">{lastUpdatedTime}</strong></span>
          </div>
        )}

        <button
          type="button"
          onClick={handleRefreshAll}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all cursor-pointer disabled:opacity-50"
          title="Tải lại toàn bộ dữ liệu chỉ số"
        >
          <Icons.RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Làm mới</span>
        </button>

        <button
          type="button"
          onClick={handleTriggerProjectorSync}
          disabled={syncingProjector}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
          title="Kích hoạt chu kỳ chiếu dữ liệu sang flow_spans"
        >
          {syncingProjector ? (
            <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Icons.Play className="w-3.5 h-3.5" />
          )}
          <span>Đồng bộ Snapshot</span>
        </button>
      </div>
    );
    return () => setHeaderActions(null);
  }, [setHeaderActions, lastUpdatedTime, refreshing, syncingProjector]);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px] h-full">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Icons.Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Đang khởi tạo Control Tower &amp; Phóng Chiếu Hệ Thống...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Rule #19 ConfirmDialog */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: TỔNG QUAN DOANH NGHIỆP (EXECUTIVE OVERVIEW DASHBOARD)
          Exact 1:1 visual match with uploaded screenshot
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <ExecutiveOverviewDashboard
          currentUser={currentUser}
          onSelectModule={onSelectModule}
          onOpenWorkQueue={() => setActiveTab('activity_tasks')}
          onOpenOmnibar={onOpenOmnibar}
          onSwitchToApiMap={() => setActiveTab('control_tower')}
          onSwitchToObservability={() => setActiveTab('observability')}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: TRUNG TÂM HOẠT ĐỘNG & TÁC VỤ (OPERATIONAL ACTIVITY & TASK CENTER)
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'activity_tasks' && (
        <OperationalActivityTaskCenter
          currentUser={currentUser}
          onSelectModule={onSelectModule}
          onOpenOmnibar={onOpenOmnibar}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 3: BẢN ĐỒ API & LUỒNG DỮ LIỆU (CONTROL TOWER)
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'control_tower' && (
        <ControlTowerTab
          currentUser={currentUser}
          onSelectModule={onSelectModule}
          onOpenWorkQueue={() => setActiveTab('activity_tasks')}
          onOpenOmnibar={onOpenOmnibar}
          onSwitchToObservabilityTab={() => setActiveTab('observability')}
          onSwitchToOverview={() => setActiveTab('overview')}
          healthData={healthData}
          topologyModules={topologyModules}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SRE DEEP DIVE: NEXUSFLOW OBSERVABILITY
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'observability' && (
        <div className="space-y-4">
          <M01ObservabilityPanel />
        </div>
      )}
    </div>
  );
};

export default WorkspaceHub;
