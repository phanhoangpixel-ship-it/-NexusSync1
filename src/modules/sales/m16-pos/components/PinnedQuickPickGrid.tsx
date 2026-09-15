import React from 'react';
import { Plus, Zap } from 'lucide-react';
import { formatVNDCurrency } from '../../../../utils/currencyFormatter';

interface PinnedQuickPickGridProps {
  products: any[];
  onAddToCart: (product: any) => void;
}

export const PinnedQuickPickGrid: React.FC<PinnedQuickPickGridProps> = ({
  products,
  onAddToCart
}) => {
  // Select top 6 products as quick-pick bestsellers
  const pinnedItems = products.slice(0, 6);

  if (pinnedItems.length === 0) return null;

  return (
    <div className="bg-slate-100/90 dark:bg-slate-800/60 p-3 rounded-2xl border-0 shadow-none mb-4">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Bán chạy / Ghim nhanh (Quick-Pick)</span>
        </div>
        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
          1-Click thêm ngay
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {pinnedItems.map((p) => {
          const price = p.retailPrice ?? p.price ?? 150000;
          const stock = p.stockAvailable ?? p.stockPhysical ?? p.stockQuantity ?? 50;

          return (
            <button
              key={`pinned-${p.id}`}
              type="button"
              onClick={() => onAddToCart(p)}
              className="min-h-[44px] p-2 bg-white dark:bg-slate-700/80 hover:bg-blue-50/90 dark:hover:bg-slate-600 border-0 rounded-xl text-left transition-all shadow-2xs group flex flex-col justify-between cursor-pointer"
            >
              <div className="w-full">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="truncate max-w-[65px] font-bold text-slate-700 dark:text-slate-300">{p.sku ?? `SKU-${p.id}`}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stock} tồn</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {p.name}
                </div>
              </div>

              <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100 dark:border-slate-600/60">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                  {formatVNDCurrency(price)}
                </span>
                <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Plus className="w-3 h-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

