# M01 — Workspace Hub & Global Orchestration

**Module ID:** `M01`  
**Module Name:** Workspace Hub & Global Orchestration  
**Business Group:** `00. CORE HUB`  
**Workspace ID:** `WS01_HUB` | **Primary Route:** `/workspace`  
**Mounted UI Component:** `src/pages/WorkspaceHub.tsx`  
**Primary API Endpoint:** `GET /api/workspace/summary`

---

## 1. Executive Summary & Purpose
Workspace Hub is the **Enterprise Application Shell (L1–L3)** and central entry orchestrator of NexusSync ERP. It provides role-based operational dispatching, real-time SLA WorkQueues, KPI sparkline summaries, and high-velocity discovery across all 31 enterprise workspaces.

## 2. Domain Authority Boundaries
- **Strict Non-Authority:** Workspace Hub DOES NOT mutate inventory balances, execute costing calculations, generate accounting entries, or execute workflow mutations directly.
- **Authoritative For:** User navigation state, WorkQueue item aggregation, and layout presentation.

## 3. Data Contracts & APIs
- `GET /api/workspace/summary` — Aggregates pending approval counts, overdue tasks, and operational metrics.
- `GET /api/orchestration/workspaces` — Returns active workspace definitions based on current user role.
- `GET /api/orchestration/groups` — Returns functional business groups.

## 4. UI/UX Standards & Enterprise Requirements
- **Session Tabs & L2 Switcher:** Supports quick-switching across all business domains without full page reloads.
- **WorkQueue Priority Cards:** Highlights pending tasks with SLA countdowns (`bg-rose-50 text-rose-700` for breached SLA).
- **KPI Metrics:** Rendered in `font-mono tabular-nums`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Connect WorkQueue action buttons to deep-link direct drawer actions in target modules.
- [ ] Add customizable widget ordering per user preference.
- [ ] Maintain strict read-only aggregation via `WorkspaceAggregationService`.
