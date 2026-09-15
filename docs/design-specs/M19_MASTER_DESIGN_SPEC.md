# NEXUSSYNC ERP — MASTER DESIGN SPECIFICATION
# MODULE M19: WMS STOCKTAKE & BLIND COUNT WORKSPACE
## SINGLE SOURCE OF TRUTH (SSOT) — CHUẨN MỰC THIẾT KẾ UI/UX TÁI SỬ DỤNG TOÀN HỆ THỐNG

- **Mã Tài Liệu:** `/docs/design-specs/M19_MASTER_DESIGN_SPEC.md`
- **Module Nguồn:** M19 (Warehouse Management System — Stocktake & Blind Count)
- **Kiến Trúc Áp Dụng:** Vỏ hệ thống đa tầng L0 - L4, 29 Workspaces NexusSync ERP
- **Quy Tắc Quản Trị Cốt Lõi:**
  - **Rule #01**: Architecture First, Domain Authority Mapping
  - **Rule #03**: Single Writer Inventory (`postTransaction()`) & Accounting GL Authority
  - **Rule #19**: WCAG AA Compliance, Contrast Ratio ≥ 4.5:1, Table Row Hover, Inline Editing, Thay thế 100% mặc định của trình duyệt bằng `ConfirmDialog.tsx`
  - **Rule #20**: Full UI/UX Module Replication Protocol (100% detail fidelity)
- **Phiên Bản:** 2.0 (Toàn Diện & Chi Tiết Tuyệt Đối Từng Tab)

---

## BƯỚC 1: KIỂM KÊ TOÀN BỘ 6 TAB CỦA MODULE M19

Trích xuất trực tiếp từ component điều hướng trung tâm `/src/components/workspaces/M19StocktakeWorkspace.tsx`:

| STT | Tab ID | Tên Tab Chức Năng | File Component Nguồn | Vai Trò & Nghiệp Vụ Cốt Lõi |
|---|---|---|---|---|
| 1 | `sessions` | **Phiên Kiểm Kê (Master Sessions)** | `StocktakeMasterSessionsTab.tsx` | Quản lý vòng đời phiên kiểm kê kho (Khởi tạo -> Đếm -> Đối soát -> Khóa sổ); Bộ lọc kho & trạng thái; KPI Strip; Drawer 360 chi tiết; Xuất Excel; Modal tạo phiên; Phê duyệt đóng phiên với `ConfirmDialog`. |
| 2 | `field_count` | **Bàn Đếm Hiện Trường (Field Execution)** | `StocktakeFieldExecutionTab.tsx` | Nhập liệu kiểm đếm hiện trường thời gian thực; Inline Editing (Enter lưu, Escape hủy); Chế độ Blind Count (Ẩn số tồn sổ sách); Kiểm tra tình trạng niêm phong (Seal Check); Quét mã vạch LPN/Bin Barcode Scanner; Đánh dấu đếm lại (Recount). |
| 3 | `variance` | **Đối Soát Chênh Lệch (Variance Reconciliation)** | `StocktakeVarianceReconciliationTab.tsx` | Bảng phân tích sai lệch giữa sổ sách và thực tế; Phân loại nguyên nhân gốc rễ (Misplacement, Shrinkage, Damage, Data Entry); Ngưỡng dung sai (Tolerance Threshold); Phát hành lệnh đếm lại (Recount) hoặc đề xuất bút toán điều chỉnh kho; Phê duyệt ghi sổ với `ConfirmDialog`. |
| 4 | `assignments` | **Phân Công Nhiệm Vụ (Task Assignments)** | `StocktakeTaskAssignmentTab.tsx` | Ma trận phân bổ nhân sự kiểm kê theo Zone và Dãy Kệ (Bin Range); Cơ chế đối chiếu chéo bắt buộc (Primary Assignee & Cross-Check Counter); Thanh tiến độ SKU theo vùng; Giám sát thời hạn cam kết SLA; Modal phân công / điều chuyển nhân sự. |
| 5 | `schedules` | **Lịch Định Kỳ & Đóng Băng Kho (Schedules & Freeze)** | `StocktakeSchedulesTab.tsx` | Thiết lập lịch kiểm kê định kỳ (Hàng năm, Quý, Cycle Count hàng tháng, ABC hàng tuần); Cơ chế tự động đóng băng xuất nhập tồn (Auto-Freeze Stock); Cấu hình ngưỡng dung sai cảnh báo; Khởi chạy phiên kiểm kê tức thì với `ConfirmDialog`. |
| 6 | `ledger` | **Sổ Cái Bất Biến (GL Audit Trail & Ledger)** | `StocktakeLedgerHistoryTab.tsx` | Nhật ký kế toán chứng từ điều chỉnh tồn kho đã khóa sổ; Định khoản kép Nợ/Có (TK 156, TK 1388, TK 3381, TK 632); Mã băm bảo mật bất biến SHA-256 (Blockchain Hash); Xuất biên bản sổ cái kiểm toán Excel chuẩn kiểm toán nhà nước. |

