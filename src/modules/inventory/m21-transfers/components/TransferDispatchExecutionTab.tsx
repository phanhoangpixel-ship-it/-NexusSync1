import React, { useState, useMemo } from 'react';
import { 
  Boxes, Barcode, QrCode, Search, Filter, RefreshCw, CheckCircle2, 
  AlertTriangle, ShieldAlert, Edit3, Save, Check, X, ArrowRight, 
  MapPin, Eye, Lock, Unlock, Sliders, ShieldCheck, Download,
  Truck, ArrowLeftRight, Package, Send, CornerDownRight, CheckSquare
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';
import { usePagination } from '../../../../hooks/usePagination';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { L3ContentState } from '../../../../components/common/L3ContentState';

export interface DispatchExecutionItem {
  id: string;
  transferCode: string;
  sku: string;
  productName: string;
  category: string;
  uom: string;
  sourceWarehouse: string;
  fromBinLocation: string;
  destWarehouse: string;
  toBinLocation: string;
  lpnCode: string;
  barcode: string;
  requestedQty: number;
  actualShippedQty: number | null;
  actualReceivedQty: number | null;
  varianceQty: number;
  status: 'PENDING_DISPATCH' | 'DISPATCHED' | 'IN_TRANSIT' | 'RECEIVED' | 'DISCREPANCY';
  sealCondition: 'INTACT' | 'BROKEN' | 'NONE';
  operatorName: string;
  operatedAt: string;
  notes: string;
}

interface TransferDispatchExecutionTabProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  defaultTransferId?: string;
}

