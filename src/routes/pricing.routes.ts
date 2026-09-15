import express from "express";
import { PricingService } from "../../engines/pricingService";
import {
  PriceList,
  ProductPriceItem,
  CategoryPricingRule,
  CustomerPricing,
  QuantityPricingTier,
  PromotionCampaign,
  PriceApprovalRequest,
  PriceAuditLog,
  PriceResolutionQuery,
  PriceResolutionResult
} from "../types/pricingManagement";

const router = express.Router();

// Enterprise pricing master database state
let priceLists: PriceList[] = [
  {
    id: 'PL-001',
    code: 'RETAIL-STD',
    name: 'Bảng giá Bán lẻ Tiêu chuẩn',
    type: 'RETAIL',
    currency: 'VND',
    targetType: 'ALL',
    priority: 1,
    status: 'ACTIVE',
    approvalStatus: 'ACTIVE',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    description: 'Áp dụng cho mọi khách hàng cá nhân & vãng lai mua tại quầy/online',
    defaultUom: 'PCS',
    itemsCount: 142,
    approvedBy: 'Hoàng Nam (Admin)',
    approvedAt: '2026-01-01 08:00:00'
  },
  {
    id: 'PL-002',
    code: 'WHOLESALE-DIST',
    name: 'Bảng giá Bán buôn / Đại lý Sỉ',
    type: 'WHOLESALE',
    currency: 'VND',
    targetType: 'GROUP',
    targetValue: 'Wholesale',
    priority: 10,
    status: 'ACTIVE',
    approvalStatus: 'ACTIVE',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    description: 'Chính sách chiết khấu định hướng sản lượng cho các nhà phân phối cấp 2',
    defaultUom: 'PCS',
    itemsCount: 120,
    approvedBy: 'Trần Văn Giám (CFO)',
    approvedAt: '2026-01-02 09:30:00'
  },
  {
    id: 'PL-003',
    code: 'DISTRIBUTOR-N1',
    name: 'Bảng giá Nhà Phân Phối Cấp 1',
    type: 'DISTRIBUTOR',
    currency: 'VND',
    targetType: 'GROUP',
    targetValue: 'Distributor',
    priority: 20,
    status: 'ACTIVE',
    approvalStatus: 'ACTIVE',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    description: 'Mức giá chiết khấu sâu dành riêng cho nhà phân phối độc quyền khu vực',
    defaultUom: 'PCS',
    itemsCount: 98,
    approvedBy: 'Trần Văn Giám (CFO)',
    approvedAt: '2026-01-03 14:15:00'
  },
  {
    id: 'PL-004',
    code: 'VIP-GOLD',
    name: 'Bảng giá Khách hàng Thân thiết VIP',
    type: 'VIP',
    currency: 'VND',
    targetType: 'GROUP',
    targetValue: 'VIP',
    priority: 30,
    status: 'ACTIVE',
    approvalStatus: 'ACTIVE',
    validFrom: '2026-02-01',
    validTo: '2026-12-31',
    description: 'Đặc quyền đối tác chiến lược mua hàng thường xuyên',
    defaultUom: 'PCS',
    itemsCount: 85,
    approvedBy: 'Lê Thu Thủy (CSO)',
    approvedAt: '2026-02-01 10:00:00'
  }
];

