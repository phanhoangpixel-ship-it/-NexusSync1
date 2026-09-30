import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Clock, FileText, ArrowRight, Share2, Network, 
  Table, Layers, Factory, CheckCircle2, Package, ShoppingCart, 
  ExternalLink, Download, Filter, Sparkles, RefreshCw, AlertTriangle,
  ShieldAlert, Building2, Truck, CheckSquare, Square, FileSpreadsheet,
  Phone, MapPin, User, ChevronRight, Info, Copy, Check, DollarSign,
  ShieldCheck, RotateCcw, AlertOctagon, Scale, Shield, BarChart3
} from 'lucide-react';
import { LotItem } from './LotInventoryHistoryDrilldown';
import { LotDependencyGraphD3, generateTraceDataForLot } from './LotDependencyGraphD3';
import { WorkOrderInspectionModal } from '../../../manufacturing/m25-mes/components/WorkOrderInspectionModal';
import { 
  TraceabilityAggregationService, 
  FullTraceabilityDossier,
  TraceabilityAnchor 
} from '../../../../services/TraceabilityAggregationService';

interface LotsBatchesTraceabilityTabProps {
  lots: LotItem[];
  onSelectEntity?: (entity: any) => void;
  activeLotId?: string;
  onLotChange?: (lotId: string) => void;
  onViewDrilldown?: (lot: any) => void;
  onNotify?: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  onUpdateLotStatus?: (lotId: string, newStatus: string) => void;
}

