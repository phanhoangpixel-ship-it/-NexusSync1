# HƯỚNG DẪN AI GEMINI BUILD LẠI GIAO DIỆN HỆ THỐNG NEXUSSYNC ERP (L0 - L5)

Dưới đây là gói dữ liệu **ERP Lõi** (`ERP_loi_core_engines.tar.gz`) chứa toàn bộ các Động cơ Nghiệp vụ (Engines), Cấu trúc Cơ sở Dữ liệu (Drizzle Schema), Quy tắc Nghiệp vụ Bắt buộc (Business Rules) và Đặc tả Thiết kế UI/UX dùng để xây dựng lại giao diện chuẩn cho hệ thống NexusSync ERP.

---

## 1. Cấu trúc Gói ERP Lõi
- **`engines/`**:
  - `inventoryService.ts`: Tồn kho 3 trạng thái (Physical, Allocated, Available), Hạch toán sổ cái `stock_ledger`.
  - `accountingEngine.ts`: Động cơ Kế toán kép (Double-Entry Ledger & GL).
  - `costingEngine.ts`: Động cơ Tính giá vốn COGS & Định giá kho.
  - `financeEngine.ts`: Quản lý Tài chính, Tiền mặt, Ngân hàng & Chuyển tiền.
  - `orchestrationEngine.ts`: Điều phối chuỗi cung ứng (P2P, O2C, WMS).
  - `processEngine.ts`: Trạng thái chứng từ & State Machine.
  - `authorityManager.ts`: Kiểm soát phân quyền RBAC.
  - `stockAdjustmentService.ts`: Kiểm kê & Xử lý chênh lệch kho.
  - `taskManager.ts`: Quản lý & Định tuyến công việc.
  - `serialEngine.ts`: Quản lý Mã Lô & Serial.
  - `WorkspaceAggregationService.ts`: Báo cáo & Tổng hợp 29 Workspaces.
- **`db/`**:
  - `schema.ts`: Định nghĩa toàn bộ cấu trúc bảng SQLite Drizzle.
  - `bootstrap.ts`: Dữ liệu gốc & Ma trận Quyền RBAC.
- **`docs/`**:
  - `BUSINESS_RULES.md`: 21 Quy tắc Bắt buộc (Bất biến Completed, Masking Blind Count, No Browser Alert,...).
  - `API_CATALOG.md`: Danh mục Endpoints API & Permissions.
  - `MODULE_MAP.md`: Định vị 29 Workspaces & 40 Phân hệ.

---

## 2. Toàn Bộ Đặc Tả Thiết Kế UI/UX & Danh Sách Tính Năng

### A. Kiến Trúc Vỏ Hệ Thống Đa Tầng L0 – L5 (System Shell Architecture)
Hệ thống được thiết kế chuẩn mực theo mô hình vỏ hệ thống đa tầng 6 lớp dành cho các phần mềm ERP quy mô lớn:

- **L0 – Sticky Header Bar (56px)**:
  - **Thương hiệu & Phiên bản**: Logo Nexus ERP (v1.0-Frozen).
  - **Command Omnibar (`⌘K` / `Ctrl+K`)**: Thanh tìm kiếm siêu tốc toàn hệ thống (mã chứng từ, SKU, phân hệ, chức năng).
  - **Bộ chuyển đổi Chi nhánh (Branch Selector)**: Hỗ trợ chuyển đổi tức thì ngữ cảnh làm việc (Trụ sở chính, Chi nhánh, Kho Logistics...).
  - **Bộ chuyển đổi Vai trò RBAC (Role Switcher)**: Chuyển đổi linh hoạt giữa 6 vai trò người dùng (CFO/Kế toán trưởng, ERP Admin, Thủ kho trưởng, Giám đốc mua hàng, Giám đốc kinh doanh, Quản lý sản xuất).
  - **Thanh công cụ phụ trợ**: Nút mở Cẩm nang SOP, Hàng chờ công việc WorkQueue Drawer, và Hồ sơ người dùng / Đăng xuất.

- **L1 – Primary Navigation Sidebar (254px)**:
  - Thiết kế tông màu tối cao cấp (`#141C2E`), phân chia chuẩn mực thành các nhóm danh mục: `MY WORK`, `OPERATIONS`, `FINANCE / GL`, `GOVERNANCES`, `HỆ THỐNG`.
  - Hỗ trợ thu gọn / mở rộng danh mục con, hiển thị mã phân hệ (M01–M40) và responsive drawer trên thiết bị di động.

- **L2 – Workspace Router & Navigation**:
  - Bộ định tuyến linh hoạt chuyển đổi qua lại giữa 29 Workspaces theo từng phân hệ nghiệp vụ.

- **L3 – Domain Header & Action Bar**:
  - Hiển thị mã phân hệ (Badge Mono), tên phân hệ, tên Domain, cùng bộ nút thao tác chuẩn: In / Xuất PDF (`window.print()`), Refresh dữ liệu, và Mở nhanh SOP.

- **L4 – Main Work Area (Khu vực làm việc trung tâm)**:
  - Bảng dữ liệu Grid, Tháp chỉ số KPI, Sóng hàng WMS Wave, Quầy bán lẻ POS Thu ngân, Form nhập chứng từ...

- **L5 – Context Rail (Panel bên phải 320px)**:
  - **Tab Lineage (Ngữ mạch chứng từ)**: Truy xuất nguồn gốc liên kết thực thời giữa các chứng từ (VD: PO → GRN → GL → Task SLA).
  - **Tab Audit (Nhật ký kiểm toán)**: Hiển thị chuỗi Hash Checksum SHA-256 bảo mật chống gian lận.
  - **Tab Ledger (Bút toán sổ cái)**: Tra cứu nhanh các định khoản Nợ/Có đối ứng liên quan đến chứng từ đang chọn.

---

### B. Quy Chuẩn Thiết Kế UI/UX & Nguyên Tắc Anti-Slop

1. **Màu sắc Trạng thái & Chuẩn SLA**:
   - Màu sắc nền trung tính, chuyên nghiệp (`#F1F5F9` cho Light Canvas, `#141C2E` cho Sidebar).
   - Hệ thống 4 màu sắc trạng thái nghiêm ngặt: Danger (Đỏ), Warning (Vàng cam), Info (Xanh Indigo/Lam), Success (Xanh lục Emerald).

2. **Định dạng Phông chữ Monospace cho Dữ liệu Số**:
   - 100% các dữ liệu dạng mã (mã PO `PO-2026-XXXX`, mã SO, mã GRN, mã Bin `A-04-B2`, mã SKU), số tiền VND, số lượng tồn kho và tài khoản kế toán (156, 331, 131, 511) đều dùng font chữ Monospace giúp chống nhầm lẫn và dóng hàng con số chuẩn xác.

3. **Tuân thủ Rule #19 - Hộp thoại Xác nhận `ConfirmDialog.tsx`**:
   - Thay thế 100% các lệnh `alert` / `confirm` mặc định của trình duyệt bằng thành phần `ConfirmDialog` tùy chỉnh với hiệu ứng Backdrop blur, Icon cảnh báo theo cấp độ, Focus trap và phím tắt Escape để đóng modal an toàn.

4. **Tương Thích Đa Thiết Bị, Đa Hệ Điều Hành & Dynamic Responsive Scaling**:
   - **Đa hệ điều hành & Nền tảng**: Hoạt động mượt mà và nhất quán trên Windows, macOS, Linux, iOS, Android (xử lý phím tắt linh hoạt `⌘K` trên Mac và `Ctrl+K` trên Windows/Linux).
   - **Tự động co giãn theo độ phân giải màn hình**: Responsive thích ứng từ Mobile (375px+), Tablet (768px+), Laptop/Desktop (1024px, 1280px, 1440px) đến màn hình siêu rộng (Ultra-wide 2K/4K).
   - **Tối ưu trải nghiệm Mobile/Tablet**:
     - Sidebar L1 chuyển thành Mobile Off-canvas Drawer đóng/mở linh hoạt.
     - Context Rail L5 chuyển thành Bottom Sheet / Modal di động trên màn hình hẹp.
     - Grid Data Table tự động điều chỉnh cuộn ngang (`overflow-x-auto`) với Sticky Columns cố định mã chứng từ/thao tác.
     - Nút bấm và vùng tương tác đạt chuẩn tối thiểu 44px touch target cho thao tác chạm cảm ứng di động.

---

### C. Danh Sách Chi Tiết Các Phân Hệ & Module Chức Năng Hiện Có Trong App (M01 - M40 & UI Components)

