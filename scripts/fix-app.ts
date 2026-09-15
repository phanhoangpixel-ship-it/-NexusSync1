import * as fs from "fs";

const fileMappings: Record<string, string> = {
  "M06InnovationRDWorkspace": "master-data/m06-innovation-rd/components/M06InnovationRDWorkspace",
  "M07CustomersItemMasterWorkspace": "master-data/m07-customers-item-master/components/M07CustomersItemMasterWorkspace",
  "MasterWmsWorkspace": "inventory/m17-master-wms/components/MasterWmsWorkspace",
  "M19StocktakeWorkspace": "inventory/m19-stocktake/components/M19StocktakeWorkspace",
  "StockAdjustmentWorkspace": "inventory/m20-adjustment/components/StockAdjustmentWorkspace",
  "M21InternalTransfersWorkspace": "inventory/m21-transfers/components/M21InternalTransfersWorkspace",
  "M22LotsBatchesWorkspace": "inventory/m22-lots/components/M22LotsBatchesWorkspace",
  "M23SerialsWorkspace": "inventory/m23-serials/components/M23SerialsWorkspace",
  "M24WMSExtendedWorkspace": "inventory/m24-wms-extended/components/M24WMSExtendedWorkspace",
  "WarehouseManagementWorkspace": "inventory/m18-warehouse/components/WarehouseManagementWorkspace",
  "M08PurchaseOrdersWorkspace": "purchase/m08-purchase-orders/components/M08PurchaseOrdersWorkspace",
  "M09SuppliersSRMWorkspace": "purchase/m09-suppliers/components/M09SuppliersSRMWorkspace",
  "m10/M10StrategicSourcingWorkspace": "purchase/m10-strategic-sourcing/components/M10StrategicSourcingWorkspace",
  "M10StrategicSourcingWorkspace": "purchase/m10-strategic-sourcing/components/M10StrategicSourcingWorkspace",
  "m11/M11SrmSupplierMgmtWorkspace": "purchase/m11-srm/components/M11SrmSupplierMgmtWorkspace",
  "M11SrmSupplierMgmtWorkspace": "purchase/m11-srm/components/M11SrmSupplierMgmtWorkspace",
  "m12/M12CrmLeadsWorkspace": "sales/m12-crm/components/M12CrmLeadsWorkspace",
  "M12CrmLeadsWorkspace": "sales/m12-crm/components/M12CrmLeadsWorkspace",
  "m13/M13SalesOrdersWorkspace": "sales/m13-sales-orders/components/M13SalesOrdersWorkspace",
  "M13SalesOrdersWorkspace": "sales/m13-sales-orders/components/M13SalesOrdersWorkspace",
  "M14SalesCommissionWorkspace": "sales/m14-sales-commission/components/M14SalesCommissionWorkspace",
  "M15ReturnsRMAWorkspace": "sales/m15-returns/components/M15ReturnsRMAWorkspace",
  "m16/M16POSRetailWorkspace": "sales/m16-pos/components/M16POSRetailWorkspace",
  "M16POSRetailWorkspace": "sales/m16-pos/components/M16POSRetailWorkspace",
  "M30GeneralLedgerWorkspace": "finance/m30-gl/components/M30GeneralLedgerWorkspace",
  "M31InvoicesArApWorkspace": "finance/m31-invoices/components/M31InvoicesArApWorkspace",
  "M32PaymentsTreasuryWorkspace": "finance/m32-payments/components/M32PaymentsTreasuryWorkspace",
  "M33BankReconciliationWorkspace": "finance/m33-bank-reconciliation/components/M33BankReconciliationWorkspace",
  "M34FinancialConsolidationWorkspace": "finance/m34-consolidation/components/M34FinancialConsolidationWorkspace",
  "M42CostAllocationWorkspace": "finance/m42-cost-allocation/components/M42CostAllocationWorkspace",
  "manufacturing/ManufacturingWorkspace": "manufacturing/m25-mes/components/ManufacturingWorkspace",
  "ManufacturingWorkspace": "manufacturing/m25-mes/components/ManufacturingWorkspace",
  "SupplyChainWorkspace": "manufacturing/m26-scp/components/SupplyChainWorkspace",
  "M41PricingManagementWorkspace": "pricing/m41-pricing-management/components/M41PricingManagementWorkspace",
  "pricing/M41PricingManagementWorkspace": "pricing/m41-pricing-management/components/M41PricingManagementWorkspace",
  "M35ProjectsWBSWorkspace": "projects/m35-projects-wbs/components/M35ProjectsWBSWorkspace",
  "audit/AuditComplianceWorkspace": "governance/m02-audit/components/AuditComplianceWorkspace",
  "AuditComplianceWorkspace": "governance/m02-audit/components/AuditComplianceWorkspace",
  "eventbus/M05EventBusWorkspace": "governance/m05-eventbus/components/M05EventBusWorkspace",
  "M05EventBusWorkspace": "governance/m05-eventbus/components/M05EventBusWorkspace",
  "DMSWorkspace": "governance/m29-dms/components/DMSWorkspace",
  "M37BiAnalyticsWorkspace": "governance/m37-analytics/components/M37BiAnalyticsWorkspace",
  "M39QualityControlWorkspace": "governance/m39-quality/components/M39QualityControlWorkspace",
  "superAdmin/SuperAdminRBACWorkspace": "admin/m04-super-admin/components/SuperAdminRBACWorkspace",
  "SuperAdminRBACWorkspace": "admin/m04-super-admin/components/SuperAdminRBACWorkspace",
  "systemSettings/SystemSettingsWorkspace": "admin/m03-system-settings/components/SystemSettingsWorkspace",
  "SystemSettingsWorkspace": "admin/m03-system-settings/components/SystemSettingsWorkspace",
  "WorkspaceHub": "admin/m01-workspace-hub/components/WorkspaceHub",
  "GenericModuleWorkspace": "admin/m01-workspace-hub/components/GenericModuleWorkspace",
};

let appStr = fs.readFileSync("src/App.tsx", "utf8");

for (const [oldPath, newPath] of Object.entries(fileMappings)) {
  // exact replace: import('./components/workspaces/X') -> import('./modules/newPath')
  // We need to account for ts-morph which might have already changed some, but badly.
  // Actually, we should just run a generic replace for any string that ends with these names
  const regex1 = new RegExp(`import\\(['"]\\./components/workspaces/${oldPath}['"]\\)`, 'g');
  appStr = appStr.replace(regex1, `import('./modules/${newPath}')`);
  
  // also fix if ts-morph did some weird stuff
  const regex2 = new RegExp(`import\\(['"]\\./modules/[a-z0-9-]+/m[0-9]+-[a-z0-9-]+/components/src/modules/.*${oldPath}['"]\\)`, 'g');
  appStr = appStr.replace(regex2, `import('./modules/${newPath}')`);
}

// Global cleanup for any remaining weird nested src/modules
appStr = appStr.replace(/src\/modules\/(.*?)\/components\/src\/modules/g, 'src/modules');

fs.writeFileSync("src/App.tsx", appStr);
console.log("App.tsx fixed.");
