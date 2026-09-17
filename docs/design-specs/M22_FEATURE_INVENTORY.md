# BÁO CÁO KIỂM KÊ TÍNH NĂNG THIẾT KẾ HIỆN CÓ — MODULE M22 (LOTS & BATCHES)
## Quản Lý Hạn Sử Dụng, Thuật Toán FEFO/FIFO & Truy Vết Thu Hồi Theo Lô
**Hệ thống:** NexusSync ERP — Core WMS & Quality Traceability Subsystem  
**Mã phân hệ:** `M22` | **Workspace ID:** `WS10_LOTS` | **Đường dẫn UI:** `src/modules/inventory/m22-lots/components/M22LotsBatchesWorkspace.tsx`  
**Ngày lập báo cáo:** 16/09/2026 | **Phiên bản:** v2.4-Enterprise  

---

## 1. BẢNG KIỂM KÊ CHI TIẾT TỪNG TÍNH NĂNG / WIDGET THEO TAB VÀ MÀN HÌNH

| Tab/Màn hình | Tính năng / Widget | Trạng thái | API liên kết | Bảng DB liên quan | Vai trò nghiệp vụ |
|---|---|---|---|---|---|
| **L0 Header & Workspace Banner** | Hiển thị thông tin phân hệ M22, Counter tổng số lô, Trạng thái đồng bộ real-time | **Hoạt động đầy đủ** | `GET /api/inventory/lots` | `lots`, `lot_balances` | Định danh phân hệ, chỉ số tổng quan lô hàng khả dụng và tình trạng kết nối |
| **Tab 1: Danh Mục Lô (Master Tab)** | Danh sách lưới dữ liệu lô hàng (DataGrid) phân trang | **Hoạt động đầy đủ** | `GET /api/inventory/lots` | `lots`, `lot_balances`, `products` | Giám sát toàn bộ các lô hàng trong kho, số lượng ban đầu, số lượng còn lại, vị trí Bin |
| **Tab 1: Danh Mục Lô (Master Tab)** | Tìm kiếm nhanh SKU/Tên/Mã Lô & Lọc trạng thái (ACTIVE, EXPIRED_SOON, EXPIRED, QUARANTINE, DEPLETED) | **Hoạt động đầy đủ** | Xử lý Client + API Query `GET /api/inventory/lots` | `lots` | Tra cứu tức thời lô hàng theo mã và phân loại trạng thái rủi ro hạn dùng |
| **Tab 1: Danh Mục Lô (Master Tab)** | Bộ lọc nâng cao: Kho hàng, Phân khu Zone (A/B/C/D), Ngày sản xuất, Hạn dùng theo chu kỳ | **Hoạt động đầy đủ** | Client Filter trên dataset đã đồng bộ | `lots`, `warehouses`, `warehouse_locations` | Thu hẹp phạm vi kiểm soát lô theo từng khu vực kho vật lý và thời gian |
| **Tab 1: Danh Mục Lô (Master Tab)** | Form tạo lô mới (Modal Khởi tạo Lô & Batch No) | **Hoạt động đầy đủ** | `POST /api/inventory/lots` | `lots`, `lot_balances`, `audit_logs` | Cấp phát số lô mới khi nhập kho hoặc phân rã đóng gói, ghi nhận NSX/HSD |
| **Tab 1: Danh Mục Lô (Master Tab)** | Xuất danh sách Lô ra file Excel (`.xlsx`) | **Hoạt động đầy đủ** | Client XLSX Export Engine | `lots` | Trích xuất báo cáo tồn lô phục vụ kiểm kê nội bộ và bàn giao ca |
| **Tab 1: Danh Mục Lô (Master Tab)** | Chuyển đổi trạng thái Lô nhanh (Active &rarr; Quarantine / Hold) | **Hoạt động đầy đủ** | `PATCH /api/inventory/lots/:id/status` & `POST /api/inventory/lots/:id/status` | `lots`, `audit_logs` | Niêm phong cách ly lô hàng nghi ngờ lỗi hoặc quá hạn sử dụng |
| **Tab 2: Thuật Toán FEFO (FEFO Tab)** | Bảng sắp xếp danh sách Lô theo hạn sử dụng tăng dần (FEFO Ranking Grid) | **Hoạt động đầy đủ** | `GET /api/inventory/lots` | `lots`, `lot_balances` | Hiển thị thứ tự ưu tiên xuất kho theo ngày hết hạn (cận date xuất trước) |
| **Tab 2: Thuật Toán FEFO (FEFO Tab)** | Bộ mô phỏng phân bổ xuất kho FEFO (FEFO Simulator Widget) | **Hoạt động đầy đủ** | `POST /api/inventory/lots/fefo-simulate` | `lots`, `lot_balances`, `products` | Tính toán bóc tách đa lô (Multi-Lot Split) và đề xuất lộ trình nhặt hàng theo thứ tự HSD |
| **Tab 2: Thuật Toán FEFO (FEFO Tab)** | Cảnh báo lô cận hạn (Near-Expiry Alert <= 45 ngày) | **Hoạt động đầy đủ** | Phân tích ngày tự động từ API | `lots` | Cảnh báo thủ kho và điều phối viên để giải phóng hàng cận date |
| **Tab 3: Truy Vết Nguồn Gốc (Traceability)** | Đồ thị D3 dạng cây / mạng lưới (Force-directed Graph D3) | **Hoạt động đầy đủ** | `GET /api/inventory/lots/:id/trace` | `lots`, `stock_ledger`, `manufacturing_orders`, `sales_orders` | Trực quan hóa chuỗi liên kết: Nhà cung cấp &rarr; Lô NVL &rarr; Lệnh sản xuất (WO) &rarr; Thành phẩm (FG) &rarr; Đơn hàng bán (SO) |
| **Tab 3: Truy Vết Nguồn Gốc (Traceability)** | Bảng chi tiết Lệnh sản xuất tiêu thụ & Đơn hàng liên đới | **Hoạt động đầy đủ** | `GET /api/inventory/lots/:id/trace` | `manufacturing_orders`, `sales_orders` | Xem chi tiết số lượng tiêu hao theo từng WO và thông tin khách hàng đã giao |
| **Tab 3: Truy Vết Nguồn Gốc (Traceability)** | Báo cáo Thu hồi Sản phẩm (Recall Impact Report) 2 chiều Upstream & Downstream chuyên sâu | **UI có nhưng thiếu API** | Hiện đang gọi mock data từ generator cục bộ, thiếu endpoint chuyên biệt truy vết thu hồi 2 chiều cấp tốc | `lot_genealogies`, `stock_ledger`, `sales_orders`, `purchase_orders` | Báo cáo danh sách khách hàng cần liên hệ khẩn cấp khi phát hiện lô thành phẩm/nguyên liệu bị lỗi |
| **Drawer Drilldown: Lịch Sử Lô** | Chi tiết thông số lô hàng (SKU, Kho, Tồn vật lý, Tồn khả dụng, Tồn bảo lưu) | **Hoạt động đầy đủ** | `GET /api/inventory/lots/:id` | `lots`, `lot_balances`, `products` | Kiểm tra thông tin chuyên sâu của từng lô |
| **Drawer Drilldown: Lịch Sử Lô** | Sổ cái biến động kho theo Lô (Stock Ledger Movement History) | **Hoạt động đầy đủ** | `GET /api/inventory/lots/:id/ledger` | `stock_ledger`, `lots` | Xem nhật ký nhập/xuất/điều chuyển/cách ly của riêng số lô đó |
| **Drawer Drilldown: Lịch Sử Lô** | Quản lý Mã vạch & QR Code Lô (In tem nhãn nhặt hàng) | **Hoạt động đầy đủ** | Xử lý hiển thị QR / In ấn trực tiếp | `lots` | In mã vạch phục vụ quét mã vạch Barcode/PDA trong kho |
| **Drawer Drilldown: Lịch Sử Lô** | Thao tác Khóa lô / Giải phóng lô cách ly (Hold/Release Quarantine) qua ConfirmDialog | **Hoạt động đầy đủ** | `PATCH /api/inventory/lots/:id/status` & `POST /api/inventory/lots/:id/status` | `lots`, `audit_logs` | Khóa cách ly lô hàng để kiểm định KCS hoặc mở khóa khi đã kiểm tra đạt chuẩn |