#### 1. Danh Sách 40 Phân Hệ Nghiệp Vụ Theo ModuleRegistry (M01 – M40)
- **M01 - Workspace Hub (`/workspace`)**: Trung tâm điều phối toàn diện, WorkQueue hàng chờ công việc SLA theo vai trò, tháp KPI sparklines & ma trận 29 Workspaces.
- **M02 - CRM (`/crm`)**: Quản lý quan hệ khách hàng, leads, cơ hội bán hàng & phễu chuyển đổi.
- **M03 - Customers (`/customers`)**: Danh mục khách hàng B2B, quản lý hạn mức công nợ & nhóm khách hàng.
- **M04 - Sales Orders (`/sales`)**: Đơn đặt hàng B2B, giữ chỗ tồn kho (Allocated Qty), quy trình Order-to-Cash (O2C) & hàng chờ xử lý xuất kho `SalesOrderFulfillmentQueue.tsx`.
- **M05 - Purchase Orders (`/purchase`)**: Đơn mua hàng PO nhà cung cấp, quy trình Procure-to-Pay (P2P) & luồng phê duyệt mua hàng.
- **M06 - Suppliers (`/suppliers`)**: Hồ sơ nhà cung cấp SRM, điều khoản thanh toán & hạn mức nợ.
- **M07 - Inventory Core (`/inventory`)**: Quản lý tồn kho 3 trạng thái (`Physical`, `Allocated`, `Available`), định giá tồn kho & sổ cái kho `stock_ledger`.
- **M08 - Warehouse Ops (`/warehouse`)**: Vận hành kho bãi, phiếu nhập kho, phiếu xuất kho & sơ đồ vị trí Bin/Rack.
- **M09 - Stocktake (`/stocktake`)**: Kiểm kê kho định kỳ, kiểm đếm mù (Blind Stocktake), báo cáo chênh lệch variance với modal `StocktakeCreateModal.tsx` và `StocktakeDetailModal.tsx`.
- **M10 - Stock Adjustment (`/stock-adjustment`)**: Xử lý phiếu điều chỉnh tăng/giảm kho với các component chuyên dụng: `AdjustmentFormModal`, `AdjustmentApproveConfirmModal`, `AdjustmentRejectModal`, `AdjustmentPrintVoucherModal`, `AdjustmentDetailDrawer`, `AdjustmentTaskPopover`, `AdjustmentGuideModal`.
- **M11 - Internal Transfers (`/transfer`)**: Yêu cầu & phê duyệt chuyển kho nội bộ giữa các chi nhánh, theo dõi hàng đi đường (In-transit).
- **M12 - Lots & Batches (`/lots`)**: Quản lý lô sản xuất, ngày sản xuất, hạn sử dụng (Expiry Date) & cảnh báo xuất hàng FEFO/FIFO.
- **M13 - Serials & IMEI (`/serials`)**: Truy xuất & quản lý mã Serial/IMEI chi tiết cho từng đơn vị sản phẩm kèm modal nhập mã `SerialInputModal.tsx`.
- **M14 - WMS Extended (`/wms-extended`)**: Kho vận nâng cao 6 Tab Workbench: Wave Picking (Lấy hàng theo sóng), Replenishment (Chắp hàng), Bin Allocation & Blind Stocktake, Packing & LPN Package, Dock Appointment (Lịch xe tải cập cầu), Carrier Freight Rates (Bảng giá cước vận tải).
- **M15 - Manufacturing & BOM (`/manufacturing`)**: Điều hành sản xuất MES, Lệnh sản xuất (MO), Định mức nguyên vật liệu BOM & xuất nhập vật tư.
- **M16 - Supply Chain SCM (`/supply-chain`)**: Quy hoạch cung ứng MRP, dự báo nhu cầu & tháp cân bằng cung cầu SCM.
- **M17 - EAM Asset Management (`/eam`)**: Quản lý thiết bị tài sản, lập lịch bảo trì định kỳ PM & danh mục phụ tùng thay thế.
- **M18 - Projects (`/projects`)**: Quản lý dự án, cấu trúc WBS, tiến độ công việc & tính toán chi phí dự án.
- **M19 - Logistics & Fleet (`/logistics`)**: Hậu cần & vận tải, quản lý chuyến xe delivery, điều vận 3PL & mã vận đơn.
- **M20 - HR & Payroll (`/hr`)**: Quản trị nhân sự HRM, hồ sơ nhân viên, chấm công, bảo hiểm & bảng lương tự động.
- **M21 - Finance & GL (`/finance`)**: Sổ cái tổng hợp GL (General Ledger), bút toán định khoản kép (Single Writer GL) & Bảng cân đối kế toán.
- **M22 - Invoices AR/AP (`/invoices`)**: Quản lý hóa đơn phải thu AR, hóa đơn phải trả AP & quản lý thuế VAT.
- **M23 - Payments & Cash (`/payments`)**: Quản lý quỹ tiền mặt, phiếu thu/phiếu chi & dòng tiền.
- **M24 - Bank Reconciliation (`/bank-reconciliation`)**: Đối soát tài khoản ngân hàng, sổ phụ ngân hàng & tích hợp VietQR.
- **M25 - Consolidation (`/financial-consolidation`)**: Hợp nhất báo cáo tài chính đa chi nhánh & tập đoàn.
- **M26 - Sales Commission (`/commission`)**: Quản lý hoa hồng bán hàng, thưởng doanh số & chiết khấu bậc thang.
- **M27 - Returns & RMA (`/returns`)**: Đổi trả hàng RMA từ khách hàng hoặc trả hàng về nhà cung cấp.
- **M28 - POS Retail (`/pos`)**: Quầy bán lẻ & thu ngân POS, quét Barcode/SKU, thanh toán đa phương thức & in hóa đơn trực tiếp.
- **M29 - Strategic Sourcing (`/strategic-sourcing`)**: Đấu thầu mua hàng, yêu cầu báo giá RFQ & chào giá nhà cung cấp.
- **M30 - SRM Supplier Mgmt (`/srm`)**: Đánh giá thẻ điểm nhà cung cấp (Scorecard), quản lý chất lượng NCC & in báo cáo SRM `SrmReportPrintModal.tsx`.
- **M31 - BI & Analytics (`/reports`)**: Báo cáo phân tích thông minh BI, tháp báo cáo P&L, doanh thu, giá vốn với module `ProfitReportModule.tsx` và `CogsEngineModule.tsx`.
- **M32 - Audit Compliance (`/audit`)**: Nhật ký kiểm toán truy vết thao tác & bảo mật chuỗi Hash Checksum SHA-256.
- **M33 - System Settings (`/system-settings`)**: Cấu hình tham số hệ thống toàn cục, tỷ giá, đa tiền tệ & quy tắc tạo mã.
- **M34 - SuperAdmin Portal (`/super-admin`)**: Cổng quản trị tối cao SuperAdmin, phân quyền RBAC hạt nhân, gán role & quản lý multi-tenant.
- **M35 - EventBus & EDA (`/event-bus`)**: Trục sự kiện EventBus, tích hợp bất đồng bộ & Outbox Pattern.
- **M36 - Service Desk (`/issue`)**: Xử lý sự cố, yêu cầu hỗ trợ IT Ticketing & báo lỗi nội bộ.
- **M37 - Quality Control QC (`/quality`)**: Kiểm soát chất lượng QMS (IQC, PQC, OQC) với component `QualityManagement.tsx`.
- **M38 - DMS Documents (`/dms`)**: Quản lý tài liệu số hóa DMS, lưu trữ hợp đồng & chứng từ điện tử.
- **M39 - EHS Safety (`/ehs`)**: An toàn lao động, vệ sinh môi trường & bảo hộ PCCC.
- **M40 - Innovation R&D (`/rd`)**: Nghiên cứu & phát triển sản phẩm mới R&D, quản lý công thức & thử nghiệm.

#### 2. Danh Sách Các Component Giao Diện Chức Năng Đang Có Trong App
- **Giao diện Khung Vỏ System Shell**: `GlobalApplicationShell.tsx`, `GlobalHeader.tsx`, `PrimaryNavigation.tsx`, `StandardModuleLayout.tsx`, `ContextRail.tsx`, `DomainWorkspaceShell.tsx`.
- **Thành phần Điều hướng & Tương tác Chuyên sâu**: `CommandOmnibarModal.tsx` (`Ctrl+K` Omnibar), `DataLineageVisualizerModal.tsx` (Truy xuất nguồn gốc dữ liệu), `ProcessControlVisualizer.tsx` (Trực quan hóa luồng quy trình), `QuickPreviewDrawer.tsx` (Drawer xem nhanh chứng từ).
- **Module & Modal Nghiệp vụ Tích hợp**:
  - `CameraScanner.tsx`: Máy quét mã Barcode/QR Code qua camera thiết bị.
  - `RbacMatrixTable.tsx`: Bảng ma trận phân quyền RBAC trực quan.
  - `SalesOrderModal.tsx`: Form khởi tạo & chỉnh sửa đơn bán hàng SO.
  - `SubcontractingManagement.tsx`: Quản lý gia công ngoài.
  - `CogsEngineModule.tsx` & `ProfitReportModule.tsx`: Báo cáo động cơ giá vốn & lợi nhuận.
  - `ExcelImportModal.tsx`: Modal nhập dữ liệu từ tệp Excel/CSV.
  - `OrchestrationManager.tsx`: Trình quản lý điều phối luồng quy trình doanh nghiệp.
  - `NotificationCenter.tsx`: Trung tâm thông báo & cảnh báo tác vụ realtime.
  - `QuickGuideModal.tsx`: Hướng dẫn quy trình vận hành tiêu chuẩn SOP theo từng phân hệ.

