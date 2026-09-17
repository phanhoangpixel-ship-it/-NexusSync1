# M10 Strategic Sourcing — API Catalog & Integration Specification

**Module ID:** `M10`  
**Module Name:** Strategic Sourcing, RFP & RFQ Bidding, Reverse Auction & Tender Awards  
**Business Group:** `02. PROCUREMENT & SRM`  
**Primary Workspaces:** `WS24_SOURCING` | `/strategic-sourcing`  
**Single-Writer Authority:** Sourcing Packages, RFQ Bidding Events, Reverse Auction Rounds, Consensus Scoring Matrix, Tender Award Decisions  
**Version:** 1.0.0 (Enterprise Gold Standard)

---

## 1. Architecture & Enterprise Integration Map

Module M10 operates as the strategic procurement engine in NexusSync ERP, bridging budget planning, supplier negotiations, and procurement execution while respecting strict cross-module write authorities:

```
                      ┌────────────────────────────────────────┐
                      │    M30 General Ledger / Cost Center    │
                      │        (Budget Guard Authority)        │
                      └──────────────────┬─────────────────────┘
                                         │ Pre-Award Validation
                                         ▼
┌───────────────────────┐     ┌───────────────────────┐     ┌───────────────────────┐
│   M09 Supplier Master │────►│ M10 STRATEGIC SOURCING│◄────│ M11 SRM Scorecards    │
│  - Eligibility Guard  │     │ - Sourcing Packages   │     │ - Quality Score (30%) │
│  - BPA Price Locks    │     │ - Multi-Supplier RFQ  │     │ - OTIF Delivery (20%) │
└───────────────────────┘     │ - Reverse Auction     │     │ - Compliance (10%)    │
                              │ - Consensus Matrix    │     └───────────────────────┘
                              │ - Tender Awarding     │
                              └───────────┬───────────┘
                                          │ Post-Award Delegation
                                          ├─────────────────────────┐
                                          ▼                         ▼
                              ┌───────────────────────┐ ┌───────────────────────┐
                              │  M08 Purchase Orders  │ │  M29 DMS Secure Vault │
                              │ (Single-Writer PO)    │ │ (SHA-256 Digital Seal)│
                              └───────────────────────┘ └───────────────────────┘
```

### Cross-Module Integration Contract:
1. **M08 Purchase Orders (Downstream Single-Writer):** M10 **never** directly inserts records into `purchase_orders`. Upon award approval, M10 calls the M08 PO delegation gateway (`POST /api/purchase/orders` or `POST /api/purchase-orders`), ensuring transactional integrity and outbox synchronization.
2. **M09 Supplier Management (Master Data & BPA):** 
   - *Eligibility Guard*: Verifies vendor status is `ACTIVE` and not blacklisted before allowing RFQ invitations or bid submissions.
   - *Blanket Purchase Agreement (BPA)*: Benchmarks supplier bids against long-term contract price ceilings (`bpaContracts`), issuing compliance warnings if variance exceeds `+10%`.
3. **M11 Supplier Relationship Management (SRM):** Pulls dynamic supplier scorecards (Quality, OTIF delivery rate, compliance rating) into the 4-tier consensus evaluation algorithm.
4. **M28 Organization & Delegation of Authority (DOA):** Validates multi-tier approval limits (e.g. Level 1: ≤ 500M VNĐ, Level 2: ≤ 2B VNĐ, Level 3: > 2B VNĐ).
5. **M29 Document Management System (DMS):** Performs cryptographic hashing (`SHA-256`) and hot/cold vault archiving for tender dossiers, bid comparisons, and contract award summaries.
6. **M30 Finance & Budget Guard:** Pre-validates available cost center budget (`availableAmount >= committedAmount`) before approving awards, blocking overrun with `422 BUDGET_GUARD_EXCEEDED`.

---

## 2. API Endpoints Specification

### 2.1. Khởi tạo Gói Thầu Mua Sắm (Create Sourcing Package)
* **Endpoint:** `POST /api/sourcing/packages`
* **RBAC Permissions:** `purchase:write`, `sourcing.package.manage` (Roles: `SUPER_ADMIN`, `MANAGER`, `PROCUREMENT_MANAGER`, `PURCHASING`)
* **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
* **Description:** Khởi tạo gói thầu mua sắm chiến lược (Sourcing Package) liên kết trung tâm chi phí (Cost Center) và rào chắn dự toán ngân sách M30. Tự động sinh mã chuẩn hóa `PKG-YYYY-XXXX`.

