import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, Truck, Package, Search, Filter, Plus, Printer, CheckCircle2, 
  Clock, AlertCircle, ArrowUpRight, FileSpreadsheet, Eye, Send, CheckSquare,
  Layers, QrCode, Scan, ArrowRight, User, Check, X, ShieldAlert, AlertTriangle,
  RotateCcw, RefreshCw, BarChart3, MapPin, FileText, Download, Building2, Tag,
  ExternalLink, Hash, Calendar, DollarSign, Archive, Navigation
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { EnterpriseTable, ColumnDef } from '../common/EnterpriseTable';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ConfirmDialogState, SelectedEntityContext } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import { PaginationControl } from '../common/PaginationControl';
import { L3ContentState } from '../common/L3ContentState';
import { ENTERPRISE_MASTER_PRODUCTS } from '../../data/enterpriseMaster';

export interface OutboundOrderItem {
  sku: string;
  name: string;
  orderedQty: number;
  pickedQty: number;
  unit: string;
  sourceBin: string;
  lotNumber?: string;
  serialNumbers?: string[];
  unitPrice: number;
  totalAmount: number;
  status: 'PENDING' | 'PICKED' | 'PACKED';
}

export interface OutboundOrder {
  id: string;
  orderNo: string;
  referenceNo: string; // SO / WO ref
  customerName: string;
  customerPhone: string;
  warehouseCode: string;
  warehouseName: string;
  destination: string;
  carrierName: string;
  trackingCode?: string;
  driverName?: string;
  licensePlate?: string;
  itemCount: number;
  totalQty: number;
  totalAmount: number;
  status: 'PENDING_PICK' | 'ALLOCATED' | 'PICKING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  priority: 'NORMAL' | 'URGENT' | 'VIP';
  createdDate: string;
  scheduledDate: string;
  shippedDate?: string;
  operator: string;
  items: OutboundOrderItem[];
  waveId?: string;
  notes?: string;
}

export interface WavePickingBatch {
  id: string;
  waveNo: string;
  warehouseCode: string;
  zone: string;
  assignedTo: string;
  orderCount: number;
  totalSkus: number;
  totalUnits: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  startTime: string;
  completedTime?: string;
  orderIds: string[];
}

export interface PackingCarton {
  id: string;
  cartonNo: string;
  orderNo: string;
  customerName: string;
  weightKg: number;
  dimensionsCm: string;
  trackingCode: string;
  carrier: string;
  sealNumber: string;
  status: 'OPEN' | 'SEALED' | 'DISPATCHED';
  packedBy: string;
  packedDate: string;
}

