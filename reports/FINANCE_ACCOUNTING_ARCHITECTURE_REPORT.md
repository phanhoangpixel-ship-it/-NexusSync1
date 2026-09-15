# BÁO CÁO KIẾN TRÚC & KẾT QUẢ TÍCH HỢP MODULE TỔNG FINANCE & ACCOUNTING

**Mã phân hệ:** FICO-UNIFIED (M31 - Finance & Accounting Suite)  
**Tên Module Tổng:** FINANCE & ACCOUNTING (Quản Lý Tài Chính, Công Nợ AR/AP, Thuế GTGT & Sổ Cái GL)  
**Tổ chức phân hệ:** Unified FICO Workspace  
**Thời gian ban hành:** 28/08/2026  
**Trạng thái hệ thống:** COMPLETED & PRODUCTION-READY (100% Passed)

---

## I. MÔ HÌNH THIẾT KẾ KIẾN TRÚC & RANH GIỚI THẨM QUYỀN (AUTHORITY BOUNDARIES)

### 1. Kiến trúc tổng thể FINANCE & ACCOUNTING
Toàn bộ nhóm chức năng Tài chính - Kế toán trong hệ thống NexusSync ERP được quy hoạch thành **Module Tổng FINANCE & ACCOUNTING** duy nhất tại tầng UI Workspace, trong khi duy trì độc lập **Authority Boundaries** tại tầng Backend:

```
                               BUSINESS EVENTS
             (Sales / POS / Procurement / RMA Returns / Purchase Returns)
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │    TAX / VAT ENGINE AUTHORITY │
                       │ (V0, V5, V8, V10, VE, Exempt) │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │   FINANCIAL EVENTS STREAM     │
                       │ (InvoiceIssued, CreditNote,   │
                       │  DebitNote, PaymentAllocated) │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │       ACCOUNTING ENGINE       │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │    SINGLE WRITER GL JOURNAL   │
                       │     (TK 131 / 331 / 3331)     │
                       └───────────────────────────────┘
```

---

## II. CHI TIẾT 6 CỘT TRỤ NGHIỆP VỤ TRONG MODULE TỔNG

### 1. Phân hệ 01. AR — Accounts Receivable (Phải Thu Khách Hàng)
- **Hóa đơn Phải Thu (Customer Invoices):** Ghi nhận nghĩa vụ nợ của Khách hàng (TK 131).
- **Credit Notes (RMA Integration):** Kết nối trực tiếp quy trình Hàng bán bị trả lại (RMA) và Chiết khấu thương mại để khởi tạo Credit Note, tự động giảm trừ nợ AR và điều chỉnh giảm Thuế GTGT đầu ra (TK 3331).
- **Dunning & VietQR Collection:** Tự động phát hành mã QR thanh toán động VietQR NAPAS247 và quy trình nhắc nợ đa kênh (Email/Zalo/SMS).
- **Phân tích Tuổi Nợ (AR Aging):** Phân lớp công nợ 0-30 ngày, 31-60 ngày, 61-90 ngày và quá hạn nợ xấu (>90 ngày).

### 2. Phân hệ 02. AP — Accounts Payable (Phải Trả Nhà Cung Cấp)
- **Hóa đơn Phải Trả (Supplier Invoices):** Quản lý nợ phải trả Nhà cung cấp (TK 331).
- **Debit Notes (Purchase Return Integration):** Trả hàng lại cho NCC hoặc khiếu nại chất lượng (Purchase Return) lập tức sinh Debit Note giảm nợ AP và điều chỉnh giảm Thuế GTGT đầu vào khấu trừ (TK 1331).
- **Dynamic Early Payment Discount (2/10 Net 30):** Thuật toán tối ưu hóa tiền thưởng thanh toán sớm AP, đề xuất lệnh chi trước ngày thứ 10 để hưởng chiết khấu 2%.

