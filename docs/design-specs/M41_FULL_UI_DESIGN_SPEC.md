# M41 PRODUCT PRICING & PRICE MANAGEMENT WORKSPACE
## FULL UI/UX DESIGN SPECIFICATION — SINGLE SOURCE OF TRUTH (PHASE 0, 1 & 2)

**Document Reference:** `/docs/design-specs/M41_FULL_UI_DESIGN_SPEC.md`  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Module Replication Protocol) trong `GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`  
**Tác giả:** Chuyên viên Lập trình Frontend & Kiến trúc sư ERP — NexusSync ERP Team  
**Mục tiêu:** Cung cấp tài liệu nguồn chân lý thiết kế chi tiết 100% được trích xuất từ mã nguồn thực tế của Phân hệ M41 (Product Pricing & Price Management) bao gồm toàn bộ 10 tab nghiệp vụ và 3 modal hành vi, bảo đảm tuân thủ nghiêm ngặt nguyên tắc Single-Writer Authority và bộ chuẩn thiết kế doanh nghiệp.

---

## MỤC LỤC TỔNG QUAN DANH MỤC TAB M41 (PHASE 0 INVENTORY)

| STT | Mã Tab | Tên Tab Chức Năng | File Component Tương Ứng | Loại Màn Hình | Vai Trò Chức Năng |
|:---:|:---|:---|:---|:---|:---|
| 1 | `product_prices` | **Bảng Giá SKU** | `/src/components/workspaces/pricing/ProductPricesTab.tsx` | Master/List View dạng bảng + Search/Filter Bar + Phân trang + Modal Override | Quản lý danh mục giá bán cho từng sản phẩm/SKU theo bảng giá, hiển thị giá vốn Costing, tỷ lệ Markup, biên lợi nhuận (Margin), cảnh báo vi phạm biên an toàn, ghi đè thủ công (Manual Override). |
| 2 | `price_lists` | **Danh Mục Bảng Giá** | `/src/components/workspaces/pricing/PriceListsTab.tsx` | Analytical Grid Cards + Modal Tạo Bảng Giá | Định nghĩa và quản lý các chính sách bảng giá cấp doanh nghiệp (Bán lẻ tiêu chuẩn, Đại lý, Bán buôn, Dự án VIP), thứ tự ưu tiên (Priority), tiền tệ và thời hạn hiệu lực. |
| 3 | `pricing_rules` | **Quy Tắc Markup / Margin** | `/src/components/workspaces/pricing/PricingRulesTab.tsx` | Rule Matrix Grid + Modal Cấu Hình Quy Tắc | Thiết lập công thức định giá tự động theo danh mục hàng hóa (Cost-plus Markup hoặc Target Margin), chế độ làm tròn số (Rounding Mode), tự động đồng bộ giá bán khi giá vốn thay đổi. |
| 4 | `customer_pricing` | **Hợp Đồng Khách Hàng** | `/src/components/workspaces/pricing/CustomerPricingTab.tsx` | Contract Master Grid + Modal Gán Giá Riêng | Quản lý thỏa thuận giá đặc biệt cho từng khách hàng cụ thể hoặc nhóm khách hàng chiến lược, chiết khấu phần trăm theo hợp đồng thương mại (Bậc 1 trong Waterflow). |
| 5 | `quantity_pricing` | **Bậc Thang Số Lượng** | `/src/components/workspaces/pricing/QuantityPricingTab.tsx` | Volume Break Matrix + Modal Thêm Bậc Thang | Biểu giá chiết khấu lũy tiến theo khối lượng mua hàng (Quantity Breaks/Volume Tiers: 1-9, 10-49, 50-99, 100+), khuyến khích khách hàng mua số lượng lớn (Bậc 3 trong Waterfall). |
| 6 | `promotions` | **Khuyến Mãi Có Hạn** | `/src/components/workspaces/pricing/PromotionsTab.tsx` | Campaign Cards Grid + Modal Tạo Chiến Dịch | Chiến dịch xúc tiến bán hàng có giới hạn thời gian (Back to School, Flash Sale), bảo toàn giá chuẩn, cơ chế tự động hoàn nguyên (Auto-Revert) sau ngày hết hạn. |
| 7 | `bulk_pricing` | **Tính Giá Hàng Loạt** | `/src/components/workspaces/pricing/BulkPricingTab.tsx` | Batch Processing Grid + Live Calculation Engine + ConfirmDialog | Công cụ tính toán và điều chỉnh giá hàng loạt cho nhiều SKU cùng lúc dựa trên Cost Basis, hỗ trợ gán nhanh tỷ lệ ±5%, kiểm tra biên an toàn và đẩy vào hàng đợi duyệt Maker-Checker. |
| 8 | `approvals` | **Phê Duyệt (Maker-Checker)** | `/src/components/workspaces/pricing/PriceApprovalTab.tsx` | Segregation of Duties (SoD) Workflow Queue + Modal Từ Chối | Hàng đợi xét duyệt giá 4 mắt: Chuyên viên kinh doanh/Pricing Specialist (Maker) lập đề xuất, Giám đốc Tài chính CFO (Checker) xét duyệt hoặc từ chối kèm lý do khi biên lợi nhuận thấp. |
| 9 | `history_audit` | **Lịch Sử & Audit Log** | `/src/components/workspaces/pricing/PriceHistoryTab.tsx` | Immutable Audit Ledger Grid | Nhật ký kiểm toán bất biến theo thời gian thực ghi lại toàn bộ vết thay đổi giá (Giá cũ, Giá mới, Ngày hiệu lực, Quy tắc áp dụng, Người tạo, Người duyệt, Lý do điều chỉnh). |
| 10 | `simulator` | **Dò Giá Waterfall** | `/src/components/workspaces/pricing/PricingAuditAndSimulatorTab.tsx` | Authoritative 6-Step Waterfall Simulator & Live Trace Log | Động cơ dò tìm và phân giải giá chính thức 6 bậc (Hợp đồng riêng → Nhóm khách hàng → Bậc số lượng → Khuyến mãi → Quy tắc danh mục → Giá niêm yết chuẩn), hiển thị trực quan bước thắng (Winner). |

