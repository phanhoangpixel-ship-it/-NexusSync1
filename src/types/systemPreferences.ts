export type DisplayDensity = 'cozy' | 'compact' | 'spaced';
export type DensityMode = DisplayDensity;
export type DisplayScaleMode = 'auto' | '75' | '80' | '85' | '90' | '95' | '100' | '105' | '110' | '125';
export type AppTheme = 'light' | 'cool-dark' | 'warm-sepia';
export type AutoThemeMode = 'manual' | 'system' | 'schedule';
export type SystemLanguage = 'vi' | 'en' | 'ja';
export type CurrencyFormat = 'VND' | 'USD' | 'EUR';

export interface SystemPreferences {
  density: DisplayDensity;
  displayScaleMode?: DisplayScaleMode; // 'auto' | '75' | '80' | '85' | '90' | '100' | '110' | '125'
  theme: AppTheme;
  autoThemeMode: AutoThemeMode;
  scheduleStartDark: string; // e.g. "18:00"
  scheduleEndDark: string; // e.g. "06:00"
  language: SystemLanguage;
  currency: CurrencyFormat;
  currencySymbol: string; // e.g. "₫", "$", "€", "¥", "£"
  currencyPosition: 'prefix' | 'suffix'; // prefix ($1,250) or suffix (1,250 ₫)
  thousandSeparator: '.' | ',';
  decimalSeparator: ',' | '.';
  defaultLandingModule: string; // moduleId
  sessionTimeoutMinutes: number; // 15, 30, 60, 1440
  offlineCachingEnabled: boolean;
  alertSoundEnabled: boolean;
  keyboardShortcutsEnabled: boolean;
  autoCacheCleaningEnabled: boolean;
  cacheRetentionMinutes: number; // 1, 3, 5, 10
  maxCachedWorkspaces: number; // 1, 3, 5
}

export const DEFAULT_SYSTEM_PREFERENCES: SystemPreferences = {
  density: 'cozy',
  displayScaleMode: 'auto',
  theme: 'light',
  autoThemeMode: 'system',
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