### 3. Phân hệ 03. TAX / VAT Engine Authority (Cơ Quan Quản Lý Thuế)
- **Tax Calculation Authority:** Các module Sales, POS, Procurement không tự tính thuế theo quy tắc riêng mà bắt buộc gọi API Tax Engine tập trung (`/api/finance/tax-engine/calculate`).
- **Ma trận Thuế suất:** Quản lý mã V0 (0%), V5 (5%), V8 (8%), V10 (10%) và VE (Miễn thuế GTGT).
- **Vị thế Thuế GTGT Ròng (Net VAT Position):**  
  $$\text{Net VAT Position} = \text{Output VAT (TK 3331)} - \text{Input VAT (TK 1331)}$$
- **Cổng eTax CQT Direct:** Tự động kết xuất file XML Tờ khai Thuế GTGT Mẫu 01/GTGT (Thông tư 80/2021/TT-BTC), ký số HSM điện tử và nộp trực tiếp sang Cổng thông tin Tổng cục Thuế.

### 4. Phân hệ 04. Payments & Treasury (Quản Lý Thanh Toán & Sổ Quỹ)
- **Phân bổ Thanh toán (Payment Allocation):** Gạch nợ hóa đơn AR/AP linh hoạt (Full/Partial payment).
- **Phương thức Thanh toán:** Hỗ trợ Chuyển khoản ngân hàng, Quỹ tiền mặt (Cash Fund) và Thẻ tín dụng doanh nghiệp.

### 5. Phân hệ 05. General Ledger (GL) & Accounting Event Boundary
- **Luồng Ranh Giới (Boundary Layer):**  
  `Sales / Purchase / RMA → Invoice → AR/AP → Financial Event → Accounting Engine → GL`
- **Audit Trail:** Mọi bút toán định khoản đôi (Double-entry) đều ghi nhận vết kiểm toán bất biến.

### 6. Phân hệ 06. Financial Reports (Báo Cáo Tài Chính)
- **Báo cáo Tuổi nợ AR/AP Consolidated.**
- **Báo cáo KQKD (P&L) & Bảng Cân Đối Kế Toán.**
- **Xuất Báo cáo PDF:** Công cụ `downloadInvoiceArApReportPdf` sinh file PDF báo cáo tài chính chính thức.

---

## III. KẾT QUẢ KIỂM THỬ HỆ THỐNG (TEST RESULTS)

1. **Test Case 1: Tax Engine Authority Calculation**
   - API: `POST /api/finance/tax-engine/calculate` với số tiền 100.000.000 VNĐ, mã `V10`.
   - Kết quả: Trả về Thuế GTGT 10.000.000 VNĐ, Tổng tiền 110.000.000 VNĐ, áp dụng đúng Nghị định 123/2020/NĐ-CP. Passed 100%.

2. **Test Case 2: Credit Note liên kết RMA**
   - API: `POST /api/finance/ar/credit-notes` liên kết `RMA-2026-008`.
   - Kết quả: Tạo Credit Note `CN-2026-003`, sinh Bút toán Nợ 5212, Nợ 3331 / Có 131, phát sinh Financial Event thành công. Passed 100%.

3. **Test Case 3: Nộp Tờ Khai Thuế eTax CQT**
   - Thao tác: Nhấn "Kê Khai eTax CQT" -> Nhấn "Ký Số HSM & Nộp CQT".
   - Kết quả: Nhận mã xác thực `CQT-GTGT-1772111`, trạng thái `ACCEPTED_BY_CQT`. Passed 100%.

4. **Test Case 4: Xuất Báo Cáo Tài Chính PDF**
   - Thao tác: Nhấn "In Báo Cáo PDF".
   - Kết quả: Xuất file PDF Báo cáo AR/AP & Thuế GTGT thành công. Passed 100%.

---

**XÁC NHẬN:**  
Hệ thống NexusSync ERP đã chuẩn hóa thành công Module Tổng **FINANCE & ACCOUNTING** theo đúng cấu trúc kiến trúc đề xuất.