const mockOutboundOrders: OutboundOrder[] = [
  {
    id: 'OUT-2026-001',
    orderNo: 'WMS-OUT-9001',
    referenceNo: 'SO-2026-9912',
    customerName: 'Bệnh Viện Đa Khoa Quốc Tế Hoà Mỹ',
    customerPhone: '0903 123 456',
    warehouseCode: 'WH-HCM-01',
    warehouseName: 'Kho Tổng Trung Tâm (TP.HCM)',
    destination: 'Số 124 Nguyễn Văn Linh, P. Tân Thuận, Quận 7, TP. Hồ Chí Minh',
    carrierName: 'Đội Xe Tải Nội Bộ (Nexus Fleet)',
    trackingCode: 'NEX-FL-0891',
    driverName: 'Trần Văn Tải',
    licensePlate: '51C-889.21',
    itemCount: 2,
    totalQty: 15,
    totalAmount: 375000000,
    status: 'PENDING_PICK',
    priority: 'URGENT',
    createdDate: '09/09/2026 08:30',
    scheduledDate: '10/09/2026 14:00',
    operator: 'Nguyễn Văn Kho',
    waveId: 'WAVE-2026-001',
    notes: 'Đơn hàng thiết bị CNTT y tế khẩn cấp, yêu cầu đóng thùng xốp chống sốc.',
    items: [
      {
        sku: 'PRD-001',
        name: 'Laptop Business 14" Core i7 16GB/512GB',
        orderedQty: 10,
        pickedQty: 0,
        unit: 'Cái',
        sourceBin: 'BIN-A01-R01-S01',
        lotNumber: 'LOT-2026-IT-01',
        serialNumbers: ['SN-LP-99101', 'SN-LP-99102', 'SN-LP-99103'],
        unitPrice: 25000000,
        totalAmount: 250000000,
        status: 'PENDING'
      },
      {
        sku: 'PRD-002',
        name: 'Màn hình Monitor 27" 4K IPS Pro',
        orderedQty: 5,
        pickedQty: 0,
        unit: 'Cái',
        sourceBin: 'BIN-A02-R01-S03',
        lotNumber: 'LOT-2026-IT-02',
        unitPrice: 25000000,
        totalAmount: 125000000,
        status: 'PENDING'
      }
    ]
  },
  {
    id: 'OUT-2026-002',
    orderNo: 'WMS-OUT-9002',
    referenceNo: 'WO-2026-1182',
    customerName: 'Xưởng Sản Xuất Thiết Bị Điện Tử Số 1 (Bình Dương)',
    customerPhone: '0912 345 678',
    warehouseCode: 'WH-HCM-01',
    warehouseName: 'Kho Tổng Trung Tâm (TP.HCM)',
    destination: 'Lô C2, Đường Số 3, KCN VSIP 1, Thuận An, Bình Dương',
    carrierName: 'Viettel Post Logistics',
    trackingCode: 'VT-88291039-VN',
    driverName: 'Lê Hoàng Nam',
    licensePlate: '61B-129.45',
    itemCount: 3,
    totalQty: 120,
    totalAmount: 154000000,
    status: 'PICKING',
    priority: 'NORMAL',
    createdDate: '09/09/2026 09:15',
    scheduledDate: '10/09/2026 16:30',
    operator: 'Trần Văn Nhặt',
    waveId: 'WAVE-2026-001',
    notes: 'Xuất linh kiện phục vụ lệnh sản xuất WO-1182.',
    items: [
      {
        sku: 'PRD-003',
        name: 'Bàn phím cơ chuyên dụng Mechanical Pro',
        orderedQty: 50,
        pickedQty: 50,
        unit: 'Cái',
        sourceBin: 'BIN-B01-R02-S01',
        lotNumber: 'LOT-KB-2026-03',
        unitPrice: 800000,
        totalAmount: 40000000,
        status: 'PICKED'
      },
      {
        sku: 'PRD-004',
        name: 'Chuột không dây công thái học Wireless Mouse',
        orderedQty: 70,
        pickedQty: 30,
        unit: 'Cái',
        sourceBin: 'BIN-B01-R02-S02',
        lotNumber: 'LOT-MS-2026-01',
        unitPrice: 400000,
        totalAmount: 28000000,
        status: 'PENDING'
      }
    ]
  },
  {
    id: 'OUT-2026-003',
    orderNo: 'WMS-OUT-9003',
    referenceNo: 'SO-2026-9884',
    customerName: 'Công Ty Cổ Phần Viễn Thông Miền Bắc',
    customerPhone: '0988 776 655',
    warehouseCode: 'WH-HN-02',
    warehouseName: 'Kho Vận Trung Chuyển (Hà Nội)',
    destination: 'Tòa nhà HITC, Số 239 Xuân Thủy, Cầu Giấy, Hà Nội',
    carrierName: 'Giao Hàng Nhanh (GHN Express)',
    trackingCode: 'GHN-HN-881920',
    itemCount: 1,
    totalQty: 25,
    totalAmount: 89000000,
    status: 'PACKED',
    priority: 'VIP',
    createdDate: '08/09/2026 16:45',
    scheduledDate: '09/09/2026 18:00',
    operator: 'Phạm Thị Đóng Gói',
    notes: 'Khách hàng VIP, yêu cầu bàn giao trước 18h.',
    items: [
      {
        sku: 'PRD-005',
        name: 'Tai nghe chống ồn khử tạp âm Audio ANC',
        orderedQty: 25,
        pickedQty: 25,
        unit: 'Cái',
        sourceBin: 'BIN-HN-A1-04',
        lotNumber: 'LOT-HP-2026-09',
        unitPrice: 3560000,
        totalAmount: 89000000,
        status: 'PACKED'
      }
    ]
  },
  {
    id: 'OUT-2026-004',
    orderNo: 'WMS-OUT-9004',
    referenceNo: 'SO-2026-9750',
    customerName: 'Hệ Thống Phân Phối Thiết Bị Y Tế An Khang',
    customerPhone: '0933 998 877',
    warehouseCode: 'WH-COLD-03',
    warehouseName: 'Kho Lạnh & Phòng Sạch (Bình Dương)',
    destination: 'Số 45 Đại Lộ Bình Dương, Thuận An, Bình Dương',
    carrierName: 'Đội Xe Lạnh Chuyên Dụng (ColdChain Express)',
    trackingCode: 'CC-EXPRESS-9901',
    driverName: 'Nguyễn Thành Lạnh',
    licensePlate: '60C-991.02',
    itemCount: 4,
    totalQty: 2100,
    totalAmount: 920000000,
    status: 'SHIPPED',
    priority: 'URGENT',
    createdDate: '08/09/2026 11:20',
    scheduledDate: '09/09/2026 09:00',
    shippedDate: '09/09/2026 08:45',
    operator: 'Lê Văn Xuất Bến',
    notes: 'Kiểm soát nhiệt độ thùng xe từ 2°C - 8°C suốt hành trình.',
    items: [
      {
        sku: 'SKU-MED-MON',
        name: 'Màn hình theo dõi bệnh nhân 7 thông số MedTech',
        orderedQty: 10,
        pickedQty: 10,
        unit: 'Bộ',
        sourceBin: 'BIN-COLD-01',
        lotNumber: 'LOT-MED-2026-01',
        unitPrice: 50000000,
        totalAmount: 500000000,
        status: 'PACKED'
      }
    ]
  },
  {
    id: 'OUT-2026-005',
    orderNo: 'WMS-OUT-9005',
    referenceNo: 'WO-2026-1205',
    customerName: 'Xưởng Lắp Ráp Thiết Bị Cơ Khí Chính Xác',
    customerPhone: '0944 112 233',
    warehouseCode: 'WH-HCM-01',
    warehouseName: 'Kho Tổng Trung Tâm (TP.HCM)',
    destination: 'Lô B1, KCN Tân Tạo, Bình Tân, TP.HCM',
    carrierName: 'Đội Xe Tải Nội Bộ (Nexus Fleet)',
    itemCount: 2,
    totalQty: 50,
    totalAmount: 34000000,
    status: 'PENDING_PICK',
    priority: 'NORMAL',
    createdDate: '09/09/2026 10:00',
    scheduledDate: '11/09/2026 10:00',
    operator: 'Nguyễn Văn Kho',
    items: [
      {
        sku: 'PRD-003',
        name: 'Bàn phím cơ chuyên dụng Mechanical Pro',
        orderedQty: 20,
        pickedQty: 0,
        unit: 'Cái',
        sourceBin: 'BIN-B01-R02-S01',
        lotNumber: 'LOT-KB-2026-03',
        unitPrice: 800000,
        totalAmount: 16000000,
        status: 'PENDING'
      },
      {
        sku: 'PRD-006',
        name: 'Cáp kết nối Type-C chuẩn quân đội Thunderbolt 4',
        orderedQty: 30,
        pickedQty: 0,
        unit: 'Sợi',
        sourceBin: 'BIN-B02-R01-S01',
        lotNumber: 'LOT-CB-2026-02',
        unitPrice: 600000,
        totalAmount: 18000000,
        status: 'PENDING'
      }
    ]
  }
];

const mockWaveBatches: WavePickingBatch[] = [
  {
    id: 'WAVE-2026-001',
    waveNo: 'WAVE-HCM-0909-01',
    warehouseCode: 'WH-HCM-01',
    zone: 'Zone A & Zone B (Khu CNTT & Phụ Kiện)',
    assignedTo: 'Trần Văn Nhặt (Picker Lead)',
    orderCount: 2,
    totalSkus: 4,
    totalUnits: 135,
    status: 'IN_PROGRESS',
    startTime: '09/09/2026 09:30',
    orderIds: ['OUT-2026-001', 'OUT-2026-002']
  },
  {
    id: 'WAVE-2026-002',
    waveNo: 'WAVE-COLD-0809-01',
    warehouseCode: 'WH-COLD-03',
    zone: 'Zone Cold (Kho Lạnh Y Tế)',
    assignedTo: 'Lê Văn Xuất Bến',
    orderCount: 1,
    totalSkus: 4,
    totalUnits: 2100,
    status: 'COMPLETED',
    startTime: '08/09/2026 13:00',
    completedTime: '08/09/2026 15:30',
    orderIds: ['OUT-2026-004']
  }
];

