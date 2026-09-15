# NEXUSSYNC ERP — M03 FEATURE BASELINE BEFORE DESIGN SYNCHRONIZATION

**Tài liệu Kiểm kê & Bảo toàn Tính năng Phân hệ M03 (System Settings & Global Configuration)**  
*Ngày lập:* 2026-09-12  
*Căn cứ:* Tuân thủ Rule #01, Rule #16, Rule #19 & Rule #20 (`UI_UX_MODULE_FULL_REPLICATION_PROTOCOL.md`)  
*Mục tiêu:* Ghi nhận toàn bộ API endpoint, User Actions, RBAC/SoD, Validation code cứng trước khi đồng bộ giao diện theo chuẩn M41.

---

## 1. TỔNG QUAN PHÂN HỆ M03 & DANH MỤC SUB-TABS

- **Mã Phân hệ:** `M03`
- **Tên Phân hệ:** System Settings & Global Configuration (Cấu hình & Quản trị Hệ thống Toàn cục)
- **Tệp điều phối hạt nhân:** `/src/components/workspaces/SystemSettingsWorkspace.tsx`
- **Sub-Tabs nghiệp vụ:**
  1. `parameters`: Cấu hình Tham số Toàn cục, Ma trận Phân quyền RBAC, Phiên Đăng nhập & Chẩn đoán Sức khỏe
  2. `branches`: Quản trị Đa Đơn vị / Chi nhánh (Multi-Branch Architecture & Ledger Isolation)
  3. `profiles`: Hồ sơ Môi trường Vận hành ERP (Environment Profiles & Module Registry Scope)
  4. `integrity`: Công cụ Rà soát Toàn vẹn Dữ liệu & Dọn dẹp Rác (System Integrity Checker Engine)

---

## 2. CHI TIẾT FEATURE BASELINE TỪNG SUB-TAB

### 2.1 Tab 1 — `parameters` (SettingsParametersTab.tsx)
- **API & Tác vụ Dữ liệu:**
  - `handleUpdateSettings`: Cập nhật state cấu hình toàn cục (`companyName`, `taxCode`, `baseCurrency`, `thousandSeparator`, `decimalSeparator`, `debugLogging`, `autoBackupDaily`).
  - `onRequestSaveSettings`: Mở `ConfirmDialog` xác nhận lưu cấu hình hệ thống, phát thông báo toast thành công `onNotify('success', ...)`.
  - `onTogglePermission`: Bật/tắt trực tiếp quyền Xem (V - View), Sửa (E - Edit), Xóa (D - Delete) cho từng vai trò (`admin`, `manager`, `accountant`, `warehouse`, `sales`) trên từng phân hệ ERP.
  - `onRequestForceLogout`: Mở `ConfirmDialog` xác nhận buộc thoát phiên làm việc theo `sessionId`, hủy token người dùng và lọc phiên khỏi `activeSessions`.
  - `onRequestRunDiagnostics`: Mở `ConfirmDialog` kích hoạt chạy chẩn đoán 5 thành phần hạt nhân (ACID Database, Audit Ledger SHA-256, Double-entry GL, EventBus Outbox, Nginx Ingress).
  - `onInspectSession`: Mở L4 Detail Modal (`SettingsDetailModal`) và đẩy ngữ cảnh sang thanh tra thực thể `onSelectEntity`.
  - `onInspectDiagnostic`: Mở L4 Detail Modal xem chi tiết kết quả kiểm tra thành phần chẩn đoán.
  - `handleRequestExportReport`: Xuất kết quả chẩn đoán 5 thành phần ra tệp `system_diagnostics_report_YYYY-MM-DD.csv`.
