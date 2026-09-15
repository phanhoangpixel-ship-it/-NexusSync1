# QUY TRÌNH CHUẨN VẬN HÀNH (SOP) - MODULE M23: SERIALS & IMEI (QUẢN LÝ MÃ ĐỊNH DANH SỐ SERIAL & IMEI)

**Mã phân hệ:** M23  
**Tên hệ thống:** NexusSync ERP (Enterprise Resource Planning Suite)  
**Phạm vi áp dụng:** Kho vận WMS, Quản lý tài sản, Dịch vụ bảo hành, Bán hàng & Hỗ trợ kỹ thuật.  
**Phiên bản:** v2.0 • Updated & Verified (Production Ready)  

---

## 1. Mục Đích & Nguyên Tắc Vận Hành Cốt Lõi

### 1.1 Mục Đích
Quy trình này chuẩn hóa việc quản lý, kiểm soát và truy vết mã định danh đơn vị sản phẩm (`Unit-Level Traceability`) thông qua số Serial (Số máy) hoặc mã IMEI đối với các mặt hàng có giá trị cao, thiết bị y tế, thiết bị điện tử viễn thông và máy móc công nghiệp trong toàn bộ hệ thống NexusSync ERP.

### 1.2 Nguyên Tắc Bất Biến (Invariant Rules)
1. **Tính duy nhất tuyệt đối (`Unique Constraint`):** Mỗi số Serial hoặc IMEI trong toàn bộ hệ thống CSDL NexusSync ERP chỉ tồn tại duy nhất cho một đơn vị sản phẩm tại một thời điểm.
2. **Khóa liên kết trạng thái (`Status Locking`):** 
   - Sản phẩm có Serial đang ở trạng thái `SOLD`, `DEFECTIVE` hoặc `WARRANTY` tuyệt đối không được phép xuất kho trong các giao dịch bán hàng mới (`SO/GI`).
   - Mọi thay đổi trạng thái đều phải thông qua hộp thoại xác nhận bảo mật (`ConfirmDialog` - Rule #19) và ghi sổ nhật ký vòng đời (`Audit Trail`).
3. **Đồng bộ hóa đa phân hệ:** Dữ liệu serial được liên kết chặt chẽ với các module M08 (Purchase Orders), M13 (Sales Orders), M15 (Returns RMA), M16 (POS Retail), và M17 (Inventory Core).

---

## 2. Quy Trình Vận Hành Chi Tiết (Standard Operating Procedures)

### Bước 1: Đăng Ký & Nhập Kho Serial (Inward Registration)
- **Tác nhân:** Thủ kho (`Warehouse Operator`) / Bộ phận Quản lý Chuỗi cung ứng.
- **Thao tác:** 
  1. Khi nhận hàng từ Đơn mua hàng (PO) hoặc Lệnh sản xuất (MO), thủ kho truy cập phân hệ **M23 (Serials & IMEI)**.
  2. Bấm nút **"Đăng Ký Serial / IMEI"**, quét mã vạch hoặc nhập thủ công danh sách số Serial.
  3. Chọn mã SKU sản phẩm tương ứng, kho nhận (`Warehouse ID`) và ghi chú nguồn gốc nhập kho.
- **Kiểm soát hệ thống:** Hệ thống tự động kiểm tra trùng lặp. Nếu mã Serial đã tồn tại ở trạng thái `IN_STOCK`, hệ thống báo lỗi chặn giao dịch ngay lập tức.

### Bước 2: Quản Lý Vòng Đời & Trạng Thái (Lifecycle Management)
Hệ thống quản lý 5 trạng thái tiêu chuẩn:
- `IN_STOCK`: Đang lưu kho, sẵn sàng xuất bán hoặc điều chuyển.
- `SOLD`: Đã bán và bàn giao cho khách hàng (ghi nhận thông tin khách hàng và ngày kích hoạt bảo hành).
- `WARRANTY`: Đang được gửi bảo hành hoặc sửa chữa tại trung tâm kỹ thuật.
- `DEFECTIVE`: Hỏng / Lỗi, chờ xử lý RMA hoặc xuất trả nhà cung cấp.
- `IN_USE`: Đang sử dụng nội bộ doanh nghiệp.

### Bước 3: Xuất Kho & Đối Soát Bán Hàng (Outward & Sales Fulfillment)
- **Thao tác:** Khi xuất kho theo Đơn hàng bán (SO) hoặc giao dịch POS, hệ thống yêu cầu chọn chính xác các số Serial đang ở trạng thái `IN_STOCK`.
- **Cập nhật tự động:** Sau khi xác nhận xuất kho, trạng thái serial chuyển thành `SOLD`, gán tên khách hàng và thời hạn bảo hành tính từ ngày chứng từ.

### Bước 4: Kiểm Soát Bảo Hành & Xử Lý Sự Cố (Warranty & RMA)
- Theo dõi thời hạn bảo hành tự động (`warrantyStartDate` đến `warrantyEndDate`).
- Ghi nhận lịch sử sửa chữa, thay thế linh kiện và chuyển trạng thái sang `WARRANTY` hoặc `DEFECTIVE` khi có yêu cầu từ phòng dịch vụ khách hàng.

---

## 3. Quản Trị Phân Quyền & Kiểm Toán (RBAC & Audit Trail)
- **Phân quyền:** Chỉ tài khoản có vai trò Quản trị kho (`Warehouse Manager`) hoặc SuperAdmin mới được quyền đăng ký mới hoặc thay đổi trạng thái đặc biệt của Serial.
- **Kiểm toán:** Mọi hành động tạo mới, cập nhật trạng thái đều lưu vào bảng `serial_history` kèm dấu thời gian chuẩn ISO và mã định danh người thực hiện.
