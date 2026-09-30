import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as Icons from 'lucide-react';
import { ModuleDefinition, MODULE_REGISTRY } from '../../../../config/moduleRegistry';
import { UserSession } from '../../../../types';
import { WorkspaceWorkItem } from '../../../../types/workspace';
import { m01WorkspaceApi, FlowSpanItem } from '../services/m01WorkspaceApi';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { TablePagination } from '../../../../components/common/TablePagination';
import { BulkActionBar, BulkActionItem } from '../../../../components/common/BulkActionBar';
import { ConfirmDialogState } from '../../../../types';
import { CorrelationRcaTraceModal } from './CorrelationRcaTraceModal';
import { EntityPreviewDrawer } from './EntityPreviewDrawer';

export type TaskCenterTab = 'all_items' | 'approvals' | 'tasks' | 'alerts' | 'activities';
export type PriorityFilter = 'ALL' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type SlaFilter = 'ALL' | 'OVERDUE' | 'IN_SLA' | 'NO_SLA';
export type StatusFilter = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'PROCESSED';

interface OperationalActivityTaskCenterProps {
  currentUser?: UserSession;
  onSelectModule?: (module: ModuleDefinition) => void;
  onOpenOmnibar?: () => void;
  initialTab?: TaskCenterTab;
}

