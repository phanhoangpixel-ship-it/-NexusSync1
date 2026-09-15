import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, primaryKey, uniqueIndex, index } from "drizzle-orm/sqlite-core";

// 1. Identity & RBAC
export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(), // e.g. SUPER_ADMIN, MANAGER, SALES
});

export const permissions = sqliteTable("permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. inventory:read, pos:sell
});

export const rolePermissions = sqliteTable("role_permissions", {
  roleId: integer("role_id").notNull().references(() => roles.id),
  permissionId: integer("permission_id").notNull().references(() => permissions.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.roleId, t.permissionId] })
}));

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  roleId: integer("role_id").references(() => roles.id),
  branchId: integer("branch_id"), // NULL for GLOBAL
  status: text("status").default("ACTIVE"),
});

export const userPermissions = sqliteTable("user_permissions", {
  userId: integer("user_id").notNull().references(() => users.id),
  permissionId: integer("permission_id").notNull().references(() => permissions.id),
  isGranted: integer("is_granted", { mode: 'boolean' }).notNull(), // true = allow, false = deny
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.permissionId] })
}));

// 2. Master Data: Products & Inventory
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  barcode: text("barcode"),
  categoryId: integer("category_id").references(() => categories.id),
  productType: text("product_type").default("FINISHED_GOOD"), // FINISHED_GOOD, RAW_MATERIAL, SEMI_FINISHED, SERVICE, CONSUMABLE
  baseUnit: text("base_unit").notNull().default("Cái"), // e.g. Cái, Chiếc, Chai
  purchaseUnit: text("purchase_unit"),
  salesUnit: text("sales_unit"),
  retailPrice: real("retail_price").notNull(),
  costPrice: real("cost_price"),
  status: text("status").default("ACTIVE"), // ACTIVE, ARCHIVED (Soft delete)
  isSerialTracked: integer("is_serial_tracked", { mode: 'boolean' }).notNull().default(false), // Serial Tracking flag
  isLotTracked: integer("is_lot_tracked", { mode: 'boolean' }).notNull().default(false), // Lot Tracking flag
  isManufacturingTarget: integer("is_manufacturing_target", { mode: "boolean" }).notNull().default(false),
  
  // WMS Engine: 3-State Stock (Always tracked in baseUnit)
  stockPhysical: integer("stock_physical").default(0).notNull(),
  stockReserved: integer("stock_reserved").default(0).notNull(),
  stockAvailable: integer("stock_available").default(0).notNull(),

  // Inventory Thresholds & Safety Alerts (Cảnh báo tồn kho)
  minStock: integer("min_stock").default(10).notNull(), // Tồn tối thiểu
  safetyStock: integer("safety_stock").default(10).notNull(), // Safety stock
  reorderPoint: integer("reorder_point").default(20).notNull(), // Điểm đặt hàng lại (ROP)
  maxStock: integer("max_stock").default(100).notNull(), // Tồn tối đa (Max Stock Cap)
  reorderQty: integer("reorder_qty").default(50).notNull(), // Lượng đặt hàng tiêu chuẩn (EOQ / Batch)
  leadTimeDays: integer("lead_time_days").default(3).notNull(), // Thời gian giao hàng NCC (ngày)
  preferredSupplierId: integer("preferred_supplier_id").references(() => suppliers.id), // Nhà cung cấp ưu tiên
});

// Multi-UOM: Converted Units
export const productUoms = sqliteTable("product_uoms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  unitName: text("unit_name").notNull(), // e.g. Thùng, Lốc
  conversionFactor: integer("conversion_factor").notNull(), // e.g. 1 Thùng = 12 Cái
  barcode: text("barcode"),
  price: real("price"), // Optional specific price, else fallback to retailPrice * conversionFactor
});

// 4. Warehouse & Locations
export const warehouses = sqliteTable("warehouses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. WH-01
  name: text("name").notNull(),
  type: text("type").notNull().default("MAIN"), // MAIN, BRANCH, STORE, TRANSIT, VIRTUAL
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  isDefault: integer("is_default", { mode: 'boolean' }).notNull().default(false),
  address: text("address"),
  description: text("description"),
  branchId: integer("branch_id"),
});

export const warehouseLocations = sqliteTable("warehouse_locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  type: text("type").notNull(), // ZONE, RACK, SHELF, BIN
  parentId: integer("parent_id"), // self referencing to warehouseLocations.id
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  capacity: real("capacity"),
  isPicking: integer("is_picking", { mode: 'boolean' }).notNull().default(false),
  isReceiving: integer("is_receiving", { mode: 'boolean' }).notNull().default(false),
  isQuarantine: integer("is_quarantine", { mode: 'boolean' }).notNull().default(false),
  isDamaged: integer("is_damaged", { mode: 'boolean' }).notNull().default(false),
});

// 5. Stock Balances & Ledger
export const stockBalances = sqliteTable("stock_balances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  locationId: integer("location_id").references(() => warehouseLocations.id), // Optional, if tracked at location level
  stockPhysical: integer("stock_physical").default(0).notNull(),
  stockReserved: integer("stock_reserved").default(0).notNull(),
  stockAvailable: integer("stock_available").default(0).notNull(),
});

export const stockLedger = sqliteTable("stock_ledger", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  locationId: integer("location_id").references(() => warehouseLocations.id),
  lotId: integer("lot_id"), // Optional reference to lots.id
  type: text("type").notNull(), // IN, OUT, ADJUSTMENT, TRANSFER
  referenceNo: text("reference_no").notNull(), // e.g. ADJ-001, PO-001, SO-001, LOT-001
  quantity: integer("quantity").notNull(), // positive for IN, negative for OUT
  balanceAfter: integer("balance_after").notNull(), // Represents the physical balance after the transaction
  notes: text("notes"),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const stockReservations = sqliteTable("stock_reservations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  locationId: integer("location_id").references(() => warehouseLocations.id),
  quantity: integer("quantity").notNull(),
  referenceNo: text("reference_no").notNull(), // SO-xxx, MO-xxx, or Manual
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, RELEASED, FULFILLED
  notes: text("notes"),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// 7. Purchasing & Goods Receipt
export const suppliers = sqliteTable("suppliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  shortName: text("short_name"),
  supplierType: text("supplier_type").default("Manufacturer"), // Manufacturer, Distributor, Wholesaler, Service
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, INACTIVE, BLOCKED, ARCHIVED
  contactInfo: text("contact_info"), // keep this to avoid prompt
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  taxCode: text("tax_code"),
  taxName: text("tax_name"),
  taxAddress: text("tax_address"),
  companyName: text("company_name"),
  address: text("address"),
  paymentTerms: text("payment_terms").default("NET 30"), // COD, NET 7, NET 15, NET 30, NET 45, NET 60, CUSTOM
  creditLimit: real("credit_limit").default(500000000),
  currency: text("currency").default("VND"),
  performanceTier: text("performance_tier").default("TIER_B"),
  compositeScore: real("composite_score").default(75),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }),
});

export const supplierContacts = sqliteTable("supplier_contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  contactName: text("contact_name").notNull(),
  department: text("department").default("Sales"), // Sales, Accounting, Purchasing, Technical, Other
  position: text("position"),
  phone: text("phone"),
  email: text("email"),
  note: text("note"),
  isPrimary: integer("is_primary").notNull().default(0),
});

export const supplierBankAccounts = sqliteTable("supplier_bank_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountHolder: text("account_holder").notNull(),
  branch: text("branch"),
  currency: text("currency").default("VND"),
  isDefault: integer("is_default").notNull().default(0),
  status: text("status").notNull().default("ACTIVE"),
});

export const purchaseOrders = sqliteTable("purchase_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. PO-2023-001
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  status: text("status").notNull().default("DRAFT"), // DRAFT, PENDING_RECEIPT, PARTIALLY_RECEIVED, COMPLETED, CANCELLED
  paymentStatus: text("payment_status").notNull().default("UNPAID"), // UNPAID, PARTIAL, PAID, REFUNDED
  amountPaid: real("amount_paid").notNull().default(0),
  totalAmount: real("total_amount").default(0),
  expectedDate: integer("expected_date", { mode: 'timestamp' }),
  dueDate: integer("due_date", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

export const purchaseOrderItems = sqliteTable("purchase_order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  poId: integer("po_id").notNull().references(() => purchaseOrders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  uomId: integer("uom_id").references(() => productUoms.id), // If null, means baseUnit
  quantity: integer("quantity").notNull(), // Quantity in specified UOM
  unitCost: real("unit_cost").notNull(),
  receivedQuantity: integer("received_quantity").notNull().default(0), // Quantity received so far (in specified UOM)
});

export const goodsReceipts = sqliteTable("goods_receipts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. GR-2023-001
  poId: integer("po_id").notNull().references(() => purchaseOrders.id),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  status: text("status").notNull().default("COMPLETED"), // DRAFT, COMPLETED
  receivedDate: integer("received_date", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  createdBy: integer("created_by").notNull().references(() => users.id),
  notes: text("notes"),
});

export const goodsReceiptItems = sqliteTable("goods_receipt_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  grId: integer("gr_id").notNull().references(() => goodsReceipts.id),
  poItemId: integer("po_item_id").notNull().references(() => purchaseOrderItems.id),
  productId: integer("product_id").notNull().references(() => products.id),
  uomId: integer("uom_id").references(() => productUoms.id),
  quantity: integer("quantity").notNull(), // Received qty in specified UOM
  baseQuantity: integer("base_quantity").notNull(), // Received qty converted to base unit
  locationId: integer("location_id").references(() => warehouseLocations.id),
  lotId: integer("lot_id"), // Optional reference to lots.id
});

// 8. Goods Issue (Stock Issue)
export const goodsIssues = sqliteTable("goods_issues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. GI-2023-001
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  status: text("status").notNull().default("CONFIRMED"), // DRAFT, CONFIRMED, CANCELLED
  issueDate: integer("issue_date", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  createdBy: integer("created_by").notNull().references(() => users.id),
  confirmedBy: integer("confirmed_by").references(() => users.id),
  confirmedAt: integer("confirmed_at", { mode: 'timestamp' }),
  cancelledBy: integer("cancelled_by").references(() => users.id),
  cancelledAt: integer("cancelled_at", { mode: 'timestamp' }),
  salesOrderId: integer("sales_order_id").references(() => salesOrders.id),
  totalCogs: real("total_cogs").default(0),
  notes: text("notes"),
  reason: text("reason"), // e.g. "Bán hàng", "Sản xuất", "Sử dụng nội bộ", "Hư hỏng/Hủy", "Khác"
});

export const goodsIssueItems = sqliteTable("goods_issue_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  giId: integer("gi_id").notNull().references(() => goodsIssues.id),
  productId: integer("product_id").notNull().references(() => products.id),
  uomId: integer("uom_id").references(() => productUoms.id),
  quantity: integer("quantity").notNull(), // Issued qty in specified UOM
  baseQuantity: integer("base_quantity").notNull(), // Issued qty converted to base unit
  locationId: integer("location_id").references(() => warehouseLocations.id),
  lotId: integer("lot_id"), // Optional reference to lots.id
  serialNumbers: text("serial_numbers", { mode: 'json' }), // Added for Serial Tracking
});

// 9. Stock Transfers (Chuyển kho)
export const stockTransfers = sqliteTable("stock_transfers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. ST-2023-001
  fromWarehouseId: integer("from_warehouse_id").notNull().references(() => warehouses.id),
  toWarehouseId: integer("to_warehouse_id").notNull().references(() => warehouses.id),
  fromLocationId: integer("from_location_id").references(() => warehouseLocations.id),
  toLocationId: integer("to_location_id").references(() => warehouseLocations.id),
  status: text("status").notNull().default("DRAFT"), // DRAFT, SUBMITTED, APPROVED, IN_TRANSIT, RECEIVED
  requestedBy: integer("requested_by").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const stockTransferItems = sqliteTable("stock_transfer_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transferId: integer("transfer_id").notNull().references(() => stockTransfers.id),
  productId: integer("product_id").notNull().references(() => products.id),
  uomId: integer("uom_id").references(() => productUoms.id),
  fromLocationId: integer("from_location_id").references(() => warehouseLocations.id),
  toLocationId: integer("to_location_id").references(() => warehouseLocations.id),
  quantity: integer("quantity").notNull(),
  baseQuantity: integer("base_quantity").notNull(),
  serialNumbers: text("serial_numbers", { mode: 'json' }), // Added for Phase 2 Serial Integration
});