let productPrices: ProductPriceItem[] = [
  // RAM 16GB canonical example from problem description
  {
    id: 'PR-RAM-01',
    priceListId: 'PL-001',
    priceListCode: 'RETAIL-STD',
    priceListName: 'Bảng giá Bán lẻ Tiêu chuẩn',
    productId: 'PROD-RAM-16',
    productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
    sku: 'RAM-16GB-DDR5',
    category: 'RAM',
    uom: 'Cây (PCS)',
    costBasis: 444444, // Received from Costing Engine
    ruleApplied: 'MARKUP',
    markupPercent: 50, // 444444 * 1.5 = 666666
    targetMarginPercent: 33.33,
    calculatedPrice: 666666,
    finalPrice: 666666,
    actualMarginPercent: 33.33,
    minMarginPercent: 15,
    isBelowMinMargin: false,
    isOverride: false,
    effectiveFrom: '2026-08-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE',
    approvalStatus: 'ACTIVE',
    notes: 'Giá chuẩn niêm yết theo quy định Markup 50% cho nhóm RAM'
  },
  {
    id: 'PR-RAM-02',
    priceListId: 'PL-002',
    priceListCode: 'WHOLESALE-DIST',
    priceListName: 'Bảng giá Bán buôn / Đại lý Sỉ',
    productId: 'PROD-RAM-16',
    productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
    sku: 'RAM-16GB-DDR5',
    category: 'RAM',
    uom: 'Cây (PCS)',
    costBasis: 444444,
    ruleApplied: 'MARKUP',
    markupPercent: 39.5,
    targetMarginPercent: 28.32,
    calculatedPrice: 620000,
    finalPrice: 620000,
    actualMarginPercent: 28.32,
    minMarginPercent: 15,
    isBelowMinMargin: false,
    isOverride: false,
    effectiveFrom: '2026-08-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE',
    approvalStatus: 'ACTIVE'
  },
  {
    id: 'PR-RAM-03',
    priceListId: 'PL-003',
    priceListCode: 'DISTRIBUTOR-N1',
    priceListName: 'Bảng giá Nhà Phân Phối Cấp 1',
    productId: 'PROD-RAM-16',
    productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
    sku: 'RAM-16GB-DDR5',
    category: 'RAM',
    uom: 'Cây (PCS)',
    costBasis: 444444,
    ruleApplied: 'MARKUP',
    markupPercent: 35.0,
    targetMarginPercent: 25.93,
    calculatedPrice: 600000,
    finalPrice: 600000,
    actualMarginPercent: 25.93,
    minMarginPercent: 15,
    isBelowMinMargin: false,
    isOverride: false,
    effectiveFrom: '2026-08-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE',
    approvalStatus: 'ACTIVE'
  },
  {
    id: 'PR-RAM-04',
    priceListId: 'PL-004',
    priceListCode: 'VIP-GOLD',
    priceListName: 'Bảng giá Khách hàng Thân thiết VIP',
    productId: 'PROD-RAM-16',
    productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
    sku: 'RAM-16GB-DDR5',
    category: 'RAM',
    uom: 'Cây (PCS)',
    costBasis: 444444,
    ruleApplied: 'MARKUP',
    markupPercent: 30.5,
    targetMarginPercent: 23.37,
    calculatedPrice: 580000,
    finalPrice: 580000,
    actualMarginPercent: 23.37,
    minMarginPercent: 15,
    isBelowMinMargin: false,
    isOverride: false,
    effectiveFrom: '2026-08-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE',
    approvalStatus: 'ACTIVE'
  },
  // UOM Example: 1 Box = 10 PCS
  {
    id: 'PR-RAM-05',
    priceListId: 'PL-001',
    priceListCode: 'RETAIL-STD',
    priceListName: 'Bảng giá Bán lẻ Tiêu chuẩn',
    productId: 'PROD-RAM-16',
    productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury (Hộp 10 cây)',
    sku: 'RAM-16GB-DDR5-BOX10',
    category: 'RAM',
    uom: 'Hộp (BOX 10 PCS)',
    uomConversionFactor: 10,
    costBasis: 4444440,
    ruleApplied: 'MARKUP',
    markupPercent: 41.75,
    targetMarginPercent: 29.45,
    calculatedPrice: 6300000,
    finalPrice: 6300000, // Discounted for whole box purchase
    actualMarginPercent: 29.45,
    minMarginPercent: 15,
    isBelowMinMargin: false,
    isOverride: false,
    effectiveFrom: '2026-08-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE',
    approvalStatus: 'ACTIVE',
    notes: 'Quy đổi 1 BOX = 10 PCS; Giảm giá 5.5% khi mua nguyên thùng'
  },
  // SSD 1TB Example
  {
    id: 'PR-SSD-01',
    priceListId: 'PL-001',
    priceListCode: 'RETAIL-STD',
    priceListName: 'Bảng giá Bán lẻ Tiêu chuẩn',
    productId: 'PROD-SSD-1TB',
    productName: 'Ổ Cứng SSD NVMe Samsung 990 Pro 1TB PCIe 4.0',
    sku: 'SSD-1TB-NVME',
    category: 'SSD',
    uom: 'Chiếc',
    costBasis: 1200000,
    ruleApplied: 'CATEGORY_RULE',
    markupPercent: 30, // 1200000 * 1.3 = 1560000
    targetMarginPercent: 23.08,
    calculatedPrice: 1560000,
    finalPrice: 1560000,
    actualMarginPercent: 23.08,
    minMarginPercent: 15,
    isBelowMinMargin: false,
    isOverride: false,
    effectiveFrom: '2026-08-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE',
    approvalStatus: 'ACTIVE'
  },
  // CPU Example
  {
    id: 'PR-CPU-01',
    priceListId: 'PL-001',
    priceListCode: 'RETAIL-STD',
    priceListName: 'Bảng giá Bán lẻ Tiêu chuẩn',
    productId: 'PROD-CPU-I7',
    productName: 'Bộ Vi Xử Lý Intel Core i7 14700K 20 Cores',
    sku: 'CPU-INTEL-I7-14K',
    category: 'CPU',
    uom: 'Chiếc',
    costBasis: 3500000,
    ruleApplied: 'CATEGORY_RULE',
    markupPercent: 25, // 3500000 * 1.25 = 4375000
    targetMarginPercent: 20.00,
    calculatedPrice: 4375000,
    finalPrice: 4375000,
    actualMarginPercent: 20.00,
    minMarginPercent: 15,
    isBelowMinMargin: false,
    isOverride: false,
    effectiveFrom: '2026-08-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE',
    approvalStatus: 'ACTIVE'
  }
];

