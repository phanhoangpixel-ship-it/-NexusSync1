import React, { useState } from 'react';
import { RlsPolicyConfig, TenantBranch, DelegationRecord } from './types';
import { INITIAL_TENANT_BRANCHES, INITIAL_DELEGATIONS, MODULES_42_CATALOG } from './mockData';
import { ConfirmDialogState } from '../../../../types';
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Calendar,
  Plus,
  Trash2,
  Lock,
  DollarSign,
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react';

interface RbacTenantRlsTabProps {
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState | null>>;
}

export const RbacTenantRlsTab: React.FC<RbacTenantRlsTabProps> = ({
  onNotify,
  setConfirmDialog,
}) => {
  // RLS State
  const [rlsPolicy, setRlsPolicy] = useState<RlsPolicyConfig>({
    strictBranchIsolation: true,
    allowMultiBranchViewForHQ: true,
    exemptRoles: ['SUPER_ADMIN', 'SYSTEM_AUDITOR'],
    enforceOnModules: ['M08', 'M13', 'M16', 'M17', 'M18', 'M19', 'M30', 'M31', 'M32'],
  });

  // Branches
  const [branches, setBranches] = useState<TenantBranch[]>(INITIAL_TENANT_BRANCHES);
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchGL, setNewBranchGL] = useState('');
  const [newBranchWh, setNewBranchWh] = useState('');
  const [newBranchCredit, setNewBranchCredit] = useState<number>(20000000000);

  // Delegations
  const [delegations, setDelegations] = useState<DelegationRecord[]>(INITIAL_DELEGATIONS);
  const [newDelegator, setNewDelegator] = useState('cfo');
  const [newDelegatee, setNewDelegatee] = useState('accountant_lead');
  const [newDelegationModules, setNewDelegationModules] = useState<string[]>(['M30', 'M31']);
  const [newDelegationBranch, setNewDelegationBranch] = useState('HQ');
  const [newStartDate, setNewStartDate] = useState('2026-09-15');
  const [newEndDate, setNewEndDate] = useState('2026-09-25');
  const [newDelegationReason, setNewDelegationReason] = useState('');

  // Save RLS Policy with ConfirmDialog
  const handleToggleRlsStrict = () => {
    const nextVal = !rlsPolicy.strictBranchIsolation;
    setConfirmDialog({
      isOpen: true,
      title: 'Thay Đổi Chính Sách Cách Ly Dữ Liệu Chi Nhánh (RLS)',
      message: `Bạn đang chuẩn bị ${nextVal ? 'BẬT' : 'TẮT'} chế độ Strict Branch Isolation. Khi BẬT, người dùng tại chi nhánh không thể truy vấn hoặc xem dữ liệu của chi nhánh khác dù có ID chứng từ. Bạn có muốn áp dụng ngay?`,
      variant: nextVal ? 'primary' : 'danger',
      confirmText: nextVal ? 'Bật Chế Độ Nghiêm Ngặt' : 'Tắt (Nới Lỏng)',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          await fetch('/api/rbac/rls', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...rlsPolicy, strictBranchIsolation: nextVal }),
          });
        } catch {
          // fallback
        }
        setRlsPolicy((prev) => ({ ...prev, strictBranchIsolation: nextVal }));
        onNotify('success', 'Chính sách RLS đã cập nhật', `Đã ${nextVal ? 'kích hoạt' : 'hạ cấp'} cô lập dữ liệu theo chi nhánh.`);
        setConfirmDialog(null);
      },
    });
  };

  // Create Branch with ConfirmDialog
  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchCode.trim() || !newBranchName.trim()) {
      onNotify('warning', 'Thiếu dữ liệu', 'Vui lòng nhập đầy đủ Mã và Tên chi nhánh.');
      return;
    }

    const cleanCode = newBranchCode.trim().toUpperCase().replace(/\s+/g, '_');

    setConfirmDialog({
      isOpen: true,
      title: 'Khởi Tạo Chi Nhánh / Tenant Mới',
      message: `Bạn đang khởi tạo chi nhánh "${cleanCode} - ${newBranchName}" với Sổ Cái GL ${newBranchGL || 'GL-DEFAULT'} và Hạn Mức Tín Dụng ${newBranchCredit.toLocaleString('vi-VN')} ₫. Chi nhánh sẽ lập tức được cấp phát trong hệ thống phân quyền 42 phân hệ.`,
      variant: 'primary',
      confirmText: 'Khởi Tạo Chi Nhánh',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        const item: TenantBranch = {
          id: branches.length + 1,
          code: cleanCode,
          name: newBranchName.trim(),
          glCode: newBranchGL.trim() || `GL-${cleanCode}`,
          defaultWarehouse: newBranchWh.trim() || `KHO_${cleanCode}`,
          manager: 'Chưa chỉ định',
          creditLimit: Number(newBranchCredit),
          createdAt: new Date().toISOString().split('T')[0],
        };
        try {
          await fetch('/api/admin/tenants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });
        } catch {
          // fallback
        }
        setBranches((prev) => [...prev, item]);
        setNewBranchCode('');
        setNewBranchName('');
        setNewBranchGL('');
        setNewBranchWh('');
        onNotify('success', 'Tạo chi nhánh thành công', `Đã kích hoạt chi nhánh ${cleanCode}.`);
        setConfirmDialog(null);
      },
    });
  };

  // Add Delegation with ConfirmDialog
  const handleCreateDelegation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDelegationReason.trim()) {
      onNotify('warning', 'Thiếu lý do ủy quyền', 'Vui lòng nêu rõ lý do ủy nhiệm theo chuẩn kiểm toán SOX.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Cấp Ủy Quyền Tạm Thời (Delegation of Authority)',
      message: `CẢNH BÁO KIỂM TOÁN: Bạn đang ủy nhiệm toàn bộ quyền ký duyệt của "${newDelegator}" sang "${newDelegatee}" trên các phân hệ [${newDelegationModules.join(', ')}] từ ngày ${newStartDate} đến ${newEndDate}. Hành động này sẽ được ghi vào Sổ Kiểm Toán. Bạn có muốn kích hoạt?`,
      variant: 'warning',
      confirmText: 'Kích Hoạt Ủy Quyền',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        const item: DelegationRecord = {
          id: `del_${Date.now()}`,
          delegatorUsername: newDelegator,
          delegatorName: newDelegator === 'cfo' ? 'Nguyễn Thị Hương (CFO)' : newDelegator,
          delegateeUsername: newDelegatee,
          delegateeName: newDelegatee === 'accountant_lead' ? 'Trần Mai Anh (Kế Toán Trưởng)' : newDelegatee,
          moduleScopes: newDelegationModules,
          branchScope: newDelegationBranch,
          startDate: newStartDate,
          endDate: newEndDate,
          reason: newDelegationReason.trim(),
          status: 'ACTIVE',
        };
        try {
          await fetch('/api/rbac/delegations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });
        } catch {
          // fallback
        }
        setDelegations((prev) => [item, ...prev]);
        setNewDelegationReason('');
        onNotify('success', 'Ủy quyền đã kích hoạt', `Đã cấp ủy quyền cho ${item.delegateeUsername}.`);
        setConfirmDialog(null);
      },
    });
  };

  // Revoke Delegation
  const handleRevokeDelegation = (del: DelegationRecord) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hủy Ủy Quyền Tạm Thời Trước Hạn',
      message: `Bạn có chắc chắn muốn chấm dứt ủy quyền từ "${del.delegatorUsername}" cho "${del.delegateeUsername}" ngay lập tức? Người được ủy quyền sẽ bị tước bỏ quyền phê duyệt.`,
      variant: 'danger',
      confirmText: 'Chấm Dứt Ngay',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          await fetch(`/api/rbac/delegations/${del.id}`, { method: 'DELETE' });
        } catch {
          // fallback
        }
        setDelegations((prev) =>
          prev.map((d) => (d.id === del.id ? { ...d, status: 'EXPIRED' as const } : d))
        );
        onNotify('info', 'Đã chấm dứt ủy quyền', `Ủy quyền ${del.id} đã hết hiệu lực.`);
        setConfirmDialog(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: ROW-LEVEL SECURITY POLICY CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Row-Level Security (RLS) &amp; Cô Lập Dữ Liệu Đa Chi Nhánh
              </h2>
              <p className="text-xs text-slate-500">
                Bảo đảm tính toàn vẹn và phân tách dữ liệu tuyệt đối giữa các pháp nhân chi nhánh trong tập đoàn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                rlsPolicy.strictBranchIsolation
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {rlsPolicy.strictBranchIsolation ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>RLS: STRICT ENFORCED</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>RLS: RELAXED</span>
                </>
              )}
            </span>

            <button
              type="button"
              onClick={handleToggleRlsStrict}
              className="px-3.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-all shadow-xs"
            >
              Đổi Chế Độ RLS
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="font-bold text-slate-900 dark:text-white mb-1">
              Quyền Xem Toàn Cảnh (Multi-Branch View)
            </div>
            <p className="text-slate-500 mb-2">
              Cho phép vai trò Trụ Sở Chính (HQ) và Ban Giám Đốc tổng hợp báo cáo xuyên chi nhánh.
            </p>
            <span className="px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-800 text-[11px]">
              KÍCH HOẠT (HQ ONLY)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="font-bold text-slate-900 dark:text-white mb-1">
              Phân Hệ Bắt Buộc Gán BranchId (Single Writer)
            </div>
            <p className="text-slate-500 mb-2">
              Các module giao dịch cốt lõi (Kho, Sổ cái, Đơn hàng) tự động lọc theo branch_id của user.
            </p>
            <span className="px-2 py-0.5 rounded font-mono font-bold bg-purple-100 text-purple-800 text-[11px]">
              {rlsPolicy.enforceOnModules.length} Modules (M08, M13, M17, M30...)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="font-bold text-slate-900 dark:text-white mb-1">
              Vai Trò Miễn Trừ RLS (Sovereign Bypass)
            </div>
            <p className="text-slate-500 mb-2">
              SUPER_ADMIN và SYSTEM_AUDITOR có thẩm quyền đọc toàn bộ dữ liệu đối soát không qua RLS.
            </p>
            <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 text-emerald-800 text-[11px]">
              {rlsPolicy.exemptRoles.join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: BRANCHES & NEW BRANCH PROVISIONING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch List Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Danh Sách Chi Nhánh / Tenant ({branches.length} Chi Nhánh)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Đồng bộ GL &amp; Kho WMS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase">
                  <th className="py-3 px-4">Mã Chi Nhánh</th>
                  <th className="py-3 px-4">Tên Chi Nhánh</th>
                  <th className="py-3 px-4">Mã Sổ Cái GL</th>
                  <th className="py-3 px-4 text-right">Hạn Mức Tín Dụng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {branches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {b.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{b.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Warehouse className="w-3 h-3" />
                        <span>Kho: {b.defaultWarehouse}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {b.glCode}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                      {b.creditLimit.toLocaleString('vi-VN')} ₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Provisioning Form (1 Col) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Plus className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Khởi Tạo Chi Nhánh Mới
            </h3>
          </div>

          <form onSubmit={handleCreateBranch} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mã Chi Nhánh (Branch Code) *
              </label>
              <input
                type="text"
                placeholder="VD: BR_HP"
                value={newBranchCode}
                onChange={(e) => setNewBranchCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono uppercase font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tên Chi Nhánh *
              </label>
              <input
                type="text"
                placeholder="VD: Chi Nhánh Hải Phòng"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mã Sổ Cái Kế Toán (GL Code)
              </label>
              <input
                type="text"
                placeholder="VD: GL-5000-HP"
                value={newBranchGL}
                onChange={(e) => setNewBranchGL(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Hạn Mức Tín Dụng (VND)
              </label>
              <input
                type="number"
                step={1000000000}
                value={newBranchCredit}
                onChange={(e) => setNewBranchCredit(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-right"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Cấp Phát Chi Nhánh Mới</span>
            </button>
          </form>
        </div>
      </div>

      {/* SECTION 3: DELEGATION OF AUTHORITY (DOA) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ủy Quyền Tạm Thời &amp; Ủy Nhiệm Quyền Ký Duyệt (Delegation of Authority)
              </h3>
              <p className="text-xs text-slate-500">
                Cho phép cán bộ quản lý ủy quyền phê duyệt chứng từ khi đi công tác hoặc nghỉ phép có thời hạn xác định.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            SOX 404 Compliant
          </span>
        </div>

        {/* Existing Delegations List */}
        <div className="space-y-3">
          {delegations.map((del) => (
            <div
              key={del.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <span className="text-blue-600">{del.delegatorName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-indigo-600">{del.delegateeName}</span>
                  <span
                    className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                      del.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {del.status === 'ACTIVE' ? 'ĐANG HIỆU LỰC' : 'ĐÃ HẾT HẠN'}
                  </span>
                </div>
                <div className="text-slate-500 flex flex-wrap items-center gap-3">
                  <span>
                    Phạm vi: <strong className="font-mono text-slate-700 dark:text-slate-300">{del.moduleScopes.join(', ')}</strong> (Chi nhánh: {del.branchScope})
                  </span>
                  <span>
                    Thời hạn: <strong className="font-mono text-slate-700 dark:text-slate-300">{del.startDate} → {del.endDate}</strong>
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 italic">Lý do: {del.reason}</div>
              </div>

              {del.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => handleRevokeDelegation(del)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold border border-rose-200 transition-all cursor-pointer shrink-0"
                >
                  Chấm Dứt Trước Hạn
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Create Delegation Form */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
            + Thiết Lập Lệnh Ủy Quyền Mới
          </h4>
          <form onSubmit={handleCreateDelegation} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-500 mb-1">Người Ủy Quyền</label>
              <select
                value={newDelegator}
                onChange={(e) => setNewDelegator(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
              >
                <option value="cfo">Nguyễn Thị Hương (CFO)</option>
                <option value="warehouse">Trần Văn Kho (WMS Lead)</option>
                <option value="sales">Lê Thị Bán Hàng (Sales Lead)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-500 mb-1">Người Được Ủy Quyền</label>
              <select
                value={newDelegatee}
                onChange={(e) => setNewDelegatee(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
              >
                <option value="accountant_lead">Trần Mai Anh (Kế Toán Trưởng)</option>
                <option value="wh_deputy">Vũ Đình Nam (Phó Kho Trưởng)</option>
                <option value="operator">Đặng Văn Vận Hành</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-500 mb-1">Thời Hạn (Từ → Đến)</label>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-1/2 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
                />
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-1/2 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-500 mb-1">Lý Do Ủy Quyền *</label>
              <input
                type="text"
                placeholder="VD: Nghỉ phép, công tác..."
                value={newDelegationReason}
                onChange={(e) => setNewDelegationReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                required
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Kích Hoạt Ủy Quyền</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
