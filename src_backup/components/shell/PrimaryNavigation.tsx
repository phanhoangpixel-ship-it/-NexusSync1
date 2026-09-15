import React, { useState } from 'react';
import { MODULE_REGISTRY, ModuleDefinition } from '../../config/moduleRegistry';
import * as Icons from 'lucide-react';
import { FavoriteItem, RecentVisitItem } from '../../types/recentFavorites';

interface PrimaryNavigationProps {
  currentModuleId: string;
  onSelectModule: (module: ModuleDefinition) => void;
  onOpenOmnibar?: () => void;
  onOpenWorkQueue?: () => void;
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  allowedModules?: string[];
  recents: RecentVisitItem[];
  favorites: FavoriteItem[];
  onOpenRecentFavorites: () => void;
  onOpenPreferences?: () => void;
  currentBranch?: string;
  onBranchChange?: (branchId: string) => void;
  currentProfile?: string;
  onProfileChange?: (profileId: string) => void;
  canGoBack?: boolean;
  previousModule?: ModuleDefinition | null;
  onGoBack?: () => void;
}

export const PrimaryNavigation: React.FC<PrimaryNavigationProps> = ({
  currentModuleId,
  onSelectModule,
  onOpenOmnibar,
  onOpenWorkQueue,
  onOpenProfile,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  allowedModules,
  recents,
  favorites,
  onOpenRecentFavorites,
  onOpenPreferences,
  currentBranch,
  onBranchChange,
  currentProfile,
  onProfileChange,
  canGoBack = false,
  previousModule = null,
  onGoBack,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const getModule = (id: string) => MODULE_REGISTRY.find(m => m.moduleId === id);

  const isModuleAllowed = (moduleId: string) => {
    if (!allowedModules) return true;
    if (allowedModules.includes('*')) return true;
    return allowedModules.includes(moduleId);
  };

  const WORKSPACES_HIERARCHY = [
    {
      name: '01. Thương Mại & Bán Hàng',
      icon: 'ShoppingBag',
      modules: ['M07', 'M12', 'M13', 'M14', 'M15', 'M16', 'M41']
    },
    {
      name: '02. Mua Sắm & Cung Ứng',
      icon: 'ShoppingCart',
      modules: ['M08', 'M09', 'M10', 'M11']
    },
    {
      name: '03. Kho Vận & Hậu Cần',
      icon: 'Package',
      modules: ['M17', 'M18', 'M19', 'M20', 'M21', 'M22', 'M23', 'M24', 'M36']
    },
    {
      name: '04. Sản Xuất & Vận Hành',
      icon: 'Factory',
      modules: ['M06', 'M25', 'M26', 'M27', 'M28', 'M35']
    },
    {
      name: '05. Tài Chính & Kế Toán',
      icon: 'DollarSign',
      modules: ['M30', 'M31', 'M32', 'M33', 'M34', 'M42']
    },
    {
      name: '06. Quản Trị & Hệ Thống',
      icon: 'ShieldCheck',
      modules: ['M02', 'M03', 'M04', 'M05', 'M29', 'M37', 'M38', 'M39', 'M40']
    }
  ];

  const filteredWorkspacesHierarchy = WORKSPACES_HIERARCHY.map(group => {
    const visibleModules = group.modules.filter(isModuleAllowed);
    return {
      ...group,
      modules: visibleModules
    };
  }).filter(group => group.modules.length > 0);

  return (
    <aside
      id="nexus-l1-sidebar"
      className="w-64 bg-[#141C2E] text-slate-300 flex flex-col shrink-0 select-none border-r border-slate-800 z-20"
    >
      {/* Workspace Context Header */}
      <div className="px-3.5 py-2.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider whitespace-nowrap">
            Phân hệ ERP
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/90 text-slate-400 border border-slate-700/80 whitespace-nowrap">
          29 Workspaces
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-6">
        {/* Core Navigation */}
        <div className="space-y-1">
          <button
            onClick={() => {
              const m01 = getModule('M01');
              if (m01) onSelectModule(m01);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              currentModuleId === 'M01' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Icons.Home className="w-4 h-4" />
            <span>Home</span>
          </button>
          <button
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer"
            onClick={onOpenNotifications}
            title="Trung tâm Hoạt động & Tác vụ Hợp nhất (Hàng chờ SLA & Thông báo)"
          >
            <div className="flex items-center gap-2.5">
              <Icons.Activity className="w-4 h-4 text-amber-400" />
              <span>Hoạt động & Tác vụ</span>
            </div>
            {unreadNotificationsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 text-[9px] flex items-center justify-center font-bold font-mono">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>

        {/* Enterprise Workspaces (L2 - 6 Domain Groups & 29+ Workspaces) */}
        <div>
          <div className="px-3 flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">
            <span>6 Domain Groups</span>
            <span className="font-mono text-slate-600">29+ Workspaces</span>
          </div>
          <div className="space-y-1">
            {filteredWorkspacesHierarchy.map((ws) => {
              // Check if current module is inside this workspace
              const isActiveWorkspace = ws.modules.includes(currentModuleId);
              const isCollapsed = collapsedGroups[ws.name] ?? (isActiveWorkspace || ws.name.includes('Quản Trị & Hệ Thống') ? false : true);
              const IconComp = (Icons as any)[ws.icon] || Icons.Folder;

              return (
                <div key={ws.name} className="flex flex-col">
                  <button
                    onClick={() => toggleGroup(ws.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActiveWorkspace ? 'text-white bg-slate-800/60 font-semibold' : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconComp className={`w-4 h-4 shrink-0 ${isActiveWorkspace ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span className="truncate">{ws.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {ws.modules.length}
                      </span>
                      <Icons.ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? '-rotate-90 text-slate-600' : 'text-slate-400'}`} />
                    </div>
                  </button>
                  
                  {!isCollapsed && (
                    <div className="pl-9 pr-2 mt-1 mb-2 space-y-1 relative before:absolute before:left-[21px] before:top-0 before:bottom-0 before:w-px before:bg-slate-800">
                      {ws.modules.map(modId => {
                        const mod = getModule(modId);
                        if (!mod) return null;
                        const isActive = mod.moduleId === currentModuleId;
                        return (
                          <button
                            key={modId}
                            onClick={() => onSelectModule(mod)}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-[11px] font-medium transition-all truncate ${
                              isActive ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                          >
                            {mod.moduleName}
                          </button>
                        );
                      })}

                      {/* Integrated Quick Utilities for 06. Quản Trị & Hệ Thống */}
                      {ws.name.includes('Quản Trị') && (
                        <div className="pt-2 mt-2 border-t border-slate-800/80 space-y-1">
                          {onOpenProfile && (
                            <button
                              onClick={onOpenProfile}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all group"
                              title="Xem thông tin tài khoản và chuyển đổi vai trò phiên làm việc"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Icons.UserCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span className="truncate">Hồ sơ & Đổi vai trò</span>
                              </div>
                              <span className="text-[9px] font-mono text-slate-500 bg-slate-800/80 px-1 py-0.5 rounded border border-slate-700/50 shrink-0">
                                IAM
                              </span>
                            </button>
                          )}
                          {onOpenPreferences && (
                            <button
                              onClick={onOpenPreferences}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all group"
                              title="Tùy biến giao diện hiển thị, độ tương phản và mật độ thông tin"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Icons.Palette className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span className="truncate">Tùy biến giao diện</span>
                              </div>
                              <span className="text-[9px] font-mono text-slate-500 bg-slate-800/80 px-1 py-0.5 rounded border border-slate-700/50 shrink-0">
                                Theme
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature 5: Persistent "Recent & Favorites" Dock (Global History) */}
        <div>
          <div className="px-3 flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">
            <span>Recent & Favorites</span>
            <button
              onClick={onOpenRecentFavorites}
              className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
              title="Quản lý Lối tắt & Lịch sử"
            >
              <Icons.Settings className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            {favorites.length === 0 && recents.length === 0 ? (
              <div className="px-3 py-2 text-[10px] text-slate-600 italic">
                Chưa có lối tắt ghim hoặc lịch sử.
              </div>
            ) : (
              // Display up to 5 items: prioritize favorites, then add recents
              [
                ...favorites.map(f => ({ ...f, isFavorite: true })),
                ...recents.filter(r => !favorites.some(f => f.moduleId === r.moduleId)).map(r => ({ ...r, isFavorite: false, customGroup: 'Lịch sử' }))
              ].slice(0, 5).map(item => {
                const IconComponent = (Icons as any)[item.iconName] || Icons.FileText;
                return (
                  <button
                    key={item.moduleId}
                    onClick={() => {
                      const mod = MODULE_REGISTRY.find(m => m.moduleId === item.moduleId);
                      if (mod) onSelectModule(mod);
                    }}
                    className="w-full flex items-start gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all text-left group/navitem"
                    title={`${item.moduleName} (${item.customGroup || 'Lịch sử'})`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${item.isFavorite ? 'text-amber-400' : 'text-slate-500'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-slate-200 font-semibold group-hover/navitem:text-blue-400 transition-colors text-[11px]">{item.moduleName}</div>
                      <div className="text-[9px] text-slate-500 truncate flex items-center gap-1 leading-none mt-0.5">
                        <span>{item.moduleId}</span>
                        <span>•</span>
                        <span className="truncate">{item.customGroup || 'Thường xuyên'}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono">NexusSync Connected</span>
        </div>
        <span className="font-mono text-slate-500">v1.2</span>
      </div>
    </aside>
  );
};

