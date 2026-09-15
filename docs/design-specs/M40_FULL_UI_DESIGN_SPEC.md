# M40 EHS SAFETY & ENVIRONMENT WORKSPACE
## FULL UI/UX DESIGN SPECIFICATION — SINGLE SOURCE OF TRUTH (PHASE 0, 1 & 2)

**Document Reference:** `/docs/design-specs/M40_FULL_UI_DESIGN_SPEC.md`  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Module Replication Protocol) trong `GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`  
**Master Layout Template:** `/docs/design-specs/M41_MASTER_DESIGN_SPEC.md` (Blue Primary Palette & L0-L4 Design Architecture)  
**Target Module:** `M40` — EHS Workspace (An Toàn Lao Động & Vệ Sinh Môi Trường)  
**File Component:** `/src/components/workspaces/EHSWorkspace.tsx`  
**Trạng thái:** 🟢 **CHUẨN BỊ ĐỒNG BỘ 100% TIÊU CHUẨN THIẾT KẾ DOANH NGHIỆP TỪ M41 (BLUE PRIMARY)**

---

## 1. MỤC LỤC TỔNG QUAN DANH MỤC TAB M40 (PHASE 0 INVENTORY)

| STT | Mã Tab | Tên Tab Chức Năng | Loại Màn Hình | Vai Trò Chức Năng |
|:---:|:---|:---|:---|:---|
| 1 | `INCIDENTS` | **Nhật ký Sự cố & CAPA** | Filterable Master Table + Incident 360° Drawer | Ghi nhận và theo dõi xử lý các sự cố an toàn, rủi ro tràn đổ hóa chất/môi trường, suýt xảy ra sự cố (Near-miss), biện pháp khắc phục CAPA, và mức độ rủi ro hiện trường. |
| 2 | `INSPECTIONS` | **Kiểm định An toàn & PCCC** | Master Audit Table + Filter Bar | Quản lý lịch kiểm định định kỳ các hệ thống báo cháy, bình cứu hỏa, thiết bị áp lực, xử lý rác thải nguy hại, và đánh giá tỷ lệ đạt chuẩn tiêu chí kỹ thuật. |
| 3 | `CERTS` | **Huấn luyện ATLĐ & Chứng chỉ** | Enterprise Training Matrix & Cert Cards | Theo dõi đào tạo an toàn vệ sinh lao động 6 nhóm theo Nghị định 44/2016/NĐ-CP, hồ sơ cấp thẻ an toàn, và hạn hiệu lực các chứng chỉ quản lý chất lượng ISO 45001 / ISO 14001. |
| 4 | `CHECKLISTS` | **Quy trình Khẩn cấp & ISO Audit** | SOP Protocol Cards + Compliance Audit Grid | Bộ quy trình ứng phó tình huống khẩn cấp (SOP sự cố hóa chất, cháy nổ, sơ cấp cứu), ma trận đánh giá rủi ro công việc (JRA/JSA) và kiểm toán tuân thủ nội bộ. |

---

## 2. KIẾN TRÚC TOÀN CỤC (GLOBAL SHELL & NAVIGATION)

### 2.1 Cấu trúc bố cục Phân Tầng L0, L1, L2 (Chuẩn M41)

- **Tầng L0 (Workspace Banner):**
  - **Container:** `p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4`.
  - **Icon khối:** `p-2.5 bg-blue-600 text-white rounded-xl shadow-xs`.
  - **Chip phân hệ:** `px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold rounded border border-emerald-400/30`.
  - **Chip tiêu chuẩn:** `px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold flex items-center gap-1.5`.
  - **Chip an toàn ISO:** `px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-700 text-[11px] font-mono font-semibold flex items-center gap-1.5`.
  - **Tiêu đề H1:** `text-xl font-bold text-white mt-1`.
  - **Mô tả:** `text-xs text-slate-300 mt-2 max-w-2xl`.
  - **Nút hành động nhanh:**
    - Xuất Báo cáo EHS (CSV): `px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all border border-emerald-500/30 shadow-xs cursor-pointer flex items-center gap-1.5`.
    - Báo cáo sự cố mới: `px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all border border-blue-500/30 shadow-xs cursor-pointer flex items-center gap-1.5`.
    - Làm mới dữ liệu: `px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer flex items-center gap-1.5`.

