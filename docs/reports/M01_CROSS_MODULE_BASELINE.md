# M01 CROSS-MODULE BASELINE SPECIFICATION
**Hệ thống:** NexusSync ERP — M01 Workspace Hub & Live API / Data Flow Observatory  
**Trạng thái:** **FROZEN PRODUCTION BASELINE**  
**Mã tài liệu:** `M01_CROSS_MODULE_BASELINE.md`  
**Ngày phê chuẩn:** 2026-09-29  

---

## 1. Bản đồ Phụ thuộc Liên Phân hệ (Cross-Module Map)

| Phân hệ | Mối quan hệ | API / Service | Hướng luồng | Thẩm quyền sở hữu dữ liệu | Trạng thái |
|---|---|---|---|---|:---:|
| **M02** (Audit Log) | Source Data | `AuditService` (`audit_logs`) | M02 ➔ M01 (Read) | M02 là Single Source of Truth cho audit chain | **CERTIFIED** |
| **M05** (EventBus / Outbox) | Source Data | `OutboxService` (`outbox_events`) | M05 ➔ M01 (Read) | M05 là Single Source of Truth cho message queue | **CERTIFIED** |
| **M07** (Master Data) | Reference Data | `MasterDataService` | M07 ➔ M01 (Read) | M07 là chủ quản danh mục sản phẩm / đối tác | **CERTIFIED** |
| **M17** (Inventory) | Observed Domain | `InventoryService.postTransaction()` | M17 ➔ M01 (Telemetry) | M17 là Single Writer duy nhất cho tồn kho | **CERTIFIED** |
| **M30** (Accounting GL) | Observed Domain | `AccountingEngine.postJournal()` | M30 ➔ M01 (Telemetry) | M30 là Single Writer duy nhất cho sổ cái | **CERTIFIED** |
| **M41** (Pricing Engine) | Observed Domain | `PricingEngine` | M41 ➔ M01 (Telemetry) | M41 là Single Writer duy nhất cho bảng giá | **CERTIFIED** |
| **M42** (Costing Engine) | Observed Domain | `CostingEngine` | M42 ➔ M01 (Telemetry) | M42 là Single Writer duy nhất cho giá vốn | **CERTIFIED** |
| **M03–M40, M43** | Topology Registry | `MODULE_REGISTRY` | Modules ➔ M01 (Read) | Giám sát trạng thái hoạt động toàn cục | **CERTIFIED** |

---

## 2. Nguyên tắc Bất biến (Invariants)
- M01 chỉ quan sát (Observe), truy vết (Trace), chẩn đoán (Diagnose), và báo cáo (Report).
- M01 **tuyệt đối không bao giờ** trở thành Single Writer hay tạo duplicate logic của các phân hệ M17, M30, M41, M42.
