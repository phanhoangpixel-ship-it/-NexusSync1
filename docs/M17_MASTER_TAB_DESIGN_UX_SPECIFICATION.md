# NEXUSSYNC ERP — DESIGN & UX SPECIFICATION
## Module M17 (WMS) — Master Tab: Danh Mục Sản Phẩm Tồn Kho Thời Gian Thực

> **Tài liệu tham chiếu bất biến (Immutable Design & UX Specification)** dành cho toàn bộ đội ngũ Frontend Architect và UI/UX Designer nhằm chuẩn hóa cấu trúc, bố cục, thanh công cụ, hệ thống trạng thái và trải nghiệm tương tác cho các Tab còn lại trong hệ thống NexusSync ERP.

---

## 1. Tổng Quan Kiến Trúc & Mục Đích (Overview & Architectural Intent)

Tab **Danh Mục Sản Phẩm Tồn Kho** trong Module M17 (Warehouse Management System - WMS) được thiết lập làm **Master Tab chuẩn mực** (Golden Standard Component) cho toàn bộ hệ thống Enterprise ERP.  
Mục tiêu cốt lõi của Tab này là cung cấp khả năng quan sát dữ liệu tồn kho đa chiều theo thời gian thực (Real-Time Ledger), bao gồm:
- **4 Chiều Tồn Kho**: Tồn vật lý thực tế (*On-Hand*), Đang giữ chỗ theo SO/WO (*Reserved*), Khả dụng xuất ATP (*Available*), và Đang trên đường về theo PO (*Incoming*).
- **Định vị Không gian Kho WMS**: Kho (Warehouse), Khu vực (Zone), Dãy (Aisle), Giá Kệ (Rack), Ô kệ (Bin Location).
- **Quản lý Lô & Hạn Sử Dụng**: Số Lô/Batch, Ngày sản xuất (MFG), Hạn sử dụng (EXP), Số ngày còn lại.
- **Định giá Tài chính & KCS**: Giá vốn bình quân (Unit Cost), Tổng giá trị tồn (Total Value), Trạng thái kiểm định chất lượng (KCS Quality Status), và Sức khỏe tồn kho (Inventory Health).

---

## 2. Cấu Trúc Phân Tầng Giao Diện (Layout Architecture)

Bố cục của Master Tab được chia thành 5 tầng rõ rệt (L0 đến L4) tuân thủ nghiêm ngặt chuẩn WMS Enterprise:

```
+-------------------------------------------------------------------------+
| L0: Top Header Bar (Tiêu đề, Mô tả ngắn, Badge số lượng, Primary Actions) |
+-------------------------------------------------------------------------+
| L1: KPI Metrics Strip (6 Thẻ chỉ số vận hành cao cấp với font Monospace)   |
+-------------------------------------------------------------------------+
| L2: Advanced Filter & Search Toolbar (Search Debounce, Quick Selects)   |
+-------------------------------------------------------------------------+
| L3: Content Area / Enterprise Data Table (Bảng dữ liệu cuộn độc lập)      |
+-------------------------------------------------------------------------+
| L4: Pinned Pagination Footer (Thanh phân trang chuẩn PaginationControl)  |
+-------------------------------------------------------------------------+
```

### Chi tiết từng tầng cấu trúc:
1. **L0 - Header Bar**:
   - **Bên trái**: Icon module trực quan, tiêu đề in đậm (`text-base font-bold text-slate-900`), badge tổng số lượng SKU định dạng font-mono độc lập với nền indigo tinh tế.
   - **Bên phải**: Vùng hành động chính (*Primary Actions*) chứa các nút chức năng trọng yếu (ví dụ: *Xuất Excel*, *In mã vạch*, *Thêm mới*).
2. **L1 - KPI Metrics Strip**:
   - Gồm 6 thẻ chỉ số vận hành thu gọn hiển thị tổng quan: Tổng SKU, Tồn vật lý, Đang giữ chỗ, Khả dụng xuất, Cảnh báo thiếu/cận date, và Tổng giá trị tồn kho. Sử dụng màu sắc trạng thái rõ ràng (Emerald, Blue, Amber, Rose, Purple).
3. **L2 - Advanced Filter & Search Toolbar**:
   - Ô tìm kiếm toàn văn (*Global Search*) có độ trễ debounce tối ưu (`250ms`), tự động lưu trạng thái tìm kiếm vào `localStorage`.
   - Các dropdown lọc nhanh theo Kho (Warehouse), Nhóm hàng hóa (Category), Sức khỏe tồn kho (Inventory Health), và Trạng thái KCS (Quality Status).
   - Nút đặt lại bộ lọc (*Reset Filters*) xuất hiện tự động khi có điều kiện lọc đang active.
