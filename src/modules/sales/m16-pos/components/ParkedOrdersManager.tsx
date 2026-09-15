import React from 'react';
import { PauseCircle, Plus, Trash2, Layers } from 'lucide-react';
import { formatVNDCurrency } from '../../../../utils/currencyFormatter';

export interface ParkedOrder {
  id: string;
  name: string;
  timestamp: string;
  cart: Array<{
    productId: number;
    sku: string;
    name: string;
    price: number;
    qty: number;
    discountPercent: number;
    stock: number;
    priceSource?: 'CONTRACT_PRICE' | 'PRICE_LIST' | 'BASE_PRICE';
  }>;
  customer: any | null;
  promoCode: string;
  discountPercent: number;
}

interface ParkedOrdersManagerProps {
  parkedOrders: ParkedOrder[];
  activeParkedId: string | null;
  onSelectMainCart: () => void;
  onSelectParkedOrder: (order: ParkedOrder) => void;
  onParkCurrentCart: () => void;
  onDeleteParkedOrder: (orderId: string) => void;
  currentCartItemCount: number;
}

export const ParkedOrdersManager: React.FC<ParkedOrdersManagerProps> = ({
  parkedOrders,
  activeParkedId,
  onSelectMainCart,
  onSelectParkedOrder,
  onParkCurrentCart,
  onDeleteParkedOrder,
  currentCartItemCount
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none mb-3 shrink-0">
      {/* Active / Current Order Tab */}
      <button
        type="button"
        onClick={onSelectMainCart}
        className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer border shrink-0 ${
          activeParkedId === null
            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>Đơn hiện tại</span>
        {currentCartItemCount > 0 && (
          <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
            activeParkedId === null
              ? 'bg-white text-blue-600'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200'
          }`}>
            {currentCartItemCount}
          </span>
        )}
      </button>

      {/* Parked Orders Tabs */}
      {parkedOrders.map((order, idx) => {
        const isSelected = activeParkedId === order.id;
        const totalItems = order.cart.reduce((s, i) => s + i.qty, 0);
        const totalVal = order.cart.reduce((s, i) => s + (i.price * i.qty), 0);

        return (
          <div
            key={order.id}
            className={`min-h-[38px] flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-xl font-medium border transition-all shrink-0 ${
              isSelected
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800 hover:bg-amber-100/80'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectParkedOrder(order)}
              className="flex items-center gap-1.5 text-left cursor-pointer"
            >
              <PauseCircle className="w-3.5 h-3.5 shrink-0" />
              <div>
                <div className="font-bold text-[11px] leading-tight flex items-center gap-1">
                  <span>{order.name || `Đơn #${idx + 1}`}</span>
                  <span className={`px-1 rounded-full font-mono text-[9px] font-bold ${
                    isSelected ? 'bg-amber-700 text-white' : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
                  }`}>
                    {totalItems} món
                  </span>
                </div>
                <div className="text-[10px] opacity-85 font-mono tabular-nums leading-tight">
                  {formatVNDCurrency(totalVal)}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteParkedOrder(order.id);
              }}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isSelected
                  ? 'hover:bg-amber-600 text-white'
                  : 'text-amber-700 dark:text-amber-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50'
              }`}
              title="Hủy đơn treo này"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      {/* Button Park Current Order (F7) */}
      {currentCartItemCount > 0 && parkedOrders.length < 5 && (
        <button
          type="button"
          onClick={onParkCurrentCart}
          className="min-h-[38px] px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          title="Treo đơn hiện tại để phục vụ khách khác (F7)"
        >
          <PauseCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>+ Treo đơn (F7)</span>
        </button>
      )}
    </div>
  );
};

