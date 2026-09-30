# NEXUSSYNC ERP — QUY TRÌNH VẬN HÀNH TIÊU CHUẨN (SOP)
## MÃ QUY TRÌNH: SOP-INV-03 — QUY TRÌNH QUẢN TRỊ TỒN KHO VÀ KIỂM KÊ (INVENTORY & WMS)

---

### 1. MỤC ĐÍCH & PHẠM VI
* **Mục đích:** Duy trì độ chính xác của số liệu tồn kho sổ sách và thực tế $\ge 99.5\%$, kiểm soát biến động nhập/xuất/chuyển kho, xử lý chênh lệch kiểm kê minh bạch.
* **Phạm vi áp dụng:** Bộ phận Quản lý Kho, Thủ kho, Tổ kiểm kê, Kế toán Kho & Giá thành.
* **Hệ thống áp dụng:** Phân hệ `M17` (Tổng Quan Tồn Kho), `M20` (Điều Chỉnh & Kiểm Kê), `M24` (Quản Trị Kho WMS), `M42` (Tính Giá Vốn Xuất Kho).

---

### 2. SƠ ĐỒ DÒNG NGHIỆP VỤ (WORKFLOW)

```
[B1: Kế Hoạch / Lệnh Kho] ──> [B2: Thực Hiện Nhập/Xuất/Chuyển] ──> [B3: Kiểm Kê Thực Tế] ──> [B4: Duyệt Xử Lý Chênh Lệch] ──> [B5: Định Giá & Ghi Sổ Cái]
       (M17 / M24 Plan)                  (M17 Operations)                (M20 Counting Tab)             (M20 Approval Desk)                (M42 / M30 GL)
```

---

### 3. CÁC BƯỚC THỰC HIỆN CHI TIẾT

#### Bước 1: Tiếp Nhận Lệnh & Lập Kế Hoạch Dịch Chuyển
* **Người thực hiện:** Quản lý Kho (`WAREHOUSE_MANAGER`).
* **Màn hình:** `M17 Inventory Workspace` hoặc `M24 WMS`.
* **Thao tác:**
  1. Tiếp nhận các yêu cầu điều chuyển kho nội bộ hoặc yêu cầu xuất vật tư sản xuất.
  2. Tạo Phiếu chuyển kho `TO-YYYYMMDD-XXXX` hoặc Phiếu xuất vật tư `GI-YYYYMMDD-XXXX`.
  3. Chỉ định kho nguồn (Source Warehouse) và kho đích (Destination Warehouse).

#### Bước 2: Thực Hiện Thao Tác Kho Vật Lý
* **Người thực hiện:** Thủ kho (`WAREHOUSE_CLERK`).
* **Màn hình:** `M17 Inventory Workspace` / Tab *Thao Tác Kho*.
* **Thao tác:**
  1. Kiểm đếm hàng hóa, đối chiếu đúng thông số Mã SKU, Số Lot, Hạn sử dụng.
  2. Nhấn `Xác Nhận Xuất / Nhập Kho`.
  3. Hệ thống gọi `InventoryService.postTransaction()` cập nhật trực tiếp biến động số lượng vật lý và ghi chép Thẻ kho điện tử tức thời.

#### Bước 3: Tổ Chức Kiểm Kê Định Kỳ & Ghi Nhận Lệch
* **Người thực hiện:** Tổ trưởng kiểm kê, Kiểm toán nội bộ.
* **Màn hình:** `M20 Stock Adjustment Workspace` / Tab *Kiểm Kê Tồn Kho*.
* **Thao tác:**
  1. Nhấn `+ Tạo Kỳ Kiểm Kê Mới` (`ST-YYYYMMDD-XXXX`).
  2. In Phiếu kiểm đếm mù (Blind Count Sheet).
  3. Điền số lượng thực tế đếm được (`Physical Quantity`).
  4. Hệ thống tự động so khớp với Số lượng sổ sách (`System Quantity`), sinh số lượng chênh lệch Thừa/Thiếu và tính giá trị chênh lệch (Variance Value).

#### Bước 4: Thẩm Định & Phê Duyệt Xử Lý Chênh Lệch
* **Người thực hiện:** Kế toán Trưởng (`CHIEF_ACCOUNTANT`), Giám đốc Nhà máy / Tổng Giám Đốc.
* **Màn hình:** `M20 Stock Adjustment Workspace` / Tab *Bàn Duyệt Chênh Lệch*.
* **Hạn mức phê duyệt:**
  * Chênh lệch $\le 10.000.000$ VNĐ: Quản lý Kho duyệt.
  * Chênh lệch $10.000.000 - 100.000.000$ VNĐ: Kế toán Trưởng duyệt.
  * Chênh lệch $> 100.000.000$ VNĐ: Tổng Giám Đốc phê duyệt.
* **Thao tác:** Nhập nguyên nhân (Hao hụt tự nhiên, Đổ vỡ, Nhầm mã) và nhấn `Phê Duyệt Điều Chỉnh`.

#### Bước 5: Tính Giá Xuất Kho & Cập Nhật Sổ Cái
* **Người thực hiện:** Kế toán Kho & Giá thành (`COST_ACCOUNTANT`).
* **Màn hình:** `M42 Landed Cost / Costing Engine` & `M30 General Ledger`.
* **Thao tác:**
  1. Chạy kỳ tính giá xuất kho tự động (FIFO / Bình quân gia quyền).
  2. Hệ thống tự động hạch toán chênh lệch kho:
     * Hàng thừa chờ xử lý: Nợ TK 152, 156 / Có TK 3381
     * Hàng thiếu chờ xử lý: Nợ TK 1381 / Có TK 152, 156

---

### 4. BIỂU MẪU & BÁO CÁO BẮT BUỘC
* **Mẫu in:** Thẻ kho theo TT 200 (`Mẫu 06-VT`), Phiếu xuất kho kiêm vận chuyển nội bộ, Biên bản kiểm nghiệm vật tư (`Mẫu 03-VT`).
* **Báo cáo:** Báo cáo Tổng hợp Nhập - Xuất - Tồn, Báo cáo Cảnh báo tồn dưới mức an toàn, Báo cáo Tuổi thọ tồn kho theo Lot/HSD.
