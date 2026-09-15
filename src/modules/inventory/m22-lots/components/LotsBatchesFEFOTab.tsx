import React, { useState, useMemo } from 'react';
import { Clock, ShieldAlert, ArrowUpRight, Calculator, CheckCircle2, AlertCircle, ArrowRight, Sparkles, Navigation, Layers } from 'lucide-react';
import { L3ContentState } from '../../../../components/common/L3ContentState';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { usePagination } from '../../../../hooks/usePagination';
import { LotItem } from '../LotInventoryHistoryDrilldown';

interface LotsBatchesFEFOTabProps {
  lots: LotItem[];
  onSelectEntity?: (entity: any) => void;
  activeLotId?: string;
}

export const LotsBatchesFEFOTab: React.FC<LotsBatchesFEFOTabProps> = ({ lots, onSelectEntity, activeLotId }) => {
  // Sort lots by expiration date for FEFO (First Expired, First Out)
  const fefoSortedLots = useMemo(() => {
    return [...lots].sort((a, b) => a.expDate.localeCompare(b.expDate));
  }, [lots]);

  // Unique SKUs for simulator selection
  const uniqueSkus = useMemo(() => {
    const map = new Map<string, { sku: string; name: string }>();
    lots.forEach(l => {
      if (!map.has(l.sku)) {
        map.set(l.sku, { sku: l.sku, name: l.productName });
      }
    });
    return Array.from(map.values());
  }, [lots]);

  // Simulator state
  const [simSku, setSimSku] = useState(uniqueSkus[0]?.sku || 'SKU-ENG-088');
  const [simQty, setSimQty] = useState('450');
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleRunSimulator = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/inventory/lots/fefo-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: simSku,
          requiredQuantity: Number(simQty) || 0
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSimResult(data);
      } else {
        // Fallback local FEFO simulation if server unreachable
        const targetLots = lots
          .filter(l => l.sku === simSku && l.currentQty > 0 && l.status !== 'EXPIRED')
          .sort((a, b) => a.expDate.localeCompare(b.expDate));

        let req = Number(simQty) || 0;
        const allocations = [];
        for (const l of targetLots) {
          if (req <= 0) break;
          const take = Math.min(l.currentQty, req);
          req -= take;
          allocations.push({
            lotId: l.id,
            batchNumber: l.batchNumber,
            warehouse: l.warehouse,
            locationBin: 'BIN-A01-DEFAULT',
            expDate: l.expDate,
            lotAvailableQty: l.currentQty,
            allocatedQty: take,
            remainingInLotAfterAllocation: l.currentQty - take,
            uom: l.uom,
            isNearExpiry: l.status === 'EXPIRED_SOON',
            fefoPriorityRank: allocations.length + 1
          });
        }
        setSimResult({
          success: true,
          sku: simSku,
          requiredQuantity: Number(simQty),
          totalAllocated: Number(simQty) - req,
          unfulfilledQuantity: req,
          isFullySatisfied: req === 0,
          allocations,
          pickingRouteRecommendation: allocations.map((a, i) => ({
            step: i + 1,
            locationBin: a.locationBin,
            batchNumber: a.batchNumber,
            pickQty: `${a.allocatedQty} ${a.uom}`,
            action: `Nhặt ${a.allocatedQty} ${a.uom} từ vị trí kho (Lô: ${a.batchNumber} - HSD: ${a.expDate})`
          }))
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const pagination = usePagination({
    totalItems: fefoSortedLots.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedLots = useMemo(() => {
    return pagination.paginatedData(fefoSortedLots);
  }, [fefoSortedLots, pagination]);

  return (
    <div className="space-y-4">
      {/* L2: DASHBOARD METRICS & INTRO */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-mono text-[10px] font-bold border border-amber-200 dark:border-amber-800">
              FEFO ALLOCATION ENGINE
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              First-Expired, First-Out (Hạn Gần Nhất Xuất Trước)
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Tự động sắp xếp mức độ ưu tiên xuất kho theo ngày hết hạn (EXP Date), ngăn ngừa tồn đọng hàng quá hạn và tối ưu hóa chuỗi cung ứng vật tư.
          </p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>

      {/* INTERACTIVE FEFO SIMULATOR WIDGET */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 shadow-2xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Mô Phỏng Phân Bổ Xuất Kho Theo Thuật Toán FEFO (Simulator)</span>
          </h3>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
            Tự động bóc tách đa lô (Multi-Lot Split) & Lộ trình nhặt hàng
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-6 space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Chọn Mặt Hàng Cần Xuất Kho (SKU)
            </label>
            <select
              value={simSku}
              onChange={(e) => setSimSku(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-white"
            >
              {uniqueSkus.map(item => (
                <option key={item.sku} value={item.sku}>
                  {item.sku} - {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Số Lượng Yêu Cầu Xuất
            </label>
            <input
              type="number"
              min="1"
              value={simQty}
              onChange={(e) => setSimQty(e.target.value)}
              placeholder="VD: 500"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-white"
            />
          </div>

          <div className="md:col-span-3">
            <button
              onClick={handleRunSimulator}
              disabled={isSimulating}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'Đang Tính Toán...' : 'Chạy Mô Phỏng FEFO'}</span>
            </button>
          </div>
        </div>

        {/* SIMULATION RESULT DISPLAY */}
        {simResult && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Kết Quả Phân Bổ Cho SKU: <span className="font-mono text-blue-600 dark:text-blue-400">{simResult.sku}</span>
                </span>
                {simResult.isFullySatisfied ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Đáp ứng đủ 100% ({simResult.totalAllocated}/{simResult.requiredQuantity})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Thiếu Hụt {simResult.unfulfilledQuantity} đơn vị
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Số Lô Cần Trích Xuất: {simResult.allocations?.length || 0} lô
              </span>
            </div>

            {/* ALLOCATED LOTS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {simResult.allocations?.map((alloc: any) => (
                <div 
                  key={alloc.lotId}
                  className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-mono text-[10px] font-bold rounded-md">
                      ƯU TIÊN #{alloc.fefoPriorityRank}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400">
                      HSD: {alloc.expDate}
                    </span>
                  </div>

                  <div>
                    <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {alloc.batchNumber}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {alloc.warehouse} ({alloc.locationBin})
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Số lượng trích xuất:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {alloc.allocatedQty} {alloc.uom}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Tồn kho sau xuất:</span>
                    <span>{alloc.remainingInLotAfterAllocation} {alloc.uom}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* PICKING RECOMMENDATION ROUTE */}
            {simResult.pickingRouteRecommendation && simResult.pickingRouteRecommendation.length > 0 && (
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs">
                <div className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 mb-1.5">
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Chỉ Dẫn Lộ Trình Nhặt Hàng Cho Thủ Kho:</span>
                </div>
                <div className="space-y-1 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                  {simResult.pickingRouteRecommendation.map((step: any) => (
                    <div key={step.step} className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[9px] font-bold">
                        {step.step}
                      </span>
                      <span>{step.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* L3: DATA GRID */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Bảng Xếp Hạng Ưu Tiên Xuất Kho Toàn Diện (FEFO Master Priority)</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {fefoSortedLots.length} Lô Đang Quản Lý
          </span>
        </div>

        <L3ContentState
          isLoading={false}
          isEmpty={paginatedLots.length === 0}
          emptyMessage="Không có dữ liệu lô hàng nào để mô phỏng FEFO."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 w-16 text-center">Ưu Tiên</th>
                  <th className="p-3">Mã Lô (Batch No)</th>
                  <th className="p-3">Sản Phẩm (SKU & Tên)</th>
                  <th className="p-3">Kho & Vị Trí</th>
                  <th className="p-3 text-center">Hạn Sử Dụng (HSD)</th>
                  <th className="p-3 text-right">Tồn Khả Dụng</th>
                  <th className="p-3 text-center">Đề Xuất (FEFO)</th>
                  <th className="p-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {paginatedLots.map((lot, idx) => {
                  const globalIdx = (pagination.currentPage - 1) * pagination.pageSize + idx;
                  const isFirst = globalIdx === 0;
                  const isSecond = globalIdx === 1;

                  return (
                    <tr
                      key={lot.id}
                      className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 ${
                        isFirst ? 'border-l-4 border-rose-500 bg-rose-50/15 dark:bg-rose-950/10' :
                        isSecond ? 'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10' :
                        'border-l-4 border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10'
                      }`}
                    >
                      <td className="p-3 text-center">
                        <div className={`w-6 h-6 rounded-md inline-flex items-center justify-center font-bold font-mono text-[11px] ${
                          isFirst ? 'bg-rose-600 text-white shadow-md' :
                          isSecond ? 'bg-amber-500 text-white' :
                          'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                        }`}>
                          #{globalIdx + 1}
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <div className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          {lot.batchNumber}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {lot.sku}
                        </div>
                        <div className="font-semibold text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                          {lot.productName}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {lot.warehouse}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <div className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                          {lot.expDate}
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <div className="font-mono tabular-nums font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          {lot.currentQty.toLocaleString('vi-VN')} {lot.uom}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 text-[10px] rounded-md border inline-flex items-center gap-1 font-bold ${
                          isFirst ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 animate-pulse' :
                          'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600'
                        }`}>
                          {isFirst ? 'ƯU TIÊN XUẤT SỐ 1' : 'ĐỢI XUẤT SAU'}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => onSelectEntity && onSelectEntity(lot)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Chi tiết & Lịch sử"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </L3ContentState>

        {/* L4: STICKY FOOTER PAGINATION */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <PaginationControl
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={fefoSortedLots.length}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            onPageChange={pagination.goToPage}
            onPageSizeChange={pagination.setPageSize}
            pageSizeOptions={[5, 10, 20, 50, 100]}
          />
        </div>
      </div>
    </div>
  );
};

