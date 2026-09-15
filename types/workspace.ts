export interface WorkItemAction {
  id: string;
  label: string;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  variant?: 'primary' | 'danger' | 'secondary' | 'warning' | 'default';
}

export interface WorkspaceWorkItem {
  id: string;
  sourceModule: string;
  type: 'TASK' | 'APPROVAL' | 'ALERT' | 'EXCEPTION';
  entity: string;
  entityId: string | number;
  businessReference: string;
  title: string;
  description?: string;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  owner?: {
    role: string;
    department: string;
  };
  requiredPermission?: string;
  targetRoute: string;
  createdAt: string;
  dueAt?: string;
  slaHours?: number;
  isOverdue?: boolean;
  isEscalated?: boolean;
  delegatedFrom?: string;
  isBlocked?: boolean;
  blockedReason?: string;
  amount?: number;
  currency?: string;
  actions?: WorkItemAction[];
}

export interface WorkspaceSummary {
  taskCount: number;
  approvalCount: number;
  alertCount: number;
  exceptionCount: number;
  notificationCount: number;
  overdueCount: number;
  highPriorityCount: number;
  blockedCount: number;
  totalPendingValue: number;
  roleMetrics?: {
    managementApprovals: number;
    financePendingInvoices: number;
    warehouseMovements: number;
    salesOrdersPending: number;
    procurementOrdersPending: number;
    operationsQualityHolds: number;
    [key: string]: number;
  };
}

export interface WorkspaceEntityPreview {
  type: string;
  id: string | number;
  code: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  details: Record<string, any>;
  items?: any[];
  lineage?: Array<{
    id: string;
    type: string;
    code: string;
    relation: string;
    status: string;
  }>;
  auditTrail?: Array<{
    id: number;
    action: string;
    timestamp: string;
    user: string;
    sha256Checksum?: string;
  }>;
  glEntries?: Array<{
    account: string;
    accountName?: string;
    debit: number;
    credit: number;
    description: string;
  }>;
}

export interface ProcessControlChainStep {
  key: string;
  name: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'BLOCKED';
  ownerRole: string;
  completedAt?: string;
  referenceDoc?: string;
}

export interface ProcessControlChain {
  id: string;
  code: string;
  title: string;
  status: 'ACTIVE' | 'BLOCKED' | 'COMPLETED';
  steps: ProcessControlChainStep[];
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  actionLabel: string;
  businessReference: string;
  entity: string;
  sourceModule: string;
  endpoint: string;
  status: 'SUCCESS' | 'FAILURE';
  userName?: string;
  userRole?: string;
  statusCode?: number;
  reason?: string;
  details?: Record<string, any>;
  durationMs?: number;
}

export interface OmnibarSearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'MODULE' | 'DOCUMENT' | 'PRODUCT' | 'ACTION';
  route: string;
  badge?: string;
  metadata?: Record<string, any>;
}
