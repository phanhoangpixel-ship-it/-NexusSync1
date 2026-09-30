import { Router } from "express";
import { db } from "../../db/index";
import * as schema from "../../db/schema";
import { BankReconciliationEngine } from "../../engines/bankReconciliationEngine";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

// GET /api/bank/accounts - Danh sách tài khoản ngân hàng doanh nghiệp
router.get("/api/bank/accounts", async (req, res) => {
  try {
    await BankReconciliationEngine.ensureSeedData();
    const accounts = await db.select().from(schema.bankAccounts).all();
    res.json(accounts);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi truy vấn tài khoản ngân hàng' });
  }
});

// POST /api/bank/accounts - Đăng ký tài khoản ngân hàng mới
router.post("/api/bank/accounts", async (req, res) => {
  try {
    const { bankName, accountNumber, accountName, currency, accountType, bankBranch, swiftCode } = req.body;
    if (!bankName || !accountNumber) {
      return res.status(400).json({ error: "Tên ngân hàng và số tài khoản là bắt buộc" });
    }

    const inserted = await db.insert(schema.bankAccounts).values({
      bankName,
      accountNumber,
      accountName: accountName || "CÔNG TY CP NEXUSSYNC ERP",
      currency: currency || "VND",
      accountType: accountType || "CHECKING",
      bankBranch: bankBranch || null,
      swiftCode: swiftCode || null,
      bookBalance: 0,
      bankBalance: 0,
      isActive: true,
    }).returning().all();

    res.json({
      success: true,
      message: `Đã đăng ký tài khoản ngân hàng ${bankName} (${accountNumber}) thành công.`,
      account: inserted[0],
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi đăng ký tài khoản ngân hàng' });
  }
});

// GET /api/bank/statements - Lấy danh sách giao dịch sao kê sổ phụ
router.get("/api/bank/statements", async (req, res) => {
  try {
    await BankReconciliationEngine.ensureSeedData();
    const bankAccountId = req.query.bankAccountId ? Number(req.query.bankAccountId) : undefined;
    
    if (bankAccountId) {
      const statements = await db
        .select()
        .from(schema.bankTransactions)
        .where(eq(schema.bankTransactions.bankAccountId, bankAccountId))
        .orderBy(desc(schema.bankTransactions.id))
        .all();
      return res.json(statements);
    }
    const statements = await db
      .select()
      .from(schema.bankTransactions)
      .orderBy(desc(schema.bankTransactions.id))
      .all();
    res.json(statements);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi truy vấn sao kê ngân hàng' });
  }
});

// GET /api/bank/unmatched - Sổ chênh lệch và các khoản chưa đối soát
router.get("/api/bank/unmatched", async (req, res) => {
  try {
    await BankReconciliationEngine.ensureSeedData();
    const bankAccountId = req.query.bankAccountId ? Number(req.query.bankAccountId) : undefined;

    let unmatchedList = await db
      .select()
      .from(schema.bankTransactions)
      .where(eq(schema.bankTransactions.status, "UNMATCHED"))
      .orderBy(desc(schema.bankTransactions.transactionDate))
      .all();

    if (bankAccountId) {
      unmatchedList = unmatchedList.filter(t => t.bankAccountId === bankAccountId);
    }

    const unmatchedCredits = unmatchedList.filter(t => t.amount > 0);
    const unmatchedDebits = unmatchedList.filter(t => t.amount < 0);
    const totalCreditAmt = unmatchedCredits.reduce((acc, t) => acc + t.amount, 0);
    const totalDebitAmt = unmatchedDebits.reduce((acc, t) => acc + Math.abs(t.amount), 0);

    res.json({
      success: true,
      totalUnmatched: unmatchedList.length,
      unmatchedCreditsCount: unmatchedCredits.length,
      unmatchedDebitsCount: unmatchedDebits.length,
      totalCreditAmount: totalCreditAmt,
      totalDebitAmount: totalDebitAmt,
      transactions: unmatchedList,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi truy vấn sổ chênh lệch' });
  }
});

// POST /api/bank/statements/import - Nạp file sao kê điện tử Idempotent (CSV, MT940, JSON)
router.post("/api/bank/statements/import", async (req, res) => {
  try {
    const { bankAccountId, transactions, fileContent, fileFormat, importChecksum } = req.body;
    const accId = Number(bankAccountId) || 1;
    let parsedItems = Array.isArray(transactions) ? transactions : [];

    if ((!parsedItems || parsedItems.length === 0) && fileContent) {
      parsedItems = BankReconciliationEngine.parseStatementFile(fileContent, fileFormat || 'CSV');
    }

    if (!parsedItems || parsedItems.length === 0) {
      return res.status(400).json({ error: "Không tìm thấy dữ liệu giao dịch nào để nạp" });
    }

    const result = await BankReconciliationEngine.importStatements(accId, parsedItems, importChecksum, 1);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Lỗi nạp sao kê ngân hàng" });
  }
});

// POST /api/bank/statements/auto-reconcile - Chạy động cơ đối soát đa tầng tự động
router.post("/api/bank/statements/auto-reconcile", async (req, res) => {
  try {
    const bankAccountId = req.body.bankAccountId ? Number(req.body.bankAccountId) : undefined;
    const result = await BankReconciliationEngine.autoReconcile(bankAccountId, 1);
    res.json({
      success: true,
      message: `Đã chạy đối soát tự động: Khớp thành công ${result.matchedCount} giao dịch (${result.totalAmountReconciled.toLocaleString('vi-VN')} VNĐ). ${result.unmatchedCount} giao dịch chưa khớp.`,
      result,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Lỗi chạy động cơ đối soát" });
  }
});

// POST /api/bank/statements/manual-match - Ghi đè khớp thủ công với Hóa đơn / Phiếu Thu-Chi
router.post("/api/bank/statements/manual-match", async (req, res) => {
  try {
    const { transactionId, invoiceId, voucherId } = req.body;
    const result = await BankReconciliationEngine.manualMatch(Number(transactionId), invoiceId ? Number(invoiceId) : undefined, voucherId ? Number(voucherId) : undefined, 1);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "Lỗi đối soát thủ công" });
  }
});

// POST /api/bank/statements/unmatch - Hủy đối soát dòng sao kê
router.post("/api/bank/statements/unmatch", async (req, res) => {
  try {
    const { transactionId } = req.body;
    const result = await BankReconciliationEngine.unmatch(Number(transactionId), 1);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "Lỗi hủy đối soát" });
  }
});

// POST /api/bank/vietqr/generate - Khởi tạo mã VietQR NAPAS 247 động
router.post("/api/bank/vietqr/generate", async (req, res) => {
  try {
    const { bankCode, accountNumber, amount, memo } = req.body;
    const payload = BankReconciliationEngine.generateVietQrPayload(
      bankCode || "VCB",
      accountNumber || "0011004328888",
      Number(amount) || 100000,
      memo || "PAY-INV-2026"
    );
    res.json({ success: true, payload });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Lỗi khởi tạo VietQR" });
  }
});

// POST /api/bank/webhook/vietqr - Tiếp nhận Webhook thanh toán VietQR và tự động lập Phiếu Thu M32
router.post("/api/bank/webhook/vietqr", async (req, res) => {
  try {
    const { transactionId, amount, accountNumber, content, transactionDate, gatewaySignature } = req.body;
    if (!transactionId || !amount) {
      return res.status(400).json({ error: "Thiếu thông tin transactionId hoặc amount trong payload webhook" });
    }

    const result = await BankReconciliationEngine.processVietQrWebhook({
      transactionId: String(transactionId),
      amount: Number(amount),
      accountNumber: String(accountNumber || "0011004328888"),
      content: String(content || "Thanh toan qua VietQR"),
      transactionDate,
      gatewaySignature,
    }, 1);

    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Lỗi xử lý Webhook VietQR" });
  }
});

// GET /api/bank/reconciliation-report - Báo cáo đối soát Mẫu 08-TT BTC
router.get("/api/bank/reconciliation-report", async (req, res) => {
  try {
    const bankAccountId = req.query.bankAccountId ? Number(req.query.bankAccountId) : 1;
    const report = await BankReconciliationEngine.generateForm08TT(bankAccountId);
    res.json(report);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Lỗi lập báo cáo Form 08-TT" });
  }
});

export default router;
