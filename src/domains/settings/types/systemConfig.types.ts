/**
 * NEXUSSYNC ERP — M03 SYSTEM CONFIGURATION & BRANDING DOMAIN TYPES
 * Phase 2 Architecture: Domain Types, Enums, and Permission Constants
 * Governance: /docs/AI/GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md
 */

// ==========================================
// 1. DOMAIN ENUMS
// ==========================================

export enum ConfigCategory {
  BRANDING = 'BRANDING',
  COMPANY = 'COMPANY',
  LOCALE = 'LOCALE',
}

export enum SeriesResetFrequency {
  NEVER = 'NEVER',
  YEARLY = 'YEARLY',
  MONTHLY = 'MONTHLY',
}

// ==========================================
// 2. PERMISSION CONSTANTS (Phase 2 Declaration Only)
// (Chỉ khai báo hằng số, CHƯA gán vào middleware route nào theo Phase 8)
// ==========================================

export const SETTINGS_PERMISSIONS = {
  VIEW: 'settings:view',
  BRANDING_MANAGE: 'settings:branding.manage',
  COMPANY_MANAGE: 'settings:company.manage',
  LOCALE_MANAGE: 'settings:locale.manage',
  BRANCH_MANAGE: 'settings:branch.manage',
  NUMBER_SERIES_MANAGE: 'settings:number-series.manage',
  FEATURE_FLAGS_MANAGE: 'settings:feature-flags.manage',
} as const;

export const SETTINGS_PERMISSION_LIST = [
  SETTINGS_PERMISSIONS.VIEW,
  SETTINGS_PERMISSIONS.BRANDING_MANAGE,
  SETTINGS_PERMISSIONS.COMPANY_MANAGE,
  SETTINGS_PERMISSIONS.LOCALE_MANAGE,
  SETTINGS_PERMISSIONS.BRANCH_MANAGE,
  SETTINGS_PERMISSIONS.NUMBER_SERIES_MANAGE,
  SETTINGS_PERMISSIONS.FEATURE_FLAGS_MANAGE,
] as const;

export type SettingsPermission = (typeof SETTINGS_PERMISSIONS)[keyof typeof SETTINGS_PERMISSIONS];

// ==========================================
// 3. TYPESCRIPT INTERFACES
// ==========================================

/**
 * Singleton System Configuration & Corporate Branding.
 * Invariant: Exactly one record with id = 1.
 * Non-multi-tenant: Each deployment is a dedicated independent enterprise instance.
 * Assets: Linked exclusively through M29 DMS (`dms_documents`) with cryptographic SHA-256 verification.
 */
export interface SystemConfig {
  id: 1;
  is_initialized: boolean;
  app_display_name?: string | null;
  logo_dms_doc_id?: number | null;
  favicon_dms_doc_id?: number | null;
  login_background_dms_doc_id?: number | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  legal_company_name?: string | null;
  tax_code?: string | null;
  company_address?: string | null;
  company_hotline?: string | null;
  company_email?: string | null;
  default_language?: string | null;
  default_currency?: string | null;
  timezone?: string | null;
  date_format?: string | null;
  fiscal_year_start_month?: number | null;
  updated_by?: number | null;
  updated_at?: string | Date | null;
}

/**
 * Number Series Configuration for Internal Document Generation.
 * STRICT INVARIANT:
 * Does NOT apply to statutory documents with mandated formats (e.g., Mẫu 01-TT, 02-TT, Decree 123/2020/ND-CP).
 * Reserved strictly for customizable internal prefixes and sequence numbers.
 */
export interface NumberSeries {
  id?: number;
  document_type: string;
  prefix?: string | null;
  next_sequence: number;
  reset_frequency: SeriesResetFrequency | 'NEVER' | 'YEARLY' | 'MONTHLY';
  branch_id?: number | null;
}

/**
 * Modular Feature Flag Specification.
 * Controls module activation and operational toggles per module code.
 */
export interface FeatureFlag {
  id?: number;
  module_code: string;
  enabled: boolean;
  note?: string | null;
}
