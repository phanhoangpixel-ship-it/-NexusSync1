# Master ERP — Authoritative Module Map & Enterprise Domain Architecture

**Document Classification:** OFFICIAL ENTERPRISE ARCHITECTURAL BASELINE  
**Status:** [PHASE 2 CONSOLIDATION & GOVERNANCE CERTIFICATION — COMPLETE & CERTIFIED]  
**Baseline Date:** September 27, 2026  
**Governance Scope:** Certified Architecture Mapping (Modules M01–M43 & Workspaces WS01–WS32)

---

## 1. Executive Architecture Scope & Classification

This document constitutes the authoritative, evidence-grounded catalog and mapping of all **43 enterprise ERP modules (M01–M43)** and **32 functional workspaces (WS01–WS32)** within NexusSync ERP. Every entry is derived directly from source code inspection (`src/App.tsx`, `src/config/moduleRegistry.ts`, `src/components/shell/DomainWorkspaceShell.tsx`, `src/types.ts`, `server.ts`, `server/orchestrationApi.ts`, `src/db/schema.ts`) and certified governance baselines (`/docs/AI/GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`).

### Enterprise Domain Classification Summary (8 Business Groups)

| Group Code | Business Group Description | Module Count | Included Module IDs | Primary Workspaces |
| :--- | :--- | :---: | :--- | :--- |
| **00. CORE HUB** | Master Orchestration, Application Shell & SLA WorkQueue | 1 | M01 | WS01_HUB |
| **01. COMMERCIAL, SALES & MASTER DATA** | Commercial Core, B2B O2C, Retail POS, Pricing, RMA & Industry Profiles | 8 | M07, M12, M13, M14, M15, M16, M41, M43 | WS02, WS03, WS22, WS23, WS30, WS32 |
| **02. PROCUREMENT & SRM** | Procure-to-Pay (P2P), Sourcing RFQ & Supplier Scorecards | 4 | M08, M09, M10, M11 | WS04_PURCHASE, WS24_SOURCING, WS25_SRM |
| **03. WAREHOUSE & LOGISTICS** | Master WMS, Stock Ledger, Count, Adjust, Lots, Serials & TMS | 9 | M17, M18, M19, M20, M21, M22, M23, M24, M36 | WS05, WS06, WS07, WS08, WS09, WS10, WS11, WS12, WS17 |
| **04. MANUFACTURING & OPS** | MES Execution, BOM, MRP Netting, R&D, EAM, HR & Projects | 7 | M06, M25, M26, M27, M28, M35 | WS23_RD, WS13, WS14, WS15, WS16, WS18 |
| **05. FINANCE & ACCOUNTING** | General Ledger (VAS), Invoices, Payments, Bank Recon & COGS | 6 | M30, M31, M32, M33, M34, M42 | WS18, WS19, WS20, WS21, WS31 |
| **06. GOVERNANCE & SYSTEM** | Audit Trail, System Config, SuperAdmin RBAC, EventBus, QMS, EHS | 9 | M02, M03, M04, M05, M29, M37, M38, M39, M40 | WS01, WS26, WS27, WS28, WS29 |

---

## 2. The 4 Single-Writer Domain Authorities (Non-Negotiable Invariants)

1. **Inventory Authority (`InventoryService.postTransaction()` - Module M17)**:
   - Sole authority permitted to mutate physical, allocated, and available stock balances.
   - All sales (M13), POS (M16), purchase receipts (M08), adjustments (M20), transfers (M21), and manufacturing orders (M25) MUST route mutations through this single writer.
2. **Accounting Authority (`AccountingService` / General Ledger - Module M30)**:
   - Sole authority permitted to post double-entry journal entries (VAS chart of accounts).
   - Invoices (M31), Payments (M32), Bank Reconciliation (M33), and Landed Cost (M42) MUST route journal postings through M30.
3. **Pricing Authority (`PricingEngine` / Price Resolution Service - Module M41)**:
   - Sole authority for selling prices, margin checks, tiered quantity price breaks, and commercial discounts.
   - Sales Orders (M13) and POS (M16) resolve selling prices exclusively from M41.
4. **Costing & Allocation Authority (`CostingService` / Landed Cost Engine - Module M42)**:
   - Sole authority for inventory cost valuation layers (FIFO, Moving Average), Activity-Based Costing (ABC) pools, and COGS calculation.

---

## 3. Directory of 32 Certified Workspaces (WS01 – WS32)

| Workspace ID | Workspace Name | Business Group | Primary Module | Default Route |
| :--- | :--- | :--- | :---: | :--- |
| `WS01_HUB` | Workspace Hub & Điều phối | CORE | M01 | `/workspace` |
| `WS02_CRM` | CRM & Bán hàng tiềm năng | COMMERCIAL | M12 | `/crm` |
| `WS03_SALES` | Đơn hàng B2B & O2C | COMMERCIAL | M13 | `/sales` |
| `WS04_PURCHASE` | Mua sắm & Chuỗi P2P | PROCUREMENT | M08 | `/purchase` |
| `WS05_MASTER_WMS`| Trung Tâm Vận Hành Kho & Master WMS | WAREHOUSE | M17 | `/inventory` |
| `WS06_WAREHOUSE` | Vị trí Bin/Rack & Vận hành | WAREHOUSE | M18 | `/warehouse` |
| `WS07_STOCKTAKE` | Kiểm kê định kỳ & Blind Count | WAREHOUSE | M19 | `/stocktake` |
| `WS08_ADJUSTMENT`| Điều chỉnh & Xử lý chênh lệch | WAREHOUSE | M20 | `/stock-adjustment` |
| `WS09_TRANSFER` | Chuyển kho nội bộ & In-transit | WAREHOUSE | M21 | `/transfer` |
| `WS10_LOTS` | Quản lý Lô SX & FEFO | WAREHOUSE | M22 | `/lots` |
| `WS11_SERIALS` | Mã Serial & IMEI | WAREHOUSE | M23 | `/serials` |
| `WS12_WMS_EXT` | WMS Mở rộng & Wave Picking | WAREHOUSE | M24 | `/wms-extended` |
| `WS13_MES` | Sản xuất MES & Định mức BOM | MANUFACTURING | M25 | `/manufacturing` |
| `WS14_SCM` | Kế hoạch cung ứng MRP & SCM | MANUFACTURING | M26 | `/supply-chain` |
| `WS15_EAM` | Quản lý thiết bị & Bảo trì EAM | MAINTENANCE | M27 | `/eam` |
| `WS16_PROJECTS` | Dự án, WBS & Chi phí | PROJECTS | M35 | `/projects` |
| `WS17_LOGISTICS`| Điều vận Logistics & Fleet | LOGISTICS | M36 | `/logistics` |
| `WS18_FINANCE` | Sổ cái tổng hợp & Tài chính GL | FINANCE | M30 | `/finance` |
| `WS19_INVOICES` | Hóa đơn AR / AP & Thuế | FINANCE | M31 | `/invoices` |
| `WS20_PAYMENTS` | Quỹ tiền mặt & Thu chi | FINANCE | M32 | `/payments` |
| `WS21_BANK` | Đối soát ngân hàng & VietQR | FINANCE | M33 | `/bank-reconciliation` |
| `WS22_RMA` | Đổi trả hàng & Quản lý RMA | COMMERCIAL | M15 | `/returns` |
| `WS23_POS` | Quầy bán lẻ & Thu ngân POS | COMMERCIAL | M16 | `/pos` |
| `WS24_SOURCING` | Đấu thầu mua hàng & RFQ | PROCUREMENT | M10 | `/strategic-sourcing` |
| `WS25_SRM` | Đánh giá nhà cung cấp SRM | PROCUREMENT | M11 | `/srm` |
| `WS26_SERVICEDESK`| Hỗ trợ kỹ thuật IT Desk & EventBus | GOVERNANCE | M38 | `/issue` |
| `WS27_QUALITY` | Kiểm soát chất lượng QMS | GOVERNANCE | M39 | `/quality` |
| `WS28_DMS` | Số hóa tài liệu & Chứng từ DMS | GOVERNANCE | M29 | `/dms` |
| `WS29_EHS` | An toàn lao động & Môi trường EHS | GOVERNANCE | M40 | `/ehs` |
| `WS30_PRICING` | Cơ cấu Giá & Chính sách Thương mại | COMMERCIAL | M41 | `/pricing-management` |
| `WS31_COGS` | Phân bổ Chi phí & Giá vốn COGS | FINANCE | M42 | `/cogs` |
| `WS32_INDUSTRY` | Hồ Sơ Ngành Hàng (Industry Profiles) | MASTER_DATA | M43 | `/industry-profiles` |

---

## 4. Master 43-Module Specification (M01 – M43)

### M01: Workspace Hub & Global Orchestration
- **Module ID:** `M01`
- **Group:** 00. Core Hub (Trung Tâm Điều Phối)
- **Workspace:** `WS01_HUB` | **Route:** `/workspace`
- **Mounted Component:** `src/modules/admin/m01-workspace-hub/components/WorkspaceHub.tsx`
- **Domain Authority:** Read-Only Aggregator & Gateway Dispatcher. **NOT** a Single-Writer Domain Authority. M01 does not own business entities; all operational mutations are delegated to authoritative domain services (M08, M20, M38, M16, etc.) with unique `idempotencyKey` and SHA-256 audit logs (M02).
- **Read API:** `GET /api/workspace/summary`, `GET /api/workspace/work-items`, `GET /api/workspace/entity-preview`, `GET /api/workspace/process-chains`, `GET /api/workspace/observability/health`, `GET /api/workspace/observability/topology`, `GET /api/workspace/observability/spans`, `GET /api/workspace/observability/rca/:id`, `GET /api/workspace/observability/trends`, `GET /api/workspace/observability/forecast`
- **Write API:** `POST /api/workspace/work-items/:id/action`, `POST /api/workspace/work-items/bulk-action`, `POST /api/workspace/observability/sync`, `POST /api/workspace/observability/remediate/:id`
- **Cross-Module Integrations:** Aggregates read models from M08 (PO), M20 (Stock Adjustments), M38 (ServiceDesk Tickets), M16 (POS/Sales Orders), M31 (Invoices), M02 (Audit SHA-256 logs), M29 (DMS attachments), M05 (EventBus), and `moduleRegistry.ts`.


### M02: Audit Compliance & SHA-256 Chain
- **Module ID:** `M02`
- **Group:** 06. Quản Trị & Hệ Thống
- **Workspace:** `WS28_DMS` | **Route:** `/audit`
- **Mounted Component:** `src/modules/governance/m02-audit/components/AuditComplianceWorkspace.tsx`
- **Domain Authority:** Exclusive Single-Writer (`AuditService.recordAuditLog` / `AuditService.captureAsync`) for Immutable Audit Records with SHA-256 Cryptographic Hash Chaining.
- **Read API:** `GET /api/audit/logs`, `GET /api/audit/verify-chain`, `POST /api/audit/verify-chain`

### M03: System Settings & Parameters
- **Module ID:** `M03`
- **Group:** 06. Quản Trị & Hệ Thống
- **Workspace:** `WS01_HUB` | **Route:** `/system-settings`
- **Mounted Component:** `src/pages/SystemSettings.tsx`
- **Domain Authority:** Global System Configuration, Currency exchange rates, numbering sequences.
- **Read API:** `GET /api/settings`

### M04: SuperAdmin Portal & RBAC Matrix
- **Module ID:** `M04`
- **Group:** 06. Quản Trị & Hệ Thống
- **Workspace:** `WS01_HUB` | **Route:** `/super-admin`
- **Mounted Component:** `src/pages/SuperAdminPortal.tsx`
- **Domain Authority:** Exclusive Authority for User Provisioning, Role Assignments, and Fine-Grained Permissions.
- **Read API:** `GET /api/rbac/roles`

