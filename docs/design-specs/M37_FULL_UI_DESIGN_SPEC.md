# M37 BI & ANALYTICS REPORTS WORKSPACE
## FULL UI/UX DESIGN SPECIFICATION — SINGLE SOURCE OF TRUTH (PHASE 0, 1 & 2)

**Document Reference:** `/docs/design-specs/M37_FULL_UI_DESIGN_SPEC.md`  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Module Replication Protocol) trong `GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`  
**Source Specification:** `/docs/design-specs/M41_MASTER_DESIGN_SPEC.md`  
**Target Module:** `M37` (BI & Analytics Reports)  
**File Triển Khai:** `/src/components/workspaces/M37BiAnalyticsWorkspace.tsx`  

---

## 1. MỤC LỤC DANH MỤC TAB M37 (PHASE 0 INVENTORY)

| STT | Mã Tab | Tên Tab Chức Năng | Loại Màn Hình | Vai Trò Chức Năng |
|:---:|:---|:---|:---|:---|
| 1 | `pnl` | **Tổng Quan P&L Theo Tháng** | Master Analytics View (ComposedChart) + KPI Strip | Phân tích lợi nhuận gộp theo từng tháng trong năm tài chính, kết hợp cột Doanh thu và đường Lợi nhuận gộp, tích hợp tương tác Drill-down OLAP mở modal bóc tách theo ngành hàng. |
| 2 | `revenue` | **Tương Quan Doanh Thu & Giá Vốn** | Area Density Chart (AreaChart) + KPI Strip | Phân tích trực quan tỷ trọng chi phí giá vốn (COGS) so với tổng doanh thu theo thời gian, theo dõi xu hướng biên an toàn với gradient fill. |
| 3 | `data` | **Bảng Dữ Liệu Thô (Raw Data)** | Master Data Table + Filter + CSV Export | Sổ cái dữ liệu thô phục vụ kiểm toán tài chính, hiển thị chi tiết số liệu từng kỳ kế toán kèm thẻ trạng thái hiệu suất hoạt động. |
| 4 | `drilldown_modal` | **Phân Tích Chuyên Sâu (OLAP)** | Modal Dialog + PieChart + Category Breakdown | Bóc tách cơ cấu doanh thu theo 4 danh mục sản phẩm chủ lực (Điện tử, May mặc, Gia dụng, Thực phẩm). |

---

## 2. BẢNG TRA CỨU ĐẶC TẢ THIẾT KẾ M37 THEO CHUẨN M41

### 2.1 Tầng L0: Workspace Banner
- Container: `p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4`
- Icon box: `p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0`
- Module chip: `px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold rounded border border-emerald-400/30`
- Standard chip: `px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold flex items-center gap-1`
- H1: `text-xl font-bold text-white mt-1`
- Description: `text-xs text-slate-300 mt-1 max-w-2xl`
- Controls: Filter thời gian (`bg-white/10 dark:bg-slate-800/80 border border-white/15 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white`), nút Làm mới (`bg-white/10 hover:bg-white/15`), nút Xuất CSV (`bg-emerald-600 hover:bg-emerald-500`), nút In/PDF (`bg-blue-600 hover:bg-blue-500`).

### 2.2 Tầng L2: KPI Summary Strip
- Grid: `grid grid-cols-1 md:grid-cols-3 gap-4`
- Card: `bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between`
- Label: `text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider`
- Value: `text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white`
- Trend note: `text-[11px] font-semibold mt-1 flex items-center gap-1`

### 2.3 Tầng L1: Sub-tabs Navigation Bar
- Container: `bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-2 flex items-center gap-2 overflow-x-auto scrollbar-none`
- Active: `px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer bg-blue-600 text-white shadow-xs`
- Inactive: `px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60`

### 2.4 Tầng L3: Table & Data Presentation
- Table Container: `bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden`
- Table Header: `bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-wider`
- Row Hover: `hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150`
- Values: `font-mono tabular-nums font-bold text-right`
- Status Badges:
  - Tích cực: `bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border`
  - Cần chú ý: `bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border`
