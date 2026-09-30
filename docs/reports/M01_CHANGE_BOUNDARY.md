# M01 CHANGE CONTROL BOUNDARY
**Hệ thống:** NexusSync ERP — M01 Workspace Hub & Live API / Data Flow Observatory  
**Trạng thái:** **FROZEN PRODUCTION BASELINE**  
**Mã tài liệu:** `M01_CHANGE_BOUNDARY.md`  
**Ngày áp dụng:** 2026-09-29  

---

## 1. Phân loại Ranh giới Thay đổi (Change Classification)

### 1.1. FROZEN (Bất biến — Nghiêm cấm thay đổi không qua Change Request)
- **Kiến trúc luồng:** SVG 6 cột phân hệ + Client + DB Storage.
- **Hợp đồng API:** 11 endpoints đã chứng thực tại `M01_API_BASELINE.md`.
- **Mô hình sự cố & RCA:** Khuyến nghị chỉ đọc (Read-only advisory).
- **Thẩm quyền đơn nhất:** Tuyệt đối không can thiệp ghi dữ liệu nghiệp vụ của M17, M30, M41, M42.

### 1.2. CONTROLLED CHANGE (Thay đổi có kiểm soát)
- Sửa lỗi bảo mật (Security Patches).
- Tối ưu hiệu năng render SVG và vòng lặp requestAnimationFrame.
- Bổ sung chỉ số telemetry thụ động theo yêu cầu của hội đồng kiến trúc.

### 1.3. OUT OF SCOPE (Ngoài phạm vi M01)
- Tái cấu trúc cơ sở dữ liệu lõi của các phân hệ khác.
- Thay đổi chữ ký API nghiệp vụ của các domain service.

---

## 2. Quy trình Phê duyệt Thay đổi (Change Approval Gate)
Mọi thay đổi nhắm vào M01 bắt buộc phải đi qua quy trình 6 bước:
`CHANGE REQUEST ➔ IMPACT ANALYSIS ➔ AUDIT ➔ APPROVAL ➔ IMPLEMENTATION ➔ REGRESSION SUITE ➔ NEW BASELINE`.
