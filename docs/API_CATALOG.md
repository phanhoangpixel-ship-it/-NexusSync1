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

**Entity: Workspace Summary & Operational Work Queue (Tab 1 & Tab 2)**
- `GET    /api/workspace/summary` (Cross-module operational summary, task counts, approval counts, alert metrics)
- `GET    /api/workspace/work-items` (Dynamic query-filtered work items across M08, M20, M38, M16 with role-based RBAC `canAction` & `isReadOnly`)
- `POST   /api/workspace/work-items/:id/action` (Whitelisted quick action dispatcher with idempotencyKey & SHA-256 M02 audit trail)
- `POST   /api/workspace/work-items/bulk-action` (Sequential bulk action executor with per-item idempotencyKey & isolated error handling)
- `GET    /api/workspace/entity-preview` (Deep-link entity metadata & DMS document attachment count via `/api/dms/entity/:type/:id/attachments`)
- `GET    /api/workspace/process-chains` (Value Stream & business process chains for P2P and O2C flows)
- `GET    /api/workspace/search` (Omnibar global cross-cutting search query)
  - **Module:** M01 — WORKSPACE HUB
  - **Auth:** JWT / Role-based Context
  - **Permission:** Built-in domain module permissions (`purchase:approve`, `stock_adjustment.approve`, `servicedesk.ticket.manage`, etc.)
  - **Database:** Read-only Aggregation from Domain Models (`purchase_orders`, `stock_adjustments`, `tickets`, `sales_orders`, `audit_logs`). 0 direct core ledger mutations.
  - **Frontend Consumer:** `OperationalActivityTaskCenter.tsx`, `WorkspaceHub.tsx`, `ControlTowerTab.tsx`, `UnifiedActivityTaskDrawer.tsx`
  - **Status:** Verified (All endpoints LIVE QA PASS, 2026-09-29)


**Entity: NexusFlow Observability & Command Hub (Phase 1 — Read-Model)**
- `GET    /api/workspace/observability/health` (Điểm sức khoẻ tổng hệ thống + phân bố green/yellow/red module theo ngày + trạng thái snapshotComputed & cảnh báo)
- `GET    /api/workspace/observability/topology` (Bản đồ toàn bộ module trong registry kèm chỉ số hoạt động trong ngày + cờ registryOnly + trạng thái snapshotComputed)
- `POST   /api/workspace/observability/sync` (Kích hoạt thủ công 1 chu kỳ chiếu dữ liệu — idempotent, không phải nghiệp vụ)
  - **Module:** M01 — WORKSPACE HUB (Observability Sub-domain)
  - **Auth:** JWT Required (qua `requireAuth` toàn cục tại `/api`, KHÔNG có `requirePermission` riêng — quyết định kiến trúc có chủ đích vì bảng `permissions` chưa có mã `workspace:*`)
  - **Permission:** Không có mã riêng (xem ghi chú trên)
  - **Database:** `flow_spans`, `module_kpi_snapshots` (bảng DẪN XUẤT, chiếu lại từ `audit_logs` M02 và `outbox_events` M05 — KHÔNG PHẢI Domain Authority mới, không có module nào khác được phép ghi vào 2 bảng này ngoài `ObservabilityProjectorService`)
  - **Cross-Module Integrations:** M02 Audit Trail (nguồn chính, read-only), M05 EventBus (nguồn phụ, read-only), toàn bộ `moduleRegistry.ts` (đọc danh mục module)
  - **Frontend Consumer:** `M01ObservabilityPanel.tsx` (mount trong `WorkspaceHub.tsx`)
  - **Giới hạn đã biết (Phase 1):** `slaViolations` luôn = 0 (chưa có nguồn SLA đáng tin cậy cho mọi action ngoài M38 `sla_policies`); `systemScore` là trung bình cộng đều theo module, chưa có trọng số phòng ban chính thức; không polling tự động phía client (chỉ fetch khi mount + nút làm mới thủ công); backend có `setInterval` 15s để tự động chiếu dữ liệu.
  - **Status:** Verified (Phase 1 — 3/3 endpoint PASS với dữ liệu thật, 2026-09-26)

**Entity: NexusFlow Observability (Phase 2 — Span Explorer, RCA & Remediation)**
- `GET    /api/workspace/observability/spans` (Khảo sát luồng phân tán: danh sách flow spans phân trang, hỗ trợ filter `moduleCode`, `status`, `correlationId`)
- `GET    /api/workspace/observability/rca/:correlationId` (Phân tích nguyên nhân gốc: truy vết chuỗi spans theo correlationId, tự động xác định root cause span)
- `POST   /api/workspace/observability/remediate/:flowSpanId` (Tái kích hoạt retry sự kiện lỗi an toàn qua M05 EventBus cho span nguồn EVENT; từ chối 400 có kiểm soát đối với span nguồn AUDIT)
  - **Module:** M01 — WORKSPACE HUB (Observability Sub-domain)
  - **Auth:** JWT Required
  - **Permission:** Không có mã riêng (nhất quán với Phase 1)
  - **Database:** Đọc `flow_spans`; tương tác khắc phục an toàn qua M05 EventBus (không ghi đè trực tiếp kho, sổ cái, giá hay giá vốn)
  - **Frontend Consumer:** `M01ObservabilityPanel.tsx` (Span Explorer, RCA Panel, ConfirmDialog Remediation)
  - **Điều kiện chứng nhận Phase 2:** Remediation mới verified được nhánh từ chối (`sourceType=AUDIT` → 400) bằng dữ liệu thật. Nhánh thành công (retry một span `EVENT` bị lỗi thật) chưa từng chạy được vì `outbox_events` rỗng tại mọi thời điểm QA — không phải lỗi code, là giới hạn dữ liệu môi trường. Cần test bổ sung khi hệ thống có `outbox_events` thật phát sinh, trước khi coi tính năng "Remediation" là certified đầy đủ 100%.
  - **Status:** Verified có điều kiện (2026-09-26)

**Entity: NexusFlow Observability (Phase 3 — Trend Detection & Time-Travel Viewer)**
- `GET    /api/workspace/observability/trends` (Phân tích xu hướng rule-based thống kê: tính toán `IMPROVING`, `DEGRADING`, `STABLE`, `INSUFFICIENT_DATA`, `NO_DATA` cho 43 module dựa trên baseline lịch sử N ngày)
- `GET    /api/workspace/observability/trends/:moduleCode` (Lấy chuỗi dữ liệu lịch sử điểm khả dụng và tổng thao tác theo ngày của 1 module phục vụ biểu đồ Sparkline Recharts 30 ngày)
  - **Module:** M01 — WORKSPACE HUB (Observability Sub-domain)
  - **Auth:** JWT Required
  - **Permission:** Không có mã riêng (nhất quán với Phase 1-2)
  - **Database:** Đọc `module_kpi_snapshots` (hoàn toàn read-only, không có mutation mới)
  - **Frontend Consumer:** `M01ObservabilityPanel.tsx` (Bộ chọn Time-Travel Date, Banner cảnh báo snapshotComputed, Sparkline LineChart Card 30 ngày)
  - **Status:** Verified (Phase 3 — 100% read-only, PASS, 2026-09-26)

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

## M30 / M31 / M32 — FINANCE & ACCOUNTING

