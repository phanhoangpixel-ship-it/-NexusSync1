import { sql, eq, gt, and, gte, lte, asc, desc, count } from "drizzle-orm";
import { db } from "../src/db";
import * as schema from "../src/db/schema";
import { MODULE_REGISTRY, type ModuleDefinition } from "../src/config/moduleRegistry";
import { AuditService } from "./auditService";
import { eventBus } from "./eventBus";

export const HEALTH_THRESHOLDS = { GREEN_MIN: 90, YELLOW_MIN: 70 } as const;

export const TREND_THRESHOLDS = {
  MIN_DATA_POINTS: 3,
  DELTA_SIGNIFICANT: 10, // điểm phần trăm
} as const;

const CERTIFIED_MODULE_PATTERN = /^M(0[1-9]|[1-3]\d|4[0-2])$/;

function normalizeModuleCode(raw: unknown): { code: string; raw: string } {
  const rawStr = raw == null ? "" : String(raw);
  const match = rawStr.match(/M(\d{2,})/i);
  if (!match) return { code: "UNKNOWN", raw: rawStr || "(rỗng)" };
  return { code: `M${match[1].padStart(2, "0")}`, raw: rawStr };
}

function normalizeStatusFromAudit(result: unknown): "SUCCESS" | "FAILED" | "UNKNOWN" {
  if (result == null) return "UNKNOWN";
  return /fail|error|reject|denied/i.test(String(result)) ? "FAILED" : "SUCCESS";
}

function normalizeStatusFromEvent(row: { status: string | null; retryCount: number | null; lastError: string | null; }): "SUCCESS" | "FAILED" | "PENDING" {
  if (row.lastError && (row.retryCount ?? 0) > 0) return "FAILED";
  if (row.status === "PUBLISHED") return "SUCCESS";
  return "PENDING";
}

/**
 * Khử nhạy cảm: Đã kiểm tra AuditService tại /engines/auditService.ts dòng 520 (maskPayload) & 78-83 (SENSITIVE_KEYS).
 * Gọi trực tiếp AuditService.maskPayload (tái dùng mã nguồn chuẩn Rule #02 thay vì tự viết duplicate).
 */
function maskMetadata(raw: unknown): string {
  if (raw == null) return "{}";
  const str = typeof raw === "string" ? raw : JSON.stringify(raw);
  const masked = AuditService.maskPayload(str, true);
  return masked || "{}";
}

