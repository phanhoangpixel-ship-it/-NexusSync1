# NEXUSSYNC ERP — BUSINESS KNOWLEDGE & GUIDED WORKFLOW SYSTEM REPORT
**Version:** 1.0.0  
**Status:** COMPLETED & VERIFIED  
**Architecture Compliance:** Strictly aligned with `GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md` (Rules 01–20).

---

## 1. MỤC TIÊU & NGUYÊN TẮC BẤT BIẾN

### 1.1 Nguyên Tắc Cốt Lõi (Absolute Rules)
1. **Business Knowledge Layer KHÔNG ĐƯỢC trở thành Business Engine mới**:
   - Toàn bộ nghiệp vụ tính giá vốn COGS thuộc về `CostingService` (M17/M41).
   - Toàn bộ ghi nhận xuất nhập tồn kho thuộc về `InventoryService.postTransaction()` (M17).
   - Toàn bộ định khoản Nợ/Có thuộc về `AccountingService` / GL (M30).
   - Lớp Business Knowledge đóng vai trò **Sidecar Guide**, giải thích, trực quan hóa luồng dữ liệu, hỗ trợ người dùng định tuyến nghiệp vụ và hướng dẫn thao tác đúng.
2. **ERP Core là Nguồn Sự Thật (Single Source of Truth)**:
   - Các định nghĩa về bảng dữ liệu (Tables), Service Authority, Input/Output đều trích xuất trực tiếp từ kiến trúc Core ERP.
3. **Phân cấp tri thức**:
   - `SOP phản ánh Business Process → Guidance phản ánh SOP → Training phản ánh Guidance`.

---

## 2. CÁC THÀNH PHẦN ĐÃ XÂY DỰNG

### 2.1 Cấu trúc Dữ liệu Tri thức (`/src/data/erpBusinessKnowledge.ts`)
- **Bản đồ 9 Miền Nghiệp vụ (9 Business Domains)**:
  1. `CORE_IAM`: Quản trị Danh tính, Phân quyền RBAC & Kiểm toán (M01-M05).
  2. `MASTER_DATA`: Dữ liệu Chủ Khách hàng, Vật tư, Nhà cung cấp (M06-M07, M09).
  3. `P2P`: Mua sắm đến Thanh toán (M08, M10, M11, M31, M32).
  4. `O2C`: Bán hàng đến Thu tiền (M12-M16, M41, M31, M32).
  5. `INVENTORY_WMS`: Quản trị Tồn kho, Kho bãi & Định vị Lô/Serial (M17, M19, M20-M24).
  6. `MANUFACTURING`: Hoạch định & Điều hành Sản xuất (M18/M25, M26).
  7. `ASSET_LOGISTICS`: Quản lý Tài sản & Vận tải Đội xe (M27, M36).
  8. `FINANCE_GL`: Kế toán Tài chính & Hợp nhất (M30-M35).
  9. `GOVERNANCE_QC`: Nhân sự, Tài liệu, An toàn & Chất lượng (M28, M29, M38-M40).

- **12 Chu trình Giá trị Doanh nghiệp (E2E Business Value Streams)**:
  - P2P (Procure-to-Pay), O2C (Order-to-Cash), MTO/MTS (Manufacturing Production), Cycle Count (Blind Stocktake & Reconciliation), RMA (Customer Return & Warranty), Inter-Warehouse Transfer, Direct PO Receiving (Fast-track), Direct Sales POS, Scrap & Write-off, Asset Preventive Maintenance, Subcontracting Production, Vendor Claim & Chargeback.
  - Mỗi chu trình gồm: Tên gọi, Ý nghĩa kinh tế, Trigger, Các bước tuần tự (Input, Engine, DB Tables, Output, Hand-off).

- **Từ Điển Thuật Ngữ Nghiệp Vụ Song Ngữ (ERP Bilingual Glossary)**:
  - Chuẩn hóa: Physical Stock vs. Available Stock, 3-Way Matching, Single Writer Authority, Blind Count, COGS, FEFO, Double-Entry Bookkeeping, Work-In-Progress (WIP), Over-Receipt Policy, Landed Cost.

- **Cơ chế Phân giải Quyết định (Decision Assistant Routing Logic)**:
  - 5 Ý định phổ biến: "Tôi muốn nhập hàng", "Tôi muốn bán hàng", "Tôi muốn chuyển kho", "Tồn kho bị lệch", "Khách trả hàng".
  - Bảng disambiguation hỏi sâu để chọn đúng phân hệ (ví dụ: Phân biệt M08 Purchase Order vs M17 Fast-Track vs M18 Production Inward).

- **Kịch bản Thực hành (Training Practice Scenarios)**:
  - Kịch bản 1: Mua hàng linh kiện nhập kho (P2P 100 RAM).
  - Kịch bản 2: Bán sỉ giao hàng thu tiền (O2C).
  - Kịch bản 3: Kiểm kê kho đếm mù & Bù trừ chênh lệch (M19 + M20).

### 2.2 Các Giao diện UI/UX Tri thức (`/src/components/knowledge/`)
1. `BusinessDecisionAssistantModal.tsx`: Hộp thoại tương tác định tuyến ý định người dùng ("Tôi muốn...").
2. `ErpAcademyModal.tsx`: Học viện đào tạo 12 chu trình giá trị với Flow Visualizer và Kịch bản kiểm thử trực tiếp có checklist xác thực.
3. `ErpGlossaryModal.tsx`: Tra cứu thuật ngữ nghiệp vụ với bộ lọc miền dữ liệu và liên kết phân hệ liên quan.
4. `ModuleGuidedDrawer.tsx`: Ngăn kéo tri thức phân hệ 6 câu hỏi:
   - *Phân hệ này là gì?*
   - *Khi nào nên dùng?*
   - *Khi nào KHÔNG được dùng (Điểm nhầm lẫn thường gặp)?*
   - *Engine xử lý thẩm quyền duy nhất (Single Writer)?*
   - *Bảng cơ sở dữ liệu tác động trực tiếp?*
   - *Sai lầm phổ biến & Hậu quả đối với hệ thống?*

### 2.3 Tích hợp vào Vỏ Kiến trúc Hệ thống (L0-L5)
- **L0 Global Header**: Thêm 2 nút truy cập nhanh:
  - `Trợ lý Nghiệp vụ` (Compass Icon): Mở `BusinessDecisionAssistantModal`.
  - `Học viện ERP` (GraduationCap Icon): Mở `ErpAcademyModal`.
- **L2/L3 DomainWorkspaceShell**: Thêm nút:
  - `Hướng dẫn Phân hệ` (HelpCircle Icon): Mở `ModuleGuidedDrawer` tương ứng với phân hệ hiện hành.
- **L4 WorkspaceHub (Trang chủ ERP)**:
  - Bổ sung **Trung Tâm Hướng Dẫn Nghiệp Vụ & Quyết Định ERP** với 3 thẻ tương tác lớn trực quan.
- **Tuân thủ Tuyệt đối Rule #19**:
  - Không sử dụng `alert` hay `confirm` mặc định; toàn bộ cảnh báo hoặc xác nhận thao tác đều thực hiện qua `ConfirmDialog.tsx`.
  - Số liệu hiển thị dưới dạng font `font-mono`, các trạng thái màu sắc chuẩn hóa (Emerald, Blue, Amber, Rose, Indigo).
