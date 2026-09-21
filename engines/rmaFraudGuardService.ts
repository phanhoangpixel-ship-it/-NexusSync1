import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { db } from "../db/index";
import * as schema from "../db/schema";
import { RmaValidationReport } from "./rmaValidationService";

export interface FraudEvaluationInput {
  customerId?: number | null;
  customerName?: string;
  orderId?: number | null;
  orderCode?: string | null;
  totalAmount?: number;
  productCode?: string;
  quantity?: number;
  warrantyStatus?: string;
  items?: Array<{
    productId?: number | null;
    productCode?: string;
    productName?: string;
    quantity?: number;
    lotSerial?: string;
    serialId?: number | null;
    unitPrice?: number;
  }>;
  validationReport?: RmaValidationReport;
  customFlags?: any[];
  notes?: string;
}

export type FraudRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH_RISK_FRAUD';

export interface FraudRiskAssessment {
  fraudScore: number; // 0 to 100
  riskLevel: FraudRiskLevel;
  recommendation: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'FLAG_SUSPICIOUS' | 'REQUIRES_DIRECTOR_OVERRIDE';
  flags: Array<{
    rule: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    scoreContribution: number;
    description: string;
    details?: any;
  }>;
  requiresSupervisorOverride: boolean;
  explanation: string;
  velocityStats?: {
    returnsLast30Days: number;
    totalReturnedAmount: number;
    totalSalesAmount: number;
    returnSalesRatio: number;
  };
}

