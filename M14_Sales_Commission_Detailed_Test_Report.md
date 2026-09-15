# BÁO CÁO KIỂM THỬ VÀ ĐÁNH GIÁ NĂNG LỰC PHÂN HỆ M14 — SALES COMMISSION & REWARD SUITE

**Dự án:** NexusSync ERP (Hệ thống Quản trị Doanh nghiệp Tích hợp Đa tầng L0 - L5)  
**Phân hệ:** M14 — Quản lý Hoa hồng Bán hàng, Phân bổ & Thu hồi (Sales Commission & Reward Suite)  
**Ngày báo cáo:** 28/08/2026  
**Trạng thái hệ thống:** Build Succeeded (100% Không lỗi, Toàn bộ giao diện hiển thị tiếng Việt chuẩn nghiệp vụ)

---

## 1. TỔNG QUAN VỀ PHÂN HỆ M14
Phân hệ **M14 (Sales Commission)** là trung tâm tính toán, chi trả, phân bổ và quản lý rủi ro thu hồi hoa hồng bán hàng của toàn bộ hệ thống NexusSync ERP. Phân hệ được thiết kế để tự động hóa hoàn toàn các chính sách thưởng doanh số phức tạp của doanh nghiệp B2B và kênh phân phối, đồng thời tích hợp chặt chẽ với Sổ cái Kế toán General Ledger (GL Accounts: Nợ TK 6415 / Có TK 3341).

---

## 2. LUỒNG KIỂM THỬ THỰC TẾ (REAL-WORLD TEST WORKFLOW)

Quá trình kiểm thử thực tế trên giao diện workspace M14 được thiết kế qua 3 kịch bản cốt lõi:

### Kịch bản 1: Thiết lập và Vận hành Động cơ Quy tắc Hoa hồng (Commission Rule Engine)
* **Mục tiêu:** Cấu hình các bậc hoa hồng (Tiered Rates) theo khoảng doanh số hoặc lợi nhuận gộp, kiểm chứng tính năng chỉnh sửa động và lưu cấu hình vào cơ sở dữ liệu.
* **Các bước thực hiện:**
  1. Truy cập vào tab **"Rule Engine (Tầng bậc)"** trên giao diện M14.
  2. Quan sát bảng định nghĩa tầng bậc: *TIER-01 (<500tr: 3%)*, *TIER-02 (500tr-1B: 5%)*, *TIER-03 (>1B: 7.5%)*.
  3. Thực hiện chỉnh sửa trực tiếp (Inline Editing) hoặc thêm mới một bậc thang (VD: *TIER-04: Doanh số siêu lớn >5 Tỷ áp dụng 10%*).
  4. Bấm **"Lưu Cấu hình vào DB"** để kiểm chứng quá trình persist dữ liệu xuống Database.
* **Kết quả ghi nhận:** Hệ thống ghi nhận cấu hình động thành công, thông báo lưu DB chuẩn xác, các bảng tính mới tự động tra cứu Rule Engine để áp dụng đúng tỷ lệ.

### Kịch bản 2: Phân bổ Doanh số & Hoa hồng Đa nhân sự (Commission Allocation)
* **Mục tiêu:** Quản lý các hợp đồng B2B giá trị lớn cần chia tỷ lệ hoa hồng giữa Sales chủ trì (Primary Rep) và các Sales hỗ trợ (Supporting Split).
* **Các bước thực hiện:**
  1. Chuyển sang tab **"Phân bổ Nhóm (Allocation)"**.
  2. Nhập thông tin hợp đồng/SO mới (VD: `SO-2026-0200`, Tổng giá trị: `1,500,000,000 VND`).
  3. Chỉ định tỷ lệ chia: Sales chủ trì `Nguyễn Văn Minh (60%)` và Sales hỗ trợ `Trần Thị Mai (40%)`.
  4. Bấm **"Lưu & Phân bổ Tỷ lệ"**.
* **Kết quả ghi nhận:** Hợp đồng được thêm vào danh sách phân bổ nhóm với trạng thái `ALLOCATED`, đảm bảo tính minh bạch tuyệt đối trong các deal phối hợp liên phòng ban/đội ngũ.