---

## 0. KIẾN TRÚC TOÀN CỤC (GLOBAL SHELL & NAVIGATION)

### 0.1 Cấu trúc bố cục Phân Tầng L0, L1, L2
- **Tầng L0 (Workspace Banner):**
  - Container: `p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e293b] text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4`.
  - Icon khối: `p-2.5 bg-blue-600 text-white rounded-xl shadow-xs`.
  - Chip phân hệ: `px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold rounded border border-emerald-400/30`.
  - Chip xác nhận tiêu chuẩn: `px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold flex items-center gap-1`.
  - Tiêu đề H1: `text-xl font-bold text-white mt-1`.
  - Đoạn mô tả: `text-xs text-slate-300 mt-2 max-w-2xl`.
  - Quick Action Buttons:
    - Nút Nhận Phiếu Nhập Kho: `flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer`.
    - Nút Tra Cứu Giá Waterfall: `flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer`.

- **Tầng L2 (KPI Summary Strip):**
  - Grid 4 cột: `grid grid-cols-2 lg:grid-cols-4 gap-4`.
  - Khối thẻ KPI: `bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs`.
  - Nhãn tiêu đề: `text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-bold uppercase tracking-wider`.
  - Số liệu chỉ số: `text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1`.
  - Chú thích phụ: `text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1`.

- **Tầng L1 (Sub-tabs Navigation Bar):**
  - Container: `bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-2 flex items-center gap-2 overflow-x-auto scrollbar-none`.
  - Tab Active: `px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer bg-blue-600 text-white shadow-xs`.
  - Tab Inactive: `px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60`.
  - Tab Maker-Checker Badge: `px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white`.

---

## TAB 1 — BẢNG GIÁ SKU (PRODUCT PRICES TAB)

### 1.1 Cấu trúc bố cục (Layout Architecture)
- **Tầng L1 (Filter & Command Bar):**
  - Thanh công cụ điều khiển: `flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm`.
  - Ô tìm kiếm: `relative flex-1 max-w-sm` với icon `Search` `w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2`.
  - Dropdown lọc danh mục: `border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20`.
  - Nút "+ Khai Báo Sản Phẩm & Giá Mới": `flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs shrink-0 cursor-pointer`.
- **Tầng L3 (Master Data Table):**
  - Khung bao: `bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden`.
  - Thead: `bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider`.
  - Row Hover: `hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150`.
- **Tầng L4 (Pagination):**
  - Tích hợp `Pagination` component chuẩn enterprise ở chân bảng với phân trang 10/20/50 dòng.

