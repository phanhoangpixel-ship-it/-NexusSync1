# NEXUSSYNC ERP — QUY TẮC KIẾN TRÚC & PHÁT TRIỂN TÍNH NĂNG CHO GEMINI AI

**Document:** `GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`  
**Purpose:** Quy tắc bắt buộc để Gemini AI phát triển module/tính năng mới mà không làm phân mảnh kiến trúc, dữ liệu, API hoặc domain authority của NexusSync ERP.

---

## 1. MỤC ĐÍCH

Tài liệu này là **Architecture Development Gate** cho mọi yêu cầu phát triển mới trong NexusSync ERP.

Mục tiêu:

- Không phát triển module/tính năng tách rời khỏi hệ thống.
- Không tạo dữ liệu trùng lặp khi entity đã tồn tại.
- Không tạo database authority thứ hai.
- Không tạo business logic song song với domain authority hiện hữu.
- Không tạo API độc lập làm mất liên kết với API/domain hiện hữu.
- Bảo đảm dữ liệu mới kết nối đúng với database chung.
- Bảo đảm cross-module workflow, event, audit, RBAC và traceability được duy trì.
- Phát hiện sai kiến trúc **trước khi code**, thay vì code xong mới sửa.

**Nguyên tắc tối cao:**

> DO NOT CODE FIRST. MAP THE ARCHITECTURE FIRST.

---

# 2. THỨ TỰ ƯU TIÊN KHI GEMINI NHẬN YÊU CẦU

Gemini phải xử lý theo thứ tự:

```text
Business Requirement
        ↓
Architecture Discovery
        ↓
Existing Module Discovery
        ↓
Existing Entity Discovery
        ↓
Database Schema Discovery
        ↓
Domain Authority Discovery
        ↓
API Discovery
        ↓
Event / Workflow Discovery
        ↓
RBAC / Audit Discovery
        ↓
Impact Analysis
        ↓
Implementation Plan
        ↓
Authorization / Scope Gate
        ↓
Implementation
        ↓
Integration Verification
        ↓
Regression
        ↓
Code Graph Update
        ↓
Completion / Freeze
```

Không được đảo thứ tự này nếu không có chỉ thị governance rõ ràng.

---

# 3. TÀI LIỆU GEMINI PHẢI ĐỌC TRƯỚC KHI CODE

Trước mọi thay đổi có ảnh hưởng tới hệ thống, Gemini phải kiểm tra các tài liệu kiến trúc hiện có, đặc biệt:

```text
/docs/AI/CURRENT_STATE.md
/docs/AI/ERP_ARCHITECTURE_MASTER.md
/docs/AI/ERP_DATA_GRAPH.md
/docs/AI/ERP_MODULE_GRAPH.md
/docs/AI/ERP_API_GRAPH.md
/docs/AI/ERP_DOMAIN_AUTHORITY_MAP.md
/docs/AI/ERP_EVENT_GRAPH.md
/docs/AI/ERP_DATABASE_SCHEMA_GRAPH.md
/docs/AI/ERP_CROSS_MODULE_DEPENDENCY.md
/docs/AI/ERP_INVARIANTS.md
```

Nếu một tài liệu chưa tồn tại:

1. Không được tự giả định nội dung.
2. Kiểm tra source code/schema thực tế.
3. Ghi nhận tài liệu thiếu.
4. Nếu tài liệu thiếu làm không thể xác định dependency/authority một cách an toàn thì **STOP** trước implementation.

---

# 4. SOURCE OF TRUTH

Gemini phải phân biệt:

### 4.1. Governance Source of Truth

Các trạng thái:

- FROZEN
- IMMUTABLE
- CERTIFIED
- AUTHORIZED
- DEFERRED
- NOT AUTHORIZED

phải được tôn trọng theo governance baseline hiện hành.

### 4.2. Technical Source of Truth

Khi xác định kỹ thuật, phải ưu tiên:

```text
Actual Source Code
        +
Actual Database Schema
        +
Actual API Implementation
        +
Actual Domain Services
        +
Architecture Graph
        +
Governance Documents
```

Không được lấy tên trong UI/mockup làm bằng chứng rằng backend đã tồn tại.

---