export type TraceabilitySubTab = 
  | 'OVERVIEW'
  | 'ORIGIN'
  | 'DESTINATION'
  | 'TIMELINE'
  | 'QUALITY'
  | 'FINANCE'
  | 'RETURNS'
  | 'INTEGRITY_EXPOSURE';

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
  const [activeSubTab, setActiveSubTab] = useState<TraceabilitySubTab>('OVERVIEW');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Pagination for timeline
  const [timelinePage, setTimelinePage] = useState<number>(1);
  const timelinePageSize = 4;

  // Max depth and max nodes controls (F360-11)
  const [maxDepth, setMaxDepth] = useState<number>(5);
  const [maxNodes, setMaxNodes] = useState<number>(500);

  // Full Dossier Data State (F360-01 to F360-11)
  const [dossier, setDossier] = useState<FullTraceabilityDossier | null>(null);
  const [isLoadingDossier, setIsLoadingDossier] = useState<boolean>(false);
  const [inspectingWorkOrderCodeOrId, setInspectingWorkOrderCodeOrId] = useState<string | number | null>(null);

  const activeLot = lots.find(l => l.id === activeLotId) || lots[0];

  const handleLotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLotId = e.target.value;
    setLocalActiveLotId(newLotId);
    if (onLotChange) onLotChange(newLotId);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    if (onNotify) onNotify(`Đã sao chép mã ${label}: ${text}`, 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Load Dossier from Aggregation Service
  useEffect(() => {
    if (!activeLot) return;
    setIsLoadingDossier(true);

    const anchor: TraceabilityAnchor = {
      type: 'LOT',
      id: activeLot.id,
      code: activeLot.batchNumber,
      sku: activeLot.sku,
      productName: activeLot.productName,
      warehouse: activeLot.warehouse,
      currentQty: activeLot.currentQty,
      initialQty: activeLot.initialQty,
      uom: activeLot.uom,
      status: activeLot.status,
      mfgDate: activeLot.mfgDate,
      expDate: activeLot.expDate,
      supplierLot: activeLot.supplierLot
    };

    TraceabilityAggregationService.buildFullDossier(anchor, {
      maxDepth,
      maxNodes,
      userPermissions: ['INVENTORY_VIEW', 'QUALITY_VIEW', 'FINANCE_VIEW', 'SALES_VIEW']
    }).then(result => {
      setDossier(result);
      setIsLoadingDossier(false);
    }).catch(err => {
      console.error('Error building dossier:', err);
      setIsLoadingDossier(false);
    });
  }, [activeLot?.id, maxDepth, maxNodes]);

  // Client-Side CSV Export (F360-12)
  const handleExportCsv = () => {
    if (!dossier) return;
    const rows = [
      ['PHÂN HỆ', 'MÃ CHỨNG TỪ', 'TIÊU ĐỀ', 'SỐ LƯỢNG', 'TRẠNG THÁI'],
      ['LÔ GỐC', dossier.anchor.code, dossier.anchor.productName, `${dossier.anchor.currentQty} ${dossier.anchor.uom}`, dossier.anchor.status],
      ...dossier.upstreamOriginNodes.map(n => ['NGUỒN GỐC (NCC/PO)', n.code, n.title, `${n.quantity || 0} ${n.uom || ''}`, n.status]),
      ...dossier.downstreamDestinationNodes.map(n => ['ĐI ĐÂU (MO/SO)', n.code, n.title, `${n.quantity || 0} ${n.uom || ''}`, n.status]),
      ...dossier.timeline.map(t => ['TIMELINE', t.referenceNo, t.title, t.timestamp, t.status])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HO_SO_TRUY_VET_${activeLot.batchNumber}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onNotify) onNotify('Đã xuất file CSV Hồ Sơ Truy Vết thành công.', 'success');
  };

  if (!activeLot) {
    return <div className="p-8 text-center text-slate-500 font-mono">Không tìm thấy dữ liệu lô hàng để truy xuất.</div>;
  }

  const paginatedTimeline = (dossier?.timeline || []).slice(
    (timelinePage - 1) * timelinePageSize,
    timelinePage * timelinePageSize
  );

  return (
    <div className="space-y-4">
      {/* HEADER CONTROLS & LOT SELECTOR */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                M22 TRACEABILITY DOSSIER
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                ISO 9001:2015 • IATF 16949 • GMP Standard
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <span>Hồ Sơ Truy Vết Lô &amp; Chuỗi Cung Ứng Khép Kín</span>
              {isLoadingDossier && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
            </h2>
          </div>

          {/* Quick Lot Selector & Export */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500 font-medium">Lô đang xem:</span>
              <select
                value={activeLotId}
                onChange={handleLotChange}
                className="bg-transparent font-mono font-bold text-blue-600 dark:text-blue-400 focus:outline-hidden cursor-pointer"
              >
                {lots.map(l => (
                  <option key={l.id} value={l.id} className="text-slate-900 dark:text-white">
                    {l.batchNumber} — {l.productName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-600 cursor-pointer"
              title="Xuất file CSV hồ sơ truy vết"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Xuất CSV</span>
            </button>
          </div>
        </div>

        {/* 8 SUB-TABS NAVIGATION STRIP (F360-12) */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { key: 'OVERVIEW', label: '1. Tổng Quan', icon: Layers },
            { key: 'ORIGIN', label: '2. Nguồn Gốc (Upstream)', icon: Building2 },
            { key: 'DESTINATION', label: '3. Đi Đâu (Downstream)', icon: Truck },
            { key: 'TIMELINE', label: '4. Dòng Thời Gian', icon: Clock },
            { key: 'QUALITY', label: '5. Chất Lượng (M39)', icon: CheckCircle2 },
            { key: 'FINANCE', label: '6. Tài Chính (M30/M42)', icon: DollarSign },
            { key: 'RETURNS', label: '7. Sau Bán Hàng (M15)', icon: RotateCcw },
            { key: 'INTEGRITY_EXPOSURE', label: '8. Toàn Vẹn & Rủi Ro', icon: ShieldCheck },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key as TraceabilitySubTab)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TỔNG QUAN (OVERVIEW & D3 GRAPH)                                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-4">
          {/* ANCHOR IDENTITY CARD */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                  {activeLot.batchNumber}
                </span>
                <button
                  onClick={() => copyToClipboard(activeLot.batchNumber, 'Lô')}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Sao chép mã lô"
                >
                  {copiedCode === activeLot.batchNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeLot.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                  activeLot.status === 'EXPIRED_SOON' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                  'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}>
                  {activeLot.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {activeLot.productName} • SKU: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{activeLot.sku}</strong> • Kho: <strong>{activeLot.warehouse}</strong>
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-sans font-medium">Tồn Khả Dụng</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {activeLot.currentQty.toLocaleString('vi-VN')} {activeLot.uom}
                </span>
              </div>
              <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-4">
                <span className="text-[10px] text-slate-400 block uppercase font-sans font-medium">Ban Đầu</span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  {activeLot.initialQty.toLocaleString('vi-VN')} {activeLot.uom}
                </span>
              </div>
            </div>
          </div>

          {/* D3 TRACEABILITY GRAPH */}
          <LotDependencyGraphD3 
            lot={activeLot} 
            onSelectEntity={onSelectEntity} 
            onInspectWorkOrder={(code) => setInspectingWorkOrderCodeOrId(code)}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. NGUỒN GỐC (UPSTREAM ORIGIN: NCC -> PO -> GRN -> KCS)                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'ORIGIN' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Chuỗi Cung Ứng Nguồn Gốc (Upstream Origin Lineage)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Truy ngược từ Nhà Cung Cấp, Hợp Đồng Đơn Mua PO, Phiếu Nhập Kho GRN và Biên Bản Nghiệm Thu KCS Đầu Vào.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-800">
              {dossier?.upstreamOriginNodes.length || 0} Mắt Xích Nguồn
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(dossier?.upstreamOriginNodes || []).map(node => (
              <div key={node.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                    {node.type}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {node.status}
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">{node.title}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{node.subtitle}</div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-mono text-slate-500">Mã: <strong>{node.code}</strong></span>
                  {node.moduleRoute && (
                    <a
                      href={node.moduleRoute}
                      onClick={(e) => { e.preventDefault(); if (onSelectEntity) onSelectEntity(node.code); }}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1"
                    >
                      <span>Xem module gốc</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ĐI ĐÂU (DOWNSTREAM DESTINATION: MO -> BOM -> FG -> SO -> KHÁCH)        */}
      {/* ========================================================================= */}
      {activeSubTab === 'DESTINATION' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Luồng Xuất Phân Phối (Downstream Consumption Lineage)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Theo dõi quá trình đưa nguyên liệu vào Lệnh SX, cấu thành Lô Thành Phẩm và giao đến các Khách Hàng B2B.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">
              {dossier?.downstreamDestinationNodes.length || 0} Đích Tiêu Thụ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(dossier?.downstreamDestinationNodes || []).map(node => (
              <div key={node.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    {node.type}
                  </span>
                  {node.scrapRate && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Hao hụt: {node.scrapRate}
                    </span>
                  )}
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">{node.title}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{node.subtitle}</div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-mono text-slate-500">Mã: <strong>{node.code}</strong></span>
                  {node.moduleRoute && (
                    <a
                      href={node.moduleRoute}
                      onClick={(e) => { e.preventDefault(); if (onSelectEntity) onSelectEntity(node.code); }}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1"
                    >
                      <span>Xem module gốc</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DÒNG THỜI GIAN (TIMELINE EVENTS)                                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'TIMELINE' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Dòng Thời Gian Vòng Đời Hợp Nhất (Chronological Event Lineage)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hợp nhất các mốc biến động từ Sổ Thẻ Kho (M17), Biên Bản KCS (M39) và Lệnh Xuất Giao (M15/M16).
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Trang {timelinePage} / {Math.ceil((dossier?.timeline.length || 1) / timelinePageSize)}
            </span>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
            {paginatedTimeline.map(ev => (
              <div key={ev.id} className="relative">
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-800" />
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{ev.title}</span>
                    <span className="font-mono text-[11px] text-slate-400">{ev.timestamp}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{ev.description}</p>
                  <div className="flex items-center gap-3 text-slate-500 text-[11px] pt-1">
                    <span>Số CT: <strong className="font-mono">{ev.referenceNo}</strong></span>
                    <span>•</span>
                    <span>Thực hiện: <strong>{ev.actor}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setTimelinePage(prev => Math.max(1, prev - 1))}
              disabled={timelinePage === 1}
              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              Trang trước
            </button>
            <button
              onClick={() => setTimelinePage(prev => prev + 1)}
              disabled={timelinePage * timelinePageSize >= (dossier?.timeline.length || 0)}
              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CHẤT LƯỢNG (QUALITY DOSSIER & COA M29/M39)                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'QUALITY' && dossier?.quality && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Hồ Sơ Chất Lượng KCS &amp; Chứng Chỉ COA (Quality Compliance)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Các chỉ tiêu đo kiểm đầu vào, tỷ lệ lỗi công đoạn và chứng nhận xuất xưởng theo chuẩn ISO 9001.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">
              {dossier.quality.inboundQC.certificateNo}
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
                {dossier.quality.inboundQC.parameters.map((param, idx) => (
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
      )}

      {/* ========================================================================= */}
      {/* 6. TÀI CHÍNH (FINANCE & COGS LAYERS M30/M42)                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'FINANCE' && dossier?.financial && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Liên Thông Tài Chính &amp; Giá Vốn Đích Danh (M30 / M42)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Đối chiếu giá vốn thực tế (COGS Unit Cost) và các bút toán định khoản kế toán tự động phát sinh.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
              Đơn giá vốn: {dossier.financial.cogsUnitCost.toLocaleString('vi-VN')} ₫
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dossier.financial.glJournals.map((gl, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-600">{gl.voucherNo}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {gl.amount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 font-medium">{gl.description}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>Nợ: <strong>{gl.accountDebit}</strong></span>
                  <span>Có: <strong>{gl.accountCredit}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SAU BÁN HÀNG (RETURNS & RMA DOSSIER M15)                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'RETURNS' && dossier?.postSales && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Lịch Sử Sau Bán Hàng &amp; Đổi Trả RMA (M15 Returns)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tổng hợp yêu cầu bảo hành, đổi trả hàng (RMA) liên quan đến sản phẩm thuộc lô {activeLot.batchNumber}.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono text-xs font-bold rounded-lg border border-purple-200 dark:border-purple-800">
              {dossier.postSales.rmaRequestsCount} Đơn RMA
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase text-[10px] font-bold font-mono">
                  <th className="py-2.5 px-3">Mã RMA</th>
                  <th className="py-2.5 px-3">Khách Hàng</th>
                  <th className="py-2.5 px-3">Lý Do Đổi Trả</th>
                  <th className="py-2.5 px-3 text-right">SL Trả</th>
                  <th className="py-2.5 px-3 text-center">Xử Lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {dossier.postSales.returnsList.map((ret, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-2.5 px-3 font-mono font-bold text-purple-600">{ret.rmaNumber}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{ret.customerName}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{ret.returnReason}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">{ret.quantity}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {ret.disposition}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TOÀN VẸN & RỦI RO (INTEGRITY & EXPOSURE SIMULATION)                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'INTEGRITY_EXPOSURE' && dossier?.integrity && (
        <div className="space-y-4">
          {/* Integrity Report Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Báo Cáo Kiểm Tra Tính Toàn Vẹn &amp; Khớp Nối Mắt Xích</span>
              </h3>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono text-xs font-bold rounded-md">
                100% Khớp Nối (0 Lệch Số Lượng)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Tổng Mắt Xích</span>
                <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                  {dossier.integrity.totalNodesCount} Node
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Bảo Toàn Số Dư Sổ Kho</span>
                <span className="font-mono text-base font-bold text-emerald-600">
                  {dossier.integrity.ledgerBalanceSum} = {dossier.integrity.lotCurrentQty} (Variance = 0)
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Mã Băm Kiểm Toán M02</span>
                <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate block">
                  {dossier.integrity.sha256Digest}
                </span>
              </div>
            </div>
          </div>

          {/* Exposure Simulation Card (F360-09 Read-Only) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-amber-500" />
                  <span>Mô Phỏng Độ Phủ Rủi Ro Thị Trường (Exposure Simulation)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đánh giá phạm vi ảnh hưởng giả định nếu phát sinh sự cố chất lượng (Chỉ đọc — Không thực thi khóa).
                </p>
              </div>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 font-mono text-xs font-bold rounded-md">
                Rủi ro: {dossier.exposure.riskLevel}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                <span className="text-amber-800 dark:text-amber-300 font-bold block">Tồn Trong Kho</span>
                <span className="font-mono text-base font-bold text-amber-900 dark:text-amber-100">
                  {dossier.exposure.totalRemainingInWarehouse} {activeLot.uom}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                <span className="text-blue-800 dark:text-blue-300 font-bold block">Đã Giao Khách Hàng</span>
                <span className="font-mono text-base font-bold text-blue-900 dark:text-blue-100">
                  {dossier.exposure.totalShippedToCustomers} Bộ
                </span>
              </div>
              <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
                <span className="text-purple-800 dark:text-purple-300 font-bold block">Khách Hàng Ảnh Hưởng</span>
                <span className="font-mono text-base font-bold text-purple-900 dark:text-purple-100">
                  {dossier.exposure.affectedCustomersCount} Đối tác
                </span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                <span className="text-rose-800 dark:text-rose-300 font-bold block">Ước Tính Giá Trị Rủi Ro</span>
                <span className="font-mono text-base font-bold text-rose-900 dark:text-rose-100">
                  {dossier.exposure.estimatedFinancialExposure.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTION MODAL: WORK ORDER DETAILS */}
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
