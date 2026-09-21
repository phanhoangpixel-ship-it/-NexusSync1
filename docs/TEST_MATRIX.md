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
| **04. Manufacturing & Projects**| M06, M25, M26, M27, M35 | 5 | M06, M25 | M26, M27, M35 |
| **05. Finance & Accounting** | M30, M31, M32, M33, M34, M42 | 6 | M30, M42 | M31, M32, M33, M34 |
| **06. HR & Payroll** | M28 | 1 | — | M28 |
| **07. Governance, QA & Platform**| M01, M02, M03, M04, M05, M29, M37, M38, M39, M40 | 10 | M02, M39 | M01, M03, M04, M05, M29, M37, M38, M40 |
| **CORE Services & IAM** | CORE-IAM, CORE-PLATFORM | 2 | CORE-IAM, CORE-PLATFORM | — |
| **TOTAL** | **M01 – M42 + CORE** | **42 Modules + 2 Core** | **21 Certified** | **23 Pending Live QA Run** |

---

## 2. Master Test Specifications by Module (M01 – M42)

### M01 — Workspace Hub & Executive Command Center
*Workspace: `WS01_WORKSPACE_HUB` | Route: `/` | Component: `WorkspaceHub.tsx` | Authority: WorkspaceAggregationService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M01-F01 | Executive KPI Overview | `/` | `WorkspaceHub.tsx` | Load Workspace | `/api/workspace/summary` | GET | WorkspaceAggregationService | Read-only aggregation | High-level metrics across all 42 modules | PENDING | Workspace Hub | BUSINESS-CRITICAL |
| M01-F02 | Unified Work Queue | `/` | `WorkspaceHub.tsx` | View Pending Tasks | `/api/workspace/work-items` | GET | TaskManager | `workflow_tasks` | Consolidated action items across domains | PENDING | Task & Approval | CORE-CRITICAL |
| M01-F03 | Recent Activities Stream | `/` | `WorkspaceHub.tsx` | Stream Activities | `/api/workspace/recent-activities` | GET | AuditService | Read-only audit slice | Chronological activity log feed | PENDING | Audit Trail | BUSINESS |
| M01-F04 | Workspace Quick Export | `/` | `WorkspaceHub.tsx` | Export Summary | `/api/workspace/export` | GET | WorkspaceAggregationService | Report Generation | Multi-format summary export (PDF/Excel) | PENDING | Workspace Hub | SUPPORTING |

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
*Workspace: `WS11_INVENTORY` | Route: `/lots` | Component: `M22LotsBatchesWorkspace.tsx` | Authority: SerialEngine / InventoryService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M22-F01 | Lot & Expiry Registration | `/lots` | `M22LotsBatchesWorkspace.tsx` | Register Lot | `/api/lots` | POST | SerialEngine | `lots` | Lot created with Mfg and Expiry dates | PENDING | Lot Tracking | CORE-CRITICAL |
| M22-F02 | FEFO Picking Recommendation | `/lots` | `M22LotsBatchesWorkspace.tsx` | Get FEFO Order | `/api/lots/fefo-recommendations`| GET | SerialEngine | `lots` sorting | Earliest expiry lots suggested for picking | PENDING | Picking Optimization | CORE-CRITICAL |
| M22-F03 | Expiry Quarantine Guard | `/lots` | `M22LotsBatchesWorkspace.tsx` | Quarantine Expired | `/api/lots/quarantine` | POST | SerialEngine | `lots.status` | Expired batches locked from sales allocation | PENDING | Quality & Compliance | CORE-CRITICAL |
| M22-F04 | Backward Lot Traceability | `/lots` | `M22LotsBatchesWorkspace.tsx` | Trace Lot | `/api/lots/:id/trace` | GET | SerialEngine | Lot Genealogy | Full supplier PO to customer SO trace tree | PENDING | Traceability & Recall | CORE-CRITICAL |

---

