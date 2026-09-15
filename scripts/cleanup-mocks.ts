import fs from "fs";
import path from "path";

const routesDir = path.join(process.cwd(), "src/routes");
if (fs.existsSync(routesDir)) {
  const files = fs.readdirSync(routesDir).filter(f => f.endsWith(".ts"));
  let cleanedCount = 0;
  for (const file of files) {
    const filePath = path.join(routesDir, file);
    let content = fs.readFileSync(filePath, "utf-8");
    if (content.includes('../data/mockData')) {
      // Remove the import statement completely
      content = content.replace(/import\s+{[\s\S]*?}\s+from\s+["']\.\.\/data\/mockData["'];?\n?/g, '');
      fs.writeFileSync(filePath, content);
      cleanedCount++;
    }
  }
  console.log(`Cleaned mockData imports from ${cleanedCount} route files.`);
}
