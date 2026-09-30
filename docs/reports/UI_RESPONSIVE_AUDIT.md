# NEXUSSYNC ERP — UI RESPONSIVE & MULTI-RESOLUTION AUDIT

**Audit Date:** 2026-09-30  
**Auditor:** Senior Frontend Architect + UI/UX Design System Auditor + Enterprise ERP Forensic Reviewer  
**Status:** FORENSIC RESPONSIVE AUDIT (READ-ONLY — ZERO CODE MODIFICATION)  

---

## 1. TỔNG QUAN KIẾN TRÚC ĐA ĐỘ PHÂN GIẢI (MULTI-RESOLUTION ARCHITECTURE)

NexusSync ERP là hệ thống phần mềm doanh nghiệp được vận hành trên nhiều thiết bị với độ phân giải và tỷ lệ khung hình khác biệt:
- Màn hình siêu nét 2K / 4K (2560×1440, 3840×2160) của ban lãnh đạo / CFO.
- Màn hình chuẩn Full HD 1080p (1920×1080) tại văn phòng điều hành.
- Màn hình máy tính xách tay Laptop 13" - 15.6" (1366×768, 1440×900, 1600×900).
- Máy tính bảng Tablet công nghiệp (1024×768, 1280×800) tại hiện trường kho và xưởng.
- Thiết bị máy quét mã vạch cầm tay / POS bán lẻ (768×1024 hoặc 80mm máy in bill).

---

## 2. KHẢO SÁT HỆ THỐNG SMART FIT & DISPLAY SCALE TOKENS

Hệ thống hiện tại trang bị bộ điều khiển thu phóng động (Dynamic Display Scale Engine) tại `/src/components/common/GlobalThemeProvider.tsx` và `src/index.css`:

```css
:root {
  --app-scale: 1;
  --app-scale-pct: 100%;
}

.workspace-scalable-canvas {
  zoom: var(--app-scale, 1);
}
```

### 2.1. Ma trận Tự Động Thích Ứng (calculateSmartFit Matrix)

| Độ rộng màn hình (px) | Tỷ lệ Zoom gán | Nhận diện loại thiết bị | Đánh giá trải nghiệm thực tế |
| :--- | :---: | :--- | :--- |
| $\ge 2560\text{px}$ | **110%** | Màn hình 2K (1440p) / 4K UHD | Rất tốt: Chữ không bị quá nhỏ trên màn hình mật độ pixel cao. |
| $1800\text{px} - 2559\text{px}$ | **100%** | Full HD 1080p Chuẩn (1920×1080) | Chuẩn mực: Hiển thị nguyên bản toàn bộ thanh công cụ và bảng. |
| $1500\text{px} - 1799\text{px}$ | **95%** | Laptop 15.6" / Màn hình 1600×900 | Tốt: Giảm tải cuộn ngang trên laptop văn phòng thông dụng. |
| $1300\text{px} - 1499\text{px}$ | **85%** | Laptop 13" - 14" (1366×768 / 1440×900) | Tốt: Giữ các bộ lọc và nút thao tác trên cùng một hàng. |
| $1050\text{px} - 1299\text{px}$ | **80%** | Tablet ngang / Màn hình phụ HD (1280×720) | Khá: Giúp hiển thị đầy đủ bảng mà không vỡ thanh tác vụ. |
| $< 1050\text{px}$ | **75%** | Cửa sổ chia đôi / Thiết bị màn hình hẹp | Tối ưu cứu cánh để tránh gãy bố cục. |

---

## 3. KHẢO SÁT CHỐNG TRÀN VIỀN & CẮT CHỮ (OVERFLOW & TRUNCATION RESILIENCE)

### 3.1. Thanh điều hướng Tab nghiệp vụ (Module Tab Navigation)
- **Quy chuẩn đề ra:** Container phải có `overflow-x-auto scroll-smooth no-scrollbar flex-1`, các tab con phải có `whitespace-nowrap shrink-0` kèm nút cuộn trái/phải `ChevronLeft` / `ChevronRight`.
- **Thực tế kiểm toán:**
  - 18/43 phân hệ đã áp dụng tốt cơ chế cuộn tab ngang có nút bấm (M01, M17, M18, M19, M20, M21, M30, M31, M36).
  - 25/43 phân hệ còn lại dùng `flex flex-wrap gap-2` hoặc thanh tab thuần không có nút điều hướng cuộn, dẫn đến nguy cơ trên màn hình laptop 1366×768 bị rớt dòng làm đẩy bảng dữ liệu xuống dưới hoặc tràn viền phải.

