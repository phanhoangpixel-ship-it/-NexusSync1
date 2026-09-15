# QUY TRÌNH VẬN HÀNH TIÊU CHUẨN (SOP) - PHÂN HỆ M41 PRODUCT PRICING & PRICE MANAGEMENT

*   **Mã tài liệu**: SOP-COM-M41
*   **Phiên bản**: v2.1 (Cập nhật ngày 29/08/2026)
*   **Chức danh áp dụng**: Nhân viên Phát triển Thị trường, Kế toán trưởng, Giám đốc Thương mại (CCO), Giám đốc Tài chính (CFO), Nhân viên Chăm sóc Khách hàng (Sales Admin).

---

## 1. MỤC TIÊU & PHẠM VI ÁP DỤNG
Quy trình này hướng dẫn chi tiết các bước vận hành nghiệp vụ quản lý chính sách giá, lũy kế số lượng sỉ, chương trình khuyến mãi tổng hợp và quy định kiểm định an toàn biên lợi nhuận, nhằm đảm bảo tính nhất quán của bảng giá toàn tập đoàn, bảo vệ doanh thu kinh doanh và quản trị rủi ro margin dưới ngưỡng an toàn.

---

## 2. QUY TRÌNH VẬN HÀNH CHI TIẾT

### BƯỚC 1: QUẢN LÝ & KHỞI TẠO BẢNG GIÁ MỚI (PRICE LIST SETUP)
1.  Truy cập Phân hệ **M41: Pricing & Commercial Engine**, chọn Tab **Bảng giá & Sản phẩm**.
2.  Nhấp chọn **Tạo Bảng giá** để thiết lập bảng giá phục vụ chiến dịch thầu hoặc nhóm đại lý mới:
    *   **Tên bảng giá**: Nhập tiêu đề bảng giá rõ ràng (Ví dụ: Bảng giá Đại lý Cấp VIP Miền Nam).
    *   **Mã bảng giá**: Nhập mã viết hoa liền nhau (Ví dụ: VIP-SOUTH).
    *   **Đối tượng áp dụng**: Chọn `Tất cả khách hàng (Public Retail)`, `Nhóm khách hàng phân loại (Group)`, hoặc `Mã khách hàng cụ thể (Customer)`.
    *   **Định danh đối tượng**: Nhập mã định danh nhóm (ví dụ: `VIP`) hoặc mã khách hàng (ví dụ: `CUST-089`).
    *   **Mô tả**: Nhập ghi chú phạm vi áp dụng và thời hạn hiệu lực.
3.  Bấm **Khởi tạo**. Hệ thống tự động nhân bản (clone) toàn bộ danh mục sản phẩm từ bảng giá gốc tiêu chuẩn sang bảng giá mới để kế toán dễ dàng tùy chỉnh biên độ chênh lệch mà không cần nhập thủ công từ đầu.

### BƯỚC 2: CẬP NHẬT ĐƠN GIÁ & KHUYẾN MÃI DÒNG SẢN PHẨM (PRICE EDITING & PROMOS)
1.  Tại danh sách sản phẩm của Bảng giá đang chọn, tìm kiếm sản phẩm cần sửa đổi qua thanh tìm kiếm (Tìm theo Tên hoặc mã SKU).
2.  Nhấp vào biểu tượng **Chỉnh sửa** (Edit2) ở cuối dòng sản phẩm:
    *   **Giá bán đề xuất**: Nhập đơn giá bán cơ bản mới.
    *   **Khuyến mãi**: Chọn loại chiết khấu dòng sản phẩm (Không chiết khấu, Chiết khấu phần trăm `%`, hoặc Chiết khấu số tiền trực tiếp `₫`). Nhập giá trị khuyến mãi tương ứng.
3.  Bấm **Lưu lại** (Check) để cập nhật dữ liệu.
    *   *Lưu ý*: Nếu có sự thay đổi về đơn giá cơ bản gốc so với ban đầu, hệ thống sẽ tự động tạo một yêu cầu phê duyệt giá chuyển đến Tab **Phê duyệt & Audit Trail** (Maker-Checker) và giữ nguyên giá bán cũ cho đến khi được duyệt.

### BƯỚC 3: CẤU HÌNH BẬC THANG BÁN SỈ (QUANTITY-BREAK CONFIGURATION)
1.  Truy cập Tab **Giá Lũy kế Số lượng**.
2.  Để tạo một bậc giá sỉ ưu đãi cho đơn đặt hàng số lượng lớn, chọn **Thêm Bậc Thang**:
    *   **Sản phẩm**: Chọn sản phẩm áp dụng trong danh mục Master.
    *   **Số lượng mua**: Nhập số lượng tối thiểu và tối đa bắt đầu nhận ưu đãi sỉ.
    *   **Đơn giá bậc sỉ**: Nhập đơn giá đặc thù được áp dụng (đã giảm).
    *   **Tỷ lệ giảm**: Điền tỷ lệ phần trăm khấu trừ tương ứng để báo cáo.
