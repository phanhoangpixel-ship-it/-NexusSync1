import React, { useState, useEffect } from 'react';
import {
  Bell,
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
  Sliders
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  type: 'danger' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  module: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

export interface NotificationPreferences {
  danger: boolean;
  warning: boolean;
  success: boolean;
  info: boolean;
  inventory: boolean;
  procurement: boolean;
  quality: boolean;
  sales: boolean;
  system: boolean;
}

export const isNotificationEnabled = (notif: NotificationItem, prefs: NotificationPreferences): boolean => {
  // Check by type
  if (notif.type === 'danger' && !prefs.danger) return false;
  if (notif.type === 'warning' && !prefs.warning) return false;
  if (notif.type === 'success' && !prefs.success) return false;
  if (notif.type === 'info' && !prefs.info) return false;

  // Check by module department
  const moduleUpper = notif.module.toUpperCase();
  if (moduleUpper.includes('INVENTORY') && !prefs.inventory) return false;
  if ((moduleUpper.includes('PURCHASE') || moduleUpper.includes('MANUFACTURING')) && !prefs.procurement) return false;
  if (moduleUpper.includes('QUALITY') && !prefs.quality) return false;
  if (moduleUpper.includes('SALES') && !prefs.sales) return false;
  if (moduleUpper.includes('EVENTBUS') && !prefs.system) return false;

  return true;
};

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
  onTriggerSimulation: (type: 'inventory' | 'mrp_fail' | 'sla_overdue' | 'system_ok') => void;
  onNavigate: (route: string) => void;
  preferences: NotificationPreferences;
  onPreferencesChange: (newPrefs: NotificationPreferences) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onTriggerSimulation,
  onNavigate,
  preferences,
  onPreferencesChange,
}) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');
  const [filter, setFilter] = useState<'all' | 'unread' | 'danger' | 'warning' | 'success' | 'info'>('all');
  const [search, setSearch] = useState('');

  // Escape key to dismiss drawer
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

  if (!isOpen) return null;

  // Filter & Search Notifications (respecting personalized preferences)
  const enabledNotifications = notifications.filter((notif) => isNotificationEnabled(notif, preferences));

  const filteredNotifications = enabledNotifications.filter((notif) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'unread' && !notif.isRead) ||
      (filter === 'danger' && notif.type === 'danger') ||
      (filter === 'warning' && notif.type === 'warning') ||
      (filter === 'success' && notif.type === 'success') ||
      (filter === 'info' && notif.type === 'info');

    const matchesSearch =
      notif.title.toLowerCase().includes(search.toLowerCase()) ||
      notif.message.toLowerCase().includes(search.toLowerCase()) ||
      notif.module.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Calculate counts for each category
  const unreadCount = enabledNotifications.filter((n) => !n.isRead).length;
  const dangerCount = enabledNotifications.filter((n) => n.type === 'danger').length;
  const warningCount = enabledNotifications.filter((n) => n.type === 'warning').length;
  const successCount = enabledNotifications.filter((n) => n.type === 'success').length;
  const infoCount = enabledNotifications.filter((n) => n.type === 'info').length;

  const handlePrintNotifications = () => {
    const printContent = `
      <html>
        <head>
          <title>Báo cáo Nhật ký Thông báo - NexusSync ERP</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; }
            h1 { font-size: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 12px; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .type { font-weight: bold; text-transform: uppercase; font-size: 10px; }
            .danger { color: #dc2626; }
            .warning { color: #d97706; }
            .success { color: #16a34a; }
            .info { color: #2563eb; }
            .footer { margin-top: 40px; font-size: 10px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Báo cáo Nhật ký Thông báo - NexusSync ERP</h1>
          <p>Thời gian xuất báo cáo: ${new Date().toLocaleString('vi-VN')} | Tổng số thông báo hiển thị: ${filteredNotifications.length}</p>
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Phân hệ</th>
                <th>Loại</th>
                <th>Tiêu đề</th>
                <th>Nội dung chi tiết</th>
                <th>Thời gian</th>
                <th>Đã đọc</th>
              </tr>
            </thead>
            <tbody>
              ${filteredNotifications
                .map(
                  (n) => `
                <tr>
                  <td><code>${n.id}</code></td>
                  <td>${n.module}</td>
                  <td><span class="type ${n.type}">${n.type}</span></td>
                  <td><strong>${n.title}</strong></td>
                  <td>${n.message}</td>
                  <td>${new Date(n.timestamp).toLocaleTimeString('vi-VN')} ${new Date(n.timestamp).toLocaleDateString('vi-VN')}</td>
                  <td>${n.isRead ? 'Đã đọc' : 'Chưa đọc'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <div class="footer">
            Bản quyền thuộc về NexusSync Enterprise System Framework © 2026. Tất cả các quyền được bảo lưu.
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const handleExportCSV = () => {
    const csvHeader = 'ID,Module,Type,Title,Message,Timestamp,IsRead\n';
    const csvRows = filteredNotifications
      .map(
        (n) =>
          `"${n.id}","${n.module}","${n.type}","${n.title.replace(/"/g, '""')}","${n.message.replace(/"/g, '""')}","${n.timestamp}",${n.isRead}`
      )
      .join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nexussync_notifications_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="notification-drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity cursor-pointer select-none"
    >
      <div
        id="notification-drawer"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200 cursor-default select-text"
      >
        {/* Header section */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Thông báo Hệ thống</h3>
                {unreadCount > 0 && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    {unreadCount} mới
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Hộp thư cảnh báo nghiệp vụ và hệ thống (Nhấn ngoài hoặc Esc để thoát)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
            title="Đóng hộp thư (Esc hoặc nhấp ra ngoài)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition-all ${
              activeTab === 'notifications'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Hộp thư ({unreadCount} mới)
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'preferences'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Cá nhân hóa Bộ lọc</span>
          </button>
        </div>

        {activeTab === 'preferences' ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/30">
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Lọc theo Cấp độ khẩn cấp
              </h4>
              <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
                Tắt bớt các nhóm thông báo ít quan trọng hơn để loại bỏ tình trạng quá tải thông tin (alert fatigue).
              </p>
              
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-2xs overflow-hidden">
                {/* Danger Level */}
                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-150 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">Khẩn cấp (Danger)</span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-red-100 text-red-800 rounded-full">Quan trọng</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Lỗi nghiêm trọng như hết tồn kho nguyên vật liệu, MRP thất bại.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onPreferencesChange({ ...preferences, danger: !preferences.danger })}
                    className={`w-10 h-6 flex items-center rounded-full p-0.5 shrink-0 transition-colors cursor-pointer ${
                      preferences.danger ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                        preferences.danger ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Warning Level */}
                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-150 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">Rủi ro / SLA (Warning)</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cảnh báo vi phạm thời hạn SLA đơn mua hàng PO, duyệt công nợ.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onPreferencesChange({ ...preferences, warning: !preferences.warning })}
                    className={`w-10 h-6 flex items-center rounded-full p-0.5 shrink-0 transition-colors cursor-pointer ${
                      preferences.warning ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                        preferences.warning ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Success Level */}
                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-150 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">Hoàn thành nghiệp vụ (Success)</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Kiểm soát chất lượng đạt yêu cầu, nhập kho thành công.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onPreferencesChange({ ...preferences, success: !preferences.success })}
                    className={`w-10 h-6 flex items-center rounded-full p-0.5 shrink-0 transition-colors cursor-pointer ${
                      preferences.success ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                        preferences.success ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Info Level */}
                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-150 flex items-center justify-center shrink-0 mt-0.5">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">Thông tin bổ trợ (Info)</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Đăng ký dịch vụ, kết nối mạng lưới EventBus, thay đổi hạ tầng.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onPreferencesChange({ ...preferences, info: !preferences.info })}
                    className={`w-10 h-6 flex items-center rounded-full p-0.5 shrink-0 transition-colors cursor-pointer ${
                      preferences.info ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                        preferences.info ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Lọc theo Phân hệ Nghiệp vụ
              </h4>
              <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
                Chỉ tiếp nhận các loại thông báo từ các phân hệ liên quan trực tiếp đến phòng ban và vị trí của bạn.
              </p>

              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-2xs overflow-hidden">
                {/* Inventory Toggle */}
                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono mt-0.5">
                      WMS
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">Kho vận & Tồn kho (Inventory)</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        M17 Inventory - Kiểm soát số lượng, cảnh báo hết hàng, nhập kho.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onPreferencesChange({ ...preferences, inventory: !preferences.inventory })}
                    className={`w-10 h-6 flex items-center rounded-full p-0.5 shrink-0 transition-colors cursor-pointer ${
                      preferences.inventory ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                        preferences.inventory ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Procurement Toggle */}
                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono mt-0.5">
                      MRP
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">Mua hàng & Sản xuất (Procurement)</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        M08 PO & M25 MES - Đề xuất vật tư, cảnh báo trễ hạn giao dịch, lỗi MRP.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onPreferencesChange({ ...preferences, procurement: !preferences.procurement })}
                    className={`w-10 h-6 flex items-center rounded-full p-0.5 shrink-0 transition-colors cursor-pointer ${
                      preferences.procurement ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                        preferences.procurement ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Quality Toggle */}
                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono mt-0.5">
                      QMS
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">Kiểm soát Chất lượng (Quality)</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        M39 QC - Phiếu kiểm thử đạt/không đạt tiêu chí OQC, IQC.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onPreferencesChange({ ...preferences, quality: !preferences.quality })}
                    className={`w-10 h-6 flex items-center rounded-full p-0.5 shrink-0 transition-colors cursor-pointer ${
                      preferences.quality ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                        preferences.quality ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Sales Toggle */}
                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono mt-0.5">
                      CRM
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">Kinh doanh & Bán hàng (Sales)</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        M13 Sales - Phê duyệt công nợ, giao dịch SO, đơn hàng phát sinh mới.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onPreferencesChange({ ...preferences, sales: !preferences.sales })}
                    className={`w-10 h-6 flex items-center rounded-full p-0.5 shrink-0 transition-colors cursor-pointer ${
                      preferences.sales ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                        preferences.sales ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* System Toggle */}
                <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono mt-0.5">
                      SYS
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">Hệ thống & EventBus (System)</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        M05 EventBus - Nhật ký điều phối Outbox, EventRelay, cấu hình kênh.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onPreferencesChange({ ...preferences, system: !preferences.system })}
                    className={`w-10 h-6 flex items-center rounded-full p-0.5 shrink-0 transition-colors cursor-pointer ${
                      preferences.system ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                        preferences.system ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl flex gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-amber-900">Bảo toàn dữ liệu nghiệp vụ:</span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Việc tắt bộ lọc chỉ giúp ẩn cảnh báo ngoài màn hình để tránh phân tâm (alert fatigue). Mọi dữ liệu sự kiện vẫn được lưu vết bất biến trong Nhật ký EventBus thuộc hệ thống lõi để kiểm duyệt.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar & Action Options */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hành động nhanh</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onMarkAllAsRead}
                    disabled={unreadCount === 0}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100/50 disabled:opacity-50 disabled:pointer-events-none rounded transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Đọc tất cả</span>
                  </button>
                  <button
                    onClick={onClearAll}
                    disabled={notifications.length === 0}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 hover:text-red-600 disabled:opacity-50 disabled:pointer-events-none rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa hết</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrintNotifications}
                  disabled={filteredNotifications.length === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-50 text-[11px] font-bold rounded-lg transition-colors shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>In / Xuất PDF</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={filteredNotifications.length === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-50 text-[11px] font-bold rounded-lg transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Báo cáo CSV</span>
                </button>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="p-4 border-b border-slate-200 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm thông báo, phân hệ, mã..."
                  className="w-full pl-3 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    filter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                  }`}
                >
                  <span>Tất cả</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${filter === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-600'}`}>
                    {enabledNotifications.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilter('unread')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    filter === 'unread'
                      ? 'bg-rose-900 text-white shadow-xs'
                      : 'bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200/60'
                  }`}
                >
                  <span>Chưa đọc</span>
                  {unreadCount > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${filter === 'unread' ? 'bg-rose-800 text-rose-100' : 'bg-rose-200 text-rose-900'}`}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFilter('danger')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    filter === 'danger'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-red-50 hover:bg-red-100/80 text-red-700 border border-red-200'
                  }`}
                  title="Lọc thông báo Lỗi / Khẩn cấp"
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Khẩn cấp</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${filter === 'danger' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-800'}`}>
                    {dangerCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilter('warning')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    filter === 'warning'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200'
                  }`}
                  title="Lọc thông báo Rủi ro / SLA"
                >
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Cảnh báo</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${filter === 'warning' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-900'}`}>
                    {warningCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilter('success')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    filter === 'success'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200'
                  }`}
                  title="Lọc thông báo Hoàn tất"
                >
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>Thành công</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${filter === 'success' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                    {successCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilter('info')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    filter === 'info'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-50 hover:bg-blue-100/80 text-blue-700 border border-blue-200'
                  }`}
                  title="Lọc thông báo Thông tin"
                >
                  <Info className="w-3 h-3 shrink-0" />
                  <span>Thông tin</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${filter === 'info' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`}>
                    {infoCount}
                  </span>
                </button>
              </div>
            </div>

            {/* List of Notifications */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pb-12">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {search ? 'Không tìm thấy thông báo phù hợp.' : 'Hộp thư thông báo trống hoặc bị lọc ẩn.'}
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  let Icon = Info;
                  let iconBg = 'bg-blue-50 text-blue-700 border-blue-200';

                  if (notif.type === 'danger') {
                    Icon = AlertCircle;
                    iconBg = 'bg-red-50 text-red-700 border-red-200';
                  } else if (notif.type === 'warning') {
                    Icon = AlertTriangle;
                    iconBg = 'bg-amber-50 text-amber-700 border-amber-200';
                  } else if (notif.type === 'success') {
                    Icon = CheckCircle2;
                    iconBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  }

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-slate-50/60 transition-colors relative group ${
                        !notif.isRead ? 'bg-blue-50/15' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${iconBg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {notif.module}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!notif.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug">{notif.title}</h4>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">{notif.message}</p>

                          <div className="mt-2.5 flex items-center gap-2">
                            {!notif.isRead && (
                              <button
                                onClick={() => onMarkAsRead(notif.id)}
                                className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
                              >
                                Đánh dấu đã đọc
                              </button>
                            )}
                            {notif.link && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onNavigate(notif.link || '/');
                                }}
                                className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors flex items-center gap-1"
                              >
                                <span>Chi tiết</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNotification(notif.id);
                        }}
                        className="absolute right-3 top-3 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100/90 transition-all opacity-80 hover:opacity-100"
                        title="Thoát / Xóa cảnh báo này"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