# 5. QUY TẮC KHÔNG ĐƯỢC VI PHẠM

## RULE 01 — Architecture First

Không viết code production trước khi hoàn thành mapping kiến trúc.

## RULE 02 — Reuse Before Create

Trước khi tạo:

- table
- entity
- service
- API
- event
- permission
- workflow

phải tìm implementation tương ứng đã tồn tại.

Nếu có, ưu tiên **reuse/extend** thay vì tạo bản sao.

## RULE 03 — No Duplicate Master Data

Không tạo master data thứ hai cho:

- Product
- Customer
- Supplier
- Warehouse
- Location
- Employee
- Account
- các entity master tương đương.

Nếu entity đã tồn tại, module mới phải tham chiếu entity hiện hữu.

## RULE 04 — No Duplicate Authority

Một loại dữ liệu nghiệp vụ chỉ được có **một authoritative owner**.

Ví dụ:

```text
Inventory
    → InventoryService

Accounting / GL
    → AccountingService

Costing / COGS / Valuation
    → CostingService
```

Không tạo:

```text
NewInventoryService
NewStockLedger
NewGLService
NewCostingEngine
```

chỉ để phục vụ module mới nếu authority tương ứng đã tồn tại.

## RULE 05 — Inventory Single Writer

Mọi inventory mutation phải đi qua authority inventory hiện hữu.

Đặc biệt:

```text
InventoryService.postTransaction()
```

là đường ghi inventory được bảo vệ theo baseline hiện tại.

Module mới không được trực tiếp tự sửa stock ledger/balance để tạo một inventory flow riêng.

## RULE 06 — Accounting Authority

Mọi nghiệp vụ tạo ảnh hưởng GL phải đi qua Accounting authority hiện hữu.

Không tự tạo ledger/accounting engine riêng trong module nghiệp vụ.

## RULE 07 — Costing Authority

Mọi nghiệp vụ ảnh hưởng:

- inventory valuation
- COGS
- cost
- margin

phải sử dụng Costing authority hiện hữu.

Không tạo cost engine riêng.

## RULE 08 — Database Is Shared Enterprise Data

Database không phải tập hợp các database mini theo module.

Module mới phải tham gia vào **enterprise data graph**.

Trước khi tạo table mới phải xác định:

- Vì sao entity chưa tồn tại.
- Entity owner.
- Primary key.
- Foreign keys.
- Relations.
- Indexes.
- Unique constraints.
- Lifecycle.
- Audit requirements.
- Transaction boundaries.
- Cross-module dependencies.

## RULE 09 — No Orphan Data

Không được tạo bảng/entity mà không có đường liên kết hợp lệ tới enterprise data graph.

Mọi entity mới phải có:

```text
Entity
 ↓
Owner
 ↓
Relationships
 ↓
API
 ↓
Domain Service
 ↓
Audit / Event
```

khi các lớp đó có liên quan.

## RULE 10 — API Must Connect to Real Domain

Không tạo fake API, mock API, fake context hoặc local-only state để thay thế production domain.

UI phải kết nối:

```text
UI
 ↓
Real API
 ↓
Real Domain Service
 ↓
Real Database
```

## RULE 11 — Event Integrity

Nếu tính năng tạo business event, phải xác định:

- Event name
- Producer
- Subscriber
- Payload
- Idempotency
- Retry
- Failure handling
- Audit/traceability

Không tự tạo event flow trùng với event authority hiện hữu.

## RULE 12 — RBAC Before Exposure

Tính năng mới phải có permission model phù hợp trước khi đưa vào production UI/API.

Phải kiểm tra:

- Authentication
- Authorization
- Permission
- Role
- Endpoint protection
- UI visibility

## RULE 13 — Auditability

Business mutation phải có audit/traceability phù hợp.

Phải xác định:

```text
Who
What
When
Where
Why
Before
After
Reference
```

theo capability thực tế của hệ thống.

## RULE 14 — Transaction Integrity

Nếu một business operation cập nhật nhiều entity liên quan, phải xác định transaction boundary.

Không để trạng thái:

```text
Business transaction = partially committed
```

nếu nghiệp vụ yêu cầu atomicity.

## RULE 15 — Idempotency

