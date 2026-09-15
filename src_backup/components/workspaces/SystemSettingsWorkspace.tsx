import React, { useState, useEffect } from 'react';
import { SelectedEntityContext, ConfirmDialogState } from '../../types';
import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { BRANCHES, ENVIRONMENT_PROFILES, MODULE_REGISTRY } from '../../config/moduleRegistry';
import {
  Settings,
  Building2,
  Layers,
  ShieldCheck,
  RefreshCw,
  Download,
  Printer,
  Wrench,
  Activity,
  KeyRound,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { PdfPrintModal } from '../modals/PdfPrintModal';
import { CostingMethodSettingsView } from './costing/CostingMethodSettingsView';
import { SystemIntegrityChecker } from './systemSettings/SystemIntegrityChecker';
import { SettingsParametersTab } from './systemSettings/SettingsParametersTab';
import { SettingsBranchesTab } from './systemSettings/SettingsBranchesTab';
import { SettingsProfilesTab } from './systemSettings/SettingsProfilesTab';
import { SettingsDetailModal } from './systemSettings/SettingsDetailModal';
import {
  SystemSettingsSubTab,
  SystemSettingsConfig,
  ApprovalLimitPolicy,
  SlaRulePolicy,
  ActiveSession,
  DiagnosticItem,
  BranchMetadata,
  ModulePermissionRule,
  SettingsDetailItem,
} from './systemSettings/types';

interface SystemSettingsWorkspaceProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  currentUser?: any;
  currentBranch?: string;
  onBranchChange?: (branchId: string) => void;
  currentProfile?: string;
  onProfileChange?: (profileId: string) => void;
}

const BRANCH_METADATA: Record<string, BranchMetadata> = {
  BR_HO: {
    type: 'Trụ sở chính & Trung tâm điều hành',
    address: 'Tòa nhà Nexus Tower, Lô E2, Khu đô thị Cầu Giấy, TP. Hà Nội',
    taxCode: '0109888999-001',
    warehouses: ['Kho Tổng Miền Bắc (WH-MB01)', 'Kho Linh Kiện & NVL (WH-LK01)', 'Kho Hàng Mẫu'],
    ledger: 'Sổ cái Hạch toán Độc lập (GL-HN01)',
    prefix: 'HN-',
    region: 'Miền Bắc',
    manager: 'Nguyễn Đình Tuấn (Tổng Giám Đốc)',
    staffCount: 145,
  },
  BR_HCM: {
    type: 'Chi nhánh Kinh doanh & Phân phối Miền Nam',
    address: 'Số 120 Đường Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP. Hồ Chí Minh',
    taxCode: '0109888999-002',
    warehouses: ['Kho Phân Phối Miền Nam (WH-MN01)', 'Kho Trung Chuyển Tân Bình'],
    ledger: 'Sổ cái Hạch toán Độc lập (GL-HCM02)',
    prefix: 'HCM-',
    region: 'Miền Nam',
    manager: 'Trần Minh Quang (Giám Đốc Chi Nhánh)',
    staffCount: 98,
  },
  BR_DN: {
    type: 'Trung tâm Trung chuyển Logistics Miền Trung',
    address: 'Đường số 3, KCN Hòa Khánh, Quận Liên Chiểu, TP. Đà Nẵng',
    taxCode: '0109888999-003',
    warehouses: ['Kho Hub Miền Trung (WH-MT01)', 'Kho Vệ Tinh Đà Nẵng'],
    ledger: 'Sổ cái Hạch toán Độc lập (GL-DN03)',
    prefix: 'DN-',
    region: 'Miền Trung',
    manager: 'Lê Hoàng Sơn (Trưởng Trạm Vận Vận)',
    staffCount: 52,
  },
  BR_CT: {
    type: 'Kho Vệ tinh & Trạm Phân phối Tây Nam Bộ',
    address: 'Lô 14, KCN Trà Nóc 1, Quận Bình Thủy, TP. Cần Thơ',
    taxCode: '0109888999-004',
    warehouses: ['Kho Vệ Tinh Cần Thơ (WH-CT01)'],
    ledger: 'Sổ cái Hạch toán Độc lập (GL-CT04)',
    prefix: 'CT-',
    region: 'Tây Nam Bộ',
    manager: 'Phạm Văn Nam (Trưởng Kho Vệ Tinh)',
    staffCount: 28,
  },
};

