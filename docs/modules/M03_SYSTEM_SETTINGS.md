# M03 — System Settings & Global Configuration

**Module ID:** `M03`  
**Module Name:** System Settings & Global Configuration  
**Business Group:** `06. GOVERNANCE & SYSTEM`  
**Workspace ID:** `WS01_HUB` | **Primary Route:** `/system-settings`  
**Mounted UI Component:** `/src/modules/admin/m03-system-settings/components/SystemSettingsWorkspace.tsx`  
**Primary API Router:** `/src/routes/settings.routes.ts`  
**Verification Status:** 🟢 Enterprise Certified (`M03_UI_UX_REPLICATION_VERIFICATION_REPORT.md`)

---

## 1. Executive Summary & Purpose
M03 is the central nervous system for enterprise-wide configuration in NexusSync ERP. It manages global enterprise parameters, multi-currency exchange rates, tax schedules, branch/legal entity isolation, document numbering sequences, fiscal accounting periods, costing methods, environment profiles, feature toggles, audit logs, server backup snapshots, and automated system integrity verification.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Authoritative Single Source of Truth (SSOT) for global configuration key-value pairs, currency rate conversions, tax schedules, document sequence generators, fiscal period locking, and system feature flags.
- **Single-Writer Principle:** M03 writes configuration tables directly; all other 41 modules read configuration via API or cached settings store.
- **Fiscal Period Authority:** M03 manages the open/lock state of accounting periods in coordination with General Ledger (M30). When a fiscal period is `LOCKED`, all transaction posting from sales, purchasing, invoices, and payments is restricted.

## 3. Sub-Tabs Architecture (10 Sub-Tabs)
1. `parameters`: Global parameters, RBAC 5-role permission matrix, Maker-Checker approval limits, SLA operational targets, Active User Sessions (with Force Logout), and 5-point System Health Diagnostics.
2. `currencies`: Foreign currencies catalog, exchange rates against VND base currency, and system VAT/tax rates.
3. `numbering`: Automated document numbering sequence rules, prefixes, and padding for all ERP document types.
4. `fiscal`: 12-month fiscal calendar period management (Open, Soft-Closed, Locked), SHA-256 JSON snapshot export, and Server Backup Utility.
5. `costing`: Inventory costing method policies (FIFO, Moving Average, Standard Cost) assigned per branch and product category.
6. `branches`: Multi-branch governance (HO Hanoi, HCM, Da Nang, Can Tho) with independent General Ledger codes and 3-state inventory isolation.
7. `profiles`: Industry operational environment profiles (FULL_ERP, Trading, Manufacturing, Retail) with active module registry control.
8. `flags`: Feature toggles and dynamic ERP notification templates.
9. `audit`: Immutable audit trail ledger recording every configuration modification with user attribution, timestamps, and SHA-256 integrity hash.
10. `integrity`: Deep system scan engine with 10 automated integrity rules, health score calculation, and safe garbage purge.

## 4. Data Contracts & Database Tables
- **Database Tables (SQLite / Drizzle ORM):**
  - `system_configs`: Core key-value configuration parameters.
  - `currency_rates`: Currency definitions, symbols, and exchange rates.
  - `document_sequences`: Document numbering generators with current/next sequence numbers.
  - `fiscal_periods`: Accounting periods, date bounds, and locking statuses.
  - `system_tax_rates`: Tax rates, VAT categories, and reporting classifications.
  - `feature_flags`: Feature toggle states and rollouts.
  - `system_settings_audit`: Audit trail ledger for all configuration mutations.
  - `system_backups`: Server backup checkpoints metadata and integrity checksums.
- **Key API Endpoints (`/api/settings`):**
  - `GET /api/settings` — Returns system configuration dictionary.
  - `PUT /api/settings` — Updates parameters with audit trail recording.
  - `GET /api/settings/currencies` & `POST /api/settings/currencies` — Currency rates management.
  - `GET /api/settings/taxes` & `POST /api/settings/taxes` — Tax rates management.
  - `GET /api/settings/sequences` & `POST /api/settings/sequences` — Document numbering sequences.
  - `GET /api/settings/fiscal-periods` & `POST /api/settings/fiscal-periods/lock` — Fiscal period management.
  - `GET /api/settings/audit-logs` — Immutable audit trail logs.
  - `GET /api/settings/backup/snapshot` — Full JSON system snapshot export with SHA-256 checksum.
  - `GET /api/settings/backup/list` — Server backup checkpoints history.
  - `POST /api/settings/backup/trigger` — Trigger immediate server configuration backup.
  - `GET /api/settings/backup/download/:backupId` — Download server backup file.
  - `DELETE /api/settings/backup/:backupId` — Safe deletion of backup checkpoint.

## 5. UI/UX Standards & Governance (Rule #19 & Rule #20)
- **100% ConfirmDialog.tsx:** No `window.alert()` or `window.confirm()`. All irreversible actions (Force Logout, Branch Switch, Profile Activation, Period Lock, Backup Deletion, Config Auto-Fix, Garbage Purge) use `ConfirmDialog.tsx`.
- **Numeric & Financial Formatting:** All rates, limits, currency amounts, dates, and hash strings adhere to `font-mono tabular-nums font-bold`.
- **WCAG AA Color Tokens:** Fully contrast-compliant semantic status badges and `border-l-4` table indicators for Active, Warning, Danger, and Info states.

