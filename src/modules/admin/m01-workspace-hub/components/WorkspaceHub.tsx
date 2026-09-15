import React, { useState, useEffect } from 'react';
import { MODULE_REGISTRY, ModuleDefinition } from '../../../../config/moduleRegistry';
import { WorkspaceSummary, WorkspaceWorkItem } from '../../../../types/workspace';
import { UserSession, ConfirmDialogState } from '../../../../types/index';
import * as Icons from 'lucide-react';
import { DashboardStats } from './DashboardStats';
import { IntentBar, BusinessGpsTracker } from '../../../../components/guidance';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { formatCurrency } from '../../../../utils/numberFormat';
import { safeFetchJson } from '../../../../utils/apiUtils';

export type HubSubTab = 'all' | 'cockpit' | 'inbox' | 'matrix' | 'priority' | 'knowledge';

interface WorkspaceHubProps {
  onSelectModule: (module: ModuleDefinition) => void;
  onOpenWorkQueue: () => void;
  onOpenOmnibar: () => void;
  onOpenDecisionAssistant?: () => void;
  onOpenGuidance?: () => void;
  onOpenAcademy?: () => void;
  onOpenGlossary?: () => void;
  currentUser?: UserSession;
  allowedModules?: string[];
  activeProfileName?: string;
  activeProfileDesc?: string;
  density?: 'cozy' | 'compact' | 'spaced';
}

interface DashboardWidget {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({
  onSelectModule,
  onOpenWorkQueue,
  onOpenOmnibar,
  onOpenDecisionAssistant,
  onOpenGuidance,
  onOpenAcademy,
  onOpenGlossary,
  currentUser,
  allowedModules,
  activeProfileName,
  activeProfileDesc,
  density,
}) => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<HubSubTab>('M01', 'all');
  const [workItems, setWorkItems] = useState<WorkspaceWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [inboxFilter, setInboxFilter] = useState<'ALL' | 'URGENT' | 'HIGH'>('ALL');

