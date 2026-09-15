import React, { useState, useEffect, useMemo } from 'react';
import { WorkspaceWorkItem, ActivityLogItem } from '../../types/workspace';
import { NotificationItem, NotificationPreferences, isNotificationEnabled } from './NotificationDrawer';
import { MODULE_REGISTRY } from '../../config/moduleRegistry';
import {
  Bell,
  Clock,
  X,
  CheckCheck,
  Trash2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Download,
  Printer,
  Sparkles,
  Zap,
  Filter,
  Layers,
  ArrowRight,
  Sliders,
  CheckSquare,
  ShieldAlert,
  CheckCircle,
  Search,
  Calendar,
  Building2,
  ChevronDown,
  ChevronRight,
  ListFilter,
  CalendarDays,
  Boxes,
  History,
  XCircle,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  ShieldX,
  FileText,
  SlidersHorizontal,
  Tag,
  GitBranch,
} from 'lucide-react';

import { extractModuleCode, getModuleInfo, resolveModuleRoute, getModuleLabel } from '../../utils/moduleMapper';
export { extractModuleCode, getModuleInfo, resolveModuleRoute, getModuleLabel };

interface UnifiedActivityTaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'workqueue' | 'notifications' | 'activity_log' | 'preferences';
  onInspectEntity?: (code: string) => void;
  // Notifications props
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAllNotifications: () => void;
  onTriggerSimulation: (type: 'inventory' | 'mrp_fail' | 'sla_overdue' | 'system_ok') => void;
  onPreferencesChange: (newPrefs: NotificationPreferences) => void;
  preferences: NotificationPreferences;
  // WorkQueue / SLA props
  workItems: WorkspaceWorkItem[];
  onNavigate: (route: string, item?: any) => void;
  onWorkItemAction: (item: WorkspaceWorkItem, endpoint: string, label: string) => void;
  // Activity Log props
  activityLogs?: ActivityLogItem[];
  onClearActivityLogs?: () => void;
}

type GroupByOption = 'date' | 'module' | 'none';

interface GroupedNotifications {
  key: string;
  label: string;
  count: number;
  unreadCount: number;
  items: NotificationItem[];
}

