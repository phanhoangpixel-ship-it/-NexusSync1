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

  const regex1 = /(from\s+['"])((\.\.\/)+)common\//g;
  if (regex1.test(content)) {
    content = content.replace(regex1, "$1$2components/common/");
    changed = true;
  }
  
  const regex2 = /(from\s+['"])((\.\.\/)+)shell\//g;
  if (regex2.test(content)) {
    content = content.replace(regex2, "$1$2components/shell/");
    changed = true;
  }
  
  const regex3 = /(from\s+['"])((\.\.\/)+)ui\//g;
  if (regex3.test(content)) {
    content = content.replace(regex3, "$1$2components/ui/");
    changed = true;
  }

  // Handle workspaces references (if any workspace component references another in old structure)
  // We'll let TS compilation tell us what's broken.

  if (changed) {
    fs.writeFileSync(f, content);
  }
}
console.log("Imports cleanup done.");
