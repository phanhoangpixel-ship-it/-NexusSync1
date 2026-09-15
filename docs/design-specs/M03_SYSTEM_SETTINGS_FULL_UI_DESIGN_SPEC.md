# NEXUSSYNC ERP — M03 SYSTEM SETTINGS & GLOBAL CONFIGURATION FULL UI/UX DESIGN SPEC
**Tài liệu Đặc tả Thiết kế Chi tiết Toàn diện Phân Hệ M03 — Tuân thủ Rule #19 & Rule #20**

- **Module Code:** `M03`
- **Module Name:** System Settings & Global Configuration
- **Domain:** `CORE / IAM`
- **Group:** `06. Quản Trị & Hệ Thống (Governance & System)`
- **Workspace ID:** `WS01_HUB`
- **Governing Standards:**
  - `UI_UX_ENTERPRISE_DESIGN_STANDARDS_M18_M19.md` (WCAG AA Contrast, Status Badges, Monospace for numbers/codes, Table Hover, ConfirmDialog)
  - `UI_UX_MODULE_FULL_REPLICATION_PROTOCOL.md` (Phase 0 đến Phase 3)
  - `GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md` (Rule #01 Architecture First, Rule #02 Reuse Before Create, Rule #19 Confirm Dialog, Rule #20 Replication Protocol)

---

## PHASE 0 — KIỂM KÊ CÁC SUB-TABS TRONG PHÂN HỆ M03

Phân hệ M03 bao gồm 4 Sub-Tabs nghiệp vụ quản trị hạt nhân:
1. **Tab 1: `parameters` — Cấu Hình Tham Số Toàn Cục & Vận Hành (Global Parameters & Operations)**
   - *Loại màn hình:* Form tham số toàn cục (Tên DN, MST, Đồng tiền cơ sở VND/USD/EUR, Dấu phân cách số, Debug logging, Backup tự động); Ma trận phân quyền RBAC trực quan (Xem V, Sửa E, Xóa D qua 5 vai trò hạt nhân); Bảng tỷ giá hối đoái quy đổi; Quy tắc sinh mã chứng từ (SO, MO, ADJ/TR, PO, INV); Hạn mức phê duyệt (Maker-Checker limits) & Cam kết SLA tác vụ; Bảng quản lý phiên làm việc đang hoạt động (Active Sessions) với thao tác Buộc thoát (Force Logout) bảo mật qua `ConfirmDialog.tsx`.
2. **Tab 2: `branches` — Quản Trị Đơn Vị / Chi Nhánh (Operating Branches Multi-Branch Governance)**
   - *Loại màn hình:* Hero Banner chi nhánh hiện hành với trạng thái đồng bộ trực tiếp; Lưới chuyển đổi chi nhánh (Branch Switcher Cards); Bảng danh mục chi nhánh chi tiết (Mã, Tên, Địa chỉ, Kho trực thuộc, Sổ cái độc lập, Tiền tố, Trạng thái, Thao tác kích hoạt) với `border-l-4`; Khối nguyên tắc phân lập dữ liệu kế toán GL & kho 3 trạng thái.
3. **Tab 3: `profiles` — Hồ Sơ Môi Trường ERP (Environment Profile Governance)**
   - *Loại màn hình:* Hero Banner hồ sơ môi trường kích hoạt; Lưới chọn mô hình hồ sơ mẫu (FULL_ERP, RETAIL_DIST, MANUFACTURING, TRADING_SCM) với chỉ số phân hệ khả dụng; Ma trận kiểm soát phân hệ hoạt động (Module Registry Matrix) phân chia theo 6 nhóm miền nghiệp vụ với huy hiệu Kích hoạt / Tạm khóa.
4. **Tab 4: `integrity` — Rà Soát Toàn Vẹn & Dữ Liệu Rác (System Integrity Checker Tool)**
   - *Loại màn hình:* Dashboard rà soát toàn diện 4 danh mục (CONFIG, GARBAGE, REFERENTIAL, POLICY); Bộ lọc đa chiều & KPI thống kê; Bảng danh sách quy tắc toàn vẹn với `border-l-4` theo mức độ (CRITICAL, WARNING, INFO, PASSED); Thao tác Sửa tự động (Auto-Fix) và Dọn dẹp rác (Garbage Purge) tuân thủ nghiêm ngặt Rule #19 qua `ConfirmDialog.tsx`.

---

## PHASE 1 — TRÍCH XUẤT ĐẶC TẢ THIẾT KẾ CHI TIẾT (LẶP CHO CÁC TAB)

### TAB 1: CẤU HÌNH THAM SỐ TOÀN CỤC & VẬN HÀNH (`parameters`)

#### 1.1 Cấu trúc bố cục (Layout Architecture L0–L4)
- **L0 Banner Cố định:** Header chứa Icon `Settings`, tiêu đề phân hệ `M03 • SYSTEM SETTINGS & GLOBAL CONFIGURATION`, huy hiệu trạng thái `Vận hành ổn định (99.99%)`, huy hiệu `Rule #19 Confirmed`, nút `Rà Soát Toàn Vẹn`, nút `In / Xuất PDF`, nút `Chạy Chẩn Đoán Lại`, nút `Xuất Báo Cáo CSV`.
- **L1 Navigation Strip:** Thanh điều hướng 4 Tab bo góc `rounded-xl`, đồng bộ trạng thái phiên qua `useWorkspaceSessionTab<SystemSettingsSubTab>('M03', 'parameters')`.
- **L2 Bộ lọc (Filter Bar):** Bộ lọc tìm kiếm nhanh cho Ma trận phân quyền RBAC và danh sách Phiên làm việc (Search Omnibar + Dropdown lọc phân hệ / vai trò + Counter pills).
- **L3 Data Grid Tables:** 
  - Bảng ma trận RBAC: Cột phân hệ, 5 cột vai trò với toggle V/E/D màu sắc phân biệt rõ ràng.
  - Bảng Active Sessions: Viền trái `border-l-4` phân biệt `ACTIVE` (xanh ngọc) và `SUSPICIOUS` (hổ phách), hover mượt mà.
  - Bảng Kết quả Chẩn đoán Hệ thống (Diagnostic Results): 5/5 bài test thành phần với độ trễ (latency) và trạng thái.
- **L4 Detail Modal / Drawer (`SettingsDetailModal.tsx`):** Modal kiểm tra chi tiết khi click vào hàng: xem chi tiết Phiên làm việc (IP, Agent, lịch sử đăng nhập) hoặc Chi tiết Chi nhánh hoặc Bài kiểm tra Chẩn đoán.

#### 1.2 Typography & Định dạng Chữ
- Tiêu đề Banner L0: `text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight`
- Nhãn phân hệ: `px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono font-bold rounded-md`
- Mã cấu hình / Session ID / Mã chi nhánh: `font-mono font-bold text-blue-600 dark:text-blue-400`
- Địa chỉ IP & Thiết bị: `font-mono tabular-nums text-slate-600 dark:text-slate-300 text-xs`
- Tỷ giá & Số tiền hạn mức: `font-mono font-bold tabular-nums` (vd: `25,450.00 VND`, `500,000,000 VND`)
- Dấu phân cách & Tiền tố: `font-mono font-bold text-slate-900 dark:text-slate-100`

#### 1.3 Hệ thống Màu sắc Trạng thái (Status Color Tokens - WCAG AA)
- **Hoạt động / Thành công / Kích hoạt (ACTIVE / ONLINE / PASSED):**
  - Badge: `bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold`
  - Viền bảng: `border-l-4 border-emerald-500/80 bg-emerald-50/10`
- **Cảnh báo / Nghi vấn / Maker-Checker (SUSPICIOUS / WARNING):**
  - Badge: `bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold`
  - Viền bảng: `border-l-4 border-amber-500 bg-amber-50/15`
- **Nguy hiểm / Bắt buộc thoát / Lỗi (CRITICAL / FAILED):**
  - Badge: `bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold`
  - Viền bảng: `border-l-4 border-rose-500 bg-rose-50/20`
- **Table Hover State:**
  - `hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150`

#### 1.4 Component & Interaction Chi Tiết (Rule #19 Bắt buộc)
- **ConfirmDialog.tsx:** Thay thế 100% `window.alert` và `window.confirm`:
  - Buộc thoát phiên làm việc (Force Logout): `variant: 'danger'`, yêu cầu xác nhận trước khi hủy token của người dùng.
  - Lưu cấu hình tham số toàn cục: `variant: 'primary'`, thông báo áp dụng ngay lập tức cho 29 phân hệ.
  - Chạy chẩn đoán hệ thống: `variant: 'info'`, chạy kiểm tra kết nối DB, Audit SHA-256, Sổ cái kép GL, EventBus, Ingress.
  - Xuất báo cáo chẩn đoán CSV: `variant: 'primary'`.
- **Entity Context Hooking:** Gọi `onSelectEntity` với cấu trúc `SelectedEntityContext` chuẩn:
  - Khi chọn phiên: `type: 'M03_SESSION'`, `code: session.id`, `title: session.user`.
  - Khi chọn chi nhánh: `type: 'M03_BRANCH'`, `code: branch.code`, `title: branch.name`.

---

### TAB 2: QUẢN TRỊ ĐƠN VỊ & CHI NHÁNH (`branches`)
- Hero Banner Chi nhánh hiện hành với trạng thái realtime.
- Lưới Branch Switcher Cards cho 4 chi nhánh (Hà Nội BR_HO, Hồ Chí Minh BR_HCM, Đà Nẵng BR_DN, Cần Thơ BR_CT).
- Chuyển đổi chi nhánh có xác nhận an toàn qua `ConfirmDialog.tsx` để bảo đảm người dùng nắm rõ ngữ cảnh sổ cái độc lập và kho hàng thay đổi.
- Bảng danh mục chi nhánh chi tiết đầy đủ cột với viền `border-l-4 border-blue-600` cho chi nhánh đang kích hoạt.
- 3 khối nguyên tắc phân lập (Isolation Rules): GL độc lập, Số dư kho 3 trạng thái độc lập, Phân quyền vận hành độc lập.

---

### TAB 3: HỒ SƠ MÔI TRƯỜNG ERP (`profiles`)
- Hero Banner Hồ sơ môi trường hiện hành (FULL_ERP, RETAIL_DIST, MANUFACTURING, TRADING_SCM).
- Lưới Profile Switcher Cards với thống kê số phân hệ kích hoạt (vd: 41/41 phân hệ cho FULL_ERP).
- Xác nhận kích hoạt hồ sơ qua `ConfirmDialog.tsx`.
- Ma trận phân hệ ERP chia theo 6 nhóm nghiệp vụ lớn, hiển thị trạng thái từng phân hệ với nhãn Monospace và badge Bật/Khóa.

---

### TAB 4: RÀ SOÁT TOÀN VẸN & DỌN RÁC DỮ LIỆU (`integrity`)
- Tích hợp công cụ `SystemIntegrityChecker.tsx` chuyên sâu của M03.
- Rà soát tự động các lỗi cấu hình tham số, quy tắc hối đoái, tính toàn vẹn khóa ngoại, đơn hàng nháp mồ côi và file đính kèm quá hạn.
- Tất cả thao tác "Sửa tự động" và "Dọn dẹp rác" đều được bao bọc bởi `ConfirmDialog.tsx`.

---

## PHASE 3 — KIỂM ĐỊNH BẰNG CHỨNG THỰC TẾ & BẢO ĐẢM TIÊU CHUẨN

- **L0 Banner Identity:** Icon `Settings`, Mã `M03 • SYSTEM SETTINGS & GLOBAL CONFIGURATION`, Huy hiệu `Rule #19 Confirmed` chuẩn WCAG AA, Nút Rà Soát Toàn Vẹn, Nút In / Xuất PDF, Nút Chạy Chẩn Đoán Lại, Nút Xuất CSV.
- **L1 Navigation Strip:** Đồng bộ phiên làm việc qua `useWorkspaceSessionTab<SystemSettingsSubTab>('M03', 'parameters')`.
- **Rule #19 Bắt buộc:** 100% không còn sử dụng `window.alert` hoặc `window.confirm`. Mọi thao tác Force Logout, Lưu cấu hình, Chuyển chi nhánh, Kích hoạt hồ sơ, Dọn rác đều thông qua `ConfirmDialog.tsx`.
- **L4 Detail Modal:** Có modal `SettingsDetailModal.tsx` kiểm tra chuyên sâu từng phiên làm việc, chi nhánh hoặc bài kiểm tra chẩn đoán.
- **Typography & Font Monospace:** Toàn bộ mã định danh (`BR_HO`, `SO-YYYY-#####`, `CFG-01`), số IP, ngày giờ, số lượng và giá trị tiền tệ đều áp dụng `font-mono tabular-nums font-bold`.
- **Status Color Badges & Table Row Borders:** Áp dụng đầy đủ `border-l-4` theo mức độ kết quả (`border-emerald-500`, `border-amber-500`, `border-rose-500`, `border-blue-500`), hover state mượt mà, đạt chuẩn WCAG AA.
- **Biên dịch & Tích hợp:** `compile_applet` thành công 100%, `npm run verify:modules` duy trì 42/42 module parity.
