import React from 'react';

export interface TabErrorIndicatorProps {
  /**
   * Whether the tab has one or more validation errors
   */
  hasError?: boolean;
  /**
   * Optional number of invalid fields or errors in this tab
   */
  count?: number;
  /**
   * Whether to animate the indicator with a pulse effect
   * @default true
   */
  pulse?: boolean;
  /**
   * Tooltip description displayed on hover
   */
  tooltip?: string;
  /**
   * Visual variant: 'dot' for small red circle, 'badge' for pill with count, 'counter' for number only
   * @default 'dot'
   */
  variant?: 'dot' | 'badge' | 'counter';
  /**
   * Custom CSS class names
   */
  className?: string;
}

/**
 * TabErrorIndicator
 * Enterprise visual indicator for tab headers to signal validation failures
 * or required field omissions inside the active or inactive tab panels.
 */
export const TabErrorIndicator: React.FC<TabErrorIndicatorProps> = ({
  hasError = false,
  count,
  pulse = true,
  tooltip,
  variant = 'dot',
  className = '',
}) => {
  const isTriggered = hasError || (typeof count === 'number' && count > 0);

  if (!isTriggered) return null;

  const defaultTooltip = count && count > 0
    ? `Có ${count} trường thông tin chưa hợp lệ trong thẻ này`
    : 'Thẻ này có thông tin bắt buộc chưa được điền hoặc không hợp lệ';

  const titleText = tooltip || defaultTooltip;

  if (variant === 'badge' || (typeof count === 'number' && count > 0 && variant !== 'dot')) {
    return (
      <span
        title={titleText}
        role="status"
        aria-label={titleText}
        className={`inline-flex items-center justify-center px-1.5 py-0.5 min-w-[18px] text-[10px] font-mono font-bold leading-none text-white bg-rose-600 dark:bg-rose-500 rounded-full border border-white dark:border-slate-900 shadow-xs ${
          pulse ? 'animate-pulse' : ''
        } ${className}`}
      >
        {count ?? '!'}
      </span>
    );
  }

  return (
    <span
      title={titleText}
      role="status"
      aria-label={titleText}
      className={`relative flex items-center justify-center ${className}`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 shadow-xs ${
          pulse ? 'animate-pulse' : ''
        }`}
      />
      {pulse && (
        <span className="absolute w-3.5 h-3.5 rounded-full bg-rose-400 opacity-40 animate-ping" />
      )}
    </span>
  );
};

export default TabErrorIndicator;
