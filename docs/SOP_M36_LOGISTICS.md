# QUY TRÌNH VẬN HÀNH CHUẨN (SOP) - MODULE M36: QUẢN LÝ VẬN TẢI & ĐỘI XE (LOGISTICS & FLEET ENTERPRISE WORKSPACE)

**Mã tài liệu:** SOP-LOG-36.v2026.2  
**Phân hệ:** Module M36 - Logistics & Fleet Management  
**Áp dụng cho:** Bộ phận Điều vận Vận tải, Quản lý Đội xe, Tài xế, Nhân viên Giao nhận POD & Kế toán Chi phí Vận tải  
**Ngày ban hành:** 28/08/2026  

---

## 1. MỤC ĐÍCH & PHẠM VI ÁP DỤNG

Tài liệu này quy định quy trình vận hành hợp nhất trong Enterprise Workspace **Logistics & Fleet (M36)** nhằm quản lý toàn bộ vòng đời vận tải từ lập kế hoạch, phân công phương tiện, giám sát lộ trình GPS, nghiệm thu chứng từ giao hàng POD, xử lý ngoại lệ giao hàng, quản lý định mức nhiên liệu và lập lịch bảo trì phương tiện.

Ranh giới quản lý:
- **Warehouse (WMS):** Chịu trách nhiệm chuẩn bị hàng hóa sẵn sàng xuất kho.
- **Logistics & Fleet (M36):** Chịu trách nhiệm phương tiện và nhân sự vận chuyển hàng hóa tới điểm nhận.
- **Asset & Maintenance (M38):** Chịu trách nhiệm bảo dưỡng định kỳ và sửa chữa lớn phương tiện.
- **Finance & Accounting (M30):** Chịu trách nhiệm hạch toán tài chính và chi phí vận tải.

---

## 2. CẤU TRÚC 8 PHÂN HỆ VẬN HÀNH TRONG ENTERPRISE WORKSPACE

```
🚚 LOGISTICS & FLEET ENTERPRISE WORKSPACE
│
├── Dashboard Overview (Tổng quan chỉ số KPI, Trips hôm nay, In Transit & Chi phí)
├── 01. Transport Planning (Shipments, Transport Requests, Transport Orders & Load Planning)
├── 02. Delivery Operations (Delivery Orders, Pre-Dispatch Verification, POD & Delivery Exceptions)
├── 03. Fleet Management (Vehicles, Vehicle Types, Status, Registration & Insurance Tracker)
├── 04. Driver Management (Driver Roster, Licenses Class & Expiry, Performance Scorecards)
├── 05. Route & Trip Management (Routes, Multi-stop Sequences, Distance, ETA & Live GPS)
├── 06. Fuel & Operating Cost (Fuel Ledger, Fuel Efficiency L/100km, Tolls & Transport Costing)
├── 07. Fleet Maintenance (Maintenance Schedule & Service Requests linking to Asset & Maintenance)
└── 08. Reports & Analytics (Delivery SLA OTD %, Fleet Utilization & Cost Analysis)
```

---

## 3. QUY TRÌNH 6 BƯỚC VẬN HÀNH THỰC TẾ

### 3.1 BƯỚC 1: Lập Kế Hoạch Vận Chuyển (Transport Planning)
- **Thao tác:** Điều vận viên truy cập Tab `01. Transport Planning` $\rightarrow$ Bấm `Tạo Lệnh Vận Chuyển`.
- **Nhập liệu:** Khách hàng, Địa chỉ Lấy hàng (Origin), Địa chỉ Giao hàng (Destination), Trọng lượng (kg), Thể tích (m³) và Cước phí dự kiến.
- **Trạng thái:** Lệnh khởi tạo ở trạng thái `PLANNED`.

### 3.2 BƯỚC 2: Kiểm Tra Pre-Dispatch & Phân Công Điều Vận (Dispatch & Pre-Check)
- **Thao tác:** Bấm `Gán xe & xế` tại lệnh `PLANNED`.
- **Hệ thống tự động kiểm tra (Pre-Dispatch Verification):**
  - Giấy phép lái xe (GPLX) tài xế còn thời hạn sử dụng.
  - Phương tiện ở trạng thái `AVAILABLE` hoặc `ACTIVE`, hạn đăng kiểm & bảo hiểm hợp lệ.
- **Trạng thái:** Chuyển lệnh sang `ASSIGNED`, xe sang `IN_USE` và tài xế sang `ON_TRIP`.

### 3.3 BƯỚC 3: Xuất Phát & Giám Sát Hành Trình GPS (Route & Trip Tracking)
- **Thao tác:** Khi xe rời kho, bấm `Xuất phát` $\rightarrow$ lệnh chuyển sang `IN_TRANSIT`.
- **Giám sát:** Bộ phận GPS xem Tab `05. Route & Trips` theo dõi tiến độ %, tốc độ km/h và nhiệt độ thùng lạnh.

### 3.4 BƯỚC 4: Nghiệm Thu Giao Hàng & Ký POD (Delivery & POD Engine)
- **Thao tác:** Khi giao hàng tới điểm nhận, nhân viên giao nhận/tài xế bấm `Ký POD`.
- **Nhập liệu:** Tên người nhận hàng, kết quả nghiệm thu (`DELIVERED_SUCCESS`, `PARTIAL_DELIVERY`, v.v.), ảnh chứng từ và tình trạng tem seal.
- **Trạng thái:** Chuyển lệnh sang `DELIVERED`, tạo bản ghi POD và giải phóng Xe & Tài xế về `AVAILABLE`.

### 3.5 BƯỚC 5: Xử Lý Ngoại Lệ Giao Hàng & Bảo Trì Xe (Exceptions & Maintenance)
- **Ngoại lệ (Delivery Exceptions):** Ghi nhận các sự cố ùn tắc, hỏng hóc giữa đường hay sai địa chỉ tại Tab `02. Delivery Operations`.
- **Bảo trì phương tiện (Fleet Maintenance):** Lập lịch bảo dưỡng tại Tab `07. Fleet Maintenance` để gửi thông điệp yêu cầu vật tư/sửa chữa tới phân hệ Asset & Maintenance (M38).

### 3.6 BƯỚC 6: Quản Lý Nhiên Liệu & Đồng Bộ Tài Chính (Fuel & Transport Costing)
- **Nhiên liệu:** Ghi nhận hóa đơn nạp dầu Diesel, số lít, đơn giá và số KM Odometer tại Tab `06. Fuel & Costs Ledger`.
- **Đồng bộ Kế toán:** Tự động tổng hợp Cước phí vận tải & Chi phí nhiên liệu để chuyển dữ liệu sang GL Engine (Finance M30).

---

**Tài liệu ban hành theo Quyết định Trưởng Ban Vận Tải & Công Nghệ ERP NexusSync.**
