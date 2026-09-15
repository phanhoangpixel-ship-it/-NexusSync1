# M19 WMS STOCKTAKE & BLIND COUNT (QUẢN TRỊ KIỂM KÊ & KIỂM ĐẾM MÙ KHO VẬN)
## FULL UI/UX DESIGN SPECIFICATION — NGUỒN CHÂN LÝ THIẾT KẾ DUY NHẤT (SINGLE SOURCE OF TRUTH)

**Document Reference:** `/docs/design-specs/M19_STOCKTAKE_FULL_UI_DESIGN_SPEC.md`  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Replication Protocol)  
**Tác giả:** Chuyên viên Lập trình Frontend Cấp cao — NexusSync ERP Team  
**Mục tiêu:** Cung cấp bản đặc tả giao diện đầy đủ 100% từ code thật của phân hệ M19 làm cơ sở chuẩn mực sao chép sang phân hệ M20 (Stock Adjustment Workspace) và các phân hệ kế tiếp.

---

## MỤC LỤC TỔNG QUAN HỆ THỐNG TAB M19 (PHASE 0 INVENTORY)

| STT | Mã Tab | Tên Tab Chức Năng | File Component Tương Ứng | Loại Màn Hình |
|---|---|---|---|---|
| 1 | Tab 1 | **Phiên Kiểm Kê (Master Sessions)** | `/src/components/workspaces/stocktake/StocktakeMasterSessionsTab.tsx` | Master/List View + L2 KPI Strip + Filter Bar + Drawer 360 + Modal Tạo Phiên + Export Excel |
| 2 | Tab 2 | **Bàn Đếm Mù Hiện Trường (Field Count Execution)** | `/src/components/workspaces/stocktake/StocktakeFieldExecutionTab.tsx` | Interactive Data Grid + Inline Editing (Enter/Esc) + QR/Barcode Scanner + Blind Count Masking |
| 3 | Tab 3 | **Đối Soát Chênh Lệch (Variance Reconciliation & Post)** | `/src/components/workspaces/stocktake/StocktakeVarianceReconciliationTab.tsx` | Analytical Master Grid + Tolerance Badges + Phân Tích Nguyên Nhân + Lập Phiếu Điều Chỉnh Bù Trừ M20 |
| 4 | Tab 4 | **Phân Công Đội Đếm (Task Assignment & SLA)** | `/src/components/workspaces/stocktake/StocktakeTaskAssignmentTab.tsx` | Task Matrix Grid + Dual Counter Assignment + Progress Bar % + SLA Countdown Badge |
| 5 | Tab 5 | **Lịch Định Kỳ & Đóng Băng Kho (Schedules & Freeze)** | `/src/components/workspaces/stocktake/StocktakeSchedulesTab.tsx` | Schedule Management Grid + Auto-Freeze Toggle + Modal Lập Kế Hoạch Chu Kỳ |
| 6 | Tab 6 | **Sổ Cái Bất Biến (GL Audit Trail & Ledger)** | `/src/components/workspaces/stocktake/StocktakeLedgerHistoryTab.tsx` | Immutable Ledger Log Grid + SHA-256 Checksum + Dual Account Debit/Credit + Export Audit Excel |

---

## TAB 1 — PHIÊN KIỂM KÊ (MASTER SESSIONS)

### 1.1 Cấu trúc bố cục (Layout Architecture)
- **Tầng L0 (Shell & Header):** Header Banner hiển thị mã định danh `M19 • WMS STOCKTAKE`, tiêu đề hệ thống, huy hiệu xác nhận `Rule #19 Confirmed` và `Single-Writer Rule #03`.
- **Tầng L1 (Command Bar):** Thanh công cụ tìm kiếm tức thời (Search Input `relative w-full sm:w-80`), Dropdown lọc kho (`select` bo góc `rounded-xl`), Dropdown lọc trạng thái (`ALL`, `COUNTING`, `RECOUNT`, `PENDING_APPROVAL`, `APPROVED`, `CLOSED`), Nút Làm mới (`RefreshCw`), Nút Xuất Excel (`FileSpreadsheet`), Nút Tạo Phiên Kiểm Kê Mới (`bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs`).
- **Tầng L2 (KPI Metric Strip):** 4 thẻ KPI tóm tắt số liệu:
  1. *Tổng Phiên Kiểm Kê:* Icon `ClipboardCheck`, màu xanh lam `text-blue-600`, nhãn `text-slate-500 uppercase font-bold text-xs`, giá trị `font-mono tabular-nums font-bold text-2xl`.
  2. *Đang Triển Khai Đếm:* Icon `Clock`, màu hổ phách `text-amber-600`, nhãn `text-slate-500 uppercase font-bold text-xs`, giá trị `font-mono tabular-nums font-bold text-2xl`.
  3. *Chờ Duyệt Chênh Lệch:* Icon `AlertTriangle`, màu tím `text-purple-600`, nhãn `text-slate-500 uppercase font-bold text-xs`, giá trị `font-mono tabular-nums font-bold text-2xl`.
  4. *Giá Trị Lệch Net (VND):* Icon `Boxes`, màu đỏ hồng `text-rose-600`, nhãn `text-slate-500 uppercase font-bold text-xs`, giá trị `font-mono tabular-nums font-bold text-2xl`.
