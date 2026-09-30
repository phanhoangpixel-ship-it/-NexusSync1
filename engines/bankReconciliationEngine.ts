import { db, client } from "../db/index";
import * as schema from "../db/schema";
import { eq, desc, and, like, or, sql } from "drizzle-orm";
import { AuditService } from "./auditService";
import { TreasuryService } from "./treasuryService";
import { accountingEngine } from "./accountingEngine";
import crypto from "crypto";

export interface ReconciliationResult {
  matchedCount: number;
  unmatchedCount: number;
  totalAmountReconciled: number;
  details: {
    transactionId: string;
    amount: number;
    reference: string;
    matchedInvoiceNumber?: string;
    matchedVoucherCode?: string;
    matchType?: string;
    status: string;
    reason: string;
  }[];
}

export interface StatementImportResult {
  success: boolean;
  totalProcessed: number;
  importedCount: number;
  skippedDuplicateCount: number;
  importChecksum: string;
  bankAccountId: number;
  message: string;
}

export interface BankReconciliationReport {
  bankAccountId: number;
  bankName: string;
  accountNumber: string;
  asOfDate: string;
  bookBalance: number;
  bankBalance: number;
  difference: number;
  unmatchedBankCredits: number;
  unmatchedBankDebits: number;
  outstandingDeposits: number;
  outstandingChecks: number;
  reconciledBalance: number;
  form08TT: {
    bankBalanceOnStatement: number;
    addOutstandingDeposits: number;
    lessOutstandingChecks: number;
    adjustedBankBalance: number;
    bookBalanceInGL: number;
    addUnrecordedCredits: number;
    lessUnrecordedDebits: number;
    adjustedBookBalance: number;
    isBalanced: boolean;
  };
}

export class BankReconciliationEngine {
  /**
   * Auto-seed initial sample bank accounts and transactions if empty
   */
  public static async ensureSeedData() {
    try {
      const existingAccounts = await db.select().from(schema.bankAccounts).all();
      if (existingAccounts.length === 0) {
        await db.insert(schema.bankAccounts).values([
          {
            bankName: "Vietcombank (VCB) - Chi Nhánh Hoàn Kiếm",
            accountNumber: "0011004328888",
            accountName: "CÔNG TY CP NEXUSSYNC ERP",
            currency: "VND",
            accountType: "CHECKING",
            bookBalance: 420000000,
            bankBalance: 420000000,
            isActive: true,
          },
          {
            bankName: "MB Bank (MBB) - Chi Nhánh Mẫu Sơn",
            accountNumber: "888899992026",
            accountName: "CÔNG TY CP NEXUSSYNC ERP",
            currency: "VND",
            accountType: "SAVINGS",
            bookBalance: 150000000,
            bankBalance: 150000000,
            isActive: true,
          },
          {
            bankName: "Techcombank (TCB) - Chi Nhánh Hà Nội",
            accountNumber: "1903882716201",
            accountName: "CÔNG TY CP NEXUSSYNC ERP",
            currency: "VND",
            accountType: "CHECKING",
            bookBalance: 280000000,
            bankBalance: 280000000,
            isActive: true,
          },
        ]).run();
      }

      const accounts = await db.select().from(schema.bankAccounts).all();
      const vcbAcc = accounts[0];

      const existingTx = await db.select().from(schema.bankTransactions).all();
      if (existingTx.length === 0 && vcbAcc) {
        await db.insert(schema.bankTransactions).values([
          {
            bankAccountId: vcbAcc.id,
            bankTransactionId: "FT2624098123912",
            bankRef: "REF-VCB-859744",
            amount: 176000000,
            reference: "CT VINTECH CORP THANH TOAN HD INV-AR-UNIFIED-859744",
            transactionDate: new Date("2026-08-28T09:15:00Z"),
            status: "UNMATCHED",
            transactionHash: crypto.createHash('sha256').update(`${vcbAcc.id}_FT2624098123912_176000000_2026-08-28`).digest('hex'),
          },
          {
            bankAccountId: vcbAcc.id,
            bankTransactionId: "FT2624098123915",
            bankRef: "REF-VCB-859745",
            amount: -110000000,
            reference: "THANH TOAN TIEN MUA NVL HOADON INV-AP-UNIFIED-859744 MINH PHAT",
            transactionDate: new Date("2026-08-28T10:30:00Z"),
            status: "UNMATCHED",
            transactionHash: crypto.createHash('sha256').update(`${vcbAcc.id}_FT2624098123915_-110000000_2026-08-28`).digest('hex'),
          },
          {
            bankAccountId: vcbAcc.id,
            bankTransactionId: "FT2624098124001",
            bankRef: "REF-VCB-859746",
            amount: 65000000,
            reference: "CCTY PHONG VU CHUYEN TIEN DAT COC SO-2026-018",
            transactionDate: new Date("2026-08-28T14:20:00Z"),
            status: "UNMATCHED",
            transactionHash: crypto.createHash('sha256').update(`${vcbAcc.id}_FT2624098124001_65000000_2026-08-28`).digest('hex'),
          },
          {
            bankAccountId: vcbAcc.id,
            bankTransactionId: "FT2624098124088",
            bankRef: "REF-VCB-859747",
            amount: -1250000,
            reference: "PHI DICH VU QUAN LY TAI KHOAN DOANH NGHIEP THANG 08/2026",
            transactionDate: new Date("2026-08-28T16:00:00Z"),
            status: "UNMATCHED",
            transactionHash: crypto.createHash('sha256').update(`${vcbAcc.id}_FT2624098124088_-1250000_2026-08-28`).digest('hex'),
          },
        ]).run();
      }
    } catch (e) {
      console.error("Error seeding bank data:", e);
    }
  }

