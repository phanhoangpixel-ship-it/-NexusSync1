# ĐỊNH NGHĨA MODULE — PRODUCT PRICING & PRICE MANAGEMENT (M41)

**Product Pricing & Price Management** là module chịu trách nhiệm **thiết lập, quản lý, tính toán, kiểm soát và cung cấp giá bán của sản phẩm/dịch vụ** trong NexusSync ERP.

Module này là **nguồn chuẩn (Pricing Authority)** cho giá bán, trong khi **giá vốn** vẫn thuộc quyền sở hữu của **Costing Engine**.

---

## 1. Mục tiêu của module

Module giải quyết toàn diện bài toán:
> **"Sản phẩm này bán với giá nào, cho đối tượng nào, theo điều kiện nào, từ thời điểm nào và ai được phép thay đổi/phê duyệt?"**

Bao gồm:
*   **Giá bán lẻ (Retail Price)**.
*   **Giá bán sỉ (Wholesale Price)**.
*   **Giá đại lý / nhà phân phối (Distributor / Dealer Price)**.
*   **Giá theo khách hàng cụ thể (Customer-Specific Pricing / Contract Price)**.
*   **Giá theo nhóm khách hàng (Customer Group Pricing: Retail, Wholesale, Dealer, VIP)**.
*   **Giá theo số lượng (Quantity Pricing / Volume Tier Breaks: 1–9, 10–49, 50–99, 100+)**.
*   **Giá khuyến mãi (Promotion Pricing)** có thời hạn hiệu lực, tự động hoàn nguyên về giá chuẩn sau khi kết thúc.
*   **Giá theo thời hạn hiệu lực (Effective Dating: Effective From / Effective To)** — không overwrite lịch sử.
*   **Giá theo đơn vị tính (UOM Pricing)**: Hỗ trợ quy đổi giá theo đơn vị tính (PCS, BOX = 10 PCS, PACK, TON...).
*   **Giá được tính từ giá vốn + Markup / Target Margin** (phân biệt rạch ròi 2 công thức trong UI).
*   **Giá nhập / import hàng loạt (Bulk Pricing)** từ Goods Receipt & Costing Engine với Exception Review.
*   **Phê duyệt thay đổi giá (Maker-Checker Approval Workflow)**: Draft → Submitted → Pending Approval → Approved → Active / Rejected.
*   **Manual Override**: Kiểm soát ghi nhận Override=YES, Giá gốc, Giá ghi đè, Lý do, Người sửa, Ngày sửa, Người duyệt.
*   **Minimum Margin Control**: Kiểm soát biên lợi nhuận tối thiểu, tự động cảnh báo và chặn bán dưới chuẩn nếu không có phê duyệt.
*   **Price Resolution Engine**: Thứ tự ưu tiên 6 cấp phân giải giá đơn hàng chuẩn xác cho Sales O2C.
*   **Lịch sử giá và Audit Trail bất biến**.

---

## 2. Vị trí trong kiến trúc NexusSync ERP

```text
                     PRODUCT MASTER
                          │
                          ▼
                   PRODUCT ATTRIBUTES
                          │
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
         PROCUREMENT              COSTING
              │                       │
              ▼                       ▼
        PURCHASE PRICE          ACTUAL COST
                                      │
                                      ▼
                          ┌─────────────────────┐
                          │ PRODUCT PRICING     │
                          │ & PRICE MANAGEMENT  │
                          └──────────┬──────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 ▼                   ▼                   ▼
              RETAIL             WHOLESALE          CUSTOMER
                PRICE               PRICE             PRICE
                 │                   │                   │
                 └───────────────────┼───────────────────┘
                                     ▼
                                 SALES O2C
                                     │
                                     ▼
                               SALES ORDER
```

### Phân định thẩm quyền miền (Domain Authority)

