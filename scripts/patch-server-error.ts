import fs from "fs";

let content = fs.readFileSync("server.ts", "utf-8");

const errorHandler = `
  // --- GLOBAL ERROR HANDLER ---
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Global Error Handler]', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  // --- VITE / STATIC SERVING ---`;

if (!content.includes('GLOBAL ERROR HANDLER')) {
  content = content.replace('  // --- VITE / STATIC SERVING ---', errorHandler);
  fs.writeFileSync("server.ts", content);
  console.log("Global Error Handler added to server.ts");
}
