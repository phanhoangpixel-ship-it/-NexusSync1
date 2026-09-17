export interface SerialTimelineEvent {
    id: string;
    timestamp: string;
    type: 'CREATED' | 'QC_PASSED' | 'TRANSFER' | 'SOLD' | 'WARRANTY_START' | 'MAINTENANCE' | 'DEFECT' | 'RETURNED';
    title: string;
    description: string;
    actor: string;
    referenceDoc?: string;
    location?: string;
}

export interface SerialItem {
    id: string;
    serialNumber: string;
    sku: string;
    productName: string;
    category: string;
    warehouse: string;
    status: 'IN_STOCK' | 'SOLD' | 'WARRANTY' | 'DEFECTIVE' | 'IN_USE';
    customerName?: string;
    orderNumber?: string;
    warrantyStart?: string;
    warrantyEnd?: string;
    warrantyMonths?: number;
    manufactureDate: string;
    notes?: string;
    timeline?: SerialTimelineEvent[];
}

export interface SerialProfile {
    id: string;
    code: string;
    name: string;
    categoryType: string;
    warrantyMonths: number;
    prefix: string;
    description: string;
}

export interface M23SerialsWorkspaceProps {
    onSelectEntity?: (entity: any) => void;
    onNotify: (type: 'success' | 'warning' | 'error' | 'info' | 'danger', title: string, message: string) => void;
    onNavigate?: (routeOrModule: string) => void;
}
