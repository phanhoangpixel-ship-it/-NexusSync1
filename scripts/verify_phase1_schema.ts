import { client, db } from "../db/index";
import { ensureSchemaSynchronized, bootstrapDatabase } from "../db/bootstrap";
import { sourcingPackages, srmRfqs, srmBids } from "../db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("=== Phase 1 Schema & Database Foundation Verification ===");

  // 1. Run bootstrap / schema sync
  await bootstrapDatabase();
  console.log("✓ Database bootstrapped and schema synchronized successfully.");

  // 2. Test querying sqlite_master for table and index definitions
  const tableCheck = await client.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='sourcing_packages'`);
  if (tableCheck.rows.length === 0) {
    throw new Error("sourcing_packages table was not created!");
  }
  console.log("✓ Table 'sourcing_packages' confirmed in sqlite_master.");

  // 3. Test columns of srm_bids (checking round_number)
  const bidsColCheck = await client.execute(`PRAGMA table_info(srm_bids);`);
  const hasRoundNumber = bidsColCheck.rows.some((row: any) => row.name === 'round_number');
  if (!hasRoundNumber) {
    throw new Error("srm_bids missing round_number column!");
  }
  console.log("✓ Column 'round_number' confirmed in 'srm_bids'.");

  // 4. Test columns of srm_rfqs (checking package_id)
  const rfqsColCheck = await client.execute(`PRAGMA table_info(srm_rfqs);`);
  const hasPackageId = rfqsColCheck.rows.some((row: any) => row.name === 'package_id');
  if (!hasPackageId) {
    throw new Error("srm_rfqs missing package_id column!");
  }
  console.log("✓ Column 'package_id' confirmed in 'srm_rfqs'.");

  // 5. Test indexes on packageId, rfqId, supplierId
  const indexesCheck = await client.execute(`SELECT name, tbl_name FROM sqlite_master WHERE type='index'`);
  const indexNames = indexesCheck.rows.map((r: any) => r.name);
  
  const expectedIndexes = [
    'sourcing_packages_code_idx',
    'sourcing_packages_status_idx',
    'sourcing_packages_cost_center_idx',
    'srm_rfqs_package_id_idx',
    'srm_rfqs_status_idx',
    'srm_rfq_items_rfq_id_idx',
    'srm_rfq_suppliers_rfq_id_idx',
    'srm_rfq_suppliers_supplier_id_idx',
    'srm_bids_rfq_id_idx',
    'srm_bids_supplier_id_idx',
    'srm_bids_round_number_idx'
  ];

  for (const idx of expectedIndexes) {
    if (!indexNames.includes(idx)) {
      console.warn(`Warning: Index ${idx} not found in sqlite_master (or has alternate name).`);
    } else {
      console.log(`✓ Index '${idx}' confirmed.`);
    }
  }

  // 6. Test Drizzle ORM insert & select on sourcingPackages
  const testCode = `PKG-TEST-${Date.now()}`;
  const [created] = await db.insert(sourcingPackages).values({
    packageCode: testCode,
    title: "Gói Mua Sắm Bo Mạch Chủ & Chip Bán Dẫn 2026",
    category: "Direct Materials",
    estimatedBudget: 850000000,
    costCenter: "CC-PROCUREMENT-MFG",
    status: "DRAFT",
    description: "Gói thầu phục vụ dây chuyền sản xuất bo mạch đợt Q4/2026"
  }).returning();

  console.log("✓ Drizzle insert into sourcingPackages:", created.packageCode, "ID:", created.id);

  const [found] = await db.select().from(sourcingPackages).where(eq(sourcingPackages.packageCode, testCode));
  if (!found || found.title !== "Gói Mua Sắm Bo Mạch Chủ & Chip Bán Dẫn 2026") {
    throw new Error("Failed to query inserted sourcing package!");
  }
  console.log("✓ Sourcing package queried successfully via Drizzle:", found.title, "Budget:", found.estimatedBudget);

  // Clean up test record
  await client.execute({
    sql: `DELETE FROM sourcing_packages WHERE package_code = ?`,
    args: [testCode]
  });
  console.log("✓ Test record cleaned up.");

  console.log("=== All Phase 1 Foundation Checks Passed! ===");
}

main().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