- **RBAC / SoD & Phân quyền:**
  - Bảng hạn mức phê duyệt Maker-Checker (`approvalLimits`): Nhân viên (Staff <= 50M tự động duyệt), Trưởng phòng (Manager <= 500M cần duyệt), Giám đốc Tài chính CFO (<= 5 Tỷ), CEO (> 5 Tỷ).
  - Cam kết SLA vận hành (`slaRules`): SO (Chuẩn 4h, Khẩn < 2h), PO (8h, Khẩn < 4h), Kho (2h, Khẩn < 1h), Thanh toán/Ngân quỹ (6h, Khẩn < 3h).
  - Giám sát phiên làm việc IP Ingress, thiết bị và gắn cờ cảnh báo `SUSPICIOUS` nếu truy cập bất thường.
- **Validation & Quy tắc cứng:**
  - Đồng tiền cơ sở: VND, USD, EUR.
  - Phân cách hàng nghìn / thập phân: `.` hoặc `,`.
  - Ma trận quyền: boolean cho từng bộ 3 thao tác (canView, canEdit, canDelete).

### 2.2 Tab 2 — `branches` (SettingsBranchesTab.tsx)
- **API & Tác vụ Dữ liệu:**
  - `onRequestBranchSelect`: Kích hoạt `ConfirmDialog` xác nhận chuyển chi nhánh làm việc, sau đó gọi callback `onBranchChange(branchId)` và `onNotify('info', ...)`.
  - `onInspectBranch`: Mở modal chi tiết L4 cho chi nhánh được chọn và thông báo `onSelectEntity`.
  - `searchTerm`: Lọc danh sách chi nhánh theo tên, mã hoặc địa chỉ.
- **RBAC / SoD & Phân lập:**
  - Phân lập sổ cái kế toán (GL Isolation): Mỗi chi nhánh sở hữu mã sổ cái riêng (`GL-HN01`, `GL-HCM02`, `GL-DN03`, `GL-CT04`).
  - Độc lập số dư tồn kho 3 trạng thái (Available, Reserved, In-transit).
  - Giới hạn quyền tạo đơn hàng và duyệt kho trong phạm vi chi nhánh.
- **Validation & Danh mục mẫu:**
  - 4 Chi nhánh: `BR_HO` (Trụ sở Hà Nội, prefix HN-), `BR_HCM` (Chi nhánh Miền Nam, prefix HCM-), `BR_DN` (Hub Miền Trung, prefix DN-), `BR_CT` (Vệ tinh Cần Thơ, prefix CT-).
  - Bắt buộc kiểm tra chi nhánh hiện hành trước khi cho phép kích hoạt chuyển đổi.

### 2.3 Tab 3 — `profiles` (SettingsProfilesTab.tsx)
- **API & Tác vụ Dữ liệu:**
  - `onRequestProfileSelect`: Kích hoạt `ConfirmDialog` xác nhận chuyển đổi cấu hình hồ sơ môi trường, gọi callback `onProfileChange(profileId)` và `onNotify('info', ...)`.
  - `searchTerm`: Tìm kiếm danh mục phân hệ thuộc hồ sơ.
- **RBAC / SoD & Quy tắc:**
  - Quản lý phạm vi hiển thị phân hệ: Hồ sơ kích hoạt sẽ mở hoặc khóa các module trong toàn bộ hệ thống.
  - Hỗ trợ hồ sơ toàn diện `*` (41 phân hệ) và các hồ sơ chuyên biệt theo ngành.
- **Validation & Danh mục mẫu:**
  - `FULL_ERP`: 41/41 phân hệ.
  - `TRADING_DISTRIBUTION`: Thương mại phân phối.
  - `MANUFACTURING_WMS`: Sản xuất & Kho vận.
  - `RETAIL_CHAIN`: Chuỗi bán lẻ POS/Store.

