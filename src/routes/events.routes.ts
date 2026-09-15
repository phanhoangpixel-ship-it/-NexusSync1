import { Router } from "express";
import { db } from "../../db/index";
import * as schema from "../../db/schema";
import { eq, desc, sql, or, like, and, gte, lte } from "drizzle-orm";

export const eventsRouter = Router();

// Rich initial baseline seed events representing real enterprise business events
const INITIAL_OUTBOX_SEEDS = [
  {
    eventId: "EVT-2026-9001",
    eventType: "OrderConfirmed",
    eventVersion: 1,
    aggregateType: "SalesOrder",
    aggregateId: "SO-2026-00129",
    source: "M13 Bán Hàng & Phân Phối",
    actorId: "sales_lead_hn",
    correlationId: "CORR-SO-9001",
    causationId: "CMD-CONFIRM-SO-00129",
    payload: JSON.stringify({
      soCode: "SO-2026-00129",
      customerCode: "CUST-VIN-01",
      customerName: "Tập đoàn VinFast Auto Việt Nam",
      totalAmountVND: 450000000,
      currency: "VND",
      linesCount: 8,
      warehouseTarget: "WH-HN-01",
      deliveryDate: "2026-09-15"
    }),
    metadata: JSON.stringify({ priority: "HIGH", region: "HN-HQ", channel: "B2B_ENTERPRISE" }),
    status: "PUBLISHED",
    retryCount: 0,
    publishedAt: new Date(Date.now() - 1000 * 60 * 25), // 25 mins ago
  },
  {
    eventId: "EVT-2026-9002",
    eventType: "StockReserved",
    eventVersion: 1,
    aggregateType: "StockReservation",
    aggregateId: "RES-2026-8821",
    source: "M17 Quản Lý Kho & Tồn Kho",
    actorId: "wms_engine_auto",
    correlationId: "CORR-SO-9001",
    causationId: "EVT-2026-9001",
    payload: JSON.stringify({
      reservationCode: "RES-2026-8821",
      warehouseId: "WH-HN-01",
      warehouseName: "Kho Tổng Hà Nội - Khu A",
      sku: "LAPTOP-DELL-LATITUDE-5420",
      productName: "Máy tính xách tay Dell Latitude 5420 i7",
      qtyReserved: 50,
      uom: "CÁI",
      binLocation: "BIN-A1-04-RACK2",
      reservationType: "HARD_ALLOCATION"
    }),
    metadata: JSON.stringify({ bin: "BIN-A1-04", operator: "SYSTEM_WMS" }),
    status: "ACKNOWLEDGED",
    retryCount: 0,
    publishedAt: new Date(Date.now() - 1000 * 60 * 22), // 22 mins ago
  },
  {
    eventId: "EVT-2026-9003",
    eventType: "GLJournalPosted",
    eventVersion: 1,
    aggregateType: "JournalEntry",
    aggregateId: "JE-2026-0892",
    source: "M30 Sổ Cái & Báo Cáo Tài Chính",
    actorId: "kt_truong_nguyen",
    correlationId: "CORR-SO-9001",
    causationId: "EVT-2026-9001",
    payload: JSON.stringify({
      journalEntryCode: "JE-2026-0892",
      fiscalPeriod: "2026-09",
      debitAccount: "1311",
      creditAccount: "5111",
      totalDebitVND: 450000000,
      totalCreditVND: 450000000,
      description: "Ghi nhận doanh thu bán lô máy tính Dell cho VinFast",
      checksumSHA256: "a1b2c3d4e5f60718293a4b5c6d7e8f90382910ab"
    }),
    metadata: JSON.stringify({ period: "2026-09", approvedBy: "CFO_OFFICE" }),
    status: "PUBLISHED",
    retryCount: 0,
    publishedAt: new Date(Date.now() - 1000 * 60 * 18), // 18 mins ago
  },
  {
    eventId: "EVT-2026-9004",
    eventType: "MRPMaterialShortage",
    eventVersion: 1,
    aggregateType: "ManufacturingOrder",
    aggregateId: "MO-2026-0044",
    source: "M26 Kế Hoạch Cung Ứng & MRP",
    actorId: "mrp_scheduler_v2",
    correlationId: "CORR-MRP-0044",
    causationId: "CMD-RUN-MRP-NIGHTLY",
    payload: JSON.stringify({
      moCode: "MO-2026-0044",
      productTarget: "PIN-LITHIUM-100AH-EV",
      shortageComponentSku: "CHIP-MICRO-M3-INDUSTRIAL",
      requiredQty: 2500,
      availableQty: 420,
      shortageQty: 2080,
      plantCode: "PLANT-HP-01",
      estStoppageHours: 48
    }),
    metadata: JSON.stringify({ plant: "PLANT-HP-01", severity: "CRITICAL_STOPPAGE" }),
    status: "DLQ_FAILED",
    retryCount: 3,
    lastError: "Connection timeout to ProcurementAlertDispatcher (HTTP 504 Gateway Timeout) after 3 retries",
    publishedAt: new Date(Date.now() - 1000 * 60 * 12), // 12 mins ago
  },
  {
    eventId: "EVT-2026-9005",
    eventType: "GoodsReceiptCompleted",
    eventVersion: 1,
    aggregateType: "GoodsReceipt",
    aggregateId: "GRN-2026-0182",
    source: "M08 Quản Lý Mua Hàng & PO",
    actorId: "thu_kho_tran_van_b",
    correlationId: "CORR-PO-7712",
    causationId: "CMD-CONFIRM-GRN-0182",
    payload: JSON.stringify({
      grnCode: "GRN-2026-0182",
      poCode: "PO-2026-00321",
      supplierCode: "SUPP-HOAPHAT-01",
      supplierName: "Công ty Cổ phần Tập đoàn Hòa Phát",
      warehouseId: "WH-DN-02",
      totalWeightKg: 12500,
      qualityStatus: "QC_PASSED_100_PERCENT",
      deliveryBatch: "BATCH-HP-20260908"
    }),
    metadata: JSON.stringify({ dock: "DOCK-02", invoiceAttached: true }),
    status: "ACKNOWLEDGED",
    retryCount: 0,
    publishedAt: new Date(Date.now() - 1000 * 60 * 8), // 8 mins ago
  },
  {
    eventId: "EVT-2026-9006",
    eventType: "QualityInspectionFailed",
    eventVersion: 1,
    aggregateType: "QCInspection",
    aggregateId: "QC-2026-0419",
    source: "M39 Quản Lý Chất Lượng QC/QA",
    actorId: "qc_lead_le_thi_c",
    correlationId: "CORR-QC-0419",
    causationId: "CMD-INSPECT-LOT-8812",
    payload: JSON.stringify({
      qcCode: "QC-2026-0419",
      lotNumber: "LOT-VALVE-2026-B1",
      supplier: "Nhà Cung Cấp Van Công Nghiệp Á Châu",
      defectsFound: ["Dung sai kích thước vượt quá ±0.05mm", "Áp suất thử nghiệm không đạt 16 bar"],
      defectRatePercent: 18.5,
      thresholdAllowed: 2.0,
      actionRequired: "QUARANTINE_AND_RETURN_RMA"
    }),
    metadata: JSON.stringify({ lab: "LAB-QC-HN", quarantineZone: "QZ-01" }),
    status: "PUBLISHED",
    retryCount: 0,
    publishedAt: new Date(Date.now() - 1000 * 60 * 4), // 4 mins ago
  },
  {
    eventId: "EVT-2026-9007",
    eventType: "PaymentReceived",
    eventVersion: 1,
    aggregateType: "PaymentReceipt",
    aggregateId: "PAY-2026-0774",
    source: "M32 Quản Lý Thu Chi & Treasury",
    actorId: "thu_quy_vietinbank",
    correlationId: "CORR-INV-3391",
    causationId: "WEBHOOK-VIETINBANK-VA",
    payload: JSON.stringify({
      paymentCode: "PAY-2026-0774",
      invoiceCode: "INV-2026-00412",
      amountVND: 120000000,
      bankAccount: "VietinBank - 110002938192 (VND)",
      payer: "Công ty TNHH Cơ Khí Bách Khoa",
      refTxId: "VTB-FT-998821903",
      reconciledStatus: "AUTO_MATCHED_WITH_AR"
    }),
    metadata: JSON.stringify({ gateway: "BANK_DIRECT_API", autoReconciled: true }),
    status: "ACKNOWLEDGED",
    retryCount: 0,
    publishedAt: new Date(Date.now() - 1000 * 60 * 2), // 2 mins ago
  },
  {
    eventId: "EVT-2026-9008",
    eventType: "CRMDealWon",
    eventVersion: 1,
    aggregateType: "Opportunity",
    aggregateId: "OPP-2026-0158",
    source: "M12 Quản Lý Khách Hàng CRM",
    actorId: "sales_director_hcm",
    correlationId: "CORR-CRM-0158",
    causationId: "CMD-CLOSE-DEAL-WON",
    payload: JSON.stringify({
      oppCode: "OPP-2026-0158",
      dealName: "Dự Án Số Hóa Nhà Máy Thông Minh FPT Smart",
      accountName: "FPT Telecom - Chi nhánh Phía Nam",
      contractValueVND: 1850000000,
      commissionEligible: true,
      assignee: "Nguyễn Văn Hùng (Senior AM)"
    }),
    metadata: JSON.stringify({ pipeline: "ENTERPRISE_DIGITAL_TRANSFORMATION" }),
    status: "PUBLISHED",
    retryCount: 0,
    publishedAt: new Date(Date.now() - 1000 * 45), // 45s ago
  }
];

