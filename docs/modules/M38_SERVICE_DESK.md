# M38 — Service Desk & IT Ticketing

**Module ID:** `M38`  
**Module Name:** Service Desk & Internal Issue Ticketing  
**Business Group:** `06. GOVERNANCE & SYSTEM`  
**Workspace ID:** `WS26_SERVICEDESK` | **Primary Route:** `/issue`  
**Mounted UI Component:** `src/pages/ServiceDesk.tsx`  
**Primary API Endpoint:** `GET /api/service-desk/tickets`

---

## 1. Executive Summary & Purpose
M38 manages internal operational support requests, IT troubleshooting, system bug tickets, and SLA escalation policies across all business departments.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Incident ticket registry, priority assignments (P1–P4), SLA timers, and resolution logs.

## 3. Data Contracts & APIs
- **Database Tables:** `support_tickets`, `ticket_comments`, `ticket_sla_policies`.
- **APIs:**
  - `GET /api/service-desk/tickets` — Query tickets with status/priority filters.
  - `POST /api/service-desk/tickets` — Create support ticket.
  - `POST /api/service-desk/tickets/:id/resolve` — Mark ticket resolved with root cause summary.

## 4. UI/UX Standards
- Ticket priority badges (P1 Critical = rose, P2 High = amber, P3 Normal = blue, P4 Low = slate).
- Real-time SLA response timer countdown in `font-mono`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement automated escalation webhook alerting to Slack/Telegram on P1 SLA breach.
- [ ] Add internal knowledge base article suggestion based on ticket title keywords.