### M05: EventBus Platform & EDA Outbox
- **Module ID:** `M05`
- **Group:** 06. Quản Trị & Hệ Thống
- **Workspace:** `WS26_SERVICEDESK` | **Route:** `/event-bus`
- **Mounted Component:** `src/modules/governance/m05-eventbus/components/M05EventBusWorkspace.tsx`
- **Domain Authority:** EventBroker Dispatch, Transactional Outbox Relays, Idempotent Processing, Dynamic Consumers, and DLQ Quarantine.
- **Read & Ops APIs:** `GET /api/events/outbox`, `GET /api/outbox/messages`, `GET /api/outbox/dlq`, `POST /api/outbox/retry`, `POST /api/events/subscribers`, `POST /api/events/dispatch-pending`, `POST /api/outbox/archive`

### M06: Innovation R&D & Formulation
- **Module ID:** `M06`
- **Group:** 04. Sản Xuất & Vận Hành
- **Workspace:** `WS23_RD` | **Route:** `/rd`
- **Mounted Component:** `src/modules/master-data/m06-innovation-rd/components/M06InnovationRDWorkspace.tsx`
- **Domain Authority:** Exclusive Authority for Product Prototypes, Stage-Gate Lifecycle, Formula Trial Logs, Recipe Versioning, Eco-Compliance, and R&D Specifications.
- **Read & Write APIs:** `GET /api/rd/projects`, `POST /api/rd/projects`, `GET /api/rd/projects/:id`, `PUT /api/rd/projects/:id/stage`, `POST /api/rd/projects/:id/approve`, `POST /api/rd/projects/:id/reject`, `GET /api/rd/formulas`, `POST /api/rd/formulas`, `POST /api/rd/formulas/:id/approve`, `GET /api/rd/formulas/:projectId/versions`, `POST /api/rd/experiments`, `GET /api/rd/experiments`, `POST /api/rd/projects/:id/material-requisition`, `GET /api/rd/projects/:id/cost-estimate`, `POST /api/rd/samples/:id/evaluate`, `POST /api/rd/samples/evaluate`, `GET /api/rd/samples`, `GET /api/rd/eco-compliance`, `POST /api/rd/eco-compliance/check`, `GET /api/rd/projects/:id/handover-checklist`, `POST /api/rd/projects/:id/register-sku`, `POST /api/rd/projects/:id/handover-signoff`, `POST /api/rd/boms`, `POST /api/rd/projects/:id/pilot-batch`, `GET /api/rd/patents`, `POST /api/rd/patents`, `GET /api/rd/trials`, `POST /api/rd/trials`, `POST /api/rd/ai-suggest`, `POST /api/rd/projects/:id/sample-po`, `GET /api/rd/projects/:id/dms-vault`, `POST /api/rd/projects/:id/dms-vault`
- **Cross-Module Authority Integrations:**
  - *Inventory Authority:* Delegates material requisition solely to M17 via `InventoryService.postTransaction()` (`OUTBOUND_ISSUE`).
  - *Item Master Authority:* Delegates new production SKU registration to M07 (`products`) with `sourceType = 'RD_PROJECT'`.
  - *Costing Authority:* Reads live component costs strictly from M42 / M07 (`cost_layers` / `products.costPrice`) without mutating cost layers.
  - *Manufacturing Authority:* Delegates formal BOM handover (`boms`, `bomItems`) and pilot work orders (`manufacturingOrders`) to M25.
  - *Quality Authority:* Links sample testing to M39 QC inspection plans (`qc_plans`) & auto-generates IQC records.
  - *Procurement Authority:* Delegates sample raw material purchases to M08/M09 P2P (`purchaseOrders`).
  - *DMS Vault Authority:* Archiving and cryptographic SHA-256 sealing of lab trials, certificates and dossiers into M29 DMS (`dmsDocuments`).
  - *Audit Authority:* Logs all lifecycle transitions, trials, evaluations, and handovers to M02 (`AuditService.recordAuditLog()`).

### M07: Enterprise Master Data (Items & Customers)
- **Module ID:** `M07`
- **Group:** 01. Thương Mại & Bán Hàng (và Khối Dữ Liệu Chủ Doanh Nghiệp)
- **Workspace:** `WS02_CRM` | **Route:** `/customers` & `/inventory`
- **Mounted Component:** `/src/modules/master-data/m07-customers-item-master/components/M07CustomersItemMasterWorkspace.tsx` (`src/pages/Customers.tsx`, `src/pages/Inventory.tsx`)
- **Domain Authority:** Sole Single Source of Truth (SSOT) for canonical Item Master (SKUs, Barcodes, Multi-level UOM hierarchy, Packaging specs) and B2B Customer Profiles (Legal profile, Multi Ship-to/Bill-to, Credit Limits & Usage).
- **Read API:** `GET /api/customers`, `GET /api/products`, `POST /api/uom/convert`, `GET /api/categories`
- **Status:** **ACCEPTANCE SEAL: SIGNED & COMPLETED** (Refer to `/docs/design-specs/M07_ARCHITECTURE_POST_SYNC.md`)

### M08: Purchase Orders (P2P Procurement)
- **Module ID:** `M08`
- **Group:** 02. Mua Sắm & Cung Ứng
- **Workspace:** `WS04_PURCHASE` | **Route:** `/purchase`
- **Mounted Component:** `src/pages/Purchase.tsx`
- **Domain Authority:** Exclusive Authority for Purchase Orders (`purchase_orders`), Goods Receipt execution with Single-Writer Inventory delegation (`goods_receipts` via `InventoryService.postTransaction()`), 3-Way Matching (PO ↔ GR ↔ AP Invoice), and Inbound ASN commitments.
- **Read APIs:** `GET /api/purchase-orders`, `GET /api/purchase-orders/:id`, `GET /api/purchase-orders/:id/items`, `GET /api/goods-receipts`, `GET /api/purchase/matching-cases`, `GET /api/purchase/contracts`
- **Write APIs:** `POST /api/purchase-orders`, `POST /api/purchase-orders/:id/submit-approval`, `POST /api/purchase-orders/:id/approve`, `POST /api/purchase-orders/:id/reject`, `POST /api/goods-receipts`, `POST /api/purchase/matching-cases/:id/resolve`, `POST /api/purchase/contracts`
- **Cross-Module Integrations:** M02 (Central Audit Trail), M07 (UOM Conversion & Product Master), M09 (Vendor Master & Credit Terms), M10 (Sourcing Award Delegation), M17 (Single-Writer Inventory Postings on Goods Receipt), M28 (Multi-tier Approval Matrix), M30 (Cost Center Budget Guard), M31 (AP Invoice 3-Way Matching).

### M09: Suppliers SRM Profiles & Terms
- **Module ID:** `M09`
- **Group:** 02. Mua Sắm & Cung Ứng
- **Workspace:** `WS04_PURCHASE` | **Route:** `/suppliers`
- **Mounted Component:** `src/modules/purchase/m09-suppliers/components/M09SuppliersSRMWorkspace.tsx`
- **Domain Authority:** Exclusive Authority for Vendor Master Data, Supplier Banking Details & Credit Terms.
- **Read API:** `GET /api/suppliers`

### M10: Strategic Sourcing & RFQ
- **Module ID:** `M10`
- **Group:** 02. Mua Sắm & Cung Ứng
- **Workspace:** `WS24_SOURCING` | **Route:** `/strategic-sourcing`
- **Mounted Component:** `src/modules/purchase/m10-strategic-sourcing/components/M10StrategicSourcingWorkspace.tsx`
- **Domain Authority:** Exclusive Authority for Sourcing Packages (`sourcing_packages`), RFQ Bidding Events (`srm_rfqs`), Reverse Auction Rounds (`srm_auction_rounds`), Multi-criteria Consensus Evaluations (`sourcing_evaluations`), and Tender Awards (`sourcing_awards`). Downstream PO generation is delegated strictly to M08 Purchase Orders (`POST /api/purchase/orders` / `POST /api/purchase-orders`) via the M08 Single-Writer Authority.
- **Read APIs:** `GET /api/sourcing/packages`, `GET /api/sourcing/packages/:id`, `GET /api/sourcing/rfqs`, `GET /api/sourcing/rfqs/:id`, `GET /api/sourcing/rfqs/:id/bids`, `GET /api/sourcing/rfqs/:id/comparison`, `GET /api/sourcing/evaluations`, `GET /api/sourcing/awards`
- **Write APIs:** `POST /api/sourcing/packages`, `PUT /api/sourcing/packages/:id`, `POST /api/sourcing/packages/:id/cancel`, `POST /api/sourcing/rfqs`, `POST /api/sourcing/rfqs/:id/invite`, `POST /api/sourcing/rfqs/:id/close`, `POST /api/sourcing/rfqs/:id/bids`, `POST /api/sourcing/bids`, `POST /api/sourcing/rfqs/:id/reverse-auction/round`, `POST /api/sourcing/rfqs/:id/consensus-evaluation`, `POST /api/sourcing/evaluations`, `POST /api/sourcing/awards`, `POST /api/sourcing/awards/:id/generate-po`, `POST /api/sourcing/awards/:id/seal-dms`
- **Cross-Module Integrations:** M08 (Single-Writer PO Generation), M09 (Vendor Eligibility Guard & BPA Price Ceilings), M11 (SRM Quality & OTIF Scorecards), M28 (Multi-tier Approval Matrix), M29 (DMS Secure Vault SHA-256), M30 (Cost Center Budget Guard).

### M11: SRM Supplier Performance & Scorecards
- **Module ID:** `M11`
- **Group:** 02. Mua Sắm & Cung Ứng
- **Workspace:** `WS25_SRM` | **Route:** `/srm`
- **Mounted Component:** `src/pages/SRM.tsx`
- **Domain Authority:** Exclusive Authority for Vendor Performance Metrics, Scorecards, and Tiering.
- **Read APIs:** `GET /api/srm/scorecards`, `GET /api/srm/scoring-config`
- **Write APIs:** `PUT /api/srm/scoring-config`, `POST /api/suppliers/:id/scorecards`

### M12: CRM Leads & Opportunity Funnel
- **Module ID:** `M12`
- **Group:** 01. Thương Mại & Bán Hàng
- **Workspace:** `WS02_CRM` | **Route:** `/crm`
- **Mounted Component:** `src/pages/CRM.tsx`
- **Domain Authority:** Exclusive Authority for Sales Leads, Deal Stages, and Opportunity Pipelines.
- **Read API:** `GET /api/crm/leads`

### M13: Sales Orders (B2B O2C Commercial Core & Life-Cycle Fulfillment)
- **Module ID:** `M13`
- **Group:** 01. Commercial & Sales (Thương Mại & Bán Hàng)
- **Workspace:** `WS03_SALES` | **Route:** `/sales`
- **Mounted Component:** `src/modules/sales/m13-sales-orders/components/M13SalesOrdersWorkspace.tsx` (served via `src/pages/SalesOrders.tsx`)
- **Domain Authority:** Exclusive Authority for Customer Sales Orders (`salesOrders`, `salesOrderItems`), Commercial Commitments, ATP Stock Reservations, Decree 123/2020 VAT Invoicing, and Downstream Hand-offs.
  - **Single-Writer Domain Invariant Compliance:**
    1. **Inventory Mutation:** Strictly calls `InventoryService.postTransaction()` / `InventoryService.reserveStock()` / `releaseReservation()` (M17 Single-Writer Authority). Zero direct writes to `stock_balances` or `stock_ledger`.
    2. **General Ledger Voucher:** Strictly posts double-entry journal entries via `AccountingService` (M30 Single-Writer Authority) for revenue (1311/5111), output VAT (1311/33311), and COGS (632/1561).
    3. **Price Resolution:** Selling prices, tiered discounts, and promotional volume breaks resolved via `PricingEngine` (M41 Single-Writer Authority).
    4. **Costing & COGS:** Evaluated in real-time via `CostingService` / Landed Cost Engine (M42 Single-Writer Authority).
