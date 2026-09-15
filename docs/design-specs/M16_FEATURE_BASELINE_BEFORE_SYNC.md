# M16 POS RETAIL & COUNTER WORKSPACE
## FEATURE BASELINE BEFORE SYNC (BƯỚC 1 THEO PROTOCOL)

**Mã phân hệ:** `M16` — POS Retail & Cashier Counter Workspace  
**File Component:** `/src/components/workspaces/m16/M16POSWorkspace.tsx`  
**Ngày lập baseline:** 11/09/2026  
**Mục đích:** Tài liệu nguồn ghi lại chính xác toàn bộ danh mục tab, API endpoints, hành động người dùng, quy tắc RBAC/SoD, và validation logic trước khi thực hiện đồng bộ giao diện theo chuẩn M41.

---

## 1. DANH MỤC SUB-TABS VÀ VAI TRÒ CHỨC NĂNG CỦA M16

| STT | Mã Tab | Tên Tab | Loại Màn Hình | Vai Trò Nghiệp Vụ |
|:---:|:---|:---|:---|:---|
| 1 | `terminal` | **Màn hình Bán hàng POS** | Catalog Grid + Live Cart + Fast Checkout Modal | Giao diện bán hàng trực tiếp tại quầy: tìm kiếm SKU/quét barcode, chọn danh mục, giỏ hàng thời gian thực, tính tạm tính/VAT 10%/tổng tiền, chọn khách lẻ/đối tác, mở modal thanh toán đa phương thức (Tiền mặt, Thẻ, VietQR) và xuất hóa đơn điện tử VAT. |
| 2 | `shift` | **Quản lý Ca trực & Két tiền** | Active Shift Card + Shift History Ledger Table + Open/Close Shift Modals | Quản lý ca làm việc của thu ngân: kiểm soát quỹ tiền mặt đầu ca (Opening Float), đối soát két tiền thực tế khi chốt ca (Actual Cash vs Expected Cash) qua bảng mệnh giá VNĐ, phát hiện chênh lệch (Variance) và lưu vết lịch sử ca. |
| 3 | `history` | **Lịch sử Giao dịch & Hóa đơn** | Transaction Master Table + Invoice 360° & GL Posting Modal | Nhật ký giao dịch bán lẻ tại quầy: tìm kiếm, lọc theo phương thức thanh toán, xem chi tiết hóa đơn, xem hạch toán sổ cái kép (Nợ 1111 / Có 5111 / Có 3331), in hóa đơn (`window.print`) và đồng bộ lên Context Rail. |

---

## 2. BẢNG CHI TIẾT TỪNG TAB: API, HÀNH ĐỘNG, RBAC/SOD, VALIDATION

### TAB 1: `terminal` — Màn hình Bán hàng POS (Catalog & Cart & Checkout)

1. **API Endpoints gọi trực tiếp:**
   - `GET /api/products`: Tải danh sách mặt hàng SKU bán lẻ, tồn kho (`stockQuantity`), giá bán (`retailPrice` / `price`).
   - `GET /api/categories`: Tải danh mục sản phẩm (fallback an toàn nếu lỗi).
   - `GET /api/customers`: Tải danh bạ khách hàng.
   - `GET /api/shift/active`: Kiểm tra ca trực đang hoạt động của quầy.
   - `POST /api/sales`: Tạo đơn hàng POS bán lẻ mới (`channel: 'POS'`, `source: 'POS_TERMINAL'`, `branchId`, `warehouseId`, `paymentIntent`, `fulfillmentIntent: IMMEDIATE`, `items`, `requiresVatInvoice`, `vatDetails`, `idempotencyKey`).
   - `POST /api/shift/cash-movement`: Ghi nhận luồng tiền mặt thu vào két nếu thanh toán tiền mặt (`movementType: 'POS_CASH_SALE'`, `direction: 'IN'`, `orderId`, `idempotencyKey`).

