import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, Search, Filter, RefreshCw, Plus, CheckCircle2, 
  AlertTriangle, ShieldAlert, ArrowUpRight, FileSpreadsheet, Eye, 
  Send, CheckSquare, Download, MapPin, Layers, X, User, Check,
  Calendar, ShieldCheck, Clock, FileText, Lock, Unlock, Boxes,
  Truck, Package, ArrowRight, CornerDownRight, Navigation
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { ConfirmDialogState, SelectedEntityContext } from '../../../types';
import { usePagination } from '../../../hooks/usePagination';
import { PaginationControl } from '../../common/PaginationControl';
import { L3ContentState } from '../../common/L3ContentState';
import { ENTERPRISE_MASTER_PRODUCTS } from '../../../data/enterpriseMaster';

export interface TransferOrderItem {
  id: string;
  sku: string;
  productName: string;
  category: string;
  uom: string;
  fromBin: string;
  toBin: string;
  requestedQty: number;
  shippedQty: number;
  receivedQty: number;
  unitCost: number;
  status: 'PENDING' | 'DISPATCHED' | 'IN_TRANSIT' | 'RECEIVED' | 'DISCREPANCY';
  notes: string;
}

export interface TransferOrderRecord {
  id: string;
  transferCode: string;
  title: string;
  sourceWarehouseCode: string;
  sourceWarehouseName: string;
  destWarehouseCode: string;
  destWarehouseName: string;
  shippingType: 'INTERNAL_FLEET' | '3PL_EXPRESS' | 'CROSS_DOCK' | 'URGENT_TRANSFER';
  shippingMethod: string;
  carrierName: string;
  driverName: string;
  driverPhone: string;
  licensePlate: string;
  sealNumber: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | 'REJECTED';
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  createdAt: string;
  createdBy: string;
  dispatchedAt?: string;
  estimatedArrival: string;
  actualArrival?: string;
  totalSkus: number;
  totalItemsQty: number;
  totalValue: number;
  supervisor: string;
  isLocked: boolean;
  notes: string;
  items: TransferOrderItem[];
}

interface TransferMasterOrdersTabProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  onSelectEntity?: (context: SelectedEntityContext) => void;
  onOpenExecutionDesk?: (transferId: string) => void;
}

