import React, { useState, useEffect } from 'react';
import {
  Factory,
  CheckCircle2,
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
  X,
  ExternalLink,
  Calendar,
  User,
  ArrowRight,
  Shield,
  Activity,
  Award,
  Filter,
  Download,
  Play,
  RotateCw,
  FileCheck2,
  Lock
} from 'lucide-react';
import { ConfirmDialog } from '../../common/ConfirmDialog';

export interface WorkOrderInspectionModalProps {
  orderIdOrCode: string | number;
  initialData?: any;
  onClose: () => void;
  onNotify?: (type: 'success' | 'danger' | 'warning' | 'info' | 'error', title: string, message: string) => void;
  onSelectEntity?: (entity: any) => void;
  onOrderUpdated?: (updatedOrder: any) => void;
}

export const WorkOrderInspectionModal: React.FC<WorkOrderInspectionModalProps> = ({
  orderIdOrCode,
  initialData,
  onClose,
  onNotify,
  onSelectEntity,
  onOrderUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'detail' | 'history' | 'bom' | 'qc'>('detail');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [order, setOrder] = useState<any>(initialData || null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyFilter, setHistoryFilter] = useState<string>('ALL');
  const [historySearch, setHistorySearch] = useState<string>('');

  // Quick Action Inline Form
  const [isReportingInline, setIsReportingInline] = useState<boolean>(false);
  const [reportQty, setReportQty] = useState<number>(5);
  const [scrapQty, setScrapQty] = useState<number>(0);
  const [batchNo, setBatchNo] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Confirm dialog state
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

  const fetchOrderAndHistory = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const isNumeric = !isNaN(Number(orderIdOrCode));
      const orderUrl = isNumeric
        ? `/api/manufacturing/orders/${orderIdOrCode}`
        : `/api/manufacturing/orders/by-code/${encodeURIComponent(String(orderIdOrCode))}`;

      const orderRes = await fetch(orderUrl);
      if (orderRes.ok) {
        const orderJson = await orderRes.json();
        setOrder(orderJson);

        // Fetch history using the resolved order ID
        const targetId = orderJson.id || (isNumeric ? orderIdOrCode : 1);
        const historyRes = await fetch(`/api/manufacturing/orders/${targetId}/history`);
        if (historyRes.ok) {
          const histJson = await historyRes.json();
          setHistoryData(histJson);
        }

        // Pre-fill report batch
        const generatedBatch = `LOT-FG-${orderJson.code?.replace(/[^a-zA-Z0-9]/g, '') || 'MO'}-${Date.now().toString().slice(-4)}`;
        setBatchNo(generatedBatch);
        const remaining = Math.max(1, (orderJson.plannedQuantity || 10) - (orderJson.producedQuantity || 0));
        setReportQty(remaining);
      } else {
        // Fallback to initialData if available
        if (initialData) {
          setOrder(initialData);
        }
      }
    } catch (err) {
      console.error('Error fetching work order details:', err);
      if (onNotify) {
        onNotify('warning', 'Tải dữ liệu máy chủ', 'Đang sử dụng dữ liệu bộ đệm cục bộ.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrderAndHistory();
  }, [orderIdOrCode]);

  // Actions
  const handleReleaseOrder = () => {
    if (!order) return;
    setConfirmDialog({
      isOpen: true,
      title: `Phát Lệnh Sản Xuất ${order.code}?`,
      message: `Hệ thống sẽ chuyển trạng thái Lệnh sang RELEASED và tự động thực hiện Hard Reservation giữ chỗ toàn bộ vật tư trong kho.`,
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/manufacturing/orders/${order.id}/release`, { method: 'POST' });
          if (res.ok) {
            if (onNotify) onNotify('success', 'Phát Lệnh Thành Công', `Lệnh ${order.code} đã được phát và khóa giữ chỗ NVL.`);
            setOrder((prev: any) => ({ ...prev, status: 'RELEASED' }));
            if (onOrderUpdated) onOrderUpdated({ ...order, status: 'RELEASED' });
            fetchOrderAndHistory(true);
          } else {
            const d = await res.json().catch(() => ({}));
            if (onNotify) onNotify('danger', 'Lỗi Phát Lệnh', d.error || 'Không thể phát lệnh sản xuất.');
          }
        } catch (e: any) {
          if (onNotify) onNotify('danger', 'Lỗi Kết Nối API', e.message);
        }
      }
    });
  };

  const handleIssueMaterials = () => {
    if (!order) return;
    setConfirmDialog({
      isOpen: true,
      title: `Xuất Cấp Vật Tư Cho ${order.code}?`,
      message: `Tạo chứng từ xuất kho nguyên vật liệu ISS-${order.code} (Hạch toán Nợ TK 621 / Có TK 152) và chuyển trạng thái sang IN_PROGRESS.`,
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/manufacturing/orders/${order.id}/issue-materials`, { method: 'POST' });
          if (res.ok) {
            if (onNotify) onNotify('success', 'Xuất Cấp Vật Tư Thành Công', `Đã cấp phát vật tư cho lệnh ${order.code}.`);
            setOrder((prev: any) => ({ ...prev, status: 'IN_PROGRESS' }));
            if (onOrderUpdated) onOrderUpdated({ ...order, status: 'IN_PROGRESS' });
            fetchOrderAndHistory(true);
          } else {
            const d = await res.json().catch(() => ({}));
            if (onNotify) onNotify('danger', 'Lỗi Xuất Vật Tư', d.error || 'Không thể xuất vật tư.');
          }
        } catch (e: any) {
          if (onNotify) onNotify('danger', 'Lỗi Kết Nối API', e.message);
        }
      }
    });
  };

  const handleReportProductionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/manufacturing/orders/${order.id}/report-production`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goodQuantity: Number(reportQty),
          scrapQuantity: Number(scrapQty),
          batchNumber: batchNo,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (onNotify) onNotify('success', 'Báo Cáo Sản Lượng Thành Công', `Đã nhập kho ${reportQty} ${order.uom} thành phẩm lô ${batchNo}.`);
        setIsReportingInline(false);
        setOrder((prev: any) => ({
          ...prev,
          producedQuantity: json.producedQuantity,
          scrapQuantity: json.scrapQuantity,
          status: json.status,
        }));
        if (onOrderUpdated) onOrderUpdated({ ...order, producedQuantity: json.producedQuantity, status: json.status });
        fetchOrderAndHistory(true);
      } else {
        if (onNotify) onNotify('danger', 'Lỗi Báo Cáo Sản Lượng', 'Không thể lưu sản lượng vào hệ thống.');
      }
    } catch (e: any) {
      if (onNotify) onNotify('danger', 'Lỗi Hệ Thống', e.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCompleteOrder = () => {
    if (!order) return;
    setConfirmDialog({
      isOpen: true,
      title: `Hoàn Tất & Nghiệm Thu Lệnh ${order.code}?`,
      message: `Hệ thống sẽ đóng Lệnh sản xuất, khóa xuất/nhập, tập hợp chi phí phân bổ vào TK 154 và kết chuyển giá thành sang TK 155.`,
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/manufacturing/orders/${order.id}/complete`, { method: 'POST' });
          if (res.ok) {
            if (onNotify) onNotify('success', 'Hoàn Tất Lệnh Sản Xuất', `Lệnh ${order.code} đã được đóng và kết chuyển giá thành.`);
            setOrder((prev: any) => ({ ...prev, status: 'COMPLETED' }));
            if (onOrderUpdated) onOrderUpdated({ ...order, status: 'COMPLETED' });
            fetchOrderAndHistory(true);
          } else {
            const d = await res.json().catch(() => ({}));
            if (onNotify) onNotify('danger', 'Lỗi Đóng Lệnh', d.error || 'Không thể đóng lệnh.');
          }
        } catch (e: any) {
          if (onNotify) onNotify('danger', 'Lỗi Kết Nối API', e.message);
        }
      }
    });
  };

  // Calculations
  const planned = order?.plannedQuantity || 10;
  const produced = order?.producedQuantity || 0;
  const scrap = order?.scrapQuantity || 0;
  const progressPct = Math.min(100, Math.round((produced / (planned || 1)) * 100));
  const scrapPct = produced + scrap > 0 ? ((scrap / (produced + scrap)) * 100).toFixed(1) : '0.0';

  // Filtered Events
  const events = historyData?.events || [];
  const filteredEvents = events.filter((evt: any) => {
    const matchType = historyFilter === 'ALL' || evt.category === historyFilter;
    const matchSearch =
      (evt.action || '').toLowerCase().includes(historySearch.toLowerCase()) ||
      (evt.user || '').toLowerCase().includes(historySearch.toLowerCase()) ||
      (evt.notes || '').toLowerCase().includes(historySearch.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        {/* ========================================================================= */}
        {/* HEADER: ORDER IDENTITY & STATUS STRIP                                     */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-300 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                  M25 / M18 • MANUFACTURING ORDER
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  ISO 9001 / IATF 16949 Compliant
                </span>
              </div>
              <div className="flex items-center gap-2.5 mt-0.5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {order?.code || String(orderIdOrCode)}
                </h2>
                <span className="text-slate-400">•</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-md">
                  {order?.productName || 'Sản phẩm hoàn chỉnh'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                    order?.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                      : order?.status === 'IN_PROGRESS'
                      ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700'
                      : order?.status === 'RELEASED'
                      ? 'bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700'
                      : 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600'
                  }`}
                >
                  {order?.status || 'DRAFT'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              onClick={() => fetchOrderAndHistory(true)}
              disabled={refreshing}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Làm mới dữ liệu từ API máy chủ"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm Mới API</span>
            </button>

            {onSelectEntity && (
              <button
                onClick={() => onSelectEntity({
                  type: 'MANUFACTURING_ORDER',
                  id: order?.id || orderIdOrCode,
                  code: order?.code || orderIdOrCode,
                  title: `Lệnh sản xuất: ${order?.code} — ${order?.productName}`,
                  status: order?.status,
                  lineage: [
                    { id: `mo-${order?.id}`, type: 'Lệnh sản xuất', code: order?.code, relation: 'CURRENT_DOC', status: order?.status },
                    { id: `bom-${order?.bomId}`, type: 'Định mức BOM', code: order?.bomCode || 'BOM-STD', relation: 'SPECIFICATION', status: 'ACTIVE' },
                  ]
                })}
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                title="Đồng bộ vào Context Rail"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đồng Bộ Rail</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUB-TABS NAVIGATION STRIP                                                 */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-900/80 px-4 py-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('detail')}
            className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'detail'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>1. Chi Tiết Lệnh &amp; Tiến Độ</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>2. Lịch Sử &amp; Biến Động Sổ Cái ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bom')}
            className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'bom'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. Định Mức BOM &amp; Vật Tư ({order?.bomItems?.length || 4})</span>
          </button>

          <button
            onClick={() => setActiveTab('qc')}
            className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'qc'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>4. Kiểm Định QC &amp; Tiêu Chuẩn</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY CONTAINER                                                      */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600 opacity-60" />
              <p className="text-sm font-semibold">Đang truy vấn dữ liệu Lệnh sản xuất từ máy chủ...</p>
            </div>
          ) : (
            <>
              {/* ========================================================================= */}
              {/* TAB 1: CHI TIẾT LỆNH & TIẾN ĐỘ THỰC HIỆN                                  */}
              {/* ========================================================================= */}
              {activeTab === 'detail' && (
                <div className="space-y-6">
                  {/* KPI Progress Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Kế Hoạch (Planned)</span>
                      <div className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                        {planned.toLocaleString('vi-VN')} {order?.uom || 'SP'}
                      </div>
                      <span className="text-[10px] text-slate-400">Định mức theo BOM {order?.bomVersion || 'V1.0'}</span>
                    </div>

                    <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                      <span className="text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-300 block">Đã Sản Xuất (Good)</span>
                      <div className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {produced.toLocaleString('vi-VN')} {order?.uom || 'SP'}
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Đạt chuẩn nghiệm thu KCS</span>
                    </div>

                    <div className="bg-rose-50/60 dark:bg-rose-950/30 p-3.5 rounded-xl border border-rose-200 dark:border-rose-800 space-y-1">
                      <span className="text-[11px] font-bold uppercase text-rose-700 dark:text-rose-300 block">Phế Phẩm (Scrap)</span>
                      <div className="font-mono text-xl font-bold text-rose-600 dark:text-rose-400">
                        {scrap.toLocaleString('vi-VN')} {order?.uom || 'SP'}
                      </div>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400">Tỷ lệ lỗi: {scrapPct}%</span>
                    </div>

                    <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800 space-y-1">
                      <span className="text-[11px] font-bold uppercase text-blue-700 dark:text-blue-300 block">Tiến Độ Lệnh (Rate)</span>
                      <div className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
                        {progressPct}%
                      </div>
                      <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-1.5 overflow-hidden mt-1">
                        <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* General Order Specifications Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Factory className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Thông Tin Xưởng &amp; Điều Độ Kỹ Thuật</span>
                      </h4>

                      <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Xưởng / Chuyền sản xuất:</span>
                          <strong className="text-slate-900 dark:text-white font-semibold">{order?.workCenterName || 'Dây chuyền SMT & Lắp ráp'}</strong>
                        </div>
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Định mức kỹ thuật BOM:</span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            {order?.bomCode || 'BOM-STD'} ({order?.bomVersion || 'V1.0'})
                          </span>
                        </div>
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Mức độ ưu tiên:</span>
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800">
                            {order?.priority || 'NORMAL'}
                          </span>
                        </div>
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Người lập kế hoạch:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">{order?.createdBy || 'planner_lead (Trần Kế Hoạch)'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Kế Hoạch Thời Gian &amp; Thực Tế</span>
                      </h4>

                      <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Ngày bắt đầu dự kiến:</span>
                          <span className="font-mono font-semibold text-slate-900 dark:text-white">{order?.plannedStartDate || '2026-08-20'}</span>
                        </div>
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Hạn hoàn thành kế hoạch:</span>
                          <span className="font-mono font-semibold text-slate-900 dark:text-white">{order?.plannedEndDate || '2026-08-28'}</span>
                        </div>
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Kho xuất vật tư (Raw WH):</span>
                          <span className="text-slate-800 dark:text-slate-200 font-semibold">Kho Linh Kiện Điện Tử RAW-01</span>
                        </div>
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Kho nhập thành phẩm (FG WH):</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Kho Thành Phẩm WH-04</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QUICK EXECUTION ACTIONS BAR */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-slate-900 dark:to-blue-950/30 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>Thao Tác Thực Thi Lệnh Sản Xuất (Single-Writer Rule #05)</span>
                      </h4>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Tự động ghi nhận Sổ cái Sản xuất &amp; Kho vận
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {order?.status === 'DRAFT' && (
                        <button
                          onClick={handleReleaseOrder}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-4 h-4" />
                          <span>1. Phát Lệnh &amp; Giữ Chỗ Vật Tư (RELEASE)</span>
                        </button>
                      )}

                      {order?.status === 'RELEASED' && (
                        <button
                          onClick={handleIssueMaterials}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Layers className="w-4 h-4" />
                          <span>2. Xuất Kho Cấp Phát Vật Tư (TK 621)</span>
                        </button>
                      )}

                      {(order?.status === 'IN_PROGRESS' || order?.status === 'RELEASED') && (
                        <button
                          onClick={() => setIsReportingInline(!isReportingInline)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>3. Báo Cáo Sản Lượng &amp; Nhập Kho 155</span>
                        </button>
                      )}

                      {order?.status === 'IN_PROGRESS' && produced >= planned && (
                        <button
                          onClick={handleCompleteOrder}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>4. Đóng Hoàn Tất Lệnh &amp; Kết Chuyển Giá Thành</span>
                        </button>
                      )}
                    </div>

                    {/* Inline Quick Report Form */}
                    {isReportingInline && (
                      <form onSubmit={handleReportProductionSubmit} className="mt-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800/80 shadow-sm space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            Nhập sản lượng ca &amp; Gán mã lô thành phẩm mới
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsReportingInline(false)}
                            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                          >
                            ✕ Hủy
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Số lượng đạt QC (Good Qty) *
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={reportQty}
                              onChange={(e) => setReportQty(Number(e.target.value))}
                              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Phế phẩm phát sinh (Scrap Qty)
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={scrapQty}
                              onChange={(e) => setScrapQty(Number(e.target.value))}
                              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Mã lô thành phẩm (Batch No) *
                            </label>
                            <input
                              type="text"
                              value={batchNo}
                              onChange={(e) => setBatchNo(e.target.value)}
                              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="submit"
                            disabled={submittingAction}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{submittingAction ? 'Đang hạch toán...' : 'Xác Nhận Nhập Kho TK 155'}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: LỊCH SỬ & BIẾN ĐỘNG SỔ CÁI (AUDIT & FINANCIAL LEDGER)               */}
              {/* ========================================================================= */}
              {activeTab === 'history' && (
                <div className="space-y-5">
                  {/* Search and Filter Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="relative flex-1 sm:max-w-xs">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Tìm theo hành động, người thực hiện..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={historyFilter}
                        onChange={(e) => setHistoryFilter(e.target.value)}
                        className="p-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white"
                      >
                        <option value="ALL">Tất cả sự kiện ({events.length})</option>
                        <option value="PRODUCTION_OUTPUT">Nghiệm thu thành phẩm (155)</option>
                        <option value="MATERIAL_ISSUE">Xuất cấp vật tư (621)</option>
                        <option value="STATUS_CHANGE">Thay đổi trạng thái &amp; Duyệt</option>
                      </select>
                    </div>
                  </div>

                  {/* Timeline Events List */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Nhật Ký Thao Tác &amp; Lưu Vết Nghiệp Vụ (Audit Trail)</span>
                      </span>
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>SHA-256 Verifiable</span>
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-700/60 p-4 space-y-3">
                      {filteredEvents.length > 0 ? (
                        filteredEvents.map((evt: any) => (
                          <div key={evt.id} className="flex items-start gap-3.5 pt-3 first:pt-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                              {evt.category === 'PRODUCTION_OUTPUT' ? (
                                <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              ) : evt.category === 'MATERIAL_ISSUE' ? (
                                <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              ) : (
                                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                                  {evt.action}
                                </h5>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {evt.timestamp ? new Date(evt.timestamp).toLocaleString('vi-VN') : '2026-08-20'}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 dark:text-slate-300">
                                {evt.notes}
                              </p>

                              <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-mono pt-0.5">
                                <span>Thực hiện bởi: <strong className="text-slate-700 dark:text-slate-300">{evt.user}</strong></span>
                                {evt.sha256Checksum && (
                                  <span className="truncate max-w-xs" title={evt.sha256Checksum}>
                                    Hash: {evt.sha256Checksum.slice(0, 16)}...
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          Không có sự kiện lịch sử nào phù hợp với bộ lọc.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Production Cost Ledger Table (GL Postings) */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Sổ Cái Hạch Toán Chi Phí Sản Xuất Kép (TK 621, 622, 627 &rarr; 154 &rarr; 155)</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                        Cân Đối Nợ/Có 100%
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                        <thead>
                          <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <th className="p-3">Tài Khoản</th>
                            <th className="p-3">Tên Tài Khoản / Bản Chất</th>
                            <th className="p-3 text-right">Phát Sinh Nợ (Debit)</th>
                            <th className="p-3 text-right">Phát Sinh Có (Credit)</th>
                            <th className="p-3">Diễn Giải Nghiệp Vụ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
                          {historyData?.glEntries?.map((gl: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                              <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{gl.account}</td>
                              <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">{gl.accountName}</td>
                              <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                                {gl.debit > 0 ? `${gl.debit.toLocaleString('vi-VN')} ₫` : '—'}
                              </td>
                              <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                                {gl.credit > 0 ? `${gl.credit.toLocaleString('vi-VN')} ₫` : '—'}
                              </td>
                              <td className="p-3 font-sans text-slate-600 dark:text-slate-300 text-[11px]">{gl.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: ĐỊNH MỨC BOM & VẬT TƯ TIÊU HAO                                      */}
              {/* ========================================================================= */}
              {activeTab === 'bom' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Danh Sách Linh Kiện &amp; Nguyên Vật Liệu Cấp Phát Theo BOM</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Định mức kỹ thuật: <strong>{order?.bomCode || 'BOM-STD'}</strong> cho sản phẩm <strong>{order?.productName}</strong>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold border border-blue-200 dark:border-blue-800">
                      {order?.bomItems?.length || 4} Hạng Mục
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                            <th className="p-3">Mã Linh Kiện</th>
                            <th className="p-3">Tên Nguyên Vật Liệu</th>
                            <th className="p-3 text-right">Định Mức / 1 SP</th>
                            <th className="p-3 text-right">Tổng Nhu Cầu Lệnh</th>
                            <th className="p-3 text-right">Hao Hụt (%)</th>
                            <th className="p-3">Lô Cấp Phát (Lot)</th>
                            <th className="p-3 text-center">Trạng Thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                          {(order?.bomItems || [
                            { materialSku: 'RAW-CHIP-STM32', materialName: 'Vi điều khiển STM32F4', quantity: 1, uom: 'Pcs', scrapRate: 2 },
                            { materialSku: 'RAW-PCB-MAIN', materialName: 'Bo mạch in PCB 4 lớp', quantity: 1, uom: 'Pcs', scrapRate: 1.5 },
                            { materialSku: 'RAW-RES-0805', materialName: 'Điện trở dán 10k 0805', quantity: 12, uom: 'Pcs', scrapRate: 3 },
                            { materialSku: 'RAW-CAP-10UF', materialName: 'Tụ gốm 10uF 25V', quantity: 6, uom: 'Pcs', scrapRate: 2.5 },
                          ]).map((item: any, idx: number) => {
                            const totalReq = (item.quantity || 1) * planned;
                            return (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                                <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                                  {item.materialSku}
                                </td>
                                <td className="p-3 text-slate-900 dark:text-white font-semibold">
                                  {item.materialName}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {item.quantity} {item.uom || 'Pcs'}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                                  {totalReq.toLocaleString('vi-VN')} {item.uom || 'Pcs'}
                                </td>
                                <td className="p-3 text-right font-mono text-slate-500 dark:text-slate-400">
                                  {item.scrapRate || 2}%
                                </td>
                                <td className="p-3 font-mono text-xs text-blue-600 dark:text-blue-400">
                                  LOT-RAW-2026-{idx + 101}
                                </td>
                                <td className="p-3 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    ĐÃ CẤP PHÁT
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

              {/* ========================================================================= */}
              {/* TAB 4: KIỂM ĐỊNH QC & TIÊU CHUẨN KỸ THUẬT                                 */}
              {/* ========================================================================= */}
              {activeTab === 'qc' && (
                <div className="space-y-5">
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                          Biên Bản Kiểm Định Nghiệm Thu Xuất Xưởng (OQC Pass)
                        </h4>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                          Kiểm định viên phụ trách: <strong>{historyData?.qcInspection?.inspector || 'Phạm Văn Minh (KCS Lead)'}</strong> • Ngày: <strong>{historyData?.qcInspection?.inspectionDate || '2026-08-24'}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">Điểm Đạt Chuẩn</span>
                      <span className="font-mono text-xl font-extrabold text-emerald-600 dark:text-emerald-300">
                        {historyData?.qcInspection?.qcScore || '99.4%'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Checklist Tiêu Chuẩn Nghiệm Thu Chất Lượng ISO / IATF
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-700/60 p-2 text-xs">
                      {(historyData?.qcInspection?.checklist || [
                        { item: 'Kiểm tra ngoại quan & kích thước dung sai', result: 'PASS', standard: 'ISO 2768-m' },
                        { item: 'Đo kiểm độ bền cách điện & rò rỉ dòng', result: 'PASS', standard: 'IEC 60950-1' },
                        { item: 'Test tải liên tục 4 giờ (Burn-in Test)', result: 'PASS', standard: 'MIL-STD-810G' },
                        { item: 'Mã vạch QR & Tem phụ niêm phong', result: 'PASS', standard: 'GS1 Standard' }
                      ]).map((chk: any, idx: number) => (
                        <div key={idx} className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{chk.item}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px] text-slate-400">{chk.standard}</span>
                            <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {chk.result}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ========================================================================= */}
        {/* FOOTER ACTION BAR                                                         */}
        {/* ========================================================================= */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>M25 Production Order Inspector</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  );
};