- **Read APIs:** `GET /api/sales/orders`, `GET /api/sales/orders/:id`, `GET /api/sales/orders/:id/vat-preview`, `GET /api/sales/orders/:id/returns`, `GET /api/sales/returns`
- **Write APIs:** `POST /api/sales/orders/create-b2b`, `POST /api/sales/orders/:id/approve`, `POST /api/sales/orders/:id/reserve`, `POST /api/sales/orders/:id/fulfill`, `POST /api/sales/orders/:id/cancel`, `POST /api/sales/orders/:id/issue-vat-invoice`, `POST /api/sales/orders/:id/payments`, `POST /api/sales/orders/convert-from-pos`, `POST /api/sales/orders/:id/returns`, `POST /api/sales/test-suite/run`, `POST /api/sales/test-suite/concurrent-stress`
- **Cross-Module Integrations:**
  - **M07 Master Data:** Customer credit limits, tax codes, and product SKUs.
  - **M17 WMS Inventory:** Single-Writer Available-to-Promise (ATP) stock reservation and Goods Issue deduction.
  - **M41 Pricing Management:** Tiered volume discounts and commercial matrices.
  - **M42 Landed Costing & COGS:** Real-time valuation of issued goods for VAS 632 / 1561 entries.
  - **M30 General Ledger Accounting:** Automated 3-stage VAS journal entries.
  - **M16 Retail POS:** Real-time omnichannel synchronization and 1-click corporate VAT conversion.
  - **M15 RMA Dispositions:** Document immutability protection for INVOICED orders delegating returns to RMA credit notes.
- **UI/UX Compliance:** 100% compliant with Rule #19 (`ConfirmDialog.tsx` replacing all browser alerts/prompts) and Rule #20 (Full Replication Protocol).
- **Status:** `[ACCEPTANCE SEAL — COMPLETE, VERIFIED & FROZEN]` (15/15 Integration Test Cases M13-F01 ➔ M13-F15 & Concurrent Stress Test Certified).

### M14: Sales Commission & Incentive Engine (Canonical for former Module 34)
- **Module ID:** `M14`
- **Group:** 01. Thương Mại & Bán Hàng (Commercial & Sales)
- **Workspace:** `WS03_SALES` | **Route:** `/commission`
- **Mounted Component:** `src/modules/sales/m14-sales-commission/components/M14SalesCommissionWorkspace.tsx` (served via `src/pages/Commission.tsx`)
- **Domain Authority:** Exclusive Domain Authority for Sales Commission Plans (`commission_plans`), Tiered Rules (`commission_rules`), Quota & Accelerators (`sales_quotas`), Margin-based Commission Calculations (`commission_calculations`), RMA Return Clawbacks, Disputes & Resolutions (`commission_disputes`), and Settlement Payout Batches (`commission_payouts`).
- **Read APIs:** `GET /api/commission/dashboard`, `GET /api/commission/plans`, `GET /api/commission/quotas`, `GET /api/commission/calculations`, `GET /api/commission/clawbacks`, `GET /api/commission/payouts`, `GET /api/commission/payouts/:id`, `GET /api/commission/analytics`
- **Write APIs:** `POST /api/commission/plans`, `PUT /api/commission/plans/:id`, `POST /api/commission/quotas`, `POST /api/commission/calculate`, `POST /api/commission/calculate/margin-based`, `POST /api/commission/subscribe-events`, `POST /api/commission/clawbacks/generate`, `POST /api/commission/disputes`, `POST /api/commission/disputes/:id/resolve`, `POST /api/commission/payouts`, `POST /api/commission/payouts/generate`, `POST /api/commission/payouts/:id/approve`, `POST /api/commission/payouts/:id/disburse`, `POST /api/commission/payouts/:id/pay`, `POST /api/commission/payouts/:id/pay-via-payroll`
- **Cross-Module Integrations:**
  - **M42 Costing & Landed Cost Engine:** Reads authoritative COGS transaction layers (`GET /api/cogs/transactions`) for margin-based calculations.
  - **M05 EventBus:** Subscribes to transaction outbox events (`order.fulfilled`, `invoice.paid`, `returns.rma.completed`) with idempotency key deduplication.
  - **M15 Returns & RMA:** Automated clawback deduction when returns/credit notes are generated.
  - **M28 HR & Payroll:** Seamless disbursement integration delegating payout settlements into payroll runs.
  - **M30 General Ledger Accounting:** Automated VAS accrual (Nợ 6418 / Có 3388) and settlement (Nợ 3388 / Có 3341 hoặc 1121).
  - **M02 Audit Trail:** Tamper-evident recording of all calculation, dispute, and disbursement lifecycle actions.
- **UI/UX Compliance:** 100% compliant with Rule #19 (`ConfirmDialog.tsx` for approvals and disbursements, `font-mono tabular-nums` for all financial figures) and Rule #20 (Full Module Replication Protocol).
- **Status:** `[ACCEPTANCE SEAL — COMPLETE, VERIFIED & FROZEN]`

### M15: Returns & Customer RMA Management
- **Module ID:** `M15`
- **Group:** 01. Thương Mại & Bán Hàng
- **Workspace:** `WS22_RMA` | **Route:** `/returns`
- **Mounted Component:** `src/components/workspaces/M15ReturnsRMAWorkspace.tsx` (served via `src/pages/Returns.tsx`)
- **Domain Authority:** Exclusive Domain Authority for Customer RMA Authorizations, Return Ingestion, Quality Inspection Gate (M39 QC), Disposition Execution (Restock / Return-to-Vendor / Scrappage / Repair), and Credit Note Issuance delegation to M30 General Ledger.
- **Read APIs:** `GET /api/returns`, `GET /api/returns/:id`, `GET /api/returns/credit-notes`, `GET /api/returns/traceability`, `GET /api/returns/policy`, `GET /api/returns/analytics`
- **Write APIs:** `POST /api/returns/rma`, `POST /api/returns/rma/validate`, `POST /api/returns/fraud-check`, `POST /api/returns/:id/approve`, `POST /api/returns/:id/reject`, `POST /api/returns/rma/:id/inspect`, `POST /api/returns/rma/:id/restock`, `POST /api/returns/credit-notes`, `POST /api/returns/:id/disposition`, `POST /api/returns/rma/:id/disposition`, `POST /api/sales/rma/process`
- **Cross-Module Integrations:**
  - **M02 Audit Trail:** Tamper-evident recording of RMA creation, approval, QC inspection, and disposition execution with SHA-256 hashes across 10 lifecycle milestones.
  - **M08/M11 SRM & Purchase Returns:** Return-to-Vendor (RTV) automated routing creating purchase returns and AP debit notes.
  - **M13 Sales Orders:** Linked to original SO for customer, items, prices, and quantity validations without mutating invoiced orders.
  - **M17 WMS Inventory:** Single-Writer handover strictly via `InventoryService.postTransaction()` with `RETURN_FROM_CUSTOMER` movement type, lot/serial tracking, and real-time stock balance updates.
  - **M22/M23 Serial & Lot Tracking:** Serial lineage validation, tamper-evident warranty check (VOID_TAMPERED), and lot balance restoration.
  - **M27 EAM Maintenance:** Automatic Work Order generation for repair disposition routing (`WO-EAM-*`).
  - **M29 DMS Digital Vault:** Automatic digital archival with SHA-256 seal of RMA intake dossiers, QC inspection reports, and Credit Note vouchers.
  - **M30 General Ledger Accounting:** Single-Writer GL posting via `accountingEngine.postJournal()`, generating balanced VAS reversal entries: Revenue reversal (Nợ 5212 / Có 1311 hoặc 1111) and COGS reversal (Nợ 1561 / Có 632).
  - **M36 Logistics TMS:** Automatic ingestion of RMA dockets upon transport delivery failure (`POST /api/logistics/shipments/:id/fail-delivery`).
  - **M39 Quality Control:** Gated technical inspection, defect classification (DEFECTIVE, DAMAGED, RESTOCKABLE), and evidence attachment.
- **UI/UX Compliance:** 100% compliant with Rule #19 (`ConfirmDialog.tsx` replacing all native dialogs, WCAG AA contrast, responsive 4-tab workflow: requests, inspection, disposition, traceability) and Rule #20 (Full Replication Protocol).
- **Status:** `[ACCEPTANCE SEAL — COMPLETE, VERIFIED & FROZEN]` (15/15 Integration Test Cases M15-F01 ➔ M15-F15 Certified with Live Zero-Mock DB).

### M16: Retail Point of Sale (POS) & Counter
- **Module ID:** `M16`
- **Group:** 01. Thương Mại & Bán Hàng
- **Workspace:** `WS23_POS` | **Route:** `/pos`
- **Mounted Component:** `src/pages/POS.tsx`
- **Domain Authority:** Exclusive Authority for Cashier Registers, Cash Drawer Reconciliation, and Counter Tenders.
- **Read API:** `GET /api/shift/active`

### M17: Master WMS & Core Inventory Engine
- **Module ID:** `M17`
- **Group:** 03. Kho Vận & Hậu Cần
- **Workspace:** `WS05_MASTER_WMS` | **Route:** `/inventory`
- **Mounted Component:** `src/modules/inventory/m17-master-wms/components/MasterWmsWorkspace.tsx`
- **Domain Authority:** **Exclusive Single-Writer for Physical, Available, and Allocated Stock Balances (`InventoryService.postTransaction()`).**
- **Read API:** `GET /api/inventory/balances`, `GET /api/inventory/ledger`

### M18: Warehouse Structure & Bin/Rack Ops
- **Module ID:** `M18`
- **Group:** 03. Kho Vận & Hậu Cần
- **Workspace:** `WS06_WAREHOUSE` | **Route:** `/warehouse`
- **Mounted Component:** `src/pages/Warehouse.tsx`
- **Domain Authority:** Exclusive Authority for Physical Storage Layout, Zones, Aisles, Racks, and Bin Capacity.
- **Read API:** `GET /api/warehouses`

### M19: Stocktake & Physical Inventory Counting
- **Module ID:** `M19`
- **Group:** 03. Kho Vận & Hậu Cần
- **Workspace:** `WS07_STOCKTAKE` | **Route:** `/stocktake`
- **Mounted Component:** `src/pages/Stocktake.tsx`
- **Domain Authority:** Exclusive Authority for Periodic Count Sessions, Blind Counts, and Variance Analysis.
- **Read API:** `GET /api/stocktakes`

### M20: Stock Adjustment & Discrepancy Reconciliation
- **Module ID:** `M20`
- **Group:** 03. Kho Vận & Hậu Cần
- **Workspace:** `WS08_ADJUSTMENT` | **Route:** `/stock-adjustment`
- **Mounted Component:** `src/pages/StockAdjustment.tsx`
- **Domain Authority:** Exclusive Authority for Stock Discrepancy Governance, Write-off Approvals, and Variance Reasons.
- **Read API:** `GET /api/stock-adjustments`

### M21: Internal Transfers & In-Transit Tracking
- **Module ID:** `M21`
- **Group:** 03. Kho Vận & Hậu Cần
- **Workspace:** `WS09_TRANSFER` | **Route:** `/transfer`
- **Mounted Component:** `src/pages/StockTransfer.tsx`
- **Domain Authority:** Inter-Warehouse Transfer Orders, Shipping Confirmations, and In-Transit Custody.
- **Read API:** `GET /api/stock-transfers`

