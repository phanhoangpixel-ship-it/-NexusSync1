import { db, client } from "../src/db/index";
import { 
  outboxEvents, processedEvents, dlqEvents, auditLogs, 
  processInstances, processInstanceSteps, businessTasks,
  stockBalances, products, customers, salesOrders
} from "../src/db/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { accountingEngine } from "./accountingEngine";
import { costingEngine } from "./costingEngine";
import { InventoryService } from "./inventoryService";

/**
 * MASTER EVENT ROUTER
 * Maps Domain Event Types to Subscribers
 */
export const EVENT_ROUTER: Record<string, string[]> = {
  // CRM Events
  "CrmLeadCreated": ["AuditSubscriber", "CrmNotificationSubscriber"],
  "CrmLeadConverted": ["AuditSubscriber", "SalesCustomerSubscriber"],
  "CrmOpportunityWon": ["AuditSubscriber", "SalesOrderSubscriber", "ProcessOrchestratorSubscriber"],

  // EAM Events
  "MaintenancePartIssued": ["AuditSubscriber", "InventorySubscriber", "AccountingSubscriber"],

  // QMS Events
  "QualityHoldApplied": ["AuditSubscriber", "InventoryQuarantineSubscriber"],
  "QualityDispositionReleased": ["AuditSubscriber", "InventoryReleaseSubscriber"],

  // P2P & O2C Core Events
  "GoodsReceiptPosted": ["AuditSubscriber", "CostingSubscriber", "AccountingSubscriber", "ProcessOrchestratorSubscriber"],
  "GoodsIssueConfirmed": ["AuditSubscriber", "CostingSubscriber", "AccountingSubscriber", "ProcessOrchestratorSubscriber"],
  "OrderConfirmed": ["AuditSubscriber", "ProcessOrchestratorSubscriber", "InventoryAllocationSubscriber"],
  "StockIssued": ["AuditSubscriber", "CostingSubscriber", "AccountingSubscriber"],
  "GoodsReceived": ["AuditSubscriber", "CostingSubscriber", "AccountingSubscriber"],

  // Commission & Incentive Events
  "CommissionAccrued": ["AuditSubscriber", "AccountingSubscriber"],
  "CommissionDisbursed": ["AuditSubscriber", "AccountingSubscriber"],

  // Process Orchestration Events
  "ProcessInstanceStarted": ["AuditSubscriber", "OrchestratorMonitoringSubscriber"],
  "ProcessStepCompleted": ["AuditSubscriber", "OrchestratorMonitoringSubscriber"],
  "TaskCreated": ["AuditSubscriber", "NotificationSubscriber"],
  "TaskCompleted": ["AuditSubscriber", "ProcessOrchestratorSubscriber"]
};

/**
 * Execute a specific subscriber handler for an outbox event.
 * Enforces consumer-level idempotency via processed_events table.
 */
