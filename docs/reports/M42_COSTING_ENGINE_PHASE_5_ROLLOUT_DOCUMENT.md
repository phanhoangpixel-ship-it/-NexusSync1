# NEXUSSYNC ERP — TÀI LIỆU KÍCH HOẠT VÀ GIÁM SÁT GIAI ĐOẠN 5 (ROLLOUT TỪNG PHẦN)

**Mã tài liệu:** `DOC-M42-PHASE-5-ROLLOUT`  
**Ngày kích hoạt:** 14/09/2026 (Staging Environment)  
**Tác giả:** Solution Architecture & Financial Engineering Team  
**Trạng thái:** HOÀN THÀNH CHU KỲ GIÁM SÁT THÍ ĐIỂM (CHỜ PHÊ DUYỆT MỞ RỘNG)

---

## 1. QUYẾT ĐỊNH KIẾN TRÚC & PHẠM VI ROLLOUT

### 1.1. Lựa chọn phạm vi: Phương án 1 (3 Pilot SKUs)
- **Cấu hình kích hoạt trên Staging:**
  ```env
  FEATURE_NEW_COSTING_ROLLOUT_SCOPE=SKU:PRD-001,SKU:SKU-RAW-101,SKU:RAM-16GB-DDR5
  FEATURE_STRICT_COSTING_VALIDATION=true
  FEATURE_SHADOW_RUN_ENABLED=false
  ```
- **Danh sách 3 SKU thí điểm:**
  1. `PRD-001` (Laptop Business 14 - Thành phẩm công nghệ cao - Tồn kho: 15 cái - Đơn giá vốn: 20.000.000 ₫)
  2. `SKU-RAW-101` (Thép cuộn cán nóng SS400 - Nguyên vật liệu thô - Tồn kho: 120 cuộn - Đơn giá vốn: 1.100.000 ₫)
  3. `RAM-16GB-DDR5` (Bộ nhớ RAM DDR5 16GB - Linh kiện điện tử - Tồn kho: 120 thanh - Đơn giá vốn: 444.444 ₫)

### 1.2. Ghi nhận bắt buộc: Lý do TỪ CHỐI Phương án 2 (Rollout theo Kho)
> **LƯU Ý QUAN TRỌNG ĐỂ TRÁNH NHẦM LẪN:**  
> Hệ thống hiện tại có toàn bộ **17/17 SKU** đang lưu kho tại **Kho Tổng Trung Tâm (`warehouse_id = 1`)**.  
> Nếu áp dụng rollout theo kho (`FEATURE_NEW_COSTING_ROLLOUT_SCOPE=WH:1`), điều đó sẽ tương đương với việc **rollout 100% toàn bộ hệ sinh thái ngay lập tức**, bao gồm cả các mặt hàng có giá trị vốn hóa cực lớn như `SKU-ERP-LIC` (Bản quyền doanh nghiệp, tồn kho 999 đơn vị với tổng giá trị **99,9 tỷ VNĐ**), `SKU-CHIP-3NM` (11,25 tỷ VNĐ), `SKU-NANO-CO2` (10,32 tỷ VNĐ).  
> Điều này hoàn toàn vi phạm nguyên tắc an toàn thử nghiệm từng phần (Partial Staged Rollout). Vì vậy, quyết định kiến trúc bắt buộc phải phân vùng theo **Danh sách trắng SKU (SKU-Level Whitelist)**.

---

## 2. MA TRẬN ĐỊNH TUYẾN ĐỘNG (ROUTING MATRIX)

