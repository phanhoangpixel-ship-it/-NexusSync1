# M32 — Payments & Treasury Cash

**Module ID:** `M32`  
**Module Name:** Cash Book & Treasury Payments  
**Business Group:** `05. FINANCE & ACCOUNTING`  
**Workspace ID:** `WS20_PAYMENTS` | **Primary Route:** `/payments`  
**Mounted UI Component:** `src/pages/Payments.tsx`  
**Primary API Endpoint:** `GET /api/payments`

---

## 1. Executive Summary & Purpose
M32 administers the physical Cash Book and Treasury vouchers: Customer Receipts (Receipt Vouchers / Phiếu Thu), Vendor Disbursements (Payment Vouchers / Phiếu Chi), petty cash funds, and currency holdings.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Cash collection lifecycle, cash vouchers, and petty cash replenishments.
- **Accounting Integration:** Voucher validation automatically creates GL cash postings via `AccountingService` (M30) (VAS 111).

## 3. Data Contracts & APIs
- **Database Tables:** `payment_vouchers`, `cash_funds`, `treasury_logs`.
- **APIs:**
  - `GET /api/payments` — Cash and bank payment voucher registry.
  - `POST /api/payments/receipt` — Issue cash receipt voucher.
  - `POST /api/payments/disbursement` — Issue cash disbursement voucher.

## 4. UI/UX Standards
- Printable standard Vietnamese Receipt/Payment voucher templates (Mẫu 01-TT, 02-TT).
- Monetary figures, currency codes, and voucher serials in `font-mono tabular-nums`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Add petty cash imprest fund automated ceiling enforcement.
- [ ] Support multi-currency payment receipts with exchange rate gain/loss calculation.
