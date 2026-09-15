# M05 EVENTBUS & EDA ARCHITECTURE WORKSPACE
## FEATURE BASELINE BEFORE SYNC (PHASE -1)

**Document Reference:** `/docs/design-specs/M05_FEATURE_BASELINE_BEFORE_SYNC.md`  
**Timestamp:** 2026-09-11T08:52:00Z  
**Target Module:** M05 (EventBus & EDA Architecture Workspace)  
**Source Module Standard:** M19 (Stocktake & Blind Count Workspace)  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Replication Protocol)  
**Author:** Chuyên viên Lập trình Frontend Cấp cao — NexusSync ERP Team  

---

## 1. TỔNG QUAN HIỆN TRẠNG PHÂN HỆ M05 (TRƯỚC KHI ĐỒNG BỘ)

- **File nguồn:** `/src/components/workspaces/M05EventBusWorkspace.tsx` (431 dòng)
- **Kiến trúc phân tầng hiện có:** Đơn tệp (Single monolithic workspace file), chưa chia tách thư mục con components/workspaces/eventbus/ như chuẩn M19.
- **Hook đồng bộ Tab:** `useWorkspaceSessionTab<'stream' | 'outbox' | 'dlq' | 'subscribers'>('M05', 'stream')`
- **Bộ Tab chức năng hiện có (4 tabs):**
  1. `stream`: Dòng sự kiện Realtime (Event Stream Log)
  2. `outbox`: Trình phát Sự kiện Thủ công (Event Publisher Simulation & Outbox Pattern)
  3. `dlq`: Hàng đợi Lỗi Thất bại (Dead Letter Queue - DLQ)
  4. `subscribers`: Danh sách Người đăng ký Sự kiện (Event Subscribers & Consumers)

---

## 2. BẢNG KIỂM KÊ TÍNH NĂNG TỪNG TAB (BASELINE INVENTORY)

### 2.1 Tab 1: Dòng sự kiện Realtime (`stream`)
- **API Endpoints đang gọi:** 
  - Chưa gọi API backend trực tiếp, hiện đang dùng dữ liệu khởi tạo local state:
    - `EVT-2026-9001`: `erp.sales.order.created` (M04 -> InventoryService & AccountingService)
    - `EVT-2026-9002`: `erp.inventory.stock.reserved` (M08 -> SalesOrderFulfillment)
    - `EVT-2026-9003`: `erp.finance.gl.posted` (M21 -> AuditLedgerService)
    - `EVT-2026-9004`: `erp.manufacturing.mrp.failed` (M12 -> ProcurementAlertDispatcher)
  - Endpoint backend chuẩn trong schema: `GET /api/events/outbox` (đã có trong danh sách route fallback của server.ts và schema `outboxEvents`).
- **Hành động người dùng có thể thực hiện:**
  1. **Xem danh sách sự kiện:** Bảng sự kiện gồm Mã Event, Topic/Channel, Phân hệ Nguồn, Trạng thái, Thời gian, Nút thao tác.
  2. **Truy Vết Sự Kiện (`handleSelectEvent(evt)`):** Nhấn nút "Truy Vết Sự Kiện" -> Gọi callback `onSelectEntity` với payload lineage (`SOURCE_EVENT`, `PUBLISHER`), auditTrail (action `PUBLISH_EVENT`, sha256 checksum) và gọi thông báo `onNotify('info', 'Đã tải sự kiện EventBus', ...)`.
  3. **Làm Mới Trục Sự Kiện:** Nút "Làm mới" trên Header -> Trigger animation quay, timeout 600ms và hiển thị thông báo `onNotify('info', 'Làm mới', 'Đã đồng bộ trạng thái EventBus Broker.')`.
  4. **Xuất Báo Cáo CSV (`handleExportCSV`):** Nút "Xuất Báo cáo CSV" -> Tạo Blob `eventbus_outbox_report_{date}.csv` và kích hoạt tải về máy khách, thông báo `onNotify('success', ...)`.
- **Conditional Rendering:**
  - Badge trạng thái sự kiện:
    - `PUBLISHED`: badge màu xanh dương `bg-blue-50 text-blue-700 border border-blue-200`
    - `ACKNOWLEDGED`: badge màu xanh lá `bg-emerald-50 text-emerald-700 border border-emerald-200`
    - Khác (`DLQ_FAILED`): badge màu hổ phách `bg-amber-50 text-amber-700 border border-amber-200`
- **Validation & Giới hạn:**
  - Định dạng thời gian qua `toLocaleTimeString()`.
  - Chưa hỗ trợ phân trang L4 (`PaginationControl`).

### 2.2 Tab 2: Trình phát Sự kiện (Publisher - `outbox`)
- **API Endpoints đang gọi:**
  - Local state submission (chưa gửi POST lên backend).
- **Hành động người dùng có thể thực hiện:**
  1. **Nhập Topic:** Input text `newTopic`, mặc định `erp.custom.event.triggered`.
  2. **Nhập Payload JSON:** Textarea `newPayload`, mặc định `{\n  "message": "Manual test event from SuperAdmin EDA Console"\n}`.
  3. **Phát sự kiện (`handlePublishEvent`):** Submit form -> Parse JSON, sinh mã sự kiện ngẫu nhiên `EVT-2026-XXXX`, prepend vào `events` state với status `PUBLISHED`, gọi `onNotify('success', ...)`.
  4. **Xem sơ đồ kiến trúc Outbox:** Panel bên phải hiển thị giải thích Transaction Commit, Outbox Polling (50ms), Broker Latency (1.2ms).
