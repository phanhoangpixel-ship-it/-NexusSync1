# M15 RETURNS & RMA WORKSPACE — FEATURE BASELINE BEFORE SYNC
**Document ID:** `/docs/design-specs/M15_FEATURE_BASELINE_BEFORE_SYNC.md`  
**Module ID:** `M15` (Returns & RMA Authority Submodule)  
**Creation Date:** 2026-09-11  
**Target Reference:** `/docs/design-specs/M19_MASTER_DESIGN_SPEC.md`  
**Governance Rules:** Rule #19 (ConfirmDialog, WCAG AA, Table Row Hover, Monospace) & Rule #20 (Full UI/UX Module Replication Protocol)

---

## 1. MỤC TIÊU & PHẠM VI (SCOPE & OBJECTIVES)
Tài liệu này ghi lại toàn bộ tính năng, trạng thái (state), luồng dữ liệu (data flow), các handler sự kiện, các API backend, modal và cấu trúc trước khi thực hiện đồng bộ giao diện người dùng theo chuẩn thiết kế M19 Master Design Spec (`M19_MASTER_DESIGN_SPEC.md`).
Tuyệt đối bảo toàn 100% logic nghiệp vụ, các lệnh gọi API thực tế (`/api/sales/rma/list`, `/api/sales/rma/create`, `/api/sales/rma/process`), cơ chế Idempotency Key, tích hợp trợ lý điều hướng `guidedTask`, phát hành sự kiện đối tượng sang L5 Context Rail và hộp thoại xác nhận `ConfirmDialog`.

---

## 2. KIỂM KÊ CÁC TAB & NGHIỆP VỤ CỦA MODULE M15

| STT | Tab ID | Tên Tab Chức Năng | Vai Trò & Nghiệp Vụ Cốt Lõi |
|---|---|---|---|
| 1 | `requests` | **1. Yêu cầu & Phê duyệt RMA** | Danh sách hồ sơ RMA (`RMA-2026-xxx`); Khách hàng, đơn hàng gốc SO, mã giao hàng DEL, sản phẩm & số lượng, lý do trả hàng, hướng giải quyết mong muốn (`RESTOCK`, `REPAIR`, `REPLACE`, `CREDIT`); Phê duyệt RMA (`handleApproveRma`) với ConfirmDialog; Form tạo yêu cầu trả hàng mới gửi API backend với idempotency key. |
| 2 | `inspection` | **2. Tiếp nhận & Kiểm tra (Inspection)** | Kiểm định chất lượng hàng thực tế về kho (Inspection Gate); Phân loại trạng thái vật lý: `GOOD`, `DEFECTIVE`, `DAMAGED`, `SCRAP`; Cập nhật kết quả kiểm định chất lượng lên backend (`handleCompleteInspection`). |
| 3 | `disposition` | **3. Quyết định Xử lý (Disposition)** | Xác định hướng xử lý cuối cùng (`RESTOCK`, `REPAIR`, `REPLACE`, `SCRAP`, `RETURN_TO_VENDOR`, `CREDIT`); Tích hợp sự kiện nghiệp vụ liên kết với Inventory Core (`InventoryService.postTransaction()`) và Tài chính AR (`Credit Note`); Kích hoạt thực thi với ConfirmDialog (`handleApplyDisposition`). |
| 4 | `traceability` | **4. Sơ đồ Truy xuất & Hợp đồng Nghiệp vụ** | Sơ đồ 4 bước truy xuất nguồn gốc: (1) Xuất phát bán hàng & SO &rarr; (2) Yêu cầu & Ủy quyền RMA &rarr; (3) Kiểm định & Xử lý &rarr; (4) Kế toán & Kho hàng; Hợp đồng nghiệp vụ Return Authority Contract. |

---

## 3. DANH SÁCH STATE & DATA MODELS

