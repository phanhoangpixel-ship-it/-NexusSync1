# M18 WAREHOUSE MANAGEMENT HUB — BẢNG KIỂM KÊ TÍNH NĂNG THIẾT KẾ VÀ HIỆN TRẠNG API
## Tài liệu Nghiệm thu & Kiểm kê Hiện trạng Module M18 (Phase 1 Inventory)
**Mã phân hệ:** M18 (WMS-MASTER-05)  
**Tên phân hệ:** Warehouse Management Hub (Quản Trị Kho Vận & Cấu Trúc Không Gian Kho)  
**Thời gian kiểm kê:** 2026-09-15  
**Quy chuẩn kiến trúc:** Tuân thủ 20 nguyên tắc vàng GEMINI ERP & Chuẩn UI/UX L0-L4 Enterprise.

---

## 1. BẢNG KIỂM KÊ CHI TIẾT TỪNG TAB / MÀN HÌNH CỦA M18

| Tab/Màn hình | Tính năng/Widget | Trạng thái | API liên kết | Bảng DB liên quan | Vai trò nghiệp vụ |
|---|---|---|---|---|---|
| **Tab A: Warehouse Setup** | 1. Dashboard 6 KPI Metrics tổng thể kho | Hoạt động đầy đủ | `GET /api/inventory/warehouses/metrics` | `warehouses`, `warehouse_locations`, `stock_balances` | Giám sát tổng quan số kho, vị trí, tồn vật lý, giữ chỗ, ATP và giá trị định giá tồn kho |
| **Tab A: Warehouse Setup** | 2. Danh sách cơ sở kho (Data Grid & Bộ lọc) | Hoạt động đầy đủ | `GET /api/warehouses`, `GET /api/inventory/balances` | `warehouses`, `stock_balances` | Xem danh sách kho, trạng thái hoạt động, địa chỉ, quản lý, sức chứa diện tích |
| **Tab A: Warehouse Setup** | 3. Thêm mới / Cập nhật Cơ sở kho (Modal CRUD) | Hoạt động đầy đủ | `POST /api/warehouses`, `PUT /api/warehouses/:id` | `warehouses` | Khởi tạo kho mới (Kho chính, Chi nhánh, Kho lạnh, Trung chuyển) hoặc sửa thông tin |
| **Tab A: Warehouse Setup** | 4. Khóa / Mở khóa hoạt động cơ sở kho | Hoạt động đầy đủ | `POST /api/warehouses/:id/toggle-status` | `warehouses` | Khóa kho khi bảo trì/kiểm kê hoặc kích hoạt mở kho tiếp nhận hàng hóa |
| **Tab A: Warehouse Setup** | 5. Xuất báo cáo danh mục kho ra Excel | Hoạt động đầy đủ | Local Export (XLSX Engine) | `warehouses` | Xuất file bảng tính Excel đầy đủ chỉ số phục vụ kiểm toán và quản trị |
| **Tab A: Warehouse Setup** | 6. Xem Drawer chi tiết 360° cơ sở kho | Hoạt động đầy đủ | `GET /api/warehouses/:id` | `warehouses`, `warehouse_locations` | Xem chi tiết thông số vận hành, trưởng kho, hotline, tỷ lệ lấp đầy kho |
| **Tab A: Warehouse Setup** | 7. In tem mã vạch QR Code cơ sở kho | Hoạt động đầy đủ | Client QR Generator | `warehouses` | Tạo và in tem QR định danh cho cửa kho / khu tiếp nhận |
| **Tab A: Warehouse Setup** | 8. Quản lý cây phân cấp không gian (Zone → Aisle → Rack → Bin) | UI có nhưng thiếu API | `GET /api/warehouse-locations` (Chỉ GET, thiếu CRUD & Tree API) | `warehouse_locations` | Cấu hình mạng lưới vị trí vật lý chi tiết từng cấp không gian kho |
| **Tab A: Warehouse Setup** | 9. Phân loại đặc tính vật lý Zone (Lạnh, Khô, Cồng kềnh, QC) | Thiếu hẳn | Chưa có API cập nhật zone_type & dải nhiệt độ | `warehouse_locations` | Quy định điều kiện bảo quản nhiệt độ, độ ẩm và đặc thù cho từng Zone |
| **Tab A: Warehouse Setup** | 10. Giới hạn tải trọng & Cảnh báo quá tải (Weight Capacity) | Thiếu hẳn | Chưa có API kiểm tra & giới hạn kg cho Rack/Bin | `warehouse_locations` | Khai báo tải trọng tối đa, tính tải trọng hiện tại, chặn xếp quá tải trọng an toàn |
| **Tab A: Warehouse Setup** | 11. Gán hàng & Kiểm tra tương thích Zone (Zone Compatibility) | Thiếu hẳn | Chưa có API validate điều kiện hàng ↔ Zone | `warehouse_locations`, `products` | Chặn xếp hàng lạnh vào Zone khô, hàng cồng kềnh vào kệ nhỏ |
| **Tab B: Inbound 3-Way Match** | 12. Danh sách chứng từ tiếp nhận hàng Inbound | Hoạt động đầy đủ | `GET /api/inventory/inbound-receipts` | `stock_transfers`, `stock_ledger` | Quản lý lệnh nhập kho từ Nhà cung cấp / Điều chuyển nội bộ |
| **Tab B: Inbound 3-Way Match** | 13. Đối soát 3-Way Match (Hóa đơn - PO - Thực nhận) | Hoạt động đầy đủ | `POST /api/inventory/3way-match` | `purchase_orders`, `invoices`, `stock_ledger` | Khớp nối dữ liệu số lượng, đơn giá, thuế VAT giữa PO, HĐĐT và Biên bản kiểm nhận |
| **Tab B: Inbound 3-Way Match** | 14. Kiểm tra chất lượng KCS / IQC tiếp nhận | Hoạt động đầy đủ | `POST /api/inventory/iqc-inspect` | `warehouse_locations`, `stock_ledger` | Ghi nhận đạt chuẩn, phân luồng hàng lỗi sang khu vực cách ly (Quarantine Zone) |
| **Tab B: Inbound 3-Way Match** | 15. Ma trận xếp dỡ Putaway vào Bin vị trí | UI có nhưng thiếu API | `GET /api/warehouse-locations` | `warehouse_locations` | Đề xuất và chỉ định Bin lưu trữ tối ưu theo loại hàng và lộ trình di chuyển |
| **Tab C: Outbound Fulfillment** | 16. Danh sách lệnh xuất kho & Điều phối giao vận | Hoạt động đầy đủ | `GET /api/sales-orders`, `GET /api/stock-transfers` | `sales_orders`, `stock_ledger` | Quản lý toàn bộ yêu cầu xuất hàng bán và xuất chuyển kho |
| **Tab C: Outbound Fulfillment** | 17. Gom đơn nhặt hàng hàng loạt (Wave Picking Engine) | Hoạt động đầy đủ | `POST /api/inventory/wave-pick` | `warehouse_locations`, `stock_balances` | Gom nhiều đơn hàng cùng tuyến/cùng Zone để tối ưu hóa quãng đường nhặt hàng |
| **Tab C: Outbound Fulfillment** | 18. Đóng gói kiện hàng & Niêm phong Seal (Packing Cartons) | Hoạt động đầy đủ | `POST /api/inventory/pack-carton` | `stock_ledger` | Đóng thùng carton, cân tải trọng, dán nhãn vận đơn 3PL và niêm phong số seal |
| **Tab C: Outbound Fulfillment** | 19. Bàn giao vận chuyển 3PL & Xuất kho vật lý | Hoạt động đầy đủ | `POST /api/inventory/dispatch` | `stock_ledger`, `accounting_entries` | Ghi giảm tồn vật lý qua `InventoryService.postTransaction()` và hạch toán giá vốn |
| **Tab D: Internal Operations** | 20. Bổ sung kệ lấy hàng mặt tiền (Replenishment Pick Face) | Hoạt động đầy đủ | `POST /api/inventory/replenish-task` | `stock_balances`, `warehouse_locations` | Điều chuyển hàng từ khu lưu trữ bulk tầng cao xuống vị trí pick nhanh tầng trệt |
| **Tab D: Internal Operations** | 21. Tái cấu trúc sắp xếp kho theo ABC (Re-slotting) | Hoạt động đầy đủ | `POST /api/inventory/reslotting-task` | `warehouse_locations` | Tái phân bổ hàng nhóm A bán chạy ra gần cửa xuất, nhóm C vào sâu |
| **Tab D: Internal Operations** | 22. Chuyển vị trí Bin nội bộ (Bin-to-Bin Transfer) | Hoạt động đầy đủ | `POST /api/inventory/bin-transfer` | `stock_balances`, `stock_ledger` | Di chuyển lô hàng giữa các Bin trong cùng một kho |
| **Tab E: Inventory Control** | 23. Quản lý ngưỡng Min/Max & Điểm đặt hàng lại (ROP) | Hoạt động đầy đủ | `GET /api/inventory/reorder-alerts` | `products`, `suppliers` | Tự động tính toán điểm đặt hàng lại và cảnh báo hết hàng/tồn vượt trần |
| **Tab E: Inventory Control** | 24. Đề xuất tạo đơn mua hàng 1-Click tự động | Hoạt động đầy đủ | `POST /api/inventory/auto-reorder` | `purchase_orders`, `suppliers` | Tạo nhanh dự thảo PO từ danh sách mặt hàng chạm ngưỡng tồn an toàn |
| **Tab E: Inventory Control** | 25. Phân tích tuổi hàng & Hàng chậm luân chuyển (Aging) | Hoạt động đầy đủ | `GET /api/inventory/aging-report` | `stock_ledger`, `stock_balances` | Báo cáo các lô hàng lưu kho >90 ngày, >180 ngày để có chính sách giải phóng |
| **Tab F: Traceability** | 26. Quản lý vòng đời Lot/Batch & Hạn sử dụng (FEFO) | Hoạt động đầy đủ | `GET /api/inventory/traceability` | `stock_ledger`, `product_lots` | Truy xuất nguồn gốc xuất xứ từng lô hàng từ lúc nhập PO đến khách hàng cuối |
| **Tab F: Traceability** | 27. Quản lý Serial / IMEI từng cá thể sản phẩm | Hoạt động đầy đủ | `GET /api/inventory/traceability/serials` | `stock_ledger`, `product_serials` | Theo dõi trạng thái bảo hành, vị trí Bin hiện tại của từng Serial thiết bị |
| **Tab F: Traceability** | 28. Cách ly lô hàng lỗi & Mở khóa cách ly (Quarantine) | Hoạt động đầy đủ | `POST /api/inventory/lots/quarantine` | `product_lots`, `stock_balances` | Chặn xuất các lô hàng hỏng/chờ kiểm nghiệm KCS tái thẩm |
| **Tab G: Warehouse Analytics** | 29. Bản đồ nhiệt lấp đầy kho (Occupancy Heatmap Visual) | Hoạt động đầy đủ | `GET /api/inventory/warehouse-heatmap` | `warehouse_locations`, `stock_balances` | Biểu đồ trực quan mật độ lưu trữ từng Zone/Rack theo thời gian thực |
| **Tab G: Warehouse Analytics** | 30. Phân tích Pareto ABC & Tốc độ luân chuyển (Velocity) | Hoạt động đầy đủ | `GET /api/inventory/abc-analysis` | `stock_ledger`, `products` | Phân loại hàng hóa theo doanh số/sản lượng để tối ưu hóa không gian lưu trữ |

