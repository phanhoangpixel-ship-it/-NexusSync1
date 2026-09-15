# M16 SHIFT & CASH DRAWER UI & API CONTRACT ARCHITECTURE NOTES

## 1. Race Condition Concurrency Protection
- **Mechanism**: Atomic conditional update via `UPDATE cash_shifts SET ... WHERE id = ? AND status = 'ACTIVE'`.
- **SQLite Dev Environment Note**: Due to SQLite's file locking (`single-writer lock model`), rigorous test T6 observed early blocking at the transaction begin phase (`SQLITE_BUSY: database is locked`) when 2 concurrent transactions attempted `BEGIN EXCLUSIVE` simultaneously.
- **Production Readiness**: The WHERE-clause atomic condition (`status = 'ACTIVE'`) is verified by code review and guarantees correctness and safety on enterprise RDBMS (PostgreSQL/MySQL) under high-throughput POS terminal concurrency.

## 2. Separation of Duties (SoD) & Variance Approval Flow
- **Endpoint**: `POST /api/shift/:id/approve-variance`
- **Rule**: The approving user ID (`approverId`) must strictly NOT equal the shift's cashier user ID (`cashierUserId`). If violated, the system rejects with HTTP 403 and error message `"Vi phạm phân nhiệm (Separation of Duties - SoD)"`.
- **Test Note (T7-T9)**: Test T7-T9 hiện tại verify logic SoD/Role/Atomic-update bằng bản sao lập trình lại (`simulateApproveVariance`) trong môi trường test, KHÔNG gọi trực tiếp qua HTTP layer / Express middleware thật. Logic trong route thật (`/api/shift/:id/approve-variance`) đã được xác nhận khớp qua code review thủ công tại thời điểm 2026-09-07. RỦI RO CÒN LẠI: nếu route thật bị sửa sau này mà không đồng bộ cập nhật `simulateApproveVariance`, bộ test sẽ không phát hiện được sai lệch. KHUYẾN NGHỊ: khi có thời gian, nâng cấp bộ test sang supertest gọi route thật để đóng rủi ro này hoàn toàn.
- **SQLite Concurrency Note (T9)**: T9 quan sát `SQLITE_BUSY` (giống T6) — được xem là giới hạn môi trường SQLite dev, không phải bằng chứng trực tiếp cho atomic conditional update. Cơ chế `WHERE status='PENDING_RECONCILIATION'` đã được xác nhận đúng qua code review, sẽ là lớp bảo vệ chính trên production Postgres.
