# ERP Business Rules & Domain Logic

This document defines the strict business rules, workflows, and constraints of the ERP system across all 42 modules (M01 – M42). **AI MUST NOT guess or alter these rules**; they must be strictly followed when implementing or fixing features.

> **Master Architecture Reference:** See `/docs/MODULE_MAP.md` and individual module specifications in `/docs/modules/README.md`.
> **Core Single-Writer Invariants (Non-Negotiable):**
> 1. **Inventory Authority:** `InventoryService.postTransaction()` (M17) is the ONLY single-writer for inventory balances.
> 2. **Accounting Authority:** `AccountingService` (M30) is the ONLY single-writer for double-entry General Ledger vouchers.
> 3. **Pricing Authority:** `PricingEngine` (M41) is the ONLY single-writer for product selling prices.
> 4. **Costing Authority:** `CostingService` / Landed Cost Engine (M42) is the ONLY single-writer for inventory valuation and COGS calculations.

## 1. Procurement & Inventory (P2P Flow)

**Workflow:** `Purchase Requisition / Sourcing Award (M10) -> Purchase Order (PO - M08) -> Approval Matrix (M28) -> Cost Center Budget Check (M30) -> Goods Receipt (GR - M08/M17) -> Single-Writer InventoryService -> 3-Way Matching -> AP Invoice (M31)`

**Rules:**
- **PO does NOT increase stock:** A Purchase Order is merely an intent to buy. It does not alter physical or available stock balances.
- **GR increases stock via Single-Writer Authority:** A Goods Receipt represents physical arrival of goods. It triggers `InventoryService.postTransaction()` (M17 SSOT) to append to `stock_ledger` and update `stock_balances`. M08 NEVER writes to `stock_balances` directly.
- **Multi-tier Financial Approval Matrix (M28 Governance):**
  - $\le 500.000.000$ VNĐ: Level 1 (Procurement Manager).
  - $> 500.000.000$ VNĐ: Level 2 (Procurement Manager + CPO / Procurement Director).
  - $> 2.000.000.000$ VNĐ: Level 3 (Procurement Manager + CPO + CFO / Executive Board).
  - State machine: `DRAFT` $\rightarrow$ `PENDING_APPROVAL` $\rightarrow$ `APPROVED` (or `REJECTED`).
- **Cost Center Budget Guard (M30 Integration):**
  - Every PO must reference an active Cost Center.
  - The system evaluates available budget (`budgetAllocated - budgetSpent - budgetCommitted`) prior to approval.
  - POs exceeding budget are blocked with `BUDGET_GUARD_EXCEEDED` unless authorized with explicit override justification.
- **3-Way Matching Engine (PO ↔ GR ↔ AP Invoice):**
  - Compares: 1) PO Ordered Qty & Unit Price, 2) GR Received Qty, 3) AP Invoice Billed Qty & Price.
  - Tolerance threshold: Configurable `matchTolerancePercent` (default 2% or 50.000 VNĐ).
  - If discrepancy exceeds tolerance, `matchingStatus` is flagged as `DISCREPANCY` / `MISMATCH`, and payment voucher posting is blocked until resolved via M28 Dispute Workflow.
- **Idempotency is Mandatory:**
  - Both `POST /api/purchase-orders` and `POST /api/goods-receipts` require an `idempotencyKey` header/body parameter.
  - Retries return cached responses from `outbox_events` and NEVER create duplicate documents or double-post stock ledger transactions.
- **Unit of Measure (UOM) Conversion Guard (M07 SSOT):**
  - Inventory is ALWAYS tracked in `baseUnit`.
  - When receiving items in an alternate UOM (e.g., Box, Pallet, Carton), the system resolves conversion via `product_uoms.conversionFactor` (`baseQuantity = quantity * factor`) before invoking `InventoryService.postTransaction()`.
- **Partial & Over-Receipt Guard:**
  - Supports phased/partial receipts across multiple GR deliveries, tracking cumulative `receivedQuantity`.
  - Blocks over-receipts exceeding the purchase order remaining balance plus allowable `overReceiptTolerancePercent` (default 0% - 5%).
- **Strategic Sourcing Traceability (M10 Link):**
  - POs generated from tender awards preserve `sourceType: 'SOURCING_AWARD'` and `sourceId` for end-to-end auditability.
- **Centralized Tamper-Evident Audit (M02 SSOT):**
  - All lifecycle state transitions (`CREATE`, `SUBMIT`, `APPROVE`, `REJECT`, `RECEIVE`, `MATCH_RESOLVE`) are recorded via `AuditService.recordAuditLog()` with SHA-256 integrity hashing.

## 2. Invoicing & Payments (O2C Flow)

**Rules:**
- **Invoice vs. Payment Separation:** Invoices represent the debt (Accounts Receivable) and tax obligations. Payments represent actual cash flow. They are separate entities.
- **Partial Payments & Remaining Balances:**
  - If Invoice Total = 100M and Payment = 40M, the system must track `amountPaid = 40M` and calculate `Remaining = 60M`.
- **Status Independence:** 
  - `Invoice Status` (e.g., DRAFT, ISSUED, CANCELLED) is distinct from `Payment Status` (e.g., UNPAID, PARTIAL, PAID).
  - An Invoice can be `ISSUED` but remain `UNPAID`.
- **Accounting Generation:** An `ISSUED` invoice generates an AR (Accounts Receivable) GL entry. A `Payment` generates a Cash GL entry to clear the AR.

### 2.1. Sales Orders & Order-to-Cash (O2C) Core Rules (Module M13)

**Lifecycle Pipeline:** `1. Ingestion (SO Created) ➔ 2. Pricing & Discounts (M41) ➔ 3. Credit Guard (M07) ➔ 4. Stock Reservation (M17 ATP) ➔ 5. WMS Fulfillment (M24) ➔ 6. Decree 123/2020 VAT Invoicing & Triple VAS GL (M30) ➔ 7. Payment Clearing & RMA Protection (M15)`

**Strict Domain Rules & Invariants:**
1. **Single-Writer Inventory Authority (M17 SSOT):**
   - Sales Orders NEVER directly modify `stock_balances` or `stock_ledger`.
   - **Reservation Stage:** Calls `InventoryService.postTransaction()` / `reserveStock()`: increments `stockReserved`, decrements `stockAvailable`, leaving `stockPhysical` unchanged until actual dispatch.
   - **Fulfillment Stage:** Calls `InventoryService.postTransaction()` with `deductReserved=true`: decrements both `stockPhysical` and `stockReserved` atomically, preserving available stock invariants.
   - **Cancellation Stage:** If an order has status `RESERVED`, cancellation automatically invokes `InventoryService.releaseReservation()` to restore `stockAvailable`.
2. **Customer Credit Limit & Exception Clearance Guard (M07 Integration):**
   - The system checks available credit limit (`creditLimit - currentDebt`) and checks for overdue invoices (>30 days).
   - Orders exceeding customer credit limits are automatically routed to `PENDING_APPROVAL` with `creditApprovalRequired=true`.
   - An authorized Credit Manager must approve the order (`POST /api/sales/orders/:id/approve`), transitioning status to `CONFIRMED` and automatically triggering stock reservation.
3. **Pricing & Promotional Discount Matrix (M41 SSOT):**
   - Base selling prices are resolved exclusively from `PricingEngine` (M41).
   - Tiered quantity breaks (e.g., Tier 1: 0-10 units @ 0%, Tier 2: 11-50 units @ 5%, Tier 3: >50 units @ 10%) are automatically calculated.
   - Promotional discount rules enforce minimum order thresholds and maximum discount percentage caps to prevent negative gross margins.
4. **Decree 123/2020/ND-CP & Circular 78/2021/TT-BTC Electronic Invoicing:**
   - Orders with confirmed fulfillment and legal customer profile can issue official VAT e-invoices.
   - Issuance triggers Cloud HSM digital signature validation, formats the electronic tax payload, generates the official Tax Authority Code (`Mã CQT`), and updates `vatStatus='ISSUED'`.
   - Generates bilingual Decree 123 compliant PDF with embedded QR verification code.
5. **Triple VAS General Ledger Accounting Postings (M30 Single-Writer):**
   - Upon VAT invoice issuance, the system automatically posts 3 balanced VAS journal entries via `AccountingService`:
     - **Revenue Recognition:** Debit 1311 (Phải thu khách hàng) / Credit 5111 (Doanh thu bán hàng).
     - **Output VAT Liability:** Debit 1311 (Phải thu khách hàng) / Credit 33311 (Thuế GTGT đầu ra).
     - **Cost of Goods Sold (COGS):** Debit 632 (Giá vốn hàng bán) / Credit 1561 (Hàng hóa), valued via M42 Costing Engine.
6. **Omnichannel M16 POS Sync & 1-Click Corporate VAT Conversion:**
   - Retail orders generated from M16 POS registers are ingested into M13 with `sourceModule='M16_POS'`.
   - Allows instant conversion into corporate VAT electronic invoices with corporate tax code, address, and legal buyer name.
7. **Immutable Document Protection & M15 RMA Delegation:**
   - **Direct Cancellation Prohibition:** Orders with `vatStatus='ISSUED'` or `status='INVOICED'` CANNOT be directly canceled or deleted.
   - **RMA Credit Note Workflow:** Any post-invoice returns, defect claims, or cancellations MUST be handled via Module M15 (RMA Dispositions) through an official Return Docket (`POST /api/sales/orders/:id/returns`) and VAT Credit Note adjustment, preserving legal auditability.
8. **Idempotency & Concurrent Stress Hardening:**
   - All state-changing endpoints enforce `X-Idempotency-Key` or body `idempotencyKey`. Replayed network requests return cached outcomes without duplicate order creation or double stock reservations.
   - Atomic reservation guards eliminate race conditions when multiple users compete for limited inventory stock.
