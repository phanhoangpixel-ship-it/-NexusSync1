# M01 DATABASE BASELINE SPECIFICATION
**Hệ thống:** NexusSync ERP — M01 Workspace Hub & Live API / Data Flow Observatory  
**Trạng thái:** **FROZEN PRODUCTION BASELINE**  
**Mã tài liệu:** `M01_DATABASE_BASELINE.md`  
**Ngày phê chuẩn:** 2026-09-29  

---

## 1. Bảng Dữ liệu Thuộc Phạm vi M01 Observability

### 1.1. Bảng `flow_spans` (Read-Model Spans)
- **Mục đích:** Lưu trữ các span sự kiện runtime phục vụ phân tích RCA và biểu diễn trên đồ thị M01.
- **Cấu trúc cột:**
  - `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
  - `sourceType` (TEXT: 'AUDIT' | 'EVENT')
  - `sourceRefId` (INTEGER)
  - `correlationId` (TEXT, INDEXED)
  - `moduleCode` (TEXT, INDEXED)
  - `actionName` (TEXT)
  - `status` (TEXT: 'SUCCESS' | 'FAILED' | 'PENDING')
  - `occurredAt` (TEXT, ISO-8601)
  - `durationMs` (INTEGER NULL)
  - `metadataMasked` (TEXT NULL)
  - `projectedAt` (TEXT, ISO-8601)

### 1.2. Bảng `module_kpi_snapshots` (Daily Aggregations)
- **Mục đích:** Lưu trữ chỉ số hiệu quả (Efficiency Score) và số lượng hành động theo ngày của từng module.
- **Cấu trúc cột:**
  - `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
  - `snapshotDate` (TEXT, YYYY-MM-DD, INDEXED)
  - `moduleCode` (TEXT, INDEXED)
  - `totalActions` (INTEGER DEFAULT 0)
  - `errorCount` (INTEGER DEFAULT 0)
  - `avgDurationMs` (REAL NULL)
  - `efficiencyScore` (REAL NULL)

---

## 2. Kiểm toán Thao tác Cơ sở Dữ liệu
- **Read Operations:** Truy vấn `flow_spans` và `module_kpi_snapshots` có phân trang, lọc theo `correlationId`, `moduleCode`, `status`.
- **Write Operations:** Ghi an toàn qua chu kỳ `syncObservabilityReadModels` với giao dịch `BEGIN TRANSACTION ... COMMIT` và cơ chế chống trùng lặp.
- **Cấm tuyệt đối:** Không chèn/cập nhật trực tiếp vào `stock_balances`, `stock_ledger`, `accounting_entries`, `cost_layers`.
