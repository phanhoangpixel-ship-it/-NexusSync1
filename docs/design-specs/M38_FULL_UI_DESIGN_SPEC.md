# M38 SERVICE DESK & IT SERVICE MANAGEMENT (ITSM) WORKSPACE
## FULL UI/UX DESIGN SPECIFICATION — SINGLE SOURCE OF TRUTH (PHASE 0, 1 & 2)

**Document Reference:** `/docs/design-specs/M38_FULL_UI_DESIGN_SPEC.md`  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Module Replication Protocol) trong `GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`  
**Master Layout Template:** `/docs/design-specs/M41_MASTER_DESIGN_SPEC.md` (Blue Primary Palette & L0-L4 Design Architecture)  
**Target Module:** `M38` — Hỗ Trợ Kỹ Thuật & Giải Quyết Sự Cố Service Desk (ITSM Workspace)  
**File Component:** `/src/components/workspaces/ServiceDeskWorkspace.tsx`  
**Trạng thái:** 🟢 **CHUẨN BỊ ĐỒNG BỘ 100% TIÊU CHUẨN THIẾT KẾ DOANH NGHIỆP TỪ M41 (BLUE PRIMARY)**

---

## 1. MỤC LỤC TỔNG QUAN DANH MỤC TAB M38 (PHASE 0 INVENTORY)

| STT | Mã Tab | Tên Tab Chức Năng | Loại Màn Hình | Vai Trò Chức Năng |
|:---:|:---|:---|:---|:---|
| 1 | `tickets` | **Hàng Đợi Sự Cố (Incident Queue)** | Multi-filter Table + Quick Action Drawer | Tiếp nhận, phân loại và xử lý toàn bộ các yêu cầu hỗ trợ kỹ thuật IT, kiểm soát thời gian cam kết dịch vụ SLA, phân công kỹ thuật viên và đóng sự cố qua ConfirmDialog. |
| 2 | `assets_link` | **Thiết Bị IT & Tài Sản Vận Hành (IT Assets & EAM Link)** | Asset Inventory Table + Maintenance Link | Quản lý trang thiết bị CNTT (máy in tem WMS, máy tính trạm, server ERP, PDA kiểm kho, máy quẹt thẻ POS), theo dõi tình trạng phần cứng và liên kết bảo trì sang M27 EAM. |
| 3 | `kb_solutions` | **Kho Tri Thức & Giải Pháp (Knowledge Base & SOPs)** | Searchable Card Grid / Guide Hub | Danh mục tài liệu hướng dẫn khắc phục sự cố tiêu chuẩn (SOP/KEDB), quy trình cấp quyền người dùng M34, cấu hình máy in mã vạch và xử lý lỗi đồng bộ dữ liệu. |
| 4 | `sla_analytics` | **Phân Tích SLA & Hiệu Suất IT (SLA & MTTR Analytics)** | Executive Visual Dashboard (Recharts) | Biểu đồ trực quan hóa khối lượng sự cố 7 ngày (Recharts BarChart), tỷ lệ phân loại yêu cầu (PieChart), xu hướng thời gian phản hồi MTTR và các chỉ số ITIL Six Sigma. |

---

## 2. KIẾN TRÚC TOÀN CỤC (GLOBAL SHELL & NAVIGATION)

### 2.1 Cấu trúc bố cục Phân Tầng L0, L1, L2 (Chuẩn M41)

- **Tầng L0 (Workspace Banner):**
  - **Container:** `p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4`.
  - **Icon khối:** `p-2.5 bg-blue-600 text-white rounded-xl shadow-xs`.
  - **Chip phân hệ:** `px-2 py-0.5 bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold rounded border border-blue-400/30`.
  - **Chip tiêu chuẩn:** `px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold flex items-center gap-1.5`.
  - **Chip SLA Metric:** `px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-700 text-[11px] font-mono font-semibold flex items-center gap-1.5`.
  - **Tiêu đề H1:** `text-xl font-bold text-white mt-1` (Hỗ Trợ Kỹ Thuật & Dịch Vụ IT — Service Desk & ITSM).
  - **Mô tả:** `text-xs text-slate-300 mt-2 max-w-2xl` (Trung tâm tiếp nhận sự cố kỹ thuật, hỗ trợ vận hành hệ thống ERP, quản lý tài sản CNTT và đảm bảo cam kết chất lượng dịch vụ SLA doanh nghiệp).
  - **Nút hành động nhanh:**
    - Xuất Báo cáo Audit IT (CSV): `px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all border border-emerald-500/30 shadow-xs cursor-pointer flex items-center gap-1.5`.
    - Mở Ticket Sự Cố Mới: `px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all border border-blue-500/30 shadow-xs cursor-pointer flex items-center gap-1.5`.
    - Làm mới dữ liệu: `px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer flex items-center gap-1.5`.

