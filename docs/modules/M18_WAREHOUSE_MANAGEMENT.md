# M18 — Warehouse Management & Spatial Facilities Master Hub

**Module ID:** `M18`  
**Module Name:** Warehouse Management, 5-Tier Spatial Topology & Weight Safety Control  
**Business Group:** `03. WAREHOUSE & LOGISTICS`  
**Workspace ID:** `WS06_WAREHOUSE` | **Primary Route:** `/warehouse`  
**Mounted UI Component:** `src/components/workspaces/WarehouseManagementWorkspace.tsx`  
**Sub-Components:**
- `src/modules/inventory/m18-warehouse/components/WarehouseFacilitiesMasterTab.tsx`
- `src/modules/inventory/m18-warehouse/components/WarehouseSpatialTopologyView.tsx`
- `src/modules/inventory/m18-warehouse/components/WarehouseSlottingSimulatorView.tsx`
- `src/modules/inventory/m18-warehouse/components/WarehouseInboundTab.tsx`
- `src/modules/inventory/m18-warehouse/components/WarehouseOutboundTab.tsx`
- `src/modules/inventory/m18-warehouse/components/WarehouseInternalOpsTab.tsx`
- `src/modules/inventory/m18-warehouse/components/WarehouseStockControlTab.tsx`
- `src/modules/inventory/m18-warehouse/components/WarehouseTraceabilityTab.tsx`
- `src/modules/inventory/m18-warehouse/components/WarehouseAnalyticsTab.tsx`

---

## 1. Executive Summary & Purpose
Phân hệ **M18 — Warehouse Management Hub** chịu trách nhiệm quản trị toàn diện cấu trúc không gian vật lý và vận hành kho thông minh cho NexusSync ERP:
1. **Quản lý Cơ sở Kho Vận (Facilities Master):** Kho tổng chính, Kho chi nhánh, Kho lạnh, Kho trung chuyển, Kho ngoại quan.
2. **Cấu trúc Không gian 5 Tầng (5-Tier Spatial Topology):** `Warehouse` ➔ `Zone` ➔ `Aisle` ➔ `Rack` ➔ `Shelf / Bin`.
3. **Kiểm soát Tải trọng & Thể tích Kết cấu (Weight & Volume Capacity Safety Guard):** Chặn cứng (`BLOCKED_OVER_CAPACITY`) khi tổng tải trọng mới vượt quá sức chịu tải định mức của giá kệ (kg); cảnh báo mức tải an toàn (≥ 80%).
4. **Kiểm tra Tương thích Điều kiện Bảo quản (Zone Compatibility Engine):** Ràng buộc điều kiện bảo quản của sản phẩm (`COLD`, `FROZEN`, `DRY`, `BULKY`, `QUARANTINE_ONLY`, `HAZMAT`) với đặc tính kỹ thuật của khu vực lưu kho (`ZONE_COLD`, `ZONE_DRY`, `ZONE_BULKY`, `ZONE_QUARANTINE`).
5. **Mô phỏng Gán Vị trí (Slotting Simulator):** Thẩm định an toàn tự động theo thời gian thực trước khi ghi nhận phân bổ hàng tồn kho.
6. **Mã vạch & QR Code Đa cấp (Barcode / QR Serialization):** In ấn và truy vết mã vạch ô kệ, mã vị trí chuẩn công nghiệp.

---

## 2. Domain Authority Boundaries
- **Exclusive Authority:**
  - `WarehouseSpatialService`: Thẩm quyền duy nhất quản lý cấu trúc không gian cây vị trí, tính toán dung lượng tải trọng thực tế, kiểm định tương thích Zone và gán vị trí ô kệ.
  - `InventoryService.postTransaction()`: Thẩm quyền đơn nhất duy nhất ghi nhận tăng/giảm tồn kho định lượng.
  - Tuân thủ tuyệt đối **Rule #03 & Rule #19**: Không tự ý ghi trực tiếp bảng tồn kho, 100% modal sử dụng `ConfirmDialog.tsx` (Zero `window.alert` / `window.confirm`).

---

## 3. Database Schema & Data Models

### 3.1 Bảng `warehouses`
- `id` (INTEGER PRIMARY KEY), `code` (VARCHAR), `name` (VARCHAR), `type` (VARCHAR), `address` (TEXT), `is_active` (BOOLEAN), `is_default` (BOOLEAN), `storage_capacity_m2` (REAL), `total_zones` (INTEGER), `total_bins` (INTEGER), `manager_name` (VARCHAR), `contact_phone` (VARCHAR).

