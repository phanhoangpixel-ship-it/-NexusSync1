/**
 * NEXUSSYNC ERP - M13 SALES ORDER DATA NORMALIZER & CALCULATOR
 * Strict compliance:
 * - Uses Nullish Coalescing (??) to prevent legitimate 0 numbers from falling back to falsy defaults.
 * - Handles cross-module syncing between M07 (Customer Master), M16 (POS), and M13 (B2B).
 */

import {
  M13IntegratedSalesOrder,
  M13SalesOrderItem,
  M07CustomerMasterProfile,
  M16PosOrderPayload,
  M07CustomerCreditCheckResult,
} from '../types/salesOrderIntegration';
import { parseNumber } from './numberFormat';

/**
 * Safely parse numeric values with nullish coalescing and NaN protection.
 * Preserves exact 0 values without defaulting. Correctly handles Vietnamese currency formatting.
 */
export function safeNumber(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  if (typeof value === 'number') {
    return isNaN(value) ? fallback : value;
  }
  if (typeof value === 'string') {
    const parsed = parseNumber(value);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

/**
 * Calculate line item financials strictly using Nullish Coalescing (??)
 */
export function calculateLineItemFinancials(
  rawItem: Partial<M13SalesOrderItem> | any
): M13SalesOrderItem {
  const qty = safeNumber(rawItem.qty ?? rawItem.quantity, 1);
  const unitPrice = safeNumber(
    rawItem.unitPriceNumeric ?? rawItem.price ?? rawItem.unitPrice,
    0
  );
  const discountPercent = safeNumber(rawItem.discountPercent, 0);

  const rawSubtotal = qty * unitPrice;
  const discountAmount =
    rawItem.discountAmount !== undefined && rawItem.discountAmount !== null
      ? safeNumber(rawItem.discountAmount, 0)
      : Math.round((rawSubtotal * discountPercent) / 100);

  const lineSubtotalAfterDiscount = Math.max(0, rawSubtotal - discountAmount);
  const taxRate = safeNumber(rawItem.taxRate, 10);
  const taxAmount =
    rawItem.taxAmount !== undefined && rawItem.taxAmount !== null
      ? safeNumber(rawItem.taxAmount, 0)
      : Math.round((lineSubtotalAfterDiscount * taxRate) / 100);

  const totalPrice = lineSubtotalAfterDiscount + taxAmount;

  return {
    id: rawItem.id ?? `ITM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sku: rawItem.sku ?? 'SKU-GEN-01',
    name: rawItem.name ?? 'Sản phẩm tiêu chuẩn',
    qty,
    uop: rawItem.uop ?? rawItem.unit ?? 'Cái',
    price: `${unitPrice.toLocaleString('vi-VN')} VND`,
    unitPriceNumeric: unitPrice,
    discountPercent,
    discountAmount,
    taxRate,
    taxAmount,
    amount: totalPrice,
    totalPrice,
    notes: rawItem.notes ?? '',
  };
}

/**
 * Calculate whole sales order financials with strict nullish coalescing
 */
export function calculateOrderFinancials(
  items: Array<Partial<M13SalesOrderItem> | any>,
  orderTaxRateOverride?: number,
  orderDiscountAmountOverride?: number
) {
  let subtotalBeforeDiscount = 0;
  let totalDiscountAmount = 0;
  let subtotalAfterDiscount = 0;
  let totalTaxAmount = 0;

  for (const raw of items) {
    const item = calculateLineItemFinancials(raw);
    const rawLine = item.qty * item.unitPriceNumeric;
    subtotalBeforeDiscount += rawLine;
    totalDiscountAmount += item.discountAmount;
    subtotalAfterDiscount += (rawLine - item.discountAmount);
    totalTaxAmount += item.taxAmount;
  }

  const effectiveDiscount = orderDiscountAmountOverride ?? totalDiscountAmount;
  const finalSubtotalAfterDiscount = Math.max(0, subtotalBeforeDiscount - effectiveDiscount);
  const effectiveTaxRate = orderTaxRateOverride ?? 10;
  const finalTaxAmount = totalTaxAmount;
  const grandTotal = finalSubtotalAfterDiscount + finalTaxAmount;

  return {
    subtotalBeforeDiscount,
    subtotalAmount: finalSubtotalAfterDiscount,
    subtotalAfterDiscount: finalSubtotalAfterDiscount,
    discountAmount: effectiveDiscount,
    totalDiscountAmount: effectiveDiscount,
    taxRate: effectiveTaxRate,
    taxAmount: finalTaxAmount,
    totalAmountNumeric: grandTotal,
    grandTotal,
    totalAmountFormatted: `${grandTotal.toLocaleString('vi-VN')} VND`,
  };
}

/**
 * Normalizes any raw sales order payload into strict M13IntegratedSalesOrder
 * Ensures no 0 value gets corrupted by `||` fallbacks.
 */
export function normalizeSalesOrder(
  raw: Partial<M13IntegratedSalesOrder> | any
): M13IntegratedSalesOrder {
  const rawItems = Array.isArray(raw?.items) ? raw.items : [];
  const normalizedItems: M13SalesOrderItem[] = rawItems.map((it: any) =>
    calculateLineItemFinancials(it)
  );

  const fallbackSubtotal = normalizedItems.reduce(
    (sum, i) => sum + safeNumber(i.unitPriceNumeric ?? i.price, 0) * safeNumber(i.qty, 1),
    0
  );

  const subtotalAmount = safeNumber(raw?.subtotalAmount ?? raw?.subtotal, fallbackSubtotal);
  const discountPercentage = safeNumber(raw?.discountPercentage ?? raw?.discountPercent, 0);
  const discountAmount = safeNumber(
    raw?.discountAmount,
    Math.round((subtotalAmount * discountPercentage) / 100)
  );

  const taxRate = safeNumber(raw?.taxRate, 10);
  const taxAmount = safeNumber(
    raw?.taxAmount,
    Math.round(((subtotalAmount - discountAmount) * taxRate) / 100)
  );

  const totalAmountNumeric = safeNumber(
    raw?.totalAmountNumeric ?? raw?.totalAmount,
    subtotalAmount - discountAmount + taxAmount
  );

  const amountPaid = safeNumber(raw?.amountPaid, 0);
  const balanceDue = Math.max(0, totalAmountNumeric - amountPaid);

  return {
    id: String(raw?.id ?? `SO-${Date.now()}`),
    orderCode: raw?.orderCode ?? raw?.id ?? `SO-${Date.now()}`,
    channel: raw?.channel ?? (raw?.sourceModule === 'M16_POS' ? 'POS_RETAIL' : 'B2B_ENTERPRISE'),
    sourceModule: raw?.sourceModule ?? 'M13_SALES',

    customerId: raw?.customerId ?? undefined,
    customerCode: raw?.customerCode ?? undefined,
    customerName: raw?.customerName ?? 'Khách hàng B2B Doanh nghiệp',
    customerTier: raw?.customerTier ?? 'STANDARD',
    taxCode: raw?.taxCode ?? '',
    address: raw?.address ?? raw?.deliveryAddress ?? 'Việt Nam',
    deliveryAddress: raw?.deliveryAddress ?? raw?.address ?? 'Việt Nam',
    billingEmail: raw?.billingEmail ?? raw?.email ?? 'invoicing@customer.vn',
    phone: raw?.phone ?? '',
    contactPerson: raw?.contactPerson ?? '',

    orderDate: raw?.orderDate ?? new Date().toISOString().slice(0, 10),
    deliveryDate: raw?.deliveryDate ?? undefined,
    createdAt: raw?.createdAt ?? new Date().toISOString(),
    updatedAt: raw?.updatedAt ?? new Date().toISOString(),

    items: normalizedItems,
    subtotalAmount,
    discountPercentage,
    discountAmount,
    taxRate,
    taxAmount,
    totalAmount: `${totalAmountNumeric.toLocaleString('vi-VN')} VND`,
    totalAmountNumeric,
    amountPaid,
    balanceDue,

    status: raw?.status ?? 'CONFIRMED',
    paymentStatus: raw?.paymentStatus ?? (amountPaid >= totalAmountNumeric ? 'PAID' : amountPaid > 0 ? 'PARTIAL' : 'UNPAID'),
    paymentMethod: raw?.paymentMethod ?? 'BANK_TRANSFER',
    paymentRef: raw?.paymentRef ?? null,

    reservationStatus: raw?.reservationStatus ?? 'RESERVED',
    fulfillmentStatus: raw?.fulfillmentStatus ?? 'PENDING_PICKING',
    warehouseId: raw?.warehouseId ?? 'WH-MAIN-01',
    trackingNumber: raw?.trackingNumber ?? undefined,

    requiresVatInvoice: raw?.requiresVatInvoice ?? false,
    vatStatus: raw?.vatStatus ?? (raw?.vatInvoiceNumber ? 'ISSUED' : 'NOT_ISSUED'),
    vatInvoiceNumber: raw?.vatInvoiceNumber ?? null,
    vatSerial: raw?.vatSerial ?? (raw?.vatInvoiceNumber ? '1C26TAA' : null),
    cqtCode: raw?.cqtCode ?? null,
    lookupCode: raw?.lookupCode ?? null,
    vatDetails: raw?.vatDetails ?? null,

    quotationRef: raw?.quotationRef ?? null,
    notes: raw?.notes ?? '',
    createdBy: raw?.createdBy ?? 'Sales Representative',
  };
}

/**
 * Converts M16 POS Order Payload into M13 Integrated Sales Order
 */
export function convertPosOrderToM13(posOrder: M16PosOrderPayload): M13IntegratedSalesOrder {
  const items: M13SalesOrderItem[] = (posOrder.items ?? []).map((it) => ({
    id: `POS-ITM-${it.sku}`,
    sku: it.sku,
    name: it.name,
    qty: safeNumber(it.quantity, 1),
    uop: it.uop ?? 'Cái',
    price: `${safeNumber(it.unitPrice, 0).toLocaleString('vi-VN')} VND`,
    unitPriceNumeric: safeNumber(it.unitPrice, 0),
    discountPercent: safeNumber(it.discountPercent, 0),
    discountAmount: safeNumber(it.discountAmount, 0),
    taxRate: safeNumber(it.taxRate, posOrder.taxRate ?? 10),
    taxAmount: safeNumber(it.taxAmount, 0),
    amount: safeNumber(it.totalPrice, safeNumber(it.unitPrice, 0) * safeNumber(it.quantity, 1)),
  }));

  const subtotalAmount = safeNumber(posOrder.subtotal, 0);
  const taxRate = safeNumber(posOrder.taxRate, 10);
  const taxAmount = safeNumber(posOrder.taxAmount, 0);
  const totalAmountNumeric = safeNumber(posOrder.totalAmount, subtotalAmount + taxAmount);
  const amountPaid = safeNumber(posOrder.amountPaid, totalAmountNumeric);

  const vatDetails: M16PosVatInvoiceDetails | null = posOrder.vatDetails ?? (posOrder.requiresVatInvoice || posOrder.buyerLegalName ? {
    buyerLegalName: posOrder.buyerLegalName ?? posOrder.customerName ?? 'Khách hàng POS',
    taxCode: posOrder.taxCode ?? '',
    vatTaxId: posOrder.taxCode ?? '',
    address: posOrder.address ?? 'Cửa hàng POS NexusSync',
    vatAddress: posOrder.address ?? 'Cửa hàng POS NexusSync',
    email: posOrder.email ?? posOrder.billingEmail ?? 'invoicing@nexussync.vn',
    vatEmail: posOrder.email ?? posOrder.billingEmail ?? 'invoicing@nexussync.vn',
  } : null);

  return {
    id: posOrder.orderId ?? `SO-POS-${Date.now()}`,
    orderCode: posOrder.orderId,
    channel: 'POS_RETAIL',
    sourceModule: 'M16_POS',

    customerCode: posOrder.customerCode ?? 'CUST-RETAIL',
    customerName: posOrder.customerName ?? (vatDetails?.buyerLegalName || 'Khách lẻ vãng lai POS'),
    taxCode: vatDetails?.taxCode ?? posOrder.vatDetails?.taxCode ?? '',
    address: vatDetails?.address ?? 'Cửa hàng POS NexusSync',
    deliveryAddress: vatDetails?.address ?? 'Cửa hàng POS NexusSync',
    billingEmail: vatDetails?.email ?? 'invoicing@nexussync.vn',

    orderDate: posOrder.createdAt ? posOrder.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    createdAt: posOrder.createdAt ?? new Date().toISOString(),

    items,
    subtotalAmount,
    discountPercentage: safeNumber(posOrder.totalDiscount > 0 ? (posOrder.totalDiscount / (subtotalAmount || 1)) * 100 : 0, 0),
    discountAmount: safeNumber(posOrder.totalDiscount, 0),
    taxRate,
    taxAmount,
    totalAmount: `${totalAmountNumeric.toLocaleString('vi-VN')} VND`,
    totalAmountNumeric,
    amountPaid,
    balanceDue: Math.max(0, totalAmountNumeric - amountPaid),

    status: posOrder.paymentStatus === 'PAID' ? 'CONFIRMED' : 'DRAFT',
    paymentStatus: posOrder.paymentStatus ?? 'PAID',
    paymentMethod: posOrder.paymentMethod ?? 'CASH',
    paymentRef: posOrder.paymentRef ?? null,

    reservationStatus: 'CONSUMED',
    fulfillmentStatus: 'SHIPPED',

    requiresVatInvoice: posOrder.requiresVatInvoice ?? Boolean(vatDetails),
    vatStatus: posOrder.invoiceRef ? 'ISSUED' : 'NOT_ISSUED',
    vatInvoiceNumber: posOrder.invoiceRef ?? null,
    vatSerial: posOrder.invoiceRef ? '1C26TAA' : null,
    cqtCode: posOrder.invoiceRef ? `T26-0001-${posOrder.orderId}` : null,
    lookupCode: posOrder.invoiceRef ? `NX${posOrder.orderId}` : null,
    vatDetails,
  };
}

/**
 * Checks customer credit limit for M07 integration
 */
export function checkCustomerCreditLimit(
  customer: M07CustomerMasterProfile,
  requestedOrderAmount: number
): M07CustomerCreditCheckResult {
  const creditLimit = safeNumber(customer.creditLimit, 0);
  const currentBalance = safeNumber(customer.outstandingBalance, 0);
  const pendingOrders = safeNumber(customer.pendingOrdersAmount, 0);
  const totalExposure = currentBalance + pendingOrders + requestedOrderAmount;
  const remainingAvailable = creditLimit - (currentBalance + pendingOrders);

  if (customer.isCreditBlocked) {
    return {
      isApproved: false,
      customerId: customer.id,
      customerName: customer.name,
      creditLimit,
      currentBalance,
      orderAmount: requestedOrderAmount,
      remainingAvailableCredit: remainingAvailable,
      blockReason: 'Tài khoản khách hàng đang bị tạm khóa cấp tín dụng bởi Giám đốc Tài chính.',
    };
  }

  if (totalExposure > creditLimit && creditLimit > 0) {
    return {
      isApproved: false,
      customerId: customer.id,
      customerName: customer.name,
      creditLimit,
      currentBalance,
      orderAmount: requestedOrderAmount,
      remainingAvailableCredit: remainingAvailable,
      warningMessage: `Vượt hạn mức tín dụng ${((totalExposure - creditLimit)).toLocaleString('vi-VN')} đ. Cần thu hồi công nợ hoặc xét duyệt đặc cách.`,
    };
  }

  return {
    isApproved: true,
    customerId: customer.id,
    customerName: customer.name,
    creditLimit,
    currentBalance,
    orderAmount: requestedOrderAmount,
    remainingAvailableCredit: remainingAvailable - requestedOrderAmount,
  };
}
