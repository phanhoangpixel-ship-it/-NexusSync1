import React from 'react';
import { 
  Warehouse, Boxes, ArrowLeftRight, ClipboardCheck, Tags, QrCode, 
  BarChart3, Truck, ShoppingBag, ShieldAlert, CheckCircle2, Clock, 
  RefreshCw, Activity
} from 'lucide-react';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { SelectedEntityContext } from '../../../../types';
import { WarehouseFacilitiesMasterTab } from './WarehouseFacilitiesMasterTab';
import { WarehouseInboundTab } from './WarehouseInboundTab';
import { WarehouseOutboundTab } from './WarehouseOutboundTab';
import { WarehouseInternalOpsTab } from './WarehouseInternalOpsTab';
import { WarehouseStockControlTab } from './WarehouseStockControlTab';
import { WarehouseTraceabilityTab } from './WarehouseTraceabilityTab';
import { WarehouseAnalyticsTab } from './WarehouseAnalyticsTab';

interface WarehouseManagementWorkspaceProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  onSelectEntity?: (context: SelectedEntityContext) => void;
}

export const WarehouseManagementWorkspace: React.FC<WarehouseManagementWorkspaceProps> = ({ 
  onNotify, 
  onSelectEntity 
}) => {
  // Session-persisted tab navigation (Golden Standard)
  const [activeGroup, setActiveGroup] = useWorkspaceSessionTab('M18', 'setup');

  return (
    <div className="space-y-4 w-full max-w-full pb-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-mono tabular-nums font-semibold bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200 rounded-md">
              WMS-MASTER-05 (M18)
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Warehouse Management Hub (Quản Lý Kho Vận Tổng Hợp)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Trung tâm điều hành kho vận toàn diện: 7 nhóm nghiệp vụ từ Warehouse Setup, Inbound, Outbound đến Traceability &amp; Analytics theo Golden Standard L0 - L4.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => onNotify('success', 'Đồng bộ Inventory Core', 'Toàn bộ trạng thái WMS đã đồng bộ với Inventory Core thành công.')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Đồng Bộ Inventory Core
          </button>
        </div>
      </div>

      {/* 7 Functional Groups Navigation Tabs (A through G) */}
      <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveGroup('setup')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeGroup === 'setup' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>A. Warehouse Setup</span>
        </button>
        <button
          onClick={() => setActiveGroup('inbound')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeGroup === 'inbound' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>B. Inbound (3-Way Match)</span>
        </button>
        <button
          onClick={() => setActiveGroup('outbound')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeGroup === 'outbound' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>C. Outbound Fulfillment</span>
        </button>
        <button
          onClick={() => setActiveGroup('internal')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeGroup === 'internal' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>D. Internal Operations</span>
        </button>
        <button
          onClick={() => setActiveGroup('control')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeGroup === 'control' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>E. Inventory Control</span>
        </button>
        <button
          onClick={() => setActiveGroup('traceability')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeGroup === 'traceability' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>F. Traceability (Lot &amp; Serial)</span>
        </button>
        <button
          onClick={() => setActiveGroup('analytics')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeGroup === 'analytics' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>G. Warehouse Analytics</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* RENDER ACTIVE FUNCTIONAL TAB (A through G)                                */}
      {/* ========================================================================= */}

      {/* SECTION A: WAREHOUSE SETUP & MASTER FACILITIES TAB (M17 Golden Standard) */}
      {activeGroup === 'setup' && (
        <WarehouseFacilitiesMasterTab onNotify={onNotify} />
      )}

      {/* SECTION B: INBOUND RECEIVING WORKSPACE */}
      {activeGroup === 'inbound' && (
        <WarehouseInboundTab onNotify={onNotify} onSelectEntity={onSelectEntity} />
      )}

      {/* SECTION C: OUTBOUND FULFILLMENT WORKSPACE */}
      {activeGroup === 'outbound' && (
        <WarehouseOutboundTab onNotify={onNotify} onSelectEntity={onSelectEntity} />
      )}

      {/* SECTION D: INTERNAL OPERATIONS WORKSPACE */}
      {activeGroup === 'internal' && (
        <WarehouseInternalOpsTab onNotify={onNotify} onSelectEntity={onSelectEntity} />
      )}

      {/* SECTION E: INVENTORY CONTROL (REFACTORED WITH MODULETABSHELL) */}
      {activeGroup === 'control' && (
        <WarehouseStockControlTab onNotify={onNotify} onSelectEntity={onSelectEntity} />
      )}

      {/* SECTION F: TRACEABILITY */}
      {activeGroup === 'traceability' && (
        <WarehouseTraceabilityTab onNotify={onNotify} onSelectEntity={onSelectEntity} />
      )}

      {/* SECTION G: WAREHOUSE ANALYTICS */}
      {activeGroup === 'analytics' && (
        <WarehouseAnalyticsTab onNotify={onNotify} onSelectEntity={onSelectEntity} />
      )}
    </div>
  );
};

export default WarehouseManagementWorkspace;
