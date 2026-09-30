---
name: "erp-cross-module-delegation"
description: >
  Bản đồ phân quyền ghi dữ liệu đơn nhất (4 Single-Writer Authorities: Inventory=M17,
  Accounting=M30, Pricing=M41, Costing=M42) và các thẩm quyền phụ (M07, M08, M13, M25, M28).
  Bắt buộc đối chiếu trước khi thực hiện bất kỳ lệnh ghi database/API nào.
---

# SKILL_02 — CROSS-MODULE DELEGATION MAP (Ai được ghi bảng nào)

## 4 Single-Writer Authority — KHÔNG module nào khác được ghi trực tiếp
| Domain | Authority | Bảng sở hữu | Cách gọi đúng |
|---|---|---|---|
| Inventory | **M17** | `stock_balances`, `stock_ledger`, `stock_reservations`, `lot_balances`, `serial_numbers` | `InventoryService.postTransaction()` qua `POST /api/inventory/transactions` |
| Accounting/GL | **M30** | `accounting_entries` | `AccountingService.postJournal()` qua `POST /api/finance/gl/post` |
| Pricing | **M41** | selling price, tiered discount | `PricingEngine.resolveUnitPrice()` qua `POST /api/pricing/calculate` |
| Costing/COGS | **M42** | `cost_layers`, `cogs_transactions`, `costing_settings` | `CostingEngine` qua `GET/POST /api/cogs/*` |

## Authority phụ thường bị vi phạm nếu không chú ý
| Domain | Authority | Không module nào khác được tự làm |
|---|---|---|
| Item/Customer Master | **M07** | Tự tạo SKU/khách hàng song song |
| Purchase Orders | **M08** | Tự tạo PO ngoài quy trình duyệt |
| Sales Orders | **M13** | Tự sửa trạng thái SO ngoài API chính thức |
| Manufacturing BOM/MO | **M25** | Tự thực thi sản xuất/tạo MO song song |
| Returns/RMA | **M15** | Tự tạo luồng hoàn hàng riêng |
| Audit | **M02** | Tự tạo bảng audit log riêng |
| DMS | **M29** | Tự lưu file rời rạc ngoài kho tài liệu số |
| HR/Payroll disbursement | **M28** | Tự tạo bảng lương/payroll_runs song song |
| Treasury | **M32** | Tự tạo lệnh chi tiền song song |

## Quy tắc gọi (áp dụng cho MỌI module đang nâng cấp)
- Module đang nâng cấp **chỉ được ĐỌC** (`GET`) dữ liệu domain không phải của mình, trừ khi gọi đúng API ghi chính thức của authority đó.
- Nếu cần ghi vào domain của authority khác → luôn dùng đúng `POST` endpoint chính thức của authority đó (bảng ở trên), KHÔNG bao giờ `INSERT`/`UPDATE` thẳng vào bảng DB của họ.
- Nếu API ghi chính thức chưa tồn tại cho nhu cầu cụ thể → dừng lại, đề xuất mở rộng API của authority đó (không tự chế API ghi tắt trong module mình).

## Checklist nhanh trước khi merge code
- [ ] Grep toàn bộ code module đang sửa: có `INSERT/UPDATE/DELETE` trực tiếp vào bảng thuộc authority khác không? → nếu có, SAI.
- [ ] Mọi thao tác ghi kho/kế toán có nằm trong 1 DB transaction, có `idempotencyKey` không?
- [ ] Có bản ghi `audit_logs` cho mỗi state transition không?
