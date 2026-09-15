# QUY TRÌNH THAO TÁC CHUẨN (SOP) - MODULE M37 (BI & ANALYTICS REPORTS)

## 1. MỤC ĐÍCH
Tài liệu này hướng dẫn người dùng cuối (đặc biệt là Ban giám đốc, CFO và Quản lý cấp cao) cách sử dụng Module M37 để theo dõi sức khỏe tài chính của doanh nghiệp, thực hiện phân tích lợi nhuận, doanh thu và giá vốn một cách trực quan thông qua biểu đồ BI.

## 2. ĐỐI TƯỢNG ÁP DỤNG
- Giám đốc tài chính (CFO)
- Kế toán trưởng
- Admin Hệ thống
- Các Quản lý cấp cao (Managers)

## 3. CÁC BƯỚC THỰC HIỆN

### 3.1. Truy cập Module
- Đăng nhập vào hệ thống ERP NexusSync bằng tài khoản có quyền truy cập (`CFO`, `Manager`, `Admin`).
- Tại thanh Menu chính bên tay trái, cuộn xuống nhóm **12. Operations Support, Safety & Service**.
- Click chọn **BI & Analytics Reports**.

### 3.2. Xem Báo Cáo Tổng Quan (KPIs)
- Ngay khi vào màn hình, hàng trên cùng (KPI Row) sẽ hiển thị 3 chỉ số quan trọng nhất:
  - **Tổng Doanh Thu:** Xu hướng tích cực hiển thị màu xanh.
  - **Tổng Giá Vốn (COGS):** Xu hướng chi phí hiển thị màu đỏ khi cần lưu ý.
  - **Lợi Nhuận Gộp:** Cảnh báo trạng thái chênh lệch doanh thu / giá vốn.

### 3.3. Phân tích P&L (Tab Mặc Định)
- Sử dụng biểu đồ **Tổng quan P&L** (dạng cột kết hợp đường).
- Rê chuột vào các cột (Doanh thu) hoặc các điểm trên đường (Lợi nhuận) để xem Tooltip hiển thị số liệu chi tiết của từng tháng.

### 3.4. So sánh Tương quan Doanh thu & Giá Vốn
- Chuyển sang Tab **Phân tích Doanh thu & Giá vốn**.
- Sử dụng biểu đồ miền (AreaChart) để trực quan hóa khoảng chênh lệch giữa hai đường giá trị. Giúp quản lý phát hiện nhanh các giai đoạn có giá vốn tăng đột biến so với doanh thu.

### 3.5. Truy xuất Dữ liệu thô (Raw Data)
- Chuyển sang Tab **Dữ liệu chi tiết**.
- Sử dụng bảng lưới (Data Grid) để xem chính xác các giá trị bằng số cho từng kỳ báo cáo.
- Các giá trị lợi nhuận âm hoặc có rủi ro sẽ được đánh dấu bằng tag màu đỏ ("Cần chú ý").

### 3.6. Làm mới Dữ liệu & Báo cáo
- Để tải dữ liệu mới nhất từ hệ thống, bấm nút **Làm mới** ở góc trên bên phải. Chờ biểu tượng xoay dừng lại, hệ thống sẽ hiện thông báo thành công.

### 3.7. In & Xuất Báo Cáo PDF
- Để trích xuất báo cáo trình lên Ban giám đốc, sử dụng nút **Xuất PDF** trong màn hình, hoặc bấm trực tiếp vào biểu tượng **Máy in (Print)** ở góc trên bên phải màn hình hệ thống (Global Header).
- Chọn định dạng và xác nhận lệnh in/xuất.

## 4. XỬ LÝ SỰ CỐ THƯỜNG GẶP
- **Không thấy biểu đồ:** Đảm bảo trình duyệt đang sử dụng phiên bản mới nhất và không chặn JavaScript.
- **Dữ liệu hiển thị không khớp:** Bấm "Làm mới" để đồng bộ dữ liệu với Authoritative Core. Nếu tình trạng vẫn tiếp diễn, liên hệ IT Support.
