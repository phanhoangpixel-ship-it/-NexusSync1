# Master ERP — Authoritative Module Map & Enterprise Domain Architecture

**Document Classification:** OFFICIAL ENTERPRISE ARCHITECTURAL BASELINE  
**Status:** [PHASE 1 DISCOVERY — COMPLETE & CERTIFIED]  
**Discovery Execution Date:** August 24, 2026  
**Governance Scope:** Read-Only Forensic Architecture Mapping (Modules 01–40)

---

## 1. Executive Architecture Scope & Classification

This document constitutes the authoritative, evidence-grounded catalog and mapping of all **40 enterprise ERP modules** within the NexusSync ERP application. Every entry is derived directly from source code inspection (`src/App.tsx`, `src/config/moduleRegistry.ts`, `src/components/Layout.tsx`, `src/types.ts`, `server.ts`, `server/orchestrationApi.ts`, `src/db/schema.ts`) and certified governance baselines (`/docs/AI/ERP_40_MODULE_FUNCTIONAL_DEFINITION_BASELINE.md`, `/docs/AI/ERP_40_MODULE_AUTHORITY_MATRIX.md`).

### Enterprise Domain Classification Summary

| Domain Code | Business Domain Description | Module Count | Included Module IDs |
| :--- | :--- | :--- | :--- |
| **CORE / IAM** | Identity, Access Control & System Control | 2 | M01, M38 |
| **MASTER DATA** | Foundational Master Entities & Products | 3 | M02, M11, M12 |
| **P2P / SRM** | Procure-to-Pay, Strategic Sourcing & Suppliers | 3 | M04, M29, M30 |
| **O2C / COMMERCE** | Order-to-Cash, CRM & Retail POS | 4 | M05, M26, M28, M33 |
| **INVENTORY / WMS** | Inventory Core, Warehouse & Physical Logistics | 6 | M03, M06, M07, M09, M10, M40 |
| **LOGISTICS / TMS** | Transportation, Fleet & Carrier Management | 1 | M14 |
| **FINANCE / FICO** | General Ledger, Cash, Banking, Tax & Consolidation | 8 | M08, M09, M10, M21, M22, M23, M31, M32 |
| **HR / HCM** | Human Capital Management & Org Structure | 1 | M18 |
| **MES / MRP / SCP** | Manufacturing Execution, Planning & Optimization | 4 | M15, M17, M19, M35 |
| **EAM / CMMS** | Enterprise Asset Management & Maintenance | 1 | M13 |
| **PROJECT / COSTING** | Projects, Work Breakdown Structure & Job Costing | 1 | M39 |
| **GOVERNANCE / AUDIT** | Security, Immutable Audit, Compliance & Integration | 6 | M16, M20, M24, M25, M27, M37 |

---

## 2. Authoritative 40-Module Master Directory

### Module 01: IAM / Identity & Access Management (Workspace Hub & IAM)

### Workspace Hub (Enterprise Application Shell)

**Workspace Hub là Enterprise Application Shell và điểm truy cập trung tâm của NexusSync ERP, cung cấp một không gian làm việc thống nhất để người dùng khám phá, điều hướng và truy cập các domain/module theo quyền RBAC. Workspace Hub quản lý navigation, workspace layout, global search, notification/task entry, user context và dashboard presentation; không sở hữu hoặc thực thi business logic, database transaction, inventory posting, costing, accounting, workflow hay các domain authority. Workspace Hub có thể được thay thế hoặc nâng cấp độc lập ở Presentation Layer mà không làm thay đổi Frozen Core và Business Contracts của các module.**


* **MODULE ID:** M01
* **MODULE NAME:** Workspace Hub / IAM (Identity & Access Management)
* **BUSINESS DOMAIN:** CORE / IAM
* **BUSINESS PURPOSE:** Central user control center, user authentication, session lifecycle, and cross-module workspace aggregation.
* **PRIMARY ROUTE:** `/workspace` (App state: `workspace_hub`)
* **RELATED ROUTES:** `/login`, `/dashboard`
* **PRIMARY UI ENTRY POINT:** `src/pages/WorkspaceHub.tsx`
* **PRIMARY API:** `GET /api/orchestration/workspaces`, `GET /api/orchestration/groups`
* **RELATED APIs:** `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/orchestration/seed`
* **PRIMARY DOMAIN SERVICE:** `server/workspaceService.ts` (`WorkspaceService`), `src/services/WorkspaceAggregationService.ts`
* **DOMAIN AUTHORITY:** Authoritative for user session context, workspace layout presentation, and user navigation state. (Strict non-authority for operational transactional mutations).
* **RBAC PERMISSIONS:** Public/Authenticated (Base access required for all active users).
* **STATE MACHINES:** User Session Lifecycle (`UNAUTHENTICATED` → `AUTHENTICATED` → `EXPIRED`).
* **CORE ENTITIES:** `functionalGroups`, `businessWorkspaces`, `users`, `roles`, `permissions`.
* **INPUTS:** User credentials, JWT bearer tokens, active role scope.
* **OUTPUTS:** Aggregated workspace summaries, work item counts, active module routes.
* **UPSTREAM MODULES:** Module 38 (Enterprise Administration), Module 37 (Security & Audit).
* **DOWNSTREAM MODULES:** All Modules (M02–M40).
* **WORKSPACE HUB INTEGRATION STATUS:** Root Hub Host Component.
* **READ ADAPTER:** `WorkspaceAggregationService.getWorkspaceSummary()`.
* **NAVIGATION ADAPTER:** `onNavigate(moduleId: ModuleId)`.
* **ACTION ADAPTER:** `WorkspaceAggregationService.getWorkItems()`.
* **CURRENT UI STATUS:** PARTIAL (Renders functional groups and workspace cards from backend API; card action button lacks click binding).
* **EVIDENCE:** `src/pages/WorkspaceHub.tsx`, `src/config/moduleRegistry.ts` (line 15), `server/orchestrationApi.ts`.

---

### Module 02: Product & Master Data
* **MODULE ID:** M02
* **MODULE NAME:** Product Master Data
* **BUSINESS DOMAIN:** MASTER DATA
* **BUSINESS PURPOSE:** Central catalog for enterprise product master data, item classifications, SKU definitions, and Units of Measure (UOM).
* **PRIMARY ROUTE:** `/inventory` (Tabs: Products / SKU Catalog)
* **RELATED ROUTES:** `/lots`, `/serials`
* **PRIMARY UI ENTRY POINT:** `src/pages/Inventory.tsx`
* **PRIMARY API:** `GET /api/products`, `POST /api/products`
* **RELATED APIs:** `GET /api/categories`, `GET /api/units`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Product Controller)
* **DOMAIN AUTHORITY:** Exclusive authority for Product SKUs, UOM conversions, and Item master records.
* **RBAC PERMISSIONS:** `products:read`, `products:write`, `products:admin`
* **STATE MACHINES:** Item Master Status (`DRAFT` → `ACTIVE` → `DISCONTINUED` → `BLOCKED`).
* **CORE ENTITIES:** `products`, `categories`, `units_of_measure`, `product_attributes`.
* **INPUTS:** New item specifications, category hierarchies, unit definitions.
* **OUTPUTS:** Canonical SKU records, catalog sync events.
* **UPSTREAM MODULES:** Module 38 (System Settings).
* **DOWNSTREAM MODULES:** M03 (Inventory Core), M04 (Procurement), M05 (Sales), M15 (MRP), M19 (Manufacturing).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (Read endpoint mapped via `/api/products`).
* **READ ADAPTER:** Registered in `moduleRegistry.ts`.
* **NAVIGATION ADAPTER:** Mapped via `inventory` module state.
* **ACTION ADAPTER:** Item catalog search.
* **CURRENT UI STATUS:** WORKING (Fully rendered inside Inventory master view).
* **EVIDENCE:** `src/pages/Inventory.tsx`, `src/db/schema.ts` (`products` table), `server.ts`.

---

### Module 03: Inventory Core
* **MODULE ID:** M03
* **MODULE NAME:** Inventory Core (3-State Stock & Stock Ledger)
* **BUSINESS DOMAIN:** INVENTORY / WMS
* **BUSINESS PURPOSE:** Real-time stock balance tracking across 3 physical/logical states (`physicalQuantity`, `allocatedQuantity`, `availableQuantity`) and immutable stock ledger management.
* **PRIMARY ROUTE:** `/inventory` (App state: `inventory`)
* **RELATED ROUTES:** `/stock` (Stock Ledger), `/transfer`, `/lots`, `/serials`
* **PRIMARY UI ENTRY POINT:** `src/pages/Inventory.tsx`, `src/pages/Stock.tsx`
* **PRIMARY API:** `GET /api/inventory/balances`, `POST /api/inventory/post`
* **RELATED APIs:** `GET /api/stock-ledger`, `GET /api/inventory/summary`
* **PRIMARY DOMAIN SERVICE:** `server/inventoryEngine.ts` (`InventoryService`)
* **DOMAIN AUTHORITY:** Exclusive Central Authority for Inventory Balances and Stock Ledger entries.
* **RBAC PERMISSIONS:** `inventory:read`, `inventory:post`, `inventory:transfer`, `inventory:reserve`
* **STATE MACHINES:** Stock Movement Invariant (`Physical = Available + Allocated`).
* **CORE ENTITIES:** `stock_balances`, `stock_ledger`, `stock_reservations`, `lots`, `serials`.
* **INPUTS:** Inbound receipts (M04), outbound picks (M05, M40), transfer orders (M11), adjustments (M10).
* **OUTPUTS:** Immutable stock ledger lines, balance updates, stockout alerts.
* **UPSTREAM MODULES:** M02 (Product Master), M06 (Warehouse Locations).
* **DOWNSTREAM MODULES:** M07 (Inventory Costing), M08 (General Ledger), M05 (Sales Order Fulfillment).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (Registered in `moduleRegistry.ts` line 21).
* **READ ADAPTER:** `GET /api/inventory/balances`.
* **NAVIGATION ADAPTER:** Supported via `inventory` state.
* **ACTION ADAPTER:** Low-stock alert visibility.
* **CURRENT UI STATUS:** WORKING (High-fidelity 3-state inventory table, stock card, and batch tracking).
* **EVIDENCE:** `src/pages/Inventory.tsx`, `src/pages/Stock.tsx`, `server.ts`.

---

### Module 04: Procurement / Purchasing / P2P
* **MODULE ID:** M04
* **MODULE NAME:** Purchase Orders (P2P Procurement)
* **BUSINESS DOMAIN:** P2P / SRM
* **BUSINESS PURPOSE:** Procure-to-Pay lifecycle management from Purchase Requisition, Purchase Order creation, Goods Receipt confirmation, to 3-way matching.
* **PRIMARY ROUTE:** `/purchase` (App state: `purchase`)
* **RELATED ROUTES:** `/suppliers`, `/strategic-sourcing`, `/srm`
* **PRIMARY UI ENTRY POINT:** `src/pages/Purchase.tsx`
* **PRIMARY API:** `GET /api/purchase/orders`, `POST /api/purchase/orders`
* **RELATED APIs:** `POST /api/purchase/orders/:id/approve`, `POST /api/purchase/orders/:id/receive`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Procurement Service)
* **DOMAIN AUTHORITY:** Exclusive Authority for Purchase Orders and Procurement Commitments.
* **RBAC PERMISSIONS:** `purchase:read`, `purchase:create`, `purchase:approve`, `purchase:receive`
* **STATE MACHINES:** `DRAFT` → `PENDING_APPROVAL` → `APPROVED` → `PARTIALLY_RECEIVED` → `COMPLETED` → `CANCELLED`.
* **CORE ENTITIES:** `purchase_orders`, `purchase_order_lines`, `goods_receipts`.
* **INPUTS:** Material replenishment requisitions (M15), vendor quotes (M29).
* **OUTPUTS:** Approved PO documents, receiving manifests for M03, AP matching invoices for M08/M22.
* **UPSTREAM MODULES:** M02 (Products), M12 (Suppliers), M15 (MRP).
* **DOWNSTREAM MODULES:** M03 (Inventory Core), M08 (Accounting / Accounts Payable).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (Approval provider configured in `moduleRegistry.ts` line 19).
* **READ ADAPTER:** `GET /api/purchase/orders`.
* **NAVIGATION ADAPTER:** Supported via `purchase` state.
* **ACTION ADAPTER:** PO approval widget provider.
* **CURRENT UI STATUS:** WORKING (Complete PO lifecycle UI with approval actions and receipt logging).
* **EVIDENCE:** `src/pages/Purchase.tsx`, `src/config/moduleRegistry.ts`, `server.ts`.

