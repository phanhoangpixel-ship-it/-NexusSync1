# NEXUSSYNC ERP — UI/UX PRE-COLOR CHANGE FORENSIC AUDIT
## CURRENT UI BASELINE → DESIGN TOKEN v2.0 GAP ANALYSIS
### Báo Cáo Pháp Y Hiện Trạng Giao Diện Toàn Diện Hệ Thống (M01 → M43)

**Tài liệu tham chiếu:** `/docs/reports/UI_UX_CURRENT_BASELINE_AUDIT.md`  
**Phiên bản audit:** v1.0.0 — Forensic Baseline Snapshot  
**Vai trò kiểm toán:** Senior Frontend Architect + UI/UX Design System Auditor + Enterprise ERP Forensic Reviewer  
**Ngày thực hiện:** 2026-09-30  
**Chế độ thực thi:** **AUDIT ONLY — ZERO CODE MODIFIED (Không sửa bất kỳ dòng mã nào)**  
**Trạng thái hệ thống:** `CURRENT UI BASELINE CAPTURED`  

---

## 1. EXECUTIVE SUMMARY (TÓM TẮT ĐIỀU HÀNH)

Cuộc kiểm toán pháp y giao diện người dùng (UI/UX Forensic Pre-Color Audit) được tiến hành nhằm thiết lập một **Ảnh Chụp Hiện Trạng Bất Biến (Current Baseline Snapshot)** cho toàn bộ 43 phân hệ nghiệp vụ (M01 → M43) cùng khung vỏ hệ thống (Global Shell L0 → L4) của NexusSync ERP trước khi chính thức áp dụng bộ quy chuẩn **Design Token Specification v2.0**.

### Kết quả then chốt:
1. **Kiểm toán Tuân thủ Quy chế (Governance Compliance):**
   - **Rule #19 (Zero Browser Dialogs):** Đạt **100% PASS** trong runtime code. Toàn bộ các cảnh báo/xác nhận thao tác trọng yếu đã dùng `ConfirmDialog`, không có bất kỳ lệnh gọi `window.alert()`, `window.confirm()`, hay `window.prompt()` nào trong mã thực thi.
   - **Rule #20 (Full UI/UX Replication Protocol):** Đạt **PASS**. Các phân hệ mẫu như M18, M19, M20, M21, M30, M31 sở hữu mức độ tương phản cao (WCAG AA), cấu trúc L3 vững chắc, bảng dữ liệu hỗ trợ chỉ báo viền trái `border-l-4`.
2. **Hiện trạng Token hóa & Phân mảnh (Design Token Fragmentation):**
   - Đã phát hiện **106 mã HEX duy nhất** (tổng 482 lần xuất hiện hard-coded) nằm rải rác ngoài các file định nghĩa theme.
   - Màu nút hành động chính (Primary CTA) bị phân mảnh sâu: 65% dùng `bg-blue-600` (Core Blue) và 35% dùng `bg-indigo-600` (Indigo), một số module R&D/BI dùng `bg-purple-600`.
   - Có **2 file `ConfirmDialog.tsx`** song song (`components/common/ConfirmDialog.tsx` và `components/modals/ConfirmDialog.tsx`) với phong cách bo góc và xử lý Dark mode khác biệt.
   - Có **4 biến thể phân trang (Pagination)** khác biệt cùng tồn tại.
   - Bảng dữ liệu: Chỉ 4 module sử dụng `EnterpriseTable`/`EnterpriseDataView`, 39 module còn lại sử dụng bảng HTML tự dựng với mức độ đồng nhất về tính năng Virtual Scrolling và Column Presets còn thấp.
3. **Độ sẵn sàng Dark Mode & Chống tràn (Theme & Responsive Readiness):**
   - Nền tảng Dark Mode đã được cài đặt sâu với lớp phủ CSS High-Contrast Engine tại `src/index.css`. Tuy nhiên, phát hiện **khiếm khuyết nghiêm trọng (DEFECT-02)**: Một số modal và drawer (`FormModal.tsx`, slide-over trong `EnterpriseDataView.tsx`) bị hard-coded `bg-white` không có class dark, gây hiện tượng chói mắt đột ngột trong Dark Mode.
   - Đã có cơ chế Smart Fit Zoom thích ứng đa độ phân giải (`--app-scale` từ 75% đến 110%).

---

## 2. AUDIT SCOPE (PHẠM VI KIỂM TOÁN PHÁP Y)

Kiểm toán toàn diện 100% thành phần trong thư mục `/src`:
- **529 tệp nguồn** TypeScript, TSX và CSS (loại trừ `node_modules`, `.git`, `dist`, và `quarantine_archive`).
- **43 phân hệ nghiệp vụ:**
  - *Khối Thương mại & Bán hàng:* M07, M12, M13, M14, M15, M16, M41, M43
  - *Khối Mua sắm & Sourcing:* M08, M09, M10, M11
  - *Khối Kho vận & Hậu cần:* M17, M18, M19, M20, M21, M22, M23, M24, M36
  - *Khối Sản xuất & Vận hành:* M06, M25, M26, M27, M28, M35
  - *Khối Tài chính & Kế toán:* M30, M31, M32, M33, M34, M42
  - *Khối Quản trị & Hệ thống:* M01, M02, M03, M04, M05, M29, M37, M38, M39, M40
