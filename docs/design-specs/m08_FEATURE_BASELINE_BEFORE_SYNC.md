# M08 PURCHASE ORDERS & 3-WAY MATCHING (P2P)
## FEATURE BASELINE BEFORE UI/UX SYNCHRONIZATION (PHASE -1)

**Document Reference:** `/docs/design-specs/m08_FEATURE_BASELINE_BEFORE_SYNC.md`  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Replication Protocol)  
**Module Audited:** M08 Purchase Orders Workspace (`/src/components/workspaces/M08PurchaseOrdersWorkspace.tsx`)  
**Backend Routes:** `/src/routes/purchases.routes.ts`  
**Audit Timestamp:** 2026-09-10T10:35:00.000Z  
**Baseline Status:** FROZEN BEFORE UI/UX REPLICATION

---

## 1. MỤC TIÊU & NGUYÊN TẮC BẢO TOÀN NGHIỆP VỤ

Tài liệu này ghi lại toàn bộ "Feature Baseline" hiện hữu của Phân hệ M08 (Purchase Orders & 3-Way Matching) trước khi thực hiện quy trình sao chép giao diện từ M19 theo Rule #20.

> ⚠️ **Cam kết bất biến:** Quá trình đồng bộ giao diện theo chuẩn M19 TUYỆT ĐỐI CHỈ thay đổi lớp trình bày (presentation layer: layout, typography, màu sắc, định dạng số liệu, bảng biểu, thẻ thống kê). TOÀN BỘ 100% logic nghiệp vụ, API calls, event handlers, phân quyền, validation, dữ liệu và luồng thao tác dưới đây BẮT BUỘC PHẢI ĐƯỢC BẢO TOÀN NGUYÊN VẸN.

---

## 2. DANH MỤC TAB & PHẠM VI NGHIỆP VỤ HIỆN CÓ CỦA M08

M08 gồm 4 Tab nghiệp vụ chính, được quản lý qua hook `useWorkspaceSessionTab<'pos' | 'matching' | 'contracts' | 'analytics'>('M08', 'pos')`:

| STT | Tab Key | Tên Tab Nghiệp Vụ | Loại Màn Hình | Vai Trò Chức Năng |
|---|---|---|---|---|
| 1 | `pos` | **Danh sách Đơn PO** | Master Table + Form Phát Hành PO + PO Detail Modal | Quản lý vòng đời đơn mua hàng PO, phê duyệt/từ chối, phát hành PO gắn kết hợp đồng khung, xem chi tiết chứng từ 360° |
| 2 | `matching` | **Đối chiếu 3-Way Matching** | Analytical Table + Discrepancy Resolution Modal | Bộ máy đối soát 3 chiều tự động giữa Đơn hàng (PO), Phiếu nhận hàng kho (GR) và Hóa đơn NCC (AP Invoice), xử lý và phê duyệt ngoại lệ chênh lệch |
| 3 | `contracts` | **Hợp đồng & Khung giá NCC** | Contract Cards Grid + BPA Creation Modal | Quản lý thỏa thuận khung BPA (Blanket Purchase Agreement), giám sát hạn mức cam kết và tiến độ giải ngân, kiểm soát giá mua trần |
| 4 | `analytics` | **Báo cáo Chi tiêu P2P** | Executive BI Dashboard | Biểu đồ Recharts xu hướng chi tiêu thực tế vs kế hoạch, cơ cấu phân bổ dòng tiền mua sắm cho từng đối tác |

