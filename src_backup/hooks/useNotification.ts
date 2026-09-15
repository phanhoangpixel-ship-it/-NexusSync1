import { useState, useEffect, useCallback, useMemo } from 'react';
import { ToastMessage } from '../types';
import { NotificationItem, NotificationPreferences, isNotificationEnabled } from '../components/common/NotificationDrawer';
import { extractModuleCode, getModuleInfo } from '../utils/moduleMapper';

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'AL-101',
    type: 'danger',
    title: 'Tồn kho dưới hạn định mức (Low Stock Alert)',
    message: 'Mặt hàng LAPTOP-DELL-LATITUDE có số lượng tồn khả dụng là 2, thấp hơn định mức an toàn tối thiểu (5).',
    module: 'M17 Inventory Core',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
    link: '/inventory'
  },
  {
    id: 'AL-102',
    type: 'warning',
    title: 'Cảnh báo SLA phê duyệt PO trễ hạn (SLA Breach)',
    message: 'Đơn mua hàng PO-2026-0044 trị giá 120,000,000 VND đang chờ phê duyệt quá 48 giờ bởi CFO Nam.',
    module: 'M08 Purchase Orders',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    isRead: false,
    link: '/purchase'
  },
  {
    id: 'AL-103',
    type: 'success',
    title: 'Kiểm định chất lượng thành phẩm Đạt (Quality PASS)',
    message: 'Lô sản xuất Lot-2026-M04 đạt 100% tiêu chí kiểm định OQC từ phân hệ Quality Control QMS.',
    module: 'M39 Quality Control',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    isRead: true,
    link: '/quality'
  },
  {
    id: 'AL-104',
    type: 'info',
    title: 'Đăng ký EventBus Consumer mới',
    message: 'Hệ thống đã tự động kích hoạt ProcurementNotificationDispatcher lắng nghe kênh erp.manufacturing.*.',
    module: 'M05 EventBus',
    timestamp: new Date(Date.now() - 18000000).toISOString(),
    isRead: true,
    link: '/event-bus'
  }
];

const DEFAULT_PREFERENCES: NotificationPreferences = {
  danger: true,
  warning: true,
  success: true,
  info: true,
  inventory: true,
  procurement: true,
  quality: true,
  sales: true,
  system: true,
};

export interface UseNotificationOptions {
  currentModule?: { moduleId: string; moduleName: string; route?: string } | null;
}