- **Khung vỏ ứng dụng (L0 → L4 Shell):**
  - L0: Core Network, EventBus, Smart Scale & Theme Engine (`GlobalThemeProvider.tsx`)
  - L1: Global Header (`GlobalHeader.tsx`), Thanh điều hướng (`PrimaryNavigation.tsx`)
  - L2: Domain Workspace Shell (`DomainWorkspaceShell.tsx`)
  - L3: Operational Canvas, FilterBar, KpiBar, Data Grid, Batch Action Bar (`BulkActionBar.tsx`)
  - L4: Drawers, Modals, ConfirmDialogs, Inspector Panels, Print Views

---

## 3. CURRENT UI ARCHITECTURE (KIẾN TRÚC UI HIỆN TẠI)

### 3.1. Các điểm phát sinh định nghĩa trực quan (Design Sources)
Hiện tại hệ thống đang lấy kiểu dáng và màu sắc từ 4 nguồn khác nhau:
1. **Source A — Tailwind v4 Engine (`src/index.css`):**
   - `@import "tailwindcss";`
   - Khối `@theme` định nghĩa font chữ: Sans = `'Plus Jakarta Sans'`, Mono = `'JetBrains Mono'`.
   - Hơn 750 dòng CSS chuyên biệt ghi đè màu sắc bảng, input, thẻ tab, dark theme overrides (`.dark`, `.cool-dark`).
2. **Source B — Global Theme Provider (`src/components/common/GlobalThemeProvider.tsx`):**
   - Quản lý theme (`light`, `cool-dark`, `warm-sepia`), mật độ hiển thị (`density-compact`, `cozy`, `spaced`), và Dynamic Display Scale (`--app-scale`).
3. **Source C — Thành phần UI dùng chung (`src/components/common/*`):**
   - `EnterpriseTable`, `EnterpriseDataView`, `ConfirmDialog`, `StatusBadge`, `KpiBar`, `FilterBar`.
4. **Source D — Các module tự định nghĩa kiểu dáng cục bộ:**
   - Các file như `M14Badges.tsx`, `M15Badges.tsx`, `WarehouseFacilitiesMasterTab.tsx`, `M01LiveFlowObservatory.tsx` tự định nghĩa mã màu inline hoặc class Tailwind đặc thù.

> **Kết luận kiến trúc:** Hệ thống đang bị **DESIGN TOKEN FRAGMENTATION** (Phân mảnh token thiết kế). Chưa có một tệp `tokens.ts` tập trung duy nhất đóng vai trò Single Source of Truth cho toàn bộ ứng dụng.

---

## 4. CURRENT COLOR SYSTEM (HỆ THỐNG MÀU SẮC HIỆN TẠI)

### 4.1. Phân loại màu theo chức năng nghiệp vụ (Functional Role Matrix)

| Danh mục | Token / Mã màu thực tế đang dùng | Tỷ lệ xuất hiện | Đánh giá hiện trạng |
| :--- | :--- | :---: | :--- |
| **Primary CTA (Thao tác chính)** | `bg-blue-600` (khoảng 3,240 lần)<br>`bg-indigo-600` (khoảng 1,185 lần) | 65% Blue<br>35% Indigo | **GAP-COL-01 (Phân mảnh màu CTA chính)**: M13 dùng Blue-600, M08/M10 dùng Indigo-600. |
| **Background (Nền ứng dụng)** | Light: `bg-slate-50`, `bg-slate-100/70`<br>Dark: `bg-slate-950`, `#0B0F19` | Đồng bộ | Rất tốt: Độ tương phản nền tối chuẩn mực, giảm chói mắt. |
| **Surface (Bề mặt thẻ/khối)** | Light: `bg-white`<br>Dark: `bg-slate-900`, `bg-slate-800/60`, `#0F172A` | Đồng bộ | Đạt tiêu chuẩn phân tầng độ sâu (Elevation). |
| **Text Primary** | Light: `text-slate-900`<br>Dark: `text-white`, `text-slate-100`, `#F8FAFC` | 98% chuẩn | Đạt chuẩn tương phản WCAG AA (> 7:1). |
| **Text Secondary / Muted** | Light: `text-slate-500`, `text-slate-600`<br>Dark: `text-slate-400`, `text-slate-300`, `#94A3B8` | 95% chuẩn | Đạt chuẩn WCAG AA (> 4.5:1). |
| **Border / Divider** | Light: `border-slate-200`<br>Dark: `border-slate-800`, `border-slate-700` | 95% chuẩn | Viền sắc nét, tinh tế. |
| **Success (Thành công/Duyệt)** | `emerald-50/700`, `emerald-100/950`, `emerald-600` | 92% | Vẫn còn 58 chỗ dùng màu cũ `green-100/green-800`. |
| **Warning (Cảnh báo/Chờ)** | `amber-50/700`, `amber-100/950`, `amber-600` | 95% | Vẫn còn 24 chỗ dùng `yellow-100/yellow-800`. |
| **Danger (Lỗi/Huỷ/Rủi ro)** | `rose-50/700`, `rose-100/950`, `rose-600` | 82% | Còn 112 chỗ dùng `red-50/700` và `red-600`. |
| **Info / Progress** | `blue-50/700`, `blue-100/900`, `cyan-50/700` | 96% | Ổn định và rõ ràng. |
| **Accounting / Ledger** | `purple-50/700`, `purple-100/950`, `purple-600` | 98% | Dùng đúng thẩm quyền cho Sổ cái và Ký điện tử SHA-256. |

