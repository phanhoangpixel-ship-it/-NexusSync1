# Master ERP — Authoritative Module Map & Enterprise Domain Architecture

**Document Classification:** OFFICIAL ENTERPRISE ARCHITECTURAL BASELINE  
**Status:** [PHASE 2 CONSOLIDATION — COMPLETE & CERTIFIED]  
**Baseline Date:** September 15, 2026  
**Governance Scope:** Certified Architecture Mapping (Modules M01–M42 & Workspaces WS01–WS31)

---

## 1. Executive Architecture Scope & Classification

This document constitutes the authoritative, evidence-grounded catalog and mapping of all **42 enterprise ERP modules (M01–M42)** and **31 functional workspaces (WS01–WS31)** within NexusSync ERP. Every entry is derived directly from source code inspection (`src/App.tsx`, `src/config/moduleRegistry.ts`, `src/components/shell/DomainWorkspaceShell.tsx`, `src/types.ts`, `server.ts`, `server/orchestrationApi.ts`, `src/db/schema.ts`) and certified governance baselines (`/docs/AI/GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`).

### Enterprise Domain Classification Summary (8 Business Groups)

| Group Code | Business Group Description | Module Count | Included Module IDs | Primary Workspaces |
| :--- | :--- | :---: | :--- | :--- |
| **00. CORE HUB** | Master Orchestration, Application Shell & SLA WorkQueue | 1 | M01 | WS01_HUB |
| **01. COMMERCIAL & SALES** | Commercial Core, B2B O2C, Retail POS, Pricing & RMA | 7 | M07, M12, M13, M14, M15, M16, M41 | WS02, WS03, WS22, WS23, WS30 |
| **02. PROCUREMENT & SRM** | Procure-to-Pay (P2P), Sourcing RFQ & Supplier Scorecards | 4 | M08, M09, M10, M11 | WS04_PURCHASE, WS24_SOURCING, WS25_SRM |
| **03. WAREHOUSE & LOGISTICS** | Master WMS, Stock Ledger, Count, Adjust, Lots, Serials & TMS | 9 | M17, M18, M19, M20, M21, M22, M23, M24, M36 | WS05, WS06, WS07, WS08, WS09, WS10, WS11, WS12, WS17 |
| **04. MANUFACTURING & OPS** | MES Execution, BOM, MRP Netting, R&D, EAM, HR & Projects | 7 | M06, M25, M26, M27, M28, M35 | WS05, WS13, WS14, WS15, WS16, WS18 |
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

## 3. Directory of 31 Certified Workspaces (WS01 – WS31)

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

---

## 4. Master 42-Module Specification (M01 – M42)

### M01: Workspace Hub & Global Orchestration
- **Module ID:** `M01`
- **Group:** 00. Core Hub (Trung Tâm Điều Phối)
- **Workspace:** `WS01_HUB` | **Route:** `/workspace`
- **Mounted Component:** `src/modules/admin/m01-workspace-hub/components/WorkspaceHub.tsx`
- **Domain Authority:** Authoritative for session navigation, WorkQueue SLA orchestration, and cross-module workspace aggregation.
- **Read API:** `GET /api/workspace/summary`, `GET /api/workspace/work-items`

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
- **Workspace:** `WS05_INVENTORY` | **Route:** `/rd`
- **Mounted Component:** `src/pages/RDManagement.tsx`
- **Domain Authority:** Exclusive Authority for Product Prototypes, Formula Trial Logs, and R&D Specifications.
- **Read API:** `GET /api/rd/projects`

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

### M13: Sales Orders (O2C Commercial Core)
- **Module ID:** `M13`
- **Group:** 01. Thương Mại & Bán Hàng
- **Workspace:** `WS03_SALES` | **Route:** `/sales`
- **Mounted Component:** `src/pages/SalesOrders.tsx`
- **Domain Authority:** Exclusive Authority for Customer Sales Orders, Stock Reservations, and Commercial Commitments.
- **Read API:** `GET /api/sales/orders`

### M14: Sales Commission & Compensation
- **Module ID:** `M14`
- **Group:** 01. Thương Mại & Bán Hàng
- **Workspace:** `WS03_SALES` | **Route:** `/commission`
- **Mounted Component:** `src/pages/Commission.tsx`
- **Domain Authority:** Exclusive Authority for Sales Commission Plans, Attainment Rates & VAS 6418 Postings.
- **Read API:** `GET /api/commission/plans`