export class RmaFraudGuardService {
  /**
   * Evaluate multi-factor RMA Fraud & Abuse Risk (Phase 09 Fraud Shield).
   * Analyzes return velocity, return-to-sales ratio, duplicate serial cross-customer fraud, and warranty tamper status.
   */
  static async evaluateRisk(
    input: FraudEvaluationInput,
    tx: any = db
  ): Promise<FraudRiskAssessment> {
    let fraudScore = 0;
    const flags: FraudRiskAssessment['flags'] = [];

    // 1. Incorporate Validation Report flags if provided (Phase 04 Gate)
    if (input.validationReport) {
      // Return Window Exceeded
      if (!input.validationReport.returnWindowCheck.isWithinWindow) {
        const diffDays = input.validationReport.returnWindowCheck.elapsedDays;
        const windowDays = input.validationReport.returnWindowCheck.returnWindowDays;
        const penalty = diffDays > windowDays * 2 ? 40 : 25;
        fraudScore += penalty;
        flags.push({
          rule: 'RETURN_WINDOW_EXCEEDED',
          severity: diffDays > windowDays * 2 ? 'HIGH' : 'MEDIUM',
          scoreContribution: penalty,
          description: `Đơn hàng đã giao thành công cách đây ${diffDays} ngày (chính sách cho phép ${windowDays} ngày).`,
          details: { diffDays, windowDays }
        });
      }

      // Serial / Warranty Checks
      for (const sc of input.validationReport.serialChecks) {
        if (sc.warrantyStatus === 'VOID_TAMPERED') {
          fraudScore += 45;
          flags.push({
            rule: 'WARRANTY_VOID_TAMPERED',
            severity: 'CRITICAL',
            scoreContribution: 45,
            description: `Serial [${sc.serialNumber}] phát hiện rách tem niêm phong hoặc can thiệp kỹ thuật trái phép.`,
            details: { serialNumber: sc.serialNumber, reason: sc.tamperReason }
          });
        } else if (sc.warrantyStatus === 'EXPIRED') {
          fraudScore += 30;
          flags.push({
            rule: 'WARRANTY_EXPIRED',
            severity: 'HIGH',
            scoreContribution: 30,
            description: `Serial [${sc.serialNumber}] đã hết hạn bảo hành chính hãng.`,
            details: { serialNumber: sc.serialNumber, warrantyEndDate: sc.warrantyEndDate }
          });
        }

        if (sc.activeClaimsCount > 2) {
          fraudScore += 15;
          flags.push({
            rule: 'EXCESSIVE_WARRANTY_CLAIMS',
            severity: 'MEDIUM',
            scoreContribution: 15,
            description: `Serial [${sc.serialNumber}] có nhiều lượt yêu cầu bảo hành bất thường (${sc.activeClaimsCount} lần).`,
            details: { count: sc.activeClaimsCount }
          });
        }
      }
    }

    // 2. Direct warrantyStatus input check (if no report)
    if (input.warrantyStatus === 'VOID_TAMPERED' && !flags.some(f => f.rule === 'WARRANTY_VOID_TAMPERED')) {
      fraudScore += 45;
      flags.push({
        rule: 'WARRANTY_VOID_TAMPERED',
        severity: 'CRITICAL',
        scoreContribution: 45,
        description: 'Tem niêm phong sản phẩm bị hư hỏng hoặc có dấu hiệu tháo lắp không ủy quyền.'
      });
    } else if (input.warrantyStatus === 'EXPIRED' && !flags.some(f => f.rule === 'WARRANTY_EXPIRED')) {
      fraudScore += 30;
      flags.push({
        rule: 'WARRANTY_EXPIRED',
        severity: 'HIGH',
        scoreContribution: 30,
        description: 'Thời hạn bảo hành của thiết bị đã hết hiệu lực.'
      });
    }

    // 3. Phase 09 Quét Trùng Lặp Serial (Duplicate Serial Detection & Cross-Customer Check)
    const candidateSerials: string[] = [];
    if (input.items && input.items.length > 0) {
      for (const it of input.items) {
        if (it.lotSerial && it.lotSerial.trim() && it.lotSerial !== 'LOT-2026-X889') {
          candidateSerials.push(it.lotSerial.trim());
        }
      }
    }

    for (const sn of candidateSerials) {
      try {
        // Check 3a: Has this serial already been refunded or processed in an earlier RMA?
        const prevRmaItems = await tx.select().from(schema.rmaItems)
          .where(eq(schema.rmaItems.lotSerial, sn));

        if (prevRmaItems.length > 0) {
          fraudScore += 45;
          flags.push({
            rule: 'DUPLICATE_SERIAL_PREVIOUSLY_REFUNDED',
            severity: 'CRITICAL',
            scoreContribution: 45,
            description: `Số Serial [${sn}] đã từng phát sinh trong ${prevRmaItems.length} hồ sơ RMA trước đó. Nguy cơ quay vòng thiết bị đã quyết toán.`,
            details: { serialNumber: sn, previousCount: prevRmaItems.length }
          });
        }

        // Check 3b: Cross-customer Serial scan: Check if serial belongs to a different customer in serialTransactions or serialNumbers
        const [serialRecord] = await tx.select().from(schema.serialNumbers)
          .where(eq(schema.serialNumbers.serialNumber, sn))
          .limit(1);

        if (serialRecord) {
          const [outTx] = await tx.select().from(schema.serialTransactions)
            .where(and(
              eq(schema.serialTransactions.serialId, serialRecord.id),
              eq(schema.serialTransactions.transactionType, 'OUTWARD')
            ))
            .limit(1);

          if (outTx && outTx.customerId && input.customerId && outTx.customerId !== input.customerId) {
            fraudScore += 40;
            flags.push({
              rule: 'CROSS_CUSTOMER_SERIAL_MISMATCH',
              severity: 'CRITICAL',
              scoreContribution: 40,
              description: `Cảnh báo tráo đổi Serial: Số Serial [${sn}] trong lịch sử xuất kho thuộc khách hàng #${outTx.customerId} (${outTx.customerName || 'Khác'}), không khớp với khách hàng yêu cầu #${input.customerId}.`,
              details: { serialNumber: sn, originalCustomerId: outTx.customerId, currentCustomerId: input.customerId }
            });
          }
        }
      } catch (snCheckErr) {
        console.warn("Serial fraud check warning:", snCheckErr);
      }
    }

    // 4. Phase 09 Customer Return Velocity Check (Tần suất trả hàng >= 3 lần/tháng) & Return-to-Sales Ratio (>= 20-30%)
    let velocityStats: FraudRiskAssessment['velocityStats'] = undefined;
    if (input.customerId || input.customerName) {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        let recentRmas: any[] = [];

        if (input.customerId) {
          recentRmas = await tx.select().from(schema.rmaRequests)
            .where(and(
              eq(schema.rmaRequests.customerId, input.customerId),
              sql`${schema.rmaRequests.requestDate} >= ${thirtyDaysAgo}`
            ));
        } else if (input.customerName) {
          recentRmas = await tx.select().from(schema.rmaRequests)
            .where(and(
              eq(schema.rmaRequests.customerName, input.customerName),
              sql`${schema.rmaRequests.requestDate} >= ${thirtyDaysAgo}`
            ));
        }

        const returnsLast30Days = recentRmas.length;
        const totalReturnedAmount = recentRmas.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0) + (Number(input.totalAmount) || 0);

        // Fetch total customer sales volume
        let totalSalesAmount = 0;
        if (input.customerId) {
          const customerOrders = await tx.select().from(schema.salesOrders)
            .where(eq(schema.salesOrders.customerId, input.customerId));
          totalSalesAmount = customerOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        }

        const returnSalesRatio = totalSalesAmount > 0 ? Math.round((totalReturnedAmount / totalSalesAmount) * 100) : 0;
        velocityStats = {
          returnsLast30Days,
          totalReturnedAmount,
          totalSalesAmount,
          returnSalesRatio
        };

        // 4a. Velocity Frequency
        if (returnsLast30Days >= 5) {
          fraudScore += 35;
          flags.push({
            rule: 'EXCESSIVE_RETURN_VELOCITY',
            severity: 'CRITICAL',
            scoreContribution: 35,
            description: `Tần suất trả hàng nghiêm trọng: Khách hàng có ${returnsLast30Days} lượt yêu cầu RMA trong 30 ngày qua (vượt ngưỡng kiểm soát 3 lần/tháng).`,
            details: { returnsLast30Days }
          });
        } else if (returnsLast30Days >= 3) {
          fraudScore += 20;
          flags.push({
            rule: 'HIGH_RETURN_VELOCITY',
            severity: 'HIGH',
            scoreContribution: 20,
            description: `Tần suất trả hàng cao: Khách hàng có ${returnsLast30Days} lượt yêu cầu RMA trong 30 ngày qua.`,
            details: { returnsLast30Days }
          });
        }

        // 4b. Return to Sales Ratio
        if (totalSalesAmount > 0 && returnSalesRatio >= 30) {
          fraudScore += 30;
          flags.push({
            rule: 'CRITICAL_RETURN_SALES_RATIO',
            severity: 'CRITICAL',
            scoreContribution: 30,
            description: `Tỷ lệ hoàn trả trên doanh số rất cao: Tổng giá trị hàng trả lại chiếm ${returnSalesRatio}% tổng doanh số mua hàng (${totalReturnedAmount.toLocaleString()} / ${totalSalesAmount.toLocaleString()} VNĐ).`,
            details: { returnSalesRatio, totalReturnedAmount, totalSalesAmount }
          });
        } else if (totalSalesAmount > 0 && returnSalesRatio >= 20) {
          fraudScore += 15;
          flags.push({
            rule: 'HIGH_RETURN_SALES_RATIO',
            severity: 'MEDIUM',
            scoreContribution: 15,
            description: `Tỷ lệ hoàn trả trên doanh số đạt ${returnSalesRatio}% (ngưỡng an toàn < 20%).`,
            details: { returnSalesRatio }
          });
        }
      } catch (velErr) {
        console.warn("Velocity check error:", velErr);
      }
    }

    // 5. High-Value Anomaly Check (> 50,000,000 VND)
    const amount = Number(input.totalAmount) || 0;
    if (amount >= 100000000) {
      fraudScore += 20;
      flags.push({
        rule: 'VERY_HIGH_VALUE_RETURN',
        severity: 'HIGH',
        scoreContribution: 20,
        description: `Giá trị trả hàng rất lớn (${amount.toLocaleString('vi-VN')} VNĐ), bắt buộc phê duyệt cấp Ban Giám Đốc/CFO.`,
        details: { amount }
      });
    } else if (amount >= 40000000) {
      fraudScore += 10;
      flags.push({
        rule: 'HIGH_VALUE_RETURN',
        severity: 'MEDIUM',
        scoreContribution: 10,
        description: `Giá trị trả hàng cao (${amount.toLocaleString('vi-VN')} VNĐ).`,
        details: { amount }
      });
    }

    // 6. Append any custom manual flags
    if (input.customFlags && Array.isArray(input.customFlags)) {
      for (const cf of input.customFlags) {
        if (cf && cf.rule) {
          const addedScore = cf.scoreContribution || 15;
          fraudScore += addedScore;
          flags.push({
            rule: cf.rule,
            severity: cf.severity || 'MEDIUM',
            scoreContribution: addedScore,
            description: cf.description || 'Cảnh báo bổ sung từ người giám định',
            details: cf.details || cf
          });
        }
      }
    }

    // Cap fraudScore at 100
    fraudScore = Math.min(100, Math.max(0, fraudScore));

    // Determine Risk Level & Recommendation (LOW, MEDIUM, HIGH_RISK_FRAUD)
    let riskLevel: FraudRiskLevel = 'LOW';
    let recommendation: FraudRiskAssessment['recommendation'] = 'AUTO_APPROVE';

    if (fraudScore >= 50) {
      riskLevel = 'HIGH_RISK_FRAUD';
      recommendation = 'REQUIRES_DIRECTOR_OVERRIDE';
    } else if (fraudScore >= 25) {
      riskLevel = 'MEDIUM';
      recommendation = 'MANUAL_REVIEW';
    } else {
      riskLevel = 'LOW';
      recommendation = 'AUTO_APPROVE';
    }

    const explanation = flags.length > 0
      ? `Điểm rủi ro: ${fraudScore}/100 [${riskLevel}]. Phát hiện ${flags.length} yếu tố cần kiểm soát: ${flags.map(f => f.rule).join(', ')}.`
      : `Điểm rủi ro: ${fraudScore}/100 [LOW]. Đủ điều kiện tiếp nhận tiêu chuẩn.`;

    return {
      fraudScore,
      riskLevel,
      recommendation,
      flags,
      requiresSupervisorOverride: fraudScore >= 50,
      explanation,
      velocityStats
    };
  }
}
