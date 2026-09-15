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
  
  // Count directory depth to correctly map to root
  const depth = f.split('/').length - 2; // e.g. src/modules/a/b/c.tsx -> depth 3
  const relativePrefix = "../".repeat(depth);

  const patterns = [
    { regex: /(from\s+['"])(?:\.\.\/)+types/g, replacement: `$1${relativePrefix}types` },
    { regex: /(from\s+['"])(?:\.\.\/)+utils/g, replacement: `$1${relativePrefix}utils` },
    { regex: /(from\s+['"])(?:\.\.\/)+services/g, replacement: `$1${relativePrefix}services` },
    { regex: /(from\s+['"])(?:\.\.\/)+config/g, replacement: `$1${relativePrefix}config` },
    { regex: /(from\s+['"])(?:\.\.\/)+hooks/g, replacement: `$1${relativePrefix}hooks` },
    { regex: /(from\s+['"])(?:\.\.\/)+lib/g, replacement: `$1${relativePrefix}lib` },
    { regex: /(from\s+['"])(?:\.\.\/)+components/g, replacement: `$1${relativePrefix}components` },
    { regex: /(from\s+['"])(?:\.\.\/)+data/g, replacement: `$1${relativePrefix}data` },
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
console.log("Deep imports 2 calculated properly based on depth.");