**Entity: General Ledger & VAS Double-Entry (M30 Single-Writer Authority)**
- `GET    /api/finance/accounts` *(Canonical COA & Trial Balance | Alias: `GET /api/accounting/accounts`)*
- `POST   /api/finance/gl/entries` *(Canonical GL Entry Post | Alias: `POST /api/accounting/entries`)*
- `GET    /api/finance/gl/entries` *(Canonical GL Entries Query | Alias: `GET /api/accounting/entries`)*
- `GET    /api/finance/trial-balance` *(Canonical Trial Balance TT200 | Alias: `GET /api/accounting/trial-balance`)*
- `POST   /api/finance/period-close` / `POST /api/finance/gl/vas911-closing` *(Canonical VAS 911 Period Closing | Alias: `POST /api/accounting/period-close`)*
- `GET    /api/finance/financial-statements` *(Canonical BCTC Package B01/B02/B03/B05 | Alias: `GET /api/accounting/financial-statements`)*
- `GET    /api/finance/reports/cost-center-summary` *(Canonical Cost Center & Department Breakdown)*
- `POST   /api/finance/gl/reversal` *(Canonical Storno Reversal Journaling | Alias: `POST /api/accounting/gl/reversal`)*
- `GET    /api/finance/reports/cross-reconciliation` *(Canonical Cross-Module Subledger Reconciliation)*
  - **Module:** M30 — GENERAL LEDGER & FINANCIAL REPORTING
  - **Auth:** JWT Required
  - **Permission:** `accounting:read` (GET), `accounting:write` (POST), `finance:close` (Period Closing)
  - **Database:** `accounting_entries`, `chart_of_accounts`, `period_closing_runs`, `audit_logs`
  - **Cross-Module Integrations:** M02 Audit, M13 Sales, M20 WMS, M28 Payroll, M31 Invoices, M32 Treasury
  - **Frontend Consumer:** `M30GeneralLedgerWorkspace.tsx` (`/finance`)
  - **Status:** Verified (Canonical `/api/finance/*` with Backward-Compatible `/api/accounting/*` Aliases)

**Entity: Invoices & AR/AP Management (M31)**
- `GET    /api/invoices`
- `GET    /api/invoices/:id`
- `POST   /api/invoices`
- `PUT    /api/invoices/:id/cancel`
- `POST   /api/invoices/:id/post-gl`
  - **Module:** M31 — INVOICES AR/AP
  - **Auth:** JWT Required
  - **Permission:** `invoice:read`, `invoice:write`
  - **Database:** `invoices`, `invoice_items`, `accounting_entries`
  - **Frontend Consumer:** `M31InvoicesArApWorkspace.tsx` (`/invoices`)
  - **Status:** Verified

**Entity: Payments & Treasury Management (M32)**
- `GET    /api/treasury/bank-accounts`
- `GET    /api/treasury/vouchers`
- `POST   /api/treasury/vouchers`
- `POST   /api/treasury/vouchers/:id/approve`
- `POST   /api/treasury/transfers`
  - **Module:** M32 — PAYMENTS & TREASURY
  - **Auth:** JWT Required
  - **Permission:** `payment:read`, `payment:write`
  - **Database:** `cash_vouchers`, `bank_accounts`, `treasury_transfers`, `accounting_entries`
  - **Frontend Consumer:** `M32PaymentsTreasuryWorkspace.tsx` (`/payments`)
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

## M22 — LOTS, BATCHES & 360° TRACEABILITY

**Entity: Lots, Expiry Tracking & Bidirectional Genealogy**
- `GET    /api/inventory/lots` (Fetch active lots with SKU, balance, status, mfg/exp dates; alias: `/api/lots`)
- `GET    /api/inventory/lots/:id` (Fetch single lot master record; alias: `/api/lots/:id`)
- `POST   /api/inventory/lots` (Register new lot master record; alias: `/api/lots`)
- `PATCH  /api/inventory/lots/:id/status` (Update lot status to ACTIVE, EXPIRED_SOON, QUARANTINED)
- `POST   /api/inventory/lots/fefo-simulate` (Simulate FEFO dispatch allocations)
- `GET    /api/inventory/lots/:id/trace` (Fetch bidirectional graph lineage with optional `maxDepth` and `maxNodes` params; alias: `/api/lots/:id/trace`)
- `GET    /api/inventory/lots/:id/trace-upstream` (Fetch upstream PO -> GRN -> Supplier origin tree)
- `GET    /api/inventory/lots/:id/trace-downstream` (Fetch downstream MO -> BOM -> FG -> SO consumption tree)
- `GET    /api/inventory/lots/:id/ledger` (Fetch lot-specific physical inventory movements ledger)
- `GET    /api/inventory/lots/:id/recall-dossier` (Fetch read-only simulated exposure & recall dossier)
  - **Module:** M22 — LOTS & BATCHES
  - **Auth:** JWT Required
  - **Permission:** `INVENTORY_VIEW`, `lots.view`, `lots.manage`, `inventory`
  - **Database:** `lots`, `lot_balances`, `stock_ledger`
  - **Frontend Consumer:** `M22LotsBatchesWorkspace.tsx`, `LotsBatchesTraceabilityTab.tsx`, `LotInventoryHistoryDrilldown.tsx`
  - **Status:** Verified (Full Traceability 360 Upgrade Complete)

## M23 — SERIAL NUMBER & IMEI LIFECYCLE TRACKING

**Entity: Serial Numbers, Profiles & Electronic Warranty**
- `GET    /api/serials` (Fetch unit serial numbers list with status, SKU, warehouse, warranty)
- `GET    /api/serials/:id/history` (Fetch serial event timeline and transactions history; alias: `/api/serials/:id/trace`)
- `POST   /api/serials` (Register unit serial numbers with uniqueness guard)
- `POST   /api/serials/:id/actions` (Perform unit actions: SELL, WARRANTY, TRANSFER, DEFECTIVE)
- `GET    /api/serial-profiles` (Fetch product serial profiles and prefix rules)
  - **Module:** M23 — SERIALS & IMEI
  - **Auth:** JWT Required
  - **Permission:** `SERIAL_VIEW`, `serials.view`, `serials.manage`, `inventory`
  - **Database:** `serial_profiles`, `serial_numbers`, `serial_history`, `serial_transactions`
  - **Frontend Consumer:** `M23SerialsWorkspace.tsx`
  - **Status:** Verified (Full Traceability 360 Upgrade Complete)

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

## M35 — PROJECTS & WORK BREAKDOWN STRUCTURE (WBS)

**Entity: Project & WBS Tree**
- `GET    /api/projects` (List projects with WBS nodes, progress, budgets, actual costs, and billing status)
- `POST   /api/projects` (Create project charter with PM, branch, budget, and contract value)
- `GET    /api/projects/:id` (Fetch single project with full WBS hierarchy, milestones, and costs)
- `POST   /api/projects/:id/wbs` (Add/update WBS node with budget, schedule, predecessor, and assignee)
- `PUT    /api/projects/:id/progress` (Update project/WBS progress % and automatically recalculate EVM metrics)
  - **Module:** M35 — PROJECTS & WBS
  - **Auth:** JWT Required
  - **Permission:** `projects:read`, `projects:write`
  - **Database:** `projects`, `wbs_nodes`, `project_milestones`, `project_wbs`, `project_tasks`
  - **Frontend Consumer:** `M35ProjectsWBSWorkspace.tsx`, `ProjectWbsTreeTab.tsx`, `ProjectScheduleGanttTab.tsx`
  - **Status:** Verified & Active

