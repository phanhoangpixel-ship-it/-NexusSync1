# M01 WORKSPACE HUB — FEATURE BASELINE BEFORE SYNC (PHASE -1)
**Document Reference:** `/docs/design-specs/M01_FEATURE_BASELINE_BEFORE_SYNC.md`  
**Standard Governed:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Replication Protocol)  
**Target Workspace:** M01 - Workspace Hub (Trung Tâm Điều Hành Doanh Nghiệp)  
**Baseline Date:** 2026-09-11  
**Status:** VALIDATED & FROZEN BEFORE REPLICATION  

---

## 1. TỔNG QUAN PHÂN HỆ M01 TRƯỚC ĐỒNG BỘ

Module M01 (Workspace Hub) là Enterprise Application Shell và điểm truy cập trung tâm của hệ thống NexusSync ERP. M01 đóng vai trò là "Cockpit & Command Center" giúp người dùng:
1. Bao quát toàn bộ 41 phân hệ ERP chuẩn hóa theo 6 khối chuỗi giá trị.
2. Quản lý và xử lý nhanh hàng đợi phê duyệt chứng từ khẩn cấp (SLA Work Items).
3. Theo dõi các chỉ số KPI hiệu suất điều hành (Doanh số, Tồn kho, SLA, Thời gian xử lý trung bình theo vai trò).
4. Điều hướng nhanh thông qua Omnibar (`Ctrl+K`), Intent Bar, và Trung tâm hướng dẫn nghiệp vụ (Business GPS, Academy, Glossary, Decision Assistant).

File mã nguồn chính trước đồng bộ:
- `/src/components/workspaces/WorkspaceHub.tsx`
- `/src/components/workspaces/DashboardStats.tsx`

---

## 2. BẢNG KIỂM KÊ CÁC TAB / KHỐI CHỨC NĂNG CỦA M01

