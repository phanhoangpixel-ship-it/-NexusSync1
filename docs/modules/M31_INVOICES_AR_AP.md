# M31 — Invoices AR/AP & VAT Invoicing

**Module ID:** `M31`  
**Module Name:** Accounts Receivable / Payable (AR/AP) & VAT Invoicing  
**Business Group:** `05. FINANCE & ACCOUNTING`  
**Workspace ID:** `WS19_INVOICES` | **Primary Route:** `/invoices`  
**Mounted UI Component:** `src/pages/Invoices.tsx`  
**Primary API Endpoint:** `GET /api/invoices`

---

## 1. Executive Summary & Purpose
M31 governs commercial billing: Customer Sales Invoices (AR), Vendor Invoices (AP), Credit Memos, electronic VAT invoice sequences, and aging analysis (Overdue 30/60/90+ days).

## 2. Domain Authority Boundaries
- **Central Tax Engine Authority:** Sole authority for applying and calculating VAT tax rates (0%, 5%, 8%, 10%), tax exemptions, and invoice rounding rules.
- **Accounting Integration:** Invoice confirmation posts AR/AP entries directly to `AccountingService` (M30) (VAS 131/331/511/3331).

## 3. Data Contracts & APIs
- **Database Tables:** `invoices`, `invoice_lines`, `tax_rates`, `credit_memos`.
- **APIs:**
  - `GET /api/invoices` — List invoices with AR/AP and payment status filter.
  - `POST /api/invoices` — Create invoice from sales order or PO.
  - `POST /api/invoices/:id/post` — Post invoice to GL.

## 4. UI/UX Standards
- AR/AP aging buckets visual progress bar.
- Invoice numbers, tax amounts, and remaining balances in `font-mono tabular-nums`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement direct e-invoice provider integration (VNPT, Viettel, MISA meInvoice).
- [ ] Add automated dunning email notifications for overdue customer receivables.