### 1.2 Typography
- Tiêu đề sản phẩm: `font-semibold text-slate-900 dark:text-white`.
- Mã SKU: `font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600`.
- Danh mục chip: `text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-medium`.
- ĐVT & UOM conversion: `text-[11px] px-1.5 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 font-medium rounded border border-purple-200 dark:border-purple-700`.
- Số liệu giá bán & giá vốn: `font-mono tabular-nums font-bold`.

### 1.3 Định dạng số liệu & tiền tệ
- Hàm định dạng: `formatVND(value)` sử dụng `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`.
- Dấu phân cách hàng nghìn: Dấu chấm `.` chuẩn Việt Nam.
- Đơn vị: Ký hiệu `₫` đặt phía sau số.
- Căn lề số liệu: 100% cột Giá Vốn, Giá Bán, Biên LN căn phải `text-right` với `font-mono tabular-nums`.

### 1.4 Status Color Tokens (WCAG AA)
- Giá Bán Niêm Yết: `text-indigo-700 dark:text-indigo-300 font-mono tabular-nums font-bold text-sm text-right`.
- Biên lợi nhuận an toàn ($\ge 15\%$): `bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-mono tabular-nums font-bold px-2 py-0.5 rounded text-xs border`.
- Biên lợi nhuận vi phạm sàn ($< 15\%$): `bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-mono tabular-nums font-bold px-2 py-0.5 rounded text-xs border`.
- Trạng thái `ACTIVE`: `px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 text-xs font-bold rounded-full`.
- Badge `Manual Override`: `text-[11px] px-2 py-0.5 bg-amber-100 text-amber-950 dark:bg-amber-950/90 dark:text-amber-200 rounded font-bold border border-amber-300 dark:border-amber-700`.

### 1.5 Component & Interaction chi tiết
- Nút Override: Mở modal `ManualOverrideModal` cho phép ghi đè giá bán có kiểm soát kèm lý do và người phê duyệt.
- Nút Chi Tiết: Kích hoạt `onSelectProductForDeepDive` điều hướng nhanh sang Simulator để kiểm tra luồng phân giải Waterfall.

### 1.6 System States
- Empty state: Khi bộ lọc không có dữ liệu, hiển thị hàng `Không tìm thấy sản phẩm nào phù hợp` căn giữa.
- Phân trang: Điều khiển trang trước/sau, hiển thị `X - Y trong tổng số Z bản ghi`.

### 1.7 Bằng chứng trích xuất từ mã nguồn
```tsx
<tr key={item.id} className="hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150">
  <td className="py-3.5 px-4">
    <div className="font-semibold text-slate-900 dark:text-white">{item.productName}</div>
    <div className="flex items-center gap-2 mt-0.5">
      <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">{item.sku}</span>
      <span className="text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-medium">{item.category}</span>
    </div>
  </td>
  <td className="py-3.5 px-3 font-mono tabular-nums font-bold text-right text-slate-600 dark:text-slate-300 text-xs">{formatVND(item.costBasis)}</td>
  <td className="py-3.5 px-3 font-mono tabular-nums font-bold text-right text-indigo-700 dark:text-indigo-300 text-sm">{formatVND(item.finalPrice)}</td>
</tr>
```

---

## TAB 2 — DANH MỤC BẢNG GIÁ (PRICE LISTS TAB)

### 2.1 Cấu trúc bố cục (Layout Architecture)
- **Header thanh tác vụ:** Container thẻ trắng bo góc `bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center`.
- **Lưới thẻ bảng giá:** `grid grid-cols-1 md:grid-cols-2 gap-5`.
- **Thẻ Price List:** `bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between`.

### 2.2 Typography
- Mã Bảng Giá: `font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800`.
- Tiêu đề Bảng Giá: `font-bold text-slate-900 dark:text-white text-base mt-2`.
- Mô tả: `text-xs text-slate-600 dark:text-slate-400 mt-1 mb-4 leading-relaxed`.

### 2.3 Định dạng số liệu & tiền tệ
- Đếm số mặt hàng: `font-mono font-bold text-slate-900 dark:text-white text-sm`.
- Độ ưu tiên: `font-mono font-bold text-indigo-600 dark:text-indigo-400`.

### 2.4 Status Color Tokens (WCAG AA)
- Badge Độ Ưu Tiên: `px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded font-semibold text-[11px] border border-indigo-200 dark:border-indigo-800`.
- Badge Hoạt động: `px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold text-xs rounded-full border border-emerald-200 dark:border-emerald-800`.

