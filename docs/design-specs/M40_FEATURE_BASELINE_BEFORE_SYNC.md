# M40 FEATURE BASELINE BEFORE SYNC
## PHÂN TÍCH HIỆN TRẠNG & ĐÁNH GIÁ NỀN TẢNG (PHASE 0 INVENTORY)

**Document Reference:** `/docs/design-specs/M40_FEATURE_BASELINE_BEFORE_SYNC.md`  
**Target Module:** `M40` — EHS Workspace (An Toàn Lao Động & Vệ Sinh Môi Trường)  
**File Hiện Tại:** `/src/components/workspaces/EHSWorkspace.tsx`  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Module Replication Protocol)  
**Mục tiêu:** Ghi nhận toàn bộ tính năng, API, state và hiện trạng UI trước khi thực hiện đồng bộ hóa toàn diện từ M41 Master Spec.

---

## 1. TỔNG QUAN HIỆN TRẠNG PHÂN HỆ M40

Phân hệ M40 chịu trách nhiệm quản trị an toàn lao động, kiểm định thiết bị PCCC và tuân thủ các tiêu chuẩn môi trường quốc tế (ISO 45001:2018 & ISO 14001:2015, TCVN).

### 1.1 Danh mục Tab chức năng hiện hữu:
1. `INCIDENTS`: Nhật ký Sự cố & CAPA (Incident Logs & Corrective Actions).
2. `INSPECTIONS`: Kiểm định An toàn & PCCC (Safety Inspections & Equipment Audits).
3. `CERTS`: Huấn luyện An toàn Lao động & Chứng chỉ (Safety Training & Compliance Certifications).

### 1.2 Danh mục API Endpoints đang kết nối:
- `GET /api/ehs/records`: Lấy danh sách hồ sơ sự cố an toàn.
- `POST /api/ehs/records`: Tạo mới hồ sơ sự cố an toàn và ghi nhận biện pháp CAPA.
- `GET /api/ehs/inspections`: Lấy danh mục các đợt kiểm định an toàn, PCCC, xử lý rác thải.

### 1.3 Tương tác Context Rail & Enterprise Data Graph:
- Gọi `onSelectEntity` với thực thể `EHS_INCIDENT`, kèm cây quan hệ `lineage` (Root Incident, Vị trí hiện trường, Biện pháp CAPA), `auditTrail` và hạch toán kế toán `glEntries` (tài khoản kiểm toán an toàn).
- Gọi `useWorkspaceAction` đăng ký hành động chính trên thanh điều khiển toàn cục (`setPrimaryAction`).

---

## 2. KHIẾM KHUYẾT UI/UX SO VỚI M41 MASTER SPEC

1. **Thiếu Tầng L0 (Workspace Banner):**
   - Chưa có banner gradient tối sang trọng (`from-slate-900 to-[#1e293b]`).
   - Thiếu chip định danh phân hệ `M40 • EHS SAFETY & ENVIRONMENT`.
   - Thiếu badge chứng nhận tuân thủ `Rule #19 & #20 Confirmed`.
   - Thiếu các nút tác vụ xuất báo cáo CSV/Excel và làm mới dữ liệu tại Banner.
   - Chưa có `DeepLinkBanner` liên kết sâu sang M39 (Quality Control & QMS) hoặc M18 (Warehouse Safety).

2. **Tầng L1 (Sub-tabs Navigation Bar) chưa chuẩn:**
   - Dùng thanh tab phẳng đơn giản, màu active đang là `bg-rose-600` thay vì bảng màu chuẩn M41 Blue primary (`bg-blue-600 text-white shadow-xs`).
   - Chưa có bo góc tròn chuẩn (`rounded-2xl`) và container kính tối giản (`bg-white dark:bg-slate-800 border-slate-200/80`).

3. **Tầng L2 (KPI Summary Strip) tĩnh, không thích ứng theo Tab:**
   - 4 thẻ KPI hiện tại hiển thị cố định dù chuyển giữa các tab khác nhau.
   - Chưa áp dụng `StatCard` động theo ngữ cảnh Tab như chuẩn M41.
   - Chưa sử dụng `font-mono tabular-nums` đồng bộ.

4. **Tầng L3 (Main Content Views) thiếu tương tác chuyên sâu:**
   - Bảng danh sách sự cố thiếu viền trạng thái `border-l-4` theo mức độ rủi ro (CRITICAL/HIGH/MEDIUM/LOW).
   - Thiếu bộ lọc đa chiều (Lọc theo Mức độ rủi ro, Trạng thái hồ sơ, Vị trí nhà xưởng).
   - Thiếu Modal xem chi tiết sự cố 360° (Incident Detail Drawer) cho phép xem toàn bộ biên bản hiện trường, cập nhật CAPA và chuyển trạng thái xử lý.
   - Tab Kiểm định (Inspections) chưa hỗ trợ tìm kiếm và lọc kết quả (PASSED/FAILED).
   - Tab Chứng chỉ (Certs) mới chỉ hiển thị 2 thẻ cứng tĩnh, chưa có bảng theo dõi các nhóm huấn luyện ATLĐ theo Nghị định 44/2016/NĐ-CP (Nhóm 1 đến Nhóm 6).

5. **Tầng L4 (Sticky Pagination) bị thiếu:**
   - Không có bộ điều khiển phân trang (`PaginationControl`), dẫn đến bảng dữ liệu bị kéo dài vô tận khi có nhiều bản ghi.

6. **Chưa tuân thủ Rule #19:**
   - Chưa tích hợp `ConfirmDialog.tsx` cho các thao tác nhạy cảm (như đóng hồ sơ sự cố khẩn cấp, giải quyết CAPA).
   - Một số thành phần có màu chữ xám trên nền tối chưa đạt tỷ lệ tương phản WCAG AA (≥ 4.5:1).
   - Chưa hỗ trợ đầy đủ các class Dark Mode cho toàn bộ các thành phần.

---

## 3. DANH MỤC CAM KẾT BẢO TOÀN (ZERO LOGIC LOSS)

1. Giữ nguyên 100% các trường dữ liệu và API endpoints `/api/ehs/records` và `/api/ehs/inspections`.
2. Giữ nguyên toàn bộ logic gọi `onSelectEntity` với đầy đủ `lineage`, `auditTrail`, `glEntries`.
3. Giữ nguyên tích hợp `useWorkspaceSessionTab('M40', ...)` để ghi nhớ tab hiện tại vào session.
4. Giữ nguyên tích hợp `useWorkspaceAction` để kích hoạt nút tác vụ chính từ thanh Shell.
