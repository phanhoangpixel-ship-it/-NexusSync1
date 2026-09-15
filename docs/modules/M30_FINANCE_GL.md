# M30 — Finance & General Ledger (GL)

**Module ID:** `M30`  
**Module Name:** Finance & General Ledger (GL)  
**Business Group:** `05. FINANCE & ACCOUNTING`  
**Workspace ID:** `WS18_FINANCE` | **Primary Route:** `/finance`  
**Mounted UI Component:** `src/pages/Finance.tsx`  
**Primary API Endpoint:** `GET /api/finance/general-ledger`

---

## 1. Executive Summary & Purpose
M30 is the financial core of NexusSync ERP, compliant with Vietnamese Accounting Standards (VAS Circular 200/133) and IFRS principles. It manages the Chart of Accounts, manual and automated journal entries, trial balance, and official balance sheet / P&L financial statements.

## 2. Domain Authority Boundaries
- **NON-NEGOTIABLE SINGLE WRITER:** `AccountingService` is the SOLE authority permitted to generate and post double-entry General Ledger vouchers.
- **Invariant Rule:** `SUM(Debit) == SUM(Credit)` must hold strictly for every single journal voucher before posting is allowed. No out-of-balance transactions are permitted under any condition.

## 3. Data Contracts & Schema
- **Database Tables:** `chart_of_accounts`, `journal_entries`, `journal_lines`, `fiscal_periods`.
- **APIs:**
  - `GET /api/finance/general-ledger` — Journal entries query with date/account filters.
  - `POST /api/finance/journal-entries` — Post journal voucher (via `AccountingService`).
  - `GET /api/finance/trial-balance` — Real-time debit/credit trial balance.

## 4. UI/UX Standards
- Double-entry table showing Account Code, Account Name, Debit, Credit.
- VAS account numbers and monetary balances in `font-mono tabular-nums`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement period-end closing checklist with automated closing entries (VAS 911).
- [ ] Add foreign currency revaluation wizard for cash and receivables at period end.