- **DeepLink Banner (Liên kết Phân hệ Liên quan):**
  - `DeepLinkBanner` liên kết sâu sang **M27 Quản Lý Bảo Trì Thiết Bị (EAM)** (`/maintenance`) và **M34 Quản Trị Hệ Thống & Phân Quyền (RBAC)** (`/security-rbac`) với `variant="blue"`.
  - Giải thích mối liên hệ khép kín giữa sự cố kỹ thuật IT với bảo trì thiết bị phần cứng nhà máy/kho vận và kiểm soát phân quyền truy cập người dùng ERP.

- **Tầng L1 (Sub-tabs Navigation Bar):**
  - **Container:** `bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-2 flex items-center gap-2 overflow-x-auto scrollbar-none`.
  - **Tab Active:** `bg-blue-600 text-white shadow-xs px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer`.
  - **Tab Inactive:** `text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer`.
  - **Badge số lượng:** `px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300`.

- **Tầng L2 (KPI Summary Strip):**
  - **Grid 4 cột linh hoạt thay đổi theo từng Tab:** `grid grid-cols-2 lg:grid-cols-4 gap-4`.
  - **Khối thẻ KPI (StatCard):**
    - Tab `tickets`: Tổng Số Ticket Tiếp Nhận, Đang Xử Lý (In Progress), Tuân Thủ SLA (%), Thời Gian Phản Hồi MTTR.
    - Tab `assets_link`: Tổng Thiết Bị IT Đang Quản Lý, Thiết Bị Hoạt Động Tốt, Thiết Bị Đang Bảo Trì (M27), Thiết Bị Cần Nâng Cấp/Hết Bảo Hành.
    - Tab `kb_solutions`: Tổng Bài Viết Giải Pháp (KEDB), Hướng Dẫn Vận Hành ERP, Số Lần Tự Khắc Phục Thành Công, Bài Viết Cần Cập Nhật.
    - Tab `sla_analytics`: Điểm Hài Lòng Dịch Vụ CSAT, Tỷ Lệ Giải Quyết Cấp 1 (FCR %), Tỷ Lệ Vi Phạm SLA, Tổng Số Giờ Tiết Kiệm Cho Người Dùng.
  - Định dạng số: `font-mono tabular-nums font-bold`, an toàn dữ liệu với `??`.

---

## 3. CHI TIẾT TỪNG TAB GIAO DIỆN

### TAB 1: `tickets` (Hàng Đợi Sự Cố & Tickets)
- **Thanh tìm kiếm & lọc đa chiều:**
  - Tìm kiếm theo mã ticket, tiêu đề, người yêu cầu, kỹ thuật viên phụ trách, phòng ban.
  - Bộ lọc trạng thái: Tất cả, Mới mở (OPEN), Đang xử lý (IN_PROGRESS), Đã xử lý (RESOLVED), Đã đóng (CLOSED), Nguy cơ trễ SLA.
  - Bộ lọc phân loại: Tất cả, Hardware (Phần cứng), ERP System (Hệ thống ERP), Software & Access (Phần mềm & Quyền), Network (Mạng LAN/Wifi), Database (Cơ sở dữ liệu).
  - Bộ lọc mức độ ưu tiên: Urgent (Khẩn cấp), High (Cao), Normal (Bình thường), Low (Thấp).
- **Bảng danh sách Ticket:**
  - Viền trạng thái bên trái `border-l-4 border-l-blue-500` hoặc màu tương ứng mức độ nghiêm trọng.
  - Mã Ticket: `font-mono font-bold text-blue-600 dark:text-blue-400`.
  - Tiêu đề & phân loại: Tiêu đề in đậm, kèm chip phân loại và thời gian mở.
  - SLA còn lại: Hiển thị đồng hồ đếm ngược với màu cảnh báo đỏ/vàng/xanh.
  - Thao tác nhanh: Nút "Tiếp nhận" (Assign), Nút "Nâng cấp" (Escalate - ConfirmDialog), Nút "Đóng sự cố" (Resolve - ConfirmDialog), Nút "Chi tiết 360°".
