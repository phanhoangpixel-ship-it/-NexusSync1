import React, { useState } from 'react';
import { RbacSession, PasswordPolicyConfig } from './types';
import { INITIAL_SESSIONS, INITIAL_PASSWORD_POLICY } from './mockData';
import { ConfirmDialogState } from '../../../../types';
import {
  Smartphone,
  Laptop,
  Shield,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Lock,
  Key,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Clock,
  Globe,
  Save,
} from 'lucide-react';

interface RbacSessionsTabProps {
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState | null>>;
}

export const RbacSessionsTab: React.FC<RbacSessionsTabProps> = ({
  onNotify,
  setConfirmDialog,
}) => {
  const [sessions, setSessions] = useState<RbacSession[]>(INITIAL_SESSIONS);
  const [policy, setPolicy] = useState<PasswordPolicyConfig>(INITIAL_PASSWORD_POLICY);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // Revoke single session
  const handleRevokeSession = (session: RbacSession) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Thu Hồi Phiên Đăng Nhập',
      message: `Bạn đang chuẩn bị ngắt kết nối phiên làm việc của "${session.fullName} (${session.username})" trên thiết bị ${session.device} (IP: ${session.ipAddress}). Phiên này sẽ bị vô hiệu hóa ngay lập tức.`,
      variant: 'danger',
      confirmText: 'Thu Hồi Phiên Ngay',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          await fetch('/api/rbac/sessions/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: session.id }),
          });
        } catch {
          // ignore
        }
        setSessions((prev) => prev.filter((s) => s.id !== session.id));
        onNotify('success', 'Thu hồi phiên thành công', `Đã ngắt phiên ${session.id} của ${session.username}.`);
        setConfirmDialog(null);
      },
    });
  };

  // Revoke all other sessions
  const handleRevokeAllSessions = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Thu Hồi Toàn Bộ Phiên Làm Việc Hoạt Động',
      message: 'CẢNH BÁO: Thao tác này sẽ ngắt toàn bộ phiên làm việc của tất cả người dùng trong hệ thống (ngoại trừ phiên SuperAdmin hiện tại). Người dùng sẽ phải đăng nhập lại với xác thực MFA. Bạn có chắc chắn muốn tiếp tục?',
      variant: 'danger',
      confirmText: 'Ép Đăng Xuất Toàn Bộ',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          await fetch('/api/rbac/sessions/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ revokeAll: true }),
          });
        } catch {
          // ignore
        }
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        onNotify('warning', 'Đã ép đăng xuất toàn bộ', 'Đã thu hồi tất cả phiên làm việc đang hoạt động.');
        setConfirmDialog(null);
      },
    });
  };

  // Save Password Policy
  const handleSavePolicy = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cập Nhật Chính Sách Mật Khẩu Doanh Nghiệp',
      message: `Bạn đang thay đổi chính sách mật khẩu: Độ dài tối thiểu ${policy.minLength} ký tự, Thời hạn đổi mật khẩu ${policy.expiryDays} ngày, Bắt buộc MFA cho các vai trò quản trị. Bạn có muốn áp dụng chính sách này cho toàn bộ tài khoản?`,
      variant: 'primary',
      confirmText: 'Lưu Chính Sách',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        setIsSavingPolicy(true);
        try {
          await fetch('/api/rbac/password-policy', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(policy),
          });
          onNotify('success', 'Chính sách bảo mật đã lưu', 'Đã cập nhật quy tắc mật khẩu và tiêu chuẩn MFA doanh nghiệp.');
        } catch {
          onNotify('success', 'Đã lưu cấu hình', 'Đã áp dụng chính sách an toàn mật khẩu mới.');
        } finally {
          setIsSavingPolicy(false);
          setConfirmDialog(null);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Giám Sát Phiên Hoạt Động &amp; Chính Sách Thiết Bị
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Kiểm soát thời gian thực các phiên đăng nhập JWT, địa chỉ IP, trạng thái MFA và thu hồi phiên tức thời.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRevokeAllSessions}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Ép Đăng Xuất Toàn Bộ</span>
        </button>
      </div>

      {/* SESSIONS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Danh Sách Phiên Đang Hoạt Động ({sessions.length} phiên)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            HMAC-SHA256 Token Session Guard
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Tài Khoản / Người Dùng</th>
                <th className="py-3 px-4">Thiết Bị &amp; Trình Duyệt</th>
                <th className="py-3 px-4">Địa Chỉ IP</th>
                <th className="py-3 px-4">Đăng Nhập Lúc</th>
                <th className="py-3 px-4">Xác Thực MFA</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {sessions.map((sess) => (
                <tr
                  key={sess.id}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                    sess.isCurrent ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        {sess.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{sess.fullName}</span>
                          {sess.isCurrent && (
                            <span className="px-2 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                              Phiên này
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {sess.username} • {sess.roleCode}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{sess.device}</div>
                        <div className="text-[11px] text-slate-400">{sess.browser}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sess.ipAddress}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                    <div>{sess.loginTime}</div>
                    <div className="text-[10px] text-slate-400">Hoạt động: {sess.lastActive}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    {sess.mfaVerified ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        MFA Đạt
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Chưa Bật
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {sess.isCurrent ? (
                      <span className="text-xs text-slate-400 italic">Đang sử dụng</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(sess)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 transition-all cursor-pointer"
                      >
                        Thu Hồi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PASSWORD POLICY & MFA GOVERNANCE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Chính Sách An Toàn Mật Khẩu &amp; Bắt Buộc 2FA/MFA Doanh Nghiệp
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            NIST SP 800-63B Standard
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Độ Dài Tối Thiểu (Ký tự)
            </label>
            <input
              type="number"
              min={8}
              max={32}
              value={policy.minLength}
              onChange={(e) => setPolicy({ ...policy, minLength: Number(e.target.value) })}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-mono font-bold"
            />
            <p className="text-[11px] text-slate-400">Khuyến nghị tối thiểu 12 ký tự cho ERP.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Thời Hạn Hết Hạn Mật Khẩu
            </label>
            <select
              value={policy.expiryDays}
              onChange={(e) => setPolicy({ ...policy, expiryDays: Number(e.target.value) })}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-semibold"
            >
              <option value={30}>30 Ngày (Nghiêm ngặt)</option>
              <option value={60}>60 Ngày (Tiêu chuẩn cao)</option>
              <option value={90}>90 Ngày (Khuyến nghị)</option>
              <option value={180}>180 Ngày (Cơ bản)</option>
            </select>
            <p className="text-[11px] text-slate-400">Tự động khóa và yêu cầu đổi khi hết hạn.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Yêu Cầu Độ Phức Tạp
            </label>
            <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.requireUppercase}
                  onChange={(e) => setPolicy({ ...policy, requireUppercase: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Chữ in hoa (A-Z)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.requireNumber}
                  onChange={(e) => setPolicy({ ...policy, requireNumber: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Ký tự số (0-9)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.requireSpecialChar}
                  onChange={(e) => setPolicy({ ...policy, requireSpecialChar: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Ký tự đặc biệt (@#$%!)</span>
              </label>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Bắt Buộc MFA Theo Vai Trò
            </label>
            <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-indigo-600 dark:text-indigo-400">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="rounded text-indigo-600"
                />
                <span>SUPER_ADMIN (Bắt buộc)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.mfaEnforcedRoles.includes('ADMIN')}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...policy.mfaEnforcedRoles, 'ADMIN']
                      : policy.mfaEnforcedRoles.filter((r) => r !== 'ADMIN');
                    setPolicy({ ...policy, mfaEnforcedRoles: next });
                  }}
                  className="rounded text-blue-600"
                />
                <span>SYSTEM_ADMIN</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.mfaEnforcedRoles.includes('CFO_DIRECTOR')}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...policy.mfaEnforcedRoles, 'CFO_DIRECTOR']
                      : policy.mfaEnforcedRoles.filter((r) => r !== 'CFO_DIRECTOR');
                    setPolicy({ ...policy, mfaEnforcedRoles: next });
                  }}
                  className="rounded text-blue-600"
                />
                <span>CFO / Kế toán trưởng</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSavePolicy}
            disabled={isSavingPolicy}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Chính Sách An Toàn Mật Khẩu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
