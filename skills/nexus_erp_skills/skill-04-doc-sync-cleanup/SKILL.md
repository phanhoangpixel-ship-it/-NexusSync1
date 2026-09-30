---
name: "erp-doc-sync-cleanup"
description: >
  Quy trình dọn dẹp sau kiểm thử và đồng bộ 5 tài liệu chuẩn của NexusSync ERP
  (TEST_MATRIX.md, API_CATALOG.md, MODULE_MAP.md, BUSINESS_RULES.md, CHANGE_LOG.md).
  Đảm bảo dữ liệu Single-Writer và Audit Log an toàn tuyệt đối.
---

# SKILL_04 — DỌN DẸP SAU TEST & ĐỒNG BỘ TÀI LIỆU

## Điều kiện kích hoạt
CHỈ thực hiện sau khi toàn bộ kịch bản trong SKILL_03 đạt PASS 100%, có bằng chứng cụ thể (ID dữ liệu + log). Không tự suy đoán "chắc đã đạt".

## Bước 1 — Đề xuất xoá dữ liệu test (KHÔNG tự xoá)
- Liệt kê bản ghi phát sinh trong lúc test dưới dạng bảng: {Bảng DB, số bản ghi, điều kiện lọc (VD: `source = '<MODULE>_UPGRADE_TEST'` hoặc khoảng thời gian test), có ảnh hưởng dữ liệu thuộc Single-Writer Authority khác không (`stock_ledger`, `accounting_entries`, `cost_layers`)?}.
- **CHỜ xác nhận thủ công** trước khi xoá — vì:
  - `stock_ledger` là immutable audit trail, không được xoá/sửa trực tiếp.
  - `accounting_entries` không được xoá, chỉ đảo bằng Reversal Entry.
  - `cost_layers` đã consumed có thể bị khoá (Consumed Layer Immutability).
- Nếu dữ liệu test đã chạm Single-Writer Authority → **KHÔNG DELETE trực tiếp**, đề xuất nghiệp vụ đảo ngược đúng chuẩn (huỷ chứng từ hợp lệ + Reversal Entry), giữ nguyên `audit_logs`.

## Bước 2 — Đồng bộ 5 tài liệu chuẩn (không tạo file report rời rạc khác)
1. `TEST_MATRIX.md`: đổi `PENDING → PASS/FAIL` (kèm ngày Live QA thật) cho toàn bộ feature ID của module, thêm feature mới nếu có.
2. `API_CATALOG.md`: chuyển khối module từ `Proposed` → `Verified`; nếu module chưa từng có khối riêng, bổ sung mới đúng format các module đã Verified.
3. `MODULE_MAP.md`: cập nhật Write API + Cross-Module Integrations; sửa lại Workspace ID/Route/Component nếu Bước 0 (SKILL_01) phát hiện lệch.
4. `BUSINESS_RULES.md`: bổ sung mục nghiệp vụ mới nếu module có rule đặc thù (theo format các mục 8.x/9.x/10.x đã có).
5. `CHANGE_LOG.md`: thêm **1 entry mới** theo đúng 5 phần chuẩn (Step 0 Pre-Check & Code Slot Verification → Architecture & Schema → Service Layer & Cross-Module Integrations → UI/UX Compliance → Verification & Test Suite Matrix). **KHÔNG sửa/xoá entry cũ của module khác.**

## Bước 3 — Dọn file không dùng (tránh phát sinh rác)
- Xoá: file tạm (`*.tmp`,`*.bak`), script test dùng 1 lần, file report `.md`/`.pdf` rời rạc KHÔNG nằm trong 5 file chuẩn ở Bước 2, component/route trùng lặp đã bị thay thế.
- **Trước khi xoá bất kỳ file nào**: full-text search toàn repo xác nhận không còn import/reference nào trỏ tới (tránh crash).
- Sau dọn dẹp: chạy Build + Type-check + test toàn hệ thống (không chỉ module đang nâng cấp) để xác nhận các module phụ thuộc gián tiếp không bị ảnh hưởng.

## Nếu phát hiện rủi ro ảnh hưởng dữ liệu production thật ở bất kỳ bước nào
DỪNG LẠI, báo cáo cụ thể, KHÔNG tự ý thực thi tiếp.
