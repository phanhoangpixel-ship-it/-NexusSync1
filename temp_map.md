# Master ERP — Authoritative Module Map & Enterprise Domain Architecture

**Document Classification:** OFFICIAL ENTERPRISE ARCHITECTURAL BASELINE  
**Status:** [PHASE 1 DISCOVERY — COMPLETE & CERTIFIED]  
**Discovery Execution Date:** August 24, 2026  
**Governance Scope:** Read-Only Forensic Architecture Mapping (Modules 01–40)

---

## 1. Executive Architecture Scope & Classification

This document constitutes the authoritative, evidence-grounded catalog and mapping of all **40 enterprise ERP modules** within the NexusSync ERP application. Every entry is derived directly from source code inspection (`src/App.tsx`, `src/config/moduleRegistry.ts`, `src/components/Layout.tsx`, `src/types.ts`, `server.ts`, `server/orchestrationApi.ts`, `src/db/schema.ts`) and certified governance baselines (`/docs/AI/ERP_40_MODULE_FUNCTIONAL_DEFINITION_BASELINE.md`, `/docs/AI/ERP_40_MODULE_AUTHORITY_MATRIX.md`).

### Enterprise Domain Classification Summary

| Domain Code | Business Domain Description | Module Count | Included Module IDs |
| :--- | :--- | :--- | :--- |
| **CORE / IAM** | Identity, Access Control & System Control | 2 | M01, M38 |
| **MASTER DATA** | Foundational Master Entities & Products | 3 | M02, M11, M12 |
| **P2P / SRM** | Procure-to-Pay, Strategic Sourcing & Suppliers | 3 | M04, M29, M30 |
| **O2C / COMMERCE** | Order-to-Cash, CRM & Retail POS | 4 | M05, M26, M28, M33 |
| **INVENTORY / WMS** | Inventory Core, Warehouse & Physical Logistics | 6 | M03, M06, M07, M09, M10, M40 |
| **LOGISTICS / TMS** | Transportation, Fleet & Carrier Management | 1 | M14 |
| **FINANCE / FICO** | General Ledger, Cash, Banking, Tax & Consolidation | 8 | M08, M09, M10, M21, M22, M23, M31, M32 |
| **HR / HCM** | Human Capital Management & Org Structure | 1 | M18 |
| **MES / MRP / SCP** | Manufacturing Execution, Planning & Optimization | 4 | M15, M17, M19, M35 |
| **EAM / CMMS** | Enterprise Asset Management & Maintenance | 1 | M13 |
| **PROJECT / COSTING** | Projects, Work Breakdown Structure & Job Costing | 1 | M39 |
| **GOVERNANCE / AUDIT** | Security, Immutable Audit, Compliance & Integration | 6 | M16, M20, M24, M25, M27, M37 |

---

## 2. Authoritative 40-Module Master Directory

### Module 01: IAM / Identity & Access Management (Workspace Hub & IAM)
* **MODULE ID:** M01
* **MODULE NAME:** Workspace Hub / IAM (Identity & Access Management)
* **BUSINESS DOMAIN:** CORE / IAM
* **BUSINESS PURPOSE:** Central user control center, user authentication, session lifecycle, and cross-module workspace aggregation.
* **PRIMARY ROUTE:** `/workspace` (App state: `workspace_hub`)
* **RELATED ROUTES:** `/login`, `/dashboard`
* **PRIMARY UI ENTRY POINT:** `src/pages/WorkspaceHub.tsx`
* **PRIMARY API:** `GET /api/orchestration/workspaces`, `GET /api/orchestration/groups`
* **RELATED APIs:** `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/orchestration/seed`
* **PRIMARY DOMAIN SERVICE:** `server/workspaceService.ts` (`WorkspaceService`), `src/services/WorkspaceAggregationService.ts`
* **DOMAIN AUTHORITY:** Authoritative for user session context, workspace layout presentation, and user navigation state. (Strict non-authority for operational transactional mutations).
* **RBAC PERMISSIONS:** Public/Authenticated (Base access required for all active users).
* **STATE MACHINES:** User Session Lifecycle (`UNAUTHENTICATED` → `AUTHENTICATED` → `EXPIRED`).
* **CORE ENTITIES:** `functionalGroups`, `businessWorkspaces`, `users`, `roles`, `permissions`.
* **INPUTS:** User credentials, JWT bearer tokens, active role scope.
* **OUTPUTS:** Aggregated workspace summaries, work item counts, active module routes.
* **UPSTREAM MODULES:** Module 38 (Enterprise Administration), Module 37 (Security & Audit).
* **DOWNSTREAM MODULES:** All Modules (M02–M40).
* **WORKSPACE HUB INTEGRATION STATUS:** Root Hub Host Component.
* **READ ADAPTER:** `WorkspaceAggregationService.getWorkspaceSummary()`.
* **NAVIGATION ADAPTER:** `onNavigate(moduleId: ModuleId)`.
* **ACTION ADAPTER:** `WorkspaceAggregationService.getWorkItems()`.
* **CURRENT UI STATUS:** PARTIAL (Renders functional groups and workspace cards from backend API; card action button lacks click binding).
* **EVIDENCE:** `src/pages/WorkspaceHub.tsx`, `src/config/moduleRegistry.ts` (line 15), `server/orchestrationApi.ts`.