**Entity: Timesheet, Resource & Job Costing**
- `POST   /api/projects/resources` (Register labor, equipment, or subcontractor resources with hourly standard rates)
- `POST   /api/projects/:id/timesheets` (Log daily task hours, calculate labor cost, record into projectCostLedger & post GL M30)
- `POST   /api/projects/:id/material-issue` (Issue materials to project via InventoryService single writer & CostingEngine M42)
- `GET    /api/projects/:id/job-cost` (Aggregated 5 cost components: Labor M28, Material M17/M42, Overhead M30, Equipment M27, Subcontract M10)
- `GET    /api/projects/evm` (Portfolio ISO 21508 EVM summary: Portfolio BAC, PV, EV, AC, CPI, SPI, EAC, VAC)
  - **Module:** M35 — PROJECTS & WBS / M28 — HRM / M17 — INVENTORY / M42 — COSTING / M30 — FINANCE
  - **Auth:** JWT Required
  - **Permission:** `projects:costing`, `projects:timesheets`, `projects:resources`
  - **Database:** `project_resources`, `project_timesheets`, `project_cost_ledger`, `project_costs`, `stock_ledger`
  - **Cross-Module Integrations:** M28 (Labor Rates), M17/M42 (WMS & Costing single writer), M30 (GL TK 621, 622, 623, 627 -> 154)
  - **Frontend Consumer:** `ProjectResourcesTab.tsx`, `ProjectTimesheetsTab.tsx`, `ProjectJobCostingTab.tsx`, `ProjectEvmEngineTab.tsx`
  - **Status:** Verified & Active

**Entity: Billing & Margin**
- `POST   /api/projects/:id/billing` (Delegate customer invoice creation to M31 Invoicing & post TK 131 / 511, 3331 to M30 GL)
- `GET    /api/projects/:id/margin` (Calculate gross profit, gross margin %, unbilled amount, and VAS 15 / IFRS 15 POC revenue)
  - **Module:** M35 — PROJECTS & WBS / M31 — INVOICING / M30 — FINANCE
  - **Auth:** JWT Required
  - **Permission:** `projects:billing`
  - **Database:** `projects.billedAmount`, `invoices`, `accounting_entries`
  - **Cross-Module Integrations:** M31 (Single-Writer Invoicing), M30 (Single-Writer General Ledger)
  - **Frontend Consumer:** `ProjectJobCostingTab.tsx` (Billing Modal & POC Margin Engine)
  - **Status:** Verified & Active


**Entity: Asset Register, Criticality & Depreciation**
- `GET    /api/eam/assets` (Fetch asset directory with hierarchy, location, run hours and criticality Tier A/B/C)
- `GET    /api/eam/assets/:id` (Fetch detailed asset profile, maintenance history, and linked components)
- `POST   /api/eam/assets` (Register or update equipment asset with criticality Tier A/B/C, parent asset and model)
- `POST   /api/eam/assets/depreciation` (Execute periodic asset depreciation, delegating double-entry vouchers to M30 General Ledger)
  - **Module:** M27 — EAM / M30 — FINANCE
  - **Auth:** JWT Required
  - **Permission:** `eam.asset.manage`, `eam.asset.view`
  - **Database:** `fixed_assets`, `asset_hierarchy`, `accounting_entries`, `audit_logs`
  - **Frontend Consumer:** `AssetMaintenanceWorkspace.tsx` (`AssetRegistryTab.tsx`)
  - **Status:** Verified & Active

**Entity: PM Schedule, Multi-Triggers & Work Order Lifecycle**
- `GET    /api/eam/maintenance-schedules` (Fetch preventive maintenance schedules with trigger types)
- `POST   /api/eam/maintenance-schedules` (Create recurring PM plan with CALENDAR, METER_RUN_HOURS, or CONDITION_IOT triggers)
- `GET    /api/eam/work-orders` (Fetch work orders list with filter by status, priority, and sourceModule)
- `GET    /api/eam/work-orders/:id` (Fetch work order detail with parts list and cost breakdown)
- `POST   /api/eam/work-orders` (Create work order with origin tracking: Manual, M38 Service Desk ticket, or M15 RMA routing)
- `PUT    /api/eam/work-orders/:id/status` (State machine transition: OPEN -> IN_PROGRESS -> WAITING_PART -> COMPLETED, terminal state guard)
- `POST   /api/eam/work-orders/:id/issue-parts` (Issue spare parts, strictly delegating to M17 InventoryService single writer)
- `POST   /api/eam/spare-parts/purchase-order` (Delegate spare part shortage procurement to M08 Purchase Order Single Writer)
- `POST   /api/eam/work-orders/:id/complete` (Finalize work order sign-off, post M30 GL cost allocation Dr 627 / Cr 156, log M02 audit, and archive into M29 DMS vault)
- `GET    /api/eam/analytics/reliability` (RAMS & OEE reliability analytics: MTBF, MTTR, Availability %, and Tier A/B/C breakdown)
  - **Module:** M27 — EAM / M17 — INVENTORY / M08 — PURCHASING / M30 — FINANCE / M29 — DMS
  - **Auth:** JWT Required
  - **Permission:** `eam.workorder.manage`, `eam.workorder.execute`, `eam.parts.issue`
  - **Database:** `maintenance_work_orders`, `maintenance_schedules`, `work_order_spare_parts`, `stock_ledger`, `stock_balances`, `purchase_orders`, `dms_documents`, `audit_logs`
  - **Cross-Module Integrations:** M17 (Single-Writer Inventory), M08 (Single-Writer Purchasing), M30 (Single-Writer GL), M38 (Service Desk Incidents), M15 (RMA Repair Routing), M02 (Audit Log), M29 (DMS Vault)
  - **Frontend Consumer:** `AssetMaintenanceWorkspace.tsx` (`WorkOrdersTab.tsx`, `PreventivePlansTab.tsx`, `IssueSparePartModal.tsx`, `CompleteWorkOrderModal.tsx`)
  - **Status:** Verified & Active (13/13 Features Certified Passing)

## M28 — HR & AUTOMATED PAYROLL MANAGEMENT

**Entity: Employee Master, Department & Shift Management**
- `GET    /api/hr/employees` (Fetch employees directory with joined department, position, contracts, and salary info)
- `GET    /api/hr/employees/:id` (Fetch single employee 360 profile with contract history, attendance stats, and dependents)
- `POST   /api/hr/employees` (Register new employee with automatic code generation EMP-xxxx, tax code, insurance salary, and dependents)
- `GET    /api/hr/departments` (Fetch department hierarchy and manager assignments)
- `GET    /api/hr/positions` (Fetch position directory with salary grades)
- `GET    /api/hr/shifts` (Fetch work shifts: Fixed, Flexible, Rotating, Night with start/end time and night allowances)
- `POST   /api/hr/shifts` (Create or update work shift schedule)
  - **Module:** M28 — HR & PAYROLL MANAGEMENT
  - **Auth:** JWT Required
  - **Permission:** `hr:read`, `hr:write`, `hr:manage`
  - **Database:** `employees`, `departments`, `positions`, `work_shifts`, `branches`, `audit_logs`
  - **Cross-Module Integrations:** M35 (Project Resources), M27 (Maintenance Technicians), M06 (R&D Specialists), M14 (Sales Reps)
  - **Frontend Consumer:** `HRWorkspace.tsx` (`EmployeeRegistryTab.tsx`, `TimeAttendanceTab.tsx`, `CreateEmployeeModal.tsx`)
  - **Status:** Certified & Active

**Entity: Time Attendance, Overtime & Leave Lifecycle**
- `GET    /api/hr/attendance` (Fetch attendance records with status: PRESENT, LATE, EARLY_LEAVE, ABSENT, ON_LEAVE)
- `POST   /api/hr/attendance` & `POST /api/hr/timesheets` (Ingest daily attendance timestamps and compute worked hours)
- `POST   /api/hr/ess/checkin` (Self-service employee mobile/GPS check-in)
- `GET    /api/hr/leaves` (Fetch leave request ledger with approval status)
- `POST   /api/hr/leave-requests` & `POST /api/hr/leaves` (Submit leave request with annual, sick, maternity, or unpaid type)
- `POST   /api/hr/leaves/:id/approve` (Approve leave request, deduct entitlement balance, and update timesheet status)
- `POST   /api/hr/leaves/:id/reject` (Reject leave request with mandatory rejection reason)
  - **Module:** M28 — HR & PAYROLL MANAGEMENT
  - **Auth:** JWT Required
  - **Permission:** `hr:attendance`, `hr:leave.manage`, `hr:leave.request`
  - **Database:** `attendance_records`, `overtime_records`, `leave_requests`, `employees`, `audit_logs`
  - **Frontend Consumer:** `HRWorkspace.tsx` (`TimeAttendanceTab.tsx`, `LeaveManagementTab.tsx`, `CreateLeaveRequestModal.tsx`)
  - **Status:** Certified & Active