let indexesEnsured = false;
async function ensureObservabilityIndexes() {
  if (indexesEnsured) return;
  try {
    try {
      await db.run(sql`ALTER TABLE flow_spans ADD COLUMN source_event_id TEXT`);
    } catch {
      // Column may already exist
    }
    await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS flow_spans_source_unique_idx ON flow_spans (source_type, source_ref_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS flow_spans_correlation_idx ON flow_spans (correlation_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS flow_spans_module_status_idx ON flow_spans (module_code, status)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS flow_spans_occurred_at_idx ON flow_spans (occurred_at)`);
    await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS module_kpi_module_date_branch_idx ON module_kpi_snapshots (module_code, snapshot_date, branch_key)`);
    indexesEnsured = true;
  } catch {
    indexesEnsured = true;
  }
}

async function projectAuditLogs(limit = 500): Promise<number> {
  await ensureObservabilityIndexes();
  const [{ maxId }] = await db.select({ maxId: sql<number>`COALESCE(MAX(${schema.flowSpans.sourceRefId}), 0)` })
    .from(schema.flowSpans).where(eq(schema.flowSpans.sourceType, "AUDIT"));
  const rows = await db.select().from(schema.auditLogs)
    .where(gt(schema.auditLogs.id, maxId ?? 0)).orderBy(asc(schema.auditLogs.id)).limit(limit);
  if (rows.length === 0) return 0;
  const values = rows.map((row: any) => {
    const { code, raw } = normalizeModuleCode(row.module);
    return {
      sourceType: "AUDIT" as const,
      sourceRefId: row.id as number,
      correlationId: row.correlationId ?? null,
      moduleCode: code,
      moduleRaw: raw,
      branchId: row.branchId ?? null,
      userId: row.userId ?? null,
      actionName: row.action ?? "UNKNOWN_ACTION",
      status: normalizeStatusFromAudit(row.result),
      occurredAt: row.createdAt instanceof Date ? row.createdAt : (row.createdAt ? new Date(row.createdAt) : new Date()),
      durationMs: null,
      metadataMasked: maskMetadata(row.metadata),
      sourceEventId: null,
      projectedAt: new Date(),
    };
  });
  await db.insert(schema.flowSpans).values(values).onConflictDoNothing();
  return values.length;
}

async function projectOutboxEvents(limit = 500): Promise<number> {
  await ensureObservabilityIndexes();
  const [{ maxId }] = await db.select({ maxId: sql<number>`COALESCE(MAX(${schema.flowSpans.sourceRefId}), 0)` })
    .from(schema.flowSpans).where(eq(schema.flowSpans.sourceType, "EVENT"));
  const rows = await db.select().from(schema.outboxEvents)
    .where(gt(schema.outboxEvents.id, maxId ?? 0)).orderBy(asc(schema.outboxEvents.id)).limit(limit);
  if (rows.length === 0) return 0;
  const values = rows.map((row: any) => {
    const { code, raw } = normalizeModuleCode(row.source);
    return {
      sourceType: "EVENT" as const,
      sourceRefId: row.id as number,
      correlationId: row.correlationId ?? null,
      moduleCode: code,
      moduleRaw: raw,
      branchId: null,
      userId: null,
      actionName: row.eventType ?? "UNKNOWN_EVENT",
      status: normalizeStatusFromEvent(row),
      occurredAt: row.occurredAt instanceof Date ? row.occurredAt : (row.occurredAt ? new Date(row.occurredAt) : new Date()),
      durationMs: null,
      metadataMasked: maskMetadata(row.metadata ?? row.payload),
      sourceEventId: row.eventId ?? null,
      projectedAt: new Date(),
    };
  });
  await db.insert(schema.flowSpans).values(values).onConflictDoNothing();
  return values.length;
}

async function computeDailySnapshots(targetDate?: string): Promise<number> {
  await ensureObservabilityIndexes();
  const dateStr = targetDate ?? new Date().toISOString().slice(0, 10);
  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);
  const rows = await db.select({
    moduleCode: schema.flowSpans.moduleCode,
    branchId: schema.flowSpans.branchId,
    status: schema.flowSpans.status
  })
    .from(schema.flowSpans)
    .where(and(gte(schema.flowSpans.occurredAt, dayStart), lte(schema.flowSpans.occurredAt, dayEnd)));
  
  const groups = new Map<string, { moduleCode: string; branchId: number | null; total: number; errors: number }>();
  for (const r of rows) {
    const branchKey = String(r.branchId ?? 0);
    const key = `${r.moduleCode}::${branchKey}`;
    const g = groups.get(key) ?? { moduleCode: r.moduleCode, branchId: r.branchId ?? null, total: 0, errors: 0 };
    g.total += 1;
    if (r.status === "FAILED") g.errors += 1;
    groups.set(key, g);
  }
  const registryByCode = new Map(MODULE_REGISTRY.map((m: ModuleDefinition) => [m.moduleId, m]));
  let written = 0;
  for (const g of groups.values()) {
    const slaViolations = 0; // Phase 1: chưa có nguồn SLA đáng tin cậy ngoài M38
    const efficiencyScore = g.total === 0 ? 100 : Math.max(0, 100 - ((slaViolations / g.total) * 40 + (g.errors / g.total) * 60));
    await db.insert(schema.moduleKpiSnapshots).values({
      moduleCode: g.moduleCode,
      businessGroup: registryByCode.get(g.moduleCode)?.group ?? null,
      branchId: g.branchId,
      branchKey: String(g.branchId ?? 0),
      snapshotDate: dateStr,
      totalActions: g.total,
      slaViolations,
      errorCount: g.errors,
      efficiencyScore,
      computedAt: new Date(),
    } as any).onConflictDoUpdate({
      target: [schema.moduleKpiSnapshots.moduleCode, schema.moduleKpiSnapshots.snapshotDate, schema.moduleKpiSnapshots.branchKey],
      set: { totalActions: g.total, slaViolations, errorCount: g.errors, efficiencyScore, computedAt: new Date() } as any,
    });
    written += 1;
  }
  return written;
}