#### Request Payload:
```json
{
  "title": "Gói thầu Mua sắm Linh kiện Điện tử Bán dẫn Q3/2026",
  "category": "Direct Materials",
  "costCenter": "CC-MFG-01",
  "estimatedBudget": 300000000,
  "submissionDeadline": "2026-10-15T17:00:00.000Z",
  "description": "Cung ứng tấm Wafer Silicon và Chip vi xử lý công nghiệp",
  "idempotencyKey": "pkg-init-20260916-001"
}
```

#### Response (201 Created):
```json
{
  "success": true,
  "packageId": 12,
  "code": "PKG-2026-0012",
  "packageCode": "PKG-2026-0012",
  "package": {
    "id": 12,
    "packageCode": "PKG-2026-0012",
    "title": "Gói thầu Mua sắm Linh kiện Điện tử Bán dẫn Q3/2026",
    "category": "Direct Materials",
    "estimatedBudget": 300000000,
    "costCenter": "CC-MFG-01",
    "status": "DRAFT",
    "createdAt": "2026-09-16T21:30:00.000Z"
  },
  "message": "Khởi tạo gói thầu mua sắm thành công."
}
```

---

### 2.2. Khởi tạo & Phát hành Yêu Cầu Báo Giá (Create & Publish RFQ)
* **Endpoint:** `POST /api/sourcing/rfqs`
* **RBAC Permissions:** `purchase:write`, `sourcing.rfq.manage` (Roles: `SUPER_ADMIN`, `MANAGER`, `PROCUREMENT_MANAGER`, `PURCHASING`)
* **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
* **Description:** Tạo mới và phát hành hồ sơ mời thầu (RFQ) gắn với gói thầu mua sắm. Tự động thẩm định tư cách hợp lệ của nhà cung cấp (M09 Eligibility Guard) và sinh mã `RFQ-YYYY-XXXX`.

#### Request Payload:
```json
{
  "title": "Yêu cầu Báo giá Cung cấp Silicon Wafer 8-inch",
  "packageId": 12,
  "deadline": "2026-09-30T17:00:00.000Z",
  "invitedSupplierIds": [1, 2, 3],
  "items": [
    {
      "productId": 1,
      "targetQuantity": 500,
      "targetPrice": 750000,
      "uom": "PCS"
    }
  ],
  "idempotencyKey": "rfq-init-20260916-001"
}
```

#### Response (201 Created):
```json
{
  "success": true,
  "rfqId": 15,
  "code": "RFQ-2026-0015",
  "packageId": 12,
  "status": "OPEN_BIDDING",
  "invitedSuppliersCount": 3,
  "itemsCount": 1,
  "message": "Phát hành Yêu cầu Báo giá (RFQ) thành công."
}
```

---

### 2.3. Nộp Hồ Sơ Chào Giá Nhà Cung Cấp (Submit Supplier Bid)
* **Endpoints:** 
  - `POST /api/sourcing/rfqs/:id/bids` (RESTful nested resource)
  - `POST /api/sourcing/bids` (Direct flat resource)
* **RBAC Permissions:** `purchase:write`, `supplier:bid` (Roles: `SUPER_ADMIN`, `PURCHASING`, `SUPPLIER_PORTAL`)
* **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
* **Description:** Tiếp nhận báo giá từ nhà cung cấp cho từng vòng đàm phán/đấu giá ngược. Tự động kiểm tra giá trần (Ceiling Price Guard), tính toán % giảm giá so với vòng trước và cập nhật trạng thái các báo giá cũ sang `REVISED`.

#### Request Payload:
```json
{
  "rfqId": 15,
  "supplierId": 1,
  "roundNumber": 2,
  "currency": "VND",
  "items": [
    {
      "rfqItemId": 1,
      "unitPrice": 680000,
      "offeredQuantity": 500,
      "leadTimeDays": 5
    }
  ],
  "idempotencyKey": "bid-sup1-rnd2-20260916"
}
```

#### Response (201 Created):
```json
{
  "success": true,
  "bidId": 28,
  "roundNumber": 2,
  "totalValue": 340000000,
  "previousRoundValue": 360000000,
  "priceReductionPercent": 5.56,
  "message": "Hồ sơ chào giá Vòng 2 đã được nộp thành công."
}
```

