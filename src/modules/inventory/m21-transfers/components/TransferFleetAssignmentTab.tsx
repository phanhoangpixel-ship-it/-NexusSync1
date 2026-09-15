import React, { useState, useMemo } from 'react';
import { 
  Truck, UserCheck, ShieldCheck, Clock, Search, Filter, RefreshCw, 
  Plus, CheckCircle2, AlertTriangle, ArrowRight, User, Phone, MapPin, 
  Layers, CheckSquare, Eye, Navigation, ShieldAlert, Calendar
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';
import { usePagination } from '../../../../hooks/usePagination';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { L3ContentState } from '../../../../components/common/L3ContentState';

export interface FleetAssignmentRecord {
  id: string;
  assignmentCode: string;
  transferCode: string;
  carrierType: 'INTERNAL_FLEET' | '3PL_EXPRESS' | 'DEDICATED_TRUCK';
  carrierName: string;
  vehicleType: string;
  licensePlate: string;
  primaryDriver: string;
  driverPhone: string;
  secondaryDriver?: string;
  sourceWarehouse: string;
  destWarehouse: string;
  distanceKm: number;
  estimatedHours: number;
  slaDeadline: string;
  departureTime?: string;
  completionPercent: number;
  status: 'ASSIGNED' | 'DISPATCHED' | 'IN_TRANSIT' | 'ARRIVED' | 'OVERDUE';
  assignedBy: string;
  notes: string;
}

interface TransferFleetAssignmentTabProps {
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const TransferFleetAssignmentTab: React.FC<TransferFleetAssignmentTabProps> = ({
  onNotify
}) => {
  const [assignments, setAssignments] = useState<FleetAssignmentRecord[]>([
    {
      id: 'ASN-001',
      assignmentCode: 'ASN-TRF-0901',
      transferCode: 'TRF-HN-HCM-2026-09A',
      carrierType: 'INTERNAL_FLEET',
      carrierName: 'Nexus Logistics Fleet Bắc - Nam',
      vehicleType: 'Xe Tải Thùng Lạnh 5 Tấn (Chuyên dụng)',
      licensePlate: '29C-889.21',
      primaryDriver: 'Nguyễn Văn Tài',
      driverPhone: '0912.345.678',
      secondaryDriver: 'Lê Văn Phụ (Phụ xe)',
      sourceWarehouse: 'Kho Tổng Hà Nội',
      destWarehouse: 'Kho Chi nhánh Nam (Bình Dương)',
      distanceKm: 1720,
      estimatedHours: 36,
      slaDeadline: '10/09/2026 18:00',
      departureTime: '08/09/2026 14:30',
      completionPercent: 65,
      status: 'IN_TRANSIT',
      assignedBy: 'Trần Văn Kho (Điều phối)',
      notes: 'Hàng điện tử công nghiệp nhạy cảm, chạy theo lộ trình Quốc Lộ 1A - Cao tốc.'
    },
    {
      id: 'ASN-002',
      assignmentCode: 'ASN-TRF-0902',
      transferCode: 'TRF-HN-DN-2026-09B',
      carrierType: '3PL_EXPRESS',
      carrierName: 'Viettel Post Hub-to-Hub',
      vehicleType: 'Xe Chuyển Phát Nhanh 2.5 Tấn',
      licensePlate: '43B-221.90',
      primaryDriver: 'Lê Văn Giao',
      driverPhone: '0988.776.655',
      sourceWarehouse: 'Kho Tổng Hà Nội',
      destWarehouse: 'Kho Linh kiện Đà Nẵng',
      distanceKm: 760,
      estimatedHours: 16,
      slaDeadline: '11/09/2026 12:00',
      completionPercent: 10,
      status: 'ASSIGNED',
      assignedBy: 'Phạm Đức Anh (Kế toán)',
      notes: 'Giao hàng trước 12:00 ngày 11/09 để kịp ca sản xuất xưởng cơ khí.'
    },
    {
      id: 'ASN-003',
      assignmentCode: 'ASN-TRF-0903',
      transferCode: 'TRF-CNC-HN-2026-09C',
      carrierType: 'INTERNAL_FLEET',
      carrierName: 'Xe Nội Bộ Nội Thành',
      vehicleType: 'Xe Bán Tải 1.5 Tấn',
      licensePlate: '29D-665.41',
      primaryDriver: 'Đỗ Hải Đăng',
      driverPhone: '0977.112.233',
      sourceWarehouse: 'Kho CNC (Khu CN Thạch Thất)',
      destWarehouse: 'Kho Tổng Hà Nội (Gia Lâm)',
      distanceKm: 45,
      estimatedHours: 2,
      slaDeadline: '09/09/2026 17:00',
      departureTime: '09/09/2026 14:00',
      completionPercent: 90,
      status: 'IN_TRANSIT',
      assignedBy: 'Đặng Quốc Huy (KTV)',
      notes: 'Thu hồi dao phay ngón và collet chuck sau gia công.'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [carrierTypeFilter, setCarrierTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal Create Assignment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTransferCode, setNewTransferCode] = useState('TRF-HN-HCM-2026-09B');
  const [newCarrierType, setNewCarrierType] = useState<'INTERNAL_FLEET' | '3PL_EXPRESS' | 'DEDICATED_TRUCK'>('INTERNAL_FLEET');
  const [newDriver, setNewDriver] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Confirm Dialog (Rule #19)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Filters
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const matchSearch = 
        a.assignmentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.transferCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.primaryDriver.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.carrierName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCarrier = carrierTypeFilter === 'ALL' || a.carrierType === carrierTypeFilter;
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;

      return matchSearch && matchCarrier && matchStatus;
    });
  }, [assignments, searchQuery, carrierTypeFilter, statusFilter]);

  // Pagination
  const pagination = usePagination({
    totalItems: filteredAssignments.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const paginatedAssignments = useMemo(() => {
    return pagination.paginatedData(filteredAssignments);
  }, [filteredAssignments, pagination]);

  // Metrics
  const totalTripsCount = assignments.length;
  const inTransitTripsCount = assignments.filter(a => a.status === 'IN_TRANSIT').length;
  const onTimePercent = 100;
  const overdueCount = assignments.filter(a => a.status === 'OVERDUE').length;

  // Handler: Change Status (Rule #19)
  const handleUpdateStatus = (record: FleetAssignmentRecord, newStatus: 'IN_TRANSIT' | 'ARRIVED') => {
    const actionLabel = newStatus === 'IN_TRANSIT' ? 'Bắt Đầu Lăn Bánh (In-Transit)' : 'Xác Nhận Đã Đến Kho Đích (Arrived)';
    setConfirmDialog({
      isOpen: true,
      title: `${actionLabel} Cho Chuyến Xe ${record.assignmentCode}?`,
      message: `Xác nhận chuyến xe ${record.licensePlate} do tài xế ${record.primaryDriver} điều khiển chuyển sang trạng thái "${newStatus}".`,
      confirmText: actionLabel,
      cancelText: 'Hủy Bỏ',
      variant: 'primary',
      onConfirm: () => {
        setAssignments(prev => prev.map(a => a.id === record.id ? { 
          ...a, 
          status: newStatus,
          completionPercent: newStatus === 'ARRIVED' ? 100 : Math.max(a.completionPercent, 50)
        } : a));
        setConfirmDialog(null);
        onNotify('success', 'Đã Cập Nhật Tiến Độ', `Chuyến xe ${record.assignmentCode} đã chuyển sang trạng thái ${newStatus}.`);
      }
    });
  };

  // Handler: Create Assignment
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriver.trim() || !newPlate.trim()) {
      onNotify('warning', 'Thiếu Thông Tin', 'Vui lòng nhập đầy đủ tên tài xế và biển số xe.');
      return;
    }

    const newRec: FleetAssignmentRecord = {
      id: `ASN-00${assignments.length + 1}`,
      assignmentCode: `ASN-TRF-09${String(assignments.length + 1).padStart(2, '0')}`,
      transferCode: newTransferCode,
      carrierType: newCarrierType,
      carrierName: newCarrierType === 'INTERNAL_FLEET' ? 'Đội xe nội bộ Nexus' : 'Đối tác 3PL Logistics',
      vehicleType: 'Xe Tải 3.5 Tấn Thùng Kín',
      licensePlate: newPlate,
      primaryDriver: newDriver,
      driverPhone: newPhone || '0900.000.000',
      sourceWarehouse: 'Kho Tổng Hà Nội',
      destWarehouse: 'Kho Chi nhánh Nam',
      distanceKm: 1720,
      estimatedHours: 36,
      slaDeadline: '13/09/2026 17:00',
      completionPercent: 0,
      status: 'ASSIGNED',
      assignedBy: 'admin (SuperAdmin)',
      notes: newNotes || 'Phân công vận chuyển tuyến liên tỉnh'
    };

    setAssignments([newRec, ...assignments]);
    setIsModalOpen(false);
    setNewDriver('');
    setNewPlate('');
    setNewPhone('');
    onNotify('success', 'Phân Công Thành Công', `Đã phân công xe ${newRec.licensePlate} cho chuyến ${newRec.assignmentCode}.`);
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* L1: COMMAND BAR                                                           */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 sm:w-80 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã phân công, lệnh, tài xế, biển số..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Carrier Type Filter */}
          <select
            value={carrierTypeFilter}
            onChange={(e) => setCarrierTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-900 dark:text-white"
          >
            <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tất cả đội xe</option>
            <option value="INTERNAL_FLEET" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Đội xe nội bộ Nexus</option>
            <option value="3PL_EXPRESS" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Dịch vụ 3PL Chuyển phát</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-900 dark:text-white"
          >
            <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tất cả trạng thái xe</option>
            <option value="ASSIGNED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Đã phân công (Chờ lăn bánh)</option>
            <option value="IN_TRANSIT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Đang lăn bánh trên đường</option>
            <option value="ARRIVED" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Đã đến đích an toàn</option>
          </select>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Phân Công Chuyến Xe Mới</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: KPI STRIP                                                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Chuyến Xe Phân Công
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
              {totalTripsCount} <span className="text-xs font-sans font-normal text-slate-500">chuyến</span>
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
              Kết nối liên kho toàn quốc
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Xe Đang Lăn Bánh (In-Transit)
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-purple-600 dark:text-purple-400">
              {inTransitTripsCount} <span className="text-xs font-sans font-normal text-slate-500">xe</span>
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5 font-medium">
              Giám sát GPS & Niêm chì
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
            <Navigation className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tỷ Lệ Đúng Hạn SLA
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
              {onTimePercent}%
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              Đạt chuẩn cam kết dịch vụ
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cảnh Báo Chậm Trễ
            </span>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
              {overdueCount} <span className="text-xs font-sans font-normal text-slate-500">sự cố</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Thời tiết / Ùn tắc giao thông
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L3: DATA GRID                                                             */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <L3ContentState
          isLoading={false}
          isEmpty={paginatedAssignments.length === 0}
          emptyMessage="Không có chuyến xe nào phù hợp."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Mã Chuyến / Lệnh</th>
                  <th className="p-3">Phương Tiện & Biển Số</th>
                  <th className="p-3">Tài Xế & Liên Hệ</th>
                  <th className="p-3">Hành Trình (Cự Ly & SLA)</th>
                  <th className="p-3">Tiến Độ Hành Trình</th>
                  <th className="p-3 text-center">Trạng Thái</th>
                  <th className="p-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {paginatedAssignments.map((record, idx) => {
                  const globalIdx = (pagination.currentPage - 1) * pagination.pageSize + idx + 1;

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 ${
                        record.status === 'IN_TRANSIT' ? 'border-l-4 border-purple-500 bg-purple-50/15 dark:bg-purple-950/10' :
                        record.status === 'ARRIVED' ? 'border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10' :
                        'border-l-4 border-blue-500/40'
                      }`}
                    >
                      {/* STT */}
                      <td className="p-3 text-center font-mono font-bold text-slate-500">
                        {globalIdx}
                      </td>

                      {/* Mã Chuyến */}
                      <td className="p-3">
                        <div className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          {record.assignmentCode}
                        </div>
                        <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-bold mt-0.5">
                          {record.transferCode}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {record.carrierName}
                        </div>
                      </td>

                      {/* Phương Tiện */}
                      <td className="p-3">
                        <div className="font-mono font-bold text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md inline-block border border-slate-300 dark:border-slate-600">
                          {record.licensePlate}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {record.vehicleType}
                        </div>
                      </td>

                      {/* Tài Xế */}
                      <td className="p-3">
                        <div className="font-semibold text-xs text-slate-900 dark:text-white">
                          {record.primaryDriver}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{record.driverPhone}</span>
                        </div>
                        {record.secondaryDriver && (
                          <div className="text-[10px] text-slate-500">
                            Phụ xe: {record.secondaryDriver}
                          </div>
                        )}
                      </td>

                      {/* Hành Trình */}
                      <td className="p-3">
                        <div className="text-xs font-medium text-slate-900 dark:text-white">
                          {record.sourceWarehouse} ➔ {record.destWarehouse}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{record.distanceKm} km</span>
                          <span>•</span>
                          <span>Hạn SLA: {record.slaDeadline}</span>
                        </div>
                      </td>

                      {/* Tiến Độ */}
                      <td className="p-3 w-40">
                        <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                          <span className="text-slate-700 dark:text-slate-300">{record.completionPercent}%</span>
                          <span className="text-slate-500">{record.status === 'ARRIVED' ? 'Đã đến đích' : 'Đang di chuyển'}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              record.status === 'ARRIVED' ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${record.completionPercent}%` }}
                          />
                        </div>
                      </td>

                      {/* Trạng Thái */}
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 text-[11px] rounded-full border font-bold inline-flex items-center gap-1 ${
                          record.status === 'ARRIVED' ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200' :
                          record.status === 'IN_TRANSIT' ? 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200' :
                          'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200'
                        }`}>
                          {record.status === 'IN_TRANSIT' && <Navigation className="w-3 h-3 text-purple-700" />}
                          {record.status === 'ARRIVED' && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                          <span>{record.status}</span>
                        </span>
                      </td>

                      {/* Thao Tác */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {record.status === 'ASSIGNED' && (
                            <button
                              onClick={() => handleUpdateStatus(record, 'IN_TRANSIT')}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              title="Bắt đầu lăn bánh"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Lăn Bánh</span>
                            </button>
                          )}
                          {record.status === 'IN_TRANSIT' && (
                            <button
                              onClick={() => handleUpdateStatus(record, 'ARRIVED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              title="Xác nhận đến kho nhận"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Đến Đích</span>
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

        {/* L4: STICKY FOOTER */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <PaginationControl
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={filteredAssignments.length}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            onPageChange={pagination.goToPage}
            onPageSizeChange={pagination.setPageSize}
            pageSizeOptions={[5, 10, 20, 50, 100]}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: PHÂN CÔNG CHUYẾN XE MỚI                                           */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Phân Công Chuyến Xe Vận Tải Mới
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Mã Lệnh Điều Chuyển (Transfer Order) *
                </label>
                <select
                  value={newTransferCode}
                  onChange={(e) => setNewTransferCode(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono font-bold"
                >
                  <option value="TRF-HN-HCM-2026-09A">TRF-HN-HCM-2026-09A (Hà Nội ➔ Nam)</option>
                  <option value="TRF-HN-DN-2026-09B">TRF-HN-DN-2026-09B (Hà Nội ➔ Đà Nẵng)</option>
                  <option value="TRF-CNC-HN-2026-09C">TRF-CNC-HN-2026-09C (CNC ➔ Hà Nội)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Loại Hình Đội Xe
                  </label>
                  <select
                    value={newCarrierType}
                    onChange={(e) => setNewCarrierType(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="INTERNAL_FLEET">Đội xe nội bộ Nexus</option>
                    <option value="3PL_EXPRESS">Dịch vụ 3PL Chuyển phát</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Biển Số Xe *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="29C-889.21"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono uppercase font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Họ Tên Tài Xế *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn Tài"
                    value={newDriver}
                    onChange={(e) => setNewDriver(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Số Điện Thoại Tài Xế
                  </label>
                  <input
                    type="text"
                    placeholder="0912.345.678"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Ghi Chú Phân Công
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú về kiểm tra dây chằng, nhiệt độ xe..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Lưu Phân Công Xe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
