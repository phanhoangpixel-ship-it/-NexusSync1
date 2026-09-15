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
    { regex: /(from\s+['"])\.\.\/\.\.\/manufacturing\//g, replacement: "$1./" },
    { regex: /(from\s+['"])\.\.\/\.\.\/pricing\//g, replacement: "$1./" },
    { regex: /(from\s+['"])\.\.\/\.\.\/m16\//g, replacement: "$1./" },
    { regex: /(from\s+['"])\.\.\/\.\.\/m13\//g, replacement: "$1./" },
    { regex: /(from\s+['"])\.\.\/\.\.\/m12\//g, replacement: "$1./" },
    { regex: /(from\s+['"])\.\.\/\.\.\/m11\//g, replacement: "$1./" },
    { regex: /(from\s+['"])\.\.\/\.\.\/m10\//g, replacement: "$1./" },
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
console.log("Sub-imports level 3 fixed.");
