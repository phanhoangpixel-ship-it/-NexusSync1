# M04 — SuperAdmin Portal & Sovereign RBAC IAM Governance

**Module ID:** `M04`  
**Module Name:** SuperAdmin Portal & Fine-Grained RBAC Governance  
**Business Group:** `8. Hệ thống & Giám sát` (GOVERNANCE & SYSTEM IAM)  
**Workspace ID:** `WS01_HUB` / `M04` | **Primary Route:** `/super-admin`  
**Primary UI Component:** `/src/modules/admin/m04-super-admin/components/SuperAdminRBACWorkspace.tsx`  
**Routing Entry Point:** `/src/pages/SuperAdminPortal.tsx`  
**Primary API Router:** `/src/modules/admin/m04-super-admin/server/rbac.routes.ts` & `/server.ts`  
**Standard Compliance:** Rule #01 (Architecture First), Rule #02 (Reuse Before Create), Rule #03 – #07 (Write Authority), Rule #19 (ConfirmDialog & WCAG AA), Rule #20 (Full Replication Protocol)  
**Acceptance Status:** 🟢 **FROZEN & IMMUTABLE BASELINE — ENTERPRISE CERTIFIED (100%)**

---

## 1. Executive Summary & Core Mission

**Phân hệ M04 — SuperAdmin Portal & Fine-Grained RBAC Governance** là cổng bảo mật IAM (Identity & Access Management) tối cao của hệ sinh thái NexusSync ERP. Phân hệ nắm giữ quyền hạn độc quyền trong việc:
- Định nghĩa và quản trị danh mục vai trò hệ thống theo 3 cấp độ an ninh (`TIER_1_SOVEREIGN`, `TIER_2_GOVERNANCE`, `TIER_3_OPERATIONAL`).
- Cấu hình ma trận đặc quyền 6 hành động (`VIEW`, `CREATE`, `EDIT`, `DELETE`, `APPROVE`, `EXPORT`) bao phủ toàn diện **42 phân hệ ERP** (`M01`–`M42`).
- Phân bổ tài khoản người dùng, gán phạm vi chi nhánh (Multi-Tenant Branch Scope) và quản trị xác thực đa yếu tố (MFA).
- Giám sát phiên làm việc theo thời gian thực (Active Sessions) và cấu hình chính sách mật khẩu doanh nghiệp.
- Thiết lập bảo mật cấp hàng (Row-Level Security - RLS) và ủy quyền phê duyệt có thời hạn (Delegation).
- Quét chẩn đoán 10 quy tắc phân tách chức năng (Separation of Duties - SoD), bảo đảm tuân thủ chuẩn SOX, COBIT và ISO/IEC 27001.
- Duy trì sổ nhật ký kiểm toán bất biến (Immutable Audit Trail) với chữ ký số băm SHA-256.

---

## 2. Kiến Trúc Phân Tầng L0 — L4 (L0-L4 Shell Architecture)

1. **Tầng L0: Global Header & Security Status Bar**
   - Icon nhận diện `Shield` xanh tím indigo, Chip định danh `M04 • SUPERADMIN RBAC`.
   - Huy hiệu bảo mật tối cao: `Tier-1 Sovereign IAM`, `Zero-Trust Active`.
   - Thanh công cụ hành động: Nút In / Xuất PDF phân hệ (`PdfPrintModal`), Nút Tải Lại Dữ Liệu (`fetchData`), Nút Xuất Ma Trận Phân Quyền CSV.

2. **Tầng L1: Workspace Sub-Navigation Strip (8 Sub-Tabs)**
   - Lưu trữ và đồng bộ trạng thái tab phiên làm việc qua hook `useWorkspaceSessionTab<SuperAdminSubTab>('M04', 'roles')`.
   - Danh sách 8 Sub-Tabs:
     1. `roles`: **Vai Trò & Cấp Độ An Ninh** (Master/List + Clone Role + Approval Threshold VND).
     2. `matrix`: **Ma Trận 42 Phân Hệ** (Lưới 6 hành động VIEW/CREATE/EDIT/DELETE/APPROVE/EXPORT + Quick Preset).
     3. `permissions`: **Đặc Quyền Hạt Nhân** (Atomic Privilege Ledger + Phân loại rủi ro CRITICAL/HIGH/MEDIUM/STANDARD).
     4. `users`: **Người Dùng IAM** (User Grid + Tạo tài khoản mới + Nhập/Xuất CSV hàng loạt + Reset mật khẩu).
     5. `sessions`: **Phiên & Mật Khẩu** (Giám sát phiên làm việc thời gian thực + Thu hồi phiên + Cấu hình chính sách mật khẩu).
     6. `rls_tenant`: **Chi Nhánh & RLS** (Chính sách Row-Level Security + Quản lý chi nhánh + Ủy quyền phê duyệt).
     7. `diagnostics`: **Chẩn Đoán SoD** (Quét 10 quy tắc phân tách trách nhiệm Maker-Checker + Báo cáo tuân thủ SOX).
     8. `audit`: **Sổ Kiểm Toán** (Nhật ký sự kiện bảo mật bất biến + Chữ ký SHA-256).

