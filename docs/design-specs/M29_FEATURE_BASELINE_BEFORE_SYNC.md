# M29 DIGITAL DOCUMENT MANAGEMENT & E-SIGNATURE (DMS) — FEATURE BASELINE BEFORE SYNC

**Document Reference:** `/docs/design-specs/M29_FEATURE_BASELINE_BEFORE_SYNC.md`  
**Governing Standard:** Rule #01 (Architecture First), Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Module Replication Protocol)  
**Tác giả:** Chuyên viên Lập trình Frontend cấp cao — NexusSync ERP Team  
**Mục tiêu:** Ghi lại chính xác 100% tính năng, API endpoints, luồng dữ liệu, thẩm quyền RBAC/SoD, và các ràng buộc validation của Phân hệ M29 trước khi đồng bộ giao diện từ Master Design Spec M41.

---

## 1. DANH MỤC CÁC TAB / PHÂN VÙNG CHỨC NĂNG CỦA M29

| STT | Phân Vùng Chức Năng | API Endpoints | Hành Động Người Dùng | RBAC & SoD (Phân Định Quyền Hạn) | Ràng Buộc Validation & Xử Lý Logic |
|:---:|:---|:---|:---|:---|:---|
| 1 | **Kho Chứng Từ Số Hóa (Master Documents & Tree)** | `GET /api/dms/documents`<br>`POST /api/dms/documents`<br>`POST /api/dms/documents/:id/sign`<br>`POST /api/dms/documents/ocr` | - Tìm kiếm đa trường (DocCode, Title, RefDoc, Category)<br>- Lọc cây thư mục (Hợp đồng, Hóa đơn, Bản vẽ BOM, Chứng chỉ ISO, Quy trình SOP)<br>- Lọc nhanh trạng thái (ALL, SIGNED, APPROVED, DRAFT, RELEASED)<br>- Tải lên chứng từ mới<br>- AI Gemini OCR tự động trích xuất metadata<br>- Ký số nhanh dòng chứng từ<br>- Nạp chứng từ vào Global Context Bar<br>- Xuất chứng từ điện tử PDF | - Quyền `DMS_VIEWER`: Xem và tải PDF<br>- Quyền `DMS_OPERATOR`: Tạo chứng từ, gọi AI OCR<br>- Quyền `DMS_SIGNER`: Ký số token HSM | - Tiêu đề chứng từ bắt buộc nhập (`required`)<br>- Tự động sinh mã `docCode` theo danh mục (`DMS-CON-2026-xxx`)<br>- Tự động tính dung lượng, định dạng và mã băm SHA-256 gốc<br>- Khởi tạo 3 giai đoạn trình ký mặc định |
| 2 | **Hàng Đợi Trình Ký Đa Cấp (Multi-Party Approval Pipeline)** | `POST /api/dms/documents/:id/workflow-sign` | - Thẩm định Pháp chế (Stage 2)<br>- Ký số CFO / Kế toán trưởng qua Token HSM (Stage 3)<br>- Xem tiến độ luồng trình ký theo thời gian thực | - **SoD Cấp 2**: Phòng Pháp chế thẩm định tính hợp lệ pháp lý<br>- **SoD Cấp 3**: CFO / Kế toán trưởng ký số phê duyệt tài chính<br>- **Ràng buộc cứng SoD**: Stage 3 bị vô hiệu hóa (disabled) nếu chưa vượt qua Stage 2 | - Kiểm tra `stage === 2` hoặc `stage === 3`<br>- Ghi nhận người ký, chức danh và dấu thời gian Timestamp TSA<br>- Tự động đổi trạng thái sang `APPROVED` (ở Stage 2) và `SIGNED` (ở Stage 3)<br>- Cấp mã băm niêm phong `sha256Hash` cuối cùng |
| 3 | **Phân Tầng Kho Lưu Trữ (Storage Tiering: S3 vs Glacier)** | `POST /api/dms/documents/:id/archive` | - Đóng băng & chuyển kho lưu trữ lạnh Cold Storage (S3 Glacier Vault 10 năm)<br>- Rã đông và chuyển về kho Active Vault (S3 Standard) | - Quyền `DMS_ADMIN` / `ARCHIVE_MANAGER` quản trị vòng đời tài liệu | - Chuyển đổi trạng thái `storageTier`: `ACTIVE_VAULT` $\leftrightarrow$ `COLD_GLACIER`<br>- Giữ nguyên vẹn mã băm và lịch sử kiểm toán bất biến |
| 4 | **Sổ Cái Kiểm Toán & Toàn Vẹn SHA-256 (Audit Ledger & Integrity)** | `POST /api/dms/documents/:id/verify`<br>`POST /api/dms/documents/:id/version` | - Xác thực toàn vẹn mã băm SHA-256 đối chiếu Sổ cái Kiểm toán An ninh<br>- Nâng phiên bản chứng từ (Versioning: `v1.0` $\rightarrow$ `v1.1`)<br>- Xem lịch sử thao tác & Audit Lineage | - Quyền `AUDITOR` / `COMPLIANCE_OFFICER` kiểm tra toàn vẹn<br>- Quyền `DMS_OPERATOR` nâng phiên bản mới | - Nâng phiên bản tự động cộng `+0.1` vào số phiên bản hiện tại<br>- Khi nâng phiên bản, tự động chuyển trạng thái về `DRAFT` và tái khởi động quy trình trình ký từ Stage 1<br>- Sinh mã băm kiểm toán mới cho phiên bản hiệu chỉnh |

