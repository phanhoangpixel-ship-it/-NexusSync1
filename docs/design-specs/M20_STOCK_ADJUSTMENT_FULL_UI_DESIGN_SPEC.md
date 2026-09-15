# M20 STOCK ADJUSTMENT WORKSPACE (QUẢN TRỊ ĐIỀU CHỈNH TỒN KHO)
## FULL UI/UX DESIGN SPECIFICATION — BẢN THIẾT KẾ ĐÍCH CHUẨN MỰC TỪ M18 & M19

**Document Reference:** `/docs/design-specs/M20_STOCK_ADJUSTMENT_FULL_UI_DESIGN_SPEC.md`  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Replication Protocol)  
**Tác giả:** Chuyên viên Lập trình Frontend Cấp cao — NexusSync ERP Team  
**Mục tiêu:** Bản đặc tả chi tiết toàn diện 5 Tab chuyên biệt của phân hệ M20, kế thừa chính xác 100% ngôn ngữ thiết kế phân tầng L0-L4, typography, định dạng tiền tệ/số học tiếng Việt, hệ mã màu trạng thái WCAG AA và quy chuẩn tương tác từ M18/M19.

---

## BẢNG ĐỐI CHIẾU NGUỒN (M18 / M19) ↔ ĐÍCH (M20)

| STT | Phân hệ Nguồn [M18 / M19] | Vai trò Thiết kế | Phân hệ Đích [M20] | File Component Triển Khai |
|---|---|---|---|---|
| 1 | M19 Tab 1 (`StocktakeMasterSessionsTab`) | Master List View, Filter Toolbar, KPI Strip, Drawer 360, Export Excel | **Tab 1: Danh Sách Chứng Từ Điều Chỉnh** | `/src/components/workspaces/stockAdjustment/StockAdjustmentMasterTab.tsx` |
| 2 | M19 Tab 2 (`StocktakeFieldExecutionTab`) & M18 Tab E | Interactive Grid, Inline Editing (Enter/Escape), UOM, Realtime snapshot | **Tab 2: Lập Phiếu & Nhập Liệu Chênh Lệch Nhanh** | `/src/components/workspaces/stockAdjustment/StockAdjustmentCreateDraftTab.tsx` |
| 3 | M19 Tab 3 (`StocktakeVarianceReconciliationTab`) | Approval Matrix, Tolerance Badges, Single-Writer Post M17 | **Tab 3: Hội Đồng Phê Duyệt & Post Sổ Kho M17** | `/src/components/workspaces/stockAdjustment/StockAdjustmentApprovalDeskTab.tsx` |
| 4 | M18 Tab G (`WarehouseAnalyticsTab`) & M19 Tab 4 | Categorization Matrix, Cost Center, Damage/Loss Analytics | **Tab 4: Phân Loại Lý Do & Hao Hụt Định Mức** | `/src/components/workspaces/stockAdjustment/StockAdjustmentReasonAnalyticsTab.tsx` |
| 5 | M19 Tab 6 (`StocktakeLedgerHistoryTab`) | Immutable Ledger Audit Trail, SHA-256 Checksum, GL Accounts | **Tab 5: Sổ Cái Bút Toán & Kiểm Toán Bất Biến** | `/src/components/workspaces/stockAdjustment/StockAdjustmentLedgerAuditTab.tsx` |

---

## CHI TIẾT ĐẶC TẢ TỪNG TAB TRONG M20

### TAB 1: DANH SÁCH CHỨNG TỪ ĐIỀU CHỈNH (MASTER LIST & DRAWER 360)
- **L0 Shell:** Header Banner hiển thị `M20 • STOCK ADJUSTMENT`, huy hiệu `Rule #19 Confirmed` và `Single-Writer Rule #03 (InventoryService.postTransaction)`.
- **L1 Command Bar:** Thanh tìm kiếm đa trường (Mã phiếu, lý do, người tạo), bộ lọc Kho hàng (`select`), bộ lọc Trạng thái (`ALL`, `DRAFT`, `APPROVED`, `REJECTED`), Nút Làm mới (`RefreshCw`), Nút Xuất Excel (`FileSpreadsheet`), Nút Tạo Phiên Điều Chỉnh Mới (`Plus`).
- **L2 KPI Strip:** 4 thẻ KPI đồng bộ:
  1. *Tổng Phiếu Điều Chỉnh:* Icon `SlidersHorizontal`, màu xanh lam `text-blue-600`, nhãn `text-slate-500 uppercase font-bold text-xs`, giá trị `font-mono tabular-nums font-bold text-2xl`.
  2. *Chờ Phê Duyệt (DRAFT):* Icon `Clock`, màu hổ phách `text-amber-600`, nhãn `text-slate-500 uppercase font-bold text-xs`, giá trị `font-mono tabular-nums font-bold text-2xl`.
  3. *Đã Post Sổ Kho M17:* Icon `CheckCircle2`, màu lục `text-emerald-600`, nhãn `text-slate-500 uppercase font-bold text-xs`, giá trị `font-mono tabular-nums font-bold text-2xl`.
  4. *Giá Trị Lệch Net (VND):* Icon `Boxes`, màu đỏ tím `text-purple-600`, nhãn `text-slate-500 uppercase font-bold text-xs`, giá trị `font-mono tabular-nums font-bold text-2xl`.
