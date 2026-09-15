# M13 SALES ORDERS & VAT E-INVOICING (ORDER-TO-CASH)
## FEATURE BASELINE BEFORE UI/UX SYNCHRONIZATION (PHASE -1)

**Document Reference:** `/docs/design-specs/m13_FEATURE_BASELINE_BEFORE_SYNC.md`  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Module Replication Protocol)  
**Module Audited:** M13 Sales Orders Workspace (`/src/components/workspaces/M13SalesOrdersWorkspace.tsx`)  
**Backend Routes:** `/src/routes/sales.routes.ts`, `/api/sales/omnichannel`, `/api/sales/pricing/calculate-discount`, `/api/sales/payment/process`, `/api/sales/fulfillment/transition`  
**Audit Timestamp:** 2026-09-10T14:30:00.000Z  
**Baseline Status:** FROZEN BEFORE UI/UX REPLICATION

---

## 1. MỤC TIÊU & NGUYÊN TẮC BẢO TOÀN NGHIỆP VỤ BẤT BIẾN

Tài liệu này ghi lại toàn bộ "Feature Baseline" hiện hữu của Phân hệ M13 (Sales Orders & VAT E-Invoicing) trước khi thực hiện quy trình sao chép giao diện từ M12 theo Rule #20.

> ⚠️ **Cam kết bất biến:** Quá trình đồng bộ giao diện theo chuẩn M12 TUYỆT ĐỐI CHỈ thay đổi lớp trình bày (presentation layer: layout, typography, màu sắc, định dạng số liệu, bảng biểu, thẻ thống kê, thanh điều hướng quy trình vòng đời O2C). TOÀN BỘ 100% logic nghiệp vụ, API calls, event handlers, phân quyền, validation, dữ liệu và luồng thao tác dưới đây BẮT BUỘC PHẢI ĐƯỢC BẢO TOÀN NGUYÊN VẸN.

---

## 2. DANH MỤC TAB & PHẠM VI NGHIỆP VỤ HIỆN CÓ CỦA M13

M13 gồm 7 Tab nghiệp vụ chính, được quản lý qua hook `useWorkspaceSessionTab`:

| STT | Tab Key | Tên Tab Nghiệp Vụ | Loại Màn Hình | Vai Trò Chức Năng |
|---|---|---|---|---|
| 1 | `orders` | **Danh Sách Đơn Hàng SO** | Master Table + Quick Filter + Multi-line Creator + Detail Modal | Quản lý vòng đời đơn hàng B2B, nhập báo giá CRM M12, tạo SO nhiều dòng, thu tiền quyết toán GL, hủy đơn có điều kiện toàn vẹn VAT |
| 2 | `vat-invoices` | **Cổng Hóa Đơn VAT Điện Tử** | Regulatory Invoicing Table + HSM Modal + PDF Exporter | Phát hành hóa đơn VAT điện tử chuẩn NĐ 123/2020/NĐ-CP & TT 78, ký số Cloud HSM, cấp mã CQT và tải tệp in ấn PDF A4 |
| 3 | `discounts` | **Chiết Khấu Động (M07/M41)** | Dynamic Pricing Matrix & Calculator | Tính toán ma trận chiết khấu theo hạng khách hàng (VIP/Wholesale/Retail), số lượng mua, điều khoản thanh toán qua API `/api/sales/pricing` |
| 4 | `reservation` | **Giữ Chỗ Tồn Kho (Reservation)** | ATP Inventory Allocation Table | Kiểm soát lượng hàng ATP (Available-to-Promise), giữ chỗ tồn kho (Stock Reservation) cho đơn hàng xác nhận |
| 5 | `fulfillment` | **Xuất Kho WMS (Fulfillment)** | Multi-Stage Kanban & Table View | Vận hành quy trình xuất kho WMS 4 bước (Picking -> Packing -> Staging -> Shipped / Goods Issue), tích hợp cảnh báo quá tải Staging |
| 6 | `analytics` | **Phân Tích Doanh Số & Thuế VAT** | Executive BI Dashboard | Thống kê doanh thu thuần, thuế GTGT đầu ra (TK 33311), tỷ lệ hóa đơn điện tử và cơ cấu kênh bán buôn vs bán lẻ |
| 7 | `test-runner` | **Kiểm Thử Từng Task M13** | Interactive Task Test Runner | Bàn chạy kiểm thử 5 kịch bản tự động xác thực trọn vẹn chu trình Order-to-Cash (Hạn mức -> Giữ chỗ -> Ký số HSM -> Xuất kho WMS -> Định khoản GL) |

