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
    { regex: /(from\s+['"])\.\.\/srm\//g, replacement: "$1../../../../components/srm/" },
    { regex: /(from\s+['"])\.\.\/crm\//g, replacement: "$1../../../../components/crm/" },
    { regex: /(from\s+['"])\.\.\/mes\//g, replacement: "$1../../../../components/mes/" },
    { regex: /(from\s+['"])\.\.\/scp\//g, replacement: "$1../../../../components/scp/" },
    { regex: /(from\s+['"])\.\.\/eam\//g, replacement: "$1../../../../components/eam/" },
    { regex: /(from\s+['"])\.\.\/wbs\//g, replacement: "$1../../../../components/wbs/" },
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
console.log("Component deep imports 3 fixed.");
