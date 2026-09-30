# NEXUSSYNC ERP — TỔNG HỢP QUY TRÌNH VẬN HÀNH TIÊU CHUẨN (SOP)

Bộ tài liệu này định nghĩa và chuẩn hóa toàn bộ 5 quy trình nghiệp vụ văn phòng cốt lõi của NexusSync ERP, phục vụ công tác đào tạo nhân sự mới, vận hành thực tế và kiểm toán quy trình.

---

### DANH MỤC CÁC QUY TRÌNH TIÊU CHUẨN (SOP 1 TRANG)

| Mã SOP | Tên Quy Trình Chuẩn Hóa | Phân Hệ Liên Quan | Vai Trò Thực Hiện Chính |
| :--- | :--- | :--- | :--- |
| **[SOP-P2P-01](./SOP_01_PROCURE_TO_PAY_P2P.md)** | **Quy trình Mua hàng & Thanh toán (Procure-to-Pay)** | `M08`, `M10`, `M17`, `M31`, `M32` | Nhân viên Mua hàng, Thủ kho, KCS, Kế toán AP |
| **[SOP-O2C-02](./SOP_02_ORDER_TO_CASH_O2C.md)** | **Quy trình Bán hàng & Thu tiền (Order-to-Cash)** | `M11`, `M13`, `M17`, `M24`, `M30`, `M32` | Nhân viên Kinh doanh, Quản lý Tín dụng, Kế toán AR |
| **[SOP-INV-03](./SOP_03_INVENTORY_AND_WMS.md)** | **Quy trình Quản trị Tồn kho & Kiểm kê (Inventory & WMS)** | `M17`, `M20`, `M24`, `M42`, `M30` | Quản lý Kho, Thủ kho, Tổ kiểm kê, Kế toán Kho |
| **[SOP-FIN-04](./SOP_04_FINANCIAL_ACCOUNTING_GL.md)** | **Quy trình Kế toán Tổng hợp & Khóa sổ (Financial & GL)** | `M30`, `M31`, `M32`, `M34`, `M37` | Kế toán viên, Kế toán Tổng hợp, Kế toán Trưởng, CFO |
| **[SOP-HR-05](./SOP_05_HR_AND_PAYROLL.md)** | **Quy trình Nhân sự, Chấm công & Tính lương (HR & Payroll)** | `M28`, `M14`, `M30`, `M32` | Nhân viên HR, Chuyên viên C&B, Kế toán Lương |

---

### QUY TẮC BẢO ĐẢM TOÀN VẸN HỆ THỐNG
1. **Single-Writer Authority**: Tuyệt đối tôn trọng quyền ghi sổ đơn nhất (`InventoryService` cho Kho, `AccountingService` cho Sổ cái Kế toán).
2. **Ngăn chặn Bán âm / Xuất âm**: Hệ thống tự động kiểm tra số lượng khả dụng (`stockAvailable`) trước mọi giao dịch xuất kho.
3. **Tuân thủ Chế độ Kế toán VN**: Mọi định khoản tự động và mẫu in tuân thủ 100% Thông tư 200/2014/TT-BTC và Nghị định 123/2020/NĐ-CP về Hóa đơn điện tử.
