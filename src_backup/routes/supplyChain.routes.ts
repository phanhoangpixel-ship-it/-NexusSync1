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

router.get("/api/supply-chain/plans", async (req, res) => {
    try {
      const plans = await db.select().from(schema.supplyPlans).orderBy(desc(schema.supplyPlans.id)).all();
      res.json(plans);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.get("/api/supply-chain/forecasts", async (req, res) => {
    try {
      const forecasts = await db.select().from(schema.demandForecasts).all();
      res.json(forecasts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

router.post("/api/supply-chain/calculate-mrp", async (req, res) => {
    try {
      const products = await db.select().from(schema.products).all();
      const balances = await db.select().from(schema.stockBalances).all();
      const plans = [];

      for (const p of products) {
        const pBal = balances.filter((b) => b.productId === p.id);
        const phys = pBal.reduce((acc, b) => acc + (b.stockPhysical || 0), 0);
        const resv = pBal.reduce((acc, b) => acc + (b.stockReserved || 0), 0);
        const avail = phys - resv;
        const reorderPoint = p.reorderPoint || 20;
        const safety = p.safetyStock || 10;
        const forecast = Math.round(safety * 2.5);
        const netReq = Math.max(0, forecast + safety - (avail + 10));

        plans.push({
          planCode: `PLN-2026-${Math.floor(100 + Math.random() * 900)}`,
          productId: p.id,
          productName: p.name,
          warehouseId: 1,
          currentStock: phys,
          reservedStock: resv,
          incomingPoQty: p.productType === "RAW_MATERIAL" ? 20 : 0,
          incomingMoQty: p.productType === "FINISHED_GOOD" ? 15 : 0,
          forecastDemand: forecast,
          netRequirement: netReq,
          reorderPoint,
          safetyStock: safety,
          recommendedPurchaseQty: p.productType === "RAW_MATERIAL" ? (netReq > 0 ? netReq + p.reorderQty : 0) : 0,
          recommendedProductionQty: p.productType === "FINISHED_GOOD" ? (netReq > 0 ? netReq + 10 : 0) : 0,
          status: "DRAFT",
        });
      }

      res.json({
        success: true,
        message: `Đã chạy thuật toán MRP tính toán cho ${products.length} danh mục sản phẩm.`,
        plans,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

export default router;