---

---

### D. Các Tính Năng Bổ Trợ & Trải Nghiệm Người Dùng (UX Utilities)
- **Cẩm Nang SOP (Standard Operating Procedure)**: Modal hướng dẫn quy trình vận hành tiêu chuẩn chi tiết theo từng phân hệ.
- **Hệ Thống Thông Báo Toast Container**: Phản hồi tức thì các thao tác thành công/lỗi với các loại thông báo `success`, `danger`, `warning`, `info`.
- **Hỗ trợ In Ấn & Xuất PDF**: Tùy biến CSS `@media print` giúp ẩn toàn bộ khung hệ thống L0-L5 khi ấn nút "In / Xuất PDF", chỉ giữ lại định dạng chứng từ/báo cáo sạch đẹp.
- **Đăng Nhập & Bảo Mật Simulated Login (LoginModal)**: Cho phép mô phỏng đăng nhập các tài khoản nhân sự với vai trò và phòng ban tương ứng.

---

## 3. UI Rebuild Contract & Master Blueprint Governance (Hợp Đồng & Quy Trình Rebuild UI)

Khi **ERP Core và các module nghiệp vụ đã phát triển hoàn thiện**, việc rebuild giao diện **tuyệt đối không bắt đầu bằng việc viết code UI ngay**. Cần thiết lập **UI Rebuild Contract** — hợp đồng xác định chính xác: *ERP hiện có làm được gì → UI mới phải hiển thị và thao tác được gì → UI gọi vào đâu → Tuyệt đối không được thay đổi Core nào*.

---

### 1. Đóng Băng Backend/Core (Core Freezing Principles)
Đây là nguyên tắc tối quan trọng.
```text
                 NEXUSSYNC ERP
                       │
        ┌──────────────┴──────────────┐
        │                             │
   AUTHORITATIVE                  NEW UI
   ERP CORE                       PRESENTATION
        │                             │
        ├─ Database                  ├─ Layout
        ├─ API                       ├─ Navigation
        ├─ Services                  ├─ Components
        ├─ Business Rules             ├─ Forms
        ├─ Inventory Core             ├─ Tables
        ├─ Costing Engine             ├─ Dashboard
        ├─ GL Engine                  └─ UX
        └─ RBAC
```
**UI mới chỉ là lớp hiển thị (Presentation Layer), không được trở thành nơi chứa Business Logic mới.**

**Nghiêm cấm tuyệt đối đối với lớp UI:**
- ❌ Tự tính tồn kho (Physical, Allocated, Available Qty)
- ❌ Tự tính COGS / Giá vốn
- ❌ Tự hạch toán bút toán sổ cái GL
- ❌ Tự phát sinh giao dịch kho/tài chính
- ❌ Tự bypass quy trình phê duyệt Approval
- ❌ Tự ghi trực tiếp vào Database
- ❌ Tạo một Inventory Engine thứ hai hoặc Accounting Engine thứ hai
- ❌ Thay đổi Schema CSDL chỉ để phục vụ mục đích UI

---

### 2. Chuẩn Bị "Feature Inventory" 40 Phân Hệ Nghiệp Vụ (M01 - M40)
Bảng kê chi tiết tính năng ánh xạ từ Core Backend sang New UI Presentation Layer:

| STT | Module | Feature Nghiệp Vụ | API Endpoint | Domain Service | Data Entity | UI Component Đại Diện | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **M01** | Workspace Hub | WorkQueue SLA & Tháp KPI | `GET /api/workspace/summary` | WorkspaceAggregationService | `tasks`, `kpi_metrics` | `WorkspaceHub.tsx` / `WorkQueue` | READY |
| **M02** | CRM | Quản lý Leads & Cơ hội | `GET /api/crm/leads`, `POST` | ProcessEngine | `crm_leads`, `deals` | `CrmWorkspace.tsx` | READY |
| **M03** | Customers | Khách hàng & Hạn mức nợ | `GET /api/customers`, `POST` | FinanceEngine | `customers`, `credit_limits` | `CustomerList.tsx` | READY |
| **M04** | Sales Orders | Đơn bán hàng SO & O2C | `GET /api/sales`, `POST` | OrchestrationEngine | `sales_orders`, `order_items` | `SalesOrderModal.tsx` | READY |
| **M05** | Purchase Orders | Đơn mua hàng PO & P2P | `GET /api/purchases`, `POST` | OrchestrationEngine | `purchase_orders`, `po_items` | `PurchaseOrderWorkspace.tsx` | READY |
| **M06** | Suppliers | Hồ sơ Nhà cung cấp & Đánh giá | `GET /api/suppliers`, `POST` | OrchestrationEngine | `suppliers`, `vendor_contracts`| `SupplierDirectory.tsx` | READY |
| **M07** | Inventory Core | Tồn kho 3 trạng thái & Sổ cái | `GET /api/inventory/balances` | InventoryService | `stock_balances`, `stock_ledger`| `InventoryDashboard.tsx` | READY |
| **M08** | Warehouse Ops | Nhập/Xuất kho & Vị trí Bin | `POST /api/inventory/transactions` | InventoryService | `warehouse_locations`, `bins` | `WarehouseOpsView.tsx` | READY |
| **M09** | Stocktake | Kiểm kê kho đếm mù | `POST /api/stocktakes` | StockAdjustmentService | `stocktakes`, `stocktake_items`| `StocktakeWorkspace.tsx` | READY |
| **M10** | Stock Adjustment | Phiếu điều chỉnh tăng/giảm kho | `POST /api/stock-adjustments` | StockAdjustmentService | `stock_adjustments` | `AdjustmentFormModal.tsx` | READY |
| **M11** | Internal Transfers | Chuyển kho nội bộ In-transit | `POST /api/transfers` | InventoryService | `stock_transfers` | `TransferWorkspace.tsx` | READY |
| **M12** | Lots & Batches | Quản lý Lô & Hạn sử dụng FEFO | `GET /api/lots` | InventoryService | `lots`, `lot_tracking` | `LotBatchRegistry.tsx` | READY |
| **M13** | Serials & IMEI | Quản lý định danh Serial/IMEI | `GET /api/serials`, `POST` | SerialEngine | `serials`, `serial_events` | `SerialInputModal.tsx` | READY |
| **M14** | WMS Extended | 6 Tab: Wave, LPN, Dock, Rates | `GET /api/wms/waves`, `POST` | InventoryService | `wms_waves`, `lpns`, `docks` | `WmsExtendedWorkbench.tsx` | READY |
| **M15** | Manufacturing | Lệnh SX (MO) & Định mức BOM | `GET /api/mfg/orders`, `POST` | ProcessEngine | `manufacturing_orders`, `boms`| `ManufacturingWorkspace.tsx`| READY |
| **M16** | Supply Chain | Hoạch định MRP & Cung ứng SCM | `GET /api/mrp/plan` | CostingEngine | `mrp_plans`, `demand_forecast`| `ScmSupplyChainView.tsx` | READY |
| **M17** | EAM Asset | Bảo trì thiết bị PM & Phụ tùng | `GET /api/eam/assets`, `POST` | ProcessEngine | `assets`, `maintenance_logs` | `EamMaintenanceView.tsx` | READY |
| **M18** | Projects | Quản lý Dự án WBS & Chi phí | `GET /api/projects`, `POST` | ProjectService | `projects`, `wbs_tasks` | `ProjectManagerView.tsx` | READY |
| **M19** | Logistics & Fleet | Vận tải, Điều vận & Mã vận đơn| `GET /api/logistics/trips` | OrchestrationEngine | `logistics_trips`, `waybills` | `FleetLogisticsView.tsx` | READY |
| **M20** | HR & Payroll | Hồ sơ NV, Chấm công, Bảng lương| `GET /api/hr/payroll`, `POST` | PayrollService | `employees`, `payroll_runs` | `HrPayrollWorkspace.tsx` | READY |
| **M21** | Finance & GL | Sổ cái GL (Single Writer Nợ=Có)| `POST /api/finance/journals` | AccountingEngine | `journal_entries`, `chart_accounts`| `GeneralLedgerView.tsx` | READY |
| **M22** | Invoices AR/AP | Hóa đơn Phải thu AR / Phải trả AP | `GET /api/invoices`, `POST` | FinanceEngine | `invoices`, `tax_records` | `InvoiceManagementView.tsx` | READY |
| **M23** | Payments & Cash | Quỹ tiền mặt, Thu/Chi, Ngân hàng| `POST /api/finance/payments` | FinanceEngine | `payment_vouchers`, `cash_books`| `CashPaymentView.tsx` | READY |
| **M24** | Bank Reconcile | Đối soát tài khoản & VietQR | `POST /api/bank/reconcile` | FinanceEngine | `bank_statements`, `qr_txns` | `BankReconciliationView.tsx`| READY |
| **M25** | Consolidation | Hợp nhất BCTC đa chi nhánh | `GET /api/finance/consolidation`| AccountingEngine | `financial_reports`, `pnl_data`| `ConsolidationReportView.tsx`| READY |
| **M26** | Sales Commission| Tính hoa hồng & Thưởng doanh số| `POST /api/commissions/calc` | CommissionService | `commission_plans`, `payouts`| `CommissionWorkspace.tsx` | READY |
| **M27** | Returns & RMA | Đổi trả hàng hóa RMA Khách/NCC | `POST /api/rma/requests` | OrchestrationEngine | `rma_records`, `credit_notes` | `ReturnRmaWorkspace.tsx` | READY |
| **M28** | POS Retail | Thu ngân POS, Barcode, Bill K80 | `POST /api/pos/checkout` | ProcessEngine | `pos_sessions`, `receipts` | `RetailPosCashier.tsx` | READY |
| **M29** | Sourcing | Đấu thầu mua hàng, RFQ báo giá | `GET /api/sourcing/rfq`, `POST` | OrchestrationEngine | `rfq_requests`, `vendor_bids` | `StrategicSourcingView.tsx` | READY |
| **M30** | SRM Supplier | Thẻ điểm Scorecard & Báo cáo SRM| `GET /api/srm/scorecards` | QualityService | `vendor_evaluations` | `SrmReportPrintModal.tsx` | READY |
| **M31** | BI & Analytics | Báo cáo P&L, COGS, Doanh thu | `GET /api/bi/reports` | CostingEngine | `bi_analytics_snapshots` | `ProfitReportModule.tsx` | READY |
| **M32** | Audit Compliance| Nhật ký kiểm toán Checksum SHA-256| `GET /api/audit/logs` | AuthorityManager | `audit_logs` | `AuditComplianceView.tsx` | READY |
| **M33** | System Settings | Cấu hình tham số toàn cục, Tỷ giá| `GET /api/system/config`, `PUT`| AuthorityManager | `system_settings`, `currencies`| `SystemSettingsView.tsx` | READY |
| **M34** | SuperAdmin | Ma trận RBAC hạt nhân & Multi-tenant| `POST /api/rbac/permissions` | AuthorityManager | `rbac_roles`, `rbac_permissions`| `RbacMatrixTable.tsx` | READY |
| **M35** | EventBus EDA | Trục sự kiện & Outbox Pattern | `GET /api/eventbus/events` | EventRouter | `event_outbox`, `event_logs` | `EventBusMonitorView.tsx` | READY |
| **M36** | Service Desk | IT Helpdesk Ticketing & Sự cố | `GET /api/tickets`, `POST` | ProcessEngine | `helpdesk_tickets` | `ServiceDeskView.tsx` | READY |
| **M37** | Quality QC | Kiểm tra chất lượng IQC/PQC/OQC | `POST /api/qc/inspections` | QualityService | `qc_inspections`, `nc_reports` | `QualityManagement.tsx` | READY |
| **M38** | DMS Documents | Lưu trữ hợp đồng & Tài liệu số | `GET /api/dms/documents`, `POST`| ProcessEngine | `dms_documents`, `attachments`| `DmsDocumentWorkspace.tsx` | READY |
| **M39** | EHS Safety | An toàn lao động & Môi trường | `GET /api/ehs/audits`, `POST` | ProcessEngine | `ehs_incidents`, `safety_logs`| `EhsSafetyWorkspace.tsx` | READY |
| **M40** | Innovation R&D | Nghiên cứu công thức & Thử nghiệm | `GET /api/rd/formulas`, `POST` | ProcessEngine | `rd_projects`, `trial_batches`| `InnovationRdWorkspace.tsx` | READY |