3. **Tầng L2: KPI Summary & Operational Context**
   - Strip 4 chỉ số KPI cốt lõi:
     - `Tổng Số Vai Trò RBAC`: Thống kê số vai trò hệ thống & số vai trò Tier-1 Sovereign.
     - `Đặc Quyền Hạt Nhân`: Thống kê số lượng quyền bảo vệ 42 phân hệ.
     - `Tài Khoản Phân Bổ`: Số tài khoản IAM và số tài khoản đang ACTIVE.
     - `Tuân Thủ An Ninh SoD`: Tỷ lệ đạt chuẩn 100.0% trên 10 quy tắc an ninh.

4. **Tầng L3: Workspace Canvas & Data Grids**
   - Bộ lọc đa chiều: Tìm kiếm nhanh (Omnibar), Lọc theo vai trò, Lọc theo chi nhánh, Lọc theo trạng thái, Lọc theo nhóm quyền.
   - Bảng hiển thị dữ liệu lớn với hiệu ứng dòng (`hover:bg-slate-50`), font số liệu `font-mono tabular-nums font-bold`.

5. **Tầng L4: Detail Modals, Confirm Dialogs & Reports**
   - `SuperAdminDetailModal.tsx`: Xem chi tiết sâu hồ sơ vai trò, quyền hạn, người dùng và quy tắc SoD kèm mã băm SHA-256.
   - `ConfirmDialog.tsx`: 100% các hành động nhạy cảm (Khóa/Mở tài khoản, Cấp lại mật khẩu, Thu hồi phiên, Nhân bản/Xóa vai trò, Hủy ủy quyền) đều có xác nhận an toàn theo chuẩn Rule #19.
   - `PdfPrintModal.tsx`: Xem trước và in ấn / xuất tệp PDF phân hệ theo tiêu chuẩn doanh nghiệp.

---

## 3. Thẩm Quyền Đơn Nhất & Phân Định Trách Nhiệm (Single-Writer Authority)

- **Sovereign IAM Single Writer:**
  - M04 là chủ thể duy nhất có quyền tạo, sửa, xóa vai trò, gán đặc quyền và thay đổi trạng thái tài khoản người dùng trong toàn bộ ERP.
  - Các phân hệ nghiệp vụ khác (M08, M13, M17, M30...) chỉ đọc thông tin quyền hạn của người dùng từ token JWT hoặc session store, không được tự ý cấp quyền.
- **Quy Tắc Bảo Vệ Vai Trò Hệ Thống (Immutable System Roles):**
  - Các vai trò cốt lõi như `SUPER_ADMIN`, `SYSTEM_AUDITOR`, `CHIEF_FINANCIAL_OFFICER` có thuộc tính `isSystem = true`. Hệ thống cấm chỉnh sửa mã vai trò và cấm xóa các vai trò này.
- **Hạn Mức Phê Duyệt Tài Chính (Financial Approval Thresholds):**
  - Vai trò được gán trường `approvalThresholdVND` xác định số tiền tối đa mà vai trò đó được phép duyệt (ví dụ: CFO duyệt không giới hạn, Quản đốc duyệt tối đa 200 triệu VNĐ, Kế toán trưởng duyệt tối đa 500 triệu VNĐ).

---

## 4. Ma Trận Phân Quyền 6 Hành Động Trên 42 Phân Hệ ERP

Ma trận phân quyền M04 kiểm soát chặt chẽ 6 hành động độc lập trên 42 phân hệ ERP:

