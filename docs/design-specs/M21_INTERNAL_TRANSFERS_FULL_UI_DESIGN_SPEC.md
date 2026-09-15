# M21 INTERNAL TRANSFERS & IN-TRANSIT — BẢN ĐẶC TẢ CHI TIẾT THIẾT KẾ GIAO DIỆN UI/UX
**Mã tài liệu:** `NEXUS-SPEC-M21-UI-UX-REPLICATION-V1`  
**Tuân thủ quy chuẩn:** Rule #19 (Confirm Dialog & UI/UX Standards) & Rule #20 (Full UI/UX Replication Protocol)  
**Nguồn thiết kế mẫu:** Module M19 Stocktake & Field Execution Workspace  
**Phạm vi áp dụng:** 100% Giao diện Module M21 Internal Transfers & In-Transit Management  

---

## 📌 PHẦN 1: BẢN ĐỒ KIỂM KÊ VÀ DANH MỤC 6 TABS CHỨC NĂNG (PHASE 0)

| STT | Mã Tab | Tên Màn Hình / Tab | Vai Trò Nghiệp Vụ Chính | Cấu Trúc UI Tương Ứng Từ M19 |
|---|---|---|---|---|
| **Tab 1** | `master_orders` | **Bàn Quản Trị Lệnh Điều Chuyển** | Quản lý danh sách lệnh điều chuyển, phê duyệt lệnh, xuất xe, nhận đích, khóa niêm phong, Drawer 360° | `StocktakeMasterSessionsTab` |
| **Tab 2** | `dispatch_desk` | **Bàn Soát Hàng & Thực Nhận** | Quét Barcode/LPN, nhập thực xuất / thực nhận qua Inline Editing, phím nóng `Enter`/`Escape`, chế độ xuất/nhập | `StocktakeFieldExecutionTab` |
| **Tab 3** | `discrepancy` | **Đối Soát Chênh Lệch & Hao Hụt** | Phân loại tổn thất, yêu cầu đền bù nhà xe (TK 1388), đề xuất bút toán điều chỉnh M20 | `StocktakeVarianceReconciliationTab` |
| **Tab 4** | `fleet` | **Phân Công Đội Xe & SLA** | Phân công tài xế, phương tiện nội bộ/3PL, theo dõi GPS & tiến độ hành trình %, kiểm soát hạn SLA | `StocktakeTaskAssignmentTab` |
| **Tab 5** | `routes` | **Tuyến Cố Định & Đóng Băng Bin** | Thiết lập lịch chạy xe định kỳ theo tuyến, đóng băng khu vực đệm (Staging Freeze) ngăn tranh chấp bin | `StocktakeSchedulesTab` |
| **Tab 6** | `ledger` | **Sổ Cái Hàng Đi Đường (GL TK 157)** | Bút toán kiểm toán bất biến Nợ 157/Có 1561, Nợ 1561/Có 157, mã băm SHA-256 Checksum, Rule #03 Single-Writer | `StocktakeLedgerHistoryTab` |

---

## 🎨 PHẦN 2: ĐẶC TẢ CHI TIẾT TỪNG TAB THEO 7 TIÊU CHÍ (PHASE 1.1 -> 1.7)

### TAB 1: BÀN QUẢN TRỊ LỆNH ĐIỀU CHUYỂN (MASTER ORDERS & DRAWER 360°)
* **1.1 Cấu trúc bố cục:**
  - `L1 Command Bar`: Instant Search đa trường (mã lệnh, biển số, tài xế, seal), lọc kho xuất (`sourceWarehouse`), lọc kho nhận (`destWarehouse`), lọc trạng thái (`status`), nút Làm Mới, Xuất Excel XLSX, nút Tạo Lệnh Chuyển Kho.
  - `L2 KPI Strip`: 4 Thẻ KPI: Tổng Lệnh Điều Chuyển, Đang Đi Đường (In-Transit), Chờ Phê Duyệt Xuất Kho, Tổng Giá Trị Hàng Vận Chuyển (VND).
  - `L3 Interactive Grid`: Bảng dữ liệu viền trái `border-l-4`, hiệu ứng hover `hover:bg-slate-100/80 dark:hover:bg-slate-700/60`, Drawer 360° chi tiết danh mục SKU và mã chì niêm phong (Seal).
  - `L4 Sticky Footer`: Thanh phân trang `PaginationControl` chuẩn doanh nghiệp.