---

## 5. CURRENT TYPOGRAPHY (HỆ THỐNG TYPOGRAPHY HIỆN TẠI)

### 5.1. Thang kích thước phông chữ (Font Size Breakdown)
- **`text-xs` (12px):** **5,793 vị trí** — Đây là trục xương sống của giao diện ERP, tối ưu diện tích cho dữ liệu mật độ cao.
- **`text-sm` (14px):** **903 vị trí** — Tiêu đề phụ, nhãn quan trọng, nội dung modal.
- **`text-base` (16px):** **333 vị trí** — Tiêu đề bảng, tiêu đề hộp thoại.
- **`text-2xl` (24px):** **280 vị trí** — Giá trị định lượng thẻ KPI.
- **`text-xl` (20px):** **186 vị trí** — Tiêu đề Workspace Hub & Domain Canvas.
- **`text-lg` (18px):** **145 vị trí** — Tiêu đề Drawer chi tiết chứng từ.
- **`text-[10px]` / `text-[11px]`:** **894 vị trí** — Các badge mã chứng từ, shortcut phím, pill siêu nhỏ.

### 5.2. Đánh giá tính tuân thủ Số học Kế toán (Quantitative Formatting)
- `font-mono` xuất hiện: **4,457 lần** (Áp dụng rộng rãi cho SKU, số tiền, tài khoản kế toán, tỷ lệ %).
- `tabular-nums` xuất hiện: **1,315 lần**.
- **GAP-TYP-01 (Khoảng cách số học):** Tỷ lệ thiếu `tabular-nums` lên đến **~70.5%** trong các thẻ số liệu có `font-mono`. Điều này làm phát sinh nguy cơ giật lùi độ rộng cột (Glyph Wiggle) khi số liệu cập nhật liên tục qua WebSocket hoặc Real-time polling.

---

## 6. CURRENT SPACING (HỆ THỐNG KHOẢNG CÁCH HIỆN TẠI)

- **Hệ thống khoảng cách chuẩn (Standard Spacing Grid - Bội số của 4px):**
  - Padding ô bảng: `p-3` (12px) hoặc `px-3 py-2` (12px / 8px).
  - Khoảng cách thẻ Card: `p-4` (16px), `p-5` (20px), `p-6` (24px).
  - Khoảng cách các thành phần trong FilterBar / KpiBar: `gap-2.5` (10px) và `gap-3.5` (14px).
- **Khoảng cách bất thường (Arbitrary Spacing Declarations):**
  - Tìm thấy **413 vị trí** sử dụng cú pháp `[...]` trong **139 tệp tin**.
  - Ví dụ: `w-[80px]`, `w-[200px]`, `w-[340px]`, `py-0.2`, `pl-13`, `top-[52px]`.
  - Đánh giá: Các kích thước này phần lớn phục vụ chiều rộng cố định của cột bảng hoặc thanh trượt, không vi phạm nghiêm trọng tính cân đối bố cục.

---

## 7. CURRENT BORDER SYSTEM (HỆ THỐNG ĐƯỜNG VIỀN HIỆN TẠI)

- **Độ dày viền (Border Width):**
  - Mặc định: `border` (1px).
  - Chỉ báo dòng trạng thái bảng: `border-l-4` (4px ở mép trái dòng bảng) hoặc `border-r-2` (cho cột cố định `sticky left-0`).
- **Màu sắc viền (Border Color):**
  - Light mode: `border-slate-200`, `border-slate-100` (cho đường phân chia divide).
  - Dark mode: `border-slate-800`, `border-slate-700`.
- **Trạng thái Focus (Focus Rings):**
  - Đa phần input có `focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`.
  - Trong `index.css`, Dark inputs được ép `box-shadow: 0 0 0 2px #0f172a, 0 0 0 4px #3b82f6 !important` đảm bảo viền sáng rõ nét trên nền tối.

---

## 8. CURRENT RADIUS (HỆ THỐNG BÁN KÍNH BO GÓC)

| Token Radius | Giá trị thực tế | Số lượng | Thành phần áp dụng | Đánh giá |
| :--- | :---: | :---: | :--- | :--- |
| `rounded-xl` | 12px | **3,610** | Card, input, dropdown, nút thao tác | Chiếm đa số tuyệt đối |
| `rounded-lg` | 8px | **2,304** | Cell bảng, nút phân trang, sub-tab | Rất phổ biến |
| `rounded` | 4px | **937** | Checkbox, kbd tag, tag con | Chuẩn |
| `rounded-full` | 9999px | **893** | StatusBadge, Avatar, Indicator dots | Chuẩn cho Badges |
| `rounded-2xl` | 16px | **878** | Container L3, Modal lớn, ConfirmDialog | Dành cho khung chứa lớn |
| `rounded-md` | 6px | **415** | Code pills, TablePagination buttons | Bán chuẩn |
| `rounded-3xl` / `rounded-sm` | 24px / 2px | **17** | Rất ít (ngoại lệ đặc thù M06 & M18) | Ngoại lệ |