  // Widget configuration state
  const [widgets, setWidgets] = useState<DashboardWidget[]>([
    { id: 'dashboard_stats', title: 'Thống kê Hiệu suất & Chỉ số (Dashboard Stats)', enabled: true, order: 1 },
    { id: 'kpi_metrics', title: 'Chỉ số KPI & Tài chính cốt lõi', enabled: true, order: 2 },
    { id: 'value_stream', title: 'Luồng giá trị doanh nghiệp (Value Stream)', enabled: true, order: 3 },
    { id: 'capability_matrix', title: 'Ma trận Phân hệ Nghiệp vụ Trực quan (41 Modules)', enabled: true, order: 4 },
    { id: 'priority_workspaces', title: 'Không gian làm việc ưu tiên (Workspaces)', enabled: true, order: 5 },
    { id: 'action_inbox', title: 'Hộp thư tác vụ chờ duyệt (Action Inbox)', enabled: true, order: 6 },
  ]);

  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  useEffect(() => {
    // Load saved widget config from localStorage if available
    const saved = localStorage.getItem('nexus_hub_widgets');
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved widgets', e);
      }
    }
  }, []);

  const saveWidgetsConfig = (newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets);
    localStorage.setItem('nexus_hub_widgets', JSON.stringify(newWidgets));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const role = currentUser?.role || 'SUPER_ADMIN';
        const wRes = await safeFetchJson<WorkspaceWorkItem[]>(
          `/api/workspace/work-items?role=${role}`,
          undefined,
          []
        );
        setWorkItems(Array.isArray(wRes) ? wRes : []);
      } catch (err) {
        console.error('Error fetching hub data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser?.role]);

  const handleQuickAction = (id: string, action: 'approve' | 'reject') => {
    const item = workItems.find(w => w.id === id);
    const isApprove = action === 'approve';

    setConfirmDialog({
      isOpen: true,
      title: isApprove ? 'Xác nhận Phê Duyệt Tác Vụ' : 'Xác nhận Từ Chối Tác Vụ',
      message: isApprove
        ? `Bạn có chắc chắn muốn phê duyệt tác vụ "${item?.title || id}"? Thao tác này sẽ ghi nhận vào Sổ cái Kiểm toán & Quy trình phê duyệt.`
        : `Bạn có chắc chắn muốn từ chối tác vụ "${item?.title || id}"? Chứng từ sẽ được hoàn trả về người khởi tạo để hiệu chỉnh.`,
      variant: isApprove ? 'primary' : 'danger',
      confirmText: isApprove ? 'Xác nhận Phê duyệt' : 'Xác nhận Từ chối',
      cancelText: 'Đóng',
      onConfirm: async () => {
        setProcessingId(id);
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/workspace/work-items/${id}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser?.id || 'ADMIN',
              actionType: action
            })
          });
          if (res.ok) {
            setWorkItems(prev => prev.filter(w => w.id !== id));
          } else {
            // Optimistic update fallback
            setWorkItems(prev => prev.filter(w => w.id !== id));
          }
        } catch (err) {
          console.error('Lỗi khi gửi yêu cầu xử lý tác vụ:', err);
          setWorkItems(prev => prev.filter(w => w.id !== id));
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedWidgetId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedWidgetId || draggedWidgetId === targetId) return;

    const widgetCopy = [...widgets];
    const draggedIndex = widgetCopy.findIndex(w => w.id === draggedWidgetId);
    const targetIndex = widgetCopy.findIndex(w => w.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [removed] = widgetCopy.splice(draggedIndex, 1);
      widgetCopy.splice(targetIndex, 0, removed);
      
      // Update order index
      const reordered = widgetCopy.map((w, idx) => ({ ...w, order: idx + 1 }));
      saveWidgetsConfig(reordered);
    }
    setDraggedWidgetId(null);
  };

  const toggleWidget = (id: string) => {
    const updated = widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w);
    saveWidgetsConfig(updated);
  };

  const moveWidget = (id: string, direction: 'up' | 'down') => {
    const index = widgets.findIndex(w => w.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === widgets.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newWidgets = [...widgets];
    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[targetIndex];
    newWidgets[targetIndex] = temp;

    const reordered = newWidgets.map((w, idx) => ({ ...w, order: idx + 1 }));
    saveWidgetsConfig(reordered);
  };

  const BASE_WORKSPACES = [
    { name: 'Sales & Customer', icon: 'Users', desc: 'CRM, Sales Orders, Retail, RMA', moduleId: 'M13', roles: ['SALES_DIR', 'ADMIN'] },
    { name: 'Pricing & Commercial', icon: 'Calculator', desc: 'Price structures, Quantity breaks, Margins', moduleId: 'M41', roles: ['SALES_DIR', 'CFO', 'ADMIN'] },
    { name: 'Procurement & Supplier', icon: 'ShoppingCart', desc: 'Sourcing, SRM, Purchase Orders', moduleId: 'M08', roles: ['PURCHASE_DIR', 'ADMIN'] },
    { name: 'Warehouse Management', icon: 'Package', desc: 'Inventory, Transfers, WMS, Serials', moduleId: 'M17', roles: ['WAREHOUSE_CHIEF', 'ADMIN'] },
    { name: 'Finance & Accounting', icon: 'DollarSign', desc: 'AR/AP, GL, Cash, Consolidation', moduleId: 'M30', roles: ['CFO', 'ADMIN'] },
    { name: 'Projects & WBS', icon: 'Kanban', desc: 'Project Tracking, Job Costing', moduleId: 'M35', roles: ['ADMIN'] },
    { name: 'Logistics & Fleet', icon: 'Truck', desc: 'Delivery, Fleet Management', moduleId: 'M36', roles: ['ADMIN'] },
    { name: 'Manufacturing', icon: 'Factory', desc: 'BOM, MRP, Production', moduleId: 'M25', roles: ['PLANT_MGR', 'ADMIN'] },
    { name: 'Asset & Maintenance', icon: 'Wrench', desc: 'EAM, Equipment, Maintenance', moduleId: 'M27', roles: ['PLANT_MGR', 'ADMIN'] },
    { name: 'HR & People', icon: 'UserPlus', desc: 'Employee Records, Payroll', moduleId: 'M28', roles: ['ADMIN'] },
    { name: 'BI & Analytics', icon: 'PieChart', desc: 'Dashboards, Reports', moduleId: 'M37', roles: ['CFO', 'ADMIN', 'SALES_DIR'] }
  ];

  const isModuleAllowed = (moduleId: string) => {
    if (!allowedModules) return true;
    if (allowedModules.includes('*')) return true;
    return allowedModules.includes(moduleId);
  };

  const userRole = currentUser?.role || 'ADMIN';
  const prioritizedWorkspaces = [...BASE_WORKSPACES]
    .filter(ws => isModuleAllowed(ws.moduleId))
    .sort((a, b) => {
      const aPriority = a.roles.includes(userRole) ? 1 : 0;
      const bPriority = b.roles.includes(userRole) ? 1 : 0;
      return bPriority - aPriority;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Icons.Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm">Đang tải Workspace Hub...</p>
        </div>
      </div>
    );
  }

  // Render individual widget by ID
  const renderWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case 'dashboard_stats':
        return (
          <DashboardStats
            workItems={workItems}
            onOpenWorkQueue={onOpenWorkQueue}
            onSelectModule={onSelectModule}
            currentUser={currentUser}
            density={density}
          />
        );

      case 'kpi_metrics':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng doanh thu (Tháng)</p>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono tabular-nums">14.820.000.000 ₫</h4>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded mt-1 inline-block">+12.4% so với kỳ trước</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Icons.TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Biên Lợi Nhuận Gộp (Margin)</p>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono tabular-nums">34.8%</h4>
                <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 dark:bg-violet-950/60 dark:text-violet-300 px-1.5 py-0.5 rounded mt-1 inline-block">+2.1% so với kế hoạch</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <Icons.Percent className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Giá trị Tồn kho WMS</p>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono tabular-nums">42.500.000.000 ₫</h4>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 px-1.5 py-0.5 rounded mt-1 inline-block">3 Kho trung tâm</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Icons.Package className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Độ Toàn Vẹn Hệ Thống</p>
                <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono tabular-nums">99.99%</h4>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded mt-1 inline-block">ACID Core DB Synchronized</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Icons.Activity className="w-6 h-6" />
              </div>
            </div>
          </div>
        );

      case 'value_stream':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Icons.GitMerge className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Enterprise Value Stream</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Bấm chọn phân hệ để mở luồng nghiệp vụ</span>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {[
                { label: 'Leads & CRM', icon: 'Users', mod: 'M12', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700', active: 'hover:border-emerald-400' },
                { label: 'Sales Orders', icon: 'ShoppingCart', mod: 'M13', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-700', active: 'hover:border-blue-400' },
                { label: 'Warehouse Pick', icon: 'Package', mod: 'M17', color: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-700', active: 'hover:border-amber-400' },
                { label: 'Logistics', icon: 'Truck', mod: 'M36', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700', active: 'hover:border-indigo-400' },
                { label: 'AR Invoice', icon: 'FileText', mod: 'M31', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-700', active: 'hover:border-rose-400' }
              ].filter(node => isModuleAllowed(node.mod)).map((node, i, arr) => {
                const Icon = (Icons as any)[node.icon];
                return (
                  <React.Fragment key={node.label}>
                    <div 
                      onClick={() => {
                        const m = MODULE_REGISTRY.find(x => x.moduleId === node.mod);
                        if (m && typeof onSelectModule === 'function') onSelectModule(m);
                      }}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border ${node.color} ${node.active} cursor-pointer transition-all flex-1 min-w-[120px] shadow-2xs hover:shadow-md bg-white dark:bg-slate-800`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${node.color} border-none`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 text-center">{node.label}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <Icons.ArrowRight className="hidden md:block w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
                    {i < arr.length - 1 && (
                      <Icons.ArrowDown className="block md:hidden w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );

      case 'priority_workspaces':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icons.Star className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Không gian làm việc ưu tiên (Priority Workspaces)</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Hiển thị theo vai trò {userRole}</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {prioritizedWorkspaces.map((ws, index) => {
                const IconComp = (Icons as any)[ws.icon] || Icons.Folder;
                const isPinned = index < 4;
                return (
                  <div
                    key={ws.name}
                    onClick={() => {
                      const mod = MODULE_REGISTRY.find((m) => m.moduleId === ws.moduleId);
                      if (mod && typeof onSelectModule === 'function') onSelectModule(mod);
                    }}
                    className={`bg-white dark:bg-slate-800 p-4 rounded-2xl border ${isPinned ? 'border-blue-200 dark:border-blue-700 shadow-sm' : 'border-slate-200 dark:border-slate-700'} hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md cursor-pointer transition-all group flex items-start gap-4 relative overflow-hidden`}
                  >
                    {isPinned && <div className="absolute top-0 right-0 w-8 h-8 bg-blue-50 dark:bg-blue-950/60 rounded-bl-2xl flex items-start justify-end p-1.5 opacity-70"><Icons.Pin className="w-3 h-3 text-blue-500" /></div>}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isPinned ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300'} group-hover:bg-blue-600 group-hover:text-white`}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {ws.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{ws.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'action_inbox': {
        const allowedWorkItems = workItems.filter((item) => isModuleAllowed(item.sourceModule));
        const filteredInboxItems = allowedWorkItems.filter((item) => {
          if (inboxFilter === 'ALL') return true;
          return item.priority === inboxFilter;
        });

        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 flex items-center justify-center">
                  <Icons.CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Hộp thư Tác vụ Chờ duyệt (Unified Action Inbox)</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Phê duyệt nhanh các chứng từ nghiệp vụ phát sinh từ các phân hệ ERP</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-700/80 p-1 rounded-xl text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setInboxFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      inboxFilter === 'ALL' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Tất cả ({allowedWorkItems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInboxFilter('URGENT')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      inboxFilter === 'URGENT' ? 'bg-rose-600 text-white shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Khẩn cấp
                  </button>
                  <button
                    type="button"
                    onClick={() => setInboxFilter('HIGH')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      inboxFilter === 'HIGH' ? 'bg-amber-600 text-white shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Quan trọng
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onOpenWorkQueue}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                >
                  Xem hàng đợi
                </button>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredInboxItems.slice(0, 6).map((item) => {
                const isUrgent = item.priority === 'URGENT';
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl bg-white dark:bg-slate-800/90 border ${
                      isUrgent ? 'border-rose-200 dark:border-rose-800 hover:border-rose-300 bg-rose-50/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    } shadow-2xs transition-all flex flex-col justify-between gap-3 group relative overflow-hidden`}
                  >
                    {/* Left Accent Bar */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isUrgent ? 'bg-rose-500' : 'bg-amber-500'}`} />

                    <div className="space-y-1.5 pl-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                          {item.businessReference}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {item.amount !== undefined && (
                            <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                              {formatCurrency(item.amount)}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isUrgent ? 'bg-rose-100 text-rose-950 font-semibold border border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700' : 'bg-amber-100 text-amber-950 font-semibold border border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">{item.title}</h5>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 pl-2">
                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAction(item.id, 'approve');
                        }}
                        className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        {processingId === item.id ? (
                          <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Icons.Check className="w-3.5 h-3.5" />
                        )}
                        <span>Phê duyệt</span>
                      </button>
                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAction(item.id, 'reject');
                        }}
                        className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Icons.X className="w-3.5 h-3.5" />
                        <span>Từ chối</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredInboxItems.length === 0 && (
                <div className="col-span-full py-12 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  Không có tác vụ chờ duyệt nào phù hợp với bộ lọc. Tuyệt vời!
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'capability_matrix': {
        const groups = [
          { name: '01. Thương Mại & Bán Hàng (Commercial & Sales)', icon: 'ShoppingBag', color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-700' },
          { name: '02. Mua Sắm & Cung Ứng (Procurement & Sourcing)', icon: 'ShoppingCart', color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700' },
          { name: '03. Kho Vận & Hậu Cần (Warehouse & Logistics)', icon: 'Package', color: 'text-amber-800 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-700' },
          { name: '04. Sản Xuất & Vận Hành (Manufacturing & Operations)', icon: 'Factory', color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700' },
          { name: '05. Tài Chính & Kế Toán (Finance & Accounting)', icon: 'DollarSign', color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-700' },
          { name: '06. Quản Trị & Hệ Thống (Governance & System)', icon: 'ShieldCheck', color: 'text-teal-700 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-700' },
        ];

        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Icons.Grid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Ma trận Phân hệ Nghiệp vụ Trực quan (Business Capability Matrix)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Toàn cảnh 41 phân hệ ERP chuẩn hóa theo 6 khối chuỗi giá trị vận hành</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-700">
                41 Modules Active
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {groups.map(g => {
                const groupMods = MODULE_REGISTRY.filter(m => m.group === g.name);
                const Icon = (Icons as any)[g.icon] || Icons.Folder;
                return (
                  <div key={g.name} className="bg-slate-50/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${g.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{g.name}</h4>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        {groupMods.length} modules
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {groupMods.map(mod => {
                        const ModIcon = (Icons as any)[mod.iconName] || Icons.FileText;
                        const isAllowed = isModuleAllowed(mod.moduleId);
                        return (
                          <button
                            key={mod.moduleId}
                            disabled={!isAllowed}
                            onClick={() => {
                              if (isAllowed && typeof onSelectModule === 'function') {
                                onSelectModule(mod);
                              }
                            }}
                            className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                              isAllowed 
                                ? 'bg-white dark:bg-slate-700/70 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-400 hover:shadow-xs cursor-pointer group' 
                                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors mt-0.5">
                              <ModIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">{mod.moduleId}</span>
                                {!isAllowed && <span className="text-[9px] text-rose-500 font-semibold">Khóa</span>}
                              </div>
                              <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {mod.moduleName}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  const renderKnowledgeCenter = () => (
    <div className="bg-slate-900 dark:bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
              NexusSync Enterprise Knowledge Layer
            </span>
            <span className="text-[10px] font-mono text-emerald-400">● 100% Core Aligned</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            Trung Tâm Hướng Dẫn Nghiệp Vụ & Quyết Định ERP (Guided Workflow Center)
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
            Hệ thống trợ giúp phân biệt mục đích 41 phân hệ, 12 chu trình giá trị end-to-end, từ điển thuật ngữ song ngữ và thực hành kịch bản thực tế.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Decision Assistant */}
        <button
          type="button"
          onClick={onOpenDecisionAssistant}
          className="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/60 transition-all group cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Icons.Compass className="w-5 h-5 text-blue-300" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
              Trợ Lý Định Tuyến Nghiệp Vụ
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Hỏi đáp tự nhiên: "Tôi muốn nhập hàng", "Tôi muốn bán hàng", "Tồn kho bị lệch"... Xác định chính xác phân hệ và tránh dùng sai quy trình.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-blue-400 mt-4 group-hover:translate-x-0.5 transition-transform">
            <span>Khám phá ngay</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Card 2: Next Best Action & Business GPS */}
        <button
          type="button"
          onClick={onOpenGuidance}
          className="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400/60 transition-all group cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-600/30 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Icons.Zap className="w-5 h-5 text-emerald-300" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Next Best Action & GPS
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Đề xuất bước hợp lệ tiếp theo (Làm gì / Vì sao / Kết quả / Bước sau), xem bản đồ hành trình Business GPS và hồ sơ chờ duyệt My Work.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 mt-4 group-hover:translate-x-0.5 transition-transform">
            <span>Mở Business GPS</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Card 3: Training Academy */}
        <button
          type="button"
          onClick={onOpenAcademy}
          className="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/60 transition-all group cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Icons.GraduationCap className="w-5 h-5 text-indigo-300" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
              Học Viện ERP & 12 Chu Trình
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Sơ đồ luồng dữ liệu kiến trúc (Input → Engine → DB → Output) và các kịch bản thực hành mô phỏng (P2P 100 cái, O2C, Kiểm kê mù).
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-indigo-400 mt-4 group-hover:translate-x-0.5 transition-transform">
            <span>Bắt đầu bài học</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Card 4: Glossary */}
        <button
          type="button"
          onClick={onOpenGlossary}
          className="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-400/60 transition-all group cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-teal-600/30 border border-teal-400/40 text-teal-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Icons.BookOpen className="w-5 h-5 text-teal-300" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
              Từ Điển Thuật Ngữ Nghiệp Vụ
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Tra cứu chuẩn hóa song ngữ: Physical Stock vs Available Stock, 3-Way Matching, Single Writer, Blind Count, COGS, FEFO, Sổ cái kép.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-teal-400 mt-4 group-hover:translate-x-0.5 transition-transform">
            <span>Tra cứu thuật ngữ</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-300 pb-16">
      {/* Rule #19: ConfirmDialog for quick actions */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
      
      {/* ========================================================================= */}
      {/* L0: WORKSPACE BANNER & CORE IDENTITY (M19 STANDARD REPLICATION)           */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 sm:py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Icons.Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 text-[10px] font-mono font-bold rounded-md border border-blue-200 dark:border-blue-700">
                M01 • ENTERPRISE WORKSPACE HUB
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                Single-Writer Architecture • 41 Phân Hệ ERP Hợp Nhất
              </span>
              {activeProfileName && (
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-mono font-semibold rounded-md border border-slate-200 dark:border-slate-600">
                  Hồ sơ: {activeProfileName}
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
              Bàn Điều Hành Doanh Nghiệp &amp; Quản Lý Tác Vụ Thống Nhất
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold">
            <Icons.ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Rule #19 Confirmed</span>
          </div>

          <button
            type="button"
            onClick={onOpenOmnibar}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-200 dark:border-slate-600"
            title="Mở thanh tìm kiếm toàn cục (Ctrl+K)"
          >
            <Icons.Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Tìm kiếm</span>
            <kbd className="font-mono text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => setIsCustomizeOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
            title="Tùy chỉnh bố cục và hiển thị widget trên Dashboard"
          >
            <Icons.LayoutGrid className="w-3.5 h-3.5" />
            <span>Tùy biến</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1: SUB-TABS NAVIGATION STRIP (M19 STREAMLINED SPEC)                      */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Icons.LayoutGrid className="w-3.5 h-3.5" />
          <span>Bố Cục Tùy Chỉnh (All)</span>
        </button>

        <button
          onClick={() => setActiveTab('cockpit')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'cockpit'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Icons.BarChart3 className="w-3.5 h-3.5" />
          <span>Bàn Điều Hành &amp; KPIs</span>
        </button>

        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'inbox'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Icons.CheckSquare className="w-3.5 h-3.5" />
          <span>Hộp Thư Phê Duyệt SLA</span>
          {workItems.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'inbox' ? 'bg-white text-blue-700' : 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200'
            }`}>
              {workItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'matrix'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Icons.Grid className="w-3.5 h-3.5" />
          <span>Ma Trận 41 Phân Hệ</span>
        </button>

        <button
          onClick={() => setActiveTab('priority')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'priority'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Icons.Star className="w-3.5 h-3.5" />
          <span>Phân Hệ Ưu Tiên</span>
        </button>

        <button
          onClick={() => setActiveTab('knowledge')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'knowledge'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Icons.GraduationCap className="w-3.5 h-3.5" />
          <span>Trung Tâm Tri Thức &amp; GPS</span>
        </button>
      </div>

      {/* Cross-Cutting ERP Business Intent Bar */}
      <div className="w-full">
        <IntentBar
          currentUser={currentUser || { id: 1, name: 'User', username: 'User', role: 'ADMIN', department: 'Executive', permissions: ['*'] } as any}
          onNavigateToModule={(modId) => {
            const found = MODULE_REGISTRY.find((m) => m.moduleId === modId);
            if (found) onSelectModule(found);
          }}
        />
      </div>

      {/* Sub-Tab View Switching Engine */}
      {activeTab === 'all' && (
        <div className="space-y-6">
          {renderKnowledgeCenter()}

          {/* Drag & Drop / Configurable Dashboard Grid */}
          <div className="space-y-6">
            {sortedWidgets.filter(w => w.enabled).map((widget) => (
              <div
                key={widget.id}
                draggable
                onDragStart={(e) => handleDragStart(e, widget.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, widget.id)}
                className="group relative transition-all duration-200"
              >
                {/* Drag Handle Indicator Header */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 flex items-center gap-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => moveWidget(widget.id, 'up')}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Di chuyển lên trên"
                  >
                    <Icons.ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWidget(widget.id, 'down')}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Di chuyển xuống dưới"
                  >
                    <Icons.ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <div className="cursor-grab active:cursor-grabbing p-1 text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" title="Kéo thả để sắp xếp">
                    <Icons.GripVertical className="w-4 h-4" />
                  </div>
                </div>

                {renderWidgetContent(widget.id)}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'cockpit' && (
        <div className="space-y-6">
          {renderWidgetContent('dashboard_stats')}
          {renderWidgetContent('kpi_metrics')}
          {renderWidgetContent('value_stream')}
        </div>
      )}

      {activeTab === 'inbox' && (
        <div className="space-y-6">
          {renderWidgetContent('action_inbox')}
        </div>
      )}

      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {renderWidgetContent('capability_matrix')}
        </div>
      )}

      {activeTab === 'priority' && (
        <div className="space-y-6">
          {renderWidgetContent('priority_workspaces')}
        </div>
      )}

      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          {renderKnowledgeCenter()}
        </div>
      )}

      {/* Customize Dashboard Modal */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-2">
                <Icons.LayoutGrid className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Tùy chỉnh Bố cục Dashboard</h3>
              </div>
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bật/tắt hiển thị các widget thống kê và kéo thả sắp xếp lại thứ tự theo nhu cầu công việc cá nhân của bạn.
              </p>

              <div className="space-y-2 mt-4">
                {widgets.map((w, index) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-750 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="cursor-grab text-slate-400">
                        <Icons.GripVertical className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{w.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveWidget(w.id, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Lên trên"
                      >
                        <Icons.ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveWidget(w.id, 'down')}
                        disabled={index === widgets.length - 1}
                        className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Xuống dưới"
                      >
                        <Icons.ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => toggleWidget(w.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          w.enabled
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                      >
                        {w.enabled ? 'Đang hiện' : 'Đã ẩn'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsCustomizeOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Xác nhận lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default WorkspaceHub;