### M23 — Serial Number & IMEI Lifecycle Tracking
*Workspace: `WS11_INVENTORY` | Route: `/serials` | Component: `M23SerialsWorkspace.tsx` | Authority: SerialEngine*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M23-F01 | Serial Number Registration | `/serials` | `M23SerialsWorkspace.tsx` | Register Serials | `/api/serials` | POST | SerialEngine | `serial_numbers` | Unit-level serial numbers generated | PENDING | Serial Tracking | CORE-CRITICAL |
| M23-F02 | Serial Movement Traceability | `/serials` | `M23SerialsWorkspace.tsx` | Trace Serial | `/api/serials/traceability` | GET | SerialEngine | `serial_movements` | Complete lifecycle (PO ➔ Bin ➔ SO ➔ Warranty) | PENDING | Traceability | CORE-CRITICAL |
| M23-F03 | Warranty Status Verification | `/serials` | `M23SerialsWorkspace.tsx` | Check Warranty | `/api/serials/warranty-status` | GET | SerialEngine | `serial_numbers` | Active warranty period and repair history | PENDING | After-Sales & RMA | BUSINESS-CRITICAL |
| M23-F04 | Duplicate Serial Guard | `/serials` | `M23SerialsWorkspace.tsx` | Probe Duplicate | `/api/serials` | POST | SerialEngine | Unique Constraint | Duplicate serial numbers rejected | PENDING | Serial Integrity | CORE-CRITICAL |

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
*Workspace: `WS15_EAM` | Route: `/assets` | Component: `AssetMaintenanceWorkspace.tsx` | Authority: EamService / QualityService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M27-F01 | Fixed Asset Register | `/assets` | `AssetMaintenanceWorkspace.tsx` | Register Asset | `/api/eam/assets` | POST | EamService | `fixed_assets` | Machinery/Asset recorded with specs | PENDING | EAM & Assets | CORE-CRITICAL |
| M27-F02 | Preventive Maintenance Schedule | `/assets` | `AssetMaintenanceWorkspace.tsx` | Schedule PM | `/api/eam/maintenance-schedules`| POST | EamService | `maintenance_schedules`| Recurring maintenance calendar active | PENDING | Preventive Maint | BUSINESS-CRITICAL |
| M27-F03 | Maintenance Work Order & Spare Parts| `/assets` | `AssetMaintenanceWorkspace.tsx` | Issue Maint WO | `/api/eam/work-orders` | POST | InventoryService (M17) | `stock_balances` | Spare parts deducted strictly via M17 | PENDING | EAM & Inventory M17 | CORE-CRITICAL |
| M27-F04 | Asset Depreciation Sync to GL | `/assets` | `AssetMaintenanceWorkspace.tsx` | Run Depreciation | `/api/eam/assets/depreciation` | POST | AccountingEngine (M30) | `accounting_entries` | Monthly depreciation posted to VAS 214/642 | PENDING | Assets & Finance M30 | CORE-CRITICAL |

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
*Workspace: `WS28_DMS` | Route: `/digital-dms` | Component: `DMSWorkspace.tsx` | Authority: DmsService / SecurityService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M29-F01 | Cryptographic Document Vault | `/digital-dms` | `DMSWorkspace.tsx` | Upload Document | `/api/dms/vault` | POST | DmsService | `dms_documents` | Document stored with SHA-256 hash | PENDING | DMS Vault | CORE-CRITICAL |
| M29-F02 | Document Retention Policy Guard | `/digital-dms` | `DMSWorkspace.tsx` | Set Retention | `/api/dms/retention` | PUT | DmsService | `retention_policies` | Legal retention locked against deletion | PENDING | Compliance & DMS | BUSINESS-CRITICAL |
| M29-F03 | E-Signature & Certificate Sealing | `/digital-dms` | `DMSWorkspace.tsx` | Sign Document | `/api/dms/sign` | POST | DmsService | `e_signatures` | Digitally signed and cryptographically sealed | PENDING | Digital Signatures | CORE-CRITICAL |
| M29-F04 | Cross-Module Document Archiving | `/digital-dms` | `DMSWorkspace.tsx` | Archive Dossier | `/api/dms/archive` | POST | DmsService | `dms_archives` | Invoices/COAs archived with full provenance | PENDING | DMS Integration | BUSINESS |

---

