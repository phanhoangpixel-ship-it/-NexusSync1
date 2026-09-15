# M09 SUPPLIERS & SRM WORKSPACE — FEATURE BASELINE BEFORE UI SYNC
## NEXUSSYNC ERP — RULE #20 PHASE -1 AUDIT & GOVERNANCE RECORD

**Module Code:** M09  
**Module Name:** Quản Trị Nhà Cung Cấp & Quan Hệ SRM (`Suppliers SRM Suite`)  
**Source File:** `/src/components/workspaces/M09SuppliersSRMWorkspace.tsx`  
**Baseline Date:** 2026-09-10  
**Target Design Reference:** M19 UI/UX Design Protocol (`UI_UX_ENTERPRISE_DESIGN_STANDARDS_M18_M19.md` & `M19_FULL_UI_DESIGN_SPEC.md`)

---

### 1. M09 CORE CAPABILITIES & DATA GRAPH INVENTORY

#### 1.1. State & Data Models
- `suppliers`: Danh sách nhà cung cấp được tải từ `/api/suppliers`.
  - Thuộc tính: `id`, `code`, `name`, `taxCode`, `paymentTerms`, `creditLimit`, `currency`, `performanceTier`, `rating`, `otifRate`, `qualityScore`, `complianceScore`, `status`, `scorecards`.
- `activeTab`: Quản lý phiên tab bằng `useWorkspaceSessionTab<'suppliers' | 'terms' | 'evaluation' | 'analytics'>('M09', 'suppliers')`.
- `selectedEvaluationSupplierId`: ID của nhà cung cấp được chọn để xem Thẻ điểm Scorecard chi tiết trong Tab 3.
- `evaluationLoading`, `evaluationLoaded`: Cơ chế Lazy Loading theo nhu cầu (Progressive On-Demand) khi người dùng mở Tab Đánh giá.
- `canManageM11`: Quyền RBAC tab-level (`currentUser?.role === 'SUPER_ADMIN' || 'ADMIN' || 'srm.scorecard.manage' || allowedModules.includes('M11')`).
- `selectedSupplierForModal`: Đối tượng NCC được chọn để xem Hồ Sơ Đối Tác 360° trong Modal chi tiết.
- Form phát hành NCC: `newSuppName`, `newSuppTax`, `newSuppTerm`, `newSuppLimit`, `isSubmitting`.
- `confirmDialog`: Trạng thái hiển thị modal xác nhận Rule #19 khi lưu trữ (Archive) nhà cung cấp.

#### 1.2. API Endpoints & Data Operations
| Phương thức | Endpoint | Chức năng | Headers & Guards |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/suppliers` | Tải danh sách nhà cung cấp kèm chỉ số hiệu suất | `Authorization: Bearer <token>` |
| `POST` | `/api/suppliers` | Đăng ký hồ sơ NCC mới vào Single Source of Truth | `Authorization`, `Idempotency-Key: crypto.randomUUID()` |
| `DELETE` | `/api/suppliers/:id` | Chuyển trạng thái NCC sang `ARCHIVED` | `Authorization: Bearer <token>` |

#### 1.3. UI Components & Subsystems
1. **Header Banner:**
   - Định danh phân hệ M09 • SUPPLIERS SRM.
   - Nút điều hướng sâu sang M11: `window.dispatchEvent(new CustomEvent('nexus-navigate', { detail: { route: '/srm-scorecard', moduleId: 'M11' } }))`.
   - Nút Làm mới dữ liệu (`fetchSuppliers`).
   - Nút Xuất Báo cáo CSV (`handleExportCSV`).
2. **Tab 1: Danh sách Nhà cung cấp (`suppliers`):**
   - Bảng danh mục đối tác: Mã NCC, Tên NCC, Điều khoản, Hạn mức tín dụng, Xếp hạng, Thao tác (Lưu trữ, Hồ Sơ Đối Tác 360°).
   - Form Đăng ký Nhà cung cấp mới (Tên, Mã số thuế, Điều khoản, Hạn mức).
3. **Tab 2: Điều khoản Thanh toán (`terms`):**
   - Ma trận chính sách thanh toán (Net 45 Days, Net 30 Days, COD / Advance 50%).
4. **Tab 3: Đánh giá & Xếp hạng (`evaluation`):**
   - Skeleton Loader khi lazy-load.
   - Banner cảnh báo RBAC Read-Only khi người dùng không có quyền quản trị M11.
   - `DeepLinkBanner` liên kết sang M11 Scorecards & Audits.
   - Bộ chọn nhà cung cấp dạng Pills để xem thẻ điểm.
   - Nhúng component `ScorecardTabPanel`.
   - Bảng tổng hợp so sánh hiệu suất NCC toàn hệ thống (SRM Matrix: OTIF, Quality, Compliance, Rating, Status).
5. **Tab 4: Phân tích Chuỗi Cung ứng (`analytics`):**
   - Các khối thống kê: Tổng NCC, Đối tác chiến lược, Đang theo dõi, Chỉ số OTIF trung bình.
6. **Modals & Overlays:**
   - Modal chi tiết nhà cung cấp (Hồ Sơ Đối Tác 360°).
   - `ConfirmDialog` xác nhận lưu trữ (Archive) đối tác.
   - Kết nối `onSelectEntity` đồng bộ sang Thanh Ngữ cảnh Đối Tượng (Context Rail).

---

### 2. PHẠM VI THAY ĐỔI & BẢO TOÀN (PRESENTATION-LAYER ONLY)

- **ĐƯỢC PHÉP THAY ĐỔI (Presentation Layer):**
  - Đồng bộ cấu trúc L0 Header Banner theo chuẩn thẻ compact M19.
  - Thêm L0 Lifecycle Pipeline Banner (4 bước SRM: Onboarding -> BPA & Terms -> GR & OTIF -> Scorecard & Audits).
  - Tinh chỉnh L1 Navigation Sub-tabs Strip bo góc `rounded-xl` với pill buttons chuẩn M19.
  - Nâng cấp L2 KPI Metric Strip hiển thị rõ nét với `font-mono tabular-nums font-bold text-2xl`.
  - Tái cấu trúc L3 Data Tables với `thead` chuẩn `bg-slate-50 dark:bg-slate-800/80`, hàng tương tác `hover:bg-slate-100/80 dark:hover:bg-slate-700/60` và `border-l-4` động theo trạng thái.
  - Tích hợp thanh tìm kiếm và bộ lọc trạng thái kèm phân trang `PaginationControl`.
  - Chuẩn hóa độ tương phản WCAG AA cho mọi badge trạng thái và văn bản.
  - Hỗ trợ đầy đủ Dark Mode cho mọi thẻ, bảng, form và modal.

- **TUYỆT ĐỐI CẤM THAY ĐỔI (Business Logic & Backend Guard):**
  - Không thay đổi các API calls (`/api/suppliers`, `POST /api/suppliers` với `Idempotency-Key`, `DELETE /api/suppliers/:id`).
  - Không thay đổi luồng RBAC `canManageM11`.
  - Không làm gián đoạn cơ chế Lazy Loading của Tab Đánh giá (`evaluationLoading`, `evaluationLoaded`).
  - Không thay đổi component `ScorecardTabPanel` và `DeepLinkBanner`.
  - Không làm mất sự kiện `nexus-navigate` mở M11.
  - Không làm mất kết nối `onSelectEntity` và `onNotify`.
