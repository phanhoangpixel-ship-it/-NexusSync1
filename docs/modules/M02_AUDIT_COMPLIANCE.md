# M02 — Audit Compliance & SHA-256 Forensic Ledger

**Module ID:** `M02`  
**Module Name:** Security Audit Compliance, Cryptographic Hash Chain & Forensic Traceability  
**Business Group:** `8. Hệ thống & Giám sát` / `06. GOVERNANCE & SYSTEM`  
**Workspace ID:** `WS28_DMS` | **Primary Route:** `/audit`  
**Mounted UI Component:** `/src/modules/governance/m02-audit/components/AuditComplianceWorkspace.tsx`  
**Domain Service & Authority:** `/src/services/auditService.ts` (`AuditService`)  
**Primary API Router:** `/src/routes/audit.routes.ts` & `/server.ts`  
**Standards Compliance:** Rule #01 (Architecture First), Rule #02 (Reuse Before Create), Rule #03 & #07 (Write Authority: AuditService Single-Writer), Rule #16 (Frozen Scope Protection), Rule #19 (ConfirmDialog & WCAG AA), Rule #20 (Full Replication Protocol)  
**Acceptance Status:** 🟢 **FROZEN & IMMUTABLE BASELINE — ENTERPRISE CERTIFIED (100%)**

---

## 1. Executive Summary & Core Mission

**Phân hệ M02 — Audit Compliance & Cryptographic Hash Chain Ledger** là trung tâm giám sát an ninh, truy vết pháp lý và bảo toàn tính toàn vẹn dữ liệu cho toàn bộ hệ sinh thái NexusSync ERP. Phân hệ nắm giữ quyền hạn độc quyền và bất biến:
- Ghi nhận mọi sự kiện biến động trạng thái (State Mutation), giao dịch tài chính - kho vận, điều chỉnh hệ thống và thao tác nhạy cảm từ tất cả 42 phân hệ ERP (`M01`–`M42`).
- Đảm bảo tính bất biến (Append-Only Immutability) thông qua công nghệ chuỗi khối mật mã băm SHA-256 liên tục (`prevHash` + `blockData` = `currentHash`).
- Kiểm định toàn vẹn sâu (Deep Cryptographic Verification) để phát hiện tức thì bất kỳ hành vi sửa đổi lén dữ liệu (Tamper Detection) thông qua cơ sở dữ liệu ngầm hoặc SQL ngoài luồng.
- Phân tích và quản lý các sự cố bảo mật, truy cập trái phép (`PERMISSION_DENIED`), cảnh báo gian lận và xung đột quyền hạn (SoD Compliance theo ISO 27001 & SOX 404).

---

## 2. Thẩm Quyền Đơn Nhất (Single-Writer Domain Authority: Rule #03 & Rule #07)

**Nguyên tắc cốt lõi:** `AuditService` là Single-Writer độc quyền duy nhất cho mọi bản ghi kiểm toán trong hệ thống.
1. **Tuyệt đối cấm ghi trực tiếp:** Không có bất kỳ phân hệ nào được phép thực hiện câu lệnh `db.insert(schema.auditLogs)` trực tiếp từ route, controller hay engine.
2. **Cổng ghi chuẩn hóa:**
   - `AuditService.captureAsync(options)`: Xử lý ghi nhật ký bất đồng bộ không chặn luồng (Fire-and-forget) cho các nghiệp vụ vận hành, giao dịch bán hàng, kho vận, mua hàng.
   - `AuditService.recordAuditLog(options)`: Xử lý ghi đồng bộ có bảo chứng chữ ký cho các thao tác tối quan trọng của SuperAdmin, cấu hình hệ thống, khóa sổ kế toán và phân quyền IAM.
3. **Bất biến vĩnh viễn (Immutable Table):**
   - Bảng `audit_logs` được cấu hình Append-Only. Mọi câu lệnh `UPDATE` hoặc `DELETE` đều bị ngăn chặn ở cấp cơ sở dữ liệu và application guard.

---

## 3. Cơ Chế Mật Mã Khối & Chuỗi Băm SHA-256 (Cryptographic Hash Chaining)

