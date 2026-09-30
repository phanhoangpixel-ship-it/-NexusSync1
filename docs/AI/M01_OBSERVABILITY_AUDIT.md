# M01 OBSERVABILITY FORENSIC AUDIT & ARCHITECTURAL MAPPING
**NexusSync ERP — Enterprise Observability & Global Orchestration**
**Document Code:** `M01_OBSERVABILITY_AUDIT.md`
**Author:** Solution Architecture Engine
**Certified Scope:** M01 Workspace Hub Live API & Data Flow Observatory

---

## 1. FORENSIC CODEBASE AUDIT

### 1.1. Core Module Registry & Routing
- `src/config/moduleRegistry.ts`: 42 certified modules (M01 to M42) mapped with routes, permissions, and workspace memberships.
- `src/App.tsx`: Domain workspace shells and global header integration without hardcoded overrides.

### 1.2. Observability & Read-Model Architecture
- `src/routes/workspaceObservability.routes.ts`:
  - `GET /api/workspace/observability/health`: Aggregated health and efficiency scores.
  - `GET /api/workspace/observability/topology`: Active module statuses, action counters, error rates.
  - `GET /api/workspace/observability/spans`: Real runtime flow span telemetry.
  - `GET /api/workspace/observability/spans/:correlationId`: Filtered spans by correlation ID.
  - `GET /api/workspace/observability/rca/:correlationId`: Root Cause Analysis trace chain.
  - `POST /api/workspace/observability/sync`: Idempotent read-model projection from `audit_logs` and `outbox_events`.
- **Database Schema**: `flow_spans`, `module_kpi_snapshots`, `audit_logs`, `outbox_events`.

### 1.3. Single-Writer Domain Authorities (Strict Protection)
- **M17 Inventory**: `InventoryService.postTransaction()` is the sole writer.
- **M30 Accounting**: `AccountingEngine` / GL is the sole writer.
- **M41 Pricing**: `PricingEngine` is the sole writer.
- **M42 Costing**: `CostingEngine` is the sole writer.
- **M01 Workspace Hub**: Strict Observability & Orchestration view only — no direct mutation of business ledgers.

---

## 2. ARTIFACT TO CODEBASE MAPPING

| Artifact Concept | Status | Implementation in NexusSync ERP |
|---|---|---|
| 6-Column Module Grid + CLI + DB | **ADAPTED** | `M01LiveFlowObservatory.tsx` SVG topology with exact coordinates & colors |
| Particle Animation along Bezier paths | **REUSE & OPTIMIZE** | High-performance requestAnimationFrame loop with batching |
| LIVE Mode | **ADAPTED** | Direct integration with `m01WorkspaceApi.getSpans()` & `getObservabilityHealth()` |
| SIMULATION Mode | **REUSE** | Zero database writes; pure visual canvas simulation |
| INSPECT Mode & Aside Drawer | **ADAPTED** | Node, Edge, and Incident inspector with RCA trace launcher |
| Flow Presets (P2P, O2C, POS, STOCKTAKE, MFG, RETURNS, PRICING, FINANCE, E2E) | **REUSE** | Canonical flow definitions matching business processes |
| Incident Detection & RCA Recommendation | **ADAPTED** | Read-only recommendations routing to authorized domain services |
| Rule #19 & #20 Design Standards | **CERTIFIED** | WCAG AA contrast, `font-mono tabular-nums`, ConfirmDialog integration |

---

## 3. VERIFICATION MATRIX
- **Type Safety**: TypeScript Strict Mode across all components.
- **Build**: Vite & tsx compilation check passed (`npm run build`).
- **Safety Gate**: Zero shadow ledgers, zero bypass of RBAC or Single-Writer authorities.
