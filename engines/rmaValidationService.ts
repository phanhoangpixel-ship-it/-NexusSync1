import { eq, and, sql, desc, or, inArray } from "drizzle-orm";
import { db } from "../db/index";
import * as schema from "../db/schema";

export interface ReturnWindowCheckResult {
  isWithinWindow: boolean;
  returnWindowDays: number;
  deliveryDate: Date | null;
  returnDate: Date;
  elapsedDays: number;
  orderCode: string | null;
  warning?: string;
  flag?: {
    rule: string;
    description: string;
    diffDays: number;
    windowDays: number;
  };
}

export interface SerialWarrantyCheckResult {
  serialId: number | null;
  serialNumber: string;
  productId: number | null;
  warrantyStatus: 'VALID' | 'EXPIRED' | 'VOID_TAMPERED';
  warrantyStartDate: Date | null;
  warrantyEndDate: Date | null;
  warrantyMonths: number;
  isTampered: boolean;
  tamperReason?: string;
  isLinkedToOrder: boolean;
  orderLinkDetails?: {
    orderId?: number | null;
    orderCode?: string | null;
    customerName?: string | null;
  };
  activeClaimsCount: number;
  warnings: string[];
  flags: Array<{
    rule: string;
    serialNumber: string;
    description: string;
    [key: string]: any;
  }>;
}

export interface RmaEligibilityValidationParams {
  orderId?: number | null;
  orderCode?: string | null;
  customerId?: number | null;
  warehouseId?: number | null;
  items?: Array<{
    productId?: number | null;
    productCode?: string;
    productName?: string;
    quantity: number;
    unitPrice?: number;
    lotSerial?: string;
    serialId?: number | null;
    lotId?: number | null;
    reason?: string;
    condition?: string;
    isTampered?: boolean;
    tamperReason?: string;
  }>;
  returnDate?: string | Date;
  returnWindowDays?: number;
}

export interface RmaValidationReport {
  isValid: boolean;
  canProceed: boolean;
  requiresSupervisorApproval: boolean;
  detectedWarrantyStatus: 'VALID' | 'EXPIRED' | 'VOID_TAMPERED';
  returnWindowCheck: ReturnWindowCheckResult;
  serialChecks: SerialWarrantyCheckResult[];
  errors: string[];
  warnings: string[];
  flags: any[];
  resolvedCustomer?: { id: number; name: string };
  resolvedOrder?: { id: number; code: string; deliveryDate: Date | null };
}

export const IMMUTABLE_RMA_STATUSES = ['COMPLETED', 'RESTOCKED', 'REFUNDED', 'CLOSED'] as const;

export class RmaValidationService {
  /**
   * Check if an RMA document has reached an immutable state (Rule #01 & Rule #16).
   */
  static isImmutable(rma: any): boolean {
    if (!rma) return false;
    const s = String(rma.status || '').toUpperCase();
    const d = String(rma.disposition || '').toUpperCase();
    const f = String(rma.financialStatus || '').toUpperCase();
    return (
      IMMUTABLE_RMA_STATUSES.includes(s as any) ||
      s === 'RESTOCKED' ||
      s === 'REFUNDED' ||
      s === 'CLOSED' ||
      f === 'REFUNDED' ||
      (s === 'COMPLETED' && d !== 'PENDING')
    );
  }

  /**
   * Enforce Document Immutability invariant.
   * Throws an error with standard business code if the RMA is locked read-only.
   */
  static assertNotImmutable(rma: any, operationName: string = 'thao tác') {
    if (this.isImmutable(rma)) {
      const err: any = new Error(
        `Chứng từ RMA [${rma.rmaNumber || rma.id}] đã đạt trạng thái bất biến [${rma.status} / ${rma.disposition || 'N/A'} / ${rma.financialStatus || 'N/A'}] và bị khóa read-only theo chuẩn Rule #01 & Rule #16. Không thể thực hiện ${operationName}. Vui lòng phát hành chứng từ Reversal/Adjustment đối ứng.`
      );
      err.code = 'RMA_IMMUTABLE_LOCKED';
      err.statusCode = 422;
      err.rmaNumber = rma.rmaNumber;
      throw err;
    }
  }