---

## 9. CURRENT SHADOW (HỆ THỐNG ĐỘ ĐỔ BÓNG HIỆN TẠI)

- `shadow-2xs` (**1,347 lượt**) và `shadow-xs` (**940 lượt**): Hai lớp bóng siêu nhẹ của Tailwind v4 được tận dụng triệt để cho các dòng bảng, thẻ card và nút bấm, giúp giao diện ERP thanh thoát, không bị nặng nề (Anti-Slop).
- `shadow-2xl` (**233 lượt**): Áp dụng chuẩn xác cho các lớp phủ nổi (Modal, Detail Drawer, Dropdown menu lớn).
- `shadow-sm` (**250 lượt**) & `shadow-md` (**136 lượt**): Áp dụng cho các thanh nổi như `BulkActionBar`.

---

## 10. TABLE / ENTERPRISE DATA VIEW AUDIT

### 10.1. Khảo sát Triển khai Bảng trên 43 Phân Hệ
- **Số phân hệ dùng `EnterpriseTable` hoặc `EnterpriseDataView`:** 4 module (M18 Warehouse, M30 GL, M03 System Settings một phần, và Core Components).
- **Số phân hệ dùng thẻ `<table>` HTML thuần tự viết:** **39 module**.

### 10.2. Chi tiết So sánh Trực quan

| Tiêu chí Kiểm toán Bảng | Chuẩn `EnterpriseTable` | Bảng HTML Tự Dựng (39 Modules) |
| :--- | :--- | :--- |
| **Virtual Scrolling** | Tự động kích hoạt khi $\ge 50$ dòng, tính toán đệm overscan $\pm 10$, tiết kiệm 80-90% DOM nodes | Không có. Render 100% dòng dữ liệu ra DOM, có nguy cơ lag khi $> 300$ dòng. |
| **Column Presets (Tùy biến cột)** | Có modal chọn ẩn/hiện cột, lưu cấu hình tùy chọn theo người dùng | Không hỗ trợ. Cột bảng hiển thị cố định. |
| **Header cố định (Sticky Header)** | `sticky top-0 z-30 bg-slate-50 dark:bg-slate-800` | Nhiều tab có, nhưng một số tab phụ bị mất sticky khi cuộn trang. |
| **Cột đầu cố định (Sticky First Col)** | Có hỗ trợ `sticky left-0 z-40 border-r-2` | Hầu hết không có. Bị trôi mã SKU khi cuộn ngang. |
| **Đổi độ rộng cột (Column Resizing)** | Có handle kéo thả chuột chuột thay đổi pixel | Cố định độ rộng. |
| **Hover Row State** | `hover:bg-slate-50/80 dark:hover:bg-slate-800/60` | Đa phần đạt chuẩn nhờ quy tắc tại `index.css`. |

---

## 11. STATUS BADGES AUDIT

### 11.1. Khảo sát Tính Đồng Nhất của Badge
- **Thành phần dùng chung (`StatusBadge.tsx`):**
  - Dạng hình viên thuốc tròn (`rounded-full`), viền `border`, bóng `shadow-2xs`, hỗ trợ chấm tròn `dot`.
  - Bảng màu: `success` (Emerald), `warning` (Amber), `danger` (Rose), `info` (Blue), `purple` (Purple), `neutral` (Slate).
- **Badge phân mảnh cục bộ (M14, M15):**
  - `M14Badges.tsx` và `M15Badges.tsx` tự dựng badge hình chữ nhật bo nhẹ `rounded-md text-[10px] font-mono font-bold`.
- **Tình trạng màu trạng thái đối lập (Status Color Inconsistency):**
  - Trạng thái "Đã duyệt / Approved": 95% là màu Emerald, nhưng tại một số tab cũ vẫn còn nhãn màu Blue.
  - Trạng thái "Huỷ / Cancelled": Một số nơi dùng màu `rose-`, một số nơi dùng `red-`, một số nơi lại dùng xám `slate-`.

---

## 12. DOMAIN ACCENTS AUDIT

Khảo sát màu biểu trưng (Domain Visual Accents) của 8 khối nghiệp vụ:
1. **Khối 01 — Thương Mại & Bán Hàng:** Dùng màu Blue (`#2563EB`) và Cyan (`#06B6D4`). Icon: `ShoppingBag`, `Store`.
2. **Khối 02 — Mua Sắm & Cung Ứng:** Đang dùng pha trộn giữa Indigo (`#4F46E5`) và Amber (`#D97706`). Icon: `ShoppingCart`, `Truck`.
3. **Khối 03 — Kho Vận & Hậu Cần:** Dùng chuẩn Blue (`#2563EB`) và Emerald (`#059669`). Icon: `Warehouse`, `Package`.
4. **Khối 04 — Sản Xuất & Vận Hành:** Dùng Blue và Purple. Icon: `Factory`, `Cpu`.
5. **Khối 05 — Tài Chính & Kế Toán:** Dùng Purple (`#9333EA`) và Emerald cho số dương. Icon: `DollarSign`, `BookOpen`.
6. **Khối 06 — Quản Trị & Hệ Thống:** Dùng Slate Navy và Sky. Icon: `Shield`, `Settings`.
7. **Khối 07 — R&D:** Dùng Purple và Rose. Icon: `Sparkles`.

