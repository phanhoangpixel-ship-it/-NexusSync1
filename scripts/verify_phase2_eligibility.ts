import { client, db } from "../db/index";
import { bootstrapDatabase } from "../db/bootstrap";
import { suppliers, srmRfqs, srmRfqSuppliers, users } from "../db/schema";
import { verifySupplierEligibility } from "../src/services/supplierEligibility.service";
import { eq } from "drizzle-orm";

async function main() {
  console.log("=== Phase 2 — Eligibility Guard (Tích hợp M09) Verification ===");

  await bootstrapDatabase();

  // Create or retrieve a test user
  let [adminUser] = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
  if (!adminUser) {
    [adminUser] = await db.insert(users).values({
      username: "admin",
      passwordHash: "test_hash",
      fullName: "System Admin",
      role: "SUPER_ADMIN"
    } as any).returning();
  }

  // 1. Prepare test suppliers with various qualification & activity statuses
  const testSuppliers = [
    {
      code: "TEST-SUP-ACTIVE",
      name: "Công ty Cổ phần Cơ khí Công nghệ Cao (Đủ điều kiện)",
      status: "ACTIVE",
      compositeScore: 92,
      performanceTier: "Tier A (Chiến lược)"
    },
    {
      code: "TEST-SUP-INACTIVE",
      name: "Xưởng Đúc Kim Loại Ngừng Hoạt Động",
      status: "INACTIVE",
      compositeScore: 70,
      performanceTier: "Tier B (Ưu tiên)"
    },
    {
      code: "TEST-SUP-BLACKLIST",
      name: "Tập đoàn Cung Ứng Gian Lận Hồ Sơ Thầu",
      status: "BLACKLISTED",
      compositeScore: 20,
      performanceTier: "Tier C (Theo dõi)"
    },
    {
      code: "TEST-SUP-BLOCKED",
      name: "Nhà cung cấp Vi phạm An toàn Lao động & Pháp lý",
      status: "BLOCKED",
      compositeScore: 40,
      performanceTier: "Tier C (Theo dõi)"
    },
    {
      code: "TEST-SUP-PENDING",
      name: "Công ty Nhập Khẩu Mới Nộp Hồ Sơ Chưa Thẩm Định",
      status: "PENDING_APPROVAL",
      compositeScore: 75,
      performanceTier: "Tier B (Ưu tiên)"
    },
    {
      code: "TEST-SUP-LOWSCORE",
      name: "Cơ sở Cung Ứng Đánh Giá Thấp Dưới Chuẩn",
      status: "ACTIVE",
      compositeScore: 35,
      performanceTier: "Tier C (Theo dõi)"
    }
  ];

  const createdSuppliers: Record<string, number> = {};

  for (const supData of testSuppliers) {
    // Delete existing if rerun
    await client.execute({
      sql: `DELETE FROM suppliers WHERE code = ?`,
      args: [supData.code]
    });

    const [inserted] = await db.insert(suppliers).values(supData as any).returning();
    createdSuppliers[supData.code] = inserted.id;
  }

  console.log("✓ Created 6 test suppliers with various M09 states:", createdSuppliers);

  // 2. Test verifySupplierEligibility for each supplier
  
  // Case A: ACTIVE + High Score -> ELIGIBLE
  const activeRes = await verifySupplierEligibility(createdSuppliers["TEST-SUP-ACTIVE"]);
  if (!activeRes.eligible || activeRes.code !== "ELIGIBLE") {
    throw new Error(`Expected ACTIVE supplier to be eligible, got: ${JSON.stringify(activeRes)}`);
  }
  console.log("✓ Case 1 PASSED: ACTIVE supplier is ELIGIBLE.");

  // Case B: INACTIVE -> Ineligible with SUPPLIER_INACTIVE
  const inactiveRes = await verifySupplierEligibility(createdSuppliers["TEST-SUP-INACTIVE"]);
  if (inactiveRes.eligible || inactiveRes.code !== "SUPPLIER_INACTIVE") {
    throw new Error(`Expected INACTIVE supplier to be blocked, got: ${JSON.stringify(inactiveRes)}`);
  }
  console.log("✓ Case 2 PASSED: INACTIVE supplier is blocked (SUPPLIER_INACTIVE). Reason:", inactiveRes.message);

  // Case C: BLACKLISTED -> Ineligible with SUPPLIER_BLACKLISTED
  const blacklistRes = await verifySupplierEligibility(createdSuppliers["TEST-SUP-BLACKLIST"]);
  if (blacklistRes.eligible || blacklistRes.code !== "SUPPLIER_BLACKLISTED") {
    throw new Error(`Expected BLACKLISTED supplier to be blocked, got: ${JSON.stringify(blacklistRes)}`);
  }
  console.log("✓ Case 3 PASSED: BLACKLISTED supplier is blocked (SUPPLIER_BLACKLISTED). Reason:", blacklistRes.message);

  // Case D: BLOCKED -> Ineligible with SUPPLIER_BLACKLISTED
  const blockedRes = await verifySupplierEligibility(createdSuppliers["TEST-SUP-BLOCKED"]);
  if (blockedRes.eligible || blockedRes.code !== "SUPPLIER_BLACKLISTED") {
    throw new Error(`Expected BLOCKED supplier to be blocked, got: ${JSON.stringify(blockedRes)}`);
  }
  console.log("✓ Case 4 PASSED: BLOCKED supplier is blocked. Reason:", blockedRes.message);

  // Case E: PENDING_APPROVAL -> Ineligible with SUPPLIER_NOT_QUALIFIED
  const pendingRes = await verifySupplierEligibility(createdSuppliers["TEST-SUP-PENDING"]);
  if (pendingRes.eligible || pendingRes.code !== "SUPPLIER_NOT_QUALIFIED") {
    throw new Error(`Expected PENDING_APPROVAL supplier to be blocked, got: ${JSON.stringify(pendingRes)}`);
  }
  console.log("✓ Case 5 PASSED: PENDING_APPROVAL supplier is blocked (SUPPLIER_NOT_QUALIFIED). Reason:", pendingRes.message);

  // Case F: Low Composite Score (< 50) -> Ineligible with SUPPLIER_NOT_QUALIFIED
  const lowScoreRes = await verifySupplierEligibility(createdSuppliers["TEST-SUP-LOWSCORE"]);
  if (lowScoreRes.eligible || lowScoreRes.code !== "SUPPLIER_NOT_QUALIFIED") {
    throw new Error(`Expected Low Score supplier to be blocked, got: ${JSON.stringify(lowScoreRes)}`);
  }
  console.log("✓ Case 6 PASSED: Low composite score supplier (< 50) is blocked. Reason:", lowScoreRes.message);

  // Case G: Non-existent supplier ID
  const notFoundRes = await verifySupplierEligibility(99999999);
  if (notFoundRes.eligible || notFoundRes.code !== "SUPPLIER_NOT_FOUND") {
    throw new Error(`Expected non-existent supplier to return SUPPLIER_NOT_FOUND`);
  }
  console.log("✓ Case 7 PASSED: Non-existent supplier ID handled gracefully.");

  // Clean up test records
  for (const code of Object.keys(createdSuppliers)) {
    await client.execute({
      sql: `DELETE FROM suppliers WHERE code = ?`,
      args: [code]
    });
  }
  console.log("✓ Cleaned up test suppliers.");

  console.log("=== All Phase 2 Eligibility Guard Tests Succeeded! ===");
}

main().catch(err => {
  console.error("Phase 2 verification failed:", err);
  process.exit(1);
});
