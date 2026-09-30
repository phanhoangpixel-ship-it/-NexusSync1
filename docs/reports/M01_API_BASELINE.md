# M01 API BASELINE SPECIFICATION
**Hệ thống:** NexusSync ERP — M01 Workspace Hub & Live API / Data Flow Observatory  
**Trạng thái:** **FROZEN PRODUCTION BASELINE**  
**Mã tài liệu:** `M01_API_BASELINE.md`  
**Ngày phê chuẩn:** 2026-09-29  

---

## 1. Danh mục API Baseline (11/11 Verified)

| # | Method | Endpoint | Auth | Permission | Service / Engine | Database Dependency | Status |
|---|---|---|---|---|---|---|:---:|
| 1 | `GET` | `/api/workspace/summary` | Session/JWT | `workspace:read` | `workspaceHubService` | SQLite (aggregated read) | **CERTIFIED** |
| 2 | `GET` | `/api/workspace/work-items` | Session/JWT | `workspace:read` | `workspaceHubService` | SQLite (queue read) | **CERTIFIED** |
| 3 | `GET` | `/api/workspace/observability/health` | Session/JWT | `observability:read` | `observabilityProjectorService` | `module_kpi_snapshots` | **CERTIFIED** |
| 4 | `GET` | `/api/workspace/observability/topology` | Session/JWT | `observability:read` | `observabilityProjectorService` | `module_kpi_snapshots` | **CERTIFIED** |
| 5 | `GET` | `/api/workspace/observability/spans` | Session/JWT | `observability:read` | `observabilityProjectorService` | `flow_spans` | **CERTIFIED** |
| 6 | `GET` | `/api/workspace/observability/spans/:correlationId` | Session/JWT | `observability:read` | `observabilityProjectorService` | `flow_spans` | **CERTIFIED** |
| 7 | `GET` | `/api/workspace/observability/rca/:correlationId` | Session/JWT | `observability:read` | `observabilityProjectorService` | `flow_spans` | **CERTIFIED** |
| 8 | `POST` | `/api/workspace/observability/sync` | Session/JWT | `observability:admin` | `observabilityProjectorService` | `audit_logs`, `outbox_events`, `flow_spans` | **CERTIFIED** |
| 9 | `POST` | `/api/workspace/observability/remediate/:id` | Session/JWT | `observability:admin` | `observabilityProjectorService` | `flow_spans`, `outbox_events` | **CERTIFIED** |
| 10 | `GET` | `/api/workspace/observability/trends` | Session/JWT | `observability:read` | `observabilityProjectorService` | `module_kpi_snapshots` | **CERTIFIED** |
| 11 | `GET` | `/api/workspace/observability/forecast` | Session/JWT | `observability:read` | `observabilityProjectorService` | `module_kpi_snapshots` | **CERTIFIED** |

---

## 2. Quy chuẩn Hợp đồng API (Contract Invariants)
1. **Zero Shadow Writing:** Tuyệt đối không tạo API ghi trực tiếp vào các bảng lõi ngoài thẩm quyền (`stock_balances`, `stock_ledger`, `accounting_entries`, `cost_layers`, `pricing_rules`).
2. **Idempotent Sync:** `POST /api/workspace/observability/sync` có khả năng gọi lặp lại nhiều lần an toàn mà không sinh bản ghi trùng lặp.
3. **Strict Error Handling:** Trả về mã lỗi HTTP chuẩn (`400`, `404`, `500`), không che giấu lỗi bằng `200 OK`.
