# NEXUSSYNC ERP — PHASE 25.2 CONTROLLED CHANGE PIPELINE & GOVERNANCE FRAMEWORK

**Hệ thống:** NexusSync Enterprise ERP  
**Giai đoạn:** Phase 25.2 - Controlled Change Pipeline & Governance Framework  
**Ngày thiết lập:** 27/08/2026  
**Trạng thái Baseline:** UI Baseline 1.0 (Frozen), ERP Frozen Core (Intact), Production Live.

---

## 1. TỔNG QUAN & MỤC TIÊU PHASE 25.2

Nhằm tối ưu hóa quy trình vận hành và bảo trì hệ thống NexusSync ERP sau khi đã đi vào hoạt động chính thức (Production), Phase 25.2 chính thức thiết lập **Cơ chế Đường ống Thay đổi Kiểm soát (Controlled Change Pipeline)**. 

Thay vì thực hiện kiểm định toàn bộ hệ thống (40 modules) mỗi khi có yêu cầu thay đổi hoặc sửa lỗi nhỏ, quy trình mới định hướng thực hiện phân tích tác động cục bộ (Targeted Impact Analysis) dựa trên Code Graph, Fix Memory và Frozen Core Invariant Checks.

---

## 2. NĂM TRỤ CỘT KIỂM SOÁT THAY ĐỔI (5 CORE PILLARS)

### 2.1. Change Request Registry (Sổ đăng ký Yêu cầu Thay đổi)
Mọi yêu cầu chỉnh sửa, bổ sung tính năng hoặc vá lỗi bắt buộc phải được ghi nhận mã định danh dạng `CR-YYYY-XXX`.
- **Cấu trúc bản ghi:**
  - `CR_ID`, `Title`, `Requestor`, `Priority`, `Target Modules`, `Status (DRAFT / ANALYZING / APPROVED / IMPLEMENTED / RELEASED)`.
  - Vị trí lưu trữ: `/docs/reports/change-registry/`.

### 2.2. Impact Analysis Engine (Công cụ Phân tích Tác động)
Sử dụng Code Graph để khoanh vùng chính xác các thành phần bị ảnh hưởng khi có yêu cầu thay đổi:
```text
Change Request → Affected Modules → Affected Files → Affected APIs → Affected DB Tables → Core Invariant Check
```
- **Quy tắc:** Nếu thay đổi chạm đến Frozen Core (`InventoryService`, Costing Engine, Accounting GL), bắt buộc phải có sự phê duyệt của Kiến trúc sư trưởng (Principal ERP Architect).

### 2.3. Targeted Regression Matrix (Ma trận Kiểm thử Khoanh vùng)
Thay vì chạy lại toàn bộ 160 features, ma trận kiểm thử được cấu hình tự động theo vùng tác động:
- **UI-only Change:** Chỉ chạy regression component UI, route tương ứng và API liên quan trực tiếp.
- **Inventory Change:** Chạy regression luồng `InventoryService.postTransaction()`, kiểm tra 3 trạng thái tồn kho (Physical, Reserved, Available) và Sổ cái GL.
- **Accounting Change:** Chạy regression hạch toán bút toán kép (Double-Entry GL) và cân đối Nợ = Có.

### 2.4. Fix Memory System (Hệ thống Ký ức Lỗi)
Lưu trữ toàn bộ hồ sơ xử lý sự cố và vá lỗi trước đó để tránh lặp lại lỗi và cung cấp ngữ cảnh cho AI/Lập trình viên:
- **Cấu trúc tệp:** `/docs/reports/fix-memory/FIX-MEM-XXX.md`
- **Nội dung:** Nguyên nhân gốc rễ (Root Cause), File thay đổi, API ảnh hưởng, Invariant liên quan, và Mã kiểm thử hồi quy (Regression Test).

### 2.5. Release Governance (Quản lý Phiên bản & Rollback)
- Quản lý phiên bản SemVer (`v1.0.x`) cho từng thay đổi nhỏ.
- Quy trình Rollback tự động chuyển về artifact phiên bản trước đó (`Release N-1`) nếu phát hiện lỗi nghiêm trọng trên Staging hoặc Production.

---

## 3. LUỒNG XỬ LÝ THAY ĐỔI CHUẨN (CONTROLLED CHANGE PIPELINE)

```text
YÊU CẦU THAY ĐỔI
       ↓
CHANGE REQUEST (CR Registry)
       ↓
CODE GRAPH IMPACT ANALYSIS
       ↓
FIX MEMORY CHECK (Kiểm tra lịch sử lỗi liên quan)
       ↓
ĐÁNH GIÁ VÙNG ẢNH HƯỞNG (Modules, Files, APIs, DB Tables)
       ↓
CORE INVARIANT CHECK (Bảo vệ Frozen Core)
       ↓
TRIỂN KHAI THỰC THI (Implementation)
       ↓
TARGETED REGRESSION (Chạy kiểm thử khoanh vùng)
       ↓
FULL REGRESSION (Chỉ chạy khi có thay đổi kiến trúc nền tảng)
       ↓
RELEASE CANDIDATE & STAGING VERIFICATION
       ↓
PRODUCTION DEPLOYMENT (Go-Live)
```

---
*Tài liệu kiến trúc Phase 25.2 được ban hành chính thức bởi Hội đồng Quản trị & Kiến trúc Hệ thống NexusSync ERP.*
