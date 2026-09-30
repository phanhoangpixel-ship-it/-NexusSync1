---
name: "erp-architecture-gate"
description: >
  Kiểm soát cổng kiến trúc ERP bắt buộc trước mọi dòng code (Step 0 Code Slot
  Verification, 10 Rules cốt lõi, Feature Impact Analysis). Sử dụng khi bắt đầu
  nâng cấp, mở rộng hoặc tạo mới bất kỳ phân hệ nào trong NexusSync ERP.
---

# SKILL_01 — ARCHITECTURE GATE (Bắt buộc trước mọi dòng code)

## Trình tự bắt buộc (không đảo thứ tự)
```
Business Requirement → Architecture Discovery → Existing Module/Entity Discovery
→ Domain Authority Discovery → API Discovery → Impact Analysis
→ Implementation Plan → Code → Verification → Doc Update
```

## Bước 0 — Code Slot Verification (làm TRƯỚC TIÊN, luôn luôn)
Đối chiếu 3 nguồn cho module đang nâng cấp: `MODULE_MAP.md` (Workspace/Route/Component), `TEST_MATRIX.md` (Workspace/Route/Component), và route thật trong `src/App.tsx`/`moduleRegistry.ts`. Nếu 2 nguồn tài liệu lệch nhau (Workspace ID không tồn tại trong Directory 31 Workspace, tên component khác nhau, API prefix khác nhau) → **báo cáo lệch trước, không code**, không tự tạo trang/route thứ 2.

## 10 Rule tối giản (rút từ 20 Rule GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md)
1. **Reuse before Create** — tra API_CATALOG.md/MODULE_MAP.md trước khi tạo bảng/API/entity mới.
2. **No Duplicate Authority** — không tạo service/bảng ghi trùng chức năng với 4 Single-Writer (xem SKILL_02).
3. **No Orphan Data** — mọi entity mới phải nối vào enterprise data graph có sẵn (FK, owner rõ ràng).
4. **No Fake API** — UI phải nối API thật → Service thật → DB thật, không mock.
5. **Frozen Scope Protection** — module/API đang `CERTIFIED`/`FROZEN` không sửa trực tiếp, chỉ mở rộng (thêm field optional/endpoint mới).
6. **Immutability of Closed Documents** — chứng từ đã khoá (APPROVED/COMPLETED/HANDED_OVER...) là read-only; sai sót → chứng từ điều chỉnh mới.
7. **Atomicity + Idempotency** — mọi ghi liên quan kho/kế toán phải trong 1 DB transaction và an toàn khi retry/double-click.
8. **RBAC before Exposure** — tính năng mới phải có permission model trước khi lên UI/API.
9. **Auditability** — mọi mutation nghiệp vụ phải qua `AuditService.recordAuditLog()` (M02), không tạo bảng audit riêng.
10. **STOP Condition** — nếu phát hiện xung đột Single-Writer, frozen scope, hoặc không xác định được authority → DỪNG, báo cáo, KHÔNG tự viết workaround.

## Đầu ra bắt buộc của mỗi lần áp dụng SKILL_01
- Kết quả đối chiếu Bước 0 (Pass/Lệch — nếu lệch, đề xuất sửa).
- Bảng Feature Impact Analysis (UI/Route/API/Entity/Table/Service/Event/Permission/Audit/Inventory/Accounting/Costing — điền N/A + lý do nếu không liên quan, không được bỏ trống).
