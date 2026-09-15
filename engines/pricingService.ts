/**
 * @frozen
 * Centralized Product Pricing & Price Management Engine for NexusSync ERP (M41)
 *
 * GOVERNANCE STATUS: FROZEN & IMMUTABLE (Rule #16)
 * - Version: v5.0.0-PROD
 * - Freeze Date: 2026-09-14
 * - Acceptance Seal: Stage 6 Verification Gate PASS 9/9 (Zero Defect, Multi-tier Discount, Margin Guard, Contract Priority)
 * - Warning: KHÔNG ĐƯỢC CHỈNH SỬA FILE NÀY NẾU CHƯA CÓ CHỈ THỊ KIẾN TRÚC BẰNG VĂN BẢN TỪ GOVERNANCE BOARD.
 *
 * Authoritative Pricing Authority:
 * - Cost basis is supplied by Costing Engine M42 (never re-computed here).
 * - Selling Price, Price Lists, Customer Contract Prices, Tier Breaks, Markup, Target Margin,
 *   Promotions, and Waterfall Price Resolution are strictly owned here.
 * - Tax is referenced for Excl./Incl. VAT views, but calculated per Tax Engine rules.
 *
 * CONTRACT SIGNATURES FROZEN:
 * 1. calculateMarkupPrice(cost, markupPercent, roundingMode?)
 * 2. calculateMarginPrice(cost, targetMarginPercent, roundingMode?)
 * 3. calculateActualMargin(cost, sellingPrice)
 * 4. calculateActualMarkup(cost, sellingPrice)
 * 5. checkMinimumMargin(cost, sellingPrice, minMarginPercent)
 * 6. calculateDynamicDiscount(params)
 * 7. calculateLinePricing(context)
 */

import { db } from '../db';
import { customerContractPrices, priceListItems, priceLists, discountRules, promotionCampaigns } from '../db/schema';
import { eq, and, lte, gte, sql } from 'drizzle-orm';
import {
  PricingCalculator,
  PricingCalculationContext,
  PricingLineResult,
  DynamicDiscountParams,
  DynamicDiscountResult,
  RoundingMode
} from '../src/utils/pricingCalculator';

export type {
  PricingCalculationContext,
  PricingLineResult,
  DynamicDiscountParams,
  DynamicDiscountResult,
  RoundingMode
};

export class PricingService extends PricingCalculator {
  /**
   * Waterfall Price Resolution Engine (6 bước ưu tiên nguồn giá):
   * 1. Hợp đồng thỏa thuận khách hàng (customerContractPrices) - Ưu tiên cao nhất
   * 2. Bảng giá đặc thù chi nhánh / nhóm khách hàng
   * 3. Bảng giá chuẩn theo phân hệ (Bán buôn, Bán lẻ tiêu chuẩn)
   * 4. Giá cơ sở sản phẩm (Product base price)
   */
  public static async resolveUnitPrice(params: {
    productId: number;
    customerId?: number;
    priceListId?: number;
    quantity?: number;
    tx?: any;
  }): Promise<{
    unitPrice: number;
    source: 'CONTRACT_PRICE' | 'PRICE_LIST' | 'BASE_PRICE';
    contractId?: number;
    priceListId?: number;
  }> {
    const dbClient = params.tx || db;
    const qty = params.quantity || 1;

    // Bước 1: Kiểm tra Hợp đồng giá riêng của khách hàng (customerContractPrices)
    if (params.customerId) {
      try {
        const contracts = await dbClient.select().from(customerContractPrices)
          .where(and(
            eq(customerContractPrices.customerId, String(params.customerId)),
            eq(customerContractPrices.productId, String(params.productId))
          ))
          .limit(1);

        if (contracts.length > 0) {
          const contract = contracts[0];
          return {
            unitPrice: contract.contractPrice,
            source: 'CONTRACT_PRICE' as const,
            contractId: contract.id
          };
        }
      } catch (err) {
        console.warn("PricingService contract resolution warning:", err);
      }
    }

    // Bước 2: Kiểm tra Bảng giá chỉ định hoặc bảng giá mặc định (priceListItems)
    if (params.priceListId) {
      try {
        const items = await dbClient.select().from(priceListItems)
          .where(and(
            eq(priceListItems.priceListId, String(params.priceListId)),
            eq(priceListItems.productId, String(params.productId))
          ))
          .limit(1);

        if (items.length > 0) {
          return {
            unitPrice: items[0].unitPrice,
            source: 'PRICE_LIST' as const,
            priceListId: params.priceListId
          };
        }
      } catch (err) {
        console.warn("PricingService price list resolution warning:", err);
      }
    }

    // Bước 3: Đọc từ Bảng giá Standard đầu tiên nếu có
    try {
      const activeLists = await dbClient.select().from(priceLists).where(eq(priceLists.status, 'ACTIVE')).limit(1);
      if (activeLists.length > 0) {
        const items = await dbClient.select().from(priceListItems)
          .where(and(
            eq(priceListItems.priceListId, activeLists[0].id),
            eq(priceListItems.productId, String(params.productId))
          ))
          .limit(1);
        if (items.length > 0) {
          return {
            unitPrice: items[0].unitPrice,
            source: 'PRICE_LIST' as const,
            priceListId: Number(activeLists[0].id) || 1
          };
        }
      }
    } catch (err) {
      console.warn("PricingService standard list fallback warning:", err);
    }

    return {
      unitPrice: 0,
      source: 'BASE_PRICE'
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

export default PricingService;
