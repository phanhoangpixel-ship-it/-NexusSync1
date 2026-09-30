# NEXUSSYNC ERP — MASTER TEST MATRIX (M01 – M42 & CORE)
*Standardized Architectural Verification Baseline — Aligned 100% with MODULE_MAP.md and API_CATALOG.md*

> **Governance Authority**: Chief ERP Architect & Acceptance Board  
> **Status**: ACTIVE & AUTHORITATIVE  
> **Single Source of Truth (SSOT) Alignment**:  
> - **Module Numbers & Structure**: `/docs/MODULE_MAP.md` (M01 – M42)  
> - **API Contracts & Endpoints**: `/docs/API_CATALOG.md`  
> - **Domain Invariants**: 4 Single-Writer Authorities (M17 Inventory, M30 GL/Accounting, M41 Pricing, M42 Costing)

---

## 1. Architectural Verification Summary

| Business Group | Module IDs | Total Modules | Certified Modules | Active/Pending Modules |
| :--- | :--- | :--- | :--- | :--- |
| **01. Commercial & Sales** | M07, M12, M13, M14, M15, M16, M41 | 7 | M07, M12, M13, M15, M16, M41 | M14 |
| **02. Procurement & Sourcing** | M08, M09, M10, M11 | 4 | M08, M10, M11 | M09 |
| **03. Inventory & Logistics** | M17, M18, M19, M20, M21, M22, M23, M24, M36 | 9 | M17, M20, M24, M36 | M18, M19, M21, M22, M23 |
| **04. Manufacturing & Projects**| M06, M25, M26, M27, M35 | 5 | M06, M25, M26, M27, M35 | — |
| **05. Finance & Accounting** | M30, M31, M32, M33, M34, M42 | 6 | M30, M31, M32, M33, M34, M42 | — |
| **06. HR & Payroll** | M28 | 1 | — | M28 |
| **07. Governance, QA & Platform**| M01, M02, M03, M04, M05, M29, M37, M38, M39, M40 | 10 | M02, M29, M37, M38, M39, M40 | M01, M03, M04, M05 |
| **CORE Services & IAM** | CORE-IAM, CORE-PLATFORM | 2 | CORE-IAM, CORE-PLATFORM | — |
| **TOTAL** | **M01 – M42 + CORE** | **42 Modules + 2 Core** | **32 Certified** | **12 Pending Live QA Run** |

---

## 2. Master Test Specifications by Module (M01 – M42)

### M01 — Workspace Hub & Executive Command Center
*Workspace: `WS01_HUB` | Route: `/workspace` | Component: `WorkspaceHub.tsx` (Sub-components: `OperationalActivityTaskCenter.tsx`, `M01ObservabilityPanel.tsx`, `ControlTowerTab.tsx`) | Authority: WorkspaceAggregationBackendService (Read-Only Aggregator)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M01-F01 | Executive KPI Overview | `/workspace` (Tab 1: Control Tower) | `WorkspaceHub.tsx` / `ControlTowerTab.tsx` | Load Workspace Hub | `/api/workspace/summary` | GET | WorkspaceAggregationBackendService | Read-only aggregation | High-level metrics across all modules (Active Workspaces, Pending Tasks, Alerts, System Health) | PASS (2026-09-29) | Workspace Hub | BUSINESS-CRITICAL |
| M01-F02 | Unified Work Queue | `/workspace` (Tab 2: Activity & Tasks) | `OperationalActivityTaskCenter.tsx` | View Pending Tasks & Action | `/api/workspace/work-items` | GET | WorkspaceAggregationBackendService | Dynamic cross-module aggregation | Consolidated action items across domains (M08, M20, M38, M16...) with priority filters | PASS (2026-09-29) | Task & Approval | CORE-CRITICAL |
| M01-F03 | Recent Activities Stream | `/workspace` (Tab 2: Activity & Tasks) | `OperationalActivityTaskCenter.tsx` | Stream Activities | `/api/workspace/observability/spans` | GET | AuditService / ObservabilityProjector | Read-only audit slice with SHA-256 masking | Chronological activity log feed with sanitized payloads | PASS (2026-09-29) | Audit Trail | BUSINESS |
| M01-F04 | Client-side Work Items CSV Export | `/workspace` (Tab 2: Activity & Tasks) | `OperationalActivityTaskCenter.tsx` | Export Data | Client Action | — | Client Export Engine | Read-only memory export | UTF-8 CSV download of active filtered work items | PASS (2026-09-29) | Workspace Hub | SUPPORTING |
| M01-F05 | NexusFlow Observability Health Score | `/workspace` (Tab 3: Observability) | `M01ObservabilityPanel.tsx` | Xem điểm sức khoẻ hệ thống | `/api/workspace/observability/health` | GET | ObservabilityProjectorService | Read-only projection từ `audit_logs` (chính) + `outbox_events` (phụ) — không mutate | `systemScore`, `status`, phân bố green/yellow/red theo 43 modules | PASS (2026-09-29) | M01 Observability, M02 Audit, M05 EventBus | BUSINESS-CRITICAL |
| M01-F06 | Module Topology & Registry Drift Detection | `/workspace` (Tab 3: Observability) | `M01ObservabilityPanel.tsx` | Xem bản đồ 43 module | `/api/workspace/observability/topology` | GET | ObservabilityProjectorService | Read-only, đọc `moduleRegistry.ts` | Tự động gắn cờ `registryOnly=true` cho module ngoài dải M01–M42 đã CERTIFIED (hiện tại: M43) | PASS (2026-09-29) | M01 Observability | BUSINESS |
| M01-F07 | Manual Observability Sync Trigger | `/workspace` (Tab 3: Observability) | `M01ObservabilityPanel.tsx` | Bấm "Đồng bộ ngay" | `/api/workspace/observability/sync` | POST | ObservabilityProjectorService | Ghi `flow_spans` + `module_kpi_snapshots` — bảng dẫn xuất riêng của M01 | Idempotent (unique index `sourceType+sourceRefId`), an toàn khi gọi lặp lại | PASS (2026-09-29) | M01 Observability | CORE-CRITICAL |
| M01-F08 | Document Preview & DMS File Attachment Count | `/workspace` (Tab 2: Activity & Tasks) | `OperationalActivityTaskCenter.tsx` | Preview Document | `/api/workspace/entity-preview` | GET | WorkspaceAggregationBackendService | Read-only DMS check (`/api/dms/entity/:type/:id/attachments`) | Trả về thông tin thực thể kèm số lượng tài liệu đính kèm | PASS (2026-09-29) | DMS & Document Preview | BUSINESS |
| M01-F09 | Process Traceability Graph | `/workspace` (Tab 2: Activity & Tasks) | `OperationalActivityTaskCenter.tsx` | View Process Chain | `/api/workspace/process-chains` | GET | UnifiedPipelineEngine | Read-only cross-module lineage | Trực quan hóa tiến trình nghiệp vụ chuỗi P2P & O2C | PASS (2026-09-29) | Traceability | BUSINESS |
| M01-F12 | Real SLA Calculation & Task Age | `/workspace` (Tab 2: Activity & Tasks) | `OperationalActivityTaskCenter.tsx` | View Task SLA | `/api/workspace/work-items` | GET | WorkspaceAggregationBackendService | Read-only SLA policies (M38) | SLA chính xác từ `sla_policies`, nguồn khác hiển thị 'Chưa có SLA' + tuổi việc | PASS (2026-09-29) | Task Center | BUSINESS-CRITICAL |
| M01-F13 | Server-side Permission Filtering | `/workspace` (Tab 2: Activity & Tasks) | `OperationalActivityTaskCenter.tsx` | Filter by Role | `/api/workspace/work-items?role=...` | GET | WorkspaceAggregationBackendService | RBAC Permission Evaluation | Phân định `canAction` (chỉ user có quyền mới duyệt) và `isReadOnly` (chỉ xem) | PASS (2026-09-29) | RBAC & Security | CORE-CRITICAL |
| M01-F14 | Sequential Bulk Action Execution | `/workspace` (Tab 2: Activity & Tasks) | `OperationalActivityTaskCenter.tsx` | Bulk Approve/Reject | `/api/workspace/work-items/bulk-action` | POST | WorkspaceAggregationBackendService | Official Domain Delegation | Xử lý tuần tự từng dòng, idempotencyKey độc lập, 1 dòng lỗi không dừng cả lô | PASS (2026-09-29) | Task & Approval | BUSINESS-CRITICAL |
| M01-F15 | Multi-View Count Reconciliation | `/workspace` (Tab 2: Activity & Tasks) | `OperationalActivityTaskCenter.tsx` | Reconcile Counts | `/api/workspace/summary` | GET | WorkspaceAggregationBackendService | Unified Calculation Engine | Số đếm badge tab = KPI summary = total items trong danh sách | PASS (2026-09-29) | Task Center | BUSINESS |
| M01-F16 | Whitelisted Fast Actions Guard | `/workspace` (Tab 2: Activity & Tasks) | `OperationalActivityTaskCenter.tsx` | Quick Action | `/api/workspace/work-items/:id/action` | POST | Domain Services (M08, M20, M38) | Single-Writer Official Delegation | Chỉ thực thi các action được cấp phép, ghi audit log M02, 0 ghi lén sổ lõi | PASS (2026-09-29) | Governance & Security | CORE-CRITICAL |
| M01-F17 | Server-side Filter, Search & Table Pagination | `/workspace` (Tab 2: Activity & Tasks) | `OperationalActivityTaskCenter.tsx` | Filter & Paginate | `/api/workspace/work-items` | GET | WorkspaceAggregationBackendService | Dynamic Query Filtering | Lọc theo module, trạng thái, SLA, tìm kiếm text, phân trang chuẩn 10/15/25/50 | PASS (2026-09-29) | UI/UX & Navigation | BUSINESS |
| M01-F18 | Auto-Refresh & Manual Refresh Trigger | `/workspace` (Tab 2: Activity & Tasks) | `OperationalActivityTaskCenter.tsx` | Refresh Data | `/api/workspace/work-items` | GET | WorkspaceAggregationBackendService | Periodic Polling | Tự động làm mới chu kỳ 60s khi tab hiển thị kèm nút kích hoạt tức thì | PASS (2026-09-29) | Task Center | SUPPORTING |
---

### M02 — Centralized Audit & Compliance Trail
*Workspace: `WS01_WORKSPACE_HUB` | Route: `/audit` | Component: `AuditComplianceWorkspace.tsx` | Authority: AuditService (SSOT for SHA-256 Logs)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M02-F01 | Audit Log Search & Filter | `/audit` | `AuditComplianceWorkspace.tsx` | Filter Logs | `/api/audit/logs` | GET | AuditService | `audit_logs` | Filtered audit entries returned | PASS | Audit & Governance | CORE-CRITICAL |
| M02-F02 | Cryptographic Chain Verification | `/audit` | `AuditComplianceWorkspace.tsx` | Verify Hashes | `/api/audit/verify-chain` | GET | AuditService | `audit_logs` hash validation | 100% SHA-256 chain integrity confirmed | PASS | Security & Audit | CORE-CRITICAL |
| M02-F03 | Single Entry Proof Check | `/audit` | `AuditComplianceWorkspace.tsx` | Check Entry Proof | `/api/audit/verify-entry/:id` | GET | AuditService | `audit_logs` proof verification | Validates cryptographic hash of specific entry | PASS | Audit Trail | CORE-CRITICAL |
| M02-F04 | Compliance Checks Audit | `/audit` | `AuditComplianceWorkspace.tsx` | Run Compliance Scan | `/api/audit/compliance-checks` | GET | AuditService | `compliance_records` | Regulatory compliance status report | PASS | Compliance | BUSINESS-CRITICAL |

---

### M03 — Enterprise System Settings & Number Series
*Workspace: `WS16_SETTINGS` | Route: `/settings` | Component: `SystemSettingsWorkspace.tsx` | Authority: OrgService / SettingsService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M03-F01 | Global System Configuration | `/settings` | `SystemSettingsWorkspace.tsx` | Update Config | `/api/settings` | PUT | SettingsService | `system_config` | Settings persisted and reflected globally | PENDING | Settings | CORE-CRITICAL |
| M03-F02 | Branch Management | `/settings` | `SystemSettingsWorkspace.tsx` | Register Branch | `/api/settings/branches` | POST | OrgService | `branches` | New operational branch created | PENDING | Org Structure | CORE-CRITICAL |
| M03-F03 | Number Series Configuration | `/settings` | `SystemSettingsWorkspace.tsx` | Configure Pattern | `/api/settings/number-series` | POST | SettingsService | `number_series` | Sequential document numbering enforced | PENDING | Document Generation | CORE-CRITICAL |
| M03-F04 | System Snapshot Backup | `/settings` | `SystemSettingsWorkspace.tsx` | Trigger Backup | `/api/settings/backup` | POST | SettingsService | `backup_archives` | Encrypted snapshot generated | PENDING | Platform Security | CORE-CRITICAL |
| M03-F05 | Feature Flag Controls | `/settings` | `SystemSettingsWorkspace.tsx` | Toggle Flag | `/api/settings/flags` | PUT | SettingsService | `feature_flags` | Module/feature visibility updated | PENDING | Platform Config | BUSINESS |

---

### M04 — SuperAdmin & Role-Based Access Control (RBAC)
*Workspace: `WS17_RBAC` | Route: `/rbac` | Component: `SuperAdminRBACWorkspace.tsx` | Authority: AuthorityManager / IAM*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M04-F01 | Role Creation & Definition | `/rbac` | `SuperAdminRBACWorkspace.tsx` | Create Role | `/api/rbac/roles` | POST | AuthorityManager | `roles` | Role registered with granular permissions | PENDING | RBAC & Security | CORE-CRITICAL |
| M04-F02 | User Role Assignment | `/rbac` | `SuperAdminRBACWorkspace.tsx` | Assign User Role | `/api/rbac/users` | POST | AuthorityManager | `user_roles` | User granted operational scope | PENDING | IAM | CORE-CRITICAL |
| M04-F03 | Permission Matrix Update | `/rbac` | `SuperAdminRBACWorkspace.tsx` | Save Permissions | `/api/rbac/permissions` | PUT | AuthorityManager | `role_permissions` | Permissions updated across 42 modules | PENDING | Security Guard | CORE-CRITICAL |
| M04-F04 | Row-Level Security (RLS) Policy | `/rbac` | `SuperAdminRBACWorkspace.tsx` | Apply RLS Rule | `/api/rbac/rls` | PUT | AuthorityManager | `rls_policies` | Branch/Data boundary enforced strictly | PENDING | Multi-Tenant Security | CORE-CRITICAL |

---

### M05 — Enterprise EventBus & Outbox Engine
*Workspace: `WS18_EVENTS` | Route: `/events` | Component: `M05EventBusWorkspace.tsx` | Authority: EventRouter*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M05-F01 | Outbox Event Streaming | `/events` | `M05EventBusWorkspace.tsx` | Inspect Outbox | `/api/events/outbox` | GET | EventRouter | `outbox_events` | Published transactional events listed | PENDING | Event Driven Architecture | CORE-CRITICAL |
| M05-F02 | Dead Letter Queue (DLQ) | `/events` | `M05EventBusWorkspace.tsx` | Inspect DLQ | `/api/events/dlq` | GET | EventRouter | `dlq_events` | Failed events isolated with error stack | PENDING | Resiliency | CORE-CRITICAL |
| M05-F03 | Event Retry Execution | `/events` | `M05EventBusWorkspace.tsx` | Retry Event | `/api/events/retry` | POST | EventRouter | `outbox_events` state | Event re-dispatched and status cleared | PENDING | Event Router | CORE-CRITICAL |
| M05-F04 | Subscription Management | `/events` | `M05EventBusWorkspace.tsx` | Add Subscriber | `/api/events/subscriptions` | POST | EventRouter | `event_subscriptions` | Topic registered for consumer service | PENDING | Event Driven Architecture | BUSINESS |

---

