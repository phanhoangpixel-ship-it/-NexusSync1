import { SelectedEntityContext } from '../../../../types';

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

export interface CommissionPlan {
  id: number;
  planCode: string;
  name: string;
  description?: string;
  calculationBasis: 'ORDER_CONFIRMED' | 'INVOICE_ISSUED' | 'PAYMENT_COLLECTED' | 'GROSS_MARGIN';
  payoutFrequency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  isDefault: boolean;
  rules?: CommissionRule[];
}

export interface CommissionRule {
  id: number;
  planId: number;
  ruleName: string;
  ruleType: 'FLAT_RATE' | 'TIERED_AMOUNT' | 'TIERED_PERCENT' | 'MARGIN_PERCENT' | 'ACCELERATOR';
  minThreshold: number;
  maxThreshold?: number | null;
  ratePercent: number;
  fixedAmount: number;
  acceleratorMultiplier: number;
  priorityOrder: number;
}

export interface CommissionCalculationRecord {
  id: number;
  calculationCode: string;
  salesOrderId?: number;
  salesOrderCode?: string;
  invoiceId?: number;
  invoiceNumber?: string;
  salesPersonId: number;
  salesRepName?: string;
  planId?: number;
  planName?: string;
  calculationBasis: 'REVENUE' | 'GROSS_MARGIN';
  revenueAmount: number;
  cogsAmount: number;
  marginAmount: number;
  marginPercent: number;
  baseAmount: number;
  ratePercent: number;
  acceleratorMultiplier: number;
  commissionAmount: number;
  isClawback: boolean;
  triggerEvent: string;
  status: 'ACCRUED' | 'ELIGIBLE' | 'SETTLED' | 'CLAWED_BACK' | 'VOIDED';
  calculationDate: string;
  payoutId?: number;
  notes?: string;
  createdAt: string;
}

export interface ClawbackItem {
  id: number;
  calculationCode: string;
  salesOrderId?: number;
  salesReturnId?: number;
  rmaId?: number;
  rmaCode?: string;
  salesPersonId: number;
  salesRepName?: string;
  baseAmount: number;
  ratePercent: number;
  commissionAmount: number;
  status: string;
  calculationDate: string;
  notes?: string;
  createdAt: string;
}

export interface CommissionDisputeRecord {
  id: number;
  disputeCode: string;
  calculationId?: number;
  payoutId?: number;
  salesPersonId: number;
  salesRepName?: string;
  disputedAmount: number;
  expectedAmount: number;
  reason: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_ADJUSTED' | 'RESOLVED_REJECTED' | 'CANCELLED';
  resolutionNotes?: string;
  resolvedBy?: number;
  resolvedAt?: string;
  createdAt: string;
}

export interface CommissionPayoutBatch {
  id: number;
  payoutCode: string;
  title: string;
  period: string;
  startDate: string;
  endDate: string;
  totalGrossAmount: number;
  totalClawbackAmount: number;
  totalNetAmount: number;
  totalBeneficiaries: number;
  status: 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'PAID' | 'CANCELLED';
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'PAYROLL_INTEGRATION';
  accountingEntryId?: number;
  payoutAccountingEntryId?: number;
  notes?: string;
  items?: CommissionPayoutItemRecord[];
  createdAt: string;
}

export interface CommissionPayoutItemRecord {
  id: number;
  payoutId: number;
  salesPersonId: number;
  salesRepName?: string;
  department?: string;
  grossCommission: number;
  clawbackDeductions: number;
  netPayoutAmount: number;
  paymentStatus: string;
  bankAccountInfo?: string;
  notes?: string;
}

export interface SalesQuotaRecord {
  id: number;
  quotaCode: string;
  userId: number;
  salesRepName?: string;
  period: string;
  startDate: string;
  endDate: string;
  targetRevenue: number;
  targetQuantity: number;
  actualRevenue: number;
  actualQuantity: number;
  attainmentPercent: number;
  acceleratorMultiplier: number;
  status: string;
  notes?: string;
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
