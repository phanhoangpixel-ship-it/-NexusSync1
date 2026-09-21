# Master API Catalog

This catalog maps application endpoints to their respective domains, permissions, and database tables across all 42 ERP modules (M01 – M42). When asked to modify a feature, locate its API group here and consult the corresponding module specification in `/docs/modules/`.

> **Reference Documentation:**
> - Master Architecture Map: `/docs/MODULE_MAP.md`
> - Individual Module Specs & Upgrade Checklists: `/docs/modules/README.md`
> - Core Business Rules & Invariants: `/docs/BUSINESS_RULES.md`

## CORE & IAM

**Entity: Authentication & User Management**
- `POST   /api/auth/login`
- `GET    /api/auth/me`
- `GET    /api/users`
  - **Module:** CORE
  - **Auth:** JWT Required (except login)
  - **Permission:** `users:read`, `users:write`
  - **Database:** `users`, `roles`, `permissions`
  - **Frontend Consumer:** `Login.tsx`, `SystemSettings.tsx`
  - **Status:** Verified

**Entity: RBAC (Role-Based Access Control)**
- `GET    /api/rbac/roles`
- `POST   /api/rbac/roles`
- `GET    /api/rbac/permissions`
- `GET    /api/rbac/users/:id/permissions`
- `POST   /api/rbac/users/:id/permissions`
  - **Module:** CORE
  - **Auth:** JWT Required
  - **Permission:** `rbac:manage`
  - **Database:** `roles`, `permissions`, `role_permissions`, `user_permissions`
  - **Frontend Consumer:** `SystemSettings.tsx`
  - **Status:** Verified

## M01 — WORKSPACE HUB & ORCHESTRATION

**Entity: Workspace Summary & WorkQueue**
- `GET    /api/workspace/summary` (Cross-module operational summary & role metrics)
- `GET    /api/workspace/work-items` (Aggregated actionable SLA tasks across P2P, O2C, WMS, Finance)
- `GET    /api/workspace/entity-preview` (Deep-link preview metadata for documents)
- `GET    /api/workspace/process-chains` (Value Stream & business process chains)
- `GET    /api/workspace/search` (Omnibar global cross-cutting search query)
- `POST   /api/workspace/work-items/:id/action` (Quick action dispatcher delegating to authoritative domain services)
  - **Module:** M01 — WORKSPACE HUB
  - **Auth:** JWT / Role-based Context
  - **Permission:** `workspace:read` (GET), `workspace:action` (POST)
  - **Database:** Read-only Aggregation from Domain Models (`purchase_orders`, `stock_adjustments`, `invoices`, `tickets`, `audit_logs`)
  - **Frontend Consumer:** `WorkspaceHub.tsx`, `DashboardStats.tsx`, `UnifiedActivityTaskDrawer.tsx`, `App.tsx`
  - **Status:** Verified (M01 SSOT Aggregator)

## M06 — INNOVATION R&D & FORMULATION

**Entity: R&D Projects (Stage-Gate Lifecycle SSOT)**
- `GET    /api/rd/projects` (List all R&D projects with Stage-Gate metrics, lock flags, target SKU, budget progress)
- `POST   /api/rd/projects` (Register new R&D project with initial Stage `DRAFT`, target budget, lead scientist)
- `GET    /api/rd/projects/:id` (Fetch complete project dossier, active formula versions, trials, evaluations)
- `PUT    /api/rd/projects/:id/stage` (Advance Stage-Gate lifecycle: `DRAFT` -> `TRIAL` -> `SAMPLE_EVALUATION` -> `APPROVED` -> `HANDED_OVER` / `REJECTED`)
- `POST   /api/rd/projects/:id/approve` (Technical committee formal approval, transitions stage to `APPROVED`)
- `POST   /api/rd/projects/:id/reject` (Technical committee rejection with rationale, transitions to immutable `REJECTED`)
  - **Module:** M06 — INNOVATION R&D & FORMULATION
  - **Auth:** JWT Required
  - **Permission:** `rd.project.manage` (POST, PUT), public/read (GET)
  - **Database:** `rd_projects`
  - **Frontend Consumer:** `M06InnovationRDWorkspace.tsx`
  - **Status:** Verified

**Entity: Formulas & Version Control (Zero-Overwrite Guarantee)**
- `GET    /api/rd/formulas` (List active and approved R&D formula master records)
- `POST   /api/rd/formulas` (Create new formula or new immutable version v1.x/v2.x with Zero-Overwrite policy)
- `POST   /api/rd/formulas/:id/approve` (Approve formulation for prototype trial & production release)
- `GET    /api/rd/formulas/:projectId/versions` (Fetch confidential formula version history & BOM recipe breakdown)
  - **Module:** M06 — INNOVATION R&D & FORMULATION
  - **Auth:** JWT Required
  - **Permission:** `rd.experiment.manage` (POST), `rd:confidential` / `rd.confidential.view` (GET /versions)
  - **Database:** `rd_formulas`, `rd_formula_items`
  - **Frontend Consumer:** `M06InnovationRDWorkspace.tsx`
  - **Status:** Verified

**Entity: Laboratory Experiments & Trials**
- `GET    /api/rd/experiments` / `GET /api/rd/trials` (Query lab trial logs, physical test runs and stability tests)
- `POST   /api/rd/experiments` / `POST /api/rd/trials` (Log experimental bench test run, sensory metrics and lab notes)
  - **Module:** M06 — INNOVATION R&D & FORMULATION
  - **Auth:** JWT Required
  - **Permission:** `rd.experiment.manage`
  - **Database:** `rd_experiments`, `rd_lab_trials`
  - **Frontend Consumer:** `M06InnovationRDWorkspace.tsx`
  - **Status:** Verified

**Entity: Material Requisition & Single-Writer Inventory Delegation (M17)**
- `POST   /api/rd/projects/:id/material-requisition` (Delegate lab material outbound issue solely to M17 `InventoryService.postTransaction()` — type `OUTBOUND_ISSUE`)
  - **Module:** M06 (Delegates to M17 Inventory Authority)
  - **Auth:** JWT Required
  - **Permission:** `rd.experiment.manage`
  - **Database:** M17 `stock_transactions`, `stock_balances` (via `InventoryService.postTransaction`)
  - **Frontend Consumer:** `M06InnovationRDWorkspace.tsx`
  - **Status:** Verified (Single-Writer M17 Enforced)

**Entity: Formula Cost Estimator (M42 COGS Integration)**
- `GET    /api/rd/projects/:id/cost-estimate` (Calculate real-time unit formula cost reading live from M42 `cost_layers` & M07 Item Master — Read-only, zero synthetic pricing)
  - **Module:** M06 (Delegates to M42 Costing Authority)
  - **Auth:** JWT Required
  - **Database:** M42 `cost_layers`, M07 `products`
  - **Frontend Consumer:** `CostEstimatorTab.tsx`, `M06InnovationRDWorkspace.tsx`
  - **Status:** Verified (Read-only M42 Integration)

**Entity: Sample Evaluation & QMS Inspection Linkage (M39)**
- `GET    /api/rd/samples` (Query prototype sample evaluation ledger)
- `POST   /api/rd/samples/evaluate` & `POST /api/rd/samples/:id/evaluate` (Record sensory & lab evaluation score, auto-links to M39 QMS inspection plan and IQC report)
  - **Module:** M06 (Delegates to M39 Quality Authority)
  - **Auth:** JWT Required
  - **Permission:** `rd.sample.evaluate`
  - **Database:** `rd_samples`, `qc_plans`, `qc_inspections`
  - **Frontend Consumer:** `SampleEvaluationTab.tsx`, `M06InnovationRDWorkspace.tsx`
  - **Status:** Verified

**Entity: Eco-Design Compliance Guard (ESG, RoHS & REACH)**
- `GET    /api/rd/eco-compliance` (Query Eco-Design compliance records and carbon footprint audit)
- `POST   /api/rd/eco-compliance/check` (Validate hazardous substance content, recyclability rate, RoHS/REACH standards)
  - **Module:** M06 — INNOVATION R&D & FORMULATION
  - **Auth:** JWT Required
  - **Permission:** `rd.compliance.manage`
  - **Database:** `rd_compliance`
  - **Frontend Consumer:** `EcoComplianceTab.tsx`, `M06InnovationRDWorkspace.tsx`
  - **Status:** Verified

