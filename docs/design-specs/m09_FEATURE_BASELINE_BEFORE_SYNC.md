# M09 SUPPLIERS & SRM WORKSPACE — POST-UPGRADE ARCHITECTURE BASELINE
## NEXUSSYNC ERP — RULE #20 GOVERNANCE RECORD & FEATURE SPECIFICATION

**Module Code:** M09  
**Module Name:** Quản Trị Nhà Cung Cấp, Hồ Sơ Pháp Lý & Điều Khoản SRM (`Suppliers SRM Suite`)  
**Active Source File:** `/src/modules/purchase/m09-suppliers/components/M09SuppliersSRMWorkspace.tsx`  
**Sub-Components:** `/src/components/srm/Supplier360Modal.tsx`, `/src/components/srm/SupplierTermsTab.tsx`, `/src/components/srm/SupplierSpendAnalyticsTab.tsx`  
**Baseline Date:** 2026-09-15  
**Target Design Reference:** M19 UI/UX Design Protocol (`UI_UX_ENTERPRISE_DESIGN_STANDARDS_M18_M19.md` & `M19_FULL_UI_DESIGN_SPEC.md`)  
**Security Governance:** Anti-BEC Fraud Dual Control, Cooling-off Period 24-48h, Segregation of Duties (SoD vs M32)  

---

### 1. M09 CORE CAPABILITIES & DATA GRAPH INVENTORY

#### 1.1. State & Data Models
- `suppliers`: Danh sách nhà cung cấp được tải từ `/api/suppliers`.
  - Thuộc tính: `id`, `code`, `name`, `taxCode`, `supplierType`, `paymentTerms`, `creditLimit`, `currency`, `earlyPaymentDiscountRate`, `withholdingTaxRate`, `performanceTier`, `rating`, `otifRate`, `qualityScore`, `complianceScore`, `status`, `scorecards`.
- `activeTab`: Quản lý phiên tab bằng `useWorkspaceSessionTab<'suppliers' | 'terms' | 'evaluation' | 'analytics'>('M09', 'suppliers')`.
- `selectedEvaluationSupplierId`: ID của nhà cung cấp được chọn để xem Thẻ điểm Scorecard chi tiết trong Tab 3.
- `evaluationLoading`, `evaluationLoaded`: Cơ chế Lazy Loading theo nhu cầu (Progressive On-Demand) khi người dùng mở Tab Đánh giá.
- `canManageM11`: Quyền RBAC tab-level (`currentUser?.role === 'SUPER_ADMIN' || 'ADMIN' || 'srm.scorecard.manage' || allowedModules.includes('M11')`).
- `selectedSupplierForModal`: Đối tượng NCC được chọn để xem Hồ Sơ Đối Tác 360° trong Modal chi tiết.
- Form phát hành NCC: `newSuppName`, `newSuppTax`, `newSuppTerm`, `newSuppLimit`, `isSubmitting`.
- `confirmConfig`: Trạng thái hiển thị modal xác nhận Rule #19 khi lưu trữ (Archive) nhà cung cấp và xóa tài khoản ngân hàng.