---

## BƯỚC 2: ĐẶC TẢ CHI TIẾT TUYỆT ĐỐI CHO TỪNG TAB

---

### TAB 1: PHIÊN KIỂM KÊ (MASTER SESSIONS)
**File Component:** `/src/components/workspaces/stocktake/StocktakeMasterSessionsTab.tsx`

#### 2.1 Bố cục phân tầng (Layout Hierarchy)
- **Tầng L0 (Workspace Banner Header):**
  Thẻ tổng quan workspace, chip định danh M19, huy hiệu tuân thủ Rule #19 và thời gian đồng bộ.
- **Tầng L1 (Command Bar & Filter Strip):**
  Thanh công cụ chứa ô tìm kiếm SKU/Phiên/Kho, bộ lọc kho dropdown, bộ lọc trạng thái dropdown, nút xuất Excel, nút làm mới và nút tạo phiên kiểm kê mới.
- **Tầng L2 (KPI Summary Metric Strip):**
  Bố cục lưới 4 cột hiển thị: Tổng Phiên Kiểm Kê, Đang Thực Hiện, Chờ Phê Duyệt Khóa Sổ, Tỷ Lệ Chính Xác Kho.
- **Tầng L3 (Master Data Table & Drawer 360):**
  Bao bọc bởi `L3ContentState` hiển thị bảng dữ liệu với đường viền trạng thái dòng `border-l-4`, click vào dòng để mở Drawer 360 trượt từ phải sang.
- **Tầng L4 (Sticky Pagination Control):**
  Thanh phân trang cố định dưới chân bảng (`PaginationControl`).

**Đoạn JSX thực tế đại diện Tầng L1 & L2 (Tab 1):**
```tsx
{/* L1: COMMAND BAR & FILTER STRIP */}
<div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
  <div className="flex flex-1 items-center gap-2.5 w-full md:w-auto flex-wrap">
    <div className="relative flex-1 min-w-[200px] max-w-xs">
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
      <input
        type="text"
        placeholder="Tìm kiếm mã phiên, tên kho, người tạo..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <select
      value={warehouseFilter}
      onChange={(e) => setWarehouseFilter(e.target.value)}
      className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
    >
      <option value="ALL">Tất cả Kho Lưu Trữ</option>
      <option value="WH-HN-01">Kho Tổng Hà Nội (Miền Bắc)</option>
      <option value="WH-HCM-02">Kho Chi nhánh Nam (Bình Dương)</option>
      <option value="WH-CNC-03">Kho Cơ khí & Phụ tùng CNC</option>
    </select>

    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
    >
      <option value="ALL">Tất cả Trạng Thái</option>
      <option value="IN_PROGRESS">Đang Thực Hiện</option>
      <option value="PENDING_APPROVAL">Chờ Phê Duyệt</option>
      <option value="COMPLETED">Đã Hoàn Tất</option>
    </select>
  </div>

  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
    <button
      onClick={handleExportExcel}
      className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
      title="Xuất Danh Sách Excel"
    >
      <Download className="w-3.5 h-3.5 text-emerald-600" />
      <span className="hidden sm:inline">Xuất Excel</span>
    </button>
    <button
      onClick={handleRefresh}
      className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
      title="Làm mới dữ liệu"
    >
      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
    </button>
    <button
      onClick={() => setShowCreateModal(true)}
      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
    >
      <Plus className="w-4 h-4" />
      <span>Tạo Phiên Mới</span>
    </button>
  </div>
</div>
```

