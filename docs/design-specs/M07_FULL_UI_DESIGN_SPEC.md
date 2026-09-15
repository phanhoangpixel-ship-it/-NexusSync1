# M07 CUSTOMERS & ITEM MASTER WORKSPACE
## FULL UI/UX DESIGN SPECIFICATION — SINGLE SOURCE OF TRUTH (PHASE 0, 1 & 2)

**Document Reference:** `/docs/design-specs/M07_FULL_UI_DESIGN_SPEC.md`  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Module Replication Protocol) trong `GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`  
**Target Module:** `M07` — Customers & Item Master (B2B Commerce & Identity Master SSOT)  
**File Component:** `/src/components/workspaces/M07CustomersItemMasterWorkspace.tsx`  
**Trạng thái:** 🟢 **HOÀN TẤT ĐỒNG BỘ 100% TIÊU CHUẨN THIẾT KẾ DOANH NGHIỆP TỪ M41**

---

## 1. MỤC LỤC TỔNG QUAN DANH MỤC TAB M07 (PHASE 0 INVENTORY)

| STT | Mã Tab | Tên Tab Chức Năng | Loại Màn Hình | Vai Trò Chức Năng |
|:---:|:---|:---|:---|:---|
| 1 | `items` | **Item Master SKU & Kho M17** | Master Table + Search/Filter Bar + Form Khai Báo M17 + Modal Chụp Ảnh/Tải Tệp + Modal Sửa SKU + ConfirmDialog Xóa | Quản lý danh mục hàng hóa chuẩn SSOT của toàn hệ sinh thái ERP, tích hợp thuộc tính kho vận M17 (Kho trực thuộc, Vị trí ô kệ Bin, Số lô Lot, Quy cách, Bảo quản), giá vốn, giá buôn, giá lẻ, tồn kho an toàn và xuất Excel. |
| 2 | `customers` | **Khách Hàng B2B** | Master Table + Form Đăng Ký Đối Tác + Modal Hồ Sơ 360° | Quản lý danh bạ doanh nghiệp đối tác, mã số thuế, hạn mức tín dụng được duyệt, dư nợ hiện tại, phân hạng đối tác (VIP Gold, Strategic, Standard) và xem Hồ sơ 360°. |
| 3 | `credit` | **Hạn Mức Tín Dụng & Công Nợ** | Risk Policy Dashboard Card + Visual Shield Alert | Cơ chế kiểm soát rủi ro tín dụng B2B: Tự động khóa đơn hàng xuất bán (Block O2C Orders) khi dư nợ thực tế vượt quá 90% hạn mức được phê duyệt bởi phòng Tài chính - Kế toán. |
| 4 | `pricing` | **Bảng Giá B2B (Tier Pricing)** | Tier Pricing Policy Cards Grid | Phân tầng chính sách giá bán sỉ: Tier 1 Strategic Partners (-18%), Tier 2 VIP Gold Accounts (-12%), Tier 3 Standard B2B (Giá chuẩn theo SKU). |
| 5 | `identity-matrix` | **Identity Matrix (SSOT)** | Multi-Module Identity Integrity Matrix | Ma trận xác thực tính toàn vẹn và đồng nhất mã định danh sản phẩm đa phân hệ: M07 (Item Master) = M41 (Pricing) = M17 (Inventory) = M13 (Sales) = M08 (Purchase). |

---

## 2. KIẾN TRÚC TOÀN CỤC (GLOBAL SHELL & NAVIGATION)

### 2.1 Cấu trúc bố cục Phân Tầng L0, L1, L2 (Chuẩn M41)

- **Tầng L0 (Workspace Banner):**
  - **Container:** `p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4`.
  - **Icon khối:** `p-2.5 bg-blue-600 text-white rounded-xl shadow-xs`.
  - **Chip phân hệ:** `px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold rounded border border-emerald-400/30`.
  - **Chip tiêu chuẩn:** `px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold flex items-center gap-1`.
  - **Tiêu đề H1:** `text-xl font-bold text-white mt-1`.
  - **Mô tả:** `text-xs text-slate-300 mt-2 max-w-2xl`.
  - **Nút hành động nhanh:**
    - Xuất Excel: `flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all border border-emerald-500/30 shadow-xs cursor-pointer`.
    - Làm mới / Đồng bộ: `flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer`.

- **Tầng L1 (Sub-tabs Navigation Bar):**
  - **Container:** `bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-2 flex items-center gap-2 overflow-x-auto scrollbar-none`.
  - **Tab Active:** `px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer bg-blue-600 text-white shadow-xs`.
  - **Tab Inactive:** `px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60`.
  - **Badge số lượng:** `px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300`.

- **Tầng L2 (KPI Summary Strip):**
  - **Grid 4 cột:** `grid grid-cols-2 lg:grid-cols-4 gap-4`.
  - **Khối thẻ KPI:** `bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs`.
  - **Nhãn chỉ số:** `text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-bold uppercase tracking-wider`.
  - **Giá trị chỉ số:** `text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1`.
  - **Chú thích phụ:** `text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1`.