**Entity: Commercial Handover & Delegation (M07, M25, M08, M29)**
- `GET    /api/rd/projects/:id/handover-checklist` (Verify 5-Gate readiness: Sample PASS, Eco PASS, SKU Registered, BOM Ready)
- `POST   /api/rd/projects/:id/register-sku` (Register finished goods commercial SKU into M07 Item Master `products` with `sourceType = 'RD_PROJECT'`)
- `POST   /api/rd/boms` (Formal BOM handover to M25 MES `boms` and `bomItems` with status `ACTIVE`)
- `POST   /api/rd/projects/:id/pilot-batch` (Dispatch trial pilot production work order into M25 MES `manufacturingOrders`)
- `POST   /api/rd/projects/:id/handover-signoff` (Scientific committee sign-off, locks project into immutable `HANDED_OVER` status)
- `POST   /api/rd/projects/:id/sample-po` (Procure lab raw materials through M08/M09 P2P `purchaseOrders` and `purchaseOrderItems`)
- `GET    /api/rd/projects/:id/dms-vault` (Query archived technical dossiers in M29 DMS Vault)
- `POST   /api/rd/projects/:id/dms-vault` (Cryptographically seal SHA-256 and archive technical dossier to M29 DMS `dmsDocuments`)
- `GET    /api/rd/patents` & `POST /api/rd/patents` (Intellectual property & patent protection dossier management)
- `POST   /api/rd/ai-suggest` (Gemini AI formulation and patent risk advisor)
  - **Module:** M06 (Cross-module Orchestration)
  - **Auth:** JWT Required
  - **Permission:** `rd.handover.approve`, `rd.project.manage`
  - **Database:** `rd_projects`, `products`, `boms`, `manufacturingOrders`, `purchaseOrders`, `dms_documents`, `audit_logs`
  - **Frontend Consumer:** `M06InnovationRDWorkspace.tsx`
  - **Status:** Verified

## M07 — ENTERPRISE MASTER DATA (ITEMS, CUSTOMERS & UOM)

**Entity: Categories**
- `GET    /api/categories` (Fetch all product categories with hierarchy parentCategoryId)
- `POST   /api/categories` (Create category with duplicate name check and audit logging)
- `PUT    /api/categories/:id` (Update category name/parent with duplicate name check and audit logging)
- `DELETE /api/categories/:id` (Delete category with FK reference check against products)
  - **Module:** M07 — ENTERPRISE MASTER DATA
  - **Auth:** JWT Required
  - **Permission:** `inventory:read` (GET), `inventory:write` (POST/PUT/DELETE)
  - **Database:** `categories`, `products`, `audit_logs`
  - **Frontend Consumer:** `M07CustomersItemMasterWorkspace.tsx`, `Inventory.tsx`, `POS.tsx`
  - **Status:** Verified (M07 SSOT)

**Entity: UOM & Product UOM Conversions**
- `POST   /api/uom/convert` (Calculate quantity conversion between base unit and target UOM preserving contract)
- `GET    /api/product-uoms` (Fetch product conversion UOMs with optional `productId` filter)
- `POST   /api/product-uoms` (Create UOM conversion with factor > 0, self-conversion block, and atomic duplicate check)
- `PUT    /api/product-uoms/:id` (Update UOM conversion factor, unitName, barcode, price, parentUomId)
- `DELETE /api/product-uoms/:id` (Delete product UOM conversion)
  - **Module:** M07 — ENTERPRISE MASTER DATA
  - **Auth:** JWT Required
  - **Permission:** `inventory:read` (GET/convert), `inventory:write` (POST/PUT/DELETE)
  - **Database:** `product_uoms`, `products`, `audit_logs`
  - **Frontend Consumer:** `M07CustomersItemMasterWorkspace.tsx`, `Inventory.tsx`, `Purchase.tsx`, `Transfer.tsx`
  - **Status:** Verified (M07 SSOT)

**Entity: Products (Item Master & Packaging)**
- `GET    /api/products` (Fetch products with filters: warehouseId, categoryId, status, search)
- `GET    /api/products/:id` (Fetch product detail, UOMs, packaging specs, and stock balances across warehouses)
- `POST   /api/products` (Create product with SKU duplicate check, category FK check, barcode check, atomic product_uoms insertion)
- `PUT    /api/products/:id` (Update product details, SKU, barcode, retail price, physical specs, and atomic UOM collection)
- `PATCH  /api/products/:id/archive` (Toggle lifecycle status ACTIVE <-> ARCHIVED)
- `DELETE /api/products/:id` (Delete unreferenced product; blocks deletion via FK Guard if referenced by stockLedger, PO, or SO)
  - **Module:** M07 — ENTERPRISE MASTER DATA
  - **Auth:** JWT Required
  - **Permission:** `inventory:read` (GET), `inventory:write` (POST/PUT/PATCH/DELETE)
  - **Database:** `products`, `categories`, `product_uoms`, `stock_balances`, `stock_ledger`, `purchase_order_items`, `sales_order_items`, `audit_logs`
  - **Frontend Consumer:** `M07CustomersItemMasterWorkspace.tsx`, `Inventory.tsx`, `POS.tsx`, `Purchase.tsx`
  - **Status:** Verified (M07 SSOT)

**Entity: Customers (B2B Accounts & Credit Terms)**
- `GET    /api/customers` (Fetch B2B customer directory with credit limits, payment terms, and AR balances)
- `POST   /api/customers` (Create B2B customer with duplicate tax code check and initial credit limit)
- `PUT    /api/customers/:id` (Update legal profile, billing/shipping addresses, payment terms, and pricing tier)
- `GET    /api/customers/:id/credit` (Central credit limit and outstanding balance check)
- `DELETE /api/customers/:id` (Delete unreferenced customer; blocks deletion via FK Guard if active SO or invoices exist)
  - **Module:** M07 — ENTERPRISE MASTER DATA
  - **Auth:** JWT Required
  - **Permission:** `sales:read`, `sales:write`, `crm:manage`
  - **Database:** `customers`, `customer_addresses`, `customer_contacts`, `sales_orders`, `invoices`, `audit_logs`
  - **Frontend Consumer:** `M07CustomersItemMasterWorkspace.tsx`, `Customers.tsx`, `POS.tsx`, `SalesOrders.tsx`
  - **Status:** Verified (M07 SSOT)

## M12 — CRM LEADS & OPPORTUNITY FUNNEL

**Entity: Leads, Opportunities, Activities & Quotations**
- `GET    /api/crm/leads` (Query B2B prospective leads and pipeline status)
- `POST   /api/crm/leads` (Create new sales lead with contact and interest details)
- `PUT    /api/crm/leads/:id` (Update lead record and stage)
- `DELETE /api/crm/leads/:id` (Delete lead record)
- `POST   /api/crm/leads/:id/convert` (Convert qualified Lead into Master Data Customer via M07)
- `GET    /api/crm/opportunities` (Fetch sales opportunities pipeline and stage probabilities)
- `PUT    /api/crm/opportunities/:id/stage` (Update opportunity stage and closing probability)
- `GET    /api/crm/activities` (Fetch CRM interaction and communication log)
- `POST   /api/crm/activities` (Record new call, meeting, or email activity)
- `GET    /api/crm/quotations` (Fetch commercial quotations and pricing payloads)
- `POST   /api/crm/quotations` (Create new commercial quotation with SSOT item prices)
- `PUT    /api/crm/quotations/:id/status` (Update quotation status)
- `POST   /api/crm/quotations/:id/convert-to-so` (Convert quotation into authoritative Sales Order via M13 SalesEngine without duplicate write paths)
- `GET    /api/crm/analytics` (Compute conversion rates and pipeline metrics)
  - **Module:** M12 — CRM LEADS & OPPORTUNITY FUNNEL
  - **Auth:** JWT Required
  - **Permission:** `crm:read`, `crm:write`, `crm:manage`
  - **Database:** `leads`, `opportunities`, `crm_quotations`, `crm_activities`, `customers`, `sales_orders`, `audit_logs`, `outbox_events`
  - **Cross-Module Integrations:** M13 Sales Orders (Order conversion delegation), M07 Customers & Credit Limit Guard, M41 Pricing Engine (SSOT pricing), M37 BI Analytics, M29 Notifications (Stale lead alerts), M02 Audit
  - **Frontend Consumer:** `CRM.tsx`
  - **Status:** Certified & Active

## M10 — STRATEGIC SOURCING, RFP & RFQ BIDDING

**Entity: Sourcing Packages & Tender Events**
- `GET    /api/sourcing/packages` (Query procurement packages with budget estimates, category, and lifecycle status)
- `POST   /api/sourcing/packages` (Create procurement tender package with Cost Center link, M30 Budget Guard, and approval tier check)
- `GET    /api/sourcing/packages/:id` (Fetch tender package details, associated RFQs, and bid summaries)
- `PUT    /api/sourcing/packages/:id` (Update package metadata, deadline, and estimated budget)
- `POST   /api/sourcing/packages/:id/cancel` (Cancel sourcing package with mandatory reason and supplier notification event)
  - **Module:** M10 — STRATEGIC SOURCING & RFQ
  - **Auth:** JWT Required
  - **Permission:** `purchase:read` (GET), `purchase:write` / `sourcing.package.manage` (POST/PUT)
  - **Database:** `sourcing_packages`, `srm_rfqs`, `audit_logs`, `outbox_events`
  - **Cross-Module Integrations:** M30 General Ledger / Cost Center Budget Check
  - **Frontend Consumer:** `M10StrategicSourcingWorkspace.tsx`, `M10RfqTab.tsx`, `M10PackageModal.tsx`
  - **Status:** Verified (M10 Authority)

