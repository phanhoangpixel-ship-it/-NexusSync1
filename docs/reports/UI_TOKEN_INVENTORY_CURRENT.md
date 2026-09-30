# NEXUSSYNC ERP — CURRENT UI TOKEN INVENTORY (FORENSIC AUDIT)

**Audit Date:** 2026-09-30  
**Auditor:** Senior Frontend Architect + UI/UX Design System Auditor + Enterprise ERP Forensic Reviewer  
**Status:** CURRENT BASELINE SNAPSHOT (READ-ONLY AUDIT — ZERO CODE MODIFICATION)  
**Governing Standard:** NexusSync ERP Architecture Governance (Rule #19, Rule #20)  

---

## 1. PHẠM VI QUÉT DỮ LIỆU
- **Tổng số tệp TypeScript / TSX / CSS được quét:** 529 files trong thư mục `/src`
- **Số phân hệ nghiệp vụ:** 43 Modules (M01 → M43) + Core Global Shell (L0 → L4)
- **Số khai báo trực quan (Visual Declarations):** > 24,500 token/class/style declarations

---

## 2. INVENTORY MÃ MÀU TRỰC TIẾP (HEX / RGB / HARD-CODED COLORS)

### 2.1. Thống kê tổng quan mã màu HEX
- **Tổng số mã HEX duy nhất (Unique Hex Colors):** 106 mã HEX
- **Tổng số lượt xuất hiện mã HEX hard-coded:** 482 lượt trong code nguồn và CSS engine

### 2.2. Bảng 30 mã HEX có tần suất cao nhất

| Mã HEX | Nguồn xuất hiện chính | Thuộc tính / Vai trò | Tần suất | Phân loại Semantic |
| :--- | :--- | :--- | :---: | :--- |
| `#1E293B` | `index.css`, Dark theme overrides | Dark Surface / Slate-800 | 29 | SURFACE (Dark) |
| `#0F172A` | `index.css`, Dark inputs / Root | Dark Background / Slate-900 | 29 | BACKGROUND (Dark) |
| `#94A3B8` | `index.css`, Placeholder / Disabled | Slate-400 / Placeholder | 29 | TEXT_MUTED (Dark) |
| `#10B981` | `index.css`, Badge success / KPI | Emerald-500 | 22 | SUCCESS |
| `#334155` | `index.css`, Inactive tabs / Dark borders | Slate-700 | 21 | BORDER / TEXT (Muted) |
| `#2563EB` | `index.css`, Table pulse glow / Focus | Blue-600 / Target Glow | 19 | PRIMARY (Core Blue) |
| `#F8FAFC` | `index.css`, Dark text / Surfaces | Slate-50 | 17 | TEXT (Light on Dark) |
| `#3B82F6` | `index.css`, Focus ring / Selection border | Blue-500 | 16 | PRIMARY_ACCENT |
| `#FFFFFF` | `index.css`, Light print / Select options | White base | 16 | SURFACE (Light) |
| `#64748B` | `index.css`, Light placeholder text | Slate-500 | 15 | TEXT_MUTED (Light) |
| `#38BDF8` | M01, M36, Map visuals | Sky-400 | 15 | DOMAIN_ACCENT |
| `#E2E8F0` | `index.css`, Inactive tab text in dark | Slate-200 | 13 | TEXT / BORDER |
| `#2A3A57` | M01 Observability / Charts | Custom Slate Blue Navy | 13 | UNKNOWN / HARDCODED |
| `#CBD5E1` | `index.css`, Scrollbar thumb / Borders | Slate-300 | 12 | BORDER / SCROLLBAR |
| `#F1F5F9` | `index.css`, Disabled input light / Track | Slate-100 | 11 | BACKGROUND (Light) |
| `#0B0F19` | `index.css`, Finance workspace root | Custom Midnight Black | 10 | BACKGROUND (Finance Dark) |
| `#0B1120` | `index.css`, Finance card nested well | Custom Deep Navy | 8 | SURFACE (Well) |
| `#34D399` | `index.css`, Dark revenue positive | Emerald-400 | 8 | SUCCESS (Financial) |
| `#F87171` | `index.css`, Dark expense negative | Rose-400 / Red-400 | 8 | ERROR (Financial) |
| `#60A5FA` | `index.css`, Dark target glow / Receivable | Blue-400 | 8 | INFO / RECEIVABLE |
| `#C084FC` | `index.css`, Dark tax / special amount | Purple-400 | 7 | PURPLE_ACCENT |
| `#FBBF24` | `index.css`, Dark status warning | Amber-400 | 7 | WARNING |
| `#FB7185` | `index.css`, Dark status danger | Rose-400 | 7 | DANGER |
| `#BFDBFE` | `index.css`, Notice CQT banner dark | Blue-100 text | 6 | NOTICE (Tax) |
| `#FDE68A` | `index.css`, Notice warning banner dark | Amber-200 text | 6 | NOTICE (Warning) |
| `#FECDD3` | `index.css`, Notice error banner dark | Rose-200 text | 6 | NOTICE (Error) |
| `#141C2E` | `PrimaryNavigation.tsx` | L1 Sidebar background | 5 | SURFACE (Navigation) |
| `#1E1E2E` | M01 Observatory | Catppuccin Base dark | 4 | UNKNOWN / HARDCODED |
| `#475569` | `index.css`, Input border dark | Slate-600 | 4 | BORDER (Dark) |
| `#0D1117` | M01 Terminal logs | GitHub Dark style | 3 | UNKNOWN / HARDCODED |

---

## 3. INVENTORY LỚP MÀU TAILWIND (SEMANTIC TAILWIND UTILITIES)

### 3.1. Phân bố màu Primary Action (CTA Button)
- **Blue Family (`blue-600`, `blue-700`, `blue-500`):** 3,240 occurrences (Xuất hiện tại Shell, EnterpriseDataView, M01, M13, M16, M17, M18, M19, M20, M21, M30, M31).
- **Indigo Family (`indigo-600`, `indigo-700`, `indigo-500`):** 1,185 occurrences (Xuất hiện tại M08, M10, M12, M14, M24, M36, M41, Pagination.tsx, PaginationControl.tsx).
- **Purple Family (`purple-600`, `purple-700`):** 310 occurrences (Xuất hiện tại M06 R&D, M37 BI, M30 GL, Phân bổ giá vốn).
- **Emerald Family (`emerald-600`, `emerald-700`):** 620 occurrences (Xuất hiện khi Approve, Quick Save, M16 POS Checkout).

> **Phát hiện Forensic (GAP-COL-01):** Có sự phân mảnh sâu giữa **Blue** (`bg-blue-600`) và **Indigo** (`bg-indigo-600`) cho hành động Primary CTA giữa các module. Ví dụ: M13 Sales dùng Blue-600 làm nút "Tạo đơn", trong khi M08 Purchase dùng Indigo-600 làm nút "Tạo đơn mua PO". Pagination.tsx dùng Indigo-600 trong khi TablePagination.tsx dùng Blue-600.

### 3.2. Phân bố màu Trạng thái Nghiệp vụ (Status Badges)
1. **Thành công / Hoàn tất (Emerald vs Green):**
   - Hầu hết dùng `bg-emerald-50 text-emerald-700 border-emerald-200` (Light) & `dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800` (Dark).
   - Tuy nhiên một số tệp cũ vẫn dùng `bg-green-100 text-green-800` (58 occurrences).
2. **Cảnh báo / Tạm hoãn (Amber vs Yellow):**
   - Hầu hết dùng `bg-amber-50 text-amber-700 border-amber-200` (Light) & `dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800` (Dark).
   - Rải rác tồn tại `bg-yellow-100 text-yellow-800` (24 occurrences).
3. **Từ chối / Nguy hiểm (Rose vs Red):**
   - Chuẩn mới tại `StatusBadge.tsx` và M18/M19 dùng `bg-rose-100 text-rose-950 border-rose-300` và `dark:bg-rose-950/90 dark:text-rose-200`.
   - Vẫn còn `bg-red-50 text-red-700 border-red-200` và `bg-red-600` tại 112 vị trí (bao gồm `src/components/modals/ConfirmDialog.tsx` và một số modal xác nhận).
4. **Thông tin / Đang xử lý (Blue vs Cyan):**
   - Đa số dùng `blue-50/blue-700`, một số nơi dùng `cyan-50/cyan-700` cho điều chuyển kho và EventBus.
5. **Kế toán & Niêm phong (Purple vs Violet):**
   - Dùng nhất quán `purple-50 text-purple-700 border-purple-200` hoặc `purple-100 text-purple-950 border-purple-300`.

---

## 4. INVENTORY TYPOGRAPHY & ĐỊNH DẠNG SỐ HỌC

### 4.1. Thang kích thước Font chữ (Font Size Scale)

| Token Tailwind | Số lượng xuất hiện | Mục đích sử dụng thực tế | Mức độ đồng bộ |
| :--- | :---: | :--- | :--- |
| `text-xs` (12px) | **5,793** | Dữ liệu bảng ERP, metadata, nhãn form, nút phụ | Chuẩn mặc định |
| `text-sm` (14px) | **903** | Tiêu đề phụ, nội dung modal, nhãn card lớn | Đồng bộ cao |
| `text-base` (16px) | **333** | Tiêu đề modal, tiêu đề section lớn | Đồng bộ |
| `text-2xl` (24px) | **280** | Số liệu chính của thẻ KPI Card | Đồng bộ cao |
| `text-xl` (20px) | **186** | Tiêu đề Workspace L3, tiêu đề trang | Đồng bộ |
| `text-lg` (18px) | **145** | Tiêu đề Drawer, tiêu đề nhóm | Đồng bộ |
| `text-[10px]` / `text-[11px]` | **894** | Badge siêu nhỏ, kbd shortcut, mã LOT/Serial | Bán chuẩn (Arbitrary) |
| `text-3xl` / `text-4xl` | **23** | Dashboard tổng quan M01 & M37 | Đặc thù |

### 4.2. Khảo sát Monospace & Tabular Nums (Rule #19 Compliance)
- Số lần xuất hiện `font-mono`: **4,457**
- Số lần xuất hiện `tabular-nums`: **1,315**
- **Khoảng cách (GAP-TYP-01):** Tỷ lệ `tabular-nums` đi kèm `font-mono` chỉ đạt ~29.5%. Nhiều cột số lượng tồn kho và tiền tệ hiện dùng `font-mono` nhưng bị thiếu thuộc tính `tabular-nums`, dẫn đến nguy cơ các chữ số bị giật độ rộng (glyph jitter) khi render số thực hoặc khi số liệu nhảy real-time.

---

## 5. INVENTORY BÁN KÍNH BO GÓC (BORDER RADIUS)

| Token Tailwind | Pixel quy đổi (xấp xỉ) | Tần suất xuất hiện | Nhóm thành phần áp dụng chủ yếu |
| :--- | :---: | :---: | :--- |
| `rounded-xl` | 12px | **3,610** | Card con, ô nhập liệu, dropdown, nút thao tác, modal nhỏ |
| `rounded-lg` | 8px | **2,304** | Table cell, nút phân trang, sub-item, tab con |
| `rounded` | 4px | **937** | Checkbox, kbd tag, tag nhỏ |
| `rounded-full` | 9999px | **893** | StatusBadge, avatar, indicator dot |
| `rounded-2xl` | 16px | **878** | Container L3, modal lớn, ConfirmDialog, KPI card chính |
| `rounded-md` | 6px | **415** | Code pill, TablePagination button, input nhỏ |
| `rounded-3xl` | 24px | **12** | Modal đặc thù R&D M06 |
| `rounded-sm` | 2px | **5** | Khung vẽ topology đặc thù M18 |

> **Phát hiện Forensic (GAP-RAD-01):** Hệ thống đang dao động mạnh giữa `rounded-xl` (12px), `rounded-lg` (8px), và `rounded-2xl` (16px) cho cùng một loại đối tượng (Button và Card). Ví dụ: Trong `ConfirmDialog.tsx` modal bo `rounded-2xl` (16px), các nút bấm bên trong bo `rounded-xl` (12px), trong khi tại `src/components/modals/ConfirmDialog.tsx` modal bo `rounded-xl` (12px) và nút bấm bo `rounded-lg` (8px).

---

## 6. INVENTORY ĐỘ ĐỔ BÓNG (BOX SHADOW)

| Token Shadow | Định nghĩa CSS | Tần suất | Đánh giá trực quan |
| :--- | :--- | :---: | :--- |
| `shadow-2xs` | `box-shadow: 0 1px rgb(0 0 0 / 0.05)` | **1,347** | Tinh gọn (Subtle) — Chuẩn Tailwind v4 cho ERP dày đặc |
| `shadow-xs` | `box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)` | **940** | Tinh gọn (Subtle) — Dùng cho Button & Pill |
| `shadow-sm` | `box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1)` | **250** | Trung bình nhẹ |
| `shadow-2xl` | `box-shadow: 0 25px 50px -12px ...` | **233** | Rất mạnh — Dùng cho Modal & Drawer overlays |
| `shadow-md` | `box-shadow: 0 4px 6px -1px ...` | **136** | Trung bình — Dùng cho Floating bar |
| `shadow` | Mặc định Tailwind | **103** | Trung bình |
| `shadow-xl` | Nổi bật | **46** | Mạnh |
| `shadow-inner` | Đổ bóng bên trong | **34** | Dùng trong thanh tiến độ & Well input |
| `shadow-lg` | Cao | **19** | Dùng cho Popover |
| `shadow-none` | Không bóng | **14** | Reset |

---

## 7. INVENTORY KHOẢNG CÁCH BẤT THƯỜNG & HARD-CODED SPACING
- **Số tệp có khai báo kích thước/khoảng cách dạng `[...]`:** 139 files
- **Tổng số khai báo bất thường (Arbitrary spacing/sizing declarations):** 413 khai báo
- **Các giá trị thường gặp:**
  - Chiều rộng cố định: `w-[80px]`, `w-[90px]`, `w-[110px]`, `w-[140px]`, `w-[200px]`, `w-[240px]`, `w-[320px]`, `w-[340px]`
  - Bán kính/khoảng cách lẻ: `p-[1px]`, `py-0.2`, `pl-13`, `top-[52px]`, `max-h-[90vh]`, `max-h-[80vh]`

---

## 8. KẾT LUẬN INVENTORY
1. Hệ thống đã sở hữu nền tảng token hóa tương đối tốt ở tầng typography (`text-xs` áp đảo) và bóng mờ (`shadow-2xs` chuẩn).
2. Tồn tại sự phân mảnh rõ nét về:
   - Màu nút Primary (Blue-600 vs Indigo-600).
   - Bán kính bo góc (Button dùng lẫn lộn giữa `rounded-lg`, `rounded-xl`, `rounded-md`).
   - Tỷ lệ số liệu thiếu `tabular-nums` đi kèm `font-mono`.
   - Có 106 mã màu HEX hard-coded chưa được gom về Design Token v2.0.
