import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Factory,
  ArrowRight,
  Plus,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Filter,
  AlertCircle,
  Building2,
  RefreshCw,
  Table,
  LayoutGrid,
  Sliders,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';

interface DelegationPrMoTabProps {
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const DelegationPrMoTab: React.FC<DelegationPrMoTabProps> = ({ onNotify }) => {
  const [subTab, setSubTab] = useState<'PR' | 'MO'>('PR');
  const [purchaseRequisitions, setPurchaseRequisitions] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONVERTED_TO_PO'>('ALL');
  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>('auto');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Manual MO Delegation Form State
  const [selectedMoProductId, setSelectedMoProductId] = useState<number | ''>('');
  const [moPlannedQty, setMoPlannedQty] = useState<number>(50);
  const [moRequiredDate, setMoRequiredDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [moPriority, setMoPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [moNotes, setMoNotes] = useState('');
  const [moLoading, setMoLoading] = useState(false);

  // Manual PR Modal State
  const [isManualPrOpen, setIsManualPrOpen] = useState(false);
  const [selectedPrProductId, setSelectedPrProductId] = useState<number | ''>('');
  const [prQuantity, setPrQuantity] = useState<number>(100);
  const [prSupplierId, setPrSupplierId] = useState<number | ''>('');
  const [prRequiredDate, setPrRequiredDate] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  );
  const [prPriority, setPrPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [prNotes, setPrNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prRes, suppRes, prodRes] = await Promise.all([
        fetch('/api/scm/purchase-requisitions').then((r) => r.json()),
        fetch('/api/suppliers').then((r) => r.json()).catch(() => []),
        fetch('/api/products').then((r) => r.json()).catch(() => []),
      ]);

      setPurchaseRequisitions(Array.isArray(prRes) ? prRes : []);
      setSuppliers(Array.isArray(suppRes) ? suppRes : []);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
      if (Array.isArray(prodRes) && prodRes.length > 0) {
        if (!selectedMoProductId) setSelectedMoProductId(prodRes[0].id);
        if (!selectedPrProductId) setSelectedPrProductId(prodRes[0].id);
      }
      if (Array.isArray(suppRes) && suppRes.length > 0) {
        if (!prSupplierId) setPrSupplierId(suppRes[0].id);
      }
    } catch (err) {
      console.error('Error loading PR/MO data:', err);
      onNotify('danger', 'Lỗi tải dữ liệu', 'Không thể nạp danh sách yêu cầu tái cung ứng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelegateToPo = (pr: any) => {
    setConfirmDialog({
      isOpen: true,
      title: `Ủy quyền tạo Đơn Mua Hàng (PO) sang M08?`,
      message: `Hành động này sẽ gọi trực tiếp thẩm quyền ghi của M08 Strategic Sourcing để sinh Đơn đặt hàng mua (PO) chính thức cho ${pr.productName} với số lượng ${pr.quantity}. Trạng thái yêu cầu mua ${pr.prNumber} sẽ cập nhật thành CONVERTED_TO_PO.`,
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/scm/purchase-requisitions/${pr.id}/delegate-po`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prId: pr.id }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Lỗi khi ủy quyền tạo PO');
          }

          onNotify(
            'success',
            'Ủy quyền thành công sang M08',
            `Đã khởi tạo Đơn mua hàng PO mã ${data.purchaseOrder?.code} thành công dưới quyền M08 Strategic Sourcing.`
          );
          fetchData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi ủy quyền PO', err.message);
        }
      },
    });
  };

  const handleCreateMoSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMoProductId) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng chọn sản phẩm cần sản xuất.');
      return;
    }
    if (moPlannedQty <= 0) {
      onNotify('warning', 'Số lượng không hợp lệ', 'Sản lượng phải lớn hơn 0.');
      return;
    }

    setMoLoading(true);
    try {
      const res = await fetch('/api/scm/mo-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: Number(selectedMoProductId),
          plannedQuantity: Number(moPlannedQty),
          requiredDate: moRequiredDate,
          priority: moPriority,
          notes: moNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi đề xuất lệnh sản xuất');
      }

      onNotify(
        'success',
        'Ủy quyền thành công sang M25',
        `Đã tạo Lệnh sản xuất MO mã ${data.manufacturingOrder?.code} dưới thẩm quyền M25 MES.`
      );
      setMoNotes('');
      fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi tạo MO', err.message);
    } finally {
      setMoLoading(false);
    }
  };

  const handleCreateManualPr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrProductId) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng chọn sản phẩm cần mua.');
      return;
    }
    try {
      const res = await fetch('/api/scm/purchase-requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: Number(selectedPrProductId),
          quantity: Number(prQuantity),
          suggestedSupplierId: prSupplierId ? Number(prSupplierId) : undefined,
          requiredDate: prRequiredDate,
          priority: prPriority,
          notes: prNotes || 'Tạo thủ công bởi SCM Planner',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Lỗi khi tạo yêu cầu mua hàng');
      }

      onNotify('success', 'Đã tạo PR', 'Yêu cầu mua hàng thủ công đã được ghi nhận.');
      setIsManualPrOpen(false);
      setPrNotes('');
      fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi tạo PR', err.message);
    }
  };

  const filteredPrList = purchaseRequisitions.filter((pr) => {
    const matchSearch =
      (pr.prNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pr.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pr.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pr.delegatedPoCode || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || pr.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const totalPrCount = purchaseRequisitions.length;
  const pendingPrCount = purchaseRequisitions.filter((pr) => pr.status === 'PENDING').length;
  const convertedPoCount = purchaseRequisitions.filter((pr) => pr.status === 'CONVERTED_TO_PO').length;
  const totalPrAmount = purchaseRequisitions.reduce(
    (sum, pr) => sum + (pr.estimatedTotalAmount || pr.quantity * (pr.estimatedUnitCost || 0)),
    0
  );

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L2: KPI METRIC STRIP (M25 COMPATIBLE 4-METRIC GRID)                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Tổng Yêu Cầu (PR)
            </span>
            <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white">
              {totalPrCount}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Từ đề xuất MRP &amp; Thủ công
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
              Chờ Ủy Quyền PO
            </span>
            <div className="font-mono tabular-nums font-bold text-2xl text-amber-600 dark:text-amber-400">
              {pendingPrCount}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Chờ Planner phê duyệt
            </span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
              Đã Tạo PO (M08)
            </span>
            <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400">
              {convertedPoCount}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Ủy quyền thành công
            </span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
              Tổng Giá Trị Dự Toán
            </span>
            <div className="font-mono tabular-nums font-bold text-base sm:text-lg text-blue-600 dark:text-blue-400 truncate">
              {formatVND(totalPrAmount)}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Định giá mua ngoài
            </span>
          </div>
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1 COMMAND BAR: SUB-TAB SWITCHER, SEARCH, FILTERS, ACTIONS                */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Sub-tab Pill Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setSubTab('PR')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                subTab === 'PR'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Yêu Cầu Mua Hàng PR (M08) ({purchaseRequisitions.length})</span>
            </button>
            <button
              onClick={() => setSubTab('MO')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                subTab === 'MO'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              <span>Phát Lệnh Sản Xuất MO (M25)</span>
            </button>
          </div>

          {subTab === 'PR' && (
            <>
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm mã PR, PO ủy quyền, SKU, tên SP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 dark:text-white transition-all"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Chờ ủy quyền (PENDING)</option>
                <option value="CONVERTED_TO_PO">Đã tạo đơn mua (CONVERTED_TO_PO)</option>
              </select>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          {subTab === 'PR' && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Chế độ Bảng"
              >
                <Table className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Bảng</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Chế độ Thẻ"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Thẻ</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('auto')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'auto'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Tự động"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-[11px]">Tự động</span>
              </button>
            </div>
          )}

          <button
            onClick={fetchData}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {subTab === 'PR' && (
            <button
              onClick={() => setIsManualPrOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo PR Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DATA PRESENTATION: PURCHASE REQUISITIONS (PR) OR MO DELEGATION FORM       */}
      {/* ========================================================================= */}
      {subTab === 'PR' ? (
        loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 shadow-2xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50 text-emerald-600" />
            Đang nạp danh sách yêu cầu mua hàng PR...
          </div>
        ) : filteredPrList.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 shadow-2xs">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            Không có yêu cầu mua hàng nào phù hợp với bộ lọc.
          </div>
        ) : (
          <>
            {/* 1. TABLE VIEW */}
            {(viewMode === 'table' || viewMode === 'auto') && (
              <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden ${viewMode === 'auto' ? 'hidden md:block' : 'block'}`}>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap min-w-[900px] lg:min-w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mã PR</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sản Phẩm &amp; SKU</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Số Lượng</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Đơn Giá Ước Tính</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Thành Tiền Dự Toán</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nhà Cung Cấp</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Ngày Cần Hàng</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Ưu Tiên</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Trạng Thái</th>
                        <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Ủy Quyền (M08)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredPrList.map((pr) => {
                        const isConverted = pr.status === 'CONVERTED_TO_PO';

                        return (
                          <tr
                            key={pr.id}
                            className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 ${
                              isConverted
                                ? 'border-l-4 border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10'
                                : 'border-l-4 border-amber-500 bg-amber-50/10 dark:bg-amber-950/10'
                            }`}
                          >
                            <td className="p-2.5 sm:p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{pr.prNumber}</td>
                            <td className="p-2.5 sm:p-3">
                              <div className="font-bold text-slate-900 dark:text-white">{pr.productName}</div>
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600 inline-block mt-0.5">
                                {pr.sku}
                              </span>
                            </td>
                            <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white text-sm">
                              {pr.quantity}
                            </td>
                            <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                              {formatVND(pr.estimatedUnitCost || 0)}
                            </td>
                            <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                              {formatVND(pr.estimatedTotalAmount || pr.quantity * (pr.estimatedUnitCost || 0))}
                            </td>
                            <td className="p-2.5 sm:p-3 text-slate-700 dark:text-slate-300">
                              {pr.suggestedSupplierName ? (
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{pr.suggestedSupplierName}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 italic">M08 Đề xuất</span>
                              )}
                            </td>
                            <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">{pr.requiredDate}</td>
                            <td className="p-2.5 sm:p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  pr.priority === 'URGENT'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                                    : pr.priority === 'HIGH'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {pr.priority}
                              </span>
                            </td>
                            <td className="p-2.5 sm:p-3 text-center">
                              {isConverted ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
                                    <CheckCircle2 className="w-3 h-3" /> Đã tạo PO
                                  </span>
                                  {pr.delegatedPoCode && (
                                    <div className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                      {pr.delegatedPoCode}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800">
                                  <Clock className="w-3 h-3" /> Chờ Ủy Quyền
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 sm:p-3 text-center">
                              {isConverted ? (
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> M08 Quản lý
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleDelegateToPo(pr)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs flex items-center gap-1 mx-auto cursor-pointer"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                  <span>Ủy Quyền PO</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. CARD VIEW (Adaptive for mobile or cards toggle) */}
            {(viewMode === 'cards' || viewMode === 'auto') && (
              <div className={`space-y-3 ${viewMode === 'auto' ? 'block md:hidden' : 'block'}`}>
                {filteredPrList.map((pr) => {
                  const isConverted = pr.status === 'CONVERTED_TO_PO';

                  return (
                    <div
                      key={pr.id}
                      className={`p-4 rounded-xl border shadow-2xs bg-white dark:bg-slate-800 space-y-3 ${
                        isConverted ? 'border-emerald-300 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">{pr.prNumber}</span>
                        {isConverted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Đã tạo PO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800">
                            <Clock className="w-3 h-3" /> Chờ Ủy Quyền
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{pr.productName}</h4>
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600 inline-block mt-0.5">
                          {pr.sku}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Số Lượng:</span>
                          <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-base">{pr.quantity}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Thành Tiền:</span>
                          <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatVND(pr.estimatedTotalAmount || pr.quantity * (pr.estimatedUnitCost || 0))}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Hạn: {pr.requiredDate}</span>
                        {!isConverted ? (
                          <button
                            onClick={() => handleDelegateToPo(pr)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>Ủy Quyền PO</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                            PO: {pr.delegatedPoCode}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )
      ) : (
        /* MO DELEGATION FORM & SCM ARCHITECTURE PANEL */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Ủy Quyền Lệnh Sản Xuất (MO)</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Ghi nhận lệnh chính thức sang M25 MES</p>
              </div>
            </div>

            <form onSubmit={handleCreateMoSuggestion} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sản Phẩm Thành Phẩm <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedMoProductId}
                  onChange={(e) => setSelectedMoProductId(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 dark:text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sản Lượng Lệnh SX <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={moPlannedQty}
                    onChange={(e) => setMoPlannedQty(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-right font-bold text-indigo-600 dark:text-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mức Ưu Tiên</label>
                  <select
                    value={moPriority}
                    onChange={(e) => setMoPriority(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 dark:text-white"
                  >
                    <option value="NORMAL">Bình thường (NORMAL)</option>
                    <option value="HIGH">Ưu tiên cao (HIGH)</option>
                    <option value="URGENT">Khẩn cấp (URGENT)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày Hoàn Thành Yêu Cầu</label>
                <input
                  type="date"
                  value={moRequiredDate}
                  onChange={(e) => setMoRequiredDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ghi Chú Đính Kèm</label>
                <textarea
                  rows={2}
                  value={moNotes}
                  onChange={(e) => setMoNotes(e.target.value)}
                  placeholder="Ghi chú kế hoạch phân xưởng..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={moLoading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Factory className="w-4 h-4" />
                <span>{moLoading ? 'Đang ủy quyền...' : 'Ủy Quyền Phát Lệnh Sang M25'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Cơ Chế Ủy Quyền Domain Sang M25 MES &amp; M08 Strategic Sourcing
            </h4>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">Tuân Thủ Thẩm Quyền Đơn Nhất (Rule #03-#07):</span>
                <p className="text-slate-600 dark:text-slate-300">
                  M26 Supply Chain Planning &amp; MRP hoạt động với tư cách <strong>Bộ máy Cân bằng Nhu cầu (Demand Balancer)</strong>. Khi phát hiện thiếu hụt, hệ thống <em>không tự ý ghi vào bảng vận hành nội bộ của module khác</em> mà thực thi ủy quyền chính thống:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                  <li>
                    <strong>Tái Cung Ứng Mua Ngoài (Outsourced/Raw Materials):</strong> Ghi bản ghi vào <code>purchase_requisitions</code>, người lập kế hoạch có thể kích hoạt <code>/api/scm/purchase-requisitions/:id/delegate-po</code> để tạo đơn <code>purchase_orders</code> thuộc thẩm quyền M08 Strategic Sourcing.
                  </li>
                  <li>
                    <strong>Tái Cung Ứng Nội Bộ (In-house Assembly):</strong> Gọi <code>/api/scm/mo-suggestions</code> để tạo <code>manufacturing_orders</code> thuộc thẩm quyền M25 MES, tự động gán BOM định mức vật tư.
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200">
                <span className="font-bold block mb-1">Bảo Vệ Tính Toàn Vẹn Của Hệ Thống:</span>
                Mọi đơn hàng và lệnh sản xuất sinh ra từ M26 đều có mã truy vết (Audit Trail) liên kết với phiên chạy MRP tương ứng, giúp toàn bộ chuỗi cung ứng minh bạch từ Nhu cầu dự báo → MRP → PR/MO → Nhập kho.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual PR Modal */}
      {isManualPrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tạo Yêu Cầu Mua Hàng Mới (Purchase Requisition)</h3>
              <button onClick={() => setIsManualPrOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateManualPr} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sản Phẩm Cần Mua</label>
                <select
                  value={selectedPrProductId}
                  onChange={(e) => setSelectedPrProductId(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Số Lượng</label>
                  <input
                    type="number"
                    min="1"
                    value={prQuantity}
                    onChange={(e) => setPrQuantity(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-right font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mức Ưu Tiên</label>
                  <select
                    value={prPriority}
                    onChange={(e) => setPrPriority(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  >
                    <option value="NORMAL">Bình thường (NORMAL)</option>
                    <option value="HIGH">Ưu tiên cao (HIGH)</option>
                    <option value="URGENT">Khẩn cấp (URGENT)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nhà Cung Cấp Đề Xuất (Tùy chọn)</label>
                <select
                  value={prSupplierId}
                  onChange={(e) => setPrSupplierId(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                >
                  <option value="">Tự động đề xuất theo M08</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày Cần Hàng</label>
                <input
                  type="date"
                  value={prRequiredDate}
                  onChange={(e) => setPrRequiredDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ghi Chú</label>
                <textarea
                  rows={2}
                  value={prNotes}
                  onChange={(e) => setPrNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsManualPrOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Tạo PR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};