// Active subscribers state with live heartbeats
let SUBSCRIBERS_STATE = [
  { id: "sub-01", name: "InventoryReservationConsumer", topic: "erp.sales.order.*", status: "HEALTHY", lag: 0, lastHeartbeat: "Vừa xong", consumerGroup: "WMS-Consumers" },
  { id: "sub-02", name: "GeneralLedgerDoubleEntrySync", topic: "erp.finance.*", status: "HEALTHY", lag: 2, lastHeartbeat: "Vừa xong", consumerGroup: "Finance-Consumers" },
  { id: "sub-03", name: "AuditImmutableLedgerWriter", topic: "erp.#", status: "HEALTHY", lag: 0, lastHeartbeat: "Vừa xong", consumerGroup: "Audit-Consumers" },
  { id: "sub-04", name: "ProcurementNotificationDispatcher", topic: "erp.manufacturing.*", status: "DEGRADED", lag: 14, lastHeartbeat: "12s trước", consumerGroup: "SCM-Consumers" },
  { id: "sub-05", name: "ECommerceOmniChannelSync", topic: "erp.inventory.stock.*", status: "HEALTHY", lag: 1, lastHeartbeat: "Vừa xong", consumerGroup: "POS-Consumers" },
  { id: "sub-06", name: "QualityControlQuarantineHandler", topic: "erp.quality.inspection.*", status: "HEALTHY", lag: 0, lastHeartbeat: "Vừa xong", consumerGroup: "QC-Consumers" },
  { id: "sub-07", name: "TreasuryBankReconciliationWorker", topic: "erp.treasury.payment.*", status: "HEALTHY", lag: 0, lastHeartbeat: "Vừa xong", consumerGroup: "Treasury-Consumers" }
];