### 2.5 Component & Interaction chi tiết
- Modal tạo bảng giá mới: Thu thập mã bảng giá, tên bảng giá, loại bảng giá (RETAIL, WHOLESALE, DISTRIBUTOR, VIP), độ ưu tiên (Priority), ngày hiệu lực.

### 2.6 System States
- Trạng thái duyệt tự động `APPROVED` hiển thị người duyệt và ngày phê duyệt.

### 2.7 Bằng chứng trích xuất từ mã nguồn
```tsx
<div key={pl.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
  <div className="flex justify-between items-start mb-3">
    <div>
      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800">
        {pl.code}
      </span>
      <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2">{pl.name}</h3>
    </div>
  </div>
</div>
```

---

## TAB 3 — QUY TẮC MARKUP / MARGIN (PRICING RULES TAB)

### 3.1 Cấu trúc bố cục (Layout Architecture)
- **Governance Banner:** `bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-4 rounded-xl text-xs flex items-start gap-3 shadow-xs`.
- **Lưới quy tắc danh mục:** `grid grid-cols-1 md:grid-cols-2 gap-5`.

### 3.2 Typography & Định dạng
- Tiêu đề danh mục: `font-bold text-slate-900 dark:text-white text-base`.
- Tỷ lệ Markup/Margin: `font-mono text-xl font-bold text-indigo-700 dark:text-indigo-300`.

### 3.3 Status Color Tokens (WCAG AA)
- Badge Markup: `px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded font-semibold text-[11px] border border-emerald-200 dark:border-emerald-800`.
- Badge Chế độ làm tròn: `px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-mono text-[11px]`.

### 3.4 Component & Interaction chi tiết
- Nút "Điều Chỉnh Quy Tắc": Mở modal chỉnh sửa tỷ lệ Markup %, Target Margin %, Rounding Mode (Làm tròn 1.000đ, 100đ, hoặc chính xác). Khi lưu, hệ thống tự động tính lại giá cho toàn bộ SKU thuộc danh mục tương ứng.

---

## TAB 4 — HỢP ĐỒNG KHÁCH HÀNG (CUSTOMER PRICING TAB)

### 4.1 Cấu trúc bố cục (Layout Architecture)
- Bảng Master Grid danh mục giá theo hợp đồng riêng của khách hàng B2B (FPT, Viettel, VNPT).
- Modal "Thiết Lập Giá Hợp Đồng": Cho phép chọn khách hàng, mã hợp đồng, sản phẩm SKU, đơn giá thỏa thuận riêng và chiết khấu %.

### 4.2 Typography & Số liệu
- Đơn giá niêm yết: `font-mono text-xs text-slate-500 line-through`.
- Đơn giá hợp đồng: `font-mono tabular-nums font-bold text-indigo-700 dark:text-indigo-300 text-sm`.
- Tỷ lệ chiết khấu: `px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded border border-emerald-200 dark:border-emerald-700`.

---

## TAB 5 — BẬC THANG SỐ LƯỢNG (QUANTITY PRICING TAB)

### 5.1 Cấu trúc bố cục (Layout Architecture)
- Grid phân nhóm biểu giá theo sản phẩm và các bậc thang số lượng (Tier 1-9, 10-49, 50-99, 100+).
- Thẻ biểu giá cho từng SKU với bảng chi tiết khoảng số lượng Min - Max, đơn giá bậc thang và tỷ lệ giảm.

### 5.2 Component & Interaction
- Modal "Thêm Bậc Thang Giá Mới": Cấu hình số lượng tối thiểu, số lượng tối đa, đơn giá áp dụng và phần trăm chiết khấu.

---

## TAB 6 — KHUYẾN MÃI CÓ HẠN (PROMOTIONS TAB)

### 6.1 Cấu trúc bố cục (Layout Architecture)
- Banner giải thích nguyên tắc bảo toàn giá chuẩn (Standard Retail: 666.666 ₫) không bị ghi đè trong suốt thời gian khuyến mãi.
- Lưới các chiến dịch khuyến mãi (PROMO-FLASH-2026, BACK-TO-SCHOOL-2026).
- Thông tin giá khuyến mãi nổi bật màu hồng đỏ: `font-mono font-bold text-base text-rose-600 dark:text-rose-400`.
- Cơ chế Auto-Revert: Tự động hoàn nguyên về giá chuẩn sau ngày kết thúc hiệu lực mà không cần can thiệp thủ công.