Các operation có khả năng retry/replay/concurrent execution phải được kiểm tra idempotency.

Không để một request/event retry tạo duplicate business transaction.

## RULE 16 — Frozen Modules Are Protected

Nếu module/file/schema/API thuộc baseline:

```text
FROZEN & IMMUTABLE
```

thì Gemini:

- Không refactor.
- Không sửa trực tiếp.
- Không thay đổi contract.
- Không đổi schema.
- Không thay đổi authority.

Nếu tính năng mới cần thay đổi frozen scope:

> STOP → báo architectural conflict → chờ authorization.

## RULE 17 — Deferred ≠ Implementable

Nếu capability được đánh dấu:

```text
DEFERRED
```

thì không được tự ý triển khai.

Phải có business/governance authorization trước.

## RULE 18 — Observed Gap ≠ Authorized Candidate

Phát hiện thiếu tính năng không đồng nghĩa được phép code.

Luồng bắt buộc:

```text
Observed Gap
 ↓
Business Decision
 ↓
Executive Business Contract
 ↓
Candidate Authorization
 ↓
Implementation
```

## RULE 19 — No Unauthorized Mutation

Không được thực hiện schema/code/data mutation ngoài scope đã được authorize.

Nếu phát hiện mutation ngoài scope:

```text
STOP
REPORT
DO NOT CONTINUE
```

---

# 6. FEATURE IMPACT ANALYSIS BẮT BUỘC

Trước implementation, Gemini phải tạo bảng:

| Thành phần | Existing? | Reuse? | New? | Authority | Impact |
|---|---|---|---|---|---|
| UI | | | | | |
| Route | | | | | |
| API | | | | | |
| Entity | | | | | |
| Table | | | | | |
| Service | | | | | |
| Event | | | | | |
| Permission | | | | | |
| Audit | | | | | |
| Workflow | | | | | |
| Inventory | | | | | |
| Accounting | | | | | |
| Costing | | | | | |

Không được bỏ qua các dòng không trực tiếp liên quan; phải ghi `N/A` và lý do.

---

# 7. DATA GRAPH CHECK

Gemini phải trả lời:

### Entity nào là nguồn?

```text
Source Entity
```

### Entity nào tham chiếu?

```text
Referenced Entity
```

### Quan hệ là gì?

```text
1:1
1:N
N:N
```

### Foreign Key ở đâu?

```text
child_table.foreign_key
        →
parent_table.primary_key
```

### Ai sở hữu lifecycle?

```text
Domain Owner
```

### Ai được phép mutate?

```text
Mutation Authority
```

### Dữ liệu nào là derived?

Derived data không được trở thành authority mới.

---

# 8. MODULE DEPENDENCY CHECK

Mỗi module mới phải được đặt vào graph:

```text
New Module
   │
   ├── Depends On
   │
   ├── Provides To
   │
   ├── Reads From
   │
   ├── Writes Through
   │
   ├── Publishes
   │
   ├── Subscribes
   │
   ├── Uses Permissions
   │
   └── Audits
```

Phải xác định dependency trước implementation.

---

# 9. DATABASE CHANGE GATE

Nếu cần schema change:

Gemini phải trình bày:

```text
CURRENT SCHEMA
        ↓
WHY EXISTING TABLE CANNOT BE REUSED
        ↓
NEW TABLE / COLUMN
        ↓
RELATION
        ↓
INDEX
        ↓
CONSTRAINT
        ↓
MIGRATION
        ↓
BACKWARD COMPATIBILITY
        ↓
DATA INTEGRITY TEST
```

Không được tạo table chỉ vì "dễ code hơn".

---

# 10. API CHANGE GATE

Nếu cần API mới:

```text
Existing API?
   │
   ├── YES → Extend/Reuse
   │
   └── NO
        ↓
Why new API?
        ↓
Domain owner
        ↓
Contract
        ↓
Auth
        ↓
Validation
        ↓
Transaction
        ↓
Audit
        ↓
Error handling
```

API phải phản ánh domain authority, không tạo authority mới.

---

# 11. UI DEVELOPMENT RULE

UI chỉ là Presentation Layer.

Không được đặt business authority vào:

- React state
- localStorage
- mock context
- client-side fake data
- UI-only calculation