- **Tầng L3 (Data Grid & Detail Drawer):** Bảng danh sách phiên kiểm kê với hiệu ứng hover `hover:bg-slate-100/80 dark:hover:bg-slate-700/60`, chỉ báo viền trái `border-l-4`, phân trang `PaginationControl`. Tích hợp Drawer trượt từ bên phải hiển thị chi tiết 360 độ của phiên.
- **Tầng L4 (Sticky Footer):** Thanh điều khiển phân trang `PaginationControl` cố định đáy với lựa chọn số dòng trên trang (10, 25, 50 bản ghi).

### 1.2 Typography
- **Tiêu đề phân hệ / Tab:** `text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight`
- **Mã định danh phiên (Session Code):** `font-mono font-bold text-xs text-blue-600 dark:text-blue-400`
- **Tên phiên / Mô tả:** `font-semibold text-xs sm:text-sm text-slate-900 dark:text-white`
- **Nhãn KPI:** `text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400`
- **Số liệu thống kê & Tiền tệ:** `font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white`

### 1.3 Định dạng số liệu & Tiền tệ (Numerical Standards)
- **Số tiền VND:** `Number(val).toLocaleString('vi-VN') + ' ₫'` (ví dụ: `-12.500.000 ₫`, `4.200.000 ₫`).
- **Số lượng SKU / Vật tư:** `Number(val).toLocaleString('vi-VN')` (ví dụ: `24 SKU`, `1.250 Cái`).
- **Tỷ lệ tiến độ (%):** `Math.round((counted / total) * 100) + '%'`
- **Căn lề số liệu:** Luôn căn phải `text-right` với class `font-mono tabular-nums font-bold`.
- **Định dạng thời gian:** `dd/MM/yyyy HH:mm` theo múi giờ chuẩn `Asia/Ho_Chi_Minh`.

### 1.4 Hệ thống màu sắc trạng thái (WCAG AA Compliant)
- `COUNTING`: `bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 font-bold`
- `RECOUNT`: `bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold`
- `PENDING_APPROVAL`: `bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold`
- `APPROVED` / `CLOSED`: `bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold`
- `DRAFT`: `bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 font-medium`

### 1.5 Component & Interaction chi tiết
- **Row Actions:** Nút Mở Bàn Đếm Hiện Trường (`Edit3`), Nút Xem Chi Tiết 360 (`Eye`), Nút Đóng Băng / Mở Khóa Kho (`Lock`/`Unlock`), Nút Duyệt Phiên (`CheckCircle2`).
- **Rule #19 Compliance:** 100% hành động nhạy cảm (Duyệt phiên, Đóng băng kho, Khóa sổ) kích hoạt qua `ConfirmDialog` với thông điệp giải thích tính bất biến và tác động số dư.
- **Export Excel:** Sử dụng thư viện `xlsx` xuất file định dạng `.xlsx` với tiêu đề và dữ liệu đầy đủ.

### 1.6 Trạng thái hệ thống (System States)
- `L3ContentState` hỗ trợ:
  - Skeleton loading 5 dòng với hiệu ứng xung `animate-pulse`.
  - Empty state với icon `Boxes`, thông điệp "Không tìm thấy dữ liệu phiên kiểm kê", nút CTA "Tạo phiên mới".
  - Error state với nút "Thử lại".

