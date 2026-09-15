/**
 * NEXUSSYNC ERP - COSTING SHADOW RUN INFRASTRUCTURE
 * Module: M42 Costing Engine / Architecture Governance
 *
 * PURPOSE:
 * Provides parallel logging comparison between engineOldResult (catalog/legacy)
 * and engineNewResult (authoritative FIFO / Moving Weighted Average).
 * Runs completely in READ-ONLY simulation mode, with ZERO writes to DB.
 *
 * MANDATORY GOVERNANCE CONSTRAINT:
 * Controlled by FEATURE_SHADOW_RUN_ENABLED flag (default: false).
 * MUST REMAIN DISABLED until costing_settings is officially confirmed and seeded
 * by the Chief Accountant / CFO.
 */

import { costingEngine } from './costingEngine';

export interface ShadowRunLogEntry {
  id: string;
  transactionId: string | number;
  productId: number;
  warehouseId: number;
  quantity: number;
  method: 'FIFO' | 'WEIGHTED_AVERAGE';
  engineOldResult: {
    totalCogs: number;
    unitCost: number;
    source: string;
  };
  engineNewResult: {
    totalCogs: number;
    unitCost: number;
    method: string;
    layersEvaluated?: Array<{ layerId: number; quantity: number; unitCost: number }>;
    isDepleted?: boolean;
  };
  variance: {
    cogsDiff: number; // engineNew - engineOld
    cogsDiffPercent: number; // ((new - old) / old) * 100
    isIdentical: boolean;
  };
  timestamp: string;
  status: 'SIMULATED' | 'SKIPPED_FLAG_DISABLED' | 'FAILED';
  error?: string;
}

export class CostingShadowRunner {
  /**
   * FEATURE FLAG: FEATURE_SHADOW_RUN_ENABLED
   * Strictly false by default. Never enabled without formal written approval and seeded costing_settings.
   */
  private static dynamicFlag: boolean | null = null;

  public static get FEATURE_SHADOW_RUN_ENABLED(): boolean {
    if (this.dynamicFlag !== null) return this.dynamicFlag;
    return process.env.FEATURE_SHADOW_RUN_ENABLED === 'true';
  }

  public static setShadowRunActive(active: boolean): void {
    this.dynamicFlag = active;
  }

  // In-memory circular buffer for logging shadow runs (max 500 entries)
  private static logs: ShadowRunLogEntry[] = [];
  private static readonly MAX_LOGS = 500;

  /**
   * Check if shadow run is active
   */
  public static isShadowRunActive(): boolean {
    return this.FEATURE_SHADOW_RUN_ENABLED;
  }

  /**
   * Retrieve all shadow run logs (read-only)
   */
  public static getShadowLogs(): ShadowRunLogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear accumulated shadow run logs
   */
  public static clearShadowLogs(): void {
    this.logs = [];
  }

  /**
   * Retrieve variance and execution statistics
   */
  public static getShadowStats() {
    const total = this.logs.length;
    const identical = this.logs.filter(l => l.variance.isIdentical).length;
    const divergent = total - identical;
    const totalOldCogs = this.logs.reduce((acc, l) => acc + (l.engineOldResult?.totalCogs || 0), 0);
    const totalNewCogs = this.logs.reduce((acc, l) => acc + (l.engineNewResult?.totalCogs || 0), 0);
    const netVariance = totalNewCogs - totalOldCogs;
    const netVariancePercent = totalOldCogs > 0 ? (netVariance / totalOldCogs) * 100 : 0;

    return {
      enabled: this.FEATURE_SHADOW_RUN_ENABLED,
      status: this.FEATURE_SHADOW_RUN_ENABLED ? 'ACTIVE_MONITORING' : 'DISABLED_AWAITING_CFO_METHOD',
      totalEvaluated: total,
      identicalCount: identical,
      divergentCount: divergent,
      totalOldCogs,
      totalNewCogs,
      netVariance,
      netVariancePercent: Math.round(netVariancePercent * 100) / 100
    };
  }

  /**
   * Asynchronously evaluates transaction shadow in parallel without blocking main flow.
   * STRICT GUARD: If FEATURE_SHADOW_RUN_ENABLED is false, exits immediately.
   */
  public static async evaluateTransactionShadow(params: {
    transactionId: string | number;
    productId: number;
    warehouseId?: number;
    quantity: number;
    engineOldResult: {
      totalCogs: number;
      unitCost: number;
      source: string;
    };
    method?: 'FIFO' | 'WEIGHTED_AVERAGE';
  }): Promise<ShadowRunLogEntry | null> {
    // 1. HARD GUARD: Return immediately when flag is disabled
    if (!this.FEATURE_SHADOW_RUN_ENABLED) {
      return null;
    }

    const {
      transactionId,
      productId,
      warehouseId = 1,
      quantity,
      engineOldResult,
      method
    } = params;

    const timestamp = new Date().toISOString();
    const logId = `SHADOW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
      // 2. Call new engine in READ-ONLY simulation mode (zero DB writes)
      const simResult = await costingEngine.simulateIssueCost({
        productId,
        warehouseId,
        quantity,
        method
      });

      const oldCogs = engineOldResult.totalCogs || 0;
      const newCogs = simResult.totalCogs || 0;
      const cogsDiff = newCogs - oldCogs;
      const cogsDiffPercent = oldCogs > 0 ? Math.round(((cogsDiff) / oldCogs) * 10000) / 100 : 0;
      const isIdentical = Math.abs(cogsDiff) < 1;

      const entry: ShadowRunLogEntry = {
        id: logId,
        transactionId,
        productId,
        warehouseId,
        quantity,
        method: simResult.method,
        engineOldResult,
        engineNewResult: {
          totalCogs: simResult.totalCogs,
          unitCost: simResult.unitCost,
          method: simResult.method,
          layersEvaluated: simResult.layersEvaluated,
          isDepleted: simResult.isDepleted
        },
        variance: {
          cogsDiff,
          cogsDiffPercent,
          isIdentical
        },
        timestamp,
        status: 'SIMULATED'
      };

      this.logs.unshift(entry);
      if (this.logs.length > this.MAX_LOGS) {
        this.logs.pop();
      }

      console.info(`[SHADOW RUN] Tx #${transactionId} Prod #${productId}: Old=${oldCogs.toLocaleString('vi-VN')} ₫ vs New=${newCogs.toLocaleString('vi-VN')} ₫ (Variance=${cogsDiff.toLocaleString('vi-VN')} ₫ / ${cogsDiffPercent}%)`);
      return entry;
    } catch (err: any) {
      const errorEntry: ShadowRunLogEntry = {
        id: logId,
        transactionId,
        productId,
        warehouseId,
        quantity,
        method: method || 'WEIGHTED_AVERAGE',
        engineOldResult,
        engineNewResult: {
          totalCogs: 0,
          unitCost: 0,
          method: method || 'UNKNOWN'
        },
        variance: {
          cogsDiff: 0,
          cogsDiffPercent: 0,
          isIdentical: false
        },
        timestamp,
        status: 'FAILED',
        error: err.message
      };
      this.logs.unshift(errorEntry);
      return errorEntry;
    }
  }
}
