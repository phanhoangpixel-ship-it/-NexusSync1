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
    referenceNo: string;
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

export interface WarehouseOutboundTabProps {
    onSelectEntity?: (entity: SelectedEntityContext) => void;
    onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message?: string) => void;
}

export interface WarehouseFacilityItem {
    id: number | string;
    code: string;
    name: string;
    type: 'MAIN' | 'BRANCH' | 'STORE' | 'TRANSIT' | 'COLD' | 'BONDED' | string;
    typeName: string;
    address: string;
    description?: string;
    isActive: boolean;
    isDefault: boolean;
    zonesCount: number;
    racksCount: number;
    binsCount: number;
    physicalStock: number;
    reservedStock: number;
    availableStock: number;
    totalStockValue: number;
    occupancyRate: number;
    storageCapacityM2: number;
    managerName: string;
    contactPhone: string;
    lastAuditDate: string;
}

export interface WarehouseKpiMetrics {
    totalWarehouses: number;
    activeWarehouses: number;
    totalZones: number;
    totalRacks: number;
    totalBins: number;
    totalPhysicalStock: number;
    totalReservedStock: number;
    totalAvailableStock: number;
    totalStockValue: number;
    averageOccupancy: number;
    inventoryHealthRate: number;
    calculatedAt: string;
}

export interface WarehouseFacilitiesMasterTabProps {
    onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
    onSelectEntity?: (entity: any) => void;
}