export const TransferMasterOrdersTab: React.FC<TransferMasterOrdersTabProps> = ({
  onNotify,
  onSelectEntity,
  onOpenExecutionDesk
}) => {
  const [transfers, setTransfers] = useState<TransferOrderRecord[]>([
    {
      id: 'TRF-001',
      transferCode: 'TRF-HN-HCM-2026-09A',
      title: 'Điều chuyển động cơ Servo và PLC từ Kho Tổng Hà Nội sang Kho Chi nhánh Nam',
      sourceWarehouseCode: 'WH-HN-01',
      sourceWarehouseName: 'Kho Tổng Hà Nội (Miền Bắc)',
      destWarehouseCode: 'WH-HCM-02',
      destWarehouseName: 'Kho Chi nhánh Nam (Bình Dương)',
      shippingType: 'INTERNAL_FLEET',
      shippingMethod: 'Xe tải thùng kín lạnh 5 Tấn (Chuyên dụng)',
      carrierName: 'Đội xe vận tải nội bộ Nexus Logistics',
      driverName: 'Nguyễn Văn Tài',
      driverPhone: '0912.345.678',
      licensePlate: '29C-889.21',
      sealNumber: 'SEAL-NX-88912',
      status: 'IN_TRANSIT',
      priority: 'HIGH',
      createdAt: '08/09/2026 09:15',
      createdBy: 'Trần Văn Kho (Điều phối Logistics)',
      dispatchedAt: '08/09/2026 14:30',
      estimatedArrival: '10/09/2026 18:00',
      totalSkus: 3,
      totalItemsQty: 80,
      totalValue: 145000000,
      supervisor: 'Lê Hoàng Sơn (Trưởng kho HN)',
      isLocked: true,
      notes: 'Đã kẹp chì niêm phong điện tử SEAL-NX-88912. Yêu cầu duy trì nhiệt độ bảo quản 20-25°C.',
      items: [
        { id: 'TI-001', sku: 'SKU-ENG-088', productName: 'Động cơ servo AC 750W Delta', category: 'Động cơ & Biến tần', uom: 'Bộ', fromBin: 'BIN-A01-01', toBin: 'BIN-HCM-B01', requestedQty: 20, shippedQty: 20, receivedQty: 0, unitCost: 2850000, status: 'IN_TRANSIT', notes: 'Đóng kiện gỗ chống sốc' },
        { id: 'TI-002', sku: 'SKU-PLC-102', productName: 'Bộ lập trình PLC Siemens S7-1200', category: 'Tự động hóa', uom: 'Bộ', fromBin: 'BIN-A01-02', toBin: 'BIN-HCM-B02', requestedQty: 10, shippedQty: 10, receivedQty: 0, unitCost: 2250000, status: 'IN_TRANSIT', notes: 'Niêm phong chì số #PL889' },
        { id: 'TI-003', sku: 'SKU-SEN-305', productName: 'Cảm biến quang điện Panasonic', category: 'Thiết bị điện', uom: 'Cái', fromBin: 'BIN-A02-01', toBin: 'BIN-HCM-A01', requestedQty: 50, shippedQty: 50, receivedQty: 0, unitCost: 1300000, status: 'IN_TRANSIT', notes: 'Bọc chống tĩnh điện ESD' }
      ]
    },
    {
      id: 'TRF-002',
      transferCode: 'TRF-HN-DN-2026-09B',
      title: 'Cấp phát bổ sung biến tần và cảm biến cho Chi nhánh Đà Nẵng',
      sourceWarehouseCode: 'WH-HN-01',
      sourceWarehouseName: 'Kho Tổng Hà Nội (Miền Bắc)',
      destWarehouseCode: 'WH-DN-03',
      destWarehouseName: 'Kho Phụ tùng Linh kiện (Đà Nẵng)',
      shippingType: '3PL_EXPRESS',
      shippingMethod: 'Dịch vụ Chuyển phát Viettel Post Hub-to-Hub',
      carrierName: 'Viettel Post Logistics',
      driverName: 'Lê Văn Giao',
      driverPhone: '0988.776.655',
      licensePlate: '43B-221.90',
      sealNumber: 'SEAL-VP-4421',
      status: 'PENDING_APPROVAL',
      priority: 'NORMAL',
      createdAt: '09/09/2026 10:30',
      createdBy: 'Phạm Đức Anh (Kế toán điều phối)',
      estimatedArrival: '11/09/2026 12:00',
      totalSkus: 2,
      totalItemsQty: 25,
      totalValue: 68500000,
      supervisor: 'Võ Minh Trí (Giám đốc Vận hành)',
      isLocked: false,
      notes: 'Bổ sung vật tư dự phòng cho hợp đồng lắp ráp dây chuyền miền Trung',
      items: [
        { id: 'TI-004', sku: 'SKU-INV-204', productName: 'Biến tần Inverter 3 pha 380V Mitsubishi', category: 'Động cơ & Biến tần', uom: 'Cái', fromBin: 'BIN-A02-02', toBin: 'BIN-DN-A01', requestedQty: 5, shippedQty: 0, receivedQty: 0, unitCost: 4500000, status: 'PENDING', notes: 'Chờ thủ kho xuất kho' },
        { id: 'TI-005', sku: 'SKU-VAL-012', productName: 'Van điện từ khí nén 24V SMC', category: 'Khí nén', uom: 'Cái', fromBin: 'BIN-B02-01', toBin: 'BIN-DN-B02', requestedQty: 20, shippedQty: 0, receivedQty: 0, unitCost: 2300000, status: 'PENDING', notes: 'Đóng thùng xốp bảo vệ' }
      ]
    },
    {
      id: 'TRF-003',
      transferCode: 'TRF-CNC-HN-2026-09C',
      title: 'Hồi chuyển Dao phay ngón và Collet Chuck từ xưởng CNC về Kho Tổng',
      sourceWarehouseCode: 'WH-CNC-03',
      sourceWarehouseName: 'Kho Cơ khí & Phụ tùng CNC',
      destWarehouseCode: 'WH-HN-01',
      destWarehouseName: 'Kho Tổng Hà Nội (Miền Bắc)',
      shippingType: 'INTERNAL_FLEET',
      shippingMethod: 'Xe bán tải nội bộ 1.5 Tấn',
      carrierName: 'Đội xe nội bộ',
      driverName: 'Đỗ Hải Đăng',
      driverPhone: '0977.112.233',
      licensePlate: '29D-665.41',
      sealNumber: 'SEAL-NX-3312',
      status: 'APPROVED',
      priority: 'URGENT',
      createdAt: '09/09/2026 08:00',
      createdBy: 'Đặng Quốc Huy (KTV Cơ khí)',
      estimatedArrival: '09/09/2026 17:00',
      totalSkus: 2,
      totalItemsQty: 30,
      totalValue: 32000000,
      supervisor: 'Lê Hoàng Sơn (Trưởng kho HN)',
      isLocked: false,
      notes: 'Hàng thu hồi sau khi gia công lô đơn hàng xuất khẩu JP-88',
      items: [
        { id: 'TI-006', sku: 'SKU-CUT-001', productName: 'Dao phay ngón hợp kim 4 me Carbide', category: 'Cơ khí chính xác', uom: 'Cái', fromBin: 'BIN-D01-01', toBin: 'BIN-HN-D01', requestedQty: 20, shippedQty: 0, receivedQty: 0, unitCost: 850000, status: 'PENDING', notes: 'Hàng mới 100% chưa qua sử dụng' },
        { id: 'TI-007', sku: 'SKU-COL-002', productName: 'Đầu kẹp dao phay Collet Chuck ER32', category: 'Cơ khí chính xác', uom: 'Cái', fromBin: 'BIN-D01-02', toBin: 'BIN-HN-D02', requestedQty: 10, shippedQty: 0, receivedQty: 0, unitCost: 1500000, status: 'PENDING', notes: 'Bôi dầu bảo quản chống gỉ' }
      ]
    },
    {
      id: 'TRF-004',
      transferCode: 'TRF-HN-HCM-2026-08FIN',
      title: 'Điều chuyển vật tư dây cáp & rơ-le nhiệt phục vụ dự án Bình Dương',
      sourceWarehouseCode: 'WH-HN-01',
      sourceWarehouseName: 'Kho Tổng Hà Nội (Miền Bắc)',
      destWarehouseCode: 'WH-HCM-02',
      destWarehouseName: 'Kho Chi nhánh Nam (Bình Dương)',
      shippingType: 'INTERNAL_FLEET',
      shippingMethod: 'Xe tải 8 Tấn Container',
      carrierName: 'Nexus Logistics Hub',
      driverName: 'Nguyễn Văn Tài',
      driverPhone: '0912.345.678',
      licensePlate: '29C-889.21',
      sealNumber: 'SEAL-NX-77610',
      status: 'COMPLETED',
      priority: 'NORMAL',
      createdAt: '28/08/2026 08:30',
      createdBy: 'Trần Văn Kho',
      dispatchedAt: '28/08/2026 14:00',
      estimatedArrival: '31/08/2026 10:00',
      actualArrival: '31/08/2026 09:30',
      totalSkus: 4,
      totalItemsQty: 120,
      totalValue: 92400000,
      supervisor: 'Võ Minh Trí (Giám sát Vận hành)',
      isLocked: true,
      notes: 'Kho nhận đã kiểm đếm đầy đủ 100% không phát sinh chênh lệch.',
      items: [
        { id: 'TI-008', sku: 'SKU-CAB-001', productName: 'Cáp tín hiệu xoắn đôi chống nhiễu 4 Core', category: 'Thiết bị điện', uom: 'Cuộn', fromBin: 'BIN-B01-01', toBin: 'BIN-HCM-C01', requestedQty: 50, shippedQty: 50, receivedQty: 50, unitCost: 1100000, status: 'RECEIVED', notes: 'Khớp 100%' },
        { id: 'TI-009', sku: 'SKU-REL-002', productName: 'Rơ-le nhiệt bảo vệ động cơ Schneider', category: 'Thiết bị điện', uom: 'Cái', fromBin: 'BIN-B01-02', toBin: 'BIN-HCM-C02', requestedQty: 70, shippedQty: 70, receivedQty: 70, unitCost: 534000, status: 'RECEIVED', notes: 'Khớp 100%' }
      ]
    }
  ]);

  // Search, Filters & Selection States
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceWarehouseFilter, setSourceWarehouseFilter] = useState('ALL');
  const [destWarehouseFilter, setDestWarehouseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTransfer, setSelectedTransfer] = useState<TransferOrderRecord | null>(transfers[0]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Modal Create Transfer Order
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSourceWarehouse, setNewSourceWarehouse] = useState('WH-HN-01');
  const [newDestWarehouse, setNewDestWarehouse] = useState('WH-HCM-02');
  const [newShippingType, setNewShippingType] = useState<'INTERNAL_FLEET' | '3PL_EXPRESS' | 'CROSS_DOCK' | 'URGENT_TRANSFER'>('INTERNAL_FLEET');
  const [newDriverName, setNewDriverName] = useState('Nguyễn Văn Tài');
  const [newDriverPhone, setNewDriverPhone] = useState('0912.345.678');
  const [newLicensePlate, setNewLicensePlate] = useState('29C-889.21');
  const [newSealNumber, setNewSealNumber] = useState('SEAL-NX-9901');
  const [newPriority, setNewPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('NORMAL');
  const [newNotes, setNewNotes] = useState('');

  // Confirm Dialog State (Rule #19 Compliance)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Filter Logic
  const filteredTransfers = useMemo(() => {
    return transfers.filter(t => {
      const matchSearch = 
        t.transferCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.sealNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchSource = sourceWarehouseFilter === 'ALL' || t.sourceWarehouseCode === sourceWarehouseFilter;
      const matchDest = destWarehouseFilter === 'ALL' || t.destWarehouseCode === destWarehouseFilter;
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

      return matchSearch && matchSource && matchDest && matchStatus && matchPriority;
    });
  }, [transfers, searchQuery, sourceWarehouseFilter, destWarehouseFilter, statusFilter, priorityFilter]);

  // Pagination Hook
  const pagination = usePagination({
    totalItems: filteredTransfers.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedTransfers = useMemo(() => {
    return pagination.paginatedData(filteredTransfers);
  }, [filteredTransfers, pagination]);

  // KPI Metrics Calculation
  const totalTransfersCount = transfers.length;
  const inTransitCount = transfers.filter(t => t.status === 'IN_TRANSIT').length;
  const pendingApprovalCount = transfers.filter(t => t.status === 'PENDING_APPROVAL').length;
  const totalInTransitValue = transfers
    .filter(t => t.status === 'IN_TRANSIT' || t.status === 'APPROVED')
    .reduce((acc, curr) => acc + curr.totalValue, 0);

  // Handler: Open Drawer Details
  const handleOpenDetail = (transfer: TransferOrderRecord) => {
    setSelectedTransfer(transfer);
    setIsDrawerOpen(true);
    if (onSelectEntity) {
      onSelectEntity({
        type: 'INTERNAL_TRANSFER',
        id: transfer.id,
        code: transfer.transferCode,
        name: transfer.title
      });
    }
  };

  // Handler: Approve Transfer Order (Rule #19)
  const handleApproveTransfer = (transfer: TransferOrderRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: `Phê Duyệt Lệnh Chuyển Kho ${transfer.transferCode}?`,
      message: `Hệ thống sẽ xác nhận kế hoạch điều chuyển từ "${transfer.sourceWarehouseName}" sang "${transfer.destWarehouseName}", khóa tạm thời số lượng tồn khả dụng tại kho xuất và sinh phiếu xuất kho theo quy định Rule #03 (Single Writer). Xác nhận phê duyệt?`,
      confirmText: 'Phê Duyệt Lệnh Chuyển',
      cancelText: 'Hủy Bỏ',
      variant: 'primary',
      onConfirm: () => {
        setTransfers(prev => prev.map(t => t.id === transfer.id ? { ...t, status: 'APPROVED' } : t));
        setConfirmDialog(null);
        onNotify('success', 'Đã Phê Duyệt Lệnh Chuyển Kho', `Lệnh ${transfer.transferCode} đã được phê duyệt thành công.`);
      }
    });
  };

  // Handler: Dispatch / In-Transit (Rule #19)
  const handleDispatchTransfer = (transfer: TransferOrderRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: `Xuất Kho & Ban Hành Vận Chuyển ${transfer.transferCode}?`,
      message: `Xác nhận xe vận tải mang biển số ${transfer.licensePlate} (Tài xế: ${transfer.driverName}) đã kẹp chì niêm phong ${transfer.sealNumber}, rời kho xuất. Trạng thái lệnh chuyển sẽ cập nhật sang ĐANG ĐI ĐƯỜNG (IN_TRANSIT) và kích hoạt bút toán Nợ 157 / Có 1561.`,
      confirmText: 'Ban Hành Xuất Vận Chuyển',
      cancelText: 'Hủy Bỏ',
      variant: 'primary',
      onConfirm: () => {
        const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
        setTransfers(prev => prev.map(t => t.id === transfer.id ? { 
          ...t, 
          status: 'IN_TRANSIT', 
          dispatchedAt: now,
          isLocked: true 
        } : t));
        setConfirmDialog(null);
        onNotify('success', 'Xuất Kho Thành Công', `Lệnh ${transfer.transferCode} đã chính thức chuyển sang trạng thái Hàng đi đường (In-Transit).`);
      }
    });
  };

  // Handler: Complete Receive at Destination (Rule #19)
  const handleCompleteReceive = (transfer: TransferOrderRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: `Xác Nhận Nhập Kho Đích Cho Lệnh ${transfer.transferCode}?`,
      message: `Xác nhận kho nhận "${transfer.destWarehouseName}" đã hoàn tất kiểm đếm hàng, gỡ niêm chì ${transfer.sealNumber}, đối soát khớp đủ số lượng và nhập tồn kho thành công. Bút toán Nợ 1561 / Có 157 sẽ được ghi nhận vào Sổ cái.`,
      confirmText: 'Xác Nhận Nhập Kho Đích',
      cancelText: 'Hủy Bỏ',
      variant: 'primary',
      onConfirm: () => {
        const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
        setTransfers(prev => prev.map(t => t.id === transfer.id ? { 
          ...t, 
          status: 'COMPLETED',
          actualArrival: now,
          items: t.items.map(it => ({ ...it, receivedQty: it.shippedQty || it.requestedQty, status: 'RECEIVED' }))
        } : t));
        setConfirmDialog(null);
        onNotify('success', 'Hoàn Tất Điều Chuyển', `Đã ghi nhận nhập kho đích thành công cho lệnh ${transfer.transferCode}.`);
      }
    });
  };

  // Handler: Lock / Freeze Transfer Order (Rule #19)
  const handleToggleLock = (transfer: TransferOrderRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const actionText = transfer.isLocked ? 'Mở khóa' : 'Khóa niêm phong';
    setConfirmDialog({
      isOpen: true,
      title: `${actionText} Lệnh Chuyển Kho ${transfer.transferCode}?`,
      message: `Hành động này sẽ ${transfer.isLocked ? 'cho phép chỉnh sửa thông tin chứng từ' : 'khóa cứng dữ liệu, ngăn chặn thay đổi danh mục SKU và vị trí Bin'}. Bạn có chắc chắn muốn thực hiện?`,
      confirmText: actionText,
      cancelText: 'Đóng',
      variant: transfer.isLocked ? 'warning' : 'danger',
      onConfirm: () => {
        setTransfers(prev => prev.map(t => t.id === transfer.id ? { ...t, isLocked: !t.isLocked } : t));
        setConfirmDialog(null);
        onNotify('info', `Đã ${actionText}`, `Lệnh ${transfer.transferCode} đã được ${actionText.toLowerCase()}.`);
      }
    });
  };

  // Handler: Create New Transfer Order
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tiêu đề lệnh chuyển kho.');
      return;
    }

    const newCode = `TRF-HN-HCM-2026-09${String(transfers.length + 1).padStart(2, '0')}`;
    const sourceName = newSourceWarehouse === 'WH-HN-01' ? 'Kho Tổng Hà Nội (Miền Bắc)' : 
                       newSourceWarehouse === 'WH-HCM-02' ? 'Kho Chi nhánh Nam (Bình Dương)' : 'Kho Phụ tùng Linh kiện (Đà Nẵng)';
    const destName = newDestWarehouse === 'WH-HCM-02' ? 'Kho Chi nhánh Nam (Bình Dương)' :
                     newDestWarehouse === 'WH-DN-03' ? 'Kho Phụ tùng Linh kiện (Đà Nẵng)' : 'Kho Tổng Hà Nội (Miền Bắc)';

    const newOrder: TransferOrderRecord = {
      id: `TRF-00${transfers.length + 1}`,
      transferCode: newCode,
      title: newTitle,
      sourceWarehouseCode: newSourceWarehouse,
      sourceWarehouseName: sourceName,
      destWarehouseCode: newDestWarehouse,
      destWarehouseName: destName,
      shippingType: newShippingType,
      shippingMethod: newShippingType === 'INTERNAL_FLEET' ? 'Xe tải nội bộ 5 Tấn' : 'Dịch vụ 3PL Express',
      carrierName: 'Đội xe vận tải Nexus Logistics',
      driverName: newDriverName,
      driverPhone: newDriverPhone,
      licensePlate: newLicensePlate,
      sealNumber: newSealNumber,
      status: 'PENDING_APPROVAL',
      priority: newPriority,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      createdBy: 'admin (SuperAdmin)',
      estimatedArrival: '12/09/2026 18:00',
      totalSkus: 2,
      totalItemsQty: 25,
      totalValue: 58000000,
      supervisor: 'Lê Hoàng Sơn (Trưởng kho HN)',
      isLocked: false,
      notes: newNotes || 'Khởi tạo từ Bàn Quản Trị Lệnh Chuyển Kho',
      items: [
        {
          id: `TI-NEW-01`,
          sku: 'SKU-ENG-088',
          productName: 'Động cơ servo AC 750W Delta',
          category: 'Động cơ & Biến tần',
          uom: 'Bộ',
          fromBin: 'BIN-A01-01',
          toBin: 'BIN-HCM-B01',
          requestedQty: 15,
          shippedQty: 0,
          receivedQty: 0,
          unitCost: 2850000,
          status: 'PENDING',
          notes: 'Chờ kiểm soát viên xuất kho'
        },
        {
          id: `TI-NEW-02`,
          sku: 'SKU-PLC-102',
          productName: 'Bộ lập trình PLC Siemens S7-1200',
          category: 'Tự động hóa',
          uom: 'Bộ',
          fromBin: 'BIN-A01-02',
          toBin: 'BIN-HCM-B02',
          requestedQty: 10,
          shippedQty: 0,
          receivedQty: 0,
          unitCost: 2250000,
          status: 'PENDING',
          notes: 'Đóng hộp bảo vệ chống sốc'
        }
      ]
    };

    setTransfers([newOrder, ...transfers]);
    setSelectedTransfer(newOrder);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewNotes('');
    onNotify('success', 'Tạo Thành Công', `Đã khởi tạo lệnh chuyển kho ${newCode}.`);
  };

  // Handler: Export Excel
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredTransfers.map((t, idx) => ({
        'STT': idx + 1,
        'Mã Lệnh': t.transferCode,
        'Tiêu Đề Lệnh': t.title,
        'Kho Xuất': `${t.sourceWarehouseCode} - ${t.sourceWarehouseName}`,
        'Kho Nhận': `${t.destWarehouseCode} - ${t.destWarehouseName}`,
        'Phương Thức Vận Chuyển': t.shippingMethod,
        'Tài Xế': `${t.driverName} (${t.driverPhone})`,
        'Biển Số Xe': t.licensePlate,
        'Số Niêm Chì (Seal)': t.sealNumber,
        'Mức Ưu Tiên': t.priority,
        'Trạng Thái': t.status,
        'Tổng SKU': t.totalSkus,
        'Tổng SL Hàng': t.totalItemsQty,
        'Tổng Giá Trị (VND)': t.totalValue,
        'Ngày Tạo': t.createdAt,
        'Dự Kiến Đến': t.estimatedArrival,
        'Người Tạo': t.createdBy,
        'Người Giám Sát': t.supervisor,
        'Ghi Chú': t.notes
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Lenh_Chuyen_Kho_M21');
      XLSX.writeFile(wb, `NexusSync_M21_Transfers_${new Date().toISOString().slice(0, 10)}.xlsx`);

      onNotify('success', 'Xuất File Excel Thành Công', 'Báo cáo danh sách lệnh chuyển kho đã được tải về.');
    } catch (err) {
      onNotify('error', 'Lỗi Xuất File', 'Không thể tạo file Excel lúc này.');
    }
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L1: COMMAND BAR & FILTER STRIP                                            */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          {/* Instant Search Bar */}
          <div className="relative flex-1 sm:w-80 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã lệnh, tiêu đề, tài xế, biển số, seal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Kho Xuất */}
          <select
            value={sourceWarehouseFilter}
            onChange={(e) => setSourceWarehouseFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-900 dark:text-white"
          >
            <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">Tất cả kho xuất</option>
            <option value="WH-HN-01" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">WH-HN-01 (Kho Tổng Hà Nội)</option>
            <option value="WH-HCM-02" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">WH-HCM-02 (Kho Nam)</option>
            <option value="WH-CNC-03" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">WH-CNC-03 (Kho CNC)</option>
          </select>

          {/* Filter Kho Nhận */}
          <select
            value={destWarehouseFilter}
            onChange={(e) => setDestWarehouseFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-900 dark:text-white"
          >
            <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">Tất cả kho nhận</option>
            <option value="WH-HCM-02" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">WH-HCM-02 (Kho Nam)</option>
            <option value="WH-DN-03" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">WH-DN-03 (Kho Đà Nẵng)</option>
            <option value="WH-HN-01" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">WH-HN-01 (Kho Tổng Hà Nội)</option>
          </select>

          {/* Filter Trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-900 dark:text-white"
          >
            <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">Tất cả trạng thái</option>
            <option value="PENDING_APPROVAL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">Chờ phê duyệt</option>
            <option value="APPROVED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">Đã duyệt xuất</option>
            <option value="IN_TRANSIT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">Đang đi đường (In-Transit)</option>
            <option value="COMPLETED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">Đã hoàn tất nhập kho</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setSearchQuery('');
              setSourceWarehouseFilter('ALL');
              setDestWarehouseFilter('ALL');
              setStatusFilter('ALL');
              onNotify('info', 'Làm Mới', 'Đã đặt lại toàn bộ bộ lọc danh sách.');
            }}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Làm mới bộ lọc"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Xuất bảng Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Lệnh Chuyển Kho</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: KPI METRICS STRIP (4 METRIC CARDS)                                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng Lệnh Điều Chuyển */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Lệnh Điều Chuyển
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
              {totalTransfersCount} <span className="text-xs font-sans font-medium text-slate-500">lệnh</span>
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium flex items-center gap-1">
              <Boxes className="w-3 h-3" />
              <span>Toàn mạng lưới kho</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Đang Đi Đường (In-Transit) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Đang Đi Đường (In-Transit)
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-purple-600 dark:text-purple-400">
              {inTransitCount} <span className="text-xs font-sans font-medium text-slate-500">lệnh</span>
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5 font-medium flex items-center gap-1">
              <Truck className="w-3 h-3" />
              <span>Đã kẹp chì niêm phong</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Chờ Phê Duyệt Xuất Kho */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Chờ Phê Duyệt Xuất Kho
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
              {pendingApprovalCount} <span className="text-xs font-sans font-medium text-slate-500">lệnh</span>
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Cần ký duyệt xuất</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Tổng Giá Trị Hàng Vận Chuyển */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Giá Trị Hàng Vận Chuyển
            </span>
            <div className="mt-1 text-xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
              {totalInTransitValue.toLocaleString('vi-VN')} ₫
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Bảo hiểm rủi ro hàng hóa</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L3: DATA GRID & ENTERPRISE TABLE (WCAG AA & HOVER)                       */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <L3ContentState
          isLoading={false}
          isEmpty={paginatedTransfers.length === 0}
          emptyMessage="Không tìm thấy lệnh chuyển kho nào phù hợp với bộ lọc."
          emptyActionLabel="Tạo Lệnh Chuyển Mới"
          onEmptyAction={() => setIsCreateModalOpen(true)}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Mã Lệnh / Tiêu Đề</th>
                  <th className="p-3">Tuyến Kho (Xuất ➔ Nhận)</th>
                  <th className="p-3">Phương Tiện & Tài Xế</th>
                  <th className="p-3 text-center">Niêm Chì (Seal)</th>
                  <th className="p-3 text-center">SKU / Tổng SL</th>
                  <th className="p-3 text-right">Tổng Giá Trị</th>
                  <th className="p-3 text-center">Trạng Thái</th>
                  <th className="p-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {paginatedTransfers.map((transfer, idx) => {
                  const globalIdx = (pagination.currentPage - 1) * pagination.pageSize + idx + 1;
                  const isSelected = selectedTransfer?.id === transfer.id;

                  return (
                    <tr
                      key={transfer.id}
                      onClick={() => handleOpenDetail(transfer)}
                      className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer ${
                        isSelected ? 'border-l-4 border-blue-600 bg-blue-50/70 dark:bg-slate-700/80' :
                        transfer.status === 'IN_TRANSIT' ? 'border-l-4 border-purple-500 bg-purple-50/15 dark:bg-purple-950/10' :
                        transfer.status === 'PENDING_APPROVAL' ? 'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10' :
                        transfer.status === 'COMPLETED' ? 'border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10' :
                        'border-l-4 border-transparent'
                      }`}
                    >
                      {/* STT */}
                      <td className="p-3 text-center font-mono font-bold text-slate-500">
                        {globalIdx}
                      </td>

                      {/* Mã Lệnh / Tiêu Đề */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                            {transfer.transferCode}
                          </span>
                          {transfer.priority === 'URGENT' && (
                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-950 border border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 text-[10px] font-bold rounded-md">
                              HỎA TỐC
                            </span>
                          )}
                          {transfer.isLocked && (
                            <span title="Chứng từ đã khóa">
                              <Lock className="w-3 h-3 text-amber-500" />
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                          {transfer.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          Tạo: {transfer.createdAt} • {transfer.createdBy}
                        </div>
                      </td>

                      {/* Tuyến Kho */}
                      <td className="p-3">
                        <div className="text-xs text-slate-900 dark:text-white font-medium flex items-center gap-1">
                          <span className="text-slate-500">Xuất:</span>
                          <span className="font-semibold">{transfer.sourceWarehouseName}</span>
                        </div>
                        <div className="text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1 mt-0.5">
                          <CornerDownRight className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="text-slate-500">Nhận:</span>
                          <span className="font-semibold">{transfer.destWarehouseName}</span>
                        </div>
                      </td>

                      {/* Phương Tiện & Tài Xế */}
                      <td className="p-3">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {transfer.driverName}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                          Xe: <span className="font-bold text-slate-800 dark:text-slate-200">{transfer.licensePlate}</span> ({transfer.driverPhone})
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">
                          {transfer.shippingMethod}
                        </div>
                      </td>

                      {/* Niêm Chì (Seal) */}
                      <td className="p-3 text-center">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                          {transfer.sealNumber}
                        </span>
                      </td>

                      {/* SKU / Tổng SL */}
                      <td className="p-3 text-center font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white">
                        <div>{transfer.totalSkus} <span className="text-[10px] font-sans font-normal text-slate-500">SKU</span></div>
                        <div className="text-[11px] text-slate-500 font-normal">{transfer.totalItemsQty.toLocaleString('vi-VN')} SP</div>
                      </td>

                      {/* Tổng Giá Trị */}
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {transfer.totalValue.toLocaleString('vi-VN')} ₫
                        </span>
                      </td>

                      {/* Trạng Thái Badge */}
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 text-[11px] rounded-full border inline-flex items-center gap-1 ${
                          transfer.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold' :
                          transfer.status === 'IN_TRANSIT' ? 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200 dark:border-purple-700 font-bold' :
                          transfer.status === 'APPROVED' ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 font-bold' :
                          transfer.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold' :
                          'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 font-medium'
                        }`}>
                          {transfer.status === 'IN_TRANSIT' && <Truck className="w-3 h-3 text-purple-700 dark:text-purple-300" />}
                          {transfer.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />}
                          {transfer.status === 'PENDING_APPROVAL' && <Clock className="w-3 h-3 text-amber-700 dark:text-amber-300" />}
                          <span>{transfer.status}</span>
                        </span>
                      </td>

                      {/* Thao Tác */}
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(transfer)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Xem chi tiết 360 độ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {transfer.status === 'PENDING_APPROVAL' && (
                            <button
                              onClick={(e) => handleApproveTransfer(transfer, e)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              title="Duyệt lệnh chuyển kho"
                            >
                              <Check className="w-3 h-3" />
                              <span>Duyệt</span>
                            </button>
                          )}

                          {transfer.status === 'APPROVED' && (
                            <button
                              onClick={(e) => handleDispatchTransfer(transfer, e)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              title="Xuất kho & Ban hành In-Transit"
                            >
                              <Send className="w-3 h-3" />
                              <span>Xuất Xe</span>
                            </button>
                          )}

                          {transfer.status === 'IN_TRANSIT' && (
                            <button
                              onClick={(e) => handleCompleteReceive(transfer, e)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              title="Xác nhận nhập kho đích"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Nhập Đích</span>
                            </button>
                          )}

                          {onOpenExecutionDesk && (
                            <button
                              onClick={() => onOpenExecutionDesk(transfer.id)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg transition-colors cursor-pointer"
                              title="Chuyển sang Bàn Soát Hàng Thực Tế"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
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
        </L3ContentState>

        {/* L4: STICKY FOOTER PAGINATION */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <PaginationControl
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={filteredTransfers.length}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            onPageChange={pagination.goToPage}
            onPageSizeChange={pagination.setPageSize}
            pageSizeOptions={[5, 10, 20, 50, 100]}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DRAWER 360 ĐỘ: CHI TIẾT LỆNH CHUYỂN KHO & DANH MỤC SKU                   */}
      {/* ========================================================================= */}
      {isDrawerOpen && selectedTransfer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col">
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {selectedTransfer.transferCode}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        selectedTransfer.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200' :
                        selectedTransfer.status === 'IN_TRANSIT' ? 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200' :
                        'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200'
                      }`}>
                        {selectedTransfer.status}
                      </span>
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {selectedTransfer.title}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Hành Trình & Niêm Phong Info */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    Thông Tin Hành Trình Vận Tải
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Kho Xuất Hàng:</span>
                      <strong className="text-slate-900 dark:text-white">{selectedTransfer.sourceWarehouseName}</strong>
                      <div className="text-[11px] font-mono text-slate-500">Mã: {selectedTransfer.sourceWarehouseCode}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Kho Nhận Đích:</span>
                      <strong className="text-blue-600 dark:text-blue-400">{selectedTransfer.destWarehouseName}</strong>
                      <div className="text-[11px] font-mono text-slate-500">Mã: {selectedTransfer.destWarehouseCode}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Tài Xế & Số ĐT:</span>
                      <strong className="text-slate-900 dark:text-white">{selectedTransfer.driverName}</strong>
                      <div className="text-[11px] font-mono text-slate-500">{selectedTransfer.driverPhone}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Biển Số & Mã Seal:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{selectedTransfer.licensePlate}</strong>
                      <div className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        Seal: {selectedTransfer.sealNumber}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danh mục SKU Chi Tiết */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                      Danh Mục SKU Trong Lệnh ({selectedTransfer.items.length})
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      Tổng: {selectedTransfer.totalValue.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                          <th className="p-2.5">SKU & Tên Mặt Hàng</th>
                          <th className="p-2.5">Tuyến Bin</th>
                          <th className="p-2.5 text-center">Yêu Cầu</th>
                          <th className="p-2.5 text-center">Đã Xuất</th>
                          <th className="p-2.5 text-center">Thực Nhận</th>
                          <th className="p-2.5 text-right">Thành Tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {selectedTransfer.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="p-2.5">
                              <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{item.sku}</div>
                              <div className="font-medium text-slate-900 dark:text-white text-[11px]">{item.productName}</div>
                            </td>
                            <td className="p-2.5 font-mono text-[11px]">
                              <div className="text-slate-600 dark:text-slate-400">{item.fromBin}</div>
                              <div className="text-blue-600 dark:text-blue-400">➔ {item.toBin}</div>
                            </td>
                            <td className="p-2.5 text-center font-mono tabular-nums font-bold">
                              {item.requestedQty} {item.uom}
                            </td>
                            <td className="p-2.5 text-center font-mono tabular-nums font-bold text-blue-600">
                              {item.shippedQty}
                            </td>
                            <td className="p-2.5 text-center font-mono tabular-nums font-bold text-emerald-600">
                              {item.receivedQty}
                            </td>
                            <td className="p-2.5 text-right font-mono tabular-nums font-bold">
                              {(item.requestedQty * item.unitCost).toLocaleString('vi-VN')} ₫
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ghi chú & Lịch sử */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Ghi chú vận hành:</span>
                  <p className="text-slate-600 dark:text-slate-400">{selectedTransfer.notes}</p>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => handleToggleLock(selectedTransfer, e)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5"
                >
                  {selectedTransfer.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{selectedTransfer.isLocked ? 'Mở Khóa' : 'Khóa Niêm Phong'}</span>
                </button>

                <div className="flex items-center gap-2">
                  {selectedTransfer.status === 'PENDING_APPROVAL' && (
                    <button
                      onClick={(e) => handleApproveTransfer(selectedTransfer, e)}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Phê Duyệt Lệnh</span>
                    </button>
                  )}

                  {selectedTransfer.status === 'APPROVED' && (
                    <button
                      onClick={(e) => handleDispatchTransfer(selectedTransfer, e)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Xuất Xe Vận Chuyển</span>
                    </button>
                  )}

                  {selectedTransfer.status === 'IN_TRANSIT' && (
                    <button
                      onClick={(e) => handleCompleteReceive(selectedTransfer, e)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Xác Nhận Nhập Đích</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TẠO LỆNH CHUYỂN KHO NỘI BỘ MỚI                                     */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-xl w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Tạo Lệnh Chuyển Kho Nội Bộ Mới
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Tiêu Đề / Mục Đích Điều Chuyển *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Điều chuyển gấp linh kiện SMT phục vụ xưởng Nam..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Kho Xuất (Source Warehouse) *
                  </label>
                  <select
                    value={newSourceWarehouse}
                    onChange={(e) => setNewSourceWarehouse(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-medium"
                  >
                    <option value="WH-HN-01" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">WH-HN-01 (Kho Tổng Hà Nội)</option>
                    <option value="WH-HCM-02" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">WH-HCM-02 (Kho Nam)</option>
                    <option value="WH-CNC-03" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">WH-CNC-03 (Kho Cơ khí CNC)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Kho Nhận Đích (Destination) *
                  </label>
                  <select
                    value={newDestWarehouse}
                    onChange={(e) => setNewDestWarehouse(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-medium"
                  >
                    <option value="WH-HCM-02" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">WH-HCM-02 (Kho Chi nhánh Nam)</option>
                    <option value="WH-DN-03" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">WH-DN-03 (Kho Đà Nẵng)</option>
                    <option value="WH-HN-01" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">WH-HN-01 (Kho Tổng Hà Nội)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Hình Thức Vận Chuyển
                  </label>
                  <select
                    value={newShippingType}
                    onChange={(e) => setNewShippingType(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-medium"
                  >
                    <option value="INTERNAL_FLEET" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Xe Tải Nội Bộ Nexus</option>
                    <option value="3PL_EXPRESS" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Dịch Vụ 3PL Chuyển Phát</option>
                    <option value="URGENT_TRANSFER" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Chuyến Xe Hỏa Tốc</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Mức Độ Ưu Tiên
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-medium"
                  >
                    <option value="NORMAL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Bình Thường (Normal)</option>
                    <option value="HIGH" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Ưu Tiên Cao (High)</option>
                    <option value="URGENT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Hỏa Tốc Khẩn Cấp (Urgent)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Tên Tài Xế & SĐT
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="Tên tài xế"
                      value={newDriverName}
                      onChange={(e) => setNewDriverName(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Số điện thoại"
                      value={newDriverPhone}
                      onChange={(e) => setNewDriverPhone(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Biển Số Xe & Mã Niêm Chì (Seal)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="29C-889.21"
                      value={newLicensePlate}
                      onChange={(e) => setNewLicensePlate(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono uppercase"
                    />
                    <input
                      type="text"
                      placeholder="SEAL-NX-88"
                      value={newSealNumber}
                      onChange={(e) => setNewSealNumber(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Ghi Chú Vận Hành & Yêu Cầu Bảo Quản
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm về điều kiện vận chuyển, nhiệt độ, bốc dỡ..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Khởi Tạo Lệnh Chuyển Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG COMPONENT (RULE #19)                                       */}
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
