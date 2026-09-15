# M16 POS RETAIL & COUNTER WORKSPACE
## FULL UI/UX DESIGN SPECIFICATION — SINGLE SOURCE OF TRUTH (PHASE 0, 1 & 2)

**Document Reference:** `/docs/design-specs/M16_FULL_UI_DESIGN_SPEC.md`  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Module Replication Protocol) trong `GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`  
**Master Layout Template:** `/docs/design-specs/M41_MASTER_DESIGN_SPEC.md` (Blue Primary Palette & L0-L4 Design Architecture)  
**Target Module:** `M16` — POS Retail & Cashier Counter (Bán lẻ tại quầy & Quản lý thu ngân)  
**File Component:** `/src/components/workspaces/m16/M16POSWorkspace.tsx`  
**Trạng thái:** 🟢 **HOÀN TẤT ĐỒNG BỘ 100% TIÊU CHUẨN THIẾT KẾ DOANH NGHIỆP TỪ M41 (BLUE PRIMARY)**

---

## 1. MỤC LỤC TỔNG QUAN DANH MỤC TAB M16 (PHASE 0 INVENTORY)

| STT | Mã Tab | Tên Tab Chức Năng | Loại Màn Hình | Vai Trò Chức Năng |
|:---:|:---|:---|:---|:---|
| 1 | `terminal` | **Màn hình Bán hàng POS** | Catalog Split Grid (Lưới Sản phẩm + Giỏ hàng tương tác) | Giao diện thu ngân thời gian thực: Quét/tìm kiếm SKU sản phẩm, chọn danh mục, cộng trừ số lượng, chọn khách hàng tích điểm, chiết khấu, tính thuế VAT 10%, và nút thanh toán nhanh. |
| 2 | `shift` | **Quản lý Ca & Két tiền** | Active Shift Banner + Denominations Reconciliation Table | Quản lý ca trực thu ngân: Mở ca với tiền quỹ đầu ca (Opening Float), theo dõi tiền mặt hệ thống (Expected Cash), kiểm đếm 9 mệnh giá tiền mặt VND, chốt ca tính chênh lệch thừa/thiếu (Variance), và lưu vết lịch sử ca. |
| 3 | `history` | **Lịch sử Giao dịch POS** | Filterable Master Table + Transaction 360° Drawer | Truy vết lịch sử hóa đơn bán lẻ: Tra cứu theo mã đơn/khách hàng/phương thức thanh toán (CASH, CARD, QR), xem chi tiết hóa đơn, định khoản sổ cái kế toán tự động (GL double entries), và gửi lệnh in hóa đơn POS. |

---

## 2. KIẾN TRÚC TOÀN CỤC (GLOBAL SHELL & NAVIGATION)

### 2.1 Cấu trúc bố cục Phân Tầng L0, L1, L2 (Chuẩn M41)

- **Tầng L0 (Workspace Banner):**
  - **Container:** `p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4`.
  - **Icon khối:** `p-2.5 bg-blue-600 text-white rounded-xl shadow-xs`.
  - **Chip phân hệ:** `px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold rounded border border-emerald-400/30`.
  - **Chip tiêu chuẩn:** `px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold flex items-center gap-1.5`.
  - **Chip trạng thái ca trực:**
    - Khi có ca mở: `bg-blue-50 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-700 text-[11px] font-mono font-semibold` với pulse dot xanh lá.
    - Khi chưa mở ca: `bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-700 text-[11px] font-mono font-semibold` với icon Lock.
  - **Tiêu đề H1:** `text-xl font-bold text-white mt-1`.
  - **Mô tả:** `text-xs text-slate-300 mt-2 max-w-2xl`.
  - **Nút hành động nhanh:**
    - Xuất Báo cáo Ca / Doanh thu (CSV): `px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all border border-emerald-500/30 shadow-xs cursor-pointer flex items-center gap-1.5`.
    - Làm mới dữ liệu: `px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer flex items-center gap-1.5`.

