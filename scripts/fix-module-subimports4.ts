import * as fs from "fs";
import * as path from "path";

const IGNORE = ["node_modules", ".git", "dist"];

function getFiles(dir: string, list: string[] = []) {
  if (!fs.existsSync(dir)) return list;
  for (const f of fs.readdirSync(dir)) {
    if (IGNORE.includes(f)) continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) getFiles(p, list);
    else if (p.endsWith(".ts") || p.endsWith(".tsx")) list.push(p);
  }
  return list;
}

const files = getFiles("src/modules");
for (const f of files) {
  let content = fs.readFileSync(f, "utf8");
  let changed = false;

  const patterns = [
    { regex: /(from\s+['"])(?:\.\.\/)+types\/pricingManagement/g, replacement: "$1./types" },
    { regex: /(from\s+['"])(?:\.\.\/)+types\/m35Types/g, replacement: "$1./types" },
    { regex: /(from\s+['"])(?:\.\.\/)+utils\/pricingCalculator/g, replacement: "$1./utils" },
  ];

  for (const { regex, replacement } of patterns) {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(f, content);
  }
}
console.log("Sub-imports level 4 fixed.");
