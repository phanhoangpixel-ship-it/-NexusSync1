# NEXUSSYNC ERP — 160-FEATURE MASTER TEST MATRIX
**Baseline Version**: Business Functional Baseline 1.0  
**Status**: Locked & Verified (40 Modules, 160 Features, 100% PASS)

---

## Overview
This master matrix establishes the authoritative mapping of all 160 features across the 40 NexusSync ERP modules, detailing their UI routes, primary UI components, user actions, API endpoints, business services, core engines, database effects, expected results, regression scopes, and criticality classifications.

---

## Master Feature Matrix (M01 - M40)

### M01 — IAM / Authentication
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M01-F01 | User Login | `/login` | `SimulatedLoginModal.tsx` | Authenticate | `/api/auth/login` | POST | AuthService | Session Token | Valid JWT & User Context | PASS | IAM + RBAC | CORE-CRITICAL |
| M01-F02 | Token Refresh | `/` | `GlobalHeader.tsx` | Auto Refresh | `/api/auth/refresh` | POST | AuthService | Session Cache | Extended Token Validity | PASS | IAM | CORE-CRITICAL |
| M01-F03 | Session Logout | `/` | `GlobalHeader.tsx` | Logout | `/api/auth/logout` | POST | AuthService | Destroy Session | Clear Auth State & Redirect | PASS | IAM | CORE-CRITICAL |
| M01-F04 | RBAC Role Check | `/` | `DomainWorkspaceShell.tsx` | Render Guard | `/api/auth/permissions` | GET | AuthorityManager | Auth Matrix | Enforce Role Access | PASS | IAM + RBAC | CORE-CRITICAL |

### M02 — Organization / Master Data
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M02-F01 | Branch Mapping | `/org` | `GenericModuleWorkspace.tsx` | Create/Edit | `/api/org/branches` | POST | OrgService | Branch Table | Branch Hierarchy Stored | PASS | Org + Master | BUSINESS |
| M02-F02 | Cost Center Hierarchy | `/org` | `GenericModuleWorkspace.tsx` | Define | `/api/org/cost-centers` | POST | OrgService | Cost Center Table | Cost Center Assigned | PASS | Org + Finance | BUSINESS-CRITICAL |
| M02-F03 | Currency Rate Setup | `/org` | `GenericModuleWorkspace.tsx` | Update | `/api/org/currencies` | PUT | FinanceEngine | Exchange Rate | FX Rates Synchronized | PASS | Org + Finance | BUSINESS-CRITICAL |
| M02-F04 | Fiscal Period Control | `/org` | `GenericModuleWorkspace.tsx` | Close Period | `/api/org/fiscal-periods` | POST | FinanceEngine | Period Ledger | Period Locked | PASS | Org + Finance | CORE-CRITICAL |

### M03 — Product / Item Master
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M03-F01 | SKU Creation | `/items` | `GenericModuleWorkspace.tsx` | Create SKU | `/api/items` | POST | ItemService | items table | New SKU Registered | PASS | Item Master + Inventory | CORE-CRITICAL |
| M03-F02 | UOM Conversion | `/items` | `GenericModuleWorkspace.tsx` | Configure | `/api/items/uom` | POST | ItemService | uom_conversions | Conversion Factors Set | PASS | Item Master | BUSINESS |
| M03-F03 | Barcode Matrix | `/items` | `GenericModuleWorkspace.tsx` | Generate | `/api/items/barcodes` | POST | ItemService | barcode table | Barcode Linked to SKU | PASS | Item Master | BUSINESS |
| M03-F04 | Item Category Routing | `/items` | `GenericModuleWorkspace.tsx` | Categorize | `/api/items/categories` | PUT | ItemService | category table | Category Assigned | PASS | Item Master | BUSINESS |

### M04 — Supplier / Purchasing
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M04-F01 | Vendor Onboarding | `/suppliers` | `SupplyChainWorkspace.tsx` | Register Vendor | `/api/suppliers` | POST | SupplierService | suppliers table | Vendor Active | PASS | Supplier + P2P | BUSINESS-CRITICAL |
| M04-F02 | Price Agreement | `/suppliers` | `SupplyChainWorkspace.tsx` | Set Pricing | `/api/suppliers/prices` | POST | SupplierService | price_agreements | Contract Rates Stored | PASS | Supplier + Costing | BUSINESS-CRITICAL |
| M04-F03 | P2P Requisition | `/suppliers` | `SupplyChainWorkspace.tsx` | Create PO | `/api/purchase-orders` | POST | ProcurementService | purchase_orders | PO Generated | PASS | Supplier + P2P | CORE-CRITICAL |
| M04-F04 | Vendor Performance | `/suppliers` | `SupplyChainWorkspace.tsx` | Evaluate | `/api/suppliers/eval` | GET | SupplierService | vendor_metrics | Rating Computed | PASS | Supplier | SUPPORTING |

### M05 — Sales / Customer
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M05-F01 | Customer Master | `/customers` | `GenericModuleWorkspace.tsx` | Add Customer | `/api/customers` | POST | CustomerService | customers table | Customer Registered | PASS | Customer + O2C | BUSINESS-CRITICAL |
| M05-F02 | Credit Limit Check | `/customers` | `GenericModuleWorkspace.tsx` | Validate | `/api/customers/credit` | POST | CustomerService | credit_ledger | Credit Limit Enforced | PASS | Customer + O2C | CORE-CRITICAL |
| M05-F03 | Customer Pricing Tier | `/customers` | `GenericModuleWorkspace.tsx` | Assign Tier | `/api/customers/tiers` | PUT | CustomerService | price_tiers | Pricing Tier Applied | PASS | Customer + Sales | BUSINESS |
| M05-F04 | Customer Portal Access | `/customers` | `GenericModuleWorkspace.tsx` | Grant Portal | `/api/customers/portal` | POST | CustomerService | portal_users | Access Provisioned | PASS | Customer | SUPPORTING |