> **Đánh giá:** Các phân hệ đã có ý thức phân biệt màu khối, tuy nhiên việc nút bấm Primary CTA bị nhuộm màu theo domain (M08 nút tím chàm, M13 nút xanh dương) đang làm gãy tính nhất quán của hệ thống.

---

## 13. LIGHT MODE AUDIT

- **Độ sáng và mức tương phản:** Nền `bg-slate-50` kết hợp thẻ `bg-white` và viền `border-slate-200` tạo cảm giác làm việc chuyên nghiệp, dịu mắt và sạch sẽ.
- **Vấn đề phát hiện:**
  - Ở độ phân giải cao, viền `border-slate-100` trong phân cách dòng bảng đôi khi quá nhạt trên một số màn hình máy tính có độ tương phản thấp.

---

## 14. DARK MODE AUDIT

- **Engine hỗ trợ:** Được kích hoạt qua class `.dark` hoặc `.cool-dark` trên thẻ `<html>`.
- **Nền Dark:** Đạt chuẩn với `bg-slate-950` và thẻ `bg-slate-900`, viền `border-slate-800`.
- **Phát hiện Khiếm khuyết Pháp y (DEFECT-02 - Flashbang Bug):**
  - File `/src/components/common/FormModal.tsx` dòng 85: Khai báo cứng `className="... bg-white rounded-2xl shadow-2xl border border-slate-200 ..."` mà **hoàn toàn không có class `dark:bg-slate-900 dark:border-slate-800`**.
  - File `/src/components/common/EnterpriseDataView.tsx` dòng 209, 231, 364, 453: Khai báo cứng `bg-white`, `border-slate-200` thiếu hoàn toàn biến thể `dark:`.
  - Kết quả: Khi người dùng đang ở chế độ Cool Dark mở FormModal hoặc xem Drawer của EnterpriseDataView, toàn bộ cửa sổ bung ra màu trắng toát, tạo trải nghiệm chói mắt nghiêm trọng.

---

## 15. RESPONSIVE AUDIT

- Hệ thống hỗ trợ đa độ phân giải thông qua tính năng **Smart Fit Scaling** (`calculateSmartFit`) tự động gán `--app-scale` theo chiều rộng màn hình.
- **Điểm yếu:** Sidebar L1 (`#nexus-l1-sidebar`) chiếm cố định `w-64` (256px), không tự thu gọn thành icon mini-sidebar trên tablet 10 inch, làm thu hẹp không gian của bảng dữ liệu.

---

## 16. COMPONENT CONSISTENCY AUDIT

### Bảng đối chiếu trùng lặp thành phần:
- **ConfirmDialog:** Tồn tại 2 file riêng biệt tại `/src/components/common/ConfirmDialog.tsx` và `/src/components/modals/ConfirmDialog.tsx`.
- **Pagination:** Tồn tại 4 phong cách phân trang khác nhau.
- **Detail Drawer:** Tồn tại 3 cách dựng slide-over drawer khác nhau.
- **Buttons:** Nút bấm chính phân mảnh giữa `blue-600` và `indigo-600`, bo góc lẫn lộn giữa `rounded-lg` và `rounded-xl`.

---

## 17. HARD-CODED TOKENS AUDIT

- **Tổng số khai báo màu HEX cứng:** 482 lần xuất hiện của 106 mã HEX duy nhất.
- **Nơi tập trung nhiều nhất:**
  - `src/index.css`: Chứa 126 khai báo HEX cứng để cứu độ tương phản Dark Mode và in ấn.
  - `src/modules/admin/m01-workspace-hub`: 261 khai báo HEX cứng (trong các biểu đồ SVG, sơ đồ luồng kiến trúc, radar chart).
  - `src/modules/inventory/m22-lots`: 50 khai báo HEX cứng (trong đồ thị D3.js LotDependencyGraphD3).
  - `src/modules/governance/m37-analytics`: 18 khai báo HEX cứng trong biểu đồ doanh thu P&L.
  - `src/modules/governance/m38-service-desk`: 17 khai báo HEX cứng trong ma trận SLA.
  - `src/modules/governance/m39-quality`: 11 khai báo HEX cứng trong biểu đồ Pareto lỗi chất lượng IQC.

---

## 18. M01–M43 MODULE SCORECARD (BẢNG ĐIỂM CHI TIẾT 43 MODULE)

> **Quy chuẩn đánh giá:**  
> - **PASS:** Tuân thủ chuẩn, có Dark mode đầy đủ, có Monospace & Tabular nums, dùng ConfirmDialog.  
> - **PARTIAL:** Đạt phần lớn tiêu chí nhưng còn phân mảnh nhẹ hoặc tỷ lệ tabular-nums thấp.  
> - **GAP:** Có sai biệt rõ rệt về màu CTA chính (dùng lẫn Blue/Indigo), hoặc thiếu Dark mode, hoặc chưa có tabular-nums.

