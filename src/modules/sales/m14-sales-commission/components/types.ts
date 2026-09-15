export interface M14SalesCommissionWorkspaceProps {
    onSelectEntity: (entity: SelectedEntityContext) => void;
    onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export interface RuleTier {
    id: string;
    minRev: number;
    maxRev: number;
    rate: number;
    desc: string;
}

export interface PayoutRecord {
    id: string;
    salesRep: string;
    department: string;
    closedRevenue: number;
    appliedPlan: string;
    commissionRate: string;
    commissionAmount: number;
    status: 'PENDING_APPROVAL' | 'APPROVED' | 'PAID';
    payoutDate: string;
}

export interface AllocationRecord {
    id: string;
    dealCode: string;
    totalDealValue: string;
    primaryRep: string;
    supportingReps: string;
    status: 'ALLOCATED' | 'PENDING_SPLIT';
}

export interface ClawbackRecord {
    id: string;
    originalDeal: string;
    salesRep: string;
    returnReason: string;
    refundedAmount: string;
    clawbackAmount: string;
    status: 'PENDING_DEDUCTION' | 'DEDUCTED_NEXT_PAYOUT';
}
