# M05 — EventBus Platform & EDA Outbox Pattern

**Module ID:** `M05`  
**Module Name:** EventBus Platform & Enterprise EDA Hub  
**Business Group:** `08. GOVERNANCE, AUDIT & SYSTEM`  
**Workspace ID:** `WS26_SERVICEDESK` | **Primary Route:** `/event-bus`  
**Mounted UI Component:** `src/modules/governance/m05-eventbus/components/M05EventBusWorkspace.tsx`  
**Primary API Endpoints:**  
- `GET /api/events/outbox` — Dòng sự kiện thời gian thực & Outbox queue  
- `GET /api/outbox/messages` — Giám sát thông điệp Outbox chuyên sâu  
- `GET /api/outbox/dlq` — Giám sát Dead Letter Queue (DLQ)  
- `POST /api/outbox/retry` — Tái xử lý sự kiện lỗi từ DLQ (Ghi log Audit M02)  
- `POST /api/events/subscribers` — Đăng ký Consumer động mới  
- `POST /api/events/dispatch-pending` — Kích hoạt quét Outbox thủ công  
- `POST /api/outbox/archive` — Lưu trữ & dọn dẹp sự kiện cũ  

---

## 1. TỔNG QUAN & SỨ MỆNH (EXECUTIVE SUMMARY & PURPOSE)

M05 là xương sống kiến trúc hướng sự kiện (Event-Driven Architecture - EDA) của hệ thống NexusSync ERP. M05 đảm bảo:
- **Transactional Outbox Pattern**: Lưu trữ sự kiện nghiệp vụ cùng transaction cơ sở dữ liệu với nghiệp vụ domain (tránh Dual-Write).
- **At-Least-Once Delivery**: Bộ quét ngầm (Background Outbox Relay) tuần tự đẩy sự kiện sang các Consumer mà không làm mất dữ liệu.
- **Consumer Idempotency**: Khóa `eventId` duy nhất kết hợp bảng `processed_events` để đảm bảo ngữ nghĩa xử lý chính xác một lần (Effectively-Once).
- **Cách ly lỗi & DLQ Quarantining**: Thử lại lũy thừa (Exponential Backoff, tối đa 3 lần), tự động đưa tin lỗi vào Dead Letter Queue và ngắt mạch (Circuit Breaker) bảo vệ hệ thống.
- **Tích hợp kiểm toán M02**: Mọi hành động tái phát tin (Replay DLQ) đều ghi lại Audit Log bất biến vào `AuditService` của M02.

---

## 2. RANH GIỚI THẨM QUYỀN ĐƠN NHẤT (DOMAIN AUTHORITY BOUNDARIES)

- **Thẩm quyền Độc quyền của M05:**
  - Tiếp nhận, điều phối, định tuyến và phân phối sự kiện bất đồng bộ giữa các phân hệ.
  - Quản lý hàng đợi Outbox (`outbox_events`), hàng đợi lỗi DLQ (`dlq_events`), và danh sách Consumer đăng ký.
  - Không tự ý thay đổi dữ liệu bảng nghiệp vụ cốt lõi (Kho, Sổ cái, Đơn hàng) mà chỉ phát và chuyển giao thông điệp.
- **Tương tác với các phân hệ khác:**
  - **M13 (Bán hàng):** Phát `erp.sales.order.created` -> M05 phân phối tới M17 và M30.
  - **M17 (Kho):** Phát `erp.inventory.stock.reserved` -> M05 phân phối tới M13 và M39.
  - **M30 (Kế toán tổng hợp):** Phát `erp.finance.gl.posted` -> M05 phân phối tới M02 và Ban lãnh đạo.
  - **M02 (Audit & Compliance):** Ghi nhật ký mọi thao tác Replay DLQ, Reset Offset, Restart Pod.

---

## 3. KHẾ ƯỚC DỮ LIỆU & BẢNG CƠ SỞ DỮ LIỆU (DATA CONTRACTS & SCHEMA)

### Bảng Cơ sở dữ liệu:
- `outbox_events`: Lưu trữ sự kiện Outbox đang chờ (`PENDING`), đang xử lý (`PROCESSING`), hoàn tất (`PUBLISHED`), hoặc chuyển lỗi (`DLQ_FAILED`).
- `processed_events`: Lưu vết idempotency key của các Consumer đã xử lý xong sự kiện.
- `dlq_events`: Lưu chi tiết các bản tin thất bại quá số lần quy định, bao gồm `failureReason`, `retryCount`, `lastError`, `originalPayload`.

### Danh mục API Hoàn thiện:
1. `GET /api/outbox/messages` — Lọc, tìm kiếm và phân trang thông điệp Outbox.
2. `GET /api/outbox/dlq` — Tra cứu các bản tin đang bị cô lập trong DLQ.
3. `POST /api/outbox/retry` — Replay sự kiện lỗi (hỗ trợ đơn lẻ hoặc hàng loạt, ghi nhận Audit M02).
4. `POST /api/events/subscribers` — Khai báo và kết nối Consumer mới vào bus.
5. `POST /api/events/dispatch-pending` — Quét và giải phóng Outbox ngay lập tức.
6. `POST /api/outbox/archive` — Dọn dẹp dữ liệu sự kiện hoàn tất quá hạn lưu trữ.
7. `GET /api/events/outbox` — Dòng sự kiện thời gian thực cho UI Master Table.
8. `GET /api/events/metrics` — Thống kê thông lượng, độ trễ và tỷ lệ khả dụng.

---

## 4. TIÊU CHUẨN GIAO DIỆN UI/UX DOANH NGHIỆP

- **Tuân thủ Rule #19:** Tuyệt đối không dùng `window.alert/confirm/prompt`. Sử dụng `ConfirmDialog.tsx` cho mọi hành vi phát tin, retry DLQ, restart subscriber, reset offset.
- **Tuân thủ Rule #20:** Cấu trúc đầy đủ 4 Tabs chức năng (Stream, Publisher Workbench, DLQ Management, Subscribers Health Matrix), Drawer 360° thanh tra sự kiện với sơ đồ luồng Lineage và mã SHA-256.
- **Quy chuẩn hiển thị:** Toàn bộ mã chứng từ, ID, số lượng msgs, độ trễ, thời gian đều hiển thị định dạng `font-mono tabular-nums`.

---

## 5. TÀI LIỆU THAM CHIẾU LIÊN QUAN
- Báo cáo Nghiệm thu Sau Nâng cấp: `/docs/design-specs/M05_ARCHITECTURE_POST_SYNC.md`
- Quy chuẩn Thiết kế Doanh nghiệp: `/docs/design-specs/UI_UX_ENTERPRISE_DESIGN_STANDARDS_M18_M19.md`
- Giao thức Nhân bản UI/UX: `/docs/design-specs/UI_UX_MODULE_FULL_REPLICATION_PROTOCOL.md`
