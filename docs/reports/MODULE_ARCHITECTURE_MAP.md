## BÁO CÁO ÁNH XẠ HIỆN TRẠNG (MODULE MAP)

### CORE/SHELL (38 files)
- src/App.tsx
- src/components/common/ColumnPresetsButton.tsx
- src/components/common/ColumnPresetsModal.tsx
- src/components/common/CommandOmnibarModal.tsx
- src/components/common/ConfirmDialog.tsx
- src/components/common/CurrencyInput.tsx
- src/components/common/CurrencyInputField.tsx
- src/components/common/DeepLinkBanner.tsx
- src/components/common/DisplayScaleSelector.tsx
- src/components/common/DotNumberInput.tsx
- src/components/common/EnterpriseDataView.tsx
- src/components/common/EnterpriseTable.tsx
- src/components/common/FormModal.tsx
- src/components/common/GlobalErrorBoundary.tsx
- src/components/common/GlobalThemeProvider.tsx
- src/components/common/L3ContentState.tsx
- src/components/common/ModuleTabShell.tsx
- src/components/common/NotificationDrawer.tsx
- src/components/common/Pagination.tsx
- src/components/common/PaginationControl.tsx
- src/components/common/PreviewScaleOverlayGuide.tsx
- src/components/common/QuickPreviewDrawer.tsx
- src/components/common/RecentFavoritesDrawer.tsx
- src/components/common/RedirectPanel.tsx
- src/components/common/ScorecardTabPanel.tsx
- src/components/common/SimulatedLoginModal.tsx
- src/components/common/SystemClockProvider.tsx
- src/components/common/SystemPreferencesDrawer.tsx
- src/components/common/TabErrorIndicator.tsx
- src/components/common/ToastContainer.tsx
- src/components/common/UnifiedActivityTaskDrawer.tsx
- src/components/common/UnifiedDataPipelineModal.tsx
- src/components/common/ValidationSummaryPanel.tsx
- src/components/common/WorkspaceLoadingFallback.tsx
- src/components/common/index.ts
- src/config/moduleRegistry.ts
- src/index.css
- src/main.tsx