---

### Module 05: Sales / Order-to-Cash / O2C
* **MODULE ID:** M05
* **MODULE NAME:** Sales Orders (O2C Commercial)
* **BUSINESS DOMAIN:** O2C / COMMERCE
* **BUSINESS PURPOSE:** Order-to-Cash commercial workflow management including sales quotations, customer sales orders, credit checking, stock allocation, and delivery billing.
* **PRIMARY ROUTE:** `/sales` (App state: `sales_orders`)
* **RELATED ROUTES:** `/customers`, `/pos`, `/invoices`, `/returns`
* **PRIMARY UI ENTRY POINT:** `src/pages/SalesOrders.tsx`
* **PRIMARY API:** `GET /api/sales/orders`, `POST /api/sales/orders`
* **RELATED APIs:** `POST /api/sales/orders/:id/confirm`, `POST /api/sales/orders/:id/allocate`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Sales Order Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Sales Orders, Commercial Commitments, and Customer Quotations.
* **RBAC PERMISSIONS:** `sales:read`, `sales:create`, `sales:approve`, `sales:fulfill`
* **STATE MACHINES:** `DRAFT` → `CONFIRMED` → `ALLOCATED` → `PICKED` → `DELIVERED` → `INVOICED` → `CLOSED`.
* **CORE ENTITIES:** `sales_orders`, `sales_order_lines`, `customer_quotations`.
* **INPUTS:** Customer purchase requests, price books, credit limits (M11).
* **OUTPUTS:** Confirmed sales orders, picking requests for M03/M40, AR sales invoices for M22.
* **UPSTREAM MODULES:** M02 (Products), M11 (Customers), M03 (Inventory Availability).
* **DOWNSTREAM MODULES:** M03 (Stock Reservation), M40 (WMS Picking), M22 (Invoices), M26 (Commissions).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 18).
* **READ ADAPTER:** `GET /api/sales/orders`.
* **NAVIGATION ADAPTER:** Supported via `sales_orders` state.
* **ACTION ADAPTER:** Sales fulfillment metrics.
* **CURRENT UI STATUS:** WORKING (Full order management table, status progression, and detail view).
* **EVIDENCE:** `src/pages/SalesOrders.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 06: Warehouse / Location Management
* **MODULE ID:** M06
* **MODULE NAME:** Warehouse & Location Ops
* **BUSINESS DOMAIN:** INVENTORY / WMS
* **BUSINESS PURPOSE:** Physical facility hierarchy configuration, zone/aisle/rack/bin management, storage capacity control, and warehouse definition.
* **PRIMARY ROUTE:** `/warehouse` (App state: `warehouse`)
* **RELATED ROUTES:** `/wms-extended`, `/inventory`
* **PRIMARY UI ENTRY POINT:** `src/pages/Warehouse.tsx`
* **PRIMARY API:** `GET /api/warehouses`, `POST /api/warehouses`
* **RELATED APIs:** `GET /api/warehouse-locations`, `POST /api/warehouse-locations`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Warehouse Service)
* **DOMAIN AUTHORITY:** Exclusive Authority for Physical Warehouse Structures, Zones, and Bin Locations.
* **RBAC PERMISSIONS:** `warehouse:read`, `warehouse:write`, `warehouse:admin`
* **STATE MACHINES:** Location Status (`ACTIVE` → `INACTIVE` → `MAINTENANCE` → `BLOCKED`).
* **CORE ENTITIES:** `warehouses`, `warehouse_locations`, `storage_zones`.
* **INPUTS:** Facility layout configurations, bin capacity specifications.
* **OUTPUTS:** Spatial location IDs for inventory stock placement.
* **UPSTREAM MODULES:** Module 38 (System Administration).
* **DOWNSTREAM MODULES:** M03 (Inventory Core), M40 (Advanced WMS Extended).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 22).
* **READ ADAPTER:** `GET /api/warehouses`.
* **NAVIGATION ADAPTER:** Supported via `warehouse` state.
* **ACTION ADAPTER:** Spatial storage query.
* **CURRENT UI STATUS:** WORKING (Warehouse card listing, location tree, and capacity gauges).
* **EVIDENCE:** `src/pages/Warehouse.tsx`, `src/db/schema.ts` (`warehouses`, `warehouse_locations`).

---

### Module 07: Inventory Costing
* **MODULE ID:** M07
* **MODULE NAME:** Inventory Costing & COGS Engine
* **BUSINESS DOMAIN:** INVENTORY / WMS
* **BUSINESS PURPOSE:** Real-time inventory valuation (Moving Average, Standard, FIFO), landed cost allocations, inventory revaluation, and COGS determination.
* **PRIMARY ROUTE:** `/inventory` (Sub-view: COGS Engine / Valuation)
* **RELATED ROUTES:** `/finance`, `/accounting`
* **PRIMARY UI ENTRY POINT:** `src/components/CogsEngineModule.tsx`
* **PRIMARY API:** `GET /api/costing/valuation`, `POST /api/costing/recalculate`
* **RELATED APIs:** `GET /api/costing/layers`, `GET /api/costing/cogs-breakdown`
* **PRIMARY DOMAIN SERVICE:** `server/costingEngine.ts` (`CostingService`)
* **DOMAIN AUTHORITY:** Exclusive Authority for Inventory Valuation Rates, Cost Layers, and COGS Calculations.
* **RBAC PERMISSIONS:** `costing:read`, `costing:recalculate`, `costing:admin`
* **STATE MACHINES:** Valuation State (`CALCULATED` → `POSTED` → `LOCKED`).
* **CORE ENTITIES:** `inventory_cost_layers`, `cost_adjustments`, `landed_cost_records`.
* **INPUTS:** Purchase costs (M04), inventory movements (M03).
* **OUTPUTS:** Valuation rates, COGS journal entries passed to Module 08.
* **UPSTREAM MODULES:** M03 (Inventory Core), M04 (Procurement).
* **DOWNSTREAM MODULES:** M08 (General Ledger / COGS Accounting).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (Embedded in Inventory workspace).
* **READ ADAPTER:** `GET /api/costing/valuation`.
* **NAVIGATION ADAPTER:** Embedded sub-route inside `inventory`.
* **ACTION ADAPTER:** Valuation recalculation trigger.
* **CURRENT UI STATUS:** WORKING (Interactive COGS breakdown and valuation analyzer component).
* **EVIDENCE:** `src/components/CogsEngineModule.tsx`, `server/costingEngine.ts`.

---

### Module 08: Accounting / General Ledger
* **MODULE ID:** M08
* **MODULE NAME:** General Ledger & Accounting (Single-Writer Engine)
* **BUSINESS DOMAIN:** FINANCE / FICO
* **BUSINESS PURPOSE:** Central financial system of record, maintaining Chart of Accounts, double-entry validation, journal entry posting, trial balances, and financial statement generation.
* **PRIMARY ROUTE:** `/accounting` (App state: `accounting`)
* **RELATED ROUTES:** `/finance`, `/financial-consolidation`, `/bank-reconciliation`
* **PRIMARY UI ENTRY POINT:** `src/pages/Accounting.tsx`
* **PRIMARY API:** `GET /api/accounting/journal-entries`, `POST /api/accounting/post`
* **RELATED APIs:** `GET /api/accounting/chart-of-accounts`, `GET /api/accounting/trial-balance`
* **PRIMARY DOMAIN SERVICE:** `server/accountingEngine.ts` (`AccountingService`)
* **DOMAIN AUTHORITY:** **Exclusive Single-Writer Authority for General Ledger, Double-Entry Validation, and Financial Postings.**
* **RBAC PERMISSIONS:** `accounting:read`, `accounting:post`, `accounting:close_period`, `accounting:admin`
* **STATE MACHINES:** `DRAFT` → `POSTED` (Immutable) → `REVERSED`.
* **CORE ENTITIES:** `chart_of_accounts`, `journal_entries`, `journal_lines`, `fiscal_periods`.
* **INPUTS:** Subledger feeds from M04, M05, M07, M09, M23, M26.
* **OUTPUTS:** General ledger balances, trial balance, P&L, Balance Sheet.
* **UPSTREAM MODULES:** All operational transactional modules (Subledgers).
* **DOWNSTREAM MODULES:** M21 (Consolidation), M24 (Financial Analytics).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 35).
* **READ ADAPTER:** `GET /api/accounting/journal-entries`.
* **NAVIGATION ADAPTER:** Supported via `accounting` state.
* **ACTION ADAPTER:** Unposted journal alert metrics.
* **CURRENT UI STATUS:** WORKING (Double-entry validation UI, chart of accounts hierarchy, trial balance inspector).
* **EVIDENCE:** `src/pages/Accounting.tsx`, `server/accountingEngine.ts`.

---

### Module 09: Stocktake / Physical Inventory Count
* **MODULE ID:** M09
* **MODULE NAME:** Stocktake & Physical Inventory Counting
* **BUSINESS DOMAIN:** INVENTORY / WMS
* **BUSINESS PURPOSE:** Blind counting cycles, multi-round recount reconciliation, variance analysis, and stock discrepancy auditing.
* **PRIMARY ROUTE:** `/stocktake` (App state: `stocktake`)
* **RELATED ROUTES:** `/stock-adjustment`, `/inventory`
* **PRIMARY UI ENTRY POINT:** `src/pages/Stocktake.tsx`
* **PRIMARY API:** `GET /api/stocktake`, `POST /api/stocktake/create`
* **RELATED APIs:** `POST /api/stocktake/:id/count`, `POST /api/stocktake/:id/reconcile`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Stocktake Service)
* **DOMAIN AUTHORITY:** Exclusive Authority for Physical Count Records, Blind Count Audits, and Discrepancy Identification.
* **RBAC PERMISSIONS:** `stocktake:read`, `stocktake:count`, `stocktake:reconcile`, `stocktake:admin`
* **STATE MACHINES:** `PLANNED` → `IN_PROGRESS` → `COUNTED` → `RECOUNT_REQUIRED` → `RECONCILED` → `COMPLETED`.
* **CORE ENTITIES:** `stocktakes`, `stocktake_items`, `stocktake_counts`.
* **INPUTS:** Warehouse selection, item scope, physical counter inputs.
* **OUTPUTS:** Stocktake variance reports, adjustment requests for Module 10.
* **UPSTREAM MODULES:** M03 (Inventory Balances), M06 (Warehouse Locations).
* **DOWNSTREAM MODULES:** M10 (Stock Adjustment), M37 (Audit Log).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 23).
* **READ ADAPTER:** `GET /api/stocktake`.
* **NAVIGATION ADAPTER:** Supported via `stocktake` state.
* **ACTION ADAPTER:** Pending recount task alerts.
* **CURRENT UI STATUS:** WORKING (Multi-round blind counting UI, variance comparison table).
* **EVIDENCE:** `src/pages/Stocktake.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 10: Stock Adjustment
* **MODULE ID:** M10
* **MODULE NAME:** Stock Adjustment (Discrepancy Remediation)
* **BUSINESS DOMAIN:** INVENTORY / WMS
* **BUSINESS PURPOSE:** Formal approval workflow, root-cause categorization (`DAMAGED`, `LOST`, `EXPIRED`, `VARIANCE`), and idempotent stock reconciliation postings.
* **PRIMARY ROUTE:** `/stock-adjustment` (App state: `adjustment`)
* **RELATED ROUTES:** `/stocktake`, `/inventory`, `/stock`
* **PRIMARY UI ENTRY POINT:** `src/pages/StockAdjustment.tsx`
* **PRIMARY API:** `GET /api/stock-adjustments`, `POST /api/stock-adjustments`
* **RELATED APIs:** `POST /api/stock-adjustments/:id/approve`, `POST /api/stock-adjustments/:id/reject`
* **PRIMARY DOMAIN SERVICE:** `server/stockAdjustmentService.ts` (`StockAdjustmentService`)
* **DOMAIN AUTHORITY:** Exclusive Authority for Inventory Adjustment Proposals, Approval Governance, and Variance Reasons.
* **RBAC PERMISSIONS:** `stock_adjustment:read`, `stock_adjustment:create`, `stock_adjustment:approve`
* **STATE MACHINES:** `DRAFT` → `PENDING_APPROVAL` → `APPROVED` → `POSTED` (Immutable) / `REJECTED`.
* **CORE ENTITIES:** `stock_adjustments`, `stock_adjustment_items`.
* **INPUTS:** Stocktake variances (M09), quality defect write-offs (M34), damaged goods notices.
* **OUTPUTS:** Approved inventory mutation commands executed through Module 03 (`InventoryService`).
* **UPSTREAM MODULES:** M09 (Stocktake), M34 (Quality Control).
* **DOWNSTREAM MODULES:** M03 (Inventory Ledger), M08 (GL Adjustment Posting).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 24).
* **READ ADAPTER:** `GET /api/stock-adjustments`.
* **NAVIGATION ADAPTER:** Supported via `adjustment` state.
* **ACTION ADAPTER:** Pending adjustment approval work items.
* **CURRENT UI STATUS:** WORKING (Approval workflow UI, reason code selector, idempotent submission).
* **EVIDENCE:** `src/pages/StockAdjustment.tsx`, `server/stockAdjustmentService.ts`.

