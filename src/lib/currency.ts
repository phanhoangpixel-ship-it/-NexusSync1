import { formatNumber, parseNumber } from '../utils/numberFormat';

export const formatVND = (num: number | undefined | null, options?: { showSymbol?: boolean; fractionDigits?: number }): string => {
  if (num === undefined || num === null || isNaN(num)) return options?.showSymbol === false ? '0' : '0 ₫';
  const showSymbol = options?.showSymbol ?? true;
  const formatted = formatNumber(num, {
    thousandSeparator: '.',
    decimalSeparator: ',',
    minimumFractionDigits: options?.fractionDigits,
    maximumFractionDigits: options?.fractionDigits,
  });
  return showSymbol ? `${formatted} ₫` : formatted;
};

export const formatNumberWithDots = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null || num === '') return '';
  return formatNumber(num, { thousandSeparator: '.', decimalSeparator: ',' });
};

export const parseFormattedNumber = (val: string | number | undefined | null): number => {
  if (!val && val !== 0) return 0;
  return parseNumber(val);
};
