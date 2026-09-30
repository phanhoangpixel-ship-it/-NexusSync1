import React from 'react';

export interface MoneyCellProps {
  amount: number | null | undefined;
  currency?: string;
  className?: string;
  showCurrency?: boolean;
  highlightNegative?: boolean;
  size?: 'xs' | 'sm' | 'base' | 'lg';
}

export const MoneyCell: React.FC<MoneyCellProps> = ({
  amount,
  currency = 'VND',
  className = '',
  showCurrency = true,
  highlightNegative = true,
  size = 'xs',
}) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return <span className="text-slate-400 font-mono text-xs">-</span>;
  }

  const isNegative = amount < 0;
  const formatted = Math.abs(amount).toLocaleString('vi-VN');

  const sizeClass =
    size === 'xs'
      ? 'text-xs'
      : size === 'sm'
      ? 'text-sm'
      : size === 'lg'
      ? 'text-lg'
      : 'text-base';

  const colorClass =
    highlightNegative && isNegative
      ? 'text-rose-600 dark:text-rose-400 font-semibold'
      : 'text-slate-900 dark:text-slate-100 font-semibold';

  return (
    <span
      className={`font-mono tabular-nums tracking-tight ${sizeClass} ${colorClass} ${className}`}
      title={`${amount.toLocaleString('vi-VN')} ${currency}`}
    >
      {isNegative ? '-' : ''}
      {formatted}
      {showCurrency && (
        <span className="text-[10px] ml-1 font-sans text-slate-500 dark:text-slate-400 font-normal">
          {currency === 'VND' ? '₫' : currency}
        </span>
      )}
    </span>
  );
};