---

## 3. BẢNG ĐẶC TẢ CHI TIẾT TỪNG TAB CỦA M13 (PRE-SYNC BASELINE)

### 3.1 TAB 1: `orders` — DANH SÁCH ĐƠN BÁN HÀNG SO & QUYẾT TOÁN

#### A. API Endpoints & Nguồn dữ liệu
1. `GET /api/sales/omnichannel`:
   - Polling đồng bộ 2 giây/lần hoặc lắng nghe sự kiện `storage`.
   - Nạp đơn hàng bán lẻ từ M16 POS có yêu cầu hóa đơn VAT (`requiresVatInvoice: true`).
2. `GET /api/customers`: Nạp danh bạ khách hàng B2B cho modal tạo đơn hàng.
3. `GET /api/products`: Nạp danh mục SKU và tồn kho khả dụng từ M07/M17.
4. `POST /api/sales/orders` hoặc `/api/sales/orders/create`: Tạo đơn hàng B2B multi-line mới.
5. `POST /api/sales/payment/process`:
   - Ghi nhận thanh toán thu tiền (Chuyển khoản, Tiền mặt, Thẻ POS).
   - Tự động sinh bút toán định khoản GL: Nợ TK 1111/1121, Có TK 1311.
6. `GET /api/crm/quotations`: Nạp danh sách báo giá đã được duyệt (`ACCEPTED`) từ M12 để chuyển đổi sang SO.

#### B. Hành động người dùng (User Actions)
1. **Làm mới dữ liệu (`RefreshCw`)**: Kích hoạt polling làm mới danh sách đơn hàng.
2. **Xuất tệp CSV (`Download`)**: Tải tệp `sales_orders_vat_o2c_report_YYYY-MM-DD.csv`.
3. **Mở Modal Nhập Báo Giá CRM (`isQuotationImportModalOpen`)**: Chọn báo giá M12 nạp trực tiếp vào form SO.
4. **Mở Modal Tạo Đơn Hàng Mới Multi-Line (`isCreateOrderModalOpen`)**: Thêm nhiều dòng hàng, tính chiết khấu động, thuế VAT.
5. **Mở Modal Thu Tiền / Quyết Toán (`isPaymentModalOpen`)**: Nhập số tiền thu, phương thức, tài khoản GL hạch toán.
6. **Mở Modal Hồ Sơ Đơn Hàng 360° (`selectedOrderForModal`)**: Xem chi tiết dòng hàng, trạng thái VAT, tiến độ giao kho và thanh toán.
7. **Hủy đơn hàng SO (`handleCancelOrder`)**:
   - **Quy tắc bảo vệ toàn vẹn**: Nếu `vatStatus === 'ISSUED'`, hệ thống **CHẶN HỦY TRỰC TIẾP**, hiển thị thông báo lỗi yêu cầu hủy hóa đơn theo NĐ 123.
   - Nếu đủ điều kiện: Mở `ConfirmDialog` xác nhận và chuyển trạng thái sang `CANCELLED`, đồng thời giải phóng tồn kho (`RELEASED`).
8. **Chuyển sang màn hình Xuất Hóa Đơn VAT (`handleOpenVatModal`)**: Kiểm tra điều kiện đủ (`checkVatEligibility`), mở form phát hành VAT.

#### C. Điều kiện hiển thị & RBAC
- Nút "Xuất HĐ VAT": Chỉ hiển thị khi đơn hàng chưa phát hành hóa đơn (`vatStatus !== 'ISSUED'`) và không bị hủy.
- Nút "Thu Tiền": Luôn khả dụng để ghi nhận các đợt thanh toán/tạm ứng.
- Huy hiệu "ĐÃ XUẤT HĐ": Hiển thị khi `vatStatus === 'ISSUED'` kèm số hóa đơn màu tím.

---

### 3.2 TAB 2: `vat-invoices` — CỔNG HÓA ĐƠN VAT ĐIỆN TỬ (E-INVOICING PORTAL)