---

## 2. XÁC NHẬN HIỆN TRẠNG 7 NHÓM TÍNH NĂNG CỐT LÕI

### 1. Quản lý vòng đời Lô/Batch
- **Hiện trạng:** **HOẠT ĐỘNG ĐẦY ĐỦ**.
- **Chi tiết:** Đã có cấu trúc bảng `lots` và `lot_balances` trong `db/schema.ts`. Có endpoint `GET /api/inventory/lots`, `POST /api/inventory/lots`, hỗ trợ đầy đủ các trường `lotNumber`, `sku`, `productName`, `mfgDate`, `expDate`, `initialQty`, `currentQty`, `uom`, `status`, `supplierLot`.
- **Hạ tầng Domain:** `InventoryService.postTransaction()` cập nhật tự động `lot_balances` khi có tham số `lotId`.

### 2. Cảnh báo hạn sử dụng theo ngưỡng (Near-Expiry & Expired)
- **Hiện trạng:** **HOẠT ĐỘNG ĐẦY ĐỦ**.
- **Chi tiết:** Tính toán tự động số ngày còn lại (`daysToExpiry = Math.ceil((exp - now) / 86400000)`).
  - Đã hết hạn (`diffDays < 0`): Badge màu Rose (`bg-rose-500 text-white`), viền đỏ, nhãn "ĐÃ HẾT HẠN".
  - Cận date (`0 <= diffDays <= 45`): Badge màu Amber (`bg-amber-500 text-slate-950 animate-pulse`), viền vàng, nhãn "CẬN DATE".
  - An toàn (`diffDays > 45`): Badge màu Emerald (`bg-emerald-100 text-emerald-800`), nhãn "Đạt Chuẩn".