### M22: Lots & Batches Management (FEFO/FIFO & Traceability 360)
- **Module ID:** `M22`
- **Group:** 03. Kho Vận & Hậu Cần
- **Workspace:** `WS10_LOTS` | **Route:** `/lots`
- **Mounted Component:** `src/modules/inventory/m22-lots/components/M22LotsBatchesWorkspace.tsx`
- **Domain Authority:** Traceability & Batch Lineage Authority (Production Lot Lifecycle, FEFO Expiry Routing, Bi-directional Multi-Level Genealogy).
- **Database Tables:** `lots`, `lot_balances`, `stock_ledger`
- **Read APIs:** `GET /api/inventory/lots`, `GET /api/inventory/lots/:id`, `GET /api/inventory/lots/:id/trace`, `GET /api/inventory/lots/:id/trace-upstream`, `GET /api/inventory/lots/:id/trace-downstream`, `GET /api/inventory/lots/:id/ledger`, `GET /api/inventory/lots/:id/recall-dossier`
- **Cross-Module Read-Only Integrations:** M08/M09 (Supplier & PO), M17 (Stock Ledger Single Writer), M25 (Manufacturing MO/BOM), M39 (Inbound/WIP QC & COA), M13 (Sales Order Allocation), M31/M30 (AR & General Ledger Voucher), M15 (Returns RMA), M42 (Cost Layers COGS), M29 (DMS Quality Certs), M02 (Cryptographic Audit Trail).

### M23: Serials & IMEI Tracking (Traceability 360)
- **Module ID:** `M23`
- **Group:** 03. Kho Vận & Hậu Cần
- **Workspace:** `WS11_SERIALS` | **Route:** `/serials`
- **Mounted Component:** `src/modules/inventory/m23-serials/components/M23SerialsWorkspace.tsx`
- **Domain Authority:** Unique Item Identification & Electronic Warranty Authority (Unit-Level Genealogy, GS1 Barcoding, Tamper Protection).
- **Database Tables:** `serial_profiles`, `serial_numbers`, `serial_history`, `serial_transactions`
- **Read APIs:** `GET /api/serials`, `GET /api/serials/:id/history`, `GET /api/serial-profiles`
- **Cross-Module Read-Only Integrations:** M08 (PO Receipt), M17 (WMS Storage Location), M13 (Customer SO Delivery), M15 (RMA Warranty Verification), M27 (EAM Asset Linkage), M02 (Audit Trail).

### M24: Advanced WMS Extended (Wave, Putaway & LPN)
- **Module ID:** `M24`
- **Group:** 03. Kho Vận & Hậu Cần
- **Workspace:** `WS12_WMS_EXT` | **Route:** `/wms-extended`
- **Mounted Component:** `src/pages/WMSExtended.tsx`
- **Domain Authority:** High-Velocity Wave Picking, Directed Putaway, LPN Pallet Tracking, and Dock Schedules.
- **Read API:** `GET /api/wms/wave-picks`

### M25: Manufacturing Execution (MES & BOM)
- **Module ID:** `M25`
- **Group:** 04. Sản Xuất & Vận Hành
- **Workspace:** `WS13_MES` | **Route:** `/manufacturing`
- **Mounted Component:** `src/modules/manufacturing/m25-mes/components/ManufacturingWorkspace.tsx` (`<ManufacturingWorkspace />`)
- **Domain Authority:** Manufacturing Orders (MO), Multi-Level Bill of Materials (BOM), Routing Operations, and Work Center execution.
- **Single-Writer Authority Boundaries (Strict Non-Authority):**
  - *Inventory Authority:* Material issue and Finished Goods receipt delegated strictly to M17 `InventoryService.postTransaction()`. No direct mutation of `stock_balances` or `stock_ledger`.
  - *Costing Authority:* Finished goods COGS roll-up delegated to M42 `CostingEngine` (read-only variance check in M25).
  - *Quality Authority:* WIP & FG quarantine hold and release delegated strictly to M39 QMS (`qc_inspections`, `quality_holds`).
  - *Lot & Serial Authority:* Finished goods lot numbers and serial numbers registered via M22 (`product_lots`) and M23 (`product_serials`).
  - *Audit & Compliance:* All lifecycle events recorded via M02 `AuditService.recordAuditLog()`. Production travelers & inspection certs archived in M29 DMS (`dms_documents`).
- **Read APIs:** `GET /api/manufacturing/orders`, `GET /api/manufacturing/orders/:id`, `GET /api/manufacturing/orders/:id/history`, `GET /api/manufacturing/boms`, `GET /api/manufacturing/boms/:id/versions`, `GET /api/manufacturing/routings`, `GET /api/manufacturing/work-centers`, `GET /api/manufacturing/work-orders/:id/cost-variance`
- **Write APIs:** `POST /api/manufacturing/boms`, `POST /api/manufacturing/boms/:id/versions`, `POST /api/manufacturing/routings`, `POST /api/manufacturing/work-centers`, `POST /api/manufacturing/work-orders`, `PUT /api/manufacturing/work-orders/:id/status`, `POST /api/manufacturing/work-orders/:id/release`, `POST /api/manufacturing/work-orders/:id/issue-materials`, `POST /api/manufacturing/work-orders/:id/backflush`, `POST /api/manufacturing/work-orders/:id/report-scrap`, `POST /api/manufacturing/orders/from-mrp`, `POST /api/manufacturing/work-orders/:id/qc-hold`, `POST /api/manufacturing/work-orders/:id/assign-lot-serial`, `POST /api/manufacturing/work-orders/:id/complete`, `POST /api/manufacturing/work-orders/:id/cancel`, `POST /api/manufacturing/work-orders/:id/dms-dossier`
- **Cross-Module Integrations:** M06 (R&D Engineering BOM Handover & Pilot Batch), M17 (Single-Writer Inventory Postings on Material Issue & FG Receipt via `InventoryService.postTransaction()`), M22 (Lot & Batch Genealogy Tracking), M23 (Finished Goods Serial Number Assignment), M26 (Supply Chain MRP Planned Order Netting Conversion), M27 (EAM Work Center Downtime & Maintenance Alerts), M28 (Shop Floor Operator Allocation & Labor Hours), M39 (Quality Control QMS Quarantine Hold & Batch Release Gate), M42 (Cost Allocation & Real-time Material/Labor Cost Variance Audit), M02 (Cryptographic Audit Trail Logging via `AuditService.recordAuditLog()`), M29 (DMS Manufacturing Batch Traveler Vaulting).
- **Status:** **ACCEPTANCE SEAL: SIGNED & VERIFIED** (Live QA Certified: 2026-09-21)
- **Dependent Modules:** M06, M17, M22, M23, M26, M27, M28, M39, M42, M02, M29.

### M26: Supply Chain SCM & MRP Netting
- **Module ID:** `M26`
- **Group:** 04. Sản Xuất & Vận Hành
- **Workspace:** `WS14_SCM` | **Route:** `/supply-chain`
- **Mounted Component:** `src/modules/manufacturing/m26-scp/components/SupplyChainWorkspace.tsx`
- **Domain Authority:** Material Requirements Planning (MRP), Multi-Level Demand Netting, Statistical Demand Forecasting, Master Production Scheduling (MPS), and Purchase/Manufacturing Requisition Delegation.
- **Read API:** `GET /api/scm/mrp/runs` (Canonical) | `GET /api/supply-chain/plans` (Backward-compatibility alias)
- **Write APIs:**
  - `POST /api/scm/forecasts` (Statistical demand forecasting)
  - `POST /api/scm/mps` (Master Production Scheduling)
  - `POST /api/scm/mrp/run` (Regenerative & Net-change idempotent MRP netting)
  - `POST /api/scm/purchase-requisitions` (Generate purchase requisitions)
  - `POST /api/scm/purchase-requisitions/:id/delegate-po` (Delegate PR to M08 Purchase Order Single Writer)
  - `POST /api/scm/mo-suggestions` (Delegate MO suggestions to M25 Manufacturing Order Single Writer)
  - `POST /api/scm/mrp/runs/:id/vault-dms` (Cryptographic snapshot vaulting into M29 DMS)
- **Single-Writer Domain Authority Constraints:**
  - **M08 Purchase Order Single-Writer:** M26 is NOT an authority for purchase orders. M26 only produces `purchase_requisitions` suggestions and delegates official document generation strictly to M08 (`POST /api/purchase-orders`). Zero direct insertions into `purchase_orders`.
  - **M25 Manufacturing Order Single-Writer:** M26 is NOT an authority for manufacturing work orders. M26 only produces MO suggestions and delegates to M25 (`POST /api/manufacturing/work-orders` or `POST /api/manufacturing/orders/from-mrp`). Zero direct insertions into `manufacturing_orders`.
  - **M17 Inventory Authority:** M26 reads stock balances from M17 (`stock_balances` and `products`); zero direct inventory modifications.
  - **M42 Costing Authority:** M26 reads unit costs for PR estimations without altering cost layers.
- **Cross-Module Integrations:** M13 (Sales Order Demand & Pegging), M17 (On-Hand & Reserved Stock Balances), M25 (Multi-Level BOM Explosion & MO Delegation), M08 (PO Delegation), M09/M07 (Supplier Lead Time & Safety Stock Guard), M37 (Supply Chain Analytics), M02 (Audit Trail Logging via `AuditService.recordAuditLog()`), M29 (DMS Snapshot Vaulting).
- **Status:** **ACCEPTANCE SEAL: SIGNED & VERIFIED** (Live QA Certified: 2026-09-21)
- **Dependent Modules:** M13, M17, M25, M08, M09, M07, M37, M02, M29.

### M27: Enterprise Asset Management (EAM / CMMS)
- **Module ID:** `M27`
- **Group:** 04. Sản Xuất & Vận Hành (Manufacturing & Operations)
- **Workspace:** `WS15_EAM` | **Route:** `/eam` (Canonical) | **Route Alias:** `/assets`
- **Mounted Component:** `src/modules/assets/m27-eam/components/AssetMaintenanceWorkspace.tsx`
- **Domain Authority:** Plant Machinery & Equipment Register, Asset Hierarchy & Criticality Classification (Tier A/B/C), Multi-Trigger Preventive Maintenance (Calendar, Meter Run Hours, IoT Condition), Work Order Lifecycle Execution & State Machine (OPEN, IN_PROGRESS, WAITING_PART, COMPLETED, CLOSED), and Equipment Reliability & OEE Analytics (MTBF, MTTR, Availability %, Downtime).
- **Single-Writer Authority Boundaries (Strict Non-Authority & Delegation):**
  - *Inventory Authority:* M27 is NOT an inventory single writer. Spare parts consumption is strictly delegated to M17 `InventoryService.postTransaction()` (`movementType: 'MAINTENANCE_ISSUE'`). Zero direct mutations to `stock_balances` or `stock_ledger`.
  - *Purchasing Authority:* When spare parts are out of stock or low in inventory, M27 delegates purchase requisitions directly to M08 `PurchaseEngine` (`POST /api/purchase-orders` or `/api/eam/spare-parts/purchase-order`). Zero direct inserts into PO tables.
  - *Accounting Authority:* Asset depreciation and MRO repair expense vouchers are posted strictly via M30 `AccountingEngine` (VAS accounts 211, 214, 627, 642).
  - *Incident & RMA Routing:* Accepts automated work order triggers from M38 Service Desk (`sourceModule: 'M38'`, `INC-xxxx`) and customer returns repair routing from M15 RMA (`sourceModule: 'M15'`, `RMA-xxxx`).
  - *Audit & Compliance:* All state transitions, parts issues, and sign-offs are logged into M02 `AuditService.recordAuditLog()` and maintenance sign-off certificates are sealed into M29 DMS vault (`dms_documents`).
