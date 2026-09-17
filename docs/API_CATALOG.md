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

**Entity: Costing (COGS)**
- `GET    /api/cogs/transactions`
- `GET    /api/cogs/cost-layers`
- `POST   /api/cogs/calculate-order`
  - **Module:** FINANCE
  - **Auth:** Internal/System or JWT Required
  - **Permission:** `accounting:read`
  - **Database:** `cogs_transactions`, `cost_layers`
  - **Frontend Consumer:** Background Service / `Accounting.tsx`
  - **Status:** Verified

## COMMISSION & SALES INCENTIVE (MODULE 34)

**Entity: Commission & Sales Incentive Engine**
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
- `POST   /api/commission/payouts/:id/pay` (Disburse payout batch & post GL payment Nợ 3388 / Có 1111/1121)
- `GET    /api/commission/analytics` (Leaderboard & top sales rep revenue performance)
  - **Module:** MODULE 34 (COMMISSION)
  - **Auth:** JWT Required
  - **Permission:** `commission.view`, `commission.plan.manage`, `commission.quota.manage`, `commission.calculate`, `commission.approve`, `commission.payout`
  - **Database:** `commission_plans`, `commission_rules`, `sales_quotas`, `commission_calculations`, `commission_payouts`, `commission_payout_items`, `journal_entries`
  - **Frontend Consumer:** `Commission.tsx`
  - **Status:** Verified (Phase 3 Complete)

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



