import { Project } from "ts-morph";
import * as path from "path";
import * as fs from "fs";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

const fileMappings: Record<string, string> = {
  // EAM
  "src/components/workspaces/AssetMaintenanceWorkspace.tsx": "src/modules/assets/m27-eam/components/AssetMaintenanceWorkspace.tsx",
  // HR
  "src/components/workspaces/HRWorkspace.tsx": "src/modules/hr/m28-hr-payroll/components/HRWorkspace.tsx",
  "src/components/workspaces/hr/EmployeeDossier360Modal.tsx": "src/modules/hr/m28-hr-payroll/components/EmployeeDossier360Modal.tsx",
  "src/components/workspaces/hr/PayrollCalculationGLModal.tsx": "src/modules/hr/m28-hr-payroll/components/PayrollCalculationGLModal.tsx",
  // Service Desk
  "src/components/workspaces/ServiceDeskWorkspace.tsx": "src/modules/governance/m38-service-desk/components/ServiceDeskWorkspace.tsx",
  // Logistics
  "src/components/workspaces/M36LogisticsWorkspace.tsx": "src/modules/logistics/m36-logistics-fleet/components/M36LogisticsWorkspace.tsx",
  // EHS
  // EHSWorkspace was already moved in the test
};

// Also move any files in src/components/workspaces/logistics/ to m36
const logisticsDir = project.getDirectory("src/components/workspaces/logistics");
if (logisticsDir) {
  const newLogisticsDir = project.createDirectory("src/modules/logistics/m36-logistics-fleet/components");
  logisticsDir.getSourceFiles().forEach(f => {
    f.moveToDirectory(newLogisticsDir);
  });
  // move subdirectories of logistics too
  logisticsDir.getDirectories().forEach(d => {
    d.moveToDirectory(newLogisticsDir);
  });
}

for (const [oldPath, newPath] of Object.entries(fileMappings)) {
  const sourceFile = project.getSourceFile(oldPath);
  if (sourceFile) {
    const newDirStr = path.dirname(newPath);
    let newDir = project.getDirectory(newDirStr);
    if (!newDir) {
      newDir = project.createDirectory(newDirStr);
    }
    sourceFile.moveToDirectory(newDir);
    console.log(`Moved ${oldPath} -> ${newPath}`);
  }
}

project.saveSync();
console.log("Phase 1 move completed.");
