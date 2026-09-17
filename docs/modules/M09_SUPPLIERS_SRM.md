# M09 — Quản Trị Nhà Cung Cấp, Hồ Sơ Pháp Lý & Điều Khoản SRM
## NEXUSSYNC ERP — MASTER MODULE ARCHITECTURE SPECIFICATION

**Module ID:** `M09`  
**Tên phân hệ:** Quản Trị Nhà Cung Cấp & Quan Hệ SRM (`Suppliers SRM Profiles & Terms`)  
**Khối nghiệp vụ:** `02. Mua Sắm & Cung Ứng (Procurement & SRM)`  
**Workspace ID:** `WS04_PURCHASE` | **Primary Route:** `/suppliers`  
**Mounted UI Component:** `src/modules/purchase/m09-suppliers/components/M09SuppliersSRMWorkspace.tsx`  
**Primary API Endpoint:** `GET /api/suppliers`  
**Trạng thái nghiệm thu:** `CERTIFIED & FROZEN BASELINE`

---

## 1. TỔNG QUAN NGHIỆP VỤ & SỨ MỆNH (EXECUTIVE SUMMARY)

Phân hệ **M09** là hạt nhân quản trị dữ liệu gốc (Master Data) của toàn bộ hệ thống chuỗi cung ứng P2P (Procure-to-Pay) trong NexusSync ERP. Phân hệ chịu trách nhiệm:
1. **Quản trị toàn diện hồ sơ pháp lý & danh mục nhà cung cấp (Vendor Master Data):** Tên pháp nhân, mã số thuế, loại hình đối tác (Hàng hoá, Dịch vụ, Gia công, Vận chuyển), người đại diện pháp luật và nhiều đầu mối liên hệ (Kinh doanh, Kế toán công nợ, Logistics).
2. **Kiểm soát rủi ro tài khoản ngân hàng thụ hưởng (Anti-BEC Fraud & Dual Control):** Quản lý đa tài khoản ngân hàng (Nội địa & Quốc tế kèm SWIFT/IBAN), áp dụng cơ chế duyệt kép (Maker-Checker), thời gian làm nguội (Cooling-off Period 24-48h) và xác minh ngoài kênh (Out-of-band Verification) nhằm triệt tiêu hoàn toàn nguy cơ gian lận chuyển tiền.
3. **Quản trị chính sách tín dụng & điều khoản thanh toán (Credit & Payment Terms):** Định cấu hình kỳ hạn công nợ (Net 15/30/45/60), chiết khấu thanh toán sớm (Early Payment Discount), hạn mức công nợ tối đa (Credit Limit) và chính sách thuế khấu trừ (Withholding Tax).
4. **Chu trình vòng đời Onboarding:** Quản lý quy trình phê duyệt hồ sơ đối tác từ `DRAFT` → `PENDING_REVIEW` → `ACTIVE` → `SUSPENDED` / `ARCHIVED`, tích hợp kho tài liệu điện tử M29 DMS.

---

## 2. RANH GIỚI THẨM QUYỀN ĐƠN NHẤT (DOMAIN AUTHORITY & BOUNDARIES)

Tuân thủ nghiêm ngặt **Rule #03 & Rule #07** (Single Writer Domain Authority):
- **Thẩm quyền Độc quyền (Exclusive Authority):**
  - M09 là **nguồn chân lý duy nhất (Single Source of Truth)** cho bảng dữ liệu `suppliers`, `supplier_contacts`, `supplier_bank_accounts` và các cấu hình `payment_terms`.
  - Mọi module khác (M08 Purchase Orders, M10 Strategic Sourcing, M14 3-Way Matching, M31 AP Invoices, M32 Payments) chỉ được phép **ĐỌC** dữ liệu nhà cung cấp từ M09.
- **Phân tách ranh giới rõ ràng với M11 (SRM Scorecards & Performance):**
  - **M09:** Quản lý **hồ sơ pháp lý, tài khoản ngân hàng, hạn mức tín dụng và điều khoản thương mại**.
  - **M11:** Chuyên trách **đánh giá hiệu suất định kỳ, chấm điểm thẻ điểm (Scorecard KPI: OTIF, Quality, Compliance) và kiểm toán nhà xưởng (Audits)**. M09 chỉ nhúng góc nhìn tổng hợp (view-only widget) và chuyển tiếp qua sự kiện `nexus-navigate`.
- **Phân tách nhiệm vụ (Segregation of Duties - SoD):**
  - Người dùng có quyền thêm/sửa tài khoản ngân hàng và điều khoản thanh toán tại M09 **bị cấm tuyệt đối** việc phê duyệt lệnh chi tiền tại **M32 (Payments & Cash Management)** cho chính nhà cung cấp đó.

---

## 3. CƠ CHẾ BẢO MẬT & KIỂM SOÁT RỦI RO GIAN LẬN (SECURITY & ANTI-FRAUD)

