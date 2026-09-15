const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('sourcingRouter')) {
  code = code.replace(
    'import shiftRouter from "./src/routes/shift.routes";',
    'import shiftRouter from "./src/routes/shift.routes";\nimport { sourcingRouter } from "./src/routes/sourcing.routes";'
  );
  code = code.replace(
    'app.use("/api/shift", shiftRouter);',
    'app.use("/api/shift", shiftRouter);\n  app.use(sourcingRouter);'
  );
  fs.writeFileSync('server.ts', code);
  console.log("Patched server.ts successfully");
} else {
  console.log("server.ts already patched");
}
