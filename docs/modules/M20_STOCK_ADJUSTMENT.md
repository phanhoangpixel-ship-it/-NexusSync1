# M20 — Stock Adjustment & Discrepancy Governance

**Module ID:** `M20`  
**Module Name:** Stock Adjustment & Variance Resolution  
**Business Group:** `03. WAREHOUSE & LOGISTICS`  
**Workspace ID:** `WS08_ADJUSTMENT` | **Primary Route:** `/stock-adjustment`  
**Mounted UI Component:** `src/pages/StockAdjustment.tsx`  
**Primary API Endpoint:** `GET /api/stock-adjustments`

---

## 1. Executive Summary & Purpose
M20 provides governance over inventory write-offs, damages, scrap, and surplus gains. Every adjustment requires mandatory reason codes, managerial approval, and dual audit trails.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Adjustment voucher approval lifecycle and variance reason categorization.
- **Inventory Handover:** Adjustment posting calls `InventoryService.postTransaction()` with type `ADJUSTMENT_IN` / `ADJUSTMENT_OUT`.
- **Accounting Handover:** Routes variance value to GL (M30) (VAS 156/632/811) via `AccountingEngineService`.
- **Costing & Landed Cost:** Evaluated via `CostingEngine` (M42).

## 3. Data Contracts & APIs
- **Database Tables:** `stock_adjustments`, `stock_adjustment_items`, `adjustment_reasons`.
- **APIs:**
  - `GET /api/stock-adjustments` — List adjustment vouchers.
  - `POST /api/stock-adjustments` — Draft adjustment.
  - `POST /api/stock-adjustments/:id/approve` — Approve and post transaction with concurrency control & DMS verification.
  - `GET /api/stock-adjustments/:id/print` — Ministry of Finance Form 02-VT Print Template.
  - `GET /api/stocktakes/:id` — Reverse Link for Stocktake origin.

## 4. UI/UX Standards (Rule #19 & #20)
- Mandatory approval confirmation modal (`ConfirmDialog.tsx`) indicating financial impact.
- Quantity changes and unit costs in `font-mono tabular-nums`.
- WCAG AA contrast compliance and multi-tab Detail Drawer.

## 5. Completed Enterprise Upgrade Checklist (Phase 1-11)
- [x] Multi-tier approval thresholds (>50,000,000 VND).
- [x] DMS Secure Vault Evidence validation (`evidenceDocId`) for Damaged/Expired/Loss types.
- [x] Frequency anomaly flagging (`flaggedForReview`) and M29 notification dispatch.
- [x] Stocktake reverse linkage (`sourceType=STOCKTAKE`).
- [x] Ministry of Finance Form 02-VT Export (`/api/stock-adjustments/:id/print`).
- [x] Centralized SHA-256 Audit Trail via `AuditService`.
- [x] Concurrent idempotency protection (`ALREADY_PROCESSED`).

