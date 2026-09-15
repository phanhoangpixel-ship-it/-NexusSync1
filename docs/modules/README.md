# NEXUSSYNC ERP — MODULE SPECIFICATIONS & UPGRADE READINESS INDEX (M01 – M42)

**Document Classification:** OFFICIAL ENTERPRISE ARCHITECTURAL SPECIFICATION SUITE  
**Baseline Version:** 2.0 (Consolidated 42-Module Suite)  
**Authority Reference:** `/docs/MODULE_MAP.md` & `/docs/AI/GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`

---

## 1. Master Index & Module Upgrade Readiness Matrix

Every module file in this directory (`/docs/modules/Mxx_*.md`) provides the authoritative specification, data contract, API endpoints, Single-Writer domain boundaries, UI/UX design standards, and upgrade checklist for feature extensions.

| Module ID | Module Name | Workspace | Group | Single-Writer Authority | Specification File |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **M01** | Workspace Hub & Orchestration | `WS01_HUB` | `CORE` | Session & WorkQueue Orchestrator | [`M01_WORKSPACE_HUB.md`](./M01_WORKSPACE_HUB.md) |
| **M02** | Audit Compliance & Checksum | `WS28_DMS` | `GOVERNANCE` | Immutable Audit Trail & SHA-256 | [`M02_AUDIT_COMPLIANCE.md`](./M02_AUDIT_COMPLIANCE.md) |
| **M03** | System Settings & Parameters | `WS01_HUB` | `GOVERNANCE` | Global Configuration & Multi-Currency | [`M03_SYSTEM_SETTINGS.md`](./M03_SYSTEM_SETTINGS.md) |
| **M04** | SuperAdmin Portal & RBAC Matrix | `WS01_HUB` | `GOVERNANCE` | User Provisioning & Granular RBAC | [`M04_SUPERADMIN_PORTAL.md`](./M04_SUPERADMIN_PORTAL.md) |
| **M05** | EventBus Platform & EDA Outbox | `WS26_SERVICEDESK`| `GOVERNANCE` | EventBroker, Outbox & DLQ Relay | [`M05_EVENTBUS_EDA.md`](./M05_EVENTBUS_EDA.md) |
| **M06** | Innovation R&D & Formulation | `WS05_INVENTORY` | `MANUFACTURING` | R&D Formulation & Trial Runs | [`M06_INNOVATION_RD.md`](./M06_INNOVATION_RD.md) |
| **M07** | Enterprise Master Data | `WS02_CRM` | `COMMERCIAL` | Shared Item Master & Customer Directory | [`M07_ENTERPRISE_MASTER_DATA.md`](./M07_ENTERPRISE_MASTER_DATA.md) |
| **M08** | Purchase Orders (P2P Procurement)| `WS04_PURCHASE` | `PROCUREMENT` | Purchase Orders & 3-Way Matching | [`M08_PURCHASE_ORDERS.md`](./M08_PURCHASE_ORDERS.md) |
| **M09** | Suppliers SRM Profiles & Terms | `WS04_PURCHASE` | `PROCUREMENT` | Vendor Master & Payment Terms | [`M09_SUPPLIERS_SRM.md`](./M09_SUPPLIERS_SRM.md) |
| **M10** | Strategic Sourcing & RFQ | `WS24_SOURCING` | `PROCUREMENT` | RFP Packages & Bidding Comparison | [`M10_STRATEGIC_SOURCING.md`](./M10_STRATEGIC_SOURCING.md) |
| **M11** | SRM Supplier Performance | `WS25_SRM` | `PROCUREMENT` | Supplier Evaluation & Scorecards | [`M11_SRM_SUPPLIER_MGMT.md`](./M11_SRM_SUPPLIER_MGMT.md) |
| **M12** | CRM Leads & Opportunities | `WS02_CRM` | `COMMERCIAL` | Lead Funnel & Sales Pipeline | [`M12_CRM_LEADS.md`](./M12_CRM_LEADS.md) |
| **M13** | Sales Orders (O2C Commercial) | `WS03_SALES` | `COMMERCIAL` | Sales Orders & Stock Allocation | [`M13_SALES_ORDERS.md`](./M13_SALES_ORDERS.md) |
| **M14** | Sales Commission & Incentives | `WS03_SALES` | `COMMERCIAL` | Quota Attainment & VAS 6418 Payout | [`M14_SALES_COMMISSION.md`](./M14_SALES_COMMISSION.md) |
| **M15** | Returns & RMA Dispositions | `WS22_RMA` | `COMMERCIAL` | Customer Returns & RMA Disposition | [`M15_RETURNS_RMA.md`](./M15_RETURNS_RMA.md) |
| **M16** | Retail POS & Counter | `WS23_POS` | `COMMERCIAL` | Cashier Shifts & Register Tenders | [`M16_POS_RETAIL.md`](./M16_POS_RETAIL.md) |
| **M17** | Master WMS & Core Inventory | `WS05_MASTER_WMS`| `WAREHOUSE` | **InventoryService.postTransaction()** | [`M17_INVENTORY_CORE_WMS.md`](./M17_INVENTORY_CORE_WMS.md) |
| **M18** | Warehouse Structure & Bin/Rack | `WS06_WAREHOUSE` | `WAREHOUSE` | Storage Hierarchy & Bin Capacities | [`M18_WAREHOUSE_MANAGEMENT.md`](./M18_WAREHOUSE_MANAGEMENT.md) |
| **M19** | Stocktake / Kiểm kê | `WS07_STOCKTAKE` | `WAREHOUSE` | Blind Count Cycles & Variance Audits | [`M19_STOCKTAKE.md`](./M19_STOCKTAKE.md) |
| **M20** | Stock Adjustment | `WS08_ADJUSTMENT`| `WAREHOUSE` | Discrepancy Governance & Write-offs | [`M20_STOCK_ADJUSTMENT.md`](./M20_STOCK_ADJUSTMENT.md) |
| **M21** | Internal Transfers | `WS09_TRANSFER` | `WAREHOUSE` | Branch Transfers & In-Transit Custody | [`M21_INTERNAL_TRANSFERS.md`](./M21_INTERNAL_TRANSFERS.md) |
| **M22** | Lots & Batches (FEFO/FIFO) | `WS10_LOTS` | `WAREHOUSE` | Lot Shelf Life & Expiry Warnings | [`M22_LOTS_BATCHES.md`](./M22_LOTS_BATCHES.md) |
| **M23** | Serials & IMEI Tracking | `WS11_SERIALS` | `WAREHOUSE` | Serial Number & Warranty Genealogy | [`M23_SERIALS_IMEI.md`](./M23_SERIALS_IMEI.md) |
| **M24** | WMS Extended (Wave & LPN) | `WS12_WMS_EXT` | `WAREHOUSE` | Wave Picking & LPN Containerization | [`M24_WMS_EXTENDED.md`](./M24_WMS_EXTENDED.md) |
| **M25** | Manufacturing Execution (MES) | `WS13_MES` | `MANUFACTURING` | Manufacturing Orders & BOM Routing | [`M25_MANUFACTURING_BOM.md`](./M25_MANUFACTURING_BOM.md) |
| **M26** | Supply Chain SCM & MRP Netting | `WS14_SCM` | `MANUFACTURING` | Demand Forecasting & MRP Netting | [`M26_SUPPLY_CHAIN_SCM.md`](./M26_SUPPLY_CHAIN_SCM.md) |
| **M27** | EAM Asset Maintenance | `WS15_EAM` | `MAINTENANCE` | Plant Equipment Health & PM Orders | [`M27_EAM_MAINTENANCE.md`](./M27_EAM_MAINTENANCE.md) |
| **M28** | HR, Personnel & Payroll | `WS18_FINANCE` | `MANUFACTURING` | Employee Roster, Timesheets & Payroll | [`M28_HR_PAYROLL.md`](./M28_HR_PAYROLL.md) |
| **M29** | Document Management System (DMS)| `WS28_DMS` | `GOVERNANCE` | Electronic Document & Contract Storage | [`M29_DMS_DOCUMENTS.md`](./M29_DMS_DOCUMENTS.md) |
| **M30** | Finance & General Ledger (GL) | `WS18_FINANCE` | `FINANCE` | **AccountingService / GL Single-Writer** | [`M30_FINANCE_GL.md`](./M30_FINANCE_GL.md) |
| **M31** | Invoices AR/AP & VAT Invoicing | `WS19_INVOICES` | `FINANCE` | **Central Tax Engine Authority** | [`M31_INVOICES_AR_AP.md`](./M31_INVOICES_AR_AP.md) |
| **M32** | Payments & Treasury Cash | `WS20_PAYMENTS` | `FINANCE` | Cash Book, Receipts & Disbursements | [`M32_PAYMENTS_CASH.md`](./M32_PAYMENTS_CASH.md) |
| **M33** | Bank Reconciliation & VietQR | `WS21_BANK` | `FINANCE` | Bank Matching & VietQR Reconciliation | [`M33_BANK_RECONCILIATION.md`](./M33_BANK_RECONCILIATION.md) |
| **M34** | Financial Consolidation | `WS18_FINANCE` | `FINANCE` | Multi-Branch Elimination & Consolidations | [`M34_FINANCIAL_CONSOLIDATION.md`](./M34_FINANCIAL_CONSOLIDATION.md) |
| **M35** | Projects & Job Costing (WBS) | `WS16_PROJECTS` | `PROJECTS` | WBS Work Breakdown & Timesheet Cost | [`M35_PROJECTS_WBS.md`](./M35_PROJECTS_WBS.md) |
| **M36** | Logistics & Fleet (TMS) | `WS17_LOGISTICS`| `LOGISTICS` | Transport Runs, Carrier Rating & POD | [`M36_LOGISTICS_TMS.md`](./M36_LOGISTICS_TMS.md) |
| **M37** | BI & Executive Analytics Reports| `WS18_FINANCE` | `GOVERNANCE` | Executive KPIs, P&L & Statutory Reports | [`M37_BI_ANALYTICS.md`](./M37_BI_ANALYTICS.md) |
| **M38** | Service Desk & IT Ticketing | `WS26_SERVICEDESK`| `GOVERNANCE` | Support Ticketing & SLA Escalation | [`M38_SERVICE_DESK.md`](./M38_SERVICE_DESK.md) |
| **M39** | Quality Control & Inspection QMS| `WS27_QUALITY` | `GOVERNANCE` | IQC/PQC/OQC Plans & NCR Quarantines | [`M39_QUALITY_CONTROL_QMS.md`](./M39_QUALITY_CONTROL_QMS.md) |
| **M40** | EHS Safety & Environment | `WS29_EHS` | `GOVERNANCE` | Safety Audits, PPE & Compliance Logs | [`M40_EHS_SAFETY.md`](./M40_EHS_SAFETY.md) |
| **M41** | Product Pricing & Price Mgmt | `WS30_PRICING` | `COMMERCIAL` | **Pricing Engine Authority (Selling Prices)** | [`M41_PRICING_MANAGEMENT.md`](./M41_PRICING_MANAGEMENT.md) |
| **M42** | Cost Allocation & COGS Engine | `WS31_COGS` | `FINANCE` | **CostingService (Landed Cost & COGS)** | [`M42_COGS_ALLOCATION.md`](./M42_COGS_ALLOCATION.md) |

---

## 2. Upgrade Protocol & Governance Gate

Before implementing any feature upgrades on any module:
1. **Locate Module File:** Open `/docs/modules/Mxx_*.md`.
2. **Authority Check:** Verify if the feature impacts Inventory, Accounting, Pricing, or Costing. Always route mutations to the respective single writer.
3. **UI/UX Enterprise Standards:** Check Rule #19 (`ConfirmDialog`, WCAG AA, `font-mono tabular-nums`) and Rule #20 (Full design replication).
4. **Verification:** Run `compile_applet` and verify no regressions in cross-module workflows.
