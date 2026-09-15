# BÁO CÁO KIỂM THỬ DỮ LIỆU & VẬN HÀNH HỆ THỐNG NEXUSSYNC ERP
**Ngày kiểm thử:** 31/08/2026  
**Đối tượng kiểm thử:** Hệ thống NexusSync ERP (Kiến trúc Vỏ đa tầng L0 - L5, 29 Workspaces, 40 Phân hệ nghiệp vụ, Động cơ Kho 3 trạng thái, Động cơ Kế toán kép GL, Định giá M41).  
**Trạng thái:** Không sửa code theo yêu cầu người dùng — Thực hiện đánh giá, kiểm thử thực tế, lập báo cáo và đề xuất phương án khắc phục kiến trúc.

---

## I. TỔNG QUAN KẾT QUẢ KIỂM THỬ (EXECUTIVE SUMMARY)

Sau quá trình kiểm thử toàn diện cấu trúc dữ liệu, luồng vận hành nghiệp vụ (P2P, O2C, WMS, GL, Pricing), và tính đồng bộ giao diện UI/UX của hệ thống NexusSync ERP, hội đồng kiểm thử ghi nhận hệ thống đã xây dựng được một nền tảng ERP quy mô lớn rất ấn tượng với khung vỏ L0-L5 đầy đủ, tích hợp các động cơ nghiệp vụ lõi (Inventory 3 trạng thái, Double-Entry Ledger, Price Resolution M41). 

Tuy nhiên, qua quá trình rà soát chi tiết so với bản Đặc tả Thiết kế Hệ thống, vẫn tồn tại một số điểm lệch chuẩn kỹ thuật, ngoại lệ xử lý sự kiện, và tính đồng nhất giao diện cần được khắc phục theo kế hoạch cụ thể ở Phần III.

---

## II. KẾT QUẢ KIỂM THỬ CHI TIẾT THEO CÁC TẦNG KIẾN TRÚC L0 – L5 & CÁC ĐỘNG CƠ LÕI

### 1. Kiểm thử Tầng L0 – Sticky Header Bar & System Shell (56px)
- **Command Omnibar (`⌘K` / `Ctrl+K`)**: 
  - *Kết quả:* Hoạt động tốt trên phần lớn trình duyệt, cho phép tìm kiếm nhanh mã chứng từ và phân hệ.
  - *Điểm cần lưu ý:* Chưa phủ sóng 100% tất cả các từ khóa phụ (alias) của các báo cáo chuyên sâu M31-M37.
- **Role Switcher & Branch Selector**: 
  - *Kết quả:* Cho phép chuyển đổi vai trò (CFO, Admin, Kho trưởng,...) và chi nhánh. 
  - *Điểm cần lưu ý:* Một số phân hệ chưa tự động re-fetch lại toàn bộ quyền hạn (RBAC cache) ngay lập tức khi chuyển đổi vai trò mà cần refresh thủ công.
- **Hàng chờ WorkQueue & Thông báo (Notification Drawer)**: 
  - *Kết quả:* Hiển thị trực quan các tác vụ SLA.

### 2. Kiểm thử Tầng L1 & L2 – Primary Navigation & Workspace Router (29 Workspaces)
- **Cấu trúc 29 Workspaces / 40 Phân hệ**:
  - *Kết quả:* Các Workspace từ M01 (Hub), M02-M04 (CRM/Sales), M05-M06 (Purchase/SRM), M07-M12 (Inventory/Warehouse/Stocktake/Transfer/Lots/Serials), M30-M34 (Financial GL/AP/AR/Treasury/Consolidation), đến M41 (Pricing Management) đều đã được cấu trúc component rõ ràng.
  - *Điểm cần lưu ý:* Một số workspace phụ còn dùng dữ liệu mock tĩnh thay vì kết nối trực tiếp với các engine backend thực tế (`WorkspaceAggregationService`).

### 3. Kiểm thử Tầng L3 & L4 – Domain Header, Grid & Action Area
- **Định dạng Phông chữ Monospace cho Dữ liệu Số & Mã chứng từ**:
  - *Kết quả:* Phần lớn các bảng dữ liệu (`EnterpriseTable`, mã SKU, số tiền VND, tồn kho) đã áp dụng font Monospace (`font-mono`). 
  - *Điểm cần lưu ý:* Vẫn còn một số màn hình nhập liệu form chi tiết hiển thị số tiền/số lượng bằng font chữ thường (sans-serif), gây khó khăn cho việc dóng hàng cột số liệu tài chính.