Các dữ liệu nghiệp vụ quan trọng phải lấy từ backend/domain thật.

```text
Presentation
      ↓
API
      ↓
Domain
      ↓
Authority
      ↓
Database
```

---

# 12. CROSS-MODULE SYNCHRONIZATION

Khi tính năng liên quan nhiều module, phải lập flow:

Ví dụ:

```text
Sales Order
    ↓
Allocation
    ↓
Warehouse
    ↓
Picking
    ↓
Packing
    ↓
Shipment
    ↓
Inventory
    ↓
COGS
    ↓
Accounting
    ↓
BI
```

Gemini phải xác định dữ liệu nào đi qua từng bước và không được tạo bản sao authority.

---

# 13. TEST BẮT BUỘC

Sau implementation phải kiểm tra:

### Database
- Schema integrity
- FK
- Unique constraints
- Indexes
- Migration

### API
- Authentication
- Authorization
- Validation
- Error handling

### Domain
- Business rules
- Transaction atomicity
- Idempotency

### Integration
- Cross-module synchronization
- Event propagation
- Data consistency

### Security
- Unauthorized access
- Unauthorized mutation

### Audit
- Mutation traceability

### Build
- Typecheck
- Production build

### Regression
- Existing modules
- Existing APIs
- Existing authority
- Frozen baseline

---

# 14. CODE GRAPH UPDATE RULE

Sau khi hoàn thành feature, Gemini phải cập nhật:

```text
ERP_ARCHITECTURE_MASTER.md
ERP_DATA_GRAPH.md
ERP_MODULE_GRAPH.md
ERP_API_GRAPH.md
ERP_DOMAIN_AUTHORITY_MAP.md
ERP_EVENT_GRAPH.md
ERP_DATABASE_SCHEMA_GRAPH.md
ERP_CROSS_MODULE_DEPENDENCY.md
CURRENT_STATE.md
```

Không được để code mới tồn tại mà Code Graph không biết tới.

---

# 15. COMPLETION CRITERIA

Một feature chỉ được coi là hoàn thành khi:

```text
[ ] Business scope verified
[ ] Architecture mapped
[ ] Existing entities checked
[ ] Existing APIs checked
[ ] Existing services checked
[ ] Authority identified
[ ] Database relation verified
[ ] RBAC verified
[ ] Audit verified
[ ] Event flow verified
[ ] Transaction verified
[ ] Idempotency verified
[ ] Cross-module integration verified
[ ] Regression PASS
[ ] Typecheck PASS
[ ] Production build PASS
[ ] Unauthorized mutations = 0
[ ] Code Graph updated
[ ] CURRENT_STATE updated
```

---

# 16. STOP CONDITIONS

Gemini **phải dừng ngay** nếu gặp một trong các trường hợp:

1. Không xác định được data owner.
2. Không xác định được authority.
3. Có nguy cơ duplicate entity.
4. Có nguy cơ duplicate ledger.
5. Có nguy cơ duplicate stock balance.
6. Có nguy cơ duplicate master data.
7. Phải sửa frozen module.
8. Phải thay đổi frozen schema.
9. Phải thay đổi protected API contract.
10. Scope chưa được authorization.
11. Không xác định được transaction boundary.
12. Không xác định được cross-module dependency.
13. Không thể bảo đảm database integrity.
14. Không thể bảo đảm backward compatibility.
15. Phát hiện unauthorized mutation.

Khi STOP:

```text
DO NOT PATCH RANDOMLY.
DO NOT BYPASS THE ARCHITECTURE.
DO NOT CONTINUE IMPLEMENTATION.

REPORT:
- Conflict
- Affected modules
- Affected entities
- Affected tables
- Affected APIs
- Affected authorities
- Recommended compliant design
- Required authorization
```

---

# 17. MẪU BÁO CÁO TRƯỚC KHI CODE

Gemini phải xuất:

