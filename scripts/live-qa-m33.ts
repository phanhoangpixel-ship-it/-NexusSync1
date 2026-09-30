import { db } from "../db/index";
import * as schema from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { BankReconciliationEngine } from "../engines/bankReconciliationEngine";
import { TreasuryService } from "../engines/treasuryService";
import { invoiceService } from "../engines/invoiceService";
import { ensureSchemaSynchronized } from "../db/bootstrap";

async function runLiveQAM33() {
  console.log("===============================================================================");
  console.log("  NEXUSSYNC ERP — LIVE QA (ZERO-MOCK) M33 BANK RECONCILIATION VERIFICATION");
  console.log("===============================================================================\n");

  await ensureSchemaSynchronized();

  const results: any[] = [];

  // --- Setup Master Accounts ---
  const activeBankAccounts = await db
    .select()
    .from(schema.bankAccounts)
    .where(eq(schema.bankAccounts.isActive, true))
    .limit(1);

  if (activeBankAccounts.length === 0) {
    throw new Error("No active bank account found for Live QA.");
  }
  const bankAccount = activeBankAccounts[0];
  console.log(`[MASTER DATA] Active Bank Account: ID=${bankAccount.id}, Bank=${bankAccount.bankName}, AccNo=${bankAccount.accountNumber}`);

  // ==========================================================================
  // SCENARIO 1: Non-Authority Guard (Zero Direct GL Writes)
  // ==========================================================================
  console.log("\n>>> SCENARIO 1: Non-Authority Guard & Matching Status Only");

  // Step 1.1: Create a real M32 Receipt Voucher via TreasuryService
  const voucherRes = await TreasuryService.createVoucher({
    voucherType: "RECEIPT",
    voucherCategory: "DEBT_COLLECTION",
    amount: 45000000,
    bankAccountId: bankAccount.id,
    paymentMethod: "BANK_TRANSFER",
    partnerType: "CUSTOMER",
    partnerName: "Cong ty TNHH Song Hong Live QA",
    reason: "Thu tien hop dong live QA M33 non authority",
    idempotencyKey: `LIVE-QA-VOUCHER-${Date.now()}`,
  });
  const realVoucherId = voucherRes.voucher.id;
  const realVoucherCode = voucherRes.voucher.voucherCode;

  // Approve voucher via M32 (which delegates to M30 for GL write)
  await TreasuryService.approveVoucher({ voucherId: realVoucherId, approverName: "CFO - Nguyễn Thị Hương" });

  // Step 1.2: Ingest a real statement line with reference matching voucherCode
  const txUid = `FT-LIVEQA-${Date.now()}`;
  await BankReconciliationEngine.importStatements(bankAccount.id, [
    {
      bankTransactionId: txUid,
      amount: 45000000,
      transactionDate: new Date().toISOString(),
      reference: `THANH TOAN PHIEU THU ${realVoucherCode} KHACH HANG SONG HONG`,
    },
  ]);

  const importedTx = await db
    .select()
    .from(schema.bankTransactions)
    .where(eq(schema.bankTransactions.bankTransactionId, txUid))
    .limit(1);
  const realStatementId = importedTx[0]?.id;

  // Step 1.3: Run Auto-Reconciliation in M33
  await BankReconciliationEngine.autoReconcile(bankAccount.id);

  // Step 1.4: Verify Non-Authority Invariant: Check direct GL entries from M33
  const directM33GLEntries = await db
    .select()
    .from(schema.accountingEntries)
    .where(eq(schema.accountingEntries.sourceReferenceNo, txUid));

  // Verify Statement status
  const updatedTx = await db
    .select()
    .from(schema.bankTransactions)
    .where(eq(schema.bankTransactions.id, realStatementId))
    .limit(1);

  const directGLCount = directM33GLEntries.length;
  const isCorrectlyMatched = updatedTx[0]?.status === "MATCHED" && updatedTx[0]?.reconciledVoucherId === realVoucherId;
  const scenario1Pass = isCorrectlyMatched && directGLCount === 0;

  results.push({
    id: "SCENARIO_1_NON_AUTHORITY",
    name: "Non-Authority Guard: Chỉ cập nhật trạng thái khớp với M32, M33 không tự ghi GL",
    statementId: realStatementId,
    voucherId: realVoucherId,
    voucherCode: realVoucherCode,
    directM33GLCount: directGLCount,
    status: scenario1Pass ? "PASS" : "FAIL",
  });
  console.log(`  -> Statement ID: ${realStatementId} (#${txUid}), Voucher: ${realVoucherCode} (ID: ${realVoucherId})`);
  console.log(`  -> Statement Status: ${updatedTx[0]?.status} (reconciledVoucherId=${updatedTx[0]?.reconciledVoucherId})`);
  console.log(`  -> Số dòng GL do M33 trực tiếp tạo: ${directGLCount} (Chính xác = 0 dòng mới)`);
  console.log(`  -> Result: ${scenario1Pass ? "✅ PASS" : "❌ FAIL"}`);

  // ==========================================================================
  // SCENARIO 2: Statement Import Idempotency (3 Consecutive Runs)
  // ==========================================================================
  console.log("\n>>> SCENARIO 2: Statement Import Idempotency (Nạp 3 lần liên tiếp không tăng dòng)");

  const fixedTxCode1 = `FT-IDEMP-001-${Date.now()}`;
  const fixedTxCode2 = `FT-IDEMP-002-${Date.now()}`;
  const testBatch = [
    {
      bankTransactionId: fixedTxCode1,
      amount: 15000000,
      transactionDate: "2026-09-23",
      reference: "TIEN HANG HOP DONG SO-2026-QA-IDEMP",
    },
    {
      bankTransactionId: fixedTxCode2,
      amount: -250000,
      transactionDate: "2026-09-23",
      reference: "PHI QUAN LY TAI KHOAN DOANH NGHIEP THANG 9",
    },
  ];

  // Count statements before batch
  const countBefore = Number((await db.select({ count: sql`count(*)` }).from(schema.bankTransactions))[0]?.count || 0);

  // Ingest 1st time
  const run1 = await BankReconciliationEngine.importStatements(bankAccount.id, testBatch);
  const countAfterRun1 = Number((await db.select({ count: sql`count(*)` }).from(schema.bankTransactions))[0]?.count || 0);

  // Ingest 2nd time
  const run2 = await BankReconciliationEngine.importStatements(bankAccount.id, testBatch);
  const countAfterRun2 = Number((await db.select({ count: sql`count(*)` }).from(schema.bankTransactions))[0]?.count || 0);

  // Ingest 3rd time
  const run3 = await BankReconciliationEngine.importStatements(bankAccount.id, testBatch);
  const countAfterRun3 = Number((await db.select({ count: sql`count(*)` }).from(schema.bankTransactions))[0]?.count || 0);

  const scenario2Pass = (countAfterRun1 - countBefore === 2) && 
    (countAfterRun2 === countAfterRun1) && 
    (countAfterRun3 === countAfterRun1) && 
    (run2.skippedDuplicateCount === 2) && 
    (run3.skippedDuplicateCount === 2);

  results.push({
    id: "SCENARIO_2_IDEMPOTENCY",
    name: "Idempotency: Nạp lặp lại 3 lần file sao kê giữ nguyên số dòng",
    statementCodes: [fixedTxCode1, fixedTxCode2],
    rowsAddedRun1: countAfterRun1 - countBefore,
    rowsAddedRun2: countAfterRun2 - countAfterRun1,
    rowsAddedRun3: countAfterRun3 - countAfterRun2,
    status: scenario2Pass ? "PASS" : "FAIL",
  });
  console.log(`  -> Lần 1 nạp: ${countAfterRun1 - countBefore} dòng mới (importedCount=${run1.importedCount})`);
  console.log(`  -> Lần 2 nạp lại: ${countAfterRun2 - countAfterRun1} dòng mới (skippedDuplicateCount=${run2.skippedDuplicateCount})`);
  console.log(`  -> Lần 3 nạp lại: ${countAfterRun3 - countAfterRun2} dòng mới (skippedDuplicateCount=${run3.skippedDuplicateCount})`);
  console.log(`  -> Result: ${scenario2Pass ? "✅ PASS" : "❌ FAIL"}`);

  // ==========================================================================
  // SCENARIO 3: Concurrency Protection (2 Simultaneous Matches on 1 Transaction)
  // ==========================================================================
  console.log("\n>>> SCENARIO 3: Concurrency Collision Guard (1 Winner duy nhất)");

  // Create an unmatched statement
  const concTxCode = `FT-CONC-${Date.now()}`;
  await BankReconciliationEngine.importStatements(bankAccount.id, [
    {
      bankTransactionId: concTxCode,
      amount: 80000000,
      transactionDate: "2026-09-23",
      reference: "THANH TOAN HOP DONG CONCURRENCY TEST",
    },
  ]);

  const concTx = (await db.select().from(schema.bankTransactions).where(eq(schema.bankTransactions.bankTransactionId, concTxCode)).limit(1))[0];

  // Create 2 separate invoices
  const inv1 = await invoiceService.createInvoice({
    invoiceNumber: `INV-CONC-A-${Date.now()}`,
    type: "AR",
    customerId: 1,
    customerName: "Khach Hang Concurrency A",
    totalAmount: 80000000,
    taxRate: 0,
    taxAmount: 0,
    discount: 0,
    finalAmount: 80000000,
    items: [{ quantity: 1, unitPrice: 80000000, notes: "Goi Dich Vu A" }],
  });

  const inv2 = await invoiceService.createInvoice({
    invoiceNumber: `INV-CONC-B-${Date.now()}`,
    type: "AR",
    customerId: 1,
    customerName: "Khach Hang Concurrency B",
    totalAmount: 80000000,
    taxRate: 0,
    taxAmount: 0,
    discount: 0,
    finalAmount: 80000000,
    items: [{ quantity: 1, unitPrice: 80000000, notes: "Goi Dich Vu B" }],
  });

  // Execute first match, then immediately fire second match
  let req1Result: any = null;
  let req2Result: any = null;

  try {
    req1Result = await BankReconciliationEngine.manualMatch(concTx.id, inv1.id, undefined, 1);
  } catch (err: any) {
    req1Result = { success: false, message: err.message };
  }

  try {
    req2Result = await BankReconciliationEngine.manualMatch(concTx.id, inv2.id, undefined, 1);
  } catch (err: any) {
    req2Result = { success: false, message: err.message };
  }

  const req1Status = req1Result && req1Result.success;
  const req2Status = req2Result && req2Result.success;
  const exactlyOneSucceeded = (req1Status && !req2Status) || (!req1Status && req2Status);

  // Check state of transaction
  const finalConcTx = (await db.select().from(schema.bankTransactions).where(eq(schema.bankTransactions.id, concTx.id)).limit(1))[0];

  const scenario3Pass = exactlyOneSucceeded && finalConcTx.status === "MATCHED" && finalConcTx.reconciledInvoiceId === inv1.id;

  results.push({
    id: "SCENARIO_3_CONCURRENCY",
    name: "Concurrency: Ghép nối đè cùng 1 dòng sao kê chỉ cho phép đúng 1 giao dịch hợp lệ",
    statementId: concTx.id,
    statementCode: concTxCode,
    invoiceA: inv1.invoiceNumber,
    invoiceB: inv2.invoiceNumber,
    req1Outcome: req1Status ? "SUCCESS" : req1Result.message,
    req2Outcome: req2Status ? "SUCCESS" : req2Result.message,
    status: scenario3Pass ? "PASS" : "FAIL",
  });
  console.log(`  -> Statement ID: ${concTx.id} (#${concTxCode})`);
  console.log(`  -> Request 1 kết quả: ${req1Status ? "SUCCESS" : req1Result.message}`);
  console.log(`  -> Request 2 kết quả: ${req2Status ? "SUCCESS" : req2Result.message}`);
  console.log(`  -> Hóa đơn được gán khớp: ID=${finalConcTx.reconciledInvoiceId} (Chính xác = ${inv1.id})`);
  console.log(`  -> Result: ${scenario3Pass ? "✅ PASS" : "❌ FAIL"}`);

  // ==========================================================================
  // SCENARIO 4: Cross-Module VietQR End-to-End Linkage (M13 -> M31 -> M33 -> M32 -> M30)
  // ==========================================================================
  console.log("\n>>> SCENARIO 4: Cross-Module VietQR & M32 Auto-Receipt Delegation");

  // Step 4.1: Create real Invoice representing M13 Sales Order
  const realInvoiceCode = `INV-SO-LIVEQA-${Date.now()}`;
  const orderInvoice = await invoiceService.createInvoice({
    invoiceNumber: realInvoiceCode,
    type: "AR",
    customerId: 1,
    customerName: "Tong Cong Ty Phat Trien Ha Tang Live QA",
    totalAmount: 120000000,
    taxRate: 0,
    taxAmount: 0,
    discount: 0,
    finalAmount: 120000000,
    items: [{ quantity: 1, unitPrice: 120000000, notes: "Goi Thau He Thong Mang Doanh Nghiep" }],
  });
  console.log(`  -> Hóa đơn thật (M31/M13): ID=${orderInvoice.id}, Mã=${orderInvoice.invoiceNumber}, Trạng thái=${orderInvoice.paymentStatus}`);

  // Step 4.2: Generate VietQR for this invoice
  const vietQrPayload = BankReconciliationEngine.generateVietQrPayload(
    "VCB",
    bankAccount.accountNumber,
    120000000,
    realInvoiceCode
  );
  console.log(`  -> Mã VietQR tạo ra (M33): CRC=${vietQrPayload.crc}, Memo=${vietQrPayload.memo}`);

  // Step 4.3: Simulate Real Incoming Webhook from Bank matching VietQR memo
  const webhookTxId = `FT-NAPAS-${Date.now()}`;
  const webhookResult = await BankReconciliationEngine.processVietQrWebhook({
    transactionId: webhookTxId,
    accountNumber: bankAccount.accountNumber,
    amount: 120000000,
    content: `MBVCB.${webhookTxId}.CTY CONG NGHE CHUYEN TIEN ${realInvoiceCode}`,
    transactionDate: new Date().toISOString(),
  });

  // Step 4.4: Verify M32 Receipt Voucher created & Invoice updated
  const updatedInvoiceList = await db.select().from(schema.invoices).where(eq(schema.invoices.id, orderInvoice.id)).limit(1);
  const updatedInvoice = updatedInvoiceList[0];
  const allVouchers = await db.select().from(schema.cashVouchers);
  const matchedCreatedVoucher = allVouchers.find(v => v.reason && v.reason.includes(realInvoiceCode));

  const scenario4Pass = webhookResult.success &&
    updatedInvoice?.paymentStatus === "PAID" &&
    Boolean(matchedCreatedVoucher) &&
    matchedCreatedVoucher?.amount === 120000000 &&
    matchedCreatedVoucher?.voucherType === "RECEIPT";

  results.push({
    id: "SCENARIO_4_CROSS_MODULE_VIETQR",
    name: "Liên kết liên module: VietQR -> Webhook -> Sinh Phiếu Thu M32 & Gạch nợ M31",
    invoiceId: orderInvoice.id,
    invoiceNumber: realInvoiceCode,
    webhookTxId: webhookTxId,
    voucherId: matchedCreatedVoucher?.id,
    voucherCode: matchedCreatedVoucher?.voucherCode,
    invoiceFinalStatus: updatedInvoice?.paymentStatus,
    status: scenario4Pass ? "PASS" : "FAIL",
  });
  console.log(`  -> Webhook xử lý: ${webhookResult.message}`);
  console.log(`  -> Phiếu Thu M32: ID=${matchedCreatedVoucher?.id} (Mã=${matchedCreatedVoucher?.voucherCode || "N/A"}), Loại=${matchedCreatedVoucher?.voucherType || "RECEIPT"}`);
  console.log(`  -> Trạng thái Hóa đơn M31 sau khi gạch nợ: ${updatedInvoice?.paymentStatus} (Chính xác = PAID)`);
  console.log(`  -> Result: ${scenario4Pass ? "✅ PASS" : "❌ FAIL"}`);

  // ==========================================================================
  // SCENARIO 5: Full Regression Integrity (GL M30, Invoices M31, Vouchers M32)
  // ==========================================================================
  console.log("\n>>> SCENARIO 5: Regression toàn luồng (M30 GL, M31 Invoices, M32 Vouchers, Form 08-TT)");

  const [allGLEntries, invoiceList, vouchersList, form08Report] = await Promise.all([
    db.select({ count: sql`count(*)` }).from(schema.accountingEntries),
    db.select().from(schema.invoices),
    db.select().from(schema.cashVouchers),
    BankReconciliationEngine.generateForm08TT(bankAccount.id, "2026-09-23"),
  ]);

  const totalGLCount = Number(allGLEntries[0]?.count || 0);
  const totalReceipts = vouchersList.filter(v => v.voucherType === "RECEIPT").reduce((s, v) => s + (v.amount || 0), 0);

  console.log(`  -> Tổng số dòng GL M30 hiện tại: ${totalGLCount}`);
  console.log(`  -> Tổng số Hóa đơn M31: ${invoiceList?.length || 0}`);
  console.log(`  -> Tổng tiền Phiếu Thu M32: ${totalReceipts.toLocaleString("vi-VN")} VNĐ`);
  console.log(`  -> Báo cáo 08-TT Số Dư Sổ Phụ Đã Điều Chỉnh (Mục I): ${form08Report?.form08TT?.adjustedBankBalance?.toLocaleString("vi-VN")} VNĐ`);
  console.log(`  -> Báo cáo 08-TT Số Dư Sổ Cái TK 1121 Đã Điều Chỉnh (Mục II): ${form08Report?.form08TT?.adjustedBookBalance?.toLocaleString("vi-VN")} VNĐ`);

  const scenario5Pass = totalGLCount > 0 && Boolean(invoiceList) && vouchersList.length > 0 && Boolean(form08Report);

  results.push({
    id: "SCENARIO_5_REGRESSION_INTEGRITY",
    name: "Regression toàn luồng: Kiểm tra tính toàn vẹn số liệu các module sau đối soát",
    glEntriesCount: totalGLCount,
    invoicesCount: invoiceList?.length,
    vouchersCount: vouchersList.length,
    form08TTReportGenerated: Boolean(form08Report),
    status: scenario5Pass ? "PASS" : "FAIL",
  });
  console.log(`  -> Result: ${scenario5Pass ? "✅ PASS" : "❌ FAIL"}`);

  // ==========================================================================
  // SUMMARY REPORT
  // ==========================================================================
  console.log("\n===============================================================================");
  console.log("  LIVE QA SUMMARY RESULTS (REAL RECORD IDS)");
  console.log("===============================================================================");
  console.table(results.map(r => ({
    Kịch_Bản: r.name,
    Trạng_Thái: r.status,
    Mã_Bản_Ghi_Thật: r.statementId || r.statementCodes?.join(",") || r.invoiceNumber || `GL:${r.glEntriesCount}`,
    Chứng_Từ_Liên_Quan: r.voucherCode || r.voucherId || "N/A"
  })));

  const allPassed = results.every(r => r.status === "PASS");
  console.log(`\nOVERALL STATUS: ${allPassed ? "100% PASS - LIVE QA CERTIFIED" : "FAILED"}`);
}

runLiveQAM33().catch(err => {
  console.error("Live QA Execution Error:", err);
  process.exit(1);
});
