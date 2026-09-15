export type PriceListType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR' | 'DEALER' | 'VIP' | 'EXPORT' | 'CONTRACT' | 'PROMO';
export type PriceApprovalStatus = 'DRAFT' | 'SUBMITTED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ACTIVE';
export type TargetGroupType = 'ALL' | 'CUSTOMER' | 'GROUP' | 'CHANNEL';

export interface PriceList {
  id: string;
  code: string;
  name: string;
  type: PriceListType;
  currency: string;
  targetType: TargetGroupType;
  targetValue?: string; // e.g., 'VIP', 'DEALER', 'CUST-001'
  priority: number; // Higher number = higher precedence in resolution
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  approvalStatus: PriceApprovalStatus;
  validFrom: string; // YYYY-MM-DD
  validTo: string; // YYYY-MM-DD
  description: string;
  defaultUom: string;
  itemsCount?: number;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ProductPriceItem {
  id: string;
  priceListId: string;
  priceListCode: string;
  priceListName: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  uom: string;
  uomConversionFactor?: number; // e.g. 1 BOX = 10 PCS (factor: 10)
  costBasis: number; // Received from Costing Engine
  ruleApplied: 'MARKUP' | 'MARGIN' | 'CATEGORY_RULE' | 'MANUAL';
  markupPercent?: number; // Selling = Cost * (1 + Markup%)
  targetMarginPercent?: number; // Selling = Cost / (1 - Margin%)
  calculatedPrice: number;
  finalPrice: number; // Authoritative Selling Price
  actualMarginPercent: number; // ((FinalPrice - Cost) / FinalPrice) * 100
  minMarginPercent: number; // Minimum threshold (e.g. 15%)
  isBelowMinMargin: boolean;
  isOverride: boolean;
  overrideReason?: string;
  overrideChangedBy?: string;
  overrideChangedAt?: string;
  overrideApprovedBy?: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  approvalStatus: PriceApprovalStatus;
  notes?: string;
}

export interface CategoryPricingRule {
  id: string;
  category: string;
  ruleType: 'MARKUP' | 'TARGET_MARGIN';
  ruleValue: number; // e.g., 50 for +50% markup, or 30 for 30% margin
  minMarginPercent: number;
  roundingMode: 'NEAREST_1000' | 'NEAREST_100' | 'EXACT';
  description: string;
  isActive: boolean;
  appliedProductCount: number;
  updatedAt: string;
  updatedBy: string;
}

export interface CustomerPricing {
  id: string;
  customerId?: string;
  customerName?: string;
  customerGroup?: 'Retail' | 'Wholesale' | 'Dealer' | 'VIP';
  productId: string;
  productName: string;
  sku: string;
  uom: string;
  contractCode?: string;
  customPrice: number;
  standardPrice: number;
  discountPercent: number;
  costBasis: number;
  actualMarginPercent: number;
  validFrom: string;
  validTo: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
  approvedBy: string;
}

export interface QuantityPricingTier {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  uom: string;
  minQty: number;
  maxQty: number | null; // null for 100+
  unitPrice: number;
  discountPercent: number;
  costBasis: number;
  actualMarginPercent: number;
  effectiveFrom: string;
  effectiveTo: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PromotionCampaign {
  id: string;
  code: string;
  name: string;
  description: string;
  productId: string;
  productName: string;
  sku: string;
  standardPrice: number;
  promoPrice: number;
  discountPercent: number;
  customerGroupId?: string; // Optional target group
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoRevert: boolean; // Auto reverts to standard price after endDate
  minPurchaseQty: number;
  budgetLimitVND?: number;
}

export interface BulkPricingItem {
  id: string;
  receiptId?: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  uom: string;
  receivedQty: number;
  costBasis: number; // From Costing Engine
  ruleApplied: string;
  markupPercent: number;
  targetMarginPercent: number;
  calculatedPrice: number;
  manualPrice?: number;
  finalPrice: number;
  actualMarginPercent: number;
  minMarginPercent: number;
  hasMarginWarning: boolean;
  isApproved: boolean;
}

export interface PriceApprovalRequest {
  id: string;
  requestNumber: string;
  productId: string;
  productName: string;
  sku: string;
  priceListId: string;
  priceListName: string;
  costBasis: number;
  oldPrice: number;
  newPrice: number;
  oldMarginPercent: number;
  newMarginPercent: number;
  minMarginPercent: number;
  isBelowMinMargin: boolean;
  reason: string;
  requester: string;
  requestedAt: string;
  status: PriceApprovalStatus;
  approver?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface PriceAuditLog {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  priceListCode: string;
  priceListName: string;
  uom: string;
  oldPrice: number;
  newPrice: number;
  ruleApplied: string;
  reason: string;
  isOverride: boolean;
  changedBy: string;
  changedAt: string;
  approvedBy: string;
  approvedAt: string;
  effectiveFrom: string;
  effectiveTo: string;
}

export interface PriceResolutionQuery {
  customerId?: string;
  customerGroup?: string;
  productId: string;
  quantity: number;
  uom: string;
  currency: string;
  transactionDate?: string;
  channel?: string;
}

export interface PriceResolutionResult {
  productId: string;
  productName: string;
  sku: string;
  uom: string;
  quantity: number;
  baseStandardPrice: number;
  resolutionStep: string; // e.g., '1. Customer Contract' | '2. Customer Group' | '3. Quantity Break' | '4. Promotion' | '5. Price List' | '6. Default Base Price'
  resolvedUnitPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalUnitPriceExclVat: number;
  vatRate: number; // e.g. 0.10 for 10%
  vatAmount: number;
  finalUnitPriceInclVat: number;
  lineTotalExclVat: number;
  lineTotalInclVat: number;
  costBasis: number;
  actualMarginPercent: number;
  marginStatus: 'PASS' | 'WARNING' | 'CRITICAL_BELOW_MIN';
  governanceNote: string;
}
