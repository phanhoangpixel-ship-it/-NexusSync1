# SOP: QUY TRÌNH QUẠCH ĐỊNH CHUỖI CUNG ỨNG & MRP (MODULE M26)

## 1. Mục Đích & Phạm Vi
Quy trình này quy định chuẩn mực vận hành cho **Module M26: Supply Chain SCM & MRP (Quản trị Chuỗi cung ứng)** trong hệ thống NexusSync ERP. Áp dụng cho các nhà hoạch định chuỗi cung ứng (Supply Chain Planners), quản lý thu mua và ban giám đốc.

## 2. Các Bước Vận Hành Chuẩn (Step-by-Step SOP)

### Bước 1: Khảo Sát Tổng Quan Mạng Lưới (Supply Chain Network Graph)
- Truy cập **Module M26: Supply Chain SCM** và chọn tab **🌐 Biểu Đồ Mạng Lưới**.
- Click vào từng nút (Node) như Nhà cung cấp, Kho trung tâm WMS, Nhà máy lắp ráp hoặc Trung tâm phân phối để kiểm tra trạng thái tồn kho, tài sản và phân tích nghẽn cổ chai (Bottleneck Analysis).

### Bước 2: Sử Dụng Thanh Tác Vụ Nhanh (Quick Action Bar)
- Sử dụng **Quick Action Bar** ngay trên đầu trang để:
  - **Chạy Thuật Toán MRP (`handleRunMrp`)**: Tự động kết nối API backend, tính toán nhu cầu ròng (Net Requirements) và cập nhật danh sách kế hoạch cung ứng.
  - **Phê Duyệt Hàng Loạt PO/MO**: Phê duyệt 1 chạm với hộp thoại xác nhận bảo mật (`ConfirmDialog`).
  - **Tái Cung Ứng Khẩn**: Kích hoạt bộ đệm dự trữ chiến lược giải quyết điểm nghẽn.

### Bước 3: Phân Tích Cân Bằng Cung Cầu & MRP
- Kiểm tra bảng cân bằng cung cầu chi tiết tại tab **Cân Bằng Cung Cầu MRP**.
- Theo dõi các đề xuất mua hàng (PO) và lệnh sản xuất (MO) cần thiết.

### Bước 5: Giám Sát Rủi Ro & Hiệu Ứng Roi Da (Risk & Bullwhip Mitigation)
- Truy cập tab **🛡️ Quản Lý Rủi Ro & Bullwhip**.
- Theo dõi chỉ số **Supply Chain Vulnerability Index** và các thành phần rủi ro (Biến động nhà cung cấp, rủi ro tồn kho, cổ chai sản xuất, sai số vận tải).
- Đánh giá biểu đồ khuếch đại nhu cầu dọc theo chuỗi (**Kênh phân phối ➔ Kho trung tâm ➔ Nhà máy ➔ Nhà cung cấp**).
- Nhấn **Tối Ưu Làm Mượt Nhu Cầu** để áp dụng chiến lược giảm thiểu hiệu ứng roi da qua cơ chế chia sẻ thông tin.

## 3. Kiểm Soát & Phê Duyệt (Rule #19 Compliance)
Mọi thao tác phê duyệt hàng loạt hoặc kích hoạt thuật toán đều được bảo vệ tuyệt đối bởi hộp thoại `ConfirmDialog`, ghi nhận nhật ký kiểm toán (Audit Trail) với mã băm SHA-256.

