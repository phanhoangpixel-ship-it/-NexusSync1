import React, { useState, useEffect, useMemo } from 'react';
import { WorkspaceWorkItem, ActivityLogItem } from '../../types/workspace';
import { NotificationItem, NotificationPreferences, isNotificationEnabled } from './NotificationDrawer';
import { MODULE_REGISTRY } from '../../config/moduleRegistry';
import { DisplayDensity } from '../../types/systemPreferences';
import { useGlobalTheme } from './GlobalThemeProvider';
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
  Copy,
  Check,
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { ConfirmDialogState } from '../../types';

import { extractModuleCode, getModuleInfo, resolveModuleRoute, getModuleLabel } from '../../utils/moduleMapper';
export { extractModuleCode, getModuleInfo, resolveModuleRoute, getModuleLabel };

interface UnifiedActivityTaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  density?: DisplayDensity;
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
  density: densityProp,
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
  // Density Configuration matching EnterpriseDataView & SystemPreferences
  let contextDensity: DisplayDensity = 'cozy';
  try {
    const themeContext = useGlobalTheme();
    if (themeContext?.density) {
      contextDensity = themeContext.density;
    }
  } catch {
    try {
      const raw = localStorage.getItem('nexussync_system_preferences');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.density) contextDensity = parsed.density;
      }
    } catch {}
  }

  const effectiveDensity: DisplayDensity = densityProp || contextDensity || 'cozy';
  const isCompact = effectiveDensity === 'compact';
  const isSpaced = effectiveDensity === 'spaced';

  // Density & Typography Tokens strictly matching EnterpriseDataView and Global Font Specifications
  const dt = useMemo(() => ({
    drawerWidth: isCompact ? 'max-w-lg' : isSpaced ? 'max-w-2xl' : 'max-w-xl',
    headerPadding: isCompact ? 'px-3.5 py-2.5 sm:px-4 sm:py-3' : isSpaced ? 'px-5 py-4 sm:px-6 sm:py-5' : 'px-4 py-3.5 sm:px-5 sm:py-4',
    headerIconBox: isCompact ? 'w-8 h-8 rounded-lg' : isSpaced ? 'w-11 h-11 rounded-2xl' : 'w-10 h-10 rounded-xl',
    headerIcon: isCompact ? 'w-4 h-4' : isSpaced ? 'w-5 h-5' : 'w-5 h-5',
    headerTitle: isCompact ? 'text-sm font-bold' : isSpaced ? 'text-base font-bold' : 'text-sm sm:text-base font-bold',
    headerSubtitle: 'text-xs font-normal',
    tabBarPadding: isCompact ? 'px-2.5 pt-1.5 gap-1' : isSpaced ? 'px-4 pt-2.5 gap-2' : 'px-3 pt-2 gap-1.5',
    tabButtonPadding: isCompact ? 'pb-2 px-2 text-xs gap-1' : isSpaced ? 'pb-3.5 px-3.5 text-sm gap-2' : 'pb-2.5 px-2.5 text-xs gap-1.5',
    tabIcon: isCompact ? 'w-3.5 h-3.5' : isSpaced ? 'w-4 h-4' : 'w-3.5 h-3.5',
    toolbarPadding: isCompact ? 'p-2.5 space-y-2' : isSpaced ? 'p-4 space-y-3' : 'p-3 space-y-2.5',
    inputPadding: isCompact ? 'py-1 px-2.5 text-xs' : isSpaced ? 'py-2 px-3.5 text-sm' : 'py-1.5 px-3 text-xs',
    listPadding: isCompact ? 'p-2.5 space-y-2' : isSpaced ? 'p-4 space-y-3.5' : 'p-3.5 space-y-2.5',
    cardPadding: isCompact ? 'p-2.5 gap-2.5 rounded-lg' : isSpaced ? 'p-4 gap-3.5 rounded-2xl' : 'p-3.5 gap-3 rounded-xl',
    cardTitle: isCompact ? 'text-xs font-semibold leading-tight' : isSpaced ? 'text-sm font-bold leading-normal' : 'text-xs sm:text-sm font-semibold leading-snug',
    cardDesc: 'text-xs font-normal leading-relaxed mt-1',
    badge: isCompact ? 'text-xs px-1.5 py-0.5 font-mono font-medium' : isSpaced ? 'text-xs px-2.5 py-0.5 font-mono font-medium' : 'text-xs px-2 py-0.5 font-mono font-medium',
    actionBtn: isCompact ? 'px-2.5 py-1 text-xs font-semibold rounded-md' : isSpaced ? 'px-3.5 py-2 text-sm font-semibold rounded-xl' : 'px-3 py-1.5 text-xs font-semibold rounded-lg',
    footerPadding: isCompact ? 'px-3 py-2 text-xs' : isSpaced ? 'px-5 py-3.5 text-sm' : 'px-4 py-2.5 text-xs',
  }), [isCompact, isSpaced]);

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const handleCopyText = (text: string, id: string) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

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

  // Export Activity Logs to CSV
  const handleExportActivityLogsCsv = () => {
    if (filteredActivityLogs.length === 0) return;
    const headers = ['Mã ID', 'Phân hệ', 'Mã chứng từ', 'Thao tác', 'Trạng thái', 'HTTP Status', 'Thời gian', 'Người thực hiện', 'Lý do / Lỗi', 'Endpoint API'];
    const rows = filteredActivityLogs.map((log) => [
      log.id,
      `"${(log.sourceModule || '').replace(/"/g, '""')}"`,
      `"${(log.businessReference || '').replace(/"/g, '""')}"`,
      `"${(log.actionLabel || '').replace(/"/g, '""')}"`,
      log.status,
      log.statusCode || '',
      new Date(log.timestamp).toISOString(),
      `"${(log.userName || '').replace(/"/g, '""')}"`,
      `"${(log.reason || '').replace(/"/g, '""')}"`,
      `"${(log.endpoint || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NexusSync_ActivityLogs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Activity Logs
  const handlePrintActivityLogs = () => {
    window.print();
  };

  // Confirm Clear Activity Logs (Rule #19 compliant)
  const handlePromptClearActivityLogs = () => {
    if (!onClearActivityLogs) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận xoá toàn bộ Nhật ký Hoạt động',
      message: 'Bạn có chắc chắn muốn xoá toàn bộ lịch sử nhật ký thực thi tác vụ WorkQueue? Thao tác này không thể hoàn tác.',
      variant: 'danger',
      confirmText: 'Xoá tất cả nhật ký',
      cancelText: 'Huỷ bỏ',
      onConfirm: () => {
        onClearActivityLogs();
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  // Confirm Clear All Notifications (Rule #19 compliant)
  const handlePromptClearAllNotifications = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận xoá tất cả Thông báo',
      message: 'Toàn bộ danh sách thông báo hiện tại sẽ bị xoá khỏi bảng điều khiển. Bạn có muốn tiếp tục?',
      variant: 'danger',
      confirmText: 'Xoá thông báo',
      cancelText: 'Huỷ bỏ',
      onConfirm: () => {
        onClearAllNotifications();
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
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
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity cursor-pointer select-none font-sans"
    >
      <div
        id="unified-drawer"
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${dt.drawerWidth} bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200 cursor-default select-text font-sans`}
      >
        {/* Drawer Header */}
        <div className={`${dt.headerPadding} border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`${dt.headerIconBox} bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0`}>
              <Layers className={dt.headerIcon} />
            </div>
            <div>
              <h3 className={`${dt.headerTitle} text-slate-900 dark:text-white tracking-tight`}>Trung tâm Hoạt động & Tác vụ</h3>
              <p className={`${dt.headerSubtitle} text-slate-500 dark:text-slate-400 mt-0.5`}>Hàng chờ SLA & Thông báo hệ thống hợp nhất</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className={dt.tabIcon} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className={`flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${dt.tabBarPadding} overflow-x-auto select-none`}>
          <button
            type="button"
            onClick={() => setActiveTab('workqueue')}
            className={`${dt.tabButtonPadding} font-semibold transition-all border-b-2 flex items-center justify-center cursor-pointer whitespace-nowrap ${
              activeTab === 'workqueue'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock className={dt.tabIcon} />
            <span>Công việc</span>
            {pendingWorkCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 ${dt.badge}`}>
                {pendingWorkCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`${dt.tabButtonPadding} font-semibold transition-all border-b-2 flex items-center justify-center cursor-pointer whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Bell className={dt.tabIcon} />
            <span>Thông báo</span>
            {unreadNotifCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 ${dt.badge}`}>
                {unreadNotifCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity_log')}
            className={`${dt.tabButtonPadding} font-semibold transition-all border-b-2 flex items-center justify-center cursor-pointer whitespace-nowrap ${
              activeTab === 'activity_log'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Nhật ký thực thi tác vụ WorkQueue"
          >
            <History className={dt.tabIcon} />
            <span>Nhật ký (Activity Log)</span>
            {activityLogs.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full ${dt.badge} ${
                  activityLogs.some((l) => l.status === 'FAILURE')
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {activityLogs.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`${dt.tabButtonPadding} font-semibold transition-all border-b-2 flex items-center cursor-pointer whitespace-nowrap ${
              activeTab === 'preferences'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Cài đặt bộ lọc thông báo"
          >
            <Sliders className={dt.tabIcon} />
            <span className="hidden sm:inline">Cài đặt</span>
          </button>
        </div>

        {/* Tab 1: WorkQueue / SLA */}
        {activeTab === 'workqueue' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/60 dark:bg-slate-950/50">
            {/* SLA Performance Overview */}
            <div className={`${dt.toolbarPadding} bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">SLA Performance (Tháng này)</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">94.5% On-time</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94.5%' }}></div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${isDelegationActive ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                    onClick={() => setIsDelegationActive(!isDelegationActive)}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full shadow-xs transition-transform ${isDelegationActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Chế độ nhận ủy quyền (OOO)</span>
                </div>
              </div>
            </div>

            {/* Filter Toolbar with Module Dropdown & Search & Pill Tabs */}
            <div className={`${dt.toolbarPadding} bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 shrink-0`}>
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
                    className={`w-full pl-8 pr-8 ${dt.inputPadding} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs`}
                  />
                  {workSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setWorkSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
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
                      className={`w-full pl-8 pr-7 ${dt.inputPadding} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer transition-all truncate`}
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    workModuleFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>Tất cả</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full font-mono font-medium ${dt.badge} ${
                      workModuleFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
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
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      title={mod.name}
                    >
                      <span>{mod.code}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full font-mono font-medium ${dt.badge} ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
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
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>
                      Đang lọc: <strong className="font-semibold text-slate-700 dark:text-slate-200">{workModuleFilter !== 'all' ? `Phân hệ [${workModuleFilter}]` : 'Từ khóa tìm kiếm'}</strong>
                      {' '}({filteredWorkItems.length}/{workItems.length} tác vụ)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setWorkModuleFilter('all');
                      setWorkSearchQuery('');
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              )}
            </div>

            {selectedWorkIds.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border-b border-blue-100 dark:border-blue-900 flex items-center justify-between shrink-0">
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">Đã chọn {selectedWorkIds.length} tác vụ</span>
                <button
                  onClick={handleBulkWorkAction}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Duyệt hàng loạt
                </button>
              </div>
            )}

            <div className={`flex-1 overflow-y-auto ${dt.listPadding}`}>
              {filteredWorkItems.length === 0 ? (
                <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                  {workItems.length === 0 ? (
                    <>
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-80" />
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Tất cả hàng chờ đã hoàn thành!</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-normal">Không có tác vụ nào tồn đọng vi phạm SLA.</p>
                    </>
                  ) : (
                    <>
                      <Boxes className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Không có tác vụ nào thuộc phân hệ này</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto font-normal leading-relaxed">
                        Không tìm thấy công việc nào khớp với phân hệ hoặc từ khóa bạn đã chọn.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setWorkModuleFilter('all');
                          setWorkSearchQuery('');
                        }}
                        className="mt-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
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
                      className={`flex ${dt.cardPadding} border transition-all ${
                        isUrgent
                          ? 'border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/40 shadow-xs'
                          : isGuided
                          ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/90 dark:hover:bg-slate-800'
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
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                          <span className={`${dt.badge} border font-medium ${
                            isGuided 
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700' 
                              : 'bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                          }`}>
                            {item.sourceModule} • {item.businessReference}
                          </span>
                          <span
                            className={`font-mono border ${dt.badge} font-semibold ${
                              isUrgent 
                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' 
                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>

                        <h4 className={`${dt.cardTitle} text-slate-900 dark:text-white flex items-center gap-1.5`}>
                          {isGuided && <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />}
                          <span>{item.title}</span>
                        </h4>
                        {item.description && <p className={`${dt.cardDesc} text-slate-600 dark:text-slate-300 font-normal leading-relaxed`}>{item.description}</p>}

                        {item.dueAt && (
                          <div className={`mt-2 text-xs font-semibold flex items-center gap-1 font-mono tabular-nums ${item.isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>Hạn xử lý: {new Date(item.dueAt).toLocaleString('vi-VN')}</span>
                          </div>
                        )}

                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const docCode = String(item.businessReference || item.entityId || '').trim();
                              if (docCode) {
                                try {
                                  sessionStorage.setItem('nexus_target_doc', JSON.stringify({ code: docCode, timestamp: Date.now(), item }));
                                } catch {}
                                window.dispatchEvent(new CustomEvent('nexus-target-document', { detail: { code: docCode, item, route: item.targetRoute } }));
                              }
                              onNavigate(item.targetRoute, item);
                              onClose();
                            }}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer group"
                            title={`Mở và định vị trực tiếp chứng từ ${item.businessReference || item.entityId || ''}`}
                          >
                            <span className="group-hover:underline">{isGuided ? 'Mở Trợ lý Hướng Dẫn' : 'Mở chứng từ'}</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                          </button>

                          {item.actions && item.actions.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              {item.actions.map((act) => (
                                <button
                                  key={act.id}
                                  onClick={() => onWorkItemAction(item, act.endpoint, act.label)}
                                  className={`${dt.actionBtn} transition-colors shadow-2xs cursor-pointer flex items-center gap-1 ${
                                    act.variant === 'danger'
                                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                                      : isGuided
                                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
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
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/60 dark:bg-slate-950/50">
            {/* Search, Module Selector and Quick Filters */}
            <div className={`${dt.toolbarPadding} bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0`}>
              {/* Search Bar & Module Dropdown */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo tiêu đề, nội dung, phân hệ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-8 pr-8 ${dt.inputPadding} bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
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
                    className={`${dt.inputPadding} pl-2.5 pr-7 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer`}
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
                    activeClass: 'bg-slate-900 dark:bg-blue-600 text-white font-semibold',
                    inactiveClass: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700',
                  },
                  {
                    id: 'unread' as const,
                    label: 'Chưa đọc',
                    count: unreadNotifCount,
                    activeClass: 'bg-blue-600 text-white font-semibold',
                    inactiveClass: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60',
                  },
                  {
                    id: 'danger' as const,
                    label: 'Nguy cấp',
                    count: enabledNotifications.filter((n) => n.type === 'danger').length,
                    activeClass: 'bg-rose-600 text-white font-semibold',
                    inactiveClass: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60',
                  },
                  {
                    id: 'warning' as const,
                    label: 'Cảnh báo',
                    count: enabledNotifications.filter((n) => n.type === 'warning').length,
                    activeClass: 'bg-amber-600 text-white font-semibold',
                    inactiveClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60',
                  },
                  {
                    id: 'success' as const,
                    label: 'Thành công',
                    count: enabledNotifications.filter((n) => n.type === 'success').length,
                    activeClass: 'bg-emerald-600 text-white font-semibold',
                    inactiveClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
                  },
                  {
                    id: 'info' as const,
                    label: 'Thông tin',
                    count: enabledNotifications.filter((n) => n.type === 'info').length,
                    activeClass: 'bg-sky-600 text-white font-semibold',
                    inactiveClass: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60',
                  },
                ].map((tab) => {
                  const isActive = notifFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setNotifFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isActive ? tab.activeClass : tab.inactiveClass
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full font-mono font-medium ${dt.badge} ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Group By Selector & Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200 dark:border-slate-800 text-xs">
                {/* Group Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 text-xs">
                    <ListFilter className="w-3.5 h-3.5 text-slate-400" /> Gom nhóm:
                  </span>
                  <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setGroupBy('date')}
                      className={`px-2.5 py-0.5 rounded-md text-xs transition-all flex items-center gap-1 cursor-pointer ${
                        groupBy === 'date'
                          ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 font-semibold shadow-2xs'
                          : 'font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" /> Theo Ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupBy('module')}
                      className={`px-2.5 py-0.5 rounded-md text-xs transition-all flex items-center gap-1 cursor-pointer ${
                        groupBy === 'module'
                          ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 font-semibold shadow-2xs'
                          : 'font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" /> Theo Phân Hệ
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupBy('none')}
                      className={`px-2.5 py-0.5 rounded-md text-xs transition-all cursor-pointer ${
                        groupBy === 'none'
                          ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 font-semibold shadow-2xs'
                          : 'font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                    className="px-2 py-1 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 font-semibold text-xs cursor-pointer transition-colors"
                    title="Đánh dấu tất cả thông báo là đã đọc"
                  >
                    Đã đọc tất cả
                  </button>
                  <button
                    type="button"
                    onClick={handlePromptClearAllNotifications}
                    className="px-2 py-1 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 font-semibold text-xs cursor-pointer transition-colors"
                    title="Xóa tất cả thông báo"
                  >
                    Xóa tất cả
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={handleExportNotificationsCsv}
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    title="Xuất danh sách thông báo ra CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintNotifications}
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    title="In / Xuất PDF thông báo"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preferences')}
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    title="Cài đặt bộ lọc & tùy chọn thông báo"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List (Grouped) */}
            <div className={`flex-1 overflow-y-auto ${dt.listPadding}`}>
              {filteredNotifications.length === 0 ? (
                <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                    <Bell className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Hộp thư thông báo trống</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto font-normal leading-relaxed">
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
                      className="mt-4 px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
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
                          className="sticky top-0 z-10 py-1.5 px-3 bg-slate-100 dark:bg-slate-800 backdrop-blur-xs rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors select-none shadow-2xs"
                        >
                          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                            {isCollapsed ? (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            )}
                            {groupBy === 'date' ? (
                              <CalendarDays className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Boxes className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            )}
                            <span className="text-slate-900 dark:text-slate-100 font-bold">{group.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {group.unreadCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                {group.unreadCount} mới
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
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
                                className={`${dt.cardPadding} border transition-all flex ${
                                  notif.isRead
                                    ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 opacity-85 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/90 dark:hover:bg-slate-800'
                                    : isDanger
                                    ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 shadow-xs hover:border-rose-300 dark:hover:border-rose-800'
                                    : isWarning
                                    ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 shadow-xs hover:border-amber-300 dark:hover:border-amber-800'
                                    : isSuccess
                                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800'
                                    : 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 shadow-xs hover:border-blue-300 dark:hover:border-blue-800'
                                }`}
                              >
                                {/* Left Type Icon */}
                                <div className="pt-0.5 shrink-0">
                                  {isDanger ? (
                                    <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center">
                                      <ShieldAlert className="w-4 h-4" />
                                    </div>
                                  ) : isWarning ? (
                                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                                      <AlertTriangle className="w-4 h-4" />
                                    </div>
                                  ) : isSuccess ? (
                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                                      <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                  ) : (
                                    <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300 flex items-center justify-center">
                                      <Info className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1 gap-2">
                                    <span className={`${dt.badge} border font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 truncate max-w-[200px]`}>
                                      {notif.module}
                                    </span>
                                    <span
                                      className="text-xs text-slate-400 dark:text-slate-400 whitespace-nowrap font-mono tabular-nums font-medium"
                                      title={
                                        typeof notif.timestamp === 'string'
                                          ? notif.timestamp
                                          : new Date(notif.timestamp).toLocaleString('vi-VN')
                                      }
                                    >
                                      {formatRelativeTime(notif.timestamp)}
                                    </span>
                                  </div>

                                  <h4 className={`${dt.cardTitle} text-slate-900 dark:text-white`}>{notif.title}</h4>
                                  <p className={`${dt.cardDesc} text-slate-600 dark:text-slate-300 font-normal leading-relaxed`}>{notif.message}</p>

                                  {/* Action Bar */}
                                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2 flex-wrap">
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
                                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer shadow-2xs"
                                          title={`Xem sơ đồ Mapping & Truy vết 360° cho ${docCode}`}
                                        >
                                          <GitBranch className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
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
                                              if (docCode) {
                                                try {
                                                  sessionStorage.setItem('nexus_target_doc', JSON.stringify({ code: docCode, timestamp: Date.now() }));
                                                } catch {}
                                                window.dispatchEvent(new CustomEvent('nexus-target-document', { detail: { code: docCode, route: notif.link } }));
                                              }
                                              onNavigate(notif.link, docCode ? { businessReference: docCode, title: notif.title, sourceModule: notif.module } as any : undefined);
                                              onClose();
                                            }
                                          }}
                                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                                        >
                                          <span>Màn hình làm việc</span>
                                          <ArrowRight className="w-3.5 h-3.5" />
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
                                          notif.isRead ? 'text-slate-300 dark:text-slate-600 hover:text-blue-600' : 'text-blue-600 dark:text-blue-400 hover:text-slate-400'
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
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/60 dark:bg-slate-950/50 font-sans">
            {/* Header / Filter Toolbar */}
            <div className={`${dt.toolbarPadding} bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Nhật ký Thao tác WorkQueue</span>
                  </h4>
                  <p className={`${dt.headerSubtitle} text-slate-500 dark:text-slate-400 mt-0.5`}>
                    Theo dõi lịch sử thực thi, phân đoạn theo từng phân hệ (M17, M25, M27...)
                  </p>
                </div>
                
                {/* Actions: Export CSV, Print, Clear */}
                <div className="flex items-center gap-1.5">
                  {filteredActivityLogs.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleExportActivityLogsCsv}
                        className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 font-semibold transition-colors cursor-pointer shadow-2xs"
                        title="Xuất danh sách nhật ký ra CSV"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="hidden sm:inline">Xuất CSV</span>
                      </button>
                      <button
                        type="button"
                        onClick={handlePrintActivityLogs}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="In nhật ký hoạt động"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {activityLogs.length > 0 && onClearActivityLogs && (
                    <button
                      type="button"
                      onClick={handlePromptClearActivityLogs}
                      className="text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 font-semibold transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Xoá tất cả nhật ký"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Xóa nhật ký</span>
                    </button>
                  )}
                </div>
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
                    className={`w-full pl-8 pr-8 ${dt.inputPadding} bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs`}
                  />
                  {activitySearch && (
                    <button
                      type="button"
                      onClick={() => setActivitySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
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
                      className={`w-full pl-8 pr-7 ${dt.inputPadding} bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer transition-all truncate`}
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    activityModuleFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>Tất cả</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full font-mono font-medium ${dt.badge} ${
                      activityModuleFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
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
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      title={mod.name}
                    >
                      <span>{mod.code}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full font-mono font-medium ${dt.badge} ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
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
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActivityFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activityFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Tất cả ({activityLogs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter('failure')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                      activityFilter === 'failure'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Lỗi / Thất bại ({failureLogCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter('success')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                      activityFilter === 'success'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Thành công ({activityLogs.length - failureLogCount})</span>
                  </button>
                </div>
              </div>

              {/* Active Filter Indicator & Reset */}
              {(activityModuleFilter !== 'all' || activitySearch || activityFilter !== 'all') && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>
                      Đang lọc: <strong className="font-semibold text-slate-700 dark:text-slate-200">
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
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              )}
            </div>

            {/* Activity Logs List */}
            <div className={`flex-1 overflow-y-auto ${dt.listPadding}`}>
              {filteredActivityLogs.length === 0 ? (
                <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                  <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Chưa có nhật ký hoạt động phù hợp</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto font-normal leading-relaxed">
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
                      className="mt-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
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
                      className={`${dt.cardPadding} border transition-all cursor-pointer bg-white dark:bg-slate-900 ${
                        isFail
                          ? 'border-rose-200 dark:border-rose-900/80 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-xs hover:bg-rose-50/40 dark:hover:bg-rose-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs hover:bg-slate-50/90 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Status Icon */}
                        <div className="pt-0.5 shrink-0">
                          {isFail ? (
                            isPermissionErr ? (
                              <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center" title="Lỗi phân quyền">
                                <ShieldX className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center" title="Thao tác thất bại">
                                <XCircle className="w-4 h-4" />
                              </div>
                            )
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center" title="Thành công">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        {/* Log Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`${dt.badge} bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium`}>
                                {log.sourceModule}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                                  {log.businessReference}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyText(log.businessReference, `code-${log.id}`);
                                  }}
                                  className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                                  title="Sao chép mã chứng từ"
                                >
                                  {copiedId === `code-${log.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <span className="text-xs text-slate-400 dark:text-slate-400 whitespace-nowrap font-mono tabular-nums font-medium">
                              {new Date(log.timestamp).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>

                          <h4 className={`${dt.cardTitle} text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap`}>
                            <span className="font-semibold">Thao tác: {log.actionLabel}</span>
                            <span
                              className={`border ${dt.badge} font-semibold font-mono ${
                                isFail
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
                              }`}
                            >
                              {isFail ? 'FAILED' : 'SUCCESS'}
                            </span>
                          </h4>

                          {/* Failure Reason Box */}
                          {isFail && log.reason && (
                            <div className="mt-2 p-2.5 rounded-lg bg-rose-50/90 dark:bg-rose-950/70 border border-rose-200/80 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 space-y-1">
                              <div className="flex items-center gap-1 font-bold text-xs uppercase tracking-wider text-rose-700 dark:text-rose-300">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>
                                  {isPermissionErr
                                    ? 'Từ chối phân quyền (Permission Denied)'
                                    : isValidationErr
                                    ? 'Lỗi kiểm tra nghiệp vụ (Validation Error)'
                                    : 'Nguyên nhân thất bại'}
                                </span>
                              </div>
                              <p className="leading-relaxed font-sans text-xs font-normal text-rose-800 dark:text-rose-200">{log.reason}</p>
                            </div>
                          )}

                          {/* Success Message or summary */}
                          {!isFail && log.reason && (
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans font-normal">{log.reason}</p>
                          )}

                          {/* Footer Meta */}
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <div className="flex items-center gap-2">
                              {log.userName && (
                                <span>
                                  Người thực thi: <strong className="font-semibold text-slate-700 dark:text-slate-200">{log.userName}</strong>
                                </span>
                              )}
                              {log.durationMs !== undefined && (
                                <span className="font-mono tabular-nums">• {log.durationMs}ms</span>
                              )}
                            </div>
                            <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5 hover:underline text-xs">
                              Chi tiết <ChevronRight className="w-3.5 h-3.5" />
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
          <div className={`flex-1 overflow-y-auto ${dt.toolbarPadding} space-y-6 font-sans`}>
            <div>
              <h4 className={`${dt.headerTitle} text-slate-900 dark:text-white mb-1`}>Cài đặt bộ lọc Thông báo & Cảnh báo</h4>
              <p className={`${dt.headerSubtitle} text-slate-500 dark:text-slate-400`}>Tùy chỉnh các loại thông báo bạn muốn nhận trên hệ thống.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Theo mức độ nghiêm trọng</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'danger', label: 'Nghiêm trọng (Danger)' },
                    { key: 'warning', label: 'Cảnh báo (Warning)' },
                    { key: 'success', label: 'Thành công (Success)' },
                    { key: 'info', label: 'Thông tin (Info)' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={(preferences as any)[item.key]}
                        onChange={(e) => onPreferencesChange({ ...preferences, [item.key]: e.target.checked })}
                        className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-900 cursor-pointer"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Theo phân hệ nghiệp vụ</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'inventory', label: 'Kho & VMS' },
                    { key: 'procurement', label: 'Mua hàng & MRP' },
                    { key: 'quality', label: 'Kiểm tra chất lượng' },
                    { key: 'sales', label: 'Bán hàng & CRM' },
                    { key: 'system', label: 'Hệ thống & EventBus' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={(preferences as any)[item.key]}
                        onChange={(e) => onPreferencesChange({ ...preferences, [item.key]: e.target.checked })}
                        className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-900 cursor-pointer"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`${dt.footerPadding} bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-xs`}>
          <span>Trung tâm Hoạt động Hợp nhất</span>
          <span>NexusSync v1.0 • Density: <strong className="uppercase text-blue-600 dark:text-blue-400 font-semibold">{effectiveDensity}</strong></span>
        </div>
      </div>

      {/* Selected Log Details Modal */}
      {selectedLogForDetails && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans"
          onClick={() => setSelectedLogForDetails(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className={`p-4 border-b flex items-center justify-between ${
                selectedLogForDetails.status === 'FAILURE'
                  ? 'bg-rose-50/80 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-100'
                  : 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {selectedLogForDetails.status === 'FAILURE' ? (
                  <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 flex items-center justify-center">
                    <XCircle className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold tracking-tight">
                    Chi tiết Thực thi: {selectedLogForDetails.actionLabel}
                  </h3>
                  <p className="text-xs opacity-80 font-mono">
                    {selectedLogForDetails.businessReference} • {selectedLogForDetails.sourceModule}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
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
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs">Trạng thái:</span>
                  <span className="font-mono uppercase font-bold text-xs">
                    {selectedLogForDetails.status}
                  </span>
                  {selectedLogForDetails.statusCode && (
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold">
                      HTTP {selectedLogForDetails.statusCode}
                    </span>
                  )}
                </div>
                <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums text-xs font-medium">
                  {new Date(selectedLogForDetails.timestamp).toLocaleString('vi-VN')}
                </span>
              </div>

              {/* Failure Explanation */}
              {selectedLogForDetails.status === 'FAILURE' && (
                <div className="p-3.5 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-100 space-y-2 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold uppercase tracking-wider text-xs">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Lý do / Nguyên nhân thất bại</span>
                  </div>
                  <p className="text-xs font-normal leading-relaxed text-rose-200 font-sans">
                    {selectedLogForDetails.reason || 'Lỗi không xác định từ máy chủ hoặc kiểm tra nghiệp vụ.'}
                  </p>
                  <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 font-normal">
                    💡 <strong className="font-semibold text-slate-300">Hướng dẫn khắc phục:</strong> Kiểm tra phân quyền vai trò người dùng (Role Permissions) hoặc trạng thái kho/tài chính liên quan đến chứng từ này.
                  </div>
                </div>
              )}

              {/* Key Value Details Grid */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 space-y-2 font-sans">
                <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-200/60 dark:border-slate-700 items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Phân hệ (Module):</span>
                  <span className="col-span-2 font-semibold text-xs text-slate-800 dark:text-slate-200">{selectedLogForDetails.sourceModule}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-200/60 dark:border-slate-700 items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Mã chứng từ:</span>
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="font-semibold text-xs font-mono text-slate-800 dark:text-slate-200">{selectedLogForDetails.businessReference}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(selectedLogForDetails.businessReference, 'modal-ref')}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 text-xs cursor-pointer"
                      title="Sao chép mã chứng từ"
                    >
                      {copiedId === 'modal-ref' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-200/60 dark:border-slate-700 items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Thao tác:</span>
                  <span className="col-span-2 font-semibold text-xs text-slate-800 dark:text-slate-200">{selectedLogForDetails.actionLabel}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-200/60 dark:border-slate-700 items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">API Endpoint:</span>
                  <span className="col-span-2 text-xs font-mono text-slate-700 dark:text-slate-300 break-all">{selectedLogForDetails.endpoint}</span>
                </div>
                {selectedLogForDetails.userName && (
                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-200/60 dark:border-slate-700 items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Người thực hiện:</span>
                    <span className="col-span-2 font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {selectedLogForDetails.userName} {selectedLogForDetails.userRole ? `(${selectedLogForDetails.userRole})` : ''}
                    </span>
                  </div>
                )}
                {selectedLogForDetails.durationMs !== undefined && (
                  <div className="grid grid-cols-3 gap-2 py-1.5 items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Thời gian xử lý:</span>
                    <span className="col-span-2 text-xs font-mono text-slate-700 dark:text-slate-300 tabular-nums">{selectedLogForDetails.durationMs}ms</span>
                  </div>
                )}
              </div>

              {/* Extra Details / Payload */}
              {selectedLogForDetails.details && Object.keys(selectedLogForDetails.details).length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h5 className="font-semibold text-xs text-slate-700 dark:text-slate-300">Dữ liệu chi tiết đính kèm:</h5>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          JSON.stringify(selectedLogForDetails.details, null, 2),
                          'modal-json'
                        )
                      }
                      className="px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'modal-json' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 dark:bg-slate-950 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
                    {JSON.stringify(selectedLogForDetails.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center gap-2">
              {onInspectEntity && selectedLogForDetails.businessReference ? (
                <button
                  type="button"
                  onClick={() => {
                    const ref = selectedLogForDetails.businessReference;
                    setSelectedLogForDetails(null);
                    onInspectEntity(ref);
                  }}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-blue-200 dark:border-blue-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Truy vết chứng từ ({selectedLogForDetails.businessReference})</span>
                </button>
              ) : <div />}
              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog (Rule #19 Compliance) */}
      <ConfirmDialog state={confirmDialog} setState={setConfirmDialog} />
    </div>
  );
};
export default UnifiedActivityTaskDrawer;
