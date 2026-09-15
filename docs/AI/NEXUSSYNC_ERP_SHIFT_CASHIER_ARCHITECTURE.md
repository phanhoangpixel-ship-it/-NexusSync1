# NEXUSSYNC ERP — KIẾN TRÚC QUẢN LÝ CA THU NGÂN & KÉT TIỀN (SHIFT & CASHIER MANAGEMENT ARCHITECTURE)

**Mã tài liệu:** `ARC-M16-SHIFT-CASHIER-001`  
**Thuộc module:** `M16 - POS & Retail Management / Workspace M16`  
**Phạm vi áp dụng:** Toàn hệ thống NexusSync ERP (L0 - L4)  
**Trạng thái:** `APPROVED & ACTIVE`

---

## 1. MỤC ĐÍCH & NGUYÊN TẮC THIẾT KẾ CỐT LÕI

Kiến trúc Quản lý Ca Thu Ngân & Két Tiền (`Shift & Cashier Management`) trong NexusSync ERP được thiết kế nhằm đảm bảo:
1. **Kiểm soát tuyệt đối dòng tiền mặt (Cash Control)** tại điểm bán (POS), loại bỏ thất thoát, gian lận và sai lệch giữa số liệu thực tế trong két (`Actual Cash Drawer`) với số liệu ghi nhận trên hệ thống sổ cái (`General Ledger - Account 1111`).
2. **Tuân thủ Nguyên tắc Đơn lẻ (Single-Writer Principle)**: Chỉ có `ShiftService` và `CashDrawerService` mới có thẩm quyền ghi (`Write Authority`) trạng thái ca làm việc và các giao dịch két tiền.
3. **Minh bạch Chứng từ Kế toán (Automated GL Posting)**: Mọi thao tác mở ca, nộp tiền (`Cash Drop`), rút tiền (`Cash Payout`), và chênh lệch cuối ca (`Cash Short/Over`) đều tự động sinh bút toán kép đối ứng vào Sổ cái (`General Ledger`) và Trung tâm Chi phí (`Cost Center`).

---

## 2. KIẾN TRÚC ĐA TẦNG L0 – L4

### Tầng L0: Enterprise Foundation & Event Bus (Hạ tầng & Luồng sự kiện)
- **Event Bus EDA**: Phát hành và lắng nghe các sự kiện thời gian thực khi có biến động ca làm việc hoặc két tiền:
  - `SHIFT_OPENED`: Khởi tạo ca, ghi nhận tiền quỹ đầu ca (`Opening Float`).
  - `CASH_DROPPED`: Rút tiền két an toàn trong ca (`Safe Drop / Cash Drop`).
  - `CASH_PAID_OUT`: Chi tiền mặt khẩn cấp từ két trong ca (`Expense Payout`).
  - `SHIFT_CLOSED`: Chốt ca, tính toán chênh lệch (`Short / Over`).
  - `DISCREPANCY_FLAGGED`: Cảnh báo chênh lệch tiền mặt vượt hạn mức cho phép (> 50,000 VND), yêu cầu Giám sát/Quản lý phê duyệt (`Supervisor Override`).

### Tầng L1: Domain Models & Database Schema (Mô hình dữ liệu & Cấu trúc bảng)
- **`CashShifts` (Bảng Ca làm việc)**:
  - `shiftId` (PK), `registerId`, `storeId`, `cashierUserId`, `cashierName`
  - `openedAt`, `closedAt`, `status` (`OPEN`, `PENDING_VERIFICATION`, `CLOSED`)
  - `openingFloat`, `cashSalesTotal`, `cardSalesTotal`, `transferSalesTotal`, `qrSalesTotal`
  - `cashDropsTotal`, `payoutsTotal`, `expectedCashInDrawer`, `actualCountedCash`
  - `discrepancyAmount`, `discrepancyReason`, `supervisorApprovalId`
- **`CashDrawerTransactions` (Bảng Nhật ký dòng tiền két)**:
  - `transactionId` (PK), `shiftId`, `type` (`OPENING_FLOAT`, `CASH_SALE`, `CASH_DROP`, `EXPENSE_PAYOUT`, `REFUND_CASH`, `CLOSING_COUNT`), `amount`, `referenceNo`, `note`, `performedBy`, `timestamp`