4. **L3 - Content Area**:
   - Khu vực cuộn dữ liệu độc lập với `min-height` cố định chống sập nền trắng và giật layout.
   - Hỗ trợ đầy đủ 3 trạng thái hệ thống: **Đang tải (Loading Skeleton/Spinner)**, **Lỗi hệ thống (Error State với nút Thử lại)**, và **Không có dữ liệu (Empty State với nút gọi hành động nhanh)**.
5. **L4 - Footer / Pagination**:
   - Ghim cố định ở đáy bảng dữ liệu (`sticky bottom-0`), hiển thị số lượng bản ghi đang hiển thị, tùy chọn số dòng trên trang (*Page Size Selector*), và các nút điều hướng trang (Đầu, Trước, Các số trang có dấu `...`, Sau, Cuối).

---

## 3. Quy Chuẩn Typography & Color Systems

- **Font chữ văn bản**: Sử dụng họ font Sans-serif sắc nét, tối ưu cho giao diện Enterprise.
- **Font chữ dữ liệu số & mã định danh**: **BẮT BUỘC sử dụng `font-mono`** cho mọi mã SKU, Barcode, Số Lô, Số lượng tồn kho (`physicalQty`, `availableQty`), và Giá trị tiền tệ (`totalValue`, `unitCost`) để đảm bảo căn chỉnh cột tuyệt đối thẳng hàng.
- **Hệ thống Màu sắc Trạng thái (Status Color Tokens)**:
  - **Bình thường / Sẵn sàng (Normal / READY)**: Nền Emerald nhạt (`bg-emerald-50 text-emerald-700 border-emerald-200`).
  - **Cảnh báo thiếu hụt / Cận date (Low Stock / Near Expiry)**: Nền Rose/Amber nhạt (`bg-rose-50 text-rose-700 border-rose-200`).
  - **Khả dụng xuất (ATP)**: Nền Blue nhạt (`bg-blue-50 text-blue-700 border-blue-200`).
  - **Đang giữ chỗ (Reserved)**: Nền Amber nhạt (`bg-amber-50 text-amber-700 border-amber-200`).
  - **Niêm phong / Cách ly (Quarantined / Locked)**: Nền Slate/Rose tối hoặc đỏ trầm.

---

## 4. Trải Nghiệm Tương Tác & Quản Lý Trạng Thái (Interactive UX)

1. **Phản hồi Tức thì (Immediate Feedback)**: Mọi thao tác tìm kiếm, chuyển trang, lọc dữ liệu đều được cập nhật mượt mà qua React `useMemo` và `useState`.
2. **Hành động Dòng (Row Actions)**: Mỗi bản ghi trong bảng tích hợp menu thao tác nhanh:
   - Xem chi tiết thẻ kho 360 độ (*Quick Preview / Dossier Drawer*).
   - In tem nhãn mã vạch/QR code vị trí ô kệ (*Barcode & Bin Label Printing Modal*).
   - Điều chuyển kho / Kiểm kê nhanh (*Inventory Adjustment & Stocktake Action*).
3. **Tuân thủ Tuyệt đối Rule #19 (ConfirmDialog)**:
   - **NGHÊM CẤM** sử dụng `window.alert()` hay `window.confirm()` mặc định của trình duyệt. Mọi hành động nhạy cảm (Khóa kho, hủy lô, điều chỉnh tồn lớn) bắt buộc phải gọi component `ConfirmDialog.tsx` chuẩn của hệ thống.

---

## 5. Danh Sách Kiểm Tra Chất Lượng (Master Checklist cho các Tab khác)

Khi thiết kế hoặc tái thiết kế bất kỳ Tab nào khác trong NexusSync ERP, bắt buộc phải đối chiếu qua checklist sau:
- [ ] Đã sử dụng khung mẫu chuẩn `ModuleTabShell` (hoặc cấu trúc tương đương)?
- [ ] Header Bar có đủ tiêu đề, mô tả ngắn và badge tổng số lượng?
- [ ] Có ô tìm kiếm Debounce và các bộ lọc nhanh theo domain nghiệp vụ?
- [ ] Vùng nội dung có xử lý đầy đủ 3 trạng thái: Loading, Error, và Empty State?
- [ ] Thanh phân trang `PaginationControl` được ghim cố định ở đáy?
- [ ] Toàn bộ dữ liệu số, mã SKU, tiền tệ sử dụng `font-mono`?
- [ ] Không sử dụng `alert/confirm` nguyên thủy mà dùng `ConfirmDialog`?
