import React, { useState, useEffect } from 'react';
import { 
  Search, Clock, FileText, ArrowRight, Share2, Network, 
  Table, Layers, Factory, CheckCircle2, Package, ShoppingCart, 
  ExternalLink, Download, Filter, Sparkles, RefreshCw, AlertTriangle,
  ShieldAlert, Building2, Truck, CheckSquare, Square, FileSpreadsheet,
  Phone, MapPin, User, ChevronRight, Info
} from 'lucide-react';
import { LotItem } from './LotInventoryHistoryDrilldown';
import { LotDependencyGraphD3, generateTraceDataForLot } from './LotDependencyGraphD3';
import { WorkOrderInspectionModal } from '../../../manufacturing/m25-mes/components/WorkOrderInspectionModal';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';

interface LotsBatchesTraceabilityTabProps {
  lots: LotItem[];
  onSelectEntity?: (entity: any) => void;
  activeLotId?: string;
  onLotChange?: (lotId: string) => void;
  onViewDrilldown?: (lot: any) => void;
  onNotify?: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  onUpdateLotStatus?: (lotId: string, newStatus: string) => void;
}

export const LotsBatchesTraceabilityTab: React.FC<LotsBatchesTraceabilityTabProps> = ({ 
  lots, 
  onSelectEntity, 
  activeLotId: externalActiveLotId, 
  onLotChange, 
  onViewDrilldown,
  onNotify,
  onUpdateLotStatus
}) => {
  const [localActiveLotId, setLocalActiveLotId] = useState<string>(externalActiveLotId || lots[0]?.id || 'LOT-2026-001');
  const activeLotId = externalActiveLotId || localActiveLotId;
  const [viewMode, setViewMode] = useState<'ALL' | 'GRAPH' | 'UPSTREAM' | 'DOWNSTREAM' | 'RECALL_HUB'>('ALL');
  
  // Data States
  const [isTraceLoading, setIsTraceLoading] = useState<boolean>(false);
  const [serverTraceData, setServerTraceData] = useState<any>(null);
  const [upstreamData, setUpstreamData] = useState<any>(null);
  const [downstreamData, setDownstreamData] = useState<any>(null);
  const [inspectingWorkOrderCodeOrId, setInspectingWorkOrderCodeOrId] = useState<string | number | null>(null);

  // Recall Hub Interactive State
  const [isRecallDialogOpen, setIsRecallDialogOpen] = useState<boolean>(false);
  const [recallSeverity, setRecallSeverity] = useState<'CRITICAL_LEVEL_1' | 'HIGH_LEVEL_2' | 'MODERATE_LEVEL_3'>('CRITICAL_LEVEL_1');
  const [recallReason, setRecallReason] = useState<string>('Phát hiện sai lệch chỉ tiêu kỹ thuật / Nghi ngờ nhiễm tạp chất theo cảnh báo KCS');
  const [isLockingRecall, setIsLockingRecall] = useState<boolean>(false);
  const [actionChecklist, setActionChecklist] = useState<Record<string, boolean>>({
    lock_inventory: false,
    notify_customers: false,
    quarantine_work_orders: false,
    lab_test_samples: false,
    regulatory_report: false
  });
  const [customerContactStatus, setCustomerContactStatus] = useState<Record<string, string>>({});

  const handleLotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLotId = e.target.value;
    setLocalActiveLotId(newLotId);
    if (onLotChange) onLotChange(newLotId);
  };
  
  const activeLot = lots.find(l => l.id === activeLotId) || lots[0];

  // Fetch Trace, Upstream & Downstream API data
  useEffect(() => {
    if (!activeLot) return;
    let isCancelled = false;

    const fetchAllTraceData = async () => {
      setIsTraceLoading(true);
      try {
        // 1. Graph Trace
        const [resGraph, resUpstream, resDownstream] = await Promise.allSettled([
          fetch(`/api/inventory/lots/${activeLot.id}/trace`),
          fetch(`/api/inventory/lots/${activeLot.id}/trace-upstream`),
          fetch(`/api/inventory/lots/${activeLot.id}/trace-downstream`)
        ]);

        if (!isCancelled) {
          if (resGraph.status === 'fulfilled' && resGraph.value.ok) {
            const jsonGraph = await resGraph.value.json();
            if (jsonGraph?.nodes) setServerTraceData(jsonGraph);
          }
          if (resUpstream.status === 'fulfilled' && resUpstream.value.ok) {
            const jsonUp = await resUpstream.value.json();
            if (jsonUp?.data) setUpstreamData(jsonUp.data);
          }
          if (resDownstream.status === 'fulfilled' && resDownstream.value.ok) {
            const jsonDown = await resDownstream.value.json();
            if (jsonDown?.data) setDownstreamData(jsonDown.data);
          }
        }
      } catch (err) {
        console.error("Traceability API fetch error:", err);
      } finally {
        if (!isCancelled) {
          setIsTraceLoading(false);
        }
      }
    };

    fetchAllTraceData();
    return () => { isCancelled = true; };
  }, [activeLot?.id]);

  if (!activeLot) {
    return <div className="p-8 text-center text-slate-500 font-mono">Không tìm thấy dữ liệu lô hàng để truy xuất.</div>;
  }

  // Derive trace data fallback
  const traceData = serverTraceData || generateTraceDataForLot(activeLot);
  const woNodes = traceData.nodes.filter((n: any) => n.type === 'WORK_ORDER');
  const fgNodes = traceData.nodes.filter((n: any) => n.type === 'FINISHED_GOOD');
  const soNodes = traceData.nodes.filter((n: any) => n.type === 'SALES_ORDER');

  // Trigger Recall Incident
  const handleExecuteRecallIncident = async () => {
    setIsLockingRecall(true);
    try {
      const res = await fetch(`/api/inventory/lots/${activeLot.id}/recall-incident`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: recallReason,
          severity: recallSeverity,
          recallScope: 'ALL_DOWNSTREAM_CUSTOMERS',
          initiatedBy: 'QA/QC Manager & Warehouse Director'
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (onUpdateLotStatus) {
          onUpdateLotStatus(activeLot.id, 'QUARANTINE');
        }
        setActionChecklist(prev => ({ ...prev, lock_inventory: true }));
        if (onNotify) {
          onNotify(`Đã kích hoạt hồ sơ sự cố thu hồi #${json.incidentId} và phong tỏa lô ${activeLot.batchNumber}`, 'warning');
        }
      } else {
        const errJson = await res.json();
        if (onNotify) onNotify(errJson.error || 'Lỗi khi kích hoạt thu hồi', 'error');
      }
    } catch (err: any) {
      if (onNotify) onNotify(`Lỗi kết nối: ${err.message}`, 'error');
    } finally {
      setIsLockingRecall(false);
      setIsRecallDialogOpen(false);
    }
  };

  // Export Recall Dossier
  const handleExportRecallDossier = async () => {
    try {
      const res = await fetch(`/api/inventory/lots/${activeLot.id}/recall-dossier`);
      if (res.ok) {
        const json = await res.json();
        const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RECALL_DOSSIER_${activeLot.batchNumber}_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (onNotify) onNotify(`Đã xuất Biên bản Hồ sơ Thu hồi cho Lô ${activeLot.batchNumber}`, 'success');
      }
    } catch (err: any) {
      if (onNotify) onNotify(`Lỗi xuất hồ sơ: ${err.message}`, 'error');
    }
  };

  const isQuarantined = activeLot.status === 'QUARANTINE' || activeLot.status === 'QUARANTINED';

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS & LOT SELECTOR */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-mono text-[11px] font-bold border border-blue-200 dark:border-blue-800">
                M22 TRACEABILITY & RECALL HUB
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                ISO 9001:2015 • IATF 16949 • GMP Standard
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <span>Truy Vết Nguồn Gốc 2 Chiều & Báo Cáo Thu Hồi Sản Phẩm</span>
              {isTraceLoading && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-3xl">
              Theo dõi chuỗi cung ứng khép kín: <strong>Truy ngược (Upstream)</strong> từ Nhà cung cấp &rarr; Phiếu nhập &rarr; Chứng chỉ KCS; và <strong>Truy xuôi (Downstream)</strong> đến Lệnh sản xuất &rarr; Lô thành phẩm &rarr; Danh sách khách hàng đã giao.
            </p>
          </div>

          {/* View Mode Segmented Controls */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start lg:self-auto shrink-0">
            <button
              onClick={() => setViewMode('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Toàn Diện</span>
            </button>
            <button
              onClick={() => setViewMode('GRAPH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'GRAPH'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Đồ Thị D3</span>
            </button>
            <button
              onClick={() => setViewMode('UPSTREAM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'UPSTREAM'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Truy Ngược (NCC)</span>
            </button>
            <button
              onClick={() => setViewMode('DOWNSTREAM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'DOWNSTREAM'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Truy Xuôi (Khách Hàng)</span>
            </button>
            <button
              onClick={() => setViewMode('RECALL_HUB')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'RECALL_HUB'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Sự Cố Thu Hồi</span>
            </button>
          </div>
        </div>

        {/* LOT SELECTOR BAR */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="w-full md:w-80 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Chọn Lô Hàng Cần Phân Tích</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">({lots.length} lô sẵn sàng)</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <select 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-white font-semibold"
                value={activeLotId}
                onChange={handleLotChange}
              >
                {lots.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.batchNumber} • {l.productName} ({l.currentQty}/{l.initialQty} {l.uom}) - {l.status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Info Card of Active Lot */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Lô đang kiểm tra:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isQuarantined 
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300' 
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                }`}>
                  {activeLot.status}
                </span>
              </div>
              <div className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">
                {activeLot.batchNumber}
              </div>
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-sm">
                {activeLot.productName} ({activeLot.sku})
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Tồn kho khả dụng:</span>
                <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                  {activeLot.currentQty.toLocaleString('vi-VN')} {activeLot.uom}
                </div>
                <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                  / Ban đầu: {activeLot.initialQty.toLocaleString('vi-VN')} {activeLot.uom}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRecallDialogOpen(true)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="Kích hoạt quy trình thu hồi khẩn cấp"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Khóa Thu Hồi</span>
                </button>

                <button
                  onClick={() => onViewDrilldown ? onViewDrilldown(activeLot) : (onSelectEntity && onSelectEntity(activeLot))}
                  className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="Mở sổ cái chi tiết cho lô hàng này"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Sổ Cái Lô</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECALL HUB & EMERGENCY ACTION BANNER (When RECALL_HUB is active or Lot is Quarantined) */}
      {(viewMode === 'RECALL_HUB' || isQuarantined) && (
        <div className="bg-rose-50/80 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-xs">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide">
                    TRUNG TÂM PHẢN ỨNG THU HỒI SỰ CỐ (PRODUCT RECALL INCIDENT HUB)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200">
                    MỨC ĐỘ RỦI RO: {recallSeverity}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  Lô Hàng <span className="font-mono text-rose-600 dark:text-rose-400">{activeLot.batchNumber}</span> Đang Trong Diện Kiểm Soát Cách Ly &amp; Thu Hồi
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Toàn bộ {activeLot.currentQty.toLocaleString('vi-VN')} {activeLot.uom} tồn kho đã bị phong tỏa xuất hàng. Đang kích hoạt thông báo thu hồi 2 chiều đối với tất cả đơn vị sản xuất và khách hàng tiêu thụ.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportRecallDossier}
                className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Xuất Biên Bản Thu Hồi (Dossier)</span>
              </button>
            </div>
          </div>

          {/* Action Checklist */}
          <div className="bg-white dark:bg-slate-900/80 rounded-xl p-4 border border-rose-200 dark:border-rose-900/60">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Checklist Hành Động Khắc Phục Theo Chuẩn ISO 9001 / IATF 16949</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { key: 'lock_inventory', label: '1. Niêm phong kho vật lý & Khóa hệ thống WMS' },
                { key: 'notify_customers', label: '2. Phát công văn khẩn tới các khách hàng đã nhận hàng' },
                { key: 'quarantine_work_orders', label: '3. Tạm dừng các Lệnh SX (WO) đang sử dụng lô này' },
                { key: 'lab_test_samples', label: '4. Thu hồi mẫu lưu kho và gửi phòng Lab giám định' },
                { key: 'regulatory_report', label: '5. Hoàn tất báo cáo Ban Giám Đốc và Tổ chức KCS' }
              ].map(item => (
                <label 
                  key={item.key} 
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-blue-50/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={!!actionChecklist[item.key]}
                    onChange={(e) => setActionChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-500"
                  />
                  <span className={`text-xs font-medium ${actionChecklist[item.key] ? 'text-emerald-700 dark:text-emerald-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* D3 INTERACTIVE DEPENDENCY GRAPH COMPONENT */}
      {(viewMode === 'ALL' || viewMode === 'GRAPH') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Đồ Thị Tương Tác D3: Luồng Tiêu Thụ Của Các Lệnh Sản Xuất &amp; Đơn Bán Hàng</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Kéo thả (Drag), Thu phóng (Zoom) &amp; Nhấp vào nút để xem thông số
            </span>
          </div>

          <LotDependencyGraphD3 
            lot={activeLot} 
            onSelectEntity={onSelectEntity} 
            onInspectWorkOrder={(woCodeOrId) => setInspectingWorkOrderCodeOrId(woCodeOrId)}
          />
        </div>
      )}

      {/* UPSTREAM TRACEABILITY INSPECTION PANEL */}
      {(viewMode === 'ALL' || viewMode === 'UPSTREAM') && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Truy Ngược Nguồn Gốc (Upstream Traceability) — Nhà Cung Cấp &amp; Nghiệm Thu KCS</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dữ liệu chuỗi cung ứng đầu vào, số đơn mua (PO), phiếu nhập kho (GRN) và chứng chỉ chất lượng CO/CQ.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold rounded-lg border border-indigo-200 dark:border-indigo-800">
              Mã Lô NCC: {upstreamData?.supplier?.supplierLotNumber || activeLot.supplierLot}
            </span>
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Supplier & Procurement Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. Thông Tin Nhà Cung Cấp</span>
              </h4>
              <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500">Tên Nhà Cung Cấp:</span>
                  <strong className="text-slate-900 dark:text-white">{upstreamData?.supplier?.name || activeLot.supplierName || 'Công ty TNHH Linh Kiện Cơ Điện Việt Nam'}</strong>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500">Mã NCC:</span>
                  <strong className="font-mono text-slate-900 dark:text-white">{upstreamData?.supplier?.code || 'SUP-VN-001'}</strong>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500">Lô Gốc Nhà Cung Cấp:</span>
                  <strong className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{upstreamData?.supplier?.supplierLotNumber || activeLot.supplierLot}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Xuất Xứ Hàng Hóa:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{upstreamData?.supplier?.countryOfOrigin || 'Việt Nam'}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500">Đơn Mua Hàng (PO):</span>
                  <strong className="font-mono text-blue-600 dark:text-blue-400 font-bold">{upstreamData?.procurement?.poNumber || 'PO-2026-0042'}</strong>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500">Phiếu Nhập Kho (GRN):</span>
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{upstreamData?.procurement?.grnNumber || 'GRN-2026-0088'}</strong>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500">Ngày Nhập Kho:</span>
                  <span className="font-mono text-slate-900 dark:text-white">{upstreamData?.procurement?.grnDate || activeLot.mfgDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SL Nghiệm Thu:</span>
                  <strong className="font-mono text-slate-900 dark:text-white">{activeLot.initialQty.toLocaleString('vi-VN')} {activeLot.uom}</strong>
                </div>
              </div>
            </div>

            {/* Inbound QA/QC Quality Inspection Parameters */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Hồ Sơ Nghiệm Thu KCS Đầu Vào (Inbound QC Certificate)</span>
                </h4>
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  Chứng chỉ: {upstreamData?.qualityAssurance?.coCqCertificate || 'CO-CQ-001/TCHQ'}
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold font-mono">
                      <th className="py-2.5 px-3">Chỉ Tiêu Kiểm Tra</th>
                      <th className="py-2.5 px-3">Tiêu Chuẩn Định Mức</th>
                      <th className="py-2.5 px-3">Kết Quả Đo Thực Tế</th>
                      <th className="py-2.5 px-3 text-center">Đánh Giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {(upstreamData?.qualityAssurance?.testParameters || [
                      { param: 'Độ ẩm & Nhiệt độ bảo quản', standard: '18-25°C, < 60% RH', measured: '21.5°C, 54% RH', result: 'PASS' },
                      { param: 'Quy cách & Ngoại quan seal', standard: 'Nguyên seal, không trầy xước', measured: 'Đạt chuẩn 100%', result: 'PASS' },
                      { param: 'Kích thước / Dung sai dung dịch', standard: '±0.02 mm', measured: '+0.008 mm', result: 'PASS' },
                      { param: 'Kiểm tra chức năng điện / cơ', standard: '100% test điện áp 380V', measured: 'Đáp ứng tiêu chuẩn', result: 'PASS' }
                    ]).map((param: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{param.param}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">{param.standard}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{param.measured}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                            {param.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOWNSTREAM TRACEABILITY & SHIPPED CUSTOMERS (RECALL TARGETS) */}
      {(viewMode === 'ALL' || viewMode === 'DOWNSTREAM' || viewMode === 'RECALL_HUB') && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Truy Xuôi Phân Phối (Downstream Traceability) — Danh Sách Khách Hàng Đã Giao Hàng</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Danh sách các đối tác B2B / Đơn hàng bán (SO) đã nhận sản phẩm cấu thành từ lô {activeLot.batchNumber}.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">
              {(downstreamData?.shippedCustomers || []).length} Khách Hàng Tiêu Thụ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider font-mono">
                  <th className="py-3 px-4">Số Đơn Hàng (SO)</th>
                  <th className="py-3 px-4">Khách Hàng / Đối Tác B2B</th>
                  <th className="py-3 px-4">Địa Chỉ Giao Hàng &amp; Liên Hệ</th>
                  <th className="py-3 px-4 text-right">SL Đã Giao</th>
                  <th className="py-3 px-4">Ngày Giao Hàng</th>
                  <th className="py-3 px-4">Hóa Đơn GTGT</th>
                  <th className="py-3 px-4 text-center">Trạng Thái Thu Hồi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {(downstreamData?.shippedCustomers || [
                  {
                    soNumber: 'SO-2026-VF-001',
                    customerCode: 'CUST-VINFAST',
                    customerName: 'Tập đoàn Sản Xuất Ô tô VinFast',
                    deliveryAddress: 'KCN Đình Vũ, Cát Hải, TP. Hải Phòng',
                    contactPhone: '+84 225 398 9999',
                    contactPerson: 'Kỹ sư trưởng Nguyễn Tuấn Vũ',
                    shippedQuantity: 300,
                    uom: activeLot.uom,
                    shippingDate: '2026-07-20',
                    invoiceNo: 'HD-AR-2026-0081',
                    deliveryStatus: 'DELIVERED',
                    recallContactStatus: 'PENDING_NOTIFICATION'
                  },
                  {
                    soNumber: 'SO-2026-TH-002',
                    customerCode: 'CUST-THACO',
                    customerName: 'Tập đoàn Cơ Khí Ô tô Chu Lai THACO',
                    deliveryAddress: 'Khu Kinh Tế Mở Chu Lai, Núi Thành, Quảng Nam',
                    contactPhone: '+84 235 385 6789',
                    contactPerson: 'Trưởng ban mua hàng Lê Hoàng Nam',
                    shippedQuantity: 150,
                    uom: activeLot.uom,
                    shippingDate: '2026-08-05',
                    invoiceNo: 'HD-AR-2026-0094',
                    deliveryStatus: 'DELIVERED',
                    recallContactStatus: 'PENDING_NOTIFICATION'
                  }
                ]).map((cust: any, idx: number) => {
                  const currentStatus = customerContactStatus[cust.soNumber] || cust.recallContactStatus;
                  return (
                    <tr key={idx} className="hover:bg-blue-50/40 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {cust.soNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{cust.customerName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{cust.customerCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-xs">{cust.deliveryAddress}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <User className="w-3 h-3" />
                          <span>{cust.contactPerson}</span>
                          <span>•</span>
                          <Phone className="w-3 h-3" />
                          <span className="font-mono">{cust.contactPhone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {cust.shippedQuantity?.toLocaleString('vi-VN')} {cust.uom}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {cust.shippingDate}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {cust.invoiceNo}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={currentStatus}
                          onChange={(e) => {
                            setCustomerContactStatus(prev => ({ ...prev, [cust.soNumber]: e.target.value }));
                            if (onNotify) onNotify('info', 'Cập Nhật Trạng Thái Thu Hồi', `Đã cập nhật trạng thái liên hệ thu hồi cho ${cust.customerName}: ${e.target.value}`);
                          }}
                          className={`text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-hidden shadow-2xs ${
                            currentStatus === 'NOTIFIED_CONFIRMED'
                              ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                              : currentStatus === 'RECALL_IN_PROGRESS'
                              ? 'bg-amber-100 dark:bg-amber-950/90 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                              : 'bg-rose-100 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700'
                          }`}
                        >
                          <option value="PENDING_NOTIFICATION" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Chờ Phát Cảnh Báo</option>
                          <option value="NOTIFIED_SENT" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Đã Gửi Công Văn</option>
                          <option value="RECALL_IN_PROGRESS" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Đang Thu Hồi</option>
                          <option value="NOTIFIED_CONFIRMED" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Đã Tiếp Nhận Lại</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED PRODUCTION ORDER CONSUMPTION TABLE */}
      {(viewMode === 'ALL' || viewMode === 'DOWNSTREAM') && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Factory className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Danh Sách Lệnh Sản Xuất (Work Orders) Đã Tiêu Hao Lô {activeLot.batchNumber}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bảng đối chiếu định mức BOM và số lượng thực xuất từ phân hệ MES • Nhấp để xem Chi Tiết &amp; Lịch Sử API
              </p>
            </div>
            <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold rounded-lg border border-amber-200 dark:border-amber-800">
              {woNodes.length} Lệnh Sản Xuất Liên Quan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider font-mono">
                  <th className="py-3 px-4">Mã Lệnh SX (WO)</th>
                  <th className="py-3 px-4">Tên Hoạt Động &amp; Xưởng Chế Tạo</th>
                  <th className="py-3 px-4 text-right">SL Tiêu Hao</th>
                  <th className="py-3 px-4">Tỷ Lệ Tiêu Thụ</th>
                  <th className="py-3 px-4">Ngày Xuất Dùng</th>
                  <th className="py-3 px-4">Thành Phẩm Đầu Ra (FG)</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {woNodes.length > 0 ? (
                  woNodes.map((wo, idx) => {
                    const consumptionPct = Math.round(((wo.quantity || 0) / activeLot.initialQty) * 100);
                    return (
                      <tr 
                        key={wo.id} 
                        className="hover:bg-blue-50/50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer"
                        onClick={() => setInspectingWorkOrderCodeOrId(wo.code || wo.id)}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {wo.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{wo.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{wo.workcenter || wo.subtitle}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                          {wo.quantity?.toLocaleString('vi-VN')} {wo.uom || activeLot.uom}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, consumptionPct)}%` }}
                              ></div>
                            </div>
                            <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">{consumptionPct}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {wo.date}
                        </td>
                        <td className="py-3 px-4">
                          {fgNodes[idx] ? (
                            <div>
                              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 block">{fgNodes[idx].code}</span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs block">{fgNodes[idx].name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">Đang gia công</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {wo.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setInspectingWorkOrderCodeOrId(wo.code || wo.id)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-lg transition-colors cursor-pointer"
                            title="Kiểm tra chi tiết và lịch sử lệnh sản xuất này (API)"
                          >
                            <Factory className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400 font-mono">
                      Chưa có lệnh sản xuất nào tiêu hao lô này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMERGENCY RECALL CONFIRM DIALOG (Rule #19 & ISO Compliance) */}
      <ConfirmDialog
        isOpen={isRecallDialogOpen}
        title="KÍCH HOẠT PHONG TỎA & THU HỒI SỰ CỐ KHẨN CẤP"
        message={`Bạn đang thực hiện kích hoạt quy trình thu hồi cho Lô ${activeLot.batchNumber} (${activeLot.productName}). Hành động này sẽ chuyển trạng thái Lô sang 'QUARANTINE', khóa toàn bộ ${activeLot.currentQty.toLocaleString('vi-VN')} ${activeLot.uom} tồn kho, và gửi thông báo cảnh báo đến toàn bộ các khách hàng trong chuỗi phân phối.`}
        variant="danger"
        confirmText={isLockingRecall ? "Đang xử lý..." : "Xác Nhận Khóa Thu Hồi"}
        cancelText="Hủy Bỏ"
        onConfirm={handleExecuteRecallIncident}
        onCancel={() => setIsRecallDialogOpen(false)}
      />

      {/* INSPECTION MODAL: WORK ORDER DETAILS & HISTORY LINKED WITH API */}
      {inspectingWorkOrderCodeOrId && (
        <WorkOrderInspectionModal
          orderIdOrCode={inspectingWorkOrderCodeOrId}
          onClose={() => setInspectingWorkOrderCodeOrId(null)}
          onSelectEntity={onSelectEntity}
        />
      )}
    </div>
  );
};
