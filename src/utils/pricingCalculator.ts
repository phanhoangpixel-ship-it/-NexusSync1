/**
 * Client-safe pure pricing calculations and discount matrix for NexusSync ERP
 * Pure mathematical algorithms without backend DB or ORM dependencies.
 */

export interface PricingCalculationContext {
  sku: string;
  category: string;
  unitPrice: number;
  quantity: number;
  discountPercent?: number; // Commercial discount
  discountAmount?: number; // Fixed amount discount
  jurisdiction?: string;
  vatCode?: string;
}

export interface PricingLineResult {
  subtotalOriginal: number; // unitPrice * quantity
  discountAmount: number;
  taxableAmount: number; // subtotalOriginal - discountAmount
  taxCode: string;
  taxRate: number; // e.g. 0.10 for 10%
  taxAmount: number;
  taxCategory: 'OUTPUT' | 'INPUT' | 'EXEMPT';
  totalAmount: number; // taxableAmount + taxAmount
}

export interface DynamicDiscountParams {
  unitPrice: number;
  quantity: number;
  costBasis: number; // BẮT BUỘC: Không dùng giá trị mặc định hay hệ số giả định
  customerTier?: 'STANDARD' | 'SILVER' | 'GOLD' | 'VIP' | 'ENTERPRISE' | string;
  paymentTerm?: 'PREPAID' | 'CASH' | 'NET15' | 'NET30' | 'NET60' | string;
  promoCode?: string;
  minMarginPercent?: number;
}

export interface DynamicDiscountResult {
  volumeDiscountPercent: number;
  customerTierDiscountPercent: number;
  paymentDiscountPercent: number;
  promoDiscountPercent: number;
  totalDiscountPercent: number;
  originalTotal: number;
  discountAmount: number;
  discountedTotal: number;
  effectiveUnitPrice: number;
  isMarginBreached: boolean;
  actualMarginPercent: number;
  requiresApproval: boolean;
  breakdownDetails: string[];
}

export type RoundingMode = 'NEAREST_1000' | 'CEIL_1000' | 'ROUND_500' | 'NEAREST_100' | 'EXACT';

export class PricingCalculator {
  /**
   * 1. Calculates Selling Price using Cost and Markup %
   * Formula: Selling Price = Cost * (1 + Markup%)
   */
  public static calculateMarkupPrice(
    cost: number,
    markupPercent: number,
    rounding: RoundingMode = 'NEAREST_1000'
  ): number {
    if (cost <= 0) return 0;
    const raw = cost * (1 + markupPercent / 100);
    return this.applyRounding(raw, rounding);
  }

  /**
   * 2. Calculates Selling Price using Cost and Target Margin %
   * Formula: Selling Price = Cost / (1 - TargetMargin%)
   */
  public static calculateMarginPrice(
    cost: number,
    targetMarginPercent: number,
    rounding: RoundingMode = 'NEAREST_1000'
  ): number {
    if (cost <= 0) return 0;
    if (targetMarginPercent >= 100) return cost * 2;
    const raw = cost / (1 - targetMarginPercent / 100);
    return this.applyRounding(raw, rounding);
  }

  /**
   * 3. Calculates actual profit margin percentage from Cost and Selling Price
   * Formula: Margin % = ((Selling Price - Cost) / Selling Price) * 100
   */
  public static calculateActualMargin(cost: number, sellingPrice: number): number {
    if (cost === undefined || cost === null || typeof cost !== 'number' || isNaN(cost) || cost <= 0) {
      throw new Error('ERR_COST_BASIS_REQUIRED: costBasis là tham số bắt buộc và phải là số dương hợp lệ (> 0) để tính toán biên lợi nhuận.');
    }
    if (sellingPrice <= 0) return 0;
    const margin = ((sellingPrice - cost) / sellingPrice) * 100;
    return Math.round(margin * 100) / 100;
  }

  /**
   * 4. Calculates actual markup percentage from Cost and Selling Price
   * Formula: Markup % = ((Selling Price - Cost) / Cost) * 100
   */
  public static calculateActualMarkup(cost: number, sellingPrice: number): number {
    if (cost === undefined || cost === null || typeof cost !== 'number' || isNaN(cost) || cost <= 0) {
      throw new Error('ERR_COST_BASIS_REQUIRED: costBasis là tham số bắt buộc và phải là số dương hợp lệ (> 0) để tính toán markup.');
    }
    const markup = ((sellingPrice - cost) / cost) * 100;
    return Math.round(markup * 100) / 100;
  }