#### 2.2 Typography
- Tiêu đề thẻ / bảng: `text-xs font-semibold text-slate-900 dark:text-white`.
- Mã chứng từ: `font-mono text-xs font-bold text-blue-600 dark:text-blue-400`.
- Nhãn chỉ số KPI: `text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider`.
- Giá trị chỉ số: `text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums`.
- Số liệu phần trăm / chênh lệch: `font-mono tabular-nums font-bold text-xs`.

#### 2.3 Định dạng số liệu & tiền tệ
- Dấu phân cách hàng nghìn bằng dấu chấm: `val.toLocaleString('vi-VN')`.
- Đơn vị tiền tệ: `₫` đặt ở cuối giá trị.
- Tỷ lệ chênh lệch: `+` cho dương, `-` cho âm kèm dấu `%`.

#### 2.4 Token màu sắc trạng thái (WCAG AA)
- `IN_PROGRESS`: `bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 font-bold px-2 py-0.5 rounded-full text-[11px] border`
- `PENDING_APPROVAL`: `bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold px-2 py-0.5 rounded-full text-[11px] border`
- `COMPLETED`: `bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold px-2 py-0.5 rounded-full text-[11px] border`
- Viền chỉ báo trạng thái dòng:
  - Khi được chọn: `border-l-4 border-blue-600 bg-blue-50/80 dark:bg-slate-700/90`
  - Bình thường: `border-l-4 border-transparent`

#### 2.5 Component & Interaction chi tiết
- **Drawer 360 Chi Tiết:**
  Mở khi click vào dòng hoặc nút `Eye`, hiển thị thông tin 360 độ gồm: Mã phiên, Kho lưu trữ, Người lập, Thời gian, Tỷ lệ tiến độ đếm, Danh sách các Bin liên quan và các hành động Duyệt Khóa Sổ.
- **Quy chuẩn Rule #19 (ConfirmDialog):**
  ```tsx
  setConfirmDialog({
    isOpen: true,
    title: `Phê Duyệt Đóng Phiên Kiểm Kê ${session.code}?`,
    message: `Thao tác này sẽ khóa toàn bộ dữ liệu kiểm kê hiện trường, tính toán chênh lệch tồn cuối cùng và tạo các bút toán điều chỉnh sổ cái theo Rule #03. Bạn có chắc chắn muốn phê duyệt?`,
    onConfirm: () => {
      // Thực thi logic duyệt
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    }
  });
  ```

#### 2.6 System States (L3ContentState)
```tsx
<L3ContentState
  isLoading={isLoading}
  error={error}
  isEmpty={filteredSessions.length === 0}
  onRetry={handleRefresh}
  emptyTitle="Không tìm thấy phiên kiểm kê nào"
  emptyDescription="Thử thay đổi bộ lọc tìm kiếm hoặc tạo phiên kiểm kê mới cho kho của bạn."
  emptyAction={{
    label: 'Tạo phiên kiểm kê mới',
    onClick: () => setShowCreateModal(true),
    variant: 'primary'
  }}
  skeletonRows={5}
  minHeight="min-h-[380px]"
>
  {/* Data Table */}
</L3ContentState>
```

---

### TAB 2: BÀN ĐẾM HIỆN TRƯỜNG (FIELD EXECUTION)
**File Component:** `/src/components/workspaces/stocktake/StocktakeFieldExecutionTab.tsx`

#### 2.1 Bố cục phân tầng (Layout Hierarchy)
- **Tầng L1 (Command Bar & Barcode Scanning Strip):**
  Bao gồm ô tìm kiếm, chọn phiên đang mở, lọc vị trí Kệ (Bin Location), trạng thái kiểm đếm, thanh quét mã vạch Barcode/LPN Scanner giả lập hiện trường, nút xuất biên bản Excel.
- **Tầng L2 (Execution KPI Summary Strip):**
  4 thẻ KPI: Tổng Vị Trí / SKU Đếm, Đã Hoàn Tất Kiểm Đếm, Chờ Đếm / Đang Nhập, Yêu Cầu Đếm Lại (Recount).
- **Tầng L3 (Interactive Field Grid with Inline Editing):**
  Bảng nhập liệu hiện trường hỗ trợ Inline Editing trực tiếp trên ô số lượng: Nhập số -> Phím Enter lưu -> Phím Escape hủy.
- **Tầng L4 (Sticky Pagination Control):**
  Phân trang cố định.

**Đoạn JSX thực tế Inline Editing & Row Status (Tab 2):**
```tsx
<tr 
  key={item.id} 
  className={`transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 ${
    isEditing 
      ? 'border-l-4 border-blue-600 bg-blue-50/70 dark:bg-slate-700/80 shadow-2xs' 
      : isRecount
      ? 'border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
      : isCounted
      ? 'border-l-4 border-emerald-500/50 bg-emerald-50/10 dark:bg-emerald-950/10'
      : 'border-l-4 border-transparent'
  }`}