// State trong bộ nhớ (module-level) — Phase 4 Self-Protective Backpressure
let consecutiveBusyErrors = 0;
let backpressureActive = false;
let consecutiveSuccess = 0;
let skippedCycles = 0;

export const BACKPRESSURE_THRESHOLDS = {
  ACTIVATE_AFTER_CONSECUTIVE_ERRORS: 3,
  DEACTIVATE_AFTER_CONSECUTIVE_SUCCESS: 3,
  PROBE_EVERY_N_SKIPS: 4, // Sau mỗi 4 chu kỳ tự nhịn (~60s), cho phép 1 chu kỳ thăm dò (probe)
} as const;

export function isSqliteBusyError(err: any): boolean {
  if (!err) return false;
  const code = String(err.code || "");
  const msg = String(err.message || "");
  const rawCode = err.rawCode;
  return (
    code === "SQLITE_BUSY" ||
    code.startsWith("SQLITE_BUSY_") ||
    code === "SQLITE_LOCKED" ||
    rawCode === 5 ||
    /SQLITE_BUSY|database is locked|database table is locked/i.test(msg)
  );
}

export function getBackpressureState() {
  return {
    active: backpressureActive,
    consecutiveBusyErrors,
    consecutiveSuccess,
    skippedCycles,
  };
}

export function resetBackpressureState() {
  consecutiveBusyErrors = 0;
  backpressureActive = false;
  consecutiveSuccess = 0;
  skippedCycles = 0;
}

export async function runCycle(options?: { force?: boolean; _testError?: any }) {
  const isForce = options?.force === true;
  const isProbe = backpressureActive && skippedCycles > 0 && (skippedCycles % BACKPRESSURE_THRESHOLDS.PROBE_EVERY_N_SKIPS === 0);

  if (backpressureActive && !isForce && !isProbe) {
    skippedCycles += 1;
    return {
      ok: true,
      skipped: true,
      reason: "backpressure_active",
      projectedAudit: 0,
      projectedEvent: 0,
      snapshotsWritten: 0,
      backpressure: getBackpressureState(),
    };
  }

  try {
    if (options?._testError) {
      throw options._testError;
    }
    const projectedAudit = await projectAuditLogs();
    const projectedEvent = await projectOutboxEvents();
    const snapshotsWritten = await computeDailySnapshots();

    // Success path
    consecutiveBusyErrors = 0;
    consecutiveSuccess += 1;
    if (backpressureActive && consecutiveSuccess >= BACKPRESSURE_THRESHOLDS.DEACTIVATE_AFTER_CONSECUTIVE_SUCCESS) {
      backpressureActive = false;
      skippedCycles = 0;
      console.log(
        `[ObservabilityProjectorService] Backpressure deactivated sau ${consecutiveSuccess} chu kỳ thành công liên tiếp.`
      );
    }

    return {
      ok: true,
      skipped: false,
      isProbe: isProbe || false,
      projectedAudit,
      projectedEvent,
      snapshotsWritten,
      backpressure: getBackpressureState(),
    };
  } catch (err: any) {
    if (isSqliteBusyError(err)) {
      consecutiveBusyErrors += 1;
      consecutiveSuccess = 0;
      if (consecutiveBusyErrors >= BACKPRESSURE_THRESHOLDS.ACTIVATE_AFTER_CONSECUTIVE_ERRORS) {
        if (!backpressureActive) {
          console.warn(
            `[ObservabilityProjectorService] CẢNH BÁO: Phát hiện ${consecutiveBusyErrors} lần SQLITE_BUSY liên tiếp. Kích hoạt Backpressure (tự nhịn chu kỳ chiếu M01).`
          );
        }
        backpressureActive = true;
      }
      return {
        ok: false,
        skipped: false,
        isBusyError: true,
        projectedAudit: 0,
        projectedEvent: 0,
        snapshotsWritten: 0,
        error: err?.message || String(err),
        backpressure: getBackpressureState(),
      };
    }

    console.error("[ObservabilityProjectorService] runCycle lỗi:", err?.message || err);
    return {
      ok: false,
      skipped: false,
      isBusyError: false,
      projectedAudit: 0,
      projectedEvent: 0,
      snapshotsWritten: 0,
      error: err?.message || String(err),
      backpressure: getBackpressureState(),
    };
  }
}

