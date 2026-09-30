# ĐẶC TẢ THIẾT KẾ GIAO DIỆN TOÀN DIỆN M38 (IT SERVICE DESK & ITSM)
**Tài liệu chuẩn hóa UI/UX — Single Source of Truth cho Quy Trình Sao Chép Rule #20**  
**Source Module:** M38 — IT Service Desk & ITSM (`src/modules/governance/m38-service-desk/components/ServiceDeskWorkspace.tsx`)  
**Target Module:** M32 — Quản Lý Quỹ & Kho Bạc (`src/modules/finance/m32-payments/components/M32PaymentsTreasuryWorkspace.tsx`)  
**Tiêu chuẩn áp dụng:** WCAG AA Contrast, Zero-Pill Metadata, Rule #19 ConfirmDialog, Sticky Pagination.

---

## 0. KIỂM KÊ CÁC PHÂN VÙNG & TABS CỦA M38 (PHASE 0)
1. **L0 — Workspace Hero Banner:**
   - Class: `p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4`
   - Icon block: `p-2.5 bg-blue-600 text-white rounded-xl shadow-xs`
   - Badge cluster: Module Code (`bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold rounded border border-blue-400/30`), Rule Compliance badge (`bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-semibold`), SLA badge (`bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[10px] font-mono font-semibold`).
   - Action buttons: Xuất Báo Cáo CSV (`bg-emerald-600 hover:bg-emerald-500`), Mở Ticket Mới (`bg-blue-600 hover:bg-blue-500`), Đồng Bộ Dữ Liệu (`bg-white/10 hover:bg-white/15`).
2. **DeepLinkBanner:** Cổng điều hướng phân hệ phụ thuộc (M27 EAM, M34 RBAC).
3. **L1 — Navigation Tabs Bar:**
   - Container: `bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs p-1.5 flex flex-wrap items-center justify-between gap-2`
   - Tab active: `bg-blue-600 text-white shadow-xs`
   - Tab inactive: `text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white`
   - Tab Counter Badge: `px-2.5 py-0.5 rounded-full text-xs font-mono font-bold` (`bg-blue-700 text-white` khi active, `bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300` khi inactive).
   - Right Status: `ITIL v4 Service Operations` | `SLA Guarantee: 99.4%`.
4. **L2 — Dynamic KPI Stat Cards Strip (4 Cards):**
   - Container: `grid grid-cols-2 lg:grid-cols-4 gap-4`
   - Card: `bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between`
   - Value: `text-2xl font-bold font-mono tabular-nums` kèm màu trạng thái (`emerald`, `amber`, `rose`, `blue`).
5. **Tabs Chi Tiết:**
   - **Tab 1: `tickets` (Hàng Đợi Sự Cố & Tickets):** Master/List view table, status filter pills, multi-dropdown filter, table row highlight border-l-4, ConfirmDialog cho đóng/nâng cấp sự cố, slide-over detail drawer, sticky pagination.
   - **Tab 2: `assets_link` (Thiết Bị IT & Tài Sản Vận Hành):** Master/List view table, search, category filter, create asset modal, EAM M27 maintenance handover.
   - **Tab 3: `kb_solutions` (Kho Tri Thức & Giải Pháp KEDB):** Grid cẩm nang SOP, modal xem từng bước chuẩn, copy quy trình, bình chọn hữu ích, xuất bản SOP mới.
   - **Tab 4: `sla_analytics` (Phân Tích SLA & Hiệu Suất IT):** Dashboard Recharts (AreaChart phân bố sự cố theo thời gian, BarChart danh mục, PieChart tỷ lệ giải quyết, chỉ số CSAT & MTTR).

---

## 1. ĐẶC TẢ CHI TIẾT CÁC QUY CHUẨN DESIGN SYSTEM
- **Typography:**
  - Header: `text-xl font-bold text-white`, `text-xs text-slate-300`
  - Table header: `bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700`
  - Mã định danh: `font-mono font-bold text-blue-600 dark:text-blue-400 text-xs`
  - Số tiền / Chỉ số: `font-mono tabular-nums font-bold text-right`
- **Định dạng tiền tệ & số liệu:**
  - Số tiền: `(Number(val) || 0).toLocaleString('vi-VN')` kèm đơn vị `VNĐ`
  - Thu tiền (+): `text-emerald-600 dark:text-emerald-400`
  - Chi tiền (-): `text-rose-600 dark:text-rose-400`
- **Modal & ConfirmDialog:**
  - Tuyệt đối không dùng `window.alert` hoặc `window.confirm`.
  - Sử dụng `<ConfirmDialog state={confirmDialog} />` với các cấp độ `danger`, `warning`, `info`, `success`.
- **Slide-Over Detail Drawer & 360° Entity Broadcast:**
  - Mỗi khi click vào dòng dữ liệu, gọi `onSelectEntity` với payload chứa `lineage`, `auditTrail`, `glEntries`, và mở drawer xem chi tiết với khả năng tương tác (thêm ghi chú / ký duyệt).
- **Sticky Pagination:**
  - Tích hợp `<PaginationControl />` với `currentPage`, `totalPages`, `pageSize`, `totalItems`, `onPageChange`, `onPageSizeChange`.