### 1.7 Bằng chứng trích xuất mã nguồn (Raw Code Extract)
```tsx
// Bằng chứng trích xuất từ StocktakeMasterSessionsTab.tsx
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
- **L1 Command Bar:** Chọn phiên kiểm kê active, Ô quét mã Barcode/QR Code nhanh, Bộ lọc Vị trí Kệ (Bin Location) và Trạng thái đếm (`ALL`, `PENDING`, `COUNTED`, `RECOUNT_REQUIRED`), Nút Lưu đồng loạt.
- **L2 KPI Strip:** 4 thẻ đo lường: Tổng dòng SKU cần đếm, Đã nhập số lượng đếm, Số dòng lệch chờ kiểm tra, Tỷ lệ hoàn thành đếm %.
- **L3 Interactive Grid:** Bảng dữ liệu hỗ trợ **Inline Editing** trực tiếp trên từng ô số lượng thực đếm (`actualQty`), hỗ trợ phím nóng `Enter` (Lưu) và `Escape` (Hủy), hiển thị rõ Đơn vị tính (UOM) bên cạnh.

### 1.2 Typography & Định dạng số
- **Mã SKU & Barcode:** `font-mono font-bold text-xs text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600`
- **Vị trí Kệ (Bin):** `font-mono font-bold text-xs text-indigo-700 dark:text-indigo-300`
- **Số lượng đếm:** `font-mono tabular-nums font-bold text-xs text-right`
- **Chế độ Blind Count:** Ẩn số lượng sổ sách (`*** Blind ***`) để đảm bảo tính khách quan 100% của kiểm đếm viên hiện trường.

### 1.3 Quy chuẩn Inline Editing Chuẩn (Enter / Escape / UOM)
```tsx
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
- **L1 Command Bar:** Lọc theo mức độ nghiêm trọng chênh lệch (Vượt ngưỡng dung sai `isExceedTolerance`, Lệch âm mất mát, Lệch dương dôi dư), Lọc theo Nguyên nhân gốc rễ (`MISPLACEMENT`, `SHRINKAGE`, `DAMAGE`, `DATA_ENTRY`), Nút Đề xuất Bút Toán Điều Chỉnh M20.
- **L2 KPI Strip:** Tổng giá trị lệch Net (VND), Tổng số dòng lệch vượt dung sai, Giá trị thất thoát cần giải trình, Giá trị dôi dư cần nhập kho.
- **L3 Data Grid:** Bảng đối soát chi tiết giữa Sổ sách M17 và Thực tế đếm, tính toán % sai lệch và giá trị thành tiền tự động.

### 1.2 Định dạng & Màu sắc trạng thái
- **Lệch Âm (Thất thoát / Hỏng):** `text-rose-600 dark:text-rose-400 font-mono font-bold`
- **Lệch Dương (Dôi dư):** `text-emerald-600 dark:text-emerald-400 font-mono font-bold`
- **Khớp 100%:** `text-slate-600 dark:text-slate-400 font-mono`
- **Huy hiệu Vượt dung sai:** `bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold px-2 py-0.5 rounded-full text-[10px]`

---

## TAB 4 — PHÂN CÔNG ĐỘI ĐẾM (TASK ASSIGNMENT & SLA)

### 1.1 Cấu trúc bố cục
- **L1 Command Bar:** Tìm kiếm mã nhiệm vụ, lọc theo Dãy kệ / Khu vực (Zone A, Zone B, Zone C), lọc theo Người kiểm đếm (Assignee), Nút Phân Công Nhiệm Vụ Mới.
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
- **L1 Command Bar:** Tìm kiếm số chứng từ bút toán, lọc Loại điều chỉnh (`LOSS_WRITEOFF`, `SURPLUS_RECOGNITION`, `DAMAGED_SCRAP`), Lọc Tài khoản Sổ cái GL (TK 1561, TK 632, TK 1388, TK 3381), Nút Xuất Sổ Cái Excel.
- **L2 KPI Strip:** Tổng số bút toán đã khóa sổ, Tổng giá trị ghi giảm tài sản (Nợ 632/1388), Tổng giá trị ghi tăng tài sản (Có 1561/3381), Toàn vẹn mã băm SHA-256 (100% Verified).
- **L3 Data Grid:** Bảng nhật ký bút toán kiểm toán bất biến, hiển thị Mã băm Blockchain / SHA-256 Checksum, Tài khoản Nợ / Có, Người phê duyệt và Thời gian ghi sổ `Asia/Ho_Chi_Minh`.

---

## TỔNG KẾT NGUYÊN TẮC SAO CHÉP CHUẨN SANG M20 (PHASE 3 BLUEPRINT)
1. Giữ nguyên 100% hệ thống màu WCAG AA, hiệu ứng hover dòng `hover:bg-slate-100/80 dark:hover:bg-slate-700/60`, chỉ báo viền trái `border-l-4`.
2. Áp dụng chuẩn `font-mono tabular-nums font-bold text-right` cho 100% số lượng, đơn giá, giá trị điều chỉnh.
3. Thay thế 100% `window.alert/confirm` bằng `ConfirmDialog.tsx`.
4. Thiết kế M20 gồm 5 Tab tương ứng:
   - Tab 1: **Phiếu Điều Chỉnh & Danh Sách Chứng Từ** (Master List & Drawer 360)
   - Tab 2: **Bàn Lập Phiếu & Nhập Liệu Chênh Lệch Nhanh** (Inline Editing + Realtime M17 Snapshot)
   - Tab 3: **Hội Đồng Phê Duyệt & Đối Soát Sổ Kho M17** (Approval Desk & Single Writer Post)
   - Tab 4: **Phân Loại Nguyên Nhân & Thất Thoát Hao Hụt** (Reason Analytics & Cost Center)
   - Tab 5: **Sổ Cái Bút Toán Kho & Kiểm Toán Bất Biến** (GL Audit Trail & SHA-256 Ledger)