### 3.2 Bảng `warehouse_locations` (5-Tier Spatial Hierarchy)
- `id` (INTEGER PRIMARY KEY), `warehouse_id` (INTEGER REFERENCES warehouses), `type` (VARCHAR: `ZONE` | `AISLE` | `RACK` | `SHELF` | `BIN`), `parent_id` (INTEGER REFERENCES warehouse_locations).
- `code` (VARCHAR), `name` (VARCHAR), `description` (TEXT), `is_active` (BOOLEAN).
- `zone_type` (VARCHAR: `GENERAL` | `DRY` | `COLD` | `BULKY` | `QUARANTINE` | `HAZMAT`).
- `max_weight_capacity` (REAL — Sức chịu tải tối đa kg), `current_weight` (REAL — Tải trọng hiện hữu kg).
- `max_volume_capacity` (REAL — Thể tích tối đa m³), `current_volume` (REAL — Thể tích hiện hữu m³).
- `barcode` (VARCHAR), `aisle_code` (VARCHAR), `rack_code` (VARCHAR), `shelf_code` (VARCHAR), `bin_code` (VARCHAR).
- `temperature_min` (REAL), `temperature_max` (REAL), `humidity_max` (REAL).
- `is_picking` (BOOLEAN), `is_receiving` (BOOLEAN), `is_quarantine` (BOOLEAN), `is_damaged` (BOOLEAN).

### 3.3 Bảng `products` (Enriched Constraints)
- `storage_condition` (VARCHAR: `DRY` | `COLD` | `FROZEN` | `BULKY` | `QUARANTINE_ONLY` | `HAZMAT`).
- `unit_weight_kg` (REAL — Khối lượng đơn vị).
- `unit_volume_m3` (REAL — Thể tích đơn vị).

---

## 4. API Catalog & Endpoint Contract

| Phương thức | Đường dẫn API | Chức năng | Phân quyền & Cache |
|---|---|---|---|
| `GET` | `/api/warehouses` | Danh sách cơ sở kho vận | Master Data Cache (120s) |
| `POST` | `/api/warehouses` | Thêm cơ sở kho mới | Invalidate Cache |
| `PUT` | `/api/warehouses/:id` | Cập nhật thông tin cơ sở kho | Invalidate Cache |
| `GET` | `/api/inventory/warehouses/metrics` | Tổng hợp chỉ số KPI kho vận | Real-time Aggregation |
| `GET` | `/api/warehouse-locations` | Danh sách phẳng vị trí kho | Query `?warehouseId=` |
| `GET` | `/api/warehouse-locations/tree/:warehouseId` | Cây không gian 5 tầng đệ quy | Computed Utilization Pct |
| `POST` | `/api/warehouse-locations` | Tạo mới vị trí (Zone/Aisle/Rack/Bin) | Invalidate Cache |
| `PUT` | `/api/warehouse-locations/:id` | Cập nhật vị trí & giới hạn tải | Invalidate Cache |
| `DELETE` | `/api/warehouse-locations/:id` | Xóa vị trí (kiểm tra an toàn con & tồn kho) | Invalidate Cache |
| `POST` | `/api/warehouse-locations/validate-placement` | Thẩm định Zone Compatibility & Weight Capacity | Real-time Pre-validation Engine |
| `POST` | `/api/warehouse-locations/assign-stock` | Gán hàng vào ô kệ & cộng tải trọng thực tế | Invalidate Cache & Stock Sync |
| `GET` | `/api/warehouse-locations/barcode/:code` | Quét & tra cứu vị trí theo Barcode/QR | Exact match lookup |

---

## 5. UI/UX Standards & Enterprise Conformity (Rule #19 & Rule #20)
- **Thiết kế L0-L4**: Phân tầng hoàn chỉnh từ Brand Shell, Command Bar, KPI Metrics Strip, Filter Toolbar, Hierarchical Tree Grid đến Drawer 360 & Print Label Modal.
- **Định dạng số**: 100% số lượng, khối lượng, tỷ lệ phần trăm sử dụng `font-mono tabular-nums text-right`.
- **Thang màu Semantic Status**:
  - `COLD`: Cyan Badge (`bg-cyan-50 text-cyan-700 border-cyan-200`)
  - `DRY`: Amber Badge (`bg-amber-50 text-amber-700 border-amber-200`)
  - `BULKY`: Purple Badge (`bg-purple-50 text-purple-700 border-purple-200`)
  - `QUARANTINE`: Rose Badge (`bg-rose-50 text-rose-700 border-rose-200`)
  - `Weight Load < 70%`: Emerald Bar (`bg-emerald-500`)
  - `Weight Load 70-89%`: Amber Bar (`bg-amber-500`)
  - `Weight Load >= 90%`: Rose Bar (`bg-rose-500`)
- **Đối thoại xác nhận:** Toàn bộ tác vụ xóa vị trí, chuyển trạng thái kho, ghi nhận xếp hàng có cảnh báo đều thông qua component `/src/components/common/ConfirmDialog.tsx`.
