/**
 * M24: WMS Extended Domain Types and State Machines
 * Wave Picking, Pallet/LPN Management, Dock Scheduling
 * Conforms to NexusSync ERP Architecture & State Transitions
 */

// ==========================================
// 1. Wave Picking State Machine
// ==========================================
export enum WavePickStatus {
  PLANNING = 'PLANNING',
  RELEASED_TO_PICKER = 'RELEASED_TO_PICKER',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
}

export type WavePickStatusType = keyof typeof WavePickStatus;

export const WAVE_STATUS_TRANSITIONS: Record<WavePickStatus, WavePickStatus[]> = {
  [WavePickStatus.PLANNING]: [WavePickStatus.RELEASED_TO_PICKER, WavePickStatus.CLOSED],
  [WavePickStatus.RELEASED_TO_PICKER]: [WavePickStatus.IN_PROGRESS, WavePickStatus.PLANNING],
  [WavePickStatus.IN_PROGRESS]: [WavePickStatus.COMPLETED, WavePickStatus.CLOSED],
  [WavePickStatus.COMPLETED]: [WavePickStatus.CLOSED],
  [WavePickStatus.CLOSED]: [], // Immutable once closed
};

export enum WaveItemStatus {
  PENDING = 'PENDING',
  PICKING = 'PICKING',
  PICKED = 'PICKED',
  SHORT_PICK = 'SHORT_PICK',
  SKIPPED = 'SKIPPED',
}

// ==========================================
// 2. Pallet / LPN State Machine
// ==========================================
export enum LpnStatus {
  PACKING = 'PACKING',
  SEALED = 'SEALED',
  PUTAWAY = 'PUTAWAY',
  SHIPPED = 'SHIPPED',
}

export type LpnStatusType = keyof typeof LpnStatus;

export const LPN_STATUS_TRANSITIONS: Record<LpnStatus, LpnStatus[]> = {
  [LpnStatus.PACKING]: [LpnStatus.SEALED],
  [LpnStatus.SEALED]: [LpnStatus.PUTAWAY, LpnStatus.PACKING],
  [LpnStatus.PUTAWAY]: [LpnStatus.SHIPPED],
  [LpnStatus.SHIPPED]: [], // Immutable once shipped
};

// ==========================================
// 3. Dock Scheduling State Machine
// ==========================================
export enum DockAppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CHECKED_IN = 'CHECKED_IN',
  LOADING = 'LOADING',
  UNLOADING = 'UNLOADING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export type DockAppointmentStatusType = keyof typeof DockAppointmentStatus;

export const DOCK_STATUS_TRANSITIONS: Record<DockAppointmentStatus, DockAppointmentStatus[]> = {
  [DockAppointmentStatus.SCHEDULED]: [DockAppointmentStatus.CHECKED_IN, DockAppointmentStatus.CANCELLED],
  [DockAppointmentStatus.CHECKED_IN]: [DockAppointmentStatus.LOADING, DockAppointmentStatus.UNLOADING, DockAppointmentStatus.CANCELLED],
  [DockAppointmentStatus.LOADING]: [DockAppointmentStatus.COMPLETED, DockAppointmentStatus.CANCELLED],
  [DockAppointmentStatus.UNLOADING]: [DockAppointmentStatus.COMPLETED, DockAppointmentStatus.CANCELLED],
  [DockAppointmentStatus.COMPLETED]: [],
  [DockAppointmentStatus.CANCELLED]: [],
};

export enum DockType {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
  CROSS_DOCK = 'CROSS_DOCK',
}

// ==========================================
// 4. Domain Data Interfaces
// ==========================================
export interface WavePickEntity {
  id: number;
  waveCode: string;
  warehouseId: number;
  zoneCode: string;
  ordersCount: number;
  totalLines: number;
  status: WavePickStatus;
  progress: string;
  assignedPickerId?: number | null;
  createdAt: Date | string;
  items?: WavePickItemEntity[];
}

export interface WavePickItemEntity {
  id: number;
  waveId: number;
  sku: string;
  productName: string;
  requestedQty: number;
  pickedQty: number;
  assignedBin?: string | null;
  lotNo?: string | null;
  serialNo?: string | null;
  status: WaveItemStatus;
}

export interface LpnEntity {
  id: number;
  lpnCode: string;
  cartonSize: string;
  weight: string;
  soCode?: string | null;
  status: LpnStatus;
  warehouseId?: number | null;
  locationId?: number | null;
  createdAt: Date | string;
  contents?: LpnContentEntity[];
}

export interface LpnContentEntity {
  id: number;
  lpnId: number;
  sku: string;
  productName: string;
  quantity: number;
  lotNo?: string | null;
  serialNo?: string | null;
}

export interface DockAppointmentEntity {
  id: number;
  appointmentCode: string;
  dockName: string;
  dockType: DockType;
  carrier: string;
  poCode?: string | null;
  soCode?: string | null;
  timeSlot: string;
  status: DockAppointmentStatus;
  checkInTime?: Date | string | null;
  checkOutTime?: Date | string | null;
  idleAlertTriggered?: boolean;
  createdAt: Date | string;
}