>
  {/* Bin Location */}
  <td className="py-2.5 px-3">
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs font-bold text-amber-950 dark:text-amber-100 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700">
        {item.binLocation}
      </span>
    </div>
    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
      {item.lpnCode}
    </div>
  </td>

  {/* Blind Mode Masking */}
  <td className="py-2.5 px-3 text-center font-mono tabular-nums">
    {item.blindMode && item.status === 'PENDING' ? (
      <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium italic bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600 text-[11px]">
        <Lock className="w-3 h-3 text-slate-500 dark:text-slate-400" /> Ẩn Số Liệu
      </span>
    ) : (
      <span className="font-bold text-slate-900 dark:text-white">
        {item.systemQty.toLocaleString('vi-VN')}
      </span>
    )}
  </td>

  {/* Inline Count Input Cell */}
  <td className="py-2 px-3 text-center">
    {isEditing ? (
      <div className="inline-flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-lg border border-blue-400 dark:border-blue-500 shadow-sm">
        <input
          type="number"
          min="0"
          step="any"
          value={tempActualQty}
          onChange={(e) => setTempActualQty(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveCount(item);
            if (e.key === 'Escape') setEditingItemId(null);
          }}
          autoFocus
          placeholder="0"
          className="w-24 px-2 py-1 text-xs font-mono font-bold text-center text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 pr-1">
          {item.uom}
        </span>
        <button
          onClick={() => handleSaveCount(item)}
          className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors cursor-pointer shadow-2xs"
          title="Lưu số đếm (Enter)"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      </div>
    ) : (
      <div>
        {item.actualQty !== null ? (
          <span className="inline-flex items-center font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-950 dark:bg-blue-900/70 dark:text-blue-100 border border-blue-300 dark:border-blue-700">
            {item.actualQty.toLocaleString('vi-VN')} {item.uom}
          </span>
        ) : (
          <span className="text-slate-500 dark:text-slate-400 italic text-[11px]">
            Chưa nhập đếm
          </span>
        )}
      </div>
    )}
  </td>
