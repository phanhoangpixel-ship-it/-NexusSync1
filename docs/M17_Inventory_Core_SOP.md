# SOP M17: Quy trình Vận hành Phân hệ Lõi Tồn kho (Inventory Core Engine)

## 1. Mục đích & Phạm vi
- **Mục đích**: Chuẩn hóa quy trình nghiệp vụ quản lý tồn kho trung tâm, kiểm soát số dư tồn kho 3 chiều (Physical, Reserved, Available), vận hành Sổ cái kho bất biến (`Immutable Inventory Ledger`), áp dụng nguyên tắc tối thượng **Single Write Path**, và đảm bảo đồng bộ dữ liệu kho với các phân hệ O2C (Sales), P2P (Purchase), POS (M16), và RMA (M15) trong hệ thống NexusSync ERP.
- **Phạm vi**: Áp dụng cho toàn bộ nhân viên quản lý kho (Warehouse Keeper), giám sát logistics, kế toán kho (Inventory Accountant) và kiểm toán nội bộ của doanh nghiệp.

---

## 2. Các bước Vận hành Chuẩn (Standard Operating Procedures)

### Bước 1: Quản lý Số dư Tồn kho 3 Chiều (3-Dimensional Stock Balance Monitoring)
1. Nhân viên kho truy cập phân hệ **M17: Inventory Core**.
2. Theo dõi danh sách sản phẩm theo mã SKU, tên vật tư, kho hàng (`Warehouse`), và vị trí lưu trữ chi tiết (`Bin Location`).
3. Kiểm soát song song ba chỉ số cốt lõi:
   - **Physical Stock (Tồn thực tế)**: Tổng số lượng vật lý thực tế đang có trong kho.
   - **Reserved Stock (Hàng giữ chỗ)**: Số lượng đã được cam kết cho các Đơn hàng bán (SO), Lệnh sản xuất hoặc Đơn chuyển kho.
   - **Available Stock (Tồn khả dụng)** = `Physical Stock - Reserved Stock`. Đây là hạn mức tối đa cho phép tiếp nhận đơn hàng mới.

### Bước 2: Thực thi Giao dịch Kho theo Nguyên tắc Single Write Path (`postTransaction`)
1. Mọi nghiệp vụ phát sinh làm thay đổi tồn kho (Nhập mua hàng, Xuất bán hàng, Xuất sản xuất, Điều chỉnh kiểm kê, Chuyển kho) **tuyệt đối không được cập nhật trực tiếp bảng số dư**, mà phải thông qua hàm Authoritative Service:
   `InventoryService.postTransaction()`
2. Quy trình ghi nhận giao dịch:
   - Xác định SKU, mã kho, loại sự kiện (`GOODS_RECEIPT`, `GOODS_ISSUE`, `RESERVATION`, `ADJUSTMENT`).
   - Cung cấp chứng từ nguồn tham chiếu (Ví dụ: `PO-2026-088`, `SO-2026-0125`, `POS-2026-0412`).
   - Hệ thống tự động kiểm tra hạn mức tồn kho, tính toán lại số dư và ghi nhận vào cơ sở dữ liệu.

### Bước 3: Ghi nhận Sổ cái Kho Bất biến (Immutable Inventory Ledger & Audit Trail)
1. Mỗi giao dịch kho sau khi hoàn tất sẽ tự động sinh ra một bản ghi bất biến trong **Immutable Inventory Ledger**.
2. Mỗi dòng ghi nhận bao gồm đầy đủ:
   - Thời gian chính xác (`Timestamp`).
   - Loại sự kiện & Chứng từ nguồn (`Source Document`).
   - SKU & Biến động số lượng (`Qty Change`).
   - Người thực thi (`User Context`).
   - Mã băm kiểm tra tính toàn vẹn dữ liệu (`SHA-256 Checksum`).
3. Sổ cái này là cơ sở pháp lý cao nhất cho kiểm toán kho, không được phép xóa hoặc sửa đổi trực tiếp.

### Bước 4: Định giá Tồn kho & Kiểm kê Định kỳ (Costing Engine & Cycle Counting)
1. **Costing Engine**: Tự động tính toán giá vốn bình quân gia quyền (`Weighted Average Cost`) và tổng giá trị định giá tồn kho (`Total Valuation`) cho từng SKU.
2. **Kiểm kê định kỳ (Cycle Count / Stock Adjustment)**:
   - Thực hiện đếm thực tế tại kho.
   - Nếu có chênh lệch giữa số thực tế và số hệ thống, lập phiếu điều chỉnh (`Stock Adjustment`).
   - Trình Quản lý kho phê duyệt để cập nhật lại số dư vật lý và ghi nhận bút toán chênh lệch kho sang Kế toán tài chính.

### Bước 5: Vận hành Tự động Định tuyến X-Dock (Automated Cross-Docking Engine)
1. **Mục đích**: Tự động đối chiếu hàng hóa vừa nhập kho từ nhà cung cấp (Inbound PO) với các đơn hàng bán chờ sẵn (Outbound SO / Backorders) để chuyển thẳng từ bến nhận hàng sang bến xuất hàng mà không cần lưu kho trung gian.
2. **Quy trình thực thi**:
   - Truy cập tab **Automated Cross-Docking** trong phân hệ M17.
   - Hệ thống tự động quét và hiển thị danh sách các cặp chứng từ khớp lệnh (PO đến và SO chờ xuất).
   - Thủ kho kiểm tra thông tin bến chuyển hàng (`Staging Bay`) và bấm **"Thực thi X-Dock"**.
   - Xác nhận thao tác qua `ConfirmDialog.tsx` (Rule #19), hệ thống tự động ghi nhận lệnh định tuyến và cập nhật trạng thái hoàn tất, tiết kiệm thời gian và chi phí bốc xếp.

---

## 3. Quy định về Phân quyền & Bảo mật (RBAC & Guardrails)
- **Warehouse Keeper (Thủ kho)**: Có quyền thực thi nhập/xuất kho thực tế, xem số dư tồn kho, lập phiếu kiểm kê.
- **Inventory Accountant (Kế toán kho)**: Có quyền theo dõi sổ cái kho, đối chiếu giá trị tồn kho với Sổ cái GL (M02).
- **Store Manager / Logistics Director**: Có quyền phê duyệt các điều chỉnh tồn kho lớn, xử lý chênh lệch kiểm kê.
- **Tuân thủ Rule #19**: Mọi thông báo xác nhận thao tác quan trọng đều phải sử dụng component `ConfirmDialog.tsx` tùy chỉnh, tuyệt đối không dùng `window.confirm` của trình duyệt.
