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
- **Inventory Handover:** Adjustment posting calls `InventoryService.postTransaction()` with type `ADJUSTMENT`.
- **Accounting Handover:** Routes variance value to GL (M30) (VAS 156/632/811).

## 3. Data Contracts & APIs
- **Database Tables:** `stock_adjustments`, `stock_adjustment_items`, `adjustment_reasons`.
- **APIs:**
  - `GET /api/stock-adjustments` — List adjustment vouchers.
  - `POST /api/stock-adjustments` — Draft adjustment.
  - `POST /api/stock-adjustments/:id/approve` — Approve and post transaction.

## 4. UI/UX Standards
- Mandatory approval confirmation modal (`ConfirmDialog.tsx`) indicating financial impact.
- Quantity changes and unit costs in `font-mono tabular-nums`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement multi-tier approval limits (e.g. adjustments > $1,000 require CFO sign-off).
- [ ] Add photo attachment capability for damaged goods evidence.