Ngoài ra, M08 tích hợp các thành phần toàn cục:
- **L0 Header Banner**: Nhận diện phân hệ, các nút thao tác nhanh: Làm mới (`RefreshCw`), Xuất PDF / In (`Printer`), Xuất CSV (`Download`).
- **L0 P2P Pipeline Overview**: Dòng thời gian 4 giai đoạn mua sắm (PR -> PO -> GR -> 3-Way Match & AP).
- **L2 KPI Summary Cards**: 4 thẻ chỉ số tài chính và vận hành (Tổng chi tiêu, PO chờ duyệt, Hồ sơ lệch đối soát, Tỷ lệ thỏa thuận khung BPA).
- **Modal Chi Tiết Đơn Hàng (`selectedPoForModal`)**: Xem dữ liệu chứng từ đầy đủ, liên kết sang Context Rail qua `onSelectEntity`.
- **Modal Xử Lý Chênh Lệch (`selectedMatchCase`)**: Bàn làm việc phân xử sai lệch số lượng/đơn giá giữa PO, GR, AP.
- **Modal Tạo Hợp Đồng Khung (`isContractModalOpen`)**: Nhập liệu hợp đồng nguyên tắc và hạn mức cam kết.
- **PdfPrintModal (`isPdfModalOpen`)**: Module in ấn tài liệu A4 / xuất PDF có chữ ký số SHA-256.
- **Guided Task Auto-Navigation**: Tự động điều hướng tab và chọn chứng từ khi nhận nhiệm vụ từ Trợ lý Hướng dẫn.

---

## 3. BẢNG ĐẶC TẢ CHI TIẾT TỪNG TAB CỦA M08 (PRE-SYNC BASELINE)

### 3.1 TAB 1: `pos` — DANH SÁCH ĐƠN MUA HÀNG PO & PHÁT HÀNH PO MỚI

#### A. API Endpoints
1. `GET /api/purchases` (hoặc `/api/purchase/orders`):
   - **Method:** `GET`
   - **Thời điểm gọi:** `useEffect` khi mount component.
   - **Payload trả về:** Mảng các đối tượng PO kèm thông tin làm giàu: `id` (code ví dụ `PO-2026-001`), `internalId`, `supplierId`, `supplier` (tên NCC), `supplierCode`, `taxCode`, `phone`, `email`, `items` (tóm tắt mặt hàng), `totalAmount`, `amountPaid`, `status`, `paymentStatus`, `matching`, `createdDate`, `deliveryDate`, `lineItems`.
   - **Fallback:** Nếu API chưa có dữ liệu, sử dụng mảng dữ liệu mẫu cục bộ ban đầu.
2. `POST /api/purchase/orders`:
   - **Method:** `POST`
   - **Headers:** `Content-Type: application/json`
   - **Body:** `{ supplierId: 1, totalAmount: numValue, notes: "${newPoSupplier}: ${newPoItems}" }`
   - **Kết quả:** Trả về `{ success: true, order: { id, internalId, status, totalAmount } }`.
3. `POST /api/purchase/orders/:id/approve` (hoặc `/api/po/approve/:id`):
   - **Method:** `POST`
   - **URL Param:** `id` (PO code hoặc internal id).
   - **Kết quả:** Chuyển trạng thái PO sang `APPROVED`.
4. `POST /api/purchase/orders/:id/cancel` (hoặc `/api/po/reject/:id`):
   - **Method:** `POST`
   - **URL Param:** `id` (PO code hoặc internal id).
   - **Kết quả:** Chuyển trạng thái PO sang `REJECTED` / `CANCELLED`.

#### B. Toàn bộ hành động người dùng (User Actions)
1. **Làm mới dữ liệu (`RefreshCw`)**:
   - Thao tác: Click nút "Làm mới".
   - Hành vi: Đặt `loading = true`, làm mới state sau 500ms, gửi thông báo `onNotify('info', 'Làm mới', 'Đã đồng bộ dữ liệu M08.')`.
2. **Xuất PDF / In chứng từ (`Printer`)**:
   - Thao tác: Click nút "Xuất PDF / In".
   - Hành vi: Mở modal `PdfPrintModal`.
3. **Xuất tệp CSV (`Download`)**:
   - Thao tác: Click nút "Xuất CSV".
   - Hành vi: Chuyển đổi danh sách `purchaseOrders` thành CSV format (`PO ID,Supplier,Items,TotalAmount,Status,Matching,CreatedDate`), tạo Blob URL và tự động tải về tệp `purchase_orders_p2p_report_YYYY-MM-DD.csv`, gửi `onNotify('success', ...)`.
