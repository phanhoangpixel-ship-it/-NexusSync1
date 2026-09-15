# Master API Catalog

This catalog maps application endpoints to their respective domains, permissions, and database tables across all 42 ERP modules (M01 – M42). When asked to modify a feature, locate its API group here and consult the corresponding module specification in `/docs/modules/`.

> **Reference Documentation:**
> - Master Architecture Map: `/docs/MODULE_MAP.md`
> - Individual Module Specs & Upgrade Checklists: `/docs/modules/README.md`
> - Core Business Rules & Invariants: `/docs/BUSINESS_RULES.md`

## CORE & IAM

**Entity: Authentication & User Management**
- `POST   /api/auth/login`
- `GET    /api/auth/me`
- `GET    /api/users`
  - **Module:** CORE
  - **Auth:** JWT Required (except login)
  - **Permission:** `users:read`, `users:write`
  - **Database:** `users`, `roles`, `permissions`
  - **Frontend Consumer:** `Login.tsx`, `SystemSettings.tsx`
  - **Status:** Verified

**Entity: RBAC (Role-Based Access Control)**
- `GET    /api/rbac/roles`
- `POST   /api/rbac/roles`
- `GET    /api/rbac/permissions`
- `GET    /api/rbac/users/:id/permissions`
- `POST   /api/rbac/users/:id/permissions`
  - **Module:** CORE
  - **Auth:** JWT Required
  - **Permission:** `rbac:manage`
  - **Database:** `roles`, `permissions`, `role_permissions`, `user_permissions`
  - **Frontend Consumer:** `SystemSettings.tsx`
  - **Status:** Verified

## MASTER DATA

**Entity: Categories**
- `GET    /api/categories` (Fetch all product categories)
- `POST   /api/categories` (Create category with duplicate name check and audit logging)
- `PUT    /api/categories/:id` (Update category name with duplicate name check and audit logging)
- `DELETE /api/categories/:id` (Delete category with FK reference check against products)
  - **Module:** MASTER DATA
  - **Auth:** JWT Required
  - **Permission:** `inventory:read` (GET), `inventory:write` (POST/PUT/DELETE)
  - **Database:** `categories`, `products`, `audit_logs`
  - **Frontend Consumer:** `Inventory.tsx`, `POS.tsx`
  - **Status:** Verified (Phase 2.1 Complete)

**Entity: UOM & Product UOM Conversions**
- `POST   /api/uom/convert` (Calculate quantity conversion between base unit and target UOM)
- `GET    /api/product-uoms` (Fetch product conversion UOMs with optional `productId` filter)
- `POST   /api/product-uoms` (Create UOM conversion with factor > 0, self-conversion block, and atomic duplicate check)
- `PUT    /api/product-uoms/:id` (Update UOM conversion factor, unitName, barcode, price)
- `DELETE /api/product-uoms/:id` (Delete product UOM conversion)
  - **Module:** MASTER DATA
  - **Auth:** JWT Required
  - **Permission:** `inventory:read` (GET/convert), `inventory:write` (POST/PUT/DELETE)
  - **Database:** `product_uoms`, `products`, `audit_logs`
  - **Frontend Consumer:** `Inventory.tsx`, `Purchase.tsx`, `Transfer.tsx`
  - **Status:** Verified (Phase 2.1 Complete)

**Entity: Products**
- `GET    /api/products` (Fetch products with filters: warehouseId, categoryId, status, search)
- `GET    /api/products/:id` (Fetch product detail, UOMs, and stock balances across warehouses)
- `POST   /api/products` (Create product with SKU duplicate check, category FK check, barcode check, atomic product_uoms insertion)
- `PUT    /api/products/:id` (Update product details, SKU, barcode, retail price, and atomic UOM collection)
- `PATCH  /api/products/:id/archive` (Toggle status ACTIVE <-> ARCHIVED)
- `DELETE /api/products/:id` (Delete unreferenced product; blocks deletion if referenced by stockLedger, PO, or SO)
  - **Module:** MASTER DATA
  - **Auth:** JWT Required
  - **Permission:** `inventory:read` (GET), `inventory:write` (POST/PUT/PATCH/DELETE)
  - **Database:** `products`, `categories`, `product_uoms`, `stock_balances`, `stock_ledger`, `purchase_order_items`, `sales_order_items`, `audit_logs`
  - **Frontend Consumer:** `Inventory.tsx`, `POS.tsx`, `Purchase.tsx`
  - **Status:** Verified (Phase 2.2 Complete)

## INVENTORY (WMS)

