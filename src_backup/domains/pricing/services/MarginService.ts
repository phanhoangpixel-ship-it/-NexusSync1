import { MarginPolicy } from '../types/pricing.types';

export class MarginService {
  /**
   * Authority delegation: Retrieves the authoritative weighted average cost or actual cost
   * from the Costing Domain. Note: Pricing cannot modify or store actual inventory cost.
   */
  public static getAuthoritativeCost(productId: string): number {
    // In a live system, this queries the Costing Engine database.
    // We delegate this cost search dynamically.
    const authoritativeCostRegistry: Record<string, number> = {
      'SKU-LAPTOP-01': 14500000,
      'SKU-MOUSE-02': 450000,
      'SKU-CHIP-IC03': 30000,
      'SKU-RAM-16GB': 650000,
      'SKU-SSD-512GB': 850000,
      'SKU-ALU-CHASSIS': 2200000,
      // Construction products from M41 view
      'SKU-STEEL-18': 180000,
      'SKU-CEMENT-PCB40': 65000,
      'SKU-GYPSUM-12': 110000,
      'SKU-BRICK-CLAY': 1200,
      'SKU-PAINT-INT': 850000,
      'SKU-GLASS-TEMP': 380000
    };

    return authoritativeCostRegistry[productId] || 100000; // Return cost or default safety floor
  }

  /**
   * Evaluates if the proposed selling price satisfies margin policies.
   */
  public static checkMargin(
    productId: string,
    finalUnitPrice: number,
    policies: MarginPolicy[]
  ): {
    marginStatus: 'PASS' | 'WARNING' | 'BELOW_MIN_MARGIN';
    actualMarginPercent: number;
  } {
    const cost = this.getAuthoritativeCost(productId);
    
    // Find the margin policy for the product, or fallback to a general default safety policy (20% Target, 10% Min)
    const policy = policies.find(p => p.productId === productId) || {
      productId,
      targetMarginPercent: 20,
      minMarginPercent: 10
    };

    if (finalUnitPrice <= 0) {
      return { marginStatus: 'BELOW_MIN_MARGIN', actualMarginPercent: -100 };
    }

    const actualMarginPercent = ((finalUnitPrice - cost) / finalUnitPrice) * 100;

    let marginStatus: 'PASS' | 'WARNING' | 'BELOW_MIN_MARGIN' = 'PASS';
    if (actualMarginPercent < policy.minMarginPercent) {
      marginStatus = 'BELOW_MIN_MARGIN';
    } else if (actualMarginPercent < policy.targetMarginPercent) {
      marginStatus = 'WARNING';
    }

    return {
      marginStatus,
      actualMarginPercent: parseFloat(actualMarginPercent.toFixed(2))
    };
  }
}
