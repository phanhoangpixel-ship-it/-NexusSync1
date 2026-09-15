# M05 EVENTBUS & EDA ARCHITECTURE WORKSPACE
## FULL ARCHITECTURE SPECIFICATION POST-SYNC (PHASE 4.1)

**Document Reference:** `/docs/design-specs/M05_ARCHITECTURE_POST_SYNC.md`  
**Timestamp:** 2026-09-11T08:56:00Z  
**Target Module:** M05 (EventBus & EDA Architecture Workspace)  
**Source Module Standard:** M19 (Stocktake & Blind Count Workspace)  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Replication Protocol)  
**Tác giả:** Chuyên viên Lập trình Frontend Cấp cao — NexusSync ERP Team  

---

## 1. TỔNG QUAN KIẾN TRÚC PHÂN TẦNG VỎ HỆ THỐNG (L0 - L4)

Phân hệ M05 đã được tái cấu trúc từ dạng đơn tệp sang kiến trúc đa tệp module hóa chuẩn mực của NexusSync ERP, tương đồng 100% với kiến trúc phân tầng của Phân hệ nguồn M19:

```
src/components/workspaces/
├── M05EventBusWorkspace.tsx           (Root Workspace Shell: L0 Banner, L1 Tabs, EntityContext)
└── eventbus/
    ├── types.ts                       (Types, Interfaces, Enums: M05SubTab, EventBusItem, EventSubscriber)
    ├── EventStreamTab.tsx             (Tab 1: L1 Search & Filters, L2 KPI Strip, L3 Master Table, L4 Pagination)
    ├── EventPublisherTab.tsx          (Tab 2: L2 KPI Outbox, L3 Publisher Workbench, Preset Cards, ConfirmDialog)
    ├── EventDlqTab.tsx                (Tab 3: L2 DLQ KPI, L1 Search, L3 Error Queue List, Retry Action, ConfirmDialog)
    ├── EventSubscribersTab.tsx        (Tab 4: L2 Health KPI, L1 Filter, L3 Consumer Matrix Cards, Restart Pod, ConfirmDialog)
    └── EventDetailDrawer.tsx          (L4 Event Detail 360° Drawer: Lineage, Flow, JSON Payload, SHA-256 Audit)
```

---

## 2. CHI TIẾT TỪNG TẦNG GIAO DIỆN (L0 - L4)

### Tầng L0: Workspace Banner & Core Identity
- **Container:** `bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3`.
- **Icon khối định danh:** `w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs` với icon `Zap`.
- **Mã định danh phân hệ:** `M05 • EVENTBUS & EDA ARCHITECTURE` (`font-mono font-bold text-[10px]`).
- **Khẩu hiệu phân hệ:** `Transactional Outbox • At-Least-Once Delivery • Zero Packet Loss`.
- **Tiêu đề phân hệ:** `Trục Sự Kiện Bất Đồng Bộ & Kiến Trúc Hướng Sự Kiện (EDA)`.
- **Huy hiệu bảo chứng:** `Rule #19 Confirmed` (`bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700`).

### Tầng L1: Sub-tabs Navigation Strip
- **Container:** `flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-x-auto scrollbar-none`.
- **Hook đồng bộ phiên làm việc:** `useWorkspaceSessionTab<M05SubTab>('M05', 'stream')`.
- **Danh mục 4 Sub-tabs:**
  1. `stream`: `Dòng Sự Kiện Realtime ({events.length})` (icon `Activity`)
  2. `outbox`: `Trình Phát Sự Kiện (Publisher)` (icon `Radio`)
  3. `dlq`: `Hàng Đợi Lỗi (DLQ)` kèm badge đếm số lỗi nổi bật (icon `AlertTriangle`)
  4. `subscribers`: `Danh Sách Subscribers ({subscribers.length})` (icon `Server`)
- **Nút Tab Active:** `bg-blue-600 text-white shadow-xs px-3 py-1.5 font-semibold text-xs rounded-lg transition-all`.
- **Nút Tab Inactive:** `text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 px-3 py-1.5 font-semibold text-xs rounded-lg transition-all`.

