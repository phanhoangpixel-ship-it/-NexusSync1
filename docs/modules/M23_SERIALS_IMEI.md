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

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement camera barcode/OCR scanner for batch serial ingestion.
- [ ] Link warranty verification API with M15 (RMA) for instant warranty claims lookup.