export const OperationalActivityTaskCenter: React.FC<OperationalActivityTaskCenterProps> = ({
  currentUser,
  onSelectModule,
  onOpenOmnibar,
  initialTab = 'all_items',
}) => {
  // Navigation & Sub-Tabs
  const [activeTab, setActiveTab] = useState<TaskCenterTab>(initialTab);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Real Data States
  const [workItems, setWorkItems] = useState<WorkspaceWorkItem[]>([]);
  const [activities, setActivities] = useState<FlowSpanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const [batchResultToast, setBatchResultToast] = useState<{ total: number; successCount: number; failureCount: number } | null>(null);

  // Checkbox Selection for Bulk Actions (F14)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Search & Multi-dimensional Filters (F17)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<PriorityFilter>('ALL');
  const [selectedSla, setSelectedSla] = useState<SlaFilter>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL');
  const [assignedToMeOnly, setAssignedToMeOnly] = useState<boolean>(false);

  // Pagination (Rule #4 & #20)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [activityPage, setActivityPage] = useState<number>(1);
  const [activityPageSize, setActivityPageSize] = useState<number>(15);

  // Modals & Drawers
  const [rcaCorrelationId, setRcaCorrelationId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [previewWorkItem, setPreviewWorkItem] = useState<WorkspaceWorkItem | null>(null);

  // F15 & F18: Load Real Data from Backend API with 60s Auto-refresh
  const fetchWorkCenterData = useCallback(async () => {
    try {
      setRefreshing(true);
      const userRole = currentUser?.role || 'SUPER_ADMIN';
      const [itemsData, spansData] = await Promise.all([
        m01WorkspaceApi.getWorkItems(userRole, 'BR_HO', {
          moduleCode: selectedModuleFilter !== 'ALL' ? selectedModuleFilter : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          priority: selectedPriority !== 'ALL' ? selectedPriority : undefined,
          sla: selectedSla !== 'ALL' ? selectedSla : undefined,
          search: searchQuery.trim() ? searchQuery : undefined,
          assignedTo: assignedToMeOnly && currentUser?.username ? currentUser.username : undefined
        }),
        m01WorkspaceApi.getSpans({ pageSize: 50 })
      ]);

      setWorkItems(itemsData || []);
      setActivities(spansData.spans || []);
      setLastRefreshedAt(new Date().toLocaleTimeString('vi-VN'));
    } catch (err) {
      console.error('Failed to load activity & task center data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, selectedModuleFilter, selectedStatus, selectedPriority, selectedSla, searchQuery, assignedToMeOnly]);

  useEffect(() => {
    fetchWorkCenterData();
    // F18: Auto refresh every 60s
    const interval = setInterval(fetchWorkCenterData, 60000);
    return () => clearInterval(interval);
  }, [fetchWorkCenterData]);

  // F16: Execute Single Action with Rule #19 ConfirmDialog and M02 Audit
  const handleExecuteAction = (
    item: WorkspaceWorkItem,
    act: { id: string; label: string; endpoint: string; variant?: string }
  ) => {
    const isDestructive = act.variant === 'danger' || act.id.includes('reject') || act.id.includes('cancel');
    setConfirmDialog({
      isOpen: true,
      title: isDestructive ? `Xác nhận từ chối: ${act.label}` : `Xác nhận thực thi: ${act.label}`,
      message: `Bạn đang thực hiện thao tác "${act.label}" cho chứng từ ${item.businessReference || item.id}. Thao tác này sẽ cập nhật vào Sổ cái Kiểm toán M02 & Quy trình nghiệp vụ của phân hệ ${item.sourceModule}.`,
      variant: isDestructive ? 'danger' : 'primary',
      confirmText: act.label,
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        setExecutingId(item.id);
        try {
          await m01WorkspaceApi.executeAction(act.endpoint, {
            entityId: String(item.entityId || item.id),
            userId: currentUser?.username || 'SYSTEM_ADMIN',
            actionType: act.id
          });
          // Clear selection if this item was selected
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
          await fetchWorkCenterData();
        } catch (err: any) {
          console.error('Action execution failed:', err);
        } finally {
          setExecutingId(null);
        }
      }
    });
  };

  // F14: Batch Action Execution with Sequential Idempotency
  const handleBulkAction = (actionType: 'approve' | 'reject') => {
    const selectedItems = workItems.filter(
      (item) => selectedIds.has(item.id) && item.canAction !== false
    );
    if (selectedItems.length === 0) return;

    const isApprove = actionType === 'approve';
    const actionLabel = isApprove ? 'Duyệt hàng loạt' : 'Từ chối hàng loạt';

    setConfirmDialog({
      isOpen: true,
      title: `Xác nhận ${actionLabel} (${selectedItems.length} tác vụ)`,
      message: `Bạn có chắc chắn muốn ${actionLabel.toLowerCase()} cho ${selectedItems.length} chứng từ đã chọn? Mỗi chứng từ sẽ được xử lý độc lập với mã Idempotency riêng và ghi nhận Sổ cái Kiểm toán M02.`,
      variant: isApprove ? 'primary' : 'danger',
      confirmText: actionLabel,
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        setRefreshing(true);
        try {
          const batchPayload = selectedItems.map((item) => {
            const matchingAction = item.actions?.find((a) =>
              isApprove
                ? a.variant === 'primary' || a.id.includes('approve') || a.id.includes('confirm')
                : a.variant === 'danger' || a.id.includes('reject')
            ) || item.actions?.[0];

            return {
              id: item.id,
              actionKey: matchingAction ? matchingAction.endpoint : `/api/workspace/work-items/${item.id}/action`,
              entityId: String(item.entityId || item.id),
              actionType: isApprove ? 'approve' : 'reject'
            };
          });

          const result = await m01WorkspaceApi.executeBulkActions(
            batchPayload,
            currentUser?.username || 'SYSTEM_ADMIN'
          );

          setBatchResultToast({
            total: result.total,
            successCount: result.successCount,
            failureCount: result.failureCount
          });
          setSelectedIds(new Set());
          await fetchWorkCenterData();
        } catch (err: any) {
          console.error('Bulk action error:', err);
        } finally {
          setRefreshing(false);
        }
      }
    });
  };

  // Client-Side CSV Export (UTF-8 with BOM)
  const handleExportCsv = () => {
    const headers = ['Mã CT / Ref', 'Phân hệ nguồn', 'Loại tác vụ', 'Tiêu đề', 'Mô tả', 'Ưu tiên', 'Trạng thái', 'Hạn SLA', 'Tuổi việc', 'Giá trị (VND)'];
    const rows = filteredWorkItems.map(item => [
      `"${item.businessReference || item.id}"`,
      `"${item.sourceModule || ''}"`,
      `"${item.type || ''}"`,
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${(item.description || '').replace(/"/g, '""')}"`,
      `"${item.priority || ''}"`,
      `"${item.status || ''}"`,
      `"${item.slaLabel || (item.slaHours ? `${item.slaHours}h` : 'Chưa có SLA')}"`,
      `"${item.ageFormatted || ''}"`,
      item.amount ? item.amount.toString() : '0'
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nexus_activity_tasks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Module List for Filter
  const availableModules = useMemo(() => {
    const mods = new Set<string>();
    workItems.forEach((i) => {
      const match = (i.sourceModule || '').match(/(M\d+)/);
      if (match) mods.add(match[1]);
      else if (i.sourceModule) mods.add(i.sourceModule);
    });
    return Array.from(mods).sort();
  }, [workItems]);

  // Filtered Work Items
  const filteredWorkItems = useMemo(() => {
    return workItems.filter((item) => {
      // 1. Tab filter
      if (activeTab === 'approvals' && item.type !== 'APPROVAL') return false;
      if (activeTab === 'tasks' && item.type !== 'TASK') return false;
      if (activeTab === 'alerts' && item.type !== 'ALERT') return false;

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchRef = (item.businessReference || '').toLowerCase().includes(q);
        const matchMod = (item.sourceModule || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchRef && !matchMod) return false;
      }

      // 3. Module filter
      if (selectedModuleFilter !== 'ALL') {
        const match = (item.sourceModule || '').includes(selectedModuleFilter);
        if (!match) return false;
      }

      // 4. Priority filter
      if (selectedPriority !== 'ALL' && item.priority !== selectedPriority) return false;

      // 5. Status filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;

      // 6. SLA Filter
      if (selectedSla !== 'ALL') {
        if (selectedSla === 'OVERDUE' && !(item.isOverdue || item.slaStatus === 'BREACHED')) return false;
        if (selectedSla === 'IN_SLA' && (item.isOverdue || item.slaStatus === 'BREACHED' || item.slaStatus === 'NO_SLA')) return false;
        if (selectedSla === 'NO_SLA' && (item.dueAt || item.slaStatus !== 'NO_SLA')) return false;
      }

      return true;
    });
  }, [workItems, activeTab, searchQuery, selectedModuleFilter, selectedPriority, selectedStatus, selectedSla]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchAction = (act.actionName || '').toLowerCase().includes(q);
        const matchMod = (act.moduleCode || '').toLowerCase().includes(q);
        const matchCorr = (act.correlationId || '').toLowerCase().includes(q);
        if (!matchAction && !matchMod && !matchCorr) return false;
      }
      if (selectedModuleFilter !== 'ALL') {
        if (act.moduleCode !== selectedModuleFilter) return false;
      }
      if (selectedStatus !== 'ALL') {
        if (act.status !== selectedStatus) return false;
      }
      return true;
    });
  }, [activities, searchQuery, selectedModuleFilter, selectedStatus]);

  // Pagination for Activities Stream
  const paginatedActivities = useMemo(() => {
    const start = (activityPage - 1) * activityPageSize;
    return filteredActivities.slice(start, start + activityPageSize);
  }, [filteredActivities, activityPage, activityPageSize]);

  // Pagination for Work Items
  const paginatedWorkItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredWorkItems.slice(start, start + pageSize);
  }, [filteredWorkItems, currentPage, pageSize]);

  // F15: Unified KPI Metrics Calculation
  const metrics = useMemo(() => {
    const total = workItems.length;
    const approvals = workItems.filter((i) => i.type === 'APPROVAL' && i.status === 'PENDING').length;
    const tasks = workItems.filter((i) => i.type === 'TASK' && i.status === 'PENDING').length;
    const alerts = workItems.filter((i) => (i.type === 'ALERT' || i.priority === 'URGENT') && i.status === 'PENDING').length;
    const overdue = workItems.filter((i) => (i.isOverdue || i.slaStatus === 'BREACHED') && i.status === 'PENDING').length;
    const activityTotal = activities.length;

    return { total, approvals, tasks, alerts, overdue, activityTotal };
  }, [workItems, activities]);

  // Navigate to Source Module
  const handleNavigateToSource = (route: string) => {
    if (!onSelectModule) return;
    const modDef = MODULE_REGISTRY.find((m) => m.route === route || route.startsWith(m.route));
    if (modDef) {
      onSelectModule(modDef);
    }
  };

  // Toggle selection for individual item
  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle select all on current page
  const toggleSelectAllPage = () => {
    const actionablePageItems = paginatedWorkItems.filter((i) => i.canAction !== false);
    const allSelected = actionablePageItems.every((i) => selectedIds.has(i.id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        actionablePageItems.forEach((i) => next.delete(i.id));
      } else {
        actionablePageItems.forEach((i) => next.add(i.id));
      }
      return next;
    });
  };

  const actionablePageItems = paginatedWorkItems.filter((i) => i.canAction !== false);
  const isAllPageSelected = actionablePageItems.length > 0 && actionablePageItems.every((i) => selectedIds.has(i.id));

  // Bulk Actions Configuration
  const bulkActionItems: BulkActionItem[] = [
    {
      id: 'bulk_approve',
      label: 'Duyệt nhanh lô',
      variant: 'primary',
      icon: <Icons.CheckCircle2 className="w-4 h-4" />,
      onClick: () => handleBulkAction('approve')
    },
    {
      id: 'bulk_reject',
      label: 'Từ chối lô',
      variant: 'danger',
      icon: <Icons.XCircle className="w-4 h-4" />,
      onClick: () => handleBulkAction('reject')
    }
  ];

  return (
    <div className="w-full space-y-4">
      {/* Rule #19 ConfirmDialog */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

      {/* RCA Trace Modal */}
      <CorrelationRcaTraceModal
        isOpen={Boolean(rcaCorrelationId)}
        onClose={() => setRcaCorrelationId(null)}
        correlationId={rcaCorrelationId || ''}
      />

      {/* Entity Preview Drawer (F08 with DMS files) */}
      <EntityPreviewDrawer
        isOpen={Boolean(previewWorkItem)}
        onClose={() => setPreviewWorkItem(null)}
        workItem={previewWorkItem}
        currentUser={currentUser}
        onExecuteAction={(act) => {
          if (previewWorkItem) {
            handleExecuteAction(previewWorkItem, act);
            setPreviewWorkItem(null);
          }
        }}
        onNavigateToModule={(route) => {
          setPreviewWorkItem(null);
          handleNavigateToSource(route);
        }}
      />

      {/* Toast Summary for Batch Action */}
      {batchResultToast && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between text-xs text-blue-800 dark:text-blue-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Icons.CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              Hoàn tất xử lý hàng loạt: <strong>{batchResultToast.successCount}/{batchResultToast.total}</strong> thành công
              {batchResultToast.failureCount > 0 && ` (${batchResultToast.failureCount} thất bại)`}.
            </span>
          </div>
          <button
            onClick={() => setBatchResultToast(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <Icons.X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER: Executive Stats Bar & Operational Summary (F15 Unified Count)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Active Items */}
        <div className="bg-white dark:bg-slate-800/95 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Tổng tác vụ</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Icons.ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {metrics.total}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">đang chờ</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white dark:bg-slate-800/95 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Chờ duyệt (PO/SO)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Icons.CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
              {metrics.approvals}
            </span>
            <span className="text-[11px] text-amber-500/80 font-mono">cần ký duyệt</span>
          </div>
        </div>

        {/* Operational Tasks */}
        <div className="bg-white dark:bg-slate-800/95 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Tác vụ Kho/Vận</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Icons.PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {metrics.tasks}
            </span>
            <span className="text-[11px] text-emerald-500/80 font-mono">chỉ thị</span>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white dark:bg-slate-800/95 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Cảnh báo / Ngoại lệ</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Icons.AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
              {metrics.alerts}
            </span>
            <span className="text-[11px] text-rose-500/80 font-mono">khẩn cấp</span>
          </div>
        </div>

        {/* Overdue SLA (F12) */}
        <div className="bg-white dark:bg-slate-800/95 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Vi phạm SLA</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Icons.TimerOff className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono tabular-nums ${metrics.overdue > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>
              {metrics.overdue}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">quá hạn</span>
          </div>
        </div>

        {/* Live Event Stream */}
        <div className="bg-white dark:bg-slate-800/95 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Nhật ký Audit</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Icons.Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 tabular-nums">
              {metrics.activityTotal}
            </span>
            <span className="text-[11px] text-cyan-500/80 font-mono">giao dịch</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          OPERATIONAL CONTROL BAR: Tabs, Search & Filters (F17 Server-side)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 shadow-2xs space-y-3">
        {/* Top Tab Bar & View Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/70 pb-3">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => { setActiveTab('all_items'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all_items'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700/50'
              }`}
            >
              <Icons.Layers className="w-3.5 h-3.5" />
              <span>Tất cả tác vụ ({metrics.total})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('approvals'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'approvals'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700/50'
              }`}
            >
              <Icons.CheckSquare className="w-3.5 h-3.5" />
              <span>Phê duyệt ({metrics.approvals})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('tasks'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700/50'
              }`}
            >
              <Icons.ListOrdered className="w-3.5 h-3.5" />
              <span>Tác vụ vận hành ({metrics.tasks})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('alerts'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'alerts'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700/50'
              }`}
            >
              <Icons.AlertTriangle className="w-3.5 h-3.5" />
              <span>Cảnh báo &amp; Ngoại lệ ({metrics.alerts})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('activities'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'activities'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700/50'
              }`}
            >
              <Icons.Activity className="w-3.5 h-3.5" />
              <span>Nhật ký thời gian thực ({metrics.activityTotal})</span>
            </button>
          </div>

          {/* Action buttons & View toggles */}
          <div className="flex items-center gap-2">
            {lastRefreshedAt && (
              <span className="hidden sm:inline text-[11px] text-slate-400 font-mono">
                Tự làm mới 60s (Lúc: {lastRefreshedAt})
              </span>
            )}

            {/* Client-Side CSV Export */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
              title="Xuất CSV danh sách tác vụ đang lọc"
            >
              <Icons.Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xuất CSV</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchWorkCenterData}
              disabled={refreshing}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
              title="Làm mới dữ liệu ngay"
            >
              <Icons.RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {activeTab !== 'activities' && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-700/50 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-600">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Chế độ danh sách bảng"
                >
                  <Icons.Table className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-md cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Chế độ thẻ Kanban"
                >
                  <Icons.LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Icons.Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã CT, tiêu đề, nội dung, phân hệ..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white"
            />
          </div>

          {/* Module Selector */}
          <div>
            <select
              value={selectedModuleFilter}
              onChange={(e) => {
                setSelectedModuleFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Lọc theo phân hệ nguồn"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Tất cả Phân hệ</option>
              {availableModules.map((m) => (
                <option key={m} value={m}>
                  Phân hệ {m}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value as PriorityFilter);
                setCurrentPage(1);
              }}
              aria-label="Lọc theo mức độ ưu tiên"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Tất cả Mức ưu tiên</option>
              <option value="URGENT">Khẩn cấp (URGENT)</option>
              <option value="HIGH">Cao (HIGH)</option>
              <option value="MEDIUM">Trung bình (MEDIUM)</option>
              <option value="LOW">Thấp (LOW)</option>
            </select>
          </div>

          {/* SLA Filter (F12) */}
          <div>
            <select
              value={selectedSla}
              onChange={(e) => {
                setSelectedSla(e.target.value as SlaFilter);
                setCurrentPage(1);
              }}
              aria-label="Lọc theo tình trạng SLA"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Tất cả SLA</option>
              <option value="OVERDUE">Quá hạn SLA</option>
              <option value="IN_SLA">Trong hạn SLA</option>
              <option value="NO_SLA">Chưa có SLA</option>
            </select>
          </div>

          {/* Assigned-to-me Filter */}
          <div>
            <button
              type="button"
              onClick={() => {
                setAssignedToMeOnly(!assignedToMeOnly);
                setCurrentPage(1);
              }}
              className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                assignedToMeOnly
                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700'
                  : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icons.UserCheck className="w-3.5 h-3.5" />
              <span>Giao cho tôi</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          BULK ACTION BAR (F14)
          ═══════════════════════════════════════════════════════════════════════ */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        totalCount={filteredWorkItems.length}
        onClearSelection={() => setSelectedIds(new Set())}
        actions={bulkActionItems}
        itemName="tác vụ"
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN OPERATIONAL CONTENT: Table, Cards or Activity Feed
          ═══════════════════════════════════════════════════════════════════════ */}
      {loading ? (
        <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-2xs">
          <Icons.Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Đang tải dữ liệu từ trung tâm tác vụ &amp; sổ cái kiểm toán...
          </p>
        </div>
      ) : activeTab === 'activities' ? (
        /* LIVE ACTIVITY FEED & AUDIT TRAIL (F03) */
        <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Icons.Activity className="w-4 h-4 text-cyan-500" />
              <span>Dòng sự kiện &amp; Giao dịch Thời gian thực (Live Audit Pipeline)</span>
            </h4>
            <span className="font-mono text-xs text-slate-400">
              Hiển thị {filteredActivities.length} sự kiện
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-2.5 px-4 font-mono">Thời gian</th>
                  <th className="py-2.5 px-4">Phân hệ</th>
                  <th className="py-2.5 px-4">Hành động nghiệp vụ</th>
                  <th className="py-2.5 px-4">Nguồn sự kiện</th>
                  <th className="py-2.5 px-4 text-center">Trạng thái</th>
                  <th className="py-2.5 px-4 font-mono">Correlation ID</th>
                  <th className="py-2.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {paginatedActivities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      Không tìm thấy sự kiện nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  paginatedActivities.map((act) => (
                    <tr
                      key={act.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(act.occurredAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px]">
                          {act.moduleCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {act.actionName}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {act.sourceType} #{act.sourceRefId}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                          act.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : act.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            act.status === 'SUCCESS' ? 'bg-emerald-500' : act.status === 'FAILED' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                          }`} />
                          <span>{act.status === 'SUCCESS' ? 'THÀNH CÔNG' : act.status === 'FAILED' ? 'THẤT BẠI' : 'ĐANG XỬ LÝ'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {act.correlationId || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {act.correlationId && (
                          <button
                            type="button"
                            onClick={() => setRcaCorrelationId(act.correlationId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 dark:text-blue-300 font-semibold text-[11px] cursor-pointer transition-all border border-blue-200 dark:border-blue-800"
                          >
                            <Icons.Search className="w-3 h-3" />
                            <span>RCA Trace</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={activityPage}
            pageSize={activityPageSize}
            totalItems={filteredActivities.length}
            onPageChange={setActivityPage}
            onPageSizeChange={(newSize) => {
              setActivityPageSize(newSize);
              setActivityPage(1);
            }}
            pageSizeOptions={[10, 15, 25, 50, 100]}
          />
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW OF WORK ITEMS */
        <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-semibold">
                  {/* Select All Checkbox */}
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={toggleSelectAllPage}
                      aria-label="Chọn tất cả trên trang"
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 font-mono">Mã CT / Ref</th>
                  <th className="py-3 px-3">Phân hệ nguồn</th>
                  <th className="py-3 px-3">Loại tác vụ</th>
                  <th className="py-3 px-3">Nội dung chỉ thị</th>
                  <th className="py-3 px-3 text-right font-mono">Giá trị (VND)</th>
                  <th className="py-3 px-3 text-center">Ưu tiên</th>
                  <th className="py-3 px-3 text-center">Tình trạng SLA</th>
                  <th className="py-3 px-3 text-center font-mono">Tuổi việc</th>
                  <th className="py-3 px-3 text-right">Hành động trực tiếp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {paginatedWorkItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                      Không có tác vụ nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  paginatedWorkItems.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    const isReadOnly = item.isReadOnly || item.canAction === false;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors group ${
                          isSelected
                            ? 'bg-blue-50/60 dark:bg-blue-950/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                        }`}
                      >
                        {/* Row Selection Checkbox */}
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isReadOnly}
                            onChange={() => toggleSelectItem(item.id)}
                            aria-label={`Chọn tác vụ ${item.businessReference || item.id}`}
                            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          />
                        </td>

                        {/* Reference Code */}
                        <td className="py-3.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setPreviewWorkItem(item)}
                            className="hover:underline flex items-center gap-1 cursor-pointer text-left"
                            title="Bấm để xem chi tiết chứng từ"
                          >
                            <span>{item.businessReference || item.id}</span>
                            <Icons.ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </td>

                        {/* Source Module */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {item.sourceModule}
                          </span>
                        </td>

                        {/* Task Type */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase border ${
                            item.type === 'APPROVAL'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                              : item.type === 'ALERT'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              item.type === 'APPROVAL' ? 'bg-amber-500' : item.type === 'ALERT' ? 'bg-rose-500' : 'bg-emerald-500'
                            }`} />
                            <span>{item.type === 'APPROVAL' ? 'Phê duyệt' : item.type === 'ALERT' ? 'Cảnh báo' : 'Tác vụ'}</span>
                          </span>
                        </td>

                        {/* Title & Description */}
                        <td className="py-3.5 px-3 max-w-xs md:max-w-sm">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </div>
                          {item.description && (
                            <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate mt-0.5">
                              {item.description}
                            </div>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap tabular-nums">
                          {item.amount !== undefined ? `${item.amount.toLocaleString('vi-VN')} ₫` : '—'}
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                            item.priority === 'URGENT'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                              : item.priority === 'HIGH'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                              : item.priority === 'MEDIUM'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                              : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}>
                            {item.priority}
                          </span>
                        </td>

                        {/* SLA status (F12) */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {item.slaStatus === 'BREACHED' || item.isOverdue ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-mono text-[11px] font-bold">
                              <Icons.AlertCircle className="w-3.5 h-3.5" />
                              <span>Quá hạn SLA</span>
                            </span>
                          ) : item.slaStatus === 'WARNING_75' || item.slaStatus === 'WARNING_90' ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono text-[11px] font-bold">
                              <Icons.Clock className="w-3.5 h-3.5" />
                              <span>Sắp đến hạn</span>
                            </span>
                          ) : item.dueAt || (item.slaHours && item.slaHours > 0) ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">
                              {item.slaLabel || `${item.slaHours}h SLA`}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                              Chưa có SLA
                            </span>
                          )}
                        </td>

                        {/* Age formatted (F12) */}
                        <td className="py-3.5 px-3 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {item.ageFormatted || '—'}
                        </td>

                        {/* Action Buttons (F13 Permission Guard & F16) */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isReadOnly ? (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-mono border border-slate-200 dark:border-slate-700">
                                Chỉ xem
                              </span>
                            ) : (
                              (item.actions || []).map((act) => (
                                <button
                                  key={act.id}
                                  type="button"
                                  disabled={executingId === item.id}
                                  onClick={() => handleExecuteAction(item, act)}
                                  className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer disabled:opacity-50 ${
                                    act.variant === 'danger'
                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-2xs'
                                  }`}
                                >
                                  {executingId === item.id ? (
                                    <Icons.Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                  ) : (
                                    act.label
                                  )}
                                </button>
                              ))
                            )}

                            {item.targetRoute && (
                              <button
                                type="button"
                                onClick={() => handleNavigateToSource(item.targetRoute)}
                                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                                title="Đi đến phân hệ nguồn"
                              >
                                <Icons.ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Standard TablePagination */}
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredWorkItems.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 15, 25, 50, 100]}
          />
        </div>
      ) : (
        /* KANBAN CARDS VIEW */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {paginatedWorkItems.map((item) => {
              const isReadOnly = item.isReadOnly || item.canAction === false;
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {item.businessReference || item.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                          item.priority === 'URGENT'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                            : item.priority === 'HIGH'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                            : item.priority === 'MEDIUM'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}>
                          {item.priority}
                        </span>
                        {item.slaLabel && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {item.slaLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {item.title}
                    </h4>

                    <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 mt-1">
                      {item.description || 'Không có mô tả chi tiết.'}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between text-xs">
                      {item.amount !== undefined ? (
                        <div className="py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                          <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                            {item.amount.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                      ) : <span />}
                      {item.ageFormatted && (
                        <span className="font-mono text-[11px] text-slate-400">
                          {item.ageFormatted}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-mono truncate max-w-[120px]">
                      {item.sourceModule}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isReadOnly ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-mono border border-slate-200 dark:border-slate-700">
                          Chỉ xem
                        </span>
                      ) : (
                        (item.actions || []).map((act) => (
                          <button
                            key={act.id}
                            type="button"
                            disabled={executingId === item.id}
                            onClick={() => handleExecuteAction(item, act)}
                            className={`px-3 py-1 rounded-lg font-semibold text-xs cursor-pointer ${
                              act.variant === 'danger'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-2xs'
                            }`}
                          >
                            {act.label}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredWorkItems.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 15, 25, 50, 100]}
          />
        </div>
      )}
    </div>
  );
};
