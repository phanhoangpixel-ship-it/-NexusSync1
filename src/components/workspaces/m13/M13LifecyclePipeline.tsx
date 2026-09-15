import React from 'react';
import {
  ShoppingCart,
  Receipt,
  Percent,
  Boxes,
  Truck,
  BarChart3,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface M13LifecyclePipelineProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  ordersCount: number;
  vatCount: number;
  reservedCount: number;
  fulfillmentCount: number;
}

export const M13LifecyclePipeline: React.FC<M13LifecyclePipelineProps> = ({
  activeTab,
  onSelectTab,
  ordersCount,
  vatCount,
  reservedCount,
  fulfillmentCount,
}) => {
  const steps = [
    {
      key: 'orders',
      title: '1. Đơn Hàng SO',
      desc: 'Xác lập & kiểm tra tín dụng',
      icon: ShoppingCart,
      count: ordersCount,
      color: 'blue',
    },
    {
      key: 'vat-invoices',
      title: '2. Hóa Đơn VAT',
      desc: 'Ký số HSM & mã CQT NĐ123',
      icon: Receipt,
      count: vatCount,
      color: 'purple',
    },
    {
      key: 'discounts',
      title: '3. Chiết Khấu Động',
      desc: 'Ma trận giá VIP / Volume',
      icon: Percent,
      count: null,
      color: 'indigo',
    },
    {
      key: 'reservation',
      title: '4. Giữ Chỗ Tồn Kho',
      desc: 'Phân bổ ATP (M07/M17)',
      icon: Boxes,
      count: reservedCount,
      color: 'amber',
    },
    {
      key: 'fulfillment',
      title: '5. Xuất Kho WMS',
      desc: 'Pick, Pack & Goods Issue',
      icon: Truck,
      count: fulfillmentCount,
      color: 'emerald',
    },
    {
      key: 'analytics',
      title: '6. Phân Tích & Thuế',
      desc: 'Báo cáo doanh số & TK 33311',
      icon: BarChart3,
      count: null,
      color: 'sky',
    },
    {
      key: 'test-runner',
      title: '7. Kiểm Thử Task',
      desc: 'Bàn chạy 5 kịch bản O2C',
      icon: Sparkles,
      count: '5/5',
      color: 'rose',
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Chu Trình Vòng Đời Bán Hàng & Hóa Đơn VAT (Order-to-Cash LifeCycle)
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          7 Giai Đoạn Nghiệp Vụ Tích Hợp
        </span>
      </div>

      {/* Responsive Lifecycle Tabs Grid matching M12 pattern */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = activeTab === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelectTab(s.key)}
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                isActive
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-slate-100/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-mono tabular-nums font-bold ${
                        isActive
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      BƯỚC 0{idx + 1}
                    </span>
                  </div>
                  {s.count !== null && (
                    <span
                      className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {s.count}
                    </span>
                  )}
                </div>

                <div
                  className={`text-xs font-bold leading-tight ${
                    isActive
                      ? 'text-blue-900 dark:text-blue-100'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {s.title}
                </div>
                <div
                  className={`text-[10px] mt-0.5 leading-snug line-clamp-1 font-medium ${
                    isActive
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {s.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
