# M19 WMS STOCKTAKE & BLIND COUNT WORKSPACE
## FULL UI/UX DESIGN SPECIFICATION — SINGLE SOURCE OF TRUTH (PHASE 1 & 2)

**Document Reference:** `/docs/design-specs/M19_FULL_UI_DESIGN_SPEC.md`  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Replication Protocol)  
**Tác giả:** Chuyên viên Lập trình Frontend Cấp cao — NexusSync ERP Team  
**Mục tiêu:** Cung cấp tài liệu nguồn chân lý thiết kế chi tiết 100% được trích xuất từ mã nguồn thực tế của Phân hệ M19 để sao chép chuẩn mực sang các phân hệ đích (M08, M20, v.v.).

---

## MỤC LỤC TỔNG QUAN DANH MỤC TAB M19 (PHASE 0 INVENTORY)

| STT | Mã Tab | Tên Tab Chức Năng | File Component Tương Ứng | Loại Màn Hình | Vai Trò Chức Năng |
|---|---|---|---|---|---|
| 1 | `sessions` | **Phiên Kiểm Kê (Master Sessions)** | `/src/components/workspaces/stocktake/StocktakeMasterSessionsTab.tsx` | Master/List View + L2 KPI Strip + Filter Bar + Drawer 360 + Modal Tạo Phiên + Export Excel | Quản lý vòng đời phiên kiểm kê kho, lọc kho/trạng thái, hiển thị chỉ số, xem chi tiết 360, duyệt khóa sổ |
| 2 | `field_count` | **Bàn Đếm Mù Hiện Trường (Field Count Execution)** | `/src/components/workspaces/stocktake/StocktakeFieldExecutionTab.tsx` | Interactive Data Grid + Inline Editing (Enter/Esc) + QR/Barcode Scanner + Blind Count Masking | Nhập liệu số lượng thực đếm trực tiếp trên dòng với phím nóng Enter/Escape, quét mã vạch, che giấu số lượng sổ sách |
| 3 | `variance` | **Đối Soát Chênh Lệch (Variance Reconciliation & Post)** | `/src/components/workspaces/stocktake/StocktakeVarianceReconciliationTab.tsx` | Analytical Master Grid + Tolerance Badges + Phân Tích Nguyên Nhân + Lập Phiếu Điều Chỉnh Bù Trừ | Đối soát sai lệch sổ sách vs thực tế, cảnh báo vượt dung sai, gán nguyên nhân thất thoát, đẩy bút toán điều chỉnh |
| 4 | `assignments` | **Phân Công Đội Đếm (Task Assignment & SLA)** | `/src/components/workspaces/stocktake/StocktakeTaskAssignmentTab.tsx` | Task Matrix Grid + Dual Counter Assignment + Progress Bar % + SLA Countdown Badge | Phân công cặp nhân sự kiểm đếm chéo (Primary & Cross Counter), giám sát tiến độ thực hiện và thời hạn SLA |
| 5 | `schedules` | **Lịch Định Kỳ & Đóng Băng Kho (Schedules & Freeze)** | `/src/components/workspaces/stocktake/StocktakeSchedulesTab.tsx` | Schedule Management Grid + Auto-Freeze Toggle + Modal Lập Kế Hoạch Chu Kỳ | Lập lịch kiểm kê định kỳ tuần/tháng/quý/năm, kích hoạt chế độ đóng băng kho tự động chống gian lận |
| 6 | `ledger` | **Sổ Cái Bất Biến (GL Audit Trail & Ledger)** | `/src/components/workspaces/stocktake/StocktakeLedgerHistoryTab.tsx` | Immutable Ledger Log Grid + SHA-256 Checksum + Dual Account Debit/Credit + Export Audit Excel | Nhật ký kiểm toán bất biến bảo mật với hàm băm SHA-256, định khoản Nợ/Có tài khoản kế toán kho (TK 156, 632, 138, 338) |

---

