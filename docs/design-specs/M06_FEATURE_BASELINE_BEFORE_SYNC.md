# M06 INNOVATION R&D PORTAL — FEATURE BASELINE (BEFORE SYNC)
## BÁO CÁO THIẾT LẬP BASELINE BẢO TOÀN CHỨC NĂNG & DỮ LIỆU

- **Mã Tài Liệu:** `/docs/design-specs/M06_FEATURE_BASELINE_BEFORE_SYNC.md`
- **Module:** M06 (Innovation R&D Portal — Nghiên Cứu, Phát Triển Sản Phẩm Mới & Quản Lý Công Thức)
- **Component File Nguồn:** `/src/components/workspaces/M06InnovationRDWorkspace.tsx`
- **Mục Tiêu:** Ghi nhận 100% chi tiết các API endpoints, hành động người dùng, quy tắc validation, điều kiện RBAC/SoD, quản lý trạng thái (State) trước khi tiến hành đồng bộ giao diện sang chuẩn M19 Master Spec.
- **Nguyên Tắc Bất Biến:** Chỉ thay đổi lớp trình bày (Presentational Layer), TUYỆT ĐỐI KHÔNG làm sai lệch hoặc mất mát bất kỳ luồng xử lý dữ liệu và chức năng nào.

---

## 1. TỔNG QUAN STATE & PROPS CỦA WORKSPACE M06

### 1.1 Props đầu vào
- `onSelectEntity: (entity: SelectedEntityContext) => void`: Bắn sự kiện chọn đối tượng (Project, Formula) ra thanh ngữ cảnh toàn cục (Context Rail L5) kèm Lineage, Audit Trail và GL Entries.
- `onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void`: Kích hoạt Toast thông báo hệ thống.

### 1.2 Session & Quản lý Tab
- `useWorkspaceSessionTab<'projects' | 'formulas' | 'patents' | 'trials'>('M06', 'projects')`: Lưu vết tab đang mở của người dùng vào session lưu trữ của workspace.
- `loading: boolean`: Trạng thái spinner khi làm mới dữ liệu.

---

## 2. CHI TIẾT TỪNG TAB CỦA M06

### TAB 1: ĐỀ TÀI R&D (`projects`)
- **Dữ liệu hiển thị (State):**
  - Mảng `projects` gồm các trường:
    - `id`: Mã đề tài (VD: `RD-2026-001`, `RD-2026-002`, `RD-2026-003`)
    - `title`: Tên đề tài R&D
    - `category`: Lĩnh vực (Phần mềm Doanh nghiệp, Bán dẫn & Phần cứng, Công nghệ Xanh, Công nghệ Sinh học)
    - `lead`: Chủ trì đề tài (Dr. Hoàng Minh Tuấn, Ing. Lê Thị Mai, Eng. Trần Văn Nam)
    - `status`: Trạng thái (`IN_PROGRESS`, `TESTING`, `COMPLETED`)
    - `progress`: Tiến độ % (số nguyên 0 - 100)
    - `budget`: Ngân sách dự kiến (VD: `15.000.000.000 VND`)
    - `deadline`: Thời hạn hoàn thành (`YYYY-MM-DD`)
- **Hành động người dùng (User Actions):**
  1. `handleCreateProject`:
     - Validation: `!newProjTitle.trim()` -> Bắn toast cảnh báo `'warning'`, title: `'Thiếu thông tin'`, message: `'Vui lòng nhập tên đề tài R&D.'`.
     - Tạo đề tài mới với mã ngẫu nhiên `RD-2026-${Math.floor(100 + Math.random() * 900)}`, tiến độ ban đầu 10%, trạng thái `IN_PROGRESS`, chủ trì `SuperAdmin R&D Lead`.
     - Thêm vào đầu danh sách `projects`, xóa trắng form `newProjTitle`, bắn toast `'success'`.
  2. `handleSelectProject`:
     - Bắn đối tượng sang `onSelectEntity` với type `'PROJECT'`, kèm `lineage` 2 cấp (`CURRENT_PROJECT` và `PARENT_MODULE`), và `auditTrail` kèm mã checksum SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
     - Bắn toast `'info'`, title: `'Đã tải dự án R&D'`.
  3. `handleExportCSV`:
     - Xuất toàn bộ mảng `projects` ra file `innovation_rd_projects_report_[YYYY-MM-DD].csv`.
     - Header: `Project ID,Title,Category,Lead,Status,Progress,Budget`.
     - Bắn toast `'success'`, title: `'Xuất báo cáo thành công'`.
  4. Làm mới (Refresh):
     - Bật `loading = true`, timeout 500ms tắt, bắn toast `'info'` `'Đã đồng bộ dữ liệu R&D.'`.

