# M17 — Master WMS & Core Inventory

**Module ID:** `M17`  
**Module Name:** Master WMS & Core Inventory  
**Business Group:** `03. WAREHOUSE & LOGISTICS`  
**Workspace ID:** `WS05_MASTER_WMS` | **Primary Route:** `/inventory`  
**Mounted UI Component:** `src/pages/Inventory.tsx`  
**Primary API Endpoint:** `GET /api/inventory/balances`

---

## 1. Executive Summary & Purpose
M17 is the core operational inventory engine of NexusSync ERP and the **Sole Writer for enterprise physical inventory**. It maintains strict 3-state stock tracking across all warehouses: `On Hand`, `Allocated` (Reserved), and `Available` (`Available = On Hand - Allocated`).

## 2. Domain Authority Boundaries
- **NON-NEGOTIABLE SINGLE WRITER:** `InventoryService.postTransaction()` is the ONLY method permitted to mutate inventory stock balances in the entire ERP.
- **Prohibited:** No module (Sales, POS, Purchase, Manufacturing, Adjustments) may execute direct SQL updates or mutations on inventory balances. All must call `InventoryService.postTransaction()`.

## 3. Data Contracts & Schema
- **Database Tables:** `inventory_balances`, `inventory_transactions`, `warehouses`.
- **Core Invariant:** `Available = On_Hand - Allocated` (MUST never be negative without explicit negative inventory override authorization).
- **APIs:**
  - `GET /api/inventory/balances` — Query stock balances by warehouse and product.
  - `POST /api/inventory/transactions` — Internal interface for `postTransaction()`.
  - `GET /api/inventory/ledger` — Material movement audit trail.

## 4. UI/UX Standards
- 3-state balance pills rendered in `font-mono tabular-nums`.
- Low-stock and stockout threshold alerts with clear color contrast.

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement reorder point automatic purchase requisition triggers.
- [ ] Add cross-warehouse stock consolidation drill-down view.