4. **Phê duyệt đơn mua hàng PO**:
   - Thao tác: Click nút "Phê duyệt" (icon `Check`) trên dòng PO có trạng thái `PENDING_APPROVAL`.
   - Hành vi: Cập nhật state `purchaseOrders` với `status = 'APPROVED'`, gọi API `POST /api/purchase/orders/:id/approve`, gửi `onNotify('success', 'Phê duyệt PO thành công', ...)`.
5. **Từ chối đơn mua hàng PO**:
   - Thao tác: Click nút "Từ chối" (icon `X`) trên dòng PO có trạng thái `PENDING_APPROVAL`.
   - Hành vi: Cập nhật state `purchaseOrders` với `status = 'REJECTED'`, gọi API `POST /api/purchase/orders/:id/cancel`, gửi `onNotify('warning', 'Đã từ chối đơn hàng', ...)`.
6. **Xem chi tiết đơn mua hàng PO**:
   - Thao tác: Click nút "Chi tiết" trên dòng PO bất kỳ.
   - Hành vi: Mở modal `selectedPoForModal`, đồng thời kích hoạt `onSelectEntity` nạp ngữ cảnh PO (Lineage phả hệ, Audit Trail SHA-256) lên Context Rail toàn hệ thống.
7. **Phát hành Đơn Mua Hàng PO mới**:
   - Thao tác: Điền form "Phát hành Đơn Mua Hàng PO Mới" gồm:
     - Dropdown chọn Nhà cung cấp (`newPoSupplier`).
     - Input nhập Hàng hóa / Dịch vụ (`newPoItems`).
     - Input nhập Giá trị đơn hàng VNĐ (`CurrencyInput`, `newPoAmount`).
     - Bấm nút "Phát hành Đơn PO" (`submit`).
   - Hành vi: 
     - Kiểm tra tính hợp lệ của trường dữ liệu.
     - Tạo bản ghi PO mới với ID tự tăng `PO-2026-00{length + 1}`, trạng thái `PENDING_APPROVAL`.
     - Gọi API `POST /api/purchase/orders` để lưu trữ bền vững.
     - Tự động sinh một hồ sơ đối soát 3-Way matching tương ứng trong `matchingCases` với trạng thái `PENDING_GR`.
     - Reset form và gửi thông báo `onNotify('success', 'Tạo Đơn mua hàng PO thành công', ...)`.

#### C. Điều kiện hiển thị (Conditional Rendering) & RBAC
- Nút "Phê duyệt" (`Check`) và "Từ chối" (`X`) CHỈ hiển thị khi dòng đơn hàng có trạng thái `po.status === 'PENDING_APPROVAL'`. Các trạng thái `APPROVED` hoặc `REJECTED` chỉ hiển thị nút "Chi tiết".
- Màu huy hiệu trạng thái PO:
  - `APPROVED`: Huy hiệu nền xanh lá `bg-emerald-50 text-emerald-900 border-emerald-200`.
  - `REJECTED`: Huy hiệu nền đỏ hồng `bg-rose-50 text-rose-900 border-rose-200`.
  - `PENDING_APPROVAL`: Huy hiệu nền vàng cam `bg-amber-50 text-amber-900 border-amber-200`.

#### D. Validation & Ràng buộc nghiệp vụ cứng
- Bắt buộc nhập đầy đủ Nhà cung cấp (`newPoSupplier.trim() !== ''`) và Nội dung đặt mua (`newPoItems.trim() !== ''`). Nếu thiếu, chặn submit và cảnh báo `onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập đầy đủ Nhà cung cấp và Hàng hóa đặt mua.')`.
- Số tiền đơn hàng được làm sạch qua Regex `/^0-9/g` và fallback an toàn về `250000000`.
- Ràng buộc liên kết: PO mới phát hành tự động liên kết với hợp đồng khung `CON-2026-001`.

