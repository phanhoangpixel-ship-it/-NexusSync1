# TÀI LIỆU ĐẶC TẢ THIẾT KẾ GIAO DIỆN CHI TIẾT (UI/UX DESIGN SPEC)
## MODULE NGUỒN: M17 — INVENTORY CORE / ENTERPRISE INVENTORY AUTHORITY
**Dự án:** Hệ thống Quản trị Doanh nghiệp Hợp nhất NexusSync ERP  
**Đường dẫn mã nguồn:** `/src/components/workspaces/M17InventoryCoreWorkspace.tsx`  
**Quy chuẩn áp dụng:** Kiến trúc Phân tầng Vỏ hệ thống L0 - L4, Rule #19 (ConfirmDialog), Định dạng số `tabular-nums` `font-mono` vi-VN.

---

## PHASE 0 — KIỂM KÊ TOÀN BỘ TAB TRONG MODULE NGUỒN M17

Module M17 gồm chính xác **2 Tab chức năng chính** và **1 Banner điều hướng Deep-Link liên kết phân hệ**:

1. **Tab 1: `balances` — Số Dư Tồn Kho 3 Chiều (Multi-Dimensional Stock Balances)**
   - **Đường dẫn component:** `/src/components/workspaces/M17InventoryCoreWorkspace.tsx` (Render branch `activeTab === 'balances'`)
   - **Loại màn hình:** Master/List View dạng Enterprise Grid ảo hóa (`EnterpriseTable`) kết hợp L1 KPI Cards & L2 Advanced Filter Toolbar.
   - **Thẩm quyền nghiệp vụ:** Single Writer hiển thị tồn kho 4 trạng thái (`Physical = Available + Reserved + Quarantine`).

2. **Tab 2: `ledger` — Sổ Cái Tồn Kho Bất Biến (Immutable Stock Ledger)**
   - **Đường dẫn component:** `/src/components/workspaces/M17InventoryCoreWorkspace.tsx` (Render branch `activeTab === 'ledger'`)
   - **Loại màn hình:** Transaction Ledger / Audit Log Grid dạng Enterprise Grid ảo hóa (`EnterpriseTable`).
   - **Thẩm quyền nghiệp vụ:** Sổ cái ghi nhận dòng thời gian nhập/xuất/điều chuyển bất biến toàn hệ sinh thái ERP.

3. **Khối liên kết Deep-Link: `DeepLinkBanner` (M20 Stock Adjustment Engine)**
   - **Đường dẫn component:** `/src/components/common/DeepLinkBanner.tsx`
   - **Loại màn hình:** Callout Action Banner điều hướng Single Writer Rule #03 sang Phân hệ M20.

---

## PHASE 1 — TRÍCH XUẤT ĐẶC TẢ THIẾT KẾ CHI TIẾT CHO TỪNG TAB

---

### TAB 1: `balances` — SỐ DƯ TỒN KHO 3 CHIỀU (BALANCES VIEW)

#### 1.1 Cấu trúc bố cục (Layout Architecture)
- **Vỏ bọc ngoài cùng (Page Wrapper):** `p-6 sm:p-10 max-w-[1600px] mx-auto space-y-8 text-slate-800 bg-slate-50/50 min-h-screen`
- **Tầng L0 — Header Banner:**
  - Card bo tròn `bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 backdrop-blur-md`
  - Icon Module: Container `w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0`
  - Badge thẩm quyền: `px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs`
  - Nhóm nút thao tác: Nút Reset Sync (`bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold`) và Nút Tạo Điều Chỉnh (`bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-200`).