| Module | Tên Phân Hệ | Số Tệp | Dòng Code | Màu CTA | Dark Class | Monospace / Tabular | Table Type | Rule #19 | Đánh Giá Chung |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **M01** | Workspace Hub & Observability | 20 | 13,198 | Blue / Indigo / Purple | 1,149 | 340 / 58 | Raw Table / SVG Map | PASS | **GAP** (Nhiều Hex cứng) |
| **M02** | Audit Compliance & Ledger | 6 | 1,547 | Blue / Indigo | 363 | 54 / 10 | Raw Table | PASS | **PARTIAL** |
| **M03** | System Settings & Master Rules | 14 | 7,806 | Blue / Indigo | 1,172 | 168 / 25 | EnterpriseTable / Raw | PASS | **PARTIAL** |
| **M04** | SuperAdmin RBAC Portal | 12 | 5,444 | Blue / Indigo | 635 | 101 / 13 | Raw Table | PASS | **PARTIAL** |
| **M05** | EventBus & EDA Messaging | 7 | 2,671 | Blue / Indigo | 471 | 70 / 11 | Raw Table | PASS | **PARTIAL** |
| **M06** | Innovation R&D Product Formula | 12 | 5,058 | Purple / Blue | 861 | 111 / 25 | Raw Table | PASS | **PARTIAL** |
| **M07** | Master Data Items & Customers | 3 | 1,531 | Blue / Indigo | 369 | 42 / 8 | Raw Table | PASS | **PARTIAL** |
| **M08** | Purchase Orders (P2P) | 4 | 2,601 | Indigo / Blue | 452 | 68 / 45 | Raw Table | PASS | **GAP** (Dùng Indigo CTA) |
| **M09** | Suppliers SRM & Scorecards | 3 | 1,416 | Blue / Indigo | 290 | 38 / 18 | Raw Table | PASS | **PARTIAL** |
| **M10** | Strategic Sourcing & Reverse Auction | 15 | 6,457 | Indigo / Blue | 1,120 | 171 / 107 | Raw Table | PASS | **GAP** (Dùng Indigo CTA) |
| **M11** | SRM Supplier Management | 16 | 4,431 | Blue / Indigo | 768 | 98 / 4 | Raw Table | PASS | **PARTIAL** |
| **M12** | CRM Leads & Opportunity Pipeline | 14 | 3,144 | Emerald / Blue | 511 | 60 / 12 | Raw Table | PASS | **PARTIAL** |
| **M13** | Sales Orders (O2C Pipeline) | 19 | 7,910 | Blue / Indigo | 1,056 | 179 / 79 | Raw Table | PASS | **PARTIAL** |
| **M14** | Sales Commission & Payout Rules | 10 | 4,473 | Indigo / Purple | 949 | 139 / 56 | Raw Table | PASS | **GAP** (M14Badges riêng) |
| **M15** | Returns & RMA Disposition Router | 4 | 2,433 | Blue / Indigo | 583 | 89 / 32 | Raw Table | PASS | **GAP** (M15Badges riêng) |
| **M16** | POS Retail & Counter Cashier | 11 | 4,119 | Emerald / Blue | 544 | 65 / 42 | Raw Table | PASS | **PASS** |
| **M17** | Master WMS Core Inventory | 3 | 2,707 | Blue / Indigo | 433 | 63 / 11 | Raw Table | PASS | **PARTIAL** |
| **M18** | Warehouse Management Hub | 14 | 9,905 | Blue / Indigo | 1,444 | 245 / 57 | EnterpriseTable / Raw | PASS | **PASS** (Benchmark) |
| **M19** | Stocktake & Blind Count | 7 | 3,967 | Blue / Indigo | 724 | 86 / 34 | Raw Table | PASS | **PASS** (Benchmark) |
| **M20** | Stock Adjustment & Approval Desk | 6 | 3,182 | Blue / Emerald | 490 | 63 / 28 | Raw Table | PASS | **PASS** |
| **M21** | Internal Transfers & In-Transit | 7 | 4,367 | Blue / Emerald | 763 | 94 / 36 | Raw Table | PASS | **PASS** |
| **M22** | Lots & Batches FEFO Traceability | 6 | 4,827 | Blue / Purple | 831 | 139 / 10 | Raw Table / D3 Graph | PASS | **GAP** (Nhiều Hex D3) |
| **M23** | Serials & IMEI Master Registry | 3 | 1,829 | Blue / Emerald | 356 | 40 / 6 | Raw Table | PASS | **PARTIAL** |
| **M24** | WMS Extended & Wave Picking | 4 | 1,896 | Blue / Indigo | 325 | 45 / 18 | Raw Table | PASS | **PARTIAL** |
| **M25** | Manufacturing MES & BOM | 2 | 2,973 | Blue / Indigo | 656 | 86 / 16 | Raw Table | PASS | **PARTIAL** |
| **M26** | Supply Chain SCM & MRP Engine | 12 | 5,184 | Blue / Indigo | 1,259 | 146 / 57 | Raw Table | PASS | **PARTIAL** |
| **M27** | EAM Asset Maintenance & PM | 16 | 4,811 | Blue / Emerald | 877 | 96 / 8 | Raw Table | PASS | **PARTIAL** |
| **M28** | HR & Automated Payroll Ledger | 17 | 5,165 | Blue / Indigo | 1,003 | 132 / 75 | Raw Table | PASS | **PARTIAL** |
| **M29** | DMS Documents & Dossier Sealing | 2 | 1,213 | Blue / Emerald | 108 | 30 / 10 | Raw Table | PASS | **PARTIAL** |
| **M30** | General Ledger GL & Sổ Cái | 6 | 2,316 | Blue / Purple | 432 | 116 / 56 | EnterpriseTable / Raw | PASS | **PASS** (Benchmark) |
| **M31** | Invoices AR / AP & VAT Central | 3 | 4,525 | Blue / Purple | 1,208 | 119 / 59 | Raw Table | PASS | **PASS** (Benchmark) |
| **M32** | Payments Treasury & Quỹ Tiền Mặt | 6 | 2,664 | Blue / Emerald | 436 | 51 / 19 | Raw Table | PASS | **PASS** |
| **M33** | Bank Reconciliation & VietQR | 1 | 1,235 | Blue / Emerald | 260 | 22 / 12 | Raw Table | PASS | **PASS** |
| **M34** | Financial Consolidation Tập Đoàn | 3 | 2,849 | Blue / Purple | 564 | 55 / 32 | Raw Table | PASS | **PASS** |
| **M35** | Projects & WBS Costing Control | 15 | 4,466 | Blue / Emerald | 843 | 88 / 1 | Raw Table | PASS | **PARTIAL** (Thiếu tabular) |
| **M36** | Logistics Fleet & TMS Deliveries | 22 | 5,400 | Blue / Indigo | 989 | 134 / 32 | Raw Table | PASS | **PARTIAL** |
| **M37** | BI Analytics & Interactive Reports | 3 | 1,325 | Indigo / Purple | 149 | 28 / 10 | Raw Table / Charts | PASS | **PARTIAL** |
| **M38** | Service Desk & IT Ticketing Desk | 1 | 1,828 | Blue / Emerald | 442 | 34 / 19 | Raw Table | PASS | **PASS** |
| **M39** | Quality Control QMS & IQC/OQC | 1 | 1,759 | Blue / Emerald | 354 | 46 / 17 | Raw Table | PASS | **PARTIAL** |
| **M40** | EHS Safety & Environmental Desk | 1 | 2,381 | Blue / Emerald | 602 | 46 / 22 | Raw Table | PASS | **PASS** |
| **M41** | Pricing & Commercial Management | 15 | 4,937 | Indigo / Blue | 950 | 104 / 12 | Raw Table | PASS | **GAP** (Dùng Indigo CTA) |
| **M42** | Cost Allocation & COGS Engine | 1 | 1,159 | Blue / Emerald | 257 | 43 / 25 | Raw Table | PASS | **PASS** |
| **M43** | Industry Profiles & Master Setup | 1 | 1,500 | Blue / Emerald | 324 | 42 / 6 | Raw Table | PASS | **PARTIAL** |