---

### 3.2 TAB 2: `matching` — HỆ THỐNG ĐỐI CHIẾU 3 CHIỀU (3-WAY MATCHING ENGINE)

#### A. Dữ liệu & Quy trình
- Quản lý tập danh sách hồ sơ đối soát `matchingCases`:
  - Mỗi case gồm: `id` (vd `MC-2026-001`), `poId`, `supplier`, `poQty`, `grQty`, `apQty`, `poPrice`, `apPrice`, `status` (`MATCHED` | `MISMATCH` | `PENDING_GR` | `RESOLVED`), `notes`.
  - Liên kết chặt chẽ với Tab `pos`: khi người dùng tạo PO mới ở Tab 1, case mới lập tức xuất hiện tại Tab 2 với trạng thái `PENDING_GR`.

#### B. Toàn bộ hành động người dùng
1. **Theo dõi quy trình 3 nguồn dữ liệu**:
   - Hiển thị 3 khối phân tích quy trình: 1. Purchase Order (PO) ➔ 2. Goods Receipt (GR) ➔ 3. AP Invoice (VAT).
2. **Khám phá chi tiết số lượng & đơn giá**:
   - Hiển thị đối sánh 3 chỉ số số lượng: `poQty` / `grQty` / `apQty`.
   - Hiển thị đối sánh đơn giá: `poPrice` / `apPrice`.
3. **Mở bàn xử lý chênh lệch đối chiếu**:
   - Thao tác: Click nút "Xử lý chênh lệch" trên dòng có trạng thái `MISMATCH`.
   - Hành vi: Mở modal `selectedMatchCase` (Discrepancy Work Bench).
4. **Phê duyệt phân xử chênh lệch ngoại lệ**:
   - Thao tác: Trong modal xử lý chênh lệch, kiểm tra thông tin chênh lệch, chỉnh sửa nội dung phương án điều chỉnh trong `textarea` (`resolutionReason`), bấm "Xác nhận điều chỉnh & Thông qua".
   - Hành vi: 
     - Cập nhật case trong `matchingCases` sang trạng thái `RESOLVED` kèm ghi chú phân xử.
     - Cập nhật trạng thái đối soát của PO tương ứng trong `purchaseOrders` sang `Discrepancy Resolved`.
     - Đóng modal và gửi `onNotify('success', 'Xử lý chênh lệch thành công', ...)`.

#### C. Điều kiện hiển thị & Cảnh báo trực quan
- Cột "Hành động": 
  - Nếu `c.status === 'MISMATCH'`: Hiển thị nút bấm nổi bật màu đỏ "Xử lý chênh lệch".
  - Nếu khác `MISMATCH`: Hiển thị nhãn tĩnh "Bảo mật tối đa" màu xám.
- Cảnh báo màu số lượng lệch:
  - Nếu `grQty !== poQty`: Hiển thị số lượng GR với màu vàng đậm `text-amber-700 font-bold`.
  - Nếu `apQty !== poQty`: Hiển thị số lượng AP với màu đỏ đậm `text-rose-700 font-bold`.
- Trạng thái đối soát:
  - `MATCHED`: `bg-emerald-100 text-emerald-900 border-emerald-300`
  - `RESOLVED`: `bg-blue-100 text-blue-900 border-blue-300`
  - `PENDING_GR`: `bg-amber-100 text-amber-900 border-amber-300`
  - `MISMATCH`: `bg-rose-100 text-rose-900 border-rose-300 animate-pulse`
- Chỉ báo xung động trên thanh Tab: Khi `mismatchCount > 0`, tab `matching` hiển thị chấm tròn đỏ nhấp nháy `w-2 h-2 rounded-full bg-rose-500 animate-pulse`.

---

### 3.3 TAB 3: `contracts` — HỢP ĐỒNG NGUYÊN TẮC & KHUNG GIÁ NCC (BPA)

