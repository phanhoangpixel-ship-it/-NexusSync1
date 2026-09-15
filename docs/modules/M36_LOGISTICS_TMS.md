# M36 — Logistics & Fleet (TMS)

**Module ID:** `M36`  
**Module Name:** Logistics, Transportation & Fleet Management (TMS)  
**Business Group:** `03. WAREHOUSE & LOGISTICS`  
**Workspace ID:** `WS17_LOGISTICS` | **Primary Route:** `/logistics`  
**Mounted UI Component:** `src/pages/Logistics.tsx`  
**Primary API Endpoint:** `GET /api/logistics/shipments`

---

## 1. Executive Summary & Purpose
M36 is the Transportation Management System (TMS) managing vehicle fleets, driver assignments, delivery run dispatches, freight rates, route stops, and Proof of Delivery (POD) confirmations.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Fleet vehicles, driver rosters, shipment routes, and delivery status milestones.
- **Commercial Feeds:** Consumes confirmed sales orders (M13) and inter-branch transfers (M21).

## 3. Data Contracts & APIs
- **Database Tables:** `shipments`, `shipment_stops`, `fleet_vehicles`, `drivers`.
- **APIs:**
  - `GET /api/logistics/shipments` — Active transport runs and delivery manifests.
  - `POST /api/logistics/shipments/dispatch` — Dispatch delivery truck.
  - `POST /api/logistics/shipments/:id/pod` — Confirm electronic Proof of Delivery.

## 4. UI/UX Standards
- Dispatch board with vehicle load capacity bars (volume and weight utilization).
- Tracking numbers, license plates, and driver phone numbers in `font-mono`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement mobile driver signature capture on delivery confirmation.
- [ ] Add GPS real-time route tracking and vehicle telematics integration.