- **DeepLink Banner (Liên kết Đơn Hàng M13):**
  - `DeepLinkBanner` tích hợp liên kết sâu M13 Sales Orders (`/sales-orders`) với `variant="blue"`.
  - Giải thích rõ ràng luồng Order-to-Cash và trừ kho tự động tại M17 Inventory Core.

- **Tầng L1 (Sub-tabs Navigation Bar):**
  - **Container:** `bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-2 flex items-center gap-2 overflow-x-auto scrollbar-none`.
  - **Tab Active:** `bg-blue-600 text-white shadow-xs px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer`.
  - **Tab Inactive:** `text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer`.
  - **Badge số lượng:** `px-2 py-0.5 rounded-full text-[10px] font-mono font-bold`.

- **Tầng L2 (KPI Summary Strip):**
  - **Grid 4 cột linh hoạt theo Tab:** `grid grid-cols-2 lg:grid-cols-4 gap-4`.
  - **Khối thẻ KPI (StatCard):**
    - Tab `terminal`: Doanh Thu Bán Lẻ Hôm Nay (VND), Số Đơn Hoàn Tất, Mặt Hàng Trong Giỏ, Tiền Mặt Kỳ Vọng Trong Két.
    - Tab `shift`: Tiền Quỹ Đầu Ca, Tiền Mặt Thực Tế Trong Két, Chênh Lệch Quỹ (Variance), Trạng Thái Ca Trực (OPEN/CLOSED).
    - Tab `history`: Tổng Số Hóa Đơn Bán Lẻ, Doanh Thu Tiền Mặt (CASH), Doanh Thu Thẻ (CARD), Doanh Thu Mã QR (VIETQR).
  - Định dạng số: `font-mono tabular-nums font-bold`.

---

## 3. CHI TIẾT TỪNG TAB GIAO DIỆN

### TAB 1: `terminal` (Màn hình Bán hàng POS)
- **Bố cục:** Chia đôi màn hình (Split Grid) tối ưu cho thu ngân quầy.
  - **Cột trái (Lưới sản phẩm - Product Catalog):**
    - Thanh tìm kiếm: Ô nhập SKU/tên sản phẩm với icon Search, `focus:ring-2 focus:ring-blue-500`.
    - Danh mục phân loại: Pills cuộn ngang (Tất cả, Đồ uống, Đồ ăn, Gia dụng...), pill active mang màu `bg-blue-600 text-white`.
    - Card sản phẩm: Hiển thị tên, SKU font-mono, tồn kho khả dụng badge, đơn giá bán lẻ font-mono bold, hiệu ứng hover nhấc nhẹ (`hover:shadow-md hover:border-blue-400`).
  - **Cột phải (Giỏ hàng & Thu ngân - POS Cart):**
    - Header giỏ: Tiêu đề "Hóa Đơn Hiện Tại", nút "Xóa Hết" kích hoạt `ConfirmDialog` variant `danger`.
    - Chọn khách hàng: Dropdown khách hàng thành viên tích điểm (liên kết M07).
    - Danh sách mục giỏ hàng: Tên, đơn giá, cụm nút tăng giảm số lượng (+ / -), nút xóa item.
    - Tổng hợp tài chính: Tổng tiền hàng, chiết khấu khuyến mãi, thuế VAT 10%, Tổng thanh toán cuối cùng (`cartGrandTotal` lớn, font-mono bold màu `text-blue-600 dark:text-blue-400`).
    - Nút Thanh Toán: `bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer`.

