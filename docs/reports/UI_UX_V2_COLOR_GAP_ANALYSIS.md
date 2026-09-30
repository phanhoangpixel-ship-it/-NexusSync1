# NEXUSSYNC ERP — UI/UX COLOR & DESIGN TOKEN v2.0 GAP ANALYSIS

**Audit Baseline Document:** `/docs/reports/UI_UX_CURRENT_BASELINE_AUDIT.md`  
**Target Specification:** NexusSync ERP UI Color & Design Token Specification v2.0  
**Audit Role:** Senior Frontend Architect + UI/UX Design System Auditor + Enterprise ERP Forensic Reviewer  
**Status:** FORENSIC GAP ANALYSIS ONLY — ZERO CODE MODIFIED  

---

## 1. NGUYÊN TẮC ĐÁNH GIÁ (EVALUATION PRINCIPLE)

Theo quy chế kiểm toán hệ thống NexusSync ERP:
> **"KHÔNG GỌI GAP LÀ BUG."**  
> Mọi sai biệt với bản đặc tả Design Token v2.0 trước hết được phân loại là **CURRENT DIFFERENCE** (Sai biệt kiến trúc do tiến hóa hệ thống). Chỉ khi sai biệt đó gây lỗi chức năng, vi phạm độ tương phản accessibility WCAG AA, gây lỗi chìm màu (Color Invisibility) trên Dark Mode hoặc vi phạm Rule #19 / Rule #20 thì mới được phân loại là **DEFECT** (Khiếm khuyết kỹ thuật).

---

## 2. MA TRẬN KHOẢNG CÁCH TỔNG QUAN (CURRENT vs TARGET GAP MATRIX)

