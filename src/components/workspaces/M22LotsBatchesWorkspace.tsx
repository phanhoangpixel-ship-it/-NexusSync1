import React, { useState, useEffect } from 'react';
import { useWorkspaceAction } from "../shell/DomainWorkspaceShell";
import { Layers, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Box } from 'lucide-react';
import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';
import { ENTERPRISE_MASTER_PRODUCTS } from '../../data/enterpriseMaster';
import { LotItem, LotInventoryHistoryDrilldown } from './lotsBatches/LotInventoryHistoryDrilldown';
import { LotsBatchesMasterTab } from './lotsBatches/LotsBatchesMasterTab';
import { LotsBatchesFEFOTab } from './lotsBatches/LotsBatchesFEFOTab';
import { LotsBatchesTraceabilityTab } from './lotsBatches/LotsBatchesTraceabilityTab';

interface M22LotsBatchesWorkspaceProps {
  onSelectEntity?: (entity: any) => void;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
}

export const M22LotsBatchesWorkspace: React.FC<M22LotsBatchesWorkspaceProps> = ({
  onSelectEntity,
  onNotify
}) => {
  const { setPrimaryAction } = useWorkspaceAction();
  const [isLoading, setIsLoading] = useState(false);

  const [lots, setLots] = useState<LotItem[]>([
    {
      id: 'LOT-2026-001',
      batchNumber: 'LOT-YMH-2026-08A',
      sku: 'SKU-ENG-088',
      productName: 'Động cơ servo AC 750W',
      category: 'Động cơ & Biến tần',
      warehouse: 'WH-01 (Kho Tổng Hà Nội)',
      mfgDate: '2026-01-15',
      expDate: '2029-01-15',
      initialQty: 500,
      currentQty: 420,
      uom: 'Cái',
      status: 'ACTIVE',
      supplierLot: 'SUP-LOT-88901'
    },
    {
      id: 'LOT-2026-002',
      batchNumber: 'LOT-PLC-2026-03B',
      sku: 'SKU-PLC-102',
      productName: 'Bộ lập trình PLC Siemens S1200',
      category: 'Tự động hóa',
      warehouse: 'WH-02 (Kho Chi nhánh Nam)',
      mfgDate: '2026-03-10',
      expDate: '2028-03-10',
      initialQty: 250,
      currentQty: 185,
      uom: 'Bộ',
      status: 'ACTIVE',
      supplierLot: 'SIEMENS-BATCH-442'
    },
    {
      id: 'LOT-2026-003',
      batchNumber: 'LOT-SEN-2025-11X',
      sku: 'SKU-SEN-305',
      productName: 'Cảm biến quang điện Panasonic',
      category: 'Thiết bị điện',
      warehouse: 'WH-01 (Kho Tổng Hà Nội)',
      mfgDate: '2025-11-01',
      expDate: '2026-09-15',
      initialQty: 1000,
      currentQty: 95,
      uom: 'Cái',
      status: 'EXPIRED_SOON',
      supplierLot: 'PANAS-LOT-991'
    },
    {
      id: 'LOT-2026-004',
      batchNumber: 'LOT-INV-2025-05C',
      sku: 'SKU-INV-204',
      productName: 'Biến tần Inverter 3 pha 380V',
      category: 'Động cơ & Biến tần',
      warehouse: 'WH-03 (Kho Linh kiện CNC)',
      mfgDate: '2025-05-20',
      expDate: '2026-08-10',
      initialQty: 100,
      currentQty: 12,
      uom: 'Cái',
      status: 'EXPIRED',
      supplierLot: 'INV-OLD-772'
    }
  ]);

  const fetchLots = async (showToast = false) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/inventory/lots');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setLots(json.data);
          if (showToast) {
            onNotify('success', 'Đồng Bộ Thành Công', `Đã tải ${json.data.length} lô hàng từ máy chủ.`);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch lots:', err);
      if (showToast) {
        onNotify('warning', 'Chế Độ Offline', 'Đang sử dụng dữ liệu cục bộ từ bộ nhớ đệm.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLots(false);
  }, []);

  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'lots' | 'fefo' | 'traceability'>('M22', 'lots');
  const [globalActiveLotId, setGlobalActiveLotId] = useState<string>('LOT-2026-001');
  const [selectedLotForDrilldown, setSelectedLotForDrilldown] = useState<LotItem | null>(null);

  const handleViewTraceability = (lot: LotItem) => {
    setGlobalActiveLotId(lot.id);
    setActiveTab('traceability');
    onNotify('info', 'Đồ Thị D3 Truy Xuất', `Đang mở đồ thị D3 liên kết Lệnh SX (WO) cho lô ${lot.batchNumber}`);
  };

  return (
    <div className="space-y-3.5 max-w-full pb-6">
      {/* L0: WORKSPACE BANNER & CORE IDENTITY */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center shrink-0">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              M22: Quản Lý Lô & Date (Lots & Batches)
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
                CORE WMS
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Kiểm soát số lô sản xuất, truy xuất nguồn gốc, hạn sử dụng, và tự động hóa cảnh báo FEFO.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden md:flex flex-col items-end pr-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Trạng thái đồng bộ</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {isLoading ? 'SYNCING...' : 'LIVE SYNC'}
              </span>
            </div>
          </div>
          <button
            onClick={() => fetchLots(true)}
            disabled={isLoading}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Làm mới dữ liệu từ API máy chủ"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ================= TẦNG L1: SUB-TABS NAVIGATION BAR (M41 MASTER SPEC) ================= */}
      <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('lots')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'lots' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Sổ Cái Lô Hàng (Master Batches)</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'lots' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {lots.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fefo')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'fefo' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Mô Phỏng &amp; Cảnh Báo FEFO</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'fefo' ? 'bg-blue-700 text-white' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
            }`}>
              {lots.filter(l => l.daysToExpiry <= 30).length} Cận Date
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('traceability')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'traceability' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Truy Xuất Phả Hệ (Traceability)</span>
          </button>
        </div>

        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold shrink-0 border-l border-slate-200 dark:border-slate-700/70 pl-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>FEFO / GS1-128 Ready</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            WMS M22 Core
          </span>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'lots' && (
          <LotsBatchesMasterTab 
            lots={lots} 
            setLots={setLots} 
            onNotify={onNotify} 
            onSelectEntity={onSelectEntity}
            onViewTraceability={handleViewTraceability}
          />
        )}
        {activeTab === 'fefo' && (
          <LotsBatchesFEFOTab lots={lots} onSelectEntity={onSelectEntity} />
        )}
        {activeTab === 'traceability' && (
          <LotsBatchesTraceabilityTab 
            lots={lots} 
            onSelectEntity={onSelectEntity} 
            activeLotId={globalActiveLotId}
            onLotChange={setGlobalActiveLotId}
            onViewDrilldown={setSelectedLotForDrilldown}
          />
        )}
      </div>

      {/* LOT INVENTORY HISTORY & STOCK MOVEMENTS DRILLDOWN MODAL */}
      {selectedLotForDrilldown && (
        <LotInventoryHistoryDrilldown
          lot={selectedLotForDrilldown}
          onClose={() => setSelectedLotForDrilldown(null)}
          onNotify={onNotify}
          onUpdateLotStatus={(lotId, newStatus) => {
            setLots(prev => prev.map(l => l.id === lotId ? { ...l, status: newStatus } : l));
            setSelectedLotForDrilldown(prev => prev && prev.id === lotId ? { ...prev, status: newStatus } : prev);
          }}
        />
      )}
    </div>
  );
};