| STT | Mã SKU | Tên sản phẩm | Danh mục | Đơn giá vốn | Engine được chỉ định | Thẩm quyền dữ liệu | Trạng thái định tuyến |
|---|---|---|---|---|---|---|---|
| **1** | **PRD-001** | **Laptop Business 14** | **Thành phẩm** | **20.000.000 ₫** | **FIFO (Engine Mới)** | **CostLayers Multi-Layer** | **ĐÚNG (FIFO)** |
| **2** | **SKU-RAW-101** | **Thép cuộn SS400** | **Nguyên vật liệu** | **1.100.000 ₫** | **FIFO (Engine Mới)** | **CostLayers Multi-Layer** | **ĐÚNG (FIFO)** |
| **3** | **RAM-16GB-DDR5** | **RAM DDR5 16GB** | **Linh kiện** | **444.444 ₫** | **FIFO (Engine Mới)** | **CostLayers Multi-Layer** | **ĐÚNG (FIFO)** |
| 4 | PRD-002 | Monitor 27" | Màn hình | 5.000.000 ₫ | WEIGHTED_AVERAGE (Legacy) | Products.costPrice | ĐÚNG (Legacy) |
| 5 | PRD-003 | Mechanical Keyboard | Phụ kiện | 500.000 ₫ | WEIGHTED_AVERAGE (Legacy) | Products.costPrice | ĐÚNG (Legacy) |
| 6 | PRD-004 | Wireless Mouse | Phụ kiện | 300.000 ₫ | WEIGHTED_AVERAGE (Legacy) | Products.costPrice | ĐÚNG (Legacy) |
| 7 | SKU-ENG-088 | Bơm thủy lực P-1000 | Thiết bị | 2.500.000 ₫ | WEIGHTED_AVERAGE (Legacy) | Products.costPrice | ĐÚNG (Legacy) |
| 8 | SKU-MAT-302 | Cảm biến DN80 | Cảm biến | 1.300.000 ₫ | WEIGHTED_AVERAGE (Legacy) | Products.costPrice | ĐÚNG (Legacy) |
| 9 | SKU-ELC-901 | Biến tần 45kW | Thiết bị | 9.500.000 ₫ | WEIGHTED_AVERAGE (Legacy) | Products.costPrice | ĐÚNG (Legacy) |
| 10 | SKU-ACC-055 | Cáp chống nhiễu | Vật tư | 18.000 ₫ | WEIGHTED_AVERAGE (Legacy) | Products.costPrice | ĐÚNG (Legacy) |
| 11 | SKU-TOOL-12 | Cờ lê tự động | Dụng cụ | 600.000 ₫ | WEIGHTED_AVERAGE (Legacy) | Products.costPrice | ĐÚNG (Legacy) |
| 12 | SKU-VALVE-04 | Van bi inox DN50 | Van CN | 1.900.000 ₫ | WEIGHTED_AVERAGE (Legacy) | Products.costPrice | ĐÚNG (Legacy) |
| 13 | SSD-1TB-NVME | SSD 990 Pro 1TB | Linh kiện | 1.200.000 ₫ | WEIGHTED_AVERAGE (Legacy) | Products.costPrice | ĐÚNG (Legacy) |
| 14 | CPU-INTEL-I7 | Intel Core i7 14700K | Linh kiện | 3.500.000 ₫ | WEIGHTED_AVERAGE (Legacy) | Products.costPrice | ĐÚNG (Legacy) |
| 15 | SKU-CHIP-3NM | Vi Xử Lý AI Nexus-V1 | Chip bán dẫn | 9.000.000 ₫ | WEIGHTED_AVERAGE (Legacy) | Products.costPrice | ĐÚNG (Legacy) |
| 16 | SKU-NANO-CO2 | Vật Liệu Carbon Nano | Hóa chất | 2.400.000 ₫ | WEIGHTED_AVERAGE (Legacy) | Products.costPrice | ĐÚNG (Legacy) |
| 17 | SKU-ERP-LIC | Bản quyền NexusSync | Phần mềm | 100.000.000 ₫ | WEIGHTED_AVERAGE (Legacy) | Products.costPrice | ĐÚNG (Legacy) |

---

## 3. KẾT QUẢ GIÁM SÁT 1 CHU KỲ NGHIỆP VỤ THỰC TẾ

### 3.1. Các giao dịch thực tế đã xử lý
1. **Giao dịch #1 (SO-2026-501):** Xuất bán 2 x `PRD-001` (Laptop Business 14).
   - Engine xử lý: **FIFO (Engine Mới)**.
   - Tổng COGS: **40.000.000 ₫** (2 cái x 20.000.000 ₫).
   - Khấu trừ tầng chi phí: Layer #1 giảm từ 15 -> **13 cái**.
   - Bút toán GL: `#JE-COGS-...` ghi `Nợ 632 / Có 156 = 40.000.000 ₫` (**Khớp 100%**).
