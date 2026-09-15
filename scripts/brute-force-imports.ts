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
    { regex: /(from\s+['"])\.\.\/\.\.\/types/g, replacement: "$1../../../../types" },
    { regex: /(from\s+['"])\.\.\/\.\.\/\.\.\/types/g, replacement: "$1../../../../types" },
    { regex: /(from\s+['"])\.\.\/types/g, replacement: "$1../../../../types" },
    
    { regex: /(from\s+['"])\.\.\/\.\.\/utils/g, replacement: "$1../../../../utils" },
    { regex: /(from\s+['"])\.\.\/\.\.\/\.\.\/utils/g, replacement: "$1../../../../utils" },
    { regex: /(from\s+['"])\.\.\/utils/g, replacement: "$1../../../../utils" },
    
    { regex: /(from\s+['"])\.\.\/\.\.\/services/g, replacement: "$1../../../../services" },
    { regex: /(from\s+['"])\.\.\/\.\.\/\.\.\/services/g, replacement: "$1../../../../services" },
    { regex: /(from\s+['"])\.\.\/services/g, replacement: "$1../../../../services" },
    
    { regex: /(from\s+['"])\.\.\/\.\.\/config/g, replacement: "$1../../../../config" },
    { regex: /(from\s+['"])\.\.\/\.\.\/\.\.\/config/g, replacement: "$1../../../../config" },
    { regex: /(from\s+['"])\.\.\/config/g, replacement: "$1../../../../config" },
    
    { regex: /(from\s+['"])\.\.\/\.\.\/hooks/g, replacement: "$1../../../../hooks" },
    { regex: /(from\s+['"])\.\.\/\.\.\/\.\.\/hooks/g, replacement: "$1../../../../hooks" },
    { regex: /(from\s+['"])\.\.\/hooks/g, replacement: "$1../../../../hooks" },
    
    { regex: /(from\s+['"])\.\.\/\.\.\/components\/common/g, replacement: "$1../../../../components/common" },
    { regex: /(from\s+['"])\.\.\/\.\.\/components\/ui/g, replacement: "$1../../../../components/ui" },
    { regex: /(from\s+['"])\.\.\/components\/common/g, replacement: "$1../../../../components/common" },
    { regex: /(from\s+['"])\.\.\/components\/ui/g, replacement: "$1../../../../components/ui" },
    { regex: /(from\s+['"])\.\.\/common/g, replacement: "$1../../../../components/common" },
    { regex: /(from\s+['"])\.\.\/ui/g, replacement: "$1../../../../components/ui" },
  ];

  for (const { regex, replacement } of patterns) {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      changed = true;
    }
  }

  // Very aggressive fix for components mapped from root src
  content = content.replace(/from\s+['"]\.\.\/src\//g, "from '../../../../");
  content = content.replace(/from\s+['"]\.\.\/\.\.\/src\//g, "from '../../../../");

  if (changed) {
    fs.writeFileSync(f, content);
  }
}
console.log("Brute force imports fixed.");
