# NEXUSSYNC ERP — M36 LOGISTICS & FLEET MANAGEMENT (TMS)
## TÀI LIỆU ĐẶC TẢ CHI TIẾT GIAO DIỆN UI/UX & PROTOCOL REPLICATION THEO RULE #19 VÀ RULE #20

---

## 1. THÔNG TIN ĐỒNG BỘ KIẾN TRÚC & PHẠM VI
- **Mã phân hệ**: `M36` (Logistics & Fleet Management Workspace / Transportation Management System - TMS)
- **Module nguồn tham chiếu chuẩn**: `M19` (UI/UX Enterprise Standard & L0-L4 Hierarchy)
- **Nguyên tắc cốt lõi áp dụng**:
  - **Rule #19**: Thay thế 100% `window.alert` / `window.confirm` mặc định của trình duyệt bằng component `ConfirmDialog.tsx`. Tuân thủ tiêu chuẩn tương phản WCAG AA, số liệu định dạng `font-mono tabular-nums`, bảng dữ liệu chuẩn Enterprise (`hover:bg-slate-100/80 dark:hover:bg-slate-700/60`).
  - **Rule #20**: Quy trình sao chép đầy đủ giao diện không làm mất bất kỳ tính năng nghiệp vụ nào (Baseline Protection).
  - **Phân tách Module hóa**: Chuyển đổi từ file nguyên khối 2,805 dòng sang cấu trúc module phân cấp rõ ràng trong `/src/components/workspaces/logistics/`.

---

## 2. HỆ THỐNG VỎ ĐA TẦNG L0 - L4 TẠI M36

### Tầng L0: Workspace Identity & Banner Điều Hành
- **Header Badge**: `M36 • LOGISTICS & FLEET MANAGEMENT` kèm tagline phân quyền Single-Writer TMS & liên kết WMS, VETC.
- **Biểu tượng**: `Truck` (bg-blue-600, shadow-xs, rounded-xl).
- **Hành động nhanh**:
  - `Tạo Lệnh Vận Chuyển`: Kích hoạt `NewOrderModal`.
  - `Làm mới`: Đồng bộ dữ liệu đa tầng từ `/api/logistics/*`.
  - `Rule #19 Confirmed Badge`: Chỉ báo xác thực kiểm soát giao dịch an toàn.

### Tầng L1: Sub-Tabs Navigation Strip
Hệ thống điều hướng 9 Workspace Sub-tabs chuẩn Enterprise:
1. `dashboard`: Tổng quan chỉ số KPI, hiệu suất đội xe, cảnh báo ngoại lệ giao hàng và lịch bảo dưỡng M38.
2. `planning`: Lập kế hoạch vận tải, gom đơn giao hàng, gán xe/tài xế, lọc trạng thái, in phiếu vận chuyển.
3. `operations`: Điều hành chuyến xe trực tiếp, quản lý chặng giao nhận DO (Delivery Orders liên kết PXK M17), xác nhận nghiệm thu POD và trình giả lập ứng dụng tài xế (Driver Mobile App Simulator).
4. `fleet`: Quản lý danh mục phương tiện (biển số, tải trọng kg, loại nhiên liệu, hạn đăng kiểm, bảo hiểm dân sự).
5. `drivers`: Danh bạ tài xế, hạng bằng GPLX, chỉ số an toàn giao thông Eco-Driving Stars, thưởng an toàn và khóa bồi dưỡng nghiệp vụ.
6. `routes`: Giám sát định tuyến GPS, tọa độ thời gian thực, cảnh báo nhiệt độ thùng lạnh Reefer và tiến độ hành trình chặng xe.
7. `costs`: Đối soát chi phí cầu đường tự động qua cổng BOT VETC / ePass và sổ theo dõi nạp dầu Diesel (Fuel Ledger).
8. `maintenance`: Đăng ký lịch bảo dưỡng, sửa chữa định kỳ và chuyển giao thẩm quyền kỹ thuật sang Phân hệ Quản lý Tài sản & Thiết bị (M38).
9. `analytics`: Báo cáo phân tích chuyên sâu: tỷ lệ giao đúng hẹn (SLA OTD), định mức tiêu thụ nhiên liệu L/100km, tỷ lệ khai thác đội xe và cơ cấu chi phí vận hành.

