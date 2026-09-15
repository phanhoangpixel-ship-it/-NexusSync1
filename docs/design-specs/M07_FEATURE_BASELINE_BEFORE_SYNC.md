# M07 ITEM MASTER & B2B COMMERCE WORKSPACE
## FEATURE BASELINE BEFORE SYNC (BƯỚC 1 — BẢO TOÀN TÍNH NĂNG)

**Mã Tài Liệu:** `/docs/design-specs/M07_FEATURE_BASELINE_BEFORE_SYNC.md`  
**Module:** M07 (Customers & Item Master — B2B Commerce SSOT)  
**Thời gian lập:** 11/09/2026  
**Mục tiêu:** Ghi nhận toàn bộ baseline tính năng, API/Storage endpoints, luồng tương tác người dùng, điều kiện RBAC/SoD và validation code cứng của M07 trước khi tiến hành đồng bộ giao diện theo Master Design Spec của M41.

---

## 1. TỔNG QUAN CẤU TRÚC 5 TABS CỦA M07

| STT | Tab ID | Tên Tab Chức Năng | Mục Tiêu Nghiệp Vụ & Quyền Hạn |
|:---:|:---|:---|:---|
| 1 | `items` | **Item Master SKU & Kho M17** | Quản trị danh mục hàng hóa chuẩn SSOT của toàn hệ thống ERP, liên thông thời gian thực với phân hệ Kho Vận M17. Quản lý giá vốn, giá buôn, giá lẻ, vị trí ô kệ (Bin), số lô (Lot), tồn kho an toàn và quy cách bảo quản. |
| 2 | `customers` | **Khách Hàng B2B** | Quản lý danh bạ doanh nghiệp đối tác, mã số thuế, hạn mức tín dụng được duyệt, dư nợ hiện tại, phân hạng đối tác (VIP Gold, Strategic, Standard) và xem Hồ sơ 360°. |
| 3 | `credit` | **Hạn Mức Tín Dụng & Công Nợ** | Cơ chế kiểm soát rủi ro tín dụng B2B: Tự động khóa đơn hàng xuất bán (Block O2C Orders) khi dư nợ thực tế vượt quá 90% hạn mức được phê duyệt bởi phòng Tài chính - Kế toán. |
| 4 | `pricing` | **Bảng Giá B2B (Tier Pricing)** | Chính sách giá phân tầng: Tier 1 Strategic (-18%), Tier 2 VIP Gold (-12%), Tier 3 Standard (Giá buôn chuẩn theo SKU). |
| 5 | `identity-matrix` | **Identity Matrix (SSOT)** | Ma trận xác thực tính toàn vẹn và đồng nhất mã định danh sản phẩm đa phân hệ: M07 (Item Master) = M41 (Pricing) = M17 (Inventory) = M13 (Sales) = M08 (Purchase). |

---

## 2. CHI TIẾT TỪNG TAB: STORAGE/API, HÀNH ĐỘNG, VALIDATION & RBAC

### TAB 1: `items` (Item Master SKU & Kho Vận M17)
1. **Dữ liệu & Persistence:**
   - Đọc từ `localStorage.getItem('NEXUSSYNC_ERP_ITEM_MASTER')` với fallback là `ENTERPRISE_MASTER_PRODUCTS`.
   - Lưu tự động vào `localStorage` khi có bất kỳ thay đổi nào (`useEffect([items])`).
   - Lưu vết truy vấn tìm kiếm vào `localStorage.getItem('nexussync_m07_search_query')` kèm debounce 250ms.
2. **Hành động người dùng (User Actions):**
   - **Tìm kiếm SKU:** Lọc theo mã SKU hoặc tên sản phẩm với cơ chế debounce.
   - **Lọc ngành hàng:** Dropdown chọn ngành hàng cụ thể hoặc `ALL`.
   - **Khai báo SKU mới (`handleCreateItem`):**
     - Đầy đủ các trường: SKU Code, Tên sản phẩm, Ngành hàng, ĐVT, Giá vốn, Giá buôn, Giá lẻ, Tồn khởi đầu, Tồn an toàn, Nhà cung cấp, Thông số kỹ thuật.
     - Thuộc tính M17 mở rộng: Kho trực thuộc (`WH-HCM-01`, `WH-HN-02`, `WH-DN-04`, `WH-COLD-03`), Vị trí ô kệ (`binLocation`), Số lô (`lotNo`), Quy cách đóng gói (`packSpec`), Điều kiện bảo quản (`storageCondition`), Hình ảnh sản phẩm (`imageUrl`).
     - Hỗ trợ tải tệp ảnh từ máy tính (`FileReader` -> DataURL) và chụp ảnh từ camera thiết bị (`getUserMedia` -> Canvas -> DataURL).
   - **Chỉnh sửa SKU (`openEditModal`, `handleSaveEditItem`):** Cho phép sửa tên, ngành hàng, giá vốn, giá buôn, giá lẻ, tồn kho và cập nhật ảnh mới.
   - **Xóa SKU (`handleDeleteItem`):** Bắt buộc kích hoạt `ConfirmDialog` dạng cảnh báo nghiêm trọng (`variant: 'danger'`), xác nhận gỡ bỏ mã SKU khỏi toàn hệ thống ERP.
   - **Xuất Excel (`handleExportExcelItems`):** Xuất toàn bộ danh mục SKU cùng 17 cột thông số sang file `NexusSync_Item_Master_SKUs.xlsx` qua thư viện `xlsx`.
   - **Đồng bộ trực tiếp (`handleRefresh`):** Hiển thị trạng thái spinner tải dữ liệu và phát thông báo `onNotify`.
   - **Phân trang:** Quản lý bởi hook `usePagination` (25 items/trang, sync với URL query params).