const mockPackingCartons: PackingCarton[] = [
  {
    id: 'CARTON-001',
    cartonNo: 'CTN-2026-8901',
    orderNo: 'WMS-OUT-9003',
    customerName: 'Công Ty Cổ Phần Viễn Thông Miền Bắc',
    weightKg: 8.5,
    dimensionsCm: '40x30x25',
    trackingCode: 'GHN-HN-881920',
    carrier: 'GHN Express',
    sealNumber: 'SEAL-NEXUS-991',
    status: 'SEALED',
    packedBy: 'Phạm Thị Đóng Gói',
    packedDate: '09/09/2026 10:15'
  },
  {
    id: 'CARTON-002',
    cartonNo: 'CTN-2026-8902',
    orderNo: 'WMS-OUT-9004',
    customerName: 'Hệ Thống Phân Phối Thiết Bị Y Tế An Khang',
    weightKg: 45.0,
    dimensionsCm: '120x80x100',
    trackingCode: 'CC-EXPRESS-9901',
    carrier: 'ColdChain Express',
    sealNumber: 'SEAL-NEXUS-992',
    status: 'DISPATCHED',
    packedBy: 'Lê Văn Xuất Bến',
    packedDate: '08/09/2026 15:45'
  }
];

interface WarehouseOutboundTabProps {
  onSelectEntity?: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message?: string) => void;
}

