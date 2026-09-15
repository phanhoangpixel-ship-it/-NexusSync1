import React, { useState } from 'react';
import { Search, Filter, Plus, Edit3, ShieldAlert, CheckCircle2, TrendingUp, AlertTriangle, ArrowRight, Tag, RefreshCw } from 'lucide-react';
import { ProductPriceItem, PriceList } from '../../../types/pricingManagement';
import { Pagination } from '../../common/Pagination';

interface ProductPricesTabProps {
  productPrices: ProductPriceItem[];
  priceLists: PriceList[];
  selectedPriceListId: string;
  onOpenOverrideModal: (item: ProductPriceItem) => void;
  onSelectProductForDeepDive: (productId: string) => void;
  onOpenAddModal?: () => void;
}

export const ProductPricesTab: React.FC<ProductPricesTabProps> = ({
  productPrices,
  priceLists,
  selectedPriceListId,
  onOpenOverrideModal,
  onSelectProductForDeepDive,
  onOpenAddModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priceListFilter, setPriceListFilter] = useState(selectedPriceListId || 'ALL');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredItems = productPrices.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesPriceList = priceListFilter === 'ALL' || item.priceListId === priceListFilter;
    return matchesSearch && matchesCategory && matchesPriceList;
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Informative Domain Authority Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 p-4 rounded-xl border border-blue-200/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-lg font-bold text-xs shadow-xs">
            PRICING AUTHORITY
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Quy tắc phân định thẩm quyền giá bán:</p>
            <p className="text-slate-600 dark:text-slate-300">
              Giá vốn (Cost Basis) được cung cấp tự động từ <strong>Costing Engine</strong>. Product Pricing chỉ sở hữu thiết lập giá bán, thặng dư Markup, biên lợi nhuận Target Margin và phân cấp bảng giá.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Đạt Margin chuẩn (≥15%)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Manual Override</span>
        </div>
      </div>

      {/* Action and Filter bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, SKU (VD: RAM-16GB)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={priceListFilter}
            onChange={(e) => {
              setPriceListFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Tất cả bảng giá</option>
            {priceLists.map(pl => (
              <option key={pl.id} value={pl.id}>{pl.name} ({pl.code})</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="RAM">RAM</option>
            <option value="SSD">SSD</option>
            <option value="CPU">CPU</option>
            <option value="Accessory">Accessory</option>
          </select>
        </div>

        {onOpenAddModal && (
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Khai Báo Sản Phẩm & Giá Mới
          </button>
        )}
      </div>

      {/* Table of Product Prices with Pagination */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Sản Phẩm & SKU</th>
                <th className="py-3.5 px-3">Bảng Giá & UOM</th>
                <th className="py-3.5 px-3 text-right">Giá Vốn (Costing)</th>
                <th className="py-3.5 px-3 text-center">Quy Tắc Định Giá</th>
                <th className="py-3.5 px-3 text-right font-bold text-indigo-900 dark:text-indigo-200">Giá Bán Niêm Yết</th>
                <th className="py-3.5 px-3 text-right">Biên LN (Margin)</th>
                <th className="py-3.5 px-3 text-center">Hiệu Lực</th>
                <th className="py-3.5 px-3 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
              {paginatedItems.map((item) => {
                const isBelowMin = item.actualMarginPercent < item.minMarginPercent;
                return (
                  <tr key={item.id} className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{item.productName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">{item.sku}</span>
                        <span className="text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-medium">
                          {item.category}
                        </span>
                        {item.uomConversionFactor && (
                          <span className="text-[11px] px-1.5 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 font-medium rounded border border-purple-200 dark:border-purple-700">
                            1 Thùng = {item.uomConversionFactor} Cái
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">{item.priceListName}</div>
                      <div className="text-xs text-slate-400">ĐVT: {item.uom}</div>
                    </td>

                    <td className="py-3.5 px-3 font-mono tabular-nums font-bold text-right text-slate-600 dark:text-slate-300 text-xs">
                      {formatVND(item.costBasis)}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {item.ruleApplied === 'MARKUP' && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 rounded font-bold border border-emerald-300 dark:border-emerald-700">
                          Markup +{item.markupPercent}%
                        </span>
                      )}
                      {item.ruleApplied === 'CATEGORY_RULE' && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-200 rounded font-bold border border-blue-300 dark:border-blue-700">
                          Category Rule (+{item.markupPercent}%)
                        </span>
                      )}
                      {item.isOverride && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-amber-100 text-amber-950 dark:bg-amber-950/90 dark:text-amber-200 rounded font-bold border border-amber-300 dark:border-amber-700 mt-1 block">
                          Manual Override
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 font-mono tabular-nums font-bold text-right text-indigo-700 dark:text-indigo-300 text-sm">
                      {formatVND(item.finalPrice)}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <span className={`inline-block font-mono tabular-nums font-bold px-2 py-0.5 rounded text-xs border ${
                        isBelowMin
                          ? 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700'
                          : 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                      }`}>
                        {item.actualMarginPercent.toFixed(2)}%
                      </span>
                      {isBelowMin && (
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold flex items-center justify-end gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3" /> Dưới Min {item.minMarginPercent}%
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {item.effectiveFrom}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 text-xs font-bold rounded-full">
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenOverrideModal(item)}
                          className="px-2.5 py-1 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 rounded-md border border-amber-300 transition-colors cursor-pointer"
                          title="Ghi đè giá thủ công có kiểm soát và lưu vết audit"
                        >
                          Override
                        </button>
                        <button
                          onClick={() => onSelectProductForDeepDive(item.productId)}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-950 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950/90 dark:text-indigo-200 dark:border-indigo-700 rounded-md border border-indigo-300 transition-colors cursor-pointer"
                          title="Xem phân giải chi tiết"
                        >
                          Chi Tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Control */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
};

