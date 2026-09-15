import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react';
import {
  UserSession,
  ModuleDefinition,
  SelectedEntityContext,
  ConfirmDialogState,
  WorkspaceWorkItem,
  ActivityLogItem,
  EnvironmentProfile,
  ToastNotification,
} from './types';
import { SystemPreferences, AppTheme, DensityMode, DisplayScaleMode, DEFAULT_SYSTEM_PREFERENCES } from './types/systemPreferences';
import { RecentVisitItem, FavoriteItem } from './types/recentFavorites';
import { MODULE_REGISTRY, BRANCHES, ENVIRONMENT_PROFILES } from './config/moduleRegistry';
import { workspaceCacheManager } from './utils/workspaceCacheManager';
import { useWorkspaceCacheCleanup } from './hooks/useWorkspaceCacheCleanup';
import { useNotification } from './hooks/useNotification';
import { safeFetchJson } from './utils/apiUtils';

// Shell Components
import { GlobalHeader } from './components/shell/GlobalHeader';
import { PrimaryNavigation } from './components/shell/PrimaryNavigation';
import { DomainWorkspaceShell } from './components/shell/DomainWorkspaceShell';
import { ContextRail } from './components/shell/ContextRail';

// Common Components & Modals & Drawers
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';
import { GlobalThemeProvider, calculateSmartFit } from './components/common/GlobalThemeProvider';
import { CommandOmnibarModal } from './components/common/CommandOmnibarModal';
import { SimulatedLoginModal } from './components/common/SimulatedLoginModal';
import { UnifiedActivityTaskDrawer } from './components/common/UnifiedActivityTaskDrawer';
import { RecentFavoritesDrawer } from './components/common/RecentFavoritesDrawer';
import { SystemPreferencesDrawer } from './components/common/SystemPreferencesDrawer';
import { QuickPreviewDrawer } from './components/common/QuickPreviewDrawer';
import { UnifiedDataPipelineModal } from './components/common/UnifiedDataPipelineModal';
import { ToastContainer } from './components/common/ToastContainer';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { WorkspaceLoadingFallback } from './components/common/WorkspaceLoadingFallback';
import { WorkspaceErrorBoundary } from './components/common/WorkspaceErrorBoundary';
import { PdfPrintModal } from './components/modals/PdfPrintModal';
import { TableExportModal } from './components/modals/TableExportModal';
import { GuidanceModal } from './components/guidance/GuidanceModal';

// ERP Business Knowledge & Guided Workflow System
import {
  BusinessDecisionAssistantModal,
  ErpAcademyModal,
  ErpGlossaryModal,
  ModuleGuidedDrawer,
} from './components/knowledge';

import { lazyWithRetry } from './utils/lazyWithRetry';

// Lazy-loaded Workspaces with resilient retry mechanism
const WorkspaceHub = lazyWithRetry(() => import('./modules/admin/m01-workspace-hub/components/WorkspaceHub'), 'WorkspaceHub');
const WarehouseManagementWorkspace = lazyWithRetry(() => import('./modules/inventory/m18-warehouse/components/WarehouseManagementWorkspace'), 'WarehouseManagementWorkspace');
const M21InternalTransfersWorkspace = lazyWithRetry(() => import('./modules/inventory/m21-transfers/components/M21InternalTransfersWorkspace'), 'M21InternalTransfersWorkspace');
const M23SerialsWorkspace = lazyWithRetry(() => import('./modules/inventory/m23-serials/components/M23SerialsWorkspace'), 'M23SerialsWorkspace');
const ManufacturingWorkspace = lazyWithRetry(() => import('./modules/manufacturing/m25-mes/components/ManufacturingWorkspace'), 'ManufacturingWorkspace');
const AssetMaintenanceWorkspace = lazyWithRetry(() => import('./modules/assets/m27-eam/components/AssetMaintenanceWorkspace'), 'AssetMaintenanceWorkspace');
const DMSWorkspace = lazyWithRetry(() => import('./modules/governance/m29-dms/components/DMSWorkspace'), 'DMSWorkspace');
const M41PricingManagementWorkspace = lazyWithRetry(() => import('./modules/pricing/m41-pricing-management/components/M41PricingManagementWorkspace'), 'M41PricingManagementWorkspace');
const M39QualityControlWorkspace = lazyWithRetry(() => import('./modules/governance/m39-quality/components/M39QualityControlWorkspace'), 'M39QualityControlWorkspace');
const SystemSettingsWorkspace = lazyWithRetry(() => import('./modules/admin/m03-system-settings/components/SystemSettingsWorkspace'), 'SystemSettingsWorkspace');
const M05EventBusWorkspace = lazyWithRetry(() => import('./modules/governance/m05-eventbus/components/M05EventBusWorkspace'), 'M05EventBusWorkspace');
const M07CustomersItemMasterWorkspace = lazyWithRetry(() => import('./modules/master-data/m07-customers-item-master/components/M07CustomersItemMasterWorkspace'), 'M07CustomersItemMasterWorkspace');
const M09SuppliersSRMWorkspace = lazyWithRetry(() => import('./modules/purchase/m09-suppliers/components/M09SuppliersSRMWorkspace'), 'M09SuppliersSRMWorkspace');
const M11SrmSupplierMgmtWorkspace = lazyWithRetry(() => import('./modules/purchase/m11-srm/components/M11SrmSupplierMgmtWorkspace'), 'M11SrmSupplierMgmtWorkspace');
const M13SalesOrdersWorkspace = lazyWithRetry(() => import('./modules/sales/m13-sales-orders/components/M13SalesOrdersWorkspace'), 'M13SalesOrdersWorkspace');
const M15ReturnsRMAWorkspace = lazyWithRetry(() => import('./modules/sales/m15-returns/components/M15ReturnsRMAWorkspace'), 'M15ReturnsRMAWorkspace');
const M19StocktakeWorkspace = lazyWithRetry(() => import('./modules/inventory/m19-stocktake/components/M19StocktakeWorkspace'), 'M19StocktakeWorkspace');
const M31InvoicesArApWorkspace = lazyWithRetry(() => import('./modules/finance/m31-invoices/components/M31InvoicesArApWorkspace'), 'M31InvoicesArApWorkspace');
const M33BankReconciliationWorkspace = lazyWithRetry(() => import('./modules/finance/m33-bank-reconciliation/components/M33BankReconciliationWorkspace'), 'M33BankReconciliationWorkspace');
const M35ProjectsWBSWorkspace = lazyWithRetry(() => import('./modules/projects/m35-projects-wbs/components/M35ProjectsWBSWorkspace'), 'M35ProjectsWBSWorkspace');
const M37BiAnalyticsWorkspace = lazyWithRetry(() => import('./modules/governance/m37-analytics/components/M37BiAnalyticsWorkspace'), 'M37BiAnalyticsWorkspace');
const SuperAdminRBACWorkspace = lazyWithRetry(() => import('./modules/admin/m04-super-admin/components/SuperAdminRBACWorkspace'), 'SuperAdminRBACWorkspace');
const SupplyChainWorkspace = lazyWithRetry(() => import('./modules/manufacturing/m26-scp/components/SupplyChainWorkspace'), 'SupplyChainWorkspace');
const M42CostAllocationWorkspace = lazyWithRetry(() => import('./modules/finance/m42-cost-allocation/components/M42CostAllocationWorkspace'), 'M42CostAllocationWorkspace');
const M34FinancialConsolidationWorkspace = lazyWithRetry(() => import('./modules/finance/m34-consolidation/components/M34FinancialConsolidationWorkspace'), 'M34FinancialConsolidationWorkspace');
const M32PaymentsTreasuryWorkspace = lazyWithRetry(() => import('./modules/finance/m32-payments/components/M32PaymentsTreasuryWorkspace'), 'M32PaymentsTreasuryWorkspace');
const M30GeneralLedgerWorkspace = lazyWithRetry(() => import('./modules/finance/m30-gl/components/M30GeneralLedgerWorkspace'), 'M30GeneralLedgerWorkspace');
const M16POSRetailWorkspace = lazyWithRetry(() => import('./modules/sales/m16-pos/components/M16POSRetailWorkspace'), 'M16POSRetailWorkspace');
const M14SalesCommissionWorkspace = lazyWithRetry(() => import('./modules/sales/m14-sales-commission/components/M14SalesCommissionWorkspace'), 'M14SalesCommissionWorkspace');
const M12CrmLeadsWorkspace = lazyWithRetry(() => import('./modules/sales/m12-crm/components/M12CrmLeadsWorkspace'), 'M12CrmLeadsWorkspace');
const M10StrategicSourcingWorkspace = lazyWithRetry(() => import('./modules/purchase/m10-strategic-sourcing/components/M10StrategicSourcingWorkspace'), 'M10StrategicSourcingWorkspace');
const M08PurchaseOrdersWorkspace = lazyWithRetry(() => import('./modules/purchase/m08-purchase-orders/components/M08PurchaseOrdersWorkspace'), 'M08PurchaseOrdersWorkspace');
const M24WMSExtendedWorkspace = lazyWithRetry(() => import('./modules/inventory/m24-wms-extended/components/M24WMSExtendedWorkspace'), 'M24WMSExtendedWorkspace');
const M22LotsBatchesWorkspace = lazyWithRetry(() => import('./modules/inventory/m22-lots/components/M22LotsBatchesWorkspace'), 'M22LotsBatchesWorkspace');
const StockAdjustmentWorkspace = lazyWithRetry(() => import('./modules/inventory/m20-adjustment/components/StockAdjustmentWorkspace'), 'StockAdjustmentWorkspace');
const MasterWmsWorkspace = lazyWithRetry(() => import('./modules/inventory/m17-master-wms/components/MasterWmsWorkspace'), 'MasterWmsWorkspace');
const M06InnovationRDWorkspace = lazyWithRetry(() => import('./modules/master-data/m06-innovation-rd/components/M06InnovationRDWorkspace'), 'M06InnovationRDWorkspace');
const HRWorkspace = lazyWithRetry(() => import('./modules/hr/m28-hr-payroll/components/HRWorkspace'), 'HRWorkspace');
const M36LogisticsWorkspace = lazyWithRetry(() => import('./modules/logistics/m36-logistics-fleet/components/M36LogisticsWorkspace'), 'M36LogisticsWorkspace');
const AuditComplianceWorkspace = lazyWithRetry(() => import('./modules/governance/m02-audit/components/AuditComplianceWorkspace'), 'AuditComplianceWorkspace');
const ServiceDeskWorkspace = lazyWithRetry(() => import('./modules/governance/m38-service-desk/components/ServiceDeskWorkspace'), 'ServiceDeskWorkspace');
const EHSWorkspace = lazyWithRetry(() => import('./modules/governance/m40-ehs/components/EHSWorkspace'), 'EHSWorkspace');
const GenericModuleWorkspace = lazyWithRetry(() => import('./modules/admin/m01-workspace-hub/components/GenericModuleWorkspace'), 'GenericModuleWorkspace');