| Hành Động | Mã Quyền Chuẩn | Mô Tả Ý Nghĩa Nghiệp Vụ |
|---|:---:|---|
| **XEM** | `VIEW` | Cho phép truy cập phân hệ, tra cứu danh sách, xem chi tiết chứng từ và báo cáo. |
| **TẠO** | `CREATE` | Cho phép khởi tạo chứng từ, giao dịch hoặc bản ghi mới ở trạng thái Nháp (Draft). |
| **SỬA** | `EDIT` | Cho phép điều chỉnh thông tin các bản ghi chưa khóa sổ hoặc đang chờ duyệt. |
| **XÓA** | `DELETE` | Cho phép xóa mềm hoặc hủy chứng từ theo quy trình hủy bỏ doanh nghiệp. |
| **DUYỆT** | `APPROVE` | Thẩm quyền phê duyệt chứng từ chuyển trạng thái chính thức theo hạn mức tài chính. |
| **XUẤT** | `EXPORT` | Cho phép trích xuất dữ liệu, danh sách và báo cáo ra định dạng CSV, Excel hoặc PDF. |

---

## 5. Danh Mục 10 Quy Tắc Phân Tách Trách Nhiệm (SoD Compliance Engine)

1. **`SEC-FIN-01` (Kế toán & Ngân quỹ):** Phân tách lập & phê duyệt phiếu chi / thanh toán ngân hàng (Maker-Checker).
2. **`SEC-INV-02` (Kho vận & WMS):** Phân tách kiểm kê kho & điều chỉnh giảm tồn kho (Xuất hao hụt kho).
3. **`SEC-PUR-03` (Mua hàng & Cung ứng):** Phân tách tạo đơn mua hàng (PO) & nghiệm thu nhập kho (GRN).
4. **`SEC-HR-04` (Nhân sự & Tiền lương):** Phân tách lập bảng lương & duyệt lệnh thanh toán chi trả lương.
5. **`SEC-IAM-05` (An ninh IAM):** Tính toàn vẹn chữ ký token HMAC-SHA256 & chống leo thang đặc quyền trái phép.
6. **`SOD-IAM-06` (Quản trị IAM):** Nguyên tắc 4 mắt (4-Eyes Principle) phê duyệt thăng cấp tài khoản SuperAdmin.
7. **`SOD-SALES-07` (Bán hàng):** Phân tách nhân viên kinh doanh & duyệt chiết khấu thương mại quá hạn (>15%).
8. **`SOD-ASSET-08` (Tài sản):** Phân tách đề xuất & phê duyệt quyết định thanh lý tài sản cố định.
9. **`SOD-COST-09` (Giá thành & Costing):** Phân tách kỹ sư thiết lập định mức BOM & duyệt kết chuyển giá thành M42.
10. **`SOD-VEND-10` (Nhà cung cấp):** Phân tách tạo thông tin nhà cung cấp mới & duyệt thanh toán công nợ mua hàng.

---

## 6. Hợp Đồng Dữ Liệu & API Endpoints

- **Data Models / Entities:**
  - `RbacRole`: `id`, `code`, `name`, `description`, `tier`, `isSystem`, `userCount`, `permissionsCount`, `permissions`, `allowedBranches`, `approvalThresholdVND`, `updatedAt`, `auditChecksum`.
  - `RbacPermission`: `id`, `code`, `name`, `moduleCode`, `riskLevel`, `apiEndpoint`, `rolesCount`, `description`.
  - `RbacUser`: `id`, `username`, `fullName`, `email`, `roleCode`, `roleName`, `branchScope`, `allowedBranches`, `status`, `lastLogin`, `mfaEnabled`, `failedLoginAttempts`.
  - `SodDiagnosticRule`: `id`, `code`, `name`, `category`, `riskSeverity`, `description`, `conflictingPermissions`, `status`, `violationCount`, `details`, `lastAudited`, `remediationGuide`.
  - `ActiveSession`: `id`, `userId`, `username`, `fullName`, `ipAddress`, `device`, `location`, `loginTime`, `lastActivity`, `status`.
  - `TenantBranch`: `code`, `name`, `type`, `status`, `userCount`, `managerName`.
  - `RlsPolicy`: `id`, `name`, `module`, `filterExpression`, `appliedRoles`, `status`.
  - `DelegationRecord`: `id`, `delegatorUsername`, `delegatorName`, `delegateUsername`, `delegateName`, `roleCode`, `startDate`, `endDate`, `status`, `reason`, `maxApprovalVND`.
  - `RbacAuditLog`: `id`, `timestamp`, `actor`, `action`, `targetType`, `targetId`, `details`, `ip`, `severity`, `hash`.

