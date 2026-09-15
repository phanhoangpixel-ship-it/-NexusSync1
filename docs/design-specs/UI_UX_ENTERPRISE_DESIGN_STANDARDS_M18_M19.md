# NEXUSSYNC ERP — UI/UX ENTERPRISE DESIGN & COMPONENT STANDARDS
**Tài liệu Khuyến nghị & Quy chuẩn Thiết kế Giao diện Toàn Hệ thống (Đúc kết từ thực tế M18 & M19)**

---

## 1. MỤC ĐÍCH & PHẠM VI ÁP DỤNG
Tài liệu này đóng vai trò là **Bộ Tiêu Chuẩn Giao Diện Bắt Buộc (UI/UX Design Standards Checklist)** dành cho các kỹ sư phát triển Frontend trên toàn bộ 29 Workspaces của hệ thống NexusSync ERP.

Mục tiêu:
1. Đảm bảo tính nhất quán 100% về visual language, độ tương phản (WCAG AA), trải nghiệm tương tác trên cả 2 chế độ **Light Mode** và **Dark Mode**.
2. Ngăn ngừa triệt để các lỗi chìm màu, lệch layout khi nhập liệu inline, vỡ kiểu dropdown, và vi phạm Rule #19.
3. Tăng tốc độ triển khai các module mới (M20, M21,...) thông qua các mẫu code component đã được kiểm chứng.

---

## 2. QUY TẮC MÀU SẮC & ĐỘ TƯƠNG PHẢN (CONTRAST & WCAG AA)

### 2.1. Bảng mã màu Huy hiệu trạng thái (Status Badges)
Mọi badge trạng thái trong bảng hoặc chi tiết chứng từ **bắt buộc** có viền (`border`), chữ đậm (`font-bold` hoặc `font-semibold`), màu chữ tối trên nền sáng (hoặc chữ sáng trên nền tối rõ ràng):

```tsx
// 1. Thành công / Khớp / Đã duyệt (Success / Approved / Active)
const BADGE_SUCCESS = "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold";

// 2. Cảnh báo / Chờ giải trình / Lệch nhẹ (Warning / Pending / Misplacement)
const BADGE_WARNING = "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold";

// 3. Khẩn cấp / Thất thoát / Vượt ngưỡng / Hỏng (Danger / Shrinkage / Urgent / Error)
const BADGE_DANGER = "bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold";

// 4. Tiến trình / Phân công / Đang đếm (Info / In Progress / Assigned)
const BADGE_INFO = "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 font-bold";

// 5. Đếm chéo / Đề xuất bút toán (Purple Accent / Double Check)
const BADGE_PURPLE = "bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200 dark:border-purple-700 font-semibold";

// 6. Nháp / Trung tính / Không áp dụng (Draft / Neutral / Default)
const BADGE_NEUTRAL = "bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 font-medium";
```

### 2.2. Nhãn Mã SKU, Task Code, Vị trí Kệ (Code Pill Tags)
```tsx
const CODE_PILL = "font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600";
```

---

## 3. QUY TẮC BẢNG DỮ LIỆU & TƯƠNG TÁC DÒNG (TABLE ROW STATES)

### 3.1. Hiệu ứng Hover chuẩn
- **Class bắt buộc**: `hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors duration-150`
- **Cấm**: Không dùng các màu hover tím/indigo/xanh dị biệt gây lệch tông toàn hệ thống.

### 3.2. Chỉ báo phân loại nghiệp vụ viền trái (`border-l-4`)
Tất cả các bảng dữ liệu nghiệp vụ quan trọng cần sử dụng chỉ báo màu viền trái để người dùng nhận diện nhanh:
- **Dòng đang chọn (Selected Row)**: `border-l-4 border-blue-600 bg-blue-50/70 dark:bg-slate-700/80`
- **Dòng cảnh báo / Vượt ngưỡng / Hao hụt**: `border-l-4 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20`
- **Dòng khóa / Đóng băng kho / Tạm dừng**: `border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10`
- **Dòng hoàn tất / Khớp 100%**: `border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10`
- **Dòng thông thường**: `border-l-4 border-transparent`