**Entity: RFQ Distribution & Multi-Supplier Bidding**
- `GET    /api/sourcing/rfqs` (Query RFQs with status filtering, deadline, and bid count)
- `POST   /api/sourcing/rfqs` (Publish RFQ to invited suppliers with idempotency key, target line specifications, and M09 Eligibility Guard)
- `GET    /api/sourcing/rfqs/:id` (Fetch RFQ specification, items, invited suppliers, and bid status)
- `POST   /api/sourcing/rfqs/:id/invite` (Invite supplier with Eligibility Guard: verifies ACTIVE and non-blacklisted status via M09)
- `POST   /api/sourcing/rfqs/:id/close` (Close RFQ for new bidding submissions)
  - **Module:** M10 — STRATEGIC SOURCING & RFQ
  - **Auth:** JWT Required
  - **Permission:** `purchase:read` (GET), `purchase:write` / `sourcing.rfq.manage` (POST)
  - **Database:** `srm_rfqs`, `srm_rfq_items`, `srm_rfq_suppliers`, `suppliers`, `audit_logs`, `outbox_events`
  - **Cross-Module Integrations:** M09 Supplier Master (Eligibility Guard & Tax Code check)
  - **Frontend Consumer:** `M10StrategicSourcingWorkspace.tsx`, `M10RfqTab.tsx`, `M10RfqDetailModal.tsx`
  - **Status:** Verified (M10 Authority)

**Entity: Supplier Bids & Reverse Auction**
- `GET    /api/sourcing/rfqs/:id/bids` (Fetch all bids submitted for an RFQ across all auction rounds with supplier metadata)
- `POST   /api/sourcing/rfqs/:id/bids` (Nested RESTful endpoint to submit supplier bid for an RFQ)
- `POST   /api/sourcing/bids` (Submit supplier bid with unit prices, lead time, and roundNumber for multi-round reverse auction)
- `GET    /api/sourcing/bids/:id` (Get detailed bid breakdown with item lines and commercial terms)
- `POST   /api/sourcing/rfqs/:id/reverse-auction/round` (Initiate next reverse auction round with targetReductionPercent and ceilingPrice calculation)
- `GET    /api/sourcing/rfqs/:id/reverse-auction` (Get full multi-round price reduction history and supplier trajectories)
  - **Module:** M10 — STRATEGIC SOURCING & RFQ
  - **Auth:** JWT Required / Supplier Portal Token
  - **Permission:** `purchase:read` (GET), `purchase:write` / `supplier:bid` / `sourcing.auction.manage` (POST)
  - **Database:** `srm_bids`, `srm_bid_items`, `srm_auction_rounds`, `srm_rfqs`, `suppliers`, `audit_logs`, `outbox_events`
  - **Cross-Module Integrations:** M09 Supplier Master, Reverse Auction Multi-round Ceiling Guard
  - **Frontend Consumer:** `M10StrategicSourcingWorkspace.tsx`, `M10BidsTab.tsx`, `M10ReverseAuctionModal.tsx`
  - **Status:** Verified (M10 Authority)

**Entity: Bid Comparison & Multi-criteria Scoring Matrix**
- `GET    /api/sourcing/rfqs/:id/comparison` (Side-by-side normalized comparative matrix of prices, delivery, BPA price locks, and M11 SRM metrics)
- `GET    /api/sourcing/comparison` (Query-parameter fallback for RFQ comparison matrix)
- `POST   /api/sourcing/rfqs/:id/consensus-evaluation` (Automated 4-pillar multi-criteria consensus scoring: Price 40%, Quality 30%, SLA 20%, Compliance 10%)
- `POST   /api/sourcing/evaluations` (Submit committee evaluation linking technical, financial, and weighted vendor scorecard scores)
- `GET    /api/sourcing/evaluations` (Retrieve evaluations list and criteria scores by RFQ)
- `GET    /api/sourcing/rfqs/:id/bpa-benchmark` (Report on price tolerance variance vs M09 Blanket Purchase Agreement locked rates)
  - **Module:** M10 — STRATEGIC SOURCING & RFQ
  - **Auth:** JWT Required
  - **Permission:** `purchase:read` (GET), `purchase:write` / `sourcing.evaluation.manage` (POST)
  - **Database:** `sourcing_evaluations`, `sourcing_evaluation_scores`, `srm_bids`, `srm_rfqs`, `bpa_contracts`
  - **Cross-Module Integrations:** M09 Blanket Purchase Agreements (BPA Price Locks >10% tolerance warning), M11 SRM Scorecards (OTIF & Quality scores)
  - **Frontend Consumer:** `M10StrategicSourcingWorkspace.tsx`, `M10ComparisonTab.tsx`, `M10EvaluationTab.tsx`
  - **Status:** Verified (M10 Authority)

**Entity: Tender Awards & M08 Purchase Order Delegation**
- `GET    /api/sourcing/awards` (Query awarded contracts and PO conversion status)
- `POST   /api/sourcing/awards` (Approve award decision with Price Agreement variance check and M30 Cost Center Budget Guard)
- `POST   /api/sourcing/awards/:id/generate-po` (Converts approved award into PO via M08 `POST /api/purchase/orders` delegation)
- `POST   /api/sourcing/awards/:id/seal-dms` (Cryptographically sign SHA-256 and archive tender dossier to M29 DMS Secure Vault)
  - **Module:** M10 — STRATEGIC SOURCING & RFQ
  - **Auth:** JWT Required
  - **Permission:** `purchase:read` (GET), `purchase:approve` / `sourcing.award.approve` (POST)
  - **Database:** `sourcing_awards`, `sourcing_award_lines`, `outbox_events`, `purchase_orders` (delegated)
  - **Cross-Module Integrations:** M08 Purchase Orders (Single-Writer PO delegation hand-off), M30 Cost Center Budget Guard, M29 DMS Vault (SHA-256 seal)
  - **Frontend Consumer:** `M10StrategicSourcingWorkspace.tsx`, `M10AwardsTab.tsx`
  - **Status:** Verified (Single Writer Authority compliant via M08 PO Hand-off)

## M11 — SRM SUPPLIER PERFORMANCE & SCORECARDS

**Entity: Supplier Scorecards & Performance Metrics**
- `GET    /api/srm/scorecards` (Fetch supplier performance scorecards, composite scores, and tiering A/B/C/D)
- `POST   /api/suppliers/:id/scorecards` (Publish new period scorecard with OTD, Quality%, and compliance metrics)
- `PUT    /api/srm/scoring-config` (Update scoring weights and tier thresholds with M02 audit log and `srm.config.manage` permission)
- `GET    /api/quality/suppliers/scorecards` (Cross-module QMS connector reading quality metrics from M39)
  - **Module:** M11 — SRM SUPPLIER PERFORMANCE & SCORECARDS
  - **Auth:** JWT Required
  - **Permission:** `purchase:read` (GET), `srm.config.manage` (PUT/POST)
  - **Database:** `suppliers`, `supplier_scorecards`, `scoring_config`, `audit_logs`
  - **Cross-Module Integrations:** M08 Goods Receipts (OTD source), M39 QMS Inspections (Quality% source), M09 BPA Contracts (Price variance source), M10 Strategic Sourcing (Scorecard weighting consumer), M29 Notifications (Tier escalation alerts), M02 Audit
  - **Frontend Consumer:** `M11SrmSupplierMgmtWorkspace.tsx`, `M10EvaluationTab.tsx`, `Supplier360Modal.tsx`
  - **Status:** Certified & Verified (Read-only consumer of M08/M39/M09 data sources)

## M13 — SALES ORDERS (B2B O2C COMMERCIAL CORE & FULFILLMENT)

**Entity: Sales Orders & B2B Ingestion**
- `GET    /api/sales/orders` (List sales orders with status, customer, amounts, VAT status, and fulfillment)
- `GET    /api/sales/orders/:id` (Full 360-degree order detail with line items, payments, VAT metadata, and audit events)
- `POST   /api/sales/orders/create-b2b` (Create B2B Sales Order with Customer Master lookup, PricingEngine tiered discounts, and M07 Credit Limit Guard)
- `POST   /api/sales/orders/:id/approve` (Approve exception order in PENDING_APPROVAL status, transitions to CONFIRMED, and triggers auto ATP stock reservation)
- `POST   /api/sales/orders/:id/cancel` (Safe cancellation: calls InventoryService.releaseReservation() for RESERVED orders; strictly blocks direct cancellation for INVOICED orders)
  - **Module:** M13 — SALES ORDERS
  - **Auth:** JWT Required / Session Context
  - **Permission:** `sales:read`, `sales:write`, `sales:approve`, `sales:cancel`
  - **Database:** `salesOrders`, `salesOrderItems`, `customers`, `products`, `audit_logs`
  - **Cross-Module Integrations:** M07 Customer Master & Credit Guard, M41 Pricing Engine, M17 InventoryService
  - **Frontend Consumer:** `M13SalesOrdersWorkspace.tsx`, `M13OrdersTab.tsx`, `M13CreateOrderModal.tsx`, `M13OrderDetailModal.tsx`
  - **Status:** Certified & Verified (Acceptance Seal Frozen)

