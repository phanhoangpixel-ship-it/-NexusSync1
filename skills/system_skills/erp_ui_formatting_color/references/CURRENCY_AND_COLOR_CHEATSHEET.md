# Bảng Tra Cứu Nhanh (Cheatsheet) — UI Layout, Tiền Tệ & Màu Sắc ERP

## 1. Mẫu Code Tab Bar Cuộn Ngang Chuẩn Chống Tràn
```tsx
import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const EnterpriseTabBar: React.FC<{
  tabs: { id: string; label: string; icon: React.ReactNode; count?: number }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}> = ({ tabs, activeTab, onTabChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center gap-1">
      <button
        type="button"
        onClick={() => scroll('left')}
        title="Cuộn sang trái"
        className="shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex items-center justify-center cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div
        ref={containerRef}
        className="flex items-center gap-1.5 overflow-x-auto scroll-smooth no-scrollbar flex-1 py-0.5"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="shrink-0">{tab.icon}</span>
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => scroll('right')}
        title="Cuộn sang phải"
        className="shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex items-center justify-center cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
```

## 2. Bảng Tra Cứu Nhanh Status Badge (Tailwind CSS)

| Loại trạng thái | Mã Tailwind hoàn chỉnh |
|---|---|
| **Hoàn thành / Hợp lệ** | `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800` |
| **Đang xử lý / Cảnh báo** | `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800` |
| **Thất bại / Hủy bỏ** | `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800` |
| **Hạch toán GL / Niêm phong** | `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800` |
| **Nháp / Vô hiệu** | `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700` |