const DEDICATED_WORKSPACE_MODULE_IDS = new Set([
  'M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10',
  'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17', 'M18', 'M19', 'M20',
  'M21', 'M22', 'M23', 'M24', 'M25', 'M26', 'M27', 'M28', 'M29', 'M30',
  'M31', 'M32', 'M33', 'M34', 'M35', 'M36', 'M37', 'M38', 'M39', 'M40',
  'M41', 'M42',
]);

/**
 * Centralized lookup table for route fuzzy matching and keyword aliases.
 * Ordered with specific operational keywords first (e.g. stock-adjustment, wms-extended)
 * before broader umbrella terms (e.g. adjustment, wms) for maximum accuracy.
 */
interface RouteAliasRule {
  moduleId: string;
  keywords: string[];
}

const ROUTE_ALIAS_RULES: RouteAliasRule[] = [
  // Commercial, CRM & Retail
  {
    moduleId: 'M16',
    keywords: ['pos', 'retail', 'bán-lẻ', 'counter', 'pos-retail'],
  },
  {
    moduleId: 'M07',
    keywords: ['customers', 'item-master', 'items', 'khách-hàng', 'sản-phẩm', 'master-data'],
  },
  {
    moduleId: 'M12',
    keywords: ['crm', 'leads', 'khách-hàng-tiềm-năng'],
  },
  {
    moduleId: 'M13',
    keywords: ['sales-orders', 'sales', 'đơn-bán-hàng', 'so', 'o2c', 'sales-order'],
  },
  {
    moduleId: 'M14',
    keywords: ['sales-commission', 'commission', 'hoa-hồng'],
  },
  {
    moduleId: 'M15',
    keywords: ['returns-rma', 'returns', 'rma', 'đổi-trả'],
  },
  {
    moduleId: 'M41',
    keywords: ['pricing-management', 'pricing', 'bảng-giá', 'commercial-pricing'],
  },

  // Procurement & Sourcing
  {
    moduleId: 'M08',
    keywords: ['purchase-orders', 'purchase-order', 'purchase', 'purchases', 'po', 'đơn-mua-hàng', 'mua-hàng', 'p2p'],
  },
  {
    moduleId: 'M09',
    keywords: ['suppliers-srm', 'suppliers', 'supplier', 'nhà-cung-cấp', 'srm-suppliers'],
  },
  {
    moduleId: 'M10',
    keywords: ['strategic-sourcing', 'sourcing', 'rfq', 'bids', 'đấu-thầu', 'chào-giá', 'awards'],
  },
  {
    moduleId: 'M11',
    keywords: ['srm-scorecard', 'srm-supplier-mgmt', 'srm-mgmt', 'đánh-giá-ncc', 'srm'],
  },

  // Inventory & WMS Operations
  {
    moduleId: 'M20',
    keywords: ['stock-adjustment', 'adjustment', 'điều-chỉnh-kho'],
  },
  {
    moduleId: 'M24',
    keywords: ['wms-extended', 'wms', 'kho-nâng-cao'],
  },
  {
    moduleId: 'M23',
    keywords: ['serials', 'serial-numbers', 'số-serial'],
  },
  {
    moduleId: 'M22',
    keywords: ['lots', 'batches', 'lô-hàng', 'lots-batches'],
  },
  {
    moduleId: 'M21',
    keywords: ['internal-transfers', 'transfers', 'transfer', 'điều-chuyển'],
  },
  {
    moduleId: 'M19',
    keywords: ['stocktake', 'kiểm-kê'],
  },
  {
    moduleId: 'M18',
    keywords: ['warehouse-management', 'warehouse', 'kho-hàng'],
  },
  {
    moduleId: 'M17',
    keywords: ['inventory-core', 'inventory', 'tồn-kho'],
  },

  // Logistics & Fleet
  {
    moduleId: 'M36',
    keywords: ['logistics', 'fleet', 'vận-tải', 'giao-hàng'],
  },

  // Manufacturing & Supply Chain
  {
    moduleId: 'M06',
    keywords: ['innovation-rd', 'rd', 'nghiên-cứu-phát-triển'],
  },
  {
    moduleId: 'M25',
    keywords: ['manufacturing', 'mes', 'sản-xuất'],
  },
  {
    moduleId: 'M26',
    keywords: ['supply-chain', 'chuỗi-cung-ứng'],
  },

  // Maintenance, Quality & EHS
  {
    moduleId: 'M27',
    keywords: ['asset-maintenance', 'eam', 'bảo-trì'],
  },
  {
    moduleId: 'M39',
    keywords: ['quality-control', 'qc', 'qms', 'chất-lượng'],
  },
  {
    moduleId: 'M40',
    keywords: ['ehs', 'safety', 'an-toàn-lao-động'],
  },

  // HR, Documents & Projects
  {
    moduleId: 'M28',
    keywords: ['hr', 'nhân-sự'],
  },
  {
    moduleId: 'M29',
    keywords: ['dms', 'tài-liệu'],
  },
  {
    moduleId: 'M35',
    keywords: ['projects-wbs', 'projects', 'dự-án'],
  },

  // Finance & Accounting
  {
    moduleId: 'M30',
    keywords: ['general-ledger', 'gl', 'sổ-cái', 'tài-chính', 'kế-toán'],
  },
  {
    moduleId: 'M31',
    keywords: ['invoices-ar-ap', 'invoices', 'ar-ap', 'hóa-đơn', 'công-nợ'],
  },
  {
    moduleId: 'M32',
    keywords: ['payments-treasury', 'payments', 'treasury', 'thanh-toán', 'thu-chi'],
  },
  {
    moduleId: 'M33',
    keywords: ['bank-reconciliation', 'đối-soát-ngân-hàng', 'sổ-phụ'],
  },
  {
    moduleId: 'M34',
    keywords: ['financial-consolidation', 'hợp-nhất-báo-cáo'],
  },
  {
    moduleId: 'M42',
    keywords: ['cost-allocation', 'cogs', 'phân-bổ-chi-phí', 'giá-vốn', 'allocation', 'chi-phí'],
  },

  // System & Platform
  {
    moduleId: 'M01',
    keywords: ['workspace', 'hub', 'tổng-quan', 'dashboard'],
  },
  {
    moduleId: 'M02',
    keywords: ['audit-compliance', 'audit', 'nhật-ký'],
  },
  {
    moduleId: 'M03',
    keywords: ['system-settings', 'settings', 'cài-đặt'],
  },
  {
    moduleId: 'M04',
    keywords: ['super-admin', 'rbac', 'phân-quyền'],
  },
  {
    moduleId: 'M05',
    keywords: ['event-bus', 'events', 'sự-kiện'],
  },
  {
    moduleId: 'M37',
    keywords: ['bi-analytics', 'analytics', 'reports', 'báo-cáo-bi'],
  },
];