2. **Hành động người dùng (User Actions):**
   - Tìm kiếm nhanh sản phẩm qua `searchQuery` (theo tên, SKU, quét barcode).
   - Chọn bộ lọc danh mục (`selectedCategory`: 'ALL' hoặc danh mục tương ứng).
   - Click vào thẻ sản phẩm để thêm vào giỏ (`handleAddToCart`).
   - Tăng/giảm số lượng trong giỏ (`updateCartQty`).
   - Xóa từng món khỏi giỏ (`removeFromCart`).
   - Bấm nút xóa toàn bộ giỏ (`handleClearCart`) -> hiển thị `ConfirmDialog` xác nhận (variant: 'danger').
   - Chọn khách hàng từ dropdown (`selectedCustomer`: Khách lẻ vãng lai hoặc đối tác có sẵn).
   - Bấm nút "Thanh toán ngay" (`openCheckout`):
     - Kiểm tra giỏ hàng rỗng (`cart.length === 0`).
     - Kiểm tra trạng thái ca (`!activeShift`). Nếu chưa mở ca, thông báo cảnh báo và tự động chuyển sang tab `shift`.
   - Trong `CheckoutModal`:
     - Chọn phương thức: `CASH`, `CARD`, `QR`.
     - Tích chọn "Yêu cầu xuất hóa đơn điện tử VAT (e-Invoice)" -> mở form nhập tên công ty, MST, địa chỉ.
     - Bấm "Xác nhận hoàn tất" (`handleCompleteCheckout`) -> gửi payload, hiển thị loading spinner `processingPayment`, hoàn tất thì xóa giỏ, đóng modal và tải lại dữ liệu.

3. **Điều kiện RBAC & Segregation of Duties (SoD):**
   - Bắt buộc phải có ca trực đang mở (`activeShift !== null`) mới được thực hiện giao dịch thu tiền tại quầy.
   - Mọi giao dịch tiền mặt tại quầy phải liên kết chặt chẽ với `shiftId` và `cashDrawerId` để bảo đảm tính toàn vẹn khi đối soát két.

4. **Validation Code Cứng:**
   - Sản phẩm có `stock <= 0`: Không cho phép click thêm vào giỏ (`opacity-60 cursor-not-allowed`).
   - Giỏ hàng trống: Disabled nút "Thanh toán ngay".
   - Thuế VAT tính tự động 10%: `cartTax = cartSubtotal * 0.10`.
   - Sinh `idempotencyKey` ngẫu nhiên chống trùng lặp thanh toán: `POS-ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`.

---

### TAB 2: `shift` — Quản lý Ca trực & Két tiền (Shift & Cash Management)

1. **API Endpoints gọi trực tiếp:**
   - `GET /api/shift/active`: Lấy ca đang mở hiện tại.
   - `GET /api/shift/${cur.id}/summary`: Lấy dữ liệu tổng hợp ca trực (doanh thu kỳ vọng, chênh lệch).
   - `GET /api/shift/history`: Lấy toàn bộ lịch sử các ca đã mở/đóng.
   - `POST /api/shift/open`: Mở ca làm việc mới (`cashDrawerId`, `cashierUserId`, `cashierName`, `openingFloat`, `notes`).
   - `POST /api/shift/${activeShift.id}/close`: Chốt và khóa ca trực (`actualCash`, `denominations`, `notes`).

