# NEXUSSYNC ERP — UI COMPONENT CONSISTENCY AUDIT

**Audit Date:** 2026-09-30  
**Auditor:** Senior Frontend Architect + UI/UX Design System Auditor + Enterprise ERP Forensic Reviewer  
**Status:** FORENSIC COMPONENT DUPLICATION AUDIT (READ-ONLY — ZERO CODE MODIFICATION)  

---

## 1. MỤC TIÊU & PHẠM VI KHẢO SÁT
Kiểm toán và lập hồ sơ toàn bộ các thành phần giao diện (UI Components) đang có sự **trùng lặp chức năng**, **sai lệch kiểu dáng (Visual Inconsistency)**, hoặc **phân mảnh mã nguồn** trên toàn bộ 43 phân hệ nghiệp vụ NexusSync ERP.

---

## 2. MA TRẬN TRÙNG LẶP THÀNH PHẦN (COMPONENT DUPLICATION MATRIX)

| Loại Thành Phần | Số biến thể song song | Danh sách tệp nguồn | Điểm khác biệt trực quan & Trải nghiệm (Visual & UX Differences) | Đánh giá Rủi ro |
| :--- | :---: | :--- | :--- | :---: |
| **Confirm Dialog** | 2 | 1. `/src/components/common/ConfirmDialog.tsx`<br>2. `/src/components/modals/ConfirmDialog.tsx` | - File 1: Dùng `z-[100]`, bo `rounded-2xl`, nút bo `rounded-xl`, màu nguy hiểm `rose-600`, hỗ trợ Escape key, hỗ trợ object state.<br>- File 2: Dùng `z-50`, bo `rounded-xl`, nút bo `rounded-lg`, màu nguy hiểm `red-600`, KHÔNG hỗ trợ Escape key, có hỗ trợ `dark:bg-slate-900` trong khi File 1 thiếu class dark. | **CRITICAL (P1)** |
| **Pagination** | 4 | 1. `/src/components/common/Pagination.tsx`<br>2. `/src/components/common/TablePagination.tsx`<br>3. `/src/components/common/PaginationControl.tsx`<br>4. Inline trong `/src/components/common/EnterpriseDataView.tsx` | - Biến thể 1: Active page màu tím chàm `bg-indigo-600`, nút `rounded-lg`, icon `w-4 h-4`.<br>- Biến thể 2: Active page màu xanh dương `bg-blue-600`, nút `rounded-md`, icon `w-3.5 h-3.5`.<br>- Biến thể 3: Có nhãn chữ "Trước"/"Sau", active page `ring-2 ring-indigo-500/20`, hỗ trợ `isLoading`.<br>- Biến thể 4: Hoàn toàn không có nút số trang, chỉ có điều hướng tiến lùi "Trang X / Y" và 4 nút mũi tên. | **HIGH (P1)** |
| **Status Badges** | 3 + Inline | 1. `/src/components/common/StatusBadge.tsx`<br>2. `/src/modules/sales/m14-sales-commission/components/M14Badges.tsx`<br>3. `/src/modules/sales/m15-returns/components/M15Badges.tsx`<br>4. Hơn 50+ thẻ `<span>` viết inline rải rác | - Thành phần chung 1: Hình oval tròn hoàn toàn `rounded-full`, viền ngoài, cỡ chữ `text-xs` hoặc `text-[11px]`.<br>- Module 2 & 3: Dùng kiểu hình chữ nhật bo nhẹ `rounded-md`, cỡ chữ `text-[10px]`, font monospace `font-mono font-bold`. | **HIGH (P2)** |
| **Detail Drawer** | 3 | 1. `/src/components/common/DetailDrawer.tsx`<br>2. `/src/components/common/QuickPreviewDrawer.tsx`<br>3. Slide-over inline trong `EnterpriseDataView.tsx` | - Cả 3 đều mở từ mép phải màn hình.<br>- Biến thể 1 & 2 hỗ trợ đầy đủ `dark:` modes và các kích cỡ `md` đến `3xl`.<br>- Biến thể 3 (EnterpriseDataView) bị hard-coded nền sáng `bg-white`, `border-slate-200`, không có class dark. | **HIGH (P2)** |
| **Data Tables** | 3 | 1. `/src/components/common/EnterpriseTable.tsx`<br>2. `/src/components/common/EnterpriseDataView.tsx`<br>3. Bảng HTML `<table>` tự dựng cục bộ tại các tab | - `EnterpriseTable` có ảo hóa Virtual Scrolling (`rowHeight`, DOM saving), lưu cấu hình cột (Column Presets), chỉnh độ rộng cột.<br>- `EnterpriseDataView` bọc ngoài `EnterpriseTable` nhưng bổ sung thanh search, filter, bulk action, phân trang.<br>- 39/43 phân hệ hiện tại vẫn dùng thẻ `<table>` HTML thuần được code riêng biệt tại từng file tab, dẫn đến giao diện không đồng đều về padding header, hover effect và thanh cuộn. | **HIGH (P1)** |

---