| Danh mục (Category) | Hiện trạng Hệ thống (Current Baseline) | Mục tiêu v2.0 (v2.0 Target) | Bản chất Sai biệt (Gap Description) | Mức độ Ưu tiên (Severity) | Phân loại (Classification) |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Colors — Primary CTA** | Phân mảnh giữa `blue-600` (65%) và `indigo-600` (35%) | Chuẩn hóa duy nhất 1 gam màu Primary Brand (Blue v2.0 `#2563EB`) | Nút tạo đơn, duyệt chứng từ, lưu dữ liệu không đồng nhất màu giữa các khối nghiệp vụ | **P1** | CURRENT DIFFERENCE |
| **Colors — Semantic Status** | Đa số là `emerald-50`, `amber-50`, `rose-50/100`, nhưng còn sót `red-` (112 chỗ), `green-` (58 chỗ) | Bộ semantic status hoàn chỉnh 100% WCAG AA: Emerald, Amber, Rose, Blue, Purple, Slate, Cyan | Một số badge cảnh báo lỗi vẫn dùng màu đỏ tươi `red-` gây chói mắt và lệch bảng mã quy chuẩn | **P1** | CURRENT DIFFERENCE |
| **Colors — Hard-coded Hex** | 106 mã HEX duy nhất rải rác trong 529 files (tổng 482 lượt khai báo) | 0% mã HEX hard-coded ngoài file định nghĩa Design Tokens | Khó bảo trì theme tập trung; không thể đổi bảng màu tập đoàn từ 1 điểm duy nhất | **P2** | CURRENT DIFFERENCE |
| **Theme — Dark Mode Leakage** | Nhiều modal (`FormModal.tsx`, slide-over trong `EnterpriseDataView`) nền `bg-white` cứng | 100% Surface có cặp đôi Light / Dark (`bg-white dark:bg-slate-900`) | Mở FormModal trong Dark Mode bị hiện tượng "đèn pha" (Flashbang): nền trắng tinh đè lên dark workspace | **P1** | **DEFECT** |
| **Theme — Cool Dark Overrides** | Sử dụng hàng chục rule `!important` trong `index.css` để cứu nét input | Token hóa tầng CSS variables (`--bg-surface`, `--text-primary`) tự động thừa kế | Phụ thuộc quá nhiều vào CSS override toàn cục thay vì token hóa tại cấp độ component | **P2** | CURRENT DIFFERENCE |
| **Typography — Tabular Nums** | 4,457 `font-mono` nhưng chỉ có 1,315 `tabular-nums` (~29.5%) | 100% số liệu tiền tệ, tồn kho, tỷ lệ % phải có cặp `font-mono tabular-nums` | Chữ số bị co giãn độ rộng khi render số thực hoặc số lẻ, làm cột số giật nhẹ khi tải | **P2** | CURRENT DIFFERENCE |
| **Border Radius** | Dao động mạnh giữa `rounded-xl` (12px), `rounded-lg` (8px), `rounded-2xl` (16px) | Quy chuẩn rõ ràng: Card = 12px (`rounded-xl`), Button/Input = 8px (`rounded-lg`), Badge = 9999px (`rounded-full`), Code Pill = 6px (`rounded-md`) | Các nút bấm và ô nhập liệu có góc bo không nhất quán trên cùng một trang màn hình | **P3** | CURRENT DIFFERENCE |
| **Shadows (Box Shadow)** | Sử dụng `shadow-2xs` (1,347) và `shadow-xs` (940) kết hợp `shadow-2xl` (233) | Chuẩn hóa hệ thống elevation 4 cấp: `none`, `subtle` (`shadow-2xs`), `medium` (`shadow-sm`), `overlay` (`shadow-2xl`) | Cơ bản đã khá tốt nhờ Tailwind v4, chỉ cần dọn dẹp các shadow trung gian thừa (`shadow-md`, `shadow-lg`) | **P3** | CURRENT DIFFERENCE |
| **Tables / Data Grid** | Chỉ 4/43 module dùng `EnterpriseTable`/`EnterpriseDataView`; 39/43 dùng `<table>` tự dựng | 100% Data Grid tại L3 kế thừa `EnterpriseTable` (Ảo hóa, Sticky header, Column Presets) | Bảng dữ liệu tại các module tự dựng thiếu tính năng cá nhân hóa cột hiển thị và tối ưu DOM khi dữ liệu lớn | **P1** | CURRENT DIFFERENCE |
| **Pagination** | 4 biến thể phân trang song song với màu sắc, kích thước và hành vi nút bấm khác nhau | 1 chuẩn `TablePagination` duy nhất đồng bộ toàn hệ thống | Trải nghiệm người dùng bị ngắt quãng khi di chuyển giữa các phân hệ | **P1** | CURRENT DIFFERENCE |
| **Confirm Dialog (Rule #19)** | 2 file song song: `common/ConfirmDialog` (thiếu dark) và `modals/ConfirmDialog` (thiếu Esc, sai màu) | 1 file chuẩn `ConfirmDialog.tsx` kế thừa đầy đủ Rule #19, WCAG AA, dark mode, animation mượt mà | Nguy cơ lập trình viên gọi nhầm file `modals/ConfirmDialog` làm mất phím tắt Escape | **P1** | **DEFECT** |
| **Domain Accents** | Icon và màu điểm xuyết chưa có quy định bảo vệ; một số module tự ý đổi sang tím hoặc xanh ngọc | 8 khối nghiệp vụ có 8 gam màu điểm xuyết đại diện (Domain Color Palette) | Nhận diện thị giác giữa các khối nghiệp vụ chưa thực sự rõ rệt | **P2** | CURRENT DIFFERENCE |
| **Responsive Resilience** | Màn hình hẹp có Smart Fit Zoom, nhưng Sidebar L1 cố định 256px và thanh tab một số module bị rớt dòng | Responsive Fluid Container với Collapsible Sidebar và 100% Tab có nút cuộn mượt | Mất diện tích thao tác trên máy tính bảng 10-12 inch | **P2** | CURRENT DIFFERENCE |

---

## 3. PHÂN TÍCH ĐỐI CHIẾU CHI TIẾT THEO TỪNG HẠNG MỤC

### 3.1. Phân Tích Khoảng Cách Bảng Màu (Color Token Gap)

#### A. Trục màu Chính (Primary Brand Tokens)
- **Hiện trạng:**
  - Khối Kho vận & Vận hành (M17, M18, M19, M20, M21) $\rightarrow$ Dùng `blue-600` (`#2563EB`).
  - Khối Mua hàng & CRM (M08, M10, M12, M14) $\rightarrow$ Dùng `indigo-600` (`#4F46E5`).
  - Khối R&D và BI (M06, M37) $\rightarrow$ Dùng `purple-600` (`#9333EA`).
- **Mục tiêu v2.0:**
  - Hệ thống chỉ được phép có **MỘT MÀU THƯƠNG HIỆU HỢP NHẤT** cho nút hành động chính (Primary Action CTA). Các màu khác chỉ được làm màu điểm xuyết cho domain badge hoặc icon.
  - Đề xuất v2.0: Toàn bộ nút hành động chính đổi về `Nexus Blue` (`bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs focus:ring-2 focus:ring-blue-500/20`).

#### B. Trục màu Bề mặt & Nền (Surface & Background Tokens)
- **Hiện trạng:**
  - Light mode: `bg-slate-50` cho nền chung, `bg-white` cho thẻ card, viền `border-slate-200`.
  - Dark mode: Có 2 trường phái:
    - Nhóm 1: `bg-slate-950` cho nền, `bg-slate-900` cho card, `border-slate-800`.
    - Nhóm 2 (M30, M31, M35): Dùng class tùy biến `.dark .finance-workspace` với mã màu cứng `#0B0F19` và `#0F172A`.
- **Mục tiêu v2.0:**
  - Hợp nhất chuẩn Surface Tokens:
    - `surface-canvas`: Light `#F8FAFC` (Slate-50) / Dark `#0B0F19` (Slate-950 deep)
    - `surface-card`: Light `#FFFFFF` (White) / Dark `#0F172A` (Slate-900)
    - `surface-elevated`: Light `#FFFFFF` / Dark `#1E293B` (Slate-800)
    - `surface-well`: Light `#F1F5F9` / Dark `#0B1120`

#### C. Trục màu Báo lỗi & Nguy hại (Danger / Error Tokens)
- **Hiện trạng:** Tồn tại song song cả `rose-` (chuẩn mới theo M18/M19) và `red-` (code cũ).
- **Mục tiêu v2.0:**
  - Loại bỏ hoàn toàn lớp màu `red-` trong UI nghiệp vụ, chuyển toàn bộ về dải màu `rose-`:
    - Light: `bg-rose-50 text-rose-700 border-rose-200`
    - Dark: `dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800`
    - Solid Danger CTA: `bg-rose-600 hover:bg-rose-700 text-white`

---

### 3.2. Phân Tích Khoảng Cách Typography & Kế Toán (Typography Gap)

#### A. Monospace & Tabular Nums (Rule #19)
- **Thực tế:** 4,457 vị trí dùng `font-mono`, nhưng chỉ 1,315 vị trí có thêm `tabular-nums`.
- **Nguyên nhân:** Nhiều lập trình viên chỉ viết `className="font-mono text-right font-bold"` mà quên mất `tabular-nums`.
- **Mục tiêu v2.0:**
  - Bổ sung helper component hoặc chuẩn hóa toàn bộ các cell số liệu qua `<MoneyCell />` và `<QtyCell />` đã tích hợp sẵn `font-mono tabular-nums text-right`.

#### B. Thang phân cấp Tiêu đề (Heading Hierarchy)
- **Hiện trạng:**
  - Tiêu đề module dao động giữa `text-sm font-bold` (tại L3 Domain Header) và `text-xl font-bold` (trong card của EnterpriseDataView).
- **Mục tiêu v2.0:**
  - L1 Brand Title: `text-sm font-bold`
  - L3 Workspace Title: `text-sm font-bold`
  - Modal Title: `text-base font-bold`
  - Section Heading: `text-xs font-bold uppercase tracking-wider`
  - Table Cell Text: `text-xs font-medium`

---

### 3.3. Phân Tích Khoảng Cách Bảng Dữ Liệu (Enterprise Table Gap)

| Tiêu chuẩn v2.0 | Tỷ lệ Đạt hiện tại | Chi tiết Khoảng cách |
| :--- | :---: | :--- |
| **Virtual Scrolling cho bảng $> 50$ dòng** | ~10% (Chỉ M18, M30 và EnterpriseTable dùng) | 39 module còn lại render toàn bộ DOM của danh sách, gây giảm FPS khi danh sách đạt $> 200$ dòng. |
| **Column Presets (Bật/Tắt & Lưu mẫu cột)** | ~10% | Chỉ các bảng gọi qua `EnterpriseTable` có nút `SlidersHorizontal` cho phép tùy biến cột. |
| **Hover chuẩn `hover:bg-slate-50/80`** | ~85% | Đa số module đạt chuẩn này, chỉ một số ít bảng phụ dùng `hover:bg-blue-50/30`. |
| **Chỉ báo viền trái `border-l-4` theo trạng thái** | ~40% | M18, M19, M20, M21, M30, M31 làm rất tốt. Các module khác dòng bảng chỉ có màu nền thông thường. |

---

## 4. DANH SÁCH DEFECTS CẦN KHẮC PHỤC KHI BƯỚC VÀO PHASE IMPLEMENTATION

1. **DEFECT-01 (ConfirmDialog Split):**
   - Sự tồn tại của 2 file `ConfirmDialog.tsx` (`src/components/common/ConfirmDialog.tsx` và `src/components/modals/ConfirmDialog.tsx`).
   - File `common` thiếu class Dark Mode. File `modals` thiếu xử lý phím tắt Escape.
2. **DEFECT-02 (Flashbang Modals trong Dark Mode):**
   - `FormModal.tsx` và slide-over trong `EnterpriseDataView.tsx` bị hard-coded nền trắng `bg-white` không có `dark:bg-slate-900`. Khi chuyển Dark mode, người dùng bị chói mắt nghiêm trọng.
3. **DEFECT-03 (Phân mảnh nút Active Pagination):**
   - Nút trang đang chọn tại `Pagination.tsx` và `PaginationControl.tsx` có màu `bg-indigo-600`, trong khi `TablePagination.tsx` dùng `bg-blue-600`.
4. **DEFECT-04 (Chữ số bị giật nhẹ do thiếu Tabular Nums):**
   - Hơn 3,100 vị trí số liệu tài chính có `font-mono` nhưng bị khuyết `tabular-nums`.

---

## 5. KẾ HOẠCH LỘ TRÌNH MIGRATION ĐỀ XUẤT (RECOMMENDED MIGRATION ORDER)

> **Lưu ý:** Đây chỉ là bảng đề xuất kỹ thuật cho tương lai, **KHÔNG thực hiện code trong phase này**.

1. **Giai đoạn 1 (Core Tokens & Common Shell Foundation):**
   - Cập nhật định nghĩa CSS Variables & Design Tokens v2.0 tại `src/index.css`.
   - Hợp nhất và sửa triệt để 2 `ConfirmDialog.tsx` thành 1 file chuẩn tại `src/components/common/ConfirmDialog.tsx` (100% Dark Mode & Escape key).
   - Sửa `FormModal.tsx` và `EnterpriseDataView.tsx` bổ sung `dark:bg-slate-900` triệt tiêu lỗi chói mắt Dark mode.
2. **Giai đoạn 2 (Hợp nhất Pagination & Primary Button Colors):**
   - Thống nhất duy nhất 1 component `TablePagination.tsx` với màu `bg-blue-600`.
   - Chuyển toàn bộ các nút `bg-indigo-600` tại M08, M10, M12, M14 về `bg-blue-600`.
3. **Giai đoạn 3 (Bổ sung Tabular-Nums & Code Pills):**
   - Rà soát các bảng dữ liệu, thêm `tabular-nums` cho toàn bộ các cột định lượng.
4. **Giai đoạn 4 (Triển khai diện rộng 43 Module):**
   - Đưa `EnterpriseTable` hoặc cập nhật bảng dữ liệu tại các module còn dùng `<table>` thuần.
   - Kiểm thử hồi quy trực quan (Visual Regression) trên cả 2 theme Light và Cool Dark.
