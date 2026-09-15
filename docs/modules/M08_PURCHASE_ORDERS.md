# M08 — Purchase Orders (P2P Procurement)

**Module ID:** `M08`  
**Module Name:** Purchase Orders & Procure-to-Pay (P2P)  
**Business Group:** `02. PROCUREMENT & SRM`  
**Workspace ID:** `WS04_PURCHASE` | **Primary Route:** `/purchase`  
**Mounted UI Component:** `src/pages/Purchase.tsx`  
**Primary API Endpoint:** `GET /api/purchase/orders`

---

## 1. Executive Summary & Purpose
M08 manages the full Procure-to-Pay lifecycle: Purchase Requisitions, Purchase Orders (PO), multi-tier approval workflows, Goods Receipt processing, and 3-Way Matching with vendor invoices.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Authoritative for PO commitments, vendor purchase contracts, and delivery schedules.
- **Inventory Handover:** Material receipts MUST call `InventoryService.postTransaction()` (M17) to increment stock.
- **Accounting Handover:** Invoiced POs route matching entries to M30/M31.

## 3. Data Contracts & Schema
- **Database Tables:** `purchase_orders`, `purchase_order_lines`, `goods_receipts`.
- **APIs:**
  - `GET /api/purchase/orders` — List POs with status filters.
  - `POST /api/purchase/orders` — Create PO.
  - `POST /api/purchase/orders/:id/approve` — Approve PO.
  - `POST /api/purchase/orders/:id/receive` — Receive goods into inventory (via M17).

## 4. UI/UX Standards
- 3-Way matching indicator badges (Matched = emerald, Price Discrepancy = rose, Quantity Discrepancy = amber).
- Financial totals, unit costs, and tax amounts in `font-mono tabular-nums`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Add automated Landed Cost integration hook with M42 on Goods Receipt.
- [ ] Support blanket purchase orders with periodic drawdowns.
