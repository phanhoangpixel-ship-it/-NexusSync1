# M39 QUALITY CONTROL & QMS WORKSPACE
## FULL UI/UX DESIGN SPECIFICATION — SINGLE SOURCE OF TRUTH (PHASE 0, 1 & 2)

**Document Reference:** `/docs/design-specs/M39_FULL_UI_DESIGN_SPEC.md`  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Module Replication Protocol) trong `GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`  
**Master Layout Template:** `/docs/design-specs/M41_MASTER_DESIGN_SPEC.md` (Blue Primary Palette & L0-L4 Design Architecture)  
**Target Module:** `M39` — Quality Control & QMS Workspace (Quản lý Chất lượng & Cổng KCS)  
**File Component:** `/src/components/workspaces/M39QualityControlWorkspace.tsx`  
**Trạng thái:** 🟢 **CHUẨN BỊ ĐỒNG BỘ 100% TIÊU CHUẨN THIẾT KẾ DOANH NGHIỆP TỪ M41 (BLUE PRIMARY)**

---

## 1. MỤC LỤC TỔNG QUAN DANH MỤC TAB M39 (PHASE 0 INVENTORY)

| STT | Mã Tab | Tên Tab Chức Năng | Loại Màn Hình | Vai Trò Chức Năng |
|:---:|:---|:---|:---|:---|
| 1 | `quarantine_gate` | **Cổng KCS & Tồn Cách Ly** | Single Writer Gate Table + Quick Actions | Thực thi Rule #03 (Inventory Single Writer Gate): Kiểm định lô hàng nhập kho PO (GRN) & thành phẩm MES (WO), phê duyệt chuyển sang Tồn khả dụng (Available) hoặc chuyển sang xử lý lỗi. |
| 2 | `inspections` | **Nhật ký Thanh tra & Kiểm định** | Filterable Audit Table + 360° Inspection Drawer | Quản lý toàn bộ hồ sơ kiểm định IQC (Đầu vào), OQC (Đầu ra), IPQC (Trong quá trình sản xuất), thông số dung sai kỹ thuật, người phụ trách và kết quả đạt/không đạt. |
| 3 | `ncrs` | **Báo cáo không phù hợp (NCR)** | Non-Conformance Table + Disposition Actions | Ghi nhận các lỗi chất lượng vượt ngưỡng dung sai, phân cấp độ nghiêm trọng (High, Medium, Low), biện pháp xử lý phế phẩm/sửa lại (Scrap/Rework/RTV) và đóng hồ sơ NCR. |
| 4 | `analytics` | **Phân tích Xu hướng & Thống kê** | Executive Visual Dashboard (Recharts) | Biểu đồ xu hướng thanh tra 7 ngày (Tỷ lệ Đạt/Hỏng), Biểu đồ tròn phân loại kết quả KCS tháng hiện tại, tỷ lệ Yield và chỉ số Six Sigma Pareto. |

---

## 2. KIẾN TRÚC TOÀN CỤC (GLOBAL SHELL & NAVIGATION)

### 2.1 Cấu trúc bố cục Phân Tầng L0, L1, L2 (Chuẩn M41)

- **Tầng L0 (Workspace Banner):**
  - **Container:** `p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4`.
  - **Icon khối:** `p-2.5 bg-blue-600 text-white rounded-xl shadow-xs`.
  - **Chip phân hệ:** `px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold rounded border border-emerald-400/30`.
  - **Chip tiêu chuẩn:** `px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold flex items-center gap-1.5`.
  - **Chip QMS Metric:** `px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-700 text-[11px] font-mono font-semibold flex items-center gap-1.5`.
  - **Tiêu đề H1:** `text-xl font-bold text-white mt-1`.
  - **Mô tả:** `text-xs text-slate-300 mt-2 max-w-2xl`.
  - **Nút hành động nhanh:**
    - Xuất Báo cáo KCS (CSV): `px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all border border-emerald-500/30 shadow-xs cursor-pointer flex items-center gap-1.5`.
    - Tạo phiếu QA mới: `px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all border border-blue-500/30 shadow-xs cursor-pointer flex items-center gap-1.5`.
    - Đồng bộ dữ liệu: `px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer flex items-center gap-1.5`.

