import {
  PricingResolutionRequest,
  PricingResolutionResponse,
  PriceList,
  PriceListItem,
  CustomerContractPrice,
  DiscountRule,
  PromotionCampaign,
  MarginPolicy
} from '../types/pricing.types';
import { DiscountService } from './DiscountService';
import { PromotionService } from './PromotionService';
import { MarginService } from './MarginService';

export class PriceResolutionService {
  /**
   * Resolves the final authoritative selling price for a given transaction query
   * following the strict corporate Pricing Hierarchy structure.
   */
  public static resolvePrice(
    request: PricingResolutionRequest,
    priceLists: PriceList[],
    priceListItems: PriceListItem[],
    contracts: CustomerContractPrice[],
    discountRules: DiscountRule[],
    promotions: PromotionCampaign[],
    marginPolicies: MarginPolicy[]
  ): PricingResolutionResponse {
    const {
      customerId,
      customerGroupId,
      productId,
      quantity,
      uomId,
      currency,
      channel,
      transactionDate
    } = request;

    const tDate = transactionDate ? new Date(transactionDate) : new Date();

    let resolvedUnitPrice = 0;
    let basePrice = 0;
    let pricingRuleApplied = 'Default Price List';
    let selectedListId = '';

    // 1. Evaluate fallback general retail base price (usually PL-001) for reference
    const defaultRetailItem = priceListItems.find(
      item => item.priceListId === 'PL-001' && item.productId === productId && item.uomId === uomId
    );
    basePrice = defaultRetailItem ? defaultRetailItem.unitPrice : 100000; // default safety fallback

    // 2. CHECK HIGHEST PRIORITY 1: Customer Contract Price
    if (customerId) {
      const activeContract = contracts.find(c => {
        const from = new Date(c.validFrom);
        const to = new Date(c.validTo);
        return (
          c.customerId === customerId &&
          c.productId === productId &&
          c.uomId === uomId &&
          tDate >= from &&
          tDate <= to &&
          c.currency === currency
        );
      });

      if (activeContract) {
        resolvedUnitPrice = activeContract.contractPrice;
        pricingRuleApplied = `Contract Price [${activeContract.contractCode}]`;
      }
    }

    // 3. CHECK PRIORITY 2: Active Customized Price Lists (VIP, Wholesale, Channel-specific)
    if (resolvedUnitPrice === 0) {
      // Find eligible active price lists sorted by Priority descending
      const eligibleLists = priceLists
        .filter(pl => {
          if (pl.status !== 'ACTIVE') return false;
          const from = new Date(pl.validFrom);
          const to = new Date(pl.validTo);
          if (tDate < from || tDate > to) return false;
          if (pl.currency !== currency) return false;

          // Customer Group Match
          if (pl.customerGroupId && pl.customerGroupId !== customerGroupId) return false;
          // Channel Match
          if (pl.channel && pl.channel !== channel) return false;

          return true;
        })
        .sort((a, b) => b.priority - a.priority);

      // Find the first price list item matching the product and quantity brackets
      for (const list of eligibleLists) {
        const item = priceListItems.find(
          pi =>
            pi.priceListId === list.id &&
            pi.productId === productId &&
            pi.uomId === uomId &&
            quantity >= pi.minQty &&
            quantity <= pi.maxQty
        );

        if (item) {
          resolvedUnitPrice = item.unitPrice;
          pricingRuleApplied = `Price List [${list.name} (${list.code})]`;
          selectedListId = list.id;
          break;
        }
      }
    }

    // 4. FALLBACK: Default retail product price
    if (resolvedUnitPrice === 0) {
      resolvedUnitPrice = basePrice;
      pricingRuleApplied = 'Default Retail Price List (PL-001)';
      selectedListId = 'PL-001';
    }

    // 5. EVALUATE DISCOUNTS (Percentage, Fixed, Quantity Breaks)
    const { totalDiscountPerUnit, appliedRuleIds } = DiscountService.calculateDiscount(
      resolvedUnitPrice,
      quantity,
      productId,
      undefined, // Category resolution optional here
      discountRules
    );

    // 6. EVALUATE PROMOTIONS (Temporal marketing campaigns)
    const { promoDiscountPerUnit, activeCampaignId } = PromotionService.resolvePromotionDiscount(
      resolvedUnitPrice,
      quantity,
      undefined,
      customerGroupId,
      promotions
    );

    // Combine discounts (Discounts + Campaign Promotions) with strict pricing rules
    let finalDiscountPerUnit = totalDiscountPerUnit + promoDiscountPerUnit;
    if (finalDiscountPerUnit > resolvedUnitPrice) {
      finalDiscountPerUnit = resolvedUnitPrice; // Cannot discount below 0
    }

    const finalCalculatedUnitPrice = resolvedUnitPrice - finalDiscountPerUnit;
    const finalLineTotal = finalCalculatedUnitPrice * quantity;

    // 7. MARGIN SAFETY GUARD CHECKS
    const { marginStatus, actualMarginPercent } = MarginService.checkMargin(
      productId,
      finalCalculatedUnitPrice,
      marginPolicies
    );

    // If a promotion or massive discount caused a severe margin safety breach, update the audit trace info
    let ruleTrace = pricingRuleApplied;
    if (activeCampaignId) {
      ruleTrace += ` + Promo Campaign [ID: ${activeCampaignId}]`;
    }
    if (appliedRuleIds.length > 0) {
      ruleTrace += ` + Discount Rules [${appliedRuleIds.join(', ')}]`;
    }

    return {
      productId,
      uomId,
      basePrice,
      clonedFromListId: selectedListId || undefined,
      resolvedUnitPrice: resolvedUnitPrice.toLocaleString('vi-VN') + ' ₫',
      appliedDiscount: finalDiscountPerUnit.toLocaleString('vi-VN') + ' ₫',
      finalCalculatedUnitPrice: finalCalculatedUnitPrice.toLocaleString('vi-VN') + ' ₫',
      finalLineTotal: finalLineTotal.toLocaleString('vi-VN') + ' ₫',
      currency,
      pricingRuleApplied: ruleTrace,
      marginStatus,
      actualMarginPercent: actualMarginPercent + '%'
    };
  }
}
