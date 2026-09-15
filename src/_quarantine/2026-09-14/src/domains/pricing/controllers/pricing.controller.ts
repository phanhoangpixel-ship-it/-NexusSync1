import {
  PricingResolutionRequest,
  PriceList,
  PriceListItem,
  CustomerContractPrice,
  DiscountRule,
  PromotionCampaign,
  MarginPolicy
} from '../types/pricing.types';
import { PriceResolutionService } from '../services/PriceResolutionService';
import { db } from '../../../db/index';
import * as schema from '../../../db/schema';
import { eq } from 'drizzle-orm';

// Initial pricing data definitions for database initialization
const initialPriceLists: PriceList[] = [
  {
    id: 'PL-001',
    code: 'RETAIL-STD',
    name: 'Bảng giá Bán lẻ Tiêu chuẩn',
    type: 'RETAIL',
    currency: 'VND',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    status: 'ACTIVE',
    priority: 1
  },
  {
    id: 'PL-002',
    code: 'VIP-AGENT',
    name: 'Bảng giá Đại lý Cấp VIP',
    type: 'WHOLESALE',
    currency: 'VND',
    customerGroupId: 'VIP',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    status: 'ACTIVE',
    priority: 10
  }
];

const initialPriceListItems: PriceListItem[] = [
  // Standard list items (PL-001)
  { priceListId: 'PL-001', productId: 'SKU-STEEL-18', uomId: 'PCS', minQty: 1, maxQty: 9, unitPrice: 285000, currency: 'VND', validFrom: '2026-01-01', validTo: '2026-12-31' },
  { priceListId: 'PL-001', productId: 'SKU-STEEL-18', uomId: 'PCS', minQty: 10, maxQty: 49, unitPrice: 275000, currency: 'VND', validFrom: '2026-01-01', validTo: '2026-12-31' },
  { priceListId: 'PL-001', productId: 'SKU-STEEL-18', uomId: 'PCS', minQty: 50, maxQty: 99999, unitPrice: 260000, currency: 'VND', validFrom: '2026-01-01', validTo: '2026-12-31' },
  
  { priceListId: 'PL-001', productId: 'SKU-CEMENT-PCB40', uomId: 'BAG', minQty: 1, maxQty: 9999, unitPrice: 88000, currency: 'VND', validFrom: '2026-01-01', validTo: '2026-12-31' },
  { priceListId: 'PL-001', productId: 'SKU-GYPSUM-12', uomId: 'PCS', minQty: 1, maxQty: 9999, unitPrice: 165000, currency: 'VND', validFrom: '2026-01-01', validTo: '2026-12-31' },

  // VIP list items (PL-002)
  { priceListId: 'PL-002', productId: 'SKU-STEEL-18', uomId: 'PCS', minQty: 1, maxQty: 99999, unitPrice: 245000, currency: 'VND', validFrom: '2026-01-01', validTo: '2026-12-31' },
  { priceListId: 'PL-002', productId: 'SKU-CEMENT-PCB40', uomId: 'BAG', minQty: 1, maxQty: 99999, unitPrice: 79000, currency: 'VND', validFrom: '2026-01-01', validTo: '2026-12-31' }
];

const initialCustomerContracts: CustomerContractPrice[] = [
  {
    id: 'CON-001',
    customerId: 'CUST-HOABINH',
    productId: 'SKU-STEEL-18',
    uomId: 'PCS',
    contractPrice: 220000,
    currency: 'VND',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    contractCode: 'HB-STEEL-2026'
  }
];

const initialDiscountRules: DiscountRule[] = [
  {
    id: 'DISC-PROJECT',
    code: 'PROJECT-OFFER',
    name: 'Chiết khấu Dự án đặc thù',
    type: 'PERCENTAGE',
    value: 5, // Extra 5% off
    productId: 'SKU-STEEL-18',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    isActive: true
  }
];

const initialPromotions: PromotionCampaign[] = [
  {
    id: 'PROM-SUMMER',
    code: 'SUMMER-STEEL',
    name: 'Chiến dịch Sắt Thép hè 2026',
    categoryScope: 'CONSTRUCTION_STEEL',
    discountPercentage: 2, // Extra 2% off
    minQty: 20,
    customerGroupId: 'VIP',
    validFrom: '2026-06-01',
    validTo: '2026-08-31',
    isActive: true
  }
];

const initialMarginPolicies: MarginPolicy[] = [
  { productId: 'SKU-STEEL-18', targetMarginPercent: 20, minMarginPercent: 12 },
  { productId: 'SKU-CEMENT-PCB40', targetMarginPercent: 15, minMarginPercent: 10 },
  { productId: 'SKU-GYPSUM-12', targetMarginPercent: 25, minMarginPercent: 15 }
];