* **1.2 Typography & Định dạng số:**
  - Mã Lệnh & Mã Seal: `font-mono font-bold text-xs text-blue-600 dark:text-blue-400`
  - Biển số xe: `font-mono font-bold text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600`
  - Số lượng & Giá trị: `font-mono tabular-nums font-bold text-xs text-right text-emerald-600 dark:text-emerald-400`
* **1.3 Trạng thái màu sắc (WCAG AA):**
  - `PENDING_APPROVAL`: `bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700`
  - `APPROVED`: `bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700`
  - `IN_TRANSIT`: `bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200 dark:border-purple-700`
  - `COMPLETED`: `bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700`
* **1.4 Rule #19 ConfirmDialog:** 100% thao tác Phê Duyệt, Xuất Xe (In-Transit), Nhập Đích (Completed), Khóa Niêm Phong chứng từ đều phải qua `ConfirmDialog.tsx`.

---

### TAB 2: BÀN SOÁT HÀNG & THỰC NHẬN (DISPATCH & RECEIVING DESK)
* **2.1 Cấu trúc bố cục:**
  - `L1 Command Bar`: Selector chọn Lệnh điều chuyển active, Toggle chuyển đổi chế độ `Bàn Xuất Kho (Dispatch)` vs `Bàn Nhập Đích (Receiving)`, Ô quét mã vạch Barcode/LPN, Nút tự động điền khớp 100%.
  - `L2 KPI Strip`: Tổng SKU Trong Lệnh, Đã Soát Thực Tế, Dòng Sai Lệch Phát Hiện, Tình Trạng Niêm Chì (Seal Intact).
  - `L3 Interactive Grid`: Inline Editing trực tiếp trên từng ô số lượng thực tế (`actualShippedQty` / `actualReceivedQty`), hiển thị vị trí kệ từ Bin Xuất ➔ Bin Nhập.
* **2.2 Quy chuẩn Inline Editing Chuẩn (Enter / Escape / UOM):**
  - Input: `w-20 px-2 py-1 text-xs font-mono font-bold text-center bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500`
  - Nút Lưu (Enter): `p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer`
  - Nút Hủy (Esc): `p-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md cursor-pointer`

---

### TAB 3: ĐỐI SOÁT CHÊNH LỆCH & HAO HỤT (DISCREPANCY RECONCILIATION)
* **3.1 Cấu trúc bố cục:**
  - `L1 Command Bar`: Bộ lọc mức độ nghiêm trọng (Vượt dung sai `isExceedTolerance`, Lệch âm mất mát, Lệch dương dôi dư), Lọc nguyên nhân gốc rễ (`IN_TRANSIT_DAMAGE`, `PILFERAGE_LOSS`, `MISCOUNT_DISPATCH`, `CARRIER_MISPLACEMENT`), Nút Xuất Excel.
  - `L2 KPI Strip`: Tổng Giá Trị Lệch Ròng (Net VND), Số Dòng Vượt Dung Sai Cần Lập Biên Bản, Thất Thoát Chờ Bồi Thường (TK 1388), Dôi Dư Chờ Nhập Tồn (TK 3381).
  - `L3 Data Grid`: Bảng đối chiếu 3 chiều (Yêu cầu vs Xuất vs Nhận), Nút Đề xuất Bút toán M20, Nút Khiếu nại Nhà xe.

---

