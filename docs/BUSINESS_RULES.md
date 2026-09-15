# ERP Business Rules & Domain Logic

This document defines the strict business rules, workflows, and constraints of the ERP system. **AI MUST NOT guess or alter these rules**; they must be strictly followed when implementing or fixing features.

## 1. Procurement & Inventory (P2P Flow)

**Workflow:** `Purchase Order (PO) -> Goods Receipt (GR) -> Idempotency Check -> InventoryService -> Stock Ledger + Stock Balance`

**Rules:**
- **PO does NOT increase stock:** A Purchase Order is merely an intent to buy. It does not alter physical or available stock balances.
- **GR increases stock:** A Goods Receipt represents the physical arrival of items. It triggers the `InventoryService` to append to the `stock_ledger` and update `stock_balances`.
- **Idempotency is Mandatory:** A GR transaction might fail mid-way (e.g., DB lock) and be retried. The system MUST ensure that a single GR does not increase inventory twice.
- **Unit of Measure (UOM) Conversion:** Inventory is ALWAYS tracked in the `baseUnit`. If a PO/GR is created in a different UOM (e.g., Box), it must be converted to the `baseUnit` (e.g., Piece) using the `product_uoms.conversionFactor` before updating the ledger.

## 2. Invoicing & Payments (O2C Flow)

**Rules:**
- **Invoice vs. Payment Separation:** Invoices represent the debt (Accounts Receivable) and tax obligations. Payments represent actual cash flow. They are separate entities.
- **Partial Payments & Remaining Balances:**
  - If Invoice Total = 100M and Payment = 40M, the system must track `amountPaid = 40M` and calculate `Remaining = 60M`.
- **Status Independence:** 
  - `Invoice Status` (e.g., DRAFT, ISSUED, CANCELLED) is distinct from `Payment Status` (e.g., UNPAID, PARTIAL, PAID).
  - An Invoice can be `ISSUED` but remain `UNPAID`.
- **Accounting Generation:** An `ISSUED` invoice generates an AR (Accounts Receivable) GL entry. A `Payment` generates a Cash GL entry to clear the AR.

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

### 8.21. Quy Tắc Nghiệp Vụ Hoa Hồng & Quyết Toán Bán Hàng (Module 34 Commission Engine)
1. **Đánh Giá & Tính Toán Tự Động (Evaluation & Tiered Calculations)**:
   - Hệ thống tự động tính hoa hồng ngay khi Đơn Bán Hàng (B2B/POS) đạt điều kiện cơ sở (`ORDER_CONFIRMED`, `INVOICE_ISSUED`, `PAYMENT_COLLECTED`).
   - Tỷ lệ % và số tiền cố định được tính theo ma trận bậc thang doanh số lũy kế trong kỳ (`commission_rules`).
   - Ghi nhận bút toán vào `commission_calculations` với trạng thái ban đầu `ACCRUED` hoặc `ELIGIBLE`.
2. **Thưởng Vượt Quota & Hệ Số Accelerator (KPI Attainment)**:
   - Khi nhân viên kinh doanh đạt tỷ lệ hoàn thành KPI Quota `>= 100%`, hệ số tăng tốc `acceleratorMultiplier` (ví dụ: `1.2x`, `1.5x`) được áp dụng tự động cho phần doanh số thặng dư.
3. **Quy Trình Khấu Trừ Thu Hồi (Return Clawbacks)**:
   - Khi đơn hàng phát sinh Trả hàng bán (`sales_returns`) hoặc Hủy chứng từ, hệ thống tự động ghi nhận bản ghi Clawback âm (`isClawback = true`).
   - Số tiền Clawback sẽ tự động cấn trừ vào đợt quyết toán kế tiếp của nhân viên đó để bảo đảm doanh nghiệp không bị chi trả thừa.
4. **Hạch Toán Chuẩn Mực Kế Toán Kép (VAS Double-Entry Accounting)**:
   - **Phê duyệt Đợt quyết toán (Accrual)**: Tự động ghi nhận trích trước chi phí hoa hồng: **Nợ TK 6418 (Chi phí bán hàng) / Có TK 3388 (Phải trả khác - Hoa hồng)**.
   - **Chi trả Quyết toán (Payment)**: Tự động ghi nhận thanh toán tiền: **Nợ TK 3388 (Phải trả khác) / Có TK 1121 (Tiền gửi ngân hàng) hoặc TK 1111 (Tiền mặt)**.
   - Chuyển trạng thái toàn bộ các bản ghi `commission_calculations` liên quan sang `SETTLED`.