---

### Module 11: Customer Management
* **MODULE ID:** M11
* **MODULE NAME:** Customer Master Management
* **BUSINESS DOMAIN:** MASTER DATA / CRM
* **BUSINESS PURPOSE:** Enterprise customer master profiles, credit limit parameters, pricing tiers, customer classification, and contact directories.
* **PRIMARY ROUTE:** `/customers` (App state: `customers`)
* **RELATED ROUTES:** `/crm`, `/sales`, `/invoices`
* **PRIMARY UI ENTRY POINT:** `src/pages/Customers.tsx`
* **PRIMARY API:** `GET /api/customers`, `POST /api/customers`
* **RELATED APIs:** `GET /api/customers/:id/statement`, `PUT /api/customers/:id/credit-limit`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Customer Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Customer Master Records and Credit Limit Configuration.
* **RBAC PERMISSIONS:** `customers:read`, `customers:write`, `customers:credit_admin`
* **STATE MACHINES:** `PROSPECT` → `ACTIVE` → `CREDIT_HOLD` → `INACTIVE`.
* **CORE ENTITIES:** `customers`, `customer_contacts`, `credit_profiles`.
* **INPUTS:** Onboarding questionnaires, credit evaluation documents.
* **OUTPUTS:** Customer master profiles, credit status indicators.
* **UPSTREAM MODULES:** M33 (CRM Leads).
* **DOWNSTREAM MODULES:** M05 (Sales Orders), M22 (Invoices AR).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 17).
* **READ ADAPTER:** `GET /api/customers`.
* **NAVIGATION ADAPTER:** Supported via `customers` state.
* **ACTION ADAPTER:** Customer directory lookup.
* **CURRENT UI STATUS:** WORKING (Customer directory table, credit status badges, contact detail drawer).
* **EVIDENCE:** `src/pages/Customers.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 12: Supplier Management
* **MODULE ID:** M12
* **MODULE NAME:** Supplier Master Management
* **BUSINESS DOMAIN:** MASTER DATA / SRM
* **BUSINESS PURPOSE:** Vendor master data management, supplier qualification vetting, payment terms configuration, and supplier directory maintenance.
* **PRIMARY ROUTE:** `/suppliers` (App state: `suppliers`)
* **RELATED ROUTES:** `/srm`, `/strategic-sourcing`, `/purchase`
* **PRIMARY UI ENTRY POINT:** `src/pages/Suppliers.tsx`
* **PRIMARY API:** `GET /api/suppliers`, `POST /api/suppliers`
* **RELATED APIs:** `GET /api/suppliers/:id/performance`, `PUT /api/suppliers/:id/status`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Supplier Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Supplier Master Profiles and Vendor Qualification Status.
* **RBAC PERMISSIONS:** `suppliers:read`, `suppliers:write`, `suppliers:admin`
* **STATE MACHINES:** `PROSPECT` → `QUALIFIED` → `ACTIVE` → `SUSPENDED` → `BLACKLISTED`.
* **CORE ENTITIES:** `suppliers`, `supplier_contacts`, `vendor_payment_terms`.
* **INPUTS:** Vendor registration requests, tax forms, banking details.
* **OUTPUTS:** Approved supplier catalog, active vendor status.
* **UPSTREAM MODULES:** M29 (Strategic Sourcing RFP).
* **DOWNSTREAM MODULES:** M04 (Purchase Orders), M30 (SRM Scorecards), M22 (Accounts Payable).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 20).
* **READ ADAPTER:** `GET /api/suppliers`.
* **NAVIGATION ADAPTER:** Supported via `suppliers` state.
* **ACTION ADAPTER:** Vendor verification tasks.
* **CURRENT UI STATUS:** WORKING (Supplier directory, qualification status, and banking info view).
* **EVIDENCE:** `src/pages/Suppliers.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 13: EAM / CMMS (Enterprise Asset Management)
* **MODULE ID:** M13
* **MODULE NAME:** Enterprise Asset Management & Maintenance
* **BUSINESS DOMAIN:** EAM / CMMS
* **BUSINESS PURPOSE:** Physical plant equipment registers, preventive maintenance scheduling, corrective work orders, and equipment meter tracking.
* **PRIMARY ROUTE:** `/eam` (App state: `assets`)
* **RELATED ROUTES:** `/manufacturing`
* **PRIMARY UI ENTRY POINT:** `src/pages/EAM.tsx`
* **PRIMARY API:** `GET /api/eam/assets`, `POST /api/eam/work-orders`
* **RELATED APIs:** `GET /api/eam/maintenance-schedules`, `POST /api/eam/work-orders/:id/complete`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (EAM Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Plant Asset Condition, Maintenance Schedules, and Work Orders.
* **RBAC PERMISSIONS:** `eam:read`, `eam:write`, `eam:maintenance_admin`
* **STATE MACHINES:** `OPERATIONAL` → `MAINTENANCE_REQUIRED` → `UNDER_REPAIR` → `DECOMMISSIONED`.
* **CORE ENTITIES:** `eam_assets`, `maintenance_work_orders`, `preventive_schedules`.
* **INPUTS:** Equipment telemetry, operating hours, incident tickets.
* **OUTPUTS:** Maintenance work orders, spare part requests for M03.
* **UPSTREAM MODULES:** Module 06 (Warehouse Facilities), Module 19 (Manufacturing Machines).
* **DOWNSTREAM MODULES:** M03 (Spare Parts), M32 (Fixed Asset Accounting).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 31).
* **READ ADAPTER:** `GET /api/eam/assets`.
* **NAVIGATION ADAPTER:** Supported via `assets` state.
* **ACTION ADAPTER:** Equipment maintenance alerts.
* **CURRENT UI STATUS:** WORKING (Asset grid, health indicators, maintenance calendar).
* **EVIDENCE:** `src/pages/EAM.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 14: TMS / Transportation & Logistics Management
* **MODULE ID:** M14
* **MODULE NAME:** Transportation & Logistics Management
* **BUSINESS DOMAIN:** LOGISTICS / TMS
* **BUSINESS PURPOSE:** Shipment planning, freight carrier rating, delivery routing, transport manifest generation, and shipment status tracking.
* **PRIMARY ROUTE:** `/logistics` (App state: `logistics`)
* **RELATED ROUTES:** `/sales`, `/purchase`, `/wms-extended`
* **PRIMARY UI ENTRY POINT:** `src/pages/Logistics.tsx`
* **PRIMARY API:** `GET /api/logistics/shipments`, `POST /api/logistics/shipments`
* **RELATED APIs:** `GET /api/logistics/carriers`, `POST /api/logistics/shipments/:id/dispatch`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Logistics Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Transport Manifests, Carrier Dispatches, and Route Tracking.
* **RBAC PERMISSIONS:** `logistics:read`, `logistics:dispatch`, `logistics:admin`
* **STATE MACHINES:** `PLANNED` → `TENDERED` → `DISPATCHED` → `IN_TRANSIT` → `DELIVERED` → `FAILED`.
* **CORE ENTITIES:** `shipments`, `transport_loads`, `carriers`, `delivery_manifests`.
* **INPUTS:** Outbound sales order lines (M05), inbound purchase orders (M04).
* **OUTPUTS:** Shipping waybills, POD delivery confirmations, freight charges for GL.
* **UPSTREAM MODULES:** M05 (Sales Orders), M40 (WMS Picking / Packing).
* **DOWNSTREAM MODULES:** M08 (Freight Expense Accounting), M05 (Order Fulfillment Status).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 33).
* **READ ADAPTER:** `GET /api/logistics/shipments`.
* **NAVIGATION ADAPTER:** Supported via `logistics` state.
* **ACTION ADAPTER:** In-transit shipment tracking.
* **CURRENT UI STATUS:** WORKING (Shipment manifests, carrier assignment, tracking map view).
* **EVIDENCE:** `src/pages/Logistics.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 15: SCP / MRP (Supply Chain & Material Planning)
* **MODULE ID:** M15
* **MODULE NAME:** Supply Chain Planning & MRP Netting
* **BUSINESS DOMAIN:** MES / MRP / SCP
* **BUSINESS PURPOSE:** Material Requirements Planning (MRP), Master Production Scheduling (MPS), inventory netting, and planned purchase/production order generation.
* **PRIMARY ROUTE:** `/supply-chain` (App state: `supply_chain`)
* **RELATED ROUTES:** `/manufacturing`, `/purchase`
* **PRIMARY UI ENTRY POINT:** `src/pages/SupplyChain.tsx`
* **PRIMARY API:** `GET /api/scm/plans`, `POST /api/scm/mrp-run`
* **RELATED APIs:** `GET /api/scm/demand-forecast`, `POST /api/scm/planned-orders/release`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (SCM Service)
* **DOMAIN AUTHORITY:** Exclusive Authority for Material Requirements Calculations and Planned Order Proposals.
* **RBAC PERMISSIONS:** `scm:read`, `scm:plan`, `scm:release_orders`
* **STATE MACHINES:** `GENERATED` → `REVIEWED` → `RELEASED_TO_PO` / `RELEASED_TO_MO`.
* **CORE ENTITIES:** `mrp_runs`, `planned_orders`, `demand_forecasts`.
* **INPUTS:** Sales demand forecasts (M05), stock levels (M03), BOM definitions (M19).
* **OUTPUTS:** Planned purchase requisitions (M04), planned manufacturing orders (M19).
* **UPSTREAM MODULES:** M05 (Sales Demand), M03 (Inventory Balances), M02 (Product BOM).
* **DOWNSTREAM MODULES:** M04 (Procurement), M19 (Manufacturing Execution).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 30).
* **READ ADAPTER:** `GET /api/scm/plans`.
* **NAVIGATION ADAPTER:** Supported via `supply_chain` state.
* **ACTION ADAPTER:** MRP shortfall warning alerts.
* **CURRENT UI STATUS:** WORKING (Supply chain forecast cards, netting summary, planned order converter).
* **EVIDENCE:** `src/pages/SupplyChain.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 16: Workflow & Notifications (Event & Alert Engine)
* **MODULE ID:** M16
* **MODULE NAME:** System Alerts & Notification Engine
* **BUSINESS DOMAIN:** GOVERNANCE / AUDIT
* **BUSINESS PURPOSE:** Multi-channel system alerts, threshold notifications, operational warning triggers, and user message queuing.
* **PRIMARY ROUTE:** `/alerts` (App state: `alerts`)
* **RELATED ROUTES:** `/event-bus`
* **PRIMARY UI ENTRY POINT:** `src/pages/Alerts.tsx`
* **PRIMARY API:** `GET /api/alerts`, `POST /api/alerts/:id/acknowledge`
* **RELATED APIs:** `GET /api/alerts/summary`, `POST /api/alerts/dismiss-all`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Alert Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for System Operational Alerts and Notification Subscriptions.
* **RBAC PERMISSIONS:** `alerts:read`, `alerts:acknowledge`, `alerts:admin`
* **STATE MACHINES:** `NEW` → `ACKNOWLEDGED` → `RESOLVED` → `DISMISSED`.
* **CORE ENTITIES:** `system_alerts`, `notification_logs`, `alert_rules`.
* **INPUTS:** Threshold triggers from stock, expiry dates, failed payments, and unassigned tasks.
* **OUTPUTS:** Real-time toast notifications, badge counters, alert records.
* **UPSTREAM MODULES:** All modules producing business exceptions.
* **DOWNSTREAM MODULES:** M01 (Workspace Hub Badge Aggregation).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (Badge listener active in Layout).
* **READ ADAPTER:** `GET /api/alerts`.
* **NAVIGATION ADAPTER:** Supported via `alerts` state.
* **ACTION ADAPTER:** Alert dismissal and navigation to source module.
* **CURRENT UI STATUS:** WORKING (Severity-coded alert list, acknowledge controls, filter tabs).
* **EVIDENCE:** `src/pages/Alerts.tsx`, `src/components/Layout.tsx`.

---

### Module 17: Enterprise Planning / Strategic Sourcing RFQ
* **MODULE ID:** M17
* **MODULE NAME:** Strategic Sourcing & RFQ Management
* **BUSINESS DOMAIN:** P2P / SRM
* **BUSINESS PURPOSE:** Request for Proposal (RFP), Request for Quotation (RFQ), supplier bid comparison, technical evaluation, and contract awarding.
* **PRIMARY ROUTE:** `/strategic-sourcing` (App state: `srm_rfq`)
* **RELATED ROUTES:** `/srm`, `/suppliers`, `/purchase`
* **PRIMARY UI ENTRY POINT:** `src/pages/StrategicSourcing.tsx`
* **PRIMARY API:** `GET /api/sourcing/rfps`, `POST /api/sourcing/rfps`
* **RELATED APIs:** `POST /api/sourcing/rfps/:id/bid`, `POST /api/sourcing/rfps/:id/award`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Strategic Sourcing Service)
* **DOMAIN AUTHORITY:** Exclusive Authority for Sourcing RFQ Packages, Supplier Bidding, and Award Decisions.
* **RBAC PERMISSIONS:** `sourcing:read`, `sourcing:create`, `sourcing:evaluate`, `sourcing:award`
* **STATE MACHINES:** `DRAFT` → `PUBLISHED` → `BIDDING_OPEN` → `EVALUATION` → `AWARDED` → `CLOSED`.
* **CORE ENTITIES:** `sourcing_rfps`, `rfp_bids`, `supplier_bid_scores`.
* **INPUTS:** Procurement demand packages, supplier quotes.
* **OUTPUTS:** Awarded contract records, converted purchase orders for M04.
* **UPSTREAM MODULES:** M04 (Procurement Demand), M12 (Supplier Master).
* **DOWNSTREAM MODULES:** M04 (Purchase Orders), M30 (SRM Evaluation).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 43).
* **READ ADAPTER:** `GET /api/sourcing/rfps`.
* **NAVIGATION ADAPTER:** Supported via `srm_rfq` state.
* **ACTION ADAPTER:** RFQ bid evaluation tasks.
* **CURRENT UI STATUS:** WORKING (Comprehensive RFQ lifecycle workbench with bid comparison matrix).
* **EVIDENCE:** `src/pages/StrategicSourcing.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 18: HR / Human Resources Management
* **MODULE ID:** M18
* **MODULE NAME:** HR & Personnel Management
* **BUSINESS DOMAIN:** HR / HCM
* **BUSINESS PURPOSE:** Employee master profiles, departmental organizational structures, job position management, employment contracts, and employee onboarding.
* **PRIMARY ROUTE:** `/hr` (App state: `hr`)
* **RELATED ROUTES:** `/super-admin`
* **PRIMARY UI ENTRY POINT:** `src/pages/HRManagement.tsx`
* **PRIMARY API:** `GET /api/hr/employees`, `POST /api/hr/employees`
* **RELATED APIs:** `GET /api/hr/departments`, `GET /api/hr/positions`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (HR Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Employee Master Records, Departmental Hierarchies, and Position Control.
* **RBAC PERMISSIONS:** `hr:read`, `hr:write`, `hr:payroll_admin`
* **STATE MACHINES:** `ONBOARDING` → `ACTIVE` → `ON_LEAVE` → `TERMINATED`.
* **CORE ENTITIES:** `employees`, `departments`, `positions`, `employment_contracts`.
* **INPUTS:** Employee hiring requests, department re-organizations.
* **OUTPUTS:** Active employee roster, user identities for IAM (M01).
* **UPSTREAM MODULES:** Module 38 (System Administration).
* **DOWNSTREAM MODULES:** M01 (IAM Users), M26 (Sales Rep Commission), M39 (Project Resource Assignment).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 34).
* **READ ADAPTER:** `GET /api/hr/employees`.
* **NAVIGATION ADAPTER:** Supported via `hr` state.
* **ACTION ADAPTER:** Employee profile lookups.
* **CURRENT UI STATUS:** WORKING (Employee directory, department tree, position management).
* **EVIDENCE:** `src/pages/HRManagement.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 19: Manufacturing / MES (Shop Floor Execution)
* **MODULE ID:** M19
* **MODULE NAME:** Manufacturing Execution (MES & BOM)
* **BUSINESS DOMAIN:** MES / MRP / SCP
* **BUSINESS PURPOSE:** Bill of Materials (BOM) management, production work orders, routing operations, shop floor dispatching, material consumption, and finished goods receipt.
* **PRIMARY ROUTE:** `/manufacturing` (App state: `manufacturing`)
* **RELATED ROUTES:** `/subcontracting`, `/supply-chain`, `/quality`
* **PRIMARY UI ENTRY POINT:** `src/pages/Manufacturing.tsx`
* **PRIMARY API:** `GET /api/manufacturing/orders`, `POST /api/manufacturing/orders`
* **RELATED APIs:** `POST /api/manufacturing/orders/:id/issue-materials`, `POST /api/manufacturing/orders/:id/complete`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Manufacturing Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Production Work Orders, Shop Floor Status, and Finished Goods Production Records.
* **RBAC PERMISSIONS:** `manufacturing:read`, `manufacturing:create`, `manufacturing:execute`, `manufacturing:complete`
* **STATE MACHINES:** `PLANNED` → `RELEASED` → `IN_PRODUCTION` → `QUALITY_CHECK` → `COMPLETED` → `CLOSED`.
* **CORE ENTITIES:** `manufacturing_orders`, `bill_of_materials`, `bom_items`, `operation_routings`.
* **INPUTS:** Planned work orders (M15), raw material availability (M03).
* **OUTPUTS:** Material consumption requests for M03, finished product receipts, scrap logs.
* **UPSTREAM MODULES:** M02 (Product Master), M15 (MRP Planning), M03 (Raw Materials).
* **DOWNSTREAM MODULES:** M03 (Finished Goods Stock), M07 (Manufacturing Costing), M34 (QC).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 29).
* **READ ADAPTER:** `GET /api/manufacturing/orders`.
* **NAVIGATION ADAPTER:** Supported via `manufacturing` state.
* **ACTION ADAPTER:** Work order dispatch tasks.
* **CURRENT UI STATUS:** WORKING (BOM tree builder, work order progress tracking, material issuance modal).
* **EVIDENCE:** `src/pages/Manufacturing.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 20: Subcontracting Management (Production Completeness)
* **MODULE ID:** M20
* **MODULE NAME:** Subcontracting & External Processing
* **BUSINESS DOMAIN:** MES / MRP / SCP
* **BUSINESS PURPOSE:** Outbound material tracking to external vendors, toll manufacturing work orders, external processing fee settlements, and return of finished goods.
* **PRIMARY ROUTE:** `/subcontracting` (App state: `subcontracting`)
* **RELATED ROUTES:** `/manufacturing`, `/purchase`
* **PRIMARY UI ENTRY POINT:** `src/components/SubcontractingManagement.tsx`
* **PRIMARY API:** `GET /api/subcontracting/orders`, `POST /api/subcontracting/orders`
* **RELATED APIs:** `POST /api/subcontracting/orders/:id/ship-components`, `POST /api/subcontracting/orders/:id/receive`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Subcontracting Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Subcontracting Orders, External Processing Work Orders, and Subcontractor Material Tracking.
* **RBAC PERMISSIONS:** `subcontracting:read`, `subcontracting:create`, `subcontracting:execute`
* **STATE MACHINES:** `DRAFT` → `COMPONENTS_SHIPPED` → `IN_PROCESSING` → `RECEIVED` → `SETTLED`.
* **CORE ENTITIES:** `subcontracting_orders`, `subcontracting_components`, `subcontractor_receipts`.
* **INPUTS:** Subcontracted BOM steps (M19), raw components (M03).
* **OUTPUTS:** Component issue vouchers, processed subassembly receipts.
* **UPSTREAM MODULES:** M19 (Manufacturing), M12 (Supplier / Subcontractor).
* **DOWNSTREAM MODULES:** M03 (Inventory Ledger), M08 (Subcontracting Expense GL).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (Rendered in App.tsx).
* **READ ADAPTER:** Mapped via subcontracting controller.
* **NAVIGATION ADAPTER:** Supported via `subcontracting` state.
* **ACTION ADAPTER:** Subcontracting dispatch tasks.
* **CURRENT UI STATUS:** WORKING (Complete subcontracting order lifecycle component).
* **EVIDENCE:** `src/components/SubcontractingManagement.tsx`, `src/App.tsx`.