**Entity: ATP Stock Reservation & WMS Goods Issue**
- `POST   /api/sales/orders/:id/reserve` (Single-Writer stock reservation: calls InventoryService.postTransaction() to allocate stock, transitions state to RESERVED)
- `POST   /api/sales/orders/:id/fulfill` (WMS Goods Issue fulfillment: calls InventoryService.postTransaction() with deductReserved=true, deducts stockPhysical and stockReserved atomically)
- `POST   /api/sales/orders/:id/items/:itemId/allocate` (Line-level warehouse stock allocation)
  - **Module:** M13 — SALES ORDERS
  - **Auth:** JWT Required
  - **Permission:** `sales:reserve`, `sales:fulfill`
  - **Database:** `salesOrders`, `salesOrderItems`, `stock_balances`, `stock_ledger`
  - **Cross-Module Integrations:** M17 WMS Inventory Single-Writer Authority, M24 WMS Extended, M42 Costing COGS Layer Valuation
  - **Frontend Consumer:** `M13ReservationTab.tsx`, `M13FulfillmentTab.tsx`, `M13OrderDetailModal.tsx`
  - **Status:** Certified & Verified (Single-Writer Compliant)

**Entity: VAT E-Invoicing & VAS Double-Entry Accounting Postings**
- `POST   /api/sales/orders/:id/issue-vat-invoice` (Issues Decree 123/2020 VAT electronic invoice with Cloud HSM digital signature, generates Tax Authority CQT code, and posts 3 VAS journal entries)
- `GET    /api/sales/orders/:id/vat-preview` (Generates bilingual Decree 123/2020 compliant PDF preview with QR code verification)
- `POST   /api/sales/orders/:id/payments` (Records customer payment/deposit and posts Cash/Bank GL entries clearing 131 Accounts Receivable)
- `POST   /api/sales/orders/convert-from-pos` (Omnichannel sync: converts retail POS receipts into corporate VAT invoices)
  - **Module:** M13 — SALES ORDERS
  - **Auth:** JWT Required
  - **Permission:** `sales:invoice`, `sales:payment`
  - **Database:** `salesOrders`, `accounting_entries`, `invoices`, `payments`, `audit_logs`
  - **Cross-Module Integrations:** M30 Accounting GL (Triple entries: Revenue 1311/5111, VAT 1311/33311, COGS 632/1561), M16 POS Sync
  - **Frontend Consumer:** `M13VatInvoicesTab.tsx`, `M13IssueVatModal.tsx`, `M13PaymentModal.tsx`
  - **Status:** Certified & Verified (VAS Accounting Standard Compliant)

**Entity: M15 RMA Delegation & Immutable Document Protection**
- `POST   /api/sales/orders/:id/returns` (Creates RMA return docket for invoiced orders without mutating historical sales order)
- `GET    /api/sales/orders/:id/returns` (Fetch order RMA requests and credit note status)
- `GET    /api/sales/returns` (Aggregated customer returns directory)
  - **Module:** M13 — SALES ORDERS
  - **Auth:** JWT Required
  - **Permission:** `sales:return`, `rma:create`
  - **Database:** `salesOrders`, `returns`, `credit_notes`
  - **Cross-Module Integrations:** M15 RMA Dispositions (Credit Note generation & return inspection)
  - **Frontend Consumer:** `M13OrderDetailModal.tsx`, `Returns.tsx`
  - **Status:** Certified & Verified (Invoiced Immutability Guard Active)

**Entity: Automated Test Suite & Concurrency Stress Engine**
- `POST   /api/sales/test-suite/run` (Executes automated verification for test cases M13-F01 through M13-F15)
- `POST   /api/sales/test-suite/concurrent-stress` (Live concurrency stress test: verifies atomic ATP allocation and credit limit race condition prevention)
  - **Module:** M13 — SALES ORDERS
  - **Auth:** Admin / QA / Developer Context
  - **Permission:** `system:test`
  - **Frontend Consumer:** `M13TestRunnerTab.tsx`
  - **Status:** Verified (15/15 Pass + Zero Race Conditions)

**Entity: M15 Returns & Customer RMA Management Engine**
- `GET    /api/returns` (Fetch customer RMA requests with status, customer, order and disposition filters)
- `GET    /api/returns/:id` (Fetch single RMA dossier with item breakdown and linked M29 DMS vaulted documents)
- `GET    /api/returns/credit-notes` (Fetch issued Credit Notes with customer and accounting entry references)
- `GET    /api/returns/traceability` (End-to-end traceability audit: SO ➔ Delivery ➔ RMA ➔ QC Inspection ➔ Stock Return ➔ Credit Note)
- `GET    /api/returns/policy` (Fetch enterprise return window and warranty policy criteria)
- `GET    /api/returns/analytics` (Aggregated RMA return metrics, fraud distribution, and cost analysis)
- `POST   /api/returns/rma` / `POST /api/returns` (Create customer return RMA docket linked to sales order with idempotency guard)
- `POST   /api/returns/rma/validate` (Comprehensive eligibility gate: validates delivery lineage, return window, serial numbers & warranty tampering)
- `POST   /api/returns/fraud-check` (Fraud Shield: evaluates customer return velocity, serial duplication & flags director override requirement)
- `POST   /api/returns/:id/approve` (Approve RMA request for warehouse intake)
- `POST   /api/returns/:id/reject` (Reject RMA request with reason)
- `POST   /api/returns/rma/:id/inspect` / `POST /api/returns/:id/inspect` (Record M39 QC inspection result: GOOD / DEFECTIVE / REPAIRABLE)
- `POST   /api/returns/rma/:id/restock` / `POST /api/returns/:id/disposition` / `POST /api/returns/rma/:id/disposition` (Execute disposition: Single-writer M17 restock movement via InventoryService + automatic M30 GL journal posting + M08 RTV claim + M27 Repair WO + M29 DMS vault archival)
- `POST   /api/returns/credit-notes` (Issue Credit Note voucher, settle customer balance & post Dr 5212 / Cr 1311)
- `POST   /api/sales/rma/process` (Backward-compatible multi-action dispatcher)
  - **Module:** M15 — RETURNS & RMA MANAGEMENT
  - **Auth:** JWT Required / Role-Based (`SUPER_ADMIN`, `ADMIN`, `SALES_MANAGER`, `WAREHOUSE_MANAGER`, `ACCOUNTANT`, `QC_INSPECTOR`)
  - **Permission:** `returns:read`, `returns:create`, `returns:approve`, `returns:inspect`, `returns:disposition`, `returns:credit_note`, `returns:fraud_override`
  - **Database:** `rma_requests`, `rma_items`, `credit_notes`, `dms_documents`, `stock_ledger`, `stock_balances`, `accounting_entries`, `audit_logs`, `serial_numbers`, `lots`, `maintenance_work_orders`, `purchase_returns`, `debit_notes`
  - **Cross-Module Integrations:**
    - **M17 Core Inventory:** Exclusive single writer `InventoryService.postTransaction()` with `RETURN_FROM_CUSTOMER` type.
    - **M30 General Ledger:** Exclusive single writer `accountingEngine.postJournal()` for VAS entries (Dr 5212/Cr 1311, Dr 1561/Cr 632, Dr 5212/Cr 1111).
    - **M22/M23 Serial & Lot Tracking:** Serial lineage validation and tamper check.
    - **M08/M11 SRM:** Automated RTV purchase return creation and AP debit notes.
    - **M27 EAM Maintenance:** Work order creation for in-house repair routing.
    - **M29 DMS Digital Vault:** Cryptographic tamper-evident SHA-256 sealing of RMA dossiers and Credit Note vouchers.
    - **M36 TMS Logistics:** Automatic ingestion of RMA upon delivery failure.
    - **M39 Quality Control:** Technical inspection gating.
    - **M02 Audit Trail:** SHA-256 tamper-evident action logging across 10 lifecycle milestones.
  - **Frontend Consumer:** `M15ReturnsRMAWorkspace.tsx`, `Returns.tsx`
  - **Status:** `[ACCEPTANCE SEAL — COMPLETE, VERIFIED & FROZEN]` (15/15 Zero-Mock Tested M15-F01 ➔ M15-F15 Certified)

**Entity: Stock Balances, Ledger & Single-Writer Transactions**
- `GET    /api/inventory/balances` (Query multi-dimensional stock balances by warehouse and product)
- `GET    /api/inventory/ledger` (Immutable append-only stock movement audit trail)
- `POST   /api/inventory/transactions` (Single-writer postTransaction engine enforcing 3-state inventory and negative stock guard)
- `POST   /api/inventory/reservations` (Reserve stock for orders / allocations)
- `POST   /api/inventory/reservations/:id/release` (Release stock reservation)
- `POST   /api/inventory/transfers` (Atomic internal stock transfers across locations/warehouses)
  - **Module:** M17 — MASTER WMS & CORE INVENTORY ENGINE
  - **Auth:** JWT / Role-based Context
  - **Permission:** `inventory:read` (GET), `inventory:write` (POST)
  - **Database:** `stock_balances`, `stock_ledger`, `stock_reservations`, `lot_balances`, `serial_numbers`, `warehouse_locations`, `audit_logs`
  - **Frontend Consumer:** `MasterWmsWorkspace.tsx`, `Inventory.tsx`, `SalesOrders.tsx`, `POS.tsx`, `Purchase.tsx`
  - **Status:** Verified (M17 Single-Writer SSOT Certified)