### M06 — Innovation & Product R&D Management
*Workspace: `WS23_RD` | Route: `/rd` | Component: `M06InnovationRDWorkspace.tsx` | Authority: ProjectService / Engineering | Live QA Certified: 2026-09-21 (18/18 Invariant Tests PASS)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M06-F01 | R&D Project Registration | `/rd` | `M06InnovationRDWorkspace.tsx` | Create Project | `/api/rd/projects` | POST | ProjectService | `rd_projects` | New product development lifecycle created in DRAFT stage | PASS | Engineering | BUSINESS-CRITICAL |
| M06-F02 | Laboratory Experiment Tracking | `/rd` | `M06InnovationRDWorkspace.tsx` | Log Experiment | `/api/rd/experiments` | POST | ProjectService | `rd_experiments` | Formulation and bench test trial data recorded | PASS | R&D Lab | BUSINESS |
| M06-F03 | Eco-Design Compliance Guard | `/rd` | `M06InnovationRDWorkspace.tsx` | Check Compliance | `/api/rd/eco-compliance/check` | POST | QualityService | `rd_compliance` | RoHS/REACH/Eco standards verified with score | PASS | Quality & Regulatory | BUSINESS-CRITICAL |
| M06-F04 | Prototype BOM Handover | `/rd` | `M06InnovationRDWorkspace.tsx` | Export Prototype BOM | `/api/rd/boms` | POST | ProjectService | `boms`, `bom_items` | Engineering BOM handed to M25 MES | PASS | R&D to Manufacturing | CORE-CRITICAL |
| M06-F05 | Stage-Gate Lifecycle Progression | `/rd` | `M06InnovationRDWorkspace.tsx` | Advance Stage | `/api/rd/projects/:id/stage` | PUT | ProjectService | `rd_projects.stage` | Sequential gate transition validated | PASS | R&D Governance | BUSINESS-CRITICAL |
| M06-F06 | Formula Version Control Zero-Overwrite | `/rd` | `M06InnovationRDWorkspace.tsx` | Save Formula Version | `/api/rd/formulas` | POST | ProjectService | `rd_formulas`, `rd_formula_items` | New version v1.x/v2.x created without overwrite | PASS | R&D Formulation | CORE-CRITICAL |
| M06-F07 | Sample Evaluation Workflow & Scoring | `/rd` | `M06InnovationRDWorkspace.tsx` | Evaluate Prototype Sample | `/api/rd/samples/evaluate` | POST | QualityService | `rd_samples` | Sensory & physical metrics scored with PASS/FAIL | PASS | Quality & Lab | CORE-CRITICAL |
| M06-F08 | Single-Writer Material Requisition M17 | `/rd` | `M06InnovationRDWorkspace.tsx` | Requisition Raw Materials | `/api/rd/projects/:id/material-requisition` | POST | InventoryService (M17) | `stock_transactions` | Outbound issue posted strictly via M17 single writer | PASS | Warehouse M17 | CORE-CRITICAL |
| M06-F09 | Real-time Formula Cost Estimator M42 | `/rd` | `M06InnovationRDWorkspace.tsx` | Calculate Formula Cost | `/api/rd/projects/:id/cost-estimate` | GET | CostingEngine (M42) | Read-only `cost_layers` | Formula unit cost computed from live COGS layers | PASS | Costing M42 | BUSINESS-CRITICAL |
| M06-F10 | Pilot Batch Work Order Delegation M25 | `/rd` | `M06InnovationRDWorkspace.tsx` | Launch Pilot Batch | `/api/rd/projects/:id/pilot-batch` | POST | ManufacturingService (M25) | `manufacturing_orders` | Pilot work order dispatched to M25 MES | PASS | Manufacturing M25 | CORE-CRITICAL |
| M06-F11 | QMS Inspection Plan Auto-Link M39 | `/rd` | `M06InnovationRDWorkspace.tsx` | Link QC Plan | `/api/rd/samples/evaluate` | POST | QualityService (M39) | `qc_plans`, `qc_inspections` | Prototype evaluation linked to M39 QC inspection | PASS | Quality M39 | BUSINESS-CRITICAL |
| M06-F12 | Sample Raw Material PO Delegation M08 | `/rd` | `M06InnovationRDWorkspace.tsx` | Create Sample PO | `/api/rd/projects/:id/sample-po` | POST | PurchaseEngine (M08) | `purchase_orders` | Sample purchasing delegated to M08/M09 P2P | PASS | Procurement M08 | BUSINESS |
| M06-F13 | Commercial SKU Master Registration M07 | `/rd` | `M06InnovationRDWorkspace.tsx` | Register Finished SKU | `/api/rd/projects/:id/register-sku` | POST | MasterDataService (M07) | `products` | New SKU created in M07 Item Master SSOT | PASS | Master Data M07 | CORE-CRITICAL |
| M06-F14 | Formula Confidentiality RBAC Masking | `/rd` | `M06InnovationRDWorkspace.tsx` | View Recipe Breakdown | `/api/rd/formulas/:projectId/versions` | GET | SecurityService (M04) | Authorization Guard | Confidential recipe percentages masked without role | PASS | Security M04 | CORE-CRITICAL |
| M06-F15 | 5-Gate Handover Verification & Sign-off | `/rd` | `M06InnovationRDWorkspace.tsx` | Sign-off Handover | `/api/rd/projects/:id/handover-signoff` | POST | ProjectService | `rd_projects.status` | 5-gate checklist verified, project handed over | PASS | Production Handover | CORE-CRITICAL |
| M06-F16 | Project Immutability Guard on Completion | `/rd` | `M06InnovationRDWorkspace.tsx` | Modify Locked Project | `/api/rd/projects/:id/stage` | PUT | ProjectService | Immutability Guard | Block modification on HANDED_OVER / REJECTED | PASS | Integrity & Audit | CORE-CRITICAL |
| M06-F17 | Cryptographic DMS Vaulting M29 & M02 | `/rd` | `M06InnovationRDWorkspace.tsx` | Archive Technical Dossier | `/api/rd/projects/:id/dms-vault` | POST | DmsService (M29) | `dms_documents`, `audit_logs` | SHA-256 dossier vaulted in M29, logged in M02 | PASS | DMS M29 & Audit M02 | CORE-CRITICAL |

---

### M07 — Master Data Management (Items & Customers)
*Workspace: `WS02_CRM` | Route: `/customers` | Component: `M07CustomersItemMasterWorkspace.tsx` | Authority: MasterDataService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M07-F01 | Customer Registry & Profile | `/customers` | `M07CustomersItemMasterWorkspace.tsx` | Create Customer | `/api/customers` | POST | MasterDataService | `customers` | Customer profile registered with tax/contact | PASS | Sales & O2C | CORE-CRITICAL |
| M07-F02 | Customer Credit Guard Check | `/customers` | `M07CustomersItemMasterWorkspace.tsx` | Check Credit | `/api/customers/:id/credit-status` | GET | MasterDataService | `customers.credit_limit` | Real-time exposure vs limit evaluated | PASS | Sales & Risk | CORE-CRITICAL |
| M07-F03 | Master Item / SKU Catalog | `/customers` | `M07CustomersItemMasterWorkspace.tsx` | Register SKU | `/api/products` | POST | MasterDataService | `products` | Product created with tracking attributes | PASS | Inventory & Sales | CORE-CRITICAL |
| M07-F04 | Product Category Hierarchy | `/customers` | `M07CustomersItemMasterWorkspace.tsx` | Save Category | `/api/product-categories` | POST | MasterDataService | `product_categories` | Category tree structure persisted | PASS | Catalog | BUSINESS |
| M07-F05 | Multi-UOM Conversion Setup | `/customers` | `M07CustomersItemMasterWorkspace.tsx` | Add UOM Conversion | `/api/product-uoms` | POST | MasterDataService | `product_uoms` | Ratio conversion factor active for M17 | PASS | Inventory & Procurement | CORE-CRITICAL |

---

### M08 — Purchase Orders & 3-Way Matching (P2P Core)
*Workspace: `WS04_PURCHASE` | Route: `/purchases` | Component: `M08PurchaseOrdersWorkspace.tsx` | Authority: PurchaseEngine*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M08-F01 | Purchase Order Creation | `/purchases` | `M08PurchaseOrdersWorkspace.tsx` | Create PO | `/api/purchase-orders` | POST | PurchaseEngine | `purchase_orders` | PO registered with idempotency guard | PASS | P2P Core | CORE-CRITICAL |
| M08-F02 | PO Approval Workflow | `/purchases` | `M08PurchaseOrdersWorkspace.tsx` | Approve PO | `/api/purchase-orders/:id/approve` | POST | AuthorityManager | `purchase_orders.status` | Financial threshold approval verified | PASS | Workflow & Governance | CORE-CRITICAL |
| M08-F03 | Goods Receipt Generation | `/purchases` | `M08PurchaseOrdersWorkspace.tsx` | Receive Goods | `/api/goods-receipts` | POST | InventoryService (M17) | `stock_balances`, `stock_ledger` | Stock mutated strictly via M17 single writer | PASS | P2P & Inventory M17 | CORE-CRITICAL |
| M08-F04 | 3-Way Matching Engine | `/purchases` | `M08PurchaseOrdersWorkspace.tsx` | Run 3-Way Match | `/api/purchase/matching-cases` | GET | PurchaseEngine | `matching_cases` | PO ↔ GR ↔ AP Invoice variance evaluated | PASS | Procurement & AP | CORE-CRITICAL |
| M08-F05 | Discrepancy Dispute Resolution | `/purchases` | `M08PurchaseOrdersWorkspace.tsx` | Resolve Dispute | `/api/purchase/matching-cases/:id/resolve` | POST | PurchaseEngine | `matching_cases` status | Variance approved within tolerance | PASS | P2P Governance | BUSINESS-CRITICAL |

---

### M09 — Supplier Relationship Management (SRM) & Contracts
*Workspace: `WS04_PURCHASE` | Route: `/suppliers` | Component: `M09SuppliersSRMWorkspace.tsx` | Authority: MasterDataService / SrmService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M09-F01 | Supplier Profile Registration | `/suppliers` | `M09SuppliersSRMWorkspace.tsx` | Create Supplier | `/api/suppliers` | POST | MasterDataService | `suppliers` | Supplier master profile recorded | PENDING | Procurement Master | CORE-CRITICAL |
| M09-F02 | Supplier Status & Blacklist Guard | `/suppliers` | `M09SuppliersSRMWorkspace.tsx` | Update Status | `/api/suppliers/:id` | PUT | MasterDataService | `suppliers.status` | Blocked suppliers prohibited from RFQ/PO | PENDING | Procurement Security | CORE-CRITICAL |
| M09-F03 | Blanket Purchase Agreement (BPA) | `/suppliers` | `M09SuppliersSRMWorkspace.tsx` | Create BPA | `/api/srm/contracts` | POST | SrmService | `srm_contracts` | Long-term price and volume contract locked | PENDING | Sourcing & Purchasing | CORE-CRITICAL |
| M09-F04 | Contract Milestone Tracking | `/suppliers` | `M09SuppliersSRMWorkspace.tsx` | Track Milestone | `/api/srm/contracts/:id` | GET | SrmService | `srm_contracts` | Contract utilization and commitment rate | PENDING | Contract Management | BUSINESS |

---

### M10 — Strategic Sourcing & RFQ Engine
*Workspace: `WS24_SOURCING` | Route: `/strategic-sourcing` | Component: `M10StrategicSourcingWorkspace.tsx` | Authority: SourcingService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M10-F01 | Sourcing Tender Package | `/strategic-sourcing` | `M10StrategicSourcingWorkspace.tsx` | Create Package | `/api/sourcing/packages` | POST | SourcingService | `sourcing_packages` | Tender package with budget created | PASS | Strategic Sourcing | CORE-CRITICAL |
| M10-F02 | Multi-Supplier RFQ Issue | `/strategic-sourcing` | `M10StrategicSourcingWorkspace.tsx` | Publish RFQ | `/api/sourcing/rfqs` | POST | SourcingService | `srm_rfqs` | RFQ dispatched to eligible suppliers | PASS | Sourcing | CORE-CRITICAL |
| M10-F03 | Multi-Round Bid Ingestion | `/strategic-sourcing` | `M10StrategicSourcingWorkspace.tsx` | Submit Bid | `/api/sourcing/bids` | POST | SourcingService | `srm_bids` | Multi-round reverse auction bids recorded | PASS | Sourcing & Reverse Auction | BUSINESS-CRITICAL |
| M10-F04 | Sourcing Scorecard Evaluation | `/strategic-sourcing` | `M10StrategicSourcingWorkspace.tsx` | Evaluate Bids | `/api/sourcing/evaluations` | POST | SourcingService | `sourcing_evaluations` | Technical and commercial score calculated | PASS | Sourcing & Evaluation | CORE-CRITICAL |
| M10-F05 | Award to PO Delegation | `/strategic-sourcing` | `M10StrategicSourcingWorkspace.tsx` | Convert to PO | `/api/sourcing/awards/:id/convert-to-po` | POST | PurchaseEngine (M08) | `purchase_orders` | Official PO generated via M08 authority | PASS | Sourcing to P2P | CORE-CRITICAL |

---

### M11 — Supplier Performance & Scorecards (SRM)
*Workspace: `WS25_SRM` | Route: `/srm` | Component: `M11SrmSupplierMgmtWorkspace.tsx` | Authority: QualityService / SrmService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M11-F01 | Dynamic Supplier Scorecard | `/srm` | `M11SrmSupplierMgmtWorkspace.tsx` | Calculate Score | `/api/srm/scorecards` | GET | SrmService | Read-only calculation | OTIF, Quality Pass Rate & Price Variance | PASS | SRM & Quality M39 | CORE-CRITICAL |
| M11-F02 | Supplier Tier Classification | `/srm` | `M11SrmSupplierMgmtWorkspace.tsx` | View Tiers | `/api/srm/tiers` | GET | SrmService | `supplier_tiers` | Tier 1 to Tier 4 classification active | PASS | SRM | BUSINESS-CRITICAL |
| M11-F03 | Scoring Weights Configuration | `/srm` | `M11SrmSupplierMgmtWorkspace.tsx` | Save Weights | `/api/srm/scoring-config` | PUT | SrmService | `srm_config` | Dynamic criteria weighting persisted | PASS | SRM & Governance | BUSINESS |
| M11-F04 | Underperformance Alert Guard | `/srm` | `M11SrmSupplierMgmtWorkspace.tsx` | Trigger Alert | `/api/srm/scorecards` | GET | TaskManager (M29) | `notifications` | Automatic alert sent on low vendor rating | PASS | SRM & Notifications | BUSINESS-CRITICAL |

---

### M12 — CRM Leads & Opportunity Pipeline
*Workspace: `WS02_CRM` | Route: `/crm` | Component: `M12CrmLeadsWorkspace.tsx` | Authority: SalesEngine*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M12-F01 | Lead Capture & Qualification | `/crm` | `M12CrmLeadsWorkspace.tsx` | Create Lead | `/api/crm/leads` | POST | SalesEngine | `leads` | Lead recorded with source tracking | PASS | CRM Pipeline | CORE-CRITICAL |
| M12-F02 | Opportunity Stage Funnel | `/crm` | `M12CrmLeadsWorkspace.tsx` | Advance Stage | `/api/crm/opportunities` | POST | SalesEngine | `opportunities` | Deal value and closing probability updated | PASS | CRM Pipeline | BUSINESS-CRITICAL |
| M12-F03 | Quotation Generation | `/crm` | `M12CrmLeadsWorkspace.tsx` | Issue Quote | `/api/crm/quotations` | POST | PricingEngine (M41) | `crm_quotations` | Authoritative pricing applied via M41 | PASS | CRM & Pricing M41 | CORE-CRITICAL |
| M12-F04 | Convert Quote to Sales Order | `/crm` | `M12CrmLeadsWorkspace.tsx` | Convert to SO | `/api/crm/quotations/:id/convert-to-so` | POST | SalesEngine (M13) | `sales_orders` | Official SO created via M13 single writer | PASS | CRM to O2C M13 | CORE-CRITICAL |
| M12-F05 | Customer Activity Log | `/crm` | `M12CrmLeadsWorkspace.tsx` | Log Call/Meeting | `/api/crm/activities` | POST | SalesEngine | `crm_activities` | Interaction recorded in customer timeline | PASS | CRM History | BUSINESS |

---

### M13 — Sales Orders & Order-to-Cash (O2C Commercial Core)
*Workspace: `WS03_SALES` | Route: `/sales` | Component: `M13SalesOrdersWorkspace.tsx` | Authority: SalesEngine (Single Writer for SO)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M13-F01 | Sales Order Ingestion | `/sales` | `M13SalesOrdersWorkspace.tsx` | Create SO Draft | `/api/sales/orders` | POST | SalesEngine | `sales_orders` | SO created with M41 pricing snapshot | PASS | O2C Core | CORE-CRITICAL |
| M13-F02 | Credit Guard & Approval | `/sales` | `M13SalesOrdersWorkspace.tsx` | Submit SO | `/api/sales/orders/:id/confirm` | POST | MasterDataService (M07) | `sales_orders.status` | Order blocked if overdue or over limit | PASS | Risk & Sales | CORE-CRITICAL |
| M13-F03 | Single-Writer Stock Reservation | `/sales` | `M13SalesOrdersWorkspace.tsx` | Confirm Order | `/api/sales/orders/:id/confirm` | POST | InventoryService (M17) | `stock_balances.reserved` | Reserved qty incremented, available decremented | PASS | O2C & Inventory M17 | CORE-CRITICAL |
| M13-F04 | WMS Fulfillment Dispatch | `/sales` | `M13SalesOrdersWorkspace.tsx` | Fulfill SO | `/api/sales/orders/:id/fulfill` | POST | InventoryService (M17) | `stock_ledger` | Goods Issue posted strictly via M17 | PASS | O2C & Inventory M17 | CORE-CRITICAL |
| M13-F05 | Decree 123 E-Invoice Generation | `/sales` | `M13SalesOrdersWorkspace.tsx` | Issue Invoice | `/api/sales/orders/:id/invoice` | POST | AccountingEngine (M30) | `invoices`, `accounting_entries` | Balanced VAS GL voucher (131/511/3331) | PASS | O2C & Finance M30 | CORE-CRITICAL |
| M13-F06 | Safe Cancellation & Release | `/sales` | `M13SalesOrdersWorkspace.tsx` | Cancel Order | `/api/sales/orders/:id/cancel` | POST | InventoryService (M17) | `stock_balances.reserved` | Reserved stock released via M17 | PASS | O2C & Inventory M17 | CORE-CRITICAL |
| M13-F07 | Live Test Runner & Concurrency | `/sales` | `M13SalesOrdersWorkspace.tsx` | Run E2E Suite | `/api/sales/test-suite/run` | POST | SalesEngine | Full O2C Pipeline | 15/15 test cases verified with live DB | PASS | E2E Regression | CORE-CRITICAL |

---

