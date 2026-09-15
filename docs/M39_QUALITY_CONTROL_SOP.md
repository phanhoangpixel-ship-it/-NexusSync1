# QUY TRÌNH THAO TÁC CHUẨN (SOP) - MODULE M39 (QUALITY CONTROL QMS)

## 1. MỤC ĐÍCH
Tài liệu này hướng dẫn bộ phận Quản lý Chất lượng (QA/QC), Admin và Quản đốc nhà máy cách sử dụng hệ thống Module M39 để ghi nhận kết quả kiểm định, theo dõi lỗi (NCR) và phân tích biến động chất lượng hàng ngày, đáp ứng các tiêu chuẩn ISO về QMS.

## 2. ĐỐI TƯỢNG ÁP DỤNG
- Quản lý QA/QC (QA/QC Manager).
- Nhân viên kiểm tra chất lượng (Inspectors).
- Quản đốc phân xưởng sản xuất.
- Admin Hệ thống.

## 3. CÁC BƯỚC THỰC HIỆN

### 3.1. Truy cập Module
- Đăng nhập vào hệ thống ERP bằng tài khoản có thẩm quyền.
- Trên thanh Menu (Navigation Bar) bên trái, mở rộng nhóm **12. Operations Support, Safety & Service**.
- Nhấp chọn **Quality Control QMS**.

### 3.2. Giám sát KPI Tổng Quan
- Khi mở màn hình, chú ý 3 khối dữ liệu (Card) trên cùng:
  - **Tỷ lệ Đạt (Pass Rate):** Thể hiện % sản phẩm/lô hàng đạt chuẩn so với tổng số lượng kiểm tra.
  - **NCR Đang Mở:** Thể hiện số lượng báo cáo lỗi cần được xử lý ngay lập tức.
  - **Phiếu Đang Chờ:** Các lịch kiểm định đã được lên nhưng chưa có kết quả (Pending).

### 3.3. Theo dõi Nhật ký Thanh tra (Inspections)
- Sử dụng thẻ **Nhật ký Thanh tra** (mặc định mở).
- Tại đây, hệ thống liệt kê các kiểm tra đầu vào (IQC), trong sản xuất (IPQC) và đầu ra (OQC).
- Có thể dùng thanh tìm kiếm để tra cứu nhanh mã phiếu (VD: QA-2608).
- Trạng thái màu sắc (Xanh: Đạt, Đỏ: Lỗi, Cam: Đang chờ) giúp nhận diện nhanh tình hình lô hàng.

### 3.4. Quản lý Báo cáo Không phù hợp (NCR)
- Chuyển sang thẻ **Báo cáo không phù hợp (NCR)**.
- Khi có một lô hàng bị đánh dấu Failed, một NCR thường sẽ được tạo để truy vết.
- Cột *Hành Động Khắc Phục* cho biết lô hàng sẽ bị hủy (Scrap) hay tái chế (Rework).
- Các NCR trạng thái **Open (Mở)** cần được theo dõi và đôn đốc giải quyết, sau đó cập nhật thành **Closed (Đóng)**.

### 3.5. Theo dõi Phân tích Chất lượng (Biểu đồ)
- Chuyển sang thẻ **Phân tích Chất lượng**.
- Xem biểu đồ cột **Xu hướng 7 ngày qua** để phát hiện các ngày có tỷ lệ Failed tăng bất thường.
- Xem biểu đồ tròn để biết phần lớn các ca Failed đang dẫn đến Scrap (thiệt hại lớn) hay Rework (có thể cứu vãn).

### 3.6. Cập nhật dữ liệu và Xuất báo cáo (PDF)
- Nhấp nút **Làm mới (Refresh)** ở góc phải trên cùng để đồng bộ số liệu mới nhất từ xưởng.
- Nhấp nút **Xuất PDF** để hệ thống gọi trình in mặc định. Chọn "Lưu dưới dạng PDF" (Save as PDF) để nộp báo cáo cho Ban giám đốc hoặc lưu hồ sơ kiểm toán.

## 4. XỬ LÝ SỰ CỐ
- **Biểu đồ không tải:** Bấm Làm mới.
- **Không in được hoặc mất định dạng:** Hãy chắc chắn kích hoạt tính năng "Background graphics" (In đồ họa nền) trên giao diện in của trình duyệt (Chrome/Edge) để các biểu đồ hiển thị đầy đủ màu sắc.
- Mọi thắc mắc kỹ thuật vui lòng liên hệ phòng IT thông qua module Service Desk.
