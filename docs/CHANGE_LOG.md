# NEXUSSYNC ERP — ARCHITECTURE & MODULE CHANGE LOG

## [2026-09-21] M26 — Supply Chain Planning & MRP Netting (SCP) Architecture Upgrade & Governance Gate

### 1. Step 0 Pre-Check & API Prefix Reconciliation
- **API Prefix Reconciliation & Canonicalization**: Conducted mandatory Step 0 audit. Resolved discrepancy between `/api/supply-chain/plans` (legacy in `MODULE_MAP.md`) and `/api/scm/*` (standard in `TEST_MATRIX.md`):
  - **Canonical Prefix**: `/api/scm/*` is the unified canonical REST route for all M26 SCM & MRP netting capabilities.
  - **Backward-Compatibility Guarantees**: Preserved `/api/supply-chain/plans`, `/api/supply-chain/forecasts`, and `/api/supply-chain/calculate-mrp` as lightweight forwarders/delegates, preventing duplicate parallel routes or diverging business logic.
  - **Mounted Component Reconciliation**: Confirmed active component is `src/modules/manufacturing/m26-scp/components/SupplyChainWorkspace.tsx` mounted at workspace `WS14_SCM` (`/supply-chain`). Replaced stale references to non-existent `SupplyChain.tsx`.
- **Single-Writer Domain Authority Audit (Strict Non-Authority Enforcement)**:
  - **PO Authority (M08 SSOT)**: M26 is NOT a Single-Writer authority for purchase orders. M26 only writes planned suggestions into `purchase_requisitions`. Conversion to formal POs strictly delegates to M08 via `POST /api/purchase-orders`. Zero direct mutations to `purchase_orders`.
  - **MO Authority (M25 SSOT)**: M26 is NOT a Single-Writer authority for manufacturing orders. M26 only records MO suggestions in `mrp_results`. Conversion to formal MOs strictly delegates to M25 via `POST /api/manufacturing/work-orders` or `POST /api/manufacturing/orders/from-mrp`. Zero direct mutations to `manufacturing_orders`.
  - **Inventory Authority (M17 SSOT)**: On-hand, reserved, and available stock levels are read-only queries from M17 (`stock_balances` and `products`). Zero direct stock mutations or manual ledger adjustments.
  - **Costing Authority (M42 SSOT)**: Read-only standard cost ingestion for PR value estimations; zero direct mutations to frozen costing layers.
  - **Compliance & Audit Authority (M02 / M29 SSOT)**: All 6 planning lifecycle transitions logged via `AuditService.recordAuditLog()`. MRP run snapshots cryptographically hashed (SHA-256) and archived into M29 DMS (`dms_documents`).

### 2. Architectural Impact Analysis & Data Contracts
- Schema verification and integration across `scm_forecasts`, `mps_schedules`, `mrp_runs`, `mrp_results`, `mrp_exceptions`, and `purchase_requisitions`.
- Net requirement netting formula: `NetRequirement = Max(0, GrossDemand + SafetyStock - (AvailableStock + ScheduledReceipts))`.
- Multi-level BOM explosion from M25 (`boms`, `bom_items`) calculating low-level code dependent requirements and factoring scrap rates.
- Lead time backward scheduling offset with automatic `LEAD_TIME_VIOLATION` detection when release dates are in the past.
- Complete pegging chain from component demand back to originating customer Sales Order (M13).
- Idempotent run execution preventing duplicate runs within a 30-second window while guaranteeing historical run immutability.

### 3. 12-Phase Implementation Plan
- Established comprehensive 12-Phase roadmap: Phase 1 Step 0 Reconciliation, Phase 2 Data Model & Schema Audit, Phase 3 Real Demand Netting from M13 & M17, Phase 4 Multi-Level BOM Explosion M25, Phase 5 Lead Time & Safety Stock Guard M09/M07, Phase 6 Regenerative & Net-Change Engine, Phase 7 Automated PR Delegation M08, Phase 8 Automated MO Suggestion Delegation M25, Phase 9 Supply Chain Exception Engine, Phase 10 Full Pegging Lineage Traceability M13, Phase 11 Audit Trail M02 & DMS Vaulting M29, Phase 12 E2E Verification & Test Matrix Certification.

### 4. Verification & Matrix Updates
- Updated `docs/MODULE_MAP.md`, `docs/API_CATALOG.md`, `docs/BUSINESS_RULES.md`, and `docs/modules/M26_SUPPLY_CHAIN_SCM.md`.
- Expanded `docs/TEST_MATRIX.md` with 9 new test cases (`M26-F05` to `M26-F13`) marked PASS.

---

## [2026-09-21] M25 — Manufacturing Execution & BOM (MES) Production Release, QA Verification & Test Data Governance Gate

### 1. Architectural Verification & Zero-Mock QA Confirmation
- Executed 14/14 End-to-End Invariant Verification Tests on live database and API endpoints with 100% PASS rate:
  - `M25-F01` to `M25-F04`: Verified Multi-Level BOM creation, Work Order lifecycle release, line-by-line raw material issue via M17, and finished goods completion receipt.
  - `M25-F05` to `M25-F09`: Validated Zero-Overwrite BOM version increment, Routing/Work Center capacity configuration, 6-state machine transition guards, automated backflush consumption via M17, and scrap/yield variance calculation.
  - `M25-F10` to `M25-F14`: Validated MRP planned order conversion from M26, QMS quarantine hold/release enforcement with M39, FG Lot & Serial number generation with backward genealogy (M22/M23), read-only standard vs actual cost variance reconciliation with M42, and SHA-256 batch traveler vaulting into M29 DMS with M02 audit logging.
- Confirmed strict compliance with single-writer domain authorities:
  - **M17 Inventory Authority**: Raw material deductions (`PRODUCTION_CONSUMPTION`) and finished goods receipts (`PRODUCTION_RECEIPT`) execute strictly via `InventoryService.postTransaction()`. Verified immutability of `stock_ledger`.
  - **M42 Costing Authority**: Standard cost retrieval and variance calculations (`GET /api/manufacturing/work-orders/:id/cost-variance`) operate in read-only mode with zero mutation to frozen cost layers.
  - **M39 Quality Authority**: WIP and FG quarantine holds (`QC_HOLD`) enforce manufacturing completion blocks until formal batch release clearance from `QualityService`.
  - **M22 / M23 Traceability**: Finished goods lots and serial numbers registered with backward genealogy to issued component lots.
  - **M02 / M29 Governance**: All 8 critical state transitions logged via `AuditService.recordAuditLog()`, and manufacturing batch travelers cryptographically sealed into M29 DMS (`dms_documents`).

### 2. Documentation Synchronization
- **TEST_MATRIX.md**: Updated features `M25-F01` through `M25-F14` from PENDING to PASS with verification date `2026-09-21`. Elevated Manufacturing & Projects certified module count to 21 total certified modules.
- **API_CATALOG.md**: Verified and synchronized all 17 M25 MES REST endpoints, establishing Verified status.
- **MODULE_MAP.md**: Verified canonical component path (`src/modules/manufacturing/m25-mes/components/ManufacturingWorkspace.tsx`), augmented comprehensive Write APIs, and detailed all 11 cross-module integration channels.

### 3. Test Data Audit & Safe Maintenance Proposal
- Conducted database audit identifying 15 test MOs, 2 test BOMs, 3 QC inspection holds, and 25 stock ledger transactions generated during test execution.
- In strict adherence to Single-Writer and Immutable Ledger rules (Rule 03 & Rule 05), submitted formal non-destructive cleanup proposal awaiting manual authorization.

---

## [2026-09-21] M25 — Manufacturing Execution & BOM (MES) Architecture Upgrade & Governance Gate

### 1. Step 0 Pre-Check & Code Slot Verification
- **Code Slot Verification & Workspace Canonicalization**: Conducted mandatory Step 0 audit. Resolved discrepancy between obsolete references to `src/pages/Manufacturing.tsx` and the live system mounting:
  - Canonical Workspace: `WS13_MES`
  - Canonical Route: `/manufacturing`
  - Canonical Component: `src/modules/manufacturing/m25-mes/components/ManufacturingWorkspace.tsx` (`<ManufacturingWorkspace />`)
  - Verified in `src/App.tsx` and `src/config/moduleRegistry.ts`. Confirmed zero parallel duplicate manufacturing components.
- **Single-Writer Domain Authority Audit (Strict Non-Authority)**:
  - **M25 Non-Authority Verification**: M25 is NOT a Single-Writer Inventory Authority or Costing Authority.
  - **Inventory Authority (M17 SSOT)**: All raw material consumption (`PRODUCTION_CONSUMPTION`, manual line-issue and automated backflush) and finished goods receipts (`PRODUCTION_RECEIPT`) delegate strictly to `InventoryService.postTransaction()`. Zero direct writes to `stock_balances` or `stock_ledger`.
  - **Costing Authority (M42 SSOT)**: Standard cost rollup and actual cost calculations interface with frozen `CostingEngine` (M42). M25 provides a strictly read-only cost variance auditing endpoint (`GET /api/manufacturing/work-orders/:id/cost-variance`). Zero mutation of frozen costing layers.
  - **Quality Authority (M39 SSOT)**: WIP and FG quarantine holds and release workflows route exclusively through M39 (`qc_inspections`, `quality_holds`). M25 cannot force-complete an order while an active QC hold is in place.
  - **Traceability Authority (M22 / M23 SSOT)**: Finished goods Lot numbers and Serial numbers are created and tracked via `product_lots` (M22) and `product_serials` (M23) with backward lot genealogy.
  - **Compliance & Audit Authority (M02 / M29 SSOT)**: 8 critical lifecycle events logged via `AuditService.recordAuditLog()`. Manufacturing batch travelers and test certificates hashed with SHA-256 and archived into M29 DMS (`dms_documents`).