let categoryRules: CategoryPricingRule[] = [
  {
    id: 'CR-001',
    category: 'RAM',
    ruleType: 'MARKUP',
    ruleValue: 50, // +50%
    minMarginPercent: 15,
    roundingMode: 'NEAREST_1000',
    description: 'Quy tắc thặng dư linh kiện RAM tiêu chuẩn (+50% Markup)',
    isActive: true,
    appliedProductCount: 24,
    updatedAt: '2026-08-20 10:00:00',
    updatedBy: 'Hoàng Nam (Admin)'
  },
  {
    id: 'CR-002',
    category: 'SSD',
    ruleType: 'MARKUP',
    ruleValue: 30, // +30%
    minMarginPercent: 15,
    roundingMode: 'NEAREST_1000',
    description: 'Quy tắc định giá ổ cứng SSD thể rắn (+30% Markup)',
    isActive: true,
    appliedProductCount: 18,
    updatedAt: '2026-08-20 10:00:00',
    updatedBy: 'Hoàng Nam (Admin)'
  },
  {
    id: 'CR-003',
    category: 'CPU',
    ruleType: 'MARKUP',
    ruleValue: 25, // +25%
    minMarginPercent: 15,
    roundingMode: 'NEAREST_1000',
    description: 'Quy tắc định giá CPU Intel & AMD (+25% Markup)',
    isActive: true,
    appliedProductCount: 12,
    updatedAt: '2026-08-20 10:00:00',
    updatedBy: 'Hoàng Nam (Admin)'
  },
  {
    id: 'CR-004',
    category: 'Accessory',
    ruleType: 'MARKUP',
    ruleValue: 40, // +40%
    minMarginPercent: 20,
    roundingMode: 'NEAREST_100',
    description: 'Phụ kiện máy tính, dây cáp, adapter (+40% Markup)',
    isActive: true,
    appliedProductCount: 65,
    updatedAt: '2026-08-20 10:00:00',
    updatedBy: 'Hoàng Nam (Admin)'
  }
];