### COMMON/UNKNOWN (152 files)
- src/components/guidance/BusinessGpsTracker.tsx
- src/components/guidance/BusinessGuardBanner.tsx
- src/components/guidance/GuidanceModal.tsx
- src/components/guidance/IntentBar.tsx
- src/components/guidance/MyWorkWidget.tsx
- src/components/guidance/NextActionCard.tsx
- src/components/guidance/WorkflowVisualizer.tsx
- src/components/guidance/index.ts
- src/components/knowledge/BusinessDecisionAssistantModal.tsx
- src/components/knowledge/ErpAcademyModal.tsx
- src/components/knowledge/ErpGlossaryModal.tsx
- src/components/knowledge/ModuleGuidedDrawer.tsx
- src/components/knowledge/index.ts
- src/components/modals/ConfirmDialog.tsx
- src/components/modals/PdfPrintModal.tsx
- src/components/modals/TableExportModal.tsx
- src/components/shell/BranchSelector.tsx
- src/components/shell/ContextRail.tsx
- src/components/shell/DomainWorkspaceShell.tsx
- src/components/shell/EnvironmentProfileSelector.tsx
- src/components/shell/GlobalHeader.tsx
- src/components/shell/PrimaryNavigation.tsx
- src/components/shell/RoleSwitcher.tsx
- src/components/shell/index.ts
- src/components/workspaces/AuditComplianceWorkspace.tsx
- src/components/workspaces/DashboardStats.tsx
- src/components/workspaces/GenericModuleWorkspace.tsx
- src/components/workspaces/LotInventoryHistoryDrilldown.tsx
- src/components/workspaces/MasterWmsWorkspace.tsx
- src/components/workspaces/SuperAdminRBACWorkspace.tsx
- src/components/workspaces/SystemSettingsWorkspace.tsx
- src/components/workspaces/WorkspaceHub.tsx
- src/components/workspaces/audit/AuditComplianceTab.tsx
- src/components/workspaces/audit/AuditDetailModal.tsx
- src/components/workspaces/audit/AuditIntegrityTab.tsx
- src/components/workspaces/audit/AuditLedgerTab.tsx
- src/components/workspaces/audit/AuditSecurityAlertsTab.tsx
- src/components/workspaces/eventbus/EventDetailDrawer.tsx
- src/components/workspaces/eventbus/EventDlqTab.tsx
- src/components/workspaces/eventbus/EventPublisherTab.tsx
- src/components/workspaces/eventbus/EventSubscribersTab.tsx
- src/components/workspaces/eventbus/types.ts
- src/components/workspaces/logistics/modals/AssignDispatchModal.tsx
- src/components/workspaces/logistics/modals/MobileDriverAppSimulator.tsx
- src/components/workspaces/logistics/modals/NewDriverModal.tsx
- src/components/workspaces/logistics/modals/NewExceptionModal.tsx
- src/components/workspaces/logistics/modals/NewFuelModal.tsx
- src/components/workspaces/logistics/modals/NewMaintModal.tsx
- src/components/workspaces/logistics/modals/NewOrderModal.tsx
- src/components/workspaces/logistics/modals/NewVehicleModal.tsx
- src/components/workspaces/logistics/modals/PodModal.tsx
- src/components/workspaces/logistics/modals/PrintDocumentModal.tsx
- src/components/workspaces/logistics/types.tsx
- src/components/workspaces/m10/m10Types.ts
- src/components/workspaces/m11/m11Types.ts
- src/components/workspaces/m12/m12Types.ts
- src/components/workspaces/m16/ParkedOrdersManager.tsx
- src/components/workspaces/m16/PinnedQuickPickGrid.tsx
- src/components/workspaces/m16/ThermalReceiptModal.tsx
- src/components/workspaces/manufacturing/WorkOrderInspectionModal.tsx
- src/components/workspaces/pricing/InboundReceivingModal.tsx
- src/components/workspaces/pricing/ManualOverrideModal.tsx
- src/components/workspaces/pricing/PriceApprovalTab.tsx
- src/components/workspaces/pricing/PriceHistoryTab.tsx
- src/components/workspaces/pricing/PriceListsTab.tsx
- src/components/workspaces/pricing/ProductPricesTab.tsx
- src/components/workspaces/superAdmin/RbacDiagnosticsTab.tsx
- src/components/workspaces/superAdmin/RbacPermissionsTab.tsx
- src/components/workspaces/superAdmin/RbacRolesTab.tsx
- src/components/workspaces/superAdmin/RbacUsersTab.tsx
- src/components/workspaces/superAdmin/SuperAdminDetailModal.tsx
- src/components/workspaces/superAdmin/mockData.ts
- src/components/workspaces/superAdmin/types.ts
- src/components/workspaces/systemSettings/SettingsBranchesTab.tsx
- src/components/workspaces/systemSettings/SettingsDetailModal.tsx
- src/components/workspaces/systemSettings/SettingsParametersTab.tsx
- src/components/workspaces/systemSettings/SettingsProfilesTab.tsx
- src/components/workspaces/systemSettings/SystemIntegrityChecker.tsx
- src/components/workspaces/systemSettings/types.ts
- src/data/consolidationData.ts
- src/data/enterpriseMaster.ts
- src/data/erpBusinessKnowledge.ts
- src/data/m35SeedData.ts
- src/data/mockData.ts
- src/db/index.ts
- src/db/schema.ts
- src/domains/pricing/services/DiscountService.ts
- src/domains/pricing/services/MarginService.ts
- src/domains/pricing/services/PriceResolutionService.ts
- src/domains/pricing/types/pricing.types.ts
- src/hooks/useColumnPresets.ts
- src/hooks/useDynamicContainerHeight.ts
- src/hooks/useNotification.ts
- src/hooks/usePagination.ts
- src/hooks/useWorkspaceCacheCleanup.ts
- src/hooks/useWorkspaceContextSync.ts
- src/hooks/useWorkspaceSessionTab.ts
- src/lib/currency.ts
- src/middleware/auth.middleware.ts
- src/routes/analytics.routes.ts
- src/routes/auth.routes.ts
- src/routes/bank.routes.ts
- src/routes/core.routes.ts
- src/routes/crm.routes.ts
- src/routes/dms.routes.ts
- src/routes/ehs.routes.ts
- src/routes/events.routes.ts
- src/routes/finance.routes.ts
- src/routes/inventory.routes.ts
- src/routes/invoices.routes.ts
- src/routes/logistics.routes.ts
- src/routes/lots.routes.ts
- src/routes/manufacturing.routes.ts
- src/routes/masterData.routes.ts
- src/routes/pricing.routes.ts
- src/routes/projects.routes.ts
- src/routes/purchases.routes.ts
- src/routes/quality.routes.ts
- src/routes/rd.routes.ts
- src/routes/sales.routes.ts
- src/routes/settings.routes.ts
- src/routes/shift.routes.ts
- src/routes/sourcing.routes.ts
- src/routes/supplyChain.routes.ts
- src/routes/treasury.routes.ts
- src/routes/unifiedPipeline.routes.ts
- src/routes/workspace.routes.ts
- src/services/SalesEngine.ts
- src/services/WorkspaceAggregationService.ts
- src/services/guidanceEngine.ts
- src/services/masterDataCache.ts
- src/services/serialEngine.ts
- src/types/guidance.ts
- src/types/index.ts
- src/types/m35Types.ts
- src/types/pricingManagement.ts
- src/types/recentFavorites.ts
- src/types/salesOrderIntegration.ts
- src/types/systemPreferences.ts
- src/types/workspace.ts
- src/utils/apiUtils.ts
- src/utils/currencyFormatter.ts
- src/utils/excelExporter.ts
- src/utils/moduleMapper.ts
- src/utils/numberFormat.ts
- src/utils/pdfExporter.ts
- src/utils/pricingCalculator.ts
- src/utils/salesOrderDataNormalizer.ts
- src/utils/timeUtils.ts
- src/utils/workspaceCacheManager.ts
- server/orchestrationEngine.ts
- server/processEngine.ts