- **L3 Enterprise Table:** Bảng dữ liệu với `hover:bg-slate-100/80 dark:hover:bg-slate-700/60`, chỉ báo viền trái `border-l-4`, cột số lượng/thành tiền `font-mono tabular-nums font-bold text-right`, tích hợp Drawer 360 hiển thị chi tiết dòng sản phẩm, tồn trước/sau và nhật ký phê duyệt.

### TAB 2: LẬP PHIẾU & NHẬP LIỆU CHÊNH LỆCH NHANH (INLINE EDIT STUDIO)
- **Cơ chế Inline Editing chuẩn:** Bấm sửa trực tiếp trên từng dòng sản phẩm, tự động `autoFocus`, nhấn `Enter` để Lưu, `Escape` để Hủy, hiển thị rõ Đơn vị tính (`item.baseUnit || 'Cái'`).
- **Xem trước số dư tồn kho M17 tức thời (Realtime Stock Snapshot):** Khi chọn SKU và Kho hàng, hệ thống tự động tải số dư vật lý hiện tại (`currentStock`) từ M17 và tính toán trước số dư dự kiến sau điều chỉnh (`newStock = currentStock + signedQty`).
- **Phân loại hướng điều chỉnh:** Tăng kho (`+ TĂNG KHO`, màu xanh lục) hoặc Giảm kho (`- GIẢM KHO`, màu đỏ hồng).
- **Lưu chứng từ:** Hỗ trợ lưu nháp `DRAFT` và chuyển tiếp ngay sang Bàn duyệt.

### TAB 3: HỘI ĐỒNG PHÊ DUYỆT & POST SỔ KHO M17 (APPROVAL DESK)
- **Kiểm soát dung sai & Phân cấp phê duyệt:**
  - Phiếu có giá trị chênh lệch dưới 5.000.000 ₫: Phê duyệt cấp Thủ kho / Quản lý kho.
  - Phiếu có giá trị chênh lệch trên 5.000.000 ₫: Yêu cầu Giám đốc Vận hành & Kế toán trưởng ký duyệt kép.
- **Sơ đồ định khoản kế toán kép dự kiến:** Hiển thị tự động cặp tài khoản Nợ/Có (TK 1561, TK 632, TK 1388, TK 3381) trước khi ghi sổ.
- **Rule #19 Bắt buộc:** Hành động "Phê duyệt & Post M17" hoặc "Từ chối" bắt buộc qua `ConfirmDialog` với thông điệp rõ ràng về tính bất biến của dữ liệu.

### TAB 4: PHÂN LOẠI LÝ DO & HAO HỤT ĐỊNH MỨC (REASON ANALYTICS)
- **Phân tích theo 5 nhóm nguyên nhân chuẩn ERP:**
  1. `DAMAGE`: Hư hỏng vật lý trong quá trình bốc xếp / bảo quản.
  2. `EXPIRATION`: Quá hạn sử dụng / Hết date đối với lô hàng quản lý hạn dùng.
  3. `SHRINKAGE`: Hao hụt tự nhiên do bay hơi, hao mòn cơ học theo định mức.
  4. `DATA_ENTRY`: Sai sót trong khâu nhập liệu PO/GRN trước đó.
  5. `SURPLUS`: Hàng dôi dư thực tế qua đối soát kiểm đếm mù.
- **Phân bổ theo Trung tâm chi phí (Cost Center):** Kho Vận Trung Tâm, Nhà Máy Sản Xuất, Ban Kinh Doanh B2B.

### TAB 5: SỔ CÁI BÚT TOÁN & KIỂM TOÁN BẤT BIẾN (GL AUDIT TRAIL)
- **Toàn vẹn dữ liệu:** Hiển thị chuỗi mã băm SHA-256 Checksum gắn liền với từng giao dịch điều chỉnh kho đã được post qua `InventoryService.postTransaction`.
- **Trạng thái:** `POSTED_IMMUTABLE` (Đã khóa sổ bất biến, không thể sửa xóa).
- **Xuất báo cáo kiểm toán:** Nút xuất file Excel phục vụ thanh tra thuế và kiểm toán độc lập.
