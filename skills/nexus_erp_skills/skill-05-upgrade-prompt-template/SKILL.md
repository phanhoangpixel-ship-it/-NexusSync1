---
name: "erp-upgrade-prompt-template"
description: >
  Các mẫu lệnh giao việc rút gọn cho AI Agent khi nâng cấp, kiểm thử và bàn giao module
  trong NexusSync ERP. Giúp tiết kiệm token đầu vào và tuân thủ tuyệt đối quy tắc kiến trúc.
---

# SKILL_05 — MẪU PROMPT RÚT GỌN (điền và gửi thẳng cho Gemini, không cần dán lại quy tắc)

## Mẫu 1 — Giao việc nâng cấp module
```text
Đọc và áp dụng SKILL_01, SKILL_02, SKILL_03, SKILL_05 tại /skills/erp_skills/.
Nguồn sự thật: MODULE_MAP.md, API_CATALOG.md, BUSINESS_RULES.md, TEST_MATRIX.md, CHANGE_LOG.md.

MODULE: [MÃ MODULE, VD: M20]
MỤC TIÊU NÂNG CẤP: [1-3 dòng mô tả tính năng cần thêm]

Thực hiện theo đúng trình tự SKILL_01 (Bước 0 → Impact Analysis → Kế hoạch 12-Phase).
Tra SKILL_02 để xác định module nào ghi bảng nào trước khi code.
Không code nếu phát hiện xung đột Single-Writer hoặc lệch tài liệu Bước 0 — dừng và báo cáo.
```

## Mẫu 2 — Giao việc test sau nâng cấp
```text
Đọc và áp dụng SKILL_03 tại /skills/erp_skills/skill-03-live-data-testing/SKILL.md.
MODULE: [MÃ MODULE]
Test toàn bộ chức năng mới đã nâng cấp bằng dữ liệu thật trong kho theo đúng 5 nhóm kịch bản của SKILL_03.
Báo cáo PASS/FAIL kèm ID dữ liệu thật đã dùng.
```

## Mẫu 3 — Giao việc dọn dẹp & đồng bộ tài liệu sau khi test đạt
```text
Đọc và áp dụng SKILL_04 tại /skills/erp_skills/skill-04-doc-sync-cleanup/SKILL.md.
MODULE: [MÃ MODULE]
Toàn bộ test đã PASS 100% (bằng chứng: [đính kèm/tham chiếu báo cáo test]).
Thực hiện đúng 3 bước của SKILL_04: đề xuất xoá dữ liệu test (chờ xác nhận, không tự xoá) → đồng bộ 5 tài liệu chuẩn → dọn file không dùng.
```

## Khi nào KHÔNG dùng mẫu rút gọn (vẫn cần viết chi tiết)
- Module hoàn toàn mới chưa từng có trong `MODULE_MAP.md` (M43 trở đi) — cần mô tả đầy đủ Business Requirement trước khi Gemini có thể tra cứu.
- Yêu cầu thay đổi ảnh hưởng trực tiếp 1 trong 4 Single-Writer Authority (M17/M30/M41/M42) — cần mô tả kỹ phạm vi để tránh Gemini tự ý mở rộng quá scope.
- Yêu cầu liên quan tuân thủ pháp lý/thuế/kế toán đặc thù (VD: thay đổi công thức tính thuế TNCN) — cần trích dẫn quy định cụ thể, không thể rút gọn.
