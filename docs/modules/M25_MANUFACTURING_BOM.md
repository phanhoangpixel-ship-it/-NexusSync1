# M25 — Manufacturing Execution & BOM (MES)

**Module ID:** `M25`  
**Module Name:** Manufacturing & Bill of Materials (MES)  
**Business Group:** `04. MANUFACTURING & OPERATIONS`  
**Workspace ID:** `WS13_MES` | **Primary Route:** `/manufacturing`  
**Mounted UI Component:** `src/modules/manufacturing/m25-mes/components/ManufacturingWorkspace.tsx` (`<ManufacturingWorkspace />`)  
**Primary API Endpoint:** `GET /api/manufacturing/orders` & `GET /api/manufacturing/work-orders`  
**Dependent Modules:** M06 (R&D), M17 (Inventory), M22 (Lots), M23 (Serials), M26 (SCM/MRP), M27 (EAM), M28 (HR), M39 (Quality), M42 (Costing), M02 (Audit), M29 (DMS).

---

## 1. Executive Summary & Purpose
M25 orchestrates shop-floor manufacturing operations: Multi-level Bill of Materials (BOM) with version control, Routing & Work Center operations with capacity and standard times, Manufacturing Orders (MO) state machine, raw material issue (manual and backflush), scrap & yield variance tracking, MRP planned order conversion, QMS quarantine hold/release, finished goods Lot/Serial generation, and standard-vs-actual cost variance reconciliation.

---

## 2. Domain Authority Boundaries & Invariants (Rule #03 - #07)
- **Exclusive Authority:** Multi-level BOM structures (`boms`, `bom_versions`, `bom_items`), Routing operations (`routings`, `routing_operations`), Work Centers (`work_centers`), and MO lifecycle states (`manufacturing_orders`).
- **Inventory Single-Writer (M17 SSOT):** M25 is NOT an inventory authority. Raw material consumption (`PRODUCTION_CONSUMPTION`, manual or backflush) and finished goods receipt (`PRODUCTION_RECEIPT`) MUST be posted exclusively via `InventoryService.postTransaction()`. Direct writes to `stock_balances` or `stock_ledger` are strictly forbidden.
- **Costing Authority (M42 SSOT):** M25 is NOT a costing authority. Finished goods standard cost and actual cost roll-up are computed via `CostingEngine` (M42). M25 provides a read-only audit view of cost variance.
- **Quality Quarantine Authority (M39 SSOT):** Quarantine holds for WIP or finished goods must route through M39 (`qc_inspections`, `quality_holds`). M25 cannot force-release or clear quarantine without an official QC release certificate.
- **Traceability Authority (M22 / M23 SSOT):** Finished goods lots are registered in `product_lots` (M22) and serial numbers in `product_serials` (M23) maintaining backward link to consumed raw material lots.
- **Audit & DMS Authority (M02 / M29 SSOT):** All lifecycle mutations are audited via `AuditService.recordAuditLog()` (M02), and production travelers, inspection sign-offs, and batch dossiers are stored in M29 DMS (`dms_documents`).

---

## 3. Standard MO State Machine & Immutability Guard
```text
  [DRAFT]
     ↓ (Release Order — Reserves Materials in M17)
[RELEASED]
     ↓ (Issue Materials — M17 postTransaction or Start Operation)
[IN_PROGRESS]
     ↓ (QC Inspection Triggered / Discrepancy Found)
 [QC_HOLD] ←→ [QC_RELEASE]
     ↓ (Pass QC & Final Good Receipt / Backflush)
[COMPLETED] (FROZEN & IMMUTABLE)
     
[DRAFT / RELEASED / IN_PROGRESS] → [CANCELLED] (Releases M17 reservations)
```
- **Immutability Invariant:** MO in status `COMPLETED` or `CANCELLED` is strictly read-only. Retrospective adjustments require a corrective MO (`REWORK_MO` or `ADJUSTMENT_MO`).

---

## 4. 10 Architectural Upgrade Goals
1. **BOM Version Control:** Multi-version tracking (`bom_versions`), zero-overwrite policy, effective date intervals, draft-to-active approval workflow.
2. **Routing & Work Centers:** Sequence of operations with setup and run standard times, machine cost rates per hour, and capacity planning.
3. **Standard MO State Machine:** Deterministic transitions with reservation validation, execution locks, and immutability guards.
4. **Backflush & Manual Material Issue:** Support both staged manual issue and automatic backflush issue upon completion via M17 single-writer.
5. **Scrap & Yield Tracking:** Calculation of actual yield %, scrap quantities, scrap reason codes, and variance comparison against BOM standard scrap rate.
6. **Automatic MO Conversion from MRP (M26):** API endpoint accepting planned manufacturing orders from M26 MRP netting runs.
7. **QMS Quarantine Hold for WIP / FG (M39):** Inspection triggering quarantine hold, blocking finished goods receipt until QC sign-off.
8. **Finished Goods Lot & Serial Assignment (M22/M23):** Automatic or manual assignment of FG lot number and serial numbers with raw material lot genealogy.
9. **Cost Reconciliation Actual vs Standard (M42 Read-Only):** Variance calculation between planned BOM unit cost and actual material/labor/overhead expenditures.
10. **Audit Trail (M02) & DMS Dossier Sealing (M29):** Audit logging on all 8 lifecycle events and electronic batch traveler sealing with SHA-256 in DMS vault.

---

## 5. API Catalog Reference (M25-F01 → M25-F14)
- `GET    /api/manufacturing/boms` (List BOMs with versions & components)
- `POST   /api/manufacturing/boms` (Create BOM - M25-F01)
- `POST   /api/manufacturing/boms/:id/versions` (Create New Version - M25-F05)
- `GET    /api/manufacturing/routings` & `POST /api/manufacturing/routings` (Routing & Work Centers - M25-F06)
- `GET    /api/manufacturing/work-orders` (List MOs)
- `POST   /api/manufacturing/work-orders` (Create MO - M25-F02)
- `PUT    /api/manufacturing/work-orders/:id/status` (State Machine Guard - M25-F07)
- `POST   /api/manufacturing/work-orders/:id/release` (Release MO & Reserve Stock in M17)
- `POST   /api/manufacturing/work-orders/:id/issue-materials` (Manual Issue via M17 - M25-F03)
- `POST   /api/manufacturing/work-orders/:id/backflush` (Backflush Issue via M17 - M25-F08)
- `POST   /api/manufacturing/work-orders/:id/report-scrap` (Scrap & Yield - M25-F09)
- `POST   /api/manufacturing/orders/from-mrp` (MRP Conversion - M25-F10)
- `POST   /api/manufacturing/work-orders/:id/qc-hold` (QMS Quarantine Hold/Release - M25-F11)
- `POST   /api/manufacturing/work-orders/:id/assign-lot-serial` (Lot/Serial Assignment - M25-F12)
- `GET    /api/manufacturing/work-orders/:id/cost-variance` (Cost Reconciliation - M25-F13)
- `POST   /api/manufacturing/work-orders/:id/complete` (Complete MO & Book FG - M25-F04)
- `POST   /api/manufacturing/work-orders/:id/cancel` (Cancel MO & Release Stock)
- `POST   /api/manufacturing/work-orders/:id/dms-dossier` (DMS Sealing & M02 Audit - M25-F14)
