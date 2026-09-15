import fs from "fs";
import path from "path";

const appContent = fs.readFileSync("src/App.tsx", "utf8");
const lines = appContent.split("\n");

console.log("=== CHECKING LAZY IMPORTS IN APP.TSX ===");

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.includes("lazy(() => import(")) continue;

  const varMatch = line.match(/const\s+(\w+)\s*=\s*lazy/);
  const pathMatch = line.match(/import\(['"]([^'"]+)['"]\)/);
  const namedMatch = line.match(/default:\s*m\.(\w+)/);

  if (!varMatch || !pathMatch) continue;

  const varName = varMatch[1];
  const importRel = pathMatch[1];
  const expectedNamed = namedMatch ? namedMatch[1] : null;

  let filePath = path.resolve("src", importRel + ".tsx");
  if (!fs.existsSync(filePath)) {
    filePath = path.resolve("src", importRel + ".ts");
    if (!fs.existsSync(filePath)) {
      filePath = path.resolve("src", importRel + "/index.tsx");
    }
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ [FILE NOT FOUND] ${varName}: ${importRel}`);
    continue;
  }

  const fileContent = fs.readFileSync(filePath, "utf8");

  const hasExportConst = fileContent.includes(`export const ${expectedNamed}`);
  const hasExportFunc = fileContent.includes(`export function ${expectedNamed}`);
  const hasExportClass = fileContent.includes(`export class ${expectedNamed}`);
  const hasExportList = new RegExp(`export\\s*\\{[^}]*\\b${expectedNamed}\\b[^}]*\\}`).test(fileContent);
  const hasDefault = fileContent.includes("export default");

  const hasNamed = hasExportConst || hasExportFunc || hasExportClass || hasExportList;

  if (expectedNamed && !hasNamed) {
    console.warn(`⚠️ [NAMED EXPORT MISSING] ${varName} expects 'm.${expectedNamed}', but file only has ${hasDefault ? 'DEFAULT EXPORT' : 'NO EXPORT'}! File: ${importRel}`);
  } else {
    console.log(`✅ [OK] ${varName} -> ${importRel}`);
  }
}
