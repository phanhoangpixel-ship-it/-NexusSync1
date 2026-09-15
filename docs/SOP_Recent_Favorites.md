# QUY TRÌNH THAO TÁC CHUẨN (SOP): QUẢN LÝ LỐI TẮT YÊU THÍCH & LỊCH SỬ TRUY CẬP (RECENT & FAVORITES)
**Mã tài liệu:** SOP-NAV-2026-v1.0  
**Ngày hiệu lực:** 28/08/2026  
**Phiên bản:** v1.0  
**Đối tượng áp dụng:** Toàn bộ người vận hành hệ thống ERP NexusSync.

---

## 1. Mục đích & Phạm vi
Tài liệu SOP này hướng dẫn người dùng cuối cách tối ưu hóa không gian làm việc và nâng cao hiệu suất điều hướng trong NexusSync ERP thông qua phân hệ **Recent & Favorites**. Phân hệ này cho phép:
- Đánh dấu ghim (Pin) các phân hệ nghiệp vụ thường dùng thành các lối tắt Yêu thích.
- Tổ chức lối tắt thành các nhóm tùy chỉnh (ví dụ: "Hàng ngày", "Cuối tháng") để dễ quản lý.
- Thêm ghi chú định hướng công việc cho từng liên kết.
- Tự động ghi nhận lịch sử truy cập (Recents) để chuyển đổi nhanh giữa các màn hình.
- Xuất dữ liệu cấu hình hoặc in ấn danh sách liên kết nhanh phục vụ bàn giao ca làm việc.

---

## 2. Quy trình Thao tác trên Giao diện UI

### 2.1 Ghim một Phân hệ vào danh sách "Yêu thích" (Favorites)
Khi đang làm việc tại bất kỳ phân hệ nào (ví dụ: *Kiểm soát Tồn kho M17*, *Phiếu điều chỉnh M20*):
1. Nhìn lên thanh tiêu đề trên cùng (Header) của Workspace chính.
2. Tìm **biểu tượng Ngôi sao** cạnh tiêu đề phân hệ.
3. Nhấp vào ngôi sao:
   - Nếu ngôi sao đổi sang màu vàng ấm ⭐️, phân hệ đã được đưa vào danh sách **Yêu thích** thành công.
   - Nếu ngôi sao đổi sang dạng viền rỗng ☆, phân hệ đã được gỡ bỏ khỏi danh sách Yêu thích.
4. Lối tắt sẽ xuất hiện tức thì tại phần **"YÊU THÍCH"** trên thanh điều hướng bên trái (Primary Navigation Sidebar).

### 2.2 Quản lý Nâng cao bằng Drawer Quản lý
Nhấp vào **biểu tượng Bánh răng/Cài đặt** cạnh tiêu đề "YÊU THÍCH & LỊCH SỬ" trên sidebar để mở **Recent & Favorites Drawer**. Tại đây, thực hiện các thao tác:

#### A. Phân loại Nhóm Tùy chỉnh (Custom Groups)
Để gom các lối tắt theo mục đích sử dụng (tránh lộn xộn):
1. Tìm lối tắt cần phân nhóm trong tab "Yêu thích".
2. Click vào ô chọn nhóm (dropdown) bên dưới tên phân hệ.
3. Chọn một nhóm có sẵn (ví dụ: *Hàng ngày*, *Hàng tuần*, *Cuối tháng*) hoặc tạo nhóm mới.
4. Hệ thống sẽ tự động phân tách danh sách theo các tiêu đề nhóm trực quan.

#### B. Thêm Ghi chú Cá nhân (Personal Annotations)
Nhân viên bàn giao ca có thể ghi chú nhanh công việc cần làm tại phân hệ đó:
1. Nhập văn bản ghi chú vào ô **"Ghi chú nhanh..."** trực tiếp trên thẻ của phân hệ yêu thích.
2. Hệ thống tự động lưu trữ tức thì khi người dùng gõ phím.
3. Ghi chú này sẽ hiển thị dưới dạng tooltip hoặc nhãn nhỏ dưới tên phân hệ trên sidebar để nhắc nhở công việc mỗi lần đăng nhập.

#### C. Chuyển hướng nhanh & Làm sạch Lịch sử
- **Chuyển hướng:** Nhấp vào bất kỳ thẻ phân hệ nào trong tab "Yêu thích" hoặc "Lịch sử" để nhảy trực tiếp đến không gian làm việc đó.
- **Xóa nhật ký Lịch sử:** Nếu muốn bảo mật hoặc làm gọn danh sách truy cập gần đây, nhấp nút **"Xóa lịch sử"** màu xám ở chân danh sách để dọn dẹp bộ nhớ đệm.

---

## 3. Quy trình Xuất bản & Bàn giao Ca (Print & CSV Export)

### 3.1 Xuất tệp dữ liệu CSV
1. Mở **Recent & Favorites Drawer**.
2. Nhấp nút **"Xuất CSV"** ở góc phải trên cùng.
3. Hệ thống sẽ kết xuất file `nexussync_shortcuts_export.csv` bao gồm các cột: *Mã phân hệ, Tên phân hệ, Nhóm phân loại, Ghi chú cá nhân, Tần suất click*.
4. Sử dụng file này để import vào tài khoản mới hoặc chia sẻ cho nhân sự nhận bàn giao ca.

### 3.2 In biểu mẫu danh sách lối tắt (Print Report)
1. Trong Drawer, nhấp nút **"In báo cáo"**.
2. Hệ thống tự động tạo một phiên bản in tối giản, chuyên nghiệp (loại bỏ thanh cuộn, nút bấm và nền màu thừa).
3. Người dùng chọn in ra giấy hoặc xuất file **PDF** để lưu giữ dưới dạng phụ lục báo cáo ca làm việc hoặc SOP nội bộ.

---

## 4. Các Ràng buộc Bất biến của Hệ thống (System Invariants)
1. **Bảo mật Quyền hạn (Access Control):** Mặc dù người dùng có thể ghim bất kỳ phân hệ nào vào danh sách Yêu thích, hệ thống sẽ ẩn các lối tắt đó nếu tài khoản đang đăng nhập không có quyền truy cập tương ứng trong hồ sơ vai trò hiện hành (**Role Profile**).
2. **Giới hạn Lưu trữ (Storage Cap):**
   - Danh sách Lịch sử truy cập gần đây (Recents) tự động giới hạn tối đa **10 mục** gần nhất để tối ưu hiệu năng và diện tích hiển thị.
   - Danh sách Yêu thích không giới hạn số lượng, nhưng khuyến nghị giới hạn tối đa **15 mục** để tránh quá tải thị giác.
3. **Tính Bất biến của Bộ nhớ (Storage Isolation):** Dữ liệu Recent & Favorites được lưu trữ độc lập theo tài khoản và thiết bị thông qua khóa định danh duy nhất trên trình duyệt web (`localStorage`).
