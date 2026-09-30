import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { users, branches, dmsDocuments } from "./schema";

/**
 * Module M03: System Configuration & Branding
 * Singleton Table: Exactly one configuration record (id = 1, enforced via CHECK constraint in migration).
 * Architecture: Isolated deployment per client (offline first, single enterprise, non-multi-tenant, no tenant_id).
 * Assets: All branding assets (logo, favicon, background) must be referenced via M29 DMS (`dms_documents`)
 *         for cryptographic SHA-256 integrity and zero external CDN dependency.
 */
export const systemConfig = sqliteTable("system_config", {
  id: integer("id").primaryKey(), // Check constraint id = 1 enforced in SQL migration
  isInitialized: integer("is_initialized", { mode: "boolean" }).notNull().default(false),
  appDisplayName: text("app_display_name"),
  logoDmsDocId: integer("logo_dms_doc_id").references(() => dmsDocuments.id),
  faviconDmsDocId: integer("favicon_dms_doc_id").references(() => dmsDocuments.id),
  loginBackgroundDmsDocId: integer("login_background_dms_doc_id").references(() => dmsDocuments.id),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  legalCompanyName: text("legal_company_name"),
  taxCode: text("tax_code"),
  companyAddress: text("company_address"),
  companyHotline: text("company_hotline"),
  companyEmail: text("company_email"),
  defaultLanguage: text("default_language").default("vi"),
  defaultCurrency: text("default_currency").default("VND"),
  timezone: text("timezone").default("Asia/Ho_Chi_Minh"),
  dateFormat: text("date_format").default("DD/MM/YYYY"),
  fiscalYearStartMonth: integer("fiscal_year_start_month").default(1),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

/**
 * Module M03: Number Series Configuration
 * Used ONLY for internal document numbering series with customizable prefixes.
 * STRICT ARCHITECTURAL INVARIANT:
 * Does NOT apply to statutory documents mandated by law (e.g., Mẫu 01-TT, 02-TT, Decree 123/2020/ND-CP e-invoices).
 */
export const numberSeries = sqliteTable("number_series", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  documentType: text("document_type").unique(),
  prefix: text("prefix"),
  nextSequence: integer("next_sequence").default(1),
  resetFrequency: text("reset_frequency").default("YEARLY"), // 'NEVER' | 'YEARLY' | 'MONTHLY'
  branchId: integer("branch_id").references(() => branches.id),
});

export type SystemConfigRow = typeof systemConfig.$inferSelect;
export type NewSystemConfigRow = typeof systemConfig.$inferInsert;
export type NumberSeriesRow = typeof numberSeries.$inferSelect;
export type NewNumberSeriesRow = typeof numberSeries.$inferInsert;