| Dữ liệu / Nghiệp vụ | Module chịu trách nhiệm | Nguyên tắc |
| :--- | :--- | :--- |
| **Product Master & SKU** | Product / Master Data (M02/M07) | Định nghĩa thuộc tính vật lý, đơn vị tính chuẩn. |
| **Purchase Price** | Procurement / P2P (M08) | Giá mua thỏa thuận với nhà cung cấp. |
| **Actual Cost / Cost Basis** | Costing Engine (M07/M17) | Giá vốn bình quân gia quyền / FIFO. |
| **Selling Price (Giá bán)** | **Product Pricing (M41)** | Nguồn chuẩn duy nhất (Pricing Authority). |
| **Customer-specific Price** | **Product Pricing (M41)** | Bảng giá hợp đồng theo từng khách hàng. |
| **Commercial Discount** | Pricing / Commercial Rules (M41) | Quy tắc giảm giá bậc thang và thương mại. |
| **Sales Order Entry** | Sales O2C (M13/M16) | Lấy Resolved Price từ Pricing, không tự tính giá. |
| **Tax / VAT Calculation** | Tax Engine (M31) | Tính toán thuế suất và nghĩa vụ thuế VAT. |
| **Revenue / GL Postings** | Finance & General Ledger (M30) | Ghi nhận doanh thu và công nợ sổ cái. |

> **Nguyên tắc cốt lõi:** Pricing **không được tự tính lại giá vốn**. Nó nhận `Cost Basis` từ Costing Engine để xây dựng giá bán.

---

## 3. Các thành phần chính của Module

### A. Price List Management (Quản lý Bảng giá)
Quản lý các bảng giá đa dạng:
*   **Retail**: Bảng giá bán lẻ tiêu chuẩn.
*   **Wholesale**: Bảng giá bán buôn / sỉ.
*   **Distributor**: Bảng giá nhà phân phối.
*   **Dealer**: Bảng giá đại lý.
*   **VIP**: Bảng giá khách hàng thân thiết.
*   **Export**: Bảng giá xuất khẩu quốc tế.

Mỗi Price List bao gồm:
*   `Price List Code`
*   `Name`
*   `Currency` (VND, USD...)
*   `Default UOM`
*   `Effective From` / `Effective To`
*   `Status` (ACTIVE / INACTIVE / ARCHIVED)
*   `Priority` (Thứ tự ưu tiên phân giải)
*   `Approval Status` (DRAFT / SUBMITTED / PENDING / APPROVED / ACTIVE)

---

## 4. Product Price (Đa bảng giá trên từng sản phẩm)
Một sản phẩm có nhiều mức giá theo từng bảng giá và đơn vị tính:

```text
RAM-16GB
├── Cost Basis (từ Costing Engine): 444.444 VND
├── Retail Price:      666.666 VND (Markup 50%, Margin 33.33%)
├── Wholesale Price:   620.000 VND (Markup 39.5%, Margin 28.32%)
├── Distributor Price: 600.000 VND (Markup 35.0%, Margin 25.93%)
└── VIP Price:         580.000 VND (Markup 30.5%, Margin 23.37%)
```

---

## 5. Pricing Rule Engine (Markup % vs. Target Margin %)
Hệ thống phân biệt rõ ràng hai khái niệm toán học:

1.  **Markup (%)**:
    $$\text{Selling Price} = \text{Cost} \times (1 + \text{Markup}\%)$$
    *Ví dụ:* $\text{Cost} = 444.444$, $\text{Markup} = 50\% \implies \text{Price} = 666.666\text{ VND}$.

2.  **Target Margin (%)**:
    $$\text{Selling Price} = \frac{\text{Cost}}{1 - \text{Margin}\%}$$
    *Ví dụ:* $\text{Cost} = 444.444$, $\text{Target Margin} = 30\% \implies \text{Price} \approx 634.920\text{ VND}$.

---

## 6. Pricing theo Category (Quy tắc theo Danh mục)
Cấu hình tự động tính giá cho hàng loạt SKU thuộc danh mục:
*   **RAM**: $+50\%$ Markup
*   **SSD**: $+30\%$ Markup
*   **CPU**: $+25\%$ Markup
*   **Phụ kiện (Accessory)**: $+40\%$ Markup

Khi nhập hàng loạt sản phẩm mới: `Costing` $\to$ `Category Rule` $\to$ `Calculate` $\to$ **500 Selling Prices tự động**, người dùng không phải nhập từng giá thủ công.

---

