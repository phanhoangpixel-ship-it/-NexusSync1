# M36 LOGISTICS WORKSPACE — FEATURE BASELINE (TRƯỚC KHI ĐỒNG BỘ GIAO DIỆN)

**Document Reference:** `/docs/design-specs/m36_FEATURE_BASELINE_BEFORE_SYNC.md`  
**Governing Standard:** Rule #19 & Rule #20 (Phase -1 Inventory)  
**Tác giả:** Chuyên viên Lập trình Frontend Cấp cao — NexusSync ERP Team  
**Mục tiêu:** Ghi nhận toàn bộ tính năng, API endpoints, trạng thái, điều kiện RBAC/SoD và validation của phân hệ `m36` trước khi áp dụng giao diện chuẩn M19.

---

## 1. DANH SÁCH TAB VÀ API ENDPOINTS CỦA M36
| STT | Mã Tab | Tên Tab Hiển Thị | API Endpoints (Method + Path) | Chức Năng & Hành Động Chính |
|---|---|---|---|---|
| 1 | `dashboard` | Tổng Quan Vận Tải | `GET /api/logistics/kpi`, `GET /api/logistics/orders` | Hiển thị thẻ KPI tổng hợp xe, tài xế, chi phí vận tải, tỷ lệ giao đúng giờ (On-time %). |
| 2 | `planning` | Lập Kế Hoạch Vận Tải | `GET /api/logistics/orders`, `POST /api/logistics/orders` | Tạo mới đơn hàng vận tải (Transport Order), gán điểm đi/đến, khối lượng KG/CBM, chi phí cước. |
| 3 | `operations` | Điều Hành Chuyến & Giao Nhận (DO) | `GET /api/logistics/orders`, `POST /api/logistics/orders/:id/dispatch`, `POST /api/logistics/orders/:id/pod` | Quản lý DO (Delivery Order) liên kết M13/M17, thao tác Xuất bến (`handleDispatchDO`) và Ký nhận POD (`handleConfirmPOD`). |
| 4 | `fleet` | Quản Lý Phương Tiện | `GET /api/logistics/vehicles`, `POST /api/logistics/vehicles` | Quản lý danh sách xe, biển số, tải trọng, loại nhiên liệu, hạn đăng kiểm & bảo hiểm. |
| 5 | `drivers` | Tài Xế & Chấm Điểm An Toàn | `GET /api/logistics/drivers`, `GET /api/logistics/driver-safety-scores`, `POST /api/logistics/drivers` | Quản lý thông tin tài xế, bằng lái FC, chấm điểm an toàn lái xe (eco-stars, overspeed, hard braking). |
| 6 | `routes` | Tuyến Đường & Định Tuyến GPS | `GET /api/logistics/orders`, `POST /api/logistics/routes/simulate` | Mô phỏng hành trình xe theo GPS real-time, kiểm tra chặng đường và ETA. |
| 7 | `costs` | Chi Phí Nhiên Liệu & VETC | `GET /api/logistics/fuel-transactions`, `GET /api/logistics/vetc-transactions`, `POST /api/logistics/vetc-transactions/sync`, `POST /api/logistics/vetc-transactions/reconcile` | Quản lý giao dịch đổ dầu (`fuelTxs`), đồng bộ và đối soát tự động vé thu phí không dừng VETC/ePass. |
| 8 | `maintenance` | Bảo Dưỡng Phương Tiện | `GET /api/logistics/maintenance`, `POST /api/logistics/maintenance` | Lên lịch bảo trì định kỳ, gửi yêu cầu sang phân hệ Tài sản & Bảo trì (M38). |
| 9 | `analytics` | Báo Cáo Phân Tích Logistics | `GET /api/logistics/analytics`, `GET /api/logistics/kpi` | Biểu đồ chi phí cước phí, tỷ lệ hoàn thành đơn và phân tích hiệu suất vận tải. |

---

## 2. ĐIỀU KIỆN RBAC, VALIDATION VÀ HÀNH ĐỘNG NHẠY CẢM
1. **Xác nhận Xuất bến (`handleDispatchDO`)**: Yêu cầu xác nhận qua `ConfirmDialog`, cập nhật trạng thái đơn sang `IN_TRANSIT`.
2. **Xác nhận POD (`handleConfirmPOD`)**: Yêu cầu xác nhận qua `ConfirmDialog`, cập nhật trạng thái đơn sang `POD_CONFIRMED`, kích hoạt đồng bộ sang Phân hệ Kế toán (M31).
3. **Đồng bộ VETC (`handleSyncVetc`) & Đối soát VETC (`handleReconcileVetc`)**: Gọi API backend xử lý giao dịch điện tử.
4. **Validation**: Không cho phép tạo đơn hàng vận tải thiếu điểm đến hoặc khối lượng âm. Sử dụng toán tử `??` (nullish coalescing) cho mọi giá trị derived/tính động.
