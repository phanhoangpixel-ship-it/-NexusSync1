import { client, db } from "../db/index";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";

async function backfillM29() {
  console.log("Starting backfill for M29 DMS...");
  
  // Ensure table column exists in SQLite
  try {
    await client.execute("ALTER TABLE dms_documents ADD COLUMN file_content_base64 TEXT");
    console.log("Added column file_content_base64 to dms_documents table.");
  } catch (e: any) {
    // Column might already exist
  }

  const docs = await db.select().from(schema.dmsDocuments).all();
  console.log(`Found ${docs.length} documents to process.`);

  for (const doc of docs) {
    let entityType = doc.entityType;
    if (!entityType) {
      const mod = doc.linkedModule?.toUpperCase() || "";
      if (mod.includes("M31") || mod.includes("INVOICE")) entityType = "M31_INVOICE";
      else if (mod.includes("M30") || mod.includes("GL") || mod.includes("LEDGER")) entityType = "M30_LEDGER";
      else if (mod.includes("M08") || mod.includes("PO") || mod.includes("PURCHASE")) entityType = "M08_PO";
      else if (mod.includes("M13") || mod.includes("ORDER") || mod.includes("SALES")) entityType = "M13_ORDER";
      else if (mod.includes("M19") || mod.includes("M20") || mod.includes("M21") || mod.includes("STOCK")) entityType = "M17_STOCK";
      else if (mod.includes("M06") || mod.includes("RD")) entityType = "M06_RD_DOSSIER";
      else if (mod.includes("M35") || mod.includes("PROJECT")) entityType = "M35_PROJECT";
    }
    
    await db.update(schema.dmsDocuments)
      .set({
        entityType: entityType || doc.entityType || "DMS_GENERAL",
        entityId: doc.refDocNo || doc.entityId || doc.docCode,
        classification: doc.securityLevel || doc.classification || "INTERNAL",
        legalHold: doc.legalHold ? true : false,
        hashScope: doc.hashScope || "FILE_CONTENT",
        version: doc.version || "v1.0",
        retentionYears: doc.retentionYears || 5,
      } as any)
      .where(eq(schema.dmsDocuments.id, doc.id));
  }

  // Seed default retention policies if empty
  const policies = await db.select().from(schema.retentionPolicies).all();
  if (policies.length === 0) {
    console.log("Seeding default retention policies...");
    await db.insert(schema.retentionPolicies).values([
      { name: "Standard 5-Year", category: "GENERAL", retentionYears: 5, isDefault: true, description: "Standard business document retention (ISO 9001)" },
      { name: "Statutory 10-Year (VAS)", category: "FINANCIAL", retentionYears: 10, isDefault: false, description: "Legal financial & tax record retention (Luật Kế toán VN)" },
      { name: "Permanent Corporate Archive", category: "LEGAL", retentionYears: 99, isDefault: false, description: "Permanent corporate charter, patents and R&D licenses" },
    ]);
  }

  console.log("Backfill M29 completed successfully.");
}

backfillM29().catch(console.error);
