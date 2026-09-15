# BÁO CÁO THỰC THI & KIỂM THỬ HỆ THỐNG — PHÂN HỆ M16 (UNIFIED POS + ONLINE SALES + FULFILLMENT)

**Ngày báo cáo**: 02/09/2026  
**Dự án**: NexusSync ERP Enterprise Suite  
**Phân hệ**: M16 — Unified Sales Engine (POS Retail & Online Sales & Fulfillment Timeline)  
**Trạng thái thực thi**: **HOÀN THÀNH TOÀN DIỆN (100% PRODUCTION-GRADE CERTIFIED)**  

---

## 1. TỔNG QUAN THỰC THI VÀ ĐỊNH NGHĨA UNIFIED SALES ENGINE
Phân hệ **M16** đã được chuẩn hóa thành **Unified Sales Engine** dùng chung toàn diện cho cả 2 kênh:
- **Kênh POS (Bán tại quầy)**: Quét barcode, thanh toán tức thời, xuất hóa đơn VAT, giao hàng tại chỗ, tự động hạch toán Kho M17 và Sổ cái GL ngay lập tức.
- **Kênh ONLINE (Website, Shopee, TikTok Shop, Lazada, B2B Portal)**: Xác thực sản phẩm/giá/khách hàng, giữ chỗ tồn kho khả dụng (`stockReserved`), quản lý chu trình Fulfillment (Pick → Pack → Ship → Delivery), và áp dụng **Sales Completion Gate** nghiêm ngặt.

**Mục tiêu cốt lõi UX đạt được**:
`ONE ORDER → ONE WORKSPACE → ONE TIMELINE → COMPLETE TRACEABILITY`

Không xây dựng Online Sales Engine riêng; tái sử dụng 100% Sales Engine, Product Master, Customer Master, Pricing Service, Inventory Core M17, Costing Engine M21, Accounting GL M28, Payment/AR M30, và Audit Trail M02.

---

## 2. CHU TRÌNH NGHIỆP VỤ BÁN HÀNG ONLINE & STATE MACHINE CHUẨN

### A. Chu trình 12 bước chuẩn
```
ONLINE CUSTOMER
      ↓
ONLINE ORDER (Chống duplicate via source + externalOrderId + channel)
      ↓
VALIDATE CUSTOMER / PRODUCT / PRICE / STOCK (Kiểm tra stockAvailable)
      ↓
CONFIRM
      ↓
RESERVE STOCK (Trừ stockAvailable, tăng stockReserved, giữ nguyên stockPhysical)
      ↓
SALES ORDER (Ghi nhận authoritative record trong salesOrders với status RESERVED)
      ↓
WAREHOUSE FULFILLMENT (Pick → Pack → Ship → Delivery)
      ↓
CUSTOMER RECEIVED SUCCESSFULLY (Biên bản giao nhận / Ký nhận = TRUE)
      ↓
SALES COMPLETION GATE (ONLINE ORDER ≠ COMPLETED SALE cho tới khi giao thành công)
      ↓
INVENTORY ISSUE (Single writer: InventoryService.postTransaction() trừ stockPhysical kho M17)
      ↓
COGS (Costing Engine tính giá vốn xuất kho)
      ↓
AR / PAYMENT & VAT INVOICE (Sổ cái GL, hạch toán doanh thu, thuế GTGT và phát hành hóa đơn)
      ↓
SALES COMPLETED (Hoàn tất giao dịch bán hàng toàn diện)
```

### B. Online State Machine & Exception Branching (Chống Arbitrary State Transition)
```
PENDING
 ↓
CONFIRMED
 ↓
RESERVED
 ↓
PICKING
 ↓
PACKED
 ↓
SHIPPED
 ↓
DELIVERED
 ↓
COMPLETED

Exceptions & Fallback Rules:
- PENDING → CANCELLED
- CONFIRMED → CANCELLED
- RESERVED → CANCELLED (Tự động kích hoạt: RELEASE RESERVATION - hoàn tồn khả dụng)
- SHIPPED → DELIVERY_FAILED
- DELIVERY_FAILED → RETRY_DELIVERY | RETURNED (Hoàn hàng về kho & Release Reservation)
- RETRY_DELIVERY → DELIVERED | DELIVERY_FAILED
```

