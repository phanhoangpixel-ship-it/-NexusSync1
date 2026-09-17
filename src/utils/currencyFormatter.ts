import { getSystemPreferences, parseNumber } from './numberFormat';

export interface FormatNumberOptions {
  thousandSeparator?: '.' | ',';
  decimalSeparator?: ',' | '.';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function formatNumber(
  amount: number | string | null | undefined, 
  optionsOrThousand?: FormatNumberOptions | '.' | ',',
  forcedDecimalSeparator?: ',' | '.'
): string {
  if (amount === null || amount === undefined || amount === '') return '0';
  
  const num = parseNumber(amount);
  if (isNaN(num)) return '0';

  const prefs = getSystemPreferences();
  let thousand = prefs.thousandSeparator || '.';
  let decimal = prefs.decimalSeparator || ',';
  let minFractionDigits: number | undefined;
  let maxFractionDigits: number | undefined;

  if (typeof optionsOrThousand === 'object' && optionsOrThousand !== null) {
    if (optionsOrThousand.thousandSeparator) thousand = optionsOrThousand.thousandSeparator;
    if (optionsOrThousand.decimalSeparator) decimal = optionsOrThousand.decimalSeparator;
    minFractionDigits = optionsOrThousand.minimumFractionDigits;
    maxFractionDigits = optionsOrThousand.maximumFractionDigits;
  } else if (typeof optionsOrThousand === 'string') {
    thousand = optionsOrThousand;
    if (forcedDecimalSeparator) decimal = forcedDecimalSeparator;
  }

  let numStr = num.toString();
  if (minFractionDigits !== undefined || maxFractionDigits !== undefined) {
    const minD = minFractionDigits ?? 0;
    const maxD = maxFractionDigits ?? Math.max(minD, 2);
    numStr = num.toFixed(Math.min(Math.max(minD, maxD), 4));
  }

  const parts = numStr.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
  
  if (parts.length > 1) {
    let frac = parts[1];
    // If no explicit minFractionDigits and single decimal digit (e.g. .5), display as .50 for currency convention
    if (minFractionDigits === undefined && frac.length === 1) {
      frac = frac + '0';
    }
    return `${parts[0]}${decimal}${frac}`;
  }
  return parts[0];
}

export function formatCurrency(
  amount: number | string | null | undefined, 
  customCurrencySymbol?: string,
  customPosition?: 'prefix' | 'suffix',
  options?: FormatNumberOptions
): string {
  const prefs = getSystemPreferences();
  const num = parseNumber(amount);
  const formattedNum = formatNumber(num, options);
  
  const symbol = customCurrencySymbol !== undefined ? customCurrencySymbol : (prefs.currencySymbol || '₫');
  const position = customPosition || prefs.currencyPosition || 'suffix';

  if (!symbol) return formattedNum;

  if (position === 'prefix') {
    return `${symbol} ${formattedNum}`;
  } else {
    return `${formattedNum} ${symbol}`;
  }
}

export function formatVNDCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return formatNumber(value);
}

export function parseVNDCurrency(value: string | number | null | undefined): number {
  return parseNumber(value);
}

// Formats amount into short human-readable Vietnamese words for instant verification
export function formatAmountInWordsShort(num: number | string): string {
  const n = typeof num === "number" ? num : parseVNDCurrency(num);
  if (!n || n <= 0) return "0 VNĐ";

  const absNum = Math.abs(n);
  const sign = n < 0 ? "Âm " : "";
  let shortText = "";

  if (absNum >= 1000000000) {
    const ty = absNum / 1000000000;
    shortText = `${Number.isInteger(ty) ? ty : Number(ty.toFixed(3))} Tỷ`;
  } else if (absNum >= 1000000) {
    const trieu = absNum / 1000000;
    shortText = `${Number.isInteger(trieu) ? trieu : Number(trieu.toFixed(2))} Triệu`;
  } else if (absNum >= 1000) {
    const nghin = absNum / 1000;
    shortText = `${Number.isInteger(nghin) ? nghin : Number(nghin.toFixed(1))} Nghìn`;
  } else {
    shortText = `${absNum.toLocaleString("vi-VN")}`;
  }

  return `${sign}${shortText} VNĐ`;
}

// Full Vietnamese text reading for formal accounting checks
export function formatAmountInWordsFull(num: number | string): string {
  const n = typeof num === "number" ? num : parseVNDCurrency(num);
  if (!n || n === 0) return "Không đồng";

  const defaultUnits = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const absN = Math.abs(n);

  const readThreeDigits = (number: number, isFirst: boolean): string => {
    let hundred = Math.floor(number / 100);
    let ten = Math.floor((number % 100) / 10);
    let unit = number % 10;
    let result = "";

    if (hundred > 0 || !isFirst) {
      result += defaultUnits[hundred] + " trăm ";
    }
    if (ten > 1) {
      result += defaultUnits[ten] + " mươi ";
      if (unit === 1) result += "mốt";
      else if (unit === 5) result += "lăm";
      else if (unit > 0) result += defaultUnits[unit];
    } else if (ten === 1) {
      result += "mười ";
      if (unit === 5) result += "lăm";
      else if (unit > 0) result += defaultUnits[unit];
    } else {
      if (hundred > 0 && unit > 0) result += "lẻ ";
      if (unit > 0) result += defaultUnits[unit];
    }
    return result.trim();
  };

  const str = Math.floor(absN).toString();
  const groups: number[] = [];
  let tempStr = str;
  while (tempStr.length > 0) {
    groups.unshift(parseInt(tempStr.slice(-3), 10));
    tempStr = tempStr.slice(0, -3);
  }

  const unitsName = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  let fullText = "";

  for (let i = 0; i < groups.length; i++) {
    const groupVal = groups[i];
    const unitIndex = groups.length - 1 - i;

    if (groupVal > 0) {
      const groupText = readThreeDigits(groupVal, i === 0);
      fullText += groupText + " " + unitsName[unitIndex] + " ";
    }
  }
  
  fullText = fullText.trim();
  if (fullText) {
    fullText = fullText.charAt(0).toUpperCase() + fullText.slice(1) + " đồng";
  } else {
    fullText = "Không đồng";
  }

  return n < 0 ? "Âm " + fullText.toLowerCase() : fullText;
}
