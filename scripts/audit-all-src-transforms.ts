import { createServer } from "vite";
import fs from "fs";
import path from "path";

function getAllFiles(dir: string, extList: string[]): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, extList));
    } else {
      if (extList.some(ext => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
  }
  return results;
}

async function testAllSrcFiles() {
  console.log("Auditing ALL src/ files with Vite transformRequest...");
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: "spa"
  });

  const files = getAllFiles("src", [".ts", ".tsx"]);
  console.log(`Found ${files.length} TypeScript/React files in src/.`);

  let failed = 0;
  for (const file of files) {
    // skip .d.ts
    if (file.endsWith(".d.ts")) continue;
    const url = "/" + file.replace(/\\/g, "/");
    try {
      const res = await vite.transformRequest(url);
      if (!res) {
        console.error(`❌ Null transform: ${url}`);
        failed++;
      }
    } catch (err: any) {
      console.error(`❌ Vite Transform Error in ${url}:`, err.message);
      if (err.frame) console.error(err.frame);
      failed++;
    }
  }

  await vite.close();
  console.log(`\nAudit Complete: ${files.length - failed} passed, ${failed} failed.`);
}

testAllSrcFiles().catch(err => {
  console.error("Fatal audit error:", err);
  process.exit(1);
});
