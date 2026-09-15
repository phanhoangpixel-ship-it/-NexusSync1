# QUY TRÌNH VẬN HÀNH TIÊU CHUẨN (SOP)
## M01 - Workspace Hub (Trung tâm Điều hành)

### 1. MỤC ĐÍCH
Quy trình này hướng dẫn người sử dụng cách xem, tra cứu và điều hướng thông qua bảng điều khiển trung tâm Workspace Hub (M01). Workspace Hub là trang đích mặc định của toàn bộ hệ thống giúp theo dõi bao quát các KPIs quan trọng và danh bạ của 40 phân hệ cốt lõi.

### 2. PHẠM VI ÁP DỤNG
Áp dụng cho mọi cấp độ nhân viên, đặc biệt là cấp Quản lý / Cấp quản trị (Admin) sử dụng hệ thống NexusSync ERP để đánh giá, theo dõi công việc chờ (SLA).

### 3. ĐỊNH NGHĨA & TỪ VIẾT TẮT
- **Workspace Hub:** **Workspace Hub là Enterprise Application Shell và điểm truy cập trung tâm của NexusSync ERP, cung cấp một không gian làm việc thống nhất để người dùng khám phá, điều hướng và truy cập các domain/module theo quyền RBAC. Workspace Hub quản lý navigation, workspace layout, global search, notification/task entry, user context và dashboard presentation; không sở hữu hoặc thực thi business logic, database transaction, inventory posting, costing, accounting, workflow hay các domain authority. Workspace Hub có thể được thay thế hoặc nâng cấp độc lập ở Presentation Layer mà không làm thay đổi Frozen Core và Business Contracts của các module.**
- **SLA (Service Level Agreement):** Mức độ cam kết dịch vụ; trong ngữ cảnh ERP chỉ các chứng từ/đơn hàng đang chờ xử lý theo giới hạn thời gian.
- **Hub:** Trung tâm điều hành.

### 3.5 NGUYÊN TẮC KIẾN TRÚC (ARCHITECTURE CONTRACT)
- **ROLE:** Enterprise Application Shell
- **AUTHORITY:** Presentation / Navigation only
- **OWNS:** Navigation, Workspace Layout, Module Discovery, User Context, Global Search, Notifications Presentation, Dashboard Presentation.
- **DOES NOT OWN:** Business Logic, Transactions, Database, Inventory, Accounting, Costing, Workflow, Master Data.
- **DEPENDENCY:** Consumes authoritative APIs only.
- **SECURITY:** RBAC-aware, but Backend remains security authority.
- **GOVERNANCE:** Presentation Layer only.
### 4. NỘI DUNG QUY TRÌNH
#### 4.1 Khởi động và Theo dõi KPIs tổng quan
- **Bước 1:** Đăng nhập vào hệ thống ERP. Trang mặc định khởi động là Workspace Hub (M01).
- **Bước 2:** Tại khu vực trên cùng (Hero Section), kiểm tra trạng thái chung của tổ chức, hệ thống.
- **Bước 3:** Đánh giá 4 chỉ số KPI quan trọng:
  - **Tác vụ hàng chờ SLA:** Số lượng công việc/đơn hàng/phiếu duyệt cần phải giải quyết khẩn cấp.
  - **Mặt hàng kiểm soát (SKU):** Số lượng vật tư, thành phẩm mà hệ thống quản lý.
  - **Phân hệ chuẩn hóa:** Tổng quan số lượng chức năng đang mở.
  - **Toàn vẹn sổ cái kép:** Thể hiện phần trăm đồng bộ của kế toán ACID (luôn phải 100%).

#### 4.2 Điều hướng và Chuyển đổi Phân hệ (Modules)
- **Bước 1:** Cuộn xuống khu vực "Các không gian làm việc chính" (Key Workspaces).
- **Bước 2:** Hệ thống đã tự động phân nhóm các chức năng thành những miền (Group) như: CORE, INVENTORY, SALES, FINANCE, v.v.
- **Bước 3:** Nhấp chuột (Click) trực tiếp vào Card của một Phân hệ để chuyển hướng nhanh đến Module làm việc đó mà không cần phải dùng đến Menu Sidebar bên trái.

#### 4.3 Quản lý Công việc Chờ (Work Queue)
- **Bước 1:** Ở khu vực bảng dưới cùng, hoặc bấm nút **"Xem hàng chờ SLA"** trên thanh tiêu đề, danh sách các công việc khẩn cấp (Urgent / Pending) sẽ hiển thị.
- **Bước 2:** Chọn công việc có thời hạn/độ ưu tiên cao (màu đỏ Urgent) để xử lý trước. Bấm vào mã nghiệp vụ để tiến hành xét duyệt (nếu có quyền hạn).

#### 4.4 Kết xuất Báo cáo nhanh (Xuất PDF)
- **Bước 1:** Bấm nút **"Xuất PDF"** nằm ở góc trên bên phải màn hình.
- **Bước 2:** Tùy chọn máy in ảo "Save as PDF" trong giao diện của trình duyệt để lưu màn hình theo dõi trạng thái dưới dạng báo cáo báo cáo cứng cho cuộc họp giao ban hàng ngày.

#### 4.5 Chuẩn Hóa Điều Hướng & Ngữ Cảnh Chuyển Tiếp (Deep Link Context Passing)
- **Quy tắc Single Source of Truth:**
  - **Quản lý Thẻ điểm Đối tác (SRM Evaluation):** Được hợp nhất trực tiếp tại Tab 'evaluation' của Phân hệ `M09 (Nhà cung cấp & SRM)`. Tự động nạp dữ liệu lũy tiến (Lazy Fetching) với Skeleton Loader và kiểm soát phân quyền cấp Tab (Tab-level RBAC: `M09_READ_ONLY` vs `M11_SCORECARD_MANAGE`).
  - **Điều chuyển Kho Nội bộ (Internal Transfer Orders):** Được quy chuẩn thực thi tại Phân hệ `M21 (Điều chuyển Kho)`. Phân hệ `M18 (Warehouse Management)` đóng vai trò Cockpit giám sát — khi người dùng kích hoạt "Chuyển kho tại M21", hệ thống tự động truyền ngữ cảnh (SKU, Số lượng, Vị trí Bin xuất, Vị trí Bin đích) và điền sẵn vào biểu mẫu tạo lệnh M21.

### 5. XỬ LÝ SỰ CỐ
- **Trường hợp KPI tải chậm:** Có thể do kết nối dữ liệu máy chủ đang trễ, hệ thống sẽ tự động cập nhật lại mỗi khi vào trang.
- **Không tìm thấy Module:** Dùng chức năng **Tìm kiếm nhanh (Ctrl+K)** trên thanh điều hướng để gõ tên hoặc mã module cần mở.
