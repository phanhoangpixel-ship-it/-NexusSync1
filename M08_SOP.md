# QUY TRÌNH VẬN HÀNH TIÊU CHUẨN (SOP) - PHÂN HỆ M08 PURCHASE ORDERS & 3-WAY MATCHING

*   **Mã tài liệu**: SOP-P2P-M08
*   **Phiên bản**: v2.1 (Cập nhật ngày 29/08/2026)
*   **Chức danh áp dụng**: Nhân viên Mua hàng, Trưởng phòng Thu mua, Kế toán Công nợ (AP Accountant), Nhân viên kiểm đếm kho.

---

## 1. MỤC TIÊU & PHẠM VI ÁP DỤNG
Quy trình này hướng dẫn chi tiết các bước vận hành nghiệp vụ từ khi có nhu cầu mua sắm cho tới khi hồ sơ mua hàng được đối chiếu khớp hoàn toàn 3 chiều (3-Way Matched), đảm bảo tính tuân thủ pháp lý, kiểm soát nội bộ chặt chẽ và phòng chống rủi ro thất thoát tài sản doanh nghiệp.

---

## 2. QUY TRÌNH VẬN HÀNH CHI TIẾT (PROCURE-TO-PAY)

### BƯỚC 1: TIẾP NHẬN YÊU CẦU MUA HÀNG (PR - PURCHASE REQUISITION)
*   Các phòng ban lập phiếu yêu cầu mua sắm vật tư trên hệ thống.
*   Hệ thống kiểm tra ngân sách của bộ phận đề xuất. Nếu nằm trong hạn mức, chuyển tiếp yêu cầu sang phân hệ M08 dưới dạng PR chờ xử lý.

### BƯỚC 2: PHÁT HÀNH ĐƠN MUA HÀNG (PO - PURCHASE ORDER)
*   Nhân viên mua hàng truy cập Tab **Danh sách Đơn PO**.
*   Nhấp chọn **Tạo Đơn PO Mới**:
    1.  Chọn đối tác cung ứng trong danh sách đối tác đã ký kết Hợp đồng khung (BPA).
    2.  Nhập mặt hàng và tổng tiền dự kiến.
    3.  Bấm **Phát hành Đơn PO**.
*   Đơn hàng mới tạo sẽ ở trạng thái `PENDING_APPROVAL` (Chờ Duyệt).

### BƯỚC 3: PHÊ DUYỆT ĐƠN HÀNG (PO APPROVAL)
*   Trưởng phòng Thu mua đăng nhập hệ thống, kiểm tra chi tiết đơn hàng:
    *   Đối chiếu đơn giá của mặt hàng với biểu giá khung trong Tab **Hợp đồng & Khung giá NCC**.
    *   Nếu đạt yêu cầu, nhấp **Duyệt (Approve)**. Trạng thái đơn hàng chuyển sang `APPROVED`, hệ thống tự động ký SHA-256 bảo mật và gửi lệnh mua đến Nhà cung cấp.
    *   Nếu không đạt yêu cầu, nhấp **Từ chối (Reject)** và phản hồi lý do cho nhân viên.

### BƯỚC 4: NHẬN HÀNG & KIỂM ĐẾM KHO (GR - GOODS RECEIPT)
*   Khi nhà cung cấp giao hàng đến kho, nhân viên kho tiến hành mở kiện, kiểm đếm số lượng vật lý thực tế và chất lượng cảm quan.
*   Nhân viên kho lập phiếu **Goods Receipt (GR)** ghi nhận số lượng thực tế nhận được. Số liệu này tự động đẩy vào bộ máy đối soát **3-Way Matching Engine**.

### BƯỚC 5: ĐỐI CHIẾU 3 CHIỀU TỰ ĐỘNG (3-WAY MATCHING CONTROL)
Hệ thống tự động chạy quy trình so khớp chéo 3 bên:
1.  **Số lượng trên PO** = **Số lượng thực nhận tại kho (GR)** = **Số lượng trên hóa đơn VAT (AP)**
2.  **Đơn giá trên PO** = **Đơn giá ghi nhận trên Hóa đơn tài chính (AP)**

#### Xử lý kết quả đối chiếu:
*   **Trường hợp 1: Khớp hoàn toàn (MATCHED)**
    *   Hệ thống tự động chuyển hồ sơ sang bộ phận Kế toán công nợ lập lịch thanh toán. Không cần con người can thiệp.
*   **Trường hợp 2: Chờ nhận hàng (PENDING_GR)**
    *   Hồ sơ được giữ ở trạng thái chờ cho đến khi kho xác nhận nhận đủ hàng.
*   **Trường hợp 3: Phát hiện lệch sai số (MISMATCH)**
    *   Cảnh báo đỏ sẽ nhấp nháy trên màn hình Tab **Đối chiếu 3-Way Matching**.
    *   **Thủ tục phân xử lệch**:
        1.  Nhân viên click nút **Xử lý chênh lệch**.
        2.  Trao đổi trực tiếp với nhà cung cấp về nguyên nhân thiếu hàng hoặc sai đơn giá.
        3.  Cập nhật phương án giải quyết (VD: Giảm trừ công nợ theo số lượng nhận thực tế 45 bộ thay vì 50 bộ) vào ô lý do điều chỉnh.
        4.  Bấm **Xác nhận điều chỉnh & Thông qua**. Hồ sơ chuyển trạng thái `RESOLVED` và bàn giao cho kế toán.

---

## 3. CHỈ SỐ ĐO LƯỜNG HIỆU QUẢ (KPI) PHÂN HỆ M08
*   **PO Cycle Time**: Thời gian từ lúc PR được duyệt đến lúc phát hành PO gửi NCC (Mục tiêu: &lt; 24 giờ).
*   **3-Way Match Rate**: Tỷ lệ khớp hoàn hảo 100% trong lần đối chiếu đầu tiên (Mục tiêu: &gt; 95%).
*   **Spend Compliance**: Tỷ lệ đơn mua hàng PO liên kết đúng hợp đồng khung BPA (Mục tiêu: 100%).
