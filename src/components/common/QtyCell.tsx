import React from 'react';

export interface QtyCellProps {
  quantity: number | null | undefined;
  uom?: string;
  className?: string;
  decimals?: number;
  highlightZero?: boolean;
}

export const QtyCell: React.FC<QtyCellProps> = ({
  quantity,
  uom,
  className = '',
  decimals = 0,
  highlightZero = false,
}) => {
  if (quantity === null || quantity === undefined || isNaN(quantity)) {
    return <span className="text-slate-400 font-mono text-xs">-</span>;
  }

  const formatted =
    decimals > 0
      ? quantity.toLocaleString('vi-VN', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : quantity.toLocaleString('vi-VN');

  const isZero = quantity === 0;

  return (
    <span
      className={`font-mono tabular-nums text-xs font-semibold ${
        isZero && highlightZero
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-slate-800 dark:text-slate-200'
      } ${className}`}
    >
      {formatted}
      {uom && (
        <span className="ml-1 text-[10px] font-sans font-medium text-slate-500 dark:text-slate-400">
          {uom}
        </span>
      )}
    </span>
  );
};