### TAB 2: `shift` (Quản lý Ca & Két tiền)
- **Thẻ trạng thái ca trực hiện tại:**
  - Nút Mở ca mới (`bg-blue-600 hover:bg-blue-700`) hoặc Đóng & Đối soát ca (`bg-rose-600 hover:bg-rose-700`).
  - Lưới thông tin: Tiền quỹ đầu ca, Tiền mặt hệ thống, Thu ngân phụ trách, Mã két tiền / Quầy (Drawer #01).
- **Bảng lịch sử ca & đối soát (Reconciliation Table):**
  - Tìm kiếm mã ca, lọc trạng thái (Tất cả, Đang mở, Đã chốt).
  - Header: `bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold`.
  - Hàng dữ liệu: `hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors border-l-4`.
  - Cột chênh lệch: Âm (màu đỏ `text-rose-600`), Dương (màu xanh lá `text-emerald-600`), Bằng 0 (màu xám).
  - Phân trang: `PaginationControl` chuẩn M41.

### TAB 3: `history` (Lịch sử Giao dịch POS)
- **Bảng danh sách hóa đơn bán lẻ:**
  - Tìm kiếm mã đơn/khách hàng, lọc theo phương thức thanh toán (CASH, CARD, QR).
  - Hàng dữ liệu: `border-l-4 border-blue-500 hover:bg-slate-50/80 dark:hover:bg-slate-700/50`.
  - Mã đơn hàng: `font-mono font-bold text-blue-600 dark:text-blue-400`.
  - Cột tổng tiền thu: `font-mono font-bold text-right tabular-nums text-emerald-600 dark:text-emerald-400`.
  - Nút Xem chi tiết: Icon Eye mở Modal 360° chi tiết đơn và hạch toán kế toán.
  - Phân trang: `PaginationControl` chuẩn M41.

---

## 4. QUY CHUẨN MODALS & DIALOGS (RULE #19 & RULE #20)

1. **Modal Thanh toán Đơn hàng POS (Checkout Modal):**
   - Header: Icon CreditCard xanh dương `text-blue-600 dark:text-blue-400`.
   - Lựa chọn phương thức thanh toán (Tiền mặt, Thẻ ngân hàng, VietQR Code) dạng nút bo tròn lớn.
   - Tích chọn yêu cầu xuất hóa đơn điện tử VAT (e-Invoice) với các trường: Tên công ty, Mã số thuế, Địa chỉ.
   - Nút Xác nhận hoàn tất: `bg-blue-600 hover:bg-blue-700 text-white rounded-xl`.

2. **Modal Mở Ca Làm Việc (Open Shift Modal):**
   - Nhập tiền quỹ đầu ca (Opening Float VND) và chọn mã két/quầy bán hàng.
   - Nút Xác nhận mở ca: `bg-blue-600 hover:bg-blue-700`.

3. **Modal Chốt & Đối Soát Ca (Close Shift Modal):**
   - Bảng kê khai chi tiết 9 mệnh giá tiền mặt VND (500.000đ, 200.000đ, 100.000đ, 50.000đ, 20.000đ, 10.000đ, 5.000đ, 2.000đ, 1.000đ).
   - Tự động cộng tổng tiền mặt thực tế và so sánh chênh lệch tức thời.
   - Nút Chốt ca: `bg-rose-600 hover:bg-rose-700`.

4. **Modal Chi Tiết Hóa Đơn 360° (Transaction Detail Modal):**
   - Thông tin tổng quan: Phương thức, Tổng tiền, Trạng thái thanh toán.
   - Bút toán Định khoản Sổ Cái Kế Toán (GL Double Entry):
     - Nợ TK 1111 (Tiền mặt tại quỹ).
     - Có TK 5111 (Doanh thu bán hàng).
     - Có TK 3331 (Thuế GTGT đầu ra).
   - Nút Gửi lệnh In Hóa Đơn (`window.print()` kèm `onNotify` thông báo).

5. **ConfirmDialog Cho Thao Tác Nhạy Cảm (Rule #19):**
   - Xóa toàn bộ giỏ hàng POS: Dialog cảnh báo `variant: 'danger'`, tiêu đề "Xóa toàn bộ giỏ hàng POS?", không sử dụng native alert hay confirm của trình duyệt.