### 3.2. Bảng dữ liệu nghiệp vụ (Data Table Overflow)
- **Header cố định & Cột đầu tiên (Sticky Behavior):**
  - Trong `EnterpriseTable.tsx`: Hỗ trợ `sticky top-0 z-30` cho header và `sticky left-0 z-40` cho cột đầu tiên (mã chứng từ / SKU).
  - Trong các bảng tự dựng (39/43 phân hệ): Đa phần bọc trong thẻ `div` có `overflow-x-auto`, tuy nhiên nhiều bảng thiếu class `sticky top-0`, khiến người dùng khi cuộn xuống dòng thứ 30 bị mất tiêu đề cột.
- **Quy tắc ngắt dòng ô bảng (Text-wrapping cadence):**
  - File `src/index.css` đã cài đặt engine bảo vệ nội dung số:
    ```css
    table td.font-mono, table td.tabular-nums, table td code, table td:has(button) {
      white-space: nowrap;
    }
    table td.cell-descriptive, table td.cell-balance {
      text-wrap: balance;
    }
    ```
  - **Phát hiện:** Khi màn hình co về kích thước mobile ($< 768\text{px}$), bảng có nhiều hơn 7 cột bắt buộc phải cuộn ngang. Các cột số tiền và hành động đã được bảo vệ không bị ngắt dòng chẻ đôi chữ số.

### 3.3. Cửa sổ Modal & Drawer Viewport Boundaries
- **Chiều cao tối đa (Max Height Constraint):**
  - Các modal (`FormModal.tsx`, `ConfirmDialog.tsx`, Detail Drawers) đều áp dụng `max-h-[90vh]` hoặc `max-h-[85vh]` kết hợp `overflow-y-auto`.
  - Điều này đảm bảo khi mở modal trên laptop 768px chiều dọc, thanh tiêu đề (Header) và nút bấm (Footer) vẫn luôn hiển thị trong khung nhìn, chỉ có nội dung form ở giữa là cuộn.

---

## 4. KHẢO SÁT CHUẨN IN ẤN ĐA ĐỊNH DẠNG (PRINT RESPONSIVENESS)

- **Chuẩn in A4 Doanh nghiệp:**
  - `src/index.css` có khối `@media print` ẩn hoàn toàn `#nexus-l0-header`, `#nexus-l1-sidebar`, `#nexus-l5-context-rail`, các nút bấm, backdrop modal và toast.
  - Khung in được giải phóng margin/padding để dàn trang tối đa trên khổ giấy A4 dọc (`size: A4 portrait`).
- **Chuẩn in Hóa đơn POS Nhiệt 80mm:**
  - Tồn tại cấu hình chuyên biệt `#print-receipt` với kích thước cứng `80mm` (`width: 80mm; max-width: 80mm; margin: 0; padding: 8px`), bảo đảm khi in hóa đơn bán lẻ tại M16 POS không bị tràn lề hay nhảy trang thừa.

---

## 5. DANH SÁCH BẤT THƯỜNG RESPONSIVE (RESPONSIVE ANOMALIES)

1. **Gap-RES-01 (L1 Sidebar trên Mobile/Tablet dọc):**
   - Thanh điều hướng chính L1 (`#nexus-l1-sidebar`) có độ rộng cố định `w-64` (256px) và không tự động ẩn/thu gọn thành mini-sidebar trên màn hình có độ rộng $< 1024\text{px}$. Điều này chiếm mất ~25-33% diện tích hiển thị trên tablet.
2. **Gap-RES-02 (Thanh FilterBar trên Laptop nhỏ):**
   - Khi có nhiều hơn 4 dropdown bộ lọc trên `FilterBar.tsx`, trên màn hình 1366px thanh này tự động ngắt thành 2-3 hàng, làm thu hẹp không gian dọc của bảng dữ liệu phía dưới.
3. **Gap-RES-03 (Bulk Action Bar vị trí cố định):**
   - `BulkActionBar.tsx` được định vị `fixed bottom-6 left-1/2 -translate-x-1/2`. Trên màn hình siêu nhỏ, thanh có thể che khuất các nút phân trang của bảng dữ liệu bên dưới nếu không có khoảng đệm (bottom padding offset).
