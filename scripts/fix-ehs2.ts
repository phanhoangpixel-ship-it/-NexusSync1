import { Project } from "ts-morph";

const project = new Project({ tsConfigFilePath: "tsconfig.json" });
const f = project.getSourceFile("src/modules/governance/m40-ehs/components/EHSWorkspace.tsx");

if (f) {
  const imports = f.getImportDeclarations();
  imports.forEach(i => {
    const val = i.getModuleSpecifierValue();
    if (val.startsWith("../../../../common/")) {
      i.setModuleSpecifier(val.replace("../../../../common/", "../../../../components/common/"));
    } else if (val.startsWith("../../../../shell/")) {
      i.setModuleSpecifier(val.replace("../../../../shell/", "../../../../components/shell/"));
    }
  });
  project.saveSync();
}
