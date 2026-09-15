# BÁO CÁO KẾT QUẢ THỰC THI & KIỂM THỬ PHÂN HỆ M13 — SALES ORDERS (O2C)

**Dự án:** NexusSync ERP (Hệ thống Quản trị Doanh nghiệp Tích hợp Đa tầng L0 - L5)  
**Phân hệ trọng tâm:** M13 — Sales Orders (Đơn đặt hàng B2B, Giữ chỗ Tồn kho & Order-to-Cash)  
**Ngày báo cáo:** 28/08/2026  
**Trạng thái hệ thống:** Build Succeeded (100% Không lỗi)

---

## 1. ĐỊNH NGHĨA PHÂN HỆ M13 & SO SÁNH VỚI SOP MODULE

### A. Định nghĩa phân hệ M13 (Sales Orders - O2C):
Phân hệ **M13 (Sales Orders)** thuộc nhóm `04. Sales, CRM & O2C Suite` (Order-to-Cash / Commerce), chịu trách nhiệm:
1. Tiếp nhận và xác nhận các đơn đặt hàng B2B chính thức (`Sales Orders - SO`) từ khách hàng.
2. Kiểm tra tính sẵn có của hàng hóa và kích hoạt cơ chế giữ chỗ tồn kho (`Inventory Reservation / Allocated Qty`) thông qua WMS/Inventory Core.
3. Vận hành quy trình Order-to-Cash (O2C) chuyển giao đơn hàng sang khâu soạn hàng (`Picking`), đóng gói (`Packing`), xuất kho (`Goods Issue`) và lập hóa đơn tài chính.

### B. So sánh giữa Code triển khai thực tế và SOP (Quy trình chuẩn doanh nghiệp):
* **SOP Chuẩn:** Đòi hỏi doanh nghiệp phải có sự phân định rõ ràng giữa cơ hội kinh doanh CRM (`Opportunity`) và đơn hàng thương mại chính thức (`Sales Order`), đồng thời quản lý chặt chẽ trạng thái giữ chỗ (`Reservation`) mà không làm giảm tồn kho vật lý trực tiếp.
* **Triển khai Thực tế trên M13 Workspace:** Đã hiện thực hóa toàn bộ tiêu chuẩn SOP thông qua hệ thống **4 Tab Chuyên biệt** (*Danh sách Đơn hàng SO*, *Giữ chỗ Tồn kho Reservation*, *Quy trình Xuất kho WMS Fulfillment*, và *Phân tích Doanh số Analytics*), kết hợp tính năng xác lập đơn hàng mới, xem chi tiết modal và đồng bộ phả hệ L5 Context Rail.

---

## 2. KIỂM TRA CHI TIẾT & CÁC TASK TÍNH NĂNG TRÊN M13

- **Giao diện Workspace Chuyên biệt (`M13SalesOrdersWorkspace.tsx`):** Thay thế giao diện chung chung bằng giao diện quản trị Sales Orders cao cấp.
- **Form Xác lập Đơn hàng B2B Mới:** Cho phép nhập tên khách hàng, mã SKU, số lượng và tổng giá trị đơn hàng ngay trên giao diện.
- **Modal Chi tiết & Tích hợp L5:** Khi click xem chi tiết đơn hàng, hệ thống tự động đẩy dữ liệu phả hệ và vết kiểm toán (Audit Trail) vào Context Rail (mặc định đóng, mở theo nhu cầu).
- **Xuất Báo cáo CSV:** Hỗ trợ tải xuống tệp danh mục sales orders phục vụ ban lãnh đạo và bộ phận thương mại.

---

## 3. LUỒNG TEST DỮ LIỆU THỰC THI (REAL-WORLD TESTING)

1. **Bước 1 (Truy cập M13):** Chọn phân hệ **M13: Sales Orders (O2C)** từ menu danh mục bên trái của NexusSync ERP.
2. **Bước 2 (Kiểm tra Tab & Dữ liệu):** Quan sát danh sách 3 đơn hàng SO mẫu và chuyển đổi qua lại giữa các tab *Reservation*, *Fulfillment*, và *Analytics*.
3. **Bước 3 (Xác lập Đơn hàng Mới):** 
   - Nhập tên khách hàng (VD: *Công ty Cổ phần Cơ khí Tiến Phát*).
   - Nhập mã SKU, số lượng và giá trị đơn hàng.
   - Bấm **"Xác nhận & Giữ chỗ Tồn kho"** -> Đơn hàng mới xuất hiện ngay trên bảng danh sách kèm thông báo Toast thành công.