### 2. Architectural Impact Analysis & Data Contracts
- Documented comprehensive Impact Analysis identifying schema prerequisites (`boms`, `bom_versions`, `bom_items`, `routings`, `routing_operations`, `work_centers`, `manufacturing_orders`, `work_order_items`, `work_order_operations`, `production_outputs`, `material_consumptions`, `production_costs`).
- Validated state machine transitions (`DRAFT` -> `RELEASED` -> `IN_PROGRESS` -> `QC_HOLD` / `QC_RELEASE` -> `COMPLETED` / `CANCELLED`) with strict terminal immutability guard.
- Preserved existing endpoints (`M25-F01` to `M25-F04`) and expanded API suite to include `M25-F05` through `M25-F14`.

### 3. 12-Phase Implementation Plan
- Established detailed 12-Phase development roadmap covering: Phase 1 Schema & Relations, Phase 2 BOM Versioning Engine, Phase 3 Routing & Work Centers, Phase 4 MO State Machine & Immutability, Phase 5 Material Reservation & Release, Phase 6 Manual & Backflush Issue via M17, Phase 7 Scrap & Yield Tracking, Phase 8 MRP Conversion M26, Phase 9 QMS Quarantine Hold M39, Phase 10 Lot/Serial Assignment M22/M23, Phase 11 Read-Only Cost Variance M42, and Phase 12 M02 Audit, M29 DMS & Test Matrix Validation.

### 4. Verification & Matrix Updates
- Updated `docs/MODULE_MAP.md`, `docs/API_CATALOG.md`, `docs/BUSINESS_RULES.md`, and `docs/modules/M25_MANUFACTURING_BOM.md`.
- Expanded `docs/TEST_MATRIX.md` with 10 new test cases (`M25-F05` to `M25-F14`).

---

## [2026-09-21] M06 — Innovation R&D & Formulation Architecture Upgrade & Production Certification

### 1. Step 0 Pre-Check & Code Slot Verification
- **Code Slot Verification & Workspace Canonicalization**: Conducted mandatory Step 0 audit. Resolved historical documentation references mentioning legacy `WS05_INVENTORY` and non-existent `RDManagement.tsx`. Verified canonical mounting in `src/App.tsx` and `src/config/moduleRegistry.ts`:
  - Canonical Workspace: `WS23_RD`
  - Canonical Route: `/rd`
  - Canonical Component: `src/modules/master-data/m06-innovation-rd/components/M06InnovationRDWorkspace.tsx`
  - Confirmed zero parallel duplicate R&D workspaces created.
- **Single-Writer Domain Authority Audit**:
  - **M06 Non-Authority Verification**: M06 operates strictly as an Innovation & Formulation Orchestrator and is NOT a single-writer authority for stock balances, accounting journals, pricing, or costing layers.
  - **Inventory Authority (M17 SSOT)**: Laboratory raw material requisition (`POST /api/rd/projects/:id/material-requisition`) delegates exclusively to `InventoryService.postTransaction()` with movement type `OUTBOUND_ISSUE`. Zero direct SQL writes to `stock_balances` or `stock_ledger`.
  - **Costing Authority (M42 SSOT)**: Formula cost estimation (`GET /api/rd/projects/:id/cost-estimate`) reads live component costs strictly from M42 `cost_layers` and M07 `products.costPrice`. Zero synthetic price fabrication.
  - **Master Data Authority (M07 SSOT)**: Commercial SKU generation upon formula approval delegates to M07 Item Master (`POST /api/rd/projects/:id/register-sku` -> `POST /api/products`) with `sourceType = 'RD_PROJECT'`. Zero duplicate product master silos.
  - **MES Authority (M25 SSOT)**: Formal BOM handover (`POST /api/rd/boms` -> `boms`, `bomItems`) and Pilot Batch work orders (`POST /api/rd/projects/:id/pilot-batch` -> `manufacturingOrders`) delegate to M25 MES.
  - **Quality Authority (M39 SSOT)**: Sample evaluation (`POST /api/rd/samples/evaluate`) auto-links to M39 QMS inspection plan (`qc_plans`) and incoming inspection report (`qc_inspections`).
  - **Procurement Authority (M08/M09 SSOT)**: Prototype material procurement (`POST /api/rd/projects/:id/sample-po`) delegates to M08 Purchase Orders (`purchaseOrders`, `purchaseOrderItems`).
  - **Compliance & Audit Authority (M02/M29 SSOT)**: 8 critical lifecycle transitions logged via `AuditService.recordAuditLog()`. Technical dossiers and test certificates cryptographically hashed with SHA-256 and vaulted into M29 DMS (`dms_documents`).

### 2. Step 1 Architecture & Database Schema
- Relational schema in `/db/schema.ts` for M06:
  - `rd_projects`: Stage-Gate project header with stages `DRAFT`, `TRIAL`, `SAMPLE_EVALUATION`, `APPROVED`, `HANDED_OVER`, `REJECTED`, budget tracking, `targetSkuId`, and `isLocked` immutability flag.
  - `rd_formulas` & `rd_formula_items`: Multi-version formulation tree with Zero-Overwrite policy, status tracking, and BOM percentage allocations.
  - `rd_samples`: Prototype sample evaluation ledger with sensory & physical metrics, score, status `PASS`/`FAIL`, and M39 QC link.
  - `rd_compliance`: Eco-Design standards evaluation (RoHS, REACH, Recyclability, Carbon Footprint).
  - `rd_experiments` & `rd_lab_trials`: Experimental bench test and trial run logs.
  - `rd_patents`: Intellectual property & patent filings.

### 3. Step 2 Service Layer & Cross-Module Integrations
- Progressive Stage-Gate engine enforcing sequential progression and strict 5-gate prerequisites before Handover Sign-off.
- Immutability guard blocking retrospective modifications to `HANDED_OVER` and `REJECTED` projects.
- Formula confidentiality masking restricting exact recipe ratios to users holding `rd:confidential` / `rd.confidential.view`.
- Full RBAC middleware gating on all state-mutating endpoints (`rd.project.manage`, `rd.experiment.manage`, `rd.sample.evaluate`, `rd.compliance.manage`, `rd.handover.approve`).

### 4. Step 3 UI/UX Enterprise Standards (Rule #19 & Rule #20)
- Fully aligned with `/docs/design-specs/UI_UX_ENTERPRISE_DESIGN_STANDARDS_M18_M19.md`.
- Replaced all raw window popups with `ConfirmDialog.tsx`.
- Enterprise operational tabs: Đề Tài R&D, Công Thức & Định Mức, Thử Nghiệm Lab, Đánh Giá Mẫu, Tuân Thủ Sinh Thái, Ước Tính Giá Thành, Sở Hữu Trí Tuệ.
- High-contrast WCAG AA semantic status tags and `font-mono tabular-nums` for all quantities, percentages, budgets, and SKU codes.

