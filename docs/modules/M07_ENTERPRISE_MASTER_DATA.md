# M07 — Enterprise Master Data (Items, Customers & UOM)

**Module ID:** `M07`  
**Module Name:** Enterprise Master Data (Items, Customers & Multi-UOM)  
**Business Group:** `01. COMMERCIAL & SALES`  
**Workspace ID:** `WS02_CRM` | **Primary Route:** `/customers` (and Item Catalog `/inventory`)  
**Mounted UI Component:** `/src/modules/master-data/m07-customers-item-master/components/M07CustomersItemMasterWorkspace.tsx`  
**Primary API Endpoints:** `GET /api/customers`, `GET /api/products`, `POST /api/uom/convert`, `GET /api/categories`  
**Status:** `ACCEPTANCE SEAL: SIGNED & COMPLETED`  
**Master Document:** `/docs/design-specs/M07_ARCHITECTURE_POST_SYNC.md`  

---

## 1. Executive Summary & Purpose
M07 is the foundational Master Data registry and Single Source of Truth (SSOT) for NexusSync ERP under Architecture Rule #01 (Architecture First) and Rule #02 (Reuse Before Create). It maintains product SKUs, multi-level UOM hierarchy conversions, packaging specifications, category trees, and B2B customer profiles with credit terms and multi-address management.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Sole authority for canonical product definitions, barcode assignments, UOM conversion ratios, packaging specifications, and customer credit limit registration.
- **Strict Invariant:** No other module is permitted to create parallel item or customer tables.
- **Downstream Consumer Modules:**
  - `M41` (Pricing Engine): References M07 SKU and customer tiers to compute commercial discounts.
  - `M17` (Inventory): References M07 SKU and physical attributes for bin locations, lots, and stock valuation.
  - `M13` (Sales O2C): References M07 SKU and customer profiles for sales order issuance and credit checks.
  - `M08` (Purchasing P2P): References M07 SKU and UOMs for vendor PO issuance.

## 3. Data Contracts & Database Schema
- **Database Tables:**
  - `products`: SKU, canonical name, barcode, category reference, product type, base unit, purchase/sales unit, cost/wholesale/retail prices, lifecycle status (`ACTIVE`, `ARCHIVED`, `DRAFT`, `DISCONTINUED`), physical packaging specs.
  - `product_uoms`: Multi-level conversion hierarchy, `parentUomId`, `conversionFactor`, barcode per UOM, tier price override.
  - `categories`: Hierarchical category tree (`parentCategoryId`), code, name, description.
  - `customers`: B2B legal profile, `taxCode`, legal name, registered address, representative, credit limit, payment terms, pricing tier assignment (`Tier 1/2/3`).
  - `customer_addresses`: Multi Ship-to and Bill-to locations with default flags.
  - `customer_contacts`: Key contacts, roles, billing email, portal access provisioning.
  - `audit_logs`: Immutable audit trails for all sensitive modifications via M02.

## 4. Key APIs
- `GET /api/products` — Catalog query with category, warehouse, and status filters.
- `GET /api/products/:id` — Full product detail, UOM hierarchy, and packaging specifications.
- `POST /api/products` — Register new SKU with unique SKU/barcode validation and atomic UOM insertion.
- `PUT /api/products/:id` — Update product details, physical attributes, and imagery.
- `PATCH /api/products/:id/archive` — Lifecycle transition (`ACTIVE` <-> `ARCHIVED`).
- `DELETE /api/products/:id` — Delete unreferenced SKU (enforces FK Reference Guard against ledger/orders).
- `POST /api/uom/convert` — Universal UOM conversion calculation preserving backwards compatibility.
- `GET /api/customers` — B2B customer directory with credit limit and AR balances.
- `POST /api/customers` — Register B2B account with tax code validation.
- `PUT /api/customers/:id` — Update legal profile, address directory, and payment terms.
- `GET /api/customers/:id/credit` — Centralized credit check and risk verification.

## 5. UI/UX Standards & Enterprise Compliance
- **Rule #19 Compliance:** Strict use of `/src/components/common/ConfirmDialog.tsx` for dangerous actions (delete, archive). Zero browser alerts.
- **Typography & Formatting:** SKU code, Barcode, Tax Code, Stock Quantities, and Credit Limits rendered in `font-mono tabular-nums`.
- **Status Badges:** Semantic status palette (Active = emerald, Credit Hold / Alert = amber, Discontinued / Archived = slate, Risk Overdue = rose).
- **Rule #20 Compliance:** 5-layer enterprise workspace shell (L0 Banner, L1 Tabs, L2 KPIs, L3 Data Views, L4 Pagination/Drawers).

## 6. Feature Upgrade Readiness Checklist
- [x] Multi-level UOM hierarchy (`parentUomId`, `conversionFactor`) with non-breaking `POST /api/uom/convert`.
- [x] Packaging specifications (dimensions, weights, packaging materials) for WMS M18/M19.
- [x] Unique barcodes across all UOM levels and items.
- [x] Multi-level category hierarchy (`parentCategoryId`).
- [x] Complete item lifecycle statuses (`DRAFT`, `ACTIVE`, `ARCHIVED`, `DISCONTINUED`).
- [x] Comprehensive B2B legal profiles (tax code, legal name, registered address, representative).
- [x] Multi Ship-to and Bill-to address management.
- [x] Multi-tiered customer credit assessment and usage tracking with automatic order lock.
- [x] Payment terms (Net 15/30/60) with automated invoice due dates.
- [x] Customer pricing tier assignment referencing M41.
- [x] Customer portal access credentials and contact directory.
- [x] Bulk Excel/CSV import/export with validation preview and duplicate detection.
- [x] DMS integration for item quality certs (CO/CQ/MSDS) and customer business licenses.
- [x] Global search with 250ms debouncing.
- [x] Duplicate prevention guards for SKU, barcode, and tax code.
- [x] Foreign Key Reference Guard preventing hard deletion of referenced records.
- [x] Immutable audit trail integration via M02.
- [x] Credit limit increase approval workflow integration via M28.
