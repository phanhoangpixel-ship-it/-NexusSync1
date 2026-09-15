import React, { useState, useRef } from 'react';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Send,
  DollarSign,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Trash2,
  Search,
  Filter,
  CheckSquare,
  Square,
  Sliders,
  TrendingUp,
  FileText,
  Plus,
  HelpCircle
} from 'lucide-react';
import { PriceList, CategoryPricingRule, ProductPriceItem, PriceApprovalRequest } from '../../../../types/pricingManagement';
import { calculateMarkupPrice, calculateMarginPrice, calculateActualMargin, calculateActualMarkup, checkMinimumMargin } from '../utils/pricingMath';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';

interface BulkUploadItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  uom: string;
  costBasis: number;
  ruleType: 'CATEGORY_RULE' | 'MARKUP' | 'TARGET_MARGIN';
  ruleValue: number;
  calculatedPrice: number;
  adjustedPrice: number;
  actualMargin: number;
  isBelowMinMargin: boolean;
  minMargin: number;
  selected: boolean;
  notes?: string;
}

interface BulkPricingTabProps {
  priceLists?: PriceList[];
  categoryRules?: CategoryPricingRule[];
  onCommitBulkPrices?: (items: ProductPriceItem[]) => void;
  onSubmitApprovalRequests?: (requests: PriceApprovalRequest[]) => void;
}

const SAMPLE_DATASETS: Record<string, { sku: string; name: string; category: string; uom: string; costBasis: number }[]> = {
  pc_components: [
    { sku: 'RAM-16GB-D5-KG', name: 'RAM Kingston Fury Beast 16GB DDR5 5600MHz', category: 'RAM', uom: 'Cây', costBasis: 450000 },
    { sku: 'RAM-32GB-D5-CS', name: 'RAM Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz', category: 'RAM', uom: 'Bộ', costBasis: 920000 },
    { sku: 'SSD-1TB-990PRO', name: 'SSD Samsung 990 Pro 1TB PCIe 4.0 NVMe M.2', category: 'SSD', uom: 'Cái', costBasis: 1250000 },
    { sku: 'SSD-2TB-KC3000', name: 'SSD Kingston KC3000 2TB PCIe 4.0 NVMe M.2', category: 'SSD', uom: 'Cái', costBasis: 2150000 },
    { sku: 'CPU-I7-14700K', name: 'CPU Intel Core i7 14700K (Up to 5.6GHz, 20 Nhân 28 Luồng)', category: 'CPU', uom: 'Cái', costBasis: 3600000 },
    { sku: 'CPU-R7-7800X3D', name: 'CPU AMD Ryzen 7 7800X3D (Up to 5.0GHz, 8 Nhân 16 Luồng)', category: 'CPU', uom: 'Cái', costBasis: 4100000 },
    { sku: 'MB-B760-TUF', name: 'Mainboard ASUS TUF GAMING B760-PLUS WIFI DDR5', category: 'Mainboard', uom: 'Cái', costBasis: 1850000 },
    { sku: 'MB-Z790-AORUS', name: 'Mainboard GIGABYTE Z790 AORUS ELITE AX', category: 'Mainboard', uom: 'Cái', costBasis: 2950000 },
    { sku: 'VGA-RTX4070S', name: 'Card Màn Hình ASUS Dual GeForce RTX 4070 SUPER 12GB', category: 'VGA', uom: 'Cái', costBasis: 6800000 },
    { sku: 'VGA-RTX4080S', name: 'Card Màn Hình MSI GeForce RTX 4080 SUPER Gaming X Slim', category: 'VGA', uom: 'Cái', costBasis: 13500000 },
    { sku: 'ACC-CABLE-DP', name: 'Cáp DisplayPort 1.4 8K 60Hz Ugreen 2M', category: 'Accessory', uom: 'Sợi', costBasis: 65000 },
    { sku: 'ACC-PASTE-TF8', name: 'Keo tản nhiệt Thermalright TF8 5.8g Extreme', category: 'Accessory', uom: 'Tuýp', costBasis: 95000 }
  ],
  accessories_batch: [
    { sku: 'ACC-MOUSE-G102', name: 'Chuột Gaming Logitech G102 Gen2 Lightsync', category: 'Accessory', uom: 'Cái', costBasis: 180000 },
    { sku: 'ACC-KB-K68', name: 'Bàn phím cơ không dây Redragon K68 RGB', category: 'Accessory', uom: 'Cái', costBasis: 420000 },
    { sku: 'ACC-HS-H390', name: 'Tai nghe chụp tai USB Logitech H390 đàm thoại', category: 'Accessory', uom: 'Cái', costBasis: 260000 },
    { sku: 'ACC-HUB-7IN1', name: 'Hub chuyển đổi đa năng Type-C 7 in 1 HDMI 4K', category: 'Accessory', uom: 'Cái', costBasis: 310000 }
  ]
};