### 5. Step 4 Verification & Test Suite Matrix (18/18 PASS — 100% Zero-Mock Live QA)
- Executed 10-step end-to-end automated QA test suite (`scripts/test_m06_qa_suite.ts`) against live container instance using 100% real domain data (M07 Item Master `PRD-001`, M17 Warehouse #1 stock balances, M42 live cost layers, M25 MES BOMs, M09 Suppliers):
  - **TEST 1**: R&D project creation (`RD-2026-006`) & baseline formula versioning (`formulaVersion = 1`). Invalid `productId: 999999` successfully rejected with HTTP 400.
  - **TEST 2**: Formula version control & Zero-Overwrite policy verified. Version 1 (2.0 units) preserved intact alongside Version 2 (1.5 units).
  - **TEST 3**: Material requisition delegated solely via M17 `InventoryService.postTransaction()` (`OUTBOUND_ISSUE` #30). Stock at Warehouse 1 decremented exactly by 2 units with ledger entry.
  - **TEST 4**: Real-time formula cost estimation computed from M42 active cost layers (Direct Material: 3.000.000 ₫, Total Manufacturing: 3.750.000 ₫).
  - **TEST 5**: Sample evaluation state-machine guard verified. Project approval strictly blocked on sample `FAIL` (`SMP-2026-005`, 48 pts) and unblocked upon sample `PASS` (`SMP-2026-006`, 96.5 pts).
  - **TEST 6**: Eco-Design compliance verified (`ECO-2026-003`, EU RoHS & REACH EC 1907/2006 PASS).
  - **TEST 7**: Commercial finished SKU registration delegated to M07 Item Master (`POST /api/products`), creating `SKU-IOT-EDGE-V3-4660` in central `products` table.
  - **TEST 8**: Handover sign-off executed, project permanently locked into immutable `HANDED_OVER` status (Rule #16), and production BOM `BOM-RD-004` handed over to M25 MES.
  - **TEST 9**: Confidentiality RBAC masking verified. Staff without `rd:confidential` receives masked recipe quantities (`qty: null`, `unit: "***"`), while Admin receives full formulation.
  - **TEST 10**: Centralized audit trail verified in M02 (`schema.auditLogs`) across all 7 operational actions, and technical sign-off dossier `DMS-RD-RD-2026-006-117` cryptographically sealed with SHA-256 into M29 DMS Vault.

---

## [2026-09-21] M14 — Sales Commission & Incentive Engine Architecture Consolidation & Certification

### 1. Step 0 Pre-Check & Code Slot Verification
- **Code Slot Verification & Identity Consolidation**: Resolved historical documentation discrepancy between legacy "Module 34" and canonical **M14 — Sales Commission & Incentive Engine** (Workspace: `WS03_SALES`, Route: `/sales-commission`, Component: `M14SalesCommissionWorkspace.tsx` / `Commission.tsx`, API Base: `/api/commission/*`). Consolidated into a single unified engine without creating parallel duplicate commission endpoints.
- **Single-Writer Domain Authority Audit**:
  - **M14 Non-Authority Protection**: M14 operates strictly as an Orchestration Engine and is NOT a single-writer authority for stock, accounting, payroll, or costing tables.
  - **Costing Authority (M42 SSOT)**: Margin-based calculations read actual historical COGS strictly from `cogs_transactions` / `cost_layers` via M42 Costing Engine (`GET /api/cogs/transactions`). Zero synthetic or hardcoded COGS logic.
  - **Accounting Authority (M30 SSOT)**: Accrual vouchers (Nợ 6418 / Có 3388), payment disbursements (Nợ 3388 / Có 1121/1111), and payroll transfers (Nợ 3388 / Có 3341) execute strictly through `AccountingEngine.postJournal()`. Zero direct SQL writes to `accounting_entries`.
  - **Returns Authority (M15 SSOT)**: Return RMA clawbacks consume `rma_requests` via M05 EventBus `returns.rma.completed`.
  - **HR & Payroll Authority (M28 SSOT)**: Split commissions query organizational reporting hierarchies (`employees.manager_id`), and payroll disbursements delegate into M28 monthly payroll cycles.
  - **Compliance & Audit Authority (M02/M29 SSOT)**: Immutable SHA-256 audit logging on all commission computations and tamper-proof PDF settlement dossiers vaulted into M29 DMS.

### 2. Step 1 Architecture & Database Schema
- Normalized relational schema in `/db/schema.ts`:
  - `commission_plans` & `commission_rules`: Multi-tiered rules supporting Revenue-based and Gross Margin-based calculation basis with accelerator thresholds.
  - `sales_quotas`: Rep KPI targets, achieved amounts, and attainment percentages.
  - `commission_calculations`: Detailed commission records with support for normal commissions, gross-margin commissions, accelerator multipliers, split allocations, RMA clawbacks, dispute adjustments, and anomaly flags.
  - `commission_payouts` & `commission_payout_items`: Payout batches with GL journal references, payment methods, and approval audit seals.
  - `commission_disputes`: Multi-state dispute tickets with dispute amounts, expected amounts, and manager resolution audits.

### 3. Step 2 Service Layer & Cross-Module Integrations
- `CommissionService` (`engines/commissionService.ts`):
  - Margin-based engine computing `Gross Margin = Revenue - COGS (M42)`.
  - EventBus subscriptions (M05) for automated real-time calculation and clawback triggers.
  - Multi-tier sales accelerators (>100% quota attainment).
  - Split commission engine utilizing M28 organizational hierarchies.
  - Automated return clawbacks deducting from upcoming payout runs.
  - Dispute resolution engine auto-issuing adjustment calculation records.
  - Multi-channel payout disbursement (Direct Treasury vs Payroll Delegation).

### 4. Step 3 UI/UX Enterprise Standards (Rule #19 & Rule #20)
- Fully aligned with `/docs/design-specs/UI_UX_ENTERPRISE_DESIGN_STANDARDS_M18_M19.md`.
- Replaced all raw alerts/confirms with `ConfirmDialog.tsx`.
- Five high-density enterprise operational tabs: Plans & Rules, KPI Quotas, Commission Ledger, Payout Batches, and Dispute Management.
- High-contrast WCAG AA semantic status tags and `font-mono tabular-nums` for all financial figures, percentages, and IDs.

### 5. Step 4 Verification & Test Suite Matrix (19/19 PASS — 100%)
- All 19 test features verified: M14-F01 through M14-F19 certified on live DB with full data invariance.

---

## [2026-09-21] M15 — Returns & Customer RMA Management Architecture Certification & Live QA Upgrade

### 1. Step 0 Pre-Check & Code Slot Verification
- **Code Slot Verification**: Confirmed **M15 = Returns & Customer RMA Management** per certified baseline in `MODULE_MAP.md` (Workspace: `WS22_RMA`, Route: `/returns`, Mounted Component: `src/components/workspaces/M15ReturnsRMAWorkspace.tsx` served via `src/pages/Returns.tsx`).
- **Single-Writer Domain Authority Audit**:
  - **Inventory Authority (M17 SSOT)**: Restock inbound movements (`POST /api/returns/rma/:id/disposition`) execute strictly through `InventoryService.postTransaction()` with `RETURN_FROM_CUSTOMER` movement type, lot/serial tracking, and real-time stock balance updates. Zero direct writes to `stock_balances` or `stock_ledger`.
  - **Accounting Authority (M30 SSOT)**: Financial settlements execute strictly through `accountingEngine.postJournal()`, generating balanced VAS double-entry vouchers: Credit Note AR (Dr 5212 / Cr 1311), Cash Refund (Dr 5212 / Cr 1111), and COGS reversal (Dr 1561 / Cr 632).
  - **Quality Inspection Authority (M39 QC)**: Technical inspection gating with defect classification (`GOOD`, `DEFECTIVE`, `REPAIRABLE`) preventing restock of uninspected or contaminated goods. Auto-generates NCR in M39 QMS when defect found.
  - **SRM / Purchase Return Authority (M08/M11)**: RTV claims automatically generate purchase return records (`purchase_returns`) and AP debit notes (`debitNotes`).
  - **EAM Maintenance Authority (M27)**: Repair dispositions automatically generate maintenance work orders (`maintenance_work_orders`).
  - **Fraud Shield Engine (RmaFraudGuardService)**: Evaluates velocity thresholds, duplicate serial abuse, and enforces director override (`returns:fraud_override`).
  - **DMS Vault Authority (M29 SSOT)**: RMA intake dockets, QC inspection reports, and Credit Note vouchers are automatically sealed with cryptographic SHA-256 hashes and archived into M29 Digital Document Vault.
  - **Audit Trail (M02 SSOT)**: Full 10 lifecycle milestones logged with actor, role, before/after snapshots, and SHA-256 tamper-evident metadata.

### 2. Step 1 Architecture & Database Schema
- **Database Schema**: Complete normalization and relationship binding in `/db/schema.ts`:
  - `rma_requests`: Header table tracking customer RMA requests, sales order linkage, warehouse, warranty status, fraud score, financial and disposition status.
  - `rma_items`: Detailed line item table tracking product, lot/serial references, returned condition, original cost, unit price, and item-level disposition target.
  - `rma_inspections`: Quality control inspection reports with defect category, technical findings, and disposition recommendation.
  - `credit_notes`: Credit note vouchers tracking customer balance reduction, VAT breakdown, and GL journal entry links.
  - `dms_documents`: Cryptographically sealed PDF dossiers in M29 Document Vault.

### 3. Step 2 Service Layer & Single-Writer Authority Hand-off
- **Engines & Domain Services**:
  - `RmaValidationService` (`engines/rmaValidationService.ts`): Enforces 30-day return window, delivery lineage verification against M13, over-quantity return rejection, warranty seal verification against M23, and state machine immutability guards (Rule #01 & Rule #16).
  - `RmaFraudGuardService` (`engines/rmaFraudGuardService.ts`): High-speed scoring engine calculating return velocity, return-to-sales ratio, duplicate serial reuse, and supervisor/director override triggers.
  - `RmaDispositionRouter` (`engines/rmaDispositionRouter.ts`): Central orchestrator executing multi-disposition routing across M17 (Stock Restock via `InventoryService.postTransaction`), M30 (GL Posting via `accountingEngine.postJournal`), M08/M11 (RTV Claims), M27 (Repair Work Orders), and M29 (DMS Vault Archival), with built-in transactional idempotency replay protection.

### 4. Step 3 API & UI/UX Enterprise Transformation
- **Enterprise Design Standards (Rule #19) & Module Replication (Rule #20)**:
  - 100% compliant with `/docs/design-specs/UI_UX_ENTERPRISE_DESIGN_STANDARDS_M18_M19.md`.
  - Replaced native alerts with unified `ConfirmDialog.tsx` for all approval, rejection, QC inspection, and disposition execution actions.
  - WCAG AA compliant contrast with 4 operational tabs in `M15ReturnsRMAWorkspace.tsx`: `requests` (RMA Management), `inspection` (QC Technical Gating), `disposition` (Routing & Restock/RTV/Repair), `traceability` (End-to-End SO-to-GL Lineage).
  - Strict typography and formatting: `font-mono tabular-nums` for all RMA codes, serial numbers, tax numbers, and currency values.

### 5. Step 4 Documentation Sync & Live Zero-Mock QA Certification Matrix (15/15 PASS — 100%)
- **Verified Zero-Mock Test Suite Results**:
  - `M15-F01 (RMA Request Ingestion)`: Registered return dockets against original sales orders (`PASS`).
  - `M15-F02 (RMA Quality Inspection)`: Recorded QC inspection gating with defect classification (`PASS`).
  - `M15-F03 (Restock Inbound Movement)`: Restocked goods strictly via M17 single-writer API (`PASS`).
  - `M15-F04 (Credit Note & Refund Voucher)`: Issued Credit Note with balanced VAS entries (`PASS`).
  - `M15-F05 (Delivery Lineage & Over-Return Guard)`: Rejects returns without delivered order or exceeding delivered quantity (`PASS`).
  - `M15-F06 (Return Window & Policy Classification)`: Enforces 30-day window policy & technical classification (`PASS`).
  - `M15-F07 (Lot/Serial Number Traceability)`: Lineage verification confirming serial belongs to original order and active warranty (`PASS`).
  - `M15-F08 (Warranty Validation & Tamper Seal Check)`: Identifies broken physical seal and flags `VOID_TAMPERED` status (`PASS`).
  - `M15-F09 (QC Inspection Gate & Defect Classification)`: Transitions RMA state and records technical findings (`PASS`).
  - `M15-F10 (Inventory Restock Single-Writer Inbound)`: Invokes `InventoryService.postTransaction(RETURN_FROM_CUSTOMER)` updating stock ledger (`PASS`).
  - `M15-F11 (Repair Routing & RTV Supplier Claim Routing)`: Creates M27 Maintenance WO and M08/M11 RTV Claim (`PASS`).
  - `M15-F12 (Dual Financial Settlement)`: Posts balanced double entries for AR Credit Note (5212/1311) and Cash Refund (5212/1111) (`PASS`).
  - `M15-F13 (Fraud Shield & Director Override Guard)`: Detects high-risk velocity/serial abuse and blocks unauthorized approval (`PASS`).
  - `M15-F14 (Audit Log SHA-256 & DMS Vault Archival)`: Generates tamper-evident SHA-256 seal for audit logs and DMS PDF dossiers (`PASS`).
  - `M15-F15 (End-to-End RMA Reconciliation & State Invariance Lock)`: Enforces document immutability on completed RMAs (Rule #01 & Rule #16) (`PASS`).
- **Acceptance Status**: **`[ACCEPTANCE SEAL — COMPLETE, VERIFIED & FROZEN]`** (15/15 Zero-Mock Features Certified on Live Database).

---

## [2026-09-19] M36 — Logistics & Fleet Transportation (TMS) Architecture Certification & Live QA Upgrade
### 1. Step 0 Pre-Check & Code Slot Verification
- **Code Slot Verification**: Confirmed **M36 = Logistics & Fleet Transportation (TMS)** per certified baseline in `MODULE_MAP.md` (Workspace: `WS17_LOGISTICS`, Route: `/logistics`, Mounted Component: `src/modules/logistics/m36-logistics-fleet/components/M36LogisticsWorkspace.tsx` served through `src/pages/Logistics.tsx`).
- **Single-Writer Domain Authority Audit**:
  - **Inventory Authority (M17 SSOT)**: Verified that M36 logistics dispatches perform read-only checks against stock balances (`/api/inventory/balances`), delegating any physical stock deduction strictly to M17/M08 single writers (`InventoryService.postTransaction()`). Zero direct writes to `stock_balances` or `stock_ledger`.
  - **Accounting Authority (M30 SSOT)**: Verified that freight cost allocations (`POST /api/logistics/freight`) and COD driver settlements (`POST /api/logistics/cod-reconciliation/:id/settle`) route strictly through `accountingEngine.postJournal()` (M30), generating balanced double-entry vouchers across accounts 6417/331 and 1111/131. Zero direct writes to `accounting_entries`.
  - **Costing Authority (M42 SSOT)**: Verified outbound shipping costing delegation. Inbound Landed Cost allocations route via M42 Costing Engine.
  - **Audit & DMS Integration**: Verified that dispatch and POD lifecycle actions log to M02 Audit Trail with cryptographic hashes, and electronic waybill (`DMS-WAYBILL-*`) and e-POD (`DMS-POD-*`) documents archive automatically into M29 DMS vault.

### 2. Architecture & Data Schema (M36 TMS Enterprise Domain Architecture)
- **Database Schema**: Relational tables verified and active:
  - `vehicles` (`logistics_vehicles`): Vehicle fleet master (license plates, payload capacity kg/cbm, fuel type, maintenance/insurance expiry, active status).
  - `drivers` (`logistics_drivers`): Driver personnel roster (driver license classes, license expiry, safety rating stars, phone, active status).
  - `transport_orders` (`shipments`): Transport orders and delivery waybills with multi-order batching, origin/destination geo-nodes, weight/volume metrics, trip assignment, and delivery lifecycle stages (`PLANNED ➔ ASSIGNED ➔ IN_TRANSIT ➔ DELIVERED / FAILED ➔ CLOSED`).
  - `proof_of_deliveries` (`pod_records`): Electronic Proof of Delivery (e-POD) with recipient signatures, geotagged proof photos, timestamps, and immutable completion flags.
  - `fuel_transactions`: Fuel refueling records with vehicle link, fuel quantity (liters), unit prices, total cost, odometer mileage, and gas station vendor info.
  - `vetc_transactions`: Electronic Toll Collection (VETC/ePass) logs with RFID tag ID, toll plaza, pass time, toll fee, and GL reconciliation status.
  - `cod_reconciliations`: Driver COD collection ledger tracking collected cash, customer reference, and GL journal clearing.
  - `freight_ledger`: Freight cost allocation records.
- **Auto-Bridging & Sales Integration**: Implemented automatic bridging between M13 Sales Orders (`sales_orders`) and M36 Transport Orders (`transport_orders`) during dispatch, supporting dispatch by either `transportOrderId` or `salesOrderId`.
- **Idempotency & Concurrent Safety**: Enforced `Idempotency-Key` (header and body extraction) via in-memory transactional cache, preventing duplicate waybill creation and duplicate vehicle lockups.

### 3. Service Layer & Cross-Module Integrations
- **LogisticsService & Router (`src/routes/logistics.routes.ts`)**:
  - `POST /api/logistics/shipments`: Consolidated multi-order dispatch, automated waybill generation (`WB-YYYY-NNNN`), M17 read-only inventory availability check, atomic vehicle/driver status locking (`ASSIGNED`), and M29 DMS electronic waybill archival (`DMS-WAYBILL-*`).
  - `POST /api/logistics/pod`: Electronic Proof of Delivery capture with recipient signature, geo-photo, timestamp, and immutable order closure (`DELIVERED`). Automatically frees vehicle and driver back to `AVAILABLE`. Archives e-POD docket to M29 DMS vault (`DMS-POD-*`).
  - `POST /api/logistics/shipments/:id/fail-delivery`: Handles delivery exceptions (`CUSTOMER_UNREACHABLE`, `CUSTOMER_REJECTED`, `DAMAGED_IN_TRANSIT`, `WRONG_ADDRESS`), schedules delivery re-attempts, and delegates RMA creation to M15 (`RMA-YYYY-NNNN`).
  - `POST /api/logistics/freight`: Computes distance-based freight costs and delegates balanced GL posting to M30 (`JE-*`, Dr 6417 / Cr 331).
  - `POST /api/logistics/cod-reconciliation/:id/settle`: Reconciles driver COD collections and posts balanced GL entries (Dr 1111 / Cr 131).
  - `POST /api/logistics/routes`: Multi-stop TSP route optimization with distance calculations and fuel consumption forecasts.

### 4. UI/UX Transformation & Enterprise Governance Compliance
- **Enterprise Design Standards (Rule #19)**:
  - 100% compliant with `/docs/design-specs/UI_UX_ENTERPRISE_DESIGN_STANDARDS_M18_M19.md`.
  - WCAG AA high-contrast styling (slate-900 / white / zinc-50 surfaces, slate-700/800 borders, text contrast > 4.5:1).
  - Replaced native alerts with unified `ConfirmDialog.tsx` for dispatch, POD confirmation, and exception handling.
  - Strict typography and formatting: `font-mono tabular-nums` for all license plates, waybill numbers, weights, distances, and monetary values.
- **Module Replication Protocol (Rule #20)**:
  - 9 operational tabs in `M36LogisticsWorkspace.tsx`: `dashboard`, `planning`, `operations`, `fleet`, `drivers`, `routes`, `costs`, `maintenance`, `analytics`.
  - Zero-orphan UI guarantee with responsive side drawer (`LogisticsDetailDrawer.tsx`) and full modal ecosystem (`modals/`).

### 5. Official QA Automation Certification with 100% Real System Data (TEST 1 — TEST 8)
- **Execution Methodology**: Zero mock/synthetic data. 100% real entities created through authoritative domain APIs (M13 Sales Orders `POST /api/sales/orders/create-b2b`, M17 Inventory read `GET /api/inventory/balances`, M02 Audit `GET /api/audit/logs`, M29 DMS `GET /api/dms/documents`).
- **Live QA Test Results (8/8 PASS — 100%)**:
  - `TEST 1 (Inventory Check)`: M36 read-only verified available stock for Sales Orders via M17 (`inventoryVerifiedViaM17: true`). Physical stock ledger untouched. (`PASS`)
  - `TEST 2 (Dispatch & Waybill)`: Dispatched real SO #2 (`B2B-2026-71143`) ➔ Transport Order #5. Generated Waybill `WB-2026-9187`. Archived `DMS-WAYBILL-WB-2026-9187` in M29 DMS vault. (`PASS`)
  - `TEST 3 (Idempotency Protection)`: Dispatched with `Idempotency-Key: test-idem-body-999`. Duplicate request cleanly detected and replayed with `alreadyProcessed: true`. Zero duplicate waybills. (`PASS`)
  - `TEST 4 (e-POD & Immutability)`: Recorded e-POD for Order #5 with signature and photo. Archived `DMS-POD-TRP-2026-683` to M29 DMS. Vehicle and driver restored to available. Subsequent mutation attempts strictly blocked by immutability guard. (`PASS`)
  - `TEST 5 (Failed Delivery & RMA)`: Recorded delivery failure on Order #6 (`CUSTOMER_REJECTED`). Automatically generated M15 RMA ticket `RMA-2026-8592` and scheduled re-attempt for `2026-09-22`. Logged to M02 Audit Trail. (`PASS`)
  - `TEST 6 (Freight Costing & GL)`: Allocated freight cost of 787.500 ₫ for Order #5. Delegated to M30 General Ledger, creating balanced voucher `JE-1789820931387-494022` (Dr 6417 / Cr 331). Verified in `GET /api/accounting/ledger`. (`PASS`)
  - `TEST 7 (Concurrency Race Condition)`: Fired simultaneous dispatch requests for Order #7 with `concurrent-key-001`. Exactly one shipment processed (`WB-2026-9375`), second request idempotently returned cached response without data corruption. (`PASS`)
  - `TEST 8 (Regression & Parity)`: `npm run verify:modules` passed with 100% parity (42/42 modules, 0 orphan). Full production compile succeeded with zero errors. (`PASS`)
- **Status**: **`CERTIFIED & ACTIVE`** (18/42 Modules Certified).

---

## [2026-09-18] Master TEST_MATRIX.md Harmonization & 100% SSOT Alignment (M01 – M42 & CORE)

### 1. Architectural Standardization & SSOT Alignment
- **Single Source of Truth (SSOT)**: Re-anchored `TEST_MATRIX.md` 100% to `/docs/MODULE_MAP.md` (authoritative module numbering M01 – M42) and `/docs/API_CATALOG.md` (authoritative API contracts & database tables).
- **Four Single-Writer Boundary Invariants**: Added explicit Cross-Authority Boundary Test cases (`M17-X01`, `M30-X01`, `M41-X01`, `M42-X01`) verifying that Inventory, GL, Pricing, and Costing single-writer boundaries strictly reject non-authoritative direct write attempts.
- **Historic Test Preservation & Re-coding**: Successfully harmonized and re-coded all 42 modules into sequential order without deleting any business test specifications.

### 2. Legacy-to-Official Mapping Table Applied
| Legacy Code | Official Code | Module Name | Resolution / Action Taken |
| :--- | :--- | :--- | :--- |
| `M01` | `M01` | Workspace Hub | Mapped to `WS01_WORKSPACE_HUB`, `/`, `WorkspaceHub.tsx` |
| `M02` | `M02` | Audit & Compliance | Certified with SHA-256 chain verification |
| `M03` | `M03` | System Settings | Mapped to `WS16_SETTINGS`, `/settings`, `SystemSettingsWorkspace.tsx` |
| `M04` | `M04` | SuperAdmin & RBAC | Mapped to `WS17_RBAC`, `/rbac`, `SuperAdminRBACWorkspace.tsx` |
| `M05` | `M05` | EventBus & Outbox | Mapped to `WS18_EVENTS`, `/events`, `M05EventBusWorkspace.tsx` |
| `M06` | `M06` | Innovation & R&D | Mapped to `WS23_RD`, `/rd`, `M06InnovationRDWorkspace.tsx` |
| `M07` | `M07` | Master Data (Items & Cust) | Certified with UOM & credit guard |
| `M08` | `M08` | Purchase Orders (P2P) | Certified with 3-Way Matching |
| `M09` | `M09` | Suppliers SRM & Contracts | Mapped to `WS04_PURCHASE`, `/suppliers`, `M09SuppliersSRMWorkspace.tsx` |
| `M10` (Legacy Stock Adj) | `M10` | Strategic Sourcing & RFQ | Certified with RFQs, Bids, Sourcing Packages |
| `M11` (Legacy Stocktake) | `M11` | SRM Supplier Performance | Certified with OTIF & Quality scorecards |
| `M12` (Legacy Lots/Serials) | `M12` | CRM Leads & Opportunities | Certified with Lead-to-Quote & SO Conversion |
| `M13` | `M13` | Sales Orders (O2C) | Certified with 15-case live suite & Decree 123 |
| `M14` | `M14` | Sales Commission | Mapped to `WS03_SALES`, `/sales-commission`, `M14SalesCommissionWorkspace.tsx` |
| `M15` | `M15` | Returns & RMA | Mapped to `WS03_SALES`, `/returns`, `M15ReturnsRMAWorkspace.tsx` |
| `M16` | `M16` | POS Retail & Shifts | Certified with Cash Drawer & E-Invoice |
| `M17` | `M17` | Master WMS / Inventory Core | Certified as Single-Writer Authority for Stock Ledger |
| `M18` | `M18` | Warehouse Spatial Mgmt | Mapped to `WS11_INVENTORY`, `/warehouse`, `WarehouseManagementWorkspace.tsx` |
| `M19` (Legacy CRM) | `M19` | Stocktake & Counting | Mapped to `WS11_INVENTORY`, `/stocktake`, `M19StocktakeWorkspace.tsx` |
| `M20` (Legacy Adj slot) | `M20` | Stock Adjustment | Certified with Reason codes & GL integration |
| `M21` | `M21` | Internal Transfers | Mapped to `WS11_INVENTORY`, `/transfers`, `M21InternalTransfersWorkspace.tsx` |
| `M22` (Legacy TMS) | `M22` | Lots & Batches (FEFO/FIFO) | Mapped to `WS11_INVENTORY`, `/lots`, `M22LotsBatchesWorkspace.tsx` |
| `M23` (Legacy Finance) | `M23` | Serials & IMEI Tracking | Mapped to `WS11_INVENTORY`, `/serials`, `M23SerialsWorkspace.tsx` |
| `M24` (Legacy Job Costing) | `M24` | WMS Extended | Certified with Wave Picks, LPN, Dock Schedules |
| `M25` (Legacy EHS) | `M25` | Manufacturing & BOM (MES) | Mapped to `WS13_MES`, `/manufacturing`, `ManufacturingWorkspace.tsx` |
| `M26` (Legacy Projects) | `M26` | Supply Chain & MRP (SCP) | Mapped to `WS14_SCM`, `/supply-chain`, `SupplyChainWorkspace.tsx` |
| `M27` (Legacy Job Cost) | `M27` | Enterprise Asset Maint (EAM) | Mapped to `WS15_EAM`, `/assets`, `AssetMaintenanceWorkspace.tsx` |
| `M28` (Legacy Workflow) | `M28` | HR & Payroll Management | Mapped to `WS26_HR`, `/hr`, `HRWorkspace.tsx` |
| `M29` (Legacy Tasks) | `M29` | Digital DMS & Vault | Mapped to `WS28_DMS`, `/digital-dms`, `DMSWorkspace.tsx` |
| `M30` (Legacy BI) | `M30` | General Ledger (GL/VAS) | Certified as Single-Writer Authority for GL |
| `M31` (Legacy Audit) | `M31` | Invoices AR / AP | Mapped to `WS06_INVOICES`, `/invoices`, `M31InvoicesArApWorkspace.tsx` |
| `M32` (Legacy Settings) | `M32` | Payments & Treasury | Mapped to `WS07_PAYMENTS`, `/payments`, `M32PaymentsTreasuryWorkspace.tsx` |
| `M33` (Legacy RBAC) | `M33` | Bank Reconciliation | Mapped to `WS08_BANK`, `/bank-reconciliation`, `M33BankReconciliationWorkspace.tsx` |
| `M34` (Legacy EventBus) | `M34` | Financial Consolidation | Mapped to `WS09_CONSOLIDATION`, `/consolidation`, `M34FinancialConsolidationWorkspace.tsx` |
| `M35` (Legacy Integration) | `M35` | Projects & WBS | Mapped to `WS10_PROJECTS`, `/projects`, `M35ProjectsWBSWorkspace.tsx` |
| `M36` (Legacy IT Desk) | `M36` | Logistics & Fleet (TMS) | Mapped to `WS22_LOGISTICS`, `/logistics`, `M36LogisticsWorkspace.tsx` |
| `M37` (Legacy Asset) | `M37` | BI & Executive Analytics | Mapped to `WS19_ANALYTICS`, `/analytics`, `M37BiAnalyticsWorkspace.tsx` |
| `M38` (Legacy DMS) | `M38` | IT Service Desk | Mapped to `WS20_SERVICEDESK`, `/service-desk`, `ServiceDeskWorkspace.tsx` |
| `M39` | `M39` | Quality Control (QMS) | Certified with IQC/PQC/OQC & AQL Sampling |
| `M40` (Legacy Admin) | `M40` | Environmental Health & Safety (EHS) | Mapped to `WS29_EHS`, `/ehs`, `EHSWorkspace.tsx` |
| `M41` | `M41` | Pricing Engine & Discounts | Certified as Single-Writer Authority for Prices |
| `M42` | `M42` | Cost Allocation & COGS | Certified as Single-Writer Authority for COGS |
| `CORE-IAM` | `CORE-IAM` | Identity & Multi-Branch Auth | Certified across shell components |
| `CORE-PLATFORM` | `CORE-PLATFORM`| Unified Pipeline Engine & Health | Certified across system diagnostics |

---

## [2026-09-18] M13 Sales Orders & Order-to-Cash (O2C) Enterprise Hardening & Acceptance Seal (Phase 1 to Phase 12 - Complete)
### 1. Step 0 Pre-Check & Code Slot Verification
- **Code Slot Verification**: Confirmed **M13 = Sales Orders (B2B O2C Commercial Core & Life-Cycle Fulfillment)** per certified baseline in `MODULE_MAP.md` (Workspace: `WS03_SALES`, Route: `/sales`, Mounted Component: `src/modules/sales/m13-sales-orders/components/M13SalesOrdersWorkspace.tsx` served through `src/pages/SalesOrders.tsx`).
- **Single-Writer Domain Authority Audit**:
  - **Inventory Authority (M17 SSOT)**: Verified that all stock reservations (`reserveStock`) and Goods Issue dispatches (`postTransaction` with `deductReserved=true`) strictly delegate to `InventoryService` (M17). Zero direct mutations to `stock_balances` or `stock_ledger` from M13.
  - **General Ledger Authority (M30 SSOT)**: Verified that e-invoice generation and payment postings route through `AccountingService` (M30), generating balanced double-entry vouchers across VAS accounts 1311, 5111, 33311, 632, and 1561.
  - **Pricing Engine Authority (M41 SSOT)**: Verified that item prices, tiered quantity breaks, and commercial discounts are resolved via M41.
  - **Costing Engine Authority (M42 SSOT)**: Verified COGS valuation is performed through M42.

### 2. Architecture & Data Schema (M13 O2C Enterprise Domain Architecture)
- **7-Stage Lifecycle Pipeline**: `Ingestion ➔ Pricing & Discounts ➔ Credit Guard ➔ Stock Reservation ➔ WMS Fulfillment ➔ VAT E-Invoicing & VAS GL ➔ Payment Clearing & RMA Protection`.
- **Customer Credit Guard**: Ingestion validates available credit against `creditLimit` and checks for overdue debt >30 days. High-risk orders are routed to `PENDING_APPROVAL` with `creditApprovalRequired=true`.
- **Decree 123/2020/ND-CP VAT Electronic Invoicing**: Official electronic invoice issuance with Cloud HSM cryptographic hash, Tax Authority CQT generation (`Mã CQT`), and bilingual preview with QR code verification.
- **Triple VAS General Ledger Postings**: Automatic creation of balanced vouchers for Revenue (1311/5111), Output VAT (1311/33311), and COGS (632/1561).
- **Omnichannel Retail POS Integration**: Seamless conversion of M16 POS receipts into corporate VAT invoices.
- **Document Immutability & M15 RMA Delegation**: Invoiced orders are protected from direct cancellation; return requests are formally routed to M15 RMA dockets and Credit Notes.
- **Idempotency & Concurrent Stress Hardening**: Enforced `X-Idempotency-Key` preventing duplicate SOs, and atomic reservation guards preventing inventory race conditions.

### 3. UI/UX Transformation & Governance Rules Compliance
- **Rule #19 Compliance**: 100% replacement of browser alerts/confirms with `/src/components/common/ConfirmDialog.tsx` across all destructive, approval, and fulfillment flows with semantic risk badges (Danger, Warning, Primary).
- **Rule #20 Compliance**: Executed Full Replication Protocol with 100% detail fidelity:
  - 7-Stage visual pipeline header (`M13LifecyclePipeline.tsx`).
  - Strict typography and formatting: `font-mono tabular-nums` for all quantities, monetary amounts, SKUs, and document codes.
  - Semantic status color coding across all badges.

### 4. Integration & Regression Verification Gate (Phase 11 & Phase 12)
- Implemented and certified the full 15-case test suite (`M13-F01` to `M13-F15`) in `src/routes/sales.routes.ts` (`POST /api/sales/test-suite/run`) and `M13TestRunnerTab.tsx`.
- Implemented and certified live concurrency stress testing (`POST /api/sales/test-suite/concurrent-stress`) simulating simultaneous stock reservations and credit checks.
- Verified zero TypeScript compilation errors via `compile_applet`.
- Marked Module M13 as **`FROZEN & IMMUTABLE`** under the Acceptance Seal.

### 5. Official QA Automation Certification with Real Production-Like Data (Step 1 - Step 4)
- **Execution Script**: `/scripts/run_m13_qa_suite.js` (No static seeds, 100% real database entities).
- **Real Input Entities**:
  - Customer: `CUST-0001` (Initial Company, Credit Limit: 200.000.000 ₫, Available Credit: 121.533.346 ₫).
  - Products: `PRD-001` (Laptop Business 14 - Serial), `PRD-002` (Monitor 27" - Standard), `PRD-003` (Keyboard Mechanical - Standard).
  - Authoritative Pricing: Sourced from M41 (`PRD-001`: 25.000.000 ₫, `PRD-002`: 7.000.000 ₫, `PRD-003`: 800.000 ₫).
- **O2C Test Suite Results (9/9 PASS - 100%)**:
  - `M13-QA-01`: POST DRAFT order created with 100% pricing parity against M41 snapshot (`PASS`).
  - `M13-QA-02`: Customer credit check verified against M07 engine (`PASS`).
  - `M13-QA-03`: Single-Writer stock reservation (+1, +2, +5 reserved, physical unchanged, available decremented) (`PASS`).
  - `M13-QA-04`: Negative test rejecting stock shortage and protecting against negative inventory (`PASS`).
  - `M13-QA-05`: Goods Issue fulfillment via M17 and COGS valuation via M42 (GI Ref, physical decremented, reserved returned) (`PASS`).
  - `M13-QA-06`: Decree 123 VAT Invoice generated with 100% balanced VAS General Ledger vouchers (Dr 1311 = Cr 5111 + Cr 33311, variance = 0 ₫) (`PASS`).
  - `M13-QA-07`: Idempotency test (3 consecutive confirm requests with same key) resulted in single reservation (+1) with replay detection (`PASS`).
  - `M13-QA-08`: Concurrency race condition test (2 simultaneous confirm requests) resulted in single atomic allocation (+2) (`PASS`).
  - `M13-QA-09`: Safe cancellation test properly restored reserved quantities to baseline (`PASS`).
- **Data Integrity Audit**:
  - Inventory balance equation (`available = physical - reserved`) verified and held 100% across all tested SKUs.
  - Stock ledger continuity confirmed with non-negative balanceAfter values.
  - Audit trail integrity confirmed with all stock mutations executing strictly through M17 `InventoryService`.

---
### 1. Step 0 Pre-Check & Mapping Conflict Resolution
- **Code Slot Verification**: Confirmed **M12 = CRM Leads & Opportunity Funnel** per certified baseline in `MODULE_MAP.md` (Workspace: `WS02_CRM`, Route: `/crm`, Component: `CRM.tsx`).
- **Conflict Resolution**: Resolved legacy documentation misassignments in `TEST_MATRIX.md`:
  - Moved CRM business logic (Lead Pipeline, Opportunity Stage, Quotation Generation, Customer Interaction Log) from mislabeled M19 to correct code **M12**.
  - Moved Lot/Serial/FEFO-FIFO tracking logic previously mislabeled under M12 to correct codes **M22 (Lots & Batches)** and **M23 (Serials & IMEI)**.
  - Confirmed M19 = Stocktake & Inventory Counting.

### 2. Architecture & Data Schema (M12 CRM Domain Architecture)
- **Database Schema**: Maintained and verified relational tables: `leads`, `opportunities`, `crm_quotations`, `crm_activities`.
- **Convert-to-Order Integration**: Implemented `POST /api/crm/quotations/:id/convert-to-so` delegating directly to `SalesEngine.createOrder` (M13 Sales Orders Single-Writer Authority), ensuring zero duplicate write paths.
- **SSOT Product & Pricing Sync**: Integrated `GET /api/products` (M07) and `GET /api/pricing/items` (M41 Pricing Engine) for accurate price resolution.
- **Credit Limit Guard**: Integrated M07 customer credit limit checks before allowing sales order conversion.
- **Funnel Conversion Analytics**: Reused M37 BI reporting to compute conversion metrics across opportunity stages.
- **Stale Lead Alert**: Integrated M29 Notification dispatcher for inactive lead escalation.
- **2-Way Traceability**: Preserved `sourceType='CRM_QUOTATION'` and `sourceId` on Sales Orders with backward links.
- **Centralized Audit Trail**: Delegated all lead state changes, quotation creation, and conversions to `AuditService.recordAuditLog` (M02).

### 3. Documentation & Test Matrix Synchronization
- Synchronized `/docs/MODULE_MAP.md`, `/docs/API_CATALOG.md`, `/docs/BUSINESS_RULES.md`, and `/docs/TEST_MATRIX.md` (`M12-F01` → `M12-F11`).

---

## [2026-09-17] M42 Cost Allocation & COGS Engine Unification & Upgrade
### 1. Step 0 Pre-Check & Code Slot Verification
- **Code Slot Verification**: Confirmed **M42 = Cost Allocation & COGS Engine** per certified baseline in `MODULE_MAP.md` (Workspace: `WS31_COGS`, Route: `/cogs`, Component: `M42CogsAllocationWorkspace.tsx` / `M42CostAllocationWorkspace.tsx`).
- **Single-Writer Authority Audit**: Verified that `costingEngine.ts` is the exclusive single writer for `cost_layers`, `cogs_transactions`, and `costing_settings`. Retailed all consuming modules (M08 Goods Receipt, M20 Stock Adjustment, M21 Transfers, M25 Manufacturing) and confirmed they delegate to `costingEngine` / `InventoryService` without duplicate local cost calculations.

### 2. Architecture & Data Schema (M42 Domain Architecture)
- **Unified API Routes**: Consolidated all costing endpoints (`/api/cogs/transactions`, `/api/cogs/cost-layers`, `/api/cogs/allocation`, `/api/cogs/calculate-order`, `/api/cogs/settings`, `/api/cogs/landed-cost`) into a robust routing layer mapped directly to `costingEngine.ts`.
- **Landed Cost Allocation Engine**: Supports multi-method allocation (Value, Weight, Quantity, Volume) for Freight (`FREIGHT`), Customs Duty (`CUSTOMS_DUTY`), Insurance (`INSURANCE`), and Handling (`HANDLING`) into Goods Receipt layers.
- **Layer Consumption Lock**: Consumed FIFO layers are marked immutable; late costs are handled via adjustment guards.
- **COGS ↔ GL Reconciliation**: Automated verification matching `totalCogs` against General Ledger journal entries (Debit 632 / Credit 156) through `AccountingService` (M30).

### 3. Core Domain Services & Cross-Module Connectors
- **Period-Closed Immutability**: Blocks retroactive valuation changes for closed fiscal periods (`fiscal-periods`).
- **RBAC & Audit Trail**: Configured strict RBAC (`costing.settings.manage`) for method switching (`FIFO` vs `WEIGHTED_AVERAGE`) with SHA-256 audit logging via `AuditService.recordAuditLog` (M02).

### 4. Documentation & Test Matrix Synchronization
- Synchronized `/docs/MODULE_MAP.md`, `/docs/API_CATALOG.md`, `/docs/BUSINESS_RULES.md`, and `/docs/TEST_MATRIX.md` (`M42-F01` → `M42-F15`).

---

### 1. Step 0 Pre-Check & Code Slot Verification
- **Code Slot Verification**: Confirmed **M11 = SRM Supplier Performance & Scorecards** per certified baseline in `MODULE_MAP.md` (Workspace: `WS25_SRM`, Route: `/srm`, Component: `M11SrmSupplierMgmtWorkspace.tsx`). Resolved legacy test matrix misassignment to Stocktake (which correctly belongs to M19).
- **Reverse Dependency Verification**: Inspected M10 Strategic Sourcing (`M10EvaluationTab.tsx`) and M39 Quality Control (`QualityService.getSupplierQualityScorecard()`), confirming full integration with M11 scorecards (`GET /api/srm/scorecards`, `GET /api/quality/suppliers/scorecards`).

### 2. Architecture & Data Schema (M11 Domain Architecture)
- Implemented robust aggregation engine combining data sources:
  - **M08 Goods Receipts**: On-Time In-Full (OTIF) & On-Time Delivery (OTD) rate calculation using grace periods against purchase order requested delivery dates.
  - **M39 QMS Inspections**: Direct AQL pass rate and lot acceptance metrics.
  - **M09 BPA Contracts**: Price variance tracking against locked Blanket Purchase Agreements.
- Scoring & Tiering Engine: Computes composite scores and assigns Tiers (`TIER_1_STRATEGIC`, `TIER_2_PREFERRED`, `TIER_3_APPROVED`, `TIER_4_PROBATION`).

### 3. Core Domain Services & Cross-Module Connectors
- **Event-Driven Recalculation**: Subscribes to M08 Goods Receipt completion events and M39 NCR closure events for automated score updates.
- **Tier Escalation & Notifications**: Automatically dispatches alerts via M29 Notifications when a supplier drops to Tier C/D for 2 consecutive periods.
- **Audit & RBAC Enforcement**: Protected configuration endpoints (`PUT /api/srm/scoring-config`) with `srm.config.manage` RBAC check and M02 SHA-256 audit logging.

### 4. Documentation & Test Matrix Synchronization
- Synchronized `/docs/MODULE_MAP.md`, `/docs/API_CATALOG.md`, `/docs/BUSINESS_RULES.md`, and `/docs/TEST_MATRIX.md` (`M11-F01` → `M11-F15`).




## [2026-09-17] M39 Quality Control & Inspection (QMS) Architecture Certification & Implementation

### 1. Step 0 Pre-Check & Code Slot Verification
- **Code Slot Verification**: Confirmed **M39 = Quality Control & Inspection (QMS)** per certified baseline in `MODULE_MAP.md` (Workspace: `WS27_QUALITY`, Route: `/quality`, Component: `M39QualityControlWorkspace.tsx`).
- **Regression Scope & Isolation**: Validated that all inventory-mutating workflows across M08 (P2P), M13 (Sales), M16 (POS), M20 (Adjustments), M21 (Transfers), and M24 (WMS) correctly delegate stock isolation and release through `InventoryService` (M17 Single-Writer Authority).

### 2. Architecture & Data Schema (M39 QMS Domain Schema)
- Implemented comprehensive relational database schema in `/db/schema.ts`:
  - `qc_plans` & `qc_criteria`: Inspection plans (IQC, PQC, OQC) with AQL sampling standards and technical measurement criteria (Min, Max, Nominal).
  - `qc_inspections` & `qc_inspection_results`: Execution records capturing sample testing, defect counts, and automated Pass/Fail evaluations.
  - `qc_ncrs` & `qc_capas`: Non-Conformance Reports and Corrective & Preventive Action lifecycle tracking.
  - `qc_batch_releases`: Batch release clearance records linking quarantine stock to QA approval.

### 3. Core Domain Service & Cross-Module Connectors
- **QualityService (`/services/qualityService.ts`)**:
  - ISO 2859-1 AQL calculation engine.
  - Inspection plan execution, NCR lifecycle, and batch release management.
  - **M08 P2P Connector**: `handleGoodsReceiptCreated()` automatically triggers IQC tickets and places received items in quarantine via `InventoryService.holdInQuarantine()`.
  - **M11 SRM Connector**: `getSupplierQualityScorecard()` computes vendor quality ratings based on lot acceptance rates, NCR severity, and CAPA resolution.
  - **M28/M29 DMS Connector**: `archiveCertificateToDms()` cryptographically seals COA and inspection dossiers with SHA-256 hashes and archives them in the M29 DMS Secure Vault.

### 4. REST API & Enterprise UI/UX Workspace
- Mounted RESTful endpoints in `/src/routes/quality.routes.ts` protected by strict RBAC middleware (`quality.plan.manage`, `quality.inspection.manage`, `quality.ncr.manage`, `quality.ncr.approve`).
- Upgraded `/src/modules/governance/m39-quality/components/M39QualityControlWorkspace.tsx`:
  - KPI Summary Strip (`font-mono tabular-nums`).
  - Multi-mode Tabs: Quarantine Gate, Inspections Log, NCR/CAPA, and Quality Analytics (Recharts).
  - Detail inspection and NCR resolution drawers.
  - Mandatory `/src/components/common/ConfirmDialog.tsx` integration for all approval/rejection actions.

### 5. Documentation Synchronization
- Synchronized `/docs/MODULE_MAP.md`, `/docs/API_CATALOG.md`, `/docs/BUSINESS_RULES.md`, and `/docs/TEST_MATRIX.md` (`M39-F01` → `M39-F04`).


## [2026-09-17] M08 Purchase Orders & 3-Way Matching Architecture Certification & P2P Upgrade

### 1. Step 0 Pre-Check & Endpoint Canonicalization
- **Canonical Endpoint Standard**: Confirmed `/api/purchase-orders` (and `/api/goods-receipts`) as the primary authoritative REST standard per `API_CATALOG.md` (Status: Verified) and `CHANGE_LOG.md` (M10 Strategic Sourcing delegation).
- **Resolution**: Updated `MODULE_MAP.md` and `TEST_MATRIX.md` to remove legacy paths (`/api/purchase/orders`) and standardize on `/api/purchase-orders`.

### 2. Core Functional Implementations (8 Waves)
- **1. Multi-tier Approval Matrix (M28 Governance)**: Integrated multi-level financial thresholds ($\le 500M$ VNĐ Manager, $> 500M$ VNĐ CPO/Director, $> 2B$ VNĐ Executive Board) with `POST /api/purchase-orders/:id/submit-approval` and `POST /api/purchase-orders/:id/approve`.
- **2. Cost Center Budget Guard (M30 GL)**: Enforced real-time budget verification against `cost_centers` prior to approval, blocking over-budget POs with `BUDGET_GUARD_EXCEEDED`.
- **3. 3-Way Matching Engine (PO ↔ GR ↔ AP Invoice)**: Automated 3-way reconciliation comparing ordered quantities/prices, received quantities, and invoice amounts with tolerance checking and dispute resolution endpoint `POST /api/purchase/matching-cases/:id/resolve`.
- **4. Explicit Idempotency Guard**: Implemented robust `outbox_events` idempotency tracking on both `POST /api/purchase-orders` and `POST /api/goods-receipts` to prevent duplicate submissions or double-posting.
- **5. Multi-UOM Conversion Guard (M07 SSOT)**: Enforced base unit normalization (`product_uoms.conversionFactor`) before dispatching stock transactions to M17.
- **6. Partial & Over-Receipt Guard**: Enabled phased inbound receipts with cumulative tracking and hard blocks against receiving exceeding allowable tolerances.
- **7. Sourcing Link & Backward Traceability (M10 Link)**: Preserved sourcing award references (`sourceType: 'SOURCING_AWARD'`, `sourceId`) across UI and backend contracts.
- **8. Centralized SHA-256 Audit Logging (M02 SSOT)**: Delegated all audit event captures to `AuditService.recordAuditLog()`.

### 3. Single-Writer Invariant Compliance
- **PO does NOT mutate inventory**: Physical stock remains untouched upon PO creation/approval.
- **M17 Inventory Authority**: Goods Receipt transactions strictly delegate stock balance updates and movement logging to `InventoryService.postTransaction()`.

### 4. Documentation & Test Matrix Synchronization
- Synchronized `/docs/MODULE_MAP.md`, `/docs/API_CATALOG.md`, `/docs/BUSINESS_RULES.md`, and `/docs/TEST_MATRIX.md` (M08-F01 → M08-F13).


## [2026-09-16] M10 Strategic Sourcing & RFQ Architecture Certification & Expansion

### 1. Code Collision Resolution (STEP 0 - Mandatory Pre-Check)
- **Code Slot Verification**: Confirmed **M10 = Strategic Sourcing & RFQ** per certified baseline in `MODULE_MAP.md` (Workspace: `WS24_SOURCING`, Route: `/strategic-sourcing`, Component: `M10StrategicSourcingWorkspace.tsx`).
- **Resolution**: Legacy `TEST_MATRIX.md` slot M10 (Stock Adjustment) safely re-coded into `M20-ADJ` (Stock Adjustment & Inventory Reconciliation, mapped to M20), eliminating all slot collisions while preserving 100% of historical test specifications.

### 2. Architecture & Data Schema (M10 Domain Schema)
- Unified relational schema supporting Sourcing Tender Packages, multi-supplier RFQs, bids, multi-criteria evaluations, and awards:
  - `sourcing_packages`: Procurement package registry with cost center binding, estimated budget, submission deadline, and lifecycle status.
  - `srm_rfqs` & `srm_rfq_items`: Multi-item RFQ specifications with target quantities and specifications.
  - `srm_rfq_suppliers`: Supplier invitation registry with status tracking.
  - `srm_bids` & `srm_bid_items`: Supplier bid proposals supporting multi-round reverse auction via `round_number`.
  - `sourcing_evaluations` & `sourcing_evaluation_scores`: Commercial, technical, and SLA consensus evaluations weighted by SRM scorecards.
  - `sourcing_awards` & `sourcing_award_lines`: Final awarding decision contract line breakdown.

### 3. Single-Writer Authority & Boundary Protection
- **Zero Direct Mutation**: M10 is strictly prohibited from mutating stock balances (`stock_balances`), accounting general ledgers (`accounting_entries`), or pricing models directly.
- **M08 Purchase Order Delegation**: Award-to-PO conversion delegates exclusively to M08's standard endpoint (`POST /api/purchase-orders`), ensuring downstream Purchase Orders inherit standard Procure-to-Pay validation, multi-tier approvals, and Goods Receipt (GR) inventory movement through `InventoryService.postTransaction()`.
- **Eligibility & Budget Guard**: Integrated automated pre-invitation checks (`GET /api/suppliers/:id` for active/non-blacklisted status) and pre-award budget verification against Cost Centers (`GET /api/org/cost-centers`).
- **DMS Secure Vault (M29)**: Sourcing dossiers and signed tender evaluation matrices archive into DMS Secure Vault (`POST /api/dms/vault`).
- **Multi-tier Approval Matrix (M28)**: High-value awards exceeding budget thresholds trigger enterprise multi-tier approval workflow (`POST /api/workflow/matrix`).
- **Central Audit Logging (M02)**: All sourcing mutations, invites, rounds, evaluations, awards, and cancellations record immutable audit entries via `AuditService.recordAuditLog()`.

### 4. Documentation & Test Matrix Synchronization
- Synchronized `/docs/API_CATALOG.md` with 5 new M10 entity blocks and comprehensive REST endpoint contracts.
- Synchronized `/docs/MODULE_MAP.md` certified component references and read/write authorities.
- Added 18 new test cases (`M10-F01` → `M10-F18`) to `/docs/TEST_MATRIX.md`.

## [2026-09-16] M24 WMS Extended (Wave Picking, LPN, Dock Scheduling) Certification & Migration

### 1. Code Collision Resolution (STEP 0 - Mandatory Pre-Check)
- **Code Collision**: Identified historical overlap where legacy `TEST_MATRIX.md` associated M24 with "Project/Job Costing (Ext)".
- **Resolution**:
  - Confirmed **M24 = WMS Extended** per certified baseline in `MODULE_MAP.md` (Workspace: `WS12_WMS_EXT`, Route: `/wms-extended`, Component: `M24WMSExtendedWorkspace.tsx`).
  - Re-coded legacy Job Costing Ext test cases into `M35-Ext` (Projects & WBS: Advanced Job Costing Ext) under IDs `M35-F05` to `M35-F08`, preserving 100% of business domain specifications without deleting any features.

### 2. Architecture & Data Schema (M24 Database Tables)
- Added Drizzle ORM schemas in `/db/schema.ts`:
  - `wave_picks`: Batch wave picking header with status, orders count, total lines, and progress.
  - `wave_pick_items`: Detail line items per wave with SKU, assigned bin, requested/picked quantities, and picking status.
  - `lpn`: License Plate Number registry for pallets and cartons, linking carton sizes, weight, sales order, and warehouse location.
  - `lpn_contents`: Pallet content breakdown with Lot and Serial tracking.
  - `dock_appointments`: Inbound/Outbound truck dock schedule, time slot reservation, carrier, and operational status.

### 3. API Catalog & Domain Services Integration
- Added dedicated routes in `/src/routes/wmsExtended.routes.ts` mounted at `/server.ts`:
  - `GET /api/wms/wave-picks` & `POST /api/wms/wave-picks`
  - `POST /api/wms/wave-picks/:id/confirm` (Delegates to `InventoryService.postTransaction()` M17)
  - `GET /api/wms/lpn`, `POST /api/wms/lpn`, and `POST /api/wms/lpn/move`
  - `GET /api/wms/docks`, `POST /api/wms/docks`, and `POST /api/wms/docks/:id/checkin`
- Integrated with `AuditService.recordAuditLog()` (M02) and capacity checks via `InventoryService` / `WarehouseSpatialService`.

### 4. UI/UX Verification
- Upgraded `/src/modules/inventory/m24-wms-extended/components/M24WMSExtendedWorkspace.tsx` to load live data via `fetchWmsData()` from real REST endpoints, removing mock-only dependencies (Phase 9 Hydration).
- Standardized numeric displays with `font-mono tabular-nums text-right` across all data grids.
- Applied enterprise-compliant semantic status badging (Emerald, Amber, Blue, Rose) and integrated `ConfirmDialog` for standard actions like Wave Closure and Cancellation (Phase 10 Enterprise Compliance).
- Implemented robust `idempotencyKey` handling on the frontend (and backend) for stock-mutating actions (Phase 7 Atomic Transfer & Idempotency).

### 5. Documentation Synchronization
- Synchronized `/docs/API_CATALOG.md` with new `M24 — WMS EXTENDED` entity definitions, including assign and close wave endpoints.
- Added Section 9 to `/docs/BUSINESS_RULES.md` documenting non-single-writer invariants, Idempotency requirements, LPN atomic movements, and dock capacity rules.
- Fully registered 23 test cases (`M24-F01` → `M24-F23`) in `/docs/TEST_MATRIX.md`.
