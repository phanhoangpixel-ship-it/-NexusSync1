# M23 Feature Baseline (Before Sync)

## 1. Overview
The Serials & IMEI Workspace (M23) is a single-file component `M23SerialsWorkspace.tsx` that manages the lifecycle of individual serial numbers and IMEIs.

## 2. API Endpoints
- `GET /api/products`: Fetches product catalog for creating new serials. Fallbacks to `ENTERPRISE_MASTER_PRODUCTS` if unavailable.

## 3. Tabs & Functionality

### Tab: "serials" (Danh Sách Serial / IMEI)
- **Search & Filter**: Search by serialNumber, productName, sku, customerName. Filter by status (ALL, IN_STOCK, SOLD, WARRANTY, DEFECTIVE).
- **Table Data**: Displays Serial/IMEI, SKU & Product, Warehouse, Status, Customer/Owner, Warranty End, Actions.
- **Row Actions**:
  - Click on Serial Number: Opens 360 Inspector Modal.
  - Action buttons based on status:
    - IN_STOCK: `Xuất bán` (SELL), `Chuyển kho` (TRANSFER)
    - SOLD: `Bảo hành` (WARRANTY)
    - WARRANTY: `Trả máy` (RESOLVE_WARRANTY), `Báo hỏng` (DEFECTIVE)
    - DEFECTIVE: `Tái nhập kho` (IN_STOCK - Quick Update)
  - Eye icon button: Opens 360 Inspector Modal.
- **Export CSV**: Exports the current filtered list to CSV.
- **Print Labels**: Opens the 360 Inspector Modal for the first item in the list (mock action).

### Tab: "profiles" (Hồ Sơ Ngành Hàng)
- Displays a grid of `profiles` (SerialProfile) with code, prefix, name, description, warranty months, and category type.
- Read-only display.

### Tab: "history" (Nhật Ký Vòng Đời)
- Displays an aggregated audit trail from all serials' `timeline` properties, sorted by timestamp descending.
- Shows event type, serial number, SKU, timestamp, title, description, actor, reference doc, and location.

## 4. Modals & Drawers

### 360 Degree Serial Inspector Modal (`selectedSerial`)
- Displays barcode, details (product, warehouse, warranty, customer), and the timeline (Data Lineage) for a specific serial.
- Includes quick actions at the bottom mirroring the table actions (Sell, Warranty, Resolve Warranty, Transfer) based on status.
- "In Nhãn Serial" button (triggers a success notification).

### State Transition Action Modal (`actionModalType`)
- Modal for processing state changes: SELL, WARRANTY, RESOLVE_WARRANTY, TRANSFER, DEFECTIVE.
- Form fields vary by action:
  - SELL: Customer Name, Order Number.
  - TRANSFER: Destination Warehouse select.
  - All: Reason textarea.
- Submit triggers `ConfirmDialog` before applying the state change and appending a timeline event.

### Register Serial Modal (`internalCreateModal`)
- Triggered by "Đăng Ký Serial / IMEI" button or primary action.
- Form fields: Serial No, SKU (updates Product Name), Warehouse, Notes.
- Appends a new IN_STOCK serial with a CREATED timeline event.

## 5. System States & Rule #19
- All state-changing actions (SELL, WARRANTY, RESOLVE_WARRANTY, TRANSFER, DEFECTIVE, and quick status update) use `ConfirmDialog` to confirm the action. No `window.alert` or `window.confirm` is used.
- Derived data: Timeline events are dynamically extracted from serial items and aggregated in the History tab. Warranty End date is derived based on months (or hardcoded in mock data).

## 6. Validations & Constraints
- Required fields in modals (Customer Name, Order Number, Serial No).
- Timeline events dynamically track the actor and timestamp.
