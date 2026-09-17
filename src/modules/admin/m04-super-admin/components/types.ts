export type SuperAdminSubTab =
  | 'roles'
  | 'matrix'
  | 'permissions'
  | 'users'
  | 'sessions'
  | 'rls_tenant'
  | 'audit'
  | 'diagnostics';

export type SecurityTier = 'TIER_1_SOVEREIGN' | 'TIER_2_GOVERNANCE' | 'TIER_3_OPERATIONAL';

export type StandardRbacAction = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'APPROVE' | 'EXPORT';

export interface RbacRole {
  id: number;
  code: string;
  name: string;
  description: string;
  tier: SecurityTier;
  isSystem: boolean;
  userCount: number;
  permissionsCount: number;
  permissions: string[];
  allowedBranches: string[];
  approvalThresholdVND?: number;
  parentRoleId?: number | null;
  status: 'ACTIVE' | 'LOCKED';
  updatedAt: string;
  auditChecksum: string;
}

export interface RbacPermission {
  id: number;
  code: string;
  name: string;
  category: 'CORE' | 'FINANCE' | 'SUPPLY_CHAIN' | 'MANUFACTURING' | 'SALES' | 'GOVERNANCE';
  moduleId: string;
  endpoint: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'STANDARD';
  assignedRolesCount: number;
  description: string;
  action: 'READ' | 'WRITE' | 'APPROVE' | 'DELETE' | 'FULL';
}

export interface RbacUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  roleId: number;
  roleCode: string;
  roleName: string;
  branchScope: string;
  branchName: string;
  allowedBranches?: string[];
  status: 'ACTIVE' | 'LOCKED' | 'SUSPENDED';
  lastLogin: string;
  mfaEnabled: boolean;
  avatarBg: string;
  forcePasswordChange?: boolean;
}

export interface SodDiagnosticRule {
  id: string;
  code: string;
  name: string;
  category: string;
  riskSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  conflictingPermissions: string[];
  status: 'PASSED' | 'VIOLATION' | 'INVESTIGATING';
  violationCount: number;
  details: string;
  lastAudited: string;
  remediationGuide: string;
}

export interface RbacSession {
  id: string;
  userId: number;
  username: string;
  fullName: string;
  roleCode: string;
  ipAddress: string;
  device: string;
  browser: string;
  loginTime: string;
  lastActive: string;
  mfaVerified: boolean;
  tokenChecksum: string;
  isCurrent: boolean;
}

export interface RbacAuditEntry {
  id: string;
  actorUsername: string;
  actorName: string;
  actionType: string;
  targetType: string;
  targetCode: string;
  oldValue: string;
  newValue: string;
  reason: string;
  ipAddress: string;
  timestamp: string;
  sha256Checksum: string;
}

export interface RbacDelegation {
  id: string;
  delegatorUsername: string;
  delegatorName: string;
  delegateeUsername: string;
  delegateeName: string;
  moduleScopes: string[];
  branchScope: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface PasswordPolicyConfig {
  minLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  expiryDays: number;
  forceFirstChange: boolean;
  mfaEnforcedRoles: string[];
}

export interface TenantBranch {
  id: number;
  code: string;
  name: string;
  glCode: string;
  defaultWarehouse: string;
  manager: string;
  creditLimit: number;
  createdAt: string;
}

export interface ModulePermissionMatrixRow {
  moduleId: string;
  moduleName: string;
  category: string;
  actions: Record<StandardRbacAction, boolean>;
  legacyCodeMapping: string[];
}

export interface SuperAdminDetailItem {
  type: 'ROLE' | 'USER' | 'PERMISSION' | 'SOD_RULE' | 'SESSION' | 'AUDIT' | 'DELEGATION';
  data: any;
}
