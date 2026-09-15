# TÀI LIỆU VẬN HÀNH & KẾT QUẢ KIỂM THỬ MODULE M24: WMS EXTENDED (KHO VẬN NÂNG CAO)

**Mã phân hệ:** M24  
**Tên hệ thống:** NexusSync ERP (Enterprise Resource Planning Suite)  
**Phạm vi áp dụng:** WMS Tier-1, Kho vận trung tâm, Quản lý sóng soạn hàng, Điều phối cửa kho & Vận chuyển.  
**Phiên bản:** v2.0 • Production Ready  

---

## 1. Định Nghĩa Thiết Kế Kiến Trúc Module M24
Module **M24 (WMS Extended)** là phân hệ chuyên sâu nằm trong bộ **05. WMS & Inventory Suite**, đóng vai trò cung cấp các thuật toán và nghiệp vụ tự động hóa kho vận nâng cao mà các hệ thống WMS cơ bản không có sẵn:
- **Tầng L0 - L5 Architecture**: Tích hợp chặt chẽ với tầng `Inventory Core` (M17) qua cơ chế *Event-Sourcing* và *Stock Ledger Authority*.
- **6 Phân Khúc Vận Hành Cốt Lõi**:
  1. **Wave Picking**: Gom nhóm đơn hàng bán (`SO`) theo khu vực / tuyến đường để tối ưu hóa quãng đường di chuyển của nhân viên kho.
  2. **Replenishment**: Quy tắc tự động chuyển hàng từ kho khối lượng lớn (Bulk Storage) ra khu vực nhặt hàng nhanh (Pick-Face).
  3. **Bin Allocation**: Thuật toán phân bổ vị trí thông minh theo nguyên tắc FEFO/FIFO và điều kiện bảo quản.
  4. **Packing LPN (License Plate Number)**: Quản lý định danh kiện hàng (Carton/Pallet) gắn liền với trọng lượng, kích thước và mã vạch.
  5. **Dock Appointment**: Quản lý lịch xe ra vào cửa kho (`Inbound Dock` & `Outbound Bay`) chống ùn tắc.
  6. **Carrier Freight**: Tích hợp hãng vận chuyển, tạo vận đơn (`Waybill`) và hạch toán chi phí cước phí.

---

## 2. Kiểm Tra Chi Tiết & Các Task Tính Năng Được Thiết Kế
Hệ thống đã triển khai đầy đủ 6 tab tính năng chuyên biệt trong `M24WMSExtendedWorkspace.tsx`:
- **Wave Picking Management**: Theo dõi danh sách sóng soạn, số lượng đơn SO, số dòng, tiến độ % hoàn thành và thao tác phát hành sóng (`Released to Picker`).
- **Replenishment Task Engine**: Quản lý các lệnh bổ sung hàng từ kho lớn đến pick-face kèm trạng thái thực thi.
- **Bin Allocation Optimizer**: Đề xuất vị trí bin tối ưu cho sản phẩm mới nhập hoặc phân bổ.
- **LPN Container Tracking**: In tem mã thùng/pallet, kiểm soát trọng lượng và liên kết chứng từ SO.
- **Yard & Dock Scheduling**: Đăng ký slot thời gian cho xe tải, check-in tài xế tại cửa kho.
- **Carrier & Freight Billing**: Quản lý đối tác vận chuyển (J&T, DHL, VNPost), tính cước và dispatch vận đơn.

---

## 3. Rà Soát Giao Diện & Khắc Phục (UI Gap Analysis)
- **Vấn đề trước đó**: Trước khi rà soát, module M24 bị trỏ về `GenericModuleWorkspace` chung, dẫn đến việc các tính năng chuyên sâu (Wave, LPN, Dock) không hiển thị giao diện tương tác.
- **Giải pháp**: Xây dựng mới hoàn toàn component chuyên biệt `M24WMSExtendedWorkspace.tsx`, đăng ký route và đưa vào danh sách hiển thị độc lập tại `App.tsx`. Giao diện nay đã hiển thị đầy đủ 6 tab với các bảng dữ liệu, KPI sparklines và hộp thoại bảo mật `ConfirmDialog` (Rule #19).

---

## 4. Luồng Test Dữ Liệu Thực Tế (Test Scenario Execution)
1. **Bước 1 (Wave Picking)**: Khởi tạo sóng `WAVE-2026-001` cho Zone A gồm 14 đơn SO (52 lines). Bấm *"Phát Hành Sóng"* ➔ Hệ thống ghi nhận trạng thái `RELEASED_TO_PICKER` qua `ConfirmDialog`.
2. **Bước 2 (Replenishment)**: Kích hoạt lệnh bổ sung `REP-501` chuyển 120 đơn vị SKU-MED-001 từ `BULK-R01-B02` ra `PICK-FACE-A05`.
3. **Bước 3 (Packing LPN)**: Tạo thùng LPN `LPN-992810` (4.8 kg, Box Medium) gắn với SO-2026-0120 và in tem vạch thành công.
4. **Bước 4 (Dock Appointment)**: Đăng ký lịch xe tải Viettel Post vào `Cửa Nhận Hàng #1` khung giờ 08:00 - 09:30, thực hiện Check-in xe.
5. **Bước 5 (Carrier Freight)**: Dispatch vận đơn `WB-VN-882910` qua hãng J&T Express Pro với cước phí 350,000 VND.

---

## 5. Báo Cáo Kết Quả Thực Thi & Kiểm Thử Hệ Thống
- **Trạng Thái Biên Dịch**: `Build Succeeded` (Đã biên dịch thành công qua hệ thống esbuild/vite).
- **Tuân Thủ Tiêu Chuẩn**:
  - Tuyệt đối tuân thủ **Rule #19** (Sử dụng `ConfirmDialog.tsx` thay cho window.alert/confirm).
  - Định dạng font Monospace cho tất cả các dữ liệu số lượng, mã vận đơn, trọng lượng và thời gian.
  - Phân tách rõ ràng giữa tầng WMS Execution và Inventory Core Ledger.

---

## 6. Quy Trình Chuẩn Vận Hành (SOP) - Module M24
1. **Lập Kế Hoạch Sóng (Wave Planning)**: Quản lý kho gom các SO theo tuyến đường hoặc khu vực vào đầu ca làm việc.
2. **Bổ Sung Tồn Kho Tự Động**: Hệ thống cảnh báo tự động khi tồn kho pick-face chạm ngưỡng tối thiểu để thực hiện replenishment trước giờ cao điểm picking.
3. **Phân Bổ Vị Trí Thông Minh**: Đảm bảo hàng hóa mới nhập được gán vào các bin tối ưu theo vòng quay xuất hàng.
4. **Đóng Gói & Quản Lý LPN**: Mỗi kiện hàng xuất đi đều được gán mã LPN định danh duy nhất để kiểm soát tải trọng trước khi đưa ra khu vực xuất hàng (Shipping Bay).
5. **Quản Lý Cửa Kho & Vận Tải**: Điều phối xe tải ra vào đúng khung giờ đã đặt lịch, hoàn tất dispatch vận đơn trước khi bàn giao cho hãng vận chuyển.