| Cơ chế kiểm soát | Quy chuẩn thực thi | Mục đích & Ràng buộc |
| :--- | :--- | :--- |
| **Duyệt Kép (Dual Control)** | Khi thêm mới hoặc thay đổi STK/Chủ tài khoản/Ngân hàng: Trạng thái ban đầu là `PENDING_VERIFICATION`. Cần tài khoản cấp quản lý khác (Role: `FINANCE_CONTROLLER` / `SUPER_ADMIN`) ký duyệt mới chuyển sang `VERIFIED`. | Ngăn chặn việc nhân viên mua hàng hoặc tin tặc tự ý sửa số tài khoản để trục lợi thanh toán. |
| **Cửa Sổ Làm Nguội (Cooling-off Period)** | Sau khi tài khoản được duyệt sang `VERIFIED`, áp dụng khóa giải ngân tối thiểu 24-48 giờ trước khi hệ thống M32 cho phép chọn tài khoản này để thanh toán. | Đảm bảo đủ thời gian phát hiện nếu có sự cố thay đổi trái phép. |
| **Xác Minh Ngoài Kênh (Out-of-band Verification)** | Yêu cầu ghi nhận bắt buộc: `verifiedBy`, `verifiedAt`, `verificationMethod` (Gọi điện hotline chính thức, gặp trực tiếp đối tác, văn bản công chứng). | Lưu giữ bằng chứng tuân thủ phục vụ kiểm toán nội bộ và kiểm toán độc lập. |
| **Audit Log Bất Biến (Rule #15)** | Toàn bộ lịch sử thay đổi ngân hàng, hạn mức tín dụng, điều khoản thanh toán được ghi trực tiếp sang `M02 Audit & Compliance` qua Central Audit Gateway. | Không cho phép xóa hoặc sửa đổi lịch sử log. |
| **FK Reference Guard** | Cấm xóa cứng (Hard Delete) nhà cung cấp đang có PO mở (M08) hoặc chứng từ công nợ AP chưa tất toán (M31/M32). Chỉ cho phép chuyển sang `SUSPENDED` hoặc `ARCHIVED`. | Bảo vệ toàn vẹn đồ thị dữ liệu liên module. |

---

## 4. BẢN ĐỒ DỮ LIỆU & DATA CONTRACTS

### 4.1. Bảng Dữ Liệu Lõi (Core Tables)
- **`suppliers`**:
  - `id` (PK, UUID/String)
  - `code` (String, unique, ví dụ: `SUP-001`)
  - `name` (String, Tên pháp nhân đầy đủ)
  - `taxCode` (String, Mã số thuế)
  - `supplierType` (`GOODS` | `SERVICES` | `SUBCONTRACTOR` | `LOGISTICS`)
  - `status` (`DRAFT` | `PENDING_REVIEW` | `ACTIVE` | `SUSPENDED` | `ARCHIVED`)
  - `creditLimit` (Decimal/Number, Hạn mức công nợ)
  - `currency` (String, Mặc định `VND`, hỗ trợ ngoại tệ M03 `USD`, `EUR`, `JPY`)
  - `paymentTerms` (String, ví dụ: `Net 30 Days`, `Net 45 Days`, `COD / Advance 50%`)
  - `earlyPaymentDiscountRate` (Decimal, ví dụ: `2.0%` trong 10 ngày)
  - `withholdingTaxRate` (Decimal, Tỷ lệ thuế khấu trừ áp dụng)
  - `performanceTier` (`Tier A` | `Tier B` | `Tier C`)
  - `rating` (Number, 1.0 - 5.0)
  - `otifRate`, `qualityScore`, `complianceScore` (Number, Đồng bộ từ M11)
  - `created_at`, `updated_at`, `created_by`, `updated_by`

- **`supplier_contacts`**:
  - `id` (PK, Number/UUID)
  - `supplier_id` (FK -> `suppliers.id`)
  - `contact_name`, `department` (`SALES`, `ACCOUNTING`, `LOGISTICS`, `MANAGEMENT`), `position`, `phone`, `email`, `is_primary`

- **`supplier_bank_accounts`**:
  - `id` (PK, Number/UUID)
  - `supplier_id` (FK -> `suppliers.id`)
  - `bank_name`, `account_number`, `account_holder`, `branch`, `swift_code`, `currency`
  - `is_default` (Boolean)
  - `verification_status` (`PENDING_VERIFICATION` | `VERIFIED` | `REJECTED`)
  - `cooling_off_until` (Timestamp)
  - `verified_by`, `verified_at`, `verification_method`

---

## 5. DANH MỤC API & SERVICE ENDPOINTS

| Method | Endpoint | Quyền hạn (RBAC) | Mô tả & Ràng buộc nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/suppliers` | `purchase:read` | Lấy danh sách NCC với bộ lọc trạng thái, phân trang và tìm kiếm. |
| `GET` | `/api/suppliers/:id` | `purchase:read` | Lấy hồ sơ chi tiết 360° gồm thông tin chung, contacts, bank accounts, lịch sử PO. |
| `POST` | `/api/suppliers` | `purchase:write` | Đăng ký NCC mới. Bắt buộc có `Idempotency-Key` để chống gửi lặp. |
| `PUT` | `/api/suppliers/:id` | `purchase:write` | Cập nhật thông tin hành chính, MST, địa chỉ, người đại diện. |
| `DELETE` | `/api/suppliers/:id` | `purchase:admin` | Chuyển trạng thái sang `ARCHIVED` (áp dụng FK Reference Guard). |
| `POST` | `/api/suppliers/:id/contacts` | `purchase:write` | Thêm đầu mối liên hệ mới (Kinh doanh, Kế toán, Vận tải). |
| `DELETE`| `/api/suppliers/:id/contacts/:contactId` | `purchase:write` | Xóa người liên hệ. |
| `POST` | `/api/suppliers/:id/bank-accounts` | `supplier.bank.manage` | Thêm tài khoản ngân hàng thụ hưởng (Khởi tạo `PENDING_VERIFICATION`). |
| `PATCH`| `/api/suppliers/:id/bank-accounts/:bankId/approve` | `supplier.bank.approve` | Quản lý duyệt kép tài khoản ngân hàng và kích hoạt Cooling-off Period. |
| `DELETE`| `/api/suppliers/:id/bank-accounts/:bankId` | `supplier.bank.manage` | Xóa tài khoản ngân hàng. |
| `PATCH`| `/api/suppliers/:id/terms` | `purchase:write` | Cập nhật điều khoản thanh toán, hạn mức tín dụng (áp dụng giao dịch mới, không hồi tố). |
| `GET` | `/api/suppliers/analytics/spend` | `purchase:read` | Lấy báo cáo phân tích chi tiêu theo nhà cung cấp và ngành hàng. |

---

## 6. QUY CHUẨN UI/UX DOANH NGHIỆP (RULE #19 & RULE #20)

1. **Cấu trúc phân tầng L0 – L4:**
   - **L0 Header:** Thẻ compact bo tròn `rounded-2xl`, icon `Truck` trong hộp nền `bg-blue-600`, badge nhận diện `M09 • SUPPLIERS SRM`, nút Làm mới dữ liệu và Xuất báo cáo CSV.
   - **L0 Lifecycle Pipeline:** Thanh tiến trình 4 giai đoạn chuẩn SRM: `1. Thẩm Định Hồ Sơ` → `2. Hợp Đồng & Khung Giá` → `3. Giao Hàng & OTIF` → `4. Thẻ Điểm & Xếp Hạng`.
   - **L1 Navigation Sub-tabs:** 4 Tab nghiệp vụ: `Danh sách Nhà cung cấp`, `Điều khoản Thanh toán`, `Đánh giá & Xếp hạng`, `Phân tích Chuỗi Cung ứng`.
   - **L2 Metric Cards Strip:** 4 Thẻ KPI với số liệu lớn định dạng `font-mono tabular-nums font-bold text-2xl` (Tổng NCC, Đối tác chiến lược Tier A, Đang theo dõi / Cảnh báo, Chỉ số OTIF Trung bình).
   - **L3 Data Tables:** Header bảng `bg-slate-50 dark:bg-slate-800/80`, chỉ báo viền trái `border-l-4` động theo trạng thái, hiệu ứng hover sắc nét `hover:bg-slate-100/80 dark:hover:bg-slate-700/60`.
   - **L4 Detail Modal:** Modal Hồ Sơ Đối Tác 360° với 4 tab phụ (`Thông tin chung`, `Liên hệ & Ngân hàng`, `Đơn mua hàng PO`, `Thẻ điểm hiệu suất`).
2. **Quy chuẩn Định dạng Tiền tệ & Số học:**
   - Số tiền, hạn mức, chi tiêu: Áp dụng dấu chấm `.` phân cách hàng nghìn và dấu phẩy `,` phân cách hàng thập phân (ví dụ: `2.000.000.000 ₫`, `1.250.000,50 ₫`).
   - Căn lề số học chuẩn: Cột số tiền, điểm số căn phải (`text-right`), mã chứng từ / MST căn trái (`text-left`) hoặc giữa (`text-center`).
3. **Tiêu chuẩn Hộp thoại Xác nhận (Rule #19):**
   - Nghiêm cấm `window.alert`, `window.confirm`.
   - Sử dụng `ConfirmDialog.tsx` cho toàn bộ thao tác lưu trữ NCC, xóa tài khoản ngân hàng và duyệt điều khoản công nợ.

---

## 7. KẾT QUẢ NGHIỆM THU & BẢO VỆ PHẠM VI (ACCEPTANCE SEAL)

- **Verification Gate:** 100% Passed.
- **Build Status:** Build Succeeded (`npm run build`).
- **Baseline Status:** `@frozen` — Mọi thay đổi cấu trúc dữ liệu hoặc API phải thông qua Architecture Governance Gate.

