import { Project } from "ts-morph";

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

const fileMappings: Record<string, string> = {
  "M06InnovationRDWorkspace.tsx": "master-data/m06-innovation-rd",
  "M07CustomersItemMasterWorkspace.tsx": "master-data/m07-customers-item-master",
  "MasterWmsWorkspace.tsx": "inventory/m17-master-wms",
  "M19StocktakeWorkspace.tsx": "inventory/m19-stocktake",
  "StockAdjustmentWorkspace.tsx": "inventory/m20-adjustment",
  "M21InternalTransfersWorkspace.tsx": "inventory/m21-transfers",
  "M22LotsBatchesWorkspace.tsx": "inventory/m22-lots",
  "LotInventoryHistoryDrilldown.tsx": "inventory/m22-lots",
  "M23SerialsWorkspace.tsx": "inventory/m23-serials",
  "M24WMSExtendedWorkspace.tsx": "inventory/m24-wms-extended",
  "WarehouseManagementWorkspace.tsx": "inventory/m18-warehouse",
  "WarehouseAnalyticsTab.tsx": "inventory/m18-warehouse",
  "WarehouseFacilitiesMasterTab.tsx": "inventory/m18-warehouse",
  "WarehouseInboundTab.tsx": "inventory/m18-warehouse",
  "WarehouseInternalOpsTab.tsx": "inventory/m18-warehouse",
  "WarehouseOutboundTab.tsx": "inventory/m18-warehouse",
  "WarehouseProductsTab.tsx": "inventory/m18-warehouse",
  "WarehouseStockControlTab.tsx": "inventory/m18-warehouse",
  "WarehouseTraceabilityTab.tsx": "inventory/m18-warehouse",
  "M08PurchaseOrdersWorkspace.tsx": "purchase/m08-purchase-orders",
  "M09SuppliersSRMWorkspace.tsx": "purchase/m09-suppliers",
  "M10StrategicSourcingWorkspace.tsx": "purchase/m10-strategic-sourcing",
  "M11SrmSupplierMgmtWorkspace.tsx": "purchase/m11-srm",
  "M12CrmLeadsWorkspace.tsx": "sales/m12-crm",
  "M13SalesOrdersWorkspace.tsx": "sales/m13-sales-orders",
  "M14SalesCommissionWorkspace.tsx": "sales/m14-sales-commission",
  "M15ReturnsRMAWorkspace.tsx": "sales/m15-returns",
  "M16POSRetailWorkspace.tsx": "sales/m16-pos",
  "M30GeneralLedgerWorkspace.tsx": "finance/m30-gl",
  "M31InvoicesArApWorkspace.tsx": "finance/m31-invoices",
  "M32PaymentsTreasuryWorkspace.tsx": "finance/m32-payments",
  "M33BankReconciliationWorkspace.tsx": "finance/m33-bank-reconciliation",
  "M34FinancialConsolidationWorkspace.tsx": "finance/m34-consolidation",
  "M42CostAllocationWorkspace.tsx": "finance/m42-cost-allocation",
  "costingDashboardStats.tsx": "finance/m42-cost-allocation",
  "ManufacturingWorkspace.tsx": "manufacturing/m25-mes",
  "SupplyChainWorkspace.tsx": "manufacturing/m26-scp",
  "M41PricingManagementWorkspace.tsx": "pricing/m41-pricing-management",
  "M35ProjectsWBSWorkspace.tsx": "projects/m35-projects-wbs",
  "AuditComplianceWorkspace.tsx": "governance/m02-audit",
  "M05EventBusWorkspace.tsx": "governance/m05-eventbus",
  "DMSWorkspace.tsx": "governance/m29-dms",
  "M37BiAnalyticsWorkspace.tsx": "governance/m37-analytics",
  "M39QualityControlWorkspace.tsx": "governance/m39-quality",
  "SuperAdminRBACWorkspace.tsx": "admin/m04-super-admin",
  "SystemSettingsWorkspace.tsx": "admin/m03-system-settings",
  "WorkspaceHub.tsx": "admin/m01-workspace-hub",
  "GenericModuleWorkspace.tsx": "admin/m01-workspace-hub",
};

const dirMappings: Record<string, string> = {
  "audit": "governance/m02-audit",
  "eventbus": "governance/m05-eventbus",
  "lotsBatches": "inventory/m22-lots",
  "m10": "purchase/m10-strategic-sourcing",
  "m11": "purchase/m11-srm",
  "m12": "sales/m12-crm",
  "m13": "sales/m13-sales-orders",
  "m16": "sales/m16-pos",
  "manufacturing": "manufacturing/m25-mes",
  "pos": "sales/m16-pos",
  "pricing": "pricing/m41-pricing-management",
  "stockAdjustment": "inventory/m20-adjustment",
  "stocktake": "inventory/m19-stocktake",
  "superAdmin": "admin/m04-super-admin",
  "systemSettings": "admin/m03-system-settings",
  "transfers": "inventory/m21-transfers",
};

const baseDir = "src/components/workspaces/";
const targetBase = "src/modules/";

for (const [dirName, targetPath] of Object.entries(dirMappings)) {
  const d = project.getDirectory(baseDir + dirName);
  if (d) {
    let newDir = project.getDirectory(targetBase + targetPath + "/components");
    if (!newDir) newDir = project.createDirectory(targetBase + targetPath + "/components");
    d.getSourceFiles().forEach(f => f.moveToDirectory(newDir));
    d.getDirectories().forEach(sd => sd.moveToDirectory(newDir));
  }
}

for (const [fileName, targetPath] of Object.entries(fileMappings)) {
  const f = project.getSourceFile(baseDir + fileName);
  if (f) {
    let newDir = project.getDirectory(targetBase + targetPath + "/components");
    if (!newDir) newDir = project.createDirectory(targetBase + targetPath + "/components");
    f.moveToDirectory(newDir);
  }
}

project.saveSync();
console.log("TS Morph moves completed.");