---

### Module 21: Enterprise Consolidation (FICO Consolidation)
* **MODULE ID:** M21
* **MODULE NAME:** Financial Consolidation (FICO Consolidation)
* **BUSINESS DOMAIN:** FINANCE / FICO
* **BUSINESS PURPOSE:** Multi-entity financial consolidation, intercompany account elimination, currency translation adjustments, and group financial reporting.
* **PRIMARY ROUTE:** `/financial-consolidation` (App state: `fico_consolidation`)
* **RELATED ROUTES:** `/accounting`, `/finance`
* **PRIMARY UI ENTRY POINT:** `src/pages/FinancialConsolidation.tsx`
* **PRIMARY API:** `GET /api/consolidation`, `POST /api/consolidation/run`
* **RELATED APIs:** `GET /api/consolidation/eliminations`, `GET /api/consolidation/reports`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Consolidation Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Corporate Consolidated Financial Statements and Intercompany Eliminations.
* **RBAC PERMISSIONS:** `consolidation:read`, `consolidation:run`, `consolidation:admin`
* **STATE MACHINES:** `OPEN` → `EXTRACTING` → `ELIMINATING` → `CONSOLIDATED` → `LOCKED`.
* **CORE ENTITIES:** `consolidation_runs`, `intercompany_eliminations`, `consolidated_balances`.
* **INPUTS:** Legal entity trial balances (M08), exchange rates (M30).
* **OUTPUTS:** Consolidated Balance Sheet, Consolidated P&L, elimination audit reports.
* **UPSTREAM MODULES:** M08 (General Ledger), M29 (Legal Entities).
* **DOWNSTREAM MODULES:** M24 (Executive BI Analytics).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 39).
* **READ ADAPTER:** `GET /api/consolidation`.
* **NAVIGATION ADAPTER:** Supported via `fico_consolidation` state.
* **ACTION ADAPTER:** Consolidation run status alerts.
* **CURRENT UI STATUS:** WORKING (Consolidation workbench, elimination rule table, group statement preview).
* **EVIDENCE:** `src/pages/FinancialConsolidation.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 22: Invoices AR/AP (Commercial Billing)
* **MODULE ID:** M22
* **MODULE NAME:** Invoices Management (AR & AP Billing)
* **BUSINESS DOMAIN:** FINANCE / FICO
* **BUSINESS PURPOSE:** Customer sales invoicing (Accounts Receivable) and vendor purchase invoicing (Accounts Payable), payment status tracking, and tax calculation.
* **PRIMARY ROUTE:** `/invoices` (App state: `invoices`)
* **RELATED ROUTES:** `/payments`, `/sales`, `/purchase`
* **PRIMARY UI ENTRY POINT:** `src/pages/Invoices.tsx`
* **PRIMARY API:** `GET /api/invoices`, `POST /api/invoices`
* **RELATED APIs:** `POST /api/invoices/:id/post`, `POST /api/invoices/:id/cancel`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Invoice Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Customer and Vendor Tax Invoices and Billing Schedules.
* **RBAC PERMISSIONS:** `invoices:read`, `invoices:create`, `invoices:post`, `invoices:void`
* **STATE MACHINES:** `DRAFT` → `ISSUED` → `PARTIALLY_PAID` → `PAID` → `OVERDUE` → `VOIDED`.
* **CORE ENTITIES:** `invoices`, `invoice_lines`, `invoice_tax_details`.
* **INPUTS:** Sales order delivery slips (M05), purchase order goods receipts (M04).
* **OUTPUTS:** Tax invoice documents, AR/AP subledger postings for Module 08.
* **UPSTREAM MODULES:** M05 (Sales Orders), M04 (Purchase Orders).
* **DOWNSTREAM MODULES:** M23 (Payments Treasury), M08 (General Ledger).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 36).
* **READ ADAPTER:** `GET /api/invoices`.
* **NAVIGATION ADAPTER:** Supported via `invoices` state.
* **ACTION ADAPTER:** Overdue invoice alerts.
* **CURRENT UI STATUS:** WORKING (Dual AR/AP tabbed invoice table, creation modal, tax summary).
* **EVIDENCE:** `src/pages/Invoices.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 23: Payments & Treasury Operations
* **MODULE ID:** M23
* **MODULE NAME:** Payments & Treasury Management
* **BUSINESS DOMAIN:** FINANCE / FICO
* **BUSINESS PURPOSE:** Customer payment collections, vendor disbursements, payment batch generation, cash book logs, and treasury operations.
* **PRIMARY ROUTE:** `/payments` (App state: `payments`)
* **RELATED ROUTES:** `/invoices`, `/bank-reconciliation`, `/finance`
* **PRIMARY UI ENTRY POINT:** `src/pages/Payments.tsx`
* **PRIMARY API:** `GET /api/payments`, `POST /api/payments`
* **RELATED APIs:** `POST /api/payments/:id/approve`, `POST /api/payments/:id/execute`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Payment Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Cash Vouchers, Bank Disbursements, and Customer Receipts.
* **RBAC PERMISSIONS:** `payments:read`, `payments:create`, `payments:approve`, `payments:execute`
* **STATE MACHINES:** `PENDING` → `APPROVED` → `EXECUTED` / `SETTLED` → `RECONCILED` → `CANCELLED`.
* **CORE ENTITIES:** `payments`, `payment_allocations`, `cash_books`.
* **INPUTS:** Approved AP invoices (M22), customer AR receivables (M22).
* **OUTPUTS:** Payment execution vouchers, cash clearing entries for Module 08.
* **UPSTREAM MODULES:** M22 (Invoices AR/AP).
* **DOWNSTREAM MODULES:** M24 (Bank Reconciliation), M08 (General Ledger Cash Postings).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 37).
* **READ ADAPTER:** `GET /api/payments`.
* **NAVIGATION ADAPTER:** Supported via `payments` state.
* **ACTION ADAPTER:** Payment disbursement approval items.
* **CURRENT UI STATUS:** WORKING (Payment ledger, receipt/payment voucher generation, multi-currency display).
* **EVIDENCE:** `src/pages/Payments.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 24: Bank Reconciliation & Statements
* **MODULE ID:** M24
* **MODULE NAME:** Bank Reconciliation & Clearing
* **BUSINESS DOMAIN:** FINANCE / FICO
* **BUSINESS PURPOSE:** Bank statement imports, automated algorithmic statement matching, bank balance reconciliation, and cash clearing audits.
* **PRIMARY ROUTE:** `/bank-reconciliation` (App state: `bank_reconciliation`)
* **RELATED ROUTES:** `/payments`, `/finance`, `/accounting`
* **PRIMARY UI ENTRY POINT:** `src/pages/BankReconciliation.tsx`
* **PRIMARY API:** `GET /api/bank-reconciliation`, `POST /api/bank-reconciliation/match`
* **RELATED APIs:** `POST /api/bank-reconciliation/upload-statement`, `POST /api/bank-reconciliation/unmatch`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Bank Reconciliation Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Bank Statement Matching Records and Bank Account Cleared Balances.
* **RBAC PERMISSIONS:** `bank_recon:read`, `bank_recon:import`, `bank_recon:reconcile`
* **STATE MACHINES:** `UNMATCHED` → `SUGGESTED_MATCH` → `RECONCILED` → `EXCEPTION`.
* **CORE ENTITIES:** `bank_statements`, `bank_statement_lines`, `reconciliation_matches`.
* **INPUTS:** Bank statement files (OFX/CSV), payments ledger records (M23).
* **OUTPUTS:** Reconciled bank balance reports, bank charge adjustment vouchers.
* **UPSTREAM MODULES:** M23 (Payments & Treasury).
* **DOWNSTREAM MODULES:** M08 (General Ledger Cash Reconciliation).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 38).
* **READ ADAPTER:** `GET /api/bank-reconciliation`.
* **NAVIGATION ADAPTER:** Supported via `bank_reconciliation` state.
* **ACTION ADAPTER:** Unmatched statement line alerts.
* **CURRENT UI STATUS:** WORKING (Dual-pane matching workbench with fuzzy match algorithms).
* **EVIDENCE:** `src/pages/BankReconciliation.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 25: Business Intelligence & Executive Dashboard
* **MODULE ID:** M25
* **MODULE NAME:** Executive Business Overview Dashboard
* **BUSINESS DOMAIN:** GOVERNANCE / AUDIT
* **BUSINESS PURPOSE:** High-level KPI scorecards, cross-module financial and operational summaries, revenue trends, and inventory health metrics.
* **PRIMARY ROUTE:** `/dashboard` (App state: `dashboard`)
* **RELATED ROUTES:** `/reports`, `/workspace`
* **PRIMARY UI ENTRY POINT:** `src/pages/Dashboard.tsx`
* **PRIMARY API:** `GET /api/dashboard/metrics`, `GET /api/dashboard/revenue-trend`
* **RELATED APIs:** `GET /api/dashboard/inventory-health`, `GET /api/dashboard/top-products`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Dashboard Metrics Service)
* **DOMAIN AUTHORITY:** Exclusive Authority for Consolidated Analytical Presentation Views.
* **RBAC PERMISSIONS:** `dashboard:read`, `dashboard:executive_view`
* **STATE MACHINES:** Real-time Aggregated Analytical State.
* **CORE ENTITIES:** Analytical metric snapshots (read-only projections).
* **INPUTS:** Aggregated data from M03, M04, M05, M08, M22, M23.
* **OUTPUTS:** Executive visual KPI charts, trend analytics, alert widgets.
* **UPSTREAM MODULES:** All operational and financial modules.
* **DOWNSTREAM MODULES:** Executive User Decision Support.
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`App.tsx` default landing view).
* **READ ADAPTER:** `GET /api/dashboard/metrics`.
* **NAVIGATION ADAPTER:** Supported via `dashboard` state.
* **ACTION ADAPTER:** Quick-link navigation to functional modules.
* **CURRENT UI STATUS:** WORKING (Modern analytics dashboard with Recharts visual graphs).
* **EVIDENCE:** `src/pages/Dashboard.tsx`, `src/App.tsx`.