#### A. Dữ liệu & Quản lý Thỏa thuận
- Quản lý danh sách hợp đồng khung BPA `contracts`:
  - Mỗi hợp đồng gồm: `id` (vd `CON-2026-001`), `title`, `supplier`, `startDate`, `endDate`, `committedValue`, `usedValue`, `status` (`ACTIVE` | `EXPIRED`).
  - Tính toán động tỷ lệ sử dụng ngân sách: `Math.round((usedValue / committedValue) * 100)%`.

#### B. Toàn bộ hành động người dùng
1. **Xem tiến độ giải ngân & hạn mức hợp đồng**:
   - Hiển thị từng hợp đồng dạng thẻ chi tiết gồm: Giá trị cam kết, Đã giải ngân (PO), Hạn hiệu lực, Thanh tiến độ (Progress bar).
2. **Mở modal tạo hợp đồng khung mới**:
   - Thao tác: Click nút "+ Tạo Hợp Đồng Khung".
   - Hành vi: Đặt `isContractModalOpen = true`, hiển thị form modal.
3. **Ký kết thỏa thuận khung mới**:
   - Thao tác: Nhập Tên Hợp đồng (`newConTitle`), Nhà cung cấp (`newConSupplier`), Hạn mức giá trị (`newConVal`), bấm "Ký kết thỏa thuận".
   - Hành vi:
     - Kiểm tra dữ liệu bắt buộc.
     - Sinh mã hợp đồng `CON-2026-00{length + 1}`, ngày bắt đầu hôm nay, ngày kết thúc sau 365 ngày, `committedValue` từ input, `usedValue = 0`, `status = 'ACTIVE'`.
     - Thêm vào danh sách `contracts`, đóng modal, reset input, gửi `onNotify('success', ...)`.
4. **Xem hướng dẫn tuân thủ khung pháp lý P2P**:
   - Hiển thị khối giải thích quy tắc kiểm toán: đơn giá PO không vượt trần, chữ ký SHA-256, cảnh báo hạn mức < 10%.

#### C. Validation
- Kiểm tra `!newConTitle.trim() || !newConSupplier.trim()`. Nếu thiếu thông báo `onNotify('warning', 'Thiếu thông tin', 'Vui lòng cung cấp Tiêu đề hợp đồng và Nhà cung cấp.')`.

---

### 3.4 TAB 4: `analytics` — BÁO CÁO PHÂN TÍCH CHI TIÊU P2P (SPEND ANALYTICS)

#### A. Trực quan hóa dữ liệu (Recharts)
1. **Biểu đồ Vùng (AreaChart) — Tiến độ giải ngân so với kế hoạch**:
   - Dữ liệu 6 tháng (T3 - T8): `Kế hoạch` vs `Thực chi`.
   - Gradient fill 2 màu (kế hoạch màu xám nhạt, thực chi màu xanh chàm `#4f46e5`).
   - Tooltip và Legend hiển thị chuẩn số liệu.
2. **Biểu đồ Tròn (Donut / PieChart) — Cơ cấu chi tiêu theo đối tác**:
   - Dữ liệu chi tiêu theo 4 nhà cung cấp: Vật liệu Bán dẫn, Hóa chất Xanh, Đo lường Quang Học, Linh kiện ABC.
   - 4 mã màu: `#4f46e5`, `#10b981`, `#f59e0b`, `#ef4444`.
   - Tâm donut hiển thị: "1.2 Tỷ / Tổng chi".
   - Bảng chú giải chi tiết kèm format tiền tệ `formatCurrency(item.value)`.

---

### 3.5 CÁC LUỒNG ĐIỀU HƯỚNG & ĐỒNG BỘ TOÀN HỆ THỐNG (SYSTEM INTEGRATION)