---

### 2.4. Khởi Tạo Vòng Đấu Giá Ngược Đa Vòng (Open Reverse Auction Round)
* **Endpoint:** `POST /api/sourcing/rfqs/:id/reverse-auction/round`
* **RBAC Permissions:** `purchase:write`, `sourcing.auction.manage` (Roles: `SUPER_ADMIN`, `MANAGER`, `PROCUREMENT_MANAGER`)
* **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
* **Description:** Kích hoạt vòng đàm phán giá tiếp theo trong quy trình đấu thầu ngược (Reverse Auction). Tự động tính giá trần (Ceiling Price) dựa trên giá thấp nhất của vòng trước trừ đi % yêu cầu giảm giá mục tiêu (`targetReductionPercent`).

#### Request Payload:
```json
{
  "targetReductionPercent": 5,
  "ceilingPrice": 342000000,
  "deadline": "2026-10-05T17:00:00.000Z",
  "notes": "Mở vòng đàm phán giá rút gọn Vòng 2 cho top 3 nhà cung cấp",
  "idempotencyKey": "auction-rnd-rfq15-v2"
}
```

#### Response (201 Created):
```json
{
  "success": true,
  "rfqId": 15,
  "rfqCode": "RFQ-2026-0015",
  "roundId": 18,
  "roundNumber": 2,
  "previousLowestBid": 360000000,
  "ceilingPrice": 342000000,
  "targetReductionPercent": 5,
  "deadline": "2026-10-05T17:00:00.000Z",
  "message": "Đã mở thành công Vòng 2 đàm phán giá ngược (Reverse Auction) cho gói thầu RFQ-2026-0015."
}
```

---

### 2.5. Ma Trận So Sánh Báo Giá Chuẩn Hóa (Standardized Side-by-Side Comparison Matrix)
* **Endpoints:**
  - `GET /api/sourcing/rfqs/:id/comparison`
  - `GET /api/sourcing/comparison?rfqId=:id`
* **RBAC Permissions:** `purchase:read`, `sourcing.evaluation.read` (Roles: `SUPER_ADMIN`, `MANAGER`, `PROCUREMENT_MANAGER`, `PURCHASING`)
* **Headers:** `Authorization: Bearer <token>`
* **Description:** Xuất ma trận so sánh side-by-side chuẩn hóa giữa các hồ sơ thầu, tích hợp đối soát giá khung hợp đồng nguyên tắc M09 BPA và thẻ điểm nhà cung cấp M11 SRM.

#### Response (200 OK):
```json
{
  "rfq": {
    "id": 15,
    "code": "RFQ-2026-0015",
    "title": "Yêu cầu Báo giá Cung cấp Silicon Wafer 8-inch",
    "status": "OPEN_BIDDING",
    "currentRound": 2,
    "packageCode": "PKG-2026-0012",
    "estimatedBudget": 350000000
  },
  "items": [
    {
      "id": 1,
      "productId": 1,
      "productName": "Silicon Wafer 8-inch tinh khiết 99.99%",
      "sku": "RAW-WAF-01",
      "targetQuantity": 500,
      "uom": "PCS"
    }
  ],
  "comparison": [
    {
      "bidId": 28,
      "supplierId": 1,
      "supplierCode": "SUP-TEST-001",
      "supplierName": "Test Supplier Active",
      "roundNumber": 2,
      "unitPrice": 680000,
      "totalValue": 340000000,
      "leadTimeDays": 5,
      "paymentTerms": "NET 30 Ngày",
      "ranking": 1,
      "bpaBenchmark": {
        "hasAgreement": true,
        "contractCode": "CON-2026-001",
        "contractTitle": "Hợp đồng nguyên tắc cung ứng Silicon Wafer",
        "lockedPrice": 720000,
        "offeredPrice": 680000,
        "variancePercent": -5.56,
        "isExceedingLimit": false,
        "flag": "FAVORABLE",
        "warningMessage": "✓ Đơn giá ưu đãi tốt hơn giá khung thỏa thuận BPA (5.56% tiết kiệm)."
      },
      "m11Scorecard": {
        "qualityScore": "98.0%",
        "otifRate": "96.5%",
        "complianceScore": "100%",
        "performanceTier": "TIER_1_STRATEGIC"
      }
    }
  ],
  "summary": {
    "totalBids": 2,
    "lowestPrice": 340000000,
    "highestPrice": 365000000,
    "averagePrice": 352500000,
    "potentialSavings": 10000000,
    "potentialSavingsPercent": 2.86,
    "leadingSupplier": "Test Supplier Active",
    "bpaAlertsCount": 0
  }
}
```

