import { db } from '../db/index';
import * as schema from '../db/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { accountingEngine } from './accountingEngine';
import { AuditService } from './auditService';
import crypto from 'crypto';

/**
 * Vietnamese Number-to-Words Converter for Official BTC Forms (01-TT & 02-TT)
 * Conforms to Circular 200/2014/TT-BTC & Circular 133/2016/TT-BTC
 */
export function numberToVietnameseWords(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) {
    return 'Không đồng chẵn.';
  }

  const rounded = Math.round(Math.abs(amount));
  if (rounded === 0) return 'Không đồng chẵn.';

  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

  function readThreeDigits(n: number, isLeading: boolean): string {
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const unit = n % 10;
    let res = '';

    if (hundred > 0) {
      res += `${digits[hundred]} trăm `;
    } else if (!isLeading) {
      res += 'không trăm ';
    }

    if (ten > 1) {
      res += `${digits[ten]} mươi `;
      if (unit === 1) res += 'mốt ';
      else if (unit === 5) res += 'lăm ';
      else if (unit > 0) res += `${digits[unit]} `;
    } else if (ten === 1) {
      res += 'mười ';
      if (unit === 5) res += 'lăm ';
      else if (unit > 0) res += `${digits[unit]} `;
    } else if (ten === 0 && unit > 0) {
      if (hundred > 0 || !isLeading) res += 'lẻ ';
      res += `${digits[unit]} `;
    }

    return res.trim();
  }

  let numStr = rounded.toString();
  const groups: number[] = [];
  while (numStr.length > 0) {
    const chunk = numStr.slice(-3);
    groups.unshift(parseInt(chunk, 10));
    numStr = numStr.slice(0, -3);
  }

  let result = '';
  const totalGroups = groups.length;

  for (let i = 0; i < totalGroups; i++) {
    const g = groups[i];
    if (g > 0) {
      const gText = readThreeDigits(g, i === 0);
      const unitIndex = totalGroups - 1 - i;
      result += `${gText} ${units[unitIndex]} `;
    }
  }

  result = result.trim().replace(/\s+/g, ' ');
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return `${result} đồng chẵn.`;
}

export interface TreasuryVoucherInput {
  voucherType: 'RECEIPT' | 'PAYMENT';
  voucherForm?: string; // 01-TT, 02-TT, UNC
  voucherCategory?: string; // REVENUE, EXPENSE, DEBT_COLLECTION, SUPPLIER_PAYMENT, SALARY, COMMISSION, RMA_REFUND, ADVANCE, OTHER
  partnerType?: 'CUSTOMER' | 'SUPPLIER' | 'EMPLOYEE' | 'PARTNER' | 'OTHER';
  partnerId?: number;
  partnerName: string;
  partnerAddress?: string;
  partnerTaxCode?: string;
  receiverOrPayerName?: string;
  amount: number;
  currency?: string;
  exchangeRate?: number;
  debitAccount?: string;
  creditAccount?: string;
  bankAccountId?: number;
  paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'E_WALLET' | 'CHECK';
  reason?: string;
  attachedDocsCount?: number;
  attachedDocsDescription?: string;
  sourceModule?: string; // M32, M13, M14, M15, M16, M28, M08, etc.
  sourceDocumentType?: string;
  sourceDocumentId?: number;
  sourceReferenceNo?: string;
  idempotencyKey?: string;
  autoApprove?: boolean;
  userId?: number;
  username?: string;
  branchId?: number;
  allowOverdraft?: boolean;
}

export interface TreasuryTransferInput {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  reason?: string;
  fee?: number;
  idempotencyKey?: string;
  userId?: number;
  username?: string;
  branchId?: number;
}

export interface CentralDisbursementRequest {
  sourceModule: 'M14' | 'M15' | 'M28' | 'M08' | 'M31' | 'M32' | string;
  sourceDocumentType: 'COMMISSION_PAYOUT' | 'RMA_REFUND' | 'PAYROLL_SLIP' | 'PURCHASE_ORDER' | 'VENDOR_INVOICE' | 'EXPENSE_CLAIM' | string;
  sourceDocumentId: number;
  sourceReferenceNo: string;
  partnerType: 'EMPLOYEE' | 'CUSTOMER' | 'SUPPLIER' | 'PARTNER' | 'OTHER';
  partnerId?: number;
  partnerName: string;
  partnerAddress?: string;
  partnerTaxCode?: string;
  receiverName?: string;
  amount: number;
  paymentMethod?: 'CASH' | 'BANK_TRANSFER';
  bankAccountId?: number;
  reason?: string;
  debitAccount?: string;
  creditAccount?: string;
  attachedDocsCount?: number;
  idempotencyKey?: string;
  autoApprove?: boolean;
  userId?: number;
  username?: string;
  branchId?: number;
}

export interface CentralCollectionRequest {
  sourceModule: 'M13' | 'M15' | 'M16' | 'M31' | 'M32' | string;
  sourceDocumentType: 'SALES_ORDER' | 'POS_SHIFT' | 'INVOICE_AR' | 'RMA_REVERSAL' | string;
  sourceDocumentId: number;
  sourceReferenceNo: string;
  partnerType: 'CUSTOMER' | 'SUPPLIER' | 'EMPLOYEE' | 'PARTNER' | 'OTHER';
  partnerId?: number;
  partnerName: string;
  partnerAddress?: string;
  partnerTaxCode?: string;
  payerName?: string;
  amount: number;
  paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'E_WALLET';
  bankAccountId?: number;
  reason?: string;
  debitAccount?: string;
  creditAccount?: string;
  attachedDocsCount?: number;
  idempotencyKey?: string;
  autoApprove?: boolean;
  userId?: number;
  username?: string;
  branchId?: number;
}

export class TreasuryService {
  /**
   * Phase 03: Cash Balance & Overdraft Guard
   * Verifies that the specified cash/bank account has sufficient available funds.
   */
  public static async guardAccountBalance(
    bankAccountId: number,
    requiredAmount: number,
    options: { allowOverdraft?: boolean; accountName?: string } = {}
  ): Promise<{
    allowed: boolean;
    currentBalance: number;
    requiredAmount: number;
    shortfall: number;
    account: any;
  }> {
    if (requiredAmount <= 0) {
      throw new Error('Số tiền giao dịch phải lớn hơn 0.');
    }

    const accounts = await db
      .select()
      .from(schema.bankAccounts)
      .where(eq(schema.bankAccounts.id, bankAccountId))
      .limit(1);

    if (accounts.length === 0) {
      throw new Error(`Không tìm thấy tài khoản ngân hàng / quỹ tiền mặt với ID [${bankAccountId}].`);
    }

    const account = accounts[0];
    const currentBalance = Number(account.bookBalance) || 0;

    if (!options.allowOverdraft && currentBalance < requiredAmount) {
      const shortfall = requiredAmount - currentBalance;
      const formattedBalance = currentBalance.toLocaleString('vi-VN');
      const formattedRequired = requiredAmount.toLocaleString('vi-VN');
      const formattedShortfall = shortfall.toLocaleString('vi-VN');

      const err = new Error(
        `[Cash Balance Guard] Số dư khả dụng của ${account.bankName} (${account.accountNumber}) không đủ thực hiện giao dịch: ` +
        `Hiện có ${formattedBalance} VNĐ < Cần chi ${formattedRequired} VNĐ (Thiếu hụt ${formattedShortfall} VNĐ). Giao dịch bị từ chối chống âm quỹ.`
      );
      (err as any).statusCode = 400;
      (err as any).shortfall = shortfall;
      (err as any).currentBalance = currentBalance;
      throw err;
    }

    return {
      allowed: true,
      currentBalance,
      requiredAmount,
      shortfall: 0,
      account,
    };
  }

