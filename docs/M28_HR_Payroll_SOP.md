# SOP: QUY TRÌNH QUẢN TRỊ NHÂN SỰ & BẢNG LƯƠNG (MODULE M28 - HR / HCM)

## 1. Mục Đích & Phạm Vi
Quy trình này quy định chuẩn mực vận hành cho **Module M28: HR & Payroll (Quản trị Nhân sự & Tính lương tự động)** trong hệ thống NexusSync ERP. Áp dụng cho bộ phận Nhân sự (HRM), Kế toán tiền lương, Trưởng bộ phận và Ban Giám đốc.

## 2. Các Bước Vận Hành Chuẩn (Step-by-Step SOP)

### Bước 1: Quản Lý Hồ Sơ Nhân Sự (Employee Registry)
- Truy cập **Module M28: HR & Payroll** và chọn tab **Hồ sơ Nhân sự**.
- Theo dõi danh sách nhân viên toàn doanh nghiệp, mã nhân viên, phòng ban, chức danh và mức lương cơ bản.
- Bấm **Thêm nhân viên** để khởi tạo hồ sơ nhân sự mới (họ tên, giới tính, số điện thoại, phòng ban, chức danh, mức lương cơ bản). Hệ thống tự động cấp mã NV và trạng thái `ACTIVE`.
- Click vào từng nhân viên để xem cửa sổ ngữ cảnh L5 tích hợp dòng đời, lịch sử hợp đồng và định khoản GL chi phí lương.

### Bước 2: Giám Sát Chấm Công & Điểm Danh (Attendance Tracking)
- Chuyển sang tab **Chấm công & Điểm danh**.
- Kiểm soát giờ vào (`Check-in`), giờ ra (`Check-out`), tổng giờ làm việc và thời gian tăng ca (`OT Hours`) của từng nhân sự trong ngày.

### Bước 3: Quản Lý & Phê Duyệt Đơn Nghỉ Phép (Leave Management)
- Truy cập tab **Đơn Nghỉ phép**.
- Nhân viên hoặc bộ phận HR có thể bấm **Tạo đơn nghỉ phép** để đăng ký nghỉ phép năm, nghỉ ốm, kèm lý do và khoảng thời gian.
- Trưởng bộ phận hoặc Admin bấm **Phê duyệt** trên các đơn có trạng thái `PENDING` để cập nhật trạng thái `APPROVED`.

### Bước 4: Tính Lương & Hạch Toán Sổ Cái GL (Payroll & General Ledger Posting)
- Truy cập tab **Bảng lương & Hạch toán GL**.
- Bấm **Tính lương & Ghi sổ GL** để hệ thống tự động tổng hợp tổng lương Gross, khấu trừ BHXH (10.5%), thuế thu nhập cá nhân (TNCN) và thực lĩnh Net của toàn bộ nhân sự.
- Hệ thống tự động sinh bút toán hạch toán vào Sổ cái tài khoản **TK 334 (Phải trả người lao động)** và **TK 642 / 622 (Chi phí lương)** với độ chính xác tuyệt đối.

## 3. Kiểm Soát & Phê Duyệt (Rule #19 Compliance)
Mọi thao tác thêm mới nhân sự, phê duyệt nghỉ phép và tính toán bảng lương đều tuân thủ chặt chẽ nguyên tắc kiểm soát nội bộ, ghi nhận nhật ký kiểm toán với mã băm SHA-256.
