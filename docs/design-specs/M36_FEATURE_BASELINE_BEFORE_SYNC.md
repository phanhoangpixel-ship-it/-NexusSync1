# M36 TMS & LOGISTICS WORKSPACE
## FEATURE BASELINE BEFORE SYNC (PHASE -1)

**Document Reference:** `/docs/design-specs/M36_FEATURE_BASELINE_BEFORE_SYNC.md`  
**Timestamp:** 2026-09-11T02:00:00-07:00  
**Target Module:** M36 (Logistics & Fleet Management Workspace - TMS)  
**File Before Sync:** `/src/components/workspaces/M36LogisticsWorkspace.tsx` (2,805 lines, 139 KB)  
**Source Module Standard:** M19 (Stocktake & Blind Count Workspace) / M18  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Replication Protocol)  
**Tác giả:** Chuyên viên Lập trình Frontend Cấp cao — NexusSync ERP Team  

---

## 1. TỔNG QUAN HIỆN TRẠNG PHÂN HỆ M36 TRƯỚC ĐỒNG BỘ

Module M36 hiện tại là một tệp đơn monolithic khổng lồ gồm 2,805 dòng code trong `src/components/workspaces/M36LogisticsWorkspace.tsx`.
Hệ thống cung cấp đầy đủ chức năng quản lý điều vận và đội xe với 9 Sub-tabs, liên kết với Phân hệ Kho (M17 PXK), Bán Hàng (M13 SO), và Kế Toán (M31 Hóa Đơn).

### Danh Sách 9 Sub-Tabs Hiện Hữu:
1. `dashboard`: **Tổng Quan** — Thẻ KPI đo lường toàn hạm đội xe, bảng theo dõi Delivery Orders (DO) liên kết M13 & M17, nút xuất bến nhanh, nút xác nhận POD nhanh, tổng hợp đội xe, cảnh báo sự cố ngoại lệ trên đường.
2. `planning`: **Lập Kế Hoạch** — Quản lý Transport Orders (Lệnh vận chuyển), công cụ lọc tìm kiếm, bộ lọc trạng thái, form phân công xe & tài xế an toàn với Pre-dispatch Checklist, tạo lệnh mới.
3. `operations`: **Điều Hành & POD** — Giám sát các chuyến xe đang lưu thông (In-Transit), mô phỏng GPS Simulator, bàn điều khiển ghi nhận ngoại lệ (Delivery Exception), kích hoạt ứng dụng Mobile Driver App Simulator.
4. `fleet`: **Đội Xe** — Quản lý danh mục phương tiện vận tải, tải trọng, loại nhiên liệu, chỉ số Odometer (km), thời hạn đăng kiểm và bảo hiểm, form đăng ký xe mới.
5. `drivers`: **Tài Xế** — Danh bạ tài xế, hạng bằng lái (C, D, FC), hạn GPLX, chấm điểm an toàn Driver Safety Score & Eco-Driving (số sao, phanh gấp, quá tốc độ, nổ máy chờ, thưởng an toàn).
6. `routes`: **Tuyến Đường GPS** — Bản đồ giám sát lộ trình, các điểm dừng (stops/waypoints), khoảng cách km, thời gian ETA, trạm thu phí BOT, trạng thái giao thông.
7. `costs`: **Nhiên Liệu & VETC** — Quản lý nhật trình nạp nhiên liệu Diesel, đối soát thu phí tự động không dừng (VETC / ePass), đồng bộ và đối soát tự động (`/api/logistics/vetc-transactions/sync`, `/reconcile`).
8. `maintenance`: **Bảo Dưỡng** — Lập lịch bảo trì, bảo dưỡng xe định kỳ, chi phí ước tính, liên kết chuyển yêu cầu sang Asset & Maintenance (M38).
9. `analytics`: **Báo Cáo Phân Tích** — Báo cáo hiệu suất logistics, tỷ lệ giao hàng đúng giờ (On-Time Delivery Rate), chi phí trên mỗi km/tấn hàng, biểu đồ phân tích nhiên liệu.

---

## 2. KIỂM KÊ DỮ LIỆU & STATE QUẢN LÝ (STATE INVENTORY)

### 2.1 State Dữ Liệu Thực Thể (Entity States)
- `orders: TransportOrder[]` — Danh sách lệnh vận chuyển (DRAFT, PLANNED, ASSIGNED, DISPATCHED, IN_TRANSIT, DELIVERED, POD_CONFIRMED, COMPLETED, CANCELLED, FAILED).
- `deliveryOrders: DeliveryOrder[]` — Danh sách đơn giao hàng theo chặng kho liên kết M17/M13 (READY_TO_DISPATCH, IN_TRANSIT, DELIVERED, POD_CONFIRMED).
- `vehicles: Vehicle[]` — Danh sách xe (AVAILABLE, ACTIVE, ASSIGNED, IN_TRANSIT, MAINTENANCE, OUT_OF_SERVICE, RETIRED).
- `drivers: Driver[]` — Danh sách tài xế (AVAILABLE, ASSIGNED, ON_TRIP, ON_LEAVE).
- `fuelTxs: FuelTransaction[]` — Nhật trình nạp nhiên liệu.
- `vetcTxs: VetcTransaction[]` — Giao dịch trạm thu phí tự động VETC/ePass.
- `safetyScores: DriverSafetyScore[]` — Bảng điểm an toàn và lái xe tiết kiệm (Eco-driving).
- `exceptions: DeliveryException[]` — Sự cố ngoại lệ trên đường (TRAFFIC_DELAY, CUSTOMER_UNAVAILABLE, WRONG_ADDRESS, DAMAGED_GOODS, REFUSED).
- `maintenanceRecords: MaintenanceRecord[]` — Nhật ký bảo dưỡng phương tiện.
- `kpis` — Tổng hợp 10 chỉ số đo lường hiệu suất vận tải.