## 0. KIẾN TRÚC TOÀN CỤC (GLOBAL SHELL & NAVIGATION)

### 0.1 Cấu trúc bố cục Phân Tầng L0 & L1
- **Tầng L0 (Workspace Banner):**
  - Container: `bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3`.
  - Icon khối: `w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs`.
  - Chip phân hệ: `px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-mono font-bold rounded-md border border-slate-200 dark:border-slate-600`.
  - Chip xác nhận Rule #19: `flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold`.
- **Tầng L1 (Sub-tabs Navigation Strip):**
  - Container: `flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-x-auto scrollbar-none`.
  - Nút Tab Active: `bg-blue-600 text-white shadow-xs px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer`.
  - Nút Tab Inactive: `text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer`.

---

## TAB 1 — PHIÊN KIỂM KÊ (MASTER SESSIONS)

### 1.1 Cấu trúc bố cục (Layout Architecture)
- **Tầng L1 (Command Bar):**
  - Ô tìm kiếm: `relative w-full sm:w-80` với icon `Search` `w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2`.
  - Dropdown lọc kho & trạng thái: `text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500`.
  - Nút thao tác: Nút "Làm mới" (`RefreshCw`), nút "Xuất Excel" (`FileSpreadsheet`), nút "Tạo Phiên Kiểm Kê Mới" (`bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs px-3 py-2 font-bold text-xs flex items-center gap-1.5`).
- **Tầng L2 (KPI Metric Strip):**
  - Grid 4 cột: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`.
  - Thẻ KPI: `bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5`.
  - Cấu trúc thẻ: Icon màu nổi bật góc phải (`p-2 rounded-lg bg-... text-...`), nhãn tiêu đề `text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400`, chỉ số lớn `font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white mt-1`, dòng chú thích phụ bên dưới.
- **Tầng L3 (Master Data Table & Drawer 360):**
  - Bọc trong `L3ContentState` xử lý Skeleton Loading, Error State, Empty State.
  - Khung bảng: `bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden`.
  - Thead: `bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider`.
  - Dòng dữ liệu: `transition-colors duration-150 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border-l-4`.
  - Drawer trượt: `fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto`.
- **Tầng L4 (Pagination):**
  - Điều khiển qua `PaginationControl` đặt cố định phía dưới bảng.

### 1.2 Typography
- Tiêu đề chính: `text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight`.
- Mã chứng từ: `font-mono font-bold text-xs text-blue-600 dark:text-blue-400`.
- Tên mô tả: `font-semibold text-xs text-slate-900 dark:text-white`.
- Thẻ nhãn KPI: `text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400`.
- Số liệu: `font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white text-right`.

### 1.3 Định dạng số liệu & tiền tệ
- Format tiền tệ VNĐ: `Number(val).toLocaleString('vi-VN') + ' ₫'` hoặc `formatCurrency(val)`.
- Dấu phân cách hàng nghìn: Dấu chấm `.` theo chuẩn Việt Nam.
- Số âm: Hiển thị dấu trừ `-` kèm màu đỏ nổi bật `text-rose-600 dark:text-rose-400`.
- Số dương: Kèm tiền tố `+` và màu xanh lá `text-emerald-600 dark:text-emerald-400`.
- Căn lề số liệu: 100% cột tiền tệ và số lượng căn phải `text-right` với class `font-mono tabular-nums font-bold`.

### 1.4 Status Color Tokens (WCAG AA)
- `COUNTING`: `bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 font-bold px-2.5 py-0.5 rounded-full text-[10px]`
- `RECOUNT`: `bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold px-2.5 py-0.5 rounded-full text-[10px]`
- `PENDING_APPROVAL`: `bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold px-2.5 py-0.5 rounded-full text-[10px]`
- `APPROVED` / `CLOSED`: `bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold px-2.5 py-0.5 rounded-full text-[10px]`
- `DRAFT`: `bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 font-medium px-2.5 py-0.5 rounded-full text-[10px]`
- Viền phân loại dòng:
  - Default: `border-l-4 border-transparent`
  - Đóng băng / Cảnh báo: `border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10`
  - Lệch / Yêu cầu đếm lại: `border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20`
  - Hoàn tất / Duyệt: `border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10`

### 1.5 Component & Interaction chi tiết
- **Row Actions:** Nhóm nút thao tác góc phải mỗi dòng: Xem chi tiết (`Eye`), Thao tác nghiệp vụ đặc thù (`CheckCircle2`, `Edit3`, `Lock`).
- **Rule #19 Compliance:** Tuyệt đối KHÔNG dùng `window.alert()` hay `window.confirm()`. 100% hành động nhạy cảm sử dụng `ConfirmDialog.tsx`:
  ```tsx
  <ConfirmDialog
    isOpen={confirmConfig.isOpen}
    title={confirmConfig.title}
    message={confirmConfig.message}
    variant={confirmConfig.variant}
    onConfirm={confirmConfig.onConfirm}
    onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
  />
  ```

### 1.6 System States (L3ContentState)
- Skeleton Loading: 5 dòng giả lập với hiệu ứng nhịp tim `animate-pulse bg-slate-200 dark:bg-slate-700 h-8 rounded-md`.
- Empty State: Icon `Boxes` / `Inbox`, thông báo rõ ràng "Không tìm thấy dữ liệu", kèm nút hành động Tạo mới.
- Error State: Icon `AlertTriangle`, thông báo lỗi hệ thống kèm nút "Thử lại".

### 1.7 Code bằng chứng trích xuất từ nguồn M19
```tsx
// Trích xuất từ StocktakeMasterSessionsTab.tsx dòng 72-94
<tr 
  key={session.id}
  className={`hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer ${
    session.isFrozen ? 'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10' :
    session.status === 'RECOUNT' ? 'border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20' :
    session.status === 'APPROVED' ? 'border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10' :
    'border-l-4 border-transparent'
  }`}
