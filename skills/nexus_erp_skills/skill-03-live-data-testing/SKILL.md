---
name: "erp-live-data-testing"
description: >
  Quy trình kiểm thử chất lượng phân hệ ERP bằng 100% dữ liệu thật (Live Data Testing).
  Nghiêm cấm mock/fake data. Bao gồm 5 nhóm kịch bản: Single-Writer Guard, Idempotency,
  Concurrency, Cross-Module Linkage, Regression toàn luồng.
---

# SKILL_03 — TEST BẰNG DỮ LIỆU THẬT TRONG KHO (Không dùng dữ liệu tĩnh)

## Nguyên tắc bất di bất dịch
1. **TUYỆT ĐỐI KHÔNG** tạo mock/seed data cứng để test.
2. Mọi dữ liệu đầu vào lấy qua **đúng Read API của module chủ sở hữu** (không query thẳng DB, không tự suy đoán số liệu).
3. Nếu hệ thống chưa có dữ liệu thật phù hợp → tạo dữ liệu **qua đúng quy trình nghiệp vụ gốc** của module chủ (VD: cần SO đã Invoice thì tạo 1 SO thật qua M13 rồi xuất hoá đơn qua M30/M31), để dữ liệu sinh ra vẫn đi qua đúng Single-Writer Authority (xem SKILL_02).
4. Người đọc kết quả test có thể **không rành nghiệp vụ** — mỗi kịch bản PHẢI có: (a) bước thực hiện cụ thể, (b) kỳ vọng rõ ràng, (c) "dấu hiệu FAIL dễ nhận biết" viết bằng câu khẳng định đơn giản.

## Khung 5 nhóm kịch bản áp dụng cho MỌI module (điền cụ thể theo module)
1. **Single-Writer Guard** — mọi API ghi kho/kế toán/giá/giá vốn của module đang test phải để lại dấu vết đúng ở bảng authority tương ứng (`stock_ledger`, `accounting_entries`...). FAIL nếu số liệu đổi mà KHÔNG có dòng ghi vết tương ứng ở bảng authority.
2. **Idempotency** — gọi lại đúng 1 request (cùng idempotencyKey) 3 lần liên tiếp. FAIL nếu dữ liệu bị cộng dồn/nhân đôi.
3. **Concurrency/Race Condition** — gửi đồng thời 2 request cho cùng 1 đối tượng. Kỳ vọng: 1 SUCCESS, 1 ALREADY_PROCESSED.
4. **Cross-Module Linkage** — với mỗi liên kết module đã khai trong Impact Analysis (SKILL_01), xác nhận dữ liệu tham chiếu 2 chiều đúng (VD: RMA → phải tham chiếu đúng SO gốc, không phải số tự sinh).
5. **Regression toàn luồng** — sau khi chạy đủ 1 luồng nghiệp vụ end-to-end, kiểm tra lại các module liên quan không bị lệch dữ liệu (đối chiếu qua Read API của từng module, không giả định).

## Format báo cáo bắt buộc
- Bảng PASS/FAIL theo từng TEST, **kèm ID dữ liệu thật đã dùng** (orderId/invoiceId/moId/rmaId...) để truy vết lại được.
- Liệt kê riêng mọi vi phạm Single-Writer Authority nếu phát hiện (endpoint + bảng DB bị ghi sai).
- **KHÔNG được kết luận "PASS toàn bộ"** nếu còn test chưa chạy được do thiếu dữ liệu thật — phải nêu rõ cần tạo dữ liệu gốc gì, qua module nào.
