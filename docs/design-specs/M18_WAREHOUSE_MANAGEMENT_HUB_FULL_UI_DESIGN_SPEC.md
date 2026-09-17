# M18 WAREHOUSE MANAGEMENT HUB (QUẢN TRỊ KHO VẬN TỔNG HỢP)
## FULL UI/UX DESIGN SPECIFICATION — NGUỒN CHÂN LÝ THIẾT KẾ DUY NHẤT (SINGLE SOURCE OF TRUTH)

---

## MỤC LỤC TỔNG QUAN HỆ THỐNG TAB M18 (PHASE 0 INVENTORY)

| STT | Mã Tab | Tên Tab Chức Năng | File Component Tương Ứng | Loại Màn Hình |
|---|---|---|---|---|
| 1 | Tab A | **Warehouse Setup & Facilities Master** | `/src/components/workspaces/WarehouseFacilitiesMasterTab.tsx` | Master/List View & Zone/Bin Visual Matrix |
| 2 | Tab B | **Inbound Receiving (3-Way Match & Putaway)** | `/src/components/workspaces/WarehouseInboundTab.tsx` | Master/List View + SubViews (GRN Desk, Putaway Matrix, KCS/IQC) + Modal + Drawer |
| 3 | Tab C | **Outbound Fulfillment (Wave Pick & Dispatch)** | `/src/components/workspaces/WarehouseOutboundTab.tsx` | Master/List View + Wave Picking SubView + Packing/KCS SubView + Drawer 360 + Modal |
| 4 | Tab D | **Internal Operations (Replenish & Relocate)** | `/src/components/workspaces/WarehouseInternalOpsTab.tsx` | Master/List View + KPI Overview + Task Detail Drawer + Create Task Modal |
| 5 | Tab E | **Inventory Stock Control (Min/Max & Reorder)** | `/src/components/workspaces/WarehouseStockControlTab.tsx` | ModuleTabShell Multi-Tab + Filter Bar + Alert Badges + Stock Adjustment Modal |
| 6 | Tab F | **Traceability (Lot & Serial Lifecycle)** | `/src/components/workspaces/WarehouseTraceabilityTab.tsx` | Master/List View + QR/Barcode Scanner Modal + Traceability Timeline Drawer + Export Excel |
| 7 | Tab G | **Warehouse Analytics (Heatmap & ABC Velocity)** | `/src/components/workspaces/WarehouseAnalyticsTab.tsx` | KPI Cards + Occupancy Heatmap Visual Grid + ABC Velocity Analysis Table |

---

## TAB A — WAREHOUSE SETUP, SPATIAL TOPOLOGY & SLOTTING GUARD

### 1.1 Cấu trúc bố cục (Layout Architecture)
- **L0 Hệ Thống**: Vỏ workspace tích hợp với thẻ phiên làm việc `useWorkspaceSessionTab('M18', 'setup')`.
- **Sub-View Switcher (3 Chế độ xem tích hợp)**:
  1. `1. Danh Mục Cơ Sở Kho (Facilities Master)`: Danh mục kho, KPI Metrics 6 chỉ số, bộ lọc nâng cao, in tem QR, modal CRUD kho và Drawer chi tiết 360°.
  2. `2. Cấu Trúc Không Gian & Tải Trọng Kệ (Spatial Topology)`: Sơ đồ cây phân cấp 5 tầng (`Warehouse ➔ Zone ➔ Aisle ➔ Rack ➔ Shelf/Bin`), thước đo tải trọng (kg) và thể tích (m³) thời gian thực, CRUD vị trí kho an toàn.
  3. `3. Mô Phỏng Xếp Hàng & Kiểm Soát An Toàn (Slotting Guard)`: Thẩm định tự động tương thích điều kiện bảo quản (`COLD`, `DRY`, `BULKY`, `QUARANTINE`) và chặn quá tải kệ (`BLOCKED_OVER_CAPACITY`) trước khi ghi nhận phân bổ tồn kho.