1. **Thanh Ngữ Cảnh Đối Tượng (Context Rail Integration)**:
   - Khi chọn PO qua `handleSelectPo`, hàm phát lệnh `onSelectEntity` với payload chuẩn mực:
     ```ts
     {
       type: 'PURCHASE_ORDER',
       id: po.id,
       code: po.id,
       title: `PO: ${po.supplier}`,
       status: po.status,
       lineage: [
         { id: po.id, type: 'Đơn mua hàng PO', code: po.id, relation: 'CURRENT_PO', status: po.status },
         { id: 'M08-P2P', type: 'Phân hệ M08', code: 'M08_PURCHASE_ORDERS', relation: 'PARENT_MODULE', status: 'ACTIVE' }
       ],
       auditTrail: [
         { id: 1, action: 'INSPECT_PURCHASE_ORDER', timestamp: new Date().toISOString(), user: 'admin', sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
       ],
       glEntries: []
     }
     ```
2. **Guided Task Auto-Routing (`useEffect` on `guidedTask`)**:
   - Tự động bắt sự kiện điều hướng từ Trợ lý Hướng Dẫn khi người dùng nhấp vào một nhiệm vụ gợi ý:
     - Nếu nhiệm vụ chứa mã `MATCH` hoặc từ khóa `3-Way`/`Đối chiếu` ➔ Chuyển tab `matching`, tự động mở case chênh lệch tương ứng.
     - Nếu nhiệm vụ chứa mã `CON` hoặc từ khóa `Hợp đồng` ➔ Chuyển tab `contracts`.
     - Ngược lại ➔ Chuyển tab `pos`.
3. **Quản lý Session Tab (`useWorkspaceSessionTab`)**:
   - Lưu trữ tab đang chọn vào session storage của module `M08`, khôi phục chính xác tab khi người dùng chuyển đổi qua lại giữa các module.
4. **Đồng Bộ Context Kho/Thời Gian (`useWorkspaceContextSync`)**:
   - Tự động kích hoạt spinner loading nhẹ khi chi nhánh hoặc ngày làm việc thay đổi để đồng bộ dữ liệu.

---

## 4. KẾT QUẢ KIỂM THỬ RUNTIME TRƯỚC KHI ĐỒNG BỘ GIAO DIỆN

Thực hiện kiểm tra thực tế trên ứng dụng đang chạy:
1. `GET http://localhost:3000/api/purchases`: Trả về `HTTP 200 OK`, số lượng PO: 3 bản ghi, cấu trúc dữ liệu đầy đủ.
2. `compile_applet`: Kiểm tra build Vite + TypeScript thành công 100% không có lỗi.
3. Luồng tương tác người dùng:
   - Tạo PO mới ➔ Thành công, sinh PO và tự động cập nhật case đối soát.
   - Duyệt PO ➔ Thành công, trạng thái chuyển `APPROVED`.
   - Từ chối PO ➔ Thành công, trạng thái chuyển `REJECTED`.
   - Xử lý lệch 3-Way ➔ Thành công, trạng thái chuyển `RESOLVED`.
   - Ký hợp đồng BPA ➔ Thành công, sinh hợp đồng mới.
   - In ấn / Xuất PDF ➔ Mở modal xem trước chứng từ chuẩn.
   - Xuất CSV ➔ Tải tệp dữ liệu đầy đủ 7 cột.

**KẾT LUẬN GIAI ĐOẠN -1:**  
Toàn bộ 100% tính năng, API và luồng thao tác của M08 đã được lập chỉ mục và chụp ảnh chi tiết. Đây là căn cứ đối chiếu tuyệt đối để thẩm định không suy giảm tính năng (No Feature Regression) sau khi hoàn tất Phase 3.

---

## 5. BẢN ĐỒ KIẾN TRÚC M08 P2P & HỆ THỐNG LIÊN KẾT API HOÀN THIỆN