---

### Module 26: Commission & Sales Incentive Management
* **MODULE ID:** M26
* **MODULE NAME:** Sales Commission & Incentive Management
* **BUSINESS DOMAIN:** O2C / COMMERCE
* **BUSINESS PURPOSE:** Tiered commission rule setup, sales representative quota attainment, commission calculations, return clawbacks, and double-entry VAS commission postings.
* **PRIMARY ROUTE:** `/commission` (App state: `commission`)
* **RELATED ROUTES:** `/sales`, `/accounting`, `/hr`
* **PRIMARY UI ENTRY POINT:** `src/pages/Commission.tsx`
* **PRIMARY API:** `GET /api/commission`, `POST /api/commission/calculate`
* **RELATED APIs:** `POST /api/commission/settle`, `GET /api/commission/plans`
* **PRIMARY DOMAIN SERVICE:** `server/commissionService.ts` (`CommissionService`)
* **DOMAIN AUTHORITY:** Exclusive Authority for Commission Plan Rules, Representative Attainments, and Incentive Payout Calculations.
* **RBAC PERMISSIONS:** `commission:read`, `commission:calculate`, `commission:approve`, `commission:admin`
* **STATE MACHINES:** `CALCULATED` → `APPROVED` → `SETTLED` → `POSTED_TO_GL`.
* **CORE ENTITIES:** `commission_plans`, `commission_records`, `sales_quotas`.
* **INPUTS:** Invoiced sales orders (M05), customer returns (M27), sales reps (M18).
* **OUTPUTS:** Commission calculation lines, double-entry GL expense vouchers (VAS 6418/3388).
* **UPSTREAM MODULES:** M05 (Sales Orders), M18 (HR Reps), M27 (Returns).
* **DOWNSTREAM MODULES:** M08 (General Ledger Commission Expenses), M23 (Disbursements).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 40).
* **READ ADAPTER:** `GET /api/commission`.
* **NAVIGATION ADAPTER:** Supported via `commission` state.
* **ACTION ADAPTER:** Pending commission approval tasks.
* **CURRENT UI STATUS:** WORKING (Tiered plan builder, calculation simulator, settlement ledger).
* **EVIDENCE:** `src/pages/Commission.tsx`, `server/commissionService.ts`.

---