- **L1 Command Bar**: Thanh tìm kiếm kho, cụm Zone, bộ lọc trạng thái kho (`ALL`, `ACTIVE`, `MAINTENANCE`), nút hành động nhanh "Thêm Kho Mới" (`bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs`).
- **L2 KPI Summary Strip**: 6 thẻ KPI gồm Tổng số Kho, Tổng số Zone, Tổng số Kệ/Bin, Tồn vật lý, Giá trị tồn kho định giá và Tỷ lệ lấp đầy kho bình quân.
- **L3 Content Area**: Lưới bảng danh mục kho (Warehouse Data Grid) kết hợp Cây không gian 5 tầng & Trình mô phỏng xếp hàng với trạng thái tải `L3ContentState` (Skeleton, Empty State với nút CTA, Error State với nút Thử lại).
- **L4 Sticky Footer**: Phân trang cố định `PaginationControl` đồng bộ số bản ghi trên trang (10, 25, 50).

### 1.2 Typography
- **Tiêu đề phân hệ**: `text-2xl font-bold text-slate-900 dark:text-white tracking-tight`
- **Mã định danh kho / Bin**: `font-mono font-bold text-xs text-blue-600 dark:text-blue-400`
- **Tên kho / Tên Zone**: `font-semibold text-sm text-slate-800 dark:text-slate-100`
- **Nhãn phụ / Chú thích**: `text-xs text-slate-500 dark:text-slate-400`
- **Số liệu thống kê**: `font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-white`

### 1.3 Định dạng số liệu & Tiền tệ
- **Số lượng Bin / Sức chứa**: `val.toLocaleString('vi-VN')` (vd: `1.250 Bin`, `5.000 m³`).
- **Tỷ lệ lấp đầy**: `val.toFixed(1) + '%'` (vd: `78.5%`, `92.0%`).
- **Căn lề số liệu**: Luôn căn phải `text-right` với `font-mono tabular-nums`.
- **Thời gian cập nhật**: `dd/MM/yyyy HH:mm` (chuẩn múi giờ `Asia/Ho_Chi_Minh`).

### 1.4 Hệ thống màu sắc trạng thái (Status Color Tokens)
- `ACTIVE`: `bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800`
- `FULL`: `bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800`
- `MAINTENANCE`: `bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800`
- `EMPTY`: `bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700`

### 1.5 Component & Interaction
- Modal thêm/sửa Kho & Zone: Modal centered `fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs`, bo tròn `rounded-2xl`.
- Modal xác nhận: Tuân thủ tuyệt đối Rule #19 bằng `ConfirmDialog` (không `window.confirm`).
- Context Actions: Nút Xem Chi Tiết (`Eye`), Sửa (`Edit3`), Khóa Bin (`ShieldAlert`).

### 1.6 Trạng thái hệ thống (System States)
- `L3ContentState`: Skeleton rows `animate-pulse`, Error state với nút Retry, Empty state với nút CTA.

---

## TAB B — INBOUND RECEIVING (3-WAY MATCH & PUTAWAY)

### 1.1 Cấu trúc bố cục (Layout Architecture)
- **L0 Shell**: Điều hướng SubView (`orders`, `grn_match`, `putaway`).
- **L1 Command Bar**: Tìm kiếm PO/GRN, bộ lọc NCC, Kho nhận, trạng thái KCS/IQC. Nút "Lập Phiếu Nhập Kho Mới".
- **L2 KPI Strip**: 4 thẻ KPI (Tổng lệnh nhập, Chờ KCS/IQC, Đã đối soát 3-Way Match, Chờ Putaway).
- **L3 Data Grid**: Bảng danh sách phiếu nhập kho, đối soát hóa đơn / PO / Thực nhận, hiển thị sai lệch nếu có.
- **L4 Sticky Footer**: `PaginationControl` gắn đáy card bảng.

### 1.2 Typography
- **Mã GRN / PO Code**: `font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400`
- **Tên nhà cung cấp / Hàng hóa**: `font-semibold text-xs text-slate-800 dark:text-slate-200`
- **Số lượng & Giá trị**: `font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white`

### 1.3 Định dạng số liệu & Tiền tệ
- **Số tiền**: `val.toLocaleString('vi-VN') + ' ₫'`
- **Số lượng**: `val.toLocaleString('vi-VN') + ' ' + unit`
- **Độ chính xác**: 0 chữ số thập phân cho VND, căn lề `text-right font-mono tabular-nums`.

### 1.4 Hệ thống màu sắc trạng thái
- `PENDING_IQC`: `bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800`
- `IQC_PASSED`: `bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800`
- `MATCHED_3WAY`: `bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800 font-bold`
- `PUTAWAY_COMPLETED`: `bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800`