</tr>
```

#### 2.2 Typography
- Mã Bin Kệ: `font-mono text-xs font-bold`.
- Số lượng nhập: `font-mono font-bold text-xs text-center`.
- Nhãn Blind Count: `italic font-medium text-[11px]`.

#### 2.3 Định dạng số liệu & tiền tệ
- Đơn vị tính: Đi kèm ngay sau số lượng (`item.uom`).
- Số lượng: Định dạng `vi-VN` với phân cách hàng nghìn.

#### 2.4 Token màu sắc trạng thái (WCAG AA)
- `PENDING`: `bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200`
- `COUNTED`: `bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200`
- `VERIFIED`: `bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200`
- `RECOUNT_REQUIRED`: `bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 font-bold`
- Tình trạng niêm phong:
  - `INTACT` (Nguyên vẹn): `bg-emerald-100 text-emerald-950 border-emerald-300`
  - `BROKEN` (Rách niêm): `bg-rose-100 text-rose-950 border-rose-300`

#### 2.5 Component & Interaction chi tiết
- **Barcode / LPN Scanner Bar:** Cho phép nhập mã Barcode và nhấn Enter để focus tự động vào dòng SKU tương ứng.
- **Hotkeys:** Hỗ trợ phím nóng `Enter` để lưu số đếm và `Escape` để hủy bỏ trạng thái chỉnh sửa.
- **ConfirmDialog cho yêu cầu Đếm lại:**
  Xác nhận chuyển trạng thái sang `RECOUNT_REQUIRED` trước khi gửi thông báo cho đội kiểm đếm hiện trường.

---

### TAB 3: ĐỐI SOÁT CHÊNH LỆCH (VARIANCE RECONCILIATION)
**File Component:** `/src/components/workspaces/stocktake/StocktakeVarianceReconciliationTab.tsx`

#### 2.1 Bố cục phân tầng (Layout Hierarchy)
- **Tầng L1 (Command Bar & Filter Strip):**
  Ô tìm kiếm, lọc theo phiên kiểm kê, lọc theo nhóm nguyên nhân gốc rễ, lọc theo trạng thái xử lý, nút xuất biên bản đối soát Excel.
- **Tầng L2 (Variance KPI Cards):**
  4 thẻ: Tổng SKU Có Chênh Lệch, Vượt Ngưỡng Dung Sai (Tolerance), Đang Yêu Cầu Đếm Lại, Giá Trị Hao Hụt Ròng (VNĐ).
- **Tầng L3 (Variance Reconciliation Table):**
  Hiển thị chi tiết Tồn Sổ vs Thực Đếm, Lệch Số Lượng, Tỷ Lệ Lệch %, Đơn Giá Vốn, Giá Trị Chênh Lệch VNĐ, Nguyên Nhân Gốc, Hành Động Duyệt Hạch Toán hoặc Yêu Cầu Đếm Lại.
- **Tầng L4 (Sticky Pagination Control).**

**Đoạn JSX thực tế Row Indicators & Actions (Tab 3):**
```tsx
<tr 
  key={record.id} 
  className={`transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 ${
    isExceed
      ? 'border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
      : isLoss
      ? 'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10'
      : isGain
      ? 'border-l-4 border-emerald-500 bg-emerald-50/15 dark:bg-emerald-950/10'
      : 'border-l-4 border-transparent'
  }`}