  /**
   * 5. Evaluates minimum margin guard
   */
  public static checkMinimumMargin(
    cost: number,
    sellingPrice: number,
    minMarginPercent: number = 15
  ): {
    isBelowMin: boolean;
    actualMargin: number;
    difference: number;
    warningMessage?: string;
  } {
    if (cost === undefined || cost === null || typeof cost !== 'number' || isNaN(cost) || cost <= 0) {
      throw new Error('ERR_COST_BASIS_REQUIRED: costBasis là tham số bắt buộc và phải là số dương hợp lệ (> 0) để kiểm tra sàn biên lợi nhuận tối thiểu.');
    }
    const actualMargin = this.calculateActualMargin(cost, sellingPrice);
    const isBelow = actualMargin < minMarginPercent;
    const diff = Math.round((minMarginPercent - actualMargin) * 100) / 100;

    return {
      isBelowMin: isBelow,
      actualMargin,
      difference: diff,
      warningMessage: isBelow
        ? `Cảnh báo: Biên lợi nhuận hiện tại (${actualMargin.toFixed(1)}%) thấp hơn ngưỡng tối thiểu yêu cầu (${minMarginPercent}%). Cần phê duyệt từ Giám đốc / CFO.`
        : undefined
    };
  }

  /**
   * 6. Evaluates and resolves Dynamic Multi-tier Discount Matrix
   */
  public static calculateDynamicDiscount(params: DynamicDiscountParams): DynamicDiscountResult {
    const {
      unitPrice,
      quantity,
      costBasis,
      customerTier = 'STANDARD',
      paymentTerm = 'NET30',
      promoCode,
      minMarginPercent = 15
    } = params;

    if (costBasis === undefined || costBasis === null || typeof costBasis !== 'number' || isNaN(costBasis) || costBasis <= 0) {
      throw new Error('ERR_COST_BASIS_REQUIRED: costBasis là tham số bắt buộc và phải là số dương hợp lệ (> 0) để tính toán chiết khấu và kiểm tra sàn biên lợi nhuận.');
    }

    const originalTotal = unitPrice * quantity;
    const breakdownDetails: string[] = [];

    // 1. Volume tier discount
    let volumeDiscountPercent = 0;
    if (quantity >= 100) {
      volumeDiscountPercent = 15;
      breakdownDetails.push(`Bậc số lượng (≥100 sp): -15%`);
    } else if (quantity >= 50) {
      volumeDiscountPercent = 10;
      breakdownDetails.push(`Bậc số lượng (≥50 sp): -10%`);
    } else if (quantity >= 10) {
      volumeDiscountPercent = 5;
      breakdownDetails.push(`Bậc số lượng (≥10 sp): -5%`);
    }

    // 2. Customer tier discount (M07 Customers Master)
    let customerTierDiscountPercent = 0;
    const tierUpper = String(customerTier).toUpperCase();
    if (tierUpper === 'ENTERPRISE' || tierUpper === 'VIP') {
      customerTierDiscountPercent = 10;
      breakdownDetails.push(`Hạng khách hàng ${tierUpper} (M07): -10%`);
    } else if (tierUpper === 'GOLD') {
      customerTierDiscountPercent = 6;
      breakdownDetails.push(`Hạng khách hàng GOLD (M07): -6%`);
    } else if (tierUpper === 'SILVER') {
      customerTierDiscountPercent = 3;
      breakdownDetails.push(`Hạng khách hàng SILVER (M07): -3%`);
    }

    // 3. Payment term / Cash discount
    let paymentDiscountPercent = 0;
    const payUpper = String(paymentTerm).toUpperCase();
    if (payUpper === 'PREPAID' || payUpper === 'CASH') {
      paymentDiscountPercent = 2;
      breakdownDetails.push(`Thanh toán trước / Tiền mặt (Prepaid): -2%`);
    } else if (payUpper === 'NET15') {
      paymentDiscountPercent = 1;
      breakdownDetails.push(`Kỳ hạn thanh toán ngắn (NET15): -1%`);
    }

    // 4. Promo campaign discount
    let promoDiscountPercent = 0;
    if (promoCode) {
      const codeClean = promoCode.trim().toUpperCase();
      if (codeClean === 'NEXUS2026' || codeClean === 'O2C_VIP') {
        promoDiscountPercent = 5;
        breakdownDetails.push(`Mã chiến dịch khuyến mãi ${codeClean}: -5%`);
      } else if (codeClean === 'SUMMER50') {
        promoDiscountPercent = 8;
        breakdownDetails.push(`Mã khuyến mãi SUMMER50: -8%`);
      }
    }

    // Aggregate discount (max capped at 35% standard ceiling)
    const rawTotalDiscount = volumeDiscountPercent + customerTierDiscountPercent + paymentDiscountPercent + promoDiscountPercent;
    const totalDiscountPercent = Math.min(35, rawTotalDiscount);

    const discountAmount = Math.round(originalTotal * (totalDiscountPercent / 100));
    const discountedTotal = originalTotal - discountAmount;
    const effectiveUnitPrice = quantity > 0 ? discountedTotal / quantity : 0;

    // Check Margin Floor Guard
    const actualMarginPercent = this.calculateActualMargin(costBasis, effectiveUnitPrice);
    const isMarginBreached = actualMarginPercent < minMarginPercent;
    const requiresApproval = isMarginBreached || totalDiscountPercent > 20;

    if (isMarginBreached) {
      breakdownDetails.push(`⚠️ Cảnh báo: Biên lợi nhuận (${actualMarginPercent.toFixed(1)}%) < sàn tối thiểu (${minMarginPercent}%). Cần phê duyệt Giám đốc.`);
    }

    return {
      volumeDiscountPercent,
      customerTierDiscountPercent,
      paymentDiscountPercent,
      promoDiscountPercent,
      totalDiscountPercent,
      originalTotal,
      discountAmount,
      discountedTotal,
      effectiveUnitPrice,
      isMarginBreached,
      actualMarginPercent,
      requiresApproval,
      breakdownDetails
    };
  }