### M09 Suppliers SRM (6 files)
- src/components/srm/Supplier360Modal.tsx
- src/components/srm/SupplierEvaluationModal.tsx
- src/components/srm/SupplierSpendAnalyticsTab.tsx
- src/components/srm/SupplierTermsTab.tsx
- src/components/workspaces/M09SuppliersSRMWorkspace.tsx
- src/components/workspaces/M11SrmSupplierMgmtWorkspace.tsx

### M27 EAM Asset Maintenance (3 files)
- src/components/workspaces/AssetMaintenanceWorkspace.tsx
- src/components/workspaces/eventbus/EventStreamTab.tsx
- src/routes/eam.routes.ts

### M29 DMS Documents (1 files)
- src/components/workspaces/DMSWorkspace.tsx

### M40 EHS Safety & Environment (1 files)
- src/components/workspaces/EHSWorkspace.tsx

### M28 HR & Payroll (5 files)
- src/components/workspaces/HRWorkspace.tsx
- src/components/workspaces/hr/EmployeeDossier360Modal.tsx
- src/components/workspaces/hr/PayrollCalculationGLModal.tsx
- src/data/hrMasterData.ts
- src/routes/hr.routes.ts

### M05 EventBus & EDA (1 files)
- src/components/workspaces/M05EventBusWorkspace.tsx

### M06 Innovation R&D (1 files)
- src/components/workspaces/M06InnovationRDWorkspace.tsx

### M07 Customers Item Master (1 files)
- src/components/workspaces/M07CustomersItemMasterWorkspace.tsx

### M08 Purchase Orders (1 files)
- src/components/workspaces/M08PurchaseOrdersWorkspace.tsx

### M10 Strategic Sourcing (11 files)
- src/components/workspaces/M10StrategicSourcingWorkspace.tsx
- src/components/workspaces/m10/M10AnalyticsTab.tsx
- src/components/workspaces/m10/M10AwardsTab.tsx
- src/components/workspaces/m10/M10BidsTab.tsx
- src/components/workspaces/m10/M10ComparisonTab.tsx
- src/components/workspaces/m10/M10EvaluationTab.tsx
- src/components/workspaces/m10/M10LifecyclePipeline.tsx
- src/components/workspaces/m10/M10MetricCards.tsx
- src/components/workspaces/m10/M10RfqDetailModal.tsx
- src/components/workspaces/m10/M10RfqTab.tsx
- src/components/workspaces/m10/M10WorkspaceHeader.tsx

### M12 CRM (13 files)
- src/components/workspaces/M12CrmLeadsWorkspace.tsx
- src/components/workspaces/m12/M12ActivitiesTab.tsx
- src/components/workspaces/m12/M12AnalyticsTab.tsx
- src/components/workspaces/m12/M12ConvertLeadModal.tsx
- src/components/workspaces/m12/M12LeadDetailModal.tsx
- src/components/workspaces/m12/M12LeadsTab.tsx
- src/components/workspaces/m12/M12LifecyclePipeline.tsx
- src/components/workspaces/m12/M12MetricCards.tsx
- src/components/workspaces/m12/M12NewLeadModal.tsx
- src/components/workspaces/m12/M12NewQuotationModal.tsx
- src/components/workspaces/m12/M12PipelineTab.tsx
- src/components/workspaces/m12/M12QuotationsTab.tsx
- src/components/workspaces/m12/M12WorkspaceHeader.tsx