```text
FEATURE:
[NAME]

BUSINESS OBJECTIVE:
[...]

AUTHORIZED SCOPE:
[...]

AFFECTED MODULES:
[...]

EXISTING ENTITIES:
[...]

NEW ENTITIES:
[...]

EXISTING TABLES:
[...]

NEW TABLES:
[...]

DATABASE RELATIONSHIP:
[...]

EXISTING APIs:
[...]

NEW APIs:
[...]

DOMAIN AUTHORITIES:
[...]

EVENTS:
[...]

RBAC:
[...]

AUDIT:
[...]

INVENTORY IMPACT:
[...]

ACCOUNTING IMPACT:
[...]

COSTING IMPACT:
[...]

FROZEN SCOPE IMPACT:
[...]

REGRESSION IMPACT:
[...]

ARCHITECTURE DECISION:
[APPROVED / BLOCKED]

IMPLEMENTATION:
[AUTHORIZED / NOT AUTHORIZED]
```

---

# 18. MASTER PRINCIPLE

Toàn bộ tài liệu được quy về nguyên tắc:

> **NexusSync ERP is one integrated enterprise system, not a collection of independent modules.**

Vì vậy:

```text
NEW FEATURE
     ↓
MUST CONNECT TO
     ↓
EXISTING ERP DATA GRAPH
     ↓
EXISTING DOMAIN AUTHORITIES
     ↓
EXISTING APIs
     ↓
EXISTING EVENTS
     ↓
EXISTING SECURITY
     ↓
EXISTING AUDIT
     ↓
EXISTING DATABASE
```

Không được phát triển theo mô hình:

```text
New Module
   ↓
New Database Logic
   ↓
New API
   ↓
New Master Data
   ↓
New Authority
```

---

# 19. LỆNH GEMINI SỬ DỤNG TÀI LIỆU NÀY

Mỗi yêu cầu phát triển mới có thể bắt đầu bằng:

```text
NEXUSSYNC ERP — ARCHITECTURE-FIRST EXECUTION

MANDATORY GOVERNANCE DOCUMENT:
Read:
/docs/AI/GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md

Then read all referenced ERP architecture/data/code graph documents.

TASK:
[INSERT FEATURE REQUEST]

EXECUTION MODE:
Architecture-first.

BEFORE CODE:
1. Inspect actual source code.
2. Inspect actual database schema.
3. Inspect existing modules.
4. Inspect existing APIs.
5. Inspect domain authorities.
6. Inspect events/workflows.
7. Inspect RBAC and audit.
8. Build feature impact analysis.
9. Build database/data dependency map.
10. Determine whether existing entities/services/APIs can be reused.

DO NOT:
- create duplicate master data
- create duplicate authority
- create duplicate ledger
- create duplicate inventory balance
- create fake API
- create fake ERP context
- bypass RBAC
- bypass audit
- modify frozen scope
- expand unauthorized scope

IF ARCHITECTURE IS SAFE:
Proceed with the minimum compliant implementation.

IF ARCHITECTURE IS NOT SAFE:
STOP and report the conflict.
Do not implement a workaround.

AFTER IMPLEMENTATION:
Run integration, security, transaction, idempotency, regression,
typecheck and production-build verification.

Then update all affected ERP Graph documents and CURRENT_STATE.md.

FINAL DECISION:
[PASS / BLOCKED]

UNAUTHORIZED MUTATIONS:
[COUNT]

STOP.
```

---

## 20. QUY TẮC CUỐI CÙNG

**Không cho phép quy trình:**

```text
Code → lỗi tích hợp → sửa database → sửa API → sửa module → sửa core
```

Thay bằng:

```text
Architecture
    ↓
Data Graph
    ↓
Authority
    ↓
Dependency
    ↓
Impact
    ↓
Design
    ↓
Authorization
    ↓
Code
    ↓
Integration
    ↓
Verification
    ↓
Graph Update
    ↓
Freeze
```

**Đây là tài liệu kiểm soát phát triển, không phải tài liệu hướng dẫn code thông thường.**

---

# 21. REGISTRY MODULES FROZEN & IMMUTABLE: M41 PRICING & M42 COSTING ENGINE