**Entity: Stock Adjustments (Multi-dimensional Adaptive Engine)**
- `GET    /api/stock-adjustments` (Paginated list with filters: warehouse, status, search, page, limit)
- `GET    /api/stock-adjustments/:id` (Detailed record with items, product SKU/names, and serials)
- `POST   /api/stock-adjustments` (Create DRAFT adjustment with auto-generated code and item validations)
- `PUT    /api/stock-adjustments/:id` (Update DRAFT adjustment header and item collection)
- `PATCH  /api/stock-adjustments/:id` (Partial update DRAFT adjustment)
- `POST   /api/stock-adjustments/:id/duplicate` (Duplicate DRAFT adjustment to a new DRAFT document without side effects)
- `POST   /api/stock-adjustments/:id/approve` (Atomic approval, single transaction: Inventory + Costing + Serials/Lots + Double-entry Accounting)
- `POST   /api/stock-adjustments/:id/reject` (Reject DRAFT with audit reason)
- `POST   /api/stock-transfers`
  - **Module:** INVENTORY
  - **Auth:** JWT Required
  - **Permission:** `stock_adjustment.view`, `stock_adjustment.create`, `stock_adjustment.approve`, `stock_adjustment.reject`
  - **Database:** `stock_adjustments`, `stock_adjustment_items`, `stock_adjustment_serials`, `stock_balances`, `stock_ledger`, `lot_balances`, `serial_numbers`, `serial_history`, `cost_layers`, `cogs_transactions`, `accounting_entries`, `audit_logs`
  - **Frontend Consumer:** `StockAdjustment.tsx`, `Inventory.tsx`
  - **Status:** Verified (36/36 API Route Tests + Targeted Duplicate Tests Passing)

**Entity: Stocktake & Inventory Counting**
- `GET    /api/stocktakes`
- `GET    /api/stocktakes/:id`
- `POST   /api/stocktakes` (Create Draft)
- `PUT    /api/stocktakes/:id` (Update Draft)
- `POST   /api/stocktakes/:id/start` (Start counting & snapshot)
- `POST   /api/stocktakes/:id/count` (Input count with multi-round history)
- `POST   /api/stocktakes/:id/submit-approval` (Submit for approval)
- `POST   /api/stocktakes/:id/approve` (Approve count & variance)
- `POST   /api/stocktakes/:id/complete` (Reconcile balances & generate adjustment)
- `POST   /api/stocktakes/:id/cancel` (Cancel stocktake)
  - **Module:** INVENTORY
  - **Auth:** JWT Required
  - **Permission:** `stocktake.view`, `stocktake.create`, `stocktake.edit`, `stocktake.start`, `stocktake.count`, `stocktake.approve`, `stocktake.complete`, `stocktake.cancel`
  - **Database:** `stocktakes`, `stocktake_items`, `stocktake_counts`, `stock_adjustments`, `stock_ledger`, `stock_balances`, `accounting_entries`, `activity_logs`
  - **Frontend Consumer:** `Stocktake.tsx`
  - **Status:** Verified (17/17 Integration Tests Passing)

## PURCHASE (P2P)

**Entity: Suppliers (M09 - SRM Master Data & Dual Control)**
- `GET    /api/suppliers` (List directory with filters & pagination)
- `GET    /api/suppliers/:id` (360° Profile details, contacts, bank accounts, PO history)
- `POST   /api/suppliers` (Create supplier with Idempotency-Key)
- `PUT    /api/suppliers/:id` (Update legal profile)
- `DELETE /api/suppliers/:id` (Soft archive with FK reference guard)
- `POST   /api/suppliers/:id/contacts` (Add multi-role contact)
- `DELETE /api/suppliers/:id/contacts/:contactId` (Delete contact)
- `POST   /api/suppliers/:id/bank-accounts` (Add bank account with Dual Control & cooling-off initiation)
- `PATCH  /api/suppliers/:id/bank-accounts/:bankId/approve` (Dual Control Maker-Checker approval)
- `DELETE /api/suppliers/:id/bank-accounts/:bankId` (Remove bank account)
- `PATCH  /api/suppliers/:id/terms` (Update Payment Terms & Credit Limits)
- `GET    /api/suppliers/analytics/spend` (Supplier spend analysis)
  - **Module:** M09 - PURCHASE (P2P)
  - **Auth:** JWT Required
  - **Permission:** `purchase:read`, `purchase:write`, `purchase:admin`, `supplier.bank.manage`, `supplier.bank.approve`
  - **Database:** `suppliers`, `supplier_contacts`, `supplier_bank_accounts`
  - **Frontend Consumer:** `M09SuppliersSRMWorkspace.tsx`, `Supplier360Modal.tsx`, `SupplierTermsTab.tsx`
  - **Status:** Verified & Certified (Anti-BEC Dual Control & Cooling-off Active)

## M08 — PURCHASE ORDERS & 3-WAY MATCHING (P2P)

**Entity: Purchase Orders & Approval Workflow**
- `GET    /api/purchase-orders` (Enriched list of POs with line items, supplier, matching status, and M28 matrix)
- `GET    /api/purchase-orders/:id` (Detailed PO by code/id with line items, warehouse, GR history, and 3-way match data)
- `GET    /api/purchase-orders/:id/items` (Line items breakdown with SKU, UOM, ordered, received, and remaining quantities)
- `POST   /api/purchase-orders` (Create PO with Idempotency Key, M30 Budget Guard, and M28 Multi-Tier Approval Matrix evaluation)
- `POST   /api/purchase-orders/:id/submit-approval` (Transition PO state to PENDING_APPROVAL and evaluate M28 approval routing)
- `POST   /api/purchase-orders/:id/approve` (Approve PO, commit budget to Cost Center, and transition state to APPROVED)
- `POST   /api/purchase-orders/:id/reject` (Reject or cancel PO with mandatory justification and audit logging)
  - **Module:** M08 — PURCHASE ORDERS (P2P)
  - **Auth:** JWT Required
  - **Permission:** `purchase:read` (GET), `purchase:write` (POST), `purchase:approve` (POST approve/reject)
  - **Database:** `purchase_orders`, `purchase_order_items`, `cost_centers`, `outbox_events`, `audit_logs`
  - **Cross-Module Integrations:** M30 General Ledger / Cost Center Budget Guard, M28 Workflow Matrix Engine, M10 Strategic Sourcing Award Delegation, M02 Centralized Audit
  - **Frontend Consumer:** `M08PurchaseOrdersWorkspace.tsx`, `Purchase.tsx`
  - **Status:** Verified (M08 SSOT)

**Entity: Goods Receipts (Inbound Inventory Authority)**
- `GET    /api/goods-receipts` (List goods receipts with warehouse name, PO reference, and base quantities)
- `POST   /api/goods-receipts` (Process Goods Receipt: Idempotency Key, Multi-UOM conversion via M07, Over-Receipt Guard, and Single-Writer Inventory Posting via M17 `InventoryService.postTransaction()`)
  - **Module:** M08 — PURCHASE / M17 — INVENTORY
  - **Auth:** JWT Required
  - **Permission:** `inventory:write`, `purchase:write`
  - **Database:** `goods_receipts`, `goods_receipt_items`, `purchase_order_items`, `stock_ledger`, `stock_balances`, `outbox_events`, `audit_logs`
  - **Cross-Module Integrations:** M17 Master WMS (`InventoryService.postTransaction()` Single Writer), M07 UOM Conversions, M02 Central Audit
  - **Frontend Consumer:** `M08PurchaseOrdersWorkspace.tsx`, `Purchase.tsx`
  - **Status:** Verified (M17 Single-Writer Authority Compliant)

**Entity: 3-Way Matching & Discrepancy Resolution**
- `GET    /api/purchase/matching-cases` (3-Way Matching Engine: automated PO ↔ GR ↔ AP Invoice comparison with tolerance check)
- `GET    /api/purchase-orders/:id/three-way-match` (Per-PO 3-Way matching breakdown and discrepancy flags)
- `POST   /api/purchase/matching-cases/:id/resolve` (Dispute & discrepancy resolution with audit trail)
  - **Module:** M08 — PURCHASE / M31 — INVOICES (AP)
  - **Auth:** JWT Required
  - **Permission:** `purchase:read` (GET), `purchase:write` (POST)
  - **Database:** `purchase_orders`, `purchase_order_items`, `goods_receipts`, `invoices`, `audit_logs`
  - **Cross-Module Integrations:** M31 Accounts Payable Invoices, M02 Central Audit
  - **Frontend Consumer:** `M08PurchaseOrdersWorkspace.tsx`, `Purchase.tsx`
  - **Status:** Verified

**Entity: Blanket Purchase Agreements (Framework BPA Contracts)**
- `GET    /api/purchase/contracts` (Query long-term procurement framework agreements and price locks)
- `POST   /api/purchase/contracts` (Create framework contract with committed budget, discount rates, and locked prices)
- `PUT    /api/purchase/contracts/:id/renew` (Renew contract with additional budget and validity extension)
- `PUT    /api/purchase/contracts/:id` (Update contract specifications)
- `DELETE /api/purchase/contracts/:id` (Terminate framework contract)
  - **Module:** M08 — PURCHASE / M09 — SRM
  - **Auth:** JWT Required
  - **Permission:** `purchase:read` (GET), `purchase:write` (POST/PUT/DELETE)
  - **Database:** `bpa_contracts`, `audit_logs`
  - **Frontend Consumer:** `M08PurchaseOrdersWorkspace.tsx`, `Purchase.tsx`
  - **Status:** Verified

