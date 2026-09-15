export interface PriceList {
  id: string;
  code: string;
  name: string;
  type: 'RETAIL' | 'WHOLESALE' | 'CONTRACT' | 'PROMO';
  currency: string;
  customerGroupId?: string; // e.g., 'VIP', 'RETAIL_PARTNER'
  channel?: string; // e.g., 'ONLINE', 'B2B', 'RETAIL_STORE'
  validFrom: string; // ISO Date String
  validTo: string; // ISO Date String
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  priority: number; // Higher number = higher precedence
}

export interface PriceListItem {
  priceListId: string;
  productId: string;
  uomId: string; // Product unit of measure (e.g., 'PCS', 'BOX')
  minQty: number;
  maxQty: number;
  unitPrice: number;
  currency: string;
  validFrom: string;
  validTo: string;
}

export interface CustomerContractPrice {
  id: string;
  customerId: string;
  productId: string;
  uomId: string;
  contractPrice: number;
  currency: string;
  validFrom: string;
  validTo: string;
  contractCode: string;
}

export interface DiscountRule {
  id: string;
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED' | 'QTY_BREAK';
  value: number; // Percentage (e.g. 10 for 10%) or Fixed amount (e.g. 50000 VND)
  productId?: string; // Optional - apply only to specific product
  categoryId?: string; // Optional - apply to category
  minQty?: number; // For QTY_BREAK
  maxQty?: number; // For QTY_BREAK
  minOrderValue?: number; // Minimum transaction value for global discounts
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export interface PromotionCampaign {
  id: string;
  code: string;
  name: string;
  categoryScope?: string; // e.g. 'BEVERAGE', 'CONSTRUCTION_STEEL'
  discountPercentage: number;
  minQty: number;
  customerGroupId?: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export interface MarginPolicy {
  productId: string;
  targetMarginPercent: number; // e.g. 20 (20%)
  minMarginPercent: number; // e.g. 10 (10%)
}

export interface PricingResolutionRequest {
  customerId?: string;
  customerGroupId?: string;
  productId: string;
  quantity: number;
  uomId: string;
  currency: string;
  channel?: string;
  transactionDate?: string; // Defaults to current date
  orderTotalValue?: number; // Helps resolve order-level global discounts
}

export interface PricingResolutionResponse {
  productId: string;
  uomId: string;
  basePrice: number; // Default retail/fallback price list
  clonedFromListId?: string;
  resolvedUnitPrice: string; // The selected list price (after hierarchy check)
  appliedDiscount: string; // Total absolute discount applied per unit
  finalCalculatedUnitPrice: string; // The final unit price
  finalLineTotal: string; // finalCalculatedUnitPrice * quantity
  currency: string;
  pricingRuleApplied?: string; // Source of final price (e.g., CONTRACT, QTY_BREAK)
  marginStatus: 'PASS' | 'WARNING' | 'BELOW_MIN_MARGIN';
  actualMarginPercent: string;
}