async function ensurePricingDatabaseInitialized() {
  try {
    const existingLists = await db.select().from(schema.priceLists).all();
    if (existingLists.length === 0) {
      for (const pl of initialPriceLists) {
        await db.insert(schema.priceLists).values({
          id: pl.id,
          code: pl.code,
          name: pl.name,
          type: pl.type,
          currency: pl.currency,
          customerGroupId: pl.customerGroupId,
          validFrom: pl.validFrom,
          validTo: pl.validTo,
          status: pl.status,
          priority: pl.priority,
        } as any).run();
      }

      for (const pli of initialPriceListItems) {
        await db.insert(schema.priceListItems).values({
          priceListId: pli.priceListId,
          productId: pli.productId,
          uomId: pli.uomId,
          minQty: pli.minQty,
          maxQty: pli.maxQty,
          unitPrice: pli.unitPrice,
          currency: pli.currency,
          validFrom: pli.validFrom,
          validTo: pli.validTo,
        } as any).run();
      }

      for (const con of initialCustomerContracts) {
        await db.insert(schema.customerContractPrices).values({
          id: con.id,
          customerId: con.customerId,
          productId: con.productId,
          uomId: con.uomId,
          contractPrice: con.contractPrice,
          currency: con.currency,
          validFrom: con.validFrom,
          validTo: con.validTo,
          contractCode: con.contractCode,
        } as any).run();
      }

      for (const disc of initialDiscountRules) {
        await db.insert(schema.discountRules).values({
          id: disc.id,
          code: disc.code,
          name: disc.name,
          type: disc.type,
          value: disc.value,
          productId: disc.productId,
          validFrom: disc.validFrom,
          validTo: disc.validTo,
          isActive: disc.isActive,
        } as any).run();
      }

      for (const prom of initialPromotions) {
        await db.insert(schema.promotionCampaigns).values({
          id: prom.id,
          code: prom.code,
          name: prom.name,
          categoryScope: prom.categoryScope,
          discountPercentage: prom.discountPercentage,
          minQty: prom.minQty,
          customerGroupId: prom.customerGroupId,
          validFrom: prom.validFrom,
          validTo: prom.validTo,
          isActive: prom.isActive,
        } as any).run();
      }

      for (const mp of initialMarginPolicies) {
        await db.insert(schema.marginPolicies).values({
          productId: mp.productId,
          targetMarginPercent: mp.targetMarginPercent,
          minMarginPercent: mp.minMarginPercent,
        }).run();
      }
    }
  } catch (err) {
    console.error("Pricing database initialization check:", err);
  }
}

export class PricingController {
  /**
   * Resolves the authoritative selling price for an active client request
   */
  public static async handleResolvePrice(reqBody: PricingResolutionRequest) {
    try {
      await ensurePricingDatabaseInitialized();

      const dbPriceLists = await db.select().from(schema.priceLists).all();
      const dbPriceListItems = await db.select().from(schema.priceListItems).all();
      const dbCustomerContracts = await db.select().from(schema.customerContractPrices).all();
      const dbDiscountRules = await db.select().from(schema.discountRules).all();
      const dbPromotions = await db.select().from(schema.promotionCampaigns).all();
      const dbMarginPolicies = await db.select().from(schema.marginPolicies).all();

      const typedPriceLists: PriceList[] = dbPriceLists.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        type: p.type as any,
        currency: p.currency,
        customerGroupId: p.customerGroupId || undefined,
        validFrom: p.validFrom,
        validTo: p.validTo,
        status: p.status as any,
        priority: p.priority || 1,
      }));

      const typedPriceListItems: PriceListItem[] = dbPriceListItems.map(p => ({
        priceListId: p.priceListId,
        productId: p.productId,
        uomId: p.uomId,
        minQty: p.minQty,
        maxQty: p.maxQty,
        unitPrice: p.unitPrice,
        currency: p.currency,
        validFrom: p.validFrom,
        validTo: p.validTo,
      }));

      const typedContracts: CustomerContractPrice[] = dbCustomerContracts.map(c => ({
        id: c.id,
        customerId: c.customerId,
        productId: c.productId,
        uomId: c.uomId,
        contractPrice: c.contractPrice,
        currency: c.currency,
        validFrom: c.validFrom,
        validTo: c.validTo,
        contractCode: c.contractCode,
      }));

      const typedDiscounts: DiscountRule[] = dbDiscountRules.map(d => ({
        id: d.id,
        code: d.code,
        name: d.name,
        type: d.type as any,
        value: d.value,
        productId: d.productId || undefined,
        validFrom: d.validFrom,
        validTo: d.validTo,
        isActive: Boolean(d.isActive),
      }));

      const typedPromotions: PromotionCampaign[] = dbPromotions.map(pr => ({
        id: pr.id,
        code: pr.code,
        name: pr.name,
        categoryScope: pr.categoryScope || undefined,
        discountPercentage: pr.discountPercentage,
        minQty: pr.minQty || 1,
        customerGroupId: pr.customerGroupId || undefined,
        validFrom: pr.validFrom,
        validTo: pr.validTo,
        isActive: Boolean(pr.isActive),
      }));

      const typedMargins: MarginPolicy[] = dbMarginPolicies.map(m => ({
        productId: m.productId,
        targetMarginPercent: m.targetMarginPercent,
        minMarginPercent: m.minMarginPercent,
      }));

      const response = PriceResolutionService.resolvePrice(
        reqBody,
        typedPriceLists.length > 0 ? typedPriceLists : initialPriceLists,
        typedPriceListItems.length > 0 ? typedPriceListItems : initialPriceListItems,
        typedContracts.length > 0 ? typedContracts : initialCustomerContracts,
        typedDiscounts.length > 0 ? typedDiscounts : initialDiscountRules,
        typedPromotions.length > 0 ? typedPromotions : initialPromotions,
        typedMargins.length > 0 ? typedMargins : initialMarginPolicies
      );
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Lỗi xử lý xác định đơn giá.'
      };
    }
  }

  /**
   * Retrieves active commercial price lists (Query)
   */
  public static async getPriceLists() {
    try {
      await ensurePricingDatabaseInitialized();
      const records = await db.select().from(schema.priceLists).all();
      return {
        success: true,
        data: records.length > 0 ? records : initialPriceLists
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Lỗi tải danh mục bảng giá'
      };
    }
  }

  /**
   * Retrieves pricing rule conditions
   */
  public static async getDiscountRules() {
    try {
      await ensurePricingDatabaseInitialized();
      const records = await db.select().from(schema.discountRules).all();
      return {
        success: true,
        data: records.length > 0 ? records : initialDiscountRules
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Lỗi tải quy tắc chiết khấu'
      };
    }
  }
}