---

## TAB C — OUTBOUND FULFILLMENT (WAVE PICK & DISPATCH)

### 1.1 Cấu trúc bố cục (Layout Architecture)
- **L0 Shell**: Tích hợp SubView (`orders`, `wave_picking`, `dispatch`).
- **L1 Command Bar**: Tìm kiếm đơn xuất, bộ lọc kênh bán, đơn vị vận chuyển 3PL, nút "Tạo Đợt Nhặt Hàng (Wave Pick)".
- **L2 KPI Strip**: Lệnh xuất chờ nhặt, Đang đóng gói & KCS, Đã bàn giao 3PL, Tỷ lệ đúng hạn SLA.
- **L3 Data Grid**: Bảng lệnh xuất kho kèm checkbox gom đơn Wave Picking, Drawer 360 độ chi tiết kiện hàng.
- **L4 Sticky Footer**: `PaginationControl` với lựa chọn page size.

### 1.2 Typography & Định dạng số
- **Mã Đơn / Tracking No**: `font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400`
- **Số lượng / Tiền**: `font-mono tabular-nums text-right`
- **Tiền tệ**: `val.toLocaleString('vi-VN') + ' ₫'`

### 1.3 Hệ thống màu sắc trạng thái
- `PENDING_PICK`: `bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800`
- `PICKING`: `bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800`
- `PACKED`: `bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800`
- `SHIPPED`: `bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800`
- `DELIVERED`: `bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800 font-bold`

---

## TAB D — INTERNAL OPERATIONS (REPLENISH & RELOCATE)

### 1.1 Cấu trúc bố cục (Layout Architecture)
- **L1 Command Bar**: Tìm kiếm task ID / SKU, lọc loại nghiệp vụ (Bổ sung kệ, Di dời, Đảo kho), lọc nhân viên phụ trách.
- **L2 KPI Strip**: 4 chỉ số (Tổng nhiệm vụ, Đang thực hiện, Hoàn tất trong ngày, Quá hạn SLA).
- **L3 Data Grid**: Bảng nhiệm vụ chi tiết với Bin Nguồn ➔ Bin Đích (`font-mono text-amber-600 ➔ text-emerald-600`).
- **L4 Sticky Footer**: `PaginationControl`.

---

## TAB E — INVENTORY STOCK CONTROL & ADJUSTMENT

### 1.1 Cấu trúc bố cục (Layout Architecture)
- Sử dụng `ModuleTabShell` với các bộ lọc phân tầng, cảnh báo Min/Max safety stock, nút "Lập Phiếu Điều Chỉnh Tồn Kho".
- Bảng đối soát số lượng hệ thống, số lượng khả dụng (Available), số lượng dự trữ (Reserved).
- Modal điều chỉnh tồn kho với lý do (Hao hụt, Hỏng vỡ, Khớp kiểm kê) và hạch toán tự động vào Sổ cái GL.

---

## TAB F — TRACEABILITY (LOT & SERIAL LIFECYCLE)

### 1.1 Cấu trúc bố cục (Layout Architecture)
- Thanh công cụ quét mã Barcode/QR (`Barcode`, `QrCode`), bộ lọc theo Serial/Lot, trạng thái HSD/Bảo hành.
- Bảng danh mục Serial/Lot kèm ngày sản xuất, hạn sử dụng, nhà cung cấp, vị trí Bin lưu trữ.
- Drawer hiển thị dòng thời gian vòng đời (Lifecycle Timeline) từ khi nhập kho, chuyển vị trí, KCS đến xuất bán.

---

## TAB G — WAREHOUSE ANALYTICS & ABC VELOCITY

### 1.1 Cấu trúc bố cục (Layout Architecture)
- Lưới Heatmap tỷ lệ lấp đầy trực quan theo từng Zone & Kệ kho.
- Bảng phân tích phân hạng ABC Velocity (Class A: Luân chuyển nhanh, Class B: Trung bình, Class C: Chậm).
- Báo cáo vòng quay tồn kho (Inventory Turnover) và số ngày tồn kho bình quân (Days on Hand).

---
*Tài liệu này được trích xuất trực tiếp từ mã nguồn thực tế của M18 và là căn cứ bắt buộc cho việc sao chép sang M19.*