**Entity: Labor Contracts, Statutory Payroll & GL/Treasury Delegation**
- `GET    /api/hr/contracts` (Fetch employee labor contracts with terms, allowances, and validity dates)
- `POST   /api/hr/contracts` (Create and activate labor contract with probation/fixed-term/indefinite types)
- `GET    /api/hr/payrolls` (List periodic payroll runs with Gross, Insurance, PIT, and Net amounts)
- `GET    /api/hr/payrolls/preview` (Simulate statutory payroll calculation with 10.5% insurance and 7-tier PIT)
- `POST   /api/hr/payroll/run` & `POST /api/hr/payrolls/calculate` (Execute full statutory payroll calculation for period)
- `GET    /api/hr/payrolls/:id/details` (Fetch full breakdown of payroll run with individual payslips)
- `GET    /api/hr/payroll/:id/payslip` (Fetch single employee payslip with RBAC ownership guard)
- `GET    /api/hr/ess/my-payslips` (Employee self-service confidential payslip lookup)
- `POST   /api/hr/payroll/approve` (Approve payroll run and delegate balanced double-entry vouchers to M30 General Ledger: Dr 6421/6221 / Cr 3341, 3383, 3384, 3386, 3335)
- `POST   /api/hr/payroll/:id/disburse` (Disburse net salary via M32 Treasury delegation: Dr 3341 / Cr 1121, set PAID status, and enforce period immutability)
- `POST   /api/hr/seal-dossier` (Seal immutable payroll period snapshot into M29 DMS Vault with SHA-256 digital signature)
- `GET    /api/hr/audit-logs` (Fetch tamper-evident HR audit trail from M02)
  - **Module:** M28 — HR & PAYROLL MANAGEMENT / M30 — FINANCE / M32 — TREASURY / M29 — DMS
  - **Auth:** JWT Required
  - **Permission:** `hr:payroll.manage`, `hr:payroll.approve`, `hr:payroll.disburse`, `hr:payroll.view_self`
  - **Database:** `payrolls`, `payslips`, `employee_contracts`, `employee_allowances`, `employee_deductions`, `accounting_entries`, `dms_documents`, `audit_logs`
  - **Cross-Module Integrations:** M30 (General Ledger Accounting Single-Writer), M32 (Treasury & Bank Payment Single-Writer), M14 (Commission Ingestion), M02 (Audit Trail), M29 (DMS Cryptographic Vault)
  - **Frontend Consumer:** `HRWorkspace.tsx` (`PayrollGlLedgerTab.tsx`, `EmployeeSelfServiceTab.tsx`, `PayrollCalculationGLModal.tsx`, `HrDmsAuditTab.tsx`, `HrDossierSealModal.tsx`)
  - **Status:** Certified & Active

---

## M31 — INVOICES AR/AP & VAT MANAGEMENT

**Entity: Invoices AR/AP Lifecycle & Decree 123/2020 E-Invoicing**
- `GET    /api/invoices` (List all invoices with filters: AR/AP, status, paymentStatus, partnerId, date range)
- `GET    /api/invoices/ar` (List customer sales invoices with VAT details, payment progress, and aging)
- `POST   /api/invoices/ap` (Register vendor purchase invoice with PO link and VAT deductible rate)
- `GET    /api/invoices/aging` & `GET /api/invoices/aging-report` (AR/AP debt aging breakdown: Current, 1-30, 31-60, 61-90, 90+ days)
- `GET    /api/invoices/tax-declaration` (Central VAT tax report conforming to Circular 80/2021 Form 01/GTGT)
- `GET    /api/invoices/:id` (Fetch detailed invoice with line items, partial payments, and journal entries)
- `POST   /api/invoices` (Create invoice with line items via single-writer `InvoiceService.createInvoice()`)
- `POST   /api/invoices/:id/issue` (Digital HSM signing and Tax Authority CQT code verification under Decree 123/2020)
- `POST   /api/invoices/:id/cancel` (Cancel invoice with immutable reversal audit trail and GL reversing entries)
- `POST   /api/invoices/:id/pay` & `POST /api/invoices/:id/payments` (Record partial/full payment with M30 GL delegation)
- `POST   /api/invoices/:id/offset-credit-note` (Offset customer debt against credit note / return voucher)
- `POST   /api/invoices/:id/3way-match` (Automated 3-way reconciliation between AP Invoice, PO, and GRN)
- `POST   /api/invoices/:id/dunning` (Generate overdue payment reminder letter and dynamic VietQR string)
- `POST   /api/invoices/:id/archive-dms` (Seal signed XML e-invoice and PDF representation into M29 DMS Vault with SHA-256 checksum)
- `POST   /api/invoices/batch-archive-dms` (Batch archival of issued e-invoices with SHA-256 hash sealing to M29 DMS Vault)
- `GET    /api/invoices/:id/dms-vault` (Query DMS vault retention status, SHA-256 checksum, and audit trail for an invoice)
- `GET    /api/invoices/:id/xml` (Download signed XML e-invoice matching Decree 123/2020 schema)
- `GET    /api/invoices/tax-declaration/xml` (Generate official HTKK/eTax XML for VAT Declaration Form 01/GTGT per TT 80/2021/TT-BTC)
- `POST   /api/invoices/tax-declaration/submit-etax` (Submit tax declaration directly to General Department of Taxation eTax portal)
- `POST   /api/invoices/:id/post-gl` (Explicit GL posting delegation to M30 Single Writer)
- `GET    /api/invoices/vat-summary` (Summary of input/output VAT and payable balance)
  - **Module:** M31 — INVOICES AR/AP & VAT / M30 — FINANCE / M32 — TREASURY / M08 — PURCHASE
  - **Auth:** JWT Required
  - **Permission:** `invoices:read`, `invoices:write`, `invoices:issue`, `invoices:pay`, `invoices:admin`
  - **Database:** `invoices`, `invoice_items`, `payments`, `credit_notes`, `debit_notes`, `accounting_entries`, `audit_logs`
  - **Cross-Module Integrations:** M13 (Sales Order Billing Delegation), M08 (PO & 3-Way Match), M17 (WMS Goods Receipts), M30 (GL Single Writer), M32 (Treasury Payments), M29 (DMS Invoicing Archival)
  - **Frontend Consumer:** `M31InvoicesArApWorkspace.tsx` (`WS19_INVOICES`)
  - **Status:** Certified & Active

---

## M32 — PAYMENTS & CASH (TREASURY MANAGEMENT)

