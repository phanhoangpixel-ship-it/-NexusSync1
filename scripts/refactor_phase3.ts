import { Project } from "ts-morph";

const filesToProcess = [
  "src/modules/finance/m34-consolidation/components/M34FinancialConsolidationWorkspace.tsx",
  "src/modules/finance/m31-invoices/components/M31InvoicesArApWorkspace.tsx",
  "src/modules/inventory/m17-master-wms/components/MasterWmsWorkspace.tsx",
  "src/modules/purchase/m08-purchase-orders/components/M08PurchaseOrdersWorkspace.tsx",
  "src/modules/sales/m16-pos/components/M16POSWorkspace.tsx",
  "src/modules/inventory/m18-warehouse/components/WarehouseOutboundTab.tsx",
  "src/modules/sales/m14-sales-commission/components/M14SalesCommissionWorkspace.tsx",
  "src/modules/inventory/m23-serials/components/M23SerialsWorkspace.tsx",
  "src/modules/sales/m15-returns/components/M15ReturnsRMAWorkspace.tsx",
  "src/modules/purchase/m09-suppliers/components/M09SuppliersSRMWorkspace.tsx",
  "src/modules/inventory/m18-warehouse/components/WarehouseFacilitiesMasterTab.tsx",
  "src/modules/finance/m32-payments/components/M32PaymentsTreasuryWorkspace.tsx",
  "src/modules/finance/m30-gl/components/M30GeneralLedgerWorkspace.tsx"
];

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

for (const filePath of filesToProcess) {
  const sourceFile = project.getSourceFile(filePath);
  if (!sourceFile) {
    console.error(`File not found: ${filePath}`);
    continue;
  }

  const dir = sourceFile.getDirectory();
  
  // 1. Create or get types.ts
  let typesFile = dir.getSourceFile("types.ts");
  if (!typesFile) {
    typesFile = dir.createSourceFile("types.ts", "", { overwrite: false });
  }

  const interfaces = sourceFile.getInterfaces();
  const typeAliases = sourceFile.getTypeAliases();
  
  if (interfaces.length > 0 || typeAliases.length > 0) {
    interfaces.forEach(i => {
      typesFile.addInterface(i.getStructure());
      i.remove();
    });

    typeAliases.forEach(t => {
      typesFile.addTypeAlias(t.getStructure());
      t.remove();
    });

    typesFile.getInterfaces().forEach(i => i.setIsExported(true));
    typesFile.getTypeAliases().forEach(t => t.setIsExported(true));
  }

  // 2. Create or get mockData.ts
  let mockFile = dir.getSourceFile("mockData.ts");
  if (!mockFile) {
    mockFile = dir.createSourceFile("mockData.ts", "", { overwrite: false });
  }
  
  const variableStatements = sourceFile.getVariableStatements();
  const mockNames: string[] = [];

  variableStatements.forEach(v => {
    const name = v.getDeclarations()[0].getName();
    if (
      name.includes("MOCK") || 
      name.includes("INITIAL") || 
      name.includes("STATUS_COLORS") || 
      name.includes("CATEGORIES") ||
      name.includes("mock") ||
      name === "PAYMENT_METHODS" ||
      name === "RETURN_REASONS" ||
      name === "WAREHOUSE_ZONES"
    ) {
      // Don't extract simple useState initializers that aren't big constants, 
      // but usually these uppercase names are big constants.
      if (v.getDeclarations()[0].getInitializer()) {
         mockFile.addVariableStatement(v.getStructure());
         mockNames.push(name);
         v.remove();
      }
    }
  });

  mockFile.getVariableStatements().forEach(v => v.setIsExported(true));

  // Add imports
  const typesNames = [...typesFile.getInterfaces().map(i => i.getName()), ...typesFile.getTypeAliases().map(t => t.getName())];
  
  if (typesNames.length > 0) {
    // Only import types if there are any
    sourceFile.addImportDeclaration({
      moduleSpecifier: "./types",
      namedImports: typesNames.filter(n => !n.includes("Props")), // we might have extracted props, let's just import all
    });
    if (mockNames.length > 0) {
      mockFile.addImportDeclaration({
        moduleSpecifier: "./types",
        namedImports: typesNames,
      });
    }
  }

  if (mockNames.length > 0) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: "./mockData",
      namedImports: mockNames,
    });
  }
  
  console.log(`Processed ${filePath}`);
}

project.saveSync();
console.log("Phase 3 extraction complete.");
