# M41 PRICING MANAGEMENT WORKSPACE — FEATURE BASELINE BEFORE UI SYNC (PHASE -1)

**Document Reference:** `/docs/design-specs/M41_FEATURE_BASELINE_BEFORE_SYNC.md`  
**Governing Standard:** Rule #19 (ConfirmDialog & WCAG AA) & Rule #20 (Full UI/UX Replication Protocol)  
**Tác giả:** Chuyên viên Lập trình Frontend Cấp cao — NexusSync ERP Team  
**Mục tiêu:** Lập biên bản kiểm kê và chụp lại toàn bộ tính năng, API, state handlers, quy tắc RBAC và validation của Module M41 (Pricing Management) TRƯỚC khi tiến hành đồng bộ lớp trình bày (UI/UX) theo chuẩn M19.

---

## 1. DANH MỤC 10 TAB NGHIỆP VỤ VÀ CHỨC NĂNG CỦA M41

| STT | Mã Tab | Tên Tab Chức Năng | File Component | Chức Năng & Luồng Nghiệp Vụ Chính |
|---|---|---|---|---|
| 1 | `product_prices` | **Bảng Giá SKU** | `ProductPricesTab.tsx` | Hiển thị danh sách giá SKU theo bảng giá, tính toán margin/markup, cảnh báo biên lợi nhuận dưới sàn (`isBelowMinMargin`), gọi Modal Can thiệp thủ công (`ManualOverrideModal`). |
| 2 | `price_lists` | **Danh Mục Bảng Giá** | `PriceListsTab.tsx` | Quản lý các bảng giá (Retail, Wholesale, Distributor, VIP), thiết lập độ ưu tiên (`priority`), thời hạn hiệu lực, trạng thái phê duyệt. |
| 3 | `pricing_rules` | **Quy Tắc Markup / Margin** | `PricingRulesTab.tsx` | Cấu hình quy tắc định giá theo danh mục sản phẩm (RAM, SSD, CPU, Accessory), tỷ lệ markup/target margin, quy tắc làm tròn (`roundingMode`), tự động tính lại giá SKU. |
| 4 | `customer_pricing` | **Hợp Đồng Khách Hàng** | `CustomerPricingTab.tsx` | Quản lý giá đặc biệt theo hợp đồng khách hàng VIP (FPT, CMC), chiết khấu riêng, thời hạn hiệu lực. |
| 5 | `quantity_pricing` | **Bậc Thang Số Lượng** | `QuantityPricingTab.tsx` | Quản lý biểu giá theo số lượng mua (Tier 1-9, 10-49, 50-99, 100+), chiết khấu bậc thang theo SL. |
| 6 | `promotions` | **Khuyến Mãi Có Hạn** | `PromotionsTab.tsx` | Quản lý chiến dịch khuyến mãi (Back to School, Flash Sale), giá KM, tự động hoàn nguyên sau ngày kết thúc. |
| 7 | `bulk_pricing` | **Tính Giá Hàng Loạt** | `BulkPricingTab.tsx` | Nhập và cập nhật giá hàng loạt cho danh sách SKU dựa trên quy tắc biên lợi nhuận hoặc phần trăm điều chỉnh. |
| 8 | `approvals` | **Phê Duyệt (Maker-Checker)** | `PriceApprovalTab.tsx` | Luồng Maker-Checker phân quyền: Trưởng phòng lập yêu cầu đổi giá, CFO (Trần Văn Giám) phê duyệt hoặc từ chối. |
| 9 | `history_audit` | **Lịch Sử & Audit Log** | `PriceHistoryTab.tsx` | Nhật ký kiểm toán bất biến mọi thay đổi giá, người thay đổi, người phê duyệt, quy tắc áp dụng, lý do can thiệp. |
10 | `simulator` | **Dò Giá Waterfall** | `PricingAuditAndSimulatorTab.tsx` | Động cơ Authoritative Pricing Engine 6 bước (Hợp đồng khách hàng $\rightarrow$ Nhóm khách hàng $\rightarrow$ Bậc thang SL $\rightarrow$ Khuyến mãi $\rightarrow$ Quy tắc danh mục $\rightarrow$ Giá niêm yết chuẩn). |

---

## 2. LUỒNG XỬ LÝ DỮ LIỆU & STATE HANDLERS ĐƯỢC BẢO TOÀN 100%

1. **`executePriceResolution(query)`**: Động cơ Authoritative Pricing Engine kiểm tra theo thứ tự ưu tiên 6 bước, tính toán VAT (10%), tổng tiền, biên lợi nhuận thực tế (`actualMarginPercent`), và trả về kết quả `PriceResolutionResult`.
2. **`handleUpdateRule(updatedRule)`**: Cập nhật quy tắc danh mục và tự động tính lại giá cho toàn bộ SKU thuộc danh mục đó (trừ các SKU đã có override thủ công), đồng thời ghi Audit Log.
3. **`handleConfirmOverride(params)`**: Xử lý can thiệp giá thủ công (Manual Override), ghi nhận lý do, người thay đổi, người duyệt, và cập nhật Audit Log.
4. **`handleApplyInboundCost(params)`**: Đồng bộ giá vốn mới từ Inbound Receiving, tự động tính lại giá đề xuất và biên lợi nhuận.
5. **`handleApproveRequest(requestId)` / `handleRejectRequest(requestId, reason)`**: Quy trình phê duyệt Maker-Checker cho các yêu cầu thay đổi giá.
6. **`handleCommitBulkPrices(newItems)`**: Xác nhận cập nhật giá hàng loạt và ghi log.

---

## 3. QUY TẮC PHÂN QUYỀN RBAC & SOD (SEGREGATION OF DUTIES)
- **Pricing Specialist / Sales Manager**: Có quyền tạo đề xuất thay đổi giá, cấu hình quy tắc danh mục, nhập liệu bậc thang, lập hợp đồng khách hàng.
- **CFO / Financial Director (Trần Văn Giám)**: Có quyền phê duyệt hoặc từ chối các yêu cầu thay đổi giá, đặc biệt là các mức giá có biên lợi nhuận dưới ngưỡng tối thiểu an toàn ($\ge 15\%$).
- **Costing Engine**: Cung cấp giá vốn (`costBasis`) độc lập, Pricing Authority sử dụng cost basis này để tính toán biên lợi nhuận mà không can thiệp vào nghiệp vụ kế toán giá thành.

---

## 4. CAM KẾT BẢO TOÀN
Khi đồng bộ giao diện M41 theo chuẩn thiết kế M19 (Rule #20 & Rule #19), **100% logic nghiệp vụ, API calls, state handlers, modal actions, và các tiêu chuẩn kiểm soát trên được giữ nguyên vẹn**, chỉ nâng cấp lớp trình bày (presentation layer) với cấu trúc L0-L4, typography Monospace cho dữ liệu số, bảng hover chuẩn, và `ConfirmDialog.tsx` thay cho mọi alert/confirm nguyên thủy.
