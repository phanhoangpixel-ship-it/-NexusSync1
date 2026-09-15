# SOP: QUY TRÌNH QUẢN TRỊ HỢP NHẤT BÁO CÁO TÀI CHÍNH TẬP ĐOÀN (MODULE M34 - FINANCIAL CONSOLIDATION)

## 1. Mục Đích & Phạm Vi
Quy trình này quy định chuẩn mực vận hành cho **Module M34: Financial Consolidation (Hợp Nhất Báo Cáo Tài Chính Đa Chi Nhánh & Tập Đoàn)** trong hệ thống NexusSync ERP. Áp dụng cho Giám đốc Tài chính (CFO), Kế toán trưởng Tập đoàn, Kế toán Hợp nhất và Ban Kiểm soát Nội bộ.

---

## 2. Các Bước Vận Hành Chuẩn (Step-by-Step SOP)

### Bước 1: Rà Soát Danh Mục Đơn Vị Thành Viên & Sở Hữu (Subsidiary & Group Ownership Review)
- Truy cập **Module M34: Financial Consolidation** và chọn tab **2. Danh Mục Đơn Vị Thành Viên & Sở Hữu**.
- Kiểm tra danh sách các đơn vị thành viên tập đoàn (Công ty mẹ HQ Hà Nội, Chi nhánh HCM, Công ty con sở hữu 80% Đà Nẵng, Công ty con ngoại tệ Singapore Global).
- Xác nhận tỷ lệ lợi ích sở hữu, tỷ lệ biểu quyết, đồng tiền hạch toán cơ sở (VND, USD, EUR) và trạng thái đóng sổ kỳ kế toán riêng lẻ của từng đơn vị.

### Bước 2: Quản Lý & Thiết Lập Tỷ Giá Quy Đổi BCTC Ngoại Tệ (FX Rate & CTA Reserve Setup)
- Chuyển sang tab **4. Quy Đổi Tỷ Giá & Dự Trữ CTA**.
- Cập nhật 3 tầng tỷ giá theo quy định chuẩn mực kế toán VAS 25 / IAS 21:
  1. *Closing Rate (Tỷ giá Cuối kỳ)*: Áp dụng cho chỉ tiêu Tài sản & Nợ phải trả trên Bảng Cân đối Kế toán.
  2. *Average Rate (Tỷ giá Bình quân)*: Áp dụng cho Doanh thu & Chi phí trên Báo cáo P&L.
  3. *Historical Rate (Tỷ giá Lịch sử)*: Áp dụng cho Vốn góp & Vốn chủ sở hữu.
- Kiểm tra tính toán tự động của Quỹ chênh lệch quy đổi tỷ giá BCTC ngoại tệ (CTA - Cumulative Translation Adjustment Reserve).

### Bước 3: Lập & Kiểm Soát Bút Toán Loại Trừ Giao Dịch Nội Bộ (Intercompany Eliminations)
- Truy cập tab **3. Ma Trận Bút Toán Loại Trừ Nội Bộ**.
- Kiểm tra danh sách các bút toán tự động phát sinh:
  - Loại trừ doanh thu & giá vốn bán hàng nội bộ (TK 5111 / TK 6321).
  - Loại trừ công nợ phải thu / phải trả nội bộ (TK 1311 / TK 3311).
  - Loại trừ phí dịch vụ & quản lý nội bộ (TK 5113 / TK 6421).
- Nếu phát sinh điều chỉnh bổ sung, bấm **Tạo Bút Toán Mới** để mở biểu mẫu khởi tạo bút toán loại trừ thủ công kèm diễn giải và tài khoản GL đối ứng.

