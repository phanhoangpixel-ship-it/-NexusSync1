import { Router, Request, Response, NextFunction } from "express";
import { QualityService, getAqlSampleSize } from "../../services/qualityService";
import { db } from "../../db/index";
import * as schema from "../../db/schema";
import { desc } from "drizzle-orm";

const router = Router();

// RBAC Middleware Helper for QMS permissions
function requireQualityPermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        return next(); // Default to dev super admin
      }
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Yêu cầu đăng nhập." });
    }

    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'QA_MANAGER' || user.role === 'QC_INSPECTOR') {
      return next();
    }

    const permissions: string[] = user.permissions || [];
    if (permissions.includes(permission) || permissions.includes('quality.*') || permissions.includes('*')) {
      return next();
    }

    return res.status(403).json({
      error: "FORBIDDEN",
      message: `Tài khoản không có quyền '${permission}' để thực hiện nghiệp vụ này.`,
    });
  };
}

// ==========================================
// 1. KPI SUMMARY & METRICS
// ==========================================
router.get("/api/quality/kpi", async (req, res) => {
  try {
    const kpi = await QualityService.getKpiSummary();
    res.json(kpi);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. QUALITY INSPECTION PLANS (M39-F01)
// ==========================================
router.get("/api/quality/plans", async (req, res) => {
  try {
    const { type, productId, status } = req.query;
    const plans = await QualityService.getPlans({
      type: type as string,
      productId: productId ? Number(productId) : undefined,
      status: status as string,
    });
    res.json(plans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/quality/plans/:id", async (req, res) => {
  try {
    const plan = await QualityService.getPlanById(Number(req.params.id));
    if (!plan) return res.status(404).json({ error: "Không tìm thấy kế hoạch kiểm định." });
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/quality/plans", requireQualityPermission("quality.plan.manage"), async (req, res) => {
  try {
    const userId = (req as any).user?.id || 1;
    const plan = await QualityService.createPlan({
      ...req.body,
      userId,
    });
    res.status(201).json(plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. QUALITY INSPECTIONS (M39-F02: IQC/PQC/OQC)
// ==========================================
router.get("/api/quality/inspections", async (req, res) => {
  try {
    const inspections = await QualityService.getInspections();
    res.json(inspections);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/quality/inspections/:id", async (req, res) => {
  try {
    const inspection = await QualityService.getInspectionById(Number(req.params.id));
    if (!inspection) return res.status(404).json({ error: "Không tìm thấy phiếu kiểm định." });
    res.json(inspection);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/quality/inspections", requireQualityPermission("quality.inspection.manage"), async (req, res) => {
  try {
    const userId = (req as any).user?.id || 1;
    const inspection = await QualityService.createInspection({
      ...req.body,
      userId,
    });
    res.status(201).json(inspection);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/quality/inspections/:id/evaluate", requireQualityPermission("quality.inspection.manage"), async (req, res) => {
  try {
    const userId = (req as any).user?.id || 1;
    const updated = await QualityService.submitInspectionResults(Number(req.params.id), {
      ...req.body,
      userId,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/quality/inspections/aql-sample-size", (req, res) => {
  try {
    const { lotSize, inspectionLevel } = req.body;
    const result = getAqlSampleSize(Number(lotSize) || 100, inspectionLevel || 'II');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. NON-CONFORMANCE REPORTS & CAPA (M39-F03)
// ==========================================
router.get("/api/quality/ncrs", async (req, res) => {
  try {
    const ncrs = await QualityService.getNcrs();
    res.json(ncrs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/quality/ncrs/:id", async (req, res) => {
  try {
    const ncr = await QualityService.getNcrById(Number(req.params.id));
    if (!ncr) return res.status(404).json({ error: "Không tìm thấy biên bản NCR." });
    res.json(ncr);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/quality/ncrs", requireQualityPermission("quality.ncr.manage"), async (req, res) => {
  try {
    const userId = (req as any).user?.id || 1;
    const ncr = await QualityService.createNcr({
      ...req.body,
      userId,
    });
    res.status(201).json(ncr);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/quality/ncrs/:id/disposition", requireQualityPermission("quality.ncr.approve"), async (req, res) => {
  try {
    const userId = (req as any).user?.id || 1;
    const ncr = await QualityService.approveNcrDisposition(Number(req.params.id), {
      ...req.body,
      userId,
    });
    res.json(ncr);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/quality/capas", async (req, res) => {
  try {
    const capas = await QualityService.getCapas();
    res.json(capas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/quality/capas", requireQualityPermission("quality.ncr.manage"), async (req, res) => {
  try {
    const userId = (req as any).user?.id || 1;
    const capa = await QualityService.createCapa({
      ...req.body,
      userId,
    });
    res.status(201).json(capa);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/quality/capas/:id/verify", requireQualityPermission("quality.ncr.approve"), async (req, res) => {
  try {
    const userId = (req as any).user?.id || 1;
    const capa = await QualityService.verifyCapa(Number(req.params.id), {
      ...req.body,
      userId,
    });
    res.json(capa);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. BATCH RELEASES & QUARANTINE (M39-F04)
// ==========================================
router.get("/api/quality/batch-releases", async (req, res) => {
  try {
    const releases = await QualityService.getBatchReleases();
    res.json(releases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/quality/batch-releases", requireQualityPermission("quality.inspection.manage"), async (req, res) => {
  try {
    const userId = (req as any).user?.id || 1;
    const release = await QualityService.createBatchRelease({
      ...req.body,
      userId,
    });
    res.status(201).json(release);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/quality/batch-releases/:id/post-inventory", requireQualityPermission("quality.ncr.approve"), async (req, res) => {
  try {
    const userId = (req as any).user?.id || 1;
    const release = await QualityService.approveAndPostBatchRelease(Number(req.params.id), {
      ...req.body,
      userId,
    });
    res.json(release);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. QUARANTINE LOTS (REALTIME ADAPTER FOR UI)
// ==========================================
router.get("/api/quality/quarantine", async (req, res) => {
  try {
    // Return pending inspections and pending releases as quarantine items
    const inspections = await db.select({
      id: schema.qcInspections.id,
      code: schema.qcInspections.code,
      productId: schema.qcInspections.productId,
      productName: schema.products.name,
      productSku: schema.products.sku,
      lotNumber: schema.qcInspections.lotNumber,
      sourceDocumentType: schema.qcInspections.sourceDocumentType,
      sourceDocumentCode: schema.qcInspections.sourceDocumentCode,
      totalQuantity: schema.qcInspections.totalQuantity,
      quarantineQuantity: schema.qcInspections.quarantineQuantity,
      supplierName: schema.suppliers.name,
      warehouseName: schema.warehouses.name,
      status: schema.qcInspections.status,
      createdAt: schema.qcInspections.createdAt,
    }).from(schema.qcInspections)
      .leftJoin(schema.products, eq(schema.products.id, schema.qcInspections.productId))
      .leftJoin(schema.suppliers, eq(schema.suppliers.id, schema.qcInspections.supplierId))
      .leftJoin(schema.warehouses, eq(schema.warehouses.id, schema.qcInspections.warehouseId))
      .where(sql`${schema.qcInspections.status} IN ('PENDING', 'IN_PROGRESS', 'CONDITIONAL_PASS')`)
      .orderBy(desc(schema.qcInspections.id))
      .all();

    const formatted = inspections.map(i => ({
      id: `Q-${i.code}`,
      inspectionId: i.id,
      sourceType: i.sourceDocumentType || 'PO Inbound GRN',
      sourceRef: i.sourceDocumentCode || `GRN-${i.id}`,
      itemSku: i.productSku || 'SKU-GEN',
      itemName: i.productName || 'Vật tư kỹ thuật',
      quantity: i.quarantineQuantity || i.totalQuantity,
      unit: 'Đơn vị',
      supplierOrDept: i.supplierName || i.warehouseName || 'Nhà cung ứng',
      receivedDate: i.createdAt ? new Date(i.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
      status: 'PENDING_INSPECTION',
      lotNumber: i.lotNumber || `LOT-${i.code}`,
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/quality/quarantine/:id/approve", requireQualityPermission("quality.ncr.approve"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 1;

    // Check if matching inspection by code
    const rawCode = id.startsWith('Q-') ? id.slice(2) : id;
    const inspection = await db.select().from(schema.qcInspections)
      .where(sql`${schema.qcInspections.code} = ${rawCode} OR ${schema.qcInspections.id} = ${Number(id) || 0}`)
      .get();

    if (inspection) {
      const evaluated = await QualityService.submitInspectionResults(inspection.id, {
        results: [],
        decision: 'ACCEPT',
        decisionNotes: 'Nghiệm thu đạt chuẩn kỹ thuật & giải phóng kho cách ly',
        passedQuantity: inspection.totalQuantity,
        failedQuantity: 0,
        userId,
      });

      // If batch release was created, post to inventory
      if (evaluated?.batchReleaseId) {
        await QualityService.approveAndPostBatchRelease(evaluated.batchReleaseId, {
          userId,
          notes: `Giải phóng trực tiếp từ cổng kiểm định cách ly (${inspection.code})`,
        });
      }

      return res.json({
        success: true,
        message: `Lô hàng ${inspection.code} đã được nghiệm thu và giải phóng tồn kho khả dụng thành công.`,
        inspection: evaluated,
      });
    }

    res.json({ success: true, message: `Lô hàng ${id} đã được nghiệm thu.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/quality/quarantine/:id/reject", requireQualityPermission("quality.ncr.approve"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 1;

    const rawCode = id.startsWith('Q-') ? id.slice(2) : id;
    const inspection = await db.select().from(schema.qcInspections)
      .where(sql`${schema.qcInspections.code} = ${rawCode} OR ${schema.qcInspections.id} = ${Number(id) || 0}`)
      .get();

    if (inspection) {
      const evaluated = await QualityService.submitInspectionResults(inspection.id, {
        results: [],
        decision: 'REJECT',
        decisionNotes: req.body.notes || 'Từ chối nghiệm thu do không đạt tiêu chuẩn kỹ thuật',
        passedQuantity: 0,
        failedQuantity: inspection.totalQuantity,
        createNcrIfFailed: true,
        userId,
      });

      return res.json({
        success: true,
        message: `Lô hàng ${inspection.code} đã bị từ chối và lập biên bản NCR.`,
        inspection: evaluated,
      });
    }

    res.json({ success: true, message: `Lô hàng ${id} đã bị từ chối.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. CROSS-MODULE SRM (M11) CONNECTORS
// ==========================================
router.get("/api/quality/suppliers/scorecards", async (req, res) => {
  try {
    const scorecards = await QualityService.getAllSuppliersQualityScorecards();
    res.json(scorecards);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/quality/suppliers/:id/scorecard", async (req, res) => {
  try {
    const scorecard = await QualityService.getSupplierQualityScorecard(Number(req.params.id));
    res.json(scorecard);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. CROSS-MODULE DMS (M29) & WORKFLOW (M28) CONNECTORS
// ==========================================
router.post("/api/quality/inspections/:id/seal-coa", requireQualityPermission("quality.inspection.manage"), async (req, res) => {
  try {
    const inspectionId = Number(req.params.id);
    const inspection = await QualityService.getInspectionById(inspectionId);
    if (!inspection) return res.status(404).json({ error: "Không tìm thấy phiếu kiểm định." });

    const user = (req as any).user;
    const userId = user?.id || 1;
    const username = user?.name || user?.username || 'QC Specialist';

    const result = await QualityService.archiveCertificateToDms({
      type: 'COA',
      referenceId: inspection.id,
      referenceCode: inspection.code,
      title: `Chứng Chỉ Phân Tích & Nghiệm Thu COA - ${inspection.code}`,
      metadata: {
        inspectionCode: inspection.code,
        lotNumber: inspection.lotNumber,
        productSku: inspection.productSku,
        productName: inspection.productName,
        totalQuantity: inspection.totalQuantity,
        sampleQuantity: inspection.sampleQuantity,
        decision: inspection.decision,
        inspectorName: inspection.inspectorName,
        results: inspection.results,
        inspectionDate: inspection.inspectionDate,
      },
      userId,
      username,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/quality/batch-releases/:id/seal-coa", requireQualityPermission("quality.ncr.approve"), async (req, res) => {
  try {
    const releaseId = Number(req.params.id);
    const release = await db.select().from(schema.qcBatchReleases).where(eq(schema.qcBatchReleases.id, releaseId)).get();
    if (!release) return res.status(404).json({ error: "Không tìm thấy lệnh giải phóng lô hàng." });

    const user = (req as any).user;
    const userId = user?.id || 1;
    const username = user?.name || user?.username || 'QA Director';

    const result = await QualityService.archiveCertificateToDms({
      type: 'BATCH_RELEASE',
      referenceId: release.id,
      referenceCode: release.releaseCode,
      title: `Hồ Sơ Thẩm Định & Lệnh Giải Phóng Lô Hàng - ${release.releaseCode}`,
      metadata: {
        releaseCode: release.releaseCode,
        lotId: release.lotId,
        productId: release.productId,
        warehouseId: release.warehouseId,
        releaseQuantity: release.releaseQuantity,
        coaNumber: release.coaNumber,
        status: release.status,
      },
      userId,
      username,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/quality/ncrs/:id/seal-dms", requireQualityPermission("quality.ncr.manage"), async (req, res) => {
  try {
    const ncrId = Number(req.params.id);
    const ncr = await QualityService.getNcrById(ncrId);
    if (!ncr) return res.status(404).json({ error: "Không tìm thấy biên bản NCR." });

    const user = (req as any).user;
    const userId = user?.id || 1;
    const username = user?.name || user?.username || 'QC Specialist';

    const result = await QualityService.archiveCertificateToDms({
      type: 'NCR_DOSSIER',
      referenceId: ncr.id,
      referenceCode: ncr.ncrNumber,
      title: `Hồ Sơ Sự Không Phù Hợp & Hành Động Khắc Phục - ${ncr.ncrNumber}`,
      metadata: {
        ncrNumber: ncr.ncrNumber,
        title: ncr.title,
        severity: ncr.severity,
        defectType: ncr.defectType,
        nonConformingQuantity: ncr.nonConformingQuantity,
        disposition: ncr.disposition,
        capas: ncr.capas,
      },
      userId,
      username,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

