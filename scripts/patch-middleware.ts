import fs from "fs";

let content = fs.readFileSync("src/middleware/auth.middleware.ts", "utf-8");
content = content.replace(
  "req.path === '/api/auth/login'",
  "req.path === '/api/auth/login' || req.originalUrl === '/api/auth/login' || req.path === '/auth/login'"
);
fs.writeFileSync("src/middleware/auth.middleware.ts", content);
