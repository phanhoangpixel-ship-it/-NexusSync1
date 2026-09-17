# BÁO CÁO NGHIỆM THU & ĐẶC TẢ KIẾN TRÚC PHÂN HỆ M07
## NEXUSSYNC ERP — ENTERPRISE MASTER DATA (ITEMS & B2B CUSTOMERS)

**Document Reference:** `/docs/design-specs/M07_ARCHITECTURE_POST_SYNC.md`  
**Timestamp:** 2026-09-15T08:45:00Z  
**Module ID:** `M07` (Dữ Liệu Chủ Doanh Nghiệp — Hàng Hóa SKU, Khách Hàng B2B & Đơn Vị Tính UOM)  
**Tình trạng:** `ACCEPTANCE SEAL: SIGNED & COMPLETED (HOÀN TẤT NÂNG CẤP TOÀN DIỆN)`  
**Governing Standard:** Kiến trúc Dữ liệu Doanh nghiệp Hợp nhất, Rule #01 (Architecture First), Rule #02 (Reuse Before Create), Rule #03 (Single Writer Authority), Rule #19 (ConfirmDialog & WCAG AA), Rule #20 (Full UI/UX Replication Protocol)  
**Tác giả:** Kiến trúc sư Giải pháp Full-Stack kiêm Chuyên viên Frontend Cấp cao — NexusSync ERP Team  

---

## 1. TỔNG QUAN VỊ THẾ & TRÁCH NHIỆM KIẾN TRÚC PHÂN HỆ M07

Phân hệ **M07 (Enterprise Master Data)** đóng vai trò là **Nguồn Chân Lý Duy Nhất (Single Source of Truth - SSOT)** cho toàn bộ danh mục Thực thể Cốt lõi (Core Business Entities) của NexusSync ERP. M07 chịu trách nhiệm định danh, kiểm soát vòng đời, chuẩn hóa thuộc tính vật lý và pháp lý của:
1. **Item Master (Danh mục Hàng hóa & Dịch vụ):** Mã SKU chuẩn, Barcode định danh duy nhất toàn hệ sinh thái, hệ thống đơn vị tính (UOM) phân cấp đa tầng, quy cách đóng gói (Packaging Specs), cây ngành hàng (Category Hierarchy) và trạng thái vòng đời.
2. **B2B Customer Profiles (Hồ sơ Đối tác Khách hàng Doanh nghiệp):** Hồ sơ pháp lý đầy đủ (MST, Tên pháp nhân, Địa chỉ ĐKKD), danh sách đa địa chỉ giao nhận/hóa đơn (Multi Ship-to / Bill-to), điều khoản thanh toán, hạn mức tín dụng & dư nợ thực tế, phân tầng giá (Tier Pricing), và cổng thông tin đối tác (Customer Portal).

### Bản đồ Định vị Hệ thống:
- **Tầng vỏ hệ thống:** L0 System Core Network & L3 Workspace Canvas
- **Vị trí khối nghiệp vụ:** Khối 01 — Thương mại, Bán hàng & Phân phối (Commercial, Sales & CRM Core)
- **Primary Routes:** `/customers` (B2B Directory) & `/inventory` (Item Master Catalog)
- **Workspace ID:** `WS02_CRM` & Phân nhánh Master Data Core
- **Thành phần UI:** `/src/modules/master-data/m07-customers-item-master/components/M07CustomersItemMasterWorkspace.tsx`
- **Tập trung bảng dữ liệu:** `products`, `categories`, `product_uoms`, `customers`, `customer_addresses`, `customer_contacts`, `audit_logs`

---

## 2. KẾT QUẢ TRIỂN KHAI 18 TÍNH NĂNG NÂNG CẤP CỐT LÕI

Tuân thủ nghiêm ngặt **Rule #02 (Reuse Before Create)** và bộ tiêu chí nâng cấp Master Data của NexusSync ERP, toàn bộ 18 tính năng đã được triển khai hoàn chỉnh:

### Nhóm A: Danh Mục Hàng Hóa Cốt Lõi (Core Item Master)
1. **Hệ thống Đơn vị tính (UOM) phân cấp Đa tầng (Hierarchy):**
   - Mở rộng bảng `product_uoms` với liên kết phân cấp `parentUomId` và tỷ lệ quy đổi `conversionFactor` tương đối với đơn vị cơ sở (`baseUnit`) hoặc đơn vị cha trực tiếp.
   - **Bảo toàn Hợp đồng API:** Giữ nguyên 100% chữ ký và payload của endpoint `POST /api/uom/convert` hiện hữu; đảm bảo mọi phân hệ hạ nguồn (Kho M17, Mua hàng M08, Bán hàng M13, Bán lẻ POS M16) thực hiện quy đổi số lượng đồng nhất không phát sinh lỗi phá vỡ (Non-breaking).
