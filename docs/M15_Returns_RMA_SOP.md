# QUY TRÌNH CHUẨN (SOP) — PHÂN HỆ M15: RETURNS & RMA (QUẢN LÝ ĐỔI TRẢ HÀNG & ỦY QUYỀN TRẢ HÀNG)

**Mã phân hệ:** M15  
**Nhóm phân hệ:** Sales & Customer Management Suite (O2C / Commerce)  
**Phiên bản chuẩn:** v2.0 (NexusSync ERP Enterprise Architecture)  
**Ngày hiệu lực:** 28/08/2026  

---

## 1. MỤC ĐÍCH & PHẠM VI ÁP DỤNG
* **Mục đích:** Thiết lập quy trình chuẩn khép kín từ khâu tiếp nhận yêu cầu trả hàng của khách hàng (*Return Request*), thẩm quyền ủy quyền RMA (*Return Merchandise Authorization*), kiểm định chất lượng tại kho (*Inspection*), đến quyết định phương án xử lý cuối cùng (*Disposition*) và đồng bộ chứng từ tài chính (*Credit Note / GL*).
* **Phạm vi:** Áp dụng cho các phòng ban: Dịch vụ Khách hàng (CS), Quản lý Kho (Warehouse / Logistics), Quản lý Chất lượng (QC), và Tài chính - Kế toán (Finance / AR).

---

## 2. ĐỊNH NGHĨA & NGUYÊN TẮC VẬN HÀNH
* **Return Process Authority (RMA):** M15 đóng vai trò là cơ quan cấp phép độc lập, theo dõi toàn bộ vòng đời hàng trả nhưng tuân thủ nguyên tắc không trực tiếp sửa đổi tồn kho cốt lõi mà thông qua giao thức cầu nối sự kiện (`InventoryService.postTransaction()`) và hạch toán tài chính qua hóa đơn điều chỉnh (`Credit Note`).
* **Tính toàn vẹn Traceability:** Mọi yêu cầu RMA bắt buộc phải liên kết trực tiếp với Đơn hàng bán gốc (`Sales Order - SO`) và Phiếu xuất kho gốc (`Delivery Note`) kèm theo số lô/serial (`Lot/Serial number`) để kiểm soát nguồn gốc xuất xứ chính xác.

---

## 3. CÁC BƯỚC THỰC THI QUY TRÌNH CHUẨN (5 BƯỚC)

### Bước 1: Tiếp nhận Yêu cầu Trả hàng & Khởi tạo RMA (Return Request)
* **Người thực hiện:** Nhân viên Chăm sóc Khách hàng (CS) hoặc Sale Admin.
* **Thao tác trên Hệ thống:**
  1. Truy cập phân hệ **M15: Returns & RMA**, chọn tab *1. Yêu cầu & Phê duyệt RMA*.
  2. Điền thông tin vào biểu mẫu **"Tạo Yêu cầu Trả hàng Mới"**: Khách hàng, Mã Đơn hàng Gốc (SO), Tên Sản phẩm / SKU, Số lượng trả, Lý do trả hàng và Hướng giải quyết mong muốn (`RESTOCK`, `REPAIR`, `REPLACE`, `CREDIT`).
  3. Bấm **"Gửi Yêu cầu RMA & Phê duyệt"** để hệ thống ghi nhận hồ sơ ở trạng thái `REQUESTED` hoặc `UNDER_REVIEW`.

### Bước 2: Thẩm định & Phê duyệt RMA (RMA Authorization)
* **Người thực hiện:** Trưởng bộ phận CS / Quản lý Kinh doanh.
* **Thao tác trên Hệ thống:**
  1. Rà soát thông tin chi tiết của hồ sơ RMA (kiểm tra chứng từ giao hàng gốc, lý do và thời hạn bảo hành/đổi trả).
  2. Bấm nút **"Phê duyệt"** trên dòng tương ứng hoặc xem chi tiết qua nút **"Chi tiết"**.
  3. Xác nhận qua hộp thoại `ConfirmDialog` bảo mật. Trạng thái hồ sơ chuyển sang `APPROVED`, cấp quyền cho kho tiếp nhận hàng vật lý.

### Bước 3: Tiếp nhận Hàng & Kiểm định Chất lượng (Inspection Gate)
* **Người thực hiện:** Thủ kho (Warehouse Keeper) & Nhân viên QC.
* **Thao tác trên Hệ thống:**
  1. Chuyển sang tab *2. Tiếp nhận & Kiểm tra (Inspection)*.
  2. Tiến hành kiểm đếm thực tế hàng trả về kho, đối chiếu với mã Lot/Serial trên phiếu RMA.
  3. Thực hiện phân loại trạng thái QC:
     * `GOOD`: Hàng nguyên vẹn, nhập lại kho bán hàng.
     * `DEFECTIVE`: Hàng lỗi kỹ thuật, chuyển chờ sửa chữa hoặc trả nhà cung cấp.
     * `DAMAGED` / `SCRAP`: Hàng hỏng nặng, chuyển sang kho phế liệu hủy.

### Bước 4: Thực thi Phương án Xử lý (Disposition)
* **Người thực hiện:** Quản lý Kho kết hợp Bộ phận Thương mại.
* **Thao tác trên Hệ thống:**
  1. Chuyển sang tab *3. Quyết định Xử lý (Disposition)*.
  2. Lựa chọn phương án xử lý cuối cùng phù hợp với số lượng hàng đã kiểm định:
     * `RESTOCK`: Nhập lại kho hàng bán.
     * `REPAIR`: Gửi xưởng sửa chữa/bảo hành.
     * `REPLACE`: Lệnh xuất kho đổi sản phẩm mới cho khách.
     * `CREDIT`: Chuyển dữ liệu sang bộ phận Kế toán phát hành `Credit Note` / cấn trừ công nợ.
     * `RETURN_TO_VENDOR`: Trả về nhà sản xuất/cung cấp gốc.
     * `SCRAP`: Tiêu hủy phế liệu.

### Bước 5: Truy xuất Nguồn gốc & Đóng hồ sơ (Traceability & Lineage)
* **Người thực hiện:** Kiểm toán viên / Quản trị hệ thống.
* **Thao tác trên Hệ thống:**
  1. Truy cập tab *4. Sơ đồ Truy xuất & Hợp đồng Nghiệp vụ* để kiểm tra chuỗi lineage khép kín từ Khách hàng $\rightarrow$ SO $\rightarrow$ Delivery $\rightarrow$ RMA $\rightarrow$ Inspection $\rightarrow$ Disposition.
  2. Hồ sơ sau khi hoàn tất các bút toán kho và tài chính sẽ chuyển sang trạng thái `COMPLETED`.

---

## 4. QUY ĐỊNH VỀ KIỂM SOÁT AN TOÀN & BẢO MẬT
1. **Tuyệt đối không dùng alert/confirm mặc định:** Mọi thao tác xác nhận phê duyệt hoặc thay đổi trạng thái quan trọng phải bắt buộc thông qua component `ConfirmDialog` chuẩn NexusSync ERP (Tuân thủ Rule #19).
2. **Giao diện Tự động Co giãn (Responsive Grid/Flexbox):** Các màn hình quản lý, bảng biểu và modal chi tiết phải hỗ trợ tự động co giãn linh hoạt trên mọi kích thước màn hình mà không bị tràn khung hay cắt cụt văn bản.
3. **Lưu trữ Audit Trail:** Mọi thay đổi trạng thái RMA đều được ghi nhận dấu vết điện tử kèm chữ ký số/checksum bảo mật.