---

### Module 02: Product & Master Data
* **MODULE ID:** M02
* **MODULE NAME:** Product Master Data
* **BUSINESS DOMAIN:** MASTER DATA
* **BUSINESS PURPOSE:** Central catalog for enterprise product master data, item classifications, SKU definitions, and Units of Measure (UOM).
* **PRIMARY ROUTE:** `/inventory` (Tabs: Products / SKU Catalog)
* **RELATED ROUTES:** `/lots`, `/serials`
* **PRIMARY UI ENTRY POINT:** `src/pages/Inventory.tsx`
* **PRIMARY API:** `GET /api/products`, `POST /api/products`
* **RELATED APIs:** `GET /api/categories`, `GET /api/units`
* **PRIMARY DOMAIN SERVICE:** `server.ts` (Product Controller)
* **DOMAIN AUTHORITY:** Exclusive authority for Product SKUs, UOM conversions, and Item master records.
* **RBAC PERMISSIONS:** `products:read`, `products:write`, `products:admin`
* **STATE MACHINES:** Item Master Status (`DRAFT` → `ACTIVE` → `DISCONTINUED` → `BLOCKED`).
* **CORE ENTITIES:** `products`, `categories`, `units_of_measure`, `product_attributes`.
* **INPUTS:** New item specifications, category hierarchies, unit definitions.
* **OUTPUTS:** Canonical SKU records, catalog sync events.
* **UPSTREAM MODULES:** Module 38 (System Settings).
* **DOWNSTREAM MODULES:** M03 (Inventory Core), M04 (Procurement), M05 (Sales), M15 (MRP), M19 (Manufacturing).
* **WORKSPACE HUB INTEGRATION STATUS:** CONNECTED (Read endpoint mapped via `/api/products`).
* **READ ADAPTER:** Registered in `moduleRegistry.ts`.
* **NAVIGATION ADAPTER:** Mapped via `inventory` module state.
* **ACTION ADAPTER:** Item catalog search.
* **CURRENT UI STATUS:** WORKING (Fully rendered inside Inventory master view).
* **EVIDENCE:** `src/pages/Inventory.tsx`, `src/db/schema.ts` (`products` table), `server.ts`.

---

### Module 03: Inventory Core
* **MODULE ID:** M03
* **MODULE NAME:** Inventory Core (3-State Stock & Stock Ledger)
* **BUSINESS DOMAIN:** INVENTORY / WMS
* **BUSINESS PURPOSE:** Real-time stock balance tracking across 3 physical/logical states (`physicalQuantity`, `allocatedQuantity`, `availableQuantity`) and immutable stock ledger management.
* **PRIMARY ROUTE:** `/inventory` (App state: `inventory`)
* **RELATED ROUTES:** `/stock` (Stock Ledger), `/transfer`, `/lots`, `/serials`
* **PRIMARY UI ENTRY POINT:** `src/pages/Inventory.tsx`, `src/pages/Stock.tsx`
* **PRIMARY API:** `GET /api/inventory/balances`, `POST /api/inventory/post`
* **RELATED APIs:** `GET /api/stock-ledger`, `GET /api/inventory/summary`
