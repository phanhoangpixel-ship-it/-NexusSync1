-- ==============================================================================
-- NEXUSSYNC ERP — DATABASE MIGRATION SCRIPT
-- Module: M03 — System Configuration & Branding
-- Phase: Phase 1 (Database Schema)
-- Generated Date: 2026-09-27
-- Governance: /docs/AI/GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md
-- Non-negotiable Constraints:
--   1. Reuse Before Create: References existing `branches(id)`, `dms_documents(id)`, `users(id)`.
--   2. Zero mutations to 4 Single-Writer Authorities:
--      (M17 stock_balances/stock_ledger, M30 accounting_entries, M41 pricing, M42 cost_layers/cogs).
--   3. Singleton Table Guarantee: `system_config` has CHECK (id = 1) — exactly 1 row, non-multi-tenant.
--   4. Offline/Zero-CDN Compliance: Branding assets stored in M29 DMS Vault (`dms_documents`),
--      referenced exclusively via FK (`logo_dms_doc_id`, `favicon_dms_doc_id`, `login_background_dms_doc_id`).
--   5. Legal Numbering Protection: `number_series` DOES NOT apply to statutory documents
--      mandated by Vietnamese law (Mẫu 01-TT, 02-TT, Decree 123/2020/ND-CP e-invoices, etc.).
--      It is strictly reserved for internal prefixes not bound by statutory format regulations.
-- ==============================================================================

-- 1. Table: system_config (Singleton, id = 1 enforced via CHECK constraint)
CREATE TABLE IF NOT EXISTS system_config (
  id                            INTEGER PRIMARY KEY CHECK (id = 1),
  is_initialized                BOOLEAN NOT NULL DEFAULT FALSE,
  app_display_name              VARCHAR(120),
  logo_dms_doc_id               INTEGER REFERENCES dms_documents(id),
  favicon_dms_doc_id            INTEGER REFERENCES dms_documents(id),
  login_background_dms_doc_id   INTEGER REFERENCES dms_documents(id),
  primary_color                 VARCHAR(7),
  secondary_color               VARCHAR(7),
  legal_company_name            VARCHAR(255),
  tax_code                      VARCHAR(20),
  company_address               VARCHAR(255),
  company_hotline               VARCHAR(20),
  company_email                 VARCHAR(120),
  default_language              VARCHAR(10) DEFAULT 'vi',
  default_currency              VARCHAR(10) DEFAULT 'VND',
  timezone                      VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
  date_format                   VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  fiscal_year_start_month       INTEGER DEFAULT 1,
  updated_by                    INTEGER REFERENCES users(id),
  updated_at                    TIMESTAMP
);

-- 2. Table: number_series (Internal document prefix generator)
-- NOTE: KHÔNG áp dụng cho chứng từ có format bắt buộc theo luật (Mẫu 01-TT, 02-TT, hóa đơn điện tử NĐ123...).
-- Chỉ dùng cho prefix nội bộ không bị luật buộc cứng (e.g., nội bộ PR, PO nội bộ, điều chuyển nháp).
CREATE TABLE IF NOT EXISTS number_series (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  document_type    VARCHAR(50) UNIQUE,
  prefix           VARCHAR(20),
  next_sequence    INTEGER DEFAULT 1,
  reset_frequency  VARCHAR(20) DEFAULT 'YEARLY',
  branch_id        INTEGER REFERENCES branches(id)
);

-- 3. Table: feature_flags (Architectural Notice on Collision)
-- ARCHITECTURAL CONFLICT & MIGRATION GUARD:
-- A live table `feature_flags` already exists in NexusSync ERP (defined in db/schema.ts lines 4253-4263)
-- with schema (id, flag_key, flag_name, description, is_enabled, category, target_branch, updated_at, updated_by)
-- and contains 5 active records used by settingsRouter and SettingsFeatureFlagsTab.
-- To comply with Rule #02 (Reuse Before Create) and Rule #16 (Frozen Scope Protection),
-- we preserve existing tables without destructive drops.
-- If the project governance approves transitioning or adding module_code/note, ALTER or aliasing should be coordinated.
-- Below is the DDL as specified in the approved architecture specification:
CREATE TABLE IF NOT EXISTS feature_flags (
  id            INTEGER PRIMARY KEY,
  module_code   VARCHAR(10),
  enabled       BOOLEAN DEFAULT TRUE,
  note          VARCHAR(255)
);