## SALES (O2C)

*(Note: Master Data Entity `Customers` is canonically registered and unified under `M07 — ENTERPRISE MASTER DATA` above)*

**Entity: Sales Orders & POS**
- `POST   /api/sales-orders/pos`
  - **Module:** SALES
  - **Auth:** JWT Required
  - **Permission:** `pos:sell`
  - **Database:** `sales_orders`, `sales_order_items`, `goods_issues`
  - **Frontend Consumer:** `POS.tsx`
  - **Status:** Verified

**Entity: Invoices**
- `GET    /api/invoices`
- `GET    /api/invoices/:id`
- `POST   /api/invoices`
- `PUT    /api/invoices/:id/cancel`
  - **Module:** SALES / FINANCE
  - **Auth:** JWT Required
  - **Permission:** `invoice:read`, `invoice:write`
  - **Database:** `invoices`, `invoice_items`
  - **Frontend Consumer:** `Invoices.tsx`
  - **Status:** Verified

## FINANCE & ACCOUNTING

**Entity: Payments**
- `GET    /api/payments`
- `POST   /api/accounting/payments`
  - **Module:** FINANCE
  - **Auth:** JWT Required
  - **Permission:** `payment:read`, `payment:write`
  - **Database:** `payments`, `accounting_entries`
  - **Frontend Consumer:** `Payments.tsx`
  - **Status:** Verified

**Entity: Accounting & GL**
- `GET    /api/accounting/summary`
- `GET    /api/accounting/revenue`
- `GET    /api/accounting/receivables/:customerId/statement`
- `POST   /api/accounting/entries`
  - **Module:** FINANCE
  - **Auth:** JWT Required
  - **Permission:** `accounting:read`, `accounting:write`
  - **Database:** `accounting_entries`, `accounting_accounts`
  - **Frontend Consumer:** `Accounting.tsx`
  - **Status:** Verified

**Entity: Costing & COGS Engine (Module M42 - WS31_COGS)**
- `GET    /api/cogs/transactions` (Fetch authoritative COGS transaction logs)
- `GET    /api/cogs/cost-layers` (Fetch active inventory cost layers / FIFO valuation layers)
- `GET    /api/cogs/allocation` (Fetch M42 workspace allocation summary, cost pools & layers)
- `POST   /api/cogs/calculate-order` (Calculate order issue cost / COGS via CostingEngine)
- `GET    /api/cogs/settings` (Fetch global costing method configuration: FIFO / WEIGHTED_AVERAGE)
- `PUT    /api/cogs/settings` (Update global costing method with RBAC & audit trail)
- `POST   /api/cogs/landed-cost` (Allocate Landed Cost: Freight, Duty, Insurance to Goods Receipt layers)
- `GET    /api/costing/layers` (Cost layers retrieval endpoint)
- `POST   /api/costing/landed-cost/allocate` (Canonical landed cost allocation endpoint)
- `GET    /api/costing/rollout-status` (Phase 5 rollout routing & shadow run status)
  - **Module:** M42 (Cost Allocation & COGS) / FINANCE
  - **Auth:** JWT Required (Role: CFO, CHIEF_ACCOUNTANT, FINANCE_ADMIN, SUPER_ADMIN)
  - **Permission:** `accounting:read`, `accounting:write`, `costing.settings.manage`
  - **Database:** `cogs_transactions`, `cost_layers`, `costing_settings`, `landed_cost_allocations`, `accounting_entries`, `audit_logs`
  - **Frontend Consumer:** `M42CogsAllocationWorkspace.tsx` / `M42CostAllocationWorkspace.tsx`
  - **Status:** Verified (Single-Writer Authority Certified)

## M14 — SALES COMMISSION & INCENTIVE ENGINE (CANONICAL FOR FORMER MODULE 34)

**Entity: Margin-based Calculation & Event-driven Trigger**
- `POST   /api/commission/calculate/margin-based` (Margin-based commission calculation reading GET /api/cogs/transactions via M42)
- `POST   /api/commission/subscribe-events` (Registers listener on M05 EventBus for order/invoice completion with idempotency)
  - **Module:** M14 — SALES COMMISSION & INCENTIVE ENGINE
  - **Auth:** JWT Required
  - **Permission:** `commission.calculate`
  - **Database:** `commission_calculations` (field `calculationBasis`: `'REVENUE' | 'GROSS_MARGIN'`), `cost_layers`/`cogs_transactions` (READ-ONLY, M42 owned)
  - **Cross-Module Integrations:** M42 Costing & Landed Cost Engine (COGS valuation), M05 EventBus (Transactional Outbox events)
  - **Status:** Implemented & Verified

**Entity: Clawback Engine**
- `GET    /api/commission/clawbacks` (Fetch all RMA-related commission clawback deductions)
- `POST   /api/commission/clawbacks/generate` (Generates clawback calculation delegating trigger from M15 Returns)
  - **Module:** M14 — SALES COMMISSION / M15 — RETURNS & RMA
  - **Auth:** JWT Required
  - **Permission:** `commission.clawback.manage`
  - **Database:** `commission_calculations` (`isClawback = true`), `rma_requests` (M15 - READ-ONLY)
  - **Cross-Module Integrations:** M15 Returns & RMA (Single-Writer RMA Dispositions)
  - **Status:** Implemented & Verified

**Entity: Dispute & Payroll Disbursement**
- `POST   /api/commission/disputes` (Submit sales rep commission calculation dispute)
- `POST   /api/commission/disputes/:id/resolve` (Approve/reject dispute and generate adjustment calculation)
- `POST   /api/commission/payouts/:id/pay-via-payroll` (Delegates disbursement to M28 HR & Payroll and posts GL Nợ 3388 / Có 3341)
  - **Module:** M14 — SALES COMMISSION / M28 — HR & PAYROLL
  - **Auth:** JWT Required
  - **Permission:** `commission.dispute.manage`, `commission.payout`
  - **Database:** `commission_disputes`, `commission_calculations`, `commission_payouts`, `payroll_runs` (M28 - written via delegation)
  - **Cross-Module Integrations:** M28 HR & Payroll, M30 General Ledger Accounting
  - **Status:** Implemented & Verified

**Entity: Core Commission Plans, Quotas & Payout Batches**
- `GET    /api/commission/dashboard` (KPI metrics, total gross/net, quota attainment)
- `GET    /api/commission/plans` (Fetch all plans with tiered rules)
- `POST   /api/commission/plans` (Create commission plan with tiered rules)
- `PUT    /api/commission/plans/:id` (Update commission plan and rules)
- `GET    /api/commission/quotas` (Fetch sales reps quotas & attainment)
- `POST   /api/commission/quotas` (Assign KPI sales quota)
- `GET    /api/commission/calculations` (Fetch audit log of order commissions)
- `POST   /api/commission/calculate` (Evaluate or recalculate order commission)
- `GET    /api/commission/payouts` (Fetch settlement batches)
- `GET    /api/commission/payouts/:id` (Fetch settlement batch items & beneficiary breakdown)
- `POST   /api/commission/payouts` (Generate payout settlement batch)
- `POST   /api/commission/payouts/:id/approve` (Approve payout batch & post GL accrual Nợ 6418 / Có 3388)
- `POST   /api/commission/payouts/:id/pay` (Disburse payout batch direct & post GL payment Nợ 3388 / Có 1111/1121)
- `GET    /api/commission/analytics` (Leaderboard & top sales rep revenue performance)
  - **Module:** M14 — SALES COMMISSION & INCENTIVE ENGINE
  - **Auth:** JWT Required
  - **Permission:** `commission.view`, `commission.plan.manage`, `commission.quota.manage`, `commission.calculate`, `commission.approve`, `commission.payout`
  - **Database:** `commission_plans`, `commission_rules`, `sales_quotas`, `commission_calculations`, `commission_payouts`, `commission_payout_items`, `accounting_entries`
  - **Frontend Consumer:** `M14SalesCommissionWorkspace.tsx` (`Commission.tsx`)
  - **Status:** Certified & Active (Verified)

## EVENTBUS & TRANSACTIONAL OUTBOX EDA PLATFORM (MODULE 05)

**Entity: EventBus, Transactional Outbox & Dead Letter Queue (DLQ)**
- `GET    /api/events/outbox` (Fetch real-time event stream and pending queue)
- `POST   /api/events/publish` (Publish custom event payload to event bus)
- `POST   /api/events/trigger-business-event` (Trigger enterprise cross-module event simulation)
- `GET    /api/outbox/messages` (Query outbox messages with pagination, topic and status filters)
- `GET    /api/outbox/dlq` (Query Dead Letter Queue quarantined messages)
- `POST   /api/outbox/retry` (Replay failed events from DLQ and log to Audit M02)
- `POST   /api/events/retry/:id` (Retry individual failed event)
- `POST   /api/events/retry-all-dlq` (Retry all quarantined DLQ events)
- `GET    /api/events/subscribers` (Fetch registered consumers and real-time lag)
- `POST   /api/events/subscribers` (Dynamically register a new consumer)
- `POST   /api/events/subscribers/:id/restart` (Restart degraded consumer pod)
- `POST   /api/events/subscribers/:id/reset-offset` (Reset consumer offset to LATEST)
- `POST   /api/events/dispatch-pending` (Trigger immediate manual outbox relay sweep)
- `POST   /api/outbox/archive` (Archive and prune expired processed events)
- `GET    /api/events/metrics` (Broker throughput, latency, and availability metrics)
- `GET    /api/event-bus/summary` (Quick summary count of outbox and DLQ events)
- `GET    /api/events/trace/:correlationId` (Trace full event lifecycle by correlation ID)
  - **Module:** MODULE 05 (EVENTBUS & EDA)
  - **Auth:** JWT Required
  - **Permission:** `events:read`, `events:write`, `events:admin`
  - **Database:** `outbox_events`, `processed_events`, `dlq_events`, `audit_logs`
  - **Frontend Consumer:** `M05EventBusWorkspace.tsx`
  - **Status:** Verified (Full Upgrade Complete)