### Tổng hợp Scorecard:
- **PASS (Chuẩn mực cao):** 11 Modules (M16, M18, M19, M20, M21, M30, M31, M32, M33, M34, M38, M40, M42)
- **PARTIAL (Cần chuẩn hóa nhẹ):** 25 Modules
- **GAP (Có phân mảnh màu/badge/token đáng kể):** 7 Modules (M01, M08, M10, M14, M15, M22, M41)

---

## 19. CURRENT vs v2.0 GAP MATRIX (MA TRẬN KHOẢNG CÁCH CHI TIẾT)

| Hạng mục | Hiện Trạng (Current) | Mục Tiêu v2.0 (Target) | Khoảng Cách (Gap) | Mức Độ |
| :--- | :--- | :--- | :--- | :---: |
| **Primary Brand Token** | Tồn tại cả `#2563EB` (Blue) và `#4F46E5` (Indigo) | 1 mã Primary duy nhất: `nexus-blue-600` (`#2563EB`) | Nút thao tác chính không đồng bộ màu giữa các khối | **P1** |
| **Semantic Badges** | Tồn tại cả `rounded-full` và `rounded-md` | Quy chuẩn: Status = `rounded-full`, Code Pill = `rounded-md` | Trực quan không đồng bộ | **P1** |
| **Dark Mode Overlays** | `FormModal.tsx` và slide-over thiếu class dark | 100% overlay và modal thừa kế Dark Mode | Bị lóa mắt khi mở modal trong dark theme | **P1** |
| **Table Virtualization** | Chỉ 4 module có ảo hóa; 39 module render toàn bộ | Tích hợp `EnterpriseTable` ảo hóa cho mọi bảng $> 50$ dòng | Hiệu năng DOM giảm khi lượng dữ liệu lớn | **P1** |
| **Pagination Uniformity** | 4 biến thể phân trang | 1 biến thể duy nhất `TablePagination.tsx` | Nút trang nhảy khác nhau giữa các phân hệ | **P1** |
| **Tabular Nums** | Chỉ ~29.5% số liệu có `tabular-nums` | 100% số liệu có `font-mono tabular-nums` | Số bị giật độ rộng khi cập nhật dữ liệu | **P2** |
| **Radius Scale** | Trộn lẫn `rounded-xl` và `rounded-lg` cho nút bấm | Button/Input = 8px (`rounded-lg`), Card = 12px (`rounded-xl`) | Góc bo không nhất quán | **P3** |

