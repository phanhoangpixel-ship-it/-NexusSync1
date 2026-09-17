import { Router } from "express";
import { client, db, recreateDatabaseClient } from "../../db/index";
import * as schema from "../../db/schema";
import { StockAdjustmentService } from "../../engines/stockAdjustmentService";
import { WorkspaceAggregationService } from "../../engines/WorkspaceAggregationService";
import { InventoryService } from "../../engines/inventoryService";
import { accountingEngine } from "../../engines/accountingEngine";
import { UnifiedPipelineEngine } from "../../engines/unifiedPipelineEngine";
import { BankReconciliationEngine } from "../../engines/bankReconciliationEngine";
import { eq, desc, sql, and } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import * as crypto from "crypto";
import { requireRole } from "../middleware/auth.middleware";
import { masterDataCache } from "../services/masterDataCache";
import { AuditService } from "../../engines/auditService";

const router = Router();

// Master Data Cache Telemetry & Invalidation Endpoints
router.get("/api/master-data/cache/metrics", (req, res) => {
  res.json({
    success: true,
    data: masterDataCache.getMetrics()
  });
});

router.post("/api/master-data/cache/flush", requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'), (req, res) => {
  const { tag } = req.body || {};
  if (tag) {
    const count = masterDataCache.invalidateByTag(tag);
    return res.json({ success: true, message: `Invalidated ${count} cache entries tagged with '${tag}'` });
  }
  masterDataCache.flushAll();
  res.json({ success: true, message: "Toàn bộ in-memory cache của Master Data đã được làm mới." });
});

