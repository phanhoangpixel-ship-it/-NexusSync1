# M11 — SRM Supplier Performance & Scorecards

**Module ID:** `M11`  
**Module Name:** Supplier Performance Evaluation & Scorecards  
**Business Group:** `02. PROCUREMENT & SRM`  
**Workspace ID:** `WS25_SRM` | **Primary Route:** `/srm`  
**Mounted UI Component:** `src/pages/SRM.tsx`  
**Primary API Endpoint:** `GET /api/srm/scorecards`

---

## 1. Executive Summary & Purpose
M11 tracks and evaluates supplier performance across 4 objective dimensions: On-Time Delivery (OTD), Quality Defect Rate (PPM), Price Competitiveness, and SLA Responsiveness.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Supplier evaluation scorecards, periodic risk ratings, and tiering categories.
- **Upstream Feeds:** Consumes PO delivery dates (M08) and QC inspection rejects (M39).

## 3. Data Contracts & APIs
- **Database Tables:** `supplier_scorecards`, `supplier_kpi_logs`, `supplier_evaluations`.
- **APIs:**
  - `GET /api/srm/scorecards` — List scorecards and vendor tierings.
  - `POST /api/srm/evaluate` — Run monthly scoring evaluation batch.
  - `POST /api/srm/reports/print` — Formatted supplier report printout.

## 4. UI/UX Standards
- Radar chart visualization for multi-dimensional KPI comparison.
- Score values in `font-mono` (0–100 score).

## 5. Feature Upgrade Readiness Checklist
- [ ] Add automated vendor tier downgrading when defect rate exceeds threshold.
- [ ] Export official supplier annual review dossier in PDF format.
