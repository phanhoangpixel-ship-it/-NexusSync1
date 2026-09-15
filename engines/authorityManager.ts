import { db } from "../src/db";
import { roles, users, processInstances, processInstanceSteps, permissions, rolePermissions } from "../src/db/schema";
import { eq, and } from "drizzle-orm";

export class AuthorityManager {
  /**
   * Resolves required roles for standard end-to-end process transitions
   */
  static async resolveRequiredRoles(processDefinitionKey: string): Promise<string[]> {
    const roleMapping: Record<string, string[]> = {
      'PROCURE_TO_PAY': ['PURCHASING_MANAGER', 'INVENTORY_MANAGER', 'FINANCE_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'purchase', 'manager', 'admin', 'cfo'],
      'ORDER_TO_CASH': ['SALES_MANAGER', 'INVENTORY_MANAGER', 'FINANCE_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'sales', 'manager', 'admin', 'cfo'],
      'STOCKTAKE_TO_GL': ['INVENTORY_MANAGER', 'FINANCE_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'warehouse', 'manager', 'admin', 'cfo'],
      'PLAN_TO_PRODUCE': ['PRODUCTION_MANAGER', 'INVENTORY_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'production', 'warehouse', 'manager', 'admin'],
      'RECORD_TO_REPORT': ['FINANCE_MANAGER', 'ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'cfo', 'finance', 'manager', 'admin'],
      'ISSUE_TO_EXPENSE': ['INVENTORY_MANAGER', 'FINANCE_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'warehouse', 'manager', 'admin', 'cfo']
    };
    return roleMapping[processDefinitionKey] || ['ADMIN', 'SUPER_ADMIN', 'admin'];
  }

  /**
   * Validates if a user has authority to transition a process instance step
   */
  static async validateTransitionAuthority(userId: string | number, processDefinitionKey: string, stepId: string): Promise<boolean> {
    const requiredRoles = await this.resolveRequiredRoles(processDefinitionKey);
    
    // Direct role check if userId is passed as role string directly
    if (typeof userId === 'string' && isNaN(Number(userId))) {
      const normRole = userId.toLowerCase();
      if (normRole === 'admin' || normRole === 'super_admin' || normRole === 'cfo') return true;
      return requiredRoles.some(r => r.toLowerCase() === normRole || r === userId);
    }

    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // Fetch the user and their role
    const [user] = await db.select({
      roleName: roles.name
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, numericUserId))
    .limit(1);

    const userRoleName = (user?.roleName || 'USER').toString();
    const normalizedUserRole = userRoleName.toLowerCase();
    
    const isSuperAdmin = userRoleName === 'SUPER_ADMIN' || normalizedUserRole === 'super_admin' || userRoleName === 'ADMIN' || normalizedUserRole === 'admin';
    const hasAuthority = isSuperAdmin || requiredRoles.some(r => r.toLowerCase() === normalizedUserRole || r === userRoleName);

    if (!hasAuthority) {
      console.warn(`[AuthorityManager] User ${userId} (${userRoleName}) denied transition for ${processDefinitionKey} at step ${stepId}`);
    }

    return hasAuthority;
  }

  /**
   * Validates Inventory mutation authority
   */
  static async validateInventoryAuthority(userId: number, action: 'POST' | 'ADJUST' | 'STOCKTAKE' | 'TRANSFER'): Promise<boolean> {
    const [user] = await db.select({ roleName: roles.name })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId))
      .limit(1);

    const role = (user?.roleName || 'USER').toString();
    const norm = role.toLowerCase();
    const isSuper = role === 'SUPER_ADMIN' || norm === 'super_admin' || role === 'ADMIN' || norm === 'admin';
    if (isSuper) return true;

    const allowedRoles: Record<string, string[]> = {
      'POST': ['INVENTORY_MANAGER', 'WAREHOUSE_STAFF', 'ADMIN', 'SUPER_ADMIN', 'warehouse', 'manager', 'admin'],
      'ADJUST': ['INVENTORY_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'warehouse', 'manager', 'admin'],
      'STOCKTAKE': ['INVENTORY_MANAGER', 'AUDITOR', 'ADMIN', 'SUPER_ADMIN', 'warehouse', 'manager', 'admin'],
      'TRANSFER': ['INVENTORY_MANAGER', 'WAREHOUSE_STAFF', 'LOGISTICS_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'warehouse', 'logistics', 'manager', 'admin']
    };

    const allowed = allowedRoles[action] || ['ADMIN', 'SUPER_ADMIN', 'admin'];
    return allowed.some(r => r.toLowerCase() === norm || r === role);
  }

  /**
   * Validates Costing Engine recalculation / closing authority
   */
  static async validateCostingAuthority(userId: number, action: 'CALCULATE' | 'CLOSE_PERIOD' | 'OVERRIDE'): Promise<boolean> {
    const [user] = await db.select({ roleName: roles.name })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId))
      .limit(1);

    const role = (user?.roleName || 'USER').toString();
    const norm = role.toLowerCase();
    if (role === 'SUPER_ADMIN' || norm === 'super_admin' || role === 'ADMIN' || norm === 'admin') return true;
    const allowed = ['FINANCE_MANAGER', 'COST_ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'cfo', 'finance', 'manager', 'admin'];
    return allowed.some(r => r.toLowerCase() === norm || r === role);
  }

  /**
   * Validates General Ledger & Journal Entry posting authority
   */
  static async validateAccountingAuthority(userId: number, action: 'POST_JOURNAL' | 'REVERSE_JOURNAL' | 'PERIOD_CLOSE'): Promise<boolean> {
    const [user] = await db.select({ roleName: roles.name })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId))
      .limit(1);

    const role = (user?.roleName || 'USER').toString();
    const norm = role.toLowerCase();
    if (role === 'SUPER_ADMIN' || norm === 'super_admin' || role === 'ADMIN' || norm === 'admin') return true;
    const allowed = ['FINANCE_MANAGER', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'cfo', 'finance', 'accountant', 'manager', 'admin'];
    return allowed.some(r => r.toLowerCase() === norm || r === role);
  }
}