- **DeepLink Banner (Liên kết Phân hệ Liên quan):**
  - `DeepLinkBanner` liên kết sâu sang **M39 Quality Control & QMS** (`/quality-control`) với `variant="blue"`.
  - Giải thích mối liên kết khép kín giữa hành động khắc phục CAPA An toàn Lao động (EHS) với Hệ thống Quản trị Chất lượng Toàn diện (QMS ISO 9001/45001).

- **Tầng L1 (Sub-tabs Navigation Bar):**
  - **Container:** `bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-2 flex items-center gap-2 overflow-x-auto scrollbar-none`.
  - **Tab Active:** `bg-blue-600 text-white shadow-xs px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer`.
  - **Tab Inactive:** `text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer`.
  - **Badge số lượng:** `px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300`.

- **Tầng L2 (KPI Summary Strip):**
  - **Grid 4 cột linh hoạt theo từng Tab:** `grid grid-cols-2 lg:grid-cols-4 gap-4`.
  - **Khối thẻ KPI (StatCard):**
    - Tab `INCIDENTS`: Ngày An Toàn Liên Tục (LTI-Free Days), Sự Cố Đang Xử Lý, Tỷ Lệ Đóng CAPA (%), Mức Rủi Ro Cao/Nghiêm Trọng.
    - Tab `INSPECTIONS`: Tổng Đợt Kiểm Định, Hạng Mục Đạt Chuẩn (%), Thiết Bị PCCC Sẵn Sàng, Đợt Cần Khắc Phục Ngay.
    - Tab `CERTS`: Tỷ Lệ Hoàn Thành Huấn Luyện (%), Kỹ Sư Đã Cấp Thẻ ATLĐ, Chứng Nhận ISO Có Hiệu Lực, Thẻ Sắp Hết Hạn.
    - Tab `CHECKLISTS`: Tiêu Chí ISO 45001 Đạt, Tiêu Chí ISO 14001 Đạt, Kế Hoạch Diễn Tập PCCC, Đánh Giá Rủi Ro JRA Hoàn Tất.
  - Định dạng số: `font-mono tabular-nums font-bold`.

---

## 3. CHI TIẾT TỪNG TAB GIAO DIỆN

### TAB 1: `INCIDENTS` (Nhật ký Sự cố & CAPA)
- **Thanh tìm kiếm & lọc:** Ô nhập tìm kiếm (Mã sự cố, tiêu đề, vị trí, người báo cáo), dropdown lọc mức độ rủi ro (Tất cả, Critical, High, Medium, Low), dropdown lọc trạng thái (Tất cả, Đang điều tra, Đang xử lý, Đã giải quyết, Đã đóng hồ sơ).
- **Bảng danh sách sự cố:**
  - Viền trạng thái bên trái `border-l-4` theo mức độ rủi ro:
    - CRITICAL / HIGH: `border-l-rose-500`
    - MEDIUM: `border-l-amber-500`
    - LOW: `border-l-emerald-500`
  - Mã sự cố: `font-mono font-bold text-blue-600 dark:text-blue-400`.
  - Tiêu đề & người báo cáo: Hiển thị rõ ràng kèm vị trí hiện trường có icon MapPin.
  - Cột Biện pháp khắc phục CAPA: Tóm tắt biện pháp xử lý.
  - Trạng thái: Badge màu sắc đạt chuẩn WCAG AA.
  - Thao tác: Nút "Hồ sơ 360°" mở Drawer chi tiết sự cố, nút "Cập nhật CAPA" nhanh.
- **Tầng L4:** `PaginationControl` chuẩn M41.

### TAB 2: `INSPECTIONS` (Kiểm định An toàn & PCCC)
- **Thanh tìm kiếm & lọc:** Tìm theo mã đợt kiểm tra, vị trí cơ sở; lọc phân loại (PCCC, Môi trường rác thải, Thiết bị áp lực, Điện công nghiệp).
- **Bảng danh sách kiểm định:**
  - Viền trạng thái `border-l-4` (Xanh lá nếu Đạt chuẩn PASSED, Đỏ nếu Cần khắc phục FAILED).
  - Cột Hạng mục đạt chuẩn: `font-mono tabular-nums font-bold text-emerald-600`.
  - Cột Kết quả đánh giá: Badge rõ ràng, không gây nhầm lẫn.
