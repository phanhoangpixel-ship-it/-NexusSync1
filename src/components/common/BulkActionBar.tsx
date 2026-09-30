import React from "react";
import { X, CheckSquare } from "lucide-react";

export interface BulkActionItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "danger" | "warning" | "secondary" | "outline";
  disabled?: boolean;
}

export interface BulkActionBarProps {
  selectedCount: number;
  totalCount?: number;
  onClearSelection: () => void;
  actions: BulkActionItem[];
  itemName?: string;
  className?: string;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  actions,
  itemName = "bản ghi",
  className = "",
}) => {
  if (selectedCount <= 0) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[92%] sm:w-auto min-w-[340px] bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-md px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200 select-none ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/90 text-white rounded-lg text-xs font-mono font-bold tabular-nums">
          <CheckSquare className="w-3.5 h-3.5" />
          <span>{selectedCount.toLocaleString("vi-VN")}</span>
          {totalCount ? (
            <span className="text-blue-200">/ {totalCount.toLocaleString("vi-VN")}</span>
          ) : null}
        </div>
        <span className="text-xs text-slate-200 font-medium hidden sm:inline">
          {itemName} đã chọn
        </span>
        <button
          onClick={onClearSelection}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 pl-1 transition-colors cursor-pointer"
          title="Bỏ chọn toàn bộ"
        >
          <X className="w-3.5 h-3.5" />
          <span>Bỏ chọn</span>
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {actions.map((act) => {
          let btnClass = "bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600";
          if (act.variant === "primary") {
            btnClass = "bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 font-semibold";
          } else if (act.variant === "danger") {
            btnClass = "bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 font-semibold";
          } else if (act.variant === "warning") {
            btnClass = "bg-amber-600 hover:bg-amber-500 text-white border border-amber-500 font-semibold";
          }

          return (
            <button
              key={act.id}
              onClick={act.onClick}
              disabled={act.disabled}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer ${btnClass}`}
            >
              {act.icon}
              <span>{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