#### A. API Endpoints
1. Ký số HSM & Cấp mã CQT: Mô phỏng dịch vụ chứng thực chữ ký số Cloud HSM và Tổng cục Thuế.
2. `downloadVatElectronicInvoicePdf`: Sinh tệp PDF A4 Hóa đơn điện tử có mã QR tra cứu, mã CQT và chữ ký số SHA-256.

#### B. Hành động người dùng
1. **Phát hành Hóa đơn VAT mới**: Điền MST, Địa chỉ, Email nhận HĐ, Thuế suất (0%, 5%, 8%, 10%), Phương thức thanh toán (TM/CK).
2. **Ký số Cloud HSM**: Kích hoạt tiến trình ký số (hiển thị trạng thái `Signing...`), cấp mã CQT và số hóa đơn.
3. **Tải PDF Hóa đơn đã phát hành (`handleDownloadExistingVatPdf`)**: Tải bản in điện tử chuẩn NĐ 123.
4. **Tìm kiếm & Phân trang Hóa đơn VAT**: Lọc theo số HĐ, tên người mua, MST.

---

### 3.3 TAB 3: `discounts` — CHIẾT KHẤU ĐỘNG (DYNAMIC PRICING)

#### A. API Endpoints
1. `POST /api/sales/pricing/calculate-discount`:
   - Payload: `{ customerTier, orderValue, paymentTerms, quantity, basePrice }`
   - Response: `{ discountPercentage, discountAmount, finalPrice, ruleApplied }`

#### B. Hành động người dùng
1. Kiểm tra chính sách chiết khấu theo cấp bậc khách hàng (VIP Diamond 15%, Gold 10%, Silver 5%).
2. Thử nghiệm tính toán chiết khấu đơn hàng tức thì.

---

### 3.4 TAB 4: `reservation` — GIỮ CHỖ TỒN KHO (ATP INVENTORY RESERVATION)

#### A. Logic nghiệp vụ
- Hiển thị danh sách các SKU được giữ chỗ (Allocated / Reserved) cho từng đơn hàng SO.
- Đối soát lượng ATP = Tồn vật lý - Lượng giữ chỗ - Lượng chờ giao.

---

### 3.5 TAB 5: `fulfillment` — XUẤT KHO WMS (FULFILLMENT GOODS ISSUE)

#### A. Logic nghiệp vụ
1. **Chuyển trạng thái 4 bước**: `PENDING_PICKING` -> `PACKING` -> `STAGING` -> `SHIPPED`.
2. **Chuyển chế độ xem**: Kanban Board vs Master Table.
3. **Cảnh báo hàng chờ Staging**: Hiển thị cảnh báo màu vàng khi số đơn ở Staging vượt ngưỡng định mức (threshold = 3).
4. **Xác nhận Xuất kho chính thức (Goods Issue)**: Mở `ConfirmDialog`, khi xác nhận sẽ chuyển sang `SHIPPED` và trạng thái SO thành `FULFILLED`, trừ kho vật lý.

---

### 3.6 TAB 6: `analytics` — PHÂN TÍCH DOANH SỐ & THUẾ VAT

#### A. Logic nghiệp vụ
- Tổng doanh thu bán hàng B2B và B2C.
- Tổng thuế GTGT đầu ra phát sinh (TK 33311).
- Tỷ lệ hoàn tất hóa đơn điện tử (Invoicing Compliance Rate).
- Phân bổ doanh số theo nhóm ngành và trạng thái đơn hàng.

---

### 3.7 TAB 7: `test-runner` — KIỂM THỬ TỪNG TASK M13

#### A. Logic nghiệp vụ
- 5 kịch bản tự động kiểm thử toàn diện chu trình Order-to-Cash (Hạn mức tín dụng -> Giữ chỗ tồn kho -> Ký số HSM VAT -> Xuất kho WMS -> Hạch toán Sổ cái GL).
- Nút "Chạy Tất Cả Kiểm Thử" (Run All Tests) với độ trễ trực quan và thanh tiến trình phản hồi.

---

## 4. MA TRẬN BẢO TOÀN DỮ LIỆU & RỦI RO REGRESSION

Toàn bộ các state, props và handlers trên phải được nối dây 100% vào các sub-components presentation layer mới của M13, không để rơi rụng bất kỳ handler nào.