## M24 — WMS EXTENDED (WAVE PICKING, LPN & DOCK APPOINTMENTS)

**Entity: WMS Extended Operations & Logistics**
- `GET    /api/wms/wave-picks` (Fetch wave picking batches and status)
- `GET    /api/wms/wave-picks/:id` (Fetch single wave pick details)
- `POST   /api/wms/wave-picks` (Create new wave picking batch)
- `POST   /api/wms/wave-picks/:id/assign` (Assign picker to a wave)
- `POST   /api/wms/wave-picks/:id/confirm` (Confirm pick line and mutate via InventoryService M17)
- `POST   /api/wms/wave-picks/:id/close` (Close wave batch)
- `GET    /api/wms/lpn` (Fetch License Plate Number pallets and cartons)
- `POST   /api/wms/lpn` (Create LPN and pack items)
- `POST   /api/wms/lpn/move` (Putaway or transfer LPN nguyên khối via InventoryService M17)
- `GET    /api/wms/docks` (Fetch dock appointments and time slots)
- `POST   /api/wms/docks` (Schedule dock appointment with capacity guard)
- `POST   /api/wms/docks/:id/checkin` (Check-in truck at dock)
- `GET    /api/wms/expiry-check` (Check FEFO expiry recommendations via M12)
- `POST   /api/wms/route-opt` (Optimize picking route via M22)
- `GET    /api/wms/capacity-guard` (Check zone capacity via M06)
- `GET    /api/wms/sla-alerts` (Check idle SLA alerts via M36)
  - **Module:** M24 — WMS EXTENDED
  - **Auth:** JWT Required
  - **Permission:** `wms.wave.manage`, `wms.lpn.manage`, `wms.dock.manage`, `warehouse`, `admin`
  - **Database:** `wave_picks`, `wave_pick_items`, `lpn`, `lpn_contents`, `dock_appointments`, `stock_balances`, `stock_ledger`
  - **Frontend Consumer:** `M24WMSExtendedWorkspace.tsx`
  - **Status:** Certified & Active

## M25 — MANUFACTURING EXECUTION & BOM (MES)

**Entity: BOM, Routing & Work Centers**
- `GET    /api/manufacturing/boms` (Fetch Bills of Materials with components, scrap %, and active version)
- `POST   /api/manufacturing/boms` (Create multi-level engineering BOM with initial version V1.0)
- `GET    /api/manufacturing/boms/:id/versions` (Fetch version history for engineering change tracking)
- `POST   /api/manufacturing/boms/:id/versions` (Publish new BOM version with zero-overwrite policy)
- `GET    /api/manufacturing/routings` (Fetch operational routings with sequenced operations)
- `POST   /api/manufacturing/routings` (Configure production routing with setup and run standard times)
- `GET    /api/manufacturing/work-centers` (Fetch work center registry, capacity, and machine hourly cost rate)
- `POST   /api/manufacturing/work-centers` (Register or update work center capacity and operating status)

**Entity: Work Orders (MO) Lifecycle, Consumption & Variance**
- `GET    /api/manufacturing/work-orders` (Query Manufacturing Orders with stage, yield, and variance indicators)
- `POST   /api/manufacturing/work-orders` (Create new Work Order linked to approved BOM and routing)
- `PUT    /api/manufacturing/work-orders/:id/status` (Guarded state machine transition with lock validation)
- `POST   /api/manufacturing/work-orders/:id/release` (Release MO to shop floor and reserve raw materials in M17)
- `POST   /api/manufacturing/work-orders/:id/issue-materials` (Manual line-by-line raw material issue via M17 single writer)
- `POST   /api/manufacturing/work-orders/:id/backflush` (Automatic backflush material deduction via M17 on completion)
- `POST   /api/manufacturing/work-orders/:id/report-scrap` (Record actual scrap quantity, reason codes, and yield %)
- `POST   /api/manufacturing/orders/from-mrp` (Convert planned production orders from M26 MRP netting engine)
- `POST   /api/manufacturing/work-orders/:id/qc-hold` (Apply or release M39 QMS quarantine hold on WIP/FG)
- `POST   /api/manufacturing/work-orders/:id/assign-lot-serial` (Generate finished goods Lot M22 and Serials M23 with genealogy)
- `GET    /api/manufacturing/work-orders/:id/cost-variance` (Read-only variance reconciliation between standard and actual costs)
- `POST   /api/manufacturing/work-orders/:id/complete` (Finalize production, receive FG via M17, calculate yield, and seal MO)
- `POST   /api/manufacturing/work-orders/:id/cancel` (Cancel MO, release M17 stock reservations, and log reason)
- `POST   /api/manufacturing/work-orders/:id/dms-dossier` (Seal manufacturing batch traveler & test certs into M29 DMS)
  - **Module:** M25 — MANUFACTURING EXECUTION & BOM (MES)
  - **Auth:** JWT Required
  - **Permission:** `manufacturing:read`, `manufacturing:write`, `manufacturing.bom.manage`, `manufacturing.mo.release`, `manufacturing.mo.complete`
  - **Database:** `boms`, `bom_items`, `bom_versions`, `routings`, `routing_operations`, `work_centers`, `manufacturing_orders`, `work_order_items`, `work_order_operations`, `production_outputs`, `material_consumptions`, `production_costs`, `audit_logs`
  - **Single-Writer Handover:**
    - Stock mutation: Delegates strictly to M17 `InventoryService.postTransaction()`.
    - Valuation: Reads standard costs from M42 (read-only); zero direct mutation of frozen costing tables.
    - Quality hold: Delegates to M39 `QualityService`.
    - Lot/Serial: Delegates to M22 (`product_lots`) and M23 (`product_serials`).
  - **Cross-Module Integrations:** M06 (R&D Handover), M17 (Inventory Single Writer), M22/M23 (Traceability), M26 (MRP Planned Orders), M27 (EAM Maintenance), M28 (HR Labor), M39 (QC Inspections), M42 (Costing COGS), M02 (Audit Trail), M29 (DMS Vault)
  - **Frontend Consumer:** `ManufacturingWorkspace.tsx`
  - **Status:** Verified (Live QA Certified: 2026-09-21)

## M26 — SUPPLY CHAIN PLANNING & MRP NETTING (SCP)

**Entity: Statistical Demand Forecasts & Master Production Schedules (MPS)**
- `GET    /api/scm/forecasts` (Retrieve statistical demand forecasts with accuracy metrics MAE/MAPE)
- `POST   /api/scm/forecasts` (Generate/update statistical forecast with Exponential Smoothing, Holt-Winters)
- `GET    /api/scm/mps` (Retrieve Master Production Schedules with Projected Available Balance and Available-To-Promise)
- `POST   /api/scm/mps` (Schedule MPS master production lots balancing Sales Order demand & forecasts)

**Entity: Material Requirements Planning (MRP) Engine & Netting**
- `POST   /api/scm/mrp/run` (Regenerative & Net-change idempotent MRP netting calculation across BOM levels)
- `GET    /api/scm/mrp/results` (Fetch computed gross/net requirements, planned order releases, and suggested actions)
- `GET    /api/scm/mrp/exceptions` (Retrieve exception alerts: stockouts, lead time violations, past-due orders, excess)
- `POST   /api/scm/mrp/exceptions/:id/resolve` (Acknowledge and resolve planning exception message)
- `GET    /api/scm/mrp/runs` (Fetch historical immutable MRP execution runs with execution duration and summary stats)
- `GET    /api/scm/mrp/runs/:id` (Retrieve single MRP run details with full breakdown of results and exceptions)
- `GET    /api/scm/mrp/pegging` (Full pegging lineage trace: component demand -> intermediate sub-assembly MO -> finished good -> source Sales Order M13)
- `GET    /api/scm/mrp/net-requirements` (Calculated net requirements view with on-hand, reserved, safety stock, and scheduled receipts)
- `GET    /api/scm/safety-stock/guard` (Lead time and dynamic safety stock guard metrics across suppliers and items)
- `POST   /api/scm/mrp/runs/:id/vault-dms` (Cryptographically seal complete MRP planning snapshot and traveler into M29 DMS)

