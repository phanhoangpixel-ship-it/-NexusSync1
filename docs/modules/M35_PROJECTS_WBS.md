# M35 — Projects & Job Costing (WBS)

**Module ID:** `M35`  
**Module Name:** Projects & Work Breakdown Structure (WBS)  
**Business Group:** `04. MANUFACTURING & OPERATIONS`  
**Workspace ID:** `WS16_PROJECTS` | **Primary Route:** `/projects`  
**Mounted UI Component:** `src/pages/Projects.tsx` (`src/modules/projects/M35ProjectsWBSWorkspace.tsx`)  
**Status:** **CERTIFIED & ACTIVE (100% Comprehensive)**

---

## 1. Executive Summary & Purpose
M35 delivers enterprise-grade project portfolio management, Work Breakdown Structure (WBS) scheduling, resource & capacity planning, job costing with 5-component breakdown, ISO 21508 Earned Value Management (EVM), milestone billing automation (M31 Invoicing & M30 General Ledger), and Percentage of Completion (POC) revenue recognition compliant with VAS 15 & IFRS 15.

## 2. Domain Authority Boundaries & Single-Writer Integrations
- **Exclusive Authority:** Project definitions, WBS hierarchy, Milestones, Project Resources, Timesheets, and Job Cost Ledger.
- **Single-Writer Inventory (M17):** `postMaterialIssueToProject()` strictly delegates to `InventoryService.postTransaction('GOODS_ISSUE')`.
- **Single-Writer Costing (M42):** Unit cost resolution via `costingEngine.resolveUnitCost()`.
- **Single-Writer Invoicing (M31):** Milestone & progress billing delegates to `invoiceService.createInvoice()` with automated VAT calculation.
- **Single-Writer General Ledger (M30):** Automatic double-entry journal postings (WIP TK 154 / TK 152, 621, 622, 623, 627, and TK 131 / TK 511, 3331).
- **Human Resources (M28):** Employee standard & overtime rates for labor cost calculations.
- **Asset Maintenance (M27):** Equipment rental & utilization costing.
- **Procurement (M08/M10):** Subcontractor purchase orders & commitments.

## 3. Data Contracts & Database Entities
- `projects` — Master project records, budget baselines, revenue, actual costs, billed amounts, and EVM metrics.
- `wbs_nodes` / `project_wbs` — Multi-tier hierarchical WBS task tree with predecessors, progress %, and budget allocations.
- `project_milestones` — Contractual milestones, acceptance criteria, and billing trigger points.
- `project_resources` — Labor, equipment, and subcontractor resource directory with capacity hours and standard rates.
- `project_timesheets` — Daily time tracking logs with task assignments, hours, and calculated labor cost.
- `project_cost_ledger` / `project_costs` — Unified granular cost journal categorized by 5 cost types.
- `project_budget_versions` — Audit baseline versions for budget changes and scope management.
- `project_evm_snapshots` — Historical snapshots for EVM trend analysis.

## 4. API Catalog
- `GET    /api/projects` — Fetch project portfolio with WBS nodes, progress %, and financial indicators.
- `POST   /api/projects` — Create project charter with PM, branch, budget, and contract value.
- `GET    /api/projects/:id` — Fetch complete project dossier with WBS, milestones, and costs.
- `POST   /api/projects/:id/wbs` — Add / update WBS work package with predecessor dependencies and budget.
- `PUT    /api/projects/:id/progress` — Update project progress % and trigger instant ISO 21508 EVM recalculation.
- `POST   /api/projects/resources` — Register resources (People, Equipment, Subcontractor) with hourly cost rates.
- `POST   /api/projects/:id/timesheets` — Log daily work hours, post to projectCostLedger & debit TK 622 / credit TK 334.
- `POST   /api/projects/:id/material-issue` — Issue warehouse materials to WBS task via M17 InventoryService & M42 Costing.
- `GET    /api/projects/:id/job-cost` — Aggregated 5-component Job Cost summary & unified cost ledger.
- `GET    /api/projects/evm` — Portfolio-wide ISO 21508 EVM summary (BAC, PV, EV, AC, CPI, SPI, EAC, VAC).
- `POST   /api/projects/:id/billing` — Issue milestone/progress invoice via M31 & post to M30 General Ledger (TK 131 / 511, 3331).
- `GET    /api/projects/:id/margin` — Project margin analytics & VAS 15 / IFRS 15 POC revenue recognition.

## 5. UI/UX Standards & Enterprise Tabs
- **Tab 1: WBS Tree & Hierarchy (`ProjectWbsTreeTab.tsx`)** — Multi-level WBS tree with status badges, assignee, progress bars, and budget vs. actual cost.
- **Tab 2: Gantt Schedule & Milestones (`ProjectScheduleGanttTab.tsx`)** — Interactive Gantt timeline, dependency chains, critical path indicator, and milestone sign-off.
- **Tab 3: Resources & Capacity (`ProjectResourcesTab.tsx`)** — Resource directory with capacity utilization %, hourly rates, and resource registration modal.
- **Tab 4: Timesheets & Labor Log (`ProjectTimesheetsTab.tsx`)** — Daily time logging modal, WBS task linking, automated labor cost calculation, and timesheet log table.
- **Tab 5: Job Costing & Billing (`ProjectJobCostingTab.tsx`)** — 5-component breakdown, project cost ledger, Material Issue Modal (M17 WMS), Milestone Billing Modal (M31 Invoicing), and POC Revenue engine.
- **Tab 6: EVM ISO 21508 Engine (`ProjectEvmEngineTab.tsx`)** — Project-level & Portfolio-level EVM dashboard with CPI, SPI, EAC, VAC metrics, and status gauges.
- **Tab 7: Risk & Change Log (`ProjectRiskChangeTab.tsx`)** — Risk matrix (High/Medium/Low), mitigation plans, and budget revision baseline history.

## 6. Verification & Upgrade Checklist
- [x] Implement milestone billing triggers creating VAT invoices via M31 Invoicing.
- [x] Add Earned Value Management (EVM) metrics: CPI, SPI, EAC, VAC according to ISO 21508.
- [x] Implement Single-Writer integration for Material Issues via `InventoryService.postTransaction()`.
- [x] Implement Timesheet logging with standard labor rates and unified `projectCostLedger`.
- [x] Implement Percentage of Completion (POC) Revenue Recognition (VAS 15 / IFRS 15).
- [x] Full UI/UX compliance with Rule #19 (ConfirmDialog, WCAG AA, `font-mono tabular-nums`) and Rule #20.
- [x] Complete end-to-end API and database integration tests passed.