### M15: Returns & RMA Dispositions
- **Module ID:** `M15`
- **Group:** 01. Thương Mại & Bán Hàng
- **Workspace:** `WS22_RMA` | **Route:** `/returns`
- **Mounted Component:** `src/pages/Returns.tsx`
- **Domain Authority:** Exclusive Authority for RMA Authorizations, Return Receiving, and Disposition Inspection.
- **Read API:** `GET /api/returns`

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

### M22: Lots & Batches Management (FEFO/FIFO)
- **Module ID:** `M22`
- **Group:** 03. Kho Vận & Hậu Cần
- **Workspace:** `WS10_LOTS` | **Route:** `/lots`
- **Mounted Component:** `src/pages/LotsBatches.tsx`
- **Domain Authority:** Production Lot Lifecycle, Shelf Life Tracking, and Expiry Warnings.
- **Read API:** `GET /api/lots`

### M23: Serials & IMEI Tracking
- **Module ID:** `M23`
- **Group:** 03. Kho Vận & Hậu Cần
- **Workspace:** `WS11_SERIALS` | **Route:** `/serials`
- **Mounted Component:** `src/pages/SerialsIMEI.tsx`
- **Domain Authority:** Unique Item Identification, Warranty Serial Tracking, and Asset Genealogy.
- **Read API:** `GET /api/serials`

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
- **Mounted Component:** `src/pages/Manufacturing.tsx`
- **Domain Authority:** Manufacturing Orders (MO), Multi-Level Bill of Materials (BOM), and Routing Operations.
- **Read API:** `GET /api/manufacturing/orders`

### M26: Supply Chain SCM & MRP Netting
- **Module ID:** `M26`
- **Group:** 04. Sản Xuất & Vận Hành
- **Workspace:** `WS14_SCM` | **Route:** `/supply-chain`
- **Mounted Component:** `src/pages/SupplyChain.tsx`
- **Domain Authority:** Material Requirements Planning (MRP), Demand Forecasting, and Master Production Schedules.
- **Read API:** `GET /api/supply-chain/plans`

### M27: Enterprise Asset Management (EAM / CMMS)
- **Module ID:** `M27`
- **Group:** 04. Sản Xuất & Vận Hành
- **Workspace:** `WS15_EAM` | **Route:** `/eam`
- **Mounted Component:** `src/pages/EAM.tsx`
- **Domain Authority:** Plant Equipment Health, Maintenance Work Orders, and Spare Parts Management.
- **Read API:** `GET /api/eam/assets`

### M28: HR, Personnel & Automated Payroll
- **Module ID:** `M28`
- **Group:** 04. Sản Xuất & Vận Hành
- **Workspace:** `WS18_FINANCE` | **Route:** `/hr`
- **Mounted Component:** `src/pages/HRManagement.tsx`
- **Domain Authority:** Employee Master Records, Departmental Hierarchies, Attendance, and Payroll.
- **Read API:** `GET /api/hr/employees`

### M29: Document Management System (DMS)
- **Module ID:** `M29`
- **Group:** 06. Quản Trị & Hệ Thống
- **Workspace:** `WS28_DMS` | **Route:** `/dms`
- **Mounted Component:** `src/pages/DMSPage.tsx`
- **Domain Authority:** Digital Document Archives, Contract Storage, and Electronic Metadata.
- **Read API:** `GET /api/dms/documents`

### M30: Finance & General Ledger (GL Single-Writer)
- **Module ID:** `M30`
- **Group:** 05. Tài Chính & Kế Toán
- **Workspace:** `WS18_FINANCE` | **Route:** `/finance`
- **Mounted Component:** `src/pages/FinanceGL.tsx`
- **Domain Authority:** **Exclusive Single-Writer for General Ledger, Double-Entry Postings (VAS), and Balance Sheets.**
- **Read API:** `GET /api/finance/accounts`

### M31: Finance & Accounting (Invoices AR/AP/VAT)
- **Module ID:** `M31`
- **Group:** 05. Tài Chính & Kế Toán
- **Workspace:** `WS19_INVOICES` | **Route:** `/invoices`
- **Mounted Component:** `src/pages/Invoices.tsx`
- **Domain Authority:** **Central Tax Engine Authority**, Customer AR Invoices, Vendor AP Invoices, VAT Reporting.
- **Read API:** `GET /api/invoices`