**Entity: Cash & Bank Vouchers (BTC Forms 01-TT & 02-TT) and Treasury Gateway**
- `GET    /api/payments` & `GET /api/treasury/vouchers` (List cash & bank vouchers with comprehensive filters: voucherType, voucherForm, status, partnerType, sourceModule, bankAccountId, date range)
- `GET    /api/treasury/vouchers/:id` (Fetch detailed cash voucher with amount in words and signatories)
- `GET    /api/treasury/vouchers/:id/printable-form` (Generate full regulatory dataset for printing Official BTC Forms 01-TT and 02-TT)
- `GET    /api/treasury/vouchers/:id/vietqr` (Generate dynamic NAPAS 247 VietQR image URL and payload for receipt vouchers)
- `POST   /api/treasury/vouchers` (Create cash receipt/payment voucher with idempotency protection and overdraft guard)
- `POST   /api/treasury/vouchers/:id/approve` (Maker-Checker approval, overdraft guard, single-writer GL post to M30, and M02 audit)
- `POST   /api/treasury/vouchers/:id/cancel` (Cancel voucher, rollback bank balances, reverse GL references, and record M02 audit log)
- `POST   /api/treasury/authorize-disbursement` & `POST /api/treasury/gateway/disburse` (M32-F06 Central Payout Gateway for M14 Commission, M15 RMA, M28 Payroll, M08 AP)
- `POST   /api/treasury/authorize-collection` & `POST /api/treasury/gateway/collect` (M32-F06 Central Collection Gateway for M13 Sales, M16 POS Shift clearance, M31 Invoices)
- `GET    /api/treasury/stats` (Real-time treasury dashboard metrics: total receipts, total payments, cash, bank, pending approvals)
- `GET    /api/treasury/bank-accounts` (List bank and cash accounts with book balances and GL accounts)
- `GET    /api/treasury/transfers` (List internal bank-to-bank and cash-to-bank fund transfers)
- `POST   /api/treasury/transfers` (Execute internal fund transfer with overdraft guard and M30 GL post)
- `GET    /api/treasury/bank-statements` (Query bank statements for automated reconciliation)
- `POST   /api/treasury/reconcile` (Reconcile bank transaction with cash voucher)
- `GET    /api/treasury/cashflow-forecast` (7/30/90 days rolling cash flow forecast)
- `POST   /api/treasury/vietqr-payload` (Generate dynamic NAPAS 247 VietQR payload with memo and amount)
  - **Module:** M32 — PAYMENTS & CASH / TREASURY MANAGEMENT
  - **Auth:** JWT Required
  - **Permission:** `treasury:view`, `treasury:create`, `treasury:approve`, `treasury:transfer`, `treasury:admin`
  - **Database:** `cash_vouchers`, `bank_accounts`, `treasury_transfers`, `bank_transactions`, `accounting_entries`, `audit_logs`
  - **Cross-Module Integrations:** M30 (GL Accounting Single-Writer), M02 (Cryptographic Audit Trail), M13 (Sales Collection), M14 (Commission Disbursement), M15 (RMA Refunds), M16 (POS Clearance), M28 (Payroll Disbursement), M08 (Supplier Payment), M31 (AR/AP Invoices)
  - **Frontend Consumer:** `M32PaymentsTreasuryWorkspace.tsx` (`WS07_PAYMENTS` / `WS20_PAYMENTS`)
  - **Status:** Certified & Active (Phases 01–12 100% E2E Live QA Certified)

---

## M33 — BANK RECONCILIATION & VIETQR ELECTRONIC FEEDS

**Entity: Bank Accounts, Statements & Idempotent Feeds**
- `GET    /api/bank/accounts` (List registered enterprise bank accounts with book balance, bank balance, and linked GL accounts)
- `POST   /api/bank/accounts` (Register or update corporate bank account profile with branch, currency, and GL 1121 linkage)
- `GET    /api/bank/statements` (Query bank statement transactions with filters: bankAccountId, status, date range, search)
- `POST   /api/bank/statements/import` (Idempotent bank statement batch ingestion via SHA-256 checksum & transaction deduplication)

**Entity: Automated Reconciliation, Discrepancy Ledger (Form 08-TT) & Overrides**
- `POST   /api/bank/statements/auto-reconcile` (Execute 4-tier automated matching against M31 Invoices and M32 Vouchers: Exact Ref -> VietQR Memo -> Amount + Date Window -> Counterparty)
- `GET    /api/bank/unmatched` (Fetch unmatched statement items, in-transit deposits, and unrecorded bank charges)
- `GET    /api/bank/reconciliation-report` (Generate official Bank Reconciliation Statement Form 08-TT per Circular 200/2014/TT-BTC)
- `GET    /api/bank/reconciled-history` (Query historical matched transactions with audit trail and matcher identity)
- `POST   /api/bank/statements/manual-match` (Execute manual 1-to-1 or 1-to-N transaction matching with M02 audit logging)
- `POST   /api/bank/statements/unmatch` (Rollback reconciled pair to UNMATCHED with M02 audit logging)

**Entity: Dynamic VietQR & Automated Webhook Gateway**
- `POST   /api/bank/vietqr/generate` (Generate dynamic EMVCo-compliant NAPAS 247 VietQR payload with CRC16 and transaction memo)
- `POST   /api/bank/webhook/vietqr` (Webhook listener for real-time bank incoming transfers; automatically generates M32 01-TT Receipt Voucher & clears M31 Invoice via M32 Central Gateway)
  - **Module:** M33 — BANK RECONCILIATION & VIETQR / M32 — TREASURY / M30 — FINANCE / M31 — INVOICES
  - **Auth:** JWT Required (Webhook supports API Secret / HMAC-SHA256 signature verification)
  - **Permission:** `bank:reconcile`, `bank:import`, `bank:vietqr`, `finance:admin`
  - **Database:** `bank_accounts`, `bank_transactions`, `cash_vouchers`, `invoices`, `accounting_entries` (Read-only via M30), `audit_logs`
  - **Cross-Module Integrations:** M32 (Central Treasury Gateway for auto-receipts), M30 (GL Accounting Single-Writer for balanced journal entries), M31 (AR Invoice debt clearance), M13 (Sales Order payment status propagation), M02 (Cryptographic Audit Trail)
  - **Frontend Consumer:** `M33BankReconciliationWorkspace.tsx` (`WS21_BANK`)
  - **Status:** Certified & Active (Phases 01–12 100% E2E Live QA Certified)

---

## M30 — FINANCE & GENERAL LEDGER (GL SINGLE-WRITER & VAS ENGINE)

**Entity: Vietnamese Chart of Accounts (COA TT200) & Single-Writer GL Journaling**
- `GET    /api/finance/accounts` & `GET /api/finance/chart-of-accounts` (Fetch hierarchical VAS TT200 Chart of Accounts with category balances)
- `POST   /api/finance/gl/entries` & `POST /api/finance/gl/post` (Single-Writer double-entry journal voucher posting with Dr = Cr validation)
- `POST   /api/finance/gl/reversal` (Standardized Storno reversal engine creating opposing journal entries and maintaining immutability)
- `POST   /api/finance/verify-balance` (Verify General Ledger mathematical invariant equality: Total Debit = Total Credit)

**Entity: VAS Financial Statements Package (B01-DN, B02-DN, B03-DN, B05-DN) & Period Close**
- `GET    /api/finance/financial-statements` & `POST /api/finance/financial-statements` (Generate official VAS BCTC package: B01-DN Balance Sheet, B02-DN Income Statement, B03-DN Cash Flow, B05-DN Notes)
- `POST   /api/finance/period-close` (Execute VAS 911 revenue/expense zeroing run and lock fiscal period against retroactive edits)

**Entity: Multi-Dimensional Cost Center & Real-Time All-Module Cross-Reconciliation**
- `GET    /api/finance/reports/cost-center-summary` (Aggregate expenses by Cost Center CC-PROD, CC-SALES, CC-ADMIN, CC-LOGISTICS, CC-RD)
- `GET    /api/finance/reports/cross-reconciliation` (Real-time sub-ledger reconciliation: GL 131 vs M31 AR, GL 331 vs M31 AP, GL 156 vs M17 WMS, GL 1111/1121 vs M32 Cash/Bank)
  - **Module:** M30 — FINANCE & GENERAL LEDGER
  - **Auth:** JWT Required
  - **Permission:** `finance:read`, `finance:write`, `finance:post`, `finance:close_period`, `finance:admin`
  - **Database:** `chart_of_accounts`, `accounting_entries`, `period_closing_runs`, `audit_logs`
  - **Cross-Module Integrations:** M31 (Invoices), M32 (Treasury), M17 (Inventory WMS), M28 (Payroll), M27 (EAM), M35 (Projects), M02 (Audit Trail)
  - **Frontend Consumer:** `M30GeneralLedgerWorkspace.tsx` (`WS18_FINANCE`)
  - **Status:** Certified & Active (Phases 01–12 100% Certified)

