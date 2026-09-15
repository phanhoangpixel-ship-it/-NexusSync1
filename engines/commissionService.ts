import { db } from '../src/db/index';
import {
  commissionPlans,
  commissionRules,
  salesQuotas,
  commissionCalculations,
  commissionPayouts,
  commissionPayoutItems,
  salesOrders,
  invoices,
  users,
  accountingEntries
} from '../src/db/schema';
import { eq, and, desc, sql, inArray, gte, lte, or } from 'drizzle-orm';
import { accountingEngine } from './accountingEngine';

export class CommissionService {
  /**
   * Evaluate and record commission calculation for a sales order or invoice
   */
  async evaluateOrderCommission(params: {
    salesOrderId?: number;
    invoiceId?: number;
    salesPersonId: number;
    triggerEvent: 'ORDER_CONFIRMED' | 'INVOICE_ISSUED' | 'PAYMENT_COLLECTED';
    totalAmount: number;
    userId: number;
  }, tx: any = db) {
    const { salesOrderId, invoiceId, salesPersonId, triggerEvent, totalAmount, userId } = params;

    if (!totalAmount || totalAmount <= 0) {
      return null;
    }

    // 1. Idempotency Check: Don't recalculate if already calculated for this order/event
    if (salesOrderId) {
      const existing = await tx
        .select()
        .from(commissionCalculations)
        .where(
          and(
            eq(commissionCalculations.salesOrderId, salesOrderId),
            eq(commissionCalculations.salesPersonId, salesPersonId),
            eq(commissionCalculations.triggerEvent, triggerEvent)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }
    }

    // 2. Fetch active commission plan for this calculation basis or default plan
    const activePlans = await tx
      .select()
      .from(commissionPlans)
      .where(
        and(
          eq(commissionPlans.status, 'ACTIVE'),
          or(
            eq(commissionPlans.calculationBasis, triggerEvent),
            eq(commissionPlans.isDefault, true)
          )
        )
      )
      .limit(1);

    const plan = activePlans[0] || null;

    let ratePercent = 3.0; // Standard baseline 3% if no explicit plan
    let fixedAmount = 0;
    let acceleratorMultiplier = 1.0;
    let selectedRuleId: number | null = null;

    if (plan) {
      // Find matching rule
      const rules = await tx
        .select()
        .from(commissionRules)
        .where(eq(commissionRules.planId, plan.id))
        .orderBy(desc(commissionRules.priorityOrder), desc(commissionRules.minThreshold));

      for (const r of rules) {
        if (totalAmount >= r.minThreshold && (r.maxThreshold === null || totalAmount <= r.maxThreshold)) {
          ratePercent = r.ratePercent;
          fixedAmount = r.fixedAmount;
          acceleratorMultiplier = r.acceleratorMultiplier || 1.0;
          selectedRuleId = r.id;
          break;
        }
      }
    }

    // Check if sales rep has an active quota and has exceeded it (Sales Accelerator)
    const currentPeriod = new Date().toISOString().substring(0, 7); // e.g. 2026-08
    const quotas = await tx
      .select()
      .from(salesQuotas)
      .where(
        and(
          eq(salesQuotas.userId, salesPersonId),
          eq(salesQuotas.status, 'ACTIVE'),
          eq(salesQuotas.period, currentPeriod)
        )
      )
      .limit(1);

    if (quotas.length > 0) {
      const quota = quotas[0];
      const attainment = quota.targetRevenue > 0 ? (quota.actualRevenue / quota.targetRevenue) * 100 : 0;
      if (attainment >= 100 && quota.acceleratorMultiplier > 1.0) {
        acceleratorMultiplier = Math.max(acceleratorMultiplier, quota.acceleratorMultiplier);
      }
    }

    const commissionAmount = Math.round(((totalAmount * (ratePercent / 100)) + fixedAmount) * acceleratorMultiplier);
    const calculationCode = `CALC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const [record] = await tx
      .insert(commissionCalculations)
      .values({
        calculationCode,
        salesOrderId: salesOrderId || null,
        invoiceId: invoiceId || null,
        salesPersonId,
        planId: plan ? plan.id : null,
        ruleId: selectedRuleId,
        baseAmount: totalAmount,
        ratePercent,
        acceleratorMultiplier,
        commissionAmount,
        isClawback: false,
        triggerEvent,
        status: triggerEvent === 'PAYMENT_COLLECTED' ? 'ELIGIBLE' : 'ACCRUED',
        calculationDate: new Date(),
        createdAt: new Date(),
      })
      .returning();

    // Update actual sales quota numbers
    if (quotas.length > 0) {
      const q = quotas[0];
      const newRevenue = q.actualRevenue + totalAmount;
      const newAttainment = q.targetRevenue > 0 ? (newRevenue / q.targetRevenue) * 100 : 0;
      await tx
        .update(salesQuotas)
        .set({
          actualRevenue: newRevenue,
          actualQuantity: q.actualQuantity + 1,
          attainmentPercent: Math.round(newAttainment * 10) / 10,
          updatedAt: new Date(),
        })
        .where(eq(salesQuotas.id, q.id));
    }

    return record;
  }

  /**
   * Process Clawback / Negative Commission when a Sales Return occurs
   */
  async processReturnClawback(params: {
    salesReturnId: number;
    salesOrderId: number;
    returnAmount: number;
    salesPersonId: number;
    userId: number;
    reason?: string;
  }, tx: any = db) {
    const { salesReturnId, salesOrderId, returnAmount, salesPersonId, userId, reason } = params;

    // Locate original calculation if available
    const originalCalcs = await tx
      .select()
      .from(commissionCalculations)
      .where(
        and(
          eq(commissionCalculations.salesOrderId, salesOrderId),
          eq(commissionCalculations.salesPersonId, salesPersonId),
          eq(commissionCalculations.isClawback, false)
        )
      )
      .limit(1);

    const orig = originalCalcs[0] || null;
    const ratePercent = orig ? orig.ratePercent : 3.0;
    const multiplier = orig ? orig.acceleratorMultiplier : 1.0;
    const clawbackAmount = -Math.abs(Math.round(((returnAmount * (ratePercent / 100))) * multiplier));

    const calculationCode = `CLAW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const [clawbackRecord] = await tx
      .insert(commissionCalculations)
      .values({
        calculationCode,
        salesOrderId,
        salesReturnId,
        salesPersonId,
        planId: orig ? orig.planId : null,
        ruleId: orig ? orig.ruleId : null,
        baseAmount: returnAmount,
        ratePercent,
        acceleratorMultiplier: multiplier,
        commissionAmount: clawbackAmount,
        isClawback: true,
        triggerEvent: 'RETURN_PROCESSED',
        status: 'ELIGIBLE', // Immediately eligible for deduction in next payout
        calculationDate: new Date(),
        notes: reason || 'Khấu trừ hoa hồng do khách hàng hoàn trả hàng bán',
        createdAt: new Date(),
      })
      .returning();

    return clawbackRecord;
  }

  /**
   * Generate Draft Commission Payout Batch (Bảng kê Quyết toán Hoa hồng)
   */
  async generatePayoutBatch(params: {
    title: string;
    period: string; // e.g. 2026-08
    startDate: Date;
    endDate: Date;
    paymentMethod?: 'BANK_TRANSFER' | 'CASH' | 'PAYROLL_INTEGRATION';
    notes?: string;
    userId: number;
  }, tx: any = db) {
    const { title, period, startDate, endDate, paymentMethod = 'BANK_TRANSFER', notes, userId } = params;

    // Find all unbatched ELIGIBLE or ACCRUED calculations within the date range
    const eligibleCalcs = await tx
      .select()
      .from(commissionCalculations)
      .where(
        and(
          sql`${commissionCalculations.payoutId} IS NULL`,
          inArray(commissionCalculations.status, ['ELIGIBLE', 'ACCRUED']),
          gte(commissionCalculations.calculationDate, startDate),
          lte(commissionCalculations.calculationDate, endDate)
        )
      );

    if (eligibleCalcs.length === 0) {
      throw new Error(`Không tìm thấy giao dịch hoa hồng đủ điều kiện quyết toán trong khoảng thời gian đã chọn`);
    }

    // Group by Sales Person
    const personMap = new Map<number, { gross: number; clawback: number; net: number; calcIds: number[] }>();

    for (const c of eligibleCalcs) {
      const spId = c.salesPersonId;
      if (!personMap.has(spId)) {
        personMap.set(spId, { gross: 0, clawback: 0, net: 0, calcIds: [] });
      }
      const item = personMap.get(spId)!;
      item.calcIds.push(c.id);

      if (c.commissionAmount >= 0) {
        item.gross += c.commissionAmount;
      } else {
        item.clawback += Math.abs(c.commissionAmount);
      }
      item.net += c.commissionAmount;
    }

    let totalGross = 0;
    let totalClawback = 0;
    let totalNet = 0;

    for (const [_, data] of personMap.entries()) {
      totalGross += data.gross;
      totalClawback += data.clawback;
      totalNet += data.net;
    }

    const payoutCode = `PAYOUT-${period.replace('-', '')}-${Math.floor(Math.random() * 1000)}`;

    const [payout] = await tx
      .insert(commissionPayouts)
      .values({
        payoutCode,
        title,
        period,
        startDate,
        endDate,
        totalGrossAmount: totalGross,
        totalClawbackAmount: totalClawback,
        totalNetAmount: totalNet,
        totalBeneficiaries: personMap.size,
        status: 'DRAFT',
        paymentMethod,
        notes,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Insert payout items
    for (const [salesPersonId, data] of personMap.entries()) {
      await tx.insert(commissionPayoutItems).values({
        payoutId: payout.id,
        salesPersonId,
        grossCommission: data.gross,
        clawbackDeductions: data.clawback,
        netPayoutAmount: data.net,
        paymentStatus: 'PENDING',
        createdAt: new Date(),
      });
    }

    // Link calculation records to this payout
    const allCalcIds = eligibleCalcs.map(c => c.id);
    if (allCalcIds.length > 0) {
      await tx
        .update(commissionCalculations)
        .set({
          payoutId: payout.id,
        })
        .where(inArray(commissionCalculations.id, allCalcIds));
    }

    return payout;
  }

  /**
   * Approve Commission Payout Batch & Post Accrual GL Journal Entry (Nợ 6418 / Có 3388)
   */
  async approvePayoutBatch(payoutId: number, userId: number, tx: any = db) {
    const [payout] = await tx
      .select()
      .from(commissionPayouts)
      .where(eq(commissionPayouts.id, payoutId))
      .limit(1);

    if (!payout) {
      throw new Error(`Đợt quyết toán ID ${payoutId} không tồn tại`);
    }

    if (payout.status !== 'DRAFT' && payout.status !== 'REVIEWED') {
      throw new Error(`Đợt quyết toán đang ở trạng thái "${payout.status}", không thể phê duyệt`);
    }

    // Post double entry journal entry via AccountingEngine: Nợ 6418 (Chi phí hoa hồng bán hàng) / Có 3388 (Phải trả hoa hồng nhân viên)
    let journalEntry = null;
    if (payout.totalNetAmount > 0) {
      const entryCode = `JE-COM-ACCRUAL-${payout.id}-${Date.now()}`;
      journalEntry = await accountingEngine.postJournal({
        entryCode,
        sourceModule: 'COMMISSION',
        sourceDocumentType: 'COMMISSION_PAYOUT_ACCRUAL',
        sourceDocumentId: payout.id,
        sourceReferenceNo: payout.payoutCode,
        debitAccount: '6418', // Chi phí bán hàng - Hoa hồng môi giới / bán hàng
        creditAccount: '3388', // Phải trả khác - Hoa hồng nhân viên
        amount: payout.totalNetAmount,
        description: `Trích trước chi phí hoa hồng bán hàng - Kỳ ${payout.period} (${payout.payoutCode})`,
        createdBy: userId,
        createdAt: new Date(),
      }, tx);
    }

    // Update payout status
    const [updated] = await tx
      .update(commissionPayouts)
      .set({
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
        accountingEntryId: journalEntry ? journalEntry.id : null,
        updatedAt: new Date(),
      })
      .where(eq(commissionPayouts.id, payoutId))
      .returning();

    // Mark calculations as SETTLED
    await tx
      .update(commissionCalculations)
      .set({
        status: 'SETTLED',
      })
      .where(eq(commissionCalculations.payoutId, payoutId));

    return { payout: updated, journalEntry };
  }

  /**
   * Disburse & Pay Commission Payout Batch & Post Payment GL Journal Entry (Nợ 3388 / Có 1121/1111)
   */
  async disbursePayoutBatch(params: {
    payoutId: number;
    paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'PAYROLL_INTEGRATION';
    notes?: string;
    userId: number;
  }, tx: any = db) {
    const { payoutId, paymentMethod, notes, userId } = params;

    const [payout] = await tx
      .select()
      .from(commissionPayouts)
      .where(eq(commissionPayouts.id, payoutId))
      .limit(1);

    if (!payout) {
      throw new Error(`Đợt quyết toán ID ${payoutId} không tồn tại`);
    }

    if (payout.status !== 'APPROVED') {
      throw new Error(`Đợt quyết toán phải được duyệt (APPROVED) trước khi chi trả`);
    }

    const creditAccount = paymentMethod === 'CASH' ? '1111' : (paymentMethod === 'BANK_TRANSFER' ? '1121' : '3341');
    const paymentDesc = paymentMethod === 'PAYROLL_INTEGRATION'
      ? `Chuyển hoa hồng vào kỳ lương để chi trả - Kỳ ${payout.period} (${payout.payoutCode})`
      : `Chi trả hoa hồng bán hàng bằng ${paymentMethod === 'CASH' ? 'tiền mặt' : 'chuyển khoản'} - Kỳ ${payout.period} (${payout.payoutCode})`;

    let payoutJournalEntry = null;
    if (payout.totalNetAmount > 0) {
      const entryCode = `JE-COM-PAY-${payout.id}-${Date.now()}`;
      payoutJournalEntry = await accountingEngine.postJournal({
        entryCode,
        sourceModule: 'COMMISSION',
        sourceDocumentType: 'COMMISSION_PAYOUT_DISBURSE',
        sourceDocumentId: payout.id,
        sourceReferenceNo: payout.payoutCode,
        debitAccount: '3388', // Giảm khoản phải trả hoa hồng
        creditAccount, // 1111, 1121 hoặc 3341
        amount: payout.totalNetAmount,
        description: paymentDesc,
        createdBy: userId,
        createdAt: new Date(),
      }, tx);
    }

    // Update Payout Status to PAID
    const [updated] = await tx
      .update(commissionPayouts)
      .set({
        status: 'PAID',
        paymentMethod,
        paidBy: userId,
        paidAt: new Date(),
        payoutAccountingEntryId: payoutJournalEntry ? payoutJournalEntry.id : null,
        notes: notes || payout.notes,
        updatedAt: new Date(),
      })
      .where(eq(commissionPayouts.id, payoutId))
      .returning();

    // Update Payout Items to PROCESSED
    await tx
      .update(commissionPayoutItems)
      .set({
        paymentStatus: 'PROCESSED',
      })
      .where(eq(commissionPayoutItems.payoutId, payoutId));

    return { payout: updated, payoutJournalEntry };
  }
}

export const commissionService = new CommissionService();
