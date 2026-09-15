import React, { useState, useEffect } from 'react';
import { SelectedEntityContext } from '../../../../types';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { useWorkspaceAction } from '../../../../components/shell/DomainWorkspaceShell';
import {
  Factory,
  Play,
  CheckCircle,
  Clock,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  TrendingUp,
  Package,
  Search,
  RefreshCw,
  Zap,
  ShieldCheck,
  ClipboardCheck,
  Cpu,
  Boxes,
  Eye,
  ExternalLink
} from 'lucide-react';
import { WorkOrderInspectionModal } from './WorkOrderInspectionModal';

interface ManufacturingWorkspaceProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  showCreateModal?: boolean;
  onCloseCreateModal?: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info' | 'error', title: string, message: string) => void;
}

export const ManufacturingWorkspace: React.FC<ManufacturingWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const { setPrimaryAction } = useWorkspaceAction();
  const [isCreating, setIsCreating] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'orders' | 'boms' | 'costs'>('M25', 'orders');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMo, setSelectedMo] = useState<any | null>(null);
  const [inspectingMoId, setInspectingMoId] = useState<number | string | null>(null);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingMo, setReportingMo] = useState<any | null>(null);
  const [reportGoodQty, setReportGoodQty] = useState<number>(5);
  const [reportScrapQty, setReportScrapQty] = useState<number>(0);
  const [reportBatchNo, setReportBatchNo] = useState<string>('');

  // Create MO form state
  const [formProductId, setFormProductId] = useState<number>(1);
  const [formBomId, setFormBomId] = useState<number>(1);
  const [formPlannedQty, setFormPlannedQty] = useState<number>(10);
  const [formWorkCenterId, setFormWorkCenterId] = useState<number>(2);
  const [formPriority, setFormPriority] = useState<string>('NORMAL');
  const [formNotes, setFormNotes] = useState<string>('Lệnh sản xuất phục vụ giao hàng quý');
  const [submitting, setSubmitting] = useState(false);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: 'primary' | 'danger' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [moRes, bomRes, prodRes] = await Promise.all([
        fetch('/api/manufacturing/orders').then((r) => r.json()),
        fetch('/api/manufacturing/boms').then((r) => r.json()),
        fetch('/api/products').then((r) => r.json()),
      ]);
      const moData = Array.isArray(moRes) ? moRes : [];
      setOrders(moData);
      setBoms(Array.isArray(bomRes) ? bomRes : []);
      setProducts(Array.isArray(prodRes) ? prodRes : []);

      if (moData.length > 0 && !selectedMo) {
        handleSelectRow(moData[0]);
      }
    } catch (err) {
      console.error('Error loading manufacturing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setPrimaryAction(() => () => setIsCreating(true), 'Tạo Lệnh Sản Xuất MO');
    return () => setPrimaryAction(undefined, undefined);
  }, [setPrimaryAction]);

  const handleSelectRow = (mo: any) => {
    setSelectedMo(mo);
    const planned = mo.plannedQuantity ?? 1;
    const safePlanned = planned === 0 ? 1 : planned;
    const progress = Math.min(100, Math.round(((mo.producedQuantity ?? 0) / safePlanned) * 100));

    const plannedQty = mo.plannedQuantity ?? 10;
    const producedQty = mo.producedQuantity ?? 0;

    onSelectEntity({
      type: 'MANUFACTURING_ORDER',
      id: mo.id,
      code: mo.code,
      title: `Lệnh sản xuất: ${mo.code} — ${mo.productName || 'Thành phẩm'} (${progress}%)`,
      status: mo.status,
      lineage: [
        { id: `so-${mo.id}`, type: 'Đơn đặt hàng bán gốc', code: 'SO-2026-8802', relation: 'ROOT_SALES_ORDER', status: 'CONFIRMED' },
        { id: `mrp-${mo.id}`, type: 'Kế hoạch cung ứng MRP', code: 'PLN-2026-001', relation: 'MRP_REQUIREMENT', status: 'APPROVED' },
        { id: `bom-${mo.bomId}`, type: 'Định mức kỹ thuật BOM', code: mo.bomCode || 'BOM-STD', relation: 'ENGINEERING_SPEC', status: 'ACTIVE' },
        { id: `mo-${mo.id}`, type: 'Lệnh sản xuất thực thi', code: mo.code, relation: 'TARGET_EXECUTION', status: mo.status },
        { id: `mat-iss-${mo.id}`, type: 'Phiếu xuất kho vật tư 621', code: `ISS-${mo.code}`, relation: 'MATERIAL_ISSUE', status: mo.status === 'DRAFT' ? 'PENDING' : 'ISSUED' },
        ...(mo.status === 'COMPLETED' || producedQty > 0
          ? [{ id: `prod-rcpt-${mo.id}`, type: 'Phiếu nhập kho thành phẩm 155', code: `RCPT-${mo.code}`, relation: 'OUTPUT_RECEIPT', status: 'RECEIVED' }]
          : []),
      ],
      auditTrail: [
        { id: 1, action: 'Khởi tạo Lệnh sản xuất (DRAFT)', timestamp: mo.plannedStartDate || '2026-08-25T08:00:00Z', user: 'planner_lead', sha256Checksum: '9a8b7c6d5e4f3a2b1c' },
        ...(mo.status !== 'DRAFT'
          ? [{ id: 2, action: 'Phát lệnh & Giữ chỗ vật tư (RELEASED)', timestamp: '2026-08-26T09:15:00Z', user: 'production_mgr', sha256Checksum: '4f3a2b1c9a8b7c6d5e' }]
          : []),
        ...(mo.status === 'IN_PROGRESS' || mo.status === 'COMPLETED'
          ? [{ id: 3, action: 'Xuất kho vật tư & Ghi nhận sản lượng', timestamp: '2026-08-27T14:30:00Z', user: 'workshop_lead', sha256Checksum: '1c9a8b7c6d5e4f3a2b' }]
          : []),
      ],
      glEntries: [
        { account: 'TK 621', accountName: 'Chi phí NVL trực tiếp', debit: plannedQty * 18500000, credit: 0, description: `Xuất NVL theo định mức ${mo.code}` },
        { account: 'TK 622', accountName: 'Chi phí Nhân công trực tiếp', debit: plannedQty * 1400000, credit: 0, description: `Công sản xuất lệnh ${mo.code}` },
        { account: 'TK 627', accountName: 'Chi phí SX chung & Máy móc', debit: plannedQty * 1100000, credit: 0, description: `Khấu hao máy & điện xưởng SMT` },
        { account: 'TK 154', accountName: 'Chi phí SXKD dở dang', debit: 0, credit: plannedQty * 21000000, description: `Tập hợp giá thành sản xuất ${mo.code}` },
        { account: 'TK 155', accountName: 'Thành phẩm nhập kho', debit: producedQty * 21000000, credit: 0, description: `Nhập kho thành phẩm hoàn tất ${mo.code}` },
      ],
    });
  };

  const handleRelease = (mo: any) => {
    setConfirmDialog({
      isOpen: true,
      title: `Phát lệnh sản xuất ${mo.code}?`,
      message: `Hệ thống sẽ chuyển trạng thái sang RELEASED và tự động tạo yêu cầu giữ chỗ vật tư (Material Reservation) theo định mức BOM.`,
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/manufacturing/orders/${mo.id}/release`, { method: 'POST' });
          if (res.ok) {
            onNotify('success', 'Phát lệnh thành công', `Lệnh sản xuất ${mo.code} đã sẵn sàng vận hành.`);
            setOrders((prev) => prev.map((item) => (item.id === mo.id ? { ...item, status: 'RELEASED' } : item)));
            fetchData();
          } else {
            const data = await res.json().catch(() => ({}));
            onNotify('danger', 'Lỗi phát lệnh', data.error || 'Không thể cập nhật trạng thái.');
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi hệ thống', err.message);
        }
      },
    });
  };

  const handleIssueMaterials = (mo: any) => {
    setConfirmDialog({
      isOpen: true,
      title: `Xuất kho vật tư cho ${mo.code}?`,
      message: `Hệ thống sẽ thực hiện chuyển trạng thái sang IN_PROGRESS và tạo chứng từ xuất kho nguyên vật liệu cho phân xưởng.`,
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/manufacturing/orders/${mo.id}/issue-materials`, { method: 'POST' });
          if (res.ok) {
            onNotify('success', 'Xuất vật tư thành công', `Đã cấp phát linh kiện cho xưởng sản xuất lệnh ${mo.code}.`);
            setOrders((prev) => prev.map((item) => (item.id === mo.id ? { ...item, status: 'IN_PROGRESS' } : item)));
            fetchData();
          } else {
            const data = await res.json().catch(() => ({}));
            onNotify('danger', 'Lỗi xuất vật tư', data.error || 'Không thể xuất kho vật tư.');
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi xuất vật tư', err.message);
        }
      },
    });
  };

  const handleOpenReportModal = (mo: any) => {
    setReportingMo(mo);
    const plannedQty = mo.plannedQuantity ?? 10;
    const producedQty = mo.producedQuantity ?? 0;
    const remaining = Math.max(1, plannedQty - producedQty);
    setReportGoodQty(remaining);
    setReportScrapQty(0);
    setReportBatchNo(`LOT-${mo.code.replace('MO-', '')}-${Date.now().toString().slice(-4)}`);
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingMo) return;
    try {
      const res = await fetch(`/api/manufacturing/orders/${reportingMo.id}/report-production`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goodQuantity: reportGoodQty,
          scrapQuantity: reportScrapQty,
          batchNumber: reportBatchNo,
        }),
      });
      if (res.ok) {
        onNotify('success', 'Báo cáo sản lượng thành công', `Đã nhập kho ${reportGoodQty} ${reportingMo.uom} cho lệnh ${reportingMo.code}.`);
        setIsReportModalOpen(false);
        fetchData();
      } else {
        onNotify('danger', 'Lỗi báo cáo sản lượng', 'Không thể lưu dữ liệu sản xuất.');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi hệ thống', err.message);
    }
  };

  const handleCreateMo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/manufacturing/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: formProductId,
          bomId: formBomId,
          plannedQuantity: formPlannedQty,
          workCenterId: formWorkCenterId,
          priority: formPriority,
          notes: formNotes,
        }),
      });
      if (res.ok) {
        onNotify('success', 'Tạo lệnh sản xuất thành công', 'Lệnh sản xuất mới đã được đưa vào kế hoạch.');
        setIsCreating(false);
        fetchData();
      } else {
        onNotify('danger', 'Lỗi tạo lệnh', 'Không thể tạo lệnh sản xuất.');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi tạo lệnh', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((mo) => {
    const matchStatus = statusFilter === 'ALL' || mo.status === statusFilter;
    const matchSearch =
      (mo.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mo.productName && (mo.productName || "").toLowerCase().includes(searchQuery.toLowerCase())) ||
      (mo.workCenterName && (mo.workCenterName || "").toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatus && matchSearch;
  });

  // Calculate high-level KPIs
  const totalMoCount = orders.length;
  const inProgressCount = orders.filter((o) => o.status === 'IN_PROGRESS').length;
  const totalProducedUnits = orders.reduce((sum, o) => sum + (o.producedQuantity ?? 0), 0);
  const totalPlannedUnits = orders.reduce((sum, o) => sum + (o.plannedQuantity ?? 0), 0);
  const completionRate = totalPlannedUnits > 0 ? Math.round((totalProducedUnits / totalPlannedUnits) * 100) : 0;

  return (
    <div className="space-y-3.5 max-w-full pb-6">
      {/* ========================================================================= */}
      {/* L0: WORKSPACE BANNER & CORE IDENTITY (COMPACT & MODERN)                   */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-mono font-bold rounded-md border border-slate-200 dark:border-slate-600">
                M25 • MANUFACTURING BOM
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                Single-Writer Rule #05 • Production Ledger
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
              Quản Trị Sản Xuất &amp; Lệnh Thực Thi
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Rule #19 Confirmed</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TABS NAVIGATION STRIP (M41 MASTER SPEC)                              */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-full pb-0.5 custom-scrollbar">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 shrink-0" />
            <span>Lệnh Sản Xuất (MO)</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeTab === 'orders' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('boms')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'boms'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Định Mức BOM &amp; Định Tuyến</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
              activeTab === 'boms' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {boms.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('costs')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'costs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4 shrink-0" />
            <span>Tập Hợp Chi Phí (154/155)</span>
          </button>
        </div>

        {/* Right Info Strip */}
        <div className="hidden md:flex items-center gap-2.5 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5 font-medium whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            Manufacturing MRP II
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80 whitespace-nowrap">
            Work Centers &amp; WIP
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE SUB-TAB RENDER                                                     */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* TAB 1: ORDERS LIST */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* L2: KPI Metric Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Tổng Lệnh MO
                  </span>
                  <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white">
                    {totalMoCount}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Factory className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Đang Gia Công
                  </span>
                  <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white">
                    {inProgressCount}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Sản Lượng Đạt
                  </span>
                  <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white">
                    {totalProducedUnits.toLocaleString('vi-VN')}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <Package className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Tiến Độ Tổng
                  </span>
                  <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white">
                    {completionRate}%
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* L1 Command Bar for Orders */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo mã MO, sản phẩm, xưởng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="p-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="DRAFT">Bản thảo (DRAFT)</option>
                  <option value="RELEASED">Đã phát lệnh (RELEASED)</option>
                  <option value="IN_PROGRESS">Đang SX (IN_PROGRESS)</option>
                  <option value="COMPLETED">Hoàn tất (COMPLETED)</option>
                </select>
                <button
                  onClick={fetchData}
                  className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  title="Làm mới"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs whitespace-nowrap min-w-[760px]">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mã Lệnh MO</th>
                      <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sản Phẩm Thành Phẩm</th>
                      <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Định Mức BOM</th>
                      <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Tiến Độ (Qty)</th>
                      <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Xưởng / Chuyền</th>
                      <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Trạng Thái</th>
                      <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right sticky right-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xs z-10 shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.06)]">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                          Đang tải danh sách lệnh sản xuất...
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          Không có lệnh sản xuất nào phù hợp tiêu chí lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((mo) => {
                        const isSelected = selectedMo?.id === mo.id;
                        const planned = mo.plannedQuantity ?? 1;
                        const safePlanned = planned === 0 ? 1 : planned;
                        const produced = mo.producedQuantity ?? 0;
                        const progress = Math.min(100, Math.round((produced / safePlanned) * 100));

                        let statusColorClass = 'border-l-4 border-transparent';
                        let badgeClass = 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 font-medium';
                        
                        if (mo.status === 'RELEASED') {
                          statusColorClass = 'border-l-4 border-blue-500 bg-blue-50/15 dark:bg-blue-950/10';
                          badgeClass = 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 font-bold';
                        } else if (mo.status === 'IN_PROGRESS') {
                          statusColorClass = 'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10';
                          badgeClass = 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold';
                        } else if (mo.status === 'COMPLETED') {
                          statusColorClass = 'border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10';
                          badgeClass = 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold';
                        }

                        return (
                          <tr
                            key={mo.id}
                            onClick={() => handleSelectRow(mo)}
                            className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer ${isSelected ? 'bg-slate-50 dark:bg-slate-800/60' : ''} ${statusColorClass}`}
                          >
                            <td className="p-3 font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                              {mo.code}
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">{mo.productName}</div>
                              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{mo.productSku}</div>
                            </td>
                            <td className="p-3">
                              <span className="font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-[11px] border border-slate-200 dark:border-slate-600">
                                {mo.bomCode} ({mo.bomVersion})
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="w-32 sm:w-36 ml-auto space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="text-slate-700 dark:text-slate-300 font-bold text-right w-full">
                                    {produced.toLocaleString('vi-VN')} / {planned.toLocaleString('vi-VN')} {mo.uom}
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      progress >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                              {mo.workCenterName}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] border ${badgeClass}`}>
                                {mo.status}
                              </span>
                            </td>
                            <td className="p-3 text-right sticky right-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs z-10 shadow-[-4px_0_8px_-3px_rgba(0,0,0,0.06)]">
                              <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => setInspectingMoId(mo.id || mo.code)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                                  title="Kiểm tra chi tiết và lịch sử API của lệnh sản xuất này"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" /> Chi Tiết
                                </button>
                                {mo.status === 'DRAFT' && (
                                  <button
                                    onClick={() => handleRelease(mo)}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                                  >
                                    <Play className="w-3.5 h-3.5 shrink-0" /> Phát Lệnh
                                  </button>
                                )}
                                {mo.status === 'RELEASED' && (
                                  <button
                                    onClick={() => handleIssueMaterials(mo)}
                                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                                  >
                                    <Layers className="w-3.5 h-3.5 shrink-0" /> Xuất Vật Tư
                                  </button>
                                )}
                                {(mo.status === 'IN_PROGRESS' || mo.status === 'RELEASED') && (
                                  <button
                                    onClick={() => handleOpenReportModal(mo)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 shrink-0" /> Báo Cáo
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
            </div>
          </div>
        )}

        {/* TAB 2: BOM EXPLORER */}
        {activeTab === 'boms' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {boms.map((b) => (
              <div key={b.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {b.code} ({b.version})
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700">
                    {b.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{b.name}</h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">Định mức cho: 1 {b.uom} {b.productName}</p>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Linh Kiện & Định Mức Chi Tiết
                  </span>
                  <div className="space-y-1.5">
                    {b.items?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">{item.materialName}</span>
                          <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400">{item.materialSku}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold font-mono text-slate-900 dark:text-white block">
                            {Number(item.quantity).toLocaleString('vi-VN')} {item.uom}
                          </span>
                          <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-medium font-mono">Hao hụt {item.scrapRate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {b.routings && b.routings.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Công Đoạn Định Tuyến (Routing Steps)
                    </span>
                    <div className="space-y-1 text-xs">
                      {b.routings.map((r: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-700 last:border-0">
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {r.sequence}. {r.operationName}
                          </span>
                          <span className="font-mono font-bold text-slate-600 dark:text-slate-400">{Number(r.plannedTimeMinutes).toLocaleString('vi-VN')} phút</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: PRODUCTION COSTING */}
        {activeTab === 'costs' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chi Phí NVL Trực Tiếp (621)</span>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">480.000.000 ₫</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Chiếm 86.5% tổng giá thành sản xuất phân bổ</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chi Phí Nhân Công Trực Tiếp (622)</span>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">35.000.000 ₫</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Phân bổ theo giờ công chuyền SMT & Lắp ráp</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chi Phí SX Chung & Khấu Hao (627)</span>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">40.000.000 ₫</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Khấu hao máy dán chip Yamaha & chi phí điện xưởng</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mã Lệnh MO</th>
                      <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sản Phẩm</th>
                      <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">NVL Trực Tiếp (621)</th>
                      <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Nhân Công (622)</th>
                      <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">SX Chung (627)</th>
                      <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Tổng Chi Phí (154)</th>
                      <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Giá Thành Đơn Vị (155)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    <tr className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150">
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">MO-2026-0010</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">Laptop Dell XPS 15</td>
                      <td className="p-3 font-mono tabular-nums text-right font-bold text-slate-900 dark:text-white">480.000.000 ₫</td>
                      <td className="p-3 font-mono tabular-nums text-right font-bold text-slate-900 dark:text-white">35.000.000 ₫</td>
                      <td className="p-3 font-mono tabular-nums text-right font-bold text-slate-900 dark:text-white">40.000.000 ₫</td>
                      <td className="p-3 font-mono tabular-nums text-right font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/10">555.000.000 ₫</td>
                      <td className="p-3 font-mono tabular-nums text-right font-bold text-emerald-600 dark:text-emerald-400">27.750.000 ₫/SP</td>
                    </tr>
                    <tr className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150">
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">MO-2026-0012</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">Laptop Dell XPS 15</td>
                      <td className="p-3 font-mono tabular-nums text-right font-bold text-slate-900 dark:text-white">240.000.000 ₫</td>
                      <td className="p-3 font-mono tabular-nums text-right font-bold text-slate-900 dark:text-white">18.000.000 ₫</td>
                      <td className="p-3 font-mono tabular-nums text-right font-bold text-slate-900 dark:text-white">20.000.000 ₫</td>
                      <td className="p-3 font-mono tabular-nums text-right font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/10">278.000.000 ₫</td>
                      <td className="p-3 font-mono tabular-nums text-right font-bold text-emerald-600 dark:text-emerald-400">27.800.000 ₫/SP</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: CREATE MO */}
      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Factory className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Khởi Tạo Lệnh Sản Xuất (MO)
              </h3>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMo} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Sản phẩm cần sản xuất *</label>
                <select
                  value={formProductId}
                  onChange={(e) => setFormProductId(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 dark:text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Định mức kỹ thuật BOM *</label>
                  <select
                    value={formBomId}
                    onChange={(e) => setFormBomId(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 dark:text-white"
                  >
                    {boms.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} ({b.version})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Số lượng kế hoạch *</label>
                  <input
                    type="number"
                    min="1"
                    value={formPlannedQty}
                    onChange={(e) => setFormPlannedQty(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900 dark:text-white text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phân xưởng thực hiện *</label>
                  <select
                    value={formWorkCenterId}
                    onChange={(e) => setFormWorkCenterId(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value={1}>WC-SMT-01 (Xưởng SMT)</option>
                    <option value={2}>WC-ASSY-02 (Dây chuyền Lắp ráp)</option>
                    <option value={3}>WC-QC-03 (Phòng Kiểm chuẩn QC)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mức độ ưu tiên</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="NORMAL">Bình thường (NORMAL)</option>
                    <option value="HIGH">Ưu tiên cao (HIGH)</option>
                    <option value="URGENT">Khẩn cấp (URGENT)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ghi chú lệnh sản xuất</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting ? 'Đang khởi tạo...' : 'Xác Nhận Tạo Lệnh MO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REPORT PRODUCTION OUTPUT */}
      {isReportModalOpen && reportingMo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Báo Cáo Sản Lượng Hoàn Thành
                </h3>
                <p className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-1">Lệnh MO: {reportingMo.code}</p>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Số lượng đạt chuẩn *</label>
                  <input
                    type="number"
                    min="1"
                    value={reportGoodQty}
                    onChange={(e) => setReportGoodQty(Number(e.target.value))}
                    className="w-full p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm text-right"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phế phẩm (Scrap)</label>
                  <input
                    type="number"
                    min="0"
                    value={reportScrapQty}
                    onChange={(e) => setReportScrapQty(Number(e.target.value))}
                    className="w-full p-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono font-bold text-rose-600 dark:text-rose-400 text-sm text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mã Lô Thành Phẩm (Batch / Lot #) *</label>
                <input
                  type="text"
                  value={reportBatchNo}
                  onChange={(e) => setReportBatchNo(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-300 space-y-1.5">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Tự động hạch toán kế toán & tồn kho
                </span>
                <p>Thành phẩm đạt chuẩn sẽ tự động nhập kho chính và ghi nợ TK 155 / ghi có TK 154.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Xác Nhận Nhập Kho Thành Phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WORK ORDER INSPECTION MODAL (DETAILS & HISTORY LINKED WITH API) */}
      {inspectingMoId && (
        <WorkOrderInspectionModal
          orderIdOrCode={inspectingMoId}
          onClose={() => setInspectingMoId(null)}
          onNotify={onNotify}
          onSelectEntity={onSelectEntity}
          onOrderUpdated={() => fetchData()}
        />
      )}

      {/* CONFIRM DIALOG (Rule #19 Compliance) */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
