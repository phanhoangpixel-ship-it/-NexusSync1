import { ensureSchemaSynchronized, bootstrapDatabase } from "../db/bootstrap";

async function main() {
  console.log("Synchronizing database schema...");
  await bootstrapDatabase();
  console.log("Schema synchronized.");
}

main().catch(console.error);
