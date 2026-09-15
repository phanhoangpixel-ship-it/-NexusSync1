# M25 Manufacturing BOM - Feature Baseline Before Sync

## Tab 1: Lệnh Sản Xuất (MO Execution)
- **API Endpoints**: 
  - `GET /api/manufacturing/orders`
  - `GET /api/products`
- **User Actions & Outcomes**:
  - **Lọc và tìm kiếm**: Lọc theo trạng thái (ALL, DRAFT, RELEASED, IN_PROGRESS, COMPLETED) và tìm kiếm (search query theo code, productName, workCenterName).
  - **Phát lệnh sản xuất**: Click "Phát Lệnh" -> Hiện `ConfirmDialog` -> `POST /api/manufacturing/orders/:id/release`. Chuyển trạng thái sang `RELEASED`.
  - **Xuất vật tư**: Click "Xuất Vật Tư" -> Hiện `ConfirmDialog` -> `POST /api/manufacturing/orders/:id/issue-materials`. Chuyển trạng thái sang `IN_PROGRESS`.
  - **Báo cáo sản lượng**: Click "Báo Cáo Sản Lượng" -> Mở modal "Báo Cáo Sản Lượng Hoàn Thành". Nhập `goodQuantity`, `scrapQuantity`, `batchNumber` -> `POST /api/manufacturing/orders/:id/report-production`.
  - **Xem chi tiết MO**: Click vào một dòng trên bảng -> Gọi `onSelectEntity` với payload chi tiết MO (gồm audit trail, GL entries sinh tự động).
- **Conditional Rendering & Logic**:
  - Nút "Phát Lệnh": Chỉ hiện khi `mo.status === 'DRAFT'`.
  - Nút "Xuất Vật Tư": Chỉ hiện khi `mo.status === 'RELEASED'`.
  - Nút "Báo Cáo Sản Lượng": Chỉ hiện khi `mo.status === 'IN_PROGRESS' || mo.status === 'RELEASED'`.

## Tab 2: Định Mức BOM & Định Tuyến Routing
- **API Endpoints**: 
  - `GET /api/manufacturing/boms`
- **User Actions & Outcomes**:
  - Chỉ hiển thị danh sách BOM, danh sách linh kiện và định mức (routings). Không có action sửa/xóa.

## Tab 3: Tập Hợp Chi Phí & Giá Thành (TK 154/155)
- **API Endpoints**: Không gọi thêm, dữ liệu hiển thị tĩnh hoặc tính toán từ state.
- **User Actions & Outcomes**:
  - Chỉ hiển thị KPI chi phí (621, 622, 627) và bảng danh sách.

## Global Actions
- **Tạo Lệnh Sản Xuất MO**:
  - Action từ `useWorkspaceAction()`. Mở modal "Khởi Tạo Lệnh Sản Xuất".
  - Nhập thông tin: `formProductId`, `formBomId`, `formPlannedQty`, `formWorkCenterId`, `formPriority`, `formNotes`.
  - Gọi `POST /api/manufacturing/orders`.
  - Khi thành công, gọi `fetchData()` để cập nhật danh sách.

## System & Specific Component Logic
- **Nullish coalescing**: `mo.producedQuantity || 0` and `mo.plannedQuantity || 1`. MUST replace `||` with `??` as requested for any derived/fallback numbers, except where explicitly needed for 0 cases. Specifically, `mo.producedQuantity ?? 0`.
- **Validation**:
  - Quantity plan >= 1.
  - Good quantity >= 1, Scrap quantity >= 0.
- **ConfirmDialog**: Dùng ConfirmDialog cho `handleRelease` và `handleIssueMaterials`.
