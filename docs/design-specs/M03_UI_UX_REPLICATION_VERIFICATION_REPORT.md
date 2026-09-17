# BÁO CÁO NGHIỆM THU KIỂM TOÁN & ĐỒNG BỘ GIAO DIỆN PHÂN HỆ M03
## (SYSTEM SETTINGS & GLOBAL CONFIGURATION — ENTERPRISE PARAMETERS & GOVERNANCE SSOT)

**Ngày nghiệm thu:** 15/09/2026  
**Phân hệ kiểm định:** `M03` — System Settings & Global Configuration Workspace  
**Tệp điều phối trung tâm:** `/src/modules/admin/m03-system-settings/components/SystemSettingsWorkspace.tsx`  
**API Router Backend:** `/src/routes/settings.routes.ts`  
**Tiêu chuẩn kiểm định:** Rule #01 (Architecture First), Rule #02 (Reuse Before Create), Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Module Replication Protocol) trong `GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`  
**Trạng thái nghiệm thu:** 🟢 **ĐẠT 100% TIÊU CHUẨN DOANH NGHIỆP (ENTERPRISE CERTIFIED)**

---

## 1. TỔNG QUAN KIẾN TRÚC PHÂN TẦNG L0 – L4 (CHUẨN ENTERPRISE ERP)

| Phân Tầng Kiến Trúc | Chi Tiết Thực Thi Trong M03 | Trạng Thái Đánh Giá |
|---|---|:---:|
| **Tầng L0: Banner Header** | Header tích hợp Icon `Settings` xanh indigo, Chip `M03 • SYSTEM SETTINGS & GLOBAL CONFIGURATION`, Huy hiệu trạng thái vận hành `99.99%`, Huy hiệu `Rule #19 Confirmed`, Nút Rà Soát Toàn Vẹn, Nút Sao Lưu Server (`SystemConfigBackupUtility`), Nút Xuất Snapshot JSON (SHA-256), Nút In/Xem PDF (`PdfPrintModal`), Nút Chạy Chẩn Đoán Lại và Xuất Báo Cáo CSV | **ĐẠT (100%)** |
| **Tầng L1: Navigation Strip** | Thanh điều hướng 10 sub-tabs nghiệp vụ hoàn chỉnh (`parameters`, `currencies`, `numbering`, `fiscal`, `costing`, `branches`, `profiles`, `flags`, `audit`, `integrity`), đồng bộ trạng thái phiên qua `useWorkspaceSessionTab<SystemSettingsSubTab>('M03', 'parameters')` | **ĐẠT (100%)** |
| **Tầng L2: Context & Action Bars** | Thanh trạng thái hiển thị ngữ cảnh chi nhánh đang kích hoạt (`BR_HO`), hồ sơ môi trường hiện hành (`FULL_ERP`), bộ lọc đa chiều (Omnibar, Role Filter, Level Filter, Severity Badges) | **ĐẠT (100%)** |
| **Tầng L3: Master Views & Controls** | 10 Tab chuyên sâu kết nối cơ sở dữ liệu thực (`systemConfigs`, `currencyRates`, `documentSequences`, `fiscalPeriods`, `systemTaxRates`, `featureFlags`, `systemSettingsAudit`), lưới ma trận RBAC, bảng tỷ giá ngoại tệ, quản lý chuỗi số chứng từ, bảng kiểm soát kỳ kế toán, ma trận phương pháp tính giá vốn, đa chi nhánh, hồ sơ môi trường và công cụ kiểm toán toàn vẹn hệ thống | **ĐẠT (100%)** |
| **Tầng L4: Drawers, Modals & Utilities** | Modal chi tiết `SettingsDetailModal.tsx` cho phiên làm việc / chi nhánh / chẩn đoán; Tiện ích sao lưu máy chủ `SystemConfigBackupUtility.tsx`; Hộp thoại xác nhận rủi ro `ConfirmDialog.tsx`; Modal xuất bản in PDF `PdfPrintModal.tsx` | **ĐẠT (100%)** |

---

## 2. DANH MỤC ĐỐI CHIẾU 10 SUB-TABS NGHIỆP VỤ (PHASE 0 – PHASE 3 MATRIX)