### Tầng L2: KPI Metric Strip (Đồng bộ trên 4 tabs)
- **Grid tỷ lệ:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`.
- **Thẻ KPI:** `bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5`.
- **Chỉ số số học:** `font-mono tabular-nums font-bold text-2xl` căn lề chuẩn mực.

### Tầng L3: Master Data Tables, Form Workbench & Consumer Grid
- **Event Stream Grid:**
  - Bảng thead xám tinh tế `bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase`.
  - Đường viền phân loại trạng thái dòng `border-l-4`:
    - `border-l-4 border-rose-500` cho sự kiện `DLQ_FAILED`
    - `border-l-4 border-emerald-500/60` cho sự kiện `ACKNOWLEDGED`
    - `border-l-4 border-blue-500/60` cho sự kiện `PUBLISHED`
  - Hiệu ứng hover dòng: `hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150`.
- **Event Publisher Workbench:**
  - Form nhập Topic & Textarea JSON Payload với tính năng **Format JSON** tự động.
  - Bảng mẫu sự kiện doanh nghiệp (Presets) từ M04, M08, M21, M12.
- **DLQ Workbench:**
  - Quản lý hàng đợi lỗi chuyên dụng, hỗ trợ **Retry đơn lẻ** và **Retry All DLQ**.
  - Empty State chuẩn mực khi không có lỗi.
- **Consumer Matrix Grid:**
  - Thẻ Consumer có chỉ số độ trễ bản tin (Lag msgs), Topic Subscription Regex, nút **Restart Consumer Pod** và **Reset Offset**.

### Tầng L4: Event Detail 360° Drawer & Pagination
- **Drawer trượt từ phải sang:** `w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl`.
- **Sơ đồ phả hệ (Lineage & Event Flow):** Publisher ➜ Outbox ➜ Broker ➜ Consumers.
- **Hộp JSON Payload Monospace:** Kèm nút sao chép Clipboard 1 chạm.
- **Bảo mật & Kiểm toán:** Chữ ký băm SHA-256 HMAC Verified.
- **Thao tác nhanh:** Nạp vào Thanh Ngữ cảnh Đối Tượng (`onSelectEntity`) và Thử Lại (Retry).
- **Điều khiển phân trang L4 (PaginationControl):** Đặt cố định dưới chân bảng Stream.

---

## 3. BẢNG ĐỐI CHIẾU FEATURE BASELINE (PHASE -1) ↔ SAU ĐỒNG BỘ

| STT | Tính Năng / Nghiệp Vụ | Trạng Thái Baseline (Phase -1) | Trạng Thái Sau Đồng Bộ (Phase 4) | Đánh Giá Hồi Quy |
|---|---|---|---|---|
| 1 | **Xem Dòng Sự Kiện Outbox** | Có trong tab `stream` | Chuyển vào `EventStreamTab.tsx`, bổ sung tìm kiếm realtime, lọc Topic/Nguồn, phân trang L4 | **Hoàn toàn bảo toàn & Nâng cấp** |
| 2 | **Nạp Ngữ Cảnh Đối Tượng** | Gọi `onSelectEntity` (Mã, Lineage, AuditTrail) | Giữ nguyên 100% logic lineage và audit trail, hỗ trợ kích hoạt từ Bảng và từ Drawer 360° | **Hoàn toàn bảo toàn** |
| 3 | **Làm Mới Broker** | Nút Làm mới trên Header, quay 600ms, toast notify | Giữ nguyên 100%, có mặt tại Command Bar của Stream Tab và Subscribers Tab | **Hoàn toàn bảo toàn** |
| 4 | **Xuất Báo Cáo CSV** | Nút Xuất CSV tạo Blob file `eventbus_outbox_report...` | Giữ nguyên 100% logic tạo Blob và tải về máy khách | **Hoàn toàn bảo toàn** |
| 5 | **Phát Sự Kiện Thủ Công** | Nhập topic + payload JSON, parse try-catch, prepend state | Giữ nguyên 100% trong `EventPublisherTab.tsx`, bổ sung Presets mẫu và format JSON | **Hoàn toàn bảo toàn & Nâng cấp** |
| 6 | **Bảo Vệ Phát Sự Kiện** | Phát trực tiếp không qua xác nhận | Bọc bằng `ConfirmDialog.tsx` theo chuẩn **Rule #19** | **Nâng cấp an toàn (Rule #19)** |
| 7 | **Xử Lý Hàng Đợi Lỗi (DLQ)** | Danh sách sự kiện DLQ_FAILED, nút Đẩy lại (Retry) | Giữ nguyên 100% trong `EventDlqTab.tsx`, bổ sung nút "Đẩy lại tất cả (Retry All)" | **Hoàn toàn bảo toàn & Nâng cấp** |
| 8 | **Bảo Vệ Retry DLQ** | Retry trực tiếp | Bọc bằng `ConfirmDialog.tsx` cho cả Retry đơn lẻ và Retry All | **Nâng cấp an toàn (Rule #19)** |
| 9 | **Giám Sát Subscribers** | Hiển thị 4 Consumers, trạng thái, lag | Giữ nguyên 100% trong `EventSubscribersTab.tsx`, nâng cấp thẻ KPI và grid trực quan | **Hoàn toàn bảo toàn** |
| 10 | **Restart Pod & Reset Offset** | Chưa có | Đã bổ sung trên từng Consumer Card, bọc bảo vệ bởi `ConfirmDialog.tsx` | **Tính năng mới hoàn thiện** |

---

## 4. BẢNG KIỂM TRA TUÂN THỦ NGUYÊN TẮC (GOVERNANCE & DESIGN CHECKLIST)

- **Rule #19 Compliance:**
  - `grep -rn "window.alert\|window.confirm"`: **0 kết quả** (Không có bất kỳ lệnh alert/confirm mặc định nào).
  - 100% hành động nhạy cảm (Phát sự kiện lên bus, Retry DLQ, Retry All DLQ, Restart Pod, Reset Offset) đều sử dụng `ConfirmDialog.tsx`.
- **WCAG AA Color Contrast:**
  - Toàn bộ badge trạng thái (`PUBLISHED`, `ACKNOWLEDGED`, `DLQ_FAILED`, `HEALTHY`, `DEGRADED`) đều có viền bao `border`, nền màu nhạt và chữ màu đậm tương phản cao.
  - Không có tình trạng chữ xám trên nền tối hoặc màu chữ trùng màu nền (đã kiểm tra toàn diện input, textarea, select trong cả Light và Dark mode).
- **Typography & Formats:**
  - Dữ liệu số liệu, mã chứng từ, ID, timestamp, JSON payload đều sử dụng `font-mono tabular-nums font-bold`.
  - Toàn bộ giá trị mặc định được bảo vệ bởi toán tử `??` (Nullish Coalescing) thay cho `||`.
- **Single-Screen & Non-Duplication:**
  - Không có thành phần hiển thị trùng lặp nào. Mỗi sub-tab hiển thị độc lập, sạch sẽ.