### M30 — General Ledger & Financial Accounting (VAS Authority)
*Workspace: `WS05_FINANCE` | Route: `/finance` | Component: `M30GeneralLedgerWorkspace.tsx` | Authority: AccountingEngine (Sole Authority for General Ledger & VAS Double-Entry)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M30-F01 | Chart of Accounts (COA) Master | `/finance` | `M30GeneralLedgerWorkspace.tsx` | View COA | `/api/finance/chart-of-accounts`| GET | AccountingEngine | `chart_of_accounts` | Standard Vietnamese Accounting System (VAS) | PASS | Finance Master | CORE-CRITICAL |
| M30-F02 | Double-Entry Journal Voucher | `/finance` | `M30GeneralLedgerWorkspace.tsx` | Post Voucher | `/api/finance/gl/post` | POST | AccountingEngine | `accounting_entries` | Strict Dr = Cr double-entry validation | PASS | General Ledger | CORE-CRITICAL |
| M30-F03 | Trial Balance & Statement Engine | `/finance` | `M30GeneralLedgerWorkspace.tsx` | Generate TB | `/api/finance/trial-balance` | GET | AccountingEngine | Read-only calculation | Balanced Trial Balance, P&L, Balance Sheet | PASS | Financial Reporting | CORE-CRITICAL |
| M30-F04 | Fiscal Period Close & Lock Guard | `/finance` | `M30GeneralLedgerWorkspace.tsx` | Close Period | `/api/finance/periods/close` | POST | AccountingEngine | `fiscal_periods` | Period closed; retroactive writes prohibited | PASS | Finance Governance | CORE-CRITICAL |
| M30-X01 | Single-Writer Invariant Guard | `/finance` | `M30GeneralLedgerWorkspace.tsx` | Direct GL Probe | `/api/finance/gl/post` | POST | AccountingEngine | Boundary Lock | All external writes rejected; M30 is sole GL writer| PASS | Financial Integrity | CORE-CRITICAL |

---

### M31 — Invoices AR / AP Management
*Workspace: `WS06_INVOICES` | Route: `/invoices` | Component: `M31InvoicesArApWorkspace.tsx` | Authority: InvoiceEngine / AccountingEngine (M30)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M31-F01 | Accounts Receivable (AR) Invoices | `/invoices` | `M31InvoicesArApWorkspace.tsx` | View AR Invoices | `/api/invoices/ar` | GET | InvoiceEngine | `invoices` (AR) | Customer e-invoices with payment status | PENDING | AR Management | CORE-CRITICAL |
| M31-F02 | Accounts Payable (AP) Invoices | `/invoices` | `M31InvoicesArApWorkspace.tsx` | Register AP Bill | `/api/invoices/ap` | POST | InvoiceEngine | `invoices` (AP) | Vendor bills registered for 3-way match | PENDING | AP Management | CORE-CRITICAL |
| M31-F03 | Invoice GL Posting Delegation | `/invoices` | `M31InvoicesArApWorkspace.tsx` | Post to GL | `/api/invoices/:id/post-gl` | POST | AccountingEngine (M30) | `accounting_entries` | AR/AP posted to GL (131/331) via M30 | PENDING | Invoices & Finance M30 | CORE-CRITICAL |
| M31-F04 | AR/AP Aging Schedule Analysis | `/invoices` | `M31InvoicesArApWorkspace.tsx` | View Aging Report | `/api/invoices/aging` | GET | InvoiceEngine | Aging Metrics | 0-30, 31-60, 61-90, 90+ days aging breakdown | PENDING | Cash Flow & Credit | BUSINESS-CRITICAL |

---

### M32 — Payments & Treasury Management
*Workspace: `WS07_PAYMENTS` | Route: `/payments` | Component: `M32PaymentsTreasuryWorkspace.tsx` | Authority: TreasuryEngine / AccountingEngine (M30)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M32-F01 | Cash Book & Treasury Balances | `/payments` | `M32PaymentsTreasuryWorkspace.tsx` | View Cash Book | `/api/treasury/cash-books` | GET | TreasuryEngine | `cash_books` | Real-time cash and bank account balances | PENDING | Treasury Core | CORE-CRITICAL |
| M32-F02 | Payment Voucher Issuance (AP) | `/payments` | `M32PaymentsTreasuryWorkspace.tsx` | Create Payment | `/api/treasury/payment-vouchers` | POST | AccountingEngine (M30) | `payment_vouchers`, `accounting_entries` | Vendor payment posted to GL 331/112 | PENDING | AP & Treasury | CORE-CRITICAL |
| M32-F03 | Receipt Voucher Issuance (AR) | `/payments` | `M32PaymentsTreasuryWorkspace.tsx` | Create Receipt | `/api/treasury/receipt-vouchers` | POST | AccountingEngine (M30) | `receipt_vouchers`, `accounting_entries` | Customer collection posted to GL 111/131 | PENDING | AR & Treasury | CORE-CRITICAL |
| M32-F04 | Cash Flow Forecast | `/payments` | `M32PaymentsTreasuryWorkspace.tsx` | Forecast Cash | `/api/treasury/cash-flow` | GET | TreasuryEngine | Forecast Metrics | Projected 30-day liquidity and inflows | PENDING | Liquidity Management | BUSINESS-CRITICAL |

