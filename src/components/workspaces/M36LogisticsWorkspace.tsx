import React, { useState, useEffect } from 'react';
import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';
import {
  Truck,
  Users,
  Navigation,
  FileCheck,
  Fuel,
  Plus,
  RefreshCw,
  MapPin,
  Wrench,
  BarChart3,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { SelectedEntityContext, ConfirmDialogState } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';

// Shared types
import {
  TransportOrder,
  DeliveryOrder,
  Vehicle,
  Driver,
  FuelTransaction,
  VetcTransaction,
  DriverSafetyScore,
  DeliveryException,
  MaintenanceRecord,
  LogisticsKPIs,
} from './logistics/types';

// Sub-Tab Components
import { LogisticsDashboardTab } from './logistics/LogisticsDashboardTab';
import { LogisticsPlanningTab } from './logistics/LogisticsPlanningTab';
import { LogisticsOperationsTab } from './logistics/LogisticsOperationsTab';
import { LogisticsFleetTab } from './logistics/LogisticsFleetTab';
import { LogisticsDriversTab } from './logistics/LogisticsDriversTab';
import { LogisticsRoutesTab } from './logistics/LogisticsRoutesTab';
import { LogisticsCostsTab } from './logistics/LogisticsCostsTab';
import { LogisticsMaintenanceTab } from './logistics/LogisticsMaintenanceTab';
import { LogisticsAnalyticsTab } from './logistics/LogisticsAnalyticsTab';

// L4 Detail Drawer
import { LogisticsDetailDrawer } from './logistics/LogisticsDetailDrawer';

// Modular Modals
import { NewOrderModal } from './logistics/modals/NewOrderModal';
import { AssignDispatchModal } from './logistics/modals/AssignDispatchModal';
import { PodModal } from './logistics/modals/PodModal';
import { NewVehicleModal } from './logistics/modals/NewVehicleModal';
import { NewDriverModal } from './logistics/modals/NewDriverModal';
import { NewFuelModal } from './logistics/modals/NewFuelModal';
import { NewExceptionModal } from './logistics/modals/NewExceptionModal';
import { NewMaintModal } from './logistics/modals/NewMaintModal';
import { PrintDocumentModal } from './logistics/modals/PrintDocumentModal';
import { MobileDriverAppSimulator } from './logistics/modals/MobileDriverAppSimulator';

interface M36LogisticsWorkspaceProps {
  onSelectEntity?: (entity: SelectedEntityContext) => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const M36LogisticsWorkspace: React.FC<M36LogisticsWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<
    'dashboard' | 'planning' | 'operations' | 'fleet' | 'drivers' | 'routes' | 'costs' | 'maintenance' | 'analytics'
  >('M36', 'dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [orders, setOrders] = useState<TransportOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fuelTxs, setFuelTxs] = useState<FuelTransaction[]>([]);
  const [vetcTxs, setVetcTxs] = useState<VetcTransaction[]>([]);
  const [safetyScores, setSafetyScores] = useState<DriverSafetyScore[]>([]);
  const [kpis, setKpis] = useState<LogisticsKPIs>({
    totalVehicles: 4,
    activeVehicles: 3,
    totalDrivers: 4,
    availableDrivers: 2,
    totalOrders: 4,
    deliveredOrders: 1,
    inTransitOrders: 1,
    totalFreightCost: 27700000,
    totalFuelCost: 6353250,
    onTimeRate: 94,
  });

  // Sample Exceptions & Maintenance
  const [exceptions, setExceptions] = useState<DeliveryException[]>([
    {
      id: 1,
      orderCode: 'TRP-2026-004',
      customerName: 'Công ty Thực phẩm CP Việt Nam',
      type: 'TRAFFIC_DELAY',
      reportedAt: '2026-08-28 09:30',
      status: 'INVESTIGATING',
      note: 'Ùn tắc giao thông trên QL1A, dự kiến chậm ETA 35 phút.',
    },
  ]);

  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([
    {
      id: 1,
      vehiclePlate: '60C-552.19',
      serviceType: 'Bảo dưỡng định kỳ 80,000 km & thay lốp',
      scheduledDate: '2026-08-30',
      estimatedCost: 8500000,
      status: 'SCHEDULED',
      notes: 'Gửi yêu cầu bảo trì sang phân hệ Asset & Maintenance (M38).',
    },
  ]);

  // Delivery Orders (DO - Chặng giao nhận liên kết M13 & M17)
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([
    {
      id: 1,
      doCode: 'DO-2026-081',
      soCode: 'SO-2026-012',
      stockExportCode: 'PXK-2026-045',
      customerName: 'Công ty CP Sản Xuất Cơ Khí An Phát',
      shippingAddress: 'Lô 18, KCN Sài Đồng B, Long Biên, Hà Nội',
      driverName: 'Nguyễn Văn Hùng',
      vehiclePlate: '29C-882.14',
      itemsCount: 150,
      weightKg: 1200,
      status: 'IN_TRANSIT',
      dispatchedAt: '2026-09-03 08:30',
      note: 'Giao trong giờ hành chính, liên hệ trước 30 phút',
    },
    {
      id: 2,
      doCode: 'DO-2026-082',
      soCode: 'SO-2026-015',
      stockExportCode: 'PXK-2026-048',
      customerName: 'Tập đoàn Công nghệ Sao Nam',
      shippingAddress: 'Km 29 Đại Lộ Thăng Long, CNC Hòa Lạc, Hà Nội',
      driverName: 'Trần Đình Trọng',
      vehiclePlate: '29C-991.02',
      itemsCount: 45,
      weightKg: 650,
      status: 'READY_TO_DISPATCH',
      note: 'Hàng linh kiện điện tử, yêu cầu bọc chống sốc',
    },
    {
      id: 3,
      doCode: 'DO-2026-080',
      soCode: 'SO-2026-009',
      stockExportCode: 'PXK-2026-039',
      customerName: 'Tổng Công ty Xây Dựng Số 1 (CC1)',
      shippingAddress: 'Cụm CN Tân Triều, Thanh Trì, Hà Nội',
      driverName: 'Phạm Minh Đức',
      vehiclePlate: '29C-554.78',
      itemsCount: 300,
      weightKg: 2800,
      status: 'POD_CONFIRMED',
      dispatchedAt: '2026-09-02 14:00',
      deliveredAt: '2026-09-02 16:45',
      receiverName: 'Vũ Đức Thịnh (Thủ kho nhận)',
      note: 'Đã ký đủ 3 liên biên bản bàn giao và hóa đơn',
    },
    {
      id: 4,
      doCode: 'DO-2026-083',
      soCode: 'SO-2026-018',
      stockExportCode: 'PXK-2026-052',
      customerName: 'Công ty TNHH Nhựa Tiền Phong Miền Bắc',
      shippingAddress: 'KCN Phố Nối A, Văn Lâm, Hưng Yên',
      driverName: 'Lê Hoàng Nam',
      vehiclePlate: '29C-773.45',
      itemsCount: 80,
      weightKg: 950,
      status: 'READY_TO_DISPATCH',
      note: 'Hàng ống nhựa chịu nhiệt, kiểm tra quy cách trước khi bốc',
    },
  ]);

  // Rule #19: ConfirmDialog State
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Modal visibility states
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [isNewVehicleModalOpen, setIsNewVehicleModalOpen] = useState(false);
  const [isNewDriverModalOpen, setIsNewDriverModalOpen] = useState(false);
  const [isNewFuelModalOpen, setIsNewFuelModalOpen] = useState(false);
  const [isNewExceptionModalOpen, setIsNewExceptionModalOpen] = useState(false);
  const [isNewMaintModalOpen, setIsNewMaintModalOpen] = useState(false);
  const [isMobileDriverAppOpen, setIsMobileDriverAppOpen] = useState(false);

  // Selected entities for actions / drawer
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<TransportOrder | null>(null);
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState<TransportOrder | null>(null);
  const [printDocument, setPrintDocument] = useState<{ type: 'ORDER' | 'POD'; order: TransportOrder } | null>(null);

  // GPS Simulation State
  const [simProgress, setSimProgress] = useState(42);
  const [isSimulating, setIsSimulating] = useState(false);

  // GPS Simulation Loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSimulating) {
      timer = setInterval(() => {
        setSimProgress((prev) => (prev >= 100 ? 0 : prev + 2));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSimulating]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [kpiRes, ordersRes, vehiclesRes, driversRes, fuelRes, vetcRes, safetyRes] = await Promise.all([
        fetch('/api/logistics/kpi'),
        fetch('/api/logistics/orders'),
        fetch('/api/logistics/vehicles'),
        fetch('/api/logistics/drivers'),
        fetch('/api/logistics/fuel-transactions'),
        fetch('/api/logistics/vetc-transactions'),
        fetch('/api/logistics/driver-safety-scores'),
      ]);

      if (kpiRes.ok) setKpis(await kpiRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
      if (driversRes.ok) setDrivers(await driversRes.json());
      if (fuelRes.ok) setFuelTxs(await fuelRes.json());
      if (vetcRes.ok) setVetcTxs(await vetcRes.json());
      if (safetyRes.ok) setSafetyScores(await safetyRes.json());
    } catch (err) {
      console.error('Error loading logistics data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncVetc = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/logistics/vetc-transactions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        onNotify?.(data.message, 'success');
        fetchData();
      }
    } catch (e) {
      onNotify?.('Lỗi đồng bộ VETC', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconcileVetc = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/logistics/vetc-transactions/reconcile', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        onNotify?.(data.message, 'success');
        fetchData();
      }
    } catch (e) {
      onNotify?.('Lỗi đối soát VETC', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-dispatch Validation Engine
  const validateDispatch = (vId: number, dId: number): { valid: boolean; reason?: string } => {
    const vehicle = vehicles.find((v) => v.id === vId);
    const driver = drivers.find((d) => d.id === dId);

    if (!vehicle) return { valid: false, reason: 'Phương tiện không tồn tại trong hệ thống.' };
    if (!driver) return { valid: false, reason: 'Tài xế không tồn tại trong hệ thống.' };

    if (vehicle.status === 'MAINTENANCE' || vehicle.status === 'OUT_OF_SERVICE') {
      return {
        valid: false,
        reason: `Xe ${vehicle.plateNumber} đang ở trạng thái ${vehicle.status}, không thể xuất phát.`,
      };
    }

    if (driver.status === 'ON_LEAVE') {
      return { valid: false, reason: `Tài xế ${driver.fullName} đang nghỉ phép.` };
    }

    const expiry = new Date(driver.licenseExpiryDate);
    if (expiry < new Date()) {
      return {
        valid: false,
        reason: `Bằng lái GPLX (${driver.licenseNumber}) của tài xế ${driver.fullName} đã hết hạn!`,
      };
    }

    return { valid: true };
  };

  // Action Handlers
  const handleCreateOrder = async (form: {
    customerName: string;
    originAddress: string;
    destinationAddress: string;
    stops: string;
    weightKg: number;
    volumeCbm: number;
    freightCost: number;
    plannedDate: string;
  }) => {
    try {
      const res = await fetch('/api/logistics/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        onNotify?.('Đã khởi tạo lệnh vận chuyển (Transport Order) mới thành công.', 'success');
        setIsNewOrderModalOpen(false);
        fetchData();
      }
    } catch (err) {
      onNotify?.('Không thể tạo lệnh vận chuyển.', 'error');
    }
  };

  const handleAssignVehicleDriver = async (form: { vehicleId: string; driverId: string }) => {
    if (!selectedOrderForAction) return;

    const vId = Number(form.vehicleId);
    const dId = Number(form.driverId);

    // Pre-dispatch checklist verification
    const val = validateDispatch(vId, dId);
    if (!val.valid) {
      onNotify?.(`Cảnh báo Pre-Dispatch: ${val.reason}`, 'error');
      return;
    }

    try {
      const res = await fetch(`/api/logistics/orders/${selectedOrderForAction.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        onNotify?.(`Đã gán xe & tài xế an toàn cho lệnh ${selectedOrderForAction.orderCode}`, 'success');
        setIsAssignModalOpen(false);
        setSelectedOrderForAction(null);
        fetchData();
      }
    } catch (err) {
      onNotify?.('Lỗi khi phân công điều vận.', 'error');
    }
  };

  const handleSubmitPod = async (form: {
    receiverName: string;
    status: string;
    failureReason?: string;
    notes?: string;
  }) => {
    if (!selectedOrderForAction) return;
    try {
      const res = await fetch(`/api/logistics/orders/${selectedOrderForAction.id}/pod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        onNotify?.(`Đã lập biên bản giao hàng POD cho lệnh ${selectedOrderForAction.orderCode}`, 'success');
        setIsPodModalOpen(false);
        setSelectedOrderForAction(null);
        fetchData();
      }
    } catch (err) {
      onNotify?.('Lỗi khi gửi POD.', 'error');
    }
  };

  const handleCreateVehicle = async (form: {
    plateNumber: string;
    vehicleType: string;
    capacityKg: number;
    fuelType: string;
    mileageKm: number;
    registrationExpiry: string;
    insuranceExpiry: string;
  }) => {
    try {
      const res = await fetch('/api/logistics/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        onNotify?.('Đã đăng ký phương tiện mới vào Fleet Management.', 'success');
        setIsNewVehicleModalOpen(false);
        fetchData();
      }
    } catch (err) {
      onNotify?.('Thêm phương tiện thất bại.', 'error');
    }
  };

  const handleCreateDriver = async (form: {
    fullName: string;
    phone: string;
    licenseNumber: string;
    licenseClass: string;
    licenseExpiryDate: string;
  }) => {
    try {
      const res = await fetch('/api/logistics/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        onNotify?.('Đã hồ sơ hóa tài xế mới vào hệ thống Driver Roster.', 'success');
        setIsNewDriverModalOpen(false);
        fetchData();
      }
    } catch (err) {
      onNotify?.('Thêm tài xế thất bại.', 'error');
    }
  };

  const handleCreateFuelTx = async (form: {
    vehicleId: string;
    driverId: string;
    liters: number;
    pricePerLiter: number;
    mileageAtRefuel: number;
  }) => {
    try {
      const res = await fetch('/api/logistics/fuel-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        onNotify?.('Đã ghi nhận giao dịch nạp dầu Diesel & cập nhật số km Odometer.', 'success');
        setIsNewFuelModalOpen(false);
        fetchData();
      }
    } catch (err) {
      onNotify?.('Ghi nhận nhiên liệu thất bại.', 'error');
    }
  };

  const handleCreateException = (form: {
    orderCode: string;
    customerName: string;
    type: DeliveryException['type'];
    note: string;
  }) => {
    const newEx: DeliveryException = {
      id: Date.now(),
      orderCode: form.orderCode,
      customerName: form.customerName,
      type: form.type,
      reportedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'OPEN',
      note: form.note || 'Sự cố ngoại lệ phát sinh trên đường vận chuyển.',
    };
    setExceptions([newEx, ...exceptions]);
    setIsNewExceptionModalOpen(false);
    onNotify?.(`Đã ghi nhận Ngoại lệ Giao hàng (Delivery Exception) cho lệnh ${form.orderCode}`, 'warning');
  };

  const handleCreateMaintenance = (form: {
    vehiclePlate: string;
    serviceType: string;
    scheduledDate: string;
    estimatedCost: number;
    notes: string;
  }) => {
    const newRec: MaintenanceRecord = {
      id: Date.now(),
      vehiclePlate: form.vehiclePlate,
      serviceType: form.serviceType,
      scheduledDate: form.scheduledDate,
      estimatedCost: Number(form.estimatedCost),
      status: 'SCHEDULED',
      notes: form.notes,
    };
    setMaintenanceRecords([newRec, ...maintenanceRecords]);
    setIsNewMaintModalOpen(false);
    onNotify?.(
      `Đã lập lịch bảo dưỡng cho xe ${form.vehiclePlate} & chuyển thông điệp tới Asset & Maintenance (M38)`,
      'info'
    );
  };

  // Rule #19: DO Handlers with ConfirmDialog
  const handleDispatchDO = (doItem: DeliveryOrder) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Xuất Bến Vận Chuyển',
      message: `Xác nhận khởi hành giao đơn hàng ${doItem.doCode} (Khách hàng: ${doItem.customerName})? Trạng thái sẽ cập nhật sang Đang Vận Chuyển (IN_TRANSIT).`,
      variant: 'primary',
      confirmText: 'Xác nhận Khởi hành',
      cancelText: 'Hủy',
      onConfirm: () => {
        setDeliveryOrders((prev) =>
          prev.map((item) =>
            item.id === doItem.id
              ? {
                  ...item,
                  status: 'IN_TRANSIT',
                  dispatchedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                }
              : item
          )
        );
        setConfirmDialog(null);
        onNotify?.(`Đã xuất bến đơn giao hàng ${doItem.doCode}. Tài xế: ${doItem.driverName}`, 'success');
      },
    });
  };

  const handleConfirmPOD = (doItem: DeliveryOrder) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Nghiệm Thu Ký Nhận (POD)',
      message: `Xác nhận khách hàng "${doItem.customerName}" đã ký nhận bàn giao đủ ${doItem.itemsCount} kiện hàng cho đơn ${doItem.doCode}? Hệ thống sẽ hoàn tất chặng logistics và kích hoạt quyền xuất hóa đơn GTGT (M31).`,
      variant: 'primary',
      confirmText: 'Xác nhận Đã Ký POD',
      cancelText: 'Đóng',
      onConfirm: () => {
        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
        setDeliveryOrders((prev) =>
          prev.map((item) =>
            item.id === doItem.id
              ? {
                  ...item,
                  status: 'POD_CONFIRMED',
                  deliveredAt: nowStr,
                  receiverName: 'Đại diện Khách hàng (Đã ký điện tử)',
                }
              : item
          )
        );
        setConfirmDialog(null);
        onNotify?.(
          `Đã xác nhận POD đơn ${doItem.doCode}. Đã kích hoạt đồng bộ sang Phân hệ Kế toán (M31)!`,
          'success'
        );
      },
    });
  };

  return (
    <div className="space-y-3.5 max-w-full pb-8">
      {/* Rule #19: ConfirmDialog for destructive & transactional actions */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

      {/* ========================================================================= */}
      {/* L0: WORKSPACE BANNER & CORE IDENTITY (COMPACT & MODERN)                   */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-mono font-bold rounded-md border border-slate-200 dark:border-slate-600">
                M36 • LOGISTICS &amp; FLEET MANAGEMENT
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                Single-Writer TMS • WMS Integration • VETC &amp; Fuel Reconciliation
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
              Quản Lý Vận Tải, Đội Xe &amp; Điều Hành Giao Nhận (TMS)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Lệnh Vận Chuyển</span>
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all border border-slate-300 dark:border-slate-600 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Rule #19 Confirmed</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TABS NAVIGATION STRIP (M41 MASTER SPEC)                              */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Tổng Quan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('planning')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'planning'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Navigation className="w-4 h-4 shrink-0" />
            <span>Lập Kế Hoạch</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'planning' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('operations')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'operations'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileCheck className="w-4 h-4 shrink-0" />
            <span>Điều Hành &amp; POD</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fleet')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'fleet'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4 shrink-0" />
            <span>Đội Xe</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'fleet' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {vehicles.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drivers')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'drivers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Tài Xế</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'drivers' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {drivers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('routes')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'routes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4 shrink-0" />
            <span>Tuyến Đường GPS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('costs')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'costs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Fuel className="w-4 h-4 shrink-0" />
            <span>Nhiên Liệu &amp; VETC</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('maintenance')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'maintenance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wrench className="w-4 h-4 shrink-0" />
            <span>Bảo Dưỡng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Báo Cáo</span>
          </button>
        </div>

        {/* Right Info Strip */}
        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            TMS Logistics
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
            Realtime GPS &amp; POD
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE SUB-TAB CONTENT                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <LogisticsDashboardTab
          kpis={kpis}
          orders={orders}
          exceptions={exceptions}
          maintenanceRecords={maintenanceRecords}
          onNavigateToPlanning={() => setActiveTab('planning')}
          onOpenAssignModal={(order) => {
            setSelectedOrderForAction(order);
            setIsAssignModalOpen(true);
          }}
          onOpenPodModal={(order) => {
            setSelectedOrderForAction(order);
            setIsPodModalOpen(true);
          }}
          onOpenPrintModal={(type, order) => {
            setPrintDocument({ type, order });
          }}
          onOpenExceptionModal={() => setIsNewExceptionModalOpen(true)}
          onOpenMaintenanceModal={() => setIsNewMaintModalOpen(true)}
          onSelectOrder={(order) => {
            setSelectedOrderForDrawer(order);
            onSelectEntity?.({
              entityType: 'TransportOrder',
              entityId: String(order.id),
              entityCode: order.orderCode,
            });
          }}
        />
      )}

      {activeTab === 'planning' && (
        <LogisticsPlanningTab
          orders={orders}
          onOpenNewOrderModal={() => setIsNewOrderModalOpen(true)}
          onOpenAssignModal={(order) => {
            setSelectedOrderForAction(order);
            setIsAssignModalOpen(true);
          }}
          onOpenPodModal={(order) => {
            setSelectedOrderForAction(order);
            setIsPodModalOpen(true);
          }}
          onOpenPrintModal={(type, order) => {
            setPrintDocument({ type, order });
          }}
          onSelectOrder={(order) => {
            setSelectedOrderForDrawer(order);
            onSelectEntity?.({
              entityType: 'TransportOrder',
              entityId: String(order.id),
              entityCode: order.orderCode,
            });
          }}
          onRefresh={fetchData}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'operations' && (
        <LogisticsOperationsTab
          deliveryOrders={deliveryOrders}
          orders={orders}
          onDispatchDO={handleDispatchDO}
          onConfirmPOD={handleConfirmPOD}
          onOpenPrintModal={(type, order) => {
            setPrintDocument({ type, order });
          }}
          onOpenExceptionModal={() => setIsNewExceptionModalOpen(true)}
          onOpenDriverAppSimulator={(order) => {
            setSelectedOrderForAction(order);
            setIsMobileDriverAppOpen(true);
          }}
        />
      )}

      {activeTab === 'fleet' && (
        <LogisticsFleetTab
          vehicles={vehicles}
          onOpenNewVehicleModal={() => setIsNewVehicleModalOpen(true)}
        />
      )}

      {activeTab === 'drivers' && (
        <LogisticsDriversTab
          drivers={drivers}
          safetyScores={safetyScores}
          onOpenNewDriverModal={() => setIsNewDriverModalOpen(true)}
        />
      )}

      {activeTab === 'routes' && (
        <LogisticsRoutesTab
          isSimulating={isSimulating}
          simProgress={simProgress}
          onToggleSimulating={() => setIsSimulating(!isSimulating)}
          onResetSimulation={() => setSimProgress(0)}
        />
      )}

      {activeTab === 'costs' && (
        <LogisticsCostsTab
          vetcTxs={vetcTxs}
          fuelTxs={fuelTxs}
          isLoading={isLoading}
          onSyncVetc={handleSyncVetc}
          onReconcileVetc={handleReconcileVetc}
          onOpenNewFuelModal={() => setIsNewFuelModalOpen(true)}
        />
      )}

      {activeTab === 'maintenance' && (
        <LogisticsMaintenanceTab
          maintenanceRecords={maintenanceRecords}
          onOpenNewMaintModal={() => setIsNewMaintModalOpen(true)}
        />
      )}

      {activeTab === 'analytics' && <LogisticsAnalyticsTab kpis={kpis} />}

      {/* ========================================================================= */}
      {/* L4: 360° DETAIL DRAWER                                                    */}
      {/* ========================================================================= */}
      <LogisticsDetailDrawer
        order={selectedOrderForDrawer}
        onClose={() => setSelectedOrderForDrawer(null)}
        onAssign={(order) => {
          setSelectedOrderForAction(order);
          setIsAssignModalOpen(true);
        }}
        onPod={(order) => {
          setSelectedOrderForAction(order);
          setIsPodModalOpen(true);
        }}
        onPrint={(type, order) => {
          setPrintDocument({ type, order });
        }}
        onOpenDriverApp={(order) => {
          setSelectedOrderForAction(order);
          setIsMobileDriverAppOpen(true);
        }}
      />

      {/* ========================================================================= */}
      {/* MODULAR MODALS                                                            */}
      {/* ========================================================================= */}
      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onSubmit={handleCreateOrder}
      />

      <AssignDispatchModal
        isOpen={isAssignModalOpen}
        order={selectedOrderForAction}
        vehicles={vehicles}
        drivers={drivers}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedOrderForAction(null);
        }}
        onSubmit={handleAssignVehicleDriver}
      />

      <PodModal
        isOpen={isPodModalOpen}
        order={selectedOrderForAction}
        onClose={() => {
          setIsPodModalOpen(false);
          setSelectedOrderForAction(null);
        }}
        onSubmit={handleSubmitPod}
      />

      <NewVehicleModal
        isOpen={isNewVehicleModalOpen}
        onClose={() => setIsNewVehicleModalOpen(false)}
        onSubmit={handleCreateVehicle}
      />

      <NewDriverModal
        isOpen={isNewDriverModalOpen}
        onClose={() => setIsNewDriverModalOpen(false)}
        onSubmit={handleCreateDriver}
      />

      <NewFuelModal
        isOpen={isNewFuelModalOpen}
        vehicles={vehicles}
        drivers={drivers}
        onClose={() => setIsNewFuelModalOpen(false)}
        onSubmit={handleCreateFuelTx}
      />

      <NewExceptionModal
        isOpen={isNewExceptionModalOpen}
        orders={orders}
        onClose={() => setIsNewExceptionModalOpen(false)}
        onSubmit={handleCreateException}
      />

      <NewMaintModal
        isOpen={isNewMaintModalOpen}
        vehicles={vehicles}
        onClose={() => setIsNewMaintModalOpen(false)}
        onSubmit={handleCreateMaintenance}
      />

      <PrintDocumentModal
        document={printDocument}
        onClose={() => setPrintDocument(null)}
      />

      <MobileDriverAppSimulator
        isOpen={isMobileDriverAppOpen}
        order={selectedOrderForAction}
        onClose={() => setIsMobileDriverAppOpen(false)}
        onCompletePod={(orderId, receiverName, notes) => {
          handleSubmitPod({
            receiverName,
            status: 'DELIVERED_SUCCESS',
            notes,
          });
          setIsMobileDriverAppOpen(false);
        }}
      />
    </div>
  );
};
export default M36LogisticsWorkspace;
