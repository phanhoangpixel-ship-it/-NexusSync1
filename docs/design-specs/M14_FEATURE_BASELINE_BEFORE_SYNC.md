# M14 SALES COMMISSION & INCENTIVE WORKSPACE — FEATURE BASELINE BEFORE SYNC
**Document ID:** `/docs/design-specs/M14_FEATURE_BASELINE_BEFORE_SYNC.md`  
**Module ID:** `M14` (Sales Commission & Incentive Workspace)  
**Creation Date:** 2026-09-11  
**Target Reference:** `/docs/design-specs/M19_MASTER_DESIGN_SPEC.md`  
**Governance Rules:** Rule #19 (ConfirmDialog, WCAG AA, Table Row Hover, Monospace) & Rule #20 (Full UI/UX Module Replication Protocol)

---

## 1. MỤC TIÊU & PHẠM VI (SCOPE & OBJECTIVES)
Tài liệu này ghi lại toàn bộ tính năng, trạng thái (state), luồng dữ liệu (data flow), các handler sự kiện, các modal và cấu trúc trước khi thực hiện đồng bộ giao diện người dùng theo chuẩn thiết kế M19 Master Design Spec (`M19_MASTER_DESIGN_SPEC.md`).
Tuyệt đối bảo toàn 100% logic nghiệp vụ, các sự kiện phát hành sang L5 Context Rail, tích hợp bút toán Sổ Cái (GL), lưu trữ cấu hình và các bước phê duyệt qua `ConfirmDialog`.

---

## 2. KIỂM KÊ CÁC TAB & NGHIỆP VỤ CỦA MODULE M14

| STT | Tab ID | Tên Tab Chức Năng | Vai Trò & Nghiệp Vụ Cốt Lõi |
|---|---|---|---|
| 1 | `rules` | **Rule Engine (Tầng bậc)** | Định nghĩa và chỉnh sửa động các tầng bậc hoa hồng (`TIER-01`, `TIER-02`, ...); Doanh số tối thiểu/tối đa, tỷ lệ % hoa hồng; Lưu cấu hình Rule Engine vào DB với ConfirmDialog; Thêm bậc hoa hồng mới vào Engine. |
| 2 | `calculations` | **Bảng tính & Payouts** | Danh sách phiếu chi hoa hồng (`COM-2026-xxx`); Doanh số chốt, kế hoạch áp dụng, tỷ lệ % và số tiền hoa hồng; Tìm kiếm đa tiêu chí; Phê duyệt Payout với ConfirmDialog; Mở Bảng tính chi tiết 360° & đồng bộ GL sang L5 Context Rail; Form tính toán hoa hồng mới với CurrencyInput. |
| 3 | `allocation` | **Phân bổ Nhóm (Allocation)** | Quản lý hợp đồng B2B lớn cần chia tỷ lệ hoa hồng giữa Sales chủ trì (Primary Rep) và Sales hỗ trợ (Supporting Split); Form thiết lập tỷ lệ phân bổ mới. |
| 4 | `clawback` | **Thu hồi Hoa hồng (Clawback)** | Giám sát các đơn hàng bị hoàn trả hàng hoặc hủy hợp đồng sau khi đã chi hoa hồng; Tự động tính toán số tiền thu hồi (Clawback) khấu trừ vào kỳ hoa hồng tiếp theo. |
| 5 | `analytics` | **Phân tích & Hạch toán GL** | Tổng quan tổng doanh số đạt, tổng hoa hồng chi trả, tổng hoàn trả clawback; Định khoản kế toán kép: Nợ TK 6415 (Chi phí hoa hồng bán hàng) / Có TK 3341 (Phải trả người lao động). |

---

## 3. DANH SÁCH STATE & DATA MODELS

