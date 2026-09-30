# NEXUSSYNC ERP — QUY TRÌNH VẬN HÀNH TIÊU CHUẨN (SOP)
## MÃ QUY TRÌNH: SOP-P2P-01 — QUY TRÌNH MUA HÀNG VÀ THANH TOÁN (PROCURE-TO-PAY)

---

### 1. MỤC ĐÍCH & PHẠM VI
* **Mục đích:** Đảm bảo mua đúng mặt hàng, đúng số lượng, đúng giá thành đã thương thảo, kiểm soát ngân sách phòng ban và thanh toán an toàn 100%.
* **Phạm vi áp dụng:** Bộ phận Mua hàng (Procurement), Kho vận (WMS), Kế toán (AP/Treasury), Ban Giám đốc phê duyệt.
* **Hệ thống áp dụng:** Phân hệ `M08` (Đơn Mua Hàng), `M10` (Cổng NCC & Yêu Cầu Mua), `M17` (Nhập Kho Vật Tư), `M31` (Khớp 3 Bên AP), `M32` (Thanh Toán).

---

### 2. SƠ ĐỒ DÒNG NGHIỆP VỤ (WORKFLOW)

```
[B1: Lập PR/PO] ──> [B2: Kiểm Soát Ngân Sách] ──> [B3: Duyệt Đơn Mua PO] ──> [B4: Nhập Kho GR] ──> [B5: Khớp 3 Bên AP] ──> [B6: Chi Trả AP]
     (M10 / M08)           (Cost Center Guard)            (M28 Desk)              (M08 / M17)             (M31 Engine)           (M32 Cash/Bank)
```

---

### 3. CÁC BƯỚC THỰC HIỆN CHI TIẾT

#### Bước 1: Lập Yêu Cầu Mua & Tạo Đơn Đặt Hàng Mua (PO)
* **Người thực hiện:** Chuyên viên Mua hàng (`PURCHASE_OFFICER`).
* **Màn hình:** `M08 Purchase Orders Workspace` / Tab *Đơn Hàng Mua*.
* **Thao tác:**
  1. Nhấn `+ Tạo Đơn Hàng Mua Mới`.
  2. Chọn Nhà Cung Cấp, Thời hạn thanh toán, và Trung tâm chi phí (Cost Center).
  3. Thêm danh mục vật tư/hàng hóa, số lượng, đơn giá và thuế suất VAT.
  4. Hệ thống tự động sinh mã đơn mua theo quy ước `PO-YYYYMMDD-XXXX`.
  5. Nhấn `Gửi Phê Duyệt`. Trạng thái chuyển sang `PENDING_APPROVAL`.

#### Bước 2: Phê Duyệt Đơn Đặt Hàng Mua
* **Người thực hiện:** Trưởng phòng Mua hàng / Giám đốc Khối / CFO.
* **Màn hình:** `M28 Approval Desk` / Tab *Phê Duyệt Đơn Hàng Mua*.
* **Hạn mức duyệt:**
  * Giá trị $\le 500.000.000$ VNĐ: Trưởng phòng Mua hàng duyệt (Cấp 1).
  * Giá trị $500.000.000 - 2.000.000.000$ VNĐ: CPO / Giám đốc Khối duyệt (Cấp 2).
  * Giá trị $> 2.000.000.000$ VNĐ: CFO / Tổng Giám Đốc phê duyệt (Cấp 3).
* **Kết quả:** Trạng thái chuyển sang `APPROVED`. Nhà cung cấp nhận thông báo xác nhận.

#### Bước 3: Tiếp Nhận Hàng & Nhập Kho KCS (Goods Receipt - GR)
* **Người thực hiện:** Thủ kho (`WAREHOUSE_CLERK`) & Nhân viên Kiểm tra chất lượng (`QC_INSPECTOR`).
* **Màn hình:** `M08 Purchase Orders Workspace` / Tab *Biên Bản Nhập Kho (GR)* hoặc `M17 Inventory Workspace`.
* **Thao tác:**
  1. Mở đơn PO tương ứng, chọn `Nhận Hàng Vào Kho`.
  2. Kiểm đếm số lượng thực nhận, ghi nhận số Lot/Serial và Hạn sử dụng (Expiry Date).
  3. Nếu hàng đạt KCS: Nhấn `Xác Nhận Nhập Kho (GR)`. Hệ thống tự động sinh mã `GR-YYYYMMDD-XXXX` và gọi `InventoryService.postTransaction()` ghi tăng tồn kho tức thì.

#### Bước 4: Đối Soát Hóa Đơn & Khớp 3 Bên (3-Way Matching)
* **Người thực hiện:** Kế toán Công nợ Phải trả (`AP_ACCOUNTANT`).
* **Màn hình:** `M31 AP Invoice Matching Desk`.
* **Thao tác:**
  1. Nhập thông tin Hóa đơn đầu vào của Nhà cung cấp (Số hóa đơn, Ngày lập, Tiền hàng, Tiền thuế).
  2. Chọn Đơn mua hàng PO và Phiếu nhập kho GR tương ứng.
  3. Nhấn `Chạy Khớp 3 Bên Tự Động`. Hệ thống so sánh:
     $$\text{Độ lệch} = \left| \frac{\text{Giá trị Hóa Đơn} - \text{Giá trị GR}}{\text{Giá trị GR}} \right| \times 100\%$$
  4. Nếu độ lệch $\le 2\%$: Hệ thống duyệt `MATCHED` và tự động sinh công nợ phải trả TK 331.
  5. Nếu độ lệch $> 2\%$: Hệ thống gắn cờ `MISMATCH` và yêu cầu lập biên bản giải trình.

#### Bước 5: Lập Đề Nghị Thanh Toán & Chi Trả
* **Người thực hiện:** Kế toán Thanh toán, Kế toán Trưởng, Giám đốc Tài chính.
* **Màn hình:** `M32 Treasury & Cash Desk`.
* **Thao tác:**
  1. Lập Đề nghị chi theo kỳ hạn công nợ đã thỏa thuận.
  2. Kế toán trưởng ký duyệt lệnh chi (`PAY-YYYYMMDD-XXXX`).
  3. Thủ quỹ hoặc Ngân hàng thực hiện chuyển tiền (Ghi Nợ 331 / Có 111, 112).
  4. Trạng thái đơn mua hàng chuyển sang `CLOSED`.

---

### 4. BIỂU MẪU & BÁO CÁO BẮT BUỘC
* **Mẫu in:** Đơn đặt hàng mua (`PO_PRINT_TEMPLATE`), Phiếu nhập kho mua hàng theo TT 200 (`Mẫu 01-VT`).
* **Báo cáo:** Báo cáo tiến độ giao hàng đơn mua, Báo cáo đối soát 3 bên, Báo cáo phân tích tuổi nợ AP (30/60/90/120+ ngày).