2. **Hành động người dùng (User Actions):**
   - Xem thông tin ca hiện tại: Tiền quỹ đầu ca, tiền mặt kỳ vọng hệ thống, thu ngân phụ trách, mã két/quầy.
   - Bấm "Mở Ca Trực Mới" khi chưa có ca:
     - Mở form modal nhập tiền quỹ đầu ca (`openingFloatInput`, mặc định 2.000.000đ).
     - Chọn quầy/két tiền (Drawer #1 hoặc Drawer #2).
     - Bấm Submit -> Kích hoạt `ConfirmDialog` xác nhận mở ca (variant: 'primary') -> gọi `POST /api/shift/open`.
   - Bấm "Đóng & Đối soát Ca" khi đang có ca mở:
     - Mở modal chốt ca: cho phép nhập trực tiếp tổng tiền mặt thực tế (`totalCashInput`) hoặc kiểm đếm chi tiết 9 loại mệnh giá VNĐ (500k, 200k, 100k, 50k, 20k, 10k, 5k, 2k, 1k).
     - Tự động cộng tổng tiền từ bảng mệnh giá (`totalCountedCash`).
     - Nhập ghi chú đối soát.
     - Bấm Submit -> Kích hoạt `ConfirmDialog` xác nhận chốt ca (variant: 'warning') -> gọi `POST /api/shift/${activeShift.id}/close`.
   - Tìm kiếm lịch sử ca trực theo mã ca, tên thu ngân (`shiftSearchQuery`).
   - Lọc ca theo trạng thái: ALL, OPEN, CLOSED (`shiftStatusFilter`).
   - Phân trang lịch sử ca (8 dòng/trang) qua `PaginationControl`.
   - Xuất file CSV danh sách ca trực (`handleExportCSV`).

3. **Điều kiện RBAC & Segregation of Duties (SoD):**
   - Chỉ được mở 1 ca hoạt động tại một thời điểm trên quầy.
   - Khi ca đã đóng (`status: 'CLOSED'`), ca bị khóa vĩnh viễn, không thể nhận thêm giao dịch bán hàng mới.

4. **Validation Code Cứng:**
   - Tiền quỹ đầu ca `openingFloatInput`: bắt buộc là số $\ge 0$.
   - Khi chốt ca: nếu có nhập `totalCashInput` thì ưu tiên lấy giá trị này, ngược lại lấy `totalCountedCash` từ bảng mệnh giá.

---

### TAB 3: `history` — Lịch sử Giao dịch & Hóa đơn (Transaction History & Invoice 360°)

1. **API Endpoints gọi trực tiếp:**
   - `GET /api/sales/omnichannel`: Tải toàn bộ đơn hàng bán, lọc theo điều kiện quầy bán lẻ: `channel === 'COUNTER' || orderId.startsWith('POS-') || code.startsWith('POS-')`.

2. **Hành động người dùng (User Actions):**
   - Tìm kiếm hóa đơn theo mã đơn hàng hoặc tên khách hàng (`txSearchQuery`).
   - Lọc theo phương thức thanh toán: ALL, CASH, CARD, QR (`txMethodFilter`).
   - Phân trang danh sách giao dịch (10 dòng/trang) qua `PaginationControl`.
   - Bấm nút icon "Xem chi tiết" (`Eye`):
     - Mở `TransactionDetailModal` (Hóa đơn 360°): xem chi tiết phương thức, tổng tiền, trạng thái thanh toán.
     - Xem bút toán định khoản kế toán tự động (Nợ TK 1111 / Có TK 5111 / Có TK 3331).
     - Bấm "In Hóa Đơn": kích hoạt `window.print()` và bắn thông báo `onNotify`.
     - Đồng bộ đối tượng đơn hàng lên Thanh Ngữ Cảnh (`onSelectEntity`) kèm Lineage, Audit Trail và GL Entries.
   - Xuất file CSV lịch sử giao dịch bán lẻ (`handleExportCSV`).

3. **Điều kiện RBAC & Segregation of Duties (SoD):**
   - Lịch sử hóa đơn bán lẻ là bất biến (Read-only). Không cho phép sửa đổi số tiền hay mã đơn sau khi đã phát hành.
   - Định khoản GL phân định rõ ràng giữa Doanh thu và Thuế GTGT đầu ra phải nộp (TK 3331).

4. **Validation Code Cứng:**
   - Phân trang cố định 10 dòng/trang.
   - Định dạng tiền tệ `formatVNDCurrency`.