export const WarehouseOutboundTab: React.FC<WarehouseOutboundTabProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  // Navigation sub-view inside Outbound Operations
  const [subView, setSubView] = useState<'orders' | 'waves' | 'packing' | 'dispatch'>('orders');

  // Master States
  const [orders, setOrders] = useState<OutboundOrder[]>(mockOutboundOrders);
  const [waves, setWaves] = useState<WavePickingBatch[]>(mockWaveBatches);
  const [cartons, setCartons] = useState<PackingCarton[]>(mockPackingCartons);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  // Modals & Drawers
  const [selectedOrder, setSelectedOrder] = useState<OutboundOrder | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWaveModal, setShowWaveModal] = useState(false);
  const [showPackingModal, setShowPackingModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOrder, setPrintOrder] = useState<OutboundOrder | null>(null);

  // Form states for New Outbound Order
  const [newOrderForm, setNewOrderForm] = useState({
    referenceNo: '',
    customerName: '',
    customerPhone: '',
    warehouseCode: 'WH-HCM-01',
    warehouseName: 'Kho Tổng Trung Tâm (TP.HCM)',
    destination: '',
    carrierName: 'Đội Xe Tải Nội Bộ (Nexus Fleet)',
    priority: 'NORMAL' as 'NORMAL' | 'URGENT' | 'VIP',
    notes: '',
    selectedSku: 'PRD-001',
    qty: 1
  });

  // Selected orders for Batch Wave Picking
  const [selectedOrderIdsForWave, setSelectedOrderIdsForWave] = useState<string[]>([]);
  const [wavePickerName, setWavePickerName] = useState('Trần Văn Nhặt (Picker Lead)');

  // Confirm Dialog State (Strict Rule #19)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // L3 Content Area Loading / Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      setIsLoading(false);
      onNotify('info', 'Đồng bộ Outbound WMS', 'Đã tải danh sách lệnh xuất kho và điều phối mới nhất.');
    }, 450);
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = (o.orderNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.referenceNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.destination || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = !statusFilter || o.status === statusFilter;
      const matchPriority = !priorityFilter || o.priority === priorityFilter;
      const matchWarehouse = !warehouseFilter || o.warehouseCode === warehouseFilter;
      return matchSearch && matchStatus && matchPriority && matchWarehouse;
    });
  }, [orders, searchQuery, statusFilter, priorityFilter, warehouseFilter]);

  // Pagination hook for Orders
  const orderPagination = usePagination({
    totalItems: filteredOrders.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedOrders = useMemo(() => {
    return orderPagination.paginatedData(filteredOrders);
  }, [orderPagination, filteredOrders]);

  // KPI Metrics calculation
  const kpis = useMemo(() => {
    const total = orders.length;
    const pendingPick = orders.filter(o => o.status === 'PENDING_PICK' || o.status === 'ALLOCATED').length;
    const picking = orders.filter(o => o.status === 'PICKING').length;
    const packed = orders.filter(o => o.status === 'PACKED').length;
    const shipped = orders.filter(o => o.status === 'SHIPPED' || o.status === 'DELIVERED').length;
    const totalValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const otifRate = total > 0 ? ((shipped / total) * 100).toFixed(1) : '100.0';

    return { total, pendingPick, picking, packed, shipped, totalValue, otifRate };
  }, [orders]);

  // Handle Export Excel
  const handleExportExcel = () => {
    const data = filteredOrders.map(o => ({
      'Mã Lệnh Xuất': o.orderNo,
      'Số Tham Chiếu (SO/WO)': o.referenceNo,
      'Khách Hàng': o.customerName,
      'Số Điện Thoại': o.customerPhone,
      'Kho Xuất': o.warehouseName,
      'Mã Kho': o.warehouseCode,
      'Địa Chỉ Giao Hàng': o.destination,
      'Đơn Vị Vận Chuyển': o.carrierName,
      'Mã Vận Đơn': o.trackingCode || '',
      'Số Dòng SKU': o.itemCount,
      'Tổng Số Lượng': o.totalQty,
      'Tổng Giá Trị (VND)': o.totalAmount,
      'Độ Ưu Tiên': o.priority,
      'Trạng Thái WMS': o.status,
      'Ngày Lập Lệnh': o.createdDate,
      'Người Thực Hiện': o.operator
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Outbound_Orders');
    XLSX.writeFile(wb, `NexusSync_WMS_Outbound_Orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
    onNotify('success', 'Xuất Excel Thành Công', 'Tập tin danh sách Lệnh Xuất Kho đã được tải về.');
  };

  // Status Badges
  const statusBadgeMap: Record<string, { label: string; className: string }> = {
    PENDING_PICK: { label: 'Chờ nhặt hàng', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' },
    ALLOCATED: { label: 'Đã phân bổ kho', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' },
    PICKING: { label: 'Đang nhặt hàng', className: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800' },
    PACKED: { label: 'Đã đóng gói & KCS', className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800' },
    SHIPPED: { label: 'Đã xuất bến', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' },
    DELIVERED: { label: 'Đã giao thành công', className: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800 font-bold' },
    CANCELLED: { label: 'Đã hủy', className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
  };

  const priorityBadgeMap: Record<string, { label: string; className: string }> = {
    NORMAL: { label: 'Thường', className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
    URGENT: { label: 'Khẩn cấp', className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 font-bold' },
    VIP: { label: 'VIP / Ưu tiên', className: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 font-bold' },
  };

  // Open Drawer 360
  const handleOpenDrawer = (order: OutboundOrder) => {
    setSelectedOrder(order);
    setShowDrawer(true);
    if (onSelectEntity) {
      onSelectEntity({
        type: 'OUTBOUND_ORDER',
        id: order.id,
        title: order.orderNo,
        data: order
      });
    }
  };

  // Handle Approve Dispatch with Rule #19 ConfirmDialog
  const handleApproveDispatch = (order: OutboundOrder) => {
    setConfirmDialog({
      isOpen: true,
      title: `Xác nhận Xuất Bến Lệnh [${order.orderNo}]`,
      message: `Hành động này sẽ chính thức xuất bến, trừ tồn kho vật lý tại kho ${order.warehouseName}, cập nhật sổ cái tồn kho M17 và phát hành Vận đơn giao hàng cho khách hàng ${order.customerName}. Bạn có chắc chắn muốn phê duyệt?`,
      confirmText: 'Phê duyệt xuất kho',
      cancelText: 'Hủy bỏ',
      variant: 'primary',
      onConfirm: () => {
        setConfirmDialog(null);
        setOrders(prev => prev.map(o => o.id === order.id ? { 
          ...o, 
          status: 'SHIPPED', 
          shippedDate: new Date().toLocaleString('vi-VN') 
        } : o));
        onNotify('success', 'Xuất Bến Thành Công', `Lệnh ${order.orderNo} đã được chuyển sang trạng thái Đã xuất bến.`);
      }
    });
  };

  // Handle Quick Pick Items
  const handlePickOrder = (order: OutboundOrder) => {
    setOrders(prev => prev.map(o => {
      if (o.id === order.id) {
        const updatedItems = o.items.map(item => ({ ...item, pickedQty: item.orderedQty, status: 'PICKED' as const }));
        return { ...o, status: 'PACKED', items: updatedItems };
      }
      return o;
    }));
    onNotify('success', 'Hoàn Tất Nhặt Hàng', `Đã nhặt đủ 100% sản phẩm cho lệnh ${order.orderNo} và chuyển sang trạm đóng gói.`);
  };

  // Handle Create New Order
  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = ENTERPRISE_MASTER_PRODUCTS.find(p => p.sku === newOrderForm.selectedSku) || ENTERPRISE_MASTER_PRODUCTS[0];
    const totalAmount = (product.retailPrice || 25000000) * newOrderForm.qty;

    const newOrder: OutboundOrder = {
      id: `OUT-2026-${String(orders.length + 1).padStart(3, '0')}`,
      orderNo: `WMS-OUT-${9000 + orders.length + 1}`,
      referenceNo: newOrderForm.referenceNo || `SO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: newOrderForm.customerName || 'Khách Hàng Doanh Nghiệp Mới',
      customerPhone: newOrderForm.customerPhone || '0901 000 999',
      warehouseCode: newOrderForm.warehouseCode,
      warehouseName: newOrderForm.warehouseName,
      destination: newOrderForm.destination || 'KCN Tân Bình, TP. Hồ Chí Minh',
      carrierName: newOrderForm.carrierName,
      itemCount: 1,
      totalQty: newOrderForm.qty,
      totalAmount,
      status: 'PENDING_PICK',
      priority: newOrderForm.priority,
      createdDate: new Date().toLocaleString('vi-VN'),
      scheduledDate: '12/09/2026 15:00',
      operator: 'Nguyễn Văn Kho',
      notes: newOrderForm.notes,
      items: [
        {
          sku: product.sku,
          name: product.name,
          orderedQty: newOrderForm.qty,
          pickedQty: 0,
          unit: product.unit || 'Cái',
          sourceBin: product.binLocation || 'BIN-A01-R01-S01',
          lotNumber: product.lotNo || 'LOT-2026-GEN-01',
          unitPrice: product.retailPrice || 25000000,
          totalAmount,
          status: 'PENDING'
        }
      ]
    };

    setOrders([newOrder, ...orders]);
    setShowCreateModal(false);
    onNotify('success', 'Lập Lệnh Thành Công', `Đã tạo lệnh xuất kho ${newOrder.orderNo} liên kết với ${newOrder.referenceNo}.`);
  };

  // Handle Create Wave Picking
  const handleCreateWaveSubmit = () => {
    if (selectedOrderIdsForWave.length === 0) {
      onNotify('warning', 'Chưa chọn đơn hàng', 'Vui lòng chọn ít nhất 1 lệnh xuất kho để tạo đợt soạn hàng Wave Picking.');
      return;
    }

    const selectedOrdersList = orders.filter(o => selectedOrderIdsForWave.includes(o.id));
    const totalUnits = selectedOrdersList.reduce((sum, o) => sum + o.totalQty, 0);
    const totalSkus = selectedOrdersList.reduce((sum, o) => sum + o.itemCount, 0);

    const newWave: WavePickingBatch = {
      id: `WAVE-2026-${String(waves.length + 1).padStart(3, '0')}`,
      waveNo: `WAVE-BATCH-0909-${String(waves.length + 1).padStart(2, '0')}`,
      warehouseCode: selectedOrdersList[0]?.warehouseCode || 'WH-HCM-01',
      zone: 'Zone A, B & C (Tối ưu tuyến nhặt đường ngắn nhất TSP)',
      assignedTo: wavePickerName,
      orderCount: selectedOrdersList.length,
      totalSkus,
      totalUnits,
      status: 'IN_PROGRESS',
      startTime: new Date().toLocaleString('vi-VN'),
      orderIds: selectedOrderIdsForWave
    };

    setWaves([newWave, ...waves]);
    setOrders(prev => prev.map(o => selectedOrderIdsForWave.includes(o.id) ? { ...o, status: 'PICKING', waveId: newWave.id } : o));
    setSelectedOrderIdsForWave([]);
    setShowWaveModal(false);
    onNotify('success', 'Khởi Tạo Wave Picking', `Đã gom ${selectedOrdersList.length} đơn hàng vào đợt soạn ${newWave.waveNo}.`);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* L0: HEADER & MASTER CONTROLS                                              */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-700 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none shrink-0">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 shadow-2xs">
                OUTBOUND-WMS-CORE
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Quản Lý Xuất Kho &amp; Điều Phối Vận Tải (Outbound Operations)
              </h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Trung tâm kiểm soát luồng xuất kho: Phân bổ tồn kho (Allocation), Đợt soạn hàng (Wave Picking), Trạm đóng gói KCS &amp; Bàn giao vận tải (Carrier Dispatch).
            </p>
          </div>
        </div>

        {/* Master Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowWaveModal(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Tạo Đợt Soạn Hàng (Wave)
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Xuất Excel
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 dark:shadow-none flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Lập Lệnh Xuất Mới
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L1: KPI METRICS STRIP (5 CARDS)                                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Orders */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-2.5 relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng Lệnh Xuất</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
            {kpis.total.toLocaleString('vi-VN')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Tổng giá trị: <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">{kpis.totalValue.toLocaleString('vi-VN')} ₫</span>
          </div>
        </div>

        {/* Card 2: Pending Pick */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-2.5 relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Chờ Soạn &amp; Phân Bổ</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {kpis.pendingPick.toLocaleString('vi-VN')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Cần gán Wave Picking ngay
          </div>
        </div>

        {/* Card 3: Picking & In-progress */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-2.5 relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Đang Soạn Hàng</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-blue-600 dark:text-blue-400">
            {kpis.picking.toLocaleString('vi-VN')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {waves.filter(w => w.status === 'IN_PROGRESS').length} đợt Wave đang thực thi
          </div>
        </div>

        {/* Card 4: Packed & Ready */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-2.5 relative overflow-hidden group hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Đã Đóng Gói / KCS</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-purple-600 dark:text-purple-400">
            {kpis.packed.toLocaleString('vi-VN')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Sẵn sàng xuất bến giao 3PL
          </div>
        </div>

        {/* Card 5: Dispatched / OTIF */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-2.5 relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Đã Xuất Bến (OTIF)</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {kpis.shipped.toLocaleString('vi-VN')} <span className="text-xs font-semibold text-slate-500">({kpis.otifRate}%)</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Giao hàng đúng hẹn theo SLA
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: SUB-VIEW NAV TABS & ADVANCED FILTER TOOLBAR                            */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xs space-y-4">
        {/* Navigation Switcher between 4 Outbound Functional Views */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSubView('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                subView === 'orders'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>1. Lệnh Xuất Kho ({orders.length})</span>
            </button>
            <button
              onClick={() => setSubView('waves')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                subView === 'waves'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>2. Đợt Soạn Hàng Wave Picking ({waves.length})</span>
            </button>
            <button
              onClick={() => setSubView('packing')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                subView === 'packing'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>3. Trạm Đóng Gói &amp; Mã Vạch ({cartons.length})</span>
            </button>
            <button
              onClick={() => setSubView('dispatch')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                subView === 'dispatch'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>4. Bàn Giao Vận Tải &amp; POD ({orders.filter(o => o.status === 'SHIPPED').length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Hiển thị: <span className="font-bold text-slate-900 dark:text-white">{filteredOrders.length}</span> / {orders.length} lệnh
          </div>
        </div>

        {/* Filter Controls (applicable to Orders view) */}
        {subView === 'orders' && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm mã lệnh, số SO/WO, tên khách hàng, điểm đến..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Warehouse Filter */}
            <select
              value={warehouseFilter}
              onChange={e => setWarehouseFilter(e.target.value)}
              className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tất cả kho xuất</option>
              <option value="WH-HCM-01">WH-HCM-01 (Kho Tổng TP.HCM)</option>
              <option value="WH-HN-02">WH-HN-02 (Kho Vận Hà Nội)</option>
              <option value="WH-COLD-03">WH-COLD-03 (Kho Lạnh Bình Dương)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tất cả trạng thái WMS</option>
              <option value="PENDING_PICK">Chờ nhặt hàng</option>
              <option value="PICKING">Đang nhặt hàng</option>
              <option value="PACKED">Đã đóng gói</option>
              <option value="SHIPPED">Đã xuất bến</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tất cả độ ưu tiên</option>
              <option value="URGENT">Khẩn cấp</option>
              <option value="VIP">VIP / Ưu tiên</option>
              <option value="NORMAL">Thường</option>
            </select>

            {/* Reset Button */}
            {(searchQuery || statusFilter || priorityFilter || warehouseFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                  setPriorityFilter('');
                  setWarehouseFilter('');
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* L3: DATA GRID BY ACTIVE SUB-VIEW                                          */}
      {/* ========================================================================= */}

      {/* SUB-VIEW 1: OUTBOUND ORDERS GRID */}
      {subView === 'orders' && (
        <L3ContentState
          isLoading={isLoading}
          error={error}
          isEmpty={paginatedOrders.length === 0}
          onRetry={handleRefresh}
          emptyTitle="Không tìm thấy Lệnh Xuất Kho nào"
          emptyDescription="Hãy thử điều chỉnh bộ lọc hoặc tạo lệnh xuất kho mới."
          emptyAction={{
            label: 'Lập Lệnh Xuất Mới',
            onClick: () => setShowCreateModal(true),
            variant: 'primary'
          }}
          skeletonRows={6}
          minHeight="min-h-[420px]"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedOrderIdsForWave.length > 0 && selectedOrderIdsForWave.length === filteredOrders.length}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedOrderIdsForWave(filteredOrders.map(o => o.id));
                          } else {
                            setSelectedOrderIdsForWave([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-3.5 min-w-[160px]">Mã Lệnh / Tham Chiếu</th>
                    <th className="p-3.5 min-w-[240px]">Khách Hàng &amp; Điểm Giao</th>
                    <th className="p-3.5 min-w-[180px]">Kho Xuất / Bin Nguồn</th>
                    <th className="p-3.5 text-right min-w-[140px]">Quy Mô &amp; Giá Trị</th>
                    <th className="p-3.5 text-center min-w-[110px]">Độ Ưu Tiên</th>
                    <th className="p-3.5 text-center min-w-[140px]">Trạng Thái WMS</th>
                    <th className="p-3.5 min-w-[160px]">Vận Chuyển (3PL)</th>
                    <th className="p-3.5 text-center min-w-[130px]">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {paginatedOrders.map(order => {
                    const isSelected = selectedOrderIdsForWave.includes(order.id);
                    const statusBadge = statusBadgeMap[order.status] || statusBadgeMap.PENDING_PICK;
                    const priorityBadge = priorityBadgeMap[order.priority] || priorityBadgeMap.NORMAL;

                    return (
                      <tr 
                        key={order.id}
                        onClick={() => handleOpenDrawer(order)}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-50/40 dark:bg-indigo-900/20' : ''
                        }`}
                      >
                        <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={isSelected}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedOrderIdsForWave([...selectedOrderIdsForWave, order.id]);
                              } else {
                                setSelectedOrderIdsForWave(selectedOrderIdsForWave.filter(id => id !== order.id));
                              }
                            }}
                          />
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                            {order.orderNo}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {order.referenceNo}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                            {order.customerName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 line-clamp-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {order.destination}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            {order.warehouseName}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {order.warehouseCode} • {order.items[0]?.sourceBin || 'BIN-GEN'}
                          </div>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                            {order.totalQty.toLocaleString('vi-VN')} SP
                            <span className="text-[11px] text-slate-500 ml-1 font-normal">({order.itemCount} SKUs)</span>
                          </div>
                          <div className="font-mono tabular-nums text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {order.totalAmount.toLocaleString('vi-VN')} ₫
                          </div>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-semibold border ${priorityBadge.className}`}>
                            {priorityBadge.label}
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                            {order.carrierName}
                          </div>
                          {order.trackingCode && (
                            <div className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                              {order.trackingCode}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenDrawer(order)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                              title="Xem chi tiết lệnh 360°"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setPrintOrder(order);
                                setShowPrintModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                              title="In phiếu xuất kho & tem vận đơn"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {order.status === 'PENDING_PICK' && (
                              <button
                                onClick={() => handlePickOrder(order)}
                                className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-semibold text-[11px] transition-colors cursor-pointer"
                                title="Soạn hàng ngay"
                              >
                                Soạn
                              </button>
                            )}

                            {order.status === 'PACKED' && (
                              <button
                                onClick={() => handleApproveDispatch(order)}
                                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-semibold text-[11px] transition-colors cursor-pointer"
                                title="Xuất bến bàn giao"
                              >
                                Xuất bến
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

            {/* L4: Sticky Pagination Control */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
              <PaginationControl
                currentPage={orderPagination.currentPage}
                totalPages={orderPagination.totalPages}
                pageSize={orderPagination.pageSize}
                totalItems={filteredOrders.length}
                startIndex={orderPagination.startIndex}
                endIndex={orderPagination.endIndex}
                onPageChange={orderPagination.goToPage}
                onPageSizeChange={orderPagination.setPageSize}
              />
            </div>
          </div>
        </L3ContentState>
      )}

      {/* SUB-VIEW 2: WAVE & BATCH PICKING MANAGEMENT */}
      {subView === 'waves' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
            <div>
              <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Quản Trị Đợt Soạn Hàng (Wave Picking Engine)
              </h3>
              <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                Gom nhóm các lệnh xuất cùng phân khu hoặc cùng tuyến đường giao hàng để tối ưu lộ trình nhặt hàng (Pick Path Optimization).
              </p>
            </div>
            <button
              onClick={() => setShowWaveModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tạo Đợt Soạn Mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {waves.map(wave => (
              <div key={wave.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{wave.waveNo}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        wave.status === 'COMPLETED' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {wave.status === 'COMPLETED' ? 'Hoàn tất' : 'Đang nhặt'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">{wave.zone}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{wave.orderCount} Đơn Hàng</span>
                    <p className="font-mono text-[11px] text-slate-500">{wave.totalUnits} Sản phẩm ({wave.totalSkus} SKUs)</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Nhân sự phụ trách:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{wave.assignedTo}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Thời gian bắt đầu:
                    </span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{wave.startTime}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    <Navigation className="w-3.5 h-3.5" />
                    Lộ trình: Zone A → Zone B → Đóng Gói
                  </div>
                  {wave.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => {
                        setWaves(prev => prev.map(w => w.id === wave.id ? { ...w, status: 'COMPLETED', completedTime: new Date().toLocaleString('vi-VN') } : w));
                        onNotify('success', 'Hoàn tất Wave Picking', `Đã hoàn thành đợt soạn hàng ${wave.waveNo}.`);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                      Xác nhận hoàn tất
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: PACKING STATION & BARCODE SCANNER */}
      {subView === 'packing' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Scan className="w-5 h-5 text-indigo-600" />
                  Trạm Đóng Gói &amp; Kiểm Soát Quy Cách Kiện Hàng (Packing Station)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Quét mã vạch kiểm tra SKU, đóng thùng carton, niêm phong tem Seal và in nhãn dán vận chuyển chuẩn 3PL.
                </p>
              </div>
              <button
                onClick={() => onNotify('info', 'Mở máy quét mã vạch', 'Sẵn sàng nhận tín hiệu máy quét barcode cầm tay / camera.')}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                Kết Nối Máy Quét Barcode
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {cartons.map(carton => (
                <div key={carton.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-600 text-sm">{carton.cartonNo}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      {carton.status}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="text-slate-900 dark:text-white font-semibold">{carton.customerName}</div>
                    <div className="font-mono text-slate-500">Lệnh xuất: {carton.orderNo} • Vận đơn: {carton.trackingCode}</div>
                    <div className="font-mono text-slate-600 dark:text-slate-300">
                      Quy cách: {carton.dimensionsCm} cm • Trọng lượng: <span className="font-bold text-indigo-600">{carton.weightKg} kg</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">Niêm phong: {carton.sealNumber}</span>
                    <button
                      onClick={() => onNotify('info', 'In tem nhãn thùng', `Đang in nhãn dán kiện hàng ${carton.cartonNo}...`)}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      In Tem Kiện
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: CARRIER DISPATCH & PROOF OF DELIVERY (POD) */}
      {subView === 'dispatch' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              Sổ Cái Bàn Giao Vận Tải &amp; Biên Bản Giao Nhận (Proof of Delivery - POD)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Ghi nhận biên bản bàn giao đơn vị 3PL (Viettel Post, GHN, Đội xe tải nội bộ) và đối soát chữ ký nhận hàng thực tế.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                <tr>
                  <th className="p-3">Mã Lệnh</th>
                  <th className="p-3">Khách Hàng / Điểm Giao</th>
                  <th className="p-3">Đơn Vị 3PL</th>
                  <th className="p-3">Mã Vận Đơn</th>
                  <th className="p-3">Tài Xế / Biển Số</th>
                  <th className="p-3">Thời Gian Xuất</th>
                  <th className="p-3 text-center">Biên Bản POD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {orders.filter(o => o.status === 'SHIPPED' || o.status === 'DELIVERED').map(o => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <td className="p-3 font-mono font-bold text-indigo-600">{o.orderNo}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{o.customerName}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{o.destination}</div>
                    </td>
                    <td className="p-3 font-medium">{o.carrierName}</td>
                    <td className="p-3 font-mono text-indigo-600 font-semibold">{o.trackingCode || 'N/A'}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">
                      {o.driverName || 'Chưa gán'} • {o.licensePlate || 'N/A'}
                    </td>
                    <td className="p-3 font-mono text-slate-500">{o.shippedDate || o.createdDate}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onNotify('success', 'Biên Bản Giao Nhận', `Tải biên bản POD điện tử cho lệnh ${o.orderNo}.`)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Tải POD
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 360° OUTBOUND ORDER DETAILS DRAWER                                        */}
      {/* ========================================================================= */}
      {showDrawer && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400">{selectedOrder.orderNo}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadgeMap[selectedOrder.status]?.className}`}>
                    {statusBadgeMap[selectedOrder.status]?.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Tham chiếu đơn hàng: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedOrder.referenceNo}</span></p>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer & Shipping Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  Thông Tin Khách Hàng &amp; Điểm Giao
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Khách hàng:</span>
                    <p className="font-semibold text-slate-900 dark:text-white">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Số điện thoại:</span>
                    <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedOrder.customerPhone}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Địa chỉ nhận hàng:</span>
                    <p className="text-slate-700 dark:text-slate-300">{selectedOrder.destination}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Đơn vị vận chuyển (3PL):</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{selectedOrder.carrierName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Mã vận đơn Tracking:</span>
                    <p className="font-mono font-bold text-indigo-600">{selectedOrder.trackingCode || 'Chưa phát hành'}</p>
                  </div>
                </div>
              </div>

              {/* Items Line Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-indigo-600" />
                  Danh Sách Vật Tư / Hàng Hóa Xuất Kho ({selectedOrder.items.length} Dòng)
                </h4>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      <tr>
                        <th className="p-3">Sản Phẩm</th>
                        <th className="p-3">Vị Trí (Bin) &amp; Lô</th>
                        <th className="p-3 text-right">SL Yêu Cầu</th>
                        <th className="p-3 text-right">SL Đã Nhặt</th>
                        <th className="p-3 text-right">Thành Tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3">
                            <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                            <div className="font-mono text-[11px] text-indigo-600">{item.sku}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{item.sourceBin}</div>
                            {item.lotNumber && (
                              <div className="font-mono text-[11px] text-amber-600">Lô: {item.lotNumber}</div>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono tabular-nums font-semibold">
                            {item.orderedQty.toLocaleString('vi-VN')} {item.unit}
                          </td>
                          <td className="p-3 text-right font-mono tabular-nums font-bold text-emerald-600">
                            {item.pickedQty.toLocaleString('vi-VN')} {item.unit}
                          </td>
                          <td className="p-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                            {item.totalAmount.toLocaleString('vi-VN')} ₫
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Tiến Trình Xử Lý Xuất Kho
                </h4>
                <div className="flex items-center justify-between text-xs pt-2">
                  <div className="flex flex-col items-center gap-1 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Lập lệnh</span>
                  </div>
                  <div className="h-0.5 flex-1 bg-emerald-500 mx-2" />
                  <div className={`flex flex-col items-center gap-1 ${selectedOrder.status !== 'PENDING_PICK' ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Phân bổ</span>
                  </div>
                  <div className={`h-0.5 flex-1 mx-2 ${selectedOrder.status === 'PACKED' || selectedOrder.status === 'SHIPPED' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  <div className={`flex flex-col items-center gap-1 ${selectedOrder.status === 'PACKED' || selectedOrder.status === 'SHIPPED' ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                    <Package className="w-5 h-5" />
                    <span>Đóng gói</span>
                  </div>
                  <div className={`h-0.5 flex-1 mx-2 ${selectedOrder.status === 'SHIPPED' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  <div className={`flex flex-col items-center gap-1 ${selectedOrder.status === 'SHIPPED' ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                    <Truck className="w-5 h-5" />
                    <span>Xuất bến</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setPrintOrder(selectedOrder);
                  setShowPrintModal(true);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                In Phiếu Xuất Kho
              </button>
              {selectedOrder.status !== 'SHIPPED' && (
                <button
                  onClick={() => handleApproveDispatch(selectedOrder)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  Phê Duyệt Xuất Bến
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW OUTBOUND ORDER                                          */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Lập Lệnh Xuất Kho WMS Mới
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mã Đơn Hàng Tham Chiếu (SO / WO)
                </label>
                <input
                  type="text"
                  required
                  value={newOrderForm.referenceNo}
                  onChange={e => setNewOrderForm({ ...newOrderForm, referenceNo: e.target.value })}
                  placeholder="VD: SO-2026-9950 hoặc WO-2026-1199"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên Khách Hàng / Đơn Vị Nhận
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.customerName}
                    onChange={e => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                    placeholder="Tên công ty hoặc khách hàng"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Số Điện Thoại Liên Hệ
                  </label>
                  <input
                    type="text"
                    value={newOrderForm.customerPhone}
                    onChange={e => setNewOrderForm({ ...newOrderForm, customerPhone: e.target.value })}
                    placeholder="09xx xxx xxx"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kho Xuất Hàng
                  </label>
                  <select
                    value={newOrderForm.warehouseCode}
                    onChange={e => {
                      const code = e.target.value;
                      const name = code === 'WH-HCM-01' ? 'Kho Tổng Trung Tâm (TP.HCM)' : code === 'WH-HN-02' ? 'Kho Vận Trung Chuyển (Hà Nội)' : 'Kho Lạnh & Phòng Sạch (Bình Dương)';
                      setNewOrderForm({ ...newOrderForm, warehouseCode: code, warehouseName: name });
                    }}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="WH-HCM-01">WH-HCM-01 (Kho TP.HCM)</option>
                    <option value="WH-HN-02">WH-HN-02 (Kho Hà Nội)</option>
                    <option value="WH-COLD-03">WH-COLD-03 (Kho Lạnh)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Độ Ưu Tiên
                  </label>
                  <select
                    value={newOrderForm.priority}
                    onChange={e => setNewOrderForm({ ...newOrderForm, priority: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="NORMAL">Thường</option>
                    <option value="URGENT">Khẩn cấp</option>
                    <option value="VIP">VIP / Ưu tiên</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Địa Chỉ Giao Hàng
                </label>
                <input
                  type="text"
                  required
                  value={newOrderForm.destination}
                  onChange={e => setNewOrderForm({ ...newOrderForm, destination: e.target.value })}
                  placeholder="Địa chỉ chi tiết nhận hàng"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  Chọn Sản Phẩm Xuất Kho
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <select
                      value={newOrderForm.selectedSku}
                      onChange={e => setNewOrderForm({ ...newOrderForm, selectedSku: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    >
                      {ENTERPRISE_MASTER_PRODUCTS.slice(0, 10).map(p => (
                        <option key={p.sku} value={p.sku}>{p.sku} - {p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      min={1}
                      value={newOrderForm.qty}
                      onChange={e => setNewOrderForm({ ...newOrderForm, qty: Number(e.target.value) })}
                      placeholder="SL"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-none cursor-pointer"
                >
                  Tạo Lệnh Xuất Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE WAVE PICKING                                                */}
      {/* ========================================================================= */}
      {showWaveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Khởi Tạo Đợt Soạn Hàng (Wave Picking)
              </h3>
              <button onClick={() => setShowWaveModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Gom nhóm <span className="font-bold text-indigo-600 font-mono">{selectedOrderIdsForWave.length || 2}</span> đơn hàng vào đợt soạn hàng tối ưu:
              </p>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nhân Sự Phụ Trách Soạn Hàng (Picker Lead)
                </label>
                <select
                  value={wavePickerName}
                  onChange={e => setWavePickerName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium"
                >
                  <option value="Trần Văn Nhặt (Picker Lead)">Trần Văn Nhặt (Picker Lead - Zone A)</option>
                  <option value="Nguyễn Văn Kho (Warehouse Ops)">Nguyễn Văn Kho (Warehouse Ops)</option>
                  <option value="Lê Văn Xuất Bến (Cold Zone Lead)">Lê Văn Xuất Bến (Cold Zone Lead)</option>
                </select>
              </div>

              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-bold text-indigo-900 dark:text-indigo-200">Thuật toán Wave Optimizer:</div>
                <div>• Tự động gom dòng nhặt theo Vị trí Kệ (Aisle-Rack-Bin).</div>
                <div>• Giảm 45% quãng đường di chuyển của nhân sự nhặt hàng.</div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowWaveModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateWaveSubmit}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 dark:shadow-none cursor-pointer"
                >
                  Bắt Đầu Wave Picking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINT SHIPPING LABEL & OUTBOUND DELIVERY NOTE                      */}
      {/* ========================================================================= */}
      {showPrintModal && printOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold flex items-center gap-2 text-slate-900">
                <Printer className="w-5 h-5 text-indigo-600" />
                Phiếu Xuất Kho Kiêm Vận Chuyển Nội Bộ
              </h3>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="text-center pb-3 border-b border-slate-200">
                <h2 className="text-base font-extrabold text-slate-900">NEXUSSYNC ENTERPRISE WMS</h2>
                <p className="text-[11px] text-slate-500 font-mono">MÃ PHIẾU: {printOrder.orderNo} • {printOrder.referenceNo}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div><strong>Khách hàng:</strong> {printOrder.customerName}</div>
                <div><strong>SĐT:</strong> {printOrder.customerPhone}</div>
                <div className="col-span-2"><strong>Địa chỉ giao:</strong> {printOrder.destination}</div>
                <div><strong>Kho xuất:</strong> {printOrder.warehouseName}</div>
                <div><strong>Vận chuyển:</strong> {printOrder.carrierName}</div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-2">Mã SKU &amp; Tên Hàng</th>
                      <th className="p-2 text-center">ĐVT</th>
                      <th className="p-2 text-right">SL</th>
                      <th className="p-2 text-right">Đơn Giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {printOrder.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-sans">
                          <span className="font-bold">{it.name}</span>
                          <div className="font-mono text-[10px] text-slate-500">{it.sku}</div>
                        </td>
                        <td className="p-2 text-center">{it.unit}</td>
                        <td className="p-2 text-right font-bold">{it.orderedQty}</td>
                        <td className="p-2 text-right">{it.unitPrice.toLocaleString('vi-VN')} ₫</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2 font-bold text-sm">
                <span>Tổng Giá Trị:</span>
                <span className="font-mono text-indigo-600">{printOrder.totalAmount.toLocaleString('vi-VN')} ₫</span>
              </div>

              <div className="pt-6 grid grid-cols-3 text-center text-[10px] font-semibold text-slate-600">
                <div>Người Lập Phiếu<br/><span className="text-slate-400 font-normal">(Ký, họ tên)</span></div>
                <div>Thủ Kho Xuất<br/><span className="text-slate-400 font-normal">(Ký, họ tên)</span></div>
                <div>Người Nhận Hàng<br/><span className="text-slate-400 font-normal">(Ký, họ tên)</span></div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPrintModal(false);
                    onNotify('success', 'Đã Gửi Lệnh In', `Phiếu xuất kho ${printOrder.orderNo} đã được gửi tới máy in mã vạch.`);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  In Phiếu Ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG (MANDATORY RULE #19 - ZERO WINDOW.ALERT/CONFIRM)           */}
      {/* ========================================================================= */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};

export default WarehouseOutboundTab;
