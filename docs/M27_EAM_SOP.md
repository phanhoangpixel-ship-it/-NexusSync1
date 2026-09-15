# SOP: QUY TRÌNH QUẢN TRỊ THIẾT BỊ & BẢO TRÌ (MODULE M27 - EAM / CMMS)

## 1. Mục Đích & Phạm Vi
Quy trình này quy định chuẩn mực vận hành cho **Module M27: EAM Asset Maintenance (Quản lý thiết bị & Bảo trì tài sản)** trong hệ thống NexusSync ERP. Áp dụng cho kỹ sư bảo trì, kỹ thuật viên nhà xưởng, quản lý tài sản và bộ phận tài chính kế toán.

## 2. Các Bước Vận Hành Chuẩn (Step-by-Step SOP)

### Bước 1: Quản Lý Hồ Sơ Tài Sản & Thiết Bị (Asset Registry)
- Truy cập **Module M27: EAM Asset Maintenance** và chọn tab **Hồ Sơ Thiết Bị & Tài Sản**.
- Theo dõi thông tin mã tài sản (`Asset Code`), số sê-ri, nhóm thiết bị, nguyên giá, giá trị sổ sách và trạng thái vận hành (`ACTIVE`, `MAINTENANCE`, `DECOMMISSIONED`).
- Click chọn từng thiết bị để xem sơ đồ phả hệ dòng đời (Lineage), nhật ký kiểm toán SHA-256 và các bút toán phân bổ chi phí khấu hao (GL Entries).

### Bước 2: Lập Kế Hoạch Bảo Dưỡng Định Kỳ (PM Plans)
- Kiểm tra danh sách kế hoạch bảo dưỡng định kỳ (Preventive Maintenance) tại tab **Kế Hoạch Bảo Dưỡng Định Kỳ**.
- Hệ thống tự động kích hoạt lịch trình bôi trơn, kiểm tra độ rơ trục vít me, hiệu chuẩn cảm biến định kỳ theo tần suất tuần/tháng/quý.

### Bước 3: Phát Hành & Quản Lý Phiếu Bảo Trì (Work Orders - CMMS)
- Truy cập tab **Phiếu Bảo Trì & Sửa Chữa**.
- Tạo mới phiếu công tác bảo trì định kỳ (`PREVENTIVE`) hoặc sửa chữa đột xuất (`CORRECTIVE`) bằng cách bấm nút **Tạo Phiếu Bảo Trì**, chỉ định kỹ thuật viên và mức độ ưu tiên.

### Bước 4: Nghiệm Thu & Ghi Nhận Chi Phí Sửa Chữa
- Sau khi hoàn tất công tác bảo dưỡng, bấm **Nghiệm Thu** trên phiếu tương ứng.
- Nhập chi phí thực tế (phụ tùng thay thế MRO) và thời gian dừng máy (`Downtime Hours`). Hệ thống tự động ghi nhận bút toán chi phí vào tài khoản 627 và cập nhật trạng thái `COMPLETED`.

### Bước 5: Giám Sát IoT & Sử Dụng Thanh Tác Vụ Nhanh (Quick Action Bar)
- Truy cập tab **📡 Giám Sát IoT & Dự Đoán** để kiểm tra trực tuyến nhiệt độ trục, độ rung động và chỉ số rủi ro dừng máy của từng trạm máy.
- Sử dụng **Quick Action Bar** ngay trên đầu trang để:
  - **Quét Cảm Biến IoT**: Chạy thuật toán AI Anomaly Detection phát hiện sớm nguy cơ hỏng hóc.
  - **Kích Hoạt PM Hàng Loạt**: Tự động sinh danh sách phiếu bảo trì cho các thiết bị đến hạn.

## 3. Kiểm Soát & Phê Duyệt (Rule #19 Compliance)
Mọi thao tác phát hành phiếu công tác bảo trì, thay đổi trạng thái tài sản và nghiệm thu chi phí đều được ghi nhận vào nhật ký kiểm toán bảo mật với mã băm SHA-256.