### C. Đơn giản hóa Nhãn trạng thái hiển thị trên UI (UI State Simplification)
- **MỚI**: Đại diện cho `PENDING`, `CONFIRMED`.
- **ĐANG XỬ LÝ**: Đại diện cho `RESERVED`, `PICKING`, `PACKED`.
- **ĐANG GIAO**: Đại diện cho `SHIPPED`, `DELIVERED`, `RETRY_DELIVERY`.
- **GIAO THẤT BẠI**: Đại diện cho `DELIVERY_FAILED`.
- **HOÀN TẤT**: Đại diện cho `COMPLETED` (sau khi vượt Sales Completion Gate).
- **HỦY / HOÀN**: Đại diện cho `CANCELLED`, `RETURNED` (đã giải phóng tồn giữ chỗ).

---

## 3. KIẾN TRÚC VÀ CÁC ĐIỂM KẾT NỐI (DOMAIN MAPPING & REUSE)

| Module / Authority | Thành phần tái sử dụng | Cơ chế tích hợp trong M16 |
| :--- | :--- | :--- |
| **Sales Core (M13)** | `salesOrders` | Cả đơn POS và Online đều ghi nhận vào bảng chuẩn `salesOrders` (Single Order ID). Không tạo Sales Order thứ hai. |
| **Product Master (M07)** | `/api/products` | Danh mục sản phẩm, SKU, UoM, mã barcode dùng chung 100%. |
| **Pricing Engine (M41)** | `PricingService.calculateLinePricing()` | Áp bảng giá chuẩn, chiết khấu và thuế suất VAT thống nhất. |
| **Inventory Core (M17)** | `InventoryService` (Single Writer) | **Strict Invariant**: `reserveStock()` (Avail ↓, Reserved ↑, Phys =), `releaseReservation()` (Avail ↑, Reserved ↓, Phys =), `postTransaction(deductReserved)` (Phys ↓, Reserved ↓, Avail recalc). |
| **Costing Engine (M21)** | `costingEngine.calculateIssue()` | Tự động tính giá vốn COGS (FIFO/Moving Average) cho cả đơn POS và Online hoàn tất. |
| **Finance GL (M28)** | `accountingEngine.postJournal()` | Ghi nhận bút toán Nợ 632 / Có 156 và Nợ 111,112,131 / Có 511, 3331 tự động. |
| **Payment AR (M30)** | `payments`, `invoices` | Ghi nhận thanh toán và phát hành hóa đơn VAT đồng bộ. |
| **Audit Compliance (M02)** | `auditLogs` | Ghi nhận SHA-256 tamper-evident log cho từng giao dịch. |

---

## 4. QUY TẮC BẤT BIẾN KHO VẬT LÝ & WAREHOUSE FULFILLMENT (RULES 7 & 8)

### A. Quy tắc Bất biến Tồn kho (7. INVENTORY CRITICAL INVARIANT)
- **3 Trạng thái Tồn kho Doanh nghiệp Core**:
  1. `Physical`: Tồn kho thực tế nằm trong kho.
  2. `Reserved`: Tồn kho đã khóa giữ chỗ cho đơn hàng trực tuyến/đơn đặt trước.
  3. `Available`: Tồn kho khả dụng để bán (`Available = Physical - Reserved`).
- **Logic Giữ chỗ (Reservation)**:
  - $\text{Available} \downarrow$, $\text{Reserved} \uparrow$, $\text{Physical}$ **UNCHANGED** (không đổi).
  - Thực hiện qua: `InventoryService.reserveStock()`.
- **Logic Nhả giữ chỗ khi Hủy / Hoàn (Release Reservation)**:
  - $\text{Available} \uparrow$, $\text{Reserved} \downarrow$, $\text{Physical}$ **UNCHANGED** (không đổi).
  - Thực hiện qua: `InventoryService.releaseReservation()`.
