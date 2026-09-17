# M08 — Purchase Orders (P2P Procurement)

**Module ID:** `M08`  
**Module Name:** Purchase Orders & Procure-to-Pay (P2P)  
**Business Group:** `02. PROCUREMENT & SRM`  
**Workspace ID:** `WS04_PURCHASE` | **Primary Route:** `/purchase`  
**Mounted UI Component:** `src/pages/Purchase.tsx` (`src/modules/purchase/m08-purchase-orders/components/M08PurchaseOrdersWorkspace.tsx`)  
**Primary API Endpoint:** `GET /api/purchase-orders`

---

## 1. Executive Summary & Purpose
M08 manages the enterprise Procure-to-Pay (P2P) lifecycle: Purchase Orders (PO), multi-tier financial approval workflows, Cost Center budget verification, Goods Receipt (GR) processing with Single-Writer inventory delegation, 3-Way Matching (PO ↔ GR ↔ AP Invoice), Framework BPA Contracts, and tamper-evident SHA-256 audit logging.

## 2. Domain Authority Boundaries & Invariants
- **Exclusive Authority:** Authoritative for PO commitments, purchase lines, vendor purchase contracts, and delivery schedules.
- **Single-Writer Inventory Invariant:** Goods Receipt MUST delegate physical stock balance updates and movement logging exclusively to `InventoryService.postTransaction()` (M17 SSOT). PO creation/approval never alters stock balances.
- **Accounting & Budget Handover:** Cost Center budgets are locked and committed via M30. AP invoice matching reconciles against M31.
- **Central Cryptographic Audit:** All lifecycle transitions are logged to `AuditService.recordAuditLog()` (M02).

## 3. Data Contracts & Schema
- **Database Tables:** `purchase_orders`, `purchase_order_items`, `goods_receipts`, `goods_receipt_items`, `bpa_contracts`, `cost_centers`, `outbox_events`, `audit_logs`.
- **Primary REST APIs:**
  - `GET /api/purchase-orders` — Enriched list of POs with line items, supplier, matching status, and M28 matrix.
  - `GET /api/purchase-orders/:id` — Detailed PO with lines, warehouse, GR history, and 3-way match data.
  - `GET /api/purchase-orders/:id/items` — Line items breakdown (ordered, received, remaining quantities).
  - `POST /api/purchase-orders` — Create PO with Idempotency Key, M30 Budget Guard, and M28 approval evaluation.
  - `POST /api/purchase-orders/:id/submit-approval` — Submit PO for approval.
  - `POST /api/purchase-orders/:id/approve` — Approve PO & commit budget.
  - `POST /api/purchase-orders/:id/reject` — Reject/cancel PO with audit justification.
  - `GET /api/goods-receipts` — List inbound receipts.
  - `POST /api/goods-receipts` — Inbound Goods Receipt via `InventoryService.postTransaction()` (M17).
  - `GET /api/purchase/matching-cases` — 3-Way Matching comparison engine.
  - `POST /api/purchase/matching-cases/:id/resolve` — Resolve matching discrepancy.
  - `GET /api/purchase/contracts` & `POST /api/purchase/contracts` — Long-term Framework BPA Contracts.

## 4. UI/UX Standards & Enterprise Compliance (Rule #19 & #20)
- **Destructive & High-Risk Guard:** Protected 100% of sensitive operations (Approve, Reject, Goods Receipt, Discrepancy Resolution) with `ConfirmDialog.tsx`. Zero `window.confirm/alert`.
- **Numeric & Financial Formatting:** All monetary sums, unit prices, tax rates, SKU codes, and quantities formatted in `font-mono tabular-nums text-right`.
- **Semantic Status Badges:** Emerald (Approved, Matched, Active), Amber (Pending, Recount, Under Review), Rose (Rejected, Mismatch, Cancelled), Blue (Partial, In Transit).
- **Accessibility & Contrast:** Fully WCAG AA compliant with structured responsive tables and slide-over detail drawers.

## 5. Feature Verification Status (13/13 PASS)
- [x] M08-F01: Purchase Order Creation & Validation
- [x] M08-F02: Multi-tier Approval Matrix Evaluation (M28)
- [x] M08-F03: Submit PO for Approval Workflow
- [x] M08-F04: Authoritative PO Approval & Budget Commitment
- [x] M08-F05: Reject / Cancel PO with Justification
- [x] M08-F06: Cost Center Budget Guard (M30)
- [x] M08-F07: Goods Receipt Inbound Posting via `InventoryService.postTransaction()` (M17)
- [x] M08-F08: Multi-UOM Conversion Guard (M07 SSOT)
- [x] M08-F09: Partial & Over-Receipt Guard
- [x] M08-F10: Automated 3-Way Matching Engine (PO ↔ GR ↔ AP Invoice)
- [x] M08-F11: Discrepancy Resolution & Exception Approval
- [x] M08-F12: Framework BPA Contracts & Long-term Price Locks
- [x] M08-F13: Centralized SHA-256 Audit Log Recording (M02)