---

## 2. BẢN ĐỒ DỮ LIỆU ĐỐI TƯỢNG CHỨNG TỪ SỐ HÓA (DMS DOCUMENT SCHEMA)

```typescript
export interface DmsDocument {
  id: number;
  docCode: string;           // VD: DMS-CON-2026-001
  title: string;             // VD: Hợp đồng đại lý phân phối 2026
  category: string;          // CONTRACT | FINANCIAL | TECH_SPEC | CERTIFICATE | OPERATION
  categoryName: string;      // Hợp đồng Kinh tế | Hóa đơn & Kế toán | ...
  version: string;           // v1.0, v1.1...
  fileSize: string;          // 2.1 MB
  format: string;            // PDF, DWG, XLSX, DOCX
  status: string;            // DRAFT | PENDING | APPROVED | SIGNED | RELEASED
  securityLevel: string;     // CONFIDENTIAL | RESTRICTED | INTERNAL | PUBLIC
  sha256Hash: string;        // e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
  signedBy: string;          // Chưa ký số | Hoàng Nam (Admin) - Token HSM CA
  signedAt: string | null;   // 2026-08-20 14:30:00
  linkedModule: string;      // M04 Sales Orders | M05 Purchase Orders | M15 MES | ...
  refDocNo: string;          // SO-2026-0099 | PO-2026-0045 | BOM-2026-0012
  storageTier: string;       // ACTIVE_VAULT | COLD_GLACIER
  retentionYears: number;    // 5, 10
  expireDate: string;        // 2031-08-28
  workflowStage: number;     // 1 (Requester) -> 2 (Legal) -> 3 (CFO)
  workflowSteps: Array<{
    step: number;
    name: string;
    role: string;
    status: 'PENDING' | 'COMPLETED' | 'REJECTED';
    user: string;
    signedAt: string | null;
  }>;
}
```

---

## 3. RÀNG BUỘC PHÂN ĐỊNH TRÁCH NHIỆM (SEGREGATION OF DUTIES - SOD)

1. **Maker-Checker Trong Luồng Trình Ký Chứng Từ**:
   - **Người Khởi Tạo (Maker / Requester)**: Soạn thảo, upload tệp, chạy AI Gemini OCR để trích xuất metadata và khởi tạo tài liệu ở trạng thái `DRAFT` (Stage 1).
   - **Người Thẩm Định Pháp Lý (Legal Reviewer)**: Kiểm tra tính pháp lý của hợp đồng / chứng từ, phê duyệt Stage 2 chuyển trạng thái sang `APPROVED`.
   - **Người Ký Số Phê Duyệt Tài Chính (Checker / CFO)**: Ký số điện tử bằng Token HSM CA (Stage 3). Hệ thống áp dụng **ràng buộc cứng**: Nút ký số CFO bắt buộc vô hiệu hóa nếu Stage 2 chưa hoàn tất.

2. **Tính Bất Biến Của Kho Lưu Trữ (Storage Immutability)**:
   - Chứng từ đã ký số (`SIGNED`) và có mã băm SHA-256 được niêm phong không thể chỉnh sửa trực tiếp. Muốn hiệu chỉnh nội dung bắt buộc phải kích hoạt hàm **Nâng Phiên Bản (`handleUpgradeVersion`)** để tạo phiên bản mới `v1.1`, đưa trạng thái về `DRAFT` và yêu cầu luồng trình ký lại từ đầu.

3. **Chuyển Kho Băng Từ (Glacier Cold Storage)**:
   - Chứng từ chuyển sang `COLD_GLACIER` được gắn cờ bảo mật cao, bảo quản lưu trữ tối thiểu 10 năm theo quy định kiểm toán doanh nghiệp.

---

## 4. DANH SÁCH HÀNH VI VÀ DIALOG THAO TÁC CẦN NÂNG CẤP LÊN CONFIRMDIALOG

- **Xác nhận Ký Số CA / Token HSM**: Cần hiển thị `ConfirmDialog` với mã băm SHA-256 và cảnh báo hiệu lực pháp lý trước khi ký.
- **Xác nhận Nâng Phiên Bản Mới (Versioning)**: Cần hiển thị `ConfirmDialog` cảnh báo việc tài liệu sẽ trở về trạng thái `DRAFT` và yêu cầu ký lại từ đầu.
- **Xác nhận Chuyển Kho Băng Từ (Glacier Cold Storage)**: Cần hiển thị `ConfirmDialog` xác nhận niêm phong kho lạnh.
- **Xác nhận Xác Thực Toàn Vẹn Checksum**: Thông báo kết quả kiểm toán SHA-256 bằng UI toast / modal chuẩn, không dùng `window.alert`.

---

## 5. KẾT LUẬN BASELINE

Baseline này ghi nhận toàn bộ chức năng, logic nghiệp vụ, thẩm quyền SoD và API của M29. Quá trình đồng bộ sang phong cách thiết kế Master Design Spec M41 **chỉ thay đổi lớp trình bày (Presentational Layer)**, tuyệt đối giữ nguyên 100% tính năng và logic đã thiết lập.
