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
  CheckCircle2,
  Clock,
  Layers,
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
  // Chronological 7-Stage Enterprise Order-to-Cash (O2C) Lifecycle Pipeline
  const steps = [
    {
      key: 'orders',
      stepNum: '01',
      title: 'Đơn Hàng SO',
      sub: 'Tiếp Nhận & Tín Dụng',
      desc: 'Master Data M07 & Credit Limit',
      icon: ShoppingCart,
      count: ordersCount,
      semanticColor: 'blue',
      badgeClass: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    },
    {
      key: 'discounts',
      stepNum: '02',
      title: 'Chiết Khấu Động',
      sub: 'Định Giá M41',
      desc: 'Ma trận giá VIP / Volume Rule',
      icon: Percent,
      count: null,
      semanticColor: 'indigo',
      badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    },
    {
      key: 'reservation',
      stepNum: '03',
      title: 'Giữ Chỗ Tồn Kho',
      sub: 'Phân Bổ ATP M17',
      desc: 'Khóa stockReserved, ngừa oversell',
      icon: Boxes,
      count: reservedCount,
      semanticColor: 'amber',
      badgeClass: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    },
    {
      key: 'fulfillment',
      stepNum: '04',
      title: 'Xuất Kho WMS',
      sub: 'Goods Issue & COGS',
      desc: 'Pick, Pack, PXK & M42 Costing',
      icon: Truck,
      count: fulfillmentCount,
      semanticColor: 'emerald',
      badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    },
    {
      key: 'vat-invoices',
      stepNum: '05',
      title: 'Hóa Đơn VAT',
      sub: 'Nghị Định 123/2020',
      desc: 'Ký số HSM & cấp mã CQT',
      icon: Receipt,
      count: vatCount,
      semanticColor: 'purple',
      badgeClass: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    },
    {
      key: 'analytics',
      stepNum: '06',
      title: 'Sổ Cái & Phân Tích',
      sub: 'Doanh Thu & VAS GL',
      desc: 'Định khoản TK 131/511/33311',
      icon: BarChart3,
      count: null,
      semanticColor: 'sky',
      badgeClass: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    },
    {
      key: 'test-runner',
      stepNum: '07',
      title: 'Kiểm Thử Task',
      sub: 'Kịch Bản O2C E2E',
      desc: 'Bàn chạy 5 kịch bản tự động',
      icon: Sparkles,
      count: '5/5',
      semanticColor: 'rose',
      badgeClass: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    },
  ];

  const activeIndex = steps.findIndex((s) => s.key === activeTab);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
      {/* Top Banner: Pipeline Identity & Progress Tracker */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Chu Trình Vòng Đời Bán Hàng Doanh Nghiệp (Order-to-Cash LifeCycle)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Phase 9 Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Quy trình 7 bước tích hợp: Master Data M07 → Tín Dụng → Giá M41 → Tồn Kho M17 → WMS M24 → VAT NĐ123 → Sổ Cái M30
            </p>
          </div>
        </div>

        {/* Global Progress Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Giai Đoạn Đang Chọn
            </span>
            <span className="text-xs font-mono tabular-nums font-bold text-blue-700 dark:text-blue-400">
              Bước 0{activeIndex + 1} / 07
            </span>
          </div>
          <div className="w-24 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.round(((activeIndex + 1) / 7) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 7-Step Interactive Pipeline Flow with Connected Visual Arrows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = activeTab === s.key;
          const isPassed = activeIndex > idx;

          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelectTab(s.key)}
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
                isActive
                  ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-400 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100/80'
              }`}
            >
              <div>
                {/* Header: Step Number & Metric Count */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isPassed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Icon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-mono tabular-nums font-bold ${
                        isActive
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      BƯỚC {s.stepNum}
                    </span>
                  </div>

                  {s.count !== null && (
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono tabular-nums font-bold text-[9px] border ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-700'
                          : s.badgeClass
                      }`}
                    >
                      {s.count}
                    </span>
                  )}
                </div>

                {/* Step Main Title & Subtitle */}
                <div
                  className={`text-xs font-bold leading-tight ${
                    isActive
                      ? 'text-blue-950 dark:text-blue-100'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {s.title}
                </div>
                <div
                  className={`text-[10px] font-semibold mt-0.5 ${
                    isActive
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {s.sub}
                </div>
                <div
                  className={`text-[10px] mt-1 leading-snug line-clamp-1 ${
                    isActive
                      ? 'text-blue-600/90 dark:text-blue-300/80 font-medium'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {s.desc}
                </div>
              </div>

              {/* Active Sub-bar Indicator */}
              <div className="mt-2.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                <span
                  className={`text-[9px] font-mono uppercase font-bold ${
                    isActive
                      ? 'text-blue-700 dark:text-blue-300'
                      : isPassed
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {isActive ? 'ĐANG XEM' : isPassed ? 'HOÀN TẤT' : 'TIẾP THEO'}
                </span>
                <ChevronRight
                  className={`w-3 h-3 transition-transform group-hover:translate-x-0.5 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-400'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