let customerPricingList: CustomerPricing[] = [
  {
    id: 'CP-001',
    customerId: 'CUST-001',
    customerName: 'Công ty CP Công Nghệ FPT Software',
    customerGroup: 'VIP',
    productId: 'PROD-RAM-16',
    productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
    sku: 'RAM-16GB-DDR5',
    uom: 'Cây (PCS)',
    contractCode: 'HD-FPT-2026-09',
    customPrice: 650000,
    standardPrice: 666666,
    discountPercent: 2.5,
    costBasis: 444444,
    actualMarginPercent: 31.62,
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    status: 'ACTIVE',
    approvedBy: 'Trần Văn Giám (CFO)'
  },
  {
    id: 'CP-002',
    customerId: 'CUST-002',
    customerName: 'Tập đoàn Công nghệ CMC Telecom',
    customerGroup: 'VIP',
    productId: 'PROD-RAM-16',
    productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
    sku: 'RAM-16GB-DDR5',
    uom: 'Cây (PCS)',
    contractCode: 'HD-CMC-2026-14',
    customPrice: 630000,
    standardPrice: 666666,
    discountPercent: 5.5,
    costBasis: 444444,
    actualMarginPercent: 29.45,
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    status: 'ACTIVE',
    approvedBy: 'Trần Văn Giám (CFO)'
  },
  {
    id: 'CP-003',
    customerId: 'CUST-003',
    customerName: 'Hệ thống Bán buôn Thế Giới Số (DGW)',
    customerGroup: 'Distributor' as any,
    productId: 'PROD-RAM-16',
    productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
    sku: 'RAM-16GB-DDR5',
    uom: 'Cây (PCS)',
    contractCode: 'HD-DGW-DIST-01',
    customPrice: 600000,
    standardPrice: 666666,
    discountPercent: 10.0,
    costBasis: 444444,
    actualMarginPercent: 25.93,
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    status: 'ACTIVE',
    approvedBy: 'Trần Văn Giám (CFO)'
  }
];

let quantityTiers: QuantityPricingTier[] = [
  {
    id: 'QT-001',
    productId: 'PROD-RAM-16',
    productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
    sku: 'RAM-16GB-DDR5',
    uom: 'Cây (PCS)',
    minQty: 1,
    maxQty: 9,
    unitPrice: 666666,
    discountPercent: 0,
    costBasis: 444444,
    actualMarginPercent: 33.33,
    effectiveFrom: '2026-08-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    id: 'QT-002',
    productId: 'PROD-RAM-16',
    productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
    sku: 'RAM-16GB-DDR5',
    uom: 'Cây (PCS)',
    minQty: 10,
    maxQty: 49,
    unitPrice: 640000,
    discountPercent: 4.0,
    costBasis: 444444,
    actualMarginPercent: 30.56,
    effectiveFrom: '2026-08-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    id: 'QT-003',
    productId: 'PROD-RAM-16',
    productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
    sku: 'RAM-16GB-DDR5',
    uom: 'Cây (PCS)',
    minQty: 50,
    maxQty: 99,
    unitPrice: 620000,
    discountPercent: 7.0,
    costBasis: 444444,
    actualMarginPercent: 28.32,
    effectiveFrom: '2026-08-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    id: 'QT-004',
    productId: 'PROD-RAM-16',
    productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
    sku: 'RAM-16GB-DDR5',
    uom: 'Cây (PCS)',
    minQty: 100,
    maxQty: null, // 100+
    unitPrice: 600000,
    discountPercent: 10.0,
    costBasis: 444444,
    actualMarginPercent: 25.93,
    effectiveFrom: '2026-08-01',
    effectiveTo: '2026-12-31',
    status: 'ACTIVE'
  }
];

