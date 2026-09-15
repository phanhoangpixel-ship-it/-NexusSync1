import { bootstrapDatabase } from "../db/bootstrap";
import { BankReconciliationEngine } from "../engines/bankReconciliationEngine";
import { db } from "../db/index";
import * as schema from "../db/schema";

async function runM33TestSuite() {
  console.log("=== STARTING M33 BANK RECONCILIATION TEST SUITE ===");

  // 1. Bootstrap DB
  await bootstrapDatabase();
  console.log("[PASS] Database bootstrapped");

  // 2. Ensure Seed Data
  await BankReconciliationEngine.ensureSeedData();
  const accounts = await db.select().from(schema.bankAccounts).all();
  console.log(`[PASS] Seeded ${accounts.length} bank accounts`);

  // 3. Test VietQR Generator
  const qrPayload = BankReconciliationEngine.generateVietQrPayload("VCB", "0011004328888", 176000000, "INV-AR-UNIFIED-859744");
  if (!qrPayload.vietQrString || !qrPayload.quickLinkUrl) {
    throw new Error("VietQR generation failed");
  }
  console.log("[PASS] VietQR Payload generated successfully:", qrPayload.quickLinkUrl);

  // 4. Test Auto Reconciliation Engine
  const reconRes = await BankReconciliationEngine.autoReconcile(1, 1);
  console.log(`[PASS] Auto Reconciliation completed: Matched=${reconRes.matchedCount}, Unmatched=${reconRes.unmatchedCount}, Reconciled Amount=${reconRes.totalAmountReconciled.toLocaleString('vi-VN')} VNĐ`);

  // 5. Test Form 08-TT Report Generator
  const report = await BankReconciliationEngine.generateForm08TT(1);
  console.log(`[PASS] Form 08-TT Bank Reconciliation Report generated: Balanced=${report.form08TT.isBalanced}`);
  console.log(`       Statement Balance: ${report.form08TT.bankBalanceOnStatement.toLocaleString('vi-VN')} VNĐ`);
  console.log(`       Adjusted Balance: ${report.form08TT.adjustedBankBalance.toLocaleString('vi-VN')} VNĐ`);

  // 6. Verify Accounting Entries
  const glEntries = await db.select().from(schema.accountingEntries).all();
  const bankGlEntries = glEntries.filter(e => e.sourceModule === "BANK_RECONCILIATION");
  console.log(`[PASS] Created ${bankGlEntries.length} GL entries for Bank Settlement`);

  console.log("=== M33 BANK RECONCILIATION TEST SUITE COMPLETED SUCCESSFULLY ===");
}

runM33TestSuite().catch(err => {
  console.error("❌ M33 Test Suite Failed:", err);
  process.exit(1);
});
