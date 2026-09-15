import React, { useState, useEffect } from 'react';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { ENTERPRISE_MASTER_PRODUCTS } from '../../../../data/enterpriseMaster';
import {
  Layers,
  Tag,
  DollarSign,
  Percent,
  TrendingUp,
  ShieldCheck,
  History,
  Calculator,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Package,
  Clock,
  Sparkles,
  Sliders,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
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
} from './types';
import { PricingService } from './utils';

// Subcomponents
import { PriceListsTab } from './PriceListsTab';
import { ProductPricesTab } from './ProductPricesTab';
import { PricingRulesTab } from './PricingRulesTab';
import { CustomerPricingTab } from './CustomerPricingTab';
import { QuantityPricingTab } from './QuantityPricingTab';
import { PromotionsTab } from './PromotionsTab';
import { BulkPricingTab } from './BulkPricingTab';
import { PriceApprovalTab } from './PriceApprovalTab';
import { PriceHistoryTab } from './PriceHistoryTab';
import { PricingAuditAndSimulatorTab } from './PricingAuditAndSimulatorTab';
import { ManualOverrideModal } from './ManualOverrideModal';
import { InboundReceivingModal } from './InboundReceivingModal';
import { AddProductPricingModal } from './AddProductPricingModal';

export const M41PricingManagementWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<
    'price_lists' | 'product_prices' | 'pricing_rules' | 'customer_pricing' | 'quantity_pricing' | 'promotions' | 'bulk_pricing' | 'approvals' | 'history_audit' | 'simulator'
  >('M41', 'product_prices');

  // Core Datasets State
  const [priceLists, setPriceLists] = useState<PriceList[]>([
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
  ]);

  const [productPrices, setProductPrices] = useState<ProductPriceItem[]>(
    ENTERPRISE_MASTER_PRODUCTS.map((p, idx) => {
      const margin = ((p.retailPrice - p.costPrice) / p.retailPrice) * 100;
      const markup = ((p.retailPrice - p.costPrice) / p.costPrice) * 100;
      return {
        id: `PR-${idx + 1}`,
        priceListId: 'PL-001',
        priceListCode: 'RETAIL-STD',
        priceListName: 'Bảng giá Bán lẻ Tiêu chuẩn',
        productId: `PROD-${p.sku}`,
        productName: p.name,
        sku: p.sku,
        category: p.category,
        uom: p.unit,
        costBasis: p.costPrice,
        ruleApplied: 'MARKUP',
        markupPercent: Number(markup.toFixed(2)),
        targetMarginPercent: Number(margin.toFixed(2)),
        calculatedPrice: p.retailPrice,
        finalPrice: p.retailPrice,
        actualMarginPercent: Number(margin.toFixed(2)),
        minMarginPercent: 15,
        isBelowMinMargin: margin < 15,
        isOverride: false,
        effectiveFrom: '2026-08-01',
        effectiveTo: '2026-12-31',
        status: 'ACTIVE',
        approvalStatus: 'ACTIVE'
      };
    })
  );

  const [categoryRules, setCategoryRules] = useState<CategoryPricingRule[]>([
    {
      id: 'CR-001',
      category: 'RAM',
      ruleType: 'MARKUP',
      ruleValue: 50,
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
      ruleValue: 30,
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
      ruleValue: 25,
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
      ruleValue: 40,
      minMarginPercent: 20,
      roundingMode: 'NEAREST_100',
      description: 'Phụ kiện máy tính, dây cáp, adapter (+40% Markup)',
      isActive: true,
      appliedProductCount: 65,
      updatedAt: '2026-08-20 10:00:00',
      updatedBy: 'Hoàng Nam (Admin)'
    }
  ]);

  const [customerPricingList, setCustomerPricingList] = useState<CustomerPricing[]>([
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
    }
  ]);

  const [quantityTiers, setQuantityTiers] = useState<QuantityPricingTier[]>([
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
      maxQty: null,
      unitPrice: 600000,
      discountPercent: 10.0,
      costBasis: 444444,
      actualMarginPercent: 25.93,
      effectiveFrom: '2026-08-01',
      effectiveTo: '2026-12-31',
      status: 'ACTIVE'
    }
  ]);

  const [promotions, setPromotions] = useState<PromotionCampaign[]>([
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
  ]);

  const [approvalRequests, setApprovalRequests] = useState<PriceApprovalRequest[]>([
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
  ]);

  const [auditLogs, setAuditLogs] = useState<PriceAuditLog[]>([
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
  ]);

  // Selected Price List State
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>('PL-001');

  // Modal States
  const [overrideModalItem, setOverrideModalItem] = useState<ProductPriceItem | null>(null);
  const [isInboundModalOpen, setIsInboundModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // Stats calculation
  const totalLists = priceLists.length;
  const totalPricedSkus = productPrices.length;
  const pendingApprovalsCount = approvalRequests.filter(a => a.status === 'PENDING_APPROVAL').length;
  const avgMargin = (productPrices.reduce((acc, curr) => acc + curr.actualMarginPercent, 0) / (productPrices.length || 1)).toFixed(1);

  // Handlers
  const handleAddNewPriceList = (newList: PriceList) => {
    setPriceLists(prev => [newList, ...prev]);
  };

  const handleAddNewProductPrice = (newItem: ProductPriceItem) => {
    setProductPrices(prev => [newItem, ...prev]);
    // Log to Audit Trail
    const newLog: PriceAuditLog = {
      id: `AUD-NEW-${Date.now().toString().slice(-4)}`,
      productId: newItem.productId,
      productName: newItem.productName,
      sku: newItem.sku,
      priceListCode: newItem.priceListCode,
      priceListName: newItem.priceListName,
      uom: newItem.uom,
      oldPrice: 0,
      newPrice: newItem.finalPrice,
      ruleApplied: newItem.ruleApplied === 'MARKUP' ? `Markup +${newItem.markupPercent}%` : `Target Margin ${newItem.targetMarginPercent}%`,
      reason: 'Khai báo sản phẩm mới & thiết lập giá bán cơ sở ban đầu',
      isOverride: false,
      changedBy: 'Pricing Manager (Nguyễn Văn Kinh)',
      changedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      approvedBy: 'Trần Văn Giám (CFO)',
      approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      effectiveFrom: newItem.effectiveFrom,
      effectiveTo: newItem.effectiveTo
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleUpdateRule = (updatedRule: CategoryPricingRule) => {
    setCategoryRules(prev => {
      const exists = prev.some(r => r.id === updatedRule.id);
      if (exists) {
        return prev.map(r => r.id === updatedRule.id ? updatedRule : r);
      }
      return [...prev, updatedRule];
    });

    // Recalculate products under this category
    setProductPrices(prev => prev.map(item => {
      if (item.category.toLowerCase() === updatedRule.category.toLowerCase() && !item.isOverride) {
        const newPrice = updatedRule.ruleType === 'MARKUP'
          ? PricingService.calculateMarkupPrice(item.costBasis, updatedRule.ruleValue, updatedRule.roundingMode)
          : PricingService.calculateMarginPrice(item.costBasis, updatedRule.ruleValue, updatedRule.roundingMode);
        const newMargin = (item.costBasis > 0 && newPrice > 0) ? PricingService.calculateActualMargin(item.costBasis, newPrice) : 0;
        return {
          ...item,
          ruleApplied: updatedRule.ruleType === 'MARKUP' ? 'MARKUP' : 'MARGIN',
          markupPercent: updatedRule.ruleType === 'MARKUP' ? updatedRule.ruleValue : undefined,
          targetMarginPercent: updatedRule.ruleType === 'TARGET_MARGIN' ? updatedRule.ruleValue : undefined,
          calculatedPrice: newPrice,
          finalPrice: newPrice,
          actualMarginPercent: newMargin,
          minMarginPercent: updatedRule.minMarginPercent,
          isBelowMinMargin: newMargin < updatedRule.minMarginPercent
        };
      }
      return item;
    }));

    // Add Audit Log
    const auditLog: PriceAuditLog = {
      id: `AUD-RULE-${Date.now().toString().slice(-4)}`,
      productId: `CAT-${updatedRule.category.toUpperCase()}`,
      productName: `Cấu hình Quy Tắc Danh Mục: ${updatedRule.category}`,
      sku: `CATEGORY-${updatedRule.category.toUpperCase()}`,
      priceListCode: 'ALL_PRICE_LISTS',
      priceListName: 'Tất cả bảng giá tiêu chuẩn',
      uom: 'Đa dạng',
      oldPrice: 0,
      newPrice: updatedRule.ruleValue,
      ruleApplied: `${updatedRule.ruleType === 'MARKUP' ? 'Markup' : 'Target Margin'} ${updatedRule.ruleValue}%`,
      reason: `Cập nhật tỷ lệ định giá danh mục ${updatedRule.category} (${updatedRule.ruleType} ${updatedRule.ruleValue}%, Min Margin ${updatedRule.minMarginPercent}%)`,
      isOverride: false,
      changedBy: updatedRule.updatedBy || 'Hoàng Nam (Admin)',
      changedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      approvedBy: 'Trần Văn Giám (CFO)',
      approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '2026-12-31'
    };
    setAuditLogs(prev => [auditLog, ...prev]);
  };

  const handleConfirmOverride = (params: {
    productId: string;
    priceListId: string;
    newPrice: number;
    reason: string;
    changedBy: string;
    approvedBy: string;
  }) => {
    const target = productPrices.find(p => p.productId === params.productId && p.priceListId === params.priceListId);
    if (!target) return;

    const oldPrice = target.finalPrice;
    const newMargin = (target.costBasis > 0 && params.newPrice > 0) ? PricingService.calculateActualMargin(target.costBasis, params.newPrice) : 0;

    setProductPrices(prev => prev.map(p => {
      if (p.productId === params.productId && p.priceListId === params.priceListId) {
        return {
          ...p,
          finalPrice: params.newPrice,
          actualMarginPercent: newMargin,
          isOverride: true,
          overrideReason: params.reason,
          overrideChangedBy: params.changedBy,
          overrideChangedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          overrideApprovedBy: params.approvedBy
        };
      }
      return p;
    }));

    // Add to Audit Trail
    const newLog: PriceAuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      productId: target.productId,
      productName: target.productName,
      sku: target.sku,
      priceListCode: target.priceListCode,
      priceListName: target.priceListName,
      uom: target.uom,
      oldPrice,
      newPrice: params.newPrice,
      ruleApplied: 'Manual Override (Can thiệp đặc cách)',
      reason: params.reason,
      isOverride: true,
      changedBy: params.changedBy,
      changedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      approvedBy: params.approvedBy,
      approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '2026-12-31'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleApplyInboundCost = (params: {
    productId: string;
    newCost: number;
    receiptCode: string;
    supplier: string;
  }) => {
    // Update cost basis across all price lists for this product
    setProductPrices(prev => prev.map(item => {
      if (item.productId === params.productId) {
        const newCalculated = params.newCost > 0 ? PricingService.calculateMarkupPrice(params.newCost, item.markupPercent || 50) : item.finalPrice;
        const newMargin = (params.newCost > 0 && newCalculated > 0) ? PricingService.calculateActualMargin(params.newCost, newCalculated) : 0;
        return {
          ...item,
          costBasis: params.newCost,
          calculatedPrice: newCalculated,
          finalPrice: newCalculated,
          actualMarginPercent: newMargin
        };
      }
      return item;
    }));

    // Log to Audit
    const sample = productPrices.find(p => p.productId === params.productId);
    if (sample) {
      const newLog: PriceAuditLog = {
        id: `AUD-INBOUND-${Date.now().toString().slice(-4)}`,
        productId: sample.productId,
        productName: sample.productName,
        sku: sample.sku,
        priceListCode: 'RETAIL-STD',
        priceListName: 'Bảng giá Bán lẻ Tiêu chuẩn',
        uom: sample.uom,
        oldPrice: sample.finalPrice,
        newPrice: PricingService.calculateMarkupPrice(params.newCost, sample.markupPercent || 50),
        ruleApplied: `Inbound Cost Sync [${params.receiptCode}]`,
        reason: `Cập nhật giá vốn từ nhà cung cấp ${params.supplier}`,
        isOverride: false,
        changedBy: 'Costing Engine Daemon',
        changedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        approvedBy: 'Hệ Thống Tự Động',
        approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        effectiveFrom: new Date().toISOString().split('T')[0],
        effectiveTo: '2026-12-31'
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  const handleApproveRequest = (requestId: string) => {
    const req = approvalRequests.find(r => r.id === requestId);
    if (!req) return;

    setApprovalRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      status: 'APPROVED',
      approver: 'Trần Văn Giám (CFO)',
      approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    } : r));

    // Update product price
    setProductPrices(prev => prev.map(p => {
      if (p.productId === req.productId && p.priceListId === req.priceListId) {
        return {
          ...p,
          finalPrice: req.newPrice,
          actualMarginPercent: req.newMarginPercent
        };
      }
      return p;
    }));
  };

  const handleRejectRequest = (requestId: string, reason: string) => {
    setApprovalRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      status: 'REJECTED',
      rejectionReason: reason,
      approver: 'Trần Văn Giám (CFO)',
      approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    } : r));
  };

  const handleCommitBulkPrices = (newItems: ProductPriceItem[]) => {
    // Add/Update items in productPrices
    setProductPrices(prev => {
      const updated = [...prev];
      newItems.forEach(item => {
        const existingIdx = updated.findIndex(p => p.sku === item.sku && p.priceListId === item.priceListId);
        if (existingIdx >= 0) {
          updated[existingIdx] = item;
        } else {
          updated.unshift(item);
        }
      });
      return updated;
    });

    // Add Audit Log
    const bulkAudit: PriceAuditLog = {
      id: `AUD-BULK-${Date.now().toString().slice(-4)}`,
      productId: newItems[0]?.productId || 'MULTIPLE-SKUS',
      productName: `Nhập & Cập Nhật Hàng Loạt (${newItems.length} Sản phẩm)`,
      sku: `${newItems.length} SKUs`,
      priceListCode: newItems[0]?.priceListCode || 'PL-STD',
      priceListName: newItems[0]?.priceListName || 'Bảng giá chuẩn',
      uom: 'Đa dạng',
      oldPrice: 0,
      newPrice: newItems.reduce((acc, curr) => acc + curr.finalPrice, 0),
      ruleApplied: 'Bulk Pricing Authority Engine',
      reason: `Nạp dữ liệu giá tự động hàng loạt cho ${newItems.length} sản phẩm`,
      isOverride: false,
      changedBy: 'Pricing Specialist (Nguyễn Văn Kinh)',
      changedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      approvedBy: 'Trần Văn Giám (CFO)',
      approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '2026-12-31'
    };
    setAuditLogs(prev => [bulkAudit, ...prev]);
  };

  const handleSubmitBulkApprovalRequests = (requests: PriceApprovalRequest[]) => {
    setApprovalRequests(prev => [...requests, ...prev]);
  };

  // Authoritative Price Resolution Method
  const executePriceResolution = async (query: PriceResolutionQuery): Promise<PriceResolutionResult> => {
    // 1. Check Customer-specific Contract
    const targetDate = query.transactionDate || new Date().toISOString().split('T')[0];
    const stdItem = productPrices.find(p => p.productId === query.productId && p.priceListCode === 'RETAIL-STD') || productPrices[0];
    const cost = stdItem ? stdItem.costBasis : 444444;
    let resolvedPrice = stdItem ? stdItem.finalPrice : 666666;
    let resolutionStep = '6. Default Base Product Price (Giá niêm yết bán lẻ tiêu chuẩn)';
    let discountPercent = 0;

    if (query.customerId) {
      const custContract = customerPricingList.find(c => c.customerId === query.customerId && c.productId === query.productId && c.status === 'ACTIVE');
      if (custContract) {
        resolvedPrice = custContract.customPrice;
        resolutionStep = `1. Customer Contract [${custContract.contractCode || 'Riêng'}]`;
        discountPercent = custContract.discountPercent;
      }
    }

    if (resolutionStep.startsWith('6') && query.customerGroup) {
      const grpPrice = productPrices.find(p => p.productId === query.productId && p.priceListName.toLowerCase().includes(query.customerGroup!.toLowerCase()));
      if (grpPrice) {
        resolvedPrice = grpPrice.finalPrice;
        resolutionStep = `2. Customer Group Price [Nhóm ${query.customerGroup}]`;
      }
    }

    if (resolutionStep.startsWith('6') || resolutionStep.startsWith('2')) {
      const tier = quantityTiers.find(t => t.productId === query.productId && query.quantity >= t.minQty && (t.maxQty === null || query.quantity <= t.maxQty));
      if (tier && tier.unitPrice < resolvedPrice) {
        resolvedPrice = tier.unitPrice;
        resolutionStep = `3. Quantity Break Tier [SL: ${tier.minQty} - ${tier.maxQty || 'Trở lên'}]`;
        discountPercent = tier.discountPercent;
      }
    }

    if (resolutionStep.startsWith('6')) {
      const promo = promotions.find(p => p.productId === query.productId && p.isActive && targetDate >= p.startDate && targetDate <= p.endDate);
      if (promo && promo.promoPrice < resolvedPrice) {
        resolvedPrice = promo.promoPrice;
        resolutionStep = `4. Active Promotion [${promo.name}]`;
        discountPercent = promo.discountPercent;
      }
    }

    const vatRate = 0.10;
    const vatAmount = Math.round(resolvedPrice * vatRate);
    const finalUnitPriceInclVat = resolvedPrice + vatAmount;
    const lineTotalExclVat = resolvedPrice * query.quantity;
    const lineTotalInclVat = finalUnitPriceInclVat * query.quantity;
    const actualMarginPercent = (cost > 0 && resolvedPrice > 0) ? PricingService.calculateActualMargin(cost, resolvedPrice) : 0;

    return {
      productId: query.productId,
      productName: stdItem ? stdItem.productName : 'Sản phẩm',
      sku: stdItem ? stdItem.sku : 'SKU-001',
      uom: query.uom || 'Cây (PCS)',
      quantity: query.quantity,
      baseStandardPrice: stdItem ? stdItem.finalPrice : 666666,
      resolutionStep,
      resolvedUnitPrice: resolvedPrice,
      discountPercent,
      discountAmount: Math.round((stdItem ? stdItem.finalPrice : 666666) - resolvedPrice),
      finalUnitPriceExclVat: resolvedPrice,
      vatRate,
      vatAmount,
      finalUnitPriceInclVat,
      lineTotalExclVat,
      lineTotalInclVat,
      costBasis: cost,
      actualMarginPercent,
      marginStatus: actualMarginPercent < 15 ? 'WARNING' : 'PASS',
      governanceNote: 'Resolved by Authoritative Pricing Engine (M41). Cost basis supplied by Costing Engine without recalculation.'
    };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Workspace Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold rounded border border-emerald-400/30">
                  MODULE M41
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Rule #19 & Rule #20 Active
                </span>
              </div>
              <h1 className="text-xl font-bold text-white mt-1">
                Product Pricing & Price Management
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 max-w-2xl">
            Nguồn chuẩn quản lý, tính toán và phân phối giá bán sản phẩm trong NexusSync ERP. Tách bạch hoàn toàn giữa <strong>Giá Vốn (Costing Engine)</strong> và <strong>Giá Bán (Pricing Authority)</strong>.
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsInboundModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer"
          >
            <Package className="w-4 h-4 text-slate-300" />
            <span>Nhận Phiếu Nhập Kho (Inbound Sync)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('simulator');
              setTimeout(() => {
                const btn = document.getElementById('tab-btn-simulator');
                btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }, 50);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tra Cứu Giá Waterfall</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-bold uppercase tracking-wider">
            <span>Bảng Giá Hoạt Động</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1">{totalLists}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Chuẩn hóa Bán lẻ, Sỉ, Đại lý, VIP
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-bold uppercase tracking-wider">
            <span>SKU Đã Cấu Hình Giá</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1">{totalPricedSkus}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Bao gồm phân cấp UOM (PCS / BOX)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-bold uppercase tracking-wider">
            <span>Chờ Duyệt (Maker-Checker)</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingApprovalsCount}</div>
          <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 font-medium">
            {pendingApprovalsCount > 0 ? 'Cần CFO phê duyệt biên LN' : 'Đã duyệt toàn bộ'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-bold uppercase tracking-wider">
            <span>Biên LN Trung Bình (Margin)</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-300 mt-1">{avgMargin}%</div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 font-medium">
            Đạt ngưỡng sàn tối thiểu (≥15%)
          </div>
        </div>
      </div>

      {/* Master Tab Navigation with Category Tabs & Smooth Scroll Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-2">
        <div className="flex items-center justify-between gap-2">
          {/* Scroll Left Button */}
          <button
            onClick={() => {
              const el = document.getElementById('pricing-tab-scroll-container');
              if (el) el.scrollBy({ left: -200, behavior: 'smooth' });
            }}
            className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors shrink-0 cursor-pointer"
            title="Cuộn sang trái"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Nav Strip */}
          <nav
            id="pricing-tab-scroll-container"
            className="flex items-center gap-1.5 overflow-x-auto py-1 scroll-smooth scrollbar-none flex-1"
          >
            {[
              { id: 'product_prices', label: 'Bảng Giá SKU', icon: Tag, badge: null },
              { id: 'price_lists', label: 'Danh Mục Bảng Giá', icon: Layers, badge: totalLists },
              { id: 'pricing_rules', label: 'Quy Tắc Markup / Margin', icon: Sliders, badge: null },
              { id: 'customer_pricing', label: 'Hợp Đồng Khách Hàng', icon: UserCheck, badge: null },
              { id: 'quantity_pricing', label: 'Bậc Thang Số Lượng', icon: Package, badge: null },
              { id: 'promotions', label: 'Khuyến Mãi Có Hạn', icon: Clock, badge: promotions.filter(p => p.isActive).length },
              { id: 'bulk_pricing', label: 'Tính Giá Hàng Loạt', icon: Sparkles, badge: null },
              { id: 'approvals', label: 'Phê Duyệt (Maker-Checker)', icon: ShieldCheck, badge: pendingApprovalsCount, badgeColor: 'bg-amber-500 text-white' },
              { id: 'history_audit', label: 'Lịch Sử & Audit Log', icon: History, badge: null },
              { id: 'simulator', label: 'Dò Giá Waterfall', icon: Calculator, badge: '6 BẬC', badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200 font-bold' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    const btn = document.getElementById(`tab-btn-${tab.id}`);
                    btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== null && tab.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        tab.badgeColor || (isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200')
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Scroll Right Button */}
          <button
            onClick={() => {
              const el = document.getElementById('pricing-tab-scroll-container');
              if (el) el.scrollBy({ left: 200, behavior: 'smooth' });
            }}
            className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors shrink-0 cursor-pointer"
            title="Cuộn sang phải"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'product_prices' && (
        <ProductPricesTab
          productPrices={productPrices}
          priceLists={priceLists}
          selectedPriceListId={selectedPriceListId}
          onOpenOverrideModal={(item) => setOverrideModalItem(item)}
          onSelectProductForDeepDive={(productId) => {
            setActiveTab('simulator');
          }}
          onOpenAddModal={() => setIsAddProductModalOpen(true)}
        />
      )}

      {activeTab === 'price_lists' && (
        <PriceListsTab
          priceLists={priceLists}
          onSelectPriceList={(pl) => {
            setSelectedPriceListId(pl.id);
            setActiveTab('product_prices');
          }}
          selectedPriceListId={selectedPriceListId}
          onAddNewPriceList={handleAddNewPriceList}
        />
      )}

      {activeTab === 'pricing_rules' && (
        <PricingRulesTab
          categoryRules={categoryRules}
          onUpdateRule={handleUpdateRule}
        />
      )}

      {activeTab === 'customer_pricing' && (
        <CustomerPricingTab
          customerPricingList={customerPricingList}
          onAddCustomerPrice={(newCP) => setCustomerPricingList(prev => [newCP, ...prev])}
        />
      )}

      {activeTab === 'quantity_pricing' && (
        <QuantityPricingTab
          quantityTiers={quantityTiers}
          onAddTier={(newTier) => setQuantityTiers(prev => [...prev, newTier])}
        />
      )}

      {activeTab === 'promotions' && (
        <PromotionsTab
          promotions={promotions}
          onAddPromotion={(newPromo) => setPromotions(prev => [newPromo, ...prev])}
        />
      )}

      {activeTab === 'bulk_pricing' && (
        <BulkPricingTab
          priceLists={priceLists}
          categoryRules={categoryRules}
          onCommitBulkPrices={(items) => {
            handleCommitBulkPrices(items);
            setActiveTab('product_prices');
          }}
          onSubmitApprovalRequests={(reqs) => {
            handleSubmitBulkApprovalRequests(reqs);
            setActiveTab('approvals');
          }}
        />
      )}

      {activeTab === 'approvals' && (
        <PriceApprovalTab
          approvalRequests={approvalRequests}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
        />
      )}

      {activeTab === 'history_audit' && (
        <PriceHistoryTab
          auditLogs={auditLogs}
        />
      )}

      {activeTab === 'simulator' && (
        <PricingAuditAndSimulatorTab
          onExecuteResolution={executePriceResolution}
        />
      )}

      {/* Controlled Manual Override Modal */}
      {overrideModalItem && (
        <ManualOverrideModal
          item={overrideModalItem}
          onClose={() => setOverrideModalItem(null)}
          onConfirmOverride={handleConfirmOverride}
        />
      )}

      {/* Inbound Cost Sync Modal */}
      <InboundReceivingModal
        isOpen={isInboundModalOpen}
        onClose={() => setIsInboundModalOpen(false)}
        onApplyNewInboundCost={handleApplyInboundCost}
      />

      {/* Add Product & Price Modal */}
      <AddProductPricingModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        priceLists={priceLists}
        onAddProductPrice={handleAddNewProductPrice}
      />
    </div>
  );
};
