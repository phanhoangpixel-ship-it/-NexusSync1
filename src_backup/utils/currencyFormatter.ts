import { formatCurrency as formatSysCurrency, formatNumber as formatSysNumber, parseNumber as parseSysNumber } from './numberFormat';

export function formatVNDCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return formatSysNumber(value);
}

export function formatCurrency(amount: number | string | null | undefined, currency: string = 'VND'): string {
  return formatSysCurrency(amount, currency);
}

export function formatNumber(amount: number | string | null | undefined, thousandsSeparator: '.' | ',' = '.', decimalSeparator: ',' | '.' = ','): string {
  return formatSysNumber(amount, thousandsSeparator, decimalSeparator);
}

export function parseVNDCurrency(value: string | number | null | undefined): number {
  return parseSysNumber(value);
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