- **Read APIs:** `GET /api/eam/assets`, `GET /api/eam/assets/:id`, `GET /api/eam/maintenance-schedules`, `GET /api/eam/work-orders`, `GET /api/eam/work-orders/:id`, `GET /api/eam/analytics/reliability`
- **Write APIs:**
  - `POST /api/eam/assets` (Register asset with criticality Tier A/B/C and parent hierarchy)
  - `POST /api/eam/assets/depreciation` (Delegate monthly depreciation to M30 GL)
  - `POST /api/eam/maintenance-schedules` (Create PM plans with Calendar/Meter/Condition triggers)
  - `POST /api/eam/work-orders` (Create work order with M38/M15/Manual source tracking)
  - `PUT /api/eam/work-orders/:id/status` (State machine transition: OPEN -> IN_PROGRESS -> WAITING_PART -> COMPLETED)
  - `POST /api/eam/work-orders/:id/issue-parts` (Delegate spare parts issue to M17 Single Writer)
  - `POST /api/eam/spare-parts/purchase-order` (Delegate shortage procurement to M08 Single Writer)
  - `POST /api/eam/work-orders/:id/complete` (Final WO completion, M30 GL cost allocation, M02 audit, M29 DMS archival)
- **Cross-Module Integrations:** M17 (Inventory Core Single-Writer), M08 (Purchasing PO Single-Writer), M30 (General Ledger Accounting), M38 (IT & Facility Service Desk Incidents), M15 (Customer RMA Repair Routing), M28 (Technician & Operator Roster), M40 (EHS Safety Permits & Isolation Tagging), M02 (Cryptographic Audit Trail), M29 (DMS Maintenance Dossier Vaulting).
- **Status:** **ACCEPTANCE SEAL: SIGNED & VERIFIED** (13/13 Integration Test Cases M27-F01 ➔ M27-F13 Certified).
- **Dependent Modules:** M02, M08, M15, M17, M28, M29, M30, M38, M40.

### M28: HR, Personnel & Automated Payroll
- **Module ID:** `M28`
- **Group:** 05. Quản Trị Nhân Sự & Tiền Lương (HR & Payroll)
- **Workspace:** `WS26_HR` | **Route:** `/hr`
- **Mounted Component:** `src/modules/hr/m28-hr-payroll/components/HRWorkspace.tsx`
- **Domain Authority:** Master Employee Records (`employees`), Department & Position Hierarchies (`departments`, `positions`), Labor Contracts (`employee_contracts`), Work Shifts & Rotas (`work_shifts`), Time Attendance & Multi-multiplier Overtime (`attendance_records`, `overtime_records`), Leave Lifecycle Management (`leave_requests`), Statutory Insurance Contributions (BHXH 8%, BHYT 1.5%, BHTN 1.0%), Progressive PIT Taxation Engine (Circular 111/2013/TT-BTC), and Payroll Runs (`payrolls`, `payslips`).
- **Single-Writer Authority Boundaries (Strict Non-Authority & Delegation):**
  - *Accounting Authority:* M28 is NOT an accounting single writer. GL journal entries for gross wages, employee/employer insurance, and PIT tax deductions (VAS accounts 6421, 6221, 6271, 3341, 3383, 3384, 3386, 3335) are strictly delegated to M30 `AccountingEngine.postJournal()`. Zero direct mutations to `accounting_entries`.
  - *Treasury & Cash Authority:* M28 is NOT a cash/bank single writer. Net salary disbursement is strictly delegated to M32 `TreasuryManagementService` (`POST /api/hr/payroll/:id/disburse` -> Nợ 3341 / Có 1121). Zero direct bank mutations.
  - *Commission Integration:* Ingests approved sales commission payouts from M14 (`POST /api/commission/payouts/:id/pay-via-payroll`) into employee taxable income and journal voucher (Nợ 3388 / Có 3341).
  - *Audit & Compliance:* All state transitions (Employee creation, Clock-in, Leave approval, Payroll run, Disburse) are recorded via M02 `AuditService.recordAuditLog()` and payroll dossiers are sealed into M29 DMS vault (`dms_documents`) with SHA-256 digital checksums.
  - *Immutability Guard:* Payrolls marked `APPROVED`, `POSTED`, or `PAID` are strictly immutable; variances must be handled via adjustments in subsequent periods.
- **Read APIs:** `GET /api/hr/employees`, `GET /api/hr/employees/:id`, `GET /api/hr/departments`, `GET /api/hr/positions`, `GET /api/hr/shifts`, `GET /api/hr/attendance`, `GET /api/hr/leaves`, `GET /api/hr/contracts`, `GET /api/hr/payrolls`, `GET /api/hr/payrolls/preview`, `GET /api/hr/payrolls/:id/details`, `GET /api/hr/payroll/:id/payslip`, `GET /api/hr/ess/my-payslips`, `GET /api/hr/performance`, `GET /api/hr/training`, `GET /api/hr/audit-logs`
- **Write APIs:**
  - `POST /api/hr/employees` (Register/update employee master profile with salary, insurance & dependents)
  - `POST /api/hr/contracts` (Create & activate labor contracts)
  - `POST /api/hr/shifts` (Create & configure work shifts with night allowances)
  - `POST /api/hr/timesheets` & `POST /api/hr/attendance` (Ingest attendance records & calculate overtime)
  - `POST /api/hr/leave-requests` & `POST /api/hr/leaves` (Submit leave request)
  - `POST /api/hr/leaves/:id/approve` & `POST /api/hr/leaves/:id/reject` (Approve/reject leave request)
  - `POST /api/hr/payroll/run` & `POST /api/hr/payrolls/calculate` (Run automated statutory payroll calculation)
  - `POST /api/hr/payroll/approve` (Approve payroll & delegate balanced GL journal entries to M30)
  - `POST /api/hr/payroll/:id/disburse` (Disburse net pay via M32 Treasury delegation and lock period)
  - `POST /api/hr/ess/checkin` (Self-service GPS/Mobile attendance check-in)
  - `POST /api/hr/seal-dossier` (Seal cryptographic payroll/HR archive into M29 DMS)
- **Cross-Module Integrations:** M30 (Single-Writer General Ledger Accounting), M32 (Single-Writer Treasury & Banking), M14 (Sales Commission Payout Delegation), M35 (Project Resource & Timesheet Master), M27 (Maintenance Technician Roster), M06 (R&D Resource Allocation), M02 (Cryptographic Audit Trail), M29 (DMS Secure Vault).
- **Status:** **ACTIVE UPGRADE — PHASES 1 to 3 COMPLETED**
- **Dependent Modules:** M02, M06, M14, M25, M27, M29, M30, M32, M35.

### M29: Document Management System (DMS) & Secure Vault
- **Module ID:** `M29`
- **Group:** 08. Hệ Thống & Giám Sát (System & Governance)
- **Workspace:** `WS28_DMS` | **Route:** `/dms` (Alias: `/digital-dms`)
- **Mounted Component:** `src/modules/governance/m29-dms/components/DMSWorkspace.tsx` (`src/pages/DMSPage.tsx`)
- **Domain Authority:** **Exclusive Single-Writer for Digital Document Vault, Cryptographic SHA-256 Hashing, Internal E-Signature Sealing, Retention Policy Schedule & Legal Hold Immutability Shield, Controlled Document Disposal with M02 Permanent Audit Tombstones, and Cross-Module Attachment Linking.**
- **Single-Writer Authority Boundaries (Strict Non-Authority & Delegation):**
  - *Zero Foreign Ledger Mutation:* M29 never writes to or alters `accounting_entries`, `stock_ledger`, or `cost_layers`.
  - *Provenance Linker:* Maintains metadata links to business vouchers in M08 (PO), M13 (SO), M31 (Invoice), M32 (Payment) via `engines/dmsEntityLinker.ts`.
  - *Audit Authority:* All upload, versioning, seal, access, and download events are logged via M02 `AuditService.recordAuditLog()`.
- **Read APIs:** `GET /api/dms/documents`, `GET /api/dms/documents/:id`, `GET /api/dms/documents/:id/download`, `GET /api/dms/entity/:entityType/:entityId/attachments`, `GET /api/dms/reports/missing-attachments`, `GET /api/dms/retention-policies`, `GET /api/dms/signatures`
- **Write APIs:**
  - `POST /api/dms/vault` (Vault document with server-side SHA-256 calculation, MIME/size validation, and idempotency deduplication)
  - `POST /api/dms/documents/:id/sign` (Digitally seal document with internal e-signature, set status SEALED, and emit `dms.document.sealed.v1`)
  - `POST /api/dms/documents/:id/verify` (Verify cryptographic integrity against stored SHA-256 seal)
  - `POST /api/dms/documents/batch-verify` (Batch verify all documents in vault)
  - `PUT /api/dms/retention` (Configure standard retention presets)
  - `PUT /api/dms/documents/:id/retention` (Update individual document retention schedule and toggle Legal Hold)
  - `POST /api/dms/documents/:id/request-disposal` (Submit disposal request to M28 governance council)
  - `POST /api/dms/documents/:id/dispose` (Finalize document disposal with tombstone hash and permanent M02 audit log)
  - `POST /api/dms/archive` (Cold-storage deep glacier packaging and archival)
- **Cross-Module Integrations:**
  - **M06 R&D:** Formulas, clinical trial notes, and laboratory dossier vaulting.
  - **M08 Purchasing:** PO contracts, vendor quotes, and goods receipt notes.
  - **M10 Strategic Sourcing:** RFQ dossiers and tender evaluation scorecards.
  - **M13 Sales Orders:** Official VAT invoice PDFs and sales contracts.
  - **M15 Returns & RMA:** RMA dossiers, inspection photos, and credit note vouchers.
  - **M17 Inventory:** Warehouse stock receipts and delivery notes.
  - **M25 Manufacturing:** Production batch travelers and inspection slips.
  - **M26 Supply Chain:** MRP netting snapshots and production plans.
  - **M27 EAM:** Maintenance work order completion certs and equipment test records.
  - **M28 HR & Payroll:** Employee labor contracts and monthly salary registers.
  - **M31 Invoices:** Official XML/PDF e-invoices and VAT declarations.
  - **M32 Payments:** Official payment vouchers (01-TT, 02-TT) and bank receipts.
  - **M34 Consolidation:** Group consolidation financial statement packages.
  - **M35 Projects:** Project charters, architecture blueprints, and milestone sign-offs.
  - **M36 Logistics:** Electronic Waybills and e-POD signed delivery receipts.
  - **M39 Quality:** Certificates of Analysis (COA) and Inspection Reports.
  - **M02 Audit:** Tamper-evident SHA-256 audit logs and disposal tombstones.
  - **M05 EventBus:** Emits `dms.document.sealed.v1` outbox event upon document sealing.
- **M29 Notifications & Event Broadcasting:**
  - Emits `dms.document.sealed.v1` to transactional outbox upon digital sealing. Verified: Active in Outbox.
- **Dependent Modules:** M02, M05, M06, M08, M10, M13, M15, M17, M25, M26, M27, M28, M31, M32, M34, M35, M36, M39.
- **Status:** **ACCEPTANCE SEAL: SIGNED & LIVE QA CERTIFIED (2026-09-24)** (14/14 Invariant Tests PASS)

