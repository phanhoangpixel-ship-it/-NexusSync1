# M12 CRM & LEADS PIPELINE
## FULL UI/UX DESIGN SPECIFICATION (PHASE 0 - PHASE 2)

**Document Reference:** `/docs/design-specs/m12_FULL_UI_DESIGN_SPEC.md`  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Module Replication Protocol)  
**Source Module:** M12 CRM Leads Workspace (`/src/components/workspaces/M12CrmLeadsWorkspace.tsx`, `/src/components/workspaces/m12/*`)  
**Design Pattern Archetype:** Enterprise Modular Workspace with L0-L4 Hierarchy, Metric Cards, Single Stage Lifecycle Navigator, Master Table, Kanban Board, Timeline, BI Analytics, and Standardized Dark Header.

---

## 1. PHÂN TẦNG CẤU TRÚC GIAO DIỆN (L0 – L4 HIERARCHY)

M12 tuân thủ nghiêm ngặt mô hình 5 tầng trực quan:

- **L0 Header Banner (`M12WorkspaceHeader`)**:
  - Gradient nền đen xám doanh nghiệp: `bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md rounded-2xl p-6`.
  - Module Tag: `text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold`.
  - Subtitle: `text-xs text-slate-400 mt-0.5 font-medium`.
  - Nút chức năng phụ: `bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold px-3.5 py-2 border border-white/10`.
  - Nút hành động chính (Primary CTA): Nền màu điểm nhấn chủ đạo (`bg-emerald-600 hover:bg-emerald-500` hoặc `bg-purple-600 hover:bg-purple-500`), `text-white rounded-xl text-xs font-bold px-4 py-2 shadow-sm`.

- **L0 Lifecycle Pipeline Navigator (`M12LifecyclePipeline`)**:
  - Khung bao: `bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3`.
  - Tiêu đề thanh: `text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2`.
  - Khối bước tiến trình: Lưới responsive 5 cột (`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2`).
  - Nút bước đang chọn: `bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs`.
  - Nút bước bình thường: `bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-slate-100/70`.
  - Nhãn bước: `text-[10px] font-mono tabular-nums font-bold flex items-center gap-1`.

- **L2 Metric Cards Grid (`M12MetricCards`)**:
  - Lưới 4 cột: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`.
  - Thẻ chỉ số: `p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1`.
  - Icon squircle: `p-2 rounded-xl bg-emerald-50 text-emerald-600` (hoặc blue, purple, amber tương ứng).
  - Số liệu chính: `text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums`.

- **L3 Master Table & Views (`M12LeadsTab`, `M12QuotationsTab`)**:
  - Thanh tìm kiếm & lọc: `p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3`.
  - Bảng dữ liệu: `bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden`.
  - Dòng tiêu đề bảng: `border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/60 py-3 px-4`.
  - Dòng dữ liệu tương tác: `hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors py-3 px-4 text-xs`.

- **L4 Modals & Flyouts (`M12NewLeadModal`, `M12LeadDetailModal`, `M12ConvertLeadModal`)**:
  - Lớp phủ nền mờ: `fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4`.
  - Khung Modal: `bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full overflow-hidden`.
  - Header Modal: `p-5 bg-gradient-to-r from-slate-900 to-[#1e293b] text-white flex items-center justify-between`.

---

## 2. TYPOGRAPHY & TEXT STYLING TOKENS

- **Mã chứng từ & ID:** `font-mono font-bold text-xs` (hoặc `text-[10px]`, `text-[11px]`) kèm màu sắc nhận diện (`text-emerald-700`, `text-blue-700`, `text-purple-700`).
- **Số tiền & Số lượng:** `font-mono font-bold text-slate-900 dark:text-white tabular-nums text-right`.
- **Nhãn phân loại & Tag:** `text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded border`.
- **Tiêu đề phân mục:** `text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider`.

---

## 3. ĐỊNH DẠNG SỐ LIỆU & TIỀN TỆ VNĐ

- Dấu chấm phân cách hàng nghìn: `Number(value).toLocaleString('vi-VN') + ' VND'` hoặc rút gọn `' Tr VND'`, `' Tỷ VND'`.
- Thuế VAT & Tỷ lệ %: `Number(rate).toFixed(1) + '%'`.
- Bắt buộc dùng `??` (Nullish Coalescing) khi trích xuất giá trị số mặc định.

---

## 4. BẢNG MÀU STATUS COLOR TOKENS (CHUẨN WCAG AA)

| Trạng thái | Nền (Light / Dark) | Chữ (Light / Dark) | Viền (Light / Dark) |
|---|---|---|---|
| **CONFIRMED / WON / ISSUED** | `bg-emerald-50 dark:bg-emerald-950/50` | `text-emerald-700 dark:text-emerald-300` | `border-emerald-200 dark:border-emerald-700` |
| **INVOICED / PROPOSAL** | `bg-purple-50 dark:bg-purple-950/50` | `text-purple-700 dark:text-purple-300` | `border-purple-200 dark:border-purple-700` |
| **QUALIFIED / PACKING** | `bg-blue-50 dark:bg-blue-950/50` | `text-blue-700 dark:text-blue-300` | `border-blue-200 dark:border-blue-700` |
| **NEGOTIATION / STAGING** | `bg-amber-50 dark:bg-amber-950/50` | `text-amber-700 dark:text-amber-300` | `border-amber-200 dark:border-amber-700` |
| **DRAFT / NEW / PENDING** | `bg-slate-100 dark:bg-slate-800` | `text-slate-700 dark:text-slate-300` | `border-slate-300 dark:border-slate-600` |
| **CANCELLED / REJECTED / LOST** | `bg-rose-50 dark:bg-rose-950/50` | `text-rose-700 dark:text-rose-300` | `border-rose-200 dark:border-rose-700` |

---

## 5. COMPONENT & INTERACTION STANDARDS (RULE #19 & #20)

1. **Rule #19**: 100% cảnh báo nhạy cảm và xác nhận thao tác nghiệp vụ phải dùng `ConfirmDialog.tsx`. Tuyệt đối không dùng `alert()` hay `confirm()`.
2. **Table Row Hover**: `hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors`.
3. **Action Button Groups**: Các nút trong bảng gom nhóm với `flex items-center justify-end gap-1.5 flex-wrap`.
4. **Pagination**: Điều hướng phân trang 5 dòng/trang với bộ đếm trang hiện tại `Trang {curr} / {total}` và nút `Prev`, `Next`.
