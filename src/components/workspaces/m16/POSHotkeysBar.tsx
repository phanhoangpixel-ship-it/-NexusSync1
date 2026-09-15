import React from 'react';
import { Keyboard } from 'lucide-react';

interface POSHotkeysBarProps {
  onSearchFocus?: () => void;
  onQtyFocus?: () => void;
  onParkOrder?: () => void;
  onPromoFocus?: () => void;
  onCheckout?: () => void;
  onReprint?: () => void;
}

export const POSHotkeysBar: React.FC<POSHotkeysBarProps> = ({
  onSearchFocus,
  onQtyFocus,
  onParkOrder,
  onPromoFocus,
  onCheckout,
  onReprint
}) => {
  const shortcuts = [
    { key: 'F2', label: 'Tìm kiếm', action: onSearchFocus },
    { key: 'F4', label: 'Sửa SL', action: onQtyFocus },
    { key: 'F7', label: 'Treo đơn', action: onParkOrder },
    { key: 'F8', label: 'Mã giảm giá', action: onPromoFocus },
    { key: 'F9', label: 'Thanh toán', action: onCheckout },
    { key: 'F10', label: 'In lại HĐ', action: onReprint },
    { key: 'Esc', label: 'Đóng/Hủy', action: undefined },
    { key: 'Enter', label: 'Xác nhận', action: undefined }
  ];

  return (
    <div className="bg-slate-900/95 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-800 shadow-xs flex items-center justify-between gap-2 overflow-x-auto text-[11px] select-none whitespace-nowrap">
      <div className="flex items-center gap-1.5 text-slate-400 font-semibold shrink-0">
        <Keyboard className="w-3 h-3 text-blue-400" />
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Hotkeys:</span>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto">
        {shortcuts.map(sc => (
          <span
            key={sc.key}
            onClick={sc.action}
            className={`inline-flex items-center gap-1 transition-colors ${
              sc.action ? 'text-slate-300 hover:text-white cursor-pointer' : 'text-slate-500 cursor-default'
            }`}
          >
            <kbd className="px-1 py-0.2 bg-slate-800 text-blue-400 font-mono font-bold rounded text-[9px] border border-slate-700">
              {sc.key}
            </kbd>
            <span className="text-[10px]">{sc.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

