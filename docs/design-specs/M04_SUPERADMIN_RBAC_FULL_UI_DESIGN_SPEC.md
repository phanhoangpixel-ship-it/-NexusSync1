# NEXUSSYNC ERP — M04 SUPERADMIN RBAC PORTAL FULL UI/UX DESIGN SPEC
**Tài liệu Đặc tả Thiết kế Chi tiết Toàn diện Phân Hệ M04 — Tuân thủ Rule #19 & Rule #20**

- **Module Code:** `M04`
- **Module Name:** SuperAdmin RBAC Portal (Cổng Quản trị Tối cao SuperAdmin & Phân quyền RBAC)
- **Domain:** `CORE / IAM`
- **Group:** `06. Quản Trị & Hệ Thống (Governance & System)`
- **Workspace ID:** `WS01_HUB`
- **Governing Standards:**
  - `UI_UX_ENTERPRISE_DESIGN_STANDARDS_M18_M19.md` (WCAG AA Contrast, Status Badges, Monospace for numbers/codes, Table Hover, ConfirmDialog)
  - `UI_UX_MODULE_FULL_REPLICATION_PROTOCOL.md` (Phase 0 đến Phase 3)
  - `GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md` (Rule #01 Architecture First, Rule #02 Reuse Before Create, Rule #19 Confirm Dialog, Rule #20 Replication Protocol)

---

## PHASE 0 — KIỂM KÊ CÁC SUB-TABS TRONG PHÂN HỆ M04

Phân hệ M04 bao gồm 4 Sub-Tabs nghiệp vụ quản trị bảo mật và phân quyền hạt nhân tối cao:
1. **Tab 1: `roles` — Quản Trị Vai Trò & Ma Trận Phân Quyền (System Roles & Privilege Matrix)**
   - *Loại màn hình:* Quản lý vai trò (SuperAdmin, CFO, Warehouse Manager, Production Head, QA Specialist, Auditor, Operator); Thẻ thống kê vai trò; Ma trận gán quyền trực quan (Xem V, Tạo/Sửa E, Duyệt A, Xóa D); Form tạo mới / nhân bản vai trò; Hành động Xóa / Thu hồi vai trò bảo vệ nghiêm ngặt qua `ConfirmDialog.tsx`.
2. **Tab 2: `permissions` — Danh Mục Đặc Quyền & Bản Đồ Phân Hệ (Atomic Permissions & Domain Module Map)**
   - *Loại màn hình:* Danh mục đặc quyền hạt nhân bao quát toàn bộ 42 phân hệ ERP; Bộ lọc đa chiều theo Domain (CORE, FINANCE, SUPPLY_CHAIN, PRODUCTION, GOVERNANCE); Mức độ rủi ro an ninh (TIER-1 CRITICAL, TIER-2 HIGH, TIER-3 STANDARD); Tìm kiếm tức thì và soi chiếu API Endpoint tương ứng.
3. **Tab 3: `users` — Phân Bổ Người Dùng & Multi-Tenant (User-Role Mappings & Multi-Tenant Scopes)**
   - *Loại màn hình:* Danh sách tài khoản quản trị và người dùng; Ánh xạ vai trò chính và vai trò phụ; Giới hạn phạm vi chi nhánh (Branch Scoping: Toàn quốc HQ, Miền Bắc, Miền Nam, Miền Trung); Trạng thái tài khoản (ACTIVE, LOCKED, SUSPENDED); Thao tác Đổi vai trò / Khóa tài khoản / Đặt lại mật khẩu bảo vệ qua `ConfirmDialog.tsx`.
4. **Tab 4: `diagnostics` — Chẩn Đoán Phân Tách Nhiệm Vụ SoD & An Ninh IAM (Separation of Duties & Security Diagnostics)**
   - *Loại màn hình:* Bộ kiểm tra SoD (Phân tách chức năng Maker-Checker, ngăn chặn kiêm nhiệm Lập phiếu & Phê duyệt, Đặt hàng & Nhận hàng, Điều chỉnh kho & Kiểm kê); Kiểm tra leo thang đặc quyền (Privilege Escalation Detector); Tính toàn vẹn chữ ký token JWT/HMAC; Thao tác Quét lại an ninh và Xuất báo cáo kiểm toán bảo mật bảo vệ qua `ConfirmDialog.tsx`.

---

## PHASE 1 — TRÍCH XUẤT ĐẶC TẢ THIẾT KẾ CHI TIẾT (LẶP CHO CÁC TAB)

### TAB 1: QUẢN TRỊ VAI TRÒ & MA TRẬN PHÂN QUYỀN (`roles`)

#### 1.1 Cấu trúc bố cục (Layout Architecture L0–L4)
- **L0 Banner Cố định:** Header nhận diện `M04 • SUPERADMIN RBAC PORTAL`, huy hiệu `IAM Tier-1 Sovereign`, `Zero-Trust Active`, huy hiệu `Rule #19 Confirmed`, cụm nút tác vụ: `In / Xuất PDF`, `Chẩn Đoán SoD Tức Thì`, `Xuất Ma Trận Quyền CSV`, và `Thêm Vai Trò Mới`.
- **L1 Navigation Strip:** Thanh điều hướng 4 Tab bo góc `rounded-xl`, đồng bộ trạng thái phiên qua `useWorkspaceSessionTab<SuperAdminSubTab>('M04', 'roles')`.
- **L2 KPI Strip & Filter Bar:** 
  - 4 thẻ KPI tóm tắt: Tổng số vai trò (7), Đặc quyền hạt nhân (48), Tài khoản phân bổ (16), Tỷ lệ tuân thủ SoD (100%).
  - Thanh tìm kiếm Omnibar + Bộ lọc cấp bậc bảo mật (Tối cao, Quản lý, Vận hành) + Đếm số lượng kết quả.
- **L3 Data Grid Tables & Role Cards:**
  - Bảng danh sách vai trò với `border-l-4` phân định cấp bậc:
    - SuperAdmin: `border-l-4 border-purple-600 bg-purple-50/15`
    - C-Level / Quản lý: `border-l-4 border-blue-600 bg-blue-50/10`
    - Vận hành / Chuyên viên: `border-l-4 border-emerald-500/60 bg-emerald-50/10`
  - Bảng Ma trận Quyền hạn phân hệ (CRUD & Duyệt).
  - Hover dòng: `hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150`.
- **L4 Detail Modal (`SuperAdminDetailModal.tsx`):**
  - Modal soi chiếu chi tiết vai trò khi bấm "Xem Chi Tiết": metadata, phả hệ kế thừa quyền, danh sách người dùng nắm giữ, lịch sử thay đổi phân quyền với Checksum SHA-256.

#### 1.2 Typography & Định dạng Chữ
- Tiêu đề Banner L0: `text-base sm:text-lg font-bold text-white tracking-tight`
- Nhãn phân hệ: `px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-mono font-bold rounded-md`
- Mã Vai trò / Role Key: `font-mono font-bold text-purple-700 dark:text-purple-300` (vd: `SUPER_ADMIN`, `CFO_DIRECTOR`, `WH_MANAGER`)
- Mã Phân hệ & Quyền: `font-mono text-xs font-bold text-slate-900 dark:text-slate-100` (vd: `M03_CONFIG_WRITE`, `M21_PAYMENT_APPROVE`)
- Số lượng tài khoản / Đặc quyền: `font-mono font-bold tabular-nums`

#### 1.3 Hệ thống Màu sắc Trạng thái (Status Color Tokens - WCAG AA)
- **SUPER_ADMIN / Quyền Tối Cao (PURPLE ACCENT):**
  - Badge: `bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200 dark:border-purple-700 font-bold`
  - Viền bảng: `border-l-4 border-purple-600 bg-purple-50/15`
- **Hoạt động / Active / Đạt chuẩn SoD (SUCCESS):**
  - Badge: `bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold`
  - Viền bảng: `border-l-4 border-emerald-500/60 bg-emerald-50/10`
- **Cảnh báo / Cần xem xét / Nhạy cảm (WARNING):**
  - Badge: `bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold`
  - Viền bảng: `border-l-4 border-amber-500 bg-amber-50/15`
- **Khóa / Nguy cơ SoD / Xóa vai trò (DANGER):**
  - Badge: `bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold`
  - Viền bảng: `border-l-4 border-rose-500 bg-rose-50/20`

#### 1.4 Component & Interaction Chi Tiết (Rule #19 Bắt buộc)
- **ConfirmDialog.tsx:** Thay thế 100% `window.alert` và `window.confirm`:
  - Tạo mới vai trò: `variant: 'primary'`, xác nhận tên vai trò và mô tả quyền.
  - Xóa / Thu hồi vai trò: `variant: 'danger'`, yêu cầu xác nhận không có tài khoản nào bị cô lập quyền.
  - Cập nhật ma trận quyền: `variant: 'warning'`, cảnh báo thay đổi ảnh hưởng trực tiếp đến phiên đăng nhập hiện tại.
  - Xuất báo cáo vai trò CSV: `variant: 'primary'`.
- **Entity Context Hooking:**
  - Khi click vào bất kỳ vai trò nào: kích hoạt `onSelectEntity` với `type: 'ROLE'`, mã code, phả hệ kế thừa và audit trail SHA-256.

---

### TAB 2: DANH MỤC ĐẶC QUYỀN HẠT NHÂN (`permissions`)
- L2 Filter Bar: Lọc theo 6 Miền nghiệp vụ (Core, Finance, Supply Chain, Production, Sales, Governance) và mức độ rủi ro (Critical / High / Standard).
- L3 Data Grid: Bảng danh mục đặc quyền đầy đủ cột: Mã quyền (Code Pill Monospace), Tên quyền, Phân hệ chủ quản (Module Badge), API Gateway Endpoint, Cấp độ rủi ro (Risk Badge), Số vai trò đã gán.
- Modal chi tiết L4: Xem danh sách các API Route được bảo vệ bởi quyền này và log truy cập gần nhất.

---

### TAB 3: PHÂN BỔ NGƯỜI DÙNG & MULTI-TENANT (`users`)
- L2 Filter Bar: Lọc theo vai trò, chi nhánh (Branch Scope), trạng thái tài khoản.
- L3 Data Grid: Bảng phân bổ người dùng với viền `border-l-4`, hiển thị Avatar chữ cái, Username, Email, Vai trò chính, Phạm vi chi nhánh (HN, HCM, DN, CT, Toàn quốc), Trạng thái (ACTIVE / LOCKED).
- Tương tác Rule #19 qua `ConfirmDialog.tsx`:
  - Đổi vai trò người dùng: `variant: 'warning'`, thông báo quyền hạn mới sẽ có hiệu lực ngay lập tức.
  - Khóa tài khoản: `variant: 'danger'`, ngắt kết nối phiên làm việc của người dùng.
  - Mở khóa tài khoản: `variant: 'primary'`.

---

### TAB 4: CHẨN ĐOÁN SOD & AN NINH IAM (`diagnostics`)
- L2 KPI: Tỷ lệ phân tách nhiệm vụ (100% Passed), 0 xung đột phát hiện, 100% Token JWT hợp lệ.
- L3 Data Grid: Bảng các bài kiểm tra SoD kinh điển trong ERP:
  1. *Maker-Checker Tài chính:* Không người dùng nào vừa lập phiếu chi vừa duyệt thanh toán (M21/M22).
  2. *Kiểm soát Mua hàng:* Không người dùng nào vừa tạo PO vừa xác nhận nhận kho (M08/M12).
  3. *Kiểm kê & Điều chỉnh:* Không người dùng nào vừa kiểm đếm vừa tự duyệt điều chỉnh kho (M19/M20).
  4. *Kế toán & Tiền mặt:* Thủ quỹ không giữ quyền sửa sổ cái tổng hợp GL (M23).
  5. *Bảo vệ Token:* Mã hóa chữ ký HMAC-SHA256 chống mạo danh token phiên.
- Thao tác "Chạy lại quét an ninh" và "Khắc phục vi phạm SoD" bảo vệ qua `ConfirmDialog.tsx`.
