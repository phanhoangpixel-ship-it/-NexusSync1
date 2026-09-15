import React, { useState, useMemo } from 'react';
import { RbacUser, RbacRole, SuperAdminDetailItem } from './types';
import { ConfirmDialogState } from '../../../types';
import {
  Users,
  Search,
  Building2,
  Lock,
  Unlock,
  ShieldCheck,
  UserCheck,
  Smartphone,
  Edit2
} from 'lucide-react';

interface RbacUsersTabProps {
  users: RbacUser[];
  roles: RbacRole[];
  onSelectUser: (user: RbacUser) => void;
  onViewDetail: (item: SuperAdminDetailItem) => void;
  onChangeUserRole: (userId: number, newRoleId: number) => void;
  onToggleUserStatus: (userId: number) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState | null>>;
}

export const RbacUsersTab: React.FC<RbacUsersTabProps> = ({
  users,
  roles,
  onSelectUser,
  onViewDetail,
  onChangeUserRole,
  onToggleUserStatus,
  onNotify,
  setConfirmDialog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Change Role Modal inside row
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [selectedNewRoleId, setSelectedNewRoleId] = useState<number>(1);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'ALL' || u.roleCode === roleFilter;
      const matchBranch = branchFilter === 'ALL' || u.branchScope === branchFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      return matchSearch && matchRole && matchBranch && matchStatus;
    });
  }, [users, searchTerm, roleFilter, branchFilter, statusFilter]);

  // Handle Toggle Status with Rule #19 ConfirmDialog
  const handleToggleStatusClick = (user: RbacUser) => {
    const willLock = user.status === 'ACTIVE';

    setConfirmDialog({
      isOpen: true,
      title: willLock ? 'Xác Nhận Khóa Tài Khoản Quản Trị' : 'Xác Nhận Kích Hoạt Lại Tài Khoản',
      message: willLock
        ? `CẢNH BÁO AN NINH: Bạn có chắc muốn khóa tài khoản "${user.username} (${user.fullName})"? Người dùng sẽ bị ngắt phiên làm việc và không thể đăng nhập vào bất kỳ phân hệ nào.`
        : `Bạn có muốn mở khóa và cho phép tài khoản "${user.username} (${user.fullName})" tiếp tục truy cập các phân hệ theo vai trò ${user.roleName}?`,
      variant: willLock ? 'danger' : 'primary',
      confirmText: willLock ? 'Khóa Tài Khoản Ngay' : 'Mở Khóa',
      cancelText: 'Hủy Bỏ',
      onConfirm: () => {
        onToggleUserStatus(user.id);
        setConfirmDialog(null);
      },
    });
  };

  // Handle Role Change with Rule #19 ConfirmDialog
  const handleSaveNewRole = (user: RbacUser, targetRoleId: number) => {
    const targetRole = roles.find((r) => r.id === targetRoleId);
    if (!targetRole) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Cập Nhật Vai Trò Người Dùng',
      message: `Bạn đang thay đổi vai trò của "${user.fullName}" từ "${user.roleName}" sang "${targetRole.name}". Quyền hạn truy cập API và phân hệ sẽ được cập nhật ngay lập tức cho tài khoản này.`,
      variant: targetRole.tier === 'TIER_1_SOVEREIGN' ? 'danger' : 'warning',
      confirmText: 'Đồng Bộ Phân Quyền',
      cancelText: 'Hủy Bỏ',
      onConfirm: () => {
        onChangeUserRole(user.id, targetRoleId);
        setEditingUserId(null);
        setConfirmDialog(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* TẦNG L1: FILTER & COMMAND BAR (M41 SPEC) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm theo username, họ tên hoặc email doanh nghiệp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Tất Cả Vai Trò</option>
            {roles.map((r) => (
              <option key={r.id} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Mọi Chi Nhánh Scope</option>
            <option value="ALL">Toàn Quốc (HQ)</option>
            <option value="BR_HO">Miền Bắc (BR_HO)</option>
            <option value="BR_HCM">Miền Nam (BR_HCM)</option>
            <option value="BR_DN">Miền Trung (BR_DN)</option>
            <option value="BR_CT">Tây Nam Bộ (BR_CT)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Mọi Trạng Thái</option>
            <option value="ACTIVE">Chỉ Hoạt Động (ACTIVE)</option>
            <option value="LOCKED">Chỉ Bị Khóa (LOCKED)</option>
          </select>
        </div>
      </div>

      {/* TẦNG L3: USERS DATA TABLE (M41 SPEC) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Phân Bổ Tài Khoản Người Dùng ({filteredUsers.length} / {users.length})
            </h3>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-200 dark:border-emerald-800">
            Multi-Tenant Isolation Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3 px-4">Tài Khoản & Định Danh</th>
                <th className="py-3 px-3">Vai Trò RBAC Gán</th>
                <th className="py-3 px-3">Phạm Vi Chi Nhánh</th>
                <th className="py-3 px-3">Bảo Mật MFA</th>
                <th className="py-3 px-3">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {filteredUsers.map((user) => {
                const isEditingThisUser = editingUserId === user.id;

                return (
                  <tr
                    key={user.id}
                    onClick={() => onSelectUser(user)}
                    className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl ${user.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}
                        >
                          {user.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{user.username}</span>
                            <span className="font-mono text-[10px] text-slate-400">#{user.id}</span>
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white text-xs block mt-0.5">{user.fullName}</span>
                          <span className="text-slate-500 dark:text-slate-400 text-[10px] block font-mono">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      {isEditingThisUser ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={selectedNewRoleId}
                            onChange={(e) => setSelectedNewRoleId(Number(e.target.value))}
                            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2 py-1 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleSaveNewRole(user, selectedNewRoleId)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white block">{user.roleName}</span>
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 inline-block mt-1">
                            {user.roleCode}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px]">{user.branchName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                        {user.mfaEnabled ? (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 text-xs font-bold rounded-full border">
                            MFA BẬT
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-950 dark:bg-amber-950/90 dark:text-amber-200 rounded text-xs font-bold border border-amber-300 dark:border-amber-700">
                            CHƯA BẬT
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      {user.status === 'ACTIVE' ? (
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 text-xs font-bold rounded-full border">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 text-xs font-bold rounded-full border">
                          LOCKED
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onViewDetail({ type: 'USER', data: user })}
                          className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-all cursor-pointer"
                        >
                          Chi Tiết
                        </button>
                        <button
                          onClick={() => {
                            setEditingUserId(user.id);
                            setSelectedNewRoleId(user.roleId);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-all cursor-pointer"
                          title="Đổi vai trò phân quyền"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatusClick(user)}
                          className={`p-1 rounded-lg transition-all cursor-pointer ${
                            user.status === 'ACTIVE'
                              ? 'text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                              : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                          }`}
                          title={user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {user.status === 'ACTIVE' ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>
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
  );
};
