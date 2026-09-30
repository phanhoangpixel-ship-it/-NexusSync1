# NEXUSSYNC ERP — QUY TRÌNH VẬN HÀNH TIÊU CHUẨN (SOP)
## MÃ QUY TRÌNH: SOP-O2C-02 — QUY TRÌNH BÁN HÀNG VÀ THU TIỀN (ORDER-TO-CASH)

---

### 1. MỤC ĐÍCH & PHẠM VI
* **Mục đích:** Xử lý đơn hàng nhanh chóng, kiểm soát rủi ro công nợ, xuất hóa đơn thuế hợp lệ và thu hồi dòng tiền chính xác 100%.
* **Phạm vi áp dụng:** Bộ phận Kinh doanh (Sales), Quản lý Tín dụng (Credit), Kho vận (WMS), Kế toán Doanh thu & Công nợ (AR).
* **Hệ thống áp dụng:** Phân hệ `M11` (Báo Giá), `M13` (Đơn Bán Hàng & HĐĐT), `M17/M24` (Xuất Kho Bán Hàng), `M30` (Sổ Cái Doanh Thu & Giá Vốn), `M32` (Thu Tiền).

---

### 2. SƠ ĐỒ DÒNG NGHIỆP VỤ (WORKFLOW)

```
[B1: Tạo Đơn Bán SO] ──> [B2: Kiểm Soát Hạn Mức Tín Dụng] ──> [B3: Giữ Chỗ Tồn Kho ATP] ──> [B4: Xuất Kho WMS] ──> [B5: Phát Hành HĐĐT] ──> [B6: Thu Tiền AR]
     (M13 SO Desk)               (M13 Credit Guard)                 (M17 Engine)               (M24 Pick/Pack)          (M13 E-Invoice)         (M32 Cash/Bank)
```

---

### 3. CÁC BƯỚC THỰC HIỆN CHI TIẾT

#### Bước 1: Tiếp Nhận & Lập Đơn Đặt Hàng Bán (SO)
* **Người thực hiện:** Nhân viên Kinh doanh (`SALES_REP`).
* **Màn hình:** `M13 Sales Orders Workspace` / Tab *Danh Sách Đơn Hàng*.
* **Thao tác:**
  1. Nhấn `+ Tạo Đơn Hàng Mới`.
  2. Chọn Khách hàng (Hệ thống tự động hiển thị mức tín dụng khả dụng, bảng giá và điều khoản nợ).
  3. Chọn sản phẩm, số lượng, mức chiết khấu được duyệt.
  4. Hệ thống sinh mã đơn `SO-YYYYMMDD-XXXX`.
  5. Nhấn `Xác Nhận Đơn Hàng`.

#### Bước 2: Kiểm Soát Tín Dụng Tự Động & Phê Duyệt Vượt Hạn Mức
* **Người thực hiện:** Hệ thống tự động / Quản lý Tín dụng (`CREDIT_MANAGER`).
* **Quy tắc chặn:**
  * Nếu Khách hàng có nợ quá hạn $> 30$ ngày HOẶC Tổng dư nợ + Giá trị đơn hàng mới $>$ Hạn mức tín dụng: Hệ thống chuyển trạng thái đơn sang `PENDING_CREDIT`.
  * Quản lý tín dụng mở `M13 Credit Approval Desk` để thẩm định và phê duyệt ngoại lệ nếu có bảo lãnh thanh toán.

#### Bước 3: Giữ Chỗ Tồn Kho Khả Dụng (ATP Allocation)
* **Người thực hiện:** Hệ thống tự động (Automated Core Engine).
* **Quy tắc:**
  * Ngay khi đơn hàng được xác nhận, hệ thống tự động tăng `stockReserved` và giảm `stockAvailable` theo từng mặt hàng và kho xuất.
  * Ngăn chặn tuyệt đối tình trạng bán vượt tồn kho thực tế (Zero Negative Stock).

#### Bước 4: Soạn Hàng, Đóng Gói & Xuất Kho
* **Người thực hiện:** Nhân viên Kho (`WAREHOUSE_OPERATOR`).
* **Màn hình:** `M24 WMS Warehouse Workspace` / Tab *Xuất Kho Đơn Hàng*.
* **Thao tác:**
  1. In Phiếu lấy hàng (Pick List) và Phiếu đóng gói (Packing Slip).
  2. Lấy hàng tại vị trí kệ (Bin/Rack), kiểm tra số Lot/Serial.
  3. Nhấn `Xác Nhận Xuất Kho`. Hệ thống sinh mã `GD-YYYYMMDD-XXXX`, giảm trừ `stockPhysical` và `stockReserved`.

#### Bước 5: Phát Hành Hóa Đơn Điện Tử (Nghị định 123/2020/NĐ-CP)
* **Người thực hiện:** Kế toán Bán hàng (`BILLING_ACCOUNTANT`).
* **Màn hình:** `M13 Sales Orders Workspace` / Tab *Hóa Đơn Điện Tử*.
* **Thao tác:**
  1. Mở đơn hàng đã xuất kho, nhấn `Ký Số & Phát Hành Hóa Đơn`.
  2. Hệ thống ký HSM, sinh mã CQT và mã hóa đơn `INV-YYYYMMDD-XXXX`.
  3. Hệ thống tự động ghi nhận 3 cặp định khoản VAS chuẩn:
     * Nợ TK 131 / Có TK 511 (Doanh thu bán hàng)
     * Nợ TK 131 / Có TK 3331 (Thuế GTGT đầu ra)
     * Nợ TK 632 / Có TK 156 (Giá vốn hàng bán theo giá xuất kho thực tế)

#### Bước 6: Thu Tiền Bán Hàng & Đối Trừ Công Nợ
* **Người thực hiện:** Kế toán Công nợ Phải thu (`AR_ACCOUNTANT`).
* **Màn hình:** `M32 Treasury & AR Desk`.
* **Thao tác:**
  1. Khi nhận báo Có ngân hàng hoặc tiền mặt, lập Phiếu thu (`REC-YYYYMMDD-XXXX`).
  2. Gạch nợ đích danh theo từng Hóa đơn hoặc theo nguyên tắc nợ cũ trừ trước (FIFO).
  3. Đơn hàng chuyển sang trạng thái `PAID`.

---

### 4. BIỂU MẪU & BÁO CÁO BẮT BUỘC
* **Mẫu in:** Báo giá kinh doanh, Phiếu Giao hàng kiêm Phiếu xuất kho theo TT 200 (`Mẫu 02-VT`), Bản thể hiện Hóa đơn điện tử có mã QR.
* **Báo cáo:** Báo cáo Doanh thu theo Kênh/Nhân viên/Sản phẩm, Báo cáo Tuổi nợ phải thu khách hàng (AR Aging Report), Báo cáo Tỷ lệ giao hàng đúng hạn (OTIF).