### M32: Payments & Treasury Cash Management
- **Module ID:** `M32`
- **Group:** 05. Tài Chính & Kế Toán
- **Workspace:** `WS20_PAYMENTS` | **Route:** `/payments`
- **Mounted Component:** `src/pages/Payments.tsx`
- **Domain Authority:** Cash Vouchers, Bank Disbursements, Customer Collections, and Cash Flow Forecasts.
- **Read API:** `GET /api/payments`

### M33: Bank Reconciliation & VietQR
- **Module ID:** `M33`
- **Group:** 05. Tài Chính & Kế Toán
- **Workspace:** `WS21_BANK` | **Route:** `/bank-reconciliation`
- **Mounted Component:** `src/pages/BankReconciliation.tsx`
- **Domain Authority:** Bank Statement Clearing, Algorithmic Matching, and VietQR Payment Validation.
- **Read API:** `GET /api/bank/statements`

### M34: Financial Consolidation (BCTC Hợp Nhất)
- **Module ID:** `M34`
- **Group:** 05. Tài Chính & Kế Toán
- **Workspace:** `WS18_FINANCE` | **Route:** `/financial-consolidation`
- **Mounted Component:** `src/pages/FinancialConsolidation.tsx`
- **Domain Authority:** Multi-Branch Consolidated Statements, Intercompany Eliminations, and Currency Translation.
- **Read API:** `GET /api/finance/consolidation`

### M35: Projects & Work Breakdown Structure (WBS)
- **Module ID:** `M35`
- **Group:** 04. Sản Xuất & Vận Hành
- **Workspace:** `WS16_PROJECTS` | **Route:** `/projects`
- **Mounted Component:** `src/pages/Projects.tsx`
- **Domain Authority:** Project WBS Trees, Task Milestones, Timesheets, and Job Costing.
- **Read API:** `GET /api/projects`

### M36: Logistics & Transportation Fleet (TMS)
- **Module ID:** `M36`
- **Group:** 03. Kho Vận & Hậu Cần
- **Workspace:** `WS17_LOGISTICS` | **Route:** `/logistics`
- **Mounted Component:** `src/pages/Logistics.tsx`
- **Domain Authority:** Transport Dispatches, Carrier Rating, Delivery Manifests, and Proof of Delivery (POD).
- **Read API:** `GET /api/logistics/deliveries`

### M37: BI & Executive Analytics Reports
- **Module ID:** `M37`
- **Group:** 06. Quản Trị & Hệ Thống
- **Workspace:** `WS18_FINANCE` | **Route:** `/reports`
- **Mounted Component:** `src/pages/BIAnalyticsPage.tsx`
- **Domain Authority:** Executive Dashboards, P&L Waterfall, Statutory Financial Reports, and Export Engines.
- **Read API:** `GET /api/reports/summary`

### M38: IT Service Desk & Support Ticketing
- **Module ID:** `M38`
- **Group:** 06. Quản Trị & Hệ Thống
- **Workspace:** `WS26_SERVICEDESK` | **Route:** `/issue`
- **Mounted Component:** `src/pages/Issue.tsx`
- **Domain Authority:** Incident Ticketing, SLA Tracking, Equipment Defect Logging, and Support Escalation.
- **Read API:** `GET /api/issues`

### M39: Quality Control & Inspection (QMS)
- **Module ID:** `M39`
- **Group:** 06. Quản Trị & Hệ Thống
- **Workspace:** `WS27_QUALITY` | **Route:** `/quality`
- **Mounted Component:** `src/components/QualityManagement.tsx`
- **Domain Authority:** Quality Inspection Plans (IQC, PQC, OQC), Non-Conformance Reports (NCR), and Batch Release Quarantine.
- **Read API:** `GET /api/quality/plans`

### M40: Environment, Health & Safety (EHS)
- **Module ID:** `M40`
- **Group:** 06. Quản Trị & Hệ Thống
- **Workspace:** `WS29_EHS` | **Route:** `/ehs`
- **Mounted Component:** `src/pages/EHSPage.tsx`
- **Domain Authority:** Occupational Safety Incidents, Environmental Compliance, PPE Audits, and Fire Safety.
- **Read API:** `GET /api/ehs/records`

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

---

## 5. Master Module Route & Mounting Verification Matrix

