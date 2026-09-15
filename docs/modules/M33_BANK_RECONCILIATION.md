# M33 — Bank Reconciliation & VietQR

**Module ID:** `M33`  
**Module Name:** Bank Reconciliation & VietQR Matching  
**Business Group:** `05. FINANCE & ACCOUNTING`  
**Workspace ID:** `WS21_BANK` | **Primary Route:** `/bank-reconciliation`  
**Mounted UI Component:** `src/pages/BankReconciliation.tsx`  
**Primary API Endpoint:** `GET /api/bank/statements`

---

## 1. Executive Summary & Purpose
M33 matches bank account statements with system cash receipts/disbursements. It features dynamic VietQR generation with embedded payment references for automated reconciliation against bank webhooks.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Bank statement lines, statement import records, and reconciliation clearing status.

## 3. Data Contracts & APIs
- **Database Tables:** `bank_accounts`, `bank_statements`, `bank_statement_lines`, `reconciliation_matches`.
- **APIs:**
  - `GET /api/bank/statements` — Statement lines and matched status.
  - `POST /api/bank/statements/upload` — Parse and upload Excel/CSV bank statement.
  - `POST /api/bank/reconcile/auto` — Execute rules-based automated matching.

## 4. UI/UX Standards
- Side-by-side reconciliation screen: Bank transactions (Left) vs. ERP book vouchers (Right).
- VietQR dynamic QR display with copyable payment syntax.

## 5. Feature Upgrade Readiness Checklist
- [ ] Integrate Open Banking APIs for automated daily statement download.
- [ ] Add fuzzy text matching for customer deposit reference remarks.
