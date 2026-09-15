import { db } from '../src/db/index';
import { accountingEntries } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';
import { StockAdjustmentType, StockAdjustmentDirection } from '../src/types/stockAdjustment';

export interface GLMappingResult {
  debitAccount: string;
  creditAccount: string;
  description: string;
}

export interface PostJournalParams {
  entryCode?: string;
  sourceModule?: string;
  sourceDocumentType: string;
  sourceDocumentId?: number | null;
  sourceReferenceNo?: string | null;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  description: string;
  branchId?: number | null;
  supplierId?: number | null;
  customerId?: number | null;
  createdBy?: number;
  userId?: number;
  createdAt?: Date;
}

export interface PostAdjustmentJournalParams {
  adjustmentId: number;
  adjustmentCode: string;
  adjustmentType: StockAdjustmentType;
  direction: StockAdjustmentDirection;
  totalAmount: number;
  warehouseId: number;
  reason?: string | null;
  userId: number;
  productType?: string | null;
}

export class AccountingEngineService {
  /**
   * Sole authoritative single-writer path for inserting General Ledger accounting entries.
   * All modules, engines, and routes MUST call this method to record double-entry transactions.
   */
  async postJournal(params: PostJournalParams, tx: any = db) {
    if (params.amount === undefined || params.amount === null || isNaN(params.amount)) {
      throw new Error("Invalid journal entry: monetary amount must be a valid number");
    }

    if (!params.debitAccount || !params.creditAccount) {
      throw new Error("Invalid journal entry: debitAccount and creditAccount are required");
    }

    if (params.amount === 0) {
      return null;
    }

    // Standardize negative amount as account-swapped reversal (DR/CR >= 0 invariant)
    let debitAccount = params.debitAccount;
    let creditAccount = params.creditAccount;
    let rawAmount = params.amount;

    if (rawAmount < 0) {
      debitAccount = params.creditAccount;
      creditAccount = params.debitAccount;
      rawAmount = Math.abs(rawAmount);
    }

    const roundedAmount = Math.round(rawAmount * 100) / 100;
    if (roundedAmount === 0) {
      return null;
    }

    const entryCode = params.entryCode || `JE-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const validUserId = params.createdBy || params.userId || 1;

    const [entry] = await tx
      .insert(accountingEntries)
      .values({
        entryCode,
        sourceModule: params.sourceModule || 'GENERAL',
        sourceDocumentType: params.sourceDocumentType,
        sourceDocumentId: params.sourceDocumentId ?? null,
        sourceReferenceNo: params.sourceReferenceNo ?? null,
        debitAccount,
        creditAccount,
        amount: roundedAmount,
        description: params.description,
        branchId: params.branchId ?? null,
        supplierId: params.supplierId ?? null,
        customerId: params.customerId ?? null,
        createdBy: validUserId,
        createdAt: params.createdAt || new Date(),
      })
      .returning();

    return entry;
  }

  /**
   * Resolve Dynamic GL Account Mapping according to Vietnamese Accounting Standards (VAS)
   */
  resolveAdjustmentGLMapping(
    adjustmentType: StockAdjustmentType,
    direction: StockAdjustmentDirection,
    productType?: string | null
  ): GLMappingResult {
    // Inventory asset account: 152 for RAW_MATERIAL, 156 for FINISHED_GOOD / standard merchandise
    const inventoryAccount = productType === 'RAW_MATERIAL' ? '152' : '156';

    if (direction === 'INCREASE') {
      switch (adjustmentType) {
        case 'FOUND':
          return {
            debitAccount: inventoryAccount,
            creditAccount: '711', // Thu nhập khác
            description: 'Điều chỉnh tăng kho hàng thừa (Thu nhập khác)',
          };
        case 'STOCKTAKE_VARIANCE':
          return {
            debitAccount: inventoryAccount,
            creditAccount: '3381', // Tài sản thừa chờ xử lý
            description: 'Điều chỉnh tăng chênh lệch thừa kiểm kê',
          };
        case 'MANUAL':
        default:
          return {
            debitAccount: inventoryAccount,
            creditAccount: '711', // Thu nhập khác
            description: 'Điều chỉnh tăng kho khác',
          };
      }
    } else {
      // DECREASE
      switch (adjustmentType) {
        case 'LOSS':
          return {
            debitAccount: '811', // Chi phí khác (tổn thất)
            creditAccount: inventoryAccount,
            description: 'Điều chỉnh giảm kho do tổn thất / thất thoát',
          };
        case 'DAMAGE':
          return {
            debitAccount: '811', // Chi phí khác (hàng hư hỏng)
            creditAccount: inventoryAccount,
            description: 'Điều chỉnh giảm kho do hư hỏng / tổn hại',
          };
        case 'EXPIRED':
          return {
            debitAccount: '632', // Giá vốn hàng bán (Hàng hết hạn mất phẩm chất)
            creditAccount: inventoryAccount,
            description: 'Điều chỉnh giảm kho do hàng hết hạn sử dụng',
          };
        case 'SCRAP':
          return {
            debitAccount: '811', // Chi phí khác (thanh lý / hủy phế liệu)
            creditAccount: inventoryAccount,
            description: 'Điều chỉnh giảm kho do thanh lý / hủy phế liệu',
          };
        case 'STOCKTAKE_VARIANCE':
          return {
            debitAccount: '1381', // Tài sản thiếu chờ xử lý
            creditAccount: inventoryAccount,
            description: 'Điều chỉnh giảm chênh lệch thiếu kiểm kê',
          };
        case 'MANUAL':
        default:
          return {
            debitAccount: '811', // Chi phí khác
            creditAccount: inventoryAccount,
            description: 'Điều chỉnh giảm kho khác',
          };
      }
    }
  }

  /**
   * Post balanced double-entry Journal Entry for Stock Adjustment in ACID transaction
   */
  async postAdjustmentJournalEntry(params: PostAdjustmentJournalParams, tx: any = db) {
    const {
      adjustmentId,
      adjustmentCode,
      adjustmentType,
      direction,
      totalAmount,
      warehouseId,
      reason,
      userId,
      productType,
    } = params;

    // 1. If total amount is 0, no monetary GL journal entry is posted
    if (totalAmount <= 0) {
      return null;
    }

    const roundedAmount = Math.round(totalAmount * 100) / 100;

    // 2. Idempotency check: Do not duplicate journal entries for the same adjustment
    const existing = await tx
      .select()
      .from(accountingEntries)
      .where(
        and(
          eq(accountingEntries.sourceDocumentType, 'STOCK_ADJUSTMENT'),
          eq(accountingEntries.sourceDocumentId, adjustmentId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // 3. Dynamic GL Mapping
    const glMapping = this.resolveAdjustmentGLMapping(adjustmentType, direction, productType);

    // 4. Generate unique entry code
    const entryCode = `JE-ADJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const desc = reason
      ? `Phiếu điều chỉnh ${adjustmentCode} (${adjustmentType}): ${reason}`
      : `${glMapping.description} - Phiếu ${adjustmentCode}`;

    // 5. Insert Balanced Double Entry via single-writer postJournal
    return await this.postJournal({
      entryCode,
      sourceModule: 'INVENTORY',
      sourceDocumentType: 'STOCK_ADJUSTMENT',
      sourceDocumentId: adjustmentId,
      sourceReferenceNo: adjustmentCode,
      debitAccount: glMapping.debitAccount,
      creditAccount: glMapping.creditAccount,
      amount: roundedAmount,
      description: desc,
      branchId: warehouseId,
      createdBy: userId,
      createdAt: new Date(),
    }, tx);
  }