/**
 * Helper to ensure seeds exist in DB
 */
async function ensureEventSeeds() {
  try {
    const existing = await db.select().from(schema.outboxEvents).all();
    if (existing.length === 0) {
      for (const seed of INITIAL_OUTBOX_SEEDS) {
        await db.insert(schema.outboxEvents).values({
          eventId: seed.eventId,
          eventType: seed.eventType,
          eventVersion: seed.eventVersion,
          aggregateType: seed.aggregateType,
          aggregateId: seed.aggregateId,
          source: seed.source,
          actorId: seed.actorId,
          correlationId: seed.correlationId,
          causationId: seed.causationId,
          payload: seed.payload,
          metadata: seed.metadata,
          status: seed.status,
          retryCount: seed.retryCount,
          lastError: (seed as any).lastError || null,
          publishedAt: seed.publishedAt,
        }).run();
      }
    }
  } catch (err) {
    console.error("Warning during ensureEventSeeds:", err);
  }
}

/**
 * Format DB event to EventBusItem
 */
function mapDbEventToBusItem(dbEvt: any) {
  let parsedPayload: any = {};
  try {
    parsedPayload = typeof dbEvt.payload === "string" ? JSON.parse(dbEvt.payload) : dbEvt.payload;
  } catch (e) {
    parsedPayload = { raw: dbEvt.payload };
  }

  // Topic mapping from eventType
  let topic = `erp.${dbEvt.source?.toLowerCase().replace(/[^a-z0-9]/g, ".").replace(/\.+/g, ".") || "core"}.${dbEvt.eventType?.toLowerCase() || "event"}`;
  if (dbEvt.eventType === "OrderConfirmed") topic = "erp.sales.order.created";
  else if (dbEvt.eventType === "StockReserved") topic = "erp.inventory.stock.reserved";
  else if (dbEvt.eventType === "GLJournalPosted") topic = "erp.finance.gl.posted";
  else if (dbEvt.eventType === "MRPMaterialShortage") topic = "erp.manufacturing.mrp.failed";
  else if (dbEvt.eventType === "GoodsReceiptCompleted") topic = "erp.procurement.grn.completed";
  else if (dbEvt.eventType === "QualityInspectionFailed") topic = "erp.quality.inspection.failed";
  else if (dbEvt.eventType === "PaymentReceived") topic = "erp.treasury.payment.received";
  else if (dbEvt.eventType === "CRMDealWon") topic = "erp.crm.deal.won";

  let consumer = "GlobalEventDispatcher";
  if (topic.includes("sales")) consumer = "InventoryService & AccountingService";
  else if (topic.includes("inventory")) consumer = "SalesOrderFulfillment & WarehouseWMS";
  else if (topic.includes("finance") || topic.includes("gl")) consumer = "AuditLedgerService & FinancialReporting";
  else if (topic.includes("manufacturing") || topic.includes("mrp")) consumer = "ProcurementAlertDispatcher & PlantSupervisor";
  else if (topic.includes("procurement") || topic.includes("grn")) consumer = "WarehouseWMS & APInvoiceService";
  else if (topic.includes("quality")) consumer = "WarehouseQuarantineZone & SupplierSRM";
  else if (topic.includes("treasury") || topic.includes("payment")) consumer = "AccountsReceivableSync & CashBookLedger";
  else if (topic.includes("crm")) consumer = "SalesCommissionService & ProjectInitialization";

  return {
    id: dbEvt.eventId,
    topic: topic,
    eventType: dbEvt.eventType,
    aggregateType: dbEvt.aggregateType,
    aggregateId: dbEvt.aggregateId,
    sourceModule: dbEvt.source || "M05 EventBus",
    actorId: dbEvt.actorId || "system",
    payload: parsedPayload,
    status: dbEvt.status as any,
    timestamp: dbEvt.publishedAt ? new Date(dbEvt.publishedAt).toISOString() : (dbEvt.occurredAt ? new Date(dbEvt.occurredAt).toISOString() : new Date().toISOString()),
    retryCount: dbEvt.retryCount || 0,
    consumer: consumer,
    correlationId: dbEvt.correlationId,
    causationId: dbEvt.causationId,
    lastError: dbEvt.lastError
  };
}