### Module 27: Returns & RMA Management
* **MODULE ID:** M27
* **MODULE NAME:** Returns & RMA Management
* **BUSINESS DOMAIN:** O2C / INVENTORY
* **BUSINESS PURPOSE:** Return Merchandise Authorization (RMA), customer return receiving, return-to-vendor dispatches, inspection disposition, and credit memo issuance.
* **PRIMARY ROUTE:** `/returns` (App state: `returns`)
* **RELATED ROUTES:** `/sales`, `/inventory`, `/invoices`
* **PRIMARY UI ENTRY POINT:** `src/pages/Returns.tsx`
* **PRIMARY API:** `GET /api/returns`, `POST /api/returns`
* **RELATED APIs:** `POST /api/returns/:id/receive`, `POST /api/returns/:id/credit`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Returns Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Return Merchandise Authorizations and Return Reason Tracking.
* **RBAC PERMISSIONS:** `returns:read`, `returns:create`, `returns:receive`, `returns:credit`
* **STATE MACHINES:** `REQUESTED` → `AUTHORIZED` → `RECEIVED` → `INSPECTED` → `CREDITED` / `REPLACED`.
* **CORE ENTITIES:** `return_orders`, `return_order_items`, `rma_dispositions`.
* **INPUTS:** Delivered sales orders (M05), customer complaints.
* **OUTPUTS:** Return receiving slips for M03, AR Credit Memos for M22.
* **UPSTREAM MODULES:** M05 (Sales Orders).
* **DOWNSTREAM MODULES:** M03 (Restocking), M22 (Credit Memos), M26 (Commission Clawbacks).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 41).
* **READ ADAPTER:** `GET /api/returns`.
* **NAVIGATION ADAPTER:** Supported via `returns` state.
* **ACTION ADAPTER:** RMA approval and receiving tasks.
* **CURRENT UI STATUS:** WORKING (RMA registry, inspection disposition form, credit action).
* **EVIDENCE:** `src/pages/Returns.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 28: Retail POS (Point of Sale)
* **MODULE ID:** M28
* **MODULE NAME:** Point of Sale (Retail POS)
* **BUSINESS DOMAIN:** O2C / COMMERCE
* **BUSINESS PURPOSE:** High-speed retail checkout, cashier session management, barcode scanning, instant receipt printing, cash drawer reconciliation, and immediate inventory depletion.
* **PRIMARY ROUTE:** `/pos` (App state: `pos`)
* **RELATED ROUTES:** `/sales`, `/inventory`, `/payments`
* **PRIMARY UI ENTRY POINT:** `src/pages/POS.tsx`
* **PRIMARY API:** `GET /api/pos/sessions`, `POST /api/pos/checkout`
* **RELATED APIs:** `POST /api/pos/sessions/open`, `POST /api/pos/sessions/close`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (POS Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Retail Register Sessions and High-Velocity Point-of-Sale Transactions.
* **RBAC PERMISSIONS:** `pos:read`, `pos:cashier`, `pos:manager`
* **STATE MACHINES:** Cashier Session (`CLOSED` → `OPEN` → `RECONCILING` → `CLOSED`).
* **CORE ENTITIES:** `pos_sessions`, `pos_sales`, `pos_sale_items`.
* **INPUTS:** Cashier inputs, barcode scanner events, customer cash/card tenders.
* **OUTPUTS:** POS receipt printouts, immediate stock issue postings (M03), daily cash clearing (M08).
* **UPSTREAM MODULES:** M02 (Product Master), M03 (Inventory Balances).
* **DOWNSTREAM MODULES:** M03 (Stock Reduction), M08 (Retail Cash GL), M23 (Payment Ledger).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 42).
* **READ ADAPTER:** `GET /api/pos/sessions`.
* **NAVIGATION ADAPTER:** Supported via `pos` state.
* **ACTION ADAPTER:** Cashier terminal launch.
* **CURRENT UI STATUS:** WORKING (Full-screen cashier interface, product quick-pick grid, tender modal).
* **EVIDENCE:** `src/pages/POS.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 29: Strategic Sourcing (Procurement RFQ)
* **MODULE ID:** M29
* **MODULE NAME:** Strategic Sourcing RFP / RFQ
* **BUSINESS DOMAIN:** P2P / SRM
* **BUSINESS PURPOSE:** Formal competitive bidding, multi-vendor proposal requests, criteria-based bid evaluation, and supplier contract negotiation.
* **PRIMARY ROUTE:** `/strategic-sourcing` (App state: `srm_rfq`)
* **RELATED ROUTES:** `/srm`, `/suppliers`, `/purchase`
* **PRIMARY UI ENTRY POINT:** `src/pages/StrategicSourcing.tsx`
* **PRIMARY API:** `GET /api/sourcing/rfps`, `POST /api/sourcing/rfps`
* **RELATED APIs:** `GET /api/sourcing/rfps/:id/bids`, `POST /api/sourcing/rfps/:id/award`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Sourcing Service)
* **DOMAIN AUTHORITY:** Exclusive Authority for Sourcing Packages and Vendor Tender Evaluation.
* **RBAC PERMISSIONS:** `sourcing:read`, `sourcing:create`, `sourcing:evaluate`
* **STATE MACHINES:** `DRAFT` → `ISSUED` → `BIDS_RECEIVED` → `AWARDED`.
* **CORE ENTITIES:** `sourcing_rfps`, `rfp_bids`, `award_notices`.
* **INPUTS:** Procurement specifications, vendor proposals.
* **OUTPUTS:** Awarded vendor selections, binding purchase contracts.
* **UPSTREAM MODULES:** M04 (Procurement Demand), M12 (Suppliers).
* **DOWNSTREAM MODULES:** M04 (Purchase Orders), M30 (SRM Vendor Ratings).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 43).
* **READ ADAPTER:** `GET /api/sourcing/rfps`.
* **NAVIGATION ADAPTER:** Supported via `srm_rfq` state.
* **ACTION ADAPTER:** Sourcing evaluation work items.
* **CURRENT UI STATUS:** WORKING (Dedicated sourcing module page with bid comparison graphs).
* **EVIDENCE:** `src/pages/StrategicSourcing.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 30: SRM (Supplier Relationship Management)
* **MODULE ID:** M30
* **MODULE NAME:** Supplier Relationship Management (SRM)
* **BUSINESS DOMAIN:** P2P / SRM
* **BUSINESS PURPOSE:** Comprehensive vendor performance scoring (Quality, On-Time Delivery, Price Competitiveness, SLA adherence), supplier risk audits, and vendor tiering.
* **PRIMARY ROUTE:** `/srm` (App state: `srm`)
* **RELATED ROUTES:** `/suppliers`, `/strategic-sourcing`, `/purchase`
* **PRIMARY UI ENTRY POINT:** `src/pages/SRM.tsx`
* **PRIMARY API:** `GET /api/srm/scorecards`, `POST /api/srm/evaluations`
* **RELATED APIs:** `GET /api/srm/suppliers`, `POST /api/srm/reports/print`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (SRM Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Supplier Performance Scorecards and Risk Ratings.
* **RBAC PERMISSIONS:** `srm:read`, `srm:evaluate`, `srm:admin`
* **STATE MACHINES:** `PENDING_REVIEW` → `EVALUATED` → `TIERED` (Strategic / Preferred / Conditional / Blocked).
* **CORE ENTITIES:** `supplier_scorecards`, `supplier_evaluations`, `vendor_performance_metrics`.
* **INPUTS:** Goods receipt quality logs (M34), PO delivery punctuality (M04), invoice price accuracy (M22).
* **OUTPUTS:** Supplier KPI scorecards, preferred vendor tier updates.
* **UPSTREAM MODULES:** M04 (Purchase Delivery), M34 (Material Quality), M12 (Suppliers).
* **DOWNSTREAM MODULES:** M04 (Vendor Selection Guidance), M29 (Tender Shortlisting).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 44).
* **READ ADAPTER:** `GET /api/srm/scorecards`.
* **NAVIGATION ADAPTER:** Supported via `srm` state.
* **ACTION ADAPTER:** Vendor review reminders.
* **CURRENT UI STATUS:** WORKING (Vendor scorecard matrix, evaluation radar chart, print report modal).
* **EVIDENCE:** `src/pages/SRM.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 31: Reports & BI Analytics
* **MODULE ID:** M31
* **MODULE NAME:** Operational & Statutory Reports Engine
* **BUSINESS DOMAIN:** GOVERNANCE / AUDIT
* **BUSINESS PURPOSE:** Paginated operational report generation, official voucher printing (Mẫu 02-VT, S12-DNN), tabular export (Excel/CSV/PDF), and cross-module reporting.
* **PRIMARY ROUTE:** `/reports` (App state: `reports`)
* **RELATED ROUTES:** `/dashboard`, `/inventory`
* **PRIMARY UI ENTRY POINT:** `src/pages/Reports.tsx`
* **PRIMARY API:** `GET /api/reports`, `GET /api/reports/inventory-summary`
* **RELATED APIs:** `GET /api/reports/sales-summary`, `GET /api/reports/purchase-summary`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Reporting Service)
* **DOMAIN AUTHORITY:** Exclusive Authority for Standard Operational Report Layouts and Scheduled Distributions.
* **RBAC PERMISSIONS:** `reports:read`, `reports:export`, `reports:admin`
* **STATE MACHINES:** Read-only Parameterized Reporting States.
* **CORE ENTITIES:** Report definitions, export job logs.
* **INPUTS:** Module database records across all domains.
* **OUTPUTS:** Formatted PDF vouchers, Excel tables, CSV exports.
* **UPSTREAM MODULES:** All enterprise modules (M01–M40).
* **DOWNSTREAM MODULES:** Statutory Compliance, External Auditors, Operational Managers.
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 45).
* **READ ADAPTER:** `GET /api/reports`.
* **NAVIGATION ADAPTER:** Supported via `reports` state.
* **ACTION ADAPTER:** Quick export links.
* **CURRENT UI STATUS:** WORKING (Interactive report selector, date range pickers, export buttons).
* **EVIDENCE:** `src/pages/Reports.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 32: Audit Log & Forensic Traceability
* **MODULE ID:** M32
* **MODULE NAME:** Security Audit Log & Traceability
* **BUSINESS DOMAIN:** GOVERNANCE / AUDIT
* **BUSINESS PURPOSE:** Centralized, immutable security audit logging capturing user identity, IP address, exact mutation action, entity ID, previous/new state, and forensic timestamps.
* **PRIMARY ROUTE:** `/audit` (App state: `audit`)
* **RELATED ROUTES:** `/event-bus`, `/super-admin`
* **PRIMARY UI ENTRY POINT:** `src/pages/AuditLog.tsx`
* **PRIMARY API:** `GET /api/audit-logs`, `GET /api/audit-logs/summary`
* **RELATED APIs:** `GET /api/audit-logs/entity/:type/:id`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Audit Service)
* **DOMAIN AUTHORITY:** **Exclusive Authority for Immutable Audit Logs and Forensic Data Lineage.**
* **RBAC PERMISSIONS:** `audit:read`, `audit:export`, `audit:admin`
* **STATE MACHINES:** `RECORDED` (Strictly Immutable & Append-Only).
* **CORE ENTITIES:** `audit_logs`, `data_lineage_records`.
* **INPUTS:** Mutation events emitted across all 40 ERP modules.
* **OUTPUTS:** Immutable forensic audit trail, compliance inspection ledgers.
* **UPSTREAM MODULES:** All modules (Every transactional mutation).
* **DOWNSTREAM MODULES:** Internal Compliance, Security Officers, External Auditors.
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 46).
* **READ ADAPTER:** `GET /api/audit-logs`.
* **NAVIGATION ADAPTER:** Supported via `audit` state.
* **ACTION ADAPTER:** Security anomaly alerts.
* **CURRENT UI STATUS:** WORKING (High-density audit log table, JSON payload inspector, filter drawer).
* **EVIDENCE:** `src/pages/AuditLog.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 33: CRM & Service Desk
* **MODULE ID:** M33
* **MODULE NAME:** Customer Relationship Management (CRM)
* **BUSINESS DOMAIN:** O2C / COMMERCE
* **BUSINESS PURPOSE:** Sales lead pipeline management, deal stage progression, customer interactions, opportunity tracking, and commercial service requests.
* **PRIMARY ROUTE:** `/crm` (App state: `crm`)
* **RELATED ROUTES:** `/customers`, `/sales`, `/issue`
* **PRIMARY UI ENTRY POINT:** `src/pages/CRM.tsx`
* **PRIMARY API:** `GET /api/crm/leads`, `POST /api/crm/leads`
* **RELATED APIs:** `PUT /api/crm/leads/:id/stage`, `POST /api/crm/activities`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (CRM Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Lead Stages, Opportunity Pipelines, and Sales Interaction Histories.
* **RBAC PERMISSIONS:** `crm:read`, `crm:write`, `crm:admin`
* **STATE MACHINES:** `LEAD_NEW` → `CONTACTED` → `QUALIFIED` → `PROPOSAL` → `WON` / `LOST`.
* **CORE ENTITIES:** `crm_leads`, `crm_opportunities`, `crm_activities`.
* **INPUTS:** Inbound customer inquiries, marketing campaigns.
* **OUTPUTS:** Qualified sales accounts (M11), sales quotations (M05).
* **UPSTREAM MODULES:** External Marketing, Customer Inquiries.
* **DOWNSTREAM MODULES:** M11 (Customer Master), M05 (Sales Orders).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 16).
* **READ ADAPTER:** `GET /api/crm/leads`.
* **NAVIGATION ADAPTER:** Supported via `crm` state.
* **ACTION ADAPTER:** Lead follow-up task notifications.
* **CURRENT UI STATUS:** WORKING (Kanban lead board, deal value summary, activity logger).
* **EVIDENCE:** `src/pages/CRM.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 34: SuperAdmin Portal & User Governance
* **MODULE ID:** M34
* **MODULE NAME:** SuperAdmin Portal & IAM Governance
* **BUSINESS DOMAIN:** CORE / IAM
* **BUSINESS PURPOSE:** User account management, role assignment, granular RBAC permission matrix configuration, system branch assignments, and security policy control.
* **PRIMARY ROUTE:** `/super-admin` (App state: `super_admin`)
* **RELATED ROUTES:** `/system-settings`, `/audit`
* **PRIMARY UI ENTRY POINT:** `src/pages/SuperAdminPortal.tsx`
* **PRIMARY API:** `GET /api/admin/users`, `POST /api/admin/users`
* **RELATED APIs:** `GET /api/admin/roles`, `PUT /api/admin/users/:id/permissions`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Admin Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for System User Provisioning, Role Assignments, and RBAC Permissions.
* **RBAC PERMISSIONS:** `super_admin:read`, `super_admin:manage_users`, `super_admin:manage_roles`
* **STATE MACHINES:** User Account State (`ACTIVE` → `SUSPENDED` → `LOCKED` → `DELETED`).
* **CORE ENTITIES:** `users`, `roles`, `permissions`, `user_roles`, `role_permissions`.
* **INPUTS:** Administrative user requests, role modifications.
* **OUTPUTS:** Validated user access tokens, permission matrices.
* **UPSTREAM MODULES:** M18 (HR Employee Records).
* **DOWNSTREAM MODULES:** All modules (Enforcing RBAC on every API request).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 48).
* **READ ADAPTER:** `GET /api/admin/users`.
* **NAVIGATION ADAPTER:** Supported via `super_admin` state.
* **ACTION ADAPTER:** User lock/unlock controls.
* **CURRENT UI STATUS:** WORKING (User list, role assignment modal, granular permission toggle grid).
* **EVIDENCE:** `src/pages/SuperAdminPortal.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 35: EventBus & Enterprise Integration
* **MODULE ID:** M35
* **MODULE NAME:** EventBus & Outbox Relay
* **BUSINESS DOMAIN:** GOVERNANCE / AUDIT
* **BUSINESS PURPOSE:** Centralized domain event broker, transactional Outbox pattern monitoring, processed event idempotency tracking, and Dead Letter Queue (DLQ) inspection.
* **PRIMARY ROUTE:** `/event-bus` (App state: `events`)
* **RELATED ROUTES:** `/audit`, `/orchestration`
* **PRIMARY UI ENTRY POINT:** `src/pages/EventBus.tsx`
* **PRIMARY API:** `GET /api/events/outbox`, `GET /api/events/summary`
* **RELATED APIs:** `POST /api/events/dlq/:id/retry`, `GET /api/events/processed`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (EventBus Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Domain Event Broker Dispatch, Outbox Relays, and DLQ Quarantine.
* **RBAC PERMISSIONS:** `integration:read`, `integration:retry_dlq`, `integration:admin`
* **STATE MACHINES:** Event Status (`PENDING` → `PUBLISHED` → `PROCESSED` / `FAILED` → `DLQ`).
* **CORE ENTITIES:** `outbox_events`, `processed_events`, `dlq_events`.
* **INPUTS:** Domain events published atomically inside transactions across modules.
* **OUTPUTS:** Asynchronous consumer worker dispatches, event audit trails.
* **UPSTREAM MODULES:** All transactional business modules.
* **DOWNSTREAM MODULES:** Asynchronous consumers, webhook subscribers, notification engines.
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 49).
* **READ ADAPTER:** `GET /api/events/outbox`.
* **NAVIGATION ADAPTER:** Supported via `events` state.
* **ACTION ADAPTER:** DLQ failure alerts and retry actions.
* **CURRENT UI STATUS:** WORKING (Real-time event stream monitor, outbox counters, DLQ retry interface).
* **EVIDENCE:** `src/pages/EventBus.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 36: Ticketing & Issue Tracking
* **MODULE ID:** M36
* **MODULE NAME:** Service Ticketing & Issue Tracking
* **BUSINESS DOMAIN:** O2C / COMMERCE
* **BUSINESS PURPOSE:** Operational support tickets, defect tracking, warranty service requests, priority escalation, and resolution workflow management.
* **PRIMARY ROUTE:** `/issue` (App state: `issue`)
* **RELATED ROUTES:** `/crm`, `/quality`
* **PRIMARY UI ENTRY POINT:** `src/pages/Issue.tsx`
* **PRIMARY API:** `GET /api/tickets`, `POST /api/tickets`
* **RELATED APIs:** `POST /api/tickets/:id/resolve`, `PUT /api/tickets/:id/priority`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Ticketing Controller)
* **DOMAIN AUTHORITY:** Exclusive Authority for Support Tickets and Customer Service Escalations.
* **RBAC PERMISSIONS:** `ticketing:read`, `ticketing:create`, `ticketing:resolve`
* **STATE MACHINES:** `OPEN` → `ASSIGNED` → `IN_PROGRESS` → `PENDING_CUSTOMER` → `RESOLVED` → `CLOSED`.
* **CORE ENTITIES:** `support_tickets`, `ticket_comments`, `ticket_attachments`.
* **INPUTS:** Customer bug reports, equipment malfunction tickets, warehouse issues.
* **OUTPUTS:** Support resolution logs, maintenance requests for M13.
* **UPSTREAM MODULES:** M33 (CRM), M11 (Customers), M06 (Warehouse).
* **DOWNSTREAM MODULES:** M13 (EAM Work Orders), M34 (Quality Non-Conformance).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 50).
* **READ ADAPTER:** `GET /api/tickets`.
* **NAVIGATION ADAPTER:** Supported via `issue` state.
* **ACTION ADAPTER:** Open support ticket count widget.
* **CURRENT UI STATUS:** WORKING (Ticket management table, status progression buttons, priority tags).
* **EVIDENCE:** `src/pages/Issue.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 37: Quality Management & Inspection (QC)
* **MODULE ID:** M37
* **MODULE NAME:** Quality Control & Inspection (QC / QA)
* **BUSINESS DOMAIN:** MES / MRP / SCP
* **BUSINESS PURPOSE:** Incoming material inspection, in-process manufacturing quality gates, Certificate of Analysis (COA) verification, Non-Conformance Reports (NCR), and dispositioning.
* **PRIMARY ROUTE:** `/quality` (App state: `quality`)
* **RELATED ROUTES:** `/manufacturing`, `/purchase`, `/inventory`
* **PRIMARY UI ENTRY POINT:** `src/components/QualityManagement.tsx`
* **PRIMARY API:** `GET /api/qc/inspections`, `POST /api/qc/inspections`
* **RELATED APIs:** `POST /api/qc/inspections/:id/disposition`, `GET /api/qc/plans`
* **PRIMARY DOMAIN SERVICE:** `server/qualityService.ts` (`QualityService`)
* **DOMAIN AUTHORITY:** Exclusive Authority for Quality Inspection Results, Non-Conformance Reports, and Batch Release Dispositions.
* **RBAC PERMISSIONS:** `qc:read`, `qc:inspect`, `qc:disposition`, `qc:admin`
* **STATE MACHINES:** `PENDING_INSPECTION` → `INSPECTED_PASSED` / `INSPECTED_FAILED` → `DISPOSITIONED` (Scrap / Rework / Release).
* **CORE ENTITIES:** `qc_inspections`, `qc_inspection_items`, `qc_plans`.
* **INPUTS:** Goods receipts (M04), manufacturing completions (M19).
* **OUTPUTS:** Batch quality release flags for M03, NCR quarantine orders.
* **UPSTREAM MODULES:** M04 (Purchasing Goods Receipts), M19 (Manufacturing Outputs).
* **DOWNSTREAM MODULES:** M03 (Inventory Batch Release/Block), M10 (Scrap Adjustments).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 51).
* **READ ADAPTER:** `GET /api/qc/inspections`.
* **NAVIGATION ADAPTER:** Supported via `quality` state.
* **ACTION ADAPTER:** Pending QC inspection work items.
* **CURRENT UI STATUS:** WORKING (Inspection workflow UI, pass/fail test recording, disposition dialog).
* **EVIDENCE:** `src/components/QualityManagement.tsx`, `server/qualityService.ts`.