| STT | Mã Tab | Tên Tab & Chức Năng | Loại Màn Hình | Tính Năng Nổi Bật & Chuẩn UI Đồng Bộ | Trạng Thái |
|:---:|:---|:---|:---|:---|:---:|
| 1 | `parameters` | **Tham Số Toàn Cục, RBAC & Chẩn Đoán** | Form + Matrix + Data Grid | Cấu hình tham số lõi (Tên DN, MST, Đồng tiền cơ sở, Định dạng số, Debug log, Tự động sao lưu); Ma trận phân quyền RBAC 5 vai trò (Admin, Manager, Accountant, Warehouse, Sales) cho toàn bộ phân hệ ERP; Hạn mức phê duyệt Maker-Checker & SLA tác vụ; Bảng giám sát phiên làm việc (Active Sessions) với thao tác Buộc thoát (Force Logout) bảo mật qua `ConfirmDialog.tsx`; Chẩn đoán 5 thành phần hạt nhân hệ thống | **ĐẠT** |
| 2 | `currencies` | **Ngoại Tệ, Tỷ Giá & Biểu Thuế Suất** | Data Table + Forms + Rate Matrix | Quản lý danh mục ngoại tệ (USD, EUR, JPY, GBP, CNY, SGD), tỷ giá mua/bán so với đồng tiền cơ sở VND; Biểu thuế suất hệ thống (VAT 0%, 5%, 8%, 10%, Thuế tiêu thụ đặc biệt, Thuế nhập khẩu); Tích hợp lưu trữ database SQLite qua `/api/settings/currencies` và `/api/settings/taxes` | **ĐẠT** |
| 3 | `numbering` | **Quy Tắc Sinh Mã & Chuỗi Số Chứng Từ** | Configuration Grid + Preview | Cấu hình tiền tố (Prefix), hậu tố, số chữ số (Padding), chuỗi số hiện tại và chuỗi số tiếp theo cho mọi loại chứng từ doanh nghiệp (SO, PO, INV, MO, ADJ, TR, LOT, SER, WMS); Tự động tăng số và ngăn trùng lặp số chứng từ | **ĐẠT** |
| 4 | `fiscal` | **Kỳ Kế Toán & Sao Lưu Snapshot** | Calendar Grid + Backup Center | Quản lý 12 kỳ tài chính trong năm, trạng thái Mở (OPEN) / Đóng mềm (SOFT_CLOSED) / Niêm phong khóa sổ (LOCKED); Chốt kỳ kế toán có xác nhận an toàn qua `ConfirmDialog.tsx`; Xuất bản snapshot JSON mã hóa SHA-256; Tiện ích kết nối sao lưu máy chủ trung tâm | **ĐẠT** |
| 5 | `costing` | **Phương Pháp Tính Giá Vốn Tồn Kho** | Policy Matrix + Branch Allocation | Thiết lập phương pháp tính giá vốn kho (FIFO - Nhập trước xuất trước, Trọng số di động Moving Average, Giá tiêu chuẩn Standard Cost) theo từng chi nhánh và nhóm danh mục sản phẩm, đồng bộ chặt chẽ với phân hệ M17 và M42 | **ĐẠT** |
| 6 | `branches` | **Quản Trị Đa Đơn Vị / Chi Nhánh** | Branch Switcher Cards + Master Table | Quản lý 4 đơn vị thành viên (Trụ sở Hà Nội, Chi nhánh HCM, Hub Đà Nẵng, Vệ tinh Cần Thơ); Phân lập sổ cái độc lập (GL Isolation), kho hàng 3 trạng thái độc lập; Thao tác chuyển chi nhánh làm việc có xác nhận an toàn qua `ConfirmDialog.tsx` | **ĐẠT** |
| 7 | `profiles` | **Hồ Sơ Môi Trường Vận Hành ERP** | Profile Selector + Module Matrix | Kích hoạt hồ sơ vận hành theo ngành nghề (Toàn diện FULL_ERP, Thương mại phân phối TRADING, Sản xuất & WMS, Chuỗi bán lẻ POS); Ma trận kiểm soát phân hệ hoạt động (Module Registry Scope) hiển thị trực quan các phân hệ được bật hoặc khóa | **ĐẠT** |
| 8 | `flags` | **Cờ Tính Năng & Mẫu Thông Báo** | Feature Toggles Grid + Template View | Quản lý cờ tính năng mở rộng (Multi-warehouse, Advanced Lot/Serial, AI Assistant, EDI Integration); Tùy biến mẫu email/SMS thông báo chứng từ ERP với bộ biến số động | **ĐẠT** |
| 9 | `audit` | **Nhật Ký Kiểm Toán Thay Đổi Cấu Hình** | Immutable Audit Trail Ledger | Ghi nhận toàn bộ biến động tham số hệ thống: Nhóm cấu hình, Hành động (CREATE, UPDATE, DELETE), Khóa tham số, Giá trị cũ, Giá trị mới, Người thực hiện, Dấu thời gian và chữ ký bảo mật SHA-256; Bộ lọc tìm kiếm kiểm toán đa chiều | **ĐẠT** |
| 10 | `integrity` | **Rà Soát Toàn Vẹn & Dọn Rác Dữ Liệu** | Integrity Dashboard + Scan Engine | Quét sâu 10 quy tắc toàn vẹn hệ thống (CONFIG, GARBAGE, REFERENTIAL, POLICY); Tính điểm sức khỏe vận hành (Health Score 0-100); Tính năng Sửa tự động (Auto-Fix) và Dọn rác an toàn (Garbage Purge) tuân thủ 100% Rule #19 qua `ConfirmDialog.tsx` | **ĐẠT** |

