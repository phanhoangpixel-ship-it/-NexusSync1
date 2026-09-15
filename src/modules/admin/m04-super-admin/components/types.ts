export type SuperAdminSubTab = 'roles' | 'permissions' | 'users' | 'diagnostics';

export type SecurityTier = 'TIER_1_SOVEREIGN' | 'TIER_2_GOVERNANCE' | 'TIER_3_OPERATIONAL';

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
  status: 'ACTIVE' | 'LOCKED' | 'SUSPENDED';
  lastLogin: string;
  mfaEnabled: boolean;
  avatarBg: string;
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

export interface SuperAdminDetailItem {
  type: 'ROLE' | 'USER' | 'PERMISSION' | 'SOD_RULE';
  data: any;
}
