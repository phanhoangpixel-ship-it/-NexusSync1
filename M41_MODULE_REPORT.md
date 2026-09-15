# BÁO CÁO KẾT QUẢ THỰC THI & KIỂM THỬ HỆ THỐNG PHÂN HỆ M41 (PRODUCT PRICING & PRICE MANAGEMENT)

Hệ thống ERP NexusSync đã hoàn thành phát triển và nâng cấp toàn diện Phân hệ M41 (Product Pricing & Price Management) đạt chuẩn doanh nghiệp thương mại quốc tế theo đúng **[Định nghĩa Module M41](/M41_MODULE_DEFINITION.md)**. Dưới đây là báo cáo chi tiết về kiến trúc thiết kế, danh mục tính năng được hiển thị hóa, kết quả kiểm thử và hướng dẫn vận hành chuẩn (SOP).

---

## 1. THIẾT KẾ KIẾN TRÚC PHÂN HỆ M41 (PRICING & COMMERCIAL ENGINE)

Kiến trúc của phân hệ **M41 - Pricing & Price Management** hoạt động như một bộ óc thương mại trung tâm (Central Commercial Brain) của NexusSync ERP. Nó chịu trách nhiệm định cấu hình, tính toán, tối ưu hóa và phê duyệt mọi chính sách giá trước khi xuất hóa đơn hoặc báo giá dòng đơn hàng (Sales Orders / Invoices).

```
   [ Yêu cầu báo giá đơn hàng ] ➔ [ Pricing Engine Service (M41) ]
                                            │
        ┌───────────────────────────────────┼──────────────────────────────────┐
        ▼ (Bước 1)                          ▼ (Bước 2)                         ▼ (Bước 3)
 [ Bảng giá áp dụng ]               [ Quy tắc Lũy kế số lượng ]       [ Quy tắc Chiết khấu Đơn ]
 (Retail / VIP / Contract)          (Quantity Break Tiers)            (Promo Rules Threshold)
        │                                   │                                  │
        └───────────────────────────────────┼──────────────────────────────────┘
                                            ▼
                                [ Đơn giá bán ròng dự phòng ]
                                            │
                                            ▼ (Bước 4)
                                [ Kiểm định Margin Safety ] <======> [ Giá vốn tham chiếu ]
                                (Biên lợi nhuận gộp vs Target)       (WA Cost vs FIFO Cost)
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼ (Biên an toàn đạt)                             ▼ (Biên vi phạm)
           [ Cho phép tự động ]                             [ Kích hoạt Maker-Checker ]
           (Duyệt đơn tự động)                              (Kế toán Trưởng / CFO Phê duyệt)
```

### Các thành phần chính của kiến trúc:
*   **Price Resolution Engine (Bộ máy Phân giải Giá bán Phân cấp)**: Thực hiện truy vấn và phân giải giá ròng theo sơ đồ hình phễu ưu tiên 6 cấp nghiêm ngặt:
    1.  *Customer-specific price (Giá đặc thù Khách hàng)*: Giá thỏa thuận riêng biệt với từng đối tác/khách hàng đặc thù.
    2.  *Customer Group price (Giá theo Nhóm khách hàng)*: Chính sách giá quy định cho phân khúc nhóm (ví dụ: Nhóm VIP, Đại lý cấp 1 - Dealer).
    3.  *Contract price (Giá thầu Hợp đồng khung)*: Đơn giá cố định trọn gói được ký kết trong hợp đồng dự án có hiệu lực.
    4.  *Promotion price (Giá Khuyến mãi Chiến dịch)*: Đơn giá chạy chương trình kích cầu hoặc Flash Sale có giới hạn thời gian.
    5.  *Price List Price (Giá theo Bảng giá chỉ định)*: Mức giá tiêu chuẩn niêm yết của bảng giá đang áp dụng hiện thời.
    6.  *Default Product Price (Giá niêm yết mặc định)*: Giá cơ sở lấy từ danh mục Master Product Catalog khi không có bất kỳ quy tắc đặc thù nào trùng khớp.
*   **Quantity-Break Pricing & Discounts (Chiết khấu bậc thang & Tổng đơn)**: Áp dụng chiết khấu tích lũy dựa trên số lượng đơn hàng thực tế (Quantity Breaks) và chiết khấu theo ngưỡng giá trị tổng đơn hàng (Order-level Discounts) xếp chồng lên đơn giá cơ sở đã được phân giải thành công.
*   **Margin Protection Rules (Quy tắc bảo vệ biên lợi nhuận)**: So sánh đơn giá bán ròng cuối cùng sau chiết khấu với giá vốn thực tế (Weighted Average hoặc FIFO). Hệ thống lập tức khóa phê duyệt tự động và kích hoạt quy trình phê duyệt tăng cường nếu biên lợi nhuận gộp danh định thấp hơn chỉ tiêu an toàn của sản phẩm (`targetMarginPercent`).
*   **Maker-Checker Workflow (Quy trình kiểm soát bốn mắt)**: Toàn bộ các đề xuất sửa đổi giá bán gốc đều được lưu giữ tạm thời dưới dạng `PENDING` và chỉ chính thức áp dụng thương mại sau khi được phê duyệt bởi CFO hoặc Kế toán trưởng.

