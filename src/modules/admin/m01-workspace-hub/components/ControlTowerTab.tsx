import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { ModuleDefinition } from '../../../../config/moduleRegistry';
import { UserSession } from '../../../../types/index';
import { EnterpriseCommandDashboard } from './EnterpriseCommandDashboard';
import { M01LiveFlowObservatory } from './M01LiveFlowObservatory';
import { EntityPreviewDrawer } from './EntityPreviewDrawer';
import { ObservabilityHealthData, ModuleTopologyItem } from '../services/m01WorkspaceApi';
import { WorkspaceWorkItem } from '../../../../types/workspace';

interface ControlTowerTabProps {
  currentUser?: UserSession;
  onSelectModule?: (module: ModuleDefinition) => void;
  onOpenWorkQueue?: () => void;
  onOpenOmnibar?: () => void;
  onSwitchToObservabilityTab: () => void;
  onSwitchToOverview?: () => void;
  healthData: ObservabilityHealthData | null;
  topologyModules: ModuleTopologyItem[];
}

export const ControlTowerTab: React.FC<ControlTowerTabProps> = ({
  currentUser,
  onSelectModule,
  onOpenWorkQueue,
  onOpenOmnibar,
  onSwitchToObservabilityTab,
  onSwitchToOverview,
  healthData,
  topologyModules,
}) => {
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkspaceWorkItem | null>(null);
  const [observatoryView, setObservatoryView] = useState<'flow_map' | 'matrix_grid'>('flow_map');

  const handleSelectModule = (mod: ModuleDefinition) => {
    if (onSelectModule) {
      onSelectModule(mod);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Drawer for Entity Preview if requested */}
      <EntityPreviewDrawer
        isOpen={!!selectedWorkItem}
        onClose={() => setSelectedWorkItem(null)}
        workItem={selectedWorkItem}
        onExecuteAction={async () => {}}
        onNavigateToModule={(route) => {
          setSelectedWorkItem(null);
        }}
      />

      {/* Top Level View Sub-Tab Switcher */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800/90 p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setObservatoryView('flow_map')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              observatoryView === 'flow_map'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icons.Radio className="w-3.5 h-3.5" />
            <span>Bản đồ Động (Live Flow Observatory)</span>
          </button>

          <button
            type="button"
            onClick={() => setObservatoryView('matrix_grid')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              observatoryView === 'matrix_grid'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icons.Grid className="w-3.5 h-3.5" />
            <span>Ma Trận Mạch &amp; Chỉ Số (Circuit Command Matrix)</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono text-[11px]">NexusSync SRE Topology v2.4</span>
        </div>
      </div>

      {/* View 1: Production-grade Interactive SVG Live Flow Observatory */}
      {observatoryView === 'flow_map' && (
        <M01LiveFlowObservatory
          onSelectModule={handleSelectModule}
          onOpenWorkQueue={onOpenWorkQueue}
          onOpenOmnibar={onOpenOmnibar}
        />
      )}

      {/* View 2: Enterprise Command Center Matrix */}
      {observatoryView === 'matrix_grid' && (
        <EnterpriseCommandDashboard
          currentUser={currentUser}
          onSelectModule={handleSelectModule}
          onOpenWorkQueue={onOpenWorkQueue || (() => {})}
          onOpenOmnibar={onOpenOmnibar || (() => {})}
          onSwitchToObservability={onSwitchToObservabilityTab}
          onSwitchToOverview={onSwitchToOverview}
          healthData={healthData}
          topologyModules={topologyModules}
        />
      )}
    </div>
  );
};