## 7. Pricing theo Khách hàng & Nhóm khách hàng
*   **Customer-specific**: Khách hàng A (RAM = 650.000), Khách hàng B (RAM = 630.000), Khách hàng C (RAM = 600.000).
*   **Customer Group**: Phân cấp theo nhóm `Retail`, `Wholesale`, `Dealer`, `VIP`.

---

## 8. Pricing theo Số lượng (Quantity Break Tiers)
Bảng giá bậc thang số lượng (rất quan trọng cho mô hình B2B):
*   $1 - 9$ cái: $666.666\text{ VND}$
*   $10 - 49$ cái: $640.000\text{ VND}$
*   $50 - 99$ cái: $620.000\text{ VND}$
*   $100+$ cái: $600.000\text{ VND}$

---

## 9. Pricing theo Thời gian (Effective Dating)
**Tuyệt đối không overwrite lịch sử giá.**
*   `01/08/2026` $\to$ $666.666\text{ VND}$
*   `01/09/2026` $\to$ $699.000\text{ VND}$
*   `01/10/2026` $\to$ $720.000\text{ VND}$

Mỗi mức giá có `Effective From` và `Effective To`. Đơn hàng ngày 29/08 tự động áp giá 666.666; ngày 05/09 tự động áp giá 699.000.

---

## 10. Pricing theo Đơn vị tính (UOM Pricing)
Nếu sản phẩm hỗ trợ quy đổi (Ví dụ: $1\text{ BOX} = 10\text{ PCS}$):
*   $\text{PCS} \to 666.666\text{ VND}$
*   $\text{BOX} \to 6.300.000\text{ VND}$ (chiết khấu sỉ theo thùng)

---

## 11. Bulk Pricing (Cập nhật giá hàng loạt)
Quy trình liên kết liền mạch:
$$\text{Goods Receipt} \to \text{Costing Engine} \to \text{Actual Cost} \to \text{Bulk Pricing} \to \text{Apply Rule} \to \text{Preview} \to \text{Exception Review} \to \text{Approve}$$

---

## 12. Manual Override (Ghi đè giá có kiểm soát)
Khi người quản lý ghi đè giá tính toán:
*   `Override`: YES
*   `Original Price`: $666.666\text{ VND}$
*   `Final Price`: $650.000\text{ VND}$
*   `Reason`: Điều chỉnh cạnh tranh thị trường khu vực.
*   `Changed By`: Manager
*   `Approved By`: Director

---

## 13. Minimum Margin Control (Kiểm soát Biên lợi nhuận tối thiểu)
*   Quy định `Minimum Margin = 15%`.
*   Nếu nhân viên nhập giá bán $500.000\text{ VND}$ với giá vốn $444.444\text{ VND} \implies \text{Margin} = 11.11\%$.
*   Hệ thống cảnh báo: **"⚠️ Giá bán dưới biên lợi nhuận tối thiểu 15%"** và yêu cầu gửi yêu cầu phê duyệt đến Manager/CFO.

---

## 14. Promotion Pricing (Giá khuyến mãi)
*   Giá chuẩn không bị sửa đổi.
*   Thiết lập chiến dịch Khuyến mãi với khoảng thời gian: `01/09` $\to$ `15/09`: RAM = $599.000\text{ VND}$.
*   Sau ngày `15/09`, hệ thống tự động hoàn nguyên về giá chuẩn $666.666\text{ VND}$.

---

## 15. Price Resolution Engine (Thứ tự ưu tiên phân giải giá)
Khi Sales O2C tạo đơn, hệ thống tự động xác định giá theo thứ tự:
1.  **Customer-specific Contract Price** (Giá hợp đồng riêng của khách hàng).
2.  **Customer Group Price** (Bảng giá nhóm khách hàng: VIP, Dealer...).
3.  **Quantity Break Price** (Giá bậc thang theo số lượng mua).
4.  **Promotion Price** (Giá chiến dịch khuyến mãi đang hiệu lực).
5.  **Target Price List** (Bảng giá chỉ định theo kênh/chi nhánh).
6.  **Default Base Product Price** (Giá bán lẻ niêm yết mặc định).

---

## 16. Phân tách Chiết khấu (Commercial Discount)
$$\text{Base Price} \to \text{Pricing Rule} \to \text{Discount} \to \text{Promotion} \to \text{Final Sales Price}$$
Loại bỏ hoàn toàn duplicate pricing logic giữa Sales, Invoices và Pricing.