- **Tầng L4:** `PaginationControl` chuẩn M41.

### TAB 2: `assets_link` (Thiết Bị IT & Tài Sản Vận Hành)
- **Banner liên kết M27 EAM:** Khung thông báo chuyên đề về việc chuyển tiếp yêu cầu bảo dưỡng phần cứng sang phân hệ M27.
- **Bảng danh mục thiết bị:**
  - Mã thiết bị: `font-mono font-bold text-blue-600 dark:text-blue-400`.
  - Tên thiết bị, danh mục (Server, Barcode Scanner, Printer, Workstation, POS Terminal, Network Switch).
  - Vị trí/Phòng ban & Người sử dụng được gán.
  - Tình trạng: Hoạt động (Operational), Đang sửa chữa (Under Maintenance), Hỏng hóc (Out of Order).
  - Nút thao tác: "Chuyển Bảo Trì M27" (ConfirmDialog) và "Xem lịch sử sự cố".
- **Tầng L4:** `PaginationControl` chuẩn M41.

### TAB 3: `kb_solutions` (Kho Tri Thức & Giải Pháp)
- **Thanh tìm kiếm cẩm nang KEDB:** Tìm nhanh theo từ khóa lỗi hoặc module ERP liên quan.
- **Danh sách bài viết giải pháp:**
  - Thẻ cẩm nang chuẩn thiết kế trực quan với phân loại chuyên mục.
  - Các bước hướng dẫn chi tiết từng bước (Step-by-step resolution).
  - Số lượt áp dụng thành công và nút "Sao chép quy trình".

### TAB 4: `sla_analytics` (Phân Tích SLA & Hiệu Suất IT)
- **Biểu đồ Cột (BarChart - Recharts):** Khối lượng sự cố 7 ngày qua (Tiếp nhận mới vs Đã giải quyết xong).
- **Biểu đồ Tròn (PieChart - Recharts):** Phân bổ sự cố theo danh mục kỹ thuật (Hardware, ERP System, Software Access, Network).
- **Biểu đồ Vùng / Đường (AreaChart - Recharts):** Xu hướng thời gian xử lý sự cố MTTR (Giờ) theo tuần.
- **Thẻ chỉ số Six Sigma / ITIL:** Tỷ lệ FCR (First Contact Resolution), CSAT Rating, SLA Compliance.

---

## 4. QUY CHUẨN MODALS & CONFIRM DIALOG (RULE #19)

- **Modal Mở Ticket Mới:** Form nhập liệu chuẩn với các trường Tiêu đề, Phân loại, Mức ưu tiên, Phòng ban, Người yêu cầu, Mô tả chi tiết.
- **Modal Thêm Thiết Bị IT:** Form đăng ký thiết bị phần cứng mới kết nối danh mục tài sản.
- **Modal Hồ Sơ Chi Tiết Sự Cố 360°:** Hiển thị toàn bộ thông tin vòng đời sự cố, lineage phả hệ, lịch sử kiểm toán SHA-256 và hạch toán SLA ledger.
- **ConfirmDialog cho các tác vụ nhạy cảm:**
  1. Xác nhận đóng ticket hoàn tất sự cố (`ConfirmDialog`).
  2. Xác nhận nâng cấp mức độ khẩn cấp ticket L2/L3 (`ConfirmDialog`).
  3. Xác nhận chuyển giao thiết bị sang bảo trì M27 EAM (`ConfirmDialog`).
  - **Tuyệt đối không sử dụng `window.alert()` hoặc `window.confirm()`.**

---

## 5. BẢNG MÀU CHUẨN DOANH NGHIỆP M41

- **Primary Colors:** `bg-blue-600`, `text-blue-600`, `border-blue-500`, `focus:ring-blue-500`.
- **Hoàn toàn loại bỏ mọi class màu `indigo`.**
- **Đạt tỷ lệ tương phản chuẩn WCAG AA (≥ 4.5:1)** và hỗ trợ Dark Mode đồng bộ.
