import React, { useState, useMemo } from 'react';
import { CurrencyInput } from '../../../../components/common/CurrencyInput';
import { DotNumberInput } from '../../../../components/common/DotNumberInput';
import { SelectedEntityContext, ConfirmDialogState } from '../../../../types';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { usePagination } from '../../../../hooks/usePagination';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { L3ContentState } from '../../../../components/common/L3ContentState';
import { DeepLinkBanner } from '../../../../components/common/DeepLinkBanner';
import {
  Percent,
  Award,
  DollarSign,
  Users,
  RefreshCw,
  Download,
  Plus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  BarChart3,
  X,
  FileText,
  AlertTriangle,
  Layers,
  Sliders,
  Check,
  RotateCcw,
  ShoppingCart,
  Eye,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { RuleTier, PayoutRecord, AllocationRecord, ClawbackRecord } from "./types";

export const M14SalesCommissionWorkspace: React.FC<M14SalesCommissionWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'rules' | 'calculations' | 'allocation' | 'clawback' | 'analytics'>('M14', 'rules');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [allocationSearch, setAllocationSearch] = useState('');
  const [clawbackSearch, setClawbackSearch] = useState('');

  // 1. Commission Rule Engine State (Tầng bậc hoa hồng)
  const [ruleTiers, setRuleTiers] = useState<RuleTier[]>([
    { id: 'TIER-01', minRev: 0, maxRev: 500000000, rate: 3.0, desc: 'Doanh số dưới 500 triệu (Tier 1)' },
    { id: 'TIER-02', minRev: 500000001, maxRev: 1000000000, rate: 5.0, desc: 'Doanh số từ 500tr đến 1 Tỷ (Tier 2)' },
    { id: 'TIER-03', minRev: 1000000001, maxRev: 5000000000, rate: 7.5, desc: 'Doanh số vượt 1 Tỷ (Tier 3 - Enterprise)' }
  ]);

  // 2. Commission Calculations / Payouts State
  const [payouts, setPayouts] = useState<PayoutRecord[]>([
    {
      id: 'COM-2026-881',
      salesRep: 'Nguyễn Văn Minh (SR-01)',
      department: 'Enterprise Sales Team A',
      closedRevenue: 1450000000,
      appliedPlan: 'PLAN-2026-Q3',
      commissionRate: '7.5%',
      commissionAmount: 108750000,
      status: 'APPROVED',
      payoutDate: '2026-08-31'
    },
    {
      id: 'COM-2026-882',
      salesRep: 'Trần Thị Mai (SR-02)',
      department: 'Kênh Đại lý Phân phối',
      closedRevenue: 850000000,
      appliedPlan: 'PLAN-2026-RET',
      commissionRate: '5.0%',
      commissionAmount: 42500000,
      status: 'PENDING_APPROVAL',
      payoutDate: '2026-08-31'
    },
    {
      id: 'COM-2026-883',
      salesRep: 'Lê Hoàng Long (SR-03)',
      department: 'SME Commercial Sales',
      closedRevenue: 420000000,
      appliedPlan: 'PLAN-2026-Q3',
      commissionRate: '3.0%',
      commissionAmount: 12600000,
      status: 'PAID',
      payoutDate: '2026-07-31'
    }
  ]);

  // 3. Commission Allocation State (Phân bổ nhóm)
  const [allocations, setAllocations] = useState<AllocationRecord[]>([
    { id: 'AL-101', dealCode: 'SO-2026-0102', totalDealValue: '2.000.000.000 VND', primaryRep: 'Nguyễn Văn Minh (60%)', supportingReps: 'Trần Thị Mai (30%), Lê Hoàng Long (10%)', status: 'ALLOCATED' },
    { id: 'AL-102', dealCode: 'SO-2026-0145', totalDealValue: '850.000.000 VND', primaryRep: 'Trần Thị Mai (70%)', supportingReps: 'Nguyễn Văn Minh (30%)', status: 'PENDING_SPLIT' }
  ]);

  // 4. Dashboard Clawback State (Thu hồi hoa hồng khi trả hàng)
  const [clawbacks, setClawbacks] = useState<ClawbackRecord[]>([
    { id: 'CB-901', originalDeal: 'SO-2026-0088', salesRep: 'Phạm Văn Nam', returnReason: 'Khách hàng hoàn trả 20% thiết bị lỗi', refundedAmount: '150.000.000 VND', clawbackAmount: '7.500.000 VND', status: 'PENDING_DEDUCTION' },
    { id: 'CB-902', originalDeal: 'SO-2026-0042', salesRep: 'Lê Hoàng Long', returnReason: 'Hủy hợp đồng do thay đổi kế hoạch', refundedAmount: '400.000.000 VND', clawbackAmount: '12.000.000 VND', status: 'DEDUCTED_NEXT_PAYOUT' }
  ]);

  // Selected Payout Modal State
  const [selectedPayoutForModal, setSelectedPayoutForModal] = useState<PayoutRecord | null>(null);

  // New Commission Form States
  const [newSalesRep, setNewSalesRep] = useState('');
  const [newRevenue, setNewRevenue] = useState('600,000,000');
  const [newDepartment, setNewDepartment] = useState('Enterprise Sales Team A');

  // New Allocation Form States
  const [allocDealCode, setAllocDealCode] = useState('SO-2026-0200');
  const [allocDealValue, setAllocDealValue] = useState('1.500.000.000 VND');
  const [allocPrimary, setAllocPrimary] = useState('Nguyễn Văn Minh (60%)');
  const [allocSupporting, setAllocSupporting] = useState('Trần Thị Mai (40%)');

  // Rule Engine Editor States
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [editMinRev, setEditMinRev] = useState<number>(0);
  const [editMaxRev, setEditMaxRev] = useState<number>(0);
  const [editRate, setEditRate] = useState<number>(0);
  const [editDesc, setEditDesc] = useState<string>('');

  const [newTierId, setNewTierId] = useState(`TIER-0${ruleTiers.length + 1}`);
  const [newTierMin, setNewTierMin] = useState('5000000001');
  const [newTierMax, setNewTierMax] = useState('10000000000');
  const [newTierRate, setNewTierRate] = useState('10.0');
  const [newTierDesc, setNewTierDesc] = useState('Doanh số siêu lớn (>5 Tỷ)');

  // Filtered calculations
  const filteredPayouts = useMemo(() => {
    return payouts.filter(p => {
      const matchSearch = (p.salesRep ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.id ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.department ?? '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchDept = deptFilter === 'ALL' || (p.department ?? '').includes(deptFilter);
      return matchSearch && matchStatus && matchDept;
    });
  }, [payouts, searchQuery, statusFilter, deptFilter]);

  // Pagination for Payouts
  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    goToPage,
    setPageSize
  } = usePagination({
    totalItems: filteredPayouts.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const displayPayouts = useMemo(() => {
    return paginatedData(filteredPayouts);
  }, [paginatedData, filteredPayouts]);

  // Handlers
  const handleStartEditTier = (tier: RuleTier) => {
    setEditingTierId(tier.id);
    setEditMinRev(tier.minRev);
    setEditMaxRev(tier.maxRev);
    setEditRate(tier.rate);
    setEditDesc(tier.desc);
  };

  const handleSaveEditTier = (id: string) => {
    setRuleTiers(prev => prev.map(t => t.id === id ? { ...t, minRev: editMinRev, maxRev: editMaxRev, rate: editRate, desc: editDesc } : t));
    setEditingTierId(null);
    onNotify('success', 'Cập nhật Rule Engine', `Đã cập nhật tầng bậc ${id} thành công.`);
  };

  const handleAddTier = (e: React.FormEvent) => {
    e.preventDefault();
    const newTier: RuleTier = {
      id: newTierId,
      minRev: Number(newTierMin) || 0,
      maxRev: Number(newTierMax) || 0,
      rate: Number(newTierRate) || 5.0,
      desc: newTierDesc
    };
    setRuleTiers(prev => [...prev, newTier]);
    setNewTierId(`TIER-0${ruleTiers.length + 2}`);
    onNotify('success', 'Thêm Bậc Hoa hồng Mới', `Đã thêm tầng bậc ${newTier.id} vào Rule Engine.`);
  };

  const handleSaveConfigToDB = () => {
    setConfirmDialog({
      isOpen: true,
      variant: 'info',
      title: 'Xác Nhận Lưu Cấu Hình Rule Engine Vào Database',
      message: 'Bạn có chắc chắn muốn lưu toàn bộ thay đổi tầng bậc hoa hồng vào PostgreSQL/Firestore DB không?',
      confirmText: 'Lưu Cấu Hình',
      cancelText: 'Hủy Bỏ',
      onConfirm: () => {
        onNotify('success', 'Đã lưu cấu hình vào Database', 'Toàn bộ Commission Rule Engine đã được persist thành công vào PostgreSQL/Firestore DB.');
      }
    });
  };

  const handleCreateAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocDealCode.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập mã hợp đồng/SO.');
      return;
    }
    const newAl: AllocationRecord = {
      id: `AL-${Math.floor(110 + Math.random() * 90)}`,
      dealCode: allocDealCode,
      totalDealValue: allocDealValue,
      primaryRep: allocPrimary,
      supportingReps: allocSupporting,
      status: 'ALLOCATED'
    };
    setAllocations(prev => [newAl, ...prev]);
    onNotify('success', 'Phân bổ nhóm thành công', `Đã thiết lập tỷ lệ chia hoa hồng cho hợp đồng ${allocDealCode}.`);
  };

  const handleCreatePayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSalesRep.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tên nhân viên kinh doanh.');
      return;
    }
    const revNum = Number(newRevenue.replace(/[^0-9]/g, '')) || 500000000;
    let rate = 3.0;
    if (revNum >= 1000000000) rate = 7.5;
    else if (revNum >= 500000000) rate = 5.0;

    const calculatedAmt = (revNum * rate) / 100;

    const newCom: PayoutRecord = {
      id: `COM-2026-${Math.floor(890 + Math.random() * 100)}`,
      salesRep: newSalesRep,
      department: newDepartment,
      closedRevenue: revNum,
      appliedPlan: 'PLAN-2026-Q3',
      commissionRate: `${rate}%`,
      commissionAmount: calculatedAmt,
      status: 'PENDING_APPROVAL',
      payoutDate: '2026-08-31'
    };
    setPayouts(prev => [newCom, ...prev]);
    setNewSalesRep('');
    onNotify('success', 'Tính toán hoa hồng thành công', `Đã tự động áp dụng Rule Engine, tính ra ${calculatedAmt.toLocaleString()} VND cho ${newSalesRep}.`);
  };

  const handleUpdateStatus = (id: string, newStatus: 'APPROVED' | 'PAID') => {
    setConfirmDialog({
      isOpen: true,
      variant: 'warning',
      title: `Xác Nhận Phê Duyệt Payout ${id}`,
      message: `Bạn có muốn chuyển trạng thái khoản chi hoa hồng ${id} thành ${newStatus} và phát hành lệnh hạch toán GL không?`,
      confirmText: 'Phê Duyệt Ngay',
      cancelText: 'Hủy Bỏ',
      onConfirm: () => {
        setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
        onNotify('success', 'Cập nhật trạng thái', `Đã chuyển payout ${id} sang trạng thái ${newStatus}.`);
      }
    });
  };

  const handleSelectPayout = (payout: PayoutRecord) => {
    setSelectedPayoutForModal(payout);
    onSelectEntity({
      type: 'SALES_COMMISSION',
      id: payout.id,
      code: payout.id,
      title: payout.salesRep,
      status: payout.status,
      lineage: [
        { id: payout.id, type: 'Bảng tính Hoa hồng', code: payout.id, relation: 'CURRENT_COMMISSION', status: payout.status },
        { id: 'M14-COMMISSION', type: 'Phân hệ M14', code: 'SALES_COMMISSION', relation: 'PARENT_MODULE', status: 'ACTIVE' }
      ],
      auditTrail: [
        { id: 1, action: 'INSPECT_COMMISSION_DETAILS', timestamp: new Date().toISOString(), user: 'admin', sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
      ],
      glEntries: [
        { account: '6415 - Chi phí hoa hồng bán hàng', debit: Number(payout.commissionAmount) || 50000000, credit: 0, description: `Hợp đồng hoa hồng ${payout.id}` },
        { account: '3341 - Phải trả người lao động', debit: 0, credit: Number(payout.commissionAmount) || 50000000, description: `Phải trả nhân viên ${payout.salesRep}` }
      ]
    });
    onNotify('info', 'Đã tải chi tiết hoa hồng', `Đã chọn bảng hoa hồng ${payout.id} vào Thanh Ngữ cảnh Đối Tượng.`);
  };

  const handleExportCSV = () => {
    const csvHeader = "CommissionID,SalesRep,Department,ClosedRevenue,CommissionRate,CommissionAmount,Status,PayoutDate\n";
    const csvRows = payouts.map(p => `"${p.id}","${p.salesRep}","${p.department}","${p.closedRevenue}","${p.commissionRate}","${p.commissionAmount}","${p.status}","${p.payoutDate}"`).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_commission_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất báo cáo thành công', 'Đã tải xuống tệp CSV báo cáo hoa hồng bán hàng.');
  };

  // Derived calculations for summary metrics
  const totalClosedRev = useMemo(() => {
    return payouts.reduce((acc, p) => acc + (Number(p.closedRevenue) ?? 0), 0);
  }, [payouts]);

  const totalApprovedCommission = useMemo(() => {
    return payouts.reduce((acc, p) => acc + (Number(p.commissionAmount) ?? 0), 0);
  }, [payouts]);

  const pendingApprovalCount = useMemo(() => {
    return payouts.filter(p => p.status === 'PENDING_APPROVAL').length;
  }, [payouts]);

  const paidCount = useMemo(() => {
    return payouts.filter(p => p.status === 'PAID').length;
  }, [payouts]);

  const minTierRate = useMemo(() => {
    return ruleTiers.length > 0 ? Math.min(...ruleTiers.map(t => t.rate)) : 0;
  }, [ruleTiers]);

  const maxTierRate = useMemo(() => {
    return ruleTiers.length > 0 ? Math.max(...ruleTiers.map(t => t.rate)) : 0;
  }, [ruleTiers]);

  return (
    <div className="space-y-4 pb-12 relative">
      {/* TẦNG L0: HEADER BANNER THEO CHUẨN M19 */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 dark:bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-mono font-bold rounded-md border border-slate-200 dark:border-slate-600">
                M14 • SALES COMMISSION
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Rule #19 Confirmed
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mt-1">
              Quản lý Hoa hồng Bán hàng, Phân bổ & Thu hồi (Clawback)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cấu hình tầng bậc hoa hồng (Rule Engine), phân bổ doanh số theo nhóm (Allocation) và cảnh báo tự động thu hồi hoa hồng khi hoàn trả hàng (Clawback).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('nexus-navigate', { detail: { route: '/sales-orders', moduleId: 'M13' } }));
              onNotify('info', 'Chuyển Hướng', 'Đang mở Phân hệ M13 Quản lý Đơn hàng B2B & Hóa đơn VAT.');
            }}
            className="px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800 shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>M13 Sales Orders</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-600 shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Xuất Báo Cáo CSV</span>
          </button>
          <button
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 400);
              onNotify('info', 'Làm mới', 'Đã đồng bộ dữ liệu hoa hồng M14.');
            }}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-600 shadow-2xs cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* DeepLinkBanner to M13 Sales Orders */}
      <DeepLinkBanner
        targetModule="M13"
        targetRoute="/sales-orders"
        title="Quản Lý Doanh Số & Hợp Đồng Bán Hàng Trực Tiếp (Order-to-Cash Hub)"
        description="Dữ liệu doanh số hợp đồng bán hàng thực tế được ghi nhận và chốt từ Phân hệ M13 Sales Orders. Tại M14, hệ thống tự động áp dụng Rule Engine, tính toán hoa hồng phân bổ và đồng bộ hạch toán sang Sổ Cái (GL)."
        actionText="Mở Đơn Hàng M13 →"
        badgeText="M13 SALES ORDERS"
        variant="amber"
      />

      {/* TẦNG L1: NAVIGATION SUBTABS BAR THEO CHUẨN M41 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'rules'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span>Rule Engine (Tầng bậc)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calculations')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'calculations'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>Bảng tính &amp; Payouts</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'calculations'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {payouts.length}
            </span>
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
            <Users className="w-4 h-4 shrink-0" />
            <span>Phân bổ Nhóm</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'allocation'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {allocations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clawback')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'clawback'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>Thu hồi Clawback</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'clawback'
                ? 'bg-blue-700 text-white'
                : clawbacks.length > 0
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {clawbacks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Phân tích &amp; Hạch toán GL</span>
          </button>
        </div>

        {/* Right Info Strip */}
        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Commission Engine
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
            M14 Multi-tier Rule
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: RULE ENGINE (TẦNG BẬC HOA HỒNG)                   */}
      {/* ======================================================== */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* L2: KPI Metric Strip cho Tab 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tổng Số Bậc Thang
                </span>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Sliders className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white mt-1">
                {ruleTiers.length}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Tiered Commission Rules
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tỷ Lệ Thấp Nhất
                </span>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-blue-600 dark:text-blue-400 mt-1">
                {minTierRate}%
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Bậc 1 khởi điểm
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tỷ Lệ Cao Nhất
                </span>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400 mt-1">
                {maxTierRate}%
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Bậc Enterprise lũy tiến
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Trạng Thái Động Cơ
                </span>
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-purple-600 dark:text-purple-400 mt-1">
                v2.4
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Active & Live Calculation
              </div>
            </div>
          </div>

          {/* L3: Rule Engine Master Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Commission Rule Engine (Cấu hình Bậc thang Hoa hồng & Lợi nhuận gộp)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Định nghĩa các bậc hoa hồng (Tiered Rates) theo khoảng doanh số hoặc lợi nhuận gộp với khả năng chỉnh sửa động và lưu cấu hình vào DB.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveConfigToDB}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu Cấu Hình vào DB</span>
                </button>
                <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                  Active Engine v2.4
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/80 tracking-wider">
                    <th className="py-2.5 px-3">Mã Tầng (Tier ID)</th>
                    <th className="py-2.5 px-3">Mô tả Bậc thang</th>
                    <th className="py-2.5 px-3">Doanh số Tối thiểu (Min Rev)</th>
                    <th className="py-2.5 px-3">Doanh số Tối đa (Max Rev)</th>
                    <th className="py-2.5 px-3">Tỷ lệ (%)</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                  {ruleTiers.map((tier) => (
                    <tr
                      key={tier.id}
                      className="transition-colors duration-150 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10"
                    >
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                          {tier.id}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {editingTierId === tier.id ? (
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full px-2 py-1 text-xs border rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        ) : (
                          tier.desc
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {editingTierId === tier.id ? (
                          <DotNumberInput
                            value={editMinRev}
                            onChange={(val) => setEditMinRev(val)}
                            suffix="VNĐ"
                            className="w-36"
                          />
                        ) : (
                          `${tier.minRev.toLocaleString('vi-VN')} VND`
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {editingTierId === tier.id ? (
                          <DotNumberInput
                            value={editMaxRev}
                            onChange={(val) => setEditMaxRev(val)}
                            suffix="VNĐ"
                            className="w-36"
                          />
                        ) : (
                          `${tier.maxRev.toLocaleString('vi-VN')} VND`
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                        {editingTierId === tier.id ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editRate}
                            onChange={(e) => setEditRate(Number(e.target.value))}
                            className="w-20 px-2 py-1 text-xs border rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                          />
                        ) : (
                          `${tier.rate}%`
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {editingTierId === tier.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveEditTier(tier.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={() => setEditingTierId(null)}
                              className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEditTier(tier)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-600"
                          >
                            Chỉnh sửa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add New Tier Form Card */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
              <Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Thêm Tầng Bậc Hoa Hồng (New Tier Config)
              </h3>
            </div>

            <form onSubmit={handleAddTier} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã Tầng</label>
                <input
                  type="text"
                  value={newTierId}
                  onChange={(e) => setNewTierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mô tả Bậc thang</label>
                <input
                  type="text"
                  value={newTierDesc}
                  onChange={(e) => setNewTierDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <DotNumberInput
                  label="Doanh số Tối thiểu"
                  value={newTierMin}
                  onChange={(val) => setNewTierMin(val)}
                  suffix="VNĐ"
                  showWordsHint={true}
                  placeholder="5.000.000.001"
                />
              </div>
              <div>
                <DotNumberInput
                  label="Doanh số Tối đa"
                  value={newTierMax}
                  onChange={(val) => setNewTierMax(val)}
                  suffix="VNĐ"
                  showWordsHint={true}
                  placeholder="10.000.000.000"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tỷ lệ (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newTierRate}
                  onChange={(e) => setNewTierRate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="md:col-span-4 flex items-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Bậc Thang Vào Engine</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CALCULATIONS & PAYOUTS (BẢNG TÍNH & CHI TRẢ)      */}
      {/* ======================================================== */}
      {activeTab === 'calculations' && (
        <div className="space-y-4">
          {/* L2: KPI Metric Strip cho Tab 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tổng Doanh Số Chốt
                </span>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white mt-1">
                {(totalClosedRev / 1000000000).toFixed(2)}B
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {totalClosedRev.toLocaleString()} VND
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tổng Hoa Hồng Đã Duyệt
                </span>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400 mt-1">
                {(totalApprovedCommission / 1000000).toFixed(1)}M
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {totalApprovedCommission.toLocaleString()} VND
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Chờ Phê Duyệt
                </span>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-amber-600 dark:text-amber-400 mt-1">
                {pendingApprovalCount}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Cần thẩm định và duyệt
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Đã Hoàn Tất (PAID)
                </span>
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-purple-600 dark:text-purple-400 mt-1">
                {paidCount}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Đã hạch toán chi trả GL
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Cột trái: Danh sách Payout */}
            <div className="lg:col-span-2 space-y-3">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
                {/* L1 Command Bar & Filters */}
                <div className="p-3.5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-50/60 dark:bg-slate-800/80">
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-1 flex-wrap">
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Tìm nhân sự, mã payout, bộ phận..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">Tất cả Trạng thái</option>
                      <option value="APPROVED">APPROVED (Đã duyệt)</option>
                      <option value="PENDING_APPROVAL">PENDING (Chờ duyệt)</option>
                      <option value="PAID">PAID (Đã chi trả)</option>
                    </select>

                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">Tất cả Phòng ban</option>
                      <option value="Enterprise Sales">Enterprise Sales</option>
                      <option value="Kênh Đại lý">Kênh Đại lý</option>
                      <option value="SME Commercial">SME Commercial</option>
                    </select>
                  </div>

                  <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 self-end sm:self-center">
                    {filteredPayouts.length} kết quả
                  </span>
                </div>

                <L3ContentState
                  isLoading={loading}
                  isEmpty={displayPayouts.length === 0}
                  emptyTitle="Không tìm thấy phiếu chi hoa hồng"
                  emptyDescription="Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm."
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/80 tracking-wider">
                          <th className="py-2.5 px-3">Mã Payout</th>
                          <th className="py-2.5 px-3">Nhân sự Sales</th>
                          <th className="py-2.5 px-3 text-right">Doanh số Chốt</th>
                          <th className="py-2.5 px-3 text-center">Tỷ lệ</th>
                          <th className="py-2.5 px-3 text-right">Tiền hoa hồng</th>
                          <th className="py-2.5 px-3 text-center">Trạng thái</th>
                          <th className="py-2.5 px-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                        {displayPayouts.map((po) => {
                          const isPaid = po.status === 'PAID';
                          const isApproved = po.status === 'APPROVED';
                          return (
                            <tr
                              key={po.id}
                              className={`transition-colors duration-150 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 ${
                                isPaid
                                  ? 'border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10'
                                  : isApproved
                                  ? 'border-l-4 border-blue-600 bg-blue-50/15 dark:bg-slate-700/60'
                                  : 'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10'
                              }`}
                            >
                              <td className="py-3 px-3">
                                <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                                  {po.id}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900 dark:text-white">{po.salesRep}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{po.department}</div>
                              </td>
                              <td className="py-3 px-3 font-mono tabular-nums text-right font-semibold text-slate-700 dark:text-slate-300">
                                {Number(po.closedRevenue).toLocaleString()} VND
                              </td>
                              <td className="py-3 px-3 font-mono tabular-nums text-center font-bold text-emerald-600 dark:text-emerald-400">
                                {po.commissionRate}
                              </td>
                              <td className="py-3 px-3 font-mono tabular-nums text-right font-bold text-slate-900 dark:text-white">
                                {Number(po.commissionAmount).toLocaleString()} VND
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                    isPaid
                                      ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                                      : isApproved
                                      ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700'
                                      : 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700'
                                  }`}
                                >
                                  {po.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {po.status === 'PENDING_APPROVAL' && (
                                    <button
                                      onClick={() => handleUpdateStatus(po.id, 'APPROVED')}
                                      className="px-2 py-1 text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all cursor-pointer shadow-2xs"
                                    >
                                      Duyệt
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleSelectPayout(po)}
                                    className="px-2.5 py-1 text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-300 rounded-lg transition-colors border border-amber-200 dark:border-amber-800 cursor-pointer shadow-2xs flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>360°</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </L3ContentState>

                {/* L4: Sticky Pagination Control */}
                <div className="p-2.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                  <PaginationControl
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={filteredPayouts.length}
                    onPageChange={goToPage}
                    onPageSizeChange={setPageSize}
                  />
                </div>
              </div>
            </div>

            {/* Cột phải: Form Tính toán Hoa hồng Mới */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
                  <Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Tính toán Hoa hồng Mới
                  </h3>
                </div>

                <form onSubmit={handleCreatePayout} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nhân sự Kinh doanh (Sales Rep)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Phạm Hoàng Nam (SR-04)"
                      value={newSalesRep}
                      onChange={(e) => setNewSalesRep(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Bộ phận (Department)
                    </label>
                    <input
                      type="text"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <CurrencyInput
                      label="Doanh số Chốt (VNĐ)"
                      value={newRevenue}
                      onChange={(val, str) => setNewRevenue(str)}
                      placeholder="VD: 600.000.000"
                      showBadge={true}
                      showPresets={true}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Áp dụng Rule Engine & Tính toán</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: COMMISSION ALLOCATION (PHÂN BỔ NHÓM)              */}
      {/* ======================================================== */}
      {activeTab === 'allocation' && (
        <div className="space-y-4">
          {/* L2: KPI Metric Strip cho Tab 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Hợp Đồng Đã Phân Bổ
                </span>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white mt-1">
                {allocations.length}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Team Deals Configured
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Đã Chia Xong (ALLOCATED)
                </span>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400 mt-1">
                {allocations.filter(a => a.status === 'ALLOCATED').length}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Đã khóa tỷ lệ chia
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Chờ Chia (PENDING_SPLIT)
                </span>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-amber-600 dark:text-amber-400 mt-1">
                {allocations.filter(a => a.status === 'PENDING_SPLIT').length}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Cần thống nhất tỷ lệ
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Cơ Chế Phân Bổ
                </span>
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-purple-600 dark:text-purple-400 mt-1">
                Primary/Support
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Đa nhân sự tham gia
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
                <div className="p-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Commission Allocation (Phân bổ Doanh số & Hoa hồng Đa nhân sự)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Quản lý các hợp đồng B2B lớn cần chia tỷ lệ hoa hồng giữa Sales chủ trì (Primary) và Sales hỗ trợ (Supporting).
                    </p>
                  </div>
                  <span className="text-xs font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 font-bold">
                    Team Split Engine
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/80 tracking-wider">
                        <th className="py-2.5 px-3">Mã Hợp đồng / SO</th>
                        <th className="py-2.5 px-3 text-right">Tổng Giá trị</th>
                        <th className="py-2.5 px-3">Sales Chủ trì (Primary)</th>
                        <th className="py-2.5 px-3">Sales Hỗ trợ (Supporting Split)</th>
                        <th className="py-2.5 px-3 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                      {allocations.map((al) => {
                        const isAllocated = al.status === 'ALLOCATED';
                        return (
                          <tr
                            key={al.id}
                            className={`transition-colors duration-150 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 ${
                              isAllocated
                                ? 'border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10'
                                : 'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10'
                            }`}
                          >
                            <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {al.dealCode}
                            </td>
                            <td className="py-3 px-3 font-mono tabular-nums text-right font-semibold text-slate-900 dark:text-white">
                              {al.totalDealValue}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {al.primaryRep}
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                              {al.supportingReps}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                  isAllocated
                                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                                    : 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700'
                                }`}
                              >
                                {al.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Cài đặt Phân bổ Doanh số (Team Split)
                  </h3>
                </div>

                <form onSubmit={handleCreateAllocation} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mã Hợp đồng / SO
                    </label>
                    <input
                      type="text"
                      value={allocDealCode}
                      onChange={(e) => setAllocDealCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <DotNumberInput
                      label="Tổng Giá trị Hợp đồng"
                      value={allocDealValue}
                      onChange={(_val, str) => setAllocDealValue(`${str} VND`)}
                      suffix="VNĐ"
                      showWordsHint={true}
                      placeholder="1.500.000.000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Sales Chủ trì (Primary Rep & %)
                    </label>
                    <input
                      type="text"
                      value={allocPrimary}
                      onChange={(e) => setAllocPrimary(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Sales Hỗ trợ (Supporting & Split %)
                    </label>
                    <input
                      type="text"
                      value={allocSupporting}
                      onChange={(e) => setAllocSupporting(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Lưu & Phân bổ Tỷ lệ (Save Allocation)</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: CLAWBACK (THU HỒI HOA HỒNG KHI TRẢ HÀNG)          */}
      {/* ======================================================== */}
      {activeTab === 'clawback' && (
        <div className="space-y-4">
          {/* L2: KPI Metric Strip cho Tab 4 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Số Vụ Thu Hồi
                </span>
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <RotateCcw className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white mt-1">
                {clawbacks.length}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Clawback Records
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Chờ Khấu Trừ Kỳ Tới
                </span>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-amber-600 dark:text-amber-400 mt-1">
                {clawbacks.filter(c => c.status === 'PENDING_DEDUCTION').length}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Khấu trừ kỳ lương tiếp theo
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Đã Khấu Trừ Xong
                </span>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400 mt-1">
                {clawbacks.filter(c => c.status === 'DEDUCTED_NEXT_PAYOUT').length}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Đã thu hồi thành công
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Giám Sát Đơn Hoàn
                </span>
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-rose-600 dark:text-rose-400 mt-1">
                100%
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Tự động bắt hook từ M13
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Dashboard Clawback (Cảnh báo & Thu hồi Hoa hồng khi Hoàn trả hàng)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Tự động phát hiện các đơn hàng bị khách hàng hoàn trả hoặc hủy hợp đồng để khấu trừ vào kỳ hoa hồng tiếp theo.
                </p>
              </div>
              <span className="text-xs font-mono text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Active Clawback Monitor</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/80 tracking-wider">
                    <th className="py-2.5 px-3">Mã Thu hồi (CB ID)</th>
                    <th className="py-2.5 px-3">Đơn hàng Gốc</th>
                    <th className="py-2.5 px-3">Nhân sự Sales</th>
                    <th className="py-2.5 px-3">Lý do hoàn trả</th>
                    <th className="py-2.5 px-3 text-right">Số tiền Hoàn trả</th>
                    <th className="py-2.5 px-3 text-right">Số tiền Thu hồi (Clawback)</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái Xử lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                  {clawbacks.map((cb) => {
                    const isDeducted = cb.status === 'DEDUCTED_NEXT_PAYOUT';
                    return (
                      <tr
                        key={cb.id}
                        className={`transition-colors duration-150 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 ${
                          isDeducted
                            ? 'border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10'
                            : 'border-l-4 border-rose-500 bg-rose-50/15 dark:bg-rose-950/10'
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-rose-700 dark:text-rose-400">
                          {cb.id}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {cb.originalDeal}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {cb.salesRep}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {cb.returnReason}
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums text-right font-semibold text-slate-700 dark:text-slate-300">
                          {cb.refundedAmount}
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums text-right font-bold text-rose-600 dark:text-rose-400">
                          {cb.clawbackAmount}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                              isDeducted
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                                : 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700'
                            }`}
                          >
                            {cb.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: ANALYTICS & GENERAL LEDGER (GL) INTEGRATION       */}
      {/* ======================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Phân tích Chi phí Hoa hồng & Tích hợp Sổ cái General Ledger (GL)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Định khoản kế toán kép chuẩn VAS/IFRS: Nợ TK 6415 (Chi phí hoa hồng bán hàng) / Có TK 3341 (Phải trả người lao động).
                </p>
              </div>
              <span className="text-xs font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800 font-bold">
                GL Integration Live
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Tổng Doanh số Đạt
                </span>
                <p className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-base">
                  2,720,000,000 VND
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  ↑ 14.8% so với quý trước
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Tổng Hoa hồng Chi trả
                </span>
                <p className="font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 text-base">
                  163,850,000 VND
                </p>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Tỷ lệ chi phí/doanh số: 6.02%
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Tổng Hoàn trả Clawback
                </span>
                <p className="font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400 text-base">
                  19,500,000 VND
                </p>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                  Tự động giữ lại kỳ tới
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Hạch toán GL Account
                </span>
                <p className="font-mono tabular-nums font-bold text-purple-600 dark:text-purple-400 text-base">
                  Nợ 6415 / Có 3341
                </p>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Tự động đồng bộ Sổ cái
                </span>
              </div>
            </div>

            {/* Bảng đối soát chứng từ GL */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Sổ Cái Bút Toán Định Khoản Tự Động (Auto GL Voucher Posting)</span>
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">STATUS: RECONCILED</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Các khoản chi hoa hồng sau khi được phê duyệt tại M14 sẽ tự động phát sinh bút toán đối soát kế toán trên hệ thống Sổ Cái tổng hợp của NexusSync ERP. Mã băm giao dịch (SHA-256) được khóa bất biến nhằm đảm bảo tuân thủ các quy tắc kiểm toán nhà nước.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PAYOUT DETAIL MODAL (BẢNG TÍNH 360°)                      */}
      {/* ======================================================== */}
      {selectedPayoutForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold font-mono text-xs">
                  {selectedPayoutForModal.id}
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide">{selectedPayoutForModal.salesRep}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Bộ phận: {selectedPayoutForModal.department}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayoutForModal(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Doanh số chốt & Tỷ lệ
                  </span>
                  <p className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-sm">
                    {Number(selectedPayoutForModal.closedRevenue).toLocaleString()} VND
                  </p>
                  <p className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                    Tỷ lệ Rule Engine: {selectedPayoutForModal.commissionRate}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Tổng tiền Hoa hồng
                  </span>
                  <p className="font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 text-sm">
                    {Number(selectedPayoutForModal.commissionAmount).toLocaleString()} VND
                  </p>
                  <p className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                    Trạng thái: {selectedPayoutForModal.status}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <Percent className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-amber-900 dark:text-amber-200">
                    Đã đồng bộ Bảng Tính Hoa Hồng 360° & GL Entries
                  </span>
                  <span className="text-[11px] text-amber-800 dark:text-amber-300">
                    Bút toán Nợ 6415 / Có 3341 đã được tạo và ghi nhận vào hệ thống đối soát ERP.
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedPayoutForModal(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RULE #19 CONFIRM DIALOG */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};

export default M14SalesCommissionWorkspace;