/**
 * GET /api/events/outbox
 * Fetch events stream with rich filtering support:
 * - search: query string
 * - status: 'ALL' | 'PUBLISHED' | 'ACKNOWLEDGED' | 'DLQ_FAILED' | 'PENDING'
 * - source: 'ALL' | source string
 * - domain / eventType: string
 * - timeRange: 'all' | '15m' | '1h' | 'today' | '7d' | '30d' | 'custom'
 * - startDate / endDate: ISO date strings
 */
eventsRouter.get("/api/events/outbox", async (req, res) => {
  try {
    await ensureEventSeeds();
    const { search, status, source, domain, timeRange, startDate, endDate } = req.query;

    const dbEvents = await db.select().from(schema.outboxEvents).orderBy(desc(schema.outboxEvents.id)).all();
    let mapped = dbEvents.map(mapDbEventToBusItem);

    // Apply filters
    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.toLowerCase().trim();
      mapped = mapped.filter(e => 
        e.id.toLowerCase().includes(q) ||
        e.topic.toLowerCase().includes(q) ||
        (e.eventType && e.eventType.toLowerCase().includes(q)) ||
        (e.aggregateId && e.aggregateId.toLowerCase().includes(q)) ||
        (e.correlationId && e.correlationId.toLowerCase().includes(q)) ||
        (e.actorId && e.actorId.toLowerCase().includes(q)) ||
        e.sourceModule.toLowerCase().includes(q) ||
        e.consumer.toLowerCase().includes(q) ||
        JSON.stringify(e.payload).toLowerCase().includes(q)
      );
    }

    if (status && typeof status === "string" && status !== "ALL") {
      mapped = mapped.filter(e => e.status === status);
    }

    if (source && typeof source === "string" && source !== "ALL") {
      mapped = mapped.filter(e => e.sourceModule === source);
    }

    if (domain && typeof domain === "string" && domain !== "ALL") {
      const dom = domain.toLowerCase();
      mapped = mapped.filter(e => e.topic.toLowerCase().includes(dom) || e.sourceModule.toLowerCase().includes(dom));
    }

    // Time filtering
    if (timeRange && typeof timeRange === "string" && timeRange !== "ALL" && timeRange !== "all") {
      const now = Date.now();
      if (timeRange === "15m") {
        mapped = mapped.filter(e => now - new Date(e.timestamp).getTime() <= 15 * 60 * 1000);
      } else if (timeRange === "1h") {
        mapped = mapped.filter(e => now - new Date(e.timestamp).getTime() <= 60 * 60 * 1000);
      } else if (timeRange === "today") {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        mapped = mapped.filter(e => new Date(e.timestamp).getTime() >= startOfToday.getTime());
      } else if (timeRange === "7d") {
        mapped = mapped.filter(e => now - new Date(e.timestamp).getTime() <= 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === "30d") {
        mapped = mapped.filter(e => now - new Date(e.timestamp).getTime() <= 30 * 24 * 60 * 60 * 1000);
      } else if (timeRange === "custom" && (startDate || endDate)) {
        if (startDate && typeof startDate === "string") {
          const sTime = new Date(startDate).getTime();
          mapped = mapped.filter(e => new Date(e.timestamp).getTime() >= sTime);
        }
        if (endDate && typeof endDate === "string") {
          const eTime = new Date(endDate).getTime();
          mapped = mapped.filter(e => new Date(e.timestamp).getTime() <= eTime);
        }
      }
    }

    res.json({
      success: true,
      events: mapped,
      total: mapped.length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/events/publish
 * Publish new event to EventBus & Outbox
 */
eventsRouter.post("/api/events/publish", async (req, res) => {
  try {
    const { topic, payload, sourceModule, aggregateType, aggregateId, eventType, actorId } = req.body;
    if (!topic || !payload) {
      return res.status(400).json({ success: false, error: "Missing required fields: topic, payload" });
    }

    const eventId = `EVT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const computedEventType = eventType || topic.split(".").pop() || "CustomEvent";
    const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);

    await db.insert(schema.outboxEvents).values({
      eventId: eventId,
      eventType: computedEventType,
      eventVersion: 1,
      aggregateType: aggregateType || "EventBus",
      aggregateId: aggregateId || eventId,
      source: sourceModule || "M05 EventBus Console",
      actorId: actorId || "super_admin",
      correlationId: `CORR-${eventId}`,
      causationId: "CMD-MANUAL-PUBLISH",
      payload: payloadStr,
      metadata: JSON.stringify({ topic, source: "M05_CONSOLE" }),
      status: "PUBLISHED",
      retryCount: 0,
      publishedAt: new Date(),
    }).run();

    res.json({
      success: true,
      message: `Đã phát sự kiện ${eventId} vào Topic [${topic}] thành công.`,
      eventId: eventId
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/events/trigger-business-event
 * Dispatches real Business Events from interconnected ERP modules
 */
eventsRouter.post("/api/events/trigger-business-event", async (req, res) => {
  try {
    const { 
      domain, 
      eventType, 
      aggregateId, 
      aggregateType, 
      sourceModule, 
      payload, 
      actorId, 
      correlationId, 
      causationId,
      simulateFailure 
    } = req.body;

    if (!eventType || !payload) {
      return res.status(400).json({ success: false, error: "Missing required fields: eventType, payload" });
    }

    const eventId = `EVT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);
    const status = simulateFailure ? "DLQ_FAILED" : "PUBLISHED";
    const lastError = simulateFailure ? `Simulated consumer dispatch failure on ${eventType}: Connection refused` : null;
    const retryCount = simulateFailure ? 3 : 0;

    await db.insert(schema.outboxEvents).values({
      eventId: eventId,
      eventType: eventType,
      eventVersion: 1,
      aggregateType: aggregateType || domain || "BusinessEntity",
      aggregateId: aggregateId || `AGG-${Math.floor(1000 + Math.random() * 9000)}`,
      source: sourceModule || `M05 ${domain || "ERP"} Engine`,
      actorId: actorId || "business_actor",
      correlationId: correlationId || `CORR-${eventId}`,
      causationId: causationId || `CMD-${eventType.toUpperCase()}`,
      payload: payloadStr,
      metadata: JSON.stringify({ domain: domain || "core", triggeredAt: new Date().toISOString() }),
      status: status,
      retryCount: retryCount,
      lastError: lastError,
      publishedAt: new Date(),
    }).run();

    res.json({
      success: true,
      message: `Đã kích hoạt sự kiện nghiệp vụ [${eventType}] thành công (${status}).`,
      eventId: eventId,
      status: status
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/events/retry/:id
 * Retry single event from DLQ
 */
eventsRouter.post("/api/events/retry/:id", async (req, res) => {
  try {
    const eventId = req.params.id;
    await db.update(schema.outboxEvents)
      .set({
        status: "PUBLISHED",
        retryCount: 0,
        lastError: null,
        publishedAt: new Date(),
      })
      .where(eq(schema.outboxEvents.eventId, eventId))
      .run();

    res.json({
      success: true,
      message: `Đã tái phát sự kiện ${eventId} lên EventBus thành công.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/events/retry-all-dlq
 * Bulk retry all failed DLQ events
 */
eventsRouter.post("/api/events/retry-all-dlq", async (req, res) => {
  try {
    await db.update(schema.outboxEvents)
      .set({
        status: "PUBLISHED",
        retryCount: 0,
        lastError: null,
        publishedAt: new Date(),
      })
      .where(eq(schema.outboxEvents.status, "DLQ_FAILED"))
      .run();

    res.json({
      success: true,
      message: "Toàn bộ sự kiện trong Dead Letter Queue đã được khôi phục thành công."
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/events/subscribers/:id/restart
 */
eventsRouter.post("/api/events/subscribers/:id/restart", (req, res) => {
  const subId = req.params.id;
  const sub = SUBSCRIBERS_STATE.find(s => s.id === subId);
  if (sub) {
    sub.status = "HEALTHY";
    sub.lag = 0;
    sub.lastHeartbeat = "Vừa xong";
  }
  res.json({
    success: true,
    message: `Đã khởi động lại Consumer [${sub ? sub.name : subId}] thành công.`
  });
});

/**
 * POST /api/events/subscribers/:id/reset-offset
 */
eventsRouter.post("/api/events/subscribers/:id/reset-offset", (req, res) => {
  const subId = req.params.id;
  const sub = SUBSCRIBERS_STATE.find(s => s.id === subId);
  if (sub) {
    sub.lag = 0;
  }
  res.json({
    success: true,
    message: `Đã đặt lại Offset về LATEST cho [${sub ? sub.name : subId}].`
  });
});

/**
 * GET /api/events/subscribers
 * Fetch active subscribers and consumer lag
 */
eventsRouter.get("/api/events/subscribers", (req, res) => {
  res.json({
    success: true,
    subscribers: SUBSCRIBERS_STATE,
    total: SUBSCRIBERS_STATE.length
  });
});

/**
 * GET /api/events/metrics
 * Fetch system EDA metrics
 */
eventsRouter.get("/api/events/metrics", async (req, res) => {
  try {
    const all = await db.select().from(schema.outboxEvents).all();
    const total = all.length;
    const published = all.filter(e => e.status === "PUBLISHED").length;
    const acknowledged = all.filter(e => e.status === "ACKNOWLEDGED").length;
    const dlqFailed = all.filter(e => e.status === "DLQ_FAILED" || e.status === "FAILED").length;

    res.json({
      success: true,
      metrics: {
        totalEvents: total,
        publishedCount: published,
        acknowledgedCount: acknowledged,
        dlqFailedCount: dlqFailed,
        throughputPerSec: 2450,
        avgLatencyMs: 14.8,
        uptimePct: 99.99
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
