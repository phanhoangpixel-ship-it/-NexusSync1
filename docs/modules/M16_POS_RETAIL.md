# M16 — Retail Point of Sale (POS) & Counter

**Module ID:** `M16`  
**Module Name:** Retail Point of Sale (POS) & Counter Operations  
**Business Group:** `01. COMMERCIAL & SALES`  
**Workspace ID:** `WS23_POS` | **Primary Route:** `/pos`  
**Mounted UI Component:** `src/pages/POS.tsx`  
**Primary API Endpoint:** `GET /api/shift/active`

---

## 1. Executive Summary & Purpose
M16 is the high-velocity retail cashier terminal designed for barcode scanning, touch quick-pick grid, cashier shift opening/closing, cash drawer balancing, receipt printing, and instant retail billing.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Cashier shift lifecycle, cash drawer counts, and counter payment tenders.
- **Inventory Handover:** Stock depletion occurs immediately upon sale completion via `InventoryService.postTransaction()` (M17).
- **Accounting Handover:** Shift closure generates daily retail summary journals to M30 and cash receipts to M32.

## 3. Data Contracts & APIs
- **Database Tables:** `pos_shifts`, `pos_sales`, `pos_sale_items`, `cash_drawer_logs`.
- **APIs:**
  - `GET /api/shift/active` — Current open cashier shift status.
  - `POST /api/shift/open` — Open shift with initial cash float.
  - `POST /api/pos/checkout` — Complete sale with cash/card/QR tender.
  - `POST /api/shift/close` — Close shift with variance reconciliation.

## 4. UI/UX Standards
- Full-screen cashier-friendly layout with large touch targets (min 44px).
- Numpad, product search, and payment tender modal with cash change calculator in `font-mono`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Add offline sale caching with automatic sync upon network recovery.
- [ ] Support customer loyalty card points earning and redemption.
