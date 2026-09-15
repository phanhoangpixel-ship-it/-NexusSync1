# M24 WMS Extended Workspace - Feature Baseline (Before M19 Sync)

## OVERVIEW
M24 WMS Extended Hub manages advanced warehouse operations including Wave Picking, Replenishment, Bin Allocation, Packing LPN, Dock Appointment, and Carrier Freight.

## TABS IN M24
There are 6 tabs:
1. `wave` (Wave Picking)
2. `replenish` (Replenishment)
3. `allocation` (Bin Allocation)
4. `lpn` (Packing LPN)
5. `dock` (Dock Appointment)
6. `carrier` (Carrier Freight)

## API CALLS
- `GET /api/products`: Used to load `productsCatalog`. It uses `localStorage.getItem('nexus_jwt')` for the Bearer token.
  - Fallbacks to `defaultProductsCatalog` from `ENTERPRISE_MASTER_PRODUCTS` if the API fails or returns empty.
  - Transformation logic: maps `p.sku`, `p.name`, `p.category || 'Vật tư chung'`, `p.unit || p.baseUnit || 'Cái'`. (Notice `||` usage here in the original, though we need to check if we should replace it with `??` if requested, the rule says "nếu module này có bất kỳ giá trị số liệu nào là "derived/tính động" ... bắt buộc dùng `??`". The categories and units are string fallbacks, not numeric calculations, but good to note).

## BUSINESS LOGIC & STATE
- Global action: "Đồng Bộ Ledger" (Sync Ledger) -> triggers `onNotify('success', 'Đồng bộ WMS Extended', ...)`
- `handleAction`: Used across all tabs for generic actions. It triggers `ConfirmDialog` with specific messages and on confirm triggers `onNotify('success', ...)`
- All tabs use `ConfirmDialog` (Rule #19 compliant) instead of window.alert/confirm.

### Tab 1: Wave Picking
- **State**: `waves` array.
- **Actions**:
  - `+ Tạo Wave Mới` -> `handleAction('Tạo Wave Sóng Mới', 'WAVE-NEW')`
  - `Phát Hành Sóng` (per row) -> `handleAction('Phát hành Wave cho Picker', w.id)`
- **Render rules**: Displays id, zone, ordersCount, totalLines, progress, status.

### Tab 2: Replenishment
- **State**: `replenishments` array.
- **Actions**:
  - `+ Chạy Quy Tắc Bổ Sung` -> `handleAction('Chạy Quy Tắc Bổ Sung Hàng', 'REP-RUN')`
  - `Xác Nhận Hoàn Tất` (per row) -> `handleAction('Hoàn tất Replenishment', r.id)`
- **Render rules**: Displays id, sku + productName, fromBin -> toBin, qty, status.

### Tab 3: Bin Allocation
- **State**: `allocations` array.
- **Actions**:
  - `Tối Ưu Hóa Vị Trí (Bin Slotting)` -> `handleAction('Chạy Lại Thuật Toán Phân Bổ', 'ALLOC-RUN')`
- **Render rules**: Displays sku + productName, requestedQty, assignedBin, rule, status.

### Tab 4: Packing LPN
- **State**: `lpns` array.
- **Actions**:
  - `+ Tạo Mã LPN Mới` -> `handleAction('Tạo Mới LPN', 'LPN-NEW')`
  - `In Tem Barcode` (per row) -> triggers `onNotify('success', 'In Tem LPN', ...)` directly (NO ConfirmDialog).
- **Render rules**: Displays lpnCode, cartonSize, weight, soCode, status.

### Tab 5: Dock Appointment
- **State**: `appointments` array.
- **Actions**:
  - `+ Đăng Ký Lịch Xe Mới` -> `handleAction('Đăng Ký Lịch Cửa Kho', 'DOCK-NEW')`
  - `Check-in Xe` (per row) -> `handleAction('Check-in xe tải vào cửa kho', d.id)`
- **Render rules**: Displays dockName, carrier, poCode || soCode, timeSlot, status.

### Tab 6: Carrier Freight
- **State**: `freights` array.
- **Actions**:
  - `+ Tạo Vận Đơn (Waybill)` -> `handleAction('Tạo Vận Đơn Mới', 'WB-NEW')`
  - `Dispatch Vận Đơn` (per row) -> `handleAction('Dispatch Vận Đơn', f.waybill)`
- **Render rules**: Displays waybill, carrierName, serviceType, cost, status.

## UI/UX REQUIREMENTS & SPECIFICS
- Uses `ConfirmDialog` for actions, except "In Tem Barcode" which directly notifies.
- Needs to preserve the `fetch('/api/products')` behavior.
- Needs to preserve all state arrays exactly.
- Keep `onNotify` payloads identical.