### M14 — Sales Commission & Incentive Engine (formerly Module 34)
*Workspace: `WS03_SALES` | Route: `/sales-commission` | Component: `M14SalesCommissionWorkspace.tsx` | Authority: CommissionService / AccountingEngine (M30) / CostingEngine (M42) / PayrollEngine (M28)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M14-F01 | Commission Plan Definition | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Create Plan | `/api/commission/plans` | POST | CommissionService | `commission_plans`, `commission_rules` | Commission rules by target, tier, and calculation basis configured | PASS | Sales Management | CORE-CRITICAL |
| M14-F02 | Revenue-based Commission Calculation | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Calculate Commission | `/api/commission/calculations` | POST | CommissionService | `commission_calculations` | Commission computed from invoiced M13 SOs | PASS | Sales & Finance | CORE-CRITICAL |
| M14-F03 | Commission Payout Batch Generation | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Generate Payout | `/api/commission/payouts/generate` | POST | CommissionService | `commission_payouts`, `commission_payout_items` | Consolidated payout batch created with beneficiary gross & net | PASS | Sales & Payroll M28 | CORE-CRITICAL |
| M14-F04 | Sales Quota & KPI Attainment Tracking | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | View Quotas | `/api/commission/quotas` | GET | CommissionService | `sales_quotas` | Quota attainment %, actual revenue & target visualized | PASS | Sales Rep Portal | BUSINESS |
| M14-F05 | Margin-based Calculation (COGS M42 SSOT) | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Calculate on Margin | `/api/commission/calculate/margin-based` | POST | CommissionService / CostingEngine (M42) | `commission_calculations` | Gross Margin (Revenue - COGS) computed via M42 authoritative cost layers | PASS | Sales & Costing M42 | CORE-CRITICAL |
| M14-F06 | EventBus Real-time Subscriptions (M05) | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Subscribe Events | `/api/commission/subscribe-events` | POST | CommissionService / EventBus (M05) | `processed_events` | Listens to order confirmed, invoice issued, payment collected, RMA returns | PASS | Event Driven M05 | CORE-CRITICAL |
| M14-F07 | Sales Accelerator Multiplier (>100% KPI) | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Apply Accelerator | `/api/commission/calculations` | POST | CommissionService | `commission_calculations.accelerator_multiplier` | 1.2x - 1.5x multiplier applied upon exceeding 100% quota | PASS | Incentive Engine | CORE-CRITICAL |
| M14-F08 | Automatic Return RMA Clawback (M15) | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Generate Clawback | `/api/commission/clawbacks/generate` | POST | CommissionService / ReturnsEngine (M15) | `commission_calculations` (isClawback = true) | Negative commission logged and auto-deducted from next payout batch | PASS | RMA M15 & Sales | CORE-CRITICAL |
| M14-F09 | Split Commission & Hierarchy Overrides | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Split Distribution | `/api/commission/calculate/margin-based` | POST | CommissionService / HrEngine (M28) | `commission_calculations` (isSplit = true) | Splits between Primary Rep (75%) and Sales Manager (15%) via M28 reporting line | PASS | HR Hierarchy M28 | CORE-CRITICAL |
| M14-F10 | Commission Dispute Ingestion & Tracking | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Submit Dispute | `/api/commission/disputes` | POST | CommissionService | `commission_disputes` | Dispute ticket logged with disputed amount, expected amount & evidence | PASS | Dispute Management | BUSINESS-CRITICAL |
| M14-F11 | Dispute Resolution & Automated Adjustment | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Resolve Dispute | `/api/commission/disputes/:id/resolve` | POST | CommissionService | `commission_disputes`, `commission_calculations` | Resolves dispute with adjustment calculation record | PASS | Dispute Management | CORE-CRITICAL |
| M14-F12 | Accrual GL Journal Entry (Nợ 6418 / Có 3388) | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Approve Payout | `/api/commission/payouts/:id/approve` | POST | AccountingEngine (M30) | `accounting_entries`, `commission_payouts` | Balanced VAS accrual voucher posted strictly via M30 single writer | PASS | GL Finance M30 | CORE-CRITICAL |
| M14-F13 | Settlement GL Journal Entry (Nợ 3388 / Có 1121/1111) | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Disburse Payout | `/api/commission/payouts/:id/disburse` | POST | AccountingEngine (M30) | `accounting_entries`, `commission_payouts` | Balanced VAS payment voucher posted strictly via M30 single writer | PASS | Treasury M32 & GL M30 | CORE-CRITICAL |
| M14-F14 | Payroll Disbursement Delegation (Nợ 3388 / Có 3341) | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Pay via Payroll | `/api/commission/payouts/:id/pay-via-payroll` | POST | CommissionService / PayrollEngine (M28) | `payrolls`, `accounting_entries` | Delegates commission to M28 monthly payroll run and posts Dr 3388 / Cr 3341 | PASS | HR Payroll M28 | CORE-CRITICAL |
| M14-F15 | Anomaly Detection Guard (High Margin/Rate) | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Scan Anomalies | `/api/commission/calculations` | GET | CommissionService | `commission_calculations.is_anomaly` | Flags rate >20% or low margin <5% for supervisor review | PASS | Risk & Fraud Shield | BUSINESS-CRITICAL |
| M14-F16 | Audit Trail SHA-256 (M02) & Digital Seal | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Capture Audit | `/api/commission/calculations` | POST | AuditService (M02) | `audit_logs` | Immutable audit trail recorded for all calculations, clawbacks & approvals | PASS | Compliance & Audit M02 | CORE-CRITICAL |
| M14-F17 | DMS Document Vaulting (M29) | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Vault Payout Statement | `/api/commission/payouts/:id` | GET | DmsService (M29) | `dms_documents` | Payout statements and dispute settlements archived in M29 | PASS | Document Vault M29 | BUSINESS |
| M14-F18 | Consumer Idempotency Key Guard | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Replay Protection | `/api/commission/calculate/margin-based` | POST | CommissionService | `processed_events`, `outbox_events` | Idempotent execution preventing duplicate commission payouts & clawbacks | PASS | Reliability & Idempotency | CORE-CRITICAL |
| M14-F19 | End-to-End Commission Ledger Invariance | `/sales-commission` | `M14SalesCommissionWorkspace.tsx` | Verify Invariants | `/api/commission/calculations` | GET | CommissionService | `commission_calculations` | Net Commission = Gross - Clawbacks + Adjustments reconciled 100% | PASS | Data Integrity | CORE-CRITICAL |

---

### M15 — Returns & Customer RMA Management
*Workspace: `WS03_SALES` | Route: `/returns` | Component: `M15ReturnsRMAWorkspace.tsx` | Authority: SalesEngine / QualityService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M15-F01 | RMA Request Ingestion | `/returns` | `M15ReturnsRMAWorkspace.tsx` | Create RMA | `/api/returns/rma` | POST | SalesEngine | `rma_requests` | Return docket registered against original SO | PASS | O2C & RMA | CORE-CRITICAL |
| M15-F02 | RMA Quality Inspection | `/returns` | `M15ReturnsRMAWorkspace.tsx` | Record Inspection | `/api/returns/rma/:id/inspect` | POST | QualityService (M39) | `rma_inspections` | Pass to Restock / Fail to Quarantine | PASS | RMA & Quality M39 | CORE-CRITICAL |
| M15-F03 | Restock Inbound Movement | `/returns` | `M15ReturnsRMAWorkspace.tsx` | Restock Goods | `/api/returns/rma/:id/restock` | POST | InventoryService (M17) | `stock_balances`, `stock_ledger` | Stock returned strictly via M17 single writer | PASS | RMA & Inventory M17 | CORE-CRITICAL |
| M15-F04 | Credit Note & Refund Voucher | `/returns` | `M15ReturnsRMAWorkspace.tsx` | Issue Credit Note | `/api/returns/credit-notes` | POST | AccountingEngine (M30) | `invoices`, `accounting_entries` | Reversal GL voucher issued (521/3331/131) | PASS | RMA & Finance M30 | CORE-CRITICAL |
| M15-F05 | Delivery Lineage & Over-Return Rejection | `/returns` | `M15ReturnsRMAWorkspace.tsx` | Validate Lineage | `/api/returns/rma/validate` | POST | RmaValidationService | `rma_requests` | Rejects return quantity exceeding actual delivered sales order quantity | PASS | O2C & Validation | CORE-CRITICAL |
| M15-F06 | Return Window & Reason Policy Gate | `/returns` | `M15ReturnsRMAWorkspace.tsx` | Verify Policy | `/api/returns/rma/validate` | POST | RmaValidationService | `rma_requests` | Enforces 30-day return window & mandatory technical classification | PASS | RMA Policy | CORE-CRITICAL |
| M15-F07 | Lot/Serial Number Traceability & Lineage | `/returns` | `M15ReturnsRMAWorkspace.tsx` | Validate Serial | `/api/returns/rma/validate` | POST | RmaValidationService | `serial_numbers` | Verifies serial belongs to original order and active warranty period | PASS | RMA & Serial M23 | CORE-CRITICAL |
| M15-F08 | Warranty Validation with M23 Integration | `/returns` | `M15ReturnsRMAWorkspace.tsx` | Check Warranty | `/api/returns/rma/validate` | POST | RmaValidationService | `serial_numbers` | Flags VOID_TAMPERED if physical seal broken or expired | PASS | RMA & Warranty M23 | CORE-CRITICAL |
| M15-F09 | QC Inspection Gate & Defect Classification | `/returns` | `M15ReturnsRMAWorkspace.tsx` | QC Inspection | `/api/returns/rma/:id/inspect` | POST | QualityService (M39) | `rma_requests.inspection_result` | Categorizes DEFECTIVE, DAMAGED, RESTOCKABLE with technical report | PASS | RMA & QC M39 | CORE-CRITICAL |
| M15-F10 | Inventory Restock Single-Writer Inbound | `/returns` | `M15ReturnsRMAWorkspace.tsx` | Restock Inbound | `/api/returns/rma/:id/disposition` | POST | InventoryService (M17) | `stock_balances`, `stock_ledger` | Atomic stock replenishment via M17 single-writer API | PASS | RMA & Inventory M17 | CORE-CRITICAL |
| M15-F11 | Multi-Disposition Routing (Repair & RTV) | `/returns` | `M15ReturnsRMAWorkspace.tsx` | Execute Routing | `/api/returns/rma/:id/disposition` | POST | RmaDispositionRouter | `maintenance_work_orders`, `purchase_returns` | Creates M27 Maintenance WO or M08/M11 RTV Supplier Claim | PASS | RMA, EAM & SRM | CORE-CRITICAL |
| M15-F12 | Dual Financial Settlement (AR / Cash) | `/returns` | `M15ReturnsRMAWorkspace.tsx` | Settle Refund | `/api/returns/rma/:id/disposition` | POST | AccountingEngine (M30) | `accounting_entries`, `credit_notes` | Balanced double-entry VAS vouchers: Credit Note (5212/1311) or Cash (5212/1111) | PASS | RMA & Accounting M30 | CORE-CRITICAL |
| M15-F13 | Fraud Shield (Velocity & Director Override) | `/returns` | `M15ReturnsRMAWorkspace.tsx` | Assess Fraud | `/api/returns/fraud-check` | POST | RmaFraudGuardService | `rma_requests.fraud_score` | Detects abnormal velocity / duplicate serial; requires director override | PASS | RMA & Fraud Shield | CORE-CRITICAL |
| M15-F14 | Audit Log SHA-256 (M02) & DMS Vault (M29) | `/returns` | `M15ReturnsRMAWorkspace.tsx` | Digital Seal | `/api/returns/rma/:id/disposition` | POST | AuditService (M02) | `audit_logs`, `dms_documents` | 10 lifecycle milestones logged with SHA-256 seal & PDF stored in M29 | PASS | RMA, Audit & DMS | CORE-CRITICAL |
| M15-F15 | End-to-End Zero-Mock & State Invariance Lock | `/returns` | `M15ReturnsRMAWorkspace.tsx` | Lock Completed RMA | `/api/returns/rma/:id/disposition` | POST | RmaValidationService | `rma_requests.status` | Strictly enforces state machine immutability; blocks tampering on completed RMAs | PASS | RMA Governance | CORE-CRITICAL |

---

### M16 — POS Retail & Cashier Shifts
*Workspace: `WS21_POS` | Route: `/pos` | Component: `M16POSRetailWorkspace.tsx` | Authority: SalesEngine / CashierService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M16-F01 | Cashier Shift Open | `/pos` | `M16POSRetailWorkspace.tsx` | Open Shift | `/api/shift/open` | POST | CashierService | `cashier_shifts` | Shift opened with initial float balance | PASS | Retail POS | CORE-CRITICAL |
| M16-F02 | Active Shift State Check | `/pos` | `M16POSRetailWorkspace.tsx` | Check Active Shift | `/api/shift/active` | GET | CashierService | `cashier_shifts` | Active register and cash drawer state | PASS | Retail POS | CORE-CRITICAL |
| M16-F03 | Retail POS Order Checkout | `/pos` | `M16POSRetailWorkspace.tsx` | Process Checkout | `/api/pos/orders` | POST | InventoryService (M17) | `stock_ledger`, `cash_drawer` | Immediate stock deduction via M17 & receipt | PASS | POS & Inventory M17 | CORE-CRITICAL |
| M16-F04 | Cash Drop & Petty Cash | `/pos` | `M16POSRetailWorkspace.tsx` | Record Cash Drop | `/api/shift/cash-drops` | POST | CashierService | `cash_drops` | Drawer cash transferred to safe | PASS | Treasury M32 | BUSINESS-CRITICAL |
| M16-F05 | Shift Close & Cash Audit | `/pos` | `M16POSRetailWorkspace.tsx` | Close Shift | `/api/shift/close` | POST | AccountingEngine (M30) | `cashier_shifts`, `accounting_entries` | Cash variance calculated & posted to GL 111 | PASS | POS & Finance M30 | CORE-CRITICAL |

---

### M17 — Master WMS & Inventory Core (Single-Writer Authority)
*Workspace: `WS11_INVENTORY` | Route: `/inventory` | Component: `MasterWmsWorkspace.tsx` | Authority: InventoryService (Sole Authority for Stock Ledger & Balances)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M17-F01 | Real-time Stock Balances | `/inventory` | `MasterWmsWorkspace.tsx` | View Balances | `/api/inventory/balances` | GET | InventoryService | `stock_balances` | Physical, reserved, and available stock | PASS | Inventory Master | CORE-CRITICAL |
| M17-F02 | Immutable Stock Ledger Stream | `/inventory` | `MasterWmsWorkspace.tsx` | View Stock Ledger | `/api/inventory/ledger` | GET | InventoryService | `stock_ledger` | Chronological balanceAfter transaction stream | PASS | Inventory Audit | CORE-CRITICAL |
| M17-F03 | Stock Mutation (Single-Writer API)| `/inventory` | `MasterWmsWorkspace.tsx` | Post Transaction | `/api/inventory/transactions` | POST | InventoryService | `stock_balances`, `stock_ledger` | Atomic stock update with non-negative check | PASS | Inventory Core | CORE-CRITICAL |
| M17-F04 | Atomic Stock Reservation | `/inventory` | `MasterWmsWorkspace.tsx` | Reserve Stock | `/api/inventory/reserve` | POST | InventoryService | `stock_balances.reserved` | Prevents over-selling across parallel orders | PASS | Inventory & Sales | CORE-CRITICAL |
| M17-F05 | Stock Release Handover | `/inventory` | `MasterWmsWorkspace.tsx` | Release Stock | `/api/inventory/release` | POST | InventoryService | `stock_balances.reserved` | Releases reserved stock back to available | PASS | Inventory & Sales | CORE-CRITICAL |
| M17-X01 | Single-Writer Invariant Guard | `/inventory` | `MasterWmsWorkspace.tsx` | Direct Write Probe | `/api/inventory/transactions` | POST | InventoryService | Boundary Lock | All external writes rejected; M17 is sole writer | PASS | Master Data Integrity | CORE-CRITICAL |

---

### M18 — Warehouse Spatial & Multi-Location Management
*Workspace: `WS11_INVENTORY` | Route: `/warehouse` | Component: `WarehouseManagementWorkspace.tsx` | Authority: InventoryService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M18-F01 | Warehouse Registry Setup | `/warehouse` | `WarehouseManagementWorkspace.tsx` | Create Warehouse | `/api/warehouses` | POST | InventoryService | `warehouses` | Warehouse facility registered | PENDING | Warehouse Master | CORE-CRITICAL |
| M18-F02 | Zone & Bin Layout Hierarchy | `/warehouse` | `WarehouseManagementWorkspace.tsx` | Define Bins | `/api/warehouses/:id/locations` | POST | InventoryService | `locations` | Aisle-Rack-Shelf-Bin coordinate tree | PENDING | WMS Spatial | CORE-CRITICAL |
| M18-F03 | Volumetric Capacity Guard | `/warehouse` | `WarehouseManagementWorkspace.tsx` | Check Capacity | `/api/warehouses/capacity` | GET | InventoryService | `locations` capacity | Weight and cubic meter limits monitored | PENDING | WMS Optimization | BUSINESS-CRITICAL |
| M18-F04 | Spatial Heatmap & Occupancy | `/warehouse` | `WarehouseManagementWorkspace.tsx` | View Heatmap | `/api/warehouses/:id/occupancy` | GET | InventoryService | Spatial metrics | Real-time occupancy percentage by zone | PENDING | WMS Analytics | BUSINESS |

---

### M19 — Stocktake & Cycle Counting
*Workspace: `WS11_INVENTORY` | Route: `/stocktake` | Component: `M19StocktakeWorkspace.tsx` | Authority: InventoryService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M19-F01 | Stocktake Docket Creation | `/stocktake` | `M19StocktakeWorkspace.tsx` | Create Docket | `/api/inventory/stocktakes` | POST | InventoryService | `stocktake_orders` | Cycle count session initiated | PENDING | Inventory Control | CORE-CRITICAL |
| M19-F02 | Physical Count Recording | `/stocktake` | `M19StocktakeWorkspace.tsx` | Record Count | `/api/inventory/stocktakes/:id` | PUT | InventoryService | `stocktake_items` | Blind/System counted quantities entered | PENDING | Stock Counting | CORE-CRITICAL |
| M19-F03 | Variance Calculation | `/stocktake` | `M19StocktakeWorkspace.tsx` | Calculate Variance | `/api/inventory/stocktakes/:id/variance`| GET | InventoryService | `stocktake_items` | Discrepancies flagged by SKU and bin | PENDING | Inventory Audit | CORE-CRITICAL |
| M19-F04 | Reconcile & Stock Adjustment | `/stocktake` | `M19StocktakeWorkspace.tsx` | Approve Reconcile | `/api/inventory/stocktakes/:id/reconcile`| POST | InventoryService (M17) | `stock_balances`, `stock_ledger` | Discrepancies adjusted strictly via M17 | PENDING | Stocktake & M20 Adj | CORE-CRITICAL |

