---
name: "erp-ui-formatting-color"
description: >
  Chuẩn hoá giao diện ERP, xử lý triệt để lỗi tràn viền/cắt chữ (UI overflow/truncation),
  định dạng số và tiền tệ theo chuẩn kế toán (font-mono tabular-nums), và hệ thống bảng màu
  nghiệp vụ (semantic color tokens) đạt chuẩn tương phản WCAG AA cho NexusSync ERP.
---

# SKILL_06 — CHUẨN UI/UX, ĐỊNH DẠNG TIỀN TỆ & BẢNG MÀU NGHIỆP VỤ NEXUSSYNC ERP

## 1. NGUYÊN TẮC GIẢI QUYẾT LỖI GIAO DIỆN (UI LAYOUT & OVERFLOW RESILIENCE)

### 1.1. Thanh điều hướng Tab (Tab Navigation Bars) — Chống tràn & Cắt chữ
1. Container cuộn ngang: `overflow-x-auto scroll-smooth no-scrollbar flex-1 py-0.5`.
2. Nút tab không ngắt dòng: `whitespace-nowrap shrink-0`.
3. Padding tinh gọn: `px-3 py-2 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold`.
4. Cụm nút cuộn trái/phải (`ChevronLeft`, `ChevronRight`) với `useRef`:
   ```tsx
   const tabsContainerRef = useRef<HTMLDivElement>(null);
   const scrollTabs = (direction: 'left' | 'right') => {
     if (tabsContainerRef.current) {
       const scrollAmount = direction === 'left' ? -240 : 240;
       tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
     }
   };
   ```

### 1.2. Chuẩn lớp phủ Modal & Drawers (`z-[100]` & `backdrop-blur-sm`)
- Mọi modal: `fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm`.
- Đóng bằng phím **Escape** và click backdrop an toàn (`e.stopPropagation()` ở modal content).

---

## 2. CHUẨN ĐỊNH DẠNG TIỀN TỆ, SỐ LƯỢNG & TÀI CHÍNH

1. **Font chữ:** Mọi dữ liệu định lượng (tiền tệ, số lượng, %, số tài khoản GL, số chứng từ, LOT) **BẮT BUỘC** dùng:
   ```html
   font-mono tabular-nums
   ```
2. **Căn lề:** Số tiền/định lượng $\rightarrow$ `text-right`; Tên văn bản $\rightarrow$ `text-left`; Mã/Trạng thái $\rightarrow$ `text-center`.
3. **Mã màu tài chính:**
   - Dương / Doanh thu / Thực lĩnh: `text-emerald-600 dark:text-emerald-400 font-bold`.
   - Giảm trừ / Khấu trừ: `text-rose-600 dark:text-rose-400 font-medium` kèm dấu `-`.
   - Cảnh báo: `text-amber-600 dark:text-amber-400 font-semibold`.

---

## 3. HỆ THỐNG MÀU SẮC TRẠNG THÁI (SEMANTIC COLORS) ĐẠT WCAG AA

| Trạng thái | Light Theme | Dark Theme |
|---|---|---|
| **Emerald (Xanh lục)** | `bg-emerald-50 text-emerald-700 border-emerald-200` | `dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800` |
| **Amber (Vàng/Cam)** | `bg-amber-50 text-amber-700 border-amber-200` | `dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800` |
| **Rose (Đỏ)** | `bg-rose-50 text-rose-700 border-rose-200` | `dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800` |
| **Blue (Xanh dương)** | `bg-blue-50 text-blue-700 border-blue-200` | `dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800` |
| **Purple (Tím)** | `bg-purple-50 text-purple-700 border-purple-200` | `dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800` |
| **Slate (Xám)** | `bg-slate-100 text-slate-700 border-slate-200` | `dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700` |

---

## 4. HỘP THOẠI XÁC NHẬN (CONFIRM DIALOG)
- Tuyệt đối không dùng `window.alert/confirm/prompt`.
- Luôn dùng `ConfirmDialog.tsx`.