  /**
   * Post balanced double-entry Journal Entries for Payroll in ACID transaction
   */
  async postPayrollJournalEntries(
    payrollId: number,
    periodCode: string,
    results: any[],
    branchId: number | null,
    userId: number,
    tx: any = db
  ) {
    // 1. Idempotency Check
    const existing = await tx
      .select()
      .from(accountingEntries)
      .where(
        and(
          eq(accountingEntries.sourceDocumentType, 'PAYROLL'),
          eq(accountingEntries.sourceDocumentId, payrollId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error(`Bảng lương kỳ ${periodCode} đã được ghi nhận vào Sổ Cái trước đó.`);
    }

    const postedEntries = [];

    for (const res of results) {
      const {
        employeeId,
        fullName,
        departmentCode,
        positionCode,
        grossSalary,
        employeeInsurance,
        employerInsurance,
        personalIncomeTax
      } = res;

      // Determine dynamic expense account according to Circular 200 (TT200)
      let expenseAccount = '642'; // Default: General & Administrative Expenses
      const deptUpper = (departmentCode || '').toUpperCase();
      const posUpper = (positionCode || '').toUpperCase();

      if (deptUpper.startsWith('PROD') || deptUpper.startsWith('FACT') || deptUpper.startsWith('DIRECT')) {
        // Direct workers get 622; supervisors/QA/QC get 627
        if (posUpper.startsWith('WORKER') || posUpper.startsWith('OPERATOR') || posUpper.startsWith('ASSEMBLER')) {
          expenseAccount = '622'; // Chi phí nhân công trực tiếp
        } else {
          expenseAccount = '627'; // Chi phí sản xuất chung
        }
      } else if (deptUpper.startsWith('SALE') || deptUpper.startsWith('MKT') || deptUpper.startsWith('RETAIL') || deptUpper.startsWith('MARKET')) {
        expenseAccount = '641'; // Chi phí bán hàng
      }

      // Entry 1: Accrue Gross Salary
      if (grossSalary > 0) {
        const grossCode = `JE-PAY-${periodCode}-EMP-${employeeId}-GROSS`;
        const grossEntry = await this.postJournal({
          entryCode: grossCode,
          sourceModule: 'EXPENSE',
          sourceDocumentType: 'PAYROLL',
          sourceDocumentId: payrollId,
          sourceReferenceNo: periodCode,
          debitAccount: expenseAccount,
          creditAccount: '334', // Phải trả người lao động
          amount: grossSalary,
          description: `Trích lương Gross kỳ ${periodCode} - ${fullName}`,
          branchId: branchId,
          createdBy: userId,
          createdAt: new Date(),
        }, tx);
        if (grossEntry) postedEntries.push(grossEntry);
      }

      // Entry 2: Deduct Employee Compulsory Insurance Share (BHXH 8%, BHYT 1.5%, BHTN 1%)
      if (employeeInsurance && employeeInsurance.total > 0) {
        const insCode = `JE-PAY-${periodCode}-EMP-${employeeId}-EMPINS`;
        if (employeeInsurance.bhxh > 0) {
          const insBhxh = await this.postJournal({
            entryCode: `${insCode}-BHXH`,
            sourceModule: 'EXPENSE',
            sourceDocumentType: 'PAYROLL',
            sourceDocumentId: payrollId,
            sourceReferenceNo: periodCode,
            debitAccount: '334',
            creditAccount: '3383', // BHXH
            amount: employeeInsurance.bhxh,
            description: `Khấu trừ BHXH (8%) kỳ ${periodCode} - ${fullName}`,
            branchId: branchId,
            createdBy: userId,
            createdAt: new Date(),
          }, tx);
          if (insBhxh) postedEntries.push(insBhxh);
        }
        if (employeeInsurance.bhyt > 0) {
          const insBhyt = await this.postJournal({
            entryCode: `${insCode}-BHYT`,
            sourceModule: 'EXPENSE',
            sourceDocumentType: 'PAYROLL',
            sourceDocumentId: payrollId,
            sourceReferenceNo: periodCode,
            debitAccount: '334',
            creditAccount: '3384', // BHYT
            amount: employeeInsurance.bhyt,
            description: `Khấu trừ BHYT (1.5%) kỳ ${periodCode} - ${fullName}`,
            branchId: branchId,
            createdBy: userId,
            createdAt: new Date(),
          }, tx);
          if (insBhyt) postedEntries.push(insBhyt);
        }
        if (employeeInsurance.bhtn > 0) {
          const insBhtn = await this.postJournal({
            entryCode: `${insCode}-BHTN`,
            sourceModule: 'EXPENSE',
            sourceDocumentType: 'PAYROLL',
            sourceDocumentId: payrollId,
            sourceReferenceNo: periodCode,
            debitAccount: '334',
            creditAccount: '3386', // BHTN
            amount: employeeInsurance.bhtn,
            description: `Khấu trừ BHTN (1%) kỳ ${periodCode} - ${fullName}`,
            branchId: branchId,
            createdBy: userId,
            createdAt: new Date(),
          }, tx);
          if (insBhtn) postedEntries.push(insBhtn);
        }
      }

      // Entry 3: Deduct Personal Income Tax (PIT)
      if (personalIncomeTax > 0) {
        const pitCode = `JE-PAY-${periodCode}-EMP-${employeeId}-PIT`;
        const pitEntry = await this.postJournal({
          entryCode: pitCode,
          sourceModule: 'EXPENSE',
          sourceDocumentType: 'PAYROLL',
          sourceDocumentId: payrollId,
          sourceReferenceNo: periodCode,
          debitAccount: '334',
          creditAccount: '3335', // Thuế TNCN phải nộp
          amount: personalIncomeTax,
          description: `Khấu trừ Thuế TNCN kỳ ${periodCode} - ${fullName}`,
          branchId: branchId,
          createdBy: userId,
          createdAt: new Date(),
        }, tx);
        if (pitEntry) postedEntries.push(pitEntry);
      }

      // Entry 4: Accrue Employer Compulsory Insurance Share (BHXH 17.5%, BHYT 3.0%, BHTN 1.0%)
      if (employerInsurance && employerInsurance.total > 0) {
        const emrCode = `JE-PAY-${periodCode}-EMP-${employeeId}-EMRINS`;
        if (employerInsurance.bhxh > 0) {
          const emrBhxh = await this.postJournal({
            entryCode: `${emrCode}-BHXH`,
            sourceModule: 'EXPENSE',
            sourceDocumentType: 'PAYROLL',
            sourceDocumentId: payrollId,
            sourceReferenceNo: periodCode,
            debitAccount: expenseAccount,
            creditAccount: '3383', // BHXH
            amount: employerInsurance.bhxh,
            description: `Trích BHXH doanh nghiệp gánh (17.5%) kỳ ${periodCode} - ${fullName}`,
            branchId: branchId,
            createdBy: userId,
            createdAt: new Date(),
          }, tx);
          if (emrBhxh) postedEntries.push(emrBhxh);
        }
        if (employerInsurance.bhyt > 0) {
          const emrBhyt = await this.postJournal({
            entryCode: `${emrCode}-BHYT`,
            sourceModule: 'EXPENSE',
            sourceDocumentType: 'PAYROLL',
            sourceDocumentId: payrollId,
            sourceReferenceNo: periodCode,
            debitAccount: expenseAccount,
            creditAccount: '3384', // BHYT
            amount: employerInsurance.bhyt,
            description: `Trích BHYT doanh nghiệp gánh (3%) kỳ ${periodCode} - ${fullName}`,
            branchId: branchId,
            createdBy: userId,
            createdAt: new Date(),
          }, tx);
          if (emrBhyt) postedEntries.push(emrBhyt);
        }
        if (employerInsurance.bhtn > 0) {
          const emrBhtn = await this.postJournal({
            entryCode: `${emrCode}-BHTN`,
            sourceModule: 'EXPENSE',
            sourceDocumentType: 'PAYROLL',
            sourceDocumentId: payrollId,
            sourceReferenceNo: periodCode,
            debitAccount: expenseAccount,
            creditAccount: '3386', // BHTN
            amount: employerInsurance.bhtn,
            description: `Trích BHTN doanh nghiệp gánh (1%) kỳ ${periodCode} - ${fullName}`,
            branchId: branchId,
            createdBy: userId,
            createdAt: new Date(),
          }, tx);
          if (emrBhtn) postedEntries.push(emrBhtn);
        }
      }
    }

    return postedEntries;
  }

  /**
   * Reverse balanced double-entry Journal Entries for Payroll in ACID transaction (Red writing method)
   */
  async reversePayrollJournalEntries(payrollId: number, periodCode: string, userId: number, tx: any = db) {
    // 1. Fetch original entries
    const originalEntries = await tx
      .select()
      .from(accountingEntries)
      .where(
        and(
          eq(accountingEntries.sourceDocumentType, 'PAYROLL'),
          eq(accountingEntries.sourceDocumentId, payrollId)
        )
      );

    if (originalEntries.length === 0) {
      return [];
    }

    const reversedEntries = [];
    for (const entry of originalEntries) {
      // Ignore already-reversed entries to preserve idempotency
      if (entry.entryCode.endsWith('-REV')) {
        continue;
      }

      // Check if this specific entry was already reversed
      const revCode = `${entry.entryCode}-REV`;
      const [alreadyReversed] = await tx
        .select()
        .from(accountingEntries)
        .where(eq(accountingEntries.entryCode, revCode))
        .limit(1);

      if (alreadyReversed) {
        continue;
      }

      // Create a balanced reversed journal entry (Debit/Credit swapped, positive amount)
      const revEntry = await this.postJournal({
        entryCode: revCode,
        sourceModule: entry.sourceModule,
        sourceDocumentType: entry.sourceDocumentType,
        sourceDocumentId: entry.sourceDocumentId,
        sourceReferenceNo: entry.sourceReferenceNo,
        debitAccount: entry.creditAccount,
        creditAccount: entry.debitAccount,
        amount: Math.abs(entry.amount),
        description: `[ĐẢO PHIẾU] ${entry.description}`,
        branchId: entry.branchId,
        createdBy: userId,
        createdAt: new Date(),
      }, tx);

      if (revEntry) reversedEntries.push(revEntry);
    }

    return reversedEntries;
  }

  /**
   * General Journal Entry posting for Project Management & Job Costing (Module 39)
   */
  async postJournalEntry(params: {
    sourceModule?: string;
    sourceDocumentType: string;
    sourceDocumentId: number;
    sourceReferenceNo?: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
    description: string;
    branchId?: number;
    userId: number;
  }, tx: any = db) {
    return await this.postJournal({
      sourceModule: params.sourceModule || 'PROJECT',
      sourceDocumentType: params.sourceDocumentType,
      sourceDocumentId: params.sourceDocumentId,
      sourceReferenceNo: params.sourceReferenceNo || `REF-${params.sourceDocumentId}`,
      debitAccount: params.debitAccount,
      creditAccount: params.creditAccount,
      amount: params.amount,
      description: params.description,
      branchId: params.branchId,
      createdBy: params.userId,
    }, tx);
  }
}

export const accountingEngine = new AccountingEngineService();