9. **UI/UX Enterprise Standards (Rule #19 & Rule #20):**
   - Zero `window.confirm/alert/prompt`. All destructive, approval, or critical actions use `ConfirmDialog.tsx` with semantic risk levels (Danger for Cancel, Warning for Credit Override, Primary for Reserve/Fulfill).
   - All financial amounts, quantities, SKUs, and document codes formatted with `font-mono tabular-nums`.

## 3. Costing & COGS (Cost of Goods Sold)

**Workflow:** `Inventory Issue/Sales -> Central Costing Engine -> COGS Transaction`

**Rules:**
- **Centralized Engine:** ALL COGS calculations MUST go through the Central Costing Engine (`server/costingEngine.ts`). Do NOT write custom cost calculation logic in individual API endpoints.
- **Cost Layers:** Inbound inventory (via GR) creates `cost_layers`. Outbound inventory (via POS, SO, Goods Issue) consumes these layers to calculate the exact `totalCogs`.
- **Costing Method:** The system supports global costing methods (e.g., WEIGHTED_AVERAGE, FIFO) defined in `costing_settings`. The Costing Engine reads this setting to apply the correct math.

## 4. Accounting (Double-Entry General Ledger)

**Rules:**
- **Strict Double-Entry:** Every financial transaction MUST generate a balanced entry in `accounting_entries`. Total Debits MUST equal Total Credits.
- **Immutability:** Once an accounting entry is posted, it CANNOT be deleted. Mistakes must be corrected by posting a Reversal Entry (opposite debit/credit).

## 5. Inventory Control Architecture & 3-State Stock Invariants

**Core Architectural Pipeline:**
`Inventory Transaction -> Stock Ledger (Immutable Source of Truth) -> Stock Balance (Materialized View) -> Available Stock`

**Strict Invariants:**
1. **Source of Truth**:
   - `stock_ledger`: Immutable audit trail of physical movements. NEVER directly updated or deleted.
   - `stock_balances`: Materialized current state for ultra-fast querying. MUST ONLY be updated via `InventoryService.postTransaction()` or `ReservationEngine`.
   - `stock_reservations`: Active stock locks.
   - `InventoryService`: Single Write Path across all modules (P2P, O2C, Transfers, Adjustments).
2. **Three-State Inventory Model**:
   - `Physical Stock`: Real physical quantity in warehouse.
   - `Reserved Stock`: Locked quantity for open orders/transfers.
   - `Available Stock = Physical Stock - Reserved Stock`.
   - **Invariant:** `Available Stock >= 0` (unless explicit negative stock policy applies).
   - **Reservation Guard:** `requestedReservationQty <= availableQty`. Over-reservation is strictly rejected.
3. **Reservation Ledger Separation**:
   - Reservations modify `stock_reservations` and update `stockReserved`/`stockAvailable` in `stock_balances`.
   - Reservations **DO NOT** create physical entries in `stock_ledger` (Physical stock is unchanged until physical fulfillment/issue).
4. **Primary Inventory Dimension**:
   - Primary dimension is `(productId, warehouseId, locationId)`.
   - `balanceAfter` in `stock_ledger` MUST represent the exact stock level of that specific `(productId, warehouseId, locationId)` dimension context.
5. **Atomic Stock Transfers**:
   - Transfers between locations/warehouses MUST be processed atomically in a single DB transaction (`TRANSFER_OUT` + `TRANSFER_IN`) sharing `referenceNo` and `transactionGroupId`.
6. **Adjustments as Documents**:
   - Inventory adjustments MUST create an `Adjustment Document` and pass through `InventoryService.postTransaction()` (`ADJUSTMENT_IN` / `ADJUSTMENT_OUT`). Direct `UPDATE stock_balances` from UI/controllers is strictly forbidden.
7. **Controlled 3-Stage Audit & Reconcile**:
   - Stage 1: `Audit` (Read-Only discrepancy scanner).
   - Stage 2: `Recalculate` (View expected calculated values without mutating DB).
   - Stage 3: `Reconcile` (Requires `inventory:write`/`inventory:admin` permission, creates audit log before syncing balances).
8. **Lot & Serial Tracking Rules**:
   - Serial numbers MUST enforce:
     - New serial creation: Only if serial number doesn't exist.
     - Issue/Transfer: Serial must be `IN_STOCK` at the specific `(productId, warehouseId, locationId)`.
     - Serial cannot be moved or issued twice.

## 6. Stocktake & Inventory Counting Engine (Comprehensive Business Rules)

### 6.1. Stocktake Lifecycle State Machine
```
[DRAFT] ──(start)──> [COUNTING] ──(count)──> [COUNTED]
                           │                     │
                           │              (variance > threshold)
                           │                     ▼
                           │             [RECOUNT_REQUIRED]
                           │                     │
                           │                 (recount)
                           │                     ▼
                           └─────────────> [RECOUNTED]
                                                 │
                                         (submit approval)
                                                 ▼
                                        [PENDING_APPROVAL]
                                                 │
                                             (approve)
                                                 ▼
                                            [APPROVED]
                                                 │
                                             (complete)
                                                 ▼
                                            [COMPLETED] (Locked, Immutable)
```
- **`DRAFT`**: Phiếu mới tạo, cho phép thêm, sửa, xóa các mặt hàng, chọn kho và vị trí kiểm kê.
- **`COUNTING`**: Đã kích hoạt quá trình đếm, khóa cấu hình phiếu và tự động chụp snapshot tồn kho hệ thống tại thời điểm `started_at`.
- **`COUNTED`**: Đã hoàn thành nhập số liệu đếm lần 1 cho tất cả các mặt hàng; mức chênh lệch nằm trong ngưỡng dung sai cho phép.
- **`RECOUNT_REQUIRED`**: Tự động kích hoạt khi có ít nhất một mặt hàng có mức chênh lệch vượt ngưỡng dung sai (số lượng tuyệt đối hoặc tỷ lệ phần trăm).
- **`RECOUNTED`**: Đã hoàn thành các lượt đếm lại (Round 2, Round 3,...) cho các mặt hàng yêu cầu đếm lại.
- **`PENDING_APPROVAL`**: Phiếu kiểm kê và bảng tổng hợp chênh lệch đã được gửi trình cấp quản lý phê duyệt.
- **`APPROVED`**: Cấp quản lý đã phê duyệt kết quả kiểm kê và nguyên nhân chênh lệch.
- **`COMPLETED`**: Đã thực thi cân đối tồn kho thành công trong một giao dịch cơ sở dữ liệu nguyên tử (ACID transaction). Phiếu bị khóa vĩnh viễn (Immutable).
- **`CANCELLED`**: Hủy phiếu kiểm kê (chỉ hợp lệ khi phiếu chưa ở trạng thái `COMPLETED`).

---

### 6.2. Blind Count Rules (Quy Tắc Đếm Mù)
- **Mục tiêu**: Ngăn ngừa gian lận hoặc thiên kiến đếm bằng cách không để nhân viên kiểm đếm biết trước số lượng tồn trên phần mềm.
- **Quy tắc hiển thị Client/API**:
  - Khi `is_blind_count = true`:
    - API `GET /api/stocktakes/:id` và giao diện đếm bắt buộc phải ẩn các trường: `systemQuantity = null`, `difference = null`, `variancePercent = null` đối với người đếm (quyền `stocktake.count`).
    - Nhân viên kiểm đếm chỉ thấy danh mục sản phẩm, vị trí kho (Location), thông tin Lô/Serial và ô nhập `countedQuantity`.
  - Chỉ người dùng có thẩm quyền quản lý (`stocktake.approve` hoặc `stocktake.complete`) mới được quyền xem số lượng hệ thống và độ lệch khi xét duyệt.

---

### 6.3. Snapshot Rules (Quy Tắc Ảnh Chụp Tồn Kho)
- **Thời điểm chốt snapshot**: Được chụp duy nhất một lần tại khoảnh khắc phiếu chuyển từ `DRAFT` sang `COUNTING` (`POST /api/stocktakes/:id/start`).
- **Đa chiều tồn kho (Primary Dimension Context)**:
  - Tồn kho hệ thống (`systemQuantity`) bắt buộc phải được snapshot chính xác theo tổ hợp 5 chiều: `(productId, warehouseId, locationId, lotId, serialNumber)`.
- **Bất biến sau snapshot**:
  - Số liệu `systemQuantity` trong `stocktake_items` là số liệu cố định của thời điểm bắt đầu.
  - Các giao dịch nhập/xuất kho phát sinh sau thời điểm `started_at` không làm thay đổi giá trị `systemQuantity` trong phiếu kiểm kê.
  - Công thức tính chênh lệch kiểm kê:
    $$\text{difference} = \text{finalCountedQuantity} - \text{systemQuantity}$$

---

### 6.4. Variance & Tolerance Rules (Quy Tắc Chênh Lệch & Ngưỡng Dung Sai)
- **Ngưỡng dung sai hỗ trợ đồng thời 2 cấu hình**:
  - `varianceThreshold`: Ngưỡng chênh lệch số lượng tuyệt đối (ví dụ: $\pm 2$ sản phẩm).
  - `varianceThresholdPercent`: Ngưỡng chênh lệch theo tỷ lệ phần trăm (ví dụ: $\pm 5\%$).
- **Công thức tính tỷ lệ chênh lệch (%)**:
  $$\text{variancePercent} = \begin{cases} \left(\frac{|\text{difference}|}{\text{systemQuantity}}\right) \times 100\% & \text{khi } \text{systemQuantity} > 0 \\ 100\% & \text{khi } \text{systemQuantity} = 0 \text{ và } \text{finalCountedQuantity} > 0 \\ 0\% & \text{khi } \text{systemQuantity} = 0 \text{ và } \text{finalCountedQuantity} = 0 \end{cases}$$
- **Điều kiện kích hoạt đếm lại (`RECOUNT_REQUIRED`)**:
  Trạng thái chuyển sang `RECOUNT_REQUIRED` nếu:
  $$|\text{difference}| > \text{varianceThreshold} \quad \text{HOẶC} \quad \text{variancePercent} > \text{varianceThresholdPercent}$$

---

### 6.5. Recount Rules (Quy Tắc Đếm Lại Nhiều Vòng)
- **Lịch sử đếm đa vòng (`stocktake_counts`)**:
  - Mọi lượt đếm (Lần 1, Lần 2, Lần 3,...) đều được lưu thành một bản ghi riêng biệt trong bảng `stocktake_counts` với các trường: `stocktakeId`, `stocktakeItemId`, `countRound`, `countedQuantity`, `counterUserId`, `countedAt`, `notes`.
  - Tuyệt đối không xóa hoặc ghi đè kết quả đếm của các vòng trước đó.
- **Xác định số đếm cuối cùng**:
  - Trường `finalCountedQuantity` trên `stocktake_items` luôn đồng bộ với số đếm của vòng đếm mới nhất ($\max(\text{countRound})$).

---

### 6.6. Approval Rules (Quy Tắc Phê Duyệt)
- **Phân quyền**: Chỉ người dùng sở hữu quyền `stocktake.approve` mới có thể phê duyệt.
- **Điều kiện phê duyệt**: Phiếu phải ở trạng thái `COUNTED`, `RECOUNTED`, hoặc `PENDING_APPROVAL`.
- **Ghi vết phê duyệt**: Lưu trữ thông tin người duyệt (`approved_by`) và thời điểm duyệt (`approved_at`).

---

### 6.7. Complete & Balance Reconciliation Rules (Quy Tắc Hoàn Tất & Cân Đối Tồn Kho)
- **Phân quyền hoàn tất**: Yêu cầu quyền `stocktake.complete`.
- **Thực thi giao dịch nguyên tử (ACID Transaction)**:
  1. Khóa bản ghi phiếu kiểm kê để tránh xung đột xử lý đồng thời.
  2. Tạo tự động một chứng từ Phiếu điều chỉnh kho (`stock_adjustments`) với `sourceDocumentType = 'STOCKTAKE'` và `sourceDocumentId = stocktake.id`.
  3. Duyệt qua tất cả các mặt hàng có chênh lệch ($\text{difference} \neq 0$):
     - Gọi qua `InventoryService.postTransaction()` với loại giao dịch `ADJUSTMENT`.
     - Ghi sổ kho bất biến `stock_ledger` với `referenceNo` của phiếu kiểm kê.
     - Cập nhật số dư kho `stock_balances` theo đúng `(productId, warehouseId, locationId)`.
     - Cập nhật số dư lô `lot_balances` (nếu có Lot) và trạng thái Serial `serial_numbers` (nếu có Serial).
     - Tự động hạch toán kế toán chênh lệch tồn kho:
       - **Thừa tồn kho ($\text{difference} > 0$)**: Ghi `Nợ TK 156 / Có TK 711` (Thu nhập khác).
       - **Thiếu tồn kho ($\text{difference} < 0$)**: Ghi `Nợ TK 811 / Có TK 156` (Chi phí khác).
  4. Cập nhật trạng thái phiếu kiểm kê thành `COMPLETED`, lưu `completed_by`, `completed_at` và liên kết `adjustment_document_id`.
  5. Ghi nhật ký hoạt động hệ thống (`activity_logs`).

---

### 6.8. Stock Adjustment Generation Rules (Quy Tắc Tạo Phiếu Điều Chỉnh)
- Tuyệt đối cấm thao tác trực tiếp câu lệnh `UPDATE stock_balances` từ phía UI hay API mà không thông qua chứng từ điều chỉnh.
- Phiếu điều chỉnh được tạo tự động khi hoàn tất kiểm kê phải lưu trữ đầy đủ danh sách các mặt hàng chênh lệch với phân loại `INCREASE` (tăng tồn) hoặc `DECREASE` (giảm tồn), cùng số lượng chênh lệch thực tế.

---

### 6.9. Idempotency & Concurrency Rules (Quy Tắc Bất Biến & Chống Trùng Lặp)
- **Tính lũy đẳng (Idempotency Guarantee)**:
  - Khi API `POST /api/stocktakes/:id/complete` được gọi nhiều lần liên tiếp (do double-click hoặc retry mạng):
  - Hệ thống kiểm tra trạng thái hiện tại. Nếu phiếu đã ở trạng thái `COMPLETED`, hệ thống trả về kết quả thành công ngay lập tức cùng chứng từ điều chỉnh ban đầu, tuyệt đối không tạo thêm phiếu điều chỉnh mới, không ghi thêm dòng vào `stock_ledger`, và không trừ/cộng thêm số dư kho.
- **Rollback khi lỗi giao dịch (Failure Atomicity)**:
  - Nếu xảy ra lỗi cơ sở dữ liệu ở bất kỳ bước nào trong quá trình cân đối, toàn bộ thay đổi dữ liệu sẽ được rollback hoàn toàn; trạng thái phiếu kiểm kê không được chuyển sang `COMPLETED`.

---

### 6.10. RBAC Granular Permissions (Phân Quyền Chi Tiết)
- `stocktake.view`: Quyền tra cứu danh sách và xem chi tiết phiếu kiểm kê.
- `stocktake.create`: Quyền tạo mới phiếu kiểm kê ở trạng thái `DRAFT`.
- `stocktake.edit`: Quyền chỉnh sửa danh mục hàng hóa trong phiếu `DRAFT`.
- `stocktake.start`: Quyền bắt đầu kiểm kê và kích hoạt chụp snapshot.
- `stocktake.count`: Quyền nhập số đếm thực tế (hỗ trợ chế độ Blind Count).
- `stocktake.approve`: Quyền xét duyệt kết quả kiểm kê và chênh lệch kho.
- `stocktake.complete`: Quyền hoàn tất kiểm kê, kích hoạt tạo chứng từ điều chỉnh và cân bằng tồn kho.
- `stocktake.cancel`: Quyền hủy phiếu kiểm kê chưa hoàn tất.

---

### 6.11. Serial & Lot Tracking Rules (Quy Tắc Quản Lý Serial & Lô Hàng)
- **Quản lý theo Lô (Lot/Batch Tracking)**:
  - Kiểm kê và ghi nhận chênh lệch riêng biệt theo từng `lotId`.
  - Cân đối kho điều chỉnh số lượng tồn chính xác trên bảng `lot_balances` cho từng lô tương ứng.
- **Quản lý theo Mã Serial (Serial Number Tracking)**:
  - Kiểm kê theo từng mã Serial riêng lẻ.
  - Nếu mã Serial thực tế không có trong kho (thiếu): Chuyển trạng thái Serial sang `LOST` hoặc `OUT_OF_STOCK`.
  - Nếu phát hiện Serial thực tế thừa chưa có trong kho: Đăng ký mã Serial và chuyển trạng thái sang `IN_STOCK` tại đúng vị trí kho kiểm kê.

---

### 6.12. Audit & Traceability Rules (Quy Tắc Kiểm Toán & Truy Vết)
- Toàn bộ các thao tác `CREATE`, `START`, `COUNT`, `RECOUNT`, `APPROVE`, `COMPLETE`, `CANCEL` đều được ghi vết vào bảng `activity_logs` và `audit_logs` kèm `userId`, `action`, `entityId`, `timestamp`, `oldValues`, và `newValues`.
- Duy trì mối liên kết truy vết 2 chiều:
  $$\text{Phiếu Kiểm Kê (stocktakes)} \iff \text{Phiếu Điều Chỉnh (stock_adjustments)} \iff \text{Sổ Kho (stock_ledger.referenceNo)}$$

---

## 7. Standard UI/UX Architecture & Layout Rules (Quy Chuẩn UI/UX Tất Cả Module ERP)

Tất cả các module/trang trong hệ thống Modular ERP bắt buộc phải tuân thủ chuẩn thiết kế UI/UX đồng nhất sau đây:

1. **Không sử dụng Modal/Alert mặc định của Trình duyệt**:
   - Nghiêm cấm dùng `window.confirm()`, `window.alert()`, `window.prompt()`.
   - Sử dụng custom React state overlays, React Dialog, hoặc thông báo trạng thái `actionError`/`actionSuccess` trực tiếp trên UI.

2. **Thanh Header & Thao Tác Nhanh (Module Header & Top Actions)**:
   - Tiêu đề module + Đếm số lượng bản ghi / trạng thái thời gian thực (Live Badge Count).
   - Nhóm nút thao tác chính: `+ Tạo chứng từ mới`, `Xuất File (Excel/CSV)`, `In Chứng Từ Mẫu Chuẩn`, `Chỉ Dẫn Nghiệp Vụ (Business Guidance)` & `Hợp Đồng Nghiệp Vụ (Module Contract)`.

3. **Bộ Lọc Nâng Cao Đa Tầng (Multi-tier Filter Bar)**:
   - Ô tìm kiếm thông minh (Mã SKU, Mã chứng từ, Tên, Mã lô) với debounce tìm kiếm tức thì.
   - Các bộ lọc dropdown chính: Kho hàng, Vị trí, Trạng thái chứng từ, Phân loại/Profile.
   - Accordion lọc nâng cao: Khoảng thời gian (Từ ngày -> Đến ngày), Hướng sắp xếp (A-Z, Mới nhất - Cũ nhất).

4. **Thanh Chỉ Số KPI Động (Dynamic Metric Cards Bar)**:
   - Thẻ tóm tắt 3 - 5 chỉ số quan trọng phía trên bảng dữ liệu (Ví dụ: Tổng số lượng, Tồn vật lý, Hàng giữ chỗ, Cần duyệt, Cảnh báo tồn/chênh lệch).

5. **Cấu Trúc Tab Điều Hướng Đa Chức Năng (Multi-Tab Navigation)**:
   - Chia màn hình module thành các tab nghiệp vụ rõ ràng (Ví dụ: `Danh Sách Chính`, `Thẻ Kho Liên Quan`, `Giữ Hàng / Phân Bổ`, `Cấu Hình / Profile`, `Đối Soát & Kiểm Toán`).

6. **Bảng Dữ Liệu Đồng Nhất & Phân Trang (`TablePagination`)**:
   - Hỗ trợ checkbox chọn tất cả và chọn từng dòng.
   - Định dạng phông chữ Monospace cho các mã chứng từ, mã SKU, số lượng, số tiền.
   - Tích hợp component `TablePagination` với tùy chọn hiển thị `[10, 15, 25, 50, 100]` bản ghi/trang, tự động quay về Trang 1 khi đổi bộ lọc/tìm kiếm.

7. **Thanh Thao Tác Hàng Loạt Nổi (Floating Bulk Action Bar)**:
   - Xuất hiện tự động khi người dùng tích chọn 1 hoặc nhiều Checkbox dòng.
   - Cung cấp nút thao tác hàng loạt: Duyệt hàng loạt, In phiếu hàng loạt, Xuất Excel hàng loạt, Đổi trạng thái.

8. **Drawer Chi Tiết Dạng Slide-Over (Right-side Panel)**:
   - Panel xem chi tiết trượt từ lề phải sang, chứa các Tab: Tổng quan, Chi tiết dòng hàng, Sổ cái Thẻ kho liên quan, Bút toán Kế toán GL, Nhật ký kiểm toán audit.
   - Tích hợp nút 1-click sao chép mã chứng từ / mã SKU.

9. **Menu Thao Tác Nhanh Cho Từng Dòng (`⋮` Context Menu)**:
   - Cung cấp menu thao tác nhanh: Xem chi tiết, In phiếu mẫu chuẩn, Xem thẻ kho SKU, Sửa bản nháp, Duyệt/Hủy.

10. **Modal In Chứng Từ Chuẩn (Official Print Voucher)**:
    - Formats giao diện in A4 chuẩn Bộ Tài chính (Mẫu 02-VT, S12-DNN, PXK, PNK) với logo/thông tin doanh nghiệp, bảng chi tiết, tổng tiền và các ô ký tên.

---

## 8. Stock Adjustment Engine (Hợp Đồng Nghiệp Vụ & Execution Protocol Khoá Chuẩn)

Module Điều Chỉnh Kho là một **Inventory Transaction Module** vận hành trực tiếp trên hạ tầng `Inventory Core`. Để đảm bảo tính toàn vẹn hệ thống và chống phá vỡ kiến trúc, module tuân thủ 15 quy tắc ràng buộc tuyệt đối sau:

### 8.1. Luồng Nghiệp Vụ & Trạng Thái Chứng Từ (Document Lifecycle)
- Luồng trạng thái chính: `DRAFT` ➔ `APPROVED` (Trạng thái `APPROVED` đồng nghĩa đã hạch toán thành công vào Sổ cái Tồn kho & Kế toán).
- Trạng thái hủy: `REJECTED` (Trạng thái kết thúc, phiếu bị khóa vĩnh viễn).
- **Nghiêm cấm ghi đè trực tiếp `stock_balances`**: Mọi điều chỉnh kho bắt buộc phải sinh chứng từ điều chỉnh (`stock_adjustments`) và đi qua single write path `InventoryService.postTransaction()`.

### 8.2. Ràng Buộc Transactional & Idempotency Cho Endpoint `/approve`
- Endpoint `POST /api/stock-adjustments/:id/approve` phải đảm bảo tính **Atomic Transaction** (Tất cả hoặc Không gì cả) và **Idempotent** (Không tạo trùng lặp giao dịch khi retry/double-click).
- **Quy tắc Idempotency**:
  - Phiếu chỉ được hạch toán khi `status = DRAFT`.
  - Nếu trạng thái phiếu đã là `APPROVED` ➔ Trả về kết quả đã hạch toán thành công, **tuyệt đối không post giao dịch lần thứ 2**.
  - Nếu `status = REJECTED` ➔ Từ chối phê duyệt.
  - Mọi bản ghi `stock_ledger` phải tham chiếu duy nhất tới `adjustmentId` (Unique constraint).
  - Bút toán kế toán (`accounting_entries`) phải mang mã tham chiếu nghiệp vụ duy nhất.
  - Việc cập nhật Serial/Lot phải nằm trong cùng một Database Transaction với `stock_ledger`.

### 8.3. Ràng Buộc Kiểm Tra Tồn Kho Khả Dụng (`availableQuantity`)
- Đối với điều chỉnh giảm (`direction = DECREASE`), hệ thống không được chỉ kiểm tra `adjustmentQty <= physicalQuantity`, mà **bắt buộc kiểm tra**:
  $$\text{adjustmentQty} \le \text{availableQuantity} \quad (\text{với } \text{availableQuantity} = \text{physicalQuantity} - \text{reservedQuantity})$$
- Ngăn chặn triệt để trường hợp xuất/điều chỉnh giảm số lượng hàng hóa đang được giữ chỗ (Reserved) cho các Đơn bán hàng (SO) hoặc Lệnh chuyển kho (Transfer) chưa hoàn tất.

### 8.4. Kiểm Soát Serial Theo Kích Thước Kho & Vị Trí (`Warehouse + Location`)
- Khi điều chỉnh giảm các mặt hàng quản lý theo Serial, không chỉ kiểm tra `serial.status = IN_STOCK`, mà bắt buộc xác minh đủ 4 chiều không gian:
  $$\text{serial.productId} + \text{serial.warehouseId} + \text{serial.locationId} + \text{serial.status = IN_STOCK}$$
- Serial thuộc Vị trí / Kho A-01 không được phép dùng để hạch toán xuất điều chỉnh tại Vị trí / Kho B-02.

### 8.5. Quản Lý Lô & Hạn Sử Dụng (Lot & Expiry Tracking)
- Đối với sản phẩm bắt buộc quản lý Lô (`isLotTracked = true`), điều chỉnh giảm phải xác định chính xác `lotId` / `lotNumber` bị giảm.
- Ràng buộc: $\text{adjustmentQty} \le \text{lot.availableQuantity}$.

### 8.6. Snapshots Tồn Kho Không Phải Là Nguồn Sự Thật (Snapshot vs Single Source of Truth)
- Bảng `stock_adjustment_items` lưu 2 trường `currentStockSnapshot` và `newStockSnapshot` chỉ với mục đích **Audit / Historical Snapshot**.
- Khi Approve, backend **bắt buộc đọc lại dữ liệu tồn kho thực tế** từ `stock_balances` / `stock_ledger` tại thời điểm commit transaction. Tuyệt đối không tin tưởng giá trị `currentStock` do Client/UI gửi lên.

### 8.7. Phân Định Không Gian Kho & Vị Trí Cụ Thể (`warehouseId` & `locationId`)
- Header phiếu `stock_adjustments` quản lý `warehouseId`.
- Chi tiết từng dòng `stock_adjustment_items` hỗ trợ `locationId` (Vị trí ô kệ cụ thể trong kho) để phục vụ mô hình WMS đa vị trí.

### 8.8. Tách Biệt Nguyên Nhân (`adjustmentType`) và Hướng Biến Động (`direction`)
- Tách bạch rõ ràng giữa Loại/Nguyên nhân nghiệp vụ (`adjustmentType`) và Hướng biến động tồn kho (`direction`):
  - `adjustmentType`: `DAMAGE`, `SCRAP`, `EXPIRED`, `LOSS`, `FOUND`, `STOCKTAKE_VARIANCE`, `MANUAL`.
  - `direction`: `INCREASE` (Tăng) / `DECREASE` (Giảm).

### 8.9. Truy Vết Mã Chứng Từ Nguồn (`sourceType` & `sourceId`)
- Phiếu điều chỉnh sinh ra từ các nghiệp vụ khác (như Kiểm kê kho) bắt buộc lưu vết chứng từ nguồn:
  - Ví dụ: `type = STOCKTAKE_VARIANCE`, `sourceType = STOCKTAKE`, `sourceId = ST-2026-00025`.
  - Thiết lập chuỗi truy vết 2 chiều: **Kiểm kê ➔ Chênh lệch ➔ Điều chỉnh kho ➔ Sổ cái Kho (Stock Ledger) ➔ Định khoản Kế toán (GL)**.

### 8.10. Định Khoản Kế Toán Động Theo Loại Nghiệp Vụ (Dynamic GL Mapping)
- Hạch toán Kế toán Kép không được hard-code tài khoản cố định, mà phải tự động ánh xạ theo loại điều chỉnh (`adjustmentType`):
  - `FOUND + INCREASE`: Nợ TK Kho (152/156) / Có TK Thu nhập khác / Cân đối kiểm kê (711/1388).
  - `LOSS + DECREASE`: Nợ TK Chi phí tổn thất (632/811) / Có TK Kho (152/156).
  - `DAMAGE + DECREASE`: Nợ TK Chi phí hàng hư hỏng (632/811) / Có TK Kho (152/156).
  - `EXPIRED + DECREASE`: Nợ TK Chi phí hàng hết hạn (632/811) / Có TK Kho (152/156).
  - `STOCKTAKE_VARIANCE`: Nợ/Có TK Chênh lệch kiểm kê kho (1388/3388/632).

### 8.11. Cấu Trúc Database Audit Đầy Đủ
- **Bảng Header `stock_adjustments`**:
  `id`, `code`, `warehouseId`, `adjustmentType`, `direction`, `reasonCode`, `reason`, `sourceType`, `sourceId`, `status` (`DRAFT`/`APPROVED`/`REJECTED`), `notes`, `createdBy`, `approvedBy`, `rejectedBy`, `rejectionReason`, `createdAt`, `approvedAt`, `rejectedAt`, `postedAt`.
- **Bảng Items `stock_adjustment_items`**:
  `id`, `adjustmentId`, `productId`, `locationId`, `lotId`, `direction`, `quantity`, `unitCost`, `totalCost`, `currentStockSnapshot`, `newStockSnapshot`, `notes`.
- **Bảng Serials `stock_adjustment_serials`**:
  `id`, `adjustmentItemId`, `serialId`, `serialNumber`.

### 8.12. Hợp Đồng API Cố Định (Strict API Contract)
- `GET /api/stock-adjustments`: Danh sách phiếu điều chỉnh.
- `GET /api/stock-adjustments/:id`: Chi tiết 1 phiếu điều chỉnh.
- `POST /api/stock-adjustments`: Tạo phiếu điều chỉnh mới (luôn khởi tạo ở dạng `DRAFT`).
- `POST /api/stock-adjustments/:id/approve`: Hạch toán kho & kế toán (Write Path duy nhất).
- `POST /api/stock-adjustments/:id/reject`: Từ chối phiếu nháp.
- **Nghiêm cấm tạo các endpoint dạng `PUT /api/stock-balances` hoặc `POST /api/stock-balances/update`**.

### 8.13. Thiết Kế UI/UX Dạng Workflow & Slide-over Drawer
- Giao diện danh sách dạng Standard Grid + KPI Metrics Header.
- Click 1 dòng ➔ Mở **Detail Drawer (Right-side Panel)** phân tab: Thông tin phiếu ➔ Danh sách sản phẩm ➔ Lot/Serial ➔ Biến động Tồn kho ➔ Giá vốn / Định khoản Kế toán ➔ Audit Trail.
- Nút bấm `[Phê duyệt]` và `[Từ chối]` tích hợp trực tiếp trong Drawer với chế độ phản hồi trạng thái tức thì.

### 8.14. Quy Trình Phê Duyệt Phản Ứng Chuỗi (Atomic Transaction Sequence)
Khi người dùng bấm **Phê duyệt**, Backend thực thi tuần tự trong 1 DB Transaction duy nhất:
```text
BEGIN TRANSACTION
 1. Lock record `stock_adjustments`
 2. Verify status == 'DRAFT'
 3. Verify user RBAC permissions (`stock_adjustment.approve`)
 4. Reload actual stock balances from DB
 5. Validate available quantity (`adjustmentQty <= availableQuantity`)
 6. Validate Location & Warehouse consistency
 7. Validate Lot availability & Expiry
 8. Validate Serial Number availability at location
 9. Resolve Unit Cost via Costing Engine
10. Post Stock Ledger entries (via InventoryService)
11. Update Materialized Stock Balances
12. Update Serial / Lot status
13. Create Balanced Double-Entry Accounting Entries
14. Mark Adjustment status = 'APPROVED'
15. Record approvedBy, approvedAt, postedAt
COMMIT TRANSACTION
```
*Lưu ý: Nếu bất kỳ bước nào thất bại, hệ thống `ROLLBACK` toàn bộ transaction.*

### 8.15. Bộ Suite Integration Tests Bắt Buộc Cần Verify
1. **Core Workflow**: Tạo phiếu IN/OUT ➔ Chỉnh sửa DRAFT ➔ Approve DRAFT ➔ Reject DRAFT ➔ Khóa không cho chỉnh sửa phiếu `APPROVED`/`REJECTED`.
2. **Stock & Location Integrity**: Ngăn chặn điều chỉnh giảm vượt `availableQuantity`, kiểm tra khớp `warehouseId` + `locationId`, ngăn chặn race condition khi 2 người cùng approve.
3. **Serial Integrity**: Kích hoạt Serial `IN_STOCK` khi điều chỉnh tăng, đưa Serial về `ISSUED`/`SCRAPPED` khi điều chỉnh giảm, từ chối Serial không đúng vị trí kho.
4. **Lot Integrity**: Ràng buộc đúng `lotId`, hạn sử dụng và số lượng tồn lô.
5. **Accounting Consistency**: Kiểm tra cân bằng Tổng Nợ = Tổng Có, khớp đúng tài khoản hạch toán theo `adjustmentType`.
6. **Idempotency Test**: Gọi API `/approve` đồng thời 3 lần liên tiếp ➔ Hệ thống chỉ sinh duy nhất 1 bản ghi `stock_ledger`, 1 bộ `accounting_entries`, 1 lần cập nhật số dư kho.

### 8.16. 4 Technical Invariants Khóa Chuẩn (Frozen Technical Invariants)
- **A. Immutability của Chứng từ Đã Khóa (APPROVED / REJECTED = READ ONLY)**:
  - Phiếu ở trạng thái `DRAFT` được phép sửa/duyệt/từ chối.
  - Phiếu ở trạng thái `APPROVED` hoặc `REJECTED` chuyển hoàn toàn sang **READ ONLY**. Tuyệt đối không cho phép mutation, edit hay delete. Nếu muốn điều chỉnh sai sót, người dùng phải lập một **Adjustment mới**.
- **B. Unique Business Reference (Khóa Trùng Lặp Cấp Database)**:
  - Đảm bảo uniqueness constraint trên database cho các mối quan hệ hạch toán: `stock_ledger.adjustmentId` (UNIQUE) và `accounting_entries.adjustmentId` (UNIQUE) hoặc một `postingReference` duy nhất dùng chung.
- **C. Backend Is Authority - Không Tin Dữ Liệu Tính Toán Từ Frontend**:
  - Frontend chỉ gửi: `quantity`, `productId`, `locationId`, `lotId`, `serialIds`.
  - Backend **tự tính toán và xác định toàn bộ**: `currentStock`, `availableQuantity`, `unitCost`, `totalCost`, `newStock`, và tài khoản hạch toán Kế toán GL.
- **D. Xử Lý Đồng Thời Bắt Buộc Được Verification (Concurrent Approval Test)**:
  - Test case 2 request đồng thời từ 2 client cùng bấm Approve phiếu: `Request A` và `Request B` chạy song song ➔ Bắt buộc 1 Request `SUCCESS` và 1 Request `ALREADY_PROCESSED` (Idempotent response), đảm bảo hệ thống chỉ sinh đúng 1 bản ghi `stock_ledger`, 1 bộ `accounting_entries`, 1 lần đổi trạng thái tồn kho.

### 8.17. Trình Tự Triển Khai Chuẩn (12-Phase Implementation Pipeline)
1. **PHASE 1**: Database Schema (`stock_adjustments`, `stock_adjustment_items`, `stock_adjustment_serials` + constraints).
2. **PHASE 2**: Domain Types / Constants / Enums (`adjustmentType`, `direction`, `status`).
3. **PHASE 3**: `StockAdjustmentService` (Core business domain service).
4. **PHASE 4**: Tích hợp `InventoryService` (Single write path `postTransaction()`).
5. **PHASE 5**: Tích hợp `CostingEngine` (Xác định giá vốn dòng điều chỉnh).
6. **PHASE 6**: Tích hợp `AccountingService` (Dynamic GL posting).
7. **PHASE 7**: Tích hợp `SerialService` & Lot Management.
8. **PHASE 8**: API Endpoints Backend (`/api/stock-adjustments` CRUD & `/approve`, `/reject`).
9. **PHASE 9**: Integration Tests (Test API, Stock Guard, Idempotency, Concurrency).
10. **PHASE 10**: UI Component (`StandardModuleLayout`, Modal Create, Detail Drawer).
11. **PHASE 11**: End-to-End Tests (E2E full flow verification).
12. **PHASE 12**: Cập nhật tài liệu `/docs/AI/BUSINESS_RULES.md` & `/docs/AI/CHANGE_LOG.md`.

### 8.18. Tiêu Chuẩn Hoàn Thành (Definition of Done - DoD)
- `[✓]` DB Migration & Schema Sync thành công (Không phá schema Inventory Core hiện tại).
- `[✓]` DRAFT CRUD hoạt động đúng phân quyền RBAC.
- `[✓]` Approve Atomic, Idempotent & An toàn khi gọi concurrent (Xử lý đồng thời).
- `[✓]` `stock_ledger` bất biến & `stock_balances` cập nhật đúng qua `InventoryService`.
- `[✓]` `availableQuantity` được bảo vệ (`adjustmentQty <= availableQuantity`).
- `[✓]` Validation chính xác 4 chiều `Product + Warehouse + Location + Status`.
- `[✓]` Lot & Serial Validation chính xác theo vị trí kho.
- `[✓]` Tính giá vốn Costing chuẩn & Định khoản Kế toán Cân bằng (Nợ = Có) theo Dynamic GL Mapping.
- `[✓]` Trạng thái `APPROVED` & `REJECTED` khóa chứng từ thành READ ONLY vĩnh viễn.
- `[✓]` Integration Tests & E2E Tests PASS 100%.
- `[✓]` Audit Trail lưu vết đầy đủ trong `audit_logs` / `activity_logs`.
- `[✓]` Đồng bộ tài liệu `/docs/AI/BUSINESS_RULES.md` & `/docs/AI/CHANGE_LOG.md`.

### 8.19. Mô Hình Kiểm Soát Không Gian Tồn Kho Linh Hoạt (Adaptive Inventory Dimension Model)
Hệ thống áp dụng mô hình kiểm soát tối đa 5 chiều không gian (`Product + Warehouse + Location + Lot + Serial`), tuy nhiên số lượng chiều bắt buộc được cấu hình động theo thuộc tính của từng Sản Phẩm (`Product Configuration`):
```text
Product
 ├── Warehouse          [BẮT BUỘC KHÔNG THỂ THIẾU]
 ├── Location           [BẮT BUỘC NẾU WMS BẬT LOCATION]
 ├── Lot                [BẮT BUỘC NẾU isLotTracked == true]
 └── Serial             [BẮT BUỘC NẾU isSerialTracked == true]
```
- **Sản phẩm tiêu chuẩn**: `Product + Warehouse + Location`
- **Sản phẩm quản lý Lô**: `Product + Warehouse + Location + Lot`
- **Sản phẩm quản lý Serial**: `Product + Warehouse + Location + Serial`
- **Sản phẩm vừa có Lô vừa có Serial**: `Product + Warehouse + Location + Lot + Serial`
*Quy tắc này giúp tránh sinh dữ liệu Lot/Serial giả và đảm bảo DB schema gọn nhẹ, chính xác theo thuộc tính thực tế.*

### 8.21. Quy Tắc Nghiệp Vụ Hoa Hồng & Quyết Toán Bán Hàng (M14 Sales Commission Engine)
1. **Thẩm Quyền Đơn Nhất & Tích Hợp Đa Module (Domain Authorities & Non-Authority Protection)**:
   - **M14 Không Phải Single-Writer**: M14 là module điều phối (Orchestration Engine). M14 KHÔNG được trực tiếp ghi vào bảng tồn kho (`stock_ledger`), sổ cái kế toán (`accounting_entries`), bảng lương (`payrolls`), giá vốn (`cost_layers`), hoặc chứng từ trả hàng (`rma_requests`).
   - **Đọc Giá Vốn Thật Từ M42 (COGS Authority SSOT)**: Mọi phép tính hoa hồng theo Lợi nhuận gộp (Gross Margin) BẮT BUỘC phải đọc giá vốn thực tế từ `cogs_transactions` (hoặc `cost_layers`) do M42 Costing Engine sở hữu. CẤM tự ý ước lượng, hardcode hoặc tự nhân giá vốn giả định trong M14.
   - **Ủy Quyền Kế Toán Cho M30 (Accounting SSOT)**: Toàn bộ bút toán trích trước chi phí hoa hồng và chi trả BẮT BUỘC thực hiện qua `AccountingEngine.postJournal()` (M30).
   - **Ủy Quyền Trả Hàng Cho M15 (Returns SSOT)**: Dữ liệu thu hồi hoa hồng (Clawback) lấy từ `rma_requests` (M15) qua EventBus `returns.rma.completed`.
   - **Ủy Quyền Chi Lương Cho M28 (Payroll SSOT)**: Khi chọn phương thức chi trả qua kỳ lương (`PAYROLL_INTEGRATION`), M14 ủy quyền ghi nhận vào bảng lương M28 và hạch toán Nợ 3388 / Có 3341.

2. **Cơ Chế Tính Toán Theo Doanh Thu & Lợi Nhuận Gộp (Revenue & Gross Margin Basis)**:
   - **Doanh thu (Revenue Basis)**: `Hoa hồng = (Doanh số * Tỷ lệ % + Định mức cố định) * Hệ số Accelerator`.
   - **Lợi nhuận gộp (Gross Margin Basis)**: `Gross Margin = Doanh thu - Giá vốn M42`. `Hoa hồng = (Gross Margin * Tỷ lệ % + Định mức) * Hệ số Accelerator`.
   - **Bậc thang (Tiered Rules)**: Tỷ lệ % và thưởng áp dụng theo ma trận lũy kế hoặc ngưỡng giá trị đơn hàng trong `commission_rules`.

3. **Phân Bổ Hoa Hồng Phân Cấp & Đội Ngũ (Split Commission & Hierarchy Overrides)**:
   - Tự động truy vấn cây phân cấp tổ chức từ M28 HR Management (`employees.manager_id`, `departments.manager_employee_id`).
   - Phân bổ theo tỷ lệ chuẩn: Nhân viên kinh doanh trực tiếp hưởng **75%**, Trưởng nhóm / Quản lý bán hàng hưởng **15%**, Presales / Chuyên gia giải pháp hưởng **10%**.

4. **Thưởng Vượt Quota & Hệ Số Accelerator (KPI Attainment Engine)**:
   - Khi tỷ lệ hoàn thành KPI Quota trong kỳ đạt `>= 100%`, hệ số tăng tốc `acceleratorMultiplier` (1.2x - 1.5x) tự động áp dụng để khuyến khích bán hàng vượt mục tiêu.

5. **Khấu Trừ Thu Hồi Hoa Hồng Do Trả Hàng (Return Clawback Invariant)**:
   - Khi phát sinh đơn trả hàng RMA hoàn tất từ M15, hệ thống tự động sinh bản ghi hoa hồng âm (`isClawback = true`).
   - Khoản Clawback được tự động trừ lùi vào đợt quyết toán kế tiếp của NVKD và quản lý liên quan, bảo toàn ngân sách doanh nghiệp.

6. **Xử Lý Khiếu Nại & Bút Toán Điều Chỉnh (Dispute & Adjustment Workflow)**:
   - NVKD có thể gửi khiếu nại kèm số tiền chênh lệch và bằng chứng.
   - Khi Quản lý phê duyệt `RESOLVED_ADJUSTED`, hệ thống tự động phát hành bản ghi `commission_calculations` loại `DISPUTE_ADJUSTMENT` để bù/trừ số tiền chênh lệch vào đợt quyết toán gần nhất.

7. **Chuẩn Mực Hạch Toán Kế Toán Kép VAS (Double-Entry VAS Integration)**:
   - **Phê duyệt Đợt quyết toán (Accrual)**: Tự động ghi nhận trích trước chi phí: **Nợ TK 6418 (Chi phí bán hàng) / Có TK 3388 (Phải trả khác - Hoa hồng)**.
   - **Chi trả trực tiếp (Payment/Treasury)**: Ghi nhận thanh toán: **Nợ TK 3388 / Có TK 1121 (Ngân hàng) hoặc TK 1111 (Tiền mặt)**.
   - **Chi trả qua Bảng lương (Payroll Transfer)**: Ghi nhận kết chuyển lương: **Nợ TK 3388 / Có TK 3341 (Phải trả người lao động)**.
   - Chuyển trạng thái toàn bộ chứng từ `commission_calculations` trong đợt sang `SETTLED`.

8. **Cơ Chế Bảo Vệ Bất Thường & Tamper-Proof Audit (Anomaly Guard & M02 Audit Trail)**:
   - Tự động phát hiện và cảnh báo các giao dịch có tỷ lệ hoa hồng bất thường (>20%) hoặc đơn hàng có biên lợi nhuận thấp (<5%).
   - Mọi giao dịch tính toán, phân bổ, khấu trừ và quyết toán đều được ghi vết bất biến vào `audit_logs` (M02) kèm chữ ký số SHA-256. Chứng từ quyết toán được lưu trữ vĩnh viễn vào kho lưu trữ M29 DMS Vault.

## 9. WMS Extended Rules (M24: Wave Picking, LPN, Dock Scheduling)

### 9.1. Non-Single-Writer Rule & Inventory Integration (M17 Authority)
- **Single-Writer Protection**: M24 (WMS Extended) is NOT a single-writer authority for stock balances or physical ledgers.
- All physical picking confirmations (`/api/wms/wave-picks/:id/confirm`) and LPN bulk putaway/movements (`/api/wms/lpn/move`) MUST route strictly through `InventoryService.postTransaction()` (M17).
- Direct SQL mutation (`UPDATE stock_balances` or direct insert into `stock_ledger`) from WMS controllers or UI is strictly forbidden.
- **Idempotency Execution**: Every state-mutating WMS extended action (like Wave Confirm or LPN Move) MUST submit and enforce a unique `idempotencyKey` to prevent double-writes and race conditions, honoring the architecture's concurrent ledger guards.

### 9.2. LPN (License Plate Number) Palletization & Atomic Movements
- **Pallet/LPN Integrity**: An LPN bundles items across SKU, Lot, and Serial dimensions.
- **Atomic Stock Transfer**: Moving an LPN from one bin/location to another must comply with Invariant 5.5 (`TRANSFER_OUT` + `TRANSFER_IN` with shared `referenceNo` and `transactionGroupId` within an atomic transaction).
- **Split & Merge Traceability**: Whenever an LPN is split or merged, genealogy must be preserved via `SerialEngine` (`GET /api/serial/trace`) to prevent breaking the Lot/Serial provenance tree.
- **Immutability of Closed Waves & Shipped LPNs**: Once an LPN is marked `SHIPPED` or a Wave is `CLOSED`, it becomes read-only. Physical variances must be resolved via M20 Stock Adjustment documents.

### 9.3. Dock Scheduling & Capacity Guards
- **Capacity Verification**: Before booking a dock appointment (`POST /api/wms/docks`), the system must verify dock bay and warehouse staging zone limits via M06 Zone Capacity Rules (`PUT /api/warehouses/capacity`). No standalone capacity tables are allowed.
- **Auto-Link Execution**:
  - Inbound Dock Check-in links directly to Goods Receipt (`POST /api/inventory/receipts` in M08/M17).
  - Outbound Dock Check-in links to Pick-Pack-Ship (`POST /api/sales/shipments` in M21/M13).
- **Idle Dock SLA Alert**: Dock idle time tracking follows the SLA state machine pattern defined in M36 Service Desk (`GET /api/service-desk/sla`).

### 9.4. Centralized Audit Trail (M02 Compliance)
- All lifecycle events (`CREATE_WAVE`, `ASSIGN_PICKER`, `CONFIRM_PICK`, `CLOSE_WAVE`, `PACK_LPN`, `MOVE_LPN`, `DOCK_CHECKIN`, `DOCK_CHECKOUT`) must be forwarded to `AuditService.recordAuditLog()` (M02). Standalone audit log tables are forbidden.

## 10. Quality Control & Quarantine Management Rules (M39 QMS)

### 10.1. Inspection Plans & AQL Sampling Invariants
- **Inspection Categories**: M39 supports IQC (Incoming Quality Control), PQC (In-Process Quality Control), and OQC (Outgoing Quality Control).
- **ISO 2859-1 AQL Integration**: Sampling sizes (`sampleQuantity`) must be automatically calculated based on lot lot-sizes using standard AQL Level II tables (e.g. Normal Inspection, Tightened Inspection, Reduced Inspection).
- **Automated Pass/Fail Evaluation**: Technical criteria checks (`qcInspectionResults`) compare measured values against `minLimit`, `maxLimit`, and `nominalValue`. Any failure exceeding allowable defect limits (`maxAllowableDefects`) automatically flags the inspection as `FAIL`.

### 10.2. Quarantine Isolation & Inventory Authority (M17 SSOT)
- **Automatic Quarantine Hold**: When an IQC inspection is triggered upon Goods Receipt (M08 P2P), received stock is immediately placed into quarantine storage via `InventoryService.holdInQuarantine()` or specialized inventory transaction types (`QUARANTINE_HOLD`).
- **Single-Writer Enforcement**: M39 QMS does NOT directly mutate physical stock balances. All stock release (`QUARANTINE_RELEASE`), scrap/rejection (`QUARANTINE_REJECT`), or return-to-vendor actions must route through `InventoryService.postTransaction()` (M17 SSOT).
- **Available Stock Protection**: Quarantined stock is excluded from `availableQuantity` to prevent allocation to sales orders or manufacturing consumption until QA approval is certified.

### 10.3. NCR, CAPA & Supplier Quality Scoring (M11 SRM Integration)
- **Non-Conformance Reporting (NCR)**: Failed inspections automatically generate an NCR ticket categorizing severity (`CRITICAL`, `MAJOR`, `MINOR`).
- **Corrective & Preventive Action (CAPA)**: Critical and Major NCRs require a CAPA workflow covering root-cause analysis, containment actions, and verification.
- **Supplier Rating Impact**: NCR counts, defect rates, and CAPA resolution performance directly feed into the M11 Supplier Quality Scorecard to determine vendor classification (Tier A to D).

### 10.4. Electronic COA & DMS Vault Archiving (M28 / M29 Integration)
- **SHA-256 Seal**: Approved batch releases and Certificate of Analysis (COA) documents are cryptographically sealed with SHA-256 hashes.
- **DMS Vault Storage**: Final QA certificates and inspection dossiers are permanently archived into the M29 DMS vault under strict read-only immutability.
- **Multi-Step Approval Workflow**: All batch release certificates require sign-off through M28 multi-tier approval matrices prior to physical warehouse dispatch.

## 11. Logistics & Fleet Transportation Rules (M36 TMS)

### 11.1. Single-Writer Authority & Non-Authority Protection
- **No Direct Inventory Mutation**: M36 is NOT a Single-Writer Inventory Authority. M36 performs read-only checks against `stock_balances` and fulfillment status in M13 / M17. M36 CANNOT directly execute SQL UPDATEs or INSERTs into `stock_balances` or `stock_ledger`.
- **Delegated Costing (M42 SSOT)**: All Landed Cost allocation for inbound freight MUST be delegated exclusively to `CostingEngine.allocateLandedCost()` (M42). M36 never writes directly to `cost_layers`.
- **Delegated Accounting (M30 SSOT)**: All Freight GL entries (Debit 6417 / Credit 331), Toll BOT reconciliations (Debit 6417 / Credit 1121), and COD Cash receipts (Debit 1111 / Credit 131) MUST route strictly through `AccountingEngine.postJournal()` (M30). M36 never writes directly to `accounting_entries`.

### 11.2. Shipment Lifecycle & Immutability Invariant
- **Immutable State Machine**: Once a shipment or transport order reaches `DELIVERED` or `CLOSED`, it becomes strictly read-only and immutable. No retrospective modifications to driver, vehicle, or cargo are permitted.
- **Exception & Failed Delivery (M15 Integration)**: Delivery failures cannot overwrite historical shipping milestones. Failed delivery transitions order status to `FAILED` and automatically delegates the generation of an official RMA docket (`RMA-YYYY-XXXX`) to Module M15 (Returns & RMA). Re-attempts create subsequent dispatch orders.

### 11.3. Cryptographic DMS Archival & Audit Trail (M29 & M02 Compliance)
- **DMS Vault Archival**: Every issued Waybill and electronic Proof of Delivery (e-POD) must be cryptographically hashed (SHA-256) and archived directly into the M29 DMS Vault (`dms_documents`). Standalone document storage silos are strictly prohibited.
- **Unified Audit Trail**: All lifecycle transitions (`CREATE_VEHICLE`, `CREATE_DRIVER`, `CREATE_TRANSPORT_ORDER`, `ASSIGN_DRIVER_VEHICLE`, `DISPATCH_SHIPMENT`, `TRACK_UPDATE`, `OPTIMIZE_ROUTE`, `POD_CONFIRM`, `FAIL_DELIVERY`, `SETTLE_COD`, `LOG_FUEL_REFUEL`) MUST be recorded into M02 via `AuditService.recordAuditLog()`. No local audit log tables.

### 11.4. Idempotency & Concurrency Protection
- All state-mutating logistics operations (consolidated shipment dispatch, COD settlement, e-POD recording) must accept and enforce unique `idempotencyKey` headers to protect against network replays and duplicate dispatches.

## 12. Innovation R&D & Formulation Rules (M06)

### 12.1. Single-Writer Authority & Non-Authority Protection
- **No Direct Inventory Mutation (M17 SSOT)**: M06 is NOT a Single-Writer Inventory Authority. Material requisitions for laboratory experiments or prototype builds MUST be delegated exclusively to `InventoryService.postTransaction()` (`POST /api/rd/projects/:id/material-requisition` -> movement type `OUTBOUND_ISSUE`). M06 CANNOT directly execute SQL UPDATEs or INSERTs on `stock_balances` or `stock_ledger`.
- **Delegated Costing (M42 SSOT)**: Formula cost estimation (`GET /api/rd/projects/:id/cost-estimate`) MUST read live component costs directly from M42 `cost_layers` or M07 `products.costPrice`. M06 is strictly prohibited from inventing or hardcoding synthetic raw material costs, and CANNOT mutate cost layers.
- **Delegated Master Item Registration (M07 SSOT)**: Commercial SKU generation upon project approval MUST be delegated to M07 Item Master (`POST /api/products` via `POST /api/rd/projects/:id/register-sku`) with `sourceType = 'RD_PROJECT'`. M06 CANNOT create isolated orphan product tables.
- **Delegated Production Execution (M25 MES SSOT)**: Prototype BOM handover (`POST /api/rd/boms`) and pilot production work orders (`POST /api/rd/projects/:id/pilot-batch`) MUST delegate to M25 MES (`boms`, `bomItems`, `manufacturingOrders`). M06 never executes manufacturing floor operations directly.

### 12.2. Stage-Gate Lifecycle Invariant & Immutability Guard
- **Strict 5-Stage Lifecycle**: Every R&D project strictly adheres to the progressive lifecycle: `DRAFT` -> `TRIAL` -> `SAMPLE_EVALUATION` -> `APPROVED` -> `HANDED_OVER` (or terminal `REJECTED`).
- **Immutable Lock on Completion**: Once a project reaches `HANDED_OVER` or `REJECTED`, the project record and its associated formula recipes become permanently locked and immutable (`isLocked = true`). Any subsequent modifications must be initiated under a new R&D project or an explicit new formulation revision (`v2.0`). Retrospective edits to locked projects are strictly blocked with HTTP 403.
- **5-Gate Handover Pre-requisites**: Handover Sign-Off (`POST /api/rd/projects/:id/handover-signoff`) strictly requires:
  1. At least one prototype sample evaluation with status `PASS`.
  2. Eco-Design compliance verification with status `PASS`.
  3. Commercial SKU registered in M07 Item Master (`targetSkuId != null`).
  4. Active BOM release prepared for M25 MES.

### 12.3. Formula Version Control & Confidentiality Guard (RBAC)
- **Zero-Overwrite Policy**: Formula edits never overwrite existing versions in-place. Every revision creates an incremented version record (`v1.0`, `v1.1`, `v2.0`), preserving full historical recipes and active formulation pointers.
- **Confidentiality Masking (RBAC)**: Detailed ingredient percentages, exact chemical formulas, and confidential ratios are restricted to users holding `rd:confidential` or `rd.confidential.view` permissions. For non-authorized users, confidential component percentages and proprietary specifications are masked or omitted.

### 12.4. Cross-Module Delegation & Archival (M39 QMS, M08/M09 P2P, M29 DMS, M02 Audit)
- **Quality Control Linkage (M39)**: Sample evaluation (`POST /api/rd/samples/evaluate`) automatically creates an incoming inspection record (`qc_inspections`) and ties into M39 QMS sampling plans (`qc_plans`).
- **Procurement Requisition (M08/M09)**: Lab sample raw material purchasing requests (`POST /api/rd/projects/:id/sample-po`) delegate directly to M08 Purchase Orders (`schema.purchaseOrders`), establishing complete P2P traceability.
- **Cryptographic DMS Vaulting (M29)**: Test reports, Eco-Design certifications, and technical handover dossiers must be cryptographically hashed with SHA-256 and archived to M29 DMS Vault (`schema.dmsDocuments`).
- **Audit Logging (M02 SSOT)**: All 8 critical lifecycle milestones (`CREATE_PROJECT`, `LOG_EXPERIMENT`, `EVALUATE_SAMPLE`, `ECO_COMPLIANCE_CHECK`, `STAGE_TRANSITION`, `PILOT_BATCH`, `HANDOVER_SIGNOFF`, `REJECT`) MUST be logged via `AuditService.recordAuditLog()`. No local audit log tables are permitted.

## 13. Manufacturing Execution & BOM Rules (M25 MES)

### 13.1. Single-Writer Authority & Non-Authority Protection
- **No Direct Inventory Mutation (M17 SSOT):** M25 is NOT a Single-Writer Inventory Authority. All raw material issues (`PRODUCTION_CONSUMPTION`, manual or backflush) and finished goods receipts (`PRODUCTION_RECEIPT`) MUST be posted exclusively via `InventoryService.postTransaction()`. M25 CANNOT execute direct SQL UPDATEs or INSERTs on `stock_balances` or `stock_ledger`.
- **Costing Authority (M42 SSOT):** M25 is NOT a costing authority. Standard unit costs and actual cost allocations are resolved strictly through `CostingEngine` (M42). M25 provides a read-only comparison of standard vs actual cost variance and CANNOT mutate frozen costing layers or costing tables.
- **Quality Quarantine Authority (M39 SSOT):** Quarantine holds for WIP or finished goods must route strictly through M39 QMS (`qc_inspections`, `quality_holds`). M25 CANNOT release quarantined stock or complete a work order under active QC hold without an authorized QC release certificate.
- **Traceability Authority (M22 / M23 SSOT):** Finished goods lot numbers (`product_lots`) and serial numbers (`product_serials`) are registered via M22 and M23 with backward genealogy linking consumed raw material lots.

### 13.2. Work Order Lifecycle State Machine & Immutability Invariant
- **Strict Lifecycle Transitions:** Every Manufacturing Order (MO) follows the deterministic state machine:
  `DRAFT` $\rightarrow$ `RELEASED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `QC_HOLD` / `QC_RELEASE` $\rightarrow$ `COMPLETED` (or terminal `CANCELLED`).
- **Stock Reservation Boundary:** Releasing an MO (`POST /api/manufacturing/work-orders/:id/release`) reserves required raw materials in M17. Cancelling an MO releases all active stock reservations.
- **Terminal Immutability Invariant:** Once an order reaches `COMPLETED` or `CANCELLED`, it is permanently frozen and immutable. Retrospective changes to quantity, consumed materials, or costs are strictly prohibited. Errors or scrap variances must be resolved via a new corrective or rework order (`REWORK_MO`).

### 13.3. BOM Version Control & Zero-Overwrite Policy
- **Multi-Version Architecture:** Bills of Materials (BOM) follow a strict lifecycle (`DRAFT` $\rightarrow$ `APPROVED` $\rightarrow$ `ACTIVE` $\rightarrow$ `ARCHIVED`).
- **Zero-Overwrite Policy:** Revisions never overwrite existing BOM baselines in-place. Every engineering change creates a new record in `bom_versions` with incremented version numbers (`V1.0`, `V1.1`, `V2.0`) and effective date intervals (`effective_from`, `effective_to`).

### 13.4. Material Consumption: Manual vs Backflush
- **Manual Issue:** Operators issue raw materials staged on the shop floor via `POST /api/manufacturing/work-orders/:id/issue-materials`, decrementing stock strictly through M17 `InventoryService.postTransaction()`.
- **Backflush Issue:** On MO completion (`POST /api/manufacturing/work-orders/:id/backflush`), the system calculates exact standard quantities from the active BOM version, verifying warehouse availability before atomically posting consumption via M17.

### 13.5. Scrap & Yield Tracking
- **Yield Calculation:** Yield % is computed as `(goodQuantity / (goodQuantity + scrapQuantity)) * 100`.
- **Scrap Reporting:** Actual scrap quantities are tracked per operation against expected BOM scrap rates (`scrapRate`). Discrepancies exceeding standard tolerance require mandatory scrap reason codes (`DEFECTIVE_MATERIAL`, `OPERATOR_ERROR`, `MACHINE_MALFUNCTION`, `CALIBRATION_LOSS`).

### 13.6. MRP Planned Order Conversion (M26 SCM)
- Planned production orders generated from M26 MRP netting runs are ingested via `POST /api/manufacturing/orders/from-mrp`, creating MOs with reference to `mrpPlanId` for seamless cross-module supply chain visibility.

### 13.7. Centralized Audit Trail & Cryptographic DMS Vaulting (M02 & M29)
- **Centralized Tamper-Evident Audit (M02 SSOT):** All 8 lifecycle transitions (`CREATE_BOM`, `NEW_BOM_VERSION`, `RELEASE_MO`, `ISSUE_MATERIAL`, `BACKFLUSH_MATERIAL`, `QC_HOLD`, `QC_RELEASE`, `COMPLETE_MO`, `CANCEL_MO`) are recorded via `AuditService.recordAuditLog()`.
- **DMS Vaulting (M29 SSOT):** Production travelers, material routing sheets, and quality release dossiers are cryptographically hashed (SHA-256) and archived into M29 DMS (`dms_documents`).

---

## 14. M26 — Supply Chain Planning & MRP Netting (SCP)

### 14.1. Single-Writer Authority & Delegation Guards
- **Strict Non-Authority for PO and MO:** M26 is an analytical planning and netting engine; it is **NEVER** a Single-Writer authority for purchase orders or manufacturing orders.
- **Purchase Requisitions (PR) -> M08 Purchase Orders:** M26 generates suggestions stored in `purchase_requisitions`. Conversion to an actual Purchase Order MUST delegate exclusively to M08 via `POST /api/purchase-orders` (or atomic internal delegation transaction), writing to `purchase_orders`. M26 never directly creates or mutates records in `purchase_orders`.
- **MO Suggestions -> M25 Manufacturing Orders:** M26 generates manufacturing suggestions stored in `mrp_results`. Conversion to an actual Manufacturing Order MUST delegate exclusively to M25 via `POST /api/manufacturing/work-orders` or `POST /api/manufacturing/orders/from-mrp`, writing to `manufacturing_orders`. M26 never directly creates or mutates records in `manufacturing_orders`.

### 14.2. Demand Netting Hierarchy & Inventory Truth
- **Gross Demand Calculation:** Gross demand is evaluated per product by taking the maximum of active customer Sales Orders (M13 `sales_orders` with status `DRAFT`, `CONFIRMED`, or `RESERVED`) and active statistical demand forecasts / MPS commitments, plus dependent demands exploded from higher-level assembly MOs:
  `GrossRequirement = Max(SalesOrderDemand, ForecastDemand) + DependentDemandFromParentBOM`
- **Single-Writer Inventory Truth (M17):** Available inventory MUST be computed strictly from real stock balances in M17 (`stock_balances` and `products`), without estimations or local overrides:
  `AvailableStock = Max(0, OnHandStock - ReservedStock)`
- **Net Requirement Netting Formula:**
  `NetRequirement = Max(0, GrossRequirement + SafetyStock - (AvailableStock + ScheduledReceipts))`
  where `ScheduledReceipts = OpenPurchaseOrders (M08) + OpenManufacturingOrders (M25)`.

### 14.3. Multi-Level BOM Explosion & Lead Time Offsetting
- **Multi-Level Explosion:** For finished goods with a net requirement > 0, the MRP engine queries active BOMs (`boms`, `bom_items` in M25) and recursively explodes requirements down to low-level codes (Level 0 FG -> Level 1 Sub-Assembly -> Level 2 Raw Material/Component).
- **Scrap Rate Incorporation:** Dependent gross component demand is scaled by the BOM scrap rate:
  `DependentComponentDemand = ParentPlannedOrderReceipt * BOMQuantity * (1 + ScrapRate / 100)`
- **Lead Time Offsetting:** Planned order release dates are backward-scheduled from the required delivery date using item or supplier lead times:
  `PlannedOrderReleaseDate = RequiredDate - LeadTimeDays`
- **Lead Time Violation Guard:** If `PlannedOrderReleaseDate < CurrentDate`, the engine flags an immediate `LEAD_TIME_VIOLATION` exception message to alert planners.

### 14.4. MRP Execution Modes, Immutability & Idempotency
- **Regenerative Run:** Analyzes all active products in the system, recomputing gross/net requirements from a clean baseline.
- **Net-Change Run:** Only analyzes items affected by recent transactions (new/modified SOs, inventory changes, or active forecast updates).
- **Run Immutability:** Each completed MRP run (`mrp_runs`) is immutable and acts as an audit trail snapshot. Subsequent runs generate new sequential run codes (`MRP-YYYYMMDD-XXX`) and new records in `mrp_runs`, `mrp_results`, and `mrp_exceptions`. Old runs are NEVER overwritten in-place.
- **Idempotency Guard:** If duplicate MRP run triggers are received within a 30-second window with identical parameters, the engine returns the active or cached run to prevent race conditions and duplicate order generation.

### 14.5. Exception Classification Engine
The engine continuously evaluates planning discrepancies and categorizes them into standard ERP exception types:
1. `CRITICAL_STOCKOUT`: Net requirement > 0 and available stock is zero or negative.
2. `LEAD_TIME_VIOLATION`: Planned order release date is in the past (`ReleaseDate < Today`).
3. `EXCESS_INVENTORY`: Projected on-hand stock exceeds 2x the Reorder Point or maximum stocking limit.
4. `PAST_DUE_ORDER`: Open PO or MO has a promised delivery date prior to today with unreceived balances.
5. `NO_BOM_FOUND`: Product marked as manufactured has no active BOM in M25.
6. `NO_SUPPLIER_DEFINED`: Purchased item has no preferred supplier mapped in M09/M07.

### 14.6. Full Pegging Lineage Traceability (M13 O2C)
- Every planned order and component net requirement retains a pegging chain back to the originating customer Sales Order (`soId`, `soCode`, customer name, required delivery date).
- Planners can trace from raw material shortages directly to the customer impact and potential revenue at risk.

### 14.7. Centralized Audit Trail & Cryptographic DMS Vaulting (M02 & M29)
- **Centralized Tamper-Evident Audit (M02 SSOT):** All 6 planning lifecycle events (`FORECAST_CREATE`, `MPS_SCHEDULE`, `MRP_RUN_EXECUTE`, `PR_DELEGATE_PO`, `MO_SUGGEST_CREATE`, `EXCEPTION_RESOLVE`) are recorded via `AuditService.recordAuditLog()`.
- **DMS Vaulting (M29 SSOT):** MRP run summaries, supply-demand balance matrices, and exception reports are cryptographically hashed (SHA-256) and archived into M29 DMS (`dms_documents`) under category `SUPPLY_CHAIN_REPORT`.




