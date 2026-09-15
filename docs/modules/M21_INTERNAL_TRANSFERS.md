# M21 — Internal Transfers & Branch Custody

**Module ID:** `M21`  
**Module Name:** Internal Transfers & In-Transit Custody  
**Business Group:** `03. WAREHOUSE & LOGISTICS`  
**Workspace ID:** `WS09_TRANSFER` | **Primary Route:** `/transfer`  
**Mounted UI Component:** `src/pages/Transfer.tsx`  
**Primary API Endpoint:** `GET /api/transfers`

---

## 1. Executive Summary & Purpose
M21 manages inter-warehouse and inter-branch transfers with two-step validation: Ship Out (Source warehouse stock is deducted and moved to In-Transit) and Receive (Destination warehouse verifies and accepts goods).

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Transfer orders, shipping manifests, and in-transit tracking.
- **Inventory Invariant:** Stock deductions and receipts MUST be executed atomically via `InventoryService.postTransaction()` (M17).

## 3. Data Contracts & APIs
- **Database Tables:** `stock_transfers`, `stock_transfer_items`.
- **APIs:**
  - `GET /api/transfers` — Query transfer orders with status filters.
  - `POST /api/transfers` — Create transfer order.
  - `POST /api/transfers/:id/ship` — Ship out goods to In-Transit.
  - `POST /api/transfers/:id/receive` — Accept goods at destination.

## 4. UI/UX Standards
- Two-step dispatch and receipt visual status tracker.
- Discrepancy warnings if received quantity is less than shipped quantity.

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement transfer discrepancy claim generation linking directly to M20.
- [ ] Integrate carrier assignment linking with M36 (TMS).