### Tầng L2: Action Bars & Multi-level Filter Controls
- Tìm kiếm từ khóa theo mã lệnh, khách hàng, điểm đi, điểm đến.
- Bộ lọc trạng thái vận chuyển: `ALL`, `DRAFT`, `PLANNED`, `ASSIGNED`, `IN_TRANSIT`, `DELIVERED`, `POD_CONFIRMED`.
- Bộ lọc giao hàng chặng DO: `ALL`, `READY_TO_DISPATCH`, `IN_TRANSIT`, `POD_CONFIRMED`.

### Tầng L3: Enterprise Tables & Dense Data Grids
- Bảng hiển thị thông tin tối ưu khoảng cách, phân cách ranh giới rõ ràng (`border-slate-200 dark:border-slate-700`).
- Toàn bộ trường số tiền, trọng lượng, số km, lít dầu, phần trăm được hiển thị với `font-mono tabular-nums`.
- Các nút hành động tác vụ trực tiếp: Gán xe, Xác nhận POD, In phiếu, Lập ngoại lệ, Mô phỏng ứng dụng tài xế.

### Tầng L4: 360° Detail Drawer & Deep Inspection
- Component `LogisticsDetailDrawer.tsx`: Drawer trượt mượt mà từ bên phải màn hình khi người dùng chọn bất kỳ lệnh vận chuyển nào.
- Hiển thị đầy đủ thông tin:
  - Thông tin chung, tuyến đường & chặng dừng Stops.
  - Thông tin phương tiện, tài xế & liên lạc.
  - Phân bổ chi phí (Cước phí, Tiền dầu, Phí cầu đường BOT).
  - Tích hợp liên kết chéo Phân hệ ERP:
    - `M13 (Sales Order)`: Đơn hàng gốc bán buôn.
    - `M17 (WMS Warehouse)`: Phiếu xuất kho bàn giao hàng lên xe.
    - `M31 (Accounting)`: Kích hoạt ghi nhận doanh thu và xuất hóa đơn GTGT sau khi ký POD.
    - `M38 (Asset Maintenance)`: Hồ sơ kỹ thuật và bảo dưỡng phương tiện.
  - Nhật ký sự kiện hành trình (Audit Trail Timeline).

---

## 3. CÁC MODAL ĐƯỢC TÁCH MODULE HÓA ĐỘC LẬP
1. `NewOrderModal.tsx`: Khởi tạo Lệnh Vận Chuyển mới với tính toán trọng tải và thể tích.
2. `AssignDispatchModal.tsx`: Điều phối xe và tài xế, tích hợp engine kiểm tra điều kiện an toàn Pre-dispatch Checklist.
3. `PodModal.tsx`: Lập biên bản giao hàng điện tử và ký nhận POD.
4. `NewVehicleModal.tsx`: Đăng ký xe mới vào Fleet Management.
5. `NewDriverModal.tsx`: Hồ sơ hóa tài xế mới vào Driver Roster.
6. `NewFuelModal.tsx`: Ghi nhận giao dịch nạp dầu Diesel và số km Odometer.
7. `NewExceptionModal.tsx`: Ghi nhận sự cố bất thường trên đường vận chuyển.
8. `NewMaintModal.tsx`: Đăng ký bảo dưỡng định kỳ chuyển giao sang phân hệ M38.
9. `PrintDocumentModal.tsx`: In Phiếu Vận Chuyển Vận Tải và Biên Bản Nghiệm Thu Bàn Giao Hàng Hóa POD theo chuẩn in A4 / Bill.
10. `MobileDriverAppSimulator.tsx`: Mô phỏng ứng dụng di động dành riêng cho tài xế giao nhận, cập nhật trạng thái xuất bến, chụp ảnh chứng từ và ký xác nhận tại điểm nhận hàng.

---

## 4. XÁC NHẬN TUÂN THỦ RULE #19 & RULE #20
- [x] **Zero `window.alert` / `window.confirm`**: Thay thế 100% bằng `ConfirmDialog` cho việc xuất bến điều vận và xác nhận POD.
- [x] **WCAG AA Compliance**: Nền sáng `bg-white / bg-slate-50` và nền tối `dark:bg-slate-800 / dark:bg-slate-900`, độ tương phản văn bản đạt chuẩn &ge; 4.5:1.
- [x] **Typography Monospace**: Mọi số liệu cước phí, lít dầu, km, biển số xe đều dùng `font-mono tabular-nums`.
- [x] **Bảo toàn 100% tính năng nghiệp vụ**: Toàn bộ API endpoints (`/api/logistics/*`), bộ lọc, tính toán KPI, telemetry GPS, đối soát VETC và quản lý đội xe được giữ trọn vẹn và tối ưu hóa hiệu năng render.
