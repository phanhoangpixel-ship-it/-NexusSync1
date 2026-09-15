# M04 SUPERADMIN RBAC & SOVEREIGN IAM WORKSPACE
## FEATURE BASELINE BEFORE UI SYNCHRONIZATION

**Document Reference:** `/docs/design-specs/M04_FEATURE_BASELINE_BEFORE_SYNC.md`  
**Governing Standard:** Rule #01 (Architecture First), Rule #02 (Reuse Before Create), Rule #19 (ConfirmDialog & WCAG AA), Rule #20 (Full Replication Protocol)  
**Tác giả:** Chuyên viên Lập trình Frontend Cấp cao & Kiến trúc sư ERP — NexusSync ERP Team  
**Mục đích:** Ghi nhận toàn bộ baseline tính năng, API endpoints, hành động người dùng, quy tắc an ninh RBAC/SoD và validation của Phân hệ M04 trước khi tiến hành đồng bộ giao diện theo `M41_MASTER_DESIGN_SPEC.md`.

---

### 1. TỔNG QUAN CẤU TRÚC PHÂN HỆ M04

Phân hệ **M04 — SuperAdmin RBAC Portal & Phân Quyền Hạt Nhân** bao gồm 4 tab nghiệp vụ và 2 modal cấp phân hệ:

| STT | Mã Tab | Tên Tab Nghiệp Vụ | File Component | Loại Màn Hình | Vai Trò Chức Năng Cốt Lõi |
|:---:|:---|:---|:---|:---|:---|
| 1 | `roles` | **Danh Sách Vai Trò & Ma Trận** | `/src/components/workspaces/superAdmin/RbacRolesTab.tsx` | Master/List Table + Form Tạo Mới + Filter Bar | Quản lý danh mục vai trò hệ thống, phân cấp an ninh (Tier 1 Sovereign, Tier 2 Governance, Tier 3 Operational), tạo mới vai trò, nhân bản (clone), xóa vai trò tùy biến. |
| 2 | `permissions` | **Đặc Quyền Hạt Nhân** | `/src/components/workspaces/superAdmin/RbacPermissionsTab.tsx` | Atomic Privilege Ledger + Category Filter Bar | Danh mục 48+ đặc quyền hạt nhân bảo vệ 42 phân hệ ERP, phân loại cấp độ rủi ro (CRITICAL, HIGH, MEDIUM, STANDARD), endpoint API Gateway và số lượng vai trò được cấp. |
| 3 | `users` | **Phân Bổ Người Dùng** | `/src/components/workspaces/superAdmin/RbacUsersTab.tsx` | User Account Matrix + Inline Role Editor + Lock Toggle | Phân bổ vai trò tài khoản IAM, gán phạm vi chi nhánh (Multi-Tenant Branch Scope), giám sát xác thực 2 bước MFA, khóa/mở khóa tài khoản khẩn cấp. |
| 4 | `diagnostics` | **Chẩn Đoán SoD & An Ninh** | `/src/components/workspaces/superAdmin/RbacDiagnosticsTab.tsx` | SoD Compliance Matrix + Live Diagnostic Scanner | Rà soát phân tách trách nhiệm (Separation of Duties), kiểm tra xung đột vai trò chéo giữa Maker-Checker, xác thực chữ ký phiên HMAC SHA-256, xuất báo cáo SOX/ISO 27001. |

---

### 2. CHI TIẾT TỪNG TAB: API, HÀNH ĐỘNG, RBAC/SOD & VALIDATION

#### Tab 1: `roles` (Danh Sách Vai Trò & Ma Trận)
- **API Endpoints:**
  - `GET /api/rbac/roles` — Tải danh sách vai trò phân quyền và số lượng tài khoản/đặc quyền liên kết.
- **Hành động Người Dùng:**
  - `Tìm kiếm`: Lọc tức thì theo Tên vai trò, Mã code hoặc Mô tả chức năng.
  - `Lọc Phân Cấp`: Lọc theo Tier (Tất cả, TIER_1_SOVEREIGN, TIER_2_GOVERNANCE, TIER_3_OPERATIONAL).
  - `Thêm Vai Trò Mới`: Điền mã, tên, cấp bậc an ninh, mô tả và kích hoạt ConfirmDialog tạo vai trò.
  - `Nhân Bản Vai Trò (Clone)`: Kích hoạt ConfirmDialog sao chép vai trò với hậu tố `_COPY`.
  - `Xóa Vai Trò`: Kích hoạt ConfirmDialog nguy hiểm để thu hồi và xóa vai trò khỏi hệ thống.
  - `Xem Chi Tiết`: Mở `SuperAdminDetailModal` hiển thị toàn bộ thuộc tính, checksum SHA-256 và danh sách quyền đại diện.
  - `Chọn Đối Tượng Context`: Cập nhật `onSelectEntity` nạp đối tượng ROLE vào thanh ngữ cảnh toàn cục.
- **Quy Tắc RBAC & SoD:**
  - Vai trò hệ thống (`isSystem = true`, ví dụ: SUPER_ADMIN, SYSTEM_AUDITOR) bị KHÓA CỨNG không thể xóa.
  - Thao tác tạo vai trò Tier 1 kích hoạt ConfirmDialog cấp độ `danger`.
- **Validation Code Cứng:**
  - `newRoleCode` và `newRoleName` bắt buộc không được rỗng.
  - `newRoleCode` tự động chuẩn hóa: `trim().toUpperCase().replace(/\s+/g, '_')`.

#### Tab 2: `permissions` (Đặc Quyền Hạt Nhân)
- **API Endpoints:**
  - `GET /api/rbac/permissions` — Tải danh mục đặc quyền hạt nhân bảo vệ 42 phân hệ ERP.
