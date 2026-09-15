import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Layers,
  TrendingUp,
  PieChart,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  ArrowRight,
  Filter,
  Download,
  Settings,
  ShieldCheck,
  Briefcase,
  Save,
  Lock,
  Unlock,
  Sliders
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState, SelectedEntityContext } from '../../../../types';
import { CostingMethodSettingsView } from '../../../admin/m03-system-settings/components/costing/CostingMethodSettingsView';

interface M42CostAllocationWorkspaceProps {
  onSelectEntity?: (entity: SelectedEntityContext | null) => void;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  currentUser?: any;
}

interface CostPool {
  id: string;
  code: string;
  name: string;
  department: string;
  totalAmount: number;
  allocationDriver: 'Direct Labor Hours' | 'Machine Hours' | 'Headcount' | 'Direct Cost Ratio' | 'Revenue Share';
  status: 'ACTIVE' | 'DRAFT' | 'CLOSED';
}

interface CogsItem {
  id: string;
  sku: string;
  productName: string;
  category: string;
  unitsProduced: number;
  directMaterials: number;
  directLabor: number;
  overheadAllocated: number;
  freightIn: number;
  totalCogs: number;
  unitCost: number;
  standardPrice: number;
  grossMarginPercent: number;
}

interface ManagerNotification {
  id: string;
  department: string;
  managerName: string;
  email: string;
  poolCode: string;
  poolName: string;
  allocatedAmount: number;
  sentAt: string;
  status: 'DELIVERED' | 'ACKNOWLEDGED';
}

interface PeriodDraftData {
  savedAt: string;
  pools: CostPool[];
  items: CogsItem[];
  status: 'DRAFT' | 'FINALIZED';
  managerNotifications?: ManagerNotification[];
}

