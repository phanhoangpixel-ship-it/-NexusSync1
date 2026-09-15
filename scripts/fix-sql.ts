import fs from "fs";

let content = fs.readFileSync("db/schema.ts", "utf-8");
if (!content.includes('import { sql } from "drizzle-orm";')) {
  content = 'import { sql } from "drizzle-orm";\n' + content;
  fs.writeFileSync("db/schema.ts", content);
}