### 2.4 Tab 4 — `integrity` (SystemIntegrityChecker.tsx)
- **API & Tác vụ Dữ liệu:**
  - `handleRunDeepScan`: Mô phỏng quét sâu toàn bộ hệ thống với thanh tiến trình thời gian thực (`scanProgress`, `scanStepText`).
  - `handleAutoFixRule`: Mở `ConfirmDialog` xác nhận tự động sửa lỗi cấu hình theo từng quy tắc, cập nhật trạng thái `FIXED` và điểm số toàn vẹn.
  - `handlePurgeRule`: Mở `ConfirmDialog` xác nhận xóa rác an toàn theo quy tắc (ví dụ: `GARBAGE_TMP_DRAFTS`, `GARBAGE_ORPHAN_ATT`), cập nhật trạng thái `CLEANED`.
  - `handleAutoFixAllConfigs`: Sửa toàn bộ lỗi cấu hình đang phát hiện.
  - `handleRequestPurgeAllGarbage`: Dọn toàn bộ rác và giải phóng dung lượng lưu trữ tạm.
  - `handleExportIntegrityReport`: Xuất tệp CSV báo cáo toàn vẹn `system_integrity_check_YYYY-MM-DD.csv`.
- **RBAC / SoD & An toàn:**
  - Toàn bộ thao tác thanh lọc rác và sửa cấu hình bắt buộc thông qua `ConfirmDialog` chuẩn Rule #19.
  - Ngăn chặn xóa dữ liệu giao dịch cốt lõi (chỉ xóa file tạm, bản nháp hết hạn, tệp đính kèm mồ côi).
- **Validation & Quy tắc cứng:**
  - 10 Quy tắc kiểm tra (CFG-01, CFG-02, CFG-03, CFG-04, GAR-01, GAR-02, GAR-03, REF-01, REF-02, POL-01).
  - Điểm số toàn vẹn `healthScore` tính toán động (0 - 100).
  - Mức độ nghiêm trọng: `CRITICAL`, `WARNING`, `INFO`, `PASSED`.

---

## 3. GLOBAL WORKSPACE SHELL (SystemSettingsWorkspace.tsx)
- **Tầng L0 Banner:**
  - Badge mã: `M03 • SYSTEM SETTINGS & GLOBAL CONFIGURATION`
  - Chip trạng thái: `Vận hành ổn định (99.99%)`
  - Chip chứng nhận: `Rule #19 Confirmed`
  - Các nút hành động: Rà Soát Toàn Vẹn (`setActiveTab('integrity')`), In / Xuất PDF (`setIsPdfModalOpen(true)`), Chạy Chẩn Đoán Lại (`handleRequestRunDiagnostics`), Xuất Báo Cáo CSV (`handleRequestExportReport`).
- **Tầng L1 Navigation Bar:**
  - Đồng bộ phiên làm việc qua `useWorkspaceSessionTab<SystemSettingsSubTab>('M03', 'parameters')`.
  - 4 Nút tab bo góc chuẩn, hiển thị badge ngữ cảnh chi nhánh hiện hành và hồ sơ hiện hành.
- **Tầng L4 Modal:**
  - `SettingsDetailModal`: Xem thông tin chi tiết phiên làm việc, chi nhánh, kết quả chẩn đoán hoặc quy tắc toàn vẹn.
  - `ConfirmDialog`: Quản lý tập trung toàn bộ hộp thoại xác nhận (Rule #19).
  - `PdfPrintModal`: Xuất báo cáo quản trị hệ thống chuẩn PDF.

---

## 4. CAM KẾT BẢO TOÀN (ZERO REGRESSION)
1. Giữ nguyên 100% các hàm xử lý sự kiện, state management, props, callback.
2. Không thay đổi cấu trúc dữ liệu `BRANCH_METADATA`, `settings`, `permissionMatrix`, `approvalLimits`, `slaRules`, `activeSessions`, `diagnostics`, `rules`.
3. Chỉ nâng cấp lớp trình bày (Tailwind classes, Dark mode support, Border radii, Typography, WCAG AA contrast) theo đúng đặc tả `M41_MASTER_DESIGN_SPEC.md`.