### TAB 4: PHÂN CÔNG ĐỘI XE & THEO DÕI SLA (FLEET ASSIGNMENT & SLA)
* **4.1 Cấu trúc bố cục:**
  - `L1 Command Bar`: Tìm kiếm xe / tài xế, Lọc loại hình đội xe (`INTERNAL_FLEET`, `3PL_EXPRESS`), Lọc trạng thái xe, Nút Phân Công Chuyến Xe Mới.
  - `L2 KPI Strip`: Tổng Chuyến Xe Phân Công, Xe Đang Lăn Bánh Trên Đường, Tỷ Lệ Đúng Hạn SLA %, Cảnh Báo Chậm Trễ.
  - `L3 Data Grid`: Danh sách phân công xe, tài xế chính & phụ xe, biển số xe, khoảng cách Km, hạn SLA, thanh tiến độ hành trình % trực quan.

---

### TAB 5: TUYẾN CỐ ĐỊNH & ĐÓNG BĂNG BIN (ROUTES SCHEDULES & STAGING FREEZE)
* **5.1 Cấu trúc bố cục:**
  - `L1 Command Bar`: Tìm kiếm tuyến, Lọc tần suất (`DAILY_FIXED`, `BI_WEEKLY`, `WEEKLY_HUB`), Lọc trạng thái tuyến, Nút Thiết Lập Tuyến Cố Định.
  - `L2 KPI Strip`: Tổng Tuyến Vận Chuyển, Tuyến Đang Kích Hoạt (Active), Khu Vực Đệm Đang Đóng Băng (Staging Frozen), Tuyến Tạm Dừng.
  - `L3 Data Grid`: Danh sách lịch trình chạy xe cố định, Nút Toggle Đóng Băng / Mở Khóa Vị Trí Kệ Đệm với `ConfirmDialog.tsx`.

---

### TAB 6: SỔ CÁI HÀNG ĐI ĐƯỜNG & KIỂM TOÁN GL (IN-TRANSIT GL LEDGER & SHA-256)
* **6.1 Cấu trúc bố cục:**
  - `L1 Command Bar`: Tìm kiếm số chứng từ, mã lệnh, mã băm SHA-256, Lọc loại bút toán (`DISPATCH_IN_TRANSIT`, `RECEIVE_DESTINATION`, `TRANSIT_LOSS_WRITEOFF`), Lọc TK GL (TK 157, TK 1561, TK 1388), Nút Xuất Sổ Cái Excel.
  - `L2 KPI Strip`: Tổng Bút Toán Khóa Sổ Bất Biến, Tổng Giá Trị Xuất Đi Đường (Nợ 157), Đã Nhập Kho Đích (Có 157), Toàn Vẹn Mã Băm SHA-256 (100% Verified).
  - `L3 Data Grid`: Bảng chứng từ sổ cái bất biến, hiển thị tài khoản Nợ/Có, số tiền VNĐ, mã băm SHA-256, chứng nhận Single-Writer Rule #03.

---

## 🔒 PHẦN 3: BẰNG CHỨNG KIỂM TRA TUÂN THỦ (RULE #19 & RULE #20 VERIFICATION)

1. **Không sử dụng `window.alert`, `window.confirm`, `window.prompt`:** 100% hành động nhạy cảm đều sử dụng `ConfirmDialog.tsx`.
2. **Định dạng số liệu:** 100% trường số lượng và giá trị tài chính sử dụng `font-mono tabular-nums font-bold text-right` và format tiền tệ VNĐ `toLocaleString('vi-VN') + ' ₫'`.
3. **Màu sắc & Tương phản WCAG AA:** Đảm bảo viền badge `border`, độ tương phản cao, text rõ ràng trong cả Light mode và Dark mode.
4. **Hiệu ứng bảng:** `hover:bg-slate-100/80 dark:hover:bg-slate-700/60` và đường viền phân loại trạng thái `border-l-4`.
5. **Đồng bộ Kiến trúc:** Tách biệt thành 6 sub-tabs component độc lập trong `/src/components/workspaces/transfers/`.
