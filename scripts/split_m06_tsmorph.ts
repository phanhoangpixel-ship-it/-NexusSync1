import { Project } from "ts-morph";

const project = new Project({ tsConfigFilePath: "tsconfig.json" });
const sourceFile = project.getSourceFile("src/modules/master-data/m06-innovation-rd/components/M06InnovationRDWorkspace.tsx");

if (!sourceFile) {
  console.error("File not found");
  process.exit(1);
}

const dir = sourceFile.getDirectory();
const typesFile = dir.createSourceFile("types.ts", "", { overwrite: true });

// Move all interfaces and type aliases
const interfaces = sourceFile.getInterfaces();
const typeAliases = sourceFile.getTypeAliases();

interfaces.forEach(i => {
  typesFile.addInterface(i.getStructure());
  i.remove();
});

typeAliases.forEach(t => {
  typesFile.addTypeAlias(t.getStructure());
  t.remove();
});

// Ensure they are exported
typesFile.getInterfaces().forEach(i => i.setIsExported(true));
typesFile.getTypeAliases().forEach(t => t.setIsExported(true));

// Move mock data
// Anything that is a const array or object that looks like mock data (e.g. MOCK_..., INITIAL_...)
const mockFile = dir.createSourceFile("mockData.ts", "", { overwrite: true });
const variableStatements = sourceFile.getVariableStatements();
const mockNames: string[] = [];

variableStatements.forEach(v => {
  const name = v.getDeclarations()[0].getName();
  if (name.includes("MOCK") || name.includes("INITIAL") || name === "PROJECT_CATEGORIES" || name === "TRIAL_STATUS_COLORS") {
    mockFile.addVariableStatement(v.getStructure());
    mockNames.push(name);
    v.remove();
  }
});

mockFile.getVariableStatements().forEach(v => v.setIsExported(true));

// Add imports
const typesNames = [...typesFile.getInterfaces().map(i => i.getName()), ...typesFile.getTypeAliases().map(t => t.getName())];
if (typesNames.length > 0) {
  sourceFile.addImportDeclaration({
    moduleSpecifier: "./types",
    namedImports: typesNames.filter(n => n !== "M06InnovationRDWorkspaceProps"), // Keep props inside if we want, or just import it
  });
  mockFile.addImportDeclaration({
    moduleSpecifier: "./types",
    namedImports: typesNames,
  });
}

if (mockNames.length > 0) {
  sourceFile.addImportDeclaration({
    moduleSpecifier: "./mockData",
    namedImports: mockNames,
  });
}

// Split React components (Tabs, Modals)
const functions = sourceFile.getFunctions();
functions.forEach(f => {
    const name = f.getName();
    if (name && (name.includes("Tab") || name.includes("Modal") || name.includes("Card") || name.includes("Panel"))) {
        const newFile = dir.createSourceFile(`${name}.tsx`, "", { overwrite: true });
        newFile.addImportDeclaration({
            moduleSpecifier: "react",
            defaultImport: "React",
            namedImports: ["useState", "useEffect", "useMemo"]
        });
        newFile.addImportDeclaration({
            moduleSpecifier: "lucide-react",
            namedImports: ["Search", "Plus", "Filter", "Download", "Beaker", "Microscope", "FileText", "CheckCircle2", "X", "ChevronRight"] // just add common ones, can fix later
        });
        newFile.addImportDeclaration({
            moduleSpecifier: "./types",
            namedImports: typesNames
        });
        
        newFile.addFunction(f.getStructure());
        newFile.getFunction(name)!.setIsExported(true);
        
        sourceFile.addImportDeclaration({
            moduleSpecifier: `./${name}`,
            namedImports: [name]
        });
        
        f.remove();
    }
});

// Arrow function components
const remainingVars = sourceFile.getVariableStatements();
remainingVars.forEach(v => {
    const decl = v.getDeclarations()[0];
    const name = decl.getName();
    const init = decl.getInitializer();
    if (init && (init.getKindName() === "ArrowFunction" || init.getKindName() === "FunctionExpression")) {
        if (name && name !== "M06InnovationRDWorkspace" && (name.includes("Tab") || name.includes("Modal") || name.includes("Card") || name.includes("Panel") || name.includes("View") || name.includes("Row"))) {
            const newFile = dir.createSourceFile(`${name}.tsx`, "", { overwrite: true });
            newFile.addImportDeclaration({
                moduleSpecifier: "react",
                defaultImport: "React",
                namedImports: ["useState", "useEffect", "useMemo"]
            });
            newFile.addImportDeclaration({
                moduleSpecifier: "lucide-react",
                namedImports: ["Search", "Plus", "Filter", "Download", "Beaker", "Microscope", "FileText", "CheckCircle2", "X", "ChevronRight"]
            });
            newFile.addImportDeclaration({
                moduleSpecifier: "./types",
                namedImports: typesNames
            });
            
            newFile.addVariableStatement(v.getStructure());
            newFile.getVariableStatement(name)!.setIsExported(true);
            
            sourceFile.addImportDeclaration({
                moduleSpecifier: `./${name}`,
                namedImports: [name]
            });
            
            v.remove();
        }
    }
});


project.saveSync();
console.log("M06 Split complete.");
