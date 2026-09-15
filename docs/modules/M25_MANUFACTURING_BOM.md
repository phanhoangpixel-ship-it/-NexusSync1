# M25 — Manufacturing Execution & BOM (MES)

**Module ID:** `M25`  
**Module Name:** Manufacturing & Bill of Materials (MES)  
**Business Group:** `04. MANUFACTURING & OPERATIONS`  
**Workspace ID:** `WS13_MES` | **Primary Route:** `/manufacturing`  
**Mounted UI Component:** `src/pages/Manufacturing.tsx`  
**Primary API Endpoint:** `GET /api/manufacturing/orders`

---

## 1. Executive Summary & Purpose
M25 orchestrates shop-floor production: Multi-level Bill of Materials (BOM), Manufacturing Work Orders (MO), routing operations, work center capacities, raw material issuance, and finished goods backflushing.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Multi-level BOM structures, work center runtimes, and MO execution stages.
- **Inventory Handover:** Raw material staging and finished goods receipt MUST be posted through `InventoryService.postTransaction()` (M17).
- **Costing Handover:** Production actual costs (materials, direct labor, overhead) feed into `CostingService` (M42).

## 3. Data Contracts & Schema
- **Database Tables:** `boms`, `bom_items`, `manufacturing_orders`, `mo_operations`, `work_centers`.
- **APIs:**
  - `GET /api/manufacturing/orders` — MO registry.
  - `POST /api/manufacturing/orders` — Create MO.
  - `POST /api/manufacturing/orders/:id/issue` — Issue raw materials to shop floor.
  - `POST /api/manufacturing/orders/:id/complete` — Complete production and book finished items.

## 4. UI/UX Standards
- Interactive multi-level BOM explosion tree with component scrap percentages.
- Work Order Gantt / timeline status view with operator assignments.

## 5. Feature Upgrade Readiness Checklist
- [ ] Add real-time machine telemetry IoT data ingest hooks for downtime logging.
- [ ] Implement scrap variance approval workflow when actual scrap exceeds BOM tolerance.