---

## 3. TIỆN ÍCH SAO LƯU MÁY CHỦ & XUẤT SNAPSHOT MỚI (UPDATE v4.2)

### 3.1 Tiện Ích Sao Lưu Máy Chủ (`SystemConfigBackupUtility.tsx`)
- **Tạo bản sao lưu tức thời (`POST /api/settings/backup/trigger`):** Đóng gói toàn bộ cấu hình ERP hoặc theo phạm vi chuyên biệt (Tài chính & Thuế, Kho vận & Mẫu số, Cờ tính năng).
- **Mã định danh chuẩn ERP:** Tự động sinh mã `BKP-YYYYMMDD-HHMMSS-XXXXXX`, tính dung lượng tệp tin (bytes/KB) và chữ ký băm **SHA-256** chống sửa đổi dữ liệu trái phép.
- **Kho lưu trữ trên máy chủ trung tâm (`GET /api/settings/backup/list`):** Hiển thị lịch sử các điểm sao lưu, cho phép sao chép nhanh chuỗi hash SHA-256 chỉ với 1 click.
- **Tải tệp tin riêng lẻ (`/api/settings/backup/download/:backupId`):** Tải về tệp JSON hoàn chỉnh của bất kỳ bản sao lưu nào đã lưu trữ.
- **Xóa điểm phục hồi an toàn (`DELETE /api/settings/backup/:backupId`):** Yêu cầu xác nhận cấp độ `danger` qua `ConfirmDialog.tsx`, tự động ghi vết vào Sổ kiểm toán bảo mật M03 Audit Trail.

### 3.2 Nút Xuất Snapshot JSON Trực Tiếp Trên Header L0
- Nút bấm **"Xuất Snapshot JSON"** đặt trực tiếp tại thanh điều khiển trung tâm Workspace.
- Cơ chế xuất snapshot không chặn luồng (Non-blocking Streaming), đóng gói toàn bộ bảng tham số, ngoại tệ, chuỗi số, kỳ kế toán, thuế suất và cờ tính năng kèm chữ ký xác thực toàn vẹn.

---

## 4. BẰNG CHỨNG KIỂM TRA MÃ NGUỒN & TIÊU CHUẨN THIẾT KẾ

### 4.1 Tuân thủ tuyệt đối Rule #19 (Không sử dụng Browser Alert / Confirm)
- Toàn bộ mã nguồn phân hệ M03 (`SystemSettingsWorkspace.tsx`, `SettingsParametersTab.tsx`, `SettingsBranchesTab.tsx`, `SettingsProfilesTab.tsx`, `SettingsFiscalBackupTab.tsx`, `SystemIntegrityChecker.tsx`, `SystemConfigBackupUtility.tsx`) **hoàn toàn không chứa** `window.alert()`, `window.confirm()` hay `window.prompt()`.
- 100% các hành động nhạy cảm đều được bảo vệ bởi `ConfirmDialog.tsx`:
  - Buộc thoát phiên làm việc (Force Logout Session): `variant: 'danger'`
  - Lưu tham số cấu hình toàn cục: `variant: 'primary'`
  - Chuyển đổi chi nhánh vận hành: `variant: 'primary'`
  - Kích hoạt hồ sơ môi trường ERP: `variant: 'primary'`
  - Đóng / Khóa kỳ kế toán: `variant: 'warning'`
  - Kích hoạt sao lưu máy chủ: `variant: 'primary'`
  - Xóa vĩnh viễn bản sao lưu máy chủ: `variant: 'danger'`
  - Sửa lỗi cấu hình tự động: `variant: 'primary'`
  - Dọn rác hệ thống (Garbage Purge): `variant: 'warning'`