---

### M33 — Bank Reconciliation & Electronic Feeds
*Workspace: `WS08_BANK` | Route: `/bank-reconciliation` | Component: `M33BankReconciliationWorkspace.tsx` | Authority: BankReconciliationEngine*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M33-F01 | Bank Account Register | `/bank-reconciliation` | `M33BankReconciliationWorkspace.tsx` | Register Bank | `/api/bank/accounts` | POST | BankReconciliationEngine | `bank_accounts` | Bank account and currency details saved | PENDING | Banking Master | CORE-CRITICAL |
| M33-F02 | MT940 / CAMT Statement Import | `/bank-reconciliation` | `M33BankReconciliationWorkspace.tsx` | Import Statement | `/api/bank/statements` | POST | BankReconciliationEngine | `bank_statements` | Electronic statement lines ingested | PENDING | Bank Ingestion | CORE-CRITICAL |
| M33-F03 | Automated Reconciliation Engine | `/bank-reconciliation` | `M33BankReconciliationWorkspace.tsx` | Run Auto-Match | `/api/bank/reconcile` | POST | BankReconciliationEngine | `reconciliation_matches`| Reference/Amount auto-matching executed | PENDING | Reconciliation | CORE-CRITICAL |
| M33-F04 | Discrepancy Ledger & Unmatched | `/bank-reconciliation` | `M33BankReconciliationWorkspace.tsx` | View Unmatched | `/api/bank/unmatched` | GET | BankReconciliationEngine | `unmatched_items` | Outstanding checks and in-transit items | PENDING | Cash Audit | BUSINESS-CRITICAL |

---

### M34 — Financial Consolidation & Multi-Entity Reporting
*Workspace: `WS09_CONSOLIDATION` | Route: `/consolidation` | Component: `M34FinancialConsolidationWorkspace.tsx` | Authority: ConsolidationEngine / AccountingEngine (M30)*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M34-F01 | Multi-Entity Consolidation Run | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | Run Consolidation | `/api/finance/consolidation/runs` | POST | ConsolidationEngine | `consolidation_runs` | Financials aggregated across branches/entities | PENDING | Group Finance | CORE-CRITICAL |
| M34-F02 | Intercompany Elimination Vouchers | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | Post Elimination | `/api/finance/consolidation/eliminations`| POST | ConsolidationEngine | `elimination_entries` | Internal trade/debt balances netted out | PENDING | Intercompany Accounting| CORE-CRITICAL |
| M34-F03 | Consolidated Financial Statements | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | View Report | `/api/finance/consolidation/reports` | GET | ConsolidationEngine | Consolidated reports | Group Balance Sheet, P&L, and Cash Flow | PENDING | Group Executive | CORE-CRITICAL |
| M34-F04 | Currency Translation Adjustment | `/consolidation` | `M34FinancialConsolidationWorkspace.tsx` | Run FX Translation | `/api/finance/consolidation/fx-rates` | POST | ConsolidationEngine | `fx_adjustments` | Multi-currency translation to VND | PENDING | FX Accounting | BUSINESS-CRITICAL |

---

