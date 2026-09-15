import { DiscountRule } from '../types/pricing.types';

export class DiscountService {
  /**
   * Calculates the unit discount based on active discount rules.
   * Ensures that combined discounts do not reduce the selling price below zero.
   */
  public static calculateDiscount(
    basePrice: number,
    quantity: number,
    productId: string,
    categoryId: string | undefined,
    rules: DiscountRule[]
  ): { totalDiscountPerUnit: number; appliedRuleIds: string[] } {
    let totalDiscount = 0;
    const appliedRuleIds: string[] = [];

    // Filter relevant and active rules
    const activeRules = rules.filter(rule => {
      if (!rule.isActive) return false;
      const now = new Date();
      const from = new Date(rule.validFrom);
      const to = new Date(rule.validTo);
      if (now < from || now > to) return false;

      // Product or Category specificity
      if (rule.productId && rule.productId !== productId) return false;
      if (rule.categoryId && rule.categoryId !== categoryId) return false;

      return true;
    });

    // Evaluate Quantity Breaks first as they have high priority
    const qtyBreakRules = activeRules.filter(r => r.type === 'QTY_BREAK');
    let hasQtyBreakApplied = false;

    for (const rule of qtyBreakRules) {
      const min = rule.minQty ?? 0;
      const max = rule.maxQty ?? Infinity;
      if (quantity >= min && quantity <= max) {
        // Apply the quantity break discount (can be percentage or fixed-value based)
        // Assume rule.value is a percentage for QTY_BREAK
        const discAmount = (basePrice * rule.value) / 100;
        totalDiscount += discAmount;
        appliedRuleIds.push(rule.id);
        hasQtyBreakApplied = true;
        break; // Apply only the most relevant tier break rule
      }
    }

    // Evaluate standard percentage & fixed rules if QTY Break didn't override them entirely
    const standardRules = activeRules.filter(r => r.type !== 'QTY_BREAK');
    for (const rule of standardRules) {
      if (rule.type === 'PERCENTAGE') {
        const discAmount = (basePrice * rule.value) / 100;
        totalDiscount += discAmount;
        appliedRuleIds.push(rule.id);
      } else if (rule.type === 'FIXED') {
        totalDiscount += rule.value;
        appliedRuleIds.push(rule.id);
      }
    }

    // Security Guard: Prevent negative price resolving (Max discount is bounded by base price)
    if (totalDiscount > basePrice) {
      totalDiscount = basePrice;
    }

    return {
      totalDiscountPerUnit: Math.round(totalDiscount),
      appliedRuleIds
    };
  }
}