### M06 — Warehouse / Location
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M06-F01 | Warehouse Setup | `/warehouses` | `InventoryDashboard.tsx` | Create WH | `/api/warehouses` | POST | InventoryService | warehouses table | Warehouse Created | PASS | Warehouse + WMS | CORE-CRITICAL |
| M06-F02 | Zone-Aisle-Bin Mapping | `/warehouses` | `InventoryDashboard.tsx` | Define Bins | `/api/warehouses/bins` | POST | InventoryService | locations table | Bin Locations Active | PASS | Warehouse + WMS | CORE-CRITICAL |
| M06-F03 | Storage Type Setup | `/warehouses` | `InventoryDashboard.tsx` | Configure | `/api/warehouses/types` | PUT | InventoryService | storage_types | Rules Applied | PASS | Warehouse | BUSINESS |
| M06-F04 | Zone Capacity Rule | `/warehouses` | `InventoryDashboard.tsx` | Set Capacity | `/api/warehouses/capacity` | PUT | InventoryService | zone_limits | Limits Enforced | PASS | Warehouse | BUSINESS |

### M07 — Inventory Control / Balances
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M07-F01 | Real-time Stock Query | `/inventory` | `InventoryDashboard.tsx` | View Balances | `/api/inventory/balances` | GET | InventoryService | stock_balances | Accurate Stock Displayed | PASS | Inventory | CORE-CRITICAL |
| M07-F02 | Batch/Lot Tracking | `/inventory` | `InventoryDashboard.tsx` | Track Lot | `/api/inventory/lots` | GET | SerialEngine | lot_ledger | Lot Genealogy Shown | PASS | Inventory + Serial | CORE-CRITICAL |
| M07-F03 | Safety Stock Alerts | `/inventory` | `InventoryDashboard.tsx` | Monitor | `/api/inventory/alerts` | GET | InventoryService | alert_log | Alerts Generated | PASS | Inventory | BUSINESS-CRITICAL |
| M07-F04 | Inventory Valuation | `/inventory` | `InventoryDashboard.tsx` | Calculate | `/api/inventory/valuation` | GET | CostingEngine | stock_valuation | Valuation Total Computed | PASS | Inventory + Costing | CORE-CRITICAL |

### M08 — Inventory Transactions
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M08-F01 | Goods Receipt | `/inventory` | `InventoryDashboard.tsx` | Receive Stock | `/api/inventory/receipts` | POST | InventoryService | stock_ledger | Stock Increased, Ledger Written | PASS | Inventory + P2P | CORE-CRITICAL |
| M08-F02 | Goods Issue | `/inventory` | `InventoryDashboard.tsx` | Issue Stock | `/api/inventory/issues` | POST | InventoryService | stock_ledger | Stock Decreased, Ledger Written | PASS | Inventory + O2C | CORE-CRITICAL |
| M08-F03 | Material Transfer | `/inventory` | `InventoryDashboard.tsx` | Transfer | `/api/inventory/transfers` | POST | InventoryService | stock_ledger | Inter-WH Balance Updated | PASS | Inventory | CORE-CRITICAL |
| M08-F04 | Transaction Reversal | `/inventory` | `InventoryDashboard.tsx` | Reverse | `/api/inventory/reverse` | POST | InventoryService | stock_ledger | Contra Ledger Posted | PASS | Inventory | CORE-CRITICAL |

### M09 — Stock Transfer
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M09-F01 | Inter-Warehouse Transfer | `/stock-transfer` | `SupplyChainWorkspace.tsx` | Initiate Transfer | `/api/transfers` | POST | InventoryService | in_transit_ledger | Transfer Order Created | PASS | Transfer + WMS | CORE-CRITICAL |
| M09-F02 | In-Transit Tracking | `/stock-transfer` | `SupplyChainWorkspace.tsx` | Monitor | `/api/transfers/in-transit` | GET | InventoryService | transfer_status | In-Transit State Shown | PASS | Transfer | BUSINESS-CRITICAL |
| M09-F03 | Receipt Confirmation | `/stock-transfer` | `SupplyChainWorkspace.tsx` | Confirm Receipt | `/api/transfers/:id/receive` | POST | InventoryService | stock_balances | Dest WH Stock Increased | PASS | Transfer + Inventory | CORE-CRITICAL |
| M09-F04 | Transfer Variance Log | `/stock-transfer` | `SupplyChainWorkspace.tsx` | Inspect | `/api/transfers/variance` | GET | InventoryService | transfer_variance | Variance Recorded | PASS | Transfer | BUSINESS |

### M10 — Stock Adjustment
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M10-F01 | Create Adjustment | `/stock-adjustment` | `StockAdjustmentWorkspace.tsx` | Create Draft | `/api/stock-adjustments` | POST | StockAdjustmentService | adjustment_draft | Draft Saved | PASS | Stock Adjustment | CORE-CRITICAL |
| M10-F02 | Approve Stock Adjustment | `/stock-adjustment` | `StockAdjustmentWorkspace.tsx` | Approve | `/api/stock-adjustments/:id/approve` | POST | StockAdjustmentService | stock_ledger & GL | Stock Updated & GL Posted | PASS | Stock Adjustment + Inventory + GL | CORE-CRITICAL |
| M10-F03 | Reject Adjustment | `/stock-adjustment` | `StockAdjustmentWorkspace.tsx` | Reject | `/api/stock-adjustments/:id/reject` | POST | StockAdjustmentService | adjustment_status | Status Rejected | PASS | Stock Adjustment | BUSINESS-CRITICAL |
| M10-F04 | Audit Adjustment Log | `/stock-adjustment` | `StockAdjustmentWorkspace.tsx` | View History | `/api/stock-adjustments/audit` | GET | StockAdjustmentService | audit_trail | Complete Audit Trail | PASS | Stock Adjustment | CORE-CRITICAL |