### M30: Finance & General Ledger (GL Single-Writer & VAS Accounting Engine)
- **Module ID:** `M30`
- **Group:** 05. Tài Chính & Kế Toán
- **Workspace:** `WS18_FINANCE` | **Route:** `/finance`
- **Mounted Component:** `src/modules/finance/m30-gl/components/M30GeneralLedgerWorkspace.tsx` (`src/pages/FinanceGL.tsx`)
- **Domain Authority:** **Exclusive Single-Writer for General Ledger, Double-Entry Postings (VAS TT200/133), Storno Reversals, Financial Statements (B01-DN, B02-DN, B03-DN, B05-DN), TK 911 Period Closing, Cost Center Allocation, and Cross-Reconciliation.**
- **Read APIs:** `GET /api/finance/accounts`, `GET /api/finance/gl/entries`, `GET /api/finance/trial-balance`, `GET /api/finance/financial-statements`, `GET /api/finance/reports/cost-center-summary`, `GET /api/finance/reports/cross-reconciliation`
- **Write APIs:** `POST /api/finance/gl/entries` (`POST /api/finance/gl/post`), `POST /api/finance/gl/reversal`, `POST /api/finance/period-close` (`POST /api/finance/gl/vas911-closing`), `POST /api/finance/verify-balance`
- **Status:** **ACCEPTANCE SEAL: SIGNED & VERIFIED** (Live QA Certified: 2026-09-23)
- **Cross-Module Integrations:**
  - **M31 Invoices:** Single-Writer GL posting for AR/AP debt & VAT entries.
  - **M32 Treasury:** Single-Writer GL posting for cash/bank vouchers and internal transfers.
  - **M17 Inventory:** Single-Writer GL posting for stock valuation & COGS journal entries.
  - **M28 Payroll:** Single-Writer GL posting for labor salary & statutory insurance expenses.
  - **M27 EAM:** Single-Writer GL posting for asset depreciation & maintenance costs.
  - **M35 Projects:** Single-Writer GL posting for WIP project costing (TK 621, 622, 623, 627 -> 154).
  - **M02 Audit:** SHA-256 tamper-evident audit logging for financial mutation transactions.

### M31: Finance & Accounting (Invoices AR/AP/VAT)
- **Module ID:** `M31`
- **Group:** 05. Tài Chính & Kế Toán
- **Workspace:** `WS19_INVOICES` | **Route:** `/invoices`
- **Mounted Component:** `src/modules/finance/m31-invoices/components/M31InvoicesArApWorkspace.tsx`
- **Domain Authority:** **Central Tax Engine Authority**, Customer AR Invoices, Vendor AP Invoices, VAT Reporting.
- **Read API:** `GET /api/invoices`, `GET /api/invoices/ar`, `GET /api/invoices/aging`, `GET /api/invoices/tax-declaration`, `GET /api/invoices/tax-declaration/xml`, `GET /api/invoices/vat-summary`, `GET /api/invoices/:id`, `GET /api/invoices/:id/dms-vault`, `GET /api/invoices/:id/xml`
- **Write APIs:** `POST /api/invoices/ap`, `POST /api/invoices/:id/issue`, `POST /api/invoices/:id/post-gl`, `POST /api/invoices/:id/cancel`, `POST /api/invoices/:id/offset-credit-note`, `POST /api/invoices/:id/payments`, `POST /api/invoices/:id/3way-match`, `POST /api/invoices/:id/dunning`, `POST /api/invoices/:id/archive-dms`, `POST /api/invoices/batch-archive-dms`, `POST /api/invoices/tax-declaration/submit-etax`
- **Cross-Module Integrations:**
  - **M30 Finance/GL:** Sole GL posting authority (`accountingEngine.postJournal()`).
  - **M13 Sales Orders:** Receives SO invoice requests via `invoiceService.createInvoice()`.
  - **M08 Purchase Orders:** 3-way matching AP invoices with POs and Goods Receipts.
  - **M32 Treasury:** Partial payments and installment collections.
  - **M15 RMA:** Credit note debt offsetting.
  - **M29 DMS:** Legal XML/PDF invoice archiving.
  - **M02 Audit:** Immutable state transition logs.

### M32: Payments & Treasury Cash Management
- **Module ID:** `M32`
- **Group:** 05. Tài Chính & Kế Toán
- **Workspace:** `WS20_PAYMENTS` (Alias: `WS07_PAYMENTS`) | **Route:** `/payments`
- **Mounted Component:** `src/modules/finance/m32-payments/components/M32PaymentsTreasuryWorkspace.tsx` (`src/pages/Payments.tsx`)
- **Domain Authority:** **Exclusive Authority for Treasury Management**, Cash Funds & Bank Accounts (GL 1111/1121), Official Regulatory Vouchers (Mẫu 01-TT Phiếu Thu & Mẫu 02-TT Phiếu Chi theo TT200/2014/TT-BTC & TT133/2016/TT-BTC), Cash Balance Overdraft Guard, Internal Fund Transfers, Central Treasury Authorization Gateway (M32-F06), Dynamic VietQR (NAPAS 247), Automated Bank Reconciliation Matching, and 7/30/90 Days Cash Flow Forecasting.
- **Single-Writer Authority Boundaries (Strict Non-Authority & Delegation):**
  - *Accounting Single-Writer:* M32 is NOT an authority for General Ledger. All double-entry postings are delegated strictly to M30 `AccountingEngine.postTreasuryVoucherJournal()` and `postTreasuryTransferJournal()`. Zero direct writes to `accounting_entries`.
  - *Central Gateway Delegation:* M32-F06 acts as the sole authorized gateway for cash disbursements and collections for external modules (M13 Bán hàng, M14 Hoa hồng, M15 RMA, M16 POS, M28 Nhân sự & Lương, M08 Mua hàng). External modules are prohibited from posting GL cash/bank entries directly.
  - *Audit Authority:* All voucher lifecycle events (Create, Approve, Cancel, Transfer) are cryptographically signed and logged via M02 `AuditService.recordAuditLog()`.
- **Read APIs:** `GET /api/treasury/bank-accounts`, `GET /api/treasury/vouchers`, `GET /api/treasury/vouchers/:id`, `GET /api/treasury/vouchers/:id/printable-form`, `GET /api/treasury/vouchers/:id/vietqr`, `GET /api/treasury/transfers`, `GET /api/treasury/bank-statements`, `GET /api/treasury/cashflow-forecast`, `GET /api/treasury/stats`, `GET /api/payments` (Canonical compatibility)
- **Write APIs:**
  - `POST /api/treasury/vouchers` (Create Receipt / Payment Voucher)
  - `POST /api/treasury/vouchers/:id/approve` (CFO Maker-Checker Approval with M30 Single-Writer GL Post)
  - `POST /api/treasury/vouchers/:id/cancel` (Cancel Voucher with Balance Rollback & M02 Audit Log)
  - `POST /api/treasury/transfers` (Internal Fund Transfer with GL Balanced Post)
  - `POST /api/treasury/reconcile` (Match Bank Statement Transaction)
  - `POST /api/treasury/vietqr-payload` (Generate NAPAS 247 Dynamic QR)
  - `POST /api/treasury/gateway/disburse` (Central Gateway Disbursement for M14, M15, M28, M08)
  - `POST /api/treasury/gateway/collect` (Central Gateway Collection for M13, M16, M31)
- **Cross-Module Integrations:** M30 (Single-Writer GL), M02 (Cryptographic Audit), M13 (Sales Collections), M14 (Commission Payouts), M15 (RMA Refunds), M16 (POS Shift Cash Clearance), M28 (Payroll Disbursements), M08/M31 (Vendor AP Settlements), M33 (Bank Reconciliation).
- **Status:** **ACCEPTANCE SEAL: SIGNED & LIVE QA CERTIFIED (2026-09-23)**

### M33: Bank Reconciliation & VietQR
- **Module ID:** `M33`
- **Group:** 05. Tài Chính & Kế Toán
- **Workspace:** `WS21_BANK` | **Route:** `/bank-reconciliation`
- **Mounted Component:** `src/modules/finance/m33-bank-reconciliation/components/M33BankReconciliationWorkspace.tsx`
- **Domain Authority:** **Bank Statement Clearing, Algorithmic Reconciliation, Discrepancy Ledger (Form 08-TT), and Dynamic VietQR Ingestion.**
- **Single-Writer Authority Boundaries (Strict Non-Authority & Delegation):**
  - *GL Authority Delegation:* M33 is strictly a Non-Authority for General Ledger and Cash accounts. Zero direct writes to `accounting_entries`. All double-entry postings are executed through M32 `TreasuryService` or M30 `AccountingEngine`.
  - *Receipt/Payment Creation Delegation:* When unmatched bank statement transactions require voucher creation, M33 delegates creation to M32 Central Treasury Gateway (`POST /api/treasury/gateway/collect` or `/api/treasury/vouchers`).
  - *Audit Authority:* All automated reconciliations, manual overrides, unmatches, and statement imports are logged to M02 `AuditService.recordAuditLog()`.
- **Read APIs:** `GET /api/bank/accounts`, `GET /api/bank/statements`, `GET /api/bank/unmatched`, `GET /api/bank/reconciliation-report`, `GET /api/bank/reconciled-history`, `GET /api/bank/vietqr/generate`
- **Write APIs:**
  - `POST /api/bank/accounts` (Register or Update Bank Account)
  - `POST /api/bank/statements/import` (Idempotent Statement Import with SHA256 Checksum & deduplication)
  - `POST /api/bank/statements/auto-reconcile` (Multi-Criteria 4-Tier Automated Matching)
  - `POST /api/bank/statements/manual-match` (Manual 1-to-1 / 1-to-N Override with M02 Audit Log)
  - `POST /api/bank/statements/unmatch` (Rollback Match with M02 Audit Log)
  - `POST /api/bank/webhook/vietqr` (Webhook for VietQR Collections with M32 Auto-Receipt)
- **Cross-Module Integrations:**
  - **M32 Treasury:** Central Treasury Gateway for auto-receipt voucher generation and cash journal clearance.
  - **M30 Finance/GL:** GL Account 1121 balance reconciliation and voucher journal validation.
  - **M31 Invoices:** Automated AR customer debt clearing and AP supplier payment matching.
  - **M13 Sales Orders:** Order payment status propagation upon bank clearing.
  - **M02 Audit:** Tamper-evident audit logging for all match, unmatch, and override operations.
- **Status:** **ACCEPTANCE SEAL: SIGNED & LIVE QA CERTIFIED (2026-09-23)**

### M34: Financial Consolidation (BCTC Hợp Nhất)
- **Module ID:** `M34`
- **Group:** 05. Tài Chính & Kế Toán
- **Workspace:** `WS09_CONSOLIDATION` | **Route:** `/consolidation`
- **Mounted Component:** `src/modules/finance/m34-consolidation/components/M34FinancialConsolidationWorkspace.tsx`
- **Domain Authority:** Multi-Branch Consolidated Statements, Intercompany Eliminations, Currency Translation Adjustments, and DMS Financial Report Vaulting.
- **Read APIs:** `GET /api/finance/consolidation/scope`, `GET /api/finance/consolidation/entities`, `GET /api/finance/consolidation/runs/:id`, `GET /api/finance/consolidation/reports`, `GET /api/finance/consolidation/eliminations`, `GET /api/finance/consolidation/reconciliations`, `GET /api/finance/consolidation/runs/:id/drill-down`
- **Write APIs:** `POST /api/finance/consolidation/runs`, `POST /api/finance/consolidation/runs/:id/approve`, `POST /api/finance/consolidation/runs/:id/lock`, `POST /api/finance/consolidation/runs/:id/seal-dms`, `POST /api/finance/consolidation/fx-rates`
- **Cross-Module Integrations:** M30 (Read-Only Trial Balance & GL Single-Writer Guard), M03 (Multi-Currency Rates), M02 (Cryptographic Audit Log via `AuditService`), M29 (DMS Vaulting with SHA-256 Signature), M05 (Transactional Outbox Event `finance.consolidation.run.completed.v1`), M37 (BI Analytics Consumption).
- **Status:** **ACCEPTANCE SEAL: SIGNED & LIVE QA CERTIFIED (2026-09-24)**
- **Dependent Modules:** M30 (GL Accounting), M03 (FX Rates), M02 (Audit Trail), M29 (DMS Vault), M05 (Outbox/EventBus), M37 (BI Reports).

