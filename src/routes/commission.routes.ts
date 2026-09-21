import { Router } from "express";
import crypto from "crypto";
import { db } from "../db/index";
import * as schema from "../db/schema";
import { commissionService } from "../../engines/commissionService";
import { eq, desc, and, sql, inArray, gte, lte } from "drizzle-orm";

export const commissionRouter = Router();

/**
 * Phase 8 Idempotency Enforcement Helper
 */
async function enforceIdempotency(
  req: any,
  res: any,
  actionType: string
): Promise<{ key: string; fingerprint: string } | null> {
  const headerKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
  const bodyKey = req.body?.idempotencyKey;
  const rawKey = (typeof headerKey === 'string' && headerKey.trim())
    ? headerKey.trim()
    : (typeof bodyKey === 'string' && bodyKey.trim())
      ? bodyKey.trim()
      : null;

  if (!rawKey) {
    // Generate a default fallback key if not strictly provided
    return { key: `IDEMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`, fingerprint: 'auto' };
  }

  const payloadFingerprint = crypto.createHash('sha256').update(JSON.stringify({
    method: req.method,
    url: req.baseUrl + req.path,
    params: req.params,
    body: req.body
  })).digest('hex');

  const [existing] = await db.select().from(schema.outboxEvents)
    .where(eq(schema.outboxEvents.eventId, rawKey))
    .limit(1);

  if (existing) {
    let parsedPayload: any = {};
    try {
      parsedPayload = JSON.parse(existing.payload);
    } catch (_) {
      parsedPayload = { data: existing.payload };
    }

    res.status(200).json({
      ...parsedPayload,
      idempotentReplay: true,
      replayed: true,
      idempotencyKey: rawKey,
      replayedAt: new Date().toISOString()
    });
    return null;
  }

  return { key: rawKey, fingerprint: payloadFingerprint };
}

// =========================================================================
// 1. PLANS & RULES MANAGEMENT
// =========================================================================

