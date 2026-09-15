# M37 BI & ANALYTICS REPORTS — FEATURE BASELINE BEFORE SYNC

**Document Reference:** `/docs/design-specs/M37_FEATURE_BASELINE_BEFORE_SYNC.md`  
**Module:** `M37` (BI & Analytics Reports)  
**Source Specification:** `/docs/design-specs/M41_MASTER_DESIGN_SPEC.md`  
**Target Workspace:** `/src/components/workspaces/M37BiAnalyticsWorkspace.tsx`  
**Date of Baseline:** 2026-09-11  

---

## 1. TỔNG QUAN PHÂN HỆ M37 TRƯỚC ĐỒNG BỘ

- **Tên Phân Hệ:** BI & Analytics Reports
- **Module ID:** `M37` | **Code:** `M37` | **Domain:** `GOVERNANCE / AUDIT`
- **Mục tiêu:** Cung cấp báo cáo phân tích thông minh, tháp báo cáo P&L, doanh thu, giá vốn, bóc tách cơ cấu sản phẩm và dữ liệu thô phục vụ kiểm toán tài chính và ra quyết định điều hành.
- **Quyền hạn truy cập (RBAC):** `['cfo', 'manager', 'admin']`

---

## 2. DANH MỤC TAB & FEATURE BASELINE MATRIX

| STT | Mã Tab | Tên Tab | API Endpoint / Nguồn Dữ Liệu | Hành Động Người Dùng | RBAC / SoD | Validation & Business Logic |
|:---:|:---|:---|:---|:---|:---|:---|
| 1 | `pnl` | **Tổng quan P&L** | Local State / `initialBiDataset` (Doanh thu, Giá vốn, Lợi nhuận gộp theo tháng) | - Chọn khoảng thời gian (Năm 2026, Quý 3, Quý 2, Tháng này)<br>- Xem biểu đồ ComposedChart (Bar + Line)<br>- Click vào cột doanh thu để mở Drill-down Modal (OLAP)<br>- Nút Làm mới (Refresh) có loading spinner<br>- Nút Xuất CSV & Nút In/PDF | CFO, Manager, Admin | - Tính toán lợi nhuận: `Revenue - COGS`<br>- Tooltip format VND<br>- Nhấp cột kích hoạt `setDrillDownMonth(month)` |
| 2 | `revenue` | **Phân tích Doanh thu & Giá vốn** | Local State / `initialBiDataset` | - Xem AreaChart so sánh tương quan xu hướng Doanh thu (Gradient tím) vs Giá vốn COGS (Gradient đỏ)<br>- Tương tác với RechartsTooltip & Legend<br>- Chuyển đổi bộ lọc thời gian | CFO, Manager, Admin | - Gradient defs `colorRev` & `colorCogs`<br>- ResponsiveContainer 100% |
| 3 | `data` | **Dữ liệu chi tiết** | Local State / `initialBiDataset` | - Bảng dữ liệu thô (Raw Data Grid) theo từng tháng<br>- Nút Lọc dữ liệu<br>- Hiển thị trạng thái "Tích cực" (Lợi nhuận $\ge 0$) hoặc "Cần chú ý" (Lợi nhuận $< 0$)<br>- Xuất file CSV chứa toàn bộ dòng dữ liệu có BOM UTF-8 | CFO, Manager, Admin | - Định dạng số phân tách hàng nghìn `toLocaleString()`<br>- Phân loại badge màu theo dấu của `profit` |
| 4 | `drillDownModal` | **Phân tích chuyên sâu (OLAP)** | Local State / `drillDownData` | - Xem biểu đồ PieChart cơ cấu doanh thu theo ngành hàng<br>- Bảng bóc tách chi tiết từng danh mục sản phẩm (Điện tử, Thời trang, Gia dụng, Thực phẩm)<br>- Nút đóng modal | CFO, Manager, Admin | - Phân bổ màu sắc `COLORS`<br>- Format tiền tệ khi hover tooltip |

---

## 3. STATE VÀ HOOKS CẦN BẢO TOÀN NGUYÊN VẸN

- `activeTab` quản lý qua hook `useWorkspaceSessionTab<'pnl' | 'revenue' | 'data'>('M37', 'pnl')`.
- `isLoading` quản lý trạng thái tải/làm mới.
- `timeRange` quản lý bộ lọc khoảng thời gian.
- `drillDownMonth` quản lý trạng thái mở/đóng modal phân tích OLAP.
- `handleRefresh` giả lập đồng bộ và gọi `onNotify`.
- `handleExportCSV` sinh Blob CSV UTF-8 với `[0xEF, 0xBB, 0xBF]` và tải xuống.
- `onNotify` truyền thông báo phản hồi tới hệ thống.

---

## 4. CAM KẾT BẢO TOÀN LOGIC & BẢO VỆ CHỨC NĂNG

1. **Không thay đổi**: Toàn bộ logic tính toán tài chính, dữ liệu biểu đồ, cấu trúc mảng CSV, cơ chế drill-down và hooks.
2. **Chỉ thay đổi**: Lớp giao diện JSX/Tailwind CSS theo đúng 100% token của `/docs/design-specs/M41_MASTER_DESIGN_SPEC.md` (Banner gradient L0, KPI cards L2, Sub-tabs bar L1, Table typography & contrast WCAG AA, Modals backdrop blur).