  /**
   * Phase 04 Gate: Check Return Window Policy (M13/M36 Gate).
   * Verifies that returnDate - deliveryDate <= returnWindowDays.
   */
  static async checkReturnWindow(
    orderIdentifier: number | string | null | undefined,
    returnDateInput: string | Date = new Date(),
    policyWindowDays: number = 30,
    tx: any = db
  ): Promise<ReturnWindowCheckResult> {
    const returnDate = typeof returnDateInput === 'string' ? new Date(returnDateInput) : returnDateInput;
    const result: ReturnWindowCheckResult = {
      isWithinWindow: true,
      returnWindowDays: policyWindowDays,
      deliveryDate: null,
      returnDate,
      elapsedDays: 0,
      orderCode: null
    };

    if (!orderIdentifier) {
      return result;
    }

    // 1. Look up Sales Order (M13)
    let salesOrder: any = null;
    if (typeof orderIdentifier === 'number' || (!isNaN(Number(orderIdentifier)) && Number(orderIdentifier) > 0)) {
      const [found] = await tx.select().from(schema.salesOrders)
        .where(eq(schema.salesOrders.id, Number(orderIdentifier)))
        .limit(1);
      salesOrder = found;
    } else {
      const [found] = await tx.select().from(schema.salesOrders)
        .where(eq(schema.salesOrders.code, String(orderIdentifier)))
        .limit(1);
      salesOrder = found;
    }

    if (!salesOrder) {
      return result;
    }

    result.orderCode = salesOrder.code;

    // 2. Resolve Actual Delivery Date from M34 Transport Orders or Goods Issues (M17)
    let actualDeliveryDate: Date | null = null;

    // Check transport orders (M34 logistics)
    try {
      const [transport] = await tx.select().from(schema.transportOrders)
        .where(and(
          eq(schema.transportOrders.salesOrderId, salesOrder.id),
          eq(schema.transportOrders.status, 'DELIVERED')
        ))
        .orderBy(desc(schema.transportOrders.id))
        .limit(1);

      if (transport && transport.plannedDate) {
        actualDeliveryDate = new Date(transport.plannedDate);
      }
    } catch {
      // Non-blocking fallback
    }

    // Check Goods Issue (M17 warehouse dispatch)
    if (!actualDeliveryDate) {
      try {
        const [gi] = await tx.select().from(schema.goodsIssues)
          .where(eq(schema.goodsIssues.salesOrderId, salesOrder.id))
          .orderBy(desc(schema.goodsIssues.id))
          .limit(1);

        if (gi) {
          if (gi.confirmedAt) actualDeliveryDate = new Date(gi.confirmedAt);
          else if (gi.issueDate) actualDeliveryDate = new Date(gi.issueDate);
        }
      } catch {
        // Non-blocking fallback
      }
    }

    // Fallback to Sales Order createdAt or dueDate
    if (!actualDeliveryDate) {
      if (salesOrder.dueDate) actualDeliveryDate = new Date(salesOrder.dueDate);
      else if (salesOrder.createdAt) actualDeliveryDate = new Date(salesOrder.createdAt);
    }

    result.deliveryDate = actualDeliveryDate;

    if (actualDeliveryDate) {
      const diffMs = returnDate.getTime() - actualDeliveryDate.getTime();
      const elapsedDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      result.elapsedDays = elapsedDays;

      if (elapsedDays > policyWindowDays) {
        result.isWithinWindow = false;
        result.warning = `Đơn hàng [${salesOrder.code}] đã giao thành công cách đây ${elapsedDays} ngày, vượt khung chính sách đổi trả ${policyWindowDays} ngày.`;
        result.flag = {
          rule: 'RETURN_WINDOW_EXCEEDED',
          description: result.warning,
          diffDays: elapsedDays,
          windowDays: policyWindowDays
        };
      }
    }

    return result;
  }

