import React, { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Factory,
  Layers,
  Calendar,
  Clock,
  ArrowRight,
  Filter,
  Link2,
  X,
  User,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Boxes,
  Sliders,
  Table,
  LayoutGrid,
} from 'lucide-react';
import { RunMrpModal } from './RunMrpModal';
import { DmsDossierSealModal } from './DmsDossierSealModal';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { TablePagination } from '../../../../components/common/TablePagination';
import { ProductionOrderDetailDrawer, ProductionOrderDetails } from './ProductionOrderDetailDrawer';
import { ConfirmDialogState, SelectedEntityContext } from '../../../../types';

interface MrpRunResultsTabProps {
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  onSelectEntity: (entity: SelectedEntityContext) => void;
}

export const MrpRunResultsTab: React.FC<MrpRunResultsTabProps> = ({
  onNotify,
  onSelectEntity,
}) => {
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mrpPage, setMrpPage] = useState<number>(1);
  const [mrpPageSize, setMrpPageSize] = useState<number>(15);
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState<ProductionOrderDetails | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [levelFilter, setLevelFilter] = useState<'ALL' | '0' | '1' | '2'>('ALL');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'CREATE_PR' | 'CREATE_MO' | 'NONE'>('ALL');
  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>('auto');
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isSealModalOpen, setIsSealModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [peggingModalItem, setPeggingModalItem] = useState<any | null>(null);

  const fetchRunsAndResults = async (preferredRunId?: number) => {
    setLoading(true);
    try {
      const runsRes = await fetch('/api/scm/mrp/runs').then((r) => r.json());
      const runList = Array.isArray(runsRes) ? runsRes : [];
      setRuns(runList);

      const targetRunId = preferredRunId || (runList.length > 0 ? runList[0].id : null);
      setSelectedRunId(targetRunId);

      if (targetRunId) {
        const resultsRes = await fetch(`/api/scm/mrp/results?runId=${targetRunId}`).then((r) => r.json());
        const resList = Array.isArray(resultsRes) ? resultsRes : [];
        setResults(resList);
        if (resList.length > 0) {
          handleSelectEntity(resList[0]);
        }
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Error fetching MRP runs/results:', err);
      onNotify('danger', 'Lỗi tải dữ liệu', 'Không thể nạp dữ liệu kết quả cân bằng MRP.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRunsAndResults();
  }, []);

  const handleSelectRun = async (runId: number) => {
    setSelectedRunId(runId);
    setLoading(true);
    try {
      const res = await fetch(`/api/scm/mrp/results?runId=${runId}`).then((r) => r.json());
      const resList = Array.isArray(res) ? res : [];
      setResults(resList);
      if (resList.length > 0) {
        handleSelectEntity(resList[0]);
      }
    } catch (err) {
      console.error('Error switching run:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEntity = (r: any) => {
    setSelectedRowId(r.id);
    setSelectedOrderForDrawer({
      id: r.id,
      orderCode: r.suggestedOrderCode || `MO-${r.sku}-2026`,
      productName: r.productName,
      sku: r.sku,
      plannedQty: r.orderQuantity || r.netRequirement || 100,
      uom: r.uom || 'Cái',
      startDate: '28/08/2026',
      dueDate: r.requiredDate || '05/09/2026',
      priority: 'HIGH',
      status: r.suggestedAction === 'CREATE_MO' ? 'PLANNED' : 'RELEASED',
      workCenter: 'WC-CNC-01',
      bomVersion: 'BOM-REV-2.4',
    });
    onSelectEntity({
      type: 'SUPPLY_CHAIN_PLAN',
      id: r.id || r.sku,
      code: `MRP-${r.sku}`,
      title: `Nhu cầu ròng: ${r.productName} (Ròng: ${r.netRequirement || 0} ${r.suggestedAction})`,
      status: r.status || 'PROPOSED',
      lineage: [
        { id: `prod-${r.productId}`, type: 'Sản phẩm Master', code: r.sku, relation: 'SUBJECT', status: 'ACTIVE' },
        ...(r.level > 0 && r.parentSku
          ? [{ id: `parent-${r.parentSku}`, type: 'BOM Cấp Cha', code: r.parentSku, relation: 'PARENT_DEMAND_SOURCE', status: 'ACTIVE' }]
          : []),
        ...(r.suggestedAction === 'CREATE_PR'
          ? [{ id: `pr-sug-${r.id}`, type: 'Đề xuất Yêu cầu Mua hàng PR (M08)', code: `PR-${r.sku}`, relation: 'PURCHASE_RECOMMENDATION', status: r.status }]
          : []),
        ...(r.suggestedAction === 'CREATE_MO'
          ? [{ id: `mo-sug-${r.id}`, type: 'Đề xuất Lệnh Sản xuất MO (M25)', code: `MO-${r.sku}`, relation: 'MANUFACTURING_RECOMMENDATION', status: r.status }]
          : []),
      ],
      auditTrail: [
        { id: 1, action: `Thuật toán MRP xác định nhu cầu ròng = ${r.netRequirement}`, timestamp: new Date().toISOString(), user: 'MRP_ENGINE' },
        { id: 2, action: `Đề xuất hành động: ${r.suggestedAction} với số lượng = ${r.suggestedOrderQty}`, timestamp: new Date().toISOString(), user: 'MRP_ENGINE' },
      ],
      glEntries: [
        { account: 'TK 152/156', accountName: 'Tồn kho dự toán tái cung ứng', debit: (r.suggestedOrderQty || 0) * 500000, credit: 0, description: `Dự toán tái cung ứng cho ${r.sku}` },
        { account: 'TK 331/154', accountName: 'Chi phí dở dang / Phải trả NCC dự kiến', debit: 0, credit: (r.suggestedOrderQty || 0) * 500000, description: `Đối ứng dự toán cung ứng` },
      ],
    });
  };

  const handleCreatePrFromMrp = (r: any) => {
    setConfirmDialog({
      isOpen: true,
      title: `Ủy quyền tạo Yêu Cầu Mua Hàng (PR) cho ${r.sku}?`,
      message: `Hệ thống sẽ tạo bản ghi Purchase Requisition cho ${r.productName} với số lượng đề xuất ${r.suggestedOrderQty}, sẵn sàng để chuyển tiếp thành đơn mua hàng PO sang M08 Strategic Sourcing.`,
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/scm/purchase-requisitions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: r.productId,
              mrpRunId: selectedRunId,
              mrpResultId: r.id,
              quantity: r.suggestedOrderQty,
              requiredDate: r.requiredDate,
              priority: 'HIGH',
              notes: `Ủy quyền tự động từ kết quả chạy MRP cho ${r.productName}`,
            }),
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Lỗi khi tạo PR');
          }
          onNotify('success', 'Đã tạo PR thành công', `Bản ghi Yêu cầu mua hàng cho ${r.sku} đã được ghi nhận.`);
          fetchRunsAndResults(selectedRunId || undefined);
        } catch (err: any) {
          onNotify('danger', 'Lỗi', err.message);
        }
      },
    });
  };

  const handleCreateMoFromMrp = (r: any) => {
    setConfirmDialog({
      isOpen: true,
      title: `Ủy quyền phát Lệnh Sản Xuất (MO) cho ${r.sku}?`,
      message: `Hệ thống sẽ gọi trực tiếp thẩm quyền của M25 MES để sinh Lệnh sản xuất chính thức với số lượng ${r.suggestedOrderQty}, tự động bóc tách định mức BOM và đặt lịch phân xưởng.`,
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/scm/mo-suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: r.productId,
              plannedQuantity: r.suggestedOrderQty,
              warehouseId: r.warehouseId || 1,
              requiredDate: r.requiredDate,
              mrpResultId: r.id,
              priority: 'NORMAL',
            }),
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Lỗi khi tạo MO');
          }
          const moData = await res.json();
          onNotify(
            'success',
            'Đã ủy quyền thành công sang M25',
            `Lệnh sản xuất ${moData.manufacturingOrder?.code || ''} đã được khởi tạo thành công dưới thẩm quyền M25 MES.`
          );
          fetchRunsAndResults(selectedRunId || undefined);
        } catch (err: any) {
          onNotify('danger', 'Lỗi', err.message);
        }
      },
    });
  };

  const currentRun = runs.find((run) => run.id === selectedRunId);

  const filteredResults = results.filter((r) => {
    const matchSearch =
      (r.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchLevel = levelFilter === 'ALL' || String(r.level) === levelFilter;
    const matchAction = actionFilter === 'ALL' || r.suggestedAction === actionFilter;
    return matchSearch && matchLevel && matchAction;
  });

  const paginatedResults = useMemo(() => {
    const start = (mrpPage - 1) * mrpPageSize;
    return filteredResults.slice(start, start + mrpPageSize);
  }, [filteredResults, mrpPage, mrpPageSize]);

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L2: KPI METRIC STRIP (M25 COMPATIBLE 6-METRIC GRID)                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              SP Phân Tích
            </span>
            <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white">
              {currentRun?.totalProductsAnalyzed || 0}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Tổng Cầu Thô
            </span>
            <div className="font-mono tabular-nums font-bold text-2xl text-blue-600 dark:text-blue-400">
              {currentRun?.totalGrossRequirements || 0}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Nhu Cầu Ròng
            </span>
            <div className="font-mono tabular-nums font-bold text-2xl text-rose-600 dark:text-rose-400">
              {currentRun?.totalNetRequirements || 0}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Đề Xuất Mua (PR)
            </span>
            <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400">
              {currentRun?.totalPurchaseSuggestions || 0}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Đề Xuất SX (MO)
            </span>
            <div className="font-mono tabular-nums font-bold text-2xl text-indigo-600 dark:text-indigo-400">
              {currentRun?.totalMoSuggestions || 0}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            <Factory className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Cảnh Báo Ngoại Lệ
            </span>
            <div className="font-mono tabular-nums font-bold text-2xl text-amber-600 dark:text-amber-400">
              {currentRun?.totalExceptions || 0}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1 COMMAND BAR: SEARCH, FILTERS, RUN SELECTION, VIEW MODES                */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Run Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Phiên Chạy:
            </span>
            <select
              value={selectedRunId || ''}
              onChange={(e) => handleSelectRun(Number(e.target.value))}
              className="p-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900 dark:text-white max-w-[220px]"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  [{r.runCode}] {r.runType} ({r.totalProductsAnalyzed || 0} SP)
                </option>
              ))}
            </select>
          </div>

          {/* Search Field */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo SKU, tên sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white transition-all"
            />
          </div>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="p-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white"
          >
            <option value="ALL">Tất cả cấp BOM</option>
            <option value="0">Cấp 0 (Thành phẩm)</option>
            <option value="1">Cấp 1 (Bán thành phẩm)</option>
            <option value="2">Cấp 2 (Nguyên vật liệu)</option>
          </select>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as any)}
            className="p-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white"
          >
            <option value="ALL">Tất cả hành động</option>
            <option value="CREATE_PR">Đề xuất mua (PR)</option>
            <option value="CREATE_MO">Đề xuất SX (MO)</option>
            <option value="NONE">Đã cân bằng (NONE)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
          {/* View Mode Toggle for All Screen Resolutions */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Chế độ Bảng (Table View)"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Bảng</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Chế độ Thẻ (Card View)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Thẻ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('auto')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'auto'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Tự động tối ưu theo độ phân giải thiết bị"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Tự động</span>
            </button>
          </div>

          <button
            onClick={() => fetchRunsAndResults(selectedRunId || undefined)}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Action Buttons */}
          <button
            onClick={() => setIsSealModalOpen(true)}
            disabled={!currentRun}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Niêm Phong</span> DMS
          </button>

          <button
            onClick={() => setIsRunModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Chạy MRP Mới</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DATA PRESENTATION: ADAPTIVE TABLE & CARD VIEWS                            */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 shadow-2xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50 text-blue-600" />
          Đang tải dữ liệu cân bằng nhu cầu MRP...
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 shadow-2xs">
          <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
          Không tìm thấy nhu cầu ròng nào phù hợp tiêu chí lọc.
        </div>
      ) : (
        <>
          {/* 1. TABLE VIEW */}
          {(viewMode === 'table' || viewMode === 'auto') && (
            <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden ${viewMode === 'auto' ? 'hidden md:block' : 'block'}`}>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs whitespace-nowrap min-w-[880px] lg:min-w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-28">Cấp BOM</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[180px]">Sản Phẩm &amp; SKU</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right w-24">Nhu Cầu Thô</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right w-20">Đang Về</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right w-20">Tồn Kho</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right w-20">Giữ Chỗ</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right w-24">Nhu Cầu Ròng</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right w-24">Số Lượng Đặt</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center w-28">Đề Xuất</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right w-28">Ngày Cần</th>
                      <th className="p-2.5 sm:p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center w-36">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {paginatedResults.map((r) => {
                      const isSelected = selectedRowId === r.id;
                      return (
                        <tr
                          key={r.id}
                          onClick={() => handleSelectEntity(r)}
                          className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer ${
                            isSelected
                              ? 'border-l-4 border-blue-600 bg-blue-50/70 dark:bg-slate-700/80'
                              : r.suggestedAction === 'CREATE_PR'
                              ? 'border-l-4 border-emerald-500/60 bg-emerald-50/5 dark:bg-emerald-950/10'
                              : r.suggestedAction === 'CREATE_MO'
                              ? 'border-l-4 border-indigo-500/60 bg-indigo-50/5 dark:bg-indigo-950/10'
                              : 'border-l-4 border-transparent'
                          }`}
                        >
                          <td className="p-2.5 sm:p-3">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border ${
                                  r.level === 0
                                    ? 'bg-indigo-100 text-indigo-950 border-indigo-300 dark:bg-indigo-950/90 dark:text-indigo-200 dark:border-indigo-700'
                                    : r.level === 1
                                    ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700'
                                    : 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                                }`}
                              >
                                Level {r.level}
                              </span>
                            </div>
                            {r.parentSku && (
                              <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                                Của: {r.parentSku}
                              </div>
                            )}
                          </td>

                          <td className="p-2.5 sm:p-3">
                            <div className="font-bold text-slate-900 dark:text-white">{r.productName}</div>
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600 inline-block mt-0.5">
                              {r.sku}
                            </span>
                          </td>

                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300">
                            {r.grossRequirement}
                          </td>
                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400">
                            {r.scheduledReceipts || 0}
                          </td>
                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300">
                            {r.onHandStock || 0}
                          </td>
                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                            {r.reservedStock || 0}
                          </td>

                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400 text-sm">
                            {r.netRequirement > 0 ? r.netRequirement : 0}
                          </td>

                          <td className="p-2.5 sm:p-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                            {r.suggestedOrderQty > 0 ? r.suggestedOrderQty : '—'}
                          </td>

                          <td className="p-2.5 sm:p-3 text-center">
                            {r.suggestedAction === 'CREATE_PR' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700">
                                <ShoppingCart className="w-3 h-3" /> Mua (PR)
                              </span>
                            )}
                            {r.suggestedAction === 'CREATE_MO' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-950 border border-indigo-300 dark:bg-indigo-950/90 dark:text-indigo-200 dark:border-indigo-700">
                                <Factory className="w-3 h-3" /> SX (MO)
                              </span>
                            )}
                            {r.suggestedAction === 'NONE' && (
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600">
                                Đã cân bằng
                              </span>
                            )}
                          </td>

                          <td className="p-2.5 sm:p-3 text-right font-mono text-slate-600 dark:text-slate-300">
                            <span className="font-bold">{r.requiredDate}</span>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">Phát: {r.releaseDate}</div>
                          </td>

                          <td className="p-2.5 sm:p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              {r.suggestedAction === 'CREATE_PR' && (
                                <button
                                  onClick={() => handleCreatePrFromMrp(r)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                >
                                  Tạo PR (M08)
                                </button>
                              )}
                              {r.suggestedAction === 'CREATE_MO' && (
                                <button
                                  onClick={() => handleCreateMoFromMrp(r)}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                >
                                  Tạo MO (M25)
                                </button>
                              )}
                              {r.suggestedAction === 'NONE' && (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">—</span>
                              )}

                              {/* Pegging Lineage Trace Button */}
                              <button
                                onClick={() => setPeggingModalItem(r)}
                                title="Truy vết nguồn gốc đơn hàng (Pegging Lineage)"
                                className="p-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-slate-600"
                              >
                                <Link2 className="w-4 h-4" />
                              </button>
                            </div>
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
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${viewMode === 'auto' ? 'block md:hidden' : 'block'}`}>
              {filteredResults.map((r) => {
                const isSelected = selectedRowId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectEntity(r)}
                    className={`bg-white dark:bg-slate-800 p-4 rounded-xl border transition-all cursor-pointer shadow-2xs flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border ${
                            r.level === 0
                              ? 'bg-indigo-100 text-indigo-950 border-indigo-300 dark:bg-indigo-950/90 dark:text-indigo-200 dark:border-indigo-700'
                              : r.level === 1
                              ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700'
                              : 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                          }`}
                        >
                          Level {r.level}
                        </span>
                        {r.suggestedAction === 'CREATE_PR' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700">
                            <ShoppingCart className="w-3 h-3" /> Mua (PR)
                          </span>
                        )}
                        {r.suggestedAction === 'CREATE_MO' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-950 border border-indigo-300 dark:bg-indigo-950/90 dark:text-indigo-200 dark:border-indigo-700">
                            <Factory className="w-3 h-3" /> SX (MO)
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {r.productName}
                      </h4>
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600 inline-block mt-1">
                        {r.sku}
                      </span>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Nhu Cầu Ròng:</span>
                          <span className="font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400 text-base">
                            {r.netRequirement > 0 ? r.netRequirement : 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">SL Đặt Đề Xuất:</span>
                          <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-base">
                            {r.suggestedOrderQty > 0 ? r.suggestedOrderQty : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setPeggingModalItem(r)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Pegging</span>
                      </button>

                      {r.suggestedAction === 'CREATE_PR' && (
                        <button
                          onClick={() => handleCreatePrFromMrp(r)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          Tạo PR (M08)
                        </button>
                      )}
                      {r.suggestedAction === 'CREATE_MO' && (
                        <button
                          onClick={() => handleCreateMoFromMrp(r)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          Tạo MO (M25)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODALS & INSPECTION DIALOGS                                               */}
      {/* ========================================================================= */}
      <RunMrpModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        onSuccess={(data) => fetchRunsAndResults(data.run?.id)}
        onNotify={onNotify}
      />

      {/* Full Pegging Lineage Trace Modal (Phase 10) */}
      {peggingModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    Truy Vết Nguồn Gốc Nhu Cầu (Full Pegging Lineage)
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Mã SKU: <span className="font-mono font-bold text-white">{peggingModalItem.sku}</span> ({peggingModalItem.productName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPeggingModalItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Cấp Độ BOM:</div>
                  <div className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">Level {peggingModalItem.level}</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Nhu Cầu Ròng:</div>
                  <div className="font-bold text-rose-600 dark:text-rose-400 font-mono text-sm mt-0.5">{peggingModalItem.netRequirement} đơn vị</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Ngày Cần Hàng:</div>
                  <div className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">{peggingModalItem.requiredDate}</div>
                </div>
              </div>

              {/* Pegging Details List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Đơn Hàng Bán Gốc &amp; Khách Hàng (M13 Sales Demand)
                </h4>

                {peggingModalItem.soPeggingLineage && peggingModalItem.soPeggingLineage.length > 0 ? (
                  <div className="space-y-2.5">
                    {peggingModalItem.soPeggingLineage.map((so: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-900 dark:bg-blue-950/90 dark:text-blue-200 font-mono font-bold rounded text-xs border border-blue-300 dark:border-blue-700">
                              {so.soCode}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{so.customerName || 'Khách hàng Bán buôn / Lẻ'}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Ngày cam kết giao: <strong className="font-mono text-slate-700 dark:text-slate-300">{so.dueDate || 'Không xác định'}</strong>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">Số lượng phân bổ:</div>
                          <div className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">{so.allocatedQty} đơn vị</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                    Nhu cầu của SKU này được kích hoạt từ Dự Báo Kinh Doanh / Lịch Sản Xuất Tổng Thể MPS hoặc Tồn Kho An Toàn (Safety Stock Guard).
                  </div>
                )}
              </div>

              {/* Hierarchy Tree Visual */}
              {peggingModalItem.level > 0 && peggingModalItem.parentSku && (
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-800 space-y-2 text-xs">
                  <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                    <Factory className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Cây Định Mức BOM Cấp Trên (Parent Explosion)
                  </div>
                  <p className="text-indigo-700 dark:text-indigo-300 text-[11px]">
                    Linh kiện này được nổ định mức trực tiếp từ Cụm / Thành phẩm cha: <strong className="font-mono font-bold">{peggingModalItem.parentSku}</strong>.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setPeggingModalItem(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <DmsDossierSealModal
        isOpen={isSealModalOpen}
        onClose={() => setIsSealModalOpen(false)}
        currentRun={currentRun}
        onNotify={onNotify}
        onSealSuccess={() => {
          fetchRunsAndResults(selectedRunId || undefined);
        }}
      />

      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};
