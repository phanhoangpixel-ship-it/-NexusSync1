# M12 CRM — TIER 1 UNIVERSAL DESIGN TOKENS
## Universal Design Tokens Extraction (Cấp 1)

**Document Reference:** `/docs/design-specs/m12_TIER1_DESIGN_TOKENS.md`  
**Governing Standard:** Universal UI Sync Protocol (Rule #19 & Rule #20)  
**Source Module:** M12 CRM Leads (`/src/components/workspaces/m12/*`)  

---

## 1. HEADER BAR & NAVIGATION TOKENS
- **Header Background:** `bg-gradient-to-r from-slate-900 to-[#1e293b] text-white`
- **Breadcrumb Hierarchy:** `text-xs text-slate-400 font-medium` with chevron separators `text-slate-600`.
- **Title Typography:** `text-lg font-bold tracking-tight text-white flex items-center gap-2`.
- **Action Buttons in Header:** Rounded pill/rounded-md with solid primary fill (`bg-indigo-600 hover:bg-indigo-500 text-white`) or ghost outline (`border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200`).

---

## 2. CARD & CONTAINER TOKENS
- **Hub Header Card:** `bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm`
- **Metric / KPI Cards:** `bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200`
- **Inner Padding Rule:** Outer container padding (`p-6`) exceeds or equals inner element padding.

---

## 3. TYPOGRAPHY SCALE & NUMERICAL TOKENS
- **Heading 1 (Module Title):** `text-xl font-bold tracking-tight text-slate-900 dark:text-white`
- **Heading 2 (Section Title):** `text-base font-semibold text-slate-800 dark:text-slate-100`
- **Body Text:** `text-sm text-slate-600 dark:text-slate-300`
- **Caption / Metadata:** `text-xs text-slate-500 dark:text-slate-400`
- **Monospaced Financial & Numeric Data:** `font-mono tabular-nums font-bold text-right text-slate-900 dark:text-slate-100`

---

## 4. STATUS COLOR TOKENS (WCAG AA COMPLIANT)
- **Active / Success:** `bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800`
- **Pending / Warning:** `bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800`
- **Danger / Critical:** `bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800`
- **Info / Neutral:** `bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800`

---

## 5. INTERACTION & COMPONENT STANDARDS
- **Table Hover Class:** `hover:bg-slate-50/80 dark:hover:bg-slate-700/60 transition-colors`
- **Debounce Timing:** 250ms for search inputs.
- **Confirmation Dialog:** Mandatory `ConfirmDialog.tsx` usage for all destructive or sensitive actions (Rule #19). Zero `window.confirm` or `window.alert`.
