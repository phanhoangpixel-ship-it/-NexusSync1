import { Router } from "express";
import { db } from "../../db/index";
import * as schema from "../../db/schema";
import { BankReconciliationEngine } from "../../engines/bankReconciliationEngine";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/api/bank/accounts", async (req, res) => {
  try {
    const accounts = await db.select().from(schema.bankAccounts).all();
    res.json(accounts);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi truy vấn tài khoản ngân hàng' });
  }
});

router.get("/api/bank/statements", async (req, res) => {
  try {
    const bankAccountId = req.query.bankAccountId ? Number(req.query.bankAccountId) : undefined;
    if (bankAccountId) {
      const statements = await db
        .select()
        .from(schema.bankStatements)
        .where(eq(schema.bankStatements.bankAccountId, bankAccountId))
        .orderBy(desc(schema.bankStatements.id))
        .all();
      return res.json(statements);
    }
    const statements = await db
      .select()
      .from(schema.bankStatements)
      .orderBy(desc(schema.bankStatements.id))
      .all();
    res.json(statements);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi truy vấn sao kê ngân hàng' });
  }
});

router.post("/api/bank/statements/import", async (req, res) => {
  try {
    const { bankAccountId, transactions } = req.body;
    const accId = Number(bankAccountId) || 1;
    const items = Array.isArray(transactions) ? transactions : [];

    let importedCount = 0;
    for (const item of items) {
      const txId = item.bankTransactionId || `FT${Date.now()}${Math.floor(Math.random()*1000)}`;
      await db.insert(schema.bankStatements).values({
        bankAccountId: accId,
        bankTransactionId: txId,
        amount: Number(item.amount) || 0,
        reference: item.reference || "Sổ phụ ngân hàng vừa nạp",
        transactionDate: new Date(item.transactionDate || Date.now()),
        status: "UNMATCHED",
      } as any).run();
      importedCount++;
    }

    res.json({
      success: true,
      message: `Đã nạp thành công ${importedCount} dòng giao dịch sao kê vào tài khoản ngân hàng #${accId}.`,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Lỗi nạp sao kê ngân hàng" });
  }
});

router.post("/api/bank/statements/auto-reconcile", async (req, res) => {
    try {
      const bankAccountId = req.body.bankAccountId ? Number(req.body.bankAccountId) : undefined;
      const result = await BankReconciliationEngine.autoReconcile(bankAccountId, 1);
      res.json({
        success: true,
        message: `Đã chạy động cơ đối soát tự động: Khớp thành công ${result.matchedCount} giao dịch (${result.totalAmountReconciled.toLocaleString('vi-VN')} VNĐ). ${result.unmatchedCount} giao dịch chưa khớp.`,
        result,
      });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Lỗi chạy động cơ đối soát" });
    }
  });

router.post("/api/bank/statements/manual-match", async (req, res) => {
    try {
      const { transactionId, invoiceId } = req.body;
      const result = await BankReconciliationEngine.manualMatch(Number(transactionId), Number(invoiceId), 1);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e?.message || "Lỗi đối soát thủ công" });
    }
  });

router.post("/api/bank/statements/unmatch", async (req, res) => {
    try {
      const { transactionId } = req.body;
      const result = await BankReconciliationEngine.unmatch(Number(transactionId), 1);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e?.message || "Lỗi hủy đối soát" });
    }
  });

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
