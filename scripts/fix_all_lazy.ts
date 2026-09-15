import * as fs from 'fs';
import { Project } from 'ts-morph';

const project = new Project({ tsConfigFilePath: "tsconfig.json" });
const appFile = project.getSourceFile("src/App.tsx");

// Find all workspace paths
const workspacesMap: Record<string, string> = {
  "EHSWorkspace": "./modules/governance/m40-ehs/components/EHSWorkspace",
  "ServiceDeskWorkspace": "./modules/governance/m38-service-desk/components/ServiceDeskWorkspace",
  "DMSWorkspace": "./modules/governance/m29-dms/components/DMSWorkspace",
  "M39QualityControlWorkspace": "./modules/governance/m39-quality/components/M39QualityControlWorkspace",
  "AuditComplianceWorkspace": "./modules/governance/m02-audit/components/AuditComplianceWorkspace",
  "M05EventBusWorkspace": "./modules/governance/m05-eventbus/components/M05EventBusWorkspace",
  "M37BiAnalyticsWorkspace": "./modules/governance/m37-analytics/components/M37BiAnalyticsWorkspace",
  "M36LogisticsWorkspace": "./modules/logistics/m36-logistics-fleet/components/M36LogisticsWorkspace",
  "AssetMaintenanceWorkspace": "./modules/assets/m27-eam/components/AssetMaintenanceWorkspace",
  "HRWorkspace": "./modules/hr/m28-hr-payroll/components/HRWorkspace",
  "M06InnovationRDWorkspace": "./modules/master-data/m06-innovation-rd/components/M06InnovationRDWorkspace",
  "M07CustomersItemMasterWorkspace": "./modules/master-data/m07-customers-item-master/components/M07CustomersItemMasterWorkspace",
  "MasterWmsWorkspace": "./modules/inventory/m17-master-wms/components/MasterWmsWorkspace",
  "M19StocktakeWorkspace": "./modules/inventory/m19-stocktake/components/M19StocktakeWorkspace",
  "StockAdjustmentWorkspace": "./modules/inventory/m20-adjustment/components/StockAdjustmentWorkspace",
  "M21InternalTransfersWorkspace": "./modules/inventory/m21-transfers/components/M21InternalTransfersWorkspace",
  "M22LotsBatchesWorkspace": "./modules/inventory/m22-lots/components/M22LotsBatchesWorkspace",
  "M23SerialsWorkspace": "./modules/inventory/m23-serials/components/M23SerialsWorkspace",
  "M24WMSExtendedWorkspace": "./modules/inventory/m24-wms-extended/components/M24WMSExtendedWorkspace",
  "WarehouseManagementWorkspace": "./modules/inventory/m18-warehouse/components/WarehouseManagementWorkspace",
  "M08PurchaseOrdersWorkspace": "./modules/purchase/m08-purchase-orders/components/M08PurchaseOrdersWorkspace",
  "M09SuppliersSRMWorkspace": "./modules/purchase/m09-suppliers/components/M09SuppliersSRMWorkspace",
  "M10StrategicSourcingWorkspace": "./modules/purchase/m10-strategic-sourcing/components/M10StrategicSourcingWorkspace",
  "M11SrmSupplierMgmtWorkspace": "./modules/purchase/m11-srm/components/M11SrmSupplierMgmtWorkspace",
  "M12CrmLeadsWorkspace": "./modules/sales/m12-crm/components/M12CrmLeadsWorkspace",
  "M13SalesOrdersWorkspace": "./modules/sales/m13-sales-orders/components/M13SalesOrdersWorkspace",
  "M14SalesCommissionWorkspace": "./modules/sales/m14-sales-commission/components/M14SalesCommissionWorkspace",
  "M15ReturnsRMAWorkspace": "./modules/sales/m15-returns/components/M15ReturnsRMAWorkspace",
  "M16POSRetailWorkspace": "./modules/sales/m16-pos/components/M16POSRetailWorkspace",
  "M16POSWorkspace": "./modules/sales/m16-pos/components/M16POSWorkspace",
  "M30GeneralLedgerWorkspace": "./modules/finance/m30-gl/components/M30GeneralLedgerWorkspace",
  "M31InvoicesArApWorkspace": "./modules/finance/m31-invoices/components/M31InvoicesArApWorkspace",
  "M32PaymentsTreasuryWorkspace": "./modules/finance/m32-payments/components/M32PaymentsTreasuryWorkspace",
  "M33BankReconciliationWorkspace": "./modules/finance/m33-bank-reconciliation/components/M33BankReconciliationWorkspace",
  "M34FinancialConsolidationWorkspace": "./modules/finance/m34-consolidation/components/M34FinancialConsolidationWorkspace",
  "M42CostAllocationWorkspace": "./modules/finance/m42-cost-allocation/components/M42CostAllocationWorkspace",
  "ManufacturingWorkspace": "./modules/manufacturing/m25-mes/components/ManufacturingWorkspace",
  "SupplyChainWorkspace": "./modules/manufacturing/m26-scp/components/SupplyChainWorkspace",
  "GenericModuleWorkspace": "./modules/admin/m01-workspace-hub/components/GenericModuleWorkspace",
  "WorkspaceHub": "./modules/admin/m01-workspace-hub/components/WorkspaceHub",
  "SystemSettingsWorkspace": "./modules/admin/m03-system-settings/components/SystemSettingsWorkspace",
  "SuperAdminRBACWorkspace": "./modules/admin/m04-super-admin/components/SuperAdminRBACWorkspace",
  "M41PricingManagementWorkspace": "./modules/pricing/m41-pricing-management/components/M41PricingManagementWorkspace",
  "M35ProjectsWBSWorkspace": "./modules/projects/m35-projects-wbs/components/M35ProjectsWBSWorkspace"
};

const vars = appFile!.getVariableDeclarations();
const missingWorkspaces = new Set(Object.keys(workspacesMap));

vars.forEach(v => {
   const name = v.getName();
   if (workspacesMap[name]) {
       missingWorkspaces.delete(name);
   }
});

let insertPos = 0;
vars.forEach(v => {
   const name = v.getName();
   if (workspacesMap[name]) {
       insertPos = v.getStatement()!.getChildIndex();
   }
});

for (const name of missingWorkspaces) {
    appFile!.insertVariableStatement(insertPos, {
        declarationKind: "const" as any,
        declarations: [{
            name: name,
            initializer: `lazy(() => import('${workspacesMap[name]}').then(m => ({ default: m.${name} })))`
        }]
    });
}

project.saveSync();
console.log("Added missing lazy imports in App.tsx");
