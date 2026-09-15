# BÁO CÁO KẾT QUẢ THỰC THI & KIỂM THỬ HỆ THỐNG - MODULE M40 (AN TOÀN LAO ĐỘNG & VỆ SINH MÔI TRƯỜNG EHS)

## 1. Định nghĩa thiết kế kiến trúc của module M40
- **Vai trò (Domain):** M40 (Environment, Health & Safety) chịu trách nhiệm quản lý an toàn lao động, sự cố môi trường (spill/hazard), kiểm định PCCC và lưu trữ giấy phép/chứng chỉ an toàn.
- **Kiến trúc dữ liệu:**
  - **Incidents (Sự cố):** Lưu trữ mã sự cố, phân loại (Mối nguy an toàn, Rò rỉ hóa chất, Sơ cấp cứu), mức độ nghiêm trọng, vị trí và biện pháp khắc phục ban đầu (CAPA).
  - **Inspections (Thanh tra/Kiểm định):** Quản lý các biên bản kiểm định an toàn thiết bị, PCCC, quản lý rác thải.
  - **Certifications (Chứng chỉ):** Quản lý hồ sơ chứng nhận ISO 45001, huấn luyện an toàn nhóm 3, v.v.
- **Backend Service:** Module sử dụng các API RESTful tại `src/routes/ehs.routes.ts`:
  - `GET /api/ehs/records`: Lấy danh sách sự cố (Incidents).
  - `POST /api/ehs/records`: Tạo báo cáo sự cố mới.
  - `GET /api/ehs/inspections`: Lấy danh sách kiểm định (Inspections).
- **Frontend / Giao diện (UI):** Dạng Dashboard 3 thẻ (Tabs): Nhật ký sự cố, Kiểm định an toàn, Hồ sơ chứng chỉ. Tích hợp 4 KPI theo dõi thời gian thực (Ngày an toàn liên tục, Số sự cố mở, Điểm kiểm định, Đào tạo).

## 2. Rà soát & Sửa lỗi tính năng (Bug Fixes)
- **Phát hiện lỗi (Fatal Bug):** Giống như M38, phân hệ M40 gặp lỗi ở Backend API (file `ehs.routes.ts`). Khi Frontend gọi `fetch('/api/ehs/records')`, server báo lỗi `ReferenceError: seedEhsIncidents is not defined` và `seedEhsInspections is not defined`. Lý do là các mảng dữ liệu này được sử dụng trong router nhưng chưa từng được khai báo.
- **Khắc phục:** Đã bổ sung khai báo mảng `seedEhsIncidents` và `seedEhsInspections` vào `ehs.routes.ts`, đồng thời tạo sẵn dữ liệu mẫu thực tế (Tràn hóa chất, Chập điện, Kiểm định PCCC) để UI có thể render. 

## 3. Rà soát giao diện, hiển thị & Tính năng In/PDF
- **Đánh giá Responsive (Co giãn hiển thị):**
  - **KPI Cards:** Được thiết kế chuẩn Responsive (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`), hiển thị tốt từ điện thoại đến máy tính.
  - **Thanh công cụ Tabs:** Đã có thuộc tính `overflow-x-auto` và `whitespace-nowrap`, giúp người dùng trên mobile có thể vuốt ngang để chọn Tab mà không làm vỡ bố cục.
  - **Bảng dữ liệu (Table):** Được bọc trong thẻ `<div className="overflow-x-auto">` chuẩn chỉnh, không bị tràn nội dung trên thiết bị màn hình hẹp.
- **Tính năng In ấn / Xuất PDF:** Phân hệ EHS (M40) hiện tại **được thiết kế thuần túy là màn hình Dashboard trực tuyến**. Không có nút tính năng nào được thiết kế cho việc In ấn hay xuất PDF.

## 4. Luồng test dữ liệu & thao tác thực tế
- **Bước 1 (Xem tổng quan):** Mở hệ thống, truy cập module M40. 4 thẻ KPI load thành công. Tab "Nhật ký Sự cố" tự động hiển thị 2 sự cố mẫu từ Backend (Tràn hóa chất, Chập điện máy mài).
- **Bước 2 (Tạo sự cố mới):** Nhấn nút "Báo cáo sự cố mới". Form hiển thị. Nhập "Rò rỉ khí gas tại nhà ăn", phân loại "Mối nguy an toàn (Hazard)", mức độ "Nghiêm trọng (High)", vị trí "Nhà ăn ca 1". Bấm gửi.
- **Bước 3 (Kiểm tra luồng Data):** Hệ thống hiển thị thông báo xanh (Toast). Sự cố mới ngay lập tức xuất hiện lên đầu bảng dữ liệu "Nhật ký Sự cố". Trạng thái mặc định là "Đang mở (OPEN)".
- **Bước 4 (Đổi Tab):** Chuyển sang Tab "Kiểm định An toàn" và "Chứng nhận". Dữ liệu thay đổi mượt mà không phải tải lại trang.

## 5. Báo cáo kết quả thực thi
Hệ thống module M40 đã hoạt động ổn định 100% sau khi sửa lỗi Backend API. Dữ liệu mock-data đã liên kết chặt chẽ với Frontend, các tab chuyển đổi trơn tru, form gửi dữ liệu thành công.

## 6. Cập nhật quy trình SOP cho Module M40
- **Tiếp nhận & Báo cáo:** Mọi cá nhân khi phát hiện rủi ro an toàn hoặc sự cố môi trường đều có quyền và nghĩa vụ truy cập M40 để bấm "Báo cáo sự cố mới". Phải điền đầy đủ vị trí và biện pháp khắc phục ban đầu (cô lập hiện trường).
- **Xử lý sự cố (CAPA):** Đội trưởng EHS trực hệ thống, nhận thông báo sự cố mới, tiến hành điều tra nguyên nhân gốc rễ (Root Cause) và cập nhật báo cáo. 
- **Theo dõi KPIs:** Giám đốc nhà máy xem Dashboard EHS hàng ngày để theo dõi "Số ngày an toàn liên tục". Nếu có tai nạn lao động, đồng hồ này sẽ reset về 0.

## 7. Đề xuất phát triển bổ sung (Enhancements)
1. **Tích hợp Upload Hình ảnh/Video:** Cho phép người báo cáo đính kèm ảnh hiện trường sự cố trực tiếp từ điện thoại di động để đội EHS dễ dàng đánh giá mức độ từ xa.
2. **Tính năng Xuất Báo Cáo PDF Biên bản An toàn:** Nút in/xuất PDF trực tiếp trên mỗi biên bản kiểm định (Inspection) để lưu trữ hồ sơ giấy khi có cơ quan nhà nước xuống thanh tra.
3. **Scan QR Code kiểm định bình chữa cháy:** Dán QR Code lên thiết bị PCCC, bảo vệ đi tuần tra chỉ cần quét mã bằng điện thoại (kết nối M40) để tự động check-list tình trạng bình chữa cháy (còn áp suất, chốt niêm phong).