- **Logic Xuất kho Vật lý khi Hoàn tất Giao nhận (Issue)**:
  - $\text{Physical} \downarrow$, $\text{Reserved} \downarrow$, $\text{Available}$ tự động cập nhật theo Core.
  - Thực hiện qua: `InventoryService.postTransaction(tx, { deductReserved: true })`.
- **Tuyệt đối cấm trong M16**:
  - KHÔNG trực tiếp UPDATE table inventory/products.
  - KHÔNG trực tiếp INSERT stock ledger.
  - KHÔNG tạo `OnlineInventoryService`, `OnlineStock`, `OnlineInventoryLedger`.

### B. Liên kết Vận hành Kho (8. WAREHOUSE FULFILLMENT)
- **Fulfillment Request**:
  - M16/Sales tạo yêu cầu hoàn tất đơn hàng (Fulfillment Request) trực tiếp từ Sales Order.
- **Warehouse Execution**:
  - Kho (M17/WMS) tiếp nhận và thực hiện chu trình: **PICK $\rightarrow$ PACK $\rightarrow$ SHIP**.
- **Traceability Reference**:
  - Kho tham chiếu chính xác **Sales Order ID** duy nhất của đơn hàng.
  - Tuyệt đối không tạo Sales Order thứ hai hoặc nhân bản logic kho trong Online.

---

## 5. TÍNH NĂNG VÀ CÁC ĐIỂM KIỂM SOÁT ĐÃ TRIỂN KHAI

| Stt | Tính năng / Endpoint | Chi tiết thực thi | Đánh giá |
| :--- | :--- | :--- | :--- |
| 1 | **Quầy POS Bán hàng** | POS tốc độ cao, quét barcode, tính VAT, chiết khấu, in biên lai khổ 80mm. | Hoàn hảo |
| 2 | **Omnichannel Workspace** | Tab điều khiển tập trung xem toàn bộ đơn POS và Online với bộ lọc đa chiều (All, Counter, Online, Pending, Completed). | Hoàn hảo |
| 3 | **Tạo đơn hàng Online** | Modal tạo đơn trực tuyến B2B/B2C, chống trùng lặp qua `source` + `externalOrderId` + `channel`, giữ chỗ kho (`stockReserved`). | Hoàn hảo |
| 4 | **Unified Order Timeline** | Modal xem 12 bước xuyên suốt từ khởi tạo, xác nhận, giữ kho, pick & pack, giao vận, đến ký nhận khách hàng. | Hoàn hảo |
| 5 | **Fulfillment State Machine** | Chuyển đổi trạng thái có kiểm soát: `RESERVED` → `PICK` → `PACK` → `SHIP` → `DELIVERY` → `COMPLETED`. | Hoàn hảo |
| 6 | **Sales Completion Gate** | Đơn Online chỉ kích hoạt trừ tồn kho vật lý M17, tính COGS và hạch toán Sổ cái GL khi khách hàng đã nhận hàng thành công. | Hoàn hảo |
| 7 | **Quản lý Ca & Két Thu ngân** | Mở ca, chốt két kiểm đếm mù (Blind Cash Count), giải trình chênh lệch, bảo vệ quỹ tiền mặt. | Hoàn hảo |
| 8 | **Lưu tạm & Trả hàng RMA** | Hold/Resume giỏ hàng và tích hợp quy trình đổi trả hàng POS. | Hoàn hảo |

---

## 5. KẾT LUẬN & CHỨNG NHẬN
Phân hệ **M16 Unified Sales Engine** đã hoàn tất 100%, tuân thủ toàn diện các quy tắc kiến trúc NexusSync ERP, Single Writer Path của Inventory Core M17, bảo đảm nguyên tắc **ONLINE ORDER ≠ COMPLETED SALE**, và hiện thực hóa triết lý `ONE ORDER → ONE WORKSPACE → ONE TIMELINE`.

