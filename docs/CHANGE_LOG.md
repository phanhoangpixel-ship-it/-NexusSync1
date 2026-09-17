# NEXUSSYNC ERP — ARCHITECTURE & MODULE CHANGE LOG

## [2026-09-17] M11 SRM Supplier Performance & Scorecards Architecture Certification & Integration
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