- **Tầng L1 — KPI Metric Strip (5 Cột Tồn Kho):**
  - Grid 5 cột responsive: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4`
  - Thẻ KPI: `bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-2.5 relative overflow-hidden group hover:border-indigo-300 transition-all`
- **Tầng L2 — Navigation & Filter Toolbar:**
  - Tab Switcher: Container `flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs`
  - Tab Active: `px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 bg-indigo-600 text-white shadow-md shadow-indigo-200`
  - Tab Inactive: `px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900`
  - Search Input: Container `relative w-full sm:w-80` với input `w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500`
  - Dropdown Lọc Kho: `p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500`
- **Tầng L3 — Enterprise Data Grid:**
  - Card chứa bảng: `bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-4`
  - Component `EnterpriseTable` hỗ trợ `stickyFirstColumn={true}`, `stickyHeader={true}`, `virtualized={true}`, `maxHeight={540}`.

#### 1.2 Typography
- **Tiêu đề chính (Header Title):** `text-2xl font-extrabold tracking-tight text-slate-900`
- **Mô tả dưới tiêu đề (Header Subtitle):** `text-sm text-slate-500 font-medium`
- **Nhãn Thẻ KPI (Metric Label):** `text-slate-500 text-xs font-bold uppercase tracking-wider`
- **Số liệu Thẻ KPI (Metric Value):** `text-2xl font-black font-mono tabular-nums text-slate-900` (hoặc `text-amber-600`, `text-purple-600`, `text-emerald-600`, `text-indigo-600`)
- **Ghi chú dưới Thẻ KPI:** `text-[11px] text-slate-500 font-medium`
- **Tên Sản phẩm trong Bảng:** `font-semibold text-slate-900 text-sm`
- **Mã SKU / Mã Định Danh trong Bảng:** `font-mono text-xs text-indigo-600 font-semibold`
- **Mã Kho / Mã Vị trí trong Bảng:** `font-mono text-slate-700 text-xs`
- **Số lượng Tồn kho trong Bảng:** `font-mono tabular-nums font-semibold text-xs`
- **Đơn giá / Định giá trong Bảng:** `font-mono tabular-nums font-semibold text-slate-900 text-xs`

#### 1.3 Định dạng số liệu & tiền tệ (Numerical & Currency Standards)
- **Số lượng (Quantities):** Định dạng tiếng Việt qua `Number(val).toLocaleString('vi-VN')`, kèm theo đơn vị đo lường cơ sở `{item.baseUnit || 'Cái'}`.
  - Phân cách hàng nghìn bằng dấu chấm (`.`), ví dụ: `1.500 Cái`.
  - Căn lề phải: `align: 'right'`, `isNumeric: true`.
  - Thuộc tính CSS: `font-mono tabular-nums font-semibold`.
- **Tiền tệ (Currency - VND):** Định dạng qua `Number(val).toLocaleString('vi-VN')} ₫`.
  - Ký hiệu tiền tệ: Đặt dấu cách và ký hiệu `₫` ở phía sau số (ví dụ: `25.500.000 ₫`).
  - Phân cách hàng nghìn bằng dấu chấm (`.`).
  - Căn lề phải: `align: 'right'`, `isNumeric: true`.
- **Mã định danh:** Căn lề trái hoặc căn giữa, font chữ Monospace `font-mono`.

#### 1.4 Hệ thống màu sắc trạng thái (Status Color Tokens)
- **Tồn Physical (Tổng tồn vật lý):** Màu trung tính / Chàm `text-slate-900`, Icon `bg-indigo-50 text-indigo-600`.
- **Tồn Reserved (Bảo lưu đơn hàng):** Màu Cảnh báo Cam/Hổ phách `text-amber-600`, Icon `bg-amber-50 text-amber-600`, viền hover `hover:border-amber-300`.
- **Tồn Quarantine (Cách ly KCS/QMS):** Màu Tím `text-purple-600`, Icon `bg-purple-50 text-purple-600`, viền hover `hover:border-purple-300`.
- **Tồn Available (Khả dụng):** Màu Xanh lục Thành công `text-emerald-600`, Icon `bg-emerald-50 text-emerald-600`, viền hover `hover:border-emerald-300`.
- **Định giá (Valuation):** Màu Chàm `text-indigo-600`, Icon `bg-indigo-50 text-indigo-600`, viền hover `hover:border-indigo-300`.

#### 1.5 Component & Interaction chi tiết
- **Nút Hành Động Dòng Dữ Liệu (Row Action):**
  - Nút `Thẻ Kho 360°`: `px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer`.
  - Tương tác: Kích hoạt `onSelectEntity` đồng bộ thanh ngữ cảnh toàn hệ thống và hiển thị toast notification.
- **Xác nhận thao tác nhạy cảm (Rule #19):**
  - Sử dụng `<ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />`.
  - Thông điệp cảnh báo rõ ràng khi reset dữ liệu: "Hành động này sẽ thiết lập lại toàn bộ tồn kho M17 khớp tuyệt đối 100% với danh mục 17 sản phẩm chuẩn từ M07. Bạn có chắc chắn muốn tiếp tục?".

#### 1.6 Trạng thái hệ thống (System States)
- **Loading State:** Icon Refresh xoay `animate-spin` kèm trạng thái vô hiệu hóa nút bấm.
- **Empty State:** `emptyMessage="Không tìm thấy dữ liệu tồn kho phù hợp."`
- **Error State:** Thông báo Toast Notification phân loại `'danger'` / `'warning'`.

#### 1.7 Bằng chứng trích xuất mã nguồn (Raw Code Extract)
```tsx
// Bằng chứng 1.1 - 1.4: Định dạng cột & Typography chuẩn trong balanceColumns
{
  key: 'stockPhysical',
  header: 'Physical',
  width: 140,
  align: 'right',
  isNumeric: true,
  render: (item) => (
    <span className="font-mono tabular-nums font-semibold text-slate-900">
      {Number(item.stockPhysical || 0).toLocaleString('vi-VN')} {item.baseUnit || 'Cái'}
    </span>
  ),
},
{
  key: 'totalValuation',
  header: 'Total Valuation',
  width: 160,
  align: 'right',
  isNumeric: true,
  render: (item) => {
    const physical = Number(item.stockPhysical || 0);
    return (
      <span className="font-mono tabular-nums font-semibold text-slate-900">
        {(physical * (item.costPrice || 0)).toLocaleString('vi-VN')} ₫
      </span>
    );
  },
}
```

---

### TAB 2: `ledger` — SỔ CÁI TỒN KHO BẤT BIẾN (STOCK LEDGER VIEW)

#### 1.1 Cấu trúc bố cục (Layout Architecture)
- **Container chung:** `bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-4`
- **Thanh tiêu đề danh mục sổ cái:**
  - Tiêu đề phụ: `text-base font-bold text-slate-900`
  - Mô tả: `text-xs text-slate-500`
  - Badge đếm số lượng bút toán: `text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded-lg`
- **Enterprise Grid:** `EnterpriseTable` ảo hóa hiển thị danh sách dòng thời gian bút toán kế toán kho.

#### 1.2 Typography
- **ID & Timestamp:** `font-mono text-xs text-slate-500`
- **Loại giao dịch (Badge Type):** `px-2.5 py-1 rounded-full text-xs font-semibold`
- **Mã chứng từ (Reference No):** `font-mono font-semibold text-slate-800 text-xs`
- **Vật tư (SKU):** `font-mono text-indigo-600 font-semibold text-xs`
- **Số lượng biến động (+/-):** `font-mono tabular-nums font-semibold text-xs`
- **Tồn sau giao dịch (Balance After):** `font-mono tabular-nums font-semibold text-slate-900 text-xs`
- **Diễn giải ghi chú:** `text-xs text-slate-600`

#### 1.3 Định dạng số liệu & tiền tệ
- **Số lượng biến động (+/-):**
  - Bút toán Nhập (`quantity > 0`): Hiển thị tiền tố dấu cộng `+`, màu xanh `text-emerald-600`.
  - Bút toán Xuất (`quantity < 0`): Hiển thị dấu trừ tự nhiên, màu đỏ `text-rose-600`.
  - Căn phải `align: 'right'`, `isNumeric: true`.
- **Thời gian giao dịch (Timestamp):** Định dạng qua `new Date(l.createdAt).toLocaleString('vi-VN')` hiển thị theo giờ Việt Nam.

#### 1.4 Hệ thống màu sắc trạng thái
- **Giao dịch Nhập Kho (IN / PURCHASE / GOODS_RECEIPT):** `bg-emerald-50 text-emerald-700 border border-emerald-200`
- **Giao dịch Xuất Kho (OUT / SALE / GOODS_ISSUE):** `bg-rose-50 text-rose-700 border border-rose-200`
- **Giao dịch Chuyển kho / Điều chỉnh (TRANSFER / ADJUSTMENT):** `bg-amber-50 text-amber-700 border border-amber-200`

#### 1.5 Component & Interaction chi tiết
- Tương tác xem chi tiết dòng bút toán, hỗ trợ cuộn ảo hóa mượt mà `virtualized={true}`.

#### 1.6 Trạng thái hệ thống
- **Empty State:** `emptyMessage="Chưa có bút toán sổ cái nào được ghi nhận."`

#### 1.7 Bằng chứng trích xuất mã nguồn
```tsx
// Bằng chứng trích xuất 1.2 - 1.4 cho Bút toán Sổ cái
{
  key: 'quantity',
  header: 'Số Lượng',
  width: 130,
  align: 'right',
  isNumeric: true,
  render: (l) => (
    <span className={`font-mono tabular-nums font-semibold ${l.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
      {l.quantity > 0 ? `+${l.quantity}` : l.quantity}
    </span>
  ),
},
{
  key: 'balanceAfter',
  header: 'Tồn Sau Giao Dịch',
  width: 160,
  align: 'right',
  isNumeric: true,
  render: (l) => <span className="font-mono tabular-nums font-semibold text-slate-900">{l.balanceAfter}</span>,
}
```

---

## PHASE 2 — TỔNG KẾT BẢN ĐẶC TẢ THIẾT KẾ ĐỒNG BỘ CHO MODULE ĐÍCH M18

Toàn bộ nguyên tắc thiết kế trên là **CHUẨN MỰC CHÂN LÝ DUY NHẤT (Single Source of Truth)** được áp dụng tuyệt đối sang 7 Tab chức năng của **Module M18 — Warehouse Management Hub**:
- **Bố cục:** Vỏ bọc hệ thống tiêu chuẩn `p-6 space-y-6 max-w-[1600px] mx-auto`, thanh Header L0 với icon tròn bo viền 3D shadow, thẻ KPI L1 với 5 cột bo tròn `rounded-2xl`/`rounded-3xl`, thanh điều hướng Tab L2 với active badge và filter toolbar, bảng dữ liệu L3 hỗ trợ `font-mono` `tabular-nums` và chân trang L4 `PaginationControl`.
- **Số liệu & Tiền tệ:** 100% sử dụng định dạng `toLocaleString('vi-VN')` với dấu phân cách hàng nghìn là dấu chấm (`.`), tiền tệ là `₫` ở sau, số âm/dương phân màu xanh lá (`text-emerald-600`) / đỏ hồng (`text-rose-600`).
- **An toàn & Thẩm quyền (Rule #19):** 100% sử dụng `ConfirmDialog.tsx` cho mọi hành động xác nhận, cất kho, xuất kho, phê duyệt, hoàn toàn không sử dụng `window.alert` / `window.confirm`.