### M11 — Stocktake
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M11-F01 | Cycle Count Plan | `/stocktake` | `InventoryDashboard.tsx` | Schedule Count | `/api/stocktake/plans` | POST | InventoryService | stocktake_plans | Plan Created | PASS | Stocktake | BUSINESS-CRITICAL |
| M11-F02 | Blind Count Entry | `/stocktake` | `InventoryDashboard.tsx` | Enter Counts | `/api/stocktake/counts` | POST | InventoryService | count_entries | Counts Recorded | PASS | Stocktake | CORE-CRITICAL |
| M11-F03 | Variance Reconciliation | `/stocktake` | `InventoryDashboard.tsx` | Reconcile | `/api/stocktake/reconcile` | POST | InventoryService | variance_report | Variances Computed | PASS | Stocktake + Inventory | CORE-CRITICAL |
| M11-F04 | Final Stocktake Posting | `/stocktake` | `InventoryDashboard.tsx` | Post Counts | `/api/stocktake/post` | POST | InventoryService | stock_balances & GL | Balances Adjusted & Posted | PASS | Stocktake + Inventory + GL | CORE-CRITICAL |

### M12 — Lot / Serial / FEFO-FIFO
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M12-F01 | Expiry Tracking | `/serial` | `InventoryDashboard.tsx` | Monitor Expiry | `/api/serial/expiry` | GET | SerialEngine | lot_expiry | Expiry Alerts Active | PASS | Serial + Inventory | CORE-CRITICAL |
| M12-F02 | Lot Traceability Tree | `/serial` | `InventoryDashboard.tsx` | Trace Lot | `/api/serial/trace` | GET | SerialEngine | lot_genealogy | Upstream/Downstream Shown | PASS | Serial | CORE-CRITICAL |
| M12-F03 | Serial Number History | `/serial` | `InventoryDashboard.tsx` | Query Serial | `/api/serial/history` | GET | SerialEngine | serial_ledger | Complete Serial Lifecycle | PASS | Serial | CORE-CRITICAL |
| M12-F04 | FEFO Allocation Rule | `/serial` | `InventoryDashboard.tsx` | Configure | `/api/serial/fefo` | PUT | SerialEngine | allocation_rules | FEFO Rule Enforced | PASS | Serial + WMS | CORE-CRITICAL |

### M13 — Inventory Reports / Valuation
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M13-F01 | Aging Report | `/reports` | `GenericModuleWorkspace.tsx` | Run Report | `/api/reports/aging` | GET | CostingEngine | aging_data | Inventory Aging Buckets | PASS | Reports + Costing | BUSINESS-CRITICAL |
| M13-F02 | ABC Analysis | `/reports` | `GenericModuleWorkspace.tsx` | Classify | `/api/reports/abc` | GET | InventoryService | abc_classification | SKU Classes Assigned | PASS | Reports | BUSINESS |
| M13-F03 | Valuation Ledger | `/reports` | `GenericModuleWorkspace.tsx` | View Ledger | `/api/reports/valuation` | GET | CostingEngine | valuation_ledger | Total Valuation Correct | PASS | Reports + Costing | CORE-CRITICAL |
| M13-F04 | Turnover Ratio | `/reports` | `GenericModuleWorkspace.tsx` | Calculate | `/api/reports/turnover` | GET | CostingEngine | turnover_metrics | Turnover Computed | PASS | Reports | BUSINESS |

### M14 — Purchase / P2P
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M14-F01 | PO Generation | `/procurement` | `SupplyChainWorkspace.tsx` | Create PO | `/api/p2p/po` | POST | ProcurementService | purchase_orders | PO Issued | PASS | P2P + Supplier | CORE-CRITICAL |
| M14-F02 | 3-Way Matching | `/procurement` | `SupplyChainWorkspace.tsx` | Match Invoice | `/api/p2p/match` | POST | ProcurementService | matching_ledger | PO-Receipt-Invoice Matched | PASS | P2P + Finance | CORE-CRITICAL |
| M14-F03 | AP Voucher Conversion | `/procurement` | `SupplyChainWorkspace.tsx` | Convert | `/api/p2p/voucher` | POST | ProcurementService | ap_vouchers | AP Voucher Created | PASS | P2P + AP | CORE-CRITICAL |
| M14-F04 | Vendor Payment Schedule | `/procurement` | `SupplyChainWorkspace.tsx` | Schedule | `/api/p2p/schedule` | GET | ProcurementService | payment_schedule | Schedule Generated | PASS | P2P + Finance | BUSINESS-CRITICAL |

### M15 — Manufacturing / MES / BOM
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M15-F01 | Multi-level BOM | `/manufacturing` | `ManufacturingWorkspace.tsx` | Define BOM | `/api/mes/bom` | POST | ProcessEngine | bom_tree | BOM Structure Saved | PASS | MES + BOM | CORE-CRITICAL |
| M15-F02 | Work Order Release | `/manufacturing` | `ManufacturingWorkspace.tsx` | Release MO | `/api/mes/work-orders` | POST | ProcessEngine | work_orders | MO Released to Floor | PASS | MES + Inventory | CORE-CRITICAL |
| M15-F03 | Shop Floor Operation Log | `/manufacturing` | `ManufacturingWorkspace.tsx` | Log Progress | `/api/mes/operations` | POST | ProcessEngine | op_log | Operations Updated | PASS | MES | CORE-CRITICAL |
| M15-F04 | Finished Goods Output | `/manufacturing` | `ManufacturingWorkspace.tsx` | Report Yield | `/api/mes/output` | POST | InventoryService | stock_balances & GL | FG Stock Increased & Cost Posted | PASS | MES + Inventory + Costing | CORE-CRITICAL |

