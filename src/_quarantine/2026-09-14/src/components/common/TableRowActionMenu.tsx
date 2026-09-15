import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export interface RowActionItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  group?: 'read' | 'workflow' | 'danger'; // 3 groups: Read/Analyze, Workflow/Operational, Danger/Delete/Cancel
  shortcut?: string;
  disabled?: boolean;
  hidden?: boolean;
  requiredRole?: string[];
  onClick: () => void;
}

export interface TableRowActionMenuProps {
  actions: RowActionItem[];
  row?: any;
  className?: string;
}

export const TableRowActionMenu: React.FC<TableRowActionMenuProps> = ({
  actions,
  row,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const visibleActions = actions.filter((action) => !action.hidden);
  if (visibleActions.length === 0) return null;

  // Group actions
  const readActions = visibleActions.filter((a) => !a.group || a.group === 'read');
  const workflowActions = visibleActions.filter((a) => a.group === 'workflow');
  const dangerActions = visibleActions.filter((a) => a.group === 'danger');

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
        title="Thao tác hàng"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100 text-xs">
          {readActions.length > 0 && (
            <div className="py-1">
              {readActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    disabled={action.disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!action.disabled) {
                        setIsOpen(false);
                        action.onClick();
                      }
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      action.disabled ? 'opacity-50 cursor-not-allowed' : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />}
                      <span className="font-medium">{action.label}</span>
                    </span>
                    {action.shortcut && (
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {action.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {readActions.length > 0 && (workflowActions.length > 0 || dangerActions.length > 0) && (
            <div className="border-t border-slate-100 my-1" />
          )}

          {workflowActions.length > 0 && (
            <div className="py-1">
              {workflowActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    disabled={action.disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!action.disabled) {
                        setIsOpen(false);
                        action.onClick();
                      }
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      action.disabled ? 'opacity-50 cursor-not-allowed' : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {Icon && <Icon className="w-3.5 h-3.5 text-indigo-600" />}
                      <span className="font-medium">{action.label}</span>
                    </span>
                    {action.shortcut && (
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {action.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {(readActions.length > 0 || workflowActions.length > 0) && dangerActions.length > 0 && (
            <div className="border-t border-slate-100 my-1" />
          )}

          {dangerActions.length > 0 && (
            <div className="py-1">
              {dangerActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    disabled={action.disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!action.disabled) {
                        setIsOpen(false);
                        action.onClick();
                      }
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-rose-50 transition-colors ${
                      action.disabled ? 'opacity-50 cursor-not-allowed' : 'text-rose-600 hover:text-rose-700 font-medium'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {Icon && <Icon className="w-3.5 h-3.5 text-rose-500" />}
                      <span>{action.label}</span>
                    </span>
                    {action.shortcut && (
                      <span className="font-mono text-[10px] text-rose-400 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                        {action.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
