# SOP M16: Quy trình Vận hành Phân hệ POS Retail (Point of Sale)

## 1. Mục đích & Phạm vi
- **Mục đích**: Chuẩn hóa quy trình nghiệp vụ bán hàng tại quầy (POS), thu tiền, quản lý két tiền mặt (Cash Drawer), kiểm soát ca làm việc (Shift Management), kết nối Inventory Core và hạch toán Sổ cái (GL) thông qua hệ thống NexusSync ERP.
- **Phạm vi**: Áp dụng cho toàn bộ nhân viên thu ngân (Cashier), cửa hàng trưởng (Store Manager), kế toán doanh thu và kiểm toán nội bộ tại các chi nhánh/cửa hàng bán lẻ của doanh nghiệp.

---

## 2. Các bước Vận hành Chuẩn (Standard Operating Procedures)

### Bước 1: Mở ca & Bàn giao Két tiền mặt (Opening Shift & Float Verification)
1. Thu ngân đăng nhập vào phân hệ **M16: POS Retail**.
2. Kiểm tra thông tin ca làm việc: Mã két (`Register ID`), chi nhánh, tên thu ngân và thời gian mở ca.
3. Xác nhận số dư tiền mặt đầu ca (**Opening Cash Float**, mặc định tiêu chuẩn là `5,000,000 VND`).
4. Bấm **Mở ca** để hệ thống kích hoạt két thu ngân và ghi nhận trạng thái `OPEN`.

### Bước 2: Giao dịch Bán hàng tại Quầy (Fast-Checkout & Cart Management)
1. **Tìm kiếm sản phẩm**:
   - Quét mã vạch trực tiếp bằng máy quét Barcode hoặc nhập mã SKU vào thanh tìm kiếm nhanh.
   - Hoặc duyệt danh mục sản phẩm trên màn hình cảm ứng.
2. **Kiểm tra Tồn kho Khả dụng (Available Stock)**: Hệ thống tự động kiểm tra tồn kho theo thời gian thực từ **Inventory Core**. Nếu `Available > 0`, cho phép thêm vào giỏ hàng (`Cart`). Nếu `Available = 0`, hệ thống chặn và cảnh báo.
3. **Quản lý Giỏ hàng**: Điều chỉnh số lượng tăng/giảm, áp dụng chiết khấu dòng hoặc xóa sản phẩm.
4. **Chọn Khách hàng**: Mặc định là khách vãng lai (`Walk-in Customer`) hoặc chọn khách hàng thành viên từ **Customer Master** để tích lũy doanh số / lịch sử mua hàng.

### Bước 3: Thanh toán Đa phương thức (Payment Gateway & Settlement)
1. Bấm **Thanh toán nhanh** để mở modal thanh toán.
2. Hệ thống hiển thị tổng tiền cần thanh toán bao gồm Tiền hàng + Thuế VAT (10%).
3. Chọn phương thức thanh toán:
   - **Tiền mặt (Cash)**: Nhập số tiền khách đưa (`Cash Tendered`), hệ thống tự động tính tiền thừa (`Change Due`).
   - **Thẻ ngân hàng / POS Terminal (Card)**.
   - **Chuyển khoản QR động (VietQR / Transfer)**.
4. Xác nhận thanh toán để hoàn tất giao dịch. Hệ thống sinh mã giao dịch định danh `POS-YYYY-XXXXX` ở trạng thái bất biến (`COMPLETED`).

### Bước 4: In Biên lai & Hạch toán Bất đồng bộ (Receipt Printing & Outbox Integration)
1. Hệ thống tự động hiển thị bản xem trước Biên lai chuẩn khổ 80mm.
2. Thu ngân bấm **In Biên lai** kết nối máy in nhiệt.
3. Đồng thời, hệ thống phát sinh sự kiện qua **EventBus (M05)** để:
   - Trừ tồn kho vật lý tại kho bán lẻ (thông qua `InventoryService.postTransaction()`).
   - Gửi bút toán doanh thu và thuế sang **Accounting Engine / GL**.

### Bước 5: Đóng ca & Kiểm đếm Két mù (Shift Closing & Blind Cash Count)
1. Khi kết thúc ca làm việc, thu ngân chọn tab **Quản lý Ca & Két**.
2. Bấm **Đóng ca & Kết toán két**.
3. Thực hiện **Kiểm đếm mù (Blind Cash Count)**: Thu ngân đếm thực tế số tiền mặt trong két và nhập số tiền vào hệ thống **mà không nhìn trước số liệu dự kiến trên phần mềm**.
4. Hệ thống đối chiếu số tiền thực tế với số tiền dự kiến (`Opening Float + Cash Sales`).
5. Nếu có chênh lệch (`Variance`), thu ngân bắt buộc phải nhập lý do giải trình. Mọi chênh lệch vượt ngưỡng yêu cầu phê duyệt quản lý bằng xác thực mã PIN / `ConfirmDialog`.
6. Chốt ca và chuyển trạng thái két sang `CLOSED`.

---

## 3. Quy định về Phân quyền & Bảo mật (RBAC & Guardrails)
- **Thu ngân (Cashier)**: Chỉ có quyền tạo giỏ hàng, nhận thanh toán, in biên lai và thực hiện mở/đóng ca của mình. Không có quyền hủy hóa đơn (`Void`) hay chiết khấu vượt mức cho phép.
- **Quản lý Cửa hàng (Store Manager)**: Có quyền duyệt chênh lệch két (`Variance Approval`), phê duyệt hủy hóa đơn hoặc hoàn trả (`Returns & RMA`).
- **Tuân thủ Rule #19**: Tuyệt đối không sử dụng `window.alert` hoặc `window.confirm` mặc định của trình duyệt; mọi thao tác xác nhận nhạy cảm phải sử dụng component `ConfirmDialog.tsx` tùy chỉnh.
