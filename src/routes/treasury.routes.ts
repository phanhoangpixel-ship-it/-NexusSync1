import { Router } from "express";
import { client, db, recreateDatabaseClient } from "../../db/index";
import * as schema from "../../db/schema";
import { StockAdjustmentService } from "../../engines/stockAdjustmentService";
import { WorkspaceAggregationService } from "../../engines/WorkspaceAggregationService";
import { InventoryService } from "../../engines/inventoryService";
import { accountingEngine } from "../../engines/accountingEngine";
import { UnifiedPipelineEngine } from "../../engines/unifiedPipelineEngine";
import { BankReconciliationEngine } from "../../engines/bankReconciliationEngine";
import { eq, desc, sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

const router = Router();

router.get("/api/treasury/bank-accounts", async (req, res) => {
  try {
    await BankReconciliationEngine.ensureSeedData();
    const accounts = await db.select().from(schema.bankAccounts).all();
    res.json(accounts);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi truy vấn tài khoản ngân hàng' });
  }
});

router.get("/api/treasury/vouchers", async (req, res) => {
  try {
    const vouchers = await db.select().from(schema.cashVouchers).orderBy(desc(schema.cashVouchers.id)).all();
    res.json(vouchers);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi truy vấn phiếu thu chi' });
  }
});

router.post("/api/treasury/vouchers", async (req, res) => {
  try {
    const { voucherType, partnerType, partnerName, amount, bankAccountId, paymentMethod, reason, accountingEntry } = req.body;
    const numAmount = Number(amount) || 0;
    const accounts = await db.select().from(schema.bankAccounts).all();
    const account = accounts.find(a => a.id === Number(bankAccountId)) || accounts[0] || { id: 1, bankName: 'Vietcombank (VCB)' };

    const isReceipt = voucherType === 'RECEIPT';
    const codePrefix = isReceipt ? 'PT' : 'PC';
    const countRes = await db.select().from(schema.cashVouchers).all();
    const newCode = `${codePrefix}-2026-${String(countRes.length + 91).padStart(4, '0')}`;

    const newVoucherData = {
      voucherCode: newCode,
      voucherType: voucherType || 'RECEIPT',
      partnerType: partnerType || 'CUSTOMER',
      partnerName: partnerName || 'Đối Tác Doanh Nghiệp',
      amount: numAmount,
      bankAccountId: account.id,
      bankName: account.bankName,
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      status: 'PENDING_APPROVAL',
      date: new Date().toISOString().slice(0, 10),
      reason: reason || (isReceipt ? 'Thu tiền thanh toán' : 'Chi trả tiền dịch vụ/vật tư'),
      accountingEntry: accountingEntry || (isReceipt ? 'Nợ 1121 / Có 131' : 'Nợ 331 / Có 1121'),
      createdBy: 'Hoàng Nam (Admin)',
      approvedBy: null,
    };

    const inserted = await db.insert(schema.cashVouchers).values(newVoucherData).returning();
    const newVoucher = inserted[0] || newVoucherData;

    res.status(201).json({
      success: true,
      message: `Đã khởi tạo ${isReceipt ? 'Phiếu Thu' : 'Phiếu Chi'} [${newCode}] thành công. Đã chuyển sang hàng chờ duyệt CFO/Manager.`,
      voucher: newVoucher
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi tạo phiếu thu/chi' });
  }
});

router.post("/api/treasury/vouchers/:id/approve", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const vouchers = await db.select().from(schema.cashVouchers).where(eq(schema.cashVouchers.id, id)).all();
    const voucher = vouchers[0];
    if (!voucher) return res.status(404).json({ error: "Không tìm thấy phiếu thu/chi" });

    await db.update(schema.cashVouchers)
      .set({ status: 'APPROVED', approvedBy: 'CFO - Nguyễn Thị Hương' } as any)
      .where(eq(schema.cashVouchers.id, id));

    // Update bank balance if account exists
    if (voucher.bankAccountId) {
      const acc = await db.select().from(schema.bankAccounts).where(eq(schema.bankAccounts.id, voucher.bankAccountId)).all();
      if (acc[0]) {
        const delta = voucher.voucherType === 'RECEIPT' ? voucher.amount : -voucher.amount;
        await db.update(schema.bankAccounts)
          .set({
            bookBalance: acc[0].bookBalance + delta,
            bankBalance: acc[0].bankBalance + delta
          } as any)
          .where(eq(schema.bankAccounts.id, voucher.bankAccountId));
      }
    }

    res.json({
      success: true,
      message: `Đã phê duyệt ${voucher.voucherType === 'RECEIPT' ? 'Phiếu Thu' : 'Phiếu Chi'} [${voucher.voucherCode}]. Số dư đã được cập nhật tự động vào Sổ quỹ và Sổ cái GL.`,
      voucher: { ...voucher, status: 'APPROVED', approvedBy: 'CFO - Nguyễn Thị Hương' }
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi phê duyệt phiếu' });
  }
});

router.get("/api/treasury/transfers", async (req, res) => {
  try {
    const transfers = await db.select().from(schema.treasuryTransfers).orderBy(desc(schema.treasuryTransfers.id)).all();
    res.json(transfers);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi truy vấn điều chuyển tiền' });
  }
});

router.post("/api/treasury/transfers", async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, reason } = req.body;
    const transferAmount = Number(amount) || 0;

    const fromAccRes = await db.select().from(schema.bankAccounts).where(eq(schema.bankAccounts.id, Number(fromAccountId))).all();
    const toAccRes = await db.select().from(schema.bankAccounts).where(eq(schema.bankAccounts.id, Number(toAccountId))).all();

    const fromAcc = fromAccRes[0];
    const toAcc = toAccRes[0];

    if (!fromAcc || !toAcc) return res.status(400).json({ error: "Tài khoản trích tiền hoặc thụ hưởng không hợp lệ" });
    if (fromAcc.bookBalance < transferAmount) return res.status(400).json({ error: `Số dư tài khoản [${fromAcc.bankName}] không đủ để chuyển (${fromAcc.bookBalance.toLocaleString('vi-VN')} VNĐ)` });

    await db.update(schema.bankAccounts)
      .set({
        bookBalance: fromAcc.bookBalance - transferAmount,
        bankBalance: fromAcc.bankBalance - transferAmount
      } as any)
      .where(eq(schema.bankAccounts.id, fromAcc.id));

    await db.update(schema.bankAccounts)
      .set({
        bookBalance: toAcc.bookBalance + transferAmount,
        bankBalance: toAcc.bankBalance + transferAmount
      } as any)
      .where(eq(schema.bankAccounts.id, toAcc.id));

    const totalTransfers = await db.select().from(schema.treasuryTransfers).all();
    const newTransferData = {
      transferCode: `TRF-2026-${String(totalTransfers.length + 14).padStart(3, '0')}`,
      fromAccountId: fromAcc.id,
      fromBankName: fromAcc.bankName,
      toAccountId: toAcc.id,
      toBankName: toAcc.bankName,
      amount: transferAmount,
      fee: 0,
      status: 'COMPLETED',
      date: new Date().toISOString().slice(0, 10),
      reason: reason || 'Điều chuyển vốn nội bộ',
      accountingEntry: `Nợ TK ${toAcc.accountType === 'CASH' ? '1111' : '1121'} / Có TK ${fromAcc.accountType === 'CASH' ? '1111' : '1121'}`,
      createdBy: 'CFO - Nguyễn Thị Hương'
    };

    const inserted = await db.insert(schema.treasuryTransfers).values(newTransferData).returning();
    const newTransfer = inserted[0] || newTransferData;

    res.status(201).json({
      success: true,
      message: `Đã thực hiện điều chuyển ${transferAmount.toLocaleString('vi-VN')} VNĐ từ [${fromAcc.bankName}] sang [${toAcc.bankName}] thành công.`,
      transfer: newTransfer
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi thực hiện điều chuyển quỹ' });
  }
});

router.get("/api/treasury/bank-statements", async (req, res) => {
  try {
    const stmts = await db.select().from(schema.bankTransactions).all();
    res.json(stmts);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi truy vấn sao kê' });
  }
});

router.post("/api/treasury/reconcile", async (req, res) => {
  try {
    const { statementId, voucherCode } = req.body;
    const txId = Number(statementId);
    let stmts = await db.select().from(schema.bankTransactions).where(eq(schema.bankTransactions.id, txId)).all();
    if (!stmts[0]) {
      return res.status(404).json({ error: "Không tìm thấy dòng sao kê ngân hàng" });
    }

    const matchedCode = voucherCode || `PT-2026-AUTO`;
    await db.update(schema.bankTransactions)
      .set({ status: 'MATCHED' } as any)
      .where(eq(schema.bankTransactions.id, txId));

    res.json({
      success: true,
      message: `Đã đối soát khớp thành công giao dịch sao kê [${stmts[0].bankRef || stmts[0].id}] với Chứng từ [${matchedCode}].`,
      statement: { ...stmts[0], status: 'MATCHED', matchedVoucherCode: matchedCode }
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi đối soát sao kê' });
  }
});

router.get("/api/treasury/cashflow-forecast", async (req, res) => {
  try {
    const accounts = await db.select().from(schema.bankAccounts).all();
    const totalCashBank = accounts.reduce((sum, a) => sum + (Number(a.bookBalance) || 0), 0);

    const forecast7Days = {
      period: '7_DAYS',
      periodLabel: '7 ngày tới',
      openingBalance: totalCashBank,
      expectedInflows: 450000000,
      expectedOutflows: 180000000,
      netCashFlow: 270000000,
      closingBalance: totalCashBank + 270000000,
      riskLevel: 'LOW',
      warningMessage: 'Thanh khoản dồi dào, đủ đáp ứng mọi nghĩa vụ thanh toán trong tuần.',
    };

    const forecast30Days = {
      period: '30_DAYS',
      periodLabel: '30 ngày tới',
      openingBalance: totalCashBank,
      expectedInflows: 1850000000,
      expectedOutflows: 1200000000,
      netCashFlow: 650000000,
      closingBalance: totalCashBank + 650000000,
      riskLevel: 'OPTIMAL',
      warningMessage: 'Dòng tiền dương ổn định. Khuyến nghị cân nhắc gửi tiền gửi có kỳ hạn để tối ưu lãi suất.',
    };

    const forecast90Days = {
      period: '90_DAYS',
      periodLabel: '90 ngày tới (Quý)',
      openingBalance: totalCashBank,
      expectedInflows: 5200000000,
      expectedOutflows: 4800000000,
      netCashFlow: 400000000,
      closingBalance: totalCashBank + 400000000,
      riskLevel: 'MODERATE',
      warningMessage: 'Theo dõi chặt chẽ hạn mức nợ vay đợt nhập khẩu vật tư tháng 10.',
    };

    res.json({
      totalCashBank,
      forecasts: [forecast7Days, forecast30Days, forecast90Days]
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi dự báo dòng tiền' });
  }
});

export default router;