### 3.1 State biến động
- `loading`: boolean — trạng thái làm mới dữ liệu từ API.
- `activeTab`: `'requests' | 'inspection' | 'disposition' | 'traceability'` — lưu phiên qua `useWorkspaceSessionTab`.
- `searchQuery`: string — từ khóa tìm kiếm RMA (mã, khách hàng, SO, sản phẩm).
- `statusFilter`: string — lọc trạng thái RMA (`ALL`, `REQUESTED`, `UNDER_REVIEW`, `APPROVED`, `COMPLETED`).
- `resolutionFilter`: string — lọc hướng giải quyết.
- `rmaList`: Danh sách hồ sơ RMA (`id`, `customerName`, `originalSo`, `deliveryCode`, `productCode`, `productName`, `quantity`, `uom`, `lotSerial`, `reason`, `requestedResolution`, `status`, `inspectionResult`, `disposition`, `financialStatus`, `date`, `_raw`).
- `selectedRma`: Đối tượng RMA đang chọn xem modal chi tiết 360°.
- `confirmDialog`: `ConfirmDialogState` — điều khiển xác nhận hành động phê duyệt/xử lý.
- State form tạo RMA mới: `newCustomer`, `newSo`, `newProduct`, `newQty`, `newReason`, `newResolution`.
- `guidedTask`: Prop tiếp nhận nhiệm vụ tự động điều hướng từ AI Assistant.

### 3.2 Handlers nghiệp vụ
1. `fetchRMAs()`: Gọi API GET `/api/sales/rma/list` đồng bộ danh sách RMA từ database.
2. `handleCreateRma(e)`: Gửi POST `/api/sales/rma/create` với idempotency key để ghi nhận yêu cầu trả hàng mới.
3. `handleApproveRma(rmaId)`: Mở `ConfirmDialog`, sau khi xác nhận gửi POST `/api/sales/rma/process` với action `APPROVE`.
4. `handleCompleteInspection(rmaId, result)`: Gửi POST `/api/sales/rma/process` với action `INSPECT`/`REJECT` và kết quả QC.
5. `handleApplyDisposition(rmaId, disposition)`: Mở `ConfirmDialog`, gửi POST `/api/sales/rma/process` với action `EXECUTE_RETURN_AND_REFUND`.
6. `handleSelectRma(rma)`: Mở modal 360° đồng thời phát hành `onSelectEntity` (type: `RMA`) sang L5 Context Rail.
7. `handleExportCSV()`: Xuất tệp RFC 4180 CSV danh sách hồ sơ RMA.

---

## 4. BẢNG TIÊU CHUẨN ĐỒNG BỘ VÀ NÂNG CẤP UI/UX

1. **L0 Header / Banner**:
   - Chuyển từ gradient tối màu sang thẻ chuẩn M19: `bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs`.
   - Icon 40x40 tròn góc bo cong `bg-rose-600 dark:bg-rose-500 text-white shadow-xs` với biểu tượng `RotateCcw`.
   - Chip `M15 • RETURNS & RMA` + Huy hiệu `Rule #19 Confirmed`.
   - Nút chuyển hướng nhanh sang M13 Sales Orders, nút Làm mới, nút Xuất Báo Cáo CSV.

2. **L1 Navigation Strip**:
   - Thanh tab chuẩn M19: `bg-white dark:bg-slate-800/90 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs`.
   - Trạng thái Active: `bg-rose-600 text-white shadow-xs` hoặc `bg-blue-600 text-white`.

3. **L2 KPI Summary Strips**:
   - Thêm dải 4 thẻ KPI đồng bộ cho từng Tab chức năng với font số `font-mono tabular-nums font-bold text-2xl`.

4. **L3 Data Tables & Cards**:
   - Thiết lập đường viền phân loại trạng thái dòng `border-l-4` cho các bảng RMA Requests và Dispositions.
   - Màu hover chuẩn: `hover:bg-slate-100/80 dark:hover:bg-slate-700/60`.
   - Thẻ QC Inspection hiển thị rõ ràng, đẹp mắt với dark mode support.
   - Badge trạng thái WCAG AA với độ tương phản ≥ 4.5:1.
   - Toàn bộ mã định danh, số lượng, ngày tháng hiển thị bằng `font-mono tabular-nums`.

5. **L4 Pagination**:
   - Bổ sung thanh điều khiển phân trang cố định `PaginationControl` cho danh sách RMA.

6. **Rule #19 Compliance**:
   - 100% không dùng `window.alert` hoặc `window.confirm`. Toàn bộ qua `ConfirmDialog.tsx`.
   - Xử lý toán tử derived value: Dùng toán tử `??` thay thế hoàn toàn `||`.
