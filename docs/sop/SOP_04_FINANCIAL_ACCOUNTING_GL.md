# NEXUSSYNC ERP — QUY TRÌNH VẬN HÀNH TIÊU CHUẨN (SOP)
## MÃ QUY TRÌNH: SOP-FIN-04 — QUY TRÌNH KẾ TOÁN TỔNG HỢP VÀ KHÓA SỔ TÀI CHÍNH (FINANCIAL & GL)

---

### 1. MỤC ĐÍCH & PHẠM VI
* **Mục đích:** Ghi nhận đầy đủ, kịp thời, trung thực mọi nghiệp vụ kinh tế phát sinh, lập Báo cáo Tài chính tuân thủ chế độ kế toán doanh nghiệp Việt Nam (Thông tư 200/2014/TT-BTC).
* **Phạm vi áp dụng:** Phòng Kế toán - Tài chính, Kế toán viên các phần hành, Kế toán Trưởng, CFO.
* **Hệ thống áp dụng:** Phân hệ `M30` (Sổ Cái & Kế Toán Tổng Hợp), `M31` (Công Nợ Phải Trả), `M32` (Tiền Mặt & Ngân Hàng), `M34` (Tài Sản Cố Định), `M37` (Báo Cáo Tài Chính Đa Chiều BI).

---

### 2. SƠ ĐỒ DÒNG NGHIỆP VỤ (WORKFLOW)

```
[B1: Tiếp Nhận Chứng Từ Gốc] ──> [B2: Lập Bút Toán Nhật Ký] ──> [B3: Kiểm Tra & Duyệt Sổ Cái] ──> [B4: Bút Toán Cuối Kỳ & Khóa Sổ] ──> [B5: Lập Báo Cáo Tài Chính]
        (M31 / M32 / M13 / M08)                 (M30 General Ledger)              (M30 / M28 Approval)                   (M30 Period Closing)               (M37 Financial BI / M30)
```

---

### 3. CÁC BƯỚC THỰC HIỆN CHI TIẾT

#### Bước 1: Tiếp Nhận & Kiểm Soát Chứng Từ Gốc
* **Người thực hiện:** Kế toán viên phần hành (AP, AR, Kho, Lương).
* **Màn hình:** `M31 (AP)`, `M32 (AR/Vốn bằng tiền)`, `M34 (Tài sản)`.
* **Thao tác:**
  1. Kiểm tra tính hợp lệ, hợp pháp của hóa đơn điện tử, hợp đồng, chứng từ ngân hàng.
  2. Mọi nghiệp vụ thương mại (Bán hàng, Mua hàng, Nhập xuất kho) được hệ thống tự động đẩy về hàng đợi định khoản của Sổ cái `M30`.

#### Bước 2: Hạch Toán Bút Toán Nhật Ký Chung (Journal Entry)
* **Người thực hiện:** Kế toán Tổng hợp (`GENERAL_ACCOUNTANT`).
* **Màn hình:** `M30 General Ledger Workspace` / Tab *Nhật Ký Bút Toán*.
* **Thao tác:**
  1. Nhấn `+ Lập Phiếu Kế Toán Mới` (`JV-YYYYMMDD-XXXX`).
  2. Khai báo các dòng Nợ/Có theo hệ thống tài khoản TT 200 (Chi tiết đến tiểu khoản cấp 2, 3).
  3. Gán đối tượng chi phí: Trung tâm chi phí (Cost Center), Dự án (Project), Đối tượng công nợ.
  4. Hệ thống kiểm tra cân bằng: Bắt buộc $\sum \text{Nợ} = \sum \text{Có}$.
  5. Nhấn `Trình Duyệt (Submit)`.

#### Bước 3: Kiểm Tra & Phê Duyệt Ghi Sổ Cái
* **Người thực hiện:** Kế toán Trưởng (`CHIEF_ACCOUNTANT`).
* **Màn hình:** `M30 General Ledger Workspace` / Tab *Duyệt Chứng Từ*.
* **Thao tác:**
  1. Rà soát danh sách chứng từ trạng thái `SUBMITTED`.
  2. Nhấn `Phê Duyệt Ghi Sổ (POST)`.
  3. Hệ thống ghi nhận chính thức vào Sổ Cái (GL Book). Bút toán đã `POSTED` được đóng băng, không thể sửa đổi trực tiếp.

#### Bước 4: Thực Hiện Các Bút Toán Cuối Kỳ & Khóa Kỳ Kế Toán
* **Người thực hiện:** Kế toán Trưởng (`CHIEF_ACCOUNTANT`).
* **Màn hình:** `M30 General Ledger Workspace` / Tab *Khóa Sổ Cuối Kỳ*.
* **Thao tác định kỳ (ngày cuối tháng/quý):**
  1. Chạy trích khấu hao TSCĐ & phân bổ CCDC (TK 214, 242).
  2. Đánh giá lại số dư ngoại tệ cuối kỳ (TK 1112, 1122, 131, 331).
  3. Kết chuyển tự động toàn bộ doanh thu, chi phí sang TK 911 để xác định kết quả kinh doanh (Lãi/Lỗ TK 421).
  4. Nhấn `Khóa Kỳ Kế Toán (Close Period)`. Toàn bộ dữ liệu kỳ kế toán chuyển trạng thái `LOCKED`.

#### Bước 5: Lập Báo Cáo Tài Chính & Phân Tích BI
* **Người thực hiện:** Giám đốc Tài chính (`CFO`), Ban Lãnh đạo.
* **Màn hình:** `M37 Financial BI Analytics Workspace`.
* **Thao tác:**
  1. Xuất bộ Báo cáo Tài chính tiêu chuẩn:
     * Bảng Cân đối Kế toán (`Mẫu B01-DN`)
     * Báo cáo Kết quả Hoạt động Kinh doanh (`Mẫu B02-DN`)
     * Báo cáo Lưu chuyển Tiền tệ (`Mẫu B03-DN`)
  2. Theo dõi các chỉ số tài chính quản trị (EBITDA, Tỷ suất nợ, Vòng quay vốn lưu động, Dự báo dòng tiền 90 ngày).

---

### 4. BIỂU MẪU & BÁO CÁO BẮT BUỘC
* **Mẫu in:** Phiếu thu (`Mẫu 01-TT`), Phiếu chi (`Mẫu 02-TT`), Phiếu kế toán (`Mẫu 01-KT`).
* **Báo cáo:** Bảng Cân đối Số phát sinh, Sổ Nhật ký chung, Sổ Cái các tài khoản, Báo cáo Tài chính trọn bộ Thông tư 200.
