# QUY TRÌNH THAO TÁC CHUẨN (SOP): QUẢN LÝ VÀ CÁ NHÂN HÓA THÔNG BÁO HỆ THỐNG
**Mã tài liệu:** SOP-NOTIFY-2026-v1.1  
**Ngày hiệu lực:** 28/08/2026  
**Phiên bản:** v1.1  
**Đối tượng áp dụng:** Nhân viên Mua hàng, Kế toán, Quản lý kho, Quản đốc sản xuất, Quản trị hệ thống ERP.

---

## 1. Mục đích & Phạm vi
Tài liệu SOP này định nghĩa quy trình chuẩn trong việc theo dõi, phân loại, cấu hình bộ lọc ưu tiên và xử lý các thông báo (Notifications) trong hệ thống ERP **NexusSync**. Quy trình này giúp:
- Tối ưu hóa luồng thông tin nghiệp vụ đến đúng nhân sự chịu trách nhiệm.
- Ngăn ngừa tình trạng mệt mỏi vì cảnh báo dư thừa (**Alert Fatigue**).
- Đảm bảo các thông báo khẩn cấp (SLA Breach, Low Stock, v.v.) được phản hồi và xử lý tức thời.

---

## 2. Kiến trúc Phân loại Thông báo
Hệ thống phân chia thông báo thành 2 nhóm thuộc tính song song:

### 2.1 Theo Mức độ Nghiêm trọng (Severity)
- 🔴 **Danger (Khẩn cấp/Nguy hiểm):** Các sự kiện đe dọa trực tiếp đến hoạt động như lỗi giao dịch ACID, vi phạm SLA quá hạn nghiêm trọng, mất an toàn lao động.
- 🟡 **Warning (Cảnh báo):** Các sự kiện cần lưu ý sớm như hàng sắp dưới định mức tối thiểu, chậm duyệt PO nhẹ, chứng từ sắp hết hạn.
- 🟢 **Success (Thành công):** Xác nhận các tiến trình tự động hoàn tất như chạy xong MRP, đối soát ngân hàng khớp 100%, kiểm định chất lượng đạt chuẩn.
- 🔵 **Info (Thông tin):** Nhật ký hoạt động chung, đăng nhập hệ thống, cập nhật cấu hình.

### 2.2 Theo Vị trí Nghiệp vụ (Business Domains)
- 📦 **Tồn kho & Kho vận (Inventory):** Thông báo về mức dự trữ an toàn, kiểm đếm kho, chuyển kho.
- 🛒 **Mua sắm & Cung ứng (Procurement):** Trạng thái PO, duyệt báo giá PR, tương tác NCC.
- 🧪 **Kiểm soát chất lượng (Quality):** Trạng thái kiểm định lô sản xuất, phiếu lỗi QA.
- 💰 **Bán hàng & POS (Sales):** Đơn hàng SO mới, chốt ca POS cuối ngày.
- ⚙️ **Hệ thống (System):** Trục sự kiện EventBus, trạng thái Outbox Relay, lỗi kết nối.

---

## 3. Cấu hình Cá nhân hóa Bộ lọc (Preferences)
Để tránh mệt mỏi vì cảnh báo, nhân viên bắt buộc phải cá nhân hóa bộ lọc theo đúng vị trí công việc của mình:

### 3.1 Các bước thực hiện cấu hình trên Giao diện UI:
1. Nhấp vào **biểu tượng Chuông** ở góc dưới thanh điều hướng (Primary Sidebar) để mở **Notification Center Drawer**.
2. Cuộn xuống phần **"Cá nhân hóa Bộ lọc (Preferences)"** ở chân Drawer.
3. Sử dụng các công tắc bật/tắt để lọc thông báo:
   - **Lọc theo Mức độ:** Đề xuất nhân viên cấp thừa hành bật mọi thông báo `Danger` và `Warning`. Có thể tắt `Success` và `Info` nếu không có nhu cầu đối soát.
   - **Lọc theo Nghiệp vụ:** 
     - *Thủ kho/Trưởng kho:* Chỉ bật nhóm `Tồn kho (Inventory)` và `Kiểm soát chất lượng (Quality)`. Tắt nhóm `Mua sắm`, `Bán hàng` để tránh xao nhãng.
     - *Nhân viên mua hàng:* Chỉ bật nhóm `Mua sắm (Procurement)`. Tắt các nhóm còn lại.
     - *Quản trị viên IT:* Bật nhóm `Hệ thống (System)`.
4. Hệ thống tự động ghi nhớ trạng thái cấu hình của người dùng vào `localStorage` trên trình duyệt cá nhân để áp dụng vĩnh viễn cho các phiên làm việc tiếp theo.

---

## 4. Quy trình Xử lý Thông báo Khẩn cấp (Severity = Danger)
Mọi thông báo có nhãn đỏ 🔴 **Danger** đều có thời hạn SLA xử lý khắt khe. Các bước xử lý bao gồm:

```
[Tiếp nhận Thông báo] ──> [Đánh giá Chứng từ] ──> [Xử lý Nghiệp vụ] ──> [Đóng Cảnh báo]
```

### Bước 1: Tiếp nhận và Đọc chi tiết
- Khi nhận thông báo khẩn cấp, nhân viên click trực tiếp vào tiêu đề thông báo trong Drawer.
- Hệ thống sẽ tự động chuyển hướng trực quan đến phân hệ hoặc chứng từ bị ảnh hưởng (ví dụ: chuyển hướng về Workspace M20 khi nhận thông báo điều chỉnh kho).

### Bước 2: Đánh giá và Phân loại
- Đối chiếu mã sự kiện (ví dụ: `AL-101`, `AL-102`) với nhật ký kiểm toán tại **Context Rail** ở bên phải màn hình để xác định dòng thời gian của sự cố.

### Bước 3: Thực thi hành động khắc phục
- **Nếu là vi phạm SLA phê duyệt PO trễ hạn (SLA Breach):** Liên hệ ngay với Trưởng phòng hoặc Giám đốc tài chính (Maker-Checker Matrix) để giải quyết tắc nghẽn phê duyệt trực tiếp trên màn hình WorkQueue.
- **Nếu là tồn kho khả dụng âm hoặc dưới định mức (Low Stock Alert):** Kích hoạt luồng cân bằng cung cầu MRP (M26) hoặc phát hành Yêu cầu mua sắm PR mới để bổ sung lượng tồn.

### Bước 4: Đánh dấu đã đọc & Đóng cảnh báo
- Sau khi xử lý nghiệp vụ trên thực địa hoàn tất, nhấp vào biểu tượng **Checkmark** trên thông báo hoặc nhấp **"Đánh dấu tất cả đã đọc"** để làm sạch khay thông báo.

---

## 5. In ấn và Lưu trữ Nhật ký Thông báo
- Để lưu trữ báo cáo thông báo phục vụ mục đích kiểm toán cuối tháng, người dùng có thể nhấp nút **"In báo cáo kiểm toán"** tại chân Drawer.
- Biểu mẫu in chuẩn hóa sẽ xuất ra bao gồm: danh sách thông báo chưa đọc, số lượng thông báo theo từng mức độ, và thời gian lập biểu.

---

## 6. Các Hành vi Bị cấm (Invariants)
1. **Tuyệt đối không tắt cảnh báo mức độ `Danger`** đối với tài khoản cấp Trưởng phòng trở lên.
2. **Không bỏ qua việc gỡ lỗi** khi khay thông báo báo lỗi EventBus (mã hệ thống đỏ). Mọi lỗi hệ thống phải được giải quyết trong vòng 2 giờ kể từ khi phát sinh sự kiện.
