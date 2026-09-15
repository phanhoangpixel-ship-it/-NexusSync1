# QUY TRÌNH THAO TÁC CHUẨN (SOP): QUẢN LÝ CẤU HÌNH CÁ NHÂN & HỆ THỐNG
**Mã tài liệu:** SOP-PREFS-2026-v1.0  
**Ngày hiệu lực:** 28/08/2026  
**Phiên bản:** v1.0  
**Đối tượng áp dụng:** Toàn bộ nhân sự vận hành trên nền tảng ERP NexusSync.

---

## 1. Mục đích & Phạm vi
Tài liệu SOP này định nghĩa quy trình chuẩn trong việc thiết lập cấu hình giao diện, mật độ hiển thị, địa phương hóa định dạng và bảo mật dữ liệu trên **NexusSync ERP**. Quy trình giúp:
- Tối ưu hóa hiệu năng thị giác theo từng ca làm việc (ca sáng/ca tối) và thiết bị hiển thị.
- Đảm bảo tính sẵn sàng của dữ liệu ngoại tuyến khi mất mạng tạm thời.
- Chuẩn hóa quy trình sao lưu và phục hồi thiết lập cá nhân của nhân sự.

---

## 2. Quy trình Thao tác trên Giao diện UI

### 2.1 Truy cập Preferences Control Panel
1. Nhìn xuống khu vực **Administration** ở cuối thanh điều hướng chính (Primary Navigation Sidebar) bên trái.
2. Nhấp vào nút **Preferences** (biểu tượng bánh răng).
3. Bảng điều khiển **Preferences Control Panel** dạng Drawer sẽ trượt ra từ bên phải màn hình.

### 2.2 Cấu hình Giao diện & Hiển thị (Tab: Giao diện & UI)
- **Thiết lập Chủ đề màu (Theme Color Style):**
  - *Light Minimalist:* Khuyến nghị cho ca làm việc ban ngày tại văn phòng.
  - *Cool Tech Dark:* Khuyến nghị cho ca tối hoặc bộ phận kiểm toán bảo mật để giảm mỏi mắt.
  - *Warm Sepia:* Phù hợp với nhân viên xử lý chứng từ dài hạn để tránh ánh sáng xanh.
- **Thiết lập Mật độ hiển thị (Display Density):**
  - *Spaced (16px):* Dành cho quản lý xem biểu đồ tổng quan hoặc thiết bị màn hình cảm ứng lớn.
  - *Cozy (12px):* Cấu hình cân bằng tiêu chuẩn cho đa số nhân sự văn phòng.
  - *Compact (8px):* Khuyến nghị đặc biệt cho Thủ kho hoặc Điều phối viên Cung ứng để tối đa hóa số dòng dữ liệu hiển thị trên một màn hình mà không cần cuộn.
- **Lối tắt Bàn phím (Keyboard Hotkeys):**
  - Bật công tắc để sử dụng các tổ hợp phím tắt toàn hệ thống.

### 2.3 Cấu hình Địa phương hóa & Định dạng (Tab: Định dạng & Địa phương)
- **Hệ ngôn ngữ làm việc:** Hỗ trợ dịch chuyển tức thì giữa Tiếng Việt, English, và Japanese.
- **Cấu hình Tiền tệ:** Chọn hệ định dạng tiền tệ VND (1.250.000 ₫), USD ($1,250.00) hoặc EUR (1.250,00 €) làm tiêu chuẩn quy đổi mặc định.
- **Màn hình khởi chạy (Default Landing Module):** Chọn phân hệ nghiệp vụ thường làm việc nhất (ví dụ: *Inventory Core*, *Purchase Orders*) để hệ thống tự động tải trực tiếp ngay sau khi đăng nhập.

### 2.4 Cấu hình Bảo mật & Lưu trữ (Tab: Hệ thống & Cache)
- **Tự khóa phiên làm việc (Session Timeout SLA):** Chọn hạn ngạch 15 phút, 30 phút, 60 phút hoặc 24 giờ. Hệ thống sẽ tự động khóa và yêu cầu xác thực lại để bảo vệ thông tin khi người dùng rời máy.
- **Đệm ngoại tuyến (Offline cache):** Luôn bật công tắc này để hệ thống kích hoạt tự động đồng bộ hóa dữ liệu xuống trình duyệt khi đường truyền internet chập chờn.
- **Âm thanh cảnh báo (Sound Alert):** Bật công tắc để nhận tín hiệu âm thanh khi có sự kiện EDA khẩn cấp. Click nút **"Thử âm"** để kiểm tra âm lượng loa ngoài.

---

## 3. Quy trình Sao lưu, Phục hồi & In ấn Cấu hình

### 3.1 Xuất tệp sao lưu cấu hình (Backup)
1. Mở **Preferences Control Panel**.
2. Nhấp vào nút **Download** (Xuất tệp sao lưu) trên thanh công cụ đầu Drawer.
3. Hệ thống sẽ tải xuống tệp tin dạng `nexussync_preferences_YYYY-MM-DD.json`. Lưu trữ tệp này để chuyển đổi cấu hình khi đổi thiết bị làm việc.

### 3.2 Khôi phục cài đặt gốc (Reset)
1. Khi giao diện bị xáo trộn ngoài ý muốn hoặc cần thiết lập lại từ đầu, nhấp nút **"Reset mặc định"**.
2. Hệ thống sẽ ngay lập tức khôi phục toàn bộ tham số về cấu hình chuẩn ban đầu.

### 3.3 In biểu mẫu Log cấu hình (Print Preferences)
1. Nhấp nút **Printer** (biểu tượng máy in) trên thanh công cụ.
2. Trình duyệt sẽ khởi tạo bản in tối giản, loại bỏ hoàn toàn các nút thao tác dư thừa và căn lề chuyên nghiệp để kết xuất file báo cáo **PDF** hoặc in ấn trực tiếp phục vụ kiểm toán tài khoản.

---

## 4. Các Điều khoản Bắt buộc (Invariants)
1. **Bảo mật phiên:** Không cấu hình hạn ngạch khóa phiên quá **60 phút** đối với các tài khoản thuộc bộ phận Kế toán kho hoặc Phê duyệt mua hàng.
2. **Offline Caching:** Khuyến nghị kích hoạt bộ nhớ đệm ngoại tuyến trên các thiết bị di động di chuyển liên tục trong lòng kho bãi để tránh mất mát dữ liệu hóa đơn giao nhận.
