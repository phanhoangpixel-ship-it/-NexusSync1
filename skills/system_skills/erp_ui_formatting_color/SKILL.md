---
name: "erp-ui-formatting-color"
description: >
  Chuẩn hoá giao diện ERP, xử lý triệt để lỗi tràn viền/cắt chữ (UI overflow/truncation),
  định dạng số và tiền tệ theo chuẩn kế toán (font-mono tabular-nums), và hệ thống bảng màu
  nghiệp vụ (semantic color tokens) đạt chuẩn tương phản WCAG AA cho NexusSync ERP.
---

# Chuẩn UI/UX, Định Dạng Tiền Tệ & Bảng Màu Nghiệp Vụ NexusSync ERP

Kỹ năng này là cẩm nang hướng dẫn bắt buộc dành cho mọi kỹ sư và AI Agent khi xây dựng, tinh chỉnh hoặc sửa lỗi giao diện người dùng (UI), định dạng số liệu kế toán/tài chính, và áp dụng bảng màu trạng thái trong toàn bộ 29+ Workspace của hệ sinh thái NexusSync ERP.

---

## 1. NGUYÊN TẮC GIẢI QUYẾT LỖI GIAO DIỆN (UI LAYOUT & OVERFLOW RESILIENCE)

### 1.1. Thanh điều hướng Tab (Tab Navigation Bars) — Chống tràn & Cắt chữ
- **Vấn đề thường gặp:** Khi có từ 5-8 tabs với tiêu đề tiếng Việt dài, màn hình độ phân giải trung bình (1280px - 1440px) có sidebar sẽ bị cắt cụt tab cuối hoặc ép vỡ layout.
- **Quy tắc thiết kế bắt buộc:**
  1. Luôn bọc danh sách tab trong một container cuộn ngang: `overflow-x-auto scroll-smooth no-scrollbar flex-1 py-0.5`.
  2. Các nút tab phải có thuộc tính `whitespace-nowrap shrink-0` để không bao giờ bị ngắt dòng làm méo nút.
  3. Padding tinh gọn: `px-3 py-2 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold`.
  4. Cung cấp cụm nút cuộn trái/phải (`ChevronLeft`, `ChevronRight`) với `useRef` và hàm cuộn mượt:
     ```tsx
     const tabsContainerRef = useRef<HTMLDivElement>(null);
     const scrollTabs = (direction: 'left' | 'right') => {
       if (tabsContainerRef.current) {
         const scrollAmount = direction === 'left' ? -240 : 240;
         tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
       }
     };
     ```
  5. Đặt thuộc tính `title="..."` trên nút tab để người dùng có thể hover xem đầy đủ tên nếu màn hình quá hẹp.

### 1.2. Chuẩn lớp phủ Modal & Drawers (`z-[100]` & `backdrop-blur-sm`)
- **Tầng hiển thị (z-index):** Mọi modal độc lập phải sử dụng `fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm`.
- **Trải nghiệm đóng hộp thoại:**
  - Hỗ trợ đóng bằng phím **Escape**:
    ```tsx
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
    ```
  - Hỗ trợ đóng khi click vào backdrop: `onClick={onClose}` ở thẻ ngoài cùng và `onClick={(e) => e.stopPropagation()}` ở container nội dung modal.

---

## 2. CHUẨN ĐỊNH DẠNG TIỀN TỆ, SỐ LƯỢNG & TÀI CHÍNH

### 2.1. Quy tắc số học kế toán (Enterprise Quantitative Formatting)
1. **Font chữ & Tabular Nums:** Mọi dữ liệu định lượng (mã SKU, số lượng, đơn giá, thành tiền, tỷ lệ %, số chứng từ, LOT, TK kế toán) **BẮT BUỘC** dùng:
   ```html
   font-mono tabular-nums
   ```
2. **Căn lề (Alignment):**
   - Số tiền, số lượng, tỷ lệ % $\rightarrow$ `text-right`
   - Văn bản, tên sản phẩm, tên nhân sự $\rightarrow$ `text-left`
   - Mã ngắn, ngày tháng, trạng thái $\rightarrow$ `text-center`

### 2.2. Hàm tiện ích định dạng chuẩn (Formatting Utilities)
Sử dụng hoặc tham chiếu bộ hàm tiện ích chuẩn tại `/src/lib/formatters.ts` (hoặc định nghĩa nhất quán):

```typescript
// 1. Tiền tệ Việt Nam Đồng (VND)
export const formatVND = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

// 2. Tiền tệ viết gọn cho KPI Card (Triệu / Tỷ VNĐ)
export const formatCompactVND = (amount: number): string => {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)} Tỷ ₫`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} Tr ₫`;
  return formatVND(amount);
};

// 3. Số lượng tồn kho / Chấm công
export const formatQuantity = (qty: number, decimals: number = 0): string => {
  if (isNaN(qty)) return '0';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(qty);
};

// 4. Phần trăm (%)
export const formatPercent = (rate: number, decimals: number = 1): string => {
  return `${rate.toFixed(decimals)}%`;
};
```