3.  Bấm **Thêm bậc thang**. Quy tắc này lập tức được tích hợp vào Pricing Engine để tự động áp dụng khi khách hàng đặt đơn số lượng lớn.

### BƯỚC 4: THIẾT LẬP CHIẾT KHẤU TỔNG ĐƠN HÀNG (PROMO & DISCOUNT RULES)
1.  Truy cập Tab **Khuyến mãi & Chiết khấu**.
2.  Nhấp nút **Thêm Quy tắc** để khởi tạo mã ưu đãi tổng đơn hàng:
    *   **Tên quy tắc**: Ghi rõ tên chương trình (Ví dụ: Ưu đãi thầu lớn quý IV).
    *   **Mã ưu đãi**: Nhập mã code áp dụng (Ví dụ: Q4-VOL-5).
    *   **Loại chiết khấu**: Chọn giảm theo `%` tổng đơn hoặc giảm thẳng số tiền cố định.
    *   **Ngưỡng áp dụng**: Nhập giá trị đơn hàng tối thiểu để kích hoạt ưu đãi.
3.  Bấm **Kích hoạt quy tắc**. Bộ máy Pricing Engine sẽ tự động chạy so khớp chéo để áp dụng chiết khấu có lợi nhất cho khách hàng trên đơn hàng thực tế.

### BƯỚC 5: PHÊ DUYỆT GIÁ BIẾN ĐỘNG (MAKER-CHECKER WORKFLOW)
Để tránh rủi ro nhân viên kinh doanh tự ý thay đổi giá gây thiệt hại hoặc thất thoát, quy trình Maker-Checker bắt buộc phải được thực hiện nghiêm ngặt:
1.  **Maker (Nhân viên)**: Thực hiện chỉnh sửa giá tại Tab 1. Hệ thống tự tạo Log trạng thái `PENDING` và gửi thông báo cho quản lý.
2.  **Checker (CFO / Kế toán trưởng)**:
    *   Truy cập Tab **Phê duyệt & Audit Trail**.
    *   Kiểm tra chi tiết yêu cầu thay đổi giá: Sản phẩm, giá cũ, giá đề xuất mới, người yêu cầu và thời gian.
    *   Đối chiếu với giá vốn và biên an toàn dự phóng.
    *   Nhấp **Phê duyệt (Approve)** nếu hợp lệ (hệ thống cập nhật giá chính thức) hoặc **Từ chối (Reject)** nếu vi phạm chính sách thương mại thương hiệu.

### BƯỚC 6: XUẤT BẢN & IN BIỂU GIÁ CHÍNH THỨC (PDF/PRINT EXPORT)
1.  Để phục vụ việc gửi báo giá chính thức cho khách hàng hoặc lưu trữ hồ sơ giấy:
    *   Chọn bảng giá áp dụng tại thanh điều khiển.
    *   Nhấp vào biểu tượng **Máy in** (Printer) trên thanh công cụ.
2.  Giao diện **Bản xem trước tài liệu in (A4 PDF Layout)** xuất hiện:
    *   Kiểm tra tính chính xác của các cột dữ liệu SKU, tên thương phẩm, giá niêm yết và đơn giá áp dụng sau chiết khấu khuyến mãi.
    *   Nhấp **In ngay / Lưu PDF** để tiến hành in giấy vật lý qua máy in văn phòng hoặc kết xuất tệp PDF lưu trữ nội bộ.

---

## 3. CHỈ SỐ ĐO LƯỜNG HIỆU QUẢ (KPI) PHÂN HỆ M41
*   **Pricing Accuracy Rate**: Tỷ lệ báo giá đơn hàng tự động tính toán chính xác 100% không phát sinh lỗi lệch giá khi xuất hóa đơn (Mục tiêu: 100%).
*   **Margin Compliance Rate**: Tỷ lệ đơn hàng tuân thủ tuyệt đối ngưỡng biên an toàn tối thiểu mục tiêu (Mục tiêu: > 98%).
*   **Price Approval Cycle Time**: Thời gian phê duyệt các yêu cầu thay đổi giá chờ (PENDING) kể từ lúc Maker gửi yêu cầu (Mục tiêu: < 4 giờ làm việc).