export function useNotification(options?: UseNotificationOptions) {
  const currentModule = options?.currentModule;

  // 1. Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // 2. Persistent notification history
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexussync_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to initial
    }
    return INITIAL_NOTIFICATIONS;
  });

  // 3. User notification preferences
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem('nexussync_notification_prefs');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PREFERENCES;
  });

  // Sync notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nexussync_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn('[useNotification] Could not persist notifications:', e);
    }
  }, [notifications]);

  // Sync preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nexussync_notification_prefs', JSON.stringify(preferences));
    } catch (e) {
      console.warn('[useNotification] Could not persist preferences:', e);
    }
  }, [preferences]);

  // Dismiss a toast
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Main notification trigger
  const notify = useCallback(
    (
      type: 'success' | 'danger' | 'warning' | 'info',
      title: string,
      message: string,
      moduleName?: string,
      link?: string
    ) => {
      const id = Date.now().toString() + Math.random().toString().slice(2, 6);
      
      // Add visual toast popup
      setToasts((prev) => [
        ...prev,
        {
          id,
          type,
          title,
          message,
          timestamp: Date.now(),
          module: resolvedModule,
          link: resolvedLink,
        },
      ]);

      // Format module label and link
      const resolvedModule =
        moduleName ||
        (currentModule ? `[${currentModule.moduleId}] ${currentModule.moduleName}` : 'Hệ thống ERP');
      
      const resolvedLink =
        link ||
        (currentModule ? (currentModule.route || `/${extractModuleCode(currentModule.moduleId).toLowerCase()}`) : undefined);

      // Persist as a real notification in the Unified Center
      const notifItem: NotificationItem = {
        id: 'NT-' + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 5).toUpperCase(),
        type,
        title,
        message,
        module: resolvedModule,
        timestamp: new Date().toISOString(),
        isRead: false,
        link: resolvedLink,
      };

      setNotifications((prev) => [notifItem, ...prev].slice(0, 100));

      // Auto dismiss toast after 4.5s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);

      return notifItem.id;
    },
    [currentModule]
  );

  // Alias for backward compatibility
  const addToast = notify;

  // Mark single as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    notify('success', 'Đã đọc tất cả', 'Tất cả thông báo đã được đánh dấu là đã đọc.');
  }, [notify]);

  // Delete notification
  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    notify('info', 'Đã xóa thông báo', 'Thông báo đã được gỡ bỏ khỏi hộp thư.');
  }, [notify]);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    notify('info', 'Đã xóa tất cả', 'Hộp thư thông báo đã được xóa sạch.');
  }, [notify]);

  // Trigger test simulation
  const triggerSimulation = useCallback(
    (type: 'inventory' | 'mrp_fail' | 'sla_overdue' | 'system_ok') => {
      const id = 'SIM-' + Math.floor(Math.random() * 1000 + 1000);
      let newNotif: NotificationItem;

      if (type === 'inventory') {
        newNotif = {
          id,
          type: 'danger',
          title: 'Cảnh báo Tồn kho khẩn cấp (WMS Out of Stock)',
          message: 'Mã hàng nguyên vật liệu STEEL-PLATE-01 có tồn khả dụng chạm mức 0 tại Kho Thành phẩm.',
          module: 'M17 Inventory Core',
          timestamp: new Date().toISOString(),
          isRead: false,
          link: '/inventory',
        };
      } else if (type === 'mrp_fail') {
        newNotif = {
          id,
          type: 'danger',
          title: 'Lỗi lập lịch nhu cầu vật tư MRP (Scheduling Fail)',
          message: 'Phân hệ MRP không thể tự động sinh đề xuất PO cho Lệnh MO-2026-009 do thiếu thông tin Supplier SRM chính thức.',
          module: 'M25 Manufacturing MES',
          timestamp: new Date().toISOString(),
          isRead: false,
          link: '/suppliers',
        };
      } else if (type === 'sla_overdue') {
        newNotif = {
          id,
          type: 'warning',
          title: 'Cảnh báo trễ hạn phê duyệt SO (Credit Check Overdue)',
          message: 'Đơn hàng SO-2026-0099 trị giá 500M VND đang bị treo duyệt công nợ quá 24 tiếng.',
          module: 'M13 Sales Orders',
          timestamp: new Date().toISOString(),
          isRead: false,
          link: '/sales',
        };
      } else {
        newNotif = {
          id,
          type: 'success',
          title: 'Kiểm định Chất lượng nguyên vật liệu Đạt (IQC Approved)',
          message: 'Hàng nhập kho từ Nhà cung cấp POSCO Steel đạt 100% tiêu chí cơ lý hóa, cho phép đưa vào sản xuất.',
          module: 'M39 Quality Control',
          timestamp: new Date().toISOString(),
          isRead: false,
          link: '/quality',
        };
      }

      setNotifications((prev) => [newNotif, ...prev].slice(0, 100));
      setToasts((prev) => [
        ...prev,
        {
          id,
          type: newNotif.type,
          title: newNotif.title,
          message: newNotif.message,
          timestamp: Date.now(),
          module: newNotif.module,
          link: newNotif.link,
        },
      ]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  // Unread notifications count (filtered by user preferences)
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead && isNotificationEnabled(n, preferences)).length;
  }, [notifications, preferences]);

  return {
    notify,
    addToast,
    toasts,
    notifications,
    preferences,
    setPreferences,
    dismissToast,
    markAsRead,
    markRead: markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll: clearAllNotifications,
    clearAllNotifications,
    triggerSimulation,
    unreadCount,
  };
}
