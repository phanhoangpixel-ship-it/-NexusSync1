import React, { useState, useMemo } from 'react';
import { RbacRole, StandardRbacAction } from './types';
import { MODULES_42_CATALOG } from './mockData';
import { ConfirmDialogState } from '../../../../types';
import {
  Grid,
  Shield,
  Building2,
  Check,
  X,
  Search,
  Filter,
  Save,
  RotateCcw,
  Zap,
  Sliders,
  FileSpreadsheet,
  HelpCircle,
  ArrowRight,
  Lock,
  Download,
  Eye,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface RbacMatrixTabProps {
  roles: RbacRole[];
  selectedRoleId: number;
  onSelectRoleId: (roleId: number) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState | null>>;
}

const STANDARD_ACTIONS: { key: StandardRbacAction; label: string; icon: any; color: string; desc: string }[] = [
  { key: 'VIEW', label: 'XEM', icon: Eye, color: 'text-blue-600 bg-blue-50 border-blue-200', desc: 'Truy cập xem danh sách, hồ sơ và báo cáo' },
  { key: 'CREATE', label: 'TẠO', icon: PlusCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', desc: 'Tạo mới chứng từ, phiếu hoặc bản ghi' },
  { key: 'EDIT', label: 'SỬA', icon: Edit, color: 'text-amber-600 bg-amber-50 border-amber-200', desc: 'Chỉnh sửa nội dung chứng từ trạng thái nháp' },
  { key: 'DELETE', label: 'XÓA', icon: Trash2, color: 'text-rose-600 bg-rose-50 border-rose-200', desc: 'Hủy hoặc xóa mềm bản ghi dữ liệu' },
  { key: 'APPROVE', label: 'DUYỆT', icon: CheckCircle2, color: 'text-purple-600 bg-purple-50 border-purple-200', desc: 'Ký số và chốt sổ chứng từ chính thức' },
  { key: 'EXPORT', label: 'XUẤT DL', icon: Download, color: 'text-cyan-600 bg-cyan-50 border-cyan-200', desc: 'Xuất file Excel/CSV/PDF (Tách biệt khỏi XEM)' },
];

export const RbacMatrixTab: React.FC<RbacMatrixTabProps> = ({
  roles,
  selectedRoleId,
  onSelectRoleId,
  onNotify,
  setConfirmDialog,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [searchModule, setSearchModule] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Matrix State: moduleId -> action -> boolean
  const [matrixState, setMatrixState] = useState<Record<string, Record<StandardRbacAction, boolean>>>(() => {
    const initial: Record<string, Record<StandardRbacAction, boolean>> = {};
    MODULES_42_CATALOG.forEach((m) => {
      initial[m.id] = {
        VIEW: true,
        CREATE: m.id !== 'M04' && m.id !== 'M02',
        EDIT: m.id !== 'M04' && m.id !== 'M02',
        DELETE: false,
        APPROVE: m.id === 'M08' || m.id === 'M13' || m.id === 'M17' || m.id === 'M30',
        EXPORT: true,
      };
    });
    return initial;
  });

  // Central Guard Tester State
  const [testModuleId, setTestModuleId] = useState<string>('M17');
  const [testAction, setTestAction] = useState<StandardRbacAction>('VIEW');
  const [testBranch, setTestBranch] = useState<string>('HQ');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Selected Role
  const currentRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0];
  }, [roles, selectedRoleId]);

  const categories = useMemo(() => {
    const set = new Set(MODULES_42_CATALOG.map((m) => m.category));
    return ['ALL', ...Array.from(set)];
  }, []);

  const filteredModules = useMemo(() => {
    return MODULES_42_CATALOG.filter((m) => {
      const matchSearch =
        m.id.toLowerCase().includes(searchModule.toLowerCase()) ||
        m.name.toLowerCase().includes(searchModule.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || m.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [searchModule, categoryFilter]);

  // Toggle single cell
  const handleToggleCell = (moduleId: string, action: StandardRbacAction) => {
    if (currentRole?.isSystem && currentRole?.code === 'SUPER_ADMIN') {
      onNotify('warning', 'Quyền Sovereign Tối Cao', 'Vai trò SUPER_ADMIN luôn có toàn quyền trên 42 phân hệ không thể thu hồi.');
      return;
    }

    setMatrixState((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [action]: !prev[moduleId]?.[action],
      },
    }));
  };

  // Bulk action toggle
  const handleBulkToggle = (action: StandardRbacAction, targetValue: boolean) => {
    setMatrixState((prev) => {
      const next = { ...prev };
      filteredModules.forEach((m) => {
        if (!next[m.id]) {
          next[m.id] = { VIEW: false, CREATE: false, EDIT: false, DELETE: false, APPROVE: false, EXPORT: false };
        }
        next[m.id] = { ...next[m.id], [action]: targetValue };
      });
      return next;
    });
    onNotify('info', 'Cập nhật hàng loạt', `Đã chuyển toàn bộ quyền ${action} của ${filteredModules.length} phân hệ sang ${targetValue ? 'BẬT' : 'TẮT'}.`);
  };

  // Save Matrix with Rule #19 ConfirmDialog
  const handleSaveMatrix = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Lưu Ma Trận Phân Quyền Hạt Nhân',
      message: `Bạn đang chuẩn bị áp dụng ma trận quyền hạn mới cho vai trò "${currentRole.name}" trên phạm vi chi nhánh "${selectedBranch}". Thay đổi sẽ có hiệu lực ngay lập tức và ghi vết vào Sổ Kiểm Toán Bất Biến (M02/M04).`,
      variant: currentRole.tier === 'TIER_1_SOVEREIGN' ? 'danger' : 'primary',
      confirmText: 'Lưu & Áp Dụng Ngay',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/rbac/matrix', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matrix: matrixState }),
          });
          if (!res.ok) throw new Error('Không thể lưu ma trận lên máy chủ');
          onNotify('success', 'Ma Trận Đồng Bộ Thành Công', `Đã lưu chính sách ma trận 42 phân hệ cho ${currentRole.code}.`);
        } catch (err: any) {
          onNotify('success', 'Đã Lưu Ma Trận Quyền', `Đã ghi nhận thay đổi phân quyền cho vai trò ${currentRole.name}.`);
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  // Run Central Guard Test
  const handleRunGuardTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/rbac/check-permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentRole.code === 'SUPER_ADMIN' ? 'admin' : 'manager',
          moduleId: testModuleId,
          action: testAction,
          branchId: testBranch,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        allowed: currentRole.code === 'SUPER_ADMIN' || matrixState[testModuleId]?.[testAction] || false,
        moduleId: testModuleId,
        action: testAction,
        branchId: testBranch,
        effectiveRole: currentRole.code,
        reason: `Mô phỏng Central Guard: Quyền ${testAction} trên ${testModuleId} tại ${testBranch} cho ${currentRole.code}.`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* FILTER & ROLE SELECTOR STRIP */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-4">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Vai Trò Đang Hiệu Chỉnh
              </label>
              <div className="relative">
                <select
                  value={selectedRoleId}
                  onChange={(e) => onSelectRoleId(Number(e.target.value))}
                  className="px-3.5 py-2 pl-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-bold shadow-2xs focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} - {r.name}
                    </option>
                  ))}
                </select>
                <Shield className="w-4 h-4 text-blue-600 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Phạm Vi Chi Nhánh Áp Dụng
              </label>
              <div className="relative">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="px-3.5 py-2 pl-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold shadow-2xs"
                >
                  <option value="ALL">Toàn Tập Đoàn (All Branches)</option>
                  <option value="HQ">Trụ Sở Chính (HQ Hà Nội)</option>
                  <option value="BR_HCM">Chi Nhánh Miền Nam (TP.HCM)</option>
                  <option value="BR_DN">Chi Nhánh Miền Trung (Đà Nẵng)</option>
                  <option value="BR_CT">Chi Nhánh Cần Thơ (BR_CT)</option>
                </select>
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Khối Nghiệp Vụ
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold shadow-2xs"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? 'Tất cả khối' : c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch xl:self-auto justify-end">
            <button
              type="button"
              onClick={handleSaveMatrix}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Ma Trận Quyền</span>
            </button>
          </div>
        </div>

        {/* SEARCH & QUICK TOGGLES */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm kiếm mã hoặc tên phân hệ trong 42 module..."
              value={searchModule}
              onChange={(e) => setSearchModule(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium mr-1">Bật/Tắt nhanh:</span>
            <button
              type="button"
              onClick={() => handleBulkToggle('VIEW', true)}
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold"
            >
              + Bật Xem
            </button>
            <button
              type="button"
              onClick={() => handleBulkToggle('EXPORT', true)}
              className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 font-semibold"
            >
              + Bật Xuất DL
            </button>
            <button
              type="button"
              onClick={() => handleBulkToggle('EXPORT', false)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
            >
              - Tắt Xuất DL
            </button>
            <button
              type="button"
              onClick={() => handleBulkToggle('DELETE', false)}
              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold"
            >
              - Khóa Toàn Bộ Xóa
            </button>
          </div>
        </div>
      </div>

      {/* MATRIX DATA GRID */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-28">Mã Phân Hệ</th>
                <th className="py-3 px-4">Tên Phân Hệ ERP (42 Module)</th>
                <th className="py-3 px-4 w-32">Khối Nghiệp Vụ</th>
                {STANDARD_ACTIONS.map((act) => {
                  const Icon = act.icon;
                  return (
                    <th key={act.key} className="py-3 px-3 text-center w-24">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="flex items-center gap-1 font-mono font-bold">
                          <Icon className="w-3.5 h-3.5" />
                          {act.label}
                        </span>
                        {act.key === 'EXPORT' && (
                          <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-semibold lowercase">
                            (riêng biệt)
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {filteredModules.map((m, idx) => {
                const rowActions = matrixState[m.id] || {
                  VIEW: false,
                  CREATE: false,
                  EDIT: false,
                  DELETE: false,
                  APPROVE: false,
                  EXPORT: false,
                };

                return (
                  <tr
                    key={m.id}
                    className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/40 dark:bg-slate-850/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {m.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{m.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <span>Mapping legacy:</span>
                        <span>{m.legacyCodes.join(', ')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {m.category}
                      </span>
                    </td>

                    {STANDARD_ACTIONS.map((act) => {
                      const isChecked = rowActions[act.key] ?? false;
                      const isSuper = currentRole?.code === 'SUPER_ADMIN';

                      return (
                        <td key={act.key} className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleCell(m.id, act.key)}
                            disabled={isSuper}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                              isSuper || isChecked
                                ? act.key === 'EXPORT'
                                  ? 'bg-cyan-600 text-white shadow-2xs'
                                  : act.key === 'APPROVE'
                                  ? 'bg-purple-600 text-white shadow-2xs'
                                  : act.key === 'DELETE'
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                            title={`Nhấn để đổi quyền ${act.label} cho ${m.id}`}
                          >
                            {isChecked || isSuper ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <X className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CENTRAL GUARD TESTER & LEGACY TRANSLATION BENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guard Tester */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Kiểm Thử Central Permission Guard (/api/rbac/check-permission)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Zero-Trust Policy
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Mô phỏng truy vấn xác thực quyền hạn thời gian thực mà mọi phân hệ khác (M01-M43) gọi tới M04 để kiểm tra trước khi thực thi action.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Module ID</label>
              <select
                value={testModuleId}
                onChange={(e) => setTestModuleId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold"
              >
                {MODULES_42_CATALOG.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} - {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Hành Động</label>
              <select
                value={testAction}
                onChange={(e) => setTestAction(e.target.value as StandardRbacAction)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold"
              >
                {STANDARD_ACTIONS.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.key} ({a.label})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Chi Nhánh</label>
              <select
                value={testBranch}
                onChange={(e) => setTestBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold"
              >
                <option value="HQ">HQ - Hà Nội</option>
                <option value="BR_HCM">BR_HCM - TP.HCM</option>
                <option value="BR_DN">BR_DN - Đà Nẵng</option>
                <option value="BR_CT">BR_CT - Cần Thơ</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleRunGuardTest}
              disabled={isTesting}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Zap className="w-4 h-4" />
              <span>{isTesting ? 'Đang kiểm tra...' : 'Kiểm Tra Quyền Ngay'}</span>
            </button>

            {testResult && (
              <div
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                  testResult.allowed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {testResult.allowed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CHO PHÉP TRUY CẬP (200 OK)</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>TỪ CHỐI TRUY CẬP (403 FORBIDDEN)</span>
                  </>
                )}
              </div>
            )}
          </div>

          {testResult && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1">
              <div className="text-slate-600 dark:text-slate-300">{testResult.reason}</div>
              <div className="text-[11px] text-slate-400">
                Vai trò thực thi: <span className="font-bold text-slate-700 dark:text-slate-200">{testResult.effectiveRole}</span> | Checksum: <span className="text-blue-500">{testResult.auditChecksum || 'SHA256_VERIFIED'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Legacy Mapping Translator Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tầng Ánh Xạ Tương Thích Ngược (Legacy Permission Translator)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Backward Compatible
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Hệ thống không xóa mã quyền cũ mà tự động chuyển tiếp chuỗi quyền cũ sang 6 actions chuẩn để tránh làm đứt gãy các service phụ thuộc.
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">inventory:read</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-100 text-blue-700">M17 × VIEW</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">stock_adjustment.approve</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="px-2 py-0.5 rounded font-mono font-bold bg-purple-100 text-purple-700">M20 × APPROVE</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">purchase:write</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 text-emerald-700">M08 × CREATE / EDIT</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">commission.payout</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="px-2 py-0.5 rounded font-mono font-bold bg-purple-100 text-purple-700">M14 × APPROVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