| STT | Khối Chức Năng / Tab | Component / Section | API Endpoint Gọi | Hành Động Người Dùng | Điều Kiện Hiển Thị (RBAC / Trạng Thái) | Validation & Cảnh Báo Code Cứng |
|---|---|---|---|---|---|---|
| 1 | **L0 Header & Global Search** | `WorkspaceHub.tsx` (lines 615-666) | Không có API trực tiếp | - Bấm ô tìm kiếm Omnibar hoặc nhấn phím tắt `Ctrl+K` -> Kích hoạt `onOpenOmnibar()`.<br>- Bấm nút "Tùy chỉnh Dashboard" -> Mở modal tùy biến `setIsCustomizeOpen(true)`. | - Hiển thị `currentUser.username`.<br>- Hiển thị `activeProfileName`, `activeProfileDesc` nếu được truyền vào. | Không có |
| 2 | **Cross-Cutting ERP Intent Bar** | `<IntentBar />` (lines 668-677) | Nội bộ `IntentBar` | - Nhập truy vấn tìm kiếm intent.<br>- Bấm chọn hành động nghiệp vụ (Tạo PO, Tạo SO, Nhập kho...) -> Kích hoạt `onNavigateToModule(modId)`. | Hiển thị intent theo quyền hạn của `currentUser.role` và `permissions`. | Kiểm tra chuỗi rỗng khi gõ tìm kiếm |
| 3 | **Guided Workflow Launch Center** | `WorkspaceHub.tsx` (lines 680-791) | Không có API trực tiếp | - Bấm Card 1: Trợ Lý Định Tuyến -> Gọi `onOpenDecisionAssistant()`.<br>- Bấm Card 2: Next Best Action & GPS -> Gọi `onOpenGuidance()`.<br>- Bấm Card 3: Học Viện ERP 12 Chu Trình -> Gọi `onOpenAcademy()`.<br>- Bấm Card 4: Từ Điển Thuật Ngữ -> Gọi `onOpenGlossary()`. | Luôn hiển thị ở trung tâm điều hành | 4 thẻ cố định tương ứng 4 công cụ hỗ trợ |
| 4 | **Thống Kê Hiệu Suất (Dashboard Stats)** | `DashboardStats.tsx` (Widget ID: `dashboard_stats`) | `GET /api/workspace/work-items?role=${role}` (truyền qua props) | - Bấm nút "Tác vụ chờ (N)" -> Gọi `onOpenWorkQueue()`.<br>- Bấm Card Phê duyệt -> Gọi `onOpenWorkQueue()`.<br>- Bấm Card Cảnh báo Tồn kho -> Gọi `onSelectModule('M17')`.<br>- Bấm Card Doanh số Hôm nay -> Gọi `onSelectModule('M13')`.<br>- Bấm Card Tổng tác vụ hoàn thành -> Gọi `onOpenWorkQueue()`. | - Hiển thị theo độ giãn cách `density` ('cozy', 'compact', 'spaced').<br>- Số lượng tính từ mảng `workItems`. | - Code cứng 7 SKU cảnh báo tồn kho, 2 mã hết hàng.<br>- Doanh số hôm nay: 486.25 M VND (+18.4%).<br>- Hoàn thành: 1.428 phiếu (+12.5%).<br>- 5 vai trò xử lý: Admin (11.4p), CFO (18.2p), WMS (8.5p), SRM (14.1p), Sales (9.3p). |
| 5 | **Chỉ Số KPI Cốt Lõi (KPI Metrics)** | `WorkspaceHub.tsx` (lines 242-289) (Widget ID: `kpi_metrics`) | `GET /api/workspace/work-items?role=${role}` (sử dụng `workItems.length`) | Xem các chỉ số KPI tĩnh & động | Hiển thị khi widget `kpi_metrics` có `enabled: true`. | - **LỖI TRÙNG LẶP (Bug 2):** Trùng lặp chỉ số tác vụ chờ duyệt với widget `dashboard_stats`.<br>- Doanh thu tháng: 14.82 B VND.<br>- Giá trị tồn kho: 42.5 B VND.<br>- Trạng thái hệ thống: 99.99%. |
| 6 | **Luồng Giá Trị Doanh Nghiệp (Value Stream)** | `WorkspaceHub.tsx` (lines 291-335) (Widget ID: `value_stream`) | Không có | Bấm chọn từng node (Leads M12 -> SO M13 -> Pick M17 -> Logistics M36 -> AR M31) -> Điều hướng tới Module tương ứng qua `onSelectModule()`. | Lọc các node phân hệ theo `isModuleAllowed(node.mod)`. | Chuỗi 5 phân hệ tuần tự tạo giá trị |
| 7 | **Không Gian Làm Việc Ưu Tiên (Priority Workspaces)** | `WorkspaceHub.tsx` (lines 337-376) (Widget ID: `priority_workspaces`) | Không có | Bấm vào Card phân hệ ưu tiên -> Điều hướng tới Module tương ứng qua `onSelectModule()`. | - Lọc theo `isModuleAllowed(ws.moduleId)`.<br>- Sắp xếp ưu tiên: đưa các workspace phù hợp với `userRole` lên đầu.<br>- 4 vị trí đầu tiên được gắn ghim (isPinned). | 11 phân hệ cơ sở (`BASE_WORKSPACES`) |
| 8 | **Hộp Thư Tác Vụ Chờ Duyệt (Action Inbox)** | `WorkspaceHub.tsx` (lines 378-512) (Widget ID: `action_inbox`) | - `GET /api/workspace/work-items?role=${role}`<br>- `POST /api/workspace/work-items/${id}/action` (body: `{ userId, actionType: 'approve' \| 'reject' }`) | - Bấm nút lọc "Tất cả", "Khẩn cấp", "Quan trọng".<br>- Bấm "Xem hàng đợi" -> Gọi `onOpenWorkQueue()`.<br>- Bấm nút "Phê duyệt" -> Mở `ConfirmDialog` -> Gửi POST duyệt.<br>- Bấm nút "Từ chối" -> Mở `ConfirmDialog` -> Gửi POST từ chối.<br>- Cập nhật lạc quan (Optimistic Update) loại bỏ item khỏi danh sách sau khi xử lý. | - Lọc các item theo phân hệ người dùng được phép truy cập (`isModuleAllowed(item.sourceModule)`).<br>- Lọc theo pill `inboxFilter` ('ALL' \| 'URGENT' \| 'HIGH'). | - Khống chế hiển thị tối đa 6 tác vụ đầu tiên (`slice(0, 6)`).<br>- Hiển thị khung rỗng khi không có tác vụ nào khớp bộ lọc. |
| 9 | **Ma Trận Phân Hệ Nghiệp Vụ (Capability Matrix)** | `WorkspaceHub.tsx` (lines 514-600) (Widget ID: `capability_matrix`) | Nạp từ `MODULE_REGISTRY` | Bấm chọn bất kỳ phân hệ nào trong 41 modules -> Điều hướng tới Module qua `onSelectModule(mod)`. | - Phân nhóm thành 6 khối.<br>- Nút bị vô hiệu hóa (disabled, gắn nhãn "Khóa") nếu người dùng không có quyền (`!isModuleAllowed(mod.moduleId)`). | 41 phân hệ ERP đăng ký trong hệ thống |
| 10 | **Tùy Chỉnh Bố Cục Dashboard (Customize Modal)** | `WorkspaceHub.tsx` (lines 834-916) | Đọc/Ghi `localStorage('nexus_hub_widgets')` | - Bấm icon mũi tên lên/xuống (`moveWidget`) để thay đổi thứ tự widget.<br>- Bấm nút toggle "Đang hiện" / "Đã ẩn" (`toggleWidget`) để bật tắt widget.<br>- Bấm nút "Xác nhận lưu" hoặc icon đóng (X) -> Đóng modal và ghi vào `localStorage`. | Mở khi `isCustomizeOpen === true`. | 6 widget cấu hình danh sách cố định |
| 11 | **Kéo Thả Sắp Xếp Dashboard (Drag & Drop)** | `WorkspaceHub.tsx` (lines 139-165, 793-831) | Đọc/Ghi `localStorage('nexus_hub_widgets')` | - Giữ chuột và kéo grip handle trên góc phải widget (`handleDragStart`).<br>- Thả vào widget đích (`handleDrop`).<br>- Tự động hoán đổi vị trí và ghi vào `localStorage`. | Chỉ hoạt động trên các widget đang `enabled === true`. | Thứ tự `order` từ 1 đến 6 |