export async function getHealthSummary(dateStr?: string) {
  await ensureObservabilityIndexes();
  const date = dateStr ?? new Date().toISOString().slice(0, 10);
  const snapshots = await db.select().from(schema.moduleKpiSnapshots).where(eq(schema.moduleKpiSnapshots.snapshotDate, date));
  const snapshotComputed = snapshots.length > 0;
  const scored = snapshots.filter((s) => s.totalActions > 0);
  const systemScore = scored.length === 0 ? 100 : scored.reduce((sum, s) => sum + s.efficiencyScore, 0) / scored.length;
  let green = 0, yellow = 0, red = 0;
  for (const s of scored) {
    if (s.efficiencyScore >= HEALTH_THRESHOLDS.GREEN_MIN) green += 1;
    else if (s.efficiencyScore >= HEALTH_THRESHOLDS.YELLOW_MIN) yellow += 1;
    else red += 1;
  }
  return {
    date,
    snapshotComputed,
    systemScore: Math.round(systemScore * 10) / 10,
    status: systemScore >= HEALTH_THRESHOLDS.GREEN_MIN ? "HEALTHY" : systemScore >= HEALTH_THRESHOLDS.YELLOW_MIN ? "DEGRADED" : "CRITICAL",
    totalModulesInRegistry: MODULE_REGISTRY.length,
    modulesWithActivityToday: scored.length,
    greenModules: green,
    yellowModules: yellow,
    redModules: red,
    warning: !snapshotComputed
      ? "Chưa có bản ghi snapshot tổng hợp cho ngày này. Dữ liệu lịch sử có thể tồn tại trong flow_spans nhưng chưa được tính toán qua computeDailySnapshots."
      : undefined,
    projectorBackpressure: getBackpressureState(),
    note: "slaViolations hiện luôn = 0; systemScore là trung bình cộng đều theo module, không dùng trọng số phòng ban.",
  };
}

export async function getTopology(dateStr?: string) {
  await ensureObservabilityIndexes();
  const date = dateStr ?? new Date().toISOString().slice(0, 10);
  const snapshots = await db.select().from(schema.moduleKpiSnapshots).where(eq(schema.moduleKpiSnapshots.snapshotDate, date));
  const snapshotComputed = snapshots.length > 0;
  const snapshotByModule = new Map(snapshots.map((s) => [s.moduleCode, s]));
  const modules = MODULE_REGISTRY.map((m: ModuleDefinition) => {
    const snap = snapshotByModule.get(m.moduleId);
    return {
      moduleId: m.moduleId,
      moduleName: m.moduleName,
      group: m.group,
      route: m.route,
      workspaceId: m.workspaceId ?? null,
      registryOnly: !CERTIFIED_MODULE_PATTERN.test(m.moduleId),
      hasActivityToday: !!snap,
      efficiencyScore: snap ? snap.efficiencyScore : null,
      totalActions: snap ? snap.totalActions : 0,
      errorCount: snap ? snap.errorCount : 0,
    };
  });
  return {
    date,
    snapshotComputed,
    warning: !snapshotComputed
      ? "Chưa có snapshot nào được tính cho ngày này. hasActivityToday=false trên tất cả module không đồng nghĩa hệ thống hoàn toàn không có hoạt động."
      : undefined,
    modules,
  };
}

