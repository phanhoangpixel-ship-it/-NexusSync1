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

router.get("/api/eam/assets", async (req, res) => {
    try {
      const assetList = await db.select().from(schema.assets).all();
      res.json(assetList);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.get("/api/eam/work-orders", async (req, res) => {
    try {
      const wos = await db.select().from(schema.maintenanceWorkOrders).orderBy(desc(schema.maintenanceWorkOrders.id)).all();
      res.json(wos);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.get("/api/eam/maintenance-plans", async (req, res) => {
    try {
      const plans = await db.select().from(schema.maintenancePlans).all();
      res.json(plans);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.post("/api/eam/work-orders", async (req, res) => {
    try {
      const { assetId, maintenanceType, priority, description, assignedTechnicianName, plannedStart, plannedEnd } = req.body;
      const asset = await db.select().from(schema.assets).where(eq(schema.assets.id, Number(assetId))).get();
      const code = `WO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const result = await db.insert(schema.maintenanceWorkOrders).values({
        woCode: code,
        assetId: Number(assetId) || 1,
        assetName: asset?.name || "Thiết bị máy móc",
        maintenanceType: maintenanceType || "PREVENTIVE",
        priority: priority || "NORMAL",
        description: description || "Bảo dưỡng định kỳ",
        assignedTechnicianName: assignedTechnicianName || "Kỹ thuật viên bảo trì",
        plannedStart: plannedStart || new Date().toISOString().slice(0, 16).replace("T", " "),
        plannedEnd: plannedEnd || new Date(Date.now() + 4 * 3600000).toISOString().slice(0, 16).replace("T", " "),
        status: "OPEN",
        totalCost: 0,
        downtimeHours: 2.0,
      } as any).returning();

      res.status(201).json(result[0] || { code, status: "OPEN" });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

router.post("/api/eam/work-orders/:id/complete", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { totalCost, downtimeHours } = req.body;
      await db.update(schema.maintenanceWorkOrders).set({
        status: "COMPLETED",
        totalCost: Number(totalCost) || 2500000,
        downtimeHours: Number(downtimeHours) || 3.0,
        actualEnd: new Date().toISOString().slice(0, 16).replace("T", " "),
      } as any).where(eq(schema.maintenanceWorkOrders.id, id));

      res.json({ success: true, status: "COMPLETED", message: "Đã hoàn thành phiếu bảo trì." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

export default router;