export const BulkPricingTab: React.FC<BulkPricingTabProps> = ({
  priceLists = [],
  categoryRules = [],
  onCommitBulkPrices,
  onSubmitApprovalRequests
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Target Price List Selection
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>(
    priceLists[0]?.id || 'PL-001'
  );

  // Calculation Settings
  const [calculationMode, setCalculationMode] = useState<'CATEGORY_RULE' | 'UNIFORM_MARKUP' | 'UNIFORM_MARGIN'>('CATEGORY_RULE');
  const [uniformMarkup, setUniformMarkup] = useState<number>(40);
  const [uniformMargin, setUniformMargin] = useState<number>(30);
  const [roundingMode, setRoundingMode] = useState<'NEAREST_1000' | 'NEAREST_100' | 'EXACT'>('NEAREST_1000');
  const [minMarginThreshold, setMinMarginThreshold] = useState<number>(15);

  // Batch Items
  const [items, setItems] = useState<BulkUploadItem[]>(() => {
    return SAMPLE_DATASETS.pc_components.map((p, idx) => {
      const defaultRule = categoryRules.find(r => r.category.toLowerCase() === p.category.toLowerCase());
      const markupVal = defaultRule ? defaultRule.ruleValue : 40;
      const calcPrice = calculateMarkupPrice(p.costBasis, markupVal, 'NEAREST_1000');
      const margin = calculateActualMargin(p.costBasis, calcPrice);
      return {
        id: `BULK-${idx + 1}`,
        sku: p.sku,
        name: p.name,
        category: p.category,
        uom: p.uom,
        costBasis: p.costBasis,
        ruleType: 'CATEGORY_RULE',
        ruleValue: markupVal,
        calculatedPrice: calcPrice,
        adjustedPrice: calcPrice,
        actualMargin: margin,
        isBelowMinMargin: margin < 15,
        minMargin: 15,
        selected: true
      };
    });
  });

  // Table Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SAFE' | 'WARNING'>('ALL');
  const [isDragOver, setIsDragOver] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'warning' | 'info'; message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const selectedPriceList = priceLists.find(pl => pl.id === selectedPriceListId) || {
    id: 'PL-001',
    code: 'RETAIL-STD',
    name: 'Bảng Giá Bán Lẻ Tiêu Chuẩn'
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const showNotification = (type: 'success' | 'warning' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const computeItemPricing = (
    cost: number,
    category: string,
    mode: 'CATEGORY_RULE' | 'UNIFORM_MARKUP' | 'UNIFORM_MARGIN',
    uMarkup: number,
    uMargin: number,
    rounding: 'NEAREST_1000' | 'NEAREST_100' | 'EXACT'
  ) => {
    let ruleType: 'CATEGORY_RULE' | 'MARKUP' | 'TARGET_MARGIN' = 'CATEGORY_RULE';
    let ruleVal = 0;
    let price = 0;

    if (mode === 'CATEGORY_RULE') {
      const catRule = categoryRules.find(r => r.category.toLowerCase() === category.toLowerCase());
      if (catRule) {
        ruleVal = catRule.ruleValue;
        if (catRule.ruleType === 'MARKUP') {
          ruleType = 'MARKUP';
          price = calculateMarkupPrice(cost, ruleVal, rounding);
        } else {
          ruleType = 'TARGET_MARGIN';
          price = calculateMarginPrice(cost, ruleVal, rounding);
        }
      } else {
        ruleType = 'MARKUP';
        ruleVal = 40;
        price = calculateMarkupPrice(cost, 40, rounding);
      }
    } else if (mode === 'UNIFORM_MARKUP') {
      ruleType = 'MARKUP';
      ruleVal = uMarkup;
      price = calculateMarkupPrice(cost, uMarkup, rounding);
    } else {
      ruleType = 'TARGET_MARGIN';
      ruleVal = uMargin;
      price = calculateMarginPrice(cost, uMargin, rounding);
    }

    const margin = (cost > 0 && price > 0) ? calculateActualMargin(cost, price) : 0;
    const isBelow = margin < minMarginThreshold;

    return {
      ruleType,
      ruleValue: ruleVal,
      calculatedPrice: price,
      adjustedPrice: price,
      actualMargin: margin,
      isBelowMinMargin: isBelow
    };
  };

  const handleRunPricingEngine = () => {
    setItems(prev => prev.map(item => {
      const computed = computeItemPricing(
        item.costBasis,
        item.category,
        calculationMode,
        uniformMarkup,
        uniformMargin,
        roundingMode
      );
      return {
        ...item,
        ruleType: computed.ruleType,
        ruleValue: computed.ruleValue,
        calculatedPrice: computed.calculatedPrice,
        adjustedPrice: computed.adjustedPrice,
        actualMargin: computed.actualMargin,
        isBelowMinMargin: computed.isBelowMinMargin
      };
    }));

    showNotification('success', `Đã tự động tính lại giá bán cho ${items.length} sản phẩm theo quy tắc mới!`);
  };

  const handleAdjustPrice = (id: string, newPriceNum: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const newMargin = (item.costBasis > 0 && newPriceNum > 0) ? calculateActualMargin(item.costBasis, newPriceNum) : 0;
      const isBelow = newMargin < minMarginThreshold;
      return {
        ...item,
        adjustedPrice: newPriceNum,
        actualMargin: newMargin,
        isBelowMinMargin: isBelow
      };
    }));
  };

  const handleQuickAdjustPercent = (percentDelta: number) => {
    setItems(prev => prev.map(item => {
      if (!item.selected) return item;
      const newPrice = Math.round((item.adjustedPrice * (1 + percentDelta / 100)) / 1000) * 1000;
      const newMargin = (item.costBasis > 0 && newPrice > 0) ? calculateActualMargin(item.costBasis, newPrice) : 0;
      return {
        ...item,
        adjustedPrice: newPrice,
        actualMargin: newMargin,
        isBelowMinMargin: newMargin < minMarginThreshold
      };
    }));
    showNotification('success', `Đã điều chỉnh ${percentDelta > 0 ? '+' : ''}${percentDelta}% cho các SKU đã chọn.`);
  };

  const handleToggleSelect = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  };

  const handleToggleAll = (select: boolean) => {
    setItems(prev => prev.map(i => ({ ...i, selected: select })));
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || item.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'SAFE' && !item.isBelowMinMargin) || (statusFilter === 'WARNING' && item.isBelowMinMargin);
    return matchesSearch && matchesCat && matchesStatus;
  });

  const selectedCount = items.filter(i => i.selected).length;
  const warningCount = items.filter(i => i.isBelowMinMargin).length;
  const totalItemsCount = items.length;

  const handleCommitDirect = () => {
    const selectedItems = items.filter(i => i.selected);
    if (selectedItems.length === 0) {
      showNotification('warning', 'Vui lòng chọn ít nhất một sản phẩm để áp dụng trực tiếp!');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Áp Dụng Giá Hàng Loạt',
      message: `Bạn chuẩn bị ghi đè trực tiếp giá bán cho ${selectedItems.length} SKU vào bảng giá "${selectedPriceList.name}". Hành động này có hiệu lực ngay lập tức.`,
      confirmText: 'Đồng ý cập nhật',
      variant: 'default',
      onConfirm: () => {
        const payload: ProductPriceItem[] = selectedItems.map(si => ({
          id: `PPI-${Date.now()}-${si.sku}`,
          productId: si.sku,
          productName: si.name,
          sku: si.sku,
          uom: si.uom,
          costBasis: si.costBasis,
          standardPrice: si.adjustedPrice,
          marginPercent: si.actualMargin,
          effectiveFrom: new Date().toISOString().substring(0, 10),
          effectiveTo: '2026-12-31',
          status: 'ACTIVE'
        }));

        if (onCommitBulkPrices) {
          onCommitBulkPrices(payload);
        }
        showNotification('success', `Đã cập nhật thành công ${selectedItems.length} sản phẩm vào ${selectedPriceList.name}!`);
      }
    });
  };

  const handleSubmitApproval = () => {
    const selectedItems = items.filter(i => i.selected);
    if (selectedItems.length === 0) {
      showNotification('warning', 'Vui lòng chọn ít nhất một sản phẩm để gửi duyệt!');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Gửi Duyệt Maker-Checker Hàng Loạt',
      message: `Tạo yêu cầu phê duyệt giá cho ${selectedItems.length} SKU gửi tới cấp quản lý (CFO / Checker).`,
      confirmText: 'Gửi Duyệt',
      variant: 'default',
      onConfirm: () => {
        const approvalReqs: PriceApprovalRequest[] = selectedItems.map((si, idx) => ({
          id: `REQ-BULK-${Date.now()}-${idx}`,
          requestNumber: `REQ-2026-${Math.floor(100 + Math.random() * 900)}`,
          priceListId: selectedPriceListId,
          priceListName: selectedPriceList.name,
          productId: si.sku,
          productName: si.name,
          sku: si.sku,
          uom: si.uom,
          costBasis: si.costBasis,
          oldPrice: si.calculatedPrice,
          newPrice: si.adjustedPrice,
          oldMarginPercent: 25,
          newMarginPercent: si.actualMargin,
          requester: 'Hoàng Nam (Admin)',
          requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'PENDING_APPROVAL',
          reason: 'Điều chỉnh giá hàng loạt theo chiến dịch Q3/2026'
        }));

        if (onSubmitApprovalRequests) {
          onSubmitApprovalRequests(approvalReqs);
        }
        showNotification('success', `Đã gửi thành công ${selectedItems.length} yêu cầu phê duyệt giá đến cấp quản lý!`);
      }
    });
  };

  const handleLoadSample = (key: string) => {
    const dataset = SAMPLE_DATASETS[key];
    if (!dataset) return;
    const newItems: BulkUploadItem[] = dataset.map((p, idx) => {
      const computed = computeItemPricing(p.costBasis, p.category, calculationMode, uniformMarkup, uniformMargin, roundingMode);
      return {
        id: `BULK-SAMPLE-${idx + 1}`,
        sku: p.sku,
        name: p.name,
        category: p.category,
        uom: p.uom,
        costBasis: p.costBasis,
        ruleType: computed.ruleType,
        ruleValue: computed.ruleValue,
        calculatedPrice: computed.calculatedPrice,
        adjustedPrice: computed.adjustedPrice,
        actualMargin: computed.actualMargin,
        isBelowMinMargin: computed.isBelowMinMargin,
        minMargin: minMarginThreshold,
        selected: true
      };
    });
    setItems(newItems);
    showNotification('success', `Đã nạp bộ dữ liệu mẫu (${newItems.length} sản phẩm) thành công!`);
  };

  return (
    <div className="space-y-6">
      {/* Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-xl border text-xs font-semibold shadow-md flex items-center justify-between transition-all ${
          notification.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' :
          notification.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200' :
          'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Top Configuration Dashboard for Bulk Calculation */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Công Cụ Tính Toán & Định Giá Hàng Loạt (Bulk Pricing Engine)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Nhập khẩu từ Excel/CSV hoặc chọn bộ dữ liệu mẫu, áp dụng quy tắc danh mục tự động hoặc thặng dư đồng nhất, kiểm tra ngưỡng biên an toàn trước khi cập nhật.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPriceListId}
              onChange={(e) => setSelectedPriceListId(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
            >
              {priceLists.map(pl => (
                <option key={pl.id} value={pl.id}>Bảng giá đích: {pl.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Engine Parameters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phương Pháp Tính Giá</label>
            <select
              value={calculationMode}
              onChange={(e) => setCalculationMode(e.target.value as any)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-none"
            >
              <option value="CATEGORY_RULE">Theo quy tắc danh mục chuẩn</option>
              <option value="UNIFORM_MARKUP">Đồng nhất Markup (%)</option>
              <option value="UNIFORM_MARGIN">Đồng nhất Target Margin (%)</option>
            </select>
          </div>

          {calculationMode === 'UNIFORM_MARKUP' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tỷ Lệ Markup Đồng Nhất (%)</label>
              <input
                type="number"
                value={uniformMarkup}
                onChange={(e) => setUniformMarkup(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-none"
              />
            </div>
          )}

          {calculationMode === 'UNIFORM_MARGIN' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Biên Mục Tiêu Đồng Nhất (%)</label>
              <input
                type="number"
                value={uniformMargin}
                onChange={(e) => setUniformMargin(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Quy Tắc Làm Tròn</label>
            <select
              value={roundingMode}
              onChange={(e) => setRoundingMode(e.target.value as any)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-none"
            >
              <option value="NEAREST_1000">Làm tròn đến 1.000₫</option>
              <option value="NEAREST_100">Làm tròn đến 100₫</option>
              <option value="EXACT">Giữ nguyên (Exact)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngưỡng Sàn Cảnh Báo Margin (%)</label>
            <input
              type="number"
              value={minMarginThreshold}
              onChange={(e) => setMinMarginThreshold(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunPricingEngine}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Chạy Tính Toán Lại
            </button>
          </div>
        </div>

        {/* Quick sample datasets loader */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Nạp bộ dữ liệu mẫu nhanh:</span>
          <button
            onClick={() => handleLoadSample('pc_components')}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-medium cursor-pointer"
          >
            Linh kiện PC & Gaming (12 SKUs)
          </button>
          <button
            onClick={() => handleLoadSample('accessories_batch')}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-medium cursor-pointer"
          >
            Phụ kiện văn phòng (4 SKUs)
          </button>
        </div>
      </div>

      {/* Main Items Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 w-full">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên sản phẩm hoặc SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái biên ({items.length})</option>
              <option value="SAFE">An toàn ({items.filter(i => !i.isBelowMinMargin).length})</option>
              <option value="WARNING">Cảnh báo dưới sàn ({warningCount})</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuickAdjustPercent(5)}
              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 cursor-pointer"
            >
              +5% Các dòng chọn
            </button>
            <button
              onClick={() => handleQuickAdjustPercent(-5)}
              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-semibold hover:bg-rose-100 cursor-pointer"
            >
              -5% Các dòng chọn
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
              <tr>
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={selectedCount === totalItemsCount && totalItemsCount > 0}
                    onChange={(e) => handleToggleAll(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                </th>
                <th className="py-3 px-3">Sản Phẩm & SKU</th>
                <th className="py-3 px-3">Danh Mục</th>
                <th className="py-3 px-3 text-right">Giá Vốn (Cost)</th>
                <th className="py-3 px-3 text-center">Quy Tắc Áp Dụng</th>
                <th className="py-3 px-3 text-right">Giá Tính (Calc)</th>
                <th className="py-3 px-3 text-right">Giá Điều Chỉnh (Adjusted)</th>
                <th className="py-3 px-3 text-right">Lợi Nhuận Gộp</th>
                <th className="py-3 px-3 text-right">Margin Thực</th>
                <th className="py-3 px-3 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-200 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-medium">
                    Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const profitUnit = item.adjustedPrice - item.costBasis;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/60 transition-colors ${
                        item.selected ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''
                      } ${item.isBelowMinMargin ? 'bg-rose-50/10 dark:bg-rose-950/20' : ''}`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded text-indigo-600 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">{item.name}</div>
                        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 font-bold">{item.sku}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded text-[10px]">
                            {item.category}
                          </span>
                          <span className="text-slate-400 text-[10px]">({item.uom})</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300 font-semibold">
                        {formatVND(item.costBasis)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          {item.ruleType === 'MARKUP' ? `+${item.ruleValue}%` : `${item.ruleValue}% M`}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-400 dark:text-slate-500">
                        {formatVND(item.calculatedPrice)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          step="1000"
                          value={item.adjustedPrice}
                          onChange={(e) => handleAdjustPrice(item.id, Number(e.target.value))}
                          className={`w-32 px-2.5 py-1 text-right bg-white dark:bg-slate-900 border rounded-lg font-mono font-bold text-xs focus:outline-none ${
                            item.adjustedPrice !== item.calculatedPrice
                              ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                              : 'text-indigo-900 dark:text-indigo-200 border-slate-300 dark:border-slate-700'
                          }`}
                        />
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-600 dark:text-slate-300">
                        <span className={profitUnit < 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                          {formatVND(profitUnit)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded border ${
                            item.isBelowMinMargin
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {item.actualMargin.toFixed(2)}%
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {item.isBelowMinMargin ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Dưới sàn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            An Toàn
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Action Bar at Bottom of Preview */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          <div className="text-slate-600 dark:text-slate-400">
            <span>Đang chọn <b>{selectedCount}</b> / {totalItemsCount} sản phẩm</span>
            <span className="mx-2">•</span>
            <button
              onClick={() => handleToggleAll(true)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
            >
              Chọn tất cả
            </button>
            <span className="mx-2">•</span>
            <button
              onClick={() => handleToggleAll(false)}
              className="text-slate-500 hover:underline cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  title: 'Làm trống bảng import',
                  message: 'Bạn có chắc chắn muốn xóa toàn bộ danh sách import hiện tại không?',
                  confirmText: 'Xóa tất cả',
                  variant: 'danger',
                  onConfirm: () => {
                    setItems([]);
                    showNotification('info', 'Đã làm trống danh sách import.');
                  }
                });
              }}
              className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Làm Trống Bảng
            </button>

            <button
              onClick={handleSubmitApproval}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Gửi Duyệt Maker-Checker ({selectedCount})
            </button>

            <button
              onClick={handleCommitDirect}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Áp Dụng Trực Tiếp ({selectedCount})
            </button>
          </div>
        </div>
      </div>
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};