## M34 — FINANCIAL CONSOLIDATION & MULTI-ENTITY REPORTING

**Entity: Consolidation Scope & Entity Hierarchy**
- `GET    /api/finance/consolidation/scope` (Fetch multi-entity hierarchy, ownership percentages, and consolidation method)
- `GET    /api/finance/consolidation/entities` (List legal entities and operating branches under group scope)
  - **Module:** M34 — FINANCIAL CONSOLIDATION & MULTI-ENTITY REPORTING
  - **Auth:** JWT Required
  - **Permission:** `finance:read`, `consolidation:manage`
  - **Database:** `intercompany_scope`, `intercompany_party_map`
  - **Frontend Consumer:** `M34FinancialConsolidationWorkspace.tsx` (`WS09_CONSOLIDATION`)
  - **Status:** Verified

**Entity: Consolidation Engine & Financial Statements**
- `POST   /api/finance/consolidation/runs` (Execute multi-entity trial balance consolidation run with idempotency key guard)
- `GET    /api/finance/consolidation/runs/:id` (Fetch details and line items of a specific consolidation run)
- `POST   /api/finance/consolidation/runs/:id/approve` (Approve consolidation run with atomic optimistic locking guard)
- `POST   /api/finance/consolidation/runs/:id/lock` (Lock consolidation run and enforce period immutability)
- `POST   /api/finance/consolidation/runs/:id/seal-dms` (Seal consolidated financial statements into M29 DMS vault with SHA-256 signature)
- `GET    /api/finance/consolidation/runs/:id/drill-down` (Multi-level drill-down from consolidated line item to branch trial balance and M30 GL entries)
- `GET    /api/finance/consolidation/reports` (Retrieve consolidated Balance Sheet, P&L, and Cash Flow statements)
- `GET    /api/finance/consolidation/eliminations` (Fetch automatically generated intercompany trade and debt elimination vouchers)
- `GET    /api/finance/consolidation/reconciliations` (Intercompany AR/AP 131 vs 331 reconciliation and mismatch alert reporting)
- `POST   /api/finance/consolidation/fx-rates` (Compute multi-currency translation adjustments using M03 rate engine)
  - **Module:** M34 — FINANCIAL CONSOLIDATION & MULTI-ENTITY REPORTING / M30 — FINANCE / M02 — AUDIT / M29 — DMS / M05 — EVENT BUS
  - **Auth:** JWT Required
  - **Permission:** `finance:read`, `consolidation:manage`, `cfo:approve`
  - **Database:** `consolidation_runs`, `consolidation_run_lines`, `elimination_entries`, `fx_adjustments`, `dms_documents`, `audit_logs`, `outbox_events`
  - **Cross-Module Integrations:** M30 (GL Accounting Single-Writer Read-Only), M03 (Multi-Currency Rates), M02 (Cryptographic Audit Log), M29 (DMS Cryptographic Vault), M05 (Outbox Event Emission `finance.consolidation.run.completed.v1`), M37 (BI Analytics Consumption)
  - **Frontend Consumer:** `M34FinancialConsolidationWorkspace.tsx` (`WS09_CONSOLIDATION` / `/consolidation`)
  - **Status:** Verified


## M29 — DIGITAL DOCUMENT MANAGEMENT (DMS) & SECURE VAULT

**Entity: Document Vault, Sealing, Retention, Provenance & Integrity**
- `GET    /api/dms/documents` (Query documents with category, status, classification filter, and RBAC metadata redaction)
- `GET    /api/dms/documents/:id` (Fetch document details, provenance metadata, audit view log)
- `GET    /api/dms/documents/:id/download` (Stream binary content with SHA-256 integrity check and M02 download audit log)
- `GET    /api/dms/entity/:entityType/:entityId/attachments` (Query attached documents for a specific business voucher across modules)
- `POST   /api/dms/vault` (Vault document with server-side SHA-256 calculation, MIME whitelist, 25MB limit, and idempotency deduplication)
- `POST   /api/dms/documents/:id/sign` (Digitally seal document with internal e-signature, set status SEALED, and emit `dms.document.sealed.v1`)
- `POST   /api/dms/documents/:id/verify` (Recalculate SHA-256 from binary and compare against stored seal hash)
- `POST   /api/dms/documents/batch-verify` (Batch verify cryptographic integrity across all vaulted documents)
- `PUT    /api/dms/retention` (Configure standard retention lifecycle presets)
- `PUT    /api/dms/documents/:id/retention` (Update individual document retention schedule and toggle Legal Hold immutability shield)
- `POST   /api/dms/documents/:id/request-disposal` (Submit disposal request to M28 governance council)
- `POST   /api/dms/documents/:id/dispose` (Finalize document disposal with tombstone hash and permanent M02 audit log)
- `POST   /api/dms/archive` (Cold-storage deep glacier packaging and archival for M31/M34/M06 dossiers)
- `GET    /api/dms/reports/missing-attachments` (Scan unattached accounting and procurement records across M31, M08, M32)
- `GET    /api/dms/retention-policies` (Query standard compliance retention policy presets)
- `GET    /api/dms/signatures` (Audit electronic signatures and PKI certificate serials)
  - **Module:** M29 — DIGITAL DOCUMENT MANAGEMENT (DMS)
  - **Auth:** JWT Required / Context Bearer
  - **Permission:** `dms:read`, `dms:write`, `dms:sign`, `dms:admin`, `dms.confidential.view`
  - **Database:** `dms_documents`, `retention_policies`, `e_signatures`, `dms_archives`, `audit_logs`, `outbox_events`
  - **Single-Writer Handover:** `DmsService` is sole writer for `dms_documents`. Zero mutation to foreign domain ledgers (`accounting_entries`, `stock_ledger`, `cost_layers`).
  - **Cross-Module Consumers & Integrations:**
    - M06 (R&D Projects & Formulas): Lab trial reports & technical dossiers
    - M08 (Purchasing): PO contracts, vendor quotes, and receipt bills
    - M10 (Strategic Sourcing): RFQ packages and supplier bids
    - M13 (Sales Orders): VAT electronic invoice PDFs and order agreements
    - M15 (Returns & RMA): RMA return claims, inspection photos, credit notes
    - M17 (Inventory Core): Goods receipt inspection slips, delivery notes
    - M25 (Manufacturing): Batch travelers, production inspection certs
    - M26 (Supply Chain): MRP netting run snapshots and demand plans
    - M27 (EAM Maintenance): Work order sign-offs, equipment calibration certs
    - M28 (HR & Payroll): Signed employee contracts, monthly payroll registers
    - M31 (Invoices AR/AP): XML e-Invoices, VAT declarations, bank receipts
    - M32 (Treasury & Payments): Payment vouchers (01-TT, 02-TT) & bank statements
    - M34 (Consolidation): Group financial statements & intercompany elimination sheets
    - M35 (Projects WBS): Project charters, blueprints, handover minutes
    - M36 (Logistics & TMS): Electronic Waybills and Proof of Delivery (e-POD)
    - M39 (Quality QMS): Certificates of Analysis (COA) and Inspection Reports
    - M02 (Audit & Compliance): Tamper-evident SHA-256 access logs & disposal tombstones
    - M05 (EventBus): Outbox event publisher (`dms.document.sealed.v1`)
  - **Frontend Consumer:** `src/modules/governance/m29-dms/components/DMSWorkspace.tsx` (`WS28_DMS` / `/dms`)
  - **Status:** Verified (Live QA Certified: 2026-09-24)