## 3. PHÂN TÍCH CHI TIẾT TỪNG NHÓM THÀNH PHẦN

### 3.1. Nhóm Hộp thoại Xác nhận (Confirm Dialog) — Rủi ro Vi phạm Rule #19
- **Thực trạng phát hiện:**
  - Cả 2 file cùng mang tên `ConfirmDialog.tsx` và đều được export độc lập.
  - Một số phân hệ (như M18, M30, M31, M32) import từ `@/components/common/ConfirmDialog`.
  - Một số phân hệ khác hoặc modal con lại import từ `@/components/modals/ConfirmDialog`.
- **Hậu quả trực quan:**
  - Khi mở ConfirmDialog từ `common`, modal có góc bo rất cong (`rounded-2xl` - 16px), phím tắt Esc hoạt động tốt, nhưng khi chuyển Dark Mode modal vẫn giữ nền trắng (`bg-white` không có `dark:bg-slate-900`).
  - Khi mở ConfirmDialog từ `modals`, modal có góc bo vừa (`rounded-xl` - 12px), đổi sang Dark mode màu xám đen tốt, nhưng bấm Esc không đóng được và màu nguy hiểm là `red-600` thay vì `rose-600` theo chuẩn Design Standards.

### 3.2. Nhóm Phân trang (Pagination Fragment)
- **Thực trạng phát hiện:**
  - 4 cách hiển thị thanh phân trang hoàn toàn khác nhau cùng xuất hiện trong một hệ thống ERP:
    1. Bấm số trang nhảy trực tiếp (1, 2, 3... 10) với màu tím chàm (`bg-indigo-600`).
    2. Bấm số trang nhảy trực tiếp với màu xanh dương (`bg-blue-600`).
    3. Bấm nút có chữ "Trước" / "Sau" kèm dấu ba chấm.
    4. Chỉ có 4 nút mũi tên (`<<`, `<`, `>`, `>>`) và text tĩnh "Trang 1 / 8".
- **Hậu quả trực quan:** Người dùng di chuyển giữa M13 (Sales) và M18 (Kho) hoặc M31 (Hóa đơn) sẽ thấy các thanh phân trang thay đổi hoàn toàn phong cách và vị trí nút bấm.

### 3.3. Nhóm Thẻ Trạng thái (Status Badges vs Code Pills)
- **Chuẩn quy định tại M18/M19:**
  - Status Badges bắt buộc dùng `rounded-full` kèm viền border và semantic color rõ ràng.
  - Code Pills (Mã SKU, Barcode, Vị trí Kệ) bắt buộc dùng `font-mono text-xs font-bold rounded-md bg-slate-100 border border-slate-300`.
- **Thực trạng phân mảnh:**
  - Tại M14 (Hoa hồng) và M15 (Đổi trả RMA), tác giả đã tạo ra các file riêng `M14Badges.tsx` và `M15Badges.tsx`, trong đó thẻ trạng thái lại được thiết kế theo dạng `rounded-md text-[10px] font-mono`.
  - Sự pha trộn giữa Status Badge hình con nhộng tròn (`rounded-full`) và hình chữ nhật (`rounded-md`) làm giảm tính trang trọng, đồng nhất của giao diện ERP doanh nghiệp.

### 3.4. Nhóm Nút Bấm Thao tác Chính (Primary CTA Buttons)
- **Phân mảnh màu sắc:**
  - Nhóm phân hệ Mua sắm (M08, M10) & CRM (M12): Dùng `bg-indigo-600 hover:bg-indigo-700`.
  - Nhóm Kho vận (M17, M18, M19, M20, M21) & Bán hàng (M13, M16): Dùng `bg-blue-600 hover:bg-blue-700`.
  - Nhóm R&D (M06) & Phân tích (M37): Dùng `bg-purple-600 hover:bg-purple-700`.
- **Phân mảnh kích thước & bán kính:**
  - Nút tại Domain Header L3: `px-3 py-1.5 text-xs font-semibold rounded-xl`.
  - Nút tại EnterpriseDataView: `px-4 py-2 text-xs font-semibold rounded-lg`.
  - Nút tại các Modal Form: `px-4 py-2 text-xs font-bold rounded-xl`.

---

## 4. TỔNG KẾT KIỂM TOÁN TÍNH NHẤT QUÁN THÀNH PHẦN
1. **Mức độ trùng lặp thành phần:** **CAO (High Fragmentation)**.
2. **Khuyến nghị cho Phase Design Token v2.0:**
   - Hợp nhất duy nhất 1 component `ConfirmDialog` chuẩn tại `/src/components/common/ConfirmDialog.tsx`, bổ sung Dark Mode và đạt 100% Rule #19.
   - Hợp nhất duy nhất 1 component `TablePagination` cho toàn bộ các bảng.
   - Thống nhất màu Primary CTA trên toàn bộ 43 module về một màu đại diện doanh nghiệp (Primary Brand Blue v2.0).
   - Thống nhất hình dáng Status Badge (luôn là `rounded-full`) và Code Pill (luôn là `rounded-md`).