let promotions: PromotionCampaign[] = [
  {
    id: 'PROMO-001',
    code: 'BACK-TO-SCHOOL-2026',
    name: 'Chiến dịch Mùa Tựu Trường 2026 — Linh Kiện Máy Tính',
    description: 'Giảm giá ưu đãi RAM DDR5 từ ngày 01/09 đến 15/09; tự động hoàn nguyên sau khi hết hạn',
    productId: 'PROD-RAM-16',
    productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
    sku: 'RAM-16GB-DDR5',
    standardPrice: 666666,
    promoPrice: 599000,
    discountPercent: 10.15,
    startDate: '2026-09-01',
    endDate: '2026-09-15',
    isActive: true,
    autoRevert: true,
    minPurchaseQty: 1
  }
];

let approvalRequests: PriceApprovalRequest[] = [
  {
    id: 'APR-2026-001',
    requestNumber: 'REQ-PRC-2026-089',
    productId: 'PROD-RAM-16',
    productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
    sku: 'RAM-16GB-DDR5',
    priceListId: 'PL-001',
    priceListName: 'Bảng giá Bán lẻ Tiêu chuẩn',
    costBasis: 444444,
    oldPrice: 666666,
    newPrice: 650000,
    oldMarginPercent: 33.33,
    newMarginPercent: 31.62,
    minMarginPercent: 15,
    isBelowMinMargin: false,
    reason: 'Điều chỉnh theo biến động giá thị trường khu vực phía Nam để tăng tốc độ luân chuyển hàng',
    requester: 'Nguyễn Văn Kinh (Trưởng phòng Bán lẻ)',
    requestedAt: '2026-08-29 14:30:00',
    status: 'PENDING_APPROVAL'
  }
];

let auditLogs: PriceAuditLog[] = [
  {
    id: 'AUD-001',
    productId: 'PROD-RAM-16',
    productName: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
    sku: 'RAM-16GB-DDR5',
    priceListCode: 'RETAIL-STD',
    priceListName: 'Bảng giá Bán lẻ Tiêu chuẩn',
    uom: 'Cây (PCS)',
    oldPrice: 640000,
    newPrice: 666666,
    ruleApplied: 'Category Rule +50% Markup',
    reason: 'Giá vốn nhà máy tăng theo đợt nhập mới lô GR-2026-08-11',
    isOverride: false,
    changedBy: 'Hoàng Nam (Admin)',
    changedAt: '2026-08-01 08:00:00',
    approvedBy: 'Trần Văn Giám (CFO)',
    approvedAt: '2026-08-01 09:15:00',
    effectiveFrom: '2026-08-01',
    effectiveTo: '2026-12-31'
  }
];

// --- ROUTES ---

// 1. Get all price lists
router.get("/api/pricing/lists", (req, res) => {
  res.json({ success: true, data: priceLists });
});

// 2. Get all product price items
router.get("/api/pricing/items", (req, res) => {
  res.json({ success: true, data: productPrices });
});

// 3. Get category rules
router.get("/api/pricing/rules", (req, res) => {
  res.json({ success: true, data: categoryRules });
});

// 4. Get customer-specific prices
router.get("/api/pricing/customer-prices", (req, res) => {
  res.json({ success: true, data: customerPricingList });
});

// 5. Get quantity tier breaks
router.get("/api/pricing/quantity-tiers", (req, res) => {
  res.json({ success: true, data: quantityTiers });
});

// 6. Get promotions
router.get("/api/pricing/promotions", (req, res) => {
  res.json({ success: true, data: promotions });
});

// 7. Get approvals
router.get("/api/pricing/approvals", (req, res) => {
  res.json({ success: true, data: approvalRequests });
});

// 8. Get audit logs
router.get("/api/pricing/audit-logs", (req, res) => {
  res.json({ success: true, data: auditLogs });
});