- **Tầng L4:** `PaginationControl` chuẩn M41.

### TAB 3: `CERTS` (Huấn luyện ATLĐ & Chứng chỉ ISO)
- **Thẻ chứng nhận ISO quốc tế:**
  - Chứng nhận ISO 45001:2018 (An toàn và Sức khỏe Nghề nghiệp) — Đơn vị đánh giá SGS International, hiệu lực 15/12/2027.
  - Chứng nhận ISO 14001:2015 (Hệ thống Quản lý Môi trường) — Đơn vị đánh giá TÜV Rheinland, hiệu lực 20/06/2028.
- **Ma trận 6 Nhóm Huấn Luyện ATLĐ (Nghị định 44/2016/NĐ-CP):**
  - Nhóm 1: Người làm công tác quản lý (100% hoàn thành).
  - Nhóm 2: Người làm công tác an toàn, vệ sinh lao động chuyên trách (100% hoàn thành).
  - Nhóm 3: Người làm công việc có yêu cầu nghiêm ngặt về ATLĐ - Thao tác máy hàn, CNC, thiết bị nâng (98% hoàn thành, 142/145 nhân sự).
  - Nhóm 4: Người lao động không thuộc các nhóm 1, 2, 3, 5 (100% hoàn thành).
  - Nhóm 5: Người làm công tác y tế (100% hoàn thành).
  - Nhóm 6: An toàn, vệ sinh viên tại các phân xưởng (100% hoàn thành).
- **Bảng theo dõi danh sách thẻ an toàn sắp hết hạn:** Cảnh báo các thẻ ATLĐ cần tái đào tạo trong 30 ngày.

### TAB 4: `CHECKLISTS` (Quy trình Khẩn cấp & ISO Audit)
- **Danh mục Quy trình Ứng phó Tình huống Khẩn cấp (Emergency SOPs):**
  - SOP-EHS-01: Ứng phó sự cố rò rỉ / tràn đổ hóa chất độc hại.
  - SOP-EHS-02: Báo động và sơ tán khẩn cấp khi có hỏa hoạn PCCC.
  - SOP-EHS-03: Sơ cấp cứu tai nạn điện giật và chấn thương cơ học.
- **Bộ tiêu chí Kiểm toán Tuân thủ Nội bộ (ISO 45001/14001 Audit Checklist):** Tỷ lệ tuân thủ, số điểm kiểm tra đạt, số khuyến nghị cần cải tiến.

---

## 4. QUY CHUẨN MODALS & CONFIRM DIALOG (RULE #19)

1. **Modal Báo Cáo Sự Cố Mới (Create Incident Modal):**
   - Header: Gradient Slate + Icon Blue-600.
   - Các trường: Tiêu đề sự cố, phân loại (Mối nguy an toàn, Suýt xảy ra sự cố, Sự cố tràn đổ, Sơ cấp cứu), mức độ nghiêm trọng (Low, Medium, High, Critical), vị trí xảy ra sự cố, biện pháp khắc phục CAPA ban đầu, hình ảnh hiện trường đính kèm.
   - Nút Submit: `bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold`.

2. **Modal Xem Chi Tiết Sự Cố 360° (Incident Detail 360° Drawer/Modal):**
   - Xem toàn bộ thông tin sự cố, người báo cáo, thời gian, vị trí.
   - Timeline tiến trình điều tra và thực hiện hành động khắc phục CAPA.
   - Bút toán kế toán chi phí an toàn & kiểm toán (GL Entry liên quan).
   - Nút hành động: "Giải quyết sự cố" và "Đóng hồ sơ sự cố" (kích hoạt ConfirmDialog).

3. **ConfirmDialog Cho Thao Tác Nhạy Cảm (Rule #19):**
   - Đóng hồ sơ sự cố an toàn / Xác nhận hoàn tất khắc phục CAPA: `ConfirmDialog` variant `warning` hoặc `info`.
   - Xóa bỏ hoặc hủy bỏ báo cáo đang soạn: `ConfirmDialog` variant `danger`.
   - 100% không dùng `alert()` hoặc `confirm()` mặc định của trình duyệt.