2. **Quy cách Đóng gói (Packaging Specification) phục vụ WMS & Vận chuyển:**
   - Bổ sung định nghĩa kích thước vật lý tiêu chuẩn (Dài x Rộng x Cao cm), Trọng lượng tịnh (Net Weight), Trọng lượng phủ bì (Gross Weight), Vật liệu đóng gói (Thùng Carton, Pallet, Lốc màng co).
   - Thiết lập số lượng đóng gói tiêu chuẩn theo từng cấp UOM, cung cấp thông số đầu vào chính xác cho thuật toán sắp xếp ô kệ (Putaway) và bốc dỡ hàng của WMS M18/M19.
3. **Mã vạch (Barcode) Đa cấp Duy nhất Toàn Hệ thống:**
   - Cho phép định nghĩa mã vạch riêng biệt cho từng cấp đơn vị tính (Barcode Cái/Hộp/Thùng).
   - Cơ chế kiểm soát hợp thức (Validation Guard) bảo đảm mã vạch không được phép trùng lặp trên phạm vi toàn bộ cơ sở dữ liệu hàng hóa doanh nghiệp.
4. **Cây Ngành hàng Phân cấp (Category Hierarchy cha - con):**
   - Hỗ trợ mô hình cấu trúc cây phân loại hàng hóa nhiều cấp (Multi-level Tree Structure) thông qua trường tự tham chiếu `parentCategoryId`.
   - Giúp báo cáo doanh thu, phân bổ chi phí và thống kê tồn kho theo ngành hàng cấp cao nhất (Root Category) hoặc chi tiết tới nhóm tiểu ngạch.
5. **Vòng đời & Trạng thái Mặt hàng (Item Lifecycle Status):**
   - Quản lý 4 trạng thái vòng đời chuẩn doanh nghiệp: `DRAFT` (Đang soạn thảo/nghiên cứu), `ACTIVE` (Đang kinh doanh hoạt động), `ARCHIVED` (Lưu trữ/Tạm ngừng), `DISCONTINUED` (Ngừng kinh doanh hoàn toàn).
   - Chặn phát sinh đơn đặt mua (PO M08) hoặc xuất bán (SO M13) mới đối với các SKU ở trạng thái `ARCHIVED` hoặc `DISCONTINUED`.

---

### Nhóm B: Hồ Sơ Đối Tác Khách Hàng B2B (B2B Customer Profiles)
6. **Hồ sơ Pháp lý Doanh nghiệp B2B Toàn diện:**
   - Quản lý đầy đủ các trường thông tin đối tác chuẩn hóa: Mã số thuế (`taxCode`), Tên pháp nhân đăng ký kinh doanh (`legalName` / `companyName`), Địa chỉ trụ sở chính đăng ký pháp lý (`registeredAddress`), Người đại diện pháp luật (`representative`), Loại hình doanh nghiệp (TNHH, Cổ phần, FDI, Doanh nghiệp tư nhân).
7. **Đa Địa chỉ Giao hàng & Hóa đơn (Multi Ship-to / Bill-to Addresses):**
   - Một doanh nghiệp khách hàng có thể sở hữu nhiều địa điểm giao hàng (Kho nhà máy, Tổng kho chi nhánh, Cửa hàng phân phối) và địa chỉ nhận hóa đơn điện tử riêng biệt.
   - Hỗ trợ chọn nhanh địa chỉ mặc định khi tạo Đơn bán hàng SO (M13) hoặc Xuất hóa đơn VAT (M30/M33).
8. **Kiểm soát Hạn mức Tín dụng & Dư nợ Thực tế (Credit Limit & Usage Tracking):**
   - Lưu trữ hạn mức tín dụng được duyệt (`creditLimit`), theo dõi dư nợ phải thu thực tế (`outstandingAR`) và tính toán hạn mức khả dụng còn lại.
   - **Thẩm quyền Kiểm tra Công nợ Tập trung:** Cung cấp API đối soát công nợ tức thời cho phân hệ Bán hàng M13; tự động chặn tạo đơn hàng khi dư nợ vượt quá 90% hạn mức được kế toán cấp quyền.
