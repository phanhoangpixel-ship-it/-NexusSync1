# NEXUSSYNC ERP — MODULE M17 (WMS) TABS IMPLEMENTATION & REFACTOR CHECKLIST

Tài liệu này tổng hợp danh sách toàn bộ các Tab chức năng trong **Module M17 (Warehouse Management System - WMS)**, đánh giá trạng thái tái cấu trúc theo khung mẫu chuẩn **`ModuleTabShell`** và trạng thái tích hợp thanh phân trang (**Pagination Control**).

---

## 📋 Bảng Thống Kê & Trạng Thái Triển Khai Module M17 WMS

| STT | Tên Tab Chức Năng | File Thành Phần (Component) | Trạng Thái Refactor (`ModuleTabShell`) | Trạng Thái Phân Trang (`PaginationControl`) | Ghi Chú Kỹ Thuật & Tuân Thủ |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **1** | **Danh Mục Sản Phẩm Tồn Kho** *(Master Tab)* | `WarehouseProductsTab.tsx`<br>`EnterpriseDataView.tsx` | **[ĐÃ HOÀN THÀNH]**<br>(Golden Standard) | **[ĐÃ HOÀN THÀNH]**<br>(EnterpriseTable + Pagination) | Đạt chuẩn mực tối đa về bố cục, 4 chiều tồn kho, KCS status, và phân trang. |
| **2** | **Quản Lý Xuất Kho & Điều Phối WMS** | `WarehouseOutboundTab.tsx` | **[ĐÃ HOÀN THÀNH]**<br>(Dùng `ModuleTabShell`) | **[ĐÃ HOÀN THÀNH]**<br>(PaginationControl tích hợp) | Chuẩn hóa toàn bộ header, actions, search debounce và confirm dialog (Rule #19). |
| **3** | **Cấu Trúc Kho & Vị Trí Ô Kệ** *(Facilities & Bin Locations)* | `MasterWmsWorkspace.tsx`<br>(Tab: `FACILITIES`) | **[ĐÃ HOÀN THÀNH]** | **[ĐÃ HOÀN THÀNH]** | Quản lý đa kho, khu vực, dãy, kệ và ô kệ không gian WMS. |
| **4** | **Theo Dõi & Đóng Kiểm Định Mặt Hàng** *(Inspection & Status Control)* | `MasterWmsWorkspace.tsx`<br>(Tab: `INSPECTION`) | **[ĐÃ HOÀN THÀNH]** | **[ĐÃ HOÀN THÀNH]**<br>(Vừa bổ sung `PaginationControl`) | Tích hợp bộ lọc trạng thái, tìm kiếm SKU/Lô, nút mô phỏng Toast tự động và phân trang 5/10/20 dòng. |
| **5** | **Dòng Thời Gian & Truy Vết SKU** *(Audit Trail Timeline)* | `MasterWmsWorkspace.tsx`<br>(Tab: `TIMELINE`) | **[ĐÃ HOÀN THÀNH]** | **[ĐÃ HOÀN THÀNH]** | Ghi log bất biến toàn bộ các sự kiện dịch chuyển kho, giữ chỗ SO/WO và kiểm định KCS. |

---

## 🎯 Tiêu Chuẩn Kỹ Thuật Đã Áp Dụng (Compliance Seal)

1. **Rule #19 (ConfirmDialog)**: 100% các thao tác nhạy cảm (Đóng kiểm định, duyệt xuất kho, khóa lô) sử dụng `ConfirmDialog.tsx`, tuyệt đối không dùng `window.alert/confirm`.
2. **Typography Font-Mono**: Mọi dữ liệu số lượng, giá trị tiền tệ, mã SKU, số Lô/Batch đều bắt buộc sử dụng `font-mono` và `tabular-nums`.
3. **Responsive & Trạng Thái Hệ Thống**: Các tab đều hỗ trợ đầy đủ trạng thái `Loading`, `Error State`, `Empty State` và bố cục phản hồi đa màn hình.
