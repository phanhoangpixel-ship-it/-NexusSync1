# M18 — Warehouse Structure & Bin/Rack

**Module ID:** `M18`  
**Module Name:** Warehouse Management & Bin/Rack Locations  
**Business Group:** `03. WAREHOUSE & LOGISTICS`  
**Workspace ID:** `WS06_WAREHOUSE` | **Primary Route:** `/warehouse`  
**Mounted UI Component:** `src/pages/WarehouseManagement.tsx`  
**Primary API Endpoint:** `GET /api/warehouses`

---

## 1. Executive Summary & Purpose
M18 defines the physical storage topology of the enterprise: Warehouses, Zones (Cold storage, Bulk, Picking, Quarantine), Aisles, Racks, Shelves, and individual Bins with volume and weight constraints.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Warehouse entities, zone configurations, and bin coordinate structures.

## 3. Data Contracts & APIs
- **Database Tables:** `warehouses`, `warehouse_zones`, `warehouse_bins`.
- **APIs:**
  - `GET /api/warehouses` — Warehouse directory.
  - `POST /api/warehouses` — Create warehouse facility.
  - `GET /api/warehouses/:id/bins` — Bins tree for specific warehouse.

## 4. UI/UX Standards
- Interactive hierarchical tree / grid view showing capacity utilization percentages.
- Bin barcodes and coordinates formatted in `font-mono`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Add 2D/3D warehouse visual floor plan heat map.
- [ ] Add dynamic bin replenishment triggers from bulk storage to pick faces.