router.get("/api/products", async (req, res) => {
    try {
      const includeArchived = req.query.include_archived === 'true';
      const enriched = await masterDataCache.getOrSet('products:enriched', async () => {
        const productsList = await db.select().from(schema.products).all();
        const balances = await db.select().from(schema.stockBalances).all();
        const categories = await db.select().from(schema.categories).all();
        const catMap = new Map(categories.map((c) => [c.id, c.name]));

        return productsList.map((p) => {
          const prodBalances = balances.filter((b) => b.productId === p.id);
          const totalPhysical = prodBalances.reduce((sum, b) => sum + (b.stockPhysical || 0), 0);
          const totalReserved = prodBalances.reduce((sum, b) => sum + (b.stockReserved || 0), 0);
          const totalAvailable = prodBalances.reduce((sum, b) => sum + (b.stockAvailable || 0), 0);

          return {
            ...p,
            categoryName: p.categoryId ? catMap.get(p.categoryId) || "Chung" : "Chung",
            totalPhysical,
            totalReserved,
            totalAvailable,
          };
        });
      }, 60000, ['products', 'inventory', 'categories']);

      const filtered = includeArchived 
        ? enriched 
        : enriched.filter((p: any) => p.status !== 'ARCHIVED' && p.status !== 'INACTIVE');

      res.json(filtered);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.get("/api/categories", async (req, res) => {
    try {
      const cats = await masterDataCache.getOrSet('categories:all', async () => {
        return await db.select().from(schema.categories).all();
      }, 120000, ['categories']);
      res.json(cats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.get("/api/product-uoms", async (req, res) => {
    try {
      const uoms = await masterDataCache.getOrSet('uoms:all', async () => {
        return await db.select().from(schema.productUoms).all();
      }, 120000, ['uoms', 'products']);
      res.json(uoms);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.post("/api/uom/convert", async (req, res) => {
  try {
    const { productId, fromUomId, toUomId, quantity } = req.body;
    const qty = Number(quantity) || 1;
    const uoms = await db.select().from(schema.productUoms).where(eq(schema.productUoms.productId, Number(productId))).all();
    const fromUom = uoms.find(u => u.id === Number(fromUomId) || u.unitName === fromUomId);
    const toUom = uoms.find(u => u.id === Number(toUomId) || u.unitName === toUomId);

    const fromFactor = fromUom ? Number(fromUom.conversionFactor) : 1;
    const toFactor = toUom ? Number(toUom.conversionFactor) : 1;

    const baseQuantity = qty * fromFactor;
    const convertedQuantity = baseQuantity / toFactor;

    res.json({
      success: true,
      productId: Number(productId),
      quantity: qty,
      fromUom: fromUom ? fromUom.unitName : 'BASE',
      toUom: toUom ? toUom.unitName : 'BASE',
      conversionFactor: fromFactor / toFactor,
      baseQuantity,
      convertedQuantity
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/customers", async (req, res) => {
    try {
      const customers = await masterDataCache.getOrSet('customers:all', async () => {
        return await db.select().from(schema.customers).all();
      }, 60000, ['customers']);
      res.json(customers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.get("/api/suppliers", async (req, res) => {
  try {
    const suppliers = await masterDataCache.getOrSet('suppliers:all', async () => {
      let allSuppliers = await db.select().from(schema.suppliers).all();

      // Auto-seed if empty to ensure rich SRM experience
      if (allSuppliers.length === 0) {
        const defaultSuppliers = [
          {
            code: 'SUP-001',
            name: 'Công ty Cổ phần Vật liệu Bán dẫn Toàn Cầu',
            shortName: 'Semiconductor Global',
            supplierType: 'Manufacturer',
            status: 'ACTIVE',
            taxCode: '0312345678',
            phone: '028-38291029',
            email: 'purchasing@semiglobal.vn',
            address: 'KCN Cao TP. Thủ Đức, TP. Hồ Chí Minh',
            paymentTerms: 'NET 45',
            creditLimit: 2500000000,
            currency: 'VND',
            performanceTier: 'Tier A (Chiến lược)',
            compositeScore: 98
          },
          {
            code: 'SUP-002',
            name: 'Tập đoàn Hóa chất & Phụ gia Xanh',
            shortName: 'Green Chemical',
            supplierType: 'Manufacturer',
            status: 'ACTIVE',
            taxCode: '0109988776',
            phone: '024-39876543',
            email: 'sales@greenchem.vn',
            address: 'KCN Đình Vũ, Hải Phòng',
            paymentTerms: 'NET 30',
            creditLimit: 1200000000,
            currency: 'VND',
            performanceTier: 'Tier A (Chiến lược)',
            compositeScore: 95
          },
          {
            code: 'SUP-003',
            name: 'Công ty TNHH Thiết bị Đo lường Quang Học',
            shortName: 'Optics VN',
            supplierType: 'Distributor',
            status: 'ACTIVE',
            taxCode: '0308765432',
            phone: '028-37654321',
            email: 'info@opticsinstruments.com.vn',
            address: 'KCN Tân Bình, TP. Hồ Chí Minh',
            paymentTerms: 'NET 15',
            creditLimit: 600000000,
            currency: 'VND',
            performanceTier: 'Tier B (Ưu tiên)',
            compositeScore: 88
          },
          {
            code: 'SUP-ABC',
            name: 'CÔNG TY TNHH ABC TECHNOLOGY',
            shortName: 'ABC Tech',
            supplierType: 'Manufacturer',
            status: 'ACTIVE',
            taxCode: '0312345678',
            phone: '028-38291029',
            email: 'contact.a@abctech.com',
            address: 'Số 123 Đường Điện Biên Phủ, Quận Bình Thạnh, TP. Hồ Chí Minh',
            paymentTerms: 'NET 30',
            creditLimit: 1500000000,
            currency: 'VND',
            performanceTier: 'Tier B (Ưu tiên)',
            compositeScore: 84
          },
          {
            code: 'SUP-005',
            name: 'Công ty Bao bì & Thùng Carton Miền Nam',
            shortName: 'Southern Packaging',
            supplierType: 'Wholesaler',
            status: 'WATCHLIST',
            taxCode: '0307654321',
            phone: '028-39988776',
            email: 'orders@southernpackaging.vn',
            address: 'KCN Sóng Thần 2, Dĩ An, Bình Dương',
            paymentTerms: 'COD',
            creditLimit: 300000000,
            currency: 'VND',
            performanceTier: 'Tier C (Theo dõi)',
            compositeScore: 68
          }
        ];
        for (const s of defaultSuppliers) {
          await db.insert(schema.suppliers).values(s as any).catch(() => {});
        }
        allSuppliers = await db.select().from(schema.suppliers).all();
      }

      const allContacts = await db.select().from(schema.supplierContacts).all();
      const allBanks = await db.select().from(schema.supplierBankAccounts).all();
      const allPOs = await db.select().from(schema.purchaseOrders).all();

      return allSuppliers.map((supp) => {
        const suppContacts = allContacts.filter((c) => c.supplierId === supp.id);
        const suppBanks = allBanks.filter((b) => b.supplierId === supp.id);
        const suppPOs = allPOs.filter((po) => po.supplierId === supp.id);

        const totalSpend = suppPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
        const activePOCount = suppPOs.filter((po) => ['PENDING_RECEIPT', 'PARTIALLY_RECEIVED', 'DRAFT', 'APPROVED'].includes(po.status)).length;
        const completedPOCount = suppPOs.filter((po) => po.status === 'COMPLETED').length;

        // Parse scorecards from notes if structured
        let scorecards: any[] = [];
        if (supp.notes) {
          try {
            const parsed = JSON.parse(supp.notes);
            if (parsed && Array.isArray(parsed.scorecards)) {
              scorecards = parsed.scorecards;
            }
          } catch (e) {
            // plain text
          }
        }

        const score = supp.compositeScore || 85;
        const otifRate = scorecards.length > 0 && scorecards[0].otifRate ? scorecards[0].otifRate : (score >= 90 ? '98.5%' : score >= 80 ? '95.2%' : '88.0%');
        const qualityScore = scorecards.length > 0 && scorecards[0].qualityScore ? scorecards[0].qualityScore : (score >= 90 ? '99.2%' : score >= 80 ? '96.5%' : '90.0%');
        const complianceScore = scorecards.length > 0 && scorecards[0].complianceScore ? scorecards[0].complianceScore : (score >= 90 ? '100%' : '98%');
        const rating = (score / 20).toFixed(1);
        const limit = supp.creditLimit || 500000000;
        const used = totalSpend;
        const available = Math.max(0, limit - used);

        return {
          ...supp,
          contacts: suppContacts,
          bankAccounts: suppBanks,
          poCount: suppPOs.length,
          totalSpend,
          activePOCount,
          completedPOCount,
          creditLimit: limit,
          creditUsed: used,
          creditAvailable: available,
          scorecards,
          otifRate,
          qualityScore,
          complianceScore,
          rating
        };
      });
    }, 20000, ['suppliers']);
    res.json(suppliers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Spend Analytics Endpoint for SRM
router.get("/api/suppliers/analytics/spend", async (req, res) => {
  try {
    const suppliers = await db.select().from(schema.suppliers).all();
    const purchaseOrders = await db.select().from(schema.purchaseOrders).all();

    const totalSpend = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    const totalPOs = purchaseOrders.length;
    const avgPOValue = totalPOs > 0 ? Math.round(totalSpend / totalPOs) : 0;

    // Supplier Spend Breakdown
    const supplierSpendMap = new Map<number, { count: number; spend: number }>();
    for (const po of purchaseOrders) {
      const curr = supplierSpendMap.get(po.supplierId) || { count: 0, spend: 0 };
      curr.count += 1;
      curr.spend += po.totalAmount || 0;
      supplierSpendMap.set(po.supplierId, curr);
    }

    const supplierAnalytics = suppliers.map((s) => {
      const stats = supplierSpendMap.get(s.id) || { count: 0, spend: 0 };
      const percent = totalSpend > 0 ? Math.round((stats.spend / totalSpend) * 1000) / 10 : 0;
      return {
        id: s.id,
        code: s.code,
        name: s.name,
        supplierType: s.supplierType || 'Manufacturer',
        performanceTier: s.performanceTier || 'Tier B (Ưu tiên)',
        compositeScore: s.compositeScore || 80,
        status: s.status,
        poCount: stats.count,
        spend: stats.spend,
        spendPercent: percent,
        creditLimit: s.creditLimit || 500000000,
        paymentTerms: s.paymentTerms || 'NET 30'
      };
    }).sort((a, b) => b.spend - a.spend);

    // Spend by Supplier Type
    const spendByType: Record<string, number> = {};
    for (const s of supplierAnalytics) {
      spendByType[s.supplierType] = (spendByType[s.supplierType] || 0) + s.spend;
    }

    // Spend by Payment Terms
    const spendByTerms: Record<string, number> = {};
    for (const s of supplierAnalytics) {
      spendByTerms[s.paymentTerms] = (spendByTerms[s.paymentTerms] || 0) + s.spend;
    }

    // Risk Matrix Categorization
    const riskMatrix = supplierAnalytics.map((s) => {
      const isHighSpend = s.spend >= (totalSpend * 0.15) || s.spend >= 500000000;
      const isHighScore = (s.compositeScore || 80) >= 85;

      let quadrant = 'ROUTINE';
      if (isHighSpend && isHighScore) quadrant = 'STRATEGIC';
      else if (isHighSpend && !isHighScore) quadrant = 'CRITICAL_RISK';
      else if (!isHighSpend && isHighScore) quadrant = 'LEVERAGE';

      return {
        ...s,
        quadrant
      };
    });

    res.json({
      success: true,
      data: {
        totalSpend,
        totalPOs,
        avgPOValue,
        activeSupplierCount: suppliers.filter(s => s.status === 'ACTIVE').length,
        topSuppliers: supplierAnalytics.slice(0, 10),
        spendByType,
        spendByTerms,
        riskMatrix
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// Single Supplier 360° Profile API
router.get("/api/suppliers/:id", async (req, res) => {
  try {
    const supplierId = Number(req.params.id);
    const existing = await db.select().from(schema.suppliers).where(eq(schema.suppliers.id, supplierId)).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Không tìm thấy nhà cung cấp." });
    }
    const supplier = existing[0];

    const contacts = await db.select().from(schema.supplierContacts).where(eq(schema.supplierContacts.supplierId, supplierId)).all();
    const bankAccounts = await db.select().from(schema.supplierBankAccounts).where(eq(schema.supplierBankAccounts.supplierId, supplierId)).all();
    const pos = await db.select().from(schema.purchaseOrders).where(eq(schema.purchaseOrders.supplierId, supplierId)).all();

    const totalSpend = pos.reduce((sum, po) => sum + (po.totalAmount || 0), 0);

    let scorecards: any[] = [];
    if (supplier.notes) {
      try {
        const parsed = JSON.parse(supplier.notes);
        if (parsed && Array.isArray(parsed.scorecards)) {
          scorecards = parsed.scorecards;
        }
      } catch (e) {}
    }

    res.json({
      success: true,
      data: {
        ...supplier,
        contacts,
        bankAccounts,
        purchaseOrders: pos,
        totalSpend,
        poCount: pos.length,
        scorecards
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// Fast Terms & Credit Limit Patch
router.patch("/api/suppliers/:id/terms", requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING', 'ADMIN'), async (req, res) => {
  try {
    const user = (req as any).user;
    const supplierId = Number(req.params.id);
    const { paymentTerms, creditLimit, notes } = req.body;

    const existing = await db.select().from(schema.suppliers).where(eq(schema.suppliers.id, supplierId)).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Không tìm thấy nhà cung cấp." });
    }
    const current = existing[0];

    let updatedSupplier: any;
    await db.transaction(async (tx) => {
      const updated = await tx.update(schema.suppliers).set({
        paymentTerms: paymentTerms !== undefined ? paymentTerms : current.paymentTerms,
        creditLimit: creditLimit !== undefined ? Number(creditLimit) : current.creditLimit,
        notes: notes !== undefined ? notes : current.notes,
        updatedAt: new Date()
      } as any).where(eq(schema.suppliers.id, supplierId)).returning();
      updatedSupplier = updated[0];

      await tx.insert(schema.outboxEvents).values({
        eventId: crypto.randomUUID(),
        eventType: 'SUPPLIER_TERMS_UPDATED',
        aggregateType: 'Supplier',
        aggregateId: String(supplierId),
        source: 'MasterData',
        actorId: String(user?.id || 1),
        correlationId: crypto.randomUUID(),
        status: 'PENDING',
        payload: JSON.stringify({
          supplierId,
          supplierCode: updatedSupplier.code,
          oldTerms: current.paymentTerms,
          newTerms: updatedSupplier.paymentTerms,
          oldLimit: current.creditLimit,
          newLimit: updatedSupplier.creditLimit
        })
      } as any);
    });

    masterDataCache.invalidateByTag('suppliers');

    res.json({
      success: true,
      message: `Đã cập nhật điều khoản thanh toán & hạn mức cho ${updatedSupplier.name}`,
      data: updatedSupplier
    });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// SRM Evaluation / Scorecard Submission
router.post("/api/suppliers/:id/evaluations", requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING', 'ADMIN'), async (req, res) => {
  try {
    const user = (req as any).user;
    const supplierId = Number(req.params.id);
    const { period, otifRate, qualityScore, complianceScore, serviceScore, notes, evaluator } = req.body;

    const existing = await db.select().from(schema.suppliers).where(eq(schema.suppliers.id, supplierId)).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Không tìm thấy nhà cung cấp." });
    }
    const current = existing[0];

    const otifNum = Number(otifRate) || 95;
    const qualityNum = Number(qualityScore) || 95;
    const complianceNum = Number(complianceScore) || 100;
    const serviceNum = Number(serviceScore) || 90;

    // Weighted composite score calculation:
    // OTIF 35%, GR Quality 35%, Compliance 15%, Service/Pricing 15%
    const compositeScore = Math.round((otifNum * 0.35 + qualityNum * 0.35 + complianceNum * 0.15 + serviceNum * 0.15) * 10) / 10;
    const performanceTier = compositeScore >= 90 ? 'Tier A (Chiến lược)' : compositeScore >= 75 ? 'Tier B (Ưu tiên)' : 'Tier C (Theo dõi)';
    const status = compositeScore >= 90 ? 'EXCELLENT' : compositeScore >= 75 ? 'GOOD' : 'WARNING';

    const newScorecard = {
      id: `SC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      period: period || `Q${Math.floor((new Date().getMonth() + 3) / 3)}/${new Date().getFullYear()}`,
      otifRate: `${otifNum}%`,
      qualityScore: `${qualityNum}%`,
      complianceScore: `${complianceNum}%`,
      serviceScore: `${serviceNum}%`,
      overallRating: `${(compositeScore / 20).toFixed(1)} / 5.0 (${performanceTier.split(' ')[1] || 'Partner'})`,
      status,
      evaluator: evaluator || user?.name || 'Hội đồng Mua sắm SRM',
      evaluationDate: new Date().toLocaleDateString('vi-VN'),
      notes: notes || 'Hoàn tất kỳ đánh giá định kỳ nhà cung cấp SRM.'
    };

    let existingNotesObj: any = {};
    if (current.notes) {
      try {
        existingNotesObj = JSON.parse(current.notes);
      } catch (e) {
        existingNotesObj = { text: current.notes };
      }
    }
    const scorecards = Array.isArray(existingNotesObj.scorecards) ? [newScorecard, ...existingNotesObj.scorecards] : [newScorecard];
    existingNotesObj.scorecards = scorecards;

    let updatedSupplier: any;
    await db.transaction(async (tx) => {
      const updated = await tx.update(schema.suppliers).set({
        compositeScore,
        performanceTier,
        notes: JSON.stringify(existingNotesObj),
        updatedAt: new Date()
      } as any).where(eq(schema.suppliers.id, supplierId)).returning();
      updatedSupplier = updated[0];

      await tx.insert(schema.outboxEvents).values({
        eventId: crypto.randomUUID(),
        eventType: 'SUPPLIER_EVALUATED',
        aggregateType: 'Supplier',
        aggregateId: String(supplierId),
        source: 'SRM_Scorecard',
        actorId: String(user?.id || 1),
        correlationId: crypto.randomUUID(),
        status: 'PENDING',
        payload: JSON.stringify({
          supplierId,
          scorecardId: newScorecard.id,
          compositeScore,
          performanceTier,
          period: newScorecard.period
        })
      } as any);
    });

    masterDataCache.invalidateByTag('suppliers');

    res.json({
      success: true,
      message: `Đã hoàn tất đánh giá SRM cho ${updatedSupplier.name}. Xếp hạng: ${performanceTier} (${compositeScore} điểm)`,
      data: {
        ...updatedSupplier,
        scorecard: newScorecard,
        scorecards
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ==========================================
// M11 SRM: GET SCORECARDS ENDPOINT
// ==========================================
router.get("/api/srm/scorecards", requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING', 'ADMIN'), async (req, res) => {
  try {
    const { supplierId } = req.query;
    const allSuppliers = await db.select().from(schema.suppliers);
    const result: any[] = [];

    const parsePercent = (val: any, defaultVal: number) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const n = parseFloat(val.replace('%', ''));
        return isNaN(n) ? defaultVal : n;
      }
      return defaultVal;
    };

    for (const supp of allSuppliers) {
      if (supplierId && String(supp.id) !== String(supplierId)) {
        continue;
      }
      let scorecards: any[] = [];
      if (supp.notes) {
        try {
          const parsed = JSON.parse(supp.notes);
          if (parsed && Array.isArray(parsed.scorecards)) {
            scorecards = parsed.scorecards;
          }
        } catch (e) {}
      }

      const score = supp.compositeScore || 85;
      const otifRate = scorecards.length > 0 && scorecards[0].otifRate ? scorecards[0].otifRate : (score >= 90 ? '98.5%' : score >= 80 ? '95.2%' : '88.0%');
      const qualityScore = scorecards.length > 0 && scorecards[0].qualityScore ? scorecards[0].qualityScore : (score >= 90 ? '99.2%' : score >= 80 ? '96.5%' : '90.0%');
      const complianceScore = scorecards.length > 0 && scorecards[0].complianceScore ? scorecards[0].complianceScore : (score >= 90 ? '100%' : '98%');

      if (scorecards.length > 0) {
        scorecards.forEach((sc, idx) => {
          result.push({
            id: sc.id || `SC-${supp.id}-${idx + 1}`,
            supplierId: supp.id,
            supplierName: supp.name,
            supplierCode: supp.code,
            period: sc.period || '2026-Q1',
            otifRate: sc.otifRate || otifRate,
            otifRateNumeric: parsePercent(sc.otifRate || otifRate, 95.0),
            qualityScore: sc.qualityScore || qualityScore,
            qualityScoreNumeric: parsePercent(sc.qualityScore || qualityScore, 96.0),
            complianceScore: sc.complianceScore || complianceScore,
            complianceScoreNumeric: parsePercent(sc.complianceScore || complianceScore, 98.0),
            compositeScore: sc.compositeScore || supp.compositeScore || 85,
            performanceTier: sc.performanceTier || supp.performanceTier || 'TIER_2_PREFERRED',
            overallRating: sc.overallRating || ((supp.compositeScore || 85) / 20).toFixed(1),
            status: supp.status,
            evaluationDate: sc.evaluationDate || new Date().toISOString()
          });
        });
      } else {
        result.push({
          id: `SC-${supp.id}-AUTO`,
          supplierId: supp.id,
          supplierName: supp.name,
          supplierCode: supp.code,
          period: '2026-Q1',
          otifRate,
          otifRateNumeric: parsePercent(otifRate, 95.0),
          qualityScore,
          qualityScoreNumeric: parsePercent(qualityScore, 96.0),
          complianceScore,
          complianceScoreNumeric: parsePercent(complianceScore, 98.0),
          compositeScore: supp.compositeScore || 85,
          performanceTier: supp.performanceTier || 'TIER_2_PREFERRED',
          overallRating: ((supp.compositeScore || 85) / 20).toFixed(1),
          status: supp.status,
          evaluationDate: new Date().toISOString()
        });
      }
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ==========================================
// M11 SRM: SCORING CONFIGURATION & SCORECARDS
// ==========================================
router.get("/api/srm/scoring-config", requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING', 'ADMIN'), async (req, res) => {
  try {
    const configs = await db.select().from(schema.scoringConfig).limit(1);
    if (configs.length > 0) {
      return res.json({ success: true, data: configs[0] });
    }
    const defaultConfig = {
      otifWeight: 40.0,
      qualityWeight: 40.0,
      priceWeight: 10.0,
      complianceWeight: 10.0,
      gracePeriodDays: 2,
      tier1Threshold: 90.0,
      tier2Threshold: 75.0,
      tier3Threshold: 60.0
    };
    res.json({ success: true, data: defaultConfig });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

router.put("/api/srm/scoring-config", requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER'), async (req, res) => {
  try {
    const user = (req as any).user;
    const { otifWeight, qualityWeight, priceWeight, complianceWeight, gracePeriodDays, tier1Threshold, tier2Threshold, tier3Threshold } = req.body;
    
    const totalWeight = Number(otifWeight || 40) + Number(qualityWeight || 40) + Number(priceWeight || 10) + Number(complianceWeight || 10);
    if (Math.abs(totalWeight - 100) > 0.1) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Tổng trọng số (OTIF + Chất lượng + Giá + Tuân thủ) phải bằng 100%." });
    }

    const existing = await db.select().from(schema.scoringConfig).limit(1);
    let updated;
    if (existing.length > 0) {
      const resUpdate = await db.update(schema.scoringConfig)
        .set({
          otifWeight: Number(otifWeight),
          qualityWeight: Number(qualityWeight),
          priceWeight: Number(priceWeight),
          complianceWeight: Number(complianceWeight),
          gracePeriodDays: Number(gracePeriodDays || 2),
          tier1Threshold: Number(tier1Threshold || 90),
          tier2Threshold: Number(tier2Threshold || 75),
          tier3Threshold: Number(tier3Threshold || 60),
          updatedBy: user?.username || user?.name || 'Admin',
          updatedAt: new Date()
        })
        .where(eq(schema.scoringConfig.id, existing[0].id))
        .returning();
      updated = resUpdate[0];
    } else {
      const resIns = await db.insert(schema.scoringConfig).values({
        otifWeight: Number(otifWeight || 40),
        qualityWeight: Number(qualityWeight || 40),
        priceWeight: Number(priceWeight || 10),
        complianceWeight: Number(complianceWeight || 10),
        gracePeriodDays: Number(gracePeriodDays || 2),
        tier1Threshold: Number(tier1Threshold || 90),
        tier2Threshold: Number(tier2Threshold || 75),
        tier3Threshold: Number(tier3Threshold || 60),
        updatedBy: user?.username || user?.name || 'Admin',
      }).returning();
      updated = resIns[0];
    }

    await AuditService.recordAuditLog({
      module: 'M11_SRM',
      action: 'UPDATE_SCORING_CONFIG',
      entityType: 'scoring_config',
      entityId: String(updated.id),
      actorId: String(user?.id || 1),
      actorName: user?.username || user?.name || 'Admin',
      details: `Đã cập nhật trọng số chấm điểm M11: OTIF ${otifWeight}%, Chất lượng ${qualityWeight}%, Giá ${priceWeight}%, Tuân thủ ${complianceWeight}%`,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.json({ success: true, message: "Đã cập nhật cấu hình trọng số SRM thành công", data: updated });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

router.post("/api/suppliers/:id/scorecards", requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  try {
    const supplierId = Number(req.params.id);
    const { period, otifRate, qualityScore, complianceScore, compositeScore, performanceTier, notes } = req.body;

    const parsePercent = (val: any, defaultVal: number) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const n = parseFloat(val.replace('%', ''));
        return isNaN(n) ? defaultVal : n;
      }
      return defaultVal;
    };

    const otifNum = parsePercent(otifRate, 95);
    const qualNum = parsePercent(qualityScore, 96);
    const compNum = parsePercent(complianceScore, 98);
    const finalComposite = compositeScore ? Number(compositeScore) : Math.round((otifNum * 0.4) + (qualNum * 0.4) + (compNum * 0.2));
    const tier = performanceTier || (finalComposite >= 90 ? 'TIER_1_STRATEGIC' : finalComposite >= 75 ? 'TIER_2_PREFERRED' : finalComposite >= 60 ? 'TIER_3_APPROVED' : 'TIER_4_PROBATION');

    const existingPeriod = await db.select().from(schema.vendorScorecards)
      .where(and(eq(schema.vendorScorecards.supplierId, supplierId), eq(schema.vendorScorecards.period, period || '2026-Q3')))
      .limit(1);

    if (existingPeriod.length > 0 && existingPeriod[0].isClosed) {
      return res.status(400).json({ error: "IMMUTABILITY_VIOLATION", message: `Kỳ đánh giá ${period} đã bị đóng sổ (Closed). Không được phép chỉnh sửa hoặc tính lại số liệu kỳ này.` });
    }

    let savedRecord;
    if (existingPeriod.length > 0) {
      const updated = await db.update(schema.vendorScorecards)
        .set({
          otifRate: String(otifRate || '95.0%'),
          otifRateNumeric: otifNum,
          qualityScore: String(qualityScore || '96.0%'),
          qualityScoreNumeric: qualNum,
          complianceScore: String(complianceScore || '98.0%'),
          complianceScoreNumeric: compNum,
          compositeScore: finalComposite,
          performanceTier: tier,
          overallRating: (finalComposite / 20).toFixed(1),
          evaluationDate: new Date().toISOString(),
          breakdownJson: JSON.stringify({ notes: notes || 'Đánh giá thủ công từ hội đồng SRM' })
        })
        .where(eq(schema.vendorScorecards.id, existingPeriod[0].id))
        .returning();
      savedRecord = updated[0];
    } else {
      const inserted = await db.insert(schema.vendorScorecards).values({
        supplierId,
        period: period || '2026-Q3',
        otifRate: String(otifRate || '95.0%'),
        otifRateNumeric: otifNum,
        qualityScore: String(qualityScore || '96.0%'),
        qualityScoreNumeric: qualNum,
        complianceScore: String(complianceScore || '98.0%'),
        complianceScoreNumeric: compNum,
        compositeScore: finalComposite,
        performanceTier: tier,
        overallRating: (finalComposite / 20).toFixed(1),
        evaluationDate: new Date().toISOString(),
        breakdownJson: JSON.stringify({ notes: notes || 'Đánh giá tự động / thủ công từ hệ thống' })
      }).returning();
      savedRecord = inserted[0];
    }

    await db.update(schema.suppliers)
      .set({
        compositeScore: finalComposite,
        performanceTier: tier,
        updatedAt: new Date()
      })
      .where(eq(schema.suppliers.id, supplierId));

    res.json({ success: true, message: "Đã lưu và ban hành Thẻ điểm SRM thành công", data: savedRecord });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// Add Contact to Supplier
router.post("/api/suppliers/:id/contacts", requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING', 'ADMIN'), async (req, res) => {
  try {
    const supplierId = Number(req.params.id);
    const { contactName, department, position, phone, email, note, isPrimary } = req.body;
    if (!contactName) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Tên người liên hệ là bắt buộc." });
    }

    const inserted = await db.insert(schema.supplierContacts).values({
      supplierId,
      contactName,
      department: department || 'Sales',
      position,
      phone,
      email,
      note,
      isPrimary: isPrimary ? 1 : 0
    } as any).returning();

    masterDataCache.invalidateByTag('suppliers');
    res.json({ success: true, data: inserted[0] });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// Delete Contact from Supplier
router.delete("/api/suppliers/:id/contacts/:contactId", requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING', 'ADMIN'), async (req, res) => {
  try {
    const contactId = Number(req.params.contactId);
    await db.delete(schema.supplierContacts).where(eq(schema.supplierContacts.id, contactId));
    masterDataCache.invalidateByTag('suppliers');
    res.json({ success: true, message: "Đã xóa người liên hệ." });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// Add Bank Account to Supplier
router.post("/api/suppliers/:id/bank-accounts", requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING', 'ADMIN'), async (req, res) => {
  try {
    const supplierId = Number(req.params.id);
    const { bankName, accountNumber, accountHolder, branch, currency, isDefault } = req.body;
    if (!bankName || !accountNumber || !accountHolder) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Tên ngân hàng, số tài khoản và tên thụ hưởng là bắt buộc." });
    }

    const inserted = await db.insert(schema.supplierBankAccounts).values({
      supplierId,
      bankName,
      accountNumber,
      accountHolder,
      branch,
      currency: currency || 'VND',
      isDefault: isDefault ? 1 : 0,
      status: 'ACTIVE'
    } as any).returning();

    masterDataCache.invalidateByTag('suppliers');
    res.json({ success: true, data: inserted[0] });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// Delete Bank Account from Supplier
router.delete("/api/suppliers/:id/bank-accounts/:bankId", requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING', 'ADMIN'), async (req, res) => {
  try {
    const bankId = Number(req.params.bankId);
    await db.delete(schema.supplierBankAccounts).where(eq(schema.supplierBankAccounts.id, bankId));
    masterDataCache.invalidateByTag('suppliers');
    res.json({ success: true, message: "Đã xóa tài khoản ngân hàng." });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

router.post("/api/suppliers/seed", requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    let suppliers = await db.select().from(schema.suppliers).all();
    if (suppliers.length === 0) {
      const defaultSuppliers = [
        {
          code: 'SUP-001',
          name: 'Công ty Cổ phần Vật liệu Bán dẫn Toàn Cầu',
          shortName: 'Semiconductor Global',
          supplierType: 'Manufacturer',
          status: 'ACTIVE',
          taxCode: '0312345678',
          phone: '028-38291029',
          email: 'purchasing@semiglobal.vn',
          address: 'KCN Cao TP. Thủ Đức, TP. Hồ Chí Minh',
          paymentTerms: 'NET 30',
          creditLimit: 1500000000,
          currency: 'VND'
        },
        {
          code: 'SUP-002',
          name: 'Tập đoàn Hóa chất & Phụ gia Xanh',
          shortName: 'Green Chemical',
          supplierType: 'Manufacturer',
          status: 'ACTIVE',
          taxCode: '0109988776',
          phone: '024-39876543',
          email: 'sales@greenchem.vn',
          address: 'KCN Đình Vũ, Hải Phòng',
          paymentTerms: 'NET 30',
          creditLimit: 800000000,
          currency: 'VND'
        },
        {
          code: 'SUP-003',
          name: 'Công ty TNHH Thiết bị Đo lường Quang Học',
          shortName: 'Optics VN',
          supplierType: 'Distributor',
          status: 'ACTIVE',
          taxCode: '0308765432',
          phone: '028-37654321',
          email: 'info@opticsinstruments.com.vn',
          address: 'KCN Tân Bình, TP. Hồ Chí Minh',
          paymentTerms: 'NET 15',
          creditLimit: 500000000,
          currency: 'VND'
        },
        {
          code: 'SUP-ABC',
          name: 'CÔNG TY TNHH ABC TECHNOLOGY',
          shortName: 'ABC Tech',
          supplierType: 'Manufacturer',
          status: 'ACTIVE',
          taxCode: '0312345678',
          phone: '028-38291029',
          email: 'contact.a@abctech.com',
          address: 'Số 123 Đường Điện Biên Phủ, Quận Bình Thạnh, TP. Hồ Chí Minh',
          paymentTerms: 'NET 30',
          creditLimit: 1200000000,
          currency: 'VND'
        }
      ];
      for (const s of defaultSuppliers) {
        await db.insert(schema.suppliers).values(s as any).catch(() => {});
      }
      masterDataCache.invalidateByTag('suppliers');
      suppliers = await db.select().from(schema.suppliers).all();
    }
    res.json(suppliers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/suppliers", requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Missing authenticated actor" });
    }
    const userId = user.id;

    const {
      code, name, shortName, supplierType, status, taxCode, taxName,
      taxAddress, companyName, address, phone, email, website,
      paymentTerms, creditLimit, currency, performanceTier, notes,
      contacts, bankAccounts, idempotencyKey
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Mã và tên nhà cung cấp là bắt buộc." });
    }

    if (!idempotencyKey) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "idempotencyKey is required for this operation." });
    }

    const payloadToHash = { code, name, shortName, supplierType, status, taxCode, address, paymentTerms, currency };
    const payloadFingerprint = crypto.createHash('sha256').update(JSON.stringify(payloadToHash)).digest('hex');

    const existingEvent = await db.select().from(schema.outboxEvents)
      .where(eq(schema.outboxEvents.eventId, idempotencyKey)).limit(1);

    if (existingEvent.length > 0) {
      const evt = existingEvent[0];
      if (evt.correlationId !== payloadFingerprint) {
        return res.status(409).json({ error: "IDEMPOTENCY_CONFLICT", message: "Same key with different payload" });
      }

      const supplierObj = await db.select().from(schema.suppliers)
        .where(eq(schema.suppliers.id, Number(evt.aggregateId))).limit(1);

      if (supplierObj.length > 0) {
        return res.status(200).json({
          success: true,
          message: "Tạo nhà cung cấp thành công (idempotent)",
          data: supplierObj[0],
          replayed: true
        });
      }
    }

    const existingCode = await db.select().from(schema.suppliers)
      .where(eq(schema.suppliers.code, code)).limit(1);
    if (existingCode.length > 0) {
      return res.status(409).json({ error: "CONFLICT", message: "Mã nhà cung cấp đã tồn tại." });
    }

    const initialStatus = status || 'ACTIVE';
    if (!['ACTIVE', 'INACTIVE', 'BLOCKED', 'ARCHIVED'].includes(initialStatus)) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Trạng thái không hợp lệ." });
    }

    let createdSupplier: any;
    try {
      await db.transaction(async (tx) => {
        const inserted = await tx.insert(schema.suppliers).values({
          code,
          name,
          shortName,
          supplierType: supplierType || 'Manufacturer',
          status: initialStatus,
          taxCode,
          taxName,
          taxAddress,
          companyName,
          address,
          phone,
          email,
          website,
          paymentTerms: paymentTerms || 'NET 30',
          creditLimit: creditLimit || 0,
          currency: currency || 'VND',
          performanceTier: performanceTier || 'TIER_B',
          notes
        } as any).returning();

        createdSupplier = inserted[0];

        if (contacts && Array.isArray(contacts)) {
          for (const c of contacts) {
            await tx.insert(schema.supplierContacts).values({
              supplierId: createdSupplier.id,
              contactName: c.contactName,
              department: c.department || 'Sales',
              position: c.position,
              phone: c.phone,
              email: c.email,
              note: c.note,
              isPrimary: c.isPrimary ? 1 : 0
            } as any);
          }
        }

        if (bankAccounts && Array.isArray(bankAccounts)) {
          for (const b of bankAccounts) {
            await tx.insert(schema.supplierBankAccounts).values({
              supplierId: createdSupplier.id,
              bankName: b.bankName,
              accountNumber: b.accountNumber,
              accountHolder: b.accountHolder,
              branch: b.branch,
              currency: b.currency || 'VND',
              isDefault: b.isDefault ? 1 : 0,
              status: b.status || 'ACTIVE'
            } as any);
          }
        }

        await tx.insert(schema.outboxEvents).values({
          eventId: idempotencyKey,
          eventType: 'IdempotencyRecord_SupplierCreated',
          aggregateType: 'Supplier',
          aggregateId: String(createdSupplier.id),
          source: 'MasterData',
          actorId: String(userId),
          correlationId: payloadFingerprint,
          status: 'PUBLISHED',
          payload: "{}"
        } as any);

        await tx.insert(schema.outboxEvents).values({
          eventId: crypto.randomUUID(),
          eventType: 'SUPPLIER_CREATED',
          aggregateType: 'Supplier',
          aggregateId: String(createdSupplier.id),
          source: 'MasterData',
          actorId: String(userId),
          correlationId: payloadFingerprint,
          status: 'PENDING',
          payload: JSON.stringify({
            supplierId: createdSupplier.id,
            supplierCode: createdSupplier.code,
            status: createdSupplier.status,
            name: createdSupplier.name
          })
        } as any);
      });
    } catch (txErr: any) {
      if (txErr.message && txErr.message.includes("UNIQUE constraint failed")) {
        const existingEvt = await db.select().from(schema.outboxEvents)
          .where(eq(schema.outboxEvents.eventId, idempotencyKey)).limit(1);
        if (existingEvt.length > 0) {
          const evt = existingEvt[0];
          if (evt.correlationId !== payloadFingerprint) {
            return res.status(409).json({ error: "IDEMPOTENCY_CONFLICT", message: "Same key with different payload" });
          }
          const supplierObj = await db.select().from(schema.suppliers)
            .where(eq(schema.suppliers.id, Number(evt.aggregateId))).limit(1);
          if (supplierObj.length > 0) {
            return res.status(200).json({
              success: true,
              message: "Tạo nhà cung cấp thành công (idempotent)",
              data: supplierObj[0],
              replayed: true
            });
          }
        }
      }
      throw txErr;
    }

    masterDataCache.invalidateByTag('suppliers');

    return res.status(201).json({
      success: true,
      data: createdSupplier
    });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

router.put("/api/suppliers/:id", requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Missing authenticated actor" });
    }
    const supplierId = Number(req.params.id);

    const existingSupplier = await db.select().from(schema.suppliers).where(eq(schema.suppliers.id, supplierId)).limit(1);
    if (existingSupplier.length === 0) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Không tìm thấy nhà cung cấp." });
    }
    const currentSupplier = existingSupplier[0];

    const {
      name, shortName, supplierType, status, taxCode, taxName,
      taxAddress, companyName, address, phone, email, website,
      paymentTerms, creditLimit, currency, performanceTier, notes,
      contacts, bankAccounts
    } = req.body;

    if (status && status !== currentSupplier.status) {
      if (currentSupplier.status === 'ARCHIVED') {
        return res.status(409).json({ error: "INVALID_SUPPLIER_STATUS_TRANSITION", message: "Cannot change status of an ARCHIVED supplier." });
      }
      if (!['ACTIVE', 'INACTIVE', 'BLOCKED', 'ARCHIVED'].includes(status)) {
        return res.status(400).json({ error: "VALIDATION_ERROR", message: "Trạng thái không hợp lệ." });
      }
    }

    let updatedSupplier: any;
    try {
      await db.transaction(async (tx) => {
        const updated = await tx.update(schema.suppliers).set({
          name: name !== undefined ? name : currentSupplier.name,
          shortName: shortName !== undefined ? shortName : currentSupplier.shortName,
          supplierType: supplierType !== undefined ? supplierType : currentSupplier.supplierType,
          status: status !== undefined ? status : currentSupplier.status,
          taxCode: taxCode !== undefined ? taxCode : currentSupplier.taxCode,
          taxName: taxName !== undefined ? taxName : currentSupplier.taxName,
          taxAddress: taxAddress !== undefined ? taxAddress : currentSupplier.taxAddress,
          companyName: companyName !== undefined ? companyName : currentSupplier.companyName,
          address: address !== undefined ? address : currentSupplier.address,
          phone: phone !== undefined ? phone : currentSupplier.phone,
          email: email !== undefined ? email : currentSupplier.email,
          website: website !== undefined ? website : currentSupplier.website,
          paymentTerms: paymentTerms !== undefined ? paymentTerms : currentSupplier.paymentTerms,
          creditLimit: creditLimit !== undefined ? creditLimit : currentSupplier.creditLimit,
          currency: currency !== undefined ? currency : currentSupplier.currency,
          performanceTier: performanceTier !== undefined ? performanceTier : currentSupplier.performanceTier,
          notes: notes !== undefined ? notes : currentSupplier.notes,
          updatedAt: new Date()
        } as any).where(eq(schema.suppliers.id, supplierId)).returning();
        
        updatedSupplier = updated[0];

        if (contacts && Array.isArray(contacts)) {
          await tx.delete(schema.supplierContacts).where(eq(schema.supplierContacts.supplierId, supplierId));
          for (const c of contacts) {
            await tx.insert(schema.supplierContacts).values({
              supplierId,
              contactName: c.contactName,
              department: c.department || 'Sales',
              position: c.position,
              phone: c.phone,
              email: c.email,
              note: c.note,
              isPrimary: c.isPrimary ? 1 : 0
            } as any);
          }
        }

        if (bankAccounts && Array.isArray(bankAccounts)) {
          await tx.delete(schema.supplierBankAccounts).where(eq(schema.supplierBankAccounts.supplierId, supplierId));
          for (const b of bankAccounts) {
            await tx.insert(schema.supplierBankAccounts).values({
              supplierId,
              bankName: b.bankName,
              accountNumber: b.accountNumber,
              accountHolder: b.accountHolder,
              branch: b.branch,
              currency: b.currency || 'VND',
              isDefault: b.isDefault ? 1 : 0,
              status: b.status || 'ACTIVE'
            } as any);
          }
        }

        await tx.insert(schema.outboxEvents).values({
          eventId: crypto.randomUUID(),
          eventType: 'SUPPLIER_UPDATED',
          aggregateType: 'Supplier',
          aggregateId: String(updatedSupplier.id),
          source: 'MasterData',
          actorId: String(user.id),
          correlationId: crypto.randomUUID(),
          status: 'PENDING',
          payload: JSON.stringify({
            supplierId: updatedSupplier.id,
            supplierCode: updatedSupplier.code,
            status: updatedSupplier.status,
            name: updatedSupplier.name
          })
        } as any);
      });
    } catch (txErr: any) {
      throw txErr;
    }

    masterDataCache.invalidateByTag('suppliers');

    return res.status(200).json({
      success: true,
      data: updatedSupplier
    });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

router.delete("/api/suppliers/:id", requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING'), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Missing authenticated actor" });
    }
    const supplierId = Number(req.params.id);

    const existingSupplier = await db.select().from(schema.suppliers).where(eq(schema.suppliers.id, supplierId)).limit(1);
    if (existingSupplier.length === 0) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Không tìm thấy nhà cung cấp." });
    }
    const currentSupplier = existingSupplier[0];

    if (currentSupplier.status === 'ARCHIVED') {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Nhà cung cấp đã bị lưu trữ (ARCHIVED)." });
    }

    let archivedSupplier: any;
    await db.transaction(async (tx) => {
      const updated = await tx.update(schema.suppliers).set({
        status: 'ARCHIVED',
        updatedAt: new Date()
      } as any).where(eq(schema.suppliers.id, supplierId)).returning();
      
      archivedSupplier = updated[0];

      await tx.insert(schema.outboxEvents).values({
        eventId: crypto.randomUUID(),
        eventType: 'SUPPLIER_UPDATED',
        aggregateType: 'Supplier',
        aggregateId: String(archivedSupplier.id),
        source: 'MasterData',
        actorId: String(user.id),
        correlationId: crypto.randomUUID(),
        status: 'PENDING',
        payload: JSON.stringify({
          supplierId: archivedSupplier.id,
          supplierCode: archivedSupplier.code,
          status: 'ARCHIVED'
        })
      } as any);
    });

    masterDataCache.invalidateByTag('suppliers');

    return res.status(200).json({
      success: true,
      message: "Đã lưu trữ nhà cung cấp.",
      data: archivedSupplier
    });
  } catch (err: any) {
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

export default router;