### 3.1 State biến động
- `loading`: boolean — trạng thái làm mới dữ liệu.
- `activeTab`: `'rules' | 'calculations' | 'allocation' | 'clawback' | 'analytics'` — Tab hoạt động, lưu session qua `useWorkspaceSessionTab`.
- `searchQuery`: string — từ khóa tìm kiếm Payout.
- `confirmDialog`: `ConfirmDialogState | null` — điều khiển hộp thoại xác nhận Rule #19.
- `ruleTiers`: Danh sách các tầng bậc hoa hồng (`id`, `minRev`, `maxRev`, `rate`, `desc`).
- `payouts`: Danh sách các phiếu hoa hồng nhân sự (`id`, `salesRep`, `department`, `closedRevenue`, `appliedPlan`, `commissionRate`, `commissionAmount`, `status`, `payoutDate`).
- `allocations`: Danh sách phân bổ nhóm (`id`, `dealCode`, `totalDealValue`, `primaryRep`, `supportingReps`, `status`).
- `clawbacks`: Danh sách đơn thu hồi hoa hồng (`id`, `originalDeal`, `salesRep`, `returnReason`, `refundedAmount`, `clawbackAmount`, `status`).
- `selectedPayoutForModal`: Đối tượng Payout đang mở xem modal 360°.
- `editingTierId`: ID tầng bậc đang inline editing trong bảng Rule Engine.
- Các state form tạo Payout mới, form tạo Allocation mới, form thêm Tier mới.

### 3.2 Handlers nghiệp vụ
1. `handleStartEditTier(tier)`: Bật chế độ inline edit cho dòng tier.
2. `handleSaveEditTier(id)`: Cập nhật giá trị tier vào mảng state `ruleTiers`.
3. `handleAddTier(e)`: Thêm một bậc thang hoa hồng mới vào Engine.
4. `handleSaveConfigToDB()`: Kích hoạt `ConfirmDialog` lưu cấu hình vào PostgreSQL/Firestore DB.
5. `handleCreateAllocation(e)`: Thêm bản ghi phân bổ nhóm mới.
6. `handleCreatePayout(e)`: Tính toán hoa hồng tự động theo Rule Engine và tạo bản ghi Payout mới.
7. `handleUpdateStatus(id, newStatus)`: Kích hoạt `ConfirmDialog` phê duyệt Payout và hạch toán GL.
8. `handleSelectPayout(payout)`: Phát hành `onSelectEntity` (type: `SALES_COMMISSION`) với đầy đủ lineage, auditTrail và glEntries (Nợ 6415 / Có 3341) sang L5 Context Rail, đồng thời mở modal 360°.
9. `handleExportCSV()`: Xuất tệp RFC 4180 CSV tải về máy khách.

---

## 4. BẢNG TIÊU CHUẨN ĐỒNG BỘ VÀ NÂNG CẤP UI/UX

1. **L0 Header / Banner**:
   - Chuyển từ gradient tối màu sang thẻ chuẩn M19: `bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs`.
   - Icon 40x40 tròn góc bo cong `bg-amber-600 dark:bg-amber-500 text-white shadow-xs`.
   - Chip `M14 • SALES COMMISSION` + Huy hiệu `Rule #19 Confirmed`.
   - Nút chuyển hướng nhanh sang M13 Sales Orders, nút Làm mới, nút Xuất Báo Cáo CSV.

2. **L1 Navigation Strip**:
   - Chuyển thành thanh tab bo góc chuẩn M19: `bg-white dark:bg-slate-800/90 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs`.
   - Trạng thái Active: `bg-amber-600 dark:bg-amber-500 text-white shadow-xs` hoặc `bg-blue-600 text-white`.

3. **L2 KPI Summary Strips**:
   - Thêm dải 4 thẻ KPI đồng bộ cho từng Tab chức năng với font số `font-mono tabular-nums font-bold text-2xl`.

4. **L3 Data Tables**:
   - Thiết lập đường viền phân loại trạng thái dòng `border-l-4` cho các bảng Rule Tiers, Payouts, Allocations, Clawbacks.
   - Màu hover chuẩn: `hover:bg-slate-100/80 dark:hover:bg-slate-700/60`.
   - Badge trạng thái WCAG AA với độ tương phản ≥ 4.5:1.
   - Toàn bộ số tiền, phần trăm, mã định danh hiển thị bằng `font-mono tabular-nums`.

5. **L4 Pagination**:
   - Bổ sung thanh điều khiển phân trang cố định `PaginationControl` cho bảng danh sách Payout.

6. **Rule #19 Compliance**:
   - 100% không dùng `window.alert` hoặc `window.confirm`. Toàn bộ qua `ConfirmDialog.tsx`.
   - Xử lý toán tử derived value: Dùng toán tử `??` thay thế hoàn toàn `||`.