---

### M20 — Stock Adjustment & Inventory Reconciliation
*Workspace: `WS11_INVENTORY` | Route: `/stock-adjustment` | Component: `StockAdjustmentWorkspace.tsx` | Authority: InventoryService / CostingEngine (M42)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M20-F01 | Stock Adjustment Ingestion | `/stock-adjustment` | `StockAdjustmentWorkspace.tsx` | Create Adjustment | `/api/inventory/adjustments` | POST | InventoryService | `stock_adjustments` | Adjustment draft with reason code | PASS | Stock Adjustment | CORE-CRITICAL |
| M20-F02 | Reason Code & Scrap Guard | `/stock-adjustment` | `StockAdjustmentWorkspace.tsx` | Select Reason | `/api/inventory/adjustments` | POST | InventoryService | `stock_adjustments.reason` | Damaged/Expired/Found categorized | PASS | Inventory Governance | BUSINESS-CRITICAL |
| M20-F03 | Adjustment Approval & M17 Write | `/stock-adjustment` | `StockAdjustmentWorkspace.tsx` | Approve Adjustment | `/api/inventory/adjustments/:id/approve`| POST | InventoryService (M17) | `stock_balances`, `stock_ledger` | Stock mutated strictly via M17 single writer | PASS | Adjustment & M17 | CORE-CRITICAL |
| M20-F04 | COGS & Scrap GL Posting | `/stock-adjustment` | `StockAdjustmentWorkspace.tsx` | Post GL Entry | `/api/inventory/adjustments/:id/post-gl`| POST | AccountingEngine (M30) | `accounting_entries` | Scrap expense posted to VAS 632/1381 | PASS | Adjustment & M30 GL | CORE-CRITICAL |

---

### M21 — Internal Stock Transfers & Inter-Branch Logistics
*Workspace: `WS11_INVENTORY` | Route: `/transfers` | Component: `M21InternalTransfersWorkspace.tsx` | Authority: InventoryService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M21-F01 | Transfer Request Ingestion | `/transfers` | `M21InternalTransfersWorkspace.tsx` | Create Transfer | `/api/inventory/transfers` | POST | InventoryService | `stock_transfers` | Transfer order created between warehouses | PENDING | Inventory Transfers | CORE-CRITICAL |
| M21-F02 | Source Warehouse Dispatch | `/transfers` | `M21InternalTransfersWorkspace.tsx` | Dispatch Goods | `/api/inventory/transfers/:id/dispatch` | POST | InventoryService (M17) | `stock_balances` | Source stock decremented, in-transit incremented | PENDING | Transfers & M17 | CORE-CRITICAL |
| M21-F03 | In-Transit Tracking | `/transfers` | `M21InternalTransfersWorkspace.tsx` | View In-Transit | `/api/inventory/transfers/in-transit` | GET | InventoryService | `stock_transfers` | Real-time goods in transit visibility | PENDING | Logistics & In-Transit | BUSINESS |
| M21-F04 | Destination Warehouse Receipt | `/transfers` | `M21InternalTransfersWorkspace.tsx` | Receive Transfer | `/api/inventory/transfers/:id/receive` | POST | InventoryService (M17) | `stock_balances` | Destination stock credited strictly via M17 | PENDING | Transfers & M17 | CORE-CRITICAL |

---

### M22 — Lot & Batch Expiry Tracking (FEFO/FIFO)
*Workspace: `WS10_LOTS` | Route: `/lots` | Component: `M22LotsBatchesWorkspace.tsx` | Authority: SerialEngine / InventoryService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M22-F01 | Lot & Expiry Registration | `/lots` | `M22LotsBatchesWorkspace.tsx` | Register Lot | `/api/inventory/lots` | POST | SerialEngine | `lots` | Lot created with Mfg and Expiry dates | PASS | Lot Tracking | CORE-CRITICAL |
| M22-F02 | FEFO Picking Recommendation | `/lots` | `M22LotsBatchesWorkspace.tsx` | Get FEFO Order | `/api/inventory/lots/fefo-simulate`| POST | SerialEngine | `lots` sorting | Earliest expiry lots suggested for picking | PASS | Picking Optimization | CORE-CRITICAL |
| M22-F03 | Expiry Quarantine Guard | `/lots` | `M22LotsBatchesWorkspace.tsx` | Quarantine Expired | `/api/inventory/lots/:id/status` | PATCH | SerialEngine | `lots.status` | Expired batches locked from sales allocation | PASS | Quality & Compliance | CORE-CRITICAL |
| M22-F04 | Backward Lot Traceability | `/lots` | `M22LotsBatchesWorkspace.tsx` | Trace Lot | `/api/inventory/lots/:id/trace` | GET | TraceabilityAggregationService | Lot Genealogy | Full supplier PO to customer SO trace tree (2026-09-29) | PASS | Traceability & Recall | CORE-CRITICAL |
| M22-F05 | Upstream Origin Lineage Tree (F360-02) | `/lots` | `LotsBatchesTraceabilityTab.tsx` | View Origin | `/api/inventory/lots/:id/trace-upstream` | GET | TraceabilityAggregationService | Graph Read-Only | Supplier -> PO -> GRN -> Inbound QC verified (2026-09-29) | PASS | Upstream Lineage | CORE-CRITICAL |
| M22-F06 | Downstream Consumption Tree (F360-03) | `/lots` | `LotsBatchesTraceabilityTab.tsx` | View Downstream | `/api/inventory/lots/:id/trace-downstream` | GET | TraceabilityAggregationService | Graph Read-Only | MO -> BOM -> FG Lot -> SO -> Customer verified (2026-09-29) | PASS | Downstream Lineage | CORE-CRITICAL |
| M22-F07 | Unified Chronological Timeline (F360-04) | `/lots` | `LotsBatchesTraceabilityTab.tsx` | View Timeline | `/api/inventory/lots/:id/ledger` | GET | TraceabilityAggregationService | Timeline Read-Only | Stock ledger + KCS + Delivery merged (2026-09-29) | PASS | Event Timeline | BUSINESS |
| M22-F08 | Quality Dossier & COA M29/M39 (F360-05) | `/lots` | `LotsBatchesTraceabilityTab.tsx` | View Quality | `/api/inventory/lots/:id/trace` | GET | TraceabilityAggregationService | QC Read-Only | Inbound QC parameters & COA specs verified (2026-09-29) | PASS | Quality Compliance | CORE-CRITICAL |
| M22-F09 | Finance & COGS GL Linkage (F360-06) | `/lots` | `LotsBatchesTraceabilityTab.tsx` | View Finance | `/api/inventory/lots/:id/trace` | GET | TraceabilityAggregationService | GL Read-Only | COGS unit cost & M30 GL vouchers matched (2026-09-29) | PASS | Financial Linkage | CORE-CRITICAL |
| M22-F10 | Post-Sales RMA Dossier (F360-07) | `/lots` | `LotsBatchesTraceabilityTab.tsx` | View Returns | `/api/returns` | GET | TraceabilityAggregationService | RMA Read-Only | M15 RMA returns queried strictly read-only (2026-09-29) | PASS | After-Sales & RMA | BUSINESS |
| M22-F11 | Integrity & Conservation Check (F360-08) | `/lots` | `LotsBatchesTraceabilityTab.tsx` | Verify Integrity | `/api/inventory/lots/:id/ledger` | GET | TraceabilityAggregationService | Integrity Read-Only | Zero variance between ledger & physical lot (2026-09-29) | PASS | System Integrity | CORE-CRITICAL |
| M22-F12 | Exposure Simulation (F360-09) | `/lots` | `LotsBatchesTraceabilityTab.tsx` | Simulate Exposure | `/api/inventory/lots/:id/trace` | GET | TraceabilityAggregationService | Simulation Read-Only | Warehouse + Customer exposure calculated (2026-09-29) | PASS | Risk & Exposure | BUSINESS |

---

### M23 — Serial Number & IMEI Lifecycle Tracking
*Workspace: `WS11_SERIALS` | Route: `/serials` | Component: `M23SerialsWorkspace.tsx` | Authority: SerialEngine*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M23-F01 | Serial Number Registration | `/serials` | `M23SerialsWorkspace.tsx` | Register Serials | `/api/serials` | POST | SerialEngine | `serial_numbers` | Unit-level serial numbers generated | PASS | Serial Tracking | CORE-CRITICAL |
| M23-F02 | Serial Movement Traceability | `/serials` | `M23SerialsWorkspace.tsx` | Trace Serial | `/api/serials/:id/history` | GET | SerialEngine | `serial_history` | Complete lifecycle (PO ➔ Bin ➔ SO ➔ Warranty) (2026-09-29) | PASS | Traceability | CORE-CRITICAL |
| M23-F03 | Warranty Status Verification | `/serials` | `M23SerialsWorkspace.tsx` | Check Warranty | `/api/serials/:id/history` | GET | SerialEngine | `serial_numbers` | Active warranty period and repair history | PASS | After-Sales & RMA | BUSINESS-CRITICAL |
| M23-F04 | Duplicate Serial Guard | `/serials` | `M23SerialsWorkspace.tsx` | Probe Duplicate | `/api/serials` | POST | SerialEngine | Unique Constraint | Duplicate serial numbers rejected | PASS | Serial Integrity | CORE-CRITICAL |
| M23-F05 | Serial Unit Barcode & Dossier (F360-01) | `/serials` | `M23SerialsWorkspace.tsx` | Inspect Dossier | `/api/serials/:id/history` | GET | SerialEngine | `serial_history` | GS1-128 barcode + PDF export + full audit history (2026-09-29) | PASS | Serial Dossier | BUSINESS |

---

### M24 — WMS Extended (Wave Picking, LPN, Dock Scheduling)
*Workspace: `WS12_WMS_EXT` | Route: `/wms-extended` | Component: `M24WMSExtendedWorkspace.tsx` | Authority: InventoryService / LogisticsService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M24-F01 | Wave Picking Plan Creation | `/wms-extended` | `M24WMSExtendedWorkspace.tsx` | Create Wave | `/api/wms/wave-picks` | POST | InventoryService | `wave_picks` | Multi-order picking wave generated | PASS | WMS Extended | CORE-CRITICAL |
| M24-F02 | Wave Pick Execution & M17 Confirm| `/wms-extended` | `M24WMSExtendedWorkspace.tsx` | Confirm Pick | `/api/wms/wave-picks/:id/confirm`| POST | InventoryService (M17) | `stock_ledger` | Stock deducted strictly via M17 single writer | PASS | WMS & Inventory M17 | CORE-CRITICAL |
| M24-F03 | LPN Pallet Packaging | `/wms-extended` | `M24WMSExtendedWorkspace.tsx` | Pack LPN Pallet | `/api/wms/lpn` | POST | InventoryService | `lpn`, `lpn_contents` | Pallet carton sealed with License Plate Number | PASS | WMS Extended | CORE-CRITICAL |
| M24-F04 | LPN Atomic Putaway Move | `/wms-extended` | `M24WMSExtendedWorkspace.tsx` | Move LPN | `/api/wms/lpn/move` | POST | InventoryService | `lpn.location_id` | Pallet relocated atomically | PASS | WMS Logistics | CORE-CRITICAL |
| M24-F05 | Dock Appointment Scheduling | `/wms-extended` | `M24WMSExtendedWorkspace.tsx` | Schedule Dock | `/api/wms/docks` | POST | LogisticsService | `dock_appointments` | Truck inbound/outbound slot booked | PASS | WMS & Logistics M36 | BUSINESS-CRITICAL |
| M24-F06 | Dock Check-in & Gate Control | `/wms-extended` | `M24WMSExtendedWorkspace.tsx` | Check-in Truck | `/api/wms/docks/:id/checkin` | POST | LogisticsService | `dock_appointments` | Gate pass validated and bay assigned | PASS | WMS Yard Mgmt | CORE-CRITICAL |

---

### M25 — Manufacturing Execution & BOM (MES)
*Workspace: `WS13_MES` | Route: `/manufacturing` | Component: `ManufacturingWorkspace.tsx` | Authority: ManufacturingEngine / InventoryService (M17) | Live QA Certified: 2026-09-21 (14/14 Invariant Tests PASS)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M25-F01 | Multi-Level BOM Definition | `/manufacturing` | `ManufacturingWorkspace.tsx` | Create BOM | `/api/manufacturing/boms` | POST | ManufacturingEngine | `boms`, `bom_items` | Multi-level engineering bill of materials | PASS | MES Core | CORE-CRITICAL |
| M25-F02 | Work Order (WO) Release | `/manufacturing` | `ManufacturingWorkspace.tsx` | Release WO | `/api/manufacturing/work-orders` | POST | ManufacturingEngine | `work_orders` | Production order scheduled with routing | PASS | MES Core | CORE-CRITICAL |
| M25-F03 | Raw Material Issue to Production | `/manufacturing` | `ManufacturingWorkspace.tsx` | Issue Materials | `/api/manufacturing/work-orders/:id/issue-materials`| POST | InventoryService (M17) | `stock_balances`, `stock_ledger` | Raw materials deducted strictly via M17 | PASS | MES & Inventory M17 | CORE-CRITICAL |
| M25-F04 | Finished Goods Inbound & WIP Close| `/manufacturing` | `ManufacturingWorkspace.tsx` | Complete WO | `/api/manufacturing/work-orders/:id/complete` | POST | InventoryService (M17) | `stock_balances`, `stock_ledger` | Finished goods credited via M17 & COGS M42 | PASS | MES, M17 & Costing M42| CORE-CRITICAL |
| M25-F05 | BOM Version Control Zero-Overwrite| `/manufacturing` | `ManufacturingWorkspace.tsx` | Create New BOM Version | `/api/manufacturing/boms/:id/versions` | POST | ManufacturingEngine | `bom_versions` | Version incremented without overwriting historical baseline | PASS | MES BOM Control | CORE-CRITICAL |
| M25-F06 | Routing & Work Center Std Times | `/manufacturing` | `ManufacturingWorkspace.tsx` | Configure Routing | `/api/manufacturing/routings` | POST | ManufacturingEngine | `routings`, `routing_operations`| Sequence of operations with setup & run standard times | PASS | MES Capacity & Routing | BUSINESS-CRITICAL |
| M25-F07 | Standard MO State Machine Guard | `/manufacturing` | `ManufacturingWorkspace.tsx` | Transition Status | `/api/manufacturing/work-orders/:id/status` | PUT | ManufacturingEngine | `manufacturing_orders.status` | Strict DRAFT->RELEASED->IN_PROGRESS->QC->COMPLETED/CANCELLED | PASS | MES Governance | CORE-CRITICAL |
| M25-F08 | Material Backflush Consumption M17 | `/manufacturing` | `ManufacturingWorkspace.tsx` | Backflush Issue | `/api/manufacturing/work-orders/:id/backflush` | POST | InventoryService (M17) | `stock_transactions`, `stock_ledger`| Automatic issue on completion strictly via M17 single writer | PASS | MES & Inventory M17 | CORE-CRITICAL |
| M25-F09 | Scrap & Yield Variance Tracking | `/manufacturing` | `ManufacturingWorkspace.tsx` | Log Scrap & Yield | `/api/manufacturing/work-orders/:id/report-scrap` | POST | ManufacturingEngine | `production_outputs`, `scrap_logs` | Actual scrap and yield % calculated vs BOM expected scrap | PASS | MES Quality & Cost | BUSINESS-CRITICAL |
| M25-F10 | MRP Planned Order Conversion M26 | `/manufacturing` | `ManufacturingWorkspace.tsx` | Convert MRP Plan | `/api/manufacturing/orders/from-mrp` | POST | ManufacturingEngine | `manufacturing_orders` | Automatic MO created from M26 planned orders with traceability | PASS | MRP M26 to MES M25 | CORE-CRITICAL |
| M25-F11 | QMS Quarantine Hold & Release M39 | `/manufacturing` | `ManufacturingWorkspace.tsx` | Apply/Release QC Hold | `/api/manufacturing/work-orders/:id/qc-hold` | POST | QualityService (M39) | `qc_inspections`, `quality_holds` | WIP/FG quarantined; MO completion blocked until QC release | PASS | QMS M39 & MES M25 | CORE-CRITICAL |
| M25-F12 | FG Lot & Serial Assignment M22/23| `/manufacturing` | `ManufacturingWorkspace.tsx` | Assign Lot/Serials | `/api/manufacturing/work-orders/:id/assign-lot-serial` | POST | MasterDataService (M22/M23) | `product_lots`, `product_serials` | Unique lot/serial generated with full genealogy to input lots | PASS | Traceability M22/M23 | CORE-CRITICAL |
| M25-F13 | Standard vs Actual Cost Recon M42| `/manufacturing` | `ManufacturingWorkspace.tsx` | Audit Cost Variance | `/api/manufacturing/work-orders/:id/cost-variance` | GET | CostingEngine (M42) | Read-only `cost_layers`, `production_costs` | Material usage & labor efficiency variance computed read-only | PASS | Costing M42 & MES M25 | BUSINESS-CRITICAL |
| M25-F14 | Audit Log M02 & DMS Dossier M29 | `/manufacturing` | `ManufacturingWorkspace.tsx` | Archive Manufacturing Dossier | `/api/manufacturing/work-orders/:id/dms-dossier` | POST | ComplianceService (M02/M29) | `audit_logs`, `dms_documents` | Full lifecycle audited in M02 & traveler sealed into M29 DMS | PASS | Governance M02/M29 | CORE-CRITICAL |

---