---

### TAB 2: CÔNG THỨC BOM (`formulas`)
- **Dữ liệu hiển thị (State):**
  - Mảng `formulas` gồm các trường:
    - `id`: Mã công thức (VD: `FORM-01`, `FORM-02`, `FORM-03`)
    - `name`: Tên công thức R&D BOM
    - `version`: Phiên bản công thức (VD: `2.4`, `1.0`, `3.1`)
    - `status`: Trạng thái (`APPROVED`, `REVIEW`)
    - `author`: Tác giả / Phòng Lab
    - `components`: Mảng chuỗi các thành phần định mức
- **Hành động người dùng (User Actions):**
  1. `handleCreateFormula`:
     - Validation: `!newFormulaName.trim()` -> Bắn toast `'warning'`, message: `'Vui lòng nhập tên công thức BOM.'`.
     - Tách thành phần: `newFormulaComponents ? newFormulaComponents.split(',').map(s => s.trim()).filter(Boolean) : ['Thành phần cơ bản: 100%']`.
     - Sinh mã: `FORM-0${formulas.length + 1}`, trạng thái `APPROVED`, tác giả `SuperAdmin Lab`.
     - Cập nhật state `formulas`, reset form, bắn toast `'success'`.
  2. `handleViewFormulaDetail`:
     - Gán `selectedFormulaForDetail(formula)`.
     - Bắn đối tượng sang `onSelectEntity` với type `'FORMULA'`, lineage và audit trail.
     - Bắn toast `'info'`.
  3. Đóng Modal chi tiết:
     - `setSelectedFormulaForDetail(null)`.

---

### TAB 3: SÁNG CHẾ & IP (`patents`)
- **Dữ liệu hiển thị (State):**
  - Mảng `patents` gồm:
    - `id`: Mã bằng sáng chế (VD: `PAT-9921`, `PAT-9928`)
    - `title`: Tên sáng chế / Giải pháp hữu ích
    - `filingDate`: Ngày nộp đơn đăng ký (`YYYY-MM-DD`)
    - `status`: Trạng thái bảo hộ (`GRANTED`, `PENDING`)
- **Hành động người dùng:**
  - Xem danh mục các sáng chế đã cấp văn bằng bảo hộ hoặc đang chờ xét duyệt.

---

### TAB 4: THỬ NGHIỆM MẪU (`trials`)
- **Dữ liệu hiển thị:**
  - Banner chứng nhận kiểm định chất lượng nguyên mẫu (Prototype Certification).
  - Huy hiệu bảo mật và kiểm tra áp lực phòng lab.

---

## 3. CHECKLIST KIỂM THỬ KHÔNG HỒI QUY (NON-REGRESSION CHECKLIST)

| STT | Luồng Thao Tác | Kỳ Vọng Kết Quả | Trạng Thái Baseline |
|---|---|---|---|
| 1 | Khởi tạo đề tài R&D rỗng | Toast cảnh báo màu vàng, không sinh đề tài rác | PASS |
| 2 | Khởi tạo đề tài R&D hợp lệ | Đề tài mới xuất hiện đầu bảng, Toast xanh báo thành công | PASS |
| 3 | Click nút Phả hệ 360 / Chọn đề tài | Kích hoạt `onSelectEntity` và Toast xanh dương | PASS |
| 4 | Xuất báo cáo CSV | Tải về file `innovation_rd_projects_report_*.csv` chuẩn RFC 4180 | PASS |
| 5 | Tạo công thức BOM mới rỗng | Toast cảnh báo màu vàng | PASS |
| 6 | Tạo công thức BOM hợp lệ | Formula mới xuất hiện với các thành phần mảng đã phân tách | PASS |
| 7 | Xem chi tiết BOM Modal | Mở modal hiển thị danh mục thành phần BOM và tác giả | PASS |
| 8 | Chuyển giữa 4 tab | Tab được lưu vết và chuyển mượt qua `useWorkspaceSessionTab` | PASS |
| 9 | Tuân thủ Rule #19 | 100% không dùng `window.alert` / `window.confirm`, tích hợp `ConfirmDialog.tsx` | PASS |
