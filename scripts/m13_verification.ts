import { normalizeSalesOrder, safeNumber, calculateLineItemFinancials, calculateOrderFinancials, convertPosOrderToM13 } from '../src/utils/salesOrderDataNormalizer';
import { SalesOrderSyncService } from '../src/services/SalesOrderSyncService';
import { M07CustomerMasterProfile, M16PosOrderPayload, M13NormalizedSalesOrder } from '../src/types/salesOrderIntegration';

console.log('================================================================');
console.log('  NEXUSSYNC ERP - M13 B2B SALES ORDERS VERIFICATION SUITE');
console.log('  Architecture Compliance: 20 Rules, Single-Writer, M07/M16 Sync');
console.log('================================================================\n');

let passCount = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passCount++;
    console.log(`[PASS] Test ${totalTests.toString().padStart(2, '0')}: ${testName}`);
  } else {
    console.error(`[FAIL] Test ${totalTests.toString().padStart(2, '0')}: ${testName}`);
    if (detail) console.error(`       Detail: ${detail}`);
  }
}

// 1. safeNumber tests
assert(safeNumber(0, 100) === 0, 'safeNumber preserves 0 as a valid number (not falling back to 100)');
assert(safeNumber(null, 50) === 50, 'safeNumber falls back to default on null');
assert(safeNumber(undefined, 25) === 25, 'safeNumber falls back to default on undefined');
assert(safeNumber('123000', 0) === 123000, 'safeNumber parses numeric strings properly');
assert(safeNumber('abc', 10) === 10, 'safeNumber falls back on NaN string');

// 2. calculateLineItemFinancials tests with nullish coalescing
const zeroDiscountItem = calculateLineItemFinancials({
  sku: 'SKU-001',
  name: 'Thép hộp',
  qty: 10,
  unitPrice: 500000,
  discountPercent: 0,
  taxRate: 0
});
assert(zeroDiscountItem.discountPercent === 0, 'Line item retains 0% discountPercent correctly');
assert(zeroDiscountItem.taxRate === 0, 'Line item retains 0% taxRate correctly');
assert(zeroDiscountItem.lineTotal === 5000000, 'Line total is exact (10 * 500,000 = 5,000,000)');

// 3. calculateOrderFinancials tests
const orderFinancials = calculateOrderFinancials(
  [
    { sku: 'SKU-001', qty: 2, unitPrice: 1000000, discountPercent: 10, taxRate: 10 },
    { sku: 'SKU-002', qty: 5, unitPrice: 200000, discountPercent: 0, taxRate: 8 }
  ],
  10
);
assert(orderFinancials.subtotalBeforeDiscount === 3000000, 'Subtotal before discount is correct (2M + 1M = 3M)');
assert(orderFinancials.totalDiscountAmount === 200000, 'Discount amount is correct (10% of 2M = 200k)');
assert(orderFinancials.subtotalAfterDiscount === 2800000, 'Subtotal after discount is 2,800,000');
assert(orderFinancials.grandTotal > 2800000, 'Grand total includes VAT tax calculations');

// 4. normalizeSalesOrder nullish coalescing & default protection
const rawOrder = {
  id: 'SO-TEST-001',
  customerName: 'Công ty Alpha',
  taxRate: 0,
  totalAmount: 0,
  items: [
    { sku: 'SKU-01', price: 0, qty: 0 }
  ]
};
const normalized = normalizeSalesOrder(rawOrder);
assert(normalized.taxRate === 0, 'normalizeSalesOrder preserves taxRate: 0 without fallback to 10%');
assert(normalized.totalAmountNumeric === 0, 'normalizeSalesOrder preserves totalAmountNumeric: 0');
assert(normalized.items[0].unitPriceNumeric === 0, 'normalizeSalesOrder preserves line item price: 0');