---

## 17. Phân định rõ với Tax Engine
*   **PRICING**: Xác định giá bán niêm yết (Selling Price).
*   **TAX ENGINE**: Xác định cách tính thuế và biểu thuế VAT.
*   **DISCOUNT ENGINE**: Xác định chính sách chiết khấu thương mại.
*   Pricing hiển thị cả 2 chế độ: **Price Excl. VAT** và **Price Incl. VAT** để người dùng theo dõi.

---

## 18. Phê duyệt & Quản trị (Approval & Governance)
Quy trình Maker-Checker:
$$\text{DRAFT} \to \text{SUBMITTED} \to \text{PENDING APPROVAL} \to \text{APPROVED} \to \text{ACTIVE}$$
Nếu không đạt yêu cầu: $\to \text{REJECTED}$. Người dùng thông thường không được sửa trực tiếp giá đã Approved.

---

## 19. Audit Trail bất biến
Mọi thao tác thay đổi giá đều lưu vết: `Product`, `Price List`, `Old Price`, `New Price`, `Rule`, `Reason`, `Changed By`, `Changed At`, `Approved By`, `Approved At`.

---

## 20. 10 Màn hình làm việc (Workspaces / Tabs)
1.  **Price Lists**: Bảng giá (Retail, Wholesale, Distributor, Dealer, VIP, Export...).
2.  **Product Prices**: Cơ cấu giá sản phẩm đa bảng giá, đa đơn vị tính UOM.
3.  **Pricing Rules**: Cấu hình Markup % / Margin % theo nhóm sản phẩm / danh mục.
4.  **Customer Pricing**: Bảng giá riêng theo đối tác và nhóm khách hàng.
5.  **Quantity Pricing**: Bậc thang số lượng theo sản phẩm.
6.  **Promotions**: Quản lý chiến dịch giá khuyến mãi có thời hạn.
7.  **Bulk Price Update**: Tính giá hàng loạt từ Inbound Receiving / Goods Receipt.
8.  **Price Approval**: Trung tâm phê duyệt giá Maker-Checker cho Manager & CFO.
9.  **Price History**: Lịch sử giá qua các mốc Effective Dating.
10. **Pricing Audit & Simulator**: Bộ giả lập kiểm tra phân giải giá tức thì cho Sales O2C & Nhật ký Audit Trail.

---

## 21. Tích hợp với Inbound Receiving
Tại Inbound Receiving / Goods Receipt có nút:
`[Thiết lập giá bán]` $\to$ Mở thẳng Pricing Workspace với dữ liệu sản phẩm vừa nhập được nạp sẵn.

---

## 22. Ví dụ chuẩn mực sản phẩm RAM 16GB
*   **Nhập kho**: RAM 16GB, Số lượng: 11 cây, Purchase Cost: $444.444\text{ VND}$.
*   **Kho**: Received = 11 $\implies$ Inventory $+11$.
*   **Costing Engine**: Unit Cost $= 444.444\text{ VND}$.
*   **Pricing Authority**: Price List = Retail, Rule = Markup 50%.
*   **Tính toán**: $444.444 \times 1.50 = 666.666\text{ VND}$ (Margin = 33.33%, Status = ACTIVE).
*   **Sales O2C**: Khi chọn RAM 16GB $\implies$ Pricing Engine tự động trả về `Resolved Price = 666.666 VND`.

---

## 23. Định nghĩa chuẩn đưa vào MODULE_MAP
> **Product Pricing & Price Management** là **Pricing Authority** của NexusSync ERP, chịu trách nhiệm quản lý toàn bộ vòng đời giá bán sản phẩm/dịch vụ, bao gồm Price Lists, Product Prices, Pricing Rules, Customer/Group Pricing, Quantity Pricing, Promotional Pricing, UOM Pricing, Effective Dating, Bulk Pricing, Minimum Margin Control, Manual Override, Approval và Price Audit Trail. Module nhận Actual Cost từ Costing Engine làm cơ sở tham chiếu nhưng không sở hữu hoặc tự tính lại giá vốn. Sales O2C phải sử dụng Resolved Selling Price từ Pricing Authority và không được triển khai logic tính giá riêng.
