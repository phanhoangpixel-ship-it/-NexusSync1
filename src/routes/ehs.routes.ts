import { Router } from "express";
import { ehsService } from "../../engines/ehsService";

const router = Router();

// Helper to extract actor information from headers / simulated session
const getActor = (req: any) => {
  const userId = req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : (req.user?.id || 1);
  const username = req.headers['x-user-name'] || req.user?.name || req.user?.username || 'Admin EHS';
  return { userId, username };
};

// =========================================================================
// 1. INCIDENTS (F01, F09, F10)
// =========================================================================

router.get("/api/ehs/incidents", async (req, res) => {
  try {
    const { warehouseId, severity, status, search } = req.query;
    const records = await ehsService.getIncidents({
      warehouseId: warehouseId ? Number(warehouseId) : undefined,
      severity: severity as string,
      status: status as string,
      search: search as string,
    });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi tải danh sách sự cố" });
  }
});

router.get("/api/ehs/incidents/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const incident = await ehsService.getIncidentById(id);
    if (!incident) return res.status(404).json({ error: "Không tìm thấy hồ sơ sự cố" });
    res.json(incident);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi tải chi tiết sự cố" });
  }
});

router.post("/api/ehs/incidents", async (req, res) => {
  try {
    const actor = getActor(req);
    const result = await ehsService.createIncident(req.body, actor);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi tạo báo cáo sự cố" });
  }
});

router.post("/api/ehs/incidents/:id/investigate", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const actor = getActor(req);
    const result = await ehsService.investigateIncident(id, req.body, actor);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi cập nhật điều tra sự cố" });
  }
});

router.post("/api/ehs/incidents/:id/close", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const actor = getActor(req);
    const result = await ehsService.closeIncident(id, req.body?.notes, actor);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi đóng hồ sơ sự cố" });
  }
});

// =========================================================================
// 2. RISK ASSESSMENTS / JSA MATRIX (F02)
// =========================================================================

router.get("/api/ehs/risk-assessments", async (req, res) => {
  try {
    const { warehouseId, riskLevel, search } = req.query;
    const records = await ehsService.getRiskAssessments({
      warehouseId: warehouseId ? Number(warehouseId) : undefined,
      riskLevel: riskLevel as string,
      search: search as string,
    });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi tải danh sách JSA" });
  }
});

router.post("/api/ehs/risk-assessments", async (req, res) => {
  try {
    const actor = getActor(req);
    const result = await ehsService.createRiskAssessment(req.body, actor);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi tạo đánh giá rủi ro JSA" });
  }
});

// =========================================================================
// 3. CAPA MANAGEMENT (F03, F11)
// =========================================================================

router.get("/api/ehs/capas", async (req, res) => {
  try {
    const { warehouseId, status, search } = req.query;
    const records = await ehsService.getCapas({
      warehouseId: warehouseId ? Number(warehouseId) : undefined,
      status: status as string,
      search: search as string,
    });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi tải danh sách CAPA" });
  }
});

router.post("/api/ehs/capas", async (req, res) => {
  try {
    const actor = getActor(req);
    const result = await ehsService.createCapa(req.body, actor);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi tạo phiếu CAPA" });
  }
});

router.post("/api/ehs/capas/:id/verify", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const actor = getActor(req);
    const result = await ehsService.verifyCapa(id, req.body, actor);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi nghiệm thu CAPA" });
  }
});

router.post("/api/ehs/capas/:id/close", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const actor = getActor(req);
    const result = await ehsService.closeCapa(id, actor);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi đóng phiếu CAPA" });
  }
});

// =========================================================================
// 4. SAFETY AUDITS & CHECKLIST (F04, F12)
// =========================================================================

router.get("/api/ehs/audits", async (req, res) => {
  try {
    const { warehouseId, result, search } = req.query;
    const records = await ehsService.getAudits({
      warehouseId: warehouseId ? Number(warehouseId) : undefined,
      result: result as string,
      search: search as string,
    });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi tải danh sách đợt audit" });
  }
});

router.get("/api/ehs/audits/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const audit = await ehsService.getAuditById(id);
    if (!audit) return res.status(404).json({ error: "Không tìm thấy đợt audit" });
    res.json(audit);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi tải chi tiết đợt audit" });
  }
});

router.post("/api/ehs/audits", async (req, res) => {
  try {
    const actor = getActor(req);
    const result = await ehsService.executeSafetyAudit(req.body, actor);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi thực hiện audit" });
  }
});

// =========================================================================
// 5. FIRE SAFETY EQUIPMENT REGISTRY (F05)
// =========================================================================

router.get("/api/ehs/fire-safety/equipment", async (req, res) => {
  try {
    const { warehouseId, status, search } = req.query;
    const records = await ehsService.getFireEquipment({
      warehouseId: warehouseId ? Number(warehouseId) : undefined,
      status: status as string,
      search: search as string,
    });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi tải thiết bị PCCC" });
  }
});

router.post("/api/ehs/fire-safety/equipment", async (req, res) => {
  try {
    const actor = getActor(req);
    const result = await ehsService.createFireEquipment(req.body, actor);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi đăng ký thiết bị PCCC" });
  }
});

router.post("/api/ehs/fire-safety/equipment/:id/inspect", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const actor = getActor(req);
    const result = await ehsService.inspectFireEquipment(id, req.body, actor);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi ghi nhận kiểm định PCCC" });
  }
});

// =========================================================================
// 6. ENVIRONMENTAL MONITORING (F06)
// =========================================================================

router.get("/api/ehs/environmental/records", async (req, res) => {
  try {
    const { warehouseId, recordType, status } = req.query;
    const records = await ehsService.getEnvironmentalRecords({
      warehouseId: warehouseId ? Number(warehouseId) : undefined,
      recordType: recordType as string,
      status: status as string,
    });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi tải số liệu quan trắc môi trường" });
  }
});

