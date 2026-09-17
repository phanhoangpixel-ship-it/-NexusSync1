# M01 — Workspace Hub & Global Orchestration
## Enterprise Architecture & Module Specification

**Module ID:** `M01`  
**Module Name:** Workspace Hub & Global Orchestration (Bàn Điều Hành Doanh Nghiệp & Điều Phối Toàn Cục)  
**Business Group:** `00. CORE HUB`  
**Workspace ID:** `WS01_HUB` | **Primary Route:** `/workspace`  
**Mounted UI Component:** `src/modules/admin/m01-workspace-hub/components/WorkspaceHub.tsx`  
**Sub-Components:** `DashboardStats.tsx`, `GenericModuleWorkspace.tsx`, `UnifiedActivityTaskDrawer.tsx`  
**Primary API Endpoints:**  
- `GET  /api/workspace/summary` (Cross-module metrics & operational summary)  
- `GET  /api/workspace/work-items` (RBAC-filtered WorkQueue SLA task list)  
- `GET  /api/workspace/entity-preview` (Deep-link preview metadata)  
- `GET  /api/workspace/process-chains` (Value Stream & business process chains)  
- `GET  /api/workspace/search` (Cross-cutting Omnibar global search index)  
- `POST /api/workspace/work-items/:id/action` (Quick-action dispatcher delegating to authoritative domain services)  
**Status:** `CERTIFIED & FROZEN BASELINE` (Compliant with Rule #01–#20)

---

## 1. Executive Summary & Purpose

**M01 (Workspace Hub)** serves as the **Enterprise Application Shell (L0–L4)** and central command orchestrator ("Cockpit & Command Center") for NexusSync ERP. It provides:
1. **Unified Enterprise Cockpit:** Single-pane-of-glass overview across all 41 ERP modules organized into 6 core value stream groups and 31 operational workspaces.
2. **WorkQueue SLA Orchestration Engine:** Real-time aggregation of pending tasks, cross-module document approvals (PO M08, Stock Adjustments M20, Stocktake M19, Invoices M31, Service Desk M38), with dynamic countdowns and urgency-driven visual escalation.
3. **Executive KPI & Operational Sparklines:** Centralized KPI dashboards combining real-time revenue, gross margin, inventory value, and ACID system health metrics without duplicating calculation logic.
4. **Cross-Cutting Navigation & Intent Resolution:** Instant keyboard-driven global discovery via Omnibar (`Ctrl+K`), NLP Intent Bar, and the Enterprise Guided Workflow Center (Business GPS, Academy, Glossary, Decision Assistant).

---

## 2. Strict Domain Authority & Non-Authority Boundaries (Rules #01–#07)

⚠️ **CRITICAL ARCHITECTURAL DIRECTIVE: M01 IS AN AGGREGATOR, NOT A DATA WRITER.**
- **Strict Non-Authority:** M01 DOES NOT own or directly mutate business transactional data (Purchase Orders, Stock Balances, Journal Entries, Customer Invoices, Price Structures). M01 is strictly forbidden from querying or writing directly to domain tables of other modules.
- **Read Aggregation Authority:** M01 aggregates data exclusively through published Read APIs and the centralized `WorkspaceAggregationService` / `WorkspaceAggregationBackendService`.
- **Quick Action Delegation Invariant:** All quick approval/rejection actions initiated from the Hub WorkQueue MUST delegate directly to the authoritative domain service endpoint (e.g., `POST /api/po/approve/:id`, `POST /api/inventory/adjust/:id`, `POST /api/invoices/sign/:id`). No shortcut tables or bypass logic are permitted.
- **Audit Parity (M02 Integration):** Every quick action executed from M01 generates an identical audit log entry with SHA-256 hash chaining via `AuditService`, ensuring zero loss of audit traceability.

---

## 3. Core Feature Architecture & Functional Groups

### A. WorkQueue SLA Engine
1. **Cross-Module Aggregation:** Automatically pools pending actionable tasks across P2P (M08), WMS (M17/M19/M20), O2C (M13/M15/M16), Finance (M31/M32/M33), and Governance (M38) based on user role and branch scope (`BR_HO`).
2. **Dynamic SLA Countdowns & Color Thresholds:** Computes remaining lead time (`dueDate - now`) from source document timestamps. Highlighting follows standard semantic status:
   - Normal / On Track: `bg-slate-100 text-slate-800`
   - High Priority (Near SLA): `bg-amber-100 text-amber-950 border-amber-300`
   - Urgent / SLA Breached: `bg-rose-100 text-rose-950 border-rose-300 animate-pulse`
3. **Deep-link Navigation Resolver:** Maps `entityType → route pattern` via the central Route Registry, allowing one-click transition from any WorkQueue card into the specific document drawer or workspace.
4. **Personal & Role-Based Filtering:** Filters work queues by user assignment, role capabilities (`currentUser.role`), and priority tags (`ALL`, `URGENT`, `HIGH`).
5. **Quick Action Execution:** Approves or rejects tasks directly from the Unified Action Inbox with Rule #19 `ConfirmDialog` protection and optimistic UI updates.

### B. Operational & Executive Widgets
1. **Executive KPI Sparklines:** Real-time monthly revenue, gross margin %, WMS inventory valuation, and system operational integrity rendered in `font-mono tabular-nums`.
2. **Enterprise Value Stream:** Interactive 5-step visual pipeline connecting Leads (M12) → Sales Orders (M13) → Warehouse Pick (M17) → Logistics (M36) → AR Invoices (M31).
3. **Priority Workspaces:** Role-adaptive workspace cards with pin indicators, prioritizing relevant workspaces based on active user profile.
4. **Capability Matrix (41 Modules):** Structured 6-group visual matrix with search and RBAC-aware access badges ("Khóa" for unauthorized modules).
5. **Guided Workflow Launch Center:** 4 embedded knowledge cards:
   - *Trợ Lý Định Tuyến Nghiệp Vụ (Decision Assistant)*
   - *Next Best Action & Business GPS*
   - *Học Viện ERP & 12 Chu Trình*
   - *Từ Điển Thuật Ngữ Nghiệp Vụ (Glossary)*

### C. Security, RBAC & Performance
1. **Backend RBAC Enforcement:** Filters work items at backend query time to prevent information leakage across departmental boundaries.
2. **Cached Read Models:** Leverages aggregated data providers to prevent N+1 queries across 41 modules on Hub initial load.
3. **Customizable Dashboard Grid:** Drag-and-drop widget reordering (`handleDragStart` / `handleDrop`) and visibility toggling stored safely in persistent user settings.

---

## 4. UI/UX Standards & Enterprise Requirements (Rule #19 & Rule #20)

- **L0 Workspace Banner:** Compact card with `rounded-2xl`, module badge `M01 • ENTERPRISE WORKSPACE HUB`, Rule #19 confirmation badge, Omnibar shortcut `Ctrl+K`, and Dashboard Customization modal.
- **L1 Navigation Sub-tabs:** 6 dedicated views:
  1. `all` — Bố Cục Tùy Chỉnh (All Widgets + Knowledge Center)
  2. `cockpit` — Bàn Điều Hành & KPIs
  3. `inbox` — Hộp Thư Phê Duyệt SLA
  4. `matrix` — Ma Trận 41 Phân Hệ
  5. `priority` — Phân Hệ Ưu Tiên
  6. `knowledge` — Trung Tâm Tri Thức & GPS
- **Rule #19 Modal Standards:** Zero usage of `window.alert/confirm/prompt`. 100% of sensitive operations utilize `ConfirmDialog.tsx`.
- **Typography & Formatting:** All monetary sums, transaction counts, and SLA metrics are rendered in `font-mono tabular-nums font-bold text-right` using standard Vietnamese separators (`14.820.000.000 ₫`).
- **Dark Mode Parity:** Comprehensive `dark:*` styling across all widgets, cards, modals, drag-handles, and tables.

---

## 5. Verification & Governance Sign-Off

- **Module Status:** `FROZEN & IMMUTABLE BASELINE`
- **Build Status:** Verified passing `npm run build` / `compile_applet`.
- **Architectural Conformance:** 100% compliant with the 20 Architecture Development Rules of NexusSync ERP.