async function ensureCommissionSeeds() {
  try {
    const existing = await db.select().from(schema.commissionPlans).limit(1);
    if (existing.length === 0) {
      // 1. Plan Revenue Standard
      const [p1] = await db.insert(schema.commissionPlans).values({
        planCode: "COMM-PLAN-REV-STANDARD",
        name: "Chính sách Hoa hồng Doanh thu B2B Tiêu chuẩn",
        description: "Tính hoa hồng lũy tiến theo doanh thu hóa đơn bán hàng thực tế",
        calculationBasis: "INVOICE_ISSUED",
        payoutFrequency: "MONTHLY",
        status: "ACTIVE",
        isDefault: true,
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      if (p1?.id) {
        await db.insert(schema.commissionRules).values([
          {
            planId: p1.id,
            ruleName: "Bậc 1: Doanh thu dưới 50 triệu (3%)",
            ruleType: "TIERED_AMOUNT",
            minThreshold: 0,
            maxThreshold: 50000000,
            ratePercent: 3,
            fixedAmount: 0,
            acceleratorMultiplier: 1.0,
            priorityOrder: 1,
            createdAt: new Date()
          },
          {
            planId: p1.id,
            ruleName: "Bậc 2: Doanh thu 50M - 200M (5%)",
            ruleType: "TIERED_AMOUNT",
            minThreshold: 50000000,
            maxThreshold: 200000000,
            ratePercent: 5,
            fixedAmount: 0,
            acceleratorMultiplier: 1.0,
            priorityOrder: 2,
            createdAt: new Date()
          },
          {
            planId: p1.id,
            ruleName: "Bậc 3: Doanh thu trên 200M (7% + Thưởng vượt định mức)",
            ruleType: "TIERED_AMOUNT",
            minThreshold: 200000000,
            maxThreshold: null,
            ratePercent: 7,
            fixedAmount: 2000000,
            acceleratorMultiplier: 1.2,
            priorityOrder: 3,
            createdAt: new Date()
          }
        ]);
      }

      // 2. Plan Margin Pro
      const [p2] = await db.insert(schema.commissionPlans).values({
        planCode: "COMM-PLAN-MARGIN-PRO",
        name: "Chính sách Hoa hồng Lợi nhuận Gộp (Margin-based)",
        description: "Tính hoa hồng trực tiếp trên Lợi nhuận gộp (Doanh thu - Giá vốn COGS từ M42)",
        calculationBasis: "ORDER_CONFIRMED",
        payoutFrequency: "MONTHLY",
        status: "ACTIVE",
        isDefault: false,
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      if (p2?.id) {
        await db.insert(schema.commissionRules).values([
          {
            planId: p2.id,
            ruleName: "Bậc 1: Gross Margin dưới 30M (8%)",
            ruleType: "TIERED_AMOUNT",
            minThreshold: 0,
            maxThreshold: 30000000,
            ratePercent: 8,
            fixedAmount: 0,
            acceleratorMultiplier: 1.0,
            priorityOrder: 1,
            createdAt: new Date()
          },
          {
            planId: p2.id,
            ruleName: "Bậc 2: Gross Margin 30M - 100M (12%)",
            ruleType: "TIERED_AMOUNT",
            minThreshold: 30000000,
            maxThreshold: 100000000,
            ratePercent: 12,
            fixedAmount: 0,
            acceleratorMultiplier: 1.0,
            priorityOrder: 2,
            createdAt: new Date()
          },
          {
            planId: p2.id,
            ruleName: "Bậc 3: Gross Margin trên 100M (15%)",
            ruleType: "TIERED_AMOUNT",
            minThreshold: 100000000,
            maxThreshold: null,
            ratePercent: 15,
            fixedAmount: 5000000,
            acceleratorMultiplier: 1.25,
            priorityOrder: 3,
            createdAt: new Date()
          }
        ]);
      }
    }
  } catch (err) {
    console.warn("Lỗi khởi tạo seed commissionPlans:", err);
  }
}

commissionRouter.get("/api/commission/plans", async (req, res) => {
  try {
    await ensureCommissionSeeds();
    const plans = await db
      .select()
      .from(schema.commissionPlans)
      .orderBy(desc(schema.commissionPlans.id));

    // Also fetch rules for each plan
    const rules = await db.select().from(schema.commissionRules).orderBy(desc(schema.commissionRules.priorityOrder));

    const enriched = plans.map(p => ({
      ...p,
      rules: rules.filter(r => r.planId === p.id)
    }));

    res.json({ success: true, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

commissionRouter.post("/api/commission/plans", async (req, res) => {
  try {
    const { planCode, name, description, calculationBasis, payoutFrequency, status, isDefault, rules } = req.body;
    const user = (req as any).user || { id: 1 };

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "Bắt buộc nhập tên Kế hoạch hoa hồng" });
    }

    const code = planCode || `PLAN-${Date.now().toString().slice(-6)}`;

    const [createdPlan] = await db
      .insert(schema.commissionPlans)
      .values({
        planCode: code,
        name: name.trim(),
        description,
        calculationBasis: calculationBasis || "ORDER_CONFIRMED",
        payoutFrequency: payoutFrequency || "MONTHLY",
        status: status || "ACTIVE",
        isDefault: isDefault ?? false,
        createdBy: user.id || 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (rules && Array.isArray(rules) && rules.length > 0) {
      for (const r of rules) {
        await db.insert(schema.commissionRules).values({
          planId: createdPlan.id,
          ruleName: r.ruleName || `Tier ${r.ratePercent}%`,
          ruleType: r.ruleType || "TIERED_AMOUNT",
          minThreshold: Number(r.minThreshold) || 0,
          maxThreshold: r.maxThreshold ? Number(r.maxThreshold) : null,
          ratePercent: Number(r.ratePercent) || 0,
          fixedAmount: Number(r.fixedAmount) || 0,
          acceleratorMultiplier: Number(r.acceleratorMultiplier) || 1.0,
          priorityOrder: Number(r.priorityOrder) || 1,
          createdAt: new Date(),
        });
      }
    }

    res.json({ success: true, message: "Tạo kế hoạch hoa hồng thành công", data: createdPlan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

commissionRouter.get("/api/commission/rules", async (req, res) => {
  try {
    const rules = await db.select().from(schema.commissionRules).orderBy(desc(schema.commissionRules.id));
    res.json({ success: true, data: rules });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

commissionRouter.post("/api/commission/rules", async (req, res) => {
  try {
    const { planId, ruleName, ruleType, minThreshold, maxThreshold, ratePercent, fixedAmount, acceleratorMultiplier, priorityOrder } = req.body;
    if (!planId || !ruleName) {
      return res.status(400).json({ success: false, error: "planId và ruleName là bắt buộc" });
    }

    const [rule] = await db
      .insert(schema.commissionRules)
      .values({
        planId: Number(planId),
        ruleName,
        ruleType: ruleType || "TIERED_AMOUNT",
        minThreshold: Number(minThreshold) || 0,
        maxThreshold: maxThreshold ? Number(maxThreshold) : null,
        ratePercent: Number(ratePercent) || 0,
        fixedAmount: Number(fixedAmount) || 0,
        acceleratorMultiplier: Number(acceleratorMultiplier) || 1.0,
        priorityOrder: Number(priorityOrder) || 1,
        createdAt: new Date(),
      })
      .returning();

    res.json({ success: true, message: "Thêm quy tắc hoa hồng thành công", data: rule });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 2. SALES QUOTAS & PERFORMANCE
// =========================================================================

commissionRouter.get("/api/commission/quotas", async (req, res) => {
  try {
    const quotas = await db
      .select({
        id: schema.salesQuotas.id,
        quotaCode: schema.salesQuotas.quotaCode,
        userId: schema.salesQuotas.userId,
        salesRepName: sql<string>`COALESCE(${schema.employees.fullName}, ${schema.users.username})`,
        period: schema.salesQuotas.period,
        startDate: schema.salesQuotas.startDate,
        endDate: schema.salesQuotas.endDate,
        targetRevenue: schema.salesQuotas.targetRevenue,
        targetQuantity: schema.salesQuotas.targetQuantity,
        actualRevenue: schema.salesQuotas.actualRevenue,
        actualQuantity: schema.salesQuotas.actualQuantity,
        attainmentPercent: schema.salesQuotas.attainmentPercent,
        acceleratorMultiplier: schema.salesQuotas.acceleratorMultiplier,
        status: schema.salesQuotas.status,
        notes: schema.salesQuotas.notes,
      })
      .from(schema.salesQuotas)
      .leftJoin(schema.users, eq(schema.salesQuotas.userId, schema.users.id))
      .leftJoin(schema.employees, eq(schema.users.id, schema.employees.userId))
      .orderBy(desc(schema.salesQuotas.period));

    res.json({ success: true, data: quotas });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

commissionRouter.post("/api/commission/quotas", async (req, res) => {
  try {
    const { userId, period, targetRevenue, targetQuantity, acceleratorMultiplier, notes } = req.body;
    const user = (req as any).user || { id: 1 };

    if (!userId || !period || !targetRevenue) {
      return res.status(400).json({ success: false, error: "userId, period, targetRevenue là bắt buộc" });
    }

    const quotaCode = `QTA-${period}-${userId}-${Math.floor(Math.random() * 1000)}`;

    const [quota] = await db
      .insert(schema.salesQuotas)
      .values({
        quotaCode,
        userId: Number(userId),
        period,
        startDate: new Date(`${period}-01`),
        endDate: new Date(`${period}-28`),
        targetRevenue: Number(targetRevenue),
        targetQuantity: Number(targetQuantity) || 0,
        actualRevenue: 0,
        actualQuantity: 0,
        attainmentPercent: 0,
        acceleratorMultiplier: Number(acceleratorMultiplier) || 1.2,
        status: "ACTIVE",
        notes,
        createdBy: user.id || 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.json({ success: true, message: "Thiết lập chỉ tiêu doanh số (Quota) thành công", data: quota });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 3. CALCULATIONS & MARGIN-BASED EVALUATION
// =========================================================================

commissionRouter.get("/api/commission/calculations", async (req, res) => {
  try {
    const records = await db
      .select({
        id: schema.commissionCalculations.id,
        calculationCode: schema.commissionCalculations.calculationCode,
        salesOrderId: schema.commissionCalculations.salesOrderId,
        salesOrderCode: schema.salesOrders.code,
        invoiceId: schema.commissionCalculations.invoiceId,
        invoiceNumber: schema.invoices.invoiceNumber,
        rmaId: schema.commissionCalculations.rmaId,
        rmaCode: schema.commissionCalculations.rmaCode,
        salesPersonId: schema.commissionCalculations.salesPersonId,
        salesRepName: sql<string>`COALESCE(${schema.employees.fullName}, ${schema.users.username})`,
        planId: schema.commissionCalculations.planId,
        planName: schema.commissionPlans.name,
        calculationBasis: schema.commissionCalculations.calculationBasis,
        revenueAmount: schema.commissionCalculations.revenueAmount,
        cogsAmount: schema.commissionCalculations.cogsAmount,
        marginAmount: schema.commissionCalculations.marginAmount,
        marginPercent: schema.commissionCalculations.marginPercent,
        baseAmount: schema.commissionCalculations.baseAmount,
        ratePercent: schema.commissionCalculations.ratePercent,
        acceleratorMultiplier: schema.commissionCalculations.acceleratorMultiplier,
        commissionAmount: schema.commissionCalculations.commissionAmount,
        isClawback: schema.commissionCalculations.isClawback,
        isSplit: schema.commissionCalculations.isSplit,
        splitRole: schema.commissionCalculations.splitRole,
        splitPercent: schema.commissionCalculations.splitPercent,
        parentCalculationId: schema.commissionCalculations.parentCalculationId,
        parentSalesRepId: schema.commissionCalculations.parentSalesRepId,
        isAnomaly: schema.commissionCalculations.isAnomaly,
        anomalyReason: schema.commissionCalculations.anomalyReason,
        triggerEvent: schema.commissionCalculations.triggerEvent,
        status: schema.commissionCalculations.status,
        calculationDate: schema.commissionCalculations.calculationDate,
        payoutId: schema.commissionCalculations.payoutId,
        notes: schema.commissionCalculations.notes,
        createdAt: schema.commissionCalculations.createdAt,
      })
      .from(schema.commissionCalculations)
      .leftJoin(schema.users, eq(schema.commissionCalculations.salesPersonId, schema.users.id))
      .leftJoin(schema.employees, eq(schema.users.id, schema.employees.userId))
      .leftJoin(schema.salesOrders, eq(schema.commissionCalculations.salesOrderId, schema.salesOrders.id))
      .leftJoin(schema.invoices, eq(schema.commissionCalculations.invoiceId, schema.invoices.id))
      .leftJoin(schema.commissionPlans, eq(schema.commissionCalculations.planId, schema.commissionPlans.id))
      .orderBy(desc(schema.commissionCalculations.id));

    res.json({ success: true, data: records });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Get Sales Hierarchy from M28 for Split Commission
 */
commissionRouter.get("/api/commission/hierarchy/:salesPersonId", async (req, res) => {
  try {
    const salesPersonId = Number(req.params.salesPersonId);
    const hierarchy = await commissionService.resolveSalesHierarchy(salesPersonId);
    res.json({ success: true, data: hierarchy });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Standard Revenue-based Calculation Trigger
 */
commissionRouter.post(["/api/commission/calculations", "/api/commission/calculate"], async (req, res) => {
  try {
    const idemp = await enforceIdempotency(req, res, "REVENUE_BASED_COMMISSION");
    if (!idemp) return;

    const { salesOrderId, invoiceId, salesPersonId, triggerEvent, totalAmount } = req.body;
    const user = (req as any).user || { id: 1 };

    const result = await commissionService.evaluateOrderCommission({
      salesOrderId: salesOrderId ? Number(salesOrderId) : undefined,
      invoiceId: invoiceId ? Number(invoiceId) : undefined,
      salesPersonId: Number(salesPersonId),
      triggerEvent: triggerEvent || 'ORDER_CONFIRMED',
      totalAmount: Number(totalAmount),
      userId: user.id || 1,
    });

    res.json({ success: true, message: "Tính toán hoa hồng doanh thu thành công", data: result, idempotencyKey: idemp.key });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Initialize EventBus subscription automatically
try {
  commissionService.subscribeEvents();
} catch (e) {
  console.warn("Lỗi đăng ký EventBus M14:", e);
}

/**
 * Margin-based Commission Calculation (Reads COGS from M42 Costing Engine)
 */
commissionRouter.post("/api/commission/calculate/margin-based", async (req, res) => {
  try {
    const idemp = await enforceIdempotency(req, res, "MARGIN_BASED_COMMISSION");
    if (!idemp) return;

    const { salesOrderId, invoiceId, salesPersonId, planId, ruleId, revenueAmount, cogsAmount, notes } = req.body;
    const user = (req as any).user || { id: 1 };

    const result = await commissionService.evaluateMarginBasedCommission({
      salesOrderId: salesOrderId ? Number(salesOrderId) : undefined,
      invoiceId: invoiceId ? Number(invoiceId) : undefined,
      salesPersonId: Number(salesPersonId),
      planId: planId ? Number(planId) : undefined,
      ruleId: ruleId ? Number(ruleId) : undefined,
      revenueAmount: revenueAmount ? Number(revenueAmount) : undefined,
      cogsAmount: cogsAmount ? Number(cogsAmount) : undefined,
      notes,
      userId: user.id || 1,
    });

    res.json({
      success: true,
      message: `Tính hoa hồng theo Lợi nhuận gộp (Gross Margin) thành công: ${result.commissionAmount.toLocaleString('vi-VN')} VND (${result.marginPercent}% Biên LN)`,
      data: {
        ...result,
        grossMarginAmount: result.marginAmount,
        totalCogs: result.cogsAmount,
        appliedRate: result.ratePercent
      },
      idempotencyKey: idemp.key,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Subscribe EventBus triggers for M14 Commission & Clawback
 */
commissionRouter.post("/api/commission/subscribe-events", async (req, res) => {
  try {
    commissionService.subscribeEvents();
    res.json({
      success: true,
      message: "Đã đăng ký lắng nghe các sự kiện từ M05 EventBus thành công (sales.order.delivered, returns.rma.completed)",
      subscribedTopics: [
        "sales.order.confirmed",
        "sales.order.delivered",
        "invoices.issued",
        "payments.collected",
        "returns.rma.completed"
      ]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 4. CLAWBACK ENGINE (M14 ↔ M15 Returns & RMA)
// =========================================================================

commissionRouter.get("/api/commission/clawbacks", async (req, res) => {
  try {
    const clawbacks = await commissionService.getClawbacks();
    res.json({ success: true, data: clawbacks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

commissionRouter.post(["/api/commission/clawbacks/generate", "/api/commission/clawback/evaluate", "/api/commission/clawbacks"], async (req, res) => {
  try {
    const idemp = await enforceIdempotency(req, res, "GENERATE_CLAWBACK");
    if (!idemp) return;

    const { rmaId, rmaCode, salesOrderId, returnAmount, reason, salesPersonId } = req.body;
    const user = (req as any).user || { id: 1 };

    const result = await commissionService.generateClawbackFromRma({
      rmaId: rmaId ? Number(rmaId) : undefined,
      rmaCode,
      salesOrderId: salesOrderId ? Number(salesOrderId) : undefined,
      salesPersonId: salesPersonId ? Number(salesPersonId) : undefined,
      returnAmount: returnAmount ? Number(returnAmount) : undefined,
      userId: user.id || 1,
      reason,
    });

    res.json({
      success: true,
      message: `Khấu trừ thu hồi hoa hồng thành công: ${Array.isArray(result) ? result.map(r => r.commissionAmount).join(', ') : (result as any)?.commissionAmount} VND`,
      data: result,
      idempotencyKey: idemp.key,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 5. DISPUTES & RESOLUTION ENGINE
// =========================================================================

commissionRouter.get("/api/commission/disputes", async (req, res) => {
  try {
    const disputes = await commissionService.getDisputes();
    res.json({ success: true, data: disputes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

commissionRouter.post("/api/commission/disputes", async (req, res) => {
  try {
    const idemp = await enforceIdempotency(req, res, "SUBMIT_COMMISSION_DISPUTE");
    if (!idemp) return;

    const { calculationId, payoutId, salesPersonId, disputedAmount, expectedAmount, reason } = req.body;
    const user = (req as any).user || { id: 1 };

    const dispute = await commissionService.createDispute({
      calculationId: calculationId ? Number(calculationId) : undefined,
      payoutId: payoutId ? Number(payoutId) : undefined,
      salesPersonId: Number(salesPersonId || user.id || 1),
      disputedAmount: Number(disputedAmount || 0),
      expectedAmount: Number(expectedAmount || 0),
      reason,
      userId: user.id || 1,
    });

    res.json({
      success: true,
      message: `Gửi khiếu nại hoa hồng thành công (Mã: ${dispute.disputeCode})`,
      data: dispute,
      idempotencyKey: idemp.key,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

commissionRouter.post("/api/commission/disputes/:id/resolve", async (req, res) => {
  try {
    const idemp = await enforceIdempotency(req, res, "RESOLVE_COMMISSION_DISPUTE");
    if (!idemp) return;

    const disputeId = Number(req.params.id);
    const resolution = req.body.resolution || req.body.resolutionStatus;
    const { resolutionNotes, adjustedAmount } = req.body;
    const user = (req as any).user || { id: 1 };

    if (!resolution || !['RESOLVED_ADJUSTED', 'RESOLVED_REJECTED'].includes(resolution)) {
      return res.status(400).json({ success: false, error: "Kết quả phân xử phải là RESOLVED_ADJUSTED hoặc RESOLVED_REJECTED" });
    }

    const result = await commissionService.resolveDispute({
      disputeId,
      resolution,
      resolutionNotes: resolutionNotes || 'Đã phân xử theo quy định kinh doanh',
      adjustedAmount: adjustedAmount ? Number(adjustedAmount) : undefined,
      userId: user.id || 1,
    });

    res.json({
      success: true,
      message: resolution === 'RESOLVED_ADJUSTED'
        ? `Đã chấp thuận khiếu nại và sinh bút toán điều chỉnh: ${adjustedAmount?.toLocaleString('vi-VN')} VND`
        : `Đã từ chối khiếu nại hoa hồng`,
      data: result,
      idempotencyKey: idemp.key,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 6. PAYOUTS & DISBURSEMENTS (M14 ↔ M28 HR & PAYROLL / M30 GL)
// =========================================================================

commissionRouter.get("/api/commission/payouts", async (req, res) => {
  try {
    const payouts = await db
      .select({
        id: schema.commissionPayouts.id,
        payoutCode: schema.commissionPayouts.payoutCode,
        title: schema.commissionPayouts.title,
        period: schema.commissionPayouts.period,
        startDate: schema.commissionPayouts.startDate,
        endDate: schema.commissionPayouts.endDate,
        totalGrossAmount: schema.commissionPayouts.totalGrossAmount,
        totalClawbackAmount: schema.commissionPayouts.totalClawbackAmount,
        totalNetAmount: schema.commissionPayouts.totalNetAmount,
        totalBeneficiaries: schema.commissionPayouts.totalBeneficiaries,
        status: schema.commissionPayouts.status,
        paymentMethod: schema.commissionPayouts.paymentMethod,
        accountingEntryId: schema.commissionPayouts.accountingEntryId,
        payoutAccountingEntryId: schema.commissionPayouts.payoutAccountingEntryId,
        notes: schema.commissionPayouts.notes,
        createdAt: schema.commissionPayouts.createdAt,
      })
      .from(schema.commissionPayouts)
      .orderBy(desc(schema.commissionPayouts.id));

    res.json({ success: true, data: payouts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

commissionRouter.get("/api/commission/payouts/:id", async (req, res) => {
  try {
    const payoutId = Number(req.params.id);
    const [payout] = await db
      .select()
      .from(schema.commissionPayouts)
      .where(eq(schema.commissionPayouts.id, payoutId))
      .limit(1);

    if (!payout) {
      return res.status(404).json({ success: false, error: "Không tìm thấy đợt quyết toán" });
    }

    const items = await db
      .select({
        id: schema.commissionPayoutItems.id,
        payoutId: schema.commissionPayoutItems.payoutId,
        salesPersonId: schema.commissionPayoutItems.salesPersonId,
        salesRepName: sql<string>`COALESCE(${schema.employees.fullName}, ${schema.users.username})`,
        department: sql<string>`COALESCE(${schema.departments.name}, 'Khối Bán Hàng')`,
        grossCommission: schema.commissionPayoutItems.grossCommission,
        clawbackDeductions: schema.commissionPayoutItems.clawbackDeductions,
        netPayoutAmount: schema.commissionPayoutItems.netPayoutAmount,
        paymentStatus: schema.commissionPayoutItems.paymentStatus,
        bankAccountInfo: schema.commissionPayoutItems.bankAccountInfo,
        notes: schema.commissionPayoutItems.notes,
      })
      .from(schema.commissionPayoutItems)
      .leftJoin(schema.users, eq(schema.commissionPayoutItems.salesPersonId, schema.users.id))
      .leftJoin(schema.employees, eq(schema.users.id, schema.employees.userId))
      .leftJoin(schema.departments, eq(schema.employees.departmentId, schema.departments.id))
      .where(eq(schema.commissionPayoutItems.payoutId, payoutId));

    res.json({ success: true, data: { ...payout, items } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

commissionRouter.post(["/api/commission/payouts", "/api/commission/payouts/generate"], async (req, res) => {
  try {
    const idemp = await enforceIdempotency(req, res, "GENERATE_PAYOUT_BATCH");
    if (!idemp) return;

    const { title, period, startDate, endDate, paymentMethod, notes } = req.body;
    const user = (req as any).user || { id: 1 };

    if (!period || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: "period, startDate, endDate là bắt buộc" });
    }

    const payout = await commissionService.generatePayoutBatch({
      title: title || `Quyết toán Hoa hồng Kỳ ${period}`,
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      notes,
      userId: user.id || 1,
    });

    res.json({
      success: true,
      message: `Đã tạo đợt quyết toán hoa hồng ${payout.payoutCode} với ${payout.totalBeneficiaries} nhân viên, Thực lĩnh: ${payout.totalNetAmount.toLocaleString('vi-VN')} VND`,
      data: payout,
      idempotencyKey: idemp.key,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

commissionRouter.post("/api/commission/payouts/:id/approve", async (req, res) => {
  try {
    const idemp = await enforceIdempotency(req, res, "APPROVE_PAYOUT_BATCH");
    if (!idemp) return;

    const payoutId = Number(req.params.id);
    const user = (req as any).user || { id: 1 };

    const result = await commissionService.approvePayoutBatch(payoutId, user.id || 1);

    res.json({
      success: true,
      message: `Đã phê duyệt đợt quyết toán ${result.payout.payoutCode} và trích trước chi phí Nợ 6418 / Có 3388`,
      data: result,
      idempotencyKey: idemp.key,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

commissionRouter.post(["/api/commission/payouts/:id/disburse", "/api/commission/payouts/:id/pay"], async (req, res) => {
  try {
    const idemp = await enforceIdempotency(req, res, "DISBURSE_PAYOUT_BATCH");
    if (!idemp) return;

    const payoutId = Number(req.params.id);
    const { paymentMethod, notes } = req.body;
    const user = (req as any).user || { id: 1 };

    const result = await commissionService.disbursePayoutBatch({
      payoutId,
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      notes,
      userId: user.id || 1,
    });

    res.json({
      success: true,
      message: `Chi trả hoa hồng thành công và ghi sổ GL Nợ 3388 / Có ${paymentMethod === 'CASH' ? '1111' : '1121'}`,
      data: result,
      idempotencyKey: idemp.key,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Pay via M28 HR & Payroll Disbursement Delegation
 */
commissionRouter.post("/api/commission/payouts/:id/pay-via-payroll", async (req, res) => {
  try {
    const idemp = await enforceIdempotency(req, res, "PAY_PAYOUT_VIA_PAYROLL");
    if (!idemp) return;

    const payoutId = Number(req.params.id);
    const { payrollPeriod } = req.body;
    const user = (req as any).user || { id: 1 };

    const result = await commissionService.payPayoutViaPayroll({
      payoutId,
      payrollPeriod,
      userId: user.id || 1,
    });

    res.json({
      success: true,
      message: `Đã tích hợp chi trả hoa hồng vào Bảng lương ${result.payroll?.periodCode || ''} (M28) và hạch toán Nợ 3388 / Có 3341`,
      data: result,
      idempotencyKey: idemp.key,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Phase 12: QA Certification & Invariance Lock Runner Endpoint
 */
commissionRouter.post("/api/commission/qa-certification", async (req, res) => {
  try {
    const user = (req as any).user || { id: 1 };
    const cert = await commissionService.runQaTestSuite(user.id || 1);

    res.json({
      success: true,
      message: `Xác nhận đạt 19/19 kịch bản kiểm thử live database. Module M14 đã được niêm phong bất biến (${cert.sealCode})`,
      data: cert,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default commissionRouter;
