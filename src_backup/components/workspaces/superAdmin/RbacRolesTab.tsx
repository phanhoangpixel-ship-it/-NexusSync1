import React, { useState, useMemo } from 'react';
import { RbacRole, SecurityTier, SuperAdminDetailItem } from './types';
import { ConfirmDialogState } from '../../../types';
import {
  Shield,
  Plus,
  Search,
  Key,
  Users,
  Building2,
  Trash2,
  Copy,
  CheckCircle2,
  Lock,
  Eye,
  Sliders,
  AlertTriangle,
  Info
} from 'lucide-react';

interface RbacRolesTabProps {
  roles: RbacRole[];
  onSelectRole: (role: RbacRole) => void;
  onViewDetail: (item: SuperAdminDetailItem) => void;
  onAddRole: (role: Omit<RbacRole, 'id' | 'userCount' | 'permissionsCount' | 'updatedAt' | 'auditChecksum'>) => void;
  onDeleteRole: (roleId: number) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState | null>>;
}

export const RbacRolesTab: React.FC<RbacRolesTabProps> = ({
  roles,
  onSelectRole,
  onViewDetail,
  onAddRole,
  onDeleteRole,
  onNotify,
  setConfirmDialog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | SecurityTier>('ALL');

  // Form State
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleTier, setNewRoleTier] = useState<SecurityTier>('TIER_3_OPERATIONAL');
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['ALL']);

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTier = tierFilter === 'ALL' || r.tier === tierFilter;
      return matchSearch && matchTier;
    });
  }, [roles, searchTerm, tierFilter]);

  // Handle Form Submit with Rule #19 ConfirmDialog
  const handleSubmitNewRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleCode.trim() || !newRoleName.trim()) {
      onNotify('warning', 'Thiếu thông tin bắt buộc', 'Vui lòng nhập đầy đủ Mã định danh và Tên vai trò.');
      return;
    }

    const cleanCode = newRoleCode.trim().toUpperCase().replace(/\s+/g, '_');

    // Rule #19: ConfirmDialog before creating
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận Khởi tạo Vai Trò RBAC',
      message: `Bạn đang chuẩn bị tạo vai trò "${cleanCode} - ${newRoleName}" với cấp bậc ${newRoleTier}. Vai trò này sẽ được bổ sung vào ma trận quyền hạt nhân của 42 phân hệ. Bạn có muốn tiếp tục?`,
      variant: newRoleTier === 'TIER_1_SOVEREIGN' ? 'danger' : 'primary',
      confirmText: 'Tạo Vai Trò',
      cancelText: 'Hủy Bỏ',
      onConfirm: () => {
        onAddRole({
          code: cleanCode,
          name: newRoleName.trim(),
          description: newRoleDesc.trim() || 'Vai trò tùy chỉnh được khởi tạo bởi SuperAdmin.',
          tier: newRoleTier,
          isSystem: false,
          permissions: ['CORE_READ', 'DASHBOARD_VIEW'],
          allowedBranches: selectedBranches,
          status: 'ACTIVE',
        });
        setNewRoleCode('');
        setNewRoleName('');
        setNewRoleDesc('');
        setConfirmDialog(null);
      },
    });
  };

  // Handle Delete Role with Rule #19 ConfirmDialog
  const handleDeleteRoleClick = (role: RbacRole) => {
    if (role.isSystem) {
      onNotify('danger', 'Hành động bị cấm', `Vai trò ${role.code} là vai trò hạt nhân của hệ thống (System Role) và không thể xóa.`);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Thu hồi & Xóa Vai Trò RBAC',
      message: `HÀNH ĐỘNG NGUY HIỂM: Bạn có chắc chắn muốn xóa vĩnh viễn vai trò "${role.name} (${role.code})"? Tất cả tài khoản (${role.userCount} tài khoản) đang liên kết sẽ bị thu hồi quyền truy cập tương ứng.`,
      variant: 'danger',
      confirmText: 'Xác Nhận Xóa Vĩnh Viễn',
      cancelText: 'Hủy Bỏ',
      onConfirm: () => {
        onDeleteRole(role.id);
        setConfirmDialog(null);
      },
    });
  };

  // Handle Clone Role with ConfirmDialog
  const handleCloneRoleClick = (role: RbacRole) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Nhân Bản Vai Trò RBAC (Clone Role)',
      message: `Tạo bản sao mới từ vai trò "${role.name}" (${role.permissionsCount} quyền tương đương). Bạn có muốn tạo bản sao này không?`,
      variant: 'primary',
      confirmText: 'Nhân Bản Ngay',
      cancelText: 'Hủy Bỏ',
      onConfirm: () => {
        onAddRole({
          code: `${role.code}_COPY`,
          name: `${role.name} (Bản sao)`,
          description: `Bản sao từ vai trò ${role.name}: ${role.description}`,
          tier: role.tier,
          isSystem: false,
          permissions: [...role.permissions],
          allowedBranches: [...role.allowedBranches],
          status: 'ACTIVE',
        });
        setConfirmDialog(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* TẦNG L1: FILTER & COMMAND BAR (M41 SPEC) */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm vai trò theo tên, mã code hoặc mô tả chức năng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Phân cấp:</span>
          {(['ALL', 'TIER_1_SOVEREIGN', 'TIER_2_GOVERNANCE', 'TIER_3_OPERATIONAL'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tierFilter === tier
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {tier === 'ALL' && `Tất cả (${roles.length})`}
              {tier === 'TIER_1_SOVEREIGN' && 'Tối Cao (Tier 1)'}
              {tier === 'TIER_2_GOVERNANCE' && 'Quản Trị (Tier 2)'}
              {tier === 'TIER_3_OPERATIONAL' && 'Vận Hành (Tier 3)'}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN GRID: ROLES LIST (2 COLS) & CREATE ROLE FORM (1 COL) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ROLES TABLE (TẦNG L3 MASTER TABLE) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Danh Sách Vai Trò Phân Quyền Hạt Nhân ({filteredRoles.length})
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800">
                Zero-Trust IAM v3.2
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="py-3 px-4">Mã & Tên Vai Trò</th>
                    <th className="py-3 px-3">Cấp Bậc (Tier)</th>
                    <th className="py-3 px-3">Tài Khoản Gán</th>
                    <th className="py-3 px-3">Đặc Quyền</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                  {filteredRoles.map((role) => {
                    return (
                      <tr
                        key={role.id}
                        onClick={() => onSelectRole(role)}
                        className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                              #{role.id}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                  {role.code}
                                </span>
                                {role.isSystem && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold">
                                    SYSTEM
                                  </span>
                                )}
                              </div>
                              <div className="font-semibold text-slate-900 dark:text-white mt-1 line-clamp-1">
                                {role.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          {role.tier === 'TIER_1_SOVEREIGN' && (
                            <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded font-semibold text-[11px] border border-indigo-200 dark:border-indigo-800">
                              TIER 1 SOVEREIGN
                            </span>
                          )}
                          {role.tier === 'TIER_2_GOVERNANCE' && (
                            <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded font-semibold text-[11px] border border-blue-200 dark:border-blue-800">
                              TIER 2 GOVERNANCE
                            </span>
                          )}
                          {role.tier === 'TIER_3_OPERATIONAL' && (
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 text-xs font-bold rounded-full border">
                              TIER 3 OPERATIONAL
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{role.userCount}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-mono tabular-nums font-bold text-indigo-700 dark:text-indigo-300">
                          <div className="flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{role.permissionsCount}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onViewDetail({ type: 'ROLE', data: role })}
                              className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-all cursor-pointer"
                              title="Xem chi tiết vai trò"
                            >
                              Chi tiết
                            </button>
                            <button
                              onClick={() => handleCloneRoleClick(role)}
                              className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                              title="Nhân bản vai trò"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {!role.isSystem && (
                              <button
                                onClick={() => handleDeleteRoleClick(role)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-all cursor-pointer"
                                title="Xóa vai trò"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CREATE ROLE FORM (TẦNG L3 RIGHT COLUMN) */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Khởi Tạo Vai Trò RBAC Mới
              </h3>
            </div>

            <form onSubmit={handleSubmitNewRole} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mã Vai Trò (Role Key) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: AUDITOR_BRANCH_LEAD"
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono uppercase font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Vai Trò Hiển Thị <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Trưởng Nhóm Kiểm Toán Chi Nhánh"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cấp Bậc An Ninh (Security Tier)
                </label>
                <select
                  value={newRoleTier}
                  onChange={(e) => setNewRoleTier(e.target.value as SecurityTier)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="TIER_3_OPERATIONAL">TIER 3 - Vận hành & Nhập liệu (Operational)</option>
                  <option value="TIER_2_GOVERNANCE">TIER 2 - Quản trị & Phê duyệt (Governance)</option>
                  <option value="TIER_1_SOVEREIGN">TIER 1 - Quyền Tối Cao SuperAdmin (Sovereign)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mô Tả Chức Năng & Phạm Vi Phân Hệ
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả quyền hạn truy cập API, sổ cái hoặc kho hàng của vai trò này..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-4 rounded-xl text-xs flex items-start gap-3 shadow-xs">
                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-indigo-900 dark:text-indigo-200">Tuân thủ Quy tắc Rule #19</div>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                    Mọi thao tác khởi tạo vai trò mới sẽ được bảo vệ bởi hộp thoại xác nhận trước khi lưu vào cơ sở dữ liệu RBAC lõi.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs w-full cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Vai Trò Mới</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
