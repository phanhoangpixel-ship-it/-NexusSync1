import { requireAuth } from "./src/middleware/auth.middleware";
import qualityRouter from "./src/routes/quality.routes";
import analyticsRouter from "./src/routes/analytics.routes";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

// Load .env if present
try {
  if (typeof (process as any).loadEnvFile === 'function' && fs.existsSync(path.join(process.cwd(), '.env'))) {
    (process as any).loadEnvFile(path.join(process.cwd(), '.env'));
  }
} catch {
  // ignore
}
if (!process.env.FEATURE_NEW_COSTING_ROLLOUT_SCOPE) {
  process.env.FEATURE_NEW_COSTING_ROLLOUT_SCOPE = "SKU:PRD-001,SKU:SKU-RAW-101,SKU:RAM-16GB-DDR5";
}
if (!process.env.FEATURE_STRICT_COSTING_VALIDATION) {
  process.env.FEATURE_STRICT_COSTING_VALIDATION = "true";
}
import { client, db, recreateDatabaseClient } from "./db/index";
import * as schema from "./db/schema";
import { bootstrapDatabase } from "./db/bootstrap";
import { WorkspaceAggregationService } from "./engines/WorkspaceAggregationService";
import { InventoryService } from "./engines/inventoryService";
import { AccountingEngineService, accountingEngine } from "./engines/accountingEngine";
import { UnifiedPipelineEngine } from "./engines/unifiedPipelineEngine";
import { BankReconciliationEngine } from "./engines/bankReconciliationEngine";
import { eq, desc, sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import coreRouter from "./src/routes/core.routes";
import authRouter from "./src/routes/auth.routes";
import workspaceRouter from "./src/routes/workspace.routes";
import masterDataRouter from "./src/routes/masterData.routes";
import inventoryRouter from "./src/routes/inventory.routes";
import salesRouter from "./src/routes/sales.routes";
import purchasesRouter from "./src/routes/purchases.routes";
import financeRouter from "./src/routes/finance.routes";
import invoicesRouter from "./src/routes/invoices.routes";
import treasuryRouter from "./src/routes/treasury.routes";
import bankRouter from "./src/routes/bank.routes";
import projectsRouter from "./src/routes/projects.routes";
import manufacturingRouter from "./src/routes/manufacturing.routes";
import supplyChainRouter from "./src/routes/supplyChain.routes";
import eamRouter from "./src/routes/eam.routes";
import hrRouter from "./src/routes/hr.routes";
import dmsRouter from "./src/routes/dms.routes";
import ehsRouter from "./src/routes/ehs.routes";
import unifiedPipelineRouter from "./src/routes/unifiedPipeline.routes";
import logisticsRouter from "./src/routes/logistics.routes";
import pricingRouter from "./src/routes/pricing.routes";
import shiftRouter from "./src/routes/shift.routes";
import { sourcingRouter } from "./src/routes/sourcing.routes";
import { crmRouter } from "./src/routes/crm.routes";
import { eventsRouter } from "./src/routes/events.routes";
import rdRouter from "./src/routes/rd.routes";
import { lotsRouter } from "./src/routes/lots.routes";
import { settingsRouter } from "./src/routes/settings.routes";
import { CostingShadowRunner } from "./engines/costingShadowRunner";
import { costingEngine } from "./engines/costingEngine";


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Bootstrap SQLite database and seeds
  try {
    await bootstrapDatabase();
  } catch (err) {
    console.error("Warning during bootstrapDatabase:", err);
  }

  // --- API ROUTES ---
  app.use("/api", requireAuth);
  app.use(coreRouter);
  app.use(authRouter);
  app.use(workspaceRouter);
  app.use(masterDataRouter);
  app.use(inventoryRouter);
  app.use(salesRouter);
  app.use(purchasesRouter);
  app.use(financeRouter);
  app.use(invoicesRouter);
  app.use(treasuryRouter);
  app.use(bankRouter);
  app.use(projectsRouter);
  app.use(manufacturingRouter);
  app.use(supplyChainRouter);
  app.use(eamRouter);
  app.use(hrRouter);
  app.use(dmsRouter);
  app.use(ehsRouter);
  app.use(unifiedPipelineRouter);
  app.use(logisticsRouter);
  app.use(analyticsRouter);
  app.use(qualityRouter);
  app.use(pricingRouter);
  app.use("/api/shift", shiftRouter);
  app.use(sourcingRouter);
  app.use(crmRouter);
  app.use(eventsRouter);
  app.use(rdRouter);
  app.use(lotsRouter);
  app.use(settingsRouter);

  // --- SHADOW RUN GOVERNANCE ENDPOINTS (M42 / Architecture Guard) ---
  app.get("/api/costing/shadow-run/status", async (req, res) => {
    try {
      const [settings] = await db.select().from(schema.costingSettings).limit(1);
      res.json({
        success: true,
        data: {
          featureFlag: "FEATURE_SHADOW_RUN_ENABLED",
          enabled: CostingShadowRunner.isShadowRunActive(),
          status: CostingShadowRunner.isShadowRunActive() ? "ACTIVE_MONITORING" : "DISABLED_AWAITING_CFO_METHOD",
          costingSettingsConfigured: !!settings,
          activeGlobalMethod: settings?.globalMethod || null,
          pendingAction: settings ? null : "Chờ xác nhận bằng văn bản từ Kế toán trưởng / CFO về phương pháp tính giá vốn chính thức (FIFO hoặc Weighted Average) trước khi seed và bật Shadow Run",
          stats: CostingShadowRunner.getShadowStats()
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/costing/shadow-run/logs", (req, res) => {
    res.json({
      success: true,
      data: {
        enabled: CostingShadowRunner.isShadowRunActive(),
        total: CostingShadowRunner.getShadowLogs().length,
        logs: CostingShadowRunner.getShadowLogs()
      }
    });
  });

  app.post("/api/costing/shadow-run/clear", (req, res) => {
    CostingShadowRunner.clearShadowLogs();
    res.json({ success: true, message: "Đã làm sạch bộ nhớ tạm Shadow Run logs" });
  });

  // --- PHASE 5: COSTING ROLLOUT STATUS & MONITORING API ---
  app.get("/api/costing/rollout-status", async (req, res) => {
    try {
      const scopeEnv = process.env.FEATURE_NEW_COSTING_ROLLOUT_SCOPE || 'NONE';
      const strictEnv = process.env.FEATURE_STRICT_COSTING_VALIDATION === 'true';
      const shadowEnv = CostingShadowRunner.isShadowRunActive();
      const config = await costingEngine.getCostingConfig();

      const allProducts = await db.select({
        id: schema.products.id,
        sku: schema.products.sku,
        name: schema.products.name,
        costPrice: schema.products.costPrice
      }).from(schema.products);

      const routingTable = allProducts.map(p => {
        const inScope = costingEngine.isTransactionInRolloutScope({ sku: p.sku, productId: p.id, warehouseId: 1 });
        return {
          productId: p.id,
          sku: p.sku,
          name: p.name,
          costPrice: p.costPrice,
          inRolloutScope: inScope,
          assignedEngine: inScope ? 'FIFO (Engine Mới - Ghi DB Thật)' : 'WEIGHTED_AVERAGE (Engine Cũ)',
          storageAuthority: inScope ? 'CostLayers (FIFO Multi-Layer)' : 'Products.costPrice (Weighted Avg)'
        };
      });

      const pilotCount = routingTable.filter(r => r.inRolloutScope).length;
      const legacyCount = routingTable.filter(r => !r.inRolloutScope).length;

      res.json({
        success: true,
        data: {
          phase: "PHASE_5_PARTIAL_ROLLOUT",
          environment: "STAGING",
          rolloutScopeEnv: scopeEnv,
          strictValidationEnabled: strictEnv,
          shadowRunEnabled: shadowEnv,
          globalMethod: config.configuredMethod,
          summary: {
            totalSKUs: allProducts.length,
            pilotScopeSKUCount: pilotCount,
            legacyEngineSKUCount: legacyCount,
            pilotSKUs: routingTable.filter(r => r.inRolloutScope).map(r => r.sku)
          },
          routingTable
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- COSTING SETTINGS AUTHORITY ENDPOINTS (M42 / Chief Accountant & CFO) ---
  app.get("/api/costing/settings", async (req, res) => {
    try {
      const config = await costingEngine.getCostingConfig();
      res.json({
        success: true,
        data: config
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/costing/settings", async (req, res) => {
    try {
      const { method, reason } = req.body;
      const user = (req as any).user || { id: 1, username: 'admin', role: 'SUPER_ADMIN' };

      // RBAC Check: Only CFO, CHIEF_ACCOUNTANT, FINANCE_ADMIN, SUPER_ADMIN
      const allowedRoles = ['CFO', 'CHIEF_ACCOUNTANT', 'FINANCE_ADMIN', 'SUPER_ADMIN', 'ADMIN'];
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: `FORBIDDEN: Quyền truy cập bị từ chối. Chỉ Kế toán trưởng, CFO hoặc Quản trị viên hệ thống mới có quyền thay đổi phương pháp tính giá vốn doanh nghiệp (Vai trò hiện tại: ${user.role}).`
        });
      }

      if (method !== 'FIFO' && method !== 'WEIGHTED_AVERAGE') {
        return res.status(400).json({
          success: false,
          error: 'BAD_REQUEST: Phương pháp tính giá vốn phải là FIFO hoặc WEIGHTED_AVERAGE.'
        });
      }

      const result = await costingEngine.updateCostingMethod({
        method,
        userId: user.id || 1,
        username: user.username || user.name || 'admin',
        userRole: user.role || 'SUPER_ADMIN',
        reason: reason || 'Kế toán trưởng phê duyệt phương pháp tính giá vốn chính thức'
      });

      res.json({
        success: true,
        message: `Đã cập nhật phương pháp tính giá vốn thành công: ${method}`,
        data: result
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });


  // Health check
  // Auth: Simulated Login & Session
  // Workspace Hub Aggregation Endpoints (Facade for M01 & UI WorkQueue)
  // Master Data: Products & Categories & UOMs
  // Warehouses & Locations
  // Inventory Core: Balances & Ledger (3-State Model Invariant Physical = Reserved + Available)
  // M10: Stock Adjustments (Using Authoritative StockAdjustmentService)
  // M09: Stocktakes
  // M11: Internal Transfers
  // M04: Sales Orders & M05: Purchase Orders
  // M03: Customers & M06: Suppliers
  // M30: Finance & General Ledger (GL) Suite
  // M31: Invoices AR/AP & VAT Management
  // Create new Invoice (AR or AP)
  // Record payment/settlement for an Invoice
  // Issue e-Invoice with Tax Authority Verification Code
  // VAT & Compliance Summary Endpoint
  // Aging Report Endpoint
  // AI OCR Automatic Vendor Invoice Processing (Gemini API Integration)
  // Automated AR Dunning Reminder & VietQR Generator
  // eTax Direct CQT Connector & VAT Declaration Mẫu 01/GTGT
  // Dynamic Early Payment Discount Engine (2/10 Net 30)
  // ==========================================
  // CENTRAL TAX / VAT ENGINE AUTHORITY & FINANCIAL BOUNDARY APIs
  // ==========================================
  // TAX ENGINE AUTHORITY - Calculate Tax for any payload
  // TAX ENGINE SUMMARY & STATUS
  // Credit Notes (AR & RMA Integration)
  // Debit Notes (AP & Purchase Return Integration)
  // Financial & Accounting Events Stream
  // ==========================================
  // MODULE M32: PAYMENTS, CASH & TREASURY MANAGEMENT
  // ==========================================
  // Get Bank Accounts & Cash Funds
  // Get Cash & Bank Vouchers (Phiếu thu / Phiếu chi)
  // Create Cash Voucher (Phiếu thu / Phiếu chi)
  // Approve Cash Voucher
  // Get Internal Transfers
  // Create Internal Transfer
  // Get Bank Statements
  // Reconcile Bank Statement Line
  // --- M33 BANK RECONCILIATION ROUTES ---
  // Get Direct Cash Flow Forecast (7, 30, 90 Days)
  // ==========================================
  // MODULE M34: FINANCIAL CONSOLIDATION ENGINE
  // ==========================================
  // List group entities
  // List intercompany elimination entries
  // Create manual elimination entry
  // Run automated consolidation & elimination
  // Consolidated Financial Reports (Side-by-side Branch Matrix)
  // Group Financial Summary KPI
  // ==========================================
  // TRANSFER PRICING & OECD PILLAR TWO MATRIX
  // Nghị định 132/2020/NĐ-CP & OECD Global Minimum Tax (15%)
  // ==========================================
  // ==========================================
  // VAS & IFRS DUAL-REPORTING BRIDGE ENGINE
  // (Cầu nối song luồng BCTC Hợp nhất VAS 25 vs IFRS 10)
  // ==========================================
  // M34: RBAC Roles & Permissions
  // M32: Audit Logs
  // ==========================================
  // M15: Manufacturing Orders & BOMs (MES / MRP)
  // ==========================================
  // ==========================================
  // M16: Supply Chain Planning & MRP (SCM)
  // ==========================================
  // ==========================================
  // M17: EAM Asset Maintenance
  // ==========================================
  // ==========================================
  // M18 / M20: HR & Payroll HRM
  // ==========================================
  // Advanced HR: ESS, Performance KPI, and L&D Training
  // ==========================================
  // M20 / M38: DMS Document Management System
  // ==========================================
  // NEW FEATURE: AI OCR Parsing Endpoint
  // NEW FEATURE: Multi-Stage Approval Sign Workflow
  // NEW FEATURE: Smart Archival & Cold Storage Tiering
  // ==========================================
  // M25 / M39: EHS Safety & Environment
  // ==========================================
  // ==========================================
  // M36: Service Desk / IT Support Ticketing
  // ==========================================
  // =========================================================================
  // UNIFIED DATA PIPELINE (LUỒNG DỮ LIỆU THỐNG NHẤT TOÀN BỘ MODULE)
  // =========================================================================
  // ==========================================
  // M35: Projects & WBS Costing (EVM Standard)
  // ==========================================
  // ==========================================
  // M36: Logistics & Fleet Management (TMS)
  // ==========================================
  // --- VETC / ePass BOT Toll Gateway & Reconciliation ---
  let initialVetcLogs = [
    { id: 1, transactionCode: 'VETC-2026-8812', provider: 'VETC', plateNumber: '29C-882.14', tollStation: 'Trạm BOT Pháp Vân - Cầu Giẽ', passTime: '2026-08-28 07:15:30', amountVND: 45000, orderCode: 'TRP-2026-101', status: 'AUTO_MATCHED', rfidTag: 'E00400018821' },
    { id: 2, transactionCode: 'EPASS-2026-9041', provider: 'ePass', plateNumber: '60C-552.19', tollStation: 'Trạm BOT Cầu Bến Thủy 1', passTime: '2026-08-28 08:40:12', amountVND: 35000, orderCode: 'TRP-2026-102', status: 'AUTO_MATCHED', rfidTag: 'E00400029910' },
    { id: 3, transactionCode: 'VETC-2026-9210', provider: 'VETC', plateNumber: '51D-992.01', tollStation: 'Trạm BOT Long Thành - Dầu Giây', passTime: '2026-08-28 09:12:00', amountVND: 78000, orderCode: 'TRP-2026-103', status: 'RECONCILED', rfidTag: 'E00400031120' },
    { id: 4, transactionCode: 'EPASS-2026-9400', provider: 'ePass', plateNumber: '29C-882.14', tollStation: 'Trạm BOT Mỹ Thuận', passTime: '2026-08-28 10:05:44', amountVND: 50000, orderCode: 'TRP-2026-104', status: 'PENDING_MATCH', rfidTag: 'E00400018821' },
  ];
  // --- Driver Safety Scorecard & Eco-Driving ---
  let driverSafetyData = [
    { driverId: 1, driverCode: 'DRV-001', fullName: 'Lê Hoàng Vũ', licenseClass: 'FC', totalKm: 1420, safetyScore: 96, tier: 'Hạng A+ (An Toàn Xuất Sắc)', ecoStars: 5, hardBrakingCount: 1, overspeedEvents: 0, rapidAccelCount: 2, idleMinutes: 18, ecoSavingsLiters: 42, safetyBonusVND: 1500000, courseRecommendation: 'Không cần (Đạt chuẩn Eco Master)' },
    { driverId: 2, driverCode: 'DRV-002', fullName: 'Phạm Minh Chính', licenseClass: 'C', totalKm: 1180, safetyScore: 88, tier: 'Hạng A (Khá)', ecoStars: 4, hardBrakingCount: 4, overspeedEvents: 2, rapidAccelCount: 5, idleMinutes: 45, ecoSavingsLiters: 25, safetyBonusVND: 800000, courseRecommendation: 'Kỹ năng phanh êm & tối ưu Nổ máy chờ' },
    { driverId: 3, driverCode: 'DRV-003', fullName: 'Trần Quốc Tuấn', licenseClass: 'FC', totalKm: 950, safetyScore: 74, tier: 'Hạng B (Trung Bình - Cần Cải Thiện)', ecoStars: 3, hardBrakingCount: 12, overspeedEvents: 6, rapidAccelCount: 11, idleMinutes: 92, ecoSavingsLiters: 8, safetyBonusVND: 0, courseRecommendation: 'Khóa Đào tạo Bổ sung Lái xe Phòng ngừa (Defensive Driving)' },
    { driverId: 4, driverCode: 'DRV-004', fullName: 'Nguyễn Văn Hùng', licenseClass: 'C', totalKm: 1310, safetyScore: 92, tier: 'Hạng A+ (An Toàn)', ecoStars: 5, hardBrakingCount: 2, overspeedEvents: 1, rapidAccelCount: 3, idleMinutes: 22, ecoSavingsLiters: 38, safetyBonusVND: 1200000, courseRecommendation: 'Duy trì phong độ Eco-Driving' },
  ];
  // --- M16: POS Shift & Cash Drawer Endpoints ---
  const fallbackEndpoints = [
    "/api/lots",
    "/api/serials",
    "/api/wms/wave-picks",
    "/api/returns",
    "/api/pos/sessions",
    
    "/api/srm/scorecards",
    "/api/quality/plans",
    "/api/events/outbox",
    "/api/reports/summary",
    "/api/commission/plans",
  ];

  for (const ep of fallbackEndpoints) {
    app.get(ep, (req, res) => {
      res.json([]);
    });
  }


  // --- GLOBAL ERROR HANDLER ---
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Global Error Handler]', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  // --- VITE / STATIC SERVING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`NexusSync ERP Server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server Error] Port ${PORT} is already in use. Please ensure previous node processes are terminated.`);
      process.exit(1);
    } else {
      console.error('[Server Error]', err);
    }
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting NexusSync ERP server:", err);
});