3. **Validation code cứng:**
   - `newSkuName.trim()` không được để trống.
   - `costPrice`, `wholesalePrice`, `retailPrice`, `stock`, `safetyStock` phải được chuyển sang kiểu số (`Number(...) || 0`).
   - Cảnh báo tồn thấp: `(it.stock || 0) <= 15` được đánh dấu `border-l-4 border-rose-500` và badge màu đỏ.
4. **RBAC & SoD:**
   - Thao tác xóa SKU yêu cầu quyền Quản trị viên Master Data với hộp thoại xác nhận 2 bước.

---

### TAB 2: `customers` (Khách Hàng B2B)
1. **Dữ liệu & Persistence:**
   - Quản lý danh sách khách hàng doanh nghiệp trong state `customers`.
2. **Hành động người dùng (User Actions):**
   - **Đăng ký khách hàng B2B mới (`handleCreateCustomer`):** Nhập Tên doanh nghiệp, Mã số thuế, Hạn mức tín dụng đề xuất. Tự động gán mã `CUST-B2B-xxx`, trạng thái `ACTIVE`, hạng `Standard`.
   - **Xem Hồ sơ 360° (`handleSelectCustomer`):** Mở modal Customer 360 và gọi callback `onSelectEntity` nạp phả hệ tài khoản (Lineage) và vết kiểm toán (Audit Trail) vào thanh ngữ cảnh đối tượng toàn cục.
3. **Validation code cứng:**
   - `newCustName.trim()` không được để trống.
   - Tự động sinh mã số thuế dự phòng nếu người dùng không nhập (`'031' + random`).

---

### TAB 3: `credit` (Hạn Mức Tín Dụng & Công Nợ)
1. **Chính sách rủi ro:**
   - Ngưỡng cảnh báo tự động: Dư nợ $\ge 90\%$ hạn mức tín dụng $\rightarrow$ Tự động chuyển trạng thái `WARNING` và kích hoạt chặn đơn hàng xuất kho (O2C Block).
   - Bảo toàn phân định thẩm quyền: Chỉ phòng Tài chính - Kế toán mới có quyền nới lỏng hoặc điều chỉnh hạn mức.

---

### TAB 4: `pricing` (Bảng Giá B2B - Tier Pricing)
1. **Quy tắc phân tầng giá:**
   - Tier 1 (Strategic Partners): Chiết khấu đặc biệt 18% trên giá niêm yết Item Master.
   - Tier 2 (VIP Gold Accounts): Chiết khấu thương mại 12% theo sản lượng tháng.
   - Tier 3 (Standard B2B): Áp dụng đơn giá chuẩn buôn sỉ theo SKU.

---

### TAB 5: `identity-matrix` (Identity Matrix SSOT)
1. **Cơ chế xác thực toàn vẹn:**
   - Bảng đối soát chéo mã định danh cốt lõi trên 5 phân hệ: M07 (Master) = M41 (Pricing) = M17 (Inventory) = M13 (Sales) = M08 (Purchase).
   - Trạng thái `M07=41=17=13=08` xác nhận không có xung đột mã định danh sản phẩm.

---

## 3. DANH MỤC MODALS TRONG M07
1. `ConfirmDialog.tsx`: Modal xác nhận xóa SKU an toàn.
2. `Customer 360 Modal`: Hiển thị chi tiết thông tin đối tác, hạn mức, dư nợ và phả hệ liên thông.
3. `Camera Modal`: Truy cập webcam/camera thiết bị di động chụp ảnh hiện trường cho SKU.
4. `Edit Item Modal`: Cập nhật thông số giá, tồn kho và hình ảnh sản phẩm.

---

## 4. CAM KẾT BẢO TOÀN (ZERO REGRESSION GUARANTEE)
Quá trình đồng bộ thiết kế giao diện từ M41 sang M07 cam kết:
- **GIỮ NGUYÊN 100%** toàn bộ state, effects, local storage persistence, event handlers, validation logic, camera logic, Excel export và callback `onSelectEntity`.
- **CHỈ ĐỒNG BỘ** lớp trình bày (Tailwind classes, tokens, L0-L4 hierarchy, KPI cards, table row hover, badge colors theo WCAG AA).