// 10. Stocktake (Kiểm kê kho)
export const stocktakes = sqliteTable("stocktakes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. STK-2023-001
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  status: text("status").notNull().default("DRAFT"), // DRAFT, COUNTING, COUNTED, RECOUNT_REQUIRED, RECOUNTED, PENDING_APPROVAL, COMPLETED, CANCELLED
  notes: text("notes"),
  isBlindCount: integer("is_blind_count", { mode: 'boolean' }).notNull().default(false),
  varianceThreshold: real("variance_threshold").notNull().default(10), // Qty
  varianceThresholdPercent: real("variance_threshold_percent"), // Percent
  recountRequired: integer("recount_required", { mode: 'boolean' }).notNull().default(false),
  adjustmentDocumentId: integer("adjustment_document_id"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: integer("approved_at", { mode: 'timestamp' }),
  completedBy: integer("completed_by").references(() => users.id),
  cancelledBy: integer("cancelled_by").references(() => users.id),
  cancelledAt: integer("cancelled_at", { mode: 'timestamp' }),
  cancelReason: text("cancel_reason"),
  startedAt: integer("started_at", { mode: 'timestamp' }),
  completedAt: integer("completed_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const stocktakeItems = sqliteTable("stocktake_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stocktakeId: integer("stocktake_id").notNull().references(() => stocktakes.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  productId: integer("product_id").notNull().references(() => products.id),
  locationId: integer("location_id").references(() => warehouseLocations.id),
  lotId: integer("lot_id"),
  serialNumber: text("serial_number"),
  systemQuantity: real("system_quantity").notNull(),
  systemQuantityAtStart: real("system_quantity_at_start").notNull().default(0), // Captured at COUNTING
  countedQuantity: real("counted_quantity").notNull(), // Deprecated / kept for simpler compat, or represents final/latest
  difference: real("difference").notNull(), // Qty variance
  variancePercent: real("variance_percent").notNull().default(0),
  finalQuantity: real("final_quantity").notNull().default(0),
  adjustmentRequired: integer("adjustment_required", { mode: 'boolean' }).notNull().default(false),
  count1Quantity: real("count1_quantity"),
  count2Quantity: real("count2_quantity"),
  count1UserId: integer("count1_user_id"),
  count2UserId: integer("count2_user_id"),
  count1At: integer("count1_at", { mode: 'timestamp' }),
  count2At: integer("count2_at", { mode: 'timestamp' }),
  recountReason: text("recount_reason"),
  status: text("status").notNull().default('PENDING'),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const stocktakeCounts = sqliteTable("stocktake_counts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stocktakeItemId: integer("stocktake_item_id").notNull().references(() => stocktakeItems.id),
  countNumber: integer("count_number").notNull(), // 1, 2, 3...
  countedQuantity: real("counted_quantity").notNull(),
  countedBy: integer("counted_by").notNull().references(() => users.id),
  countedAt: integer("counted_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  reason: text("reason"),
  notes: text("notes")
});

// 11. Stock Adjustment (Điều chỉnh tồn kho)
export const stockAdjustments = sqliteTable("stock_adjustments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. ADJ-2026-001
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  adjustmentType: text("adjustment_type").notNull().default("MANUAL"), // DAMAGE, SCRAP, EXPIRED, LOSS, FOUND, STOCKTAKE_VARIANCE, MANUAL
  direction: text("direction").notNull().default("INCREASE"), // INCREASE, DECREASE
  reasonCode: text("reason_code"),
  reason: text("reason").notNull(),
  sourceType: text("source_type"), // e.g. STOCKTAKE
  sourceId: text("source_id"),
  status: text("status").notNull().default("DRAFT"), // DRAFT, APPROVED, REJECTED
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  rejectedBy: integer("rejected_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  approvedAt: integer("approved_at", { mode: 'timestamp' }),
  rejectedAt: integer("rejected_at", { mode: 'timestamp' }),
  postedAt: integer("posted_at", { mode: 'timestamp' }),
});

export const stockAdjustmentItems = sqliteTable("stock_adjustment_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adjustmentId: integer("adjustment_id").notNull().references(() => stockAdjustments.id),
  productId: integer("product_id").notNull().references(() => products.id),
  locationId: integer("location_id").references(() => warehouseLocations.id),
  lotId: integer("lot_id").references(() => lots.id),
  direction: text("direction").notNull().default("INCREASE"), // INCREASE, DECREASE
  quantity: real("quantity").notNull(),
  unitCost: real("unit_cost"),
  totalCost: real("total_cost"),
  currentStockSnapshot: real("current_stock_snapshot"),
  newStockSnapshot: real("new_stock_snapshot"),
  notes: text("notes"),
  // Backward compatibility fields
  type: text("type").default("INCREASE"), // INCREASE / DECREASE
  currentStock: real("current_stock").default(0),
  newStock: real("new_stock").default(0),
  itemNotes: text("item_notes"),
  serialNumber: text("serial_number"),
  serialNumbers: text("serial_numbers", { mode: 'json' }),
});

export const stockAdjustmentSerials = sqliteTable("stock_adjustment_serials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adjustmentItemId: integer("adjustment_item_id").notNull().references(() => stockAdjustmentItems.id),
  serialId: integer("serial_id").references(() => serialNumbers.id),
  serialNumber: text("serial_number").notNull(),
});

// 12. Lots & Batches (Quản lý Lô Hàng)
export const lots = sqliteTable("lots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lotNumber: text("lot_number").notNull(), // e.g. LOT-20260814-01, BATCH-A10
  productId: integer("product_id").notNull().references(() => products.id),
  manufactureDate: integer("manufacture_date", { mode: 'timestamp' }), // Ngày sản xuất
  expiryDate: integer("expiry_date", { mode: 'timestamp' }), // Hạn sử dụng
  supplierId: integer("supplier_id").references(() => suppliers.id),
  initialQuantity: integer("initial_quantity").notNull().default(0),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, NEAR_EXPIRY, EXPIRED, HOLD, DEPLETED
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const lotBalances = sqliteTable("lot_balances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lotId: integer("lot_id").notNull().references(() => lots.id),
  productId: integer("product_id").notNull().references(() => products.id),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  locationId: integer("location_id").references(() => warehouseLocations.id),
  stockPhysical: integer("stock_physical").notNull().default(0), // Tồn vật lý theo lô
  stockReserved: integer("stock_reserved").notNull().default(0), // Tồn bảo lưu theo lô
  stockAvailable: integer("stock_available").notNull().default(0), // Tồn khả dụng theo lô
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  auditCode: text("audit_code").notNull().unique(), // e.g. AUD-000001
  userId: integer("user_id").notNull(),
  username: text("username").notNull(),
  userName: text("user_name"),
  role: text("role").notNull().default("USER"),
  branchId: integer("branch_id"),
  branchName: text("branch_name"),
  warehouseId: integer("warehouse_id"),
  warehouseName: text("warehouse_name"),
  
  action: text("action").notNull(), // CREATE, READ, UPDATE, DELETE, ARCHIVE, RESTORE, APPROVE, REJECT, SUBMIT, CANCEL, POST, REVERSE, TRANSFER, RECEIVE, ISSUE, ADJUST, STOCKTAKE, RESERVE, RELEASE, LOGIN, LOGOUT, EXPORT, PRINT, SYNC, IMPORT, PRICE_OVERRIDE, DISCOUNT, PERMISSION_DENIED
  entityType: text("entity_type").notNull(), // PRODUCT, STOCK_RECEIPT, STOCK_ADJUSTMENT, SALES_ORDER, PURCHASE_ORDER, ROLE, PERMISSION, USER, INVOICE, PAYMENT, WAREHOUSE, LOCATION, LOT, SERIAL, ACCOUNTING_ENTRY, AUTH
  entityId: text("entity_id").notNull(), // e.g. "PROD-000123", "123", "GR-000456"
  module: text("module").notNull(), // AUTH, USER, RBAC, PRODUCT, INVENTORY, SALES, PURCHASE, CUSTOMER, SUPPLIER, PAYMENT, INVOICE, ACCOUNTING, HR, REPORT, SYSTEM
  
  ipAddress: text("ip_address"),
  deviceId: text("device_id"),
  deviceType: text("device_type").default("WEB"), // WEB, ANDROID, MOBILE
  appVersion: text("app_version").default("1.0.0"),
  browser: text("browser"),
  
  sessionId: text("session_id"),
  requestId: text("request_id"),
  correlationId: text("correlation_id"), // e.g. CORR-000001
  
  beforeData: text("before_data"), // JSON text
  afterData: text("after_data"), // JSON text
  changedFields: text("changed_fields"), // JSON text
  
  result: text("result").notNull().default("SUCCESS"), // SUCCESS, FAILED, PERMISSION_DENIED
  reason: text("reason"), // Reason/comment
  metadata: text("metadata"), // JSON string
  
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const activityLogs = sqliteTable("activity_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(), // CREATE, UPDATE, DELETE
  entity: text("entity").notNull(), // e.g., 'products', 'users'
  entityId: integer("entity_id").notNull(),
  details: text("details"), // JSON payload of before/after
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// 13. Serial Numbers & Serial Profiles (Quản lý Số Serial & Hồ sơ Ngành hàng)
export const serialProfiles = sqliteTable("serial_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), // e.g. "Thiết bị y tế", "Điện tử & Viễn thông", "Máy móc công nghiệp", "Thiết bị bảo hành"
  code: text("code").notNull().unique(), // e.g. "MEDICAL", "ELECTRONICS", "MACHINERY", "WARRANTY", "CUSTOM"
  categoryType: text("category_type").notNull().default("CUSTOM"), // MEDICAL, ELECTRONICS, MACHINERY, WARRANTY, CUSTOM
  description: text("description"),
  prefix: text("prefix").notNull().default("SN-"), // e.g. "MED-", "ELEC-", "MCH-", "WAR-"
  warrantyMonths: integer("warranty_months").notNull().default(12),
  autoGeneratePattern: text("auto_generate_pattern").default("{PREFIX}{YYYY}{MM}-{RAND6}"),
  fieldsSchema: text("fields_schema"), // JSON array: [{ key, label, type, required, placeholder, options }]
  isSystem: integer("is_system", { mode: 'boolean' }).notNull().default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const serialNumbers = sqliteTable("serial_numbers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serialNumber: text("serial_number").notNull().unique(), // Unique serial code
  productId: integer("product_id").notNull().references(() => products.id),
  lotId: integer("lot_id").references(() => lots.id), // Gắn serial với Lot / Batch
  profileId: integer("profile_id").references(() => serialProfiles.id), // Gắn với Profile
  warehouseId: integer("warehouse_id").references(() => warehouses.id), // Kho hiện tại
  locationId: integer("location_id").references(() => warehouseLocations.id), // Vị trí kho
  status: text("status").notNull().default("IN_STOCK"), // IN_STOCK, RESERVED, SOLD, IN_USE, WARRANTY, DEFECTIVE, RETURNED, DISPOSED
  customerName: text("customer_name"), // Khách hàng sở hữu / Bệnh viện / Cơ sở
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  customerAddress: text("customer_address"),
  manufactureDate: integer("manufacture_date", { mode: 'timestamp' }),
  warrantyStartDate: integer("warranty_start_date", { mode: 'timestamp' }), // Ngày kích hoạt bảo hành
  warrantyEndDate: integer("warranty_end_date", { mode: 'timestamp' }), // Hạn bảo hành
  warrantyMonths: integer("warranty_months").default(12),
  customAttributes: text("custom_attributes"), // JSON key-value: { udiCode, macAddress, imei, engineNo, runHours, calibDate, nextCalibDate, hospitalDept, firmwareVersion... }
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const serialHistory = sqliteTable("serial_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serialId: integer("serial_id").notNull().references(() => serialNumbers.id),
  action: text("action").notNull(), // CREATED, INWARD, OUTWARD, TRANSFER, WARRANTY_CLAIM, WARRANTY_REPAIRED, STATUS_CHANGE, QC_PASS, QC_FAIL, SOLD, LOT_ASSIGN
  referenceNo: text("reference_no"),
  fromWarehouseId: integer("from_warehouse_id"),
  toWarehouseId: integer("to_warehouse_id"),
  fromStatus: text("from_status"),
  toStatus: text("to_status"),
  notes: text("notes"),
  performedBy: integer("performed_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});


// 13.5 Serial Transactions (Mapping table)
export const serialTransactions = sqliteTable("serial_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serialId: integer("serial_id").notNull().references(() => serialNumbers.id),
  transactionType: text("transaction_type").notNull(), // 'RECEIPT', 'ISSUE', 'SALE', 'TRANSFER', 'RETURN'
  referenceId: integer("reference_id").notNull(), 
  referenceItemId: integer("reference_item_id"), 
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date())
});


// 14. Stock Alerts & Purchase Recommendations (Cảnh báo tồn kho & Đề xuất mua hàng)
export const purchaseRecommendations = sqliteTable("purchase_recommendations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. REC-20260814-001
  productId: integer("product_id").notNull().references(() => products.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  currentStock: integer("current_stock").notNull(),
  minStock: integer("min_stock").notNull(),
  reorderPoint: integer("reorder_point").notNull(),
  maxStock: integer("max_stock").notNull(),
  recommendedQty: integer("recommended_qty").notNull(),
  estimatedUnitCost: real("estimated_unit_cost"),
  estimatedTotalCost: real("estimated_total_cost"),
  alertType: text("alert_type").notNull(), // 'OUT_OF_STOCK', 'LOW_STOCK', 'EXPIRY_REPLACEMENT', 'MANUAL'
  priority: text("priority").notNull().default("HIGH"), // 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
  status: text("status").notNull().default("PENDING"), // 'PENDING', 'APPROVED', 'CONVERTED_TO_PO', 'DISMISSED'
  generatedPoId: integer("generated_po_id").references(() => purchaseOrders.id),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});



// 15. Sales & POS
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  companyName: text("company_name"),
  taxCode: text("tax_code"),
  billingEmail: text("billing_email"),
  customerGroup: text("customer_group").default("RETAIL"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const salesOrders = sqliteTable("sales_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  status: text("status").notNull().default("DRAFT"), // DRAFT, RESERVED, ISSUED, PAID, CANCELLED, REFUNDED
  paymentStatus: text("payment_status").notNull().default("UNPAID"), // UNPAID, PARTIAL, PAID, REFUNDED
  totalAmount: real("total_amount").notNull().default(0), 
  discountAmount: real("discount_amount").notNull().default(0),
  taxAmount: real("tax_amount").notNull().default(0),
  finalAmount: real("final_amount").notNull().default(0),
  amountPaid: real("amount_paid").notNull().default(0),
  dueDate: integer("due_date", { mode: 'timestamp' }),
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const salesOrderItems = sqliteTable("sales_order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").references(() => salesOrders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  uomId: integer("uom_id").references(() => productUoms.id),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  discountAmount: real("discount_amount").notNull().default(0),
  taxRate: real("tax_rate").notNull().default(0), 
  subtotal: real("subtotal").notNull(), 
  notes: text("notes"),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").references(() => salesOrders.id),
  poId: integer("po_id").references(() => purchaseOrders.id),
  salesReturnId: integer("sales_return_id").references(() => salesReturns.id),
  purchaseReturnId: integer("purchase_return_id").references(() => purchaseReturns.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  customerId: integer("customer_id").references(() => customers.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  paymentType: text("payment_type").notNull().default("IN"),
  paymentMethod: text("payment_method").notNull(), // CASH, CREDIT_CARD, BANK_TRANSFER
  amount: real("amount").notNull(),
  referenceNo: text("reference_no"),
  status: text("status").notNull().default("SUCCESS"),
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});


export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceNumber: text("invoice_number").notNull().unique(), // e.g. VAT-... or RET-...
  orderId: integer("order_id").references(() => salesOrders.id),
  type: text("type").notNull(), // RETAIL, VAT
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name"),
  companyName: text("company_name"),
  taxCode: text("tax_code"),
  address: text("address"),
  billingEmail: text("billing_email"),
  totalAmount: real("total_amount").notNull(),
  discount: real("discount").default(0),
  taxRate: real("tax_rate").default(0),
  taxAmount: real("tax_amount").notNull(),
  finalAmount: real("final_amount").notNull(),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status"),
  status: text("status").notNull().default("DRAFT"), // DRAFT, PENDING, ISSUED, REJECTED, CANCELLED, ADJUSTED, REPLACED
  adjustmentRefId: integer("adjustment_ref_id"),
  replacedRefId: integer("replaced_ref_id"),
  rejectionReason: text("rejection_reason"),
  isCustomerUpdated: integer("is_customer_updated", { mode: 'boolean' }).default(false),
  issueDate: integer("issue_date", { mode: 'timestamp' }),
  dueDate: integer("due_date", { mode: 'timestamp' }),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }),
});

export const invoiceItems = sqliteTable("invoice_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  discountAmount: real("discount_amount").notNull().default(0),
  taxRate: real("tax_rate").notNull().default(0), // Multi-VAT rates support
  taxAmount: real("tax_amount").notNull().default(0),
  subtotal: real("subtotal").notNull(),
});

// 16. Accounting & Finance
export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. EXP-2026-0001
  category: text("category").notNull(), // OPERATING, RENT, SALARY, UTILITIES, MARKETING, FREIGHT, OTHER
  amount: real("amount").notNull(),
  paymentMethod: text("payment_method").notNull().default("CASH"), // CASH, BANK_TRANSFER, CARD
  branchId: integer("branch_id").references(() => warehouses.id),
  payee: text("payee"), // Tên đối tác / người nhận
  status: text("status").notNull().default("PAID"), // PAID, PENDING, CANCELLED
  notes: text("notes"),
  expenseDate: integer("expense_date", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const accountingAccounts = sqliteTable("accounting_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. 111, 112, 131, 156, 331, 511, 632, 642, 333, 911
  name: text("name").notNull(),
  type: text("type").notNull(), // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  description: text("description"),
});

export const accountingEntries = sqliteTable("accounting_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entryCode: text("entry_code").notNull().unique(), // e.g. JE-20260814-0001
  sourceModule: text("source_module").notNull(), // 'SALES', 'PURCHASE', 'INVENTORY', 'PAYMENT', 'INVOICE', 'EXPENSE', 'MANUAL'
  sourceDocumentType: text("source_document_type").notNull(), // 'SALES_ORDER', 'PURCHASE_ORDER', 'INVOICE', 'PAYMENT', 'EXPENSE', 'GOODS_RECEIPT', 'STOCK_ADJUSTMENT'
  sourceDocumentId: integer("source_document_id"),
  sourceReferenceNo: text("source_reference_no"),
  debitAccount: text("debit_account").notNull(), // e.g. '131', '111', '632', '642'
  creditAccount: text("credit_account").notNull(), // e.g. '511', '156', '331', '111'
  amount: real("amount").notNull(),
  description: text("description"),
  branchId: integer("branch_id").references(() => warehouses.id),
  customerId: integer("customer_id").references(() => customers.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// 17. Costing Engine & COGS Management
export const costLayers = sqliteTable("cost_layers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  quantityOriginal: real("quantity_original").notNull(),
  quantityRemaining: real("quantity_remaining").notNull(),
  unitCost: real("unit_cost").notNull(),
  totalCost: real("total_cost").notNull(),
  sourceDocumentType: text("source_document_type").notNull(), // 'GOODS_RECEIPT', 'PURCHASE_ORDER', 'INITIAL_STOCK', 'RETURN'
  sourceDocumentId: integer("source_document_id"),
  sourceReferenceNo: text("source_reference_no"),
  receiptDate: integer("receipt_date", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  lotId: integer("lot_id").references(() => lots.id),
  status: text("status").notNull().default("ACTIVE"), // 'ACTIVE', 'DEPLETED', 'CANCELLED'
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const cogsTransactions = sqliteTable("cogs_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cogsCode: text("cogs_code").notNull().unique(), // e.g. COGS-2026-0001
  salesOrderId: integer("sales_order_id").references(() => salesOrders.id),
  salesOrderItemId: integer("sales_order_item_id").references(() => salesOrderItems.id),
  productId: integer("product_id").notNull().references(() => products.id),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  quantity: real("quantity").notNull(),
  unitCost: real("unit_cost").notNull(),
  totalCogs: real("total_cogs").notNull(),
  costingMethod: text("costing_method").notNull().default("WEIGHTED_AVERAGE"), // WEIGHTED_AVERAGE, FIFO
  costLayerId: integer("cost_layer_id").references(() => costLayers.id),
  stockIssueId: integer("stock_issue_id").references(() => goodsIssues.id),
  transactionType: text("transaction_type").notNull().default("SALE"), // SALE, RETURN_REVERSAL, ADJUSTMENT
  transactionDate: integer("transaction_date", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const costingSettings = sqliteTable("costing_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  globalMethod: text("global_method").notNull().default("WEIGHTED_AVERAGE"), // WEIGHTED_AVERAGE, FIFO
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ==========================================
// Module 26: Event Bus & Transactional Outbox Pattern
// ==========================================

export const outboxEvents = sqliteTable("outbox_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: text("event_id").notNull().unique(), // EVT-001
  eventType: text("event_type").notNull(), // OrderConfirmed, StockIssued, GoodsReceived, etc.
  eventVersion: integer("event_version").notNull().default(1),
  aggregateType: text("aggregate_type").notNull(), // Order, Stock, Invoice, Payment
  aggregateId: text("aggregate_id").notNull(), // ORD-001, GR-001
  source: text("source").notNull(), // Sales, Inventory, Purchase, Accounting
  actorId: text("actor_id"),
  correlationId: text("correlation_id"), // CORR-001
  causationId: text("causation_id"), // CMD-001 or parent EVT ID
  payload: text("payload").notNull(), // JSON string
  metadata: text("metadata"), // JSON string
  occurredAt: integer("occurred_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  publishedAt: integer("published_at", { mode: 'timestamp' }),
  status: text("status").notNull().default("PENDING"), // PENDING, PROCESSING, PUBLISHED, FAILED, DLQ
  retryCount: integer("retry_count").notNull().default(0),
  lastError: text("last_error"),
  lockedAt: integer("locked_at", { mode: 'timestamp' }),
  lockedBy: text("locked_by"),
  nextRetryAt: integer("next_retry_at", { mode: 'timestamp' }),
});

export const processedEvents = sqliteTable("processed_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: text("event_id").notNull(),
  eventType: text("event_type").notNull(),
  consumer: text("consumer").notNull(), // e.g. InventorySubscriber, AccountingSubscriber
  processedAt: integer("processed_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  status: text("status").notNull().default("SUCCESS"), // SUCCESS, FAILED
  error: text("error"),
  retryCount: integer("retry_count").notNull().default(0),
}, (table) => ({
  eventConsumerIdx: uniqueIndex("processed_events_event_consumer_idx").on(table.eventId, table.consumer),
}));

export const dlqEvents = sqliteTable("dlq_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: text("event_id").notNull(),
  eventType: text("event_type").notNull(),
  consumer: text("consumer").notNull(),
  payload: text("payload").notNull(),
  correlationId: text("correlation_id"),
  causationId: text("causation_id"),
  failedAt: integer("failed_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  retryCount: integer("retry_count").notNull().default(0),
  lastError: text("last_error"),
  status: text("status").notNull().default("UNRESOLVED"), // UNRESOLVED, RETRIED, REPROCESSED, RESOLVED
  resolvedBy: text("resolved_by"),
  resolvedAt: integer("resolved_at", { mode: 'timestamp' }),
});

// ==========================================
// Module 28: HR & Employee Management
// ==========================================

export const branches = sqliteTable("branches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // BRANCH-HCM-01
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  status: text("status").notNull().default("ACTIVE"),
});

export const departments = sqliteTable("departments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // DEPT-001
  name: text("name").notNull(),
  parentDepartmentId: integer("parent_department_id"),
  managerEmployeeId: integer("manager_employee_id"),
  status: text("status").notNull().default("ACTIVE"),
  description: text("description"),
});

export const positions = sqliteTable("positions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // POS-001
  name: text("name").notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  description: text("description"),
  status: text("status").notNull().default("ACTIVE"),
});

export const employees = sqliteTable("employees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // EMP-000001
  fullName: text("full_name").notNull(),
  gender: text("gender").default("NAM"),
  dateOfBirth: text("date_of_birth"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  avatar: text("avatar"),
  identityCard: text("identity_card"),
  hireDate: text("hire_date"),
  terminationDate: text("termination_date"),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, INACTIVE, ON_LEAVE, SUSPENDED, TERMINATED
  departmentId: integer("department_id").references(() => departments.id),
  positionId: integer("position_id").references(() => positions.id),
  branchId: integer("branch_id").references(() => branches.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  managerId: integer("manager_id"), // self referencing employee.id
  userId: integer("user_id").references(() => users.id),
  baseSalary: real("base_salary").default(15000000),
  bankAccount: text("bank_account"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const employeeAssignments = sqliteTable("employee_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  departmentId: integer("department_id").references(() => departments.id),
  positionId: integer("position_id").references(() => positions.id),
  branchId: integer("branch_id").references(() => branches.id),
  managerId: integer("manager_id"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  status: text("status").notNull().default("ACTIVE"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const employeeDocuments = sqliteTable("employee_documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  title: text("title").notNull(),
  type: text("type").notNull(), // Hợp đồng, Quyết định, Bằng cấp, Chứng chỉ
  fileUrl: text("file_url"),
  issuedDate: text("issued_date"),
  expiryDate: text("expiry_date"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const userScopes = sqliteTable("user_scopes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  scopeType: text("scope_type").notNull(), // COMPANY, BRANCH, DEPARTMENT, WAREHOUSE
  scopeValue: text("scope_value").notNull(), // e.g. 1 (branchId/warehouseId/deptId) or "ALL"
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ==========================================
// MODULE 29: MANUFACTURING & PRODUCTION
// ==========================================

export const workCenters = sqliteTable("work_centers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  capacity: real("capacity").default(100), // capacity % or units/hr
  costRatePerHour: real("cost_rate_per_hour").default(0), // VND per hour
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, MAINTENANCE, INACTIVE
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const boms = sqliteTable("boms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  productId: integer("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  uom: text("uom").notNull().default("Pcs"),
  quantity: real("quantity").notNull().default(1),
  status: text("status").notNull().default("DRAFT"), // DRAFT, SUBMITTED, APPROVED, ACTIVE, ARCHIVED, REJECTED
  version: text("version").notNull().default("V1.0"),
  effectiveFrom: text("effective_from"),
  effectiveTo: text("effective_to"),
  notes: text("notes"),
  createdBy: text("created_by").notNull().default("Admin"),
  approvedBy: text("approved_by"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const bomVersions = sqliteTable("bom_versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bomId: integer("bom_id").notNull().references(() => boms.id),
  version: text("version").notNull(),
  status: text("status").notNull().default("DRAFT"), // DRAFT, APPROVED, ACTIVE, ARCHIVED
  effectiveFrom: text("effective_from"),
  effectiveTo: text("effective_to"),
  notes: text("notes"),
  createdBy: text("created_by").notNull().default("Admin"),
  approvedBy: text("approved_by"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const bomItems = sqliteTable("bom_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bomId: integer("bom_id").notNull().references(() => boms.id),
  materialProductId: integer("material_product_id").notNull().references(() => products.id),
  quantity: real("quantity").notNull(),
  uom: text("uom").notNull().default("Pcs"),
  scrapRate: real("scrap_rate").default(0), // % expected scrap e.g. 2%
  operationSequence: integer("operation_sequence").default(10),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  notes: text("notes"),
});

export const routings = sqliteTable("routings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  sequence: integer("sequence").notNull().default(10),
  operationName: text("operation_name").notNull(),
  workCenterId: integer("work_center_id").references(() => workCenters.id),
  plannedTimeMinutes: real("planned_time_minutes").default(60),
  description: text("description"),
});

export const manufacturingOrders = sqliteTable("manufacturing_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // MO-XXXXXX
  productId: integer("product_id").notNull().references(() => products.id),
  bomId: integer("bom_id").notNull().references(() => boms.id),
  bomVersion: text("bom_version").notNull().default("V1.0"),
  plannedQuantity: real("planned_quantity").notNull(),
  producedQuantity: real("produced_quantity").notNull().default(0),
  scrapQuantity: real("scrap_quantity").notNull().default(0),
  uom: text("uom").notNull().default("Pcs"),
  warehouseId: integer("warehouse_id").references(() => warehouses.id), // Finished Goods WH
  rawWarehouseId: integer("raw_warehouse_id").references(() => warehouses.id), // Raw Materials WH
  workCenterId: integer("work_center_id").references(() => workCenters.id),
  priority: text("priority").notNull().default("NORMAL"), // LOW, NORMAL, HIGH, URGENT
  status: text("status").notNull().default("DRAFT"), // DRAFT, CONFIRMED, RELEASED, IN_PROGRESS, COMPLETED, CLOSED, CANCELLED, ON_HOLD
  plannedStartDate: text("planned_start_date"),
  plannedEndDate: text("planned_end_date"),
  actualStartDate: text("actual_start_date"),
  actualEndDate: text("actual_end_date"),
  notes: text("notes"),
  createdBy: text("created_by").notNull().default("Admin"),
  approvedBy: text("approved_by"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const materialReservations = sqliteTable("material_reservations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  moId: integer("mo_id").notNull().references(() => manufacturingOrders.id),
  materialProductId: integer("material_product_id").notNull().references(() => products.id),
  requiredQuantity: real("required_quantity").notNull(),
  reservedQuantity: real("reserved_quantity").notNull().default(0),
  uom: text("uom").notNull().default("Pcs"),
  status: text("status").notNull().default("RESERVED"), // RESERVED, SHORTAGE, CONSUMED, RELEASED
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const materialConsumptions = sqliteTable("material_consumptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  moId: integer("mo_id").notNull().references(() => manufacturingOrders.id),
  materialProductId: integer("material_product_id").notNull().references(() => products.id),
  plannedQuantity: real("planned_quantity").notNull(),
  actualQuantity: real("actual_quantity").notNull(),
  uom: text("uom").notNull().default("Pcs"),
  unitCost: real("unit_cost").notNull().default(0),
  totalCost: real("total_cost").notNull().default(0),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  lotId: integer("lot_id").references(() => lots.id),
  serialNumber: text("serial_number"),
  consumedAt: integer("consumed_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  consumedBy: text("consumed_by").notNull().default("Admin"),
});

export const productionOutputs = sqliteTable("production_outputs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  moId: integer("mo_id").notNull().references(() => manufacturingOrders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: real("quantity").notNull(),
  uom: text("uom").notNull().default("Pcs"),
  goodQuantity: real("good_quantity").notNull(),
  scrapQuantity: real("scrap_quantity").notNull().default(0),
  batchNumber: text("batch_number"),
  expiryDate: text("expiry_date"),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  unitCost: real("unit_cost").notNull().default(0),
  totalCost: real("total_cost").notNull().default(0),
  producedAt: integer("produced_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  producedBy: text("produced_by").notNull().default("Admin"),
});

export const productionScraps = sqliteTable("production_scraps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  moId: integer("mo_id").notNull().references(() => manufacturingOrders.id),
  materialProductId: integer("material_product_id").notNull().references(() => products.id),
  quantity: real("quantity").notNull(),
  uom: text("uom").notNull().default("Pcs"),
  scrapType: text("scrap_type").notNull().default("PRODUCTION_DEFECT"), // PRODUCTION_DEFECT, DAMAGED, QUALITY_REJECT, PROCESS_LOSS, MATERIAL_LOSS, OTHER
  reason: text("reason"),
  approvedBy: text("approved_by"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const productionCosts = sqliteTable("production_costs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  moId: integer("mo_id").notNull().references(() => manufacturingOrders.id),
  materialCost: real("material_cost").notNull().default(0),
  laborCost: real("labor_cost").notNull().default(0),
  machineCost: real("machine_cost").notNull().default(0),
  overheadCost: real("overhead_cost").notNull().default(0),
  totalCost: real("total_cost").notNull().default(0),
  producedQty: real("produced_qty").notNull().default(1),
  unitCost: real("unit_cost").notNull().default(0),
  standardUnitCost: real("standard_unit_cost").notNull().default(0),
  variance: real("variance").notNull().default(0), // Actual - Standard
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ==========================================
// MODULE 31: PROJECT MANAGEMENT & CONSTRUCTION COSTING
// ==========================================
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // PRJ-00001
  name: text("name").notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name"),
  contractNo: text("contract_no"),
  projectManagerId: integer("project_manager_id"),
  projectManagerName: text("project_manager_name"),
  branchId: integer("branch_id"),
  location: text("location"),
  startDate: text("start_date"),
  plannedEndDate: text("planned_end_date"),
  actualEndDate: text("actual_end_date"),
  status: text("status").notNull().default("DRAFT"), // DRAFT, APPROVED, ACTIVE, ON_HOLD, COMPLETED, CLOSED, CANCELLED
  totalBudget: real("total_budget").notNull().default(0),
  actualCost: real("actual_cost").notNull().default(0),
  revenue: real("revenue").notNull().default(0),
  profit: real("profit").notNull().default(0),
  plannedValue: real("planned_value").notNull().default(0),
  earnedValue: real("earned_value").notNull().default(0),
  cpi: real("cpi").notNull().default(1.0),
  spi: real("spi").notNull().default(1.0),
  eac: real("eac").notNull().default(0),
  revisionNo: text("revision_no").notNull().default("v1.0"),
  billingStatus: text("billing_status").notNull().default("UNBILLED"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const projectWbs = sqliteTable("project_wbs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  code: text("code").notNull(), // WBS-01, WBS-02
  name: text("name").notNull(),
  parentWbsId: integer("parent_wbs_id"),
  budgetAmount: real("budget_amount").notNull().default(0),
  description: text("description"),
});

export const projectTasks = sqliteTable("project_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  wbsId: integer("wbs_id").references(() => projectWbs.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  parentTaskId: integer("parent_task_id"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  plannedProgress: real("planned_progress").notNull().default(0), // %
  actualProgress: real("actual_progress").notNull().default(0), // %
  responsibleEmployeeId: integer("responsible_employee_id"),
  responsibleEmployeeName: text("responsible_employee_name"),
  status: text("status").notNull().default("PLANNED"), // PLANNED, IN_PROGRESS, COMPLETED, DELAYED
  budgetAmount: real("budget_amount").notNull().default(0),
  actualCost: real("actual_cost").notNull().default(0),
});

export const projectBudgets = sqliteTable("project_budgets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  materialBudget: real("material_budget").notNull().default(0),
  laborBudget: real("labor_budget").notNull().default(0),
  equipmentBudget: real("equipment_budget").notNull().default(0),
  subcontractBudget: real("subcontract_budget").notNull().default(0),
  transportationBudget: real("transportation_budget").notNull().default(0),
  otherBudget: real("other_budget").notNull().default(0),
  totalBudget: real("total_budget").notNull().default(0),
  approvedBy: text("approved_by"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const projectCosts = sqliteTable("project_costs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  taskId: integer("task_id").references(() => projectTasks.id),
  costType: text("cost_type").notNull(), // MATERIAL, LABOR, EQUIPMENT, SUBCONTRACTOR, TRANSPORTATION, OTHER
  description: text("description").notNull(),
  amount: real("amount").notNull().default(0),
  referenceNo: text("reference_no"),
  date: text("date"),
  recordedBy: text("recorded_by").notNull().default("Admin"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const projectSubcontracts = sqliteTable("project_subcontracts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  subcontractorName: text("subcontractor_name").notNull(),
  contractNo: text("contract_no").notNull(),
  scope: text("scope"),
  contractValue: real("contract_value").notNull().default(0),
  progressPercent: real("progress_percent").notNull().default(0),
  paidAmount: real("paid_amount").notNull().default(0),
  retentionAmount: real("retention_amount").notNull().default(0),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, COMPLETED, CLOSED
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const projectBudgetVersions = sqliteTable("project_budget_versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  versionCode: text("version_code").notNull(), // v1.0, v2.0
  bcrCode: text("bcr_code"), // BCR-PRJ-2026-0001
  materialBudget: real("material_budget").notNull().default(0),
  laborBudget: real("labor_budget").notNull().default(0),
  equipmentBudget: real("equipment_budget").notNull().default(0),
  subcontractBudget: real("subcontract_budget").notNull().default(0),
  overheadBudget: real("overhead_budget").notNull().default(0),
  contingencyBudget: real("contingency_budget").notNull().default(0),
  totalBudget: real("total_budget").notNull().default(0),
  changeReason: text("change_reason"),
  status: text("status").notNull().default("APPROVED"), // DRAFT, SUBMITTED, APPROVED, REJECTED
  createdBy: integer("created_by"),
  approvedBy: integer("approved_by"),
  approvedAt: integer("approved_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const projectEvmSnapshots = sqliteTable("project_evm_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  snapshotDate: text("snapshot_date").notNull(), // YYYY-MM-DD
  bac: real("bac").notNull().default(0), // Budget at Completion
  pv: real("pv").notNull().default(0), // Planned Value
  ev: real("ev").notNull().default(0), // Earned Value
  ac: real("ac").notNull().default(0), // Actual Cost
  cv: real("cv").notNull().default(0), // Cost Variance (EV - AC)
  sv: real("sv").notNull().default(0), // Schedule Variance (EV - PV)
  cpi: real("cpi").notNull().default(1.0), // Cost Performance Index (EV / AC)
  spi: real("spi").notNull().default(1.0), // Schedule Performance Index (EV / PV)
  eac: real("eac").notNull().default(0), // Estimate at Completion (BAC / CPI)
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const projectMilestones = sqliteTable("project_milestones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  milestoneCode: text("milestone_code").notNull(),
  name: text("name").notNull(),
  targetDate: text("target_date"),
  completionPercentage: real("completion_percentage").notNull().default(0),
  billingAmount: real("billing_amount").notNull().default(0),
  status: text("status").notNull().default("PLANNED"), // PLANNED, VERIFIED, BILLED, CANCELLED
  salesOrderId: integer("sales_order_id").references(() => salesOrders.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  verifiedBy: integer("verified_by"),
  verifiedAt: integer("verified_at", { mode: 'timestamp' }),
  billedAt: integer("billed_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ==========================================
// MODULE 32: ENTERPRISE ASSET MANAGEMENT / CMMS
// ==========================================
export const assetCategories = sqliteTable("asset_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
});

export const assets = sqliteTable("assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // AST-0001
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => assetCategories.id),
  categoryName: text("category_name"),
  serialNumber: text("serial_number"),
  model: text("model"),
  manufacturer: text("manufacturer"),
  supplierId: integer("supplier_id"),
  supplierName: text("supplier_name"),
  purchaseDate: text("purchase_date"),
  purchaseCost: real("purchase_cost").notNull().default(0),
  bookValue: real("book_value").notNull().default(0),
  branchId: integer("branch_id"),
  departmentId: integer("department_id"),
  location: text("location"),
  responsibleEmployeeId: integer("responsible_employee_id"),
  responsibleEmployeeName: text("responsible_employee_name"),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, IN_USE, MAINTENANCE, REPAIR, IDLE, DISPOSED, LOST
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const assetAssignments = sqliteTable("asset_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  assignedType: text("assigned_type").notNull(), // EMPLOYEE, DEPARTMENT, BRANCH, PROJECT
  assignedId: integer("assigned_id"),
  assignedName: text("assigned_name").notNull(),
  assignedDate: text("assigned_date").notNull(),
  returnDate: text("return_date"),
  status: text("status").notNull().default("ACTIVE"),
  notes: text("notes"),
});

export const assetTransfers = sqliteTable("asset_transfers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  fromBranchId: integer("from_branch_id"),
  fromBranchName: text("from_branch_name"),
  toBranchId: integer("to_branch_id"),
  toBranchName: text("to_branch_name"),
  transferDate: text("transfer_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("COMPLETED"),
  approvedBy: text("approved_by"),
});

export const maintenancePlans = sqliteTable("maintenance_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  planCode: text("plan_code").notNull(),
  title: text("title").notNull(),
  maintenanceType: text("maintenance_type").notNull().default("PREVENTIVE"), // PREVENTIVE, CORRECTIVE, PREDICTIVE, EMERGENCY
  intervalHours: real("interval_hours").default(0),
  intervalDays: integer("interval_days").default(30),
  description: text("description"),
  lastPerformedDate: text("last_performed_date"),
  nextDueDate: text("next_due_date"),
});

export const maintenanceWorkOrders = sqliteTable("maintenance_work_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  woCode: text("wo_code").notNull().unique(), // WO-0001
  assetId: integer("asset_id").notNull().references(() => assets.id),
  assetName: text("asset_name"),
  maintenanceType: text("maintenance_type").notNull().default("PREVENTIVE"),
  priority: text("priority").notNull().default("NORMAL"), // LOW, NORMAL, HIGH, URGENT
  description: text("description").notNull(),
  assignedTechnicianId: integer("assigned_technician_id"),
  assignedTechnicianName: text("assigned_technician_name"),
  plannedStart: text("planned_start"),
  plannedEnd: text("planned_end"),
  actualStart: text("actual_start"),
  actualEnd: text("actual_end"),
  status: text("status").notNull().default("OPEN"), // OPEN, ASSIGNED, IN_PROGRESS, WAITING_PART, COMPLETED, CLOSED
  totalCost: real("total_cost").notNull().default(0),
  downtimeHours: real("downtime_hours").notNull().default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const maintenanceParts = sqliteTable("maintenance_parts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  woId: integer("wo_id").notNull().references(() => maintenanceWorkOrders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  productName: text("product_name"),
  quantity: real("quantity").notNull(),
  unitCost: real("unit_cost").notNull().default(0),
  totalCost: real("total_cost").notNull().default(0),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  issuedAt: integer("issued_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ==========================================
// MODULE 33: CRM & CUSTOMER SERVICE DESK
// ==========================================
export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadCode: text("lead_code").notNull().unique(), // LEAD-0001
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  source: text("source").default("WEBSITE"), // WEBSITE, REFERRAL, EVENT, COLD_CALL
  interest: text("interest"),
  salespersonId: integer("salesperson_id"),
  salespersonName: text("salesperson_name"),
  value: real("value").default(0),
  status: text("status").notNull().default("NEW"), // NEW, CONTACTED, QUALIFIED, PROPOSAL, WON, LOST
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const opportunities = sqliteTable("opportunities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // OPP-0001
  leadId: integer("lead_id").references(() => leads.id),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name"),
  name: text("name").notNull(),
  value: real("value").notNull().default(0),
  probability: real("probability").default(50), // %
  expectedCloseDate: text("expected_close_date"),
  salespersonId: integer("salesperson_id"),
  salespersonName: text("salesperson_name"),
  stage: text("stage").notNull().default("QUALIFICATION"), // QUALIFICATION, PROPOSAL, NEGOTIATION, WON, LOST
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const crmActivities = sqliteTable("crm_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("lead_id").references(() => leads.id),
  customerId: integer("customer_id").references(() => customers.id),
  activityType: text("activity_type").notNull(), // CALL, EMAIL, MEETING, NOTE, VISIT, CHAT
  subject: text("subject").notNull(),
  description: text("description"),
  performedBy: text("performed_by").notNull().default("Admin"),
  date: text("date").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const crmQuotations = sqliteTable("crm_quotations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quotationCode: text("quotation_code").notNull().unique(), // QUO-2026-001
  leadId: integer("lead_id").references(() => leads.id),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  title: text("title").notNull(),
  issueDate: text("issue_date").notNull(),
  validUntil: text("valid_until").notNull(),
  subtotal: real("subtotal").notNull().default(0),
  taxRate: real("tax_rate").notNull().default(10), // %
  taxAmount: real("tax_amount").notNull().default(0),
  discountAmount: real("discount_amount").notNull().default(0),
  grandTotal: real("grand_total").notNull().default(0),
  paymentTerms: text("payment_terms").default("NET30"),
  deliveryTerms: text("delivery_terms").default("DAP (Giao tại kho khách hàng)"),
  status: text("status").notNull().default("DRAFT"), // DRAFT, SENT, ACCEPTED, REJECTED, CONVERTED_TO_SO
  convertedSalesOrderId: integer("converted_sales_order_id"),
  convertedSalesOrderCode: text("converted_sales_order_code"),
  salespersonName: text("salesperson_name").default("Admin"),
  itemsPayload: text("items_payload"), // JSON array of items
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const tickets = sqliteTable("tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketCode: text("ticket_code").notNull().unique(), // TCK-0001
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  category: text("category").default("TECHNICAL_SUPPORT"),
  priority: text("priority").notNull().default("NORMAL"), // LOW, NORMAL, HIGH, URGENT
  subject: text("subject").notNull(),
  description: text("description"),
  assignedAgentId: integer("assigned_agent_id"),
  assignedAgentName: text("assigned_agent_name"),
  slaHours: integer("sla_hours").default(24),
  firstResponseTimeMinutes: integer("first_response_time_minutes"),
  resolutionTimeHours: real("resolution_time_hours"),
  isSlaBreached: integer("is_sla_breached", { mode: 'boolean' }).default(false),
  status: text("status").notNull().default("OPEN"), // OPEN, ASSIGNED, IN_PROGRESS, WAITING_CUSTOMER, RESOLVED, CLOSED
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const ticketMessages = sqliteTable("ticket_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id),
  senderName: text("sender_name").notNull(),
  senderType: text("sender_type").notNull().default("AGENT"), // AGENT, CUSTOMER, SYSTEM
  message: text("message").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const warrantyClaims = sqliteTable("warranty_claims", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  claimCode: text("claim_code").notNull().unique(), // WCL-0001
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name"),
  productId: integer("product_id").references(() => products.id),
  productName: text("product_name"),
  serialNumber: text("serial_number"),
  invoiceNo: text("invoice_no"),
  issueDescription: text("issue_description").notNull(),
  claimDate: text("claim_date").notNull(),
  status: text("status").notNull().default("PENDING"), // PENDING, INSPECTION, APPROVED_REPAIR, APPROVED_REPLACE, REJECTED, CLOSED
  resolutionNotes: text("resolution_notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ==========================================
// MODULE 34: TRANSPORTATION & LOGISTICS MANAGEMENT
// ==========================================
export const vehicles = sqliteTable("vehicles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // VEH-001
  plateNumber: text("plate_number").notNull().unique(),
  vehicleType: text("vehicle_type").notNull().default("TRUCK_5T"),
  capacityKg: real("capacity_kg").notNull().default(5000),
  fuelType: text("fuel_type").default("DIESEL"),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, IN_USE, MAINTENANCE, DISPOSED
  mileageKm: real("mileage_km").notNull().default(0),
  assetId: integer("asset_id").references(() => assets.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const drivers = sqliteTable("drivers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // DRV-001
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  licenseNumber: text("license_number"),
  licenseExpiryDate: text("license_expiry_date"),
  employeeId: integer("employee_id").references(() => employees.id),
  status: text("status").notNull().default("AVAILABLE"), // AVAILABLE, ON_TRIP, ON_LEAVE
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const transportOrders = sqliteTable("transport_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderCode: text("order_code").notNull().unique(), // TRP-0001
  salesOrderId: integer("sales_order_id"),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name"),
  originAddress: text("origin_address").notNull(),
  destinationAddress: text("destination_address").notNull(),
  weightKg: real("weight_kg").default(100),
  volumeCbm: real("volume_cbm").default(1),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  driverId: integer("driver_id").references(() => drivers.id),
  plannedDate: text("planned_date"),
  status: text("status").notNull().default("PLANNED"), // PLANNED, ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, FAILED, CLOSED
  freightCost: real("freight_cost").default(0),
  fuelCost: real("fuel_cost").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const proofOfDeliveries = sqliteTable("proof_of_deliveries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transportOrderId: integer("transport_order_id").notNull().references(() => transportOrders.id),
  receiverName: text("receiver_name").notNull(),
  signatureUrl: text("signature_url"),
  photoUrl: text("photo_url"),
  deliveredAt: text("delivered_at").notNull(),
  status: text("status").notNull().default("DELIVERED_SUCCESS"), // DELIVERED_SUCCESS, PARTIAL_DELIVERY, REFUSED, CUSTOMER_UNAVAILABLE, WRONG_ADDRESS, DAMAGED_GOODS
  failureReason: text("failure_reason"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const fuelTransactions = sqliteTable("fuel_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  plateNumber: text("plate_number"),
  driverId: integer("driver_id").references(() => drivers.id),
  fuelDate: text("fuel_date").notNull(),
  liters: real("liters").notNull(),
  pricePerLiter: real("price_per_liter").notNull(),
  totalAmount: real("total_amount").notNull(),
  mileageAtRefuel: real("mileage_at_refuel").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ==========================================
// MODULE 35: SUPPLY CHAIN PLANNING & DEMAND FORECASTING
// ==========================================
export const demandForecasts = sqliteTable("demand_forecasts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  forecastCode: text("forecast_code").notNull().unique(), // FST-0001
  period: text("period").notNull().default("MONTHLY"), // DAILY, WEEKLY, MONTHLY, QUARTERLY
  productId: integer("product_id").notNull().references(() => products.id),
  productName: text("product_name"),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  historicalAvgDemand: real("historical_avg_demand").default(100),
  forecastQuantity: real("forecast_quantity").notNull(),
  forecastMethod: text("forecast_method").notNull().default("MOVING_AVERAGE"), // MOVING_AVERAGE, WEIGHTED_MOVING_AVERAGE, EXPONENTIAL_SMOOTHING, SEASONAL
  accuracyMae: real("accuracy_mae").default(5),
  accuracyMape: real("accuracy_mape").default(4.2), // %
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const supplyPlans = sqliteTable("supply_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planCode: text("plan_code").notNull().unique(), // PLN-0001
  productId: integer("product_id").notNull().references(() => products.id),
  productName: text("product_name"),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  currentStock: real("current_stock").notNull().default(0),
  reservedStock: real("reserved_stock").notNull().default(0),
  incomingPoQty: real("incoming_po_qty").notNull().default(0),
  incomingMoQty: real("incoming_mo_qty").notNull().default(0),
  forecastDemand: real("forecast_demand").notNull().default(0),
  netRequirement: real("net_requirement").notNull().default(0),
  reorderPoint: real("reorder_point").notNull().default(20),
  safetyStock: real("safety_stock").notNull().default(10),
  recommendedPurchaseQty: real("recommended_purchase_qty").notNull().default(0),
  recommendedProductionQty: real("recommended_production_qty").notNull().default(0),
  recommendedTransferQty: real("recommended_transfer_qty").notNull().default(0),
  status: text("status").notNull().default("DRAFT"), // DRAFT, APPROVED, EXECUTED
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const systemConfigs = sqliteTable("system_configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  moduleKey: text("module_key").notNull(), // e.g. GENERAL, INVENTORY, APPROVALS, SECURITY
  configKey: text("config_key").notNull().unique(),
  configValue: text("config_value").notNull(),
  description: text("description"),
  updatedBy: text("updated_by"),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const approvalOverrides = sqliteTable("approval_overrides", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  overrideCode: text("override_code").notNull().unique(), // OVR-2026-001
  requestedBy: text("requested_by").notNull(),
  module: text("module").notNull(), // e.g. POS, INVENTORY, PURCHASE, HR
  action: text("action").notNull(),
  targetRef: text("target_ref"),
  reason: text("reason").notNull(),
  requestedAmount: real("requested_amount"),
  status: text("status").notNull().default("PENDING"), // PENDING, APPROVED, REJECTED
  approvedBy: text("approved_by"),
  approvalNotes: text("approval_notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  resolvedAt: integer("resolved_at", { mode: 'timestamp' }),
});

export const inventoryAlerts = sqliteTable("inventory_alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // LOW_STOCK, OUT_OF_STOCK, NEGATIVE_STOCK, HIGH_RESERVED_STOCK, OVER_RESERVED, OVERSTOCK, EXPIRING_SOON, EXPIRED, DEAD_STOCK, SLOW_MOVING_STOCK, STOCKTAKE_VARIANCE, INVENTORY_SYNC_ERROR, etc.
  severity: text("severity").notNull().default("MEDIUM"), // INFO, LOW, MEDIUM, HIGH, CRITICAL
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED
  productId: integer("product_id").references(() => products.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  locationId: integer("location_id").references(() => warehouseLocations.id),
  batchId: integer("batch_id"),
  serialId: integer("serial_id"),
  sourceType: text("source_type"),
  sourceId: text("source_id"),
  currentValue: real("current_value"),
  thresholdValue: real("threshold_value"),
  message: text("message").notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  assignedToName: text("assigned_to_name"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  
  // Acknowledge Phase (Tiếp nhận trách nhiệm)
  acknowledgedBy: integer("acknowledged_by").references(() => users.id),
  acknowledgedByName: text("acknowledged_by_name"),
  acknowledgedAt: integer("acknowledged_at", { mode: 'timestamp' }),
  ackNotes: text("ack_notes"),
  
  // Resolution Phase (Xác minh & Giải quyết triệt để)
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedByName: text("resolved_by_name"), // e.g. "Nguyễn Văn A" or "SYSTEM_AUTO_RESOLVE"
  resolvedAt: integer("resolved_at", { mode: 'timestamp' }),
  resolvedReason: text("resolved_reason"),
  refTransactionNo: text("ref_transaction_no"), // e.g. PO-2026-001, GR-2026-001, TR-2026-001
  
  // Dismiss Phase (Bỏ qua có kiểm soát)
  dismissedBy: integer("dismissed_by").references(() => users.id),
  dismissedByName: text("dismissed_by_name"),
  dismissedAt: integer("dismissed_at", { mode: 'timestamp' }),
  dismissReason: text("dismiss_reason"),
  
  closedAt: integer("closed_at", { mode: 'timestamp' }),
});

export const payrolls = sqliteTable("payrolls", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  periodCode: text("period_code").notNull().unique(), // PAY-2026-08
  name: text("name").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalEmployees: integer("total_employees").notNull().default(0),
  totalGross: real("total_gross").notNull().default(0),
  totalInsurance: real("total_insurance").notNull().default(0),
  totalTax: real("total_tax").notNull().default(0),
  totalNet: real("total_net").notNull().default(0),
  status: text("status").notNull().default("DRAFT"), // DRAFT, APPROVED, POSTED, PAID
  postedGL: integer("posted_gl", { mode: 'boolean' }).default(false),
  sha256Checksum: text("sha256_checksum"),
  approvedBy: text("approved_by"),
  approvedAt: text("approved_at"),
  notes: text("notes"),
  accountingEntryId: integer("accounting_entry_id"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const payslips = sqliteTable("payslips", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  payrollId: integer("payroll_id").notNull().references(() => payrolls.id),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  baseSalary: real("base_salary").notNull().default(0),
  standardWorkingDays: real("standard_working_days").notNull().default(26),
  actualWorkingDays: real("actual_working_days").notNull().default(26),
  otHours: real("ot_hours").notNull().default(0),
  allowancesTotal: real("allowances_total").notNull().default(0),
  bonusTotal: real("bonus_total").notNull().default(0),
  deductionsTotal: real("deductions_total").notNull().default(0),
  insuranceEmployee: real("insurance_employee").notNull().default(0),
  taxableIncome: real("taxable_income").notNull().default(0),
  personalIncomeTax: real("personal_income_tax").notNull().default(0),
  netSalary: real("net_salary").notNull().default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const employeeContracts = sqliteTable("employee_contracts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contractNo: text("contract_no").notNull().unique(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  contractType: text("contract_type").notNull(), // THU_VIEC, XAC_DINH_THOI_HAN, KHONG_XAC_DINH_THOI_HAN, THOI_VU, CONG_TAC_VIEN
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  baseSalary: real("base_salary").notNull().default(0),
  allowanceAmount: real("allowance_amount").notNull().default(0),
  commissionRate: real("commission_rate").notNull().default(0.05), // e.g. 0.05 for 5% sales commission
  allowanceDetails: text("allowance_details"), // JSON or notes
  terms: text("terms"),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, EXPIRED, TERMINATED
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const workShifts = sqliteTable("work_shifts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(), // 08:00
  endTime: text("end_time").notNull(), // 17:00
  shiftType: text("shift_type").notNull().default("FIXED"), // FIXED, FLEXIBLE, ROTATING, NIGHT
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const attendanceRecords = sqliteTable("attendance_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  workDate: text("work_date").notNull(),
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  status: text("status").notNull().default("PRESENT"), // PRESENT, LATE, EARLY_LEAVE, ABSENT, ON_LEAVE
  workHours: real("work_hours").notNull().default(8),
  note: text("note"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const leaveRequests = sqliteTable("leave_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  leaveType: text("leave_type").notNull(), // ANNUAL_LEAVE, SICK_LEAVE, UNPAID, MATERNITY, PERSONAL
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalDays: real("total_days").notNull().default(1),
  reason: text("reason"),
  status: text("status").notNull().default("PENDING"), // PENDING, APPROVED, REJECTED
  approvedBy: integer("approved_by").references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const overtimeRecords = sqliteTable("overtime_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  otDate: text("ot_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  hours: real("hours").notNull().default(0),
  multiplier: real("multiplier").notNull().default(1.5),
  reason: text("reason"),
  status: text("status").notNull().default("APPROVED"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const employeeAllowances = sqliteTable("employee_allowances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  allowanceType: text("allowance_type").notNull(), // LUNCH, GAS, PHONE, RESPONSIBILITY, POSITION
  amount: real("amount").notNull().default(0),
  effectiveDate: text("effective_date").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const employeeDeductions = sqliteTable("employee_deductions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  deductionType: text("deduction_type").notNull(), // ADVANCE, LATE, EARLY, UNPAID, OTHER
  amount: real("amount").notNull().default(0),
  reason: text("reason"),
  periodCode: text("period_code").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const insuranceProfiles = sqliteTable("insurance_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id).unique(),
  socialInsuranceNo: text("social_insurance_no"),
  healthInsuranceNo: text("health_insurance_no"),
  baseAmount: real("base_amount").notNull().default(0),
  startDate: text("start_date").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const taxProfiles = sqliteTable("tax_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id).unique(),
  taxCode: text("tax_code"),
  dependentsCount: integer("dependents_count").notNull().default(0),
  deductionAmount: real("deduction_amount").notNull().default(11000000),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const performanceReviews = sqliteTable("performance_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  cycle: text("cycle").notNull(), // MONTHLY, QUARTERLY, YEARLY
  period: text("period").notNull(), // 2026-Q3
  kpiScore: real("kpi_score").notNull().default(0),
  rating: text("rating").notNull().default("GOOD"), // EXCELLENT, GOOD, AVERAGE, POOR
  comments: text("comments"),
  reviewerId: integer("reviewer_id").references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const employeeAssets = sqliteTable("employee_assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  assetName: text("asset_name").notNull(),
  assetCode: text("asset_code"),
  assignedDate: text("assigned_date").notNull(),
  returnDate: text("return_date"),
  status: text("status").notNull().default("ASSIGNED"), // ASSIGNED, RETURNED, DAMAGED
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const employeeTransfers = sqliteTable("employee_transfers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  oldDepartmentId: integer("old_department_id"),
  newDepartmentId: integer("new_department_id"),
  oldPositionId: integer("old_position_id"),
  newPositionId: integer("new_position_id"),
  oldBranchId: integer("old_branch_id"),
  newBranchId: integer("new_branch_id"),
  effectiveDate: text("effective_date").notNull(),
  reason: text("reason"),
  approvedBy: integer("approved_by").references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const employeeTerminations = sqliteTable("employee_terminations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id).unique(),
  terminationDate: text("termination_date").notNull(),
  reason: text("reason").notNull(),
  handoverNotes: text("handover_notes"),
  assetCleared: integer("asset_cleared").notNull().default(0), // 0 or 1
  salaryCleared: integer("salary_cleared").notNull().default(0), // 0 or 1
  insuranceCleared: integer("insurance_cleared").notNull().default(0), // 0 or 1
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});








// ==========================================
// 12. RETURNS (SALES & PURCHASE)
// ==========================================

export const purchaseReturns = sqliteTable("purchase_returns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. PR-1234
  poId: integer("po_id").references(() => purchaseOrders.id),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  status: text("status").notNull().default('DRAFT'), // DRAFT, RETURNED
  refundStatus: text("refund_status").notNull().default('PENDING'), // PENDING, PARTIALLY_REFUNDED, REFUNDED, AP_CREDITED, NOT_REQUIRED
  refundedAmount: real("refunded_amount").notNull().default(0),
  returnDate: integer("return_date", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  totalAmount: real("total_amount").default(0), // Value of return (for AP adjustment)
  reason: text("reason"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const purchaseReturnItems = sqliteTable("purchase_return_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  purchaseReturnId: integer("purchase_return_id").notNull().references(() => purchaseReturns.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(), // Cost being refunded
  reason: text("reason"),
  serialNumbers: text("serial_numbers", { mode: 'json' }), // Added for Phase 2 Serial Integration
});

export const salesReturns = sqliteTable("sales_returns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. SR-1234
  orderId: integer("order_id").references(() => salesOrders.id),
  customerId: integer("customer_id").notNull().references(() => customers.id), // Or nullable for walk-in POS
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  status: text("status").notNull().default('DRAFT'), // DRAFT, RECEIVED
  refundStatus: text("refund_status").notNull().default('PENDING'), // PENDING, PARTIALLY_REFUNDED, REFUNDED, AR_CREDITED, NOT_REQUIRED
  refundedAmount: real("refunded_amount").notNull().default(0),
  refundMethod: text("refund_method"), // CASH, BANK_TRANSFER, AR_CREDIT
  cogsAmount: real("cogs_amount").default(0),
  returnDate: integer("return_date", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  totalAmount: real("total_amount").default(0), // Value of refund (for AR adjustment)
  reason: text("reason"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const salesReturnItems = sqliteTable("sales_return_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  salesReturnId: integer("sales_return_id").notNull().references(() => salesReturns.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(), // Price being refunded
  reason: text("reason"),
  serialNumbers: text("serial_numbers", { mode: 'json' }), // Added for Phase 2 Serial Integration
});

// ==========================================
// 13. CROSS-MODULE TASK ENGINE
// ==========================================

export const crossModuleTasks = sqliteTable("cross_module_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskType: text("task_type").notNull(), // e.g. CREATE_STOCK_ADJUSTMENT
  sourceModule: text("source_module").notNull(), // e.g. STOCKTAKE, SALES, PURCHASE
  sourceDocumentType: text("source_document_type").notNull(), // e.g. STOCKTAKE
  sourceDocumentId: integer("source_document_id").notNull(),
  sourceReferenceNo: text("source_reference_no").notNull(), // e.g. STK-2026-00125
  targetModule: text("target_module").notNull(), // e.g. STOCK_ADJUSTMENT
  targetAction: text("target_action").notNull(), // e.g. CREATE_DRAFT
  payload: text("payload", { mode: 'json' }), // JSON details (items, variance, warehouseId, reason)
  status: text("status").notNull().default('PENDING'), // PENDING, COMPLETED, REJECTED
  priority: text("priority").notNull().default('MEDIUM'), // HIGH, MEDIUM, LOW
  assignedRoleId: integer("assigned_role_id"),
  assignedUserId: integer("assigned_user_id"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: 'timestamp' }),
  completedBy: integer("completed_by").references(() => users.id),
}, (table) => ({
  businessKeyIdx: uniqueIndex("cross_module_tasks_business_key_idx").on(
    table.sourceModule,
    table.sourceDocumentType,
    table.sourceDocumentId,
    table.taskType,
    table.targetModule
  )
}));

export const systemNotifications = sqliteTable("system_notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id), // SYSTEM (0) for broadcast, or specific user
  title: text("title").notNull(),
  message: text("message").notNull(),
  referenceKey: text("reference_key").notNull(), // The idempotency key
  readAt: integer("read_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  userRefKeyIdx: uniqueIndex("system_notifications_user_ref_key_idx").on(table.userId, table.referenceKey)
}));

// ==========================================
// 14. MODULE 37: QUALITY MANAGEMENT & QUALITY ASSURANCE (QMS)
// ==========================================

export const qualityInspectionPlans = sqliteTable("quality_inspection_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planCode: text("plan_code").notNull().unique(), // e.g. QIP-2026-00001
  title: text("title").notNull(),
  productId: integer("product_id").references(() => products.id),
  categoryId: integer("category_id").references(() => categories.id),
  inspectionType: text("inspection_type").notNull().default('INCOMING'), // INCOMING, IN_PROCESS, OUTGOING, RE_INSPECTION
  revision: integer("revision").notNull().default(1),
  status: text("status").notNull().default('ACTIVE'), // ACTIVE, ARCHIVED, DRAFT
  aqlLevel: text("aql_level").default('NORMAL'), // NORMAL, TIGHTENED, REDUCED
  sampleSizeFormula: text("sample_size_formula").default('FIXED_10'), // FIXED_10, PERCENT_5, AQL_S3
  characteristics: text("characteristics", { mode: 'json' }), // JSON array of criteria
  createdBy: integer("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }),
});

export const qualityInspections = sqliteTable("quality_inspections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inspectionCode: text("inspection_code").notNull().unique(), // e.g. QIN-2026-00001
  planId: integer("plan_id").references(() => qualityInspectionPlans.id),
  inspectionType: text("inspection_type").notNull(), // INCOMING, IN_PROCESS, OUTGOING, RE_INSPECTION
  sourceDocumentType: text("source_document_type").notNull(), // GOODS_RECEIPT, WORK_ORDER, DELIVERY_ORDER, MANUAL
  sourceDocumentId: integer("source_document_id").notNull(),
  sourceReferenceNo: text("source_reference_no").notNull(),
  productId: integer("product_id").notNull().references(() => products.id),
  lotNumber: text("lot_number"),
  serialNumber: text("serial_number"),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  locationId: integer("location_id").references(() => warehouseLocations.id),
  totalQuantity: integer("total_quantity").notNull().default(1),
  sampleQuantity: integer("sample_quantity").notNull().default(1),
  inspectorId: integer("inspector_id").references(() => users.id),
  status: text("status").notNull().default('PENDING'), // PENDING, IN_PROGRESS, PENDING_DECISION, PASSED, FAILED, COMPLETED, CANCELLED
  decision: text("decision"), // PASSED, FAILED, PASSED_WITH_DEVIATION
  decisionReason: text("decision_reason"),
  decidedBy: integer("decided_by").references(() => users.id),
  decidedAt: integer("decided_at", { mode: 'timestamp' }),
  inspectionRound: integer("inspection_round").notNull().default(1),
  parentInspectionId: integer("parent_inspection_id"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const qualityInspectionResults = sqliteTable("quality_inspection_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inspectionId: integer("inspection_id").notNull().references(() => qualityInspections.id),
  characteristicName: text("characteristic_name").notNull(),
  isQuantitative: integer("is_quantitative", { mode: 'boolean' }).notNull().default(true),
  targetValue: real("target_value"),
  upperTolerance: real("upper_tolerance"),
  lowerTolerance: real("lower_tolerance"),
  measuredValue: real("measured_value"),
  qualitativeResult: text("qualitative_result"), // PASS, FAIL
  isPassed: integer("is_passed", { mode: 'boolean' }).notNull(),
  notes: text("notes"),
  sampleNumber: integer("sample_number").default(1),
});

export const qualityHolds = sqliteTable("quality_holds", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  holdCode: text("hold_code").notNull().unique(), // e.g. QHD-2026-00001
  inspectionId: integer("inspection_id").references(() => qualityInspections.id),
  productId: integer("product_id").notNull().references(() => products.id),
  lotNumber: text("lot_number"),
  serialNumber: text("serial_number"),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  locationId: integer("location_id").references(() => warehouseLocations.id),
  quarantineQuantity: integer("quarantine_quantity").notNull(),
  holdReason: text("hold_reason").notNull(),
  status: text("status").notNull().default('QUARANTINED'), // QUARANTINED, RELEASED, SCRAPPED, REWORK, PARTIAL_RELEASE
  disposition: text("disposition"), // RELEASE_TO_STOCK, SCRAP_FINANCIAL, REWORK_ORDER, RETURN_TO_SUPPLIER
  dispositionNotes: text("disposition_notes"),
  disposedBy: integer("disposed_by").references(() => users.id),
  disposedAt: integer("disposed_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const qualityNcrs = sqliteTable("quality_ncrs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ncrCode: text("ncr_code").notNull().unique(), // e.g. NCR-2026-00001
  inspectionId: integer("inspection_id").references(() => qualityInspections.id),
  holdId: integer("hold_id").references(() => qualityHolds.id),
  title: text("title").notNull(),
  severity: text("severity").notNull().default('MAJOR'), // CRITICAL, MAJOR, MINOR
  description: text("description").notNull(),
  rootCause: text("root_cause"),
  status: text("status").notNull().default('DRAFT'), // DRAFT, UNDER_INVESTIGATION, CAPA_PENDING, VERIFYING, CLOSED, REJECTED
  assigneeId: integer("assignee_id").references(() => users.id),
  reporterId: integer("reporter_id").notNull().references(() => users.id),
  closedBy: integer("closed_by").references(() => users.id),
  closedAt: integer("closed_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const qualityCapas = sqliteTable("quality_capas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  capaCode: text("capa_code").notNull().unique(), // e.g. CAP-2026-00001
  ncrId: integer("ncr_id").notNull().references(() => qualityNcrs.id),
  title: text("title").notNull(),
  correctiveAction: text("corrective_action").notNull(),
  preventiveAction: text("preventive_action").notNull(),
  targetDate: text("target_date"),
  status: text("status").notNull().default('PLANNED'), // PLANNED, IN_PROGRESS, COMPLETED, VERIFIED
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  verifiedBy: integer("verified_by").references(() => users.id),
  verifiedAt: integer("verified_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const lotSerialQualityStatuses = sqliteTable("lot_serial_quality_statuses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  lotNumber: text("lot_number"),
  serialNumber: text("serial_number"),
  qualityStatus: text("quality_status").notNull().default('PENDING'), // PENDING, PASSED, FAILED, QUARANTINED, RELEASED
  lastInspectionId: integer("last_inspection_id").references(() => qualityInspections.id),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// 21. Module 38: Subcontracting & Toll Manufacturing Engine
export const subcontractingOrders = sqliteTable("subcontracting_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderCode: text("order_code").notNull().unique(), // e.g. SCO-2026-00001
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id),
  productId: integer("product_id").notNull().references(() => products.id), // Target Output Product
  bomId: integer("bom_id").references(() => boms.id),
  vendorLocationId: integer("vendor_location_id").references(() => warehouseLocations.id), // Virtual vendor location
  destinationWarehouseId: integer("destination_warehouse_id").notNull().references(() => warehouses.id),
  destinationLocationId: integer("destination_location_id").references(() => warehouseLocations.id),
  orderedQuantity: real("ordered_quantity").notNull(),
  receivedQuantity: real("received_quantity").notNull().default(0),
  serviceUnitPrice: real("service_unit_price").notNull().default(0), // Vendor processing fee per unit
  totalServiceCost: real("total_service_cost").notNull().default(0),
  status: text("status").notNull().default('DRAFT'), // DRAFT, RELEASED, IN_PROGRESS, COMPLETED, CANCELLED
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: integer("approved_at", { mode: 'timestamp' }),
  completedAt: integer("completed_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const subcontractingOrderComponents = sqliteTable("subcontracting_order_components", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subcontractingOrderId: integer("subcontracting_order_id").notNull().references(() => subcontractingOrders.id),
  componentProductId: integer("component_product_id").notNull().references(() => products.id),
  bomQtyPerUnit: real("bom_qty_per_unit").notNull().default(1),
  requiredQuantity: real("required_quantity").notNull(),
  issuedQuantity: real("issued_quantity").notNull().default(0),
  consumedQuantity: real("consumed_quantity").notNull().default(0),
  returnedQuantity: real("returned_quantity").notNull().default(0),
  scrappedQuantity: real("scrapped_quantity").notNull().default(0),
  notes: text("notes"),
});

export const subcontractingMaterialIssues = sqliteTable("subcontracting_material_issues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  issueCode: text("issue_code").notNull().unique(), // e.g. SMI-2026-00001
  subcontractingOrderId: integer("subcontracting_order_id").notNull().references(() => subcontractingOrders.id),
  sourceWarehouseId: integer("source_warehouse_id").notNull().references(() => warehouses.id),
  sourceLocationId: integer("source_location_id").references(() => warehouseLocations.id),
  vendorLocationId: integer("vendor_location_id").references(() => warehouseLocations.id),
  notes: text("notes"),
  status: text("status").notNull().default('POSTED'),
  issuedBy: integer("issued_by").notNull().references(() => users.id),
  issuedAt: integer("issued_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const subcontractingOutputReceipts = sqliteTable("subcontracting_output_receipts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  receiptCode: text("receipt_code").notNull().unique(), // e.g. SOR-2026-00001
  subcontractingOrderId: integer("subcontracting_order_id").notNull().references(() => subcontractingOrders.id),
  receivedQuantity: real("received_quantity").notNull(),
  destinationWarehouseId: integer("destination_warehouse_id").notNull().references(() => warehouses.id),
  destinationLocationId: integer("destination_location_id").references(() => warehouseLocations.id),
  unitMaterialCost: real("unit_material_cost").notNull().default(0),
  unitServiceCost: real("unit_service_cost").notNull().default(0),
  totalUnitCost: real("total_unit_cost").notNull().default(0),
  qualityInspectionId: integer("quality_inspection_id").references(() => qualityInspections.id),
  status: text("status").notNull().default('POSTED'),
  notes: text("notes"),
  receivedBy: integer("received_by").notNull().references(() => users.id),
  receivedAt: integer("received_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const subcontractorStockBalances = sqliteTable("subcontractor_stock_balances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  vendorLocationId: integer("vendor_location_id").references(() => warehouseLocations.id),
  productId: integer("product_id").notNull().references(() => products.id),
  physicalQuantity: real("physical_quantity").notNull().default(0),
  allocatedQuantity: real("allocated_quantity").notNull().default(0),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ==========================================
// 34. MODULE 34: Commission & Sales Incentive Engine
// ==========================================

export const commissionPlans = sqliteTable("commission_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planCode: text("plan_code").notNull().unique(), // e.g. COM-PLAN-2026-001
  name: text("name").notNull(),
  description: text("description"),
  calculationBasis: text("calculation_basis").notNull().default("ORDER_CONFIRMED"), // ORDER_CONFIRMED, INVOICE_ISSUED, PAYMENT_COLLECTED
  payoutFrequency: text("payout_frequency").notNull().default("MONTHLY"), // MONTHLY, QUARTERLY, ANNUAL, TRANSACTIONAL
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, INACTIVE, DRAFT
  validFrom: integer("valid_from", { mode: 'timestamp' }),
  validTo: integer("valid_to", { mode: 'timestamp' }),
  isDefault: integer("is_default", { mode: 'boolean' }).notNull().default(false),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const commissionRules = sqliteTable("commission_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planId: integer("plan_id").notNull().references(() => commissionPlans.id),
  ruleName: text("rule_name").notNull(),
  ruleType: text("rule_type").notNull().default("TIERED_AMOUNT"), // FLAT_RATE, TIERED_AMOUNT, TIERED_PERCENT, PRODUCT_CATEGORY, ACCELERATOR
  minThreshold: real("min_threshold").notNull().default(0), // Min amount or units for tier
  maxThreshold: real("max_threshold"), // Nullable for infinity tier
  ratePercent: real("rate_percent").notNull().default(0), // e.g. 5.0 for 5%
  fixedAmount: real("fixed_amount").notNull().default(0), // e.g. 500000 VND per unit
  acceleratorMultiplier: real("accelerator_multiplier").notNull().default(1.0), // e.g. 1.2x if over quota
  productId: integer("product_id").references(() => products.id),
  categoryId: integer("category_id").references(() => categories.id),
  priorityOrder: integer("priority_order").notNull().default(1),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const salesQuotas = sqliteTable("sales_quotas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quotaCode: text("quota_code").notNull().unique(), // e.g. QTA-2026-M03-001
  userId: integer("user_id").notNull().references(() => users.id), // Sales Rep
  period: text("period").notNull(), // e.g. 2026-03, 2026-Q1
  startDate: integer("start_date", { mode: 'timestamp' }).notNull(),
  endDate: integer("end_date", { mode: 'timestamp' }).notNull(),
  targetRevenue: real("target_revenue").notNull().default(0),
  targetQuantity: real("target_quantity").notNull().default(0),
  actualRevenue: real("actual_revenue").notNull().default(0),
  actualQuantity: real("actual_quantity").notNull().default(0),
  attainmentPercent: real("attainment_percent").notNull().default(0),
  acceleratorMultiplier: real("accelerator_multiplier").notNull().default(1.0),
  status: text("status").notNull().default("ACTIVE"), // DRAFT, ACTIVE, CLOSED, CANCELLED
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const commissionCalculations = sqliteTable("commission_calculations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  calculationCode: text("calculation_code").notNull().unique(), // e.g. CALC-2026-00001
  salesOrderId: integer("sales_order_id").references(() => salesOrders.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  paymentId: integer("payment_id"), // Ref customerPayments
  salesReturnId: integer("sales_return_id"), // Ref salesReturns for clawbacks
  salesPersonId: integer("sales_person_id").notNull().references(() => users.id),
  planId: integer("plan_id").references(() => commissionPlans.id),
  ruleId: integer("rule_id").references(() => commissionRules.id),
  baseAmount: real("base_amount").notNull().default(0), // Order or Invoice Amount subject to commission
  ratePercent: real("rate_percent").notNull().default(0),
  acceleratorMultiplier: real("accelerator_multiplier").notNull().default(1.0),
  commissionAmount: real("commission_amount").notNull().default(0), // Can be negative for clawback
  isClawback: integer("is_clawback", { mode: 'boolean' }).notNull().default(false),
  triggerEvent: text("trigger_event").notNull().default("ORDER_CONFIRMED"), // ORDER_CONFIRMED, INVOICE_ISSUED, PAYMENT_COLLECTED, RETURN_PROCESSED
  status: text("status").notNull().default("ACCRUED"), // ACCRUED, ELIGIBLE, SETTLED, CLAWED_BACK, VOIDED
  calculationDate: integer("calculation_date", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  payoutId: integer("payout_id"), // Ref commissionPayouts when included in a batch
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const commissionPayouts = sqliteTable("commission_payouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  payoutCode: text("payout_code").notNull().unique(), // e.g. PAYOUT-2026-M03
  title: text("title").notNull(), // e.g. Quyết toán Hoa hồng Tháng 03/2026
  period: text("period").notNull(), // 2026-03
  startDate: integer("start_date", { mode: 'timestamp' }).notNull(),
  endDate: integer("end_date", { mode: 'timestamp' }).notNull(),
  totalGrossAmount: real("total_gross_amount").notNull().default(0),
  totalClawbackAmount: real("total_clawback_amount").notNull().default(0),
  totalNetAmount: real("total_net_amount").notNull().default(0),
  totalBeneficiaries: integer("total_beneficiaries").notNull().default(0),
  status: text("status").notNull().default("DRAFT"), // DRAFT, REVIEWED, APPROVED, PAID, CANCELLED
  paymentMethod: text("payment_method").notNull().default("BANK_TRANSFER"), // BANK_TRANSFER, CASH, PAYROLL_INTEGRATION
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: integer("approved_at", { mode: 'timestamp' }),
  paidBy: integer("paid_by").references(() => users.id),
  paidAt: integer("paid_at", { mode: 'timestamp' }),
  accountingEntryId: integer("accounting_entry_id"), // Ref journalEntries
  payoutAccountingEntryId: integer("payout_accounting_entry_id"), // Ref disbursement journalEntries
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const commissionPayoutItems = sqliteTable("commission_payout_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  payoutId: integer("payout_id").notNull().references(() => commissionPayouts.id),
  salesPersonId: integer("sales_person_id").notNull().references(() => users.id),
  grossCommission: real("gross_commission").notNull().default(0),
  clawbackDeductions: real("clawback_deductions").notNull().default(0),
  netPayoutAmount: real("net_payout_amount").notNull().default(0),
  paymentStatus: text("payment_status").notNull().default("PENDING"), // PENDING, PROCESSED, HELD
  bankAccountInfo: text("bank_account_info"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// =========================================================================
// 40. CAND-G08C: External Process Instances & Process Step Traceability (Rule #19 Compliant)
// =========================================================================
export const processInstances = sqliteTable("process_instances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  processInstanceCode: text("process_instance_code").notNull().unique(), // e.g. PI-P2P-20260823-0001
  processDefinitionKey: text("process_definition_key").notNull(), // e.g. PROCURE_TO_PAY, ORDER_TO_CASH
  processName: text("process_name").notNull(),
  businessKey: text("business_key").notNull(), // e.g. PO-2026-000123 (Loose document/entity identifier)
  rootEntityModule: text("root_entity_module").notNull(), // e.g. PURCHASE, SALES, MANUFACTURING
  rootEntityType: text("root_entity_type").notNull(), // e.g. PURCHASE_ORDER, SALES_ORDER
  rootEntityId: text("root_entity_id").notNull(), // Loose entity string identifier
  status: text("status").notNull().default("RUNNING"), // RUNNING, COMPLETED, SUSPENDED, CANCELLED, FAILED
  currentStep: text("current_step").notNull(), // e.g. PO_APPROVED, AWAITING_RECEIPT
  correlationId: text("correlation_id").notNull(),
  causationId: text("causation_id"),
  initiatorUserId: integer("initiator_user_id"),
  contextPayload: text("context_payload", { mode: 'json' }), // Optional metadata JSON
  startedAt: integer("started_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: 'timestamp' }),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  uniqueDefKeyBusinessKeyIdx: uniqueIndex("process_instances_def_key_business_key_idx").on(table.processDefinitionKey, table.businessKey),
  businessKeyIdx: index("process_instances_business_key_idx").on(table.businessKey),
  correlationIdx: index("process_instances_correlation_idx").on(table.correlationId),
  definitionKeyIdx: index("process_instances_def_key_idx").on(table.processDefinitionKey),
  statusIdx: index("process_instances_status_idx").on(table.status),
}));

export const processInstanceSteps = sqliteTable("process_instance_steps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  processInstanceId: integer("process_instance_id").notNull().references(() => processInstances.id, { onDelete: 'cascade' }),
  stepCode: text("step_code").notNull(), // e.g. STEP_PO_APPROVAL, STEP_GOODS_RECEIPT
  stepName: text("step_name").notNull(),
  status: text("status").notNull().default("COMPLETED"), // PENDING, IN_PROGRESS, COMPLETED, SKIPPED, FAILED
  entityModule: text("entity_module").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(), // Loose string reference
  eventId: text("event_id"), // Outbox eventId link if event-triggered
  performedBy: integer("performed_by"),
  stepPayload: text("step_payload", { mode: 'json' }),
  durationMs: integer("duration_ms"),
  startedAt: integer("started_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: 'timestamp' }),
}, (table) => ({
  instanceStepIdx: index("process_steps_instance_idx").on(table.processInstanceId),
  entityRefIdx: index("process_steps_entity_ref_idx").on(table.entityType, table.entityId),
  eventIdIdx: index("process_steps_event_id_idx").on(table.eventId),
}));

// =========================================================================
// MODULE 40: ADVANCED WMS EXTENDED & LOGISTICS OPERATIONS (Rule #19 Compliant)
// =========================================================================

export const wmsWaves = sqliteTable("wms_waves", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  waveNumber: text("wave_number").notNull().unique(), // e.g., WAV-2026-0001
  warehouseCode: text("warehouse_code").notNull(),
  waveType: text("wave_type").notNull().default("SALES_OUTBOUND"), // SALES_OUTBOUND, REPLENISHMENT, TRANSFER
  status: text("status").notNull().default("DRAFT"), // DRAFT, RELEASED, IN_PROGRESS, COMPLETED, CANCELLED
  priority: integer("priority").default(1),
  totalOrders: integer("total_orders").default(0),
  totalItems: integer("total_items").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const wmsPickingTasks = sqliteTable("wms_picking_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskNumber: text("task_number").notNull().unique(), // e.g., TASK-PICK-0001
  waveId: integer("wave_id").references(() => wmsWaves.id, { onDelete: 'cascade' }),
  orderCode: text("order_code").notNull(),
  sku: text("sku").notNull(),
  fromLocationCode: text("from_location_code").notNull(),
  toStagingLocationCode: text("to_staging_location_code").notNull(),
  quantityRequested: real("quantity_requested").notNull(),
  quantityPicked: real("quantity_picked").default(0),
  pickerEmployeeCode: text("picker_employee_code"),
  status: text("status").notNull().default("PENDING"), // PENDING, ASSIGNED, PICKING, PICKED, SHORT_PICKED, CANCELLED
  sequence: integer("sequence").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const wmsPutawayRules = sqliteTable("wms_putaway_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ruleCode: text("rule_code").notNull().unique(),
  warehouseCode: text("warehouse_code").notNull(),
  abcClass: text("abc_class").default("A"), // A, B, C
  zoneType: text("zone_type").default("BULK"), // BULK, PICK_FACE, COLD_STORAGE, HAZMAT
  strategy: text("strategy").default("FEFO"), // FEFO, FIFO, MAX_CUBE, NEAREST_EMPTY
  priority: integer("priority").default(1),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const wmsReplenishmentTasks = sqliteTable("wms_replenishment_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  replenishmentNumber: text("replenishment_number").notNull().unique(),
  warehouseCode: text("warehouse_code").notNull(),
  sku: text("sku").notNull(),
  fromLocationCode: text("from_location_code").notNull(),
  toLocationCode: text("to_location_code").notNull(),
  minThreshold: real("min_threshold").notNull(),
  maxCapacity: real("max_capacity").notNull(),
  quantityToMove: real("quantity_to_move").notNull(),
  status: text("status").notNull().default("SUGGESTED"), // SUGGESTED, APPROVED, IN_TRANSIT, COMPLETED, CANCELLED
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const wmsCrossDocks = sqliteTable("wms_cross_docks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  crossDockNumber: text("cross_dock_number").notNull().unique(),
  inboundGrnCode: text("inbound_grn_code").notNull(),
  outboundOrderCode: text("outbound_order_code").notNull(),
  sku: text("sku").notNull(),
  quantity: real("quantity").notNull(),
  stagingLocationCode: text("staging_location_code").notNull(),
  status: text("status").notNull().default("PLANNED"), // PLANNED, STAGED, LOADED, CANCELLED
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const wmsDockAppointments = sqliteTable("wms_dock_appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  appointmentNumber: text("appointment_number").notNull().unique(),
  warehouseCode: text("warehouse_code").notNull(),
  dockDoorCode: text("dock_door_code").notNull(),
  carrierCode: text("carrier_code").notNull(),
  appointmentType: text("appointment_type").notNull().default("INBOUND_RECEIVING"), // INBOUND_RECEIVING, OUTBOUND_DISPATCH
  scheduledStartTime: integer("scheduled_start_time", { mode: 'timestamp' }).notNull(),
  scheduledEndTime: integer("scheduled_end_time", { mode: 'timestamp' }).notNull(),
  actualCheckInTime: integer("actual_check_in_time", { mode: 'timestamp' }),
  actualCheckOutTime: integer("actual_check_out_time", { mode: 'timestamp' }),
  status: text("status").notNull().default("SCHEDULED"), // SCHEDULED, CHECKED_IN, IN_PROGRESS, COMPLETED, NO_SHOW, CANCELLED
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const wmsYardContainers = sqliteTable("wms_yard_containers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  containerNumber: text("container_number").notNull().unique(),
  carrierCode: text("carrier_code").notNull(),
  yardSpotCode: text("yard_spot_code").notNull(),
  containerType: text("container_type").notNull().default("DRY_VAN"), // DRY_VAN, REEFER, FLATBED, CONTAINER_20FT, CONTAINER_40FT
  status: text("status").notNull().default("PARKED"), // PARKED, AT_DOCK, EMPTY, LOADED, DEPARTED
  contentsDescription: text("contents_description"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const wmsPackingStations = sqliteTable("wms_packing_stations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stationCode: text("station_code").notNull().unique(),
  warehouseCode: text("warehouse_code").notNull(),
  scaleConnected: integer("scale_connected", { mode: 'boolean' }).default(false),
  printerCode: text("printer_code"),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const wmsLpns = sqliteTable("wms_lpns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lpnCode: text("lpn_code").notNull().unique(), // e.g. LPN-1002938482
  lpnType: text("lpn_type").notNull().default("CARTON"), // CARTON, PALLET, TOTE
  orderCode: text("order_code"),
  warehouseCode: text("warehouse_code").notNull(),
  currentLocationCode: text("current_location_code").notNull(),
  weightKg: real("weight_kg").default(0),
  volumeCbm: real("volume_cbm").default(0),
  status: text("status").notNull().default("BUILDING"), // BUILDING, PACKED, STAGED, SHIPPED
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const wmsCarrierRates = sqliteTable("wms_carrier_rates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rateCardCode: text("rate_card_code").notNull().unique(),
  carrierCode: text("carrier_code").notNull(),
  serviceLevel: text("service_level").notNull().default("GROUND"), // EXPRESS, GROUND, LTL, FTL, SAME_DAY
  minWeightKg: real("min_weight_kg").default(0),
  maxWeightKg: real("max_weight_kg").default(99999),
  baseRate: real("base_rate").notNull(),
  perKgRate: real("per_kg_rate").default(0),
  fuelSurchargePercent: real("fuel_surcharge_percent").default(0),
  effectiveFrom: integer("effective_from", { mode: 'timestamp' }).notNull(),
  effectiveTo: integer("effective_to", { mode: 'timestamp' }).notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ==========================================
// MODULE 41: CAND-41A PROCESS ORCHESTRATION & EXCEPTIONS
// ==========================================
export const orchestrationInstances = sqliteTable("orchestration_instances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  processType: text("process_type").notNull(), // P2P, O2C, MFG, QUALITY, EAM, PROJECT, SUBCONTRACT, LOGISTICS, WMS
  referenceCode: text("reference_code").notNull().unique(), // e.g. PO-2026-001, SO-2026-001
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, COMPLETED, EXCEPTION, CANCELLED
  currentStep: text("current_step").notNull(),
  slaDeadline: integer("sla_deadline", { mode: 'timestamp' }),
  metadata: text("metadata"), // JSON string for process context
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const orchestrationSteps = sqliteTable("orchestration_steps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  instanceId: integer("instance_id").notNull().references(() => orchestrationInstances.id),
  stepName: text("step_name").notNull(),
  moduleSource: text("module_source").notNull(), // e.g. PURCHASING, WAREHOUSE, SALES, MFG
  status: text("status").notNull().default("PENDING"), // PENDING, IN_PROGRESS, COMPLETED, FAILED
  payloadSummary: text("payload_summary"),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const orchestrationExceptions = sqliteTable("orchestration_exceptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  instanceId: integer("instance_id").notNull().references(() => orchestrationInstances.id),
  errorMessage: text("error_message").notNull(),
  severity: text("severity").notNull().default("MEDIUM"), // LOW, MEDIUM, HIGH, CRITICAL
  status: text("status").notNull().default("OPEN"), // OPEN, ACKNOWLEDGED, RESOLVED
  assignedRole: text("assigned_role").notNull().default("ADMIN"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  resolvedAt: integer("resolved_at", { mode: 'timestamp' }),
});





export const consolidationGroups = sqliteTable("consolidation_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  baseCurrency: text("base_currency").notNull().default('VND'),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const consolidationEntities = sqliteTable("consolidation_entities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id").notNull().references(() => consolidationGroups.id),
  branchId: integer("branch_id").notNull().references(() => warehouses.id),
  entityType: text("entity_type").notNull().default('SUBSIDIARY'), // 'PARENT', 'SUBSIDIARY'
  ownershipPercentage: real("ownership_percentage").notNull().default(100),
});

export const consolidationRuns = sqliteTable("consolidation_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  runCode: text("run_code").notNull().unique(),
  groupId: integer("group_id").notNull().references(() => consolidationGroups.id),
  periodStart: integer("period_start", { mode: 'timestamp' }).notNull(),
  periodEnd: integer("period_end", { mode: 'timestamp' }).notNull(),
  status: text("status").notNull().default('DRAFT'), // 'DRAFT', 'COMPLETED', 'APPROVED'
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const consolidationAdjustments = sqliteTable("consolidation_adjustments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  runId: integer("run_id").notNull().references(() => consolidationRuns.id),
  entryType: text("entry_type").notNull(), // 'ELIMINATION', 'ADJUSTMENT'
  debitAccount: text("debit_account").notNull(),
  creditAccount: text("credit_account").notNull(),
  amount: real("amount").notNull(),
  description: text("description"),
  sourceEntityId: integer("source_entity_id").references(() => consolidationEntities.id),
  targetEntityId: integer("target_entity_id").references(() => consolidationEntities.id),
});

export const srmRfqs = sqliteTable("srm_rfqs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  status: text("status").notNull().default('DRAFT'), // DRAFT, PUBLISHED, CLOSED, EVALUATING, AWARDED, CANCELLED
  deadline: integer("deadline", { mode: 'timestamp' }),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const srmRfqItems = sqliteTable("srm_rfq_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rfqId: integer("rfq_id").notNull().references(() => srmRfqs.id),
  productId: integer("product_id").notNull().references(() => products.id),
  targetQuantity: real("target_quantity").notNull(),
});

export const srmRfqSuppliers = sqliteTable("srm_rfq_suppliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rfqId: integer("rfq_id").notNull().references(() => srmRfqs.id),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  invitedAt: integer("invited_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const srmBids = sqliteTable("srm_bids", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rfqId: integer("rfq_id").notNull().references(() => srmRfqs.id),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  status: text("status").notNull().default('DRAFT'), // DRAFT, SUBMITTED, REVISED, ACCEPTED, REJECTED
  totalValue: real("total_value"),
  submittedAt: integer("submitted_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});



export const bankAccounts = sqliteTable("bank_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull().unique(),
  accountName: text("account_name").notNull(),
  currency: text("currency").notNull().default("VND"),
  accountType: text("account_type").default("SAVINGS"),
  bookBalance: real("book_balance").default(0),
  bankBalance: real("bank_balance").default(0),
  branchId: integer("branch_id").references(() => warehouses.id),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const bankTransactions = sqliteTable("bank_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bankAccountId: integer("bank_account_id").notNull().references(() => bankAccounts.id),
  bankTransactionId: text("bank_transaction_id").notNull().unique(), // External ID for idempotency
  bankRef: text("bank_ref"),
  amount: real("amount").notNull(), // positive for IN, negative for OUT
  reference: text("reference"),
  transactionDate: integer("transaction_date", { mode: 'timestamp' }).notNull(),
  status: text("status").notNull().default("UNMATCHED"), // UNMATCHED, MATCHED, IGNORED
  reconciledInvoiceId: integer("reconciled_invoice_id").references(() => invoices.id),
  reconciledPaymentId: integer("reconciled_payment_id").references(() => payments.id),
  reconciledBy: integer("reconciled_by").references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const srmBidItems = sqliteTable("srm_bid_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bidId: integer("bid_id").notNull().references(() => srmBids.id),
  rfqItemId: integer("rfq_item_id").notNull().references(() => srmRfqItems.id),
  unitPrice: real("unit_price").notNull(),
  offeredQuantity: real("offered_quantity").notNull(),
  leadTimeDays: integer("lead_time_days"),
});

// -------------------------------------------------------------
// ORCHESTRATION LAYER TABLES
// -------------------------------------------------------------

import { sql, relations } from "drizzle-orm";

export const functionalGroups = sqliteTable("functional_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon"),
  displayOrder: integer("display_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const functionalGroupsRelations = relations(functionalGroups, ({ many }) => ({
  workspaces: many(businessWorkspaces),
}));

export const businessWorkspaces = sqliteTable("business_workspaces", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  functionalGroupId: integer("functional_group_id").references(() => functionalGroups.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // O2C, P2P, INVENTORY, FINANCE
  icon: text("icon"),
  color: text("color"),
  displayOrder: integer("display_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const businessWorkspacesRelations = relations(businessWorkspaces, ({ one }) => ({
  functionalGroup: one(functionalGroups, {
    fields: [businessWorkspaces.functionalGroupId],
    references: [functionalGroups.id],
  }),
}));

export const businessProcesses = sqliteTable("business_processes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  processKey: text("process_key").notNull().unique(), // e.g. O2C_FLOW
  name: text("name").notNull(),
  workspaceId: integer("workspace_id").references(() => businessWorkspaces.id),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  definitionPayload: text("definition_payload"), // JSON structure of steps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const businessTasks = sqliteTable("business_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  processInstanceId: integer("process_instance_id").notNull(), // References process_instances.id
  taskCode: text("task_code").notNull(), // e.g. APPROVE_SO
  title: text("title").notNull(),
  status: text("status").notNull().default("PENDING"), // PENDING, COMPLETED, FAILED, CANCELLED
  assignedRole: text("assigned_role"), // e.g. SUPER_ADMIN, MANAGER
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  entityModule: text("entity_module").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  actionEndpoint: text("action_endpoint"), // e.g. POST /api/sales-orders/:id/confirm
  actionPayload: text("action_payload"), // JSON
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  completedBy: integer("completed_by").references(() => users.id),
});

// ==========================================
// MODULE: FINANCE (CAND-G11) - NON-POSTING
// ==========================================

export const corporateBudgets = sqliteTable("corporate_budgets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. BGT-2026-08-01
  version: integer("version").notNull().default(1),
  departmentId: integer("department_id").notNull().references(() => departments.id),
  periodMonth: integer("period_month").notNull(),
  periodYear: integer("period_year").notNull(),
  currency: text("currency").notNull().default("VND"),
  status: text("status").notNull().default("DRAFT"), // DRAFT, SUBMITTED, APPROVED, LOCKED
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: integer("approved_at", { mode: 'timestamp' }),
});

export const budgetLines = sqliteTable("budget_lines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  budgetId: integer("budget_id").notNull().references(() => corporateBudgets.id),
  accountId: integer("account_id").notNull().references(() => accountingAccounts.id),
  plannedAmount: real("planned_amount").notNull(),
});

export const varianceRules = sqliteTable("variance_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  departmentId: integer("department_id").references(() => departments.id),
  accountId: integer("account_id").notNull().references(() => accountingAccounts.id),
  varianceThresholdPercentage: real("variance_threshold_percentage").notNull(),
});

// ==========================================
// WORKFLOW & APPROVAL TRACKING
// ==========================================
export const approvalHistory = sqliteTable("approval_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  documentId: text("document_id").notNull(),
  documentType: text("document_type").notNull(),
  step: text("step").notNull(),
  action: text("action").notNull(),
  actorId: integer("actor_id"),
  actorRole: text("actor_role"),
  comments: text("comments"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ==========================================
// BANK STATEMENTS ALIAS & TREASURY
// ==========================================
export const bankStatements = bankTransactions;

export const cashVouchers = sqliteTable("cash_vouchers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  voucherCode: text("voucher_code").notNull().unique(),
  voucherType: text("voucher_type").notNull().default("RECEIPT"), // RECEIPT, PAYMENT
  partnerType: text("partner_type").default("CUSTOMER"),
  partnerName: text("partner_name").notNull(),
  amount: real("amount").notNull(),
  bankAccountId: integer("bank_account_id"),
  bankName: text("bank_name"),
  paymentMethod: text("payment_method").default("BANK_TRANSFER"),
  status: text("status").notNull().default("PENDING_APPROVAL"),
  date: text("date").notNull(),
  reason: text("reason"),
  accountingEntry: text("accounting_entry"),
  createdBy: text("created_by").default("Admin"),
  approvedBy: text("approved_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const treasuryTransfers = sqliteTable("treasury_transfers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transferCode: text("transfer_code").notNull().unique(),
  fromAccountId: integer("from_account_id").notNull(),
  fromBankName: text("from_bank_name").notNull(),
  toAccountId: integer("to_account_id").notNull(),
  toBankName: text("to_bank_name").notNull(),
  amount: real("amount").notNull(),
  fee: real("fee").default(0),
  status: text("status").notNull().default("COMPLETED"),
  date: text("date").notNull(),
  reason: text("reason"),
  accountingEntry: text("accounting_entry"),
  createdBy: text("created_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ==========================================
// DOCUMENT MANAGEMENT SYSTEM (DMS)
// ==========================================
export const dmsDocuments = sqliteTable("dms_documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  docCode: text("doc_code").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull().default("GENERAL"),
  categoryName: text("category_name").default("Tài liệu Chung"),
  version: text("version").default("v1.0"),
  fileSize: text("file_size").default("1.5 MB"),
  format: text("format").default("PDF"),
  status: text("status").notNull().default("DRAFT"),
  securityLevel: text("security_level").default("INTERNAL"),
  sha256Hash: text("sha256_hash"),
  signedBy: text("signed_by"),
  signedAt: text("signed_at"),
  linkedModule: text("linked_module"),
  refDocNo: text("ref_doc_no"),
  storageTier: text("storage_tier").default("ACTIVE_VAULT"),
  retentionYears: integer("retention_years").default(5),
  expireDate: text("expire_date"),
  workflowStage: integer("workflow_stage").default(1),
  workflowSteps: text("workflow_steps"), // JSON string
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ==========================================
// FINANCE: CREDIT NOTES, DEBIT NOTES & EVENTS
// ==========================================
export const creditNotes = sqliteTable("credit_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  creditNoteNumber: text("credit_note_number").notNull().unique(),
  originalInvoiceNumber: text("original_invoice_number").notNull(),
  customerName: text("customer_name").notNull(),
  amount: real("amount").notNull(),
  vatAmount: real("vat_amount").default(0),
  finalAmount: real("final_amount").notNull(),
  rmaCode: text("rma_code"),
  reason: text("reason"),
  status: text("status").notNull().default("APPROVED"),
  date: text("date").notNull(),
  accountingEntry: text("accounting_entry"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const debitNotes = sqliteTable("debit_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  debitNoteNumber: text("debit_note_number").notNull().unique(),
  originalInvoiceNumber: text("original_invoice_number").notNull(),
  supplierName: text("supplier_name").notNull(),
  amount: real("amount").notNull(),
  vatAmount: real("vat_amount").default(0),
  finalAmount: real("final_amount").notNull(),
  purchaseReturnCode: text("purchase_return_code"),
  reason: text("reason"),
  status: text("status").notNull().default("APPROVED"),
  date: text("date").notNull(),
  accountingEntry: text("accounting_entry"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const accountingEvents = sqliteTable("accounting_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: text("event_id").notNull().unique(),
  sourceModule: text("source_module").notNull(),
  eventType: text("event_type").notNull(),
  invoiceNumber: text("invoice_number"),
  partnerName: text("partner_name"),
  amount: real("amount").notNull(),
  vatAmount: real("vat_amount").default(0),
  totalAmount: real("total_amount").notNull(),
  accountingStatus: text("accounting_status").notNull().default("POSTED_TO_GL"),
  glJournalId: text("gl_journal_id"),
  timestamp: text("timestamp").notNull(),
  entryRules: text("entry_rules"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ==========================================
// ENTERPRISE CASH CONTROL & SHIFT MANAGEMENT
// ==========================================
export const cashDrawers = sqliteTable("cash_drawers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  registerId: text("registerId").notNull(),
  storeId: text("storeId").notNull(),
  status: text("status").notNull().default("AVAILABLE"), // AVAILABLE, OCCUPIED, LOCKED
  currentCustodianId: text("current_custodian_id"),
  currentShiftId: integer("current_shift_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const cashShifts = sqliteTable("cash_shifts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shiftNo: text("shift_no").notNull().unique(),
  cashDrawerId: integer("cash_drawer_id").notNull().references(() => cashDrawers.id),
  cashierUserId: text("cashier_user_id").notNull(),
  cashierName: text("cashier_name").notNull(),
  status: text("status").notNull().default("OPEN"), // DRAFT, OPENING, OPEN, CLOSING, COUNTING, RECONCILIATION, PENDING_APPROVAL, CLOSED, SUSPENDED
  openingFloat: real("opening_float").notNull().default(0),
  cashSalesTotal: real("cash_sales_total").default(0),
  cardSalesTotal: real("card_sales_total").default(0),
  transferSalesTotal: real("transfer_sales_total").default(0),
  cashDropsTotal: real("cash_drops_total").default(0),
  payoutsTotal: real("payouts_total").default(0),
  expectedCash: real("expected_cash").default(0),
  actualCountedCash: real("actual_counted_cash").default(0),
  varianceAmount: real("variance_amount").default(0),
  varianceStatus: text("variance_status").default("EXACT"), // EXACT, SHORT, OVER
  supervisorApprovalId: text("supervisor_approval_id"),
  openedAt: integer("opened_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  closedAt: integer("closed_at", { mode: "timestamp" }),
  notes: text("notes"),
});

export const cashMovements = sqliteTable("cash_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  movementNo: text("movement_no").notNull().unique(),
  shiftId: integer("shift_id").references(() => cashShifts.id),
  cashDrawerId: integer("cash_drawer_id").notNull().references(() => cashDrawers.id),
  movementType: text("movement_type").notNull(), // OPENING_FLOAT, SALE_CASH, CASH_DROP, EXPENSE_PAYOUT, REFUND_CASH, CLOSING_TRANSFER
  amount: real("amount").notNull(),
  direction: text("direction").notNull(), // IN, OUT
  custodianId: text("custodian_id").notNull(),
  fromLocation: text("from_location").notNull(),
  toLocation: text("to_location").notNull(),
  referenceNo: text("reference_no"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const cashCounts = sqliteTable("cash_counts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shiftId: integer("shift_id").notNull().references(() => cashShifts.id),
  countType: text("count_type").notNull(), // OPENING, CLOSING, AUDIT
  totalCounted: real("total_counted").notNull(),
  denominationsJson: text("denominations_json").notNull(), // JSON string of denomination counts
  countedBy: text("counted_by").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const cashVariances = sqliteTable("cash_variances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shiftId: integer("shift_id").notNull().references(() => cashShifts.id),
  expectedAmount: real("expected_amount").notNull(),
  countedAmount: real("counted_amount").notNull(),
  varianceAmount: real("variance_amount").notNull(),
  status: text("status").notNull().default("PENDING_REVIEW"), // PENDING_REVIEW, APPROVED, REJECTED
  reviewedBy: text("reviewed_by"),
  reviewNotes: text("review_notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ==========================================
// M41 PRICING DOMAIN TABLES
// ==========================================
export const priceLists = sqliteTable("price_lists", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull().default("RETAIL"),
  currency: text("currency").notNull().default("VND"),
  customerGroupId: text("customer_group_id"),
  validFrom: text("valid_from").notNull(),
  validTo: text("valid_to").notNull(),
  status: text("status").notNull().default("ACTIVE"),
  priority: integer("priority").default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const priceListItems = sqliteTable("price_list_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  priceListId: text("price_list_id").notNull().references(() => priceLists.id),
  productId: text("product_id").notNull(),
  uomId: text("uom_id").notNull().default("PCS"),
  minQty: real("min_qty").notNull().default(1),
  maxQty: real("max_qty").notNull().default(99999),
  unitPrice: real("unit_price").notNull(),
  currency: text("currency").notNull().default("VND"),
  validFrom: text("valid_from").notNull(),
  validTo: text("valid_to").notNull(),
});

export const customerContractPrices = sqliteTable("customer_contract_prices", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  productId: text("product_id").notNull(),
  uomId: text("uom_id").notNull().default("PCS"),
  contractPrice: real("contract_price").notNull(),
  currency: text("currency").notNull().default("VND"),
  validFrom: text("valid_from").notNull(),
  validTo: text("valid_to").notNull(),
  contractCode: text("contract_code").notNull(),
});

export const discountRules = sqliteTable("discount_rules", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull().default("PERCENTAGE"),
  value: real("value").notNull(),
  productId: text("product_id"),
  validFrom: text("valid_from").notNull(),
  validTo: text("valid_to").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});

export const promotionCampaigns = sqliteTable("promotion_campaigns", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  categoryScope: text("category_scope"),
  discountPercentage: real("discount_percentage").notNull(),
  minQty: real("min_qty").default(1),
  customerGroupId: text("customer_group_id"),
  validFrom: text("valid_from").notNull(),
  validTo: text("valid_to").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});

export const marginPolicies = sqliteTable("margin_policies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: text("product_id").notNull().unique(),
  targetMarginPercent: real("target_margin_percent").notNull(),
  minMarginPercent: real("min_margin_percent").notNull(),
});

export const sourcingEvaluations = sqliteTable("sourcing_evaluations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rfqId: integer("rfq_id").notNull().references(() => srmRfqs.id),
  bidId: integer("bid_id").notNull().references(() => srmBids.id),
  evaluatorId: integer("evaluator_id").notNull().references(() => users.id),
  status: text("status").notNull().default("DRAFT"), // DRAFT, IN_PROGRESS, COMPLETED, LOCKED
  totalScore: real("total_score").default(0),
  ranking: integer("ranking").default(1),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const sourcingEvaluationScores = sqliteTable("sourcing_evaluation_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  evaluationId: integer("evaluation_id").notNull().references(() => sourcingEvaluations.id),
  criterionName: text("criterion_name").notNull(),
  weight: real("weight").notNull().default(0),
  score: real("score").notNull().default(0),
  weightedScore: real("weighted_score").notNull().default(0),
});

export const sourcingAwards = sqliteTable("sourcing_awards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  awardNo: text("award_no").notNull().unique(),
  rfqId: integer("rfq_id").notNull().references(() => srmRfqs.id),
  bidId: integer("bid_id").notNull().references(() => srmBids.id),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  evaluationId: integer("evaluation_id").references(() => sourcingEvaluations.id),
  status: text("status").notNull().default("DRAFT"), // DRAFT, AWARD_PENDING, APPROVED, AWARDED, REJECTED, CANCELLED
  totalAmount: real("total_amount").default(0),
  currency: text("currency").default("VND"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: integer("approved_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const sourcingAwardLines = sqliteTable("sourcing_award_lines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  awardId: integer("award_id").notNull().references(() => sourcingAwards.id),
  rfqLineId: integer("rfq_line_id").notNull().references(() => srmRfqItems.id),
  bidLineId: integer("bid_line_id").notNull().references(() => srmBidItems.id),
  awardedQuantity: real("awarded_quantity").notNull(),
  awardedUnitPrice: real("awarded_unit_price").notNull(),
  awardedTotal: real("awarded_total").notNull(),
});

// ==========================================
// M06: INNOVATION R&D PORTAL TABLES
// ==========================================
export const rdProjects = sqliteTable("rd_projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectCode: text("project_code").notNull().unique(), // e.g. RD-2026-001
  title: text("title").notNull(),
  category: text("category").notNull(), // Bán dẫn & Phần cứng, Công nghệ Xanh, Phần mềm AI, Công nghệ Sinh học
  lead: text("lead").notNull(),
  status: text("status").notNull().default("IN_PROGRESS"), // PLANNING, IN_PROGRESS, TESTING, COMPLETED, ON_HOLD
  progress: integer("progress").notNull().default(0), // 0 - 100
  budget: real("budget").notNull().default(0),
  spentBudget: real("spent_budget").notNull().default(0),
  currency: text("currency").notNull().default("VND"),
  startDate: text("start_date").notNull(),
  deadline: text("deadline").notNull(),
  trlLevel: integer("trl_level").notNull().default(3), // TRL 1 - 9
  riskLevel: text("risk_level").notNull().default("MEDIUM"), // LOW, MEDIUM, HIGH
  description: text("description"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const rdFormulas = sqliteTable("rd_formulas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  formulaCode: text("formula_code").notNull().unique(), // e.g. FORM-01
  projectId: integer("project_id").references(() => rdProjects.id),
  name: text("name").notNull(),
  version: text("version").notNull().default("v1.0"),
  status: text("status").notNull().default("REVIEW"), // DRAFT, REVIEW, APPROVED, OBSOLETE
  author: text("author").notNull(),
  components: text("components").notNull(), // JSON string
  yieldRate: real("yield_rate").notNull().default(100.0),
  testBatchSize: real("test_batch_size").notNull().default(10.0),
  approvedBy: text("approved_by"),
  approvedAt: text("approved_at"),
  createdAt: text("created_at").notNull(),
});

export const rdPatents = sqliteTable("rd_patents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patentCode: text("patent_code").notNull().unique(), // e.g. PAT-9921
  projectId: integer("project_id").references(() => rdProjects.id),
  title: text("title").notNull(),
  filingNo: text("filing_no").notNull(),
  filingDate: text("filing_date").notNull(),
  grantDate: text("grant_date"),
  status: text("status").notNull().default("PENDING"), // PENDING, GRANTED, PUBLISHED, REJECTED
  inventors: text("inventors").notNull(),
  jurisdiction: text("jurisdiction").notNull().default("Cục SHTT Việt Nam"),
  abstract: text("abstract"),
  createdAt: text("created_at").notNull(),
});

export const rdLabTrials = sqliteTable("rd_lab_trials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trialCode: text("trial_code").notNull().unique(), // e.g. TRL-2026-001
  projectId: integer("project_id").references(() => rdProjects.id),
  formulaId: integer("formula_id").references(() => rdFormulas.id),
  trialName: text("trial_name").notNull(),
  testType: text("test_type").notNull(), // Stress Test, Thermal Stability, Drop Test, Yield Analysis
  sampleSize: integer("sample_size").notNull().default(5),
  status: text("status").notNull().default("RUNNING"), // SCHEDULED, RUNNING, PASSED, FAILED
  score: real("score").default(0),
  performedBy: text("performed_by").notNull(),
  resultNotes: text("result_notes"),
  conductedAt: text("conducted_at").notNull(),
});



