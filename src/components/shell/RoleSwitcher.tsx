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
      className="h-9 flex items-center gap-2 pl-2 pr-3 rounded-xl border border-slate-700/80 hover:border-slate-600 bg-slate-800/90 hover:bg-slate-700/80 text-white transition-all text-left shadow-2xs shrink-0 whitespace-nowrap cursor-pointer"
      title="Chuyển đổi vai trò & Người dùng"
    >
      <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
        <User className="w-3.5 h-3.5" />
      </div>
      <div className="hidden sm:block">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-white leading-none whitespace-nowrap">{currentUser.username}</span>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-blue-700/60 whitespace-nowrap">
            {currentUser.role}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-none mt-0.5 whitespace-nowrap">{currentUser.department}</p>
      </div>
    </button>
  );
};