**Entity: Stock Ledger & Balance**
- `GET    /api/stock`
- `GET    /api/stock/ledger`
- `GET    /api/stock/reservations`
  - **Module:** INVENTORY
  - **Auth:** JWT Required
  - **Permission:** `inventory:read`
  - **Database:** `stock_balances`, `stock_ledger`, `stock_reservations`
  - **Frontend Consumer:** `Stock.tsx`
  - **Status:** Verified

**Entity: Stock Adjustments (Multi-dimensional Adaptive Engine)**
- `GET    /api/stock-adjustments` (Paginated list with filters: warehouse, status, search, page, limit)
- `GET    /api/stock-adjustments/:id` (Detailed record with items, product SKU/names, and serials)
- `POST   /api/stock-adjustments` (Create DRAFT adjustment with auto-generated code and item validations)
- `PUT    /api/stock-adjustments/:id` (Update DRAFT adjustment header and item collection)
- `PATCH  /api/stock-adjustments/:id` (Partial update DRAFT adjustment)
- `POST   /api/stock-adjustments/:id/duplicate` (Duplicate DRAFT adjustment to a new DRAFT document without side effects)
- `POST   /api/stock-adjustments/:id/approve` (Atomic approval, single transaction: Inventory + Costing + Serials/Lots + Double-entry Accounting)
- `POST   /api/stock-adjustments/:id/reject` (Reject DRAFT with audit reason)
- `POST   /api/stock-transfers`
  - **Module:** INVENTORY
  - **Auth:** JWT Required
  - **Permission:** `stock_adjustment.view`, `stock_adjustment.create`, `stock_adjustment.approve`, `stock_adjustment.reject`
  - **Database:** `stock_adjustments`, `stock_adjustment_items`, `stock_adjustment_serials`, `stock_balances`, `stock_ledger`, `lot_balances`, `serial_numbers`, `serial_history`, `cost_layers`, `cogs_transactions`, `accounting_entries`, `audit_logs`
  - **Frontend Consumer:** `StockAdjustment.tsx`, `Inventory.tsx`
  - **Status:** Verified (36/36 API Route Tests + Targeted Duplicate Tests Passing)

**Entity: Stocktake & Inventory Counting**
- `GET    /api/stocktakes`
- `GET    /api/stocktakes/:id`
- `POST   /api/stocktakes` (Create Draft)
- `PUT    /api/stocktakes/:id` (Update Draft)
- `POST   /api/stocktakes/:id/start` (Start counting & snapshot)
- `POST   /api/stocktakes/:id/count` (Input count with multi-round history)
- `POST   /api/stocktakes/:id/submit-approval` (Submit for approval)
- `POST   /api/stocktakes/:id/approve` (Approve count & variance)
- `POST   /api/stocktakes/:id/complete` (Reconcile balances & generate adjustment)
- `POST   /api/stocktakes/:id/cancel` (Cancel stocktake)
  - **Module:** INVENTORY
  - **Auth:** JWT Required
  - **Permission:** `stocktake.view`, `stocktake.create`, `stocktake.edit`, `stocktake.start`, `stocktake.count`, `stocktake.approve`, `stocktake.complete`, `stocktake.cancel`
  - **Database:** `stocktakes`, `stocktake_items`, `stocktake_counts`, `stock_adjustments`, `stock_ledger`, `stock_balances`, `accounting_entries`, `activity_logs`
  - **Frontend Consumer:** `Stocktake.tsx`
  - **Status:** Verified (17/17 Integration Tests Passing)

## PURCHASE (P2P)

**Entity: Suppliers**
- `GET    /api/suppliers`
- `GET    /api/suppliers/:id`
- `POST   /api/suppliers`
- `PUT    /api/suppliers/:id`
  - **Module:** PURCHASE
  - **Auth:** JWT Required
  - **Permission:** `purchase:read`, `purchase:write`
  - **Database:** `suppliers`, `supplier_contacts`, `supplier_bank_accounts`
  - **Frontend Consumer:** `Suppliers.tsx`
  - **Status:** Verified

**Entity: Purchase Orders**
- `GET    /api/purchase-orders`
- `GET    /api/purchase-orders/:id/items`
- `POST   /api/purchase-orders`
  - **Module:** PURCHASE
  - **Auth:** JWT Required
  - **Permission:** `purchase:read`, `purchase:write`
  - **Database:** `purchase_orders`, `purchase_order_items`
  - **Frontend Consumer:** `Purchase.tsx`
  - **Status:** Verified

**Entity: Goods Receipts**
- `GET    /api/goods-receipts`
- `POST   /api/goods-receipts`
  - **Module:** PURCHASE / INVENTORY
  - **Auth:** JWT Required
  - **Permission:** `inventory:write`, `purchase:write`
  - **Database:** `goods_receipts`, `goods_receipt_items`, `stock_ledger`
  - **Frontend Consumer:** `Purchase.tsx`
  - **Status:** Verified

