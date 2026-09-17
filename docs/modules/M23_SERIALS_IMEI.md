# M23 — Serials & IMEI Traceability

**Module ID:** `M23`  
**Module Name:** Serial Number & IMEI Tracking  
**Business Group:** `03. WAREHOUSE & LOGISTICS`  
**Workspace ID:** `WS11_SERIALS` | **Primary Route:** `/serials`  
**Mounted UI Component:** `src/pages/Serials.tsx`  
**Primary API Endpoint:** `GET /api/serials`

---

## 1. Executive Summary & Purpose
M23 provides item-level individual serialized tracking for high-value electronics, machinery, and regulated assets. It tracks lifetime genealogy: Goods Receipt → Warehouse Bin → Customer Delivery → Warranty & RMA.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Unique Serial/IMEI lifecycle status, warranty start/end dates, and ownership history.

## 3. Data Contracts & APIs
- **Database Tables:** `product_serials`, `serial_history`.
- **APIs:**
  - `GET /api/serials` — Query serial numbers with status/warehouse filter.
  - `POST /api/serials/batch` — Bulk upload serial numbers on PO receiving.
  - `GET /api/serials/:id/history` — Full audit trail of movement for specific unit.

## 4. UI/UX Standards
- Serial code and IMEI search bar with instant validation.
- Serial codes in `font-mono` with single-click copy capability.

## 5. Feature Upgrade Readiness Checklist & Governance Seal
- [x] Implement backend API endpoints (`GET /api/serials`, `POST /api/serials`, `GET /api/serials/:id/history`, `POST /api/serials/:id/actions`).
- [x] Full Device Lifecycle Trace & 360° Serial Timeline Inspector.
- [x] Single-Writer domain enforcement (`SerialEngine` validation for uniqueness, warehouse, location, and status transition).
- [x] WCAG AA compliance and Rule #19 `ConfirmDialog` integration (zero `window.alert`/`window.confirm`).
- [x] Cross-module linkage with M08 (Purchase), M13/M16 (Sales/POS), M17 (Inventory Core), M15 (RMA).