- **`CashDenominations` (Bảng Kiểm đếm mệnh giá tiền mặt)**:
  - Lưu chi tiết số lượng từng tờ tiền (500k, 200k, 100k, 50k, 20k, 10k, 5k, 2k, 1k, lẻ) tại thời điểm chốt ca.

### Tầng L2: Domain Services & Business Logic Engine (Dịch vụ nghiệp vụ)
- **`ShiftService`**:
  - `openShift(registerId, cashierId, openingFloat)`: Khóa két ca mới, yêu cầu xác thực số dư đầu ca.
  - `recordCashDrop(shiftId, amount, reason)`: Thực hiện rút tiền an toàn đưa vào két sắt chính.
  - `recordPayout(shiftId, amount, expenseCategory, notes)`: Ghi nhận phiếu chi tiền mặt trong ca.
  - `closeShift(shiftId, denominationCounts, note)`: Thực hiện đối soát số dư lý thuyết vs thực tế, tính chênh lệch, gọi dịch vụ kế toán sinh bút toán đối ứng.
- **`CashDrawerService`**:
  - Quản lý trạng thái vật lý của két tiền tự động (Mở két tự động qua lệnh in hóa đơn POS hoặc phân quyền đặc biệt).

### Tầng L3: Integration & Accounting/Inventory Bridge (Tích hợp Kế toán & Tồn kho)
- **Automatic GL Posting**:
  - Khi chốt ca lệch thừa (`Short/Over`):
    - Dư tiền: Nợ TK 1111 (Tiền mặt) / Có TK 3388 (Phải trả, phải nộp khác - Thừa quỹ chờ xử lý).
    - Thiếu tiền: Nợ TK 1381 (Tài sản thiếu chờ xử lý - Trách nhiệm thu ngân) / Có TK 1111 (Tiền mặt).
  - Tự động đồng bộ doanh số ca làm việc vào Báo cáo Kết quả Kinh doanh (`Income Statement`) và dòng tiền (`Cash Flow Statement`).

### Tầng L4: UI / UX Presentation Layer (Giao diện người dùng)
- Tích hợp trực tiếp tại **Tab Quản Lý Ca (`shift`)** và **Tab Thu Ngân POS (`pos`)** trong Workspace M16:
  - **Màn hình Mở ca**: Nhập số tiền quỹ đầu ca (`Opening Float Counter`).
  - **Màn hình Vận hành ca**: Các nút thao tác nhanh `Nộp tiền két (Cash Drop)`, `Chi tiền mặt (Payout)`, `Kiểm tra số dư két`.
  - **Màn hình Chốt ca (Blind Close / Audit Close)**: Giao diện kiểm đếm chi tiết theo mệnh giá tiền mặt, tự động tính chênh lệch âm/dương, kích hoạt `ConfirmDialog` xác nhận và yêu cầu phê duyệt từ cấp quản lý nếu vượt ngưỡng dung sai.

---

## 4. QUY TRÌNH NGHIỆP VỤ CHUẨN (SOP)

1. **Bắt đầu ca làm việc**: Thu ngân đăng nhập POS -> Chọn quầy thu ngân -> Nhập số tiền mặt thực tế trong két đầu ca -> Hệ thống ghi nhận bút toán `SHIFT_OPENED`.
2. **Trong ca làm việc**: Mọi giao dịch bán hàng tiền mặt tự động cộng dồn vào két. Khi tiền mặt trong két vượt mức quy định (ví dụ > 5,000,000 VND), hệ thống cảnh báo thực hiện `Cash Drop` (Nộp tiền về két chính an toàn).
3. **Kết thúc ca làm việc**: Thu ngân bấm "Chốt ca" -> Nhập số lượng từng mệnh giá tiền mặt thực đếm trong két (`Cash Denomination Count`) -> Hệ thống đối chiếu tự động với doanh số ghi nhận -> Nếu chênh lệch = 0, hoàn tất chốt ca. Nếu chênh lệch khác 0, hệ thống yêu cầu giải trình và yêu cầu Quản lý cửa hàng (`Store Manager`) nhập mã PIN/Xác thực phê duyệt để kết thúc ca.
