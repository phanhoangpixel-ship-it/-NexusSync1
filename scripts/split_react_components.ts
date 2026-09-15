import { Project, VariableDeclaration, FunctionDeclaration } from "ts-morph";

const filesToProcess = [
  "src/modules/finance/m31-invoices/components/M31InvoicesArApWorkspace.tsx",
  "src/modules/inventory/m17-master-wms/components/MasterWmsWorkspace.tsx",
  "src/modules/purchase/m08-purchase-orders/components/M08PurchaseOrdersWorkspace.tsx",
  "src/modules/sales/m16-pos/components/M16POSWorkspace.tsx"
];

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

for (const filePath of filesToProcess) {
  const sourceFile = project.getSourceFile(filePath);
  if (!sourceFile) {
    console.error(`File not found: ${filePath}`);
    continue;
  }

  const dir = sourceFile.getDirectory();
  const mainComponentName = sourceFile.getBaseNameWithoutExtension();
  
  const extractComponent = (name: string, structure: any, isFunctionDecl: boolean, nodeToRem: any) => {
    // Only extract if the name matches common component patterns
    if (
      name && 
      name !== mainComponentName && 
      (name.includes("Tab") || 
       name.includes("Modal") || 
       name.includes("Card") || 
       name.includes("Panel") || 
       name.includes("Form") || 
       name.includes("Table"))
    ) {
      const newFile = dir.createSourceFile(`${name}.tsx`, "", { overwrite: true });
      
      // Standard imports
      newFile.addImportDeclaration({
          moduleSpecifier: "react",
          defaultImport: "React",
          namedImports: ["useState", "useEffect", "useMemo", "useRef", "useCallback"]
      });
      newFile.addImportDeclaration({
          moduleSpecifier: "lucide-react",
          namedImports: [
            "Search", "Plus", "Filter", "Download", "Box", "Users", "Tag", "CheckCircle2", 
            "X", "ChevronRight", "Edit", "Trash2", "RefreshCcw", "ArrowRight", "FileText",
            "Calendar", "DollarSign", "MoreVertical", "Play", "Settings", "AlertCircle"
          ]
      });

      // Try to import types if they exist
      const typesFile = dir.getSourceFile("types.ts");
      if (typesFile) {
        const typesNames = [...typesFile.getInterfaces().map(i => i.getName()), ...typesFile.getTypeAliases().map(t => t.getName())];
        if (typesNames.length > 0) {
           newFile.addImportDeclaration({
               moduleSpecifier: "./types",
               namedImports: typesNames
           });
        }
      }

      if (isFunctionDecl) {
        newFile.addFunction(structure);
        newFile.getFunction(name)!.setIsExported(true);
      } else {
        newFile.addVariableStatement(structure);
        newFile.getVariableStatement(name)!.setIsExported(true);
      }
      
      // Update original file with import
      const existingImport = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === `./${name}`);
      if (!existingImport) {
          sourceFile.addImportDeclaration({
              moduleSpecifier: `./${name}`,
              namedImports: [name]
          });
      }
      
      nodeToRem.remove();
      console.log(`Extracted ${name} to ${name}.tsx`);
    }
  };

  // Process top-level functions
  const functions = sourceFile.getFunctions();
  functions.forEach(f => {
      const name = f.getName();
      if (name) {
         extractComponent(name, f.getStructure(), true, f);
      }
  });

  // Process top-level variables (arrow functions)
  const vars = sourceFile.getVariableStatements();
  vars.forEach(v => {
      const decl = v.getDeclarations()[0];
      const name = decl.getName();
      const init = decl.getInitializer();
      
      if (init && (init.getKindName() === "ArrowFunction" || init.getKindName() === "FunctionExpression")) {
         extractComponent(name, v.getStructure(), false, v);
      }
  });
}

project.saveSync();
console.log("React component split complete.");
