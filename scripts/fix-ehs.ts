import { Project } from "ts-morph";

const project = new Project({ tsConfigFilePath: "tsconfig.json" });
const f = project.getSourceFile("src/modules/governance/m40-ehs/components/EHSWorkspace.tsx");

if (f) {
  const imports = f.getImportDeclarations();
  imports.forEach(i => {
    const p = i.getModuleSpecifierValue();
    if (p.includes("../")) {
      // it should be relative to src/modules/governance/m40-ehs/components
      // Old path was src/components/workspaces
      // This is complicated. Let's just fix it with sed since there are only a few.
    }
  });
}
