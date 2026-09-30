/**
 * M01 Workspace Hub & Global Orchestration - API Adapter Layer
 * 
 * Centralized client-side service for all M01 read-models, operational work items,
 * and observability projections. Strict adherence to Single-Writer domain authority:
 * M01 only reads, aggregates, and dispatches actions to authoritative domain services.
 */

import { WorkspaceSummary, WorkspaceWorkItem } from '../../../../types/workspace';

export interface ModuleTopologyItem {
  moduleId: string;
  moduleName: string;
  group: string;
  route: string;
  workspaceId: string | null;
  registryOnly: boolean;
  hasActivityToday: boolean;
  efficiencyScore: number | null;
  totalActions: number;
  errorCount: number;
}

export interface ObservabilityHealthData {
  date: string;
  snapshotComputed?: boolean;
  warning?: string;
  projectorBackpressure?: {
    active: boolean;
    consecutiveBusyErrors: number;
    consecutiveSuccess: number;
    skippedCycles?: number;
  };
  systemScore: number;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  totalModulesInRegistry: number;
  modulesWithActivityToday: number;
  greenModules: number;
  yellowModules: number;
  redModules: number;
  note?: string;
}

export interface ModuleTrendDetail {
  moduleCode: string;
  moduleName: string;
  currentScore: number | null;
  baselineAvg: number | null;
  dataPointsUsed: number;
  trendStatus: 'IMPROVING' | 'DEGRADING' | 'STABLE' | 'INSUFFICIENT_DATA' | 'NO_DATA';
  dataPoints: Array<{
    snapshotDate: string;
    efficiencyScore: number;
    totalActions: number;
  }>;
}

export interface FlowSpanItem {
  id: number;
  sourceType: 'AUDIT' | 'EVENT';
  sourceRefId: number;
  correlationId: string | null;
  moduleCode: string;
  moduleRaw: string;
  branchId: number | null;
  userId: number | null;
  actionName: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  occurredAt: string;
  durationMs: number | null;
  metadataMasked: string | null;
  sourceEventId: string | null;
  projectedAt: string;
}

export interface RcaChainResult {
  correlationId: string;
  spans: FlowSpanItem[];
  rootCause: FlowSpanItem | null;
  totalSpans: number;
  failedSpans: number;
}

export type EdgeSource = 'RUNTIME_SPAN' | 'TOPOLOGY' | 'MODULE_REGISTRY' | 'DOCUMENTATION';

export interface ProcessChainItem {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'OPTIMAL' | 'DEGRADED' | 'BLOCKED';
  totalSteps: number;
  currentStepIndex: number;
  steps: Array<{
    step: number;
    title: string;
    moduleCode: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'BLOCKED';
    ownerRole: string;
    route: string;
    authorityNote?: string;
  }>;
}