- **API Endpoints:**
  - `GET /api/rbac/roles` — Lấy danh sách vai trò phân quyền.
  - `POST /api/rbac/roles` — Khởi tạo vai trò người dùng mới.
  - `POST /api/rbac/roles/:id/clone` — Nhân bản vai trò với hậu tố `_COPY`.
  - `DELETE /api/rbac/roles/:id` — Xóa vai trò tùy biến không phải vai trò hệ thống.
  - `GET /api/rbac/permissions` — Lấy danh mục đặc quyền hạt nhân 42 phân hệ.
  - `GET /api/users` — Lấy danh sách tài khoản IAM.
  - `POST /api/users` — Khởi tạo tài khoản người dùng mới.
  - `POST /api/users/bulk-import` — Nhập hàng loạt tài khoản từ file CSV.
  - `POST /api/users/:id/reset-password` — Cấp lại mật khẩu tạm thời cho người dùng.
  - `POST /api/users/:id/revoke-sessions` — Ngắt kết nối toàn bộ phiên làm việc của người dùng.
  - `PATCH /api/users/:id/role` — Cập nhật vai trò phân quyền của người dùng.
  - `PATCH /api/users/:id/status` — Khóa hoặc kích hoạt lại tài khoản người dùng.
  - `GET /api/rbac/matrix/:roleId` — Lấy ma trận phân quyền 6 hành động của một vai trò.
  - `PUT /api/rbac/matrix/:roleId` — Lưu cấu hình ma trận phân quyền 6 hành động.
  - `GET /api/rbac/sessions` — Lấy danh sách phiên làm việc đang hoạt động.
  - `DELETE /api/rbac/sessions/:sessionId` — Buộc thoát (Force Terminate) một phiên làm việc.
  - `GET /api/rbac/sod-rules` — Lấy danh sách 10 quy tắc chẩn đoán SoD.
  - `POST /api/rbac/diagnostics/run` — Chạy quét chẩn đoán xung đột quyền SoD thời gian thực.
  - `GET /api/rbac/audit` — Lấy sổ kiểm toán bảo mật bất biến.

---

## 7. Tiêu Chuẩn UI/UX & Bằng Chứng Kiểm Định

1. **Rule #19 (Zero window.alert / window.confirm):**
   - 100% các hành động tương tác rủi ro cao hoặc thay đổi quyền truy cập đều sử dụng component `/src/components/common/ConfirmDialog.tsx`.
2. **Rule #20 (Full Replication Protocol):**
   - Đồng bộ hoàn chỉnh kiến trúc thanh điều hướng L1, Action Bar L2, Data Grid L3 và Drawer/Modal L4 tương thích 1:1 với các phân hệ chuẩn mẫu (M41, M17, M03).
3. **Typography & Format Chuẩn Doanh Nghiệp:**
   - Số lượng, mã phân hệ, tỷ lệ %, tiền tệ VNĐ và thời gian đều áp dụng `font-mono tabular-nums font-bold`.
   - Căn lề số liệu về bên phải (`text-right`), trạng thái và nhãn ngắn căn giữa (`text-center`).
4. **Độ Tương Phản WCAG AA (>= 4.5:1):**
   - Màu ngữ nghĩa Semantic (`Emerald`, `Amber`, `Rose`, `Blue`, `Purple`, `Slate`) đáp ứng đầy đủ độ tương phản trên cả 2 giao diện Sáng (Light) và Tối (Dark).

---

## 8. Kết Luận & Đánh Giá Nghiệm Thu

Phân hệ **M04 (SuperAdmin Portal & Fine-Grained RBAC Governance)** đã hoàn tất toàn bộ chu trình nâng cấp tính năng và kiểm định chất lượng:
- **Biên dịch:** `npm run build` / `compile_applet` thành công 100% không lỗi.
- **Toàn vẹn:** Không còn file rác baseline cũ (`M04_FEATURE_BASELINE_BEFORE_SYNC.md` đã được dọn dẹp sạch sẽ).
- **Hồ sơ nghiệm thu:** Tài liệu kiểm toán `/docs/design-specs/M04_UI_UX_REPLICATION_VERIFICATION_REPORT.md` đã được lưu trữ và niêm phong đầy đủ.
- **Trạng thái đóng:** **FROZEN & IMMUTABLE BASELINE — ENTERPRISE CERTIFIED**.
