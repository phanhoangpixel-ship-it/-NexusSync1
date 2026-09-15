# NEXUSSYNC ERP — QUY TRÌNH & TEMPLATE HƯỚNG DẪN ĐỒNG BỘ GIAO DIỆN M09 & M10
## CHUẨN HÓA UI/UX CẤP ENTERPRISE THEO RULE #19, RULE #20, WCAG AA & NUMERIC TYPOGRAPHY

**Tài liệu tham chiếu:** `/docs/design-specs/M09_M10_UI_UX_SYNC_EXECUTION_GUIDE_TEMPLATE.md`  
**Bộ quy chuẩn chi phối:** 
- `GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md` (Rule #19: ConfirmDialog & Rule #20: Full Replication Protocol)
- `UI_UX_ENTERPRISE_DESIGN_STANDARDS_M18_M19.md` (Contrast, Row States, Inline Editing)
- `UI_UX_MODULE_FULL_REPLICATION_PROTOCOL.md` (Phase 0 -> Phase 4 Verification)

**Đối tượng áp dụng:**
- **Module M09:** Quản Trị Nhà Cung Cấp & Quan Hệ SRM (`Suppliers SRM Suite`)
- **Module M10:** Quản Trị Nguồn Cung Chiến Lược & Đấu Thầu (`Strategic Sourcing Suite`)
- **Module mẫu chuẩn nguồn:** M19 (Kiểm kê kho & Điều chỉnh tồn kho) / M18 (Trung tâm điều hành kho)

---

## 1. MỤC TIÊU & NGUYÊN TẮC BẤT BIẾN

### 1.1 Mục tiêu
Cung cấp bản hướng dẫn chi tiết từng bước (Step-by-step Execution Template) nhằm tái cấu trúc và đồng bộ hóa 100% diện mạo, trải nghiệm người dùng của **M09** và **M10** đạt chuẩn Enterprise cao nhất của NexusSync ERP:
1. Đảm bảo trải nghiệm đồng nhất với M18/M19 (Layout L0–L4, Pipeline quy trình, Thẻ KPI, Bảng dữ liệu, Phân trang).
2. Xóa bỏ hoàn toàn hộp thoại native trình duyệt (`window.alert`, `window.confirm`), thay thế bằng `ConfirmDialog` theo **Rule #19**.
3. Đạt chuẩn tương phản **WCAG AA** (tỷ lệ tương phản ≥ 4.5:1), hoạt động hoàn hảo trên cả **Light Mode** và **Dark Mode**.
4. Chuẩn hóa toàn bộ số liệu, mã định danh sang `font-mono tabular-nums font-bold`, căn phải và định dạng phân cách hàng nghìn chuẩn.

### 1.2 Nguyên tắc Tối thượng
> ⚠️ **TUYỆT ĐỐI KHÔNG LÀM THAY ĐỔI NGHIỆP VỤ (NO BUSINESS LOGIC REGRESSION):**  
> Quá trình đồng bộ UI CHỈ ĐƯỢC PHÉP tái cấu trúc lớp hiển thị (Presentation Layer). Nghiêm cấm thay đổi API schema, các mutation handler, logic tính toán, quyền hạn truy cập (RBAC), liên kết Context Rail, hoặc hệ thống phát sinh sự kiện Event Bus.

---

## 2. BỐN TIÊU CHUẨN THIẾT KẾ BẮT BUỘC (MANDATORY SPECS)

### 2.1 Tiêu Chuẩn 1: Tuân Thủ Tuyệt Đối Rule #19 (`ConfirmDialog`)
- **Cấm hoàn toàn:** `window.confirm()`, `window.alert()`, `window.prompt()`.
- **Bắt buộc:** Mọi tác vụ có nguy cơ mất dữ liệu, hủy chứng từ, lưu trữ đối tác, phê duyệt thầu phải sử dụng component `ConfirmDialog.tsx` (`src/components/common/ConfirmDialog.tsx`).
- **Cấu hình state mẫu:**
```tsx
const [confirmDialog, setConfirmDialog] = useState<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
}>({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Xác Nhận',
  cancelText: 'Hủy Bỏ',
  variant: 'primary',
  onConfirm: () => {},
});
```
- **Hàm đóng dialog chuẩn:**
```tsx
const closeConfirmDialog = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));
```
- **Mẫu gọi dialog cho tác vụ phá hủy (Danger Action):**
```tsx
const handleArchiveSupplierPrompt = (supplier: Supplier) => {
  setConfirmDialog({
    isOpen: true,
    title: `Lưu trữ Nhà cung cấp: ${supplier.name}?`,
    message: `Thao tác này sẽ chuyển trạng thái nhà cung cấp [${supplier.code}] sang ARCHIVED. Các gói thầu và đơn hàng chưa hoàn tất sẽ bị cảnh báo. Bạn có chắc chắn muốn thực hiện?`,
    confirmText: 'Lưu Trữ Đối Tác',
    cancelText: 'Hủy Thao Tác',
    variant: 'danger',
    onConfirm: async () => {
      closeConfirmDialog();
      await executeArchiveSupplier(supplier.id);
    }
  });
};
```

---

### 2.2 Tiêu Chuẩn 2: Độ Tương Phản WCAG AA & Dark Mode Parity
Mọi nhãn trạng thái (Badge/Pill) phải có viền rõ ràng (`border`), độ tương phản cao, chữ đậm (`font-bold`), không dùng chữ xám mờ trên nền màu:

```tsx
// 1. Success / Active / Approved / Tier A (Xanh ngọc lục bảo)
export const BADGE_SUCCESS = 
  "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold";

// 2. Warning / Pending / Under Review / Tier B (Vàng hổ phách)
export const BADGE_WARNING = 
  "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold";

// 3. Danger / Canceled / Blacklisted / Breach (Đỏ hồng)
export const BADGE_DANGER = 
  "bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold";

// 4. Info / Open RFQ / In Progress / Evaluating (Xanh dương)
export const BADGE_INFO = 
  "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 font-bold";

// 5. Purple Accent / Sourcing Matrix / Awarded (Tím phong cách Sourcing)
export const BADGE_PURPLE = 
  "bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200 dark:border-purple-700 font-semibold";

// 6. Neutral / Draft / Closed / Archived (Xám chì)
export const BADGE_NEUTRAL = 
  "bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 font-medium";

// 7. Monospace Code Pill (Dùng cho Mã NCC, Mã RFQ, Mã BID, Tax ID)
export const CODE_PILL = 
  "font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600";
```

---

### 2.3 Tiêu Chuẩn 3: Định Dạng Số Học & Monospace (`font-mono tabular-nums`)
Mọi trường dữ liệu số lượng, đơn giá, giá trị tiền tệ, phần trăm tỷ lệ, mã định danh phải tuân thủ nghiêm ngặt:

1. **Class bắt buộc:** `font-mono tabular-nums font-bold text-right` (trong cột bảng) hoặc `font-mono tabular-nums font-bold` (trong thẻ KPI).
2. **Căn lề:**
   - Text mô tả, tên đối tác: Căn trái (`text-left`).
   - Badge trạng thái, ngày tháng ngắn: Căn giữa (`text-center`).
   - Toàn bộ số tiền (VNĐ), số lượng, điểm OTIF, điểm kỹ thuật: Căn phải (`text-right`).
3. **Toán tử Nullish Coalescing (`??`):**
   - Nghiêm cấm dùng `value || '0'` vì nếu `value = 0` sẽ gây bug hiển thị sai hoặc mất số liệu.
   - Luôn sử dụng: `(value ?? 0).toLocaleString('vi-VN')`.
4. **Hàm format tiền tệ & tỷ lệ chuẩn:**
```tsx
// Format tiền VNĐ: "1.500.000 ₫"
export const formatCurrencyVN = (amount: number | null | undefined): string => {
  return `${(amount ?? 0).toLocaleString('vi-VN')} ₫`;
};

// Format tỷ lệ %: "98.5%"
export const formatPercent = (rate: number | null | undefined, digits: number = 1): string => {
  return `${(rate ?? 0).toFixed(digits)}%`;
};

// Format điểm số: "92.0 / 100"
export const formatScore = (score: number | null | undefined): string => {
  return `${(score ?? 0).toFixed(1)}`;
};
```

---

### 2.4 Tiêu Chuẩn 4: Phân Tầng Giao Diện 5 Lớp (Hierarchy Architecture L0 – L4)

| Tầng | Thành phần | Quy cách thiết kế chuẩn |
| :--- | :--- | :--- |
| **L0 Header** | Workspace Header Card | Thẻ bo góc `rounded-2xl`, nền gradient nhẹ, icon vuông bo góc `p-3 rounded-xl bg-blue-600` (M09) hoặc `bg-purple-600` (M10), badge module code, nút hành động (Làm mới, Xuất CSV, Boundary Button). |
| **L0 Pipeline** | Lifecycle Visualizer | Khung trực quan tiến trình nghiệp vụ 4-5 bước (`flex items-center gap-2`), biểu diễn luồng trạng thái từ khởi tạo đến hoàn tất. |
| **L1 Navigation** | Sub-tabs & Command Bar | Thanh chuyển Tab bo tròn `rounded-xl`, tab active có bóng đổ nhẹ `shadow-xs`; Command bar gồm tìm kiếm tức thời (với icon kính lúp) và dropdown lọc trạng thái có viền sắc nét. |
| **L2 KPIs** | Metric Cards Strip | Dải 4 thẻ KPI đồng nhất, icon đặt trong hộp nền mờ, giá trị số lớn `text-2xl font-bold font-mono tabular-nums`. |
| **L3 Table** | Enterprise Data Table | Bảng cuộn mượt, header `bg-slate-50 dark:bg-slate-800/80`, hover dòng `hover:bg-slate-100/80 dark:hover:bg-slate-700/60`, chỉ báo viền trái `border-l-4` theo trạng thái dữ liệu. |
| **L4 Pagination**| Phân trang chuẩn | Tích hợp `PaginationControl` với thông tin `Hiển thị X - Y trên tổng Z dòng`, nút Trước/Sau và danh sách trang. |

---

## 3. QUY TRÌNH 5 BƯỚC THỰC HIỆN ĐỒNG BỘ (STEP-BY-STEP WORKFLOW)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    QUY TRÌNH ĐỒNG BỘ GIAO DIỆN CHUẨN                    │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │ BƯỚC 1: KHẢO SÁT HIỆN TRẠNG & THIẾT LẬP BASELINE (Phase 0 Inventory) │
  │ - Liệt kê tất cả Tabs, Modals, Endpoints, State variables            │
  │ - Quét sạch vi phạm: window.alert, window.confirm, màu chữ chìm     │
  │ - Tạo file: docs/design-specs/m{xx}_FEATURE_BASELINE_BEFORE_SYNC.md  │
  └─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │ BƯỚC 2: TÁCH MODULE HÓA COMPONENT (Sub-component Architecture)      │
  │ - Tách thư mục con: src/components/workspaces/m{xx}/                 │
  │ - Khởi tạo file types: m{xx}Types.ts                                │
  │ - Tách riêng Header, Pipeline, MetricStrip, các Tab và Modals       │
  └─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │ BƯỚC 3: TÁI CẤU TRÚC LỚP HIỂN THỊ (Presentation Layer Refactoring)  │
  │ - Dựng L0 Header & Lifecycle Pipeline                               │
  │ - Áp dụng L1 Sub-tabs & Command Bar                                 │
  │ - Áp dụng L2 Metric Strip (font-mono tabular-nums)                  │
  │ - Tái cấu trúc L3 Data Tables (border-l-4, hover, WCAG AA badges)   │
  │ - Tích hợp ConfirmDialog.tsx cho 100% action nhạy cảm (Rule #19)    │
  └─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │ BƯỚC 4: KIỂM THỬ GIAO DIỆN & TỰ ĐỘNG HÓA KIỂM SOÁT (Audit & Lint)    │
  │ - Quét grep: window.alert / window.confirm == 0                      │
  │ - Quét grep: font-mono tabular-nums tại tất cả cột số liệu          │
  │ - Chuyển đổi Dark / Light Mode kiểm tra độ tương phản               │
  │ - Chạy lint_applet và compile_applet đảm bảo 100% không có lỗi type │
  └─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │ BƯỚC 5: LẬP BÁO CÁO NGHIỆM THU CHÍNH THỨC (Rule #20 Protocol)        │
  │ - Xuất bản: M{xx}_UI_UX_REPLICATION_VERIFICATION_REPORT.md           │
  │ - Ký duyệt checklist 10 tiêu chí nghiệm thu                         │
  └─────────────────────────────────────────────────────────────────────┘
```

---

### Bước 1: Khảo Sát Hiện Trạng & Lập Feature Baseline
Trước khi chạm vào bất kỳ dòng code nào:
1. Đọc toàn bộ workspace file hiện hữu:
   - M09: `/src/components/workspaces/M09SuppliersSRMWorkspace.tsx`
   - M10: `/src/components/workspaces/M10StrategicSourcingWorkspace.tsx`
2. Lập danh mục kiểm kê chi tiết:
   - Danh sách các tab và chức năng tương ứng.
   - Các API endpoints đang gọi (`GET`, `POST`, `PUT`, `DELETE`).
   - Các modal/drawer đang có.
   - Các vị trí còn tồn đọng `window.confirm`, `window.alert`.
   - Các cột số liệu chưa có `font-mono tabular-nums`.
3. Ghi nhận vào file baseline trước khi đồng bộ (ví dụ: `m09_FEATURE_BASELINE_BEFORE_SYNC.md`).

---

### Bước 2: Tách Module Hóa Component (Tránh Token Limit & Sprawling Code)
Để code rõ ràng, dễ bảo trì và không vượt ngưỡng giới hạn kích thước file:
1. Tạo thư mục module hóa:
   - Với M09: `src/components/workspaces/m09/` (nếu cần mở rộng)
   - Với M10: `src/components/workspaces/m10/` (đã tách thành công):
     - `m10Types.ts`
     - `M10WorkspaceHeader.tsx`
     - `M10LifecyclePipeline.tsx`
     - `M10MetricCards.tsx`
     - `M10RfqTab.tsx`
     - `M10BidsTab.tsx`
     - `M10EvaluationTab.tsx`
     - `M10ComparisonTab.tsx`
     - `M10AwardsTab.tsx`
     - `M10AnalyticsTab.tsx`
     - `M10RfqDetailModal.tsx`

---

### Bước 3: Triển Khai Thiết Kế Lớp Hiển Thị (Phase 2 & Phase 3)
Triển khai từng thành phần giao diện theo bộ khung chuẩn dưới đây:

#### 3.1 Mẫu L0 Workspace Header
```tsx
<div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
  <div className="flex items-center gap-4">
    <div className="p-3 bg-blue-600 dark:bg-blue-500 rounded-xl text-white shadow-xs">
      <Truck className="w-6 h-6" />
    </div>
    <div>
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 text-[11px] font-bold font-mono uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800">
          M09 • SUPPLIERS SRM
        </span>
        <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800">
          Rule #19 Confirmed
        </span>
      </div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
        Quản Trị Nhà Cung Cấp & Quan Hệ SRM
      </h1>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Hồ sơ đối tác 360°, hợp đồng khung, đánh giá OTIF và phân tích chuỗi cung ứng
      </p>
    </div>
  </div>

  <div className="flex items-center gap-2">
    <button
      onClick={handleRefresh}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors cursor-pointer"
      title="Tải lại dữ liệu"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
      Làm mới
    </button>
    <button
      onClick={handleExportCSV}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors cursor-pointer"
    >
      <Download className="w-3.5 h-3.5" />
      Xuất CSV
    </button>
  </div>
</div>
```

#### 3.2 Mẫu L0 Lifecycle Pipeline
```tsx
<div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
    <span>Tiến trình nghiệp vụ SRM (Lifecycle Pipeline)</span>
    <span className="font-mono text-[10px]">Standard Flow: Steps 1 - 4</span>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
    {PIPELINE_STEPS.map((step, idx) => (
      <div 
        key={idx}
        className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all ${
          step.isActive 
            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-950 dark:text-blue-200 font-bold'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
        }`}
      >
        <span className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
          {idx + 1}
        </span>
        <span className="text-xs truncate">{step.label}</span>
      </div>
    ))}
  </div>
</div>
```

#### 3.3 Mẫu L2 Metric Strip (`font-mono tabular-nums`)
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {metrics.map((item, idx) => (
    <div 
      key={idx} 
      className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between"
    >
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.title}</p>
        <h3 className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
          {item.value}
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            {item.subtext}
          </span>
        </p>
      </div>
      <div className={`p-3 rounded-xl ${item.iconBg}`}>
        {item.icon}
      </div>
    </div>
  ))}
</div>
```

#### 3.4 Mẫu L3 Data Table với `border-l-4`, `hover`, và định dạng số
```tsx
<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
  <table className="w-full text-left border-collapse">
    <thead>
      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">
        <th className="py-3 px-4 w-12 text-center">#</th>
        <th className="py-3 px-4">Mã Đối Tác</th>
        <th className="py-3 px-4">Tên Nhà Cung Cấp</th>
        <th className="py-3 px-4">Mã Số Thuế</th>
        <th className="py-3 px-4 text-right">Hạn Mức Tín Dụng</th>
        <th className="py-3 px-4 text-center">Chỉ Số OTIF</th>
        <th className="py-3 px-4 text-center">Trạng Thái</th>
        <th className="py-3 px-4 text-right">Thao Tác</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs">
      {suppliers.map((sup, idx) => {
        // Đường viền trái border-l-4 biểu diễn nghiệp vụ
        const borderIndicator = sup.status === 'ACTIVE'
          ? 'border-l-4 border-l-emerald-500'
          : sup.status === 'PENDING'
          ? 'border-l-4 border-l-amber-500'
          : 'border-l-4 border-l-slate-400';

        return (
          <tr 
            key={sup.id}
            className={`${borderIndicator} hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer`}
            onClick={() => onSelectEntity?.({ type: 'SUPPLIER', id: sup.id, data: sup })}
          >
            <td className="py-3 px-4 text-center font-mono text-slate-500 dark:text-slate-400">
              {idx + 1}
            </td>
            <td className="py-3 px-4">
              <span className={CODE_PILL}>{sup.code}</span>
            </td>
            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
              {sup.name}
            </td>
            <td className="py-3 px-4 font-mono font-medium text-slate-600 dark:text-slate-300">
              {sup.taxId ?? '—'}
            </td>
            <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
              {formatCurrencyVN(sup.creditLimit)}
            </td>
            <td className="py-3 px-4 text-center font-mono tabular-nums font-bold">
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                (sup.otifScore ?? 0) >= 95 
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60'
                  : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60'
              }`}>
                {formatPercent(sup.otifScore)}
              </span>
            </td>
            <td className="py-3 px-4 text-center">
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] border ${
                sup.status === 'ACTIVE' ? BADGE_SUCCESS : BADGE_WARNING
              }`}>
                {sup.status}
              </span>
            </td>
            <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleArchiveSupplierPrompt(sup)}
                className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                title="Lưu trữ đối tác (Rule #19)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>
```

---

### Bước 4: Kiểm Thử & Xác Minh Tính Toàn Vẹn (Verification & Audit)

Thực hiện các lệnh kiểm tra tự động và bằng tay:

1. **Kiểm tra không còn `window.confirm` hay `window.alert` (Bắt buộc = 0 kết quả):**
```bash
grep -rn "window.alert" src/components/workspaces/M09SuppliersSRMWorkspace.tsx src/components/workspaces/M10StrategicSourcingWorkspace.tsx src/components/workspaces/m10/
grep -rn "window.confirm" src/components/workspaces/M09SuppliersSRMWorkspace.tsx src/components/workspaces/M10StrategicSourcingWorkspace.tsx src/components/workspaces/m10/
```

2. **Kiểm tra mật độ `font-mono tabular-nums` tại các cột số:**
```bash
grep -rn "font-mono" src/components/workspaces/M09SuppliersSRMWorkspace.tsx | wc -l
grep -rn "font-mono" src/components/workspaces/m10/ | wc -l
```
*(M09 yêu cầu tối thiểu ≥ 30 vị trí, M10 yêu cầu tối thiểu ≥ 50 vị trí bao gồm mã RFQ, BID, giá trị gói thầu, điểm chấm).*

3. **Kiểm tra Nullish Coalescing (không dùng `||` cho số):**
```bash
grep -rn "|| 0" src/components/workspaces/m10/
```

4. **Kiểm thử Type & Build Compilation:**
Chạy tool `lint_applet` và `compile_applet` đảm bảo 100% build pass không có warning về JSX, CSS hay Typescript.

---

### Bước 5: Báo Cáo Nghiệm Thu Hoàn Thành (Rule #20 Sign-Off)
Sau khi hoàn tất việc đồng bộ, bắt buộc lập file báo cáo nghiệm thu theo format:
- Đối với M09: `/docs/design-specs/M09_UI_UX_REPLICATION_VERIFICATION_REPORT.md`
- Đối với M10: `/docs/design-specs/M10_UI_UX_REPLICATION_VERIFICATION_REPORT.md`

Báo cáo phải chứa đủ 10 tiêu chí đánh giá từ L0 đến Dark Mode Parity kèm bằng chứng xác thực.

---

## 4. MA TRẬN ĐẶC TẢ CHI TIẾT DÀNH RIÊNG CHO M09 VÀ M10

### 4.1 Ma Trận Chi Tiết Module M09 (Suppliers SRM)

| Thành phần | Đặc tả kỹ thuật | Quy cách hiển thị |
| :--- | :--- | :--- |
| **Header Identity** | Icon `Truck`, Màu chủ đạo Blue-600 | Badge `M09 • SUPPLIERS SRM`, nút Refresh, Export CSV, Link sang M11 Scorecards |
| **Pipeline 4 bước** | 1. Thẩm Định Hồ Sơ -> 2. Hợp Đồng Khung -> 3. Giao Hàng & OTIF -> 4. Thẻ Điểm & Xếp Hạng | Viền xanh nhạt, step active sáng màu, font chữ đậm |
| **4 Thẻ KPIs** | 1. Tổng NCC, 2. Đối tác Tier A, 3. Đang cảnh báo, 4. Chỉ số OTIF TB | Số liệu lớn `text-2xl font-bold font-mono tabular-nums`, icon container chuẩn |
| **Danh sách Tabs** | Tab 1: Danh Sách NCC; Tab 2: Điều Khoản TT; Tab 3: Đánh Giá & Xếp Hạng; Tab 4: Phân Tích Chuỗi Cung Ứng | Bo góc `rounded-xl`, tab active `bg-blue-600 text-white shadow-xs` |
| **Tab 3: Đánh Giá** | Dải 4 KPI Đánh giá (OTIF, Quality, Compliance, Rating), Pills chọn NCC, Thẻ điểm 360°, Form chấm điểm mới, Bảng tổng hợp SRM Matrix 9 cột | Bảng có viền chỉ báo phân hạng Tier A/B/C (`border-l-4`), highlight dòng đang chọn (`ring-2 ring-blue-500/50`) |
| **Rule #19 Actions** | 1. Lưu trữ Nhà cung cấp (`Archive`)<br>2. Hủy điều khoản hợp đồng khung | Modal `ConfirmDialog` với `variant="danger"`, message cảnh báo tính toàn vẹn |

---

### 4.2 Ma Trận Chi Tiết Module M10 (Strategic Sourcing)

| Thành phần | Đặc tả kỹ thuật | Quy cách hiển thị |
| :--- | :--- | :--- |
| **Header Identity** | Icon `SearchCode`, Màu chủ đạo Purple-600 | Badge `M10 • STRATEGIC SOURCING`, nút M08 PO Boundary, Refresh, Export CSV |
| **Pipeline 5 bước** | 1. Khởi Tạo RFQ -> 2. Tiếp Nhận Bids -> 3. Chấm Thầu -> 4. Ma Trận So Sánh -> 5. Quyết Định Trao Thầu | Khung 5 khối bo góc, mũi tên chuyển tiếp, step active màu tím nổi bật |
| **4 Thẻ KPIs** | 1. Gói Thầu Mở, 2. Hồ Sơ Bids, 3. Điểm Đánh Giá TB, 4. Tỷ Lệ Tiết Kiệm Dự Kiến | Giá trị tiền VNĐ hoặc % tỷ lệ dạng `font-mono tabular-nums font-bold` |
| **Danh sách Tabs** | 10.1 Quản trị RFQ, 10.2 Bids Chào giá, 10.3 Đánh giá Thầu, 10.4 So sánh Matrix, 10.5 Trao thầu Awards, 10.6 Phân tích Analytics | Bo góc `rounded-xl`, tab active `bg-purple-600 text-white shadow-xs` |
| **Ma Trận So Sánh** | Bảng Matrix đa chiều so sánh giá chào, thời gian giao, bảo hành và điểm kỹ thuật | Viền trạng thái phân hạng NCC trúng thầu (`border-l-4 border-l-purple-500`), highlight NCC điểm cao nhất |
| **Rule #19 Actions** | 1. Hủy gói thầu RFQ (`Cancel RFQ`)<br>2. Loại bỏ hồ sơ chào giá không hợp lệ<br>3. Phê duyệt trao thầu (`Award Contract`) phát sinh Purchase Order sang M08 | Modal `ConfirmDialog` với `variant="danger"` (khi hủy) hoặc `variant="primary"` (khi trao thầu) |

---

## 5. BẢNG CHECKLIST NGHIỆM THU ĐỒNG BỘ GIAO DIỆN (AUDIT CHECKLIST)

Kỹ sư frontend bắt buộc đánh dấu kiểm tra 100% các mục trước khi commit:

- [ ] **1. Xác thực Rule #19:** Tuyệt đối không còn `window.alert` hoặc `window.confirm`. Toàn bộ hành động nhạy cảm đều thông qua `ConfirmDialog`.
- [ ] **2. Độ tương phản WCAG AA:** Toàn bộ badge trạng thái có viền `border`, chữ đậm, tỷ lệ tương phản ≥ 4.5:1.
- [ ] **3. Chế độ Dark Mode Parity:** Kiểm tra chuyển đổi theme Dark/Light; không có tình trạng chữ đen trên nền tối hoặc chữ trắng trên nền sáng.
- [ ] **4. Định dạng Monospace Số liệu:** Tất cả mã chứng từ, số lượng, đơn giá, tổng tiền, điểm số và tỷ lệ % đều có class `font-mono tabular-nums font-bold`.
- [ ] **5. Căn lề số học:** Cột số liệu tiền tệ, số lượng được căn phải (`text-right`), mã chứng từ căn giữa hoặc trái, nhãn căn trái.
- [ ] **6. Toán tử `??`:** Thay thế toàn bộ `value || 0` bằng `(value ?? 0).toLocaleString('vi-VN')`.
- [ ] **7. Hiệu ứng Hover dòng:** Bảng dữ liệu có class hover `hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150`.
- [ ] **8. Chỉ báo viền trái `border-l-4`:** Thể hiện trực quan trạng thái dòng chứng từ (Emerald: Hoàn tất, Amber: Chờ xử lý, Rose: Hủy/Cảnh báo, Blue/Purple: Đang chọn).
- [ ] **9. Phân trang đầy đủ:** Các bảng danh mục lớn đều được tích hợp component `PaginationControl`.
- [ ] **10. Bảo toàn Logic Nghiệp vụ:** Kiểm tra toàn bộ API endpoints, RBAC permissions, Context Rail synchronization không bị suy giảm tính năng.
- [ ] **11. Biên dịch sạch:** Chạy `compile_applet` đạt trạng thái thành công 100% không có cảnh báo lỗi.

---

**Kết luận:** Bản template hướng dẫn này là tài liệu chuẩn mực bắt buộc cho việc đồng bộ và duy trì chất lượng giao diện Enterprise trên phân hệ M09 và M10 của NexusSync ERP.
