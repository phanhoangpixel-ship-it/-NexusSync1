# BÁO CÁO KẾT QUẢ THỰC THI & KIỂM THỬ HỆ THỐNG - MODULE M39
**Tên Module:** Quality Control QMS (Kiểm soát chất lượng)
**Domain:** GOVERNANCE / AUDIT (12. Operations Support, Safety & Service)
**Ngày thực hiện:** 28/08/2026

## 1. Định nghĩa thiết kế kiến trúc của Module M39
- **Mục tiêu:** Quản lý quy trình kiểm soát chất lượng (Quality Management System - QMS), hỗ trợ theo dõi các phiếu kiểm định (Inspections), ghi nhận và quản lý các báo cáo không phù hợp (Non-Conformance Reports - NCR).
- **Kiến trúc UI/UX:** Module được thiết kế thành Dashboard chuyên biệt, phân chia 3 phân vùng (Tabs):
  - **Tab 1: Nhật ký Thanh tra (Inspections):** Liệt kê các phiếu kiểm định chất lượng (IQC, OQC, IPQC), tình trạng Pass/Fail/Pending.
  - **Tab 2: Báo cáo không phù hợp (NCR):** Trích xuất các lỗi kiểm định, đánh giá mức độ nghiêm trọng (Severity) và biện pháp khắc phục.
  - **Tab 3: Phân tích Chất lượng:** Ứng dụng thư viện `recharts` để vẽ biểu đồ tần suất Pass/Fail (BarChart) và Tỷ trọng xử lý lỗi (PieChart).
- **Tích hợp:** Sử dụng hệ thống cảnh báo Toast, Icon Lucide để đánh dấu trạng thái (Badge). Hỗ trợ khả năng xuất báo cáo bản in (PDF).

## 2. Rà soát & Sửa lỗi các tính năng
- **Tình trạng trước đây:** Module M39 bị gắn vào màn hình `GenericModuleWorkspace` mặc định nên không hiển thị được dữ liệu và nghiệp vụ kiểm định.
- **Giải pháp:** 
  - Tạo mới Component `M39QualityControlWorkspace.tsx`.
  - Cập nhật định tuyến (routing) trong `App.tsx` để render đúng màn hình chức năng.
  - Tích hợp hàm in `window.print()` dành riêng cho báo cáo chất lượng thông qua nút "Xuất PDF".
  
## 3. Rà soát giao diện và tính năng hiển thị
- Cụm thẻ **KPI (Tỷ lệ Đạt, NCR Mở, Phiếu chờ)** được xếp linh hoạt `grid-cols-1 md:grid-cols-3` đảm bảo hiển thị đẹp trên mọi màn hình thiết bị (Responsive Mobile/Desktop).
- Các Badge trạng thái (Passed/Failed) được bo góc, mài màu nền (emerald/rose) rất rõ ràng, đảm bảo tiêu chí UX/UI hiện đại.
- **Tính năng In/Xuất PDF** được nhúng trực tiếp, kích hoạt trình in mặc định của hệ điều hành với layout được tối ưu. 

## 4. Luồng Test Dữ liệu & Thao tác thực tế
1. **Bước 1:** Đăng nhập vào hệ thống dưới quyền `QA/QC Manager` hoặc `Admin`.
2. **Bước 2:** Truy cập nhóm **12. Operations Support, Safety & Service** -> chọn **Quality Control QMS (M39)**.
3. **Bước 3:** Đọc lướt 3 thẻ KPI trên cùng để đánh giá tỷ lệ đạt (Pass Rate) tổng thể.
4. **Bước 4:** Ở tab **Nhật ký Thanh tra**, tìm kiếm và xem danh sách các phiếu IQC/OQC.
5. **Bước 5:** Chuyển qua tab **NCR**, kiểm tra các mã lỗi, mô tả lỗi và biện pháp khắc phục (Rework/Scrap).
6. **Bước 6:** Chuyển qua tab **Phân tích Chất lượng**, kiểm tra biểu đồ cột (Xu hướng 7 ngày) và biểu đồ tròn (Phân loại kết quả). Rê chuột để kiểm tra tooltip.
7. **Bước 7:** Bấm "Làm mới" (Loading icon xoay).
8. **Bước 8:** Bấm nút "Xuất PDF" để kiểm tra tính năng in.

## 5. Đề xuất bổ sung tính năng (Tương lai)
- **Tạo phiếu QA Inspection Live:** Xây dựng Form tạo phiếu QA cho phép nhân viên dưới xưởng chụp ảnh đính kèm minh chứng lỗi trực tiếp từ điện thoại.
- **Workflow Phê Duyệt NCR:** Bổ sung tính năng trình duyệt NCR cho phép QMR (Đại diện Lãnh đạo về Chất lượng) phê duyệt các phiếu Scrap (hủy hàng) có giá trị cao trước khi chuyển sang hệ thống Kế toán.
- **Tích hợp Barcode/QR Code:** Cho phép quét QR Code trên sản phẩm/lô hàng bằng Camera để truy xuất nhanh lịch sử QA của lô hàng đó.
- **CAPA Tracker (Hành động Khắc phục & Phòng ngừa):** Mở rộng NCR thành luồng CAPA chuẩn ISO 9001 để theo dõi hiệu quả phòng ngừa lỗi lặp lại.
