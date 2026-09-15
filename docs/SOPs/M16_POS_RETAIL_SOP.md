# SOP: Vận hành Module M16 - POS Retail

## 1. Mục đích
Hướng dẫn các thao tác chuẩn dành cho Nhân viên Bán hàng / Thu ngân khi sử dụng Module M16 (Điểm bán lẻ POS) để thực hiện xuất hàng, thu tiền, in biên lai một cách chuẩn xác, an toàn, có dữ liệu lưu chuyển đồng bộ lên máy chủ.

## 2. Đối tượng áp dụng
- Thu Ngân Cửa Hàng (Cashier)
- Quản lý Cửa Hàng (Store Manager)

## 3. Quy trình thực hiện (Flow)

### Bước 1: Chuẩn bị Ca làm việc & Mở quầy
- **Kiểm tra Float (Tiền lẻ đầu ca):** Khi màn hình hiển thị "Mở Ca", xác nhận số tiền mặt đầu ca để chuẩn bị trả lại cho khách hàng (Mặc định hiển thị, vd: 2,500,000 đ).
- **Trạng thái:** Quan sát huy hiệu "ĐANG MỞ CA (OPEN)" góc trên cùng bên trái.

### Bước 2: Nhập thông tin & Định danh Khách hàng (Tùy chọn)
- Tại mục "Khách hàng", click vào thả xuống để chọn các Khách Hàng có sẵn trong CRM.
- Mặc định là Khách vãng lai (Walk-in Customer) nếu khách không muốn cung cấp thẻ thành viên.

### Bước 3: Đưa sản phẩm vào Giỏ Hàng
- **Cách 1 (Nhanh nhất):** Sử dụng máy quét Barcode tít mã trực tiếp vào ô input "Quét mã vạch Barcode". Hệ thống sẽ Enter tự động và đẩy món vào giỏ hàng.
- **Cách 2 (Thủ công):** Bấm trực tiếp vào các ô (Grid) sản phẩm (Laptop Nexus Pro, Bàn Phím Cơ...) ở khung hiển thị Trái để ném món vào giỏ.

### Bước 4: Tinh chỉnh Chiết khấu & Số lượng
- Tại phần tử trong giỏ hàng, bấm nút `+` / `-` để thay đổi số lượng.
- (Tùy chọn) Bấm vào nút % Chiết Khấu (Discount) cho từng mặt hàng (Line Item). Các thuế VAT và giá trị tổng sẽ tự động được `PricingService` quy đổi lại.

### Bước 5: Thanh toán
- Bấm vào nút **THANH TOÁN NHANH** màu xanh lá cây dưới cùng màn hình (Hiển thị sẵn Số Tổng Cộng).
- Khung Modal xuất hiện, Thu ngân nhập "Số tiền khách đưa" (Cash Tendered). Hệ thống tự động tính ra "Tiền thừa trả khách" (Change Due).
- Chọn 1 trong 3 phương thức: Tiền mặt, Thẻ POS, hoặc Mã QR.
- Nhấn **Xác nhận Thanh toán & In Biên Lai**. Backend API sẽ tiến hành ghi sổ CSDL.

### Bước 6: In và Bàn giao
- Hóa đơn hiển thị toàn màn hình. Nhấn biểu tượng máy in góc trên để Print. Khổ giấy tự động ẩn khung nền để khớp với máy in Bill (K80).
- Sau khi in, bấm đóng, Giao dịch hoàn tất. Sẵn sàng quét đơn hàng tiếp theo.

## 4. Các Đề xuất Nâng cấp Tương lai (Roadmap)
Để phát huy tối đa thế mạnh tốc độ (High-throughput) của mô hình POS, các tính năng sau được đề xuất phát triển thêm (Future Scope - Not yet coded):
1. **Offline-first Mode (Chế độ Không mạng):** Lưu trữ các giao dịch bán hàng (Transaction Queue) bằng IndexedDB nếu bị rớt mạng Internet. Khi có mạng trở lại, một Background Sync sẽ tự động đẩy hàng ngàn lệnh về Backend.
2. **Khuyến mãi Tự động (Promotion Engine Rules):** Kích hoạt "Combo Mua 2 tặng 1" hoặc "Khách hàng VVIP - Giảm 5%" bằng cách dò tự động profile Khách Hàng khi quét thẻ cứng.
3. **Quản lý ca đa lớp (Shift Reconciliation):** Tích hợp tính năng Bàn giao ca (End of Shift Z-Report) tính sai số rủi ro (Tiền mặt hụt/dư) trực tiếp trên màn hình, tự động kết chuyển phiếu thu (Cash Voucher) về Hệ thống Kế toán Tài chính.
4. **Hỗ trợ Split Payment (Chia nhỏ bill):** Cho phép khách hàng trả một phần bằng thẻ tín dụng, phần còn lại trả bằng tiền mặt.
