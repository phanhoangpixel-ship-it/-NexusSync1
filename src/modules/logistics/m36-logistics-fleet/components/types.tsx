export type M36SubTab =
  | 'dashboard'
  | 'planning'
  | 'operations'
  | 'fleet'
  | 'drivers'
  | 'routes'
  | 'costs'
  | 'maintenance'
  | 'analytics';

export interface DeliveryOrder {
  id: number;
  doCode: string;
  soCode: string;
  stockExportCode: string; // M17 PXK
  customerName: string;
  shippingAddress: string;
  driverName: string;
  vehiclePlate: string;
  itemsCount: number;
  weightKg: number;
  status: 'READY_TO_DISPATCH' | 'IN_TRANSIT' | 'DELIVERED' | 'POD_CONFIRMED';
  dispatchedAt?: string;
  deliveredAt?: string;
  receiverName?: string;
  note?: string;
}

export interface Vehicle {
  id: number;
  code: string;
  plateNumber: string;
  vehicleType: string;
  capacityKg: number;
  fuelType: string;
  status: 'AVAILABLE' | 'ACTIVE' | 'ASSIGNED' | 'IN_TRANSIT' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'RETIRED';
  mileageKm: number;
  registrationExpiry?: string;
  insuranceExpiry?: string;
}

export interface Driver {
  id: number;
  code: string;
  fullName: string;
  phone: string;
  licenseNumber: string;
  licenseClass?: string;
  licenseExpiryDate: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'ON_TRIP' | 'ON_LEAVE';
  rating?: number;
  completedTrips?: number;
}

export interface ProofOfDelivery {
  id: number;
  transportOrderId: number;
  receiverName: string;
  signatureUrl?: string;
  photoUrl?: string;
  deliveredAt: string;
  status: 'DELIVERED_SUCCESS' | 'PARTIAL_DELIVERY' | 'REFUSED' | 'CUSTOMER_UNAVAILABLE' | 'WRONG_ADDRESS' | 'DAMAGED_GOODS';
  failureReason?: string;
  notes?: string;
}

export interface TransportOrder {
  id: number;
  orderCode: string;
  salesOrderId?: number;
  customerName: string;
  originAddress: string;
  destinationAddress: string;
  stops?: string[];
  weightKg: number;
  volumeCbm: number;
  vehicleId?: number;
  vehiclePlate?: string;
  vehicleType?: string;
  driverId?: number;
  driverName?: string;
  driverPhone?: string;
  plannedDate: string;
  eta?: string;
  status: 'DRAFT' | 'PLANNED' | 'ASSIGNED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'POD_CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'DELAYED' | 'FAILED' | 'RETURNED';
  freightCost: number;
  fuelCost: number;
  tollCost?: number;
  pod?: ProofOfDelivery;
}

export interface FuelTransaction {
  id: number;
  vehicleId: number;
  plateNumber: string;
  driverId?: number;
  driverName?: string;
  fuelDate: string;
  liters: number;
  pricePerLiter: number;
  totalAmount: number;
  mileageAtRefuel: number;
}

export interface VetcTransaction {
  id: number;
  transactionCode: string;
  provider: 'VETC' | 'ePass';
  plateNumber: string;
  tollStation: string;
  passTime: string;
  amountVND: number;
  orderCode: string;
  status: 'PENDING_MATCH' | 'AUTO_MATCHED' | 'RECONCILED' | 'ERROR';
  rfidTag: string;
}

export interface DriverSafetyScore {
  driverId: number;
  driverCode: string;
  fullName: string;
  licenseClass: string;
  totalKm: number;
  safetyScore: number;
  tier: string;
  ecoStars: number;
  hardBrakingCount: number;
  overspeedEvents: number;
  rapidAccelCount: number;
  idleMinutes: number;
  ecoSavingsLiters: number;
  safetyBonusVND: number;
  courseRecommendation: string;
}

export interface DeliveryException {
  id: number;
  orderCode: string;
  customerName: string;
  type: 'CUSTOMER_UNAVAILABLE' | 'WRONG_ADDRESS' | 'DAMAGED_GOODS' | 'SHORT_DELIVERY' | 'REFUSED' | 'VEHICLE_BREAKDOWN' | 'TRAFFIC_DELAY';
  reportedAt: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  note: string;
}

export interface MaintenanceRecord {
  id: number;
  vehiclePlate: string;
  serviceType: string;
  scheduledDate: string;
  estimatedCost: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  notes: string;
}

export interface LogisticsKPIs {
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  availableDrivers: number;
  totalOrders: number;
  deliveredOrders: number;
  inTransitOrders: number;
  totalFreightCost: number;
  totalFuelCost: number;
  onTimeRate: number;
}

/**
 * Định dạng tiền tệ VNĐ chuẩn Enterprise (Dấu chấm phân cách hàng nghìn)
 */
export const formatVND = (amount?: number): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Định dạng số học thẳng cột tabular-nums
 */
export const formatNumber = (num?: number, decimals: number = 0): string => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Render Badge trạng thái Lệnh Vận Chuyển Transport Order với WCAG AA Dark Mode
 */
export const renderTransportStatusBadge = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
          Nháp (Draft)
        </span>
      );
    case 'PLANNED':
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
          PLANNED - Chờ điều xe
        </span>
      );
    case 'ASSIGNED':
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
          ASSIGNED - Đã gán xế
        </span>
      );
    case 'DISPATCHED':
    case 'IN_TRANSIT':
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
          IN_TRANSIT - Đang chạy
        </span>
      );
    case 'DELIVERED':
    case 'POD_CONFIRMED':
    case 'COMPLETED':
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
          DELIVERED - Đã ký POD
        </span>
      );
    case 'FAILED':
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
          FAILED - Thất bại
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {status}
        </span>
      );
  }
};

