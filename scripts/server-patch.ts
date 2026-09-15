import fs from "fs";

let content = fs.readFileSync("server.ts", "utf-8");

const importStatement = `import { requireAuth } from "./src/middleware/auth.middleware";\n`;
if (!content.includes('requireAuth')) {
  content = importStatement + content;
  content = content.replace(
    '  // --- API ROUTES ---',
    '  // --- API ROUTES ---\n  app.use("/api", requireAuth);'
  );
  fs.writeFileSync("server.ts", content);
}