### 4.2 Định dạng số liệu, mã định danh & tiền tệ chuẩn Doanh Nghiệp
- Toàn bộ giá trị tỷ giá, hạn mức phê duyệt, số dư, dung lượng tệp tin và số bản ghi đều sử dụng `font-mono tabular-nums font-bold`.
- Căn lề số liệu về bên phải (`text-right`), văn bản về bên trái (`text-left`), mã ngắn và trạng thái ở giữa (`text-center`).

### 4.3 Chuẩn tương phản màu sắc WCAG AA (Tối thiểu 4.5:1)
- **Thành công / Hoạt động:** `bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200`
- **Cảnh báo / Cần chú ý:** `bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200`
- **Nguy hiểm / Bị khóa:** `bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200`
- **Thông tin / Đang xử lý:** `bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300`
- **Viền chỉ thị dòng bảng:** Áp dụng `border-l-4` phân định trạng thái rõ ràng, hover mượt mà với `hover:bg-slate-50 dark:hover:bg-slate-800/40`.

---

## 5. THẨM QUYỀN DUY NHẤT & NGUYÊN TẮC SINGLE WRITER (RULE #03 – #07)

1. **Global Configuration Single Writer Authority:**
   - M03 là thẩm quyền tối cao và duy nhất chịu trách nhiệm lưu trữ, cấp phát và quản lý các tham số hoạt động toàn cục, tỷ giá ngoại tệ, thuế suất, mẫu chuỗi số chứng từ và cờ tính năng cho 42 phân hệ ERP.
2. **Kỳ Kế Toán (Fiscal Period Authority):**
   - M03 phối hợp chặt chẽ với Sổ cái tổng hợp M30 (General Ledger) để khóa sổ kỳ kế toán. Khi M03 niêm phong một kỳ tài chính (`LOCKED`), các phân hệ M13 (Bán hàng), M08 (Mua hàng), M31 (Hóa đơn), M32 (Thu chi) bị khóa quyền ghi nhận giao dịch vào kỳ đó.
3. **Chi Nhánh & Phân Lập Sổ Sách (Multi-Branch Isolation):**
   - Mỗi chi nhánh được gắn chặt với mã sổ cái GL độc lập (`GL-HN01`, `GL-HCM02`, `GL-DN03`, `GL-CT04`) và kho hàng trực thuộc.
4. **Không Dữ Liệu Giả Lập / Mock Data:**
   - 100% dữ liệu của M03 được ánh xạ tới các bảng SQLite thực tế thông qua Drizzle ORM và Express API endpoints chuyên dụng tại `/src/routes/settings.routes.ts`.

---

## 6. KẾT LUẬN NGHIỆM THU

Phân hệ **M03 (System Settings & Global Configuration)** đã hoàn thành toàn bộ các tiêu chí nghiệm thu theo chuẩn kiến trúc cấp doanh nghiệp:
- ✅ Xóa bỏ file kiểm kê cũ trước đồng bộ (`M03_FEATURE_BASELINE_BEFORE_SYNC.md`).
- ✅ Lập báo cáo nghiệm thu và kiểm toán chi tiết (`M03_UI_UX_REPLICATION_VERIFICATION_REPORT.md`).
- ✅ Triển khai thành công Tiện ích Sao lưu Máy chủ (`SystemConfigBackupUtility.tsx`) và chức năng Xuất Snapshot JSON.
- ✅ Đảm bảo 100% các tiêu chuẩn thiết kế Rule #19 (ConfirmDialog, WCAG AA) và Rule #20 (Full Replication Protocol).
- ✅ Kiểm thử biên dịch toàn hệ thống (`compile_applet`) thành công không có lỗi.
