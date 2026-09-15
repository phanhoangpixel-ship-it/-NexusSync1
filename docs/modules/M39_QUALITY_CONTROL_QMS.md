# M39 — Quality Control & Inspection QMS

**Module ID:** `M39`  
**Module Name:** Quality Management System (QMS) & Inspection  
**Business Group:** `06. GOVERNANCE & SYSTEM`  
**Workspace ID:** `WS27_QUALITY` | **Primary Route:** `/quality`  
**Mounted UI Component:** `src/pages/QualityControl.tsx`  
**Primary API Endpoint:** `GET /api/quality/inspections`

---

## 1. Executive Summary & Purpose
M39 enforces quality control across three critical gates: Incoming Quality Control (IQC on goods receipt), In-Process Quality Control (PQC on manufacturing shop floor), and Outgoing Quality Control (OQC on shipments). It manages Non-Conformance Reports (NCR) and material quarantines.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** QC inspection plans, sampling metrics, defect logs, and NCR dispositions.
- **Inventory Integration:** Rejected goods automatically shift to Quarantine warehouse bins via `InventoryService.postTransaction()` (M17).

## 3. Data Contracts & APIs
- **Database Tables:** `qc_inspection_orders`, `qc_test_results`, `qc_ncrs`.
- **APIs:**
  - `GET /api/quality/inspections` — Inspection orders registry.
  - `POST /api/quality/inspections` — Create inspection.
  - `POST /api/quality/inspections/:id/record` — Record test measurements and pass/fail decision.

## 4. UI/UX Standards
- Pass / Fail / Quarantine visual indicators with clear contrast.
- Numeric test measurements and tolerances in `font-mono tabular-nums`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Add Statistical Process Control (SPC) X-bar and R charts for manufacturing lots.
- [ ] Implement supplier corrective action request (SCAR) workflow linking to M11.