### M13 Sales Orders (18 files)
- src/components/workspaces/M13SalesOrdersWorkspace.tsx
- src/components/workspaces/m13/M13AnalyticsTab.tsx
- src/components/workspaces/m13/M13CreateOrderModal.tsx
- src/components/workspaces/m13/M13DynamicDiscountsTab.tsx
- src/components/workspaces/m13/M13FulfillmentTab.tsx
- src/components/workspaces/m13/M13LifecyclePipeline.tsx
- src/components/workspaces/m13/M13MetricCards.tsx
- src/components/workspaces/m13/M13OrderDetailModal.tsx
- src/components/workspaces/m13/M13OrdersTab.tsx
- src/components/workspaces/m13/M13PaymentModal.tsx
- src/components/workspaces/m13/M13QuotationImportModal.tsx
- src/components/workspaces/m13/M13ReservationTab.tsx
- src/components/workspaces/m13/M13TestRunnerTab.tsx
- src/components/workspaces/m13/M13VatInvoicesTab.tsx
- src/components/workspaces/m13/M13VatIssueModal.tsx
- src/components/workspaces/m13/M13WorkspaceHeader.tsx
- src/hooks/useSalesOrderSync.ts
- src/services/SalesOrderSyncService.ts

### M14 Sales Commission (1 files)
- src/components/workspaces/M14SalesCommissionWorkspace.tsx

### M15 Returns RMA (1 files)
- src/components/workspaces/M15ReturnsRMAWorkspace.tsx

### M16 POS Retail (4 files)
- src/components/workspaces/M16POSRetailWorkspace.tsx
- src/components/workspaces/m16/CashInOutModal.tsx
- src/components/workspaces/m16/M16POSWorkspace.tsx
- src/components/workspaces/m16/POSHotkeysBar.tsx

### M19 Stocktake (7 files)
- src/components/workspaces/M19StocktakeWorkspace.tsx
- src/components/workspaces/stocktake/StocktakeFieldExecutionTab.tsx
- src/components/workspaces/stocktake/StocktakeLedgerHistoryTab.tsx
- src/components/workspaces/stocktake/StocktakeMasterSessionsTab.tsx
- src/components/workspaces/stocktake/StocktakeSchedulesTab.tsx
- src/components/workspaces/stocktake/StocktakeTaskAssignmentTab.tsx
- src/components/workspaces/stocktake/StocktakeVarianceReconciliationTab.tsx

### M21 Internal Transfers (7 files)
- src/components/workspaces/M21InternalTransfersWorkspace.tsx
- src/components/workspaces/transfers/TransferDiscrepancyReconciliationTab.tsx
- src/components/workspaces/transfers/TransferDispatchExecutionTab.tsx
- src/components/workspaces/transfers/TransferFleetAssignmentTab.tsx
- src/components/workspaces/transfers/TransferLedgerHistoryTab.tsx
- src/components/workspaces/transfers/TransferMasterOrdersTab.tsx
- src/components/workspaces/transfers/TransferRoutesSchedulesTab.tsx

### M22 Lots & Batches (6 files)
- src/components/workspaces/M22LotsBatchesWorkspace.tsx
- src/components/workspaces/lotsBatches/LotDependencyGraphD3.tsx
- src/components/workspaces/lotsBatches/LotInventoryHistoryDrilldown.tsx
- src/components/workspaces/lotsBatches/LotsBatchesFEFOTab.tsx
- src/components/workspaces/lotsBatches/LotsBatchesMasterTab.tsx
- src/components/workspaces/lotsBatches/LotsBatchesTraceabilityTab.tsx

### M23 Serials & IMEI (1 files)
- src/components/workspaces/M23SerialsWorkspace.tsx

### M24 WMS Extended (1 files)
- src/components/workspaces/M24WMSExtendedWorkspace.tsx

### M30 Finance & GL (1 files)
- src/components/workspaces/M30GeneralLedgerWorkspace.tsx

### M31 Finance & Accounting (1 files)
- src/components/workspaces/M31InvoicesArApWorkspace.tsx

### M32 Payments & Cash (2 files)
- src/components/workspaces/M32PaymentsTreasuryWorkspace.tsx
- src/components/workspaces/m16/SplitPaymentModal.tsx

### M33 Bank Reconciliation (1 files)
- src/components/workspaces/M33BankReconciliationWorkspace.tsx

### M34 Financial Consolidation (1 files)
- src/components/workspaces/M34FinancialConsolidationWorkspace.tsx

### M35 Projects & WBS (1 files)
- src/components/workspaces/M35ProjectsWBSWorkspace.tsx

