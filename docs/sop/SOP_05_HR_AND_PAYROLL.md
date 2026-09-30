# NEXUSSYNC ERP — QUY TRÌNH VẬN HÀNH TIÊU CHUẨN (SOP)
## MÃ QUY TRÌNH: SOP-HR-05 — QUY TRÌNH NHÂN SỰ, CHẤM CÔNG VÀ TÍNH LƯƠNG (HR & PAYROLL)

---

### 1. MỤC ĐÍCH & PHẠM VI
* **Mục đích:** Quản lý vòng đời nhân sự chặt chẽ, tính toán chính xác ngày công, tiền lương, hoa hồng, bảo hiểm bắt buộc và thuế TNCN, chi trả lương đúng hạn (ngày 05 hàng tháng).
* **Phạm vi áp dụng:** Bộ phận Nhân sự (HR/C&B), Kế toán Lương, Toàn thể Cán bộ Nhân viên.
* **Hệ thống áp dụng:** Phân hệ `M28` (Nhân Sự & Tiền Lương), `M14` (Hoa Hồng Kinh Doanh), `M30` (Sổ Cái Kế Toán Lương), `M32` (Thanh Toán Lương).

---

### 2. SƠ ĐỒ DÒNG NGHIỆP VỤ (WORKFLOW)

```
[B1: Quản Trị Hồ Sơ Nhân Sự] ──> [B2: Chấm Công & Nghỉ Phép] ──> [B3: Tính Hoa Hồng Sales] ──> [B4: Tính Lương Tổng Hợp] ──> [B5: Duyệt & Đẩy Sổ Cái] ──> [B6: Chi Trả & Phiếu Lương]
      (M28 Employee Registry)          (M28 Time Attendance)            (M14 Sales Commission)            (M28 Payroll Desk)             (M28 / M30 GL Auto)         (M28 Payslip/Bank)
```

---

### 3. CÁC BƯỚC THỰC HIỆN CHI TIẾT

#### Bước 1: Tiếp Nhận & Quản Trị Hồ Sơ Nhân Sự
* **Người thực hiện:** Chuyên viên Tuyển dụng & Nhân sự (`HR_SPECIALIST`).
* **Màn hình:** `M28 HR & Payroll Workspace` / Tab *Hồ Sơ Nhân Viên*.
* **Thao tác:**
  1. Tạo hồ sơ nhân sự mới (`EMP-XXXXX`).
  2. Khai báo thông tin cá nhân, chức danh, phòng ban, loại hợp đồng và mức lương đóng BHXH.
  3. Quản lý hồ sơ nhân sự 360° (văn bằng, chứng chỉ, người phụ thuộc giảm trừ gia cảnh).

#### Bước 2: Chấm Công, Theo Dõi Ca & Quản Lý Nghỉ Phép
* **Người thực hiện:** Cán bộ Nhân viên & Trưởng Bộ Phận.
* **Màn hình:** `M28 HR & Payroll Workspace` / Tab *Chấm Công & Nghỉ Phép*.
* **Thao tác:**
  1. Nhân viên nộp đơn xin nghỉ phép / làm ngoài giờ (OT) trực tuyến (`LR-YYYYMMDD-XXXX`).
  2. Trưởng bộ phận duyệt đơn theo phân cấp thẩm quyền.
  3. Ngày 01 hàng tháng: Chuyên viên C&B đồng bộ dữ liệu chấm công và chốt Bảng tổng hợp công tháng.

#### Bước 3: Tính Toán & Chốt Hoa Hồng Kinh Doanh
* **Người thực hiện:** Kế toán Doanh số (`COMMISSION_ACCOUNTANT`).
* **Màn hình:** `M14 Sales Commission Workspace`.
* **Thao tác (Ngày 02 hàng tháng):**
  1. Chạy động cơ tính hoa hồng bán hàng theo chỉ tiêu KPI và chính sách lũy tiến.
  2. Xử lý các khoản thu hồi hoa hồng (Clawback) từ các đơn hàng bị trả lại hoặc quá hạn nợ.
  3. Nhấn `Chốt Dữ Liệu Hoa Hồng` chuyển sang bảng lương tháng.

#### Bước 4: Tính Lương Tổng Hợp (Gross-to-Net)
* **Người thực hiện:** Chuyên viên C&B (`PAYROLL_OFFICER`).
* **Màn hình:** `M28 HR & Payroll Workspace` / Tab *Tính Lương GL Desk*.
* **Thao tác (Ngày 03 hàng tháng):**
  1. Tạo đợt tính lương `PAYROLL-YYYYMM`.
  2. Nhấn `Tính Toán Lương Tự Động`. Hệ thống tính:
     $$\text{Lương Thực Nhận (Net)} = \text{Lương Cơ Bản (theo công)} + \text{Phụ Cấp} + \text{Hoa Hồng} - \text{BHXH/BHYT/BHTN (10.5\%)} - \text{Thuế TNCN} - \text{Tạm Ứng}$$
  3. Kiểm tra các cảnh báo bất thường về ngày công hoặc số thuế TNCN phát sinh.

#### Bước 5: Phê Duyệt Bảng Lương & Tích Hợp Sổ Cái Kế Toán
* **Người thực hiện:** Kế toán Trưởng & Tổng Giám Đốc.
* **Màn hình:** `M28 HR & Payroll Workspace` / Tab *Bàn Duyệt Lương*.
* **Thao tác (Ngày 04 hàng tháng):**
  1. Kế toán Trưởng rà soát tổng quỹ lương, Tổng Giám Đốc ký duyệt điện tử.
  2. Hệ thống tự động sinh bút toán hạch toán chi phí lương vào Sổ cái `M30`:
     * Nợ TK 641, 642, 622, 627 (Chi phí lương các bộ phận)
     * Có TK 334 (Phải trả người lao động)
     * Có TK 3383, 3384, 3386 (Bảo hiểm xã hội, y tế, thất nghiệp)
     * Có TK 3335 (Thuế thu nhập cá nhân)

#### Bước 6: Chi Trả Lương & Phát Hành Phiếu Lương Điện Tử
* **Người thực hiện:** Kế toán Thanh toán, Toàn thể Nhân viên.
* **Màn hình:** `M28 HR & Payroll Workspace` / Tab *Xuất Chi Trả & Phiếu Lương*.
* **Thao tác (Ngày 05 hàng tháng):**
  1. Xuất file lệnh chuyển khoản ngân hàng hàng loạt (Vietcombank, Techcombank, ACB).
  2. Hệ thống tự động phát hành Phiếu lương điện tử (`SLIP-YYYYMM-XXXXX`) bảo mật vào trang tự phục vụ (Self-Service) của từng cá nhân.

---

### 4. BIỂU MẪU & BÁO CÁO BẮT BUỘC
* **Mẫu in:** Bảng thanh toán tiền lương theo TT 200 (`Mẫu 02-LĐTL`), Phiếu lương cá nhân (Payslip Detail Print), Quyết định khen thưởng/kỷ luật.
* **Báo cáo:** Báo cáo Tổng hợp Công - Lương toàn công ty, Báo cáo Trích nộp BHXH/BHYT/BHTN (Mẫu C70a-HD), Báo cáo Tờ khai Khấu trừ Thuế TNCN (Mẫu 05/KK-TNCN).