const AppContent: React.FC = () => {
  // Current Session & Context
  const [currentUser, setCurrentUser] = useState<UserSession>({
id: 1,
username: 'admin',
name: 'Hoàng Nam (Admin)',
role: 'SUPER_ADMIN',
department: 'Quản trị hệ thống',
permissions: ['*'],
  });

  const [currentBranch, setCurrentBranch] = useState<string>(() => {
try {
  const saved = localStorage.getItem('nexussync_current_branch');
if (saved && BRANCHES.some((b) => b.id === saved)) {
return saved;
      }
    } catch {
      // ignore
    }
    return 'BR_HO';
  });

  const [currentModule, setCurrentModule] = useState<ModuleDefinition>(() => {
try {
  const saved = localStorage.getItem('nexussync_system_preferences');
if (saved) {
const parsed = JSON.parse(saved);
if (parsed.defaultLandingModule) {
  const found = MODULE_REGISTRY.find((m) => m.moduleId === parsed.defaultLandingModule);
if (found) return found;
        }
      }
    } catch {
      // ignore
    }
    return MODULE_REGISTRY.find((m) => m.moduleId === 'M17') || MODULE_REGISTRY[0];
  });

  const [selectedEntity, setSelectedEntity] = useState<SelectedEntityContext | null>(null);

  const handleSelectEntity = (entity: SelectedEntityContext | null) => {
    setSelectedEntity(entity);
    if (entity && entity.type === 'WMS_WAREHOUSE_MAPPING') {
      const m17 = MODULE_REGISTRY.find((m) => m.moduleId === 'M17');
      if (m17) {
        setCurrentModule(m17);
        addToast('info', 'Trung Tâm Vận Hành Kho & WMS', `Đã định vị sơ đồ kho WMS cho đơn hàng ${entity.code || entity.id}`);
      }
    }
  };

  const [currentProfileId, setCurrentProfileId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('nexussync_current_profile_id');
      if (saved && ENVIRONMENT_PROFILES.some((p) => p.id === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'FULL_ERP';
  });

  const activeProfile = ENVIRONMENT_PROFILES.find((p) => p.id === currentProfileId) || ENVIRONMENT_PROFILES.find((p) => p.id === 'FULL_ERP') || ENVIRONMENT_PROFILES[0];

  const handleProfileChange = (profileId: string) => {
    setCurrentProfileId(profileId);
    const targetProfile = ENVIRONMENT_PROFILES.find((p) => p.id === profileId) || ENVIRONMENT_PROFILES.find((p) => p.id === 'FULL_ERP') || ENVIRONMENT_PROFILES[0];
    // Fallback security check:
    // If currentModule is not allowed in the new profile, redirect to M01 (Workspace Hub)
    const isAllowed = targetProfile.allowedModules.includes('*') || targetProfile.allowedModules.includes(currentModule.moduleId);
    if (!isAllowed) {
      const m01 = MODULE_REGISTRY.find((m) => m.moduleId === 'M01');
      if (m01) {
        setCurrentModule(m01);
      }
    }
  };

  // Navigation History Stack (Back Button Support)
  const [navigationHistory, setNavigationHistory] = useState<ModuleDefinition[]>([]);
  const isNavigatingHistoryRef = useRef<boolean>(false);

  // Shell State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isHoveringSidebarArea, setIsHoveringSidebarArea] = useState<boolean>(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isOmnibarOpen, setIsOmnibarOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isWorkQueueOpen, setIsWorkQueueOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isContextRailOpen, setIsContextRailOpen] = useState<boolean>(false);
  const [contextRailEntity, setContextRailEntity] = useState<any | null>(null);
  const [isQuickPreviewOpen, setIsQuickPreviewOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isTableExportOpen, setIsTableExportOpen] = useState<boolean>(false);
  const [isUnifiedPipelineOpen, setIsUnifiedPipelineOpen] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any | null>(null);

  const handleInspectEntity = (entityOrCode: any) => {
    if (typeof entityOrCode === 'string') {
      setContextRailEntity({ id: entityOrCode, type: 'UNKNOWN', code: entityOrCode });
    } else {
      setContextRailEntity(entityOrCode);
    }
    setIsContextRailOpen(true);
  };

  // ERP Business Knowledge & Guided Workflow System State
  const [isDecisionAssistantOpen, setIsDecisionAssistantOpen] = useState<boolean>(false);
  const [isGuidanceModalOpen, setIsGuidanceModalOpen] = useState<boolean>(false);
  const [isAcademyOpen, setIsAcademyOpen] = useState<boolean>(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);
  const [isGuidedDrawerOpen, setIsGuidedDrawerOpen] = useState<boolean>(false);
  const [guidedTaskContext, setGuidedTaskContext] = useState<{ item: any; timestamp: number } | null>(null);

  // Dialog & Notification State
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [workItems, setWorkItems] = useState<WorkspaceWorkItem[]>([]);

  // Notifications State & Handlers via useNotification hook
  const {
    addToast,
    toasts,
    notifications,
    preferences: notificationPrefs,
    setPreferences: setNotificationPrefs,
    dismissToast,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    clearAllNotifications: handleClearAllNotifications,
    triggerSimulation: handleTriggerSimulation,
    unreadCount,
  } = useNotification();

  const handleNotify = (
    type: 'success' | 'danger' | 'warning' | 'info' | 'error',
    title: string,
    message?: string,
    moduleName?: string,
    link?: string
  ) => {
    const mappedType: 'success' | 'danger' | 'warning' | 'info' = type === 'error' ? 'danger' : type;
    addToast(mappedType, title, message || '', moduleName, link);
  };

  // Activity Log State (tracks all WorkQueue attempts & outcomes)
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexussync_activity_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'ACT-LOG-001',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        actionLabel: 'Nghiệm thu bảo trì định kỳ',
        businessReference: 'MWO-2026-0012',
        entity: 'MaintenanceWorkOrder',
        sourceModule: 'M27 Asset Maintenance EAM',
        endpoint: '/api/maintenance/complete/MWO-2026-0012',
        status: 'SUCCESS',
        userName: 'Kỹ sư Trưởng (Chief Eng)',
        userRole: 'ENGINEER',
        statusCode: 200,
        reason: 'Đã hoàn tất bảo dưỡng thay vòng bi và hiệu chuẩn trục quay máy ép thủy lực Line #2 đạt chuẩn ISO 55000.',
      },
      {
        id: 'ACT-LOG-002',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        actionLabel: 'Xuất Vật Tư',
        businessReference: 'WO-2026-0044',
        entity: 'WorkOrder',
        sourceModule: 'M18 Manufacturing',
        endpoint: '/api/manufacturing/issue-materials',
        status: 'SUCCESS',
        userName: 'Admin User',
        userRole: 'ADMIN',
        statusCode: 200,
        reason: 'Đã xuất vật tư 25x RAM Kingston DDR4 cho lệnh WO-2026-0044 thành công.',
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('nexussync_activity_logs', JSON.stringify(activityLogs));
    } catch {
      // ignore
    }
  }, [activityLogs]);


  // Recent & Favorites State
  const [recents, setRecents] = useState<RecentVisitItem[]>(() => {
    const saved = localStorage.getItem('nexussync_recent_visits');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    const saved = localStorage.getItem('nexussync_favorites');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isRecentFavoritesOpen, setIsRecentFavoritesOpen] = useState<boolean>(false);

  // Save states to local storage
  useEffect(() => {
    localStorage.setItem('nexussync_current_branch', currentBranch);
  }, [currentBranch]);

  useEffect(() => {
    localStorage.setItem('nexussync_current_profile_id', currentProfileId);
  }, [currentProfileId]);

  useEffect(() => {
    localStorage.setItem('nexussync_recent_visits', JSON.stringify(recents));
  }, [recents]);

  useEffect(() => {
    localStorage.setItem('nexussync_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Record visit on module change
  useEffect(() => {
    if (!currentModule) return;
    setRecents((prev) => {
      const idx = prev.findIndex((item) => item.moduleId === currentModule.moduleId);
      const timestamp = new Date().toISOString();
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          timestamp,
          clickCount: updated[idx].clickCount + 1,
        };
        return updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      } else {
        const newItem: RecentVisitItem = {
          moduleId: currentModule.moduleId,
          moduleName: currentModule.moduleName,
          timestamp,
          clickCount: 1,
          workspaceId: currentModule.workspaceId,
          iconName: currentModule.iconName || 'FileText',
        };
        return [newItem, ...prev].slice(0, 10);
      }
    });
  }, [currentModule]);

  const currentModuleRef = useRef(currentModule);
  useEffect(() => {
    currentModuleRef.current = currentModule;
  }, [currentModule]);

  // Navigate module and record history for back button with full support for new/dynamic modules
  const handleSelectModuleWithHistory = useCallback((nextMod: ModuleDefinition | string | { moduleId: string; [key: string]: any }) => {
    if (!nextMod) return;

    // 1. Resolve module target from string, partial definition or registry
    let targetMod: ModuleDefinition | undefined;
    if (typeof nextMod === 'string') {
      const id = nextMod.trim().toUpperCase();
      targetMod = MODULE_REGISTRY.find((m) => m.moduleId === id || m.code?.toUpperCase() === id);
    } else if (typeof nextMod === 'object' && nextMod.moduleId) {
      const id = nextMod.moduleId.trim().toUpperCase();
      targetMod = MODULE_REGISTRY.find((m) => m.moduleId === id || m.code?.toUpperCase() === id) || (nextMod as ModuleDefinition);
    }

    if (!targetMod) return;

    const cur = currentModuleRef.current;
    if (targetMod.moduleId === cur.moduleId) {
      // Already on this module: broadcast refresh so the active workspace can re-sync its state and re-render
      window.dispatchEvent(new CustomEvent('nexus-workspace-refresh', { detail: { moduleId: cur.moduleId } }));
      return;
    }

    // 2. Push current module to navigation history (avoid duplicate top of stack, keep history bounded)
    setNavigationHistory((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].moduleId === cur.moduleId) {
        return prev;
      }
      return [...prev, cur].slice(-30);
    });

    isNavigatingHistoryRef.current = false;
    setCurrentModule(targetMod);
  }, []);

  // Go back to previous module
  const handleGoBack = useCallback(() => {
    if (navigationHistory.length === 0) return;
    const previous = navigationHistory[navigationHistory.length - 1];
    setNavigationHistory((prev) => prev.slice(0, prev.length - 1));
    isNavigatingHistoryRef.current = true;
    setCurrentModule(previous);
    addToast('info', 'Quay lại', `Đã quay lại tính năng [${previous.moduleId}] ${previous.moduleName}`);
  }, [navigationHistory, addToast]);

  const previousModule = navigationHistory.length > 0 ? navigationHistory[navigationHistory.length - 1] : null;
  const canGoBack = navigationHistory.length > 0;

  // Auto-record navigation history whenever currentModule changes from any source (fail-safe for newly integrated modules)
  const previousModuleRef = useRef<ModuleDefinition | null>(null);
  useEffect(() => {
    if (previousModuleRef.current && previousModuleRef.current.moduleId !== currentModule.moduleId) {
      if (isNavigatingHistoryRef.current) {
        // Handled by "Quay lại" (Back action), consume flag
        isNavigatingHistoryRef.current = false;
      } else {
        const prev = previousModuleRef.current;
        setNavigationHistory((hist) => {
          if (hist.length > 0 && hist[hist.length - 1].moduleId === prev.moduleId) {
            return hist;
          }
          return [...hist, prev].slice(-30);
        });
      }
    }
    previousModuleRef.current = currentModule;
  }, [currentModule]);

  // Sync with Fullscreen API
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      const isCurrentlyFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isCurrentlyFs) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).mozRequestFullScreen) {
          await (document.documentElement as any).mozRequestFullScreen();
        } else if ((document.documentElement as any).msRequestFullscreen) {
          await (document.documentElement as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
        addToast('info', 'Toàn màn hình', 'Đã bật chế độ tập trung và ẩn thanh điều hướng Shell.');
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      // Fallback for iframe sandboxes or restricted environments
      setIsFullscreen((prev) => {
        const next = !prev;
        addToast(
          'info',
          next ? 'Chế độ tập trung' : 'Chế độ tiêu chuẩn',
          next
            ? 'Đã ẩn Sidebar & Context Rail để mở rộng tối đa vùng phân tích dữ liệu.'
            : 'Đã hiển thị lại đầy đủ các thanh điều hướng hệ thống.'
        );
        return next;
      });
    }
  };

  // Fullscreen Sidebar Auto-Hide Handlers (3 seconds delay on mouse inactivity outside sidebar area)
  const handleSidebarMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (isFullscreen) {
      setIsHoveringSidebarArea(true);
    }
  }, [isFullscreen]);

  const handleSidebarMouseLeave = useCallback(() => {
    if (isFullscreen) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHoveringSidebarArea(false);
      }, 3000);
    }
  }, [isFullscreen]);

  // Clean up auto-hide timeout when fullscreen state changes or component unmounts
  useEffect(() => {
    if (!isFullscreen) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setIsHoveringSidebarArea(false);
    }
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [isFullscreen]);

  const handleToggleFavorite = (mod: ModuleDefinition) => {
    setFavorites((prev) => {
      const isFav = prev.some((item) => item.moduleId === mod.moduleId);
      if (isFav) {
        addToast('info', 'Đã bỏ ghim', `Đã loại bỏ ${mod.moduleName} khỏi lối tắt yêu thích.`);
        return prev.filter((item) => item.moduleId !== mod.moduleId);
      } else {
        addToast('success', 'Đã ghim lối tắt', `Đã thêm ${mod.moduleName} vào danh sách yêu thích.`);
        const newItem: FavoriteItem = {
          moduleId: mod.moduleId,
          moduleName: mod.moduleName,
          timestamp: new Date().toISOString(),
          customGroup: 'Thường xuyên',
          workspaceId: mod.workspaceId,
          iconName: mod.iconName || 'FileText',
        };
        return [...prev, newItem];
      }
    });
  };

  const handleUpdateFavoriteNote = (moduleId: string, note: string) => {
    setFavorites((prev) => prev);
    addToast('success', 'Đã lưu ghi chú', 'Ghi chú cá nhân của bạn đã được cập nhật.');
  };

  const handleUpdateFavoriteGroup = (moduleId: string, group: string) => {
    setFavorites((prev) => prev);
    addToast('success', 'Đã lưu nhóm', `Phân loại thành công vào nhóm "${group}".`);
  };

  const handleClearRecents = () => {
    setRecents([]);
    addToast('info', 'Đã xóa lịch sử', 'Toàn bộ nhật ký lịch sử truy cập đã được làm sạch.');
  };

  const handleClearFavorites = () => {
    setFavorites([]);
    addToast('info', 'Đã xóa yêu thích', 'Toàn bộ danh sách lối tắt yêu thích đã bị loại bỏ.');
  };

  const handleSeedSimulation = () => {
const sampleRecents: RecentVisitItem[] = [
];
const sampleFavorites: FavoriteItem[] = [
];
setRecents(sampleRecents);
setFavorites(sampleFavorites);
addToast('success', 'Seeding thành công', 'Đã nạp thành công 4 lịch sử truy cập và 3 lối tắt yêu thích tối ưu.');
  };

  // System Preferences state & storage sync
  const [isSystemPreferencesOpen, setIsSystemPreferencesOpen] = useState<boolean>(false);
  const [systemPreferences, setSystemPreferences] = useState<SystemPreferences>(() => {
    try {
      const explicitScale = localStorage.getItem('nexussync_display_scale');
      const savedNexus = localStorage.getItem('nexus_system_preferences');
      const savedNexusSync = localStorage.getItem('nexussync_system_preferences');
      const saved = savedNexusSync || savedNexus;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (explicitScale) {
          parsed.displayScaleMode = explicitScale;
        }
        return {
          ...DEFAULT_SYSTEM_PREFERENCES,
          ...parsed,
        };
      }
      if (explicitScale) {
        return {
          ...DEFAULT_SYSTEM_PREFERENCES,
          displayScaleMode: explicitScale as DisplayScaleMode,
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SYSTEM_PREFERENCES;
  });

  // Calculate and apply 'Smart Fit' scale factor relative to standard 1920x1080 resolution on initial window load
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const explicitScale = localStorage.getItem('nexussync_display_scale');
      const savedNexus = localStorage.getItem('nexus_system_preferences');
      const savedNexusSync = localStorage.getItem('nexussync_system_preferences');
      const saved = savedNexusSync || savedNexus;

      let preferredScaleMode: DisplayScaleMode = 'auto';
      if (explicitScale) {
        preferredScaleMode = explicitScale as DisplayScaleMode;
      } else if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.displayScaleMode) {
          preferredScaleMode = parsed.displayScaleMode;
        }
      }

      // Benchmark against standard 1920x1080 resolution
      const smartFitResult = calculateSmartFit(window.innerWidth, window.innerHeight);

      // Determine effective scale percentage
      let effectivePct: number;
      if (preferredScaleMode === 'auto') {
        effectivePct = smartFitResult.scalePercentage;
      } else {
        const parsed = parseInt(preferredScaleMode, 10);
        effectivePct = isNaN(parsed) ? smartFitResult.scalePercentage : parsed;
      }

      // Apply initial CSS scale variables on document root immediately to avoid layout shift
      const root = document.documentElement;
      root.style.setProperty('--app-scale', (effectivePct / 100).toString());
      root.style.setProperty('--app-scale-pct', `${effectivePct}%`);
      root.setAttribute('data-scale-pct', effectivePct.toString());
      root.setAttribute('data-scale-mode', preferredScaleMode);
      root.setAttribute('data-smartfit-benchmark', '1920x1080');
      root.setAttribute('data-smartfit-calculated', `${smartFitResult.scalePercentage}%`);

      if (systemPreferences.displayScaleMode !== preferredScaleMode) {
        setSystemPreferences((prev) => ({
          ...prev,
          displayScaleMode: preferredScaleMode,
        }));
      }
    } catch (e) {
      console.warn('Smart Fit initial scale calculation fallback triggered:', e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('nexussync_system_preferences', JSON.stringify(systemPreferences));
    localStorage.setItem('nexus_system_preferences', JSON.stringify(systemPreferences));
    if (systemPreferences.displayScaleMode) {
      localStorage.setItem('nexussync_display_scale', systemPreferences.displayScaleMode);
    }
    workspaceCacheManager.configure({
      autoCleaningEnabled: systemPreferences.autoCacheCleaningEnabled,
      retentionMinutes: systemPreferences.cacheRetentionMinutes || 3,
      maxInactiveWorkspaces: systemPreferences.maxCachedWorkspaces || 3,
    });
  }, [systemPreferences]);


  // Real-time OS dark mode and timer listener for Auto-Theme
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [currentMinuteTime, setCurrentMinuteTime] = useState<number>(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleChange);
      return () => (mediaQuery as any).removeListener(handleChange);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setCurrentMinuteTime(d.getHours() * 60 + d.getMinutes());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const effectiveTheme: AppTheme = useMemo(() => {
    const mode = systemPreferences.autoThemeMode || 'manual';
    if (mode === 'system') {
      return systemPrefersDark ? 'cool-dark' : 'light';
    }
    if (mode === 'schedule') {
      const [startH, startM] = (systemPreferences.scheduleStartDark || '18:00').split(':').map(Number);
      const [endH, endM] = (systemPreferences.scheduleEndDark || '06:00').split(':').map(Number);
      const startMinutes = (startH || 18) * 60 + (startM || 0);
      const endMinutes = (endH || 6) * 60 + (endM || 0);

      if (startMinutes > endMinutes) {
        if (currentMinuteTime >= startMinutes || currentMinuteTime < endMinutes) {
          return 'cool-dark';
        }
        return 'light';
      }
      if (currentMinuteTime >= startMinutes && currentMinuteTime < endMinutes) {
        return 'cool-dark';
      }
      return 'light';
    }
    return systemPreferences.theme;
  }, [
    systemPreferences.autoThemeMode,
    systemPreferences.scheduleStartDark,
    systemPreferences.scheduleEndDark,
    systemPreferences.theme,
    systemPrefersDark,
    currentMinuteTime,
  ]);
  // Load WorkQueue count on mount or role change
  useEffect(() => {
    const loadWorkItems = async () => {
      const data = await safeFetchJson<WorkspaceWorkItem[]>(
        `/api/workspace/work-items?role=${currentUser.role}&branchId=${currentBranch}`,
        undefined,
        []
      );
      setWorkItems(Array.isArray(data) ? data : []);
    };
    loadWorkItems();
  }, [currentUser.role, currentBranch]);

  // Global Keyboard Shortcuts (Ctrl+K for Omnibar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOmnibarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigateByRoute = useCallback((route: string, item?: WorkspaceWorkItem) => {
    if (!route && !item) return;

    if (item) {
      setGuidedTaskContext({ item, timestamp: Date.now() });
      setSelectedEntity({
        type: item.entity || 'TASK',
        id: item.entityId || item.businessReference || item.id,
        name: item.title,
        code: String(item.businessReference || item.entityId || ''),
        module: item.sourceModule,
        data: item,
      });
      addToast('info', 'Trợ lý Hướng Dẫn', `Đang mở tác vụ: ${item.title}`);
    }

    let targetModule: ModuleDefinition | undefined;

    // 1. Direct route, module ID, or module code match
    if (route) {
      const cleanUpper = route.replace(/^\//, '').toUpperCase();
      const cleanPath = route.startsWith('/') ? route : `/${route}`;
      targetModule = MODULE_REGISTRY.find(
        (m) =>
          m.route === route ||
          m.route === cleanPath ||
          m.route === `/${cleanUpper.toLowerCase()}` ||
          m.moduleId === cleanUpper ||
          m.code === cleanUpper
      );
    }

    // 2. Centralized keyword & alias lookup table
    if (!targetModule && route) {
      const cleanRoute = route.toLowerCase();
      const matchedRule = ROUTE_ALIAS_RULES.find((rule) =>
        rule.keywords.some((kw) => cleanRoute.includes(kw))
      );
      if (matchedRule) {
        targetModule = MODULE_REGISTRY.find((m) => m.moduleId === matchedRule.moduleId);
      }
    }

    // 3. Fallback to item sourceModule (e.g. M16, M15, M08, etc.)
    if (!targetModule && item?.sourceModule) {
      const modMatch = item.sourceModule.match(/M\d+/)?.[0];
      if (modMatch) {
        targetModule = MODULE_REGISTRY.find((m) => m.moduleId === modMatch);
      }
    }

    if (targetModule) {
      handleSelectModuleWithHistory(targetModule);
    } else {
      addToast('info', 'Điều hướng', `Chuyển tới route: ${route}`);
    }
  }, [handleSelectModuleWithHistory, addToast]);

  // Listen for nexus-navigate custom events from DeepLinkBanner, RedirectPanel, M10, etc.
  useEffect(() => {
    const handleNexusNavigate = (e: any) => {
      const detail = e.detail;
      if (!detail) return;

      // 1. Direct match by moduleId or module if provided in detail object
      if (typeof detail === 'object') {
        const directId = (detail.moduleId || detail.module || '').toString().trim().toUpperCase();
        if (directId) {
          const matchedById = MODULE_REGISTRY.find(
            (m) => m.moduleId === directId || m.code === directId
          );
          if (matchedById) {
            handleSelectModuleWithHistory(matchedById);
            return;
          }
        }
      }

      // 2. Direct route match or alias lookup
      const target = typeof detail === 'string' ? detail : detail.route || detail.moduleId;
      if (target) {
        handleNavigateByRoute(target, detail?.item);
      }
    };
    window.addEventListener('nexus-navigate', handleNexusNavigate);
    return () => window.removeEventListener('nexus-navigate', handleNexusNavigate);
  }, [handleSelectModuleWithHistory, handleNavigateByRoute]);

  const handlePrint = () => {
    setIsPdfModalOpen(true);
  };

  const handleRefreshData = () => {
    addToast('info', 'Làm mới dữ liệu', `Đang làm mới và đồng bộ dữ liệu phân hệ ${currentModule.moduleName}...`);
    window.dispatchEvent(new CustomEvent('nexus-workspace-refresh', { detail: { moduleId: currentModule.moduleId } }));
  };

  const handleWorkQueueAction = async (item: WorkspaceWorkItem, endpoint: string, actionLabel: string) => {
    setConfirmDialog({
      isOpen: true,
      title: `Xác nhận ${actionLabel}`,
      message: `Bạn có chắc chắn muốn thực hiện thao tác "${actionLabel}" cho chứng từ ${item.businessReference}?`,
      confirmText: actionLabel,
      onConfirm: async () => {
        const startTime = Date.now();
        const logId = 'ACT-' + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 5).toUpperCase();

        try {
          const res = await fetch(endpoint, {
            method: 'POST',
          });

          let data: any = {};
          const text = await res.text();
          if (text) {
            try {
              data = JSON.parse(text);
            } catch {
              // ignore
            }
          }

          if (!res.ok) {
            const errorMsg = data.error || data.message || `Lỗi máy chủ (${res.status})`;
            // Record failure in activity logs
            const failureLog: ActivityLogItem = {
              id: logId,
              timestamp: new Date().toISOString(),
              actionLabel,
              businessReference: item.businessReference,
              entity: item.entity,
              sourceModule: item.sourceModule,
              endpoint,
              status: 'FAILURE',
              userName: currentUser.name,
              userRole: currentUser.role,
              statusCode: res.status,
              reason: errorMsg,
              details: {
                responseBody: data,
                requiredPermission: item.requiredPermission,
                priority: item.priority
              }
            };
            setActivityLogs((prev) => [failureLog, ...prev]);

            throw new Error(errorMsg);
          }

          const successMsg = data.message || `${actionLabel} cho ${item.businessReference} hoàn tất thành công.`;

          // Record success in activity logs
          const successLog: ActivityLogItem = {
            id: logId,
            timestamp: new Date().toISOString(),
            actionLabel,
            businessReference: item.businessReference,
            entity: item.entity,
            sourceModule: item.sourceModule,
            endpoint,
            status: 'SUCCESS',
            userName: currentUser.name,
            userRole: currentUser.role,
            statusCode: res.status,
            reason: successMsg,
            details: {
              response: data,
              entityId: item.entityId,
              targetRoute: item.targetRoute
            }
          };
          setActivityLogs((prev) => [successLog, ...prev]);

          addToast('success', 'Thao tác thành công', successMsg, item.sourceModule);
          // Refresh work items & dismiss related task notifications, turn off/close drawer
          setWorkItems((prev) => prev.filter((i) => i.id !== item.id));

          setIsWorkQueueOpen(false);
          setIsNotificationsOpen(false);
          // Just dummy state update
        } catch (err: any) {
          addToast('danger', 'Lỗi thực thi', err.message || 'Không thể xử lý yêu cầu.', item.sourceModule);
        }
      }
    });
  };

  return (
<div
  id="nexus-app-root"
  className={`h-screen w-screen flex flex-col overflow-hidden font-sans transition-all duration-300 ${effectiveTheme === 'cool-dark' ? 'bg-slate-950 text-slate-100 dark-theme' : effectiveTheme === 'warm-sepia' ? 'bg-amber-50/20 text-amber-950 sepia-theme' : 'bg-slate-100 text-slate-900 light-theme'} ${systemPreferences.density === 'compact' ? 'density-compact text-[13px]' : systemPreferences.density === 'spaced' ? 'density-spaced text-[15px]' : 'density-cozy text-[14px]'}`}
>
  {/* L1: Global Header (Persistent) */}
  <GlobalHeader
    currentUser={currentUser}
    currentBranch={currentBranch}
    onBranchChange={setCurrentBranch}
    currentProfile={currentProfileId}
    onProfileChange={handleProfileChange}
    onOpenOmnibar={() => setIsOmnibarOpen(true)}
    onOpenLogin={() => setIsLoginModalOpen(true)}
    onOpenPreferences={() => setIsSystemPreferencesOpen(true)}
    onLogout={() => {
      setConfirmDialog({
        isOpen: true,
        title: 'Đăng xuất phiên làm việc',
        message: 'Bạn có chắc chắn muốn đăng xuất hoặc đổi tài khoản phiên làm việc?',
        variant: 'warning',
        confirmText: 'Đổi tài khoản',
        cancelText: 'Hủy',
        onConfirm: () => {
          setConfirmDialog(null);
          setIsLoginModalOpen(true);
        }
      });
    }}
    onOpenDecisionAssistant={() => setIsDecisionAssistantOpen(true)}
    onOpenGuidance={() => setIsGuidanceModalOpen(true)}
    onOpenAcademy={() => setIsAcademyOpen(true)}
    onOpenGlossary={() => setIsGlossaryOpen(true)}
    onOpenWorkQueue={() => setIsWorkQueueOpen(true)}
    onOpenNotifications={() => setIsNotificationsOpen(true)}
    onOpenContextRail={() => {
      setContextRailEntity(null);
      setIsContextRailOpen(true);
    }}
    onOpenUnifiedPipeline={() => setIsUnifiedPipelineOpen(true)}
    onOpenExport={() => setIsTableExportOpen(true)}
    pendingWorkCount={workItems.length}
    unreadNotifCount={unreadCount}
    onPrintPage={handlePrint}
    isFullscreen={isFullscreen}
    onToggleFullscreen={handleToggleFullscreen}
    canGoBack={canGoBack}
    previousModule={previousModule}
    onGoBack={handleGoBack}
    pinnedModules={favorites}
    currentModuleId={currentModule.moduleId}
    onSelectPinnedModule={(modId) => {
      const found = MODULE_REGISTRY.find((m) => m.moduleId === modId);
      if (found) {
        handleSelectModuleWithHistory(found);
        addToast('info', 'Truy cập nhanh', `Đã chuyển đến ${found.moduleName} (${found.moduleId}).`);
      }
    }}
  />

  {/* Main Body: L1 Sidebar + L2-L4 Work Area */}
  <div className="flex-1 flex min-h-0 overflow-hidden relative">
    {/* Fullscreen Left Edge Hover Trigger Zone */}
    {isFullscreen && (
      <div
        id="fullscreen-sidebar-hover-trigger"
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        className="fixed left-0 top-14 bottom-0 w-4 z-40 cursor-pointer group flex items-center justify-start hover:w-6 transition-all"
        title="Rê chuột vào đây để mở nhanh menu điều hướng Sidebar trong chế độ toàn màn hình"
      >
        <div className="h-24 w-1.5 bg-blue-500/40 group-hover:bg-blue-600 rounded-r-md transition-all shadow-xs" />
      </div>
    )}

    {/* L1: Sidebar Navigation (Standard in normal mode; Slide-out drawer on hover in Fullscreen mode) */}
    <div
      id="nexus-sidebar-wrapper"
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
      className={
        isFullscreen
          ? `fixed left-0 top-14 bottom-0 z-50 transition-transform duration-300 ease-in-out shadow-2xl ${
              isHoveringSidebarArea ? 'translate-x-0' : '-translate-x-full pointer-events-none'
            }`
          : 'relative shrink-0 flex'
      }
    >
      <PrimaryNavigation
        currentModuleId={currentModule.moduleId}
        onSelectModule={(mod) => {
          handleSelectModuleWithHistory(mod);
          if (isFullscreen) setIsHoveringSidebarArea(false);
        }}
        onOpenOmnibar={() => setIsOmnibarOpen(true)}
        onOpenWorkQueue={() => setIsWorkQueueOpen(true)}
        onOpenProfile={() => setIsLoginModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadNotificationsCount={unreadCount}
        allowedModules={activeProfile.allowedModules}
        recents={recents}
        favorites={favorites}
        onOpenRecentFavorites={() => setIsRecentFavoritesOpen(true)}
        onOpenPreferences={() => setIsSystemPreferencesOpen(true)}
        currentBranch={currentBranch}
        onBranchChange={setCurrentBranch}
        currentProfile={currentProfileId}
        onProfileChange={handleProfileChange}
        canGoBack={canGoBack}
        previousModule={previousModule}
        onGoBack={() => {
          handleGoBack();
          if (isFullscreen) setIsHoveringSidebarArea(false);
        }}
      />
    </div>

  {/* L2 & L3 & L4: Workspace Container */}
  <DomainWorkspaceShell
    module={currentModule}
    currentUser={currentUser}
    onNavigateHome={() => {
      const m01 = MODULE_REGISTRY.find((m) => m.moduleId === 'M01');
      if (m01) handleSelectModuleWithHistory(m01);
      addToast('info', 'Điều hướng', 'Đã quay lại Trang chủ Hub Tổng quan ERP.');
    }}
    onNavigateDomain={() => {
      addToast('info', 'Nhóm phân hệ', `Bạn đang ở nhóm phân hệ [${currentModule.domain}]. Chọn module khác từ menu bên trái nếu cần.`);
    }}
    isFavorite={favorites.some(f => f.moduleId === currentModule.moduleId)}
    onToggleFavorite={() => handleToggleFavorite(currentModule)}
  onOpenGuidance={() => setIsGuidanceModalOpen(true)}
activeWorkspaceName={
  currentModule.moduleId === 'M08'
? 'Quản Lý Đơn Mua Hàng & Đối Chiếu 3 Bên P2P (Purchase Orders)'
: currentModule.moduleId === 'M02'
? 'Nhật Ký Kiểm Toán Toàn Hệ Thống & Bảo Mật Audit Compliance'
: currentModule.moduleId === 'M17'
? 'Trung Tâm Vận Hành Kho & Master WMS (Tồn kho 3 trạng thái & Sổ cái)'
: currentModule.moduleId === 'M20'
? 'Xử Lý Điều Chỉnh Tồn Kho & Kiểm Toán Cân Bằng (Stock Adjustment)'
: currentModule.moduleId === 'M22'
? 'Quản lý Lô Sản Xuất, Hạn Sử Dụng & FEFO'
: currentModule.moduleId === 'M23'
? 'Quản lý Serial & IMEI'
: currentModule.moduleId === 'M25'
? 'Điều Hành Sản Xuất MES & Định Mức Kỹ Thuật BOM'
: currentModule.moduleId === 'M26'
? 'Hoạch Định Chuỗi Cung Ứng & Cân Bằng Cung Cầu MRP'
: currentModule.moduleId === 'M27'
? 'Quản Lý Bảo Trì Thiết Bị EAM & Lập Lịch PM'
: currentModule.moduleId === 'M28'
? 'Quản Trị Nhân Sự & Chấm Công Bảng Lương HRM'
: currentModule.moduleId === 'M29'
? 'Hệ Thống Quản Lý Tài Liệu Số Hóa & Ký Số DMS'
: currentModule.moduleId === 'M37'
? 'Báo Cáo Phân Tích Thông Minh BI & Tháp P&L'
: currentModule.moduleId === 'M38'
? 'Hỗ Trợ Kỹ Thuật & Giải Quyết Sự Cố Service Desk'
: currentModule.moduleId === 'M39'
? 'Kiểm Soát Chất Lượng QMS'
: currentModule.moduleId === 'M40'
? 'An Toàn Lao Động & Vệ Sinh Môi Trường EHS'
: currentModule.moduleId === 'M41'
? 'Cơ Cấu Giá & Chính Sách Thương Mại'
: currentModule.moduleId === 'M01'
? 'Tổng quan Doanh nghiệp'
: currentModule.moduleName
        }
        onRefresh={() => addToast('info', 'Làm mới dữ liệu', 'Đã cập nhật dữ liệu từ Authoritative Core.')}
        onPrint={handlePrint}
  onExport={() => setIsTableExportOpen(true)}


>
  {/* Workspaces Switcher with Workspace Isolation & Lazy Loading */}
  <WorkspaceErrorBoundary
    key={currentModule.moduleId}
    moduleId={currentModule.moduleId}
    moduleName={currentModule.moduleName}
    onNavigateHome={() => {
      const m01 = MODULE_REGISTRY.find((m) => m.moduleId === 'M01');
      if (m01) handleSelectModuleWithHistory(m01);
    }}
  >
    <Suspense fallback={
      <WorkspaceLoadingFallback
        moduleName={currentModule.moduleName}
        moduleCode={currentModule.code || currentModule.moduleId}
      />
    }>
        {currentModule.moduleId === 'M01' && (
  <WorkspaceHub
onSelectModule={handleSelectModuleWithHistory}
onOpenWorkQueue={() => setIsWorkQueueOpen(true)}
onOpenOmnibar={() => setIsOmnibarOpen(true)}
onOpenDecisionAssistant={() => setIsDecisionAssistantOpen(true)}
onOpenAcademy={() => setIsAcademyOpen(true)}
onOpenGlossary={() => setIsGlossaryOpen(true)}
  currentUser={currentUser}
allowedModules={activeProfile.allowedModules}
activeProfileName={activeProfile.name}
activeProfileDesc={activeProfile.description}
density={systemPreferences.density}
          />
        )}

        {currentModule.moduleId === 'M17' && (
<MasterWmsWorkspace
  onSelectEntity={handleSelectEntity}
  onNotify={addToast}
  guidedTask={guidedTaskContext}
  selectedEntity={selectedEntity}
/>
        )}

  {currentModule.moduleId === 'M18' && (
          <WarehouseManagementWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={handleNotify}
/>
        )}

        {currentModule.moduleId === 'M20' && (
          <StockAdjustmentWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={handleNotify}
/>
        )}

  {currentModule.moduleId === 'M21' && (
<M21InternalTransfersWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={handleNotify}
/>
        )}
        {currentModule.moduleId === 'M22' && (
          <M22LotsBatchesWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={handleNotify}
/>
        )}

{currentModule.moduleId === 'M23' && (
  <M23SerialsWorkspace
    onSelectEntity={setSelectedEntity}
    onNotify={handleNotify}
  />
        )}

  {currentModule.moduleId === 'M24' && (
<M24WMSExtendedWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={handleNotify}
/>
        )}

{currentModule.moduleId === 'M25' && (
  <ManufacturingWorkspace
    onSelectEntity={setSelectedEntity}
    onNotify={addToast}
  />
        )}

{currentModule.moduleId === 'M26' && (
  <SupplyChainWorkspace
    onSelectEntity={setSelectedEntity}
    onNotify={addToast}
  />
        )}

{currentModule.moduleId === 'M27' && (
  <AssetMaintenanceWorkspace
    onSelectEntity={setSelectedEntity}
    onNotify={addToast}
   currentUser={currentUser}
  />
        )}

{currentModule.moduleId === 'M28' && (
  <HRWorkspace
    onSelectEntity={setSelectedEntity}
    onNotify={addToast}
  />
        )}

{currentModule.moduleId === 'M29' && (
  <DMSWorkspace
    onSelectEntity={setSelectedEntity}
    onNotify={addToast}
  />
        )}

{currentModule.moduleId === 'M40' && (
  <EHSWorkspace
    onSelectEntity={setSelectedEntity}
    onNotify={addToast}
  />
        )}

  {currentModule.moduleId === 'M41' && (
<M41PricingManagementWorkspace />
        )}

{currentModule.moduleId === 'M38' && (
  <ServiceDeskWorkspace
    onSelectEntity={setSelectedEntity}
    onNotify={addToast}
  />
        )}

{currentModule.moduleId === 'M39' && (
  <M39QualityControlWorkspace
    onSelectEntity={setSelectedEntity}
    onNotify={addToast}
  />
        )}

  {currentModule.moduleId === 'M02' && (
<AuditComplianceWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

        {currentModule.moduleId === 'M03' && (
          <SystemSettingsWorkspace
            onSelectEntity={setSelectedEntity}
            onNotify={addToast}
            currentUser={currentUser}
            currentBranch={currentBranch}
            onBranchChange={setCurrentBranch}
            currentProfile={currentProfileId}
            onProfileChange={handleProfileChange}
          />
        )}

  {currentModule.moduleId === 'M04' && (
<SuperAdminRBACWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
 currentUser={currentUser}
/>
        )}

  {currentModule.moduleId === 'M05' && (
<M05EventBusWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

  {currentModule.moduleId === 'M06' && (
<M06InnovationRDWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

  {currentModule.moduleId === 'M07' && (
<M07CustomersItemMasterWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

  {currentModule.moduleId === 'M08' && (
<M08PurchaseOrdersWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
  guidedTask={guidedTaskContext}
  selectedEntity={selectedEntity}
  currentUser={currentUser}
  allowedModules={activeProfile.allowedModules}
/>
        )}

  {currentModule.moduleId === 'M09' && (
<M09SuppliersSRMWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
 currentUser={currentUser}
  allowedModules={activeProfile.allowedModules}
/>
        )}

  {currentModule.moduleId === 'M10' && (
<M10StrategicSourcingWorkspace
 currentUser={currentUser}
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

  {currentModule.moduleId === 'M11' && (
<M11SrmSupplierMgmtWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

  {currentModule.moduleId === 'M12' && (
<M12CrmLeadsWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

  {currentModule.moduleId === 'M13' && (
<M13SalesOrdersWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

  {currentModule.moduleId === 'M14' && (
<M14SalesCommissionWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

  {currentModule.moduleId === 'M15' && (
<M15ReturnsRMAWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
  guidedTask={guidedTaskContext}
/>
        )}

  {currentModule.moduleId === 'M16' && (
<M16POSRetailWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
  guidedTask={guidedTaskContext}
/>
        )}

  {currentModule.moduleId === 'M19' && (
<M19StocktakeWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

  {currentModule.moduleId === 'M30' && (
<M30GeneralLedgerWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

  {currentModule.moduleId === 'M31' && (
<M31InvoicesArApWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

  {currentModule.moduleId === 'M32' && (
<M32PaymentsTreasuryWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

  {currentModule.moduleId === 'M33' && (
<M33BankReconciliationWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

  {currentModule.moduleId === 'M34' && (
<M34FinancialConsolidationWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

  {currentModule.moduleId === 'M35' && (
<M35ProjectsWBSWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

  {currentModule.moduleId === 'M36' && (
<M36LogisticsWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

  {currentModule.moduleId === 'M37' && (
<M37BiAnalyticsWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}

  {currentModule.moduleId === 'M42' && (
<M42CostAllocationWorkspace
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
  currentUser={currentUser}
/>
        )}

  {!DEDICATED_WORKSPACE_MODULE_IDS.has(currentModule.moduleId) && (
<GenericModuleWorkspace
  module={currentModule}
  onSelectEntity={setSelectedEntity}
  onNotify={addToast}
/>
        )}
      </Suspense>
    </WorkspaceErrorBoundary>
  </DomainWorkspaceShell>
  </div>

  {/* Omnibar Modal (Ctrl+K) */}
  <CommandOmnibarModal
isOpen={isOmnibarOpen}
onClose={() => setIsOmnibarOpen(false)}
onNavigate={handleNavigateByRoute}
allowedModules={activeProfile.allowedModules}
  />

  {/* Role & Simulated Login Modal */}
  <SimulatedLoginModal
isOpen={isLoginModalOpen}
    onClose={() => setIsLoginModalOpen(false)}
    currentUser={currentUser}
    onSelectUser={(u) => {
      setCurrentUser(u);
      addToast('success', 'Đổi vai trò thành công', `Hiện đang thao tác với vai trò: ${u.role} (${u.name})`);
    }}
    currentProfileId={currentProfileId}
    onProfileChange={handleProfileChange}
  />

  {/* Unified Activity & Task Center Drawer */}
  <UnifiedActivityTaskDrawer
isOpen={isWorkQueueOpen || isNotificationsOpen}
    initialTab={isNotificationsOpen ? 'notifications' : 'workqueue'}
onInspectEntity={handleInspectEntity}
onClose={() => {
      setIsWorkQueueOpen(false);
      setIsNotificationsOpen(false);
    }}
  notifications={notifications}
onMarkAsRead={handleMarkAsRead}
onMarkAllAsRead={handleMarkAllAsRead}
onDeleteNotification={handleDeleteNotification}
onClearAllNotifications={handleClearAllNotifications}
onTriggerSimulation={handleTriggerSimulation}
onPreferencesChange={setNotificationPrefs}
preferences={notificationPrefs}
workItems={workItems}
onNavigate={handleNavigateByRoute}
onWorkItemAction={handleWorkQueueAction}
activityLogs={activityLogs}
onClearActivityLogs={() => {
      setActivityLogs([]);
      try {
        localStorage.removeItem('nexussync_activity_logs');
        addToast('info', 'Đã xóa nhật ký', 'Lịch sử nhật ký hoạt động đã được làm trống.');
      } catch {
        // ignore
      }
    }}
  />

  {/* L3: ContextRail Layer (Domain-Specific companion) */}
  <ContextRail
    isOpen={isContextRailOpen}
    onClose={() => setIsContextRailOpen(false)}
    selectedEntity={contextRailEntity}
    currentModule={currentModule}
    isPinned={favorites.some((f) => f.moduleId === currentModule.moduleId)}
    onTogglePin={() => handleToggleFavorite(currentModule)}
    pinnedModules={favorites}
    onNavigate={(moduleId) => {
      const found = MODULE_REGISTRY.find((m) => m.moduleId === moduleId);
      if (found) {
        handleSelectModuleWithHistory(found);
        addToast('info', 'Điều hướng liên phân hệ', `Đã chuyển đến ${found.moduleName} (${found.moduleId}).`);
      }
    }}
    workspaceActions={[
      {
        id: 'refresh',
        label: `Làm mới ${currentModule.moduleName}`,
        description: 'Đồng bộ trạng thái từ Domain Core',
        onClick: handleRefreshData,
      },
      {
        id: 'export',
        label: 'Xuất bảng dữ liệu hiện tại',
        description: 'Tải tệp CSV / Microsoft Excel',
        onClick: () => setIsTableExportOpen(true),
      },
      {
        id: 'print',
        label: 'Xem trước bản in & PDF',
        description: 'Mẫu biểu kế toán & chứng từ',
        onClick: handlePrint,
      },
      {
        id: 'guidance',
        label: 'Hướng dẫn quy trình nghiệp vụ',
        description: 'SOP & Next Best Action',
        onClick: () => setIsGuidanceModalOpen(true),
      },
    ]}
    savedViews={[
      { id: 'all', name: `Tất cả bản ghi [${currentModule.code}]`, active: true },
      { id: 'pending', name: 'Đang xử lý & Chờ phê duyệt SLA' },
      { id: 'audited', name: 'Đã kiểm toán & Đối soát GL' },
    ]}
    quickStats={[
      { label: `Phân hệ ${currentModule.code}`, value: currentModule.moduleName, status: 'info' },
      { label: 'Quyền hạn hiện tại', value: currentUser.role, status: 'success' },
      { label: 'Chi nhánh làm việc', value: currentBranch, status: 'info' },
      { label: 'Trạng thái Core', value: 'Synced & Active', status: 'success' },
    ]}
  />

  {/* Recent & Favorites Manager Drawer */}
  <RecentFavoritesDrawer
isOpen={isRecentFavoritesOpen}
    onClose={() => setIsRecentFavoritesOpen(false)}
    recents={recents}
    favorites={favorites}
    onToggleFavorite={handleToggleFavorite}
    onUpdateFavoriteNote={handleUpdateFavoriteNote}
    onUpdateFavoriteGroup={handleUpdateFavoriteGroup}
    onClearRecents={handleClearRecents}
onClearFavorites={handleClearFavorites}
onNavigate={(mod) => handleSelectModuleWithHistory(mod)}
onTriggerSeedSimulation={handleSeedSimulation}
  />

  {/* System Preferences Drawer */}
  <SystemPreferencesDrawer
isOpen={isSystemPreferencesOpen}
onClose={() => setIsSystemPreferencesOpen(false)}
preferences={systemPreferences}
onUpdatePreferences={setSystemPreferences}
effectiveTheme={effectiveTheme}
  />

  {/* Quick Preview Drawer */}
  <QuickPreviewDrawer
isOpen={isQuickPreviewOpen}
onClose={() => setIsQuickPreviewOpen(false)}
preview={previewData}
onPrint={handlePrint}
  />

  {/* PDF Export & Print Modal */}
  <PdfPrintModal
isOpen={isPdfModalOpen}
onClose={() => setIsPdfModalOpen(false)}
module={currentModule}
  currentUser={currentUser}
onNotify={addToast}
  />

  {/* CSV / Excel Data Table Export Modal */}
  <TableExportModal
isOpen={isTableExportOpen}
onClose={() => setIsTableExportOpen(false)}
currentModule={currentModule}
  currentUser={currentUser}
currentBranchName={BRANCHES.find((b) => b.id === currentBranch)?.name || 'Tổng công ty'}
onNotify={addToast}
  />

  {/* Unified Data Pipeline Modal */}
  <UnifiedDataPipelineModal
isOpen={isUnifiedPipelineOpen}
onClose={() => setIsUnifiedPipelineOpen(false)}
  />

  {/* ERP Business Decision Assistant Modal */}
  <BusinessDecisionAssistantModal
isOpen={isDecisionAssistantOpen}
onClose={() => setIsDecisionAssistantOpen(false)}
onSelectModule={(mod) => {
      handleSelectModuleWithHistory(mod);
      addToast('info', 'Chuyển phân hệ', `Đã chuyển đến ${mod.moduleName} (${mod.moduleId})`);
    }}
    onNavigateModule={(moduleId) => {
      const found = MODULE_REGISTRY.find((m) => m.moduleId === moduleId);
      if (found) {
        handleSelectModuleWithHistory(found);
        addToast('info', 'Chuyển phân hệ', `Đã chuyển đến ${found.moduleName} (${found.moduleId})`);
      }
    }}
  />

  {/* ERP Business Guidance & Next Best Action Modal */}
  <GuidanceModal
isOpen={isGuidanceModalOpen}
onClose={() => setIsGuidanceModalOpen(false)}
  currentUser={currentUser}
  currentBranch={currentBranch}
currentModuleId={currentModule.moduleId}
onNavigateToModule={(moduleId, _payload) => {
      const found = MODULE_REGISTRY.find((m) => m.moduleId === moduleId);
      if (found) {
        handleSelectModuleWithHistory(found);
        addToast('info', 'Chuyển phân hệ', `Đã điều hướng sang ${found.moduleName} (${found.moduleId})`);
      }
    }}
  />

  {/* ERP Academy: 12 E2E Value Streams & Practice Scenarios */}
  <ErpAcademyModal
    isOpen={isAcademyOpen}
    onClose={() => setIsAcademyOpen(false)}
    onSelectModule={(mod) => {
      handleSelectModuleWithHistory(mod);
      addToast('info', 'Điều hướng học viện', `Đang mở phân hệ thực hành: ${mod.moduleName}`);
    }}
    onNavigateModule={(moduleId) => {
      const found = MODULE_REGISTRY.find((m) => m.moduleId === moduleId);
      if (found) {
        handleSelectModuleWithHistory(found);
        addToast('info', 'Điều hướng học viện', `Đang mở phân hệ thực hành: ${found.moduleName}`);
      }
    }}
  />

  {/* ERP Business Glossary Modal */}
  <ErpGlossaryModal
    isOpen={isGlossaryOpen}
    onClose={() => setIsGlossaryOpen(false)}
    onSelectModule={(mod) => {
      handleSelectModuleWithHistory(mod);
      addToast('info', 'Phân hệ liên quan', `Đã mở ${mod.moduleName}`);
    }}
    onNavigateModule={(moduleId) => {
      const found = MODULE_REGISTRY.find((m) => m.moduleId === moduleId);
      if (found) {
        handleSelectModuleWithHistory(found);
        addToast('info', 'Phân hệ liên quan', `Đã mở ${found.moduleName}`);
      }
    }}
  />


  {/* ERP Module Guided Drawer / Contract Specification */}
  <ModuleGuidedDrawer
    isOpen={isGuidedDrawerOpen}
    onClose={() => setIsGuidedDrawerOpen(false)}
    module={currentModule}
    onSelectModule={(mod) => {
      handleSelectModuleWithHistory(mod);
      addToast('info', 'Chuyển phân hệ', `Đã chuyển sang ${mod.moduleName} (${mod.moduleId})`);
    }}
    onNavigateModule={(moduleId) => {
      const found = MODULE_REGISTRY.find((m) => m.moduleId === moduleId);
      if (found) {
        handleSelectModuleWithHistory(found);
        addToast('info', 'Chuyển phân hệ', `Đã chuyển sang ${found.moduleName} (${found.moduleId})`);
      }
    }}
  />

  {/* Custom Confirm Dialog (Anti-Slop Rule #19) */}
  <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

  {/* Custom Toast Alerts */}
  <ToastContainer toasts={toasts} onDismiss={dismissToast} />
</div>
  );
};

export const App: React.FC = () => {
  return (
    <GlobalErrorBoundary>
      <GlobalThemeProvider>
        <AppContent />
      </GlobalThemeProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
