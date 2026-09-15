/**
 * NEXUSSYNC ERP - M13 SALES ORDER INTEGRATION TYPES
 * Cross-module synchronized interfaces connecting:
 * - M13: Sales Orders & Order-to-Cash
 * - M07: Customer Master, Credit Limit & Pricing Matrix
 * - M16: POS Retail & Omnichannel Orders
 * - M17 / M24: WMS Inventory Reservation & Fulfillment
 * - M31: E-Invoicing (Nghị định 123/2020/NĐ-CP & Thông tư 78)
 * - M30: GL Accounting (TK 131, 511, 33311)
 */

export type SalesOrderChannel = 'B2B_ENTERPRISE' | 'POS_RETAIL' | 'POS' | 'OMNICHANNEL' | 'CRM_QUOTATION';

export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'INVOICED' | 'FULFILLED' | 'PAID' | 'CANCELLED';

export type InventoryReservationStatus = 'PENDING' | 'RESERVED' | 'PARTIAL' | 'RELEASED' | 'CONSUMED';

export type FulfillmentStatus = 'PENDING_PICKING' | 'PACKING' | 'STAGING' | 'SHIPPED' | 'DELIVERED';

export type VatInvoiceStatus = 'NOT_ISSUED' | 'PENDING_SIGN' | 'PENDING_ISSUE' | 'ISSUED' | 'REPLACED' | 'CANCELLED';

export type PaymentMethodType = 'BANK_TRANSFER' | 'CASH' | 'CREDIT_CARD' | 'QR_PAY' | 'DEPOSIT_OFFSET' | 'DEFERRED_NET30';

export type PaymentSettlementStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';

export type CustomerTierLevel = 'VIP_DIAMOND' | 'VIP_GOLD' | 'VIP_SILVER' | 'STANDARD';

// ==========================================
// 1. M07 CUSTOMER MASTER PROFILE INTERFACES
// ==========================================

export interface M07CustomerMasterProfile {
  id: number;
  customerCode: string;
  name: string;
  customerName?: string;
  customerId?: number;
  tradeName?: string;
  taxCode?: string;
  tier: CustomerTierLevel;
  creditLimit: number;
  availableCredit: number;
  outstandingBalance: number;
  pendingOrdersAmount?: number;
  paymentTermsDays: number; // e.g., 0 (Immediate), 15, 30, 60
  defaultDiscountPercent: number; // e.g., 0%, 5%, 10%
  billingAddress: string;
  address?: string;
  shippingAddress?: string;
  email: string;
  billingEmail?: string;
  phone: string;
  contactPerson?: string;
  isCreditBlocked: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface M07CustomerCreditCheckResult {
  isApproved: boolean;
  approved?: boolean;
  customerId: number | string;
  name?: string;
  customerName: string;
  creditLimit: number;
  currentBalance?: number;
  currentOutstanding?: number;
  orderAmount?: number;
  newOrderAmount?: number;
  remainingAvailableCredit?: number;
  availableCreditAfterOrder?: number;
  warningMessage?: string;
  blockReason?: string;
  rejectionReason?: string;
  reason?: string;
  exceededAmount?: number;
}

// ==========================================
// 2. M16 POS RETAIL & OMNICHANNEL INTERFACES
// ==========================================

export interface M16PosOrderItem {
  sku: string;
  barcode?: string;
  name: string;
  quantity: number;
  uop: string; // Unit of measure (Cái, Chiếc, Bộ, Hộp...)
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  lineSubtotal: number;
  taxRate?: number; // 0, 5, 8, 10
  taxAmount?: number;
  lineTotal: number;
  totalPrice?: number;
}

export interface M16PosVatInvoiceDetails {
  buyerLegalName: string;
  vatTaxId: string;
  vatAddress: string;
  vatEmail: string;
  note?: string;
  address?: string;
  taxCode?: string;
  email?: string;
}

export interface M16PosOrderPayload {
  orderId: string;
  orderNumber?: string;
  posTerminalId: string;
  storeId: string;
  storeName?: string;
  cashierId: string;
  cashierName?: string;
  shiftId?: string;
  customerCode?: string;
  customerName?: string;
  name?: string;
  shippingAddress?: string;
  items: M16PosOrderItem[];
  subtotal: number;
  totalDiscount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  changeGiven?: number;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentSettlementStatus;
  paymentRef?: string;
  requiresVatInvoice: boolean;
  vatDetails?: M16PosVatInvoiceDetails;
  invoiceRef?: string;
  createdAt: string;
  source: 'POS_TERMINAL' | 'ONLINE_STORE' | 'KIOSK';
  address?: string;
  taxCode?: string;
  email?: string;
  buyerLegalName?: string;
  billingEmail?: string;
}

// ==========================================
// 3. M13 UNIFIED INTEGRATED SALES ORDER
// ==========================================

export interface M13SalesOrderItem {
  id?: string | number;
  sku: string;
  name: string;
  qty: number;
  uop?: string;
  price?: number | string;
  unitPriceNumeric?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  amount?: number;
  totalPrice?: number;
  notes?: string;
}

export interface M13IntegratedSalesOrder {
  id: string;
  orderCode?: string;
  channel: SalesOrderChannel;
  sourceModule: 'M13_SALES' | 'M16_POS' | 'M12_CRM' | 'OMNICHANNEL';
  
  // Customer Data (M07 linkage)
  customerId?: number | string;
  customerCode?: string;
  customerName: string;
  name?: string;
  customerTier?: CustomerTierLevel;
  taxCode?: string;
  address: string;
  billingAddress?: string;
  deliveryAddress?: string;
  billingEmail: string;
  email?: string;
  phone?: string;
  contactPerson?: string;

  // Dates
  orderDate: string;
  deliveryDate?: string;
  createdAt?: string;
  updatedAt?: string;

  // Financial Breakdown (With strict 0 tolerance)
  items: M13SalesOrderItem[];
  subtotalAmount: number;
  discountPercentage: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: string | number;
  totalAmountNumeric: number;
  amountPaid: number;
  balanceDue: number;

  // Statuses
  status: SalesOrderStatus;
  paymentStatus: PaymentSettlementStatus;
  paymentMethod?: PaymentMethodType;
  paymentRef?: string | null;

  // Supply Chain & WMS (M17/M24)
  reservationStatus: InventoryReservationStatus;
  fulfillmentStatus: FulfillmentStatus;
  warehouseId?: string;
  trackingNumber?: string;

  // E-Invoice (M31 - NĐ 123/2020)
  requiresVatInvoice?: boolean;
  vatStatus: VatInvoiceStatus;
  vatInvoiceNumber: string | null;
  vatSerial: string | null;
  cqtCode: string | null;
  lookupCode: string | null;
  vatDetails?: M16PosVatInvoiceDetails | null;

  // Quotation linkage (M12)
  quotationRef?: string | null;

  // Notes & Audit
  notes?: string;
  createdBy?: string;
}
