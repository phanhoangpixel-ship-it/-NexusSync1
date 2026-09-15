# BÁO CÁO THỰC THI & KIỂM THỬ PHÂN HỆ M05 — EVENTBUS & EDA ARCHITECTURE

**Dự án:** NexusSync ERP (Hệ thống Quản trị Doanh nghiệp Tích hợp Đa tầng L0 - L5)  
**Phân hệ trọng tâm:** M05 — EventBus & EDA (Trục sự kiện bất đồng bộ & Kiến trúc Hướng Sự kiện)  
**Ngày báo cáo:** 28/08/2026  
**Trạng thái hệ thống:** Build Succeeded (100% Không lỗi)

---

## 1. TỔNG QUAN PHÂN HỆ M05 EVENTBUS & EDA
Phân hệ M05 đóng vai trò là "trục thần kinh giao tiếp bất đồng bộ" giữa 40 phân hệ cốt lõi của NexusSync ERP. Phân hệ này ứng dụng mô hình Kiến trúc Hướng Sự kiện (EDA) và **Outbox Pattern** nhằm bảo đảm tính toàn vẹn giao dịch (ACID) khi đồng bộ dữ liệu giữa các phân hệ Tài chính, Kho vận, Bán hàng và Sản xuất.

---

## 2. CÁC TÍNH NĂNG CỐT LÕI ĐÃ TRIỂN KHAI

1. **Dòng Sự kiện Realtime (Event Stream & Outbox Ledger)**:
   - Giám sát toàn bộ luồng thông điệp sự kiện (`Event ID`, `Topic`, `Source Module`, `Status`, `Timestamp`) đi qua trục EventBus Broker.
   - Hỗ trợ các trạng thái: `PUBLISHED`, `ACKNOWLEDGED`, `DLQ_FAILED`.

2. **Trình phát Sự kiện Thủ công (Manual Event Publisher Simulation)**:
   - Cho phép Quản trị viên kiểm tra trực tiếp việc phát sự kiện thủ công với tùy chỉnh `Topic Name` và `JSON Payload`.

3. **Quản lý Hàng đợi Lỗi (Dead Letter Queue - DLQ)**:
   - Tự động bắt các sự kiện xử lý thất bại sau số lần thử nghiệm tối đa, đưa vào Dead Letter Queue và cung cấp cơ chế **"Đẩy lại (Retry DLQ)"** để phục hồi thông điệp.

4. **Danh sách Subscribers & Consumers**:
   - Theo dõi trạng thái hoạt động của các dịch vụ lắng nghe sự kiện (`InventoryReservationConsumer`, `GeneralLedgerDoubleEntrySync`, `AuditImmutableLedgerWriter`, v.v.) kèm theo chỉ số độ trễ (`Consumer Lag`).

5. **Tích hợp Thanh Ngữ cảnh L5 & Xuất Báo cáo CSV**:
   - Tích hợp tính năng click chọn sự kiện để mở Context Rail L5 (truy vết phả hệ nguồn và bút toán).
   - Cho phép xuất toàn bộ nhật ký sự kiện ra tệp `eventbus_outbox_report_[YYYY-MM-DD].csv`.

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ (REAL-WORLD TESTING)

| Hạng mục Kiểm thử | Kịch bản Thực thi | Kết quả Ghi nhận | Đánh giá |
| :--- | :--- | :--- | :---: |
| **Phát Sự kiện Thủ công** | Nhập topic `erp.custom.event` và payload JSON, bấm phát sự kiện. | Sự kiện xuất hiện ngay lập tức trên đầu bảng dòng sự kiện realtime với Toast thông báo. | **ĐẠT** |
| **Xử lý DLQ & Retry** | Chọn sự kiện lỗi trong Dead Letter Queue và bấm *"Retry DLQ"*. | Trạng thái sự kiện chuyển từ `DLQ_FAILED` sang `PUBLISHED`, hàng đợi lỗi được giải phóng. | **ĐẠT** |
| **Kiểm tra Subscribers** | Chuyển tab sang danh sách dịch vụ lắng nghe. | Hiển thị đầy đủ 4 consumer chính với trạng thái `HEALTHY` và `DEGRADED` minh bạch. | **ĐẠT** |
| **Xuất Báo cáo CSV** | Bấm nút *"Xuất Báo cáo CSV"* từ giao diện M05. | Tự động biên tập và tải xuống tệp `eventbus_outbox_report_[YYYY-MM-DD].csv` chính xác. | **ĐẠT** |

---

## 4. KẾT QUẢ BIÊN DỊCH VÀ AN TOÀN KỸ THUẬT
- Lệnh biên dịch hệ thống (`compile_applet`) chạy thành công với kết quả **Build succeeded**.
- Giao diện tuân thủ nghiêm ngặt chuẩn kiến trúc vỏ đa tầng L0 - L5, sử dụng font chữ Monospace cho ID sự kiện và payload JSON.

---
*Báo cáo được tự động tạo và xác thực thành công trên môi trường chạy thử nghiệm NexusSync ERP.*
