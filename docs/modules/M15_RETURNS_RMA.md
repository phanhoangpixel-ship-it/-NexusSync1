# M15 — Returns & RMA Dispositions

**Module ID:** `M15`  
**Module Name:** Returns & RMA Management  
**Business Group:** `01. COMMERCIAL & SALES`  
**Workspace ID:** `WS22_RMA` | **Primary Route:** `/returns`  
**Mounted UI Component:** `src/pages/Returns.tsx`  
**Primary API Endpoint:** `GET /api/returns`

---

## 1. Executive Summary & Purpose
M15 governs customer return authorizations (RMA), return-to-vendor (RTV) shipments, warranty claims, defective product inspections, restocking, and credit memo generation.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** RMA authorizations, inspection disposition decisions (Restock, Scrap, Rework, Replace).
- **Inventory Handover:** Restocked items increment warehouse inventory via `InventoryService.postTransaction()` (M17).
- **Billing Handover:** Triggers Credit Memos in M31 and commission clawbacks in M14.

## 3. Data Contracts & APIs
- **Database Tables:** `return_orders`, `return_order_items`, `rma_dispositions`.
- **APIs:**
  - `GET /api/returns` — RMA registry with status filters.
  - `POST /api/returns` — Authorize new return.
  - `POST /api/returns/:id/receive` — Receive returned goods into quarantine.
  - `POST /api/returns/:id/disposition` — Disposition goods (Restock or Scrap).

## 4. UI/UX Standards
- Inspection disposition action dialogs with reason code requirements.
- Status badges: Authorized = amber, Received = blue, Inspected = purple, Completed = emerald.

## 5. Feature Upgrade Readiness Checklist
- [ ] Add barcode scan return receiving for high-speed counter returns.
- [ ] Support customer self-service return request generation.