// 9. Price Resolution Engine Endpoint (Authoritative 6-Step Waterfall)
router.post("/api/pricing/resolve", (req, res) => {
  const query: PriceResolutionQuery = req.body;
  const { customerId, customerGroup, productId, quantity, uom, transactionDate } = query;

  const tDate = transactionDate || new Date().toISOString().split('T')[0];

  // Base fallback standard price
  const stdItem = productPrices.find(p => p.productId === productId && p.priceListCode === 'RETAIL-STD') || productPrices[0];
  const cost = stdItem ? stdItem.costBasis : 444444;
  let resolvedPrice = stdItem ? stdItem.finalPrice : 666666;
  let resolutionStep = '6. Default Base Product Price (Giá niêm yết bán lẻ)';
  let discountPercent = 0;

  // 1. Check Customer-specific Contract
  if (customerId) {
    const custContract = customerPricingList.find(c => c.customerId === customerId && c.productId === productId && c.status === 'ACTIVE');
    if (custContract) {
      resolvedPrice = custContract.customPrice;
      resolutionStep = `1. Customer Contract [${custContract.contractCode || 'Riêng'}]`;
      discountPercent = custContract.discountPercent;
    }
  }

  // 2. Check Customer Group Price
  if (resolutionStep.startsWith('6') && customerGroup) {
    const grpPrice = productPrices.find(p => p.productId === productId && p.priceListName.toLowerCase().includes(customerGroup.toLowerCase()));
    if (grpPrice) {
      resolvedPrice = grpPrice.finalPrice;
      resolutionStep = `2. Customer Group Price [Nhóm ${customerGroup}]`;
    }
  }

  // 3. Check Quantity Break Tiers
  if (resolutionStep.startsWith('6') || resolutionStep.startsWith('2')) {
    const tier = quantityTiers.find(t => t.productId === productId && quantity >= t.minQty && (t.maxQty === null || quantity <= t.maxQty));
    if (tier && tier.unitPrice < resolvedPrice) {
      resolvedPrice = tier.unitPrice;
      resolutionStep = `3. Quantity Break Tier [SL: ${tier.minQty} - ${tier.maxQty || 'Trở lên'}]`;
      discountPercent = tier.discountPercent;
    }
  }

  // 4. Check Active Promotion
  if (resolutionStep.startsWith('6')) {
    const promo = promotions.find(p => p.productId === productId && p.isActive && tDate >= p.startDate && tDate <= p.endDate);
    if (promo && promo.promoPrice < resolvedPrice) {
      resolvedPrice = promo.promoPrice;
      resolutionStep = `4. Active Promotion [${promo.name}]`;
      discountPercent = promo.discountPercent;
    }
  }

  // Calculate taxes (10% VAT standard) and margins
  const vatRate = 0.10;
  const vatAmount = Math.round(resolvedPrice * vatRate);
  const finalUnitPriceInclVat = resolvedPrice + vatAmount;
  const lineTotalExclVat = resolvedPrice * quantity;
  const lineTotalInclVat = finalUnitPriceInclVat * quantity;
  const actualMarginPercent = PricingService.calculateActualMargin(cost, resolvedPrice);

  let marginStatus: 'PASS' | 'WARNING' | 'CRITICAL_BELOW_MIN' = 'PASS';
  if (actualMarginPercent < 15) {
    marginStatus = actualMarginPercent < 5 ? 'CRITICAL_BELOW_MIN' : 'WARNING';
  }

  const result: PriceResolutionResult = {
    productId,
    productName: stdItem ? stdItem.productName : 'Sản phẩm',
    sku: stdItem ? stdItem.sku : 'SKU-001',
    uom: uom || 'Cây (PCS)',
    quantity: quantity || 1,
    baseStandardPrice: stdItem ? stdItem.finalPrice : 666666,
    resolutionStep,
    resolvedUnitPrice: resolvedPrice,
    discountPercent,
    discountAmount: Math.round((stdItem.finalPrice - resolvedPrice)),
    finalUnitPriceExclVat: resolvedPrice,
    vatRate,
    vatAmount,
    finalUnitPriceInclVat,
    lineTotalExclVat,
    lineTotalInclVat,
    costBasis: cost,
    actualMarginPercent,
    marginStatus,
    governanceNote: 'Resolved by Authoritative Pricing Engine (M41). Cost basis supplied by Costing Engine.'
  };

  res.json({ success: true, data: result });
});