### M26 — Supply Chain Planning & MRP (SCP)
*Workspace: `WS14_SCM` | Route: `/supply-chain` | Component: `SupplyChainWorkspace.tsx` | Authority: ScmPlanningEngine*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M26-F01 | Demand Forecasting Engine | `/supply-chain` | `SupplyChainWorkspace.tsx` | Generate Forecast | `/api/scm/forecasts` | POST | ScmPlanningEngine | `scm_forecasts` | Statistical demand forecast generated | PASS | Supply Chain Planning | BUSINESS-CRITICAL |
| M26-F02 | Material Requirements Planning (MRP)| `/supply-chain` | `SupplyChainWorkspace.tsx` | Run MRP | `/api/scm/mrp/run` | POST | ScmPlanningEngine | `mrp_runs`, `mrp_results`| Net component requirements calculated | PASS | MRP & Procurement | CORE-CRITICAL |
| M26-F03 | Purchase Requisition Delegation | `/supply-chain` | `SupplyChainWorkspace.tsx` | Generate PRs | `/api/scm/purchase-requisitions`| POST | PurchaseEngine (M08) | `purchase_requisitions` | Automatic PRs created for M08 Purchasing | PASS | MRP to P2P M08 | CORE-CRITICAL |
| M26-F04 | Master Production Schedule (MPS) | `/supply-chain` | `SupplyChainWorkspace.tsx` | Schedule MPS | `/api/scm/mps` | POST | ScmPlanningEngine | `mps_schedules` | Production capacity balanced against demand | PASS | MES & SCM | BUSINESS-CRITICAL |
| M26-F05 | Real Demand Netting from M13 SO & M17 Inventory Balances | `/supply-chain` | `SupplyChainWorkspace.tsx` | Calculate Net Req | `/api/scm/mrp/net-requirements` | GET | ScmPlanningEngine | `mrp_results` | Gross demand from SO/Forecast minus available on-hand stock | PASS | SCM Netting Engine | CORE-CRITICAL |
| M26-F06 | Multi-Level BOM Explosion from M25 MES | `/supply-chain` | `SupplyChainWorkspace.tsx` | Explode BOM | `/api/scm/mrp/bom-explosion` | POST | ScmPlanningEngine | `mrp_results` | Multi-level dependent component demands calculated with scrap rate | PASS | SCM & MES BOM M25 | CORE-CRITICAL |
| M26-F07 | Automated PR Delegation to M08 PO Single-Writer | `/supply-chain` | `SupplyChainWorkspace.tsx` | Delegate to PO | `/api/scm/purchase-requisitions/:id/delegate-po` | POST | PurchaseEngine (M08) | `purchase_orders` | PR converted to official M08 PO via Single-Writer gateway | PASS | P2P Procurement M08 | CORE-CRITICAL |
| M26-F08 | Automated MO Suggestion to M25 Work Order Single-Writer | `/supply-chain` | `SupplyChainWorkspace.tsx` | Delegate to MO | `/api/scm/mo-suggestions` | POST | ManufacturingEngine (M25) | `manufacturing_orders` | MO suggestion converted to official M25 MO via Single-Writer gateway | PASS | MES Production M25 | CORE-CRITICAL |
| M26-F09 | Lead Time & Dynamic Safety Stock Guard from M09/M07 | `/supply-chain` | `SupplyChainWorkspace.tsx` | Guard Safety Stock | `/api/scm/safety-stock/guard` | GET | ScmPlanningEngine | `products`, `suppliers` | Lead time backward scheduling with lead time violation detection | PASS | SCM Lead Time Engine | BUSINESS-CRITICAL |
| M26-F10 | MRP Exception Messages Engine (Shortage, Past Due, Excess) | `/supply-chain` | `SupplyChainWorkspace.tsx` | View Exceptions | `/api/scm/mrp/exceptions` | GET | ScmPlanningEngine | `mrp_exceptions` | Real-time classification of supply chain risks and stockouts | PASS | Exception Management | CORE-CRITICAL |
| M26-F11 | Full Pegging Lineage Traceability to Source Sales Order M13 | `/supply-chain` | `SupplyChainWorkspace.tsx` | Trace Pegging | `/api/scm/mrp/pegging` | GET | ScmPlanningEngine | `sales_orders`, `mrp_results`| Direct lineage trace from component shortage to customer SO | PASS | O2C Traceability M13 | BUSINESS-CRITICAL |
| M26-F12 | Regenerative vs Net-Change Idempotent MRP Run | `/supply-chain` | `SupplyChainWorkspace.tsx` | Trigger Net-Change | `/api/scm/mrp/run` | POST | ScmPlanningEngine | `mrp_runs` | Idempotent execution preventing duplicate runs within 30s | PASS | MRP Execution Engine | CORE-CRITICAL |
| M26-F13 | Cryptographic Audit Trail M02 & Snapshot Vaulting M29 DMS | `/supply-chain` | `SupplyChainWorkspace.tsx` | Vault Dossier | `/api/scm/mrp/runs/:id/vault-dms` | POST | ScmPlanningEngine | `dms_documents`, `audit_logs` | SHA-256 sealed MRP planning dossier archived in M29 with M02 audit | PASS | Compliance & DMS | COMPLIANCE-CRITICAL |

---

### M27 — Enterprise Asset Maintenance (EAM)
*Workspace: `WS15_EAM` | Route: `/assets` (Alias: `/eam`) | Component: `AssetMaintenanceWorkspace.tsx` | Authority: EamService / QualityService | Live QA Certified: 2026-09-22 (13/13 Invariant Tests PASS)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M27-F01 | Fixed Asset Register | `/assets` | `AssetMaintenanceWorkspace.tsx` | Register Asset | `/api/eam/assets` | POST | EamService | `fixed_assets` | Machinery/Asset recorded with specs | PASS | EAM & Assets | CORE-CRITICAL |
| M27-F02 | Preventive Maintenance Schedule | `/assets` | `AssetMaintenanceWorkspace.tsx` | Schedule PM | `/api/eam/maintenance-schedules`| POST | EamService | `maintenance_schedules`| Recurring maintenance calendar active | PASS | Preventive Maint | BUSINESS-CRITICAL |
| M27-F03 | Maintenance Work Order & Spare Parts| `/assets` | `AssetMaintenanceWorkspace.tsx` | Issue Maint WO | `/api/eam/work-orders` | POST | InventoryService (M17) | `stock_balances` | Spare parts deducted strictly via M17 | PASS | EAM & Inventory M17 | CORE-CRITICAL |
| M27-F04 | Asset Depreciation Sync to GL | `/assets` | `AssetMaintenanceWorkspace.tsx` | Run Depreciation | `/api/eam/assets/depreciation` | POST | AccountingEngine (M30) | `accounting_entries` | Monthly depreciation posted to VAS 214/642 | PASS | Assets & Finance M30 | CORE-CRITICAL |
| M27-F05 | Asset Criticality Matrix (Tier A/B/C) & Hierarchy | `/assets` | `AssetMaintenanceWorkspace.tsx` | Classify Criticality | `/api/eam/assets` | POST | EamService | `fixed_assets.criticality` | Assets categorized Tier A/B/C for downtime risk prevention | PASS | Asset Master & Risk | CORE-CRITICAL |
| M27-F06 | Multi-Trigger PM Schedules (Calendar/Meter/Condition) | `/assets` | `AssetMaintenanceWorkspace.tsx` | Create Trigger Plan | `/api/eam/maintenance-schedules` | POST | EamService | `maintenance_schedules.triggerType` | Supports time intervals, meter run hours, and sensor thresholds | PASS | PM Engine | CORE-CRITICAL |
| M27-F07 | Strict Work Order State Machine Guard | `/assets` | `AssetMaintenanceWorkspace.tsx` | Transition Status | `/api/eam/work-orders/:id/status` | PUT | EamService | `maintenance_work_orders.status` | OPEN -> IN_PROGRESS -> WAITING_PART -> COMPLETED terminal guard | PASS | EAM WO Governance | CORE-CRITICAL |
| M27-F08 | Incident WO Auto-Trigger from M38 Service Desk | `/assets` | `AssetMaintenanceWorkspace.tsx` | Log Incident WO | `/api/eam/work-orders` | POST | EamService / TaskManager | `maintenance_work_orders` | WO created with sourceModule M38 and INC reference code | PASS | Cross-Module M38/M27 | CORE-CRITICAL |
| M27-F09 | RMA Repair Routing Work Order from M15 | `/assets` | `AssetMaintenanceWorkspace.tsx` | Route RMA Repair | `/api/eam/work-orders` | POST | EamService / RmaService | `maintenance_work_orders` | WO created with sourceModule M15 and RMA reference code | PASS | Cross-Module M15/M27 | CORE-CRITICAL |
| M27-F10 | Single-Writer Spare Part Issue via M17 Inventory | `/assets` | `AssetMaintenanceWorkspace.tsx` | Issue Part to WO | `/api/eam/work-orders/:id/issue-parts` | POST | InventoryService (M17) | `stock_transactions`, `stock_ledger` | Deducts stock strictly via M17 InventoryService single writer | PASS | Inventory M17 & EAM | CORE-CRITICAL |
| M27-F11 | Shortage Spare Part Delegation to M08 Purchase Order | `/assets` | `AssetMaintenanceWorkspace.tsx` | Delegate to PO | `/api/eam/spare-parts/purchase-order` | POST | PurchaseEngine (M08) | `purchase_orders`, `purchase_order_items` | PO auto-created for missing spare parts via M08 Single-Writer | PASS | Procurement M08 & EAM | CORE-CRITICAL |
| M27-F12 | Reliability RAMS Analytics (MTBF / MTTR / OEE) | `/assets` | `AssetMaintenanceWorkspace.tsx` | Compute Reliability | `/api/eam/analytics/reliability` | GET | EamService | Reliability metrics | Calculates MTBF, MTTR, Availability %, and Tier breakdown | PASS | Reliability Analytics | BUSINESS-CRITICAL |
| M27-F13 | Audit Logging M02 & Maintenance Dossier Archival M29 | `/assets` | `AssetMaintenanceWorkspace.tsx` | Vault Dossier | `/api/eam/work-orders/:id/complete` | POST | ComplianceService (M02/M29) | `audit_logs`, `dms_documents` | Work order sign-off logged in M02 and archived to M29 DMS vault | PASS | Governance M02/M29 | CORE-CRITICAL |

---

### M28 — Human Resources & Payroll Management
*Workspace: `WS26_HR` | Route: `/hr` | Component: `HRWorkspace.tsx` | Authority: HrService / FinanceEngine*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M28-F01 | Employee Profile & Onboarding | `/hr` | `HRWorkspace.tsx` | Register Employee | `/api/hr/employees` | POST | HrService | `employees` | Employee profile, department, and salary grade | PENDING | HR Core | CORE-CRITICAL |
| M28-F02 | Time & Attendance Ingestion | `/hr` | `HRWorkspace.tsx` | Log Timesheet | `/api/hr/timesheets` | POST | HrService | `timesheets` | Clock-in/out records and shift overtime | PENDING | Attendance | BUSINESS-CRITICAL |
| M28-F03 | Payroll Calculation Run | `/hr` | `HRWorkspace.tsx` | Run Payroll | `/api/hr/payroll/run` | POST | HrService | `payroll_runs`, `payslips` | PIT, Social Insurance, Net salary computed | PENDING | Payroll Engine | CORE-CRITICAL |
| M28-F04 | Payroll GL Double-Entry Voucher | `/hr` | `HRWorkspace.tsx` | Approve Payroll GL | `/api/hr/payroll/approve` | POST | AccountingEngine (M30) | `accounting_entries` | Salary & Insurance voucher (642/334/338) | PENDING | HR & Finance M30 | CORE-CRITICAL |

---

### M29 — Digital Document Management (DMS) & Secure Vault
*Workspace: `WS28_DMS` | Route: `/dms` (Alias: `/digital-dms`) | Component: `DMSWorkspace.tsx` | Authority: DmsService / SecurityService | Live QA Certified: 2026-09-24 (14/14 Invariant Tests PASS)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M29-F01 | Cryptographic Document Vault | `/dms` | `DMSWorkspace.tsx` | Upload Document | `/api/dms/vault` | POST | DmsService | `dms_documents` | Document stored with SHA-256 hash | PASS | DMS Vault | CORE-CRITICAL |
| M29-F02 | Document Retention Policy Guard | `/dms` | `DMSWorkspace.tsx` | Set Retention | `/api/dms/retention` | PUT | DmsService | `retention_policies` | Legal retention locked against deletion | PASS | Compliance & DMS | BUSINESS-CRITICAL |
| M29-F03 | E-Signature & Certificate Sealing | `/dms` | `DMSWorkspace.tsx` | Sign Document | `/api/dms/documents/:id/sign` | POST | DmsService | `e_signatures` | Digitally signed and cryptographically sealed | PASS | Digital Signatures | CORE-CRITICAL |
| M29-F04 | Cross-Module Document Archiving | `/dms` | `DMSWorkspace.tsx` | Archive Dossier | `/api/dms/archive` | POST | DmsService | `dms_archives` | Invoices/COAs archived with full provenance | PASS | DMS Integration | BUSINESS |
| M29-F05 | Entity Linker & Provenance Guard | `/dms` | `DMSWorkspace.tsx` | Link to Entity | `/api/dms/vault` | POST | DmsEntityLinker | `dms_documents` | Validates entity existence across M08, M31, M32 | PASS | DMS Entity Linking | CORE-CRITICAL |
| M29-F06 | Legal Hold Immutability Shield | `/dms` | `DMSWorkspace.tsx` | Toggle Legal Hold | `/api/dms/retention` | PUT | DmsService | `dms_documents` | Rejects disposal requests while locked | PASS | Legal Compliance | CORE-CRITICAL |
| M29-F07 | Zero-Overwrite Versioning | `/dms` | `DMSWorkspace.tsx` | Supersede Version | `/api/dms/vault` | POST | DmsService | `dms_documents` | Increments version (v1.0 -> v2.0) and marks old SUPERSEDED | PASS | DMS Versioning | BUSINESS-CRITICAL |
| M29-F08 | Cryptographic Integrity Audit | `/dms` | `DMSWorkspace.tsx` | Batch Verify | `/api/dms/documents/batch-verify` | POST | DmsService | Audit Verification | 100% hash verification against stored SHA-256 | PASS | Security & Audit | CORE-CRITICAL |
| M29-F09 | Outbox Event Emission (M05) | `/dms` | `DMSWorkspace.tsx` | Seal Document | `/api/dms/documents/:id/sign` | POST | EventBus | `outbox_events` | Emits dms.document.sealed.v1 idempotently | PASS | Event Driven M05 | CORE-CRITICAL |
| M29-F10 | Security Classification RBAC | `/dms` | `DMSWorkspace.tsx` | Filter by Level | `/api/dms/documents` | GET | DmsService | RBAC Guard | Redacts RESTRICTED documents for non-admins | PASS | Security RBAC | CORE-CRITICAL |
| M29-F11 | Missing Attachments Audit Scanner | `/dms` | `DMSWorkspace.tsx` | Scan Reports | `/api/dms/reports/missing-attachments` | GET | DmsService | Advisory Report | Identifies unattached invoices/POs without blocking ops | PASS | Audit Advisory | BUSINESS-CRITICAL |
| M29-F12 | Controlled Disposal with Tombstone | `/dms` | `DMSWorkspace.tsx` | Request Disposal | `/api/dms/documents/:id/request-disposal` | POST | DmsService (M28 link) | `dms_documents` | Preserves audit tombstone in M02 after disposal | PASS | Governance & Audit | CORE-CRITICAL |
| M29-F13 | Consumer Attachment Read Gateway | `/dms` | `DMSWorkspace.tsx` | Fetch Attachments | `/api/dms/entity/:type/:id/attachments` | GET | DmsService | Read query | Returns verified attachments for M06, M13, M31 consumers | PASS | Cross-Module Read | BUSINESS-CRITICAL |

---

### M30 — General Ledger & Financial Accounting (VAS Authority & Single-Writer)
*Workspace: `WS18_FINANCE` | Route: `/finance` | Component: `M30GeneralLedgerWorkspace.tsx` | Authority: AccountingEngine (Sole Authority for General Ledger & VAS Double-Entry) | Live QA Certified: 2026-09-23 (10/10 Invariant Tests PASS)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M30-F01 | Chart of Accounts (COA) Master | `/finance` | `M30GeneralLedgerWorkspace.tsx` | View COA | `/api/finance/accounts` | GET | AccountingEngine | `chart_of_accounts` | Standard Vietnamese Accounting System (VAS) COA 1xx-9xx | PASS | Finance Master | CORE-CRITICAL |
| M30-F02 | Single-Writer GL Journal Post | `/finance` | `M30GeneralLedgerWorkspace.tsx` | Post Voucher | `/api/finance/gl/entries` | POST | AccountingEngine | `accounting_entries` | Strict Dr = Cr double-entry validation & Dr != Cr check | PASS | General Ledger | CORE-CRITICAL |
| M30-F03 | Trial Balance (TT200) Engine | `/finance` | `M30GeneralLedgerWorkspace.tsx` | Generate TB | `/api/finance/accounts` | GET | AccountingEngine | Read-only calculation | Balanced Trial Balance with category breakdown | PASS | Financial Reporting | CORE-CRITICAL |
| M30-F04 | Fiscal Period Close & Lock Guard | `/finance` | `M30GeneralLedgerWorkspace.tsx` | Close Period | `/api/finance/period-close` | POST | AccountingEngine | `period_closing_runs` | Period locked; retroactive writes prohibited | PASS | Finance Governance | CORE-CRITICAL |
| M30-F05 | VAS 911 Period Closing Engine | `/finance` | `M30GeneralLedgerWorkspace.tsx` | Execute 911 Run | `/api/finance/period-close` | POST | AccountingEngine | `accounting_entries`, `period_closing_runs` | Zeroes 5xx/6xx/7xx/8xx accounts to TK 911 & updates 421 | PASS | Period Closing M30 | CORE-CRITICAL |
| M30-F06 | BCTC VAS Package (B01, B02, B03, B05) | `/finance` | `M30GeneralLedgerWorkspace.tsx` | Generate BCTC | `/api/finance/financial-statements` | GET | AccountingEngine | BCTC Report Engine | Computes B01-DN, B02-DN, B03-DN, B05-DN per TT200/2014 | PASS | BCTC Reporting | CORE-CRITICAL |
| M30-F07 | Cost Center & Department Summary | `/finance` | `M30GeneralLedgerWorkspace.tsx` | View Cost Center Report | `/api/finance/reports/cost-center-summary` | GET | AccountingEngine | Multi-dimensional aggregation | Enterprise expense distribution across cost centers & deps | PASS | Cost Accounting | BUSINESS-CRITICAL |
| M30-F08 | Storno Reversal Journaling | `/finance` | `M30GeneralLedgerWorkspace.tsx` | Reverse Journal | `/api/finance/gl/reversal` | POST | AccountingEngine | `accounting_entries` | Generates opposing Storno journal, preserves immutability | PASS | GL Audit & Storno | CORE-CRITICAL |
| M30-F09 | Real-Time All-Module Cross-Recon | `/finance` | `M30GeneralLedgerWorkspace.tsx` | Run Cross-Recon | `/api/finance/reports/cross-reconciliation` | GET | AccountingEngine | Cross-Subledger Audit | Reconciles GL 131, 331, 156, 1111/1121 vs Sub-Ledgers | PASS | Financial Audit | CORE-CRITICAL |
| M30-X01 | Single-Writer Invariant Guard | `/finance` | `M30GeneralLedgerWorkspace.tsx` | Direct GL Probe | `/api/finance/gl/entries` | POST | AccountingEngine | Boundary Lock | All external writes rejected; M30 is sole GL writer | PASS | Financial Integrity | CORE-CRITICAL |
| M30-X02 | Closed-Period Guard | `/finance` | `M30GeneralLedgerWorkspace.tsx` | Post to Closed Period | `/api/finance/gl/entries` | POST | AccountingEngine | Closed Period Guard | Rejects writes into closed fiscal periods with HTTP 403 FORBIDDEN | PASS | Financial Integrity | CORE-CRITICAL |

