import React, { useState, useMemo } from 'react';
import {
  Settings,
  KeyRound,
  Search,
  Filter,
  Coins,
  FileCode,
  ShieldCheck,
  Server,
  Users,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Activity,
  ShieldAlert,
  Eye,
} from 'lucide-react';
import { EnterpriseTable, ColumnDef } from '../../../../components/common/EnterpriseTable';
import {
  SystemSettingsConfig,
  ModulePermissionRule,
  ApprovalLimitPolicy,
  SlaRulePolicy,
  ActiveSession,
  DiagnosticItem,
} from './types';
import { SelectedEntityContext } from '../../../../types';

interface SettingsParametersTabProps {
  settings: SystemSettingsConfig;
  onUpdateSettings: (newSettings: Partial<SystemSettingsConfig>) => void;
  onRequestSaveSettings: () => void;
  permissionMatrix: ModulePermissionRule[];
  onTogglePermission: (
    moduleId: string,
    roleKey: 'admin' | 'manager' | 'accountant' | 'warehouse' | 'sales',
    actionKey: 'canView' | 'canEdit' | 'canDelete'
  ) => void;
  approvalLimits: ApprovalLimitPolicy[];
  slaRules: SlaRulePolicy[];
  activeSessions: ActiveSession[];
  onInspectSession: (session: ActiveSession) => void;
  onRequestForceLogout: (sessionId: string, userName: string) => void;
  diagnostics: DiagnosticItem[];
  onInspectDiagnostic: (diag: DiagnosticItem) => void;
  runningDiagnostics: boolean;
  onRequestRunDiagnostics: () => void;
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const SettingsParametersTab: React.FC<SettingsParametersTabProps> = ({
  settings,
  onUpdateSettings,
  onRequestSaveSettings,
  permissionMatrix,
  onTogglePermission,
  approvalLimits,
  slaRules,
  activeSessions,
  onInspectSession,
  onRequestForceLogout,
  diagnostics,
  onInspectDiagnostic,
  runningDiagnostics,
  onRequestRunDiagnostics,
  onSelectEntity,
  onNotify,
}) => {
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState<string>('ALL');
  const [sessionSearch, setSessionSearch] = useState<string>('');
  const [sessionStatusFilter, setSessionStatusFilter] = useState<string>('ALL');

  const filteredMatrix = permissionMatrix.filter((item) => {
    const matchesSearch =
      item.moduleName.toLowerCase().includes(matrixSearch.toLowerCase()) ||
      item.moduleId.toLowerCase().includes(matrixSearch.toLowerCase());
    const matchesCategory =
      matrixCategoryFilter === 'ALL' || item.category === matrixCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredSessions = activeSessions.filter((s) => {
    const matchesSearch =
      s.user.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      s.ip.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      s.role.toLowerCase().includes(sessionSearch.toLowerCase());
    const matchesStatus =
      sessionStatusFilter === 'ALL' || s.status === sessionStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const sessionColumns: ColumnDef[] = useMemo(
    () => [
      {
        key: 'user',
        header: 'Người dùng & Vai trò',
        width: 220,
        render: (row: ActiveSession) => (
          <div className="space-y-0.5">
            <div className="font-semibold text-slate-900 dark:text-white">{row.user}</div>
            <div className="text-[10px] font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-700 inline-block font-semibold">
              Role: {row.role}
            </div>
          </div>
        ),
      },
      {
        key: 'ip',
        header: 'Địa chỉ IP Ingress',
        width: 140,
        render: (row: ActiveSession) => (
          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
            {row.ip}
          </span>
        ),
      },
      {
        key: 'device',
        header: 'Thiết bị & Nền tảng',
        width: 170,
        render: (row: ActiveSession) => (
          <span className="text-slate-700 dark:text-slate-300 font-medium text-xs truncate block max-w-[160px]" title={row.device}>
            {row.device}
          </span>
        ),
      },
      {
        key: 'loginTime',
        header: 'Thời gian đăng nhập',
        width: 160,
        render: (row: ActiveSession) => (
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {row.loginTime}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Trạng thái',
        width: 130,
        render: (row: ActiveSession) => (
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border font-mono tabular-nums ${
              row.status === 'SUSPICIOUS'
                ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700'
                : 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
            }`}
          >
            {row.status === 'SUSPICIOUS' ? 'Cần chú ý' : 'Hoạt động'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Thao tác bảo mật',
        width: 190,
        className: 'text-right',
        render: (row: ActiveSession) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInspectSession(row);
                onSelectEntity({
                  type: 'M03_SESSION',
                  id: row.id,
                  code: row.id,
                  title: row.user,
                  subtitle: `IP: ${row.ip} | Role: ${row.role}`,
                  status: row.status,
                  module: 'M03',
                  data: row,
                });
              }}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-600"
              title="Xem chi tiết phiên làm việc"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestForceLogout(row.id, row.user);
              }}
              className="px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
              title="Ngắt kết nối phiên làm việc của người dùng này"
            >
              Buộc thoát (Force)
            </button>
          </div>
        ),
      },
    ],
    [onInspectSession, onSelectEntity, onRequestForceLogout]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Parameters & Permission Matrix & Active Sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form: Global System Parameters */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Tham số Cấu hình Toàn cục (Global System Parameters)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Áp dụng đồng bộ cho toàn bộ 29 phân hệ và sổ cái đa chi nhánh
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-950 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Đồng bộ realtime
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên Doanh nghiệp / Tập đoàn
                  </label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => onUpdateSettings({ companyName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã số thuế / MST
                  </label>
                  <input
                    type="text"
                    value={settings.taxCode}
                    onChange={(e) => onUpdateSettings({ taxCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Địa chỉ Đăng ký Kinh doanh & Xuất Hóa đơn
                  </label>
                  <input
                    type="text"
                    value={settings.companyAddress || 'Tòa nhà Nexus Tower, Lô E2 Khu đô thị Cầu Giấy, TP. Hà Nội'}
                    onChange={(e) => onUpdateSettings({ companyAddress: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="Địa chỉ trụ sở chính..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Thông tin Đơn vị Phát hành Hóa đơn VAT (M31 Issuer)
                  </label>
                  <input
                    type="text"
                    value={settings.invoiceIssuerInfo || 'Tập đoàn Công nghệ NexusSync Việt Nam - Hotline: 1900 8899'}
                    onChange={(e) => onUpdateSettings({ invoiceIssuerInfo: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="Hotline / Người đại diện pháp luật..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Đồng tiền Cơ sở (Base Currency)
                  </label>
                  <select
                    value={settings.baseCurrency}
                    onChange={(e) => onUpdateSettings({ baseCurrency: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  >
                    <option value="VND">VND (Việt Nam Đồng)</option>
                    <option value="USD">USD (Đô la Mỹ)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dấu Phân Cách Hàng Nghìn
                  </label>
                  <select
                    value={settings.thousandSeparator}
                    onChange={(e) => onUpdateSettings({ thousandSeparator: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  >
                    <option value=".">Dấu chấm (.) [Ví dụ: 25.450.000]</option>
                    <option value=",">Dấu phẩy (,) [Ví dụ: 25,450,000]</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dấu Phân Cách Thập Phân
                  </label>
                  <select
                    value={settings.decimalSeparator}
                    onChange={(e) => onUpdateSettings({ decimalSeparator: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  >
                    <option value=",">Dấu phẩy (,) [Ví dụ: 172,30]</option>
                    <option value=".">Dấu chấm (.) [Ví dụ: 172.30]</option>
                  </select>
                </div>
              </div>

              {/* REGIONAL FORMATS & ROUNDING RULES */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>Quy Tắc Làm Tròn Số Học & Định Dạng Khu Vực (Enterprise Rounding)</span>
                  <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    Rule #03 Accounting Authority
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Thập phân Số Tiền
                    </label>
                    <select
                      value={settings.currencyDecimals ?? 0}
                      onChange={(e) => onUpdateSettings({ currencyDecimals: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-center font-bold"
                    >
                      <option value={0}>0 (VND chuẩn)</option>
                      <option value={2}>2 (Ngoại tệ USD/EUR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Thập phân Đơn Giá
                    </label>
                    <select
                      value={settings.unitPriceDecimals ?? 2}
                      onChange={(e) => onUpdateSettings({ unitPriceDecimals: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-center font-bold"
                    >
                      <option value={0}>0 chữ số</option>
                      <option value={2}>2 chữ số</option>
                      <option value={4}>4 chữ số (Chi phí BOM)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Thập phân Số Lượng
                    </label>
                    <select
                      value={settings.quantityDecimals ?? 2}
                      onChange={(e) => onUpdateSettings({ quantityDecimals: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-center font-bold"
                    >
                      <option value={0}>0 chữ số (Nguyên chiếc)</option>
                      <option value={2}>2 chữ số (Kg/Mét)</option>
                      <option value={3}>3 chữ số (Tấn/Gram)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Phương Thức Làm Tròn
                    </label>
                    <select
                      value={settings.roundingMethod || 'HALF_UP'}
                      onChange={(e) => onUpdateSettings({ roundingMethod: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    >
                      <option value="HALF_UP">Làm tròn 0.5 (HALF_UP)</option>
                      <option value="FLOOR">Làm tròn xuống (FLOOR)</option>
                      <option value="CEIL">Làm tròn lên (CEIL)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Định Dạng Ngày Tháng
                    </label>
                    <select
                      value={settings.dateFormat || 'DD/MM/YYYY'}
                      onChange={(e) => onUpdateSettings({ dateFormat: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (Việt Nam chuẩn)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO chuẩn)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US format)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Múi Giờ Hệ Thống
                    </label>
                    <input
                      type="text"
                      disabled
                      value={settings.timezone || 'Asia/Ho_Chi_Minh (UTC+7)'}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Thời Hạn Công Nợ Mặc Định
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={365}
                        value={settings.defaultPaymentTermDays ?? 30}
                        onChange={(e) => onUpdateSettings({ defaultPaymentTermDays: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-center font-bold"
                      />
                      <span className="text-xs text-slate-500 shrink-0 font-medium">ngày</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-6 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.debugLogging}
                      onChange={(e) => onUpdateSettings({ debugLogging: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Nhật ký Debug chi tiết
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.autoBackupDaily}
                      onChange={(e) => onUpdateSettings({ autoBackupDaily: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Tự động sao lưu hàng ngày (02:00 AM)
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={onRequestSaveSettings}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Cấu Hình Toàn Cục</span>
                </button>
              </div>
            </div>
          </div>

          {/* PERMISSION MATRIX SECTION */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Ma trận Phân quyền Truy cập (RBAC Permission Matrix)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Bấm vào ô để bật/tắt quyền Xem (V), Sửa (E), Xóa (D) tức thì cho từng vai trò
                  </p>
                </div>
              </div>

              {/* L2 Filter Bar for RBAC Matrix */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={matrixSearch}
                    onChange={(e) => setMatrixSearch(e.target.value)}
                    placeholder="Tìm mã hoặc tên phân hệ..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <select
                  value={matrixCategoryFilter}
                  onChange={(e) => setMatrixCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="ALL">Tất cả phân hệ ({permissionMatrix.length})</option>
                  <option value="Tài chính - Kế toán">Tài chính - Kế toán</option>
                  <option value="Quản lý Kho (WMS)">Quản lý Kho (WMS)</option>
                  <option value="Bán hàng & CRM">Bán hàng & CRM</option>
                  <option value="Chuỗi Cung ứng (SCM)">Chuỗi Cung ứng (SCM)</option>
                </select>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="px-4 py-2.5 font-bold text-[11px] uppercase tracking-wider">
                      Phân hệ / Module ERP
                    </th>
                    <th className="px-3 py-2.5 font-bold text-[11px] text-center border-l border-slate-800">
                      Admin Quản trị
                    </th>
                    <th className="px-3 py-2.5 font-bold text-[11px] text-center border-l border-slate-800">
                      Quản lý Kho / Ban
                    </th>
                    <th className="px-3 py-2.5 font-bold text-[11px] text-center border-l border-slate-800">
                      Kế toán Tổng hợp
                    </th>
                    <th className="px-3 py-2.5 font-bold text-[11px] text-center border-l border-slate-800">
                      Nhân viên Kho
                    </th>
                    <th className="px-3 py-2.5 font-bold text-[11px] text-center border-l border-slate-800">
                      Nhân viên Kinh doanh
                    </th>
                  </tr>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-1 text-slate-500 dark:text-slate-400 font-normal">
                      Quy ước: (V: Xem | E: Sửa | D: Xóa)
                    </th>
                    {(['admin', 'manager', 'accountant', 'warehouse', 'sales'] as const).map((role) => (
                      <th key={role} className="px-2 py-1 text-center border-l border-slate-200 dark:border-slate-700">
                        <span className="text-blue-700 dark:text-blue-400 font-bold">V / E / D</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredMatrix.map((item) => (
                    <tr key={item.moduleId} className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                            {item.moduleId}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">{item.moduleName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-400 font-mono mt-0.5 pl-8">
                          {item.category}
                        </div>
                      </td>

                      {(['admin', 'manager', 'accountant', 'warehouse', 'sales'] as const).map((roleKey) => {
                        const cell = item.roles[roleKey];
                        return (
                          <td key={roleKey} className="px-3 py-3 text-center border-l border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-center gap-1">
                              {/* View toggle */}
                              <button
                                type="button"
                                onClick={() => onTogglePermission(item.moduleId, roleKey, 'canView')}
                                title={`Quyền Xem (View) - ${roleKey.toUpperCase()}`}
                                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono transition-all cursor-pointer ${
                                  cell.canView
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                              >
                                V
                              </button>

                              {/* Edit toggle */}
                              <button
                                type="button"
                                onClick={() => onTogglePermission(item.moduleId, roleKey, 'canEdit')}
                                title={`Quyền Sửa (Edit) - ${roleKey.toUpperCase()}`}
                                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono transition-all cursor-pointer ${
                                  cell.canEdit
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                              >
                                E
                              </button>

                              {/* Delete toggle */}
                              <button
                                type="button"
                                onClick={() => onTogglePermission(item.moduleId, roleKey, 'canDelete')}
                                title={`Quyền Xóa (Delete) - ${roleKey.toUpperCase()}`}
                                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono transition-all cursor-pointer ${
                                  cell.canDelete
                                    ? 'bg-rose-600 text-white shadow-2xs'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                              >
                                D
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-600"></span> V: Xem dữ liệu
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-blue-600"></span> E: Thêm/Sửa chứng từ
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-rose-600"></span> D: Xóa / Hủy bỏ
                </span>
              </div>
              <span className="font-mono text-slate-400">
                Hiển thị {filteredMatrix.length}/{permissionMatrix.length} phân hệ
              </span>
            </div>
          </div>

          {/* Exchange Rates & Numbering Rules Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  Tỷ giá Ngoại tệ Quy đổi (Đồng tiền gốc: VND)
                </h4>
              </div>
              <div className="space-y-2 text-xs font-mono tabular-nums">
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">1 USD =</span>
                  <span className="text-slate-900 dark:text-white font-bold">25,450.00 VND</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">1 EUR =</span>
                  <span className="text-slate-900 dark:text-white font-bold">27,800.50 VND</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">1 JPY =</span>
                  <span className="text-slate-900 dark:text-white font-bold">172.30 VND</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  Quy tắc Sinh mã Chứng từ Tự động
                </h4>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Đơn hàng Bán (SO):</span>
                  <span className="text-blue-700 dark:text-blue-400 font-bold">SO-YYYY-#####</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Lệnh Sản xuất (MO):</span>
                  <span className="text-blue-700 dark:text-blue-400 font-bold">MO-YYYY-#####</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Kiểm kê / Điều chuyển:</span>
                  <span className="text-blue-700 dark:text-blue-400 font-bold">ADJ/TR-YYYY-#####</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enterprise Policies: Approval Limits & SLA Routing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    Hạn mức Phê duyệt (Maker-Checker Limits)
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-700 font-bold">
                  Rule #03
                </span>
              </div>
              <div className="space-y-2">
                {approvalLimits.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{item.role}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                        Tối đa: {item.maxLimit}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded border font-mono ${
                        item.autoApprove
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                          : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {item.autoApprove ? 'Tự động duyệt' : 'Cần phê duyệt'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    Cam kết SLA Tác vụ Vận hành
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-amber-950 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 font-bold">
                  Thời gian
                </span>
              </div>
              <div className="space-y-2">
                {slaRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{rule.taskType}</span>
                    <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 font-bold">
                        Chuẩn: {rule.targetHours}h
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700 font-bold">
                        Khẩn: &lt; {rule.urgentThreshold}h
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Sessions Management with Rule #19 Force Logout */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    Quản lý Phiên Đăng nhập Đang hoạt động (Active Sessions)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Giám sát kết nối và Buộc thoát (Force Logout qua ConfirmDialog) khi phát hiện bất thường
                  </p>
                </div>
              </div>

              {/* L2 Filter for Sessions */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-40">
                  <Search className="absolute left-2 top-2.5 w-3 h-3 text-slate-400" />
                  <input
                    type="text"
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    placeholder="Tìm IP, User..."
                    className="w-full pl-7 pr-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={sessionStatusFilter}
                  onChange={(e) => setSessionStatusFilter(e.target.value)}
                  className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="ALL">Tất cả ({activeSessions.length})</option>
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="SUSPICIOUS">Cần chú ý</option>
                </select>
                <span className="text-[10px] font-mono text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 px-2 py-1 rounded-full border border-rose-200 dark:border-rose-800 font-bold shrink-0">
                  {filteredSessions.length} Phiên
                </span>
              </div>
            </div>

            <div>
              <EnterpriseTable
                columns={sessionColumns}
                data={filteredSessions}
                keyField="id"
                moduleId="SYS"
                tableId="active_sessions"
                moduleName="Quản Trị Hệ Thống"
                tableName="Phiên Đăng Nhập & Bảo Mật"
                stickyFirstColumn={true}
                resizableColumns={true}
                onRowClick={(row) => {
                  onInspectSession(row);
                  onSelectEntity({
                    type: 'M03_SESSION',
                    id: row.id,
                    code: row.id,
                    title: row.user,
                    status: row.status,
                    data: row,
                  });
                }}
                emptyMessage="Không còn phiên đăng nhập hoạt động nào khác."
              />
            </div>
          </div>
        </div>

        {/* Right Col: System Diagnostic Health Check Tests */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Chẩn đoán Hệ thống (Diagnostic Health)
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 px-2 py-0.5 rounded-full border">
                5/5 Đạt (100%)
              </span>
            </div>

            <div className="space-y-2.5">
              {diagnostics.map((diag) => (
                <div
                  key={diag.id}
                  onClick={() => onInspectDiagnostic(diag)}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 space-y-1.5 transition-colors cursor-pointer"
                  title="Bấm để xem chi tiết kết quả chẩn đoán"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">{diag.component}</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-950 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 shrink-0">
                      {diag.result}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {diag.message}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700 tabular-nums">
                    <span>Độ trễ: {diag.latency}</span>
                    <span>{diag.checkedAt}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onRequestRunDiagnostics}
              disabled={runningDiagnostics}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${runningDiagnostics ? 'animate-spin' : ''}`} />
              <span>{runningDiagnostics ? 'Đang chạy chẩn đoán...' : 'Chạy Chẩn Đoán Lại'}</span>
            </button>

            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>Xác thực Toàn vẹn Hệ thống ERP</span>
              </div>
              <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                Hệ thống 29 phân hệ hoạt động liền mạch với mô hình 3 trạng thái kho, sổ cái kép ACID và trục sự kiện EventBus. Không phát sinh lỗi xung đột dữ liệu.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