---

## 2. ĐÁNH GIÁ 6 NHÓM TÍNH NĂNG CỐT LÕI VỀ CẤU TRÚC KHÔNG GIAN KHO

Dựa trên yêu cầu nghiệp vụ chuyên sâu của M18, kết quả đánh giá 6 tính năng cốt lõi như sau:

| STT | Nhóm tính năng cốt lõi | Hiện trạng chi tiết | Trạng thái | Đánh giá rủi ro |
|---|---|---|---|---|
| **1** | **Cấu trúc phân cấp không gian**<br>(Warehouse → Zone → Aisle → Rack → Bin) | Hệ thống đã có bảng `warehouses` và bảng `warehouse_locations` có cột `parentId`. Tuy nhiên backend mới chỉ cung cấp `GET /api/warehouse-locations` phẳng, chưa có bộ API CRUD phân cấp cây (Tree Hierarchy API) và UI chưa hiển thị tương tác chi tiết 5 cấp cha-con. | **UI có nhưng thiếu API** | Trung bình: Chưa thể cấu hình dãy Aisle / Kệ Rack / Ô Bin trực tiếp từ giao diện. |
| **2** | **Phân loại Zone theo đặc tính vật lý**<br>(Lạnh, Khô, Cồng kềnh, Cách ly QC) | Bảng `warehouses` có cột `type` (MAIN, COLD, TRANSIT), nhưng bảng `warehouse_locations` thiếu cột `zoneType` (COLD, DRY, BULKY, QUARANTINE) và các thuộc tính vi khí hậu (nhiệt độ min/max, độ ẩm). | **Thiếu hẳn** | Cao: Không phân biệt được các khu vực có yêu cầu bảo quản đặc biệt trong cùng một kho. |
| **3** | **Giới hạn tải trọng & Cảnh báo quá tải**<br>(Weight Capacity Enforcement) | Bảng `warehouse_locations` chỉ có trường `capacity` chung chung, chưa có `maxWeightCapacity` (kg), `currentWeight` (kg), `maxVolumeCapacity` (m³), `currentVolume` (m³). Chưa có cơ chế phát hiện và chặn xếp quá tải trọng. | **Thiếu hẳn** | **CỰC KỲ NGUY HIỂM**: Có thể gây sập giá kệ, tai nạn lao động và hư hại tài sản trong thực tế nếu không có kiểm soát tải trọng. |
| **4** | **Gán hàng & Ràng buộc phù hợp Zone**<br>(Bin Assignment & Zone Compatibility) | Chưa có logic kiểm tra điều kiện bảo quản của sản phẩm (`products.storageCondition`) so với đặc tính Zone (`locations.zoneType`). Hàng cần bảo quản lạnh vẫn có thể bị gán nhầm vào Zone Khô. | **Thiếu hẳn** | **RẤT CAO**: Gây hỏng hàng hóa nhạy cảm nhiệt độ (dược phẩm, thực phẩm, linh kiện điện tử). |
| **5** | **Barcode / QR vị trí Bin** | Đã có QR code ở cấp Kho cơ sở, nhưng ở cấp chi tiết Bin (`BIN-A01-R02-S03`) chưa có mã barcode chuẩn hóa và API tra cứu nhanh vị trí bằng đầu đọc barcode/scanner. | **UI có nhưng thiếu API** | Trung bình: Thủ kho phải nhập tay mã Bin thay vì quét tem nhãn tại vị trí kệ. |
| **6** | **Sức chứa còn trống Real-time**<br>(Available Capacity Real-Time) | Đang tính toán tỷ lệ lấp đầy tổng thể ở cấp Kho qua `/api/inventory/warehouses/metrics`, chưa tính được tải trọng và thể tích còn trống chi tiết theo từng Zone, Aisle, Rack và Bin. | **UI có nhưng thiếu API** | Cao: Khó điều phối xếp dỡ chính xác khi nhập lô hàng lớn. |

---

## 3. KẾT LUẬN KIỂM KÊ

- Toàn bộ 7 Tab chức năng chính của M18 đã được thiết kế khung giao diện và đồng bộ luồng nghiệp vụ.
- Tuy nhiên, phần **Cấu trúc không gian kho & An toàn tải trọng vật lý (Weight Capacity & Zone Compatibility)** là lỗ hổng nghiệp vụ quan trọng nhất cần được hoàn thiện và kết nối API thực tế ngay lập tức.