---

## TAB 7 — TÍNH GIÁ HÀNG LOẠT (BULK PRICING TAB)

### 7.1 Cấu trúc bố cục (Layout Architecture)
- **Bảng điều khiển thông số tính toán hàng loạt (Bulk Configuration Panel):**
  - Lựa chọn Bảng giá đích (`selectedPriceListId`).
  - Chế độ tính toán: Quy tắc danh mục (`CATEGORY_RULE`), Đồng bộ Markup (`UNIFORM_MARKUP`), hoặc Đồng bộ Margin (`UNIFORM_MARGIN`).
  - Chế độ làm tròn số: Làm tròn 1.000 ₫ (`NEAREST_1000`), Làm tròn 100 ₫, hoặc Giữ nguyên số lẻ.
  - Ngưỡng biên an toàn tối thiểu (Min Margin Threshold): Mặc định 15%.
- **Bảng dữ liệu tính giá trực tiếp (Interactive Batch Grid):**
  - Checkbox chọn từng dòng hoặc chọn tất cả (`handleToggleAll`).
  - Ô nhập trực tiếp đơn giá điều chỉnh (`adjustedPrice`) phản hồi tức thì với margin thực tế.
  - Nút "+5% Các dòng chọn" và "-5% Các dòng chọn" hỗ trợ tăng/giảm nhanh giá bán.
- **Thanh tác vụ chân trang (Action Bar):**
  - Nút "Làm Trống Bảng": Kích hoạt `ConfirmDialog` xác nhận xóa toàn bộ danh sách.
  - Nút "Gửi Duyệt Maker-Checker": Kích hoạt `ConfirmDialog` gửi danh sách đề xuất giá sang CFO.
  - Nút "Áp Dụng Trực Tiếp": Kích hoạt `ConfirmDialog` ghi đè giá bán chính thức vào bảng giá.

### 7.2 Tuân thủ Rule #19 (ConfirmDialog Integration)
- 100% các hành động nhạy cảm trong `BulkPricingTab` đều sử dụng `ConfirmDialog.tsx`, hoàn toàn không có `window.alert` hay `window.confirm`.
```tsx
setConfirmDialog({
  isOpen: true,
  title: 'Xác Nhận Áp Dụng Giá Hàng Loạt',
  message: `Bạn chuẩn bị ghi đè trực tiếp giá bán cho ${selectedItems.length} SKU vào bảng giá "${selectedPriceList.name}". Hành động này có hiệu lực ngay lập tức.`,
  confirmText: 'Đồng ý cập nhật',
  variant: 'default',
  onConfirm: () => { /* logic */ }
});
```

---

## TAB 8 — PHÊ DUYỆT MAKER-CHECKER (PRICE APPROVAL TAB)

### 8.1 Cấu trúc bố cục (Layout Architecture)
- **Workflow Explainer Banner:** Mô tả phân định thẩm quyền độc lập (Segregation of Duties).
- **Chuỗi State Machine Pill:** `DRAFT → SUBMITTED → PENDING → APPROVED`.
- **Danh sách yêu cầu phê duyệt giá (Approval Request Cards):**
  - So sánh giá vốn Costing, giá bán cũ, giá đề xuất mới, biên lợi nhuận cũ vs mới.
  - Thông tin người đề xuất (Maker), thời gian gửi yêu cầu, lý do điều chỉnh.
  - Nút thao tác: "Từ Chối (Reject)" mở modal nhập lý do; "Phê Duyệt (Approve)" cập nhật trực tiếp giá vào hệ thống.

---

## TAB 9 — LỊCH SỬ & AUDIT LOG (PRICE HISTORY TAB)

### 9.1 Cấu trúc bố cục (Layout Architecture)
- Bảng nhật ký kiểm toán bất biến (Immutable Price Audit Trail).
- Cột dữ liệu chi tiết:
  - Thời gian & Mã Log (`changedAt`, `id`).
  - Sản phẩm & Bảng giá (`productName`, `sku`, `priceListName`, `uom`).
  - Giá cũ (`oldPrice`) gạch ngang.
  - Icon mũi tên chuyển tiếp `ArrowRight`.
  - Giá mới (`newPrice`) in đậm nổi bật font-mono.
  - Quy tắc & Lý do điều chỉnh (`ruleApplied`, `reason`, `Manual Override` badge).
  - Người thực hiện (Maker) & Người duyệt (Checker).
  - Khung thời gian hiệu lực (`effectiveFrom → effectiveTo`).