---

### M31 — Invoices AR / AP Management
*Workspace: `WS19_INVOICES` | Route: `/invoices` | Component: `M31InvoicesArApWorkspace.tsx` | Authority: InvoiceService / AccountingEngine (M30)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M31-F01 | Accounts Receivable (AR) Invoices | `/invoices` | `M31InvoicesArApWorkspace.tsx` | View AR Invoices | `/api/invoices/ar` | GET | InvoiceEngine | `invoices` (AR) | Customer e-invoices with payment status | PASS | AR Management | CORE-CRITICAL |
| M31-F02 | Accounts Payable (AP) Invoices | `/invoices` | `M31InvoicesArApWorkspace.tsx` | Register AP Bill | `/api/invoices/ap` | POST | InvoiceEngine | `invoices` (AP) | Vendor bills registered for 3-way match | PASS | AP Management | CORE-CRITICAL |
| M31-F03 | Invoice GL Posting Delegation | `/invoices` | `M31InvoicesArApWorkspace.tsx` | Post to GL | `/api/invoices/:id/post-gl` | POST | AccountingEngine (M30) | `accounting_entries` | AR/AP posted to GL (131/331) via M30 | PASS | Invoices & Finance M30 | CORE-CRITICAL |
| M31-F04 | AR/AP Aging Schedule Analysis | `/invoices` | `M31InvoicesArApWorkspace.tsx` | View Aging Report | `/api/invoices/aging` | GET | InvoiceService | Aging Metrics | 0-30, 31-60, 61-90, 90+ days aging breakdown | PASS | Cash Flow & Credit | BUSINESS-CRITICAL |
| M31-F05 | E-Invoice Regulatory Issuance & Decree 123 | `/invoices` | `M31InvoicesArApWorkspace.tsx` | Issue E-Invoice HSM | `/api/invoices/:id/issue` | POST | InvoiceService | `invoices` (ISSUED) | Cloud HSM signature, CQT code generated, becomes legally immutable | PASS | E-Invoicing & Legal | CORE-CRITICAL |
| M31-F06 | 3-Way Match AP Invoices ↔ PO/GR | `/invoices` | `M31InvoicesArApWorkspace.tsx` | Perform 3-Way Match | `/api/invoices/:id/3way-match` | POST | InvoiceService / M08 | 3-Way Match Audit | Reconciles invoice qty/price vs PO and Warehouse GRN within tolerance | PASS | AP & Procurement M08 | CORE-CRITICAL |
| M31-F07 | Partial Payment Tracking & Allocation | `/invoices` | `M31InvoicesArApWorkspace.tsx` | Record Partial Payment | `/api/invoices/:id/payments` | POST | InvoiceService / M32 | `payments`, `invoices` | Multi-installment tracking, updates status to PARTIAL/PAID, GL post via M30 | PASS | Treasury & Cash M32 | BUSINESS-CRITICAL |
| M31-F08 | Credit Note AR Debt Offset | `/invoices` | `M31InvoicesArApWorkspace.tsx` | Offset Credit Note | `/api/invoices/:id/offset-credit-note` | POST | InvoiceService / M15 | `payments`, `credit_notes` | Deducts AR debt using RMA Credit Note, posts VAS 521/131 via M30 | PASS | Sales RMA & Debt M15 | BUSINESS-CRITICAL |
| M31-F09 | Immutable Cancellation & Reversal Posting | `/invoices` | `M31InvoicesArApWorkspace.tsx` | Cancel & Reverse | `/api/invoices/:id/cancel` | POST | InvoiceService / M30 | `invoices`, `accounting_entries` | Cancels invoice safely with automated GL reversal entry in M30 | PASS | GL Audit & Legal | CORE-CRITICAL |
| M31-F10 | VAT Tax Declaration Mẫu 01/GTGT | `/invoices` | `M31InvoicesArApWorkspace.tsx` | Generate VAT Report | `/api/invoices/tax-declaration` | GET | InvoiceService | VAT Summary Report | Input/output VAT net reconciliation and TT80 Mẫu 01/GTGT data | PASS | Tax Engine Authority | CORE-CRITICAL |
| M31-F11 | Automated Dunning Reminders & VietQR | `/invoices` | `M31InvoicesArApWorkspace.tsx` | Generate Dunning Notice | `/api/invoices/:id/dunning` | POST | InvoiceService | Dunning notice & QR | Generates official overdue dunning notice with dynamic NAPAS 247 VietQR | PASS | AR Debt Collection | BUSINESS-CRITICAL |
| M31-F12 | E-Invoice DMS Archiving & Audit Logs | `/invoices` | `M31InvoicesArApWorkspace.tsx` | Archive to DMS | `/api/invoices/:id/archive-dms` | POST | M02 / M29 DMS | DMS Documents & Audit | Archives legal XML/PDF to DMS repository and logs audit trail via M02 | PASS | DMS M29 & Audit M02 | BUSINESS-CRITICAL |

---

### M32 — Payments & Treasury Management
*Workspace: `WS20_PAYMENTS` (Alias: `WS07_PAYMENTS`) | Route: `/payments` | Component: `M32PaymentsTreasuryWorkspace.tsx` | Authority: TreasuryService / AccountingEngine (M30 Single-Writer) | Live QA Certified: 2026-09-23 (23/23 Invariant Tests PASS)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M32-F01 | Cash & Bank Account Register | `/payments` | `M32PaymentsTreasuryWorkspace.tsx` | View Account List | `/api/treasury/bank-accounts` | GET | TreasuryService | `bank_accounts` | Real-time cash and bank account balances & GL codes | PASS | Treasury Core | CORE-CRITICAL |
| M32-F02 | Receipt Voucher (01-TT) Creation | `/payments` | `M32PaymentsTreasuryWorkspace.tsx` | Create Receipt Voucher | `/api/treasury/vouchers` | POST | TreasuryService | `cash_vouchers` | PT-2026-xxxx voucher created in PENDING_APPROVAL status | PASS | AR & Treasury | CORE-CRITICAL |
| M32-F03 | Payment Voucher (02-TT) & Overdraft | `/payments` | `M32PaymentsTreasuryWorkspace.tsx` | Create Payment Voucher | `/api/treasury/vouchers` | POST | TreasuryService | `cash_vouchers`, `bank_accounts` | Overdraft guard blocks negative balance transactions | PASS | AP & Treasury | CORE-CRITICAL |
| M32-F04 | CFO Approval & Single-Writer GL Post | `/payments` | `M32PaymentsTreasuryWorkspace.tsx` | Approve Voucher | `/api/treasury/vouchers/:id/approve` | POST | TreasuryService / M30 | `cash_vouchers`, `accounting_entries` | Balance updated & double-entry GL posted via M30 Single-Writer | PASS | GL & Governance M30 | CORE-CRITICAL |
| M32-F05 | Internal Fund Transfer (Cash/Bank) | `/payments` | `M32PaymentsTreasuryWorkspace.tsx` | Execute Transfer | `/api/treasury/transfers` | POST | TreasuryService / M30 | `treasury_transfers`, `bank_accounts` | Source/dest balances updated & balanced GL transfer posted | PASS | Liquidity Operations | CORE-CRITICAL |
| M32-F06 | Central Treasury Gateway (Disburse) | `/payments` | `M32PaymentsTreasuryWorkspace.tsx` | External Disbursement | `/api/treasury/gateway/disburse` | POST | TreasuryService | `cash_vouchers` | Single-point payout for M14, M15, M28, M08 with origin tracking | PASS | Central Gateway M32 | CORE-CRITICAL |
| M32-F07 | Central Treasury Gateway (Collect) | `/payments` | `M32PaymentsTreasuryWorkspace.tsx` | External Collection | `/api/treasury/gateway/collect` | POST | TreasuryService | `cash_vouchers` | Single-point collection for M13, M16, M31 with origin tracking | PASS | Central Gateway M32 | CORE-CRITICAL |
| M32-F08 | BTC Regulatory Forms (01-TT & 02-TT) | `/payments` | `M32PaymentsTreasuryWorkspace.tsx` | Print BTC Form | `/api/treasury/vouchers/:id/printable-form` | GET | TreasuryService | Regulatory Print Engine | Official Circular 200/133 layout with 5 signatures & words | PASS | Regulatory Compliance | CORE-CRITICAL |
| M32-F09 | Dynamic VietQR Payment Integration | `/payments` | `M32PaymentsTreasuryWorkspace.tsx` | Generate VietQR | `/api/treasury/vouchers/:id/vietqr` | GET | TreasuryService | VietQR NAPAS 247 | Standardized VietQR payload & image for rapid collection | PASS | Digital Payments | BUSINESS-CRITICAL |
| M32-F10 | Voucher Cancellation & Audit Rollback | `/payments` | `M32PaymentsTreasuryWorkspace.tsx` | Cancel Voucher | `/api/treasury/vouchers/:id/cancel` | POST | TreasuryService / M02 | `cash_vouchers`, `bank_accounts`, `audit_logs` | Status CANCELLED, balances restored & M02 SHA-256 audit logged | PASS | Audit & Rollback M02 | CORE-CRITICAL |
| M32-X01 | Single-Writer Invariant Guard | `/payments` | `M32PaymentsTreasuryWorkspace.tsx` | Direct GL Post Probe | `/api/treasury/vouchers/:id/approve` | POST | AccountingEngine (M30) | Boundary Lock | All cash GL mutations route strictly via M30 single writer | PASS | GL & Governance M30 | CORE-CRITICAL |

---

### M33 — Bank Reconciliation & VietQR Electronic Feeds
*Workspace: `WS21_BANK` | Route: `/bank-reconciliation` | Component: `M33BankReconciliationWorkspace.tsx` | Authority: BankReconciliationEngine (Delegates to M32 Treasury & M30 GL)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M33-F01 | Bank Account Register | `/bank-reconciliation` | `M33BankReconciliationWorkspace.tsx` | Register Bank Account | `/api/bank/accounts` | GET / POST | BankReconciliationEngine | `bank_accounts` | Bank master record and GL account 1121 linked | PASS | Banking Master | CORE-CRITICAL |
| M33-F02 | MT940 / CSV Idempotent Statement Import | `/bank-reconciliation` | `M33BankReconciliationWorkspace.tsx` | Import Statement | `/api/bank/statements/import` | POST | BankReconciliationEngine | `bank_transactions` | Electronic statement ingested; duplicate imports skipped via checksum | PASS | Bank Ingestion | CORE-CRITICAL |
| M33-F03 | Multi-Criteria Automated Reconciliation | `/bank-reconciliation` | `M33BankReconciliationWorkspace.tsx` | Run Auto-Reconcile | `/api/bank/statements/auto-reconcile` | POST | BankReconciliationEngine | `bank_transactions.status` | Auto-matches transactions with Invoices/Vouchers by Ref/Memo/Amount | PASS | Reconciliation | CORE-CRITICAL |
| M33-F04 | Discrepancy Ledger & Unmatched Items | `/bank-reconciliation` | `M33BankReconciliationWorkspace.tsx` | View Discrepancies | `/api/bank/unmatched` | GET | BankReconciliationEngine | `bank_transactions` | Displays in-transit deposits, unrecorded charges, and bank variances | PASS | Cash Audit | BUSINESS-CRITICAL |
| M33-F05 | Dynamic VietQR NAPAS 247 Generator | `/bank-reconciliation` | `M33BankReconciliationWorkspace.tsx` | Generate VietQR | `/api/bank/vietqr/generate` | POST | BankReconciliationEngine | EMVCo Payload | Generates standard VietQR code with transaction memo & CRC16 checksum | PASS | Digital Payments | BUSINESS-CRITICAL |
| M33-F06 | VietQR Webhook & M32 Auto-Receipt Post | `/bank-reconciliation` | `M33BankReconciliationWorkspace.tsx` | Webhook Trigger | `/api/bank/webhook/vietqr` | POST | TreasuryService (M32) / M30 | `cash_vouchers`, `invoices` | Webhook creates official 01-TT Receipt Voucher via M32 & posts M30 GL | PASS | Central Gateway M32 | CORE-CRITICAL |
| M33-F07 | Invoice & Voucher Auto-Match (AR/AP) | `/bank-reconciliation` | `M33BankReconciliationWorkspace.tsx` | Auto-Match Invoices | `/api/bank/statements/auto-reconcile` | POST | BankReconciliationEngine | `invoices.paymentStatus` | Invoices marked PAID and payment links established atomically | PASS | AR/AP Clearing | CORE-CRITICAL |
| M33-F08 | Manual Match, Override & Unmatch | `/bank-reconciliation` | `M33BankReconciliationWorkspace.tsx` | Manual Match / Unmatch | `/api/bank/statements/manual-match` | POST | BankReconciliationEngine / M02 | `bank_transactions`, `audit_logs` | Manual override executed and full tamper-evident audit logged to M02 | PASS | Audit & Override | CORE-CRITICAL |
| M33-F09 | Form 08-TT Reconciliation Statement | `/bank-reconciliation` | `M33BankReconciliationWorkspace.tsx` | Generate Form 08-TT | `/api/bank/reconciliation-report` | GET | BankReconciliationEngine | Regulatory Report | Produces official Circular 200/2014/TT-BTC Form 08-TT balanced statement | PASS | Regulatory Compliance | CORE-CRITICAL |
| M33-X01 | Single-Writer Invariant & Boundary Guard | `/bank-reconciliation` | `M33BankReconciliationWorkspace.tsx` | Direct GL Post Probe | `/api/bank/statements/manual-match` | POST | AccountingEngine (M30) | Boundary Lock | Prohibits direct `accounting_entries` write; routes solely via M32/M30 | PASS | GL & Governance M30 | CORE-CRITICAL |

---

