# BÁO CÁO TÁI CẤU TRÚC VÀ XÂY DỰNG M20 — STOCK ADJUSTMENT (NEXUSSYNC ERP)

## 1. Kiểm Toán Kiến Trúc Hệ Thống (Forensic Audit)
- **M07 (Product Master):** Được xác định là nguồn định danh sản phẩm duy nhất (`products`). M20 hoàn toàn không tự tạo bảng sản phẩm hay SKU nội bộ.
- **M17 (Inventory Core):** Nguồn duy nhất chịu trách nhiệm về trạng thái tồn kho (`stock_balances`, `stock_ledger`).
- **M20 (Stock Adjustment):** Chỉ đóng vai trò là chứng từ điều chỉnh (Document & Workflow Authority), quản lý vòng đời từ `DRAFT` đến `APPROVED` / `REJECTED`, và tuyệt đối không tự sửa trực tiếp số dư kho.

## 2. Quy Tắc Ghi Sổ Kho Đơn Lập (Single Inventory Writer)
- M20 định nghĩa chứng từ điều chỉnh gồm Header và Items (với số lượng tăng/giảm và chênh lệch `Variance = Actual - System`).
- Khi phê duyệt (`approve`), hệ thống khởi tạo transaction nguyên tử (`db.transaction`) và gọi trực tiếp `InventoryService.postTransaction()` với mã loại `ADJUSTMENT_IN` hoặc `ADJUSTMENT_OUT`.

## 3. Tích Hợp Dữ Liệu Thực (Real Data Verification)
- **UI & API:** Giao diện `StockAdjustmentWorkspace.tsx` kết nối hoàn toàn với các endpoint REST `/api/stock-adjustments`, `/api/products`, `/api/warehouses`.
- **Database:** Lưu trữ trên các bảng authoritative `stock_adjustments`, `stock_adjustment_items`, và ghi nhận vào `stock_ledger` của M17.
- **Bảo mật & UI/UX:** Áp dụng `ConfirmDialog` thay cho hộp thoại mặc định của trình duyệt, tuân thủ tuyệt đối Rule #19 và tiêu chuẩn chống "AI Slop".

## 4. Kết Quả Kiểm Tra Chấp Nhận (Acceptance Criteria)
- [PASS] M07 Identity Integration
- [PASS] Adjustment Document & Workflow
- [PASS] Draft & Approval Lifecycle
- [PASS] Single Writer via `InventoryService.postTransaction()`
- [PASS] Real-time Database & UI Reconciliation
- [PASS] Production Build & Typecheck Success
