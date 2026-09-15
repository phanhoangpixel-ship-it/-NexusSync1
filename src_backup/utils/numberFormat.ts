import { SystemPreferences } from '../types/systemPreferences';

/**
 * Retrieves current system preferences from localStorage or returns defaults.
 */
export function getSystemPreferences(): SystemPreferences {
  try {
    const saved = localStorage.getItem('nexussync_system_preferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        density: parsed.density || 'cozy',
        theme: parsed.theme || 'light',
        autoThemeMode: parsed.autoThemeMode || 'manual',
        scheduleStartDark: parsed.scheduleStartDark || '18:00',
        scheduleEndDark: parsed.scheduleEndDark || '06:00',
        language: parsed.language || 'vi',
        currency: parsed.currency || 'VND',
        currencySymbol: parsed.currencySymbol || '₫',
        currencyPosition: parsed.currencyPosition || 'suffix',
        thousandSeparator: parsed.thousandSeparator || '.',
        decimalSeparator: parsed.decimalSeparator || ',',
        defaultLandingModule: parsed.defaultLandingModule || 'M01',
        sessionTimeoutMinutes: parsed.sessionTimeoutMinutes || 30,
        offlineCachingEnabled: parsed.offlineCachingEnabled ?? true,
        alertSoundEnabled: parsed.alertSoundEnabled ?? true,
        keyboardShortcutsEnabled: parsed.keyboardShortcutsEnabled ?? true,
        autoCacheCleaningEnabled: parsed.autoCacheCleaningEnabled ?? true,
        cacheRetentionMinutes: parsed.cacheRetentionMinutes || 3,
        maxCachedWorkspaces: parsed.maxCachedWorkspaces || 3,
      };
    }
  } catch (e) {
    // fallback
  }
  return {
    density: 'cozy',
    theme: 'light',
    autoThemeMode: 'manual',
    scheduleStartDark: '18:00',
    scheduleEndDark: '06:00',
    language: 'vi',
    currency: 'VND',
    currencySymbol: '₫',
    currencyPosition: 'suffix',
    thousandSeparator: '.',
    decimalSeparator: ',',
    defaultLandingModule: 'M01',
    sessionTimeoutMinutes: 30,
    offlineCachingEnabled: true,
    alertSoundEnabled: true,
    keyboardShortcutsEnabled: true,
    autoCacheCleaningEnabled: true,
    cacheRetentionMinutes: 3,
    maxCachedWorkspaces: 3,
  };
}

/**
 * Parses any number or formatted string into a raw numeric float value,
 * intelligently handling both Vietnamese (1.500.000,50) and US (1,500,000.50) conventions.
 */
export function parseNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;

  let str = String(value).trim();
  if (!str || str === "-") return 0;

  // Remove currency symbols, letters, spaces except digits, dots, commas, minus
  str = str.replace(/[^0-9.,-]/g, "");
  if (!str || str === "-") return 0;

  // Determine thousand & decimal separators
  if (str.includes('.') && str.includes(',')) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Comma is decimal, dot is thousand (1.500.000,50)
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Dot is decimal, comma is thousand (1,500,000.50)
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length <= 2 && parts[0].length <= 3) {
      str = str.replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes('.')) {
    const dotCount = (str.match(/\./g) || []).length;
    if (dotCount > 1) {
      str = str.replace(/\./g, '');
    } else {
      const parts = str.split('.');
      if (parts[1] && parts[1].length === 3) {
        str = str.replace('.', '');
      }
    }
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a number or numeric string into a clean numeric string with 
 * thousands and decimal separators dictated by system preferences.
 */
export function formatNumber(
  amount: number | string | null | undefined, 
  forcedThousandSeparator?: '.' | ',',
  forcedDecimalSeparator?: ',' | '.'
): string {
  if (amount === null || amount === undefined || amount === '') return '0';
  
  const num = parseNumber(amount);
  if (isNaN(num)) return '0';

  const prefs = getSystemPreferences();
  const thousand = forcedThousandSeparator || prefs.thousandSeparator || '.';
  const decimal = forcedDecimalSeparator || prefs.decimalSeparator || ',';

  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousand);

  if (parts.length > 1) {
    return `${parts[0]}${decimal}${parts[1]}`;
  }
  return parts[0];
}

/**
 * Formats a number or numeric string as currency, applying system preference 
 * for thousand/decimal separators, currency symbol, and position (prefix/suffix).
 */
export function formatCurrency(
  amount: number | string | null | undefined, 
  customCurrencySymbol?: string,
  customPosition?: 'prefix' | 'suffix'
): string {
  const prefs = getSystemPreferences();
  const num = parseNumber(amount);
  const formattedNum = formatNumber(num);

  const symbol = customCurrencySymbol !== undefined ? customCurrencySymbol : (prefs.currencySymbol || '₫');
  const position = customPosition || prefs.currencyPosition || 'suffix';

  if (!symbol) return formattedNum;

  if (position === 'prefix') {
    return `${symbol} ${formattedNum}`;
  } else {
    return `${formattedNum} ${symbol}`;
  }
}
