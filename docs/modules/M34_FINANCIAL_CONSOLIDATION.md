# M34 — Financial Consolidation

**Module ID:** `M34`  
**Module Name:** Financial Consolidation & Multi-Entity Group Accounting  
**Business Group:** `05. FINANCE & ACCOUNTING`  
**Workspace ID:** `WS18_FINANCE` | **Primary Route:** `/financial-consolidation`  
**Mounted UI Component:** `src/pages/FinancialConsolidation.tsx`  
**Primary API Endpoint:** `GET /api/finance/consolidation/runs`

---

## 1. Executive Summary & Purpose
M34 aggregates financial reports across multiple subsidiary branches, legal entities, and business units. It handles intercompany transaction eliminations (AR vs. AP, Intercompany sales/purchases) and consolidated BCTC statements.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Consolidation mapping tables, intercompany elimination vouchers, and group financial statements.

## 3. Data Contracts & APIs
- **Database Tables:** `consolidation_entities`, `consolidation_runs`, `intercompany_eliminations`.
- **APIs:**
  - `GET /api/finance/consolidation/runs` — History of consolidation runs.
  - `POST /api/finance/consolidation/execute` — Run group consolidation and eliminations.
  - `GET /api/finance/consolidation/balance-sheet` — Group consolidated Balance Sheet.

## 4. UI/UX Standards
- Multi-column entity comparison sheet (Entity A + Entity B - Eliminations = Consolidated Group).
- Financial values in `font-mono tabular-nums`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Add multi-currency foreign subsidiary translation (Cumulative Translation Adjustment - CTA).
- [ ] Implement automated intercompany balance matching report.