- **DeepLink Banner (Liên kết Phân hệ Liên quan):**
  - `DeepLinkBanner` liên kết sâu sang **M40 EHS Safety & Environment** (`/ehs`) với `variant="blue"`.
  - Giải thích mối liên hệ khép kín giữa kiểm soát chất lượng kỹ thuật sản phẩm (QMS) với hồ sơ an toàn lao động, nguy cơ rủi ro hiện trường và hệ tiêu chuẩn ISO 9001:2015 & ISO 45001:2018.

- **Tầng L1 (Sub-tabs Navigation Bar):**
  - **Container:** `bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-2 flex items-center gap-2 overflow-x-auto scrollbar-none`.
  - **Tab Active:** `bg-blue-600 text-white shadow-xs px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer`.
  - **Tab Inactive:** `text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer`.
  - **Badge số lượng:** `px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300`.

- **Tầng L2 (KPI Summary Strip):**
  - **Grid 4 cột linh hoạt thay đổi theo từng Tab:** `grid grid-cols-2 lg:grid-cols-4 gap-4`.
  - **Khối thẻ KPI (StatCard):**
    - Tab `quarantine_gate`: Chờ Duyệt KCS (Quarantine Items), Khối Lượng Cách Ly, Tỷ Lệ Giải Phóng Thành Công (%), Vi Phạm Quy Cách Cần Khóa.
    - Tab `inspections`: Tổng Số Lượt Kiểm Định, Tỷ Lệ Đạt (Pass Rate %), Hồ Sơ Hoàn Tất, Ca Cần Giám Sát Kỹ Thuật.
    - Tab `ncrs`: Biên Bản NCR Đang Mở, NCR Mức Độ Nghiêm Trọng (High), Tỷ Lệ Đóng NCR (%), Chi Phí Phế Phẩm Ước Tính.
    - Tab `analytics`: Tỷ Lệ Pass Rate Toàn Hệ Thống, Chỉ Số Yield 7 Ngày, Tổng Ca Kiểm Tra Tuần Này, Đạt Chuẩn ISO 9001 Audit.
  - Định dạng số: `font-mono tabular-nums font-bold`, nullish coalescing `??`.

---

## 3. CHI TIẾT TỪNG TAB GIAO DIỆN

