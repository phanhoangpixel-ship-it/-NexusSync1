import React, { useEffect } from 'react';
import { SYSTEM_ROLES, ENVIRONMENT_PROFILES } from '../../config/moduleRegistry';
import { UserSession } from '../../types';
import { Shield, User, Check, X, Layers } from 'lucide-react';
import { dispatchContextChange } from '../../hooks/useWorkspaceContextSync';

interface SimulatedLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  onSelectUser: (user: UserSession) => void;
  currentProfileId: string;
  onProfileChange: (profileId: string) => void;
}

export const SimulatedLoginModal: React.FC<SimulatedLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  currentProfileId,
  onProfileChange,
}) => {
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

  const usersList: UserSession[] = [
    { id: 1, username: 'admin', name: 'Hoàng Nam (Admin)', role: 'SUPER_ADMIN', department: 'Quản trị hệ thống' },
    { id: 2, username: 'cfo', name: 'Nguyễn Thị Hương (CFO)', role: 'CFO', department: 'Tài chính - Kế toán' },
    { id: 3, username: 'wh_chief', name: 'Trần Văn Mạnh (Thủ kho)', role: 'WAREHOUSE_CHIEF', department: 'Quản lý kho vận' },
    { id: 4, username: 'purchase_dir', name: 'Lê Minh Tuấn (Mua hàng)', role: 'PURCHASE_DIR', department: 'Mua sắm - Cung ứng' },
    { id: 5, username: 'sales_dir', name: 'Phạm Hồng Nhung (Kinh doanh)', role: 'SALES_DIR', department: 'Kinh doanh & Thị trường' },
    { id: 6, username: 'plant_mgr', name: 'Đặng Quốc Huy (Sản xuất)', role: 'PLANT_MGR', department: 'Khối Sản xuất & Kỹ thuật' },
  ];

  return (
    <div
      id="login-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all cursor-pointer select-none"
    >
      <div
        id="login-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 cursor-default select-text"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Thông tin Người dùng & Môi trường</h3>
              <p className="text-xs text-slate-500 mt-0.5">Cấu hình hồ sơ môi trường ERP và vai trò người dùng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Section 1: Environment Profile Switcher */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hồ Sơ Môi Trường (Environment Profile)</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ENVIRONMENT_PROFILES.map((profile) => {
                const isSelected = currentProfileId === profile.id;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => onProfileChange(profile.id)}
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/30'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-slate-900">{profile.name}</span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed flex-1">{profile.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Section 2: User Role / Simulated Login */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mô phỏng Đăng nhập (User Roles)</h4>
            </div>
            <div className="space-y-2">
              {usersList.map((user) => {
                const isCurrent = currentUser.username === user.username;
                return (
                  <div
                    key={user.id}
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/auth/login', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ username: user.username, role: user.role })
                        });
                        const data = await res.json();
                        if (data.token) localStorage.setItem('nexus_jwt', data.token);
                      } catch(e) { console.error(e); }
                      dispatchContextChange({ roleId: user.id, roleName: user.role, timestamp: Date.now() });
                      onSelectUser(user);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isCurrent
                        ? 'border-purple-300 bg-purple-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isCurrent ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{user.name}</span>
                          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            {user.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{user.department}</p>
                      </div>
                    </div>

                    {isCurrent && (
                      <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 text-center">
          Thay đổi vai trò sẽ điều chỉnh trực tiếp các quyền hạn Approve, Reject, Create và bộ lọc dữ liệu.
        </div>
      </div>
    </div>
  );
};
