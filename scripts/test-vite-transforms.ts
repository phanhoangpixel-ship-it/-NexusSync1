import { createServer } from "vite";
import fs from "fs";
import path from "path";

async function testAllViteTransforms() {
  console.log("Starting Vite in middleware mode to test transforms...");
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: "spa"
  });

  const appContent = fs.readFileSync("src/App.tsx", "utf8");
  const matches = [...appContent.matchAll(/import\(['"](\.\/modules\/[^'"]+)['"]\)/g)];

  console.log(`Found ${matches.length} dynamic module imports in App.tsx.`);
  let failed = 0;

  for (const match of matches) {
    const relPath = match[1].replace(/^\.\//, 'src/');
    let target = '/' + relPath;
    if (!target.endsWith('.tsx') && !target.endsWith('.ts')) {
      if (fs.existsSync(relPath + '.tsx')) target += '.tsx';
      else if (fs.existsSync(relPath + '.ts')) target += '.ts';
    }

    try {
      const res = await vite.transformRequest(target);
      if (!res) {
        console.error(`❌ NULL RESULT for ${target}`);
        failed++;
      } else {
        console.log(`✅ [TRANSFORM OK] ${target} (${res.code.length} bytes)`);
      }
    } catch (err: any) {
      console.error(`❌ TRANSFORM ERROR for ${target}:`, err.message);
      if (err.frame) console.error(err.frame);
      failed++;
    }
  }

  // Also test /src/main.tsx and /src/App.tsx
  try {
    const mainRes = await vite.transformRequest('/src/main.tsx');
    console.log(`✅ [TRANSFORM OK] /src/main.tsx (${mainRes?.code.length} bytes)`);
  } catch (err: any) {
    console.error(`❌ TRANSFORM ERROR for /src/main.tsx:`, err.message);
    failed++;
  }

  try {
    const appRes = await vite.transformRequest('/src/App.tsx');
    console.log(`✅ [TRANSFORM OK] /src/App.tsx (${appRes?.code.length} bytes)`);
  } catch (err: any) {
    console.error(`❌ TRANSFORM ERROR for /src/App.tsx:`, err.message);
    failed++;
  }

  await vite.close();
  console.log(`\nFinished: ${matches.length + 2 - failed} succeeded, ${failed} failed.`);
}

testAllViteTransforms().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