export const M42CostAllocationWorkspace: React.FC<M42CostAllocationWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'allocation' | 'pools' | 'simulation' | 'notifications' | 'costing_method'>('overview');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('2026-08');

  // Period statuses and drafts persistence
  const [periodDataMap, setPeriodDataMap] = useState<Record<string, PeriodDraftData>>(() => {
    try {
      const saved = localStorage.getItem('nexussync_m42_period_drafts');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      '2026-08': {
        savedAt: new Date().toISOString(),
        status: 'DRAFT',
        pools: [
          { id: 'CP-01', code: 'POOL_ADMIN', name: 'Chi phí Quản lý chung & Vận hành Khối Văn phòng', department: 'Ban Giám đốc & Khối Hỗ trợ', totalAmount: 450000000, allocationDriver: 'Headcount', status: 'ACTIVE' },
          { id: 'CP-02', code: 'POOL_MAINT', name: 'Chi phí Bảo trì & Sửa chữa Máy móc Nhà máy', department: 'Khối Kỹ thuật & MRO', totalAmount: 320000000, allocationDriver: 'Machine Hours', status: 'ACTIVE' },
          { id: 'CP-03', code: 'POOL_UTIL', name: 'Chi phí Điện, Nước & Tiện ích Xưởng sản xuất', department: 'Cơ sở hạ tầng', totalAmount: 280000000, allocationDriver: 'Direct Cost Ratio', status: 'ACTIVE' },
          { id: 'CP-04', code: 'POOL_LOG', name: 'Chi phí Vận chuyển & Kho bãi trung tâm', department: 'Logistics', totalAmount: 195000000, allocationDriver: 'Revenue Share', status: 'ACTIVE' },
        ],
        items: [
          {
            id: 'SKU-101',
            sku: 'SKU-IND-SER-01',
            productName: 'Bộ điều khiển công nghiệp PLC-X900',
            category: 'Thiết bị điện tử',
            unitsProduced: 1250,
            directMaterials: 1850000,
            directLabor: 420000,
            overheadAllocated: 310000,
            freightIn: 85000,
            totalCogs: 2665000,
            unitCost: 2665000,
            standardPrice: 3800000,
            grossMarginPercent: 29.87,
          },
          {
            id: 'SKU-102',
            sku: 'SKU-VALVE-HYD',
            productName: 'Van thủy lực áp suất cao VHP-50',
            category: 'Cơ khí chính xác',
            unitsProduced: 3400,
            directMaterials: 920000,
            directLabor: 280000,
            overheadAllocated: 195000,
            freightIn: 45000,
            totalCogs: 1440000,
            unitCost: 1440000,
            standardPrice: 2100000,
            grossMarginPercent: 31.43,
          },
          {
            id: 'SKU-103',
            sku: 'SKU-ROBOT-ARM',
            productName: 'Cánh tay robot lắp ráp tự động RA-4',
            category: 'Tự động hóa',
            unitsProduced: 120,
            directMaterials: 24500000,
            directLabor: 6800000,
            overheadAllocated: 5200000,
            freightIn: 1250000,
            totalCogs: 37750000,
            unitCost: 37750000,
            standardPrice: 49500000,
            grossMarginPercent: 23.74,
          },
          {
            id: 'SKU-104',
            sku: 'SKU-SENSOR-TMP',
            productName: 'Cảm biến nhiệt độ công nghiệp PT100',
            category: 'Thiết bị đo lường',
            unitsProduced: 8500,
            directMaterials: 145000,
            directLabor: 45000,
            overheadAllocated: 32000,
            freightIn: 12000,
            totalCogs: 234000,
            unitCost: 234000,
            standardPrice: 350000,
            grossMarginPercent: 33.14,
          },
        ]
      }
    };
  });

  // Current active data for selectedPeriod
  const currentPeriodData = periodDataMap[selectedPeriod] || {
    savedAt: new Date().toISOString(),
    status: 'DRAFT',
    pools: [
      { id: 'CP-01', code: 'POOL_ADMIN', name: 'Chi phí Quản lý chung & Vận hành Khối Văn phòng', department: 'Ban Giám đốc & Khối Hỗ trợ', totalAmount: 450000000, allocationDriver: 'Headcount', status: 'ACTIVE' },
      { id: 'CP-02', code: 'POOL_MAINT', name: 'Chi phí Bảo trì & Sửa chữa Máy móc Nhà máy', department: 'Khối Kỹ thuật & MRO', totalAmount: 320000000, allocationDriver: 'Machine Hours', status: 'ACTIVE' },
      { id: 'CP-03', code: 'POOL_UTIL', name: 'Chi phí Điện, Nước & Tiện ích Xưởng sản xuất', department: 'Cơ sở hạ tầng', totalAmount: 280000000, allocationDriver: 'Direct Cost Ratio', status: 'ACTIVE' },
      { id: 'CP-04', code: 'POOL_LOG', name: 'Chi phí Vận chuyển & Kho bãi trung tâm', department: 'Logistics', totalAmount: 195000000, allocationDriver: 'Revenue Share', status: 'ACTIVE' },
    ],
    items: [
      {
        id: 'SKU-101',
        sku: 'SKU-IND-SER-01',
        productName: 'Bộ điều khiển công nghiệp PLC-X900',
        category: 'Thiết bị điện tử',
        unitsProduced: 1250,
        directMaterials: 1850000,
        directLabor: 420000,
        overheadAllocated: 310000,
        freightIn: 85000,
        totalCogs: 2665000,
        unitCost: 2665000,
        standardPrice: 3800000,
        grossMarginPercent: 29.87,
      },
      {
        id: 'SKU-102',
        sku: 'SKU-VALVE-HYD',
        productName: 'Van thủy lực áp suất cao VHP-50',
        category: 'Cơ khí chính xác',
        unitsProduced: 3400,
        directMaterials: 920000,
        directLabor: 280000,
        overheadAllocated: 195000,
        freightIn: 45000,
        totalCogs: 1440000,
        unitCost: 1440000,
        standardPrice: 2100000,
        grossMarginPercent: 31.43,
      },
    ]
  };

  const costPools = currentPeriodData.pools;
  const cogsItems = currentPeriodData.items;
  const periodStatus = currentPeriodData.status || 'DRAFT';

  const updateCurrentPeriodData = (updates: Partial<PeriodDraftData>) => {
    const updatedMap = {
      ...periodDataMap,
      [selectedPeriod]: {
        ...currentPeriodData,
        ...updates,
        savedAt: new Date().toISOString(),
      }
    };
    setPeriodDataMap(updatedMap);
    try {
      localStorage.setItem('nexussync_m42_period_drafts', JSON.stringify(updatedMap));
    } catch {
      // ignore
    }
  };

  const [isAllocationRunning, setIsAllocationRunning] = useState(false);

  // Save Draft Action
  const handleSaveDraft = () => {
    if (periodStatus === 'FINALIZED') {
      onNotify('error', 'Cảnh báo sai lệch tài chính', `Kỳ ${selectedPeriod} đã bị khóa sổ (Finalized) hoặc nằm trong mốc chốt sổ cũ. Mọi thao tác chỉnh sửa trực tiếp hoặc lưu bản nháp bị từ chối để bảo vệ tính toàn vẹn số liệu tài chính. Vui lòng mở khóa kỳ trước.`);
      return;
    }
    updateCurrentPeriodData({ status: 'DRAFT' });
    onNotify('success', 'Lưu bản nháp thành công', `Đã lưu trạng thái phân bổ và COGS cho kỳ ${selectedPeriod} vào bản nháp hệ thống. Bạn có thể tiếp tục chỉnh sửa bất kỳ lúc nào.`);
  };

  // Run Allocation Action (with Rule #19 ConfirmDialog)
  const handleRunAllocation = () => {
    if (periodStatus === 'FINALIZED') {
      onNotify('warning', 'Kỳ đã khóa sổ', `Kỳ ${selectedPeriod} đã được Chốt (Finalized). Vui lòng mở khóa (Unlock) nếu cần chạy lại phân bổ.`);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận Chạy Kỳ Phân Bổ Chi Phí & COGS',
      message: `Hệ thống sẽ thực hiện phân bổ ${costPools.length} Cost Pools cho các dòng sản phẩm trong kỳ ${selectedPeriod} theo phương pháp chuẩn Activity-Based Costing (ABC). Bản nháp hiện tại sẽ được cập nhật kết quả tính toán mới.`,
      variant: 'primary',
      confirmText: 'Chạy phân bổ ngay',
      cancelText: 'Hủy bỏ',
      onConfirm: () => {
        setIsAllocationRunning(true);
        setTimeout(() => {
          setIsAllocationRunning(false);
          // Simulate recalculation updates
          updateCurrentPeriodData({ status: 'DRAFT' });
          onNotify('success', 'Phân bổ chi phí thành công', `Đã phân bổ thành công các Cost Pools cho ${cogsItems.length} mặt hàng SKU trong kỳ ${selectedPeriod} (Bản nháp đã được cập nhật).`);
        }, 1000);
      },
    });
  };

  // Finalize Period & Post to GL (Rule #19 ConfirmDialog)
  const handleFinalizePeriod = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận Chốt Số Liệu (Finalize & Post GL)',
      message: `Thao tác này sẽ CHỐT CHÍNH THỨC số liệu phân bổ chi phí & COGS của kỳ ${selectedPeriod}, phát sinh bút toán tự động vào Sổ cái GL (M30) và KHÓA không cho phép chỉnh sửa trực tiếp. Đồng thời, hệ thống sẽ tự động phát hành thông báo tới toàn bộ Quản lý Trung tâm chi phí. Bạn có chắc chắn muốn chốt số liệu không?`,
      variant: 'danger',
      confirmText: 'Chốt số liệu & Ghi GL',
      cancelText: 'Quay lại',
      onConfirm: () => {
        const initialNotifications: ManagerNotification[] = costPools.map((pool, idx) => ({
          id: `NOTIF-${selectedPeriod}-${idx + 1}`,
          department: pool.department,
          managerName: pool.department.includes('Ban Giám đốc') ? 'Nguyễn Văn Minh (CFO)' :
                       pool.department.includes('Kỹ thuật') ? 'Trần Đức Thắng (Head of MRO)' :
                       pool.department.includes('Cơ sở') ? 'Lê Hoàng Long (Facilities Dir.)' : 'Phạm Thị Mai (Logistics Mgr.)',
          email: `${pool.code.toLowerCase().replace('pool_', '')}@nexussync.erp`,
          poolCode: pool.code,
          poolName: pool.name,
          allocatedAmount: pool.totalAmount,
          sentAt: new Date().toLocaleString('vi-VN'),
          status: 'DELIVERED',
        }));

        updateCurrentPeriodData({ 
          status: 'FINALIZED',
          managerNotifications: initialNotifications,
        });
        onNotify('success', 'Chốt số liệu kỳ & Thông báo Quản lý', `Kỳ ${selectedPeriod} đã được Finalize, ghi nhận vào Sổ cái GL và phát hành thông báo tự động tới ${initialNotifications.length} Quản lý Trung tâm chi phí.`);
      },
    });
  };

  // Unlock Period
  const handleUnlockPeriod = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận Mở Khóa Kỳ Kế Toán',
      message: `Việc mở khóa kỳ ${selectedPeriod} sẽ cho phép chỉnh sửa lại phân bổ chi phí. Bút toán GL trước đó sẽ cần được điều chỉnh hoặc đảo ngược.`,
      variant: 'warning',
      confirmText: 'Mở khóa kỳ',
      cancelText: 'Hủy',
      onConfirm: () => {
        updateCurrentPeriodData({ status: 'DRAFT' });
        onNotify('info', 'Đã mở khóa kỳ', `Kỳ ${selectedPeriod} đã chuyển về trạng thái Bản nháp (Draft).`);
      },
    });
  };

  const handleRecalculateCogs = () => {
    if (periodStatus === 'FINALIZED') {
      onNotify('warning', 'Kỳ đã khóa sổ', 'Không thể tính lại COGS cho kỳ đã Finalize.');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Tính lại Giá Vốn Hàng Bán (COGS Recalculation)',
      message: 'Hệ thống sẽ quét lại toàn bộ giao dịch nhập xuất kho từ M17 và cập nhật giá vốn thực tế cho tất cả SKU trong kỳ.',
      variant: 'warning',
      confirmText: 'Tính lại COGS',
      cancelText: 'Đóng',
      onConfirm: () => {
        onNotify('success', 'Đã tính lại COGS', 'Toàn bộ đơn giá vốn SKU đã được cập nhật vào bản nháp kỳ này.');
      },
    });
  };

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto">
      {/* Top Banner / Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 font-mono">
                M42
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Financial Controlling & Cost Accounting
              </span>
              {periodStatus === 'FINALIZED' ? (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" /> ĐÃ CHỐT (FINALIZED)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                  <Save className="w-3 h-3" /> BẢN NHÁP (DRAFT)
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Phân bổ Chi phí & Giá vốn hàng bán (COGS)
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Quản lý trung tâm chi phí (Cost Pools), phân bổ chi phí gián tiếp theo phương pháp ABC và tính toán giá vốn SKU thời gian thực.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-sm">
              <span className="text-slate-500 font-medium px-2">Kỳ:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="2026-08">Tháng 08/2026</option>
                <option value="2026-07">Tháng 07/2026</option>
                <option value="2026-06">Tháng 06/2026</option>
                <option value="Q3-2026">Quý 3/2026 (Lũy kế)</option>
              </select>
            </div>

            <button
              onClick={handleSaveDraft}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl border border-slate-300 shadow-sm transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-slate-600" />
              <span>Lưu bản nháp</span>
            </button>

            <button
              onClick={handleRecalculateCogs}
              disabled={periodStatus === 'FINALIZED'}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl border border-slate-300 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>Tính lại COGS</span>
            </button>

            <button
              onClick={handleRunAllocation}
              disabled={isAllocationRunning || periodStatus === 'FINALIZED'}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Calculator className={`w-4 h-4 ${isAllocationRunning ? 'animate-spin' : ''}`} />
              <span>{isAllocationRunning ? 'Đang xử lý...' : 'Chạy phân bổ'}</span>
            </button>

            {periodStatus === 'FINALIZED' ? (
              <button
                onClick={handleUnlockPeriod}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Mở khóa kỳ</span>
              </button>
            ) : (
              <button
                onClick={handleFinalizePeriod}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Chốt số liệu (Finalize)</span>
              </button>
            )}
          </div>
        </div>

        {periodStatus === 'FINALIZED' && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-900 text-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>Cảnh báo khóa sổ tài chính:</strong> Kỳ {selectedPeriod} đã được chốt số liệu (Finalized) và phát hành bút toán vào Sổ cái GL (M30). Mọi thao tác chỉnh sửa trực tiếp bị khóa để tránh sai lệch số liệu tài chính.
              </span>
            </div>
            <button
              onClick={handleUnlockPeriod}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg transition-all shrink-0 ml-4"
            >
              Mở khóa ngay
            </button>
          </div>
        )}

        {/* Navigation Sub-Tabs (M41 Master Spec) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0 mt-6">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>Tổng quan COGS &amp; Biên LN</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('allocation')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                activeTab === 'allocation'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Phân Bổ Chi Phí Gián Tiếp</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pools')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                activeTab === 'pools'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PieChart className="w-4 h-4 shrink-0" />
              <span>Trung Tâm Chi Phí (Cost Pools)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('simulation')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                activeTab === 'simulation'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4 shrink-0" />
              <span>Mô Phỏng Biên Lợi Nhuận</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                activeTab === 'notifications'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Thông Báo Quản Lý</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
                activeTab === 'notifications' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {currentPeriodData.managerNotifications?.length || 0}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('costing_method')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                activeTab === 'costing_method'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Phương Pháp Giá Vốn</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                activeTab === 'costing_method' ? 'bg-blue-700 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
              }`}>
                CFO
              </span>
            </button>
          </div>

          {/* Right Info Strip */}
          <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Costing Authority
            </span>
            <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
              Landed Cost Allocation
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 max-w-7xl mx-auto w-full flex-1">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Tổng COGS trong kỳ</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold text-slate-900 mt-2 font-mono">
                  {formatCurrency(1245000000)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Khớp hoàn toàn với Sổ cái GL (M30)</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Chi phí gián tiếp phân bổ</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold text-slate-900 mt-2 font-mono">
                  {formatCurrency(1245000000)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
                  <span>Từ 4 Cost Pools chính</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Biên Lợi Nhuận Gộp TB</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold text-emerald-600 mt-2 font-mono">
                  29.45%
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2 font-medium">
                  <span>+1.2% so với kỳ trước</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">SKU Đã Tính Giá Vốn</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Briefcase className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold text-slate-900 mt-2 font-mono">
                  {cogsItems.length} SKU hoạt động
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
                  <span>Trạng thái: {periodStatus === 'FINALIZED' ? 'Đã chốt sổ' : 'Bản nháp'}</span>
                </div>
              </div>
            </div>

            {/* COGS Detailed Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Chi tiết Giá Vốn Hàng Bán (COGS) theo SKU ({selectedPeriod})</h3>
                  <p className="text-sm text-slate-500">Bao gồm Nguyên vật liệu trực tiếp, Nhân công, Chi phí chung phân bổ và Chi phí vận chuyển vào.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm SKU hoặc sản phẩm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                    />
                  </div>
                  <button
                    onClick={() => onNotify('info', 'Xuất báo cáo', 'Đang kết xuất tệp Excel báo cáo COGS chi tiết...')}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl border border-slate-300 shadow-sm transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>Xuất Excel</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                      <th className="py-3.5 px-6">Mã SKU & Tên Sản Phẩm</th>
                      <th className="py-3.5 px-4 text-right">SL Sản Xuất</th>
                      <th className="py-3.5 px-4 text-right">NVL Trực Tiếp</th>
                      <th className="py-3.5 px-4 text-right">Nhân Công</th>
                      <th className="py-3.5 px-4 text-right">CPS Phân Bổ</th>
                      <th className="py-3.5 px-4 text-right">Tổng COGS/Đơn vị</th>
                      <th className="py-3.5 px-4 text-right">Giá Tiêu Chuẩn</th>
                      <th className="py-3.5 px-6 text-right">Biên Lợi Nhuận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {cogsItems
                      .filter(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()) || i.sku.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-900">{item.productName}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{item.sku} • {item.category}</div>
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-medium text-slate-800">
                            {item.unitsProduced.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-right font-mono text-slate-600">
                            {formatCurrency(item.directMaterials)}
                          </td>
                          <td className="py-4 px-4 text-right font-mono text-slate-600">
                            {formatCurrency(item.directLabor)}
                          </td>
                          <td className="py-4 px-4 text-right font-mono text-indigo-600 font-medium">
                            {formatCurrency(item.overheadAllocated)}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(item.unitCost)}
                          </td>
                          <td className="py-4 px-4 text-right font-mono text-slate-600">
                            {formatCurrency(item.standardPrice)}
                          </td>
                          <td className="py-4 px-6 text-right font-mono">
                            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                              {item.grossMarginPercent}%
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'allocation' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Ma trận Phân bổ Chi phí Gián tiếp (Activity-Based Costing)</h3>
                  <p className="text-sm text-slate-500">Quy tắc phân bổ từ các Cost Pools trung tâm xuống các trung tâm chi phí sản xuất trực tiếp và thành phẩm cuối cùng.</p>
                </div>
                {periodStatus !== 'FINALIZED' && (
                  <button
                    onClick={() => onNotify('info', 'Thêm quy tắc', 'Mở cấu hình quy tắc phân bổ chi phí mới.')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm quy tắc mới</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Cost Pool: POOL_ADMIN</span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-md">Hoạt động</span>
                  </div>
                  <h4 className="text-base font-semibold text-slate-900">Chi phí Quản lý chung & Văn phòng</h4>
                  <p className="text-sm text-slate-600">Driver phân bổ: <strong className="text-slate-900">Headcount (Số lượng nhân sự)</strong></p>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Tổng giá trị phân bổ:</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(450000000)}</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Cost Pool: POOL_MAINT</span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-md">Hoạt động</span>
                  </div>
                  <h4 className="text-base font-semibold text-slate-900">Chi phí Bảo trì & Sửa chữa Máy móc</h4>
                  <p className="text-sm text-slate-600">Driver phân bổ: <strong className="text-slate-900">Machine Hours (Số giờ máy chạy)</strong></p>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Tổng giá trị phân bổ:</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(320000000)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pools' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Danh mục Trung tâm Chi phí (Cost Pools)</h3>
                  <p className="text-sm text-slate-500">Tập hợp chi phí trước khi phân bổ vào giá thành sản phẩm.</p>
                </div>
                {periodStatus !== 'FINALIZED' && (
                  <button
                    onClick={() => onNotify('success', 'Tạo Cost Pool', 'Đã mở form tạo mới Cost Pool.')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo Cost Pool</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                      <th className="py-3.5 px-6">Mã & Tên Cost Pool</th>
                      <th className="py-3.5 px-4">Bộ Phận Phụ Trách</th>
                      <th className="py-3.5 px-4">Tiêu Chuẩn Phân Bổ (Driver)</th>
                      <th className="py-3.5 px-4 text-right">Tổng Ngân Sách</th>
                      <th className="py-3.5 px-6 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {costPools.map((pool) => (
                      <tr key={pool.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-900">{pool.name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{pool.code}</div>
                        </td>
                        <td className="py-4 px-4 text-slate-700 font-medium">{pool.department}</td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg border border-slate-200 font-mono">
                            {pool.allocationDriver}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(pool.totalAmount)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                            {pool.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'simulation' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Mô phỏng tác động thay đổi chi phí phân bổ lên biên lợi nhuận</h3>
                <p className="text-sm text-slate-500">Kiểm tra tác động khi chi phí năng lượng hoặc nhân công biến động +/- 10%.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Kịch bản cơ sở (Baseline)</span>
                  <div className="text-2xl font-bold text-slate-900 font-mono">29.45%</div>
                  <p className="text-xs text-slate-600">Biên lợi nhuận trung bình toàn hệ thống hiện tại.</p>
                </div>

                <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/30 space-y-3">
                  <span className="text-xs font-semibold text-indigo-600 uppercase">Kịch bản Chi phí Năng lượng +10%</span>
                  <div className="text-2xl font-bold text-indigo-900 font-mono">28.12%</div>
                  <p className="text-xs text-slate-600">Biên lợi nhuận giảm 1.33% nếu giá điện xưởng tăng.</p>
                </div>

                <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 space-y-3">
                  <span className="text-xs font-semibold text-emerald-600 uppercase">Tối ưu hóa Hiệu suất Máy móc +15%</span>
                  <div className="text-2xl font-bold text-emerald-900 font-mono">31.80%</div>
                  <p className="text-xs text-slate-600">Biên lợi nhuận tăng nhờ giảm chi phí bảo trì phân bổ.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Nhật ký Thông báo Quản lý Trung tâm Chi phí (Cost Center Manager Alerts)</h3>
                  <p className="text-sm text-slate-500">Các thông báo tự động được gửi tới quản lý các phòng ban khi kỳ kế toán được chốt (Finalized) và số liệu đẩy sang Sổ cái chung (GL).</p>
                </div>
                {periodStatus === 'FINALIZED' && (
                  <button
                    onClick={() => {
                      onNotify('success', 'Đã gửi lại thông báo', 'Hệ thống đã gửi lại email & thông báo hệ thống tới toàn bộ Quản lý Cost Center.');
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Gửi lại tất cả thông báo</span>
                  </button>
                )}
              </div>

              {periodStatus !== 'FINALIZED' ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-base font-semibold text-slate-800">Kỳ {selectedPeriod} chưa được chốt số liệu (Finalized)</h4>
                  <p className="text-sm text-slate-500 mt-1">Hệ thống sẽ tự động phát hành thông báo tới các Quản lý Trung tâm chi phí ngay sau khi bạn bấm <strong>"Chốt số liệu (Finalize)"</strong>.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                        <th className="py-3.5 px-6">Quản Lý & Phòng Ban</th>
                        <th className="py-3.5 px-4">Cost Pool Liên Quan</th>
                        <th className="py-3.5 px-4 text-right">Tổng Chi Phí Phân Bổ</th>
                        <th className="py-3.5 px-4">Thời Gian Gửi</th>
                        <th className="py-3.5 px-6 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {(currentPeriodData.managerNotifications || []).map((notif) => (
                        <tr key={notif.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-900">{notif.managerName}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{notif.department} • {notif.email}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-medium text-slate-800">{notif.poolName}</div>
                            <div className="text-xs text-slate-500 font-mono">{notif.poolCode}</div>
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-bold text-indigo-600">
                            {formatCurrency(notif.allocatedAmount)}
                          </td>
                          <td className="py-4 px-4 text-xs font-mono text-slate-600">
                            {notif.sentAt}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 flex items-center justify-center gap-1 w-fit mx-auto">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đã gửi (Delivered)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'costing_method' && (
          <div className="space-y-6">
            <CostingMethodSettingsView
              currentUser={currentUser}
              onNotify={onNotify}
            />
          </div>
        )}
      </div>

      {/* Confirm Dialog (Rule #19 Compliance) */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};
