import { Router } from "express";
import { client, db, recreateDatabaseClient } from "../../db/index";
import * as schema from "../../db/schema";
import { StockAdjustmentService } from "../../engines/stockAdjustmentService";
import { WorkspaceAggregationService } from "../../engines/WorkspaceAggregationService";
import { InventoryService } from "../../engines/inventoryService";
import { accountingEngine } from "../../engines/accountingEngine";
import { UnifiedPipelineEngine } from "../../engines/unifiedPipelineEngine";
import { BankReconciliationEngine } from "../../engines/bankReconciliationEngine";
import { eq, desc, sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

const router = Router();

router.post("/api/unified-pipeline/execute", async (req, res) => {
    try {
      const result = await UnifiedPipelineEngine.runFullPipeline(1);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to execute unified data pipeline" });
    }
  });

router.get("/api/unified-pipeline/metrics", async (req, res) => {
    try {
      const metrics = await UnifiedPipelineEngine.getPipelineMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to get pipeline metrics" });
    }
  });

export default router;