---

### 3. Chuẩn Bị Module Map Authoritative (Bản Đồ 40 Phân Hệ)
Mỗi phân hệ trong số 40 phân hệ (M01 - M40) được bóc tách theo cấu trúc chuẩn:
```text
MODULE
├── Purpose (Mục tiêu nghiệp vụ)
├── Features (Danh sách tính năng chi tiết)
├── Routes (Đường dẫn router frontend)
├── APIs (Danh sách endpoints backend)
├── Services (Động cơ Domain Core xử lý)
├── Entities (Cấu trúc bảng Schema CSDL)
├── Permissions (Ma trận quyền hạt nhân RBAC)
├── Workflows (Quy trình chuyển đổi trạng thái State Machine)
├── KPIs (Chỉ số đo lường Dashboard)
├── Reports (Mẫu in chứng từ và báo cáo tài chính)
├── Actions (Các nút bấm thao tác người dùng)
└── Cross-module links (Ngữ mạch liên kết chứng từ liên phân hệ)
```

---

### 4. Chuẩn Bị Business Capability Matrix (Ma Trận Năng Lực 40 Phân Hệ)
Ánh xạ trực tiếp từ Core Capabilities sang UI Presentation:
- **Nhóm Quản Trị & Core (M01, M16, M20, M24, M27, M29, M32, M34, M35)**: Expose giao diện Dashboard điều hành, phân quyền RBAC hạt nhân, kiểm toán chuỗi Hash SHA-256, duyệt chứng từ Approval và giám sát EventBus.
- **Nhóm Kho Vận & Vật Tư (M07, M08, M09, M10, M11, M12, M13, M14)**: Expose giao diện Tồn kho 3 trạng thái, sơ đồ vị trí Bin/Rack, kiểm kê đếm mù Blind Stocktake, điều chỉnh kho, Lô/Hạn sử dụng FEFO, Serial/IMEI và 6 Tab WMS Extended Workbench (Wave Picking, Replenishment, Bin Allocation, LPN Packing, Dock, Carrier Rates).
- **Nhóm Thương Mại & Mua Bán (M02, M03, M04, M05, M06, M26, M27, M28, M29, M30)**: Expose quy trình P2P, O2C, Đơn bán hàng SO, Đơn mua hàng PO, quầy thu ngân Retail POS, Quản lý đổi trả RMA, Đấu thầu RFQ và thẻ điểm SRM Vendor.
- **Nhóm Tài Chính & Kế Toán (M21, M22, M23, M24, M25, M31)**: Expose Sổ cái tổng hợp GL (Single Writer Nợ = Có), Hóa đơn AR/AP, Thu/Chi tiền mặt, Đối soát ngân hàng VietQR, Hợp nhất BCTC và Báo cáo giá vốn COGS / Lợi nhuận P&L.
- **Nhóm Sản Xuất, Chất Lượng & Dự Án (M15, M16, M17, M18, M19, M36, M37, M38, M39, M40)**: Expose Lệnh sản xuất MO, BOM, Cung ứng MRP, Bảo trì EAM, Dự án WBS, Vận tải điều xe, Kiểm định chất lượng IQC/PQC/OQC, Quản lý tài liệu DMS, An toàn EHS và R&D công thức.

---

### 5. Chuẩn Bị API Contract
UI chỉ được gọi các API chính thức do Backend expose:
- `GET /api/products`
- `GET /api/inventory/balances`
- `GET /api/inventory/ledger`
- `POST /api/inventory/transactions`
- `POST /api/inventory/transfer`
- `POST /api/stocktakes`
- `POST /api/stocktakes/:id/approve`

Luồng tương tác bắt buộc:
$$\text{UI} \longrightarrow \text{API Endpoint} \longrightarrow \text{Domain Service} \longrightarrow \text{Core Engine} \longrightarrow \text{Database}$$

---

### 6. Chuẩn Bị Data Contract
Thống nhất chuẩn dữ liệu giữa Backend và UI:
- UUID cho mã định danh
- Định dạng Date/Time ISO 8601
- Enum trạng thái chuẩn (`DRAFT`, `PENDING`, `APPROVED`, `COMPLETED`, `CANCELLED`)
- Trường dữ liệu có thể Null (`nullable`)
- Phân trang (`pagination`), Sắp xếp (`sorting`), Lọc (`filtering`)
- Cấu trúc lỗi nghiệp vụ (`Validation Errors`, `Business Rule Faults`)

---

### 7. Chuẩn Bị Permission Matrix (RBAC UX Protection)