### M35: Projects & Work Breakdown Structure (WBS)
- **Module ID:** `M35`
- **Group:** 04. Sản Xuất & Vận Hành
- **Workspace:** `WS16_PROJECTS` | **Route:** `/projects`
- **Mounted Component:** `src/pages/Projects.tsx`
- **Domain Authority:** Project WBS Trees, Task Milestones, Capacity & Resources (M28), Timesheets & Labor Rates, Job Costing (5 Components: Labor M28, Material M17/M42, Equipment M27, Subcontract M10, Overhead M30), Portfolio EVM ISO 21508, Billing Delegation (M31 Invoicing & M30 GL), and POC Margin Engine (VAS 15 / IFRS 15).
- **APIs:** `GET/POST /api/projects`, `POST /api/projects/:id/wbs`, `PUT /api/projects/:id/progress`, `POST /api/projects/resources`, `POST /api/projects/:id/timesheets`, `POST /api/projects/:id/material-issue`, `GET /api/projects/:id/job-cost`, `GET /api/projects/evm`, `POST /api/projects/:id/billing`, `GET /api/projects/:id/margin`
- **Status:** **CERTIFIED & ACTIVE**

### M36: Logistics & Transportation Fleet (TMS)
- **Module ID:** `M36`
- **Group:** 03. Kho Vận & Hậu Cần
- **Workspace:** `WS17_LOGISTICS` | **Route:** `/logistics`
- **Mounted Component:** `src/pages/Logistics.tsx`
- **Domain Authority:** Transport Dispatches, Fleet Vehicles & Drivers Registry, Carrier Rating, Multi-Stop Route Optimization, Waybill Generation, Electronic Proof of Delivery (e-POD), Toll Reconciliation, and Freight Cost Allocation.
- **Read APIs:** `GET /api/logistics/deliveries`, `GET /api/logistics/orders`, `GET /api/logistics/vehicles`, `GET /api/logistics/drivers`, `GET /api/logistics/kpi`, `GET /api/logistics/fuel-transactions`, `GET /api/logistics/vetc-transactions`, `GET /api/logistics/driver-safety-scores`, `GET /api/logistics/cod-reconciliation`, `GET /api/logistics/analytics`
- **Write APIs:** `POST /api/logistics/orders`, `POST /api/logistics/shipments`, `POST /api/logistics/routes`, `POST /api/logistics/pod`, `POST /api/logistics/shipments/:id/status`, `POST /api/logistics/shipments/:id/fail-delivery`, `POST /api/logistics/orders/:id/assign`, `POST /api/logistics/orders/:id/status`, `POST /api/logistics/vehicles`, `POST /api/logistics/drivers`, `POST /api/logistics/fuel-transactions`, `POST /api/logistics/vetc-transactions/sync`, `POST /api/logistics/vetc-transactions/reconcile`, `POST /api/logistics/cod-reconciliation/:id/settle`, `POST /api/logistics/freight`
- **Cross-Module Integrations:** M02 (Audit Trail for dispatch & e-POD), M09 (3PL Carrier/Supplier integration), M13 (Sales Order fulfillment sync & auto-bridging), M15 (RMA creation delegation on delivery failure), M17 (Read-only Goods Issue & stock balance verification), M21 (Internal Stock Transfer transportation), M28 (Driver employee verification), M29 (Digital Document Vault for Waybill & POD archival), M30 (Single-Writer General Ledger for Freight & COD settlement), M32 (Treasury & Cash Management for driver COD), M42 (Single-Writer Costing delegation for Landed Freight Cost allocation).

### M37: BI & Executive Analytics Reports
- **Module ID:** `M37`
- **Group:** 06. Quản Trị & Hệ Thống
- **Workspace:** `M37 - BI & Executive Analytics` | **Route:** `/analytics` (Alias: `/reports`)
- **Mounted Component:** `src/modules/governance/m37-analytics/components/M37BiAnalyticsWorkspace.tsx`
- **Domain Authority:** Executive Dashboards, VAS Income Statement (P&L), Direct Cash Flow Statement, Inventory Turnover & Ratios, 90-day Cashflow Forecast, and Idempotent Report Export. Thuần READ-ONLY — Tái sử dụng Trial Balance & Financial Statements của M30 General Ledger (`accountingEngine.generateFinancialStatements()`), tuyệt đối không tự tính lại Nợ/Có GL.
- **Read APIs:** `GET /api/analytics/pnl`, `GET /api/analytics/cashflow`, `GET /api/analytics/turnover-ratios`, `GET /api/analytics/forecast`, `GET /api/analytics/kpis`, `GET /api/analytics/pnl-monthly`, `GET /api/reports/summary`, `GET /api/analytics/category-drilldown`, `GET /api/analytics/channel-distribution`, `GET /api/analytics/branch-performance`
- **Write APIs:** `POST /api/analytics/export` (Khởi tạo/Truy xuất Export Job idempotent + M29 Vault Doc link)
- **Cross-Module Integrations:** M30 (Single-Writer General Ledger for P&L Statements), M32/M33 (Treasury & Bank balances for Cash Flow validation), M17/M42 (Inventory & Costing for turnover ratio calculation), M34 (Group Consolidated Financial Reports when locked run exists), M02 (Cryptographic Audit Logging via `AuditService.recordAuditLog()`), M29 (DMS Cryptographic Vault for exported reports), M05 (Outbox Event Emission `analytics.report.exported.v1`).
- **Status:** **ACCEPTANCE SEAL: SIGNED & LIVE QA CERTIFIED (2026-09-25)**
- **Dependent Modules:** M30 (GL Accounting), M32 (Payments), M33 (Bank Recon), M17 (Inventory), M42 (Costing), M34 (Consolidation), M02 (Audit Trail), M29 (DMS Vault), M05 (Outbox/EventBus).

### M38: IT Service Desk & Support Ticketing
- **Module ID:** `M38`
- **Group:** 06. Quản Trị & Hệ Thống
- **Workspace:** `WS26_SERVICEDESK` | **Route:** `/issue` (Alias: `/service-desk`)
- **Mounted Component:** `src/modules/governance/m38-service-desk/components/ServiceDeskWorkspace.tsx` (`src/pages/Issue.tsx`)
- **Domain Authority:** **Exclusive Single-Writer Authority for IT Incident & Service Tickets (`tickets`), SLA Policies (`sla_policies`), Ticket History (`ticket_status_history`), Access Requests Lifecycle (`ticket_access_requests`), and CSAT Surveys (`ticket_surveys`).**
- **Single-Writer Authority Boundaries (Strict Non-Authority & Delegation):**
  - *RBAC Authority Delegation:* M38 manages the lifecycle, multi-tier approvals, and Segregation of Duties (SoD) for access requests. M38 is strictly prohibited from executing direct SQL mutations to `users`, `roles`, `role_permissions`, or `user_permissions`. Real permission activation is delegated strictly to M04 SuperAdmin official APIs (`POST /api/rbac/users/:id/permissions` or role delegations).
  - *Maintenance Authority Delegation:* Hardware maintenance work orders are delegated to M27 EAM (`POST /api/eam/work-orders` with `sourceModule: 'M38'`).
  - *Audit Authority:* All ticket mutations, SLA updates, access approvals, and CSAT submissions are logged via M02 `AuditService.recordAuditLog()`.
- **Read APIs:** `GET /api/service-desk/tickets`, `GET /api/service-desk/tickets/:id`, `GET /api/service-desk/sla`, `GET /api/service-desk/sla-policies`, `GET /api/service-desk/access-requests`, `GET /api/service-desk/kpi`, `GET /api/issues` (Canonical compatibility)
- **Write APIs:**
  - `POST /api/service-desk/tickets` (Create Ticket with M03 sequence code and idempotency key)
  - `POST /api/service-desk/tickets/:id/assign` (Assign technician)
  - `POST /api/service-desk/tickets/:id/accept` (Accept ticket -> IN_PROGRESS)
  - `POST /api/service-desk/tickets/:id/pause` & `POST /api/service-desk/tickets/:id/resume` (SLA Pause/Resume)
  - `POST /api/service-desk/tickets/:id/resolve` (Mandatory Root Cause & Resolution Note)
  - `POST /api/service-desk/tickets/:id/close` (Close Ticket & CSAT Survey, Lock Read-Only)
  - `POST /api/service-desk/tickets/:id/comment` (Add internal communication message)
  - `POST /api/service-desk/tickets/:id/create-work-order` (Create M27 EAM Work Order)
  - `POST /api/service-desk/access-requests` (Create access request with SoD guard)
  - `POST /api/service-desk/access-requests/:id/approve-manager` (Manager approval)
  - `POST /api/service-desk/access-requests/:id/approve-security` (Security officer approval for high risk)
  - `POST /api/service-desk/access-requests/:id/fulfill` (Fulfill via M04 official path)
- **Cross-Module Integrations:**
  - **M01 Workspace Hub:** WorkQueue operational tasks and unresolved ticket aggregation.
  - **M02 Audit Trail:** Tamper-evident SHA-256 audit logging for all ticket lifecycle operations.
  - **M03 System Settings:** Document sequence number generation (`IT-TKT-YYYY-NNNN`).
  - **M04 SuperAdmin RBAC:** Permission catalog lookup and delegation fulfillment.
  - **M05 EventBus:** Transactional outbox event emission (`servicedesk.ticket.*.v1`).
  - **M27 EAM Asset Maintenance:** Hardware asset linkage and corrective work order synchronization.
  - **M28 HR Management:** Direct manager resolution and leave calendar filtering for auto-assignment.
  - **M29 DMS Vault:** Issue attachment linking with SHA-256 integrity verification.
  - **M37 BI Analytics:** MTTR and SLA on-time compliance reporting.
- **Status:** **ACCEPTANCE SEAL: SIGNED & LIVE QA CERTIFIED (2026-09-24)**
- **Dependent Modules:** M01 (Hub), M02 (Audit), M03 (Settings), M04 (RBAC), M05 (EventBus), M27 (EAM), M28 (HRM), M29 (DMS), M37 (BI).

### M39: Quality Control & Inspection (QMS)
- **Module ID:** `M39`
- **Group:** 06. Quản Trị & Hệ Thống
- **Workspace:** `WS27_QUALITY` | **Route:** `/quality`
- **Mounted Component:** `src/components/QualityManagement.tsx`
- **Domain Authority:** Quality Inspection Plans (IQC, PQC, OQC), Non-Conformance Reports (NCR), and Batch Release Quarantine.
- **Read API:** `GET /api/quality/plans`

### M40: Environment, Health & Safety (EHS)
- **Module ID:** `M40`
- **Group:** 06. Quản Trị & Hệ Thống (Governance & Compliance)
- **Workspace:** `WS29_EHS` | **Route:** `/ehs`
- **Mounted Component:** `src/modules/governance/m40-ehs/components/EHSWorkspace.tsx`
- **Domain Authority:** Occupational Safety Incidents, Job Safety Analysis (JSA 5×5 Risk Matrix), Safety CAPA Enforcement, Field Audit Checklists, Fire Safety (PCCC) Equipment & Periodic Inspection, Environmental Monitoring (QCVN thresholds), and Work Permits / Lockout-Tagout (LOTO) Energy Isolation.
- **Single-Writer Authority:** `EhsService` (Sole writer for safety incidents, JSA risk scores, EHS CAPA, fire equipment inspection logs, and work permits).
- **Read APIs:** `GET /api/ehs/incidents`, `GET /api/ehs/risk-assessments`, `GET /api/ehs/capas`, `GET /api/ehs/audits`, `GET /api/ehs/fire-safety/equipment`, `GET /api/ehs/environmental/records`, `GET /api/ehs/permits`, `GET /api/ehs/permits/asset/:assetId/active`, `GET /api/ehs/kpi`
- **Write APIs:**
  - `POST /api/ehs/incidents` (Create safety incident log with sequence `INC-YYYY-NNNN`)
  - `POST /api/ehs/incidents/:id/close` (Close incident & lock with M02 audit trail)
  - `POST /api/ehs/risk-assessments` (Create JSA risk assessment, auto-calculate 5x5 score & level)
  - `POST /api/ehs/capas` / `:id/verify` / `:id/close` (Manage CAPA lifecycle)
  - `POST /api/ehs/audits` (Execute audit checklist; auto-trigger CAPA on mandatory item fail)
  - `POST /api/ehs/fire-safety/equipment` / `:id/inspect` (Register & renew PCCC inspection)
  - `POST /api/ehs/environmental/records` (Log effluent/air quality vs QCVN thresholds)
  - `POST /api/ehs/permits` / `:id/close` (Issue permit to work & LOTO isolation tags)