>
  <td className="py-2.5 px-3">
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
        {record.sku}
      </span>
    </div>
    <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
      {record.sessionCode}
    </div>
  </td>

  {/* Chênh lệch SL & % */}
  <td className="py-2.5 px-2 text-center whitespace-nowrap">
    <div className={`font-mono font-bold ${record.varianceQty < 0 ? 'text-rose-700 dark:text-rose-300' : record.varianceQty > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
      {record.varianceQty > 0 ? '+' : ''}{record.varianceQty}
    </div>
    <div className={`text-[10px] font-mono ${record.isExceedTolerance ? 'text-rose-700 dark:text-rose-300 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
      ({record.variancePercent > 0 ? '+' : ''}{record.variancePercent}%)
    </div>
  </td>

  {/* Giá trị lệch VNĐ */}
  <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono tabular-nums font-bold">
    <span className={record.varianceValue < 0 ? 'text-rose-700 dark:text-rose-300' : record.varianceValue > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}>
      {record.varianceValue > 0 ? '+' : ''}{record.varianceValue.toLocaleString('vi-VN')} ₫
    </span>
  </td>

  {/* Root Cause Badge */}
  <td className="py-2.5 px-3 whitespace-nowrap">
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${rootCauseBadge.className}`}>
      {rootCauseBadge.label}
    </span>
  </td>

  {/* Thao tác */}
  <td className="py-2.5 px-3 text-center whitespace-nowrap">
    <div className="flex items-center justify-center gap-1">
      {record.status === 'RECOUNT_REQUESTED' ? (
        <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
          <RotateCcw className="w-3 h-3 animate-spin" /> Đang đếm lại
        </span>
      ) : record.status === 'ADJUSTMENT_PROPOSED' ? (
        <button
          onClick={() => handleApproveAdjustment(record)}
          className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
          title="Duyệt hạch toán điều chỉnh"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Duyệt Hạch Toán</span>
        </button>
      ) : (
        <button
          onClick={() => handleRequestRecount(record)}
          className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
          title="Yêu cầu đếm lại"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Đếm Lại</span>
        </button>
      )}
    </div>
  </td>
</tr>
```

#### 2.2 Typography
- Cột số lượng chênh lệch: `font-mono font-bold text-xs`.
- Cột giá trị chênh lệch (VNĐ): `font-mono tabular-nums font-bold text-right`.

#### 2.3 Token màu sắc nguyên nhân gốc rễ (Root Cause)
- `MISPLACEMENT` (Để nhầm kệ): `text-amber-950 bg-amber-100 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700`
- `SHRINKAGE` (Thất thoát / Hao hụt): `text-rose-950 bg-rose-100 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold`
- `DAMAGE` (Hỏng hóc / Phế phẩm): `text-orange-950 bg-orange-100 border-orange-300 dark:bg-orange-950/90 dark:text-orange-200 dark:border-orange-700`
- `DATA_ENTRY` (Sai sót nhập liệu ERP): `text-blue-950 bg-blue-100 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700`
- `PENDING_INVESTIGATION`: `text-slate-800 bg-slate-100 border-slate-300 dark:bg-slate-700 dark:text-slate-200`

---

### TAB 4: PHÂN CÔNG NHIỆM VỤ (TASK ASSIGNMENTS)
**File Component:** `/src/components/workspaces/stocktake/StocktakeTaskAssignmentTab.tsx`

#### 2.1 Bố cục phân tầng (Layout Hierarchy)
- **Tầng L1 (Command Bar & Filter Strip):**
  Tìm kiếm theo mã task/nhân viên, lọc theo Vùng/Zone, lọc mức độ ưu tiên, lọc trạng thái nhiệm vụ, nút phân công nhiệm vụ mới.
- **Tầng L2 (Task Assignment KPI Cards):**
  Tổng Nhiệm Vụ Phân Công, Đang Kiểm Đếm & Đếm Chéo, Đã Hoàn Tất Khu Vực, Ưu Tiên Khẩn Cấp.
- **Tầng L3 (Task Matrix Data Table):**
  Bảng quản lý cặp nhân sự kiểm đếm chéo (Primary vs Secondary), thanh tiến độ SKU trực quan dạng mini-progress bar, hạn chót SLA 4h, nút Hoàn Tất / Sửa.
- **Tầng L4 (Sticky Pagination Control).**

**Đoạn JSX thực tế Dual Counter & Progress Bar (Tab 4):**
```tsx
{/* Cặp Nhân Viên Đối Chiếu Chéo */}
<td className="py-2.5 px-3">
  <div className="flex items-center gap-1 text-slate-900 dark:text-white font-medium text-xs">
    <span className="text-blue-700 dark:text-blue-400 font-bold">1:</span> {task.primaryAssignee}
  </div>
  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 text-[10px]">
    <span className="text-purple-700 dark:text-purple-400 font-bold">2:</span> {task.secondaryAssignee}
  </div>
</td>

{/* Tiến Độ SKU & Progress Bar */}
<td className="py-2.5 px-2 text-center whitespace-nowrap">
  <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-xs">
    {task.completedSkus}/{task.totalSkusInZone} SKU
  </div>
  <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1 rounded-full mx-auto mt-1 overflow-hidden">
    <div 
      className="bg-blue-600 h-full rounded-full transition-all"
      style={{ width: `${(task.completedSkus / task.totalSkusInZone) * 100}%` }}
    />
  </div>
</td>
```

#### 2.2 Token màu sắc độ ưu tiên & trạng thái
- `URGENT`: `bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold`
- `HIGH`: `bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold`
- `NORMAL`: `bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200`
- `DOUBLE_CHECKING` (Đang đếm chéo): `bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200 font-bold`

---

### TAB 5: LỊCH ĐỊNH KỲ & ĐÓNG BĂNG KHO (SCHEDULES & FREEZE)
**File Component:** `/src/components/workspaces/stocktake/StocktakeSchedulesTab.tsx`

#### 2.1 Bố cục phân tầng (Layout Hierarchy)
- **Tầng L1 (Command Bar & Filter Strip):**
  Tìm kiếm lịch, lọc theo kho lưu trữ, lọc theo tần suất (Annual, Quarterly, Monthly Cycle, Weekly ABC), nút thiết lập lịch mới.
- **Tầng L2 (Schedule KPI Metric Strip):**
  Tổng Lịch Định Kỳ, Tần Suất Cycle Count, Đóng Băng Kho Tự Động, Dung Sai Cho Phép TB %.
- **Tầng L3 (Schedule Management Table & Auto-Freeze Trigger):**
  Bảng danh sách lịch định kỳ với nhãn phương thức kiểm đếm (Blind, Double Blind, Open), ngày chạy kế tiếp, nút Chạy Phiên Ngay và Sửa Cấu Hình.
- **Tầng L4 (Sticky Pagination Control).**

**Đoạn JSX thực tế Trigger Now với ConfirmDialog (Tab 5):**
```tsx
const handleTriggerNow = (sch: StocktakeSchedule) => {
  setConfirmDialog({
    isOpen: true,
    title: `Khởi Kích Hoạt Phiên Kiểm Kê Ngay?`,
    message: `Hệ thống sẽ tạo ngay một Phiên Kiểm Kê chính thức dựa trên cấu hình "${sch.name}". ${sch.autoFreezeStock ? 'CẢNH BÁO: Vị trí liên quan sẽ tự động bị đóng băng xuất nhập tồn.' : ''}`,
    onConfirm: () => {
      setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      onNotify('success', 'Đã Kích Hoạt Phiên Kiểm Kê', `Khởi tạo phiên kiểm kê thành công cho ${sch.warehouseName}.`);
    }
  });
};
```

---

### TAB 6: SỔ CÁI BẤT BIẾN (GL AUDIT TRAIL & LEDGER)
**File Component:** `/src/components/workspaces/stocktake/StocktakeLedgerHistoryTab.tsx`

#### 2.1 Bố cục phân tầng (Layout Hierarchy)
- **Tầng L1 (Command Bar & Audit Filter Strip):**
  Tìm kiếm theo số bút toán/mã hash/phiên, lọc theo kho, lọc theo loại bút toán (Hao hụt TK 1388, Dôi thừa TK 3381, Xuất hủy TK 632), nút xuất Sổ Cái GL Excel.
- **Tầng L2 (GL Audit KPI Summary Strip):**
  Tổng Chứng Từ Điều Chỉnh, Xác Thực Bất Biến SHA-256 (100%), Tổng SKU Đã Điều Chỉnh, Tổng Giá Trị Hạch Toán GL (VNĐ).
- **Tầng L3 (Immutable Ledger Table):**
  Bảng hiển thị số bút toán, phiên kiểm kê, ngày ghi sổ, định khoản Nợ/Có tài khoản kế toán, số SKU, giá trị hạch toán VNĐ, mã băm SHA-256 rút gọn kèm icon `Hash`, huy hiệu khóa sổ `Đã Ghi Sổ GL`.
- **Tầng L4 (Sticky Pagination Control).**

**Đoạn JSX thực tế GL Ledger Entry & Blockchain Hash (Tab 6):**
```tsx
{/* Định Khoản Kế Toán GL Nợ / Có */}
<td className="py-2.5 px-3">
  <div className="text-[11px] font-mono text-slate-900 dark:text-white font-medium">
    <span className="font-bold text-blue-700 dark:text-blue-400">Nợ:</span> {record.glAccountDebit}
  </div>
  <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-medium">
    <span className="font-bold text-emerald-700 dark:text-emerald-400">Có:</span> {record.glAccountCredit}
  </div>
</td>

{/* Giá trị hạch toán */}
<td className="py-2.5 px-3 text-right whitespace-nowrap font-mono tabular-nums font-bold text-slate-900 dark:text-white">
  {record.totalAmount.toLocaleString('vi-VN')} ₫
</td>

{/* Mã Hash Bất Biến SHA-256 */}
<td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 dark:text-slate-400 max-w-[140px] truncate" title={record.blockchainHash}>
  <div className="flex items-center gap-1">
    <Hash className="w-3 h-3 text-emerald-600 shrink-0" />
    <span className="truncate">{record.blockchainHash.slice(0, 14)}...</span>
  </div>
</td>

{/* Trạng thái Bất Biến */}
<td className="py-2.5 px-2 text-center whitespace-nowrap">
  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
    <Lock className="w-3 h-3 mr-1" /> Đã Ghi Sổ GL
  </span>
</td>
```

---

## BƯỚC 3: QUY TẮC BẮT BUỘC CONFIRM DIALOG (RULE #19)

### 3.1 Cấm Tuyệt Đối Hàm Trình Duyệt Mặc Định
- **KHÔNG ĐƯỢC PHÉP**: Gọi `window.alert()`, `alert()`, `window.confirm()`, `confirm()`, `window.prompt()`.
- **HẬU QUẢ NẾU VI PHẠM**: Trình duyệt có thể chặn cửa sổ popup trong iframe, gây đóng băng luồng giao diện người dùng và vi phạm trực tiếp Quy tắc Kiểm soát Trực quan Doanh nghiệp (Enterprise Visual Governance).

### 3.2 Chuẩn Khởi Tạo Component `ConfirmDialog.tsx`
Tất cả các hành động Phê duyệt, Xóa, Đóng phiên, Yêu cầu đếm lại hoặc Kích hoạt lịch đều phải quản lý state và gọi `ConfirmDialog` như sau:

```tsx
// 1. Khai báo state chuẩn
const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
  isOpen: false,
  title: '',
  message: '',
  onConfirm: () => {}
});

// 2. Mở dialog khi người dùng thực hiện thao tác nhạy cảm
const handleAction = (item: Entity) => {
  setConfirmDialog({
    isOpen: true,
    title: `Xác Nhận Thao Tác Cho ${item.code}?`,
    message: `Mô tả chi tiết tác động của hành vi lên hệ thống và dữ liệu sổ cái...`,
    variant: 'primary', // hoặc 'danger' | 'warning'
    onConfirm: () => {
      // Thực thi hành vi
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      onNotify('success', 'Thành Công', 'Thao tác đã được ghi nhận.');
    }
  });
};

// 3. Render ở cuối component tab
<ConfirmDialog 
  state={confirmDialog} 
  onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} 
/>
```

---

## BƯỚC 4: HỆ THỐNG TOKEN MÀU SẮC ĐẠT CHUẨN WCAG AA (CONTRAST RATIO ≥ 4.5:1)

Toàn bộ hệ thống màu sắc tuân thủ nghiêm ngặt bảng tra cứu sau nhằm đảm bảo khả năng hiển thị tương phản cao trong cả Light Mode và Dark Mode:

| Ý Nghĩa Nghiệp Vụ | Class Light Mode | Class Dark Mode | Viền Trạng Thái Bảng |
|---|---|---|---|
| **Thành công / Đã Duyệt / Nguyên vẹn** | `bg-emerald-100 text-emerald-950 border-emerald-300 font-bold` | `dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700` | `border-l-4 border-emerald-500/60 bg-emerald-50/10` |
| **Nguy hiểm / Rách niêm / Hao hụt / Khẩn cấp** | `bg-rose-100 text-rose-950 border-rose-300 font-bold` | `dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700` | `border-l-4 border-rose-500 bg-rose-50/20` |
| **Cảnh báo / Chờ duyệt / Đóng băng kho** | `bg-amber-100 text-amber-950 border-amber-300 font-bold` | `dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700` | `border-l-4 border-amber-500 bg-amber-50/15` |
| **Đang chạy / Thực hiện / Chỉnh sửa inline** | `bg-blue-100 text-blue-900 border-blue-300 font-bold` | `dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700` | `border-l-4 border-blue-600 bg-blue-50/70` |
| **Đếm chéo / Đã đề xuất bút toán** | `bg-purple-100 text-purple-950 border-purple-300 font-bold` | `dark:bg-purple-950/90 dark:text-purple-200 dark:border-purple-700` | `border-l-4 border-purple-500/50` |
| **Bản nháp / Mặc định / Chưa đếm** | `bg-slate-100 text-slate-900 border-slate-300 font-medium` | `dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600` | `border-l-4 border-transparent` |

---

## BƯỚC 5: KẾT LUẬN & HƯỚNG DẪN TÁI SỬ DỤNG

Tài liệu này là **Bản Đặc Tả Thiết Kế Cố Định (Master Spec SSOT)** cho phân hệ M19. Mọi yêu cầu đồng bộ giao diện trong tương lai sang các module khác (như M08 Mua Hàng, M20 Điều Chỉnh Kho, M21 Điều Chuyển Kho, v.v.) **CHỈ CẦN THAM CHIẾU DUY NHẤT TÀI LIỆU NÀY** để:
1. Đảm bảo cấu trúc vỏ đa tầng L0 - L4 đồng nhất.
2. Tái tạo chính xác KPI Strip, Data Table với `border-l-4`, Drawer 360 và Inline Editing.
3. Tuyệt đối tuân thủ Rule #19 với component `ConfirmDialog.tsx`.
4. Áp dụng chuẩn font chữ Monospace tabular-nums cho dữ liệu số liệu và tiền tệ VNĐ.
