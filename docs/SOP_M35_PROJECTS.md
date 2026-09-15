# SOP-M35: STANDARD OPERATING PROCEDURE — PROJECTS & WBS MANAGEMENT
## QUY TRÌNH VẬN HÀNH CHUẨN QUẢN TRỊ DỰ ÁN & CẤU TRÚC PHÂN CHIA CÔNG VIỆC WBS

**Mã tài liệu:** `SOP-PRJ-35.v2026.1`  
**Hệ thống:** NexusSync ERP Enterprise Platform  
**Phân hệ:** `M35` — Projects & WBS Management  
**Workspace liên quan:** `WS18_PROJECTS`  
**Quy tắc Kiến trúc bắt buộc:** `/docs/AI/GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`  
**Ngày ban hành:** 01/09/2026  
**Trạng thái kiểm định:** ✅ **CHÍNH THỨC BAN HÀNH & BẢO LƯU KIẾN TRÚC**

---

## 1. MỤC TIÊU & PHẠM VI ÁP DỤNG

### 1.1. Mục tiêu
Quy trình này quy định phương pháp thống nhất trên toàn hệ thống NexusSync ERP để:
- Khởi tạo và quản lý Điều lệ Dự án (Project Charter) và Danh mục đầu tư (Portfolio).
- Thiết lập cấu trúc phân rã công việc WBS 4 cấp độ và gán mốc bàn giao Milestone.
- Lập lịch tiến độ trực quan với Gantt Chart và giám sát Đường găng (Critical Path).
- Hạch toán giá thành công trình Job Costing 5 thành phần chi phí (Nhân công, Vật tư, Thiết bị, Dịch vụ ngoài, Quản lý).
- Phân tích hiệu suất giá trị thu được Earned Value Management (EVM) theo chuẩn PMI/ISO 21500.

### 1.2. Phạm vi áp dụng
- Toàn bộ các dự án Tổng thầu EPC/Xây dựng, Dự án Triển khai ERP/IT, Nghiên cứu R&D, Cơ sở hạ tầng và Tư vấn dịch vụ.

---

## 2. QUY TRÌNH VÒNG ĐỜI DỰ ÁN (PROJECT LIFECYCLE STATE MACHINE)

```
       [DRAFT]
          |
          v (Phê duyệt điều lệ & dự toán ban đầu BAC)
      [PLANNED]
          |
          v (Ký kết hợp đồng kinh tế & gán PM)
      [APPROVED]
          |
          v (Phát lệnh thi công / Khởi động dự án)
       [ACTIVE] <====================================+
          |                                         |
     +----+----+                                    |
     |         |                                    |
     v         v (Tạm dừng kỹ thuật / Chờ vật tư)  | (Khôi phục triển khai)
[COMPLETED] [ON_HOLD] ------------------------------+
     |
     v (Quyết toán tài chính, bàn giao & bảo hành)
  [CLOSED]
```

### Quy tắc chuyển đổi trạng thái:
1. `DRAFT` $\rightarrow$ `PLANNED`, `CANCELLED`
2. `PLANNED` $\rightarrow$ `APPROVED`, `CANCELLED`
3. `APPROVED` $\rightarrow$ `ACTIVE`, `ON_HOLD`, `CANCELLED`
4. `ACTIVE` $\rightarrow$ `ON_HOLD`, `COMPLETED`, `CANCELLED`
5. `ON_HOLD` $\rightarrow$ `ACTIVE`, `CANCELLED`
6. `COMPLETED` $\rightarrow$ `CLOSED`

---

## 3. CẤU TRÚC PHÂN CHIA CÔNG VIỆC WBS 4 CẤP ĐỘ

- **Level 1 — Phase (Giai đoạn):** Khởi tạo, Khảo sát thiết kế, Thi công/Triển khai, Nghiệm thu bàn giao.
- **Level 2 — Work Package (Gói công việc):** Nhóm các nhiệm vụ có chung đầu ra kỹ thuật.
- **Level 3 — Task (Hạng mục công việc):** Tác vụ cụ thể được giao cho Trưởng nhóm/Nhân sự đảm nhiệm.
- **Level 4 — Subtask / Deliverable (Sản phẩm bàn giao):** Chi tiết công việc thực thi kèm hồ sơ nghiệm thu.

---

## 4. QUY TẮC HẠCH TOÁN CHI PHÍ & GIÁ THÀNH CÔNG TRÌNH (JOB COSTING)

### 4.1. Chi phí Nhân công (Labor Cost)
- Được trích xuất tự động từ Nhật ký chấm công Timesheet (`Hours Logged` $\times$ `Hourly Rate`).
- Ghi nhận nợ Có TK 154 (Chi phí SXKD dở dang) / Nợ Có TK 334 (Phải trả người lao động).

### 4.2. Chi phí Vật tư xuất kho (Material Cost)
- **Bắt buộc tuân thủ Single-Writer:** Ủy quyền thông qua `InventoryService.postTransaction('GOODS_ISSUE')`.
- Định giá xuất kho qua `CostingEngine` và hạch toán Nợ TK 154 / Có TK 152.

### 4.3. Chi phí Máy móc & Dịch vụ ngoài
- Máy thi công: Nợ TK 154 / Có TK 153, 214.
- Dịch vụ thuê ngoài: Nợ TK 154 / Có TK 331.

---

## 5. BỘ CHỈ SỐ QUẢN TRỊ EVM (EARNED VALUE MANAGEMENT)

| Chỉ số | Tên chỉ số | Công thức tính | Ý nghĩa đánh giá |
|---|---|---|---|
| **BAC** | Budget at Completion | $\sum \text{Dự toán được duyệt}$ | Tổng ngân sách cam kết hoàn thành dự án |
| **PV** | Planned Value | $BAC \times \text{Tiến độ kế hoạch \%}$ | Giá trị kế hoạch cần đạt tại thời điểm báo cáo |
| **EV** | Earned Value | $BAC \times \text{Tiến độ thực tế \%}$ | Giá trị thực tế đã tạo ra |
| **AC** | Actual Cost | $\sum \text{Chi phí thực tế đã chi}$ | Tổng chi phí đã ghi nhận |
| **CV** | Cost Variance | $EV - AC$ | $CV > 0$: Tiết kiệm chi phí; $CV < 0$: Vượt ngân sách |
| **SV** | Schedule Variance | $EV - PV$ | $SV > 0$: Vượt tiến độ; $SV < 0$: Chậm tiến độ |
| **CPI** | Cost Performance Index | $EV / AC$ | $CPI \ge 1.0$: Tối ưu chi phí; $CPI < 1.0$: Kém hiệu quả |
| **SPI** | Schedule Performance Index | $EV / PV$ | $SPI \ge 1.0$: Kịp/Vượt tiến độ; $SPI < 1.0$: Trễ hạn |
| **EAC** | Estimate at Completion | $BAC / CPI$ | Dự báo tổng chi phí khi kết thúc dự án |
| **VAC** | Variance at Completion | $BAC - EAC$ | Chênh lệch dự toán cuối kỳ |

---

## 6. LƯU TRỮ HỒ SƠ & BÁO CÁO DỰ ÁN
- Hồ sơ Dự án bao gồm Điều lệ (Charter), Hợp đồng (Contract), Bản vẽ thiết kế (Design Spec), Biên bản nghiệm thu (Deliverable), Báo cáo UAT.
- Xuất file Báo cáo Dự án & EVM định dạng chuẩn PDF phục vụ trình Ban Giám đốc và Chủ đầu tư.