- **Cross-Module Integrations:**
  - **M18 Warehouse Master:** Site location resolution and warehouse scope validation.
  - **M27 EAM Asset Maintenance:** Read-only LOTO active permit check API (`GET /api/ehs/permits/asset/:assetId/active`) gating Work Orders for high-risk equipment maintenance without modifying M27 code.
  - **M28 HRM Personnel:** Employee validation for victims and EHS safety officers.
  - **M02 Audit Trail:** SHA-256 tamper-evident log for closed incidents & permits.
  - **M05 EventBus:** Outbox event emission (`ehs.incident.logged.v1`, `ehs.incident.closed.v1`).
- **Status:** **ACCEPTANCE SEAL: SIGNED & LIVE QA CERTIFIED (2026-09-25)**
- **Dependent Modules:** M02 (Audit), M05 (EventBus), M18 (Warehouse), M27 (EAM), M28 (HRM).

### M41: Product Pricing & Commercial Authority
- **Module ID:** `M41`
- **Group:** 01. Thương Mại & Bán Hàng
- **Workspace:** `WS30_PRICING` | **Route:** `/pricing-management`
- **Mounted Component:** `src/components/workspaces/M41PricingManagementWorkspace.tsx`
- **Domain Authority:** **Exclusive Pricing Authority for Selling Prices, Margin Floors, Quantity Tiers, and Commercial Discounts.**
- **Read API:** `GET /api/pricing/items`

### M42: Cost Allocation & COGS Engine
- **Module ID:** `M42`
- **Group:** 05. Tài Chính & Kế Toán
- **Workspace:** `WS31_COGS` | **Route:** `/cogs`
- **Mounted Component:** `src/components/workspaces/M42CogsAllocationWorkspace.tsx`
- **Domain Authority:** **Exclusive Costing Authority for Cost Pools, Activity-Based Costing (ABC), Landed Cost Allocations, and COGS Determination.**
- **Read API:** `GET /api/cogs/allocation`

### M43: Industry Profiles & Master Configuration (Hồ Sơ Ngành Hàng)
- **Module ID:** `M43`
- **Group:** 01. Dữ liệu Chủ & Thiết lập (Master Data & Setup)
- **Workspace:** `WS32_INDUSTRY` | **Route:** `/industry-profiles`
- **Mounted Component:** `src/modules/master-data/industry-profiles/components/IndustryProfileWorkspace.tsx`
- **Domain Authority:** **Authoritative Configuration for Industry Operating Parameters, Compliance Standards (ISO/GMP/FDA), Default Tax Rates, and Industry-Specific Valuation Rules.**
- **Database Table:** `industry_profiles`
- **Read APIs:** `GET /api/industry-profiles`, `GET /api/industry-profiles/:id`
- **Write APIs:** `POST /api/industry-profiles`, `PUT /api/industry-profiles/:id`, `DELETE /api/industry-profiles/:id`
- **Cross-Module Integrations:** M07 (Master Data binding), M17/M42 (Valuation method parameter defaults), M02 (Audit Trail for profile updates).
- **Status:** **ACTIVE & GOVERNANCE CERTIFIED (2026-09-27)**

---

## 5. Master Module Route & Mounting Verification Matrix

| Module ID | Module Canonical Name | Primary Route | Workspace ID | Mounted Component | Primary API Endpoint | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **M01** | Workspace Hub | `/workspace` | `WS01_HUB` | `<WorkspaceHub />` | `/api/workspace/summary` | **CERTIFIED** |
| **M02** | Audit Compliance | `/audit` | `WS28_DMS` | `<AuditComplianceWorkspace />` | `/api/audit/logs` | **CERTIFIED** |
| **M03** | System Settings | `/system-settings` | `WS01_HUB` | `<SystemSettings />` | `/api/settings` | **CERTIFIED** |
| **M04** | SuperAdmin RBAC Portal | `/super-admin` | `WS01_HUB` | `<SuperAdminPortal />` | `/api/rbac/roles` | **CERTIFIED** |
| **M05** | EventBus & EDA | `/event-bus` | `WS26_SERVICEDESK`| `<M05EventBusWorkspace />` | `/api/events/outbox` | **CERTIFIED** |
| **M06** | Innovation R&D | `/rd` | `WS23_RD` | `<M06InnovationRDWorkspace />` | `/api/rd/projects` | **CERTIFIED** |
| **M07** | Enterprise Master Data | `/customers` | `WS02_CRM` | `<Customers />` | `/api/customers` | **CERTIFIED** |
| **M08** | Purchase Orders (P2P) | `/purchase` | `WS04_PURCHASE` | `<Purchase />` | `/api/purchase-orders` | **CERTIFIED** |
| **M09** | Suppliers SRM | `/suppliers` | `WS04_PURCHASE` | `<Suppliers />` | `/api/suppliers` | **CERTIFIED** |
| **M10** | Strategic Sourcing | `/strategic-sourcing`| `WS24_SOURCING` | `<M10StrategicSourcingWorkspace />` | `/api/sourcing/rfqs` | **CERTIFIED** |
| **M11** | SRM Supplier Mgmt | `/srm` | `WS25_SRM` | `<SRM />` | `/api/srm/scorecards` | **CERTIFIED** |
| **M12** | CRM / Khách hàng tiềm năng | `/crm` | `WS02_CRM` | `<CRM />` | `/api/crm/leads` | **CERTIFIED** |
| **M13** | Sales Orders (O2C) | `/sales` | `WS03_SALES` | `<SalesOrders />` | `/api/sales/orders` | **CERTIFIED** |
| **M14** | Sales Commission | `/commission` | `WS03_SALES` | `<Commission />` | `/api/commission/plans` | **CERTIFIED** |
| **M15** | Returns & RMA | `/returns` | `WS22_RMA` | `<Returns />` | `/api/returns` | **CERTIFIED** |
| **M16** | POS Retail & Counter | `/pos` | `WS23_POS` | `<POS />` | `/api/shift/active` | **CERTIFIED** |
| **M17** | Master WMS & Core Inventory| `/inventory` | `WS05_MASTER_WMS`| `<Inventory />` | `/api/inventory/balances`| **CERTIFIED** |
| **M18** | Warehouse Management | `/warehouse` | `WS06_WAREHOUSE` | `<Warehouse />` | `/api/warehouses` | **CERTIFIED** |
| **M19** | Stocktake / Kiểm kê | `/stocktake` | `WS07_STOCKTAKE` | `<Stocktake />` | `/api/stocktakes` | **CERTIFIED** |
| **M20** | Stock Adjustment | `/stock-adjustment` | `WS08_ADJUSTMENT`| `<StockAdjustment />` | `/api/stock-adjustments` | **CERTIFIED** |
| **M21** | Internal Transfers | `/transfer` | `WS09_TRANSFER` | `<StockTransfer />` | `/api/stock-transfers` | **CERTIFIED** |
| **M22** | Lots & Batches | `/lots` | `WS10_LOTS` | `<LotsBatches />` | `/api/lots` | **CERTIFIED** |
| **M23** | Serials & IMEI | `/serials` | `WS11_SERIALS` | `<SerialsIMEI />` | `/api/serials` | **CERTIFIED** |
| **M24** | WMS Extended | `/wms-extended` | `WS12_WMS_EXT` | `<WMSExtended />` | `/api/wms/wave-picks` | **CERTIFIED** |
| **M25** | Manufacturing & BOM | `/manufacturing` | `WS13_MES` | `<ManufacturingWorkspace />` | `/api/manufacturing/orders` | **CERTIFIED** |
| **M26** | Supply Chain SCM | `/supply-chain` | `WS14_SCM` | `<SupplyChainWorkspace />` | `/api/scm/mrp/runs` | **CERTIFIED** |
| **M27** | EAM Asset Maintenance | `/eam` | `WS15_EAM` | `<EAM />` | `/api/eam/assets` | **CERTIFIED** |
| **M28** | HR & Payroll | `/hr` | `WS18_FINANCE` | `<HRManagement />` | `/api/hr/employees` | **CERTIFIED** |
| **M29** | DMS Documents | `/dms` | `WS28_DMS` | `<DMSPage />` | `/api/dms/documents` | **CERTIFIED** |
| **M30** | Finance & GL | `/finance` | `WS18_FINANCE` | `<FinanceGL />` | `/api/finance/accounts` | **CERTIFIED** |
| **M31** | Finance & Invoices (AR/AP)| `/invoices` | `WS19_INVOICES` | `<M31InvoicesArApWorkspace />` | `/api/invoices` | **CERTIFIED** |
| **M32** | Payments & Cash | `/payments` | `WS20_PAYMENTS` | `<Payments />` | `/api/payments` | **CERTIFIED** |
| **M33** | Bank Reconciliation | `/bank-reconciliation`| `WS21_BANK` | `<BankReconciliation />` | `/api/bank/statements` | **CERTIFIED** |
| **M34** | Financial Consolidation | `/consolidation` | `WS09_CONSOLIDATION` | `<M34FinancialConsolidationWorkspace />` | `/api/finance/consolidation/runs` | **CERTIFIED** |
| **M35** | Projects & WBS | `/projects` | `WS16_PROJECTS` | `<Projects />` | `/api/projects` | **CERTIFIED** |
| **M36** | Logistics & Fleet | `/logistics` | `WS17_LOGISTICS`| `<Logistics />` | `/api/logistics/deliveries` | **CERTIFIED** |
| **M37** | BI & Analytics Reports | `/analytics` | `M37 - BI & Executive Analytics` | `<M37BiAnalyticsWorkspace />` | `/api/analytics/pnl` | **CERTIFIED** |
| **M38** | Service Desk / Sự cố IT | `/issue` | `WS26_SERVICEDESK`| `<ServiceDeskWorkspace />` | `/api/service-desk/tickets` | **CERTIFIED** |
| **M39** | Quality Control QMS | `/quality` | `WS27_QUALITY` | `<QualityManagement />` | `/api/quality/plans` | **CERTIFIED** |
| **M40** | EHS Safety & Environment | `/ehs` | `WS29_EHS` | `<EHSWorkspace />` | `/api/ehs/incidents` | **CERTIFIED** |
| **M41** | Pricing & Price Management | `/pricing-management`| `WS30_PRICING` | `<M41PricingManagementWorkspace />` | `/api/pricing/items` | **CERTIFIED** |
| **M42** | Cost Allocation & COGS | `/cogs` | `WS31_COGS` | `<M42CogsAllocationWorkspace />` | `/api/cogs/allocation` | **CERTIFIED** |
| **M43** | Hồ Sơ Ngành Hàng (Industry Profiles) | `/industry-profiles` | `WS32_INDUSTRY` | `<IndustryProfileWorkspace />` | `/api/industry-profiles` | **CERTIFIED** |

---
**END OF MODULE_MAP.md — ALL 43 MODULES (M01–M43) & 32 WORKSPACES (WS01–WS32) VERIFIED & RECORDED**
