export interface M15ReturnsRMAWorkspaceProps {
    onSelectEntity: (entity: SelectedEntityContext) => void;
    onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
    guidedTask?: { item: any; timestamp: number } | null;
}

export interface RmaRecord {
    id: string;
    dbId?: number;
    rmaNumber?: string;
    customerName: string;
    customerId?: number;
    originalSo: string;
    orderCode?: string;
    orderId?: number;
    deliveryCode: string;
    productCode: string;
    productName: string;
    quantity: number;
    uom: string;
    lotSerial: string;
    warehouseId?: number;
    reason: string;
    requestedResolution: string;
    status: 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'REFUNDED' | 'RESTOCKED' | 'CLOSED';
    inspectionResult: 'PENDING' | 'GOOD' | 'DEFECTIVE' | 'DAMAGED' | 'PASSED' | 'REJECTED';
    disposition: 'PENDING' | 'RESTOCK' | 'REPAIR' | 'REPLACE' | 'SCRAP' | 'RETURN_TO_VENDOR' | 'CREDIT';
    financialStatus: 'PENDING' | 'CREDIT_NOTE_ISSUED' | 'REFUNDED' | 'RECONCILED';
    warrantyStatus?: 'VALID' | 'EXPIRED' | 'VOID_TAMPERED';
    returnWindowDays?: number;
    fraudScore?: number;
    fraudFlags?: any;
    rtvReferenceCode?: string | null;
    maintenanceWoCode?: string | null;
    refundChannel?: 'CREDIT_NOTE_M31' | 'CASH_M32';
    isImmutable?: boolean;
    isLocked?: boolean;
    refundMethod?: string;
    totalAmount?: number;
    refundedAmount?: number;
    creditNoteNumber?: string | null;
    inspectionNotes?: string | null;
    inspectedBy?: string | number | null;
    inspectedAt?: string | null;
    approvedBy?: string | number | null;
    approvedAt?: string | null;
    completedAt?: string | null;
    rejectedAt?: string | null;
    rejectionReason?: string | null;
    vaultDocumentCode?: string | null;
    items?: any[];
    date: string;
    _raw?: any;
}
