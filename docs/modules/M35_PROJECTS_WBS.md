# M35 — Projects & Job Costing (WBS)

**Module ID:** `M35`  
**Module Name:** Projects & Work Breakdown Structure (WBS)  
**Business Group:** `04. MANUFACTURING & OPERATIONS`  
**Workspace ID:** `WS16_PROJECTS` | **Primary Route:** `/projects`  
**Mounted UI Component:** `src/pages/Projects.tsx`  
**Primary API Endpoint:** `GET /api/projects`

---

## 1. Executive Summary & Purpose
M35 provides project management and job costing for engineering, turnkey installations, and R&D tasks: Work Breakdown Structure (WBS), milestone tracking, labor timesheets, and project budget vs. actual cost analysis.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Project definitions, WBS task hierarchy, and project milestones.
- **Costing Integration:** Material allocations link to M17/M42, and labor hours link to M28.

## 3. Data Contracts & APIs
- **Database Tables:** `projects`, `wbs_tasks`, `project_timesheets`, `project_budgets`.
- **APIs:**
  - `GET /api/projects` — Project portfolio directory.
  - `POST /api/projects` — Create new project.
  - `GET /api/projects/:id/wbs` — Hierarchical WBS tree with budget consumption.

## 4. UI/UX Standards
- Interactive Gantt chart with task dependencies and milestone indicators.
- Budget variance (Budget vs. Actual vs. Committed) in `font-mono tabular-nums`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement milestone billing triggers creating draft invoices in M31.
- [ ] Add Earned Value Management (EVM) metrics: CPI and SPI calculation.
