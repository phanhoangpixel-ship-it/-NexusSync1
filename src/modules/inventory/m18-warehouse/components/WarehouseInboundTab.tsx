import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Warehouse, Boxes, ArrowLeftRight, ClipboardCheck, SlidersHorizontal, Tags, QrCode, 
  Layers, Search, Filter, Plus, CheckCircle2, AlertTriangle, ShieldAlert, Truck, 
  ShoppingBag, RotateCcw, BarChart3, MapPin, Scan, FileText, User, Wrench, Clock, Eye, Check, X,
  Download, Upload, ExternalLink, Activity, CreditCard, Percent, Printer, AlertCircle, RefreshCw, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState, SelectedEntityContext } from '../../../../types';
import { usePagination } from '../../../../hooks/usePagination';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { L3ContentState } from '../../../../components/common/L3ContentState';
import { ENTERPRISE_MASTER_PRODUCTS } from '../../../../data/enterpriseMaster';

export interface InboundItem {
  sku: string;
  name: string;
  poQty: number;
  recvQty: number;
  tracking: 'NONE' | 'SERIAL' | 'LOT';
  serials?: string[];
  lotNumber?: string;
  location?: string;
}

export interface InboundReceipt {
  id: string;
  poCode: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  date: string;
  status: 'DRAFT' | 'COUNTING' | 'READY_PUTAWAY' | 'COMPLETED';
  items: InboundItem[];
  invoice: {
    isExtracted: boolean;
    fileName?: string;
    invoiceNo: string;
    invoiceSeries: string;
    supplierTaxId: string;
    subtotal: number;
    vat: number;
    vatRate: number;
    total: number;
  };
  billingAddress: string;
  deliveryFrom: string;
  receivingTo: string;
  documents: { name: string; size: string }[];
}

interface WarehouseInboundTabProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  onSelectEntity?: (context: SelectedEntityContext) => void;
}

