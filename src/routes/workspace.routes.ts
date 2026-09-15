import { Router } from "express";
import { client, db, recreateDatabaseClient } from "../../db/index";
import * as schema from "../../db/schema";
import { StockAdjustmentService } from "../../engines/stockAdjustmentService";
import { WorkspaceAggregationBackendService } from "../../engines/WorkspaceAggregationBackendService";
import { InventoryService } from "../../engines/inventoryService";
import { accountingEngine } from "../../engines/accountingEngine";
import { UnifiedPipelineEngine } from "../../engines/unifiedPipelineEngine";
import { BankReconciliationEngine } from "../../engines/bankReconciliationEngine";
import { eq, desc, sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

const router = Router();

router.get("/api/workspace/summary", async (req, res) => {
    try {
      const role = (req.query.role as string) || "SUPER_ADMIN";
      const branchId = (req.query.branchId as string) || "BR_HO";
      const summary = await WorkspaceAggregationBackendService.getSummary(role, branchId);
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load workspace summary" });
    }
  });

router.get("/api/workspace/work-items", async (req, res) => {
    try {
      const role = (req.query.role as string) || "SUPER_ADMIN";
      const branchId = (req.query.branchId as string) || "BR_HO";
      const filter = req.query.filter as any;
      const items = await WorkspaceAggregationBackendService.getWorkItems(role, branchId, filter);
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load work items" });
    }
  });

router.get("/api/workspace/entity-preview", async (req, res) => {
    try {
      const entity = req.query.entity as string;
      const entityId = req.query.id as string;
      if (!entity || !entityId) {
        return res.status(400).json({ error: "Missing entity or id query parameters" });
      }
      const preview = await WorkspaceAggregationBackendService.getEntityPreview(entity, entityId);
      res.json(preview);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load entity preview" });
    }
  });

router.get("/api/workspace/process-chains", async (req, res) => {
    try {
      const role = (req.query.role as string) || "SUPER_ADMIN";
      const chains = await WorkspaceAggregationBackendService.getProcessChains(role);
      res.json(chains);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load process chains" });
    }
  });

router.get("/api/workspace/search", async (req, res) => {
    try {
      const query = (req.query.q as string) || "";
      const results = await WorkspaceAggregationBackendService.searchOmnibar(query);
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Search failed" });
    }
  });

// WorkQueue Execution Actions
router.post(["/api/po/approve/:id", "/api/po/approve/*"], async (req, res) => {
  try {
    const id = req.params.id || (req.params as any)[0];
    const { userId } = req.body;
    const result = await WorkspaceAggregationBackendService.executeAction(id, { entityId: id, userId, actionType: 'approve' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi phê duyệt đơn mua hàng" });
  }
});

router.post(["/api/po/reject/:id", "/api/po/reject/*"], async (req, res) => {
  try {
    const id = req.params.id || (req.params as any)[0];
    const { userId } = req.body;
    const result = await WorkspaceAggregationBackendService.executeAction(id, { entityId: id, userId, actionType: 'reject' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi từ chối đơn mua hàng" });
  }
});

router.post(["/api/inventory/adjust/:id", "/api/inventory/adjust/*"], async (req, res) => {
  try {
    const id = req.params.id || (req.params as any)[0];
    const { userId } = req.body;
    const result = await WorkspaceAggregationBackendService.executeAction(id, { entityId: id, userId, actionType: 'adjust' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi điều chỉnh kiểm kê kho" });
  }
});

router.post(["/api/service-desk/take/:id", "/api/service-desk/take/*"], async (req, res) => {
  try {
    const id = req.params.id || (req.params as any)[0];
    const { userId } = req.body;
    const result = await WorkspaceAggregationBackendService.executeAction(id, { entityId: id, userId, actionType: 'take' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi tiếp nhận sự cố IT" });
  }
});

router.post(["/api/so/approve/:id", "/api/so/approve/*"], async (req, res) => {
  try {
    const id = req.params.id || (req.params as any)[0];
    const { userId } = req.body;
    const result = await WorkspaceAggregationBackendService.executeAction(id, { entityId: id, userId, actionType: 'approve' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi duyệt chiết khấu bán hàng" });
  }
});

router.post(["/api/hr/leave/approve/:id", "/api/hr/leave/approve/*"], async (req, res) => {
  try {
    const id = req.params.id || (req.params as any)[0];
    const { userId } = req.body;
    const result = await WorkspaceAggregationBackendService.executeAction(id, { entityId: id, userId, actionType: 'approve' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi duyệt nghỉ phép" });
  }
});

// RMA Process Steps Execution
router.post(["/api/rma/:action/:id", "/api/rma/:action/*"], async (req, res) => {
  try {
    const action = req.params.action;
    const id = req.params.id || (req.params as any)[0];
    const { userId } = req.body;
    const endpoint = `/api/rma/${action}/${id}`;
    const result = await WorkspaceAggregationBackendService.executeAction(endpoint, { entityId: id, userId, actionType: action });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi thực thi quy trình RMA" });
  }
});

// Order Fulfillment Steps Execution
router.post("/api/orders/:id/:action", async (req, res) => {
  try {
    const { id, action } = req.params;
    const { userId } = req.body;
    const endpoint = `/api/orders/${id}/${action}`;
    const result = await WorkspaceAggregationBackendService.executeAction(endpoint, { entityId: id, userId, actionType: action });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi thực thi quy trình xử lý đơn hàng" });
  }
});

// Dispatch / Maintenance / MES / Invoices Actions
router.post(["/api/dispatch/approve/:id", "/api/dispatch/approve/*"], async (req, res) => {
  try {
    const id = req.params.id || (req.params as any)[0];
    const { userId } = req.body;
    const result = await WorkspaceAggregationBackendService.executeAction(id, { entityId: id, userId, actionType: 'approve' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi duyệt lệnh điều phối xe" });
  }
});

router.post(["/api/maintenance/take/:id", "/api/maintenance/take/*"], async (req, res) => {
  try {
    const id = req.params.id || (req.params as any)[0];
    const { userId } = req.body;
    const result = await WorkspaceAggregationBackendService.executeAction(id, { entityId: id, userId, actionType: 'take' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi tiếp nhận bảo trì máy móc" });
  }
});

router.post(["/api/manufacturing/complete/:id", "/api/manufacturing/complete/*"], async (req, res) => {
  try {
    const id = req.params.id || (req.params as any)[0];
    const { userId } = req.body;
    const result = await WorkspaceAggregationBackendService.executeAction(id, { entityId: id, userId, actionType: 'complete' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi hoàn thành lệnh sản xuất" });
  }
});

router.post(["/api/invoices/sign/:id", "/api/invoices/sign/*"], async (req, res) => {
  try {
    const id = req.params.id || (req.params as any)[0];
    const { userId } = req.body;
    const result = await WorkspaceAggregationBackendService.executeAction(id, { entityId: id, userId, actionType: 'sign' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi ký số phát hành hóa đơn GTGT" });
  }
});

router.post("/api/workspace/work-items/:id/action", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, actionType } = req.body;
    const result = await WorkspaceAggregationBackendService.executeAction(id, { entityId: id, userId, actionType });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi xử lý tác vụ" });
  }
});

export default router;

