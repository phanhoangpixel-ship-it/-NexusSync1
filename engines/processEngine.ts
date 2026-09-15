import { eq, and, desc } from "drizzle-orm";
import { db, client } from "../src/db";
import { processInstances, processInstanceSteps } from "../src/db/schema";

export async function ensureProcessTraceabilityTablesExist() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS functional_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        icon TEXT,
        display_order INTEGER DEFAULT 0,
        created_at INTEGER
      )
    `);
    await client.execute(`
      CREATE TABLE IF NOT EXISTS business_workspaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        functional_group_id INTEGER REFERENCES functional_groups(id),
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        display_order INTEGER DEFAULT 0,
        created_at INTEGER
      )
    `);
    await client.execute(`
      CREATE TABLE IF NOT EXISTS business_processes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        process_key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        workspace_id INTEGER REFERENCES business_workspaces(id),
        is_active INTEGER DEFAULT 1,
        definition_payload TEXT,
        created_at INTEGER
      )
    `);
    await client.execute(`
      CREATE TABLE IF NOT EXISTS business_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_code TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        process_instance_id INTEGER REFERENCES process_instances(id),
        assigned_role TEXT,
        assigned_user_id INTEGER,
        status TEXT NOT NULL DEFAULT 'PENDING',
        entity_module TEXT,
        entity_type TEXT,
        entity_id TEXT,
        action_endpoint TEXT,
        action_payload TEXT,
        error_message TEXT,
        created_at INTEGER,
        completed_at INTEGER,
        completed_by INTEGER
      )
    `);
    await client.execute(`
      CREATE TABLE IF NOT EXISTS process_instances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        process_instance_code TEXT NOT NULL UNIQUE,
        process_definition_key TEXT NOT NULL,
        process_name TEXT NOT NULL,
        business_key TEXT NOT NULL,
        root_entity_module TEXT NOT NULL,
        root_entity_type TEXT NOT NULL,
        root_entity_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'RUNNING',
        current_step TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        causation_id TEXT,
        initiator_user_id INTEGER,
        context_payload TEXT,
        started_at INTEGER,
        completed_at INTEGER,
        updated_at INTEGER
      )
    `);

    await client.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS process_instances_def_key_business_key_idx
      ON process_instances (process_definition_key, business_key)
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS process_instance_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        process_instance_id INTEGER NOT NULL REFERENCES process_instances(id) ON DELETE CASCADE,
        step_code TEXT NOT NULL,
        step_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'COMPLETED',
        entity_module TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        event_id TEXT,
        performed_by INTEGER,
        step_payload TEXT,
        duration_ms INTEGER,
        started_at INTEGER,
        completed_at INTEGER
      )
    `);
  } catch (err) {
    console.error("Error creating process traceability tables:", err);
  }
}

export interface StartProcessInstanceParams {
  processDefinitionKey: string;
  processName: string;
  businessKey: string; // e.g. PO-2026-000123
  rootEntityModule: string; // e.g. PURCHASE
  rootEntityType: string; // e.g. PURCHASE_ORDER
  rootEntityId: string; // e.g. 123
  initialStep: string; // e.g. PO_APPROVED
  correlationId: string;
  causationId?: string;
  initiatorUserId?: number;
  contextPayload?: Record<string, any>;
}

export interface RecordStepParams {
  processInstanceId: number;
  stepCode: string;
  stepName: string;
  status?: string; // PENDING, IN_PROGRESS, COMPLETED, FAILED, SKIPPED
  entityModule: string;
  entityType: string;
  entityId: string;
  eventId?: string;
  performedBy?: number;
  stepPayload?: Record<string, any>;
  durationMs?: number;
  isTerminalStep?: boolean;
}

