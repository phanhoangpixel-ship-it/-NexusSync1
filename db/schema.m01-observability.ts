import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { users, branches } from "./schema";

export const flowSpans = sqliteTable("flow_spans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceType: text("source_type").notNull(),        // 'AUDIT' | 'EVENT'
  sourceRefId: integer("source_ref_id").notNull(),
  correlationId: text("correlation_id"),
  moduleCode: text("module_code").notNull(),
  moduleRaw: text("module_raw").notNull(),
  branchId: integer("branch_id").references(() => branches.id),
  userId: integer("user_id").references(() => users.id),
  actionName: text("action_name").notNull(),
  status: text("status").notNull(),
  occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
  durationMs: integer("duration_ms"),
  metadataMasked: text("metadata_masked"),
  sourceEventId: text("source_event_id"), // outbox_events.eventId (text, unique) — CHỈ có giá trị khi sourceType='EVENT', dùng để gọi lại cơ chế retry thật của M05. NULL với sourceType='AUDIT'.
  projectedAt: integer("projected_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  sourceUniqueIdx: uniqueIndex("flow_spans_source_unique_idx").on(t.sourceType, t.sourceRefId),
  correlationIdx: index("flow_spans_correlation_idx").on(t.correlationId),
  moduleStatusIdx: index("flow_spans_module_status_idx").on(t.moduleCode, t.status),
  occurredAtIdx: index("flow_spans_occurred_at_idx").on(t.occurredAt),
}));

export const moduleKpiSnapshots = sqliteTable("module_kpi_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  moduleCode: text("module_code").notNull(),
  businessGroup: text("business_group"),
  branchId: integer("branch_id").references(() => branches.id),
  branchKey: text("branch_key").notNull(),  // String(branchId ?? 0) — SQLite coi NULL là khác biệt trong UNIQUE nên dùng branchKey
  snapshotDate: text("snapshot_date").notNull(),
  totalActions: integer("total_actions").notNull().default(0),
  slaViolations: integer("sla_violations").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  efficiencyScore: real("efficiency_score").notNull().default(100),
  computedAt: integer("computed_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  moduleDateIdx: uniqueIndex("module_kpi_module_date_branch_idx").on(t.moduleCode, t.snapshotDate, t.branchKey),
}));
