# BÁO CÁO KẾT QUẢ THỰC THI & KIỂM THỬ HỆ THỐNG - MODULE M37
**Tên Module:** BI & Analytics Reports
**Domain:** GOVERNANCE / AUDIT (12. Operations Support, Safety & Service)
**Ngày thực hiện:** 28/08/2026

## 1. Định nghĩa thiết kế kiến trúc của Module M37
- **Mục tiêu:** Cung cấp giải pháp báo cáo phân tích thông minh (Business Intelligence), tháp báo cáo P&L (Profit and Loss - Lợi nhuận và Lỗ), phân tích doanh thu và giá vốn (COGS).
- **Kiến trúc UI/UX:** Module được thiết kế dưới dạng Dashboard tổng quan (Workspace) với các tabs chuyên biệt:
  - **Tab 1: Tổng quan P&L:** Biểu đồ ComposedChart kết hợp giữa Bar (Doanh thu) và Line (Lợi nhuận) giúp dễ dàng theo dõi xu hướng lợi nhuận ròng.
  - **Tab 2: Phân tích Doanh thu & Giá vốn:** Biểu đồ AreaChart giúp so sánh trực quan độ lớn và khoảng chênh lệch giữa Doanh thu và Giá vốn.
  - **Tab 3: Dữ liệu chi tiết (Raw Data):** Bảng Data Grid hiển thị dữ liệu thô chi tiết, hỗ trợ rà soát từng dòng báo cáo.
- **Tích hợp:** Sử dụng thư viện `recharts` cho các biểu đồ phân tích tĩnh, sử dụng hệ thống Design System chung của ứng dụng (Tailwind CSS, Lucide Icons) để đảm bảo đồng nhất UX. Hỗ trợ hiển thị trên nhiều thiết bị (Responsive).

## 2. Rà soát & Sửa lỗi các tính năng
- **Tính năng được thiết kế:**
  - Workspace riêng biệt thay vì sử dụng `GenericModuleWorkspace`.
  - Các KPIs tổng thể: Tổng doanh thu, Tổng giá vốn, Lợi nhuận gộp.
  - Tích hợp tính năng In/Xuất PDF.
- **Vấn đề đã xử lý:**
  - M37 trước đây sử dụng `GenericModuleWorkspace` chung, không có biểu đồ hoặc số liệu.
  - Đã xây dựng component `M37BiAnalyticsWorkspace.tsx` chuyên biệt với `recharts`.
  - Nút "Xuất PDF" trong workspace đã được liên kết với hướng dẫn sử dụng tính năng Print/PDF Global từ thanh Header của hệ thống (`PdfPrintModal`).

## 3. Rà soát giao diện và tính năng hiển thị
- Giao diện được xây dựng bằng Tailwind CSS, thiết lập `grid-cols-1 md:grid-cols-3` cho KPIs để scale nội dung hiển thị mượt mà trên Mobile (1 cột) và Desktop (3 cột).
- Các biểu đồ sử dụng `<ResponsiveContainer width="100%" height="100%">` của `recharts` tự động co giãn theo chiều rộng màn hình.
- Tính năng **In/Xuất PDF** hoạt động tốt thông qua `PdfPrintModal` kế thừa từ kiến trúc chung.

## 4. Luồng Test Dữ liệu & Thao tác thực tế
1. **Bước 1:** Đăng nhập dưới quyền `CFO` hoặc `Admin`.
2. **Bước 2:** Chọn module `M37 - BI & Analytics Reports` từ thanh bên trái.
3. **Bước 3:** Kiểm tra giao diện KPI Row hiển thị đúng số liệu Tổng Doanh thu, Tổng Giá vốn, Lợi nhuận. Các số âm hiển thị màu đỏ, số dương hiển thị màu xanh lá.
4. **Bước 4:** Chuyển đổi giữa các tab "Tổng quan P&L", "Doanh thu & Giá vốn", "Dữ liệu chi tiết". Các biểu đồ chuyển đổi mượt mà và render đúng dữ liệu mock.
5. **Bước 5:** Bấm nút "Làm mới", theo dõi trạng thái loading.
6. **Bước 6:** Bấm biểu tượng "In" trên header hoặc "Xuất PDF", kiểm tra modal xuất báo cáo.

## 5. Đề xuất bổ sung tính năng (Tương lai)
- Bổ sung bộ lọc thời gian (Time Range Picker) để tùy chỉnh hiển thị biểu đồ theo Quý/Năm.
- Tích hợp AI Insights: Dùng Gemini API sinh ra một đoạn nhận xét/khuyến nghị ngắn về tình hình tài chính của tháng hiện tại so với tháng trước.
- Thêm tính năng phân tích (Drill-down) chi tiết doanh thu theo danh mục sản phẩm (tích hợp M07/M17) hoặc theo chi nhánh.
- Tích hợp khả năng xuất dữ liệu thô (Raw Data) ra tệp Excel (CSV) thay vì chỉ xem trên lưới.