### 3.3. Dữ liệu số & Monospace
Toàn bộ:
- Số lượng tồn kho, giá trị tiền tệ: `font-mono tabular-nums font-bold`
- Mã SKU, Barcode, LPN, Số chứng từ GL: `font-mono font-bold`

---

## 4. QUY TẮC NHẬP LIỆU TRỰC TIẾP TRÊN BẢNG (INLINE EDITING)

Khi thiết kế chức năng sửa nhanh trực tiếp trên dòng (inline edit), **bắt buộc tuân thủ mẫu chuẩn**:

```tsx
{isEditing ? (
  <div className="inline-flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-lg border border-blue-400 dark:border-blue-500 shadow-xs">
    {/* Ô nhập số lượng */}
    <input
      type="number"
      min="0"
      value={tempQty}
      onChange={(e) => setTempQty(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSave(item);
        if (e.key === 'Escape') handleCancel();
      }}
      autoFocus
      className="w-24 px-2 py-1 text-xs font-mono font-bold text-center text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500"
    />
    
    {/* Đơn vị tính */}
    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 pr-1">
      {item.uom}
    </span>

    {/* Nút lưu nhanh */}
    <button
      onClick={() => handleSave(item)}
      className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors cursor-pointer"
      title="Lưu (Enter)"
    >
      <Check className="w-3.5 h-3.5" />
    </button>
  </div>
) : (
  <span className="font-mono font-bold text-slate-900 dark:text-white">
    {item.actualQty} {item.uom}
  </span>
)}
```

### 4.1. Định kiểu cho thẻ `<select>` và `<option>`
Tránh để dropdown bị chìm chữ trên Dark mode:
```tsx
<select className="px-2.5 py-1 text-xs font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-xs focus:ring-2 focus:ring-blue-500 cursor-pointer">
  <option value="A" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">Tùy chọn A</option>
  <option value="B" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">Tùy chọn B</option>
</select>
```

---

## 5. BẮT BUỘC TUÂN THỦ RULE #19 (CONFIRM DIALOG)

Tuyệt đối **KHÔNG** sử dụng `window.confirm()`, `window.alert()`, `window.prompt()`.
Mọi hành động:
- Đóng băng kho / Mở khóa vị trí
- Hủy phiên kiểm kê / Xóa lịch
- Phê duyệt hạch toán Sổ cái GL
- Ban hành lệnh đếm lại

Đều phải kích hoạt qua `ConfirmDialog` component:
```tsx
setConfirmDialog({
  isOpen: true,
  title: `Tiêu đề xác nhận rõ ràng?`,
  message: `Mô tả chi tiết tác động nghiệp vụ và cảnh báo tính bất biến (Rule #03 / Rule #19).`,
  confirmText: 'Xác Nhận Thực Hiện',
  cancelText: 'Hủy Bỏ',
  variant: 'danger', // hoặc 'primary', 'warning'
  onConfirm: () => {
    // Xử lý logic
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  }
});
```

---

## 6. CHECKLIST KIỂM THỬ TRƯỚC KHI BÀN GIAO MỖI MODULE
- [ ] 1. **Kiểm tra Dark/Light Mode**: Chuyển đổi theme và kiểm tra xem có ô nhập liệu, dropdown hay badge nào bị chữ tối trên nền tối hoặc chữ sáng trên nền sáng không.
- [ ] 2. **Kiểm tra Hover Bảng**: Hover toàn bộ các dòng xem có đổi màu `bg-slate-100/80` và `dark:bg-slate-700/60` không.
- [ ] 3. **Kiểm tra Monospace**: Toàn bộ số lượng, đơn giá, thành tiền, mã SKU/LPN/Chứng từ đã có `font-mono` và `tabular-nums` chưa.
- [ ] 4. **Kiểm tra Inline Editing**: Khi bấm Sửa đếm / Sửa nhanh trên dòng, ô input có focus ngay, hiển thị rõ ĐVT, hỗ trợ Enter/Escape và có nút Lưu/Hủy trực quan không.
- [ ] 5. **Kiểm tra Rule #19**: Tất cả các nút Xóa/Duyệt/Đóng băng có dùng `ConfirmDialog` không.
- [ ] 6. **Kiểm tra Build**: Chạy `compile_applet` thành công 100% không có lỗi tham chiếu biến hay Type error.
