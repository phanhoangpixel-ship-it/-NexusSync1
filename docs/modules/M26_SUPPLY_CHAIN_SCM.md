# M26 — Supply Chain SCM & MRP Netting

**Module ID:** `M26`  
**Module Name:** Supply Chain Management (SCM) & Material Requirements Planning (MRP)  
**Business Group:** `04. MANUFACTURING & OPERATIONS`  
**Workspace ID:** `WS14_SCM` | **Primary Route:** `/supply-chain`  
**Mounted UI Component:** `src/pages/SupplyChain.tsx`  
**Primary API Endpoint:** `GET /api/supply-chain/mrp`

---

## 1. Executive Summary & Purpose
M26 solves the balance between market demand and operational supply. It runs Master Production Schedule (MPS) and Material Requirements Planning (MRP) netting calculations, identifying material shortages and proposing purchase or production orders.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Demand forecast models, MRP calculation runs, and purchase/production planned orders.
- **Downstream Releases:** Releasing MRP recommendations converts them into POs in M08 or MOs in M25.

## 3. Data Contracts & APIs
- **Database Tables:** `mrp_runs`, `mrp_recommendations`, `demand_forecasts`.
- **APIs:**
  - `GET /api/supply-chain/mrp` — MRP calculation results.
  - `POST /api/supply-chain/mrp/run` — Trigger MRP regeneration batch.
  - `POST /api/supply-chain/mrp/release` — Convert recommendation to PO or MO.

## 4. UI/UX Standards
- Supply vs. Demand balance timeline chart with stockout risk warnings.
- Required quantity, lead time, and planned release dates in `font-mono`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Add statistical time-series forecasting (Holt-Winters / Exponential Smoothing).
- [ ] Implement multi-echelon safety stock optimization across regional distribution centers.