2. **Giao dịch #2 (SO-2026-502):** Xuất 10 x `SKU-RAW-101` (Thép cuộn SS400).
   - Engine xử lý: **FIFO (Engine Mới)**.
   - Tổng COGS: **11.000.000 ₫** (10 cuộn x 1.100.000 ₫).
   - Khấu trừ tầng chi phí: Layer #8 giảm từ 120 -> **110 cuộn**.
   - Bút toán GL: `#JE-COGS-...` ghi `Nợ 632 / Có 156 = 11.000.000 ₫` (**Khớp 100%**).
3. **Giao dịch #3 (SO-2026-503):** Xuất 5 x `RAM-16GB-DDR5` (Bộ nhớ RAM DDR5 16GB).
   - Engine xử lý: **FIFO (Engine Mới)**.
   - Tổng COGS: **2.222.220 ₫** (5 thanh x 444.444 ₫).
   - Khấu trừ tầng chi phí: Layer #12 giảm từ 120 -> **115 thanh**.
   - Bút toán GL: `#JE-COGS-...` ghi `Nợ 632 / Có 156 = 2.222.220 ₫` (**Khớp 100%**).
4. **Giao dịch #4 (SO-2026-504 - SKU Ngoài Scope):** Xuất 1 x `PRD-002` (Monitor 27").
   - Engine xử lý: **WEIGHTED_AVERAGE (Engine Cũ)**.
   - Tổng COGS: **5.000.000 ₫**.
   - Tầng chi phí Layer #2: **Giữ nguyên 20 cái** (không bị can thiệp trái thẩm quyền).
   - Bút toán GL: `#JE-COGS-...` ghi `Nợ 632 / Có 156 = 5.000.000 ₫` (**Khớp 100%**).

### 3.2. Bảng đối chiếu chênh lệch tài chính (FIFO vs Weighted Average)

| Mã SKU | SL xuất | Giá vốn thực tế (FIFO) | Đơn giá FIFO | Giá vốn ước tính (Cũ) | Đơn giá Cũ | Chênh lệch tài chính | Nhận xét kế toán |
|---|---|---|---|---|---|---|---|
| `PRD-001` | 2 | 40.000.000 ₫ | 20.000.000 ₫ | 43.750.000 ₫ | 21.875.000 ₫ | **-3.750.000 ₫** | FIFO phản ánh chính xác lô nhập thực tế |
| `SKU-RAW-101` | 10 | 11.000.000 ₫ | 1.100.000 ₫ | 10.500.000 ₫ | 1.050.000 ₫ | **+500.000 ₫** | Khớp chính xác tầng chi phí đầu kỳ |
| `RAM-16GB-DDR5` | 5 | 2.222.220 ₫ | 444.444 ₫ | 2.399.998 ₫ | 480.000 ₫ | **-177.778 ₫** | Khớp chính xác tầng chi phí đầu kỳ |

---

## 4. TỔNG KẾT TIÊU CHÍ AN TOÀN & ĐỀ XUẤT

- **Số giao dịch thực tế đã xử lý:** 4 giao dịch (3 giao dịch pilot trong scope + 1 giao dịch ngoài scope).
- **Số lỗi runtime / exception:** **0 lỗi (Zero Errors)**.
- **Tỷ lệ khớp Sổ cái M30 (Nợ 632 / Có 156):** **100.0%**.
- **Số giao dịch bị chặn oan bởi Strict Validation:** **0 giao dịch**.
- **Tác động tới Production:** **0% (Hoàn toàn cách ly trên Staging)**.

### Đề xuất bước tiếp theo:
Hệ thống Staging hiện vận hành hoàn hảo với 3 SKU thí điểm. Khi Quý Anh/Chị phê duyệt, chúng ta có thể lựa chọn 1 trong 2 hướng:
1. **Mở rộng phạm vi Rollout Thí điểm Đợt 2:** Bổ sung thêm 4 SKU nhóm linh kiện & thiết bị (`PRD-002`, `CPU-INTEL-I7`, `SSD-1TB-NVME`, `SKU-ENG-088`).
2. **Tiến hành Verification Gate toàn diện (Giai đoạn 6) và Chuẩn bị Go-live 100% (Giai đoạn 7).**