### M16 — Supply Chain / MRP
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M16-F01 | Demand Forecasting | `/mrp` | `SupplyChainWorkspace.tsx` | Run Forecast | `/api/mrp/forecast` | POST | OrchestrationEngine | forecast_data | Demand Projected | PASS | MRP + SCM | BUSINESS-CRITICAL |
| M16-F02 | Net Requirement Calculation | `/mrp` | `SupplyChainWorkspace.tsx` | Calculate MRP | `/api/mrp/calculate` | POST | OrchestrationEngine | net_requirements | Net Needs Computed | PASS | MRP + SCM | CORE-CRITICAL |
| M16-F03 | Planned Order Generation | `/mrp` | `SupplyChainWorkspace.tsx` | Generate Orders | `/api/mrp/planned-orders` | POST | OrchestrationEngine | planned_orders | Planned Orders Created | PASS | MRP + Procurement | CORE-CRITICAL |
| M16-F04 | MRP Exception Monitor | `/mrp` | `SupplyChainWorkspace.tsx` | Inspect | `/api/mrp/exceptions` | GET | OrchestrationEngine | mrp_exceptions | Exceptions Displayed | PASS | MRP | BUSINESS |

### M17 — EAM / CMMS
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M17-F01 | Preventive Maintenance Schedule| `/eam` | `AssetMaintenanceWorkspace.tsx` | Schedule PM | `/api/eam/pm` | POST | QualityService | pm_schedule | PM Plan Active | PASS | EAM + CMMS | BUSINESS-CRITICAL |
| M17-F02 | Equipment Work Order | `/eam` | `AssetMaintenanceWorkspace.tsx` | Create WO | `/api/eam/work-orders` | POST | QualityService | equipment_wo | WO Dispatched | PASS | EAM + Inventory | CORE-CRITICAL |
| M17-F03 | Spare Parts Requisition | `/eam` | `AssetMaintenanceWorkspace.tsx` | Request Parts | `/api/eam/parts` | POST | InventoryService | stock_reservation | Parts Reserved | PASS | EAM + Inventory | CORE-CRITICAL |
| M17-F04 | Asset Downtime Log | `/eam` | `AssetMaintenanceWorkspace.tsx` | Record Downtime | `/api/eam/downtime` | POST | QualityService | downtime_log | Downtime Recorded | PASS | EAM | BUSINESS |

### M18 — HR / Payroll
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M18-F01 | Personnel Records | `/hr` | `HRWorkspace.tsx` | Add Employee | `/api/hr/employees` | POST | PayrollService | employees table | Employee Registered | PASS | HR + Payroll | CORE-CRITICAL |
| M18-F02 | Time & Attendance | `/hr` | `HRWorkspace.tsx` | Import Logs | `/api/hr/attendance` | POST | PayrollService | attendance_log | Hours Recorded | PASS | HR + Payroll | CORE-CRITICAL |
| M18-F03 | Payroll Run & Tax | `/hr` | `HRWorkspace.tsx` | Execute Payroll | `/api/hr/payroll-run` | POST | PayrollService | payroll_ledger | Net Pay & Taxes Calculated | PASS | HR + Payroll + GL | CORE-CRITICAL |
| M18-F04 | Leave Management | `/hr` | `HRWorkspace.tsx` | Request Leave | `/api/hr/leave` | POST | PayrollService | leave_ledger | Leave Balance Updated | PASS | HR | BUSINESS |

### M19 — CRM
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M19-F01 | Lead Pipeline | `/crm` | `GenericModuleWorkspace.tsx` | Add Lead | `/api/crm/leads` | POST | ProjectService | leads table | Lead Created | PASS | CRM + Sales | BUSINESS-CRITICAL |
| M19-F02 | Opportunity Stage Tracking | `/crm` | `GenericModuleWorkspace.tsx` | Update Stage | `/api/crm/opportunities` | PUT | ProjectService | opp_stages | Stage Advanced | PASS | CRM + Sales | BUSINESS-CRITICAL |
| M19-F03 | Quotation Generation | `/crm` | `GenericModuleWorkspace.tsx` | Create Quote | `/api/crm/quotes` | POST | ProjectService | quotes table | Quote Sent | PASS | CRM + O2C | CORE-CRITICAL |
| M19-F04 | Customer Interaction Log | `/crm` | `GenericModuleWorkspace.tsx` | Log Activity | `/api/crm/interactions` | POST | ProjectService | interaction_log | Activity Saved | PASS | CRM | SUPPORTING |

### M20 — DMS / Documents
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M20-F01 | Document Check-in | `/dms` | `DMSWorkspace.tsx` | Upload Doc | `/api/dms/documents` | POST | TaskManager | document_vault | File Stored securely | PASS | DMS | CORE-CRITICAL |
| M20-F02 | Version Control | `/dms` | `DMSWorkspace.tsx` | New Version | `/api/dms/versions` | POST | TaskManager | doc_versions | Version Incremented | PASS | DMS | CORE-CRITICAL |
| M20-F03 | Digital Watermarking | `/dms` | `DMSWorkspace.tsx` | Apply Seal | `/api/dms/watermark` | POST | TaskManager | watermarked_docs | Seal Applied | PASS | DMS | BUSINESS |
| M20-F04 | Document Access Policy | `/dms` | `DMSWorkspace.tsx` | Set Policy | `/api/dms/policies` | PUT | AuthorityManager | access_rules | Policy Enforced | PASS | DMS + RBAC | CORE-CRITICAL |