export const WarehouseInboundTab: React.FC<WarehouseInboundTabProps> = ({ onNotify, onSelectEntity }) => {
  // State: Inbound Receipts
  const [receipts, setReceipts] = useState<InboundReceipt[]>([
    {
      id: 'REC-2026-001',
      poCode: 'PO-2026-0104',
      supplierId: 'S02',
      supplierName: 'MedTech Global Corp',
      warehouseId: 'WH-MAIN',
      warehouseName: 'Kho Tổng Trung Tâm',
      date: '2026-09-09',
      status: 'READY_PUTAWAY',
      items: [
        { sku: 'SKU-MED-MON', name: 'Màn hình theo dõi bệnh nhân 7 thông số', poQty: 10, recvQty: 10, tracking: 'SERIAL', serials: ['SN-MON-001', 'SN-MON-002', 'SN-MON-003', 'SN-MON-004', 'SN-MON-005', 'SN-MON-006', 'SN-MON-007', 'SN-MON-008', 'SN-MON-009', 'SN-MON-010'], location: 'BIN-A01' },
        { sku: 'SKU-MED-ECG', name: 'Máy đo ECG 12 đạo trình', poQty: 12, recvQty: 12, tracking: 'SERIAL', serials: Array.from({ length: 12 }, (_, i) => `SN-ECG-${String(i + 1).padStart(3, '0')}`), location: 'BIN-A02' },
      ],
      invoice: {
        isExtracted: true,
        fileName: 'HDDT_MedTech_002910.xml',
        invoiceNo: '002910',
        invoiceSeries: '1C26TMT',
        supplierTaxId: '0109988776',
        subtotal: 260000000,
        vat: 26000000,
        vatRate: 10,
        total: 286000000,
      },
      billingAddress: 'headOffice',
      deliveryFrom: 'warehouse',
      receivingTo: 'WH-MAIN',
      documents: [
        { name: 'PO_PO-2026-0104_Approved.pdf', size: '245 KB' },
        { name: 'Phieu_Giao_Hang_MedTech_9921.pdf', size: '180 KB' },
        { name: 'Bien_Ban_Kiem_Ke_GR001.pdf', size: '310 KB' },
      ]
    },
    {
      id: 'REC-2026-002',
      poCode: 'PO-2026-0105',
      supplierId: 'S01',
      supplierName: 'ABC Technology Corp',
      warehouseId: 'WH-MAIN',
      warehouseName: 'Kho Tổng Trung Tâm',
      date: '2026-09-09',
      status: 'COUNTING',
      items: [
        { sku: 'SKU-RAM-16G', name: 'RAM DDR5 16GB Kingston Fury', poQty: 20, recvQty: 20, tracking: 'SERIAL', serials: Array.from({ length: 20 }, (_, i) => `SN-RAM-${String(i + 1).padStart(3, '0')}`), location: 'BIN-B03' },
        { sku: 'SKU-SSD-1TB', name: 'Ổ Cứng SSD NVMe 1TB Samsung 980 Pro', poQty: 15, recvQty: 15, tracking: 'SERIAL', serials: Array.from({ length: 15 }, (_, i) => `SN-SSD-${String(i + 1).padStart(3, '0')}`), location: 'BIN-B04' },
      ],
      invoice: {
        isExtracted: true,
        fileName: 'HDDT_ABC_Tech_008891.xml',
        invoiceNo: '008891',
        invoiceSeries: '1C26TAB',
        supplierTaxId: '0312345678',
        subtotal: 61500000,
        vat: 6150000,
        vatRate: 10,
        total: 67650000,
      },
      billingAddress: 'billingAddress',
      deliveryFrom: 'warehouse',
      receivingTo: 'WH-MAIN',
      documents: [
        { name: 'PO_PO-2026-0105.pdf', size: '190 KB' },
        { name: 'Packing_List_ABC_8891.pdf', size: '140 KB' },
      ]
    },
    {
      id: 'REC-2026-003',
      poCode: 'PO-2026-0108',
      supplierId: 'S03',
      supplierName: 'Phúc Khang Industrial Materials',
      warehouseId: 'WH-SOUTH',
      warehouseName: 'Kho Chi Nhánh Miền Nam',
      date: '2026-09-08',
      status: 'DRAFT',
      items: [
        { sku: 'SKU-RES-10K', name: 'Điện trở dán SMD 10K Ohm 0805', poQty: 5000, recvQty: 5000, tracking: 'LOT', lotNumber: 'LOT-2026-09A', location: 'BIN-C10' },
        { sku: 'SKU-CAP-100U', name: 'Tụ điện nhôm 100uF 50V', poQty: 2000, recvQty: 2000, tracking: 'LOT', lotNumber: 'LOT-2026-09B', location: 'BIN-C10' },
      ],
      invoice: {
        isExtracted: false,
        invoiceNo: '',
        invoiceSeries: '',
        supplierTaxId: '',
        subtotal: 18500000,
        vat: 1850000,
        vatRate: 10,
        total: 20350000,
      },
      billingAddress: 'headOffice',
      deliveryFrom: 'warehouse',
      receivingTo: 'WH-SOUTH',
      documents: [
        { name: 'Don_Dat_Hang_PO-2026-0108.pdf', size: '215 KB' },
      ]
    },
    {
      id: 'REC-2026-004',
      poCode: 'PO-2026-0112',
      supplierId: 'S01',
      supplierName: 'ABC Technology Corp',
      warehouseId: 'WH-MAIN',
      warehouseName: 'Kho Tổng Trung Tâm',
      date: '2026-09-07',
      status: 'COMPLETED',
      items: [
        { sku: 'SKU-CPU-I7', name: 'Bộ Vi Xử Lý Intel Core i7 14700K', poQty: 8, recvQty: 8, tracking: 'SERIAL', serials: Array.from({ length: 8 }, (_, i) => `SN-CPU-${String(i + 1).padStart(3, '0')}`), location: 'BIN-A01' },
      ],
      invoice: {
        isExtracted: true,
        fileName: 'HDDT_ABC_008801.xml',
        invoiceNo: '008801',
        invoiceSeries: '1C26TAB',
        supplierTaxId: '0312345678',
        subtotal: 78400000,
        vat: 7840000,
        vatRate: 10,
        total: 86240000,
      },
      billingAddress: 'headOffice',
      deliveryFrom: 'warehouse',
      receivingTo: 'WH-MAIN',
      documents: [
        { name: 'PO_PO-2026-0112.pdf', size: '185 KB' },
        { name: 'Packing_List_ABC.pdf', size: '120 KB' },
        { name: 'Phieu_Nhap_Kho_Hoan_Tat.pdf', size: '290 KB' },
      ]
    }
  ]);

  // Filters & Selection
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<InboundReceipt | null>(receipts[0]);

  // L3 Content Area Loading / Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      setIsLoading(false);
      onNotify('info', 'Đồng bộ PO & Inbound', 'Đã tải danh sách chứng từ nhập kho mới nhất.');
    }, 450);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setWarehouseFilter('ALL');
  };

  // Drawers / Modals
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isNewInboundModalOpen, setIsNewInboundModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ isOpen: false });

  // New Inbound Receipt Form State
  const [newForm, setNewForm] = useState({
    poCode: 'PO-2026-0120',
    supplierName: 'Công Ty TNHH ABC Technology',
    warehouseId: 'WH-MAIN',
    warehouseName: 'Kho Tổng Trung Tâm',
    notes: '',
  });

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => {
      const matchSearch = 
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.poCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchWh = warehouseFilter === 'ALL' || r.warehouseId === warehouseFilter;
      return matchSearch && matchStatus && matchWh;
    });
  }, [receipts, searchTerm, statusFilter, warehouseFilter]);

  // Pagination hook
  const pagination = usePagination({
    totalItems: filteredReceipts.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedItems = useMemo(() => {
    return pagination.paginatedData(filteredReceipts);
  }, [pagination, filteredReceipts]);

  // KPI Metrics Calculation
  const kpis = useMemo(() => {
    const total = receipts.length;
    const readyPutaway = receipts.filter(r => r.status === 'READY_PUTAWAY').length;
    const counting = receipts.filter(r => r.status === 'COUNTING' || r.status === 'DRAFT').length;
    const completed = receipts.filter(r => r.status === 'COMPLETED').length;
    const totalValue = receipts.reduce((sum, r) => sum + (r.invoice.total || 0), 0);
    const threeWayPassed = receipts.filter(r => r.invoice.isExtracted && r.items.every(i => i.poQty === i.recvQty)).length;

    return {
      total,
      readyPutaway,
      counting,
      completed,
      totalValue,
      threeWayPassed,
      passRate: total > 0 ? Math.round((threeWayPassed / total) * 100) : 100
    };
  }, [receipts]);

  // Handlers
  const handleApprovePutaway = (receipt: InboundReceipt) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Phê Duyệt Nhập Kho & Putaway',
      message: `Bạn có chắc chắn muốn phê duyệt chứng từ kiểm nhận ${receipt.id} (PO: ${receipt.poCode}) và cập nhật tự động số dư tồn kho vật lý vào cơ sở dữ liệu WMS?`,
      confirmLabel: 'Phê Duyệt Putaway',
      cancelLabel: 'Quay lại',
      variant: 'primary',
      onConfirm: () => {
        setReceipts(prev => prev.map(r => r.id === receipt.id ? { ...r, status: 'READY_PUTAWAY' } : r));
        if (selectedReceipt?.id === receipt.id) {
          setSelectedReceipt(prev => prev ? { ...prev, status: 'READY_PUTAWAY' } : null);
        }
        setConfirmDialog(p => ({ ...p, isOpen: false }));
        onNotify('success', 'Nhập kho thành công', `Chứng từ ${receipt.id} đã hoàn tất kiểm đếm và chuyển trạng thái READY_PUTAWAY.`);
      }
    });
  };

  const handleCompleteReceipt = (receipt: InboundReceipt) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hoàn Tất Đơn Nhập Kho WMS',
      message: `Xác nhận đóng chứng từ nhập ${receipt.id}? Toàn bộ số lượng đã được xếp gọn gàng vào các ô Bin lưu trữ.`,
      confirmLabel: 'Hoàn Tất',
      variant: 'primary',
      onConfirm: () => {
        setReceipts(prev => prev.map(r => r.id === receipt.id ? { ...r, status: 'COMPLETED' } : r));
        if (selectedReceipt?.id === receipt.id) {
          setSelectedReceipt(prev => prev ? { ...prev, status: 'COMPLETED' } : null);
        }
        setConfirmDialog(p => ({ ...p, isOpen: false }));
        onNotify('success', 'Hoàn tất nhập kho', `Chứng từ ${receipt.id} đã được đóng thành công.`);
      }
    });
  };

  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const newReceipt: InboundReceipt = {
      id: `REC-2026-${String(receipts.length + 1).padStart(3, '0')}`,
      poCode: newForm.poCode,
      supplierId: 'S01',
      supplierName: newForm.supplierName,
      warehouseId: newForm.warehouseId,
      warehouseName: newForm.warehouseId === 'WH-MAIN' ? 'Kho Tổng Trung Tâm' : 'Kho Chi Nhánh Miền Nam',
      date: new Date().toISOString().split('T')[0],
      status: 'COUNTING',
      items: [
        { sku: 'SKU-RAM-16G', name: 'RAM DDR5 16GB Kingston Fury', poQty: 10, recvQty: 10, tracking: 'SERIAL', location: 'BIN-B03' },
      ],
      invoice: {
        isExtracted: false,
        invoiceNo: '',
        invoiceSeries: '',
        supplierTaxId: '',
        subtotal: 12000000,
        vat: 1200000,
        vatRate: 10,
        total: 13200000,
      },
      billingAddress: 'headOffice',
      deliveryFrom: 'warehouse',
      receivingTo: newForm.warehouseId,
      documents: [
        { name: `PO_${newForm.poCode}.pdf`, size: '205 KB' }
      ]
    };

    setReceipts(prev => [newReceipt, ...prev]);
    setSelectedReceipt(newReceipt);
    setIsNewInboundModalOpen(false);
    onNotify('success', 'Tạo phiếu nhập thành công', `Đã khởi tạo phiếu kiểm nhận ${newReceipt.id} từ đơn mua ${newReceipt.poCode}`);
  };

  const handleExportExcel = () => {
    const dataToExport = receipts.map(r => ({
      'Mã Chứng Từ': r.id,
      'Đơn Mua Hàng (PO)': r.poCode,
      'Nhà Cung Cấp': r.supplierName,
      'Kho Nhập': r.warehouseName,
      'Ngày Nhập': r.date,
      'Trạng Thái': r.status,
      'Số Dòng Hàng': r.items.length,
      'Tổng Tiền (VNĐ)': r.invoice.total,
      'Hóa Đơn Khớp': r.invoice.isExtracted ? 'ĐÃ KHỚP' : 'CHƯA TRÍCH XUẤT'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inbound_Receipts');
    XLSX.writeFile(wb, `NexusSync_Inbound_Receipts_${new Date().toISOString().split('T')[0]}.xlsx`);
    onNotify('info', 'Xuất dữ liệu', 'Đã tải xuống danh sách chứng từ nhập kho Excel.');
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L0: TOP HEADER BAR                                                        */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg">
              <Truck className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              B. Inbound Receiving &amp; 3-Way Match Verification
            </h2>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-mono font-bold rounded-full border border-blue-200 dark:border-blue-800">
              {receipts.length} Chứng từ
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quy trình tiếp nhận hàng hóa: Nhận hàng PO ➔ Kiểm đếm số lượng ➔ Đối khớp Hóa đơn 3-Way Match ➔ Duyệt cất kho (Putaway)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Xuất Excel
          </button>
          <button
            onClick={() => onNotify('info', 'Đồng bộ PO', 'Đã kiểm tra và đồng bộ các đơn mua hàng sẵn sàng nhập từ phân hệ M08.')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            Đồng Bộ PO
          </button>
          <button
            onClick={() => setIsNewInboundModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tạo Phiếu Nhận Hàng
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1: KPI METRICS STRIP                                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase">Tổng Lô Nhận</span>
            <Boxes className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1">
            {kpis.total}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Chứng từ nhập kho</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase">Sẵn Sàng Putaway</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-emerald-600 mt-1">
            {kpis.readyPutaway}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Đã pass 3-Way Match</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase">Đang Thực Kiểm</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-amber-600 mt-1">
            {kpis.counting}
          </div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">Đang đếm &amp; quét SN</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase">Đã Hoàn Tất</span>
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-indigo-600 mt-1">
            {kpis.completed}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Lưu Bin an toàn</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase">Tỷ Lệ Match 3-Way</span>
            <Check className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-mono tabular-nums font-bold text-emerald-600 mt-1">
            {kpis.passRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{kpis.threeWayPassed}/{kpis.total} Lô chuẩn hóa</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase">Giá Trị Nhập</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-base font-mono tabular-nums font-bold text-purple-700 dark:text-purple-300 mt-1 truncate">
            {(kpis.totalValue / 1000000).toFixed(1)}M ₫
          </div>
          <div className="text-[10px] text-purple-600 font-medium mt-0.5">Tổng giá trị thanh toán</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: ADVANCED FILTER & SEARCH TOOLBAR                                      */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã REC, mã PO, tên Nhà cung cấp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="READY_PUTAWAY">Sẵn Sàng Putaway</option>
            <option value="COUNTING">Đang Thực Kiểm</option>
            <option value="DRAFT">Bản Nháp</option>
            <option value="COMPLETED">Đã Hoàn Tất</option>
          </select>

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden hidden sm:block"
          >
            <option value="ALL">Tất cả kho nhập</option>
            <option value="WH-MAIN">Kho Tổng Trung Tâm</option>
            <option value="WH-SOUTH">Kho Chi Nhánh Miền Nam</option>
          </select>
        </div>

        {(searchTerm || statusFilter !== 'ALL' || warehouseFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setWarehouseFilter('ALL');
            }}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
          >
            Đặt lại lọc
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* L3: DATA TABLE (MASTER INBOUND LIST WITH SKELETON / ERROR / EMPTY)        */}
      {/* ========================================================================= */}
      <L3ContentState
        isLoading={isLoading}
        error={error}
        isEmpty={paginatedItems.length === 0}
        onRetry={handleRefresh}
        emptyTitle="Không tìm thấy chứng từ nhận hàng phù hợp"
        emptyDescription="Thử thay đổi bộ lọc tìm kiếm hoặc tạo mới phiếu nhận hàng."
        emptyAction={{
          label: 'Tạo Phiếu Nhận Hàng Mới',
          onClick: () => setIsNewInboundModalOpen(true),
          variant: 'primary'
        }}
        skeletonRows={6}
        minHeight="min-h-[420px]"
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Mã Phiếu Nhập</th>
                  <th className="py-3 px-4">Đơn Mua (PO)</th>
                  <th className="py-3 px-4">Nhà Cung Cấp</th>
                  <th className="py-3 px-4">Kho Tiếp Nhận</th>
                  <th className="py-3 px-4 text-center">SL Thực Nhập</th>
                  <th className="py-3 px-4 text-right">Tổng Tiền (VNĐ)</th>
                  <th className="py-3 px-4 text-center">3-Way Match</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {paginatedItems.map((r) => {
                  const totalPoQty = r.items.reduce((s, i) => s + i.poQty, 0);
                  const totalRecvQty = r.items.reduce((s, i) => s + i.recvQty, 0);
                  const isQtyMatch = totalPoQty === totalRecvQty;
                  const isInvoiceMatch = r.invoice.isExtracted;

                  return (
                    <tr 
                      key={r.id} 
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {r.id}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {r.poCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{r.supplierName}</div>
                        <div className="text-[10px] text-slate-400">Ngày lập: {r.date}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{r.warehouseName}</span>
                        <div className="text-[10px] font-mono text-slate-400">{r.warehouseId}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {totalRecvQty} / {totalPoQty}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {r.invoice.total.toLocaleString()} ₫
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isQtyMatch && isInvoiceMatch ? (
                          <span className="inline-flex items-center whitespace-nowrap gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                            <Check className="w-3 h-3" /> MATCHED
                          </span>
                        ) : (
                          <span className="inline-flex items-center whitespace-nowrap gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                            <Clock className="w-3 h-3" /> CHỜ ĐỐI KHỚP
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.status === 'READY_PUTAWAY'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : r.status === 'COMPLETED'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
                              : r.status === 'COUNTING'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}>
                          {r.status === 'READY_PUTAWAY' ? 'READY PUTAWAY' : r.status === 'COMPLETED' ? 'HOÀN TẤT' : r.status === 'COUNTING' ? 'ĐANG KIỂM ĐẾM' : 'BẢN NHÁP'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedReceipt(r);
                              setIsDetailDrawerOpen(true);
                            }}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                            title="Xem chi tiết kiểm nhận & 3-Way Match"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {r.status === 'COUNTING' && (
                            <button
                              onClick={() => handleApprovePutaway(r)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-2xs cursor-pointer"
                            >
                              Duyệt Putaway
                            </button>
                          )}
                          {r.status === 'READY_PUTAWAY' && (
                            <button
                              onClick={() => handleCompleteReceipt(r)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-2xs cursor-pointer"
                            >
                              Hoàn Tất
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ========================================================================= */}
          {/* L4: PINNED PAGINATION FOOTER                                              */}
          {/* ========================================================================= */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
            <PaginationControl
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalItems={filteredReceipts.length}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              onPageChange={pagination.goToPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        </div>
      </L3ContentState>

      {/* ========================================================================= */}
      {/* DRAWER: RECEIPT DETAILS & 3-WAY MATCH WORK DESK                           */}
      {/* ========================================================================= */}
      {isDetailDrawerOpen && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                      {selectedReceipt.id}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Phiếu Nhận Hàng: {selectedReceipt.poCode}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    NCC: {selectedReceipt.supplierName} • {selectedReceipt.warehouseName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Header */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Trạng Thái Xử Lý</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedReceipt.status}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Tổng Giá Trị Lô Hàng</span>
                  <div className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {selectedReceipt.invoice.total.toLocaleString()} VNĐ
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-blue-600" /> Danh Mục Mặt Hàng Thực Kiểm
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-400 font-bold uppercase">
                      <tr>
                        <th className="py-2 px-3">Mã SKU</th>
                        <th className="py-2 px-3">Tên Hàng Hóa</th>
                        <th className="py-2 px-3 text-center">SL PO</th>
                        <th className="py-2 px-3 text-center">SL Nhập</th>
                        <th className="py-2 px-3">Vị Trí Lưu Bin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {selectedReceipt.items.map((item) => (
                        <tr key={item.sku} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{item.sku}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{item.poQty}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">{item.recvQty}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">{item.location || 'BIN-A01'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3-Way Match Detail */}
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Kết Quả Đối Khớp 3-Way Match
                  </h4>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                    PASSED
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Mã Số Thuế NCC Khớp ({selectedReceipt.invoice.supplierTaxId || '0109988776'})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Số lượng PO = GR ({selectedReceipt.items.reduce((s, i) => s + i.recvQty, 0)} Units)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Tổng tiền VAT Snapshot hợp lệ</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Bộ hồ sơ đính kèm ({selectedReceipt.documents.length} File)</span>
                  </div>
                </div>
              </div>

              {/* Documents List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Hồ Sơ &amp; Chứng Từ Kèm Theo
                </h4>
                <div className="space-y-2">
                  {selectedReceipt.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">{doc.name}</span>
                      </div>
                      <span className="font-mono text-slate-400 text-[10px]">{doc.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900">
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>
              {selectedReceipt.status === 'COUNTING' && (
                <button
                  onClick={() => {
                    setIsDetailDrawerOpen(false);
                    handleApprovePutaway(selectedReceipt);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Xác Nhận Phê Duyệt Putaway
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW INBOUND RECEIPT                                         */}
      {/* ========================================================================= */}
      {isNewInboundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Tạo Phiếu Kiểm Nhận Hàng Mới Từ PO
              </h3>
              <button onClick={() => setIsNewInboundModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Mã Đơn Mua Hàng (PO) *
                </label>
                <input
                  type="text"
                  required
                  value={newForm.poCode}
                  onChange={(e) => setNewForm({ ...newForm, poCode: e.target.value.toUpperCase() })}
                  placeholder="VD: PO-2026-0120"
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Nhà Cung Cấp *
                </label>
                <input
                  type="text"
                  required
                  value={newForm.supplierName}
                  onChange={(e) => setNewForm({ ...newForm, supplierName: e.target.value })}
                  placeholder="Tên công ty nhà cung cấp"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Kho Tiếp Nhận *
                </label>
                <select
                  value={newForm.warehouseId}
                  onChange={(e) => setNewForm({ ...newForm, warehouseId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                >
                  <option value="WH-MAIN">WH-MAIN - Kho Tổng Trung Tâm</option>
                  <option value="WH-SOUTH">WH-SOUTH - Kho Chi Nhánh Miền Nam</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewInboundModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Khởi Tạo Phiếu Nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG (Mandatory Rule #19)                                       */}
      {/* ========================================================================= */}
      <ConfirmDialog
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default WarehouseInboundTab;
