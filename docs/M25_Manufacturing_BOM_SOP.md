# SOP: QUY TRÌNH QUẢN LÝ SẢN XUẤT & ĐỊNH MỨC BOM (MODULE M25)

## 1. Mục Đích & Phạm Vi
Quy trình này quy định chuẩn mực vận hành cho **Module M25: Manufacturing & BOM (Sản xuất & Định mức kỹ thuật)** trong hệ thống NexusSync ERP. Áp dụng cho các kỹ sư lập kế hoạch sản xuất, quản đốc phân xưởng, kế toán giá thành và nhân viên kho.

## 2. Các Bước Vận Hành Chuẩn (Step-by-Step SOP)

### Bước 1: Khởi Tạo Định Mức Kỹ Thuật (BOM & Routing)
- Truy cập **Tab Định Mức BOM & Định Tuyến**.
- Xác định công thức nguyên vật liệu cho từng thành phẩm (SKU) và các công đoạn gia công tại các Trạm làm việc (Work Centers).

### Bước 2: Lập Lệnh Sản Xuất (Manufacturing Order - MO)
- Tại **Tab Lệnh Sản Xuất (MO)**, bấm **+ Tạo Lệnh Sản Xuất**.
- Khai báo: Sản phẩm, Định mức BOM, Số lượng kế hoạch, Trạm làm việc, và Độ ưu tiên.
- Hệ thống sinh mã lệnh MO tự động (VD: `MO-2026-001`) ở trạng thái `DRAFT`.

### Bước 3: Phát Lệnh & Giữ Chỗ Vật Tư (Release & Material Reservation)
- Bấm **Phát Lệnh (Release)**. 
- Hệ thống kiểm tra tồn kho vật tư (Inventory Core - M17) và thực hiện giữ chỗ (Allocate) theo đúng định mức BOM.

### Bước 4: Xuất Kho Nguyên Vật Liệu (Material Issue - TK 621)
- Bấm **Xuất Vật Tư (Issue)** khi đưa nguyên vật liệu vào dây chuyền sản xuất.
- Hệ thống hạch toán tự động: **Nợ TK 621 / Có TK 152**.

### Bước 5: Báo Cáo Sản Lượng Hoàn Thành & Nhập Kho (Production Reporting - TK 155)
- Khi hoàn tất gia công, bấm **Báo Cáo Sản Lượng (Report)**.
- Nhập số lượng đạt (Good Qty), phế phẩm (Scrap Qty), và số lô (`Batch Number`).
- Hệ thống tự động ghi nhận nhập kho thành phẩm: **Nợ TK 155 / Có TK 154**.

## 3. Kiểm Soát & Phê Duyệt (Rule #19 Compliance)
Mọi thao tác phát lệnh, xuất vật tư và báo cáo sản lượng đều phải thông qua hộp thoại xác nhận bảo mật `ConfirmDialog`, ghi nhận nhật ký kiểm toán (Audit Trail) với mã băm SHA-256.