export async function listSpans(params: {
  moduleCode?: string;
  status?: string;
  correlationId?: string;
  page?: number;
  pageSize?: number;
}) {
  await ensureObservabilityIndexes();
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20));
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (params.moduleCode) {
    conditions.push(eq(schema.flowSpans.moduleCode, params.moduleCode.trim().toUpperCase()));
  }
  if (params.status) {
    conditions.push(eq(schema.flowSpans.status, params.status.trim().toUpperCase()));
  }
  if (params.correlationId) {
    conditions.push(eq(schema.flowSpans.correlationId, params.correlationId.trim()));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalRes] = await Promise.all([
    db.select()
      .from(schema.flowSpans)
      .where(whereClause)
      .orderBy(desc(schema.flowSpans.occurredAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() })
      .from(schema.flowSpans)
      .where(whereClause)
  ]);

  const total = Number(totalRes[0]?.count || 0);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1
  };
}

export async function getRootCauseChain(correlationId: string) {
  await ensureObservabilityIndexes();
  const trimmed = correlationId.trim();
  const spans = await db.select()
    .from(schema.flowSpans)
    .where(eq(schema.flowSpans.correlationId, trimmed))
    .orderBy(asc(schema.flowSpans.occurredAt));

  if (spans.length === 0) {
    return null;
  }

  // Heuristic rule: span ĐẦU TIÊN theo thời gian có status='FAILED' (nếu có).
  const rootCause = spans.find((s) => s.status === "FAILED") || null;

  return {
    correlationId: trimmed,
    spans,
    rootCause,
    totalSpans: spans.length,
    failedSpans: spans.filter((s) => s.status === "FAILED").length
  };
}

export async function remediateSpan(flowSpanId: number, actor: { id?: number; username?: string } = {}) {
  await ensureObservabilityIndexes();
  const spanRows = await db.select().from(schema.flowSpans).where(eq(schema.flowSpans.id, flowSpanId)).limit(1);
  if (spanRows.length === 0) {
    return {
      status: 404,
      body: { success: false, error: "NOT_FOUND", message: `Không tìm thấy flow span với ID ${flowSpanId}` }
    };
  }

  const span = spanRows[0];
  if (span.sourceType !== "EVENT") {
    return {
      status: 400,
      body: {
        success: false,
        error: "INVALID_SOURCE",
        message: "Chỉ hỗ trợ khắc phục cho sự kiện nguồn EVENT (M05). Span nguồn AUDIT không có cơ chế retry chung an toàn — cần xử lý qua đúng module nghiệp vụ gốc."
      }
    };
  }

  if (span.status !== "FAILED") {
    return {
      status: 400,
      body: {
        success: false,
        error: "NOT_FAILED",
        message: "Span này không ở trạng thái lỗi, không cần khắc phục."
      }
    };
  }

  if (!span.sourceEventId) {
    return {
      status: 400,
      body: {
        success: false,
        error: "MISSING_SOURCE_EVENT_ID",
        message: "Thiếu tham chiếu eventId gốc, không thể khắc phục tự động."
      }
    };
  }

  // Call M05 eventBus.retryDlqEvent
  const retryResult = await eventBus.retryDlqEvent(span.sourceEventId, actor);
  if (!retryResult.success) {
    return {
      status: 400,
      body: {
        success: false,
        error: "RETRY_FAILED",
        message: retryResult.message
      }
    };
  }

  // Run cycle immediately to reflect new state
  await runCycle();

  return {
    status: 200,
    body: {
      success: true,
      message: retryResult.message,
      spanId: flowSpanId,
      sourceEventId: span.sourceEventId
    }
  };
}

export interface ModuleTrendItem {
  moduleCode: string;
  moduleName: string;
  currentScore: number | null;
  baselineAvg: number | null;
  dataPointsUsed: number;
  trendStatus: 'IMPROVING' | 'DEGRADING' | 'STABLE' | 'INSUFFICIENT_DATA' | 'NO_DATA';
}

