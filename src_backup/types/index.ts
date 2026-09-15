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

export type { ModuleDefinition, EnvironmentProfile } from '../config/moduleRegistry';
export * from './workspace';
export * from './salesOrderIntegration';

