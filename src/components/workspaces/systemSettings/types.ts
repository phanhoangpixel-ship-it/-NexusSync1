export type SystemSettingsSubTab = 'parameters' | 'branches' | 'profiles' | 'integrity' | 'costing';

export interface PermissionCell {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface ModulePermissionRule {
  moduleId: string;
  moduleName: string;
  category: string;
  roles: {
    admin: PermissionCell;
    manager: PermissionCell;
    accountant: PermissionCell;
    warehouse: PermissionCell;
    sales: PermissionCell;
  };
}

export interface SystemSettingsConfig {
  companyName: string;
  taxCode: string;
  baseCurrency: string;
  fiscalYearStart: string;
  timezone: string;
  thousandSeparator: string;
  decimalSeparator: string;
  maintenanceMode: boolean;
  debugLogging: boolean;
  autoBackupDaily: boolean;
}

export interface ApprovalLimitPolicy {
  role: string;
  maxLimit: string;
  autoApprove: boolean;
}

export interface SlaRulePolicy {
  taskType: string;
  targetHours: number;
  urgentThreshold: number;
}

export interface ActiveSession {
  id: string;
  user: string;
  ip: string;
  device: string;
  loginTime: string;
  status: 'ACTIVE' | 'SUSPICIOUS';
  role: string;
  location?: string;
  sessionDuration?: string;
}

export interface DiagnosticItem {
  id: number;
  component: string;
  status: string;
  latency: string;
  result: string;
  message: string;
  checkedAt: string;
  details?: string;
}

export interface BranchMetadata {
  type: string;
  address: string;
  taxCode: string;
  warehouses: string[];
  ledger: string;
  prefix: string;
  region: string;
  manager: string;
  staffCount: number;
  phone?: string;
  email?: string;
}

export type SettingsDetailItem =
  | { type: 'SESSION'; data: ActiveSession }
  | { type: 'BRANCH'; data: { id: string; name: string; code: string; isDefault?: boolean; meta: BranchMetadata } }
  | { type: 'DIAGNOSTIC'; data: DiagnosticItem };