---

## 3. CHI TIẾT TỪNG TAB GIAO DIỆN

### TAB 1: `items` (Item Master SKU & Kho M17)
- **Tầng L1 (Filter & Command Bar):**
  - Ô tìm kiếm: `flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20`.
  - Dropdown phân loại: `px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold`.
  - Nút chuyển chế độ xem (Bảng / Lưới): `px-2.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold`.
- **Bảng Master Data:**
  - Header bảng: `bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider`.
  - Hàng dữ liệu: `hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150`.
  - Mã SKU badge: `font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600`.
  - Cột đơn giá: `font-mono tabular-nums text-right font-bold`.
  - Cảnh báo tồn thấp: `(it.stock || 0) <= 15` có viền trái nổi bật và nhãn cảnh báo.
  - Thao tác: Nút Chỉnh sửa (xanh lá nhạt), Nút Xóa (đỏ nhạt, mở `ConfirmDialog`).
- **Form Khai Báo SKU:**
  - Card bao bọc: `p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4`.
  - Input fields: `focus:ring-2 focus:ring-blue-500/20`.
  - Nút Tải tệp & Chụp ảnh: `bg-emerald-50 dark:bg-emerald-950/80` và `bg-blue-50 dark:bg-blue-950/80`.
  - Nút Submit: `bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm`.

### TAB 2: `customers` (Khách Hàng B2B)
- **Danh sách đối tác B2B:**
  - Container: `bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden`.
  - Header: `bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider`.
  - Hàng dữ liệu: `hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150`.
  - Hạn mức & Dư nợ: `font-mono tabular-nums text-right font-bold`.
  - Nút Hồ Sơ 360°: `bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white rounded-lg shadow-2xs`.
- **Form Đăng Ký Khách Hàng B2B:**
  - Container: `p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4`.
  - Nút Submit: `bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm`.

### TAB 3: `credit` (Hạn Mức Tín Dụng & Công Nợ)
- Container: `p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4`.
- Alert Box: `p-5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2 shadow-xs`.
- Tiêu chuẩn SoD: Bảo đảm phân quyền độc quyền thẩm định tín dụng thuộc phòng Tài chính - Kế toán.

### TAB 4: `pricing` (Bảng Giá B2B - Tier Pricing)
- Container: `p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4`.
- Grid 3 thẻ chính sách giá: `grid grid-cols-1 md:grid-cols-3 gap-5`.
- Thẻ Tier 1, 2, 3: `p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2`.

### TAB 5: `identity-matrix` (Identity Matrix SSOT)
- Container: `p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-5`.
- Badge SSOT: `px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300`.
- Bảng đối soát 5 phân hệ: `M07 (Master) = M41 (Pricing) = M17 (Inventory) = M13 (Sales) = M08 (Purchase)`.
- Trạng thái khớp: Badge `bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-mono font-bold`.

---

## 4. QUẢN TRỊ MODALS & DIALOGS (RULE #19)

1. **`ConfirmDialog.tsx` (Xác nhận xóa SKU):**
   - Loại modal: `variant="danger"`.
   - Tiêu đề: "Xác Nhận Xóa Mặt Hàng SKU".
   - Cảnh báo: Gỡ bỏ vĩnh viễn khỏi toàn hệ thống ERP NexusSync và mất liên kết dữ liệu kho M17.
2. **`Customer 360 Modal`:**
   - Container: `bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden`.
   - Header: Gradient `from-slate-900 to-[#1e293b]`.
   - Hiển thị: Hạn mức tín dụng, dư nợ hiện tại và thông báo đồng bộ phả hệ tài khoản ERP.
3. **`Camera Modal`:**
   - Container: `bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden`.
   - Khối xem video: `aspect-video rounded-xl overflow-hidden bg-black`.
4. **`Edit Item Modal`:**
   - Container: `bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden`.
   - Inputs: `focus:ring-2 focus:ring-blue-500/20`.
   - Nút Lưu: `bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold`.

---

## 5. BẢO TOÀN KIẾN TRÚC & QUYỀN HẠN (SINGLE WRITER AUTHORITY)
- **Item Identity Master Authority:** M07 là phân hệ duy nhất có thẩm quyền cấp phát mã SKU gốc (PRD-xxx). Các phân hệ M41, M17, M13, M08 bắt buộc phải tham chiếu mã SKU từ M07.
- **Inventory Integration:** M07 lưu trữ các thuộc tính định danh vật lý (Kho, Vị trí Bin, Số lô, Quy cách đóng gói) và liên thông đồng bộ sang phân hệ Kho M17.
- **Credit Authority:** M07 hiển thị chính sách và thông số công nợ, đảm bảo tuân thủ phân định thẩm quyền của phòng Kế toán.