### M21 — Sales / O2C
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M21-F01 | Sales Order | `/sales` | `SupplyChainWorkspace.tsx` | Create SO | `/api/sales/orders` | POST | CommissionService | sales_orders | SO Created & Reserved | PASS | Sales + O2C | CORE-CRITICAL |
| M21-F02 | Pick-Pack-Ship | `/sales` | `SupplyChainWorkspace.tsx` | Process Shipment | `/api/sales/shipments` | POST | InventoryService | stock_ledger & COGS | Stock Issued & COGS Posted | PASS | Sales + Inventory + GL | CORE-CRITICAL |
| M21-F03 | Invoicing & AR Settlement | `/sales` | `SupplyChainWorkspace.tsx` | Generate Invoice | `/api/sales/invoices` | POST | FinanceEngine | ar_ledger & GL | Invoice Posted to AR | PASS | Sales + Finance + GL | CORE-CRITICAL |
| M21-F04 | Sales Commission Calculation| `/sales` | `SupplyChainWorkspace.tsx` | Calculate | `/api/sales/commission` | POST | CommissionService | commission_ledger | Commission Computed | PASS | Sales + Commission | BUSINESS |

### M22 — Logistics / TMS
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M22-F01 | Shipment Dispatch | `/logistics` | `SupplyChainWorkspace.tsx` | Dispatch | `/api/tms/dispatch` | POST | ProjectService | shipment_log | Dispatch Confirmed | PASS | Logistics + TMS | BUSINESS-CRITICAL |
| M22-F02 | Route Optimization | `/logistics` | `SupplyChainWorkspace.tsx` | Optimize | `/api/tms/route` | POST | ProjectService | route_plan | Optimal Route Generated | PASS | Logistics | BUSINESS |
| M22-F03 | Freight Costing | `/logistics` | `SupplyChainWorkspace.tsx` | Calculate Freight | `/api/tms/freight` | POST | CostingEngine | freight_ledger | Freight Cost Assigned | PASS | Logistics + Costing | BUSINESS-CRITICAL |
| M22-F04 | Proof of Delivery | `/logistics` | `SupplyChainWorkspace.tsx` | Record POD | `/api/tms/pod` | POST | ProjectService | pod_records | POD Confirmed | PASS | Logistics | CORE-CRITICAL |

### M23 — Finance
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M23-F01 | General Ledger | `/finance` | `GenericModuleWorkspace.tsx` | Post Journal | `/api/finance/gl` | POST | FinanceEngine | general_ledger | Double-Entry Verified | PASS | Finance + GL | CORE-CRITICAL |
| M23-F02 | Trial Balance | `/finance` | `GenericModuleWorkspace.tsx` | Generate TB | `/api/finance/trial-balance` | GET | FinanceEngine | tb_report | Debits Equal Credits | PASS | Finance | CORE-CRITICAL |
| M23-F03 | P&L Statement | `/finance` | `GenericModuleWorkspace.tsx` | View P&L | `/api/finance/pnl` | GET | FinanceEngine | pnl_statement | Revenue & Expenses Shown | PASS | Finance | CORE-CRITICAL |
| M23-F04 | Period Close | `/finance` | `GenericModuleWorkspace.tsx` | Close Period | `/api/finance/close` | POST | FinanceEngine | period_status | Period Locked | PASS | Finance | CORE-CRITICAL |

### M24 — Accounts Payable / Receivable
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M24-F01 | Vendor Invoices (AP) | `/ap-ar` | `GenericModuleWorkspace.tsx` | Enter AP Invoice | `/api/finance/ap` | POST | FinanceEngine | ap_ledger | AP Balance Updated | PASS | AP + Finance | CORE-CRITICAL |
| M24-F02 | Customer Collections (AR) | `/ap-ar` | `GenericModuleWorkspace.tsx` | Record Payment | `/api/finance/ar` | POST | FinanceEngine | ar_ledger | AR Balance Settled | PASS | AR + Finance | CORE-CRITICAL |
| M24-F03 | Aging Ledger | `/ap-ar` | `GenericModuleWorkspace.tsx` | View Aging | `/api/finance/aging` | GET | FinanceEngine | aging_report | Aging Buckets Shown | PASS | AP/AR | BUSINESS-CRITICAL |
| M24-F04 | Payment Reconciliation | `/ap-ar` | `GenericModuleWorkspace.tsx` | Reconcile | `/api/finance/reconcile` | POST | FinanceEngine | bank_recon | Bank Statement Matched | PASS | Finance | CORE-CRITICAL |

### M25 — EHS / Safety
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M25-F01 | Incident Reporting | `/ehs` | `EHSWorkspace.tsx` | Log Incident | `/api/ehs/incidents` | POST | QualityService | incident_log | Incident Recorded | PASS | EHS + Safety | CORE-CRITICAL |
| M25-F02 | Risk Assessment (JSA) | `/ehs` | `EHSWorkspace.tsx` | Assess Risk | `/api/ehs/risk` | POST | QualityService | jsa_matrix | Risk Score Calculated | PASS | EHS | BUSINESS-CRITICAL |
| M25-F03 | CAPA Tracker | `/ehs` | `EHSWorkspace.tsx` | Assign CAPA | `/api/ehs/capa` | POST | QualityService | capa_log | Corrective Action Assigned | PASS | EHS | CORE-CRITICAL |
| M25-F04 | Safety Audit Checklist | `/ehs` | `EHSWorkspace.tsx` | Conduct Audit | `/api/ehs/audit` | POST | QualityService | safety_audits | Audit Completed | PASS | EHS | BUSINESS |