export async function getModuleTrends(days = 7): Promise<ModuleTrendItem[]> {
  await ensureObservabilityIndexes();
  const safeDays = Math.max(1, Math.min(365, Number(days) || 7));

  // Query all snapshots ordered by date desc
  const allSnapshots = await db.select().from(schema.moduleKpiSnapshots).orderBy(desc(schema.moduleKpiSnapshots.snapshotDate));
  
  const snapsByModule = new Map<string, typeof allSnapshots>();
  for (const s of allSnapshots) {
    const list = snapsByModule.get(s.moduleCode) || [];
    list.push(s);
    snapsByModule.set(s.moduleCode, list);
  }

  return MODULE_REGISTRY.map((m: ModuleDefinition): ModuleTrendItem => {
    const snaps = snapsByModule.get(m.moduleId) || [];
    if (snaps.length === 0) {
      return {
        moduleCode: m.moduleId,
        moduleName: m.moduleName,
        currentScore: null,
        baselineAvg: null,
        dataPointsUsed: 0,
        trendStatus: 'NO_DATA',
      };
    }

    // Latest snapshot
    const latest = snaps[0];
    const currentScore = latest.efficiencyScore;
    const latestTime = new Date(latest.snapshotDate).getTime();
    const windowStart = latestTime - safeDays * 24 * 60 * 60 * 1000;

    // Prior snapshots strictly before latestDate within window
    const priorSnaps = snaps.slice(1).filter((s) => {
      const t = new Date(s.snapshotDate).getTime();
      return t >= windowStart && t < latestTime;
    });

    const dataPointsUsed = priorSnaps.length;

    if (dataPointsUsed < TREND_THRESHOLDS.MIN_DATA_POINTS) {
      const partialAvg = dataPointsUsed > 0 
        ? Math.round((priorSnaps.reduce((acc, s) => acc + s.efficiencyScore, 0) / dataPointsUsed) * 10) / 10 
        : null;
      return {
        moduleCode: m.moduleId,
        moduleName: m.moduleName,
        currentScore,
        baselineAvg: partialAvg,
        dataPointsUsed,
        trendStatus: 'INSUFFICIENT_DATA',
      };
    }

    const baselineSum = priorSnaps.reduce((acc, s) => acc + s.efficiencyScore, 0);
    const baselineAvg = Math.round((baselineSum / dataPointsUsed) * 10) / 10;
    const delta = currentScore - baselineAvg;

    let trendStatus: 'IMPROVING' | 'DEGRADING' | 'STABLE' = 'STABLE';
    if (delta <= -TREND_THRESHOLDS.DELTA_SIGNIFICANT) {
      trendStatus = 'DEGRADING';
    } else if (delta >= TREND_THRESHOLDS.DELTA_SIGNIFICANT) {
      trendStatus = 'IMPROVING';
    }

    return {
      moduleCode: m.moduleId,
      moduleName: m.moduleName,
      currentScore,
      baselineAvg,
      dataPointsUsed,
      trendStatus,
    };
  });
}

export interface ModuleTrendPoint {
  snapshotDate: string;
  efficiencyScore: number;
  totalActions: number;
}

