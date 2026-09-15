# M10 — Strategic Sourcing & RFQ

**Module ID:** `M10`  
**Module Name:** Strategic Sourcing, RFP & RFQ Bidding  
**Business Group:** `02. PROCUREMENT & SRM`  
**Workspace ID:** `WS24_SOURCING` | **Primary Route:** `/strategic-sourcing`  
**Mounted UI Component:** `src/pages/StrategicSourcing.tsx`  
**Primary API Endpoint:** `GET /api/sourcing/rfqs`

---

## 1. Executive Summary & Purpose
M10 centralizes competitive bidding, Request for Quotation (RFQ), supplier proposal analysis, price negotiations, and contract awarding.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** RFQ packages, supplier bids, bid evaluation matrix, and award decisions.
- **Downstream Integration:** Awarded bids convert seamlessly into POs in M08.

## 3. Data Contracts & APIs
- **Database Tables:** `sourcing_rfqs`, `rfq_items`, `supplier_bids`, `bid_evaluations`.
- **APIs:**
  - `GET /api/sourcing/rfqs` — List RFQs with status filtering.
  - `POST /api/sourcing/rfqs` — Create bidding event.
  - `POST /api/sourcing/rfqs/:id/award` — Awards bid and generates PO in M08.

## 4. UI/UX Standards
- Side-by-side bid comparison matrix with lowest bidder and best score highlights.
- Pricing lines in `font-mono tabular-nums`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Add multi-criteria scoring algorithm (Quality 40%, Price 40%, Delivery 20%).
- [ ] Add automated supplier notification email dispatch upon award.