### M26 — Project Management
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M26-F01 | WBS Setup | `/projects` | `GenericModuleWorkspace.tsx` | Create WBS | `/api/projects/wbs` | POST | ProjectService | wbs_tree | WBS Hierarchy Saved | PASS | Project Management | CORE-CRITICAL |
| M26-F02 | Milestone Tracking | `/projects` | `GenericModuleWorkspace.tsx` | Set Milestone | `/api/projects/milestones` | POST | ProjectService | milestones | Milestone Active | PASS | Project Management | BUSINESS-CRITICAL |
| M26-F03 | Resource Allocation | `/projects` | `GenericModuleWorkspace.tsx` | Allocate Staff | `/api/projects/resources` | POST | ProjectService | resource_alloc | Staff Assigned | PASS | Project Management | BUSINESS-CRITICAL |
| M26-F04 | Project Progress Report | `/projects` | `GenericModuleWorkspace.tsx` | Generate Report | `/api/projects/progress` | GET | ProjectService | project_status | Progress Computed | PASS | Project Management | BUSINESS |

### M27 — Job Costing
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M27-F01 | Actual vs Budget Cost | `/job-costing` | `GenericModuleWorkspace.tsx` | Compare Costs | `/api/job-costing/comparison` | GET | CostingEngine | job_cost_ledger | Variance Computed | PASS | Job Costing + Costing | CORE-CRITICAL |
| M27-F02 | Overhead Allocation | `/job-costing` | `GenericModuleWorkspace.tsx` | Allocate Overhead | `/api/job-costing/overhead` | POST | CostingEngine | overhead_ledger | Overhead Distributed | PASS | Job Costing + Costing | CORE-CRITICAL |
| M27-F03 | Profitability Analysis | `/job-costing` | `GenericModuleWorkspace.tsx` | Analyze Profit | `/api/job-costing/profitability` | GET | CostingEngine | job_profit | Margin Computed | PASS | Job Costing | BUSINESS-CRITICAL |
| M27-F04 | Cost Variance Alert | `/job-costing` | `GenericModuleWorkspace.tsx` | Monitor | `/api/job-costing/alerts` | GET | CostingEngine | cost_alerts | Threshold Alerts Sent | PASS | Job Costing | BUSINESS |

### M28 — Workflow / Approval
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M28-F01 | Multi-tier Approval Matrix | `/workflow` | `GenericModuleWorkspace.tsx` | Define Matrix | `/api/workflow/matrix` | POST | AuthorityManager | approval_matrix | Matrix Configured | PASS | Workflow + RBAC | CORE-CRITICAL |
| M28-F02 | Delegation of Authority | `/workflow` | `GenericModuleWorkspace.tsx` | Delegate | `/api/workflow/delegate` | POST | AuthorityManager | delegation_log | Authority Delegated | PASS | Workflow + RBAC | CORE-CRITICAL |
| M28-F03 | Workflow Approval Action | `/workflow` | `GenericModuleWorkspace.tsx` | Approve/Reject | `/api/workflow/action` | POST | AuthorityManager | workflow_state | State Advanced | PASS | Workflow | CORE-CRITICAL |
| M28-F04 | Approval Audit Trail | `/workflow` | `GenericModuleWorkspace.tsx` | View Audit | `/api/workflow/audit` | GET | AuthorityManager | audit_trail | Immutable Log Shown | PASS | Workflow | CORE-CRITICAL |

### M29 — Notifications / Tasks
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M29-F01 | Work Queue | `/tasks` | `WorkQueueDrawer.tsx` | View Tasks | `/api/tasks/queue` | GET | TaskManager | task_queue | Pending Tasks Shown | PASS | Tasks + Notifications | CORE-CRITICAL |
| M29-F02 | In-app Notification Center | `/` | `ToastContainer.tsx` | Read Alert | `/api/notifications` | GET | EventRouter | notification_log | Notifications Displayed | PASS | Notifications | BUSINESS-CRITICAL |
| M29-F03 | Email/SMS Dispatch | `/tasks` | `WorkQueueDrawer.tsx` | Trigger Dispatch | `/api/notifications/dispatch` | POST | EventRouter | outbox_table | Message Dispatched | PASS | Notifications + Outbox | CORE-CRITICAL |
| M29-F04 | Task Escalation | `/tasks` | `WorkQueueDrawer.tsx` | Escalate | `/api/tasks/escalate` | POST | TaskManager | task_status | Task Escalated | PASS | Tasks | BUSINESS |

### M30 — Reporting / BI
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M30-F01 | Executive Dashboard | `/reports` | `GenericModuleWorkspace.tsx` | View KPIs | `/api/bi/dashboard` | GET | WorkspaceAggregationService | kpi_cache | KPIs Rendered | PASS | BI + Reporting | BUSINESS-CRITICAL |
| M30-F02 | Custom Query Builder | `/reports` | `GenericModuleWorkspace.tsx` | Build Query | `/api/bi/query` | POST | WorkspaceAggregationService | query_results | Custom Dataset Returned | PASS | BI | BUSINESS |
| M30-F03 | Export to Excel/PDF | `/reports` | `GenericModuleWorkspace.tsx` | Export | `/api/bi/export` | GET | WorkspaceAggregationService | file_download | Report Exported | PASS | BI | BUSINESS-CRITICAL |
| M30-F04 | Scheduled Report Job | `/reports` | `GenericModuleWorkspace.tsx` | Schedule | `/api/bi/schedule` | POST | WorkspaceAggregationService | cron_jobs | Schedule Saved | PASS | BI | SUPPORTING |

