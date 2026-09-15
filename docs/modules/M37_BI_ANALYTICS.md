# M37 — BI & Executive Analytics Reports

**Module ID:** `M37`  
**Module Name:** Business Intelligence (BI) & Executive Analytics Reports  
**Business Group:** `06. GOVERNANCE & SYSTEM`  
**Workspace ID:** `WS18_FINANCE` | **Primary Route:** `/reports`  
**Mounted UI Component:** `src/pages/BIAnalyticsReports.tsx`  
**Primary API Endpoint:** `GET /api/reports/executive-summary`

---

## 1. Executive Summary & Purpose
M37 aggregates enterprise data across all domains to generate real-time C-level executive dashboards, statutory VAS reports (B01-DN, B02-DN, B03-DN), sales velocity heat maps, and inventory turnover ratios.

## 2. Domain Authority Boundaries
- **Strict Read-Only Aggregator:** Authoritative for reporting views, metrics caching, and analytical query execution. Does not mutate domain records.

## 3. Data Contracts & APIs
- **Database Tables:** Analytical read models, materialized cache views.
- **APIs:**
  - `GET /api/reports/executive-summary` — High-level KPI aggregation (Revenue, Margin, Cash, Stock Value).
  - `GET /api/reports/financial/pl` — Income Statement.
  - `GET /api/reports/financial/balance-sheet` — Balance Sheet statement.

## 4. UI/UX Standards
- Interactive charts (Recharts / D3) with time interval selectors (Daily, Weekly, MTD, QTD, YTD).
- Numerical metrics rendered with `font-mono tabular-nums`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement automated scheduled PDF report delivery to executive emails.
- [ ] Add drill-through navigation from KPI widgets to source transactional vouchers.
