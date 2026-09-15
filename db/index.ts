import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

const dbPath = process.env.DATABASE_URL || "file:nexus_erp.db";

export let client = createClient({
  url: dbPath,
});

export let db = drizzle(client, { schema });

export function recreateDatabaseClient() {
  const file = dbPath.replace(/^file:/, '');
  if (file && !file.includes(':memory:')) {
    const fullPath = path.resolve(file);
    ['', '-wal', '-shm', '-journal'].forEach(ext => {
      const f = fullPath + ext;
      if (fs.existsSync(f)) {
        try { fs.unlinkSync(f); } catch (e) { console.error("Failed to delete corrupt file:", f, e); }
      }
    });
  }
  client = createClient({ url: dbPath });
  db = drizzle(client, { schema });
  return { client, db };
}

export default db;

