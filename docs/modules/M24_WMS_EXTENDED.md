# M24 — WMS Extended (Wave Picking & LPN)

**Module ID:** `M24`  
**Module Name:** WMS Extended (Wave, Zone Picking & LPN Containers)  
**Business Group:** `03. WAREHOUSE & LOGISTICS`  
**Workspace ID:** `WS12_WMS_EXT` | **Primary Route:** `/wms-extended`  
**Mounted UI Component:** `src/pages/WMSExtended.tsx`  
**Primary API Endpoint:** `GET /api/wms-extended/waves`

---

## 1. Executive Summary & Purpose
M24 provides advanced tier-1 logistics warehouse capabilities: Wave picking grouping, zone picking, directed putaway algorithms, and License Plate Number (LPN) pallet tracking.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Wave pick batches, pallet LPN containers, and pick task routing.
- **Inventory Integration:** Physical movements execute via `InventoryService.postTransaction()` (M17).

## 3. Data Contracts & APIs
- **Database Tables:** `wms_waves`, `wms_wave_items`, `wms_lpn_pallets`.
- **APIs:**
  - `GET /api/wms-extended/waves` — Wave pick batches.
  - `POST /api/wms-extended/waves/generate` — Generate wave picking batch from open sales orders.
  - `POST /api/wms-extended/lpn/pack` — Pack items into LPN container.

## 4. UI/UX Standards
- Wave progress bar with pick completion percentage.
- LPN barcodes and bin coordinates in `font-mono`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Add traveling salesman pick-path optimization algorithm.
- [ ] Support automated cross-docking dispatch directly from receiving docks.
