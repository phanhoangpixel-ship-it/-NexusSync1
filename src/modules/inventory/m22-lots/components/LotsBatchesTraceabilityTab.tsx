import React, { useState, useEffect } from 'react';
import { 
  Search, Clock, FileText, ArrowRight, Share2, Network, 
  Table, Layers, Factory, CheckCircle2, Package, ShoppingCart, 
  ExternalLink, Download, Filter, Sparkles, RefreshCw
} from 'lucide-react';
import { LotItem } from '../LotInventoryHistoryDrilldown';
import { LotDependencyGraphD3, generateTraceDataForLot } from './LotDependencyGraphD3';
import { WorkOrderInspectionModal } from '../../../manufacturing/m25-mes/components/WorkOrderInspectionModal';

interface LotsBatchesTraceabilityTabProps {
  lots: LotItem[];
  onSelectEntity?: (entity: any) => void;
  activeLotId?: string;
  onLotChange?: (lotId: string) => void;
  onViewDrilldown?: (lot: any) => void;
}

export const LotsBatchesTraceabilityTab: React.FC<LotsBatchesTraceabilityTabProps> = ({ lots, onSelectEntity, activeLotId: externalActiveLotId, onLotChange, onViewDrilldown }) => {
  const [localActiveLotId, setLocalActiveLotId] = useState<string>(externalActiveLotId || lots[0]?.id || 'LOT-2026-001');
  const activeLotId = externalActiveLotId || localActiveLotId;
  const [viewMode, setViewMode] = useState<'GRAPH' | 'TABLE' | 'ALL'>('ALL');
  const [isTraceLoading, setIsTraceLoading] = useState<boolean>(false);
  const [serverTraceData, setServerTraceData] = useState<any>(null);
  const [inspectingWorkOrderCodeOrId, setInspectingWorkOrderCodeOrId] = useState<string | number | null>(null);

  const handleLotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLotId = e.target.value;
    setLocalActiveLotId(newLotId);
    if (onLotChange) onLotChange(newLotId);
  };
  
  const activeLot = lots.find(l => l.id === activeLotId) || lots[0];

  useEffect(() => {
    if (!activeLot) return;
    let isCancelled = false;

    const fetchTraceFromApi = async () => {
      setIsTraceLoading(true);
      try {
        const res = await fetch(`/api/inventory/lots/${activeLot.id}/trace`);
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled && json && json.nodes) {
            setServerTraceData(json);
          }
        }
      } catch (err) {
        console.error("API trace fetch error, falling back to client generator:", err);
      } finally {
        if (!isCancelled) {
          setIsTraceLoading(false);
        }
      }
    };

    fetchTraceFromApi();
    return () => { isCancelled = true; };
  }, [activeLot?.id]);

  if (!activeLot) {
    return <div className="p-8 text-center text-slate-500">Không có dữ liệu lô hàng để truy xuất.</div>;
  }

  // Derive trace data (using server response if available, otherwise local generator)
  const traceData = serverTraceData || generateTraceDataForLot(activeLot);
  const woNodes = traceData.nodes.filter((n: any) => n.type === 'WORK_ORDER');
  const fgNodes = traceData.nodes.filter((n: any) => n.type === 'FINISHED_GOOD');
  const soNodes = traceData.nodes.filter((n: any) => n.type === 'SALES_ORDER');

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS & LOT SELECTOR */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                M22 TRACEABILITY & WO LINEAGE
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                ISO 9001 / IATF 16949 Compliant
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              Truy Xuất Nguồn Gốc & Đồ Thị Tiêu Hao Lệnh Sản Xuất (WO)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Theo dõi chuỗi cung ứng khép kín: Nhà cung cấp &rarr; Lô nguyên liệu &rarr; Lệnh sản xuất (Work Orders) tiêu thụ &rarr; Thành phẩm (FG) &rarr; Đơn hàng xuất bán (SO).
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start md:self-auto shrink-0">
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
              <span>Đồ Thị D3 (Graph)</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Bảng Lệnh SX (WO)</span>
            </button>
          </div>
        </div>

        {/* LOT SELECTOR BAR */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="w-full md:w-80 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Chọn Lô Hàng Cần Truy Xuất</span>
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
                    {l.batchNumber} • {l.productName} ({l.currentQty}/{l.initialQty} {l.uom})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Info Card of Active Lot */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Lô đang chọn phân tích:</div>
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
                <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                  {activeLot.currentQty.toLocaleString('vi-VN')} {activeLot.uom}
                </div>
                <div className="text-[10px] text-slate-400">
                  / Ban đầu: {activeLot.initialQty.toLocaleString('vi-VN')} {activeLot.uom}
                </div>
              </div>

              <button
                onClick={() => onViewDrilldown ? onViewDrilldown(activeLot) : (onSelectEntity && onSelectEntity(activeLot))}
                className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                title="Mở sổ cái chi tiết cho lô hàng này"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Chi Tiết Sổ Cái</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* D3 INTERACTIVE DEPENDENCY GRAPH COMPONENT */}
      {(viewMode === 'ALL' || viewMode === 'GRAPH') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Đồ Thị Tương Tác D3: Luồng Tiêu Thụ Của Các Lệnh Sản Xuất (Work Orders)</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Hỗ trợ kéo thả (Drag), Thu phóng (Zoom) & Kiểm tra nút (Click)
            </span>
          </div>

          <LotDependencyGraphD3 
            lot={activeLot} 
            onSelectEntity={onSelectEntity} 
            onInspectWorkOrder={(woCodeOrId) => setInspectingWorkOrderCodeOrId(woCodeOrId)}
          />
        </div>
      )}

      {/* DETAILED PRODUCTION ORDER CONSUMPTION TABLE */}
      {(viewMode === 'ALL' || viewMode === 'TABLE') && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Factory className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Danh Sách Lệnh Sản Xuất (Work Orders) Đã Tiêu Hao Lô {activeLot.batchNumber}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bảng đối chiếu định mức BOM và số lượng thực xuất từ phân hệ MES (M18) • Nhấp để xem Chi Tiết &amp; Lịch Sử API
              </p>
            </div>
            <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold rounded-lg border border-amber-200 dark:border-amber-800">
              {woNodes.length} Lệnh Sản Xuất
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider font-mono">
                  <th className="py-3 px-4">Mã Lệnh SX (WO)</th>
                  <th className="py-3 px-4">Tên Hoạt Động & Xưởng Chế Tạo</th>
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
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
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
                            <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300">{consumptionPct}%</span>
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
                    <td colSpan={8} className="py-6 text-center text-slate-400">
                      Chưa có lệnh sản xuất nào tiêu hao lô này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3-COLUMN SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            <span>1. Nguồn Gốc & Nhà Cung Cấp</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
            Mã Lô NCC: <strong className="font-mono text-slate-900 dark:text-white">{activeLot.supplierLot}</strong>
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
            Kho lưu trữ: <strong className="text-slate-900 dark:text-white">{activeLot.warehouse}</strong>
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 flex justify-between pb-1">
            Ngày sản xuất: <strong className="font-mono text-slate-900 dark:text-white">{activeLot.mfgDate}</strong>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>2. Hạn Sử Dụng & Xuất Kho FEFO</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
            Hạn sử dụng: <strong className="font-mono text-rose-600 dark:text-rose-400">{activeLot.expDate}</strong>
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
            Trạng thái lô: <strong className="text-emerald-600 dark:text-emerald-400">{activeLot.status}</strong>
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 flex justify-between pb-1">
            Quy tắc xuất kho: <strong className="text-blue-600 dark:text-blue-400">FEFO (First-Expired, First-Out)</strong>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>3. Tổng Tiêu Hao Chuỗi Cung Ứng</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
            Nhập ban đầu: <strong className="font-mono text-slate-900 dark:text-white">{activeLot.initialQty.toLocaleString('vi-VN')} {activeLot.uom}</strong>
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
            Đã xuất sản xuất / tiêu thụ: <strong className="font-mono text-blue-600 dark:text-blue-400">{(activeLot.initialQty - activeLot.currentQty).toLocaleString('vi-VN')} {activeLot.uom}</strong>
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 flex justify-between pb-1">
            Tỷ lệ tiêu hao: <strong className="text-emerald-600 dark:text-emerald-400">{Math.round(((activeLot.initialQty - activeLot.currentQty) / activeLot.initialQty) * 100)}%</strong>
          </p>
        </div>
      </div>

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
