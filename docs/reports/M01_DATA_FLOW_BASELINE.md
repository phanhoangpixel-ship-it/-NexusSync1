# M01 DATA FLOW BASELINE SPECIFICATION
**Hệ thống:** NexusSync ERP — M01 Workspace Hub & Live API / Data Flow Observatory  
**Trạng thái:** **FROZEN PRODUCTION BASELINE**  
**Mã tài liệu:** `M01_DATA_FLOW_BASELINE.md`  
**Ngày phê chuẩn:** 2026-09-29  

---

## 1. Kiến trúc Luồng Dữ liệu (End-to-End Data Pipeline)

```text
[ Người dùng / Thao tác hệ thống ]
                ↓
    [ Audit Logs (M02) & Outbox Events (M05) ]
                ↓
    [ Observability Projector Engine (Cron / Sync API) ]
                ↓
    [ Cơ sở Dữ liệu Đọc: flow_spans & module_kpi_snapshots ]
                ↓
    [ REST API Endpoints (/api/workspace/observability/*) ]
                ↓
    [ m01WorkspaceApi (Client Adapter TypeScript Strict) ]
                ↓
    [ M01 Live Flow Observatory & Enterprise Command Dashboard ]
```

---

## 2. Phân tách Dữ liệu (Data Separation Invariants)
- **`FLOW_DEFINITION`:** Cấu trúc kết nối tĩnh giữa 43 module, xác định rõ Method, Endpoint, Service và Thẩm quyền đơn nhất.
- **`FLOW_SPAN`:** Dữ liệu thực thi thời gian thực đọc từ telemetry `flow_spans` với `correlationId`, `durationMs`, `status`.
- **`SIMULATION_MODE`:** Trực quan hóa hạt chuyển động trên canvas độc lập, không ghi database, không gọi API mutation.