// 10. Bulk Calculate Pricing
router.post("/api/pricing/bulk-calculate", (req, res) => {
  const { items, defaultRule } = req.body;
  const calculated = (items || []).map((item: any, idx: number) => {
    const cost = Number(item.costBasis);
    if (!cost || cost <= 0) {
      return {
        ...item,
        id: item.id || `BULK-${idx + 1}`,
        calculatedPrice: 0,
        finalPrice: 0,
        actualMarginPercent: 0,
        hasMarginWarning: true,
        isApproved: false,
        error: "ERR_COST_BASIS_REQUIRED: costBasis là bắt buộc và phải lớn hơn 0."
      };
    }
    const markup = item.markupPercent !== undefined ? Number(item.markupPercent) : 50;
    const sellingPrice = PricingService.calculateMarkupPrice(cost, markup);
    const actualMargin = PricingService.calculateActualMargin(cost, sellingPrice);
    const marginCheck = PricingService.checkMinimumMargin(cost, sellingPrice, 15);

    return {
      ...item,
      id: item.id || `BULK-${idx + 1}`,
      calculatedPrice: sellingPrice,
      finalPrice: item.manualPrice || sellingPrice,
      actualMarginPercent: actualMargin,
      hasMarginWarning: marginCheck.isBelowMin,
      isApproved: !marginCheck.isBelowMin
    };
  });

  res.json({ success: true, data: calculated });
});

// 11. Maker-Checker Approve / Reject
router.post("/api/pricing/approve", (req, res) => {
  const { requestId, action, approver, reason } = req.body;
  const request = approvalRequests.find(r => r.id === requestId);
  if (!request) {
    return res.status(404).json({ success: false, error: 'Approval request not found' });
  }

  request.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  request.approver = approver || 'Trần Văn Giám (CFO)';
  request.approvedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
  if (action === 'REJECT') {
    request.rejectionReason = reason || 'Không đạt biên lợi nhuận kỳ vọng';
  } else {
    // Update product price
    const prodItem = productPrices.find(p => p.productId === request.productId && p.priceListId === request.priceListId);
    if (prodItem) {
      prodItem.finalPrice = request.newPrice;
      prodItem.actualMarginPercent = request.newMarginPercent;
      prodItem.approvalStatus = 'ACTIVE';
    }
  }

  res.json({ success: true, data: request });
});

// 12. Manual Override
router.post("/api/pricing/override", (req, res) => {
  const { productId, priceListId, newPrice, reason, changedBy, approvedBy } = req.body;
  const prodItem = productPrices.find(p => p.productId === productId && p.priceListId === priceListId);
  if (!prodItem) {
    return res.status(404).json({ success: false, error: 'Price item not found' });
  }

  const oldPrice = prodItem.finalPrice;
  prodItem.finalPrice = Number(newPrice);
  prodItem.isOverride = true;
  prodItem.overrideReason = reason;
  prodItem.overrideChangedBy = changedBy || 'Manager';
  prodItem.overrideChangedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
  prodItem.overrideApprovedBy = approvedBy || 'Director';
  prodItem.actualMarginPercent = (prodItem.costBasis > 0 && prodItem.finalPrice > 0)
    ? PricingService.calculateActualMargin(prodItem.costBasis, prodItem.finalPrice)
    : 0;

  // Log to Audit Trail
  const log: PriceAuditLog = {
    id: `AUD-${Date.now()}`,
    productId: prodItem.productId,
    productName: prodItem.productName,
    sku: prodItem.sku,
    priceListCode: prodItem.priceListCode,
    priceListName: prodItem.priceListName,
    uom: prodItem.uom,
    oldPrice,
    newPrice: prodItem.finalPrice,
    ruleApplied: 'Manual Override',
    reason,
    isOverride: true,
    changedBy: changedBy || 'Manager',
    changedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    approvedBy: approvedBy || 'Director',
    approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '2026-12-31'
  };
  auditLogs.unshift(log);

  res.json({ success: true, data: prodItem, auditLog: log });
});

export default router;