Chuỗi băm kiểm toán tuân thủ chuẩn FIPS 180-4 và ISO/IEC 10118-3:
```
Block(0) [Genesis]:
  prevHash = "genesis-block-00000000000000000000000000000000000000000000000000000000"
  hash(0)  = SHA256(prevHash + blockNumber + timestamp + userId + action + payload)

Block(n):
  prevHash = hash(n-1)
  hash(n)  = SHA256(prevHash + blockNumber + timestamp + userId + action + payload)
```
- **Xác minh toàn vẹn (`/api/audit/verify-chain`):** Quét tuần tự toàn bộ các khối từ block 1 đến block N. Nếu `hash(n) !== recalculate(n)` hoặc `prevHash(n) !== hash(n-1)`, hệ thống đánh dấu ngay lập tức `tamperStatus = 'TAMPERED'` và trả về vị trí khối vi phạm chính xác.
- **Bảo vệ dữ liệu nhạy cảm (Privacy Masking):** Các trường nhạy cảm (mật khẩu, khóa API, số thẻ ngân hàng, token xác thực) được tự động ẩn `[REDACTED]` trước khi băm và lưu trữ.

---

## 4. Kiến Trúc Vỏ Hệ Thống Đa Tầng (L0 — L4 Shell Architecture)

1. **Tầng L0: Global Header & Security Status Bar**
   - Tiêu đề định danh: `M02 • AUDIT COMPLIANCE & GOVERNANCE LEDGER`.
   - Huy hiệu chứng nhận: `Rule #19 Confirmed`, `Cryptographic Proof Active`.
   - Bộ công cụ tác vụ nhanh:
     - `Kích hoạt Quét Mật Mã` (chạy `/api/audit/verify-chain`).
     - `Làm mới dữ liệu` (`fetchAuditLogs`).
     - `Xuất Báo Cáo CSV` (tuân thủ Rule #19 với `ConfirmDialog`).
2. **Tầng L1: Workspace Sub-Navigation Strip (4 Sub-Tabs)**
   - Lưu trữ và đồng bộ trạng thái tab phiên qua hook `useWorkspaceSessionTab<AuditSubTab>('M02', 'ledger')`.
   - 4 Sub-Tabs chuyên trách:
     - `ledger`: **Sổ Nhật Ký Kiểm Toán Toàn Doanh Nghiệp** (Data Grid đa tầng L3, phân trang, bộ lọc đa chiều).
     - `integrity`: **Kiểm Định Toàn Vẹn & Khối Chữ Ký SHA-256** (KPI 4 thẻ, sơ đồ giải thuật mật mã, mẫu 5 khối gần nhất).
     - `compliance`: **Báo Cáo Tuân Thủ ISO 27001 & SOX 404** (Thống kê phân hệ, phân tích SoD).
     - `security_alerts`: **Sự Kiện Cảnh Báo Rủi Ro & Gian Lận** (Bản ghi `PERMISSION_DENIED`, truy cập bất thường).
3. **Tầng L2: KPI Overview Strip**
   - Thẻ thống kê thời gian thực: Tổng số bản ghi kiểm toán, Số khối đã băm SHA-256, Tỷ lệ toàn vẹn (100.0%), Số cảnh báo vi phạm.
4. **Tầng L3: Workspace Canvas & High-Performance Data Grid**
   - Omnibar tìm kiếm nhanh (mã chứng từ, user, đối tượng, phân hệ).
   - Bộ lọc Dropdown: Phân hệ nguồn (Sales, Purchase, Inventory, Finance, Admin...), Kết quả (SUCCESS, PERMISSION_DENIED, FAILED).
   - Bảng dữ liệu chuẩn Enterprise: Phân loại viền màu theo trạng thái (`border-l-4`), `hover:bg-slate-100/80`, font số liệu `font-mono tabular-nums`.
5. **Tầng L4: Detail Modal, Confirm Dialog & Audit Forensics**
   - `AuditDetailModal.tsx`: Kiểm tra sâu bản ghi: Correlation ID, Số hiệu khối (`Khối #N`), Chữ ký số SHA-256 hiện tại, Liên kết khối trước (`prevHash`), Trạng thái xác thực (`tamperStatus`), Các trường Masked, Bảng so sánh Payload Before/After formatted JSON.
   - `ConfirmDialog.tsx`: 100% các hành động quét mật mã, xuất tệp CSV, đóng cảnh báo bảo mật đều được xác nhận an toàn qua modal chuẩn.

---

## 5. Hợp Đồng Dữ Liệu & Danh Mục API (Data Contracts & APIs)

### Bảng Cơ Sở Dữ Liệu (`audit_logs`)
| Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ |
|---|---|---|---|
| `id` | `INTEGER` | PRIMARY KEY AUTOINCREMENT | Khóa chính bản ghi |
| `auditCode` | `TEXT` | NOT NULL UNIQUE | Mã kiểm toán chuẩn (`AUD-TIMESTAMP-SEQ`) |
| `blockNumber` | `INTEGER` | NOT NULL | Số thứ tự khối trong chuỗi băm mật mã |
| `prevHash` | `TEXT` | NOT NULL | Chữ ký SHA-256 của khối liền kề trước đó |
| `sha256Checksum` | `TEXT` | NOT NULL | Chữ ký SHA-256 của khối hiện tại |
| `tamperStatus` | `TEXT` | DEFAULT 'VERIFIED' | Trạng thái toàn vẹn (`VERIFIED` / `TAMPERED`) |
| `module` | `TEXT` | NOT NULL | Phân hệ nguồn (`SALES`, `INVENTORY`, `PURCHASE`...) |
| `action` | `TEXT` | NOT NULL | Thao tác (`CREATE`, `UPDATE`, `APPROVE`, `POST`...) |
| `entityType` | `TEXT` | NOT NULL | Loại đối tượng (`PURCHASE_CONTRACT`, `LOT`, `ORDER`...) |
| `entityId` | `TEXT` | NOT NULL | Mã đối tượng tác động |
| `userId` | `INTEGER` | NULLABLE | ID người dùng thực hiện |
| `username` | `TEXT` | NOT NULL | Tên tài khoản |
| `role` | `TEXT` | NOT NULL | Vai trò người dùng tại thời điểm thực hiện |
| `result` | `TEXT` | NOT NULL | Kết quả (`SUCCESS`, `FAILED`, `PERMISSION_DENIED`) |
| `beforeData` | `TEXT` | NULLABLE | Trạng thái dữ liệu JSON trước thay đổi |
| `afterData` | `TEXT` | NULLABLE | Trạng thái dữ liệu JSON sau thay đổi |
| `maskedFields` | `TEXT` | NULLABLE | Danh sách các trường được che giấu bảo mật |
| `ipAddress` | `TEXT` | NULLABLE | Địa chỉ IP của máy trạm |
| `createdAt` | `TEXT` | NOT NULL | Dấu thời gian chuẩn ISO 8601 |

### Danh Mục API Endpoints (`/api/audit`)
- `GET /api/audit/logs`: Tra cứu danh sách nhật ký kiểm toán với bộ lọc (module, action, result, user, page, limit).
- `GET /api/audit/logs/:id`: Xem chi tiết bản ghi kiểm toán kèm toàn bộ payload và chữ ký băm.
- `GET /api/audit/verify-chain`: Quét toàn diện chuỗi mật mã khối SHA-256 và trả về báo cáo tính toàn vẹn.
- `POST /api/audit/verify-chain`: Kích hoạt phiên kiểm định mật mã chuyên sâu từ giao diện quản trị.
- `GET /api/audit/summary`: Lấy số liệu thống kê KPI tổng quan về hoạt động kiểm toán.

---

## 6. Mạng Lưới Phân Hệ Đã Tích Hợp (Enterprise Integration Map)

Toàn bộ các phân hệ nghiệp vụ chính đã được di chuyển hoàn tất sang `AuditService`:
1. **Phân hệ M03 — System Settings (`settings.routes.ts`):** Ghi nhật ký cấu hình tham số, chuyển đổi chi nhánh, đổi môi trường làm việc, cưỡng chế đăng xuất (Force Logout), sửa lỗi toàn vẹn và dọn rác hệ thống.
2. **Phân hệ M08 — Mua Hàng (`purchases.routes.ts`):** Ghi nhận tạo hợp đồng cung ứng mới và gia hạn hợp đồng mua sắm.
3. **Phân hệ M22 — Lô & Hạn Sử Dụng (`lots.routes.ts`):** Ghi nhận khởi tạo lô hàng mới và cập nhật trạng thái kiểm định chất lượng lô hàng.
4. **Phân hệ M13 & M15 — Bán Hàng & Đổi Trả (`sales.routes.ts`):** Ghi nhận thực hiện xuất giao hàng (Fulfillment), xác nhận thanh toán đơn hàng, tạo yêu cầu đổi trả (RMA) và hoàn tất xử lý bảo hành/hoàn tiền.
5. **Cơ Chế Nghiệp Vụ Trung Tâm (Core Business Engines):**
   - `SalesEngine.ts`: Ghi nhận tạo đơn hàng bán lẻ & bán buôn.
   - `unifiedPipelineEngine.ts`: Ghi nhận thực thi quy trình chuỗi cung ứng đồng nhất.
   - `bankReconciliationEngine.ts`: Ghi nhận khớp nối sổ phụ ngân hàng và chênh lệch kế toán.

---

## 7. Tiêu Chuẩn Thiết Kế UI/UX Doanh Nghiệp (Rule #19 & Rule #20)

- **100% ConfirmDialog.tsx:** Tuyệt đối không còn `window.alert()` hay `window.confirm()`. Các tác vụ quét mật mã chuỗi băm, xuất báo cáo CSV đều được bọc trong `ConfirmDialog.tsx` với thông điệp rõ ràng, nút bấm phân loại màu theo mức độ rủi ro (Primary/Warning/Danger).
- **Độ tương phản đạt chuẩn WCAG AA:** Toàn bộ badge trạng thái (`bg-emerald-100 text-emerald-950 border-emerald-300`, `bg-amber-100 text-amber-950`, `bg-rose-100 text-rose-950`) đảm bảo tỷ lệ tương phản vượt 4.5:1 trên cả nền sáng và nền tối.
- **Quy tắc Typography & Monospace:**
  - Mọi mã kiểm toán (`AUD-...`), mã đối tượng (`ID`), số hiệu khối (`Khối #N`), dấu thời gian (`createdAt`), chuỗi băm SHA-256 đều được định dạng bằng `font-mono tabular-nums`.
- **Hiệu ứng bảng dữ liệu L3:** Bảng dữ liệu có đường viền chỉ báo trạng thái `border-l-4`, hiệu ứng dòng hover mượt mà (`hover:bg-slate-100/80 dark:hover:bg-slate-700/60`).

---

## 8. Bằng Chứng Nghiệm Thu & Khóa Baseline (Acceptance Seal)

| Tiêu Chí Kiểm Tra | Kết Quả Đạt Được | Bằng Chứng |
|---|:---:|---|
| **Single-Writer Enforcement** | ✅ ĐẠT 100% | 100% các phân hệ chuyển sang `AuditService`, không còn lệnh insert raw `auditLogs`. |
| **SHA-256 Hash Chaining** | ✅ ĐẠT 100% | Đầy đủ `blockNumber`, `prevHash`, `sha256Checksum`, tính toán băm tuần tự. |
| **Tamper Detection Scan** | ✅ ĐẠT 100% | API `/api/audit/verify-chain` kiểm tra chuỗi băm và phát hiện sai lệch tức thời. |
| **Rule #19 ConfirmDialog** | ✅ ĐẠT 100% | 0 `window.alert/confirm`, 100% dùng `ConfirmDialog.tsx`. |
| **Rule #20 UI Replication** | ✅ ĐẠT 100% | Đầy đủ 4 Sub-Tabs, L0-L4 Shell, Modal L4 hiển thị chi tiết JSON Before/After. |
| **TypeScript & Build Check** | ✅ ĐẠT 100% | `compile_applet` biên dịch thành công không có lỗi cú pháp hay thiếu import. |

> **CHỈ THỊ KIẾN TRÚC:** Phân hệ **M02 — Audit Compliance & SHA-256 Forensic Ledger** chính thức được phê duyệt và đóng băng mã nguồn theo trạng thái **`FROZEN & IMMUTABLE BASELINE`**. Mọi thay đổi trong tương lai bắt buộc phải tuân thủ quy trình bảo vệ phạm vi của Rule #16.