---

## M38 — IT SERVICE DESK & INCIDENT SLA MANAGEMENT (ITIL v4)

**Entity: Service Tickets, SLA Lifecycle & Incident Resolution**
- `GET    /api/service-desk/tickets` (List service desk tickets with status, priority, type, and search filters)
- `POST   /api/service-desk/tickets` (Create new ticket with M03 sequence code `IT-TKT-YYYY-NNNN`, SLA due dates, idempotency key)
- `GET    /api/service-desk/tickets/:id` (Fetch full ticket detail including message history, append-only status log, and survey)
- `POST   /api/service-desk/tickets/:id/assign` (Assign/reassign technician to ticket)
- `POST   /api/service-desk/tickets/:id/accept` (Technician accepts ticket; sets status `IN_PROGRESS` and records first response time)
- `POST   /api/service-desk/tickets/:id/pause` (Pause SLA clock on `PENDING` / `WAITING_USER` state)
- `POST   /api/service-desk/tickets/:id/resume` (Resume SLA clock and record accumulated pause duration)
- `POST   /api/service-desk/tickets/:id/resolve` (Resolve ticket; requires mandatory `rootCause` and `resolutionNote`)
- `POST   /api/service-desk/tickets/:id/close` (Requester sign-off and close ticket; sets status `CLOSED` locked Read-Only)
- `POST   /api/service-desk/tickets/:id/comment` (Add internal communication message)
- `POST   /api/service-desk/tickets/:id/create-work-order` (Create corrective maintenance work order in M27 EAM with `sourceModule: 'M38'`)

**Entity: SLA Engine, Policies & Escalation Simulator**
- `GET    /api/service-desk/sla` (Evaluate active ticket SLA status; supports `?asOf=` virtual simulation for safe testing)
- `GET    /api/service-desk/sla-policies` (List configured SLA policies P1–P4)
- `PUT    /api/service-desk/sla-policies/:id` (Update SLA thresholds and business hours flag)

**Entity: Access Requests & Segregation of Duties (SoD)**
- `GET    /api/service-desk/access-requests` (List access request records with multi-stage approval status)
- `POST   /api/service-desk/access-requests` (Create access request with target user, requested permission, and duration)
- `POST   /api/service-desk/access-requests/:id/approve-manager` (Direct line manager approval; enforces Requester != Approver)
- `POST   /api/service-desk/access-requests/:id/approve-security` (Security admin approval for high-risk permissions)
- `POST   /api/service-desk/access-requests/:id/fulfill` (Execute fulfillment via M04 official path; enforces Requester != Fulfiller)

**Entity: KPI Performance Metrics & Legacy Alias**
- `GET    /api/service-desk/kpi` (Aggregate MTTR, on-time SLA compliance %, CSAT score, and category backlogs)
- `GET    /api/issues/*` (Backward-compatibility alias forwarding directly to `serviceDeskRouter`)
  - **Module:** M38 — IT SERVICE DESK & INCIDENT SLA MANAGEMENT
  - **Auth:** JWT Required / Context Bearer
  - **Permission:** `servicedesk:read`, `servicedesk:write`, `servicedesk.ticket.manage`, `servicedesk.sla.manage`, `servicedesk.access.approve`, `servicedesk.access.fulfill`
  - **Database:** `tickets`, `ticket_messages`, `sla_policies`, `ticket_status_history`, `ticket_access_requests`, `ticket_surveys`, `ticket_relations`, `audit_logs`, `outbox_events`
  - **Single-Writer Authority:** `ServiceDeskService` is the sole writer for `tickets` and M38 ITSM domain tables. Zero direct SQL mutations to M04 user/role permission tables, M27 work orders, or M30 general ledger.
  - **Cross-Module Integrations:**
    - M01 (Workspace Hub): WorkQueue consumption and unresolved ticket counting.
    - M02 (Audit Trail): SHA-256 tamper-evident logging for all ticket mutations and approvals.
    - M03 (Settings): Document sequence number generation (`IT-TKT-YYYY-NNNN`).
    - M04 (RBAC): Official delegation / permission assignment execution upon access request fulfillment.
    - M05 (EventBus): Outbox event emission (`servicedesk.ticket.created.v1`, `servicedesk.ticket.sla_breached.v1`, `servicedesk.ticket.resolved.v1`, `servicedesk.ticket.closed.v1`).
    - M27 (EAM Maintenance): Corrective work order creation and automated callback synchronization upon WO completion.
    - M28 (HRM): Employee direct manager resolution and active leave lookup for auto-assignment.
    - M29 (DMS): Issue attachment linking with SHA-256 verification.
    - M37 (BI Analytics): SLA compliance and MTTR KPI metric aggregation.
  - **Frontend Consumer:** `src/modules/governance/m38-service-desk/components/ServiceDeskWorkspace.tsx` (`WS26_SERVICEDESK` / `/issue` / `/service-desk`)
  - **Status:** Verified (Live QA Certified: 2026-09-24)

---

### M37 — BUSINESS INTELLIGENCE & EXECUTIVE ANALYTICS

**Entity: Executive Analytics, VAS P&L, Cash Flow & Financial Ratios**
- `GET    /api/analytics/pnl` (Detailed VAS Income Statement from M30 GL Single-Writer)
- `GET    /api/analytics/cashflow` (Direct Cash Flow Statement from M32 Treasury & M33 Bank)
- `GET    /api/analytics/turnover-ratios` (Inventory Turnover, DSO, DPO, CCC, Current/Quick Ratio from M17/M42)
- `GET    /api/analytics/forecast` (90-Day Cashflow and Revenue Trend Forecast)
- `GET    /api/analytics/kpis` (Executive C-Level KPI Metrics Summary)
- `GET    /api/analytics/pnl-monthly` or `/api/reports/summary` (Legacy/Alias 12-month P&L chart dataset)
- `GET    /api/analytics/category-drilldown` (Product category drilldown)
- `GET    /api/analytics/channel-distribution` (Sales channel revenue share)
- `GET    /api/analytics/branch-performance` (Branch performance and margin comparison)
- `POST   /api/analytics/export` (Idempotent C-Level Excel/PDF report export with M29 DMS vault link)
  - **Module:** M37 — BUSINESS INTELLIGENCE & EXECUTIVE ANALYTICS
  - **Auth:** JWT Required / Context Bearer
  - **Permission:** `analytics.executive.view`, `analytics.export`, `accounting:read`, `sales:read`
  - **Database:** `report_definitions`, `export_jobs`, `dashboard_configs`, `kpi_threshold_configs` (Read-only on M30/M17/M42/M32/M33/M34)
  - **Single-Writer Authority:** Read-Only Analytics Service. Tái sử dụng Trial Balance & Financial Statements của M30 General Ledger (GET `/api/finance/financial-statements`), tuyệt đối không tự tính lại Nợ/Có.
  - **Cross-Module Integrations:**
    - M30 (GL Accounting): Single-Writer SSOT for Income Statement & Trial Balance.
    - M32/M33 (Treasury & Bank): Cash balance & bank reconciliation validation.
    - M17/M42 (Inventory & Costing): COGS and inventory average value for turnover calculation.
    - M34 (Consolidation): Group consolidated financial reports when locked run exists.
    - M02 (Audit Trail): SHA-256 tamper-evident audit logging via `AuditService.recordAuditLog()`.
    - M29 (DMS Vault): Exported document linking & vault storage.
    - M05 (EventBus): Outbox event emission (`analytics.report.exported.v1`).
  - **Frontend Consumer:** `src/modules/governance/m37-analytics/components/M37BiAnalyticsWorkspace.tsx` (`M37 - BI & Executive Analytics` / `/analytics` / `/reports`)
  - **Status:** Verified (Live QA Certified: 2026-09-25)