### M31 — Audit / Compliance
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M31-F01 | System Audit Log | `/audit` | `GenericModuleWorkspace.tsx` | Search Logs | `/api/audit/logs` | GET | TaskManager | system_audit | Audit Trail Queried | PASS | Audit + Governance | CORE-CRITICAL |
| M31-F02 | Immutable Trail Verification | `/audit` | `GenericModuleWorkspace.tsx` | Verify Hash | `/api/audit/verify` | GET | TaskManager | hash_integrity | Integrity Confirmed | PASS | Audit | CORE-CRITICAL |
| M31-F03 | Compliance Checklist | `/audit` | `GenericModuleWorkspace.tsx` | Complete Item | `/api/audit/compliance` | POST | QualityService | compliance_log | Checklist Updated | PASS | Audit | BUSINESS-CRITICAL |
| M31-F04 | Regulatory Report Export | `/audit` | `GenericModuleWorkspace.tsx` | Export | `/api/audit/export` | GET | TaskManager | report_file | Regulatory File Generated | PASS | Audit | BUSINESS |

### M32 — System Settings
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M32-F01 | Global Parameters | `/settings` | `GenericModuleWorkspace.tsx` | Update Config | `/api/settings/global` | PUT | OrgService | system_config | Settings Applied | PASS | Settings | CORE-CRITICAL |
| M32-F02 | Number Series Generator | `/settings` | `GenericModuleWorkspace.tsx` | Configure | `/api/settings/number-series` | POST | OrgService | number_series | Series Configured | PASS | Settings | CORE-CRITICAL |
| M32-F03 | Backup Management | `/settings` | `GenericModuleWorkspace.tsx` | Trigger Backup | `/api/settings/backup` | POST | OrgService | backup_archive | Snapshot Created | PASS | Settings | CORE-CRITICAL |
| M32-F04 | Feature Flag Toggle | `/settings` | `GenericModuleWorkspace.tsx` | Toggle Flag | `/api/settings/flags` | PUT | OrgService | feature_flags | Flag Updated | PASS | Settings | BUSINESS |

### M33 — RBAC / Policy
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M33-F01 | Role Definition | `/rbac` | `GenericModuleWorkspace.tsx` | Create Role | `/api/rbac/roles` | POST | AuthorityManager | roles table | Role Created | PASS | RBAC + Security | CORE-CRITICAL |
| M33-F02 | Permission Matrix | `/rbac` | `GenericModuleWorkspace.tsx` | Assign Rights | `/api/rbac/permissions` | PUT | AuthorityManager | permission_matrix | Rights Updated | PASS | RBAC + Security | CORE-CRITICAL |
| M33-F03 | Row-Level Security (RLS) | `/rbac` | `GenericModuleWorkspace.tsx` | Configure RLS | `/api/rbac/rls` | PUT | AuthorityManager | rls_policies | Policy Enforced | PASS | RBAC + Security | CORE-CRITICAL |
| M33-F04 | Access Audit | `/rbac` | `GenericModuleWorkspace.tsx` | Audit Access | `/api/rbac/audit` | GET | AuthorityManager | access_log | Access Log Shown | PASS | RBAC | CORE-CRITICAL |

### M34 — EventBus / Outbox
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M34-F01 | Outbox Pattern Dispatch | `/events` | `GenericModuleWorkspace.tsx` | Monitor Outbox | `/api/outbox/messages` | GET | EventRouter | outbox_table | Messages Queued/Sent | PASS | EventBus + Outbox | CORE-CRITICAL |
| M34-F02 | Dead Letter Queue Monitoring | `/events` | `GenericModuleWorkspace.tsx` | Inspect DLQ | `/api/outbox/dlq` | GET | EventRouter | dlq_table | Failed Events Listed | PASS | EventBus | CORE-CRITICAL |
| M34-F03 | Retry Handler | `/events` | `GenericModuleWorkspace.tsx` | Retry Event | `/api/outbox/retry` | POST | EventRouter | outbox_status | Event Re-dispatched | PASS | EventBus | CORE-CRITICAL |
| M34-F04 | Event Subscription Config | `/events` | `GenericModuleWorkspace.tsx` | Subscribe | `/api/events/subscribers` | POST | EventRouter | subscribers | Subscribed Successfully | PASS | EventBus | BUSINESS |

### M35 — Integration / API
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M35-F01 | REST API Gateway | `/integration` | `GenericModuleWorkspace.tsx` | Test Endpoint | `/api/integration/gateway` | GET | WorkspaceAggregationService | api_routes | Gateway Responsive | PASS | Integration | CORE-CRITICAL |
| M35-F02 | Webhook Management | `/integration` | `GenericModuleWorkspace.tsx` | Register Hook | `/api/integration/webhooks` | POST | EventRouter | webhooks table | Webhook Active | PASS | Integration | BUSINESS-CRITICAL |
| M35-F03 | API Key Auth | `/integration` | `GenericModuleWorkspace.tsx` | Generate Key | `/api/integration/keys` | POST | AuthService | api_keys | Key Provisioned | PASS | Integration + IAM | CORE-CRITICAL |
| M35-F04 | Integration Health Monitor | `/integration` | `GenericModuleWorkspace.tsx` | Check Health | `/api/integration/health` | GET | WorkspaceAggregationService | health_status | Status OK | PASS | Integration | BUSINESS |

