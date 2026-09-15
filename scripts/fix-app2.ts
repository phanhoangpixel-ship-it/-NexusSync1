import * as fs from "fs";
import * as path from "path";

let content = fs.readFileSync("src/App.tsx", "utf8");

// Specific fallback replacements in case standard ones missed it
content = content.replace(/import\('\.\/modules\/manufacturing\/m25-mes\/components\/manufacturing\/ManufacturingWorkspace'\)/g, "import('./modules/manufacturing/m25-mes/components/ManufacturingWorkspace')");
content = content.replace(/import\('\.\/modules\/sales\/m16-pos\/components\/pos\/M16POSRetailWorkspace'\)/g, "import('./modules/sales/m16-pos/components/M16POSRetailWorkspace')");
content = content.replace(/import\('\.\/modules\/sales\/m16-pos\/components\/m16\/M16POSRetailWorkspace'\)/g, "import('./modules/sales/m16-pos/components/M16POSRetailWorkspace')");
content = content.replace(/import\('\.\/modules\/admin\/m03-system-settings\/components\/systemSettings\/SystemSettingsWorkspace'\)/g, "import('./modules/admin/m03-system-settings/components/SystemSettingsWorkspace')");
content = content.replace(/import\('\.\/modules\/admin\/m04-super-admin\/components\/superAdmin\/SuperAdminRBACWorkspace'\)/g, "import('./modules/admin/m04-super-admin/components/SuperAdminRBACWorkspace')");
content = content.replace(/import\('\.\/modules\/governance\/m02-audit\/components\/audit\/AuditComplianceWorkspace'\)/g, "import('./modules/governance/m02-audit/components/AuditComplianceWorkspace')");
content = content.replace(/import\('\.\/modules\/governance\/m05-eventbus\/components\/eventbus\/M05EventBusWorkspace'\)/g, "import('./modules/governance/m05-eventbus/components/M05EventBusWorkspace')");

fs.writeFileSync("src/App.tsx", content);
console.log("App.tsx level 2 fixed.");
