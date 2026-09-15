# M39 FEATURE BASELINE BEFORE SYNC
## PHÂN TÍCH HIỆN TRẠNG & ĐÁNH GIÁ NỀN TẢNG (PHASE 0 INVENTORY)

**Document Reference:** `/docs/design-specs/M39_FEATURE_BASELINE_BEFORE_SYNC.md`  
**Target Module:** `M39` — Quality Control & QMS Workspace (Quản lý Chất lượng & Cổng KCS)  
**File Hiện Tại:** `/src/components/workspaces/M39QualityControlWorkspace.tsx`  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Module Replication Protocol)  
**Mục tiêu:** Ghi nhận toàn bộ tính năng, API, state và hiện trạng UI trước khi thực hiện đồng bộ hóa toàn diện từ M41 Master Spec.

---

## 1. TỔNG QUAN HIỆN TRẠNG PHÂN HỆ M39

Phân hệ M39 chịu trách nhiệm kiểm soát chất lượng toàn diện (QMS), thẩm định đầu vào IQC (Inbound PO GRN), kiểm định trong quá trình sản xuất IPQC (MES Work Order), thẩm định đầu ra OQC (Finished Goods), kiểm soát tồn kho cách ly (Quarantine Gate theo Rule #03) và lập biên bản xử lý sự không phù hợp (NCR/CAPA).

### 1.1 Danh mục Tab chức năng hiện hữu:
1. `quarantine_gate`: Cổng KCS & Tồn Cách Ly (Quarantine Gate - Rule #03 Inventory Single Writer Gate).
2. `inspections`: Nhật ký Thanh tra & Kiểm định (Inspections Audit Log).
3. `ncrs`: Báo cáo không phù hợp (Non-Conformance Reports - NCR).
4. `analytics`: Phân tích Xu hướng & Thống kê Chất lượng (Quality Analytics).

### 1.2 Danh mục API Endpoints trong hệ thống:
- `GET /api/quality/inspections`: Lấy danh sách phiếu kiểm định chất lượng từ database hoặc fallback.
- `GET /api/quality/ncrs`: Lấy danh sách báo cáo không phù hợp từ database hoặc fallback.
- *Hiện trạng:* Component trước đây chưa gọi fetch API từ máy chủ mà sử dụng trực tiếp mock state tại chỗ. Cần tích hợp đồng bộ dữ liệu với `/api/quality/inspections` và `/api/quality/ncrs`.

### 1.3 Tương tác Context Rail & Enterprise Data Graph:
- Nhận prop `onSelectEntity` nhưng chưa kích hoạt khi người dùng click vào lô hàng cách ly, phiếu thanh tra hoặc biên bản NCR.
- Cần bổ sung logic gọi `onSelectEntity` với thực thể `QUALITY_INSPECTION` và `QUALITY_NCR`, kèm cây quan hệ `lineage` (Lô hàng nguồn PO/WO, Phiếu kiểm tra KCS, Biên bản NCR/CAPA), `auditTrail` và hạch toán biến động chi phí phế phẩm/rework vào sổ cái (`glEntries`).

---

## 2. KHIẾM KHUYẾT UI/UX SO VỚI M41 MASTER SPEC

1. **Bảng màu vi phạm chuẩn:**
   - Sử dụng màu tím/chàm `indigo-50`, `indigo-600`, `indigo-700` thay vì bảng màu chuẩn **M41 Blue Primary Palette** (`bg-blue-600`, `text-blue-600`, `border-blue-500`, `focus:ring-blue-500`).

2. **Thiếu Tầng L0 (Workspace Banner):**
   - Header dạng phẳng truyền thống `bg-white border-b`, thiếu banner gradient tối sang trọng (`from-slate-900 to-[#1e293b]`).
   - Thiếu chip định danh phân hệ `M39 • QUALITY CONTROL & QMS`.
   - Thiếu badge chứng nhận tuân thủ `Rule #19 & #20 Confirmed`.
   - Thiếu realtime metric badge (ví dụ: `Pass Rate: 98.4% (QMS Certified)`).
   - Thiếu các nút tác vụ nhanh: Xuất Báo cáo KCS (CSV), Đồng bộ dữ liệu, và Tạo phiếu QA mới.
   - Chưa có `DeepLinkBanner` liên kết sang M40 (EHS Safety & Environment) và M17 (Inventory Core).

3. **Tầng L1 (Sub-tabs Navigation Bar) chưa chuẩn:**
   - Đang dùng đường gạch chân phẳng (`border-b-2 border-indigo-600`) trên nền trắng phẳng.
   - Chưa có bo góc tròn chuẩn (`rounded-2xl`) và container kính tối giản (`bg-white dark:bg-slate-800 border-slate-200/80`).
   - Chưa áp dụng kiểu nút Tab Active chuẩn M41 (`bg-blue-600 text-white shadow-xs`).

4. **Tầng L2 (KPI Summary Strip) tĩnh, không thích ứng theo Tab:**
   - 4 thẻ KPI hiện tại hiển thị cố định dù chuyển giữa các tab khác nhau.
   - Chưa áp dụng `StatCard` động theo ngữ cảnh của 4 Tab (`quarantine_gate`, `inspections`, `ncrs`, `analytics`).
   - Chưa sử dụng đồng bộ `font-mono tabular-nums` và nullish coalescing `??`.

5. **Tầng L3 (Main Content Views) thiếu tương tác chuyên sâu:**
   - Bảng Cổng KCS và Kiểm định thiếu viền trạng thái `border-l-4` phân cấp mức độ nghiêm trọng/kết quả.
   - Thiếu bộ lọc nâng cao đa chiều cho tab Kiểm định và NCR (Lọc theo Loại kiểm tra IQC/OQC/IPQC, Trạng thái Passed/Failed/Pending, Mức độ nghiêm trọng High/Medium/Low).
   - Thiếu Modal/Drawer xem chi tiết hồ sơ KCS 360° (Inspection 360° Drawer) cho phép xem toàn bộ thông số kỹ thuật dung sai đo đạc, lịch sử audit, và hạch toán kế toán phế phẩm.

6. **Tầng L4 (Sticky Pagination) bị thiếu:**
   - Không có bộ điều khiển phân trang (`PaginationControl`) ở các bảng dữ liệu, dẫn đến danh sách bị kéo dài khi có nhiều hồ sơ.

7. **Chuẩn hóa Rule #19:**
   - Một số text xám chưa đạt tỷ lệ tương phản WCAG AA (≥ 4.5:1).
   - Chưa hỗ trợ đầy đủ các class Dark Mode cho toàn bộ các thành phần.
   - `ConfirmDialog.tsx` cần được áp dụng đồng bộ cho mọi hành động phê duyệt nghiệm thu, lập NCR, và đóng hồ sơ NCR.

---

## 3. DANH MỤC CAM KẾT BẢO TOÀN (ZERO LOGIC LOSS)

1. Giữ nguyên 100% logic Cổng KCS (Quarantine Gate - Rule #03): Phê duyệt chuyển lô hàng sang Available trong M17, Từ chối chuyển sang NCR.
2. Giữ nguyên toàn bộ logic dữ liệu kiểm định IQC/OQC/IPQC và danh mục NCRs.
3. Giữ nguyên tích hợp `useWorkspaceSessionTab('M39', ...)` để ghi nhớ tab hiện tại vào session.
4. Giữ nguyên tích hợp `useWorkspaceAction` đăng ký hành động chính trên thanh Shell toàn cục.
5. Bảo toàn biểu đồ phân tích chất lượng Recharts (BarChart xu hướng 7 ngày, PieChart phân bổ kết quả).