---

## 2. RÀ SOÁT & PHỤC HỒI CÁC TÍNH NĂNG ẨN TRÊN UI (UI DECORATION & INTERACTION)

Trong quá trình rà soát giao diện hiện tại của phân hệ M41, chúng tôi phát hiện một số chức năng cốt lõi đã được định nghĩa trong mô hình dữ liệu nhưng chưa được hiển thị đầy đủ và cho phép tương tác trực tiếp trên giao diện người dùng. Chúng tôi đã tiến hành tối ưu hóa và hoàn thiện các tính năng sau:

1.  **Xóa Sản phẩm khỏi Bảng giá (Trash Action)**: Tích hợp nút Xóa sử dụng biểu tượng `Trash2` trong bảng danh mục sản phẩm, hỗ trợ người quản trị dọn dẹp danh mục bảng giá nhanh chóng khi sản phẩm ngừng kinh doanh.
2.  **Thêm Bậc Thang Giá Sỉ (Quantity Break Creator)**: Thiết kế Modal giao diện trực quan cho phép thêm mới quy tắc sỉ bậc thang cho bất kỳ sản phẩm nào trong kho từ danh mục Master. Tự động liên kết UOM và tính toán tỷ lệ chiết khấu đề xuất.
3.  **Tạo Quy tắc Chiết khấu Tổng đơn (Promo Rule Creator)**: Bổ sung form khởi tạo Quy tắc chiết khấu đơn hàng mới theo điều kiện giá trị tối thiểu, thời gian bắt đầu/kết thúc và tự động đưa vào danh sách kích hoạt của Pricing Engine.
4.  **Hệ thống Phục hồi & Đồng bộ Master Catalog**: Thiết kế nút "Thêm SP" thông minh liên kết trực tiếp với Master Product Catalog giúp kế toán nạp nhanh các mặt hàng mới (như *Gạch đỏ đặc Tuynel, Sơn nội thất Jotun, Kính cường lực Hải Long*) vào bảng giá đang làm việc chỉ với 1 click.
5.  **Duyệt/Từ chối Giá Biến Động (Maker-Checker Live)**: Nút Approve/Reject trong tab Lịch sử biến động giá hoạt động thời gian thực, cho phép quản lý duyệt trực tiếp các yêu cầu thay đổi giá đang chờ phê duyệt.

---

## 3. KIỂM THỬ KHẢ NĂNG CO GIÃN & CHỨC NĂNG IN / PDF (RESPONSIVE & PRINTER SUITE)

*   **Khả năng tương thích thiết bị (Responsive Design)**:
    *   Hệ thống bố cục được dựng trên hệ lưới linh hoạt Tailwind CSS (`grid-cols-1 lg:grid-cols-3` và `md:grid-cols-2 lg:grid-cols-4`).
    *   Thanh điều hướng chuyển đổi tab hỗ trợ thu gọn mượt mà, chuyển từ nhãn đầy đủ trên desktop sang dạng biểu tượng tiện lợi trên thiết bị di động nhỏ.
    *   Các bảng dữ liệu phức tạp được trang bị lớp bọc cuộn ngang an toàn (`overflow-x-auto`), ngăn chặn hoàn toàn hiện tượng vỡ khung hình trên màn hình điện thoại từ 4.7".
*   **Chức năng In & PDF**:
    *   **Giải pháp bypass popup blocker**: Trong môi trường sandbox iFrame của trình duyệt, việc sử dụng `window.open` thường bị chặn. Để giải quyết triệt để rào cản này, chúng tôi đã xây dựng **Bản xem trước tài liệu in (A4 PDF Layout Overlay)** hiển thị trực tiếp trong ứng dụng dưới dạng tờ giấy A4 tiêu chuẩn.
    *   Tờ in được định dạng chuyên nghiệp với đầy đủ thông tin pháp lý của tập đoàn NexusSync, bảng chi tiết SKU, giá niêm yết, khuyến mãi, đơn giá áp dụng, điều khoản thương mại, và ô chữ ký điện tử xác thực tự động của CFO cùng mã băm bảo mật.
    *   Tích hợp nút **In ngay / Lưu PDF** gọi lệnh in gốc của trình duyệt, hỗ trợ lưu trữ tệp PDF chất lượng cao không lỗi phông chữ tiếng Việt.

---

## 4. KẾT QUẢ KIỂM THỬ VẬN HÀNH THỰC TẾ (OPERATIONAL TESTING REPORT)