export async function getModuleTrendDetail(moduleCode: string, days = 30): Promise<ModuleTrendPoint[] | null> {
  await ensureObservabilityIndexes();
  const safeDays = Math.max(1, Math.min(365, Number(days) || 30));

  const def = MODULE_REGISTRY.find((m) => m.moduleId.toUpperCase() === moduleCode.trim().toUpperCase());
  if (!def) {
    return null;
  }

  const rows = await db.select()
    .from(schema.moduleKpiSnapshots)
    .where(eq(schema.moduleKpiSnapshots.moduleCode, def.moduleId))
    .orderBy(asc(schema.moduleKpiSnapshots.snapshotDate));

  if (rows.length === 0) {
    return [];
  }

  const lastDate = new Date(rows[rows.length - 1].snapshotDate).getTime();
  const windowStart = lastDate - safeDays * 24 * 60 * 60 * 1000;

  return rows
    .filter((r) => new Date(r.snapshotDate).getTime() >= windowStart)
    .map((r) => ({
      snapshotDate: r.snapshotDate,
      efficiencyScore: r.efficiencyScore,
      totalActions: r.totalActions,
    }));
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 5 — STATISTICAL FORECAST PROJECTION (Least-Squares Regression)
// ═══════════════════════════════════════════════════════════════════════

export const FORECAST_THRESHOLDS = {
  MIN_DATA_POINTS: TREND_THRESHOLDS.MIN_DATA_POINTS, // tái dùng, không tạo ngưỡng riêng (Rule #02)
  NEAR_TERM_WARNING_DAYS: 3, // chỉ hiện banner cảnh báo nếu dự kiến chạm ngưỡng trong X ngày tới
  MAX_BREACH_PROJECTION_DAYS: 365, // quá 1 năm coi như không đáng cảnh báo
} as const;

export interface ModuleForecastItem {
  moduleCode: string;
  moduleName: string;
  currentScore: number | null;
  ratePerDay: number | null; // độ dốc hồi quy tuyến tính (điểm/ngày) trên efficiencyScore theo snapshotDate
  dataPointsUsed: number;
  forecastStatus: 'DEGRADING_TREND' | 'STABLE_OR_IMPROVING' | 'INSUFFICIENT_DATA' | 'NO_DATA';
  projectedBreachDate: string | null; // ngày dự kiến chạm HEALTH_THRESHOLDS.YELLOW_MIN nếu xu hướng hiện tại tiếp diễn — CHỈ tính khi ratePerDay < 0, null nếu không giảm hoặc không đủ dữ liệu
}

export interface ModuleForecastDetail extends ModuleForecastItem {
  slope: number | null;
  intercept: number | null;
  dataPoints: Array<{ snapshotDate: string; efficiencyScore: number; totalActions: number }>;
}

/**
 * Thuật toán: Thống kê thuần túy qua Hồi quy tuyến tính bình phương tối thiểu (least-squares).
 * TUYỆT ĐỐI KHÔNG dùng AI/ML/Gemini.
 * Khi dataPointsUsed < FORECAST_THRESHOLDS.MIN_DATA_POINTS, trả về INSUFFICIENT_DATA trung thực,
 * tuyệt đối không bịa hay nội suy dữ liệu giả.
 */
export function computeLinearRegression(points: Array<{ snapshotDate: string; efficiencyScore: number; totalActions?: number }>) {
  if (points.length === 0) {
    return {
      currentScore: null,
      slope: null,
      intercept: null,
      ratePerDay: null,
      dataPointsUsed: 0,
      forecastStatus: 'NO_DATA' as const,
      projectedBreachDate: null,
    };
  }

  const latest = points[points.length - 1];
  const currentScore = latest.efficiencyScore;

  if (points.length < FORECAST_THRESHOLDS.MIN_DATA_POINTS) {
    return {
      currentScore,
      slope: null,
      intercept: null,
      ratePerDay: null,
      dataPointsUsed: points.length,
      forecastStatus: 'INSUFFICIENT_DATA' as const,
      projectedBreachDate: null,
    };
  }

  const t0 = new Date(points[0].snapshotDate).getTime();
  const n = points.length;
  // Trục x tính theo số ngày kể từ điểm snapshot đầu tiên
  const x = points.map((p) => Math.max(0, (new Date(p.snapshotDate).getTime() - t0) / (24 * 60 * 60 * 1000)));
  const y = points.map((p) => p.efficiencyScore);

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    sxx += dx * dx;
    sxy += dx * dy;
  }

  const rawSlope = sxx === 0 ? 0 : sxy / sxx;
  const rawIntercept = meanY - rawSlope * meanX;

  let ratePerDay = Math.round(rawSlope * 100) / 100;
  if (Object.is(ratePerDay, -0)) ratePerDay = 0;
  let intercept = Math.round(rawIntercept * 100) / 100;
  if (Object.is(intercept, -0)) intercept = 0;

  if (ratePerDay < 0) {
    let projectedBreachDate: string | null = null;
    if (currentScore <= HEALTH_THRESHOLDS.YELLOW_MIN) {
      projectedBreachDate = latest.snapshotDate;
    } else {
      const daysToBreach = (currentScore - HEALTH_THRESHOLDS.YELLOW_MIN) / (-ratePerDay);
      if (daysToBreach <= FORECAST_THRESHOLDS.MAX_BREACH_PROJECTION_DAYS) {
        const breachMs = new Date(latest.snapshotDate).getTime() + Math.ceil(daysToBreach) * 24 * 60 * 60 * 1000;
        projectedBreachDate = new Date(breachMs).toISOString().slice(0, 10);
      }
    }

    return {
      currentScore,
      slope: ratePerDay,
      intercept,
      ratePerDay,
      dataPointsUsed: n,
      forecastStatus: 'DEGRADING_TREND' as const,
      projectedBreachDate,
    };
  } else {
    return {
      currentScore,
      slope: ratePerDay,
      intercept,
      ratePerDay,
      dataPointsUsed: n,
      forecastStatus: 'STABLE_OR_IMPROVING' as const,
      projectedBreachDate: null,
    };
  }
}

