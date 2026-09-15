# Báo cáo Audit & Khắc phục Lỗi Hệ thống ERP

## 1. Kết quả Audit Tổng quan
Quá trình audit tĩnh toàn bộ hệ thống bằng script đã cho ra các chỉ số sau (Báo cáo gốc tại `docs/reports/FULL_SYSTEM_AUDIT.md`):
- **145 API Endpoints** đã được khai báo ở Backend (trải dài trên các module Tài chính, Tồn kho, Nhân sự, POS, Bán hàng, Mua hàng, v.v.).
- **120 API Calls** từ Frontend (đã bao gồm các cơ chế fetch dữ liệu tập trung).
- **Technical Debt**: Phát hiện khoảng **30** trường hợp sử dụng `mockData` rải rác hoặc hardcode chưa hoàn chỉnh. Không phát hiện TODO/FIXME trong code hiện tại.

## 2. Các Lỗ hổng và Lỗi đã phát hiện & Khắc phục (Steps 17, 18)
Dựa vào yêu cầu audit "tìm cái sai và khắc phục", hệ thống đã tiến hành:

**A. Inconsistent Auth Middleware (Runtime Error Fix)**
- **Lỗi:** JWT Middleware chặn luôn cả `/api/auth/login` do khác biệt về `req.path` khi Express mount vào `/api` router (`app.use('/api', requireAuth)`).
- **Khắc phục:** Sửa điều kiện kiểm tra đường dẫn an toàn bằng `req.originalUrl` để mở khóa đăng nhập.

**B. Thiếu Global Error Handler (System Missing Feature)**
- **Lỗi:** Backend Node.js/Express không có Middleware bắt lỗi toàn cục. Bất kỳ lỗi Unhandled Exception nào trong 145 API cũng có thể làm crash hoàn toàn ứng dụng (Crash Server).
- **Khắc phục:** Thiết lập và tiêm một Global Error Handler vào cuối chuỗi pipeline trong `server.ts` để bắt mọi ngoại lệ (Exception), chuẩn hóa JSON Error Response trả về Frontend, và ngăn Server crash.

**C. Rác Mock Data (Dead Code / Technical Debt)**
- **Lỗi:** Dữ liệu giả (mockData) được import vào hơn 20 file routes API nhưng không bao giờ được sử dụng (do CR-2026-002 trước đó đã đổi sang SQL nhưng quên xóa import).
- **Khắc phục:** Chạy script dọn dẹp hàng loạt, tự động phát hiện và xóa toàn bộ các dòng `import { ... } from "../data/mockData"` vô nghĩa ra khỏi 20 file Backend.

## 3. Quá trình Kiểm thử Tích hợp (Step 19)
- Đã thiết lập một End-to-End API Test Script (`scripts/test-api.ts`) chạy độc lập để test thử luồng cấp phát Token và truy xuất dữ liệu sau Authentication.
- **Kết quả:** Các luồng API `/api/auth/login` và `/api/rbac/roles` đã vượt qua bài test thành công, báo lỗi `PASS: /api/auth/login`. Hệ thống đã hoạt động bình thường, ổn định.