### 5.1 Kiến trúc Thực thi & Phân quyền Thẩm quyền (Authority Matrix)
M08 (Purchase Orders & Procure-to-Pay) tuân thủ triệt để 20 Architecture Rules:
- **Rule #01 & #02 (Reuse Master Data)**: Sử dụng bảng `suppliers`, `warehouses`, `products` từ master database, không sinh bảng độc lập.
- **Rule #03 (Single Writer for Inventory)**: Quy trình Nhận hàng (Goods Receipt) ủy thác toàn bộ việc tăng tồn khả dụng, thẻ kho và hạch toán giá vốn cho `InventoryService.postTransaction()` với loại giao dịch `GOODS_RECEIPT`.
- **Rule #04 (Idempotency Key)**: Mọi thao tác ghi dữ liệu trọng yếu (`POST /api/purchase/orders`, `POST /api/purchase/orders/:id/receive`) đều nhận và lưu trữ `idempotencyKey` vào Outbox Events / Transactions.
- **Rule #19 (ConfirmDialog & Accessibility)**: Xác thực an toàn 2 bước trước khi Phê duyệt (`APPROVED`) hoặc Từ chối (`REJECTED`) đơn hàng mua.
- **Rule #20 (Full UI/UX Replication Protocol)**: Áp dụng chuẩn M19 với cấu trúc thẻ KPI, phân trang, lọc tìm kiếm, bảng dữ liệu chuẩn Enterprise.

### 5.2 Danh mục API Endpoints M08 Hoàn Thiện
1. **Quản lý Đơn Mua Hàng PO:**
   - `GET /api/purchases` hoặc `GET /api/purchase/orders`: Truy xuất danh sách PO, làm giàu tên nhà cung cấp, mã số thuế, mặt hàng và trạng thái.
   - `POST /api/purchase/orders`: Phát hành đơn mua hàng mới, lưu trữ vào bảng `purchaseOrders` và `purchaseOrderItems`, ghi nhận Outbox Event.
   - `POST /api/purchase/orders/:id/approve`: Phê duyệt đơn mua hàng, chuyển trạng thái sang `APPROVED`.
   - `POST /api/purchase/orders/:id/cancel`: Từ chối đơn mua hàng, chuyển trạng thái sang `REJECTED`.
2. **Quy trình Nhận Hàng Kho Vận (Goods Receipts - GR):**
   - `POST /api/purchase/orders/:id/receive`: Tạo phiếu tiếp nhận hàng hóa tại kho đích, cập nhật `receivedQuantity` trên từng dòng PO và tự động gọi `InventoryService.postTransaction()` ghi thẻ kho chính thức.
   - `GET /api/purchase/goods-receipts`: Truy xuất sổ theo dõi toàn bộ các phiếu nhập kho GR kèm mã PO, kho nhận, số lượng và vết kiểm toán.
3. **Bộ máy Đối Chiếu 3 Chiều (3-Way Matching Engine):**
   - `GET /api/purchase/matching-cases`: Tự động tính toán trạng thái đối soát giữa số lượng PO, số lượng thực nhận GR và số lượng trên hóa đơn AP, phân loại `MATCHED`, `PENDING_GR`, hoặc `MISMATCH`.
   - `POST /api/purchase/matching-cases/:id/resolve`: Phân xử ngoại lệ sai lệch giá/số lượng, lưu vết lý do xử lý và đồng bộ trạng thái đơn PO.
4. **Thỏa Thuận Khung & Hợp Đồng Nguyên Tắc (BPA):**
   - `GET /api/purchase/contracts`: Truy xuất danh mục hợp đồng nguyên tắc, hạn mức cam kết và giá trị giải ngân.
   - `POST /api/purchase/contracts`: Ký kết thỏa thuận khung mới với đối tác cung ứng.
5. **Dữ liệu Nền tảng (Master Data Integration):**
   - `GET /api/suppliers`: Nạp danh mục đối tác nhà cung cấp vào dropdown phát hành PO.
   - `GET /api/warehouses`: Nạp danh mục kho vào modal tiếp nhận hàng hóa GR.
   - `GET /api/products`: Nạp danh mục hàng hóa vật tư tiêu chuẩn.