---

### M40 — ENVIRONMENTAL HEALTH & SAFETY (EHS)

**Entity: Workplace Incident Reporting & Investigation Lifecycle**
- `GET    /api/ehs/incidents` (Query safety incidents with severity/status/warehouse filters)
- `POST   /api/ehs/incidents` (Log new workplace incident with sequential numbering `INC-YYYY-NNNN`, location & victim info)
- `GET    /api/ehs/incidents/:id` (Fetch detailed incident dossier and investigative actions)
- `POST   /api/ehs/incidents/:id/investigate` (Update root-cause investigation findings & corrective measures)
- `POST   /api/ehs/incidents/:id/close` (Close incident file with SHA-256 M02 audit lock — transition to immutable READ-ONLY)
  - **Module:** M40 — ENVIRONMENTAL HEALTH & SAFETY (EHS)
  - **Auth:** JWT Required / Context Bearer
  - **Permission:** `ehs:read`, `ehs:write`, `ehs:incident:manage`
  - **Database:** `ehs_incidents`
  - **Single-Writer Authority:** `EhsService` (Sole writer for safety incidents & occupational safety records)
  - **Cross-Module Integrations:**
    - M18 (Warehouse/Site): Validates `warehouseId` site location.
    - M28 (HRM): Validates victim employee `affectedEmployeeName` & safety officer details.
    - M02 (Audit Trail): SHA-256 tamper-evident log for closed incidents.
    - M05 (EventBus): Outbox event emission (`ehs.incident.logged.v1`, `ehs.incident.closed.v1`).

**Entity: Job Safety Analysis (JSA 5×5 Risk Matrix)**
- `GET    /api/ehs/risk-assessments` (List JSA risk assessments and high-risk job registers)
- `POST   /api/ehs/risk-assessments` (Create JSA risk assessment, auto-computes Risk Score = Severity × Probability and level LOW/MEDIUM/HIGH/EXTREME)
  - **Module:** M40 — ENVIRONMENTAL HEALTH & SAFETY (EHS)
  - **Auth:** JWT Required
  - **Permission:** `ehs:read`, `ehs:write`
  - **Database:** `ehs_risk_assessments`

**Entity: Safety CAPA & Audit Checklist Management**
- `GET    /api/ehs/capas` (List EHS corrective actions by status and assignee)
- `POST   /api/ehs/capas` (Open new safety CAPA linked to incident/audit)
- `POST   /api/ehs/capas/:id/verify` (Verify field implementation of CAPA -> status `VERIFIED`)
- `POST   /api/ehs/capas/:id/close` (Close CAPA -> status `CLOSED`)
- `GET    /api/ehs/audits` (Query safety audit inspection logs)
- `POST   /api/ehs/audits` (Execute safety inspection checklist; auto-calculates score % & triggers CAPA if mandatory item fails)
  - **Module:** M40 — ENVIRONMENTAL HEALTH & SAFETY (EHS)
  - **Auth:** JWT Required
  - **Permission:** `ehs:read`, `ehs:write`, `ehs:audit:manage`
  - **Database:** `ehs_capas`, `ehs_safety_audits`, `ehs_audit_checklist_items`

**Entity: Fire Safety Equipment & Inspection Tracking**
- `GET    /api/ehs/fire-safety/equipment` (List fire extinguishers, hydrants and alarm systems)
- `POST   /api/ehs/fire-safety/equipment` (Register new PCCC equipment)
- `POST   /api/ehs/fire-safety/equipment/:id/inspect` (Log 6-month periodic inspection, renew expiry date & check pressure gauge)
  - **Module:** M40 — ENVIRONMENTAL HEALTH & SAFETY (EHS)
  - **Auth:** JWT Required
  - **Permission:** `ehs:read`, `ehs:write`
  - **Database:** `ehs_fire_equipment`

**Entity: Environmental Monitoring (QCVN Standards)**
- `GET    /api/ehs/environmental/records` (Query effluent, air emission and noise level monitoring records)
- `POST   /api/ehs/environmental/records` (Log measured value vs QCVN standard threshold; auto-flags `EXCEEDED` status)
  - **Module:** M40 — ENVIRONMENTAL HEALTH & SAFETY (EHS)
  - **Auth:** JWT Required
  - **Permission:** `ehs:read`, `ehs:write`
  - **Database:** `ehs_environmental_records`

**Entity: Permit to Work, LOTO Isolation & M27 Gate API**
- `GET    /api/ehs/permits` (List work permits and active Lockout/Tagout energy isolations)
- `POST   /api/ehs/permits` (Issue new work permit / LOTO tag linked to asset)
- `POST   /api/ehs/permits/:id/close` (Close work permit & confirm LOTO tag removal)
- `GET    /api/ehs/permits/asset/:assetId/active` (Read-only active permit check API for M27 EAM Work Order gatekeeper)
  - **Module:** M40 — ENVIRONMENTAL HEALTH & SAFETY (EHS)
  - **Auth:** JWT Required / Internal Service
  - **Permission:** `ehs:read`, `ehs:write`
  - **Database:** `ehs_safety_permits`
  - **Cross-Module Integration:**
    - M27 (EAM Maintenance): Read-only integration checking active LOTO permit for asset prior to high-voltage or hot-work WO release.
  - **Frontend Consumer:** `src/modules/governance/m40-ehs/components/EHSWorkspace.tsx` (`WS29_EHS` / `/ehs`)
  - **Status:** Verified (Live QA Certified: 2026-09-25)

---

## 43. M43 — INDUSTRY PROFILES (HỒ SƠ NGÀNH HÀNG)

**Domain:** `MASTER DATA / CONFIG`  
**Group:** 01. Dữ liệu Chủ & Thiết lập (Master Data & Setup)  
**Workspace:** `WS32_INDUSTRY` | **Route:** `/industry-profiles`  
**Frontend Consumer:** `src/modules/master-data/industry-profiles/components/IndustryProfileWorkspace.tsx`  
**Router:** `src/routes/industryProfiles.routes.ts`

**Entity: Industry Profiles & Master Operating Parameters**
- `GET    /api/industry-profiles` (Danh sách hồ sơ ngành hàng: Manufacturing, Healthcare, Retail, Logistics, Technology...)
- `GET    /api/industry-profiles/:id` (Chi tiết hồ sơ ngành hàng theo ID)
- `POST   /api/industry-profiles` (Tạo mới hồ sơ ngành hàng: code, sector, valuationMethod, complianceStandards, defaultTaxRate)
- `PUT    /api/industry-profiles/:id` (Cập nhật hồ sơ ngành hàng)
- `DELETE /api/industry-profiles/:id` (Xóa hồ sơ ngành hàng)
- `POST   /api/industry-profiles/reset-defaults` (Khôi phục các hồ sơ ngành hàng tiêu chuẩn mặc định)
  - **Module:** M43 — INDUSTRY PROFILES (HỒ SƠ NGÀNH HÀNG)
  - **Auth:** Internal / Session Auth
  - **Permission:** `admin`, `manager`
  - **Database:** `industry_profiles`
  - **Cross-Module Integration:**
    - M07 (Master Data): Thiết lập thông số và tiêu chuẩn tuân thủ mặc định cho danh mục sản phẩm/vật tư theo ngành.
    - M17/M42 (Inventory & Costing): Thiết lập phương pháp tính giá tồn kho mặc định (FIFO, LIFO, Weighted Average).
  - **Status:** Verified & Certified (2026-09-27)