>
  <td className="p-3 font-mono font-bold text-xs text-blue-600 dark:text-blue-400">{session.sessionCode}</td>
  <td className="p-3 font-semibold text-xs text-slate-900 dark:text-white">{session.title}</td>
  <td className="p-3 text-right font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white">
    {session.countedSkus} / {session.totalSkus} SKU
  </td>
  <td className={`p-3 text-right font-mono tabular-nums font-bold text-xs ${
    session.totalVarianceValue < 0 ? 'text-rose-600 dark:text-rose-400' :
    session.totalVarianceValue > 0 ? 'text-emerald-600 dark:text-emerald-400' :
    'text-slate-600 dark:text-slate-300'
  }`}>
    {session.totalVarianceValue > 0 ? '+' : ''}{session.totalVarianceValue.toLocaleString('vi-VN')} ₫
  </td>
</tr>
```

---

## TAB 2 — BÀN ĐẾM MÙ HIỆN TRƯỜNG (FIELD COUNT EXECUTION)

### 1.1 Cấu trúc bố cục
- **L1 Command Bar:** Chọn phiên kiểm kê active, Ô quét mã Barcode/QR Code nhanh (`QrCode`), Bộ lọc Vị trí Kệ (Bin Location) và Trạng thái đếm (`ALL`, `PENDING`, `COUNTED`, `RECOUNT_REQUIRED`), Nút Lưu đồng loạt.
- **L2 KPI Strip:** 4 thẻ: Tổng dòng SKU cần đếm, Đã nhập số lượng đếm, Số dòng lệch chờ kiểm tra, Tỷ lệ hoàn thành đếm %.
- **L3 Interactive Grid:** Bảng dữ liệu hỗ trợ **Inline Editing** trực tiếp trên từng ô số lượng thực đếm (`actualQty`), hỗ trợ phím nóng `Enter` (Lưu) và `Escape` (Hủy), hiển thị rõ Đơn vị tính (UOM) bên cạnh.

### 1.2 Typography & Định dạng số
- Mã SKU & Barcode: `font-mono font-bold text-xs text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600`.
- Vị trí Kệ (Bin): `font-mono font-bold text-xs text-indigo-700 dark:text-indigo-300`.
- Số lượng đếm: `font-mono tabular-nums font-bold text-xs text-right`.
- Chế độ Blind Count: Ẩn số lượng sổ sách (`*** Blind ***`) để bảo đảm tính khách quan tuyệt đối.

### 1.3 Quy chuẩn Inline Editing Chuẩn (Enter / Escape / UOM)
```tsx
// Trích xuất từ StocktakeFieldExecutionTab.tsx
{editingId === item.id ? (
  <div className="inline-flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-lg border border-blue-400 dark:border-blue-500 shadow-xs">
    <input
      type="number"
      min="0"
      value={tempQty}
      onChange={(e) => setTempQty(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSaveInline(item);
        if (e.key === 'Escape') handleCancelInline();
      }}
      autoFocus
      className="w-24 px-2 py-1 text-xs font-mono font-bold text-center text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500"
    />
    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 pr-1">{item.uom}</span>
    <button onClick={() => handleSaveInline(item)} className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors cursor-pointer" title="Lưu (Enter)">
      <Check className="w-3.5 h-3.5" />
    </button>
  </div>
) : (
  <span className="font-mono font-bold text-slate-900 dark:text-white">
    {item.actualQty !== null ? `${item.actualQty} ${item.uom}` : 'Chưa đếm'}
  </span>
)}
```

---

## TAB 3 — ĐỐI SOÁT CHÊNH LỆCH (VARIANCE RECONCILIATION & POST)

### 1.1 Cấu trúc bố cục
- **L1 Command Bar:** Lọc theo mức độ nghiêm trọng chênh lệch (Vượt ngưỡng dung sai `isExceedTolerance`, Lệch âm mất mát, Lệch dương dôi dư), Lọc theo Nguyên nhân gốc rễ (`MISPLACEMENT`, `SHRINKAGE`, `DAMAGE`, `DATA_ENTRY`), Nút Đề xuất Bút Toán Điều Chỉnh.
- **L2 KPI Strip:** Tổng giá trị lệch Net (VND), Tổng số dòng lệch vượt dung sai, Giá trị thất thoát cần giải trình, Giá trị dôi dư cần nhập kho.
- **L3 Data Grid:** Bảng đối soát chi tiết giữa Sổ sách và Thực tế đếm, tính toán % sai lệch và giá trị thành tiền tự động.

### 1.2 Định dạng & Màu sắc trạng thái
- Lệch Âm (Thất thoát / Hỏng): `text-rose-600 dark:text-rose-400 font-mono font-bold`
- Lệch Dương (Dôi dư): `text-emerald-600 dark:text-emerald-400 font-mono font-bold`
- Khớp 100%: `text-slate-600 dark:text-slate-400 font-mono`
- Huy hiệu Vượt dung sai: `bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold px-2 py-0.5 rounded-full text-[10px]`

---

## TAB 4 — PHÂN CÔNG ĐỘI ĐẾM (TASK ASSIGNMENT & SLA)

### 1.1 Cấu trúc bố cục
- **L1 Command Bar:** Tìm kiếm mã nhiệm vụ, lọc theo Dãy kệ / Khu vực, lọc theo Người kiểm đếm (Assignee), Nút Phân Công Nhiệm Vụ Mới.
- **L2 KPI Strip:** Tổng nhiệm vụ phân công, Đang thực hiện, Hoàn thành 100%, Nhiệm vụ trễ hạn SLA.
- **L3 Data Grid:** Bảng quản lý nhiệm vụ đếm, hiển thị cặp nhân sự đối chiếu chéo (Primary Assignee & Cross Counter), thanh tiến độ % hoàn thành trực quan.

---

## TAB 5 — LỊCH ĐỊNH KỲ & ĐÓNG BĂNG KHO (SCHEDULES & FREEZE)

### 1.1 Cấu trúc bố cục
- **L1 Command Bar:** Tìm kiếm kế hoạch chu kỳ, lọc Tần suất (`ANNUAL`, `QUARTERLY`, `MONTHLY_CYCLE`, `WEEKLY_ABC`), Nút Lập Lịch Định Kỳ Mới.
- **L2 KPI Strip:** Tổng lịch kiểm kê chu kỳ, Lịch đang kích hoạt (Active), Lịch tạm dừng, Kho đang ở chế độ Đóng băng giao dịch.
- **L3 Data Grid:** Danh sách kế hoạch kiểm kê định kỳ, nút Toggle Đóng băng / Mở khóa vị trí kho với `ConfirmDialog`.

---

## TAB 6 — SỔ CÁI BẤT BIẾN (GL AUDIT TRAIL & LEDGER)

### 1.1 Cấu trúc bố cục
- **L1 Command Bar:** Tìm kiếm số chứng từ bút toán, lọc Loại điều chỉnh, Lọc Tài khoản Sổ cái GL (TK 1561, TK 632, TK 1388, TK 3381), Nút Xuất Sổ Cái Excel.
- **L2 KPI Strip:** Tổng số bút toán đã khóa sổ, Tổng giá trị ghi giảm tài sản, Tổng giá trị ghi tăng tài sản, Toàn vẹn mã băm SHA-256 (100% Verified).
- **L3 Data Grid:** Bảng nhật ký bút toán kiểm toán bất biến, hiển thị Mã băm Blockchain / SHA-256 Checksum, Tài khoản Nợ / Có, Người phê duyệt và Thời gian ghi sổ `Asia/Ho_Chi_Minh`.

---

## TỔNG KẾT NGUYÊN TẮC SAO CHÉP CHUẨN SANG M08 (PHASE 3 BLUEPRINT)
1. Giữ nguyên 100% ngôn ngữ thiết kế:
   - Header L0 compact, icon box `w-10 h-10 rounded-xl bg-blue-600 text-white`, chips phân hệ và Rule #19.
   - Navigation strip L1: bo tròn `rounded-xl`, nền `bg-white dark:bg-slate-800 p-1.5`, nút active `bg-blue-600 text-white shadow-xs`.
   - KPI Strip L2: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`, nhãn `text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400`, giá trị `font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white`.
   - Table L3: thead chuẩn `bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase`, hover `hover:bg-slate-100/80 dark:hover:bg-slate-700/60`, row indicator `border-l-4`, số liệu `font-mono tabular-nums font-bold text-right`.
   - Trạng thái màu WCAG AA có viền và nền tương phản cao.
   - Thay thế toàn bộ thao tác nhạy cảm (Duyệt PO, Từ chối PO, Xử lý chênh lệch 3-Way) bằng `ConfirmDialog.tsx`.
   - Phòng ngừa triệt để lỗi fallback: dùng toán tử `??` thay vì `||` cho các trường số và derived values.
2. TUYỆT ĐỐI BẢO TOÀN NGUYÊN VẸN 100% LOGIC NGHIỆP VỤ CỦA M08:
   - Mọi endpoint API (`/api/purchases`, `/api/purchase/orders`, `/api/purchase/orders/:id/approve`, `/api/purchase/orders/:id/cancel`).
   - Mọi state, handlers (`handleCreatePO`, `handleApprovePO`, `handleRejectPO`, `handleResolveMismatch`, `handleCreateContract`, `handleSelectPo`, `onSelectEntity`, `handleExportCSV`).
   - Mọi modal đặc thù: `PdfPrintModal`, modal chi tiết PO, modal xử lý chênh lệch 3-way matching, modal tạo hợp đồng khung BPA.
   - Auto-routing của `guidedTask`.