4. **Bước 4 (Xem Chi tiết & L5 Rail):** Click *"Xem Chi tiết & L5"* để mở Cửa sổ Modal và ghi nhận ngữ cảnh vào Context Rail.
5. **Bước 5 (Xuất Báo cáo CSV):** Bấm *"Xuất Báo cáo CSV"* để tải xuống tệp `sales_orders_o2c_report_[YYYY-MM-DD].csv`.

---

## 4. BÁO CÁO KẾT QUẢ KIỂM THỬ THỰC TẾ

| Hạng mục Kiểm thử | Kịch bản Thực thi Nghiệp vụ | Kết quả Ghi nhận | Đánh giá |
| :--- | :--- | :--- | :---: |
| **Giao diện 4 Tab Sales Orders** | Truy cập phân hệ M13 và chuyển đổi các tab quản trị. | Hiển thị đầy đủ 4 tab chức năng chuyên sâu, trực quan. | **ĐẠT** |
| **Xác lập Đơn hàng Mới** | Nhập thông tin đơn hàng B2B và bấm xác nhận. | Đơn hàng mới được thêm thành công, cập nhật bảng và báo Toast. | **ĐẠT** |
| **Xem Chi tiết & L5 Rail** | Click xem chi tiết đơn hàng SO. | Mỏ Modal thông tin và đẩy phả hệ L5 Context Rail thành công. | **ĐẠT** |
| **Xuất Báo cáo CSV** | Bấm nút xuất file CSV từ thanh điều hướng. | Tệp CSV được tải xuống trình duyệt với định dạng chuẩn xác. | **ĐẠT** |
| **Biên dịch Hệ thống** | Chạy lệnh kiểm tra code và build ứng dụng. | Lệnh biên dịch qua `compile_applet` trả về **Build succeeded** (0 lỗi). | **ĐẠT** |

---

## 5. ĐỀ XUẤT NỘI DUNG CẬP NHẬT VÀO SOP DOANH NGHIỆP (MODULE M13)

Dựa trên kết quả thực thi và kiểm thử thực tế trên hệ thống NexusSync ERP, các quy trình chuẩn (SOP) đối với phân hệ **M13 — Sales Orders (O2C)** cần được cập nhật và chuẩn hóa như sau:

1. **Quy trình Chuyển giao từ CRM sang Commercial Order (M12 $\rightarrow$ M13):**
   - Chuẩn hóa quy định: Khi cơ hội bán hàng đạt trạng thái `Won`, hệ thống tự động khởi tạo hồ sơ liên thông nhưng bắt buộc phải qua bước rà soát thương mại trước khi phát hành `Sales Order` chính thức nhằm tránh lệch dữ liệu giá và điều khoản thanh toán.
2. **Quy tắc Giữ chỗ Tồn kho (Inventory Reservation Rules):**
   - Cập nhật quy định kỹ thuật: Việc xác lập `Sales Order` chỉ tạo ra yêu cầu giữ chỗ (`Reservation`), tuyệt đối không làm giảm tồn kho vật lý (`Physical Inventory`). Việc xuất kho thực tế (`Goods Issue`) phải tuân thủ Single Write Path qua Inventory Core.
3. **Quản lý Trạng thái Vận hành WMS & L5 Context Rail:**
   - Chuẩn hóa việc theo dõi tiến độ thực hiện đơn hàng qua 4 trạng thái chính: *Draft* $\rightarrow$ *Confirmed* $\rightarrow$ *Reserved* $\rightarrow$ *Fulfilled*, kết hợp việc tra cứu phả hệ qua thanh ngữ cảnh L5 (mặc định đóng, mở theo nhu cầu).

---

## 6. BÁO CÁO TỔNG KẾT & CHUẨN HÓA KIẾN TRÚC M13
- **Cập nhật SOP:** Đã hoàn tất việc đề xuất bổ sung toàn bộ quy trình vận hành đơn hàng B2B, giữ chỗ tồn kho và chuẩn hóa ranh giới thẩm quyền vào tài liệu SOP.
- **File Report:** Toàn bộ báo cáo kết quả kiểm thử và chuẩn hóa đã được lưu trữ chính thức tại:  
👉 **`/M13_Sales_Orders_Execution_Report.md`**
