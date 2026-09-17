# M18 WAREHOUSE MANAGEMENT HUB TO SMART GUIDANCE HUB — FULL UI DESIGN SPECIFICATION (PHASE 2)

## 1. Design Language Extraction from M18
- **L0 Shell & Header**: Gradient header (`bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white border-b border-slate-800`), iconic badge wrapper (`rounded-2xl bg-blue-600 text-white shadow-inner border border-blue-400/40`).
- **L1 Navigation Sub-View / Tabs**: Clean rounded pills with active blue state (`bg-blue-600 text-white shadow-2xs`) and hover transitions.
- **L2 Summary KPI / Status Strip**: Card container with `bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm`.
- **L3 Content Area & Data Grid**: `bg-slate-50/50 dark:bg-slate-950` with structured card containers (`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900`).
- **Typography & Number Formatting**:
  - Headings: `text-sm font-bold text-slate-900 dark:text-white`
  - Codes / IDs / States: `font-mono font-bold text-xs text-blue-600 dark:text-blue-400`
  - Numeric stats: `font-mono tabular-nums font-bold text-slate-900 dark:text-white text-right`
- **Status Color Tokens (WCAG AA ≥ 4.5:1)**:
  - Active / Completed: `bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800`
  - Pending / Warning: `bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800`
  - Critical / Urgent / High Risk: `bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800`
- **Rule #19 Compliance**: Zero `window.alert` / `window.confirm`. Mandatory use of `ConfirmDialog.tsx`.
