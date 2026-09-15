# M38 SERVICE DESK & IT SERVICE MANAGEMENT (ITSM) WORKSPACE
## FEATURE BASELINE ASSESSMENT & PRE-SYNC AUDIT (PHASE 0)

**Document Reference:** `/docs/design-specs/M38_FEATURE_BASELINE_BEFORE_SYNC.md`  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Module Replication Protocol) trong `GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`  
**Target Module:** `M38` — Hỗ Trợ Kỹ Thuật & Dịch Vụ IT (Service Desk / ITSM Workspace)  
**File Hiện Tại:** `/src/components/workspaces/ServiceDeskWorkspace.tsx`  
**Ngày đánh giá:** 11/09/2026  

---

## 1. HIỆN TRẠNG TRƯỚC KHI ĐỒNG BỘ (BEFORE BASELINE)

### 1.1 Cấu trúc & Bố cục hiện tại
- **Cấu trúc màn hình:** Đang là màn hình đơn (single-view) chỉ có 1 bảng danh sách sự cố, chưa có hệ thống phân chia đa phân hệ Sub-tabs (L1).
- **Hệ thống màu sắc:** Đang sử dụng tông màu tím `indigo` (`bg-indigo-600`, `text-indigo-600`, `ring-indigo-500`), vi phạm chuẩn màu xanh dương doanh nghiệp **M41 Blue Primary Palette** (`bg-blue-600`, `text-blue-600`, `border-blue-500`).
- **Tầng L0 (Workspace Banner):** Chưa có Banner Header chuẩn tối (`from-slate-900 to-[#1e293b]`), thiếu chip định danh phân hệ (`M38 • SERVICE DESK & ITSM`), thiếu Badge chứng nhận Rule #19/#20 và Real-time SLA metric.
- **DeepLinkBanner:** Chưa tích hợp liên kết sâu sang phân hệ bảo trì thiết bị **M27 EAM** và quản trị định danh & phân quyền **M34 RBAC**.
- **Tầng L2 (KPI Summary Strip):** 4 thẻ KPI tĩnh, không thay đổi ngữ cảnh theo nghiệp vụ.
- **Tầng L4 (Pagination):** Chưa có hệ thống phân trang chuẩn `PaginationControl`, danh sách hiển thị thô sơ.
- **Hộp thoại tương tác (Rule #19):** Một số thao tác thiếu xác thực qua `ConfirmDialog.tsx`.

---

## 2. KẾ HOẠCH BỔ SUNG & ĐỒNG BỘ TOÀN DIỆN (L0 - L4)

### 2.1 Bảng phân chia 4 Tabs chức năng chuẩn doanh nghiệp (L1)
| STT | Mã Tab | Tên Tab Nghiệp Vụ | Vai Trò & Chức Năng |
|:---:|:---|:---|:---|
| 1 | `tickets` | **Hàng Đợi Sự Cố & Tickets (Incident Queue)** | Quản lý vòng đời sự cố IT, lọc đa chiều theo mức độ ưu tiên, danh mục và trạng thái SLA, tích hợp giải quyết và nâng cấp sự cố qua ConfirmDialog. |
| 2 | `assets_link` | **Thiết Bị IT & Tài Sản Vận Hành (IT Assets & EAM Link)** | Quản lý danh mục tài sản hạ tầng CNTT (máy chủ ERP, máy in tem mã vạch WMS, PDA kiểm kho, máy trạm POS), liên kết bảo trì thiết bị sang M27. |
| 3 | `kb_solutions` | **Kho Tri Thức & Giải Pháp (Knowledge Base & SOPs)** | Cẩm nang khắc phục sự cố chuẩn (KEDB), hướng dẫn xử lý lỗi phần mềm ERP, mạng VPN, chữ ký số DMS M29 và phân quyền M34. |
| 4 | `sla_analytics` | **Phân Tích SLA & Hiệu Suất IT (SLA & MTTR Analytics)** | Bảng điều khiển phân tích trực quan Recharts (BarChart, PieChart, AreaChart), theo dõi chỉ số cam kết SLA, MTTR và tỷ lệ FCR. |

### 2.2 Cam kết bảo toàn dữ liệu & API (Zero Logic Loss)
- Bảo toàn và mở rộng các endpoint: `GET /api/issues`, `POST /api/issues`, `POST /api/issues/:id/resolve`, `POST /api/issues/:id/escalate`, `GET /api/issues/assets`, `POST /api/issues/assets`, `GET /api/issues/knowledge-base`.
- Bảo toàn tích hợp `onSelectEntity` với dữ liệu `SelectedEntityContext` (code, title, status, lineage 3 tầng, auditTrail SHA-256, hạch toán chi phí dịch vụ glEntries).
- Tích hợp `useWorkspaceSessionTab` và `useWorkspaceAction`.
- Đảm bảo 100% tuân thủ **Rule #19 (ConfirmDialog & WCAG AA)** và **Rule #20 (Full UI/UX Module Replication Protocol)**.