### M34 — Financial Consolidation & Multi-Entity Reporting
*Workspace: `WS09_CONSOLIDATION` | Route: `/consolidation` | Component: `M34FinancialConsolidationWorkspace.tsx` | Authority: ConsolidationEngine / AccountingEngine (M30)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M34-F01 | Multi-Entity Consolidation Scope | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | Fetch Scope | `/api/finance/consolidation/scope` | GET | ConsolidationEngine | `intercompany_scope` | Entity hierarchy & ownership % read-only check | PASS (2026-09-24) | Group Structure | CORE-CRITICAL |
| M34-F02 | Automated Consolidation Run | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | Run Consolidation | `/api/finance/consolidation/runs` | POST | ConsolidationEngine | `consolidation_runs` | Branch trial balances aggregated & balanced | PASS (2026-09-24) | Group Finance | CORE-CRITICAL |
| M34-F03 | Intercompany Trade/Debt Elimination | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | Auto-Eliminate | `/api/finance/consolidation/eliminations` | GET | ConsolidationEngine | `elimination_entries` | Internal trade/debt balances automatically netted out | PASS (2026-09-24) | Intercompany Accounting | CORE-CRITICAL |
| M34-F04 | Intercompany Debt Reconciliation | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | Reconcile Debt | `/api/finance/consolidation/reconciliations` | GET | ConsolidationEngine | AR/AP Match Engine | AR/AP 131 vs 331 matched & mismatches alerted | PASS (2026-09-24) | Intercompany Debt | CORE-CRITICAL |
| M34-F05 | Balance Sheet & PnL Balance Check | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | Check Balance | `/api/finance/consolidation/reports` | GET | ConsolidationEngine | Consolidated Financials | Assets = Liabilities + Equity & Profit equality validated | PASS (2026-09-24) | Group Financials | CORE-CRITICAL |
| M34-F06 | Multi-Currency FX Translation | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | Translate FX | `/api/finance/consolidation/fx-rates` | POST | ConsolidationEngine | `fx_adjustments` | Multi-currency translation using M03 rates | PASS (2026-09-24) | FX Accounting | BUSINESS-CRITICAL |
| M34-F07 | Idempotent Run Guard | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | Retry Run | `/api/finance/consolidation/runs` | POST | ConsolidationEngine | `consolidation_runs.idempotencyKey` | Identical key returns existing run with 0 duplicate | PASS (2026-09-24) | Execution Safety | CORE-CRITICAL |
| M34-F08 | Atomic Concurrent Approval Guard | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | Approve Run | `/api/finance/consolidation/runs/:id/approve` | POST | ConsolidationEngine | `consolidation_runs.status` | Optimistic lock: 1 SUCCESS + 1 ALREADY_PROCESSED | PASS (2026-09-24) | Concurrency Guard | CORE-CRITICAL |
| M34-F09 | Terminal State Immutability Guard | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | Lock Run | `/api/finance/consolidation/runs/:id/lock` | POST | ConsolidationEngine | `consolidation_runs.status` | Immutability check blocks edits to APPROVED/LOCKED run | PASS (2026-09-24) | Data Integrity | CORE-CRITICAL |
| M34-F10 | Multi-Level Report Drill-Down | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | Drill-down Item | `/api/finance/consolidation/runs/:id/drill-down` | GET | ConsolidationEngine | Line Item Audit | Full trace from consolidated line → branch → M30 GL | PASS (2026-09-24) | Financial Auditability | CORE-CRITICAL |
| M34-F11 | RBAC Role Authorization Guard | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | Executive Action | `/api/finance/consolidation/runs/:id/approve` | POST | ConsolidationEngine | Role Permission Guard | CFO/ADMIN authorization enforced for approvals | PASS (2026-09-24) | RBAC Governance | CORE-CRITICAL |
| M34-F12 | Immutable Audit & DMS Vaulting | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | Seal DMS | `/api/finance/consolidation/runs/:id/seal-dms` | POST | ConsolidationEngine / DMS | `audit_logs`, `dms_documents` | M02 audit log + SHA-256 sealed document in M29 DMS | PASS (2026-09-24) | Audit & Compliance | CORE-CRITICAL |
| M34-F13 | Cross-Module Outbox Event Emission | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | Complete Run | `/api/finance/consolidation/reports` | GET | ConsolidationEngine | `outbox_events` | Emits `finance.consolidation.run.completed.v1` for M37 BI | PASS (2026-09-24) | Cross-Module Sync | CORE-CRITICAL |
| M34-F14 | Single-Writer Invariant & Regression Guard | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | Run Pipeline | `/api/finance/consolidation/runs` | POST | ConsolidationEngine | Single-Writer Guard | Read-only check: Zero mutation to M30/M17/M42 ledgers | PASS (2026-09-24) | System Invariants | CORE-CRITICAL |

---

### M35 — Projects & Work Breakdown Structure (WBS)
*Workspace: `WS16_PROJECTS` | Route: `/projects` | Component: `M35ProjectsWBSWorkspace.tsx` | Authority: ProjectService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M35-F01 | Project Charter & Initiation | `/projects` | `M35ProjectsWBSWorkspace.tsx` | Create Project | `/api/projects` | POST | ProjectService | `projects` | Master project charter, budget baseline & PM created | PASS | Project Core | CORE-CRITICAL |
| M35-F02 | Multi-tier WBS Hierarchy & Tasks | `/projects` | `M35ProjectsWBSWorkspace.tsx` | Add WBS Node | `/api/projects/:id/wbs` | POST | ProjectService | `wbs_nodes` | Multi-level WBS tree with budget, assignee & dates | PASS | WBS Scheduling | CORE-CRITICAL |
| M35-F03 | Task Predecessors & Critical Path | `/projects` | `M35ProjectsWBSWorkspace.tsx` | Link Dependency | `/api/projects/:id/wbs` | POST | ProjectService | `wbs_nodes.dependencyCode` | Dependency linking and critical path computation | PASS | Schedule Network | BUSINESS-CRITICAL |
| M35-F04 | Project Progress & ISO 21508 EVM | `/projects` | `M35ProjectsWBSWorkspace.tsx` | Update Progress | `/api/projects/:id/progress` | PUT | ProjectService | `projects.progressPct` | Progress updated with auto recalculation of CPI & SPI | PASS | EVM Analytics | CORE-CRITICAL |
| M35-F05 | Resource Roster & Capacity (M28) | `/projects` | `M35ProjectsWBSWorkspace.tsx` | Register Resource | `/api/projects/resources` | POST | ProjectService | `project_resources` | Labor/equipment/subcontractor capacity & rate registered | PASS | Resource Pool | BUSINESS-CRITICAL |
| M35-F06 | Timesheet & Labor Costing (M28/M30)| `/projects` | `M35ProjectsWBSWorkspace.tsx` | Log Timesheet | `/api/projects/:id/timesheets` | POST | ProjectService | `project_timesheets`, `project_cost_ledger` | Time logged, labor cost computed & posted to TK 622 | PASS | Labor Costing M28 | CORE-CRITICAL |
| M35-F07 | Material Issue Delegation (M17/M42)| `/projects` | `M35ProjectsWBSWorkspace.tsx` | Issue Material | `/api/projects/:id/material-issue` | POST | InventoryService (M17) | `stock_ledger`, `project_costs` | Stock deducted via M17 single writer & unit cost from M42 | PASS | Inventory M17 & M42 | CORE-CRITICAL |
| M35-F08 | Aggregated 5-Component Job Costing | `/projects` | `M35ProjectsWBSWorkspace.tsx` | View Job Cost | `/api/projects/:id/job-cost` | GET | ProjectService | Unified Cost Ledger | 5-component breakdown (Labor, Material, Equip, Sub, OH) | PASS | Job Costing | CORE-CRITICAL |
| M35-F09 | Milestone & Progress Invoicing (M31)| `/projects` | `M35ProjectsWBSWorkspace.tsx` | Create Invoice | `/api/projects/:id/billing` | POST | InvoiceService (M31) | `invoices`, `accounting_entries` | VAT invoice generated via M31 & posted to M30 GL | PASS | Billing M31 & GL M30 | CORE-CRITICAL |
| M35-F10 | POC Revenue Recognition (VAS 15) | `/projects` | `M35ProjectsWBSWorkspace.tsx` | Analyze Margin | `/api/projects/:id/margin` | GET | ProjectService | Financial Health | Percentage of Completion revenue & gross margin % | PASS | Financial Analytics | CORE-CRITICAL |
| M35-F11 | Change Order & Budget Baseline Rev | `/projects` | `M35ProjectsWBSWorkspace.tsx` | Submit Change Order | `/api/projects/:id/budget-revisions` | POST | ProjectService | `project_budget_versions` | Approved change order updates budget baseline & audit | PASS | Scope & Budget | CORE-CRITICAL |
| M35-F12 | Project Terminal State Immutability | `/projects` | `M35ProjectsWBSWorkspace.tsx` | Close Project | `/api/projects/:id/status` | PUT | ProjectService | `projects.status` | State guard blocks modifications to CLOSED/COMPLETED projects | PASS | Governance & Integrity | CORE-CRITICAL |
| M35-F13 | Audit Log (M02) & DMS Storage (M29)| `/projects` | `M35ProjectsWBSWorkspace.tsx` | Audit & Archive | `/api/projects/:id` | GET / POST | AuditService (M02) / DMS (M29) | `audit_logs`, `dms_documents` | Immutable SHA-256 audit log and document vaulting | PASS | Audit M02 & DMS M29 | CORE-CRITICAL |

---

### M36 — Logistics & Fleet Transportation (TMS)
*Workspace: `WS17_LOGISTICS` | Route: `/logistics` | Component: `M36LogisticsWorkspace.tsx` | Authority: LogisticsService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M36-F01 | Shipment Dispatch & Waybill | `/logistics` | `M36LogisticsWorkspace.tsx` | Dispatch Shipment | `/api/logistics/orders` | POST | LogisticsService | `transport_orders` | Waybill generated and driver assigned | PASS | Logistics & TMS | CORE-CRITICAL |
| M36-F02 | Multi-Stop Route Optimization | `/logistics` | `M36LogisticsWorkspace.tsx` | Optimize Route | `/api/logistics/kpi` | GET | LogisticsService | `transport_orders` metrics | Least-cost and shortest delivery route | PASS | Route Optimization | BUSINESS-CRITICAL |
| M36-F03 | Freight Costing & Allocation | `/logistics` | `M36LogisticsWorkspace.tsx` | Calculate Freight | `/api/logistics/orders` | POST | CostingEngine (M42) | `transport_orders.freightCost` | Freight allocated to goods receipt / order | PASS | Freight & Costing M42 | CORE-CRITICAL |
| M36-F04 | Electronic Proof of Delivery (e-POD)| `/logistics` | `M36LogisticsWorkspace.tsx` | Record POD | `/api/logistics/orders/:id/pod` | POST | LogisticsService | `proof_of_deliveries` | Delivery confirmed with recipient signature | PASS | Last-Mile Delivery | CORE-CRITICAL |
| M36-F05 | Fleet Master & Vehicle Registry | `/logistics` | `M36LogisticsWorkspace.tsx` | Register Vehicle | `/api/logistics/vehicles` | POST | LogisticsService | `vehicles` | Vehicle plate and capacity registered | PASS | Fleet Master | CORE-CRITICAL |
| M36-F06 | Driver Personnel Roster | `/logistics` | `M36LogisticsWorkspace.tsx` | Register Driver | `/api/logistics/drivers` | POST | LogisticsService | `drivers` | Driver license and status recorded | PASS | Driver Management | CORE-CRITICAL |
| M36-F07 | Vehicle & Driver Assignment | `/logistics` | `M36LogisticsWorkspace.tsx` | Assign Trip | `/api/logistics/orders/:id/assign` | POST | LogisticsService | `transport_orders` status | Vehicle/driver assigned with status update | PASS | Dispatch Operations | CORE-CRITICAL |
| M36-F08 | Real-Time Tracking & Status | `/logistics` | `M36LogisticsWorkspace.tsx` | Update Status | `/api/logistics/orders/:id/status` | POST | LogisticsService | `transport_orders` lifecycle | In-transit lifecycle tracking | PASS | Real-Time Tracking | BUSINESS-CRITICAL |
| M36-F09 | Inventory Goods Issue Linkage | `/logistics` | `M36LogisticsWorkspace.tsx` | Read Stock Balances | `/api/inventory/balances` | GET | InventoryService (M17) | Read-only check | Stock verified via M17 single writer | PASS | Inventory M17 | CORE-CRITICAL |
| M36-F10 | Fuel & Refueling Management | `/logistics` | `M36LogisticsWorkspace.tsx` | Log Refuel | `/api/logistics/fuel-transactions` | POST | LogisticsService | `fuel_transactions` | Refueling cost and mileage recorded | PASS | Fleet Fuel | BUSINESS |
| M36-F11 | VETC / ePass Electronic Tolls | `/logistics` | `M36LogisticsWorkspace.tsx` | Sync Tolls | `/api/logistics/vetc-transactions/sync`| POST | LogisticsService | `vetc_transactions` | RFID toll logs ingested and tracked | PASS | Electronic Tolls | BUSINESS-CRITICAL |
| M36-F12 | Toll & Freight GL Reconciliation | `/logistics` | `M36LogisticsWorkspace.tsx` | Reconcile Tolls | `/api/logistics/vetc-transactions/reconcile`| POST | AccountingEngine (M30) | `accounting_entries` | Toll expenses posted to M30 GL | PASS | Finance GL M30 | CORE-CRITICAL |
| M36-F13 | Telemetry Driver Safety Scoring | `/logistics` | `M36LogisticsWorkspace.tsx` | View Safety Score | `/api/logistics/driver-safety-scores`| GET | LogisticsService | Driver telemetry | Safety tier and eco-driving score evaluated | PASS | Safety & Telemetry | BUSINESS-CRITICAL |
| M36-F14 | Audit Trail Compliance Logging | `/logistics` | `M36LogisticsWorkspace.tsx` | Audit Check | `/api/audit/logs` | GET | AuditService (M02) | `audit_logs` | All dispatch events recorded in M02 trail | PASS | Audit M02 | CORE-CRITICAL |
| M36-F15 | DMS Document Vault Archival | `/logistics` | `M36LogisticsWorkspace.tsx` | Archive Vault | `/api/dms/documents` | GET | DmsService (M29) | `dms_documents` | Waybills and PODs archived securely | PASS | DMS M29 | CORE-CRITICAL |


---

### M37 — Business Intelligence & Executive Analytics
*Workspace: `M37 - BI & Executive Analytics` | Route: `/analytics` (Alias: `/reports`) | Component: `M37BiAnalyticsWorkspace.tsx` | Authority: AnalyticsService (Read-Only; M30 GL Single-Writer)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M37-F01 | Executive KPI Aggregation | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | Load Analytics | `/api/analytics/kpis` | GET | AnalyticsService | Read-Only Aggregation | Cross-domain revenue, COGS, inventory KPIs | PASS (2026-09-25) | Executive Analytics | BUSINESS-CRITICAL |
| M37-F02 | Real-time Dashboard Visuals | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | Switch View | `/api/analytics/pnl-monthly` | GET | AnalyticsService | Analytical Visuals | Recharts visual graphs across business units | PASS (2026-09-25) | BI Dashboards | BUSINESS |
| M37-F03 | Ad-hoc Report Export Engine | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | Export Report | `/api/analytics/export` | POST | AnalyticsService / DMS | `export_jobs` | Excel/PDF idempotent export with M29 Doc ID | PASS (2026-09-25) | Reporting Engine | BUSINESS-CRITICAL |
| M37-F04 | Predictive Trends Forecast | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | View Trends | `/api/analytics/forecast` | GET | AnalyticsService | Statistical Forecast | 90-day cashflow and trend prediction | PASS (2026-09-25) | Predictive Analytics | BUSINESS |
| M37-F05 | VAS P&L Income Statement | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | Load P&L | `/api/analytics/pnl` | GET | AnalyticsService / M30 | Read-Only GL | Income statement matches M30 Trial Balance | PASS (2026-09-25) | Financial Reporting | CORE-CRITICAL |
| M37-F06 | Direct Cash Flow Statement | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | Load Cashflow | `/api/analytics/cashflow` | GET | AnalyticsService / M32/M33 | Read-Only Treasury | Cash balance matches M32/M33 balances | PASS (2026-09-25) | Treasury Analytics | CORE-CRITICAL |
| M37-F07 | Inventory Turnover & Ratios | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | Load Ratios | `/api/analytics/turnover-ratios` | GET | AnalyticsService / M17/M42 | Read-Only Inventory/Costing | Turnover ratio = COGS / Avg Inventory | PASS (2026-09-25) | Working Capital | BUSINESS-CRITICAL |
| M37-F08 | Source Document Drill-Down | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | Drilldown Category | `/api/analytics/category-drilldown` | GET | AnalyticsService | Drilldown Navigation | Category drilldown to source transactions | PASS (2026-09-25) | Data Traceability | BUSINESS |
| M37-F09 | Branch & Group Scope | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | Toggle Scope | `/api/analytics/pnl` | GET | AnalyticsService / M34 | Scope Filter | Branch or Consolidated scope fallback | PASS (2026-09-25) | Multi-Entity | BUSINESS-CRITICAL |
| M37-F10 | Idempotent Export Engine | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | Re-export | `/api/analytics/export` | POST | AnalyticsService | `export_jobs` | Concurrent request returns same jobId | PASS (2026-09-25) | Export Governance | CORE-CRITICAL |
| M37-F11 | Sales Channel Distribution | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | Load Channels | `/api/analytics/channel-distribution` | GET | AnalyticsService | Sales Share | Revenue distribution across channels | PASS (2026-09-25) | Commercial Analytics | BUSINESS |
| M37-F12 | Branch Performance Matrix | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | Load Branches | `/api/analytics/branch-performance` | GET | AnalyticsService | Branch Comparison | Revenue/Margin breakdown per branch | PASS (2026-09-25) | Operational Analytics | BUSINESS |
| M37-F14 | Executive RBAC Enforcement | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | Access Report | `/api/analytics/pnl` | GET | AnalyticsService / M04 | Role Guard | Requires `analytics.executive.view` | PASS (2026-09-25) | RBAC Security | CORE-CRITICAL |
| M37-F15 | Audit Log & Verification | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | View Statement | `/api/analytics/pnl` | GET | AuditService (M02) | `audit_logs` | Audit trail recorded for C-level views | PASS (2026-09-25) | Audit Trail | CORE-CRITICAL |
| M37-F16 | M05 EventBus Outbox Emission | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | Export Report | `/api/analytics/export` | POST | EventBus (M05) | `outbox_events` | Emits `analytics.report.exported.v1` | PASS (2026-09-25) | EDA Sync | BUSINESS-CRITICAL |

---