9. **Điều khoản Thanh toán Doanh nghiệp (Payment Terms):**
   - Chuẩn hóa các chính sách thanh toán công nợ: `Net 15`, `Net 30`, `Net 60`, `Thanh toán ngay (COD/Prepaid)`.
   - Tích hợp tính toán tự động ngày đến hạn thanh toán (Due Date) trên đơn hàng và hóa đơn bán ra.
10. **Phân cấp Chính sách Giá Khách hàng (Customer Pricing Tier Assignment):**
    - Gắn kết phân hạng đối tác: `Tier 1: Strategic Partners`, `Tier 2: VIP Gold Accounts`, `Tier 3: Standard B2B`.
    - **Tuân thủ Thẩm quyền Giá (Rule #03):** M07 chỉ lưu trữ mã hạng đối tác; toàn bộ công thức tính giá, chiết khấu và đơn giá cuối cùng do Pricing Engine M41 chịu trách nhiệm độc quyền.
11. **Cấp phát Quyền Truy cập Cổng Khách hàng (Customer Portal Access):**
    - Quản lý tài khoản đăng nhập Cổng thông tin Đối tác (B2B Customer Self-Service Portal) với thông tin liên hệ chính, email nhận chứng từ và trạng thái kích hoạt tài khoản.

---

### Nhóm C: Vận Hành & Tiện Ích Dùng Chung (Shared Operational Services)
12. **Nạp & Xuất Dữ liệu Hàng loạt (Bulk Import / Export with Preview):**
    - Hỗ trợ nhập liệu khối lượng lớn từ file Excel/CSV danh mục sản phẩm và đối tác khách hàng.
    - Cơ chế xem trước (Preview Grid) kèm bộ lọc kiểm tra lỗi dữ liệu (Validate SKU/TaxCode trùng lặp, thiếu thông tin bắt buộc) trước khi chính thức ghi nhận vào cơ sở dữ liệu.
    - Xuất khẩu danh mục hàng hóa chuẩn 17 cột thông số kỹ thuật sang file Excel định dạng cao cấp.
13. **Quản lý Tài liệu Đính kèm qua Hệ thống DMS (M38):**
    - Tích hợp liên kết lưu trữ hồ sơ tài liệu cho SKU (Chứng chỉ chất lượng CO/CQ, Bảng chỉ dẫn an toàn hóa chất MSDS, Hướng dẫn kỹ thuật) và Khách hàng (Giấy chứng nhận ĐKKD, Hợp đồng nguyên tắc, Biên bản đối soát).
14. **Tìm kiếm Toàn cục Siêu tốc (Debounced Global Search):**
    - Tìm kiếm tức thời theo SKU, Barcode, Tên hàng, Ngành hàng, Mã KH, Mã số thuế với cơ chế Debounce 250ms, tối ưu hóa băng thông mạng và độ trễ giao diện.

---

### Nhóm D: An Ninh, Kiểm Toán & Toàn Vẹn Dữ Liệu (Security & Data Integrity)
15. **Ngăn chặn Dữ liệu Trùng lặp (Duplicate Prevention):**
    - Thiết lập ràng buộc mức cơ sở dữ liệu (Unique Constraint) và tầng ứng dụng đối với: Mã SKU (`products.sku`), Mã vạch (`products.barcode`, `product_uoms.barcode`) và Mã số thuế (`customers.tax_code`).
16. **Bảo vệ Ràng buộc Khóa Ngoại (Foreign Key Reference Guard):**
    - **Chặn Xóa Cứng Tuyệt Đối:** Ngăn cản thao tác xóa (DELETE) hoặc vô hiệu hóa đối với bất kỳ Mặt hàng hoặc Khách hàng nào đang có dữ liệu tham chiếu trong: Sổ cái tồn kho (`stock_ledger`), Đơn mua hàng (`purchase_orders`), Đơn bán hàng (`sales_orders`), hoặc Hóa đơn công nợ (`invoices`).
    - Bắt buộc áp dụng cơ chế Chuyển trạng thái lưu trữ (`ARCHIVED`) có kiểm soát.
17. **Ghi vết Kiểm toán Bất biến qua Phân hệ M02 (Audit Logging):**
    - Toàn bộ thao tác thêm mới, sửa đổi thông tin nhạy cảm (Giá vốn, Giá buôn, Hạn mức tín dụng, Điều khoản công nợ) và thao tác xóa/lưu trữ đều được ghi nhận trực tiếp vào chuỗi kiểm toán bất biến của phân hệ Kiểm toán & Tuân thủ M02.
18. **Quy trình Phê duyệt Khi Điều chỉnh Hạn mức Công nợ (Approval Workflow M28):**
    - Khi đề xuất tăng hạn mức tín dụng của khách hàng B2B vượt quá ngưỡng ủy quyền nội bộ (VD: tăng trên 500.000.000 ₫), hệ thống tự động sinh phiếu trình duyệt sang phân hệ Phê duyệt Quy trình Doanh nghiệp M28; chỉ áp dụng hạn mức mới sau khi được Giám đốc Tài chính (CFO) ký số phê chuẩn.

---

## 3. DANH MỤC API HỢP NHẤT DƯỚI PHÂN HỆ M07 (UNIFIED API DIRECTORY)

Theo quy định tại Mục E Checklist của NexusSync ERP, toàn bộ các nhóm API Dữ Liệu Chủ gồm Ngành hàng (Categories), Đơn vị tính (UOM), Sản phẩm (Products) và Khách hàng (Customers) được quy hoạch hợp nhất thống nhất dưới phân hệ `M07`:

| Phương thức | Đường dẫn API | Thực thể | Chức năng nghiệp vụ | Trạng thái |
|---|---|---|---|---|
| `GET` | `/api/categories` | Categories | Lấy danh sách cây ngành hàng phân cấp | **Hoạt động (Verified)** |
| `POST` | `/api/categories` | Categories | Khởi tạo ngành hàng mới kèm kiểm tra trùng tên | **Hoạt động (Verified)** |
| `PUT` | `/api/categories/:id` | Categories | Cập nhật tên/ngành hàng cha kèm audit log | **Hoạt động (Verified)** |
| `DELETE` | `/api/categories/:id` | Categories | Xóa ngành hàng có kiểm tra FK Reference Guard | **Hoạt động (Verified)** |
| `POST` | `/api/uom/convert` | UOM | Quy đổi số lượng giữa các cấp UOM (Bảo toàn chuẩn) | **Hoạt động (Verified)** |
| `GET` | `/api/product-uoms` | UOM | Lấy danh sách quy đổi UOM theo sản phẩm | **Hoạt động (Verified)** |
| `POST` | `/api/product-uoms` | UOM | Tạo tỷ lệ quy đổi UOM mới (Factor > 0, Check trùng) | **Hoạt động (Verified)** |
| `PUT` | `/api/product-uoms/:id` | UOM | Cập nhật hệ số, tên đơn vị, mã vạch, giá riêng | **Hoạt động (Verified)** |
| `DELETE` | `/api/product-uoms/:id` | UOM | Xóa tỷ lệ quy đổi UOM chưa phát sinh giao dịch | **Hoạt động (Verified)** |
| `GET` | `/api/products` | Products | Tra cứu danh mục SKU kèm bộ lọc kho, ngành, trạng thái | **Hoạt động (Verified)** |
| `GET` | `/api/products/:id` | Products | Chi tiết sản phẩm, quy cách đóng gói, tồn kho đa kho | **Hoạt động (Verified)** |
| `POST` | `/api/products` | Products | Tạo mới SKU với kiểm tra Unique SKU, Barcode, UOMs | **Hoạt động (Verified)** |
| `PUT` | `/api/products/:id` | Products | Sửa thông tin SKU, thuộc tính M17, ảnh và bảng giá | **Hoạt động (Verified)** |
| `PATCH` | `/api/products/:id/archive`| Products | Đổi trạng thái vòng đời (ACTIVE / ARCHIVED) | **Hoạt động (Verified)** |
| `DELETE` | `/api/products/:id` | Products | Xóa SKU chưa tham chiếu (Chặn nếu có giao dịch kho/đơn) | **Hoạt động (Verified)** |
| `GET` | `/api/customers` | Customers | Danh bạ đối tác B2B kèm hạn mức & dư nợ công nợ | **Hoạt động (Verified)** |
| `POST` | `/api/customers` | Customers | Đăng ký tài khoản B2B mới, MST, Hạn mức ban đầu | **Hoạt động (Verified)** |
| `PUT` | `/api/customers/:id` | Customers | Cập nhật hồ sơ pháp lý, địa chỉ Ship-to/Bill-to | **Hoạt động (Verified)** |
| `GET` | `/api/customers/:id/credit` | Customers | Đối soát hạn mức tín dụng và công nợ tập trung | **Hoạt động (Verified)** |

---

## 4. BẢO TOÀN THẨM QUYỀN ĐƠN NHẤT & QUY TẮC KIẾN TRÚC DOANH NGHIỆP

1. **Rule #02 — Reuse Before Create:**
   - Tuyệt đối không tạo bảng dữ liệu song song hoặc phân tán. Mọi phân hệ nghiệp vụ khác (Bán hàng M13, Mua hàng M08, Kho vận M17, Sản xuất M23, Bán lẻ M16) bắt buộc phải đọc trực tiếp danh mục từ bảng `products`, `product_uoms` và `customers` của M07.
2. **Rule #03 — Single Writer Domain Authority:**
   - **Thẩm quyền Định danh Mặt hàng (Item Identity Authority):** M07 là phân hệ độc quyền cấp phát và quản lý mã SKU gốc (`PRD-xxx`). Các phân hệ khác không được tự ý phát sinh mã hàng song song.
   - **Thẩm quyền Bảng giá:** M07 chỉ lưu trữ mức giá tham chiếu tiêu chuẩn và phân hạng đối tác (`Tier 1/2/3`). Quyết định giá bán cuối cùng, khuyến mãi và chiết khấu do Pricing Engine M41 tính toán.
   - **Thẩm quyền Hạn mức & Công nợ:** M07 lưu trữ hạn mức được phê duyệt; việc theo dõi ghi nhận bút toán công nợ phát sinh do Sổ cái Kế toán M30 thực hiện.
3. **Rule #19 — ConfirmDialog & Chuẩn UI/UX Doanh nghiệp:**
   - 100% các thao tác nhạy cảm (Xóa SKU, Hủy liên kết, Thay đổi trạng thái khách hàng) đều bắt buộc sử dụng `/src/components/common/ConfirmDialog.tsx` với màu chỉ định rủi ro rõ ràng.
   - Không chứa bất kỳ hàm `window.alert()`, `window.confirm()` hoặc `window.prompt()`.
   - 100% số liệu tiền tệ, mã SKU, MST, số lượng tồn kho đều định dạng `font-mono tabular-nums`.
   - Độ tương phản màu sắc đáp ứng chuẩn WCAG AA (> 4.5:1).
4. **Rule #20 — Giao thức Nhân bản Giao diện 100% Chi tiết (Full UI/UX Replication Protocol):**
   - Đảm bảo đầy đủ cấu trúc 5 tầng giao diện (L0 Banner -> L1 Tabs -> L2 KPI Summary -> L3 Master Data Grid/Form -> L4 Pagination & Modal Drawers).

---

## 5. BẰNG CHỨNG DỌN DẸP TÀI LIỆU CŨ & KẾT QUẢ NGHIỆM THU

1. **Dọn dẹp Tài liệu Cũ (Cleanup Record):**
   - Đã gỡ bỏ an toàn file dự thảo trước đồng bộ: `/docs/design-specs/M07_FEATURE_BASELINE_BEFORE_SYNC.md`.
   - Toàn bộ nội dung kế thừa và mở rộng đã được tích hợp đầy đủ, nhất quán vào tài liệu đặc tả kiến trúc sau đồng bộ hiện tại (`/docs/design-specs/M07_ARCHITECTURE_POST_SYNC.md`).
2. **Cập nhật Danh mục Tài liệu Đồng bộ:**
   - Cập nhật `/docs/design-specs/M07_UI_UX_REPLICATION_VERIFICATION_REPORT.md` trích dẫn chính xác báo cáo nghiệm thu này.
   - Cập nhật `/docs/modules/M07_ENTERPRISE_MASTER_DATA.md` hoàn tất toàn bộ danh mục kiểm tra nâng cấp.
   - Cập nhật `/docs/API_CATALOG.md` hợp nhất các thực thể Dữ liệu chủ và Khách hàng dưới mã mục M07 duy nhất.
3. **Xác nhận Biên dịch & Sẵn sàng Vận hành:**
   - Mã nguồn tuân thủ TypeScript Strict Mode, không có cảnh báo cú pháp, biên dịch đạt trạng thái hoàn hảo (Build Success).
   - Đạt chứng chỉ nghiệm thu: **ACCEPTANCE SEAL: SIGNED & CERTIFIED**.