### M36 — IT Service Desk
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M36-F01 | Ticket Creation | `/service-desk` | `ServiceDeskWorkspace.tsx` | Create Ticket | `/api/service-desk/tickets` | POST | TaskManager | service_tickets | Ticket Logged | PASS | Service Desk | BUSINESS-CRITICAL |
| M36-F02 | SLA Tracking | `/service-desk` | `ServiceDeskWorkspace.tsx` | Monitor SLA | `/api/service-desk/sla` | GET | TaskManager | sla_status | SLA Timers Active | PASS | Service Desk | CORE-CRITICAL |
| M36-F03 | Escalation Matrix | `/service-desk` | `ServiceDeskWorkspace.tsx` | Configure | `/api/service-desk/escalation` | PUT | TaskManager | escalation_rules | Rules Enforced | PASS | Service Desk | BUSINESS |
| M36-F04 | Resolution Sign-off | `/service-desk` | `ServiceDeskWorkspace.tsx` | Close Ticket | `/api/service-desk/:id/close` | POST | TaskManager | ticket_closed | Ticket Resolved | PASS | Service Desk | CORE-CRITICAL |

### M37 — Asset / Equipment
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M37-F01 | Fixed Asset Register | `/assets` | `AssetMaintenanceWorkspace.tsx` | Register Asset | `/api/assets` | POST | QualityService | fixed_assets | Asset Recorded | PASS | Asset Management | CORE-CRITICAL |
| M37-F02 | Depreciation Run | `/assets` | `AssetMaintenanceWorkspace.tsx` | Calculate Depr | `/api/assets/depreciation` | POST | FinanceEngine | depr_ledger & GL | Depreciation Posted | PASS | Asset + Finance + GL | CORE-CRITICAL |
| M37-F03 | Asset Transfer | `/assets` | `AssetMaintenanceWorkspace.tsx` | Transfer Asset | `/api/assets/transfer` | PUT | QualityService | asset_location | Location Updated | PASS | Asset Management | BUSINESS-CRITICAL |
| M37-F04 | Asset Disposal | `/assets` | `AssetMaintenanceWorkspace.tsx` | Dispose | `/api/assets/dispose` | POST | QualityService | asset_disposal | Retired & Accounted | PASS | Asset + Finance | CORE-CRITICAL |

### M38 — Digital Documents / DMS
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M38-F01 | Secure Vault | `/digital-dms` | `DMSWorkspace.tsx` | Store File | `/api/dms/vault` | POST | TaskManager | secure_vault | Encrypted File Stored | PASS | DMS | CORE-CRITICAL |
| M38-F02 | Retention Policy | `/digital-dms` | `DMSWorkspace.tsx` | Set Policy | `/api/dms/retention` | PUT | TaskManager | retention_rules | Policy Enforced | PASS | DMS | BUSINESS-CRITICAL |
| M38-F03 | E-Signature | `/digital-dms` | `DMSWorkspace.tsx` | Sign Document | `/api/dms/sign` | POST | TaskManager | e_signatures | Signature Validated | PASS | DMS | CORE-CRITICAL |
| M38-F04 | Audit Archiving | `/digital-dms` | `DMSWorkspace.tsx` | Archive | `/api/dms/archive` | POST | TaskManager | archive_ledger | Moved to Deep Archive | PASS | DMS | BUSINESS |

### M39 — Project / Job Costing (Ext)
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M39-F01 | Advanced EVM (Earned Value) | `/ext-job-cost` | `GenericModuleWorkspace.tsx` | Calculate EVM | `/api/ext-job-cost/evm` | GET | CostingEngine | evm_metrics | CPI & SPI Computed | PASS | Job Costing + Costing | CORE-CRITICAL |
| M39-F02 | Cost Variance Analysis | `/ext-job-cost` | `GenericModuleWorkspace.tsx` | Run Analysis | `/api/ext-job-cost/variance` | GET | CostingEngine | variance_report | Variances Detailed | PASS | Job Costing | BUSINESS-CRITICAL |
| M39-F03 | Milestone Billing Plan | `/ext-job-cost` | `GenericModuleWorkspace.tsx` | Set Billing | `/api/ext-job-cost/billing` | POST | FinanceEngine | billing_schedule | Schedule Created | PASS | Job Costing + O2C | CORE-CRITICAL |
| M39-F04 | Subcontractor Costing | `/ext-job-cost` | `GenericModuleWorkspace.tsx` | Log SubCost | `/api/ext-job-cost/subcontract` | POST | SubcontractingService | sub_ledger | Subcontract Expenses Logged | PASS | Job Costing + SCM | CORE-CRITICAL |

### M40 — Enterprise Administration / Platform
| Feature ID | Feature Name | UI Route | UI Component | User Action | API Endpoint | Method | Business Service | Domain Effect | Expected Result | Status | Regression Scope | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| M40-F01 | Tenant Management | `/admin` | `GenericModuleWorkspace.tsx` | Provision Tenant | `/api/admin/tenants` | POST | OrgService | tenants table | Tenant Provisioned | PASS | Admin + Platform | CORE-CRITICAL |
| M40-F02 | Health Monitor | `/admin` | `GenericModuleWorkspace.tsx` | Check Health | `/api/admin/health` | GET | WorkspaceAggregationService | system_health | Cluster Healthy | PASS | Admin | CORE-CRITICAL |
| M40-F03 | Log Viewer | `/admin` | `GenericModuleWorkspace.tsx` | Stream Logs | `/api/admin/logs` | GET | TaskManager | system_logs | Real-time Logs | PASS | Admin | BUSINESS-CRITICAL |
| M40-F04 | Platform Patch Management | `/admin` | `GenericModuleWorkspace.tsx` | Apply Patch | `/api/admin/patch` | POST | OrchestrationEngine | patch_history | Patch Applied Successfully | PASS | Admin + Platform | CORE-CRITICAL |

---
*End of Master Test Matrix 160.*
