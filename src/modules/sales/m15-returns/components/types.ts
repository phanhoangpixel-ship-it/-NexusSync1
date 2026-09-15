export interface M15ReturnsRMAWorkspaceProps {
    onSelectEntity: (entity: SelectedEntityContext) => void;
    onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
    guidedTask?: { item: any; timestamp: number } | null;
}

export interface RmaRecord {
    id: string;
    customerName: string;
    originalSo: string;
    deliveryCode: string;
    productCode: string;
    productName: string;
    quantity: number;
    uom: string;
    lotSerial: string;
    reason: string;
    requestedResolution: string;
    status: 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
    inspectionResult: 'PENDING' | 'GOOD' | 'DEFECTIVE' | 'DAMAGED' | 'PASSED' | 'REJECTED';
    disposition: 'PENDING' | 'RESTOCK' | 'REPAIR' | 'REPLACE' | 'SCRAP' | 'RETURN_TO_VENDOR' | 'CREDIT';
    financialStatus: 'PENDING' | 'CREDIT_NOTE_ISSUED' | 'REFUNDED' | 'RECONCILED';
    date: string;
    _raw?: any;
}