---

### Module 38: System Settings & Global Configuration
* **MODULE ID:** M38
* **MODULE NAME:** System Settings & Parameters
* **BUSINESS DOMAIN:** CORE / IAM
* **BUSINESS PURPOSE:** Global system configuration, company profiles, localization parameters, tax settings, system maintenance modes, and feature toggles.
* **PRIMARY ROUTE:** `/system-settings` (App state: `system_settings`)
* **RELATED ROUTES:** `/super-admin`
* **PRIMARY UI ENTRY POINT:** `src/pages/SystemSettings.tsx`
* **PRIMARY API:** `GET /api/system/settings`, `POST /api/system/settings`
* **RELATED APIs:** `GET /api/system/info`, `POST /api/system/cache-clear`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (System Settings Service)
* **DOMAIN AUTHORITY:** Exclusive Authority for Global System Parameters and Feature Flags.
* **RBAC PERMISSIONS:** `system:read`, `system:write`, `system:admin`
* **STATE MACHINES:** System Setting Status (`ACTIVE` → `OVERRIDDEN` → `LOCKED`).
* **CORE ENTITIES:** `system_settings`, `company_profiles`, `system_parameters`.
* **INPUTS:** Administrator configuration adjustments.
* **OUTPUTS:** Global configuration broadcasts, tenant parameters.
* **UPSTREAM MODULES:** SuperAdmin Authority.
* **DOWNSTREAM MODULES:** All modules (Consuming global system flags).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 47).
* **READ ADAPTER:** `GET /api/system/settings`.
* **NAVIGATION ADAPTER:** Supported via `system_settings` state.
* **ACTION ADAPTER:** System status indicator.
* **CURRENT UI STATUS:** WORKING (Tabbed settings forms, currency selection, company profile editor).
* **EVIDENCE:** `src/pages/SystemSettings.tsx`, `src/config/moduleRegistry.ts`.

---

### Module 39: Projects & Job Costing
* **MODULE ID:** M39
* **MODULE NAME:** Projects & Job Costing (WBS)
* **BUSINESS DOMAIN:** PROJECT / COSTING
* **BUSINESS PURPOSE:** Work Breakdown Structure (WBS) project management, milestone tracking, timesheet cost logging, material expense accumulation, and job profitability analysis.
* **PRIMARY ROUTE:** `/projects` (App state: `projects`)
* **RELATED ROUTES:** `/hr`, `/accounting`
* **PRIMARY UI ENTRY POINT:** `src/pages/Projects.tsx`
* **PRIMARY API:** `GET /api/projects`, `POST /api/projects`
* **RELATED APIs:** `POST /api/projects/:id/timesheet`, `GET /api/projects/:id/costing`
* **PRIMARY DOMAIN SERVICE:** `server/projectService.ts` (`ProjectService`)
* **DOMAIN AUTHORITY:** Exclusive Authority for Project WBS Hierarchies and Job Cost Accumulation.
* **RBAC PERMISSIONS:** `projects:read`, `projects:create`, `projects:manage`, `projects:close`
* **STATE MACHINES:** `PLANNING` → `ACTIVE` → `ON_HOLD` → `COMPLETED` → `CLOSED`.
* **CORE ENTITIES:** `projects`, `project_tasks`, `project_timesheets`, `project_cost_entries`.
* **INPUTS:** Project scope definitions, employee timesheets (M18), material issues (M03).
* **OUTPUTS:** Project billing milestones for M22, job costing reports for M08.
* **UPSTREAM MODULES:** M18 (HR Resources), M03 (Materials), M04 (Subcontracting Services).
* **DOWNSTREAM MODULES:** M22 (Project Invoicing), M08 (General Ledger Job Costing).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 32).
* **READ ADAPTER:** `GET /api/projects`.
* **NAVIGATION ADAPTER:** Supported via `projects` state.
* **ACTION ADAPTER:** Project milestone deadline alerts.
* **CURRENT UI STATUS:** WORKING (WBS task Gantt view, project budget tracker, timesheet entry).
* **EVIDENCE:** `src/pages/Projects.tsx`, `server/projectService.ts`.

---

