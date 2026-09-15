import { Project } from "ts-morph";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

const sourceFile = project.getSourceFile("src/components/workspaces/EHSWorkspace.tsx");
if (sourceFile) {
  sourceFile.moveToDirectory("src/modules/governance/m40-ehs/components");
  project.saveSync();
  console.log("Moved EHSWorkspace");
} else {
  console.log("File not found");
}