### 2.3. Quy ước màu sắc số liệu tài chính
- **Dương / Doanh thu / Thực lĩnh Net:** `text-slate-900 dark:text-white` hoặc `text-emerald-600 dark:text-emerald-400 font-bold`.
- **Khấu trừ / Chi phí / Giảm trừ lương:** `text-rose-600 dark:text-rose-400 font-medium` kèm dấu trừ `-1.200.000 ₫`.
- **Cảnh báo / Tồn kho thấp:** `text-amber-600 dark:text-amber-400 font-semibold`.
- **Số dư bằng 0 / Không áp dụng:** `text-slate-400 dark:text-slate-500 font-mono`.

---

## 3. HỆ THỐNG MÀU SẮC NGHIỆP VỤ & ĐỘ TƯƠNG PHẢN (SEMANTIC COLOR SYSTEM)

Mọi nhãn trạng thái (Status Badges), thanh tiến độ và thẻ KPI phải đạt độ tương phản tối thiểu **WCAG AA (4.5:1)** trên cả giao diện Sáng (Light) và Tối (Dark).

### 3.1. Ma trận màu sắc trạng thái (Status Badges Matrix)

| Trạng thái nghiệp vụ | Ý nghĩa | Tailwind Light Class | Tailwind Dark Class |
|---|---|---|---|
| **Emerald (Green)** | Đã duyệt, Hoàn tất, Đang hoạt động, Đạt chuẩn KCS, Đã quyết toán | `bg-emerald-50 text-emerald-700 border-emerald-200` | `dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800` |
| **Amber (Orange/Yellow)** | Chờ duyệt, Tạm giữ, Cận hạn FEFO, Đang xử lý, Cần chú ý | `bg-amber-50 text-amber-700 border-amber-200` | `dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800` |
| **Rose (Red)** | Từ chối, Huỷ, Quá hạn, Thất bại, Hỏng hóc, Bội chi | `bg-rose-50 text-rose-700 border-rose-200` | `dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800` |
| **Blue (Primary)** | Đang giao, Đang chạy lương, Mới ghi nhận, Đang kiểm kê | `bg-blue-50 text-blue-700 border-blue-200` | `dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800` |
| **Purple (Indigo)** | Đã hạch toán GL, Phân bổ giá vốn, Niêm phong mật mã SHA-256 | `bg-purple-50 text-purple-700 border-purple-200` | `dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800` |
| **Slate (Neutral)** | Bản nháp, Vô hiệu hoá, Đã huỷ bỏ, Đóng hồ sơ | `bg-slate-100 text-slate-700 border-slate-200` | `dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700` |
| **Cyan (Teal)** | Chuyển nội bộ, Điều chuyển kho, Tự động đồng bộ EventBus | `bg-cyan-50 text-cyan-700 border-cyan-200` | `dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800` |

### 3.2. Cấu trúc chuẩn của một Thẻ chỉ số KPI (KPI Card Standard)
```tsx
<div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
    <span className="text-xs font-semibold uppercase tracking-wider">Tiêu đề chỉ số</span>
    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
      <Users className="w-4 h-4" />
    </div>
  </div>
  <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
    {formatVND(value)}
  </div>
  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
    Thông tin chú thích bổ trợ
  </p>
</div>
```

---

## 4. QUY TẮC BẤT BIẾN: HỘP THOẠI XÁC NHẬN & TƯƠNG TÁC (CONFIRM DIALOG)

1. **Tuyệt đối cấm:** `window.alert()`, `window.confirm()`, `window.prompt()`.
2. **Bắt buộc:** Mọi thao tác xoá, huỷ, duyệt quyết toán, niêm phong sổ cái phải dùng `/src/components/common/ConfirmDialog.tsx` với state quản lý rõ ràng:
   ```tsx
   <ConfirmDialog
     isOpen={confirmDialog.isOpen}
     title={confirmDialog.title}
     message={confirmDialog.message}
     confirmText="Xác nhận"
     cancelText="Huỷ bỏ"
     variant={confirmDialog.type} // 'danger' | 'warning' | 'primary'
     onConfirm={handleExecuteAction}
     onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
   />
   ```

---

## 5. CHECKLIST KIỂM THỬ TRƯỚC KHI BÀN GIAO (VERIFICATION CHECKLIST)

- [ ] **Tab Bar:** Không bị mất chữ hay đè lên mép container trên mọi độ phân giải. Có nút cuộn trái/phải.
- [ ] **Modal:** Đã đặt `z-[100]`, đóng được bằng phím `Escape` và click backdrop.
- [ ] **Format Số & Tiền:** Toàn bộ cột tiền tệ và định lượng đều có `font-mono tabular-nums text-right` và đơn vị rõ ràng (`₫` / `VNĐ` / `%`).
- [ ] **Độ tương phản:** Chữ trên dark mode không bị mờ xám tối trên nền đen (tối thiểu `text-slate-300` / `text-slate-200`).
- [ ] **Biên dịch:** Chạy `compile_applet` đạt kết quả **Build Succeeded**.