export async function getModuleForecasts(days = 30): Promise<ModuleForecastItem[]> {
  await ensureObservabilityIndexes();
  const safeDays = Math.max(1, Math.min(365, Number(days) || 30));

  // Tái dùng truy vấn module_kpi_snapshots (Rule #02 Reuse Before Create)
  const allSnapshots = await db
    .select()
    .from(schema.moduleKpiSnapshots)
    .orderBy(asc(schema.moduleKpiSnapshots.snapshotDate));

  const snapsByModule = new Map<string, typeof allSnapshots>();
  for (const s of allSnapshots) {
    const list = snapsByModule.get(s.moduleCode) || [];
    list.push(s);
    snapsByModule.set(s.moduleCode, list);
  }

  return MODULE_REGISTRY.map((m: ModuleDefinition): ModuleForecastItem => {
    const rawSnaps = snapsByModule.get(m.moduleId) || [];
    let windowSnaps: typeof rawSnaps = [];

    if (rawSnaps.length > 0) {
      const lastDate = new Date(rawSnaps[rawSnaps.length - 1].snapshotDate).getTime();
      const windowStart = lastDate - safeDays * 24 * 60 * 60 * 1000;
      windowSnaps = rawSnaps.filter((s) => new Date(s.snapshotDate).getTime() >= windowStart);
    }

    const regResult = computeLinearRegression(windowSnaps);

    return {
      moduleCode: m.moduleId,
      moduleName: m.moduleName,
      currentScore: regResult.currentScore,
      ratePerDay: regResult.ratePerDay,
      dataPointsUsed: regResult.dataPointsUsed,
      forecastStatus: regResult.forecastStatus,
      projectedBreachDate: regResult.projectedBreachDate,
    };
  });
}

export async function getModuleForecastDetail(moduleCode: string, days = 30): Promise<ModuleForecastDetail | null> {
  await ensureObservabilityIndexes();
  const def = MODULE_REGISTRY.find((m) => m.moduleId.toUpperCase() === moduleCode.trim().toUpperCase());
  if (!def) {
    return null;
  }

  const safeDays = Math.max(1, Math.min(365, Number(days) || 30));

  // Tái dùng logic đọc dữ liệu từ DB của getModuleTrendDetail (Rule #02)
  const trendPoints = await getModuleTrendDetail(def.moduleId, safeDays);
  const dataPoints = trendPoints || [];

  const regResult = computeLinearRegression(dataPoints);

  return {
    moduleCode: def.moduleId,
    moduleName: def.moduleName,
    currentScore: regResult.currentScore,
    ratePerDay: regResult.ratePerDay,
    dataPointsUsed: regResult.dataPointsUsed,
    forecastStatus: regResult.forecastStatus,
    projectedBreachDate: regResult.projectedBreachDate,
    slope: regResult.slope,
    intercept: regResult.intercept,
    dataPoints: dataPoints.map((p) => ({
      snapshotDate: p.snapshotDate,
      efficiencyScore: p.efficiencyScore,
      totalActions: p.totalActions,
    })),
  };
}