---

## 3. Mã Lỗi Chuẩn Hóa Toàn Hệ Thống (Standard Error Codes)

| Mã Lỗi HTTP | Error Code | Ý Nghĩa Nghiệp Vụ & Hướng Xử Lý |
|---|---|---|
| `400` | `MISSING_TITLE` | Tiêu đề gói thầu hoặc RFQ bị bỏ trống. |
| `400` | `MISSING_IDEMPOTENCY_KEY` | Thiếu khóa chống trùng lặp `idempotencyKey` khi gửi request. |
| `400` | `INVALID_RFQ_STATUS` | RFQ đã ở trạng thái bất biến (`AWARDED` hoặc `CANCELLED`), không cho phép thao tác sửa đổi. |
| `404` | `RFQ_NOT_FOUND` | Không tìm thấy RFQ tương ứng với mã số hoặc ID cung cấp. |
| `409` | `IDEMPOTENCY_CONFLICT` | Trùng khóa `idempotencyKey` nhưng nội dung payload khác với giao dịch ban đầu. |
| `422` | `SUPPLIER_INELIGIBLE` | Nhà cung cấp bị gắn cờ đình chỉ hoặc không đủ điều kiện tham gia đấu thầu (M09 Guard). |
| `422` | `CEILING_PRICE_EXCEEDED` | Giá chào thầu vượt quá giá trần cho phép của vòng đấu giá ngược hiện tại. |
| `422` | `BUDGET_GUARD_EXCEEDED` | Giá trị trao thầu vượt quá ngân sách khả dụng của Trung tâm chi phí (Cost Center M30). |

---

## 4. Bảng Đối Soát Thực Thể Dữ Liệu (Database Entities & Tables)

| Bảng Cơ Sở Dữ Liệu | Quyền Ghi (Write Authority) | Mô Tả Thực Thể |
|---|---|---|
| `sourcing_packages` | **M10 Strategic Sourcing** | Danh mục gói thầu mua sắm, dự toán ngân sách, trung tâm chi phí |
| `srm_rfqs` | **M10 Strategic Sourcing** | Yêu cầu báo giá, vòng đấu giá hiện tại, trạng thái phát hành |
| `srm_rfq_items` | **M10 Strategic Sourcing** | Chi tiết danh mục vật tư / hàng hóa cần chào giá theo RFQ |
| `srm_rfq_suppliers` | **M10 Strategic Sourcing** | Danh sách nhà cung cấp được mời tham gia đấu thầu |
| `srm_bids` | **M10 Strategic Sourcing** | Hồ sơ chào giá từng vòng của nhà cung cấp |
| `srm_bid_items` | **M10 Strategic Sourcing** | Đơn giá, số lượng, tiến độ giao hàng (lead time) chi tiết từng dòng |
| `srm_auction_rounds` | **M10 Strategic Sourcing** | Lịch sử các vòng đấu giá ngược, giá trần và thời hạn từng vòng |
| `sourcing_evaluations` | **M10 Strategic Sourcing** | Tổng hợp điểm đánh giá hội đồng / thuật toán đồng thuận |
| `sourcing_evaluation_scores` | **M10 Strategic Sourcing** | Điểm số chi tiết 4 tiêu chí (Giá 40%, Kỹ thuật 30%, SLA 20%, Pháp lý 10%) |
| `sourcing_awards` | **M10 Strategic Sourcing** | Quyết định trao thầu, liên kết hợp đồng BPA và rào chắn ngân sách |
| `outbox_events` | **System Core L0** | Transactional Outbox ghi nhận sự kiện bảo đảm tính nhất quán phân tán |
| `purchase_orders` | **M08 Purchase Orders** | Đơn mua hàng chính thức (M10 chỉ ủy quyền ghi qua API M08) |
| `dms_documents` | **M29 DMS Vault** | Lưu trữ hồ sơ niêm phong mật mã SHA-256 |
