# M13 — Sales Orders (O2C Commercial Core)

**Module ID:** `M13`  
**Module Name:** Sales Orders & Order-to-Cash (O2C)  
**Business Group:** `01. COMMERCIAL & SALES`  
**Workspace ID:** `WS03_SALES` | **Primary Route:** `/sales`  
**Mounted UI Component:** `src/pages/SalesOrders.tsx`  
**Primary API Endpoint:** `GET /api/sales/orders`

---

## 1. Executive Summary & Purpose
M13 is the central commercial engine for B2B wholesale orders. It handles customer quotations, sales order confirmation, stock reservation (Allocated Quantity), credit validation, and order fulfillment tracking.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Authoritative for Sales Orders, confirmed delivery dates, and commercial terms.
- **Inventory Handover:** Stock allocation and dispatch MUST be posted via `InventoryService.postTransaction()` (M17).
- **Pricing Handover:** Unit prices must be resolved exclusively via `PricingService` (M41).

## 3. Data Contracts & Schema
- **Database Tables:** `sales_orders`, `sales_order_items`.
- **APIs:**
  - `GET /api/sales/orders` — Query sales orders.
  - `POST /api/sales/orders` — Create sales order.
  - `POST /api/sales/orders/:id/confirm` — Confirms order and triggers inventory allocation.

## 4. UI/UX Standards
- Order status badges (Draft = slate, Confirmed = blue, Allocated = purple, Delivered = emerald, Cancelled = rose).
- Order values, discounts, and VAT in `font-mono tabular-nums`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Add automated back-order generation when ordered quantity exceeds available inventory.
- [ ] Add direct integration with M36 (Logistics) for automated shipping manifest creation.
