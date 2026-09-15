# M27 — EAM Asset Maintenance

**Module ID:** `M27`  
**Module Name:** Enterprise Asset Management (EAM) & Maintenance  
**Business Group:** `04. MANUFACTURING & OPERATIONS`  
**Workspace ID:** `WS15_EAM` | **Primary Route:** `/eam`  
**Mounted UI Component:** `src/pages/EAM.tsx`  
**Primary API Endpoint:** `GET /api/eam/assets`

---

## 1. Executive Summary & Purpose
M27 manages the health and maintenance of plant machinery, production lines, and facilities. It oversees Preventive Maintenance (PM) schedules, corrective breakdown work orders, spare part consumption, and Mean Time Between Failures (MTBF).

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Asset master registry, maintenance work orders, technician logs, and MTBF/MTTR metrics.
- **Inventory Integration:** Spare parts consumed during maintenance are deducted via `InventoryService.postTransaction()` (M17).

## 3. Data Contracts & APIs
- **Database Tables:** `assets`, `maintenance_schedules`, `maintenance_work_orders`, `asset_spare_parts`.
- **APIs:**
  - `GET /api/eam/assets` — Asset register with health status.
  - `POST /api/eam/work-orders` — Create corrective or preventive work order.
  - `POST /api/eam/work-orders/:id/complete` — Log labor hours and spare parts used.

## 4. UI/UX Standards
- Asset health gauge (Green = Optimal, Amber = Maintenance Due, Rose = Critical Downtime).
- Meter readings, hours run, and spare part costs in `font-mono`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement QR code scanning on machine tags to pull up maintenance history on mobile.
- [ ] Add predictive maintenance alerting based on vibration and temperature sensors.