Chúng tôi đã thiết lập luồng dữ liệu giả lập và thực hiện kiểm thử quy trình khép kín trên phân hệ M41. Kết quả ghi nhận như sau:

| Mã ca kiểm thử | Nghiệp vụ kiểm tra | Các bước thao tác | Kết quả mong đợi | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **TC-M41-001** | Khởi tạo bảng giá mới và tự động nạp danh mục | Truy cập tab 1 ➔ Chọn "Tạo Bảng giá" ➔ Nhập thông tin "Bảng giá thầu Miền Nam" (SOUTH-BID) ➔ Bấm Khởi tạo | Bảng giá mới được tạo thành công, tự động nhân bản danh mục sản phẩm từ bảng giá gốc tiêu chuẩn để chỉnh sửa. | **Thành công** |
| **TC-M41-002** | Xóa sản phẩm khỏi bảng giá | Chọn sản phẩm "Thép Thanh Phi 18" trong danh sách ➔ Bấm nút Xóa (Trash2) | Sản phẩm biến mất khỏi bảng giá hoạt động, bắn thông báo Toast xác nhận thành công. | **Thành công** |
| **TC-M41-003** | Thêm mới bậc giá sỉ (Quantity Break) | Truy cập tab 2 ➔ Bấm "Thêm Bậc Thang" ➔ Nhập PROD-101, Min 100, Max 500, Giá 265,000₫ ➔ Lưu | Quy tắc sỉ mới xuất hiện trong bảng dữ liệu, sẵn sàng nạp vào bộ máy tính toán. | **Thành công** |
| **TC-M41-004** | Giả lập Pricing Engine & Cảnh báo Biên lợi nhuận | Truy cập tab 4 (Simulator) ➔ Chọn "Xi măng Vicem" ➔ Đặt số lượng mua = 120 bao ➔ Chọn Costing Bình quân | Hệ thống tự động tính giá net, đối chiếu giá vốn, phát hiện biên lợi nhuận an toàn đạt và hiển thị trạng thái xanh lá "Margin Secured". | **Thành công** |
| **TC-M41-005** | Phê duyệt biến động giá (Maker-Checker) | Chỉnh sửa giá thép trong bảng từ 285k xuống 215k ➔ Gửi phê duyệt ➔ Sang tab 5 (Audit) ➔ Click Approve | Giá trị được ghi nhận dưới dạng PENDING ở tab Audit, sau khi duyệt đổi sang APPROVED, bảo vệ hệ thống khỏi việc tự ý sửa giá. | **Thành công** |
| **TC-M41-006** | Kết xuất in bảng giá | Chọn bảng giá áp dụng ➔ Click biểu tượng máy in hoặc "In tài liệu" trong modal | Giao diện hiển thị bản xem trước A4 đẹp mắt, gọi hộp thoại in hệ thống mượt mà, lưu PDF thành công. | **Thành công** |
| **TC-M41-007** | Phân giải giá phân cấp (Price Resolution Engine) | Vào tab 4 (Simulator) ➔ Kích hoạt các lớp: Giá riêng Khách hàng (CUST-089), Nhóm VIP, Hợp đồng và KM | Trình phân giải tính toán chính xác giá thắng theo độ ưu tiên cao nhất (Giá riêng cho Hòa Phát), nạp trạng thái WINNER cho lớp ưu tiên 1 và OVR cho các lớp thấp hơn, hiển thị lưu vết Trace Log đầy đủ. | **Thành công** |

---

## 5. ĐỀ XUẤT BỔ SUNG TÍNH NĂNG ĐỂ PHÁT HUY THẾ MẠNH (AI COMMERCIAL UPGRADES)

Nhằm tối đa hóa sức mạnh của phân hệ M41 trong tương lai, chúng tôi đề xuất ban giám đốc cân nhắc bổ sung các tính năng nâng cao sau (không lập trình trong đợt này):

1.  **AI Dynamic Pricing Agent (Gemini Pricing Assistant)**: Sử dụng AI phân tích lịch sử biến động giá của thị trường thép/xi măng bên ngoài, nhu cầu xây dựng theo mùa, và mức tồn kho thực tế của doanh nghiệp để đề xuất mức giá bán lẻ tối ưu theo thời gian thực (Dynamic Yield Optimization).
2.  **Competitor Price Tracking System (Hệ thống giám sát giá đối thủ)**: Tự động cào dữ liệu từ website của các đối thủ cạnh tranh lớn, cảnh báo cho CFO nếu giá bán của NexusSync đang cao hơn hoặc thấp hơn đối thủ >5% để kịp thời điều chỉnh bảng giá.
3.  **Customer Lifetime Value Discount (Chiết khấu CLV tích lũy)**: Tự động phân tích tổng giá trị mua hàng lịch sử của khách hàng trong 365 ngày qua để tự động áp dụng chính sách giá thầu ưu đãi hơn mà không cần nhân viên kinh doanh phê duyệt thủ công.