### 2.2 Modal & Drawer States Hiện Hữu
- `isNewOrderModalOpen: boolean` — Modal tạo lệnh vận chuyển mới.
- `isAssignModalOpen: boolean` — Modal gán phương tiện & tài xế kèm checklist kiểm tra điều kiện xuất bến.
- `isPodModalOpen: boolean` — Modal xác nhận biên bản giao hàng POD.
- `isNewVehicleModalOpen: boolean` — Modal đăng ký phương tiện mới.
- `isNewDriverModalOpen: boolean` — Modal hồ sơ hóa tài xế mới.
- `isNewFuelModalOpen: boolean` — Modal ghi nhận đổ dầu nhiên liệu.
- `isNewExceptionModalOpen: boolean` — Modal báo cáo sự cố ngoại lệ.
- `isNewMaintModalOpen: boolean` — Modal yêu cầu bảo trì bảo dưỡng xe.
- `isMobileDriverAppOpen: boolean` — Trình mô phỏng giao diện ứng dụng di động tài xế PWA (Nexus Driver App) với chữ ký điện tử và ảnh chụp giao hàng.
- `printDocument: { type: 'ORDER' | 'POD'; order: TransportOrder } | null` — Modal in chứng từ (Phiếu Điều Xe Vận Chuyển / Biên Bản POD).
- `confirmDialog: ConfirmDialogState | null` — Hộp thoại xác nhận Rule #19 cho xuất bến và nghiệm thu POD.

### 2.3 Nghiệp Vụ Xử Lý & API Endpoints
- `GET /api/logistics/kpi`
- `GET /api/logistics/orders`
- `GET /api/logistics/vehicles`
- `GET /api/logistics/drivers`
- `GET /api/logistics/fuel-transactions`
- `GET /api/logistics/vetc-transactions`
- `GET /api/logistics/driver-safety-scores`
- `POST /api/logistics/orders` (Tạo lệnh vận chuyển mới)
- `POST /api/logistics/orders/:id/assign` (Gán xe và tài xế an toàn)
- `POST /api/logistics/orders/:id/status` (Cập nhật trạng thái lệnh)
- `POST /api/logistics/orders/:id/pod` (Xác nhận POD)
- `POST /api/logistics/vehicles` (Tạo xe)
- `POST /api/logistics/drivers` (Tạo tài xế)
- `POST /api/logistics/fuel-transactions` (Tạo giao dịch nhiên liệu)
- `POST /api/logistics/vetc-transactions/sync` (Đồng bộ BOT VETC)
- `POST /api/logistics/vetc-transactions/reconcile` (Đối soát VETC)

---

## 3. CÁC TỒN TẠI VỀ UI/UX TRƯỚC KHI ĐỒNG BỘ (CẦN KHẮC PHỤC)

1. **Vi phạm tính module hóa:** Tệp dài 2,805 dòng trong 1 file duy nhất, khó bảo trì, nguy cơ xung đột và vượt ngưỡng token.
2. **Khác biệt màu thanh Tab L1:** Đang dùng nền đen cố định `bg-slate-900 p-2 border-slate-800`, không đồng bộ với tiêu chuẩn vỏ hệ thống L1 của M18, M19, M05 (`bg-white dark:bg-slate-800 p-1.5 border-slate-200 dark:border-slate-700`).
3. **Thiếu hỗ trợ Dark Mode ở nhiều khối (WCAG AA):** Nhiều container đang dùng `bg-white` hoặc `text-slate-900` mà không có `dark:bg-slate-800` hay `dark:text-white`, gây mất độ tương phản khi đổi giao diện tối.
4. **Định dạng số học:** Nhiều chỗ hiển thị tiền tệ hoặc số lượng chưa dùng font `font-mono tabular-nums font-bold text-right`.
5. **Thiếu Drawer 360° chuyên dụng:** Chưa có Drawer chi tiết lệnh vận chuyển chuẩn L4 hỗ trợ phả hệ nguồn gốc, liên kết phân hệ M17/M31, và audit trail.
6. **Mở rộng ConfirmDialog (Rule #19):** Cần đảm bảo 100% thao tác nhạy cảm (Gán xe, Cập nhật trạng thái, Hủy lệnh, Đồng bộ VETC, Bảo dưỡng) đều đi qua `ConfirmDialog.tsx`.
