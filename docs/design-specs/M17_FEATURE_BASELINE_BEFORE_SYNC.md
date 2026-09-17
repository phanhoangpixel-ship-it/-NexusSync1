# M17 MASTER WMS & CORE INVENTORY — POST-UPGRADE ARCHITECTURE BASELINE
## NEXUSSYNC ERP — RULE #20 GOVERNANCE RECORD & SINGLE-WRITER SPECIFICATION

**Document Reference:** `/docs/design-specs/M17_FEATURE_BASELINE_BEFORE_SYNC.md`  
**Standard Governed:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Replication Protocol)  
**Target Workspace:** M17 - Master WMS & Core Inventory Engine (Trung Tâm Quản Lý Kho & Động Cơ Tồn Kho 3 Trạng Thái)  
**Mounted Component:** `/src/modules/inventory/m17-master-wms/components/MasterWmsWorkspace.tsx`  
**Sub-Components:** `types.ts`, `mockData.ts`  
**Domain Authority:** Exclusive Single-Writer for Physical, Available, and Allocated Stock Balances (`InventoryService.postTransaction()`)  
**Baseline Date:** 2026-09-15  
**Status:** VALIDATED & FROZEN BASELINE (Single-Writer Invariants Certified)  

---

## 1. TỔNG QUAN PHÂN HỆ M17 SAU NÂNG CẤP

Module M17 (Master WMS & Core Inventory Engine) nắm giữ **Single-Writer Authority số 1** của toàn hệ thống NexusSync ERP. M17 quản lý:
1. **Mô hình tồn kho 3 trạng thái chuẩn mực:**
   - **Tồn vật lý (`stockPhysical` / On Hand):** Tổng lượng hàng thực tế đang nằm trong kho và vị trí bin/rack.
   - **Tồn đã giữ chỗ (`stockReserved` / Allocated):** Lượng hàng bảo lưu cho các đơn bán hàng (M13), quầy POS (M16), lệnh sản xuất (M25).
   - **Tồn khả dụng (`stockAvailable` / Available):** Tính toán theo công thức bất biến: `Available = Physical − Reserved`.
2. **Cổng ghi duy nhất (`InventoryService.postTransaction()`):** Tất cả các phân hệ khác (M08, M13, M16, M18–M28, M41, M42) bắt buộc gọi qua service này, tuyệt đối không tự sửa bảng `stock_balances` hay `stock_ledger`.
3. **Negative Stock Guard:** Chặn xuất hoặc giữ chỗ vượt quá tồn khả dụng (`requestedQty <= stockAvailable`). Cấm xuất âm kho trừ khi có quyền ghi đè đặc biệt kèm lý do và audit log.
4. **Giao dịch nguyên tử (Atomic Transactions) & Idempotency:** Ghi ledger, cập nhật số dư, cập nhật lô/serial và đồng bộ cache sản phẩm trong cùng 1 DB transaction.

---

## 2. BẢNG KIỂM KÊ CÁC TAB / KHỐI CHỨC NĂNG CỦA M17

| STT | Khối Chức Năng / Tab | Component / Section | API Endpoint Gọi | Hành Động Người Dùng | Điều Kiện Hiển Thị (RBAC / Trạng Thái) | Validation & Bảo Vệ Kiến Trúc |
|---|---|---|---|---|---|---|
| 1 | **L0 Header & Module Action** | `MasterWmsWorkspace.tsx` | Không có API trực tiếp | - Bấm nút "Reset Sync" -> Mở ConfirmDialog -> Khôi phục dữ liệu chuẩn 17 SKU.<br>- Bấm nút "Tạo Điều Chỉnh" -> Deep-link điều hướng sang phân hệ M20 (Stock Adjustment). | - Quyền `inventory:read` / `inventory:write`.<br>- Badge Single-Writer Authority hiển thị rõ ràng. | Rule #19 `ConfirmDialog.tsx` |
| 2 | **L1 KPI Metric Strip (5 Thẻ)** | `MasterWmsWorkspace.tsx` | `GET /api/inventory/balances` | Xem tổng hợp 5 chỉ số tồn kho toàn hệ thống: Total Physical, Reserved, Quarantine, Available, Total Valuation | Tự động tính toán từ danh sách tồn kho theo bộ lọc kho đang chọn | Format `font-mono tabular-nums font-black text-2xl` |
| 3 | **L2 Navigation & Filter Bar** | `MasterWmsWorkspace.tsx` | Không có | - Chuyển đổi giữa 2 tab `balances` (Số Dư 3 Chiều) và `ledger` (Sổ Cái Bất Biến).<br>- Gõ tìm kiếm theo SKU hoặc Tên sản phẩm.<br>- Chọn Kho hàng lọc từ dropdown. | Toàn bộ vai trò có quyền xem kho | Tìm kiếm thời gian thực (debounce/filter) |
| 4 | **L3 Tab 1: Số Dư Tồn Kho 3 Chiều** | `MasterWmsWorkspace.tsx` (`activeTab === 'balances'`) | `GET /api/inventory/balances` | - Xem chi tiết tồn kho theo từng SKU, Kho, Vị trí.<br>- Bấm nút "Thẻ Kho 360°" -> Mở Drawer/Toast thông tin chi tiết SKU. | `inventory:read` | Hiển thị đầy đủ Physical, Reserved, Quarantine, Available, Valuation |
| 5 | **L3 Tab 2: Sổ Cái Tồn Kho Bất Biến** | `MasterWmsWorkspace.tsx` (`activeTab === 'ledger'`) | `GET /api/inventory/ledger` | - Xem lịch sử biến động nhập/xuất/điều chuyển theo dòng thời gian.<br>- Xem mã chứng từ, loại giao dịch, số lượng +/- và tồn sau giao dịch. | `inventory:read` | Append-only ledger, không cho phép sửa/xóa |
| 6 | **Khối Deep-Link M20 Callout** | `<DeepLinkBanner />` | Không có | Bấm "Đi tới Phiếu Điều Chỉnh Kho" -> Điều hướng sang `/stock-adjustment` (M20). | Luôn hiển thị ở cuối trang | Tôn trọng phân định Single-Writer giữa M17 và M20 |

---

## 3. BẰNG CHỨNG THỰC THI & KIỂM TRA ĐỘ TOÀN VẸN KIẾN TRÚC

1. **Công thức 3 trạng thái:** `stockAvailable = stockPhysical - stockReserved` được bảo đảm 100% qua mọi giao dịch `postTransaction()`, `reserveStock()`, và `releaseReservation()`.
2. **Negative Stock Guard:** Khi gọi `postTransaction` hoặc `reserveStock` với số lượng lớn hơn `stockAvailable`, hệ thống ném ngoại lệ:
   ```
   "Tồn khả dụng không đủ để giữ chỗ cho sản phẩm X. Khả dụng: Y, Yêu cầu: Z"
   ```
3. **Atomic DB Transactions:** Thực hiện cập nhật đồng thời trên 4 bảng: `stock_balances`, `stock_ledger`, `lot_balances`, và `products` (Global Cache).

---

## 4. KẾT LUẬN & TRẠNG THÁI BASELINE

- Phân hệ **M17 (Master WMS & Core Inventory Engine)** đã hoàn tất nâng cấp, kiểm chứng thực thi và đồng bộ tài liệu.
- Trạng thái chính thức: **`FROZEN & IMMUTABLE BASELINE`**.
