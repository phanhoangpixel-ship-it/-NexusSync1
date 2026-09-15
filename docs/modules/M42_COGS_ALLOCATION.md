# M42 — Cost Allocation & COGS Engine

**Module ID:** `M42`  
**Module Name:** Cost Allocation & Cost of Goods Sold (COGS) Engine  
**Business Group:** `05. FINANCE & ACCOUNTING`  
**Workspace ID:** `WS31_COGS` | **Primary Route:** `/cogs`  
**Mounted UI Component:** `src/pages/COGS.tsx`  
**Primary API Endpoint:** `GET /api/cogs/allocations`

---

## 1. Executive Summary & Purpose
M42 is the **Sole Authority for Landed Cost Allocation and COGS Calculation**. It distributes freight, customs duties, insurance, and handling charges into inventory valuation (Moving Average, FIFO, or Standard Costing) and computes accurate Gross Profit.

## 2. Domain Authority Boundaries
- **NON-NEGOTIABLE SINGLE WRITER:** `CostingService` / Landed Cost Engine is the ONLY authority permitted to calculate inventory valuation and post COGS adjustments.
- **Prohibited:** Sales and inventory modules must never invent or hardcode unit cost figures independently.

## 3. Data Contracts & Schema
- **Database Tables:** `landed_cost_vouchers`, `cost_allocation_items`, `cogs_logs`.
- **APIs:**
  - `GET /api/cogs/allocations` — Query landed cost allocation vouchers.
  - `POST /api/cogs/allocate` — Distribute freight/duties across Goods Receipt items by value or weight.
  - `POST /api/cogs/settle-period` — Settle monthly inventory valuation and revalue COGS.

## 4. UI/UX Standards
- Allocation method selector (By Value, By Quantity, By Net Weight, By Volume).
- Unit cost comparisons (Initial PO Cost vs. Final Landed Cost) in `font-mono tabular-nums`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Add automated Landed Cost accrual clearing when actual freight invoices arrive in M31.
- [ ] Implement gross margin variance analysis report comparing standard vs. actual COGS.