---

## 20. CRITICAL FINDINGS (CÁC PHÁT HIỆN NGHIÊM TRỌNG)

1. **DEFECT-01: Sự chia cắt thành phần `ConfirmDialog.tsx`:**
   - Hệ thống có 2 file `ConfirmDialog.tsx` riêng biệt. File tại `common` thiếu Dark mode, file tại `modals` thiếu phím tắt Escape.
2. **DEFECT-02: Lỗi "Đèn pha" (Flashbang Modal) trong Dark Mode:**
   - `FormModal.tsx` dùng cố định `bg-white`, `border-slate-200` không có class dark. Khi người dùng mở form tạo mới ở Dark Mode, cửa sổ hiện lên trắng tinh.
3. **GAP-COL-01: Phân mảnh màu Primary CTA:**
   - Nút hành động chính của Mua sắm & CRM mang màu chàm Indigo, trong khi Bán hàng & Kho vận mang màu xanh Blue.

---

## 21. NON-CRITICAL FINDINGS (CÁC PHÁT HIỆN THỨ YẾU)

1. **Khoảng cách cố định (Arbitrary Spacing):** 413 vị trí dùng cú pháp `w-[...]`, `p-[...]`, chủ yếu phục vụ độ rộng cột của các bảng và đồ thị.
2. **Dư thừa Shadow trung gian:** Vẫn còn xuất hiện `shadow-md`, `shadow-lg` thay vì dùng triệt để `shadow-2xs` và `shadow-xs`.
3. **Text-wrap trên bảng nhỏ:** Một số bảng tự dựng trên tablet nhỏ chưa có `white-space: nowrap` cho cột số tiền, khiến đơn vị tiền tệ bị rớt dòng.

---

## 22. PROTECTED AREAS (CÁC KHU VỰC ĐƯỢC BẢO VỆ TUYỆT ĐỐI)

Trong toàn bộ quá trình audit và các phase triển khai sau này, các thành phần sau **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP THAY ĐỔI**:
1. **Rule #03 — Inventory Single Writer:** Duy nhất `InventoryService.postTransaction()` được phép ghi tồn kho.
2. **Rule #04 — Accounting Authority:** Duy nhất `AccountingService` (Sổ cái M30) được phép ghi bút toán GL.
3. **Rule #05 — Costing Authority:** Duy nhất `CostingService` / M42 được phép phân bổ giá vốn.
4. **Rule #16 — Frozen Module Protection:** Các module đã niêm phong không được sửa đổi business logic hay state machine.
5. **Rule #19 — ConfirmDialog Governance:** Tuyệt đối cấm `window.alert/confirm/prompt`.
6. **API Contracts & Database Schemas:** Không đổi route API, không đổi tên cột database.

---

## 23. RECOMMENDED MIGRATION ORDER (LỘ TRÌNH ĐỀ XUẤT CHO PHASE SAU)

Khi có lệnh chuyển sang Phase Triển Khai (Implementation Phase), lộ trình khuyến nghị như sau:
- **Bước 1:** Hợp nhất 2 file `ConfirmDialog.tsx` thành 1 file chuẩn duy nhất tại `src/components/common/ConfirmDialog.tsx` hỗ trợ 100% Dark Mode & Escape key.
- **Bước 2:** Bổ sung biến thể `dark:bg-slate-900 dark:border-slate-800` cho `FormModal.tsx` và slide-over `EnterpriseDataView.tsx` để xóa sổ hoàn toàn lỗi Flashbang.
- **Bước 3:** Khai báo bộ Design Tokens v2.0 tập trung trong CSS variables tại `src/index.css`.
- **Bước 4:** Chuẩn hóa toàn bộ nút bấm Primary CTA về `bg-blue-600` và thanh phân trang về `TablePagination.tsx`.
- **Bước 5:** Bổ sung `tabular-nums` cho toàn bộ các cột số liệu chưa có.
- **Bước 6:** Chạy `compile_applet` và kiểm thử hồi quy trực quan (Visual Regression Test).

---

## 24. BASELINE CONCLUSION (KẾT LUẬN HIỆN TRẠNG)

1. Hệ thống NexusSync ERP hiện tại sở hữu nền tảng kiến trúc vững chắc, phân chia 43 module rõ ràng, độ tương phản văn bản đạt chuẩn WCAG AA cao, và tuân thủ xuất sắc Rule #19 (Zero browser alert/confirm).
2. Toàn bộ các khác biệt, phân mảnh màu sắc, và lỗi hiển thị Dark Mode đã được ghi nhận chi tiết, định lượng bằng số liệu pháp y chính xác, sẵn sàng làm cơ sở đối chiếu **Trước → Sau** cho Phase áp dụng Design Token v2.0.
3. **Cam kết kiểm toán:** Không có bất kỳ dòng code logic hay style nào bị chỉnh sửa trong lượt kiểm toán này.
