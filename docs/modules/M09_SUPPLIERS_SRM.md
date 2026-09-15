# M09 — Suppliers SRM Profiles & Portals

**Module ID:** `M09`  
**Module Name:** Suppliers Master & SRM Profiles  
**Business Group:** `02. PROCUREMENT & SRM`  
**Workspace ID:** `WS04_PURCHASE` | **Primary Route:** `/suppliers`  
**Mounted UI Component:** `src/pages/Suppliers.tsx`  
**Primary API Endpoint:** `GET /api/suppliers`

---

## 1. Executive Summary & Purpose
M09 manages vendor master records, supplier banking details, commercial payment terms, compliance certifications, and vendor qualification lifecycles.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Sole source of truth for vendor legal details, tax IDs, and agreed payment terms.

## 3. Data Contracts & APIs
- **Database Tables:** `suppliers`, `supplier_contacts`, `supplier_bank_accounts`.
- **APIs:**
  - `GET /api/suppliers` — Supplier directory with status filters.
  - `POST /api/suppliers` — Onboard new supplier.
  - `PUT /api/suppliers/:id` — Update supplier details and banking information.

## 4. UI/UX Standards
- Tax code and bank account numbers in `font-mono`.
- Vendor qualification badges (Qualified = emerald, Under Review = amber, Blacklisted = rose).

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement supplier self-service onboarding portal.
- [ ] Add ISO/HACCP certificate expiration notifications linking to M16 alerts.
