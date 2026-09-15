# M07 — Enterprise Master Data (Items & Customers)

**Module ID:** `M07`  
**Module Name:** Enterprise Master Data (Items, Customers & UOM)  
**Business Group:** `01. COMMERCIAL & SALES`  
**Workspace ID:** `WS02_CRM` | **Primary Route:** `/customers` (and Item Catalog `/inventory`)  
**Mounted UI Component:** `src/pages/Customers.tsx`, `src/pages/Inventory.tsx`  
**Primary API Endpoint:** `GET /api/customers`, `GET /api/products`

---

## 1. Executive Summary & Purpose
M07 is the foundational Master Data registry for NexusSync ERP under Architecture Rule #02 (Reuse Before Create). It maintains product SKUs, UOM conversions, category trees, and B2B customer profiles with credit terms.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Sole authority for canonical product definitions, barcode assignments, UOM conversion ratios, and customer credit limits.
- **Strict Invariant:** No other module is permitted to create parallel item or customer tables.

## 3. Data Contracts & APIs
- **Database Tables:** `products`, `categories`, `product_uoms`, `customers`, `customer_contacts`.
- **APIs:**
  - `GET /api/products` — Catalog query with category/warehouse filters.
  - `GET /api/customers` — B2B customer directory.
  - `POST /api/uom/convert` — Universal UOM conversion calculation.

## 4. UI/UX Standards
- SKU code, Barcode, Tax Code, and Credit Limit rendered in `font-mono tabular-nums`.
- Status badges following semantic colors (Active = emerald, Credit Hold = amber, Inactive = slate).

## 5. Feature Upgrade Readiness Checklist
- [ ] Add multi-tiered customer credit assessment workflows.
- [ ] Add bulk CSV import/export with duplicate SKU validation.