### Module 40: Advanced WMS Extended & Logistics Workbench
* **MODULE ID:** M40
* **MODULE NAME:** Advanced WMS Extended (Wave, LPN & Putaway)
* **BUSINESS DOMAIN:** INVENTORY / WMS
* **BUSINESS PURPOSE:** High-velocity logistics execution including wave picking, directed putaway, cross-docking, yard management, and License Plate Number (LPN) tracking.
* **PRIMARY ROUTE:** `/wms-extended` (App state: `wms_extended`)
* **RELATED ROUTES:** `/warehouse`, `/inventory`, `/transfer`
* **PRIMARY UI ENTRY POINT:** `src/pages/WMSExtended.tsx`
* **PRIMARY API:** `GET /api/wms/waves`, `POST /api/wms/waves/create`
* **RELATED APIs:** `POST /api/wms/waves/:id/release`, `POST /api/wms/putaway/execute`, `GET /api/wms/lpns`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (WMS Extended Service)
* **DOMAIN AUTHORITY:** Exclusive Authority for Warehouse Wave Planning and LPN Container Tracking. **Strict Limitation:** Strictly routes all inventory balance mutations through Module 03 (`InventoryService`) and financial entries through Module 08.
* **RBAC PERMISSIONS:** `wms:read`, `wms:wave_plan`, `wms:execute_pick`, `wms:admin`
* **STATE MACHINES:** Wave Lifecycle (`DRAFT` → `RELEASED` → `PICKING` → `PACKED` → `DISPATCHED`).
* **CORE ENTITIES:** `wms_waves`, `wms_wave_lines`, `wms_lpns`, `putaway_tasks`.
* **INPUTS:** Sales order picking demand (M05), inbound goods receipts (M04).
* **OUTPUTS:** Physical wave picking tasks, LPN tracking tags, stock movement triggers for M03.
* **UPSTREAM MODULES:** M05 (Sales Orders), M04 (Purchase ASN), M06 (Warehouse Hierarchy).
* **DOWNSTREAM MODULES:** M03 (Inventory Stock Issue via `InventoryService`), M14 (TMS Logistics Dispatch).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (`moduleRegistry.ts` line 28).
* **READ ADAPTER:** `GET /api/wms/waves`.
* **NAVIGATION ADAPTER:** Supported via `wms_extended` state.
* **ACTION ADAPTER:** Active wave execution alerts.
* **CURRENT UI STATUS:** WORKING (Wave picking dashboard, putaway task manager, LPN container tracker).
* **EVIDENCE:** `src/pages/WMSExtended.tsx`, `src/config/moduleRegistry.ts`.

---

## 3. Cross-Module Dependency Matrix

```
[M01 Workspace Hub / IAM] ────── (Controls Session & RBAC Scope) ──────> All Modules (M02–M40)
                                                                                  │
[M02 Products] ───────────────┬──────────────┬──────────────┬─────────────────────┤
                              ▼              ▼              ▼                     ▼
                        [M04 Purchase] [M05 Sales]    [M15 MRP]             [M19 Manufacturing]
                              │              │              │                     │
                              ▼              ▼              │                     │
                        [M03 Inventory Core] <──────────────┴─────────────────────┤
                              ▲                                                   │
                              │ (Physical Movements via InventoryService)        │
                        [M40 Advanced WMS]                                       ▼
                              │                                             [M37 QC Inspections]
                              ▼                                                   │
                        [M14 TMS Logistics]                                       ▼
                              │                                             [M07 Costing]
                              ▼                                                   │
                        [M22 Invoices AR/AP] ────────────────────────────────────►│
                              │                                                   ▼
                        [M23 Payments] ─────────────────────────────────────► [M08 Accounting / GL]
                                                                                  ▲
                                                                                  │
                        [M26 Commission] ─────────────────────────────────────────┤
                        [M21 Consolidation] <─────────────────────────────────────┘
```

---

## 4. Module Route & Mounting Verification Matrix

| Module ID | Module Canonical Name | Primary Route | React State Key | Mounted Component | Primary API Endpoint | Permission Checked | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M01** | Workspace Hub | `/workspace` | `workspace_hub` | `<WorkspaceHub />` | `/api/orchestration/workspaces` | Authenticated | **VALID** |
| **M02** | Product Master Data | `/inventory` | `inventory` | `<Inventory />` | `/api/products` | `inventory:read` | **VALID** |
| **M03** | Inventory Core | `/inventory` | `inventory` | `<Inventory />` | `/api/inventory/balances` | `inventory:read` | **VALID** |
| **M04** | Purchase Orders | `/purchase` | `purchase` | `<Purchase />` | `/api/purchase/orders` | `purchase:read` | **VALID** |
| **M05** | Sales Orders | `/sales` | `sales_orders` | `<SalesOrders />` | `/api/sales/orders` | `sales:read` | **VALID** |
| **M06** | Warehouse Ops | `/warehouse` | `warehouse` | `<Warehouse />` | `/api/warehouses` | `warehouse:read` | **VALID** |
| **M07** | Inventory Costing | `/inventory` | `inventory` | `<CogsEngineModule />` | `/api/costing/valuation` | `costing:read` | **VALID** |
| **M08** | Accounting / GL | `/accounting` | `accounting` | `<Accounting />` | `/api/accounting/journal-entries`| `accounting:read` | **VALID** |
| **M09** | Stocktake | `/stocktake` | `stocktake` | `<Stocktake />` | `/api/stocktake` | `stocktake:read` | **VALID** |
| **M10** | Stock Adjustment | `/stock-adjustment`| `adjustment` | `<StockAdjustment />` | `/api/stock-adjustments` | `stock_adjustment:read`| **VALID** |
| **M11** | Customer Management | `/customers` | `customers` | `<Customers />` | `/api/customers` | `customers:read` | **VALID** |
| **M12** | Supplier Management | `/suppliers` | `suppliers` | `<Suppliers />` | `/api/suppliers` | `suppliers:read` | **VALID** |
| **M13** | EAM / Maintenance | `/eam` | `assets` | `<EAM />` | `/api/eam/assets` | `eam:read` | **VALID** |
| **M14** | TMS / Logistics | `/logistics` | `logistics` | `<Logistics />` | `/api/logistics/shipments` | `logistics:read` | **VALID** |
| **M15** | SCP / MRP | `/supply-chain` | `supply_chain` | `<SupplyChain />` | `/api/scm/plans` | `scm:read` | **VALID** |
| **M16** | Alerts & Notifications| `/alerts` | `alerts` | `<Alerts />` | `/api/alerts` | Authenticated | **VALID** |
| **M17** | Strategic Sourcing | `/strategic-sourcing`| `srm_rfq` | `<StrategicSourcing />`| `/api/sourcing/rfps` | `sourcing:read` | **VALID** |
| **M18** | HR Management | `/hr` | `hr` | `<HRManagement />` | `/api/hr/employees` | `hr:read` | **VALID** |
| **M19** | Manufacturing (MES) | `/manufacturing` | `manufacturing` | `<Manufacturing />` | `/api/manufacturing/orders` | `manufacturing:read` | **VALID** |
| **M20** | Subcontracting | `/subcontracting` | `subcontracting`| `<SubcontractingManagement />`| `/api/subcontracting/orders` | `subcontracting:read`| **VALID** |
| **M21** | Consolidation | `/financial-consolidation`| `fico_consolidation`| `<FinancialConsolidation />`| `/api/consolidation` | `consolidation:read` | **VALID** |
| **M22** | Invoices AR/AP | `/invoices` | `invoices` | `<Invoices />` | `/api/invoices` | `invoices:read` | **VALID** |
| **M23** | Payments & Treasury | `/payments` | `payments` | `<Payments />` | `/api/payments` | `payments:read` | **VALID** |
| **M24** | Bank Reconciliation | `/bank-reconciliation`| `bank_reconciliation`| `<BankReconciliation />` | `/api/bank-reconciliation`| `bank_recon:read` | **VALID** |
| **M25** | Dashboard Overview | `/dashboard` | `dashboard` | `<Dashboard />` | `/api/dashboard/metrics` | Authenticated | **VALID** |
| **M26** | Commission | `/commission` | `commission` | `<Commission />` | `/api/commission` | `commission:read` | **VALID** |
| **M27** | Returns (RMA) | `/returns` | `returns` | `<Returns />` | `/api/returns` | `returns:read` | **VALID** |
| **M28** | POS Retail | `/pos` | `pos` | `<POS />` | `/api/pos/sessions` | `pos:read` | **VALID** |
| **M29** | Sourcing RFQ | `/strategic-sourcing`| `srm_rfq` | `<StrategicSourcing />`| `/api/sourcing/rfps` | `sourcing:read` | **VALID** |
| **M30** | SRM Supplier Score | `/srm` | `srm` | `<SRM />` | `/api/srm/scorecards` | `srm:read` | **VALID** |
| **M31** | Reports & BI | `/reports` | `reports` | `<Reports />` | `/api/reports` | `reports:read` | **VALID** |
| **M32** | Audit Log | `/audit` | `audit` | `<AuditLog />` | `/api/audit-logs` | `audit:read` | **VALID** |
| **M33** | CRM Service Desk | `/crm` | `crm` | `<CRM />` | `/api/crm/leads` | `crm:read` | **VALID** |
| **M34** | SuperAdmin Portal | `/super-admin` | `super_admin` | `<SuperAdminPortal />` | `/api/admin/users` | `super_admin:read` | **VALID** |
| **M35** | EventBus Platform | `/event-bus` | `events` | `<EventBusPage />` | `/api/events/outbox` | `integration:read` | **VALID** |
| **M36** | Ticketing & Issues | `/issue` | `issue` | `<Issue />` | `/api/tickets` | `ticketing:read` | **VALID** |
| **M37** | Quality Control (QC)| `/quality` | `quality` | `<QualityManagement />` | `/api/qc/inspections` | `qc:read` | **VALID** |
| **M38** | System Settings | `/system-settings` | `system_settings`| `<SystemSettings />` | `/api/system/settings` | `system:read` | **VALID** |
| **M39** | Projects & Costing | `/projects` | `projects` | `<Projects />` | `/api/projects` | `projects:read` | **VALID** |
| **M40** | Advanced WMS | `/wms-extended` | `wms_extended` | `<WMSExtended />` | `/api/wms/waves` | `wms:read` | **VALID** |
| **M41** | Product Pricing & Price Management | `/pricing-management` | `pricing_management` | `<M41PricingManagementWorkspace />` | `/api/pricing/items` | `pricing:read` | **VALID** |

---

### Module 41: Product Pricing & Price Management (Pricing Authority)

* **MODULE ID:** M41
* **MODULE NAME:** Product Pricing & Price Management
* **BUSINESS DOMAIN:** SALES / COMMERCIAL
* **BUSINESS PURPOSE:** Official Pricing Authority of NexusSync ERP, managing complete product pricing lifecycle including Price Lists, Product Prices, Pricing Rules (Markup vs Margin), Customer & Group Pricing, Quantity Break Tiers, Promotions, UOM Pricing, Effective Dating, Bulk Pricing, Minimum Margin Control, Manual Override, Maker-Checker Approval Workflow, and Immutable Audit Trail.
* **PRIMARY ROUTE:** `/pricing-management` (Workspace: `WS30_PRICING`)
* **PRIMARY UI ENTRY POINT:** `src/components/workspaces/M41PricingManagementWorkspace.tsx`
* **PRIMARY API:** `GET /api/pricing/items`, `POST /api/pricing/resolve`, `POST /api/pricing/bulk-calculate`, `POST /api/pricing/approve`
* **PRIMARY DOMAIN SERVICE:** `engines/pricingService.ts` (`PricingService`), `src/domains/pricing/services/PriceResolutionService.ts`
* **DOMAIN AUTHORITY:** Exclusive Pricing Authority for all selling prices, commercial discounts, and price resolution waterfall. (Receives Cost Basis from Costing Engine without recomputing cost; supplies Resolved Price to Sales O2C).
* **RBAC PERMISSIONS:** `pricing:read`, `pricing:write`, `pricing:approve`, `pricing:override`, `pricing:admin`
* **STATE MACHINES:** Price List & Price Item Lifecycle (`DRAFT` → `SUBMITTED` → `PENDING_APPROVAL` → `APPROVED` → `ACTIVE` / `REJECTED` / `ARCHIVED`).
* **UPSTREAM MODULES:** M02/M07 (Product Master), M08 (Procurement Purchase Cost), M07/M17 (Costing Engine Actual Cost Basis).
* **DOWNSTREAM MODULES:** M05/M13 (Sales Orders O2C), M16/M28 (POS Retail), M22/M31 (Invoices AR/AP).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (Mapped to WS30_PRICING in `moduleRegistry.ts`).

---
**END OF MODULE_MAP.md — ALL 41 MODULES VERIFIED & CERTIFIED**
