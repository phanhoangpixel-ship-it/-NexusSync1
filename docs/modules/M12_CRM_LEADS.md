# M12 — CRM Leads & Opportunities

**Module ID:** `M12`  
**Module Name:** Customer Relationship Management (CRM)  
**Business Group:** `01. COMMERCIAL & SALES`  
**Workspace ID:** `WS02_CRM` | **Primary Route:** `/crm`  
**Mounted UI Component:** `src/pages/CRM.tsx`  
**Primary API Endpoint:** `GET /api/crm/leads`

---

## 1. Executive Summary & Purpose
M12 drives commercial revenue generation by managing inbound leads, sales pipeline stages (New → Contacted → Qualified → Proposal → Won/Lost), deal sizes, and salesperson activities.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Lead qualification status, deal probability, and sales interaction history.
- **Conversion Invariant:** Won deals automatically create or update customer master records in M07 and draft sales quotations in M13.

## 3. Data Contracts & APIs
- **Database Tables:** `crm_leads`, `crm_deals`, `crm_activities`.
- **APIs:**
  - `GET /api/crm/leads` — Lead list and deal pipeline.
  - `POST /api/crm/leads` — Create lead.
  - `PUT /api/crm/leads/:id/stage` — Move lead through pipeline stages.

## 4. UI/UX Standards
- Drag-and-drop Kanban board view for visual deal stage transitions.
- Deal amounts and conversion probabilities in `font-mono tabular-nums`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement automated lead scoring based on industry and deal value.
- [ ] Add calendar integration for scheduled customer demo calls.