## SALES (O2C)

**Entity: Customers**
- `GET    /api/customers`
- `POST   /api/customers`
- `PUT    /api/customers/:id`
  - **Module:** SALES
  - **Auth:** JWT Required
  - **Permission:** `sales:read`, `sales:write`
  - **Database:** `customers`
  - **Frontend Consumer:** `Customers.tsx`
  - **Status:** Verified

**Entity: Sales Orders & POS**
- `POST   /api/sales-orders/pos`
  - **Module:** SALES
  - **Auth:** JWT Required
  - **Permission:** `pos:sell`
  - **Database:** `sales_orders`, `sales_order_items`, `goods_issues`
  - **Frontend Consumer:** `POS.tsx`
  - **Status:** Verified

**Entity: Invoices**
- `GET    /api/invoices`
- `GET    /api/invoices/:id`
- `POST   /api/invoices`
- `PUT    /api/invoices/:id/cancel`
  - **Module:** SALES / FINANCE
  - **Auth:** JWT Required
  - **Permission:** `invoice:read`, `invoice:write`
  - **Database:** `invoices`, `invoice_items`
  - **Frontend Consumer:** `Invoices.tsx`
  - **Status:** Verified

## FINANCE & ACCOUNTING

**Entity: Payments**
- `GET    /api/payments`
- `POST   /api/accounting/payments`
  - **Module:** FINANCE
  - **Auth:** JWT Required
  - **Permission:** `payment:read`, `payment:write`
  - **Database:** `payments`, `accounting_entries`
  - **Frontend Consumer:** `Payments.tsx`
  - **Status:** Verified

**Entity: Accounting & GL**
- `GET    /api/accounting/summary`
- `GET    /api/accounting/revenue`
- `GET    /api/accounting/receivables/:customerId/statement`
- `POST   /api/accounting/entries`
  - **Module:** FINANCE
  - **Auth:** JWT Required
  - **Permission:** `accounting:read`, `accounting:write`
  - **Database:** `accounting_entries`, `accounting_accounts`
  - **Frontend Consumer:** `Accounting.tsx`
  - **Status:** Verified

**Entity: Costing (COGS)**
- `GET    /api/cogs/transactions`
- `GET    /api/cogs/cost-layers`
- `POST   /api/cogs/calculate-order`
  - **Module:** FINANCE
  - **Auth:** Internal/System or JWT Required
  - **Permission:** `accounting:read`
  - **Database:** `cogs_transactions`, `cost_layers`
  - **Frontend Consumer:** Background Service / `Accounting.tsx`
  - **Status:** Verified

## COMMISSION & SALES INCENTIVE (MODULE 34)

**Entity: Commission & Sales Incentive Engine**
- `GET    /api/commission/dashboard` (KPI metrics, total gross/net, quota attainment)
- `GET    /api/commission/plans` (Fetch all plans with tiered rules)
- `POST   /api/commission/plans` (Create commission plan with tiered rules)
- `PUT    /api/commission/plans/:id` (Update commission plan and rules)
- `GET    /api/commission/quotas` (Fetch sales reps quotas & attainment)
- `POST   /api/commission/quotas` (Assign KPI sales quota)
- `GET    /api/commission/calculations` (Fetch audit log of order commissions)
- `POST   /api/commission/calculate` (Evaluate or recalculate order commission)
- `GET    /api/commission/payouts` (Fetch settlement batches)
- `GET    /api/commission/payouts/:id` (Fetch settlement batch items & beneficiary breakdown)
- `POST   /api/commission/payouts` (Generate payout settlement batch)
- `POST   /api/commission/payouts/:id/approve` (Approve payout batch & post GL accrual Nợ 6418 / Có 3388)
- `POST   /api/commission/payouts/:id/pay` (Disburse payout batch & post GL payment Nợ 3388 / Có 1111/1121)
- `GET    /api/commission/analytics` (Leaderboard & top sales rep revenue performance)
  - **Module:** MODULE 34 (COMMISSION)
  - **Auth:** JWT Required
  - **Permission:** `commission.view`, `commission.plan.manage`, `commission.quota.manage`, `commission.calculate`, `commission.approve`, `commission.payout`
  - **Database:** `commission_plans`, `commission_rules`, `sales_quotas`, `commission_calculations`, `commission_payouts`, `commission_payout_items`, `journal_entries`
  - **Frontend Consumer:** `Commission.tsx`
  - **Status:** Verified (Phase 3 Complete)