export const TransferDispatchExecutionTab: React.FC<TransferDispatchExecutionTabProps> = ({
  onNotify,
  defaultTransferId
}) => {
  const [selectedTransferCode, setSelectedTransferCode] = useState<string>('TRF-HN-HCM-2026-09A');
  const [deskMode, setDeskMode] = useState<'DISPATCH_OUT' | 'RECEIVE_IN'>('DISPATCH_OUT');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [binFilter, setBinFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempQty, setTempQty] = useState<string>('');

  // Confirm Dialog State (Rule #19)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const [items, setItems] = useState<DispatchExecutionItem[]>([
    {
      id: 'DEX-001',
      transferCode: 'TRF-HN-HCM-2026-09A',
      sku: 'SKU-ENG-088',
      productName: 'Động cơ servo AC 750W Delta',
      category: 'Động cơ & Biến tần',
      uom: 'Bộ',
      sourceWarehouse: 'Kho Tổng Hà Nội',
      fromBinLocation: 'BIN-A01-01',
      destWarehouse: 'Kho Chi nhánh Nam',
      toBinLocation: 'BIN-HCM-B01',
      lpnCode: 'LPN-2026-0881',
      barcode: '8936012345671',
      requestedQty: 20,
      actualShippedQty: 20,
      actualReceivedQty: null,
      varianceQty: 0,
      status: 'DISPATCHED',
      sealCondition: 'INTACT',
      operatorName: 'Nguyễn Văn Kiểm',
      operatedAt: '08/09/2026 14:15',
      notes: 'Đã đóng đai kiện gỗ pallet #P01'
    },
    {
      id: 'DEX-002',
      transferCode: 'TRF-HN-HCM-2026-09A',
      sku: 'SKU-PLC-102',
      productName: 'Bộ lập trình PLC Siemens S7-1200',
      category: 'Tự động hóa',
      uom: 'Bộ',
      sourceWarehouse: 'Kho Tổng Hà Nội',
      fromBinLocation: 'BIN-A01-02',
      destWarehouse: 'Kho Chi nhánh Nam',
      toBinLocation: 'BIN-HCM-B02',
      lpnCode: 'LPN-2026-0882',
      barcode: '8936012345672',
      requestedQty: 10,
      actualShippedQty: 10,
      actualReceivedQty: null,
      varianceQty: 0,
      status: 'DISPATCHED',
      sealCondition: 'INTACT',
      operatorName: 'Nguyễn Văn Kiểm',
      operatedAt: '08/09/2026 14:20',
      notes: 'Niêm phong chì bảo vệ linh kiện SMT'
    },
    {
      id: 'DEX-003',
      transferCode: 'TRF-HN-HCM-2026-09A',
      sku: 'SKU-SEN-305',
      productName: 'Cảm biến quang điện Panasonic',
      category: 'Thiết bị điện',
      uom: 'Cái',
      sourceWarehouse: 'Kho Tổng Hà Nội',
      fromBinLocation: 'BIN-A02-01',
      destWarehouse: 'Kho Chi nhánh Nam',
      toBinLocation: 'BIN-HCM-A01',
      lpnCode: 'LPN-2026-0883',
      barcode: '8936012345673',
      requestedQty: 50,
      actualShippedQty: 50,
      actualReceivedQty: null,
      varianceQty: 0,
      status: 'DISPATCHED',
      sealCondition: 'INTACT',
      operatorName: 'Trần Văn Nam',
      operatedAt: '08/09/2026 14:25',
      notes: 'Kiện túi chống tĩnh điện ESD'
    },
    {
      id: 'DEX-004',
      transferCode: 'TRF-HN-DN-2026-09B',
      sku: 'SKU-INV-204',
      productName: 'Biến tần Inverter 3 pha 380V Mitsubishi',
      category: 'Động cơ & Biến tần',
      uom: 'Cái',
      sourceWarehouse: 'Kho Tổng Hà Nội',
      fromBinLocation: 'BIN-A02-02',
      destWarehouse: 'Kho Đà Nẵng',
      toBinLocation: 'BIN-DN-A01',
      lpnCode: 'LPN-2026-0884',
      barcode: '8936012345674',
      requestedQty: 5,
      actualShippedQty: null,
      actualReceivedQty: null,
      varianceQty: 0,
      status: 'PENDING_DISPATCH',
      sealCondition: 'NONE',
      operatorName: 'Chưa xuất',
      operatedAt: '—',
      notes: 'Đang xếp hàng lên pallet xuất'
    },
    {
      id: 'DEX-005',
      transferCode: 'TRF-HN-DN-2026-09B',
      sku: 'SKU-VAL-012',
      productName: 'Van điện từ khí nén 24V SMC',
      category: 'Khí nén',
      uom: 'Cái',
      sourceWarehouse: 'Kho Tổng Hà Nội',
      fromBinLocation: 'BIN-B02-01',
      destWarehouse: 'Kho Đà Nẵng',
      toBinLocation: 'BIN-DN-B02',
      lpnCode: 'LPN-2026-0885',
      barcode: '8936012345675',
      requestedQty: 20,
      actualShippedQty: null,
      actualReceivedQty: null,
      varianceQty: 0,
      status: 'PENDING_DISPATCH',
      sealCondition: 'NONE',
      operatorName: 'Chưa xuất',
      operatedAt: '—',
      notes: ''
    }
  ]);

  // Filter items by active Transfer & User filters
  const currentTransferItems = useMemo(() => {
    return items.filter(it => it.transferCode === selectedTransferCode);
  }, [items, selectedTransferCode]);

  const filteredItems = useMemo(() => {
    return currentTransferItems.filter(it => {
      const matchSearch = 
        it.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        it.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        it.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        it.lpnCode.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchBin = binFilter === 'ALL' || it.fromBinLocation.includes(binFilter) || it.toBinLocation.includes(binFilter);
      const matchStatus = statusFilter === 'ALL' || it.status === statusFilter;

      return matchSearch && matchBin && matchStatus;
    });
  }, [currentTransferItems, searchQuery, binFilter, statusFilter]);

  // Pagination
  const pagination = usePagination({
    totalItems: filteredItems.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedItems = useMemo(() => {
    return pagination.paginatedData(filteredItems);
  }, [filteredItems, pagination]);

  // Metrics
  const totalSkusCount = currentTransferItems.length;
  const processedSkusCount = currentTransferItems.filter(it => 
    deskMode === 'DISPATCH_OUT' ? it.actualShippedQty !== null : it.actualReceivedQty !== null
  ).length;
  const discrepancySkusCount = currentTransferItems.filter(it => {
    if (deskMode === 'DISPATCH_OUT') {
      return it.actualShippedQty !== null && it.actualShippedQty !== it.requestedQty;
    } else {
      return it.actualReceivedQty !== null && it.actualReceivedQty !== (it.actualShippedQty || it.requestedQty);
    }
  }).length;
  const progressPercent = totalSkusCount > 0 ? Math.round((processedSkusCount / totalSkusCount) * 100) : 0;

  // Inline Edit Handlers
  const handleStartEdit = (item: DispatchExecutionItem) => {
    setEditingId(item.id);
    const initialVal = deskMode === 'DISPATCH_OUT' 
      ? (item.actualShippedQty !== null ? item.actualShippedQty.toString() : item.requestedQty.toString())
      : (item.actualReceivedQty !== null ? item.actualReceivedQty.toString() : (item.actualShippedQty || item.requestedQty).toString());
    setTempQty(initialVal);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTempQty('');
  };

  const handleSaveEdit = (item: DispatchExecutionItem) => {
    const parsed = parseInt(tempQty, 10);
    if (isNaN(parsed) || parsed < 0) {
      onNotify('warning', 'Giá trị không hợp lệ', 'Số lượng thực tế phải là số nguyên dương lớn hơn hoặc bằng 0.');
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setItems(prev => prev.map(it => {
      if (it.id === item.id) {
        if (deskMode === 'DISPATCH_OUT') {
          const varQty = parsed - it.requestedQty;
          return {
            ...it,
            actualShippedQty: parsed,
            varianceQty: varQty,
            status: varQty !== 0 ? 'DISCREPANCY' : 'DISPATCHED',
            operatorName: 'admin (KTV Kho)',
            operatedAt: now
          };
        } else {
          const expected = it.actualShippedQty !== null ? it.actualShippedQty : it.requestedQty;
          const varQty = parsed - expected;
          return {
            ...it,
            actualReceivedQty: parsed,
            varianceQty: varQty,
            status: varQty !== 0 ? 'DISCREPANCY' : 'RECEIVED',
            operatorName: 'admin (Thủ kho đích)',
            operatedAt: now
          };
        }
      }
      return it;
    }));

    setEditingId(null);
    setTempQty('');
    onNotify('success', 'Đã Ghi Nhận Số Lượng', `Cập nhật số lượng SKU ${item.sku} thành ${parsed} ${item.uom}.`);
  };

  // Barcode / QR Scan Handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    const found = currentTransferItems.find(it => it.barcode === query || it.sku.toLowerCase() === query.toLowerCase() || it.lpnCode.toLowerCase() === query.toLowerCase());
    if (found) {
      handleStartEdit(found);
      onNotify('info', 'Tìm Thấy Mã Vạch', `Đã tìm thấy SKU ${found.sku} (${found.productName}). Vui lòng nhập số lượng.`);
    } else {
      onNotify('warning', 'Không Tìm Thấy Mã', `Không có SKU hoặc mã vạch "${query}" trong lệnh ${selectedTransferCode}.`);
    }
    setBarcodeInput('');
  };

  // Bulk Auto-Match All (Rule #19)
  const handleAutoFillMatch = () => {
    const actionLabel = deskMode === 'DISPATCH_OUT' ? 'Xuất Kho Khớp 100%' : 'Nhận Hàng Khớp 100%';
    setConfirmDialog({
      isOpen: true,
      title: `Tự Động Điền ${actionLabel}?`,
      message: `Hành động này sẽ tự động gán toàn bộ số lượng ${deskMode === 'DISPATCH_OUT' ? 'thực xuất bằng số lượng yêu cầu' : 'thực nhận bằng số lượng đã xuất'} cho tất cả các dòng SKU chưa xử lý. Bạn có chắc chắn muốn thực hiện?`,
      confirmText: 'Xác Nhận Điền Tự Động',
      cancelText: 'Hủy Bỏ',
      variant: 'primary',
      onConfirm: () => {
        const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
        setItems(prev => prev.map(it => {
          if (it.transferCode === selectedTransferCode) {
            if (deskMode === 'DISPATCH_OUT') {
              return {
                ...it,
                actualShippedQty: it.requestedQty,
                varianceQty: 0,
                status: 'DISPATCHED',
                operatorName: 'admin (KTV Kho)',
                operatedAt: now
              };
            } else {
              return {
                ...it,
                actualReceivedQty: it.actualShippedQty || it.requestedQty,
                varianceQty: 0,
                status: 'RECEIVED',
                operatorName: 'admin (Thủ kho đích)',
                operatedAt: now
              };
            }
          }
          return it;
        }));
        setConfirmDialog(null);
        onNotify('success', 'Đã Khớp Số Lượng', `Toàn bộ ${totalSkusCount} dòng SKU đã được ghi nhận khớp 100%.`);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L1: COMMAND BAR & WORKBENCH SELECTOR                                      */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          {/* Active Transfer Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Lệnh:</span>
            <select
              value={selectedTransferCode}
              onChange={(e) => setSelectedTransferCode(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="TRF-HN-HCM-2026-09A" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono">TRF-HN-HCM-2026-09A (Hà Nội ➔ Nam)</option>
              <option value="TRF-HN-DN-2026-09B" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono">TRF-HN-DN-2026-09B (Hà Nội ➔ Đà Nẵng)</option>
            </select>
          </div>

          {/* Mode Toggle: Dispatch vs Receive */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setDeskMode('DISPATCH_OUT')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                deskMode === 'DISPATCH_OUT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Bàn Xuất Kho (Dispatch)</span>
            </button>
            <button
              onClick={() => setDeskMode('RECEIVE_IN')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                deskMode === 'RECEIVE_IN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Bàn Nhập Đích (Receiving)</span>
            </button>
          </div>

          {/* Instant Barcode Scanner Input */}
          <form onSubmit={handleBarcodeSubmit} className="relative flex-1 sm:w-64 min-w-[200px]">
            <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Quét Barcode / SKU / LPN..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-slate-900 dark:text-white"
            />
          </form>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Lọc tên SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAutoFillMatch}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Tự động ghi nhận khớp 100% tất cả dòng"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Khớp Đủ 100%</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: KPI METRIC STRIP (EXECUTION STATS)                                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Tổng Dòng SKU Cần Xử Lý */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng SKU Trong Lệnh
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
              {totalSkusCount} <span className="text-xs font-sans font-normal text-slate-500">SKU</span>
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
              Lệnh: {selectedTransferCode}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Đã Soát / Nhập Liệu Thực Tế */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {deskMode === 'DISPATCH_OUT' ? 'Đã Soát Xuất Kho' : 'Đã Soát Nhập Đích'}
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
              {processedSkusCount} / {totalSkusCount} <span className="text-xs font-sans font-normal text-slate-500">dòng</span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              Tiến độ: {progressPercent}%
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Phát Hiện Sai Lệch (Discrepancy) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Dòng Sai Lệch Chờ Xử Lý
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
              {discrepancySkusCount} <span className="text-xs font-sans font-normal text-slate-500">dòng</span>
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 font-medium">
              {discrepancySkusCount > 0 ? 'Cần đối soát Tab 3' : 'Khớp 100% chuẩn'}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Trạng Thái Niêm Phong (Seal Status) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tình Trạng Niêm Chì (Seal)
            </span>
            <div className="mt-1 text-lg font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="text-emerald-600 dark:text-emerald-400">INTACT</span>
              <span className="text-xs font-sans text-slate-500 font-normal">• SEAL-NX-88912</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Chế độ bàn: {deskMode === 'DISPATCH_OUT' ? 'Soát Xuất Kho' : 'Tiếp Nhận Đích'}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L3: INTERACTIVE DATA GRID WITH INLINE EDITING (ENTER / ESC / UOM)          */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <L3ContentState
          isLoading={false}
          isEmpty={paginatedItems.length === 0}
          emptyMessage="Không có dòng SKU nào trong phiên soát hàng này."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Mã SKU / Tên Sản Phẩm</th>
                  <th className="p-3">Mã Vạch / LPN</th>
                  <th className="p-3">Vị Trí Kệ (Xuất ➔ Nhận)</th>
                  <th className="p-3 text-center">ĐVT</th>
                  <th className="p-3 text-right">SL Yêu Cầu</th>
                  <th className="p-3 text-center">
                    {deskMode === 'DISPATCH_OUT' ? 'SL Thực Xuất (Inline)' : 'SL Thực Nhận (Inline)'}
                  </th>
                  <th className="p-3 text-right">Chênh Lệch</th>
                  <th className="p-3 text-center">Trạng Thái</th>
                  <th className="p-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {paginatedItems.map((item, idx) => {
                  const globalIdx = (pagination.currentPage - 1) * pagination.pageSize + idx + 1;
                  const isEditing = editingId === item.id;
                  const currentActual = deskMode === 'DISPATCH_OUT' ? item.actualShippedQty : item.actualReceivedQty;
                  const hasDiscrepancy = item.varianceQty !== 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 ${
                        hasDiscrepancy ? 'border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20' :
                        currentActual !== null ? 'border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10' :
                        'border-l-4 border-transparent'
                      }`}
                    >
                      {/* STT */}
                      <td className="p-3 text-center font-mono font-bold text-slate-500">
                        {globalIdx}
                      </td>

                      {/* SKU & Tên */}
                      <td className="p-3">
                        <div className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          {item.sku}
                        </div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-white mt-0.5">
                          {item.productName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.category}
                        </div>
                      </td>

                      {/* Mã Vạch / LPN */}
                      <td className="p-3">
                        <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {item.barcode}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {item.lpnCode}
                        </div>
                      </td>

                      {/* Tuyến Bin */}
                      <td className="p-3">
                        <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{item.fromBinLocation}</span>
                        </div>
                        <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                          <CornerDownRight className="w-3 h-3 text-blue-500" />
                          <span>{item.toBinLocation}</span>
                        </div>
                      </td>

                      {/* ĐVT */}
                      <td className="p-3 text-center font-semibold text-xs text-slate-700 dark:text-slate-300">
                        {item.uom}
                      </td>

                      {/* SL Yêu Cầu */}
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white">
                        {item.requestedQty}
                      </td>

                      {/* Ô Nhập Liệu Thực Xuất / Thực Nhận (Inline Editing Chuẩn) */}
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-lg border border-blue-400 dark:border-blue-500 shadow-xs">
                            <input
                              type="number"
                              min="0"
                              value={tempQty}
                              onChange={(e) => setTempQty(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(item);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              autoFocus
                              className="w-20 px-2 py-1 text-xs font-mono font-bold text-center text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 pr-1">
                              {item.uom}
                            </span>
                            <button
                              onClick={() => handleSaveEdit(item)}
                              className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors cursor-pointer"
                              title="Lưu (Enter)"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition-colors cursor-pointer"
                              title="Hủy (Escape)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => handleStartEdit(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-blue-50 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg cursor-pointer transition-colors border border-dashed border-slate-300 dark:border-slate-600"
                            title="Bấm để sửa nhanh số lượng"
                          >
                            <span className="font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white">
                              {currentActual !== null ? `${currentActual}` : 'Chưa nhập'}
                            </span>
                            <Edit3 className="w-3 h-3 text-slate-400 hover:text-blue-600" />
                          </div>
                        )}
                      </td>

                      {/* Chênh Lệch */}
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-xs">
                        {currentActual !== null ? (
                          <span className={
                            item.varianceQty < 0 ? 'text-rose-600 dark:text-rose-400' :
                            item.varianceQty > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                            'text-slate-500'
                          }>
                            {item.varianceQty > 0 ? `+${item.varianceQty}` : item.varianceQty} {item.uom}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Trạng Thái Badge */}
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 text-[10px] rounded-full border font-bold inline-flex items-center gap-1 ${
                          item.status === 'DISPATCHED' || item.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200' :
                          item.status === 'DISCREPANCY' ? 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200' :
                          'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200'
                        }`}>
                          {item.status === 'DISCREPANCY' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                          <span>{item.status}</span>
                        </span>
                      </td>

                      {/* Thao Tác */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Sửa Số Lượng</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </L3ContentState>

        {/* L4: STICKY FOOTER */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <PaginationControl
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={filteredItems.length}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            onPageChange={pagination.goToPage}
            onPageSizeChange={pagination.setPageSize}
            pageSizeOptions={[5, 10, 20, 50, 100]}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG (RULE #19 COMPLIANCE)                                      */}
      {/* ========================================================================= */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
};