  /**
   * Generates next sequential voucher code (PT-2026-XXXX or PC-2026-XXXX)
   */
  public static async generateNextVoucherCode(voucherType: 'RECEIPT' | 'PAYMENT'): Promise<string> {
    const prefix = voucherType === 'RECEIPT' ? 'PT' : 'PC';
    const year = new Date().getFullYear();
    const countRes = await db.select({ count: sql<number>`count(*)` }).from(schema.cashVouchers);
    const nextSeq = (countRes[0]?.count || 0) + 101;
    return `${prefix}-${year}-${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * Phase 04 & 05: Create Cash Voucher (01-TT / 02-TT) with Idempotency & Overdraft Guard
   */
  public static async createVoucher(input: TreasuryVoucherInput): Promise<any> {
    const {
      voucherType,
      voucherForm = voucherType === 'RECEIPT' ? '01-TT' : '02-TT',
      voucherCategory = voucherType === 'RECEIPT' ? 'DEBT_COLLECTION' : 'SUPPLIER_PAYMENT',
      partnerType = 'CUSTOMER',
      partnerId,
      partnerName,
      partnerAddress,
      partnerTaxCode,
      receiverOrPayerName,
      amount,
      currency = 'VND',
      exchangeRate = 1,
      bankAccountId,
      paymentMethod = 'BANK_TRANSFER',
      reason,
      attachedDocsCount = 0,
      attachedDocsDescription,
      sourceModule = 'M32',
      sourceDocumentType,
      sourceDocumentId,
      sourceReferenceNo,
      idempotencyKey,
      autoApprove = false,
      userId = 1,
      username = 'Admin',
      branchId,
      allowOverdraft = false,
    } = input;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      throw new Error('Số tiền chứng từ phải lớn hơn 0.');
    }

    // 1. Check Idempotency Key
    if (idempotencyKey) {
      const existing = await db
        .select()
        .from(schema.cashVouchers)
        .where(eq(schema.cashVouchers.idempotencyKey, idempotencyKey))
        .limit(1);

      if (existing.length > 0) {
        return {
          isIdempotentReplay: true,
          voucher: existing[0],
          message: `Giao dịch đã được xử lý trước đó (Idempotent replay: ${existing[0].voucherCode}).`,
        };
      }
    }

    // 2. Resolve Target Bank / Cash Account
    let account: any = null;
    if (bankAccountId) {
      const accRes = await db
        .select()
        .from(schema.bankAccounts)
        .where(eq(schema.bankAccounts.id, bankAccountId))
        .limit(1);
      account = accRes[0];
    }
    if (!account) {
      const allAccs = await db.select().from(schema.bankAccounts).all();
      // Prefer cash account for CASH, or first bank account
      if (paymentMethod === 'CASH') {
        account = allAccs.find(a => a.accountType === 'CASH') || allAccs[0];
      } else {
        account = allAccs.find(a => a.accountType === 'BANK') || allAccs[0];
      }
      if (!account) {
        account = { id: 1, bankName: 'Vietcombank (VCB)', accountNumber: '0071001234567', bookBalance: 1000000000 };
      }
    }

    // 3. If PAYMENT and autoApprove, verify balance immediately (Anti-Overdraft Guard)
    if (voucherType === 'PAYMENT' && autoApprove) {
      await this.guardAccountBalance(account.id, numAmount, { allowOverdraft });
    }

    // 4. Resolve Dynamic GL Accounts
    const glMapping = accountingEngine.resolveTreasuryGLMapping(
      voucherType,
      voucherCategory,
      paymentMethod,
      partnerType,
      input.debitAccount,
      input.creditAccount
    );

    const voucherCode = await this.generateNextVoucherCode(voucherType);
    const amountInWords = numberToVietnameseWords(numAmount);
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const generatedIdempotencyKey = idempotencyKey || `treasury-${voucherCode}-${crypto.randomUUID()}`;

    const newVoucherData: any = {
      voucherCode,
      voucherType,
      voucherForm,
      voucherCategory,
      partnerType,
      partnerId: partnerId || null,
      partnerName: partnerName || 'Đối Tác Doanh Nghiệp',
      partnerAddress: partnerAddress || null,
      partnerTaxCode: partnerTaxCode || null,
      receiverOrPayerName: receiverOrPayerName || partnerName || 'Người nộp/nhận tiền',
      amount: numAmount,
      amountInWords,
      currency,
      exchangeRate,
      debitAccount: glMapping.debitAccount,
      creditAccount: glMapping.creditAccount,
      bankAccountId: account.id,
      bankName: account.bankName,
      bankAccountNumber: account.accountNumber,
      paymentMethod,
      status: autoApprove ? 'APPROVED' : 'PENDING_APPROVAL',
      date: dateStr,
      postingDate: dateStr,
      reason: reason || (voucherType === 'RECEIPT' ? 'Thu tiền thanh toán' : 'Chi trả tiền dịch vụ/vật tư'),
      attachedDocsCount,
      attachedDocsDescription: attachedDocsDescription || null,
      sourceModule,
      sourceDocumentType: sourceDocumentType || null,
      sourceDocumentId: sourceDocumentId || null,
      sourceReferenceNo: sourceReferenceNo || null,
      idempotencyKey: generatedIdempotencyKey,
      accountingEntry: `Nợ TK ${glMapping.debitAccount} / Có TK ${glMapping.creditAccount}`,
      postedGL: autoApprove,
      createdBy: username,
      createdById: userId,
      approvedBy: autoApprove ? 'CFO - Nguyễn Thị Hương' : null,
      approvedById: autoApprove ? userId : null,
      approvedAt: autoApprove ? now : null,
      directorSignature: autoApprove ? 'Giám Đốc (Đã ký số điện tử)' : null,
      chiefAccountantSignature: autoApprove ? 'Kế Toán Trưởng (Đã ký số)' : null,
      cashierSignature: autoApprove ? 'Thủ Quỹ (Đã xác nhận)' : null,
      preparerSignature: `${username} (Người lập biểu)`,
    };

    // 5. Insert Voucher into Database
    const inserted = await db.insert(schema.cashVouchers).values(newVoucherData).returning();
    const createdVoucher = inserted[0] || newVoucherData;

    let glEntry: any = null;

    // 6. If Auto-Approved: Post GL (Single-Writer) and Update Account Balance atomically
    if (autoApprove) {
      // Update account balance
      const delta = voucherType === 'RECEIPT' ? numAmount : -numAmount;
      const accs = await db.select().from(schema.bankAccounts).where(eq(schema.bankAccounts.id, account.id)).limit(1);
      if (accs[0]) {
        const newBook = (Number(accs[0].bookBalance) || 0) + delta;
        const newBank = (Number(accs[0].bankBalance) || 0) + delta;
        await db
          .update(schema.bankAccounts)
          .set({
            bookBalance: newBook,
            bankBalance: newBank,
          })
          .where(eq(schema.bankAccounts.id, account.id));
      }

      // Single-Writer GL Journal Post via AccountingEngine (M30 Authority)
      glEntry = await accountingEngine.postTreasuryVoucherJournal({
        voucherId: createdVoucher.id,
        voucherCode: createdVoucher.voucherCode,
        voucherType: createdVoucher.voucherType,
        voucherCategory: createdVoucher.voucherCategory,
        amount: createdVoucher.amount,
        debitAccount: createdVoucher.debitAccount,
        creditAccount: createdVoucher.creditAccount,
        paymentMethod: createdVoucher.paymentMethod,
        partnerType: createdVoucher.partnerType,
        partnerId: createdVoucher.partnerId,
        partnerName: createdVoucher.partnerName,
        description: createdVoucher.reason,
        branchId,
        userId,
      });

      if (glEntry && glEntry.id) {
        await db
          .update(schema.cashVouchers)
          .set({
            accountingEntryId: glEntry.id,
            postedGL: true,
          } as any)
          .where(eq(schema.cashVouchers.id, createdVoucher.id));
      }

      // Sync Origin Module Status (M13 Sales Orders / M31 Invoices)
      await TreasuryService.syncOriginDocumentPayment({
        voucherCode: createdVoucher.voucherCode,
        sourceModule: createdVoucher.sourceModule,
        sourceDocumentType: createdVoucher.sourceDocumentType,
        sourceDocumentId: createdVoucher.sourceDocumentId,
        sourceReferenceNo: createdVoucher.sourceReferenceNo,
        amount: numAmount,
        paymentMethod: createdVoucher.paymentMethod,
        userId,
      });
    }

    // 7. Record Cryptographic Audit Log (M02)
    await AuditService.recordAuditLog({
      module: 'M32',
      action: autoApprove ? 'CREATE_AND_APPROVE_VOUCHER' : 'CREATE_VOUCHER',
      entityType: 'CASH_VOUCHER',
      entityId: createdVoucher.voucherCode || createdVoucher.id,
      userId,
      username,
      afterData: createdVoucher,
      result: 'SUCCESS',
      metadata: {
        voucherForm,
        voucherType,
        amount: numAmount,
        bankAccountId: account.id,
        postedGL: autoApprove,
        glEntryId: glEntry?.id,
        idempotencyKey: generatedIdempotencyKey,
      },
    });

    return {
      success: true,
      isIdempotentReplay: false,
      voucher: createdVoucher,
      glEntry,
      message: autoApprove
        ? `Đã khởi tạo và duyệt ${voucherType === 'RECEIPT' ? 'Phiếu Thu (01-TT)' : 'Phiếu Chi (02-TT)'} [${voucherCode}] thành công. Đã cập nhật quỹ và post Sổ cái GL.`
        : `Đã lập ${voucherType === 'RECEIPT' ? 'Phiếu Thu (01-TT)' : 'Phiếu Chi (02-TT)'} [${voucherCode}] thành công. Đã chuyển sang hàng chờ duyệt CFO.`,
    };
  }

  /**
   * Phase 03 & 04: Approve Cash Voucher with Overdraft Guard, GL Post (M30 Single-Writer) and Audit Log (M02)
   */
  public static async approveVoucher(params: {
    voucherId: number;
    userId?: number;
    username?: string;
    approverName?: string;
    allowOverdraft?: boolean;
    branchId?: number;
  }): Promise<any> {
    const {
      voucherId,
      userId = 1,
      username = 'cfo_admin',
      approverName = 'CFO - Nguyễn Thị Hương',
      allowOverdraft = false,
      branchId,
    } = params;

    const vouchers = await db
      .select()
      .from(schema.cashVouchers)
      .where(eq(schema.cashVouchers.id, voucherId))
      .limit(1);

    if (vouchers.length === 0) {
      throw new Error(`Không tìm thấy chứng từ thu/chi ID [${voucherId}].`);
    }

    const voucher = vouchers[0];

    if (voucher.status === 'APPROVED' || voucher.status === 'POSTED') {
      return {
        success: true,
        alreadyProcessed: true,
        alreadyApproved: true,
        voucher,
        message: `Chứng từ [${voucher.voucherCode}] đã được phê duyệt trước đó (Bất biến).`,
      };
    }

    const numAmount = Number(voucher.amount) || 0;

    // 1. Guard Account Balance on PAYMENT (Anti-Overdraft Guard)
    if (voucher.voucherType === 'PAYMENT' && voucher.bankAccountId) {
      await this.guardAccountBalance(voucher.bankAccountId, numAmount, {
        allowOverdraft,
      });
    }

    const now = new Date();

    // 2. Atomic Compare-and-Swap Status Transition
    const updateRes = await db
      .update(schema.cashVouchers)
      .set({
        status: 'APPROVED',
        approvedBy: approverName,
        approvedById: userId,
        approvedAt: now,
        postedGL: true,
        directorSignature: 'Giám Đốc (Đã ký số điện tử)',
        chiefAccountantSignature: `${approverName} (Kế toán trưởng phê duyệt)`,
        cashierSignature: 'Thủ Quỹ (Xác nhận xuất/nhập quỹ)',
        updatedAt: now,
      } as any)
      .where(and(eq(schema.cashVouchers.id, voucherId), eq(schema.cashVouchers.status, 'PENDING_APPROVAL')))
      .returning();

    if (updateRes.length === 0) {
      // Concurrency collision: another process just approved this voucher
      const latest = await db.select().from(schema.cashVouchers).where(eq(schema.cashVouchers.id, voucherId)).limit(1);
      return {
        success: true,
        alreadyProcessed: true,
        alreadyApproved: true,
        voucher: latest[0] || voucher,
        message: `ALREADY_PROCESSED: Chứng từ [${voucher.voucherCode}] đã được xử lý thành công bởi tiến trình song song.`,
      };
    }

    // 3. Update Bank Account Book & Bank Balance
    if (voucher.bankAccountId) {
      const delta = voucher.voucherType === 'RECEIPT' ? numAmount : -numAmount;
      const accs = await db.select().from(schema.bankAccounts).where(eq(schema.bankAccounts.id, voucher.bankAccountId)).limit(1);
      if (accs[0]) {
        const newBook = (Number(accs[0].bookBalance) || 0) + delta;
        const newBank = (Number(accs[0].bankBalance) || 0) + delta;
        await db
          .update(schema.bankAccounts)
          .set({
            bookBalance: newBook,
            bankBalance: newBank,
          })
          .where(eq(schema.bankAccounts.id, voucher.bankAccountId));
      }
    }

    // 4. Post balanced GL Journal Entry via M30 AccountingEngine (Single-Writer)
    const glEntry = await accountingEngine.postTreasuryVoucherJournal({
      voucherId: voucher.id,
      voucherCode: voucher.voucherCode,
      voucherType: voucher.voucherType as 'RECEIPT' | 'PAYMENT',
      voucherCategory: voucher.voucherCategory || undefined,
      amount: numAmount,
      debitAccount: voucher.debitAccount || undefined,
      creditAccount: voucher.creditAccount || undefined,
      paymentMethod: voucher.paymentMethod || 'BANK_TRANSFER',
      partnerType: voucher.partnerType || undefined,
      partnerId: voucher.partnerId || undefined,
      partnerName: voucher.partnerName,
      description: voucher.reason || undefined,
      branchId,
      userId,
    });

    if (glEntry && glEntry.id) {
      await db
        .update(schema.cashVouchers)
        .set({
          accountingEntryId: glEntry.id,
        } as any)
        .where(eq(schema.cashVouchers.id, voucherId));
    }

    // Sync Origin Module Status (M13 Sales Orders / M31 Invoices)
    await TreasuryService.syncOriginDocumentPayment({
      voucherCode: voucher.voucherCode,
      sourceModule: voucher.sourceModule,
      sourceDocumentType: voucher.sourceDocumentType,
      sourceDocumentId: voucher.sourceDocumentId,
      sourceReferenceNo: voucher.sourceReferenceNo,
      amount: numAmount,
      paymentMethod: voucher.paymentMethod,
      userId,
    });

    // 5. Record Cryptographic Audit Log (M02)
    await AuditService.recordAuditLog({
      module: 'M32',
      action: 'APPROVE_TREASURY_VOUCHER',
      entityType: 'CASH_VOUCHER',
      entityId: voucher.voucherCode,
      userId,
      username,
      afterData: { ...voucher, status: 'APPROVED', approvedBy: approverName },
      result: 'SUCCESS',
      metadata: {
        voucherCode: voucher.voucherCode,
        amount: numAmount,
        glEntryId: glEntry?.id,
      },
    });

    const updatedVoucher = {
      ...voucher,
      status: 'APPROVED',
      approvedBy: approverName,
      approvedAt: now,
      postedGL: true,
      accountingEntryId: glEntry?.id,
    };

    return {
      success: true,
      voucher: updatedVoucher,
      glEntry,
      accountingEntryId: glEntry?.id,
      message: `Đã phê duyệt ${voucher.voucherType === 'RECEIPT' ? 'Phiếu Thu (Mẫu 01-TT)' : 'Phiếu Chi (Mẫu 02-TT)'} [${voucher.voucherCode}]. Số dư quỹ và bút toán Sổ cái GL đã được ghi nhận tự động.`,
    };
  }

  /**
   * Phase 07: Cancel Voucher with Cryptographic Audit Logging (M02) and Balance Rollback
   */
  public static async cancelVoucher(params: {
    voucherId: number;
    reason: string;
    userId?: number;
    username?: string;
  }): Promise<any> {
    const { voucherId, reason, userId = 1, username = 'Admin' } = params;

    const vouchers = await db
      .select()
      .from(schema.cashVouchers)
      .where(eq(schema.cashVouchers.id, voucherId))
      .limit(1);

    if (vouchers.length === 0) {
      throw new Error(`Không tìm thấy chứng từ với ID [${voucherId}].`);
    }

    const voucher = vouchers[0];

    if (voucher.status === 'CANCELLED') {
      return {
        alreadyCancelled: true,
        voucher,
        message: `Chứng từ [${voucher.voucherCode}] đã được hủy trước đó.`,
      };
    }

    const numAmount = Number(voucher.amount) || 0;
    const now = new Date();

    // Rollback balance if it was already approved
    if ((voucher.status === 'APPROVED' || voucher.status === 'POSTED') && voucher.bankAccountId) {
      const rollbackDelta = voucher.voucherType === 'RECEIPT' ? -numAmount : numAmount;
      const accs = await db.select().from(schema.bankAccounts).where(eq(schema.bankAccounts.id, voucher.bankAccountId)).limit(1);
      if (accs[0]) {
        const newBook = (Number(accs[0].bookBalance) || 0) + rollbackDelta;
        const newBank = (Number(accs[0].bankBalance) || 0) + rollbackDelta;
        await db
          .update(schema.bankAccounts)
          .set({
            bookBalance: newBook,
            bankBalance: newBank,
          })
          .where(eq(schema.bankAccounts.id, voucher.bankAccountId));
      }
    }

    // Update status to CANCELLED
    await db
      .update(schema.cashVouchers)
      .set({
        status: 'CANCELLED',
        reason: `${voucher.reason || ''} [HỦY CHỨNG TỪ: ${reason}]`.trim(),
        updatedAt: now,
      } as any)
      .where(eq(schema.cashVouchers.id, voucherId));

    // Record Cryptographic Audit Log (M02)
    await AuditService.recordAuditLog({
      module: 'M32',
      action: 'CANCEL_TREASURY_VOUCHER',
      entityType: 'CASH_VOUCHER',
      entityId: voucher.voucherCode,
      userId,
      username,
      beforeData: voucher,
      afterData: { ...voucher, status: 'CANCELLED', cancelReason: reason },
      result: 'SUCCESS',
      metadata: {
        voucherCode: voucher.voucherCode,
        amount: numAmount,
        cancelReason: reason,
        rolledBackBalance: voucher.status === 'APPROVED' || voucher.status === 'POSTED',
      },
    });

    return {
      success: true,
      message: `Đã hủy chứng từ [${voucher.voucherCode}] thành công và ghi nhật ký kiểm toán M02.`,
      voucher: { ...voucher, status: 'CANCELLED' },
    };
  }

  /**
   * Phase 03 & 04: Internal Fund Transfer (M32-F05) with Overdraft Guard & Single-Writer GL
   */
  public static async executeTransfer(input: TreasuryTransferInput): Promise<any> {
    const {
      fromAccountId,
      toAccountId,
      amount,
      reason = 'Điều chuyển vốn nội bộ',
      fee = 0,
      idempotencyKey,
      userId = 1,
      username = 'CFO - Nguyễn Thị Hương',
      branchId,
    } = input;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      throw new Error('Số tiền điều chuyển phải lớn hơn 0.');
    }

    if (fromAccountId === toAccountId) {
      throw new Error('Tài khoản trích tiền và tài khoản thụ hưởng không được trùng nhau.');
    }

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existing = await db
        .select()
        .from(schema.treasuryTransfers)
        .where(eq(schema.treasuryTransfers.transferCode, idempotencyKey))
        .limit(1);

      if (existing.length > 0) {
        return {
          isIdempotentReplay: true,
          transfer: existing[0],
          message: `Giao dịch điều chuyển đã được xử lý trước đó (Idempotent replay: ${existing[0].transferCode}).`,
        };
      }
    }

    // 2. Overdraft Guard on source account
    const fromGuard = await this.guardAccountBalance(fromAccountId, numAmount + fee, {
      allowOverdraft: false,
    });

    const toAccRes = await db
      .select()
      .from(schema.bankAccounts)
      .where(eq(schema.bankAccounts.id, toAccountId))
      .limit(1);

    if (toAccRes.length === 0) {
      throw new Error(`Không tìm thấy tài khoản đích ID [${toAccountId}].`);
    }

    const fromAcc = fromGuard.account;
    const toAcc = toAccRes[0];
    const now = new Date();

    // 3. Atomically update balances
    await db
      .update(schema.bankAccounts)
      .set({
        bookBalance: sql`${schema.bankAccounts.bookBalance} - ${numAmount + fee}`,
        bankBalance: sql`${schema.bankAccounts.bankBalance} - ${numAmount + fee}`,
        updatedAt: now,
      } as any)
      .where(eq(schema.bankAccounts.id, fromAcc.id));

    await db
      .update(schema.bankAccounts)
      .set({
        bookBalance: sql`${schema.bankAccounts.bookBalance} + ${numAmount}`,
        bankBalance: sql`${schema.bankAccounts.bankBalance} + ${numAmount}`,
        updatedAt: now,
      } as any)
      .where(eq(schema.bankAccounts.id, toAcc.id));

    // 4. Generate transfer record
    const allTransfers = await db.select({ count: sql<number>`count(*)` }).from(schema.treasuryTransfers);
    const transferCode = idempotencyKey || `TRF-${now.getFullYear()}-${String((allTransfers[0]?.count || 0) + 101).padStart(4, '0')}`;

    const newTransferData = {
      transferCode,
      fromAccountId: fromAcc.id,
      fromBankName: fromAcc.bankName,
      toAccountId: toAcc.id,
      toBankName: toAcc.bankName,
      amount: numAmount,
      fee: Number(fee) || 0,
      status: 'COMPLETED',
      date: now.toISOString().slice(0, 10),
      reason,
      accountingEntry: `Nợ TK ${toAcc.accountType === 'CASH' ? '1111' : '1121'} / Có TK ${fromAcc.accountType === 'CASH' ? '1111' : '1121'}`,
      createdBy: username,
      createdAt: now,
    };

    const inserted = await db.insert(schema.treasuryTransfers).values(newTransferData).returning();
    const createdTransfer = inserted[0] || newTransferData;

    // 5. Post Sổ cái GL via M30 AccountingEngine (Single-Writer)
    const glEntry = await accountingEngine.postTreasuryTransferJournal({
      transferId: createdTransfer.id,
      transferCode: createdTransfer.transferCode,
      fromAccountType: fromAcc.accountType,
      toAccountType: toAcc.accountType,
      amount: numAmount,
      description: reason,
      branchId,
      userId,
    });

    // 6. Record Audit Log (M02)
    await AuditService.recordAuditLog({
      module: 'M32',
      action: 'EXECUTE_TREASURY_TRANSFER',
      entityType: 'TREASURY_TRANSFER',
      entityId: createdTransfer.transferCode,
      userId,
      username,
      afterData: createdTransfer,
      result: 'SUCCESS',
      metadata: {
        fromAccountId: fromAcc.id,
        toAccountId: toAcc.id,
        amount: numAmount,
        glEntryId: glEntry?.id,
      },
    });

    return {
      success: true,
      transfer: createdTransfer,
      glEntry,
      message: `Đã điều chuyển ${numAmount.toLocaleString('vi-VN')} VNĐ từ [${fromAcc.bankName}] sang [${toAcc.bankName}] thành công. Đã post Sổ cái GL.`,
    };
  }

  /**
   * Phase 06: Central Treasury Disbursement Gateway (M32-F06)
   * Authorized single-point-of-contact for external modules (M14 Commission, M15 RMA, M28 Payroll, M08 AP)
   * External modules MUST NOT post GL directly for cash/bank payouts.
   */
  public static async authorizeDisbursementGateway(req: CentralDisbursementRequest): Promise<any> {
    const {
      sourceModule,
      sourceDocumentType,
      sourceDocumentId,
      sourceReferenceNo,
      partnerType,
      partnerId,
      partnerName,
      partnerAddress,
      partnerTaxCode,
      receiverName,
      amount,
      paymentMethod = 'BANK_TRANSFER',
      bankAccountId,
      reason,
      debitAccount,
      creditAccount,
      attachedDocsCount = 1,
      idempotencyKey,
      autoApprove = true,
      userId = 1,
      username = 'System Delegate',
      branchId,
    } = req;

    // Resolve category
    let voucherCategory = 'EXPENSE';
    if (sourceModule === 'M14' || sourceDocumentType === 'COMMISSION_PAYOUT') {
      voucherCategory = 'COMMISSION';
    } else if (sourceModule === 'M15' || sourceDocumentType === 'RMA_REFUND') {
      voucherCategory = 'RMA_REFUND';
    } else if (sourceModule === 'M28' || sourceDocumentType === 'PAYROLL_SLIP') {
      voucherCategory = 'SALARY';
    } else if (sourceModule === 'M08' || sourceDocumentType === 'PURCHASE_ORDER' || sourceDocumentType === 'VENDOR_INVOICE') {
      voucherCategory = 'SUPPLIER_PAYMENT';
    }

    const defaultReason = reason || `[${sourceModule}] Chi tiền giải ngân cho ${sourceReferenceNo} - ${partnerName}`;
    const generatedKey = idempotencyKey || `disburse-${sourceModule}-${sourceReferenceNo}-${crypto.randomUUID().slice(0, 8)}`;

    return await this.createVoucher({
      voucherType: 'PAYMENT',
      voucherForm: '02-TT',
      voucherCategory,
      partnerType: partnerType || 'OTHER',
      partnerId,
      partnerName,
      partnerAddress,
      partnerTaxCode,
      receiverOrPayerName: receiverName || partnerName,
      amount,
      bankAccountId,
      paymentMethod,
      reason: defaultReason,
      debitAccount,
      creditAccount,
      attachedDocsCount,
      attachedDocsDescription: `Chứng từ gốc từ phân hệ ${sourceModule} (${sourceReferenceNo})`,
      sourceModule,
      sourceDocumentType,
      sourceDocumentId,
      sourceReferenceNo,
      idempotencyKey: generatedKey,
      autoApprove,
      userId,
      username: `${username} (${sourceModule})`,
      branchId,
      allowOverdraft: false,
    });
  }

  /**
   * Phase 06: Central Treasury Collection Gateway (M32-F06)
   * Authorized single-point-of-contact for external incoming revenue/debt collections (M13 SO, M16 POS, M31 AR)
   */
  public static async authorizeCollectionGateway(req: CentralCollectionRequest): Promise<any> {
    const {
      sourceModule,
      sourceDocumentType,
      sourceDocumentId,
      sourceReferenceNo,
      partnerType,
      partnerId,
      partnerName,
      partnerAddress,
      partnerTaxCode,
      payerName,
      amount,
      paymentMethod = 'BANK_TRANSFER',
      bankAccountId,
      reason,
      debitAccount,
      creditAccount,
      attachedDocsCount = 1,
      idempotencyKey,
      autoApprove = true,
      userId = 1,
      username = 'System Delegate',
      branchId,
    } = req;

    let voucherCategory = 'DEBT_COLLECTION';
    if (sourceModule === 'M16' || sourceDocumentType === 'POS_SHIFT') {
      voucherCategory = 'REVENUE';
    } else if (sourceModule === 'M13' || sourceDocumentType === 'SALES_ORDER') {
      voucherCategory = 'DEBT_COLLECTION';
    }

    const defaultReason = reason || `[${sourceModule}] Thu tiền thanh toán cho ${sourceReferenceNo} - ${partnerName}`;
    const generatedKey = idempotencyKey || `collect-${sourceModule}-${sourceReferenceNo}-${crypto.randomUUID().slice(0, 8)}`;

    return await this.createVoucher({
      voucherType: 'RECEIPT',
      voucherForm: '01-TT',
      voucherCategory,
      partnerType: partnerType || 'CUSTOMER',
      partnerId,
      partnerName,
      partnerAddress,
      partnerTaxCode,
      receiverOrPayerName: payerName || partnerName,
      amount,
      bankAccountId,
      paymentMethod,
      reason: defaultReason,
      debitAccount,
      creditAccount,
      attachedDocsCount,
      attachedDocsDescription: `Chứng từ gốc từ phân hệ ${sourceModule} (${sourceReferenceNo})`,
      sourceModule,
      sourceDocumentType,
      sourceDocumentId,
      sourceReferenceNo,
      idempotencyKey: generatedKey,
      autoApprove,
      userId,
      username: `${username} (${sourceModule})`,
      branchId,
      allowOverdraft: false,
    });
  }

  public static async authorizeDisbursement(req: any): Promise<any> {
    return await this.authorizeDisbursementGateway({
      ...req,
      partnerType: req.beneficiaryType || req.partnerType,
      partnerName: req.beneficiaryName || req.partnerName,
      receiverName: req.receiverName || req.beneficiaryName || req.partnerName,
    });
  }

  public static async createExternalDisbursement(req: any): Promise<any> {
    return await this.authorizeDisbursement(req);
  }

  public static async authorizeCollection(req: any): Promise<any> {
    return await this.authorizeCollectionGateway(req);
  }

  public static async createExternalCollection(req: any): Promise<any> {
    return await this.authorizeCollectionGateway(req);
  }

  /**
   * Summary Statistics for Treasury Dashboard
   */
  public static async getTreasuryStats(): Promise<any> {
    const vouchers = await db.select().from(schema.cashVouchers).all();
    const bankAccs = await db.select().from(schema.bankAccounts).all();

    let totalReceipts = 0;
    let totalPayments = 0;
    let pendingApprovalCount = 0;
    let pendingApprovalAmount = 0;
    let approvedCount = 0;

    vouchers.forEach((v) => {
      const amt = Number(v.amount) || 0;
      if (v.voucherType === 'RECEIPT') {
        totalReceipts += amt;
      } else {
        totalPayments += amt;
      }
      if (v.status === 'PENDING_APPROVAL' || v.status === 'DRAFT') {
        pendingApprovalCount++;
        pendingApprovalAmount += amt;
      } else if (v.status === 'APPROVED' || v.status === 'POSTED') {
        approvedCount++;
      }
    });

    let totalCash = 0;
    let totalBank = 0;
    bankAccs.forEach((a) => {
      const bal = Number(a.bookBalance) || 0;
      if (a.accountType === 'CASH') {
        totalCash += bal;
      } else {
        totalBank += bal;
      }
    });

    return {
      totalReceipts,
      totalPayments,
      netTreasuryFlow: totalReceipts - totalPayments,
      totalCash,
      totalBank,
      totalCashAndBank: totalCash + totalBank,
      pendingApprovalCount,
      pendingApprovalAmount,
      approvedCount,
      totalVouchers: vouchers.length,
      accountCount: bankAccs.length,
    };
  }

  /**
   * Rich Dataset for Printing BTC Official Forms (01-TT & 02-TT)
   */
  public static async getPrintableForm(voucherId: number): Promise<any> {
    const vouchers = await db
      .select()
      .from(schema.cashVouchers)
      .where(eq(schema.cashVouchers.id, voucherId))
      .limit(1);

    if (vouchers.length === 0) {
      throw new Error(`Không tìm thấy chứng từ với ID ${voucherId}`);
    }

    const v = vouchers[0];
    const isReceipt = v.voucherType === 'RECEIPT';
    const formCode = isReceipt ? 'Mẫu 01 - TT' : 'Mẫu 02 - TT';
    const formTitle = isReceipt ? 'PHIẾU THU' : 'PHIẾU CHI';
    const legalDoc = '(Ban hành theo Thông tư số 200/2014/TT-BTC & TT 133/2016/TT-BTC của Bộ Tài chính)';

    const amountInWords = v.amountInWords || numberToVietnameseWords(v.amount);

    return {
      companyInfo: {
        name: 'TẬP ĐOÀN CÔNG NGHỆ & THƯƠNG MẠI NEXUSSYNC CORP',
        address: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh',
        taxCode: '0316889988',
        phone: '(+84) 28 7300 8888',
      },
      formMetadata: {
        formCode,
        formTitle,
        legalDoc,
        voucherCode: v.voucherCode,
        voucherForm: v.voucherForm,
        voucherType: v.voucherType,
        voucherCategory: v.voucherCategory,
        date: v.date,
        postingDate: v.postingDate || v.date,
        debitAccount: v.debitAccount || (isReceipt ? '1111' : '331'),
        creditAccount: v.creditAccount || (isReceipt ? '131' : '1111'),
      },
      partnerInfo: {
        fullName: v.receiverOrPayerName || v.partnerName,
        partnerName: v.partnerName,
        address: v.partnerAddress || 'Việt Nam',
        taxCode: v.partnerTaxCode || 'N/A',
        reason: v.reason || (isReceipt ? 'Thu tiền bán hàng / công nợ' : 'Chi trả tiền hàng / dịch vụ'),
      },
      financialInfo: {
        amount: v.amount,
        amountInWords,
        currency: v.currency || 'VND',
        exchangeRate: v.exchangeRate || 1,
        attachedDocsCount: v.attachedDocsCount || 0,
        attachedDocsDescription: v.attachedDocsDescription || 'Không đính kèm',
        bankName: v.bankName,
        bankAccountNumber: v.bankAccountNumber,
        paymentMethod: v.paymentMethod,
      },
      signatures: {
        director: { title: 'Giám đốc', name: 'Trần Đại Quang (CEO)', signed: !!v.directorSignature, note: v.directorSignature },
        chiefAccountant: { title: 'Kế toán trưởng', name: v.approvedBy || 'Nguyễn Thị Hương (CFO)', signed: !!v.chiefAccountantSignature, note: v.chiefAccountantSignature },
        cashier: { title: 'Thủ quỹ', name: 'Phạm Thu Trang', signed: !!v.cashierSignature, note: v.cashierSignature },
        receiverOrPayer: { title: isReceipt ? 'Người nộp tiền' : 'Người nhận tiền', name: v.receiverOrPayerName || v.partnerName, signed: !!v.payerOrReceiverSignature, note: v.payerOrReceiverSignature },
        preparer: { title: 'Người lập biểu', name: v.createdBy || 'Hoàng Nam', signed: true, note: v.preparerSignature },
      },
      accounting: {
        postedGL: v.postedGL,
        accountingEntry: v.accountingEntry,
        accountingEntryId: v.accountingEntryId,
      },
    };
  }

  /**
   * Ensures rich initial default seed data for Treasury according to TT200 / TT133
   */
  public static async ensureSeedData(): Promise<void> {
    const existing = await db.select().from(schema.cashVouchers).limit(1);
    if (existing.length === 0) {
      const sampleVouchers: TreasuryVoucherInput[] = [
        {
          voucherType: 'RECEIPT',
          voucherForm: '01-TT',
          voucherCategory: 'DEBT_COLLECTION',
          partnerType: 'CUSTOMER',
          partnerName: 'Công ty Cổ phần Tập đoàn Hòa Phát',
          partnerAddress: 'Khu công nghiệp Phố Nối A, Xã Giai Phạm, Huyện Yên Mỹ, Hưng Yên',
          partnerTaxCode: '0900189284',
          receiverOrPayerName: 'Nguyễn Văn Long (Kế toán thanh toán)',
          amount: 185000000,
          paymentMethod: 'BANK_TRANSFER',
          bankAccountId: 1,
          debitAccount: '1121',
          creditAccount: '131',
          reason: 'Thu tiền thanh toán đợt 1 Hợp đồng cung cấp giải pháp ERP HP-2026/08',
          attachedDocsCount: 2,
          attachedDocsDescription: 'Hóa đơn GTGT điện tử số 001289 và Biên bản đối chiếu công nợ',
          sourceModule: 'M13',
          sourceDocumentType: 'SALES_ORDER',
          sourceReferenceNo: 'SO-2026-0089',
          autoApprove: true,
          username: 'Trần Văn Bình',
        },
        {
          voucherType: 'PAYMENT',
          voucherForm: '02-TT',
          voucherCategory: 'SUPPLIER_PAYMENT',
          partnerType: 'SUPPLIER',
          partnerName: 'Công ty TNHH Thiết Bị & Công Nghệ Sao Mai',
          partnerAddress: 'Tầng 5, Tòa nhà Detech, Số 8 Tôn Thất Thuyết, Cầu Giấy, Hà Nội',
          partnerTaxCode: '0102345678',
          receiverOrPayerName: 'Lê Thị Thu Hà',
          amount: 75000000,
          paymentMethod: 'BANK_TRANSFER',
          bankAccountId: 1,
          debitAccount: '331',
          creditAccount: '1121',
          reason: 'Thanh toán tiền mua máy chủ Dell PowerEdge R750 theo PO-2026-112',
          attachedDocsCount: 3,
          attachedDocsDescription: 'PO-2026-112, Hóa đơn GTGT đầu vào số 000456, Biên bản bàn giao kỹ thuật',
          sourceModule: 'M08',
          sourceDocumentType: 'PURCHASE_ORDER',
          sourceReferenceNo: 'PO-2026-0112',
          autoApprove: true,
          username: 'Lê Minh Tuấn',
        },
        {
          voucherType: 'PAYMENT',
          voucherForm: '02-TT',
          voucherCategory: 'COMMISSION',
          partnerType: 'EMPLOYEE',
          partnerName: 'Nguyễn Đình Trọng (Chuyên viên Sales B2B)',
          partnerAddress: 'Quận 7, TP. Hồ Chí Minh',
          partnerTaxCode: '8023456789',
          receiverOrPayerName: 'Nguyễn Đình Trọng',
          amount: 14500000,
          paymentMethod: 'CASH',
          bankAccountId: 3, // Cash
          debitAccount: '641',
          creditAccount: '1111',
          reason: 'Chi trả hoa hồng bán hàng vượt KPI Quý 3/2026',
          attachedDocsCount: 1,
          attachedDocsDescription: 'Bảng tổng hợp tính thưởng hoa hồng M14 đã duyệt',
          sourceModule: 'M14',
          sourceDocumentType: 'COMMISSION_PAYOUT',
          sourceReferenceNo: 'COM-2026-Q3-01',
          autoApprove: true,
          username: 'Đỗ Thị Lan',
        },
        {
          voucherType: 'PAYMENT',
          voucherForm: '02-TT',
          voucherCategory: 'RMA_REFUND',
          partnerType: 'CUSTOMER',
          partnerName: 'Công ty Cổ phần Bán Lẻ An Phát',
          partnerAddress: '49 Thái Hà, Đống Đa, Hà Nội',
          partnerTaxCode: '0101899988',
          receiverOrPayerName: 'Vũ Quốc Hùng',
          amount: 8200000,
          paymentMethod: 'BANK_TRANSFER',
          bankAccountId: 1,
          debitAccount: '521',
          creditAccount: '1121',
          reason: 'Hoàn tiền trả hàng RMA do linh kiện lỗi kỹ thuật không thể khắc phục',
          attachedDocsCount: 2,
          attachedDocsDescription: 'Biên bản giám định RMA-2026-0045 và Phiếu nhập kho trả hàng',
          sourceModule: 'M15',
          sourceDocumentType: 'RMA_REFUND',
          sourceReferenceNo: 'RMA-2026-0045',
          autoApprove: true,
          username: 'Nguyễn Thúy Hằng',
        },
        {
          voucherType: 'RECEIPT',
          voucherForm: '01-TT',
          voucherCategory: 'ADVANCE_REFUND',
          partnerType: 'EMPLOYEE',
          partnerName: 'Phạm Đức Toàn (Trưởng phòng Triển khai)',
          partnerAddress: 'Tân Bình, TP. Hồ Chí Minh',
          partnerTaxCode: '8112345678',
          receiverOrPayerName: 'Phạm Đức Toàn',
          amount: 4500000,
          paymentMethod: 'CASH',
          bankAccountId: 3, // Cash
          debitAccount: '1111',
          creditAccount: '141',
          reason: 'Thu hoàn ứng công tác phí dự án Nhà máy Gang Thép Dung Quất',
          attachedDocsCount: 4,
          attachedDocsDescription: 'Bảng quyết toán công tác phí, Vé máy bay, Hóa đơn khách sạn',
          sourceModule: 'MANUAL',
          sourceDocumentType: 'ADVANCE_SETTLEMENT',
          sourceReferenceNo: 'ADV-2026-089',
          autoApprove: false, // In approval queue
          username: 'Phạm Đức Toàn',
        },
        {
          voucherType: 'PAYMENT',
          voucherForm: '02-TT',
          voucherCategory: 'EXPENSE',
          partnerType: 'OTHER',
          partnerName: 'Tổng Công ty Điện lực Miền Nam (EVN SPC)',
          partnerAddress: '72 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. HCM',
          partnerTaxCode: '0300942001',
          receiverOrPayerName: 'EVN SPC',
          amount: 32400000,
          paymentMethod: 'BANK_TRANSFER',
          bankAccountId: 2,
          debitAccount: '642',
          creditAccount: '1121',
          reason: 'Thanh toán tiền điện vận hành văn phòng và trung tâm dữ liệu Tháng 08/2026',
          attachedDocsCount: 1,
          attachedDocsDescription: 'Hóa đơn tiền điện điện tử EVN-08/2026',
          sourceModule: 'M32',
          sourceDocumentType: 'UTILITY_BILL',
          sourceReferenceNo: 'EVN-2026-08',
          autoApprove: false, // In approval queue
          username: 'Hoàng Nam',
        },
      ];

      for (const v of sampleVouchers) {
        await this.createVoucher(v);
      }
    }
  }

  /**
   * Cross-Module Status Sync: Updates origin sales order / invoice when cash collection is certified
   */
  public static async syncOriginDocumentPayment(params: {
    voucherCode: string;
    sourceModule?: string;
    sourceDocumentType?: string;
    sourceDocumentId?: string | number;
    sourceReferenceNo?: string;
    amount: number;
    paymentMethod?: string;
    userId?: number;
  }): Promise<void> {
    const {
      voucherCode,
      sourceModule,
      sourceDocumentType,
      sourceDocumentId,
      sourceReferenceNo,
      amount,
      paymentMethod = 'BANK_TRANSFER',
      userId = 1,
    } = params;

    try {
      // 1. Sync M13 Sales Orders
      if (sourceModule === 'M13' || sourceDocumentType === 'SALES_ORDER') {
        let order: any = null;
        if (sourceDocumentId) {
          const numId = Number(sourceDocumentId);
          if (!isNaN(numId) && numId > 0) {
            const res = await db.select().from(schema.salesOrders).where(eq(schema.salesOrders.id, numId)).limit(1);
            order = res[0];
          }
        }
        if (!order && sourceReferenceNo) {
          const res = await db.select().from(schema.salesOrders).where(eq(schema.salesOrders.code, sourceReferenceNo)).limit(1);
          order = res[0];
        }

        if (order) {
          const newAmountPaid = (Number(order.amountPaid) || 0) + amount;
          const finalAmt = Number(order.finalAmount) || 0;
          const newStatus = newAmountPaid >= finalAmt ? 'PAID' : 'PARTIAL';

          await db.update(schema.salesOrders)
            .set({
              paymentStatus: newStatus,
              amountPaid: newAmountPaid,
            })
            .where(eq(schema.salesOrders.id, order.id));

          // Sync matching invoice in M31 if exists
          await db.update(schema.invoices)
            .set({
              paymentStatus: newStatus,
            })
            .where(eq(schema.invoices.orderId, order.id));

          // Insert into payments ledger
          try {
            await db.insert(schema.payments).values({
              orderId: order.id,
              customerId: order.customerId,
              paymentType: 'IN',
              paymentMethod: paymentMethod === 'CASH' ? 'CASH' : 'BANK_TRANSFER',
              amount,
              referenceNo: voucherCode,
              status: 'SUCCESS',
              notes: `Thu tiền qua Phiếu thu M32 [${voucherCode}] cho Đơn hàng ${order.code}`,
              createdBy: userId,
              createdAt: new Date(),
            });
          } catch (_) {}
        }
      }

      // 2. Sync M31 Invoices directly
      if (sourceModule === 'M31' || sourceDocumentType === 'INVOICE' || sourceDocumentType === 'VAT_INVOICE') {
        let invoice: any = null;
        if (sourceDocumentId) {
          const numId = Number(sourceDocumentId);
          if (!isNaN(numId) && numId > 0) {
            const res = await db.select().from(schema.invoices).where(eq(schema.invoices.id, numId)).limit(1);
            invoice = res[0];
          }
        }
        if (!invoice && sourceReferenceNo) {
          const res = await db.select().from(schema.invoices).where(eq(schema.invoices.invoiceNumber, sourceReferenceNo)).limit(1);
          invoice = res[0];
        }

        if (invoice) {
          await db.update(schema.invoices)
            .set({
              paymentStatus: 'PAID',
            })
            .where(eq(schema.invoices.id, invoice.id));

          if (invoice.orderId) {
            await db.update(schema.salesOrders)
              .set({
                paymentStatus: 'PAID',
              })
              .where(eq(schema.salesOrders.id, invoice.orderId));
          }
        }
      }
    } catch (err) {
      console.warn('[syncOriginDocumentPayment] Non-blocking warning:', err);
    }
  }
}