- **Validation & Giới hạn:**
  - Try-catch parse JSON payload; nếu lỗi cú pháp parse thì fallback thành `{ rawText: newPayload }`.
  - Bắt lỗi ngoại lệ và báo `onNotify('danger', 'Lỗi phát sự kiện', 'Payload JSON không hợp lệ.')`.

### 2.3 Tab 3: Dead Letter Queue (DLQ - `dlq`)
- **API Endpoints đang gọi:**
  - Lọc nội bộ từ `events.filter(e => e.status === 'DLQ_FAILED')`.
- **Hành động người dùng có thể thực hiện:**
  1. **Xem danh sách sự kiện lỗi DLQ:** Hiển thị mã event, topic, payload lỗi JSON stringify, số lần thử lại (`retryCount`).
  2. **Đẩy lại sự kiện (`handleRetryEvent(evtId)`):** Nhấn nút "Đẩy lại (Retry DLQ)" -> Cập nhật trạng thái sự kiện thành `PUBLISHED`, reset `retryCount: 0`, gọi thông báo `onNotify('success', 'Đã đẩy lại sự kiện (Retry)', ...)`.
- **Conditional Rendering:**
  - Badge đếm số lượng lỗi: `{events.filter(e => e.status === 'DLQ_FAILED').length} Sự kiện cần xử lý lại`.
  - Empty State: Hiển thị thông điệp "Tuyệt vời! Không có sự kiện nào rơi vào Dead Letter Queue. Hệ thống vận hành hoàn hảo." khi danh sách rỗng.
- **Validation & Cảnh báo:**
  - Chỉ cho phép retry khi sự kiện đang ở trạng thái `DLQ_FAILED`.

### 2.4 Tab 4: Danh sách Subscribers (`subscribers`)
- **API Endpoints đang gọi:**
  - Local state `subscribers` (4 consumer mẫu: `InventoryReservationConsumer`, `GeneralLedgerDoubleEntrySync`, `AuditImmutableLedgerWriter`, `ProcurementNotificationDispatcher`).
- **Hành động người dùng có thể thực hiện:**
  1. **Xem danh sách người đăng ký và Consumer:** Thẻ hiển thị Tên Subscriber, Topic Filter regex/wildcard, Trạng thái hoạt động, Consumer Lag (độ trễ bản tin).
- **Conditional Rendering:**
  - Badge trạng thái `HEALTHY`: màu xanh lục `bg-emerald-100 text-emerald-800`.
  - Badge trạng thái `DEGRADED`: màu hổ phách `bg-amber-100 text-amber-800`.
  - Chip số lượng: `Active Consumers: {subscribers.length}`.

---

## 3. LUỒNG THAO TÁC END-TO-END TRƯỚC KHI ĐỒNG BỘ

1. **Luồng 1 (Xem & Truy vết sự kiện):**
   - Người dùng vào phân hệ M05 -> Mặc định mở Tab `stream`.
   - Nhấn nút "Truy Vết Sự Kiện" tại dòng `EVT-2026-9001` -> Thanh Ngữ cảnh Đối Tượng hiển thị Event lineage liên kết M04 và topic.
   - Nhấn "Xuất Báo cáo CSV" -> File CSV tải về máy tính với 4 dòng dữ liệu.

2. **Luồng 2 (Phát sự kiện thủ công):**
   - Chuyển sang Tab `outbox`.
   - Nhập topic `erp.inventory.stock.counted` và payload JSON -> Nhấn "Phát Sự kiện lên Trục EventBus".
   - Toast thông báo màu xanh hiển thị thành công.
   - Quay lại Tab `stream` -> Sự kiện mới xuất hiện đầu danh sách.

3. **Luồng 3 (Xử lý sự cố DLQ):**
   - Chuyển sang Tab `dlq` -> Nhìn thấy sự kiện lỗi `EVT-2026-9004` (`erp.manufacturing.mrp.failed`).
   - Nhấn "Đẩy lại (Retry DLQ)" -> Sự kiện được chuyển sang `PUBLISHED`.
   - Danh sách DLQ chuyển sang Empty State "Tuyệt vời! Không có sự kiện nào rơi vào Dead Letter Queue."

4. **Luồng 4 (Giám sát Subscribers):**
   - Chuyển sang Tab `subscribers` -> Kiểm tra độ trễ của `ProcurementNotificationDispatcher` (lag 14 msgs).

---

## 4. CAM KẾT KHÔNG SUY THOÁI NGHIỆP VỤ (REGRESSION PROTECTION CONTRACT)

Trong quá trình sao chép giao diện chuẩn M19 sang M05:
1. **100% Logic nghiệp vụ** của 4 tab trên được giữ nguyên vẹn:
   - Các trường dữ liệu `id`, `topic`, `sourceModule`, `payload`, `status`, `timestamp`, `retryCount`, `consumer`.
   - Toàn bộ cơ chế `handleSelectEvent`, `handlePublishEvent`, `handleRetryEvent`, `handleExportCSV`.
   - Hook `useWorkspaceSessionTab` đồng bộ session tab cho M05.
2. **Nâng cấp chuẩn hóa giao diện**:
   - Áp dụng đầy đủ cấu trúc phân tầng **L0 - L4**.
   - Chuẩn hóa typography, status tokens (WCAG AA), viền phân loại `border-l-4`, `font-mono tabular-nums`.
   - Thay thế toàn bộ thao tác nhạy cảm (Retry DLQ, Phát sự kiện quan trọng, Xuất báo cáo) bằng component **`ConfirmDialog.tsx` (Rule #19)**.
   - Bổ sung Drawer chi tiết sự kiện L4 (Event Detail 360 Drawer).
