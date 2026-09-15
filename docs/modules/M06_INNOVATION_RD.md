# M06 — Innovation R&D & Formulation

**Module ID:** `M06`  
**Module Name:** Innovation R&D & Formula Prototyping  
**Business Group:** `04. MANUFACTURING & OPERATIONS`  
**Workspace ID:** `WS05_INVENTORY` | **Primary Route:** `/rd`  
**Mounted UI Component:** `src/pages/RDManagement.tsx`  
**Primary API Endpoint:** `GET /api/rd/projects`

---

## 1. Executive Summary & Purpose
M06 governs new product research, experimental formulations, prototype testing, and trial production runs before items are transitioned into the commercial Item Master (M07) and BOM (M25).

## 2. Domain Authority Boundaries
- **Exclusive Authority:** R&D formula versions, laboratory sample parameters, and trial pass/fail evaluations.
- **Integration Invariant:** Approved R&D items can be promoted directly to `products` (M07) with automated creation of standard BOM (M25).

## 3. Data Contracts & APIs
- **Database Tables:** `rd_projects`, `rd_formulas`, `rd_trial_runs`, `rd_test_metrics`.
- **APIs:**
  - `GET /api/rd/projects` — List R&D development projects.
  - `POST /api/rd/projects` — Create project.
  - `POST /api/rd/formulas/:id/promote` — Promotes experimental formula to production BOM.

## 4. UI/UX Standards
- Stage-gate pipeline (Concept → Lab Test → Pilot Batch → Approved).
- Test results table with numeric tolerance limits in `font-mono`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement sample material requisition linking to M17 with trial expense booking.
- [ ] Add version comparison tool for formula ingredient ratios.
