import {
  M07CustomerMasterProfile,
  M07CustomerCreditCheckResult,
  M13IntegratedSalesOrder,
  M16PosOrderPayload,
  M16PosVatInvoiceDetails
} from '../types/salesOrderIntegration';
import { safeNumber, normalizeSalesOrder, calculateOrderFinancials } from '../utils/salesOrderDataNormalizer';

/**
 * Validation result object
 */
export interface SalesOrderCustomerValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  matchedCustomer?: M07CustomerMasterProfile;
  creditCheck?: M07CustomerCreditCheckResult;
  suggestedPatch?: Partial<M13IntegratedSalesOrder>;
}

/**
 * Vietnam Tax Code (MST) regular expression:
 * - 10 digits for primary enterprise code: e.g. 0108765432
 * - 13 digits with hyphen for branches/units: e.g. 0108765432-001
 */
const VIETNAM_TAX_CODE_REGEX = /^[0-9]{10}(-[0-9]{3})?$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class SalesOrderSyncService {
  /**
   * Validate Vietnam Tax Identification Number (Mã số thuế)
   */
  static validateTaxCode(taxCode?: string | null): {
    isValid: boolean;
    message?: string;
    format?: 'ENTERPRISE_10_DIGIT' | 'BRANCH_13_DIGIT' | 'INVALID';
  } {
    if (!taxCode || typeof taxCode !== 'string' || taxCode.trim() === '') {
      return { isValid: false, message: 'Mã số thuế không được để trống khi yêu cầu xuất HĐĐT.', format: 'INVALID' };
    }
    const clean = taxCode.trim();
    if (!VIETNAM_TAX_CODE_REGEX.test(clean)) {
      return {
        isValid: false,
        message: `Mã số thuế [${clean}] không đúng định dạng chuẩn Việt Nam (10 chữ số doanh nghiệp hoặc 13 chữ số chi nhánh - ví dụ: 0108765432 hoặc 0108765432-001).`,
        format: 'INVALID'
      };
    }
    const format = clean.includes('-') || clean.length === 14 || clean.length === 13
      ? 'BRANCH_13_DIGIT'
      : 'ENTERPRISE_10_DIGIT';
    return { isValid: true, format };
  }

  /**
   * Validate Email address format
   */
  static validateEmail(email?: string | null): { isValid: boolean; message?: string } {
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return { isValid: true }; // Optional if not required
    }
    const clean = email.trim();
    if (!EMAIL_REGEX.test(clean)) {
      return { isValid: false, message: `Email nhận hóa đơn [${clean}] không hợp lệ.` };
    }
    return { isValid: true };
  }

  /**
   * Match a customer from M07 Master Database based on ID, Code, Tax Code, or Name
   */
  static matchCustomer(
    query: { id?: number; code?: string; taxCode?: string; name?: string; email?: string },
    customerList: M07CustomerMasterProfile[]
  ): M07CustomerMasterProfile | undefined {
    if (!customerList || customerList.length === 0) return undefined;

    // 1. Match by ID
    if (query.id !== undefined && query.id !== null) {
      const found = customerList.find(c => c.customerId === query.id);
      if (found) return found;
    }

    // 2. Match by Customer Code (exact match)
    if (query.code) {
      const qCode = query.code.trim().toUpperCase();
      const found = customerList.find(c => c.customerCode.trim().toUpperCase() === qCode);
      if (found) return found;
    }

    // 3. Match by Tax Code (MST)
    if (query.taxCode) {
      const qTax = query.taxCode.replace(/[^0-9]/g, '');
      if (qTax.length >= 10) {
        const found = customerList.find(c => (c.taxCode ?? '').replace(/[^0-9]/g, '') === qTax);
        if (found) return found;
      }
    }

    // 4. Match by Email
    if (query.email) {
      const qEmail = query.email.trim().toLowerCase();
      const found = customerList.find(c => (c.email ?? '').trim().toLowerCase() === qEmail);
      if (found) return found;
    }

    // 5. Match by exact or normalized Name
    if (query.name) {
      const qName = query.name.trim().toLowerCase();
      const found = customerList.find(c => 
        c.customerName.trim().toLowerCase() === qName || 
        (c.companyName ?? '').trim().toLowerCase() === qName
      );
      if (found) return found;
    }

    return undefined;
  }

  /**
   * Check Credit Limit and Payment Terms against M07 Customer Profile
   */
  static checkCustomerCredit(
    customer: M07CustomerMasterProfile,
    newOrderAmount: number
  ): M07CustomerCreditCheckResult {
    const cleanAmount = safeNumber(newOrderAmount, 0);

    if (customer.isCreditBlocked) {
      return {
        approved: false,
        customerId: customer.customerId,
        customerName: customer.customerName,
        creditLimit: customer.creditLimit,
        currentOutstanding: customer.outstandingBalance,
        newOrderAmount: cleanAmount,
        availableCreditAfterOrder: customer.availableCredit - cleanAmount,
        exceededAmount: cleanAmount,
        reason: `Khách hàng [${customer.customerCode}] ${customer.customerName} đang bị KHÓA CÔNG NỢ (Credit Blocked) theo chính sách M07.`
      };
    }

    // If customer has no credit limit configured (0 or negative means COD only unless enterprise unlimited)
    if (customer.creditLimit > 0) {
      const availableCredit = customer.availableCredit;
      if (cleanAmount > availableCredit) {
        const exceeded = cleanAmount - availableCredit;
        return {
          approved: false,
          customerId: customer.customerId,
          customerName: customer.customerName,
          creditLimit: customer.creditLimit,
          currentOutstanding: customer.outstandingBalance,
          newOrderAmount: cleanAmount,
          availableCreditAfterOrder: availableCredit - cleanAmount,
          exceededAmount: exceeded,
          reason: `Đơn hàng (${cleanAmount.toLocaleString('vi-VN')} đ) vượt hạn mức tín dụng còn lại (${availableCredit.toLocaleString('vi-VN')} đ) của khách hàng [${customer.customerCode}]. Vượt quá: ${exceeded.toLocaleString('vi-VN')} đ.`
        };
      }
    }

    return {
      approved: true,
      customerId: customer.customerId,
      customerName: customer.customerName,
      creditLimit: customer.creditLimit,
      currentOutstanding: customer.outstandingBalance,
      newOrderAmount: cleanAmount,
      availableCreditAfterOrder: (customer.availableCredit ?? customer.creditLimit) - cleanAmount,
      exceededAmount: 0
    };
  }

  /**
   * Validate full Sales Order against M07 Customer Master data and VAT regulations
   */
  static validateOrderConsistency(
    order: Partial<M13IntegratedSalesOrder>,
    customers: M07CustomerMasterProfile[]
  ): SalesOrderCustomerValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Identify matched Customer from M07
    const matchedCustomer = this.matchCustomer(
      {
        id: order.customerId,
        code: order.customerCode,
        taxCode: order.taxCode,
        name: order.customerName,
        email: order.billingEmail
      },
      customers
    );

    // 2. Customer Name Validation
    if (!order.customerName || order.customerName.trim() === '') {
      errors.push('Tên khách hàng là bắt buộc trong Sales Order.');
    }

    // 3. VAT Invoice Compliance Validation (Nghị định 123 & Thông tư 78)
    if (order.requiresVatInvoice) {
      if (!order.taxCode || order.taxCode.trim() === '') {
        errors.push('Mã số thuế (MST) là bắt buộc khi đơn hàng yêu cầu xuất Hóa đơn điện tử VAT.');
      } else {
        const taxVal = this.validateTaxCode(order.taxCode);
        if (!taxVal.isValid && taxVal.message) {
          errors.push(taxVal.message);
        }
      }

      if (!order.billingEmail || order.billingEmail.trim() === '') {
        warnings.push('Chưa có email nhận hóa đơn điện tử VAT (hệ thống sẽ dùng email mặc định của doanh nghiệp).');
      } else {
        const emailVal = this.validateEmail(order.billingEmail);
        if (!emailVal.isValid && emailVal.message) {
          errors.push(emailVal.message);
        }
      }

      if (!order.address || order.address.trim() === '') {
        warnings.push('Địa chỉ xuất hóa đơn VAT chưa có đầy đủ.');
      }
    }

    // 4. Check Consistency against Matched Customer in M07
    let suggestedPatch: Partial<M13IntegratedSalesOrder> | undefined = undefined;
    let creditCheck: M07CustomerCreditCheckResult | undefined = undefined;

    if (matchedCustomer) {
      const patch: Partial<M13IntegratedSalesOrder> = {};
      let needsPatch = false;

      // Link Customer ID and Code if missing
      if (!order.customerId && matchedCustomer.customerId) {
        patch.customerId = matchedCustomer.customerId;
        needsPatch = true;
      }
      if (!order.customerCode && matchedCustomer.customerCode) {
        patch.customerCode = matchedCustomer.customerCode;
        needsPatch = true;
      }
      if (!order.customerTier && matchedCustomer.tier) {
        patch.customerTier = matchedCustomer.tier;
        needsPatch = true;
      }
      if (!order.taxCode && matchedCustomer.taxCode) {
        patch.taxCode = matchedCustomer.taxCode;
        needsPatch = true;
      }
      if (!order.billingEmail && (matchedCustomer.billingEmail ?? matchedCustomer.email)) {
        patch.billingEmail = matchedCustomer.billingEmail ?? matchedCustomer.email;
        needsPatch = true;
      }
      if (!order.address && (matchedCustomer.billingAddress ?? matchedCustomer.address)) {
        patch.address = matchedCustomer.billingAddress ?? matchedCustomer.address;
        needsPatch = true;
      }

      // Check for discrepancies between order and M07 Master
      if (order.taxCode && matchedCustomer.taxCode && order.taxCode.trim() !== matchedCustomer.taxCode.trim()) {
        warnings.push(`Mã số thuế trên đơn hàng (${order.taxCode}) khác với MST đã lưu trong Master Data M07 (${matchedCustomer.taxCode}).`);
      }

      // Credit limit validation
      const orderAmount = typeof order.totalAmountNumeric === 'number' 
        ? order.totalAmountNumeric 
        : safeNumber(order.totalAmount, 0);

      creditCheck = this.checkCustomerCredit(matchedCustomer, orderAmount);
      if (!creditCheck.approved && creditCheck.reason) {
        // High severity warning / validation error if credit blocked
        if (matchedCustomer.isCreditBlocked) {
          errors.push(creditCheck.reason);
        } else {
          warnings.push(creditCheck.reason);
        }
      }

      if (needsPatch) {
        suggestedPatch = patch;
      }
    } else if (order.customerId) {
      warnings.push(`Khách hàng với mã ID #${order.customerId} không tìm thấy trong danh mục Master Data M07.`);
    }

    // 5. Line items validation
    const items = order.items ?? [];
    if (items.length === 0) {
      errors.push('Đơn hàng phải chứa ít nhất 1 dòng sản phẩm (Line Item).');
    } else {
      items.forEach((it, idx) => {
        if (!it.sku) errors.push(`Dòng #${idx + 1}: Mã SKU không được để trống.`);
        const qty = safeNumber(it.qty ?? (it as any).quantity, 0);
        if (qty <= 0) errors.push(`Dòng #${idx + 1} (${it.sku ?? 'N/A'}): Số lượng phải lớn hơn 0.`);
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      matchedCustomer,
      creditCheck,
      suggestedPatch
    };
  }

  /**
   * Reconcile POS payload from M16 into a fully validated M13 Sales Order
   */
  static reconcilePosOrder(
    posOrder: M16PosOrderPayload,
    customers: M07CustomerMasterProfile[]
  ): {
    normalizedOrder: M13IntegratedSalesOrder;
    validation: SalesOrderCustomerValidationResult;
  } {
    // 1. Normalize POS order to M13 structure
    const customerName = posOrder.customerName ?? (posOrder.vatDetails?.buyerLegalName || 'Khách lẻ POS');
    const taxCode = posOrder.vatDetails?.vatTaxId ?? '';
    const billingEmail = posOrder.vatDetails?.vatEmail ?? '';
    const address = posOrder.deliveryAddress ?? posOrder.vatDetails?.vatAddress ?? 'Cửa hàng Bán lẻ POS';

    const rawOrder: Partial<M13IntegratedSalesOrder> = {
      id: posOrder.posOrderCode ?? `POS-${Date.now()}`,
      orderCode: posOrder.posOrderCode,
      customerName,
      taxCode,
      billingEmail,
      address,
      deliveryAddress: address,
      orderDate: posOrder.createdAt ? posOrder.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
      createdAt: posOrder.createdAt ?? new Date().toISOString(),
      sourceModule: 'M16_POS',
      channel: 'POS',
      requiresVatInvoice: posOrder.requiresVatInvoice ?? false,
      vatDetails: posOrder.vatDetails ?? null,
      taxRate: 10,
      status: 'CONFIRMED',
      reservationStatus: 'RESERVED',
      fulfillmentStatus: 'SHIPPED',
      vatStatus: posOrder.vatDetails?.vatTaxId ? 'PENDING_ISSUE' : 'NOT_ISSUED',
      items: (posOrder.items ?? []).map((it, idx) => ({
        sku: it.sku,
        name: it.productName,
        qty: it.quantity,
        uop: it.uop ?? 'Cái',
        price: it.unitPrice,
        unitPriceNumeric: it.unitPrice,
        discountPercent: it.discountPercent ?? 0,
        amount: Math.round(it.unitPrice * it.quantity * (1 - (it.discountPercent ?? 0) / 100)),
        taxRate: 10
      }))
    };

    // Calculate financials
    const financials = calculateOrderFinancials(rawOrder.items ?? [], 10, 0);
    rawOrder.subtotalAmount = financials.subtotal;
    rawOrder.discountAmount = financials.discountAmount;
    rawOrder.taxAmount = financials.taxAmount;
    rawOrder.totalAmountNumeric = financials.grandTotal;
    rawOrder.totalAmount = `${financials.grandTotal.toLocaleString('vi-VN')} VND`;

    // 2. Validate against M07 Customer Master
    const validation = this.validateOrderConsistency(rawOrder, customers);

    // 3. Apply suggested patches (like enriched customerId)
    if (validation.suggestedPatch) {
      Object.assign(rawOrder, validation.suggestedPatch);
    }

    const normalizedOrder = normalizeSalesOrder(rawOrder);
    return {
      normalizedOrder,
      validation
    };
  }
}
