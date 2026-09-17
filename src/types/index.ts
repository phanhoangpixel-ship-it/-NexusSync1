export interface UserSession {
  id: number;
  username: string;
  name: string;
  role: string;
  department: string;
  token?: string;
  permissions?: string[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: number;
  module?: string;
  link?: string;
}

export type ToastNotification = ToastMessage;

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning' | 'info';
  type?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface LineageNode {
  id: string;
  type: string;
  code: string;
  relation: string;
  status: string;
  date?: string;
}

export interface AuditLogItem {
  id?: number | string;
  action: string;
  timestamp: string;
  user: string;
  sha256Checksum?: string;
}

export interface LedgerPreviewEntry {
  id?: string | number;
  account: string;
  accountName?: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface SelectedEntityContext {
  type?: string;
  id?: string | number;
  code?: string;
  title?: string;
  name?: string;
  status?: string;
  subtitle?: string;
  entityType?: string;
  entityId?: string | number;
  entityCode?: string;
  module?: string;
  data?: any;
  lineage?: LineageNode[];
  auditTrail?: AuditLogItem[];
  glEntries?: LedgerPreviewEntry[];
}

export type TransferVarianceReason = 'DAMAGE_IN_TRANSIT' | 'LOST_IN_TRANSIT' | 'COUNTING_ERROR' | 'THEFT' | 'EXCESS';

export type TransferApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface TransferPartialReceiptItem {
  itemId: number | string;
  receivedQty: number;
  varianceReason?: TransferVarianceReason;
  notes?: string;
  serialNumbers?: string[];
}

export interface TransferPartialReceiptPayload {
  transferId: number | string;
  receivedItems: TransferPartialReceiptItem[];
  receiverId: number | string;
  notes?: string;
}

export interface TransferVarianceItem {
  itemId: number | string;
  varianceQty: number;
  varianceReason: TransferVarianceReason;
  adjustmentType: string;
  notes?: string;
}

export interface TransferVarianceReconciliationPayload {
  transferId: number | string;
  reconciliationItems: TransferVarianceItem[];
  userId: number | string;
}

export interface TransferApproveVariancePayload {
  transferId: number | string;
  approvalStatus: TransferApprovalStatus;
  approverId: number | string;
  approvalNotes?: string;
}

export interface StocktakeCyclePlanPayload {
  warehouseId: number | string;
  abcClass?: 'A' | 'B' | 'C' | 'ALL';
  scheduledDate?: string;
  assigneeId?: number | string;
}

export type StocktakeEscalationStatus = 'NORMAL' | 'RECOUNT_REQUIRED' | 'ESCALATED_MANAGER';

export interface StocktakeItemExtension {
  id?: number | string;
  stocktakeId: number | string;
  productId: number | string;
  systemQuantity: number;
  countQuantity?: number;
  variance?: number;
  abcClass?: 'A' | 'B' | 'C';
  recountCount?: number;
  escalationStatus?: StocktakeEscalationStatus;
  serialNumber?: string;
  lotNumber?: string;
}

export interface StocktakeVarianceSummaryReport {
  stocktakeId: number | string;
  code: string;
  warehouseId: number | string;
  totalItems: number;
  varianceItemsCount: number;
  totalVarianceValue: number;
  abcBreakdown: {
    A: { count: number; varianceValue: number };
    B: { count: number; varianceValue: number };
    C: { count: number; varianceValue: number };
  };
}

export type { ModuleDefinition, EnvironmentProfile } from '../config/moduleRegistry';
export * from './workspace';
export * from './salesOrderIntegration';