export async function executeSubscriberHandler(consumer: string, event: any): Promise<void> {
  const eventId = event.eventId || event.event_id;
  const eventType = event.eventType || event.event_type;

  // 1. Idempotency Check: Verify if this event was already processed by this consumer
  const existing = await db.select()
    .from(processedEvents)
    .where(and(
      eq(processedEvents.eventId, eventId),
      eq(processedEvents.consumer, consumer)
    ))
    .limit(1);

  if (existing.length > 0 && existing[0].status === "SUCCESS") {
    console.log(`[EventRouter] Event ${eventId} already processed by ${consumer}. Skipping (Idempotent).`);
    return;
  }

  try {
    let payload = event.payload;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        // keep as string if not JSON
      }
    }

    // 2. Dispatch to specific consumer logic
    switch (consumer) {
      case "AuditSubscriber": {
        await db.insert(auditLogs).values({
          auditCode: `AUD-EVT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          userId: parseInt(event.actorId, 10) || 1,
          username: "system_event_bus",
          role: "SYSTEM",
          action: "SYNC",
          entityType: event.aggregateType || "EVENT",
          entityId: String(event.aggregateId || eventId),
          module: event.source || "EVENT_BUS",
          correlationId: event.correlationId || null,
          afterData: JSON.stringify(payload),
          result: "SUCCESS",
          metadata: JSON.stringify({
            eventId: event.eventId,
            eventType: event.eventType,
            source: event.source,
            causationId: event.causationId
          }),
          createdAt: new Date()
        });
        break;
      }

      case "ProcessOrchestratorSubscriber": {
        // If event has correlationId or businessKey, advance process instances
        if (event.correlationId) {
          const instances = await db.select()
            .from(processInstances)
            .where(eq(processInstances.correlationId, event.correlationId));

          for (const inst of instances) {
            await db.insert(processInstanceSteps).values({
              processInstanceId: inst.id,
              stepCode: `STEP_EVENT_${eventType}`,
              stepName: `Auto-recorded by event ${eventType}`,
              status: "COMPLETED",
              entityModule: event.source || "CORE",
              entityType: event.aggregateType || "EVENT",
              entityId: String(event.aggregateId || inst.businessKey),
              eventId: eventId,
              performedBy: parseInt(event.actorId, 10) || 1,
              stepPayload: payload,
              startedAt: new Date(),
              completedAt: new Date()
            });
          }
        }
        break;
      }

      case "AccountingSubscriber": {
        // Authoritative GL Posting based on domain event type
        const actorId = parseInt(event.actorId, 10) || 1;
        const refNo = event.aggregateId || `EVT-${eventId}`;

        if (eventType === "GoodsReceiptPosted" || eventType === "GoodsReceived") {
          const amount = Number(payload?.totalAmount || payload?.amount || (Number(payload?.quantity || 1) * Number(payload?.unitPrice || 100000))) || 1000000;
          await accountingEngine.postJournal({
            sourceModule: "PURCHASE_RECEIPT",
            sourceDocumentType: "GOODS_RECEIPT",
            sourceReferenceNo: refNo,
            debitAccount: payload?.debitAccount || "156",
            creditAccount: payload?.creditAccount || "331",
            amount,
            description: `Tự động hạch toán nhập kho từ sự kiện ${eventType} [${refNo}]`,
            supplierId: payload?.supplierId ? Number(payload.supplierId) : null,
            createdBy: actorId,
          });
        } else if (eventType === "GoodsIssueConfirmed" || eventType === "StockIssued") {
          const amount = Number(payload?.totalCost || payload?.amount || 500000);
          await accountingEngine.postJournal({
            sourceModule: "SALES_DELIVERY",
            sourceDocumentType: "STOCK_ISSUE",
            sourceReferenceNo: refNo,
            debitAccount: payload?.debitAccount || "632",
            creditAccount: payload?.creditAccount || "156",
            amount,
            description: `Tự động hạch toán giá vốn hàng bán xuất kho [${refNo}]`,
            customerId: payload?.customerId ? Number(payload.customerId) : null,
            createdBy: actorId,
          });
        } else if (eventType === "MaintenancePartIssued") {
          const amount = Number(payload?.cost || payload?.amount || 250000);
          await accountingEngine.postJournal({
            sourceModule: "EAM_MAINTENANCE",
            sourceDocumentType: "MAINTENANCE_ISSUE",
            sourceReferenceNo: refNo,
            debitAccount: payload?.debitAccount || "627",
            creditAccount: payload?.creditAccount || "153",
            amount,
            description: `Tự động hạch toán xuất linh kiện bảo trì bảo dưỡng thiết bị [${refNo}]`,
            createdBy: actorId,
          });
        } else if (eventType === "CommissionAccrued") {
          const amount = Number(payload?.commissionAmount || payload?.amount || 1500000);
          await accountingEngine.postJournal({
            sourceModule: "SALES_COMMISSION",
            sourceDocumentType: "COMMISSION_ACCRUAL",
            sourceReferenceNo: refNo,
            debitAccount: "641",
            creditAccount: "338",
            amount,
            description: `Tự động trích trước chi phí hoa hồng bán hàng [${refNo}]`,
            createdBy: actorId,
          });
        } else if (eventType === "CommissionDisbursed") {
          const amount = Number(payload?.disbursedAmount || payload?.amount || 1500000);
          await accountingEngine.postJournal({
            sourceModule: "SALES_COMMISSION",
            sourceDocumentType: "COMMISSION_PAYMENT",
            sourceReferenceNo: refNo,
            debitAccount: "338",
            creditAccount: "112",
            amount,
            description: `Tự động hạch toán chi trả hoa hồng kinh doanh [${refNo}]`,
            createdBy: actorId,
          });
        }
        break;
      }

      case "CostingSubscriber": {
        const actorId = parseInt(event.actorId, 10) || 1;
        const productId = Number(payload?.productId || 1);
        const warehouseId = Number(payload?.warehouseId || 1);
        const quantity = Number(payload?.quantity || 1);
        const unitCost = Number(payload?.unitPrice || payload?.unitCost || 100000);

        if (eventType === "GoodsReceiptPosted" || eventType === "GoodsReceived") {
          if (productId && quantity > 0) {
            await costingEngine.addCostLayer({
              productId,
              warehouseId,
              quantity,
              unitCost,
              goodsReceiptId: payload?.receiptId ? Number(payload.receiptId) : null,
              sourceRef: event.aggregateId || `EVT-${eventId}`,
              createdBy: actorId
            });
            await costingEngine.recalculateWeightedAverageCost(productId, warehouseId);
          }
        } else if (eventType === "GoodsIssueConfirmed" || eventType === "StockIssued") {
          if (productId && quantity > 0) {
            await costingEngine.calculateIssue({
              productId,
              warehouseId,
              quantity,
              salesOrderId: payload?.salesOrderId ? Number(payload.salesOrderId) : undefined,
              createdBy: actorId
            });
          }
        }
        break;
      }

      case "InventorySubscriber":
      case "InventoryAllocationSubscriber": {
        const actorId = parseInt(event.actorId, 10) || 1;
        const productId = Number(payload?.productId);
        const warehouseId = Number(payload?.warehouseId || 1);
        const quantity = Number(payload?.quantity);

        if (productId && quantity > 0) {
          try {
            await InventoryService.reserveStock(db, {
              productId,
              warehouseId,
              quantity,
              referenceNo: event.aggregateId || `EVT-${eventId}`,
              userId: actorId,
              notes: `Auto-reserved via EventBus: ${eventType}`
            });
          } catch (invErr) {
            console.warn(`[EventRouter:InventorySubscriber] Could not reserve stock:`, invErr);
          }
        }
        break;
      }

      case "InventoryQuarantineSubscriber": {
        const productId = Number(payload?.productId);
        const warehouseId = Number(payload?.warehouseId || 1);
        const quantity = Number(payload?.quantity || 0);

        if (productId && quantity > 0) {
          await db.update(stockBalances)
            .set({
              stockQuarantine: sql`${stockBalances.stockQuarantine} + ${quantity}`,
              stockAvailable: sql`MAX(0, ${stockBalances.stockAvailable} - ${quantity})`
            })
            .where(and(
              eq(stockBalances.productId, productId),
              eq(stockBalances.warehouseId, warehouseId)
            ));
        }
        break;
      }

      case "InventoryReleaseSubscriber": {
        const productId = Number(payload?.productId);
        const warehouseId = Number(payload?.warehouseId || 1);
        const quantity = Number(payload?.quantity || 0);

        if (productId && quantity > 0) {
          await db.update(stockBalances)
            .set({
              stockQuarantine: sql`MAX(0, ${stockBalances.stockQuarantine} - ${quantity})`,
              stockAvailable: sql`${stockBalances.stockAvailable} + ${quantity}`
            })
            .where(and(
              eq(stockBalances.productId, productId),
              eq(stockBalances.warehouseId, warehouseId)
            ));
        }
        break;
      }

      case "SalesCustomerSubscriber": {
        if (payload?.customerName || payload?.name) {
          const name = payload.customerName || payload.name;
          const phone = payload.phone || payload.contactPhone || "";
          const email = payload.email || payload.contactEmail || "";
          const taxId = payload.taxCode || payload.taxId || "";
          
          const existingCust = await db.select().from(customers).where(eq(customers.name, name)).limit(1);
          if (existingCust.length === 0) {
            await db.insert(customers).values({
              code: `CUST-${Date.now().toString().slice(-4)}`,
              name,
              taxId,
              contactPerson: name,
              phone,
              email,
              address: payload.address || "Việt Nam",
              status: "ACTIVE",
              creditLimit: payload.creditLimit || 50000000,
              paymentTerm: payload.paymentTerm || "Net 30 Days",
              createdAt: new Date()
            });
          }
        }
        break;
      }

      case "SalesOrderSubscriber": {
        const actorId = parseInt(event.actorId, 10) || 1;
        await db.insert(businessTasks).values({
          taskCode: `TSK-SO-${Date.now().toString().slice(-6)}`,
          title: `[Tự động từ Sự kiện] Lập đơn hàng SO & Xuất hóa đơn VAT cho ${payload?.customerName || event.aggregateId || 'Khách hàng'}`,
          description: `Cơ hội bán hàng đã được chốt (Won). Vui lòng xác nhận giữ chỗ tồn kho và phát hành hóa đơn VAT.`,
          entityType: "SALES_ORDER",
          entityId: String(event.aggregateId || eventId),
          assignedTo: actorId,
          priority: "HIGH",
          status: "OPEN",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          createdAt: new Date()
        } as any);
        break;
      }

      case "CrmNotificationSubscriber":
      case "NotificationSubscriber":
      case "OrchestratorMonitoringSubscriber": {
        const actorId = parseInt(event.actorId, 10) || 1;
        await db.insert(businessTasks).values({
          taskCode: `TSK-NTF-${Date.now().toString().slice(-6)}`,
          title: `[Thông báo ${eventType}] ${event.aggregateType || 'Chứng từ'} ${event.aggregateId || eventId}`,
          description: typeof payload === 'object' ? JSON.stringify(payload) : String(payload || 'Nhiệm vụ tự động từ EventBus'),
          entityType: event.aggregateType || "EVENT",
          entityId: String(event.aggregateId || eventId),
          assignedTo: actorId,
          priority: "MEDIUM",
          status: "OPEN",
          dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
          createdAt: new Date()
        } as any);
        break;
      }

      default: {
        console.log(`[EventRouter] Consumer ${consumer} executed handler for event ${eventId} (${eventType})`);
        break;
      }
    }

    // 3. Mark processed in processed_events table
    if (existing.length === 0) {
      await db.insert(processedEvents).values({
        eventId: eventId,
        eventType: eventType,
        consumer: consumer,
        status: "SUCCESS",
        processedAt: new Date(),
        retryCount: 0
      } as any);
    } else {
      await db.update(processedEvents)
        .set({
          status: "SUCCESS",
          processedAt: new Date(),
          error: null
        } as any)
        .where(eq(processedEvents.id, existing[0].id));
    }

  } catch (err: any) {
    console.error(`[EventRouter] Error executing subscriber ${consumer} for event ${eventId}:`, err);
    if (existing.length === 0) {
      await db.insert(processedEvents).values({
        eventId: eventId,
        eventType: eventType,
        consumer: consumer,
        status: "FAILED",
        error: err.message,
        processedAt: new Date(),
        retryCount: 1
      } as any);
    } else {
      await db.update(processedEvents)
        .set({
          status: "FAILED",
          error: err.message,
          retryCount: (existing[0].retryCount || 0) + 1
        } as any)
        .where(eq(processedEvents.id, existing[0].id));
    }
    throw err;
  }
}

/**
 * Setup Event Bus management and monitoring API endpoints
 */
export function setupEventBusApi(app: any, requireAuth: any) {
  // 1. Event Bus Summary / KPI
  app.get("/api/event-bus/summary", requireAuth, async (req: any, res: any) => {
    try {
      const outboxStats = await (client as any).execute({
        sql: `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) as processing,
                SUM(CASE WHEN status = 'PUBLISHED' THEN 1 ELSE 0 END) as published,
                SUM(CASE WHEN status = 'DLQ' THEN 1 ELSE 0 END) as dlq
              FROM outbox_events;`,
        args: []
      });

      const processedStats = await (client as any).execute({
        sql: `SELECT COUNT(*) as total_processed FROM processed_events;`,
        args: []
      });

      const dlqStats = await (client as any).execute({
        sql: `SELECT 
                COUNT(*) as total_dlq,
                SUM(CASE WHEN status = 'UNRESOLVED' THEN 1 ELSE 0 END) as unresolved_dlq
              FROM dlq_events;`,
        args: []
      });

      const rowOutbox: any = outboxStats.rows[0] || {};
      const rowProcessed: any = processedStats.rows[0] || {};
      const rowDlq: any = dlqStats.rows[0] || {};

      res.json({
        totalEvents: rowOutbox.total || 0,
        pendingEvents: rowOutbox.pending || 0,
        processingEvents: rowOutbox.processing || 0,
        publishedEvents: rowOutbox.published || 0,
        dlqEvents: rowOutbox.dlq || rowDlq.total_dlq || 0,
        unresolvedDlq: rowDlq.unresolved_dlq || 0,
        totalProcessed: rowProcessed.total_processed || 0
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Query Outbox Events
  app.get("/api/event-bus/outbox", requireAuth, async (req: any, res: any) => {
    try {
      const { status, search, limit = 50 } = req.query;
      let conditions = [];

      if (status && status !== "ALL") {
        conditions.push(eq(outboxEvents.status, String(status)));
      }

      if (search) {
        conditions.push(
          or(
            like(outboxEvents.eventId, `%${search}%`),
            like(outboxEvents.eventType, `%${search}%`),
            like(outboxEvents.correlationId, `%${search}%`),
            like(outboxEvents.aggregateId, `%${search}%`)
          )
        );
      }

      const query = db.select().from(outboxEvents);
      if (conditions.length > 0) {
        query.where(and(...conditions));
      }

      const results = await query
        .orderBy(desc(outboxEvents.occurredAt))
        .limit(Number(limit));

      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Query Processed Events
  app.get("/api/event-bus/processed", requireAuth, async (req: any, res: any) => {
    try {
      const { consumer, limit = 50 } = req.query;
      const query = db.select().from(processedEvents);

      if (consumer && consumer !== "ALL") {
        query.where(eq(processedEvents.consumer, String(consumer)));
      }

      const results = await query
        .orderBy(desc(processedEvents.processedAt))
        .limit(Number(limit));

      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Query DLQ Events
  app.get("/api/event-bus/dlq", requireAuth, async (req: any, res: any) => {
    try {
      const { status, limit = 50 } = req.query;
      const query = db.select().from(dlqEvents);

      if (status && status !== "ALL") {
        query.where(eq(dlqEvents.status, String(status)));
      }

      const results = await query
        .orderBy(desc(dlqEvents.failedAt))
        .limit(Number(limit));

      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Trace Event Chain by Correlation ID
  app.get("/api/event-bus/trace/:correlationId", requireAuth, async (req: any, res: any) => {
    try {
      const corrId = decodeURIComponent(req.params.correlationId);

      const events = await db.select()
        .from(outboxEvents)
        .where(eq(outboxEvents.correlationId, corrId))
        .orderBy(outboxEvents.occurredAt);

      const dlqs = await db.select()
        .from(dlqEvents)
        .where(eq(dlqEvents.correlationId, corrId))
        .orderBy(dlqEvents.failedAt);

      const eventIds = events.map(e => e.eventId);
      let processed: any[] = [];
      if (eventIds.length > 0) {
        processed = await db.select()
          .from(processedEvents)
          .where(sql`event_id IN (${sql.join(eventIds.map(id => sql`${id}`), sql`, `)})`);
      }

      res.json({
        correlationId: corrId,
        events,
        processed,
        dlqs
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Simulate Event Publishing
  app.post("/api/event-bus/publish", requireAuth, async (req: any, res: any) => {
    try {
      const { eventType, aggregateType, aggregateId, source, correlationId, payload } = req.body;

      if (!eventType || !aggregateType || !aggregateId) {
        return res.status(400).json({ error: "Missing required event fields (eventType, aggregateType, aggregateId)" });
      }

      const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const corrId = correlationId || `CORR-${Date.now()}`;

      const inserted = await db.insert(outboxEvents).values({
        eventId: eventId,
        eventType: eventType,
        aggregateType: aggregateType,
        aggregateId: String(aggregateId),
        source: source || "MANUAL_SIMULATION",
        actorId: String(req.user?.id || 1),
        correlationId: corrId,
        causationId: "SIMULATED_TRIGGER",
        payload: typeof payload === "string" ? payload : JSON.stringify(payload || {}),
        status: "PENDING",
        occurredAt: new Date()
      } as any).returning();

      res.json({
        message: "Event published to outbox successfully",
        eventId: eventId,
        correlationId: corrId,
        event: inserted[0]
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Retry DLQ Event
  app.post("/api/event-bus/dlq/:id/retry", requireAuth, async (req: any, res: any) => {
    try {
      const dlqId = parseInt(req.params.id, 10);
      const dlqRecord = await db.select().from(dlqEvents).where(eq(dlqEvents.id, dlqId)).limit(1);

      if (dlqRecord.length === 0) {
        return res.status(404).json({ error: "DLQ record not found" });
      }

      const item = dlqRecord[0];

      // Reset outbox event to PENDING
      await db.update(outboxEvents)
        .set({
          status: "PENDING",
          retryCount: 0,
          lastError: `Manual retry requested at ${new Date().toISOString()}`,
          nextRetryAt: new Date()
        } as any)
        .where(eq(outboxEvents.eventId, item.eventId));

      // Update DLQ status
      await db.update(dlqEvents)
        .set({
          status: "RETRIED",
          resolvedBy: req.user?.username || "admin",
          resolvedAt: new Date()
        } as any)
        .where(eq(dlqEvents.id, dlqId));

      res.json({ message: "Event queued for retry", eventId: item.eventId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Resolve DLQ Event
  app.post("/api/event-bus/dlq/:id/resolve", requireAuth, async (req: any, res: any) => {
    try {
      const dlqId = parseInt(req.params.id, 10);
      await db.update(dlqEvents)
        .set({
          status: "RESOLVED",
          resolvedBy: req.user?.username || "admin",
          resolvedAt: new Date()
        } as any)
        .where(eq(dlqEvents.id, dlqId));

      res.json({ message: "DLQ event resolved successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
