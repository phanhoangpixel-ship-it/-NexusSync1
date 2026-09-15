import * as fs from "fs";
import * as path from "path";

let content = fs.readFileSync("src/App.tsx", "utf8");

// Try to clean up any remaining bad paths in App.tsx imports
content = content.replace(/import\('\.\/modules\/([^\/]+)\/([^\/]+)\/components\/([^\/]+)\/([^\']+)'\)/g, "import('./modules/$1/$2/components/$4')");

fs.writeFileSync("src/App.tsx", content);
console.log("App.tsx level 3 fixed.");