| Action | SuperAdmin | Manager | Staff | UI Behavior |
| :---: | :---: | :---: | :---: | :--- |
| View Inventory | ✓ | ✓ | ✓ | Hiển thị Table & Dashboard |
| Create Adjustment | ✓ | ✓ | ✓ | Mở Form tạo phiếu |
| Approve Adjustment | ✓ | ✓ | ✗ | **Ẩn nút Approve** với Staff |
| Delete Completed Document | ✗ | ✗ | ✗ | **Khóa nút Delete** (Bất biến) |
| System Settings | ✓ | ✗ | ✗ | Chặn truy cập trang `/settings` |

*Lưu ý:* Phân quyền ở UI chỉ mang tính chất bảo vệ trải nghiệm (UX Protection). Thẩm quyền bảo mật thực sự vẫn thuộc về Backend API Authorization.

---

### 8. Chuẩn Bị Workflow Matrix (Chuyển Đổi Trạng Thái Chứng Từ)
Mọi chứng từ đều vận hành theo State Machine nghiêm ngặt:

**Quy trình Đơn mua hàng (Purchase Order):**
$$\text{DRAFT} \longrightarrow \text{SUBMITTED} \longrightarrow \text{APPROVED} \longrightarrow \text{RECEIVING} \longrightarrow \text{RECEIVED} \longrightarrow \text{CLOSED}$$

**Quy trình Kiểm kê kho (Stocktake):**
$$\text{DRAFT} \longrightarrow \text{COUNTING} \longrightarrow \text{COUNTED} \longrightarrow \text{RECOUNT\_REQUIRED} \longrightarrow \text{PENDING\_APPROVAL} \longrightarrow \text{COMPLETED}$$

UI phải nhận biết chính xác: Trạng thái hiện tại là gì, Nút thao tác nào được phép sáng lên, Ai có thẩm quyền thực hiện, và Trạng thái nào đã bất biến (`COMPLETED`) nghiêm cấm chỉnh sửa.

---

### 9. Chuẩn Bị Design System
- **Layout**: App Shell L0-L5, Sidebar L1, Workspace L2, Domain Header L3, Main Work Area L4, Context Rail L5.
- **Components Standard**: Button, Input, Select, Date Picker, Search, Filter Accordion, Data Grid, TablePagination, Status Badge, KPI Card, ConfirmDialog, Drawer, Tabs, Timeline, Empty State, Error Alert.

---

### 10. Chuẩn Bị Information Architecture (IA)
Cấu trúc điều hướng trực quan chuyển đổi linh hoạt qua lại giữa các nhóm phân hệ: `MY WORK`, `OPERATIONS`, `FINANCE / GL`, `GOVERNANCES`, `HỆ THỐNG`.

---

### 11. Chuẩn Bị Specification Cho Từng "Page Contract"
Mỗi trang UI phải có hồ sơ đặc tả trước khi code:
- **Purpose**: Mục tiêu nghiệp vụ của trang
- **Data**: Danh sách thuộc tính cần hiển thị
- **Actions**: Các hành động có thể tương tác
- **Filters**: Bộ lọc dữ liệu
- **Permissions**: Quyền truy cập RBAC tương ứng
- **API**: API endpoints cần gọi
- **Navigation**: Ngữ mạch liên kết sang các trang khác

---

### 12. Chuẩn Bị Cross-Module Navigation (Liên Kết Chứng Từ Cross-Module)
Triển khai điều hướng liên thông không rào cản:
$$\text{Sales Order} \longrightarrow \text{Customer} \longrightarrow \text{Product} \longrightarrow \text{Stock Allocation} \longrightarrow \text{Goods Issue} \longrightarrow \text{Invoice AR} \longrightarrow \text{GL Entry}$$

---

### 13. Chuẩn Bị Dashboard & KPI Definitions
Chỉ số KPI phải được tính toán chính xác từ **Authoritative Backend Calculations**, tuyệt đối không tự cộng trừ tùy tiện ở Frontend.

---

### 14. Chuẩn Bị Error, Loading & Empty State Matrix
Mọi tương tác UI đều phải xử lý đầy đủ 4 trạng thái:
$$\text{Loading State} \longrightarrow \text{Success (Data / Empty)} \longrightarrow \text{Error State (Validation / Permission / Business Error)}$$

---

### 15. Chuẩn Bị Test Matrix
- **Functional Test**: Full CRUD, Search, Filter, Export, Print.
- **Permission Test**: SuperAdmin, Manager, Staff, Guest.
- **Workflow Test**: Đầy đủ các bước từ Draft đến Completed.
- **Responsive Test**: Test trên màn hình 375px, 768px, 1024px, 1440px và 2K/4K.

---

### 16. Cấu Trúc Thư Mục Chuẩn Cho UI Rebuild
```text
/UI-REBUILD/
├── 00_UI_REBUILD_GOVERNANCE.md
├── 01_MODULE_MAP.md
├── 02_FEATURE_INVENTORY.md
├── 03_CAPABILITY_MATRIX.md
├── 04_API_CONTRACT.md
├── 05_DATA_CONTRACT.md
├── 06_RBAC_MATRIX.md
├── 07_WORKFLOW_MATRIX.md
├── 08_CROSS_MODULE_FLOW.md
├── 09_DESIGN_SYSTEM.md
├── 10_INFORMATION_ARCHITECTURE.md
├── 11_COMPONENT_CATALOG.md
├── 12_PAGE_CONTRACTS.md
├── 13_DASHBOARD_KPI.md
├── 14_UI_STATE_MATRIX.md
├── 15_RESPONSIVE_MATRIX.md
├── 16_UI_TEST_MATRIX.md
└── 17_UI_MIGRATION_PLAN.md
```

---

### 17. Quy Trình 12 Giai Đoạn Build UI (Build Pipeline)
```text
[PHASE 0] Freeze ERP Core
   ↓
[PHASE 1] Forensic Audit Existing ERP
   ↓
[PHASE 2] Feature / Capability Inventory
   ↓
[PHASE 3] API + Data + RBAC + Workflow Contract
   ↓
[PHASE 4] New Design System
   ↓
[PHASE 5] New App Shell / Workspace
   ↓
[PHASE 6] Build Reference Module (M07 Inventory)
   ↓
[PHASE 7] Validate against Real Backend
   ↓
[PHASE 8] Build Remaining Modules (M01 - M40)
   ↓
[PHASE 9] Cross-Module Integration
   ↓
[PHASE 10] UAT / Regression Test
   ↓
[PHASE 11] UI Freeze & Release
```

---

### 18. Nguyên Tắc Cốt Lõi Tối Thượng
> **"Feature-first, Contract-first, UI-second."**

Xác định capability của ERP Core trước $\rightarrow$ Lập Hợp đồng API/Data/RBAC/Workflow $\rightarrow$ Thiết kế UX $\rightarrow$ Xây dựng Component $\rightarrow$ Hoàn thiện Trang $\rightarrow$ Tích hợp Phân hệ.

---

## 4. Đặc Tả Chi Tiết: Full UI Rebuild & 100% Capability Coverage Governance

Đây không phải là một đợt "redesign UI" bề mặt đơn thuần mà là một **Full UI Rebuild / Presentation-Layer Replacement** toàn diện, chuẩn hóa 100% chức năng hiện có của NexusSync ERP.