### 3. Thuật toán FEFO (First-Expired-First-Out)
- **Hiện trạng:** **ĐÃ CÓ TRONG SERVICE & SIMULATOR**.
  - Tầng Service: `InventoryService.suggestFifoFefoLots()` sắp xếp theo `expiryDate ASC` và tự động lọc bỏ các lô `QUARANTINED`, `BLOCKED`, `EXPIRED`, `HOLD`.
  - Tầng API: Endpoint `POST /api/inventory/lots/fefo-simulate` trả về danh sách phân bổ bóc tách đa lô và lộ trình nhặt hàng.
  - Tầng UI: Tab `FEFO Tab` cho phép mô phỏng tức thời theo SKU và số lượng cần xuất.

### 4. Thuật toán FIFO (First-In-First-Out)
- **Hiện trạng:** **ĐÃ CÓ TRONG SERVICE**.
  - `InventoryService.suggestFifoFefoLots({ strategy: 'FIFO' })` sắp xếp theo `manufactureDate ASC` hoặc `createdAt ASC`.

### 5. Cấu hình per-SKU
- **Hiện trạng:** **HOẠT ĐỘNG**.
  - Bảng `products` có cờ `isLotTracked` (boolean).
  - Tầng service kiểm tra nếu sản phẩm có theo dõi lô thì yêu cầu phân bổ lô hợp lệ.

### 6. Truy vết thu hồi 2 chiều (Recall Traceability Upstream & Downstream)
- **Hiện trạng:** **CÓ GIAO DIỆN & API TRACE GRAPH NHƯNG CẦN NÂNG CẤP BÁO CÁO THU HỒI CẤP TỐC CHUYÊN SÂU**.
  - Hiện có: Đồ thị D3 (`GET /api/inventory/lots/:id/trace`) hiển thị luồng từ Nhà cung cấp &rarr; Lô NVL &rarr; Lệnh sản xuất &rarr; Thành phẩm &rarr; Đơn hàng bán.
  - Cần bổ sung: Báo cáo danh sách khách hàng và lệnh sản xuất bị ảnh hưởng trực tiếp (Recall Action Sheet) với khả năng khóa hàng loạt và xuất biên bản thu hồi compliance ISO/IATF.

### 7. Khóa / Cách ly lô (Lot Hold/Quarantine)
- **Hiện trạng:** **HOẠT ĐỘNG ĐẦY ĐỦ**.
  - Có các endpoint `PATCH /api/inventory/lots/:id/status` và `POST /api/inventory/lots/:id/status` hỗ trợ các trạng thái `AVAILABLE`, `QUARANTINE`, `BLOCKED`, `EXPIRED`.
  - Giao diện thao tác qua hộp thoại xác nhận `ConfirmDialog.tsx` tuân thủ Rule #19, ghi nhận Audit Log đầy đủ.
