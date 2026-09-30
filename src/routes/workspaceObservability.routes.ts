import { Router } from "express";
import {
  runCycle,
  getHealthSummary,
  getTopology,
  listSpans,
  getRootCauseChain,
  remediateSpan,
  getModuleTrends,
  getModuleTrendDetail,
  getModuleForecasts,
  getModuleForecastDetail,
} from "../../engines/observabilityProjectorService";

const router = Router();

/**
 * M01 Observability & Command Hub API
 * 
 * QUYẾT ĐỊNH KIẾN TRÚC:
 * Không gán requirePermission('workspace:*') vì:
 * 1. Bảng permissions hệ thống không chứa permission code 'workspace:*'.
 * 2. Tất cả route ở đây đều là Read-Model / Idempotent Projector Sync cho Dashboard toàn cục.
 * 3. Middleware xác thực requireAuth đã được mount tại cấp /api trong server.ts.
 */

router.get("/api/workspace/observability/health", async (req, res) => {
  try {
    const date = typeof req.query.date === "string" ? req.query.date : undefined;
    res.json(await getHealthSummary(date));
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load observability health" });
  }
});

router.get("/api/workspace/observability/topology", async (req, res) => {
  try {
    const date = typeof req.query.date === "string" ? req.query.date : undefined;
    const result = await getTopology(date);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load observability topology" });
  }
});

router.post("/api/workspace/observability/sync", async (req, res) => {
  try {
    const force = req.query.force === "true" || req.body?.force === true;
    const result = await runCycle({ force });
    res.status(result.ok ? 200 : 500).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to run observability sync cycle" });
  }
});

router.get("/api/workspace/observability/spans", async (req, res) => {
  try {
    const { moduleCode, status, correlationId, page, pageSize } = req.query;
    const result = await listSpans({
      moduleCode: typeof moduleCode === "string" ? moduleCode : undefined,
      status: typeof status === "string" ? status : undefined,
      correlationId: typeof correlationId === "string" ? correlationId : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      pageSize: pageSize ? parseInt(String(pageSize), 10) : 20,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list observability spans" });
  }
});

router.get("/api/workspace/observability/spans/:correlationId", async (req, res) => {
  try {
    const correlationId = req.params.correlationId;
    const result = await listSpans({
      correlationId,
      pageSize: 100,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get spans by correlationId" });
  }
});

router.get("/api/workspace/observability/rca/:correlationId", async (req, res) => {
  try {
    const correlationId = req.params.correlationId;
    const result = await getRootCauseChain(correlationId);
    if (!result) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message: `Không tìm thấy chuỗi span nào khớp correlationId: ${correlationId}`
      });
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to analyze root cause" });
  }
});

router.post("/api/workspace/observability/remediate/:flowSpanId", async (req, res) => {
  try {
    const flowSpanId = parseInt(req.params.flowSpanId, 10);
    if (isNaN(flowSpanId)) {
      return res.status(400).json({ error: "INVALID_ID", message: "flowSpanId không hợp lệ" });
    }

    const actor = {
      id: (req as any).user?.id || 1,
      username: (req as any).user?.username || "ops_admin"
    };

    const outcome = await remediateSpan(flowSpanId, actor);
    res.status(outcome.status).json(outcome.body);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to remediate span" });
  }
});

router.get("/api/workspace/observability/trends", async (req, res) => {
  try {
    const days = req.query.days ? parseInt(String(req.query.days), 10) : 7;
    const trends = await getModuleTrends(isNaN(days) ? 7 : days);
    res.json(trends);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to calculate module trends" });
  }
});

router.get("/api/workspace/observability/trends/:moduleCode", async (req, res) => {
  try {
    const moduleCode = req.params.moduleCode;
    const days = req.query.days ? parseInt(String(req.query.days), 10) : 30;
    const result = await getModuleTrendDetail(moduleCode, isNaN(days) ? 30 : days);
    if (!result) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message: `Module ${moduleCode} không tồn tại trong danh mục hệ thống`
      });
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load module trend detail" });
  }
});

router.get("/api/workspace/observability/forecast", async (req, res) => {
  try {
    const days = req.query.days ? parseInt(String(req.query.days), 10) : 30;
    const forecasts = await getModuleForecasts(isNaN(days) ? 30 : days);
    res.json(forecasts);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to calculate module forecasts" });
  }
});

router.get("/api/workspace/observability/forecast/:moduleCode", async (req, res) => {
  try {
    const moduleCode = req.params.moduleCode;
    const days = req.query.days ? parseInt(String(req.query.days), 10) : 30;
    const result = await getModuleForecastDetail(moduleCode, isNaN(days) ? 30 : days);
    if (!result) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message: `Module ${moduleCode} không tồn tại trong danh mục hệ thống`
      });
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load module forecast detail" });
  }
});

export const workspaceObservabilityRouter = router;

