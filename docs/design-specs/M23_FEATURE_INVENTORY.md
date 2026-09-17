# NEXUSSYNC ERP — MODULE M23 (SERIALS & IMEI) FEATURE INVENTORY & ARCHITECTURE REPORT

## 1. Executive Summary & Overview
Module M23 (`Serials & IMEI` / `M23_SERIALS_IMEI`) manages individual serial numbers, IMEI codes, UDI (Unique Device Identification) for medical devices, and engine numbers for machinery. It tracks equipment across its entire lifecycle: Initial Inward GRN ➔ Quality Inspection (IQC) ➔ Warehouse Storage ➔ Internal Transfers ➔ Sales/Issue ➔ Warranty Claims ➔ Return/Scrap.

---

## 2. Phase 1 — Detailed Feature Inventory Table

| Tab / Màn hình | Tính năng / Widget | Trạng thái | API liên kết | Bảng DB liên quan | Vai trò nghiệp vụ |
|---|---|---|---|---|---|
| **Danh sách Serial / IMEI** | Bảng dữ liệu toàn bộ Serial/IMEI kèm mã SKU, tên sản phẩm, kho, vị trí, trạng thái (`IN_STOCK`, `SOLD`, `WARRANTY`, `DEFECTIVE`) | **Hoạt động đầy đủ** | `GET /api/serials` (fallback memory/DB) | `serial_numbers`, `products` | Quản lý tồn kho theo từng đơn vị cá thể (item-level tracking). |
| **Tìm kiếm & Bộ lọc** | Input tìm kiếm theo Serial/IMEI, SKU, tên sản phẩm, khách hàng; Dropdown lọc theo trạng thái | **Hoạt động đầy đủ** | Client-side filter trên state `serials` | `serial_numbers` | Truy vấn nhanh mã định danh thiết bị. |
| **Đăng ký Serial / IMEI mới** | Modal đăng ký thủ công serial/IMEI mới khi nhập kho hoặc kiểm kê | **Hoạt động đầy đủ** | `POST /api/serials` | `serial_numbers`, `serial_history` | Khởi tạo định danh thiết bị trong hệ thống WMS. |
| **Thao tác Vòng đời (Action Modal)** | Cập nhật trạng thái: Xuất bán (SELL), Tiếp nhận bảo hành (WARRANTY), Hoàn tất bảo hành (RESOLVE_WARRANTY), Điều chuyển kho (TRANSFER), Báo hỏng (DEFECTIVE) | **Hoạt động đầy đủ** | `POST /api/serials/:id/actions` | `serial_numbers`, `serial_history`, `serial_transactions` | Cập nhật trạng thái vòng đời có Rule #19 ConfirmDialog bảo vệ. |
| **Hồ sơ Ngành hàng (Profiles)** | Quản lý quy tắc tiền tố (Prefix: `MED-`, `IMEI-`, `MCH-`, `SN-`), thời hạn bảo hành mặc định cho từng ngành hàng | **Hoạt động đầy đủ** | `GET /api/serial-profiles` | `serial_profiles` | Chuẩn hóa quy tắc đặt tên và thời hạn bảo hành theo loại thiết bị. |
| **Nhật ký Vòng đời (Audit Trail)** | Lịch sử toàn bộ các sự kiện thay đổi của serial/IMEI (Nhập, Kiểm định, Chuyển kho, Xuất bán, Bảo hành) | **Hoạt động đầy đủ** | `GET /api/serial-history` | `serial_history` | Đảm bảo tính minh bạch, truy xuất nguồn gốc chống gian lận. |
| **Serial 360° Inspector Drawer** | Bảng điều khiển chi tiết bên phải (Inspector) hiển thị sơ đồ phả hệ, timeline sự kiện và audit trail khi click chọn serial | **Hoạt động đầy đủ** | `onSelectEntity` hook & `serial_history` | `serial_history`, `serial_transactions` | Giám sát toàn diện lịch sử vòng đời 360 độ của thiết bị. |
| **Xuất Excel / CSV** | Xuất danh sách serial và trạng thái ra file CSV tiêu chuẩn | **Hoạt động đầy đủ** | Client-side Blob download | N/A | Báo cáo và kiểm toán ngoại tuyến. |
| **In Nhãn (Barcode/QR)** | Tạo và in nhãn mã vạch/QR code kèm thông tin Serial | **UI có nhưng thiếu API** | Client print view | N/A | Dán nhãn vật lý lên sản phẩm tại kho. |

---

## 3. Phase 2 — Feature Selection & Justification

### Chức năng được chọn nâng cấp: **Phả hệ thiết bị đầy đủ & API 360° Traceability (Full Device Lifecycle Trace & API Integration)**
- **Lý do chọn**: Mặc dù giao diện (UI) đã có khung timeline, việc đồng bộ hóa dữ liệu từ các nghiệp vụ nhập kho (M08), bán hàng (M13/M16), điều chuyển/xuất kho (M17), và bảo hành (M38/M39) cần một API backend chuyên biệt `GET /api/serials/:serialNumber/history` và `GET /api/serials/:serialNumber/360` để cung cấp phả hệ thiết bị chính xác 100% từ cơ sở dữ liệu thực tế (Database).
- **Kiểm tra Single-Writer Enforcement**:
  - `SerialEngine.validateSerialsForIssue()` kiểm tra chặt chẽ `productId`, `warehouseId`, `locationId`, và trạng thái `IN_STOCK`.
  - Không cho phép xuất 2 lần (`SOLD` hoặc `ISSUED` chặn tuyệt đối).
  - Không cho phép xuất sai kho hoặc sai vị trí.

---

## 4. Phase 3 & 4 — Design, API Contracts & Cross-Module Integration
- **API Endpoints Mới bổ sung**:
  - `GET /api/serials/:serialNumber/history`: Trả về toàn bộ lịch sử sự kiện (timeline) và giao dịch liên kết của Serial.
  - `POST /api/serials/:serialNumber/warranty-claim`: Tiếp nhận yêu cầu bảo hành/sửa chữa liên kết với Service Desk (M38).
- **Liên kết chéo (Cross-Module Integration)**:
  - **M08 (Purchase / Goods Receipt)**: Kiểm tra `isSerialTracked = true`, gọi `SerialEngine.receiveSerials()`.
  - **M13 (Sales Orders) / M16 (POS)**: Gọi `SerialEngine.issueSerials()` với transactionType `'SALE'`, chuyển trạng thái `SOLD`.
  - **M17 (Inventory Core)**: Goods Issue kiểm tra nghiêm ngặt `(productId, warehouseId, locationId, status=IN_STOCK)`.
  - **M15 / RMA (Returns)**: Xử lý trả hàng, đưa serial về `RETURNED` hoặc `IN_STOCK`.