// 5. Vietnam Tax Code (MST) Validation
const validMst10 = SalesOrderSyncService.validateTaxCode('0108765432');
const validMst13 = SalesOrderSyncService.validateTaxCode('0108765432-001');
const invalidMst = SalesOrderSyncService.validateTaxCode('12345ABC');
assert(validMst10.isValid && validMst10.format === 'ENTERPRISE_10_DIGIT', 'Validates 10-digit enterprise MST');
assert(validMst13.isValid && validMst13.format === 'BRANCH_13_DIGIT', 'Validates 13-digit branch MST');
assert(!invalidMst.isValid, 'Rejects invalid MST syntax');

// 6. M07 Customer Master Consistency & Credit Check
const mockCustomers: M07CustomerMasterProfile[] = [
  {
    customerId: 101,
    customerCode: 'CUST-001',
    customerName: 'Công ty Cổ phần VinaTech',
    companyName: 'Công ty Cổ phần VinaTech',
    taxCode: '0108765432',
    tier: 'VIP_DIAMOND',
    creditLimit: 1000000000,
    availableCredit: 800000000,
    outstandingBalance: 200000000,
    isCreditBlocked: false
  }
];

const creditCheckPass = SalesOrderSyncService.checkCustomerCredit(mockCustomers[0], 500000000);
const creditCheckFail = SalesOrderSyncService.checkCustomerCredit(mockCustomers[0], 900000000);
assert(creditCheckPass.approved === true, 'Credit check approves order within available credit');
assert(creditCheckFail.approved === false && creditCheckFail.exceededAmount === 100000000, 'Credit check rejects order exceeding available credit');

// 7. Order Consistency Validator
const consistencyCheck = SalesOrderSyncService.validateOrderConsistency(
  {
    customerId: 101,
    customerName: 'Công ty Cổ phần VinaTech',
    taxCode: '0108765432',
    billingEmail: 'ketoan@vinatech.vn',
    totalAmountNumeric: 50000000,
    requiresVatInvoice: true,
    items: [{ sku: 'SKU-01', name: 'Item 1', qty: 1, unitPriceNumeric: 50000000 }]
  },
  mockCustomers
);
assert(consistencyCheck.isValid === true, 'Order passes full M07 master data consistency validation');

// 8. POS Omnichannel Order Conversion
const posOrderPayload: M16PosOrderPayload = {
  posOrderId: 'POS-2026-999',
  receiptNumber: 'REC-001',
  branchId: 1,
  cashierId: 5,
  cashierName: 'Thu Ngân 01',
  customerName: 'Khách mua tại quầy POS',
  subtotal: 1000000,
  taxAmount: 100000,
  totalAmount: 1100000,
  paymentMethod: 'CASH',
  paymentStatus: 'PAID',
  fulfillmentStatus: 'COMPLETED',
  requiresVatInvoice: true,
  vatBuyerLegalName: 'Công ty TNHH Thương Mại Hòa Bình',
  vatTaxId: '0308765432',
  vatAddress: 'Quận 1, TP. HCM',
  vatEmail: 'hoabinh@trade.vn',
  items: [
    { sku: 'SKU-POS-01', name: 'Sản phẩm bán lẻ', quantity: 2, unitPrice: 500000, lineTotal: 1000000 }
  ]
};

const convertedM13So = convertPosOrderToM13(posOrderPayload);
assert(convertedM13So.sourceModule === 'M16_POS', 'POS order converted with sourceModule = M16_POS');
assert(convertedM13So.vatDetails?.buyerLegalName === 'Công ty TNHH Thương Mại Hòa Bình', 'POS VAT legal buyer name transferred correctly');
assert(convertedM13So.items.length === 1 && convertedM13So.items[0].qty === 2, 'POS line items preserved with exact qty and price');

console.log('\n================================================================');
console.log(`  VERIFICATION RESULT: ${passCount} / ${totalTests} TESTS PASSED (${passCount === totalTests ? '100% PERFECT' : 'NEEDS FIX'})`);
console.log('================================================================\n');

if (passCount !== totalTests) {
  process.exit(1);
}
