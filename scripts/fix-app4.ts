import * as fs from "fs";
import * as path from "path";

let content = fs.readFileSync("src/App.tsx", "utf8");

// Try to clean up ALL App.tsx nested bad paths 
content = content.replace(/import\('\.\/modules\/[a-z0-9-]+\/[a-z0-9-]+\/components\/modules\/([a-z0-9-]+\/[a-z0-9-]+\/components\/[a-zA-Z0-9]+)'\)/g, "import('./modules/$1')");

fs.writeFileSync("src/App.tsx", content);
console.log("App.tsx level 4 fixed.");