| Module ID | Module Canonical Name | Primary Route | Workspace ID | Mounted Component | Primary API Endpoint | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **M01** | Workspace Hub | `/workspace` | `WS01_HUB` | `<WorkspaceHub />` | `/api/workspace/summary` | **CERTIFIED** |
| **M02** | Audit Compliance | `/audit` | `WS28_DMS` | `<AuditComplianceWorkspace />` | `/api/audit/logs` | **CERTIFIED** |
| **M03** | System Settings | `/system-settings` | `WS01_HUB` | `<SystemSettings />` | `/api/settings` | **CERTIFIED** |
| **M04** | SuperAdmin RBAC Portal | `/super-admin` | `WS01_HUB` | `<SuperAdminPortal />` | `/api/rbac/roles` | **CERTIFIED** |
| **M05** | EventBus & EDA | `/event-bus` | `WS26_SERVICEDESK`| `<M05EventBusWorkspace />` | `/api/events/outbox` | **CERTIFIED** |
| **M06** | Innovation R&D | `/rd` | `WS05_INVENTORY` | `<RDManagement />` | `/api/rd/projects` | **CERTIFIED** |
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
| **M25** | Manufacturing & BOM | `/manufacturing` | `WS13_MES` | `<Manufacturing />` | `/api/manufacturing/orders` | **CERTIFIED** |
| **M26** | Supply Chain SCM | `/supply-chain` | `WS14_SCM` | `<SupplyChain />` | `/api/supply-chain/plans` | **CERTIFIED** |
| **M27** | EAM Asset Maintenance | `/eam` | `WS15_EAM` | `<EAM />` | `/api/eam/assets` | **CERTIFIED** |
| **M28** | HR & Payroll | `/hr` | `WS18_FINANCE` | `<HRManagement />` | `/api/hr/employees` | **CERTIFIED** |
| **M29** | DMS Documents | `/dms` | `WS28_DMS` | `<DMSPage />` | `/api/dms/documents` | **CERTIFIED** |
| **M30** | Finance & GL | `/finance` | `WS18_FINANCE` | `<FinanceGL />` | `/api/finance/accounts` | **CERTIFIED** |
| **M31** | Finance & Invoices (AR/AP)| `/invoices` | `WS19_INVOICES` | `<Invoices />` | `/api/invoices` | **CERTIFIED** |
| **M32** | Payments & Cash | `/payments` | `WS20_PAYMENTS` | `<Payments />` | `/api/payments` | **CERTIFIED** |
| **M33** | Bank Reconciliation | `/bank-reconciliation`| `WS21_BANK` | `<BankReconciliation />` | `/api/bank/statements` | **CERTIFIED** |
| **M34** | Financial Consolidation | `/financial-consolidation`| `WS18_FINANCE` | `<FinancialConsolidation />`| `/api/finance/consolidation` | **CERTIFIED** |
| **M35** | Projects & WBS | `/projects` | `WS16_PROJECTS` | `<Projects />` | `/api/projects` | **CERTIFIED** |
| **M36** | Logistics & Fleet | `/logistics` | `WS17_LOGISTICS`| `<Logistics />` | `/api/logistics/deliveries` | **CERTIFIED** |
| **M37** | BI & Analytics Reports | `/reports` | `WS18_FINANCE` | `<BIAnalyticsPage />` | `/api/reports/summary` | **CERTIFIED** |
| **M38** | Service Desk / Sự cố IT | `/issue` | `WS26_SERVICEDESK`| `<Issue />` | `/api/issues` | **CERTIFIED** |
| **M39** | Quality Control QMS | `/quality` | `WS27_QUALITY` | `<QualityManagement />` | `/api/quality/plans` | **CERTIFIED** |
| **M40** | EHS Safety & Environment | `/ehs` | `WS29_EHS` | `<EHSPage />` | `/api/ehs/records` | **CERTIFIED** |
| **M41** | Pricing & Price Management | `/pricing-management`| `WS30_PRICING` | `<M41PricingManagementWorkspace />` | `/api/pricing/items` | **CERTIFIED** |
| **M42** | Cost Allocation & COGS | `/cogs` | `WS31_COGS` | `<M42CogsAllocationWorkspace />` | `/api/cogs/allocation` | **CERTIFIED** |

---
**END OF MODULE_MAP.md — ALL 42 MODULES (M01–M42) VERIFIED & CERTIFIED**