### Bước 4: Chạy Động Cơ Hợp Nhất & Xuất Tháp Báo Cáo Tài Chính Hợp Nhất Tập Đoàn (Execution & Report Matrix)
- Bấm nút **Chạy Động Cơ Hợp Nhất** trên thanh công cụ chính.
- Hệ thống tự động xử lý loại trừ 100% giao dịch trùng lặp, tách biệt phần lợi ích Cổ đông không kiểm soát (NCI Share 20%) và tạo ma trận Hợp nhất Side-by-Side.
- Chuyển sang tab **1. Báo Cáo Tài Chính Hợp Nhất** để xem chi tiết:
  - Báo cáo Kết quả Kinh doanh Hợp nhất (Mẫu B 02 - DN/HN).
  - Bảng Cân đối Kế toán Hợp nhất (Mẫu B 01 - DN/HN).
- Bấm **In Báo Cáo Hợp Nhất** để xuất bản cứng hoặc trình Giám đốc Tài chính (CFO) ký duyệt.

### Bước 5: Kiểm Soát Tuân Thủ Thuế Chuyển Giá & OECD Pillar Two (Transfer Pricing & Tax Compliance)
- Chuyển sang tab **5. Thuế Chuyển Giá (NĐ 132 & OECD Pillar Two)**.
- Rà soát đánh giá Thuế tối thiểu toàn cầu OECD 15% (GloBE Effective Tax Rate - ETR) cho từng quốc gia / đơn vị thành viên:
  - Tự động cảnh báo và tính Thuế bổ sung (Top-Up Tax) theo quy tắc QDMTT / IIR nếu ETR < 15% (ví dụ: Singapore ETR 10% -> Thuế bổ sung 5%).
- Rà soát chỉ số trần chi phí lãi vay không vượt quá 30% EBITDA theo Khoản 3 Điều 16 Nghị định 132/2020/NĐ-CP.
- Kiểm tra danh mục giao dịch liên kết theo nguyên tắc giá giao dịch độc lập (Arm's Length Principle) qua phương pháp CUP hoặc TNMM.
- Khởi tạo và xuất file bộ hồ sơ Thuế chuyển giá bắt buộc: **Master File** (Hồ sơ tập đoàn), **Local File** (Hồ sơ quốc gia) và **CbCR** (Báo cáo lợi nhuận liên quốc gia Form 04/TĐ).

### Bước 6: Hòa Giải Chênh Lệch BCTC Song Luồng VAS vs IFRS (Dual-Reporting Reconciliation Bridge)
- Truy cập tab **6. Cầu Nối Song Luồng VAS vs IFRS**.
- Đánh giá bảng so sánh song luồng chỉ tiêu BCTC Hợp nhất giữa VAS 25 và IFRS 10.
- Kiểm tra ma trận bút toán điều chuyển chênh lệch hòa giải tự động:
  - **IFRS 16 vs VAS 06**: Vốn hóa Tài sản Quyền sử dụng (ROU Assets) & Nợ thuê tài chính kho vận.
  - **IFRS 3 / IAS 36 vs VAS 11**: Khấu trừ hoàn nhập phân bổ Goodwill 10 năm của VAS, thực hiện Đánh giá tổn thất tài sản (Goodwill Impairment Test).
  - **IFRS 9 vs VAS 14**: Ghi nhận Dự phòng tổn thất tín dụng dự kiến (Expected Credit Loss - ECL) theo triển vọng vĩ mô.
  - **IAS 12 vs VAS 17**: Ghi nhận Thuế TNDN hoãn lại tương ứng 20% trên chênh lệch tạm thời giữa VAS và IFRS.
- Xuất Bảng hòa giải chênh lệch Vốn chủ sở hữu & Lợi nhuận ròng giữa VAS và IFRS cho Kiểm toán quốc tế Big 4.

---

## 3. Quy Tắc Kiểm Soát Nội Bộ & An Toàn Dữ Liệu
- Mọi thao tác chạy hợp nhất và bút toán điều chỉnh loại trừ thủ công đều được ghi vết tự động vào nhật ký kiểm toán (Audit Trail) với mã băm SHA-256.
- Báo cáo hợp nhất chỉ có hiệu lực pháp lý khi chỉ tiêu Cân đối Tài sản bằng Nợ phải trả cộng Vốn chủ sở hữu hợp nhất và được xác thực qua chữ ký số kép của CFO & ERP Administrator.