```text
┌───────────────────────────────────────────────────────────────┐
│                       NEXUSSYNC ERP                           │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│                 NEW UI — 100% PRESENTATION                    │
│                                                               │
│    Layout / Navigation / Dashboard / Components / Modals      │
│    Forms / Tables / Workflows / Real UX / Responsive Scaling  │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│                    EXISTING ERP CONTRACT                      │
│                                                               │
│    APIs / Services / RBAC / Workflow Engine / Core Rules      │
│    Inventory 3-State / Costing / Accounting / Database Drizzle│
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

### A. Tiêu Chuẩn "Đầy Đủ" Là 100% Capability (Không Cắt Gọt Tính Năng)
- Không đánh giá UI mới bằng tiêu chí mơ hồ "Nhìn giống thiết kế", mà phải đo lường bằng: **"UI mới có expose và vận hành được toàn bộ capability mà ERP backend hiện tại đã có hay không?"**
- Nếu một phân hệ có 12 chức năng, 8 workflow, 15 API, 6 quyền RBAC, 4 trạng thái, 3 báo cáo thì UI mới phải bao quát toàn bộ 100%, không được chỉ dừng lại ở mức dashboard + table.

---

### B. Nguyên Tắc Feature Coverage Matrix & Zero Orphan Features
- **Zero Orphan Features Rule**: *Không một feature / API / workflow nào được phép tồn tại ở Backend mà không có đường truy cập và thao tác hợp lệ từ UI*, ngoại trừ các API/service được xác định rõ là internal system cron/worker.
- Mọi feature đều phải có ánh xạ 1-1:
  $$\text{Backend Feature} \longleftrightarrow \text{API} \longleftrightarrow \text{UI Route} \longleftrightarrow \text{UI Page/Modal} \longleftrightarrow \text{Action} \longleftrightarrow \text{RBAC} \longleftrightarrow \text{Workflow}$$

---

### C. Không Chỉ Build "40 Màn Hình" (Cấu Trúc Sub-Views Chuyên Sâu)
Một phân hệ không đơn thuần là 1 trang đơn lẻ, mà là một tập hợp các view/sub-modules phối hợp:
```text
Module Architecture
├── 1. Dashboard (KPIs, Thống kê, Cảnh báo nghiệp vụ)
├── 2. Master List (Bảng dữ liệu, Tìm kiếm, Lọc đa tiêu chí, Phân trang)
├── 3. Detail View / Drawer (Chi tiết chứng từ, Lịch sử, Sổ cái liên kết)
├── 4. Create / Edit Form (Modal/Page nhập liệu chuẩn xác thực)
├── 5. Approval Bar (Duyệt, Từ chối, Yêu cầu điều chỉnh theo vai trò)
├── 6. Workflow Timeline (Theo dõi tiến trình chuyển đổi trạng thái)
├── 7. Audit & History (Lưu vết thao tác và mã Checksum SHA-256)
├── 8. Standard Print Voucher (Phiếu in chuẩn A4/K80 theo quy định)
└── 9. Related Documents (Liên kết chứng từ cross-module)
```

---

### D. Bao Phủ Toàn Bộ CRUD + 17 Business Actions Chuyên Sâu
UI không chỉ giới hạn ở 4 thao tác `Create`, `Read`, `Update`, `Delete`, mà phải hỗ trợ đầy đủ **17 Business Actions** của ERP:
1. `Submit` (Gửi duyệt)
2. `Approve` (Phê duyệt chứng từ)
3. `Reject` (Từ chối duyệt kèm lý do)
4. `Cancel` (Hủy bỏ chứng từ)
5. `Confirm` (Xác nhận nghiệp vụ)
6. `Post` (Ghi sổ cái kế toán GL)
7. `Allocate` (Giữ chỗ tồn kho)
8. `Reserve` (Dự trữ vật tư)
9. `Release` (Giải phóng giữ chỗ)
10. `Transfer` (Chuyển kho nội bộ)
11. `Receive` (Nhập kho GRN)
12. `Issue` (Xuất kho Goods Issue)
13. `Close` (Đóng đơn hàng/kỳ kế toán)
14. `Reopen` (Mở lại hồ sơ)
15. `Reconcile` (Đối soát ngân hàng / kiểm kê)
16. `Export` (Xuất dữ liệu Excel/CSV)
17. `Print` (In mẫu biểu chứng từ tiêu chuẩn)

---

### E. Thấu Hiểu Thuật Ngữ & Ngữ Nghĩa ERP (ERP Semantics Awareness)
UI mới phải phân biệt rõ ràng và chính xác các khái niệm kế toán & kho vận cốt lõi:
- `Available Stock` $\neq$ `Physical Stock` (Khả dụng = Thực tế - Giữ chỗ)
- `Approved` $\neq$ `Draft` (Chứng từ đã duyệt là căn cứ pháp lý, cấm sửa tùy tiện)
- `Reserved / Allocated` $\neq$ `Issued` (Hàng giữ chỗ vẫn nằm trong kho, chưa xuất thực tế)
- `COGS (Giá vốn)` $\neq$ `Sales Revenue (Doanh thu)`
- `Posted GL Entry` $\neq$ `Draft Journal` (Bút toán đã ghi sổ là bất biến)

---

### F. Chuỗi Điều Hướng Liên Phân Hệ Liền Mạch (Cross-Module Deep Linking)
Người dùng có thể click tra cứu xuyên suốt chuỗi cung ứng mà không bị đứt đoạn ngữ cảnh:
- **Chuỗi Bán Hàng (O2C)**:
  $$\text{Customer} \longrightarrow \text{Sales Order} \longrightarrow \text{Stock Allocation} \longrightarrow \text{Goods Issue} \longrightarrow \text{Invoice AR} \longrightarrow \text{Payment} \longrightarrow \text{GL Entry}$$
- **Chuỗi Mua Hàng (P2P)**:
  $$\text{Supplier} \longrightarrow \text{Purchase Order} \longrightarrow \text{Goods Receipt (GRN)} \longrightarrow \text{Inventory Stock} \longrightarrow \text{Supplier Invoice AP} \longrightarrow \text{Payment} \longrightarrow \text{GL Entry}$$

---

### G. Hệ Thống Phân Cấp Kiến Trúc (Architecture Hierarchy)
Khi phát triển UI mới, hệ thống tuân thủ nghiêm ngặt mô hình phân cấp:
```text
                     AUTHORITATIVE
                          │
                   ERP BUSINESS CORE
                          │
              ┌───────────┴───────────┐
              │                       │
         BUSINESS CONTRACT       API CONTRACT
              │                       │
              └───────────┬───────────┘
                          │
                   FEATURE MATRIX
                          │
                   UI REQUIREMENTS
                          │
                   NEW DESIGN SYSTEM
                          │
                     NEW UI
                          │
                   COVERAGE AUDIT
                          │
                     UAT / PASS
```
*Quy tắc bất biến:* **Thiết kế mới phải phục vụ tính năng ERP, không phải tính năng ERP bị cắt gọt để vừa với thiết kế.**

---

### H. Tiêu Chuẩn Hoàn Thành Toàn Diện (Definition of Done - DoD)
Dự án **NEW UI Rebuild** chỉ được xem là **COMPLETE** khi thỏa mãn 100% các tiêu chí:

#### 1. Functional Coverage
- [ ] 100% trong số 40 phân hệ (M01 – M40) được tích hợp đường dẫn và giao diện hoàn chỉnh.
- [ ] 100% business features ở Core được expose trên UI.
- [ ] 100% required API endpoints được kết nối hợp lệ.
- [ ] 100% business actions (17 actions) có nút bấm và modal xử lý tương ứng.
- [ ] 100% workflow state transitions được phản ánh chính xác.
- [ ] 100% quyền RBAC được phản ánh (ẩn/hiện nút, khóa form theo role).
- [ ] 100% liên kết Cross-Module Deep Linking hoạt động thông suốt.
- [ ] 100% mẫu in chứng từ và báo cáo tài chính hiển thị chính xác.
- [ ] 100% error/loading/empty states được xử lý êm ái.

#### 2. Technical Integrity
- [ ] Tuyệt đối không bypass Backend API.
- [ ] Tuyệt đối không ghi trực tiếp vào Database từ UI.
- [ ] Không tạo duplicate business logic hay engine tính toán thứ hai ở frontend.
- [ ] Không tự tính tồn kho 3 trạng thái hay COGS ở UI.
- [ ] Giữ nguyên vẹn Frozen Core & Schema Drizzle CSDL hiện hữu.

#### 3. UX & Presentation Quality
- [ ] Nhất quán toàn diện với Enterprise Design System (L0 - L5 Shell).
- [ ] Hỗ trợ phím tắt điều hướng nhanh (`Ctrl+K` Omnibar).
- [ ] Responsive mượt mà từ Mobile 375px, Tablet, Desktop đến 2K/4K Ultra-wide.
- [ ] Font chữ Monospace chuẩn xác cho mã chứng từ, SKU, số lượng, tiền tệ.
- [ ] Thay thế hoàn toàn `alert`/`confirm` mặc định bằng `ConfirmDialog.tsx` tùy biến.

---

# 5. NEXUSSYNC ERP — FULL UI REBUILD MASTER BLUEPRINT (Contract Trung Tâm Cho AI/Codex)

> **Mục tiêu tối thượng:** Xây dựng một Presentation Layer hoàn toàn mới cho NexusSync ERP, sử dụng toàn bộ capability, API, business contract, workflow, RBAC và dữ liệu hiện hữu làm authoritative baseline; UI mới phải đạt **100% feature coverage**, đồng thời **không thay đổi, không sao chép và không bypass ERP Core**.

---

## I. GOVERNANCE — NGUYÊN TẮC BẤT BIẾN

### 1. Authority Hierarchy
```text
LEVEL 0: NEXUSSYNC ERP BUSINESS CONTRACT (Authoritative Baseline)
   ↓
LEVEL 1: DATABASE / DOMAIN MODEL (Drizzle Schema, Constraints)
   ↓
LEVEL 2: DOMAIN SERVICES / CORE ENGINES (InventoryService, AccountingEngine, CostingEngine...)
   ↓
LEVEL 3: API CONTRACT (REST Endpoints, Validations, Status Codes)
   ↓
LEVEL 4: RBAC / WORKFLOW / POLICY (AuthorityManager, State Machine)
   ↓
LEVEL 5: FULL UI REBUILD BLUEPRINT (Contract Định Tuyến & UI Specs)
   ↓