router.post("/api/ehs/environmental/records", async (req, res) => {
  try {
    const actor = getActor(req);
    const result = await ehsService.createEnvironmentalRecord(req.body, actor);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi ghi nhận số liệu quan trắc" });
  }
});

// =========================================================================
// 7. SAFETY PERMITS & LOTO (F08)
// =========================================================================

router.get("/api/ehs/permits", async (req, res) => {
  try {
    const { warehouseId, status, assetId } = req.query;
    const records = await ehsService.getPermits({
      warehouseId: warehouseId ? Number(warehouseId) : undefined,
      status: status as string,
      assetId: assetId ? Number(assetId) : undefined,
    });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi tải giấy phép an toàn" });
  }
});

/**
 * READ-ONLY Open API for M27 EAM or any external service
 */
router.get("/api/ehs/permits/asset/:assetId/active", async (req, res) => {
  try {
    const assetId = Number(req.params.assetId);
    const result = await ehsService.getActivePermitForAsset(assetId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi tra cứu giấy phép an toàn thiết bị" });
  }
});

router.get("/api/ehs/permits/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const permit = await ehsService.getPermitById(id);
    if (!permit) return res.status(404).json({ error: "Không tìm thấy giấy phép an toàn" });
    res.json(permit);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi tải chi tiết giấy phép" });
  }
});

router.post("/api/ehs/permits", async (req, res) => {
  try {
    const actor = getActor(req);
    const result = await ehsService.createPermit(req.body, actor);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi tạo giấy phép an toàn" });
  }
});

router.post("/api/ehs/permits/:id/activate", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const actor = getActor(req);
    const result = await ehsService.activatePermit(id, actor);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi kích hoạt giấy phép" });
  }
});

router.post("/api/ehs/permits/:id/close", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const actor = getActor(req);
    const result = await ehsService.closePermit(id, req.body?.notes, actor);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi đóng giấy phép an toàn" });
  }
});

// =========================================================================
// 8. SITE SCOPE & KPI (F07, F16)
// =========================================================================

router.get("/api/ehs/site-scope", async (req, res) => {
  try {
    const records = await ehsService.getSiteScopes();
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi tải phạm vi an toàn" });
  }
});

router.post("/api/ehs/site-scope", async (req, res) => {
  try {
    const { warehouseId, safetyOfficerId, safetyOfficerName, auditFrequencyDays, emergencyContact } = req.body;
    const result = await ehsService.setSiteScope(Number(warehouseId), {
      safetyOfficerId: safetyOfficerId ? Number(safetyOfficerId) : undefined,
      safetyOfficerName,
      auditFrequencyDays: Number(auditFrequencyDays),
      emergencyContact,
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi lưu cấu hình phạm vi an toàn" });
  }
});

router.get("/api/ehs/kpi", async (req, res) => {
  try {
    const summary = await ehsService.getKpiSummary();
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi tải tổng hợp KPI an toàn" });
  }
});

// =========================================================================
// CANONICAL BACKWARD COMPATIBILITY ENDPOINTS (MODULE_MAP / Legacy)
// =========================================================================

router.get("/api/ehs/records", async (req, res) => {
  try {
    const records = await ehsService.getCanonicalRecords();
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi tải hồ sơ an toàn tổng hợp" });
  }
});

router.post("/api/ehs/records", async (req, res) => {
  try {
    const actor = getActor(req);
    const incident = await ehsService.createIncident({
      title: req.body.title || 'Báo cáo sự cố an toàn',
      incidentType: req.body.incidentType || 'SAFETY_HAZARD',
      severity: req.body.severity || 'MEDIUM',
      locationDetail: req.body.location,
      immediateAction: req.body.actionTaken,
      description: req.body.description || req.body.title || 'Ghi nhận sự cố hiện trường',
      reportedByName: req.body.inspector,
    }, actor);
    res.status(201).json(incident);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi tạo hồ sơ" });
  }
});

// Legacy Inspections wrapper
router.get("/api/ehs/inspections", async (req, res) => {
  try {
    const audits = await ehsService.getAudits();
    res.json(audits.map(a => ({
      id: a.id,
      inspectionCode: a.auditNumber,
      title: a.title,
      type: a.auditType,
      location: a.warehouseName || 'Khu vực Kho bãi',
      date: a.auditDate,
      status: a.result === 'PASS' ? 'PASSED' : 'FAILED',
      findings: a.remarks,
      inspector: a.auditorName,
      totalItems: a.totalItems,
      passedItems: a.passedItems,
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Lỗi tải inspections" });
  }
});

router.post("/api/ehs/inspections", async (req, res) => {
  try {
    const actor = getActor(req);
    const audit = await ehsService.executeSafetyAudit({
      title: req.body.title || 'Kiểm định An toàn Lao động',
      auditType: req.body.type || 'FIRE_SAFETY',
      warehouseId: req.body.warehouseId ? Number(req.body.warehouseId) : 1,
      auditDate: req.body.date || new Date().toISOString().slice(0, 10),
      auditorName: req.body.inspector || 'Cán bộ EHS',
      checklistItems: [
        {
          itemDescription: req.body.findings || 'Kiểm tra tổng quan hệ thống PCCC & an toàn',
          category: 'PCCC_GENERAL',
          isMandatory: true,
          status: req.body.status === 'FAILED' ? 'FAIL' : 'PASS',
        }
      ],
      remarks: req.body.findings,
    }, actor);
    res.status(201).json(audit);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi tạo inspection" });
  }
});

export default router;