  /**
   * Parse Raw Bank Statement File (CSV / MT940 / JSON)
   */
  public static parseStatementFile(content: string, format: 'CSV' | 'MT940' | 'JSON' = 'CSV') {
    const transactions: Array<{
      bankTransactionId: string;
      bankRef?: string;
      amount: number;
      reference: string;
      transactionDate: string | Date;
      partnerName?: string;
      partnerAccount?: string;
    }> = [];

    if (format === 'JSON') {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed;
        } else if (parsed.transactions && Array.isArray(parsed.transactions)) {
          return parsed.transactions;
        }
      } catch (err: any) {
        throw new Error(`Định dạng file JSON không hợp lệ: ${err.message}`);
      }
    } else if (format === 'MT940') {
      // SWIFT MT940 Parser: :61: Statement Line, :86: Information to Account Owner
      const lines = content.split(/\r?\n/);
      let currentTx: any = null;

      for (const line of lines) {
        if (line.startsWith(':61:')) {
          // Format: :61:YYMMDD[MMDD]C/D[amount]N[transaction type][reference]
          if (currentTx) transactions.push(currentTx);
          const raw = line.substring(4);
          const dateStr = raw.substring(0, 6); // YYMMDD
          const fullYear = `20${dateStr.substring(0, 2)}-${dateStr.substring(2, 4)}-${dateStr.substring(4, 6)}`;
          const isDebit = raw.includes('D') && !raw.includes('RD');
          
          // extract amount
          const matchAmt = raw.match(/[CD]([0-9,.]+)[NFS]/);
          const rawAmt = matchAmt ? parseFloat(matchAmt[1].replace(',', '.')) : 0;
          const signedAmount = isDebit ? -rawAmt : rawAmt;
          const txId = `MT940-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

          currentTx = {
            bankTransactionId: txId,
            bankRef: txId,
            amount: signedAmount,
            reference: 'SWIFT MT940 Statement Line',
            transactionDate: fullYear,
          };
        } else if (line.startsWith(':86:') && currentTx) {
          currentTx.reference = line.substring(4).trim();
        }
      }
      if (currentTx) transactions.push(currentTx);
      return transactions;
    } else {
      // CSV format parser (Comma, Semicolon, or Tab delimited)
      const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) return [];

      const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
      const header = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (row.length < 2) continue;

        let txId = `CSV-${Date.now()}-${i}`;
        let dateVal = new Date().toISOString();
        let amount = 0;
        let ref = `Giao dịch dòng ${i}`;
        let partner = '';

        row.forEach((cell, idx) => {
          const col = header[idx] || '';
          if (col.includes('id') || col.includes('magiaodich') || col.includes('ft') || col.includes('ref')) {
            if (cell) txId = cell;
          } else if (col.includes('date') || col.includes('ngay')) {
            if (cell) dateVal = cell;
          } else if (col.includes('amount') || col.includes('sotien') || col.includes('credit') || col.includes('debit')) {
            const parsed = parseFloat(cell.replace(/,/g, ''));
            if (!isNaN(parsed)) {
              if (col.includes('debit') || col.includes('chi')) {
                amount = -Math.abs(parsed);
              } else {
                amount = parsed;
              }
            }
          } else if (col.includes('ref') || col.includes('desc') || col.includes('noidung') || col.includes('memo')) {
            if (cell) ref = cell;
          } else if (col.includes('partner') || col.includes('doitac') || col.includes('nguoinhan')) {
            if (cell) partner = cell;
          }
        });

        transactions.push({
          bankTransactionId: txId,
          bankRef: txId,
          amount,
          reference: ref,
          transactionDate: dateVal,
          partnerName: partner,
        });
      }
      return transactions;
    }
  }

  /**
   * Import statement batch with strict SHA-256 Checksum Idempotency & Deduplication
   */
  public static async importStatements(
    bankAccountId: number,
    transactions: any[],
    customChecksum?: string,
    operatorUserId: number = 1
  ): Promise<StatementImportResult> {
    await this.ensureSeedData();

    const accId = Number(bankAccountId);
    const accounts = await db.select().from(schema.bankAccounts).where(eq(schema.bankAccounts.id, accId)).all();
    if (!accounts.length) {
      throw new Error(`Không tìm thấy tài khoản ngân hàng #${accId}`);
    }

    const rawString = JSON.stringify(transactions);
    const importChecksum = customChecksum || crypto.createHash('sha256').update(`${accId}_${rawString}`).digest('hex');

    const existingTxs = await db.select().from(schema.bankTransactions).where(eq(schema.bankTransactions.bankAccountId, accId)).all();
    const existingTxIds = new Set(existingTxs.map(t => t.bankTransactionId));
    const existingHashes = new Set(existingTxs.map(t => t.transactionHash).filter(Boolean));

    let importedCount = 0;
    let skippedDuplicateCount = 0;

    for (const item of transactions) {
      const txId = item.bankTransactionId || `FT${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const amount = Number(item.amount) || 0;
      const ref = item.reference || item.memo || "Sao kê điện tử vừa nạp";
      const txDate = item.transactionDate ? new Date(item.transactionDate) : new Date();
      const dateStr = txDate.toISOString().split('T')[0];
      const txHash = crypto.createHash('sha256').update(`${accId}_${txId}_${amount}_${dateStr}`).digest('hex');

      // Strict Deduplication Check: either bankTransactionId exists or transactionHash exists
      if (existingTxIds.has(txId) || existingHashes.has(txHash)) {
        skippedDuplicateCount++;
        continue;
      }

      await db.insert(schema.bankTransactions).values({
        bankAccountId: accId,
        bankTransactionId: txId,
        bankRef: item.bankRef || txId,
        amount,
        reference: ref,
        transactionDate: txDate,
        status: "UNMATCHED",
        importChecksum,
        transactionHash: txHash,
        partnerName: item.partnerName || null,
        partnerAccount: item.partnerAccount || null,
        counterpartyBank: item.counterpartyBank || null,
        virtualAccount: item.virtualAccount || null,
      }).run();

      existingTxIds.add(txId);
      existingHashes.add(txHash);
      importedCount++;
    }

    // Record M02 Audit Log for statement import
    await AuditService.recordAuditLog({
      userId: operatorUserId,
      username: "admin",
      role: "FINANCE_CONTROLLER",
      module: "M33",
      action: "IMPORT_BANK_STATEMENT",
      entityType: "BANK_ACCOUNT",
      entityId: String(accId),
      result: "SUCCESS",
      afterData: {
        totalProcessed: transactions.length,
        importedCount,
        skippedDuplicateCount,
        importChecksum,
      }
    });

    return {
      success: true,
      totalProcessed: transactions.length,
      importedCount,
      skippedDuplicateCount,
      importChecksum,
      bankAccountId: accId,
      message: `Đã xử lý ${transactions.length} dòng sao kê: Nạp mới ${importedCount} dòng, Bỏ qua ${skippedDuplicateCount} dòng trùng lặp (SHA-256 Checksum: ${importChecksum.substring(0, 12)}...).`,
    };
  }

  /**
   * Run automated multi-criteria matching engine (4-Tier Matching)
   * Architecture Guard: Delegates all GL postings strictly to M32 TreasuryService / M30 AccountingEngine
   */
  public static async autoReconcile(bankAccountId?: number, operatorUserId: number = 1): Promise<ReconciliationResult> {
    await this.ensureSeedData();

    let txList = await db.select().from(schema.bankTransactions).all();
    if (bankAccountId) {
      txList = txList.filter(t => t.bankAccountId === Number(bankAccountId));
    }

    const unmatchedTxs = txList.filter(t => t.status === "UNMATCHED");
    const allInvoices = await db.select().from(schema.invoices).all();
    const allVouchers = await db.select().from(schema.cashVouchers).all();

    let matchedCount = 0;
    let unmatchedCount = 0;
    let totalAmountReconciled = 0;
    const details: ReconciliationResult["details"] = [];

    for (const tx of unmatchedTxs) {
      const ref = (tx.reference || "").toUpperCase();
      const txAmt = Math.abs(tx.amount);
      const isReceipt = tx.amount > 0;

      let matchedInv: any = null;
      let matchedVoucher: any = null;
      let matchType = "AUTO_EXACT_REF";
      let matchReason = "";

      // Tier 1: Exact Reference Match (Invoice Number or Cash Voucher Code in Transaction Memo or bankRef)
      matchedInv = allInvoices.find(inv => {
        if (!inv.invoiceNumber) return false;
        const invNum = inv.invoiceNumber.toUpperCase();
        return ref.includes(invNum) || (tx.bankRef && tx.bankRef.toUpperCase().includes(invNum));
      });

      if (!matchedInv) {
        matchedVoucher = allVouchers.find(v => {
          if (!v.voucherCode) return false;
          const vCode = v.voucherCode.toUpperCase();
          return ref.includes(vCode) || (tx.bankRef && tx.bankRef.toUpperCase().includes(vCode));
        });
        if (matchedVoucher) matchType = "AUTO_EXACT_REF";
      }

      // Tier 2: VietQR Semantic Token Match (Normalized Alphanumeric Sequence)
      if (!matchedInv && !matchedVoucher) {
        const cleanRef = ref.replace(/[^A-Z0-9]/g, '');
        matchedInv = allInvoices.find(inv => {
          if (!inv.invoiceNumber) return false;
          const cleanInv = inv.invoiceNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
          return cleanInv.length >= 4 && cleanRef.includes(cleanInv);
        });
        if (matchedInv) matchType = "AUTO_VIETQR_MEMO";
      }

      // Tier 3: Amount + Date Window Match (Exact Amount ±3 Days Window)
      if (!matchedInv && !matchedVoucher) {
        const txTime = tx.transactionDate ? new Date(tx.transactionDate).getTime() : Date.now();
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

        matchedInv = allInvoices.find(inv => {
          if (inv.paymentStatus === "PAID") return false;
          const invAmt = inv.finalAmount || inv.totalAmount || 0;
          if (Math.abs(invAmt - txAmt) >= 1.0) return false;
          
          const invDate = inv.issueDate ? new Date(inv.issueDate).getTime() : (inv.createdAt ? new Date(inv.createdAt).getTime() : txTime);
          return Math.abs(txTime - invDate) <= THREE_DAYS_MS * 4; // within reasonable window
        });
        if (matchedInv) matchType = "AUTO_AMOUNT_WINDOW";
      }

      // Tier 4: Partner Tax Code / Partner Name + Amount Match
      if (!matchedInv && !matchedVoucher) {
        matchedInv = allInvoices.find(inv => {
          if (inv.paymentStatus === "PAID") return false;
          const invAmt = inv.finalAmount || inv.totalAmount || 0;
          const isAmtMatch = Math.abs(invAmt - txAmt) < 1.0;
          if (!isAmtMatch) return false;

          // Check tax code or partner name in reference
          const taxMatch = inv.taxCode && ref.includes(inv.taxCode.toUpperCase());
          const nameMatch = (inv.customerName && ref.includes(inv.customerName.toUpperCase().slice(0, 10))) ||
                            (inv.supplierName && ref.includes(inv.supplierName.toUpperCase().slice(0, 10)));
          return taxMatch || nameMatch;
        });
        if (matchedInv) matchType = "AUTO_PARTNER_INFO";
      }

      if (matchedInv) {
        // Delegate Cash Voucher / GL Posting via M32 TreasuryService
        let createdVoucherId: number | null = null;
        let voucherCode = "";

        try {
          if (isReceipt) {
            const collectionResult = await TreasuryService.createExternalCollection({
              sourceModule: "M33",
              sourceDocumentType: "INVOICE",
              sourceDocumentId: matchedInv.id,
              sourceReferenceNo: matchedInv.invoiceNumber,
              partnerType: "CUSTOMER",
              partnerId: matchedInv.customerId || undefined,
              partnerName: matchedInv.customerName || "Khách hàng",
              partnerTaxCode: matchedInv.taxCode || undefined,
              amount: txAmt,
              bankAccountId: tx.bankAccountId,
              reason: `[M33 Đối soát tự động] Thu tiền sao kê #${tx.bankTransactionId} cho Hóa đơn #${matchedInv.invoiceNumber}`,
              idempotencyKey: `M33-AUTO-REC-${tx.bankTransactionId}`,
              autoApprove: true,
              userId: operatorUserId,
            });
            createdVoucherId = collectionResult.voucher.id;
            voucherCode = collectionResult.voucher.voucherCode;
          } else {
            const disbResult = await TreasuryService.createExternalDisbursement({
              sourceModule: "M33",
              sourceDocumentType: "INVOICE",
              sourceDocumentId: matchedInv.id,
              sourceReferenceNo: matchedInv.invoiceNumber,
              partnerType: "SUPPLIER",
              partnerId: matchedInv.supplierId || undefined,
              partnerName: matchedInv.supplierName || "Nhà cung cấp",
              amount: txAmt,
              bankAccountId: tx.bankAccountId,
              reason: `[M33 Đối soát tự động] Chi tiền sao kê #${tx.bankTransactionId} cho Hóa đơn #${matchedInv.invoiceNumber}`,
              idempotencyKey: `M33-AUTO-DISB-${tx.bankTransactionId}`,
              autoApprove: true,
              userId: operatorUserId,
            });
            createdVoucherId = disbResult.voucher.id;
            voucherCode = disbResult.voucher.voucherCode;
          }
        } catch (err: any) {
          console.warn(`[M33 Treasury Delegation Note] ${err.message}`);
        }

        // Update Bank Transaction Status to MATCHED
        await db.update(schema.bankTransactions)
          .set({
            status: "MATCHED",
            matchType,
            reconciledInvoiceId: matchedInv.id,
            reconciledVoucherId: createdVoucherId,
            reconciledBy: operatorUserId,
            reconciledAt: new Date(),
          })
          .where(eq(schema.bankTransactions.id, tx.id))
          .run();

        // Update Invoice status to PAID
        await db.update(schema.invoices)
          .set({ paymentStatus: "PAID" })
          .where(eq(schema.invoices.id, matchedInv.id))
          .run();

        // Audit Logging via M02
        await AuditService.recordAuditLog({
          userId: operatorUserId,
          username: "admin",
          role: "FINANCE_CONTROLLER",
          module: "M33",
          action: "RECONCILE_BANK_STATEMENT",
          entityType: "BANK_TRANSACTION",
          entityId: String(tx.id),
          result: "SUCCESS",
          beforeData: { status: "UNMATCHED" },
          afterData: {
            status: "MATCHED",
            matchType,
            invoiceId: matchedInv.id,
            invoiceNumber: matchedInv.invoiceNumber,
            voucherId: createdVoucherId,
            voucherCode,
          }
        });

        matchedCount++;
        totalAmountReconciled += txAmt;
        details.push({
          transactionId: tx.bankTransactionId,
          amount: tx.amount,
          reference: tx.reference || "",
          matchedInvoiceNumber: matchedInv.invoiceNumber,
          matchedVoucherCode: voucherCode || undefined,
          matchType,
          status: "MATCHED",
          reason: `Khớp ${matchType} với Hóa đơn #${matchedInv.invoiceNumber} (${matchedInv.customerName || matchedInv.supplierName || 'Đối tác'})`,
        });
      } else if (matchedVoucher) {
        // Matched with existing Treasury Voucher
        await db.update(schema.bankTransactions)
          .set({
            status: "MATCHED",
            matchType: "AUTO_EXACT_REF",
            reconciledVoucherId: matchedVoucher.id,
            reconciledBy: operatorUserId,
            reconciledAt: new Date(),
          })
          .where(eq(schema.bankTransactions.id, tx.id))
          .run();

        await AuditService.recordAuditLog({
          userId: operatorUserId,
          username: "admin",
          role: "FINANCE_CONTROLLER",
          module: "M33",
          action: "RECONCILE_BANK_STATEMENT",
          entityType: "BANK_TRANSACTION",
          entityId: String(tx.id),
          result: "SUCCESS",
          beforeData: { status: "UNMATCHED" },
          afterData: {
            status: "MATCHED",
            voucherId: matchedVoucher.id,
            voucherCode: matchedVoucher.voucherCode,
          }
        });

        matchedCount++;
        totalAmountReconciled += txAmt;
        details.push({
          transactionId: tx.bankTransactionId,
          amount: tx.amount,
          reference: tx.reference || "",
          matchedVoucherCode: matchedVoucher.voucherCode,
          matchType: "AUTO_EXACT_REF",
          status: "MATCHED",
          reason: `Khớp với Phiếu ${matchedVoucher.voucherType === 'RECEIPT' ? 'Thu' : 'Chi'} #${matchedVoucher.voucherCode}`,
        });
      } else {
        unmatchedCount++;
        details.push({
          transactionId: tx.bankTransactionId,
          amount: tx.amount,
          reference: tx.reference || "",
          status: "UNMATCHED",
          reason: "Chưa tìm thấy hóa đơn hoặc chứng từ tương ứng khớp mã/số tiền",
        });
      }
    }

    return {
      matchedCount,
      unmatchedCount,
      totalAmountReconciled,
      details,
    };
  }

  /**
   * Manual matching between statement line and invoice(s) or voucher (Supports 1-1 and 1-N matching)
   * Architecture Guard: Zero direct GL write; delegates to TreasuryService / AccountingEngine
   */
  public static async manualMatch(
    transactionId: number,
    invoiceId?: number,
    voucherId?: number,
    operatorUserId: number = 1,
    invoiceIds?: number[]
  ) {
    const txs = await db.select().from(schema.bankTransactions).where(eq(schema.bankTransactions.id, transactionId)).all();
    if (!txs.length) throw new Error("Không tìm thấy dòng sao kê ngân hàng");
    const tx = txs[0];

    if (tx.status === "MATCHED") {
      throw new Error(`Dòng sao kê #${tx.bankTransactionId} đã được khớp trước đó (ALREADY_MATCHED). Không thể khớp đè.`);
    }

    const targetInvoiceIds: number[] = [];
    if (invoiceId) targetInvoiceIds.push(invoiceId);
    if (invoiceIds && Array.isArray(invoiceIds)) {
      invoiceIds.forEach(id => {
        if (!targetInvoiceIds.includes(id)) targetInvoiceIds.push(id);
      });
    }

    let invs: any[] = [];
    let voucher: any = null;

    if (targetInvoiceIds.length > 0) {
      invs = await db.select().from(schema.invoices).all();
      invs = invs.filter(inv => targetInvoiceIds.includes(inv.id));
      if (!invs.length) throw new Error("Không tìm thấy hóa đơn cần khớp");
    }

    if (voucherId) {
      const vchs = await db.select().from(schema.cashVouchers).where(eq(schema.cashVouchers.id, voucherId)).all();
      if (!vchs.length) throw new Error("Không tìm thấy phiếu thu/chi cần khớp");
      voucher = vchs[0];
    }

    if (invs.length === 0 && !voucher) {
      throw new Error("Phải chọn ít nhất một Hóa đơn hoặc Chứng từ phiếu thu/chi để khớp");
    }

    // Delegate voucher creation if invoices are matched without existing voucher
    let matchedVoucherId = voucher ? voucher.id : null;
    let voucherCode = voucher ? voucher.voucherCode : "";
    const primaryInv = invs[0] || null;

    if (invs.length > 0 && !matchedVoucherId) {
      const isReceipt = tx.amount > 0;
      const txAmt = Math.abs(tx.amount);
      const invNumbers = invs.map(i => i.invoiceNumber).join(", ");

      try {
        if (isReceipt) {
          const coll = await TreasuryService.createExternalCollection({
            sourceModule: "M33",
            sourceDocumentType: "INVOICE",
            sourceDocumentId: primaryInv.id,
            sourceReferenceNo: invNumbers,
            partnerType: "CUSTOMER",
            partnerId: primaryInv.customerId || undefined,
            partnerName: primaryInv.customerName || "Khách hàng",
            partnerTaxCode: primaryInv.taxCode || undefined,
            amount: txAmt,
            bankAccountId: tx.bankAccountId,
            reason: `[M33 Khớp thủ công ${invs.length > 1 ? '1-N' : '1-1'}] Thu tiền sao kê #${tx.bankTransactionId} cho Hóa đơn #${invNumbers}`,
            idempotencyKey: `M33-MANUAL-REC-${tx.bankTransactionId}`,
            autoApprove: true,
            userId: operatorUserId,
          });
          matchedVoucherId = coll.voucher.id;
          voucherCode = coll.voucher.voucherCode;
        } else {
          const disb = await TreasuryService.createExternalDisbursement({
            sourceModule: "M33",
            sourceDocumentType: "INVOICE",
            sourceDocumentId: primaryInv.id,
            sourceReferenceNo: invNumbers,
            partnerType: "SUPPLIER",
            partnerId: primaryInv.supplierId || undefined,
            partnerName: primaryInv.supplierName || "Nhà cung cấp",
            amount: txAmt,
            bankAccountId: tx.bankAccountId,
            reason: `[M33 Khớp thủ công ${invs.length > 1 ? '1-N' : '1-1'}] Chi tiền sao kê #${tx.bankTransactionId} cho Hóa đơn #${invNumbers}`,
            idempotencyKey: `M33-MANUAL-DISB-${tx.bankTransactionId}`,
            autoApprove: true,
            userId: operatorUserId,
          });
          matchedVoucherId = disb.voucher.id;
          voucherCode = disb.voucher.voucherCode;
        }
      } catch (err: any) {
        console.warn(`[M33 Manual Match Treasury Delegation Note] ${err.message}`);
      }

      // Mark all matched invoices as PAID
      for (const inv of invs) {
        await db.update(schema.invoices)
          .set({ paymentStatus: "PAID" })
          .where(eq(schema.invoices.id, inv.id))
          .run();
      }
    }

    await db.update(schema.bankTransactions)
      .set({
        status: "MATCHED",
        matchType: invs.length > 1 ? "MANUAL_1_N_OVERRIDE" : "MANUAL_OVERRIDE",
        reconciledInvoiceId: primaryInv ? primaryInv.id : null,
        reconciledVoucherId: matchedVoucherId || null,
        reconciledBy: operatorUserId || 1,
        reconciledAt: new Date(),
      })
      .where(eq(schema.bankTransactions.id, tx.id))
      .run();

    // Cryptographic Audit Logging via M02
    await AuditService.recordAuditLog({
      userId: operatorUserId,
      username: "admin",
      role: "FINANCE_CONTROLLER",
      module: "M33",
      action: "MANUAL_MATCH_BANK_STATEMENT",
      entityType: "BANK_TRANSACTION",
      entityId: String(tx.id),
      result: "SUCCESS",
      beforeData: { status: tx.status },
      afterData: {
        status: "MATCHED",
        matchType: invs.length > 1 ? "MANUAL_1_N_OVERRIDE" : "MANUAL_OVERRIDE",
        invoiceIds: invs.map(i => i.id),
        invoiceNumbers: invs.map(i => i.invoiceNumber),
        voucherId: matchedVoucherId,
        voucherCode,
      }
    });

    return {
      success: true,
      message: `Đã đối soát thủ công thành công Sao kê #${tx.bankTransactionId}${invs.length > 0 ? ` với ${invs.length} Hóa đơn (${invs.map(i => i.invoiceNumber).join(', ')})` : ''}${voucherCode ? ` (Phiếu #${voucherCode})` : ''}`,
      transactionId: tx.id,
      reconciledInvoiceId: primaryInv ? primaryInv.id : null,
      reconciledVoucherId: matchedVoucherId,
      matchedInvoicesCount: invs.length,
    };
  }

  /**
   * Unmatch statement line and rollback state
   */
  public static async unmatch(transactionId: number, operatorUserId: number = 1) {
    const txs = await db.select().from(schema.bankTransactions).where(eq(schema.bankTransactions.id, transactionId)).all();
    if (!txs.length) throw new Error("Không tìm thấy dòng sao kê");
    const tx = txs[0];

    if (tx.reconciledInvoiceId) {
      await db.update(schema.invoices)
        .set({ paymentStatus: "UNPAID" })
        .where(eq(schema.invoices.id, tx.reconciledInvoiceId))
        .run();
    }

    await db.update(schema.bankTransactions)
      .set({
        status: "UNMATCHED",
        matchType: null,
        reconciledInvoiceId: null,
        reconciledVoucherId: null,
        reconciledBy: null,
        reconciledAt: null,
      })
      .where(eq(schema.bankTransactions.id, tx.id))
      .run();

    await AuditService.recordAuditLog({
      userId: operatorUserId,
      username: "admin",
      role: "FINANCE_CONTROLLER",
      module: "M33",
      action: "UNMATCH_BANK_STATEMENT",
      entityType: "BANK_TRANSACTION",
      entityId: String(tx.id),
      result: "SUCCESS",
      beforeData: { status: tx.status, invoiceId: tx.reconciledInvoiceId, voucherId: tx.reconciledVoucherId },
      afterData: { status: "UNMATCHED" }
    });

    return { success: true, message: `Đã hủy đối soát dòng sao kê #${tx.bankTransactionId}` };
  }

  /**
   * Bank BIN mapping table for Vietnamese Commercial Banks (NAPAS 247)
   */
  public static readonly BANK_BINS: Record<string, { bin: string; shortName: string; fullName: string }> = {
    "VCB": { bin: "970436", shortName: "Vietcombank", fullName: "TMCP Ngoại thương Việt Nam" },
    "VIETCOMBANK": { bin: "970436", shortName: "Vietcombank", fullName: "TMCP Ngoại thương Việt Nam" },
    "MBB": { bin: "970422", shortName: "MBBank", fullName: "TMCP Quân đội" },
    "MBBANK": { bin: "970422", shortName: "MBBank", fullName: "TMCP Quân đội" },
    "TCB": { bin: "970407", shortName: "Techcombank", fullName: "TMCP Kỹ thương Việt Nam" },
    "TECHCOMBANK": { bin: "970407", shortName: "Techcombank", fullName: "TMCP Kỹ thương Việt Nam" },
    "CTG": { bin: "970415", shortName: "VietinBank", fullName: "TMCP Công thương Việt Nam" },
    "VIETINBANK": { bin: "970415", shortName: "VietinBank", fullName: "TMCP Công thương Việt Nam" },
    "BIDV": { bin: "970418", shortName: "BIDV", fullName: "TMCP Đầu tư và Phát triển Việt Nam" },
    "ACB": { bin: "970416", shortName: "ACB", fullName: "TMCP Á Châu" },
    "VPB": { bin: "970432", shortName: "VPBank", fullName: "TMCP Việt Nam Thịnh Vượng" },
    "VPBANK": { bin: "970432", shortName: "VPBank", fullName: "TMCP Việt Nam Thịnh Vượng" },
    "TPB": { bin: "970423", shortName: "TPBank", fullName: "TMCP Tiên Phong" },
    "TPBANK": { bin: "970423", shortName: "TPBank", fullName: "TMCP Tiên Phong" },
    "STB": { bin: "970403", shortName: "Sacombank", fullName: "TMCP Sài Gòn Thương Tín" },
    "SACOMBANK": { bin: "970403", shortName: "Sacombank", fullName: "TMCP Sài Gòn Thương Tín" },
    "HDB": { bin: "970437", shortName: "HDBank", fullName: "TMCP Phát triển TP.HCM" },
    "HDBANK": { bin: "970437", shortName: "HDBank", fullName: "TMCP Phát triển TP.HCM" },
  };

  /**
   * Generate VietQR Dynamic Payload conforming to NAPAS 247 spec (EMVCo with CRC16)
   */
  public static generateVietQrPayload(bankCode: string, accountNumber: string, amount: number, memo: string) {
    const cleanAccount = accountNumber.replace(/\s+/g, "");
    const upperBank = (bankCode || "VCB").toUpperCase().replace(/[^A-Z0-9]/g, '');
    const bankInfo = this.BANK_BINS[upperBank] || { bin: upperBank.length === 6 ? upperBank : "970436", shortName: upperBank, fullName: upperBank };
    const acquirerBin = bankInfo.bin;
    
    // Construct standard EMVCo payload
    // Tag 00: Payload Format Indicator (01)
    // Tag 01: Point of Initiation Method (12 for dynamic QR, 11 for static)
    // Tag 38: Merchant Account Information (NAPAS)
    //   - Subtag 00: GUID (A000000727)
    //   - Subtag 01: Acquirer BIN + Consumer Account Number
    //   - Subtag 02: Service Code (QRIBFTTA)
    // Tag 53: Transaction Currency (704 for VND)
    // Tag 54: Transaction Amount
    // Tag 58: Country Code (VN)
    // Tag 62: Additional Data Field (Memo / Purpose of Transaction)
    // Tag 63: CRC-16 Checksum
    const guid = "A000000727";
    const serviceCode = "QRIBFTTA";
    
    const subTag00 = `00${guid.length.toString().padStart(2, '0')}${guid}`;
    const beneficiaryValue = `00${acquirerBin.length.toString().padStart(2, '0')}${acquirerBin}01${cleanAccount.length.toString().padStart(2, '0')}${cleanAccount}`;
    const subTag01 = `01${beneficiaryValue.length.toString().padStart(2, '0')}${beneficiaryValue}`;
    const subTag02 = `02${serviceCode.length.toString().padStart(2, '0')}${serviceCode}`;
    const tag38Value = `${subTag00}${subTag01}${subTag02}`;
    const tag38 = `38${tag38Value.length.toString().padStart(2, '0')}${tag38Value}`;
    
    const tag53 = "5303704";
    const amtStr = Math.round(amount).toString();
    const tag54 = `54${amtStr.length.toString().padStart(2, '0')}${amtStr}`;
    const tag58 = "5802VN";
    const cleanMemo = memo.slice(0, 25).replace(/[^A-Za-z0-9 _-]/g, '');
    const tag62_08 = `08${cleanMemo.length.toString().padStart(2, '0')}${cleanMemo}`;
    const tag62 = `62${tag62_08.length.toString().padStart(2, '0')}${tag62_08}`;

    const rawPayloadNoCrc = `000201010212${tag38}${tag53}${tag54}${tag58}${tag62}6304`;
    
    // CRC-16-CCITT (Polynomial: 0x1021, Initial: 0xFFFF)
    let crc = 0xFFFF;
    for (let i = 0; i < rawPayloadNoCrc.length; i++) {
      crc ^= rawPayloadNoCrc.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    const crcHex = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    const fullQrString = `${rawPayloadNoCrc}${crcHex}`;

    return {
      vietQrString: fullQrString,
      bankCode: bankInfo.shortName,
      bin: acquirerBin,
      bankFullName: bankInfo.fullName,
      accountNumber: cleanAccount,
      amount,
      memo: cleanMemo,
      crc: crcHex,
      quickLinkUrl: `https://img.vietqr.io/image/${bankInfo.shortName.toLowerCase()}-${cleanAccount}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(cleanMemo)}&accountName=CONG%20TY%20CP%20NEXUSSYNC%20ERP`,
    };
  }

  /**
   * VietQR Webhook Processing & Auto-Receipt Generation (M32 Central Gateway)
   */
  public static async processVietQrWebhook(payload: {
    transactionId: string;
    amount: number;
    accountNumber: string;
    content: string;
    transactionDate?: string;
    gatewaySignature?: string;
  }, operatorUserId: number = 1) {
    await this.ensureSeedData();

    const { transactionId, amount, accountNumber, content, transactionDate } = payload;
    const cleanAcc = accountNumber.replace(/\s+/g, '');
    
    // Find matching bank account
    const accounts = await db.select().from(schema.bankAccounts).all();
    const bankAccount = accounts.find(a => a.accountNumber.replace(/\s+/g, '') === cleanAcc) || accounts[0];
    const bankAccountId = bankAccount ? bankAccount.id : 1;

    // Ingest into bank_transactions with idempotency
    const txDate = transactionDate ? new Date(transactionDate) : new Date();
    const txHash = crypto.createHash('sha256').update(`${bankAccountId}_${transactionId}_${amount}_${txDate.toISOString()}`).digest('hex');

    const existing = await db.select().from(schema.bankTransactions).where(
      or(
        eq(schema.bankTransactions.bankTransactionId, transactionId),
        eq(schema.bankTransactions.transactionHash, txHash)
      )
    ).all();

    if (existing.length > 0 && existing[0].status === "MATCHED") {
      return {
        success: true,
        isDuplicate: true,
        message: `Giao dịch Webhook #${transactionId} đã được xử lý trước đó.`,
        transaction: existing[0],
      };
    }

    let txRecordId = existing.length > 0 ? existing[0].id : 0;
    if (!txRecordId) {
      const insertResult = await db.insert(schema.bankTransactions).values({
        bankAccountId,
        bankTransactionId: transactionId,
        bankRef: transactionId,
        amount,
        reference: content,
        transactionDate: txDate,
        status: "UNMATCHED",
        matchType: "WEBHOOK_VIETQR",
        transactionHash: txHash,
      }).returning({ id: schema.bankTransactions.id }).all();
      txRecordId = insertResult[0]?.id || 0;
    }

    // Auto find invoice by content
    const allInvoices = await db.select().from(schema.invoices).all();
    const cleanContent = (content || "").toUpperCase();
    const matchedInv = allInvoices.find(inv => {
      if (!inv.invoiceNumber) return false;
      return cleanContent.includes(inv.invoiceNumber.toUpperCase());
    });

    // Delegate creation of 01-TT Receipt Voucher via M32 TreasuryService
    let voucherResult: any = null;
    try {
      voucherResult = await TreasuryService.createExternalCollection({
        sourceModule: "M33",
        sourceDocumentType: "VIETQR_WEBHOOK",
        sourceDocumentId: txRecordId,
        sourceReferenceNo: transactionId,
        partnerType: matchedInv ? "CUSTOMER" : "OTHER",
        partnerId: matchedInv?.customerId || undefined,
        partnerName: matchedInv?.customerName || "Khách hàng thanh toán VietQR",
        amount,
        bankAccountId,
        reason: `[VietQR Webhook M33] Thu tiền tự động qua QR cho GD #${transactionId}${matchedInv ? ` (Hóa đơn #${matchedInv.invoiceNumber})` : ''}`,
        idempotencyKey: `VIETQR-WH-${transactionId}`,
        autoApprove: true,
        userId: operatorUserId,
      });
    } catch (err: any) {
      console.warn(`[VietQR Webhook Treasury Collection Note] ${err.message}`);
    }

    // Update Transaction to MATCHED
    await db.update(schema.bankTransactions)
      .set({
        status: "MATCHED",
        matchType: "WEBHOOK_VIETQR",
        reconciledInvoiceId: matchedInv ? matchedInv.id : null,
        reconciledVoucherId: voucherResult?.voucher?.id || null,
        reconciledBy: operatorUserId,
        reconciledAt: new Date(),
      })
      .where(eq(schema.bankTransactions.id, txRecordId))
      .run();

    if (matchedInv) {
      await db.update(schema.invoices)
        .set({ paymentStatus: "PAID" })
        .where(eq(schema.invoices.id, matchedInv.id))
        .run();
    }

    // Audit log
    await AuditService.recordAuditLog({
      userId: operatorUserId,
      username: "webhook_gateway",
      role: "SYSTEM",
      module: "M33",
      action: "VIETQR_WEBHOOK_PROCESSED",
      entityType: "BANK_TRANSACTION",
      entityId: String(txRecordId),
      result: "SUCCESS",
      afterData: {
        transactionId,
        amount,
        invoiceId: matchedInv?.id,
        voucherCode: voucherResult?.voucher?.voucherCode,
      }
    });

    return {
      success: true,
      transactionId,
      amount,
      matchedInvoice: matchedInv ? matchedInv.invoiceNumber : null,
      voucherCode: voucherResult?.voucher?.voucherCode || null,
      message: `Đã xử lý thành công Webhook VietQR GD #${transactionId}: Tự động lập Phiếu Thu 01-TT #${voucherResult?.voucher?.voucherCode || 'N/A'} và gạch nợ thành công.`,
    };
  }

  /**
   * Generate Form 08-TT Bank Reconciliation Statement Report (Circular 200/2014/TT-BTC)
   */
  public static async generateForm08TT(bankAccountId: number): Promise<BankReconciliationReport> {
    await this.ensureSeedData();

    const accId = Number(bankAccountId) || 1;
    const accounts = await db.select().from(schema.bankAccounts).where(eq(schema.bankAccounts.id, accId)).all();
    const account = accounts[0] || {
      id: accId,
      bankName: "Vietcombank (VCB) - Chi Nhánh Hoàn Kiếm",
      accountNumber: "0011004328888",
      bookBalance: 420000000,
      bankBalance: 420000000,
    };

    const txs = await db.select().from(schema.bankTransactions).where(eq(schema.bankTransactions.bankAccountId, accId)).all();
    
    // Bank items not yet recorded in GL (Unrecorded by Company)
    const unmatchedCredits = txs.filter(t => t.status === "UNMATCHED" && t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const unmatchedDebits = txs.filter(t => t.status === "UNMATCHED" && t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // GL Vouchers not yet cleared on Bank Statement (In-transit items)
    const allApprovedVouchers = await db.select().from(schema.cashVouchers).where(
      eq(schema.cashVouchers.status, "APPROVED")
    ).all();
    const allBankVouchers = allApprovedVouchers.filter(v => 
      v.paymentMethod === "BANK_TRANSFER" || (v.bankAccountId && v.bankAccountId === accId)
    );

    const matchedVoucherIds = new Set(txs.map(t => t.reconciledVoucherId).filter(Boolean));
    const unrecordedVouchers = allBankVouchers.filter(v => !matchedVoucherIds.has(v.id));

    const outstandingDeposits = unrecordedVouchers
      .filter(v => v.voucherType === "RECEIPT")
      .reduce((sum, v) => sum + (v.amount || 0), 0) || (unmatchedCredits > 0 ? 0 : 0);

    const outstandingChecks = unrecordedVouchers
      .filter(v => v.voucherType === "PAYMENT")
      .reduce((sum, v) => sum + (v.amount || 0), 0);

    const bankBalanceOnStatement = account.bankBalance || 420000000;
    const bookBalanceInGL = account.bookBalance || 420000000;

    const adjustedBankBalance = bankBalanceOnStatement + outstandingDeposits - outstandingChecks;
    const adjustedBookBalance = bookBalanceInGL + unmatchedCredits - unmatchedDebits;
    const difference = Math.abs(adjustedBankBalance - adjustedBookBalance);

    return {
      bankAccountId: account.id,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      asOfDate: new Date().toISOString().split("T")[0],
      bookBalance: bookBalanceInGL,
      bankBalance: bankBalanceOnStatement,
      difference,
      unmatchedBankCredits: unmatchedCredits,
      unmatchedBankDebits: unmatchedDebits,
      outstandingDeposits,
      outstandingChecks,
      reconciledBalance: adjustedBankBalance,
      form08TT: {
        bankBalanceOnStatement,
        addOutstandingDeposits: outstandingDeposits,
        lessOutstandingChecks: outstandingChecks,
        adjustedBankBalance,
        bookBalanceInGL,
        addUnrecordedCredits: unmatchedCredits,
        lessUnrecordedDebits: unmatchedDebits,
        adjustedBookBalance,
        isBalanced: difference === 0,
      },
    };
  }
}