### Kịch bản 3: Xử lý Rủi ro và Cảnh báo Thu hồi (Dashboard Clawback)
* **Mục tiêu:** Tự động theo dõi các đơn hàng bị khách hàng hoàn trả hoặc hủy hợp đồng, tính toán số tiền hoa hồng cần thu hồi để quản lý rủi ro tài chính.
* **Các bước thực hiện:**
  1. Chuyển sang tab **"Thu hồi (Clawback)"**.
  2. Kiểm tra danh sách các cảnh báo hoàn trả (VD: Đơn hàng `SO-2026-0088` bị khách hàng hoàn trả 20% thiết bị lỗi, số tiền hoàn trả `150,000,000 VND`).
  3. Kiểm chứng số tiền hoa hồng cần thu hồi tương ứng (`Clawback Amount: 7,500,000 VND`) và trạng thái xử lý khấu trừ (`PENDING_DEDUCTION` / `DEDUCTED_NEXT_PAYOUT`).
* **Kết quả ghi nhận:** Bảng cảnh báo hoạt động trực quan, giúp bộ phận Tài chính - Kế toán kiểm soát chặt chẽ các khoản chi trả tránh thất thoát do đơn hàng hủy/trả.

---

## 3. BÁO CÁO KẾT QUẢ KIỂM THỬ THỰC TẾ

| Hạng mục Kiểm thử | Kịch bản Nghiệp vụ | Kết quả Thực tế | Trạng thái |
| :--- | :--- | :--- | :---: |
| **Giao diện Tiếng Việt 100%** | Kiểm tra nhãn, nút bấm, thông báo toàn phân hệ M14. | Hiển thị hoàn toàn bằng tiếng Việt chuẩn ERP. | **ĐẠT** |
| **Commission Rule Engine** | Cấu hình, chỉnh sửa động và lưu bậc thang hoa hồng vào DB. | Cập nhật linh hoạt, lưu DB thành công, tự động tính tỷ lệ. | **ĐẠT** |
| **Commission Allocation** | Phân bổ doanh số/hoa hồng đa nhân sự cho hợp đồng B2B. | Ghi nhận chính xác tỷ lệ Primary & Supporting Split. | **ĐẠT** |
| **Dashboard Clawback** | Theo dõi đơn hàng hoàn trả, tính toán số tiền thu hồi. | Cảnh báo rõ ràng lý do, số tiền và trạng thái khấu trừ. | **ĐẠT** |
| **Tích hợp GL & Context Rail** | Xem chi tiết định khoản Nợ 6415 / Có 3341 và phả hệ L5. | Đẩy dữ liệu đầy đủ vào Context Rail và Modal chi tiết. | **ĐẠT** |
| **Biên dịch & Build Hệ thống** | Chạy kiểm tra mã nguồn toàn ứng dụng. | Lệnh biên dịch trả về **Build succeeded** (0 lỗi). | **ĐẠT** |

---

## 4. ĐỀ XUẤT CẬP NHẬT QUY TRÌNH CHUẨN (SOP) DỰA TRÊN KẾT QUẢ KIỂM THỬ

Dựa trên kết quả triển khai và kiểm thử thực tế phân hệ M14, các quy trình chuẩn (SOP) doanh nghiệp cần được chuẩn hóa như sau:

1. **Chuẩn hóa Cơ chế Rule Engine Tập trung:**
   - Mọi thay đổi về tỷ lệ hoa hồng hoặc bậc thang doanh số phải được cấu hình thông qua *Commission Rule Engine*, có lịch sử kiểm toán (Audit Trail) và được phê duyệt bởi Giám đốc Tài chính (CFO) trước khi áp dụng chính thức vào chu kỳ tính lương.
2. **Quy trình Xác nhận Phân bổ Nhóm (Team Split Policy):**
   - Đối với các hợp đồng B2B có sự tham gia của nhiều nhân sự, tỷ lệ phân bổ (`Primary` và `Supporting`) phải được chốt ngay tại thời điểm ký kết hợp đồng trên hệ thống CRM/Sales Order và khóa lại trước khi nghiệm thu doanh số.
3. **Chính sách Thu hồi Hoa hồng Tự động (Clawback Protocol):**
   - Khi phát sinh sự kiện hàng bán bị trả lại (`Sales Return`) hoặc hủy đơn hàng sau khi hoa hồng đã được chi trả, hệ thống phải tự động sinh bút toán Clawback để khấu trừ vào kỳ trả thưởng kế tiếp của nhân sự, đảm bảo không có khoản chi trả thừa nào lọt qua kiểm toán.
4. **Đồng bộ Định khoản Kế toán Tài chính:**
   - Đảm bảo mọi bảng tính hoa hồng sau khi được duyệt đều tự động kết nối với Accounting Engine để ghi nhận bút toán chi phí (`Nợ TK 6415 / Có TK 3341`), duy trì sự nhất quán tuyệt đối giữa báo cáo nhân sự và báo cáo tài chính.
