import { Project } from "ts-morph";
import * as fs from "fs";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

const sourceFile = project.getSourceFile("src/components/workspaces/EHSWorkspace.tsx");
if (sourceFile) {
  // Move it to src/modules/governance/m40-ehs/components
  const newDir = project.createDirectory("src/modules/governance/m40-ehs/components");
  sourceFile.moveToDirectory(newDir);
  project.saveSync();
  console.log("Moved EHSWorkspace");
} else {
  console.log("File not found in project");
}