LEVEL 6: NEW UI IMPLEMENTATION (Components, Pages, Modals, Forms)
```
*Quy tắc tối thượng:* **UI hoàn toàn không có quyền override bất kỳ Level nào phía trên (Level 0 – Level 4).**

### 2. Phạm Vi UI Được Phép Thay Đổi
- Layout, Navigation, Sidebar, Workspace Shell.
- Dashboard Presentation, KPI Cards, Visual Sparklines.
- Theme, Color Palette, Typography Hierarchy.
- Components, Data Tables, Pagination, Multi-tier Filters.
- Form controls, Input Masking, Modal, Drawer, Tabs.
- UX flow, Transition animations, Responsive Scaling đa thiết bị.

### 3. Phạm Vi UI Tuyệt Đối Không Được Phép Thay Đổi
- Database Schema & Tables Structure.
- Business rules & Validations.
- Inventory 3-State rules (Physical, Allocated, Available).
- Costing calculation rules (FIFO, Moving Average).
- GL Single Writer rules (Debits = Credits balancing).
- Workflow State Machines & Approval hierarchies.
- RBAC authorization authority trên Backend.
- Idempotency & Audit Checksum (SHA-256) logging.
- Core transaction paths & Service callers.

---

## II. MASTER FEATURE INVENTORY (BẢNG KÊ CHỐNG BỎ SÓT TÍNH NĂNG)

Mỗi feature bắt buộc phải có một **Feature ID duy nhất** theo cấu trúc: `Mxx-Fyyy` (ví dụ: `M07-F001`, `M07-F015`, `M04-F003`).

Mỗi Feature Record phải khai báo tường minh:
```text
Feature ID:               M07-F015
Module:                   M07 Inventory Core
Domain:                   Operations / WMS
Feature Name:             Internal Stock Transfer (Chuyển kho nội bộ)
Business Purpose:         Di chuyển hàng hóa an toàn giữa các kho/vị trí Bin.
Backend Service:          InventoryService.postTransaction()
API Endpoint:             POST /api/inventory/transfer
Data Entity:              stock_transfers, stock_ledger, stock_balances
Required Permission:      inventory.transfer
Workflow State:           DRAFT → SUBMITTED → APPROVED → IN_TRANSIT → RECEIVED
UI Page / Route:          /transfer (TransferWorkspace.tsx)
UI Actions:               Create, Edit, Submit, Approve, Receive, Cancel, Print
Cross-module Dependency:  M08 Warehouse Ops, M21 Finance GL
Test Case:                TC-INV-015 (Valid transfer updates balances & ledger)
Status:                   READY
```

---

## III. M01–M40 MODULE BLUEPRINT SPECIFICATION

Tất cả 40 phân hệ (M01 – M40) đều phải tuân thủ chuẩn cấu trúc bóc tách 16 thành phần đồng nhất:
```text
Mxx MODULE SPECIFICATION
├── 1. Purpose (Mục tiêu nghiệp vụ cốt lõi)
├── 2. Business Capability (Các năng lực nghiệp vụ đáp ứng)
├── 3. Feature Inventory (Danh sách Mxx-F001 ... Mxx-Fnnn)
├── 4. Data Entities (Bảng Schema CSDL liên quan)
├── 5. Official APIs (Danh sách Endpoint GET/POST/PUT/DELETE)
├── 6. Domain Services (Engine xử lý: InventoryService, AccountingEngine...)
├── 7. RBAC Permissions (Quyền chi tiết: module.action)
├── 8. Workflow State Machine (Sơ đồ chuyển trạng thái DRAFT → COMPLETED)
├── 9. Pages & Routes (Danh sách trang & đường dẫn router)
├── 10. Components Catalog (Các component chuyên dụng của module)
├── 11. 17 Business Actions (Các hành động người dùng được phép thực hiện)
├── 12. KPIs & Metrics (Chỉ số đo lường hiển thị trên Dashboard)
├── 13. Reports & Vouchers (Mẫu in A4/K80 và báo cáo kế toán)
├── 14. Cross-Module Links (Ngữ mạch liên kết chứng từ liên phân hệ)
├── 15. Error & State Matrix (Xử lý Loading, Success, Empty, Business Errors)
└── 16. Test Matrix (Ma trận kiểm thử tự động Functional & Workflow)
```

---

## IV. PAGE BLUEPRINT SPECIFICATION

Trước khi viết mã giao diện cho bất kỳ trang nào, phải có bản đặc tả Page Blueprint tương ứng:
```text
PAGE ID:       M07-P003
NAME:          Inventory Stock Dashboard & Balances
ROUTE:         /inventory
PURPOSE:       Theo dõi và tra cứu tình trạng tồn kho toàn diện thời gian thực.
DATA DISPLAY:  Physical Qty, Allocated Qty, Available Qty, Stock Value, Low Stock Alerts, Out of Stock.
FILTER BARS:   Warehouse, Location Bin, Product SKU, Category, Lot No, Serial/IMEI.
UI ACTIONS:    View Details, Quick Transfer, Stock Adjustment, Blind Stocktake, Export Excel, Print Ledger.
PERMISSIONS:   inventory.view, inventory.transfer, inventory.adjust, inventory.stocktake
API CALLED:    GET /api/inventory/balances, GET /api/inventory/ledger
NAVIGATION:    Product Catalog (M02), Warehouse Ops (M08), Stocktake (M09), Sổ cái GL (M21).
```

---

## V. COMPONENT BLUEPRINT (CHUẨN HÓA THƯ VIỆN COMPONENT)

Nghiêm cấm AI tự tạo component tùy ý hoặc manh mún. Toàn bộ UI tuân theo hệ thống phân cấp:
```text
Design System Component Catalog
├── 1. App Shell Architecture
│   ├── GlobalApplicationShell.tsx (Khung vỏ L0 - L5)
│   ├── GlobalHeader.tsx (Header L0, Omnibar, User Profile, Notifications)
│   ├── PrimaryNavigation.tsx (Sidebar L1, Favorites, Multi-tier Tree)
│   ├── WorkspaceShell.tsx (Workspace Hub L2)
│   ├── StandardModuleLayout.tsx (Module View L3-L4)
│   └── ContextRail.tsx (Context Drawer L5)
│
├── 2. Data & Grid Presentation
│   ├── DataTable.tsx (Bảng dữ liệu chuẩn, Sticky Columns, Monospace Data)
│   ├── TablePagination.tsx (Phân trang [10, 15, 25, 50, 100] auto-reset)
│   ├── FilterBarAccordion.tsx (Bộ lọc đa tầng nhanh & nâng cao)
│   └── ExportActionMenu.tsx (Xuất Excel / CSV)
│
├── 3. Form & Selectors
│   ├── FormContainer.tsx (Form nhập liệu chuẩn)
│   ├── ProductSelector.tsx (Bộ chọn sản phẩm kèm tồn khả dụng)
│   ├── CustomerSelector.tsx (Bộ chọn khách hàng kèm hạn mức công nợ)
│   ├── SupplierSelector.tsx (Bộ chọn nhà cung cấp kèm điều khoản nợ)
│   └── QuantityInputMask.tsx (Ô nhập số lượng, tiền tệ Monospace)
│
├── 4. Workflow, Audit & Feedback
│   ├── StatusBadge.tsx (Huy hiệu trạng thái màu chuẩn)
│   ├── ApprovalActionBar.tsx (Thanh tác vụ duyệt chứng từ)
│   ├── WorkflowTimeline.tsx (Dòng thời gian chuyển trạng thái)
│   ├── AuditChecksumTimeline.tsx (Nhật ký kiểm toán SHA-256)
│   ├── ConfirmDialog.tsx (Modal xác nhận an toàn thay thế alert/confirm)
│   ├── QuickPreviewDrawer.tsx (Drawer xem nhanh chứng từ)
│   └── StandardPrintVoucherModal.tsx (In mẫu chứng từ A4/K80)
│
└── 5. States & Feedback
    ├── LoadingSkeleton.tsx (Hiệu ứng tải trang)
    ├── EmptyStateCard.tsx (Giao diện khi danh sách trống)
    └── BusinessErrorAlert.tsx (Hiển thị thông điệp lỗi nghiệp vụ)