  /**
   * Phase 04 & Phase 06 Gate: Query and Validate Serial Numbers & Warranty Claims (M23 Gate).
   * Checks seal status, warranty activation date, warranty expiration date, and original Sales Order linkage.
   */
  static async checkSerialWarranty(
    serialIdentifier: string | number,
    productId?: number | null,
    manualTamperCheck: boolean = false,
    tamperReason?: string,
    orderContext?: {
      orderId?: number | null;
      orderCode?: string | null;
      customerId?: number | null;
      customerName?: string | null;
    },
    tx: any = db
  ): Promise<SerialWarrantyCheckResult> {
    const result: SerialWarrantyCheckResult = {
      serialId: null,
      serialNumber: String(serialIdentifier),
      productId: productId || null,
      warrantyStatus: 'VALID',
      warrantyStartDate: null,
      warrantyEndDate: null,
      warrantyMonths: 12,
      isTampered: manualTamperCheck,
      tamperReason,
      isLinkedToOrder: true,
      orderLinkDetails: {
        orderId: orderContext?.orderId || null,
        orderCode: orderContext?.orderCode || null,
        customerName: orderContext?.customerName || null
      },
      activeClaimsCount: 0,
      warnings: [],
      flags: []
    };

    let snRecord: any = null;
    if (typeof serialIdentifier === 'number') {
      const [found] = await tx.select().from(schema.serialNumbers)
        .where(eq(schema.serialNumbers.id, serialIdentifier))
        .limit(1);
      snRecord = found;
    } else {
      const [found] = await tx.select().from(schema.serialNumbers)
        .where(eq(schema.serialNumbers.serialNumber, String(serialIdentifier)))
        .limit(1);
      snRecord = found;
    }

    if (!snRecord) {
      result.warnings.push(`Số Serial [${serialIdentifier}] chưa được đăng ký trong danh bạ quản lý số serial M23.`);
      return result;
    }

    result.serialId = snRecord.id;
    result.serialNumber = snRecord.serialNumber;
    result.productId = snRecord.productId;
    result.warrantyMonths = snRecord.warrantyMonths || 12;

    if (snRecord.warrantyStartDate) {
      result.warrantyStartDate = new Date(snRecord.warrantyStartDate);
    }
    if (snRecord.warrantyEndDate) {
      result.warrantyEndDate = new Date(snRecord.warrantyEndDate);
    }

    // 1. Check Seal Tampering
    let customAttrs: any = {};
    try {
      if (snRecord.customAttributes) {
        customAttrs = typeof snRecord.customAttributes === 'string'
          ? JSON.parse(snRecord.customAttributes)
          : snRecord.customAttributes;
      }
    } catch {}

    const isTampered = manualTamperCheck || customAttrs.isTampered === true || customAttrs.sealStatus === 'BROKEN' || customAttrs.sealStatus === 'TAMPERED';
    if (isTampered) {
      result.isTampered = true;
      result.warrantyStatus = 'VOID_TAMPERED';
      const reason = tamperReason || customAttrs.tamperReason || 'Phát hiện rách tem niêm phong hoặc can thiệp kỹ thuật trái phép';
      result.warnings.push(`Serial [${snRecord.serialNumber}] mất quyền bảo hành: ${reason}.`);
      result.flags.push({
        rule: 'WARRANTY_VOID_TAMPERED',
        serialNumber: snRecord.serialNumber,
        description: `Tem niêm phong bảo hành của thiết bị đã bị rách hoặc can thiệp trái phép (${reason}).`,
        tamperReason: reason
      });
    }

    // 2. Check Warranty Expiry
    if (result.warrantyStatus !== 'VOID_TAMPERED') {
      const now = Date.now();
      if (result.warrantyEndDate && result.warrantyEndDate.getTime() < now) {
        result.warrantyStatus = 'EXPIRED';
        const expiredDateStr = result.warrantyEndDate.toISOString().slice(0, 10);
        result.warnings.push(`Serial [${snRecord.serialNumber}] đã hết hạn bảo hành vào ngày ${expiredDateStr}.`);
        result.flags.push({
          rule: 'WARRANTY_EXPIRED',
          serialNumber: snRecord.serialNumber,
          warrantyEndDate: expiredDateStr,
          description: `Sản phẩm mang số Serial [${snRecord.serialNumber}] đã hết hạn bảo hành chính hãng kể từ ngày ${expiredDateStr}.`
        });
      }
    }

    // 3. Check existing Warranty Claims (M23)
    try {
      const claims = await tx.select().from(schema.warrantyClaims)
        .where(eq(schema.warrantyClaims.serialNumber, snRecord.serialNumber));
      result.activeClaimsCount = claims.length;

      const rejectedClaim = claims.find((c: any) => c.status === 'REJECTED');
      if (rejectedClaim) {
        result.warnings.push(`Serial [${snRecord.serialNumber}] từng bị từ chối bảo hành: ${rejectedClaim.issueDescription}`);
        result.flags.push({
          rule: 'PREVIOUS_CLAIM_REJECTED',
          serialNumber: snRecord.serialNumber,
          claimCode: rejectedClaim.claimCode,
          description: `Serial này có lịch sử khiếu nại bảo hành bị từ chối trước đó [${rejectedClaim.claimCode}].`
        });
      }
    } catch {}

    // 4. Phase 06 Gate: Validate Serial Origin against Sales Order (M13 SO Verification)
    if (orderContext && (orderContext.orderCode || orderContext.orderId)) {
      try {
        let isSoldToOrder = false;
        // Check serial history
        const histories = await tx.select().from(schema.serialHistory)
          .where(eq(schema.serialHistory.serialId, snRecord.id));
        
        for (const h of histories) {
          if (orderContext.orderCode && h.referenceNo && h.referenceNo.includes(orderContext.orderCode)) {
            isSoldToOrder = true;
            break;
          }
          if (orderContext.orderId && h.notes && h.notes.includes(String(orderContext.orderId))) {
            isSoldToOrder = true;
            break;
          }
        }

        // Also check if serial is still IN_STOCK (never dispatched)
        if (snRecord.status === 'IN_STOCK') {
          result.isLinkedToOrder = false;
          const warnMsg = `Serial [${snRecord.serialNumber}] hiện đang ở trạng thái IN_STOCK (chưa từng được xuất kho bán cho đơn hàng ${orderContext.orderCode || orderContext.orderId}).`;
          result.warnings.push(warnMsg);
          result.flags.push({
            rule: 'SERIAL_NOT_SOLD_IN_ORDER',
            serialNumber: snRecord.serialNumber,
            orderCode: orderContext.orderCode,
            description: warnMsg
          });
        }
      } catch (checkErr) {
        console.warn("Serial order linkage check warning:", checkErr);
      }
    }

    return result;
  }