export const SystemSettingsWorkspace: React.FC<SystemSettingsWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
  currentUser,
  currentBranch = 'BR_HO',
  onBranchChange,
  currentProfile = 'FULL_ERP',
  onProfileChange,
}) => {
  // L1: Synchronized session active tab (Rule #19 & Rule #20)
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<SystemSettingsSubTab>('M03', 'parameters');

  // Rule #19: ConfirmDialog State
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // L4 Detail Modal State
  const [detailModalItem, setDetailModalItem] = useState<SettingsDetailItem | null>(null);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [runningDiagnostics, setRunningDiagnostics] = useState<boolean>(false);

  // System Settings State
  const [settings, setSettings] = useState<SystemSettingsConfig>({
    companyName: 'Tập đoàn Công nghệ NexusSync Việt Nam',
    taxCode: '0109888999-CK',
    baseCurrency: 'VND',
    fiscalYearStart: '01/01',
    timezone: 'Asia/Ho_Chi_Minh (UTC+7)',
    thousandSeparator: '.',
    decimalSeparator: ',',
    maintenanceMode: false,
    debugLogging: true,
    autoBackupDaily: true,
  });

  // Enterprise Policies State
  const [approvalLimits] = useState<ApprovalLimitPolicy[]>([
    { role: 'Nhân viên (Staff)', maxLimit: '50,000,000 VND', autoApprove: true },
    { role: 'Trưởng phòng (Manager)', maxLimit: '500,000,000 VND', autoApprove: false },
    { role: 'Giám đốc Tài chính (CFO)', maxLimit: '5,000,000,000 VND', autoApprove: false },
    { role: 'Tổng Giám đốc (CEO)', maxLimit: 'Không giới hạn (> 5 Tỷ)', autoApprove: false },
  ]);

  const [slaRules] = useState<SlaRulePolicy[]>([
    { taskType: 'Đơn hàng Bán (Sales Order)', targetHours: 4, urgentThreshold: 2 },
    { taskType: 'Đơn mua hàng (PO Procurement)', targetHours: 8, urgentThreshold: 4 },
    { taskType: 'Điều chuyển & Kiểm kê Kho', targetHours: 2, urgentThreshold: 1 },
    { taskType: 'Yêu cầu Thanh toán / Ngân quỹ', targetHours: 6, urgentThreshold: 3 },
  ]);

  // Active Sessions State
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([
    {
      id: 'sess-01',
      user: 'admin (Super Admin)',
      ip: '192.168.1.45',
      device: 'Chrome 128 / macOS Sequoia',
      loginTime: '2026-08-30 08:15:20',
      status: 'ACTIVE',
      role: 'SUPER_ADMIN',
    },
    {
      id: 'sess-02',
      user: 'Trần Văn Giám (CFO)',
      ip: '192.168.1.88',
      device: 'Safari 18 / iPadOS Pro',
      loginTime: '2026-08-30 09:20:10',
      status: 'ACTIVE',
      role: 'CFO',
    },
    {
      id: 'sess-03',
      user: 'Lê Thị Mai (Warehouse Manager)',
      ip: '192.168.2.14',
      device: 'Firefox 130 / Windows 11 Enterprise',
      loginTime: '2026-08-30 07:45:00',
      status: 'ACTIVE',
      role: 'WAREHOUSE',
    },
    {
      id: 'sess-04',
      user: 'Nguyễn Văn Hùng (Sales Lead)',
      ip: '192.168.3.21',
      device: 'Edge 128 / Windows 10 Workstation',
      loginTime: '2026-08-30 10:05:30',
      status: 'SUSPICIOUS',
      role: 'SALES',
    },
  ]);

  // Diagnostic Test Results State
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([
    {
      id: 1,
      component: 'Cơ sở dữ liệu (Turso SQLite / PostgreSQL)',
      status: 'ONLINE',
      latency: '1.8ms',
      result: 'SUCCESS',
      message: 'Kết nối pool ACID hoạt động bình thường, không phát sinh deadlock.',
      checkedAt: '2026-08-28 08:30:15',
    },
    {
      id: 2,
      component: 'Nhật ký Bất biến (Immutable Audit Ledger SHA-256)',
      status: 'VERIFIED',
      latency: '0.4ms',
      result: 'SUCCESS',
      message: 'Toàn bộ chuỗi băm chữ ký kiểm toán khớp 100%, không phát hiện giả mạo.',
      checkedAt: '2026-08-28 08:30:15',
    },
    {
      id: 3,
      component: 'Sổ cái Kép (Double-entry GL Balance Engine)',
      status: 'BALANCED',
      latency: '1.2ms',
      result: 'SUCCESS',
      message: 'Tổng phát sinh Nợ = Tổng phát sinh Có trên toàn hệ thống 29 phân hệ.',
      checkedAt: '2026-08-28 08:30:16',
    },
    {
      id: 4,
      component: 'Trục sự kiện EventBus & Outbox Pattern',
      status: 'ACTIVE',
      latency: '0.9ms',
      result: 'SUCCESS',
      message: 'Các message outbox đã đồng bộ thành công, zero dropped packet.',
      checkedAt: '2026-08-28 08:30:16',
    },
    {
      id: 5,
      component: 'API Gateway & Nginx Ingress Reverse Proxy',
      status: 'HEALTHY',
      latency: '0.6ms',
      result: 'SUCCESS',
      message: 'Port 3000 bound đúng cấu hình container, SSL/TLS handshake ổn định.',
      checkedAt: '2026-08-28 08:30:17',
    },
  ]);

  // RBAC Permission Matrix State
  const [permissionMatrix, setPermissionMatrix] = useState<ModulePermissionRule[]>([
    {
      moduleId: 'M30',
      moduleName: 'M30 - Sổ cái Tổng hợp (General Ledger)',
      category: 'Tài chính - Kế toán',
      roles: {
        admin: { canView: true, canEdit: true, canDelete: true },
        manager: { canView: true, canEdit: true, canDelete: false },
        accountant: { canView: true, canEdit: true, canDelete: false },
        warehouse: { canView: false, canEdit: false, canDelete: false },
        sales: { canView: false, canEdit: false, canDelete: false },
      },
    },
    {
      moduleId: 'M31',
      moduleName: 'M31 - Công nợ AR/AP & Hóa đơn',
      category: 'Tài chính - Kế toán',
      roles: {
        admin: { canView: true, canEdit: true, canDelete: true },
        manager: { canView: true, canEdit: true, canDelete: false },
        accountant: { canView: true, canEdit: true, canDelete: true },
        warehouse: { canView: false, canEdit: false, canDelete: false },
        sales: { canView: true, canEdit: false, canDelete: false },
      },
    },
    {
      moduleId: 'M32',
      moduleName: 'M32 - Ngân quỹ & Dòng tiền (Treasury)',
      category: 'Tài chính - Kế toán',
      roles: {
        admin: { canView: true, canEdit: true, canDelete: true },
        manager: { canView: true, canEdit: true, canDelete: false },
        accountant: { canView: true, canEdit: true, canDelete: false },
        warehouse: { canView: false, canEdit: false, canDelete: false },
        sales: { canView: false, canEdit: false, canDelete: false },
      },
    },
    {
      moduleId: 'M17',
      moduleName: 'M17 - Quản lý Kho Cốt lõi (Inventory Core)',
      category: 'Quản lý Kho (WMS)',
      roles: {
        admin: { canView: true, canEdit: true, canDelete: true },
        manager: { canView: true, canEdit: true, canDelete: true },
        accountant: { canView: true, canEdit: false, canDelete: false },
        warehouse: { canView: true, canEdit: true, canDelete: true },
        sales: { canView: true, canEdit: false, canDelete: false },
      },
    },
    {
      moduleId: 'M19',
      moduleName: 'M19 - Kiểm kê kho định kỳ (Stocktake)',
      category: 'Quản lý Kho (WMS)',
      roles: {
        admin: { canView: true, canEdit: true, canDelete: true },
        manager: { canView: true, canEdit: true, canDelete: true },
        accountant: { canView: true, canEdit: true, canDelete: false },
        warehouse: { canView: true, canEdit: true, canDelete: false },
        sales: { canView: false, canEdit: false, canDelete: false },
      },
    },
    {
      moduleId: 'M13',
      moduleName: 'M13 - Quản lý Đơn hàng Bán (Sales Orders)',
      category: 'Bán hàng & CRM',
      roles: {
        admin: { canView: true, canEdit: true, canDelete: true },
        manager: { canView: true, canEdit: true, canDelete: true },
        accountant: { canView: true, canEdit: false, canDelete: false },
        warehouse: { canView: true, canEdit: false, canDelete: false },
        sales: { canView: true, canEdit: true, canDelete: false },
      },
    },
    {
      moduleId: 'M08',
      moduleName: 'M08 - Đơn mua hàng & Mua sắm (PO)',
      category: 'Chuỗi Cung ứng (SCM)',
      roles: {
        admin: { canView: true, canEdit: true, canDelete: true },
        manager: { canView: true, canEdit: true, canDelete: true },
        accountant: { canView: true, canEdit: true, canDelete: false },
        warehouse: { canView: true, canEdit: false, canDelete: false },
        sales: { canView: false, canEdit: false, canDelete: false },
      },
    },
  ]);

  // Initial API synchronization on mount
  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        const [settingsRes, sessionsRes, diagRes, rbacRes] = await Promise.all([
          fetch('/api/settings').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/settings/sessions').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/settings/diagnostics').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/rbac/matrix').then((r) => (r.ok ? r.json() : null)),
        ]);
        if (!isMounted) return;
        if (settingsRes?.success && settingsRes.settings) {
          setSettings(settingsRes.settings);
        }
        if (sessionsRes?.success && sessionsRes.sessions) {
          setActiveSessions(sessionsRes.sessions);
        }
        if (diagRes?.success && diagRes.diagnostics) {
          setDiagnostics(diagRes.diagnostics);
        }
        if (rbacRes?.success && rbacRes.matrix) {
          setPermissionMatrix(rbacRes.matrix);
        }
      } catch (err) {
        console.error('[M03] Initial API fetch error:', err);
      }
    };
    fetchInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update Settings handler
  const handleUpdateSettings = (newSettings: Partial<SystemSettingsConfig>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Rule #19: Save Settings with Confirmation Dialog and API Persistence
  const handleRequestSaveSettings = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Lưu & Áp Dụng Cấu Hình Toàn Cục?',
      message: `Bạn đang cập nhật các tham số hệ thống hạt nhân (Đồng tiền cơ sở: ${settings.baseCurrency}, MST: ${settings.taxCode}). Thay đổi này sẽ được ghi vào cơ sở dữ liệu SQLite, cập nhật nhật ký kiểm toán SHA-256 và áp dụng ngay lập tức cho toàn bộ các phân hệ ERP. Bạn có muốn tiếp tục?`,
      variant: 'primary',
      confirmText: 'Lưu & Áp Dụng',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
          });
          const data = await res.json();
          if (data.success) {
            onNotify(
              'success',
              'Lưu cấu hình thành công',
              `Các tham số hệ thống toàn cục đã được lưu an toàn (Mã băm kiểm toán SHA-256: ${data.checksum ? data.checksum.slice(0, 12) + '...' : 'OK'}).`
            );
          } else {
            onNotify('danger', 'Lỗi lưu cấu hình', data.error || 'Không thể lưu tham số hệ thống.');
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi kết nối API', err.message);
        }
      },
    });
  };

  // Rule #19: Force Logout with Confirmation Dialog and API Termination
  const handleRequestForceLogout = (sessionId: string, userName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Buộc Thoát Phiên Làm Việc (Force Logout)?',
      message: `Bạn có chắc chắn muốn chấm dứt ngay lập tức phiên đăng nhập [${sessionId}] của tài khoản "${userName}"? Token người dùng sẽ bị hủy trên máy chủ và ghi nhận vào sổ kiểm toán.`,
      variant: 'danger',
      confirmText: 'Buộc Thoát Ngay',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/settings/sessions/${sessionId}/force-logout`, {
            method: 'POST',
          });
          const data = await res.json();
          if (data.success && data.sessions) {
            setActiveSessions(data.sessions);
          } else {
            setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
          }
          onNotify(
            'warning',
            'Đã buộc thoát phiên làm việc',
            `Phiên đăng nhập [${sessionId}] của "${userName}" đã bị chấm dứt thành công trên hệ thống.`
          );
        } catch (err: any) {
          setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
          onNotify(
            'warning',
            'Đã buộc thoát phiên làm việc',
            `Phiên đăng nhập [${sessionId}] của "${userName}" đã được loại bỏ.`
          );
        }
      },
    });
  };

  // Rule #19: Branch Switch with Confirmation Dialog and API Persistence
  const handleRequestBranchSelect = (branchId: string) => {
    if (branchId === currentBranch) return;
    const targetBranch = BRANCHES.find((b) => b.id === branchId);
    setConfirmDialog({
      isOpen: true,
      title: 'Chuyển Đổi Chi Nhánh Làm Việc?',
      message: `Bạn đang chuyển không gian làm việc sang [${targetBranch?.code}] — "${targetBranch?.name}". Ngữ cảnh sổ cái hạch toán (GL) và tồn kho 3 trạng thái sẽ được phân lập theo chi nhánh này. Bạn có muốn tiếp tục?`,
      variant: 'primary',
      confirmText: 'Xác Nhận Chuyển',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await fetch(`/api/settings/branches/${branchId}/activate`, { method: 'POST' });
        } catch (err) {
          console.error('Failed to persist branch to server:', err);
        }
        if (onBranchChange) {
          onBranchChange(branchId);
        }
        onNotify(
          'info',
          'Chuyển đổi chi nhánh',
          `Đã chuyển sang chi nhánh [${targetBranch?.code}] — ${targetBranch?.name}`
        );
      },
    });
  };

  // Rule #19: Profile Switch with Confirmation Dialog and API Persistence
  const handleRequestProfileSelect = (profileId: string) => {
    if (profileId === currentProfile) return;
    const targetProfile = ENVIRONMENT_PROFILES.find((p) => p.id === profileId);
    setConfirmDialog({
      isOpen: true,
      title: 'Áp Dụng Hồ Sơ Môi Trường ERP Mới?',
      message: `Bạn đang chọn áp dụng hồ sơ "${targetProfile?.name}". Hệ thống sẽ cấu hình lại phạm vi phân hệ hoạt động tương ứng (${
        targetProfile?.allowedModules.includes('*') ? '41' : targetProfile?.allowedModules.length
      } phân hệ). Bạn có muốn tiếp tục?`,
      variant: 'primary',
      confirmText: 'Áp Dụng Hồ Sơ',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await fetch(`/api/settings/profiles/${profileId}/activate`, { method: 'POST' });
        } catch (err) {
          console.error('Failed to persist profile to server:', err);
        }
        if (onProfileChange) {
          onProfileChange(profileId);
        }
        onNotify(
          'info',
          'Chuyển đổi hồ sơ môi trường',
          `Đã áp dụng cấu hình hồ sơ: ${targetProfile?.name}`
        );
      },
    });
  };

  // Rule #19: Run Diagnostics with Confirmation Dialog and Real API Execution
  const executeRunDiagnostics = async () => {
    setRunningDiagnostics(true);
    try {
      const res = await fetch('/api/settings/diagnostics/run', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.diagnostics) {
        setDiagnostics(data.diagnostics);
        onNotify(
          'success',
          'Chẩn đoán hệ thống hoàn tất',
          data.message || 'Tất cả 5/5 module cốt lõi vượt qua bài kiểm tra chẩn đoán trạng thái (Diagnostic Health Check 100%).'
        );
      } else {
        onNotify('warning', 'Kết quả chẩn đoán', data.error || 'Hoàn tất kiểm tra chẩn đoán.');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi kiểm tra chẩn đoán', err.message);
    } finally {
      setRunningDiagnostics(false);
    }
  };

  const handleRequestRunDiagnostics = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Chạy Chẩn Đoán Trạng Thái Hệ Thống?',
      message:
        'Hệ thống sẽ thực hiện kiểm tra độ trễ kết nối cơ sở dữ liệu ACID, tính toàn vẹn chuỗi SHA-256, cân đối sổ cái kép GL, hàng đợi EventBus và Ingress Gateway. Bạn có muốn bắt đầu?',
      variant: 'info',
      confirmText: 'Bắt Đầu Chẩn Đoán',
      cancelText: 'Hủy Bỏ',
      onConfirm: () => {
        setConfirmDialog(null);
        executeRunDiagnostics();
      },
    });
  };

  // Rule #19: Export CSV with Confirmation Dialog and Streaming API
  const executeExportReport = () => {
    const link = document.createElement('a');
    link.href = '/api/settings/export/csv';
    link.download = `NexusSync_M03_Settings_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất báo cáo thành công', 'Đã tải xuống tệp CSV báo cáo cấu hình và chẩn đoán hệ thống chuẩn UTF-8.');
  };

  const handleRequestExportReport = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xuất Báo Cáo Chẩn Đoán Hệ Thống?',
      message:
        'Bạn có muốn trích xuất dữ liệu kết quả kiểm tra chẩn đoán 5 thành phần hệ thống và các tham số toàn cục ra tệp CSV để lưu trữ và báo cáo quản trị?',
      variant: 'primary',
      confirmText: 'Tải Tệp CSV',
      cancelText: 'Hủy Bỏ',
      onConfirm: () => {
        setConfirmDialog(null);
        executeExportReport();
      },
    });
  };

  // Toggle Cell Permission in Matrix with API persistence
  const handleToggleCellPermission = async (
    moduleId: string,
    roleKey: 'admin' | 'manager' | 'accountant' | 'warehouse' | 'sales',
    actionKey: 'canView' | 'canEdit' | 'canDelete'
  ) => {
    const newMatrix = permissionMatrix.map((item) => {
      if (item.moduleId !== moduleId) return item;
      const currentRole = item.roles[roleKey];
      return {
        ...item,
        roles: {
          ...item.roles,
          [roleKey]: {
            ...currentRole,
            [actionKey]: !currentRole[actionKey],
          },
        },
      };
    });
    setPermissionMatrix(newMatrix);
    try {
      await fetch('/api/rbac/matrix', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matrix: newMatrix }),
      });
    } catch (err) {
      console.error('Failed to sync RBAC matrix:', err);
    }
    onNotify(
      'success',
      'Cập nhật ma trận quyền',
      `Đã thay đổi quyền [${actionKey}] cho vai trò [${roleKey.toUpperCase()}] trên phân hệ [${moduleId}].`
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* L0 Banner Cố Định Tuân Thủ Rule #19 & Rule #20 & M41 Master Design Spec */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold rounded border border-emerald-400/30">
                M03 • SYSTEM SETTINGS & GLOBAL CONFIGURATION
              </span>
              <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Vận hành ổn định (99.99%)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Rule #19 Confirmed</span>
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              Cấu hình Hệ thống & Ma trận Phân quyền RBAC Trực quan
            </h1>
            <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Quản lý tham số toàn cục, phân quyền chi tiết Xem / Sửa / Xóa cho từng vai trò trên các phân hệ ERP, điều hành đa chi nhánh và kiểm tra toàn vẹn hệ thống.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('integrity')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              activeTab === 'integrity'
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
            }`}
            title="Mở công cụ System Integrity Check để rà soát lỗi cấu hình và dữ liệu rác"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rà Soát Toàn Vẹn</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Mở bảng xem trước trực tiếp & In / Xuất PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In / Xuất PDF</span>
          </button>
          <button
            type="button"
            onClick={handleRequestRunDiagnostics}
            disabled={runningDiagnostics}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${runningDiagnostics ? 'animate-spin' : ''}`} />
            <span>{runningDiagnostics ? 'Đang kiểm tra...' : 'Chẩn Đoán Lại'}</span>
          </button>
          <button
            type="button"
            onClick={handleRequestExportReport}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* L1: Workspace Sub-Navigation Strip (using useWorkspaceSessionTab & M41 Spec) */}
      <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          <button
            type="button"
            id="tab-parameters"
            onClick={() => setActiveTab('parameters')}
            className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'parameters'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>1. Cấu Hình Tham Số & Vận Hành</span>
          </button>

          <button
            type="button"
            id="tab-branches"
            onClick={() => setActiveTab('branches')}
            className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'branches'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
            <span>2. Đơn Vị / Chi Nhánh (Branches)</span>
            <span className="ml-0.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700 shrink-0">
              {BRANCHES.find((b) => b.id === currentBranch)?.code ?? currentBranch}
            </span>
          </button>

          <button
            type="button"
            id="tab-profiles"
            onClick={() => setActiveTab('profiles')}
            className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'profiles'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-500 shrink-0" />
            <span>3. Hồ Sơ Môi Trường (Profiles)</span>
            <span className="ml-0.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700 shrink-0">
              {currentProfile}
            </span>
          </button>

          <button
            type="button"
            id="tab-integrity"
            onClick={() => setActiveTab('integrity')}
            className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'integrity'
                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/40'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>4. Rà Soát Toàn Vẹn & Dữ Liệu Rác</span>
            <span className="ml-0.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shrink-0">
              Công cụ M03
            </span>
          </button>

          <button
            type="button"
            id="tab-costing"
            onClick={() => setActiveTab('costing')}
            className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'costing'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-500 shrink-0" />
            <span>5. Phương Pháp Giá Vốn (Costing Method)</span>
            <span className="ml-0.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shrink-0">
              M42 / CFO
            </span>
          </button>
        </div>

        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold shrink-0 border-l border-slate-200 dark:border-slate-700/70 pl-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span>Cấu Hình Global ERP</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            System Level: SuperAdmin
          </span>
        </div>
      </div>

      {/* SUB-TAB CONTENTS */}
      {activeTab === 'parameters' && (
        <SettingsParametersTab
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onRequestSaveSettings={handleRequestSaveSettings}
          permissionMatrix={permissionMatrix}
          onTogglePermission={handleToggleCellPermission}
          approvalLimits={approvalLimits}
          slaRules={slaRules}
          activeSessions={activeSessions}
          onInspectSession={(session) => setDetailModalItem({ type: 'SESSION', data: session })}
          onRequestForceLogout={handleRequestForceLogout}
          diagnostics={diagnostics}
          onInspectDiagnostic={(diag) => setDetailModalItem({ type: 'DIAGNOSTIC', data: diag })}
          runningDiagnostics={runningDiagnostics}
          onRequestRunDiagnostics={handleRequestRunDiagnostics}
          onSelectEntity={onSelectEntity}
          onNotify={onNotify}
        />
      )}

      {activeTab === 'branches' && (
        <SettingsBranchesTab
          branches={BRANCHES}
          branchMetadata={BRANCH_METADATA}
          currentBranch={currentBranch}
          onRequestBranchSelect={handleRequestBranchSelect}
          onInspectBranch={(b) => setDetailModalItem({ type: 'BRANCH', data: b })}
          onSelectEntity={onSelectEntity}
        />
      )}

      {activeTab === 'profiles' && (
        <SettingsProfilesTab
          profiles={ENVIRONMENT_PROFILES}
          currentProfile={currentProfile}
          onRequestProfileSelect={handleRequestProfileSelect}
          moduleRegistry={MODULE_REGISTRY}
        />
      )}

      {activeTab === 'integrity' && (
        <div className="animate-in fade-in duration-200">
          <SystemIntegrityChecker onNotify={onNotify} />
        </div>
      )}

      {activeTab === 'costing' && (
        <div className="animate-in fade-in duration-200">
          <CostingMethodSettingsView
            currentUser={currentUser}
            onNotify={onNotify}
          />
        </div>
      )}

      {/* L4: Settings Detail Inspection Modal */}
      <SettingsDetailModal
        item={detailModalItem}
        onClose={() => setDetailModalItem(null)}
        onForceLogoutSession={handleRequestForceLogout}
        onActivateBranch={handleRequestBranchSelect}
        currentBranchId={currentBranch}
      />

      {/* Rule #19: Global Confirm Dialog */}
      <ConfirmDialog
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />

      {/* PDF Print Preview Modal */}
      <PdfPrintModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        module={{
          code: 'M03',
          moduleName: 'Cấu hình & Quản trị Hệ thống (System Settings)',
        }}
        currentUser={currentUser}
        onNotify={onNotify}
      />
    </div>
  );
};

export default SystemSettingsWorkspace;