export const UnifiedActivityTaskDrawer: React.FC<UnifiedActivityTaskDrawerProps> = ({
  isOpen,
  onClose,
  initialTab,
  onInspectEntity,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAllNotifications,
  onTriggerSimulation,
  onPreferencesChange,
  preferences,
  workItems,
  onNavigate,
  onWorkItemAction,
  activityLogs = [],
  onClearActivityLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'workqueue' | 'notifications' | 'activity_log' | 'preferences'>(
    initialTab || 'workqueue'
  );

  // Sync tab when initialTab or isOpen changes
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  
  // WorkQueue state
  const [selectedWorkIds, setSelectedWorkIds] = useState<string[]>([]);
  const [isDelegationActive, setIsDelegationActive] = useState(false);
  const [workModuleFilter, setWorkModuleFilter] = useState<string>('all');
  const [workSearchQuery, setWorkSearchQuery] = useState<string>('');

  // Notification state
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'danger' | 'warning' | 'success' | 'info'>('all');
  const [notifModuleFilter, setNotifModuleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<GroupByOption>('date');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Activity Log state
  const [activityFilter, setActivityFilter] = useState<'all' | 'failure' | 'success'>('all');
  const [activityModuleFilter, setActivityModuleFilter] = useState<string>('all');
  const [activitySearch, setActivitySearch] = useState('');
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<ActivityLogItem | null>(null);

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

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Extract distinct modules for WorkQueue with count & urgency
  const workModules = useMemo(() => {
    const map = new Map<string, { code: string; label: string; name: string; count: number; urgentCount: number }>();
    workItems.forEach((item) => {
      const info = getModuleInfo(item.sourceModule);
      const existing = map.get(info.code);
      const isUrgent = item.priority === 'URGENT' || item.isOverdue;
      if (existing) {
        existing.count += 1;
        if (isUrgent) existing.urgentCount += 1;
      } else {
        map.set(info.code, {
          code: info.code,
          label: info.shortLabel,
          name: info.name,
          count: 1,
          urgentCount: isUrgent ? 1 : 0,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [workItems]);

  // WorkQueue Filter Engine
  const filteredWorkItems = useMemo(() => {
    return workItems.filter((item) => {
      const info = getModuleInfo(item.sourceModule);
      const matchesModule =
        workModuleFilter === 'all' ||
        info.code.toUpperCase() === workModuleFilter.toUpperCase() ||
        item.sourceModule.toUpperCase().includes(workModuleFilter.toUpperCase());

      const q = workSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.title?.toLowerCase().includes(q)) ||
        (item.businessReference?.toLowerCase().includes(q)) ||
        (item.sourceModule?.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q));

      return matchesModule && matchesSearch;
    });
  }, [workItems, workModuleFilter, workSearchQuery]);

  // Extract distinct modules for Activity Log with count & failure indicators
  const activityModules = useMemo(() => {
    const map = new Map<string, { code: string; label: string; name: string; count: number; failCount: number }>();
    activityLogs.forEach((log) => {
      const info = getModuleInfo(log.sourceModule);
      const existing = map.get(info.code);
      const isFail = log.status === 'FAILURE';
      if (existing) {
        existing.count += 1;
        if (isFail) existing.failCount += 1;
      } else {
        map.set(info.code, {
          code: info.code,
          label: info.shortLabel,
          name: info.name,
          count: 1,
          failCount: isFail ? 1 : 0,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [activityLogs]);

  // Helper: Format smart relative time
  const formatRelativeTime = (timestamp: string | number) => {
    try {
      const time = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
      if (isNaN(time)) return String(timestamp);
      const diff = Date.now() - time;
      if (diff < 60000) return 'Vừa xong';
      if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
      if (diff < 86400000 * 2) return 'Hôm qua';
      if (diff < 86400000 * 7) return `${Math.floor(diff / 86400000)} ngày trước`;
      return new Date(time).toLocaleDateString('vi-VN');
    } catch {
      return String(timestamp);
    }
  };

  // Helper: Extract Document Code (PO, SO, GRN, INV, MO, WO, SA, PR, RFQ, LOT, SER, QC, DEV, TKT, RMA, MWO)
  const extractDocCode = (notif: NotificationItem): string | null => {
    const fullText = `${notif.title} ${notif.message} ${notif.link || ''}`;
    const match = fullText.match(/\b(PO|SO|GRN|INV|MO|WO|SA|PR|RFQ|LOT|SER|QC|DEV|TKT|RMA|MWO)-[0-9A-Za-z-]+\b/i);
    return match ? match[0].toUpperCase() : null;
  };

  // Calculations
  const enabledNotifications = notifications.filter((n) => isNotificationEnabled(n, preferences));
  const unreadNotifCount = enabledNotifications.filter((n) => !n.isRead).length;
  const pendingWorkCount = workItems.length;

  // Extract distinct modules for Notifications
  const notifModules = useMemo(() => {
    const map = new Map<string, { code: string; label: string; name: string; count: number; dangerCount: number }>();
    enabledNotifications.forEach((item) => {
      const info = getModuleInfo(item.module || 'Hệ thống ERP');
      const existing = map.get(info.code);
      const isDanger = item.type === 'danger';
      if (existing) {
        existing.count += 1;
        if (isDanger) existing.dangerCount += 1;
      } else {
        map.set(info.code, {
          code: info.code,
          label: info.shortLabel,
          name: info.name,
          count: 1,
          dangerCount: isDanger ? 1 : 0,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [enabledNotifications]);

  const filteredNotifications = enabledNotifications.filter((n) => {
    const matchesFilter =
      notifFilter === 'all' ||
      (notifFilter === 'unread' && !n.isRead) ||
      (notifFilter === 'danger' && n.type === 'danger') ||
      (notifFilter === 'warning' && n.type === 'warning') ||
      (notifFilter === 'success' && n.type === 'success') ||
      (notifFilter === 'info' && n.type === 'info');

    const info = getModuleInfo(n.module || '');
    const matchesModule =
      notifModuleFilter === 'all' ||
      info.code.toUpperCase() === notifModuleFilter.toUpperCase() ||
      (n.module && n.module.toUpperCase().includes(notifModuleFilter.toUpperCase()));

    const matchesSearch =
      (n.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.message?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.module && n.module.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesModule && matchesSearch;
  });

  // Export Notifications to CSV
  const handleExportNotificationsCsv = () => {
    if (filteredNotifications.length === 0) return;
    const headers = ['Mã ID', 'Loại', 'Phân hệ', 'Tiêu đề', 'Nội dung', 'Thời gian', 'Trạng thái'];
    const rows = filteredNotifications.map((n) => [
      n.id,
      n.type,
      `"${(n.module || '').replace(/"/g, '""')}"`,
      `"${n.title.replace(/"/g, '""')}"`,
      `"${n.message.replace(/"/g, '""')}"`,
      typeof n.timestamp === 'string' ? n.timestamp : new Date(n.timestamp).toISOString(),
      n.isRead ? 'Đã đọc' : 'Chưa đọc',
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NexusSync_Notifications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Notifications
  const handlePrintNotifications = () => {
    window.print();
  };

  // Grouping Engine
  const groupedNotifications: GroupedNotifications[] = useMemo(() => {
    if (groupBy === 'none') {
      return [
        {
          key: 'all',
          label: 'Tất cả thông báo',
          count: filteredNotifications.length,
          unreadCount: filteredNotifications.filter((n) => !n.isRead).length,
          items: filteredNotifications,
        },
      ];
    }

    if (groupBy === 'date') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfYesterday = startOfToday - 86400000;
      const startOf7DaysAgo = startOfToday - 6 * 86400000;

      const dateGroups: Record<string, NotificationItem[]> = {
        today: [],
        yesterday: [],
        last7days: [],
        earlier: [],
      };

      filteredNotifications.forEach((item) => {
        let timestampNum = 0;
        if (typeof item.timestamp === 'string') {
          const parsed = new Date(item.timestamp).getTime();
          if (!isNaN(parsed)) timestampNum = parsed;
        } else if (typeof item.timestamp === 'number') {
          timestampNum = item.timestamp;
        }

        if (timestampNum >= startOfToday) {
          dateGroups.today.push(item);
        } else if (timestampNum >= startOfYesterday) {
          dateGroups.yesterday.push(item);
        } else if (timestampNum >= startOf7DaysAgo) {
          dateGroups.last7days.push(item);
        } else {
          dateGroups.earlier.push(item);
        }
      });

      const result: GroupedNotifications[] = [];
      const definitions = [
        { key: 'today', label: 'Hôm nay' },
        { key: 'yesterday', label: 'Hôm qua' },
        { key: 'last7days', label: '7 ngày gần đây' },
        { key: 'earlier', label: 'Cũ hơn' },
      ];

      definitions.forEach((def) => {
        const items = dateGroups[def.key];
        if (items && items.length > 0) {
          result.push({
            key: def.key,
            label: def.label,
            count: items.length,
            unreadCount: items.filter((n) => !n.isRead).length,
            items,
          });
        }
      });

      return result;
    }

    if (groupBy === 'module') {
      const moduleMap = new Map<string, NotificationItem[]>();

      filteredNotifications.forEach((item) => {
        const modKey = (item.module || 'Hệ thống ERP').trim();
        if (!moduleMap.has(modKey)) {
          moduleMap.set(modKey, []);
        }
        moduleMap.get(modKey)!.push(item);
      });

      const result: GroupedNotifications[] = [];
      // Sort modules by items count descending
      const sortedEntries = Array.from(moduleMap.entries()).sort(
        (a, b) => b[1].length - a[1].length
      );

      sortedEntries.forEach(([modName, items]) => {
        result.push({
          key: `module_${modName}`,
          label: modName,
          count: items.length,
          unreadCount: items.filter((n) => !n.isRead).length,
          items,
        });
      });

      return result;
    }

    return [];
  }, [filteredNotifications, groupBy]);

  // Activity Log filtering Engine (Supports Status + Module Filter + Text Search)
  const filteredActivityLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const matchesStatus =
        activityFilter === 'all' ||
        (activityFilter === 'failure' && log.status === 'FAILURE') ||
        (activityFilter === 'success' && log.status === 'SUCCESS');

      const info = getModuleInfo(log.sourceModule);
      const matchesModule =
        activityModuleFilter === 'all' ||
        info.code.toUpperCase() === activityModuleFilter.toUpperCase() ||
        log.sourceModule.toUpperCase().includes(activityModuleFilter.toUpperCase());

      const q = activitySearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (log.actionLabel?.toLowerCase().includes(q)) ||
        (log.businessReference?.toLowerCase().includes(q)) ||
        (log.sourceModule?.toLowerCase().includes(q)) ||
        (log.reason && log.reason.toLowerCase().includes(q)) ||
        (log.userName && log.userName.toLowerCase().includes(q)) ||
        (log.endpoint?.toLowerCase().includes(q));

      return matchesStatus && matchesModule && matchesSearch;
    });
  }, [activityLogs, activityFilter, activityModuleFilter, activitySearch]);

  const failureLogCount = useMemo(() => {
    return activityLogs.filter((l) => l.status === 'FAILURE').length;
  }, [activityLogs]);

  const handleBulkWorkAction = () => {
    selectedWorkIds.forEach((id) => {
      const item = workItems.find((i) => i.id === id);
      if (item && item.actions && item.actions.length > 0) {
        onWorkItemAction(item, item.actions[0].endpoint, 'Duyệt hàng loạt');
      }
    });
    setSelectedWorkIds([]);
  };

  if (!isOpen) return null;

  return (
    <div
      id="unified-drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity cursor-pointer select-none"
    >
      <div
        id="unified-drawer"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200 cursor-default select-text"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Trung tâm Hoạt động & Tác vụ</h3>
              <p className="text-xs text-slate-500 mt-0.5">Hàng chờ SLA & Thông báo hệ thống hợp nhất</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-white px-3 pt-2 gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('workqueue')}
            className={`pb-3 px-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'workqueue'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Công việc</span>
            {pendingWorkCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
                {pendingWorkCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 px-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Thông báo</span>
            {unreadNotifCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-mono font-bold">
                {unreadNotifCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity_log')}
            className={`pb-3 px-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'activity_log'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
            title="Nhật ký thực thi tác vụ WorkQueue"
          >
            <History className="w-3.5 h-3.5" />
            <span>Nhật ký (Activity Log)</span>
            {activityLogs.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activityLogs.some((l) => l.status === 'FAILURE')
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {activityLogs.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              activeTab === 'preferences'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
            title="Cài đặt bộ lọc thông báo"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cài đặt</span>
          </button>
        </div>

        {/* Tab 1: WorkQueue / SLA */}
        {activeTab === 'workqueue' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* SLA Performance Overview */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">SLA Performance (Tháng này)</span>
                <span className="text-xs font-bold text-emerald-600">94.5% On-time</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94.5%' }}></div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${isDelegationActive ? 'bg-blue-600' : 'bg-slate-300'}`}
                    onClick={() => setIsDelegationActive(!isDelegationActive)}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isDelegationActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <span className="text-xs font-medium text-slate-700">Chế độ nhận ủy quyền (OOO)</span>
                </div>
              </div>
            </div>

            {/* Filter Toolbar with Module Dropdown & Search & Pill Tabs */}
            <div className="p-3.5 bg-white border-b border-slate-200 space-y-2.5 shrink-0">
              {/* Search and Module Dropdown Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                {/* Search Input */}
                <div className="sm:col-span-7 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm tác vụ, chứng từ, phân hệ..."
                    value={workSearchQuery}
                    onChange={(e) => setWorkSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                  {workSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setWorkSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      title="Xóa tìm kiếm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Module Dropdown Selector */}
                <div className="sm:col-span-5 relative">
                  <div className="relative flex items-center">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select
                      value={workModuleFilter}
                      onChange={(e) => setWorkModuleFilter(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer transition-all truncate"
                      title="Lọc tác vụ theo Phân hệ (Module)"
                    >
                      <option value="all">Tất cả phân hệ ({workItems.length})</option>
                      {workModules.map((mod) => (
                        <option key={mod.code} value={mod.code}>
                          [{mod.code}] {mod.name.replace(/\(.*?\)/g, '').trim()} ({mod.count})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Segmented Horizontal Pill Tabs for Fast Module Filtering */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
                <button
                  type="button"
                  onClick={() => setWorkModuleFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    workModuleFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>Tất cả</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      workModuleFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {workItems.length}
                  </span>
                </button>

                {workModules.map((mod) => {
                  const isSelected = workModuleFilter.toUpperCase() === mod.code.toUpperCase();
                  return (
                    <button
                      key={mod.code}
                      type="button"
                      onClick={() => setWorkModuleFilter(isSelected ? 'all' : mod.code)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      title={mod.name}
                    >
                      <span>{mod.code}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {mod.count}
                      </span>
                      {mod.urgentCount > 0 && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-rose-300' : 'bg-rose-500'}`}
                          title={`${mod.urgentCount} tác vụ khẩn cấp`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Filter Indicator & Reset */}
              {(workModuleFilter !== 'all' || workSearchQuery) && (
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3 h-3 text-blue-600" />
                    <span>
                      Đang lọc: <strong>{workModuleFilter !== 'all' ? `Phân hệ [${workModuleFilter}]` : 'Từ khóa tìm kiếm'}</strong>
                      {' '}({filteredWorkItems.length}/{workItems.length} tác vụ)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setWorkModuleFilter('all');
                      setWorkSearchQuery('');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer"
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              )}
            </div>

            {selectedWorkIds.length > 0 && (
              <div className="p-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between shrink-0">
                <span className="text-xs font-semibold text-blue-800">Đã chọn {selectedWorkIds.length} tác vụ</span>
                <button
                  onClick={handleBulkWorkAction}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Duyệt hàng loạt
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredWorkItems.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  {workItems.length === 0 ? (
                    <>
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-80" />
                      <p className="text-sm font-semibold text-slate-700">Tất cả hàng chờ đã hoàn thành!</p>
                      <p className="text-xs text-slate-400 mt-1">Không có tác vụ nào tồn đọng vi phạm SLA.</p>
                    </>
                  ) : (
                    <>
                      <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-700">Không có tác vụ nào thuộc phân hệ này</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        Không tìm thấy công việc nào khớp với phân hệ hoặc từ khóa bạn đã chọn.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setWorkModuleFilter('all');
                          setWorkSearchQuery('');
                        }}
                        className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Xem tất cả tác vụ ({workItems.length})
                      </button>
                    </>
                  )}
                </div>
              ) : (
                filteredWorkItems.map((item) => {
                  const isUrgent = item.priority === 'URGENT' || item.isOverdue;
                  const isGuided = item.title.includes('Trợ lý') || item.sourceModule.includes('RMA') || item.sourceModule.includes('POS') || item.sourceModule.includes('M15') || item.sourceModule.includes('M16');
                  
                  return (
                    <div
                      key={item.id}
                      className={`flex gap-3 p-3.5 rounded-xl border transition-all ${
                        isUrgent
                          ? 'border-rose-300 bg-rose-50/40 shadow-xs'
                          : isGuided
                          ? 'border-indigo-200 bg-indigo-50/30 hover:border-indigo-300 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {item.type === 'APPROVAL' && (
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={selectedWorkIds.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedWorkIds([...selectedWorkIds, item.id]);
                              else setSelectedWorkIds(selectedWorkIds.filter((id) => id !== item.id));
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isGuided ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.sourceModule} • {item.businessReference}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>

                        <h4 className="text-sm font-semibold text-slate-900 leading-snug flex items-center gap-1.5">
                          {isGuided && <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                          {item.title}
                        </h4>
                        {item.description && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>}

                        {item.dueAt && (
                          <div className={`mt-2 text-xs font-semibold flex items-center gap-1 ${item.isOverdue ? 'text-rose-600' : 'text-amber-600'}`}>
                            <Clock className="w-3 h-3" />
                            Hạn xử lý: {new Date(item.dueAt).toLocaleString('vi-VN')}
                          </div>
                        )}

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              onNavigate(item.targetRoute, item);
                              onClose();
                            }}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isGuided ? 'Mở Trợ lý Hướng Dẫn' : 'Mở chứng từ'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          {item.actions && item.actions.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              {item.actions.map((act) => (
                                <button
                                  key={act.id}
                                  onClick={() => onWorkItemAction(item, act.endpoint, act.label)}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center gap-1 ${
                                    act.variant === 'danger'
                                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                                      : isGuided
                                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  <span>{act.label}</span>
                                  {isGuided && <span>✓</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Notifications */}
        {activeTab === 'notifications' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            {/* Search, Module Selector and Quick Filters */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2.5">
              {/* Search Bar & Module Dropdown */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo tiêu đề, nội dung, phân hệ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      title="Xóa tìm kiếm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Module Filter Dropdown */}
                <div className="relative shrink-0">
                  <select
                    value={notifModuleFilter}
                    onChange={(e) => setNotifModuleFilter(e.target.value)}
                    className="py-1.5 pl-2.5 pr-7 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="all">Tất cả phân hệ ({enabledNotifications.length})</option>
                    {notifModules.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.label} ({m.count})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Quick Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
                {[
                  {
                    id: 'all' as const,
                    label: 'Tất cả',
                    count: enabledNotifications.length,
                    activeClass: 'bg-slate-900 text-white font-bold',
                    inactiveClass: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100',
                  },
                  {
                    id: 'unread' as const,
                    label: 'Chưa đọc',
                    count: unreadNotifCount,
                    activeClass: 'bg-blue-600 text-white font-bold',
                    inactiveClass: 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100',
                  },
                  {
                    id: 'danger' as const,
                    label: 'Nguy cấp',
                    count: enabledNotifications.filter((n) => n.type === 'danger').length,
                    activeClass: 'bg-rose-600 text-white font-bold',
                    inactiveClass: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100',
                  },
                  {
                    id: 'warning' as const,
                    label: 'Cảnh báo',
                    count: enabledNotifications.filter((n) => n.type === 'warning').length,
                    activeClass: 'bg-amber-600 text-white font-bold',
                    inactiveClass: 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100',
                  },
                  {
                    id: 'success' as const,
                    label: 'Thành công',
                    count: enabledNotifications.filter((n) => n.type === 'success').length,
                    activeClass: 'bg-emerald-600 text-white font-bold',
                    inactiveClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100',
                  },
                  {
                    id: 'info' as const,
                    label: 'Thông tin',
                    count: enabledNotifications.filter((n) => n.type === 'info').length,
                    activeClass: 'bg-sky-600 text-white font-bold',
                    inactiveClass: 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100',
                  },
                ].map((tab) => {
                  const isActive = notifFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setNotifFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isActive ? tab.activeClass : tab.inactiveClass
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Group By Selector & Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200/70 text-[11px]">
                {/* Group Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <ListFilter className="w-3 h-3 text-slate-400" /> Gom nhóm:
                  </span>
                  <div className="inline-flex bg-slate-200/80 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setGroupBy('date')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                        groupBy === 'date'
                          ? 'bg-white text-blue-700 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Calendar className="w-3 h-3" /> Theo Ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupBy('module')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                        groupBy === 'module'
                          ? 'bg-white text-blue-700 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Building2 className="w-3 h-3" /> Theo Phân Hệ
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupBy('none')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        groupBy === 'none'
                          ? 'bg-white text-blue-700 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Không gom
                    </button>
                  </div>
                </div>

                {/* Toolbar: Read all, Clear, CSV, Print, Preferences */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="px-2 py-1 rounded-md text-blue-700 hover:bg-blue-50 font-semibold cursor-pointer transition-colors"
                    title="Đánh dấu tất cả thông báo là đã đọc"
                  >
                    Đã đọc tất cả
                  </button>
                  <button
                    type="button"
                    onClick={onClearAllNotifications}
                    className="px-2 py-1 rounded-md text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer transition-colors"
                    title="Xóa tất cả thông báo"
                  >
                    Xóa tất cả
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleExportNotificationsCsv}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
                    title="Xuất danh sách thông báo ra CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintNotifications}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
                    title="In / Xuất PDF thông báo"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preferences')}
                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
                    title="Cài đặt bộ lọc & tùy chọn thông báo"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List (Grouped) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredNotifications.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
                    <Bell className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Hộp thư thông báo trống</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    {searchQuery || notifFilter !== 'all' || notifModuleFilter !== 'all'
                      ? 'Không tìm thấy thông báo nào khớp với các tiêu chí lọc hiện tại.'
                      : 'Tuyệt vời! Bạn đã xử lý xong toàn bộ thông báo nghiệp vụ.'}
                  </p>
                  {(searchQuery || notifFilter !== 'all' || notifModuleFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setNotifFilter('all');
                        setNotifModuleFilter('all');
                      }}
                      className="mt-4 px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Đặt lại tất cả bộ lọc
                    </button>
                  )}
                </div>
              ) : (
                groupedNotifications.map((group) => {
                  const isCollapsed = Boolean(collapsedGroups[group.key]);

                  return (
                    <div key={group.key} className="space-y-2.5">
                      {/* Group Header (shown if groupBy is date or module) */}
                      {groupBy !== 'none' && (
                        <div
                          onClick={() => toggleGroupCollapse(group.key)}
                          className="sticky top-0 z-10 py-1.5 px-3 bg-slate-100/95 backdrop-blur-xs rounded-lg border border-slate-200/80 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-200/70 transition-colors select-none"
                        >
                          <div className="flex items-center gap-2 font-bold text-slate-800">
                            {isCollapsed ? (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            {groupBy === 'date' ? (
                              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <Boxes className="w-3.5 h-3.5 text-indigo-600" />
                            )}
                            <span>{group.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {group.unreadCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                {group.unreadCount} mới
                              </span>
                            )}
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-200 text-slate-700">
                              {group.count}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Group Items */}
                      {!isCollapsed && (
                        <div className="space-y-2.5 pl-0.5">
                          {group.items.map((notif) => {
                            const isDanger = notif.type === 'danger';
                            const isWarning = notif.type === 'warning';
                            const isSuccess = notif.type === 'success';
                            const docCode = extractDocCode(notif);

                            return (
                              <div
                                key={notif.id}
                                className={`p-3.5 rounded-xl border transition-all flex gap-3 ${
                                  notif.isRead
                                    ? 'bg-white border-slate-200 opacity-80 hover:opacity-100 hover:border-slate-300'
                                    : isDanger
                                    ? 'bg-rose-50/70 border-rose-200 shadow-xs'
                                    : isWarning
                                    ? 'bg-amber-50/70 border-amber-200 shadow-xs'
                                    : isSuccess
                                    ? 'bg-emerald-50/70 border-emerald-200 shadow-xs'
                                    : 'bg-blue-50/70 border-blue-200 shadow-xs'
                                }`}
                              >
                                {/* Left Type Icon */}
                                <div className="pt-0.5 shrink-0">
                                  {isDanger ? (
                                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                                      <ShieldAlert className="w-4 h-4" />
                                    </div>
                                  ) : isWarning ? (
                                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                                      <AlertTriangle className="w-4 h-4" />
                                    </div>
                                  ) : isSuccess ? (
                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                      <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                  ) : (
                                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                                      <Info className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1 gap-2">
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 truncate max-w-[200px]">
                                      {notif.module}
                                    </span>
                                    <span
                                      className="text-[10px] text-slate-400 whitespace-nowrap"
                                      title={
                                        typeof notif.timestamp === 'string'
                                          ? notif.timestamp
                                          : new Date(notif.timestamp).toLocaleString('vi-VN')
                                      }
                                    >
                                      {formatRelativeTime(notif.timestamp)}
                                    </span>
                                  </div>

                                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{notif.title}</h4>
                                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>

                                  {/* Action Bar */}
                                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {/* Mapping 360° Button if document code found */}
                                      {docCode && onInspectEntity && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onInspectEntity(docCode);
                                            onClose();
                                          }}
                                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer shadow-2xs"
                                          title={`Xem sơ đồ Mapping & Truy vết 360° cho ${docCode}`}
                                        >
                                          <GitBranch className="w-3 h-3 text-indigo-600" />
                                          <span>Sơ đồ Mapping 360° ({docCode})</span>
                                        </button>
                                      )}

                                      {/* Deep Link Button */}
                                      {notif.link && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (notif.link) {
                                              onNavigate(notif.link);
                                              onClose();
                                            }
                                          }}
                                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                                        >
                                          <span>Màn hình làm việc</span>
                                          <ArrowRight className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>

                                    {/* Right Utility Buttons: Read Toggle & Delete */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onMarkAsRead(notif.id);
                                        }}
                                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                                          notif.isRead ? 'text-slate-300 hover:text-blue-600' : 'text-blue-600 hover:text-slate-400'
                                        }`}
                                        title={notif.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                                      >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteNotification(notif.id);
                                        }}
                                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                                        title="Xóa thông báo"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Activity Log */}
        {activeTab === 'activity_log' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            {/* Header / Filter Toolbar */}
            <div className="p-4 bg-white border-b border-slate-200 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-blue-600" /> Nhật ký Thao tác WorkQueue
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Theo dõi lịch sử thực thi, phân đoạn theo từng phân hệ (M17, M25, M27...)
                  </p>
                </div>
                {activityLogs.length > 0 && onClearActivityLogs && (
                  <button
                    type="button"
                    onClick={onClearActivityLogs}
                    className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Xóa nhật ký
                  </button>
                )}
              </div>

              {/* Search and Module Dropdown Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                {/* Search Bar */}
                <div className="sm:col-span-7 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo thao tác, mã chứng từ, phân hệ, lý do lỗi..."
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="w-full pl-8 pr-8 py-1.5 bg-slate-100/70 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                  {activitySearch && (
                    <button
                      type="button"
                      onClick={() => setActivitySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      title="Xóa tìm kiếm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Module Dropdown Selector */}
                <div className="sm:col-span-5 relative">
                  <div className="relative flex items-center">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                    <select
                      value={activityModuleFilter}
                      onChange={(e) => setActivityModuleFilter(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-slate-100/70 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer transition-all truncate"
                      title="Lọc nhật ký theo Phân hệ (Module)"
                    >
                      <option value="all">Tất cả phân hệ ({activityLogs.length})</option>
                      {activityModules.map((mod) => (
                        <option key={mod.code} value={mod.code}>
                          [{mod.code}] {mod.name.replace(/\(.*?\)/g, '').trim()} ({mod.count})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Segmented Horizontal Pill Tabs for Fast Module Filtering */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActivityModuleFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    activityModuleFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>Tất cả</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      activityModuleFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {activityLogs.length}
                  </span>
                </button>

                {activityModules.map((mod) => {
                  const isSelected = activityModuleFilter.toUpperCase() === mod.code.toUpperCase();
                  return (
                    <button
                      key={mod.code}
                      type="button"
                      onClick={() => setActivityModuleFilter(isSelected ? 'all' : mod.code)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      title={mod.name}
                    >
                      <span>{mod.code}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {mod.count}
                      </span>
                      {mod.failCount > 0 && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-rose-300' : 'bg-rose-500'}`}
                          title={`${mod.failCount} nhật ký lỗi`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Status Filter Badges */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActivityFilter('all')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      activityFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tất cả ({activityLogs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter('failure')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                      activityFilter === 'failure'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Lỗi / Thất bại ({failureLogCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter('success')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                      activityFilter === 'success'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Thành công ({activityLogs.length - failureLogCount})</span>
                  </button>
                </div>
              </div>

              {/* Active Filter Indicator & Reset */}
              {(activityModuleFilter !== 'all' || activitySearch || activityFilter !== 'all') && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3 h-3 text-blue-600" />
                    <span>
                      Đang lọc: <strong>
                        {activityModuleFilter !== 'all' ? `Phân hệ [${activityModuleFilter}]` : ''}
                        {activityFilter !== 'all' ? ` • Trạng thái ${activityFilter.toUpperCase()}` : ''}
                        {activitySearch ? ` • Từ khóa "${activitySearch}"` : ''}
                      </strong>
                      {' '}({filteredActivityLogs.length}/{activityLogs.length} nhật ký)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActivityModuleFilter('all');
                      setActivityFilter('all');
                      setActivitySearch('');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer"
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              )}
            </div>

            {/* Activity Logs List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredActivityLogs.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-700">Chưa có nhật ký hoạt động phù hợp</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    {activitySearch || activityModuleFilter !== 'all' || activityFilter !== 'all'
                      ? 'Không tìm thấy nhật ký nào khớp với phân hệ, trạng thái hoặc từ khóa đã chọn.'
                      : 'Khi bạn duyệt hoặc từ chối các tác vụ trong Hàng chờ Công việc, kết quả thực thi và lý do lỗi sẽ được tự động ghi lại tại đây.'}
                  </p>
                  {(activityModuleFilter !== 'all' || activitySearch || activityFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setActivityModuleFilter('all');
                        setActivityFilter('all');
                        setActivitySearch('');
                      }}
                      className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Xem tất cả nhật ký ({activityLogs.length})
                    </button>
                  )}
                </div>
              ) : (
                filteredActivityLogs.map((log) => {
                  const isFail = log.status === 'FAILURE';
                  const isPermissionErr =
                    log.reason?.toLowerCase().includes('quyền') ||
                    log.reason?.toLowerCase().includes('permission') ||
                    log.statusCode === 403;
                  const isValidationErr =
                    log.reason?.toLowerCase().includes('validation') ||
                    log.reason?.toLowerCase().includes('không hợp lệ') ||
                    log.reason?.toLowerCase().includes('tồn kho') ||
                    log.statusCode === 400 ||
                    log.statusCode === 422;

                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLogForDetails(log)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-white ${
                        isFail
                          ? 'border-rose-200 hover:border-rose-300 hover:shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Status Icon */}
                        <div className="pt-0.5 shrink-0">
                          {isFail ? (
                            isPermissionErr ? (
                              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center" title="Lỗi phân quyền">
                                <ShieldX className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center" title="Thao tác thất bại">
                                <XCircle className="w-4 h-4" />
                              </div>
                            )
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center" title="Thành công">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        {/* Log Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {log.sourceModule}
                              </span>
                              <span className="text-[10px] font-mono font-semibold text-slate-600">
                                {log.businessReference}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 leading-snug flex items-center gap-1.5">
                            <span>Thao tác: {log.actionLabel}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                                isFail ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {isFail ? 'FAILED' : 'SUCCESS'}
                            </span>
                          </h4>

                          {/* Failure Reason Box */}
                          {isFail && log.reason && (
                            <div className="mt-2 p-2 rounded-lg bg-rose-50/90 border border-rose-200/80 text-[11px] text-rose-800 space-y-1">
                              <div className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider text-rose-700">
                                <AlertTriangle className="w-3 h-3" />
                                <span>
                                  {isPermissionErr
                                    ? 'Từ chối phân quyền (Permission Denied)'
                                    : isValidationErr
                                    ? 'Lỗi kiểm tra nghiệp vụ (Validation Error)'
                                    : 'Nguyên nhân thất bại'}
                                </span>
                              </div>
                              <p className="leading-relaxed font-sans">{log.reason}</p>
                            </div>
                          )}

                          {/* Success Message or summary */}
                          {!isFail && log.reason && (
                            <p className="mt-1 text-xs text-slate-600 leading-relaxed">{log.reason}</p>
                          )}

                          {/* Footer Meta */}
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                            <div className="flex items-center gap-2">
                              {log.userName && <span>Người thực thi: <strong className="text-slate-700">{log.userName}</strong></span>}
                              {log.durationMs !== undefined && <span>• {log.durationMs}ms</span>}
                            </div>
                            <span className="text-blue-600 font-semibold flex items-center gap-0.5 hover:underline">
                              Chi tiết <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Preferences */}
        {activeTab === 'preferences' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Cài đặt bộ lọc Thông báo & Cảnh báo</h4>
              <p className="text-xs text-slate-500">Tùy chỉnh các loại thông báo bạn muốn nhận trên hệ thống.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Theo mức độ nghiêm trọng</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'danger', label: 'Nghiêm trọng (Danger)' },
                    { key: 'warning', label: 'Cảnh báo (Warning)' },
                    { key: 'success', label: 'Thành công (Success)' },
                    { key: 'info', label: 'Thông tin (Info)' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={(preferences as any)[item.key]}
                        onChange={(e) => onPreferencesChange({ ...preferences, [item.key]: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Theo phân hệ nghiệp vụ</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'inventory', label: 'Kho & VMS' },
                    { key: 'procurement', label: 'Mua hàng & MRP' },
                    { key: 'quality', label: 'Kiểm tra chất lượng' },
                    { key: 'sales', label: 'Bán hàng & CRM' },
                    { key: 'system', label: 'Hệ thống & EventBus' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={(preferences as any)[item.key]}
                        onChange={(e) => onPreferencesChange({ ...preferences, [item.key]: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Trung tâm Hoạt động Hợp nhất</span>
          <span>NexusSync v1.0</span>
        </div>
      </div>

      {/* Selected Log Details Modal */}
      {selectedLogForDetails && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setSelectedLogForDetails(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className={`p-4 border-b flex items-center justify-between ${
                selectedLogForDetails.status === 'FAILURE'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {selectedLogForDetails.status === 'FAILURE' ? (
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <XCircle className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold">
                    Chi tiết Thực thi: {selectedLogForDetails.actionLabel}
                  </h3>
                  <p className="text-xs opacity-80 font-mono">
                    {selectedLogForDetails.businessReference} • {selectedLogForDetails.sourceModule}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="p-1 rounded-lg hover:bg-slate-200/50 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Status Banner */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  selectedLogForDetails.status === 'FAILURE'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold">Trạng thái:</span>
                  <span className="font-mono uppercase font-bold">
                    {selectedLogForDetails.status}
                  </span>
                  {selectedLogForDetails.statusCode && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/80 border">
                      HTTP {selectedLogForDetails.statusCode}
                    </span>
                  )}
                </div>
                <span className="text-slate-500">
                  {new Date(selectedLogForDetails.timestamp).toLocaleString('vi-VN')}
                </span>
              </div>

              {/* Failure Explanation */}
              {selectedLogForDetails.status === 'FAILURE' && (
                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold uppercase tracking-wider text-[10px]">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Lý do / Nguyên nhân thất bại</span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed text-rose-200 font-mono">
                    {selectedLogForDetails.reason || 'Lỗi không xác định từ máy chủ hoặc kiểm tra nghiệp vụ.'}
                  </p>
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    💡 <strong>Hướng dẫn khắc phục:</strong> Kiểm tra phân quyền vai trò người dùng (Role Permissions) hoặc trạng thái kho/tài chính liên quan đến chứng từ này.
                  </div>
                </div>
              )}

              {/* Key Value Details Grid */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2 font-mono">
                <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Phân hệ (Module):</span>
                  <span className="col-span-2 font-semibold text-slate-800">{selectedLogForDetails.sourceModule}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Mã chứng từ:</span>
                  <span className="col-span-2 font-semibold text-slate-800">{selectedLogForDetails.businessReference}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Thao tác:</span>
                  <span className="col-span-2 font-semibold text-slate-800">{selectedLogForDetails.actionLabel}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">API Endpoint:</span>
                  <span className="col-span-2 text-slate-700 break-all">{selectedLogForDetails.endpoint}</span>
                </div>
                {selectedLogForDetails.userName && (
                  <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Người thực hiện:</span>
                    <span className="col-span-2 font-semibold text-slate-800">
                      {selectedLogForDetails.userName} {selectedLogForDetails.userRole ? `(${selectedLogForDetails.userRole})` : ''}
                    </span>
                  </div>
                )}
                {selectedLogForDetails.durationMs !== undefined && (
                  <div className="grid grid-cols-3 gap-2 py-1">
                    <span className="text-slate-500">Thời gian xử lý:</span>
                    <span className="col-span-2 text-slate-700">{selectedLogForDetails.durationMs}ms</span>
                  </div>
                )}
              </div>

              {/* Extra Details / Payload */}
              {selectedLogForDetails.details && Object.keys(selectedLogForDetails.details).length > 0 && (
                <div>
                  <h5 className="font-bold text-slate-700 mb-1.5">Dữ liệu chi tiết đính kèm:</h5>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedLogForDetails.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UnifiedActivityTaskDrawer;
