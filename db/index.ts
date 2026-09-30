import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

const dbPath = process.env.DATABASE_URL || "file:nexus_erp.db";

function cleanStaleWalShm() {
  const file = dbPath.replace(/^file:/, '');
  if (file && !file.includes(':memory:')) {
    const fullPath = path.resolve(file);
    ['-wal', '-shm', '-journal'].forEach(ext => {
      const f = fullPath + ext;
      if (fs.existsSync(f)) {
        try { fs.unlinkSync(f); } catch (e) { console.warn("Failed to remove stale file:", f, e); }
      }
    });
  }
}

export let client = createClient({
  url: dbPath,
});

// Configure SQLite WAL mode, synchronous, and robust busy_timeout with auto-heal
(async () => {
  try {
    await client.execute("PRAGMA journal_mode = WAL;");
    await client.execute("PRAGMA busy_timeout = 30000;");
    await client.execute("PRAGMA synchronous = NORMAL;");
  } catch (err: any) {
    if (err?.message?.includes("SQLITE_NOTADB") || err?.code === "SQLITE_NOTADB") {
      console.warn("[Database] Corrupt WAL/SHM detected. Performing automatic recovery...");
      cleanStaleWalShm();
      client = createClient({ url: dbPath });
      try {
        await client.execute("PRAGMA journal_mode = WAL;");
        await client.execute("PRAGMA busy_timeout = 30000;");
        await client.execute("PRAGMA synchronous = NORMAL;");
        db = drizzle(client, { schema });
        console.log("[Database] Automatic database recovery successful.");
      } catch (recoverErr) {
        console.error("[Database] Recovery error:", recoverErr);
      }
    }
  }
})();

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
  Promise.allSettled([
    client.execute("PRAGMA journal_mode = WAL;"),
    client.execute("PRAGMA busy_timeout = 30000;"),
    client.execute("PRAGMA synchronous = NORMAL;"),
  ]).catch(() => {});
  db = drizzle(client, { schema });
  return { client, db };
}

export default db;