### M35 — Projects & Work Breakdown Structure (WBS)
*Workspace: `WS10_PROJECTS` | Route: `/projects` | Component: `M35ProjectsWBSWorkspace.tsx` | Authority: ProjectService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M35-F01 | Project Initiation & WBS Setup | `/projects` | `M35ProjectsWBSWorkspace.tsx` | Create WBS | `/api/projects/:id/wbs` | POST | ProjectService | `projects`, `wbs_nodes` | Hierarchical project tasks and milestones | PENDING | Project Core | CORE-CRITICAL |
| M35-F02 | Milestone Progress Tracking | `/projects` | `M35ProjectsWBSWorkspace.tsx` | Update Progress | `/api/projects/:id/progress` | PUT | ProjectService | `project_milestones` | Task completion and milestone achievement | PENDING | Project Tracking | BUSINESS-CRITICAL |
| M35-F03 | Earned Value Management (EVM) | `/projects` | `M35ProjectsWBSWorkspace.tsx` | Compute EVM | `/api/projects/evm` | GET | CostingEngine (M42) | EVM Metrics | Schedule Variance (SV) and Cost Variance (CV) | PENDING | Project Costing M42 | CORE-CRITICAL |
| M35-F04 | Project Resource Allocation | `/projects` | `M35ProjectsWBSWorkspace.tsx` | Allocate Resource | `/api/projects/resources` | POST | ProjectService | `project_resources` | Staff and equipment assigned to tasks | PENDING | Resource Management | BUSINESS |

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
*Workspace: `WS19_ANALYTICS` | Route: `/analytics` | Component: `M37BiAnalyticsWorkspace.tsx` | Authority: WorkspaceAggregationService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M37-F01 | Executive KPI Aggregation | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | Load Analytics | `/api/analytics/kpis` | GET | WorkspaceAggregationService | Read-only aggregation | Cross-domain revenue, COGS, inventory KPIs | PENDING | Executive Analytics | BUSINESS-CRITICAL |
| M37-F02 | Real-time Dashboard Visuals | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | Switch Dashboard | `/api/analytics/dashboards` | GET | WorkspaceAggregationService | Analytical Visuals | Recharts visual graphs across business units | PENDING | BI Dashboards | BUSINESS |
| M37-F03 | Ad-hoc Report Export Engine | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | Export Report | `/api/analytics/reports/export` | GET | WorkspaceAggregationService | Report Generation | Excel/PDF export of complex multi-entity data | PENDING | Reporting Engine | BUSINESS-CRITICAL |
| M37-F04 | Predictive Trends Forecast | `/analytics` | `M37BiAnalyticsWorkspace.tsx` | View Trends | `/api/analytics/forecast` | GET | WorkspaceAggregationService | Statistical Forecast | 90-day moving average and trend prediction | PENDING | Predictive Analytics | BUSINESS |

---

### M38 — IT Service Desk & Incident SLA Management
*Workspace: `WS20_SERVICEDESK` | Route: `/service-desk` | Component: `ServiceDeskWorkspace.tsx` | Authority: TaskManager / QualityService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M38-F01 | Service Ticket Creation | `/service-desk` | `ServiceDeskWorkspace.tsx` | Create Ticket | `/api/service-desk/tickets` | POST | TaskManager | `service_tickets` | Ticket logged with priority and category | PENDING | IT Service Desk | BUSINESS-CRITICAL |
| M38-F02 | SLA Deadline & Escalation Engine | `/service-desk` | `ServiceDeskWorkspace.tsx` | Monitor SLA | `/api/service-desk/sla` | GET | TaskManager | `sla_timers` | Real-time SLA breach countdown active | PENDING | SLA Governance | CORE-CRITICAL |
| M38-F03 | Incident Investigation & Resolution | `/service-desk` | `ServiceDeskWorkspace.tsx` | Resolve Ticket | `/api/service-desk/tickets/:id/resolve` | POST | TaskManager | `service_tickets` | Root cause documented and resolved | PENDING | Incident Management | BUSINESS-CRITICAL |
| M38-F04 | Resolution Sign-off & Ticket Close | `/service-desk` | `ServiceDeskWorkspace.tsx` | Close Ticket | `/api/service-desk/:id/close` | POST | TaskManager | `service_tickets.status` | Ticket officially closed with feedback | PENDING | Service Sign-off | CORE-CRITICAL |

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
*Workspace: `WS29_EHS` | Route: `/ehs` | Component: `EHSWorkspace.tsx` | Authority: QualityService / EamService*

| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M40-F01 | Workplace Incident Reporting | `/ehs` | `EHSWorkspace.tsx` | Log Incident | `/api/ehs/incidents` | POST | QualityService | `ehs_incidents` | Workplace safety incident recorded | PENDING | EHS Core | CORE-CRITICAL |
| M40-F02 | Job Safety Risk Analysis (JSA) | `/ehs` | `EHSWorkspace.tsx` | Assess Risk | `/api/ehs/risk-assessments` | POST | QualityService | `ehs_risk_assessments` | Risk matrix score calculated | PENDING | Safety Risk | BUSINESS-CRITICAL |
| M40-F03 | Safety CAPA Enforcement | `/ehs` | `EHSWorkspace.tsx` | Assign CAPA | `/api/ehs/capas` | POST | QualityService | `ehs_capas` | Corrective action assigned and tracked | PENDING | EHS Compliance | CORE-CRITICAL |
| M40-F04 | Safety Audit Checklist | `/ehs` | `EHSWorkspace.tsx` | Conduct Audit | `/api/ehs/audits` | POST | QualityService | `ehs_audits` | Safety compliance inspection signed off | PENDING | EHS Audit | BUSINESS |

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
