import React from 'react';
import { UserSession } from '../../types';
import { User } from 'lucide-react';
import { dispatchContextChange } from '../../hooks/useWorkspaceContextSync';

interface RoleSwitcherProps {
  currentUser: UserSession;
  onOpenLogin: () => void;
  onSwitchRole?: (roleId: number, roleName: string) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentUser,
  onOpenLogin,
  onSwitchRole,
}) => {
  const handleRoleChange = (roleId: number, roleName: string) => {
    if (onSwitchRole) {
      onSwitchRole(roleId, roleName);
    }
    dispatchContextChange({ roleId, roleName, timestamp: Date.now() });
  };

  return (
    <button
      id="nexus-role-switcher"
      type="button"
      onClick={onOpenLogin}
      className="h-9 flex items-center gap-2 pl-2 pr-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all text-left shadow-2xs shrink-0 whitespace-nowrap"
      title="Chuyển đổi vai trò & Người dùng"
    >
      <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
        <User className="w-3.5 h-3.5" />
      </div>
      <div className="hidden sm:block">
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-slate-900 leading-none whitespace-nowrap">{currentUser.username}</span>
          <span className="text-[9px] font-mono font-bold px-1 rounded bg-purple-100 text-purple-800 whitespace-nowrap">
            {currentUser.role}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-none mt-0.5 whitespace-nowrap">{currentUser.department}</p>
      </div>
    </button>
  );
};
