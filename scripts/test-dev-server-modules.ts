import fs from "fs";

async function testAllModules() {
  const appContent = fs.readFileSync("src/App.tsx", "utf8");
  const matches = [...appContent.matchAll(/import\(['"](\.\/modules\/[^'"]+)['"]\)/g)];

  console.log(`Found ${matches.length} dynamic module imports in App.tsx.`);
  let failed = 0;

  for (const match of matches) {
    const relPath = match[1].replace(/^\.\//, 'src/');
    // Try .tsx or .ts
    let finalPath = relPath;
    if (!finalPath.endsWith('.tsx') && !finalPath.endsWith('.ts')) {
      if (fs.existsSync(finalPath + '.tsx')) finalPath += '.tsx';
      else if (fs.existsSync(finalPath + '.ts')) finalPath += '.ts';
    }

    const url = `http://localhost:3000/${finalPath}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`❌ FAILED (${res.status}): ${url}`);
        const body = await res.text();
        console.error(body.slice(0, 300));
        failed++;
      } else {
        // also check if body contains error
        const text = await res.text();
        if (text.includes("Internal Server Error") || text.includes("vite:error")) {
          console.error(`❌ VITE ERROR in content: ${url}`);
          console.error(text.slice(0, 300));
          failed++;
        } else {
          console.log(`✅ OK (${res.status}): ${finalPath}`);
        }
      }
    } catch (err: any) {
      console.error(`❌ EXCEPTION fetching ${url}:`, err.message);
      failed++;
    }
  }

  console.log(`\nResult: ${matches.length - failed} passed, ${failed} failed.`);
}

testAllModules();
