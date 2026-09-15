# M22 — Lots & Batches (FEFO/FIFO)

**Module ID:** `M22`  
**Module Name:** Lots, Batches & Shelf Life Management  
**Business Group:** `03. WAREHOUSE & LOGISTICS`  
**Workspace ID:** `WS10_LOTS` | **Primary Route:** `/lots`  
**Mounted UI Component:** `src/pages/LotsBatches.tsx`  
**Primary API Endpoint:** `GET /api/lots`

---

## 1. Executive Summary & Purpose
M22 tracks manufacturing batch codes, supplier lot numbers, production dates, expiry dates, and shelf-life policies. It enforces First-Expired, First-Out (FEFO) and First-In, First-Out (FIFO) picking rules.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Lot status (Active, Quarantined, Expired), shelf-life calculation, and batch genealogy.

## 3. Data Contracts & APIs
- **Database Tables:** `product_lots`, `lot_movements`, `lot_quarantine_records`.
- **APIs:**
  - `GET /api/lots` — Lot master directory with expiry filters.
  - `POST /api/lots` — Register new lot.
  - `PUT /api/lots/:id/quarantine` — Quarantine entire lot due to recall.

## 4. UI/UX Standards
- Expiry timeline countdown pills (Green = >90 days, Amber = <30 days, Rose = Expired).
- Lot code and dates in `font-mono`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement automated lot recall traceability tree (forward to customers, backward to suppliers).
- [ ] Add FEFO suggestion engine for warehouse picking slips.