### 21.1. Thông tin Đóng băng (Acceptance Seal & Freeze Metadata)
- **Module M41 (Product Pricing Management):** `engines/pricingService.ts` — `@frozen v5.0.0-PROD` (Hiệu lực: 2026-09-14).
- **Module M42 (Costing & Landed Cost Engine):** `engines/costingEngine.ts` — `@frozen v5.0.0-PROD` (Hiệu lực: 2026-09-14).
- **Phê duyệt bởi:** Governance Board / Chief Accountant & CFO (Bảo vệ theo Rule #16).
- **Căn cứ chấp thuận:** Hoàn tất 100% Giai đoạn 6 (Verification Gate 9/9 PASS) & Giai đoạn 7 (Go-Live 100% Scope ALL, Sổ cái M30 100% Khớp).

### 21.2. Sơ đồ Luồng Dữ liệu Hợp nhất M41 & M42 (Unified Data Flow)
```text
[PO Inbound / Landed Cost M42] ──────────┐
                 │                       ▼
                 │            [cost_layers (FIFO Layers)]
                 │                       │
                 │                       ▼
[PO Goods Receipt] ───────► [CostingEngine (M42 Single-Writer)]
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
[products.costPrice]            [calculateIssueCost()]              [AccountingEngine (M30)]
 (Moving Weighted Avg)                   │                           (Nợ TK 632 / Có TK 156)
        │                                │
        ▼                                ▼
[PricingEngine (M41)] ───────► [Sales / Stock Issue]
 (Margin Guard & Discounts)     (cogs_transactions)
```

### 21.3. Khóa Chữ ký Hàm Công khai (Locked Public Signatures)
**M41 Pricing Service (`engines/pricingService.ts`):**
1. `PricingService.resolveUnitPrice({ productId, customerId?, priceListId?, quantity?, tx? })`
2. `PricingCalculator.calculateMarkupPrice(cost, markupPercent, roundingMode?)`
3. `PricingCalculator.calculateMarginPrice(cost, targetMarginPercent, roundingMode?)`
4. `PricingCalculator.calculateActualMargin(cost, sellingPrice)`
5. `PricingCalculator.calculateActualMarkup(cost, sellingPrice)`
6. `PricingCalculator.checkMinimumMargin(cost, sellingPrice, minMarginPercent)`
7. `PricingCalculator.calculateDynamicDiscount(params)`
8. `PricingCalculator.calculateLinePricing(context)`

**M42 Costing Engine (`engines/costingEngine.ts`):**
1. `costingEngine.calculateIssueCost(params: CalculateIssueParams, tx?): Promise<IssueCostResult>`
2. `costingEngine.addCostLayer(params: AddCostLayerParams, tx?): Promise<any>`
3. `costingEngine.recalculateWeightedAverageCost(productId: number, warehouseId?: number, tx?): Promise<number>`
4. `costingEngine.allocateLandedCost(params: LandedCostAllocationParams, tx?): Promise<any>`
5. `costingEngine.getCostingConfig(tx?): Promise<any>`
6. `costingEngine.updateCostingMethod(params, tx?): Promise<any>`

### 21.4. Cấu trúc Event Chuẩn: `costing.landed_cost.allocated.v2`
```json
{
  "allocationRunId": "LCA-2026-09-001",
  "receiptId": 105,
  "allocationMethod": "VALUE",
  "totalLandedCostAdded": 15000000,
  "adjustedLayers": [
    {
      "layerId": 12,
      "productId": 3,
      "oldUnitCost": 50000,
      "newUnitCost": 55000,
      "varianceAmount": 5000000
    }
  ],
  "glJournalPosted": true,
  "timestamp": "2026-09-14T04:00:00.000Z"
}
```

### 21.5. Nhật ký Xử lý Vi phạm Thẩm quyền & Thay thế Hệ số (Audit Trail)
- **Vi phạm đã triệt tiêu:** Loại bỏ hoàn toàn các hệ số tính giá vốn ước tính cứng `* 0.7`, `* 0.78`, `* 0.65` tại mọi luồng nghiệp vụ.
- **Thẩm quyền đơn nhất:** Giao dịch xuất kho không đủ cost layer sẽ bị chặn cứng với exception `ERR_COSTING_LAYER_DEPLETED` thay vì tự ý giả định giá vốn.
- **Tính Bất biến:** Dữ liệu chứng từ lịch sử (`sales_order_items`, `cogs_transactions`, `cost_layers`) được bảo toàn 100%, không bị tính lại khi đổi danh mục giá.