---

## TAB 10 — DÒ GIÁ WATERFALL (PRICING AUDIT & SIMULATOR TAB)

### 10.1 Cấu trúc bố cục (Layout Architecture)
- **Thanh chỉ thị 6 bước Waterfall trực quan (Dynamic 6-Step Hierarchy Visual Bar):**
  - Bậc 1: Hợp đồng riêng (`Customer Contract`)
  - Bậc 2: Nhóm khách hàng (`Customer Group`)
  - Bậc 3: Bậc số lượng (`Quantity Breaks`)
  - Bậc 4: Khuyến mãi có hạn (`Promotions`)
  - Bậc 5: Quy tắc danh mục (`Category Rules`)
  - Bậc 6: Giá niêm yết chuẩn (`Default Standard`)
  - Tự động highlight bước thắng (`isWinner`) với nhãn "Trúng" và viền sáng indigo, làm mờ các bước không khớp hoặc bị bỏ qua.
- **Biểu mẫu truy vấn (Form Query Inputs):**
  - Khách hàng (FPT, Viettel), Nhóm khách hàng (VIP, Wholesale, Retail), Sản phẩm & SKU, Số lượng mua, Đơn vị tính, Ngày giao dịch.
- **Khung kết quả phân giải giá cuối cùng (Waterfall Trace Result):**
  - Thẻ hiển thị giá bán chính thức đã phân giải kèm VAT (10%), tổng tiền chưa VAT và có VAT.
  - Biên lợi nhuận gộp thực tế (Gross Margin %) đối chiếu với giá vốn cơ sở (`costBasis`).
  - Danh sách lưu vết truy vết từng bước (Waterfall Trace Logs) giải thích chi tiết lý do áp dụng hoặc bỏ qua từng bậc.

---

## DANH MỤC 3 MODAL HÀNH VI CHÍNH CỦA M41

### 1. `ManualOverrideModal.tsx` (Ghi Đè Giá Thủ Công)
- Tiêu đề & Cảnh báo: `GOVERNANCE CONTROL - Ghi Đè Giá Thủ Công (Manual Price Override)`.
- Input tiền tệ: Sử dụng `CurrencyInputField` định dạng VND chuẩn.
- Đánh giá tác động Margin thời gian thực: Tự động tính toán lại Margin và đổi màu xanh (`PASS`) hoặc đỏ (`WARNING`) nếu dưới sàn 15%.
- Yêu cầu bắt buộc: Phải nhập lý do can thiệp, người thực hiện (Maker) và người phê duyệt (Checker).

### 2. `InboundReceivingModal.tsx` (Nhận Giá Vốn Từ Phiếu Nhập Kho)
- Tích hợp liên kết với phân hệ Inbound Warehouse / Costing Engine.
- Mô phỏng nhận đơn giá nhập kho thực tế từ nhà cung cấp (VD: ASUS, Samsung, Kingston).
- Tự động tính toán đề xuất giá bán mới theo tỷ lệ Markup chuẩn và ghi vết kiểm toán hệ thống.

### 3. `AddProductPricingModal.tsx` (Khai Báo Sản Phẩm & Giá Mới)
- Liên kết với danh mục hàng hóa Enterprise Master Catalog (`ENTERPRISE_MASTER_PRODUCTS`).
- Tự động điền giá vốn gốc từ phân hệ kho M17 (`costPrice`).
- Hỗ trợ 3 phương pháp định giá: Cost-plus Markup, Target Margin, hoặc Fixed Price.
- Tính toán ngay giá bán niêm yết, Margin thực tế và cảnh báo an toàn trước khi lưu.

---

## KẾT LUẬN & CHỨNG NHẬN CHÂN LÝ THIẾT KẾ

Tài liệu đặc tả này bao quát 100% các thành phần giao diện, phân tầng cấu trúc L0–L4, hệ thống typography, định dạng tiền tệ Việt Nam, bảng màu WCAG AA, tương tác Maker-Checker và các modal của Phân hệ **M41 Product Pricing & Price Management**. Mọi thao tác kiểm thử, sao chép hoặc kiểm toán giao diện đều phải lấy tài liệu này làm nguồn tham chiếu chính thức.