**Entity: Purchase Requisition & Manufacturing Order Delegation (Single-Writer Gateways)**
- `GET    /api/scm/purchase-requisitions` (Fetch generated purchase requisitions from MRP netting)
- `POST   /api/scm/purchase-requisitions` (Create purchase requisition suggestion)
- `POST   /api/scm/purchase-requisitions/:id/delegate-po` (Delegate PR to M08 Purchase Order Single Writer: creates formal PO in `purchase_orders`)
- `POST   /api/scm/mo-suggestions` (Delegate MO suggestions to M25 Manufacturing Order Single Writer: creates formal MO in `manufacturing_orders`)
- `POST   /api/scm/delegation/batch` (Batch delegation gateway to create multiple POs in M08 and MOs in M25 atomically)

**Entity: Backward Compatibility & Compatibility Aliases**
- `GET    /api/supply-chain/plans` (Backward-compatibility read endpoint returning active supply plans)
- `GET    /api/supply-chain/forecasts` (Backward-compatibility endpoint for legacy demand forecasts)
- `POST   /api/supply-chain/calculate-mrp` (Backward-compatibility trigger delegating directly to `/api/scm/mrp/run`)

  - **Module:** M26 — SUPPLY CHAIN PLANNING & MRP (SCP)
  - **Auth:** JWT Required
  - **Permission:** `scm:read`, `scm:write`, `scm.mrp.run`, `scm.pr.delegate`, `scm.mo.delegate`
  - **Database:** `scm_forecasts`, `mps_schedules`, `mrp_runs`, `mrp_results`, `mrp_exceptions`, `purchase_requisitions`, `supply_plans`, `demand_forecasts`
  - **Single-Writer Handover:**
    - PO Generation: Delegates strictly to M08 `POST /api/purchase-orders`. Zero direct mutations to `purchase_orders`.
    - MO Generation: Delegates strictly to M25 `POST /api/manufacturing/work-orders` or `POST /api/manufacturing/orders/from-mrp`. Zero direct mutations to `manufacturing_orders`.
    - Inventory Balances: Reads on-hand and reserved balances from M17 (`stock_balances` and `products`); zero direct stock adjustments.
    - Costing Authority: Reads standard unit costs from M42 (read-only); zero direct mutation to cost layers.
  - **Cross-Module Integrations:** M13 (Sales Order Demand & Pegging), M17 (Stock Balances & Reserved Inventory), M25 (Multi-Level BOM Explosion & MO Delegation), M08 (PO Delegation), M09/M07 (Supplier Lead Time & Safety Stock Guard), M37 (Supply Chain BI Analytics), M02 (Audit Trail Logging via `AuditService.recordAuditLog()`), M29 (DMS Snapshot Vaulting).
  - **Frontend Consumer:** `SupplyChainWorkspace.tsx`
  - **Status:** Verified (Live QA Certified: 2026-09-21)

## M39 — QUALITY CONTROL & INSPECTION (QMS)

**Entity: Quality Plans, Inspections, NCRs, CAPAs & Batch Releases**
- `GET    /api/quality/plans` (Fetch inspection plans for IQC, PQC, OQC)
- `POST   /api/quality/plans` (Create inspection plan & technical criteria)
- `GET    /api/quality/inspections` (Fetch inspection records with AQL sampling status)
- `POST   /api/quality/inspections` (Record inspection results & trigger quarantine hold)
- `POST   /api/quality/inspections/:id/evaluate` (Run automated Pass/Fail AQL evaluation)
- `GET    /api/quality/ncrs` (Fetch Non-Conformance Reports & CAPA workflows)
- `POST   /api/quality/ncrs` (Raise NCR ticket & enforce quarantine isolation)
- `POST   /api/quality/ncrs/:id/capa` (Submit Corrective & Preventive Action)
- `GET    /api/quality/batch-releases` (Fetch batch release clearance status)
- `POST   /api/quality/batch-releases/:id/approve` (Approve batch release & post InventoryService release)
- `POST   /api/quality/inspections/:id/seal-coa` (Cryptographically seal COA with SHA-256 and store in M29 DMS)
- `GET    /api/quality/suppliers/scorecards` (Fetch supplier quality scorecards for M11 SRM integration)
- `GET    /api/quality/suppliers/:id/scorecard` (Fetch detailed quality rating for specific supplier)
- `GET    /api/quality/kpi` (Fetch quality KPI dashboard metrics)
  - **Module:** M39 — QUALITY CONTROL & INSPECTION (QMS)
  - **Auth:** JWT Required
  - **Permission:** `quality.plan.manage`, `quality.inspection.manage`, `quality.ncr.manage`, `quality.ncr.approve`
  - **Database:** `qc_plans`, `qc_criteria`, `qc_inspections`, `qc_inspection_results`, `qc_ncrs`, `qc_capas`, `qc_batch_releases`, `dms_documents`, `audit_logs`
  - **Frontend Consumer:** `M39QualityControlWorkspace.tsx`
  - **Status:** Certified & Active

## M36 — LOGISTICS & FLEET TRANSPORTATION (TMS)

**Entity: Fleet Master & Driver Registry**
- `GET    /api/logistics/vehicles` (Fetch vehicle fleet directory and status)
- `POST   /api/logistics/vehicles` (Register new transport vehicle with plate, capacity & fuel type)
- `GET    /api/logistics/drivers` (Fetch driver personnel roster and license status)
- `POST   /api/logistics/drivers` (Register new driver profile with license class and expiry)
- `GET    /api/logistics/kpi` (Fetch fleet operational KPI metrics: active vehicles, drivers, orders, costs & OTIF rate)
- `PUT    /api/logistics/vehicles/:id` (Update vehicle status and mileage)
- `GET    /api/logistics/fuel-transactions` (Fetch fuel refueling log and mileage logs)
- `POST   /api/logistics/fuel-transactions` (Record fuel purchase and update vehicle mileage)
- `GET    /api/logistics/driver-safety-scores` (Fetch telemetry driver safety scoring, eco-stars and risk tiers)
  - **Module:** M36 — LOGISTICS & FLEET
  - **Auth:** JWT Required
  - **Permission:** `logistics.fleet.manage`
  - **Database:** `vehicles` (`logistics_vehicles`), `drivers` (`logistics_drivers`), `fuel_transactions`, `audit_logs`
  - **Frontend Consumer:** `M36LogisticsWorkspace.tsx`
  - **Status:** Certified & Active (Fully Implemented & Verified)

**Entity: Shipment Dispatch, Route & POD**
- `GET    /api/logistics/deliveries` (Fetch transport orders, waybills, vehicle/driver assignments and POD status)
- `POST   /api/logistics/shipments` (Consolidated multi-order dispatch, Waybill issuance, DMS archival & atomic vehicle/driver locking)
- `POST   /api/logistics/routes` (Multi-stop TSP route optimization, fuel consumption forecast & cost calculation)
- `POST   /api/logistics/pod` (Electronic Proof of Delivery e-POD capture, signature, photo & immutable status finalization)
- `POST   /api/logistics/shipments/:id/status` (Update live GPS/telemetry tracking status)
- `POST   /api/logistics/shipments/:id/fail-delivery` (Record delivery failure exception & delegate RMA creation to M15)
- `POST   /api/logistics/orders` (Create new transport order / shipment batch)
- `POST   /api/logistics/orders/:id/assign` (Assign vehicle and driver to transport order with atomic status updates)
- `POST   /api/logistics/orders/:id/status` (Update transport order tracking status)
  - **Module:** M36 — LOGISTICS & FLEET
  - **Auth:** JWT Required
  - **Permission:** `logistics.dispatch.manage`, `logistics.pod.record`
  - **Database:** `transport_orders` (`shipments`), `proof_of_deliveries` (`pod_records`), `dms_documents`, `audit_logs`
  - **Cross-Module Integrations:** M13 (Fulfillment status sync — read/callback only), M17 (Read-only stock confirmation), M15 (RMA delegation on failed delivery), M02 (Audit Trail), M29 (DMS waybill/POD archival)
  - **Frontend Consumer:** `M36LogisticsWorkspace.tsx`
  - **Status:** Certified & Active (Fully Implemented & Verified)

**Entity: Freight Costing & COD Reconciliation**
- `POST   /api/logistics/freight` (Freight cost calculation, M42 Landed Cost allocation & M30 GL journal posting)
- `GET    /api/logistics/cod-reconciliation` (Fetch driver COD collection records and reconciliation status)
- `POST   /api/logistics/cod-reconciliation/:id/settle` (Settle driver COD collection and post Debit 1111 / Credit 131 to M30 General Ledger)
- `GET    /api/logistics/vetc-transactions` (Fetch electronic toll collection VETC/ePass logs)
- `POST   /api/logistics/vetc-transactions/sync` (Sync toll transaction from RFID gateway)
- `POST   /api/logistics/vetc-transactions/reconcile` (Reconcile VETC toll charges against M30 General Ledger)
  - **Module:** M36 — LOGISTICS / M42 — COSTING / M30 — FINANCE
  - **Auth:** JWT Required
  - **Permission:** `logistics.freight.manage`
  - **Database:** `freight_ledger` (read/write); `cost_layers`, `accounting_entries` (READ-ONLY, written via M42/M30 delegation)
  - **Cross-Module Integrations:** M42 (Single-Writer Costing), M30 (Single-Writer GL), M32 (Treasury)
  - **Frontend Consumer:** `M36LogisticsWorkspace.tsx` (`LogisticsCostsTab.tsx`)
  - **Status:** Certified & Active (Fully Implemented & Verified)