---

## 3. BẰNG CHỨNG THỰC THI END-TO-END TRƯỚC KHI THAY ĐỔI

### 3.1 Kiểm tra API `GET /api/workspace/work-items?role=SUPER_ADMIN`
- **Lệnh thực thi:**
  ```bash
  curl -s "http://localhost:3000/api/workspace/work-items?role=SUPER_ADMIN"
  ```
- **Kết quả HTTP 200 trả về:** 6 đối tượng tác vụ chờ xử lý:
  1. `WI-001`: PO-2026-001 (M08 Procurement) - 850.000.000 VND - Priority: HIGH
  2. `WI-002`: SA-2026-042 (M17 Inventory) - Chênh lệch kiểm kê - Priority: URGENT
  3. `WI-003`: DSP-2026-088 (M25 Dispatch) - Điều phối xe - Priority: HIGH
  4. `WI-004`: MWO-2026-015 (M27 Maintenance) - Máy dập CNC 03 - Priority: URGENT
  5. `WI-005`: WO-2026-0045 (M18 Manufacturing) - Lô #45 - Priority: MEDIUM
  6. `WI-006`: INV-2026-092 (M31 Invoices) - 185.000.000 VND - Priority: HIGH

### 3.2 Kiểm tra API `POST /api/workspace/work-items/:id/action`
- **Lệnh thực thi:**
  ```bash
  curl -s -X POST "http://localhost:3000/api/workspace/work-items/WI-001/action" \
    -H "Content-Type: application/json" \
    -d '{"userId":"TEST_ADMIN","actionType":"approve"}'
  ```
- **Kết quả HTTP 200:**
  ```json
  {"success":true,"message":"Thực thi thành công cho WI-001"}
  ```

### 3.3 Đánh giá Tuân thủ Quy chuẩn Giao diện Hiện Tại
1. **Rule #19 (ConfirmDialog):** Đã có ConfirmDialog cho `handleQuickAction`, tuy nhiên chưa áp dụng toàn diện cho các thao tác Reset/Save bố cục.
2. **WCAG AA Contrast & Dark Mode:**
   - Hoàn toàn thiếu các lớp `dark:*` trong `WorkspaceHub.tsx` và `DashboardStats.tsx`. Khi bật Dark Mode, văn bản trong các card có thể bị chìm màu hoặc viền mờ.
   - Bảng màu chữ text-slate-900 trên nền tối gây khó đọc.
3. **Hiển thị Trùng Lặp (Bug 2):**
   - Tồn tại 2 dải KPI cạnh nhau: Widget `dashboard_stats` và Widget `kpi_metrics` đều hiển thị card "Tác vụ chờ duyệt / Phê duyệt chờ xử lý".
4. **Định dạng Số liệu & Phân Cách Hàng Nghìn (Bug 3):**
   - Tiền tệ hiển thị dạng "14.82 B VND", "486.25 M VND" chưa chuẩn hóa hoàn toàn theo định dạng số thực tế với dấu `.` phân cách hàng nghìn.

---
**KẾT LUẬN PHASE -1:** Toàn bộ 11 chức năng nghiệp vụ, API, luồng xử lý và dữ liệu của M01 đã được ghi nhận đầy đủ làm căn cứ đối chiếu, đảm bảo không có bất kỳ tính năng nào bị thất thoát trong quá trình đồng bộ giao diện M19 sang M01.
