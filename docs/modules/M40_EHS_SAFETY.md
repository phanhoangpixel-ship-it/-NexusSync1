# M40 — EHS Safety & Environmental Management

**Module ID:** `M40`  
**Module Name:** Environmental, Health & Safety (EHS)  
**Business Group:** `06. GOVERNANCE & SYSTEM`  
**Workspace ID:** `WS29_EHS` | **Primary Route:** `/ehs`  
**Mounted UI Component:** `src/pages/EHS.tsx`  
**Primary API Endpoint:** `GET /api/ehs/incidents`

---

## 1. Executive Summary & Purpose
M40 oversees workplace safety, Personal Protective Equipment (PPE) compliance, workplace incident reporting, hazardous waste disposal, environmental emissions, and fire prevention (PCCC) audits.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Workplace safety incident investigations, risk assessments, and environmental compliance certifications.

## 3. Data Contracts & APIs
- **Database Tables:** `ehs_incidents`, `ehs_safety_audits`, `ehs_waste_logs`.
- **APIs:**
  - `GET /api/ehs/incidents` — Safety incident registry.
  - `POST /api/ehs/incidents` — Report safety near-miss or accident.
  - `POST /api/ehs/audits` — Submit periodic safety inspection checklist.

## 4. UI/UX Standards
- Incident severity badges (Critical = rose, Moderate = amber, Minor = blue, Near Miss = slate).
- Days without Lost Time Injury (LTI) counter prominently displayed in `font-mono`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Add hazardous material Safety Data Sheet (SDS) quick-lookup library.
- [ ] Implement automated reminder schedule for fire extinguisher and safety equipment inspections.
