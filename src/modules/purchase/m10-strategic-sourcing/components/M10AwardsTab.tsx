import React, { useState, useMemo } from 'react';
import { AwardItem, RFQItem, BidItem, MasterSupplierOption, CostCenter, SourcingPackageItem } from './m10Types';
import { 
  CheckCircle, Search, RefreshCw, Download, CheckCircle2, Building, ShoppingBag, 
  ArrowRight, ShieldAlert, DollarSign, GitFork, Users, FileText, AlertTriangle, 
  Info, Eye, Layers, Clock, Lock
} from 'lucide-react';
import { PaginationControl } from '../../../../components/common/PaginationControl';

interface M10AwardsTabProps {
  awards: AwardItem[];
  loading: boolean;
  isSubmitting: boolean;
  rfqs?: RFQItem[];
  bids?: BidItem[];
  packages?: SourcingPackageItem[];
  costCenters?: CostCenter[];
  suppliers?: MasterSupplierOption[];
  onRefresh: () => void;
  onCreateAward: (e: React.FormEvent, overrideJustification?: string) => void;
  onGeneratePo?: (awardId: number) => Promise<void>;
  onSealDms?: (awardId: number) => Promise<void>;
  awardRfqId: string;
  setAwardRfqId: (val: string) => void;
  awardBidId: string;
  setAwardBidId: (val: string) => void;
  awardSupplierId: string;
  setAwardSupplierId: (val: string) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M10AwardsTab: React.FC<M10AwardsTabProps> = ({
  awards,
  loading,
  isSubmitting,
  rfqs = [],
  bids = [],
  packages = [],
  costCenters = [],
  suppliers = [],
  onRefresh,
  onCreateAward,
  onGeneratePo,
  onSealDms,
  awardRfqId,
  setAwardRfqId,
  awardBidId,
  setAwardBidId,
  awardSupplierId,
  setAwardSupplierId,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [generatingPoId, setGeneratingPoId] = useState<number | null>(null);
  const [sealingAwardId, setSealingAwardId] = useState<number | null>(null);
  
  // Inspection Modal State for Approval Matrix & Budget Details
  const [activeInspectAward, setActiveInspectAward] = useState<AwardItem | null>(null);
  const [budgetOverrideNote, setBudgetOverrideNote] = useState<string>('');
  const [showOverrideInput, setShowOverrideInput] = useState<boolean>(false);

  const filteredAwards = useMemo(() => {
    return awards.filter(a => {
      return (a.awardNo?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (a.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (a.costCenter?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        String(a.rfqId).includes(searchTerm);
    });
  }, [awards, searchTerm]);

  const totalPages = Math.ceil(filteredAwards.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedAwards = filteredAwards.slice(startIndex, startIndex + pageSize);

  // Filter bids matching selected awardRfqId
  const availableBidsForSelectedRfq = useMemo(() => {
    if (!awardRfqId) return bids;
    return bids.filter(b => String(b.rfqId) === String(awardRfqId));
  }, [bids, awardRfqId]);

  // Selected RFQ object
  const selectedRfqObj = useMemo(() => {
    if (!awardRfqId) return null;
    return rfqs.find(r => String(r.dbId || r.id.replace('RFQ-', '')) === String(awardRfqId)) || null;
  }, [rfqs, awardRfqId]);

  // Selected Package & Cost Center determination
  const activeCostCenterCode = useMemo(() => {
    if (!selectedRfqObj) return 'CC-PROCUREMENT';
    if (selectedRfqObj.packageId) {
      const pkg = packages.find(p => p.id === selectedRfqObj.packageId);
      if (pkg?.costCenter) return pkg.costCenter;
    }
    return 'CC-PROCUREMENT';
  }, [selectedRfqObj, packages]);

  // Selected Cost Center Object with budget balance
  const activeCostCenterObj = useMemo(() => {
    if (costCenters.length === 0) return null;
    return costCenters.find(c => 
      c.code.toUpperCase() === activeCostCenterCode.toUpperCase() ||
      activeCostCenterCode.toUpperCase().includes(c.code.toUpperCase())
    ) || costCenters[0];
  }, [costCenters, activeCostCenterCode]);

  // Selected Bid Object & Total Value
  const selectedBidObj = useMemo(() => {
    if (!awardBidId) return null;
    return bids.find(b => String(b.id) === String(awardBidId)) || null;
  }, [bids, awardBidId]);

  const selectedBidAmount = useMemo(() => {
    if (!selectedBidObj) return 0;
    if (selectedBidObj.totalValue) return Number(selectedBidObj.totalValue);
    if (selectedBidObj.unitPrice && selectedBidObj.offeredQuantity) {
      return Number(selectedBidObj.unitPrice) * Number(selectedBidObj.offeredQuantity);
    }
    return 0;
  }, [selectedBidObj]);

  // Budget Guard Calculations (Phase 8 - M30)
  const budgetValidation = useMemo(() => {
    const available = activeCostCenterObj?.availableBudget ?? 500000000;
    const requested = selectedBidAmount;
    const isExceeded = requested > available;
    const deficit = isExceeded ? requested - available : 0;
    const remainingAfter = available - requested;

    return {
      available,
      requested,
      isExceeded,
      deficit,
      remainingAfter,
      costCenterCode: activeCostCenterObj?.code || activeCostCenterCode,
      costCenterName: activeCostCenterObj?.name || 'Trung tâm Thu mua & Cung ứng'
    };
  }, [activeCostCenterObj, activeCostCenterCode, selectedBidAmount]);

  // Multi-Tier Approval Matrix Simulation (Phase 9 - M28)
  const approvalMatrixSimulation = useMemo(() => {
    const amount = selectedBidAmount;
    if (amount <= 500000000) {
      return {
        level: 'SINGLE_TIER',
        title: 'Thẩm Quyền Đơn Cấp (≤ 500.000.000 VNĐ)',
        description: 'Trưởng phòng Mua sắm (Procurement Manager) ký duyệt trực tiếp và ủy quyền phát hành PO.',
        badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700',
        tiers: [
          { role: 'Trưởng phòng Mua sắm (Procurement Manager)', sla: '24h', status: 'Sẵn sàng duyệt' }
        ]
      };
    } else if (amount <= 2000000000) {
      return {
        level: 'TWO_TIER_DIRECTOR',
        title: 'Quy Trình Duyệt 2 Cấp Khối M28 (> 500.000.000 VNĐ)',
        description: 'Vượt hạn mức đơn cấp. Tự động kích hoạt luồng thẩm định Cấp 1 (TP Mua sắm) và phê duyệt Cấp 2 (Giám đốc Khối Mua sắm / CPO).',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700',
        tiers: [
          { role: 'Cấp 1: Trưởng phòng Mua sắm (Thẩm định kỹ thuật & thương mại)', sla: '24h', status: 'Chờ duyệt' },
          { role: 'Cấp 2: Giám đốc Khối Cung ứng & Mua sắm / CPO (Phê duyệt hạn mức)', sla: '48h', status: 'Đang đợi cấp 1' }
        ]
      };
    } else {
      return {
        level: 'THREE_TIER_EXECUTIVE',
        title: 'Quy Trình Duyệt 3 Cấp Ban Điều Hành M28 (> 2.000.000.000 VNĐ)',
        description: 'Quy mô chiến lược đặc biệt. Kích hoạt luồng thẩm định đa cấp Ban Điều hành (TP Mua sắm → CPO → CFO / CEO).',
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-700',
        tiers: [
          { role: 'Cấp 1: Trưởng phòng Mua sắm (Trình hồ sơ thẩm định)', sla: '24h', status: 'Chờ duyệt' },
          { role: 'Cấp 2: Giám đốc Mua sắm / CPO (Xác nhận chiến lược NCC)', sla: '48h', status: 'Đang đợi cấp 1' },
          { role: 'Cấp 3: Giám đốc Tài chính (CFO) / CEO (Phê duyệt ngân sách & cam kết thanh toán)', sla: '72h', status: 'Đang đợi cấp 2' }
        ]
      };
    }
  }, [selectedBidAmount]);

  const handleSelectBid = (selectedBidId: string) => {
    setAwardBidId(selectedBidId);
    const foundBid = bids.find(b => String(b.id) === selectedBidId);
    if (foundBid) {
      if (foundBid.supplierId) {
        setAwardSupplierId(String(foundBid.supplierId));
      }
      if (foundBid.rfqId && !awardRfqId) {
        setAwardRfqId(String(foundBid.rfqId));
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (budgetValidation.isExceeded && !budgetOverrideNote.trim()) {
      setShowOverrideInput(true);
      onNotify('warning', 'Yêu cầu Giải trình Ngân sách M30', 'Hồ sơ vượt quá ngân sách khả dụng. Vui lòng nhập nội dung giải trình phê duyệt ngoại lệ trước khi gửi.');
      return;
    }
    onCreateAward(e, budgetOverrideNote);
  };

  const handleTriggerGeneratePo = async (awardId: number) => {
    if (!onGeneratePo) return;
    setGeneratingPoId(awardId);
    try {
      await onGeneratePo(awardId);
    } finally {
      setGeneratingPoId(null);
    }
  };

  const handleTriggerSealDms = async (awardId: number) => {
    if (!onSealDms) return;
    setSealingAwardId(awardId);
    try {
      await onSealDms(awardId);
    } finally {
      setSealingAwardId(null);
    }
  };

  const handleExportAwardsCSV = () => {
    if (awards.length === 0) {
      onNotify('warning', 'Không có dữ liệu', 'Chưa có quyết định trao thầu nào để xuất.');
      return;
    }
    const csvHeader = "Mã Quyết Định,RFQ ID,Cost Center,Nhà Cung Cấp Thắng Thầu,Tổng Giá Trị (VND),Luồng Phê Duyệt,Trạng Thái,Mã PO M08\n";
    const csvRows = awards.map(a =>
      `"${a.awardNo ?? ''}","RFQ-${a.rfqId}","${a.costCenter ?? 'CC-PROCUREMENT'}","${a.supplierName ?? ''}","${a.totalAmount ?? 0}","${a.workflowMatrix?.routeType ?? 'STANDARD'}","${a.status ?? ''}","${a.poCode ?? ''}"`
    ).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sourcing_awards_m28_m30_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất File CSV Thành công', 'Đã tải danh sách quyết định trao thầu kèm thông số M28/M30.');
  };

  return (
    <div className="space-y-4">
      {/* Top Cost Center Budget Overview Strip (Phase 8 - M30 GL) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/80 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Hạn Mức Ngân Sách Cost Center (M30 General Ledger Guard)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                  REAL-TIME M30
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Kiểm soát ngân sách khả dụng theo thời gian thực trước khi trao thầu và ủy quyền phát hành đơn hàng
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Trung tâm chi phí mặc định:</span>
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
              {activeCostCenterObj?.code || 'CC-PROCUREMENT'}
            </span>
          </div>
        </div>

        {/* 4 Cost Center KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
              Ngân Sách Được Giao
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {Number(activeCostCenterObj?.allocatedBudget ?? 2000000000).toLocaleString()} ₫
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Năm tài chính 2026</div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
            <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 mb-1">
              Đã Cam Kết (Committed)
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-amber-800 dark:text-amber-300">
              {Number(activeCostCenterObj?.committedBudget ?? 1200000000).toLocaleString()} ₫
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Hợp đồng &amp; PO đang chạy</div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40">
            <div className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 mb-1">
              Đã Chi Thực Tế (Actual)
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-blue-800 dark:text-blue-300">
              {Number(activeCostCenterObj?.actualSpent ?? 300000000).toLocaleString()} ₫
            </div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Hóa đơn AP đã ghi sổ</div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-300/80 dark:border-emerald-700/60">
            <div className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 mb-1 flex items-center justify-between">
              <span>Khả Dụng (Available)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-emerald-800 dark:text-emerald-300">
              {Number(activeCostCenterObj?.availableBudget ?? 500000000).toLocaleString()} ₫
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium">Hạn mức được phép chi</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Awards Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            {/* L1 Command Bar */}
            <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Danh Sách Quyết Định Trao Thầu (Awards Matrix)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Hiển thị {filteredAwards.length} / {awards.length} quyết định trao thầu đã ghi nhận
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    placeholder="Tìm mã award, NCC, CC..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 w-48"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportAwardsCSV}
                  title="Xuất CSV"
                  className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={loading}
                  title="Tải lại dữ liệu"
                  className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* L2 Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Mã Quyết Định</th>
                    <th className="p-3">Gói RFQ &amp; CC</th>
                    <th className="p-3">Nhà Cung Cấp Thắng Thầu</th>
                    <th className="p-3 text-right">Tổng Giá Trị Trao Thầu</th>
                    <th className="p-3 text-center">Luồng Duyệt (M28)</th>
                    <th className="p-3">Trạng Thái</th>
                    <th className="p-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {loading && awards.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                        <span>Đang tải danh sách quyết định trao thầu...</span>
                      </td>
                    </tr>
                  ) : paginatedAwards.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Chưa có quyết định trao thầu nào được phê duyệt.
                      </td>
                    </tr>
                  ) : (
                    paginatedAwards.map(a => {
                      const isMultiTier = (a.totalAmount || 0) > 500000000;
                      return (
                        <tr
                          key={a.id}
                          className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-colors border-l-4 border-l-indigo-600"
                        >
                          <td className="p-3 font-mono tabular-nums font-bold text-purple-700 dark:text-purple-400">
                            {a.awardNo}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                RFQ-{a.rfqId}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {a.costCenter || 'CC-PROCUREMENT'}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[130px]">{a.supplierName || `Supplier #${a.supplierId}`}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono tabular-nums text-right font-bold text-emerald-700 dark:text-emerald-400">
                            {Number(a.totalAmount ?? 0).toLocaleString()} ₫
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            {isMultiTier ? (
                              <button
                                type="button"
                                onClick={() => setActiveInspectAward(a)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700 hover:bg-amber-200 transition-colors cursor-pointer"
                                title="Nhấp để xem luồng duyệt đa cấp M28"
                              >
                                <GitFork className="w-3 h-3 text-amber-600" />
                                <span>Duyệt Đa Cấp (&gt;500M)</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveInspectAward(a)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                                title="Nhấp để xem chi tiết phê duyệt"
                              >
                                <Users className="w-3 h-3 text-blue-600" />
                                <span>Đơn Cấp (TP Thu Mua)</span>
                              </button>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono tabular-nums font-bold border ${
                              a.status === 'APPROVED' || a.status === 'AWARDED'
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700'
                                : 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setActiveInspectAward(a)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
                                title="Xem chi tiết phê duyệt & ngân sách"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {a.dmsVault ? (
                                <span 
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 text-[10px] font-mono font-bold"
                                  title={`Đã niêm phong M29 Vault (SHA-256: ${a.dmsVault.sha256Hash})`}
                                >
                                  <Lock className="w-3 h-3 text-indigo-600" />
                                  <span>M29 Sealed</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={sealingAwardId === a.id}
                                  onClick={() => handleTriggerSealDms(a.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-300 dark:border-slate-600 transition-all cursor-pointer disabled:opacity-50"
                                  title="Niêm phong số hồ sơ trúng thầu vào M29 Secure Vault"
                                >
                                  {sealingAwardId === a.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin text-slate-600" />
                                  ) : (
                                    <Lock className="w-3 h-3 text-slate-600" />
                                  )}
                                  <span>Niêm phong M29</span>
                                </button>
                              )}
                              {a.poCode ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    window.dispatchEvent(new CustomEvent('nexus-navigate', { detail: { route: '/purchase', moduleId: 'M08' } }));
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-mono font-bold cursor-pointer transition-all shadow-2xs"
                                  title="Mở đơn hàng mua M08"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{a.poCode}</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={generatingPoId === a.id}
                                  onClick={() => handleTriggerGeneratePo(a.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                                  title="Khởi tạo trực tiếp Đơn Hàng Mua M08 từ hồ sơ trúng thầu"
                                >
                                  {generatingPoId === a.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <ArrowRight className="w-3 h-3" />
                                  )}
                                  <span>Khởi tạo M08 PO</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* L4 Pagination */}
            {filteredAwards.length > 0 && (
              <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <PaginationControl
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={filteredAwards.length}
                  startIndex={startIndex}
                  endIndex={Math.min(startIndex + pageSize, filteredAwards.length)}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={s => { setPageSize(s); setCurrentPage(1); }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Award Approval Form & Live Guard Simulator (1 Col) */}
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Phê Duyệt Trao Thầu (Award Approval)
                </h3>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              {/* RFQ Select */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Chọn Gói RFQ <span className="text-rose-500">*</span>
                </label>
                {rfqs.length > 0 ? (
                  <select
                    value={awardRfqId}
                    onChange={e => setAwardRfqId(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">-- Chọn Gói RFQ --</option>
                    {rfqs.map(r => (
                      <option key={r.id} value={r.dbId || r.id.replace('RFQ-', '')}>
                        {r.id} - {r.title} ({r.status})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={awardRfqId}
                    onChange={e => setAwardRfqId(e.target.value)}
                    className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 text-slate-900 dark:text-white"
                    placeholder="1"
                    required
                  />
                )}
              </div>

              {/* Bid Select */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Hồ Sơ Chào Giá (Bid) Thắng Thầu <span className="text-rose-500">*</span>
                </label>
                {availableBidsForSelectedRfq.length > 0 ? (
                  <select
                    value={awardBidId}
                    onChange={e => handleSelectBid(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">-- Chọn Hồ Sơ Bid Thắng Thầu --</option>
                    {availableBidsForSelectedRfq.map(b => (
                      <option key={b.id} value={b.id}>
                        Bid #{b.id} - {b.supplierName || `Supplier #${b.supplierId}`} ({Number(b.totalValue || 0).toLocaleString()} ₫)
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={awardBidId}
                    onChange={e => setAwardBidId(e.target.value)}
                    className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 text-slate-900 dark:text-white"
                    placeholder="1"
                    required
                  />
                )}
              </div>

              {/* Supplier Select */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Nhà Cung Cấp Thắng Thầu <span className="text-rose-500">*</span>
                </label>
                {suppliers.length > 0 ? (
                  <select
                    value={awardSupplierId}
                    onChange={e => setAwardSupplierId(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">-- Chọn Nhà cung cấp --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={awardSupplierId}
                    onChange={e => setAwardSupplierId(e.target.value)}
                    className="w-full text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 text-slate-900 dark:text-white"
                    placeholder="1"
                    required
                  />
                )}
              </div>

              {/* Real-Time Live Validation: Budget Guard & Approval Matrix */}
              {selectedBidAmount > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                  {/* Budget Guard Check Banner (Phase 8 - M30) */}
                  <div className={`p-3 rounded-xl border ${
                    budgetValidation.isExceeded
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      {budgetValidation.isExceeded ? (
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1 text-[11px] leading-tight flex-1">
                        <div className="font-bold flex items-center justify-between">
                          <span>{budgetValidation.isExceeded ? 'CẢNH BÁO: VƯỢT HẠN MỨC NGÂN SÁCH M30' : 'NGÂN SÁCH KHẢ DỤNG HỢP LỆ'}</span>
                          <span className="font-mono tabular-nums font-bold">
                            {budgetValidation.requested.toLocaleString()} ₫
                          </span>
                        </div>
                        <div className="text-[10px] opacity-90">
                          Cost Center: <strong>{budgetValidation.costCenterCode}</strong> | Khả dụng: {budgetValidation.available.toLocaleString()} ₫
                        </div>
                        {budgetValidation.isExceeded ? (
                          <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300 pt-0.5">
                            Thâm hụt: -{budgetValidation.deficit.toLocaleString()} ₫. Hệ thống chặn cứng phê duyệt nếu không có quyền ngoại lệ.
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 pt-0.5">
                            Sau khi cam kết còn lại: {(budgetValidation.remainingAfter).toLocaleString()} ₫
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Multi-Tier Approval Matrix Banner (Phase 9 - M28) */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <GitFork className="w-3 h-3 text-indigo-500" />
                        Luồng Thẩm Quyền Phê Duyệt (M28)
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${approvalMatrixSimulation.badgeClass}`}>
                        {approvalMatrixSimulation.level === 'SINGLE_TIER' ? '1 CẤP ĐƠN' : approvalMatrixSimulation.level === 'TWO_TIER_DIRECTOR' ? '2 CẤP KHỐI' : '3 CẤP BAN ĐIỀU HÀNH'}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      {approvalMatrixSimulation.title}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {approvalMatrixSimulation.description}
                    </div>
                    {/* Visual Workflow Steps */}
                    <div className="pt-1.5 space-y-1">
                      {approvalMatrixSimulation.tiers.map((t, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[10px] bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{t.role}</span>
                          <span className="text-slate-400 font-mono">SLA: {t.sla}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Budget Override Input when Exceeded */}
              {budgetValidation.isExceeded && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Giải trình Ngoại lệ Vượt Ngân sách (Bắt buộc)</span>
                  </div>
                  <textarea
                    value={budgetOverrideNote}
                    onChange={e => setBudgetOverrideNote(e.target.value)}
                    placeholder="Nhập căn cứ phê duyệt ngoại lệ ngân sách từ CPO/CFO hoặc văn bản ủy quyền..."
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg p-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[60px]"
                    required={budgetValidation.isExceeded}
                  />
                  <p className="text-[10px] text-amber-700 dark:text-amber-300">
                    Nội dung giải trình sẽ được lưu vĩnh viễn vào Audit Trail và Outbox Events để M30 &amp; M28 kiểm toán.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>
                  {budgetValidation.isExceeded 
                    ? 'Phê Duyệt Với Ngoại Lệ Ngân Sách M30' 
                    : approvalMatrixSimulation.level === 'SINGLE_TIER' 
                      ? 'Phê Duyệt & Phát Hành Trao Thầu (Đơn Cấp)' 
                      : 'Trình Ký Luồng Duyệt Đa Cấp M28'}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* INSPECT AWARD MODAL: Full Approval Matrix & Budget Details */}
      {activeInspectAward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Hồ Sơ Trao Thầu #{activeInspectAward.awardNo}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Phê duyệt gói thầu RFQ-{activeInspectAward.rfqId} &amp; Quản trị ngân sách M30
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveInspectAward(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Nhà Cung Cấp Trúng Thầu</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    {activeInspectAward.supplierName || `Supplier #${activeInspectAward.supplierId}`}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {activeInspectAward.supplierId}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Tổng Giá Trị Trao Thầu</div>
                  <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                    {Number(activeInspectAward.totalAmount || 0).toLocaleString()} ₫
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Tiền tệ: VND</div>
                </div>
              </div>

              {/* Cost Center & Budget Details */}
              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    Trung Tâm Chi Phí & Ngân Sách M30
                  </span>
                  <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 rounded font-bold">
                    {activeInspectAward.costCenter || 'CC-PROCUREMENT'}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Giá trị gói thầu đã được khóa và đối soát tự động với ngân sách khả dụng của Cost Center trước khi phát sinh biên bản trao thầu.
                </div>
              </div>

              {/* DMS Vault Digital Archival (Phase 11 - M29) */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    Kho Lưu Trữ Hồ Sơ Số (M29 DMS Secure Vault)
                  </span>
                  {activeInspectAward.dmsVault ? (
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded font-bold">
                      {activeInspectAward.dmsVault.docCode}
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                      Chưa niêm phong
                    </span>
                  )}
                </div>
                {activeInspectAward.dmsVault ? (
                  <div className="space-y-1 text-[11px] text-indigo-900 dark:text-indigo-200">
                    <div className="text-[10px] font-mono break-all bg-white dark:bg-slate-900 p-1.5 rounded border border-indigo-100 dark:border-indigo-800">
                      SHA-256: {activeInspectAward.dmsVault.sha256Hash}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Cấp lưu trữ: {activeInspectAward.dmsVault.storageTier}</span>
                      <span>Ký bởi: {activeInspectAward.dmsVault.signedBy || 'Audit Service'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500">Hồ sơ chưa được niêm phong số vào M29 Vault.</span>
                    <button
                      type="button"
                      disabled={sealingAwardId === activeInspectAward.id}
                      onClick={() => handleTriggerSealDms(activeInspectAward.id)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                      {sealingAwardId === activeInspectAward.id && <RefreshCw className="w-3 h-3 animate-spin" />}
                      Niêm phong ngay
                    </button>
                  </div>
                )}
              </div>

              {/* Approval Matrix Tiers */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <GitFork className="w-3.5 h-3.5 text-indigo-500" />
                    Ma Trận Phê Duyệt Đa Cấp (M28 Delegation of Authority)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {(activeInspectAward.totalAmount || 0) > 500000000 ? 'HẠN MỨC ĐA CẤP' : 'HẠN MỨC ĐƠN CẤP'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Cấp 1: Trưởng Phòng Mua Sắm (Procurement Manager)
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Thẩm định hồ sơ năng lực, ma trận so sánh giá &amp; tiêu chí kỹ thuật
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ĐÃ PHÊ DUYỆT
                    </span>
                  </div>

                  {(activeInspectAward.totalAmount || 0) > 500000000 && (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          2
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Cấp 2: Giám Đốc Khối Mua Sắm / CPO (Procurement Director)
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            Phê duyệt hạn mức thẩm quyền gói thầu quy mô &gt; 500.000.000 VNĐ
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {activeInspectAward.status === 'APPROVED' ? 'ĐÃ PHÊ DUYỆT' : 'CHỜ DUYỆT (SLA 48h)'}
                      </span>
                    </div>
                  )}

                  {(activeInspectAward.totalAmount || 0) > 2000000000 && (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          3
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Cấp 3: Giám Đốc Tài Chính (CFO) / Tổng Giám Đốc (CEO)
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            Phê duyệt hạn mức ngân sách đặc biệt &gt; 2.000.000.000 VNĐ
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        CHỜ DUYỆT (SLA 72h)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveInspectAward(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