  /**
   * Comprehensive Gate: Validate complete RMA Creation & Eligibility.
   */
  static async validateRmaEligibility(
    params: RmaEligibilityValidationParams,
    tx: any = db
  ): Promise<RmaValidationReport> {
    const report: RmaValidationReport = {
      isValid: true,
      canProceed: true,
      requiresSupervisorApproval: false,
      detectedWarrantyStatus: 'VALID',
      returnWindowCheck: {
        isWithinWindow: true,
        returnWindowDays: params.returnWindowDays || 30,
        deliveryDate: null,
        returnDate: new Date(),
        elapsedDays: 0,
        orderCode: null
      },
      serialChecks: [],
      errors: [],
      warnings: [],
      flags: []
    };

    // 1. Sales Order Existence & Quantity Check (M13 Gate)
    if (params.orderCode || params.orderId) {
      let salesOrder: any = null;
      if (typeof params.orderId === 'number' || (!isNaN(Number(params.orderId)) && Number(params.orderId) > 0)) {
        const [found] = await tx.select().from(schema.salesOrders)
          .where(eq(schema.salesOrders.id, Number(params.orderId)))
          .limit(1);
        salesOrder = found;
      } else if (params.orderCode) {
        const [found] = await tx.select().from(schema.salesOrders)
          .where(eq(schema.salesOrders.code, String(params.orderCode)))
          .limit(1);
        salesOrder = found;
      }

      if (!salesOrder) {
        report.isValid = false;
        report.canProceed = false;
        report.errors.push(`Đơn hàng [${params.orderCode || params.orderId}] không tồn tại trên hệ thống bán hàng M13.`);
      } else {
        // Check item quantity against SO items
        const soItems = await tx.select().from(schema.salesOrderItems)
          .where(eq(schema.salesOrderItems.orderId, salesOrder.id));

        const items = params.items || [];
        for (const it of items) {
          let targetProdId = it.productId;
          if (!targetProdId && it.productCode) {
            const [p] = await tx.select().from(schema.products).where(eq(schema.products.sku, it.productCode)).limit(1);
            if (p) targetProdId = p.id;
          }

          const matchingSoItem = soItems.find((si: any) =>
            (targetProdId && si.productId === targetProdId)
          );

          const maxAllowedQty = matchingSoItem
            ? Number(matchingSoItem.quantity)
            : (soItems.reduce((acc: number, curr: any) => acc + Number(curr.quantity || 0), 0) || 1);
          if (it.quantity > maxAllowedQty) {
            report.isValid = false;
            report.canProceed = false;
            report.errors.push(`Số lượng yêu cầu đổi trả (${it.quantity}) vượt quá số lượng mua cho phép (${maxAllowedQty}) của đơn hàng ${salesOrder.code}.`);
          }
        }
      }

      // 1b. Return Window Check
      const windowRes = await this.checkReturnWindow(
        params.orderCode || params.orderId,
        params.returnDate || new Date(),
        params.returnWindowDays || 30,
        tx
      );
      report.returnWindowCheck = windowRes;

      if (!windowRes.isWithinWindow && windowRes.flag) {
        report.warnings.push(windowRes.warning || 'Vượt quá thời hạn đổi trả quy định');
        report.flags.push(windowRes.flag);
        report.requiresSupervisorApproval = true;
        if (report.detectedWarrantyStatus === 'VALID') {
          report.detectedWarrantyStatus = 'EXPIRED';
        }
      }
    }

    // 2. Serial & Warranty Check for all items
    const items = params.items || [];
    for (const it of items) {
      if (it.serialId || it.lotSerial) {
        const serialCheck = await this.checkSerialWarranty(
          it.serialId || it.lotSerial!,
          it.productId,
          it.isTampered || it.condition === 'DAMAGED_SEAL' || it.condition === 'TAMPERED',
          it.tamperReason,
          {
            orderId: params.orderId,
            orderCode: params.orderCode,
            customerId: params.customerId
          },
          tx
        );
        report.serialChecks.push(serialCheck);

        if (serialCheck.flags.length > 0) {
          report.flags.push(...serialCheck.flags);
          report.warnings.push(...serialCheck.warnings);
          report.requiresSupervisorApproval = true;

          if (serialCheck.warrantyStatus === 'VOID_TAMPERED') {
            report.detectedWarrantyStatus = 'VOID_TAMPERED';
          } else if (serialCheck.warrantyStatus === 'EXPIRED' && report.detectedWarrantyStatus !== 'VOID_TAMPERED') {
            report.detectedWarrantyStatus = 'EXPIRED';
          }
        }
      }
    }

    return report;
  }
}