```

---

## VI. ACTION CONTRACT (TRUY XUẤT NGUỒN GỐC HÀNH ĐỘNG)

Mọi nút bấm thao tác trên UI bắt buộc phải truy xuất được đường đi an toàn đến Backend Contract:
$$\text{[Approve Button]} \longrightarrow \text{RBAC: } \texttt{inventory.adjust.approve} \longrightarrow \text{API POST} \longrightarrow \text{Domain Service} \longrightarrow \text{Core Engine} \longrightarrow \text{GL Posting} \longrightarrow \text{Audit Checksum} \longrightarrow \text{UI Feedback}$$

*Tuyệt đối nghiêm cấm:*
$$\text{Button Click} \centernot\longrightarrow \text{Frontend Calculation} \centernot\longrightarrow \text{Direct DB Mutation}$$

---

## VII. WORKFLOW CONTRACT (RÀNG BUỘC STATE MACHINE)

UI phải tự động khóa/mở các hành động dựa trên trạng thái chứng từ:
- **`DRAFT`**: Cho phép `[Edit]`, `[Submit]`, `[Cancel]`. Ẩn/Khóa `[Approve]`, `[Post]`.
- **`SUBMITTED` / `PENDING_APPROVAL`**: Cho phép `[Approve]`, `[Reject]`. Khóa `[Edit Form]`.
- **`APPROVED`**: Cho phép `[Execute / Post]`, `[Print Voucher]`. Khóa `[Edit]`, `[Delete]`.
- **`COMPLETED`**: **Bất biến (Immutable)**. Chuyển toàn bộ form thành View-Only, chỉ cho phép `[Print]`, `[Export]`, `[View Ledger / Audit]`. Cấm tuyệt đối `[Edit]`, `[Delete]`.

---

## VIII. RBAC CONTRACT (MAPPING QUYỀN HẠT NHÂN SANG UI)

Ánh xạ chi tiết từ Permission sang hành vi giao diện:
- `inventory.view` $\longrightarrow$ Cho phép truy cập và xem bảng tồn kho.
- `inventory.adjust.create` $\longrightarrow$ Hiển thị nút `+ Tạo Phiếu Điều Chỉnh`.
- `inventory.adjust.approve` $\longrightarrow$ Hiển thị nút `Phê Duyệt` (chỉ hiển thị cho Quản lý / Admin).
- `finance.gl.post` $\longrightarrow$ Hiển thị nút `Ghi Sổ Cái Kế Toán`.

---

## IX. CROSS-MODULE CONTRACT (CHUỖI LIÊN KẾT LIÊN PHÂN HỆ)

UI phải xây dựng các mắt xích Deep Linking liên kết chứng từ liên tục:
- **Chuỗi Bán Hàng (O2C)**: $\text{Customer (M03)} \rightarrow \text{Sales Order (M04)} \rightarrow \text{Inventory Allocation (M07)} \rightarrow \text{Goods Issue (M08)} \rightarrow \text{Invoice AR (M22)} \rightarrow \text{Payment (M23)} \rightarrow \text{GL Entry (M21)}$
- **Chuỗi Mua Hàng (P2P)**: $\text{Supplier (M06)} \rightarrow \text{Purchase Order (M05)} \rightarrow \text{GRN Receipt (M08)} \rightarrow \text{Stock Balance (M07)} \rightarrow \text{Supplier Invoice AP (M22)} \rightarrow \text{Payment (M23)} \rightarrow \text{GL Entry (M21)}$

---

## X. DASHBOARD / KPI CONTRACT (CHUẨN HÓA CHỈ SỐ)

Mọi KPI trên Dashboard phải được định danh và lấy từ Backend Authoritative Source:
```text
KPI ID:               INV-KPI-001
Name:                 Available Stock (Tồn kho Khả dụng)
Business Definition:  Physical Quantity - Allocated Quantity
Authoritative Source: InventoryService.getBalances()
API Endpoint:         GET /api/inventory/balances/summary
Permission Required:  inventory.view
Drill-down Action:    Mở trang chi tiết tồn kho /inventory với bộ lọc tương ứng.
```

---

## XI. STATE & ERROR CONTRACT (CHUẨN HÓA PHẢN HỒI LỖI NGHIỆP VỤ)

Mọi trang và modal phải xử lý đầy đủ các trạng thái:
- `Loading`: Hiển thị Skeleton hoặc Spinner mượt mà.
- `Success`: Hiển thị dữ liệu kèm phân trang chuẩn.
- `Empty`: Hiển thị biểu tượng Empty State kèm nút gợi ý tạo mới.
- `Business Error Handling`:
  - Khi Backend trả về `APPROVED_TRANSACTION_IMMUTABLE`: UI hiển thị Banner cảnh báo *"Chứng từ đã được phê duyệt, dữ liệu ở trạng thái chỉ đọc"* và tự động vô hiệu hóa các nút chỉnh sửa.
  - Khi Backend trả về `INSUFFICIENT_STOCK`: UI hiển thị chi tiết số lượng thiếu hụt và số tồn khả dụng hiện tại.

---

## XII. FEATURE COVERAGE MATRIX (QUALITY GATE CUỐI CÙNG)

Một tính năng chỉ được đánh dấu là **COMPLETE** khi và chỉ khi vượt qua toàn bộ các cổng kiểm tra:
$$\text{Backend Feature (✓)} \longrightarrow \text{API (✓)} \longrightarrow \text{Page Route (✓)} \longrightarrow \text{Actions (✓)} \longrightarrow \text{RBAC (✓)} \longrightarrow \text{Workflow (✓)} \longrightarrow \text{Cross-Module (✓)} \longrightarrow \text{Error Handling (✓)} \longrightarrow \text{Test Case (✓)}$$

---

## XIII. TRACEABILITY MATRIX (MA TRẬN TRUY XUẤT NGUỒN GỐC)

Đảm bảo khả năng truy vết ngược xuôi giữa Component UI và Mã nguồn Core:
```text
M07-F015 (Feature Chuyển kho)
   ↓
API-INV-023 (POST /api/inventory/transfer)
   ↓
InventoryService.postTransaction()
   ↓
M07-P008 (Trang /transfer)
   ↓
TransferFormModal.tsx
   ↓
inventory.transfer (RBAC Permission)
   ↓
TRANSFER_STATE_MACHINE (DRAFT → APPROVED → COMPLETED)
   ↓
TC-INV-015 (Integration Test Case)
```

---

## XIV. IMPLEMENTATION ORDER (LỘ TRÌNH 15 BƯỚC THỰC THI CHUẨN)

```text
STEP 01: ERP Forensic Audit (Khảo sát toàn bộ Codebase Core & Drizzle Schema)
   ↓
STEP 02: Master Feature Inventory (Định danh toàn bộ M01-F001 ... M40-Fnnn)
   ↓
STEP 03: API & Data Contract (Chuẩn hóa Endpoints & DTOs)
   ↓
STEP 04: RBAC & Workflow Contract (Ma trận quyền & State Machine)
   ↓
STEP 05: Cross-Module Contract (Định tuyến liên kết chứng từ)
   ↓
STEP 06: Design System (Hoàn thiện thư viện Component & ConfirmDialog)
   ↓
STEP 07: App Shell Architecture (Khung vỏ L0 - L5 & Omnibar)
   ↓
STEP 08: Reference Module Implementation (Hoàn thiện 100% M07 Inventory Core)
   ↓
STEP 09: Reference Module UAT (Kiểm thử thực tế toàn diện M07)
   ↓
STEP 10: Scale Phân Hệ M01 – M40 (Triển khai tuần tự theo nhóm module)
   ↓
STEP 11: Cross-Module Integration (Kiểm thử chuỗi O2C, P2P, SCM, GL)
   ↓
STEP 12: Feature Coverage Audit (Đối soát 100% tính năng không bị bỏ sót)
   ↓
STEP 13: Regression & Automated Testing (Chạy toàn bộ Test Suite)
   ↓
STEP 14: Final UAT (Nghiệm thu toàn diện)
   ↓
STEP 15: UI FREEZE & RELEASE
```

---

## XV. FINAL ACCEPTANCE GATE & CHỈ THỊ THỰC THI CHO AI AGENTS

### Tiêu Chuẩn Nghiệm Thu Tuyệt Đối:
Hệ thống chỉ được cấp chứng chỉ **UI REBUILD = PASS** khi:
1. **100% Feature Coverage** trên toàn bộ 40 Phân hệ (M01 – M40).
2. **100% API Coverage & Action Coverage** được kết nối thành công.
3. **ERP Core, Drizzle Database Schema, Inventory Core, Costing Engine và GL Engine hoàn toàn UNCHANGED.**

### Chỉ Thị Thực Thi Bắt Buộc Dành Cho AI / Code Agents:
Khi nhận yêu cầu phát triển hoặc chỉnh sửa UI, AI **BẮT BUỘC** phải tuân theo chu trình:
$$\text{READ (Đọc Blueprint)} \longrightarrow \text{AUDIT (Kiểm tra Core)} \longrightarrow \text{MAP (Ánh xạ Feature)} \longrightarrow \text{IMPLEMENT (Viết UI)} \longrightarrow \text{VERIFY (Test & Lint)} \longrightarrow \text{REPORT}$$

*Nghiêm cấm tuyệt đối lối làm việc tắt:*
$$\text{READ DESIGN} \centernot\longrightarrow \text{CODE UI NHANH} \centernot\longrightarrow \text{DONE (Mất tính năng)}$$

