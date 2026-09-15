# M14 — Sales Commission & Compensation

**Module ID:** `M14`  
**Module Name:** Sales Commission & Incentive Management  
**Business Group:** `01. COMMERCIAL & SALES`  
**Workspace ID:** `WS03_SALES` | **Primary Route:** `/commission`  
**Mounted UI Component:** `src/pages/Commission.tsx`  
**Primary API Endpoint:** `GET /api/commission/plans`

---

## 1. Executive Summary & Purpose
M14 manages sales representative incentive schemes, tiered commission calculations, quota attainments, return clawbacks, and automated accounting accruals (VAS 6418/3388).

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Commission rule sets, representative payouts, and incentive statements.
- **Accounting Integration:** Approved commissions route double-entry expense vouchers directly to M30.

## 3. Data Contracts & APIs
- **Database Tables:** `commission_plans`, `commission_records`, `sales_rep_quotas`.
- **APIs:**
  - `GET /api/commission/plans` — Commission plans and rate tiers.
  - `POST /api/commission/calculate` — Execute commission calculation batch for closed invoices.
  - `POST /api/commission/settle` — Settle and post payout vouchers to GL (M30).

## 4. UI/UX Standards
- Tiered attainment progress bars with percentage badges in `font-mono`.
- Commission settlement ledger with payout approval buttons.

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement team-based pooled commission splitting rules.
- [ ] Add real-time commission projection simulator for sales reps in M13.