#### 1.2. API Endpoints & Data Operations
| Phương thức | Endpoint | Chức năng | Headers & Guards |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/suppliers` | Tải danh sách nhà cung cấp kèm chỉ số hiệu suất | `Authorization: Bearer <token>` |
| `GET` | `/api/suppliers/:id` | Tải chi tiết hồ sơ 360°, contacts, bank accounts | `Authorization: Bearer <token>` |
| `POST` | `/api/suppliers` | Đăng ký hồ sơ NCC mới vào Single Source of Truth | `Authorization`, `Idempotency-Key: crypto.randomUUID()` |
| `PUT` | `/api/suppliers/:id` | Cập nhật hồ sơ pháp lý NCC | `Authorization: Bearer <token>` |
| `DELETE` | `/api/suppliers/:id` | Chuyển trạng thái NCC sang `ARCHIVED` (FK Guard) | `Authorization: Bearer <token>` |
| `POST` | `/api/suppliers/:id/contacts` | Thêm người liên hệ (Kinh doanh, Kế toán, Logistics) | `Authorization: Bearer <token>` |
| `DELETE` | `/api/suppliers/:id/contacts/:contactId` | Xóa người liên hệ | `Authorization: Bearer <token>` |
| `POST` | `/api/suppliers/:id/bank-accounts` | Thêm tài khoản ngân hàng (Dual Control Maker) | `Authorization`, `supplier.bank.manage` |
| `PATCH` | `/api/suppliers/:id/bank-accounts/:bankId/approve` | Ký duyệt kép tài khoản ngân hàng (Checker) & kích hoạt Cooling-off | `Authorization`, `supplier.bank.approve` |
| `DELETE` | `/api/suppliers/:id/bank-accounts/:bankId` | Xóa tài khoản ngân hàng | `Authorization: Bearer <token>` |
| `PATCH` | `/api/suppliers/:id/terms` | Cập nhật Payment Terms, Credit Limits, Early Discount | `Authorization: Bearer <token>` |
| `GET` | `/api/suppliers/analytics/spend` | Báo cáo chi tiêu theo nhà cung cấp & ngành hàng | `Authorization: Bearer <token>` |

#### 1.3. UI Components & Subsystems
1. **L0 Header Banner:**
   - Định danh phân hệ `M09 • SUPPLIERS SRM`.
   - Nút điều hướng sâu sang M11: `window.dispatchEvent(new CustomEvent('nexus-navigate', { detail: { route: '/srm-scorecard', moduleId: 'M11' } }))`.
   - Nút Làm mới dữ liệu (`fetchSuppliers`).
   - Nút Xuất Báo cáo CSV (`handleExportCSV`).
2. **L0 Lifecycle Pipeline Banner:**
   - 4 bước tiến trình SRM: `1. Thẩm Định Hồ Sơ` -> `2. Hợp Đồng & Khung Giá` -> `3. Giao Hàng & OTIF` -> `4. Thẻ Điểm & Xếp Hạng`.
3. **Tab 1: Danh sách Nhà cung cấp (`suppliers`):**
   - Bảng danh mục đối tác: Mã NCC, Tên NCC, Điều khoản, Hạn mức tín dụng (`font-mono tabular-nums text-right`), Xếp hạng, Thao tác (Lưu trữ, Hồ Sơ Đối Tác 360°).
   - Form Đăng ký Nhà cung cấp mới (Tên, Mã số thuế, Điều khoản, Hạn mức).
4. **Tab 2: Điều khoản Thanh toán (`terms`):**
   - Ma trận chính sách thanh toán (Net 45 Days, Net 30 Days, COD / Advance 50%).
5. **Tab 3: Đánh giá & Xếp hạng (`evaluation`):**
   - Skeleton Loader khi lazy-load.
   - Banner cảnh báo RBAC Read-Only khi người dùng không có quyền quản trị M11.
   - `DeepLinkBanner` liên kết sang M11 Scorecards & Audits.
   - Bộ chọn nhà cung cấp dạng Pills để xem thẻ điểm.
   - Nhúng component `ScorecardTabPanel`.
   - Bảng tổng hợp so sánh hiệu suất NCC toàn hệ thống (SRM Matrix: OTIF, Quality, Compliance, Rating, Status).
6. **Tab 4: Phân tích Chuỗi Cung ứng (`analytics`):**
   - Các khối thống kê: Tổng NCC, Đối tác chiến lược, Đang theo dõi, Chỉ số OTIF trung bình.
7. **Modals & Overlays:**
   - Modal Hồ Sơ Đối Tác 360° (`Supplier360Modal.tsx`).
   - `ConfirmDialog` xác nhận lưu trữ (Archive) đối tác và xóa ngân hàng.
   - Kết nối `onSelectEntity` đồng bộ sang Thanh Ngữ cảnh Đối Tượng (Context Rail).

---

### 2. KẾT LUẬN & TRẠNG THÁI BASELINE

- Phân hệ **M09** đã được nâng cấp toàn diện và đồng bộ thiết kế 100% theo tiêu chuẩn Enterprise ERP.
- Trạng thái hiện tại: **FROZEN & IMMUTABLE BASELINE**.

