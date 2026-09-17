export type SystemSettingsSubTab =
  | 'parameters'
  | 'currency_tax'
  | 'numbering'
  | 'fiscal_backup'
  | 'features_notify'
  | 'branches'
  | 'profiles'
  | 'integrity'
  | 'costing'
  | 'audit';

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
  companyAddress?: string;
  companyLogoUrl?: string;
  invoiceIssuerInfo?: string;
  baseCurrency: string;
  fiscalYearStart: string;
  dateFormat?: string;
  timeFormat?: string;
  timezone: string;
  thousandSeparator: string;
  decimalSeparator: string;
  maintenanceMode: boolean;
  debugLogging: boolean;
  autoBackupDaily: boolean;
  // Default values
  defaultWarehouseId?: string;
  defaultPaymentTermDays?: number;
  defaultBranchCode?: string;
  // Rounding rules
  currencyDecimals?: number;
  unitPriceDecimals?: number;
  quantityDecimals?: number;
  roundingMethod?: 'HALF_UP' | 'FLOOR' | 'CEIL';
}

export interface CurrencyRate {
  id?: number;
  currencyCode: string;
  currencyName: string;
  buyRate: number | string;
  sellRate: number | string;
  standardRate: number | string;
  effectiveDate: string;
  source: string;
  isDefault?: boolean;
  isActive: boolean;
  updatedBy?: string;
}

export interface DocumentSequence {
  id?: number;
  docType: string;
  docName: string;
  prefix: string;
  dateFormat: 'YYYY' | 'YYYYMM' | 'NONE';
  separator: string;
  padding: number;
  currentNumber: number;
  branchCode: string;
  resetCycle: 'YEARLY' | 'MONTHLY' | 'NEVER';
  samplePreview?: string;
  isActive: boolean;
  updatedAt?: string;
}

export interface FiscalPeriod {
  id?: number;
  periodCode: string;
  fiscalYear: number;
  periodNumber: number;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'LOCKED' | 'CLOSED';
  closingDate?: string | null;
  closedBy?: string | null;
  notes?: string | null;
}

export interface SystemTaxRate {
  id?: number;
  taxCode: string;
  taxName: string;
  ratePercentage: number;
  effectiveFrom: string;
  isDefault: boolean;
  applicableType: 'ALL' | 'GOODS' | 'SERVICES';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface FeatureFlag {
  id?: number;
  flagKey: string;
  flagName: string;
  description: string;
  isEnabled: boolean;
  category: 'CORE' | 'EXPERIMENTAL' | 'INTEGRATION' | 'FINANCE' | 'LOGISTICS';
  targetBranch: string;
}

export interface SettingsAuditRecord {
  id: number;
  configGroup: string;
  action: string;
  configKey: string;
  oldValue?: string | null;
  newValue: string;
  effectiveDate?: string | null;
  performedBy: string;
  ipAddress?: string;
  checksumSha256: string;
  timestamp: string;
}

export interface NotificationTemplate {
  id?: number;
  templateCode: string;
  templateName: string;
  eventTrigger: string;
  channel: 'IN_APP' | 'EMAIL' | 'SMS';
  subject: string;
  templateBody: string;
  placeholders: string;
  isActive: boolean;
}

export interface ApprovalLimitPolicy {
  role: string;
  maxLimit: string;
  autoApprove: boolean;
  scope?: string;
  tierLevel?: number;
}

export interface SlaRulePolicy {
  taskType: string;
  targetHours: number;
  urgentThreshold: number;
  escalationRole?: string;
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
  | { type: 'DIAGNOSTIC'; data: DiagnosticItem }
  | { type: 'CURRENCY'; data: CurrencyRate }
  | { type: 'SEQUENCE'; data: DocumentSequence }
  | { type: 'FISCAL'; data: FiscalPeriod }
  | { type: 'AUDIT'; data: SettingsAuditRecord };