export const m01WorkspaceApi = {
  /**
   * Fetch executive workspace summary KPI
   */
  async getSummary(role = 'SUPER_ADMIN', branchId = 'BR_HO'): Promise<WorkspaceSummary> {
    const res = await fetch(`/api/workspace/summary?role=${encodeURIComponent(role)}&branchId=${encodeURIComponent(branchId)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch workspace summary: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Fetch active work queue items with full server-side filters
   */
  async getWorkItems(
    role = 'SUPER_ADMIN',
    branchId = 'BR_HO',
    params?: {
      moduleCode?: string;
      status?: string;
      type?: string;
      priority?: string;
      sla?: string;
      search?: string;
      assignedTo?: string;
      isSlaViolated?: boolean;
    }
  ): Promise<WorkspaceWorkItem[]> {
    let url = `/api/workspace/work-items?role=${encodeURIComponent(role)}&branchId=${encodeURIComponent(branchId)}`;
    if (params?.moduleCode && params.moduleCode !== 'ALL') url += `&moduleCode=${encodeURIComponent(params.moduleCode)}`;
    if (params?.status && params.status !== 'ALL') url += `&status=${encodeURIComponent(params.status)}`;
    if (params?.type && params.type !== 'ALL') url += `&type=${encodeURIComponent(params.type)}`;
    if (params?.priority && params.priority !== 'ALL') url += `&priority=${encodeURIComponent(params.priority)}`;
    if (params?.sla && params.sla !== 'ALL') url += `&sla=${encodeURIComponent(params.sla)}`;
    if (params?.search) url += `&search=${encodeURIComponent(params.search)}`;
    if (params?.assignedTo) url += `&assignedTo=${encodeURIComponent(params.assignedTo)}`;
    if (params?.isSlaViolated !== undefined) url += `&isSlaViolated=${params.isSlaViolated}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch work items: HTTP ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  /**
   * Execute batch / bulk actions with individual idempotency tracking
   */
  async executeBulkActions(
    actions: Array<{ id: string; actionKey: string; entityId?: string; actionType?: string }>,
    userId = 'SYSTEM_ADMIN'
  ): Promise<{ total: number; successCount: number; failureCount: number; results: Array<{ id: string; success: boolean; message: string }> }> {
    const res = await fetch('/api/workspace/work-items/bulk-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actions, userId })
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || errJson.message || `Bulk action failed with status ${res.status}`);
    }
    return res.json();
  },

  /**
   * Fetch preview data for an entity (PO, SO, Adjustment, etc.)
   */
  async getEntityPreview(entity: string, id: string): Promise<any> {
    const res = await fetch(`/api/workspace/entity-preview?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(id)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch entity preview: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Omnibar search
   */
  async searchWorkspace(query: string): Promise<any[]> {
    const res = await fetch(`/api/workspace/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      throw new Error(`Search failed: HTTP ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  /**
   * Fetch cross-module business process chains
   */
  async getProcessChains(role = 'SUPER_ADMIN'): Promise<ProcessChainItem[]> {
    const res = await fetch(`/api/workspace/process-chains?role=${encodeURIComponent(role)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch process chains: HTTP ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  /**
   * Execute a quick action on a work item
   */
  async executeAction(endpoint: string, payload: { entityId: string; userId?: string | number; actionType: string }): Promise<any> {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || errJson.message || `Action failed with status ${res.status}`);
    }
    return res.json();
  },

  /**
   * Observability Health Summary
   */
  async getObservabilityHealth(date?: string): Promise<ObservabilityHealthData> {
    const url = date ? `/api/workspace/observability/health?date=${encodeURIComponent(date)}` : '/api/workspace/observability/health';
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load observability health: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Observability Topology
   */
  async getObservabilityTopology(date?: string): Promise<{ date: string; snapshotComputed?: boolean; totalModules: number; modules: ModuleTopologyItem[] }> {
    const url = date ? `/api/workspace/observability/topology?date=${encodeURIComponent(date)}` : '/api/workspace/observability/topology';
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load observability topology: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Trigger manual snapshot projection cycle
   */
  async triggerSnapshotSync(force = true): Promise<any> {
    const res = await fetch('/api/workspace/observability/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force })
    });
    if (!res.ok) {
      throw new Error(`Snapshot sync failed: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Get 30-day trend details for a specific module
   */
  async getModuleTrendDetail(moduleCode: string, days = 30): Promise<ModuleTrendDetail | null> {
    const res = await fetch(`/api/workspace/observability/trends/${encodeURIComponent(moduleCode)}?days=${days}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to load module trend: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Get all module trends
   */
  async getAllModuleTrends(days = 7): Promise<any[]> {
    const res = await fetch(`/api/workspace/observability/trends?days=${days}`);
    if (!res.ok) {
      throw new Error(`Failed to load module trends: HTTP ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  /**
   * List flow spans from derived read-model
   */
  async getSpans(params?: {
    moduleCode?: string;
    status?: string;
    correlationId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ spans: FlowSpanItem[]; total: number; page: number; pageSize: number }> {
    const query = new URLSearchParams();
    if (params?.moduleCode) query.append('moduleCode', params.moduleCode);
    if (params?.status) query.append('status', params.status);
    if (params?.correlationId) query.append('correlationId', params.correlationId);
    if (params?.page) query.append('page', String(params.page));
    if (params?.pageSize) query.append('pageSize', String(params.pageSize));

    const qs = query.toString();
    const url = qs ? `/api/workspace/observability/spans?${qs}` : '/api/workspace/observability/spans';
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load flow spans: HTTP ${res.status}`);
    }
    const data = await res.json();
    const itemsList = data.spans || data.items || [];
    return {
      spans: itemsList,
      items: itemsList,
      total: data.total ?? itemsList.length,
      page: data.page ?? 1,
      pageSize: data.pageSize ?? itemsList.length,
    };
  },

  /**
   * Get Root Cause Analysis (RCA) trace for a correlationId
   */
  async getRcaChain(correlationId: string): Promise<RcaChainResult | null> {
    const res = await fetch(`/api/workspace/observability/rca/${encodeURIComponent(correlationId)}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to analyze root cause: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Remediate a flow span (retry EVENT or block AUDIT)
   */
  async remediateSpan(flowSpanId: number): Promise<{ success: boolean; message: string; spanId: number }> {
    const res = await fetch(`/api/workspace/observability/remediate/${flowSpanId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || data.error || `Remediation failed: HTTP ${res.status}`);
    }
    return data;
  },

  /**
   * Get forecast degradation trends
   */
  async getForecasts(days = 30): Promise<any[]> {
    const res = await fetch(`/api/workspace/observability/forecast?days=${days}`);
    if (!res.ok) {
      throw new Error(`Failed to calculate module forecasts: HTTP ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get forecast detail for a specific module
   */
  async getForecastDetail(moduleCode: string, days = 30): Promise<any | null> {
    const res = await fetch(`/api/workspace/observability/forecast/${encodeURIComponent(moduleCode)}?days=${days}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to load module forecast detail: HTTP ${res.status}`);
    }
    return res.json();
  }
};