  /**
   * Apply rounding to price figures
   */
  public static applyRounding(value: number, mode: RoundingMode): number {
    switch (mode) {
      case 'NEAREST_1000':
        return Math.round(value / 1000) * 1000;
      case 'CEIL_1000':
        return Math.ceil(value / 1000) * 1000;
      case 'ROUND_500':
        return Math.round(value / 500) * 500;
      case 'NEAREST_100':
        return Math.round(value / 100) * 100;
      case 'EXACT':
      default:
        return Math.round(value);
    }
  }

  /**
   * Resolves VAT code and rate based on product metadata or direct code.
   */
  public static resolveTaxRate(sku: string, category: string, vatCode?: string): { taxCode: string; taxRate: number } {
    if (vatCode) {
      if (vatCode === 'V0' || vatCode === 'VAT00' || vatCode === 'VE') return { taxCode: vatCode, taxRate: 0.0 };
      if (vatCode === 'V5' || vatCode === 'VAT05') return { taxCode: vatCode, taxRate: 0.05 };
      if (vatCode === 'V8' || vatCode === 'VAT08') return { taxCode: vatCode, taxRate: 0.08 };
      if (vatCode === 'V10' || vatCode === 'VAT10') return { taxCode: vatCode, taxRate: 0.10 };
    }

    if (sku === 'SKU-RAW-101' || category === 'Nguyên vật liệu' || category === 'Sắt thép') {
      return { taxCode: 'VAT10', taxRate: 0.10 };
    }
    if (sku.includes('EXEMPT') || category === 'Miễn thuế') {
      return { taxCode: 'VAT00', taxRate: 0.0 };
    }
    return { taxCode: 'VAT10', taxRate: 0.10 };
  }

  /**
   * 7. Calculates pricing, commercial discount, and tax for a single line item.
   */
  public static calculateLinePricing(context: PricingCalculationContext): PricingLineResult {
    const subtotalOriginal = context.unitPrice * context.quantity;
    let discountAmount = 0;

    if (context.discountAmount !== undefined) {
      discountAmount = context.discountAmount;
    } else if (context.discountPercent) {
      discountAmount = Math.round(subtotalOriginal * (context.discountPercent / 100));
    }

    const taxableAmount = Math.max(0, subtotalOriginal - discountAmount);
    const { taxCode, taxRate } = this.resolveTaxRate(context.sku, context.category, context.vatCode);

    const taxAmount = Math.round(taxableAmount * taxRate);

    return {
      subtotalOriginal,
      discountAmount,
      taxableAmount,
      taxCode,
      taxRate,
      taxAmount,
      taxCategory: taxRate > 0 ? 'OUTPUT' : 'EXEMPT',
      totalAmount: taxableAmount + taxAmount,
    };
  }

  /**
   * Calculates early payment discount (e.g. 2/10 Net 30)
   */
  public static calculateEarlyPaymentDiscount(
    originalAmount: number,
    issueDateMs: number,
    currentDateMs: number = Date.now()
  ): {
    isEligible: boolean;
    daysElapsed: number;
    discountRate: number;
    discountAmount: number;
    term: string;
  } {
    const daysElapsed = Math.floor((currentDateMs - issueDateMs) / (1000 * 3600 * 24));
    const isEligible = daysElapsed <= 10;
    const discountRate = isEligible ? 0.02 : 0; // 2% discount
    const discountAmount = Math.round(originalAmount * discountRate);

    return {
      isEligible,
      daysElapsed,
      discountRate,
      discountAmount,
      term: "2/10 Net 30"
    };
  }
}

// Export alias so both PricingCalculator and PricingService can be imported cleanly
export const PricingService = PricingCalculator;
export default PricingCalculator;