export class ProcessEngine {
  /**
   * Idempotently starts or retrieves an existing process instance.
   * Database-enforced unique index on (processDefinitionKey, businessKey) ensures exactly 1 instance exists.
   */
  static async startOrGetProcessInstance(
    params: StartProcessInstanceParams,
    txHandle?: any
  ) {
    await ensureProcessTraceabilityTablesExist();
    const executor = txHandle || db;

    // 1. Initial check for existing instance
    const [existing] = await executor
      .select()
      .from(processInstances)
      .where(
        and(
          eq(processInstances.processDefinitionKey, params.processDefinitionKey),
          eq(processInstances.businessKey, params.businessKey)
        )
      )
      .limit(1);

    if (existing) {
      return existing;
    }

    // 2. Generate unique process instance code
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `PI-${params.processDefinitionKey}-${Date.now()}-${randomSuffix}`;

    try {
      // 3. Insert new process instance atomically
      const [inserted] = await executor
        .insert(processInstances)
        .values({
          processInstanceCode: code,
          processDefinitionKey: params.processDefinitionKey,
          processName: params.processName,
          businessKey: params.businessKey,
          rootEntityModule: params.rootEntityModule,
          rootEntityType: params.rootEntityType,
          rootEntityId: String(params.rootEntityId),
          status: "RUNNING",
          currentStep: params.initialStep,
          correlationId: params.correlationId,
          causationId: params.causationId || null,
          initiatorUserId: params.initiatorUserId || null,
          contextPayload: params.contextPayload || null,
          startedAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // 4. Record initial step
      await executor.insert(processInstanceSteps).values({
        processInstanceId: inserted.id,
        stepCode: params.initialStep,
        stepName: `Process Started: ${params.initialStep}`,
        status: "COMPLETED",
        entityModule: params.rootEntityModule,
        entityType: params.rootEntityType,
        entityId: String(params.rootEntityId),
        eventId: null,
        performedBy: params.initiatorUserId || null,
        stepPayload: params.contextPayload || null,
        startedAt: new Date(),
        completedAt: new Date(),
      });

      return inserted;
    } catch (err: any) {
      // Handle unique constraint conflict under race conditions
      const isConstraintErr =
        err.message?.includes("UNIQUE constraint failed") ||
        err.message?.includes("SQLITE_CONSTRAINT") ||
        err.code === "SQLITE_CONSTRAINT" ||
        err.cause?.code?.includes("SQLITE_CONSTRAINT");

      if (isConstraintErr) {
        for (let attempt = 0; attempt < 5; attempt++) {
          const [concurrentExisting] = await executor
            .select()
            .from(processInstances)
            .where(
              and(
                eq(processInstances.processDefinitionKey, params.processDefinitionKey),
                eq(processInstances.businessKey, params.businessKey)
              )
            )
            .limit(1);

          if (concurrentExisting) {
            return concurrentExisting;
          }
          await new Promise((r) => setTimeout(r, 10));
        }
      }
      throw err;
    }
  }

  /**
   * Idempotently records a process step transition and updates the instance status.
   */
  static async recordStepTransition(params: RecordStepParams, txHandle?: any) {
    await ensureProcessTraceabilityTablesExist();
    const executor = txHandle || db;

    // Check if step was already recorded for this instance & stepCode & eventId/entityId (retry idempotency)
    let existingStep;
    if (params.eventId) {
      [existingStep] = await executor
        .select()
        .from(processInstanceSteps)
        .where(
          and(
            eq(processInstanceSteps.processInstanceId, params.processInstanceId),
            eq(processInstanceSteps.stepCode, params.stepCode),
            eq(processInstanceSteps.eventId, params.eventId)
          )
        )
        .limit(1);
    } else {
      [existingStep] = await executor
        .select()
        .from(processInstanceSteps)
        .where(
          and(
            eq(processInstanceSteps.processInstanceId, params.processInstanceId),
            eq(processInstanceSteps.stepCode, params.stepCode),
            eq(processInstanceSteps.entityType, params.entityType),
            eq(processInstanceSteps.entityId, String(params.entityId))
          )
        )
        .limit(1);
    }

    if (!existingStep) {
      await executor.insert(processInstanceSteps).values({
        processInstanceId: params.processInstanceId,
        stepCode: params.stepCode,
        stepName: params.stepName,
        status: params.status || "COMPLETED",
        entityModule: params.entityModule,
        entityType: params.entityType,
        entityId: String(params.entityId),
        eventId: params.eventId || null,
        performedBy: params.performedBy || null,
        stepPayload: params.stepPayload || null,
        durationMs: params.durationMs || null,
        startedAt: new Date(),
        completedAt: params.status === "PENDING" ? null : new Date(),
      });
    }

    // Update instance state
    const updateData: any = {
      currentStep: params.stepCode,
      updatedAt: new Date(),
    };

    if (params.isTerminalStep || params.status === "COMPLETED_TERMINAL") {
      updateData.status = "COMPLETED";
      updateData.completedAt = new Date();
    } else if (params.status === "FAILED") {
      updateData.status = "FAILED";
    }

    const [updatedInstance] = await executor
      .update(processInstances)
      .set(updateData)
      .where(eq(processInstances.id, params.processInstanceId))
      .returning();

    return updatedInstance;
  }

  /**
   * Gets a process instance and all step execution records.
   */
  static async getProcessInstanceDetails(instanceId: number) {
    await ensureProcessTraceabilityTablesExist();
    const [instance] = await db
      .select()
      .from(processInstances)
      .where(eq(processInstances.id, instanceId))
      .limit(1);

    if (!instance) return null;

    const steps = await db
      .select()
      .from(processInstanceSteps)
      .where(eq(processInstanceSteps.processInstanceId, instanceId))
      .orderBy(processInstanceSteps.id);

    return {
      ...instance,
      steps,
    };
  }

  /**
   * Queries process instances by business key, correlation ID, or filters.
   * Uses actual schema columns: startedAt, processDefinitionKey, businessKey, correlationId, status.
   */
  static async queryProcessInstances(filters: {
    processDefinitionKey?: string;
    businessKey?: string;
    correlationId?: string;
    status?: string;
    limit?: number;
  }) {
    await ensureProcessTraceabilityTablesExist();
    let query = db.select().from(processInstances);
    const conditions = [];

    if (filters.processDefinitionKey) {
      conditions.push(eq(processInstances.processDefinitionKey, filters.processDefinitionKey));
    }
    if (filters.businessKey) {
      conditions.push(eq(processInstances.businessKey, filters.businessKey));
    }
    if (filters.correlationId) {
      conditions.push(eq(processInstances.correlationId, filters.correlationId));
    }
    if (filters.status) {
      conditions.push(eq(processInstances.status, filters.status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query.orderBy(desc(processInstances.startedAt)).limit(filters.limit || 50);
    return results;
  }
}
