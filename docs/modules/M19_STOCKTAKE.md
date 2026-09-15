# M19 — Stocktake / Kiểm Kê

**Module ID:** `M19`  
**Module Name:** Stocktake & Physical Inventory Auditing  
**Business Group:** `03. WAREHOUSE & LOGISTICS`  
**Workspace ID:** `WS07_STOCKTAKE` | **Primary Route:** `/stocktake`  
**Mounted UI Component:** `src/pages/Stocktake.tsx`  
**Primary API Endpoint:** `GET /api/stocktake/sessions`

---

## 1. Executive Summary & Purpose
M19 executes physical cycle counts, wall-to-wall annual counts, and blind counts. It records counter entries, calculates variances between system book stock and physical count, and prepares adjustment proposals.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Stocktake sessions, count sheets, and variance calculation.
- **Write Authority Handover:** Stock adjustment execution MUST be finalized through M20 (Stock Adjustment) and `InventoryService.postTransaction()` (M17).

## 3. Data Contracts & APIs
- **Database Tables:** `stocktake_sessions`, `stocktake_lines`, `stocktake_counts`.
- **APIs:**
  - `GET /api/stocktake/sessions` — Active and historical count sessions.
  - `POST /api/stocktake/sessions` — Initialize count sheet.
  - `POST /api/stocktake/lines/count` — Record counted quantity.
  - `POST /api/stocktake/sessions/:id/reconcile` — Propose adjustment batch.

## 4. UI/UX Standards
- Blind count mode hides system quantity to avoid counter bias.
- Positive/negative discrepancy highlighting (`text-emerald-600` for surplus, `text-rose-600` for deficit).

## 5. Feature Upgrade Readiness Checklist
- [ ] Support mobile barcode scanner count input with auditory feedback.
- [ ] Add multi-counter variance resolution workflow for disputed counts.