- **Hành động Người Dùng:**
  - `Tìm kiếm`: Tra cứu đặc quyền theo mã quyền, tên quyền, API Gateway endpoint hoặc mã phân hệ (`M01`–`M42`).
  - `Lọc Cấp Độ Rủi Ro`: Lọc theo ALL, CRITICAL (Tối mật), HIGH (Cao), MEDIUM (Trung bình), STANDARD (Tiêu chuẩn).
  - `Lọc Nhóm Nghiệp Vụ`: Lọc theo nhóm CORE, FINANCE, SUPPLY_CHAIN, MANUFACTURING, SALES, GOVERNANCE.
  - `Xem Chi Tiết`: Mở `SuperAdminDetailModal` hiển thị endpoint bảo vệ, action, mô tả và cấp độ rủi ro.
  - `Chọn Đối Tượng Context`: Cập nhật `onSelectEntity` nạp đối tượng PERMISSION vào thanh ngữ cảnh.
- **Quy Tắc RBAC & SoD:**
  - Bảng đặc quyền là danh mục bất biến (Immutable Privilege Catalog), chỉ được cấp phát thông qua vai trò.
- **Validation Code Cứng:**
  - Bộ lọc tìm kiếm kết hợp đa điều kiện (Search Term + Risk Level + Category).

#### Tab 3: `users` (Phân Bổ Người Dùng)
- **API Endpoints:**
  - `GET /api/users` — Tải danh sách người dùng IAM, vai trò hiện tại, chi nhánh và trạng thái tài khoản.
- **Hành động Người Dùng:**
  - `Tìm kiếm`: Tra cứu theo Username, Họ tên, hoặc Email doanh nghiệp.
  - `Lọc Đa Chiều`: Lọc theo Vai Trò, Chi Nhánh Scope (HQ, BR_HO, BR_HCM, BR_DN, BR_CT) và Trạng Thái (ACTIVE, LOCKED).
  - `Chỉnh Sửa Vai Trò Trực Tiếp (Inline Edit)`: Chuyển đổi vai trò của người dùng ngay trên bảng, kích hoạt ConfirmDialog lưu thay đổi.
  - `Khóa / Mở Khóa Tài Khoản`: Chuyển đổi trạng thái tài khoản `ACTIVE` ↔ `LOCKED` có ConfirmDialog bảo vệ.
  - `Xem Chi Tiết`: Mở `SuperAdminDetailModal` xem chi tiết danh tính, MFA, chi nhánh và lịch sử đăng nhập.
  - `Chọn Đối Tượng Context`: Cập nhật `onSelectEntity` nạp đối tượng USER vào thanh ngữ cảnh.
- **Quy Tắc RBAC & SoD:**
  - Khóa tài khoản ngắt phiên làm việc ngay lập tức.
  - Chuyển sang vai trò Tier 1 Sovereign yêu cầu cảnh báo nguy hiểm trong ConfirmDialog (`variant: 'danger'`).
- **Validation Code Cứng:**
  - Kiểm tra vai trò đích hợp lệ trước khi gọi callback `onChangeUserRole`.

#### Tab 4: `diagnostics` (Chẩn Đoán SoD & An Ninh)
- **API Endpoints:**
  - Quản lý trạng thái nội bộ với `INITIAL_SOD_RULES`, cập nhật thời gian quét kiểm toán `lastAudited`.
- **Hành động Người Dùng:**
  - `Chạy Quét An Ninh Lại`: Kích hoạt ConfirmDialog xác nhận, mô phỏng quét ma trận kiểm soát nội bộ và cập nhật timestamp.
  - `Xuất Báo Cáo Kiểm Toán SoD`: Kích hoạt ConfirmDialog xuất file CSV phân tách chức năng.
  - `Xem Chi Tiết SoD Rule`: Mở `SuperAdminDetailModal` xem các cặp quyền xung đột và hướng dẫn khắc phục.
- **Quy Tắc RBAC & SoD:**
  - 100% tuân thủ nguyên tắc phân định trách nhiệm Maker-Checker, phát hiện kiêm nhiệm xung đột.
- **Validation Code Cứng:**
  - Chặn click liên tục khi đang chạy quét (`disabled={runningDiagnostics}`).

---

### 3. GLOBAL ACTIONS & MODALS

1. **In / Xuất PDF Phân Hệ:** `PdfPrintModal` cấu hình mã phân hệ `M04` và tên phân hệ đầy đủ.
2. **Tải Lại Dữ Liệu:** Nút "Tải Lại" gọi `fetchData()` đồng bộ đồng thời 3 API endpoints.
3. **Xuất Ma Trận CSV:** `handleExportCSV()` tạo Blob CSV tải xuống máy người dùng có ConfirmDialog.
4. **Hộp Thoại Xác Nhận Chuẩn Rule #19:** `ConfirmDialog` tập trung, 0 lệnh cấm `window.alert` / `window.confirm`.
5. **Modal Chi Tiết Sâu:** `SuperAdminDetailModal` xử lý 4 loại thực thể: `ROLE`, `USER`, `PERMISSION`, `SOD_RULE`.

---

### 4. CAM KẾT BẢO TOÀN TÍNH NĂNG KHI ĐỒNG BỘ GIAO DIỆN

Quá trình chuyển đổi giao diện từ `M41_MASTER_DESIGN_SPEC.md` sang `M04` cam kết:
- **100% giữ nguyên** toàn bộ API calls, state handlers, callbacks, logic lọc và quy tắc SoD nêu trên.
- **Chỉ thay đổi** các class Tailwind CSS, cấu trúc bố cục L0–L4, thẻ bảng, badge WCAG AA, typography font-mono theo đúng file đặc tả.
- Sử dụng toán tử `??` thay cho `||` đối với tất cả giá trị derived / tính toán động.