### M36 Logistics & Fleet (11 files)
- src/components/workspaces/M36LogisticsWorkspace.tsx
- src/components/workspaces/logistics/LogisticsAnalyticsTab.tsx
- src/components/workspaces/logistics/LogisticsCostsTab.tsx
- src/components/workspaces/logistics/LogisticsDashboardTab.tsx
- src/components/workspaces/logistics/LogisticsDetailDrawer.tsx
- src/components/workspaces/logistics/LogisticsDriversTab.tsx
- src/components/workspaces/logistics/LogisticsFleetTab.tsx
- src/components/workspaces/logistics/LogisticsMaintenanceTab.tsx
- src/components/workspaces/logistics/LogisticsOperationsTab.tsx
- src/components/workspaces/logistics/LogisticsPlanningTab.tsx
- src/components/workspaces/logistics/LogisticsRoutesTab.tsx

### M37 BI & Analytics Reports (1 files)
- src/components/workspaces/M37BiAnalyticsWorkspace.tsx

### M39 Quality Control QMS (1 files)
- src/components/workspaces/M39QualityControlWorkspace.tsx

### M41 Pricing & Commercial Management (9 files)
- src/components/workspaces/M41PricingManagementWorkspace.tsx
- src/components/workspaces/pricing/AddProductPricingModal.tsx
- src/components/workspaces/pricing/BulkPricingTab.tsx
- src/components/workspaces/pricing/CustomerPricingTab.tsx
- src/components/workspaces/pricing/PricingAuditAndSimulatorTab.tsx
- src/components/workspaces/pricing/PricingRulesTab.tsx
- src/components/workspaces/pricing/PromotionsTab.tsx
- src/components/workspaces/pricing/QuantityPricingTab.tsx
- src/domains/pricing/services/PromotionService.ts

### M42 Cost Allocation (2 files)
- src/components/workspaces/M42CostAllocationWorkspace.tsx
- src/components/workspaces/costing/CostingMethodSettingsView.tsx

### M25 Manufacturing & BOM (1 files)
- src/components/workspaces/ManufacturingWorkspace.tsx

### M38 Service Desk (1 files)
- src/components/workspaces/ServiceDeskWorkspace.tsx

### M20 Stock Adjustment (6 files)
- src/components/workspaces/StockAdjustmentWorkspace.tsx
- src/components/workspaces/stockAdjustment/StockAdjustmentApprovalDeskTab.tsx
- src/components/workspaces/stockAdjustment/StockAdjustmentCreateDraftTab.tsx
- src/components/workspaces/stockAdjustment/StockAdjustmentLedgerAuditTab.tsx
- src/components/workspaces/stockAdjustment/StockAdjustmentMasterTab.tsx
- src/components/workspaces/stockAdjustment/StockAdjustmentReasonAnalyticsTab.tsx

### M26 Supply Chain SCM (1 files)
- src/components/workspaces/SupplyChainWorkspace.tsx

### M18 Warehouse Management (9 files)
- src/components/workspaces/WarehouseAnalyticsTab.tsx
- src/components/workspaces/WarehouseFacilitiesMasterTab.tsx
- src/components/workspaces/WarehouseInboundTab.tsx
- src/components/workspaces/WarehouseInternalOpsTab.tsx
- src/components/workspaces/WarehouseManagementWorkspace.tsx
- src/components/workspaces/WarehouseOutboundTab.tsx
- src/components/workspaces/WarehouseProductsTab.tsx
- src/components/workspaces/WarehouseStockControlTab.tsx
- src/components/workspaces/WarehouseTraceabilityTab.tsx

### M11 SRM Supplier Mgmt (13 files)
- src/components/workspaces/m11/M11AnalyticsTab.tsx
- src/components/workspaces/m11/M11AuditsTab.tsx
- src/components/workspaces/m11/M11ContractsTab.tsx
- src/components/workspaces/m11/M11LifecyclePipeline.tsx
- src/components/workspaces/m11/M11MetricCards.tsx
- src/components/workspaces/m11/M11NewAuditModal.tsx
- src/components/workspaces/m11/M11NewContractModal.tsx
- src/components/workspaces/m11/M11NewScorecardModal.tsx
- src/components/workspaces/m11/M11PerformanceTab.tsx
- src/components/workspaces/m11/M11RenewContractModal.tsx
- src/components/workspaces/m11/M11ScorecardDetailModal.tsx
- src/components/workspaces/m11/M11ScorecardsTab.tsx
- src/components/workspaces/m11/M11WorkspaceHeader.tsx