### TAB 1: `quarantine_gate` (Cổng KCS & Tồn Cách Ly)
- **Banner Thông tin Chuyên đề:** Khung thông báo chuyên đề về **Rule #03 Inventory Single Writer Gate**, giải thích cơ chế khóa tự động hàng nhập và thành phẩm tại kho cách ly đến khi có quyết định KCS.
- **Bảng Cổng KCS:**
  - Viền trạng thái bên trái `border-l-4 border-l-blue-500`.
  - Mã Lô (Lot #): `font-mono font-bold text-blue-600 dark:text-blue-400`.
  - Mặt hàng & SKU: Tiêu đề rõ ràng, SKU hiển thị dạng mã mono.
  - Nguồn gốc: Badge phân loại PO Inbound (GRN) hoặc MES Work Order Output (WO) kèm mã tham chiếu có thể click xem liên kết lineage.
  - Số lượng cách ly: Căn phải, `font-mono tabular-nums font-bold text-blue-700 dark:text-blue-300`.
  - Thao tác: Nút "Nghiệm Thu Đạt" (kích hoạt ConfirmDialog chuyển kho sang Available), Nút "Lập NCR" (kích hoạt ConfirmDialog chuyển sang danh mục lỗi).
- **Tầng L4:** `PaginationControl` chuẩn M41.

### TAB 2: `inspections` (Nhật ký Thanh tra & Kiểm định)
- **Thanh tìm kiếm & lọc đa chiều:**
  - Ô tìm kiếm: Tìm theo mã phiếu QA, tên sản phẩm, người phụ trách, số lô.
  - Lọc phân loại: Tất cả loại, IQC (Đầu vào), OQC (Đầu ra), IPQC (Trong quá trình sản xuất).
  - Lọc trạng thái: Tất cả trạng thái, Passed (Đạt chuẩn), Failed (Không đạt), Pending (Chờ kiểm tra).
- **Bảng Nhật ký Kiểm định:**
  - Viền trạng thái `border-l-4` (Xanh lá nếu Passed, Đỏ nếu Failed, Vàng nếu Pending).
  - Cột Thao tác: Nút xem hồ sơ KCS 360° (`handleSelectEntity` + mở modal chi tiết).
- **Tầng L4:** `PaginationControl` chuẩn M41.

### TAB 3: `ncrs` (Báo cáo không phù hợp - NCR)
- **Thanh tìm kiếm & lọc:** Tìm theo mã NCR, phiếu nguồn refId, mô tả lỗi; lọc mức độ nghiêm trọng (High, Medium, Low); lọc trạng thái (Open, Investigating, Resolved, Closed).
- **Bảng danh sách NCR:**
  - Viền `border-l-4` (Đỏ nếu High, Vàng nếu Medium, Xanh dương nếu Low).
  - Cột Hành động khắc phục: Rework, Scrap, Return to Vendor (RTV).
  - Cột Thao tác: Nút "Giải quyết NCR" và "Đóng hồ sơ NCR" qua `ConfirmDialog`.
- **Tầng L4:** `PaginationControl` chuẩn M41.

### TAB 4: `analytics` (Phân tích Xu hướng & Thống kê)
- **Biểu đồ Cột (BarChart - Recharts):** Xu hướng thanh tra 7 ngày qua (Passed vs. Failed) với thiết kế thanh mảnh, bo góc trên `[4, 4, 0, 0]`, bảng màu Tailwind xanh lá emerald và đỏ rose.
- **Biểu đồ Tròn (PieChart - Recharts):** Phân loại kết quả kiểm định tháng hiện tại (Passed, Rework, Scrap) với hiệu ứng hover và chú thích chú giải rõ ràng.
- **Thẻ Thống kê Six Sigma & KPI Tóm tắt:** Thống kê phân bổ lỗi phổ biến nhất (Sai số kích thước, trầy xước bề mặt, lỗi áp suất, dung sai điện trở).

---

## 4. QUY CHUẨN MODALS & CONFIRM DIALOG (RULE #19)

1. **Modal Tạo Phiếu QA / Kiểm Định (Create QA Ticket Modal):**
   - Header: Gradient Slate + Icon Blue-600.
   - Các trường: Loại phiếu kiểm định, Hạng mục / Sản phẩm, Mã tham chiếu lô hàng, Người phụ trách kiểm định, Tiêu chuẩn kỹ thuật / Ghi chú dung sai.
   - Nút Submit: `bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold`.

2. **Modal Xem Chi Tiết Hồ Sơ KCS 360° (Inspection 360° Modal/Drawer):**
   - Xem toàn bộ dữ liệu phiếu thanh tra, lô hàng nguồn, thông số dung sai.
   - Cây phả hệ dữ liệu (`lineage`) liên kết đến PO/WO và biên bản NCR.
   - Lịch sử kiểm toán (`auditTrail`) kèm mã kiểm tra SHA-256.
   - Hạch toán sổ cái phế phẩm/rework (`glEntries`).

3. **ConfirmDialog Cho Mọi Thao Tác Nghiệp Vụ (Rule #19):**
   - Phê duyệt giải phóng hàng cách ly: `ConfirmDialog` variant `primary` (blue).
   - Khóa hàng & lập biên bản NCR: `ConfirmDialog` variant `danger` (rose).
   - Đóng hồ sơ NCR: `ConfirmDialog` variant `warning` (amber).
   - 100% không dùng `window.alert()` hoặc `window.confirm()`.