- **Hộp thoại Xác nhận `ConfirmDialog.tsx` (Tuân thủ Rule #19)**:
  - *Kết quả:* Các nút xóa, phê duyệt quan trọng đã gọi `ConfirmDialog`.
  - *Điểm cần lưu ý:* Còn tồn tại rải rác một vài sự kiện click xác nhận nhanh ở các module con (như POS hoặc EAM) gọi trực tiếp `window.confirm()` nguyên thủy của trình duyệt thay vì qua `ConfirmDialog`.

### 4. Kiểm thử Tầng L5 – Context Rail (Lineage, Audit, Ledger)
- **Tab Lineage (Ngữ mạch chứng từ)**: Truy xuất trực quan quan hệ PO → GRN → Invoice → GL. Hoạt động ổn định đối với các chứng từ chuẩn.
- **Tab Audit (Nhật ký kiểm toán)**: Hiển thị chuỗi checksum SHA-256 chính xác.
- **Tab Ledger (Bút toán sổ cái)**: Hiển thị bút toán kép Nợ/Có đối ứng chuẩn xác theo chuẩn kế toán doanh nghiệp.

### 5. Kiểm thử Các Động Cơ Nghiệp Vụ Lõi (Engines)
- **Inventory Engine (`inventoryService.ts`)**: Quản lý chuẩn 3 trạng thái (`Physical`, `Allocated`, `Available`). Logic tính toán khả dụng (`Available = Physical - Allocated`) chính xác.
- **Accounting Engine (`accountingEngine.ts`)**: Hạch toán kép cân đối Nợ = Có.
- **Pricing Resolution Engine (M41)**: Áp dụng quy tắc ưu tiên giá (Customer Pricing → Promos → Quantity Breaks → Base Price) ổn định.

---

## III. BẢNG TỔNG HỢP CÁC LỖI & ĐIỂM LỆCH CHUẨN THIẾT KẾ

| STT | Phân hệ / Vị trí | Nội dung Lệch chuẩn / Vấn đề phát hiện | Mức độ | Khuyến nghị / Hướng xử lý |
|:---:|:---|:---|:---:|:---|
| 1 | Toàn hệ thống (UI) | Vẫn còn rải rác lệnh `window.confirm()` hoặc `alert()` chưa được thay thế hoàn toàn bằng `ConfirmDialog.tsx` (Vi phạm Rule #19). | Cao | Chuẩn hóa toàn bộ các luồng xác nhận qua `ConfirmDialog`. |
| 2 | Các Form Nhập liệu (M04, M05, M13) | Một số ô nhập số lượng, đơn giá, tổng tiền chưa được ép buộc dùng class `font-mono`. | Trung bình | Bổ sung class `font-mono` cho tất cả các thành phần hiển thị số liệu số/tiền tệ/mã. |
| 3 | RBAC & Branch Switcher | Khi chuyển đổi vai trò ở L0 Header, cache phân quyền của một số Workspace con chưa tự invalidate, dẫn đến hiển thị menu tạm thời chưa đồng bộ. | Trung bình | Tích hợp event listener cho Role/Branch change để re-render Workspace state. |
| 4 | Offline / Mock fallback | Một số báo cáo phân tích tài chính M34/M37 khi không kết nối DB trực tiếp trả về mảng rỗng thay vì fallback bộ seed dữ liệu chuẩn. | Thấp | Bổ sung cơ chế fallback mock data mạnh mẽ cho các biểu đồ Recharts khi cold start. |

---

## IV. PHƯƠNG ÁN SỬA CHỮA & LỘ TRÌNH ĐƯA APP VÀO HOẠT ĐỘNG CHUẨN KIẾN TRÚC (REMEDIATION PLAN)

Theo đúng yêu cầu của Quản trị viên (Không sửa code ngay trong pha test dữ liệu này), dưới đây là **Phương án Hành động & Lộ trình Kỹ thuật** sẽ được triển khai trong bước tiếp theo để đưa phần mềm đạt 100% tiêu chuẩn thiết kế kiến trúc NexusSync ERP:

### Bước 1: Rà soát & Thay thế Triệt để Native Dialogs (Rule #19 Compliance)
- Quét toàn bộ mã nguồn frontend tìm các từ khóa `window.confirm`, `window.alert`, `alert(`.
- Thay thế 100% bằng component `ConfirmDialog` được định nghĩa sẵn trong `/src/components/common/ConfirmDialog.tsx`.
- Đảm bảo tất cả các thao tác nhạy cảm (Xóa chứng từ, Hủy đơn hàng, Đảo bút toán) đều đi qua ConfirmDialog với Backdrop blur và icon cảnh báo chuẩn màu sắc trạng thái.

### Bước 2: Chuẩn Hóa Font Chữ Monospace Cho Dữ Liệu Số & Tài Chính
- Rà soát các component bảng (`EnterpriseTable`), thẻ KPI, modal thanh toán, hóa đơn, và ô input số lượng/tiền tệ.
- Bổ sung thống nhất class Tailwind `font-mono` cho toàn bộ các trường: Mã chứng từ, SKU, Số tiền (VND/USD), Số lượng tồn kho, Tài khoản kế toán (GL Accounts), và Tọa độ kho (Bin locations).

### Bước 3: Hoàn Thiện Đồng Bộ Context Ngữ Cảnh (RBAC & Branch Event Bus)
- Bổ sung Event Dispatcher cho `BranchSelector` và `RoleSwitcher` để phát sự kiện `nexus:branch-changed` và `nexus:role-changed`.
- Các Workspace L2 lắng nghe sự kiện này để tự động reset state, clear cache và reload lại dữ liệu phù hợp với phân quyền mới mà không cần F5 trình duyệt.

### Bước 4: Kiểm Thử E2E & Ký Duyệt Nghiệm Thu Final Acceptance
- Sau khi hoàn thành các bước khắc phục trên, tiến hành chạy chuỗi test tự động E2E flow (P2P, O2C, WMS, GL) để xác nhận hệ thống hoạt động hoàn hảo, không có lỗi ngoại lệ, đáp ứng trọn vẹn Đặc tả Kiến trúc Moudle M01 - M41.

---
*Báo cáo được lập bởi: Chuyên viên Lập trình Frontend & Kiểm thử Hệ thống ERP.*
