export const formatVND = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

export const formatNumberWithDots = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null || num === '') return '';
  const raw = typeof num === 'number' ? num.toString() : num.replace(/\D/g, '');
  if (!raw) return '';
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) return '';
  return parsed.toLocaleString('vi-VN');
};

export const parseFormattedNumber = (val: string | undefined | null): number => {
  if (!val) return 0;
  const raw = val.replace(/\D/g, '');
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? 0 : parsed;
};
