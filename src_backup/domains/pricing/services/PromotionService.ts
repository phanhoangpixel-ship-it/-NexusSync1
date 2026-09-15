import { PromotionCampaign } from '../types/pricing.types';

export class PromotionService {
  /**
   * Resolves promotional campaign discounts for a transaction if eligible.
   */
  public static resolvePromotionDiscount(
    basePrice: number,
    quantity: number,
    categoryId: string | undefined,
    customerGroupId: string | undefined,
    campaigns: PromotionCampaign[]
  ): { promoDiscountPerUnit: number; activeCampaignId: string | null } {
    const now = new Date();

    // Find first active, eligible promotion campaign
    const eligibleCampaign = campaigns.find(campaign => {
      if (!campaign.isActive) return false;

      // Validate date bounds
      const from = new Date(campaign.validFrom);
      const to = new Date(campaign.validTo);
      if (now < from || now > to) return false;

      // Validate quantity thresholds
      if (quantity < campaign.minQty) return false;

      // Validate customer group eligibility
      if (campaign.customerGroupId && campaign.customerGroupId !== customerGroupId) return false;

      // Validate category scope
      if (campaign.categoryScope && campaign.categoryScope !== categoryId) return false;

      return true;
    });

    if (eligibleCampaign) {
      const discountAmount = (basePrice * eligibleCampaign.discountPercentage) / 100;
      return {
        promoDiscountPerUnit: Math.round(discountAmount),
        activeCampaignId: eligibleCampaign.id
      };
    }

    return {
      promoDiscountPerUnit: 0,
      activeCampaignId: null
    };
  }
}