### M38 — IT Service Desk & Incident SLA Management
*Workspace: `WS26_SERVICEDESK` | Route: `/issue` (Alias: `/service-desk`) | Component: `ServiceDeskWorkspace.tsx` | Authority: ServiceDeskService (ITIL v4 & ITSM Single-Writer)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M38-F01 | Service Ticket Creation (M03 Seq) | `/issue` | `ServiceDeskWorkspace.tsx` | Create Ticket | `/api/service-desk/tickets` | POST | ServiceDeskService | `tickets`, `ticket_status_history` | Ticket logged with sequence `IT-TKT-YYYY-NNNN` | PASS | IT Service Desk | BUSINESS-CRITICAL |
| M38-F02 | SLA Deadline & Real-time Warning | `/issue` | `ServiceDeskWorkspace.tsx` | Monitor SLA | `/api/service-desk/sla` | GET | ServiceDeskService | `tickets` SLA flags | Real-time 75%/90% warnings & breach tracking | PASS | SLA Governance | CORE-CRITICAL |
| M38-F03 | Mandatory Root Cause Resolution | `/issue` | `ServiceDeskWorkspace.tsx` | Resolve Ticket | `/api/service-desk/tickets/:id/resolve` | POST | ServiceDeskService | `tickets.status`, `ticket_status_history` | Root cause & resolution notes documented | PASS | Incident Management | BUSINESS-CRITICAL |
| M38-F04 | Resolution Sign-off & Terminal Lock| `/issue` | `ServiceDeskWorkspace.tsx` | Close Ticket | `/api/service-desk/tickets/:id/close` | POST | ServiceDeskService | `tickets.status`, `ticket_surveys` | Ticket closed with CSAT and locked Read-Only | PASS | Service Sign-off | CORE-CRITICAL |
| M38-F05 | Priority Impact Matrix (P1–P4) | `/issue` | `ServiceDeskWorkspace.tsx` | Select Matrix | `/api/service-desk/tickets` | POST | ServiceDeskService | `tickets.priority` | Impact x Urgency automatically computes P1–P4 | PASS | Classification | BUSINESS-CRITICAL |
| M38-F06 | SLA Policy Engine & Pause Clock | `/issue` | `ServiceDeskWorkspace.tsx` | Pause/Resume | `/api/service-desk/tickets/:id/pause` | POST | ServiceDeskService | `tickets.sla_paused_at` | SLA timer paused on PENDING/WAITING states | PASS | SLA Engine | CORE-CRITICAL |
| M38-F07 | Auto-Assignment & HRM Leave Filter | `/issue` | `ServiceDeskWorkspace.tsx` | Auto-assign | `/api/service-desk/tickets` | POST | ServiceDeskService | `tickets.assigned_agent_id` | Assigns available agent excluding M28 leaves | PASS | Resource Dispatch | BUSINESS |
| M38-F09 | Access Request SoD & M04 Execution | `/issue` | `ServiceDeskWorkspace.tsx` | Request Access | `/api/service-desk/access-requests` | POST | ServiceDeskService | `ticket_access_requests` | SoD enforced; High-risk 2-tier; M04 fulfillment | PASS | RBAC & Security | CORE-CRITICAL |
| M38-F10 | Equipment & Asset Linkage | `/issue` | `ServiceDeskWorkspace.tsx` | Link Hardware | `/api/service-desk/tickets` | POST | ServiceDeskService | `tickets.asset_id` | Hardware linked to M27 asset / M23 serial | PASS | Hardware Support | BUSINESS |
| M38-F11 | M27 EAM Work Order Creation & Sync| `/issue` | `ServiceDeskWorkspace.tsx` | Create WO | `/api/service-desk/tickets/:id/create-work-order`| POST| EamService (M27) | `maintenance_work_orders` | WO created with sourceModule 'M38' | PASS | Maintenance M27 | CORE-CRITICAL |
| M38-F12 | DMS Document Vault Attachments | `/issue` | `ServiceDeskWorkspace.tsx` | Attach Log | `/api/dms/documents` | GET | DmsService (M29) | `dms_documents` | Attachments verified via M29 vault SHA-256 | PASS | DMS M29 | BUSINESS |
| M38-F15 | Append-Only Status History | `/issue` | `ServiceDeskWorkspace.tsx` | View History | `/api/service-desk/tickets/:id` | GET | ServiceDeskService | `ticket_status_history` | Complete chronological audit log of states | PASS | Traceability | CORE-CRITICAL |
| M38-F17 | Idempotency Key Guard | `/issue` | `ServiceDeskWorkspace.tsx` | Re-submit | `/api/service-desk/tickets` | POST | ServiceDeskService | `tickets.idempotency_key` | Idempotent submission prevents duplicate tickets | PASS | Concurrency Guard | CORE-CRITICAL |
| M38-F18 | Outbox Event Emission (M05) | `/issue` | `ServiceDeskWorkspace.tsx` | State Change | `/api/service-desk/tickets` | POST | EventBus (M05) | `outbox_events` | `servicedesk.ticket.*.v1` events broadcast | PASS | EDA & Platform | BUSINESS-CRITICAL |
| M38-F19 | KPI Analytics & MTTR Aggregation | `/issue` | `ServiceDeskWorkspace.tsx` | View KPI | `/api/service-desk/kpi` | GET | ServiceDeskService | Analytical Aggregation | MTTR, on-time SLA rate, CSAT, Backlog | PASS | Executive Reports | BUSINESS-CRITICAL |

---

### M39 — Quality Control & Inspection (QMS)
*Workspace: `WS27_QUALITY` | Route: `/quality` | Component: `M39QualityControlWorkspace.tsx` | Authority: QualityService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M39-F01 | Inspection Plans (IQC/PQC/OQC) | `/quality` | `M39QualityControlWorkspace.tsx` | Create Plan | `/api/quality/plans` | POST | QualityService | `qc_plans`, `qc_criteria` | Inspection standards and criteria configured | PASS | Quality & Item Master | CORE-CRITICAL |
| M39-F02 | ISO 2859-1 AQL Sample Execution | `/quality` | `M39QualityControlWorkspace.tsx` | Record Inspection | `/api/quality/inspections` | POST | QualityService | `qc_inspections`, `qc_results` | AQL sample computed and result saved | PASS | Quality & M17 Inventory| CORE-CRITICAL |
| M39-F03 | NCR & CAPA Tracking | `/quality` | `M39QualityControlWorkspace.tsx` | Raise NCR | `/api/quality/ncrs` | POST | QualityService | `qc_ncrs`, `qc_capas` | NCR logged and quarantine enforced | PASS | Quality & SRM M11 | CORE-CRITICAL |
| M39-F04 | Batch Release & DMS Seal | `/quality` | `M39QualityControlWorkspace.tsx` | Approve Batch | `/api/quality/batch-releases` | POST | QualityService | `qc_batch_releases` | Stock released to M17 and COA sealed in M29 | PASS | Quality & M29 DMS | CORE-CRITICAL |

---

### M40 — Environmental Health & Safety (EHS)
*Workspace: `WS29_EHS` | Route: `/ehs` | Component: `EHSWorkspace.tsx` | Authority: EhsService (Standalone Single-Writer Domain Authority for EHS Safety & Environment) | Certified: 2026-09-24 (F01–F10 PASS)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M40-F01 | Workplace Incident Reporting & Investigation | `/ehs` | `EHSWorkspace.tsx` | Log Incident | `/api/ehs/incidents` | POST | EhsService | `ehs_incidents` | Workplace safety incident recorded with sequence ID & investigative actions | PASS | EHS Core | CORE-CRITICAL |
| M40-F02 | Job Safety Analysis (JSA) 5x5 Risk Matrix | `/ehs` | `EHSWorkspace.tsx` | Assess Risk | `/api/ehs/risk-assessments` | POST | EhsService | `ehs_risk_assessments` | Risk score calculated (Severity x Probability) & controls logged | PASS | Safety Risk | BUSINESS-CRITICAL |
| M40-F03 | Safety CAPA Lifecycle Enforcement | `/ehs` | `EHSWorkspace.tsx` | Assign/Verify CAPA | `/api/ehs/capas` | POST | EhsService | `ehs_capas` | Corrective action assigned, verified and closed | PASS | EHS Compliance | CORE-CRITICAL |
| M40-F04 | Safety Audit Checklist & Auto-CAPA Trigger | `/ehs` | `EHSWorkspace.tsx` | Conduct Audit | `/api/ehs/audits` | POST | EhsService | `ehs_safety_audits`, `ehs_audit_checklist_items` | Audit scored; failed mandatory item auto-triggers CAPA | PASS | EHS Audit | BUSINESS |
| M40-F05 | Fire Safety Equipment Inspection & Expiry Tracking | `/ehs` | `EHSWorkspace.tsx` | Register/Inspect Equipment | `/api/ehs/fire-safety/equipment` | POST | EhsService | `ehs_fire_equipment` | PCCC equipment registered & inspection renewed | PASS | Fire Safety | CORE-CRITICAL |
| M40-F06 | Environmental Monitoring & Threshold Guard | `/ehs` | `EHSWorkspace.tsx` | Log Environmental Record | `/api/ehs/environmental/records` | POST | EhsService | `ehs_environmental_records` | Effluent/Air quality logged; threshold exceedance flagged | PASS | Environment QCVN | BUSINESS-CRITICAL |
| M40-F07 | Permit to Work & LOTO Isolation Guard | `/ehs` | `EHSWorkspace.tsx` | Issue/Close Permit | `/api/ehs/permits` | POST | EhsService | `ehs_safety_permits` | Lockout/Tagout permit issued & linked to asset; closed on completion | PASS | LOTO Isolation | CORE-CRITICAL |
| M40-F08 | Active Permit Check API for M27 EAM | `/ehs` | `EHSWorkspace.tsx` | Probe Permit Status | `/api/ehs/permits/asset/:assetId/active` | GET | EhsService | Read-only check | Returns active LOTO permits to gate M27 Work Orders | PASS | Cross-Module M27 | CORE-CRITICAL |
| M40-F09 | EHS KPI Dashboard & Safety Scorecard | `/ehs` | `EHSWorkspace.tsx` | Load KPI | `/api/ehs/kpi` | GET | EhsService | Read-only aggregation | Safe days, expired PCCC, open CAPAs & LOTO counts computed | PASS | EHS Executive | BUSINESS |
| M40-F10 | Idempotency & Audit Trail Guard | `/ehs` | `EHSWorkspace.tsx` | Re-submit Action | `/api/ehs/incidents` | POST | EhsService | `audit_logs` | Idempotent submission prevented duplicate record & audit logged | PASS | Platform Security | CORE-CRITICAL |

---

### M41 — Pricing Engine & Commercial Management (Single-Writer Authority)
*Workspace: `WS30_PRICING` | Route: `/pricing` | Component: `M41PricingManagementWorkspace.tsx` | Authority: PricingEngine (Sole Authority for Selling Prices & Tiered Discounts)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M41-F01 | Price List Definition | `/pricing` | `M41PricingManagementWorkspace.tsx` | Create Price List | `/api/pricing/price-lists` | POST | PricingEngine | `price_lists` | Wholesale/Retail price lists configured | PASS | Pricing Core | CORE-CRITICAL |
| M41-F02 | Tiered Quantity Discount Breaks | `/pricing` | `M41PricingManagementWorkspace.tsx` | Add Tier Break | `/api/pricing/tiers` | POST | PricingEngine | `pricing_tiers` | Tiered discounts applied based on order volume | PASS | Commercial Pricing | CORE-CRITICAL |
| M41-F03 | Dynamic Price Calculation API | `/pricing` | `M41PricingManagementWorkspace.tsx` | Calculate Price | `/api/pricing/calculate` | POST | PricingEngine | Read-only calculation | Resolves unit price, customer discount & margin | PASS | Sales & CRM Pricing | CORE-CRITICAL |
| M41-F04 | Margin Floor Guard | `/pricing` | `M41PricingManagementWorkspace.tsx` | Test Margin Floor | `/api/pricing/calculate` | POST | PricingEngine | Margin Rule | Below-cost orders rejected or flagged for approval | PASS | Commercial Risk | CORE-CRITICAL |
| M41-X01 | Single-Writer Invariant Guard | `/pricing` | `M41PricingManagementWorkspace.tsx` | Direct Price Probe | `/api/pricing/calculate` | POST | PricingEngine | Boundary Lock | All external price mutations route via M41 | PASS | Commercial Integrity | CORE-CRITICAL |

---

### M42 — Cost Allocation & COGS Engine (Single-Writer Authority)
*Workspace: `WS31_COGS` | Route: `/cogs` | Component: `M42CostAllocationWorkspace.tsx` | Authority: CostingEngine (Sole Authority for COGS, Landed Cost & Valuation Layers)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M42-F01 | Cost Layer Initialization | `/cogs` | `M42CostAllocationWorkspace.tsx` | View Layers | `/api/cogs/cost-layers` | GET | CostingEngine | `cost_layers` | Active FIFO and WAvg valuation layers | PASS | Inventory Valuation | CORE-CRITICAL |
| M42-F02 | Landed Cost Allocation (Value) | `/cogs` | `M42CostAllocationWorkspace.tsx` | Allocate Value | `/api/cogs/landed-cost` | POST | CostingEngine | `cost_layers`, `landed_cost_allocations` | Freight/Duties allocated proportional to value | PASS | P2P M08 & Costing | CORE-CRITICAL |
| M42-F03 | Landed Cost Allocation (Weight)| `/cogs` | `M42CostAllocationWorkspace.tsx` | Allocate Weight | `/api/cogs/landed-cost` | POST | CostingEngine | `cost_layers`, `landed_cost_allocations` | Freight allocated proportional to weight (kg) | PASS | P2P M08 & Costing | BUSINESS-CRITICAL |
| M42-F04 | Landed Cost Allocation (Qty) | `/cogs` | `M42CostAllocationWorkspace.tsx` | Allocate Qty | `/api/cogs/landed-cost` | POST | CostingEngine | `cost_layers`, `landed_cost_allocations` | Handling charges allocated by item count | PASS | P2P M08 & Costing | BUSINESS-CRITICAL |
| M42-F05 | FIFO Valuation Layer Depletion | `/cogs` | `M42CostAllocationWorkspace.tsx` | Compute COGS | `/api/cogs/calculate-order` | POST | CostingEngine | `cost_layers`, `cogs_transactions` | Oldest FIFO layers depleted accurately | PASS | Sales M13 & Costing | CORE-CRITICAL |
| M42-F06 | Weighted Average Recalculation | `/cogs` | `M42CostAllocationWorkspace.tsx` | Recalculate WAvg | `/api/cogs/allocation` | GET | CostingEngine | `products`, `cost_layers` | Moving average unit cost updated on receipt | PASS | Inventory M17 & Costing| CORE-CRITICAL |
| M42-F07 | Consumed Layer Immutability | `/cogs` | `M42CostAllocationWorkspace.tsx` | Check Layer Lock | `/api/cogs/cost-layers` | GET | CostingEngine | `cost_layers` | Fully consumed layers locked against edit | PASS | Costing Security | CORE-CRITICAL |
| M42-F08 | COGS ↔ GL Reconciliation | `/cogs` | `M42CostAllocationWorkspace.tsx` | Reconcile GL | `/api/cogs/transactions` | GET | AccountingEngine (M30) | `accounting_entries` | Total COGS matches VAS Debit 632 / Credit 156 | PASS | Finance M30 & Costing | CORE-CRITICAL |
| M42-F09 | Fiscal Period Close Guard | `/cogs` | `M42CostAllocationWorkspace.tsx` | Retroactive Probe | `/api/cogs/calculate-order` | POST | CostingEngine | `fiscal_periods` | Retroactive valuation blocked on closed period | PASS | Finance & Costing | CORE-CRITICAL |
| M42-F10 | Global Valuation Method Config | `/cogs` | `M42CostAllocationWorkspace.tsx` | Update Method | `/api/cogs/settings` | PUT | CostingEngine | `costing_settings` | Strict RBAC for switching FIFO/WAVG | PASS | RBAC & Costing | CORE-CRITICAL |
| M42-X01 | Single-Writer Invariant Guard | `/cogs` | `M42CostAllocationWorkspace.tsx` | Direct COGS Probe | `/api/cogs/landed-cost` | POST | CostingEngine | Boundary Lock | All external cost writes route via M42 | PASS | Valuation Integrity | CORE-CRITICAL |

---

## 3. Master Test Specifications — CORE Services

### CORE-IAM — Identity, Authentication & Multi-Branch Session
*Workspace: `SHELL` | Route: `/` | Component: `SimulatedLoginModal.tsx` | Authority: AuthService / AuthorityManager*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| CORE-IAM-01 | User Authentication (Sign In) | `/` | `SimulatedLoginModal.tsx` | Authenticate | `/api/auth/login` | POST | AuthService | `user_sessions` | JWT/Session issued with user profile & role | PASS | Platform IAM | CORE-CRITICAL |
| CORE-IAM-02 | Active Session & Profile Get | `/` | `GlobalHeader.tsx` | Check Session | `/api/auth/profile` | GET | AuthService | `users` | Current user permissions and profile returned | PASS | Platform IAM | CORE-CRITICAL |
| CORE-IAM-03 | Multi-Branch Switching | `/` | `GlobalHeader.tsx` | Switch Branch | `/api/auth/switch-branch` | POST | AuthService | `user_sessions.branch_id`| Active branch context and RLS scope updated | PASS | IAM & Multi-Branch | CORE-CRITICAL |
| CORE-IAM-04 | User Logout & Token Revocation | `/` | `GlobalHeader.tsx` | Sign Out | `/api/auth/logout` | POST | AuthService | `user_sessions` | Session invalidated and credentials cleared | PASS | Platform IAM | CORE-CRITICAL |

---

### CORE-PLATFORM — System Health & Unified Pipeline Engine
*Workspace: `SHELL` | Route: `/` | Component: `UnifiedDataPipelineModal.tsx` | Authority: WorkspaceAggregationService / UnifiedPipelineEngine*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| CORE-PLT-01 | Server Health & Readiness Probe | `/` | `GlobalHeader.tsx` | Probe Health | `/api/health` | GET | System | Cluster Health | 200 OK with database connection status | PASS | Infrastructure | CORE-CRITICAL |
| CORE-PLT-02 | Unified Pipeline Graph Overview | `/` | `UnifiedDataPipelineModal.tsx` | View Pipeline | `/api/unified-pipeline/overview` | GET | UnifiedPipelineEngine | Pipeline Metrics | Cross-module O2C/P2P data flow telemetry | PASS | Pipeline Monitoring | BUSINESS-CRITICAL |
| CORE-PLT-03 | End-to-End Transaction Trace | `/` | `UnifiedDataPipelineModal.tsx` | Trace Order | `/api/unified-pipeline/orders/:id/graph`| GET | UnifiedPipelineEngine | Entity Graph | Complete trace (Lead ➔ SO ➔ WMS ➔ Inv ➔ GL) | PASS | Traceability & E2E | CORE-CRITICAL |

---
*End of Master Test Matrix M01 – M42 & CORE.*
