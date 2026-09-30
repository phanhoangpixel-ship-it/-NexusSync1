# M29 — Digital Document Management System & e-Vault (DMS)

**Module ID:** `M29`  
**Module Name:** DMS Document Vault & e-Archive  
**Business Group:** `8. HỆ THỐNG & GIÁM SÁT (SYSTEM & GOVERNANCE)`  
**Workspace ID:** `WS28_DMS` | **Primary Route:** `/dms` | **Aliases:** `/digital-dms`  
**Mounted UI Component:** `src/modules/governance/m29-dms/components/DMSWorkspace.tsx`  
**Primary API Router:** `src/routes/dms.routes.ts` (`/api/dms/*`)  
**Domain Authority Service:** `engines/dmsService.ts` (`DmsService`)  

---

## 1. TỔNG QUAN ĐIỀU HÀNH & MỤC TIÊU DOANH NGHIỆP
M29 là kho số hóa chứng từ tập trung, niêm phong mật mã bất biến và kiểm soát thời hạn lưu trữ pháp lý (Retention & Legal Hold) cho toàn bộ hệ sinh thái NexusSync ERP.

M29 giải quyết triệt để 5 vấn đề cốt lõi của doanh nghiệp:
1. **Toàn vẹn dữ liệu (Data Integrity):** Băm SHA-256 Server-side tại thời điểm tiếp nhận tài liệu (`hashScope: FILE_CONTENT` hoặc `METADATA_JSON`). Chống gian lận và can thiệp trái phép.
2. **Ký số & Niêm phong (Sign & Seal):** Cơ chế ký điện tử nội bộ và pháp lý (Viettel CA/HSM) kèm phát hành sự kiện giao dịch outbox `dms.document.sealed.v1`.
3. **Quản trị lưu trữ & Lệnh giữ pháp lý (Retention & Legal Hold):** Thiết lập thời gian lưu trữ theo luật định (Luật Kế toán Việt Nam 10 năm, ISO 5 năm, Vĩnh viễn) kết hợp cơ chế khóa bất biến (Legal Hold) ngăn chặn tiêu hủy tài liệu khi đang thanh tra, kiểm toán.
4. **Tiêu hủy có kiểm soát (Controlled Disposal):** Luồng trình duyệt sang Hội đồng Pháp chế/Nhân sự M28, lưu trữ bia vết (Tombstone) kiểm toán vĩnh viễn trong M02.
5. **Cảnh báo thiếu đính kèm (Missing Attachments Audit):** Quét đối soát tự động các chứng từ kế toán M31, mua hàng M08, ngân quỹ M32 chưa đính kèm tệp số hóa mà không làm nghẽn luồng vận hành chính.

---

## 2. RANH GIỚI THẨM QUYỀN (DOMAIN AUTHORITY BOUNDARIES)
- **Chủ quản duy nhất (Single-Writer):** `DmsService` quản lý bảng `dms_documents`, `retention_policies`, `e_signatures`, `dms_archives`.
- **Ranh giới bất khả xâm phạm:**
  - CẤM M29 ghi vào `stock_ledger` hoặc `stock_balances` của Inventory M17.
  - CẤM M29 ghi vào `accounting_entries` hoặc can thiệp sổ cái của Accounting M30.
  - CẤM M29 tham gia tính giá vốn COGS (M42) hoặc chính sách giá (M41).
  - Tương thích ngược: Cho phép các module đã đóng băng (`M31`, `M26`, `M06`, `M34`, `M35`) lưu trữ biên bản hoặc hồ sơ nghiệm thu vào `dms_documents`.

---

## 3. DATA CONTRACT & SCHEMA
- **Bảng `dms_documents`:**
  - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
  - `docCode`: TEXT UNIQUE NOT NULL
  - `title`, `category`, `categoryName`, `version`, `format`, `fileSize`, `sizeBytes`, `mimeType`
  - `status`: `DRAFT`, `APPROVED`, `SIGNED`, `SEALED`, `SUPERSEDED`, `DISPOSED`
  - `classification`: `PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`
  - `sha256Hash`: TEXT (Mã băm SHA-256)
  - `hashScope`: `FILE_CONTENT` hoặc `METADATA_JSON`
  - `entityType`, `entityId`, `refDocNo`, `linkedModule`
  - `retentionYears`, `expireDate`, `retentionUntil`, `legalHold`
  - `supersedesId`: INTEGER (Quản lý đa phiên bản không ghi đè)
  - `idempotencyKey`: TEXT UNIQUE
  - `fileContentBase64`: TEXT (Lưu trữ nội dung nhị phân bền vững sau restart)
- **Bảng phụ trợ:**
  - `retention_policies`: Danh mục chính sách lưu trữ mẫu (5 năm, 10 năm, vĩnh viễn).
  - `e_signatures`: Nhật ký ký số điện tử (signerId, signerName, signatureType, hashValue, signedAt).
  - `dms_archives`: Hồ sơ đóng gói kho lạnh Glacier.

---

## 4. DANH MỤC API CHÍNH
- `GET /api/dms/documents` — Truy vấn tài liệu có phân trang, lọc danh mục, bảo mật RBAC.
- `GET /api/dms/documents/:id` — Chi tiết hồ sơ kèm ghi nhận Audit Log xem tài liệu mật.
- `POST /api/dms/vault` — Tải lên, băm SHA-256 server-side, liên kết chứng từ và kiểm tra trùng lặp.
- `POST /api/dms/documents/:id/sign` — Ký số, niêm phong mật mã và emit `dms.document.sealed.v1`.
- `POST /api/dms/documents/:id/verify` — Kiểm tra tính toàn vẹn của mã băm.
- `POST /api/dms/documents/batch-verify` — Kiểm toán toàn bộ kho tài liệu.
- `PUT /api/dms/retention` — Cập nhật chính sách lưu trữ và bật/tắt Legal Hold.
- `POST /api/dms/documents/:id/request-disposal` — Trình duyệt tiêu hủy sang M28.
- `POST /api/dms/documents/:id/dispose` — Tiêu hủy có bia vết (Tombstone).
- `GET /api/dms/reports/missing-attachments` — Quét báo cáo chứng từ chưa số hóa.
- `GET /api/dms/retention-policies` & `GET /api/dms/signatures` — Danh mục chính sách & chữ ký số.

---

## 5. CHUẨN UI/UX DOANH NGHIỆP (RULE #19 & #20)
- **6 Subtabs Hoàn chỉnh:**
  1. `vault`: Kho tài liệu tập trung.
  2. `attachments`: Đính kèm theo chứng từ (PO, INV, SO, Payment...).
  3. `retention_hold`: Quản lý thời hạn lưu trữ & khóa Legal Hold.
  4. `signing_seal`: Trình ký điện tử & niêm phong bất biến.
  5. `integrity_audit`: Bảng điều khiển kiểm toán toàn vẹn SHA-256.
  6. `missing_reports`: Báo cáo rà soát chứng từ thiếu đính kèm.
- **Tuân thủ thiết kế:**
  - 100% hộp thoại xác nhận qua `ConfirmDialog.tsx` (Tuyệt đối không dùng `window.confirm`).
  - Toàn bộ số chứng từ, SHA-256, dung lượng, phiên bản đều hiển thị `font-mono tabular-nums`.
  - Màu sắc trạng thái tuân thủ nghiêm ngặt Semantic Color Palette (Emerald: Niêm phong; Amber: Nháp/Cần chú ý; Rose: Tiêu hủy/Hold).
