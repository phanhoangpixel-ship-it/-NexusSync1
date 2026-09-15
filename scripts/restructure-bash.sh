#!/bin/bash
set -e

mkdir -p src/modules/master-data/m06-innovation-rd/components
mv src/components/workspaces/M06InnovationRDWorkspace.tsx src/modules/master-data/m06-innovation-rd/components/

mkdir -p src/modules/master-data/m07-customers-item-master/components
mv src/components/workspaces/M07CustomersItemMasterWorkspace.tsx src/modules/master-data/m07-customers-item-master/components/

mkdir -p src/modules/inventory/m17-master-wms/components
mv src/components/workspaces/MasterWmsWorkspace.tsx src/modules/inventory/m17-master-wms/components/

mkdir -p src/modules/inventory/m19-stocktake/components
mv src/components/workspaces/M19StocktakeWorkspace.tsx src/modules/inventory/m19-stocktake/components/
if [ -d "src/components/workspaces/stocktake" ]; then mv src/components/workspaces/stocktake/* src/modules/inventory/m19-stocktake/components/ 2>/dev/null || true; fi

mkdir -p src/modules/inventory/m20-adjustment/components
mv src/components/workspaces/StockAdjustmentWorkspace.tsx src/modules/inventory/m20-adjustment/components/
if [ -d "src/components/workspaces/stockAdjustment" ]; then mv src/components/workspaces/stockAdjustment/* src/modules/inventory/m20-adjustment/components/ 2>/dev/null || true; fi

mkdir -p src/modules/inventory/m21-transfers/components
mv src/components/workspaces/M21InternalTransfersWorkspace.tsx src/modules/inventory/m21-transfers/components/
if [ -d "src/components/workspaces/transfers" ]; then mv src/components/workspaces/transfers/* src/modules/inventory/m21-transfers/components/ 2>/dev/null || true; fi

mkdir -p src/modules/inventory/m22-lots/components
mv src/components/workspaces/M22LotsBatchesWorkspace.tsx src/modules/inventory/m22-lots/components/
mv src/components/workspaces/LotInventoryHistoryDrilldown.tsx src/modules/inventory/m22-lots/components/
if [ -d "src/components/workspaces/lotsBatches" ]; then mv src/components/workspaces/lotsBatches/* src/modules/inventory/m22-lots/components/ 2>/dev/null || true; fi

mkdir -p src/modules/inventory/m23-serials/components
mv src/components/workspaces/M23SerialsWorkspace.tsx src/modules/inventory/m23-serials/components/

mkdir -p src/modules/inventory/m24-wms-extended/components
mv src/components/workspaces/M24WMSExtendedWorkspace.tsx src/modules/inventory/m24-wms-extended/components/

mkdir -p src/modules/inventory/m18-warehouse/components
mv src/components/workspaces/WarehouseManagementWorkspace.tsx src/modules/inventory/m18-warehouse/components/
mv src/components/workspaces/WarehouseAnalyticsTab.tsx src/modules/inventory/m18-warehouse/components/
mv src/components/workspaces/WarehouseFacilitiesMasterTab.tsx src/modules/inventory/m18-warehouse/components/
mv src/components/workspaces/WarehouseInboundTab.tsx src/modules/inventory/m18-warehouse/components/
mv src/components/workspaces/WarehouseInternalOpsTab.tsx src/modules/inventory/m18-warehouse/components/
mv src/components/workspaces/WarehouseOutboundTab.tsx src/modules/inventory/m18-warehouse/components/
mv src/components/workspaces/WarehouseProductsTab.tsx src/modules/inventory/m18-warehouse/components/
mv src/components/workspaces/WarehouseStockControlTab.tsx src/modules/inventory/m18-warehouse/components/
mv src/components/workspaces/WarehouseTraceabilityTab.tsx src/modules/inventory/m18-warehouse/components/

mkdir -p src/modules/purchase/m08-purchase-orders/components
mv src/components/workspaces/M08PurchaseOrdersWorkspace.tsx src/modules/purchase/m08-purchase-orders/components/

mkdir -p src/modules/purchase/m09-suppliers/components
mv src/components/workspaces/M09SuppliersSRMWorkspace.tsx src/modules/purchase/m09-suppliers/components/

mkdir -p src/modules/purchase/m10-strategic-sourcing/components
mv src/components/workspaces/M10StrategicSourcingWorkspace.tsx src/modules/purchase/m10-strategic-sourcing/components/
if [ -d "src/components/workspaces/m10" ]; then mv src/components/workspaces/m10/* src/modules/purchase/m10-strategic-sourcing/components/ 2>/dev/null || true; fi

mkdir -p src/modules/purchase/m11-srm/components
mv src/components/workspaces/M11SrmSupplierMgmtWorkspace.tsx src/modules/purchase/m11-srm/components/
if [ -d "src/components/workspaces/m11" ]; then mv src/components/workspaces/m11/* src/modules/purchase/m11-srm/components/ 2>/dev/null || true; fi

mkdir -p src/modules/sales/m12-crm/components
mv src/components/workspaces/M12CrmLeadsWorkspace.tsx src/modules/sales/m12-crm/components/
if [ -d "src/components/workspaces/m12" ]; then mv src/components/workspaces/m12/* src/modules/sales/m12-crm/components/ 2>/dev/null || true; fi

mkdir -p src/modules/sales/m13-sales-orders/components
mv src/components/workspaces/M13SalesOrdersWorkspace.tsx src/modules/sales/m13-sales-orders/components/
if [ -d "src/components/workspaces/m13" ]; then mv src/components/workspaces/m13/* src/modules/sales/m13-sales-orders/components/ 2>/dev/null || true; fi

mkdir -p src/modules/sales/m14-sales-commission/components
mv src/components/workspaces/M14SalesCommissionWorkspace.tsx src/modules/sales/m14-sales-commission/components/

mkdir -p src/modules/sales/m15-returns/components
mv src/components/workspaces/M15ReturnsRMAWorkspace.tsx src/modules/sales/m15-returns/components/

mkdir -p src/modules/sales/m16-pos/components
mv src/components/workspaces/M16POSRetailWorkspace.tsx src/modules/sales/m16-pos/components/
if [ -d "src/components/workspaces/m16" ]; then mv src/components/workspaces/m16/* src/modules/sales/m16-pos/components/ 2>/dev/null || true; fi
if [ -d "src/components/workspaces/pos" ]; then mv src/components/workspaces/pos/* src/modules/sales/m16-pos/components/ 2>/dev/null || true; fi

mkdir -p src/modules/finance/m30-gl/components
mv src/components/workspaces/M30GeneralLedgerWorkspace.tsx src/modules/finance/m30-gl/components/

mkdir -p src/modules/finance/m31-invoices/components
mv src/components/workspaces/M31InvoicesArApWorkspace.tsx src/modules/finance/m31-invoices/components/

mkdir -p src/modules/finance/m32-payments/components
mv src/components/workspaces/M32PaymentsTreasuryWorkspace.tsx src/modules/finance/m32-payments/components/

mkdir -p src/modules/finance/m33-bank-reconciliation/components
mv src/components/workspaces/M33BankReconciliationWorkspace.tsx src/modules/finance/m33-bank-reconciliation/components/

mkdir -p src/modules/finance/m34-consolidation/components
mv src/components/workspaces/M34FinancialConsolidationWorkspace.tsx src/modules/finance/m34-consolidation/components/

mkdir -p src/modules/finance/m42-cost-allocation/components
mv src/components/workspaces/M42CostAllocationWorkspace.tsx src/modules/finance/m42-cost-allocation/components/
mv src/components/workspaces/costingDashboardStats.tsx src/modules/finance/m42-cost-allocation/components/

mkdir -p src/modules/manufacturing/m25-mes/components
mv src/components/workspaces/ManufacturingWorkspace.tsx src/modules/manufacturing/m25-mes/components/
if [ -d "src/components/workspaces/manufacturing" ]; then mv src/components/workspaces/manufacturing/* src/modules/manufacturing/m25-mes/components/ 2>/dev/null || true; fi

mkdir -p src/modules/manufacturing/m26-scp/components
mv src/components/workspaces/SupplyChainWorkspace.tsx src/modules/manufacturing/m26-scp/components/

mkdir -p src/modules/pricing/m41-pricing-management/components
mv src/components/workspaces/M41PricingManagementWorkspace.tsx src/modules/pricing/m41-pricing-management/components/
if [ -d "src/components/workspaces/pricing" ]; then mv src/components/workspaces/pricing/* src/modules/pricing/m41-pricing-management/components/ 2>/dev/null || true; fi

mkdir -p src/modules/projects/m35-projects-wbs/components
mv src/components/workspaces/M35ProjectsWBSWorkspace.tsx src/modules/projects/m35-projects-wbs/components/

mkdir -p src/modules/governance/m02-audit/components
mv src/components/workspaces/AuditComplianceWorkspace.tsx src/modules/governance/m02-audit/components/
if [ -d "src/components/workspaces/audit" ]; then mv src/components/workspaces/audit/* src/modules/governance/m02-audit/components/ 2>/dev/null || true; fi

mkdir -p src/modules/governance/m05-eventbus/components
mv src/components/workspaces/M05EventBusWorkspace.tsx src/modules/governance/m05-eventbus/components/
if [ -d "src/components/workspaces/eventbus" ]; then mv src/components/workspaces/eventbus/* src/modules/governance/m05-eventbus/components/ 2>/dev/null || true; fi

mkdir -p src/modules/governance/m29-dms/components
mv src/components/workspaces/DMSWorkspace.tsx src/modules/governance/m29-dms/components/

mkdir -p src/modules/governance/m37-analytics/components
mv src/components/workspaces/M37BiAnalyticsWorkspace.tsx src/modules/governance/m37-analytics/components/

mkdir -p src/modules/governance/m39-quality/components
mv src/components/workspaces/M39QualityControlWorkspace.tsx src/modules/governance/m39-quality/components/

mkdir -p src/modules/admin/m04-super-admin/components
mv src/components/workspaces/SuperAdminRBACWorkspace.tsx src/modules/admin/m04-super-admin/components/
if [ -d "src/components/workspaces/superAdmin" ]; then mv src/components/workspaces/superAdmin/* src/modules/admin/m04-super-admin/components/ 2>/dev/null || true; fi

mkdir -p src/modules/admin/m03-system-settings/components
mv src/components/workspaces/SystemSettingsWorkspace.tsx src/modules/admin/m03-system-settings/components/
if [ -d "src/components/workspaces/systemSettings" ]; then mv src/components/workspaces/systemSettings/* src/modules/admin/m03-system-settings/components/ 2>/dev/null || true; fi

mkdir -p src/modules/admin/m01-workspace-hub/components
mv src/components/workspaces/WorkspaceHub.tsx src/modules/admin/m01-workspace-hub/components/
mv src/components/workspaces/GenericModuleWorkspace.tsx src/modules/admin/m01-workspace-hub/components/

