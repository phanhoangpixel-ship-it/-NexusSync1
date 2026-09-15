BEGIN TRANSACTION;
CREATE TABLE "accounting_accounts" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "description" text
);
CREATE TABLE "accounting_entries" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "entry_code" text NOT NULL,
  "source_module" text NOT NULL,
  "source_document_type" text NOT NULL,
  "source_document_id" integer,
  "source_reference_no" text,
  "debit_account" text NOT NULL,
  "credit_account" text NOT NULL,
  "amount" real NOT NULL,
  "description" text,
  "branch_id" integer,
  "customer_id" integer,
  "supplier_id" integer,
  "created_by" integer NOT NULL,
  "created_at" integer
);
CREATE TABLE "accounting_events" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "event_id" text NOT NULL,
  "source_module" text NOT NULL,
  "event_type" text NOT NULL,
  "invoice_number" text,
  "partner_name" text,
  "amount" real NOT NULL,
  "vat_amount" real,
  "total_amount" real NOT NULL,
  "accounting_status" text,
  "gl_journal_id" text,
  "timestamp" text NOT NULL,
  "entry_rules" text,
  "created_at" integer
);
INSERT INTO "accounting_events" VALUES(1,'FE-2026-0881','SALES_O2C','INVOICE_ISSUED','HD-AR-2026-042','Công ty Cổ phần MISA',120000000.0,12000000.0,132000000.0,'POSTED_TO_GL','GL-2026-0912','2026-08-27 10:15:00','Nợ 131: 132M / Có 511: 120M, Có 3331: 12M',NULL);
INSERT INTO "accounting_events" VALUES(2,'FE-2026-0882','RMA_RETURNS','CREDIT_NOTE_ISSUED','CN-2026-001','Công ty Cổ phần MISA',15000000.0,1500000.0,16500000.0,'POSTED_TO_GL','GL-2026-0915','2026-08-27 14:30:00','Nợ 5212: 15M, Nợ 3331: 1.5M / Có 131: 16.5M',NULL);
CREATE TABLE "activity_logs" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "user_id" integer NOT NULL,
  "action" text NOT NULL,
  "entity" text NOT NULL,
  "entity_id" integer NOT NULL,
  "details" text,
  "created_at" integer
);
CREATE TABLE "approval_history" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "document_id" text NOT NULL,
  "document_type" text NOT NULL,
  "step" text NOT NULL,
  "action" text NOT NULL,
  "actor_id" integer,
  "actor_role" text,
  "comments" text,
  "created_at" text
);
CREATE TABLE "approval_overrides" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "override_code" text NOT NULL,
  "requested_by" text NOT NULL,
  "module" text NOT NULL,
  "action" text NOT NULL,
  "target_ref" text,
  "reason" text NOT NULL,
  "requested_amount" real,
  "status" text,
  "approved_by" text,
  "approval_notes" text,
  "created_at" integer,
  "resolved_at" integer
);
CREATE TABLE "asset_assignments" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "asset_id" integer NOT NULL,
  "assigned_type" text NOT NULL,
  "assigned_id" integer,
  "assigned_name" text NOT NULL,
  "assigned_date" text NOT NULL,
  "return_date" text,
  "status" text,
  "notes" text
);
CREATE TABLE "asset_categories" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "description" text
);
INSERT INTO "asset_categories" VALUES(1,'CAT-SMT','Máy Móc Dây Chuyền SMT','Thiết bị tự động gắn linh kiện dán bề mặt');
INSERT INTO "asset_categories" VALUES(2,'CAT-CNC','Máy Gia Công Cơ Khí CNC','Máy phay cắt khung nhôm chính xác cao');
CREATE TABLE "asset_transfers" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "asset_id" integer NOT NULL,
  "from_branch_id" integer,
  "from_branch_name" text,
  "to_branch_id" integer,
  "to_branch_name" text,
  "transfer_date" text NOT NULL,
  "reason" text,
  "status" text,
  "approved_by" text
);
CREATE TABLE "assets" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "category_id" integer,
  "category_name" text,
  "serial_number" text,
  "model" text,
  "manufacturer" text,
  "supplier_id" integer,
  "supplier_name" text,
  "purchase_date" text,
  "purchase_cost" real,
  "book_value" real,
  "branch_id" integer,
  "department_id" integer,
  "location" text,
  "responsible_employee_id" integer,
  "responsible_employee_name" text,
  "status" text,
  "created_at" integer,
  "updated_at" integer
);
INSERT INTO "assets" VALUES(1,'AST-0001','Máy Gắn Chíp SMT Tự Động Yamaha YSM20R',1,'Máy Móc Dây Chuyền SMT','SN-YMH-2024-889','YSM20R Dual Beam','Yamaha Motor Corp',NULL,NULL,'2024-03-15',1850000000.0,1520000000.0,NULL,NULL,'Xưởng SMT - Dây chuyền 1',NULL,NULL,'ACTIVE',NULL,NULL);
INSERT INTO "assets" VALUES(2,'AST-0002','Máy Phay Nhôm CNC 5 Trục Fanuc Robodrill',2,'Máy Gia Công Cơ Khí CNC','SN-FNC-2023-412','Robodrill D21LiB5','FANUC Japan',NULL,NULL,'2023-11-20',1250000000.0,980000000.0,NULL,NULL,'Xưởng Cơ Khí Chế Tạo',NULL,NULL,'IN_USE',NULL,NULL);
INSERT INTO "assets" VALUES(3,'AST-0003','Tủ Thử Nghiệm Sốc Nhiệt Khí Hậu ESPEC',1,'Máy Móc Dây Chuyền SMT','SN-ESP-2025-101','Platinous Series','ESPEC Corp',NULL,NULL,'2025-01-10',450000000.0,420000000.0,NULL,NULL,'Phòng Lab QC Test',NULL,NULL,'ACTIVE',NULL,NULL);
CREATE TABLE "attendance_records" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "employee_id" integer NOT NULL,
  "work_date" text NOT NULL,
  "check_in" text,
  "check_out" text,
  "status" text,
  "work_hours" real,
  "note" text,
  "created_at" integer
);
CREATE TABLE "audit_logs" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "audit_code" text NOT NULL,
  "user_id" integer NOT NULL,
  "username" text NOT NULL,
  "user_name" text,
  "role" text,
  "branch_id" integer,
  "branch_name" text,
  "warehouse_id" integer,
  "warehouse_name" text,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text NOT NULL,
  "module" text NOT NULL,
  "ip_address" text,
  "device_id" text,
  "device_type" text,
  "app_version" text,
  "browser" text,
  "session_id" text,
  "request_id" text,
  "correlation_id" text,
  "before_data" text,
  "after_data" text,
  "changed_fields" text,
  "result" text,
  "reason" text,
  "metadata" text,
  "created_at" integer
);
INSERT INTO "audit_logs" VALUES(1,'AUD-2026-0001',1,'admin',NULL,'SUPER_ADMIN',NULL,NULL,NULL,NULL,'CREATE','Product','1','INVENTORY',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{"status":"DRAFT"}','{"status":"ACTIVE","sku":"SKU-LAPTOP-01"}',NULL,'SUCCESS',NULL,NULL,1724832000);
INSERT INTO "audit_logs" VALUES(2,'AUD-2026-0002',1,'admin',NULL,'SUPER_ADMIN',NULL,NULL,NULL,NULL,'APPROVE','ManufacturingOrder','1','MANUFACTURING',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{"status":"RELEASED"}','{"status":"IN_PROGRESS"}',NULL,'SUCCESS',NULL,NULL,1724835600);
INSERT INTO "audit_logs" VALUES(3,'AUD-2026-0003',2,'cfo',NULL,'ACCOUNTANT',NULL,NULL,NULL,NULL,'POST','Invoice','102','FINANCE',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{"status":"PENDING"}','{"status":"LOCKED"}',NULL,'PERMISSION_DENIED',NULL,NULL,1724839200);
CREATE TABLE "bank_accounts" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "bank_name" text NOT NULL,
  "account_number" text NOT NULL,
  "account_name" text NOT NULL,
  "currency" text,
  "account_type" text,
  "book_balance" real,
  "bank_balance" real,
  "branch_id" integer,
  "is_active" integer,
  "created_at" integer
);
INSERT INTO "bank_accounts" VALUES(1,'Vietcombank (VCB) - Chi Nhánh Hoàn Kiếm','0011004328888','CÔNG TY CP NEXUSSYNC ERP','VND',NULL,NULL,NULL,NULL,1,NULL);
INSERT INTO "bank_accounts" VALUES(2,'MB Bank (MBB) - Chi Nhánh Mẫu Sơn','888899992026','CÔNG TY CP NEXUSSYNC ERP','VND',NULL,NULL,NULL,NULL,1,NULL);
INSERT INTO "bank_accounts" VALUES(3,'Techcombank (TCB) - Chi Nhánh Hà Nội','1903882716201','CÔNG TY CP NEXUSSYNC ERP','VND',NULL,NULL,NULL,NULL,1,NULL);
CREATE TABLE "bank_transactions" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "bank_account_id" integer NOT NULL,
  "bank_transaction_id" text NOT NULL,
  "bank_ref" text,
  "amount" real NOT NULL,
  "reference" text,
  "transaction_date" integer NOT NULL,
  "status" text,
  "reconciled_invoice_id" integer,
  "reconciled_payment_id" integer,
  "reconciled_by" integer,
  "created_at" integer
);
INSERT INTO "bank_transactions" VALUES(1,1,'FT2624098123912',NULL,176000000.0,'CT VINTECH CORP THANH TOAN HD INV-AR-UNIFIED-859744',1787889300000,'UNMATCHED',NULL,NULL,NULL,NULL);
INSERT INTO "bank_transactions" VALUES(2,1,'FT2624098123915',NULL,-110000000.0,'THANH TOAN TIEN MUA NVL HOADON INV-AP-UNIFIED-859744 MINH PHAT',1787893800000,'UNMATCHED',NULL,NULL,NULL,NULL);
INSERT INTO "bank_transactions" VALUES(3,1,'FT2624098124001',NULL,65000000.0,'CCTY PHONG VU CHUYEN TIEN DAT COC SO-2026-018',1787907600000,'UNMATCHED',NULL,NULL,NULL,NULL);
INSERT INTO "bank_transactions" VALUES(4,1,'FT2624098124088',NULL,-1250000.0,'PHI DICH VU QUAN LY TAI KHOAN DOANH NGHIEP THANG 08/2026',1787913600000,'UNMATCHED',NULL,NULL,NULL,NULL);
CREATE TABLE "bom_items" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "bom_id" integer NOT NULL,
  "material_product_id" integer NOT NULL,
  "quantity" real NOT NULL,
  "uom" text,
  "scrap_rate" real,
  "operation_sequence" integer,
  "warehouse_id" integer,
  "notes" text
);
INSERT INTO "bom_items" VALUES(1,1,3,2.0,'Cuộn',1.5,10,1,NULL);
INSERT INTO "bom_items" VALUES(2,1,4,2.0,'Thanh',0.5,20,1,NULL);
INSERT INTO "bom_items" VALUES(3,1,5,1.0,'Chiếc',0.2,20,1,NULL);
INSERT INTO "bom_items" VALUES(4,1,6,1.0,'Bộ',1.0,30,1,NULL);
CREATE TABLE "bom_versions" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "bom_id" integer NOT NULL,
  "version" text NOT NULL,
  "status" text,
  "effective_from" text,
  "effective_to" text,
  "notes" text,
  "created_by" text,
  "approved_by" text,
  "created_at" integer
);
CREATE TABLE "boms" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "product_id" integer NOT NULL,
  "name" text NOT NULL,
  "uom" text,
  "quantity" real,
  "status" text,
  "version" text,
  "effective_from" text,
  "effective_to" text,
  "notes" text,
  "created_by" text,
  "approved_by" text,
  "created_at" integer,
  "updated_at" integer
);
INSERT INTO "boms" VALUES(1,'BOM-LAPTOP-XPS15-V1',1,'Định mức sản xuất Laptop Dell XPS 15 Core i7','Chiếc',1.0,'ACTIVE','V1.0',NULL,NULL,'Định mức kỹ thuật tiêu chuẩn lắp ráp máy tính cao cấp',NULL,NULL,NULL,NULL);
CREATE TABLE "branches" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "address" text,
  "phone" text,
  "status" text
);
CREATE TABLE "budget_lines" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "budget_id" integer NOT NULL,
  "account_id" integer NOT NULL,
  "planned_amount" real NOT NULL
);
CREATE TABLE "business_processes" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "process_key" text NOT NULL,
  "name" text NOT NULL,
  "workspace_id" integer,
  "is_active" integer,
  "definition_payload" text,
  "created_at" integer
);
INSERT INTO "business_processes" VALUES(1,'O2C_FLOW','Order to Cash',1,1,NULL,'2026-09-14 08:18:18');
INSERT INTO "business_processes" VALUES(2,'P2P_FLOW','Procure to Pay',1,1,NULL,'2026-09-14 08:18:18');
INSERT INTO "business_processes" VALUES(3,'INVENTORY_RECONCILIATION','Inventory Reconciliation',1,1,NULL,'2026-09-14 08:18:18');
INSERT INTO "business_processes" VALUES(4,'PURCHASE_RETURN','Purchase Return',1,1,NULL,'2026-09-14 08:18:18');
INSERT INTO "business_processes" VALUES(5,'SALES_RETURN','Sales Return',1,1,NULL,'2026-09-14 08:18:18');
INSERT INTO "business_processes" VALUES(6,'INVENTORY_TRANSFER','Inventory Transfer',1,1,NULL,'2026-09-14 08:18:18');
CREATE TABLE "business_tasks" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "process_instance_id" integer NOT NULL,
  "task_code" text NOT NULL,
  "title" text NOT NULL,
  "status" text,
  "assigned_role" text,
  "assigned_user_id" integer,
  "entity_module" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text NOT NULL,
  "action_endpoint" text,
  "action_payload" text,
  "error_message" text,
  "created_at" integer,
  "completed_at" integer,
  "completed_by" integer
);
CREATE TABLE "business_workspaces" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "functional_group_id" integer,
  "name" text NOT NULL,
  "description" text,
  "type" text NOT NULL,
  "icon" text,
  "color" text,
  "display_order" integer,
  "created_at" integer
);
INSERT INTO "business_workspaces" VALUES(1,1,'Accounts Receivable (AR)','O2C Invoicing, receipts, reconciliation','FIN_01_AR','ArrowDownLeft','bg-green-500',1,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(2,1,'Accounts Payable (AP)','P2P invoice matching, payments','FIN_02_AP','ArrowUpRight','bg-red-500',2,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(3,1,'Cash Management','Cash collection, disbursement, bank rec','FIN_03_CASH','Wallet','bg-emerald-500',3,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(4,1,'General Ledger & Reporting','GL posting, trial balance, statements','FIN_04_GL','BookOpen','bg-blue-600',4,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(5,1,'Assets & Fixed Asset Mgmt','Acquisition, depreciation, disposal','FIN_05_ASSET','Building2','bg-indigo-500',5,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(6,2,'Inbound & Receiving','GR receipt, inspection, lot creation','OPS_01_INBOUND','ArrowDownToLine','bg-sky-500',1,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(7,2,'Stock Management & Balance','Stock allocation, locations, serials','OPS_02_STOCK_MGMT','Boxes','bg-amber-500',2,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(8,2,'Outbound & Picking','Picking, packing, shipping','OPS_03_OUTBOUND','ArrowUpFromLine','bg-orange-500',3,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(9,2,'Stock Transfer & Movement','Inter-warehouse, adjustments','OPS_04_TRANSFER','ArrowLeftRight','bg-cyan-500',4,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(10,2,'Inventory Reconciliation','Stocktake planning, physical count','OPS_05_STOCKTAKE','ClipboardCheck','bg-lime-500',5,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(11,2,'Return Management','Sales/Purchase returns, inspections','OPS_06_RETURNS','Undo2','bg-rose-500',6,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(12,2,'Supply Chain Planning','Demand forecasting, MRP, reorder','OPS_07_SUPPLY_CHAIN','LineChart','bg-violet-500',7,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(13,2,'Inventory Alerts','Out of stock, expirations, overstock','OPS_08_ALERTS','BellRing','bg-red-600',8,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(14,3,'Sales Order-to-Cash','Order entry, reservation, picking','COM_01_SALES','BadgeDollarSign','bg-blue-500',1,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(15,3,'Point of Sale','POS transactions, payment processing','COM_02_POS','Store','bg-teal-500',2,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(16,3,'Purchase Order & Procure','RFQ to PO, goods receipt','COM_03_PURCHASE','ShoppingBag','bg-purple-500',3,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(17,3,'Customer Management','CRM, credit limits, scoring','COM_04_CUSTOMER','Users','bg-pink-500',4,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(18,3,'Supplier Management','SRM, terms, evaluations','COM_05_SUPPLIER','Briefcase','bg-slate-500',5,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(19,3,'Commission & Sales KPI','Commission plans, tracking, payouts','COM_06_COMMISSION','Percent','bg-fuchsia-500',6,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(20,4,'Manufacturing Orders','Planning, release, execution','PROD_01_MFG','Wrench','bg-orange-600',1,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(21,4,'Subcontracting Management','Subcontract orders, material supply','PROD_02_SUBCONTRACTING','Handshake','bg-cyan-600',2,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(22,4,'Quality Management','QC incoming/in-process, CAPA','PROD_03_QUALITY','ShieldCheck','bg-green-600',3,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(23,5,'Business Reports & Analytics','Sales, inventory, executive dashboard','MGT_01_REPORTS','PieChart','bg-blue-700',1,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(24,5,'Audit & Compliance','Audit trails, retention, compliance','MGT_02_AUDIT','FileSearch','bg-indigo-700',2,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(25,5,'Business Intelligence','Consolidation, trending, forecasting','MGT_03_ANALYTICS','TrendingUp','bg-purple-700',3,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(26,6,'System Administration','Users, roles, fiscal periods','SYS_01_ADMIN','Shield','bg-slate-800',1,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(27,6,'Business Process Orchestration','Workflow design, SLAs','SYS_02_WORKFLOW','Network','bg-slate-700',2,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(28,6,'Data & Integration','Import, export, backup, API','SYS_03_DATA','Database','bg-slate-600',3,'2026-09-14 08:18:18');
INSERT INTO "business_workspaces" VALUES(29,6,'Security & Access Control','Access, passwords, logs','SYS_04_SECURITY','Lock','bg-slate-900',4,'2026-09-14 08:18:18');
CREATE TABLE "cash_counts" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "shift_id" integer NOT NULL,
  "count_type" text NOT NULL,
  "total_counted" real NOT NULL,
  "denominations_json" text NOT NULL,
  "counted_by" text NOT NULL,
  "created_at" integer
);
CREATE TABLE "cash_drawers" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "registerId" text NOT NULL,
  "storeId" text NOT NULL,
  "status" text,
  "current_custodian_id" text,
  "current_shift_id" integer,
  "created_at" integer
);
CREATE TABLE "cash_movements" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "movement_no" text NOT NULL,
  "shift_id" integer,
  "cash_drawer_id" integer NOT NULL,
  "movement_type" text NOT NULL,
  "amount" real NOT NULL,
  "direction" text NOT NULL,
  "custodian_id" text NOT NULL,
  "from_location" text NOT NULL,
  "to_location" text NOT NULL,
  "reference_no" text,
  "idempotency_key" text NOT NULL,
  "notes" text,
  "created_at" integer
);
CREATE TABLE "cash_shifts" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "shift_no" text NOT NULL,
  "cash_drawer_id" integer NOT NULL,
  "cashier_user_id" text NOT NULL,
  "cashier_name" text NOT NULL,
  "status" text,
  "opening_float" real,
  "cash_sales_total" real,
  "card_sales_total" real,
  "transfer_sales_total" real,
  "cash_drops_total" real,
  "payouts_total" real,
  "expected_cash" real,
  "actual_counted_cash" real,
  "variance_amount" real,
  "variance_status" text,
  "supervisor_approval_id" text,
  "opened_at" integer,
  "closed_at" integer,
  "notes" text
);
CREATE TABLE "cash_variances" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "shift_id" integer NOT NULL,
  "expected_amount" real NOT NULL,
  "counted_amount" real NOT NULL,
  "variance_amount" real NOT NULL,
  "status" text,
  "reviewed_by" text,
  "review_notes" text,
  "created_at" integer
);
CREATE TABLE "cash_vouchers" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "voucher_code" text NOT NULL,
  "voucher_type" text,
  "partner_type" text,
  "partner_name" text NOT NULL,
  "amount" real NOT NULL,
  "bank_account_id" integer,
  "bank_name" text,
  "payment_method" text,
  "status" text,
  "date" text NOT NULL,
  "reason" text,
  "accounting_entry" text,
  "created_by" text,
  "approved_by" text,
  "created_at" integer
);
INSERT INTO "cash_vouchers" VALUES(1,'PT-2026-0089','RECEIPT','CUSTOMER','Công ty Cổ phần MISA',120000000.0,1,'Vietcombank (VCB)','BANK_TRANSFER','APPROVED','2026-08-27','Thu tiền thanh toán Hóa đơn AR-2026-0042','Nợ 1121 / Có 131','Kế toán Thu - Nguyễn Văn A','CFO - Nguyễn Thị Hương',NULL);
INSERT INTO "cash_vouchers" VALUES(2,'PC-2026-0045','PAYMENT','SUPPLIER','Tập đoàn Điện Lực Việt Nam EVN',35000000.0,2,'MB Bank (MBB)','BANK_TRANSFER','APPROVED','2026-08-26','Chi trả tiền điện sản xuất Xưởng CNC Tháng 08/2026','Nợ 6427 / Có 1121','Kế toán Chi - Lê Thị B','CFO - Nguyễn Thị Hương',NULL);
CREATE TABLE "categories" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "name" text NOT NULL
);
INSERT INTO "categories" VALUES(1,'Thiết bị CNTT');
INSERT INTO "categories" VALUES(2,'Phụ kiện');
INSERT INTO "categories" VALUES(3,'Thiết bị cơ khí');
INSERT INTO "categories" VALUES(4,'Cảm biến IoT');
INSERT INTO "categories" VALUES(5,'Thiết bị điện');
INSERT INTO "categories" VALUES(6,'Nguyên vật liệu');
INSERT INTO "categories" VALUES(7,'Dụng cụ cầm tay');
INSERT INTO "categories" VALUES(8,'Van công nghiệp');
INSERT INTO "categories" VALUES(9,'RAM');
INSERT INTO "categories" VALUES(10,'SSD');
INSERT INTO "categories" VALUES(11,'CPU');
INSERT INTO "categories" VALUES(12,'Bán dẫn');
INSERT INTO "categories" VALUES(13,'Vật liệu xanh');
INSERT INTO "categories" VALUES(14,'Phần mềm');
INSERT INTO "categories" VALUES(15,'Thiết bị CNTT');
INSERT INTO "categories" VALUES(16,'Phụ kiện');
INSERT INTO "categories" VALUES(17,'Thiết bị cơ khí');
INSERT INTO "categories" VALUES(18,'Cảm biến IoT');
INSERT INTO "categories" VALUES(19,'Thiết bị điện');
INSERT INTO "categories" VALUES(20,'Nguyên vật liệu');
INSERT INTO "categories" VALUES(21,'Dụng cụ cầm tay');
INSERT INTO "categories" VALUES(22,'Van công nghiệp');
INSERT INTO "categories" VALUES(23,'RAM');
INSERT INTO "categories" VALUES(24,'SSD');
INSERT INTO "categories" VALUES(25,'CPU');
INSERT INTO "categories" VALUES(26,'Bán dẫn');
INSERT INTO "categories" VALUES(27,'Vật liệu xanh');
INSERT INTO "categories" VALUES(28,'Phần mềm');
INSERT INTO "categories" VALUES(29,'Thiết bị CNTT');
INSERT INTO "categories" VALUES(30,'Phụ kiện');
INSERT INTO "categories" VALUES(31,'Thiết bị cơ khí');
INSERT INTO "categories" VALUES(32,'Cảm biến IoT');
INSERT INTO "categories" VALUES(33,'Thiết bị điện');
INSERT INTO "categories" VALUES(34,'Nguyên vật liệu');
INSERT INTO "categories" VALUES(35,'Dụng cụ cầm tay');
INSERT INTO "categories" VALUES(36,'Van công nghiệp');
INSERT INTO "categories" VALUES(37,'RAM');
INSERT INTO "categories" VALUES(38,'SSD');
INSERT INTO "categories" VALUES(39,'CPU');
INSERT INTO "categories" VALUES(40,'Bán dẫn');
INSERT INTO "categories" VALUES(41,'Vật liệu xanh');
INSERT INTO "categories" VALUES(42,'Phần mềm');
INSERT INTO "categories" VALUES(43,'Thiết bị CNTT');
INSERT INTO "categories" VALUES(44,'Phụ kiện');
INSERT INTO "categories" VALUES(45,'Thiết bị cơ khí');
INSERT INTO "categories" VALUES(46,'Cảm biến IoT');
INSERT INTO "categories" VALUES(47,'Thiết bị điện');
INSERT INTO "categories" VALUES(48,'Nguyên vật liệu');
INSERT INTO "categories" VALUES(49,'Dụng cụ cầm tay');
INSERT INTO "categories" VALUES(50,'Van công nghiệp');
INSERT INTO "categories" VALUES(51,'RAM');
INSERT INTO "categories" VALUES(52,'SSD');
INSERT INTO "categories" VALUES(53,'CPU');
INSERT INTO "categories" VALUES(54,'Bán dẫn');
INSERT INTO "categories" VALUES(55,'Vật liệu xanh');
INSERT INTO "categories" VALUES(56,'Phần mềm');
INSERT INTO "categories" VALUES(57,'Thiết bị CNTT');
INSERT INTO "categories" VALUES(58,'Phụ kiện');
INSERT INTO "categories" VALUES(59,'Thiết bị cơ khí');
INSERT INTO "categories" VALUES(60,'Cảm biến IoT');
INSERT INTO "categories" VALUES(61,'Thiết bị điện');
INSERT INTO "categories" VALUES(62,'Nguyên vật liệu');
INSERT INTO "categories" VALUES(63,'Dụng cụ cầm tay');
INSERT INTO "categories" VALUES(64,'Van công nghiệp');
INSERT INTO "categories" VALUES(65,'RAM');
INSERT INTO "categories" VALUES(66,'SSD');
INSERT INTO "categories" VALUES(67,'CPU');
INSERT INTO "categories" VALUES(68,'Bán dẫn');
INSERT INTO "categories" VALUES(69,'Vật liệu xanh');
INSERT INTO "categories" VALUES(70,'Phần mềm');
CREATE TABLE "cogs_transactions" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "cogs_code" text NOT NULL,
  "sales_order_id" integer,
  "sales_order_item_id" integer,
  "product_id" integer NOT NULL,
  "warehouse_id" integer NOT NULL,
  "quantity" real NOT NULL,
  "unit_cost" real NOT NULL,
  "total_cogs" real NOT NULL,
  "costing_method" text,
  "cost_layer_id" integer,
  "stock_issue_id" integer,
  "transaction_type" text,
  "transaction_date" integer,
  "created_by" integer NOT NULL,
  "created_at" integer
);
CREATE TABLE "commission_calculations" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "calculation_code" text NOT NULL,
  "sales_order_id" integer,
  "invoice_id" integer,
  "payment_id" integer,
  "sales_return_id" integer,
  "sales_person_id" integer NOT NULL,
  "plan_id" integer,
  "rule_id" integer,
  "base_amount" real,
  "rate_percent" real,
  "accelerator_multiplier" real,
  "commission_amount" real,
  "is_clawback" integer,
  "trigger_event" text,
  "status" text,
  "calculation_date" integer,
  "payout_id" integer,
  "notes" text,
  "created_at" integer
);
CREATE TABLE "commission_payout_items" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "payout_id" integer NOT NULL,
  "sales_person_id" integer NOT NULL,
  "gross_commission" real,
  "clawback_deductions" real,
  "net_payout_amount" real,
  "payment_status" text,
  "bank_account_info" text,
  "notes" text,
  "created_at" integer
);
CREATE TABLE "commission_payouts" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "payout_code" text NOT NULL,
  "title" text NOT NULL,
  "period" text NOT NULL,
  "start_date" integer NOT NULL,
  "end_date" integer NOT NULL,
  "total_gross_amount" real,
  "total_clawback_amount" real,
  "total_net_amount" real,
  "total_beneficiaries" integer,
  "status" text,
  "payment_method" text,
  "approved_by" integer,
  "approved_at" integer,
  "paid_by" integer,
  "paid_at" integer,
  "accounting_entry_id" integer,
  "payout_accounting_entry_id" integer,
  "notes" text,
  "created_by" integer NOT NULL,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "commission_plans" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "plan_code" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "calculation_basis" text,
  "payout_frequency" text,
  "status" text,
  "valid_from" integer,
  "valid_to" integer,
  "is_default" integer,
  "created_by" integer NOT NULL,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "commission_rules" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "plan_id" integer NOT NULL,
  "rule_name" text NOT NULL,
  "rule_type" text,
  "min_threshold" real,
  "max_threshold" real,
  "rate_percent" real,
  "fixed_amount" real,
  "accelerator_multiplier" real,
  "product_id" integer,
  "category_id" integer,
  "priority_order" integer,
  "created_at" integer
);
CREATE TABLE "consolidation_adjustments" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "run_id" integer NOT NULL,
  "entry_type" text NOT NULL,
  "debit_account" text NOT NULL,
  "credit_account" text NOT NULL,
  "amount" real NOT NULL,
  "description" text,
  "source_entity_id" integer,
  "target_entity_id" integer
);
CREATE TABLE "consolidation_entities" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "group_id" integer NOT NULL,
  "branch_id" integer NOT NULL,
  "entity_type" text,
  "ownership_percentage" real
);
CREATE TABLE "consolidation_groups" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "base_currency" text,
  "created_by" integer NOT NULL,
  "created_at" integer
);
CREATE TABLE "consolidation_runs" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "run_code" text NOT NULL,
  "group_id" integer NOT NULL,
  "period_start" integer NOT NULL,
  "period_end" integer NOT NULL,
  "status" text,
  "created_by" integer NOT NULL,
  "created_at" integer
);
CREATE TABLE "corporate_budgets" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "version" integer,
  "department_id" integer NOT NULL,
  "period_month" integer NOT NULL,
  "period_year" integer NOT NULL,
  "currency" text,
  "status" text,
  "created_by" integer NOT NULL,
  "created_at" integer,
  "approved_by" integer,
  "approved_at" integer
);
CREATE TABLE "cost_layers" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "product_id" integer NOT NULL,
  "warehouse_id" integer NOT NULL,
  "quantity_original" real NOT NULL,
  "quantity_remaining" real NOT NULL,
  "unit_cost" real NOT NULL,
  "total_cost" real NOT NULL,
  "source_document_type" text NOT NULL,
  "source_document_id" integer,
  "source_reference_no" text,
  "receipt_date" integer,
  "lot_id" integer,
  "status" text,
  "created_at" integer
);
CREATE TABLE "costing_settings" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "global_method" text,
  "updated_by" integer,
  "updated_at" integer
);
CREATE TABLE "credit_notes" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "credit_note_number" text NOT NULL,
  "original_invoice_number" text NOT NULL,
  "customer_name" text NOT NULL,
  "amount" real NOT NULL,
  "vat_amount" real,
  "final_amount" real NOT NULL,
  "rma_code" text,
  "reason" text,
  "status" text,
  "date" text NOT NULL,
  "accounting_entry" text,
  "created_at" integer
);
INSERT INTO "credit_notes" VALUES(1,'CN-2026-001','HD-AR-2026-042','Công ty Cổ phần MISA',15000000.0,1500000.0,16500000.0,'RMA-2026-008','Hàng lỗi kỹ thuật đợt giao 25/08 - Giảm trừ công nợ AR','APPROVED','2026-08-27','Nợ 5212, Nợ 3331 / Có 131',NULL);
INSERT INTO "credit_notes" VALUES(2,'CN-2026-002','HD-AR-2026-045','Công ty TNHH Phong Vũ',8000000.0,800000.0,8800000.0,'RMA-2026-012','Chiết khấu thương mại do đạt sản lượng Quý 2','ISSUED','2026-08-28','Nợ 5211, Nợ 3331 / Có 131',NULL);
CREATE TABLE "crm_activities" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "lead_id" integer,
  "customer_id" integer,
  "activity_type" text NOT NULL,
  "subject" text NOT NULL,
  "description" text,
  "performed_by" text,
  "date" text NOT NULL,
  "created_at" integer
);
CREATE TABLE "crm_quotations" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "quotation_code" text NOT NULL,
  "lead_id" integer,
  "customer_id" integer,
  "customer_name" text NOT NULL,
  "contact_person" text,
  "email" text,
  "phone" text,
  "title" text NOT NULL,
  "issue_date" text NOT NULL,
  "valid_until" text NOT NULL,
  "subtotal" real,
  "tax_rate" real,
  "tax_amount" real,
  "discount_amount" real,
  "grand_total" real,
  "payment_terms" text,
  "delivery_terms" text,
  "status" text,
  "converted_sales_order_id" integer,
  "converted_sales_order_code" text,
  "salesperson_name" text,
  "items_payload" text,
  "notes" text,
  "created_at" integer
);
CREATE TABLE "cross_module_tasks" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "task_type" text NOT NULL,
  "source_module" text NOT NULL,
  "source_document_type" text NOT NULL,
  "source_document_id" integer NOT NULL,
  "source_reference_no" text NOT NULL,
  "target_module" text NOT NULL,
  "target_action" text NOT NULL,
  "payload" text,
  "status" text,
  "priority" text,
  "assigned_role_id" integer,
  "assigned_user_id" integer,
  "created_at" integer,
  "completed_at" integer,
  "completed_by" integer
);
CREATE TABLE "customer_contract_prices" (
  "id" text PRIMARY KEY,
  "customer_id" text NOT NULL,
  "product_id" text NOT NULL,
  "uom_id" text,
  "contract_price" real NOT NULL,
  "currency" text,
  "valid_from" text NOT NULL,
  "valid_to" text NOT NULL,
  "contract_code" text NOT NULL
);
INSERT INTO "customer_contract_prices" VALUES('CON-001','CUST-HOABINH','SKU-STEEL-18','PCS',220000.0,'VND','2026-01-01','2026-12-31','HB-STEEL-2026');
CREATE TABLE "customers" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "name" text NOT NULL,
  "phone" text,
  "email" text,
  "address" text,
  "company_name" text,
  "tax_code" text,
  "billing_email" text,
  "customer_group" text,
  "notes" text,
  "created_at" integer
);
CREATE TABLE "debit_notes" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "debit_note_number" text NOT NULL,
  "original_invoice_number" text NOT NULL,
  "supplier_name" text NOT NULL,
  "amount" real NOT NULL,
  "vat_amount" real,
  "final_amount" real NOT NULL,
  "purchase_return_code" text,
  "reason" text,
  "status" text,
  "date" text NOT NULL,
  "accounting_entry" text,
  "created_at" integer
);
INSERT INTO "debit_notes" VALUES(1,'DN-2026-001','HD-AP-2026-991','Tập đoàn Điện Lực Việt Nam EVN',5000000.0,500000.0,5500000.0,'PRT-2026-004','Trả lại vật tư không đạt chứng chỉ CO/CQ - Giảm nợ AP','APPROVED','2026-08-26','Nợ 331 / Có 152, Có 1331',NULL);
CREATE TABLE "demand_forecasts" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "forecast_code" text NOT NULL,
  "period" text,
  "product_id" integer NOT NULL,
  "product_name" text,
  "warehouse_id" integer,
  "historical_avg_demand" real,
  "forecast_quantity" real NOT NULL,
  "forecast_method" text,
  "accuracy_mae" real,
  "accuracy_mape" real,
  "created_at" integer
);
INSERT INTO "demand_forecasts" VALUES(1,'FST-2026-08','MONTHLY',1,'Laptop Dell XPS 15',1,42.0,50.0,'EXPONENTIAL_SMOOTHING',3.2,4.1,NULL);
INSERT INTO "demand_forecasts" VALUES(2,'FST-2026-09','MONTHLY',2,'Chuột Không Dây Logitech MX Master 3S',1,110.0,130.0,'MOVING_AVERAGE',5.0,3.8,NULL);
CREATE TABLE "departments" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "parent_department_id" integer,
  "manager_employee_id" integer,
  "status" text,
  "description" text
);
CREATE TABLE "discount_rules" (
  "id" text PRIMARY KEY,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "type" text,
  "value" real NOT NULL,
  "product_id" text,
  "valid_from" text NOT NULL,
  "valid_to" text NOT NULL,
  "is_active" integer
);
INSERT INTO "discount_rules" VALUES('DISC-PROJECT','PROJECT-OFFER','Chiết khấu Dự án đặc thù','PERCENTAGE',5.0,'SKU-STEEL-18','2026-01-01','2026-12-31',1);
CREATE TABLE "dlq_events" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "event_id" text NOT NULL,
  "event_type" text NOT NULL,
  "consumer" text NOT NULL,
  "payload" text NOT NULL,
  "correlation_id" text,
  "causation_id" text,
  "failed_at" integer,
  "retry_count" integer,
  "last_error" text,
  "status" text,
  "resolved_by" text,
  "resolved_at" integer
);
CREATE TABLE "dms_documents" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "doc_code" text NOT NULL,
  "title" text NOT NULL,
  "category" text,
  "category_name" text,
  "version" text,
  "file_size" text,
  "format" text,
  "status" text,
  "security_level" text,
  "sha256_hash" text,
  "signed_by" text,
  "signed_at" text,
  "linked_module" text,
  "ref_doc_no" text,
  "storage_tier" text,
  "retention_years" integer,
  "expire_date" text,
  "workflow_stage" integer,
  "workflow_steps" text,
  "created_at" integer
);
INSERT INTO "dms_documents" VALUES(1,'DMS-CON-2026-001','Hợp đồng Kinh tế Viettel Post Q3','CONTRACT','Hợp đồng Kinh tế','v1.2','2.4 MB','PDF','SIGNED','CONFIDENTIAL','e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855','Hoàng Nam (Admin) - Token HSM CA','2026-08-27 10:15:00','M13 Sales Orders','SO-2026-001','ACTIVE_VAULT',10,'2036-08-27',3,'[{"step":1,"name":"Khởi tạo","status":"COMPLETED"},{"step":2,"name":"Pháp chế duyệt","status":"COMPLETED"},{"step":3,"name":"Ký số CA","status":"COMPLETED"}]',NULL);
INSERT INTO "dms_documents" VALUES(2,'DMS-INV-2026-089','Hóa đơn Điện tử VAT Samsung','INVOICE','Hóa đơn GTGT','v1.0','1.1 MB','XML','APPROVED','INTERNAL','ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb','Tổng cục Thuế MIV','2026-08-28 09:30:00','M08 Purchase Orders','PO-2026-089','ACTIVE_VAULT',10,'2036-08-28',3,'[]',NULL);
INSERT INTO "dms_documents" VALUES(3,'DMS-SPE-2026-012','Tiêu chuẩn Kỹ thuật Sản phẩm Thép 18mm','SPECIFICATION','Hồ sơ Kỹ thuật','v2.0','5.8 MB','PDF','ACTIVE','INTERNAL','3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d','Phòng R&D','2026-08-20 14:00:00','M06 Innovation R&D','SPEC-ST-18','COLD_GLACIER',15,'2041-08-20',3,'[]',NULL);
CREATE TABLE "drivers" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "full_name" text NOT NULL,
  "phone" text,
  "license_number" text,
  "license_expiry_date" text,
  "employee_id" integer,
  "status" text,
  "created_at" integer
);
INSERT INTO "drivers" VALUES(1,'DRV-001','Nguyễn Văn Tài','0912 334 556','FC-992144','2028-12-31',NULL,'AVAILABLE',NULL);
INSERT INTO "drivers" VALUES(2,'DRV-002','Trần Văn Hùng','0988 776 655','C-881204','2027-06-30',NULL,'ON_TRIP',NULL);
INSERT INTO "drivers" VALUES(3,'DRV-003','Lê Hoàng Vũ','0903 221 144','C-774129','2029-01-15',NULL,'AVAILABLE',NULL);
INSERT INTO "drivers" VALUES(4,'DRV-004','Đặng Quốc Tuấn','0934 551 122','B2-551029','2030-05-20',NULL,'ON_LEAVE',NULL);
CREATE TABLE "employee_allowances" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "employee_id" integer NOT NULL,
  "allowance_type" text NOT NULL,
  "amount" real,
  "effective_date" text NOT NULL,
  "created_at" integer
);
CREATE TABLE "employee_assets" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "employee_id" integer NOT NULL,
  "asset_name" text NOT NULL,
  "asset_code" text,
  "assigned_date" text NOT NULL,
  "return_date" text,
  "status" text,
  "notes" text,
  "created_at" integer
);
CREATE TABLE "employee_assignments" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "employee_id" integer NOT NULL,
  "department_id" integer,
  "position_id" integer,
  "branch_id" integer,
  "manager_id" integer,
  "start_date" text NOT NULL,
  "end_date" text,
  "status" text,
  "notes" text,
  "created_at" integer
);
CREATE TABLE "employee_contracts" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "contract_no" text NOT NULL,
  "employee_id" integer NOT NULL,
  "contract_type" text NOT NULL,
  "start_date" text NOT NULL,
  "end_date" text,
  "base_salary" real,
  "allowance_amount" real,
  "commission_rate" real,
  "allowance_details" text,
  "terms" text,
  "status" text,
  "created_at" integer
);
CREATE TABLE "employee_deductions" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "employee_id" integer NOT NULL,
  "deduction_type" text NOT NULL,
  "amount" real,
  "reason" text,
  "period_code" text NOT NULL,
  "created_at" integer
);
CREATE TABLE "employee_documents" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "employee_id" integer NOT NULL,
  "title" text NOT NULL,
  "type" text NOT NULL,
  "file_url" text,
  "issued_date" text,
  "expiry_date" text,
  "notes" text,
  "created_at" integer
);
CREATE TABLE "employee_terminations" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "employee_id" integer NOT NULL,
  "termination_date" text NOT NULL,
  "reason" text NOT NULL,
  "handover_notes" text,
  "asset_cleared" integer,
  "salary_cleared" integer,
  "insurance_cleared" integer,
  "created_at" integer
);
CREATE TABLE "employee_transfers" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "employee_id" integer NOT NULL,
  "old_department_id" integer,
  "new_department_id" integer,
  "old_position_id" integer,
  "new_position_id" integer,
  "old_branch_id" integer,
  "new_branch_id" integer,
  "effective_date" text NOT NULL,
  "reason" text,
  "approved_by" integer,
  "created_at" integer
);
CREATE TABLE "employees" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "full_name" text NOT NULL,
  "gender" text,
  "date_of_birth" text,
  "phone" text,
  "email" text,
  "address" text,
  "avatar" text,
  "identity_card" text,
  "hire_date" text,
  "termination_date" text,
  "status" text,
  "department_id" integer,
  "position_id" integer,
  "branch_id" integer,
  "warehouse_id" integer,
  "manager_id" integer,
  "user_id" integer,
  "base_salary" real,
  "bank_account" text,
  "notes" text,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "expenses" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "category" text NOT NULL,
  "amount" real NOT NULL,
  "payment_method" text,
  "branch_id" integer,
  "payee" text,
  "status" text,
  "notes" text,
  "expense_date" integer,
  "created_by" integer NOT NULL,
  "created_at" integer
);
CREATE TABLE "fuel_transactions" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "vehicle_id" integer NOT NULL,
  "plate_number" text,
  "driver_id" integer,
  "fuel_date" text NOT NULL,
  "liters" real NOT NULL,
  "price_per_liter" real NOT NULL,
  "total_amount" real NOT NULL,
  "mileage_at_refuel" real,
  "created_at" integer
);
INSERT INTO "fuel_transactions" VALUES(1,1,'29C-882.14',1,'2026-08-27',85.5,21500.0,1838250.0,45120.0,NULL);
INSERT INTO "fuel_transactions" VALUES(2,2,'51D-993.82',2,'2026-08-27',210.0,21500.0,4515000.0,112350.0,NULL);
CREATE TABLE "functional_groups" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "icon" text,
  "display_order" integer,
  "created_at" integer
);
INSERT INTO "functional_groups" VALUES(1,'FINANCIAL','Tài chính & Kế toán','DollarSign',1,'2026-09-14 08:18:18');
INSERT INTO "functional_groups" VALUES(2,'OPERATIONS','Vận hành & Chuỗi Cung Ứng','Truck',2,'2026-09-14 08:18:18');
INSERT INTO "functional_groups" VALUES(3,'COMMERCE','Thương mại','ShoppingCart',3,'2026-09-14 08:18:18');
INSERT INTO "functional_groups" VALUES(4,'PRODUCTION','Sản xuất','Factory',4,'2026-09-14 08:18:18');
INSERT INTO "functional_groups" VALUES(5,'MANAGEMENT','Quản lý & Phân tích','BarChart2',5,'2026-09-14 08:18:18');
INSERT INTO "functional_groups" VALUES(6,'SYSTEM','Hệ thống & Admin','Settings',6,'2026-09-14 08:18:18');
CREATE TABLE "goods_issue_items" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "gi_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "uom_id" integer,
  "quantity" integer NOT NULL,
  "base_quantity" integer NOT NULL,
  "location_id" integer,
  "lot_id" integer,
  "serial_numbers" text
);
CREATE TABLE "goods_issues" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "warehouse_id" integer NOT NULL,
  "status" text,
  "issue_date" integer,
  "created_by" integer NOT NULL,
  "confirmed_by" integer,
  "confirmed_at" integer,
  "cancelled_by" integer,
  "cancelled_at" integer,
  "sales_order_id" integer,
  "total_cogs" real,
  "notes" text,
  "reason" text
);
CREATE TABLE "goods_receipt_items" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "gr_id" integer NOT NULL,
  "po_item_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "uom_id" integer,
  "quantity" integer NOT NULL,
  "base_quantity" integer NOT NULL,
  "location_id" integer,
  "lot_id" integer
);
CREATE TABLE "goods_receipts" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "po_id" integer NOT NULL,
  "warehouse_id" integer NOT NULL,
  "status" text,
  "received_date" integer,
  "created_by" integer NOT NULL,
  "notes" text
);
CREATE TABLE "insurance_profiles" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "employee_id" integer NOT NULL,
  "social_insurance_no" text,
  "health_insurance_no" text,
  "base_amount" real,
  "start_date" text NOT NULL,
  "created_at" integer
);
CREATE TABLE "inventory_alerts" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "type" text NOT NULL,
  "severity" text,
  "status" text,
  "product_id" integer,
  "warehouse_id" integer,
  "location_id" integer,
  "batch_id" integer,
  "serial_id" integer,
  "source_type" text,
  "source_id" text,
  "current_value" real,
  "threshold_value" real,
  "message" text NOT NULL,
  "assigned_to" integer,
  "assigned_to_name" text,
  "created_at" integer,
  "acknowledged_by" integer,
  "acknowledged_by_name" text,
  "acknowledged_at" integer,
  "ack_notes" text,
  "resolved_by" integer,
  "resolved_by_name" text,
  "resolved_at" integer,
  "resolved_reason" text,
  "ref_transaction_no" text,
  "dismissed_by" integer,
  "dismissed_by_name" text,
  "dismissed_at" integer,
  "dismiss_reason" text,
  "closed_at" integer
);
CREATE TABLE "invoice_items" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "invoice_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "quantity" real NOT NULL,
  "unit_price" real NOT NULL,
  "discount_amount" real,
  "tax_rate" real,
  "tax_amount" real,
  "subtotal" real NOT NULL
);
CREATE TABLE "invoices" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "invoice_number" text NOT NULL,
  "order_id" integer,
  "type" text NOT NULL,
  "customer_id" integer,
  "customer_name" text,
  "company_name" text,
  "tax_code" text,
  "address" text,
  "billing_email" text,
  "total_amount" real NOT NULL,
  "discount" real,
  "tax_rate" real,
  "tax_amount" real NOT NULL,
  "final_amount" real NOT NULL,
  "payment_method" text,
  "payment_status" text,
  "status" text,
  "adjustment_ref_id" integer,
  "replaced_ref_id" integer,
  "rejection_reason" text,
  "is_customer_updated" integer,
  "issue_date" integer,
  "due_date" integer,
  "created_by" integer NOT NULL,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "leads" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "lead_code" text NOT NULL,
  "name" text NOT NULL,
  "company" text,
  "email" text,
  "phone" text,
  "source" text,
  "interest" text,
  "salesperson_id" integer,
  "salesperson_name" text,
  "value" real,
  "status" text,
  "created_at" integer
);
CREATE TABLE "leave_requests" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "employee_id" integer NOT NULL,
  "leave_type" text NOT NULL,
  "start_date" text NOT NULL,
  "end_date" text NOT NULL,
  "total_days" real,
  "reason" text,
  "status" text,
  "approved_by" integer,
  "created_at" integer
);
CREATE TABLE "lot_balances" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "lot_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "warehouse_id" integer NOT NULL,
  "location_id" integer,
  "stock_physical" integer,
  "stock_reserved" integer,
  "stock_available" integer,
  "updated_at" integer
);
CREATE TABLE "lot_serial_quality_statuses" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "product_id" integer NOT NULL,
  "lot_number" text,
  "serial_number" text,
  "quality_status" text,
  "last_inspection_id" integer,
  "updated_at" integer
);
CREATE TABLE "lots" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "lot_number" text NOT NULL,
  "product_id" integer NOT NULL,
  "manufacture_date" integer,
  "expiry_date" integer,
  "supplier_id" integer,
  "initial_quantity" integer,
  "status" text,
  "notes" text,
  "created_by" integer NOT NULL,
  "created_at" integer
);
CREATE TABLE "maintenance_parts" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "wo_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "product_name" text,
  "quantity" real NOT NULL,
  "unit_cost" real,
  "total_cost" real,
  "warehouse_id" integer,
  "issued_at" integer
);
CREATE TABLE "maintenance_plans" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "asset_id" integer NOT NULL,
  "plan_code" text NOT NULL,
  "title" text NOT NULL,
  "maintenance_type" text,
  "interval_hours" real,
  "interval_days" integer,
  "description" text,
  "last_performed_date" text,
  "next_due_date" text
);
INSERT INTO "maintenance_plans" VALUES(1,1,'PM-SMT-MONTHLY','Bảo dưỡng tra dầu & hiệu chuẩn đầu gắp SMT định kỳ','PREVENTIVE',NULL,30,'Vệ sinh quang học camera, tra mỡ trục vít me, cân chỉnh nozzle','2026-08-01','2026-08-31');
CREATE TABLE "maintenance_work_orders" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "wo_code" text NOT NULL,
  "asset_id" integer NOT NULL,
  "asset_name" text,
  "maintenance_type" text,
  "priority" text,
  "description" text NOT NULL,
  "assigned_technician_id" integer,
  "assigned_technician_name" text,
  "planned_start" text,
  "planned_end" text,
  "actual_start" text,
  "actual_end" text,
  "status" text,
  "total_cost" real,
  "downtime_hours" real,
  "created_at" integer
);
INSERT INTO "maintenance_work_orders" VALUES(1,'WO-2026-0001',1,'Máy Gắn Chíp SMT Tự Động Yamaha YSM20R','PREVENTIVE','NORMAL','Bảo dưỡng định kỳ tháng 8/2026',NULL,'Kỹ thuật viên Trần Văn Hùng','2026-08-30 08:00','2026-08-30 12:00',NULL,NULL,'ASSIGNED',3500000.0,4.0,NULL);
INSERT INTO "maintenance_work_orders" VALUES(2,'WO-2026-0002',2,'Máy Phay Nhôm CNC 5 Trục Fanuc Robodrill','CORRECTIVE','HIGH','Thay chổi than động cơ trục chính & lọc dầu',NULL,'Kỹ thuật viên Lê Quốc Tuấn','2026-08-20 14:00','2026-08-20 17:30',NULL,NULL,'COMPLETED',7200000.0,3.5,NULL);
CREATE TABLE "manufacturing_orders" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "product_id" integer NOT NULL,
  "bom_id" integer NOT NULL,
  "bom_version" text,
  "planned_quantity" real NOT NULL,
  "produced_quantity" real,
  "scrap_quantity" real,
  "uom" text,
  "warehouse_id" integer,
  "raw_warehouse_id" integer,
  "work_center_id" integer,
  "priority" text,
  "status" text,
  "planned_start_date" text,
  "planned_end_date" text,
  "actual_start_date" text,
  "actual_end_date" text,
  "notes" text,
  "created_by" text,
  "approved_by" text,
  "created_at" integer,
  "updated_at" integer
);
INSERT INTO "manufacturing_orders" VALUES(1,'MO-2026-0010',1,1,'V1.0',25.0,20.0,1.0,'Chiếc',1,1,2,'HIGH','IN_PROGRESS','2026-08-25','2026-08-30',NULL,NULL,'Lô sản xuất đơn đặt hàng Doanh nghiệp FPT Telecom',NULL,NULL,NULL,NULL);
INSERT INTO "manufacturing_orders" VALUES(2,'MO-2026-0011',1,1,'V1.0',15.0,0.0,0.0,'Chiếc',1,1,1,'NORMAL','RELEASED','2026-08-28','2026-09-05',NULL,NULL,'Kế hoạch bổ sung kho an toàn Q3',NULL,NULL,NULL,NULL);
INSERT INTO "manufacturing_orders" VALUES(3,'MO-2026-0012',1,1,'V1.0',10.0,10.0,0.0,'Chiếc',1,1,2,'NORMAL','COMPLETED','2026-08-15','2026-08-20',NULL,NULL,'Đã hoàn tất nghiệm thu & nhập kho thành phẩm',NULL,NULL,NULL,NULL);
CREATE TABLE "margin_policies" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "product_id" text NOT NULL,
  "target_margin_percent" real NOT NULL,
  "min_margin_percent" real NOT NULL
);
INSERT INTO "margin_policies" VALUES(1,'SKU-STEEL-18',20.0,12.0);
INSERT INTO "margin_policies" VALUES(2,'SKU-CEMENT-PCB40',15.0,10.0);
INSERT INTO "margin_policies" VALUES(3,'SKU-GYPSUM-12',25.0,15.0);
CREATE TABLE "material_consumptions" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "mo_id" integer NOT NULL,
  "material_product_id" integer NOT NULL,
  "planned_quantity" real NOT NULL,
  "actual_quantity" real NOT NULL,
  "uom" text,
  "unit_cost" real,
  "total_cost" real,
  "warehouse_id" integer,
  "lot_id" integer,
  "serial_number" text,
  "consumed_at" integer,
  "consumed_by" text
);
CREATE TABLE "material_reservations" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "mo_id" integer NOT NULL,
  "material_product_id" integer NOT NULL,
  "required_quantity" real NOT NULL,
  "reserved_quantity" real,
  "uom" text,
  "status" text,
  "created_at" integer
);
INSERT INTO "material_reservations" VALUES(1,1,3,50.0,50.0,'Cuộn','RESERVED',NULL);
INSERT INTO "material_reservations" VALUES(2,1,4,50.0,50.0,'Thanh','RESERVED',NULL);
INSERT INTO "material_reservations" VALUES(3,1,5,25.0,25.0,'Chiếc','RESERVED',NULL);
INSERT INTO "material_reservations" VALUES(4,1,6,25.0,25.0,'Bộ','RESERVED',NULL);
CREATE TABLE "opportunities" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "lead_id" integer,
  "customer_id" integer,
  "customer_name" text,
  "name" text NOT NULL,
  "value" real,
  "probability" real,
  "expected_close_date" text,
  "salesperson_id" integer,
  "salesperson_name" text,
  "stage" text,
  "created_at" integer
);
CREATE TABLE "orchestration_exceptions" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "instance_id" integer NOT NULL,
  "error_message" text NOT NULL,
  "severity" text,
  "status" text,
  "assigned_role" text,
  "created_at" integer,
  "resolved_at" integer
);
CREATE TABLE "orchestration_instances" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "process_type" text NOT NULL,
  "reference_code" text NOT NULL,
  "status" text,
  "current_step" text NOT NULL,
  "sla_deadline" integer,
  "metadata" text,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "orchestration_steps" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "instance_id" integer NOT NULL,
  "step_name" text NOT NULL,
  "module_source" text NOT NULL,
  "status" text,
  "payload_summary" text,
  "updated_at" integer
);
CREATE TABLE "outbox_events" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "event_id" text NOT NULL,
  "event_type" text NOT NULL,
  "event_version" integer,
  "aggregate_type" text NOT NULL,
  "aggregate_id" text NOT NULL,
  "source" text NOT NULL,
  "actor_id" text,
  "correlation_id" text,
  "causation_id" text,
  "payload" text NOT NULL,
  "metadata" text,
  "occurred_at" integer,
  "published_at" integer,
  "status" text,
  "retry_count" integer,
  "last_error" text,
  "locked_at" integer,
  "locked_by" text,
  "next_retry_at" integer
);
CREATE TABLE "overtime_records" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "employee_id" integer NOT NULL,
  "ot_date" text NOT NULL,
  "start_time" text NOT NULL,
  "end_time" text NOT NULL,
  "hours" real,
  "multiplier" real,
  "reason" text,
  "status" text,
  "created_at" integer
);
CREATE TABLE "payments" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "order_id" integer,
  "po_id" integer,
  "sales_return_id" integer,
  "purchase_return_id" integer,
  "invoice_id" integer,
  "customer_id" integer,
  "supplier_id" integer,
  "payment_type" text,
  "payment_method" text NOT NULL,
  "amount" real NOT NULL,
  "reference_no" text,
  "status" text,
  "notes" text,
  "created_by" integer NOT NULL,
  "created_at" integer
);
CREATE TABLE "payrolls" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "period_code" text NOT NULL,
  "name" text NOT NULL,
  "month" integer NOT NULL,
  "year" integer NOT NULL,
  "start_date" text NOT NULL,
  "end_date" text NOT NULL,
  "total_employees" integer,
  "total_gross" real,
  "total_insurance" real,
  "total_tax" real,
  "total_net" real,
  "status" text,
  "posted_gl" integer,
  "sha256_checksum" text,
  "approved_by" text,
  "approved_at" text,
  "notes" text,
  "accounting_entry_id" integer,
  "created_at" integer
);
CREATE TABLE "payslips" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "payroll_id" integer NOT NULL,
  "employee_id" integer NOT NULL,
  "base_salary" real,
  "standard_working_days" real,
  "actual_working_days" real,
  "ot_hours" real,
  "allowances_total" real,
  "bonus_total" real,
  "deductions_total" real,
  "insurance_employee" real,
  "taxable_income" real,
  "personal_income_tax" real,
  "net_salary" real,
  "created_at" integer
);
CREATE TABLE "performance_reviews" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "employee_id" integer NOT NULL,
  "cycle" text NOT NULL,
  "period" text NOT NULL,
  "kpi_score" real,
  "rating" text,
  "comments" text,
  "reviewer_id" integer,
  "created_at" integer
);
CREATE TABLE "permissions" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL
);
INSERT INTO "permissions" VALUES(1,'system.admin');
INSERT INTO "permissions" VALUES(2,'users.read');
INSERT INTO "permissions" VALUES(3,'users.write');
INSERT INTO "permissions" VALUES(4,'roles.manage');
INSERT INTO "permissions" VALUES(5,'settings.manage');
INSERT INTO "permissions" VALUES(6,'inventory.read');
INSERT INTO "permissions" VALUES(7,'inventory.write');
INSERT INTO "permissions" VALUES(8,'stock.view');
INSERT INTO "permissions" VALUES(9,'stock.adjust');
INSERT INTO "permissions" VALUES(10,'stock.transfer');
INSERT INTO "permissions" VALUES(11,'stock.count');
INSERT INTO "permissions" VALUES(12,'goods_issue.create');
INSERT INTO "permissions" VALUES(13,'goods_issue.confirm');
INSERT INTO "permissions" VALUES(14,'goods_issue.cancel');
INSERT INTO "permissions" VALUES(15,'goods_receipt.create');
INSERT INTO "permissions" VALUES(16,'goods_receipt.confirm');
INSERT INTO "permissions" VALUES(17,'goods_receipt.cancel');
INSERT INTO "permissions" VALUES(18,'stocktake.create');
INSERT INTO "permissions" VALUES(19,'stocktake.count');
INSERT INTO "permissions" VALUES(20,'stocktake.recount');
INSERT INTO "permissions" VALUES(21,'stocktake.finalize');
INSERT INTO "permissions" VALUES(22,'stock_adjustment.create');
INSERT INTO "permissions" VALUES(23,'stock_adjustment.approve');
INSERT INTO "permissions" VALUES(24,'stock_adjustment.cancel');
INSERT INTO "permissions" VALUES(25,'lot.create');
INSERT INTO "permissions" VALUES(26,'lot.manage');
INSERT INTO "permissions" VALUES(27,'serial.create');
INSERT INTO "permissions" VALUES(28,'serial.manage');
INSERT INTO "permissions" VALUES(29,'purchase.read');
INSERT INTO "permissions" VALUES(30,'purchase.create');
INSERT INTO "permissions" VALUES(31,'purchase.approve');
INSERT INTO "permissions" VALUES(32,'purchase.cancel');
INSERT INTO "permissions" VALUES(33,'srm.read');
INSERT INTO "permissions" VALUES(34,'srm.write');
INSERT INTO "permissions" VALUES(35,'supplier.manage');
INSERT INTO "permissions" VALUES(36,'sales.read');
INSERT INTO "permissions" VALUES(37,'sales.create');
INSERT INTO "permissions" VALUES(38,'sales.approve');
INSERT INTO "permissions" VALUES(39,'sales.fulfill');
INSERT INTO "permissions" VALUES(40,'pos.sell');
INSERT INTO "permissions" VALUES(41,'pos.refund');
INSERT INTO "permissions" VALUES(42,'pos.manage');
INSERT INTO "permissions" VALUES(43,'customer.manage');
INSERT INTO "permissions" VALUES(44,'finance:read');
INSERT INTO "permissions" VALUES(45,'finance:budget_manage');
INSERT INTO "permissions" VALUES(46,'accounting.read');
INSERT INTO "permissions" VALUES(47,'accounting.post');
INSERT INTO "permissions" VALUES(48,'invoices.manage');
INSERT INTO "permissions" VALUES(49,'payments.manage');
INSERT INTO "permissions" VALUES(50,'manufacturing.read');
INSERT INTO "permissions" VALUES(51,'manufacturing.write');
INSERT INTO "permissions" VALUES(52,'eam.read');
INSERT INTO "permissions" VALUES(53,'eam.write');
INSERT INTO "permissions" VALUES(54,'eam.wo_create');
INSERT INTO "permissions" VALUES(55,'eam.wo_update');
INSERT INTO "permissions" VALUES(56,'quality.read');
INSERT INTO "permissions" VALUES(57,'quality.inspect');
INSERT INTO "permissions" VALUES(58,'quality.plan_manage');
INSERT INTO "permissions" VALUES(59,'subcontracting.order.view');
INSERT INTO "permissions" VALUES(60,'subcontracting.order.create');
INSERT INTO "permissions" VALUES(61,'subcontracting.order.approve');
INSERT INTO "permissions" VALUES(62,'commission.read');
INSERT INTO "permissions" VALUES(63,'commission.manage');
INSERT INTO "permissions" VALUES(64,'system.admin');
INSERT INTO "permissions" VALUES(65,'users.read');
INSERT INTO "permissions" VALUES(66,'users.write');
INSERT INTO "permissions" VALUES(67,'roles.manage');
INSERT INTO "permissions" VALUES(68,'settings.manage');
INSERT INTO "permissions" VALUES(69,'inventory.read');
INSERT INTO "permissions" VALUES(70,'inventory.write');
INSERT INTO "permissions" VALUES(71,'stock.view');
INSERT INTO "permissions" VALUES(72,'stock.adjust');
INSERT INTO "permissions" VALUES(73,'stock.transfer');
INSERT INTO "permissions" VALUES(74,'stock.count');
INSERT INTO "permissions" VALUES(75,'goods_issue.create');
INSERT INTO "permissions" VALUES(76,'goods_issue.confirm');
INSERT INTO "permissions" VALUES(77,'goods_issue.cancel');
INSERT INTO "permissions" VALUES(78,'goods_receipt.create');
INSERT INTO "permissions" VALUES(79,'goods_receipt.confirm');
INSERT INTO "permissions" VALUES(80,'goods_receipt.cancel');
INSERT INTO "permissions" VALUES(81,'stocktake.create');
INSERT INTO "permissions" VALUES(82,'stocktake.count');
INSERT INTO "permissions" VALUES(83,'stocktake.recount');
INSERT INTO "permissions" VALUES(84,'stocktake.finalize');
INSERT INTO "permissions" VALUES(85,'stock_adjustment.create');
INSERT INTO "permissions" VALUES(86,'stock_adjustment.approve');
INSERT INTO "permissions" VALUES(87,'stock_adjustment.cancel');
INSERT INTO "permissions" VALUES(88,'lot.create');
INSERT INTO "permissions" VALUES(89,'lot.manage');
INSERT INTO "permissions" VALUES(90,'serial.create');
INSERT INTO "permissions" VALUES(91,'serial.manage');
INSERT INTO "permissions" VALUES(92,'purchase.read');
INSERT INTO "permissions" VALUES(93,'purchase.create');
INSERT INTO "permissions" VALUES(94,'purchase.approve');
INSERT INTO "permissions" VALUES(95,'purchase.cancel');
INSERT INTO "permissions" VALUES(96,'srm.read');
INSERT INTO "permissions" VALUES(97,'srm.write');
INSERT INTO "permissions" VALUES(98,'supplier.manage');
INSERT INTO "permissions" VALUES(99,'sales.read');
INSERT INTO "permissions" VALUES(100,'sales.create');
INSERT INTO "permissions" VALUES(101,'sales.approve');
INSERT INTO "permissions" VALUES(102,'sales.fulfill');
INSERT INTO "permissions" VALUES(103,'pos.sell');
INSERT INTO "permissions" VALUES(104,'pos.refund');
INSERT INTO "permissions" VALUES(105,'pos.manage');
INSERT INTO "permissions" VALUES(106,'customer.manage');
INSERT INTO "permissions" VALUES(107,'finance:read');
INSERT INTO "permissions" VALUES(108,'finance:budget_manage');
INSERT INTO "permissions" VALUES(109,'accounting.read');
INSERT INTO "permissions" VALUES(110,'accounting.post');
INSERT INTO "permissions" VALUES(111,'invoices.manage');
INSERT INTO "permissions" VALUES(112,'payments.manage');
INSERT INTO "permissions" VALUES(113,'manufacturing.read');
INSERT INTO "permissions" VALUES(114,'manufacturing.write');
INSERT INTO "permissions" VALUES(115,'eam.read');
INSERT INTO "permissions" VALUES(116,'eam.write');
INSERT INTO "permissions" VALUES(117,'eam.wo_create');
INSERT INTO "permissions" VALUES(118,'eam.wo_update');
INSERT INTO "permissions" VALUES(119,'quality.read');
INSERT INTO "permissions" VALUES(120,'quality.inspect');
INSERT INTO "permissions" VALUES(121,'quality.plan_manage');
INSERT INTO "permissions" VALUES(122,'subcontracting.order.view');
INSERT INTO "permissions" VALUES(123,'subcontracting.order.create');
INSERT INTO "permissions" VALUES(124,'subcontracting.order.approve');
INSERT INTO "permissions" VALUES(125,'commission.read');
INSERT INTO "permissions" VALUES(126,'commission.manage');
INSERT INTO "permissions" VALUES(127,'system.admin');
INSERT INTO "permissions" VALUES(128,'users.read');
INSERT INTO "permissions" VALUES(129,'users.write');
INSERT INTO "permissions" VALUES(130,'roles.manage');
INSERT INTO "permissions" VALUES(131,'settings.manage');
INSERT INTO "permissions" VALUES(132,'inventory.read');
INSERT INTO "permissions" VALUES(133,'inventory.write');
INSERT INTO "permissions" VALUES(134,'stock.view');
INSERT INTO "permissions" VALUES(135,'stock.adjust');
INSERT INTO "permissions" VALUES(136,'stock.transfer');
INSERT INTO "permissions" VALUES(137,'stock.count');
INSERT INTO "permissions" VALUES(138,'goods_issue.create');
INSERT INTO "permissions" VALUES(139,'goods_issue.confirm');
INSERT INTO "permissions" VALUES(140,'goods_issue.cancel');
INSERT INTO "permissions" VALUES(141,'goods_receipt.create');
INSERT INTO "permissions" VALUES(142,'goods_receipt.confirm');
INSERT INTO "permissions" VALUES(143,'goods_receipt.cancel');
INSERT INTO "permissions" VALUES(144,'stocktake.create');
INSERT INTO "permissions" VALUES(145,'stocktake.count');
INSERT INTO "permissions" VALUES(146,'stocktake.recount');
INSERT INTO "permissions" VALUES(147,'stocktake.finalize');
INSERT INTO "permissions" VALUES(148,'stock_adjustment.create');
INSERT INTO "permissions" VALUES(149,'stock_adjustment.approve');
INSERT INTO "permissions" VALUES(150,'stock_adjustment.cancel');
INSERT INTO "permissions" VALUES(151,'lot.create');
INSERT INTO "permissions" VALUES(152,'lot.manage');
INSERT INTO "permissions" VALUES(153,'serial.create');
INSERT INTO "permissions" VALUES(154,'serial.manage');
INSERT INTO "permissions" VALUES(155,'purchase.read');
INSERT INTO "permissions" VALUES(156,'purchase.create');
INSERT INTO "permissions" VALUES(157,'purchase.approve');
INSERT INTO "permissions" VALUES(158,'purchase.cancel');
INSERT INTO "permissions" VALUES(159,'srm.read');
INSERT INTO "permissions" VALUES(160,'srm.write');
INSERT INTO "permissions" VALUES(161,'supplier.manage');
INSERT INTO "permissions" VALUES(162,'sales.read');
INSERT INTO "permissions" VALUES(163,'sales.create');
INSERT INTO "permissions" VALUES(164,'sales.approve');
INSERT INTO "permissions" VALUES(165,'sales.fulfill');
INSERT INTO "permissions" VALUES(166,'pos.sell');
INSERT INTO "permissions" VALUES(167,'pos.refund');
INSERT INTO "permissions" VALUES(168,'pos.manage');
INSERT INTO "permissions" VALUES(169,'customer.manage');
INSERT INTO "permissions" VALUES(170,'finance:read');
INSERT INTO "permissions" VALUES(171,'finance:budget_manage');
INSERT INTO "permissions" VALUES(172,'accounting.read');
INSERT INTO "permissions" VALUES(173,'accounting.post');
INSERT INTO "permissions" VALUES(174,'invoices.manage');
INSERT INTO "permissions" VALUES(175,'payments.manage');
INSERT INTO "permissions" VALUES(176,'manufacturing.read');
INSERT INTO "permissions" VALUES(177,'manufacturing.write');
INSERT INTO "permissions" VALUES(178,'eam.read');
INSERT INTO "permissions" VALUES(179,'eam.write');
INSERT INTO "permissions" VALUES(180,'eam.wo_create');
INSERT INTO "permissions" VALUES(181,'eam.wo_update');
INSERT INTO "permissions" VALUES(182,'quality.read');
INSERT INTO "permissions" VALUES(183,'quality.inspect');
INSERT INTO "permissions" VALUES(184,'quality.plan_manage');
INSERT INTO "permissions" VALUES(185,'subcontracting.order.view');
INSERT INTO "permissions" VALUES(186,'subcontracting.order.create');
INSERT INTO "permissions" VALUES(187,'subcontracting.order.approve');
INSERT INTO "permissions" VALUES(188,'commission.read');
INSERT INTO "permissions" VALUES(189,'commission.manage');
INSERT INTO "permissions" VALUES(190,'system.admin');
INSERT INTO "permissions" VALUES(191,'users.read');
INSERT INTO "permissions" VALUES(192,'users.write');
INSERT INTO "permissions" VALUES(193,'roles.manage');
INSERT INTO "permissions" VALUES(194,'settings.manage');
INSERT INTO "permissions" VALUES(195,'inventory.read');
INSERT INTO "permissions" VALUES(196,'inventory.write');
INSERT INTO "permissions" VALUES(197,'stock.view');
INSERT INTO "permissions" VALUES(198,'stock.adjust');
INSERT INTO "permissions" VALUES(199,'stock.transfer');
INSERT INTO "permissions" VALUES(200,'stock.count');
INSERT INTO "permissions" VALUES(201,'goods_issue.create');
INSERT INTO "permissions" VALUES(202,'goods_issue.confirm');
INSERT INTO "permissions" VALUES(203,'goods_issue.cancel');
INSERT INTO "permissions" VALUES(204,'goods_receipt.create');
INSERT INTO "permissions" VALUES(205,'goods_receipt.confirm');
INSERT INTO "permissions" VALUES(206,'goods_receipt.cancel');
INSERT INTO "permissions" VALUES(207,'stocktake.create');
INSERT INTO "permissions" VALUES(208,'stocktake.count');
INSERT INTO "permissions" VALUES(209,'stocktake.recount');
INSERT INTO "permissions" VALUES(210,'stocktake.finalize');
INSERT INTO "permissions" VALUES(211,'stock_adjustment.create');
INSERT INTO "permissions" VALUES(212,'stock_adjustment.approve');
INSERT INTO "permissions" VALUES(213,'stock_adjustment.cancel');
INSERT INTO "permissions" VALUES(214,'lot.create');
INSERT INTO "permissions" VALUES(215,'lot.manage');
INSERT INTO "permissions" VALUES(216,'serial.create');
INSERT INTO "permissions" VALUES(217,'serial.manage');
INSERT INTO "permissions" VALUES(218,'purchase.read');
INSERT INTO "permissions" VALUES(219,'purchase.create');
INSERT INTO "permissions" VALUES(220,'purchase.approve');
INSERT INTO "permissions" VALUES(221,'purchase.cancel');
INSERT INTO "permissions" VALUES(222,'srm.read');
INSERT INTO "permissions" VALUES(223,'srm.write');
INSERT INTO "permissions" VALUES(224,'supplier.manage');
INSERT INTO "permissions" VALUES(225,'sales.read');
INSERT INTO "permissions" VALUES(226,'sales.create');
INSERT INTO "permissions" VALUES(227,'sales.approve');
INSERT INTO "permissions" VALUES(228,'sales.fulfill');
INSERT INTO "permissions" VALUES(229,'pos.sell');
INSERT INTO "permissions" VALUES(230,'pos.refund');
INSERT INTO "permissions" VALUES(231,'pos.manage');
INSERT INTO "permissions" VALUES(232,'customer.manage');
INSERT INTO "permissions" VALUES(233,'finance:read');
INSERT INTO "permissions" VALUES(234,'finance:budget_manage');
INSERT INTO "permissions" VALUES(235,'accounting.read');
INSERT INTO "permissions" VALUES(236,'accounting.post');
INSERT INTO "permissions" VALUES(237,'invoices.manage');
INSERT INTO "permissions" VALUES(238,'payments.manage');
INSERT INTO "permissions" VALUES(239,'manufacturing.read');
INSERT INTO "permissions" VALUES(240,'manufacturing.write');
INSERT INTO "permissions" VALUES(241,'eam.read');
INSERT INTO "permissions" VALUES(242,'eam.write');
INSERT INTO "permissions" VALUES(243,'eam.wo_create');
INSERT INTO "permissions" VALUES(244,'eam.wo_update');
INSERT INTO "permissions" VALUES(245,'quality.read');
INSERT INTO "permissions" VALUES(246,'quality.inspect');
INSERT INTO "permissions" VALUES(247,'quality.plan_manage');
INSERT INTO "permissions" VALUES(248,'subcontracting.order.view');
INSERT INTO "permissions" VALUES(249,'subcontracting.order.create');
INSERT INTO "permissions" VALUES(250,'subcontracting.order.approve');
INSERT INTO "permissions" VALUES(251,'commission.read');
INSERT INTO "permissions" VALUES(252,'commission.manage');
INSERT INTO "permissions" VALUES(253,'system.admin');
INSERT INTO "permissions" VALUES(254,'users.read');
INSERT INTO "permissions" VALUES(255,'users.write');
INSERT INTO "permissions" VALUES(256,'roles.manage');
INSERT INTO "permissions" VALUES(257,'settings.manage');
INSERT INTO "permissions" VALUES(258,'inventory.read');
INSERT INTO "permissions" VALUES(259,'inventory.write');
INSERT INTO "permissions" VALUES(260,'stock.view');
INSERT INTO "permissions" VALUES(261,'stock.adjust');
INSERT INTO "permissions" VALUES(262,'stock.transfer');
INSERT INTO "permissions" VALUES(263,'stock.count');
INSERT INTO "permissions" VALUES(264,'goods_issue.create');
INSERT INTO "permissions" VALUES(265,'goods_issue.confirm');
INSERT INTO "permissions" VALUES(266,'goods_issue.cancel');
INSERT INTO "permissions" VALUES(267,'goods_receipt.create');
INSERT INTO "permissions" VALUES(268,'goods_receipt.confirm');
INSERT INTO "permissions" VALUES(269,'goods_receipt.cancel');
INSERT INTO "permissions" VALUES(270,'stocktake.create');
INSERT INTO "permissions" VALUES(271,'stocktake.count');
INSERT INTO "permissions" VALUES(272,'stocktake.recount');
INSERT INTO "permissions" VALUES(273,'stocktake.finalize');
INSERT INTO "permissions" VALUES(274,'stock_adjustment.create');
INSERT INTO "permissions" VALUES(275,'stock_adjustment.approve');
INSERT INTO "permissions" VALUES(276,'stock_adjustment.cancel');
INSERT INTO "permissions" VALUES(277,'lot.create');
INSERT INTO "permissions" VALUES(278,'lot.manage');
INSERT INTO "permissions" VALUES(279,'serial.create');
INSERT INTO "permissions" VALUES(280,'serial.manage');
INSERT INTO "permissions" VALUES(281,'purchase.read');
INSERT INTO "permissions" VALUES(282,'purchase.create');
INSERT INTO "permissions" VALUES(283,'purchase.approve');
INSERT INTO "permissions" VALUES(284,'purchase.cancel');
INSERT INTO "permissions" VALUES(285,'srm.read');
INSERT INTO "permissions" VALUES(286,'srm.write');
INSERT INTO "permissions" VALUES(287,'supplier.manage');
INSERT INTO "permissions" VALUES(288,'sales.read');
INSERT INTO "permissions" VALUES(289,'sales.create');
INSERT INTO "permissions" VALUES(290,'sales.approve');
INSERT INTO "permissions" VALUES(291,'sales.fulfill');
INSERT INTO "permissions" VALUES(292,'pos.sell');
INSERT INTO "permissions" VALUES(293,'pos.refund');
INSERT INTO "permissions" VALUES(294,'pos.manage');
INSERT INTO "permissions" VALUES(295,'customer.manage');
INSERT INTO "permissions" VALUES(296,'finance:read');
INSERT INTO "permissions" VALUES(297,'finance:budget_manage');
INSERT INTO "permissions" VALUES(298,'accounting.read');
INSERT INTO "permissions" VALUES(299,'accounting.post');
INSERT INTO "permissions" VALUES(300,'invoices.manage');
INSERT INTO "permissions" VALUES(301,'payments.manage');
INSERT INTO "permissions" VALUES(302,'manufacturing.read');
INSERT INTO "permissions" VALUES(303,'manufacturing.write');
INSERT INTO "permissions" VALUES(304,'eam.read');
INSERT INTO "permissions" VALUES(305,'eam.write');
INSERT INTO "permissions" VALUES(306,'eam.wo_create');
INSERT INTO "permissions" VALUES(307,'eam.wo_update');
INSERT INTO "permissions" VALUES(308,'quality.read');
INSERT INTO "permissions" VALUES(309,'quality.inspect');
INSERT INTO "permissions" VALUES(310,'quality.plan_manage');
INSERT INTO "permissions" VALUES(311,'subcontracting.order.view');
INSERT INTO "permissions" VALUES(312,'subcontracting.order.create');
INSERT INTO "permissions" VALUES(313,'subcontracting.order.approve');
INSERT INTO "permissions" VALUES(314,'commission.read');
INSERT INTO "permissions" VALUES(315,'commission.manage');
CREATE TABLE "positions" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "department_id" integer,
  "description" text,
  "status" text
);
CREATE TABLE "price_list_items" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "price_list_id" text NOT NULL,
  "product_id" text NOT NULL,
  "uom_id" text,
  "min_qty" real,
  "max_qty" real,
  "unit_price" real NOT NULL,
  "currency" text,
  "valid_from" text NOT NULL,
  "valid_to" text NOT NULL
);
INSERT INTO "price_list_items" VALUES(1,'PL-001','SKU-STEEL-18','PCS',1.0,9.0,285000.0,'VND','2026-01-01','2026-12-31');
INSERT INTO "price_list_items" VALUES(2,'PL-001','SKU-STEEL-18','PCS',10.0,49.0,275000.0,'VND','2026-01-01','2026-12-31');
INSERT INTO "price_list_items" VALUES(3,'PL-001','SKU-STEEL-18','PCS',50.0,99999.0,260000.0,'VND','2026-01-01','2026-12-31');
INSERT INTO "price_list_items" VALUES(4,'PL-001','SKU-CEMENT-PCB40','BAG',1.0,9999.0,88000.0,'VND','2026-01-01','2026-12-31');
INSERT INTO "price_list_items" VALUES(5,'PL-001','SKU-GYPSUM-12','PCS',1.0,9999.0,165000.0,'VND','2026-01-01','2026-12-31');
INSERT INTO "price_list_items" VALUES(6,'PL-002','SKU-STEEL-18','PCS',1.0,99999.0,245000.0,'VND','2026-01-01','2026-12-31');
INSERT INTO "price_list_items" VALUES(7,'PL-002','SKU-CEMENT-PCB40','BAG',1.0,99999.0,79000.0,'VND','2026-01-01','2026-12-31');
CREATE TABLE "price_lists" (
  "id" text PRIMARY KEY,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "type" text,
  "currency" text,
  "customer_group_id" text,
  "valid_from" text NOT NULL,
  "valid_to" text NOT NULL,
  "status" text,
  "priority" integer,
  "created_at" integer
);
INSERT INTO "price_lists" VALUES('PL-001','RETAIL-STD','Bảng giá Bán lẻ Tiêu chuẩn','RETAIL','VND',NULL,'2026-01-01','2026-12-31','ACTIVE',1,NULL);
INSERT INTO "price_lists" VALUES('PL-002','VIP-AGENT','Bảng giá Đại lý Cấp VIP','WHOLESALE','VND','VIP','2026-01-01','2026-12-31','ACTIVE',10,NULL);
CREATE TABLE "process_instance_steps" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "process_instance_id" integer NOT NULL,
  "step_code" text NOT NULL,
  "step_name" text NOT NULL,
  "status" text,
  "entity_module" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text NOT NULL,
  "event_id" text,
  "performed_by" integer,
  "step_payload" text,
  "duration_ms" integer,
  "started_at" integer,
  "completed_at" integer
);
CREATE TABLE "process_instances" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "process_instance_code" text NOT NULL,
  "process_definition_key" text NOT NULL,
  "process_name" text NOT NULL,
  "business_key" text NOT NULL,
  "root_entity_module" text NOT NULL,
  "root_entity_type" text NOT NULL,
  "root_entity_id" text NOT NULL,
  "status" text,
  "current_step" text NOT NULL,
  "correlation_id" text NOT NULL,
  "causation_id" text,
  "initiator_user_id" integer,
  "context_payload" text,
  "started_at" integer,
  "completed_at" integer,
  "updated_at" integer
);
CREATE TABLE "processed_events" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "event_id" text NOT NULL,
  "event_type" text NOT NULL,
  "consumer" text NOT NULL,
  "processed_at" integer,
  "status" text,
  "error" text,
  "retry_count" integer
);
CREATE TABLE "product_uoms" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "product_id" integer NOT NULL,
  "unit_name" text NOT NULL,
  "conversion_factor" integer NOT NULL,
  "barcode" text,
  "price" real
);
CREATE TABLE "production_costs" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "mo_id" integer NOT NULL,
  "material_cost" real,
  "labor_cost" real,
  "machine_cost" real,
  "overhead_cost" real,
  "total_cost" real,
  "produced_qty" real,
  "unit_cost" real,
  "standard_unit_cost" real,
  "variance" real,
  "created_at" integer
);
INSERT INTO "production_costs" VALUES(1,1,480000000.0,35000000.0,28000000.0,12000000.0,555000000.0,20.0,27750000.0,26000000.0,1750000.0,NULL);
CREATE TABLE "production_outputs" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "mo_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "quantity" real NOT NULL,
  "uom" text,
  "good_quantity" real NOT NULL,
  "scrap_quantity" real,
  "batch_number" text,
  "expiry_date" text,
  "warehouse_id" integer,
  "unit_cost" real,
  "total_cost" real,
  "produced_at" integer,
  "produced_by" text
);
CREATE TABLE "production_scraps" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "mo_id" integer NOT NULL,
  "material_product_id" integer NOT NULL,
  "quantity" real NOT NULL,
  "uom" text,
  "scrap_type" text,
  "reason" text,
  "approved_by" text,
  "created_at" integer
);
CREATE TABLE "products" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "sku" text NOT NULL,
  "name" text NOT NULL,
  "barcode" text,
  "category_id" integer,
  "product_type" text,
  "base_unit" text,
  "purchase_unit" text,
  "sales_unit" text,
  "retail_price" real NOT NULL,
  "cost_price" real,
  "status" text,
  "is_serial_tracked" integer,
  "is_lot_tracked" integer,
  "is_manufacturing_target" integer,
  "stock_physical" integer,
  "stock_reserved" integer,
  "stock_available" integer,
  "min_stock" integer,
  "safety_stock" integer,
  "reorder_point" integer,
  "max_stock" integer,
  "reorder_qty" integer,
  "lead_time_days" integer,
  "preferred_supplier_id" integer
);
INSERT INTO "products" VALUES(1,'PRD-001','Laptop Business 14',NULL,1,NULL,'Cái',NULL,NULL,25000000.0,20000000.0,'ACTIVE',NULL,NULL,NULL,15,1,14,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "products" VALUES(2,'PRD-002','Monitor 27"',NULL,1,NULL,'Cái',NULL,NULL,7000000.0,5000000.0,'ACTIVE',NULL,NULL,NULL,20,2,18,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "products" VALUES(3,'PRD-003','Keyboard Mechanical',NULL,2,NULL,'Cái',NULL,NULL,800000.0,500000.0,'ACTIVE',NULL,NULL,NULL,30,3,27,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "products" VALUES(4,'PRD-004','Wireless Mouse',NULL,2,NULL,'Cái',NULL,NULL,500000.0,300000.0,'ACTIVE',NULL,NULL,NULL,30,3,27,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "products" VALUES(5,'SKU-ENG-088','Bơm thủy lực cao áp P-1000',NULL,3,NULL,'Cái',NULL,NULL,3500000.0,2500000.0,'ACTIVE',NULL,NULL,NULL,45,4,41,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "products" VALUES(6,'SKU-MAT-302','Cảm biến lưu lượng điện từ DN80',NULL,4,NULL,'Cái',NULL,NULL,1850000.0,1300000.0,'ACTIVE',NULL,NULL,NULL,80,8,72,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "products" VALUES(7,'SKU-ELC-901','Biến tần công nghiệp 3 pha 45kW',NULL,5,NULL,'Cái',NULL,NULL,12500000.0,9500000.0,'ACTIVE',NULL,NULL,NULL,12,1,11,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "products" VALUES(8,'SKU-RAW-101','Thép cuộn cán nóng SS400 (Cuộn 50kg)',NULL,6,NULL,'Cuộn',NULL,NULL,1450000.0,1100000.0,'ACTIVE',NULL,NULL,NULL,120,12,108,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "products" VALUES(9,'SKU-ACC-055','Cáp tín hiệu chống nhiễu 2x1.5 (Mét)',NULL,2,NULL,'Mét',NULL,NULL,25000.0,18000.0,'ACTIVE',NULL,NULL,NULL,1500,150,1350,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "products" VALUES(10,'SKU-TOOL-12','Bộ cờ lê tròng tự động 12 chi tiết',NULL,7,NULL,'Bộ',NULL,NULL,850000.0,600000.0,'ACTIVE',NULL,NULL,NULL,35,3,32,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "products" VALUES(11,'SKU-VALVE-04','Van bi inox điều khiển khí nén DN50',NULL,8,NULL,'Cái',NULL,NULL,2600000.0,1900000.0,'ACTIVE',NULL,NULL,NULL,22,2,20,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "products" VALUES(12,'RAM-16GB-DDR5','Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',NULL,9,NULL,'Cây',NULL,NULL,666666.0,444444.0,'ACTIVE',NULL,NULL,NULL,120,12,108,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "products" VALUES(13,'SSD-1TB-NVME','Ổ cứng SSD NVMe Samsung 990 Pro 1TB PCIe 4.0',NULL,10,NULL,'Chiếc',NULL,NULL,1560000.0,1200000.0,'ACTIVE',NULL,NULL,NULL,85,8,77,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "products" VALUES(14,'CPU-INTEL-I7','Bộ Vi Xử Lý Intel Core i7 14700K 20 Cores',NULL,11,NULL,'Chiếc',NULL,NULL,4375000.0,3500000.0,'ACTIVE',NULL,NULL,NULL,60,6,54,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "products" VALUES(15,'SKU-CHIP-3NM','Vi Xử Lý AI 3nm Nexus-V1',NULL,12,NULL,'Cái',NULL,NULL,12500000.0,9000000.0,'ACTIVE',NULL,NULL,NULL,1250,125,1125,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "products" VALUES(16,'SKU-NANO-CO2','Vật Liệu Hấp Thụ Carbon Nano-G',NULL,13,NULL,'Kg',NULL,NULL,3200000.0,2400000.0,'ACTIVE',NULL,NULL,NULL,4300,430,3870,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "products" VALUES(17,'SKU-ERP-LIC','Bản quyền Doanh nghiệp NexusSync ERP v5',NULL,14,NULL,'License',NULL,NULL,150000000.0,100000000.0,'ACTIVE',NULL,NULL,NULL,999,99,900,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
CREATE TABLE "project_budget_versions" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "project_id" integer NOT NULL,
  "version_code" text NOT NULL,
  "bcr_code" text,
  "material_budget" real,
  "labor_budget" real,
  "equipment_budget" real,
  "subcontract_budget" real,
  "overhead_budget" real,
  "contingency_budget" real,
  "total_budget" real,
  "change_reason" text,
  "status" text,
  "created_by" integer,
  "approved_by" integer,
  "approved_at" integer,
  "created_at" integer
);
CREATE TABLE "project_budgets" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "project_id" integer NOT NULL,
  "material_budget" real,
  "labor_budget" real,
  "equipment_budget" real,
  "subcontract_budget" real,
  "transportation_budget" real,
  "other_budget" real,
  "total_budget" real,
  "approved_by" text,
  "created_at" integer
);
CREATE TABLE "project_costs" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "project_id" integer NOT NULL,
  "task_id" integer,
  "cost_type" text NOT NULL,
  "description" text NOT NULL,
  "amount" real,
  "reference_no" text,
  "date" text,
  "recorded_by" text,
  "created_at" integer
);
CREATE TABLE "project_evm_snapshots" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "project_id" integer NOT NULL,
  "snapshot_date" text NOT NULL,
  "bac" real,
  "pv" real,
  "ev" real,
  "ac" real,
  "cv" real,
  "sv" real,
  "cpi" real,
  "spi" real,
  "eac" real,
  "notes" text,
  "created_at" integer
);
CREATE TABLE "project_milestones" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "project_id" integer NOT NULL,
  "milestone_code" text NOT NULL,
  "name" text NOT NULL,
  "target_date" text,
  "completion_percentage" real,
  "billing_amount" real,
  "status" text,
  "sales_order_id" integer,
  "invoice_id" integer,
  "verified_by" integer,
  "verified_at" integer,
  "billed_at" integer,
  "created_at" integer
);
CREATE TABLE "project_subcontracts" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "project_id" integer NOT NULL,
  "subcontractor_name" text NOT NULL,
  "contract_no" text NOT NULL,
  "scope" text,
  "contract_value" real,
  "progress_percent" real,
  "paid_amount" real,
  "retention_amount" real,
  "status" text,
  "created_at" integer
);
CREATE TABLE "project_tasks" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "project_id" integer NOT NULL,
  "wbs_id" integer,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "parent_task_id" integer,
  "start_date" text,
  "end_date" text,
  "planned_progress" real,
  "actual_progress" real,
  "responsible_employee_id" integer,
  "responsible_employee_name" text,
  "status" text,
  "budget_amount" real,
  "actual_cost" real
);
INSERT INTO "project_tasks" VALUES(1,1,1,'TSK-1.0','Phase 1: Khảo sát & Lập Charter Dự án',NULL,'2026-01-15','2026-03-15',100.0,100.0,NULL,'Nguyễn Văn An','COMPLETED',800000000.0,780000000.0);
INSERT INTO "project_tasks" VALUES(2,1,2,'TSK-1.1','Work Package: Thu thập Yêu cầu Kế toán & Kho vận',NULL,'2026-01-15','2026-02-15',100.0,100.0,NULL,'Vũ Minh Đức','COMPLETED',350000000.0,340000000.0);
INSERT INTO "project_tasks" VALUES(3,1,3,'TSK-1.2','Work Package: Thống nhất Blueprint Architecture & DB',NULL,'2026-02-16','2026-03-15',100.0,100.0,NULL,'Nguyễn Văn An','COMPLETED',450000000.0,440000000.0);
INSERT INTO "project_tasks" VALUES(4,1,4,'TSK-2.0','Phase 2: Lập trình Core Modules & UI Engine',NULL,'2026-03-16','2026-07-31',100.0,70.0,NULL,'Lê Hoàng Cường','IN_PROGRESS',2200000000.0,1420000000.0);
INSERT INTO "project_tasks" VALUES(5,1,5,'TSK-2.1','Work Package: Xây dựng Module M34 Consolidation',NULL,'2026-03-16','2026-05-30',100.0,100.0,NULL,'Hoàng Kim Long','COMPLETED',1100000000.0,1100000000.0);
INSERT INTO "project_tasks" VALUES(6,1,6,'TSK-2.2','Work Package: Xây dựng Module M35 Projects & WBS',NULL,'2026-06-01','2026-07-31',100.0,40.0,NULL,'Phan Hoàng Pixel','IN_PROGRESS',1100000000.0,320000000.0);
INSERT INTO "project_tasks" VALUES(7,1,7,'TSK-3.0','Phase 3: UAT, Đào Tạo & Chuyển Giao Go-Live',NULL,'2026-08-01','2026-10-30',100.0,20.0,NULL,'Trần Thị Bình','IN_PROGRESS',1500000000.0,500000000.0);
INSERT INTO "project_tasks" VALUES(8,2,8,'TSK-1.0','Phase 1: San Lấp Nền & Thi Công Móng Nhà Xưởng',NULL,'2025-09-01','2025-11-30',100.0,100.0,NULL,'Đỗ Văn Thành','COMPLETED',3500000000.0,3450000000.0);
INSERT INTO "project_tasks" VALUES(9,2,9,'TSK-2.0','Phase 2: Dựng Khung Thép & Lắp Đặt Dây Chuyền IQF',NULL,'2025-12-01','2026-05-15',100.0,100.0,NULL,'Trần Thị Bình','COMPLETED',8000000000.0,8750000000.0);
CREATE TABLE "project_wbs" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "project_id" integer NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "parent_wbs_id" integer,
  "budget_amount" real,
  "description" text
);
INSERT INTO "project_wbs" VALUES(1,1,'1.0','Phase 1: Khảo sát & Lập Charter Dự án',NULL,800000000.0,'Project Charter & Architecture Blueprint');
INSERT INTO "project_wbs" VALUES(2,1,'1.1','Work Package: Thu thập Yêu cầu Kế toán & Kho vận',NULL,350000000.0,'BRD Document v1.0');
INSERT INTO "project_wbs" VALUES(3,1,'1.2','Work Package: Thống nhất Blueprint Architecture & DB',NULL,450000000.0,'Database Schema & API Specs');
INSERT INTO "project_wbs" VALUES(4,1,'2.0','Phase 2: Lập trình Core Modules & UI Engine',NULL,2200000000.0,'Core NexusSync ERP Build v2.5');
INSERT INTO "project_wbs" VALUES(5,1,'2.1','Work Package: Xây dựng Module M34 Consolidation',NULL,1100000000.0,'M34 Workspaces & Multi-Currency Engine');
INSERT INTO "project_wbs" VALUES(6,1,'2.2','Work Package: Xây dựng Module M35 Projects & WBS',NULL,1100000000.0,'M35 WBS Tree & EVM Suite');
INSERT INTO "project_wbs" VALUES(7,1,'3.0','Phase 3: UAT, Đào Tạo & Chuyển Giao Go-Live',NULL,1500000000.0,'Biên bản nghiệm thu UAT & Sign-off');
INSERT INTO "project_wbs" VALUES(8,2,'1.0','Phase 1: San Lấp Nền & Thi Công Móng Nhà Xưởng',NULL,3500000000.0,'Biên bản nghiệm thu phần móng');
INSERT INTO "project_wbs" VALUES(9,2,'2.0','Phase 2: Dựng Khung Thép & Lắp Đặt Dây Chuyền IQF',NULL,8000000000.0,'Khung xưởng & Dây chuyền chạy thử');
CREATE TABLE "projects" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "customer_id" integer,
  "customer_name" text,
  "contract_no" text,
  "project_manager_id" integer,
  "project_manager_name" text,
  "branch_id" integer,
  "location" text,
  "start_date" text,
  "planned_end_date" text,
  "actual_end_date" text,
  "status" text,
  "total_budget" real,
  "actual_cost" real,
  "revenue" real,
  "profit" real,
  "planned_value" real,
  "earned_value" real,
  "cpi" real,
  "spi" real,
  "eac" real,
  "revision_no" text,
  "billing_status" text,
  "notes" text,
  "created_at" integer,
  "updated_at" integer
);
INSERT INTO "projects" VALUES(1,'PRJ-2026-001','Triển khai Phân hệ ERP NexusSync Phase 2',NULL,'Tập đoàn NexusSync Việt Nam','HD-2026/NEXUS-ERP02',NULL,'Nguyễn Văn An (PM Senior)',NULL,NULL,'2026-01-15','2026-10-30',NULL,'ACTIVE',4500000000.0,2700000000.0,5800000000.0,3100000000.0,3150000000.0,2925000000.0,1.08,0.95,4500000000.0,'v1.0','UNBILLED','Hợp nhất 40 phân hệ ERP, tích hợp AI Core & chuẩn hóa sổ cái đa chi nhánh.',1789373904,1789373904);
INSERT INTO "projects" VALUES(2,'PRJ-2026-002','Xây dựng Nhà máy Chế biến Nông sản Cần Thơ',NULL,'Công ty Cổ phần Nông sản Miền Tây','HD-EPC/2025-CANTHO',NULL,'Trần Thị Bình (EPC Lead)',NULL,NULL,'2025-09-01','2026-12-31',NULL,'ACTIVE',18500000000.0,12200000000.0,24000000000.0,11800000000.0,12950000000.0,13320000000.0,1.09,0.95,18500000000.0,'v1.0','UNBILLED','Thi công nhà xưởng 12.000m2, lắp đặt dây chuyền cấp đông IQF tiêu chuẩn EU.',1789373904,1789373904);
INSERT INTO "projects" VALUES(3,'PRJ-2026-003','Nâng cấp Hạ tầng Cloud Data Center & Security',NULL,'Chi nhánh TP. Hồ Chí Minh','HD-INFRA/2026-03',NULL,'Lê Hoàng Cường (Infra Spec)',NULL,NULL,'2026-03-01','2026-08-15',NULL,'ACTIVE',2800000000.0,2850000000.0,3600000000.0,750000000.0,1.95999999999999976159e+09,2520000000.0,0.88,0.95,2800000000.0,'v1.0','UNBILLED','Trang bị cụm Server Dell PowerEdge R760, tường lửa Palo Alto & chuẩn hóa ISO 27001.',1789373904,1789373904);
INSERT INTO "projects" VALUES(4,'PRJ-2026-004','Nghiên cứu Pin Năng lượng Mặt trời Tế bào Hữu cơ',NULL,'Trung tâm R&D Tập đoàn','RD-2026-SOLAR-01',NULL,'Phạm Duy Đức (R&D Director)',NULL,NULL,'2026-02-01','2027-02-01',NULL,'APPROVED',6000000000.0,1500000000.0,7500000000.0,6000000000.0,4.19999999999999952321e+09,1500000000.0,1.0,0.95,6000000000.0,'v1.0','UNBILLED','Thử nghiệm phòng lab hiệu suất chuyển đổi quang điện > 22% cho thiết bị IoT.',1789373904,1789373904);
CREATE TABLE "promotion_campaigns" (
  "id" text PRIMARY KEY,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "category_scope" text,
  "discount_percentage" real NOT NULL,
  "min_qty" real,
  "customer_group_id" text,
  "valid_from" text NOT NULL,
  "valid_to" text NOT NULL,
  "is_active" integer
);
INSERT INTO "promotion_campaigns" VALUES('PROM-SUMMER','SUMMER-STEEL','Chiến dịch Sắt Thép hè 2026','CONSTRUCTION_STEEL',2.0,20.0,'VIP','2026-06-01','2026-08-31',1);
CREATE TABLE "proof_of_deliveries" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "transport_order_id" integer NOT NULL,
  "receiver_name" text NOT NULL,
  "signature_url" text,
  "photo_url" text,
  "delivered_at" text NOT NULL,
  "status" text,
  "failure_reason" text,
  "notes" text,
  "created_at" integer
);
INSERT INTO "proof_of_deliveries" VALUES(1,1,'Phạm Văn Minh (Trưởng ca kho Viettel)','https://signature.api/sig_vt_001.png','https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500','2026-08-28 10:15:00','DELIVERED_SUCCESS',NULL,'Đã bàn giao đủ 120 kiện linh kiện, tem seal niêm phong còn nguyên vẹn.',NULL);
CREATE TABLE "purchase_order_items" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "po_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "uom_id" integer,
  "quantity" integer NOT NULL,
  "unit_cost" real NOT NULL,
  "received_quantity" integer
);
CREATE TABLE "purchase_orders" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "supplier_id" integer NOT NULL,
  "status" text,
  "payment_status" text,
  "amount_paid" real,
  "total_amount" real,
  "expected_date" integer,
  "due_date" integer,
  "created_at" integer,
  "created_by" integer NOT NULL
);
CREATE TABLE "purchase_recommendations" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "product_id" integer NOT NULL,
  "supplier_id" integer,
  "warehouse_id" integer,
  "current_stock" integer NOT NULL,
  "min_stock" integer NOT NULL,
  "reorder_point" integer NOT NULL,
  "max_stock" integer NOT NULL,
  "recommended_qty" integer NOT NULL,
  "estimated_unit_cost" real,
  "estimated_total_cost" real,
  "alert_type" text NOT NULL,
  "priority" text,
  "status" text,
  "generated_po_id" integer,
  "notes" text,
  "created_by" integer,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "purchase_return_items" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "purchase_return_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "quantity" integer NOT NULL,
  "unit_price" real NOT NULL,
  "reason" text,
  "serial_numbers" text
);
CREATE TABLE "purchase_returns" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "po_id" integer,
  "supplier_id" integer NOT NULL,
  "warehouse_id" integer NOT NULL,
  "status" text,
  "refund_status" text,
  "refunded_amount" real,
  "return_date" integer,
  "total_amount" real,
  "reason" text,
  "created_by" integer NOT NULL,
  "created_at" integer
);
CREATE TABLE "quality_capas" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "capa_code" text NOT NULL,
  "ncr_id" integer NOT NULL,
  "title" text NOT NULL,
  "corrective_action" text NOT NULL,
  "preventive_action" text NOT NULL,
  "target_date" text,
  "status" text,
  "assigned_user_id" integer,
  "verified_by" integer,
  "verified_at" integer,
  "created_at" integer
);
CREATE TABLE "quality_holds" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "hold_code" text NOT NULL,
  "inspection_id" integer,
  "product_id" integer NOT NULL,
  "lot_number" text,
  "serial_number" text,
  "warehouse_id" integer NOT NULL,
  "location_id" integer,
  "quarantine_quantity" integer NOT NULL,
  "hold_reason" text NOT NULL,
  "status" text,
  "disposition" text,
  "disposition_notes" text,
  "disposed_by" integer,
  "disposed_at" integer,
  "created_at" integer
);
CREATE TABLE "quality_inspection_plans" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "plan_code" text NOT NULL,
  "title" text NOT NULL,
  "product_id" integer,
  "category_id" integer,
  "inspection_type" text,
  "revision" integer,
  "status" text,
  "aql_level" text,
  "sample_size_formula" text,
  "characteristics" text,
  "created_by" integer,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "quality_inspection_results" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "inspection_id" integer NOT NULL,
  "characteristic_name" text NOT NULL,
  "is_quantitative" integer,
  "target_value" real,
  "upper_tolerance" real,
  "lower_tolerance" real,
  "measured_value" real,
  "qualitative_result" text,
  "is_passed" integer NOT NULL,
  "notes" text,
  "sample_number" integer
);
CREATE TABLE "quality_inspections" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "inspection_code" text NOT NULL,
  "plan_id" integer,
  "inspection_type" text NOT NULL,
  "source_document_type" text NOT NULL,
  "source_document_id" integer NOT NULL,
  "source_reference_no" text NOT NULL,
  "product_id" integer NOT NULL,
  "lot_number" text,
  "serial_number" text,
  "warehouse_id" integer,
  "location_id" integer,
  "total_quantity" integer,
  "sample_quantity" integer,
  "inspector_id" integer,
  "status" text,
  "decision" text,
  "decision_reason" text,
  "decided_by" integer,
  "decided_at" integer,
  "inspection_round" integer,
  "parent_inspection_id" integer,
  "created_at" integer
);
CREATE TABLE "quality_ncrs" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "ncr_code" text NOT NULL,
  "inspection_id" integer,
  "hold_id" integer,
  "title" text NOT NULL,
  "severity" text,
  "description" text NOT NULL,
  "root_cause" text,
  "status" text,
  "assignee_id" integer,
  "reporter_id" integer NOT NULL,
  "closed_by" integer,
  "closed_at" integer,
  "created_at" integer
);
CREATE TABLE "rd_formulas" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "formula_code" text NOT NULL,
  "project_id" integer,
  "name" text NOT NULL,
  "version" text,
  "status" text,
  "author" text NOT NULL,
  "components" text NOT NULL,
  "yield_rate" real,
  "test_batch_size" real,
  "approved_by" text,
  "approved_at" text,
  "created_at" text NOT NULL
);
CREATE TABLE "rd_lab_trials" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "trial_code" text NOT NULL,
  "project_id" integer,
  "formula_id" integer,
  "trial_name" text NOT NULL,
  "test_type" text NOT NULL,
  "sample_size" integer,
  "status" text,
  "score" real,
  "performed_by" text NOT NULL,
  "result_notes" text,
  "conducted_at" text NOT NULL
);
CREATE TABLE "rd_patents" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "patent_code" text NOT NULL,
  "project_id" integer,
  "title" text NOT NULL,
  "filing_no" text NOT NULL,
  "filing_date" text NOT NULL,
  "grant_date" text,
  "status" text,
  "inventors" text NOT NULL,
  "jurisdiction" text,
  "abstract" text,
  "created_at" text NOT NULL
);
CREATE TABLE "rd_projects" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "project_code" text NOT NULL,
  "title" text NOT NULL,
  "category" text NOT NULL,
  "lead" text NOT NULL,
  "status" text,
  "progress" integer,
  "budget" real,
  "spent_budget" real,
  "currency" text,
  "start_date" text NOT NULL,
  "deadline" text NOT NULL,
  "trl_level" integer,
  "risk_level" text,
  "description" text,
  "created_at" text NOT NULL,
  "updated_at" text
);
CREATE TABLE "role_permissions" (
  "role_id" integer NOT NULL,
  "permission_id" integer NOT NULL
);
INSERT INTO "role_permissions" VALUES(1,1);
INSERT INTO "role_permissions" VALUES(1,2);
INSERT INTO "role_permissions" VALUES(1,3);
INSERT INTO "role_permissions" VALUES(1,4);
INSERT INTO "role_permissions" VALUES(1,5);
INSERT INTO "role_permissions" VALUES(1,6);
INSERT INTO "role_permissions" VALUES(1,7);
INSERT INTO "role_permissions" VALUES(1,8);
INSERT INTO "role_permissions" VALUES(1,9);
INSERT INTO "role_permissions" VALUES(1,10);
INSERT INTO "role_permissions" VALUES(1,11);
INSERT INTO "role_permissions" VALUES(1,12);
INSERT INTO "role_permissions" VALUES(1,13);
INSERT INTO "role_permissions" VALUES(1,14);
INSERT INTO "role_permissions" VALUES(1,15);
INSERT INTO "role_permissions" VALUES(1,16);
INSERT INTO "role_permissions" VALUES(1,17);
INSERT INTO "role_permissions" VALUES(1,18);
INSERT INTO "role_permissions" VALUES(1,19);
INSERT INTO "role_permissions" VALUES(1,20);
INSERT INTO "role_permissions" VALUES(1,21);
INSERT INTO "role_permissions" VALUES(1,22);
INSERT INTO "role_permissions" VALUES(1,23);
INSERT INTO "role_permissions" VALUES(1,24);
INSERT INTO "role_permissions" VALUES(1,25);
INSERT INTO "role_permissions" VALUES(1,26);
INSERT INTO "role_permissions" VALUES(1,27);
INSERT INTO "role_permissions" VALUES(1,28);
INSERT INTO "role_permissions" VALUES(1,29);
INSERT INTO "role_permissions" VALUES(1,30);
INSERT INTO "role_permissions" VALUES(1,31);
INSERT INTO "role_permissions" VALUES(1,32);
INSERT INTO "role_permissions" VALUES(1,33);
INSERT INTO "role_permissions" VALUES(1,34);
INSERT INTO "role_permissions" VALUES(1,35);
INSERT INTO "role_permissions" VALUES(1,36);
INSERT INTO "role_permissions" VALUES(1,37);
INSERT INTO "role_permissions" VALUES(1,38);
INSERT INTO "role_permissions" VALUES(1,39);
INSERT INTO "role_permissions" VALUES(1,40);
INSERT INTO "role_permissions" VALUES(1,41);
INSERT INTO "role_permissions" VALUES(1,42);
INSERT INTO "role_permissions" VALUES(1,43);
INSERT INTO "role_permissions" VALUES(1,44);
INSERT INTO "role_permissions" VALUES(1,45);
INSERT INTO "role_permissions" VALUES(1,46);
INSERT INTO "role_permissions" VALUES(1,47);
INSERT INTO "role_permissions" VALUES(1,48);
INSERT INTO "role_permissions" VALUES(1,49);
INSERT INTO "role_permissions" VALUES(1,50);
INSERT INTO "role_permissions" VALUES(1,51);
INSERT INTO "role_permissions" VALUES(1,52);
INSERT INTO "role_permissions" VALUES(1,53);
INSERT INTO "role_permissions" VALUES(1,54);
INSERT INTO "role_permissions" VALUES(1,55);
INSERT INTO "role_permissions" VALUES(1,56);
INSERT INTO "role_permissions" VALUES(1,57);
INSERT INTO "role_permissions" VALUES(1,58);
INSERT INTO "role_permissions" VALUES(1,59);
INSERT INTO "role_permissions" VALUES(1,60);
INSERT INTO "role_permissions" VALUES(1,61);
INSERT INTO "role_permissions" VALUES(1,62);
INSERT INTO "role_permissions" VALUES(1,63);
INSERT INTO "role_permissions" VALUES(2,1);
INSERT INTO "role_permissions" VALUES(2,2);
INSERT INTO "role_permissions" VALUES(2,3);
INSERT INTO "role_permissions" VALUES(2,4);
INSERT INTO "role_permissions" VALUES(2,5);
INSERT INTO "role_permissions" VALUES(2,6);
INSERT INTO "role_permissions" VALUES(2,7);
INSERT INTO "role_permissions" VALUES(2,8);
INSERT INTO "role_permissions" VALUES(2,9);
INSERT INTO "role_permissions" VALUES(2,10);
INSERT INTO "role_permissions" VALUES(2,11);
INSERT INTO "role_permissions" VALUES(2,12);
INSERT INTO "role_permissions" VALUES(2,13);
INSERT INTO "role_permissions" VALUES(2,14);
INSERT INTO "role_permissions" VALUES(2,15);
INSERT INTO "role_permissions" VALUES(2,16);
INSERT INTO "role_permissions" VALUES(2,17);
INSERT INTO "role_permissions" VALUES(2,18);
INSERT INTO "role_permissions" VALUES(2,19);
INSERT INTO "role_permissions" VALUES(2,20);
INSERT INTO "role_permissions" VALUES(2,21);
INSERT INTO "role_permissions" VALUES(2,22);
INSERT INTO "role_permissions" VALUES(2,23);
INSERT INTO "role_permissions" VALUES(2,24);
INSERT INTO "role_permissions" VALUES(2,25);
INSERT INTO "role_permissions" VALUES(2,26);
INSERT INTO "role_permissions" VALUES(2,27);
INSERT INTO "role_permissions" VALUES(2,28);
INSERT INTO "role_permissions" VALUES(2,29);
INSERT INTO "role_permissions" VALUES(2,30);
INSERT INTO "role_permissions" VALUES(2,31);
INSERT INTO "role_permissions" VALUES(2,32);
INSERT INTO "role_permissions" VALUES(2,33);
INSERT INTO "role_permissions" VALUES(2,34);
INSERT INTO "role_permissions" VALUES(2,35);
INSERT INTO "role_permissions" VALUES(2,36);
INSERT INTO "role_permissions" VALUES(2,37);
INSERT INTO "role_permissions" VALUES(2,38);
INSERT INTO "role_permissions" VALUES(2,39);
INSERT INTO "role_permissions" VALUES(2,40);
INSERT INTO "role_permissions" VALUES(2,41);
INSERT INTO "role_permissions" VALUES(2,42);
INSERT INTO "role_permissions" VALUES(2,43);
INSERT INTO "role_permissions" VALUES(2,44);
INSERT INTO "role_permissions" VALUES(2,45);
INSERT INTO "role_permissions" VALUES(2,46);
INSERT INTO "role_permissions" VALUES(2,47);
INSERT INTO "role_permissions" VALUES(2,48);
INSERT INTO "role_permissions" VALUES(2,49);
INSERT INTO "role_permissions" VALUES(2,50);
INSERT INTO "role_permissions" VALUES(2,51);
INSERT INTO "role_permissions" VALUES(2,52);
INSERT INTO "role_permissions" VALUES(2,53);
INSERT INTO "role_permissions" VALUES(2,54);
INSERT INTO "role_permissions" VALUES(2,55);
INSERT INTO "role_permissions" VALUES(2,56);
INSERT INTO "role_permissions" VALUES(2,57);
INSERT INTO "role_permissions" VALUES(2,58);
INSERT INTO "role_permissions" VALUES(2,59);
INSERT INTO "role_permissions" VALUES(2,60);
INSERT INTO "role_permissions" VALUES(2,61);
INSERT INTO "role_permissions" VALUES(2,62);
INSERT INTO "role_permissions" VALUES(2,63);
INSERT INTO "role_permissions" VALUES(3,2);
INSERT INTO "role_permissions" VALUES(3,3);
INSERT INTO "role_permissions" VALUES(3,4);
INSERT INTO "role_permissions" VALUES(3,5);
INSERT INTO "role_permissions" VALUES(3,6);
INSERT INTO "role_permissions" VALUES(3,7);
INSERT INTO "role_permissions" VALUES(3,8);
INSERT INTO "role_permissions" VALUES(3,9);
INSERT INTO "role_permissions" VALUES(3,10);
INSERT INTO "role_permissions" VALUES(3,11);
INSERT INTO "role_permissions" VALUES(3,12);
INSERT INTO "role_permissions" VALUES(3,13);
INSERT INTO "role_permissions" VALUES(3,14);
INSERT INTO "role_permissions" VALUES(3,15);
INSERT INTO "role_permissions" VALUES(3,16);
INSERT INTO "role_permissions" VALUES(3,17);
INSERT INTO "role_permissions" VALUES(3,18);
INSERT INTO "role_permissions" VALUES(3,19);
INSERT INTO "role_permissions" VALUES(3,20);
INSERT INTO "role_permissions" VALUES(3,21);
INSERT INTO "role_permissions" VALUES(3,22);
INSERT INTO "role_permissions" VALUES(3,23);
INSERT INTO "role_permissions" VALUES(3,24);
INSERT INTO "role_permissions" VALUES(3,25);
INSERT INTO "role_permissions" VALUES(3,26);
INSERT INTO "role_permissions" VALUES(3,27);
INSERT INTO "role_permissions" VALUES(3,28);
INSERT INTO "role_permissions" VALUES(3,29);
INSERT INTO "role_permissions" VALUES(3,30);
INSERT INTO "role_permissions" VALUES(3,31);
INSERT INTO "role_permissions" VALUES(3,32);
INSERT INTO "role_permissions" VALUES(3,33);
INSERT INTO "role_permissions" VALUES(3,34);
INSERT INTO "role_permissions" VALUES(3,35);
INSERT INTO "role_permissions" VALUES(3,36);
INSERT INTO "role_permissions" VALUES(3,37);
INSERT INTO "role_permissions" VALUES(3,38);
INSERT INTO "role_permissions" VALUES(3,39);
INSERT INTO "role_permissions" VALUES(3,40);
INSERT INTO "role_permissions" VALUES(3,41);
INSERT INTO "role_permissions" VALUES(3,42);
INSERT INTO "role_permissions" VALUES(3,43);
INSERT INTO "role_permissions" VALUES(3,44);
INSERT INTO "role_permissions" VALUES(3,45);
INSERT INTO "role_permissions" VALUES(3,46);
INSERT INTO "role_permissions" VALUES(3,47);
INSERT INTO "role_permissions" VALUES(3,48);
INSERT INTO "role_permissions" VALUES(3,49);
INSERT INTO "role_permissions" VALUES(3,50);
INSERT INTO "role_permissions" VALUES(3,51);
INSERT INTO "role_permissions" VALUES(3,52);
INSERT INTO "role_permissions" VALUES(3,53);
INSERT INTO "role_permissions" VALUES(3,54);
INSERT INTO "role_permissions" VALUES(3,55);
INSERT INTO "role_permissions" VALUES(3,56);
INSERT INTO "role_permissions" VALUES(3,57);
INSERT INTO "role_permissions" VALUES(3,58);
INSERT INTO "role_permissions" VALUES(3,59);
INSERT INTO "role_permissions" VALUES(3,60);
INSERT INTO "role_permissions" VALUES(3,61);
INSERT INTO "role_permissions" VALUES(3,62);
INSERT INTO "role_permissions" VALUES(3,63);
INSERT INTO "role_permissions" VALUES(1,1);
INSERT INTO "role_permissions" VALUES(1,2);
INSERT INTO "role_permissions" VALUES(1,3);
INSERT INTO "role_permissions" VALUES(1,4);
INSERT INTO "role_permissions" VALUES(1,5);
INSERT INTO "role_permissions" VALUES(1,6);
INSERT INTO "role_permissions" VALUES(1,7);
INSERT INTO "role_permissions" VALUES(1,8);
INSERT INTO "role_permissions" VALUES(1,9);
INSERT INTO "role_permissions" VALUES(1,10);
INSERT INTO "role_permissions" VALUES(1,11);
INSERT INTO "role_permissions" VALUES(1,12);
INSERT INTO "role_permissions" VALUES(1,13);
INSERT INTO "role_permissions" VALUES(1,14);
INSERT INTO "role_permissions" VALUES(1,15);
INSERT INTO "role_permissions" VALUES(1,16);
INSERT INTO "role_permissions" VALUES(1,17);
INSERT INTO "role_permissions" VALUES(1,18);
INSERT INTO "role_permissions" VALUES(1,19);
INSERT INTO "role_permissions" VALUES(1,20);
INSERT INTO "role_permissions" VALUES(1,21);
INSERT INTO "role_permissions" VALUES(1,22);
INSERT INTO "role_permissions" VALUES(1,23);
INSERT INTO "role_permissions" VALUES(1,24);
INSERT INTO "role_permissions" VALUES(1,25);
INSERT INTO "role_permissions" VALUES(1,26);
INSERT INTO "role_permissions" VALUES(1,27);
INSERT INTO "role_permissions" VALUES(1,28);
INSERT INTO "role_permissions" VALUES(1,29);
INSERT INTO "role_permissions" VALUES(1,30);
INSERT INTO "role_permissions" VALUES(1,31);
INSERT INTO "role_permissions" VALUES(1,32);
INSERT INTO "role_permissions" VALUES(1,33);
INSERT INTO "role_permissions" VALUES(1,34);
INSERT INTO "role_permissions" VALUES(1,35);
INSERT INTO "role_permissions" VALUES(1,36);
INSERT INTO "role_permissions" VALUES(1,37);
INSERT INTO "role_permissions" VALUES(1,38);
INSERT INTO "role_permissions" VALUES(1,39);
INSERT INTO "role_permissions" VALUES(1,40);
INSERT INTO "role_permissions" VALUES(1,41);
INSERT INTO "role_permissions" VALUES(1,42);
INSERT INTO "role_permissions" VALUES(1,43);
INSERT INTO "role_permissions" VALUES(1,44);
INSERT INTO "role_permissions" VALUES(1,45);
INSERT INTO "role_permissions" VALUES(1,46);
INSERT INTO "role_permissions" VALUES(1,47);
INSERT INTO "role_permissions" VALUES(1,48);
INSERT INTO "role_permissions" VALUES(1,49);
INSERT INTO "role_permissions" VALUES(1,50);
INSERT INTO "role_permissions" VALUES(1,51);
INSERT INTO "role_permissions" VALUES(1,52);
INSERT INTO "role_permissions" VALUES(1,53);
INSERT INTO "role_permissions" VALUES(1,54);
INSERT INTO "role_permissions" VALUES(1,55);
INSERT INTO "role_permissions" VALUES(1,56);
INSERT INTO "role_permissions" VALUES(1,57);
INSERT INTO "role_permissions" VALUES(1,58);
INSERT INTO "role_permissions" VALUES(1,59);
INSERT INTO "role_permissions" VALUES(1,60);
INSERT INTO "role_permissions" VALUES(1,61);
INSERT INTO "role_permissions" VALUES(1,62);
INSERT INTO "role_permissions" VALUES(1,63);
INSERT INTO "role_permissions" VALUES(1,64);
INSERT INTO "role_permissions" VALUES(1,65);
INSERT INTO "role_permissions" VALUES(1,66);
INSERT INTO "role_permissions" VALUES(1,67);
INSERT INTO "role_permissions" VALUES(1,68);
INSERT INTO "role_permissions" VALUES(1,69);
INSERT INTO "role_permissions" VALUES(1,70);
INSERT INTO "role_permissions" VALUES(1,71);
INSERT INTO "role_permissions" VALUES(1,72);
INSERT INTO "role_permissions" VALUES(1,73);
INSERT INTO "role_permissions" VALUES(1,74);
INSERT INTO "role_permissions" VALUES(1,75);
INSERT INTO "role_permissions" VALUES(1,76);
INSERT INTO "role_permissions" VALUES(1,77);
INSERT INTO "role_permissions" VALUES(1,78);
INSERT INTO "role_permissions" VALUES(1,79);
INSERT INTO "role_permissions" VALUES(1,80);
INSERT INTO "role_permissions" VALUES(1,81);
INSERT INTO "role_permissions" VALUES(1,82);
INSERT INTO "role_permissions" VALUES(1,83);
INSERT INTO "role_permissions" VALUES(1,84);
INSERT INTO "role_permissions" VALUES(1,85);
INSERT INTO "role_permissions" VALUES(1,86);
INSERT INTO "role_permissions" VALUES(1,87);
INSERT INTO "role_permissions" VALUES(1,88);
INSERT INTO "role_permissions" VALUES(1,89);
INSERT INTO "role_permissions" VALUES(1,90);
INSERT INTO "role_permissions" VALUES(1,91);
INSERT INTO "role_permissions" VALUES(1,92);
INSERT INTO "role_permissions" VALUES(1,93);
INSERT INTO "role_permissions" VALUES(1,94);
INSERT INTO "role_permissions" VALUES(1,95);
INSERT INTO "role_permissions" VALUES(1,96);
INSERT INTO "role_permissions" VALUES(1,97);
INSERT INTO "role_permissions" VALUES(1,98);
INSERT INTO "role_permissions" VALUES(1,99);
INSERT INTO "role_permissions" VALUES(1,100);
INSERT INTO "role_permissions" VALUES(1,101);
INSERT INTO "role_permissions" VALUES(1,102);
INSERT INTO "role_permissions" VALUES(1,103);
INSERT INTO "role_permissions" VALUES(1,104);
INSERT INTO "role_permissions" VALUES(1,105);
INSERT INTO "role_permissions" VALUES(1,106);
INSERT INTO "role_permissions" VALUES(1,107);
INSERT INTO "role_permissions" VALUES(1,108);
INSERT INTO "role_permissions" VALUES(1,109);
INSERT INTO "role_permissions" VALUES(1,110);
INSERT INTO "role_permissions" VALUES(1,111);
INSERT INTO "role_permissions" VALUES(1,112);
INSERT INTO "role_permissions" VALUES(1,113);
INSERT INTO "role_permissions" VALUES(1,114);
INSERT INTO "role_permissions" VALUES(1,115);
INSERT INTO "role_permissions" VALUES(1,116);
INSERT INTO "role_permissions" VALUES(1,117);
INSERT INTO "role_permissions" VALUES(1,118);
INSERT INTO "role_permissions" VALUES(1,119);
INSERT INTO "role_permissions" VALUES(1,120);
INSERT INTO "role_permissions" VALUES(1,121);
INSERT INTO "role_permissions" VALUES(1,122);
INSERT INTO "role_permissions" VALUES(1,123);
INSERT INTO "role_permissions" VALUES(1,124);
INSERT INTO "role_permissions" VALUES(1,125);
INSERT INTO "role_permissions" VALUES(1,126);
INSERT INTO "role_permissions" VALUES(2,1);
INSERT INTO "role_permissions" VALUES(2,2);
INSERT INTO "role_permissions" VALUES(2,3);
INSERT INTO "role_permissions" VALUES(2,4);
INSERT INTO "role_permissions" VALUES(2,5);
INSERT INTO "role_permissions" VALUES(2,6);
INSERT INTO "role_permissions" VALUES(2,7);
INSERT INTO "role_permissions" VALUES(2,8);
INSERT INTO "role_permissions" VALUES(2,9);
INSERT INTO "role_permissions" VALUES(2,10);
INSERT INTO "role_permissions" VALUES(2,11);
INSERT INTO "role_permissions" VALUES(2,12);
INSERT INTO "role_permissions" VALUES(2,13);
INSERT INTO "role_permissions" VALUES(2,14);
INSERT INTO "role_permissions" VALUES(2,15);
INSERT INTO "role_permissions" VALUES(2,16);
INSERT INTO "role_permissions" VALUES(2,17);
INSERT INTO "role_permissions" VALUES(2,18);
INSERT INTO "role_permissions" VALUES(2,19);
INSERT INTO "role_permissions" VALUES(2,20);
INSERT INTO "role_permissions" VALUES(2,21);
INSERT INTO "role_permissions" VALUES(2,22);
INSERT INTO "role_permissions" VALUES(2,23);
INSERT INTO "role_permissions" VALUES(2,24);
INSERT INTO "role_permissions" VALUES(2,25);
INSERT INTO "role_permissions" VALUES(2,26);
INSERT INTO "role_permissions" VALUES(2,27);
INSERT INTO "role_permissions" VALUES(2,28);
INSERT INTO "role_permissions" VALUES(2,29);
INSERT INTO "role_permissions" VALUES(2,30);
INSERT INTO "role_permissions" VALUES(2,31);
INSERT INTO "role_permissions" VALUES(2,32);
INSERT INTO "role_permissions" VALUES(2,33);
INSERT INTO "role_permissions" VALUES(2,34);
INSERT INTO "role_permissions" VALUES(2,35);
INSERT INTO "role_permissions" VALUES(2,36);
INSERT INTO "role_permissions" VALUES(2,37);
INSERT INTO "role_permissions" VALUES(2,38);
INSERT INTO "role_permissions" VALUES(2,39);
INSERT INTO "role_permissions" VALUES(2,40);
INSERT INTO "role_permissions" VALUES(2,41);
INSERT INTO "role_permissions" VALUES(2,42);
INSERT INTO "role_permissions" VALUES(2,43);
INSERT INTO "role_permissions" VALUES(2,44);
INSERT INTO "role_permissions" VALUES(2,45);
INSERT INTO "role_permissions" VALUES(2,46);
INSERT INTO "role_permissions" VALUES(2,47);
INSERT INTO "role_permissions" VALUES(2,48);
INSERT INTO "role_permissions" VALUES(2,49);
INSERT INTO "role_permissions" VALUES(2,50);
INSERT INTO "role_permissions" VALUES(2,51);
INSERT INTO "role_permissions" VALUES(2,52);
INSERT INTO "role_permissions" VALUES(2,53);
INSERT INTO "role_permissions" VALUES(2,54);
INSERT INTO "role_permissions" VALUES(2,55);
INSERT INTO "role_permissions" VALUES(2,56);
INSERT INTO "role_permissions" VALUES(2,57);
INSERT INTO "role_permissions" VALUES(2,58);
INSERT INTO "role_permissions" VALUES(2,59);
INSERT INTO "role_permissions" VALUES(2,60);
INSERT INTO "role_permissions" VALUES(2,61);
INSERT INTO "role_permissions" VALUES(2,62);
INSERT INTO "role_permissions" VALUES(2,63);
INSERT INTO "role_permissions" VALUES(2,64);
INSERT INTO "role_permissions" VALUES(2,65);
INSERT INTO "role_permissions" VALUES(2,66);
INSERT INTO "role_permissions" VALUES(2,67);
INSERT INTO "role_permissions" VALUES(2,68);
INSERT INTO "role_permissions" VALUES(2,69);
INSERT INTO "role_permissions" VALUES(2,70);
INSERT INTO "role_permissions" VALUES(2,71);
INSERT INTO "role_permissions" VALUES(2,72);
INSERT INTO "role_permissions" VALUES(2,73);
INSERT INTO "role_permissions" VALUES(2,74);
INSERT INTO "role_permissions" VALUES(2,75);
INSERT INTO "role_permissions" VALUES(2,76);
INSERT INTO "role_permissions" VALUES(2,77);
INSERT INTO "role_permissions" VALUES(2,78);
INSERT INTO "role_permissions" VALUES(2,79);
INSERT INTO "role_permissions" VALUES(2,80);
INSERT INTO "role_permissions" VALUES(2,81);
INSERT INTO "role_permissions" VALUES(2,82);
INSERT INTO "role_permissions" VALUES(2,83);
INSERT INTO "role_permissions" VALUES(2,84);
INSERT INTO "role_permissions" VALUES(2,85);
INSERT INTO "role_permissions" VALUES(2,86);
INSERT INTO "role_permissions" VALUES(2,87);
INSERT INTO "role_permissions" VALUES(2,88);
INSERT INTO "role_permissions" VALUES(2,89);
INSERT INTO "role_permissions" VALUES(2,90);
INSERT INTO "role_permissions" VALUES(2,91);
INSERT INTO "role_permissions" VALUES(2,92);
INSERT INTO "role_permissions" VALUES(2,93);
INSERT INTO "role_permissions" VALUES(2,94);
INSERT INTO "role_permissions" VALUES(2,95);
INSERT INTO "role_permissions" VALUES(2,96);
INSERT INTO "role_permissions" VALUES(2,97);
INSERT INTO "role_permissions" VALUES(2,98);
INSERT INTO "role_permissions" VALUES(2,99);
INSERT INTO "role_permissions" VALUES(2,100);
INSERT INTO "role_permissions" VALUES(2,101);
INSERT INTO "role_permissions" VALUES(2,102);
INSERT INTO "role_permissions" VALUES(2,103);
INSERT INTO "role_permissions" VALUES(2,104);
INSERT INTO "role_permissions" VALUES(2,105);
INSERT INTO "role_permissions" VALUES(2,106);
INSERT INTO "role_permissions" VALUES(2,107);
INSERT INTO "role_permissions" VALUES(2,108);
INSERT INTO "role_permissions" VALUES(2,109);
INSERT INTO "role_permissions" VALUES(2,110);
INSERT INTO "role_permissions" VALUES(2,111);
INSERT INTO "role_permissions" VALUES(2,112);
INSERT INTO "role_permissions" VALUES(2,113);
INSERT INTO "role_permissions" VALUES(2,114);
INSERT INTO "role_permissions" VALUES(2,115);
INSERT INTO "role_permissions" VALUES(2,116);
INSERT INTO "role_permissions" VALUES(2,117);
INSERT INTO "role_permissions" VALUES(2,118);
INSERT INTO "role_permissions" VALUES(2,119);
INSERT INTO "role_permissions" VALUES(2,120);
INSERT INTO "role_permissions" VALUES(2,121);
INSERT INTO "role_permissions" VALUES(2,122);
INSERT INTO "role_permissions" VALUES(2,123);
INSERT INTO "role_permissions" VALUES(2,124);
INSERT INTO "role_permissions" VALUES(2,125);
INSERT INTO "role_permissions" VALUES(2,126);
INSERT INTO "role_permissions" VALUES(8,1);
INSERT INTO "role_permissions" VALUES(8,2);
INSERT INTO "role_permissions" VALUES(8,3);
INSERT INTO "role_permissions" VALUES(8,4);
INSERT INTO "role_permissions" VALUES(8,5);
INSERT INTO "role_permissions" VALUES(8,6);
INSERT INTO "role_permissions" VALUES(8,7);
INSERT INTO "role_permissions" VALUES(8,8);
INSERT INTO "role_permissions" VALUES(8,9);
INSERT INTO "role_permissions" VALUES(8,10);
INSERT INTO "role_permissions" VALUES(8,11);
INSERT INTO "role_permissions" VALUES(8,12);
INSERT INTO "role_permissions" VALUES(8,13);
INSERT INTO "role_permissions" VALUES(8,14);
INSERT INTO "role_permissions" VALUES(8,15);
INSERT INTO "role_permissions" VALUES(8,16);
INSERT INTO "role_permissions" VALUES(8,17);
INSERT INTO "role_permissions" VALUES(8,18);
INSERT INTO "role_permissions" VALUES(8,19);
INSERT INTO "role_permissions" VALUES(8,20);
INSERT INTO "role_permissions" VALUES(8,21);
INSERT INTO "role_permissions" VALUES(8,22);
INSERT INTO "role_permissions" VALUES(8,23);
INSERT INTO "role_permissions" VALUES(8,24);
INSERT INTO "role_permissions" VALUES(8,25);
INSERT INTO "role_permissions" VALUES(8,26);
INSERT INTO "role_permissions" VALUES(8,27);
INSERT INTO "role_permissions" VALUES(8,28);
INSERT INTO "role_permissions" VALUES(8,29);
INSERT INTO "role_permissions" VALUES(8,30);
INSERT INTO "role_permissions" VALUES(8,31);
INSERT INTO "role_permissions" VALUES(8,32);
INSERT INTO "role_permissions" VALUES(8,33);
INSERT INTO "role_permissions" VALUES(8,34);
INSERT INTO "role_permissions" VALUES(8,35);
INSERT INTO "role_permissions" VALUES(8,36);
INSERT INTO "role_permissions" VALUES(8,37);
INSERT INTO "role_permissions" VALUES(8,38);
INSERT INTO "role_permissions" VALUES(8,39);
INSERT INTO "role_permissions" VALUES(8,40);
INSERT INTO "role_permissions" VALUES(8,41);
INSERT INTO "role_permissions" VALUES(8,42);
INSERT INTO "role_permissions" VALUES(8,43);
INSERT INTO "role_permissions" VALUES(8,44);
INSERT INTO "role_permissions" VALUES(8,45);
INSERT INTO "role_permissions" VALUES(8,46);
INSERT INTO "role_permissions" VALUES(8,47);
INSERT INTO "role_permissions" VALUES(8,48);
INSERT INTO "role_permissions" VALUES(8,49);
INSERT INTO "role_permissions" VALUES(8,50);
INSERT INTO "role_permissions" VALUES(8,51);
INSERT INTO "role_permissions" VALUES(8,52);
INSERT INTO "role_permissions" VALUES(8,53);
INSERT INTO "role_permissions" VALUES(8,54);
INSERT INTO "role_permissions" VALUES(8,55);
INSERT INTO "role_permissions" VALUES(8,56);
INSERT INTO "role_permissions" VALUES(8,57);
INSERT INTO "role_permissions" VALUES(8,58);
INSERT INTO "role_permissions" VALUES(8,59);
INSERT INTO "role_permissions" VALUES(8,60);
INSERT INTO "role_permissions" VALUES(8,61);
INSERT INTO "role_permissions" VALUES(8,62);
INSERT INTO "role_permissions" VALUES(8,63);
INSERT INTO "role_permissions" VALUES(8,64);
INSERT INTO "role_permissions" VALUES(8,65);
INSERT INTO "role_permissions" VALUES(8,66);
INSERT INTO "role_permissions" VALUES(8,67);
INSERT INTO "role_permissions" VALUES(8,68);
INSERT INTO "role_permissions" VALUES(8,69);
INSERT INTO "role_permissions" VALUES(8,70);
INSERT INTO "role_permissions" VALUES(8,71);
INSERT INTO "role_permissions" VALUES(8,72);
INSERT INTO "role_permissions" VALUES(8,73);
INSERT INTO "role_permissions" VALUES(8,74);
INSERT INTO "role_permissions" VALUES(8,75);
INSERT INTO "role_permissions" VALUES(8,76);
INSERT INTO "role_permissions" VALUES(8,77);
INSERT INTO "role_permissions" VALUES(8,78);
INSERT INTO "role_permissions" VALUES(8,79);
INSERT INTO "role_permissions" VALUES(8,80);
INSERT INTO "role_permissions" VALUES(8,81);
INSERT INTO "role_permissions" VALUES(8,82);
INSERT INTO "role_permissions" VALUES(8,83);
INSERT INTO "role_permissions" VALUES(8,84);
INSERT INTO "role_permissions" VALUES(8,85);
INSERT INTO "role_permissions" VALUES(8,86);
INSERT INTO "role_permissions" VALUES(8,87);
INSERT INTO "role_permissions" VALUES(8,88);
INSERT INTO "role_permissions" VALUES(8,89);
INSERT INTO "role_permissions" VALUES(8,90);
INSERT INTO "role_permissions" VALUES(8,91);
INSERT INTO "role_permissions" VALUES(8,92);
INSERT INTO "role_permissions" VALUES(8,93);
INSERT INTO "role_permissions" VALUES(8,94);
INSERT INTO "role_permissions" VALUES(8,95);
INSERT INTO "role_permissions" VALUES(8,96);
INSERT INTO "role_permissions" VALUES(8,97);
INSERT INTO "role_permissions" VALUES(8,98);
INSERT INTO "role_permissions" VALUES(8,99);
INSERT INTO "role_permissions" VALUES(8,100);
INSERT INTO "role_permissions" VALUES(8,101);
INSERT INTO "role_permissions" VALUES(8,102);
INSERT INTO "role_permissions" VALUES(8,103);
INSERT INTO "role_permissions" VALUES(8,104);
INSERT INTO "role_permissions" VALUES(8,105);
INSERT INTO "role_permissions" VALUES(8,106);
INSERT INTO "role_permissions" VALUES(8,107);
INSERT INTO "role_permissions" VALUES(8,108);
INSERT INTO "role_permissions" VALUES(8,109);
INSERT INTO "role_permissions" VALUES(8,110);
INSERT INTO "role_permissions" VALUES(8,111);
INSERT INTO "role_permissions" VALUES(8,112);
INSERT INTO "role_permissions" VALUES(8,113);
INSERT INTO "role_permissions" VALUES(8,114);
INSERT INTO "role_permissions" VALUES(8,115);
INSERT INTO "role_permissions" VALUES(8,116);
INSERT INTO "role_permissions" VALUES(8,117);
INSERT INTO "role_permissions" VALUES(8,118);
INSERT INTO "role_permissions" VALUES(8,119);
INSERT INTO "role_permissions" VALUES(8,120);
INSERT INTO "role_permissions" VALUES(8,121);
INSERT INTO "role_permissions" VALUES(8,122);
INSERT INTO "role_permissions" VALUES(8,123);
INSERT INTO "role_permissions" VALUES(8,124);
INSERT INTO "role_permissions" VALUES(8,125);
INSERT INTO "role_permissions" VALUES(8,126);
INSERT INTO "role_permissions" VALUES(9,1);
INSERT INTO "role_permissions" VALUES(9,2);
INSERT INTO "role_permissions" VALUES(9,3);
INSERT INTO "role_permissions" VALUES(9,4);
INSERT INTO "role_permissions" VALUES(9,5);
INSERT INTO "role_permissions" VALUES(9,6);
INSERT INTO "role_permissions" VALUES(9,7);
INSERT INTO "role_permissions" VALUES(9,8);
INSERT INTO "role_permissions" VALUES(9,9);
INSERT INTO "role_permissions" VALUES(9,10);
INSERT INTO "role_permissions" VALUES(9,11);
INSERT INTO "role_permissions" VALUES(9,12);
INSERT INTO "role_permissions" VALUES(9,13);
INSERT INTO "role_permissions" VALUES(9,14);
INSERT INTO "role_permissions" VALUES(9,15);
INSERT INTO "role_permissions" VALUES(9,16);
INSERT INTO "role_permissions" VALUES(9,17);
INSERT INTO "role_permissions" VALUES(9,18);
INSERT INTO "role_permissions" VALUES(9,19);
INSERT INTO "role_permissions" VALUES(9,20);
INSERT INTO "role_permissions" VALUES(9,21);
INSERT INTO "role_permissions" VALUES(9,22);
INSERT INTO "role_permissions" VALUES(9,23);
INSERT INTO "role_permissions" VALUES(9,24);
INSERT INTO "role_permissions" VALUES(9,25);
INSERT INTO "role_permissions" VALUES(9,26);
INSERT INTO "role_permissions" VALUES(9,27);
INSERT INTO "role_permissions" VALUES(9,28);
INSERT INTO "role_permissions" VALUES(9,29);
INSERT INTO "role_permissions" VALUES(9,30);
INSERT INTO "role_permissions" VALUES(9,31);
INSERT INTO "role_permissions" VALUES(9,32);
INSERT INTO "role_permissions" VALUES(9,33);
INSERT INTO "role_permissions" VALUES(9,34);
INSERT INTO "role_permissions" VALUES(9,35);
INSERT INTO "role_permissions" VALUES(9,36);
INSERT INTO "role_permissions" VALUES(9,37);
INSERT INTO "role_permissions" VALUES(9,38);
INSERT INTO "role_permissions" VALUES(9,39);
INSERT INTO "role_permissions" VALUES(9,40);
INSERT INTO "role_permissions" VALUES(9,41);
INSERT INTO "role_permissions" VALUES(9,42);
INSERT INTO "role_permissions" VALUES(9,43);
INSERT INTO "role_permissions" VALUES(9,44);
INSERT INTO "role_permissions" VALUES(9,45);
INSERT INTO "role_permissions" VALUES(9,46);
INSERT INTO "role_permissions" VALUES(9,47);
INSERT INTO "role_permissions" VALUES(9,48);
INSERT INTO "role_permissions" VALUES(9,49);
INSERT INTO "role_permissions" VALUES(9,50);
INSERT INTO "role_permissions" VALUES(9,51);
INSERT INTO "role_permissions" VALUES(9,52);
INSERT INTO "role_permissions" VALUES(9,53);
INSERT INTO "role_permissions" VALUES(9,54);
INSERT INTO "role_permissions" VALUES(9,55);
INSERT INTO "role_permissions" VALUES(9,56);
INSERT INTO "role_permissions" VALUES(9,57);
INSERT INTO "role_permissions" VALUES(9,58);
INSERT INTO "role_permissions" VALUES(9,59);
INSERT INTO "role_permissions" VALUES(9,60);
INSERT INTO "role_permissions" VALUES(9,61);
INSERT INTO "role_permissions" VALUES(9,62);
INSERT INTO "role_permissions" VALUES(9,63);
INSERT INTO "role_permissions" VALUES(9,64);
INSERT INTO "role_permissions" VALUES(9,65);
INSERT INTO "role_permissions" VALUES(9,66);
INSERT INTO "role_permissions" VALUES(9,67);
INSERT INTO "role_permissions" VALUES(9,68);
INSERT INTO "role_permissions" VALUES(9,69);
INSERT INTO "role_permissions" VALUES(9,70);
INSERT INTO "role_permissions" VALUES(9,71);
INSERT INTO "role_permissions" VALUES(9,72);
INSERT INTO "role_permissions" VALUES(9,73);
INSERT INTO "role_permissions" VALUES(9,74);
INSERT INTO "role_permissions" VALUES(9,75);
INSERT INTO "role_permissions" VALUES(9,76);
INSERT INTO "role_permissions" VALUES(9,77);
INSERT INTO "role_permissions" VALUES(9,78);
INSERT INTO "role_permissions" VALUES(9,79);
INSERT INTO "role_permissions" VALUES(9,80);
INSERT INTO "role_permissions" VALUES(9,81);
INSERT INTO "role_permissions" VALUES(9,82);
INSERT INTO "role_permissions" VALUES(9,83);
INSERT INTO "role_permissions" VALUES(9,84);
INSERT INTO "role_permissions" VALUES(9,85);
INSERT INTO "role_permissions" VALUES(9,86);
INSERT INTO "role_permissions" VALUES(9,87);
INSERT INTO "role_permissions" VALUES(9,88);
INSERT INTO "role_permissions" VALUES(9,89);
INSERT INTO "role_permissions" VALUES(9,90);
INSERT INTO "role_permissions" VALUES(9,91);
INSERT INTO "role_permissions" VALUES(9,92);
INSERT INTO "role_permissions" VALUES(9,93);
INSERT INTO "role_permissions" VALUES(9,94);
INSERT INTO "role_permissions" VALUES(9,95);
INSERT INTO "role_permissions" VALUES(9,96);
INSERT INTO "role_permissions" VALUES(9,97);
INSERT INTO "role_permissions" VALUES(9,98);
INSERT INTO "role_permissions" VALUES(9,99);
INSERT INTO "role_permissions" VALUES(9,100);
INSERT INTO "role_permissions" VALUES(9,101);
INSERT INTO "role_permissions" VALUES(9,102);
INSERT INTO "role_permissions" VALUES(9,103);
INSERT INTO "role_permissions" VALUES(9,104);
INSERT INTO "role_permissions" VALUES(9,105);
INSERT INTO "role_permissions" VALUES(9,106);
INSERT INTO "role_permissions" VALUES(9,107);
INSERT INTO "role_permissions" VALUES(9,108);
INSERT INTO "role_permissions" VALUES(9,109);
INSERT INTO "role_permissions" VALUES(9,110);
INSERT INTO "role_permissions" VALUES(9,111);
INSERT INTO "role_permissions" VALUES(9,112);
INSERT INTO "role_permissions" VALUES(9,113);
INSERT INTO "role_permissions" VALUES(9,114);
INSERT INTO "role_permissions" VALUES(9,115);
INSERT INTO "role_permissions" VALUES(9,116);
INSERT INTO "role_permissions" VALUES(9,117);
INSERT INTO "role_permissions" VALUES(9,118);
INSERT INTO "role_permissions" VALUES(9,119);
INSERT INTO "role_permissions" VALUES(9,120);
INSERT INTO "role_permissions" VALUES(9,121);
INSERT INTO "role_permissions" VALUES(9,122);
INSERT INTO "role_permissions" VALUES(9,123);
INSERT INTO "role_permissions" VALUES(9,124);
INSERT INTO "role_permissions" VALUES(9,125);
INSERT INTO "role_permissions" VALUES(9,126);
INSERT INTO "role_permissions" VALUES(3,2);
INSERT INTO "role_permissions" VALUES(10,2);
INSERT INTO "role_permissions" VALUES(3,3);
INSERT INTO "role_permissions" VALUES(10,3);
INSERT INTO "role_permissions" VALUES(3,4);
INSERT INTO "role_permissions" VALUES(10,4);
INSERT INTO "role_permissions" VALUES(3,5);
INSERT INTO "role_permissions" VALUES(10,5);
INSERT INTO "role_permissions" VALUES(3,6);
INSERT INTO "role_permissions" VALUES(10,6);
INSERT INTO "role_permissions" VALUES(3,7);
INSERT INTO "role_permissions" VALUES(10,7);
INSERT INTO "role_permissions" VALUES(3,8);
INSERT INTO "role_permissions" VALUES(10,8);
INSERT INTO "role_permissions" VALUES(3,9);
INSERT INTO "role_permissions" VALUES(10,9);
INSERT INTO "role_permissions" VALUES(3,10);
INSERT INTO "role_permissions" VALUES(10,10);
INSERT INTO "role_permissions" VALUES(3,11);
INSERT INTO "role_permissions" VALUES(10,11);
INSERT INTO "role_permissions" VALUES(3,12);
INSERT INTO "role_permissions" VALUES(10,12);
INSERT INTO "role_permissions" VALUES(3,13);
INSERT INTO "role_permissions" VALUES(10,13);
INSERT INTO "role_permissions" VALUES(3,14);
INSERT INTO "role_permissions" VALUES(10,14);
INSERT INTO "role_permissions" VALUES(3,15);
INSERT INTO "role_permissions" VALUES(10,15);
INSERT INTO "role_permissions" VALUES(3,16);
INSERT INTO "role_permissions" VALUES(10,16);
INSERT INTO "role_permissions" VALUES(3,17);
INSERT INTO "role_permissions" VALUES(10,17);
INSERT INTO "role_permissions" VALUES(3,18);
INSERT INTO "role_permissions" VALUES(10,18);
INSERT INTO "role_permissions" VALUES(3,19);
INSERT INTO "role_permissions" VALUES(10,19);
INSERT INTO "role_permissions" VALUES(3,20);
INSERT INTO "role_permissions" VALUES(10,20);
INSERT INTO "role_permissions" VALUES(3,21);
INSERT INTO "role_permissions" VALUES(10,21);
INSERT INTO "role_permissions" VALUES(3,22);
INSERT INTO "role_permissions" VALUES(10,22);
INSERT INTO "role_permissions" VALUES(3,23);
INSERT INTO "role_permissions" VALUES(10,23);
INSERT INTO "role_permissions" VALUES(3,24);
INSERT INTO "role_permissions" VALUES(10,24);
INSERT INTO "role_permissions" VALUES(3,25);
INSERT INTO "role_permissions" VALUES(10,25);
INSERT INTO "role_permissions" VALUES(3,26);
INSERT INTO "role_permissions" VALUES(10,26);
INSERT INTO "role_permissions" VALUES(3,27);
INSERT INTO "role_permissions" VALUES(10,27);
INSERT INTO "role_permissions" VALUES(3,28);
INSERT INTO "role_permissions" VALUES(10,28);
INSERT INTO "role_permissions" VALUES(3,29);
INSERT INTO "role_permissions" VALUES(10,29);
INSERT INTO "role_permissions" VALUES(3,30);
INSERT INTO "role_permissions" VALUES(10,30);
INSERT INTO "role_permissions" VALUES(3,31);
INSERT INTO "role_permissions" VALUES(10,31);
INSERT INTO "role_permissions" VALUES(3,32);
INSERT INTO "role_permissions" VALUES(10,32);
INSERT INTO "role_permissions" VALUES(3,33);
INSERT INTO "role_permissions" VALUES(10,33);
INSERT INTO "role_permissions" VALUES(3,34);
INSERT INTO "role_permissions" VALUES(10,34);
INSERT INTO "role_permissions" VALUES(3,35);
INSERT INTO "role_permissions" VALUES(10,35);
INSERT INTO "role_permissions" VALUES(3,36);
INSERT INTO "role_permissions" VALUES(10,36);
INSERT INTO "role_permissions" VALUES(3,37);
INSERT INTO "role_permissions" VALUES(10,37);
INSERT INTO "role_permissions" VALUES(3,38);
INSERT INTO "role_permissions" VALUES(10,38);
INSERT INTO "role_permissions" VALUES(3,39);
INSERT INTO "role_permissions" VALUES(10,39);
INSERT INTO "role_permissions" VALUES(3,40);
INSERT INTO "role_permissions" VALUES(10,40);
INSERT INTO "role_permissions" VALUES(3,41);
INSERT INTO "role_permissions" VALUES(10,41);
INSERT INTO "role_permissions" VALUES(3,42);
INSERT INTO "role_permissions" VALUES(10,42);
INSERT INTO "role_permissions" VALUES(3,43);
INSERT INTO "role_permissions" VALUES(10,43);
INSERT INTO "role_permissions" VALUES(3,44);
INSERT INTO "role_permissions" VALUES(10,44);
INSERT INTO "role_permissions" VALUES(3,45);
INSERT INTO "role_permissions" VALUES(10,45);
INSERT INTO "role_permissions" VALUES(3,46);
INSERT INTO "role_permissions" VALUES(10,46);
INSERT INTO "role_permissions" VALUES(3,47);
INSERT INTO "role_permissions" VALUES(10,47);
INSERT INTO "role_permissions" VALUES(3,48);
INSERT INTO "role_permissions" VALUES(10,48);
INSERT INTO "role_permissions" VALUES(3,49);
INSERT INTO "role_permissions" VALUES(10,49);
INSERT INTO "role_permissions" VALUES(3,50);
INSERT INTO "role_permissions" VALUES(10,50);
INSERT INTO "role_permissions" VALUES(3,51);
INSERT INTO "role_permissions" VALUES(10,51);
INSERT INTO "role_permissions" VALUES(3,52);
INSERT INTO "role_permissions" VALUES(10,52);
INSERT INTO "role_permissions" VALUES(3,53);
INSERT INTO "role_permissions" VALUES(10,53);
INSERT INTO "role_permissions" VALUES(3,54);
INSERT INTO "role_permissions" VALUES(10,54);
INSERT INTO "role_permissions" VALUES(3,55);
INSERT INTO "role_permissions" VALUES(10,55);
INSERT INTO "role_permissions" VALUES(3,56);
INSERT INTO "role_permissions" VALUES(10,56);
INSERT INTO "role_permissions" VALUES(3,57);
INSERT INTO "role_permissions" VALUES(10,57);
INSERT INTO "role_permissions" VALUES(3,58);
INSERT INTO "role_permissions" VALUES(10,58);
INSERT INTO "role_permissions" VALUES(3,59);
INSERT INTO "role_permissions" VALUES(10,59);
INSERT INTO "role_permissions" VALUES(3,60);
INSERT INTO "role_permissions" VALUES(10,60);
INSERT INTO "role_permissions" VALUES(3,61);
INSERT INTO "role_permissions" VALUES(10,61);
INSERT INTO "role_permissions" VALUES(3,62);
INSERT INTO "role_permissions" VALUES(10,62);
INSERT INTO "role_permissions" VALUES(3,63);
INSERT INTO "role_permissions" VALUES(10,63);
INSERT INTO "role_permissions" VALUES(3,65);
INSERT INTO "role_permissions" VALUES(10,65);
INSERT INTO "role_permissions" VALUES(3,66);
INSERT INTO "role_permissions" VALUES(10,66);
INSERT INTO "role_permissions" VALUES(3,67);
INSERT INTO "role_permissions" VALUES(10,67);
INSERT INTO "role_permissions" VALUES(3,68);
INSERT INTO "role_permissions" VALUES(10,68);
INSERT INTO "role_permissions" VALUES(3,69);
INSERT INTO "role_permissions" VALUES(10,69);
INSERT INTO "role_permissions" VALUES(3,70);
INSERT INTO "role_permissions" VALUES(10,70);
INSERT INTO "role_permissions" VALUES(3,71);
INSERT INTO "role_permissions" VALUES(10,71);
INSERT INTO "role_permissions" VALUES(3,72);
INSERT INTO "role_permissions" VALUES(10,72);
INSERT INTO "role_permissions" VALUES(3,73);
INSERT INTO "role_permissions" VALUES(10,73);
INSERT INTO "role_permissions" VALUES(3,74);
INSERT INTO "role_permissions" VALUES(10,74);
INSERT INTO "role_permissions" VALUES(3,75);
INSERT INTO "role_permissions" VALUES(10,75);
INSERT INTO "role_permissions" VALUES(3,76);
INSERT INTO "role_permissions" VALUES(10,76);
INSERT INTO "role_permissions" VALUES(3,77);
INSERT INTO "role_permissions" VALUES(10,77);
INSERT INTO "role_permissions" VALUES(3,78);
INSERT INTO "role_permissions" VALUES(10,78);
INSERT INTO "role_permissions" VALUES(3,79);
INSERT INTO "role_permissions" VALUES(10,79);
INSERT INTO "role_permissions" VALUES(3,80);
INSERT INTO "role_permissions" VALUES(10,80);
INSERT INTO "role_permissions" VALUES(3,81);
INSERT INTO "role_permissions" VALUES(10,81);
INSERT INTO "role_permissions" VALUES(3,82);
INSERT INTO "role_permissions" VALUES(10,82);
INSERT INTO "role_permissions" VALUES(3,83);
INSERT INTO "role_permissions" VALUES(10,83);
INSERT INTO "role_permissions" VALUES(3,84);
INSERT INTO "role_permissions" VALUES(10,84);
INSERT INTO "role_permissions" VALUES(3,85);
INSERT INTO "role_permissions" VALUES(10,85);
INSERT INTO "role_permissions" VALUES(3,86);
INSERT INTO "role_permissions" VALUES(10,86);
INSERT INTO "role_permissions" VALUES(3,87);
INSERT INTO "role_permissions" VALUES(10,87);
INSERT INTO "role_permissions" VALUES(3,88);
INSERT INTO "role_permissions" VALUES(10,88);
INSERT INTO "role_permissions" VALUES(3,89);
INSERT INTO "role_permissions" VALUES(10,89);
INSERT INTO "role_permissions" VALUES(3,90);
INSERT INTO "role_permissions" VALUES(10,90);
INSERT INTO "role_permissions" VALUES(3,91);
INSERT INTO "role_permissions" VALUES(10,91);
INSERT INTO "role_permissions" VALUES(3,92);
INSERT INTO "role_permissions" VALUES(10,92);
INSERT INTO "role_permissions" VALUES(3,93);
INSERT INTO "role_permissions" VALUES(10,93);
INSERT INTO "role_permissions" VALUES(3,94);
INSERT INTO "role_permissions" VALUES(10,94);
INSERT INTO "role_permissions" VALUES(3,95);
INSERT INTO "role_permissions" VALUES(10,95);
INSERT INTO "role_permissions" VALUES(3,96);
INSERT INTO "role_permissions" VALUES(10,96);
INSERT INTO "role_permissions" VALUES(3,97);
INSERT INTO "role_permissions" VALUES(10,97);
INSERT INTO "role_permissions" VALUES(3,98);
INSERT INTO "role_permissions" VALUES(10,98);
INSERT INTO "role_permissions" VALUES(3,99);
INSERT INTO "role_permissions" VALUES(10,99);
INSERT INTO "role_permissions" VALUES(3,100);
INSERT INTO "role_permissions" VALUES(10,100);
INSERT INTO "role_permissions" VALUES(3,101);
INSERT INTO "role_permissions" VALUES(10,101);
INSERT INTO "role_permissions" VALUES(3,102);
INSERT INTO "role_permissions" VALUES(10,102);
INSERT INTO "role_permissions" VALUES(3,103);
INSERT INTO "role_permissions" VALUES(10,103);
INSERT INTO "role_permissions" VALUES(3,104);
INSERT INTO "role_permissions" VALUES(10,104);
INSERT INTO "role_permissions" VALUES(3,105);
INSERT INTO "role_permissions" VALUES(10,105);
INSERT INTO "role_permissions" VALUES(3,106);
INSERT INTO "role_permissions" VALUES(10,106);
INSERT INTO "role_permissions" VALUES(3,107);
INSERT INTO "role_permissions" VALUES(10,107);
INSERT INTO "role_permissions" VALUES(3,108);
INSERT INTO "role_permissions" VALUES(10,108);
INSERT INTO "role_permissions" VALUES(3,109);
INSERT INTO "role_permissions" VALUES(10,109);
INSERT INTO "role_permissions" VALUES(3,110);
INSERT INTO "role_permissions" VALUES(10,110);
INSERT INTO "role_permissions" VALUES(3,111);
INSERT INTO "role_permissions" VALUES(10,111);
INSERT INTO "role_permissions" VALUES(3,112);
INSERT INTO "role_permissions" VALUES(10,112);
INSERT INTO "role_permissions" VALUES(3,113);
INSERT INTO "role_permissions" VALUES(10,113);
INSERT INTO "role_permissions" VALUES(3,114);
INSERT INTO "role_permissions" VALUES(10,114);
INSERT INTO "role_permissions" VALUES(3,115);
INSERT INTO "role_permissions" VALUES(10,115);
INSERT INTO "role_permissions" VALUES(3,116);
INSERT INTO "role_permissions" VALUES(10,116);
INSERT INTO "role_permissions" VALUES(3,117);
INSERT INTO "role_permissions" VALUES(10,117);
INSERT INTO "role_permissions" VALUES(3,118);
INSERT INTO "role_permissions" VALUES(10,118);
INSERT INTO "role_permissions" VALUES(3,119);
INSERT INTO "role_permissions" VALUES(10,119);
INSERT INTO "role_permissions" VALUES(3,120);
INSERT INTO "role_permissions" VALUES(10,120);
INSERT INTO "role_permissions" VALUES(3,121);
INSERT INTO "role_permissions" VALUES(10,121);
INSERT INTO "role_permissions" VALUES(3,122);
INSERT INTO "role_permissions" VALUES(10,122);
INSERT INTO "role_permissions" VALUES(3,123);
INSERT INTO "role_permissions" VALUES(10,123);
INSERT INTO "role_permissions" VALUES(3,124);
INSERT INTO "role_permissions" VALUES(10,124);
INSERT INTO "role_permissions" VALUES(3,125);
INSERT INTO "role_permissions" VALUES(10,125);
INSERT INTO "role_permissions" VALUES(3,126);
INSERT INTO "role_permissions" VALUES(10,126);
INSERT INTO "role_permissions" VALUES(1,1);
INSERT INTO "role_permissions" VALUES(1,2);
INSERT INTO "role_permissions" VALUES(1,3);
INSERT INTO "role_permissions" VALUES(1,4);
INSERT INTO "role_permissions" VALUES(1,5);
INSERT INTO "role_permissions" VALUES(1,6);
INSERT INTO "role_permissions" VALUES(1,7);
INSERT INTO "role_permissions" VALUES(1,8);
INSERT INTO "role_permissions" VALUES(1,9);
INSERT INTO "role_permissions" VALUES(1,10);
INSERT INTO "role_permissions" VALUES(1,11);
INSERT INTO "role_permissions" VALUES(1,12);
INSERT INTO "role_permissions" VALUES(1,13);
INSERT INTO "role_permissions" VALUES(1,14);
INSERT INTO "role_permissions" VALUES(1,15);
INSERT INTO "role_permissions" VALUES(1,16);
INSERT INTO "role_permissions" VALUES(1,17);
INSERT INTO "role_permissions" VALUES(1,18);
INSERT INTO "role_permissions" VALUES(1,19);
INSERT INTO "role_permissions" VALUES(1,20);
INSERT INTO "role_permissions" VALUES(1,21);
INSERT INTO "role_permissions" VALUES(1,22);
INSERT INTO "role_permissions" VALUES(1,23);
INSERT INTO "role_permissions" VALUES(1,24);
INSERT INTO "role_permissions" VALUES(1,25);
INSERT INTO "role_permissions" VALUES(1,26);
INSERT INTO "role_permissions" VALUES(1,27);
INSERT INTO "role_permissions" VALUES(1,28);
INSERT INTO "role_permissions" VALUES(1,29);
INSERT INTO "role_permissions" VALUES(1,30);
INSERT INTO "role_permissions" VALUES(1,31);
INSERT INTO "role_permissions" VALUES(1,32);
INSERT INTO "role_permissions" VALUES(1,33);
INSERT INTO "role_permissions" VALUES(1,34);
INSERT INTO "role_permissions" VALUES(1,35);
INSERT INTO "role_permissions" VALUES(1,36);
INSERT INTO "role_permissions" VALUES(1,37);
INSERT INTO "role_permissions" VALUES(1,38);
INSERT INTO "role_permissions" VALUES(1,39);
INSERT INTO "role_permissions" VALUES(1,40);
INSERT INTO "role_permissions" VALUES(1,41);
INSERT INTO "role_permissions" VALUES(1,42);
INSERT INTO "role_permissions" VALUES(1,43);
INSERT INTO "role_permissions" VALUES(1,44);
INSERT INTO "role_permissions" VALUES(1,45);
INSERT INTO "role_permissions" VALUES(1,46);
INSERT INTO "role_permissions" VALUES(1,47);
INSERT INTO "role_permissions" VALUES(1,48);
INSERT INTO "role_permissions" VALUES(1,49);
INSERT INTO "role_permissions" VALUES(1,50);
INSERT INTO "role_permissions" VALUES(1,51);
INSERT INTO "role_permissions" VALUES(1,52);
INSERT INTO "role_permissions" VALUES(1,53);
INSERT INTO "role_permissions" VALUES(1,54);
INSERT INTO "role_permissions" VALUES(1,55);
INSERT INTO "role_permissions" VALUES(1,56);
INSERT INTO "role_permissions" VALUES(1,57);
INSERT INTO "role_permissions" VALUES(1,58);
INSERT INTO "role_permissions" VALUES(1,59);
INSERT INTO "role_permissions" VALUES(1,60);
INSERT INTO "role_permissions" VALUES(1,61);
INSERT INTO "role_permissions" VALUES(1,62);
INSERT INTO "role_permissions" VALUES(1,63);
INSERT INTO "role_permissions" VALUES(1,64);
INSERT INTO "role_permissions" VALUES(1,65);
INSERT INTO "role_permissions" VALUES(1,66);
INSERT INTO "role_permissions" VALUES(1,67);
INSERT INTO "role_permissions" VALUES(1,68);
INSERT INTO "role_permissions" VALUES(1,69);
INSERT INTO "role_permissions" VALUES(1,70);
INSERT INTO "role_permissions" VALUES(1,71);
INSERT INTO "role_permissions" VALUES(1,72);
INSERT INTO "role_permissions" VALUES(1,73);
INSERT INTO "role_permissions" VALUES(1,74);
INSERT INTO "role_permissions" VALUES(1,75);
INSERT INTO "role_permissions" VALUES(1,76);
INSERT INTO "role_permissions" VALUES(1,77);
INSERT INTO "role_permissions" VALUES(1,78);
INSERT INTO "role_permissions" VALUES(1,79);
INSERT INTO "role_permissions" VALUES(1,80);
INSERT INTO "role_permissions" VALUES(1,81);
INSERT INTO "role_permissions" VALUES(1,82);
INSERT INTO "role_permissions" VALUES(1,83);
INSERT INTO "role_permissions" VALUES(1,84);
INSERT INTO "role_permissions" VALUES(1,85);
INSERT INTO "role_permissions" VALUES(1,86);
INSERT INTO "role_permissions" VALUES(1,87);
INSERT INTO "role_permissions" VALUES(1,88);
INSERT INTO "role_permissions" VALUES(1,89);
INSERT INTO "role_permissions" VALUES(1,90);
INSERT INTO "role_permissions" VALUES(1,91);
INSERT INTO "role_permissions" VALUES(1,92);
INSERT INTO "role_permissions" VALUES(1,93);
INSERT INTO "role_permissions" VALUES(1,94);
INSERT INTO "role_permissions" VALUES(1,95);
INSERT INTO "role_permissions" VALUES(1,96);
INSERT INTO "role_permissions" VALUES(1,97);
INSERT INTO "role_permissions" VALUES(1,98);
INSERT INTO "role_permissions" VALUES(1,99);
INSERT INTO "role_permissions" VALUES(1,100);
INSERT INTO "role_permissions" VALUES(1,101);
INSERT INTO "role_permissions" VALUES(1,102);
INSERT INTO "role_permissions" VALUES(1,103);
INSERT INTO "role_permissions" VALUES(1,104);
INSERT INTO "role_permissions" VALUES(1,105);
INSERT INTO "role_permissions" VALUES(1,106);
INSERT INTO "role_permissions" VALUES(1,107);
INSERT INTO "role_permissions" VALUES(1,108);
INSERT INTO "role_permissions" VALUES(1,109);
INSERT INTO "role_permissions" VALUES(1,110);
INSERT INTO "role_permissions" VALUES(1,111);
INSERT INTO "role_permissions" VALUES(1,112);
INSERT INTO "role_permissions" VALUES(1,113);
INSERT INTO "role_permissions" VALUES(1,114);
INSERT INTO "role_permissions" VALUES(1,115);
INSERT INTO "role_permissions" VALUES(1,116);
INSERT INTO "role_permissions" VALUES(1,117);
INSERT INTO "role_permissions" VALUES(1,118);
INSERT INTO "role_permissions" VALUES(1,119);
INSERT INTO "role_permissions" VALUES(1,120);
INSERT INTO "role_permissions" VALUES(1,121);
INSERT INTO "role_permissions" VALUES(1,122);
INSERT INTO "role_permissions" VALUES(1,123);
INSERT INTO "role_permissions" VALUES(1,124);
INSERT INTO "role_permissions" VALUES(1,125);
INSERT INTO "role_permissions" VALUES(1,126);
INSERT INTO "role_permissions" VALUES(1,127);
INSERT INTO "role_permissions" VALUES(1,128);
INSERT INTO "role_permissions" VALUES(1,129);
INSERT INTO "role_permissions" VALUES(1,130);
INSERT INTO "role_permissions" VALUES(1,131);
INSERT INTO "role_permissions" VALUES(1,132);
INSERT INTO "role_permissions" VALUES(1,133);
INSERT INTO "role_permissions" VALUES(1,134);
INSERT INTO "role_permissions" VALUES(1,135);
INSERT INTO "role_permissions" VALUES(1,136);
INSERT INTO "role_permissions" VALUES(1,137);
INSERT INTO "role_permissions" VALUES(1,138);
INSERT INTO "role_permissions" VALUES(1,139);
INSERT INTO "role_permissions" VALUES(1,140);
INSERT INTO "role_permissions" VALUES(1,141);
INSERT INTO "role_permissions" VALUES(1,142);
INSERT INTO "role_permissions" VALUES(1,143);
INSERT INTO "role_permissions" VALUES(1,144);
INSERT INTO "role_permissions" VALUES(1,145);
INSERT INTO "role_permissions" VALUES(1,146);
INSERT INTO "role_permissions" VALUES(1,147);
INSERT INTO "role_permissions" VALUES(1,148);
INSERT INTO "role_permissions" VALUES(1,149);
INSERT INTO "role_permissions" VALUES(1,150);
INSERT INTO "role_permissions" VALUES(1,151);
INSERT INTO "role_permissions" VALUES(1,152);
INSERT INTO "role_permissions" VALUES(1,153);
INSERT INTO "role_permissions" VALUES(1,154);
INSERT INTO "role_permissions" VALUES(1,155);
INSERT INTO "role_permissions" VALUES(1,156);
INSERT INTO "role_permissions" VALUES(1,157);
INSERT INTO "role_permissions" VALUES(1,158);
INSERT INTO "role_permissions" VALUES(1,159);
INSERT INTO "role_permissions" VALUES(1,160);
INSERT INTO "role_permissions" VALUES(1,161);
INSERT INTO "role_permissions" VALUES(1,162);
INSERT INTO "role_permissions" VALUES(1,163);
INSERT INTO "role_permissions" VALUES(1,164);
INSERT INTO "role_permissions" VALUES(1,165);
INSERT INTO "role_permissions" VALUES(1,166);
INSERT INTO "role_permissions" VALUES(1,167);
INSERT INTO "role_permissions" VALUES(1,168);
INSERT INTO "role_permissions" VALUES(1,169);
INSERT INTO "role_permissions" VALUES(1,170);
INSERT INTO "role_permissions" VALUES(1,171);
INSERT INTO "role_permissions" VALUES(1,172);
INSERT INTO "role_permissions" VALUES(1,173);
INSERT INTO "role_permissions" VALUES(1,174);
INSERT INTO "role_permissions" VALUES(1,175);
INSERT INTO "role_permissions" VALUES(1,176);
INSERT INTO "role_permissions" VALUES(1,177);
INSERT INTO "role_permissions" VALUES(1,178);
INSERT INTO "role_permissions" VALUES(1,179);
INSERT INTO "role_permissions" VALUES(1,180);
INSERT INTO "role_permissions" VALUES(1,181);
INSERT INTO "role_permissions" VALUES(1,182);
INSERT INTO "role_permissions" VALUES(1,183);
INSERT INTO "role_permissions" VALUES(1,184);
INSERT INTO "role_permissions" VALUES(1,185);
INSERT INTO "role_permissions" VALUES(1,186);
INSERT INTO "role_permissions" VALUES(1,187);
INSERT INTO "role_permissions" VALUES(1,188);
INSERT INTO "role_permissions" VALUES(1,189);
INSERT INTO "role_permissions" VALUES(2,1);
INSERT INTO "role_permissions" VALUES(2,2);
INSERT INTO "role_permissions" VALUES(2,3);
INSERT INTO "role_permissions" VALUES(2,4);
INSERT INTO "role_permissions" VALUES(2,5);
INSERT INTO "role_permissions" VALUES(2,6);
INSERT INTO "role_permissions" VALUES(2,7);
INSERT INTO "role_permissions" VALUES(2,8);
INSERT INTO "role_permissions" VALUES(2,9);
INSERT INTO "role_permissions" VALUES(2,10);
INSERT INTO "role_permissions" VALUES(2,11);
INSERT INTO "role_permissions" VALUES(2,12);
INSERT INTO "role_permissions" VALUES(2,13);
INSERT INTO "role_permissions" VALUES(2,14);
INSERT INTO "role_permissions" VALUES(2,15);
INSERT INTO "role_permissions" VALUES(2,16);
INSERT INTO "role_permissions" VALUES(2,17);
INSERT INTO "role_permissions" VALUES(2,18);
INSERT INTO "role_permissions" VALUES(2,19);
INSERT INTO "role_permissions" VALUES(2,20);
INSERT INTO "role_permissions" VALUES(2,21);
INSERT INTO "role_permissions" VALUES(2,22);
INSERT INTO "role_permissions" VALUES(2,23);
INSERT INTO "role_permissions" VALUES(2,24);
INSERT INTO "role_permissions" VALUES(2,25);
INSERT INTO "role_permissions" VALUES(2,26);
INSERT INTO "role_permissions" VALUES(2,27);
INSERT INTO "role_permissions" VALUES(2,28);
INSERT INTO "role_permissions" VALUES(2,29);
INSERT INTO "role_permissions" VALUES(2,30);
INSERT INTO "role_permissions" VALUES(2,31);
INSERT INTO "role_permissions" VALUES(2,32);
INSERT INTO "role_permissions" VALUES(2,33);
INSERT INTO "role_permissions" VALUES(2,34);
INSERT INTO "role_permissions" VALUES(2,35);
INSERT INTO "role_permissions" VALUES(2,36);
INSERT INTO "role_permissions" VALUES(2,37);
INSERT INTO "role_permissions" VALUES(2,38);
INSERT INTO "role_permissions" VALUES(2,39);
INSERT INTO "role_permissions" VALUES(2,40);
INSERT INTO "role_permissions" VALUES(2,41);
INSERT INTO "role_permissions" VALUES(2,42);
INSERT INTO "role_permissions" VALUES(2,43);
INSERT INTO "role_permissions" VALUES(2,44);
INSERT INTO "role_permissions" VALUES(2,45);
INSERT INTO "role_permissions" VALUES(2,46);
INSERT INTO "role_permissions" VALUES(2,47);
INSERT INTO "role_permissions" VALUES(2,48);
INSERT INTO "role_permissions" VALUES(2,49);
INSERT INTO "role_permissions" VALUES(2,50);
INSERT INTO "role_permissions" VALUES(2,51);
INSERT INTO "role_permissions" VALUES(2,52);
INSERT INTO "role_permissions" VALUES(2,53);
INSERT INTO "role_permissions" VALUES(2,54);
INSERT INTO "role_permissions" VALUES(2,55);
INSERT INTO "role_permissions" VALUES(2,56);
INSERT INTO "role_permissions" VALUES(2,57);
INSERT INTO "role_permissions" VALUES(2,58);
INSERT INTO "role_permissions" VALUES(2,59);
INSERT INTO "role_permissions" VALUES(2,60);
INSERT INTO "role_permissions" VALUES(2,61);
INSERT INTO "role_permissions" VALUES(2,62);
INSERT INTO "role_permissions" VALUES(2,63);
INSERT INTO "role_permissions" VALUES(2,64);
INSERT INTO "role_permissions" VALUES(2,65);
INSERT INTO "role_permissions" VALUES(2,66);
INSERT INTO "role_permissions" VALUES(2,67);
INSERT INTO "role_permissions" VALUES(2,68);
INSERT INTO "role_permissions" VALUES(2,69);
INSERT INTO "role_permissions" VALUES(2,70);
INSERT INTO "role_permissions" VALUES(2,71);
INSERT INTO "role_permissions" VALUES(2,72);
INSERT INTO "role_permissions" VALUES(2,73);
INSERT INTO "role_permissions" VALUES(2,74);
INSERT INTO "role_permissions" VALUES(2,75);
INSERT INTO "role_permissions" VALUES(2,76);
INSERT INTO "role_permissions" VALUES(2,77);
INSERT INTO "role_permissions" VALUES(2,78);
INSERT INTO "role_permissions" VALUES(2,79);
INSERT INTO "role_permissions" VALUES(2,80);
INSERT INTO "role_permissions" VALUES(2,81);
INSERT INTO "role_permissions" VALUES(2,82);
INSERT INTO "role_permissions" VALUES(2,83);
INSERT INTO "role_permissions" VALUES(2,84);
INSERT INTO "role_permissions" VALUES(2,85);
INSERT INTO "role_permissions" VALUES(2,86);
INSERT INTO "role_permissions" VALUES(2,87);
INSERT INTO "role_permissions" VALUES(2,88);
INSERT INTO "role_permissions" VALUES(2,89);
INSERT INTO "role_permissions" VALUES(2,90);
INSERT INTO "role_permissions" VALUES(2,91);
INSERT INTO "role_permissions" VALUES(2,92);
INSERT INTO "role_permissions" VALUES(2,93);
INSERT INTO "role_permissions" VALUES(2,94);
INSERT INTO "role_permissions" VALUES(2,95);
INSERT INTO "role_permissions" VALUES(2,96);
INSERT INTO "role_permissions" VALUES(2,97);
INSERT INTO "role_permissions" VALUES(2,98);
INSERT INTO "role_permissions" VALUES(2,99);
INSERT INTO "role_permissions" VALUES(2,100);
INSERT INTO "role_permissions" VALUES(2,101);
INSERT INTO "role_permissions" VALUES(2,102);
INSERT INTO "role_permissions" VALUES(2,103);
INSERT INTO "role_permissions" VALUES(2,104);
INSERT INTO "role_permissions" VALUES(2,105);
INSERT INTO "role_permissions" VALUES(2,106);
INSERT INTO "role_permissions" VALUES(2,107);
INSERT INTO "role_permissions" VALUES(2,108);
INSERT INTO "role_permissions" VALUES(2,109);
INSERT INTO "role_permissions" VALUES(2,110);
INSERT INTO "role_permissions" VALUES(2,111);
INSERT INTO "role_permissions" VALUES(2,112);
INSERT INTO "role_permissions" VALUES(2,113);
INSERT INTO "role_permissions" VALUES(2,114);
INSERT INTO "role_permissions" VALUES(2,115);
INSERT INTO "role_permissions" VALUES(2,116);
INSERT INTO "role_permissions" VALUES(2,117);
INSERT INTO "role_permissions" VALUES(2,118);
INSERT INTO "role_permissions" VALUES(2,119);
INSERT INTO "role_permissions" VALUES(2,120);
INSERT INTO "role_permissions" VALUES(2,121);
INSERT INTO "role_permissions" VALUES(2,122);
INSERT INTO "role_permissions" VALUES(2,123);
INSERT INTO "role_permissions" VALUES(2,124);
INSERT INTO "role_permissions" VALUES(2,125);
INSERT INTO "role_permissions" VALUES(2,126);
INSERT INTO "role_permissions" VALUES(2,127);
INSERT INTO "role_permissions" VALUES(2,128);
INSERT INTO "role_permissions" VALUES(2,129);
INSERT INTO "role_permissions" VALUES(2,130);
INSERT INTO "role_permissions" VALUES(2,131);
INSERT INTO "role_permissions" VALUES(2,132);
INSERT INTO "role_permissions" VALUES(2,133);
INSERT INTO "role_permissions" VALUES(2,134);
INSERT INTO "role_permissions" VALUES(2,135);
INSERT INTO "role_permissions" VALUES(2,136);
INSERT INTO "role_permissions" VALUES(2,137);
INSERT INTO "role_permissions" VALUES(2,138);
INSERT INTO "role_permissions" VALUES(2,139);
INSERT INTO "role_permissions" VALUES(2,140);
INSERT INTO "role_permissions" VALUES(2,141);
INSERT INTO "role_permissions" VALUES(2,142);
INSERT INTO "role_permissions" VALUES(2,143);
INSERT INTO "role_permissions" VALUES(2,144);
INSERT INTO "role_permissions" VALUES(2,145);
INSERT INTO "role_permissions" VALUES(2,146);
INSERT INTO "role_permissions" VALUES(2,147);
INSERT INTO "role_permissions" VALUES(2,148);
INSERT INTO "role_permissions" VALUES(2,149);
INSERT INTO "role_permissions" VALUES(2,150);
INSERT INTO "role_permissions" VALUES(2,151);
INSERT INTO "role_permissions" VALUES(2,152);
INSERT INTO "role_permissions" VALUES(2,153);
INSERT INTO "role_permissions" VALUES(2,154);
INSERT INTO "role_permissions" VALUES(2,155);
INSERT INTO "role_permissions" VALUES(2,156);
INSERT INTO "role_permissions" VALUES(2,157);
INSERT INTO "role_permissions" VALUES(2,158);
INSERT INTO "role_permissions" VALUES(2,159);
INSERT INTO "role_permissions" VALUES(2,160);
INSERT INTO "role_permissions" VALUES(2,161);
INSERT INTO "role_permissions" VALUES(2,162);
INSERT INTO "role_permissions" VALUES(2,163);
INSERT INTO "role_permissions" VALUES(2,164);
INSERT INTO "role_permissions" VALUES(2,165);
INSERT INTO "role_permissions" VALUES(2,166);
INSERT INTO "role_permissions" VALUES(2,167);
INSERT INTO "role_permissions" VALUES(2,168);
INSERT INTO "role_permissions" VALUES(2,169);
INSERT INTO "role_permissions" VALUES(2,170);
INSERT INTO "role_permissions" VALUES(2,171);
INSERT INTO "role_permissions" VALUES(2,172);
INSERT INTO "role_permissions" VALUES(2,173);
INSERT INTO "role_permissions" VALUES(2,174);
INSERT INTO "role_permissions" VALUES(2,175);
INSERT INTO "role_permissions" VALUES(2,176);
INSERT INTO "role_permissions" VALUES(2,177);
INSERT INTO "role_permissions" VALUES(2,178);
INSERT INTO "role_permissions" VALUES(2,179);
INSERT INTO "role_permissions" VALUES(2,180);
INSERT INTO "role_permissions" VALUES(2,181);
INSERT INTO "role_permissions" VALUES(2,182);
INSERT INTO "role_permissions" VALUES(2,183);
INSERT INTO "role_permissions" VALUES(2,184);
INSERT INTO "role_permissions" VALUES(2,185);
INSERT INTO "role_permissions" VALUES(2,186);
INSERT INTO "role_permissions" VALUES(2,187);
INSERT INTO "role_permissions" VALUES(2,188);
INSERT INTO "role_permissions" VALUES(2,189);
INSERT INTO "role_permissions" VALUES(8,1);
INSERT INTO "role_permissions" VALUES(8,2);
INSERT INTO "role_permissions" VALUES(8,3);
INSERT INTO "role_permissions" VALUES(8,4);
INSERT INTO "role_permissions" VALUES(8,5);
INSERT INTO "role_permissions" VALUES(8,6);
INSERT INTO "role_permissions" VALUES(8,7);
INSERT INTO "role_permissions" VALUES(8,8);
INSERT INTO "role_permissions" VALUES(8,9);
INSERT INTO "role_permissions" VALUES(8,10);
INSERT INTO "role_permissions" VALUES(8,11);
INSERT INTO "role_permissions" VALUES(8,12);
INSERT INTO "role_permissions" VALUES(8,13);
INSERT INTO "role_permissions" VALUES(8,14);
INSERT INTO "role_permissions" VALUES(8,15);
INSERT INTO "role_permissions" VALUES(8,16);
INSERT INTO "role_permissions" VALUES(8,17);
INSERT INTO "role_permissions" VALUES(8,18);
INSERT INTO "role_permissions" VALUES(8,19);
INSERT INTO "role_permissions" VALUES(8,20);
INSERT INTO "role_permissions" VALUES(8,21);
INSERT INTO "role_permissions" VALUES(8,22);
INSERT INTO "role_permissions" VALUES(8,23);
INSERT INTO "role_permissions" VALUES(8,24);
INSERT INTO "role_permissions" VALUES(8,25);
INSERT INTO "role_permissions" VALUES(8,26);
INSERT INTO "role_permissions" VALUES(8,27);
INSERT INTO "role_permissions" VALUES(8,28);
INSERT INTO "role_permissions" VALUES(8,29);
INSERT INTO "role_permissions" VALUES(8,30);
INSERT INTO "role_permissions" VALUES(8,31);
INSERT INTO "role_permissions" VALUES(8,32);
INSERT INTO "role_permissions" VALUES(8,33);
INSERT INTO "role_permissions" VALUES(8,34);
INSERT INTO "role_permissions" VALUES(8,35);
INSERT INTO "role_permissions" VALUES(8,36);
INSERT INTO "role_permissions" VALUES(8,37);
INSERT INTO "role_permissions" VALUES(8,38);
INSERT INTO "role_permissions" VALUES(8,39);
INSERT INTO "role_permissions" VALUES(8,40);
INSERT INTO "role_permissions" VALUES(8,41);
INSERT INTO "role_permissions" VALUES(8,42);
INSERT INTO "role_permissions" VALUES(8,43);
INSERT INTO "role_permissions" VALUES(8,44);
INSERT INTO "role_permissions" VALUES(8,45);
INSERT INTO "role_permissions" VALUES(8,46);
INSERT INTO "role_permissions" VALUES(8,47);
INSERT INTO "role_permissions" VALUES(8,48);
INSERT INTO "role_permissions" VALUES(8,49);
INSERT INTO "role_permissions" VALUES(8,50);
INSERT INTO "role_permissions" VALUES(8,51);
INSERT INTO "role_permissions" VALUES(8,52);
INSERT INTO "role_permissions" VALUES(8,53);
INSERT INTO "role_permissions" VALUES(8,54);
INSERT INTO "role_permissions" VALUES(8,55);
INSERT INTO "role_permissions" VALUES(8,56);
INSERT INTO "role_permissions" VALUES(8,57);
INSERT INTO "role_permissions" VALUES(8,58);
INSERT INTO "role_permissions" VALUES(8,59);
INSERT INTO "role_permissions" VALUES(8,60);
INSERT INTO "role_permissions" VALUES(8,61);
INSERT INTO "role_permissions" VALUES(8,62);
INSERT INTO "role_permissions" VALUES(8,63);
INSERT INTO "role_permissions" VALUES(8,64);
INSERT INTO "role_permissions" VALUES(8,65);
INSERT INTO "role_permissions" VALUES(8,66);
INSERT INTO "role_permissions" VALUES(8,67);
INSERT INTO "role_permissions" VALUES(8,68);
INSERT INTO "role_permissions" VALUES(8,69);
INSERT INTO "role_permissions" VALUES(8,70);
INSERT INTO "role_permissions" VALUES(8,71);
INSERT INTO "role_permissions" VALUES(8,72);
INSERT INTO "role_permissions" VALUES(8,73);
INSERT INTO "role_permissions" VALUES(8,74);
INSERT INTO "role_permissions" VALUES(8,75);
INSERT INTO "role_permissions" VALUES(8,76);
INSERT INTO "role_permissions" VALUES(8,77);
INSERT INTO "role_permissions" VALUES(8,78);
INSERT INTO "role_permissions" VALUES(8,79);
INSERT INTO "role_permissions" VALUES(8,80);
INSERT INTO "role_permissions" VALUES(8,81);
INSERT INTO "role_permissions" VALUES(8,82);
INSERT INTO "role_permissions" VALUES(8,83);
INSERT INTO "role_permissions" VALUES(8,84);
INSERT INTO "role_permissions" VALUES(8,85);
INSERT INTO "role_permissions" VALUES(8,86);
INSERT INTO "role_permissions" VALUES(8,87);
INSERT INTO "role_permissions" VALUES(8,88);
INSERT INTO "role_permissions" VALUES(8,89);
INSERT INTO "role_permissions" VALUES(8,90);
INSERT INTO "role_permissions" VALUES(8,91);
INSERT INTO "role_permissions" VALUES(8,92);
INSERT INTO "role_permissions" VALUES(8,93);
INSERT INTO "role_permissions" VALUES(8,94);
INSERT INTO "role_permissions" VALUES(8,95);
INSERT INTO "role_permissions" VALUES(8,96);
INSERT INTO "role_permissions" VALUES(8,97);
INSERT INTO "role_permissions" VALUES(8,98);
INSERT INTO "role_permissions" VALUES(8,99);
INSERT INTO "role_permissions" VALUES(8,100);
INSERT INTO "role_permissions" VALUES(8,101);
INSERT INTO "role_permissions" VALUES(8,102);
INSERT INTO "role_permissions" VALUES(8,103);
INSERT INTO "role_permissions" VALUES(8,104);
INSERT INTO "role_permissions" VALUES(8,105);
INSERT INTO "role_permissions" VALUES(8,106);
INSERT INTO "role_permissions" VALUES(8,107);
INSERT INTO "role_permissions" VALUES(8,108);
INSERT INTO "role_permissions" VALUES(8,109);
INSERT INTO "role_permissions" VALUES(8,110);
INSERT INTO "role_permissions" VALUES(8,111);
INSERT INTO "role_permissions" VALUES(8,112);
INSERT INTO "role_permissions" VALUES(8,113);
INSERT INTO "role_permissions" VALUES(8,114);
INSERT INTO "role_permissions" VALUES(8,115);
INSERT INTO "role_permissions" VALUES(8,116);
INSERT INTO "role_permissions" VALUES(8,117);
INSERT INTO "role_permissions" VALUES(8,118);
INSERT INTO "role_permissions" VALUES(8,119);
INSERT INTO "role_permissions" VALUES(8,120);
INSERT INTO "role_permissions" VALUES(8,121);
INSERT INTO "role_permissions" VALUES(8,122);
INSERT INTO "role_permissions" VALUES(8,123);
INSERT INTO "role_permissions" VALUES(8,124);
INSERT INTO "role_permissions" VALUES(8,125);
INSERT INTO "role_permissions" VALUES(8,126);
INSERT INTO "role_permissions" VALUES(8,127);
INSERT INTO "role_permissions" VALUES(8,128);
INSERT INTO "role_permissions" VALUES(8,129);
INSERT INTO "role_permissions" VALUES(8,130);
INSERT INTO "role_permissions" VALUES(8,131);
INSERT INTO "role_permissions" VALUES(8,132);
INSERT INTO "role_permissions" VALUES(8,133);
INSERT INTO "role_permissions" VALUES(8,134);
INSERT INTO "role_permissions" VALUES(8,135);
INSERT INTO "role_permissions" VALUES(8,136);
INSERT INTO "role_permissions" VALUES(8,137);
INSERT INTO "role_permissions" VALUES(8,138);
INSERT INTO "role_permissions" VALUES(8,139);
INSERT INTO "role_permissions" VALUES(8,140);
INSERT INTO "role_permissions" VALUES(8,141);
INSERT INTO "role_permissions" VALUES(8,142);
INSERT INTO "role_permissions" VALUES(8,143);
INSERT INTO "role_permissions" VALUES(8,144);
INSERT INTO "role_permissions" VALUES(8,145);
INSERT INTO "role_permissions" VALUES(8,146);
INSERT INTO "role_permissions" VALUES(8,147);
INSERT INTO "role_permissions" VALUES(8,148);
INSERT INTO "role_permissions" VALUES(8,149);
INSERT INTO "role_permissions" VALUES(8,150);
INSERT INTO "role_permissions" VALUES(8,151);
INSERT INTO "role_permissions" VALUES(8,152);
INSERT INTO "role_permissions" VALUES(8,153);
INSERT INTO "role_permissions" VALUES(8,154);
INSERT INTO "role_permissions" VALUES(8,155);
INSERT INTO "role_permissions" VALUES(8,156);
INSERT INTO "role_permissions" VALUES(8,157);
INSERT INTO "role_permissions" VALUES(8,158);
INSERT INTO "role_permissions" VALUES(8,159);
INSERT INTO "role_permissions" VALUES(8,160);
INSERT INTO "role_permissions" VALUES(8,161);
INSERT INTO "role_permissions" VALUES(8,162);
INSERT INTO "role_permissions" VALUES(8,163);
INSERT INTO "role_permissions" VALUES(8,164);
INSERT INTO "role_permissions" VALUES(8,165);
INSERT INTO "role_permissions" VALUES(8,166);
INSERT INTO "role_permissions" VALUES(8,167);
INSERT INTO "role_permissions" VALUES(8,168);
INSERT INTO "role_permissions" VALUES(8,169);
INSERT INTO "role_permissions" VALUES(8,170);
INSERT INTO "role_permissions" VALUES(8,171);
INSERT INTO "role_permissions" VALUES(8,172);
INSERT INTO "role_permissions" VALUES(8,173);
INSERT INTO "role_permissions" VALUES(8,174);
INSERT INTO "role_permissions" VALUES(8,175);
INSERT INTO "role_permissions" VALUES(8,176);
INSERT INTO "role_permissions" VALUES(8,177);
INSERT INTO "role_permissions" VALUES(8,178);
INSERT INTO "role_permissions" VALUES(8,179);
INSERT INTO "role_permissions" VALUES(8,180);
INSERT INTO "role_permissions" VALUES(8,181);
INSERT INTO "role_permissions" VALUES(8,182);
INSERT INTO "role_permissions" VALUES(8,183);
INSERT INTO "role_permissions" VALUES(8,184);
INSERT INTO "role_permissions" VALUES(8,185);
INSERT INTO "role_permissions" VALUES(8,186);
INSERT INTO "role_permissions" VALUES(8,187);
INSERT INTO "role_permissions" VALUES(8,188);
INSERT INTO "role_permissions" VALUES(8,189);
INSERT INTO "role_permissions" VALUES(9,1);
INSERT INTO "role_permissions" VALUES(9,2);
INSERT INTO "role_permissions" VALUES(9,3);
INSERT INTO "role_permissions" VALUES(9,4);
INSERT INTO "role_permissions" VALUES(9,5);
INSERT INTO "role_permissions" VALUES(9,6);
INSERT INTO "role_permissions" VALUES(9,7);
INSERT INTO "role_permissions" VALUES(9,8);
INSERT INTO "role_permissions" VALUES(9,9);
INSERT INTO "role_permissions" VALUES(9,10);
INSERT INTO "role_permissions" VALUES(9,11);
INSERT INTO "role_permissions" VALUES(9,12);
INSERT INTO "role_permissions" VALUES(9,13);
INSERT INTO "role_permissions" VALUES(9,14);
INSERT INTO "role_permissions" VALUES(9,15);
INSERT INTO "role_permissions" VALUES(9,16);
INSERT INTO "role_permissions" VALUES(9,17);
INSERT INTO "role_permissions" VALUES(9,18);
INSERT INTO "role_permissions" VALUES(9,19);
INSERT INTO "role_permissions" VALUES(9,20);
INSERT INTO "role_permissions" VALUES(9,21);
INSERT INTO "role_permissions" VALUES(9,22);
INSERT INTO "role_permissions" VALUES(9,23);
INSERT INTO "role_permissions" VALUES(9,24);
INSERT INTO "role_permissions" VALUES(9,25);
INSERT INTO "role_permissions" VALUES(9,26);
INSERT INTO "role_permissions" VALUES(9,27);
INSERT INTO "role_permissions" VALUES(9,28);
INSERT INTO "role_permissions" VALUES(9,29);
INSERT INTO "role_permissions" VALUES(9,30);
INSERT INTO "role_permissions" VALUES(9,31);
INSERT INTO "role_permissions" VALUES(9,32);
INSERT INTO "role_permissions" VALUES(9,33);
INSERT INTO "role_permissions" VALUES(9,34);
INSERT INTO "role_permissions" VALUES(9,35);
INSERT INTO "role_permissions" VALUES(9,36);
INSERT INTO "role_permissions" VALUES(9,37);
INSERT INTO "role_permissions" VALUES(9,38);
INSERT INTO "role_permissions" VALUES(9,39);
INSERT INTO "role_permissions" VALUES(9,40);
INSERT INTO "role_permissions" VALUES(9,41);
INSERT INTO "role_permissions" VALUES(9,42);
INSERT INTO "role_permissions" VALUES(9,43);
INSERT INTO "role_permissions" VALUES(9,44);
INSERT INTO "role_permissions" VALUES(9,45);
INSERT INTO "role_permissions" VALUES(9,46);
INSERT INTO "role_permissions" VALUES(9,47);
INSERT INTO "role_permissions" VALUES(9,48);
INSERT INTO "role_permissions" VALUES(9,49);
INSERT INTO "role_permissions" VALUES(9,50);
INSERT INTO "role_permissions" VALUES(9,51);
INSERT INTO "role_permissions" VALUES(9,52);
INSERT INTO "role_permissions" VALUES(9,53);
INSERT INTO "role_permissions" VALUES(9,54);
INSERT INTO "role_permissions" VALUES(9,55);
INSERT INTO "role_permissions" VALUES(9,56);
INSERT INTO "role_permissions" VALUES(9,57);
INSERT INTO "role_permissions" VALUES(9,58);
INSERT INTO "role_permissions" VALUES(9,59);
INSERT INTO "role_permissions" VALUES(9,60);
INSERT INTO "role_permissions" VALUES(9,61);
INSERT INTO "role_permissions" VALUES(9,62);
INSERT INTO "role_permissions" VALUES(9,63);
INSERT INTO "role_permissions" VALUES(9,64);
INSERT INTO "role_permissions" VALUES(9,65);
INSERT INTO "role_permissions" VALUES(9,66);
INSERT INTO "role_permissions" VALUES(9,67);
INSERT INTO "role_permissions" VALUES(9,68);
INSERT INTO "role_permissions" VALUES(9,69);
INSERT INTO "role_permissions" VALUES(9,70);
INSERT INTO "role_permissions" VALUES(9,71);
INSERT INTO "role_permissions" VALUES(9,72);
INSERT INTO "role_permissions" VALUES(9,73);
INSERT INTO "role_permissions" VALUES(9,74);
INSERT INTO "role_permissions" VALUES(9,75);
INSERT INTO "role_permissions" VALUES(9,76);
INSERT INTO "role_permissions" VALUES(9,77);
INSERT INTO "role_permissions" VALUES(9,78);
INSERT INTO "role_permissions" VALUES(9,79);
INSERT INTO "role_permissions" VALUES(9,80);
INSERT INTO "role_permissions" VALUES(9,81);
INSERT INTO "role_permissions" VALUES(9,82);
INSERT INTO "role_permissions" VALUES(9,83);
INSERT INTO "role_permissions" VALUES(9,84);
INSERT INTO "role_permissions" VALUES(9,85);
INSERT INTO "role_permissions" VALUES(9,86);
INSERT INTO "role_permissions" VALUES(9,87);
INSERT INTO "role_permissions" VALUES(9,88);
INSERT INTO "role_permissions" VALUES(9,89);
INSERT INTO "role_permissions" VALUES(9,90);
INSERT INTO "role_permissions" VALUES(9,91);
INSERT INTO "role_permissions" VALUES(9,92);
INSERT INTO "role_permissions" VALUES(9,93);
INSERT INTO "role_permissions" VALUES(9,94);
INSERT INTO "role_permissions" VALUES(9,95);
INSERT INTO "role_permissions" VALUES(9,96);
INSERT INTO "role_permissions" VALUES(9,97);
INSERT INTO "role_permissions" VALUES(9,98);
INSERT INTO "role_permissions" VALUES(9,99);
INSERT INTO "role_permissions" VALUES(9,100);
INSERT INTO "role_permissions" VALUES(9,101);
INSERT INTO "role_permissions" VALUES(9,102);
INSERT INTO "role_permissions" VALUES(9,103);
INSERT INTO "role_permissions" VALUES(9,104);
INSERT INTO "role_permissions" VALUES(9,105);
INSERT INTO "role_permissions" VALUES(9,106);
INSERT INTO "role_permissions" VALUES(9,107);
INSERT INTO "role_permissions" VALUES(9,108);
INSERT INTO "role_permissions" VALUES(9,109);
INSERT INTO "role_permissions" VALUES(9,110);
INSERT INTO "role_permissions" VALUES(9,111);
INSERT INTO "role_permissions" VALUES(9,112);
INSERT INTO "role_permissions" VALUES(9,113);
INSERT INTO "role_permissions" VALUES(9,114);
INSERT INTO "role_permissions" VALUES(9,115);
INSERT INTO "role_permissions" VALUES(9,116);
INSERT INTO "role_permissions" VALUES(9,117);
INSERT INTO "role_permissions" VALUES(9,118);
INSERT INTO "role_permissions" VALUES(9,119);
INSERT INTO "role_permissions" VALUES(9,120);
INSERT INTO "role_permissions" VALUES(9,121);
INSERT INTO "role_permissions" VALUES(9,122);
INSERT INTO "role_permissions" VALUES(9,123);
INSERT INTO "role_permissions" VALUES(9,124);
INSERT INTO "role_permissions" VALUES(9,125);
INSERT INTO "role_permissions" VALUES(9,126);
INSERT INTO "role_permissions" VALUES(9,127);
INSERT INTO "role_permissions" VALUES(9,128);
INSERT INTO "role_permissions" VALUES(9,129);
INSERT INTO "role_permissions" VALUES(9,130);
INSERT INTO "role_permissions" VALUES(9,131);
INSERT INTO "role_permissions" VALUES(9,132);
INSERT INTO "role_permissions" VALUES(9,133);
INSERT INTO "role_permissions" VALUES(9,134);
INSERT INTO "role_permissions" VALUES(9,135);
INSERT INTO "role_permissions" VALUES(9,136);
INSERT INTO "role_permissions" VALUES(9,137);
INSERT INTO "role_permissions" VALUES(9,138);
INSERT INTO "role_permissions" VALUES(9,139);
INSERT INTO "role_permissions" VALUES(9,140);
INSERT INTO "role_permissions" VALUES(9,141);
INSERT INTO "role_permissions" VALUES(9,142);
INSERT INTO "role_permissions" VALUES(9,143);
INSERT INTO "role_permissions" VALUES(9,144);
INSERT INTO "role_permissions" VALUES(9,145);
INSERT INTO "role_permissions" VALUES(9,146);
INSERT INTO "role_permissions" VALUES(9,147);
INSERT INTO "role_permissions" VALUES(9,148);
INSERT INTO "role_permissions" VALUES(9,149);
INSERT INTO "role_permissions" VALUES(9,150);
INSERT INTO "role_permissions" VALUES(9,151);
INSERT INTO "role_permissions" VALUES(9,152);
INSERT INTO "role_permissions" VALUES(9,153);
INSERT INTO "role_permissions" VALUES(9,154);
INSERT INTO "role_permissions" VALUES(9,155);
INSERT INTO "role_permissions" VALUES(9,156);
INSERT INTO "role_permissions" VALUES(9,157);
INSERT INTO "role_permissions" VALUES(9,158);
INSERT INTO "role_permissions" VALUES(9,159);
INSERT INTO "role_permissions" VALUES(9,160);
INSERT INTO "role_permissions" VALUES(9,161);
INSERT INTO "role_permissions" VALUES(9,162);
INSERT INTO "role_permissions" VALUES(9,163);
INSERT INTO "role_permissions" VALUES(9,164);
INSERT INTO "role_permissions" VALUES(9,165);
INSERT INTO "role_permissions" VALUES(9,166);
INSERT INTO "role_permissions" VALUES(9,167);
INSERT INTO "role_permissions" VALUES(9,168);
INSERT INTO "role_permissions" VALUES(9,169);
INSERT INTO "role_permissions" VALUES(9,170);
INSERT INTO "role_permissions" VALUES(9,171);
INSERT INTO "role_permissions" VALUES(9,172);
INSERT INTO "role_permissions" VALUES(9,173);
INSERT INTO "role_permissions" VALUES(9,174);
INSERT INTO "role_permissions" VALUES(9,175);
INSERT INTO "role_permissions" VALUES(9,176);
INSERT INTO "role_permissions" VALUES(9,177);
INSERT INTO "role_permissions" VALUES(9,178);
INSERT INTO "role_permissions" VALUES(9,179);
INSERT INTO "role_permissions" VALUES(9,180);
INSERT INTO "role_permissions" VALUES(9,181);
INSERT INTO "role_permissions" VALUES(9,182);
INSERT INTO "role_permissions" VALUES(9,183);
INSERT INTO "role_permissions" VALUES(9,184);
INSERT INTO "role_permissions" VALUES(9,185);
INSERT INTO "role_permissions" VALUES(9,186);
INSERT INTO "role_permissions" VALUES(9,187);
INSERT INTO "role_permissions" VALUES(9,188);
INSERT INTO "role_permissions" VALUES(9,189);
INSERT INTO "role_permissions" VALUES(15,1);
INSERT INTO "role_permissions" VALUES(15,2);
INSERT INTO "role_permissions" VALUES(15,3);
INSERT INTO "role_permissions" VALUES(15,4);
INSERT INTO "role_permissions" VALUES(15,5);
INSERT INTO "role_permissions" VALUES(15,6);
INSERT INTO "role_permissions" VALUES(15,7);
INSERT INTO "role_permissions" VALUES(15,8);
INSERT INTO "role_permissions" VALUES(15,9);
INSERT INTO "role_permissions" VALUES(15,10);
INSERT INTO "role_permissions" VALUES(15,11);
INSERT INTO "role_permissions" VALUES(15,12);
INSERT INTO "role_permissions" VALUES(15,13);
INSERT INTO "role_permissions" VALUES(15,14);
INSERT INTO "role_permissions" VALUES(15,15);
INSERT INTO "role_permissions" VALUES(15,16);
INSERT INTO "role_permissions" VALUES(15,17);
INSERT INTO "role_permissions" VALUES(15,18);
INSERT INTO "role_permissions" VALUES(15,19);
INSERT INTO "role_permissions" VALUES(15,20);
INSERT INTO "role_permissions" VALUES(15,21);
INSERT INTO "role_permissions" VALUES(15,22);
INSERT INTO "role_permissions" VALUES(15,23);
INSERT INTO "role_permissions" VALUES(15,24);
INSERT INTO "role_permissions" VALUES(15,25);
INSERT INTO "role_permissions" VALUES(15,26);
INSERT INTO "role_permissions" VALUES(15,27);
INSERT INTO "role_permissions" VALUES(15,28);
INSERT INTO "role_permissions" VALUES(15,29);
INSERT INTO "role_permissions" VALUES(15,30);
INSERT INTO "role_permissions" VALUES(15,31);
INSERT INTO "role_permissions" VALUES(15,32);
INSERT INTO "role_permissions" VALUES(15,33);
INSERT INTO "role_permissions" VALUES(15,34);
INSERT INTO "role_permissions" VALUES(15,35);
INSERT INTO "role_permissions" VALUES(15,36);
INSERT INTO "role_permissions" VALUES(15,37);
INSERT INTO "role_permissions" VALUES(15,38);
INSERT INTO "role_permissions" VALUES(15,39);
INSERT INTO "role_permissions" VALUES(15,40);
INSERT INTO "role_permissions" VALUES(15,41);
INSERT INTO "role_permissions" VALUES(15,42);
INSERT INTO "role_permissions" VALUES(15,43);
INSERT INTO "role_permissions" VALUES(15,44);
INSERT INTO "role_permissions" VALUES(15,45);
INSERT INTO "role_permissions" VALUES(15,46);
INSERT INTO "role_permissions" VALUES(15,47);
INSERT INTO "role_permissions" VALUES(15,48);
INSERT INTO "role_permissions" VALUES(15,49);
INSERT INTO "role_permissions" VALUES(15,50);
INSERT INTO "role_permissions" VALUES(15,51);
INSERT INTO "role_permissions" VALUES(15,52);
INSERT INTO "role_permissions" VALUES(15,53);
INSERT INTO "role_permissions" VALUES(15,54);
INSERT INTO "role_permissions" VALUES(15,55);
INSERT INTO "role_permissions" VALUES(15,56);
INSERT INTO "role_permissions" VALUES(15,57);
INSERT INTO "role_permissions" VALUES(15,58);
INSERT INTO "role_permissions" VALUES(15,59);
INSERT INTO "role_permissions" VALUES(15,60);
INSERT INTO "role_permissions" VALUES(15,61);
INSERT INTO "role_permissions" VALUES(15,62);
INSERT INTO "role_permissions" VALUES(15,63);
INSERT INTO "role_permissions" VALUES(15,64);
INSERT INTO "role_permissions" VALUES(15,65);
INSERT INTO "role_permissions" VALUES(15,66);
INSERT INTO "role_permissions" VALUES(15,67);
INSERT INTO "role_permissions" VALUES(15,68);
INSERT INTO "role_permissions" VALUES(15,69);
INSERT INTO "role_permissions" VALUES(15,70);
INSERT INTO "role_permissions" VALUES(15,71);
INSERT INTO "role_permissions" VALUES(15,72);
INSERT INTO "role_permissions" VALUES(15,73);
INSERT INTO "role_permissions" VALUES(15,74);
INSERT INTO "role_permissions" VALUES(15,75);
INSERT INTO "role_permissions" VALUES(15,76);
INSERT INTO "role_permissions" VALUES(15,77);
INSERT INTO "role_permissions" VALUES(15,78);
INSERT INTO "role_permissions" VALUES(15,79);
INSERT INTO "role_permissions" VALUES(15,80);
INSERT INTO "role_permissions" VALUES(15,81);
INSERT INTO "role_permissions" VALUES(15,82);
INSERT INTO "role_permissions" VALUES(15,83);
INSERT INTO "role_permissions" VALUES(15,84);
INSERT INTO "role_permissions" VALUES(15,85);
INSERT INTO "role_permissions" VALUES(15,86);
INSERT INTO "role_permissions" VALUES(15,87);
INSERT INTO "role_permissions" VALUES(15,88);
INSERT INTO "role_permissions" VALUES(15,89);
INSERT INTO "role_permissions" VALUES(15,90);
INSERT INTO "role_permissions" VALUES(15,91);
INSERT INTO "role_permissions" VALUES(15,92);
INSERT INTO "role_permissions" VALUES(15,93);
INSERT INTO "role_permissions" VALUES(15,94);
INSERT INTO "role_permissions" VALUES(15,95);
INSERT INTO "role_permissions" VALUES(15,96);
INSERT INTO "role_permissions" VALUES(15,97);
INSERT INTO "role_permissions" VALUES(15,98);
INSERT INTO "role_permissions" VALUES(15,99);
INSERT INTO "role_permissions" VALUES(15,100);
INSERT INTO "role_permissions" VALUES(15,101);
INSERT INTO "role_permissions" VALUES(15,102);
INSERT INTO "role_permissions" VALUES(15,103);
INSERT INTO "role_permissions" VALUES(15,104);
INSERT INTO "role_permissions" VALUES(15,105);
INSERT INTO "role_permissions" VALUES(15,106);
INSERT INTO "role_permissions" VALUES(15,107);
INSERT INTO "role_permissions" VALUES(15,108);
INSERT INTO "role_permissions" VALUES(15,109);
INSERT INTO "role_permissions" VALUES(15,110);
INSERT INTO "role_permissions" VALUES(15,111);
INSERT INTO "role_permissions" VALUES(15,112);
INSERT INTO "role_permissions" VALUES(15,113);
INSERT INTO "role_permissions" VALUES(15,114);
INSERT INTO "role_permissions" VALUES(15,115);
INSERT INTO "role_permissions" VALUES(15,116);
INSERT INTO "role_permissions" VALUES(15,117);
INSERT INTO "role_permissions" VALUES(15,118);
INSERT INTO "role_permissions" VALUES(15,119);
INSERT INTO "role_permissions" VALUES(15,120);
INSERT INTO "role_permissions" VALUES(15,121);
INSERT INTO "role_permissions" VALUES(15,122);
INSERT INTO "role_permissions" VALUES(15,123);
INSERT INTO "role_permissions" VALUES(15,124);
INSERT INTO "role_permissions" VALUES(15,125);
INSERT INTO "role_permissions" VALUES(15,126);
INSERT INTO "role_permissions" VALUES(15,127);
INSERT INTO "role_permissions" VALUES(15,128);
INSERT INTO "role_permissions" VALUES(15,129);
INSERT INTO "role_permissions" VALUES(15,130);
INSERT INTO "role_permissions" VALUES(15,131);
INSERT INTO "role_permissions" VALUES(15,132);
INSERT INTO "role_permissions" VALUES(15,133);
INSERT INTO "role_permissions" VALUES(15,134);
INSERT INTO "role_permissions" VALUES(15,135);
INSERT INTO "role_permissions" VALUES(15,136);
INSERT INTO "role_permissions" VALUES(15,137);
INSERT INTO "role_permissions" VALUES(15,138);
INSERT INTO "role_permissions" VALUES(15,139);
INSERT INTO "role_permissions" VALUES(15,140);
INSERT INTO "role_permissions" VALUES(15,141);
INSERT INTO "role_permissions" VALUES(15,142);
INSERT INTO "role_permissions" VALUES(15,143);
INSERT INTO "role_permissions" VALUES(15,144);
INSERT INTO "role_permissions" VALUES(15,145);
INSERT INTO "role_permissions" VALUES(15,146);
INSERT INTO "role_permissions" VALUES(15,147);
INSERT INTO "role_permissions" VALUES(15,148);
INSERT INTO "role_permissions" VALUES(15,149);
INSERT INTO "role_permissions" VALUES(15,150);
INSERT INTO "role_permissions" VALUES(15,151);
INSERT INTO "role_permissions" VALUES(15,152);
INSERT INTO "role_permissions" VALUES(15,153);
INSERT INTO "role_permissions" VALUES(15,154);
INSERT INTO "role_permissions" VALUES(15,155);
INSERT INTO "role_permissions" VALUES(15,156);
INSERT INTO "role_permissions" VALUES(15,157);
INSERT INTO "role_permissions" VALUES(15,158);
INSERT INTO "role_permissions" VALUES(15,159);
INSERT INTO "role_permissions" VALUES(15,160);
INSERT INTO "role_permissions" VALUES(15,161);
INSERT INTO "role_permissions" VALUES(15,162);
INSERT INTO "role_permissions" VALUES(15,163);
INSERT INTO "role_permissions" VALUES(15,164);
INSERT INTO "role_permissions" VALUES(15,165);
INSERT INTO "role_permissions" VALUES(15,166);
INSERT INTO "role_permissions" VALUES(15,167);
INSERT INTO "role_permissions" VALUES(15,168);
INSERT INTO "role_permissions" VALUES(15,169);
INSERT INTO "role_permissions" VALUES(15,170);
INSERT INTO "role_permissions" VALUES(15,171);
INSERT INTO "role_permissions" VALUES(15,172);
INSERT INTO "role_permissions" VALUES(15,173);
INSERT INTO "role_permissions" VALUES(15,174);
INSERT INTO "role_permissions" VALUES(15,175);
INSERT INTO "role_permissions" VALUES(15,176);
INSERT INTO "role_permissions" VALUES(15,177);
INSERT INTO "role_permissions" VALUES(15,178);
INSERT INTO "role_permissions" VALUES(15,179);
INSERT INTO "role_permissions" VALUES(15,180);
INSERT INTO "role_permissions" VALUES(15,181);
INSERT INTO "role_permissions" VALUES(15,182);
INSERT INTO "role_permissions" VALUES(15,183);
INSERT INTO "role_permissions" VALUES(15,184);
INSERT INTO "role_permissions" VALUES(15,185);
INSERT INTO "role_permissions" VALUES(15,186);
INSERT INTO "role_permissions" VALUES(15,187);
INSERT INTO "role_permissions" VALUES(15,188);
INSERT INTO "role_permissions" VALUES(15,189);
INSERT INTO "role_permissions" VALUES(16,1);
INSERT INTO "role_permissions" VALUES(16,2);
INSERT INTO "role_permissions" VALUES(16,3);
INSERT INTO "role_permissions" VALUES(16,4);
INSERT INTO "role_permissions" VALUES(16,5);
INSERT INTO "role_permissions" VALUES(16,6);
INSERT INTO "role_permissions" VALUES(16,7);
INSERT INTO "role_permissions" VALUES(16,8);
INSERT INTO "role_permissions" VALUES(16,9);
INSERT INTO "role_permissions" VALUES(16,10);
INSERT INTO "role_permissions" VALUES(16,11);
INSERT INTO "role_permissions" VALUES(16,12);
INSERT INTO "role_permissions" VALUES(16,13);
INSERT INTO "role_permissions" VALUES(16,14);
INSERT INTO "role_permissions" VALUES(16,15);
INSERT INTO "role_permissions" VALUES(16,16);
INSERT INTO "role_permissions" VALUES(16,17);
INSERT INTO "role_permissions" VALUES(16,18);
INSERT INTO "role_permissions" VALUES(16,19);
INSERT INTO "role_permissions" VALUES(16,20);
INSERT INTO "role_permissions" VALUES(16,21);
INSERT INTO "role_permissions" VALUES(16,22);
INSERT INTO "role_permissions" VALUES(16,23);
INSERT INTO "role_permissions" VALUES(16,24);
INSERT INTO "role_permissions" VALUES(16,25);
INSERT INTO "role_permissions" VALUES(16,26);
INSERT INTO "role_permissions" VALUES(16,27);
INSERT INTO "role_permissions" VALUES(16,28);
INSERT INTO "role_permissions" VALUES(16,29);
INSERT INTO "role_permissions" VALUES(16,30);
INSERT INTO "role_permissions" VALUES(16,31);
INSERT INTO "role_permissions" VALUES(16,32);
INSERT INTO "role_permissions" VALUES(16,33);
INSERT INTO "role_permissions" VALUES(16,34);
INSERT INTO "role_permissions" VALUES(16,35);
INSERT INTO "role_permissions" VALUES(16,36);
INSERT INTO "role_permissions" VALUES(16,37);
INSERT INTO "role_permissions" VALUES(16,38);
INSERT INTO "role_permissions" VALUES(16,39);
INSERT INTO "role_permissions" VALUES(16,40);
INSERT INTO "role_permissions" VALUES(16,41);
INSERT INTO "role_permissions" VALUES(16,42);
INSERT INTO "role_permissions" VALUES(16,43);
INSERT INTO "role_permissions" VALUES(16,44);
INSERT INTO "role_permissions" VALUES(16,45);
INSERT INTO "role_permissions" VALUES(16,46);
INSERT INTO "role_permissions" VALUES(16,47);
INSERT INTO "role_permissions" VALUES(16,48);
INSERT INTO "role_permissions" VALUES(16,49);
INSERT INTO "role_permissions" VALUES(16,50);
INSERT INTO "role_permissions" VALUES(16,51);
INSERT INTO "role_permissions" VALUES(16,52);
INSERT INTO "role_permissions" VALUES(16,53);
INSERT INTO "role_permissions" VALUES(16,54);
INSERT INTO "role_permissions" VALUES(16,55);
INSERT INTO "role_permissions" VALUES(16,56);
INSERT INTO "role_permissions" VALUES(16,57);
INSERT INTO "role_permissions" VALUES(16,58);
INSERT INTO "role_permissions" VALUES(16,59);
INSERT INTO "role_permissions" VALUES(16,60);
INSERT INTO "role_permissions" VALUES(16,61);
INSERT INTO "role_permissions" VALUES(16,62);
INSERT INTO "role_permissions" VALUES(16,63);
INSERT INTO "role_permissions" VALUES(16,64);
INSERT INTO "role_permissions" VALUES(16,65);
INSERT INTO "role_permissions" VALUES(16,66);
INSERT INTO "role_permissions" VALUES(16,67);
INSERT INTO "role_permissions" VALUES(16,68);
INSERT INTO "role_permissions" VALUES(16,69);
INSERT INTO "role_permissions" VALUES(16,70);
INSERT INTO "role_permissions" VALUES(16,71);
INSERT INTO "role_permissions" VALUES(16,72);
INSERT INTO "role_permissions" VALUES(16,73);
INSERT INTO "role_permissions" VALUES(16,74);
INSERT INTO "role_permissions" VALUES(16,75);
INSERT INTO "role_permissions" VALUES(16,76);
INSERT INTO "role_permissions" VALUES(16,77);
INSERT INTO "role_permissions" VALUES(16,78);
INSERT INTO "role_permissions" VALUES(16,79);
INSERT INTO "role_permissions" VALUES(16,80);
INSERT INTO "role_permissions" VALUES(16,81);
INSERT INTO "role_permissions" VALUES(16,82);
INSERT INTO "role_permissions" VALUES(16,83);
INSERT INTO "role_permissions" VALUES(16,84);
INSERT INTO "role_permissions" VALUES(16,85);
INSERT INTO "role_permissions" VALUES(16,86);
INSERT INTO "role_permissions" VALUES(16,87);
INSERT INTO "role_permissions" VALUES(16,88);
INSERT INTO "role_permissions" VALUES(16,89);
INSERT INTO "role_permissions" VALUES(16,90);
INSERT INTO "role_permissions" VALUES(16,91);
INSERT INTO "role_permissions" VALUES(16,92);
INSERT INTO "role_permissions" VALUES(16,93);
INSERT INTO "role_permissions" VALUES(16,94);
INSERT INTO "role_permissions" VALUES(16,95);
INSERT INTO "role_permissions" VALUES(16,96);
INSERT INTO "role_permissions" VALUES(16,97);
INSERT INTO "role_permissions" VALUES(16,98);
INSERT INTO "role_permissions" VALUES(16,99);
INSERT INTO "role_permissions" VALUES(16,100);
INSERT INTO "role_permissions" VALUES(16,101);
INSERT INTO "role_permissions" VALUES(16,102);
INSERT INTO "role_permissions" VALUES(16,103);
INSERT INTO "role_permissions" VALUES(16,104);
INSERT INTO "role_permissions" VALUES(16,105);
INSERT INTO "role_permissions" VALUES(16,106);
INSERT INTO "role_permissions" VALUES(16,107);
INSERT INTO "role_permissions" VALUES(16,108);
INSERT INTO "role_permissions" VALUES(16,109);
INSERT INTO "role_permissions" VALUES(16,110);
INSERT INTO "role_permissions" VALUES(16,111);
INSERT INTO "role_permissions" VALUES(16,112);
INSERT INTO "role_permissions" VALUES(16,113);
INSERT INTO "role_permissions" VALUES(16,114);
INSERT INTO "role_permissions" VALUES(16,115);
INSERT INTO "role_permissions" VALUES(16,116);
INSERT INTO "role_permissions" VALUES(16,117);
INSERT INTO "role_permissions" VALUES(16,118);
INSERT INTO "role_permissions" VALUES(16,119);
INSERT INTO "role_permissions" VALUES(16,120);
INSERT INTO "role_permissions" VALUES(16,121);
INSERT INTO "role_permissions" VALUES(16,122);
INSERT INTO "role_permissions" VALUES(16,123);
INSERT INTO "role_permissions" VALUES(16,124);
INSERT INTO "role_permissions" VALUES(16,125);
INSERT INTO "role_permissions" VALUES(16,126);
INSERT INTO "role_permissions" VALUES(16,127);
INSERT INTO "role_permissions" VALUES(16,128);
INSERT INTO "role_permissions" VALUES(16,129);
INSERT INTO "role_permissions" VALUES(16,130);
INSERT INTO "role_permissions" VALUES(16,131);
INSERT INTO "role_permissions" VALUES(16,132);
INSERT INTO "role_permissions" VALUES(16,133);
INSERT INTO "role_permissions" VALUES(16,134);
INSERT INTO "role_permissions" VALUES(16,135);
INSERT INTO "role_permissions" VALUES(16,136);
INSERT INTO "role_permissions" VALUES(16,137);
INSERT INTO "role_permissions" VALUES(16,138);
INSERT INTO "role_permissions" VALUES(16,139);
INSERT INTO "role_permissions" VALUES(16,140);
INSERT INTO "role_permissions" VALUES(16,141);
INSERT INTO "role_permissions" VALUES(16,142);
INSERT INTO "role_permissions" VALUES(16,143);
INSERT INTO "role_permissions" VALUES(16,144);
INSERT INTO "role_permissions" VALUES(16,145);
INSERT INTO "role_permissions" VALUES(16,146);
INSERT INTO "role_permissions" VALUES(16,147);
INSERT INTO "role_permissions" VALUES(16,148);
INSERT INTO "role_permissions" VALUES(16,149);
INSERT INTO "role_permissions" VALUES(16,150);
INSERT INTO "role_permissions" VALUES(16,151);
INSERT INTO "role_permissions" VALUES(16,152);
INSERT INTO "role_permissions" VALUES(16,153);
INSERT INTO "role_permissions" VALUES(16,154);
INSERT INTO "role_permissions" VALUES(16,155);
INSERT INTO "role_permissions" VALUES(16,156);
INSERT INTO "role_permissions" VALUES(16,157);
INSERT INTO "role_permissions" VALUES(16,158);
INSERT INTO "role_permissions" VALUES(16,159);
INSERT INTO "role_permissions" VALUES(16,160);
INSERT INTO "role_permissions" VALUES(16,161);
INSERT INTO "role_permissions" VALUES(16,162);
INSERT INTO "role_permissions" VALUES(16,163);
INSERT INTO "role_permissions" VALUES(16,164);
INSERT INTO "role_permissions" VALUES(16,165);
INSERT INTO "role_permissions" VALUES(16,166);
INSERT INTO "role_permissions" VALUES(16,167);
INSERT INTO "role_permissions" VALUES(16,168);
INSERT INTO "role_permissions" VALUES(16,169);
INSERT INTO "role_permissions" VALUES(16,170);
INSERT INTO "role_permissions" VALUES(16,171);
INSERT INTO "role_permissions" VALUES(16,172);
INSERT INTO "role_permissions" VALUES(16,173);
INSERT INTO "role_permissions" VALUES(16,174);
INSERT INTO "role_permissions" VALUES(16,175);
INSERT INTO "role_permissions" VALUES(16,176);
INSERT INTO "role_permissions" VALUES(16,177);
INSERT INTO "role_permissions" VALUES(16,178);
INSERT INTO "role_permissions" VALUES(16,179);
INSERT INTO "role_permissions" VALUES(16,180);
INSERT INTO "role_permissions" VALUES(16,181);
INSERT INTO "role_permissions" VALUES(16,182);
INSERT INTO "role_permissions" VALUES(16,183);
INSERT INTO "role_permissions" VALUES(16,184);
INSERT INTO "role_permissions" VALUES(16,185);
INSERT INTO "role_permissions" VALUES(16,186);
INSERT INTO "role_permissions" VALUES(16,187);
INSERT INTO "role_permissions" VALUES(16,188);
INSERT INTO "role_permissions" VALUES(16,189);
INSERT INTO "role_permissions" VALUES(3,2);
INSERT INTO "role_permissions" VALUES(10,2);
INSERT INTO "role_permissions" VALUES(17,2);
INSERT INTO "role_permissions" VALUES(3,3);
INSERT INTO "role_permissions" VALUES(10,3);
INSERT INTO "role_permissions" VALUES(17,3);
INSERT INTO "role_permissions" VALUES(3,4);
INSERT INTO "role_permissions" VALUES(10,4);
INSERT INTO "role_permissions" VALUES(17,4);
INSERT INTO "role_permissions" VALUES(3,5);
INSERT INTO "role_permissions" VALUES(10,5);
INSERT INTO "role_permissions" VALUES(17,5);
INSERT INTO "role_permissions" VALUES(3,6);
INSERT INTO "role_permissions" VALUES(10,6);
INSERT INTO "role_permissions" VALUES(17,6);
INSERT INTO "role_permissions" VALUES(3,7);
INSERT INTO "role_permissions" VALUES(10,7);
INSERT INTO "role_permissions" VALUES(17,7);
INSERT INTO "role_permissions" VALUES(3,8);
INSERT INTO "role_permissions" VALUES(10,8);
INSERT INTO "role_permissions" VALUES(17,8);
INSERT INTO "role_permissions" VALUES(3,9);
INSERT INTO "role_permissions" VALUES(10,9);
INSERT INTO "role_permissions" VALUES(17,9);
INSERT INTO "role_permissions" VALUES(3,10);
INSERT INTO "role_permissions" VALUES(10,10);
INSERT INTO "role_permissions" VALUES(17,10);
INSERT INTO "role_permissions" VALUES(3,11);
INSERT INTO "role_permissions" VALUES(10,11);
INSERT INTO "role_permissions" VALUES(17,11);
INSERT INTO "role_permissions" VALUES(3,12);
INSERT INTO "role_permissions" VALUES(10,12);
INSERT INTO "role_permissions" VALUES(17,12);
INSERT INTO "role_permissions" VALUES(3,13);
INSERT INTO "role_permissions" VALUES(10,13);
INSERT INTO "role_permissions" VALUES(17,13);
INSERT INTO "role_permissions" VALUES(3,14);
INSERT INTO "role_permissions" VALUES(10,14);
INSERT INTO "role_permissions" VALUES(17,14);
INSERT INTO "role_permissions" VALUES(3,15);
INSERT INTO "role_permissions" VALUES(10,15);
INSERT INTO "role_permissions" VALUES(17,15);
INSERT INTO "role_permissions" VALUES(3,16);
INSERT INTO "role_permissions" VALUES(10,16);
INSERT INTO "role_permissions" VALUES(17,16);
INSERT INTO "role_permissions" VALUES(3,17);
INSERT INTO "role_permissions" VALUES(10,17);
INSERT INTO "role_permissions" VALUES(17,17);
INSERT INTO "role_permissions" VALUES(3,18);
INSERT INTO "role_permissions" VALUES(10,18);
INSERT INTO "role_permissions" VALUES(17,18);
INSERT INTO "role_permissions" VALUES(3,19);
INSERT INTO "role_permissions" VALUES(10,19);
INSERT INTO "role_permissions" VALUES(17,19);
INSERT INTO "role_permissions" VALUES(3,20);
INSERT INTO "role_permissions" VALUES(10,20);
INSERT INTO "role_permissions" VALUES(17,20);
INSERT INTO "role_permissions" VALUES(3,21);
INSERT INTO "role_permissions" VALUES(10,21);
INSERT INTO "role_permissions" VALUES(17,21);
INSERT INTO "role_permissions" VALUES(3,22);
INSERT INTO "role_permissions" VALUES(10,22);
INSERT INTO "role_permissions" VALUES(17,22);
INSERT INTO "role_permissions" VALUES(3,23);
INSERT INTO "role_permissions" VALUES(10,23);
INSERT INTO "role_permissions" VALUES(17,23);
INSERT INTO "role_permissions" VALUES(3,24);
INSERT INTO "role_permissions" VALUES(10,24);
INSERT INTO "role_permissions" VALUES(17,24);
INSERT INTO "role_permissions" VALUES(3,25);
INSERT INTO "role_permissions" VALUES(10,25);
INSERT INTO "role_permissions" VALUES(17,25);
INSERT INTO "role_permissions" VALUES(3,26);
INSERT INTO "role_permissions" VALUES(10,26);
INSERT INTO "role_permissions" VALUES(17,26);
INSERT INTO "role_permissions" VALUES(3,27);
INSERT INTO "role_permissions" VALUES(10,27);
INSERT INTO "role_permissions" VALUES(17,27);
INSERT INTO "role_permissions" VALUES(3,28);
INSERT INTO "role_permissions" VALUES(10,28);
INSERT INTO "role_permissions" VALUES(17,28);
INSERT INTO "role_permissions" VALUES(3,29);
INSERT INTO "role_permissions" VALUES(10,29);
INSERT INTO "role_permissions" VALUES(17,29);
INSERT INTO "role_permissions" VALUES(3,30);
INSERT INTO "role_permissions" VALUES(10,30);
INSERT INTO "role_permissions" VALUES(17,30);
INSERT INTO "role_permissions" VALUES(3,31);
INSERT INTO "role_permissions" VALUES(10,31);
INSERT INTO "role_permissions" VALUES(17,31);
INSERT INTO "role_permissions" VALUES(3,32);
INSERT INTO "role_permissions" VALUES(10,32);
INSERT INTO "role_permissions" VALUES(17,32);
INSERT INTO "role_permissions" VALUES(3,33);
INSERT INTO "role_permissions" VALUES(10,33);
INSERT INTO "role_permissions" VALUES(17,33);
INSERT INTO "role_permissions" VALUES(3,34);
INSERT INTO "role_permissions" VALUES(10,34);
INSERT INTO "role_permissions" VALUES(17,34);
INSERT INTO "role_permissions" VALUES(3,35);
INSERT INTO "role_permissions" VALUES(10,35);
INSERT INTO "role_permissions" VALUES(17,35);
INSERT INTO "role_permissions" VALUES(3,36);
INSERT INTO "role_permissions" VALUES(10,36);
INSERT INTO "role_permissions" VALUES(17,36);
INSERT INTO "role_permissions" VALUES(3,37);
INSERT INTO "role_permissions" VALUES(10,37);
INSERT INTO "role_permissions" VALUES(17,37);
INSERT INTO "role_permissions" VALUES(3,38);
INSERT INTO "role_permissions" VALUES(10,38);
INSERT INTO "role_permissions" VALUES(17,38);
INSERT INTO "role_permissions" VALUES(3,39);
INSERT INTO "role_permissions" VALUES(10,39);
INSERT INTO "role_permissions" VALUES(17,39);
INSERT INTO "role_permissions" VALUES(3,40);
INSERT INTO "role_permissions" VALUES(10,40);
INSERT INTO "role_permissions" VALUES(17,40);
INSERT INTO "role_permissions" VALUES(3,41);
INSERT INTO "role_permissions" VALUES(10,41);
INSERT INTO "role_permissions" VALUES(17,41);
INSERT INTO "role_permissions" VALUES(3,42);
INSERT INTO "role_permissions" VALUES(10,42);
INSERT INTO "role_permissions" VALUES(17,42);
INSERT INTO "role_permissions" VALUES(3,43);
INSERT INTO "role_permissions" VALUES(10,43);
INSERT INTO "role_permissions" VALUES(17,43);
INSERT INTO "role_permissions" VALUES(3,44);
INSERT INTO "role_permissions" VALUES(10,44);
INSERT INTO "role_permissions" VALUES(17,44);
INSERT INTO "role_permissions" VALUES(3,45);
INSERT INTO "role_permissions" VALUES(10,45);
INSERT INTO "role_permissions" VALUES(17,45);
INSERT INTO "role_permissions" VALUES(3,46);
INSERT INTO "role_permissions" VALUES(10,46);
INSERT INTO "role_permissions" VALUES(17,46);
INSERT INTO "role_permissions" VALUES(3,47);
INSERT INTO "role_permissions" VALUES(10,47);
INSERT INTO "role_permissions" VALUES(17,47);
INSERT INTO "role_permissions" VALUES(3,48);
INSERT INTO "role_permissions" VALUES(10,48);
INSERT INTO "role_permissions" VALUES(17,48);
INSERT INTO "role_permissions" VALUES(3,49);
INSERT INTO "role_permissions" VALUES(10,49);
INSERT INTO "role_permissions" VALUES(17,49);
INSERT INTO "role_permissions" VALUES(3,50);
INSERT INTO "role_permissions" VALUES(10,50);
INSERT INTO "role_permissions" VALUES(17,50);
INSERT INTO "role_permissions" VALUES(3,51);
INSERT INTO "role_permissions" VALUES(10,51);
INSERT INTO "role_permissions" VALUES(17,51);
INSERT INTO "role_permissions" VALUES(3,52);
INSERT INTO "role_permissions" VALUES(10,52);
INSERT INTO "role_permissions" VALUES(17,52);
INSERT INTO "role_permissions" VALUES(3,53);
INSERT INTO "role_permissions" VALUES(10,53);
INSERT INTO "role_permissions" VALUES(17,53);
INSERT INTO "role_permissions" VALUES(3,54);
INSERT INTO "role_permissions" VALUES(10,54);
INSERT INTO "role_permissions" VALUES(17,54);
INSERT INTO "role_permissions" VALUES(3,55);
INSERT INTO "role_permissions" VALUES(10,55);
INSERT INTO "role_permissions" VALUES(17,55);
INSERT INTO "role_permissions" VALUES(3,56);
INSERT INTO "role_permissions" VALUES(10,56);
INSERT INTO "role_permissions" VALUES(17,56);
INSERT INTO "role_permissions" VALUES(3,57);
INSERT INTO "role_permissions" VALUES(10,57);
INSERT INTO "role_permissions" VALUES(17,57);
INSERT INTO "role_permissions" VALUES(3,58);
INSERT INTO "role_permissions" VALUES(10,58);
INSERT INTO "role_permissions" VALUES(17,58);
INSERT INTO "role_permissions" VALUES(3,59);
INSERT INTO "role_permissions" VALUES(10,59);
INSERT INTO "role_permissions" VALUES(17,59);
INSERT INTO "role_permissions" VALUES(3,60);
INSERT INTO "role_permissions" VALUES(10,60);
INSERT INTO "role_permissions" VALUES(17,60);
INSERT INTO "role_permissions" VALUES(3,61);
INSERT INTO "role_permissions" VALUES(10,61);
INSERT INTO "role_permissions" VALUES(17,61);
INSERT INTO "role_permissions" VALUES(3,62);
INSERT INTO "role_permissions" VALUES(10,62);
INSERT INTO "role_permissions" VALUES(17,62);
INSERT INTO "role_permissions" VALUES(3,63);
INSERT INTO "role_permissions" VALUES(10,63);
INSERT INTO "role_permissions" VALUES(17,63);
INSERT INTO "role_permissions" VALUES(3,65);
INSERT INTO "role_permissions" VALUES(10,65);
INSERT INTO "role_permissions" VALUES(17,65);
INSERT INTO "role_permissions" VALUES(3,66);
INSERT INTO "role_permissions" VALUES(10,66);
INSERT INTO "role_permissions" VALUES(17,66);
INSERT INTO "role_permissions" VALUES(3,67);
INSERT INTO "role_permissions" VALUES(10,67);
INSERT INTO "role_permissions" VALUES(17,67);
INSERT INTO "role_permissions" VALUES(3,68);
INSERT INTO "role_permissions" VALUES(10,68);
INSERT INTO "role_permissions" VALUES(17,68);
INSERT INTO "role_permissions" VALUES(3,69);
INSERT INTO "role_permissions" VALUES(10,69);
INSERT INTO "role_permissions" VALUES(17,69);
INSERT INTO "role_permissions" VALUES(3,70);
INSERT INTO "role_permissions" VALUES(10,70);
INSERT INTO "role_permissions" VALUES(17,70);
INSERT INTO "role_permissions" VALUES(3,71);
INSERT INTO "role_permissions" VALUES(10,71);
INSERT INTO "role_permissions" VALUES(17,71);
INSERT INTO "role_permissions" VALUES(3,72);
INSERT INTO "role_permissions" VALUES(10,72);
INSERT INTO "role_permissions" VALUES(17,72);
INSERT INTO "role_permissions" VALUES(3,73);
INSERT INTO "role_permissions" VALUES(10,73);
INSERT INTO "role_permissions" VALUES(17,73);
INSERT INTO "role_permissions" VALUES(3,74);
INSERT INTO "role_permissions" VALUES(10,74);
INSERT INTO "role_permissions" VALUES(17,74);
INSERT INTO "role_permissions" VALUES(3,75);
INSERT INTO "role_permissions" VALUES(10,75);
INSERT INTO "role_permissions" VALUES(17,75);
INSERT INTO "role_permissions" VALUES(3,76);
INSERT INTO "role_permissions" VALUES(10,76);
INSERT INTO "role_permissions" VALUES(17,76);
INSERT INTO "role_permissions" VALUES(3,77);
INSERT INTO "role_permissions" VALUES(10,77);
INSERT INTO "role_permissions" VALUES(17,77);
INSERT INTO "role_permissions" VALUES(3,78);
INSERT INTO "role_permissions" VALUES(10,78);
INSERT INTO "role_permissions" VALUES(17,78);
INSERT INTO "role_permissions" VALUES(3,79);
INSERT INTO "role_permissions" VALUES(10,79);
INSERT INTO "role_permissions" VALUES(17,79);
INSERT INTO "role_permissions" VALUES(3,80);
INSERT INTO "role_permissions" VALUES(10,80);
INSERT INTO "role_permissions" VALUES(17,80);
INSERT INTO "role_permissions" VALUES(3,81);
INSERT INTO "role_permissions" VALUES(10,81);
INSERT INTO "role_permissions" VALUES(17,81);
INSERT INTO "role_permissions" VALUES(3,82);
INSERT INTO "role_permissions" VALUES(10,82);
INSERT INTO "role_permissions" VALUES(17,82);
INSERT INTO "role_permissions" VALUES(3,83);
INSERT INTO "role_permissions" VALUES(10,83);
INSERT INTO "role_permissions" VALUES(17,83);
INSERT INTO "role_permissions" VALUES(3,84);
INSERT INTO "role_permissions" VALUES(10,84);
INSERT INTO "role_permissions" VALUES(17,84);
INSERT INTO "role_permissions" VALUES(3,85);
INSERT INTO "role_permissions" VALUES(10,85);
INSERT INTO "role_permissions" VALUES(17,85);
INSERT INTO "role_permissions" VALUES(3,86);
INSERT INTO "role_permissions" VALUES(10,86);
INSERT INTO "role_permissions" VALUES(17,86);
INSERT INTO "role_permissions" VALUES(3,87);
INSERT INTO "role_permissions" VALUES(10,87);
INSERT INTO "role_permissions" VALUES(17,87);
INSERT INTO "role_permissions" VALUES(3,88);
INSERT INTO "role_permissions" VALUES(10,88);
INSERT INTO "role_permissions" VALUES(17,88);
INSERT INTO "role_permissions" VALUES(3,89);
INSERT INTO "role_permissions" VALUES(10,89);
INSERT INTO "role_permissions" VALUES(17,89);
INSERT INTO "role_permissions" VALUES(3,90);
INSERT INTO "role_permissions" VALUES(10,90);
INSERT INTO "role_permissions" VALUES(17,90);
INSERT INTO "role_permissions" VALUES(3,91);
INSERT INTO "role_permissions" VALUES(10,91);
INSERT INTO "role_permissions" VALUES(17,91);
INSERT INTO "role_permissions" VALUES(3,92);
INSERT INTO "role_permissions" VALUES(10,92);
INSERT INTO "role_permissions" VALUES(17,92);
INSERT INTO "role_permissions" VALUES(3,93);
INSERT INTO "role_permissions" VALUES(10,93);
INSERT INTO "role_permissions" VALUES(17,93);
INSERT INTO "role_permissions" VALUES(3,94);
INSERT INTO "role_permissions" VALUES(10,94);
INSERT INTO "role_permissions" VALUES(17,94);
INSERT INTO "role_permissions" VALUES(3,95);
INSERT INTO "role_permissions" VALUES(10,95);
INSERT INTO "role_permissions" VALUES(17,95);
INSERT INTO "role_permissions" VALUES(3,96);
INSERT INTO "role_permissions" VALUES(10,96);
INSERT INTO "role_permissions" VALUES(17,96);
INSERT INTO "role_permissions" VALUES(3,97);
INSERT INTO "role_permissions" VALUES(10,97);
INSERT INTO "role_permissions" VALUES(17,97);
INSERT INTO "role_permissions" VALUES(3,98);
INSERT INTO "role_permissions" VALUES(10,98);
INSERT INTO "role_permissions" VALUES(17,98);
INSERT INTO "role_permissions" VALUES(3,99);
INSERT INTO "role_permissions" VALUES(10,99);
INSERT INTO "role_permissions" VALUES(17,99);
INSERT INTO "role_permissions" VALUES(3,100);
INSERT INTO "role_permissions" VALUES(10,100);
INSERT INTO "role_permissions" VALUES(17,100);
INSERT INTO "role_permissions" VALUES(3,101);
INSERT INTO "role_permissions" VALUES(10,101);
INSERT INTO "role_permissions" VALUES(17,101);
INSERT INTO "role_permissions" VALUES(3,102);
INSERT INTO "role_permissions" VALUES(10,102);
INSERT INTO "role_permissions" VALUES(17,102);
INSERT INTO "role_permissions" VALUES(3,103);
INSERT INTO "role_permissions" VALUES(10,103);
INSERT INTO "role_permissions" VALUES(17,103);
INSERT INTO "role_permissions" VALUES(3,104);
INSERT INTO "role_permissions" VALUES(10,104);
INSERT INTO "role_permissions" VALUES(17,104);
INSERT INTO "role_permissions" VALUES(3,105);
INSERT INTO "role_permissions" VALUES(10,105);
INSERT INTO "role_permissions" VALUES(17,105);
INSERT INTO "role_permissions" VALUES(3,106);
INSERT INTO "role_permissions" VALUES(10,106);
INSERT INTO "role_permissions" VALUES(17,106);
INSERT INTO "role_permissions" VALUES(3,107);
INSERT INTO "role_permissions" VALUES(10,107);
INSERT INTO "role_permissions" VALUES(17,107);
INSERT INTO "role_permissions" VALUES(3,108);
INSERT INTO "role_permissions" VALUES(10,108);
INSERT INTO "role_permissions" VALUES(17,108);
INSERT INTO "role_permissions" VALUES(3,109);
INSERT INTO "role_permissions" VALUES(10,109);
INSERT INTO "role_permissions" VALUES(17,109);
INSERT INTO "role_permissions" VALUES(3,110);
INSERT INTO "role_permissions" VALUES(10,110);
INSERT INTO "role_permissions" VALUES(17,110);
INSERT INTO "role_permissions" VALUES(3,111);
INSERT INTO "role_permissions" VALUES(10,111);
INSERT INTO "role_permissions" VALUES(17,111);
INSERT INTO "role_permissions" VALUES(3,112);
INSERT INTO "role_permissions" VALUES(10,112);
INSERT INTO "role_permissions" VALUES(17,112);
INSERT INTO "role_permissions" VALUES(3,113);
INSERT INTO "role_permissions" VALUES(10,113);
INSERT INTO "role_permissions" VALUES(17,113);
INSERT INTO "role_permissions" VALUES(3,114);
INSERT INTO "role_permissions" VALUES(10,114);
INSERT INTO "role_permissions" VALUES(17,114);
INSERT INTO "role_permissions" VALUES(3,115);
INSERT INTO "role_permissions" VALUES(10,115);
INSERT INTO "role_permissions" VALUES(17,115);
INSERT INTO "role_permissions" VALUES(3,116);
INSERT INTO "role_permissions" VALUES(10,116);
INSERT INTO "role_permissions" VALUES(17,116);
INSERT INTO "role_permissions" VALUES(3,117);
INSERT INTO "role_permissions" VALUES(10,117);
INSERT INTO "role_permissions" VALUES(17,117);
INSERT INTO "role_permissions" VALUES(3,118);
INSERT INTO "role_permissions" VALUES(10,118);
INSERT INTO "role_permissions" VALUES(17,118);
INSERT INTO "role_permissions" VALUES(3,119);
INSERT INTO "role_permissions" VALUES(10,119);
INSERT INTO "role_permissions" VALUES(17,119);
INSERT INTO "role_permissions" VALUES(3,120);
INSERT INTO "role_permissions" VALUES(10,120);
INSERT INTO "role_permissions" VALUES(17,120);
INSERT INTO "role_permissions" VALUES(3,121);
INSERT INTO "role_permissions" VALUES(10,121);
INSERT INTO "role_permissions" VALUES(17,121);
INSERT INTO "role_permissions" VALUES(3,122);
INSERT INTO "role_permissions" VALUES(10,122);
INSERT INTO "role_permissions" VALUES(17,122);
INSERT INTO "role_permissions" VALUES(3,123);
INSERT INTO "role_permissions" VALUES(10,123);
INSERT INTO "role_permissions" VALUES(17,123);
INSERT INTO "role_permissions" VALUES(3,124);
INSERT INTO "role_permissions" VALUES(10,124);
INSERT INTO "role_permissions" VALUES(17,124);
INSERT INTO "role_permissions" VALUES(3,125);
INSERT INTO "role_permissions" VALUES(10,125);
INSERT INTO "role_permissions" VALUES(17,125);
INSERT INTO "role_permissions" VALUES(3,126);
INSERT INTO "role_permissions" VALUES(10,126);
INSERT INTO "role_permissions" VALUES(17,126);
INSERT INTO "role_permissions" VALUES(3,128);
INSERT INTO "role_permissions" VALUES(10,128);
INSERT INTO "role_permissions" VALUES(17,128);
INSERT INTO "role_permissions" VALUES(3,129);
INSERT INTO "role_permissions" VALUES(10,129);
INSERT INTO "role_permissions" VALUES(17,129);
INSERT INTO "role_permissions" VALUES(3,130);
INSERT INTO "role_permissions" VALUES(10,130);
INSERT INTO "role_permissions" VALUES(17,130);
INSERT INTO "role_permissions" VALUES(3,131);
INSERT INTO "role_permissions" VALUES(10,131);
INSERT INTO "role_permissions" VALUES(17,131);
INSERT INTO "role_permissions" VALUES(3,132);
INSERT INTO "role_permissions" VALUES(10,132);
INSERT INTO "role_permissions" VALUES(17,132);
INSERT INTO "role_permissions" VALUES(3,133);
INSERT INTO "role_permissions" VALUES(10,133);
INSERT INTO "role_permissions" VALUES(17,133);
INSERT INTO "role_permissions" VALUES(3,134);
INSERT INTO "role_permissions" VALUES(10,134);
INSERT INTO "role_permissions" VALUES(17,134);
INSERT INTO "role_permissions" VALUES(3,135);
INSERT INTO "role_permissions" VALUES(10,135);
INSERT INTO "role_permissions" VALUES(17,135);
INSERT INTO "role_permissions" VALUES(3,136);
INSERT INTO "role_permissions" VALUES(10,136);
INSERT INTO "role_permissions" VALUES(17,136);
INSERT INTO "role_permissions" VALUES(3,137);
INSERT INTO "role_permissions" VALUES(10,137);
INSERT INTO "role_permissions" VALUES(17,137);
INSERT INTO "role_permissions" VALUES(3,138);
INSERT INTO "role_permissions" VALUES(10,138);
INSERT INTO "role_permissions" VALUES(17,138);
INSERT INTO "role_permissions" VALUES(3,139);
INSERT INTO "role_permissions" VALUES(10,139);
INSERT INTO "role_permissions" VALUES(17,139);
INSERT INTO "role_permissions" VALUES(3,140);
INSERT INTO "role_permissions" VALUES(10,140);
INSERT INTO "role_permissions" VALUES(17,140);
INSERT INTO "role_permissions" VALUES(3,141);
INSERT INTO "role_permissions" VALUES(10,141);
INSERT INTO "role_permissions" VALUES(17,141);
INSERT INTO "role_permissions" VALUES(3,142);
INSERT INTO "role_permissions" VALUES(10,142);
INSERT INTO "role_permissions" VALUES(17,142);
INSERT INTO "role_permissions" VALUES(3,143);
INSERT INTO "role_permissions" VALUES(10,143);
INSERT INTO "role_permissions" VALUES(17,143);
INSERT INTO "role_permissions" VALUES(3,144);
INSERT INTO "role_permissions" VALUES(10,144);
INSERT INTO "role_permissions" VALUES(17,144);
INSERT INTO "role_permissions" VALUES(3,145);
INSERT INTO "role_permissions" VALUES(10,145);
INSERT INTO "role_permissions" VALUES(17,145);
INSERT INTO "role_permissions" VALUES(3,146);
INSERT INTO "role_permissions" VALUES(10,146);
INSERT INTO "role_permissions" VALUES(17,146);
INSERT INTO "role_permissions" VALUES(3,147);
INSERT INTO "role_permissions" VALUES(10,147);
INSERT INTO "role_permissions" VALUES(17,147);
INSERT INTO "role_permissions" VALUES(3,148);
INSERT INTO "role_permissions" VALUES(10,148);
INSERT INTO "role_permissions" VALUES(17,148);
INSERT INTO "role_permissions" VALUES(3,149);
INSERT INTO "role_permissions" VALUES(10,149);
INSERT INTO "role_permissions" VALUES(17,149);
INSERT INTO "role_permissions" VALUES(3,150);
INSERT INTO "role_permissions" VALUES(10,150);
INSERT INTO "role_permissions" VALUES(17,150);
INSERT INTO "role_permissions" VALUES(3,151);
INSERT INTO "role_permissions" VALUES(10,151);
INSERT INTO "role_permissions" VALUES(17,151);
INSERT INTO "role_permissions" VALUES(3,152);
INSERT INTO "role_permissions" VALUES(10,152);
INSERT INTO "role_permissions" VALUES(17,152);
INSERT INTO "role_permissions" VALUES(3,153);
INSERT INTO "role_permissions" VALUES(10,153);
INSERT INTO "role_permissions" VALUES(17,153);
INSERT INTO "role_permissions" VALUES(3,154);
INSERT INTO "role_permissions" VALUES(10,154);
INSERT INTO "role_permissions" VALUES(17,154);
INSERT INTO "role_permissions" VALUES(3,155);
INSERT INTO "role_permissions" VALUES(10,155);
INSERT INTO "role_permissions" VALUES(17,155);
INSERT INTO "role_permissions" VALUES(3,156);
INSERT INTO "role_permissions" VALUES(10,156);
INSERT INTO "role_permissions" VALUES(17,156);
INSERT INTO "role_permissions" VALUES(3,157);
INSERT INTO "role_permissions" VALUES(10,157);
INSERT INTO "role_permissions" VALUES(17,157);
INSERT INTO "role_permissions" VALUES(3,158);
INSERT INTO "role_permissions" VALUES(10,158);
INSERT INTO "role_permissions" VALUES(17,158);
INSERT INTO "role_permissions" VALUES(3,159);
INSERT INTO "role_permissions" VALUES(10,159);
INSERT INTO "role_permissions" VALUES(17,159);
INSERT INTO "role_permissions" VALUES(3,160);
INSERT INTO "role_permissions" VALUES(10,160);
INSERT INTO "role_permissions" VALUES(17,160);
INSERT INTO "role_permissions" VALUES(3,161);
INSERT INTO "role_permissions" VALUES(10,161);
INSERT INTO "role_permissions" VALUES(17,161);
INSERT INTO "role_permissions" VALUES(3,162);
INSERT INTO "role_permissions" VALUES(10,162);
INSERT INTO "role_permissions" VALUES(17,162);
INSERT INTO "role_permissions" VALUES(3,163);
INSERT INTO "role_permissions" VALUES(10,163);
INSERT INTO "role_permissions" VALUES(17,163);
INSERT INTO "role_permissions" VALUES(3,164);
INSERT INTO "role_permissions" VALUES(10,164);
INSERT INTO "role_permissions" VALUES(17,164);
INSERT INTO "role_permissions" VALUES(3,165);
INSERT INTO "role_permissions" VALUES(10,165);
INSERT INTO "role_permissions" VALUES(17,165);
INSERT INTO "role_permissions" VALUES(3,166);
INSERT INTO "role_permissions" VALUES(10,166);
INSERT INTO "role_permissions" VALUES(17,166);
INSERT INTO "role_permissions" VALUES(3,167);
INSERT INTO "role_permissions" VALUES(10,167);
INSERT INTO "role_permissions" VALUES(17,167);
INSERT INTO "role_permissions" VALUES(3,168);
INSERT INTO "role_permissions" VALUES(10,168);
INSERT INTO "role_permissions" VALUES(17,168);
INSERT INTO "role_permissions" VALUES(3,169);
INSERT INTO "role_permissions" VALUES(10,169);
INSERT INTO "role_permissions" VALUES(17,169);
INSERT INTO "role_permissions" VALUES(3,170);
INSERT INTO "role_permissions" VALUES(10,170);
INSERT INTO "role_permissions" VALUES(17,170);
INSERT INTO "role_permissions" VALUES(3,171);
INSERT INTO "role_permissions" VALUES(10,171);
INSERT INTO "role_permissions" VALUES(17,171);
INSERT INTO "role_permissions" VALUES(3,172);
INSERT INTO "role_permissions" VALUES(10,172);
INSERT INTO "role_permissions" VALUES(17,172);
INSERT INTO "role_permissions" VALUES(3,173);
INSERT INTO "role_permissions" VALUES(10,173);
INSERT INTO "role_permissions" VALUES(17,173);
INSERT INTO "role_permissions" VALUES(3,174);
INSERT INTO "role_permissions" VALUES(10,174);
INSERT INTO "role_permissions" VALUES(17,174);
INSERT INTO "role_permissions" VALUES(3,175);
INSERT INTO "role_permissions" VALUES(10,175);
INSERT INTO "role_permissions" VALUES(17,175);
INSERT INTO "role_permissions" VALUES(3,176);
INSERT INTO "role_permissions" VALUES(10,176);
INSERT INTO "role_permissions" VALUES(17,176);
INSERT INTO "role_permissions" VALUES(3,177);
INSERT INTO "role_permissions" VALUES(10,177);
INSERT INTO "role_permissions" VALUES(17,177);
INSERT INTO "role_permissions" VALUES(3,178);
INSERT INTO "role_permissions" VALUES(10,178);
INSERT INTO "role_permissions" VALUES(17,178);
INSERT INTO "role_permissions" VALUES(3,179);
INSERT INTO "role_permissions" VALUES(10,179);
INSERT INTO "role_permissions" VALUES(17,179);
INSERT INTO "role_permissions" VALUES(3,180);
INSERT INTO "role_permissions" VALUES(10,180);
INSERT INTO "role_permissions" VALUES(17,180);
INSERT INTO "role_permissions" VALUES(3,181);
INSERT INTO "role_permissions" VALUES(10,181);
INSERT INTO "role_permissions" VALUES(17,181);
INSERT INTO "role_permissions" VALUES(3,182);
INSERT INTO "role_permissions" VALUES(10,182);
INSERT INTO "role_permissions" VALUES(17,182);
INSERT INTO "role_permissions" VALUES(3,183);
INSERT INTO "role_permissions" VALUES(10,183);
INSERT INTO "role_permissions" VALUES(17,183);
INSERT INTO "role_permissions" VALUES(3,184);
INSERT INTO "role_permissions" VALUES(10,184);
INSERT INTO "role_permissions" VALUES(17,184);
INSERT INTO "role_permissions" VALUES(3,185);
INSERT INTO "role_permissions" VALUES(10,185);
INSERT INTO "role_permissions" VALUES(17,185);
INSERT INTO "role_permissions" VALUES(3,186);
INSERT INTO "role_permissions" VALUES(10,186);
INSERT INTO "role_permissions" VALUES(17,186);
INSERT INTO "role_permissions" VALUES(3,187);
INSERT INTO "role_permissions" VALUES(10,187);
INSERT INTO "role_permissions" VALUES(17,187);
INSERT INTO "role_permissions" VALUES(3,188);
INSERT INTO "role_permissions" VALUES(10,188);
INSERT INTO "role_permissions" VALUES(17,188);
INSERT INTO "role_permissions" VALUES(3,189);
INSERT INTO "role_permissions" VALUES(10,189);
INSERT INTO "role_permissions" VALUES(17,189);
INSERT INTO "role_permissions" VALUES(1,1);
INSERT INTO "role_permissions" VALUES(1,2);
INSERT INTO "role_permissions" VALUES(1,3);
INSERT INTO "role_permissions" VALUES(1,4);
INSERT INTO "role_permissions" VALUES(1,5);
INSERT INTO "role_permissions" VALUES(1,6);
INSERT INTO "role_permissions" VALUES(1,7);
INSERT INTO "role_permissions" VALUES(1,8);
INSERT INTO "role_permissions" VALUES(1,9);
INSERT INTO "role_permissions" VALUES(1,10);
INSERT INTO "role_permissions" VALUES(1,11);
INSERT INTO "role_permissions" VALUES(1,12);
INSERT INTO "role_permissions" VALUES(1,13);
INSERT INTO "role_permissions" VALUES(1,14);
INSERT INTO "role_permissions" VALUES(1,15);
INSERT INTO "role_permissions" VALUES(1,16);
INSERT INTO "role_permissions" VALUES(1,17);
INSERT INTO "role_permissions" VALUES(1,18);
INSERT INTO "role_permissions" VALUES(1,19);
INSERT INTO "role_permissions" VALUES(1,20);
INSERT INTO "role_permissions" VALUES(1,21);
INSERT INTO "role_permissions" VALUES(1,22);
INSERT INTO "role_permissions" VALUES(1,23);
INSERT INTO "role_permissions" VALUES(1,24);
INSERT INTO "role_permissions" VALUES(1,25);
INSERT INTO "role_permissions" VALUES(1,26);
INSERT INTO "role_permissions" VALUES(1,27);
INSERT INTO "role_permissions" VALUES(1,28);
INSERT INTO "role_permissions" VALUES(1,29);
INSERT INTO "role_permissions" VALUES(1,30);
INSERT INTO "role_permissions" VALUES(1,31);
INSERT INTO "role_permissions" VALUES(1,32);
INSERT INTO "role_permissions" VALUES(1,33);
INSERT INTO "role_permissions" VALUES(1,34);
INSERT INTO "role_permissions" VALUES(1,35);
INSERT INTO "role_permissions" VALUES(1,36);
INSERT INTO "role_permissions" VALUES(1,37);
INSERT INTO "role_permissions" VALUES(1,38);
INSERT INTO "role_permissions" VALUES(1,39);
INSERT INTO "role_permissions" VALUES(1,40);
INSERT INTO "role_permissions" VALUES(1,41);
INSERT INTO "role_permissions" VALUES(1,42);
INSERT INTO "role_permissions" VALUES(1,43);
INSERT INTO "role_permissions" VALUES(1,44);
INSERT INTO "role_permissions" VALUES(1,45);
INSERT INTO "role_permissions" VALUES(1,46);
INSERT INTO "role_permissions" VALUES(1,47);
INSERT INTO "role_permissions" VALUES(1,48);
INSERT INTO "role_permissions" VALUES(1,49);
INSERT INTO "role_permissions" VALUES(1,50);
INSERT INTO "role_permissions" VALUES(1,51);
INSERT INTO "role_permissions" VALUES(1,52);
INSERT INTO "role_permissions" VALUES(1,53);
INSERT INTO "role_permissions" VALUES(1,54);
INSERT INTO "role_permissions" VALUES(1,55);
INSERT INTO "role_permissions" VALUES(1,56);
INSERT INTO "role_permissions" VALUES(1,57);
INSERT INTO "role_permissions" VALUES(1,58);
INSERT INTO "role_permissions" VALUES(1,59);
INSERT INTO "role_permissions" VALUES(1,60);
INSERT INTO "role_permissions" VALUES(1,61);
INSERT INTO "role_permissions" VALUES(1,62);
INSERT INTO "role_permissions" VALUES(1,63);
INSERT INTO "role_permissions" VALUES(1,64);
INSERT INTO "role_permissions" VALUES(1,65);
INSERT INTO "role_permissions" VALUES(1,66);
INSERT INTO "role_permissions" VALUES(1,67);
INSERT INTO "role_permissions" VALUES(1,68);
INSERT INTO "role_permissions" VALUES(1,69);
INSERT INTO "role_permissions" VALUES(1,70);
INSERT INTO "role_permissions" VALUES(1,71);
INSERT INTO "role_permissions" VALUES(1,72);
INSERT INTO "role_permissions" VALUES(1,73);
INSERT INTO "role_permissions" VALUES(1,74);
INSERT INTO "role_permissions" VALUES(1,75);
INSERT INTO "role_permissions" VALUES(1,76);
INSERT INTO "role_permissions" VALUES(1,77);
INSERT INTO "role_permissions" VALUES(1,78);
INSERT INTO "role_permissions" VALUES(1,79);
INSERT INTO "role_permissions" VALUES(1,80);
INSERT INTO "role_permissions" VALUES(1,81);
INSERT INTO "role_permissions" VALUES(1,82);
INSERT INTO "role_permissions" VALUES(1,83);
INSERT INTO "role_permissions" VALUES(1,84);
INSERT INTO "role_permissions" VALUES(1,85);
INSERT INTO "role_permissions" VALUES(1,86);
INSERT INTO "role_permissions" VALUES(1,87);
INSERT INTO "role_permissions" VALUES(1,88);
INSERT INTO "role_permissions" VALUES(1,89);
INSERT INTO "role_permissions" VALUES(1,90);
INSERT INTO "role_permissions" VALUES(1,91);
INSERT INTO "role_permissions" VALUES(1,92);
INSERT INTO "role_permissions" VALUES(1,93);
INSERT INTO "role_permissions" VALUES(1,94);
INSERT INTO "role_permissions" VALUES(1,95);
INSERT INTO "role_permissions" VALUES(1,96);
INSERT INTO "role_permissions" VALUES(1,97);
INSERT INTO "role_permissions" VALUES(1,98);
INSERT INTO "role_permissions" VALUES(1,99);
INSERT INTO "role_permissions" VALUES(1,100);
INSERT INTO "role_permissions" VALUES(1,101);
INSERT INTO "role_permissions" VALUES(1,102);
INSERT INTO "role_permissions" VALUES(1,103);
INSERT INTO "role_permissions" VALUES(1,104);
INSERT INTO "role_permissions" VALUES(1,105);
INSERT INTO "role_permissions" VALUES(1,106);
INSERT INTO "role_permissions" VALUES(1,107);
INSERT INTO "role_permissions" VALUES(1,108);
INSERT INTO "role_permissions" VALUES(1,109);
INSERT INTO "role_permissions" VALUES(1,110);
INSERT INTO "role_permissions" VALUES(1,111);
INSERT INTO "role_permissions" VALUES(1,112);
INSERT INTO "role_permissions" VALUES(1,113);
INSERT INTO "role_permissions" VALUES(1,114);
INSERT INTO "role_permissions" VALUES(1,115);
INSERT INTO "role_permissions" VALUES(1,116);
INSERT INTO "role_permissions" VALUES(1,117);
INSERT INTO "role_permissions" VALUES(1,118);
INSERT INTO "role_permissions" VALUES(1,119);
INSERT INTO "role_permissions" VALUES(1,120);
INSERT INTO "role_permissions" VALUES(1,121);
INSERT INTO "role_permissions" VALUES(1,122);
INSERT INTO "role_permissions" VALUES(1,123);
INSERT INTO "role_permissions" VALUES(1,124);
INSERT INTO "role_permissions" VALUES(1,125);
INSERT INTO "role_permissions" VALUES(1,126);
INSERT INTO "role_permissions" VALUES(1,127);
INSERT INTO "role_permissions" VALUES(1,128);
INSERT INTO "role_permissions" VALUES(1,129);
INSERT INTO "role_permissions" VALUES(1,130);
INSERT INTO "role_permissions" VALUES(1,131);
INSERT INTO "role_permissions" VALUES(1,132);
INSERT INTO "role_permissions" VALUES(1,133);
INSERT INTO "role_permissions" VALUES(1,134);
INSERT INTO "role_permissions" VALUES(1,135);
INSERT INTO "role_permissions" VALUES(1,136);
INSERT INTO "role_permissions" VALUES(1,137);
INSERT INTO "role_permissions" VALUES(1,138);
INSERT INTO "role_permissions" VALUES(1,139);
INSERT INTO "role_permissions" VALUES(1,140);
INSERT INTO "role_permissions" VALUES(1,141);
INSERT INTO "role_permissions" VALUES(1,142);
INSERT INTO "role_permissions" VALUES(1,143);
INSERT INTO "role_permissions" VALUES(1,144);
INSERT INTO "role_permissions" VALUES(1,145);
INSERT INTO "role_permissions" VALUES(1,146);
INSERT INTO "role_permissions" VALUES(1,147);
INSERT INTO "role_permissions" VALUES(1,148);
INSERT INTO "role_permissions" VALUES(1,149);
INSERT INTO "role_permissions" VALUES(1,150);
INSERT INTO "role_permissions" VALUES(1,151);
INSERT INTO "role_permissions" VALUES(1,152);
INSERT INTO "role_permissions" VALUES(1,153);
INSERT INTO "role_permissions" VALUES(1,154);
INSERT INTO "role_permissions" VALUES(1,155);
INSERT INTO "role_permissions" VALUES(1,156);
INSERT INTO "role_permissions" VALUES(1,157);
INSERT INTO "role_permissions" VALUES(1,158);
INSERT INTO "role_permissions" VALUES(1,159);
INSERT INTO "role_permissions" VALUES(1,160);
INSERT INTO "role_permissions" VALUES(1,161);
INSERT INTO "role_permissions" VALUES(1,162);
INSERT INTO "role_permissions" VALUES(1,163);
INSERT INTO "role_permissions" VALUES(1,164);
INSERT INTO "role_permissions" VALUES(1,165);
INSERT INTO "role_permissions" VALUES(1,166);
INSERT INTO "role_permissions" VALUES(1,167);
INSERT INTO "role_permissions" VALUES(1,168);
INSERT INTO "role_permissions" VALUES(1,169);
INSERT INTO "role_permissions" VALUES(1,170);
INSERT INTO "role_permissions" VALUES(1,171);
INSERT INTO "role_permissions" VALUES(1,172);
INSERT INTO "role_permissions" VALUES(1,173);
INSERT INTO "role_permissions" VALUES(1,174);
INSERT INTO "role_permissions" VALUES(1,175);
INSERT INTO "role_permissions" VALUES(1,176);
INSERT INTO "role_permissions" VALUES(1,177);
INSERT INTO "role_permissions" VALUES(1,178);
INSERT INTO "role_permissions" VALUES(1,179);
INSERT INTO "role_permissions" VALUES(1,180);
INSERT INTO "role_permissions" VALUES(1,181);
INSERT INTO "role_permissions" VALUES(1,182);
INSERT INTO "role_permissions" VALUES(1,183);
INSERT INTO "role_permissions" VALUES(1,184);
INSERT INTO "role_permissions" VALUES(1,185);
INSERT INTO "role_permissions" VALUES(1,186);
INSERT INTO "role_permissions" VALUES(1,187);
INSERT INTO "role_permissions" VALUES(1,188);
INSERT INTO "role_permissions" VALUES(1,189);
INSERT INTO "role_permissions" VALUES(1,190);
INSERT INTO "role_permissions" VALUES(1,191);
INSERT INTO "role_permissions" VALUES(1,192);
INSERT INTO "role_permissions" VALUES(1,193);
INSERT INTO "role_permissions" VALUES(1,194);
INSERT INTO "role_permissions" VALUES(1,195);
INSERT INTO "role_permissions" VALUES(1,196);
INSERT INTO "role_permissions" VALUES(1,197);
INSERT INTO "role_permissions" VALUES(1,198);
INSERT INTO "role_permissions" VALUES(1,199);
INSERT INTO "role_permissions" VALUES(1,200);
INSERT INTO "role_permissions" VALUES(1,201);
INSERT INTO "role_permissions" VALUES(1,202);
INSERT INTO "role_permissions" VALUES(1,203);
INSERT INTO "role_permissions" VALUES(1,204);
INSERT INTO "role_permissions" VALUES(1,205);
INSERT INTO "role_permissions" VALUES(1,206);
INSERT INTO "role_permissions" VALUES(1,207);
INSERT INTO "role_permissions" VALUES(1,208);
INSERT INTO "role_permissions" VALUES(1,209);
INSERT INTO "role_permissions" VALUES(1,210);
INSERT INTO "role_permissions" VALUES(1,211);
INSERT INTO "role_permissions" VALUES(1,212);
INSERT INTO "role_permissions" VALUES(1,213);
INSERT INTO "role_permissions" VALUES(1,214);
INSERT INTO "role_permissions" VALUES(1,215);
INSERT INTO "role_permissions" VALUES(1,216);
INSERT INTO "role_permissions" VALUES(1,217);
INSERT INTO "role_permissions" VALUES(1,218);
INSERT INTO "role_permissions" VALUES(1,219);
INSERT INTO "role_permissions" VALUES(1,220);
INSERT INTO "role_permissions" VALUES(1,221);
INSERT INTO "role_permissions" VALUES(1,222);
INSERT INTO "role_permissions" VALUES(1,223);
INSERT INTO "role_permissions" VALUES(1,224);
INSERT INTO "role_permissions" VALUES(1,225);
INSERT INTO "role_permissions" VALUES(1,226);
INSERT INTO "role_permissions" VALUES(1,227);
INSERT INTO "role_permissions" VALUES(1,228);
INSERT INTO "role_permissions" VALUES(1,229);
INSERT INTO "role_permissions" VALUES(1,230);
INSERT INTO "role_permissions" VALUES(1,231);
INSERT INTO "role_permissions" VALUES(1,232);
INSERT INTO "role_permissions" VALUES(1,233);
INSERT INTO "role_permissions" VALUES(1,234);
INSERT INTO "role_permissions" VALUES(1,235);
INSERT INTO "role_permissions" VALUES(1,236);
INSERT INTO "role_permissions" VALUES(1,237);
INSERT INTO "role_permissions" VALUES(1,238);
INSERT INTO "role_permissions" VALUES(1,239);
INSERT INTO "role_permissions" VALUES(1,240);
INSERT INTO "role_permissions" VALUES(1,241);
INSERT INTO "role_permissions" VALUES(1,242);
INSERT INTO "role_permissions" VALUES(1,243);
INSERT INTO "role_permissions" VALUES(1,244);
INSERT INTO "role_permissions" VALUES(1,245);
INSERT INTO "role_permissions" VALUES(1,246);
INSERT INTO "role_permissions" VALUES(1,247);
INSERT INTO "role_permissions" VALUES(1,248);
INSERT INTO "role_permissions" VALUES(1,249);
INSERT INTO "role_permissions" VALUES(1,250);
INSERT INTO "role_permissions" VALUES(1,251);
INSERT INTO "role_permissions" VALUES(1,252);
INSERT INTO "role_permissions" VALUES(2,1);
INSERT INTO "role_permissions" VALUES(2,2);
INSERT INTO "role_permissions" VALUES(2,3);
INSERT INTO "role_permissions" VALUES(2,4);
INSERT INTO "role_permissions" VALUES(2,5);
INSERT INTO "role_permissions" VALUES(2,6);
INSERT INTO "role_permissions" VALUES(2,7);
INSERT INTO "role_permissions" VALUES(2,8);
INSERT INTO "role_permissions" VALUES(2,9);
INSERT INTO "role_permissions" VALUES(2,10);
INSERT INTO "role_permissions" VALUES(2,11);
INSERT INTO "role_permissions" VALUES(2,12);
INSERT INTO "role_permissions" VALUES(2,13);
INSERT INTO "role_permissions" VALUES(2,14);
INSERT INTO "role_permissions" VALUES(2,15);
INSERT INTO "role_permissions" VALUES(2,16);
INSERT INTO "role_permissions" VALUES(2,17);
INSERT INTO "role_permissions" VALUES(2,18);
INSERT INTO "role_permissions" VALUES(2,19);
INSERT INTO "role_permissions" VALUES(2,20);
INSERT INTO "role_permissions" VALUES(2,21);
INSERT INTO "role_permissions" VALUES(2,22);
INSERT INTO "role_permissions" VALUES(2,23);
INSERT INTO "role_permissions" VALUES(2,24);
INSERT INTO "role_permissions" VALUES(2,25);
INSERT INTO "role_permissions" VALUES(2,26);
INSERT INTO "role_permissions" VALUES(2,27);
INSERT INTO "role_permissions" VALUES(2,28);
INSERT INTO "role_permissions" VALUES(2,29);
INSERT INTO "role_permissions" VALUES(2,30);
INSERT INTO "role_permissions" VALUES(2,31);
INSERT INTO "role_permissions" VALUES(2,32);
INSERT INTO "role_permissions" VALUES(2,33);
INSERT INTO "role_permissions" VALUES(2,34);
INSERT INTO "role_permissions" VALUES(2,35);
INSERT INTO "role_permissions" VALUES(2,36);
INSERT INTO "role_permissions" VALUES(2,37);
INSERT INTO "role_permissions" VALUES(2,38);
INSERT INTO "role_permissions" VALUES(2,39);
INSERT INTO "role_permissions" VALUES(2,40);
INSERT INTO "role_permissions" VALUES(2,41);
INSERT INTO "role_permissions" VALUES(2,42);
INSERT INTO "role_permissions" VALUES(2,43);
INSERT INTO "role_permissions" VALUES(2,44);
INSERT INTO "role_permissions" VALUES(2,45);
INSERT INTO "role_permissions" VALUES(2,46);
INSERT INTO "role_permissions" VALUES(2,47);
INSERT INTO "role_permissions" VALUES(2,48);
INSERT INTO "role_permissions" VALUES(2,49);
INSERT INTO "role_permissions" VALUES(2,50);
INSERT INTO "role_permissions" VALUES(2,51);
INSERT INTO "role_permissions" VALUES(2,52);
INSERT INTO "role_permissions" VALUES(2,53);
INSERT INTO "role_permissions" VALUES(2,54);
INSERT INTO "role_permissions" VALUES(2,55);
INSERT INTO "role_permissions" VALUES(2,56);
INSERT INTO "role_permissions" VALUES(2,57);
INSERT INTO "role_permissions" VALUES(2,58);
INSERT INTO "role_permissions" VALUES(2,59);
INSERT INTO "role_permissions" VALUES(2,60);
INSERT INTO "role_permissions" VALUES(2,61);
INSERT INTO "role_permissions" VALUES(2,62);
INSERT INTO "role_permissions" VALUES(2,63);
INSERT INTO "role_permissions" VALUES(2,64);
INSERT INTO "role_permissions" VALUES(2,65);
INSERT INTO "role_permissions" VALUES(2,66);
INSERT INTO "role_permissions" VALUES(2,67);
INSERT INTO "role_permissions" VALUES(2,68);
INSERT INTO "role_permissions" VALUES(2,69);
INSERT INTO "role_permissions" VALUES(2,70);
INSERT INTO "role_permissions" VALUES(2,71);
INSERT INTO "role_permissions" VALUES(2,72);
INSERT INTO "role_permissions" VALUES(2,73);
INSERT INTO "role_permissions" VALUES(2,74);
INSERT INTO "role_permissions" VALUES(2,75);
INSERT INTO "role_permissions" VALUES(2,76);
INSERT INTO "role_permissions" VALUES(2,77);
INSERT INTO "role_permissions" VALUES(2,78);
INSERT INTO "role_permissions" VALUES(2,79);
INSERT INTO "role_permissions" VALUES(2,80);
INSERT INTO "role_permissions" VALUES(2,81);
INSERT INTO "role_permissions" VALUES(2,82);
INSERT INTO "role_permissions" VALUES(2,83);
INSERT INTO "role_permissions" VALUES(2,84);
INSERT INTO "role_permissions" VALUES(2,85);
INSERT INTO "role_permissions" VALUES(2,86);
INSERT INTO "role_permissions" VALUES(2,87);
INSERT INTO "role_permissions" VALUES(2,88);
INSERT INTO "role_permissions" VALUES(2,89);
INSERT INTO "role_permissions" VALUES(2,90);
INSERT INTO "role_permissions" VALUES(2,91);
INSERT INTO "role_permissions" VALUES(2,92);
INSERT INTO "role_permissions" VALUES(2,93);
INSERT INTO "role_permissions" VALUES(2,94);
INSERT INTO "role_permissions" VALUES(2,95);
INSERT INTO "role_permissions" VALUES(2,96);
INSERT INTO "role_permissions" VALUES(2,97);
INSERT INTO "role_permissions" VALUES(2,98);
INSERT INTO "role_permissions" VALUES(2,99);
INSERT INTO "role_permissions" VALUES(2,100);
INSERT INTO "role_permissions" VALUES(2,101);
INSERT INTO "role_permissions" VALUES(2,102);
INSERT INTO "role_permissions" VALUES(2,103);
INSERT INTO "role_permissions" VALUES(2,104);
INSERT INTO "role_permissions" VALUES(2,105);
INSERT INTO "role_permissions" VALUES(2,106);
INSERT INTO "role_permissions" VALUES(2,107);
INSERT INTO "role_permissions" VALUES(2,108);
INSERT INTO "role_permissions" VALUES(2,109);
INSERT INTO "role_permissions" VALUES(2,110);
INSERT INTO "role_permissions" VALUES(2,111);
INSERT INTO "role_permissions" VALUES(2,112);
INSERT INTO "role_permissions" VALUES(2,113);
INSERT INTO "role_permissions" VALUES(2,114);
INSERT INTO "role_permissions" VALUES(2,115);
INSERT INTO "role_permissions" VALUES(2,116);
INSERT INTO "role_permissions" VALUES(2,117);
INSERT INTO "role_permissions" VALUES(2,118);
INSERT INTO "role_permissions" VALUES(2,119);
INSERT INTO "role_permissions" VALUES(2,120);
INSERT INTO "role_permissions" VALUES(2,121);
INSERT INTO "role_permissions" VALUES(2,122);
INSERT INTO "role_permissions" VALUES(2,123);
INSERT INTO "role_permissions" VALUES(2,124);
INSERT INTO "role_permissions" VALUES(2,125);
INSERT INTO "role_permissions" VALUES(2,126);
INSERT INTO "role_permissions" VALUES(2,127);
INSERT INTO "role_permissions" VALUES(2,128);
INSERT INTO "role_permissions" VALUES(2,129);
INSERT INTO "role_permissions" VALUES(2,130);
INSERT INTO "role_permissions" VALUES(2,131);
INSERT INTO "role_permissions" VALUES(2,132);
INSERT INTO "role_permissions" VALUES(2,133);
INSERT INTO "role_permissions" VALUES(2,134);
INSERT INTO "role_permissions" VALUES(2,135);
INSERT INTO "role_permissions" VALUES(2,136);
INSERT INTO "role_permissions" VALUES(2,137);
INSERT INTO "role_permissions" VALUES(2,138);
INSERT INTO "role_permissions" VALUES(2,139);
INSERT INTO "role_permissions" VALUES(2,140);
INSERT INTO "role_permissions" VALUES(2,141);
INSERT INTO "role_permissions" VALUES(2,142);
INSERT INTO "role_permissions" VALUES(2,143);
INSERT INTO "role_permissions" VALUES(2,144);
INSERT INTO "role_permissions" VALUES(2,145);
INSERT INTO "role_permissions" VALUES(2,146);
INSERT INTO "role_permissions" VALUES(2,147);
INSERT INTO "role_permissions" VALUES(2,148);
INSERT INTO "role_permissions" VALUES(2,149);
INSERT INTO "role_permissions" VALUES(2,150);
INSERT INTO "role_permissions" VALUES(2,151);
INSERT INTO "role_permissions" VALUES(2,152);
INSERT INTO "role_permissions" VALUES(2,153);
INSERT INTO "role_permissions" VALUES(2,154);
INSERT INTO "role_permissions" VALUES(2,155);
INSERT INTO "role_permissions" VALUES(2,156);
INSERT INTO "role_permissions" VALUES(2,157);
INSERT INTO "role_permissions" VALUES(2,158);
INSERT INTO "role_permissions" VALUES(2,159);
INSERT INTO "role_permissions" VALUES(2,160);
INSERT INTO "role_permissions" VALUES(2,161);
INSERT INTO "role_permissions" VALUES(2,162);
INSERT INTO "role_permissions" VALUES(2,163);
INSERT INTO "role_permissions" VALUES(2,164);
INSERT INTO "role_permissions" VALUES(2,165);
INSERT INTO "role_permissions" VALUES(2,166);
INSERT INTO "role_permissions" VALUES(2,167);
INSERT INTO "role_permissions" VALUES(2,168);
INSERT INTO "role_permissions" VALUES(2,169);
INSERT INTO "role_permissions" VALUES(2,170);
INSERT INTO "role_permissions" VALUES(2,171);
INSERT INTO "role_permissions" VALUES(2,172);
INSERT INTO "role_permissions" VALUES(2,173);
INSERT INTO "role_permissions" VALUES(2,174);
INSERT INTO "role_permissions" VALUES(2,175);
INSERT INTO "role_permissions" VALUES(2,176);
INSERT INTO "role_permissions" VALUES(2,177);
INSERT INTO "role_permissions" VALUES(2,178);
INSERT INTO "role_permissions" VALUES(2,179);
INSERT INTO "role_permissions" VALUES(2,180);
INSERT INTO "role_permissions" VALUES(2,181);
INSERT INTO "role_permissions" VALUES(2,182);
INSERT INTO "role_permissions" VALUES(2,183);
INSERT INTO "role_permissions" VALUES(2,184);
INSERT INTO "role_permissions" VALUES(2,185);
INSERT INTO "role_permissions" VALUES(2,186);
INSERT INTO "role_permissions" VALUES(2,187);
INSERT INTO "role_permissions" VALUES(2,188);
INSERT INTO "role_permissions" VALUES(2,189);
INSERT INTO "role_permissions" VALUES(2,190);
INSERT INTO "role_permissions" VALUES(2,191);
INSERT INTO "role_permissions" VALUES(2,192);
INSERT INTO "role_permissions" VALUES(2,193);
INSERT INTO "role_permissions" VALUES(2,194);
INSERT INTO "role_permissions" VALUES(2,195);
INSERT INTO "role_permissions" VALUES(2,196);
INSERT INTO "role_permissions" VALUES(2,197);
INSERT INTO "role_permissions" VALUES(2,198);
INSERT INTO "role_permissions" VALUES(2,199);
INSERT INTO "role_permissions" VALUES(2,200);
INSERT INTO "role_permissions" VALUES(2,201);
INSERT INTO "role_permissions" VALUES(2,202);
INSERT INTO "role_permissions" VALUES(2,203);
INSERT INTO "role_permissions" VALUES(2,204);
INSERT INTO "role_permissions" VALUES(2,205);
INSERT INTO "role_permissions" VALUES(2,206);
INSERT INTO "role_permissions" VALUES(2,207);
INSERT INTO "role_permissions" VALUES(2,208);
INSERT INTO "role_permissions" VALUES(2,209);
INSERT INTO "role_permissions" VALUES(2,210);
INSERT INTO "role_permissions" VALUES(2,211);
INSERT INTO "role_permissions" VALUES(2,212);
INSERT INTO "role_permissions" VALUES(2,213);
INSERT INTO "role_permissions" VALUES(2,214);
INSERT INTO "role_permissions" VALUES(2,215);
INSERT INTO "role_permissions" VALUES(2,216);
INSERT INTO "role_permissions" VALUES(2,217);
INSERT INTO "role_permissions" VALUES(2,218);
INSERT INTO "role_permissions" VALUES(2,219);
INSERT INTO "role_permissions" VALUES(2,220);
INSERT INTO "role_permissions" VALUES(2,221);
INSERT INTO "role_permissions" VALUES(2,222);
INSERT INTO "role_permissions" VALUES(2,223);
INSERT INTO "role_permissions" VALUES(2,224);
INSERT INTO "role_permissions" VALUES(2,225);
INSERT INTO "role_permissions" VALUES(2,226);
INSERT INTO "role_permissions" VALUES(2,227);
INSERT INTO "role_permissions" VALUES(2,228);
INSERT INTO "role_permissions" VALUES(2,229);
INSERT INTO "role_permissions" VALUES(2,230);
INSERT INTO "role_permissions" VALUES(2,231);
INSERT INTO "role_permissions" VALUES(2,232);
INSERT INTO "role_permissions" VALUES(2,233);
INSERT INTO "role_permissions" VALUES(2,234);
INSERT INTO "role_permissions" VALUES(2,235);
INSERT INTO "role_permissions" VALUES(2,236);
INSERT INTO "role_permissions" VALUES(2,237);
INSERT INTO "role_permissions" VALUES(2,238);
INSERT INTO "role_permissions" VALUES(2,239);
INSERT INTO "role_permissions" VALUES(2,240);
INSERT INTO "role_permissions" VALUES(2,241);
INSERT INTO "role_permissions" VALUES(2,242);
INSERT INTO "role_permissions" VALUES(2,243);
INSERT INTO "role_permissions" VALUES(2,244);
INSERT INTO "role_permissions" VALUES(2,245);
INSERT INTO "role_permissions" VALUES(2,246);
INSERT INTO "role_permissions" VALUES(2,247);
INSERT INTO "role_permissions" VALUES(2,248);
INSERT INTO "role_permissions" VALUES(2,249);
INSERT INTO "role_permissions" VALUES(2,250);
INSERT INTO "role_permissions" VALUES(2,251);
INSERT INTO "role_permissions" VALUES(2,252);
INSERT INTO "role_permissions" VALUES(8,1);
INSERT INTO "role_permissions" VALUES(8,2);
INSERT INTO "role_permissions" VALUES(8,3);
INSERT INTO "role_permissions" VALUES(8,4);
INSERT INTO "role_permissions" VALUES(8,5);
INSERT INTO "role_permissions" VALUES(8,6);
INSERT INTO "role_permissions" VALUES(8,7);
INSERT INTO "role_permissions" VALUES(8,8);
INSERT INTO "role_permissions" VALUES(8,9);
INSERT INTO "role_permissions" VALUES(8,10);
INSERT INTO "role_permissions" VALUES(8,11);
INSERT INTO "role_permissions" VALUES(8,12);
INSERT INTO "role_permissions" VALUES(8,13);
INSERT INTO "role_permissions" VALUES(8,14);
INSERT INTO "role_permissions" VALUES(8,15);
INSERT INTO "role_permissions" VALUES(8,16);
INSERT INTO "role_permissions" VALUES(8,17);
INSERT INTO "role_permissions" VALUES(8,18);
INSERT INTO "role_permissions" VALUES(8,19);
INSERT INTO "role_permissions" VALUES(8,20);
INSERT INTO "role_permissions" VALUES(8,21);
INSERT INTO "role_permissions" VALUES(8,22);
INSERT INTO "role_permissions" VALUES(8,23);
INSERT INTO "role_permissions" VALUES(8,24);
INSERT INTO "role_permissions" VALUES(8,25);
INSERT INTO "role_permissions" VALUES(8,26);
INSERT INTO "role_permissions" VALUES(8,27);
INSERT INTO "role_permissions" VALUES(8,28);
INSERT INTO "role_permissions" VALUES(8,29);
INSERT INTO "role_permissions" VALUES(8,30);
INSERT INTO "role_permissions" VALUES(8,31);
INSERT INTO "role_permissions" VALUES(8,32);
INSERT INTO "role_permissions" VALUES(8,33);
INSERT INTO "role_permissions" VALUES(8,34);
INSERT INTO "role_permissions" VALUES(8,35);
INSERT INTO "role_permissions" VALUES(8,36);
INSERT INTO "role_permissions" VALUES(8,37);
INSERT INTO "role_permissions" VALUES(8,38);
INSERT INTO "role_permissions" VALUES(8,39);
INSERT INTO "role_permissions" VALUES(8,40);
INSERT INTO "role_permissions" VALUES(8,41);
INSERT INTO "role_permissions" VALUES(8,42);
INSERT INTO "role_permissions" VALUES(8,43);
INSERT INTO "role_permissions" VALUES(8,44);
INSERT INTO "role_permissions" VALUES(8,45);
INSERT INTO "role_permissions" VALUES(8,46);
INSERT INTO "role_permissions" VALUES(8,47);
INSERT INTO "role_permissions" VALUES(8,48);
INSERT INTO "role_permissions" VALUES(8,49);
INSERT INTO "role_permissions" VALUES(8,50);
INSERT INTO "role_permissions" VALUES(8,51);
INSERT INTO "role_permissions" VALUES(8,52);
INSERT INTO "role_permissions" VALUES(8,53);
INSERT INTO "role_permissions" VALUES(8,54);
INSERT INTO "role_permissions" VALUES(8,55);
INSERT INTO "role_permissions" VALUES(8,56);
INSERT INTO "role_permissions" VALUES(8,57);
INSERT INTO "role_permissions" VALUES(8,58);
INSERT INTO "role_permissions" VALUES(8,59);
INSERT INTO "role_permissions" VALUES(8,60);
INSERT INTO "role_permissions" VALUES(8,61);
INSERT INTO "role_permissions" VALUES(8,62);
INSERT INTO "role_permissions" VALUES(8,63);
INSERT INTO "role_permissions" VALUES(8,64);
INSERT INTO "role_permissions" VALUES(8,65);
INSERT INTO "role_permissions" VALUES(8,66);
INSERT INTO "role_permissions" VALUES(8,67);
INSERT INTO "role_permissions" VALUES(8,68);
INSERT INTO "role_permissions" VALUES(8,69);
INSERT INTO "role_permissions" VALUES(8,70);
INSERT INTO "role_permissions" VALUES(8,71);
INSERT INTO "role_permissions" VALUES(8,72);
INSERT INTO "role_permissions" VALUES(8,73);
INSERT INTO "role_permissions" VALUES(8,74);
INSERT INTO "role_permissions" VALUES(8,75);
INSERT INTO "role_permissions" VALUES(8,76);
INSERT INTO "role_permissions" VALUES(8,77);
INSERT INTO "role_permissions" VALUES(8,78);
INSERT INTO "role_permissions" VALUES(8,79);
INSERT INTO "role_permissions" VALUES(8,80);
INSERT INTO "role_permissions" VALUES(8,81);
INSERT INTO "role_permissions" VALUES(8,82);
INSERT INTO "role_permissions" VALUES(8,83);
INSERT INTO "role_permissions" VALUES(8,84);
INSERT INTO "role_permissions" VALUES(8,85);
INSERT INTO "role_permissions" VALUES(8,86);
INSERT INTO "role_permissions" VALUES(8,87);
INSERT INTO "role_permissions" VALUES(8,88);
INSERT INTO "role_permissions" VALUES(8,89);
INSERT INTO "role_permissions" VALUES(8,90);
INSERT INTO "role_permissions" VALUES(8,91);
INSERT INTO "role_permissions" VALUES(8,92);
INSERT INTO "role_permissions" VALUES(8,93);
INSERT INTO "role_permissions" VALUES(8,94);
INSERT INTO "role_permissions" VALUES(8,95);
INSERT INTO "role_permissions" VALUES(8,96);
INSERT INTO "role_permissions" VALUES(8,97);
INSERT INTO "role_permissions" VALUES(8,98);
INSERT INTO "role_permissions" VALUES(8,99);
INSERT INTO "role_permissions" VALUES(8,100);
INSERT INTO "role_permissions" VALUES(8,101);
INSERT INTO "role_permissions" VALUES(8,102);
INSERT INTO "role_permissions" VALUES(8,103);
INSERT INTO "role_permissions" VALUES(8,104);
INSERT INTO "role_permissions" VALUES(8,105);
INSERT INTO "role_permissions" VALUES(8,106);
INSERT INTO "role_permissions" VALUES(8,107);
INSERT INTO "role_permissions" VALUES(8,108);
INSERT INTO "role_permissions" VALUES(8,109);
INSERT INTO "role_permissions" VALUES(8,110);
INSERT INTO "role_permissions" VALUES(8,111);
INSERT INTO "role_permissions" VALUES(8,112);
INSERT INTO "role_permissions" VALUES(8,113);
INSERT INTO "role_permissions" VALUES(8,114);
INSERT INTO "role_permissions" VALUES(8,115);
INSERT INTO "role_permissions" VALUES(8,116);
INSERT INTO "role_permissions" VALUES(8,117);
INSERT INTO "role_permissions" VALUES(8,118);
INSERT INTO "role_permissions" VALUES(8,119);
INSERT INTO "role_permissions" VALUES(8,120);
INSERT INTO "role_permissions" VALUES(8,121);
INSERT INTO "role_permissions" VALUES(8,122);
INSERT INTO "role_permissions" VALUES(8,123);
INSERT INTO "role_permissions" VALUES(8,124);
INSERT INTO "role_permissions" VALUES(8,125);
INSERT INTO "role_permissions" VALUES(8,126);
INSERT INTO "role_permissions" VALUES(8,127);
INSERT INTO "role_permissions" VALUES(8,128);
INSERT INTO "role_permissions" VALUES(8,129);
INSERT INTO "role_permissions" VALUES(8,130);
INSERT INTO "role_permissions" VALUES(8,131);
INSERT INTO "role_permissions" VALUES(8,132);
INSERT INTO "role_permissions" VALUES(8,133);
INSERT INTO "role_permissions" VALUES(8,134);
INSERT INTO "role_permissions" VALUES(8,135);
INSERT INTO "role_permissions" VALUES(8,136);
INSERT INTO "role_permissions" VALUES(8,137);
INSERT INTO "role_permissions" VALUES(8,138);
INSERT INTO "role_permissions" VALUES(8,139);
INSERT INTO "role_permissions" VALUES(8,140);
INSERT INTO "role_permissions" VALUES(8,141);
INSERT INTO "role_permissions" VALUES(8,142);
INSERT INTO "role_permissions" VALUES(8,143);
INSERT INTO "role_permissions" VALUES(8,144);
INSERT INTO "role_permissions" VALUES(8,145);
INSERT INTO "role_permissions" VALUES(8,146);
INSERT INTO "role_permissions" VALUES(8,147);
INSERT INTO "role_permissions" VALUES(8,148);
INSERT INTO "role_permissions" VALUES(8,149);
INSERT INTO "role_permissions" VALUES(8,150);
INSERT INTO "role_permissions" VALUES(8,151);
INSERT INTO "role_permissions" VALUES(8,152);
INSERT INTO "role_permissions" VALUES(8,153);
INSERT INTO "role_permissions" VALUES(8,154);
INSERT INTO "role_permissions" VALUES(8,155);
INSERT INTO "role_permissions" VALUES(8,156);
INSERT INTO "role_permissions" VALUES(8,157);
INSERT INTO "role_permissions" VALUES(8,158);
INSERT INTO "role_permissions" VALUES(8,159);
INSERT INTO "role_permissions" VALUES(8,160);
INSERT INTO "role_permissions" VALUES(8,161);
INSERT INTO "role_permissions" VALUES(8,162);
INSERT INTO "role_permissions" VALUES(8,163);
INSERT INTO "role_permissions" VALUES(8,164);
INSERT INTO "role_permissions" VALUES(8,165);
INSERT INTO "role_permissions" VALUES(8,166);
INSERT INTO "role_permissions" VALUES(8,167);
INSERT INTO "role_permissions" VALUES(8,168);
INSERT INTO "role_permissions" VALUES(8,169);
INSERT INTO "role_permissions" VALUES(8,170);
INSERT INTO "role_permissions" VALUES(8,171);
INSERT INTO "role_permissions" VALUES(8,172);
INSERT INTO "role_permissions" VALUES(8,173);
INSERT INTO "role_permissions" VALUES(8,174);
INSERT INTO "role_permissions" VALUES(8,175);
INSERT INTO "role_permissions" VALUES(8,176);
INSERT INTO "role_permissions" VALUES(8,177);
INSERT INTO "role_permissions" VALUES(8,178);
INSERT INTO "role_permissions" VALUES(8,179);
INSERT INTO "role_permissions" VALUES(8,180);
INSERT INTO "role_permissions" VALUES(8,181);
INSERT INTO "role_permissions" VALUES(8,182);
INSERT INTO "role_permissions" VALUES(8,183);
INSERT INTO "role_permissions" VALUES(8,184);
INSERT INTO "role_permissions" VALUES(8,185);
INSERT INTO "role_permissions" VALUES(8,186);
INSERT INTO "role_permissions" VALUES(8,187);
INSERT INTO "role_permissions" VALUES(8,188);
INSERT INTO "role_permissions" VALUES(8,189);
INSERT INTO "role_permissions" VALUES(8,190);
INSERT INTO "role_permissions" VALUES(8,191);
INSERT INTO "role_permissions" VALUES(8,192);
INSERT INTO "role_permissions" VALUES(8,193);
INSERT INTO "role_permissions" VALUES(8,194);
INSERT INTO "role_permissions" VALUES(8,195);
INSERT INTO "role_permissions" VALUES(8,196);
INSERT INTO "role_permissions" VALUES(8,197);
INSERT INTO "role_permissions" VALUES(8,198);
INSERT INTO "role_permissions" VALUES(8,199);
INSERT INTO "role_permissions" VALUES(8,200);
INSERT INTO "role_permissions" VALUES(8,201);
INSERT INTO "role_permissions" VALUES(8,202);
INSERT INTO "role_permissions" VALUES(8,203);
INSERT INTO "role_permissions" VALUES(8,204);
INSERT INTO "role_permissions" VALUES(8,205);
INSERT INTO "role_permissions" VALUES(8,206);
INSERT INTO "role_permissions" VALUES(8,207);
INSERT INTO "role_permissions" VALUES(8,208);
INSERT INTO "role_permissions" VALUES(8,209);
INSERT INTO "role_permissions" VALUES(8,210);
INSERT INTO "role_permissions" VALUES(8,211);
INSERT INTO "role_permissions" VALUES(8,212);
INSERT INTO "role_permissions" VALUES(8,213);
INSERT INTO "role_permissions" VALUES(8,214);
INSERT INTO "role_permissions" VALUES(8,215);
INSERT INTO "role_permissions" VALUES(8,216);
INSERT INTO "role_permissions" VALUES(8,217);
INSERT INTO "role_permissions" VALUES(8,218);
INSERT INTO "role_permissions" VALUES(8,219);
INSERT INTO "role_permissions" VALUES(8,220);
INSERT INTO "role_permissions" VALUES(8,221);
INSERT INTO "role_permissions" VALUES(8,222);
INSERT INTO "role_permissions" VALUES(8,223);
INSERT INTO "role_permissions" VALUES(8,224);
INSERT INTO "role_permissions" VALUES(8,225);
INSERT INTO "role_permissions" VALUES(8,226);
INSERT INTO "role_permissions" VALUES(8,227);
INSERT INTO "role_permissions" VALUES(8,228);
INSERT INTO "role_permissions" VALUES(8,229);
INSERT INTO "role_permissions" VALUES(8,230);
INSERT INTO "role_permissions" VALUES(8,231);
INSERT INTO "role_permissions" VALUES(8,232);
INSERT INTO "role_permissions" VALUES(8,233);
INSERT INTO "role_permissions" VALUES(8,234);
INSERT INTO "role_permissions" VALUES(8,235);
INSERT INTO "role_permissions" VALUES(8,236);
INSERT INTO "role_permissions" VALUES(8,237);
INSERT INTO "role_permissions" VALUES(8,238);
INSERT INTO "role_permissions" VALUES(8,239);
INSERT INTO "role_permissions" VALUES(8,240);
INSERT INTO "role_permissions" VALUES(8,241);
INSERT INTO "role_permissions" VALUES(8,242);
INSERT INTO "role_permissions" VALUES(8,243);
INSERT INTO "role_permissions" VALUES(8,244);
INSERT INTO "role_permissions" VALUES(8,245);
INSERT INTO "role_permissions" VALUES(8,246);
INSERT INTO "role_permissions" VALUES(8,247);
INSERT INTO "role_permissions" VALUES(8,248);
INSERT INTO "role_permissions" VALUES(8,249);
INSERT INTO "role_permissions" VALUES(8,250);
INSERT INTO "role_permissions" VALUES(8,251);
INSERT INTO "role_permissions" VALUES(8,252);
INSERT INTO "role_permissions" VALUES(9,1);
INSERT INTO "role_permissions" VALUES(9,2);
INSERT INTO "role_permissions" VALUES(9,3);
INSERT INTO "role_permissions" VALUES(9,4);
INSERT INTO "role_permissions" VALUES(9,5);
INSERT INTO "role_permissions" VALUES(9,6);
INSERT INTO "role_permissions" VALUES(9,7);
INSERT INTO "role_permissions" VALUES(9,8);
INSERT INTO "role_permissions" VALUES(9,9);
INSERT INTO "role_permissions" VALUES(9,10);
INSERT INTO "role_permissions" VALUES(9,11);
INSERT INTO "role_permissions" VALUES(9,12);
INSERT INTO "role_permissions" VALUES(9,13);
INSERT INTO "role_permissions" VALUES(9,14);
INSERT INTO "role_permissions" VALUES(9,15);
INSERT INTO "role_permissions" VALUES(9,16);
INSERT INTO "role_permissions" VALUES(9,17);
INSERT INTO "role_permissions" VALUES(9,18);
INSERT INTO "role_permissions" VALUES(9,19);
INSERT INTO "role_permissions" VALUES(9,20);
INSERT INTO "role_permissions" VALUES(9,21);
INSERT INTO "role_permissions" VALUES(9,22);
INSERT INTO "role_permissions" VALUES(9,23);
INSERT INTO "role_permissions" VALUES(9,24);
INSERT INTO "role_permissions" VALUES(9,25);
INSERT INTO "role_permissions" VALUES(9,26);
INSERT INTO "role_permissions" VALUES(9,27);
INSERT INTO "role_permissions" VALUES(9,28);
INSERT INTO "role_permissions" VALUES(9,29);
INSERT INTO "role_permissions" VALUES(9,30);
INSERT INTO "role_permissions" VALUES(9,31);
INSERT INTO "role_permissions" VALUES(9,32);
INSERT INTO "role_permissions" VALUES(9,33);
INSERT INTO "role_permissions" VALUES(9,34);
INSERT INTO "role_permissions" VALUES(9,35);
INSERT INTO "role_permissions" VALUES(9,36);
INSERT INTO "role_permissions" VALUES(9,37);
INSERT INTO "role_permissions" VALUES(9,38);
INSERT INTO "role_permissions" VALUES(9,39);
INSERT INTO "role_permissions" VALUES(9,40);
INSERT INTO "role_permissions" VALUES(9,41);
INSERT INTO "role_permissions" VALUES(9,42);
INSERT INTO "role_permissions" VALUES(9,43);
INSERT INTO "role_permissions" VALUES(9,44);
INSERT INTO "role_permissions" VALUES(9,45);
INSERT INTO "role_permissions" VALUES(9,46);
INSERT INTO "role_permissions" VALUES(9,47);
INSERT INTO "role_permissions" VALUES(9,48);
INSERT INTO "role_permissions" VALUES(9,49);
INSERT INTO "role_permissions" VALUES(9,50);
INSERT INTO "role_permissions" VALUES(9,51);
INSERT INTO "role_permissions" VALUES(9,52);
INSERT INTO "role_permissions" VALUES(9,53);
INSERT INTO "role_permissions" VALUES(9,54);
INSERT INTO "role_permissions" VALUES(9,55);
INSERT INTO "role_permissions" VALUES(9,56);
INSERT INTO "role_permissions" VALUES(9,57);
INSERT INTO "role_permissions" VALUES(9,58);
INSERT INTO "role_permissions" VALUES(9,59);
INSERT INTO "role_permissions" VALUES(9,60);
INSERT INTO "role_permissions" VALUES(9,61);
INSERT INTO "role_permissions" VALUES(9,62);
INSERT INTO "role_permissions" VALUES(9,63);
INSERT INTO "role_permissions" VALUES(9,64);
INSERT INTO "role_permissions" VALUES(9,65);
INSERT INTO "role_permissions" VALUES(9,66);
INSERT INTO "role_permissions" VALUES(9,67);
INSERT INTO "role_permissions" VALUES(9,68);
INSERT INTO "role_permissions" VALUES(9,69);
INSERT INTO "role_permissions" VALUES(9,70);
INSERT INTO "role_permissions" VALUES(9,71);
INSERT INTO "role_permissions" VALUES(9,72);
INSERT INTO "role_permissions" VALUES(9,73);
INSERT INTO "role_permissions" VALUES(9,74);
INSERT INTO "role_permissions" VALUES(9,75);
INSERT INTO "role_permissions" VALUES(9,76);
INSERT INTO "role_permissions" VALUES(9,77);
INSERT INTO "role_permissions" VALUES(9,78);
INSERT INTO "role_permissions" VALUES(9,79);
INSERT INTO "role_permissions" VALUES(9,80);
INSERT INTO "role_permissions" VALUES(9,81);
INSERT INTO "role_permissions" VALUES(9,82);
INSERT INTO "role_permissions" VALUES(9,83);
INSERT INTO "role_permissions" VALUES(9,84);
INSERT INTO "role_permissions" VALUES(9,85);
INSERT INTO "role_permissions" VALUES(9,86);
INSERT INTO "role_permissions" VALUES(9,87);
INSERT INTO "role_permissions" VALUES(9,88);
INSERT INTO "role_permissions" VALUES(9,89);
INSERT INTO "role_permissions" VALUES(9,90);
INSERT INTO "role_permissions" VALUES(9,91);
INSERT INTO "role_permissions" VALUES(9,92);
INSERT INTO "role_permissions" VALUES(9,93);
INSERT INTO "role_permissions" VALUES(9,94);
INSERT INTO "role_permissions" VALUES(9,95);
INSERT INTO "role_permissions" VALUES(9,96);
INSERT INTO "role_permissions" VALUES(9,97);
INSERT INTO "role_permissions" VALUES(9,98);
INSERT INTO "role_permissions" VALUES(9,99);
INSERT INTO "role_permissions" VALUES(9,100);
INSERT INTO "role_permissions" VALUES(9,101);
INSERT INTO "role_permissions" VALUES(9,102);
INSERT INTO "role_permissions" VALUES(9,103);
INSERT INTO "role_permissions" VALUES(9,104);
INSERT INTO "role_permissions" VALUES(9,105);
INSERT INTO "role_permissions" VALUES(9,106);
INSERT INTO "role_permissions" VALUES(9,107);
INSERT INTO "role_permissions" VALUES(9,108);
INSERT INTO "role_permissions" VALUES(9,109);
INSERT INTO "role_permissions" VALUES(9,110);
INSERT INTO "role_permissions" VALUES(9,111);
INSERT INTO "role_permissions" VALUES(9,112);
INSERT INTO "role_permissions" VALUES(9,113);
INSERT INTO "role_permissions" VALUES(9,114);
INSERT INTO "role_permissions" VALUES(9,115);
INSERT INTO "role_permissions" VALUES(9,116);
INSERT INTO "role_permissions" VALUES(9,117);
INSERT INTO "role_permissions" VALUES(9,118);
INSERT INTO "role_permissions" VALUES(9,119);
INSERT INTO "role_permissions" VALUES(9,120);
INSERT INTO "role_permissions" VALUES(9,121);
INSERT INTO "role_permissions" VALUES(9,122);
INSERT INTO "role_permissions" VALUES(9,123);
INSERT INTO "role_permissions" VALUES(9,124);
INSERT INTO "role_permissions" VALUES(9,125);
INSERT INTO "role_permissions" VALUES(9,126);
INSERT INTO "role_permissions" VALUES(9,127);
INSERT INTO "role_permissions" VALUES(9,128);
INSERT INTO "role_permissions" VALUES(9,129);
INSERT INTO "role_permissions" VALUES(9,130);
INSERT INTO "role_permissions" VALUES(9,131);
INSERT INTO "role_permissions" VALUES(9,132);
INSERT INTO "role_permissions" VALUES(9,133);
INSERT INTO "role_permissions" VALUES(9,134);
INSERT INTO "role_permissions" VALUES(9,135);
INSERT INTO "role_permissions" VALUES(9,136);
INSERT INTO "role_permissions" VALUES(9,137);
INSERT INTO "role_permissions" VALUES(9,138);
INSERT INTO "role_permissions" VALUES(9,139);
INSERT INTO "role_permissions" VALUES(9,140);
INSERT INTO "role_permissions" VALUES(9,141);
INSERT INTO "role_permissions" VALUES(9,142);
INSERT INTO "role_permissions" VALUES(9,143);
INSERT INTO "role_permissions" VALUES(9,144);
INSERT INTO "role_permissions" VALUES(9,145);
INSERT INTO "role_permissions" VALUES(9,146);
INSERT INTO "role_permissions" VALUES(9,147);
INSERT INTO "role_permissions" VALUES(9,148);
INSERT INTO "role_permissions" VALUES(9,149);
INSERT INTO "role_permissions" VALUES(9,150);
INSERT INTO "role_permissions" VALUES(9,151);
INSERT INTO "role_permissions" VALUES(9,152);
INSERT INTO "role_permissions" VALUES(9,153);
INSERT INTO "role_permissions" VALUES(9,154);
INSERT INTO "role_permissions" VALUES(9,155);
INSERT INTO "role_permissions" VALUES(9,156);
INSERT INTO "role_permissions" VALUES(9,157);
INSERT INTO "role_permissions" VALUES(9,158);
INSERT INTO "role_permissions" VALUES(9,159);
INSERT INTO "role_permissions" VALUES(9,160);
INSERT INTO "role_permissions" VALUES(9,161);
INSERT INTO "role_permissions" VALUES(9,162);
INSERT INTO "role_permissions" VALUES(9,163);
INSERT INTO "role_permissions" VALUES(9,164);
INSERT INTO "role_permissions" VALUES(9,165);
INSERT INTO "role_permissions" VALUES(9,166);
INSERT INTO "role_permissions" VALUES(9,167);
INSERT INTO "role_permissions" VALUES(9,168);
INSERT INTO "role_permissions" VALUES(9,169);
INSERT INTO "role_permissions" VALUES(9,170);
INSERT INTO "role_permissions" VALUES(9,171);
INSERT INTO "role_permissions" VALUES(9,172);
INSERT INTO "role_permissions" VALUES(9,173);
INSERT INTO "role_permissions" VALUES(9,174);
INSERT INTO "role_permissions" VALUES(9,175);
INSERT INTO "role_permissions" VALUES(9,176);
INSERT INTO "role_permissions" VALUES(9,177);
INSERT INTO "role_permissions" VALUES(9,178);
INSERT INTO "role_permissions" VALUES(9,179);
INSERT INTO "role_permissions" VALUES(9,180);
INSERT INTO "role_permissions" VALUES(9,181);
INSERT INTO "role_permissions" VALUES(9,182);
INSERT INTO "role_permissions" VALUES(9,183);
INSERT INTO "role_permissions" VALUES(9,184);
INSERT INTO "role_permissions" VALUES(9,185);
INSERT INTO "role_permissions" VALUES(9,186);
INSERT INTO "role_permissions" VALUES(9,187);
INSERT INTO "role_permissions" VALUES(9,188);
INSERT INTO "role_permissions" VALUES(9,189);
INSERT INTO "role_permissions" VALUES(9,190);
INSERT INTO "role_permissions" VALUES(9,191);
INSERT INTO "role_permissions" VALUES(9,192);
INSERT INTO "role_permissions" VALUES(9,193);
INSERT INTO "role_permissions" VALUES(9,194);
INSERT INTO "role_permissions" VALUES(9,195);
INSERT INTO "role_permissions" VALUES(9,196);
INSERT INTO "role_permissions" VALUES(9,197);
INSERT INTO "role_permissions" VALUES(9,198);
INSERT INTO "role_permissions" VALUES(9,199);
INSERT INTO "role_permissions" VALUES(9,200);
INSERT INTO "role_permissions" VALUES(9,201);
INSERT INTO "role_permissions" VALUES(9,202);
INSERT INTO "role_permissions" VALUES(9,203);
INSERT INTO "role_permissions" VALUES(9,204);
INSERT INTO "role_permissions" VALUES(9,205);
INSERT INTO "role_permissions" VALUES(9,206);
INSERT INTO "role_permissions" VALUES(9,207);
INSERT INTO "role_permissions" VALUES(9,208);
INSERT INTO "role_permissions" VALUES(9,209);
INSERT INTO "role_permissions" VALUES(9,210);
INSERT INTO "role_permissions" VALUES(9,211);
INSERT INTO "role_permissions" VALUES(9,212);
INSERT INTO "role_permissions" VALUES(9,213);
INSERT INTO "role_permissions" VALUES(9,214);
INSERT INTO "role_permissions" VALUES(9,215);
INSERT INTO "role_permissions" VALUES(9,216);
INSERT INTO "role_permissions" VALUES(9,217);
INSERT INTO "role_permissions" VALUES(9,218);
INSERT INTO "role_permissions" VALUES(9,219);
INSERT INTO "role_permissions" VALUES(9,220);
INSERT INTO "role_permissions" VALUES(9,221);
INSERT INTO "role_permissions" VALUES(9,222);
INSERT INTO "role_permissions" VALUES(9,223);
INSERT INTO "role_permissions" VALUES(9,224);
INSERT INTO "role_permissions" VALUES(9,225);
INSERT INTO "role_permissions" VALUES(9,226);
INSERT INTO "role_permissions" VALUES(9,227);
INSERT INTO "role_permissions" VALUES(9,228);
INSERT INTO "role_permissions" VALUES(9,229);
INSERT INTO "role_permissions" VALUES(9,230);
INSERT INTO "role_permissions" VALUES(9,231);
INSERT INTO "role_permissions" VALUES(9,232);
INSERT INTO "role_permissions" VALUES(9,233);
INSERT INTO "role_permissions" VALUES(9,234);
INSERT INTO "role_permissions" VALUES(9,235);
INSERT INTO "role_permissions" VALUES(9,236);
INSERT INTO "role_permissions" VALUES(9,237);
INSERT INTO "role_permissions" VALUES(9,238);
INSERT INTO "role_permissions" VALUES(9,239);
INSERT INTO "role_permissions" VALUES(9,240);
INSERT INTO "role_permissions" VALUES(9,241);
INSERT INTO "role_permissions" VALUES(9,242);
INSERT INTO "role_permissions" VALUES(9,243);
INSERT INTO "role_permissions" VALUES(9,244);
INSERT INTO "role_permissions" VALUES(9,245);
INSERT INTO "role_permissions" VALUES(9,246);
INSERT INTO "role_permissions" VALUES(9,247);
INSERT INTO "role_permissions" VALUES(9,248);
INSERT INTO "role_permissions" VALUES(9,249);
INSERT INTO "role_permissions" VALUES(9,250);
INSERT INTO "role_permissions" VALUES(9,251);
INSERT INTO "role_permissions" VALUES(9,252);
INSERT INTO "role_permissions" VALUES(15,1);
INSERT INTO "role_permissions" VALUES(15,2);
INSERT INTO "role_permissions" VALUES(15,3);
INSERT INTO "role_permissions" VALUES(15,4);
INSERT INTO "role_permissions" VALUES(15,5);
INSERT INTO "role_permissions" VALUES(15,6);
INSERT INTO "role_permissions" VALUES(15,7);
INSERT INTO "role_permissions" VALUES(15,8);
INSERT INTO "role_permissions" VALUES(15,9);
INSERT INTO "role_permissions" VALUES(15,10);
INSERT INTO "role_permissions" VALUES(15,11);
INSERT INTO "role_permissions" VALUES(15,12);
INSERT INTO "role_permissions" VALUES(15,13);
INSERT INTO "role_permissions" VALUES(15,14);
INSERT INTO "role_permissions" VALUES(15,15);
INSERT INTO "role_permissions" VALUES(15,16);
INSERT INTO "role_permissions" VALUES(15,17);
INSERT INTO "role_permissions" VALUES(15,18);
INSERT INTO "role_permissions" VALUES(15,19);
INSERT INTO "role_permissions" VALUES(15,20);
INSERT INTO "role_permissions" VALUES(15,21);
INSERT INTO "role_permissions" VALUES(15,22);
INSERT INTO "role_permissions" VALUES(15,23);
INSERT INTO "role_permissions" VALUES(15,24);
INSERT INTO "role_permissions" VALUES(15,25);
INSERT INTO "role_permissions" VALUES(15,26);
INSERT INTO "role_permissions" VALUES(15,27);
INSERT INTO "role_permissions" VALUES(15,28);
INSERT INTO "role_permissions" VALUES(15,29);
INSERT INTO "role_permissions" VALUES(15,30);
INSERT INTO "role_permissions" VALUES(15,31);
INSERT INTO "role_permissions" VALUES(15,32);
INSERT INTO "role_permissions" VALUES(15,33);
INSERT INTO "role_permissions" VALUES(15,34);
INSERT INTO "role_permissions" VALUES(15,35);
INSERT INTO "role_permissions" VALUES(15,36);
INSERT INTO "role_permissions" VALUES(15,37);
INSERT INTO "role_permissions" VALUES(15,38);
INSERT INTO "role_permissions" VALUES(15,39);
INSERT INTO "role_permissions" VALUES(15,40);
INSERT INTO "role_permissions" VALUES(15,41);
INSERT INTO "role_permissions" VALUES(15,42);
INSERT INTO "role_permissions" VALUES(15,43);
INSERT INTO "role_permissions" VALUES(15,44);
INSERT INTO "role_permissions" VALUES(15,45);
INSERT INTO "role_permissions" VALUES(15,46);
INSERT INTO "role_permissions" VALUES(15,47);
INSERT INTO "role_permissions" VALUES(15,48);
INSERT INTO "role_permissions" VALUES(15,49);
INSERT INTO "role_permissions" VALUES(15,50);
INSERT INTO "role_permissions" VALUES(15,51);
INSERT INTO "role_permissions" VALUES(15,52);
INSERT INTO "role_permissions" VALUES(15,53);
INSERT INTO "role_permissions" VALUES(15,54);
INSERT INTO "role_permissions" VALUES(15,55);
INSERT INTO "role_permissions" VALUES(15,56);
INSERT INTO "role_permissions" VALUES(15,57);
INSERT INTO "role_permissions" VALUES(15,58);
INSERT INTO "role_permissions" VALUES(15,59);
INSERT INTO "role_permissions" VALUES(15,60);
INSERT INTO "role_permissions" VALUES(15,61);
INSERT INTO "role_permissions" VALUES(15,62);
INSERT INTO "role_permissions" VALUES(15,63);
INSERT INTO "role_permissions" VALUES(15,64);
INSERT INTO "role_permissions" VALUES(15,65);
INSERT INTO "role_permissions" VALUES(15,66);
INSERT INTO "role_permissions" VALUES(15,67);
INSERT INTO "role_permissions" VALUES(15,68);
INSERT INTO "role_permissions" VALUES(15,69);
INSERT INTO "role_permissions" VALUES(15,70);
INSERT INTO "role_permissions" VALUES(15,71);
INSERT INTO "role_permissions" VALUES(15,72);
INSERT INTO "role_permissions" VALUES(15,73);
INSERT INTO "role_permissions" VALUES(15,74);
INSERT INTO "role_permissions" VALUES(15,75);
INSERT INTO "role_permissions" VALUES(15,76);
INSERT INTO "role_permissions" VALUES(15,77);
INSERT INTO "role_permissions" VALUES(15,78);
INSERT INTO "role_permissions" VALUES(15,79);
INSERT INTO "role_permissions" VALUES(15,80);
INSERT INTO "role_permissions" VALUES(15,81);
INSERT INTO "role_permissions" VALUES(15,82);
INSERT INTO "role_permissions" VALUES(15,83);
INSERT INTO "role_permissions" VALUES(15,84);
INSERT INTO "role_permissions" VALUES(15,85);
INSERT INTO "role_permissions" VALUES(15,86);
INSERT INTO "role_permissions" VALUES(15,87);
INSERT INTO "role_permissions" VALUES(15,88);
INSERT INTO "role_permissions" VALUES(15,89);
INSERT INTO "role_permissions" VALUES(15,90);
INSERT INTO "role_permissions" VALUES(15,91);
INSERT INTO "role_permissions" VALUES(15,92);
INSERT INTO "role_permissions" VALUES(15,93);
INSERT INTO "role_permissions" VALUES(15,94);
INSERT INTO "role_permissions" VALUES(15,95);
INSERT INTO "role_permissions" VALUES(15,96);
INSERT INTO "role_permissions" VALUES(15,97);
INSERT INTO "role_permissions" VALUES(15,98);
INSERT INTO "role_permissions" VALUES(15,99);
INSERT INTO "role_permissions" VALUES(15,100);
INSERT INTO "role_permissions" VALUES(15,101);
INSERT INTO "role_permissions" VALUES(15,102);
INSERT INTO "role_permissions" VALUES(15,103);
INSERT INTO "role_permissions" VALUES(15,104);
INSERT INTO "role_permissions" VALUES(15,105);
INSERT INTO "role_permissions" VALUES(15,106);
INSERT INTO "role_permissions" VALUES(15,107);
INSERT INTO "role_permissions" VALUES(15,108);
INSERT INTO "role_permissions" VALUES(15,109);
INSERT INTO "role_permissions" VALUES(15,110);
INSERT INTO "role_permissions" VALUES(15,111);
INSERT INTO "role_permissions" VALUES(15,112);
INSERT INTO "role_permissions" VALUES(15,113);
INSERT INTO "role_permissions" VALUES(15,114);
INSERT INTO "role_permissions" VALUES(15,115);
INSERT INTO "role_permissions" VALUES(15,116);
INSERT INTO "role_permissions" VALUES(15,117);
INSERT INTO "role_permissions" VALUES(15,118);
INSERT INTO "role_permissions" VALUES(15,119);
INSERT INTO "role_permissions" VALUES(15,120);
INSERT INTO "role_permissions" VALUES(15,121);
INSERT INTO "role_permissions" VALUES(15,122);
INSERT INTO "role_permissions" VALUES(15,123);
INSERT INTO "role_permissions" VALUES(15,124);
INSERT INTO "role_permissions" VALUES(15,125);
INSERT INTO "role_permissions" VALUES(15,126);
INSERT INTO "role_permissions" VALUES(15,127);
INSERT INTO "role_permissions" VALUES(15,128);
INSERT INTO "role_permissions" VALUES(15,129);
INSERT INTO "role_permissions" VALUES(15,130);
INSERT INTO "role_permissions" VALUES(15,131);
INSERT INTO "role_permissions" VALUES(15,132);
INSERT INTO "role_permissions" VALUES(15,133);
INSERT INTO "role_permissions" VALUES(15,134);
INSERT INTO "role_permissions" VALUES(15,135);
INSERT INTO "role_permissions" VALUES(15,136);
INSERT INTO "role_permissions" VALUES(15,137);
INSERT INTO "role_permissions" VALUES(15,138);
INSERT INTO "role_permissions" VALUES(15,139);
INSERT INTO "role_permissions" VALUES(15,140);
INSERT INTO "role_permissions" VALUES(15,141);
INSERT INTO "role_permissions" VALUES(15,142);
INSERT INTO "role_permissions" VALUES(15,143);
INSERT INTO "role_permissions" VALUES(15,144);
INSERT INTO "role_permissions" VALUES(15,145);
INSERT INTO "role_permissions" VALUES(15,146);
INSERT INTO "role_permissions" VALUES(15,147);
INSERT INTO "role_permissions" VALUES(15,148);
INSERT INTO "role_permissions" VALUES(15,149);
INSERT INTO "role_permissions" VALUES(15,150);
INSERT INTO "role_permissions" VALUES(15,151);
INSERT INTO "role_permissions" VALUES(15,152);
INSERT INTO "role_permissions" VALUES(15,153);
INSERT INTO "role_permissions" VALUES(15,154);
INSERT INTO "role_permissions" VALUES(15,155);
INSERT INTO "role_permissions" VALUES(15,156);
INSERT INTO "role_permissions" VALUES(15,157);
INSERT INTO "role_permissions" VALUES(15,158);
INSERT INTO "role_permissions" VALUES(15,159);
INSERT INTO "role_permissions" VALUES(15,160);
INSERT INTO "role_permissions" VALUES(15,161);
INSERT INTO "role_permissions" VALUES(15,162);
INSERT INTO "role_permissions" VALUES(15,163);
INSERT INTO "role_permissions" VALUES(15,164);
INSERT INTO "role_permissions" VALUES(15,165);
INSERT INTO "role_permissions" VALUES(15,166);
INSERT INTO "role_permissions" VALUES(15,167);
INSERT INTO "role_permissions" VALUES(15,168);
INSERT INTO "role_permissions" VALUES(15,169);
INSERT INTO "role_permissions" VALUES(15,170);
INSERT INTO "role_permissions" VALUES(15,171);
INSERT INTO "role_permissions" VALUES(15,172);
INSERT INTO "role_permissions" VALUES(15,173);
INSERT INTO "role_permissions" VALUES(15,174);
INSERT INTO "role_permissions" VALUES(15,175);
INSERT INTO "role_permissions" VALUES(15,176);
INSERT INTO "role_permissions" VALUES(15,177);
INSERT INTO "role_permissions" VALUES(15,178);
INSERT INTO "role_permissions" VALUES(15,179);
INSERT INTO "role_permissions" VALUES(15,180);
INSERT INTO "role_permissions" VALUES(15,181);
INSERT INTO "role_permissions" VALUES(15,182);
INSERT INTO "role_permissions" VALUES(15,183);
INSERT INTO "role_permissions" VALUES(15,184);
INSERT INTO "role_permissions" VALUES(15,185);
INSERT INTO "role_permissions" VALUES(15,186);
INSERT INTO "role_permissions" VALUES(15,187);
INSERT INTO "role_permissions" VALUES(15,188);
INSERT INTO "role_permissions" VALUES(15,189);
INSERT INTO "role_permissions" VALUES(15,190);
INSERT INTO "role_permissions" VALUES(15,191);
INSERT INTO "role_permissions" VALUES(15,192);
INSERT INTO "role_permissions" VALUES(15,193);
INSERT INTO "role_permissions" VALUES(15,194);
INSERT INTO "role_permissions" VALUES(15,195);
INSERT INTO "role_permissions" VALUES(15,196);
INSERT INTO "role_permissions" VALUES(15,197);
INSERT INTO "role_permissions" VALUES(15,198);
INSERT INTO "role_permissions" VALUES(15,199);
INSERT INTO "role_permissions" VALUES(15,200);
INSERT INTO "role_permissions" VALUES(15,201);
INSERT INTO "role_permissions" VALUES(15,202);
INSERT INTO "role_permissions" VALUES(15,203);
INSERT INTO "role_permissions" VALUES(15,204);
INSERT INTO "role_permissions" VALUES(15,205);
INSERT INTO "role_permissions" VALUES(15,206);
INSERT INTO "role_permissions" VALUES(15,207);
INSERT INTO "role_permissions" VALUES(15,208);
INSERT INTO "role_permissions" VALUES(15,209);
INSERT INTO "role_permissions" VALUES(15,210);
INSERT INTO "role_permissions" VALUES(15,211);
INSERT INTO "role_permissions" VALUES(15,212);
INSERT INTO "role_permissions" VALUES(15,213);
INSERT INTO "role_permissions" VALUES(15,214);
INSERT INTO "role_permissions" VALUES(15,215);
INSERT INTO "role_permissions" VALUES(15,216);
INSERT INTO "role_permissions" VALUES(15,217);
INSERT INTO "role_permissions" VALUES(15,218);
INSERT INTO "role_permissions" VALUES(15,219);
INSERT INTO "role_permissions" VALUES(15,220);
INSERT INTO "role_permissions" VALUES(15,221);
INSERT INTO "role_permissions" VALUES(15,222);
INSERT INTO "role_permissions" VALUES(15,223);
INSERT INTO "role_permissions" VALUES(15,224);
INSERT INTO "role_permissions" VALUES(15,225);
INSERT INTO "role_permissions" VALUES(15,226);
INSERT INTO "role_permissions" VALUES(15,227);
INSERT INTO "role_permissions" VALUES(15,228);
INSERT INTO "role_permissions" VALUES(15,229);
INSERT INTO "role_permissions" VALUES(15,230);
INSERT INTO "role_permissions" VALUES(15,231);
INSERT INTO "role_permissions" VALUES(15,232);
INSERT INTO "role_permissions" VALUES(15,233);
INSERT INTO "role_permissions" VALUES(15,234);
INSERT INTO "role_permissions" VALUES(15,235);
INSERT INTO "role_permissions" VALUES(15,236);
INSERT INTO "role_permissions" VALUES(15,237);
INSERT INTO "role_permissions" VALUES(15,238);
INSERT INTO "role_permissions" VALUES(15,239);
INSERT INTO "role_permissions" VALUES(15,240);
INSERT INTO "role_permissions" VALUES(15,241);
INSERT INTO "role_permissions" VALUES(15,242);
INSERT INTO "role_permissions" VALUES(15,243);
INSERT INTO "role_permissions" VALUES(15,244);
INSERT INTO "role_permissions" VALUES(15,245);
INSERT INTO "role_permissions" VALUES(15,246);
INSERT INTO "role_permissions" VALUES(15,247);
INSERT INTO "role_permissions" VALUES(15,248);
INSERT INTO "role_permissions" VALUES(15,249);
INSERT INTO "role_permissions" VALUES(15,250);
INSERT INTO "role_permissions" VALUES(15,251);
INSERT INTO "role_permissions" VALUES(15,252);
INSERT INTO "role_permissions" VALUES(16,1);
INSERT INTO "role_permissions" VALUES(16,2);
INSERT INTO "role_permissions" VALUES(16,3);
INSERT INTO "role_permissions" VALUES(16,4);
INSERT INTO "role_permissions" VALUES(16,5);
INSERT INTO "role_permissions" VALUES(16,6);
INSERT INTO "role_permissions" VALUES(16,7);
INSERT INTO "role_permissions" VALUES(16,8);
INSERT INTO "role_permissions" VALUES(16,9);
INSERT INTO "role_permissions" VALUES(16,10);
INSERT INTO "role_permissions" VALUES(16,11);
INSERT INTO "role_permissions" VALUES(16,12);
INSERT INTO "role_permissions" VALUES(16,13);
INSERT INTO "role_permissions" VALUES(16,14);
INSERT INTO "role_permissions" VALUES(16,15);
INSERT INTO "role_permissions" VALUES(16,16);
INSERT INTO "role_permissions" VALUES(16,17);
INSERT INTO "role_permissions" VALUES(16,18);
INSERT INTO "role_permissions" VALUES(16,19);
INSERT INTO "role_permissions" VALUES(16,20);
INSERT INTO "role_permissions" VALUES(16,21);
INSERT INTO "role_permissions" VALUES(16,22);
INSERT INTO "role_permissions" VALUES(16,23);
INSERT INTO "role_permissions" VALUES(16,24);
INSERT INTO "role_permissions" VALUES(16,25);
INSERT INTO "role_permissions" VALUES(16,26);
INSERT INTO "role_permissions" VALUES(16,27);
INSERT INTO "role_permissions" VALUES(16,28);
INSERT INTO "role_permissions" VALUES(16,29);
INSERT INTO "role_permissions" VALUES(16,30);
INSERT INTO "role_permissions" VALUES(16,31);
INSERT INTO "role_permissions" VALUES(16,32);
INSERT INTO "role_permissions" VALUES(16,33);
INSERT INTO "role_permissions" VALUES(16,34);
INSERT INTO "role_permissions" VALUES(16,35);
INSERT INTO "role_permissions" VALUES(16,36);
INSERT INTO "role_permissions" VALUES(16,37);
INSERT INTO "role_permissions" VALUES(16,38);
INSERT INTO "role_permissions" VALUES(16,39);
INSERT INTO "role_permissions" VALUES(16,40);
INSERT INTO "role_permissions" VALUES(16,41);
INSERT INTO "role_permissions" VALUES(16,42);
INSERT INTO "role_permissions" VALUES(16,43);
INSERT INTO "role_permissions" VALUES(16,44);
INSERT INTO "role_permissions" VALUES(16,45);
INSERT INTO "role_permissions" VALUES(16,46);
INSERT INTO "role_permissions" VALUES(16,47);
INSERT INTO "role_permissions" VALUES(16,48);
INSERT INTO "role_permissions" VALUES(16,49);
INSERT INTO "role_permissions" VALUES(16,50);
INSERT INTO "role_permissions" VALUES(16,51);
INSERT INTO "role_permissions" VALUES(16,52);
INSERT INTO "role_permissions" VALUES(16,53);
INSERT INTO "role_permissions" VALUES(16,54);
INSERT INTO "role_permissions" VALUES(16,55);
INSERT INTO "role_permissions" VALUES(16,56);
INSERT INTO "role_permissions" VALUES(16,57);
INSERT INTO "role_permissions" VALUES(16,58);
INSERT INTO "role_permissions" VALUES(16,59);
INSERT INTO "role_permissions" VALUES(16,60);
INSERT INTO "role_permissions" VALUES(16,61);
INSERT INTO "role_permissions" VALUES(16,62);
INSERT INTO "role_permissions" VALUES(16,63);
INSERT INTO "role_permissions" VALUES(16,64);
INSERT INTO "role_permissions" VALUES(16,65);
INSERT INTO "role_permissions" VALUES(16,66);
INSERT INTO "role_permissions" VALUES(16,67);
INSERT INTO "role_permissions" VALUES(16,68);
INSERT INTO "role_permissions" VALUES(16,69);
INSERT INTO "role_permissions" VALUES(16,70);
INSERT INTO "role_permissions" VALUES(16,71);
INSERT INTO "role_permissions" VALUES(16,72);
INSERT INTO "role_permissions" VALUES(16,73);
INSERT INTO "role_permissions" VALUES(16,74);
INSERT INTO "role_permissions" VALUES(16,75);
INSERT INTO "role_permissions" VALUES(16,76);
INSERT INTO "role_permissions" VALUES(16,77);
INSERT INTO "role_permissions" VALUES(16,78);
INSERT INTO "role_permissions" VALUES(16,79);
INSERT INTO "role_permissions" VALUES(16,80);
INSERT INTO "role_permissions" VALUES(16,81);
INSERT INTO "role_permissions" VALUES(16,82);
INSERT INTO "role_permissions" VALUES(16,83);
INSERT INTO "role_permissions" VALUES(16,84);
INSERT INTO "role_permissions" VALUES(16,85);
INSERT INTO "role_permissions" VALUES(16,86);
INSERT INTO "role_permissions" VALUES(16,87);
INSERT INTO "role_permissions" VALUES(16,88);
INSERT INTO "role_permissions" VALUES(16,89);
INSERT INTO "role_permissions" VALUES(16,90);
INSERT INTO "role_permissions" VALUES(16,91);
INSERT INTO "role_permissions" VALUES(16,92);
INSERT INTO "role_permissions" VALUES(16,93);
INSERT INTO "role_permissions" VALUES(16,94);
INSERT INTO "role_permissions" VALUES(16,95);
INSERT INTO "role_permissions" VALUES(16,96);
INSERT INTO "role_permissions" VALUES(16,97);
INSERT INTO "role_permissions" VALUES(16,98);
INSERT INTO "role_permissions" VALUES(16,99);
INSERT INTO "role_permissions" VALUES(16,100);
INSERT INTO "role_permissions" VALUES(16,101);
INSERT INTO "role_permissions" VALUES(16,102);
INSERT INTO "role_permissions" VALUES(16,103);
INSERT INTO "role_permissions" VALUES(16,104);
INSERT INTO "role_permissions" VALUES(16,105);
INSERT INTO "role_permissions" VALUES(16,106);
INSERT INTO "role_permissions" VALUES(16,107);
INSERT INTO "role_permissions" VALUES(16,108);
INSERT INTO "role_permissions" VALUES(16,109);
INSERT INTO "role_permissions" VALUES(16,110);
INSERT INTO "role_permissions" VALUES(16,111);
INSERT INTO "role_permissions" VALUES(16,112);
INSERT INTO "role_permissions" VALUES(16,113);
INSERT INTO "role_permissions" VALUES(16,114);
INSERT INTO "role_permissions" VALUES(16,115);
INSERT INTO "role_permissions" VALUES(16,116);
INSERT INTO "role_permissions" VALUES(16,117);
INSERT INTO "role_permissions" VALUES(16,118);
INSERT INTO "role_permissions" VALUES(16,119);
INSERT INTO "role_permissions" VALUES(16,120);
INSERT INTO "role_permissions" VALUES(16,121);
INSERT INTO "role_permissions" VALUES(16,122);
INSERT INTO "role_permissions" VALUES(16,123);
INSERT INTO "role_permissions" VALUES(16,124);
INSERT INTO "role_permissions" VALUES(16,125);
INSERT INTO "role_permissions" VALUES(16,126);
INSERT INTO "role_permissions" VALUES(16,127);
INSERT INTO "role_permissions" VALUES(16,128);
INSERT INTO "role_permissions" VALUES(16,129);
INSERT INTO "role_permissions" VALUES(16,130);
INSERT INTO "role_permissions" VALUES(16,131);
INSERT INTO "role_permissions" VALUES(16,132);
INSERT INTO "role_permissions" VALUES(16,133);
INSERT INTO "role_permissions" VALUES(16,134);
INSERT INTO "role_permissions" VALUES(16,135);
INSERT INTO "role_permissions" VALUES(16,136);
INSERT INTO "role_permissions" VALUES(16,137);
INSERT INTO "role_permissions" VALUES(16,138);
INSERT INTO "role_permissions" VALUES(16,139);
INSERT INTO "role_permissions" VALUES(16,140);
INSERT INTO "role_permissions" VALUES(16,141);
INSERT INTO "role_permissions" VALUES(16,142);
INSERT INTO "role_permissions" VALUES(16,143);
INSERT INTO "role_permissions" VALUES(16,144);
INSERT INTO "role_permissions" VALUES(16,145);
INSERT INTO "role_permissions" VALUES(16,146);
INSERT INTO "role_permissions" VALUES(16,147);
INSERT INTO "role_permissions" VALUES(16,148);
INSERT INTO "role_permissions" VALUES(16,149);
INSERT INTO "role_permissions" VALUES(16,150);
INSERT INTO "role_permissions" VALUES(16,151);
INSERT INTO "role_permissions" VALUES(16,152);
INSERT INTO "role_permissions" VALUES(16,153);
INSERT INTO "role_permissions" VALUES(16,154);
INSERT INTO "role_permissions" VALUES(16,155);
INSERT INTO "role_permissions" VALUES(16,156);
INSERT INTO "role_permissions" VALUES(16,157);
INSERT INTO "role_permissions" VALUES(16,158);
INSERT INTO "role_permissions" VALUES(16,159);
INSERT INTO "role_permissions" VALUES(16,160);
INSERT INTO "role_permissions" VALUES(16,161);
INSERT INTO "role_permissions" VALUES(16,162);
INSERT INTO "role_permissions" VALUES(16,163);
INSERT INTO "role_permissions" VALUES(16,164);
INSERT INTO "role_permissions" VALUES(16,165);
INSERT INTO "role_permissions" VALUES(16,166);
INSERT INTO "role_permissions" VALUES(16,167);
INSERT INTO "role_permissions" VALUES(16,168);
INSERT INTO "role_permissions" VALUES(16,169);
INSERT INTO "role_permissions" VALUES(16,170);
INSERT INTO "role_permissions" VALUES(16,171);
INSERT INTO "role_permissions" VALUES(16,172);
INSERT INTO "role_permissions" VALUES(16,173);
INSERT INTO "role_permissions" VALUES(16,174);
INSERT INTO "role_permissions" VALUES(16,175);
INSERT INTO "role_permissions" VALUES(16,176);
INSERT INTO "role_permissions" VALUES(16,177);
INSERT INTO "role_permissions" VALUES(16,178);
INSERT INTO "role_permissions" VALUES(16,179);
INSERT INTO "role_permissions" VALUES(16,180);
INSERT INTO "role_permissions" VALUES(16,181);
INSERT INTO "role_permissions" VALUES(16,182);
INSERT INTO "role_permissions" VALUES(16,183);
INSERT INTO "role_permissions" VALUES(16,184);
INSERT INTO "role_permissions" VALUES(16,185);
INSERT INTO "role_permissions" VALUES(16,186);
INSERT INTO "role_permissions" VALUES(16,187);
INSERT INTO "role_permissions" VALUES(16,188);
INSERT INTO "role_permissions" VALUES(16,189);
INSERT INTO "role_permissions" VALUES(16,190);
INSERT INTO "role_permissions" VALUES(16,191);
INSERT INTO "role_permissions" VALUES(16,192);
INSERT INTO "role_permissions" VALUES(16,193);
INSERT INTO "role_permissions" VALUES(16,194);
INSERT INTO "role_permissions" VALUES(16,195);
INSERT INTO "role_permissions" VALUES(16,196);
INSERT INTO "role_permissions" VALUES(16,197);
INSERT INTO "role_permissions" VALUES(16,198);
INSERT INTO "role_permissions" VALUES(16,199);
INSERT INTO "role_permissions" VALUES(16,200);
INSERT INTO "role_permissions" VALUES(16,201);
INSERT INTO "role_permissions" VALUES(16,202);
INSERT INTO "role_permissions" VALUES(16,203);
INSERT INTO "role_permissions" VALUES(16,204);
INSERT INTO "role_permissions" VALUES(16,205);
INSERT INTO "role_permissions" VALUES(16,206);
INSERT INTO "role_permissions" VALUES(16,207);
INSERT INTO "role_permissions" VALUES(16,208);
INSERT INTO "role_permissions" VALUES(16,209);
INSERT INTO "role_permissions" VALUES(16,210);
INSERT INTO "role_permissions" VALUES(16,211);
INSERT INTO "role_permissions" VALUES(16,212);
INSERT INTO "role_permissions" VALUES(16,213);
INSERT INTO "role_permissions" VALUES(16,214);
INSERT INTO "role_permissions" VALUES(16,215);
INSERT INTO "role_permissions" VALUES(16,216);
INSERT INTO "role_permissions" VALUES(16,217);
INSERT INTO "role_permissions" VALUES(16,218);
INSERT INTO "role_permissions" VALUES(16,219);
INSERT INTO "role_permissions" VALUES(16,220);
INSERT INTO "role_permissions" VALUES(16,221);
INSERT INTO "role_permissions" VALUES(16,222);
INSERT INTO "role_permissions" VALUES(16,223);
INSERT INTO "role_permissions" VALUES(16,224);
INSERT INTO "role_permissions" VALUES(16,225);
INSERT INTO "role_permissions" VALUES(16,226);
INSERT INTO "role_permissions" VALUES(16,227);
INSERT INTO "role_permissions" VALUES(16,228);
INSERT INTO "role_permissions" VALUES(16,229);
INSERT INTO "role_permissions" VALUES(16,230);
INSERT INTO "role_permissions" VALUES(16,231);
INSERT INTO "role_permissions" VALUES(16,232);
INSERT INTO "role_permissions" VALUES(16,233);
INSERT INTO "role_permissions" VALUES(16,234);
INSERT INTO "role_permissions" VALUES(16,235);
INSERT INTO "role_permissions" VALUES(16,236);
INSERT INTO "role_permissions" VALUES(16,237);
INSERT INTO "role_permissions" VALUES(16,238);
INSERT INTO "role_permissions" VALUES(16,239);
INSERT INTO "role_permissions" VALUES(16,240);
INSERT INTO "role_permissions" VALUES(16,241);
INSERT INTO "role_permissions" VALUES(16,242);
INSERT INTO "role_permissions" VALUES(16,243);
INSERT INTO "role_permissions" VALUES(16,244);
INSERT INTO "role_permissions" VALUES(16,245);
INSERT INTO "role_permissions" VALUES(16,246);
INSERT INTO "role_permissions" VALUES(16,247);
INSERT INTO "role_permissions" VALUES(16,248);
INSERT INTO "role_permissions" VALUES(16,249);
INSERT INTO "role_permissions" VALUES(16,250);
INSERT INTO "role_permissions" VALUES(16,251);
INSERT INTO "role_permissions" VALUES(16,252);
INSERT INTO "role_permissions" VALUES(22,1);
INSERT INTO "role_permissions" VALUES(22,2);
INSERT INTO "role_permissions" VALUES(22,3);
INSERT INTO "role_permissions" VALUES(22,4);
INSERT INTO "role_permissions" VALUES(22,5);
INSERT INTO "role_permissions" VALUES(22,6);
INSERT INTO "role_permissions" VALUES(22,7);
INSERT INTO "role_permissions" VALUES(22,8);
INSERT INTO "role_permissions" VALUES(22,9);
INSERT INTO "role_permissions" VALUES(22,10);
INSERT INTO "role_permissions" VALUES(22,11);
INSERT INTO "role_permissions" VALUES(22,12);
INSERT INTO "role_permissions" VALUES(22,13);
INSERT INTO "role_permissions" VALUES(22,14);
INSERT INTO "role_permissions" VALUES(22,15);
INSERT INTO "role_permissions" VALUES(22,16);
INSERT INTO "role_permissions" VALUES(22,17);
INSERT INTO "role_permissions" VALUES(22,18);
INSERT INTO "role_permissions" VALUES(22,19);
INSERT INTO "role_permissions" VALUES(22,20);
INSERT INTO "role_permissions" VALUES(22,21);
INSERT INTO "role_permissions" VALUES(22,22);
INSERT INTO "role_permissions" VALUES(22,23);
INSERT INTO "role_permissions" VALUES(22,24);
INSERT INTO "role_permissions" VALUES(22,25);
INSERT INTO "role_permissions" VALUES(22,26);
INSERT INTO "role_permissions" VALUES(22,27);
INSERT INTO "role_permissions" VALUES(22,28);
INSERT INTO "role_permissions" VALUES(22,29);
INSERT INTO "role_permissions" VALUES(22,30);
INSERT INTO "role_permissions" VALUES(22,31);
INSERT INTO "role_permissions" VALUES(22,32);
INSERT INTO "role_permissions" VALUES(22,33);
INSERT INTO "role_permissions" VALUES(22,34);
INSERT INTO "role_permissions" VALUES(22,35);
INSERT INTO "role_permissions" VALUES(22,36);
INSERT INTO "role_permissions" VALUES(22,37);
INSERT INTO "role_permissions" VALUES(22,38);
INSERT INTO "role_permissions" VALUES(22,39);
INSERT INTO "role_permissions" VALUES(22,40);
INSERT INTO "role_permissions" VALUES(22,41);
INSERT INTO "role_permissions" VALUES(22,42);
INSERT INTO "role_permissions" VALUES(22,43);
INSERT INTO "role_permissions" VALUES(22,44);
INSERT INTO "role_permissions" VALUES(22,45);
INSERT INTO "role_permissions" VALUES(22,46);
INSERT INTO "role_permissions" VALUES(22,47);
INSERT INTO "role_permissions" VALUES(22,48);
INSERT INTO "role_permissions" VALUES(22,49);
INSERT INTO "role_permissions" VALUES(22,50);
INSERT INTO "role_permissions" VALUES(22,51);
INSERT INTO "role_permissions" VALUES(22,52);
INSERT INTO "role_permissions" VALUES(22,53);
INSERT INTO "role_permissions" VALUES(22,54);
INSERT INTO "role_permissions" VALUES(22,55);
INSERT INTO "role_permissions" VALUES(22,56);
INSERT INTO "role_permissions" VALUES(22,57);
INSERT INTO "role_permissions" VALUES(22,58);
INSERT INTO "role_permissions" VALUES(22,59);
INSERT INTO "role_permissions" VALUES(22,60);
INSERT INTO "role_permissions" VALUES(22,61);
INSERT INTO "role_permissions" VALUES(22,62);
INSERT INTO "role_permissions" VALUES(22,63);
INSERT INTO "role_permissions" VALUES(22,64);
INSERT INTO "role_permissions" VALUES(22,65);
INSERT INTO "role_permissions" VALUES(22,66);
INSERT INTO "role_permissions" VALUES(22,67);
INSERT INTO "role_permissions" VALUES(22,68);
INSERT INTO "role_permissions" VALUES(22,69);
INSERT INTO "role_permissions" VALUES(22,70);
INSERT INTO "role_permissions" VALUES(22,71);
INSERT INTO "role_permissions" VALUES(22,72);
INSERT INTO "role_permissions" VALUES(22,73);
INSERT INTO "role_permissions" VALUES(22,74);
INSERT INTO "role_permissions" VALUES(22,75);
INSERT INTO "role_permissions" VALUES(22,76);
INSERT INTO "role_permissions" VALUES(22,77);
INSERT INTO "role_permissions" VALUES(22,78);
INSERT INTO "role_permissions" VALUES(22,79);
INSERT INTO "role_permissions" VALUES(22,80);
INSERT INTO "role_permissions" VALUES(22,81);
INSERT INTO "role_permissions" VALUES(22,82);
INSERT INTO "role_permissions" VALUES(22,83);
INSERT INTO "role_permissions" VALUES(22,84);
INSERT INTO "role_permissions" VALUES(22,85);
INSERT INTO "role_permissions" VALUES(22,86);
INSERT INTO "role_permissions" VALUES(22,87);
INSERT INTO "role_permissions" VALUES(22,88);
INSERT INTO "role_permissions" VALUES(22,89);
INSERT INTO "role_permissions" VALUES(22,90);
INSERT INTO "role_permissions" VALUES(22,91);
INSERT INTO "role_permissions" VALUES(22,92);
INSERT INTO "role_permissions" VALUES(22,93);
INSERT INTO "role_permissions" VALUES(22,94);
INSERT INTO "role_permissions" VALUES(22,95);
INSERT INTO "role_permissions" VALUES(22,96);
INSERT INTO "role_permissions" VALUES(22,97);
INSERT INTO "role_permissions" VALUES(22,98);
INSERT INTO "role_permissions" VALUES(22,99);
INSERT INTO "role_permissions" VALUES(22,100);
INSERT INTO "role_permissions" VALUES(22,101);
INSERT INTO "role_permissions" VALUES(22,102);
INSERT INTO "role_permissions" VALUES(22,103);
INSERT INTO "role_permissions" VALUES(22,104);
INSERT INTO "role_permissions" VALUES(22,105);
INSERT INTO "role_permissions" VALUES(22,106);
INSERT INTO "role_permissions" VALUES(22,107);
INSERT INTO "role_permissions" VALUES(22,108);
INSERT INTO "role_permissions" VALUES(22,109);
INSERT INTO "role_permissions" VALUES(22,110);
INSERT INTO "role_permissions" VALUES(22,111);
INSERT INTO "role_permissions" VALUES(22,112);
INSERT INTO "role_permissions" VALUES(22,113);
INSERT INTO "role_permissions" VALUES(22,114);
INSERT INTO "role_permissions" VALUES(22,115);
INSERT INTO "role_permissions" VALUES(22,116);
INSERT INTO "role_permissions" VALUES(22,117);
INSERT INTO "role_permissions" VALUES(22,118);
INSERT INTO "role_permissions" VALUES(22,119);
INSERT INTO "role_permissions" VALUES(22,120);
INSERT INTO "role_permissions" VALUES(22,121);
INSERT INTO "role_permissions" VALUES(22,122);
INSERT INTO "role_permissions" VALUES(22,123);
INSERT INTO "role_permissions" VALUES(22,124);
INSERT INTO "role_permissions" VALUES(22,125);
INSERT INTO "role_permissions" VALUES(22,126);
INSERT INTO "role_permissions" VALUES(22,127);
INSERT INTO "role_permissions" VALUES(22,128);
INSERT INTO "role_permissions" VALUES(22,129);
INSERT INTO "role_permissions" VALUES(22,130);
INSERT INTO "role_permissions" VALUES(22,131);
INSERT INTO "role_permissions" VALUES(22,132);
INSERT INTO "role_permissions" VALUES(22,133);
INSERT INTO "role_permissions" VALUES(22,134);
INSERT INTO "role_permissions" VALUES(22,135);
INSERT INTO "role_permissions" VALUES(22,136);
INSERT INTO "role_permissions" VALUES(22,137);
INSERT INTO "role_permissions" VALUES(22,138);
INSERT INTO "role_permissions" VALUES(22,139);
INSERT INTO "role_permissions" VALUES(22,140);
INSERT INTO "role_permissions" VALUES(22,141);
INSERT INTO "role_permissions" VALUES(22,142);
INSERT INTO "role_permissions" VALUES(22,143);
INSERT INTO "role_permissions" VALUES(22,144);
INSERT INTO "role_permissions" VALUES(22,145);
INSERT INTO "role_permissions" VALUES(22,146);
INSERT INTO "role_permissions" VALUES(22,147);
INSERT INTO "role_permissions" VALUES(22,148);
INSERT INTO "role_permissions" VALUES(22,149);
INSERT INTO "role_permissions" VALUES(22,150);
INSERT INTO "role_permissions" VALUES(22,151);
INSERT INTO "role_permissions" VALUES(22,152);
INSERT INTO "role_permissions" VALUES(22,153);
INSERT INTO "role_permissions" VALUES(22,154);
INSERT INTO "role_permissions" VALUES(22,155);
INSERT INTO "role_permissions" VALUES(22,156);
INSERT INTO "role_permissions" VALUES(22,157);
INSERT INTO "role_permissions" VALUES(22,158);
INSERT INTO "role_permissions" VALUES(22,159);
INSERT INTO "role_permissions" VALUES(22,160);
INSERT INTO "role_permissions" VALUES(22,161);
INSERT INTO "role_permissions" VALUES(22,162);
INSERT INTO "role_permissions" VALUES(22,163);
INSERT INTO "role_permissions" VALUES(22,164);
INSERT INTO "role_permissions" VALUES(22,165);
INSERT INTO "role_permissions" VALUES(22,166);
INSERT INTO "role_permissions" VALUES(22,167);
INSERT INTO "role_permissions" VALUES(22,168);
INSERT INTO "role_permissions" VALUES(22,169);
INSERT INTO "role_permissions" VALUES(22,170);
INSERT INTO "role_permissions" VALUES(22,171);
INSERT INTO "role_permissions" VALUES(22,172);
INSERT INTO "role_permissions" VALUES(22,173);
INSERT INTO "role_permissions" VALUES(22,174);
INSERT INTO "role_permissions" VALUES(22,175);
INSERT INTO "role_permissions" VALUES(22,176);
INSERT INTO "role_permissions" VALUES(22,177);
INSERT INTO "role_permissions" VALUES(22,178);
INSERT INTO "role_permissions" VALUES(22,179);
INSERT INTO "role_permissions" VALUES(22,180);
INSERT INTO "role_permissions" VALUES(22,181);
INSERT INTO "role_permissions" VALUES(22,182);
INSERT INTO "role_permissions" VALUES(22,183);
INSERT INTO "role_permissions" VALUES(22,184);
INSERT INTO "role_permissions" VALUES(22,185);
INSERT INTO "role_permissions" VALUES(22,186);
INSERT INTO "role_permissions" VALUES(22,187);
INSERT INTO "role_permissions" VALUES(22,188);
INSERT INTO "role_permissions" VALUES(22,189);
INSERT INTO "role_permissions" VALUES(22,190);
INSERT INTO "role_permissions" VALUES(22,191);
INSERT INTO "role_permissions" VALUES(22,192);
INSERT INTO "role_permissions" VALUES(22,193);
INSERT INTO "role_permissions" VALUES(22,194);
INSERT INTO "role_permissions" VALUES(22,195);
INSERT INTO "role_permissions" VALUES(22,196);
INSERT INTO "role_permissions" VALUES(22,197);
INSERT INTO "role_permissions" VALUES(22,198);
INSERT INTO "role_permissions" VALUES(22,199);
INSERT INTO "role_permissions" VALUES(22,200);
INSERT INTO "role_permissions" VALUES(22,201);
INSERT INTO "role_permissions" VALUES(22,202);
INSERT INTO "role_permissions" VALUES(22,203);
INSERT INTO "role_permissions" VALUES(22,204);
INSERT INTO "role_permissions" VALUES(22,205);
INSERT INTO "role_permissions" VALUES(22,206);
INSERT INTO "role_permissions" VALUES(22,207);
INSERT INTO "role_permissions" VALUES(22,208);
INSERT INTO "role_permissions" VALUES(22,209);
INSERT INTO "role_permissions" VALUES(22,210);
INSERT INTO "role_permissions" VALUES(22,211);
INSERT INTO "role_permissions" VALUES(22,212);
INSERT INTO "role_permissions" VALUES(22,213);
INSERT INTO "role_permissions" VALUES(22,214);
INSERT INTO "role_permissions" VALUES(22,215);
INSERT INTO "role_permissions" VALUES(22,216);
INSERT INTO "role_permissions" VALUES(22,217);
INSERT INTO "role_permissions" VALUES(22,218);
INSERT INTO "role_permissions" VALUES(22,219);
INSERT INTO "role_permissions" VALUES(22,220);
INSERT INTO "role_permissions" VALUES(22,221);
INSERT INTO "role_permissions" VALUES(22,222);
INSERT INTO "role_permissions" VALUES(22,223);
INSERT INTO "role_permissions" VALUES(22,224);
INSERT INTO "role_permissions" VALUES(22,225);
INSERT INTO "role_permissions" VALUES(22,226);
INSERT INTO "role_permissions" VALUES(22,227);
INSERT INTO "role_permissions" VALUES(22,228);
INSERT INTO "role_permissions" VALUES(22,229);
INSERT INTO "role_permissions" VALUES(22,230);
INSERT INTO "role_permissions" VALUES(22,231);
INSERT INTO "role_permissions" VALUES(22,232);
INSERT INTO "role_permissions" VALUES(22,233);
INSERT INTO "role_permissions" VALUES(22,234);
INSERT INTO "role_permissions" VALUES(22,235);
INSERT INTO "role_permissions" VALUES(22,236);
INSERT INTO "role_permissions" VALUES(22,237);
INSERT INTO "role_permissions" VALUES(22,238);
INSERT INTO "role_permissions" VALUES(22,239);
INSERT INTO "role_permissions" VALUES(22,240);
INSERT INTO "role_permissions" VALUES(22,241);
INSERT INTO "role_permissions" VALUES(22,242);
INSERT INTO "role_permissions" VALUES(22,243);
INSERT INTO "role_permissions" VALUES(22,244);
INSERT INTO "role_permissions" VALUES(22,245);
INSERT INTO "role_permissions" VALUES(22,246);
INSERT INTO "role_permissions" VALUES(22,247);
INSERT INTO "role_permissions" VALUES(22,248);
INSERT INTO "role_permissions" VALUES(22,249);
INSERT INTO "role_permissions" VALUES(22,250);
INSERT INTO "role_permissions" VALUES(22,251);
INSERT INTO "role_permissions" VALUES(22,252);
INSERT INTO "role_permissions" VALUES(23,1);
INSERT INTO "role_permissions" VALUES(23,2);
INSERT INTO "role_permissions" VALUES(23,3);
INSERT INTO "role_permissions" VALUES(23,4);
INSERT INTO "role_permissions" VALUES(23,5);
INSERT INTO "role_permissions" VALUES(23,6);
INSERT INTO "role_permissions" VALUES(23,7);
INSERT INTO "role_permissions" VALUES(23,8);
INSERT INTO "role_permissions" VALUES(23,9);
INSERT INTO "role_permissions" VALUES(23,10);
INSERT INTO "role_permissions" VALUES(23,11);
INSERT INTO "role_permissions" VALUES(23,12);
INSERT INTO "role_permissions" VALUES(23,13);
INSERT INTO "role_permissions" VALUES(23,14);
INSERT INTO "role_permissions" VALUES(23,15);
INSERT INTO "role_permissions" VALUES(23,16);
INSERT INTO "role_permissions" VALUES(23,17);
INSERT INTO "role_permissions" VALUES(23,18);
INSERT INTO "role_permissions" VALUES(23,19);
INSERT INTO "role_permissions" VALUES(23,20);
INSERT INTO "role_permissions" VALUES(23,21);
INSERT INTO "role_permissions" VALUES(23,22);
INSERT INTO "role_permissions" VALUES(23,23);
INSERT INTO "role_permissions" VALUES(23,24);
INSERT INTO "role_permissions" VALUES(23,25);
INSERT INTO "role_permissions" VALUES(23,26);
INSERT INTO "role_permissions" VALUES(23,27);
INSERT INTO "role_permissions" VALUES(23,28);
INSERT INTO "role_permissions" VALUES(23,29);
INSERT INTO "role_permissions" VALUES(23,30);
INSERT INTO "role_permissions" VALUES(23,31);
INSERT INTO "role_permissions" VALUES(23,32);
INSERT INTO "role_permissions" VALUES(23,33);
INSERT INTO "role_permissions" VALUES(23,34);
INSERT INTO "role_permissions" VALUES(23,35);
INSERT INTO "role_permissions" VALUES(23,36);
INSERT INTO "role_permissions" VALUES(23,37);
INSERT INTO "role_permissions" VALUES(23,38);
INSERT INTO "role_permissions" VALUES(23,39);
INSERT INTO "role_permissions" VALUES(23,40);
INSERT INTO "role_permissions" VALUES(23,41);
INSERT INTO "role_permissions" VALUES(23,42);
INSERT INTO "role_permissions" VALUES(23,43);
INSERT INTO "role_permissions" VALUES(23,44);
INSERT INTO "role_permissions" VALUES(23,45);
INSERT INTO "role_permissions" VALUES(23,46);
INSERT INTO "role_permissions" VALUES(23,47);
INSERT INTO "role_permissions" VALUES(23,48);
INSERT INTO "role_permissions" VALUES(23,49);
INSERT INTO "role_permissions" VALUES(23,50);
INSERT INTO "role_permissions" VALUES(23,51);
INSERT INTO "role_permissions" VALUES(23,52);
INSERT INTO "role_permissions" VALUES(23,53);
INSERT INTO "role_permissions" VALUES(23,54);
INSERT INTO "role_permissions" VALUES(23,55);
INSERT INTO "role_permissions" VALUES(23,56);
INSERT INTO "role_permissions" VALUES(23,57);
INSERT INTO "role_permissions" VALUES(23,58);
INSERT INTO "role_permissions" VALUES(23,59);
INSERT INTO "role_permissions" VALUES(23,60);
INSERT INTO "role_permissions" VALUES(23,61);
INSERT INTO "role_permissions" VALUES(23,62);
INSERT INTO "role_permissions" VALUES(23,63);
INSERT INTO "role_permissions" VALUES(23,64);
INSERT INTO "role_permissions" VALUES(23,65);
INSERT INTO "role_permissions" VALUES(23,66);
INSERT INTO "role_permissions" VALUES(23,67);
INSERT INTO "role_permissions" VALUES(23,68);
INSERT INTO "role_permissions" VALUES(23,69);
INSERT INTO "role_permissions" VALUES(23,70);
INSERT INTO "role_permissions" VALUES(23,71);
INSERT INTO "role_permissions" VALUES(23,72);
INSERT INTO "role_permissions" VALUES(23,73);
INSERT INTO "role_permissions" VALUES(23,74);
INSERT INTO "role_permissions" VALUES(23,75);
INSERT INTO "role_permissions" VALUES(23,76);
INSERT INTO "role_permissions" VALUES(23,77);
INSERT INTO "role_permissions" VALUES(23,78);
INSERT INTO "role_permissions" VALUES(23,79);
INSERT INTO "role_permissions" VALUES(23,80);
INSERT INTO "role_permissions" VALUES(23,81);
INSERT INTO "role_permissions" VALUES(23,82);
INSERT INTO "role_permissions" VALUES(23,83);
INSERT INTO "role_permissions" VALUES(23,84);
INSERT INTO "role_permissions" VALUES(23,85);
INSERT INTO "role_permissions" VALUES(23,86);
INSERT INTO "role_permissions" VALUES(23,87);
INSERT INTO "role_permissions" VALUES(23,88);
INSERT INTO "role_permissions" VALUES(23,89);
INSERT INTO "role_permissions" VALUES(23,90);
INSERT INTO "role_permissions" VALUES(23,91);
INSERT INTO "role_permissions" VALUES(23,92);
INSERT INTO "role_permissions" VALUES(23,93);
INSERT INTO "role_permissions" VALUES(23,94);
INSERT INTO "role_permissions" VALUES(23,95);
INSERT INTO "role_permissions" VALUES(23,96);
INSERT INTO "role_permissions" VALUES(23,97);
INSERT INTO "role_permissions" VALUES(23,98);
INSERT INTO "role_permissions" VALUES(23,99);
INSERT INTO "role_permissions" VALUES(23,100);
INSERT INTO "role_permissions" VALUES(23,101);
INSERT INTO "role_permissions" VALUES(23,102);
INSERT INTO "role_permissions" VALUES(23,103);
INSERT INTO "role_permissions" VALUES(23,104);
INSERT INTO "role_permissions" VALUES(23,105);
INSERT INTO "role_permissions" VALUES(23,106);
INSERT INTO "role_permissions" VALUES(23,107);
INSERT INTO "role_permissions" VALUES(23,108);
INSERT INTO "role_permissions" VALUES(23,109);
INSERT INTO "role_permissions" VALUES(23,110);
INSERT INTO "role_permissions" VALUES(23,111);
INSERT INTO "role_permissions" VALUES(23,112);
INSERT INTO "role_permissions" VALUES(23,113);
INSERT INTO "role_permissions" VALUES(23,114);
INSERT INTO "role_permissions" VALUES(23,115);
INSERT INTO "role_permissions" VALUES(23,116);
INSERT INTO "role_permissions" VALUES(23,117);
INSERT INTO "role_permissions" VALUES(23,118);
INSERT INTO "role_permissions" VALUES(23,119);
INSERT INTO "role_permissions" VALUES(23,120);
INSERT INTO "role_permissions" VALUES(23,121);
INSERT INTO "role_permissions" VALUES(23,122);
INSERT INTO "role_permissions" VALUES(23,123);
INSERT INTO "role_permissions" VALUES(23,124);
INSERT INTO "role_permissions" VALUES(23,125);
INSERT INTO "role_permissions" VALUES(23,126);
INSERT INTO "role_permissions" VALUES(23,127);
INSERT INTO "role_permissions" VALUES(23,128);
INSERT INTO "role_permissions" VALUES(23,129);
INSERT INTO "role_permissions" VALUES(23,130);
INSERT INTO "role_permissions" VALUES(23,131);
INSERT INTO "role_permissions" VALUES(23,132);
INSERT INTO "role_permissions" VALUES(23,133);
INSERT INTO "role_permissions" VALUES(23,134);
INSERT INTO "role_permissions" VALUES(23,135);
INSERT INTO "role_permissions" VALUES(23,136);
INSERT INTO "role_permissions" VALUES(23,137);
INSERT INTO "role_permissions" VALUES(23,138);
INSERT INTO "role_permissions" VALUES(23,139);
INSERT INTO "role_permissions" VALUES(23,140);
INSERT INTO "role_permissions" VALUES(23,141);
INSERT INTO "role_permissions" VALUES(23,142);
INSERT INTO "role_permissions" VALUES(23,143);
INSERT INTO "role_permissions" VALUES(23,144);
INSERT INTO "role_permissions" VALUES(23,145);
INSERT INTO "role_permissions" VALUES(23,146);
INSERT INTO "role_permissions" VALUES(23,147);
INSERT INTO "role_permissions" VALUES(23,148);
INSERT INTO "role_permissions" VALUES(23,149);
INSERT INTO "role_permissions" VALUES(23,150);
INSERT INTO "role_permissions" VALUES(23,151);
INSERT INTO "role_permissions" VALUES(23,152);
INSERT INTO "role_permissions" VALUES(23,153);
INSERT INTO "role_permissions" VALUES(23,154);
INSERT INTO "role_permissions" VALUES(23,155);
INSERT INTO "role_permissions" VALUES(23,156);
INSERT INTO "role_permissions" VALUES(23,157);
INSERT INTO "role_permissions" VALUES(23,158);
INSERT INTO "role_permissions" VALUES(23,159);
INSERT INTO "role_permissions" VALUES(23,160);
INSERT INTO "role_permissions" VALUES(23,161);
INSERT INTO "role_permissions" VALUES(23,162);
INSERT INTO "role_permissions" VALUES(23,163);
INSERT INTO "role_permissions" VALUES(23,164);
INSERT INTO "role_permissions" VALUES(23,165);
INSERT INTO "role_permissions" VALUES(23,166);
INSERT INTO "role_permissions" VALUES(23,167);
INSERT INTO "role_permissions" VALUES(23,168);
INSERT INTO "role_permissions" VALUES(23,169);
INSERT INTO "role_permissions" VALUES(23,170);
INSERT INTO "role_permissions" VALUES(23,171);
INSERT INTO "role_permissions" VALUES(23,172);
INSERT INTO "role_permissions" VALUES(23,173);
INSERT INTO "role_permissions" VALUES(23,174);
INSERT INTO "role_permissions" VALUES(23,175);
INSERT INTO "role_permissions" VALUES(23,176);
INSERT INTO "role_permissions" VALUES(23,177);
INSERT INTO "role_permissions" VALUES(23,178);
INSERT INTO "role_permissions" VALUES(23,179);
INSERT INTO "role_permissions" VALUES(23,180);
INSERT INTO "role_permissions" VALUES(23,181);
INSERT INTO "role_permissions" VALUES(23,182);
INSERT INTO "role_permissions" VALUES(23,183);
INSERT INTO "role_permissions" VALUES(23,184);
INSERT INTO "role_permissions" VALUES(23,185);
INSERT INTO "role_permissions" VALUES(23,186);
INSERT INTO "role_permissions" VALUES(23,187);
INSERT INTO "role_permissions" VALUES(23,188);
INSERT INTO "role_permissions" VALUES(23,189);
INSERT INTO "role_permissions" VALUES(23,190);
INSERT INTO "role_permissions" VALUES(23,191);
INSERT INTO "role_permissions" VALUES(23,192);
INSERT INTO "role_permissions" VALUES(23,193);
INSERT INTO "role_permissions" VALUES(23,194);
INSERT INTO "role_permissions" VALUES(23,195);
INSERT INTO "role_permissions" VALUES(23,196);
INSERT INTO "role_permissions" VALUES(23,197);
INSERT INTO "role_permissions" VALUES(23,198);
INSERT INTO "role_permissions" VALUES(23,199);
INSERT INTO "role_permissions" VALUES(23,200);
INSERT INTO "role_permissions" VALUES(23,201);
INSERT INTO "role_permissions" VALUES(23,202);
INSERT INTO "role_permissions" VALUES(23,203);
INSERT INTO "role_permissions" VALUES(23,204);
INSERT INTO "role_permissions" VALUES(23,205);
INSERT INTO "role_permissions" VALUES(23,206);
INSERT INTO "role_permissions" VALUES(23,207);
INSERT INTO "role_permissions" VALUES(23,208);
INSERT INTO "role_permissions" VALUES(23,209);
INSERT INTO "role_permissions" VALUES(23,210);
INSERT INTO "role_permissions" VALUES(23,211);
INSERT INTO "role_permissions" VALUES(23,212);
INSERT INTO "role_permissions" VALUES(23,213);
INSERT INTO "role_permissions" VALUES(23,214);
INSERT INTO "role_permissions" VALUES(23,215);
INSERT INTO "role_permissions" VALUES(23,216);
INSERT INTO "role_permissions" VALUES(23,217);
INSERT INTO "role_permissions" VALUES(23,218);
INSERT INTO "role_permissions" VALUES(23,219);
INSERT INTO "role_permissions" VALUES(23,220);
INSERT INTO "role_permissions" VALUES(23,221);
INSERT INTO "role_permissions" VALUES(23,222);
INSERT INTO "role_permissions" VALUES(23,223);
INSERT INTO "role_permissions" VALUES(23,224);
INSERT INTO "role_permissions" VALUES(23,225);
INSERT INTO "role_permissions" VALUES(23,226);
INSERT INTO "role_permissions" VALUES(23,227);
INSERT INTO "role_permissions" VALUES(23,228);
INSERT INTO "role_permissions" VALUES(23,229);
INSERT INTO "role_permissions" VALUES(23,230);
INSERT INTO "role_permissions" VALUES(23,231);
INSERT INTO "role_permissions" VALUES(23,232);
INSERT INTO "role_permissions" VALUES(23,233);
INSERT INTO "role_permissions" VALUES(23,234);
INSERT INTO "role_permissions" VALUES(23,235);
INSERT INTO "role_permissions" VALUES(23,236);
INSERT INTO "role_permissions" VALUES(23,237);
INSERT INTO "role_permissions" VALUES(23,238);
INSERT INTO "role_permissions" VALUES(23,239);
INSERT INTO "role_permissions" VALUES(23,240);
INSERT INTO "role_permissions" VALUES(23,241);
INSERT INTO "role_permissions" VALUES(23,242);
INSERT INTO "role_permissions" VALUES(23,243);
INSERT INTO "role_permissions" VALUES(23,244);
INSERT INTO "role_permissions" VALUES(23,245);
INSERT INTO "role_permissions" VALUES(23,246);
INSERT INTO "role_permissions" VALUES(23,247);
INSERT INTO "role_permissions" VALUES(23,248);
INSERT INTO "role_permissions" VALUES(23,249);
INSERT INTO "role_permissions" VALUES(23,250);
INSERT INTO "role_permissions" VALUES(23,251);
INSERT INTO "role_permissions" VALUES(23,252);
INSERT INTO "role_permissions" VALUES(3,2);
INSERT INTO "role_permissions" VALUES(10,2);
INSERT INTO "role_permissions" VALUES(17,2);
INSERT INTO "role_permissions" VALUES(24,2);
INSERT INTO "role_permissions" VALUES(3,3);
INSERT INTO "role_permissions" VALUES(10,3);
INSERT INTO "role_permissions" VALUES(17,3);
INSERT INTO "role_permissions" VALUES(24,3);
INSERT INTO "role_permissions" VALUES(3,4);
INSERT INTO "role_permissions" VALUES(10,4);
INSERT INTO "role_permissions" VALUES(17,4);
INSERT INTO "role_permissions" VALUES(24,4);
INSERT INTO "role_permissions" VALUES(3,5);
INSERT INTO "role_permissions" VALUES(10,5);
INSERT INTO "role_permissions" VALUES(17,5);
INSERT INTO "role_permissions" VALUES(24,5);
INSERT INTO "role_permissions" VALUES(3,6);
INSERT INTO "role_permissions" VALUES(10,6);
INSERT INTO "role_permissions" VALUES(17,6);
INSERT INTO "role_permissions" VALUES(24,6);
INSERT INTO "role_permissions" VALUES(3,7);
INSERT INTO "role_permissions" VALUES(10,7);
INSERT INTO "role_permissions" VALUES(17,7);
INSERT INTO "role_permissions" VALUES(24,7);
INSERT INTO "role_permissions" VALUES(3,8);
INSERT INTO "role_permissions" VALUES(10,8);
INSERT INTO "role_permissions" VALUES(17,8);
INSERT INTO "role_permissions" VALUES(24,8);
INSERT INTO "role_permissions" VALUES(3,9);
INSERT INTO "role_permissions" VALUES(10,9);
INSERT INTO "role_permissions" VALUES(17,9);
INSERT INTO "role_permissions" VALUES(24,9);
INSERT INTO "role_permissions" VALUES(3,10);
INSERT INTO "role_permissions" VALUES(10,10);
INSERT INTO "role_permissions" VALUES(17,10);
INSERT INTO "role_permissions" VALUES(24,10);
INSERT INTO "role_permissions" VALUES(3,11);
INSERT INTO "role_permissions" VALUES(10,11);
INSERT INTO "role_permissions" VALUES(17,11);
INSERT INTO "role_permissions" VALUES(24,11);
INSERT INTO "role_permissions" VALUES(3,12);
INSERT INTO "role_permissions" VALUES(10,12);
INSERT INTO "role_permissions" VALUES(17,12);
INSERT INTO "role_permissions" VALUES(24,12);
INSERT INTO "role_permissions" VALUES(3,13);
INSERT INTO "role_permissions" VALUES(10,13);
INSERT INTO "role_permissions" VALUES(17,13);
INSERT INTO "role_permissions" VALUES(24,13);
INSERT INTO "role_permissions" VALUES(3,14);
INSERT INTO "role_permissions" VALUES(10,14);
INSERT INTO "role_permissions" VALUES(17,14);
INSERT INTO "role_permissions" VALUES(24,14);
INSERT INTO "role_permissions" VALUES(3,15);
INSERT INTO "role_permissions" VALUES(10,15);
INSERT INTO "role_permissions" VALUES(17,15);
INSERT INTO "role_permissions" VALUES(24,15);
INSERT INTO "role_permissions" VALUES(3,16);
INSERT INTO "role_permissions" VALUES(10,16);
INSERT INTO "role_permissions" VALUES(17,16);
INSERT INTO "role_permissions" VALUES(24,16);
INSERT INTO "role_permissions" VALUES(3,17);
INSERT INTO "role_permissions" VALUES(10,17);
INSERT INTO "role_permissions" VALUES(17,17);
INSERT INTO "role_permissions" VALUES(24,17);
INSERT INTO "role_permissions" VALUES(3,18);
INSERT INTO "role_permissions" VALUES(10,18);
INSERT INTO "role_permissions" VALUES(17,18);
INSERT INTO "role_permissions" VALUES(24,18);
INSERT INTO "role_permissions" VALUES(3,19);
INSERT INTO "role_permissions" VALUES(10,19);
INSERT INTO "role_permissions" VALUES(17,19);
INSERT INTO "role_permissions" VALUES(24,19);
INSERT INTO "role_permissions" VALUES(3,20);
INSERT INTO "role_permissions" VALUES(10,20);
INSERT INTO "role_permissions" VALUES(17,20);
INSERT INTO "role_permissions" VALUES(24,20);
INSERT INTO "role_permissions" VALUES(3,21);
INSERT INTO "role_permissions" VALUES(10,21);
INSERT INTO "role_permissions" VALUES(17,21);
INSERT INTO "role_permissions" VALUES(24,21);
INSERT INTO "role_permissions" VALUES(3,22);
INSERT INTO "role_permissions" VALUES(10,22);
INSERT INTO "role_permissions" VALUES(17,22);
INSERT INTO "role_permissions" VALUES(24,22);
INSERT INTO "role_permissions" VALUES(3,23);
INSERT INTO "role_permissions" VALUES(10,23);
INSERT INTO "role_permissions" VALUES(17,23);
INSERT INTO "role_permissions" VALUES(24,23);
INSERT INTO "role_permissions" VALUES(3,24);
INSERT INTO "role_permissions" VALUES(10,24);
INSERT INTO "role_permissions" VALUES(17,24);
INSERT INTO "role_permissions" VALUES(24,24);
INSERT INTO "role_permissions" VALUES(3,25);
INSERT INTO "role_permissions" VALUES(10,25);
INSERT INTO "role_permissions" VALUES(17,25);
INSERT INTO "role_permissions" VALUES(24,25);
INSERT INTO "role_permissions" VALUES(3,26);
INSERT INTO "role_permissions" VALUES(10,26);
INSERT INTO "role_permissions" VALUES(17,26);
INSERT INTO "role_permissions" VALUES(24,26);
INSERT INTO "role_permissions" VALUES(3,27);
INSERT INTO "role_permissions" VALUES(10,27);
INSERT INTO "role_permissions" VALUES(17,27);
INSERT INTO "role_permissions" VALUES(24,27);
INSERT INTO "role_permissions" VALUES(3,28);
INSERT INTO "role_permissions" VALUES(10,28);
INSERT INTO "role_permissions" VALUES(17,28);
INSERT INTO "role_permissions" VALUES(24,28);
INSERT INTO "role_permissions" VALUES(3,29);
INSERT INTO "role_permissions" VALUES(10,29);
INSERT INTO "role_permissions" VALUES(17,29);
INSERT INTO "role_permissions" VALUES(24,29);
INSERT INTO "role_permissions" VALUES(3,30);
INSERT INTO "role_permissions" VALUES(10,30);
INSERT INTO "role_permissions" VALUES(17,30);
INSERT INTO "role_permissions" VALUES(24,30);
INSERT INTO "role_permissions" VALUES(3,31);
INSERT INTO "role_permissions" VALUES(10,31);
INSERT INTO "role_permissions" VALUES(17,31);
INSERT INTO "role_permissions" VALUES(24,31);
INSERT INTO "role_permissions" VALUES(3,32);
INSERT INTO "role_permissions" VALUES(10,32);
INSERT INTO "role_permissions" VALUES(17,32);
INSERT INTO "role_permissions" VALUES(24,32);
INSERT INTO "role_permissions" VALUES(3,33);
INSERT INTO "role_permissions" VALUES(10,33);
INSERT INTO "role_permissions" VALUES(17,33);
INSERT INTO "role_permissions" VALUES(24,33);
INSERT INTO "role_permissions" VALUES(3,34);
INSERT INTO "role_permissions" VALUES(10,34);
INSERT INTO "role_permissions" VALUES(17,34);
INSERT INTO "role_permissions" VALUES(24,34);
INSERT INTO "role_permissions" VALUES(3,35);
INSERT INTO "role_permissions" VALUES(10,35);
INSERT INTO "role_permissions" VALUES(17,35);
INSERT INTO "role_permissions" VALUES(24,35);
INSERT INTO "role_permissions" VALUES(3,36);
INSERT INTO "role_permissions" VALUES(10,36);
INSERT INTO "role_permissions" VALUES(17,36);
INSERT INTO "role_permissions" VALUES(24,36);
INSERT INTO "role_permissions" VALUES(3,37);
INSERT INTO "role_permissions" VALUES(10,37);
INSERT INTO "role_permissions" VALUES(17,37);
INSERT INTO "role_permissions" VALUES(24,37);
INSERT INTO "role_permissions" VALUES(3,38);
INSERT INTO "role_permissions" VALUES(10,38);
INSERT INTO "role_permissions" VALUES(17,38);
INSERT INTO "role_permissions" VALUES(24,38);
INSERT INTO "role_permissions" VALUES(3,39);
INSERT INTO "role_permissions" VALUES(10,39);
INSERT INTO "role_permissions" VALUES(17,39);
INSERT INTO "role_permissions" VALUES(24,39);
INSERT INTO "role_permissions" VALUES(3,40);
INSERT INTO "role_permissions" VALUES(10,40);
INSERT INTO "role_permissions" VALUES(17,40);
INSERT INTO "role_permissions" VALUES(24,40);
INSERT INTO "role_permissions" VALUES(3,41);
INSERT INTO "role_permissions" VALUES(10,41);
INSERT INTO "role_permissions" VALUES(17,41);
INSERT INTO "role_permissions" VALUES(24,41);
INSERT INTO "role_permissions" VALUES(3,42);
INSERT INTO "role_permissions" VALUES(10,42);
INSERT INTO "role_permissions" VALUES(17,42);
INSERT INTO "role_permissions" VALUES(24,42);
INSERT INTO "role_permissions" VALUES(3,43);
INSERT INTO "role_permissions" VALUES(10,43);
INSERT INTO "role_permissions" VALUES(17,43);
INSERT INTO "role_permissions" VALUES(24,43);
INSERT INTO "role_permissions" VALUES(3,44);
INSERT INTO "role_permissions" VALUES(10,44);
INSERT INTO "role_permissions" VALUES(17,44);
INSERT INTO "role_permissions" VALUES(24,44);
INSERT INTO "role_permissions" VALUES(3,45);
INSERT INTO "role_permissions" VALUES(10,45);
INSERT INTO "role_permissions" VALUES(17,45);
INSERT INTO "role_permissions" VALUES(24,45);
INSERT INTO "role_permissions" VALUES(3,46);
INSERT INTO "role_permissions" VALUES(10,46);
INSERT INTO "role_permissions" VALUES(17,46);
INSERT INTO "role_permissions" VALUES(24,46);
INSERT INTO "role_permissions" VALUES(3,47);
INSERT INTO "role_permissions" VALUES(10,47);
INSERT INTO "role_permissions" VALUES(17,47);
INSERT INTO "role_permissions" VALUES(24,47);
INSERT INTO "role_permissions" VALUES(3,48);
INSERT INTO "role_permissions" VALUES(10,48);
INSERT INTO "role_permissions" VALUES(17,48);
INSERT INTO "role_permissions" VALUES(24,48);
INSERT INTO "role_permissions" VALUES(3,49);
INSERT INTO "role_permissions" VALUES(10,49);
INSERT INTO "role_permissions" VALUES(17,49);
INSERT INTO "role_permissions" VALUES(24,49);
INSERT INTO "role_permissions" VALUES(3,50);
INSERT INTO "role_permissions" VALUES(10,50);
INSERT INTO "role_permissions" VALUES(17,50);
INSERT INTO "role_permissions" VALUES(24,50);
INSERT INTO "role_permissions" VALUES(3,51);
INSERT INTO "role_permissions" VALUES(10,51);
INSERT INTO "role_permissions" VALUES(17,51);
INSERT INTO "role_permissions" VALUES(24,51);
INSERT INTO "role_permissions" VALUES(3,52);
INSERT INTO "role_permissions" VALUES(10,52);
INSERT INTO "role_permissions" VALUES(17,52);
INSERT INTO "role_permissions" VALUES(24,52);
INSERT INTO "role_permissions" VALUES(3,53);
INSERT INTO "role_permissions" VALUES(10,53);
INSERT INTO "role_permissions" VALUES(17,53);
INSERT INTO "role_permissions" VALUES(24,53);
INSERT INTO "role_permissions" VALUES(3,54);
INSERT INTO "role_permissions" VALUES(10,54);
INSERT INTO "role_permissions" VALUES(17,54);
INSERT INTO "role_permissions" VALUES(24,54);
INSERT INTO "role_permissions" VALUES(3,55);
INSERT INTO "role_permissions" VALUES(10,55);
INSERT INTO "role_permissions" VALUES(17,55);
INSERT INTO "role_permissions" VALUES(24,55);
INSERT INTO "role_permissions" VALUES(3,56);
INSERT INTO "role_permissions" VALUES(10,56);
INSERT INTO "role_permissions" VALUES(17,56);
INSERT INTO "role_permissions" VALUES(24,56);
INSERT INTO "role_permissions" VALUES(3,57);
INSERT INTO "role_permissions" VALUES(10,57);
INSERT INTO "role_permissions" VALUES(17,57);
INSERT INTO "role_permissions" VALUES(24,57);
INSERT INTO "role_permissions" VALUES(3,58);
INSERT INTO "role_permissions" VALUES(10,58);
INSERT INTO "role_permissions" VALUES(17,58);
INSERT INTO "role_permissions" VALUES(24,58);
INSERT INTO "role_permissions" VALUES(3,59);
INSERT INTO "role_permissions" VALUES(10,59);
INSERT INTO "role_permissions" VALUES(17,59);
INSERT INTO "role_permissions" VALUES(24,59);
INSERT INTO "role_permissions" VALUES(3,60);
INSERT INTO "role_permissions" VALUES(10,60);
INSERT INTO "role_permissions" VALUES(17,60);
INSERT INTO "role_permissions" VALUES(24,60);
INSERT INTO "role_permissions" VALUES(3,61);
INSERT INTO "role_permissions" VALUES(10,61);
INSERT INTO "role_permissions" VALUES(17,61);
INSERT INTO "role_permissions" VALUES(24,61);
INSERT INTO "role_permissions" VALUES(3,62);
INSERT INTO "role_permissions" VALUES(10,62);
INSERT INTO "role_permissions" VALUES(17,62);
INSERT INTO "role_permissions" VALUES(24,62);
INSERT INTO "role_permissions" VALUES(3,63);
INSERT INTO "role_permissions" VALUES(10,63);
INSERT INTO "role_permissions" VALUES(17,63);
INSERT INTO "role_permissions" VALUES(24,63);
INSERT INTO "role_permissions" VALUES(3,65);
INSERT INTO "role_permissions" VALUES(10,65);
INSERT INTO "role_permissions" VALUES(17,65);
INSERT INTO "role_permissions" VALUES(24,65);
INSERT INTO "role_permissions" VALUES(3,66);
INSERT INTO "role_permissions" VALUES(10,66);
INSERT INTO "role_permissions" VALUES(17,66);
INSERT INTO "role_permissions" VALUES(24,66);
INSERT INTO "role_permissions" VALUES(3,67);
INSERT INTO "role_permissions" VALUES(10,67);
INSERT INTO "role_permissions" VALUES(17,67);
INSERT INTO "role_permissions" VALUES(24,67);
INSERT INTO "role_permissions" VALUES(3,68);
INSERT INTO "role_permissions" VALUES(10,68);
INSERT INTO "role_permissions" VALUES(17,68);
INSERT INTO "role_permissions" VALUES(24,68);
INSERT INTO "role_permissions" VALUES(3,69);
INSERT INTO "role_permissions" VALUES(10,69);
INSERT INTO "role_permissions" VALUES(17,69);
INSERT INTO "role_permissions" VALUES(24,69);
INSERT INTO "role_permissions" VALUES(3,70);
INSERT INTO "role_permissions" VALUES(10,70);
INSERT INTO "role_permissions" VALUES(17,70);
INSERT INTO "role_permissions" VALUES(24,70);
INSERT INTO "role_permissions" VALUES(3,71);
INSERT INTO "role_permissions" VALUES(10,71);
INSERT INTO "role_permissions" VALUES(17,71);
INSERT INTO "role_permissions" VALUES(24,71);
INSERT INTO "role_permissions" VALUES(3,72);
INSERT INTO "role_permissions" VALUES(10,72);
INSERT INTO "role_permissions" VALUES(17,72);
INSERT INTO "role_permissions" VALUES(24,72);
INSERT INTO "role_permissions" VALUES(3,73);
INSERT INTO "role_permissions" VALUES(10,73);
INSERT INTO "role_permissions" VALUES(17,73);
INSERT INTO "role_permissions" VALUES(24,73);
INSERT INTO "role_permissions" VALUES(3,74);
INSERT INTO "role_permissions" VALUES(10,74);
INSERT INTO "role_permissions" VALUES(17,74);
INSERT INTO "role_permissions" VALUES(24,74);
INSERT INTO "role_permissions" VALUES(3,75);
INSERT INTO "role_permissions" VALUES(10,75);
INSERT INTO "role_permissions" VALUES(17,75);
INSERT INTO "role_permissions" VALUES(24,75);
INSERT INTO "role_permissions" VALUES(3,76);
INSERT INTO "role_permissions" VALUES(10,76);
INSERT INTO "role_permissions" VALUES(17,76);
INSERT INTO "role_permissions" VALUES(24,76);
INSERT INTO "role_permissions" VALUES(3,77);
INSERT INTO "role_permissions" VALUES(10,77);
INSERT INTO "role_permissions" VALUES(17,77);
INSERT INTO "role_permissions" VALUES(24,77);
INSERT INTO "role_permissions" VALUES(3,78);
INSERT INTO "role_permissions" VALUES(10,78);
INSERT INTO "role_permissions" VALUES(17,78);
INSERT INTO "role_permissions" VALUES(24,78);
INSERT INTO "role_permissions" VALUES(3,79);
INSERT INTO "role_permissions" VALUES(10,79);
INSERT INTO "role_permissions" VALUES(17,79);
INSERT INTO "role_permissions" VALUES(24,79);
INSERT INTO "role_permissions" VALUES(3,80);
INSERT INTO "role_permissions" VALUES(10,80);
INSERT INTO "role_permissions" VALUES(17,80);
INSERT INTO "role_permissions" VALUES(24,80);
INSERT INTO "role_permissions" VALUES(3,81);
INSERT INTO "role_permissions" VALUES(10,81);
INSERT INTO "role_permissions" VALUES(17,81);
INSERT INTO "role_permissions" VALUES(24,81);
INSERT INTO "role_permissions" VALUES(3,82);
INSERT INTO "role_permissions" VALUES(10,82);
INSERT INTO "role_permissions" VALUES(17,82);
INSERT INTO "role_permissions" VALUES(24,82);
INSERT INTO "role_permissions" VALUES(3,83);
INSERT INTO "role_permissions" VALUES(10,83);
INSERT INTO "role_permissions" VALUES(17,83);
INSERT INTO "role_permissions" VALUES(24,83);
INSERT INTO "role_permissions" VALUES(3,84);
INSERT INTO "role_permissions" VALUES(10,84);
INSERT INTO "role_permissions" VALUES(17,84);
INSERT INTO "role_permissions" VALUES(24,84);
INSERT INTO "role_permissions" VALUES(3,85);
INSERT INTO "role_permissions" VALUES(10,85);
INSERT INTO "role_permissions" VALUES(17,85);
INSERT INTO "role_permissions" VALUES(24,85);
INSERT INTO "role_permissions" VALUES(3,86);
INSERT INTO "role_permissions" VALUES(10,86);
INSERT INTO "role_permissions" VALUES(17,86);
INSERT INTO "role_permissions" VALUES(24,86);
INSERT INTO "role_permissions" VALUES(3,87);
INSERT INTO "role_permissions" VALUES(10,87);
INSERT INTO "role_permissions" VALUES(17,87);
INSERT INTO "role_permissions" VALUES(24,87);
INSERT INTO "role_permissions" VALUES(3,88);
INSERT INTO "role_permissions" VALUES(10,88);
INSERT INTO "role_permissions" VALUES(17,88);
INSERT INTO "role_permissions" VALUES(24,88);
INSERT INTO "role_permissions" VALUES(3,89);
INSERT INTO "role_permissions" VALUES(10,89);
INSERT INTO "role_permissions" VALUES(17,89);
INSERT INTO "role_permissions" VALUES(24,89);
INSERT INTO "role_permissions" VALUES(3,90);
INSERT INTO "role_permissions" VALUES(10,90);
INSERT INTO "role_permissions" VALUES(17,90);
INSERT INTO "role_permissions" VALUES(24,90);
INSERT INTO "role_permissions" VALUES(3,91);
INSERT INTO "role_permissions" VALUES(10,91);
INSERT INTO "role_permissions" VALUES(17,91);
INSERT INTO "role_permissions" VALUES(24,91);
INSERT INTO "role_permissions" VALUES(3,92);
INSERT INTO "role_permissions" VALUES(10,92);
INSERT INTO "role_permissions" VALUES(17,92);
INSERT INTO "role_permissions" VALUES(24,92);
INSERT INTO "role_permissions" VALUES(3,93);
INSERT INTO "role_permissions" VALUES(10,93);
INSERT INTO "role_permissions" VALUES(17,93);
INSERT INTO "role_permissions" VALUES(24,93);
INSERT INTO "role_permissions" VALUES(3,94);
INSERT INTO "role_permissions" VALUES(10,94);
INSERT INTO "role_permissions" VALUES(17,94);
INSERT INTO "role_permissions" VALUES(24,94);
INSERT INTO "role_permissions" VALUES(3,95);
INSERT INTO "role_permissions" VALUES(10,95);
INSERT INTO "role_permissions" VALUES(17,95);
INSERT INTO "role_permissions" VALUES(24,95);
INSERT INTO "role_permissions" VALUES(3,96);
INSERT INTO "role_permissions" VALUES(10,96);
INSERT INTO "role_permissions" VALUES(17,96);
INSERT INTO "role_permissions" VALUES(24,96);
INSERT INTO "role_permissions" VALUES(3,97);
INSERT INTO "role_permissions" VALUES(10,97);
INSERT INTO "role_permissions" VALUES(17,97);
INSERT INTO "role_permissions" VALUES(24,97);
INSERT INTO "role_permissions" VALUES(3,98);
INSERT INTO "role_permissions" VALUES(10,98);
INSERT INTO "role_permissions" VALUES(17,98);
INSERT INTO "role_permissions" VALUES(24,98);
INSERT INTO "role_permissions" VALUES(3,99);
INSERT INTO "role_permissions" VALUES(10,99);
INSERT INTO "role_permissions" VALUES(17,99);
INSERT INTO "role_permissions" VALUES(24,99);
INSERT INTO "role_permissions" VALUES(3,100);
INSERT INTO "role_permissions" VALUES(10,100);
INSERT INTO "role_permissions" VALUES(17,100);
INSERT INTO "role_permissions" VALUES(24,100);
INSERT INTO "role_permissions" VALUES(3,101);
INSERT INTO "role_permissions" VALUES(10,101);
INSERT INTO "role_permissions" VALUES(17,101);
INSERT INTO "role_permissions" VALUES(24,101);
INSERT INTO "role_permissions" VALUES(3,102);
INSERT INTO "role_permissions" VALUES(10,102);
INSERT INTO "role_permissions" VALUES(17,102);
INSERT INTO "role_permissions" VALUES(24,102);
INSERT INTO "role_permissions" VALUES(3,103);
INSERT INTO "role_permissions" VALUES(10,103);
INSERT INTO "role_permissions" VALUES(17,103);
INSERT INTO "role_permissions" VALUES(24,103);
INSERT INTO "role_permissions" VALUES(3,104);
INSERT INTO "role_permissions" VALUES(10,104);
INSERT INTO "role_permissions" VALUES(17,104);
INSERT INTO "role_permissions" VALUES(24,104);
INSERT INTO "role_permissions" VALUES(3,105);
INSERT INTO "role_permissions" VALUES(10,105);
INSERT INTO "role_permissions" VALUES(17,105);
INSERT INTO "role_permissions" VALUES(24,105);
INSERT INTO "role_permissions" VALUES(3,106);
INSERT INTO "role_permissions" VALUES(10,106);
INSERT INTO "role_permissions" VALUES(17,106);
INSERT INTO "role_permissions" VALUES(24,106);
INSERT INTO "role_permissions" VALUES(3,107);
INSERT INTO "role_permissions" VALUES(10,107);
INSERT INTO "role_permissions" VALUES(17,107);
INSERT INTO "role_permissions" VALUES(24,107);
INSERT INTO "role_permissions" VALUES(3,108);
INSERT INTO "role_permissions" VALUES(10,108);
INSERT INTO "role_permissions" VALUES(17,108);
INSERT INTO "role_permissions" VALUES(24,108);
INSERT INTO "role_permissions" VALUES(3,109);
INSERT INTO "role_permissions" VALUES(10,109);
INSERT INTO "role_permissions" VALUES(17,109);
INSERT INTO "role_permissions" VALUES(24,109);
INSERT INTO "role_permissions" VALUES(3,110);
INSERT INTO "role_permissions" VALUES(10,110);
INSERT INTO "role_permissions" VALUES(17,110);
INSERT INTO "role_permissions" VALUES(24,110);
INSERT INTO "role_permissions" VALUES(3,111);
INSERT INTO "role_permissions" VALUES(10,111);
INSERT INTO "role_permissions" VALUES(17,111);
INSERT INTO "role_permissions" VALUES(24,111);
INSERT INTO "role_permissions" VALUES(3,112);
INSERT INTO "role_permissions" VALUES(10,112);
INSERT INTO "role_permissions" VALUES(17,112);
INSERT INTO "role_permissions" VALUES(24,112);
INSERT INTO "role_permissions" VALUES(3,113);
INSERT INTO "role_permissions" VALUES(10,113);
INSERT INTO "role_permissions" VALUES(17,113);
INSERT INTO "role_permissions" VALUES(24,113);
INSERT INTO "role_permissions" VALUES(3,114);
INSERT INTO "role_permissions" VALUES(10,114);
INSERT INTO "role_permissions" VALUES(17,114);
INSERT INTO "role_permissions" VALUES(24,114);
INSERT INTO "role_permissions" VALUES(3,115);
INSERT INTO "role_permissions" VALUES(10,115);
INSERT INTO "role_permissions" VALUES(17,115);
INSERT INTO "role_permissions" VALUES(24,115);
INSERT INTO "role_permissions" VALUES(3,116);
INSERT INTO "role_permissions" VALUES(10,116);
INSERT INTO "role_permissions" VALUES(17,116);
INSERT INTO "role_permissions" VALUES(24,116);
INSERT INTO "role_permissions" VALUES(3,117);
INSERT INTO "role_permissions" VALUES(10,117);
INSERT INTO "role_permissions" VALUES(17,117);
INSERT INTO "role_permissions" VALUES(24,117);
INSERT INTO "role_permissions" VALUES(3,118);
INSERT INTO "role_permissions" VALUES(10,118);
INSERT INTO "role_permissions" VALUES(17,118);
INSERT INTO "role_permissions" VALUES(24,118);
INSERT INTO "role_permissions" VALUES(3,119);
INSERT INTO "role_permissions" VALUES(10,119);
INSERT INTO "role_permissions" VALUES(17,119);
INSERT INTO "role_permissions" VALUES(24,119);
INSERT INTO "role_permissions" VALUES(3,120);
INSERT INTO "role_permissions" VALUES(10,120);
INSERT INTO "role_permissions" VALUES(17,120);
INSERT INTO "role_permissions" VALUES(24,120);
INSERT INTO "role_permissions" VALUES(3,121);
INSERT INTO "role_permissions" VALUES(10,121);
INSERT INTO "role_permissions" VALUES(17,121);
INSERT INTO "role_permissions" VALUES(24,121);
INSERT INTO "role_permissions" VALUES(3,122);
INSERT INTO "role_permissions" VALUES(10,122);
INSERT INTO "role_permissions" VALUES(17,122);
INSERT INTO "role_permissions" VALUES(24,122);
INSERT INTO "role_permissions" VALUES(3,123);
INSERT INTO "role_permissions" VALUES(10,123);
INSERT INTO "role_permissions" VALUES(17,123);
INSERT INTO "role_permissions" VALUES(24,123);
INSERT INTO "role_permissions" VALUES(3,124);
INSERT INTO "role_permissions" VALUES(10,124);
INSERT INTO "role_permissions" VALUES(17,124);
INSERT INTO "role_permissions" VALUES(24,124);
INSERT INTO "role_permissions" VALUES(3,125);
INSERT INTO "role_permissions" VALUES(10,125);
INSERT INTO "role_permissions" VALUES(17,125);
INSERT INTO "role_permissions" VALUES(24,125);
INSERT INTO "role_permissions" VALUES(3,126);
INSERT INTO "role_permissions" VALUES(10,126);
INSERT INTO "role_permissions" VALUES(17,126);
INSERT INTO "role_permissions" VALUES(24,126);
INSERT INTO "role_permissions" VALUES(3,128);
INSERT INTO "role_permissions" VALUES(10,128);
INSERT INTO "role_permissions" VALUES(17,128);
INSERT INTO "role_permissions" VALUES(24,128);
INSERT INTO "role_permissions" VALUES(3,129);
INSERT INTO "role_permissions" VALUES(10,129);
INSERT INTO "role_permissions" VALUES(17,129);
INSERT INTO "role_permissions" VALUES(24,129);
INSERT INTO "role_permissions" VALUES(3,130);
INSERT INTO "role_permissions" VALUES(10,130);
INSERT INTO "role_permissions" VALUES(17,130);
INSERT INTO "role_permissions" VALUES(24,130);
INSERT INTO "role_permissions" VALUES(3,131);
INSERT INTO "role_permissions" VALUES(10,131);
INSERT INTO "role_permissions" VALUES(17,131);
INSERT INTO "role_permissions" VALUES(24,131);
INSERT INTO "role_permissions" VALUES(3,132);
INSERT INTO "role_permissions" VALUES(10,132);
INSERT INTO "role_permissions" VALUES(17,132);
INSERT INTO "role_permissions" VALUES(24,132);
INSERT INTO "role_permissions" VALUES(3,133);
INSERT INTO "role_permissions" VALUES(10,133);
INSERT INTO "role_permissions" VALUES(17,133);
INSERT INTO "role_permissions" VALUES(24,133);
INSERT INTO "role_permissions" VALUES(3,134);
INSERT INTO "role_permissions" VALUES(10,134);
INSERT INTO "role_permissions" VALUES(17,134);
INSERT INTO "role_permissions" VALUES(24,134);
INSERT INTO "role_permissions" VALUES(3,135);
INSERT INTO "role_permissions" VALUES(10,135);
INSERT INTO "role_permissions" VALUES(17,135);
INSERT INTO "role_permissions" VALUES(24,135);
INSERT INTO "role_permissions" VALUES(3,136);
INSERT INTO "role_permissions" VALUES(10,136);
INSERT INTO "role_permissions" VALUES(17,136);
INSERT INTO "role_permissions" VALUES(24,136);
INSERT INTO "role_permissions" VALUES(3,137);
INSERT INTO "role_permissions" VALUES(10,137);
INSERT INTO "role_permissions" VALUES(17,137);
INSERT INTO "role_permissions" VALUES(24,137);
INSERT INTO "role_permissions" VALUES(3,138);
INSERT INTO "role_permissions" VALUES(10,138);
INSERT INTO "role_permissions" VALUES(17,138);
INSERT INTO "role_permissions" VALUES(24,138);
INSERT INTO "role_permissions" VALUES(3,139);
INSERT INTO "role_permissions" VALUES(10,139);
INSERT INTO "role_permissions" VALUES(17,139);
INSERT INTO "role_permissions" VALUES(24,139);
INSERT INTO "role_permissions" VALUES(3,140);
INSERT INTO "role_permissions" VALUES(10,140);
INSERT INTO "role_permissions" VALUES(17,140);
INSERT INTO "role_permissions" VALUES(24,140);
INSERT INTO "role_permissions" VALUES(3,141);
INSERT INTO "role_permissions" VALUES(10,141);
INSERT INTO "role_permissions" VALUES(17,141);
INSERT INTO "role_permissions" VALUES(24,141);
INSERT INTO "role_permissions" VALUES(3,142);
INSERT INTO "role_permissions" VALUES(10,142);
INSERT INTO "role_permissions" VALUES(17,142);
INSERT INTO "role_permissions" VALUES(24,142);
INSERT INTO "role_permissions" VALUES(3,143);
INSERT INTO "role_permissions" VALUES(10,143);
INSERT INTO "role_permissions" VALUES(17,143);
INSERT INTO "role_permissions" VALUES(24,143);
INSERT INTO "role_permissions" VALUES(3,144);
INSERT INTO "role_permissions" VALUES(10,144);
INSERT INTO "role_permissions" VALUES(17,144);
INSERT INTO "role_permissions" VALUES(24,144);
INSERT INTO "role_permissions" VALUES(3,145);
INSERT INTO "role_permissions" VALUES(10,145);
INSERT INTO "role_permissions" VALUES(17,145);
INSERT INTO "role_permissions" VALUES(24,145);
INSERT INTO "role_permissions" VALUES(3,146);
INSERT INTO "role_permissions" VALUES(10,146);
INSERT INTO "role_permissions" VALUES(17,146);
INSERT INTO "role_permissions" VALUES(24,146);
INSERT INTO "role_permissions" VALUES(3,147);
INSERT INTO "role_permissions" VALUES(10,147);
INSERT INTO "role_permissions" VALUES(17,147);
INSERT INTO "role_permissions" VALUES(24,147);
INSERT INTO "role_permissions" VALUES(3,148);
INSERT INTO "role_permissions" VALUES(10,148);
INSERT INTO "role_permissions" VALUES(17,148);
INSERT INTO "role_permissions" VALUES(24,148);
INSERT INTO "role_permissions" VALUES(3,149);
INSERT INTO "role_permissions" VALUES(10,149);
INSERT INTO "role_permissions" VALUES(17,149);
INSERT INTO "role_permissions" VALUES(24,149);
INSERT INTO "role_permissions" VALUES(3,150);
INSERT INTO "role_permissions" VALUES(10,150);
INSERT INTO "role_permissions" VALUES(17,150);
INSERT INTO "role_permissions" VALUES(24,150);
INSERT INTO "role_permissions" VALUES(3,151);
INSERT INTO "role_permissions" VALUES(10,151);
INSERT INTO "role_permissions" VALUES(17,151);
INSERT INTO "role_permissions" VALUES(24,151);
INSERT INTO "role_permissions" VALUES(3,152);
INSERT INTO "role_permissions" VALUES(10,152);
INSERT INTO "role_permissions" VALUES(17,152);
INSERT INTO "role_permissions" VALUES(24,152);
INSERT INTO "role_permissions" VALUES(3,153);
INSERT INTO "role_permissions" VALUES(10,153);
INSERT INTO "role_permissions" VALUES(17,153);
INSERT INTO "role_permissions" VALUES(24,153);
INSERT INTO "role_permissions" VALUES(3,154);
INSERT INTO "role_permissions" VALUES(10,154);
INSERT INTO "role_permissions" VALUES(17,154);
INSERT INTO "role_permissions" VALUES(24,154);
INSERT INTO "role_permissions" VALUES(3,155);
INSERT INTO "role_permissions" VALUES(10,155);
INSERT INTO "role_permissions" VALUES(17,155);
INSERT INTO "role_permissions" VALUES(24,155);
INSERT INTO "role_permissions" VALUES(3,156);
INSERT INTO "role_permissions" VALUES(10,156);
INSERT INTO "role_permissions" VALUES(17,156);
INSERT INTO "role_permissions" VALUES(24,156);
INSERT INTO "role_permissions" VALUES(3,157);
INSERT INTO "role_permissions" VALUES(10,157);
INSERT INTO "role_permissions" VALUES(17,157);
INSERT INTO "role_permissions" VALUES(24,157);
INSERT INTO "role_permissions" VALUES(3,158);
INSERT INTO "role_permissions" VALUES(10,158);
INSERT INTO "role_permissions" VALUES(17,158);
INSERT INTO "role_permissions" VALUES(24,158);
INSERT INTO "role_permissions" VALUES(3,159);
INSERT INTO "role_permissions" VALUES(10,159);
INSERT INTO "role_permissions" VALUES(17,159);
INSERT INTO "role_permissions" VALUES(24,159);
INSERT INTO "role_permissions" VALUES(3,160);
INSERT INTO "role_permissions" VALUES(10,160);
INSERT INTO "role_permissions" VALUES(17,160);
INSERT INTO "role_permissions" VALUES(24,160);
INSERT INTO "role_permissions" VALUES(3,161);
INSERT INTO "role_permissions" VALUES(10,161);
INSERT INTO "role_permissions" VALUES(17,161);
INSERT INTO "role_permissions" VALUES(24,161);
INSERT INTO "role_permissions" VALUES(3,162);
INSERT INTO "role_permissions" VALUES(10,162);
INSERT INTO "role_permissions" VALUES(17,162);
INSERT INTO "role_permissions" VALUES(24,162);
INSERT INTO "role_permissions" VALUES(3,163);
INSERT INTO "role_permissions" VALUES(10,163);
INSERT INTO "role_permissions" VALUES(17,163);
INSERT INTO "role_permissions" VALUES(24,163);
INSERT INTO "role_permissions" VALUES(3,164);
INSERT INTO "role_permissions" VALUES(10,164);
INSERT INTO "role_permissions" VALUES(17,164);
INSERT INTO "role_permissions" VALUES(24,164);
INSERT INTO "role_permissions" VALUES(3,165);
INSERT INTO "role_permissions" VALUES(10,165);
INSERT INTO "role_permissions" VALUES(17,165);
INSERT INTO "role_permissions" VALUES(24,165);
INSERT INTO "role_permissions" VALUES(3,166);
INSERT INTO "role_permissions" VALUES(10,166);
INSERT INTO "role_permissions" VALUES(17,166);
INSERT INTO "role_permissions" VALUES(24,166);
INSERT INTO "role_permissions" VALUES(3,167);
INSERT INTO "role_permissions" VALUES(10,167);
INSERT INTO "role_permissions" VALUES(17,167);
INSERT INTO "role_permissions" VALUES(24,167);
INSERT INTO "role_permissions" VALUES(3,168);
INSERT INTO "role_permissions" VALUES(10,168);
INSERT INTO "role_permissions" VALUES(17,168);
INSERT INTO "role_permissions" VALUES(24,168);
INSERT INTO "role_permissions" VALUES(3,169);
INSERT INTO "role_permissions" VALUES(10,169);
INSERT INTO "role_permissions" VALUES(17,169);
INSERT INTO "role_permissions" VALUES(24,169);
INSERT INTO "role_permissions" VALUES(3,170);
INSERT INTO "role_permissions" VALUES(10,170);
INSERT INTO "role_permissions" VALUES(17,170);
INSERT INTO "role_permissions" VALUES(24,170);
INSERT INTO "role_permissions" VALUES(3,171);
INSERT INTO "role_permissions" VALUES(10,171);
INSERT INTO "role_permissions" VALUES(17,171);
INSERT INTO "role_permissions" VALUES(24,171);
INSERT INTO "role_permissions" VALUES(3,172);
INSERT INTO "role_permissions" VALUES(10,172);
INSERT INTO "role_permissions" VALUES(17,172);
INSERT INTO "role_permissions" VALUES(24,172);
INSERT INTO "role_permissions" VALUES(3,173);
INSERT INTO "role_permissions" VALUES(10,173);
INSERT INTO "role_permissions" VALUES(17,173);
INSERT INTO "role_permissions" VALUES(24,173);
INSERT INTO "role_permissions" VALUES(3,174);
INSERT INTO "role_permissions" VALUES(10,174);
INSERT INTO "role_permissions" VALUES(17,174);
INSERT INTO "role_permissions" VALUES(24,174);
INSERT INTO "role_permissions" VALUES(3,175);
INSERT INTO "role_permissions" VALUES(10,175);
INSERT INTO "role_permissions" VALUES(17,175);
INSERT INTO "role_permissions" VALUES(24,175);
INSERT INTO "role_permissions" VALUES(3,176);
INSERT INTO "role_permissions" VALUES(10,176);
INSERT INTO "role_permissions" VALUES(17,176);
INSERT INTO "role_permissions" VALUES(24,176);
INSERT INTO "role_permissions" VALUES(3,177);
INSERT INTO "role_permissions" VALUES(10,177);
INSERT INTO "role_permissions" VALUES(17,177);
INSERT INTO "role_permissions" VALUES(24,177);
INSERT INTO "role_permissions" VALUES(3,178);
INSERT INTO "role_permissions" VALUES(10,178);
INSERT INTO "role_permissions" VALUES(17,178);
INSERT INTO "role_permissions" VALUES(24,178);
INSERT INTO "role_permissions" VALUES(3,179);
INSERT INTO "role_permissions" VALUES(10,179);
INSERT INTO "role_permissions" VALUES(17,179);
INSERT INTO "role_permissions" VALUES(24,179);
INSERT INTO "role_permissions" VALUES(3,180);
INSERT INTO "role_permissions" VALUES(10,180);
INSERT INTO "role_permissions" VALUES(17,180);
INSERT INTO "role_permissions" VALUES(24,180);
INSERT INTO "role_permissions" VALUES(3,181);
INSERT INTO "role_permissions" VALUES(10,181);
INSERT INTO "role_permissions" VALUES(17,181);
INSERT INTO "role_permissions" VALUES(24,181);
INSERT INTO "role_permissions" VALUES(3,182);
INSERT INTO "role_permissions" VALUES(10,182);
INSERT INTO "role_permissions" VALUES(17,182);
INSERT INTO "role_permissions" VALUES(24,182);
INSERT INTO "role_permissions" VALUES(3,183);
INSERT INTO "role_permissions" VALUES(10,183);
INSERT INTO "role_permissions" VALUES(17,183);
INSERT INTO "role_permissions" VALUES(24,183);
INSERT INTO "role_permissions" VALUES(3,184);
INSERT INTO "role_permissions" VALUES(10,184);
INSERT INTO "role_permissions" VALUES(17,184);
INSERT INTO "role_permissions" VALUES(24,184);
INSERT INTO "role_permissions" VALUES(3,185);
INSERT INTO "role_permissions" VALUES(10,185);
INSERT INTO "role_permissions" VALUES(17,185);
INSERT INTO "role_permissions" VALUES(24,185);
INSERT INTO "role_permissions" VALUES(3,186);
INSERT INTO "role_permissions" VALUES(10,186);
INSERT INTO "role_permissions" VALUES(17,186);
INSERT INTO "role_permissions" VALUES(24,186);
INSERT INTO "role_permissions" VALUES(3,187);
INSERT INTO "role_permissions" VALUES(10,187);
INSERT INTO "role_permissions" VALUES(17,187);
INSERT INTO "role_permissions" VALUES(24,187);
INSERT INTO "role_permissions" VALUES(3,188);
INSERT INTO "role_permissions" VALUES(10,188);
INSERT INTO "role_permissions" VALUES(17,188);
INSERT INTO "role_permissions" VALUES(24,188);
INSERT INTO "role_permissions" VALUES(3,189);
INSERT INTO "role_permissions" VALUES(10,189);
INSERT INTO "role_permissions" VALUES(17,189);
INSERT INTO "role_permissions" VALUES(24,189);
INSERT INTO "role_permissions" VALUES(3,191);
INSERT INTO "role_permissions" VALUES(10,191);
INSERT INTO "role_permissions" VALUES(17,191);
INSERT INTO "role_permissions" VALUES(24,191);
INSERT INTO "role_permissions" VALUES(3,192);
INSERT INTO "role_permissions" VALUES(10,192);
INSERT INTO "role_permissions" VALUES(17,192);
INSERT INTO "role_permissions" VALUES(24,192);
INSERT INTO "role_permissions" VALUES(3,193);
INSERT INTO "role_permissions" VALUES(10,193);
INSERT INTO "role_permissions" VALUES(17,193);
INSERT INTO "role_permissions" VALUES(24,193);
INSERT INTO "role_permissions" VALUES(3,194);
INSERT INTO "role_permissions" VALUES(10,194);
INSERT INTO "role_permissions" VALUES(17,194);
INSERT INTO "role_permissions" VALUES(24,194);
INSERT INTO "role_permissions" VALUES(3,195);
INSERT INTO "role_permissions" VALUES(10,195);
INSERT INTO "role_permissions" VALUES(17,195);
INSERT INTO "role_permissions" VALUES(24,195);
INSERT INTO "role_permissions" VALUES(3,196);
INSERT INTO "role_permissions" VALUES(10,196);
INSERT INTO "role_permissions" VALUES(17,196);
INSERT INTO "role_permissions" VALUES(24,196);
INSERT INTO "role_permissions" VALUES(3,197);
INSERT INTO "role_permissions" VALUES(10,197);
INSERT INTO "role_permissions" VALUES(17,197);
INSERT INTO "role_permissions" VALUES(24,197);
INSERT INTO "role_permissions" VALUES(3,198);
INSERT INTO "role_permissions" VALUES(10,198);
INSERT INTO "role_permissions" VALUES(17,198);
INSERT INTO "role_permissions" VALUES(24,198);
INSERT INTO "role_permissions" VALUES(3,199);
INSERT INTO "role_permissions" VALUES(10,199);
INSERT INTO "role_permissions" VALUES(17,199);
INSERT INTO "role_permissions" VALUES(24,199);
INSERT INTO "role_permissions" VALUES(3,200);
INSERT INTO "role_permissions" VALUES(10,200);
INSERT INTO "role_permissions" VALUES(17,200);
INSERT INTO "role_permissions" VALUES(24,200);
INSERT INTO "role_permissions" VALUES(3,201);
INSERT INTO "role_permissions" VALUES(10,201);
INSERT INTO "role_permissions" VALUES(17,201);
INSERT INTO "role_permissions" VALUES(24,201);
INSERT INTO "role_permissions" VALUES(3,202);
INSERT INTO "role_permissions" VALUES(10,202);
INSERT INTO "role_permissions" VALUES(17,202);
INSERT INTO "role_permissions" VALUES(24,202);
INSERT INTO "role_permissions" VALUES(3,203);
INSERT INTO "role_permissions" VALUES(10,203);
INSERT INTO "role_permissions" VALUES(17,203);
INSERT INTO "role_permissions" VALUES(24,203);
INSERT INTO "role_permissions" VALUES(3,204);
INSERT INTO "role_permissions" VALUES(10,204);
INSERT INTO "role_permissions" VALUES(17,204);
INSERT INTO "role_permissions" VALUES(24,204);
INSERT INTO "role_permissions" VALUES(3,205);
INSERT INTO "role_permissions" VALUES(10,205);
INSERT INTO "role_permissions" VALUES(17,205);
INSERT INTO "role_permissions" VALUES(24,205);
INSERT INTO "role_permissions" VALUES(3,206);
INSERT INTO "role_permissions" VALUES(10,206);
INSERT INTO "role_permissions" VALUES(17,206);
INSERT INTO "role_permissions" VALUES(24,206);
INSERT INTO "role_permissions" VALUES(3,207);
INSERT INTO "role_permissions" VALUES(10,207);
INSERT INTO "role_permissions" VALUES(17,207);
INSERT INTO "role_permissions" VALUES(24,207);
INSERT INTO "role_permissions" VALUES(3,208);
INSERT INTO "role_permissions" VALUES(10,208);
INSERT INTO "role_permissions" VALUES(17,208);
INSERT INTO "role_permissions" VALUES(24,208);
INSERT INTO "role_permissions" VALUES(3,209);
INSERT INTO "role_permissions" VALUES(10,209);
INSERT INTO "role_permissions" VALUES(17,209);
INSERT INTO "role_permissions" VALUES(24,209);
INSERT INTO "role_permissions" VALUES(3,210);
INSERT INTO "role_permissions" VALUES(10,210);
INSERT INTO "role_permissions" VALUES(17,210);
INSERT INTO "role_permissions" VALUES(24,210);
INSERT INTO "role_permissions" VALUES(3,211);
INSERT INTO "role_permissions" VALUES(10,211);
INSERT INTO "role_permissions" VALUES(17,211);
INSERT INTO "role_permissions" VALUES(24,211);
INSERT INTO "role_permissions" VALUES(3,212);
INSERT INTO "role_permissions" VALUES(10,212);
INSERT INTO "role_permissions" VALUES(17,212);
INSERT INTO "role_permissions" VALUES(24,212);
INSERT INTO "role_permissions" VALUES(3,213);
INSERT INTO "role_permissions" VALUES(10,213);
INSERT INTO "role_permissions" VALUES(17,213);
INSERT INTO "role_permissions" VALUES(24,213);
INSERT INTO "role_permissions" VALUES(3,214);
INSERT INTO "role_permissions" VALUES(10,214);
INSERT INTO "role_permissions" VALUES(17,214);
INSERT INTO "role_permissions" VALUES(24,214);
INSERT INTO "role_permissions" VALUES(3,215);
INSERT INTO "role_permissions" VALUES(10,215);
INSERT INTO "role_permissions" VALUES(17,215);
INSERT INTO "role_permissions" VALUES(24,215);
INSERT INTO "role_permissions" VALUES(3,216);
INSERT INTO "role_permissions" VALUES(10,216);
INSERT INTO "role_permissions" VALUES(17,216);
INSERT INTO "role_permissions" VALUES(24,216);
INSERT INTO "role_permissions" VALUES(3,217);
INSERT INTO "role_permissions" VALUES(10,217);
INSERT INTO "role_permissions" VALUES(17,217);
INSERT INTO "role_permissions" VALUES(24,217);
INSERT INTO "role_permissions" VALUES(3,218);
INSERT INTO "role_permissions" VALUES(10,218);
INSERT INTO "role_permissions" VALUES(17,218);
INSERT INTO "role_permissions" VALUES(24,218);
INSERT INTO "role_permissions" VALUES(3,219);
INSERT INTO "role_permissions" VALUES(10,219);
INSERT INTO "role_permissions" VALUES(17,219);
INSERT INTO "role_permissions" VALUES(24,219);
INSERT INTO "role_permissions" VALUES(3,220);
INSERT INTO "role_permissions" VALUES(10,220);
INSERT INTO "role_permissions" VALUES(17,220);
INSERT INTO "role_permissions" VALUES(24,220);
INSERT INTO "role_permissions" VALUES(3,221);
INSERT INTO "role_permissions" VALUES(10,221);
INSERT INTO "role_permissions" VALUES(17,221);
INSERT INTO "role_permissions" VALUES(24,221);
INSERT INTO "role_permissions" VALUES(3,222);
INSERT INTO "role_permissions" VALUES(10,222);
INSERT INTO "role_permissions" VALUES(17,222);
INSERT INTO "role_permissions" VALUES(24,222);
INSERT INTO "role_permissions" VALUES(3,223);
INSERT INTO "role_permissions" VALUES(10,223);
INSERT INTO "role_permissions" VALUES(17,223);
INSERT INTO "role_permissions" VALUES(24,223);
INSERT INTO "role_permissions" VALUES(3,224);
INSERT INTO "role_permissions" VALUES(10,224);
INSERT INTO "role_permissions" VALUES(17,224);
INSERT INTO "role_permissions" VALUES(24,224);
INSERT INTO "role_permissions" VALUES(3,225);
INSERT INTO "role_permissions" VALUES(10,225);
INSERT INTO "role_permissions" VALUES(17,225);
INSERT INTO "role_permissions" VALUES(24,225);
INSERT INTO "role_permissions" VALUES(3,226);
INSERT INTO "role_permissions" VALUES(10,226);
INSERT INTO "role_permissions" VALUES(17,226);
INSERT INTO "role_permissions" VALUES(24,226);
INSERT INTO "role_permissions" VALUES(3,227);
INSERT INTO "role_permissions" VALUES(10,227);
INSERT INTO "role_permissions" VALUES(17,227);
INSERT INTO "role_permissions" VALUES(24,227);
INSERT INTO "role_permissions" VALUES(3,228);
INSERT INTO "role_permissions" VALUES(10,228);
INSERT INTO "role_permissions" VALUES(17,228);
INSERT INTO "role_permissions" VALUES(24,228);
INSERT INTO "role_permissions" VALUES(3,229);
INSERT INTO "role_permissions" VALUES(10,229);
INSERT INTO "role_permissions" VALUES(17,229);
INSERT INTO "role_permissions" VALUES(24,229);
INSERT INTO "role_permissions" VALUES(3,230);
INSERT INTO "role_permissions" VALUES(10,230);
INSERT INTO "role_permissions" VALUES(17,230);
INSERT INTO "role_permissions" VALUES(24,230);
INSERT INTO "role_permissions" VALUES(3,231);
INSERT INTO "role_permissions" VALUES(10,231);
INSERT INTO "role_permissions" VALUES(17,231);
INSERT INTO "role_permissions" VALUES(24,231);
INSERT INTO "role_permissions" VALUES(3,232);
INSERT INTO "role_permissions" VALUES(10,232);
INSERT INTO "role_permissions" VALUES(17,232);
INSERT INTO "role_permissions" VALUES(24,232);
INSERT INTO "role_permissions" VALUES(3,233);
INSERT INTO "role_permissions" VALUES(10,233);
INSERT INTO "role_permissions" VALUES(17,233);
INSERT INTO "role_permissions" VALUES(24,233);
INSERT INTO "role_permissions" VALUES(3,234);
INSERT INTO "role_permissions" VALUES(10,234);
INSERT INTO "role_permissions" VALUES(17,234);
INSERT INTO "role_permissions" VALUES(24,234);
INSERT INTO "role_permissions" VALUES(3,235);
INSERT INTO "role_permissions" VALUES(10,235);
INSERT INTO "role_permissions" VALUES(17,235);
INSERT INTO "role_permissions" VALUES(24,235);
INSERT INTO "role_permissions" VALUES(3,236);
INSERT INTO "role_permissions" VALUES(10,236);
INSERT INTO "role_permissions" VALUES(17,236);
INSERT INTO "role_permissions" VALUES(24,236);
INSERT INTO "role_permissions" VALUES(3,237);
INSERT INTO "role_permissions" VALUES(10,237);
INSERT INTO "role_permissions" VALUES(17,237);
INSERT INTO "role_permissions" VALUES(24,237);
INSERT INTO "role_permissions" VALUES(3,238);
INSERT INTO "role_permissions" VALUES(10,238);
INSERT INTO "role_permissions" VALUES(17,238);
INSERT INTO "role_permissions" VALUES(24,238);
INSERT INTO "role_permissions" VALUES(3,239);
INSERT INTO "role_permissions" VALUES(10,239);
INSERT INTO "role_permissions" VALUES(17,239);
INSERT INTO "role_permissions" VALUES(24,239);
INSERT INTO "role_permissions" VALUES(3,240);
INSERT INTO "role_permissions" VALUES(10,240);
INSERT INTO "role_permissions" VALUES(17,240);
INSERT INTO "role_permissions" VALUES(24,240);
INSERT INTO "role_permissions" VALUES(3,241);
INSERT INTO "role_permissions" VALUES(10,241);
INSERT INTO "role_permissions" VALUES(17,241);
INSERT INTO "role_permissions" VALUES(24,241);
INSERT INTO "role_permissions" VALUES(3,242);
INSERT INTO "role_permissions" VALUES(10,242);
INSERT INTO "role_permissions" VALUES(17,242);
INSERT INTO "role_permissions" VALUES(24,242);
INSERT INTO "role_permissions" VALUES(3,243);
INSERT INTO "role_permissions" VALUES(10,243);
INSERT INTO "role_permissions" VALUES(17,243);
INSERT INTO "role_permissions" VALUES(24,243);
INSERT INTO "role_permissions" VALUES(3,244);
INSERT INTO "role_permissions" VALUES(10,244);
INSERT INTO "role_permissions" VALUES(17,244);
INSERT INTO "role_permissions" VALUES(24,244);
INSERT INTO "role_permissions" VALUES(3,245);
INSERT INTO "role_permissions" VALUES(10,245);
INSERT INTO "role_permissions" VALUES(17,245);
INSERT INTO "role_permissions" VALUES(24,245);
INSERT INTO "role_permissions" VALUES(3,246);
INSERT INTO "role_permissions" VALUES(10,246);
INSERT INTO "role_permissions" VALUES(17,246);
INSERT INTO "role_permissions" VALUES(24,246);
INSERT INTO "role_permissions" VALUES(3,247);
INSERT INTO "role_permissions" VALUES(10,247);
INSERT INTO "role_permissions" VALUES(17,247);
INSERT INTO "role_permissions" VALUES(24,247);
INSERT INTO "role_permissions" VALUES(3,248);
INSERT INTO "role_permissions" VALUES(10,248);
INSERT INTO "role_permissions" VALUES(17,248);
INSERT INTO "role_permissions" VALUES(24,248);
INSERT INTO "role_permissions" VALUES(3,249);
INSERT INTO "role_permissions" VALUES(10,249);
INSERT INTO "role_permissions" VALUES(17,249);
INSERT INTO "role_permissions" VALUES(24,249);
INSERT INTO "role_permissions" VALUES(3,250);
INSERT INTO "role_permissions" VALUES(10,250);
INSERT INTO "role_permissions" VALUES(17,250);
INSERT INTO "role_permissions" VALUES(24,250);
INSERT INTO "role_permissions" VALUES(3,251);
INSERT INTO "role_permissions" VALUES(10,251);
INSERT INTO "role_permissions" VALUES(17,251);
INSERT INTO "role_permissions" VALUES(24,251);
INSERT INTO "role_permissions" VALUES(3,252);
INSERT INTO "role_permissions" VALUES(10,252);
INSERT INTO "role_permissions" VALUES(17,252);
INSERT INTO "role_permissions" VALUES(24,252);
INSERT INTO "role_permissions" VALUES(1,1);
INSERT INTO "role_permissions" VALUES(1,2);
INSERT INTO "role_permissions" VALUES(1,3);
INSERT INTO "role_permissions" VALUES(1,4);
INSERT INTO "role_permissions" VALUES(1,5);
INSERT INTO "role_permissions" VALUES(1,6);
INSERT INTO "role_permissions" VALUES(1,7);
INSERT INTO "role_permissions" VALUES(1,8);
INSERT INTO "role_permissions" VALUES(1,9);
INSERT INTO "role_permissions" VALUES(1,10);
INSERT INTO "role_permissions" VALUES(1,11);
INSERT INTO "role_permissions" VALUES(1,12);
INSERT INTO "role_permissions" VALUES(1,13);
INSERT INTO "role_permissions" VALUES(1,14);
INSERT INTO "role_permissions" VALUES(1,15);
INSERT INTO "role_permissions" VALUES(1,16);
INSERT INTO "role_permissions" VALUES(1,17);
INSERT INTO "role_permissions" VALUES(1,18);
INSERT INTO "role_permissions" VALUES(1,19);
INSERT INTO "role_permissions" VALUES(1,20);
INSERT INTO "role_permissions" VALUES(1,21);
INSERT INTO "role_permissions" VALUES(1,22);
INSERT INTO "role_permissions" VALUES(1,23);
INSERT INTO "role_permissions" VALUES(1,24);
INSERT INTO "role_permissions" VALUES(1,25);
INSERT INTO "role_permissions" VALUES(1,26);
INSERT INTO "role_permissions" VALUES(1,27);
INSERT INTO "role_permissions" VALUES(1,28);
INSERT INTO "role_permissions" VALUES(1,29);
INSERT INTO "role_permissions" VALUES(1,30);
INSERT INTO "role_permissions" VALUES(1,31);
INSERT INTO "role_permissions" VALUES(1,32);
INSERT INTO "role_permissions" VALUES(1,33);
INSERT INTO "role_permissions" VALUES(1,34);
INSERT INTO "role_permissions" VALUES(1,35);
INSERT INTO "role_permissions" VALUES(1,36);
INSERT INTO "role_permissions" VALUES(1,37);
INSERT INTO "role_permissions" VALUES(1,38);
INSERT INTO "role_permissions" VALUES(1,39);
INSERT INTO "role_permissions" VALUES(1,40);
INSERT INTO "role_permissions" VALUES(1,41);
INSERT INTO "role_permissions" VALUES(1,42);
INSERT INTO "role_permissions" VALUES(1,43);
INSERT INTO "role_permissions" VALUES(1,44);
INSERT INTO "role_permissions" VALUES(1,45);
INSERT INTO "role_permissions" VALUES(1,46);
INSERT INTO "role_permissions" VALUES(1,47);
INSERT INTO "role_permissions" VALUES(1,48);
INSERT INTO "role_permissions" VALUES(1,49);
INSERT INTO "role_permissions" VALUES(1,50);
INSERT INTO "role_permissions" VALUES(1,51);
INSERT INTO "role_permissions" VALUES(1,52);
INSERT INTO "role_permissions" VALUES(1,53);
INSERT INTO "role_permissions" VALUES(1,54);
INSERT INTO "role_permissions" VALUES(1,55);
INSERT INTO "role_permissions" VALUES(1,56);
INSERT INTO "role_permissions" VALUES(1,57);
INSERT INTO "role_permissions" VALUES(1,58);
INSERT INTO "role_permissions" VALUES(1,59);
INSERT INTO "role_permissions" VALUES(1,60);
INSERT INTO "role_permissions" VALUES(1,61);
INSERT INTO "role_permissions" VALUES(1,62);
INSERT INTO "role_permissions" VALUES(1,63);
INSERT INTO "role_permissions" VALUES(1,64);
INSERT INTO "role_permissions" VALUES(1,65);
INSERT INTO "role_permissions" VALUES(1,66);
INSERT INTO "role_permissions" VALUES(1,67);
INSERT INTO "role_permissions" VALUES(1,68);
INSERT INTO "role_permissions" VALUES(1,69);
INSERT INTO "role_permissions" VALUES(1,70);
INSERT INTO "role_permissions" VALUES(1,71);
INSERT INTO "role_permissions" VALUES(1,72);
INSERT INTO "role_permissions" VALUES(1,73);
INSERT INTO "role_permissions" VALUES(1,74);
INSERT INTO "role_permissions" VALUES(1,75);
INSERT INTO "role_permissions" VALUES(1,76);
INSERT INTO "role_permissions" VALUES(1,77);
INSERT INTO "role_permissions" VALUES(1,78);
INSERT INTO "role_permissions" VALUES(1,79);
INSERT INTO "role_permissions" VALUES(1,80);
INSERT INTO "role_permissions" VALUES(1,81);
INSERT INTO "role_permissions" VALUES(1,82);
INSERT INTO "role_permissions" VALUES(1,83);
INSERT INTO "role_permissions" VALUES(1,84);
INSERT INTO "role_permissions" VALUES(1,85);
INSERT INTO "role_permissions" VALUES(1,86);
INSERT INTO "role_permissions" VALUES(1,87);
INSERT INTO "role_permissions" VALUES(1,88);
INSERT INTO "role_permissions" VALUES(1,89);
INSERT INTO "role_permissions" VALUES(1,90);
INSERT INTO "role_permissions" VALUES(1,91);
INSERT INTO "role_permissions" VALUES(1,92);
INSERT INTO "role_permissions" VALUES(1,93);
INSERT INTO "role_permissions" VALUES(1,94);
INSERT INTO "role_permissions" VALUES(1,95);
INSERT INTO "role_permissions" VALUES(1,96);
INSERT INTO "role_permissions" VALUES(1,97);
INSERT INTO "role_permissions" VALUES(1,98);
INSERT INTO "role_permissions" VALUES(1,99);
INSERT INTO "role_permissions" VALUES(1,100);
INSERT INTO "role_permissions" VALUES(1,101);
INSERT INTO "role_permissions" VALUES(1,102);
INSERT INTO "role_permissions" VALUES(1,103);
INSERT INTO "role_permissions" VALUES(1,104);
INSERT INTO "role_permissions" VALUES(1,105);
INSERT INTO "role_permissions" VALUES(1,106);
INSERT INTO "role_permissions" VALUES(1,107);
INSERT INTO "role_permissions" VALUES(1,108);
INSERT INTO "role_permissions" VALUES(1,109);
INSERT INTO "role_permissions" VALUES(1,110);
INSERT INTO "role_permissions" VALUES(1,111);
INSERT INTO "role_permissions" VALUES(1,112);
INSERT INTO "role_permissions" VALUES(1,113);
INSERT INTO "role_permissions" VALUES(1,114);
INSERT INTO "role_permissions" VALUES(1,115);
INSERT INTO "role_permissions" VALUES(1,116);
INSERT INTO "role_permissions" VALUES(1,117);
INSERT INTO "role_permissions" VALUES(1,118);
INSERT INTO "role_permissions" VALUES(1,119);
INSERT INTO "role_permissions" VALUES(1,120);
INSERT INTO "role_permissions" VALUES(1,121);
INSERT INTO "role_permissions" VALUES(1,122);
INSERT INTO "role_permissions" VALUES(1,123);
INSERT INTO "role_permissions" VALUES(1,124);
INSERT INTO "role_permissions" VALUES(1,125);
INSERT INTO "role_permissions" VALUES(1,126);
INSERT INTO "role_permissions" VALUES(1,127);
INSERT INTO "role_permissions" VALUES(1,128);
INSERT INTO "role_permissions" VALUES(1,129);
INSERT INTO "role_permissions" VALUES(1,130);
INSERT INTO "role_permissions" VALUES(1,131);
INSERT INTO "role_permissions" VALUES(1,132);
INSERT INTO "role_permissions" VALUES(1,133);
INSERT INTO "role_permissions" VALUES(1,134);
INSERT INTO "role_permissions" VALUES(1,135);
INSERT INTO "role_permissions" VALUES(1,136);
INSERT INTO "role_permissions" VALUES(1,137);
INSERT INTO "role_permissions" VALUES(1,138);
INSERT INTO "role_permissions" VALUES(1,139);
INSERT INTO "role_permissions" VALUES(1,140);
INSERT INTO "role_permissions" VALUES(1,141);
INSERT INTO "role_permissions" VALUES(1,142);
INSERT INTO "role_permissions" VALUES(1,143);
INSERT INTO "role_permissions" VALUES(1,144);
INSERT INTO "role_permissions" VALUES(1,145);
INSERT INTO "role_permissions" VALUES(1,146);
INSERT INTO "role_permissions" VALUES(1,147);
INSERT INTO "role_permissions" VALUES(1,148);
INSERT INTO "role_permissions" VALUES(1,149);
INSERT INTO "role_permissions" VALUES(1,150);
INSERT INTO "role_permissions" VALUES(1,151);
INSERT INTO "role_permissions" VALUES(1,152);
INSERT INTO "role_permissions" VALUES(1,153);
INSERT INTO "role_permissions" VALUES(1,154);
INSERT INTO "role_permissions" VALUES(1,155);
INSERT INTO "role_permissions" VALUES(1,156);
INSERT INTO "role_permissions" VALUES(1,157);
INSERT INTO "role_permissions" VALUES(1,158);
INSERT INTO "role_permissions" VALUES(1,159);
INSERT INTO "role_permissions" VALUES(1,160);
INSERT INTO "role_permissions" VALUES(1,161);
INSERT INTO "role_permissions" VALUES(1,162);
INSERT INTO "role_permissions" VALUES(1,163);
INSERT INTO "role_permissions" VALUES(1,164);
INSERT INTO "role_permissions" VALUES(1,165);
INSERT INTO "role_permissions" VALUES(1,166);
INSERT INTO "role_permissions" VALUES(1,167);
INSERT INTO "role_permissions" VALUES(1,168);
INSERT INTO "role_permissions" VALUES(1,169);
INSERT INTO "role_permissions" VALUES(1,170);
INSERT INTO "role_permissions" VALUES(1,171);
INSERT INTO "role_permissions" VALUES(1,172);
INSERT INTO "role_permissions" VALUES(1,173);
INSERT INTO "role_permissions" VALUES(1,174);
INSERT INTO "role_permissions" VALUES(1,175);
INSERT INTO "role_permissions" VALUES(1,176);
INSERT INTO "role_permissions" VALUES(1,177);
INSERT INTO "role_permissions" VALUES(1,178);
INSERT INTO "role_permissions" VALUES(1,179);
INSERT INTO "role_permissions" VALUES(1,180);
INSERT INTO "role_permissions" VALUES(1,181);
INSERT INTO "role_permissions" VALUES(1,182);
INSERT INTO "role_permissions" VALUES(1,183);
INSERT INTO "role_permissions" VALUES(1,184);
INSERT INTO "role_permissions" VALUES(1,185);
INSERT INTO "role_permissions" VALUES(1,186);
INSERT INTO "role_permissions" VALUES(1,187);
INSERT INTO "role_permissions" VALUES(1,188);
INSERT INTO "role_permissions" VALUES(1,189);
INSERT INTO "role_permissions" VALUES(1,190);
INSERT INTO "role_permissions" VALUES(1,191);
INSERT INTO "role_permissions" VALUES(1,192);
INSERT INTO "role_permissions" VALUES(1,193);
INSERT INTO "role_permissions" VALUES(1,194);
INSERT INTO "role_permissions" VALUES(1,195);
INSERT INTO "role_permissions" VALUES(1,196);
INSERT INTO "role_permissions" VALUES(1,197);
INSERT INTO "role_permissions" VALUES(1,198);
INSERT INTO "role_permissions" VALUES(1,199);
INSERT INTO "role_permissions" VALUES(1,200);
INSERT INTO "role_permissions" VALUES(1,201);
INSERT INTO "role_permissions" VALUES(1,202);
INSERT INTO "role_permissions" VALUES(1,203);
INSERT INTO "role_permissions" VALUES(1,204);
INSERT INTO "role_permissions" VALUES(1,205);
INSERT INTO "role_permissions" VALUES(1,206);
INSERT INTO "role_permissions" VALUES(1,207);
INSERT INTO "role_permissions" VALUES(1,208);
INSERT INTO "role_permissions" VALUES(1,209);
INSERT INTO "role_permissions" VALUES(1,210);
INSERT INTO "role_permissions" VALUES(1,211);
INSERT INTO "role_permissions" VALUES(1,212);
INSERT INTO "role_permissions" VALUES(1,213);
INSERT INTO "role_permissions" VALUES(1,214);
INSERT INTO "role_permissions" VALUES(1,215);
INSERT INTO "role_permissions" VALUES(1,216);
INSERT INTO "role_permissions" VALUES(1,217);
INSERT INTO "role_permissions" VALUES(1,218);
INSERT INTO "role_permissions" VALUES(1,219);
INSERT INTO "role_permissions" VALUES(1,220);
INSERT INTO "role_permissions" VALUES(1,221);
INSERT INTO "role_permissions" VALUES(1,222);
INSERT INTO "role_permissions" VALUES(1,223);
INSERT INTO "role_permissions" VALUES(1,224);
INSERT INTO "role_permissions" VALUES(1,225);
INSERT INTO "role_permissions" VALUES(1,226);
INSERT INTO "role_permissions" VALUES(1,227);
INSERT INTO "role_permissions" VALUES(1,228);
INSERT INTO "role_permissions" VALUES(1,229);
INSERT INTO "role_permissions" VALUES(1,230);
INSERT INTO "role_permissions" VALUES(1,231);
INSERT INTO "role_permissions" VALUES(1,232);
INSERT INTO "role_permissions" VALUES(1,233);
INSERT INTO "role_permissions" VALUES(1,234);
INSERT INTO "role_permissions" VALUES(1,235);
INSERT INTO "role_permissions" VALUES(1,236);
INSERT INTO "role_permissions" VALUES(1,237);
INSERT INTO "role_permissions" VALUES(1,238);
INSERT INTO "role_permissions" VALUES(1,239);
INSERT INTO "role_permissions" VALUES(1,240);
INSERT INTO "role_permissions" VALUES(1,241);
INSERT INTO "role_permissions" VALUES(1,242);
INSERT INTO "role_permissions" VALUES(1,243);
INSERT INTO "role_permissions" VALUES(1,244);
INSERT INTO "role_permissions" VALUES(1,245);
INSERT INTO "role_permissions" VALUES(1,246);
INSERT INTO "role_permissions" VALUES(1,247);
INSERT INTO "role_permissions" VALUES(1,248);
INSERT INTO "role_permissions" VALUES(1,249);
INSERT INTO "role_permissions" VALUES(1,250);
INSERT INTO "role_permissions" VALUES(1,251);
INSERT INTO "role_permissions" VALUES(1,252);
INSERT INTO "role_permissions" VALUES(1,253);
INSERT INTO "role_permissions" VALUES(1,254);
INSERT INTO "role_permissions" VALUES(1,255);
INSERT INTO "role_permissions" VALUES(1,256);
INSERT INTO "role_permissions" VALUES(1,257);
INSERT INTO "role_permissions" VALUES(1,258);
INSERT INTO "role_permissions" VALUES(1,259);
INSERT INTO "role_permissions" VALUES(1,260);
INSERT INTO "role_permissions" VALUES(1,261);
INSERT INTO "role_permissions" VALUES(1,262);
INSERT INTO "role_permissions" VALUES(1,263);
INSERT INTO "role_permissions" VALUES(1,264);
INSERT INTO "role_permissions" VALUES(1,265);
INSERT INTO "role_permissions" VALUES(1,266);
INSERT INTO "role_permissions" VALUES(1,267);
INSERT INTO "role_permissions" VALUES(1,268);
INSERT INTO "role_permissions" VALUES(1,269);
INSERT INTO "role_permissions" VALUES(1,270);
INSERT INTO "role_permissions" VALUES(1,271);
INSERT INTO "role_permissions" VALUES(1,272);
INSERT INTO "role_permissions" VALUES(1,273);
INSERT INTO "role_permissions" VALUES(1,274);
INSERT INTO "role_permissions" VALUES(1,275);
INSERT INTO "role_permissions" VALUES(1,276);
INSERT INTO "role_permissions" VALUES(1,277);
INSERT INTO "role_permissions" VALUES(1,278);
INSERT INTO "role_permissions" VALUES(1,279);
INSERT INTO "role_permissions" VALUES(1,280);
INSERT INTO "role_permissions" VALUES(1,281);
INSERT INTO "role_permissions" VALUES(1,282);
INSERT INTO "role_permissions" VALUES(1,283);
INSERT INTO "role_permissions" VALUES(1,284);
INSERT INTO "role_permissions" VALUES(1,285);
INSERT INTO "role_permissions" VALUES(1,286);
INSERT INTO "role_permissions" VALUES(1,287);
INSERT INTO "role_permissions" VALUES(1,288);
INSERT INTO "role_permissions" VALUES(1,289);
INSERT INTO "role_permissions" VALUES(1,290);
INSERT INTO "role_permissions" VALUES(1,291);
INSERT INTO "role_permissions" VALUES(1,292);
INSERT INTO "role_permissions" VALUES(1,293);
INSERT INTO "role_permissions" VALUES(1,294);
INSERT INTO "role_permissions" VALUES(1,295);
INSERT INTO "role_permissions" VALUES(1,296);
INSERT INTO "role_permissions" VALUES(1,297);
INSERT INTO "role_permissions" VALUES(1,298);
INSERT INTO "role_permissions" VALUES(1,299);
INSERT INTO "role_permissions" VALUES(1,300);
INSERT INTO "role_permissions" VALUES(1,301);
INSERT INTO "role_permissions" VALUES(1,302);
INSERT INTO "role_permissions" VALUES(1,303);
INSERT INTO "role_permissions" VALUES(1,304);
INSERT INTO "role_permissions" VALUES(1,305);
INSERT INTO "role_permissions" VALUES(1,306);
INSERT INTO "role_permissions" VALUES(1,307);
INSERT INTO "role_permissions" VALUES(1,308);
INSERT INTO "role_permissions" VALUES(1,309);
INSERT INTO "role_permissions" VALUES(1,310);
INSERT INTO "role_permissions" VALUES(1,311);
INSERT INTO "role_permissions" VALUES(1,312);
INSERT INTO "role_permissions" VALUES(1,313);
INSERT INTO "role_permissions" VALUES(1,314);
INSERT INTO "role_permissions" VALUES(1,315);
INSERT INTO "role_permissions" VALUES(2,1);
INSERT INTO "role_permissions" VALUES(2,2);
INSERT INTO "role_permissions" VALUES(2,3);
INSERT INTO "role_permissions" VALUES(2,4);
INSERT INTO "role_permissions" VALUES(2,5);
INSERT INTO "role_permissions" VALUES(2,6);
INSERT INTO "role_permissions" VALUES(2,7);
INSERT INTO "role_permissions" VALUES(2,8);
INSERT INTO "role_permissions" VALUES(2,9);
INSERT INTO "role_permissions" VALUES(2,10);
INSERT INTO "role_permissions" VALUES(2,11);
INSERT INTO "role_permissions" VALUES(2,12);
INSERT INTO "role_permissions" VALUES(2,13);
INSERT INTO "role_permissions" VALUES(2,14);
INSERT INTO "role_permissions" VALUES(2,15);
INSERT INTO "role_permissions" VALUES(2,16);
INSERT INTO "role_permissions" VALUES(2,17);
INSERT INTO "role_permissions" VALUES(2,18);
INSERT INTO "role_permissions" VALUES(2,19);
INSERT INTO "role_permissions" VALUES(2,20);
INSERT INTO "role_permissions" VALUES(2,21);
INSERT INTO "role_permissions" VALUES(2,22);
INSERT INTO "role_permissions" VALUES(2,23);
INSERT INTO "role_permissions" VALUES(2,24);
INSERT INTO "role_permissions" VALUES(2,25);
INSERT INTO "role_permissions" VALUES(2,26);
INSERT INTO "role_permissions" VALUES(2,27);
INSERT INTO "role_permissions" VALUES(2,28);
INSERT INTO "role_permissions" VALUES(2,29);
INSERT INTO "role_permissions" VALUES(2,30);
INSERT INTO "role_permissions" VALUES(2,31);
INSERT INTO "role_permissions" VALUES(2,32);
INSERT INTO "role_permissions" VALUES(2,33);
INSERT INTO "role_permissions" VALUES(2,34);
INSERT INTO "role_permissions" VALUES(2,35);
INSERT INTO "role_permissions" VALUES(2,36);
INSERT INTO "role_permissions" VALUES(2,37);
INSERT INTO "role_permissions" VALUES(2,38);
INSERT INTO "role_permissions" VALUES(2,39);
INSERT INTO "role_permissions" VALUES(2,40);
INSERT INTO "role_permissions" VALUES(2,41);
INSERT INTO "role_permissions" VALUES(2,42);
INSERT INTO "role_permissions" VALUES(2,43);
INSERT INTO "role_permissions" VALUES(2,44);
INSERT INTO "role_permissions" VALUES(2,45);
INSERT INTO "role_permissions" VALUES(2,46);
INSERT INTO "role_permissions" VALUES(2,47);
INSERT INTO "role_permissions" VALUES(2,48);
INSERT INTO "role_permissions" VALUES(2,49);
INSERT INTO "role_permissions" VALUES(2,50);
INSERT INTO "role_permissions" VALUES(2,51);
INSERT INTO "role_permissions" VALUES(2,52);
INSERT INTO "role_permissions" VALUES(2,53);
INSERT INTO "role_permissions" VALUES(2,54);
INSERT INTO "role_permissions" VALUES(2,55);
INSERT INTO "role_permissions" VALUES(2,56);
INSERT INTO "role_permissions" VALUES(2,57);
INSERT INTO "role_permissions" VALUES(2,58);
INSERT INTO "role_permissions" VALUES(2,59);
INSERT INTO "role_permissions" VALUES(2,60);
INSERT INTO "role_permissions" VALUES(2,61);
INSERT INTO "role_permissions" VALUES(2,62);
INSERT INTO "role_permissions" VALUES(2,63);
INSERT INTO "role_permissions" VALUES(2,64);
INSERT INTO "role_permissions" VALUES(2,65);
INSERT INTO "role_permissions" VALUES(2,66);
INSERT INTO "role_permissions" VALUES(2,67);
INSERT INTO "role_permissions" VALUES(2,68);
INSERT INTO "role_permissions" VALUES(2,69);
INSERT INTO "role_permissions" VALUES(2,70);
INSERT INTO "role_permissions" VALUES(2,71);
INSERT INTO "role_permissions" VALUES(2,72);
INSERT INTO "role_permissions" VALUES(2,73);
INSERT INTO "role_permissions" VALUES(2,74);
INSERT INTO "role_permissions" VALUES(2,75);
INSERT INTO "role_permissions" VALUES(2,76);
INSERT INTO "role_permissions" VALUES(2,77);
INSERT INTO "role_permissions" VALUES(2,78);
INSERT INTO "role_permissions" VALUES(2,79);
INSERT INTO "role_permissions" VALUES(2,80);
INSERT INTO "role_permissions" VALUES(2,81);
INSERT INTO "role_permissions" VALUES(2,82);
INSERT INTO "role_permissions" VALUES(2,83);
INSERT INTO "role_permissions" VALUES(2,84);
INSERT INTO "role_permissions" VALUES(2,85);
INSERT INTO "role_permissions" VALUES(2,86);
INSERT INTO "role_permissions" VALUES(2,87);
INSERT INTO "role_permissions" VALUES(2,88);
INSERT INTO "role_permissions" VALUES(2,89);
INSERT INTO "role_permissions" VALUES(2,90);
INSERT INTO "role_permissions" VALUES(2,91);
INSERT INTO "role_permissions" VALUES(2,92);
INSERT INTO "role_permissions" VALUES(2,93);
INSERT INTO "role_permissions" VALUES(2,94);
INSERT INTO "role_permissions" VALUES(2,95);
INSERT INTO "role_permissions" VALUES(2,96);
INSERT INTO "role_permissions" VALUES(2,97);
INSERT INTO "role_permissions" VALUES(2,98);
INSERT INTO "role_permissions" VALUES(2,99);
INSERT INTO "role_permissions" VALUES(2,100);
INSERT INTO "role_permissions" VALUES(2,101);
INSERT INTO "role_permissions" VALUES(2,102);
INSERT INTO "role_permissions" VALUES(2,103);
INSERT INTO "role_permissions" VALUES(2,104);
INSERT INTO "role_permissions" VALUES(2,105);
INSERT INTO "role_permissions" VALUES(2,106);
INSERT INTO "role_permissions" VALUES(2,107);
INSERT INTO "role_permissions" VALUES(2,108);
INSERT INTO "role_permissions" VALUES(2,109);
INSERT INTO "role_permissions" VALUES(2,110);
INSERT INTO "role_permissions" VALUES(2,111);
INSERT INTO "role_permissions" VALUES(2,112);
INSERT INTO "role_permissions" VALUES(2,113);
INSERT INTO "role_permissions" VALUES(2,114);
INSERT INTO "role_permissions" VALUES(2,115);
INSERT INTO "role_permissions" VALUES(2,116);
INSERT INTO "role_permissions" VALUES(2,117);
INSERT INTO "role_permissions" VALUES(2,118);
INSERT INTO "role_permissions" VALUES(2,119);
INSERT INTO "role_permissions" VALUES(2,120);
INSERT INTO "role_permissions" VALUES(2,121);
INSERT INTO "role_permissions" VALUES(2,122);
INSERT INTO "role_permissions" VALUES(2,123);
INSERT INTO "role_permissions" VALUES(2,124);
INSERT INTO "role_permissions" VALUES(2,125);
INSERT INTO "role_permissions" VALUES(2,126);
INSERT INTO "role_permissions" VALUES(2,127);
INSERT INTO "role_permissions" VALUES(2,128);
INSERT INTO "role_permissions" VALUES(2,129);
INSERT INTO "role_permissions" VALUES(2,130);
INSERT INTO "role_permissions" VALUES(2,131);
INSERT INTO "role_permissions" VALUES(2,132);
INSERT INTO "role_permissions" VALUES(2,133);
INSERT INTO "role_permissions" VALUES(2,134);
INSERT INTO "role_permissions" VALUES(2,135);
INSERT INTO "role_permissions" VALUES(2,136);
INSERT INTO "role_permissions" VALUES(2,137);
INSERT INTO "role_permissions" VALUES(2,138);
INSERT INTO "role_permissions" VALUES(2,139);
INSERT INTO "role_permissions" VALUES(2,140);
INSERT INTO "role_permissions" VALUES(2,141);
INSERT INTO "role_permissions" VALUES(2,142);
INSERT INTO "role_permissions" VALUES(2,143);
INSERT INTO "role_permissions" VALUES(2,144);
INSERT INTO "role_permissions" VALUES(2,145);
INSERT INTO "role_permissions" VALUES(2,146);
INSERT INTO "role_permissions" VALUES(2,147);
INSERT INTO "role_permissions" VALUES(2,148);
INSERT INTO "role_permissions" VALUES(2,149);
INSERT INTO "role_permissions" VALUES(2,150);
INSERT INTO "role_permissions" VALUES(2,151);
INSERT INTO "role_permissions" VALUES(2,152);
INSERT INTO "role_permissions" VALUES(2,153);
INSERT INTO "role_permissions" VALUES(2,154);
INSERT INTO "role_permissions" VALUES(2,155);
INSERT INTO "role_permissions" VALUES(2,156);
INSERT INTO "role_permissions" VALUES(2,157);
INSERT INTO "role_permissions" VALUES(2,158);
INSERT INTO "role_permissions" VALUES(2,159);
INSERT INTO "role_permissions" VALUES(2,160);
INSERT INTO "role_permissions" VALUES(2,161);
INSERT INTO "role_permissions" VALUES(2,162);
INSERT INTO "role_permissions" VALUES(2,163);
INSERT INTO "role_permissions" VALUES(2,164);
INSERT INTO "role_permissions" VALUES(2,165);
INSERT INTO "role_permissions" VALUES(2,166);
INSERT INTO "role_permissions" VALUES(2,167);
INSERT INTO "role_permissions" VALUES(2,168);
INSERT INTO "role_permissions" VALUES(2,169);
INSERT INTO "role_permissions" VALUES(2,170);
INSERT INTO "role_permissions" VALUES(2,171);
INSERT INTO "role_permissions" VALUES(2,172);
INSERT INTO "role_permissions" VALUES(2,173);
INSERT INTO "role_permissions" VALUES(2,174);
INSERT INTO "role_permissions" VALUES(2,175);
INSERT INTO "role_permissions" VALUES(2,176);
INSERT INTO "role_permissions" VALUES(2,177);
INSERT INTO "role_permissions" VALUES(2,178);
INSERT INTO "role_permissions" VALUES(2,179);
INSERT INTO "role_permissions" VALUES(2,180);
INSERT INTO "role_permissions" VALUES(2,181);
INSERT INTO "role_permissions" VALUES(2,182);
INSERT INTO "role_permissions" VALUES(2,183);
INSERT INTO "role_permissions" VALUES(2,184);
INSERT INTO "role_permissions" VALUES(2,185);
INSERT INTO "role_permissions" VALUES(2,186);
INSERT INTO "role_permissions" VALUES(2,187);
INSERT INTO "role_permissions" VALUES(2,188);
INSERT INTO "role_permissions" VALUES(2,189);
INSERT INTO "role_permissions" VALUES(2,190);
INSERT INTO "role_permissions" VALUES(2,191);
INSERT INTO "role_permissions" VALUES(2,192);
INSERT INTO "role_permissions" VALUES(2,193);
INSERT INTO "role_permissions" VALUES(2,194);
INSERT INTO "role_permissions" VALUES(2,195);
INSERT INTO "role_permissions" VALUES(2,196);
INSERT INTO "role_permissions" VALUES(2,197);
INSERT INTO "role_permissions" VALUES(2,198);
INSERT INTO "role_permissions" VALUES(2,199);
INSERT INTO "role_permissions" VALUES(2,200);
INSERT INTO "role_permissions" VALUES(2,201);
INSERT INTO "role_permissions" VALUES(2,202);
INSERT INTO "role_permissions" VALUES(2,203);
INSERT INTO "role_permissions" VALUES(2,204);
INSERT INTO "role_permissions" VALUES(2,205);
INSERT INTO "role_permissions" VALUES(2,206);
INSERT INTO "role_permissions" VALUES(2,207);
INSERT INTO "role_permissions" VALUES(2,208);
INSERT INTO "role_permissions" VALUES(2,209);
INSERT INTO "role_permissions" VALUES(2,210);
INSERT INTO "role_permissions" VALUES(2,211);
INSERT INTO "role_permissions" VALUES(2,212);
INSERT INTO "role_permissions" VALUES(2,213);
INSERT INTO "role_permissions" VALUES(2,214);
INSERT INTO "role_permissions" VALUES(2,215);
INSERT INTO "role_permissions" VALUES(2,216);
INSERT INTO "role_permissions" VALUES(2,217);
INSERT INTO "role_permissions" VALUES(2,218);
INSERT INTO "role_permissions" VALUES(2,219);
INSERT INTO "role_permissions" VALUES(2,220);
INSERT INTO "role_permissions" VALUES(2,221);
INSERT INTO "role_permissions" VALUES(2,222);
INSERT INTO "role_permissions" VALUES(2,223);
INSERT INTO "role_permissions" VALUES(2,224);
INSERT INTO "role_permissions" VALUES(2,225);
INSERT INTO "role_permissions" VALUES(2,226);
INSERT INTO "role_permissions" VALUES(2,227);
INSERT INTO "role_permissions" VALUES(2,228);
INSERT INTO "role_permissions" VALUES(2,229);
INSERT INTO "role_permissions" VALUES(2,230);
INSERT INTO "role_permissions" VALUES(2,231);
INSERT INTO "role_permissions" VALUES(2,232);
INSERT INTO "role_permissions" VALUES(2,233);
INSERT INTO "role_permissions" VALUES(2,234);
INSERT INTO "role_permissions" VALUES(2,235);
INSERT INTO "role_permissions" VALUES(2,236);
INSERT INTO "role_permissions" VALUES(2,237);
INSERT INTO "role_permissions" VALUES(2,238);
INSERT INTO "role_permissions" VALUES(2,239);
INSERT INTO "role_permissions" VALUES(2,240);
INSERT INTO "role_permissions" VALUES(2,241);
INSERT INTO "role_permissions" VALUES(2,242);
INSERT INTO "role_permissions" VALUES(2,243);
INSERT INTO "role_permissions" VALUES(2,244);
INSERT INTO "role_permissions" VALUES(2,245);
INSERT INTO "role_permissions" VALUES(2,246);
INSERT INTO "role_permissions" VALUES(2,247);
INSERT INTO "role_permissions" VALUES(2,248);
INSERT INTO "role_permissions" VALUES(2,249);
INSERT INTO "role_permissions" VALUES(2,250);
INSERT INTO "role_permissions" VALUES(2,251);
INSERT INTO "role_permissions" VALUES(2,252);
INSERT INTO "role_permissions" VALUES(2,253);
INSERT INTO "role_permissions" VALUES(2,254);
INSERT INTO "role_permissions" VALUES(2,255);
INSERT INTO "role_permissions" VALUES(2,256);
INSERT INTO "role_permissions" VALUES(2,257);
INSERT INTO "role_permissions" VALUES(2,258);
INSERT INTO "role_permissions" VALUES(2,259);
INSERT INTO "role_permissions" VALUES(2,260);
INSERT INTO "role_permissions" VALUES(2,261);
INSERT INTO "role_permissions" VALUES(2,262);
INSERT INTO "role_permissions" VALUES(2,263);
INSERT INTO "role_permissions" VALUES(2,264);
INSERT INTO "role_permissions" VALUES(2,265);
INSERT INTO "role_permissions" VALUES(2,266);
INSERT INTO "role_permissions" VALUES(2,267);
INSERT INTO "role_permissions" VALUES(2,268);
INSERT INTO "role_permissions" VALUES(2,269);
INSERT INTO "role_permissions" VALUES(2,270);
INSERT INTO "role_permissions" VALUES(2,271);
INSERT INTO "role_permissions" VALUES(2,272);
INSERT INTO "role_permissions" VALUES(2,273);
INSERT INTO "role_permissions" VALUES(2,274);
INSERT INTO "role_permissions" VALUES(2,275);
INSERT INTO "role_permissions" VALUES(2,276);
INSERT INTO "role_permissions" VALUES(2,277);
INSERT INTO "role_permissions" VALUES(2,278);
INSERT INTO "role_permissions" VALUES(2,279);
INSERT INTO "role_permissions" VALUES(2,280);
INSERT INTO "role_permissions" VALUES(2,281);
INSERT INTO "role_permissions" VALUES(2,282);
INSERT INTO "role_permissions" VALUES(2,283);
INSERT INTO "role_permissions" VALUES(2,284);
INSERT INTO "role_permissions" VALUES(2,285);
INSERT INTO "role_permissions" VALUES(2,286);
INSERT INTO "role_permissions" VALUES(2,287);
INSERT INTO "role_permissions" VALUES(2,288);
INSERT INTO "role_permissions" VALUES(2,289);
INSERT INTO "role_permissions" VALUES(2,290);
INSERT INTO "role_permissions" VALUES(2,291);
INSERT INTO "role_permissions" VALUES(2,292);
INSERT INTO "role_permissions" VALUES(2,293);
INSERT INTO "role_permissions" VALUES(2,294);
INSERT INTO "role_permissions" VALUES(2,295);
INSERT INTO "role_permissions" VALUES(2,296);
INSERT INTO "role_permissions" VALUES(2,297);
INSERT INTO "role_permissions" VALUES(2,298);
INSERT INTO "role_permissions" VALUES(2,299);
INSERT INTO "role_permissions" VALUES(2,300);
INSERT INTO "role_permissions" VALUES(2,301);
INSERT INTO "role_permissions" VALUES(2,302);
INSERT INTO "role_permissions" VALUES(2,303);
INSERT INTO "role_permissions" VALUES(2,304);
INSERT INTO "role_permissions" VALUES(2,305);
INSERT INTO "role_permissions" VALUES(2,306);
INSERT INTO "role_permissions" VALUES(2,307);
INSERT INTO "role_permissions" VALUES(2,308);
INSERT INTO "role_permissions" VALUES(2,309);
INSERT INTO "role_permissions" VALUES(2,310);
INSERT INTO "role_permissions" VALUES(2,311);
INSERT INTO "role_permissions" VALUES(2,312);
INSERT INTO "role_permissions" VALUES(2,313);
INSERT INTO "role_permissions" VALUES(2,314);
INSERT INTO "role_permissions" VALUES(2,315);
INSERT INTO "role_permissions" VALUES(8,1);
INSERT INTO "role_permissions" VALUES(8,2);
INSERT INTO "role_permissions" VALUES(8,3);
INSERT INTO "role_permissions" VALUES(8,4);
INSERT INTO "role_permissions" VALUES(8,5);
INSERT INTO "role_permissions" VALUES(8,6);
INSERT INTO "role_permissions" VALUES(8,7);
INSERT INTO "role_permissions" VALUES(8,8);
INSERT INTO "role_permissions" VALUES(8,9);
INSERT INTO "role_permissions" VALUES(8,10);
INSERT INTO "role_permissions" VALUES(8,11);
INSERT INTO "role_permissions" VALUES(8,12);
INSERT INTO "role_permissions" VALUES(8,13);
INSERT INTO "role_permissions" VALUES(8,14);
INSERT INTO "role_permissions" VALUES(8,15);
INSERT INTO "role_permissions" VALUES(8,16);
INSERT INTO "role_permissions" VALUES(8,17);
INSERT INTO "role_permissions" VALUES(8,18);
INSERT INTO "role_permissions" VALUES(8,19);
INSERT INTO "role_permissions" VALUES(8,20);
INSERT INTO "role_permissions" VALUES(8,21);
INSERT INTO "role_permissions" VALUES(8,22);
INSERT INTO "role_permissions" VALUES(8,23);
INSERT INTO "role_permissions" VALUES(8,24);
INSERT INTO "role_permissions" VALUES(8,25);
INSERT INTO "role_permissions" VALUES(8,26);
INSERT INTO "role_permissions" VALUES(8,27);
INSERT INTO "role_permissions" VALUES(8,28);
INSERT INTO "role_permissions" VALUES(8,29);
INSERT INTO "role_permissions" VALUES(8,30);
INSERT INTO "role_permissions" VALUES(8,31);
INSERT INTO "role_permissions" VALUES(8,32);
INSERT INTO "role_permissions" VALUES(8,33);
INSERT INTO "role_permissions" VALUES(8,34);
INSERT INTO "role_permissions" VALUES(8,35);
INSERT INTO "role_permissions" VALUES(8,36);
INSERT INTO "role_permissions" VALUES(8,37);
INSERT INTO "role_permissions" VALUES(8,38);
INSERT INTO "role_permissions" VALUES(8,39);
INSERT INTO "role_permissions" VALUES(8,40);
INSERT INTO "role_permissions" VALUES(8,41);
INSERT INTO "role_permissions" VALUES(8,42);
INSERT INTO "role_permissions" VALUES(8,43);
INSERT INTO "role_permissions" VALUES(8,44);
INSERT INTO "role_permissions" VALUES(8,45);
INSERT INTO "role_permissions" VALUES(8,46);
INSERT INTO "role_permissions" VALUES(8,47);
INSERT INTO "role_permissions" VALUES(8,48);
INSERT INTO "role_permissions" VALUES(8,49);
INSERT INTO "role_permissions" VALUES(8,50);
INSERT INTO "role_permissions" VALUES(8,51);
INSERT INTO "role_permissions" VALUES(8,52);
INSERT INTO "role_permissions" VALUES(8,53);
INSERT INTO "role_permissions" VALUES(8,54);
INSERT INTO "role_permissions" VALUES(8,55);
INSERT INTO "role_permissions" VALUES(8,56);
INSERT INTO "role_permissions" VALUES(8,57);
INSERT INTO "role_permissions" VALUES(8,58);
INSERT INTO "role_permissions" VALUES(8,59);
INSERT INTO "role_permissions" VALUES(8,60);
INSERT INTO "role_permissions" VALUES(8,61);
INSERT INTO "role_permissions" VALUES(8,62);
INSERT INTO "role_permissions" VALUES(8,63);
INSERT INTO "role_permissions" VALUES(8,64);
INSERT INTO "role_permissions" VALUES(8,65);
INSERT INTO "role_permissions" VALUES(8,66);
INSERT INTO "role_permissions" VALUES(8,67);
INSERT INTO "role_permissions" VALUES(8,68);
INSERT INTO "role_permissions" VALUES(8,69);
INSERT INTO "role_permissions" VALUES(8,70);
INSERT INTO "role_permissions" VALUES(8,71);
INSERT INTO "role_permissions" VALUES(8,72);
INSERT INTO "role_permissions" VALUES(8,73);
INSERT INTO "role_permissions" VALUES(8,74);
INSERT INTO "role_permissions" VALUES(8,75);
INSERT INTO "role_permissions" VALUES(8,76);
INSERT INTO "role_permissions" VALUES(8,77);
INSERT INTO "role_permissions" VALUES(8,78);
INSERT INTO "role_permissions" VALUES(8,79);
INSERT INTO "role_permissions" VALUES(8,80);
INSERT INTO "role_permissions" VALUES(8,81);
INSERT INTO "role_permissions" VALUES(8,82);
INSERT INTO "role_permissions" VALUES(8,83);
INSERT INTO "role_permissions" VALUES(8,84);
INSERT INTO "role_permissions" VALUES(8,85);
INSERT INTO "role_permissions" VALUES(8,86);
INSERT INTO "role_permissions" VALUES(8,87);
INSERT INTO "role_permissions" VALUES(8,88);
INSERT INTO "role_permissions" VALUES(8,89);
INSERT INTO "role_permissions" VALUES(8,90);
INSERT INTO "role_permissions" VALUES(8,91);
INSERT INTO "role_permissions" VALUES(8,92);
INSERT INTO "role_permissions" VALUES(8,93);
INSERT INTO "role_permissions" VALUES(8,94);
INSERT INTO "role_permissions" VALUES(8,95);
INSERT INTO "role_permissions" VALUES(8,96);
INSERT INTO "role_permissions" VALUES(8,97);
INSERT INTO "role_permissions" VALUES(8,98);
INSERT INTO "role_permissions" VALUES(8,99);
INSERT INTO "role_permissions" VALUES(8,100);
INSERT INTO "role_permissions" VALUES(8,101);
INSERT INTO "role_permissions" VALUES(8,102);
INSERT INTO "role_permissions" VALUES(8,103);
INSERT INTO "role_permissions" VALUES(8,104);
INSERT INTO "role_permissions" VALUES(8,105);
INSERT INTO "role_permissions" VALUES(8,106);
INSERT INTO "role_permissions" VALUES(8,107);
INSERT INTO "role_permissions" VALUES(8,108);
INSERT INTO "role_permissions" VALUES(8,109);
INSERT INTO "role_permissions" VALUES(8,110);
INSERT INTO "role_permissions" VALUES(8,111);
INSERT INTO "role_permissions" VALUES(8,112);
INSERT INTO "role_permissions" VALUES(8,113);
INSERT INTO "role_permissions" VALUES(8,114);
INSERT INTO "role_permissions" VALUES(8,115);
INSERT INTO "role_permissions" VALUES(8,116);
INSERT INTO "role_permissions" VALUES(8,117);
INSERT INTO "role_permissions" VALUES(8,118);
INSERT INTO "role_permissions" VALUES(8,119);
INSERT INTO "role_permissions" VALUES(8,120);
INSERT INTO "role_permissions" VALUES(8,121);
INSERT INTO "role_permissions" VALUES(8,122);
INSERT INTO "role_permissions" VALUES(8,123);
INSERT INTO "role_permissions" VALUES(8,124);
INSERT INTO "role_permissions" VALUES(8,125);
INSERT INTO "role_permissions" VALUES(8,126);
INSERT INTO "role_permissions" VALUES(8,127);
INSERT INTO "role_permissions" VALUES(8,128);
INSERT INTO "role_permissions" VALUES(8,129);
INSERT INTO "role_permissions" VALUES(8,130);
INSERT INTO "role_permissions" VALUES(8,131);
INSERT INTO "role_permissions" VALUES(8,132);
INSERT INTO "role_permissions" VALUES(8,133);
INSERT INTO "role_permissions" VALUES(8,134);
INSERT INTO "role_permissions" VALUES(8,135);
INSERT INTO "role_permissions" VALUES(8,136);
INSERT INTO "role_permissions" VALUES(8,137);
INSERT INTO "role_permissions" VALUES(8,138);
INSERT INTO "role_permissions" VALUES(8,139);
INSERT INTO "role_permissions" VALUES(8,140);
INSERT INTO "role_permissions" VALUES(8,141);
INSERT INTO "role_permissions" VALUES(8,142);
INSERT INTO "role_permissions" VALUES(8,143);
INSERT INTO "role_permissions" VALUES(8,144);
INSERT INTO "role_permissions" VALUES(8,145);
INSERT INTO "role_permissions" VALUES(8,146);
INSERT INTO "role_permissions" VALUES(8,147);
INSERT INTO "role_permissions" VALUES(8,148);
INSERT INTO "role_permissions" VALUES(8,149);
INSERT INTO "role_permissions" VALUES(8,150);
INSERT INTO "role_permissions" VALUES(8,151);
INSERT INTO "role_permissions" VALUES(8,152);
INSERT INTO "role_permissions" VALUES(8,153);
INSERT INTO "role_permissions" VALUES(8,154);
INSERT INTO "role_permissions" VALUES(8,155);
INSERT INTO "role_permissions" VALUES(8,156);
INSERT INTO "role_permissions" VALUES(8,157);
INSERT INTO "role_permissions" VALUES(8,158);
INSERT INTO "role_permissions" VALUES(8,159);
INSERT INTO "role_permissions" VALUES(8,160);
INSERT INTO "role_permissions" VALUES(8,161);
INSERT INTO "role_permissions" VALUES(8,162);
INSERT INTO "role_permissions" VALUES(8,163);
INSERT INTO "role_permissions" VALUES(8,164);
INSERT INTO "role_permissions" VALUES(8,165);
INSERT INTO "role_permissions" VALUES(8,166);
INSERT INTO "role_permissions" VALUES(8,167);
INSERT INTO "role_permissions" VALUES(8,168);
INSERT INTO "role_permissions" VALUES(8,169);
INSERT INTO "role_permissions" VALUES(8,170);
INSERT INTO "role_permissions" VALUES(8,171);
INSERT INTO "role_permissions" VALUES(8,172);
INSERT INTO "role_permissions" VALUES(8,173);
INSERT INTO "role_permissions" VALUES(8,174);
INSERT INTO "role_permissions" VALUES(8,175);
INSERT INTO "role_permissions" VALUES(8,176);
INSERT INTO "role_permissions" VALUES(8,177);
INSERT INTO "role_permissions" VALUES(8,178);
INSERT INTO "role_permissions" VALUES(8,179);
INSERT INTO "role_permissions" VALUES(8,180);
INSERT INTO "role_permissions" VALUES(8,181);
INSERT INTO "role_permissions" VALUES(8,182);
INSERT INTO "role_permissions" VALUES(8,183);
INSERT INTO "role_permissions" VALUES(8,184);
INSERT INTO "role_permissions" VALUES(8,185);
INSERT INTO "role_permissions" VALUES(8,186);
INSERT INTO "role_permissions" VALUES(8,187);
INSERT INTO "role_permissions" VALUES(8,188);
INSERT INTO "role_permissions" VALUES(8,189);
INSERT INTO "role_permissions" VALUES(8,190);
INSERT INTO "role_permissions" VALUES(8,191);
INSERT INTO "role_permissions" VALUES(8,192);
INSERT INTO "role_permissions" VALUES(8,193);
INSERT INTO "role_permissions" VALUES(8,194);
INSERT INTO "role_permissions" VALUES(8,195);
INSERT INTO "role_permissions" VALUES(8,196);
INSERT INTO "role_permissions" VALUES(8,197);
INSERT INTO "role_permissions" VALUES(8,198);
INSERT INTO "role_permissions" VALUES(8,199);
INSERT INTO "role_permissions" VALUES(8,200);
INSERT INTO "role_permissions" VALUES(8,201);
INSERT INTO "role_permissions" VALUES(8,202);
INSERT INTO "role_permissions" VALUES(8,203);
INSERT INTO "role_permissions" VALUES(8,204);
INSERT INTO "role_permissions" VALUES(8,205);
INSERT INTO "role_permissions" VALUES(8,206);
INSERT INTO "role_permissions" VALUES(8,207);
INSERT INTO "role_permissions" VALUES(8,208);
INSERT INTO "role_permissions" VALUES(8,209);
INSERT INTO "role_permissions" VALUES(8,210);
INSERT INTO "role_permissions" VALUES(8,211);
INSERT INTO "role_permissions" VALUES(8,212);
INSERT INTO "role_permissions" VALUES(8,213);
INSERT INTO "role_permissions" VALUES(8,214);
INSERT INTO "role_permissions" VALUES(8,215);
INSERT INTO "role_permissions" VALUES(8,216);
INSERT INTO "role_permissions" VALUES(8,217);
INSERT INTO "role_permissions" VALUES(8,218);
INSERT INTO "role_permissions" VALUES(8,219);
INSERT INTO "role_permissions" VALUES(8,220);
INSERT INTO "role_permissions" VALUES(8,221);
INSERT INTO "role_permissions" VALUES(8,222);
INSERT INTO "role_permissions" VALUES(8,223);
INSERT INTO "role_permissions" VALUES(8,224);
INSERT INTO "role_permissions" VALUES(8,225);
INSERT INTO "role_permissions" VALUES(8,226);
INSERT INTO "role_permissions" VALUES(8,227);
INSERT INTO "role_permissions" VALUES(8,228);
INSERT INTO "role_permissions" VALUES(8,229);
INSERT INTO "role_permissions" VALUES(8,230);
INSERT INTO "role_permissions" VALUES(8,231);
INSERT INTO "role_permissions" VALUES(8,232);
INSERT INTO "role_permissions" VALUES(8,233);
INSERT INTO "role_permissions" VALUES(8,234);
INSERT INTO "role_permissions" VALUES(8,235);
INSERT INTO "role_permissions" VALUES(8,236);
INSERT INTO "role_permissions" VALUES(8,237);
INSERT INTO "role_permissions" VALUES(8,238);
INSERT INTO "role_permissions" VALUES(8,239);
INSERT INTO "role_permissions" VALUES(8,240);
INSERT INTO "role_permissions" VALUES(8,241);
INSERT INTO "role_permissions" VALUES(8,242);
INSERT INTO "role_permissions" VALUES(8,243);
INSERT INTO "role_permissions" VALUES(8,244);
INSERT INTO "role_permissions" VALUES(8,245);
INSERT INTO "role_permissions" VALUES(8,246);
INSERT INTO "role_permissions" VALUES(8,247);
INSERT INTO "role_permissions" VALUES(8,248);
INSERT INTO "role_permissions" VALUES(8,249);
INSERT INTO "role_permissions" VALUES(8,250);
INSERT INTO "role_permissions" VALUES(8,251);
INSERT INTO "role_permissions" VALUES(8,252);
INSERT INTO "role_permissions" VALUES(8,253);
INSERT INTO "role_permissions" VALUES(8,254);
INSERT INTO "role_permissions" VALUES(8,255);
INSERT INTO "role_permissions" VALUES(8,256);
INSERT INTO "role_permissions" VALUES(8,257);
INSERT INTO "role_permissions" VALUES(8,258);
INSERT INTO "role_permissions" VALUES(8,259);
INSERT INTO "role_permissions" VALUES(8,260);
INSERT INTO "role_permissions" VALUES(8,261);
INSERT INTO "role_permissions" VALUES(8,262);
INSERT INTO "role_permissions" VALUES(8,263);
INSERT INTO "role_permissions" VALUES(8,264);
INSERT INTO "role_permissions" VALUES(8,265);
INSERT INTO "role_permissions" VALUES(8,266);
INSERT INTO "role_permissions" VALUES(8,267);
INSERT INTO "role_permissions" VALUES(8,268);
INSERT INTO "role_permissions" VALUES(8,269);
INSERT INTO "role_permissions" VALUES(8,270);
INSERT INTO "role_permissions" VALUES(8,271);
INSERT INTO "role_permissions" VALUES(8,272);
INSERT INTO "role_permissions" VALUES(8,273);
INSERT INTO "role_permissions" VALUES(8,274);
INSERT INTO "role_permissions" VALUES(8,275);
INSERT INTO "role_permissions" VALUES(8,276);
INSERT INTO "role_permissions" VALUES(8,277);
INSERT INTO "role_permissions" VALUES(8,278);
INSERT INTO "role_permissions" VALUES(8,279);
INSERT INTO "role_permissions" VALUES(8,280);
INSERT INTO "role_permissions" VALUES(8,281);
INSERT INTO "role_permissions" VALUES(8,282);
INSERT INTO "role_permissions" VALUES(8,283);
INSERT INTO "role_permissions" VALUES(8,284);
INSERT INTO "role_permissions" VALUES(8,285);
INSERT INTO "role_permissions" VALUES(8,286);
INSERT INTO "role_permissions" VALUES(8,287);
INSERT INTO "role_permissions" VALUES(8,288);
INSERT INTO "role_permissions" VALUES(8,289);
INSERT INTO "role_permissions" VALUES(8,290);
INSERT INTO "role_permissions" VALUES(8,291);
INSERT INTO "role_permissions" VALUES(8,292);
INSERT INTO "role_permissions" VALUES(8,293);
INSERT INTO "role_permissions" VALUES(8,294);
INSERT INTO "role_permissions" VALUES(8,295);
INSERT INTO "role_permissions" VALUES(8,296);
INSERT INTO "role_permissions" VALUES(8,297);
INSERT INTO "role_permissions" VALUES(8,298);
INSERT INTO "role_permissions" VALUES(8,299);
INSERT INTO "role_permissions" VALUES(8,300);
INSERT INTO "role_permissions" VALUES(8,301);
INSERT INTO "role_permissions" VALUES(8,302);
INSERT INTO "role_permissions" VALUES(8,303);
INSERT INTO "role_permissions" VALUES(8,304);
INSERT INTO "role_permissions" VALUES(8,305);
INSERT INTO "role_permissions" VALUES(8,306);
INSERT INTO "role_permissions" VALUES(8,307);
INSERT INTO "role_permissions" VALUES(8,308);
INSERT INTO "role_permissions" VALUES(8,309);
INSERT INTO "role_permissions" VALUES(8,310);
INSERT INTO "role_permissions" VALUES(8,311);
INSERT INTO "role_permissions" VALUES(8,312);
INSERT INTO "role_permissions" VALUES(8,313);
INSERT INTO "role_permissions" VALUES(8,314);
INSERT INTO "role_permissions" VALUES(8,315);
INSERT INTO "role_permissions" VALUES(9,1);
INSERT INTO "role_permissions" VALUES(9,2);
INSERT INTO "role_permissions" VALUES(9,3);
INSERT INTO "role_permissions" VALUES(9,4);
INSERT INTO "role_permissions" VALUES(9,5);
INSERT INTO "role_permissions" VALUES(9,6);
INSERT INTO "role_permissions" VALUES(9,7);
INSERT INTO "role_permissions" VALUES(9,8);
INSERT INTO "role_permissions" VALUES(9,9);
INSERT INTO "role_permissions" VALUES(9,10);
INSERT INTO "role_permissions" VALUES(9,11);
INSERT INTO "role_permissions" VALUES(9,12);
INSERT INTO "role_permissions" VALUES(9,13);
INSERT INTO "role_permissions" VALUES(9,14);
INSERT INTO "role_permissions" VALUES(9,15);
INSERT INTO "role_permissions" VALUES(9,16);
INSERT INTO "role_permissions" VALUES(9,17);
INSERT INTO "role_permissions" VALUES(9,18);
INSERT INTO "role_permissions" VALUES(9,19);
INSERT INTO "role_permissions" VALUES(9,20);
INSERT INTO "role_permissions" VALUES(9,21);
INSERT INTO "role_permissions" VALUES(9,22);
INSERT INTO "role_permissions" VALUES(9,23);
INSERT INTO "role_permissions" VALUES(9,24);
INSERT INTO "role_permissions" VALUES(9,25);
INSERT INTO "role_permissions" VALUES(9,26);
INSERT INTO "role_permissions" VALUES(9,27);
INSERT INTO "role_permissions" VALUES(9,28);
INSERT INTO "role_permissions" VALUES(9,29);
INSERT INTO "role_permissions" VALUES(9,30);
INSERT INTO "role_permissions" VALUES(9,31);
INSERT INTO "role_permissions" VALUES(9,32);
INSERT INTO "role_permissions" VALUES(9,33);
INSERT INTO "role_permissions" VALUES(9,34);
INSERT INTO "role_permissions" VALUES(9,35);
INSERT INTO "role_permissions" VALUES(9,36);
INSERT INTO "role_permissions" VALUES(9,37);
INSERT INTO "role_permissions" VALUES(9,38);
INSERT INTO "role_permissions" VALUES(9,39);
INSERT INTO "role_permissions" VALUES(9,40);
INSERT INTO "role_permissions" VALUES(9,41);
INSERT INTO "role_permissions" VALUES(9,42);
INSERT INTO "role_permissions" VALUES(9,43);
INSERT INTO "role_permissions" VALUES(9,44);
INSERT INTO "role_permissions" VALUES(9,45);
INSERT INTO "role_permissions" VALUES(9,46);
INSERT INTO "role_permissions" VALUES(9,47);
INSERT INTO "role_permissions" VALUES(9,48);
INSERT INTO "role_permissions" VALUES(9,49);
INSERT INTO "role_permissions" VALUES(9,50);
INSERT INTO "role_permissions" VALUES(9,51);
INSERT INTO "role_permissions" VALUES(9,52);
INSERT INTO "role_permissions" VALUES(9,53);
INSERT INTO "role_permissions" VALUES(9,54);
INSERT INTO "role_permissions" VALUES(9,55);
INSERT INTO "role_permissions" VALUES(9,56);
INSERT INTO "role_permissions" VALUES(9,57);
INSERT INTO "role_permissions" VALUES(9,58);
INSERT INTO "role_permissions" VALUES(9,59);
INSERT INTO "role_permissions" VALUES(9,60);
INSERT INTO "role_permissions" VALUES(9,61);
INSERT INTO "role_permissions" VALUES(9,62);
INSERT INTO "role_permissions" VALUES(9,63);
INSERT INTO "role_permissions" VALUES(9,64);
INSERT INTO "role_permissions" VALUES(9,65);
INSERT INTO "role_permissions" VALUES(9,66);
INSERT INTO "role_permissions" VALUES(9,67);
INSERT INTO "role_permissions" VALUES(9,68);
INSERT INTO "role_permissions" VALUES(9,69);
INSERT INTO "role_permissions" VALUES(9,70);
INSERT INTO "role_permissions" VALUES(9,71);
INSERT INTO "role_permissions" VALUES(9,72);
INSERT INTO "role_permissions" VALUES(9,73);
INSERT INTO "role_permissions" VALUES(9,74);
INSERT INTO "role_permissions" VALUES(9,75);
INSERT INTO "role_permissions" VALUES(9,76);
INSERT INTO "role_permissions" VALUES(9,77);
INSERT INTO "role_permissions" VALUES(9,78);
INSERT INTO "role_permissions" VALUES(9,79);
INSERT INTO "role_permissions" VALUES(9,80);
INSERT INTO "role_permissions" VALUES(9,81);
INSERT INTO "role_permissions" VALUES(9,82);
INSERT INTO "role_permissions" VALUES(9,83);
INSERT INTO "role_permissions" VALUES(9,84);
INSERT INTO "role_permissions" VALUES(9,85);
INSERT INTO "role_permissions" VALUES(9,86);
INSERT INTO "role_permissions" VALUES(9,87);
INSERT INTO "role_permissions" VALUES(9,88);
INSERT INTO "role_permissions" VALUES(9,89);
INSERT INTO "role_permissions" VALUES(9,90);
INSERT INTO "role_permissions" VALUES(9,91);
INSERT INTO "role_permissions" VALUES(9,92);
INSERT INTO "role_permissions" VALUES(9,93);
INSERT INTO "role_permissions" VALUES(9,94);
INSERT INTO "role_permissions" VALUES(9,95);
INSERT INTO "role_permissions" VALUES(9,96);
INSERT INTO "role_permissions" VALUES(9,97);
INSERT INTO "role_permissions" VALUES(9,98);
INSERT INTO "role_permissions" VALUES(9,99);
INSERT INTO "role_permissions" VALUES(9,100);
INSERT INTO "role_permissions" VALUES(9,101);
INSERT INTO "role_permissions" VALUES(9,102);
INSERT INTO "role_permissions" VALUES(9,103);
INSERT INTO "role_permissions" VALUES(9,104);
INSERT INTO "role_permissions" VALUES(9,105);
INSERT INTO "role_permissions" VALUES(9,106);
INSERT INTO "role_permissions" VALUES(9,107);
INSERT INTO "role_permissions" VALUES(9,108);
INSERT INTO "role_permissions" VALUES(9,109);
INSERT INTO "role_permissions" VALUES(9,110);
INSERT INTO "role_permissions" VALUES(9,111);
INSERT INTO "role_permissions" VALUES(9,112);
INSERT INTO "role_permissions" VALUES(9,113);
INSERT INTO "role_permissions" VALUES(9,114);
INSERT INTO "role_permissions" VALUES(9,115);
INSERT INTO "role_permissions" VALUES(9,116);
INSERT INTO "role_permissions" VALUES(9,117);
INSERT INTO "role_permissions" VALUES(9,118);
INSERT INTO "role_permissions" VALUES(9,119);
INSERT INTO "role_permissions" VALUES(9,120);
INSERT INTO "role_permissions" VALUES(9,121);
INSERT INTO "role_permissions" VALUES(9,122);
INSERT INTO "role_permissions" VALUES(9,123);
INSERT INTO "role_permissions" VALUES(9,124);
INSERT INTO "role_permissions" VALUES(9,125);
INSERT INTO "role_permissions" VALUES(9,126);
INSERT INTO "role_permissions" VALUES(9,127);
INSERT INTO "role_permissions" VALUES(9,128);
INSERT INTO "role_permissions" VALUES(9,129);
INSERT INTO "role_permissions" VALUES(9,130);
INSERT INTO "role_permissions" VALUES(9,131);
INSERT INTO "role_permissions" VALUES(9,132);
INSERT INTO "role_permissions" VALUES(9,133);
INSERT INTO "role_permissions" VALUES(9,134);
INSERT INTO "role_permissions" VALUES(9,135);
INSERT INTO "role_permissions" VALUES(9,136);
INSERT INTO "role_permissions" VALUES(9,137);
INSERT INTO "role_permissions" VALUES(9,138);
INSERT INTO "role_permissions" VALUES(9,139);
INSERT INTO "role_permissions" VALUES(9,140);
INSERT INTO "role_permissions" VALUES(9,141);
INSERT INTO "role_permissions" VALUES(9,142);
INSERT INTO "role_permissions" VALUES(9,143);
INSERT INTO "role_permissions" VALUES(9,144);
INSERT INTO "role_permissions" VALUES(9,145);
INSERT INTO "role_permissions" VALUES(9,146);
INSERT INTO "role_permissions" VALUES(9,147);
INSERT INTO "role_permissions" VALUES(9,148);
INSERT INTO "role_permissions" VALUES(9,149);
INSERT INTO "role_permissions" VALUES(9,150);
INSERT INTO "role_permissions" VALUES(9,151);
INSERT INTO "role_permissions" VALUES(9,152);
INSERT INTO "role_permissions" VALUES(9,153);
INSERT INTO "role_permissions" VALUES(9,154);
INSERT INTO "role_permissions" VALUES(9,155);
INSERT INTO "role_permissions" VALUES(9,156);
INSERT INTO "role_permissions" VALUES(9,157);
INSERT INTO "role_permissions" VALUES(9,158);
INSERT INTO "role_permissions" VALUES(9,159);
INSERT INTO "role_permissions" VALUES(9,160);
INSERT INTO "role_permissions" VALUES(9,161);
INSERT INTO "role_permissions" VALUES(9,162);
INSERT INTO "role_permissions" VALUES(9,163);
INSERT INTO "role_permissions" VALUES(9,164);
INSERT INTO "role_permissions" VALUES(9,165);
INSERT INTO "role_permissions" VALUES(9,166);
INSERT INTO "role_permissions" VALUES(9,167);
INSERT INTO "role_permissions" VALUES(9,168);
INSERT INTO "role_permissions" VALUES(9,169);
INSERT INTO "role_permissions" VALUES(9,170);
INSERT INTO "role_permissions" VALUES(9,171);
INSERT INTO "role_permissions" VALUES(9,172);
INSERT INTO "role_permissions" VALUES(9,173);
INSERT INTO "role_permissions" VALUES(9,174);
INSERT INTO "role_permissions" VALUES(9,175);
INSERT INTO "role_permissions" VALUES(9,176);
INSERT INTO "role_permissions" VALUES(9,177);
INSERT INTO "role_permissions" VALUES(9,178);
INSERT INTO "role_permissions" VALUES(9,179);
INSERT INTO "role_permissions" VALUES(9,180);
INSERT INTO "role_permissions" VALUES(9,181);
INSERT INTO "role_permissions" VALUES(9,182);
INSERT INTO "role_permissions" VALUES(9,183);
INSERT INTO "role_permissions" VALUES(9,184);
INSERT INTO "role_permissions" VALUES(9,185);
INSERT INTO "role_permissions" VALUES(9,186);
INSERT INTO "role_permissions" VALUES(9,187);
INSERT INTO "role_permissions" VALUES(9,188);
INSERT INTO "role_permissions" VALUES(9,189);
INSERT INTO "role_permissions" VALUES(9,190);
INSERT INTO "role_permissions" VALUES(9,191);
INSERT INTO "role_permissions" VALUES(9,192);
INSERT INTO "role_permissions" VALUES(9,193);
INSERT INTO "role_permissions" VALUES(9,194);
INSERT INTO "role_permissions" VALUES(9,195);
INSERT INTO "role_permissions" VALUES(9,196);
INSERT INTO "role_permissions" VALUES(9,197);
INSERT INTO "role_permissions" VALUES(9,198);
INSERT INTO "role_permissions" VALUES(9,199);
INSERT INTO "role_permissions" VALUES(9,200);
INSERT INTO "role_permissions" VALUES(9,201);
INSERT INTO "role_permissions" VALUES(9,202);
INSERT INTO "role_permissions" VALUES(9,203);
INSERT INTO "role_permissions" VALUES(9,204);
INSERT INTO "role_permissions" VALUES(9,205);
INSERT INTO "role_permissions" VALUES(9,206);
INSERT INTO "role_permissions" VALUES(9,207);
INSERT INTO "role_permissions" VALUES(9,208);
INSERT INTO "role_permissions" VALUES(9,209);
INSERT INTO "role_permissions" VALUES(9,210);
INSERT INTO "role_permissions" VALUES(9,211);
INSERT INTO "role_permissions" VALUES(9,212);
INSERT INTO "role_permissions" VALUES(9,213);
INSERT INTO "role_permissions" VALUES(9,214);
INSERT INTO "role_permissions" VALUES(9,215);
INSERT INTO "role_permissions" VALUES(9,216);
INSERT INTO "role_permissions" VALUES(9,217);
INSERT INTO "role_permissions" VALUES(9,218);
INSERT INTO "role_permissions" VALUES(9,219);
INSERT INTO "role_permissions" VALUES(9,220);
INSERT INTO "role_permissions" VALUES(9,221);
INSERT INTO "role_permissions" VALUES(9,222);
INSERT INTO "role_permissions" VALUES(9,223);
INSERT INTO "role_permissions" VALUES(9,224);
INSERT INTO "role_permissions" VALUES(9,225);
INSERT INTO "role_permissions" VALUES(9,226);
INSERT INTO "role_permissions" VALUES(9,227);
INSERT INTO "role_permissions" VALUES(9,228);
INSERT INTO "role_permissions" VALUES(9,229);
INSERT INTO "role_permissions" VALUES(9,230);
INSERT INTO "role_permissions" VALUES(9,231);
INSERT INTO "role_permissions" VALUES(9,232);
INSERT INTO "role_permissions" VALUES(9,233);
INSERT INTO "role_permissions" VALUES(9,234);
INSERT INTO "role_permissions" VALUES(9,235);
INSERT INTO "role_permissions" VALUES(9,236);
INSERT INTO "role_permissions" VALUES(9,237);
INSERT INTO "role_permissions" VALUES(9,238);
INSERT INTO "role_permissions" VALUES(9,239);
INSERT INTO "role_permissions" VALUES(9,240);
INSERT INTO "role_permissions" VALUES(9,241);
INSERT INTO "role_permissions" VALUES(9,242);
INSERT INTO "role_permissions" VALUES(9,243);
INSERT INTO "role_permissions" VALUES(9,244);
INSERT INTO "role_permissions" VALUES(9,245);
INSERT INTO "role_permissions" VALUES(9,246);
INSERT INTO "role_permissions" VALUES(9,247);
INSERT INTO "role_permissions" VALUES(9,248);
INSERT INTO "role_permissions" VALUES(9,249);
INSERT INTO "role_permissions" VALUES(9,250);
INSERT INTO "role_permissions" VALUES(9,251);
INSERT INTO "role_permissions" VALUES(9,252);
INSERT INTO "role_permissions" VALUES(9,253);
INSERT INTO "role_permissions" VALUES(9,254);
INSERT INTO "role_permissions" VALUES(9,255);
INSERT INTO "role_permissions" VALUES(9,256);
INSERT INTO "role_permissions" VALUES(9,257);
INSERT INTO "role_permissions" VALUES(9,258);
INSERT INTO "role_permissions" VALUES(9,259);
INSERT INTO "role_permissions" VALUES(9,260);
INSERT INTO "role_permissions" VALUES(9,261);
INSERT INTO "role_permissions" VALUES(9,262);
INSERT INTO "role_permissions" VALUES(9,263);
INSERT INTO "role_permissions" VALUES(9,264);
INSERT INTO "role_permissions" VALUES(9,265);
INSERT INTO "role_permissions" VALUES(9,266);
INSERT INTO "role_permissions" VALUES(9,267);
INSERT INTO "role_permissions" VALUES(9,268);
INSERT INTO "role_permissions" VALUES(9,269);
INSERT INTO "role_permissions" VALUES(9,270);
INSERT INTO "role_permissions" VALUES(9,271);
INSERT INTO "role_permissions" VALUES(9,272);
INSERT INTO "role_permissions" VALUES(9,273);
INSERT INTO "role_permissions" VALUES(9,274);
INSERT INTO "role_permissions" VALUES(9,275);
INSERT INTO "role_permissions" VALUES(9,276);
INSERT INTO "role_permissions" VALUES(9,277);
INSERT INTO "role_permissions" VALUES(9,278);
INSERT INTO "role_permissions" VALUES(9,279);
INSERT INTO "role_permissions" VALUES(9,280);
INSERT INTO "role_permissions" VALUES(9,281);
INSERT INTO "role_permissions" VALUES(9,282);
INSERT INTO "role_permissions" VALUES(9,283);
INSERT INTO "role_permissions" VALUES(9,284);
INSERT INTO "role_permissions" VALUES(9,285);
INSERT INTO "role_permissions" VALUES(9,286);
INSERT INTO "role_permissions" VALUES(9,287);
INSERT INTO "role_permissions" VALUES(9,288);
INSERT INTO "role_permissions" VALUES(9,289);
INSERT INTO "role_permissions" VALUES(9,290);
INSERT INTO "role_permissions" VALUES(9,291);
INSERT INTO "role_permissions" VALUES(9,292);
INSERT INTO "role_permissions" VALUES(9,293);
INSERT INTO "role_permissions" VALUES(9,294);
INSERT INTO "role_permissions" VALUES(9,295);
INSERT INTO "role_permissions" VALUES(9,296);
INSERT INTO "role_permissions" VALUES(9,297);
INSERT INTO "role_permissions" VALUES(9,298);
INSERT INTO "role_permissions" VALUES(9,299);
INSERT INTO "role_permissions" VALUES(9,300);
INSERT INTO "role_permissions" VALUES(9,301);
INSERT INTO "role_permissions" VALUES(9,302);
INSERT INTO "role_permissions" VALUES(9,303);
INSERT INTO "role_permissions" VALUES(9,304);
INSERT INTO "role_permissions" VALUES(9,305);
INSERT INTO "role_permissions" VALUES(9,306);
INSERT INTO "role_permissions" VALUES(9,307);
INSERT INTO "role_permissions" VALUES(9,308);
INSERT INTO "role_permissions" VALUES(9,309);
INSERT INTO "role_permissions" VALUES(9,310);
INSERT INTO "role_permissions" VALUES(9,311);
INSERT INTO "role_permissions" VALUES(9,312);
INSERT INTO "role_permissions" VALUES(9,313);
INSERT INTO "role_permissions" VALUES(9,314);
INSERT INTO "role_permissions" VALUES(9,315);
INSERT INTO "role_permissions" VALUES(15,1);
INSERT INTO "role_permissions" VALUES(15,2);
INSERT INTO "role_permissions" VALUES(15,3);
INSERT INTO "role_permissions" VALUES(15,4);
INSERT INTO "role_permissions" VALUES(15,5);
INSERT INTO "role_permissions" VALUES(15,6);
INSERT INTO "role_permissions" VALUES(15,7);
INSERT INTO "role_permissions" VALUES(15,8);
INSERT INTO "role_permissions" VALUES(15,9);
INSERT INTO "role_permissions" VALUES(15,10);
INSERT INTO "role_permissions" VALUES(15,11);
INSERT INTO "role_permissions" VALUES(15,12);
INSERT INTO "role_permissions" VALUES(15,13);
INSERT INTO "role_permissions" VALUES(15,14);
INSERT INTO "role_permissions" VALUES(15,15);
INSERT INTO "role_permissions" VALUES(15,16);
INSERT INTO "role_permissions" VALUES(15,17);
INSERT INTO "role_permissions" VALUES(15,18);
INSERT INTO "role_permissions" VALUES(15,19);
INSERT INTO "role_permissions" VALUES(15,20);
INSERT INTO "role_permissions" VALUES(15,21);
INSERT INTO "role_permissions" VALUES(15,22);
INSERT INTO "role_permissions" VALUES(15,23);
INSERT INTO "role_permissions" VALUES(15,24);
INSERT INTO "role_permissions" VALUES(15,25);
INSERT INTO "role_permissions" VALUES(15,26);
INSERT INTO "role_permissions" VALUES(15,27);
INSERT INTO "role_permissions" VALUES(15,28);
INSERT INTO "role_permissions" VALUES(15,29);
INSERT INTO "role_permissions" VALUES(15,30);
INSERT INTO "role_permissions" VALUES(15,31);
INSERT INTO "role_permissions" VALUES(15,32);
INSERT INTO "role_permissions" VALUES(15,33);
INSERT INTO "role_permissions" VALUES(15,34);
INSERT INTO "role_permissions" VALUES(15,35);
INSERT INTO "role_permissions" VALUES(15,36);
INSERT INTO "role_permissions" VALUES(15,37);
INSERT INTO "role_permissions" VALUES(15,38);
INSERT INTO "role_permissions" VALUES(15,39);
INSERT INTO "role_permissions" VALUES(15,40);
INSERT INTO "role_permissions" VALUES(15,41);
INSERT INTO "role_permissions" VALUES(15,42);
INSERT INTO "role_permissions" VALUES(15,43);
INSERT INTO "role_permissions" VALUES(15,44);
INSERT INTO "role_permissions" VALUES(15,45);
INSERT INTO "role_permissions" VALUES(15,46);
INSERT INTO "role_permissions" VALUES(15,47);
INSERT INTO "role_permissions" VALUES(15,48);
INSERT INTO "role_permissions" VALUES(15,49);
INSERT INTO "role_permissions" VALUES(15,50);
INSERT INTO "role_permissions" VALUES(15,51);
INSERT INTO "role_permissions" VALUES(15,52);
INSERT INTO "role_permissions" VALUES(15,53);
INSERT INTO "role_permissions" VALUES(15,54);
INSERT INTO "role_permissions" VALUES(15,55);
INSERT INTO "role_permissions" VALUES(15,56);
INSERT INTO "role_permissions" VALUES(15,57);
INSERT INTO "role_permissions" VALUES(15,58);
INSERT INTO "role_permissions" VALUES(15,59);
INSERT INTO "role_permissions" VALUES(15,60);
INSERT INTO "role_permissions" VALUES(15,61);
INSERT INTO "role_permissions" VALUES(15,62);
INSERT INTO "role_permissions" VALUES(15,63);
INSERT INTO "role_permissions" VALUES(15,64);
INSERT INTO "role_permissions" VALUES(15,65);
INSERT INTO "role_permissions" VALUES(15,66);
INSERT INTO "role_permissions" VALUES(15,67);
INSERT INTO "role_permissions" VALUES(15,68);
INSERT INTO "role_permissions" VALUES(15,69);
INSERT INTO "role_permissions" VALUES(15,70);
INSERT INTO "role_permissions" VALUES(15,71);
INSERT INTO "role_permissions" VALUES(15,72);
INSERT INTO "role_permissions" VALUES(15,73);
INSERT INTO "role_permissions" VALUES(15,74);
INSERT INTO "role_permissions" VALUES(15,75);
INSERT INTO "role_permissions" VALUES(15,76);
INSERT INTO "role_permissions" VALUES(15,77);
INSERT INTO "role_permissions" VALUES(15,78);
INSERT INTO "role_permissions" VALUES(15,79);
INSERT INTO "role_permissions" VALUES(15,80);
INSERT INTO "role_permissions" VALUES(15,81);
INSERT INTO "role_permissions" VALUES(15,82);
INSERT INTO "role_permissions" VALUES(15,83);
INSERT INTO "role_permissions" VALUES(15,84);
INSERT INTO "role_permissions" VALUES(15,85);
INSERT INTO "role_permissions" VALUES(15,86);
INSERT INTO "role_permissions" VALUES(15,87);
INSERT INTO "role_permissions" VALUES(15,88);
INSERT INTO "role_permissions" VALUES(15,89);
INSERT INTO "role_permissions" VALUES(15,90);
INSERT INTO "role_permissions" VALUES(15,91);
INSERT INTO "role_permissions" VALUES(15,92);
INSERT INTO "role_permissions" VALUES(15,93);
INSERT INTO "role_permissions" VALUES(15,94);
INSERT INTO "role_permissions" VALUES(15,95);
INSERT INTO "role_permissions" VALUES(15,96);
INSERT INTO "role_permissions" VALUES(15,97);
INSERT INTO "role_permissions" VALUES(15,98);
INSERT INTO "role_permissions" VALUES(15,99);
INSERT INTO "role_permissions" VALUES(15,100);
INSERT INTO "role_permissions" VALUES(15,101);
INSERT INTO "role_permissions" VALUES(15,102);
INSERT INTO "role_permissions" VALUES(15,103);
INSERT INTO "role_permissions" VALUES(15,104);
INSERT INTO "role_permissions" VALUES(15,105);
INSERT INTO "role_permissions" VALUES(15,106);
INSERT INTO "role_permissions" VALUES(15,107);
INSERT INTO "role_permissions" VALUES(15,108);
INSERT INTO "role_permissions" VALUES(15,109);
INSERT INTO "role_permissions" VALUES(15,110);
INSERT INTO "role_permissions" VALUES(15,111);
INSERT INTO "role_permissions" VALUES(15,112);
INSERT INTO "role_permissions" VALUES(15,113);
INSERT INTO "role_permissions" VALUES(15,114);
INSERT INTO "role_permissions" VALUES(15,115);
INSERT INTO "role_permissions" VALUES(15,116);
INSERT INTO "role_permissions" VALUES(15,117);
INSERT INTO "role_permissions" VALUES(15,118);
INSERT INTO "role_permissions" VALUES(15,119);
INSERT INTO "role_permissions" VALUES(15,120);
INSERT INTO "role_permissions" VALUES(15,121);
INSERT INTO "role_permissions" VALUES(15,122);
INSERT INTO "role_permissions" VALUES(15,123);
INSERT INTO "role_permissions" VALUES(15,124);
INSERT INTO "role_permissions" VALUES(15,125);
INSERT INTO "role_permissions" VALUES(15,126);
INSERT INTO "role_permissions" VALUES(15,127);
INSERT INTO "role_permissions" VALUES(15,128);
INSERT INTO "role_permissions" VALUES(15,129);
INSERT INTO "role_permissions" VALUES(15,130);
INSERT INTO "role_permissions" VALUES(15,131);
INSERT INTO "role_permissions" VALUES(15,132);
INSERT INTO "role_permissions" VALUES(15,133);
INSERT INTO "role_permissions" VALUES(15,134);
INSERT INTO "role_permissions" VALUES(15,135);
INSERT INTO "role_permissions" VALUES(15,136);
INSERT INTO "role_permissions" VALUES(15,137);
INSERT INTO "role_permissions" VALUES(15,138);
INSERT INTO "role_permissions" VALUES(15,139);
INSERT INTO "role_permissions" VALUES(15,140);
INSERT INTO "role_permissions" VALUES(15,141);
INSERT INTO "role_permissions" VALUES(15,142);
INSERT INTO "role_permissions" VALUES(15,143);
INSERT INTO "role_permissions" VALUES(15,144);
INSERT INTO "role_permissions" VALUES(15,145);
INSERT INTO "role_permissions" VALUES(15,146);
INSERT INTO "role_permissions" VALUES(15,147);
INSERT INTO "role_permissions" VALUES(15,148);
INSERT INTO "role_permissions" VALUES(15,149);
INSERT INTO "role_permissions" VALUES(15,150);
INSERT INTO "role_permissions" VALUES(15,151);
INSERT INTO "role_permissions" VALUES(15,152);
INSERT INTO "role_permissions" VALUES(15,153);
INSERT INTO "role_permissions" VALUES(15,154);
INSERT INTO "role_permissions" VALUES(15,155);
INSERT INTO "role_permissions" VALUES(15,156);
INSERT INTO "role_permissions" VALUES(15,157);
INSERT INTO "role_permissions" VALUES(15,158);
INSERT INTO "role_permissions" VALUES(15,159);
INSERT INTO "role_permissions" VALUES(15,160);
INSERT INTO "role_permissions" VALUES(15,161);
INSERT INTO "role_permissions" VALUES(15,162);
INSERT INTO "role_permissions" VALUES(15,163);
INSERT INTO "role_permissions" VALUES(15,164);
INSERT INTO "role_permissions" VALUES(15,165);
INSERT INTO "role_permissions" VALUES(15,166);
INSERT INTO "role_permissions" VALUES(15,167);
INSERT INTO "role_permissions" VALUES(15,168);
INSERT INTO "role_permissions" VALUES(15,169);
INSERT INTO "role_permissions" VALUES(15,170);
INSERT INTO "role_permissions" VALUES(15,171);
INSERT INTO "role_permissions" VALUES(15,172);
INSERT INTO "role_permissions" VALUES(15,173);
INSERT INTO "role_permissions" VALUES(15,174);
INSERT INTO "role_permissions" VALUES(15,175);
INSERT INTO "role_permissions" VALUES(15,176);
INSERT INTO "role_permissions" VALUES(15,177);
INSERT INTO "role_permissions" VALUES(15,178);
INSERT INTO "role_permissions" VALUES(15,179);
INSERT INTO "role_permissions" VALUES(15,180);
INSERT INTO "role_permissions" VALUES(15,181);
INSERT INTO "role_permissions" VALUES(15,182);
INSERT INTO "role_permissions" VALUES(15,183);
INSERT INTO "role_permissions" VALUES(15,184);
INSERT INTO "role_permissions" VALUES(15,185);
INSERT INTO "role_permissions" VALUES(15,186);
INSERT INTO "role_permissions" VALUES(15,187);
INSERT INTO "role_permissions" VALUES(15,188);
INSERT INTO "role_permissions" VALUES(15,189);
INSERT INTO "role_permissions" VALUES(15,190);
INSERT INTO "role_permissions" VALUES(15,191);
INSERT INTO "role_permissions" VALUES(15,192);
INSERT INTO "role_permissions" VALUES(15,193);
INSERT INTO "role_permissions" VALUES(15,194);
INSERT INTO "role_permissions" VALUES(15,195);
INSERT INTO "role_permissions" VALUES(15,196);
INSERT INTO "role_permissions" VALUES(15,197);
INSERT INTO "role_permissions" VALUES(15,198);
INSERT INTO "role_permissions" VALUES(15,199);
INSERT INTO "role_permissions" VALUES(15,200);
INSERT INTO "role_permissions" VALUES(15,201);
INSERT INTO "role_permissions" VALUES(15,202);
INSERT INTO "role_permissions" VALUES(15,203);
INSERT INTO "role_permissions" VALUES(15,204);
INSERT INTO "role_permissions" VALUES(15,205);
INSERT INTO "role_permissions" VALUES(15,206);
INSERT INTO "role_permissions" VALUES(15,207);
INSERT INTO "role_permissions" VALUES(15,208);
INSERT INTO "role_permissions" VALUES(15,209);
INSERT INTO "role_permissions" VALUES(15,210);
INSERT INTO "role_permissions" VALUES(15,211);
INSERT INTO "role_permissions" VALUES(15,212);
INSERT INTO "role_permissions" VALUES(15,213);
INSERT INTO "role_permissions" VALUES(15,214);
INSERT INTO "role_permissions" VALUES(15,215);
INSERT INTO "role_permissions" VALUES(15,216);
INSERT INTO "role_permissions" VALUES(15,217);
INSERT INTO "role_permissions" VALUES(15,218);
INSERT INTO "role_permissions" VALUES(15,219);
INSERT INTO "role_permissions" VALUES(15,220);
INSERT INTO "role_permissions" VALUES(15,221);
INSERT INTO "role_permissions" VALUES(15,222);
INSERT INTO "role_permissions" VALUES(15,223);
INSERT INTO "role_permissions" VALUES(15,224);
INSERT INTO "role_permissions" VALUES(15,225);
INSERT INTO "role_permissions" VALUES(15,226);
INSERT INTO "role_permissions" VALUES(15,227);
INSERT INTO "role_permissions" VALUES(15,228);
INSERT INTO "role_permissions" VALUES(15,229);
INSERT INTO "role_permissions" VALUES(15,230);
INSERT INTO "role_permissions" VALUES(15,231);
INSERT INTO "role_permissions" VALUES(15,232);
INSERT INTO "role_permissions" VALUES(15,233);
INSERT INTO "role_permissions" VALUES(15,234);
INSERT INTO "role_permissions" VALUES(15,235);
INSERT INTO "role_permissions" VALUES(15,236);
INSERT INTO "role_permissions" VALUES(15,237);
INSERT INTO "role_permissions" VALUES(15,238);
INSERT INTO "role_permissions" VALUES(15,239);
INSERT INTO "role_permissions" VALUES(15,240);
INSERT INTO "role_permissions" VALUES(15,241);
INSERT INTO "role_permissions" VALUES(15,242);
INSERT INTO "role_permissions" VALUES(15,243);
INSERT INTO "role_permissions" VALUES(15,244);
INSERT INTO "role_permissions" VALUES(15,245);
INSERT INTO "role_permissions" VALUES(15,246);
INSERT INTO "role_permissions" VALUES(15,247);
INSERT INTO "role_permissions" VALUES(15,248);
INSERT INTO "role_permissions" VALUES(15,249);
INSERT INTO "role_permissions" VALUES(15,250);
INSERT INTO "role_permissions" VALUES(15,251);
INSERT INTO "role_permissions" VALUES(15,252);
INSERT INTO "role_permissions" VALUES(15,253);
INSERT INTO "role_permissions" VALUES(15,254);
INSERT INTO "role_permissions" VALUES(15,255);
INSERT INTO "role_permissions" VALUES(15,256);
INSERT INTO "role_permissions" VALUES(15,257);
INSERT INTO "role_permissions" VALUES(15,258);
INSERT INTO "role_permissions" VALUES(15,259);
INSERT INTO "role_permissions" VALUES(15,260);
INSERT INTO "role_permissions" VALUES(15,261);
INSERT INTO "role_permissions" VALUES(15,262);
INSERT INTO "role_permissions" VALUES(15,263);
INSERT INTO "role_permissions" VALUES(15,264);
INSERT INTO "role_permissions" VALUES(15,265);
INSERT INTO "role_permissions" VALUES(15,266);
INSERT INTO "role_permissions" VALUES(15,267);
INSERT INTO "role_permissions" VALUES(15,268);
INSERT INTO "role_permissions" VALUES(15,269);
INSERT INTO "role_permissions" VALUES(15,270);
INSERT INTO "role_permissions" VALUES(15,271);
INSERT INTO "role_permissions" VALUES(15,272);
INSERT INTO "role_permissions" VALUES(15,273);
INSERT INTO "role_permissions" VALUES(15,274);
INSERT INTO "role_permissions" VALUES(15,275);
INSERT INTO "role_permissions" VALUES(15,276);
INSERT INTO "role_permissions" VALUES(15,277);
INSERT INTO "role_permissions" VALUES(15,278);
INSERT INTO "role_permissions" VALUES(15,279);
INSERT INTO "role_permissions" VALUES(15,280);
INSERT INTO "role_permissions" VALUES(15,281);
INSERT INTO "role_permissions" VALUES(15,282);
INSERT INTO "role_permissions" VALUES(15,283);
INSERT INTO "role_permissions" VALUES(15,284);
INSERT INTO "role_permissions" VALUES(15,285);
INSERT INTO "role_permissions" VALUES(15,286);
INSERT INTO "role_permissions" VALUES(15,287);
INSERT INTO "role_permissions" VALUES(15,288);
INSERT INTO "role_permissions" VALUES(15,289);
INSERT INTO "role_permissions" VALUES(15,290);
INSERT INTO "role_permissions" VALUES(15,291);
INSERT INTO "role_permissions" VALUES(15,292);
INSERT INTO "role_permissions" VALUES(15,293);
INSERT INTO "role_permissions" VALUES(15,294);
INSERT INTO "role_permissions" VALUES(15,295);
INSERT INTO "role_permissions" VALUES(15,296);
INSERT INTO "role_permissions" VALUES(15,297);
INSERT INTO "role_permissions" VALUES(15,298);
INSERT INTO "role_permissions" VALUES(15,299);
INSERT INTO "role_permissions" VALUES(15,300);
INSERT INTO "role_permissions" VALUES(15,301);
INSERT INTO "role_permissions" VALUES(15,302);
INSERT INTO "role_permissions" VALUES(15,303);
INSERT INTO "role_permissions" VALUES(15,304);
INSERT INTO "role_permissions" VALUES(15,305);
INSERT INTO "role_permissions" VALUES(15,306);
INSERT INTO "role_permissions" VALUES(15,307);
INSERT INTO "role_permissions" VALUES(15,308);
INSERT INTO "role_permissions" VALUES(15,309);
INSERT INTO "role_permissions" VALUES(15,310);
INSERT INTO "role_permissions" VALUES(15,311);
INSERT INTO "role_permissions" VALUES(15,312);
INSERT INTO "role_permissions" VALUES(15,313);
INSERT INTO "role_permissions" VALUES(15,314);
INSERT INTO "role_permissions" VALUES(15,315);
INSERT INTO "role_permissions" VALUES(16,1);
INSERT INTO "role_permissions" VALUES(16,2);
INSERT INTO "role_permissions" VALUES(16,3);
INSERT INTO "role_permissions" VALUES(16,4);
INSERT INTO "role_permissions" VALUES(16,5);
INSERT INTO "role_permissions" VALUES(16,6);
INSERT INTO "role_permissions" VALUES(16,7);
INSERT INTO "role_permissions" VALUES(16,8);
INSERT INTO "role_permissions" VALUES(16,9);
INSERT INTO "role_permissions" VALUES(16,10);
INSERT INTO "role_permissions" VALUES(16,11);
INSERT INTO "role_permissions" VALUES(16,12);
INSERT INTO "role_permissions" VALUES(16,13);
INSERT INTO "role_permissions" VALUES(16,14);
INSERT INTO "role_permissions" VALUES(16,15);
INSERT INTO "role_permissions" VALUES(16,16);
INSERT INTO "role_permissions" VALUES(16,17);
INSERT INTO "role_permissions" VALUES(16,18);
INSERT INTO "role_permissions" VALUES(16,19);
INSERT INTO "role_permissions" VALUES(16,20);
INSERT INTO "role_permissions" VALUES(16,21);
INSERT INTO "role_permissions" VALUES(16,22);
INSERT INTO "role_permissions" VALUES(16,23);
INSERT INTO "role_permissions" VALUES(16,24);
INSERT INTO "role_permissions" VALUES(16,25);
INSERT INTO "role_permissions" VALUES(16,26);
INSERT INTO "role_permissions" VALUES(16,27);
INSERT INTO "role_permissions" VALUES(16,28);
INSERT INTO "role_permissions" VALUES(16,29);
INSERT INTO "role_permissions" VALUES(16,30);
INSERT INTO "role_permissions" VALUES(16,31);
INSERT INTO "role_permissions" VALUES(16,32);
INSERT INTO "role_permissions" VALUES(16,33);
INSERT INTO "role_permissions" VALUES(16,34);
INSERT INTO "role_permissions" VALUES(16,35);
INSERT INTO "role_permissions" VALUES(16,36);
INSERT INTO "role_permissions" VALUES(16,37);
INSERT INTO "role_permissions" VALUES(16,38);
INSERT INTO "role_permissions" VALUES(16,39);
INSERT INTO "role_permissions" VALUES(16,40);
INSERT INTO "role_permissions" VALUES(16,41);
INSERT INTO "role_permissions" VALUES(16,42);
INSERT INTO "role_permissions" VALUES(16,43);
INSERT INTO "role_permissions" VALUES(16,44);
INSERT INTO "role_permissions" VALUES(16,45);
INSERT INTO "role_permissions" VALUES(16,46);
INSERT INTO "role_permissions" VALUES(16,47);
INSERT INTO "role_permissions" VALUES(16,48);
INSERT INTO "role_permissions" VALUES(16,49);
INSERT INTO "role_permissions" VALUES(16,50);
INSERT INTO "role_permissions" VALUES(16,51);
INSERT INTO "role_permissions" VALUES(16,52);
INSERT INTO "role_permissions" VALUES(16,53);
INSERT INTO "role_permissions" VALUES(16,54);
INSERT INTO "role_permissions" VALUES(16,55);
INSERT INTO "role_permissions" VALUES(16,56);
INSERT INTO "role_permissions" VALUES(16,57);
INSERT INTO "role_permissions" VALUES(16,58);
INSERT INTO "role_permissions" VALUES(16,59);
INSERT INTO "role_permissions" VALUES(16,60);
INSERT INTO "role_permissions" VALUES(16,61);
INSERT INTO "role_permissions" VALUES(16,62);
INSERT INTO "role_permissions" VALUES(16,63);
INSERT INTO "role_permissions" VALUES(16,64);
INSERT INTO "role_permissions" VALUES(16,65);
INSERT INTO "role_permissions" VALUES(16,66);
INSERT INTO "role_permissions" VALUES(16,67);
INSERT INTO "role_permissions" VALUES(16,68);
INSERT INTO "role_permissions" VALUES(16,69);
INSERT INTO "role_permissions" VALUES(16,70);
INSERT INTO "role_permissions" VALUES(16,71);
INSERT INTO "role_permissions" VALUES(16,72);
INSERT INTO "role_permissions" VALUES(16,73);
INSERT INTO "role_permissions" VALUES(16,74);
INSERT INTO "role_permissions" VALUES(16,75);
INSERT INTO "role_permissions" VALUES(16,76);
INSERT INTO "role_permissions" VALUES(16,77);
INSERT INTO "role_permissions" VALUES(16,78);
INSERT INTO "role_permissions" VALUES(16,79);
INSERT INTO "role_permissions" VALUES(16,80);
INSERT INTO "role_permissions" VALUES(16,81);
INSERT INTO "role_permissions" VALUES(16,82);
INSERT INTO "role_permissions" VALUES(16,83);
INSERT INTO "role_permissions" VALUES(16,84);
INSERT INTO "role_permissions" VALUES(16,85);
INSERT INTO "role_permissions" VALUES(16,86);
INSERT INTO "role_permissions" VALUES(16,87);
INSERT INTO "role_permissions" VALUES(16,88);
INSERT INTO "role_permissions" VALUES(16,89);
INSERT INTO "role_permissions" VALUES(16,90);
INSERT INTO "role_permissions" VALUES(16,91);
INSERT INTO "role_permissions" VALUES(16,92);
INSERT INTO "role_permissions" VALUES(16,93);
INSERT INTO "role_permissions" VALUES(16,94);
INSERT INTO "role_permissions" VALUES(16,95);
INSERT INTO "role_permissions" VALUES(16,96);
INSERT INTO "role_permissions" VALUES(16,97);
INSERT INTO "role_permissions" VALUES(16,98);
INSERT INTO "role_permissions" VALUES(16,99);
INSERT INTO "role_permissions" VALUES(16,100);
INSERT INTO "role_permissions" VALUES(16,101);
INSERT INTO "role_permissions" VALUES(16,102);
INSERT INTO "role_permissions" VALUES(16,103);
INSERT INTO "role_permissions" VALUES(16,104);
INSERT INTO "role_permissions" VALUES(16,105);
INSERT INTO "role_permissions" VALUES(16,106);
INSERT INTO "role_permissions" VALUES(16,107);
INSERT INTO "role_permissions" VALUES(16,108);
INSERT INTO "role_permissions" VALUES(16,109);
INSERT INTO "role_permissions" VALUES(16,110);
INSERT INTO "role_permissions" VALUES(16,111);
INSERT INTO "role_permissions" VALUES(16,112);
INSERT INTO "role_permissions" VALUES(16,113);
INSERT INTO "role_permissions" VALUES(16,114);
INSERT INTO "role_permissions" VALUES(16,115);
INSERT INTO "role_permissions" VALUES(16,116);
INSERT INTO "role_permissions" VALUES(16,117);
INSERT INTO "role_permissions" VALUES(16,118);
INSERT INTO "role_permissions" VALUES(16,119);
INSERT INTO "role_permissions" VALUES(16,120);
INSERT INTO "role_permissions" VALUES(16,121);
INSERT INTO "role_permissions" VALUES(16,122);
INSERT INTO "role_permissions" VALUES(16,123);
INSERT INTO "role_permissions" VALUES(16,124);
INSERT INTO "role_permissions" VALUES(16,125);
INSERT INTO "role_permissions" VALUES(16,126);
INSERT INTO "role_permissions" VALUES(16,127);
INSERT INTO "role_permissions" VALUES(16,128);
INSERT INTO "role_permissions" VALUES(16,129);
INSERT INTO "role_permissions" VALUES(16,130);
INSERT INTO "role_permissions" VALUES(16,131);
INSERT INTO "role_permissions" VALUES(16,132);
INSERT INTO "role_permissions" VALUES(16,133);
INSERT INTO "role_permissions" VALUES(16,134);
INSERT INTO "role_permissions" VALUES(16,135);
INSERT INTO "role_permissions" VALUES(16,136);
INSERT INTO "role_permissions" VALUES(16,137);
INSERT INTO "role_permissions" VALUES(16,138);
INSERT INTO "role_permissions" VALUES(16,139);
INSERT INTO "role_permissions" VALUES(16,140);
INSERT INTO "role_permissions" VALUES(16,141);
INSERT INTO "role_permissions" VALUES(16,142);
INSERT INTO "role_permissions" VALUES(16,143);
INSERT INTO "role_permissions" VALUES(16,144);
INSERT INTO "role_permissions" VALUES(16,145);
INSERT INTO "role_permissions" VALUES(16,146);
INSERT INTO "role_permissions" VALUES(16,147);
INSERT INTO "role_permissions" VALUES(16,148);
INSERT INTO "role_permissions" VALUES(16,149);
INSERT INTO "role_permissions" VALUES(16,150);
INSERT INTO "role_permissions" VALUES(16,151);
INSERT INTO "role_permissions" VALUES(16,152);
INSERT INTO "role_permissions" VALUES(16,153);
INSERT INTO "role_permissions" VALUES(16,154);
INSERT INTO "role_permissions" VALUES(16,155);
INSERT INTO "role_permissions" VALUES(16,156);
INSERT INTO "role_permissions" VALUES(16,157);
INSERT INTO "role_permissions" VALUES(16,158);
INSERT INTO "role_permissions" VALUES(16,159);
INSERT INTO "role_permissions" VALUES(16,160);
INSERT INTO "role_permissions" VALUES(16,161);
INSERT INTO "role_permissions" VALUES(16,162);
INSERT INTO "role_permissions" VALUES(16,163);
INSERT INTO "role_permissions" VALUES(16,164);
INSERT INTO "role_permissions" VALUES(16,165);
INSERT INTO "role_permissions" VALUES(16,166);
INSERT INTO "role_permissions" VALUES(16,167);
INSERT INTO "role_permissions" VALUES(16,168);
INSERT INTO "role_permissions" VALUES(16,169);
INSERT INTO "role_permissions" VALUES(16,170);
INSERT INTO "role_permissions" VALUES(16,171);
INSERT INTO "role_permissions" VALUES(16,172);
INSERT INTO "role_permissions" VALUES(16,173);
INSERT INTO "role_permissions" VALUES(16,174);
INSERT INTO "role_permissions" VALUES(16,175);
INSERT INTO "role_permissions" VALUES(16,176);
INSERT INTO "role_permissions" VALUES(16,177);
INSERT INTO "role_permissions" VALUES(16,178);
INSERT INTO "role_permissions" VALUES(16,179);
INSERT INTO "role_permissions" VALUES(16,180);
INSERT INTO "role_permissions" VALUES(16,181);
INSERT INTO "role_permissions" VALUES(16,182);
INSERT INTO "role_permissions" VALUES(16,183);
INSERT INTO "role_permissions" VALUES(16,184);
INSERT INTO "role_permissions" VALUES(16,185);
INSERT INTO "role_permissions" VALUES(16,186);
INSERT INTO "role_permissions" VALUES(16,187);
INSERT INTO "role_permissions" VALUES(16,188);
INSERT INTO "role_permissions" VALUES(16,189);
INSERT INTO "role_permissions" VALUES(16,190);
INSERT INTO "role_permissions" VALUES(16,191);
INSERT INTO "role_permissions" VALUES(16,192);
INSERT INTO "role_permissions" VALUES(16,193);
INSERT INTO "role_permissions" VALUES(16,194);
INSERT INTO "role_permissions" VALUES(16,195);
INSERT INTO "role_permissions" VALUES(16,196);
INSERT INTO "role_permissions" VALUES(16,197);
INSERT INTO "role_permissions" VALUES(16,198);
INSERT INTO "role_permissions" VALUES(16,199);
INSERT INTO "role_permissions" VALUES(16,200);
INSERT INTO "role_permissions" VALUES(16,201);
INSERT INTO "role_permissions" VALUES(16,202);
INSERT INTO "role_permissions" VALUES(16,203);
INSERT INTO "role_permissions" VALUES(16,204);
INSERT INTO "role_permissions" VALUES(16,205);
INSERT INTO "role_permissions" VALUES(16,206);
INSERT INTO "role_permissions" VALUES(16,207);
INSERT INTO "role_permissions" VALUES(16,208);
INSERT INTO "role_permissions" VALUES(16,209);
INSERT INTO "role_permissions" VALUES(16,210);
INSERT INTO "role_permissions" VALUES(16,211);
INSERT INTO "role_permissions" VALUES(16,212);
INSERT INTO "role_permissions" VALUES(16,213);
INSERT INTO "role_permissions" VALUES(16,214);
INSERT INTO "role_permissions" VALUES(16,215);
INSERT INTO "role_permissions" VALUES(16,216);
INSERT INTO "role_permissions" VALUES(16,217);
INSERT INTO "role_permissions" VALUES(16,218);
INSERT INTO "role_permissions" VALUES(16,219);
INSERT INTO "role_permissions" VALUES(16,220);
INSERT INTO "role_permissions" VALUES(16,221);
INSERT INTO "role_permissions" VALUES(16,222);
INSERT INTO "role_permissions" VALUES(16,223);
INSERT INTO "role_permissions" VALUES(16,224);
INSERT INTO "role_permissions" VALUES(16,225);
INSERT INTO "role_permissions" VALUES(16,226);
INSERT INTO "role_permissions" VALUES(16,227);
INSERT INTO "role_permissions" VALUES(16,228);
INSERT INTO "role_permissions" VALUES(16,229);
INSERT INTO "role_permissions" VALUES(16,230);
INSERT INTO "role_permissions" VALUES(16,231);
INSERT INTO "role_permissions" VALUES(16,232);
INSERT INTO "role_permissions" VALUES(16,233);
INSERT INTO "role_permissions" VALUES(16,234);
INSERT INTO "role_permissions" VALUES(16,235);
INSERT INTO "role_permissions" VALUES(16,236);
INSERT INTO "role_permissions" VALUES(16,237);
INSERT INTO "role_permissions" VALUES(16,238);
INSERT INTO "role_permissions" VALUES(16,239);
INSERT INTO "role_permissions" VALUES(16,240);
INSERT INTO "role_permissions" VALUES(16,241);
INSERT INTO "role_permissions" VALUES(16,242);
INSERT INTO "role_permissions" VALUES(16,243);
INSERT INTO "role_permissions" VALUES(16,244);
INSERT INTO "role_permissions" VALUES(16,245);
INSERT INTO "role_permissions" VALUES(16,246);
INSERT INTO "role_permissions" VALUES(16,247);
INSERT INTO "role_permissions" VALUES(16,248);
INSERT INTO "role_permissions" VALUES(16,249);
INSERT INTO "role_permissions" VALUES(16,250);
INSERT INTO "role_permissions" VALUES(16,251);
INSERT INTO "role_permissions" VALUES(16,252);
INSERT INTO "role_permissions" VALUES(16,253);
INSERT INTO "role_permissions" VALUES(16,254);
INSERT INTO "role_permissions" VALUES(16,255);
INSERT INTO "role_permissions" VALUES(16,256);
INSERT INTO "role_permissions" VALUES(16,257);
INSERT INTO "role_permissions" VALUES(16,258);
INSERT INTO "role_permissions" VALUES(16,259);
INSERT INTO "role_permissions" VALUES(16,260);
INSERT INTO "role_permissions" VALUES(16,261);
INSERT INTO "role_permissions" VALUES(16,262);
INSERT INTO "role_permissions" VALUES(16,263);
INSERT INTO "role_permissions" VALUES(16,264);
INSERT INTO "role_permissions" VALUES(16,265);
INSERT INTO "role_permissions" VALUES(16,266);
INSERT INTO "role_permissions" VALUES(16,267);
INSERT INTO "role_permissions" VALUES(16,268);
INSERT INTO "role_permissions" VALUES(16,269);
INSERT INTO "role_permissions" VALUES(16,270);
INSERT INTO "role_permissions" VALUES(16,271);
INSERT INTO "role_permissions" VALUES(16,272);
INSERT INTO "role_permissions" VALUES(16,273);
INSERT INTO "role_permissions" VALUES(16,274);
INSERT INTO "role_permissions" VALUES(16,275);
INSERT INTO "role_permissions" VALUES(16,276);
INSERT INTO "role_permissions" VALUES(16,277);
INSERT INTO "role_permissions" VALUES(16,278);
INSERT INTO "role_permissions" VALUES(16,279);
INSERT INTO "role_permissions" VALUES(16,280);
INSERT INTO "role_permissions" VALUES(16,281);
INSERT INTO "role_permissions" VALUES(16,282);
INSERT INTO "role_permissions" VALUES(16,283);
INSERT INTO "role_permissions" VALUES(16,284);
INSERT INTO "role_permissions" VALUES(16,285);
INSERT INTO "role_permissions" VALUES(16,286);
INSERT INTO "role_permissions" VALUES(16,287);
INSERT INTO "role_permissions" VALUES(16,288);
INSERT INTO "role_permissions" VALUES(16,289);
INSERT INTO "role_permissions" VALUES(16,290);
INSERT INTO "role_permissions" VALUES(16,291);
INSERT INTO "role_permissions" VALUES(16,292);
INSERT INTO "role_permissions" VALUES(16,293);
INSERT INTO "role_permissions" VALUES(16,294);
INSERT INTO "role_permissions" VALUES(16,295);
INSERT INTO "role_permissions" VALUES(16,296);
INSERT INTO "role_permissions" VALUES(16,297);
INSERT INTO "role_permissions" VALUES(16,298);
INSERT INTO "role_permissions" VALUES(16,299);
INSERT INTO "role_permissions" VALUES(16,300);
INSERT INTO "role_permissions" VALUES(16,301);
INSERT INTO "role_permissions" VALUES(16,302);
INSERT INTO "role_permissions" VALUES(16,303);
INSERT INTO "role_permissions" VALUES(16,304);
INSERT INTO "role_permissions" VALUES(16,305);
INSERT INTO "role_permissions" VALUES(16,306);
INSERT INTO "role_permissions" VALUES(16,307);
INSERT INTO "role_permissions" VALUES(16,308);
INSERT INTO "role_permissions" VALUES(16,309);
INSERT INTO "role_permissions" VALUES(16,310);
INSERT INTO "role_permissions" VALUES(16,311);
INSERT INTO "role_permissions" VALUES(16,312);
INSERT INTO "role_permissions" VALUES(16,313);
INSERT INTO "role_permissions" VALUES(16,314);
INSERT INTO "role_permissions" VALUES(16,315);
INSERT INTO "role_permissions" VALUES(22,1);
INSERT INTO "role_permissions" VALUES(22,2);
INSERT INTO "role_permissions" VALUES(22,3);
INSERT INTO "role_permissions" VALUES(22,4);
INSERT INTO "role_permissions" VALUES(22,5);
INSERT INTO "role_permissions" VALUES(22,6);
INSERT INTO "role_permissions" VALUES(22,7);
INSERT INTO "role_permissions" VALUES(22,8);
INSERT INTO "role_permissions" VALUES(22,9);
INSERT INTO "role_permissions" VALUES(22,10);
INSERT INTO "role_permissions" VALUES(22,11);
INSERT INTO "role_permissions" VALUES(22,12);
INSERT INTO "role_permissions" VALUES(22,13);
INSERT INTO "role_permissions" VALUES(22,14);
INSERT INTO "role_permissions" VALUES(22,15);
INSERT INTO "role_permissions" VALUES(22,16);
INSERT INTO "role_permissions" VALUES(22,17);
INSERT INTO "role_permissions" VALUES(22,18);
INSERT INTO "role_permissions" VALUES(22,19);
INSERT INTO "role_permissions" VALUES(22,20);
INSERT INTO "role_permissions" VALUES(22,21);
INSERT INTO "role_permissions" VALUES(22,22);
INSERT INTO "role_permissions" VALUES(22,23);
INSERT INTO "role_permissions" VALUES(22,24);
INSERT INTO "role_permissions" VALUES(22,25);
INSERT INTO "role_permissions" VALUES(22,26);
INSERT INTO "role_permissions" VALUES(22,27);
INSERT INTO "role_permissions" VALUES(22,28);
INSERT INTO "role_permissions" VALUES(22,29);
INSERT INTO "role_permissions" VALUES(22,30);
INSERT INTO "role_permissions" VALUES(22,31);
INSERT INTO "role_permissions" VALUES(22,32);
INSERT INTO "role_permissions" VALUES(22,33);
INSERT INTO "role_permissions" VALUES(22,34);
INSERT INTO "role_permissions" VALUES(22,35);
INSERT INTO "role_permissions" VALUES(22,36);
INSERT INTO "role_permissions" VALUES(22,37);
INSERT INTO "role_permissions" VALUES(22,38);
INSERT INTO "role_permissions" VALUES(22,39);
INSERT INTO "role_permissions" VALUES(22,40);
INSERT INTO "role_permissions" VALUES(22,41);
INSERT INTO "role_permissions" VALUES(22,42);
INSERT INTO "role_permissions" VALUES(22,43);
INSERT INTO "role_permissions" VALUES(22,44);
INSERT INTO "role_permissions" VALUES(22,45);
INSERT INTO "role_permissions" VALUES(22,46);
INSERT INTO "role_permissions" VALUES(22,47);
INSERT INTO "role_permissions" VALUES(22,48);
INSERT INTO "role_permissions" VALUES(22,49);
INSERT INTO "role_permissions" VALUES(22,50);
INSERT INTO "role_permissions" VALUES(22,51);
INSERT INTO "role_permissions" VALUES(22,52);
INSERT INTO "role_permissions" VALUES(22,53);
INSERT INTO "role_permissions" VALUES(22,54);
INSERT INTO "role_permissions" VALUES(22,55);
INSERT INTO "role_permissions" VALUES(22,56);
INSERT INTO "role_permissions" VALUES(22,57);
INSERT INTO "role_permissions" VALUES(22,58);
INSERT INTO "role_permissions" VALUES(22,59);
INSERT INTO "role_permissions" VALUES(22,60);
INSERT INTO "role_permissions" VALUES(22,61);
INSERT INTO "role_permissions" VALUES(22,62);
INSERT INTO "role_permissions" VALUES(22,63);
INSERT INTO "role_permissions" VALUES(22,64);
INSERT INTO "role_permissions" VALUES(22,65);
INSERT INTO "role_permissions" VALUES(22,66);
INSERT INTO "role_permissions" VALUES(22,67);
INSERT INTO "role_permissions" VALUES(22,68);
INSERT INTO "role_permissions" VALUES(22,69);
INSERT INTO "role_permissions" VALUES(22,70);
INSERT INTO "role_permissions" VALUES(22,71);
INSERT INTO "role_permissions" VALUES(22,72);
INSERT INTO "role_permissions" VALUES(22,73);
INSERT INTO "role_permissions" VALUES(22,74);
INSERT INTO "role_permissions" VALUES(22,75);
INSERT INTO "role_permissions" VALUES(22,76);
INSERT INTO "role_permissions" VALUES(22,77);
INSERT INTO "role_permissions" VALUES(22,78);
INSERT INTO "role_permissions" VALUES(22,79);
INSERT INTO "role_permissions" VALUES(22,80);
INSERT INTO "role_permissions" VALUES(22,81);
INSERT INTO "role_permissions" VALUES(22,82);
INSERT INTO "role_permissions" VALUES(22,83);
INSERT INTO "role_permissions" VALUES(22,84);
INSERT INTO "role_permissions" VALUES(22,85);
INSERT INTO "role_permissions" VALUES(22,86);
INSERT INTO "role_permissions" VALUES(22,87);
INSERT INTO "role_permissions" VALUES(22,88);
INSERT INTO "role_permissions" VALUES(22,89);
INSERT INTO "role_permissions" VALUES(22,90);
INSERT INTO "role_permissions" VALUES(22,91);
INSERT INTO "role_permissions" VALUES(22,92);
INSERT INTO "role_permissions" VALUES(22,93);
INSERT INTO "role_permissions" VALUES(22,94);
INSERT INTO "role_permissions" VALUES(22,95);
INSERT INTO "role_permissions" VALUES(22,96);
INSERT INTO "role_permissions" VALUES(22,97);
INSERT INTO "role_permissions" VALUES(22,98);
INSERT INTO "role_permissions" VALUES(22,99);
INSERT INTO "role_permissions" VALUES(22,100);
INSERT INTO "role_permissions" VALUES(22,101);
INSERT INTO "role_permissions" VALUES(22,102);
INSERT INTO "role_permissions" VALUES(22,103);
INSERT INTO "role_permissions" VALUES(22,104);
INSERT INTO "role_permissions" VALUES(22,105);
INSERT INTO "role_permissions" VALUES(22,106);
INSERT INTO "role_permissions" VALUES(22,107);
INSERT INTO "role_permissions" VALUES(22,108);
INSERT INTO "role_permissions" VALUES(22,109);
INSERT INTO "role_permissions" VALUES(22,110);
INSERT INTO "role_permissions" VALUES(22,111);
INSERT INTO "role_permissions" VALUES(22,112);
INSERT INTO "role_permissions" VALUES(22,113);
INSERT INTO "role_permissions" VALUES(22,114);
INSERT INTO "role_permissions" VALUES(22,115);
INSERT INTO "role_permissions" VALUES(22,116);
INSERT INTO "role_permissions" VALUES(22,117);
INSERT INTO "role_permissions" VALUES(22,118);
INSERT INTO "role_permissions" VALUES(22,119);
INSERT INTO "role_permissions" VALUES(22,120);
INSERT INTO "role_permissions" VALUES(22,121);
INSERT INTO "role_permissions" VALUES(22,122);
INSERT INTO "role_permissions" VALUES(22,123);
INSERT INTO "role_permissions" VALUES(22,124);
INSERT INTO "role_permissions" VALUES(22,125);
INSERT INTO "role_permissions" VALUES(22,126);
INSERT INTO "role_permissions" VALUES(22,127);
INSERT INTO "role_permissions" VALUES(22,128);
INSERT INTO "role_permissions" VALUES(22,129);
INSERT INTO "role_permissions" VALUES(22,130);
INSERT INTO "role_permissions" VALUES(22,131);
INSERT INTO "role_permissions" VALUES(22,132);
INSERT INTO "role_permissions" VALUES(22,133);
INSERT INTO "role_permissions" VALUES(22,134);
INSERT INTO "role_permissions" VALUES(22,135);
INSERT INTO "role_permissions" VALUES(22,136);
INSERT INTO "role_permissions" VALUES(22,137);
INSERT INTO "role_permissions" VALUES(22,138);
INSERT INTO "role_permissions" VALUES(22,139);
INSERT INTO "role_permissions" VALUES(22,140);
INSERT INTO "role_permissions" VALUES(22,141);
INSERT INTO "role_permissions" VALUES(22,142);
INSERT INTO "role_permissions" VALUES(22,143);
INSERT INTO "role_permissions" VALUES(22,144);
INSERT INTO "role_permissions" VALUES(22,145);
INSERT INTO "role_permissions" VALUES(22,146);
INSERT INTO "role_permissions" VALUES(22,147);
INSERT INTO "role_permissions" VALUES(22,148);
INSERT INTO "role_permissions" VALUES(22,149);
INSERT INTO "role_permissions" VALUES(22,150);
INSERT INTO "role_permissions" VALUES(22,151);
INSERT INTO "role_permissions" VALUES(22,152);
INSERT INTO "role_permissions" VALUES(22,153);
INSERT INTO "role_permissions" VALUES(22,154);
INSERT INTO "role_permissions" VALUES(22,155);
INSERT INTO "role_permissions" VALUES(22,156);
INSERT INTO "role_permissions" VALUES(22,157);
INSERT INTO "role_permissions" VALUES(22,158);
INSERT INTO "role_permissions" VALUES(22,159);
INSERT INTO "role_permissions" VALUES(22,160);
INSERT INTO "role_permissions" VALUES(22,161);
INSERT INTO "role_permissions" VALUES(22,162);
INSERT INTO "role_permissions" VALUES(22,163);
INSERT INTO "role_permissions" VALUES(22,164);
INSERT INTO "role_permissions" VALUES(22,165);
INSERT INTO "role_permissions" VALUES(22,166);
INSERT INTO "role_permissions" VALUES(22,167);
INSERT INTO "role_permissions" VALUES(22,168);
INSERT INTO "role_permissions" VALUES(22,169);
INSERT INTO "role_permissions" VALUES(22,170);
INSERT INTO "role_permissions" VALUES(22,171);
INSERT INTO "role_permissions" VALUES(22,172);
INSERT INTO "role_permissions" VALUES(22,173);
INSERT INTO "role_permissions" VALUES(22,174);
INSERT INTO "role_permissions" VALUES(22,175);
INSERT INTO "role_permissions" VALUES(22,176);
INSERT INTO "role_permissions" VALUES(22,177);
INSERT INTO "role_permissions" VALUES(22,178);
INSERT INTO "role_permissions" VALUES(22,179);
INSERT INTO "role_permissions" VALUES(22,180);
INSERT INTO "role_permissions" VALUES(22,181);
INSERT INTO "role_permissions" VALUES(22,182);
INSERT INTO "role_permissions" VALUES(22,183);
INSERT INTO "role_permissions" VALUES(22,184);
INSERT INTO "role_permissions" VALUES(22,185);
INSERT INTO "role_permissions" VALUES(22,186);
INSERT INTO "role_permissions" VALUES(22,187);
INSERT INTO "role_permissions" VALUES(22,188);
INSERT INTO "role_permissions" VALUES(22,189);
INSERT INTO "role_permissions" VALUES(22,190);
INSERT INTO "role_permissions" VALUES(22,191);
INSERT INTO "role_permissions" VALUES(22,192);
INSERT INTO "role_permissions" VALUES(22,193);
INSERT INTO "role_permissions" VALUES(22,194);
INSERT INTO "role_permissions" VALUES(22,195);
INSERT INTO "role_permissions" VALUES(22,196);
INSERT INTO "role_permissions" VALUES(22,197);
INSERT INTO "role_permissions" VALUES(22,198);
INSERT INTO "role_permissions" VALUES(22,199);
INSERT INTO "role_permissions" VALUES(22,200);
INSERT INTO "role_permissions" VALUES(22,201);
INSERT INTO "role_permissions" VALUES(22,202);
INSERT INTO "role_permissions" VALUES(22,203);
INSERT INTO "role_permissions" VALUES(22,204);
INSERT INTO "role_permissions" VALUES(22,205);
INSERT INTO "role_permissions" VALUES(22,206);
INSERT INTO "role_permissions" VALUES(22,207);
INSERT INTO "role_permissions" VALUES(22,208);
INSERT INTO "role_permissions" VALUES(22,209);
INSERT INTO "role_permissions" VALUES(22,210);
INSERT INTO "role_permissions" VALUES(22,211);
INSERT INTO "role_permissions" VALUES(22,212);
INSERT INTO "role_permissions" VALUES(22,213);
INSERT INTO "role_permissions" VALUES(22,214);
INSERT INTO "role_permissions" VALUES(22,215);
INSERT INTO "role_permissions" VALUES(22,216);
INSERT INTO "role_permissions" VALUES(22,217);
INSERT INTO "role_permissions" VALUES(22,218);
INSERT INTO "role_permissions" VALUES(22,219);
INSERT INTO "role_permissions" VALUES(22,220);
INSERT INTO "role_permissions" VALUES(22,221);
INSERT INTO "role_permissions" VALUES(22,222);
INSERT INTO "role_permissions" VALUES(22,223);
INSERT INTO "role_permissions" VALUES(22,224);
INSERT INTO "role_permissions" VALUES(22,225);
INSERT INTO "role_permissions" VALUES(22,226);
INSERT INTO "role_permissions" VALUES(22,227);
INSERT INTO "role_permissions" VALUES(22,228);
INSERT INTO "role_permissions" VALUES(22,229);
INSERT INTO "role_permissions" VALUES(22,230);
INSERT INTO "role_permissions" VALUES(22,231);
INSERT INTO "role_permissions" VALUES(22,232);
INSERT INTO "role_permissions" VALUES(22,233);
INSERT INTO "role_permissions" VALUES(22,234);
INSERT INTO "role_permissions" VALUES(22,235);
INSERT INTO "role_permissions" VALUES(22,236);
INSERT INTO "role_permissions" VALUES(22,237);
INSERT INTO "role_permissions" VALUES(22,238);
INSERT INTO "role_permissions" VALUES(22,239);
INSERT INTO "role_permissions" VALUES(22,240);
INSERT INTO "role_permissions" VALUES(22,241);
INSERT INTO "role_permissions" VALUES(22,242);
INSERT INTO "role_permissions" VALUES(22,243);
INSERT INTO "role_permissions" VALUES(22,244);
INSERT INTO "role_permissions" VALUES(22,245);
INSERT INTO "role_permissions" VALUES(22,246);
INSERT INTO "role_permissions" VALUES(22,247);
INSERT INTO "role_permissions" VALUES(22,248);
INSERT INTO "role_permissions" VALUES(22,249);
INSERT INTO "role_permissions" VALUES(22,250);
INSERT INTO "role_permissions" VALUES(22,251);
INSERT INTO "role_permissions" VALUES(22,252);
INSERT INTO "role_permissions" VALUES(22,253);
INSERT INTO "role_permissions" VALUES(22,254);
INSERT INTO "role_permissions" VALUES(22,255);
INSERT INTO "role_permissions" VALUES(22,256);
INSERT INTO "role_permissions" VALUES(22,257);
INSERT INTO "role_permissions" VALUES(22,258);
INSERT INTO "role_permissions" VALUES(22,259);
INSERT INTO "role_permissions" VALUES(22,260);
INSERT INTO "role_permissions" VALUES(22,261);
INSERT INTO "role_permissions" VALUES(22,262);
INSERT INTO "role_permissions" VALUES(22,263);
INSERT INTO "role_permissions" VALUES(22,264);
INSERT INTO "role_permissions" VALUES(22,265);
INSERT INTO "role_permissions" VALUES(22,266);
INSERT INTO "role_permissions" VALUES(22,267);
INSERT INTO "role_permissions" VALUES(22,268);
INSERT INTO "role_permissions" VALUES(22,269);
INSERT INTO "role_permissions" VALUES(22,270);
INSERT INTO "role_permissions" VALUES(22,271);
INSERT INTO "role_permissions" VALUES(22,272);
INSERT INTO "role_permissions" VALUES(22,273);
INSERT INTO "role_permissions" VALUES(22,274);
INSERT INTO "role_permissions" VALUES(22,275);
INSERT INTO "role_permissions" VALUES(22,276);
INSERT INTO "role_permissions" VALUES(22,277);
INSERT INTO "role_permissions" VALUES(22,278);
INSERT INTO "role_permissions" VALUES(22,279);
INSERT INTO "role_permissions" VALUES(22,280);
INSERT INTO "role_permissions" VALUES(22,281);
INSERT INTO "role_permissions" VALUES(22,282);
INSERT INTO "role_permissions" VALUES(22,283);
INSERT INTO "role_permissions" VALUES(22,284);
INSERT INTO "role_permissions" VALUES(22,285);
INSERT INTO "role_permissions" VALUES(22,286);
INSERT INTO "role_permissions" VALUES(22,287);
INSERT INTO "role_permissions" VALUES(22,288);
INSERT INTO "role_permissions" VALUES(22,289);
INSERT INTO "role_permissions" VALUES(22,290);
INSERT INTO "role_permissions" VALUES(22,291);
INSERT INTO "role_permissions" VALUES(22,292);
INSERT INTO "role_permissions" VALUES(22,293);
INSERT INTO "role_permissions" VALUES(22,294);
INSERT INTO "role_permissions" VALUES(22,295);
INSERT INTO "role_permissions" VALUES(22,296);
INSERT INTO "role_permissions" VALUES(22,297);
INSERT INTO "role_permissions" VALUES(22,298);
INSERT INTO "role_permissions" VALUES(22,299);
INSERT INTO "role_permissions" VALUES(22,300);
INSERT INTO "role_permissions" VALUES(22,301);
INSERT INTO "role_permissions" VALUES(22,302);
INSERT INTO "role_permissions" VALUES(22,303);
INSERT INTO "role_permissions" VALUES(22,304);
INSERT INTO "role_permissions" VALUES(22,305);
INSERT INTO "role_permissions" VALUES(22,306);
INSERT INTO "role_permissions" VALUES(22,307);
INSERT INTO "role_permissions" VALUES(22,308);
INSERT INTO "role_permissions" VALUES(22,309);
INSERT INTO "role_permissions" VALUES(22,310);
INSERT INTO "role_permissions" VALUES(22,311);
INSERT INTO "role_permissions" VALUES(22,312);
INSERT INTO "role_permissions" VALUES(22,313);
INSERT INTO "role_permissions" VALUES(22,314);
INSERT INTO "role_permissions" VALUES(22,315);
INSERT INTO "role_permissions" VALUES(23,1);
INSERT INTO "role_permissions" VALUES(23,2);
INSERT INTO "role_permissions" VALUES(23,3);
INSERT INTO "role_permissions" VALUES(23,4);
INSERT INTO "role_permissions" VALUES(23,5);
INSERT INTO "role_permissions" VALUES(23,6);
INSERT INTO "role_permissions" VALUES(23,7);
INSERT INTO "role_permissions" VALUES(23,8);
INSERT INTO "role_permissions" VALUES(23,9);
INSERT INTO "role_permissions" VALUES(23,10);
INSERT INTO "role_permissions" VALUES(23,11);
INSERT INTO "role_permissions" VALUES(23,12);
INSERT INTO "role_permissions" VALUES(23,13);
INSERT INTO "role_permissions" VALUES(23,14);
INSERT INTO "role_permissions" VALUES(23,15);
INSERT INTO "role_permissions" VALUES(23,16);
INSERT INTO "role_permissions" VALUES(23,17);
INSERT INTO "role_permissions" VALUES(23,18);
INSERT INTO "role_permissions" VALUES(23,19);
INSERT INTO "role_permissions" VALUES(23,20);
INSERT INTO "role_permissions" VALUES(23,21);
INSERT INTO "role_permissions" VALUES(23,22);
INSERT INTO "role_permissions" VALUES(23,23);
INSERT INTO "role_permissions" VALUES(23,24);
INSERT INTO "role_permissions" VALUES(23,25);
INSERT INTO "role_permissions" VALUES(23,26);
INSERT INTO "role_permissions" VALUES(23,27);
INSERT INTO "role_permissions" VALUES(23,28);
INSERT INTO "role_permissions" VALUES(23,29);
INSERT INTO "role_permissions" VALUES(23,30);
INSERT INTO "role_permissions" VALUES(23,31);
INSERT INTO "role_permissions" VALUES(23,32);
INSERT INTO "role_permissions" VALUES(23,33);
INSERT INTO "role_permissions" VALUES(23,34);
INSERT INTO "role_permissions" VALUES(23,35);
INSERT INTO "role_permissions" VALUES(23,36);
INSERT INTO "role_permissions" VALUES(23,37);
INSERT INTO "role_permissions" VALUES(23,38);
INSERT INTO "role_permissions" VALUES(23,39);
INSERT INTO "role_permissions" VALUES(23,40);
INSERT INTO "role_permissions" VALUES(23,41);
INSERT INTO "role_permissions" VALUES(23,42);
INSERT INTO "role_permissions" VALUES(23,43);
INSERT INTO "role_permissions" VALUES(23,44);
INSERT INTO "role_permissions" VALUES(23,45);
INSERT INTO "role_permissions" VALUES(23,46);
INSERT INTO "role_permissions" VALUES(23,47);
INSERT INTO "role_permissions" VALUES(23,48);
INSERT INTO "role_permissions" VALUES(23,49);
INSERT INTO "role_permissions" VALUES(23,50);
INSERT INTO "role_permissions" VALUES(23,51);
INSERT INTO "role_permissions" VALUES(23,52);
INSERT INTO "role_permissions" VALUES(23,53);
INSERT INTO "role_permissions" VALUES(23,54);
INSERT INTO "role_permissions" VALUES(23,55);
INSERT INTO "role_permissions" VALUES(23,56);
INSERT INTO "role_permissions" VALUES(23,57);
INSERT INTO "role_permissions" VALUES(23,58);
INSERT INTO "role_permissions" VALUES(23,59);
INSERT INTO "role_permissions" VALUES(23,60);
INSERT INTO "role_permissions" VALUES(23,61);
INSERT INTO "role_permissions" VALUES(23,62);
INSERT INTO "role_permissions" VALUES(23,63);
INSERT INTO "role_permissions" VALUES(23,64);
INSERT INTO "role_permissions" VALUES(23,65);
INSERT INTO "role_permissions" VALUES(23,66);
INSERT INTO "role_permissions" VALUES(23,67);
INSERT INTO "role_permissions" VALUES(23,68);
INSERT INTO "role_permissions" VALUES(23,69);
INSERT INTO "role_permissions" VALUES(23,70);
INSERT INTO "role_permissions" VALUES(23,71);
INSERT INTO "role_permissions" VALUES(23,72);
INSERT INTO "role_permissions" VALUES(23,73);
INSERT INTO "role_permissions" VALUES(23,74);
INSERT INTO "role_permissions" VALUES(23,75);
INSERT INTO "role_permissions" VALUES(23,76);
INSERT INTO "role_permissions" VALUES(23,77);
INSERT INTO "role_permissions" VALUES(23,78);
INSERT INTO "role_permissions" VALUES(23,79);
INSERT INTO "role_permissions" VALUES(23,80);
INSERT INTO "role_permissions" VALUES(23,81);
INSERT INTO "role_permissions" VALUES(23,82);
INSERT INTO "role_permissions" VALUES(23,83);
INSERT INTO "role_permissions" VALUES(23,84);
INSERT INTO "role_permissions" VALUES(23,85);
INSERT INTO "role_permissions" VALUES(23,86);
INSERT INTO "role_permissions" VALUES(23,87);
INSERT INTO "role_permissions" VALUES(23,88);
INSERT INTO "role_permissions" VALUES(23,89);
INSERT INTO "role_permissions" VALUES(23,90);
INSERT INTO "role_permissions" VALUES(23,91);
INSERT INTO "role_permissions" VALUES(23,92);
INSERT INTO "role_permissions" VALUES(23,93);
INSERT INTO "role_permissions" VALUES(23,94);
INSERT INTO "role_permissions" VALUES(23,95);
INSERT INTO "role_permissions" VALUES(23,96);
INSERT INTO "role_permissions" VALUES(23,97);
INSERT INTO "role_permissions" VALUES(23,98);
INSERT INTO "role_permissions" VALUES(23,99);
INSERT INTO "role_permissions" VALUES(23,100);
INSERT INTO "role_permissions" VALUES(23,101);
INSERT INTO "role_permissions" VALUES(23,102);
INSERT INTO "role_permissions" VALUES(23,103);
INSERT INTO "role_permissions" VALUES(23,104);
INSERT INTO "role_permissions" VALUES(23,105);
INSERT INTO "role_permissions" VALUES(23,106);
INSERT INTO "role_permissions" VALUES(23,107);
INSERT INTO "role_permissions" VALUES(23,108);
INSERT INTO "role_permissions" VALUES(23,109);
INSERT INTO "role_permissions" VALUES(23,110);
INSERT INTO "role_permissions" VALUES(23,111);
INSERT INTO "role_permissions" VALUES(23,112);
INSERT INTO "role_permissions" VALUES(23,113);
INSERT INTO "role_permissions" VALUES(23,114);
INSERT INTO "role_permissions" VALUES(23,115);
INSERT INTO "role_permissions" VALUES(23,116);
INSERT INTO "role_permissions" VALUES(23,117);
INSERT INTO "role_permissions" VALUES(23,118);
INSERT INTO "role_permissions" VALUES(23,119);
INSERT INTO "role_permissions" VALUES(23,120);
INSERT INTO "role_permissions" VALUES(23,121);
INSERT INTO "role_permissions" VALUES(23,122);
INSERT INTO "role_permissions" VALUES(23,123);
INSERT INTO "role_permissions" VALUES(23,124);
INSERT INTO "role_permissions" VALUES(23,125);
INSERT INTO "role_permissions" VALUES(23,126);
INSERT INTO "role_permissions" VALUES(23,127);
INSERT INTO "role_permissions" VALUES(23,128);
INSERT INTO "role_permissions" VALUES(23,129);
INSERT INTO "role_permissions" VALUES(23,130);
INSERT INTO "role_permissions" VALUES(23,131);
INSERT INTO "role_permissions" VALUES(23,132);
INSERT INTO "role_permissions" VALUES(23,133);
INSERT INTO "role_permissions" VALUES(23,134);
INSERT INTO "role_permissions" VALUES(23,135);
INSERT INTO "role_permissions" VALUES(23,136);
INSERT INTO "role_permissions" VALUES(23,137);
INSERT INTO "role_permissions" VALUES(23,138);
INSERT INTO "role_permissions" VALUES(23,139);
INSERT INTO "role_permissions" VALUES(23,140);
INSERT INTO "role_permissions" VALUES(23,141);
INSERT INTO "role_permissions" VALUES(23,142);
INSERT INTO "role_permissions" VALUES(23,143);
INSERT INTO "role_permissions" VALUES(23,144);
INSERT INTO "role_permissions" VALUES(23,145);
INSERT INTO "role_permissions" VALUES(23,146);
INSERT INTO "role_permissions" VALUES(23,147);
INSERT INTO "role_permissions" VALUES(23,148);
INSERT INTO "role_permissions" VALUES(23,149);
INSERT INTO "role_permissions" VALUES(23,150);
INSERT INTO "role_permissions" VALUES(23,151);
INSERT INTO "role_permissions" VALUES(23,152);
INSERT INTO "role_permissions" VALUES(23,153);
INSERT INTO "role_permissions" VALUES(23,154);
INSERT INTO "role_permissions" VALUES(23,155);
INSERT INTO "role_permissions" VALUES(23,156);
INSERT INTO "role_permissions" VALUES(23,157);
INSERT INTO "role_permissions" VALUES(23,158);
INSERT INTO "role_permissions" VALUES(23,159);
INSERT INTO "role_permissions" VALUES(23,160);
INSERT INTO "role_permissions" VALUES(23,161);
INSERT INTO "role_permissions" VALUES(23,162);
INSERT INTO "role_permissions" VALUES(23,163);
INSERT INTO "role_permissions" VALUES(23,164);
INSERT INTO "role_permissions" VALUES(23,165);
INSERT INTO "role_permissions" VALUES(23,166);
INSERT INTO "role_permissions" VALUES(23,167);
INSERT INTO "role_permissions" VALUES(23,168);
INSERT INTO "role_permissions" VALUES(23,169);
INSERT INTO "role_permissions" VALUES(23,170);
INSERT INTO "role_permissions" VALUES(23,171);
INSERT INTO "role_permissions" VALUES(23,172);
INSERT INTO "role_permissions" VALUES(23,173);
INSERT INTO "role_permissions" VALUES(23,174);
INSERT INTO "role_permissions" VALUES(23,175);
INSERT INTO "role_permissions" VALUES(23,176);
INSERT INTO "role_permissions" VALUES(23,177);
INSERT INTO "role_permissions" VALUES(23,178);
INSERT INTO "role_permissions" VALUES(23,179);
INSERT INTO "role_permissions" VALUES(23,180);
INSERT INTO "role_permissions" VALUES(23,181);
INSERT INTO "role_permissions" VALUES(23,182);
INSERT INTO "role_permissions" VALUES(23,183);
INSERT INTO "role_permissions" VALUES(23,184);
INSERT INTO "role_permissions" VALUES(23,185);
INSERT INTO "role_permissions" VALUES(23,186);
INSERT INTO "role_permissions" VALUES(23,187);
INSERT INTO "role_permissions" VALUES(23,188);
INSERT INTO "role_permissions" VALUES(23,189);
INSERT INTO "role_permissions" VALUES(23,190);
INSERT INTO "role_permissions" VALUES(23,191);
INSERT INTO "role_permissions" VALUES(23,192);
INSERT INTO "role_permissions" VALUES(23,193);
INSERT INTO "role_permissions" VALUES(23,194);
INSERT INTO "role_permissions" VALUES(23,195);
INSERT INTO "role_permissions" VALUES(23,196);
INSERT INTO "role_permissions" VALUES(23,197);
INSERT INTO "role_permissions" VALUES(23,198);
INSERT INTO "role_permissions" VALUES(23,199);
INSERT INTO "role_permissions" VALUES(23,200);
INSERT INTO "role_permissions" VALUES(23,201);
INSERT INTO "role_permissions" VALUES(23,202);
INSERT INTO "role_permissions" VALUES(23,203);
INSERT INTO "role_permissions" VALUES(23,204);
INSERT INTO "role_permissions" VALUES(23,205);
INSERT INTO "role_permissions" VALUES(23,206);
INSERT INTO "role_permissions" VALUES(23,207);
INSERT INTO "role_permissions" VALUES(23,208);
INSERT INTO "role_permissions" VALUES(23,209);
INSERT INTO "role_permissions" VALUES(23,210);
INSERT INTO "role_permissions" VALUES(23,211);
INSERT INTO "role_permissions" VALUES(23,212);
INSERT INTO "role_permissions" VALUES(23,213);
INSERT INTO "role_permissions" VALUES(23,214);
INSERT INTO "role_permissions" VALUES(23,215);
INSERT INTO "role_permissions" VALUES(23,216);
INSERT INTO "role_permissions" VALUES(23,217);
INSERT INTO "role_permissions" VALUES(23,218);
INSERT INTO "role_permissions" VALUES(23,219);
INSERT INTO "role_permissions" VALUES(23,220);
INSERT INTO "role_permissions" VALUES(23,221);
INSERT INTO "role_permissions" VALUES(23,222);
INSERT INTO "role_permissions" VALUES(23,223);
INSERT INTO "role_permissions" VALUES(23,224);
INSERT INTO "role_permissions" VALUES(23,225);
INSERT INTO "role_permissions" VALUES(23,226);
INSERT INTO "role_permissions" VALUES(23,227);
INSERT INTO "role_permissions" VALUES(23,228);
INSERT INTO "role_permissions" VALUES(23,229);
INSERT INTO "role_permissions" VALUES(23,230);
INSERT INTO "role_permissions" VALUES(23,231);
INSERT INTO "role_permissions" VALUES(23,232);
INSERT INTO "role_permissions" VALUES(23,233);
INSERT INTO "role_permissions" VALUES(23,234);
INSERT INTO "role_permissions" VALUES(23,235);
INSERT INTO "role_permissions" VALUES(23,236);
INSERT INTO "role_permissions" VALUES(23,237);
INSERT INTO "role_permissions" VALUES(23,238);
INSERT INTO "role_permissions" VALUES(23,239);
INSERT INTO "role_permissions" VALUES(23,240);
INSERT INTO "role_permissions" VALUES(23,241);
INSERT INTO "role_permissions" VALUES(23,242);
INSERT INTO "role_permissions" VALUES(23,243);
INSERT INTO "role_permissions" VALUES(23,244);
INSERT INTO "role_permissions" VALUES(23,245);
INSERT INTO "role_permissions" VALUES(23,246);
INSERT INTO "role_permissions" VALUES(23,247);
INSERT INTO "role_permissions" VALUES(23,248);
INSERT INTO "role_permissions" VALUES(23,249);
INSERT INTO "role_permissions" VALUES(23,250);
INSERT INTO "role_permissions" VALUES(23,251);
INSERT INTO "role_permissions" VALUES(23,252);
INSERT INTO "role_permissions" VALUES(23,253);
INSERT INTO "role_permissions" VALUES(23,254);
INSERT INTO "role_permissions" VALUES(23,255);
INSERT INTO "role_permissions" VALUES(23,256);
INSERT INTO "role_permissions" VALUES(23,257);
INSERT INTO "role_permissions" VALUES(23,258);
INSERT INTO "role_permissions" VALUES(23,259);
INSERT INTO "role_permissions" VALUES(23,260);
INSERT INTO "role_permissions" VALUES(23,261);
INSERT INTO "role_permissions" VALUES(23,262);
INSERT INTO "role_permissions" VALUES(23,263);
INSERT INTO "role_permissions" VALUES(23,264);
INSERT INTO "role_permissions" VALUES(23,265);
INSERT INTO "role_permissions" VALUES(23,266);
INSERT INTO "role_permissions" VALUES(23,267);
INSERT INTO "role_permissions" VALUES(23,268);
INSERT INTO "role_permissions" VALUES(23,269);
INSERT INTO "role_permissions" VALUES(23,270);
INSERT INTO "role_permissions" VALUES(23,271);
INSERT INTO "role_permissions" VALUES(23,272);
INSERT INTO "role_permissions" VALUES(23,273);
INSERT INTO "role_permissions" VALUES(23,274);
INSERT INTO "role_permissions" VALUES(23,275);
INSERT INTO "role_permissions" VALUES(23,276);
INSERT INTO "role_permissions" VALUES(23,277);
INSERT INTO "role_permissions" VALUES(23,278);
INSERT INTO "role_permissions" VALUES(23,279);
INSERT INTO "role_permissions" VALUES(23,280);
INSERT INTO "role_permissions" VALUES(23,281);
INSERT INTO "role_permissions" VALUES(23,282);
INSERT INTO "role_permissions" VALUES(23,283);
INSERT INTO "role_permissions" VALUES(23,284);
INSERT INTO "role_permissions" VALUES(23,285);
INSERT INTO "role_permissions" VALUES(23,286);
INSERT INTO "role_permissions" VALUES(23,287);
INSERT INTO "role_permissions" VALUES(23,288);
INSERT INTO "role_permissions" VALUES(23,289);
INSERT INTO "role_permissions" VALUES(23,290);
INSERT INTO "role_permissions" VALUES(23,291);
INSERT INTO "role_permissions" VALUES(23,292);
INSERT INTO "role_permissions" VALUES(23,293);
INSERT INTO "role_permissions" VALUES(23,294);
INSERT INTO "role_permissions" VALUES(23,295);
INSERT INTO "role_permissions" VALUES(23,296);
INSERT INTO "role_permissions" VALUES(23,297);
INSERT INTO "role_permissions" VALUES(23,298);
INSERT INTO "role_permissions" VALUES(23,299);
INSERT INTO "role_permissions" VALUES(23,300);
INSERT INTO "role_permissions" VALUES(23,301);
INSERT INTO "role_permissions" VALUES(23,302);
INSERT INTO "role_permissions" VALUES(23,303);
INSERT INTO "role_permissions" VALUES(23,304);
INSERT INTO "role_permissions" VALUES(23,305);
INSERT INTO "role_permissions" VALUES(23,306);
INSERT INTO "role_permissions" VALUES(23,307);
INSERT INTO "role_permissions" VALUES(23,308);
INSERT INTO "role_permissions" VALUES(23,309);
INSERT INTO "role_permissions" VALUES(23,310);
INSERT INTO "role_permissions" VALUES(23,311);
INSERT INTO "role_permissions" VALUES(23,312);
INSERT INTO "role_permissions" VALUES(23,313);
INSERT INTO "role_permissions" VALUES(23,314);
INSERT INTO "role_permissions" VALUES(23,315);
INSERT INTO "role_permissions" VALUES(29,1);
INSERT INTO "role_permissions" VALUES(29,2);
INSERT INTO "role_permissions" VALUES(29,3);
INSERT INTO "role_permissions" VALUES(29,4);
INSERT INTO "role_permissions" VALUES(29,5);
INSERT INTO "role_permissions" VALUES(29,6);
INSERT INTO "role_permissions" VALUES(29,7);
INSERT INTO "role_permissions" VALUES(29,8);
INSERT INTO "role_permissions" VALUES(29,9);
INSERT INTO "role_permissions" VALUES(29,10);
INSERT INTO "role_permissions" VALUES(29,11);
INSERT INTO "role_permissions" VALUES(29,12);
INSERT INTO "role_permissions" VALUES(29,13);
INSERT INTO "role_permissions" VALUES(29,14);
INSERT INTO "role_permissions" VALUES(29,15);
INSERT INTO "role_permissions" VALUES(29,16);
INSERT INTO "role_permissions" VALUES(29,17);
INSERT INTO "role_permissions" VALUES(29,18);
INSERT INTO "role_permissions" VALUES(29,19);
INSERT INTO "role_permissions" VALUES(29,20);
INSERT INTO "role_permissions" VALUES(29,21);
INSERT INTO "role_permissions" VALUES(29,22);
INSERT INTO "role_permissions" VALUES(29,23);
INSERT INTO "role_permissions" VALUES(29,24);
INSERT INTO "role_permissions" VALUES(29,25);
INSERT INTO "role_permissions" VALUES(29,26);
INSERT INTO "role_permissions" VALUES(29,27);
INSERT INTO "role_permissions" VALUES(29,28);
INSERT INTO "role_permissions" VALUES(29,29);
INSERT INTO "role_permissions" VALUES(29,30);
INSERT INTO "role_permissions" VALUES(29,31);
INSERT INTO "role_permissions" VALUES(29,32);
INSERT INTO "role_permissions" VALUES(29,33);
INSERT INTO "role_permissions" VALUES(29,34);
INSERT INTO "role_permissions" VALUES(29,35);
INSERT INTO "role_permissions" VALUES(29,36);
INSERT INTO "role_permissions" VALUES(29,37);
INSERT INTO "role_permissions" VALUES(29,38);
INSERT INTO "role_permissions" VALUES(29,39);
INSERT INTO "role_permissions" VALUES(29,40);
INSERT INTO "role_permissions" VALUES(29,41);
INSERT INTO "role_permissions" VALUES(29,42);
INSERT INTO "role_permissions" VALUES(29,43);
INSERT INTO "role_permissions" VALUES(29,44);
INSERT INTO "role_permissions" VALUES(29,45);
INSERT INTO "role_permissions" VALUES(29,46);
INSERT INTO "role_permissions" VALUES(29,47);
INSERT INTO "role_permissions" VALUES(29,48);
INSERT INTO "role_permissions" VALUES(29,49);
INSERT INTO "role_permissions" VALUES(29,50);
INSERT INTO "role_permissions" VALUES(29,51);
INSERT INTO "role_permissions" VALUES(29,52);
INSERT INTO "role_permissions" VALUES(29,53);
INSERT INTO "role_permissions" VALUES(29,54);
INSERT INTO "role_permissions" VALUES(29,55);
INSERT INTO "role_permissions" VALUES(29,56);
INSERT INTO "role_permissions" VALUES(29,57);
INSERT INTO "role_permissions" VALUES(29,58);
INSERT INTO "role_permissions" VALUES(29,59);
INSERT INTO "role_permissions" VALUES(29,60);
INSERT INTO "role_permissions" VALUES(29,61);
INSERT INTO "role_permissions" VALUES(29,62);
INSERT INTO "role_permissions" VALUES(29,63);
INSERT INTO "role_permissions" VALUES(29,64);
INSERT INTO "role_permissions" VALUES(29,65);
INSERT INTO "role_permissions" VALUES(29,66);
INSERT INTO "role_permissions" VALUES(29,67);
INSERT INTO "role_permissions" VALUES(29,68);
INSERT INTO "role_permissions" VALUES(29,69);
INSERT INTO "role_permissions" VALUES(29,70);
INSERT INTO "role_permissions" VALUES(29,71);
INSERT INTO "role_permissions" VALUES(29,72);
INSERT INTO "role_permissions" VALUES(29,73);
INSERT INTO "role_permissions" VALUES(29,74);
INSERT INTO "role_permissions" VALUES(29,75);
INSERT INTO "role_permissions" VALUES(29,76);
INSERT INTO "role_permissions" VALUES(29,77);
INSERT INTO "role_permissions" VALUES(29,78);
INSERT INTO "role_permissions" VALUES(29,79);
INSERT INTO "role_permissions" VALUES(29,80);
INSERT INTO "role_permissions" VALUES(29,81);
INSERT INTO "role_permissions" VALUES(29,82);
INSERT INTO "role_permissions" VALUES(29,83);
INSERT INTO "role_permissions" VALUES(29,84);
INSERT INTO "role_permissions" VALUES(29,85);
INSERT INTO "role_permissions" VALUES(29,86);
INSERT INTO "role_permissions" VALUES(29,87);
INSERT INTO "role_permissions" VALUES(29,88);
INSERT INTO "role_permissions" VALUES(29,89);
INSERT INTO "role_permissions" VALUES(29,90);
INSERT INTO "role_permissions" VALUES(29,91);
INSERT INTO "role_permissions" VALUES(29,92);
INSERT INTO "role_permissions" VALUES(29,93);
INSERT INTO "role_permissions" VALUES(29,94);
INSERT INTO "role_permissions" VALUES(29,95);
INSERT INTO "role_permissions" VALUES(29,96);
INSERT INTO "role_permissions" VALUES(29,97);
INSERT INTO "role_permissions" VALUES(29,98);
INSERT INTO "role_permissions" VALUES(29,99);
INSERT INTO "role_permissions" VALUES(29,100);
INSERT INTO "role_permissions" VALUES(29,101);
INSERT INTO "role_permissions" VALUES(29,102);
INSERT INTO "role_permissions" VALUES(29,103);
INSERT INTO "role_permissions" VALUES(29,104);
INSERT INTO "role_permissions" VALUES(29,105);
INSERT INTO "role_permissions" VALUES(29,106);
INSERT INTO "role_permissions" VALUES(29,107);
INSERT INTO "role_permissions" VALUES(29,108);
INSERT INTO "role_permissions" VALUES(29,109);
INSERT INTO "role_permissions" VALUES(29,110);
INSERT INTO "role_permissions" VALUES(29,111);
INSERT INTO "role_permissions" VALUES(29,112);
INSERT INTO "role_permissions" VALUES(29,113);
INSERT INTO "role_permissions" VALUES(29,114);
INSERT INTO "role_permissions" VALUES(29,115);
INSERT INTO "role_permissions" VALUES(29,116);
INSERT INTO "role_permissions" VALUES(29,117);
INSERT INTO "role_permissions" VALUES(29,118);
INSERT INTO "role_permissions" VALUES(29,119);
INSERT INTO "role_permissions" VALUES(29,120);
INSERT INTO "role_permissions" VALUES(29,121);
INSERT INTO "role_permissions" VALUES(29,122);
INSERT INTO "role_permissions" VALUES(29,123);
INSERT INTO "role_permissions" VALUES(29,124);
INSERT INTO "role_permissions" VALUES(29,125);
INSERT INTO "role_permissions" VALUES(29,126);
INSERT INTO "role_permissions" VALUES(29,127);
INSERT INTO "role_permissions" VALUES(29,128);
INSERT INTO "role_permissions" VALUES(29,129);
INSERT INTO "role_permissions" VALUES(29,130);
INSERT INTO "role_permissions" VALUES(29,131);
INSERT INTO "role_permissions" VALUES(29,132);
INSERT INTO "role_permissions" VALUES(29,133);
INSERT INTO "role_permissions" VALUES(29,134);
INSERT INTO "role_permissions" VALUES(29,135);
INSERT INTO "role_permissions" VALUES(29,136);
INSERT INTO "role_permissions" VALUES(29,137);
INSERT INTO "role_permissions" VALUES(29,138);
INSERT INTO "role_permissions" VALUES(29,139);
INSERT INTO "role_permissions" VALUES(29,140);
INSERT INTO "role_permissions" VALUES(29,141);
INSERT INTO "role_permissions" VALUES(29,142);
INSERT INTO "role_permissions" VALUES(29,143);
INSERT INTO "role_permissions" VALUES(29,144);
INSERT INTO "role_permissions" VALUES(29,145);
INSERT INTO "role_permissions" VALUES(29,146);
INSERT INTO "role_permissions" VALUES(29,147);
INSERT INTO "role_permissions" VALUES(29,148);
INSERT INTO "role_permissions" VALUES(29,149);
INSERT INTO "role_permissions" VALUES(29,150);
INSERT INTO "role_permissions" VALUES(29,151);
INSERT INTO "role_permissions" VALUES(29,152);
INSERT INTO "role_permissions" VALUES(29,153);
INSERT INTO "role_permissions" VALUES(29,154);
INSERT INTO "role_permissions" VALUES(29,155);
INSERT INTO "role_permissions" VALUES(29,156);
INSERT INTO "role_permissions" VALUES(29,157);
INSERT INTO "role_permissions" VALUES(29,158);
INSERT INTO "role_permissions" VALUES(29,159);
INSERT INTO "role_permissions" VALUES(29,160);
INSERT INTO "role_permissions" VALUES(29,161);
INSERT INTO "role_permissions" VALUES(29,162);
INSERT INTO "role_permissions" VALUES(29,163);
INSERT INTO "role_permissions" VALUES(29,164);
INSERT INTO "role_permissions" VALUES(29,165);
INSERT INTO "role_permissions" VALUES(29,166);
INSERT INTO "role_permissions" VALUES(29,167);
INSERT INTO "role_permissions" VALUES(29,168);
INSERT INTO "role_permissions" VALUES(29,169);
INSERT INTO "role_permissions" VALUES(29,170);
INSERT INTO "role_permissions" VALUES(29,171);
INSERT INTO "role_permissions" VALUES(29,172);
INSERT INTO "role_permissions" VALUES(29,173);
INSERT INTO "role_permissions" VALUES(29,174);
INSERT INTO "role_permissions" VALUES(29,175);
INSERT INTO "role_permissions" VALUES(29,176);
INSERT INTO "role_permissions" VALUES(29,177);
INSERT INTO "role_permissions" VALUES(29,178);
INSERT INTO "role_permissions" VALUES(29,179);
INSERT INTO "role_permissions" VALUES(29,180);
INSERT INTO "role_permissions" VALUES(29,181);
INSERT INTO "role_permissions" VALUES(29,182);
INSERT INTO "role_permissions" VALUES(29,183);
INSERT INTO "role_permissions" VALUES(29,184);
INSERT INTO "role_permissions" VALUES(29,185);
INSERT INTO "role_permissions" VALUES(29,186);
INSERT INTO "role_permissions" VALUES(29,187);
INSERT INTO "role_permissions" VALUES(29,188);
INSERT INTO "role_permissions" VALUES(29,189);
INSERT INTO "role_permissions" VALUES(29,190);
INSERT INTO "role_permissions" VALUES(29,191);
INSERT INTO "role_permissions" VALUES(29,192);
INSERT INTO "role_permissions" VALUES(29,193);
INSERT INTO "role_permissions" VALUES(29,194);
INSERT INTO "role_permissions" VALUES(29,195);
INSERT INTO "role_permissions" VALUES(29,196);
INSERT INTO "role_permissions" VALUES(29,197);
INSERT INTO "role_permissions" VALUES(29,198);
INSERT INTO "role_permissions" VALUES(29,199);
INSERT INTO "role_permissions" VALUES(29,200);
INSERT INTO "role_permissions" VALUES(29,201);
INSERT INTO "role_permissions" VALUES(29,202);
INSERT INTO "role_permissions" VALUES(29,203);
INSERT INTO "role_permissions" VALUES(29,204);
INSERT INTO "role_permissions" VALUES(29,205);
INSERT INTO "role_permissions" VALUES(29,206);
INSERT INTO "role_permissions" VALUES(29,207);
INSERT INTO "role_permissions" VALUES(29,208);
INSERT INTO "role_permissions" VALUES(29,209);
INSERT INTO "role_permissions" VALUES(29,210);
INSERT INTO "role_permissions" VALUES(29,211);
INSERT INTO "role_permissions" VALUES(29,212);
INSERT INTO "role_permissions" VALUES(29,213);
INSERT INTO "role_permissions" VALUES(29,214);
INSERT INTO "role_permissions" VALUES(29,215);
INSERT INTO "role_permissions" VALUES(29,216);
INSERT INTO "role_permissions" VALUES(29,217);
INSERT INTO "role_permissions" VALUES(29,218);
INSERT INTO "role_permissions" VALUES(29,219);
INSERT INTO "role_permissions" VALUES(29,220);
INSERT INTO "role_permissions" VALUES(29,221);
INSERT INTO "role_permissions" VALUES(29,222);
INSERT INTO "role_permissions" VALUES(29,223);
INSERT INTO "role_permissions" VALUES(29,224);
INSERT INTO "role_permissions" VALUES(29,225);
INSERT INTO "role_permissions" VALUES(29,226);
INSERT INTO "role_permissions" VALUES(29,227);
INSERT INTO "role_permissions" VALUES(29,228);
INSERT INTO "role_permissions" VALUES(29,229);
INSERT INTO "role_permissions" VALUES(29,230);
INSERT INTO "role_permissions" VALUES(29,231);
INSERT INTO "role_permissions" VALUES(29,232);
INSERT INTO "role_permissions" VALUES(29,233);
INSERT INTO "role_permissions" VALUES(29,234);
INSERT INTO "role_permissions" VALUES(29,235);
INSERT INTO "role_permissions" VALUES(29,236);
INSERT INTO "role_permissions" VALUES(29,237);
INSERT INTO "role_permissions" VALUES(29,238);
INSERT INTO "role_permissions" VALUES(29,239);
INSERT INTO "role_permissions" VALUES(29,240);
INSERT INTO "role_permissions" VALUES(29,241);
INSERT INTO "role_permissions" VALUES(29,242);
INSERT INTO "role_permissions" VALUES(29,243);
INSERT INTO "role_permissions" VALUES(29,244);
INSERT INTO "role_permissions" VALUES(29,245);
INSERT INTO "role_permissions" VALUES(29,246);
INSERT INTO "role_permissions" VALUES(29,247);
INSERT INTO "role_permissions" VALUES(29,248);
INSERT INTO "role_permissions" VALUES(29,249);
INSERT INTO "role_permissions" VALUES(29,250);
INSERT INTO "role_permissions" VALUES(29,251);
INSERT INTO "role_permissions" VALUES(29,252);
INSERT INTO "role_permissions" VALUES(29,253);
INSERT INTO "role_permissions" VALUES(29,254);
INSERT INTO "role_permissions" VALUES(29,255);
INSERT INTO "role_permissions" VALUES(29,256);
INSERT INTO "role_permissions" VALUES(29,257);
INSERT INTO "role_permissions" VALUES(29,258);
INSERT INTO "role_permissions" VALUES(29,259);
INSERT INTO "role_permissions" VALUES(29,260);
INSERT INTO "role_permissions" VALUES(29,261);
INSERT INTO "role_permissions" VALUES(29,262);
INSERT INTO "role_permissions" VALUES(29,263);
INSERT INTO "role_permissions" VALUES(29,264);
INSERT INTO "role_permissions" VALUES(29,265);
INSERT INTO "role_permissions" VALUES(29,266);
INSERT INTO "role_permissions" VALUES(29,267);
INSERT INTO "role_permissions" VALUES(29,268);
INSERT INTO "role_permissions" VALUES(29,269);
INSERT INTO "role_permissions" VALUES(29,270);
INSERT INTO "role_permissions" VALUES(29,271);
INSERT INTO "role_permissions" VALUES(29,272);
INSERT INTO "role_permissions" VALUES(29,273);
INSERT INTO "role_permissions" VALUES(29,274);
INSERT INTO "role_permissions" VALUES(29,275);
INSERT INTO "role_permissions" VALUES(29,276);
INSERT INTO "role_permissions" VALUES(29,277);
INSERT INTO "role_permissions" VALUES(29,278);
INSERT INTO "role_permissions" VALUES(29,279);
INSERT INTO "role_permissions" VALUES(29,280);
INSERT INTO "role_permissions" VALUES(29,281);
INSERT INTO "role_permissions" VALUES(29,282);
INSERT INTO "role_permissions" VALUES(29,283);
INSERT INTO "role_permissions" VALUES(29,284);
INSERT INTO "role_permissions" VALUES(29,285);
INSERT INTO "role_permissions" VALUES(29,286);
INSERT INTO "role_permissions" VALUES(29,287);
INSERT INTO "role_permissions" VALUES(29,288);
INSERT INTO "role_permissions" VALUES(29,289);
INSERT INTO "role_permissions" VALUES(29,290);
INSERT INTO "role_permissions" VALUES(29,291);
INSERT INTO "role_permissions" VALUES(29,292);
INSERT INTO "role_permissions" VALUES(29,293);
INSERT INTO "role_permissions" VALUES(29,294);
INSERT INTO "role_permissions" VALUES(29,295);
INSERT INTO "role_permissions" VALUES(29,296);
INSERT INTO "role_permissions" VALUES(29,297);
INSERT INTO "role_permissions" VALUES(29,298);
INSERT INTO "role_permissions" VALUES(29,299);
INSERT INTO "role_permissions" VALUES(29,300);
INSERT INTO "role_permissions" VALUES(29,301);
INSERT INTO "role_permissions" VALUES(29,302);
INSERT INTO "role_permissions" VALUES(29,303);
INSERT INTO "role_permissions" VALUES(29,304);
INSERT INTO "role_permissions" VALUES(29,305);
INSERT INTO "role_permissions" VALUES(29,306);
INSERT INTO "role_permissions" VALUES(29,307);
INSERT INTO "role_permissions" VALUES(29,308);
INSERT INTO "role_permissions" VALUES(29,309);
INSERT INTO "role_permissions" VALUES(29,310);
INSERT INTO "role_permissions" VALUES(29,311);
INSERT INTO "role_permissions" VALUES(29,312);
INSERT INTO "role_permissions" VALUES(29,313);
INSERT INTO "role_permissions" VALUES(29,314);
INSERT INTO "role_permissions" VALUES(29,315);
INSERT INTO "role_permissions" VALUES(30,1);
INSERT INTO "role_permissions" VALUES(30,2);
INSERT INTO "role_permissions" VALUES(30,3);
INSERT INTO "role_permissions" VALUES(30,4);
INSERT INTO "role_permissions" VALUES(30,5);
INSERT INTO "role_permissions" VALUES(30,6);
INSERT INTO "role_permissions" VALUES(30,7);
INSERT INTO "role_permissions" VALUES(30,8);
INSERT INTO "role_permissions" VALUES(30,9);
INSERT INTO "role_permissions" VALUES(30,10);
INSERT INTO "role_permissions" VALUES(30,11);
INSERT INTO "role_permissions" VALUES(30,12);
INSERT INTO "role_permissions" VALUES(30,13);
INSERT INTO "role_permissions" VALUES(30,14);
INSERT INTO "role_permissions" VALUES(30,15);
INSERT INTO "role_permissions" VALUES(30,16);
INSERT INTO "role_permissions" VALUES(30,17);
INSERT INTO "role_permissions" VALUES(30,18);
INSERT INTO "role_permissions" VALUES(30,19);
INSERT INTO "role_permissions" VALUES(30,20);
INSERT INTO "role_permissions" VALUES(30,21);
INSERT INTO "role_permissions" VALUES(30,22);
INSERT INTO "role_permissions" VALUES(30,23);
INSERT INTO "role_permissions" VALUES(30,24);
INSERT INTO "role_permissions" VALUES(30,25);
INSERT INTO "role_permissions" VALUES(30,26);
INSERT INTO "role_permissions" VALUES(30,27);
INSERT INTO "role_permissions" VALUES(30,28);
INSERT INTO "role_permissions" VALUES(30,29);
INSERT INTO "role_permissions" VALUES(30,30);
INSERT INTO "role_permissions" VALUES(30,31);
INSERT INTO "role_permissions" VALUES(30,32);
INSERT INTO "role_permissions" VALUES(30,33);
INSERT INTO "role_permissions" VALUES(30,34);
INSERT INTO "role_permissions" VALUES(30,35);
INSERT INTO "role_permissions" VALUES(30,36);
INSERT INTO "role_permissions" VALUES(30,37);
INSERT INTO "role_permissions" VALUES(30,38);
INSERT INTO "role_permissions" VALUES(30,39);
INSERT INTO "role_permissions" VALUES(30,40);
INSERT INTO "role_permissions" VALUES(30,41);
INSERT INTO "role_permissions" VALUES(30,42);
INSERT INTO "role_permissions" VALUES(30,43);
INSERT INTO "role_permissions" VALUES(30,44);
INSERT INTO "role_permissions" VALUES(30,45);
INSERT INTO "role_permissions" VALUES(30,46);
INSERT INTO "role_permissions" VALUES(30,47);
INSERT INTO "role_permissions" VALUES(30,48);
INSERT INTO "role_permissions" VALUES(30,49);
INSERT INTO "role_permissions" VALUES(30,50);
INSERT INTO "role_permissions" VALUES(30,51);
INSERT INTO "role_permissions" VALUES(30,52);
INSERT INTO "role_permissions" VALUES(30,53);
INSERT INTO "role_permissions" VALUES(30,54);
INSERT INTO "role_permissions" VALUES(30,55);
INSERT INTO "role_permissions" VALUES(30,56);
INSERT INTO "role_permissions" VALUES(30,57);
INSERT INTO "role_permissions" VALUES(30,58);
INSERT INTO "role_permissions" VALUES(30,59);
INSERT INTO "role_permissions" VALUES(30,60);
INSERT INTO "role_permissions" VALUES(30,61);
INSERT INTO "role_permissions" VALUES(30,62);
INSERT INTO "role_permissions" VALUES(30,63);
INSERT INTO "role_permissions" VALUES(30,64);
INSERT INTO "role_permissions" VALUES(30,65);
INSERT INTO "role_permissions" VALUES(30,66);
INSERT INTO "role_permissions" VALUES(30,67);
INSERT INTO "role_permissions" VALUES(30,68);
INSERT INTO "role_permissions" VALUES(30,69);
INSERT INTO "role_permissions" VALUES(30,70);
INSERT INTO "role_permissions" VALUES(30,71);
INSERT INTO "role_permissions" VALUES(30,72);
INSERT INTO "role_permissions" VALUES(30,73);
INSERT INTO "role_permissions" VALUES(30,74);
INSERT INTO "role_permissions" VALUES(30,75);
INSERT INTO "role_permissions" VALUES(30,76);
INSERT INTO "role_permissions" VALUES(30,77);
INSERT INTO "role_permissions" VALUES(30,78);
INSERT INTO "role_permissions" VALUES(30,79);
INSERT INTO "role_permissions" VALUES(30,80);
INSERT INTO "role_permissions" VALUES(30,81);
INSERT INTO "role_permissions" VALUES(30,82);
INSERT INTO "role_permissions" VALUES(30,83);
INSERT INTO "role_permissions" VALUES(30,84);
INSERT INTO "role_permissions" VALUES(30,85);
INSERT INTO "role_permissions" VALUES(30,86);
INSERT INTO "role_permissions" VALUES(30,87);
INSERT INTO "role_permissions" VALUES(30,88);
INSERT INTO "role_permissions" VALUES(30,89);
INSERT INTO "role_permissions" VALUES(30,90);
INSERT INTO "role_permissions" VALUES(30,91);
INSERT INTO "role_permissions" VALUES(30,92);
INSERT INTO "role_permissions" VALUES(30,93);
INSERT INTO "role_permissions" VALUES(30,94);
INSERT INTO "role_permissions" VALUES(30,95);
INSERT INTO "role_permissions" VALUES(30,96);
INSERT INTO "role_permissions" VALUES(30,97);
INSERT INTO "role_permissions" VALUES(30,98);
INSERT INTO "role_permissions" VALUES(30,99);
INSERT INTO "role_permissions" VALUES(30,100);
INSERT INTO "role_permissions" VALUES(30,101);
INSERT INTO "role_permissions" VALUES(30,102);
INSERT INTO "role_permissions" VALUES(30,103);
INSERT INTO "role_permissions" VALUES(30,104);
INSERT INTO "role_permissions" VALUES(30,105);
INSERT INTO "role_permissions" VALUES(30,106);
INSERT INTO "role_permissions" VALUES(30,107);
INSERT INTO "role_permissions" VALUES(30,108);
INSERT INTO "role_permissions" VALUES(30,109);
INSERT INTO "role_permissions" VALUES(30,110);
INSERT INTO "role_permissions" VALUES(30,111);
INSERT INTO "role_permissions" VALUES(30,112);
INSERT INTO "role_permissions" VALUES(30,113);
INSERT INTO "role_permissions" VALUES(30,114);
INSERT INTO "role_permissions" VALUES(30,115);
INSERT INTO "role_permissions" VALUES(30,116);
INSERT INTO "role_permissions" VALUES(30,117);
INSERT INTO "role_permissions" VALUES(30,118);
INSERT INTO "role_permissions" VALUES(30,119);
INSERT INTO "role_permissions" VALUES(30,120);
INSERT INTO "role_permissions" VALUES(30,121);
INSERT INTO "role_permissions" VALUES(30,122);
INSERT INTO "role_permissions" VALUES(30,123);
INSERT INTO "role_permissions" VALUES(30,124);
INSERT INTO "role_permissions" VALUES(30,125);
INSERT INTO "role_permissions" VALUES(30,126);
INSERT INTO "role_permissions" VALUES(30,127);
INSERT INTO "role_permissions" VALUES(30,128);
INSERT INTO "role_permissions" VALUES(30,129);
INSERT INTO "role_permissions" VALUES(30,130);
INSERT INTO "role_permissions" VALUES(30,131);
INSERT INTO "role_permissions" VALUES(30,132);
INSERT INTO "role_permissions" VALUES(30,133);
INSERT INTO "role_permissions" VALUES(30,134);
INSERT INTO "role_permissions" VALUES(30,135);
INSERT INTO "role_permissions" VALUES(30,136);
INSERT INTO "role_permissions" VALUES(30,137);
INSERT INTO "role_permissions" VALUES(30,138);
INSERT INTO "role_permissions" VALUES(30,139);
INSERT INTO "role_permissions" VALUES(30,140);
INSERT INTO "role_permissions" VALUES(30,141);
INSERT INTO "role_permissions" VALUES(30,142);
INSERT INTO "role_permissions" VALUES(30,143);
INSERT INTO "role_permissions" VALUES(30,144);
INSERT INTO "role_permissions" VALUES(30,145);
INSERT INTO "role_permissions" VALUES(30,146);
INSERT INTO "role_permissions" VALUES(30,147);
INSERT INTO "role_permissions" VALUES(30,148);
INSERT INTO "role_permissions" VALUES(30,149);
INSERT INTO "role_permissions" VALUES(30,150);
INSERT INTO "role_permissions" VALUES(30,151);
INSERT INTO "role_permissions" VALUES(30,152);
INSERT INTO "role_permissions" VALUES(30,153);
INSERT INTO "role_permissions" VALUES(30,154);
INSERT INTO "role_permissions" VALUES(30,155);
INSERT INTO "role_permissions" VALUES(30,156);
INSERT INTO "role_permissions" VALUES(30,157);
INSERT INTO "role_permissions" VALUES(30,158);
INSERT INTO "role_permissions" VALUES(30,159);
INSERT INTO "role_permissions" VALUES(30,160);
INSERT INTO "role_permissions" VALUES(30,161);
INSERT INTO "role_permissions" VALUES(30,162);
INSERT INTO "role_permissions" VALUES(30,163);
INSERT INTO "role_permissions" VALUES(30,164);
INSERT INTO "role_permissions" VALUES(30,165);
INSERT INTO "role_permissions" VALUES(30,166);
INSERT INTO "role_permissions" VALUES(30,167);
INSERT INTO "role_permissions" VALUES(30,168);
INSERT INTO "role_permissions" VALUES(30,169);
INSERT INTO "role_permissions" VALUES(30,170);
INSERT INTO "role_permissions" VALUES(30,171);
INSERT INTO "role_permissions" VALUES(30,172);
INSERT INTO "role_permissions" VALUES(30,173);
INSERT INTO "role_permissions" VALUES(30,174);
INSERT INTO "role_permissions" VALUES(30,175);
INSERT INTO "role_permissions" VALUES(30,176);
INSERT INTO "role_permissions" VALUES(30,177);
INSERT INTO "role_permissions" VALUES(30,178);
INSERT INTO "role_permissions" VALUES(30,179);
INSERT INTO "role_permissions" VALUES(30,180);
INSERT INTO "role_permissions" VALUES(30,181);
INSERT INTO "role_permissions" VALUES(30,182);
INSERT INTO "role_permissions" VALUES(30,183);
INSERT INTO "role_permissions" VALUES(30,184);
INSERT INTO "role_permissions" VALUES(30,185);
INSERT INTO "role_permissions" VALUES(30,186);
INSERT INTO "role_permissions" VALUES(30,187);
INSERT INTO "role_permissions" VALUES(30,188);
INSERT INTO "role_permissions" VALUES(30,189);
INSERT INTO "role_permissions" VALUES(30,190);
INSERT INTO "role_permissions" VALUES(30,191);
INSERT INTO "role_permissions" VALUES(30,192);
INSERT INTO "role_permissions" VALUES(30,193);
INSERT INTO "role_permissions" VALUES(30,194);
INSERT INTO "role_permissions" VALUES(30,195);
INSERT INTO "role_permissions" VALUES(30,196);
INSERT INTO "role_permissions" VALUES(30,197);
INSERT INTO "role_permissions" VALUES(30,198);
INSERT INTO "role_permissions" VALUES(30,199);
INSERT INTO "role_permissions" VALUES(30,200);
INSERT INTO "role_permissions" VALUES(30,201);
INSERT INTO "role_permissions" VALUES(30,202);
INSERT INTO "role_permissions" VALUES(30,203);
INSERT INTO "role_permissions" VALUES(30,204);
INSERT INTO "role_permissions" VALUES(30,205);
INSERT INTO "role_permissions" VALUES(30,206);
INSERT INTO "role_permissions" VALUES(30,207);
INSERT INTO "role_permissions" VALUES(30,208);
INSERT INTO "role_permissions" VALUES(30,209);
INSERT INTO "role_permissions" VALUES(30,210);
INSERT INTO "role_permissions" VALUES(30,211);
INSERT INTO "role_permissions" VALUES(30,212);
INSERT INTO "role_permissions" VALUES(30,213);
INSERT INTO "role_permissions" VALUES(30,214);
INSERT INTO "role_permissions" VALUES(30,215);
INSERT INTO "role_permissions" VALUES(30,216);
INSERT INTO "role_permissions" VALUES(30,217);
INSERT INTO "role_permissions" VALUES(30,218);
INSERT INTO "role_permissions" VALUES(30,219);
INSERT INTO "role_permissions" VALUES(30,220);
INSERT INTO "role_permissions" VALUES(30,221);
INSERT INTO "role_permissions" VALUES(30,222);
INSERT INTO "role_permissions" VALUES(30,223);
INSERT INTO "role_permissions" VALUES(30,224);
INSERT INTO "role_permissions" VALUES(30,225);
INSERT INTO "role_permissions" VALUES(30,226);
INSERT INTO "role_permissions" VALUES(30,227);
INSERT INTO "role_permissions" VALUES(30,228);
INSERT INTO "role_permissions" VALUES(30,229);
INSERT INTO "role_permissions" VALUES(30,230);
INSERT INTO "role_permissions" VALUES(30,231);
INSERT INTO "role_permissions" VALUES(30,232);
INSERT INTO "role_permissions" VALUES(30,233);
INSERT INTO "role_permissions" VALUES(30,234);
INSERT INTO "role_permissions" VALUES(30,235);
INSERT INTO "role_permissions" VALUES(30,236);
INSERT INTO "role_permissions" VALUES(30,237);
INSERT INTO "role_permissions" VALUES(30,238);
INSERT INTO "role_permissions" VALUES(30,239);
INSERT INTO "role_permissions" VALUES(30,240);
INSERT INTO "role_permissions" VALUES(30,241);
INSERT INTO "role_permissions" VALUES(30,242);
INSERT INTO "role_permissions" VALUES(30,243);
INSERT INTO "role_permissions" VALUES(30,244);
INSERT INTO "role_permissions" VALUES(30,245);
INSERT INTO "role_permissions" VALUES(30,246);
INSERT INTO "role_permissions" VALUES(30,247);
INSERT INTO "role_permissions" VALUES(30,248);
INSERT INTO "role_permissions" VALUES(30,249);
INSERT INTO "role_permissions" VALUES(30,250);
INSERT INTO "role_permissions" VALUES(30,251);
INSERT INTO "role_permissions" VALUES(30,252);
INSERT INTO "role_permissions" VALUES(30,253);
INSERT INTO "role_permissions" VALUES(30,254);
INSERT INTO "role_permissions" VALUES(30,255);
INSERT INTO "role_permissions" VALUES(30,256);
INSERT INTO "role_permissions" VALUES(30,257);
INSERT INTO "role_permissions" VALUES(30,258);
INSERT INTO "role_permissions" VALUES(30,259);
INSERT INTO "role_permissions" VALUES(30,260);
INSERT INTO "role_permissions" VALUES(30,261);
INSERT INTO "role_permissions" VALUES(30,262);
INSERT INTO "role_permissions" VALUES(30,263);
INSERT INTO "role_permissions" VALUES(30,264);
INSERT INTO "role_permissions" VALUES(30,265);
INSERT INTO "role_permissions" VALUES(30,266);
INSERT INTO "role_permissions" VALUES(30,267);
INSERT INTO "role_permissions" VALUES(30,268);
INSERT INTO "role_permissions" VALUES(30,269);
INSERT INTO "role_permissions" VALUES(30,270);
INSERT INTO "role_permissions" VALUES(30,271);
INSERT INTO "role_permissions" VALUES(30,272);
INSERT INTO "role_permissions" VALUES(30,273);
INSERT INTO "role_permissions" VALUES(30,274);
INSERT INTO "role_permissions" VALUES(30,275);
INSERT INTO "role_permissions" VALUES(30,276);
INSERT INTO "role_permissions" VALUES(30,277);
INSERT INTO "role_permissions" VALUES(30,278);
INSERT INTO "role_permissions" VALUES(30,279);
INSERT INTO "role_permissions" VALUES(30,280);
INSERT INTO "role_permissions" VALUES(30,281);
INSERT INTO "role_permissions" VALUES(30,282);
INSERT INTO "role_permissions" VALUES(30,283);
INSERT INTO "role_permissions" VALUES(30,284);
INSERT INTO "role_permissions" VALUES(30,285);
INSERT INTO "role_permissions" VALUES(30,286);
INSERT INTO "role_permissions" VALUES(30,287);
INSERT INTO "role_permissions" VALUES(30,288);
INSERT INTO "role_permissions" VALUES(30,289);
INSERT INTO "role_permissions" VALUES(30,290);
INSERT INTO "role_permissions" VALUES(30,291);
INSERT INTO "role_permissions" VALUES(30,292);
INSERT INTO "role_permissions" VALUES(30,293);
INSERT INTO "role_permissions" VALUES(30,294);
INSERT INTO "role_permissions" VALUES(30,295);
INSERT INTO "role_permissions" VALUES(30,296);
INSERT INTO "role_permissions" VALUES(30,297);
INSERT INTO "role_permissions" VALUES(30,298);
INSERT INTO "role_permissions" VALUES(30,299);
INSERT INTO "role_permissions" VALUES(30,300);
INSERT INTO "role_permissions" VALUES(30,301);
INSERT INTO "role_permissions" VALUES(30,302);
INSERT INTO "role_permissions" VALUES(30,303);
INSERT INTO "role_permissions" VALUES(30,304);
INSERT INTO "role_permissions" VALUES(30,305);
INSERT INTO "role_permissions" VALUES(30,306);
INSERT INTO "role_permissions" VALUES(30,307);
INSERT INTO "role_permissions" VALUES(30,308);
INSERT INTO "role_permissions" VALUES(30,309);
INSERT INTO "role_permissions" VALUES(30,310);
INSERT INTO "role_permissions" VALUES(30,311);
INSERT INTO "role_permissions" VALUES(30,312);
INSERT INTO "role_permissions" VALUES(30,313);
INSERT INTO "role_permissions" VALUES(30,314);
INSERT INTO "role_permissions" VALUES(30,315);
INSERT INTO "role_permissions" VALUES(3,2);
INSERT INTO "role_permissions" VALUES(10,2);
INSERT INTO "role_permissions" VALUES(17,2);
INSERT INTO "role_permissions" VALUES(24,2);
INSERT INTO "role_permissions" VALUES(31,2);
INSERT INTO "role_permissions" VALUES(3,3);
INSERT INTO "role_permissions" VALUES(10,3);
INSERT INTO "role_permissions" VALUES(17,3);
INSERT INTO "role_permissions" VALUES(24,3);
INSERT INTO "role_permissions" VALUES(31,3);
INSERT INTO "role_permissions" VALUES(3,4);
INSERT INTO "role_permissions" VALUES(10,4);
INSERT INTO "role_permissions" VALUES(17,4);
INSERT INTO "role_permissions" VALUES(24,4);
INSERT INTO "role_permissions" VALUES(31,4);
INSERT INTO "role_permissions" VALUES(3,5);
INSERT INTO "role_permissions" VALUES(10,5);
INSERT INTO "role_permissions" VALUES(17,5);
INSERT INTO "role_permissions" VALUES(24,5);
INSERT INTO "role_permissions" VALUES(31,5);
INSERT INTO "role_permissions" VALUES(3,6);
INSERT INTO "role_permissions" VALUES(10,6);
INSERT INTO "role_permissions" VALUES(17,6);
INSERT INTO "role_permissions" VALUES(24,6);
INSERT INTO "role_permissions" VALUES(31,6);
INSERT INTO "role_permissions" VALUES(3,7);
INSERT INTO "role_permissions" VALUES(10,7);
INSERT INTO "role_permissions" VALUES(17,7);
INSERT INTO "role_permissions" VALUES(24,7);
INSERT INTO "role_permissions" VALUES(31,7);
INSERT INTO "role_permissions" VALUES(3,8);
INSERT INTO "role_permissions" VALUES(10,8);
INSERT INTO "role_permissions" VALUES(17,8);
INSERT INTO "role_permissions" VALUES(24,8);
INSERT INTO "role_permissions" VALUES(31,8);
INSERT INTO "role_permissions" VALUES(3,9);
INSERT INTO "role_permissions" VALUES(10,9);
INSERT INTO "role_permissions" VALUES(17,9);
INSERT INTO "role_permissions" VALUES(24,9);
INSERT INTO "role_permissions" VALUES(31,9);
INSERT INTO "role_permissions" VALUES(3,10);
INSERT INTO "role_permissions" VALUES(10,10);
INSERT INTO "role_permissions" VALUES(17,10);
INSERT INTO "role_permissions" VALUES(24,10);
INSERT INTO "role_permissions" VALUES(31,10);
INSERT INTO "role_permissions" VALUES(3,11);
INSERT INTO "role_permissions" VALUES(10,11);
INSERT INTO "role_permissions" VALUES(17,11);
INSERT INTO "role_permissions" VALUES(24,11);
INSERT INTO "role_permissions" VALUES(31,11);
INSERT INTO "role_permissions" VALUES(3,12);
INSERT INTO "role_permissions" VALUES(10,12);
INSERT INTO "role_permissions" VALUES(17,12);
INSERT INTO "role_permissions" VALUES(24,12);
INSERT INTO "role_permissions" VALUES(31,12);
INSERT INTO "role_permissions" VALUES(3,13);
INSERT INTO "role_permissions" VALUES(10,13);
INSERT INTO "role_permissions" VALUES(17,13);
INSERT INTO "role_permissions" VALUES(24,13);
INSERT INTO "role_permissions" VALUES(31,13);
INSERT INTO "role_permissions" VALUES(3,14);
INSERT INTO "role_permissions" VALUES(10,14);
INSERT INTO "role_permissions" VALUES(17,14);
INSERT INTO "role_permissions" VALUES(24,14);
INSERT INTO "role_permissions" VALUES(31,14);
INSERT INTO "role_permissions" VALUES(3,15);
INSERT INTO "role_permissions" VALUES(10,15);
INSERT INTO "role_permissions" VALUES(17,15);
INSERT INTO "role_permissions" VALUES(24,15);
INSERT INTO "role_permissions" VALUES(31,15);
INSERT INTO "role_permissions" VALUES(3,16);
INSERT INTO "role_permissions" VALUES(10,16);
INSERT INTO "role_permissions" VALUES(17,16);
INSERT INTO "role_permissions" VALUES(24,16);
INSERT INTO "role_permissions" VALUES(31,16);
INSERT INTO "role_permissions" VALUES(3,17);
INSERT INTO "role_permissions" VALUES(10,17);
INSERT INTO "role_permissions" VALUES(17,17);
INSERT INTO "role_permissions" VALUES(24,17);
INSERT INTO "role_permissions" VALUES(31,17);
INSERT INTO "role_permissions" VALUES(3,18);
INSERT INTO "role_permissions" VALUES(10,18);
INSERT INTO "role_permissions" VALUES(17,18);
INSERT INTO "role_permissions" VALUES(24,18);
INSERT INTO "role_permissions" VALUES(31,18);
INSERT INTO "role_permissions" VALUES(3,19);
INSERT INTO "role_permissions" VALUES(10,19);
INSERT INTO "role_permissions" VALUES(17,19);
INSERT INTO "role_permissions" VALUES(24,19);
INSERT INTO "role_permissions" VALUES(31,19);
INSERT INTO "role_permissions" VALUES(3,20);
INSERT INTO "role_permissions" VALUES(10,20);
INSERT INTO "role_permissions" VALUES(17,20);
INSERT INTO "role_permissions" VALUES(24,20);
INSERT INTO "role_permissions" VALUES(31,20);
INSERT INTO "role_permissions" VALUES(3,21);
INSERT INTO "role_permissions" VALUES(10,21);
INSERT INTO "role_permissions" VALUES(17,21);
INSERT INTO "role_permissions" VALUES(24,21);
INSERT INTO "role_permissions" VALUES(31,21);
INSERT INTO "role_permissions" VALUES(3,22);
INSERT INTO "role_permissions" VALUES(10,22);
INSERT INTO "role_permissions" VALUES(17,22);
INSERT INTO "role_permissions" VALUES(24,22);
INSERT INTO "role_permissions" VALUES(31,22);
INSERT INTO "role_permissions" VALUES(3,23);
INSERT INTO "role_permissions" VALUES(10,23);
INSERT INTO "role_permissions" VALUES(17,23);
INSERT INTO "role_permissions" VALUES(24,23);
INSERT INTO "role_permissions" VALUES(31,23);
INSERT INTO "role_permissions" VALUES(3,24);
INSERT INTO "role_permissions" VALUES(10,24);
INSERT INTO "role_permissions" VALUES(17,24);
INSERT INTO "role_permissions" VALUES(24,24);
INSERT INTO "role_permissions" VALUES(31,24);
INSERT INTO "role_permissions" VALUES(3,25);
INSERT INTO "role_permissions" VALUES(10,25);
INSERT INTO "role_permissions" VALUES(17,25);
INSERT INTO "role_permissions" VALUES(24,25);
INSERT INTO "role_permissions" VALUES(31,25);
INSERT INTO "role_permissions" VALUES(3,26);
INSERT INTO "role_permissions" VALUES(10,26);
INSERT INTO "role_permissions" VALUES(17,26);
INSERT INTO "role_permissions" VALUES(24,26);
INSERT INTO "role_permissions" VALUES(31,26);
INSERT INTO "role_permissions" VALUES(3,27);
INSERT INTO "role_permissions" VALUES(10,27);
INSERT INTO "role_permissions" VALUES(17,27);
INSERT INTO "role_permissions" VALUES(24,27);
INSERT INTO "role_permissions" VALUES(31,27);
INSERT INTO "role_permissions" VALUES(3,28);
INSERT INTO "role_permissions" VALUES(10,28);
INSERT INTO "role_permissions" VALUES(17,28);
INSERT INTO "role_permissions" VALUES(24,28);
INSERT INTO "role_permissions" VALUES(31,28);
INSERT INTO "role_permissions" VALUES(3,29);
INSERT INTO "role_permissions" VALUES(10,29);
INSERT INTO "role_permissions" VALUES(17,29);
INSERT INTO "role_permissions" VALUES(24,29);
INSERT INTO "role_permissions" VALUES(31,29);
INSERT INTO "role_permissions" VALUES(3,30);
INSERT INTO "role_permissions" VALUES(10,30);
INSERT INTO "role_permissions" VALUES(17,30);
INSERT INTO "role_permissions" VALUES(24,30);
INSERT INTO "role_permissions" VALUES(31,30);
INSERT INTO "role_permissions" VALUES(3,31);
INSERT INTO "role_permissions" VALUES(10,31);
INSERT INTO "role_permissions" VALUES(17,31);
INSERT INTO "role_permissions" VALUES(24,31);
INSERT INTO "role_permissions" VALUES(31,31);
INSERT INTO "role_permissions" VALUES(3,32);
INSERT INTO "role_permissions" VALUES(10,32);
INSERT INTO "role_permissions" VALUES(17,32);
INSERT INTO "role_permissions" VALUES(24,32);
INSERT INTO "role_permissions" VALUES(31,32);
INSERT INTO "role_permissions" VALUES(3,33);
INSERT INTO "role_permissions" VALUES(10,33);
INSERT INTO "role_permissions" VALUES(17,33);
INSERT INTO "role_permissions" VALUES(24,33);
INSERT INTO "role_permissions" VALUES(31,33);
INSERT INTO "role_permissions" VALUES(3,34);
INSERT INTO "role_permissions" VALUES(10,34);
INSERT INTO "role_permissions" VALUES(17,34);
INSERT INTO "role_permissions" VALUES(24,34);
INSERT INTO "role_permissions" VALUES(31,34);
INSERT INTO "role_permissions" VALUES(3,35);
INSERT INTO "role_permissions" VALUES(10,35);
INSERT INTO "role_permissions" VALUES(17,35);
INSERT INTO "role_permissions" VALUES(24,35);
INSERT INTO "role_permissions" VALUES(31,35);
INSERT INTO "role_permissions" VALUES(3,36);
INSERT INTO "role_permissions" VALUES(10,36);
INSERT INTO "role_permissions" VALUES(17,36);
INSERT INTO "role_permissions" VALUES(24,36);
INSERT INTO "role_permissions" VALUES(31,36);
INSERT INTO "role_permissions" VALUES(3,37);
INSERT INTO "role_permissions" VALUES(10,37);
INSERT INTO "role_permissions" VALUES(17,37);
INSERT INTO "role_permissions" VALUES(24,37);
INSERT INTO "role_permissions" VALUES(31,37);
INSERT INTO "role_permissions" VALUES(3,38);
INSERT INTO "role_permissions" VALUES(10,38);
INSERT INTO "role_permissions" VALUES(17,38);
INSERT INTO "role_permissions" VALUES(24,38);
INSERT INTO "role_permissions" VALUES(31,38);
INSERT INTO "role_permissions" VALUES(3,39);
INSERT INTO "role_permissions" VALUES(10,39);
INSERT INTO "role_permissions" VALUES(17,39);
INSERT INTO "role_permissions" VALUES(24,39);
INSERT INTO "role_permissions" VALUES(31,39);
INSERT INTO "role_permissions" VALUES(3,40);
INSERT INTO "role_permissions" VALUES(10,40);
INSERT INTO "role_permissions" VALUES(17,40);
INSERT INTO "role_permissions" VALUES(24,40);
INSERT INTO "role_permissions" VALUES(31,40);
INSERT INTO "role_permissions" VALUES(3,41);
INSERT INTO "role_permissions" VALUES(10,41);
INSERT INTO "role_permissions" VALUES(17,41);
INSERT INTO "role_permissions" VALUES(24,41);
INSERT INTO "role_permissions" VALUES(31,41);
INSERT INTO "role_permissions" VALUES(3,42);
INSERT INTO "role_permissions" VALUES(10,42);
INSERT INTO "role_permissions" VALUES(17,42);
INSERT INTO "role_permissions" VALUES(24,42);
INSERT INTO "role_permissions" VALUES(31,42);
INSERT INTO "role_permissions" VALUES(3,43);
INSERT INTO "role_permissions" VALUES(10,43);
INSERT INTO "role_permissions" VALUES(17,43);
INSERT INTO "role_permissions" VALUES(24,43);
INSERT INTO "role_permissions" VALUES(31,43);
INSERT INTO "role_permissions" VALUES(3,44);
INSERT INTO "role_permissions" VALUES(10,44);
INSERT INTO "role_permissions" VALUES(17,44);
INSERT INTO "role_permissions" VALUES(24,44);
INSERT INTO "role_permissions" VALUES(31,44);
INSERT INTO "role_permissions" VALUES(3,45);
INSERT INTO "role_permissions" VALUES(10,45);
INSERT INTO "role_permissions" VALUES(17,45);
INSERT INTO "role_permissions" VALUES(24,45);
INSERT INTO "role_permissions" VALUES(31,45);
INSERT INTO "role_permissions" VALUES(3,46);
INSERT INTO "role_permissions" VALUES(10,46);
INSERT INTO "role_permissions" VALUES(17,46);
INSERT INTO "role_permissions" VALUES(24,46);
INSERT INTO "role_permissions" VALUES(31,46);
INSERT INTO "role_permissions" VALUES(3,47);
INSERT INTO "role_permissions" VALUES(10,47);
INSERT INTO "role_permissions" VALUES(17,47);
INSERT INTO "role_permissions" VALUES(24,47);
INSERT INTO "role_permissions" VALUES(31,47);
INSERT INTO "role_permissions" VALUES(3,48);
INSERT INTO "role_permissions" VALUES(10,48);
INSERT INTO "role_permissions" VALUES(17,48);
INSERT INTO "role_permissions" VALUES(24,48);
INSERT INTO "role_permissions" VALUES(31,48);
INSERT INTO "role_permissions" VALUES(3,49);
INSERT INTO "role_permissions" VALUES(10,49);
INSERT INTO "role_permissions" VALUES(17,49);
INSERT INTO "role_permissions" VALUES(24,49);
INSERT INTO "role_permissions" VALUES(31,49);
INSERT INTO "role_permissions" VALUES(3,50);
INSERT INTO "role_permissions" VALUES(10,50);
INSERT INTO "role_permissions" VALUES(17,50);
INSERT INTO "role_permissions" VALUES(24,50);
INSERT INTO "role_permissions" VALUES(31,50);
INSERT INTO "role_permissions" VALUES(3,51);
INSERT INTO "role_permissions" VALUES(10,51);
INSERT INTO "role_permissions" VALUES(17,51);
INSERT INTO "role_permissions" VALUES(24,51);
INSERT INTO "role_permissions" VALUES(31,51);
INSERT INTO "role_permissions" VALUES(3,52);
INSERT INTO "role_permissions" VALUES(10,52);
INSERT INTO "role_permissions" VALUES(17,52);
INSERT INTO "role_permissions" VALUES(24,52);
INSERT INTO "role_permissions" VALUES(31,52);
INSERT INTO "role_permissions" VALUES(3,53);
INSERT INTO "role_permissions" VALUES(10,53);
INSERT INTO "role_permissions" VALUES(17,53);
INSERT INTO "role_permissions" VALUES(24,53);
INSERT INTO "role_permissions" VALUES(31,53);
INSERT INTO "role_permissions" VALUES(3,54);
INSERT INTO "role_permissions" VALUES(10,54);
INSERT INTO "role_permissions" VALUES(17,54);
INSERT INTO "role_permissions" VALUES(24,54);
INSERT INTO "role_permissions" VALUES(31,54);
INSERT INTO "role_permissions" VALUES(3,55);
INSERT INTO "role_permissions" VALUES(10,55);
INSERT INTO "role_permissions" VALUES(17,55);
INSERT INTO "role_permissions" VALUES(24,55);
INSERT INTO "role_permissions" VALUES(31,55);
INSERT INTO "role_permissions" VALUES(3,56);
INSERT INTO "role_permissions" VALUES(10,56);
INSERT INTO "role_permissions" VALUES(17,56);
INSERT INTO "role_permissions" VALUES(24,56);
INSERT INTO "role_permissions" VALUES(31,56);
INSERT INTO "role_permissions" VALUES(3,57);
INSERT INTO "role_permissions" VALUES(10,57);
INSERT INTO "role_permissions" VALUES(17,57);
INSERT INTO "role_permissions" VALUES(24,57);
INSERT INTO "role_permissions" VALUES(31,57);
INSERT INTO "role_permissions" VALUES(3,58);
INSERT INTO "role_permissions" VALUES(10,58);
INSERT INTO "role_permissions" VALUES(17,58);
INSERT INTO "role_permissions" VALUES(24,58);
INSERT INTO "role_permissions" VALUES(31,58);
INSERT INTO "role_permissions" VALUES(3,59);
INSERT INTO "role_permissions" VALUES(10,59);
INSERT INTO "role_permissions" VALUES(17,59);
INSERT INTO "role_permissions" VALUES(24,59);
INSERT INTO "role_permissions" VALUES(31,59);
INSERT INTO "role_permissions" VALUES(3,60);
INSERT INTO "role_permissions" VALUES(10,60);
INSERT INTO "role_permissions" VALUES(17,60);
INSERT INTO "role_permissions" VALUES(24,60);
INSERT INTO "role_permissions" VALUES(31,60);
INSERT INTO "role_permissions" VALUES(3,61);
INSERT INTO "role_permissions" VALUES(10,61);
INSERT INTO "role_permissions" VALUES(17,61);
INSERT INTO "role_permissions" VALUES(24,61);
INSERT INTO "role_permissions" VALUES(31,61);
INSERT INTO "role_permissions" VALUES(3,62);
INSERT INTO "role_permissions" VALUES(10,62);
INSERT INTO "role_permissions" VALUES(17,62);
INSERT INTO "role_permissions" VALUES(24,62);
INSERT INTO "role_permissions" VALUES(31,62);
INSERT INTO "role_permissions" VALUES(3,63);
INSERT INTO "role_permissions" VALUES(10,63);
INSERT INTO "role_permissions" VALUES(17,63);
INSERT INTO "role_permissions" VALUES(24,63);
INSERT INTO "role_permissions" VALUES(31,63);
INSERT INTO "role_permissions" VALUES(3,65);
INSERT INTO "role_permissions" VALUES(10,65);
INSERT INTO "role_permissions" VALUES(17,65);
INSERT INTO "role_permissions" VALUES(24,65);
INSERT INTO "role_permissions" VALUES(31,65);
INSERT INTO "role_permissions" VALUES(3,66);
INSERT INTO "role_permissions" VALUES(10,66);
INSERT INTO "role_permissions" VALUES(17,66);
INSERT INTO "role_permissions" VALUES(24,66);
INSERT INTO "role_permissions" VALUES(31,66);
INSERT INTO "role_permissions" VALUES(3,67);
INSERT INTO "role_permissions" VALUES(10,67);
INSERT INTO "role_permissions" VALUES(17,67);
INSERT INTO "role_permissions" VALUES(24,67);
INSERT INTO "role_permissions" VALUES(31,67);
INSERT INTO "role_permissions" VALUES(3,68);
INSERT INTO "role_permissions" VALUES(10,68);
INSERT INTO "role_permissions" VALUES(17,68);
INSERT INTO "role_permissions" VALUES(24,68);
INSERT INTO "role_permissions" VALUES(31,68);
INSERT INTO "role_permissions" VALUES(3,69);
INSERT INTO "role_permissions" VALUES(10,69);
INSERT INTO "role_permissions" VALUES(17,69);
INSERT INTO "role_permissions" VALUES(24,69);
INSERT INTO "role_permissions" VALUES(31,69);
INSERT INTO "role_permissions" VALUES(3,70);
INSERT INTO "role_permissions" VALUES(10,70);
INSERT INTO "role_permissions" VALUES(17,70);
INSERT INTO "role_permissions" VALUES(24,70);
INSERT INTO "role_permissions" VALUES(31,70);
INSERT INTO "role_permissions" VALUES(3,71);
INSERT INTO "role_permissions" VALUES(10,71);
INSERT INTO "role_permissions" VALUES(17,71);
INSERT INTO "role_permissions" VALUES(24,71);
INSERT INTO "role_permissions" VALUES(31,71);
INSERT INTO "role_permissions" VALUES(3,72);
INSERT INTO "role_permissions" VALUES(10,72);
INSERT INTO "role_permissions" VALUES(17,72);
INSERT INTO "role_permissions" VALUES(24,72);
INSERT INTO "role_permissions" VALUES(31,72);
INSERT INTO "role_permissions" VALUES(3,73);
INSERT INTO "role_permissions" VALUES(10,73);
INSERT INTO "role_permissions" VALUES(17,73);
INSERT INTO "role_permissions" VALUES(24,73);
INSERT INTO "role_permissions" VALUES(31,73);
INSERT INTO "role_permissions" VALUES(3,74);
INSERT INTO "role_permissions" VALUES(10,74);
INSERT INTO "role_permissions" VALUES(17,74);
INSERT INTO "role_permissions" VALUES(24,74);
INSERT INTO "role_permissions" VALUES(31,74);
INSERT INTO "role_permissions" VALUES(3,75);
INSERT INTO "role_permissions" VALUES(10,75);
INSERT INTO "role_permissions" VALUES(17,75);
INSERT INTO "role_permissions" VALUES(24,75);
INSERT INTO "role_permissions" VALUES(31,75);
INSERT INTO "role_permissions" VALUES(3,76);
INSERT INTO "role_permissions" VALUES(10,76);
INSERT INTO "role_permissions" VALUES(17,76);
INSERT INTO "role_permissions" VALUES(24,76);
INSERT INTO "role_permissions" VALUES(31,76);
INSERT INTO "role_permissions" VALUES(3,77);
INSERT INTO "role_permissions" VALUES(10,77);
INSERT INTO "role_permissions" VALUES(17,77);
INSERT INTO "role_permissions" VALUES(24,77);
INSERT INTO "role_permissions" VALUES(31,77);
INSERT INTO "role_permissions" VALUES(3,78);
INSERT INTO "role_permissions" VALUES(10,78);
INSERT INTO "role_permissions" VALUES(17,78);
INSERT INTO "role_permissions" VALUES(24,78);
INSERT INTO "role_permissions" VALUES(31,78);
INSERT INTO "role_permissions" VALUES(3,79);
INSERT INTO "role_permissions" VALUES(10,79);
INSERT INTO "role_permissions" VALUES(17,79);
INSERT INTO "role_permissions" VALUES(24,79);
INSERT INTO "role_permissions" VALUES(31,79);
INSERT INTO "role_permissions" VALUES(3,80);
INSERT INTO "role_permissions" VALUES(10,80);
INSERT INTO "role_permissions" VALUES(17,80);
INSERT INTO "role_permissions" VALUES(24,80);
INSERT INTO "role_permissions" VALUES(31,80);
INSERT INTO "role_permissions" VALUES(3,81);
INSERT INTO "role_permissions" VALUES(10,81);
INSERT INTO "role_permissions" VALUES(17,81);
INSERT INTO "role_permissions" VALUES(24,81);
INSERT INTO "role_permissions" VALUES(31,81);
INSERT INTO "role_permissions" VALUES(3,82);
INSERT INTO "role_permissions" VALUES(10,82);
INSERT INTO "role_permissions" VALUES(17,82);
INSERT INTO "role_permissions" VALUES(24,82);
INSERT INTO "role_permissions" VALUES(31,82);
INSERT INTO "role_permissions" VALUES(3,83);
INSERT INTO "role_permissions" VALUES(10,83);
INSERT INTO "role_permissions" VALUES(17,83);
INSERT INTO "role_permissions" VALUES(24,83);
INSERT INTO "role_permissions" VALUES(31,83);
INSERT INTO "role_permissions" VALUES(3,84);
INSERT INTO "role_permissions" VALUES(10,84);
INSERT INTO "role_permissions" VALUES(17,84);
INSERT INTO "role_permissions" VALUES(24,84);
INSERT INTO "role_permissions" VALUES(31,84);
INSERT INTO "role_permissions" VALUES(3,85);
INSERT INTO "role_permissions" VALUES(10,85);
INSERT INTO "role_permissions" VALUES(17,85);
INSERT INTO "role_permissions" VALUES(24,85);
INSERT INTO "role_permissions" VALUES(31,85);
INSERT INTO "role_permissions" VALUES(3,86);
INSERT INTO "role_permissions" VALUES(10,86);
INSERT INTO "role_permissions" VALUES(17,86);
INSERT INTO "role_permissions" VALUES(24,86);
INSERT INTO "role_permissions" VALUES(31,86);
INSERT INTO "role_permissions" VALUES(3,87);
INSERT INTO "role_permissions" VALUES(10,87);
INSERT INTO "role_permissions" VALUES(17,87);
INSERT INTO "role_permissions" VALUES(24,87);
INSERT INTO "role_permissions" VALUES(31,87);
INSERT INTO "role_permissions" VALUES(3,88);
INSERT INTO "role_permissions" VALUES(10,88);
INSERT INTO "role_permissions" VALUES(17,88);
INSERT INTO "role_permissions" VALUES(24,88);
INSERT INTO "role_permissions" VALUES(31,88);
INSERT INTO "role_permissions" VALUES(3,89);
INSERT INTO "role_permissions" VALUES(10,89);
INSERT INTO "role_permissions" VALUES(17,89);
INSERT INTO "role_permissions" VALUES(24,89);
INSERT INTO "role_permissions" VALUES(31,89);
INSERT INTO "role_permissions" VALUES(3,90);
INSERT INTO "role_permissions" VALUES(10,90);
INSERT INTO "role_permissions" VALUES(17,90);
INSERT INTO "role_permissions" VALUES(24,90);
INSERT INTO "role_permissions" VALUES(31,90);
INSERT INTO "role_permissions" VALUES(3,91);
INSERT INTO "role_permissions" VALUES(10,91);
INSERT INTO "role_permissions" VALUES(17,91);
INSERT INTO "role_permissions" VALUES(24,91);
INSERT INTO "role_permissions" VALUES(31,91);
INSERT INTO "role_permissions" VALUES(3,92);
INSERT INTO "role_permissions" VALUES(10,92);
INSERT INTO "role_permissions" VALUES(17,92);
INSERT INTO "role_permissions" VALUES(24,92);
INSERT INTO "role_permissions" VALUES(31,92);
INSERT INTO "role_permissions" VALUES(3,93);
INSERT INTO "role_permissions" VALUES(10,93);
INSERT INTO "role_permissions" VALUES(17,93);
INSERT INTO "role_permissions" VALUES(24,93);
INSERT INTO "role_permissions" VALUES(31,93);
INSERT INTO "role_permissions" VALUES(3,94);
INSERT INTO "role_permissions" VALUES(10,94);
INSERT INTO "role_permissions" VALUES(17,94);
INSERT INTO "role_permissions" VALUES(24,94);
INSERT INTO "role_permissions" VALUES(31,94);
INSERT INTO "role_permissions" VALUES(3,95);
INSERT INTO "role_permissions" VALUES(10,95);
INSERT INTO "role_permissions" VALUES(17,95);
INSERT INTO "role_permissions" VALUES(24,95);
INSERT INTO "role_permissions" VALUES(31,95);
INSERT INTO "role_permissions" VALUES(3,96);
INSERT INTO "role_permissions" VALUES(10,96);
INSERT INTO "role_permissions" VALUES(17,96);
INSERT INTO "role_permissions" VALUES(24,96);
INSERT INTO "role_permissions" VALUES(31,96);
INSERT INTO "role_permissions" VALUES(3,97);
INSERT INTO "role_permissions" VALUES(10,97);
INSERT INTO "role_permissions" VALUES(17,97);
INSERT INTO "role_permissions" VALUES(24,97);
INSERT INTO "role_permissions" VALUES(31,97);
INSERT INTO "role_permissions" VALUES(3,98);
INSERT INTO "role_permissions" VALUES(10,98);
INSERT INTO "role_permissions" VALUES(17,98);
INSERT INTO "role_permissions" VALUES(24,98);
INSERT INTO "role_permissions" VALUES(31,98);
INSERT INTO "role_permissions" VALUES(3,99);
INSERT INTO "role_permissions" VALUES(10,99);
INSERT INTO "role_permissions" VALUES(17,99);
INSERT INTO "role_permissions" VALUES(24,99);
INSERT INTO "role_permissions" VALUES(31,99);
INSERT INTO "role_permissions" VALUES(3,100);
INSERT INTO "role_permissions" VALUES(10,100);
INSERT INTO "role_permissions" VALUES(17,100);
INSERT INTO "role_permissions" VALUES(24,100);
INSERT INTO "role_permissions" VALUES(31,100);
INSERT INTO "role_permissions" VALUES(3,101);
INSERT INTO "role_permissions" VALUES(10,101);
INSERT INTO "role_permissions" VALUES(17,101);
INSERT INTO "role_permissions" VALUES(24,101);
INSERT INTO "role_permissions" VALUES(31,101);
INSERT INTO "role_permissions" VALUES(3,102);
INSERT INTO "role_permissions" VALUES(10,102);
INSERT INTO "role_permissions" VALUES(17,102);
INSERT INTO "role_permissions" VALUES(24,102);
INSERT INTO "role_permissions" VALUES(31,102);
INSERT INTO "role_permissions" VALUES(3,103);
INSERT INTO "role_permissions" VALUES(10,103);
INSERT INTO "role_permissions" VALUES(17,103);
INSERT INTO "role_permissions" VALUES(24,103);
INSERT INTO "role_permissions" VALUES(31,103);
INSERT INTO "role_permissions" VALUES(3,104);
INSERT INTO "role_permissions" VALUES(10,104);
INSERT INTO "role_permissions" VALUES(17,104);
INSERT INTO "role_permissions" VALUES(24,104);
INSERT INTO "role_permissions" VALUES(31,104);
INSERT INTO "role_permissions" VALUES(3,105);
INSERT INTO "role_permissions" VALUES(10,105);
INSERT INTO "role_permissions" VALUES(17,105);
INSERT INTO "role_permissions" VALUES(24,105);
INSERT INTO "role_permissions" VALUES(31,105);
INSERT INTO "role_permissions" VALUES(3,106);
INSERT INTO "role_permissions" VALUES(10,106);
INSERT INTO "role_permissions" VALUES(17,106);
INSERT INTO "role_permissions" VALUES(24,106);
INSERT INTO "role_permissions" VALUES(31,106);
INSERT INTO "role_permissions" VALUES(3,107);
INSERT INTO "role_permissions" VALUES(10,107);
INSERT INTO "role_permissions" VALUES(17,107);
INSERT INTO "role_permissions" VALUES(24,107);
INSERT INTO "role_permissions" VALUES(31,107);
INSERT INTO "role_permissions" VALUES(3,108);
INSERT INTO "role_permissions" VALUES(10,108);
INSERT INTO "role_permissions" VALUES(17,108);
INSERT INTO "role_permissions" VALUES(24,108);
INSERT INTO "role_permissions" VALUES(31,108);
INSERT INTO "role_permissions" VALUES(3,109);
INSERT INTO "role_permissions" VALUES(10,109);
INSERT INTO "role_permissions" VALUES(17,109);
INSERT INTO "role_permissions" VALUES(24,109);
INSERT INTO "role_permissions" VALUES(31,109);
INSERT INTO "role_permissions" VALUES(3,110);
INSERT INTO "role_permissions" VALUES(10,110);
INSERT INTO "role_permissions" VALUES(17,110);
INSERT INTO "role_permissions" VALUES(24,110);
INSERT INTO "role_permissions" VALUES(31,110);
INSERT INTO "role_permissions" VALUES(3,111);
INSERT INTO "role_permissions" VALUES(10,111);
INSERT INTO "role_permissions" VALUES(17,111);
INSERT INTO "role_permissions" VALUES(24,111);
INSERT INTO "role_permissions" VALUES(31,111);
INSERT INTO "role_permissions" VALUES(3,112);
INSERT INTO "role_permissions" VALUES(10,112);
INSERT INTO "role_permissions" VALUES(17,112);
INSERT INTO "role_permissions" VALUES(24,112);
INSERT INTO "role_permissions" VALUES(31,112);
INSERT INTO "role_permissions" VALUES(3,113);
INSERT INTO "role_permissions" VALUES(10,113);
INSERT INTO "role_permissions" VALUES(17,113);
INSERT INTO "role_permissions" VALUES(24,113);
INSERT INTO "role_permissions" VALUES(31,113);
INSERT INTO "role_permissions" VALUES(3,114);
INSERT INTO "role_permissions" VALUES(10,114);
INSERT INTO "role_permissions" VALUES(17,114);
INSERT INTO "role_permissions" VALUES(24,114);
INSERT INTO "role_permissions" VALUES(31,114);
INSERT INTO "role_permissions" VALUES(3,115);
INSERT INTO "role_permissions" VALUES(10,115);
INSERT INTO "role_permissions" VALUES(17,115);
INSERT INTO "role_permissions" VALUES(24,115);
INSERT INTO "role_permissions" VALUES(31,115);
INSERT INTO "role_permissions" VALUES(3,116);
INSERT INTO "role_permissions" VALUES(10,116);
INSERT INTO "role_permissions" VALUES(17,116);
INSERT INTO "role_permissions" VALUES(24,116);
INSERT INTO "role_permissions" VALUES(31,116);
INSERT INTO "role_permissions" VALUES(3,117);
INSERT INTO "role_permissions" VALUES(10,117);
INSERT INTO "role_permissions" VALUES(17,117);
INSERT INTO "role_permissions" VALUES(24,117);
INSERT INTO "role_permissions" VALUES(31,117);
INSERT INTO "role_permissions" VALUES(3,118);
INSERT INTO "role_permissions" VALUES(10,118);
INSERT INTO "role_permissions" VALUES(17,118);
INSERT INTO "role_permissions" VALUES(24,118);
INSERT INTO "role_permissions" VALUES(31,118);
INSERT INTO "role_permissions" VALUES(3,119);
INSERT INTO "role_permissions" VALUES(10,119);
INSERT INTO "role_permissions" VALUES(17,119);
INSERT INTO "role_permissions" VALUES(24,119);
INSERT INTO "role_permissions" VALUES(31,119);
INSERT INTO "role_permissions" VALUES(3,120);
INSERT INTO "role_permissions" VALUES(10,120);
INSERT INTO "role_permissions" VALUES(17,120);
INSERT INTO "role_permissions" VALUES(24,120);
INSERT INTO "role_permissions" VALUES(31,120);
INSERT INTO "role_permissions" VALUES(3,121);
INSERT INTO "role_permissions" VALUES(10,121);
INSERT INTO "role_permissions" VALUES(17,121);
INSERT INTO "role_permissions" VALUES(24,121);
INSERT INTO "role_permissions" VALUES(31,121);
INSERT INTO "role_permissions" VALUES(3,122);
INSERT INTO "role_permissions" VALUES(10,122);
INSERT INTO "role_permissions" VALUES(17,122);
INSERT INTO "role_permissions" VALUES(24,122);
INSERT INTO "role_permissions" VALUES(31,122);
INSERT INTO "role_permissions" VALUES(3,123);
INSERT INTO "role_permissions" VALUES(10,123);
INSERT INTO "role_permissions" VALUES(17,123);
INSERT INTO "role_permissions" VALUES(24,123);
INSERT INTO "role_permissions" VALUES(31,123);
INSERT INTO "role_permissions" VALUES(3,124);
INSERT INTO "role_permissions" VALUES(10,124);
INSERT INTO "role_permissions" VALUES(17,124);
INSERT INTO "role_permissions" VALUES(24,124);
INSERT INTO "role_permissions" VALUES(31,124);
INSERT INTO "role_permissions" VALUES(3,125);
INSERT INTO "role_permissions" VALUES(10,125);
INSERT INTO "role_permissions" VALUES(17,125);
INSERT INTO "role_permissions" VALUES(24,125);
INSERT INTO "role_permissions" VALUES(31,125);
INSERT INTO "role_permissions" VALUES(3,126);
INSERT INTO "role_permissions" VALUES(10,126);
INSERT INTO "role_permissions" VALUES(17,126);
INSERT INTO "role_permissions" VALUES(24,126);
INSERT INTO "role_permissions" VALUES(31,126);
INSERT INTO "role_permissions" VALUES(3,128);
INSERT INTO "role_permissions" VALUES(10,128);
INSERT INTO "role_permissions" VALUES(17,128);
INSERT INTO "role_permissions" VALUES(24,128);
INSERT INTO "role_permissions" VALUES(31,128);
INSERT INTO "role_permissions" VALUES(3,129);
INSERT INTO "role_permissions" VALUES(10,129);
INSERT INTO "role_permissions" VALUES(17,129);
INSERT INTO "role_permissions" VALUES(24,129);
INSERT INTO "role_permissions" VALUES(31,129);
INSERT INTO "role_permissions" VALUES(3,130);
INSERT INTO "role_permissions" VALUES(10,130);
INSERT INTO "role_permissions" VALUES(17,130);
INSERT INTO "role_permissions" VALUES(24,130);
INSERT INTO "role_permissions" VALUES(31,130);
INSERT INTO "role_permissions" VALUES(3,131);
INSERT INTO "role_permissions" VALUES(10,131);
INSERT INTO "role_permissions" VALUES(17,131);
INSERT INTO "role_permissions" VALUES(24,131);
INSERT INTO "role_permissions" VALUES(31,131);
INSERT INTO "role_permissions" VALUES(3,132);
INSERT INTO "role_permissions" VALUES(10,132);
INSERT INTO "role_permissions" VALUES(17,132);
INSERT INTO "role_permissions" VALUES(24,132);
INSERT INTO "role_permissions" VALUES(31,132);
INSERT INTO "role_permissions" VALUES(3,133);
INSERT INTO "role_permissions" VALUES(10,133);
INSERT INTO "role_permissions" VALUES(17,133);
INSERT INTO "role_permissions" VALUES(24,133);
INSERT INTO "role_permissions" VALUES(31,133);
INSERT INTO "role_permissions" VALUES(3,134);
INSERT INTO "role_permissions" VALUES(10,134);
INSERT INTO "role_permissions" VALUES(17,134);
INSERT INTO "role_permissions" VALUES(24,134);
INSERT INTO "role_permissions" VALUES(31,134);
INSERT INTO "role_permissions" VALUES(3,135);
INSERT INTO "role_permissions" VALUES(10,135);
INSERT INTO "role_permissions" VALUES(17,135);
INSERT INTO "role_permissions" VALUES(24,135);
INSERT INTO "role_permissions" VALUES(31,135);
INSERT INTO "role_permissions" VALUES(3,136);
INSERT INTO "role_permissions" VALUES(10,136);
INSERT INTO "role_permissions" VALUES(17,136);
INSERT INTO "role_permissions" VALUES(24,136);
INSERT INTO "role_permissions" VALUES(31,136);
INSERT INTO "role_permissions" VALUES(3,137);
INSERT INTO "role_permissions" VALUES(10,137);
INSERT INTO "role_permissions" VALUES(17,137);
INSERT INTO "role_permissions" VALUES(24,137);
INSERT INTO "role_permissions" VALUES(31,137);
INSERT INTO "role_permissions" VALUES(3,138);
INSERT INTO "role_permissions" VALUES(10,138);
INSERT INTO "role_permissions" VALUES(17,138);
INSERT INTO "role_permissions" VALUES(24,138);
INSERT INTO "role_permissions" VALUES(31,138);
INSERT INTO "role_permissions" VALUES(3,139);
INSERT INTO "role_permissions" VALUES(10,139);
INSERT INTO "role_permissions" VALUES(17,139);
INSERT INTO "role_permissions" VALUES(24,139);
INSERT INTO "role_permissions" VALUES(31,139);
INSERT INTO "role_permissions" VALUES(3,140);
INSERT INTO "role_permissions" VALUES(10,140);
INSERT INTO "role_permissions" VALUES(17,140);
INSERT INTO "role_permissions" VALUES(24,140);
INSERT INTO "role_permissions" VALUES(31,140);
INSERT INTO "role_permissions" VALUES(3,141);
INSERT INTO "role_permissions" VALUES(10,141);
INSERT INTO "role_permissions" VALUES(17,141);
INSERT INTO "role_permissions" VALUES(24,141);
INSERT INTO "role_permissions" VALUES(31,141);
INSERT INTO "role_permissions" VALUES(3,142);
INSERT INTO "role_permissions" VALUES(10,142);
INSERT INTO "role_permissions" VALUES(17,142);
INSERT INTO "role_permissions" VALUES(24,142);
INSERT INTO "role_permissions" VALUES(31,142);
INSERT INTO "role_permissions" VALUES(3,143);
INSERT INTO "role_permissions" VALUES(10,143);
INSERT INTO "role_permissions" VALUES(17,143);
INSERT INTO "role_permissions" VALUES(24,143);
INSERT INTO "role_permissions" VALUES(31,143);
INSERT INTO "role_permissions" VALUES(3,144);
INSERT INTO "role_permissions" VALUES(10,144);
INSERT INTO "role_permissions" VALUES(17,144);
INSERT INTO "role_permissions" VALUES(24,144);
INSERT INTO "role_permissions" VALUES(31,144);
INSERT INTO "role_permissions" VALUES(3,145);
INSERT INTO "role_permissions" VALUES(10,145);
INSERT INTO "role_permissions" VALUES(17,145);
INSERT INTO "role_permissions" VALUES(24,145);
INSERT INTO "role_permissions" VALUES(31,145);
INSERT INTO "role_permissions" VALUES(3,146);
INSERT INTO "role_permissions" VALUES(10,146);
INSERT INTO "role_permissions" VALUES(17,146);
INSERT INTO "role_permissions" VALUES(24,146);
INSERT INTO "role_permissions" VALUES(31,146);
INSERT INTO "role_permissions" VALUES(3,147);
INSERT INTO "role_permissions" VALUES(10,147);
INSERT INTO "role_permissions" VALUES(17,147);
INSERT INTO "role_permissions" VALUES(24,147);
INSERT INTO "role_permissions" VALUES(31,147);
INSERT INTO "role_permissions" VALUES(3,148);
INSERT INTO "role_permissions" VALUES(10,148);
INSERT INTO "role_permissions" VALUES(17,148);
INSERT INTO "role_permissions" VALUES(24,148);
INSERT INTO "role_permissions" VALUES(31,148);
INSERT INTO "role_permissions" VALUES(3,149);
INSERT INTO "role_permissions" VALUES(10,149);
INSERT INTO "role_permissions" VALUES(17,149);
INSERT INTO "role_permissions" VALUES(24,149);
INSERT INTO "role_permissions" VALUES(31,149);
INSERT INTO "role_permissions" VALUES(3,150);
INSERT INTO "role_permissions" VALUES(10,150);
INSERT INTO "role_permissions" VALUES(17,150);
INSERT INTO "role_permissions" VALUES(24,150);
INSERT INTO "role_permissions" VALUES(31,150);
INSERT INTO "role_permissions" VALUES(3,151);
INSERT INTO "role_permissions" VALUES(10,151);
INSERT INTO "role_permissions" VALUES(17,151);
INSERT INTO "role_permissions" VALUES(24,151);
INSERT INTO "role_permissions" VALUES(31,151);
INSERT INTO "role_permissions" VALUES(3,152);
INSERT INTO "role_permissions" VALUES(10,152);
INSERT INTO "role_permissions" VALUES(17,152);
INSERT INTO "role_permissions" VALUES(24,152);
INSERT INTO "role_permissions" VALUES(31,152);
INSERT INTO "role_permissions" VALUES(3,153);
INSERT INTO "role_permissions" VALUES(10,153);
INSERT INTO "role_permissions" VALUES(17,153);
INSERT INTO "role_permissions" VALUES(24,153);
INSERT INTO "role_permissions" VALUES(31,153);
INSERT INTO "role_permissions" VALUES(3,154);
INSERT INTO "role_permissions" VALUES(10,154);
INSERT INTO "role_permissions" VALUES(17,154);
INSERT INTO "role_permissions" VALUES(24,154);
INSERT INTO "role_permissions" VALUES(31,154);
INSERT INTO "role_permissions" VALUES(3,155);
INSERT INTO "role_permissions" VALUES(10,155);
INSERT INTO "role_permissions" VALUES(17,155);
INSERT INTO "role_permissions" VALUES(24,155);
INSERT INTO "role_permissions" VALUES(31,155);
INSERT INTO "role_permissions" VALUES(3,156);
INSERT INTO "role_permissions" VALUES(10,156);
INSERT INTO "role_permissions" VALUES(17,156);
INSERT INTO "role_permissions" VALUES(24,156);
INSERT INTO "role_permissions" VALUES(31,156);
INSERT INTO "role_permissions" VALUES(3,157);
INSERT INTO "role_permissions" VALUES(10,157);
INSERT INTO "role_permissions" VALUES(17,157);
INSERT INTO "role_permissions" VALUES(24,157);
INSERT INTO "role_permissions" VALUES(31,157);
INSERT INTO "role_permissions" VALUES(3,158);
INSERT INTO "role_permissions" VALUES(10,158);
INSERT INTO "role_permissions" VALUES(17,158);
INSERT INTO "role_permissions" VALUES(24,158);
INSERT INTO "role_permissions" VALUES(31,158);
INSERT INTO "role_permissions" VALUES(3,159);
INSERT INTO "role_permissions" VALUES(10,159);
INSERT INTO "role_permissions" VALUES(17,159);
INSERT INTO "role_permissions" VALUES(24,159);
INSERT INTO "role_permissions" VALUES(31,159);
INSERT INTO "role_permissions" VALUES(3,160);
INSERT INTO "role_permissions" VALUES(10,160);
INSERT INTO "role_permissions" VALUES(17,160);
INSERT INTO "role_permissions" VALUES(24,160);
INSERT INTO "role_permissions" VALUES(31,160);
INSERT INTO "role_permissions" VALUES(3,161);
INSERT INTO "role_permissions" VALUES(10,161);
INSERT INTO "role_permissions" VALUES(17,161);
INSERT INTO "role_permissions" VALUES(24,161);
INSERT INTO "role_permissions" VALUES(31,161);
INSERT INTO "role_permissions" VALUES(3,162);
INSERT INTO "role_permissions" VALUES(10,162);
INSERT INTO "role_permissions" VALUES(17,162);
INSERT INTO "role_permissions" VALUES(24,162);
INSERT INTO "role_permissions" VALUES(31,162);
INSERT INTO "role_permissions" VALUES(3,163);
INSERT INTO "role_permissions" VALUES(10,163);
INSERT INTO "role_permissions" VALUES(17,163);
INSERT INTO "role_permissions" VALUES(24,163);
INSERT INTO "role_permissions" VALUES(31,163);
INSERT INTO "role_permissions" VALUES(3,164);
INSERT INTO "role_permissions" VALUES(10,164);
INSERT INTO "role_permissions" VALUES(17,164);
INSERT INTO "role_permissions" VALUES(24,164);
INSERT INTO "role_permissions" VALUES(31,164);
INSERT INTO "role_permissions" VALUES(3,165);
INSERT INTO "role_permissions" VALUES(10,165);
INSERT INTO "role_permissions" VALUES(17,165);
INSERT INTO "role_permissions" VALUES(24,165);
INSERT INTO "role_permissions" VALUES(31,165);
INSERT INTO "role_permissions" VALUES(3,166);
INSERT INTO "role_permissions" VALUES(10,166);
INSERT INTO "role_permissions" VALUES(17,166);
INSERT INTO "role_permissions" VALUES(24,166);
INSERT INTO "role_permissions" VALUES(31,166);
INSERT INTO "role_permissions" VALUES(3,167);
INSERT INTO "role_permissions" VALUES(10,167);
INSERT INTO "role_permissions" VALUES(17,167);
INSERT INTO "role_permissions" VALUES(24,167);
INSERT INTO "role_permissions" VALUES(31,167);
INSERT INTO "role_permissions" VALUES(3,168);
INSERT INTO "role_permissions" VALUES(10,168);
INSERT INTO "role_permissions" VALUES(17,168);
INSERT INTO "role_permissions" VALUES(24,168);
INSERT INTO "role_permissions" VALUES(31,168);
INSERT INTO "role_permissions" VALUES(3,169);
INSERT INTO "role_permissions" VALUES(10,169);
INSERT INTO "role_permissions" VALUES(17,169);
INSERT INTO "role_permissions" VALUES(24,169);
INSERT INTO "role_permissions" VALUES(31,169);
INSERT INTO "role_permissions" VALUES(3,170);
INSERT INTO "role_permissions" VALUES(10,170);
INSERT INTO "role_permissions" VALUES(17,170);
INSERT INTO "role_permissions" VALUES(24,170);
INSERT INTO "role_permissions" VALUES(31,170);
INSERT INTO "role_permissions" VALUES(3,171);
INSERT INTO "role_permissions" VALUES(10,171);
INSERT INTO "role_permissions" VALUES(17,171);
INSERT INTO "role_permissions" VALUES(24,171);
INSERT INTO "role_permissions" VALUES(31,171);
INSERT INTO "role_permissions" VALUES(3,172);
INSERT INTO "role_permissions" VALUES(10,172);
INSERT INTO "role_permissions" VALUES(17,172);
INSERT INTO "role_permissions" VALUES(24,172);
INSERT INTO "role_permissions" VALUES(31,172);
INSERT INTO "role_permissions" VALUES(3,173);
INSERT INTO "role_permissions" VALUES(10,173);
INSERT INTO "role_permissions" VALUES(17,173);
INSERT INTO "role_permissions" VALUES(24,173);
INSERT INTO "role_permissions" VALUES(31,173);
INSERT INTO "role_permissions" VALUES(3,174);
INSERT INTO "role_permissions" VALUES(10,174);
INSERT INTO "role_permissions" VALUES(17,174);
INSERT INTO "role_permissions" VALUES(24,174);
INSERT INTO "role_permissions" VALUES(31,174);
INSERT INTO "role_permissions" VALUES(3,175);
INSERT INTO "role_permissions" VALUES(10,175);
INSERT INTO "role_permissions" VALUES(17,175);
INSERT INTO "role_permissions" VALUES(24,175);
INSERT INTO "role_permissions" VALUES(31,175);
INSERT INTO "role_permissions" VALUES(3,176);
INSERT INTO "role_permissions" VALUES(10,176);
INSERT INTO "role_permissions" VALUES(17,176);
INSERT INTO "role_permissions" VALUES(24,176);
INSERT INTO "role_permissions" VALUES(31,176);
INSERT INTO "role_permissions" VALUES(3,177);
INSERT INTO "role_permissions" VALUES(10,177);
INSERT INTO "role_permissions" VALUES(17,177);
INSERT INTO "role_permissions" VALUES(24,177);
INSERT INTO "role_permissions" VALUES(31,177);
INSERT INTO "role_permissions" VALUES(3,178);
INSERT INTO "role_permissions" VALUES(10,178);
INSERT INTO "role_permissions" VALUES(17,178);
INSERT INTO "role_permissions" VALUES(24,178);
INSERT INTO "role_permissions" VALUES(31,178);
INSERT INTO "role_permissions" VALUES(3,179);
INSERT INTO "role_permissions" VALUES(10,179);
INSERT INTO "role_permissions" VALUES(17,179);
INSERT INTO "role_permissions" VALUES(24,179);
INSERT INTO "role_permissions" VALUES(31,179);
INSERT INTO "role_permissions" VALUES(3,180);
INSERT INTO "role_permissions" VALUES(10,180);
INSERT INTO "role_permissions" VALUES(17,180);
INSERT INTO "role_permissions" VALUES(24,180);
INSERT INTO "role_permissions" VALUES(31,180);
INSERT INTO "role_permissions" VALUES(3,181);
INSERT INTO "role_permissions" VALUES(10,181);
INSERT INTO "role_permissions" VALUES(17,181);
INSERT INTO "role_permissions" VALUES(24,181);
INSERT INTO "role_permissions" VALUES(31,181);
INSERT INTO "role_permissions" VALUES(3,182);
INSERT INTO "role_permissions" VALUES(10,182);
INSERT INTO "role_permissions" VALUES(17,182);
INSERT INTO "role_permissions" VALUES(24,182);
INSERT INTO "role_permissions" VALUES(31,182);
INSERT INTO "role_permissions" VALUES(3,183);
INSERT INTO "role_permissions" VALUES(10,183);
INSERT INTO "role_permissions" VALUES(17,183);
INSERT INTO "role_permissions" VALUES(24,183);
INSERT INTO "role_permissions" VALUES(31,183);
INSERT INTO "role_permissions" VALUES(3,184);
INSERT INTO "role_permissions" VALUES(10,184);
INSERT INTO "role_permissions" VALUES(17,184);
INSERT INTO "role_permissions" VALUES(24,184);
INSERT INTO "role_permissions" VALUES(31,184);
INSERT INTO "role_permissions" VALUES(3,185);
INSERT INTO "role_permissions" VALUES(10,185);
INSERT INTO "role_permissions" VALUES(17,185);
INSERT INTO "role_permissions" VALUES(24,185);
INSERT INTO "role_permissions" VALUES(31,185);
INSERT INTO "role_permissions" VALUES(3,186);
INSERT INTO "role_permissions" VALUES(10,186);
INSERT INTO "role_permissions" VALUES(17,186);
INSERT INTO "role_permissions" VALUES(24,186);
INSERT INTO "role_permissions" VALUES(31,186);
INSERT INTO "role_permissions" VALUES(3,187);
INSERT INTO "role_permissions" VALUES(10,187);
INSERT INTO "role_permissions" VALUES(17,187);
INSERT INTO "role_permissions" VALUES(24,187);
INSERT INTO "role_permissions" VALUES(31,187);
INSERT INTO "role_permissions" VALUES(3,188);
INSERT INTO "role_permissions" VALUES(10,188);
INSERT INTO "role_permissions" VALUES(17,188);
INSERT INTO "role_permissions" VALUES(24,188);
INSERT INTO "role_permissions" VALUES(31,188);
INSERT INTO "role_permissions" VALUES(3,189);
INSERT INTO "role_permissions" VALUES(10,189);
INSERT INTO "role_permissions" VALUES(17,189);
INSERT INTO "role_permissions" VALUES(24,189);
INSERT INTO "role_permissions" VALUES(31,189);
INSERT INTO "role_permissions" VALUES(3,191);
INSERT INTO "role_permissions" VALUES(10,191);
INSERT INTO "role_permissions" VALUES(17,191);
INSERT INTO "role_permissions" VALUES(24,191);
INSERT INTO "role_permissions" VALUES(31,191);
INSERT INTO "role_permissions" VALUES(3,192);
INSERT INTO "role_permissions" VALUES(10,192);
INSERT INTO "role_permissions" VALUES(17,192);
INSERT INTO "role_permissions" VALUES(24,192);
INSERT INTO "role_permissions" VALUES(31,192);
INSERT INTO "role_permissions" VALUES(3,193);
INSERT INTO "role_permissions" VALUES(10,193);
INSERT INTO "role_permissions" VALUES(17,193);
INSERT INTO "role_permissions" VALUES(24,193);
INSERT INTO "role_permissions" VALUES(31,193);
INSERT INTO "role_permissions" VALUES(3,194);
INSERT INTO "role_permissions" VALUES(10,194);
INSERT INTO "role_permissions" VALUES(17,194);
INSERT INTO "role_permissions" VALUES(24,194);
INSERT INTO "role_permissions" VALUES(31,194);
INSERT INTO "role_permissions" VALUES(3,195);
INSERT INTO "role_permissions" VALUES(10,195);
INSERT INTO "role_permissions" VALUES(17,195);
INSERT INTO "role_permissions" VALUES(24,195);
INSERT INTO "role_permissions" VALUES(31,195);
INSERT INTO "role_permissions" VALUES(3,196);
INSERT INTO "role_permissions" VALUES(10,196);
INSERT INTO "role_permissions" VALUES(17,196);
INSERT INTO "role_permissions" VALUES(24,196);
INSERT INTO "role_permissions" VALUES(31,196);
INSERT INTO "role_permissions" VALUES(3,197);
INSERT INTO "role_permissions" VALUES(10,197);
INSERT INTO "role_permissions" VALUES(17,197);
INSERT INTO "role_permissions" VALUES(24,197);
INSERT INTO "role_permissions" VALUES(31,197);
INSERT INTO "role_permissions" VALUES(3,198);
INSERT INTO "role_permissions" VALUES(10,198);
INSERT INTO "role_permissions" VALUES(17,198);
INSERT INTO "role_permissions" VALUES(24,198);
INSERT INTO "role_permissions" VALUES(31,198);
INSERT INTO "role_permissions" VALUES(3,199);
INSERT INTO "role_permissions" VALUES(10,199);
INSERT INTO "role_permissions" VALUES(17,199);
INSERT INTO "role_permissions" VALUES(24,199);
INSERT INTO "role_permissions" VALUES(31,199);
INSERT INTO "role_permissions" VALUES(3,200);
INSERT INTO "role_permissions" VALUES(10,200);
INSERT INTO "role_permissions" VALUES(17,200);
INSERT INTO "role_permissions" VALUES(24,200);
INSERT INTO "role_permissions" VALUES(31,200);
INSERT INTO "role_permissions" VALUES(3,201);
INSERT INTO "role_permissions" VALUES(10,201);
INSERT INTO "role_permissions" VALUES(17,201);
INSERT INTO "role_permissions" VALUES(24,201);
INSERT INTO "role_permissions" VALUES(31,201);
INSERT INTO "role_permissions" VALUES(3,202);
INSERT INTO "role_permissions" VALUES(10,202);
INSERT INTO "role_permissions" VALUES(17,202);
INSERT INTO "role_permissions" VALUES(24,202);
INSERT INTO "role_permissions" VALUES(31,202);
INSERT INTO "role_permissions" VALUES(3,203);
INSERT INTO "role_permissions" VALUES(10,203);
INSERT INTO "role_permissions" VALUES(17,203);
INSERT INTO "role_permissions" VALUES(24,203);
INSERT INTO "role_permissions" VALUES(31,203);
INSERT INTO "role_permissions" VALUES(3,204);
INSERT INTO "role_permissions" VALUES(10,204);
INSERT INTO "role_permissions" VALUES(17,204);
INSERT INTO "role_permissions" VALUES(24,204);
INSERT INTO "role_permissions" VALUES(31,204);
INSERT INTO "role_permissions" VALUES(3,205);
INSERT INTO "role_permissions" VALUES(10,205);
INSERT INTO "role_permissions" VALUES(17,205);
INSERT INTO "role_permissions" VALUES(24,205);
INSERT INTO "role_permissions" VALUES(31,205);
INSERT INTO "role_permissions" VALUES(3,206);
INSERT INTO "role_permissions" VALUES(10,206);
INSERT INTO "role_permissions" VALUES(17,206);
INSERT INTO "role_permissions" VALUES(24,206);
INSERT INTO "role_permissions" VALUES(31,206);
INSERT INTO "role_permissions" VALUES(3,207);
INSERT INTO "role_permissions" VALUES(10,207);
INSERT INTO "role_permissions" VALUES(17,207);
INSERT INTO "role_permissions" VALUES(24,207);
INSERT INTO "role_permissions" VALUES(31,207);
INSERT INTO "role_permissions" VALUES(3,208);
INSERT INTO "role_permissions" VALUES(10,208);
INSERT INTO "role_permissions" VALUES(17,208);
INSERT INTO "role_permissions" VALUES(24,208);
INSERT INTO "role_permissions" VALUES(31,208);
INSERT INTO "role_permissions" VALUES(3,209);
INSERT INTO "role_permissions" VALUES(10,209);
INSERT INTO "role_permissions" VALUES(17,209);
INSERT INTO "role_permissions" VALUES(24,209);
INSERT INTO "role_permissions" VALUES(31,209);
INSERT INTO "role_permissions" VALUES(3,210);
INSERT INTO "role_permissions" VALUES(10,210);
INSERT INTO "role_permissions" VALUES(17,210);
INSERT INTO "role_permissions" VALUES(24,210);
INSERT INTO "role_permissions" VALUES(31,210);
INSERT INTO "role_permissions" VALUES(3,211);
INSERT INTO "role_permissions" VALUES(10,211);
INSERT INTO "role_permissions" VALUES(17,211);
INSERT INTO "role_permissions" VALUES(24,211);
INSERT INTO "role_permissions" VALUES(31,211);
INSERT INTO "role_permissions" VALUES(3,212);
INSERT INTO "role_permissions" VALUES(10,212);
INSERT INTO "role_permissions" VALUES(17,212);
INSERT INTO "role_permissions" VALUES(24,212);
INSERT INTO "role_permissions" VALUES(31,212);
INSERT INTO "role_permissions" VALUES(3,213);
INSERT INTO "role_permissions" VALUES(10,213);
INSERT INTO "role_permissions" VALUES(17,213);
INSERT INTO "role_permissions" VALUES(24,213);
INSERT INTO "role_permissions" VALUES(31,213);
INSERT INTO "role_permissions" VALUES(3,214);
INSERT INTO "role_permissions" VALUES(10,214);
INSERT INTO "role_permissions" VALUES(17,214);
INSERT INTO "role_permissions" VALUES(24,214);
INSERT INTO "role_permissions" VALUES(31,214);
INSERT INTO "role_permissions" VALUES(3,215);
INSERT INTO "role_permissions" VALUES(10,215);
INSERT INTO "role_permissions" VALUES(17,215);
INSERT INTO "role_permissions" VALUES(24,215);
INSERT INTO "role_permissions" VALUES(31,215);
INSERT INTO "role_permissions" VALUES(3,216);
INSERT INTO "role_permissions" VALUES(10,216);
INSERT INTO "role_permissions" VALUES(17,216);
INSERT INTO "role_permissions" VALUES(24,216);
INSERT INTO "role_permissions" VALUES(31,216);
INSERT INTO "role_permissions" VALUES(3,217);
INSERT INTO "role_permissions" VALUES(10,217);
INSERT INTO "role_permissions" VALUES(17,217);
INSERT INTO "role_permissions" VALUES(24,217);
INSERT INTO "role_permissions" VALUES(31,217);
INSERT INTO "role_permissions" VALUES(3,218);
INSERT INTO "role_permissions" VALUES(10,218);
INSERT INTO "role_permissions" VALUES(17,218);
INSERT INTO "role_permissions" VALUES(24,218);
INSERT INTO "role_permissions" VALUES(31,218);
INSERT INTO "role_permissions" VALUES(3,219);
INSERT INTO "role_permissions" VALUES(10,219);
INSERT INTO "role_permissions" VALUES(17,219);
INSERT INTO "role_permissions" VALUES(24,219);
INSERT INTO "role_permissions" VALUES(31,219);
INSERT INTO "role_permissions" VALUES(3,220);
INSERT INTO "role_permissions" VALUES(10,220);
INSERT INTO "role_permissions" VALUES(17,220);
INSERT INTO "role_permissions" VALUES(24,220);
INSERT INTO "role_permissions" VALUES(31,220);
INSERT INTO "role_permissions" VALUES(3,221);
INSERT INTO "role_permissions" VALUES(10,221);
INSERT INTO "role_permissions" VALUES(17,221);
INSERT INTO "role_permissions" VALUES(24,221);
INSERT INTO "role_permissions" VALUES(31,221);
INSERT INTO "role_permissions" VALUES(3,222);
INSERT INTO "role_permissions" VALUES(10,222);
INSERT INTO "role_permissions" VALUES(17,222);
INSERT INTO "role_permissions" VALUES(24,222);
INSERT INTO "role_permissions" VALUES(31,222);
INSERT INTO "role_permissions" VALUES(3,223);
INSERT INTO "role_permissions" VALUES(10,223);
INSERT INTO "role_permissions" VALUES(17,223);
INSERT INTO "role_permissions" VALUES(24,223);
INSERT INTO "role_permissions" VALUES(31,223);
INSERT INTO "role_permissions" VALUES(3,224);
INSERT INTO "role_permissions" VALUES(10,224);
INSERT INTO "role_permissions" VALUES(17,224);
INSERT INTO "role_permissions" VALUES(24,224);
INSERT INTO "role_permissions" VALUES(31,224);
INSERT INTO "role_permissions" VALUES(3,225);
INSERT INTO "role_permissions" VALUES(10,225);
INSERT INTO "role_permissions" VALUES(17,225);
INSERT INTO "role_permissions" VALUES(24,225);
INSERT INTO "role_permissions" VALUES(31,225);
INSERT INTO "role_permissions" VALUES(3,226);
INSERT INTO "role_permissions" VALUES(10,226);
INSERT INTO "role_permissions" VALUES(17,226);
INSERT INTO "role_permissions" VALUES(24,226);
INSERT INTO "role_permissions" VALUES(31,226);
INSERT INTO "role_permissions" VALUES(3,227);
INSERT INTO "role_permissions" VALUES(10,227);
INSERT INTO "role_permissions" VALUES(17,227);
INSERT INTO "role_permissions" VALUES(24,227);
INSERT INTO "role_permissions" VALUES(31,227);
INSERT INTO "role_permissions" VALUES(3,228);
INSERT INTO "role_permissions" VALUES(10,228);
INSERT INTO "role_permissions" VALUES(17,228);
INSERT INTO "role_permissions" VALUES(24,228);
INSERT INTO "role_permissions" VALUES(31,228);
INSERT INTO "role_permissions" VALUES(3,229);
INSERT INTO "role_permissions" VALUES(10,229);
INSERT INTO "role_permissions" VALUES(17,229);
INSERT INTO "role_permissions" VALUES(24,229);
INSERT INTO "role_permissions" VALUES(31,229);
INSERT INTO "role_permissions" VALUES(3,230);
INSERT INTO "role_permissions" VALUES(10,230);
INSERT INTO "role_permissions" VALUES(17,230);
INSERT INTO "role_permissions" VALUES(24,230);
INSERT INTO "role_permissions" VALUES(31,230);
INSERT INTO "role_permissions" VALUES(3,231);
INSERT INTO "role_permissions" VALUES(10,231);
INSERT INTO "role_permissions" VALUES(17,231);
INSERT INTO "role_permissions" VALUES(24,231);
INSERT INTO "role_permissions" VALUES(31,231);
INSERT INTO "role_permissions" VALUES(3,232);
INSERT INTO "role_permissions" VALUES(10,232);
INSERT INTO "role_permissions" VALUES(17,232);
INSERT INTO "role_permissions" VALUES(24,232);
INSERT INTO "role_permissions" VALUES(31,232);
INSERT INTO "role_permissions" VALUES(3,233);
INSERT INTO "role_permissions" VALUES(10,233);
INSERT INTO "role_permissions" VALUES(17,233);
INSERT INTO "role_permissions" VALUES(24,233);
INSERT INTO "role_permissions" VALUES(31,233);
INSERT INTO "role_permissions" VALUES(3,234);
INSERT INTO "role_permissions" VALUES(10,234);
INSERT INTO "role_permissions" VALUES(17,234);
INSERT INTO "role_permissions" VALUES(24,234);
INSERT INTO "role_permissions" VALUES(31,234);
INSERT INTO "role_permissions" VALUES(3,235);
INSERT INTO "role_permissions" VALUES(10,235);
INSERT INTO "role_permissions" VALUES(17,235);
INSERT INTO "role_permissions" VALUES(24,235);
INSERT INTO "role_permissions" VALUES(31,235);
INSERT INTO "role_permissions" VALUES(3,236);
INSERT INTO "role_permissions" VALUES(10,236);
INSERT INTO "role_permissions" VALUES(17,236);
INSERT INTO "role_permissions" VALUES(24,236);
INSERT INTO "role_permissions" VALUES(31,236);
INSERT INTO "role_permissions" VALUES(3,237);
INSERT INTO "role_permissions" VALUES(10,237);
INSERT INTO "role_permissions" VALUES(17,237);
INSERT INTO "role_permissions" VALUES(24,237);
INSERT INTO "role_permissions" VALUES(31,237);
INSERT INTO "role_permissions" VALUES(3,238);
INSERT INTO "role_permissions" VALUES(10,238);
INSERT INTO "role_permissions" VALUES(17,238);
INSERT INTO "role_permissions" VALUES(24,238);
INSERT INTO "role_permissions" VALUES(31,238);
INSERT INTO "role_permissions" VALUES(3,239);
INSERT INTO "role_permissions" VALUES(10,239);
INSERT INTO "role_permissions" VALUES(17,239);
INSERT INTO "role_permissions" VALUES(24,239);
INSERT INTO "role_permissions" VALUES(31,239);
INSERT INTO "role_permissions" VALUES(3,240);
INSERT INTO "role_permissions" VALUES(10,240);
INSERT INTO "role_permissions" VALUES(17,240);
INSERT INTO "role_permissions" VALUES(24,240);
INSERT INTO "role_permissions" VALUES(31,240);
INSERT INTO "role_permissions" VALUES(3,241);
INSERT INTO "role_permissions" VALUES(10,241);
INSERT INTO "role_permissions" VALUES(17,241);
INSERT INTO "role_permissions" VALUES(24,241);
INSERT INTO "role_permissions" VALUES(31,241);
INSERT INTO "role_permissions" VALUES(3,242);
INSERT INTO "role_permissions" VALUES(10,242);
INSERT INTO "role_permissions" VALUES(17,242);
INSERT INTO "role_permissions" VALUES(24,242);
INSERT INTO "role_permissions" VALUES(31,242);
INSERT INTO "role_permissions" VALUES(3,243);
INSERT INTO "role_permissions" VALUES(10,243);
INSERT INTO "role_permissions" VALUES(17,243);
INSERT INTO "role_permissions" VALUES(24,243);
INSERT INTO "role_permissions" VALUES(31,243);
INSERT INTO "role_permissions" VALUES(3,244);
INSERT INTO "role_permissions" VALUES(10,244);
INSERT INTO "role_permissions" VALUES(17,244);
INSERT INTO "role_permissions" VALUES(24,244);
INSERT INTO "role_permissions" VALUES(31,244);
INSERT INTO "role_permissions" VALUES(3,245);
INSERT INTO "role_permissions" VALUES(10,245);
INSERT INTO "role_permissions" VALUES(17,245);
INSERT INTO "role_permissions" VALUES(24,245);
INSERT INTO "role_permissions" VALUES(31,245);
INSERT INTO "role_permissions" VALUES(3,246);
INSERT INTO "role_permissions" VALUES(10,246);
INSERT INTO "role_permissions" VALUES(17,246);
INSERT INTO "role_permissions" VALUES(24,246);
INSERT INTO "role_permissions" VALUES(31,246);
INSERT INTO "role_permissions" VALUES(3,247);
INSERT INTO "role_permissions" VALUES(10,247);
INSERT INTO "role_permissions" VALUES(17,247);
INSERT INTO "role_permissions" VALUES(24,247);
INSERT INTO "role_permissions" VALUES(31,247);
INSERT INTO "role_permissions" VALUES(3,248);
INSERT INTO "role_permissions" VALUES(10,248);
INSERT INTO "role_permissions" VALUES(17,248);
INSERT INTO "role_permissions" VALUES(24,248);
INSERT INTO "role_permissions" VALUES(31,248);
INSERT INTO "role_permissions" VALUES(3,249);
INSERT INTO "role_permissions" VALUES(10,249);
INSERT INTO "role_permissions" VALUES(17,249);
INSERT INTO "role_permissions" VALUES(24,249);
INSERT INTO "role_permissions" VALUES(31,249);
INSERT INTO "role_permissions" VALUES(3,250);
INSERT INTO "role_permissions" VALUES(10,250);
INSERT INTO "role_permissions" VALUES(17,250);
INSERT INTO "role_permissions" VALUES(24,250);
INSERT INTO "role_permissions" VALUES(31,250);
INSERT INTO "role_permissions" VALUES(3,251);
INSERT INTO "role_permissions" VALUES(10,251);
INSERT INTO "role_permissions" VALUES(17,251);
INSERT INTO "role_permissions" VALUES(24,251);
INSERT INTO "role_permissions" VALUES(31,251);
INSERT INTO "role_permissions" VALUES(3,252);
INSERT INTO "role_permissions" VALUES(10,252);
INSERT INTO "role_permissions" VALUES(17,252);
INSERT INTO "role_permissions" VALUES(24,252);
INSERT INTO "role_permissions" VALUES(31,252);
INSERT INTO "role_permissions" VALUES(3,254);
INSERT INTO "role_permissions" VALUES(10,254);
INSERT INTO "role_permissions" VALUES(17,254);
INSERT INTO "role_permissions" VALUES(24,254);
INSERT INTO "role_permissions" VALUES(31,254);
INSERT INTO "role_permissions" VALUES(3,255);
INSERT INTO "role_permissions" VALUES(10,255);
INSERT INTO "role_permissions" VALUES(17,255);
INSERT INTO "role_permissions" VALUES(24,255);
INSERT INTO "role_permissions" VALUES(31,255);
INSERT INTO "role_permissions" VALUES(3,256);
INSERT INTO "role_permissions" VALUES(10,256);
INSERT INTO "role_permissions" VALUES(17,256);
INSERT INTO "role_permissions" VALUES(24,256);
INSERT INTO "role_permissions" VALUES(31,256);
INSERT INTO "role_permissions" VALUES(3,257);
INSERT INTO "role_permissions" VALUES(10,257);
INSERT INTO "role_permissions" VALUES(17,257);
INSERT INTO "role_permissions" VALUES(24,257);
INSERT INTO "role_permissions" VALUES(31,257);
INSERT INTO "role_permissions" VALUES(3,258);
INSERT INTO "role_permissions" VALUES(10,258);
INSERT INTO "role_permissions" VALUES(17,258);
INSERT INTO "role_permissions" VALUES(24,258);
INSERT INTO "role_permissions" VALUES(31,258);
INSERT INTO "role_permissions" VALUES(3,259);
INSERT INTO "role_permissions" VALUES(10,259);
INSERT INTO "role_permissions" VALUES(17,259);
INSERT INTO "role_permissions" VALUES(24,259);
INSERT INTO "role_permissions" VALUES(31,259);
INSERT INTO "role_permissions" VALUES(3,260);
INSERT INTO "role_permissions" VALUES(10,260);
INSERT INTO "role_permissions" VALUES(17,260);
INSERT INTO "role_permissions" VALUES(24,260);
INSERT INTO "role_permissions" VALUES(31,260);
INSERT INTO "role_permissions" VALUES(3,261);
INSERT INTO "role_permissions" VALUES(10,261);
INSERT INTO "role_permissions" VALUES(17,261);
INSERT INTO "role_permissions" VALUES(24,261);
INSERT INTO "role_permissions" VALUES(31,261);
INSERT INTO "role_permissions" VALUES(3,262);
INSERT INTO "role_permissions" VALUES(10,262);
INSERT INTO "role_permissions" VALUES(17,262);
INSERT INTO "role_permissions" VALUES(24,262);
INSERT INTO "role_permissions" VALUES(31,262);
INSERT INTO "role_permissions" VALUES(3,263);
INSERT INTO "role_permissions" VALUES(10,263);
INSERT INTO "role_permissions" VALUES(17,263);
INSERT INTO "role_permissions" VALUES(24,263);
INSERT INTO "role_permissions" VALUES(31,263);
INSERT INTO "role_permissions" VALUES(3,264);
INSERT INTO "role_permissions" VALUES(10,264);
INSERT INTO "role_permissions" VALUES(17,264);
INSERT INTO "role_permissions" VALUES(24,264);
INSERT INTO "role_permissions" VALUES(31,264);
INSERT INTO "role_permissions" VALUES(3,265);
INSERT INTO "role_permissions" VALUES(10,265);
INSERT INTO "role_permissions" VALUES(17,265);
INSERT INTO "role_permissions" VALUES(24,265);
INSERT INTO "role_permissions" VALUES(31,265);
INSERT INTO "role_permissions" VALUES(3,266);
INSERT INTO "role_permissions" VALUES(10,266);
INSERT INTO "role_permissions" VALUES(17,266);
INSERT INTO "role_permissions" VALUES(24,266);
INSERT INTO "role_permissions" VALUES(31,266);
INSERT INTO "role_permissions" VALUES(3,267);
INSERT INTO "role_permissions" VALUES(10,267);
INSERT INTO "role_permissions" VALUES(17,267);
INSERT INTO "role_permissions" VALUES(24,267);
INSERT INTO "role_permissions" VALUES(31,267);
INSERT INTO "role_permissions" VALUES(3,268);
INSERT INTO "role_permissions" VALUES(10,268);
INSERT INTO "role_permissions" VALUES(17,268);
INSERT INTO "role_permissions" VALUES(24,268);
INSERT INTO "role_permissions" VALUES(31,268);
INSERT INTO "role_permissions" VALUES(3,269);
INSERT INTO "role_permissions" VALUES(10,269);
INSERT INTO "role_permissions" VALUES(17,269);
INSERT INTO "role_permissions" VALUES(24,269);
INSERT INTO "role_permissions" VALUES(31,269);
INSERT INTO "role_permissions" VALUES(3,270);
INSERT INTO "role_permissions" VALUES(10,270);
INSERT INTO "role_permissions" VALUES(17,270);
INSERT INTO "role_permissions" VALUES(24,270);
INSERT INTO "role_permissions" VALUES(31,270);
INSERT INTO "role_permissions" VALUES(3,271);
INSERT INTO "role_permissions" VALUES(10,271);
INSERT INTO "role_permissions" VALUES(17,271);
INSERT INTO "role_permissions" VALUES(24,271);
INSERT INTO "role_permissions" VALUES(31,271);
INSERT INTO "role_permissions" VALUES(3,272);
INSERT INTO "role_permissions" VALUES(10,272);
INSERT INTO "role_permissions" VALUES(17,272);
INSERT INTO "role_permissions" VALUES(24,272);
INSERT INTO "role_permissions" VALUES(31,272);
INSERT INTO "role_permissions" VALUES(3,273);
INSERT INTO "role_permissions" VALUES(10,273);
INSERT INTO "role_permissions" VALUES(17,273);
INSERT INTO "role_permissions" VALUES(24,273);
INSERT INTO "role_permissions" VALUES(31,273);
INSERT INTO "role_permissions" VALUES(3,274);
INSERT INTO "role_permissions" VALUES(10,274);
INSERT INTO "role_permissions" VALUES(17,274);
INSERT INTO "role_permissions" VALUES(24,274);
INSERT INTO "role_permissions" VALUES(31,274);
INSERT INTO "role_permissions" VALUES(3,275);
INSERT INTO "role_permissions" VALUES(10,275);
INSERT INTO "role_permissions" VALUES(17,275);
INSERT INTO "role_permissions" VALUES(24,275);
INSERT INTO "role_permissions" VALUES(31,275);
INSERT INTO "role_permissions" VALUES(3,276);
INSERT INTO "role_permissions" VALUES(10,276);
INSERT INTO "role_permissions" VALUES(17,276);
INSERT INTO "role_permissions" VALUES(24,276);
INSERT INTO "role_permissions" VALUES(31,276);
INSERT INTO "role_permissions" VALUES(3,277);
INSERT INTO "role_permissions" VALUES(10,277);
INSERT INTO "role_permissions" VALUES(17,277);
INSERT INTO "role_permissions" VALUES(24,277);
INSERT INTO "role_permissions" VALUES(31,277);
INSERT INTO "role_permissions" VALUES(3,278);
INSERT INTO "role_permissions" VALUES(10,278);
INSERT INTO "role_permissions" VALUES(17,278);
INSERT INTO "role_permissions" VALUES(24,278);
INSERT INTO "role_permissions" VALUES(31,278);
INSERT INTO "role_permissions" VALUES(3,279);
INSERT INTO "role_permissions" VALUES(10,279);
INSERT INTO "role_permissions" VALUES(17,279);
INSERT INTO "role_permissions" VALUES(24,279);
INSERT INTO "role_permissions" VALUES(31,279);
INSERT INTO "role_permissions" VALUES(3,280);
INSERT INTO "role_permissions" VALUES(10,280);
INSERT INTO "role_permissions" VALUES(17,280);
INSERT INTO "role_permissions" VALUES(24,280);
INSERT INTO "role_permissions" VALUES(31,280);
INSERT INTO "role_permissions" VALUES(3,281);
INSERT INTO "role_permissions" VALUES(10,281);
INSERT INTO "role_permissions" VALUES(17,281);
INSERT INTO "role_permissions" VALUES(24,281);
INSERT INTO "role_permissions" VALUES(31,281);
INSERT INTO "role_permissions" VALUES(3,282);
INSERT INTO "role_permissions" VALUES(10,282);
INSERT INTO "role_permissions" VALUES(17,282);
INSERT INTO "role_permissions" VALUES(24,282);
INSERT INTO "role_permissions" VALUES(31,282);
INSERT INTO "role_permissions" VALUES(3,283);
INSERT INTO "role_permissions" VALUES(10,283);
INSERT INTO "role_permissions" VALUES(17,283);
INSERT INTO "role_permissions" VALUES(24,283);
INSERT INTO "role_permissions" VALUES(31,283);
INSERT INTO "role_permissions" VALUES(3,284);
INSERT INTO "role_permissions" VALUES(10,284);
INSERT INTO "role_permissions" VALUES(17,284);
INSERT INTO "role_permissions" VALUES(24,284);
INSERT INTO "role_permissions" VALUES(31,284);
INSERT INTO "role_permissions" VALUES(3,285);
INSERT INTO "role_permissions" VALUES(10,285);
INSERT INTO "role_permissions" VALUES(17,285);
INSERT INTO "role_permissions" VALUES(24,285);
INSERT INTO "role_permissions" VALUES(31,285);
INSERT INTO "role_permissions" VALUES(3,286);
INSERT INTO "role_permissions" VALUES(10,286);
INSERT INTO "role_permissions" VALUES(17,286);
INSERT INTO "role_permissions" VALUES(24,286);
INSERT INTO "role_permissions" VALUES(31,286);
INSERT INTO "role_permissions" VALUES(3,287);
INSERT INTO "role_permissions" VALUES(10,287);
INSERT INTO "role_permissions" VALUES(17,287);
INSERT INTO "role_permissions" VALUES(24,287);
INSERT INTO "role_permissions" VALUES(31,287);
INSERT INTO "role_permissions" VALUES(3,288);
INSERT INTO "role_permissions" VALUES(10,288);
INSERT INTO "role_permissions" VALUES(17,288);
INSERT INTO "role_permissions" VALUES(24,288);
INSERT INTO "role_permissions" VALUES(31,288);
INSERT INTO "role_permissions" VALUES(3,289);
INSERT INTO "role_permissions" VALUES(10,289);
INSERT INTO "role_permissions" VALUES(17,289);
INSERT INTO "role_permissions" VALUES(24,289);
INSERT INTO "role_permissions" VALUES(31,289);
INSERT INTO "role_permissions" VALUES(3,290);
INSERT INTO "role_permissions" VALUES(10,290);
INSERT INTO "role_permissions" VALUES(17,290);
INSERT INTO "role_permissions" VALUES(24,290);
INSERT INTO "role_permissions" VALUES(31,290);
INSERT INTO "role_permissions" VALUES(3,291);
INSERT INTO "role_permissions" VALUES(10,291);
INSERT INTO "role_permissions" VALUES(17,291);
INSERT INTO "role_permissions" VALUES(24,291);
INSERT INTO "role_permissions" VALUES(31,291);
INSERT INTO "role_permissions" VALUES(3,292);
INSERT INTO "role_permissions" VALUES(10,292);
INSERT INTO "role_permissions" VALUES(17,292);
INSERT INTO "role_permissions" VALUES(24,292);
INSERT INTO "role_permissions" VALUES(31,292);
INSERT INTO "role_permissions" VALUES(3,293);
INSERT INTO "role_permissions" VALUES(10,293);
INSERT INTO "role_permissions" VALUES(17,293);
INSERT INTO "role_permissions" VALUES(24,293);
INSERT INTO "role_permissions" VALUES(31,293);
INSERT INTO "role_permissions" VALUES(3,294);
INSERT INTO "role_permissions" VALUES(10,294);
INSERT INTO "role_permissions" VALUES(17,294);
INSERT INTO "role_permissions" VALUES(24,294);
INSERT INTO "role_permissions" VALUES(31,294);
INSERT INTO "role_permissions" VALUES(3,295);
INSERT INTO "role_permissions" VALUES(10,295);
INSERT INTO "role_permissions" VALUES(17,295);
INSERT INTO "role_permissions" VALUES(24,295);
INSERT INTO "role_permissions" VALUES(31,295);
INSERT INTO "role_permissions" VALUES(3,296);
INSERT INTO "role_permissions" VALUES(10,296);
INSERT INTO "role_permissions" VALUES(17,296);
INSERT INTO "role_permissions" VALUES(24,296);
INSERT INTO "role_permissions" VALUES(31,296);
INSERT INTO "role_permissions" VALUES(3,297);
INSERT INTO "role_permissions" VALUES(10,297);
INSERT INTO "role_permissions" VALUES(17,297);
INSERT INTO "role_permissions" VALUES(24,297);
INSERT INTO "role_permissions" VALUES(31,297);
INSERT INTO "role_permissions" VALUES(3,298);
INSERT INTO "role_permissions" VALUES(10,298);
INSERT INTO "role_permissions" VALUES(17,298);
INSERT INTO "role_permissions" VALUES(24,298);
INSERT INTO "role_permissions" VALUES(31,298);
INSERT INTO "role_permissions" VALUES(3,299);
INSERT INTO "role_permissions" VALUES(10,299);
INSERT INTO "role_permissions" VALUES(17,299);
INSERT INTO "role_permissions" VALUES(24,299);
INSERT INTO "role_permissions" VALUES(31,299);
INSERT INTO "role_permissions" VALUES(3,300);
INSERT INTO "role_permissions" VALUES(10,300);
INSERT INTO "role_permissions" VALUES(17,300);
INSERT INTO "role_permissions" VALUES(24,300);
INSERT INTO "role_permissions" VALUES(31,300);
INSERT INTO "role_permissions" VALUES(3,301);
INSERT INTO "role_permissions" VALUES(10,301);
INSERT INTO "role_permissions" VALUES(17,301);
INSERT INTO "role_permissions" VALUES(24,301);
INSERT INTO "role_permissions" VALUES(31,301);
INSERT INTO "role_permissions" VALUES(3,302);
INSERT INTO "role_permissions" VALUES(10,302);
INSERT INTO "role_permissions" VALUES(17,302);
INSERT INTO "role_permissions" VALUES(24,302);
INSERT INTO "role_permissions" VALUES(31,302);
INSERT INTO "role_permissions" VALUES(3,303);
INSERT INTO "role_permissions" VALUES(10,303);
INSERT INTO "role_permissions" VALUES(17,303);
INSERT INTO "role_permissions" VALUES(24,303);
INSERT INTO "role_permissions" VALUES(31,303);
INSERT INTO "role_permissions" VALUES(3,304);
INSERT INTO "role_permissions" VALUES(10,304);
INSERT INTO "role_permissions" VALUES(17,304);
INSERT INTO "role_permissions" VALUES(24,304);
INSERT INTO "role_permissions" VALUES(31,304);
INSERT INTO "role_permissions" VALUES(3,305);
INSERT INTO "role_permissions" VALUES(10,305);
INSERT INTO "role_permissions" VALUES(17,305);
INSERT INTO "role_permissions" VALUES(24,305);
INSERT INTO "role_permissions" VALUES(31,305);
INSERT INTO "role_permissions" VALUES(3,306);
INSERT INTO "role_permissions" VALUES(10,306);
INSERT INTO "role_permissions" VALUES(17,306);
INSERT INTO "role_permissions" VALUES(24,306);
INSERT INTO "role_permissions" VALUES(31,306);
INSERT INTO "role_permissions" VALUES(3,307);
INSERT INTO "role_permissions" VALUES(10,307);
INSERT INTO "role_permissions" VALUES(17,307);
INSERT INTO "role_permissions" VALUES(24,307);
INSERT INTO "role_permissions" VALUES(31,307);
INSERT INTO "role_permissions" VALUES(3,308);
INSERT INTO "role_permissions" VALUES(10,308);
INSERT INTO "role_permissions" VALUES(17,308);
INSERT INTO "role_permissions" VALUES(24,308);
INSERT INTO "role_permissions" VALUES(31,308);
INSERT INTO "role_permissions" VALUES(3,309);
INSERT INTO "role_permissions" VALUES(10,309);
INSERT INTO "role_permissions" VALUES(17,309);
INSERT INTO "role_permissions" VALUES(24,309);
INSERT INTO "role_permissions" VALUES(31,309);
INSERT INTO "role_permissions" VALUES(3,310);
INSERT INTO "role_permissions" VALUES(10,310);
INSERT INTO "role_permissions" VALUES(17,310);
INSERT INTO "role_permissions" VALUES(24,310);
INSERT INTO "role_permissions" VALUES(31,310);
INSERT INTO "role_permissions" VALUES(3,311);
INSERT INTO "role_permissions" VALUES(10,311);
INSERT INTO "role_permissions" VALUES(17,311);
INSERT INTO "role_permissions" VALUES(24,311);
INSERT INTO "role_permissions" VALUES(31,311);
INSERT INTO "role_permissions" VALUES(3,312);
INSERT INTO "role_permissions" VALUES(10,312);
INSERT INTO "role_permissions" VALUES(17,312);
INSERT INTO "role_permissions" VALUES(24,312);
INSERT INTO "role_permissions" VALUES(31,312);
INSERT INTO "role_permissions" VALUES(3,313);
INSERT INTO "role_permissions" VALUES(10,313);
INSERT INTO "role_permissions" VALUES(17,313);
INSERT INTO "role_permissions" VALUES(24,313);
INSERT INTO "role_permissions" VALUES(31,313);
INSERT INTO "role_permissions" VALUES(3,314);
INSERT INTO "role_permissions" VALUES(10,314);
INSERT INTO "role_permissions" VALUES(17,314);
INSERT INTO "role_permissions" VALUES(24,314);
INSERT INTO "role_permissions" VALUES(31,314);
INSERT INTO "role_permissions" VALUES(3,315);
INSERT INTO "role_permissions" VALUES(10,315);
INSERT INTO "role_permissions" VALUES(17,315);
INSERT INTO "role_permissions" VALUES(24,315);
INSERT INTO "role_permissions" VALUES(31,315);
CREATE TABLE "roles" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "name" text NOT NULL
);
INSERT INTO "roles" VALUES(1,'SUPER_ADMIN');
INSERT INTO "roles" VALUES(2,'ADMIN');
INSERT INTO "roles" VALUES(3,'MANAGER');
INSERT INTO "roles" VALUES(4,'OPERATOR');
INSERT INTO "roles" VALUES(5,'SALES');
INSERT INTO "roles" VALUES(6,'ACCOUNTANT');
INSERT INTO "roles" VALUES(7,'WAREHOUSE');
INSERT INTO "roles" VALUES(8,'SUPER_ADMIN');
INSERT INTO "roles" VALUES(9,'ADMIN');
INSERT INTO "roles" VALUES(10,'MANAGER');
INSERT INTO "roles" VALUES(11,'OPERATOR');
INSERT INTO "roles" VALUES(12,'SALES');
INSERT INTO "roles" VALUES(13,'ACCOUNTANT');
INSERT INTO "roles" VALUES(14,'WAREHOUSE');
INSERT INTO "roles" VALUES(15,'SUPER_ADMIN');
INSERT INTO "roles" VALUES(16,'ADMIN');
INSERT INTO "roles" VALUES(17,'MANAGER');
INSERT INTO "roles" VALUES(18,'OPERATOR');
INSERT INTO "roles" VALUES(19,'SALES');
INSERT INTO "roles" VALUES(20,'ACCOUNTANT');
INSERT INTO "roles" VALUES(21,'WAREHOUSE');
INSERT INTO "roles" VALUES(22,'SUPER_ADMIN');
INSERT INTO "roles" VALUES(23,'ADMIN');
INSERT INTO "roles" VALUES(24,'MANAGER');
INSERT INTO "roles" VALUES(25,'OPERATOR');
INSERT INTO "roles" VALUES(26,'SALES');
INSERT INTO "roles" VALUES(27,'ACCOUNTANT');
INSERT INTO "roles" VALUES(28,'WAREHOUSE');
INSERT INTO "roles" VALUES(29,'SUPER_ADMIN');
INSERT INTO "roles" VALUES(30,'ADMIN');
INSERT INTO "roles" VALUES(31,'MANAGER');
INSERT INTO "roles" VALUES(32,'OPERATOR');
INSERT INTO "roles" VALUES(33,'SALES');
INSERT INTO "roles" VALUES(34,'ACCOUNTANT');
INSERT INTO "roles" VALUES(35,'WAREHOUSE');
CREATE TABLE "routings" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "product_id" integer NOT NULL,
  "sequence" integer,
  "operation_name" text NOT NULL,
  "work_center_id" integer,
  "planned_time_minutes" real,
  "description" text
);
INSERT INTO "routings" VALUES(1,1,10,'Gia công & Hàn chíp SMT',1,45.0,'Hàn vi điều khiển & mạch nguồn SMT');
INSERT INTO "routings" VALUES(2,1,20,'Lắp ráp mô-đun RAM & SSD',2,30.0,'Cố định thanh RAM 16GB, SSD 512GB vào khung máy');
INSERT INTO "routings" VALUES(3,1,30,'Đóng vỏ & Kiểm định Burn-in Test',3,60.0,'Chạy stress test và kiểm tra ngoại quan đạt chuẩn');
CREATE TABLE "sales_order_items" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "order_id" integer,
  "product_id" integer NOT NULL,
  "uom_id" integer,
  "quantity" integer NOT NULL,
  "unit_price" real NOT NULL,
  "discount_amount" real,
  "tax_rate" real,
  "subtotal" real NOT NULL,
  "notes" text
);
CREATE TABLE "sales_orders" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "customer_id" integer,
  "warehouse_id" integer NOT NULL,
  "status" text,
  "payment_status" text,
  "total_amount" real,
  "discount_amount" real,
  "tax_amount" real,
  "final_amount" real,
  "amount_paid" real,
  "due_date" integer,
  "notes" text,
  "created_by" integer NOT NULL,
  "created_at" integer
);
CREATE TABLE "sales_quotas" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "quota_code" text NOT NULL,
  "user_id" integer NOT NULL,
  "period" text NOT NULL,
  "start_date" integer NOT NULL,
  "end_date" integer NOT NULL,
  "target_revenue" real,
  "target_quantity" real,
  "actual_revenue" real,
  "actual_quantity" real,
  "attainment_percent" real,
  "accelerator_multiplier" real,
  "status" text,
  "notes" text,
  "created_by" integer NOT NULL,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "sales_return_items" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "sales_return_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "quantity" integer NOT NULL,
  "unit_price" real NOT NULL,
  "reason" text,
  "serial_numbers" text
);
CREATE TABLE "sales_returns" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "order_id" integer,
  "customer_id" integer NOT NULL,
  "warehouse_id" integer NOT NULL,
  "status" text,
  "refund_status" text,
  "refunded_amount" real,
  "refund_method" text,
  "cogs_amount" real,
  "return_date" integer,
  "total_amount" real,
  "reason" text,
  "created_by" integer NOT NULL,
  "created_at" integer
);
CREATE TABLE "serial_history" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "serial_id" integer NOT NULL,
  "action" text NOT NULL,
  "reference_no" text,
  "from_warehouse_id" integer,
  "to_warehouse_id" integer,
  "from_status" text,
  "to_status" text,
  "notes" text,
  "performed_by" integer NOT NULL,
  "created_at" integer
);
CREATE TABLE "serial_numbers" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "serial_number" text NOT NULL,
  "product_id" integer NOT NULL,
  "lot_id" integer,
  "profile_id" integer,
  "warehouse_id" integer,
  "location_id" integer,
  "status" text,
  "customer_name" text,
  "customer_phone" text,
  "customer_email" text,
  "customer_address" text,
  "manufacture_date" integer,
  "warranty_start_date" integer,
  "warranty_end_date" integer,
  "warranty_months" integer,
  "custom_attributes" text,
  "notes" text,
  "created_by" integer NOT NULL,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "serial_profiles" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "name" text NOT NULL,
  "code" text NOT NULL,
  "category_type" text,
  "description" text,
  "prefix" text,
  "warranty_months" integer,
  "auto_generate_pattern" text,
  "fields_schema" text,
  "is_system" integer,
  "created_at" integer
);
CREATE TABLE "serial_transactions" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "serial_id" integer NOT NULL,
  "transaction_type" text NOT NULL,
  "reference_id" integer NOT NULL,
  "reference_item_id" integer,
  "created_at" integer
);
CREATE TABLE "sourcing_award_lines" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "award_id" integer NOT NULL,
  "rfq_line_id" integer NOT NULL,
  "bid_line_id" integer NOT NULL,
  "awarded_quantity" real NOT NULL,
  "awarded_unit_price" real NOT NULL,
  "awarded_total" real NOT NULL
);
CREATE TABLE "sourcing_awards" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "award_no" text NOT NULL,
  "rfq_id" integer NOT NULL,
  "bid_id" integer NOT NULL,
  "supplier_id" integer NOT NULL,
  "evaluation_id" integer,
  "status" text,
  "total_amount" real,
  "currency" text,
  "approved_by" integer,
  "approved_at" integer,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "sourcing_evaluation_scores" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "evaluation_id" integer NOT NULL,
  "criterion_name" text NOT NULL,
  "weight" real,
  "score" real,
  "weighted_score" real
);
CREATE TABLE "sourcing_evaluations" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "rfq_id" integer NOT NULL,
  "bid_id" integer NOT NULL,
  "evaluator_id" integer NOT NULL,
  "status" text,
  "total_score" real,
  "ranking" integer,
  "notes" text,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "srm_bid_items" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "bid_id" integer NOT NULL,
  "rfq_item_id" integer NOT NULL,
  "unit_price" real NOT NULL,
  "offered_quantity" real NOT NULL,
  "lead_time_days" integer
);
CREATE TABLE "srm_bids" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "rfq_id" integer NOT NULL,
  "supplier_id" integer NOT NULL,
  "status" text,
  "total_value" real,
  "submitted_at" integer,
  "created_at" integer
);
CREATE TABLE "srm_rfq_items" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "rfq_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "target_quantity" real NOT NULL
);
CREATE TABLE "srm_rfq_suppliers" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "rfq_id" integer NOT NULL,
  "supplier_id" integer NOT NULL,
  "invited_at" integer
);
CREATE TABLE "srm_rfqs" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "title" text NOT NULL,
  "status" text,
  "deadline" integer,
  "created_by" integer NOT NULL,
  "created_at" integer
);
CREATE TABLE "stock_adjustment_items" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "adjustment_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "location_id" integer,
  "lot_id" integer,
  "direction" text,
  "quantity" real NOT NULL,
  "unit_cost" real,
  "total_cost" real,
  "current_stock_snapshot" real,
  "new_stock_snapshot" real,
  "notes" text,
  "type" text,
  "current_stock" real,
  "new_stock" real,
  "item_notes" text,
  "serial_number" text,
  "serial_numbers" text
);
CREATE TABLE "stock_adjustment_serials" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "adjustment_item_id" integer NOT NULL,
  "serial_id" integer,
  "serial_number" text NOT NULL
);
CREATE TABLE "stock_adjustments" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "warehouse_id" integer NOT NULL,
  "adjustment_type" text,
  "direction" text,
  "reason_code" text,
  "reason" text NOT NULL,
  "source_type" text,
  "source_id" text,
  "status" text,
  "notes" text,
  "created_by" integer NOT NULL,
  "approved_by" integer,
  "rejected_by" integer,
  "rejection_reason" text,
  "created_at" integer,
  "approved_at" integer,
  "rejected_at" integer,
  "posted_at" integer
);
CREATE TABLE "stock_balances" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "product_id" integer NOT NULL,
  "warehouse_id" integer NOT NULL,
  "location_id" integer,
  "stock_physical" integer,
  "stock_reserved" integer,
  "stock_available" integer
);
INSERT INTO "stock_balances" VALUES(1,1,1,1,15,1,14);
INSERT INTO "stock_balances" VALUES(2,2,1,1,20,2,18);
INSERT INTO "stock_balances" VALUES(3,3,1,1,30,3,27);
INSERT INTO "stock_balances" VALUES(4,4,1,1,30,3,27);
INSERT INTO "stock_balances" VALUES(5,5,1,1,45,4,41);
INSERT INTO "stock_balances" VALUES(6,6,1,1,80,8,72);
INSERT INTO "stock_balances" VALUES(7,7,1,1,12,1,11);
INSERT INTO "stock_balances" VALUES(8,8,1,1,120,12,108);
INSERT INTO "stock_balances" VALUES(9,9,1,1,1500,150,1350);
INSERT INTO "stock_balances" VALUES(10,10,1,1,35,3,32);
INSERT INTO "stock_balances" VALUES(11,11,1,1,22,2,20);
INSERT INTO "stock_balances" VALUES(12,12,1,1,120,12,108);
INSERT INTO "stock_balances" VALUES(13,13,1,1,85,8,77);
INSERT INTO "stock_balances" VALUES(14,14,1,1,60,6,54);
INSERT INTO "stock_balances" VALUES(15,15,1,1,1250,125,1125);
INSERT INTO "stock_balances" VALUES(16,16,1,1,4300,430,3870);
INSERT INTO "stock_balances" VALUES(17,17,1,1,999,99,900);
CREATE TABLE "stock_ledger" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "product_id" integer NOT NULL,
  "warehouse_id" integer NOT NULL,
  "location_id" integer,
  "lot_id" integer,
  "type" text NOT NULL,
  "reference_no" text NOT NULL,
  "quantity" integer NOT NULL,
  "balance_after" integer NOT NULL,
  "notes" text,
  "user_id" integer NOT NULL,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "stock_reservations" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "product_id" integer NOT NULL,
  "warehouse_id" integer NOT NULL,
  "location_id" integer,
  "quantity" integer NOT NULL,
  "reference_no" text NOT NULL,
  "status" text,
  "notes" text,
  "user_id" integer NOT NULL,
  "created_at" integer
);
CREATE TABLE "stock_transfer_items" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "transfer_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "uom_id" integer,
  "from_location_id" integer,
  "to_location_id" integer,
  "quantity" integer NOT NULL,
  "base_quantity" integer NOT NULL,
  "serial_numbers" text
);
CREATE TABLE "stock_transfers" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "from_warehouse_id" integer NOT NULL,
  "to_warehouse_id" integer NOT NULL,
  "from_location_id" integer,
  "to_location_id" integer,
  "status" text,
  "requested_by" integer NOT NULL,
  "notes" text,
  "created_at" integer
);
CREATE TABLE "stocktake_counts" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "stocktake_item_id" integer NOT NULL,
  "count_number" integer NOT NULL,
  "counted_quantity" real NOT NULL,
  "counted_by" integer NOT NULL,
  "counted_at" integer,
  "reason" text,
  "notes" text
);
CREATE TABLE "stocktake_items" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "stocktake_id" integer NOT NULL,
  "warehouse_id" integer,
  "product_id" integer NOT NULL,
  "location_id" integer,
  "lot_id" integer,
  "serial_number" text,
  "system_quantity" real NOT NULL,
  "system_quantity_at_start" real,
  "counted_quantity" real NOT NULL,
  "difference" real NOT NULL,
  "variance_percent" real,
  "final_quantity" real,
  "adjustment_required" integer,
  "count1_quantity" real,
  "count2_quantity" real,
  "count1_user_id" integer,
  "count2_user_id" integer,
  "count1_at" integer,
  "count2_at" integer,
  "recount_reason" text,
  "status" text,
  "updated_at" integer
);
CREATE TABLE "stocktakes" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "warehouse_id" integer NOT NULL,
  "status" text,
  "notes" text,
  "is_blind_count" integer,
  "variance_threshold" real,
  "variance_threshold_percent" real,
  "recount_required" integer,
  "adjustment_document_id" integer,
  "created_by" integer NOT NULL,
  "approved_by" integer,
  "approved_at" integer,
  "completed_by" integer,
  "cancelled_by" integer,
  "cancelled_at" integer,
  "cancel_reason" text,
  "started_at" integer,
  "completed_at" integer,
  "created_at" integer
);
CREATE TABLE "subcontracting_material_issues" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "issue_code" text NOT NULL,
  "subcontracting_order_id" integer NOT NULL,
  "source_warehouse_id" integer NOT NULL,
  "source_location_id" integer,
  "vendor_location_id" integer,
  "notes" text,
  "status" text,
  "issued_by" integer NOT NULL,
  "issued_at" integer
);
CREATE TABLE "subcontracting_order_components" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "subcontracting_order_id" integer NOT NULL,
  "component_product_id" integer NOT NULL,
  "bom_qty_per_unit" real,
  "required_quantity" real NOT NULL,
  "issued_quantity" real,
  "consumed_quantity" real,
  "returned_quantity" real,
  "scrapped_quantity" real,
  "notes" text
);
CREATE TABLE "subcontracting_orders" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "order_code" text NOT NULL,
  "supplier_id" integer NOT NULL,
  "purchase_order_id" integer,
  "product_id" integer NOT NULL,
  "bom_id" integer,
  "vendor_location_id" integer,
  "destination_warehouse_id" integer NOT NULL,
  "destination_location_id" integer,
  "ordered_quantity" real NOT NULL,
  "received_quantity" real,
  "service_unit_price" real,
  "total_service_cost" real,
  "status" text,
  "notes" text,
  "created_by" integer NOT NULL,
  "approved_by" integer,
  "approved_at" integer,
  "completed_at" integer,
  "created_at" integer
);
CREATE TABLE "subcontracting_output_receipts" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "receipt_code" text NOT NULL,
  "subcontracting_order_id" integer NOT NULL,
  "received_quantity" real NOT NULL,
  "destination_warehouse_id" integer NOT NULL,
  "destination_location_id" integer,
  "unit_material_cost" real,
  "unit_service_cost" real,
  "total_unit_cost" real,
  "quality_inspection_id" integer,
  "status" text,
  "notes" text,
  "received_by" integer NOT NULL,
  "received_at" integer
);
CREATE TABLE "subcontractor_stock_balances" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "supplier_id" integer NOT NULL,
  "vendor_location_id" integer,
  "product_id" integer NOT NULL,
  "physical_quantity" real,
  "allocated_quantity" real,
  "updated_at" integer
);
CREATE TABLE "supplier_bank_accounts" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "supplier_id" integer NOT NULL,
  "bank_name" text NOT NULL,
  "account_number" text NOT NULL,
  "account_holder" text NOT NULL,
  "branch" text,
  "currency" text,
  "is_default" integer,
  "status" text
);
CREATE TABLE "supplier_contacts" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "supplier_id" integer NOT NULL,
  "contact_name" text NOT NULL,
  "department" text,
  "position" text,
  "phone" text,
  "email" text,
  "note" text,
  "is_primary" integer
);
CREATE TABLE "suppliers" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "short_name" text,
  "supplier_type" text,
  "status" text,
  "contact_info" text,
  "phone" text,
  "email" text,
  "website" text,
  "tax_code" text,
  "tax_name" text,
  "tax_address" text,
  "company_name" text,
  "address" text,
  "payment_terms" text,
  "credit_limit" real,
  "currency" text,
  "performance_tier" text,
  "composite_score" real,
  "notes" text,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "supply_plans" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "plan_code" text NOT NULL,
  "product_id" integer NOT NULL,
  "product_name" text,
  "warehouse_id" integer,
  "current_stock" real,
  "reserved_stock" real,
  "incoming_po_qty" real,
  "incoming_mo_qty" real,
  "forecast_demand" real,
  "net_requirement" real,
  "reorder_point" real,
  "safety_stock" real,
  "recommended_purchase_qty" real,
  "recommended_production_qty" real,
  "recommended_transfer_qty" real,
  "status" text,
  "created_at" integer
);
INSERT INTO "supply_plans" VALUES(1,'PLN-2026-001',1,'Laptop Dell XPS 15',1,45.0,5.0,0.0,25.0,50.0,0.0,20.0,10.0,0.0,15.0,NULL,'APPROVED',NULL);
INSERT INTO "supply_plans" VALUES(2,'PLN-2026-002',3,'Vi điều khiển STM32F407 (Cuộn 100 cái)',1,80.0,50.0,20.0,0.0,70.0,20.0,40.0,20.0,50.0,0.0,NULL,'DRAFT',NULL);
INSERT INTO "supply_plans" VALUES(3,'PLN-2026-003',4,'Thanh RAM DDR4 16GB Crucial',1,150.0,50.0,0.0,0.0,120.0,20.0,50.0,30.0,100.0,0.0,NULL,'DRAFT',NULL);
CREATE TABLE "system_configs" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "module_key" text NOT NULL,
  "config_key" text NOT NULL,
  "config_value" text NOT NULL,
  "description" text,
  "updated_by" text,
  "updated_at" integer
);
CREATE TABLE "system_notifications" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "user_id" integer NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "reference_key" text NOT NULL,
  "read_at" integer,
  "created_at" integer
);
CREATE TABLE "tax_profiles" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "employee_id" integer NOT NULL,
  "tax_code" text,
  "dependents_count" integer,
  "deduction_amount" real,
  "created_at" integer
);
CREATE TABLE "ticket_messages" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "ticket_id" integer NOT NULL,
  "sender_name" text NOT NULL,
  "sender_type" text,
  "message" text NOT NULL,
  "created_at" integer
);
CREATE TABLE "tickets" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "ticket_code" text NOT NULL,
  "customer_id" integer,
  "customer_name" text,
  "contact_name" text,
  "contact_email" text,
  "category" text,
  "priority" text,
  "subject" text NOT NULL,
  "description" text,
  "assigned_agent_id" integer,
  "assigned_agent_name" text,
  "sla_hours" integer,
  "first_response_time_minutes" integer,
  "resolution_time_hours" real,
  "is_sla_breached" integer,
  "status" text,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "transport_orders" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "order_code" text NOT NULL,
  "sales_order_id" integer,
  "customer_id" integer,
  "customer_name" text,
  "origin_address" text NOT NULL,
  "destination_address" text NOT NULL,
  "weight_kg" real,
  "volume_cbm" real,
  "vehicle_id" integer,
  "driver_id" integer,
  "planned_date" text,
  "status" text,
  "freight_cost" real,
  "fuel_cost" real,
  "created_at" integer
);
INSERT INTO "transport_orders" VALUES(1,'TRP-2026-001',101,NULL,'Tập đoàn Viettel Post','Kho Tổng HQ Hà Nội (WH-MAIN)','Kho Trung tâm Viettel Post Nam Từ Liêm',3500.0,14.5,1,1,'2026-08-28','DELIVERED',4500000.0,1200000.0,NULL);
INSERT INTO "transport_orders" VALUES(2,'TRP-2026-002',102,NULL,'Công ty Điện máy Nguyễn Kim','Kho Chi Nhánh Miền Nam (WH-SOUTH)','Showroom Nguyễn Kim Quận 1, TP.HCM',12000.0,45.0,2,2,'2026-08-28','IN_TRANSIT',12500000.0,3800000.0,NULL);
INSERT INTO "transport_orders" VALUES(3,'TRP-2026-003',103,NULL,'Chuỗi Siêu thị WinMart','Kho Tổng HQ Hà Nội (WH-MAIN)','WinMart Times City Hai Bà Trưng',1100.0,5.2,3,3,'2026-08-29','ASSIGNED',1800000.0,450000.0,NULL);
INSERT INTO "transport_orders" VALUES(4,'TRP-2026-004',104,NULL,'Công ty Thực phẩm CP Việt Nam','Kho Đông Lạnh Bình Dương','Tổng kho CP Hà Nội',3200.0,12.0,4,1,'2026-08-30','PLANNED',8900000.0,2400000.0,NULL);
CREATE TABLE "treasury_transfers" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "transfer_code" text NOT NULL,
  "from_account_id" integer NOT NULL,
  "from_bank_name" text NOT NULL,
  "to_account_id" integer NOT NULL,
  "to_bank_name" text NOT NULL,
  "amount" real NOT NULL,
  "fee" real,
  "status" text,
  "date" text NOT NULL,
  "reason" text,
  "accounting_entry" text,
  "created_by" text,
  "created_at" integer
);
CREATE TABLE "user_permissions" (
  "user_id" integer NOT NULL,
  "permission_id" integer NOT NULL,
  "is_granted" integer NOT NULL
);
CREATE TABLE "user_scopes" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "user_id" integer NOT NULL,
  "scope_type" text NOT NULL,
  "scope_value" text NOT NULL,
  "created_at" integer
);
CREATE TABLE "users" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "username" text NOT NULL,
  "password_hash" text NOT NULL,
  "role_id" integer,
  "branch_id" integer,
  "status" text
);
INSERT INTO "users" VALUES(1,'admin','$2b$10$vDoCOJui2SNFMbpbefc5C.ivQl9mI0X4gPv11qtSOw5Jn4KB181Ce',1,NULL,'ACTIVE');
CREATE TABLE "variance_rules" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "department_id" integer,
  "account_id" integer NOT NULL,
  "variance_threshold_percentage" real NOT NULL
);
CREATE TABLE "vehicles" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "plate_number" text NOT NULL,
  "vehicle_type" text,
  "capacity_kg" real,
  "fuel_type" text,
  "status" text,
  "mileage_km" real,
  "asset_id" integer,
  "created_at" integer
);
INSERT INTO "vehicles" VALUES(1,'VEH-001','29C-882.14','TRUCK_5T',5000.0,'DIESEL','ACTIVE',45200.0,NULL,NULL);
INSERT INTO "vehicles" VALUES(2,'VEH-002','51D-993.82','CONTAINER_20T',20000.0,'DIESEL','IN_USE',112500.0,NULL,NULL);
INSERT INTO "vehicles" VALUES(3,'VEH-003','29H-441.05','VAN_1.5T',1500.0,'DIESEL','ACTIVE',28400.0,NULL,NULL);
INSERT INTO "vehicles" VALUES(4,'VEH-004','60C-552.19','COLD_TRUCK_3.5T',3500.0,'DIESEL','MAINTENANCE',84300.0,NULL,NULL);
CREATE TABLE "warehouse_locations" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "warehouse_id" integer NOT NULL,
  "type" text NOT NULL,
  "parent_id" integer,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "is_active" integer,
  "capacity" real,
  "is_picking" integer,
  "is_receiving" integer,
  "is_quarantine" integer,
  "is_damaged" integer
);
INSERT INTO "warehouse_locations" VALUES(1,1,'BIN',NULL,'LOC-A-01-01','Khu A - Kệ 01 - Tầng 1',NULL,1,NULL,1,NULL,NULL,NULL);
INSERT INTO "warehouse_locations" VALUES(2,1,'BIN',NULL,'LOC-A-01-02','Khu A - Kệ 01 - Tầng 2',NULL,1,NULL,1,NULL,NULL,NULL);
INSERT INTO "warehouse_locations" VALUES(3,2,'BIN',NULL,'LOC-S-01-01','Khu Nam - Kệ 01',NULL,1,NULL,1,NULL,NULL,NULL);
CREATE TABLE "warehouses" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "type" text,
  "is_active" integer,
  "is_default" integer,
  "address" text,
  "description" text,
  "branch_id" integer
);
INSERT INTO "warehouses" VALUES(1,'WH-MAIN','Kho Tổng Trung Tâm','MAIN',1,NULL,'Số 1 Đại Lộ Thăng Long, Hà Nội',NULL,NULL);
INSERT INTO "warehouses" VALUES(2,'WH-SOUTH','Kho Chi Nhánh Miền Nam','BRANCH',1,NULL,'Khu Công Nghiệp Tân Bình, TP.HCM',NULL,NULL);
CREATE TABLE "warranty_claims" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "claim_code" text NOT NULL,
  "customer_id" integer,
  "customer_name" text,
  "product_id" integer,
  "product_name" text,
  "serial_number" text,
  "invoice_no" text,
  "issue_description" text NOT NULL,
  "claim_date" text NOT NULL,
  "status" text,
  "resolution_notes" text,
  "created_at" integer
);
CREATE TABLE "wms_carrier_rates" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "rate_card_code" text NOT NULL,
  "carrier_code" text NOT NULL,
  "service_level" text,
  "min_weight_kg" real,
  "max_weight_kg" real,
  "base_rate" real NOT NULL,
  "per_kg_rate" real,
  "fuel_surcharge_percent" real,
  "effective_from" integer NOT NULL,
  "effective_to" integer NOT NULL,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "wms_cross_docks" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "cross_dock_number" text NOT NULL,
  "inbound_grn_code" text NOT NULL,
  "outbound_order_code" text NOT NULL,
  "sku" text NOT NULL,
  "quantity" real NOT NULL,
  "staging_location_code" text NOT NULL,
  "status" text,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "wms_dock_appointments" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "appointment_number" text NOT NULL,
  "warehouse_code" text NOT NULL,
  "dock_door_code" text NOT NULL,
  "carrier_code" text NOT NULL,
  "appointment_type" text,
  "scheduled_start_time" integer NOT NULL,
  "scheduled_end_time" integer NOT NULL,
  "actual_check_in_time" integer,
  "actual_check_out_time" integer,
  "status" text,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "wms_lpns" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "lpn_code" text NOT NULL,
  "lpn_type" text,
  "order_code" text,
  "warehouse_code" text NOT NULL,
  "current_location_code" text NOT NULL,
  "weight_kg" real,
  "volume_cbm" real,
  "status" text,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "wms_packing_stations" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "station_code" text NOT NULL,
  "warehouse_code" text NOT NULL,
  "scale_connected" integer,
  "printer_code" text,
  "is_active" integer,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "wms_picking_tasks" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "task_number" text NOT NULL,
  "wave_id" integer,
  "order_code" text NOT NULL,
  "sku" text NOT NULL,
  "from_location_code" text NOT NULL,
  "to_staging_location_code" text NOT NULL,
  "quantity_requested" real NOT NULL,
  "quantity_picked" real,
  "picker_employee_code" text,
  "status" text,
  "sequence" integer,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "wms_putaway_rules" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "rule_code" text NOT NULL,
  "warehouse_code" text NOT NULL,
  "abc_class" text,
  "zone_type" text,
  "strategy" text,
  "priority" integer,
  "is_active" integer,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "wms_replenishment_tasks" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "replenishment_number" text NOT NULL,
  "warehouse_code" text NOT NULL,
  "sku" text NOT NULL,
  "from_location_code" text NOT NULL,
  "to_location_code" text NOT NULL,
  "min_threshold" real NOT NULL,
  "max_capacity" real NOT NULL,
  "quantity_to_move" real NOT NULL,
  "status" text,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "wms_waves" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "wave_number" text NOT NULL,
  "warehouse_code" text NOT NULL,
  "wave_type" text,
  "status" text,
  "priority" integer,
  "total_orders" integer,
  "total_items" integer,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "wms_yard_containers" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "container_number" text NOT NULL,
  "carrier_code" text NOT NULL,
  "yard_spot_code" text NOT NULL,
  "container_type" text,
  "status" text,
  "contents_description" text,
  "created_at" integer,
  "updated_at" integer
);
CREATE TABLE "work_centers" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "department_id" integer,
  "capacity" real,
  "cost_rate_per_hour" real,
  "status" text,
  "notes" text,
  "created_at" integer
);
INSERT INTO "work_centers" VALUES(1,'WC-SMT-01','Xưởng Bo Mạch SMT Surface-Mount',NULL,120.0,350000.0,'ACTIVE',NULL,NULL);
INSERT INTO "work_centers" VALUES(2,'WC-ASSY-02','Dây chuyền Lắp ráp & Hoàn thiện',NULL,80.0,280000.0,'ACTIVE',NULL,NULL);
INSERT INTO "work_centers" VALUES(3,'WC-QC-03','Phòng Thử nghiệm & Kiểm chuẩn QC',NULL,100.0,300000.0,'ACTIVE',NULL,NULL);
CREATE TABLE "work_shifts" (
  "id" integer PRIMARY KEY AUTOINCREMENT,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "start_time" text NOT NULL,
  "end_time" text NOT NULL,
  "shift_type" text,
  "created_at" integer
);
CREATE UNIQUE INDEX process_instances_def_key_business_key_idx
      ON process_instances (process_definition_key, business_key)
    ;
CREATE UNIQUE INDEX processed_events_event_consumer_idx ON processed_events (event_id, consumer);
CREATE INDEX idx_stock_ledger_prod_wh ON stock_ledger (product_id, warehouse_id);
CREATE INDEX idx_stock_ledger_ref ON stock_ledger (reference_no);
CREATE INDEX idx_stock_balances_lookup ON stock_balances (product_id, warehouse_id);
CREATE INDEX idx_accounting_entries_doc ON accounting_entries (source_document_type, source_reference_no);
CREATE INDEX idx_accounting_entries_accounts ON accounting_entries (debit_account, credit_account);
CREATE INDEX idx_outbox_events_status_retry ON outbox_events (status, next_retry_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id, created_at);
DELETE FROM "sqlite_sequence";
INSERT INTO "sqlite_sequence" VALUES('functional_groups',6);
INSERT INTO "sqlite_sequence" VALUES('business_workspaces',29);
INSERT INTO "sqlite_sequence" VALUES('business_processes',6);
INSERT INTO "sqlite_sequence" VALUES('roles',35);
INSERT INTO "sqlite_sequence" VALUES('permissions',315);
INSERT INTO "sqlite_sequence" VALUES('users',1);
INSERT INTO "sqlite_sequence" VALUES('warehouses',2);
INSERT INTO "sqlite_sequence" VALUES('warehouse_locations',3);
INSERT INTO "sqlite_sequence" VALUES('categories',70);
INSERT INTO "sqlite_sequence" VALUES('products',17);
INSERT INTO "sqlite_sequence" VALUES('stock_balances',17);
INSERT INTO "sqlite_sequence" VALUES('work_centers',3);
INSERT INTO "sqlite_sequence" VALUES('boms',1);
INSERT INTO "sqlite_sequence" VALUES('bom_items',4);
INSERT INTO "sqlite_sequence" VALUES('routings',3);
INSERT INTO "sqlite_sequence" VALUES('manufacturing_orders',3);
INSERT INTO "sqlite_sequence" VALUES('material_reservations',4);
INSERT INTO "sqlite_sequence" VALUES('production_costs',1);
INSERT INTO "sqlite_sequence" VALUES('demand_forecasts',2);
INSERT INTO "sqlite_sequence" VALUES('supply_plans',3);
INSERT INTO "sqlite_sequence" VALUES('asset_categories',2);
INSERT INTO "sqlite_sequence" VALUES('assets',3);
INSERT INTO "sqlite_sequence" VALUES('maintenance_plans',1);
INSERT INTO "sqlite_sequence" VALUES('maintenance_work_orders',2);
INSERT INTO "sqlite_sequence" VALUES('audit_logs',3);
INSERT INTO "sqlite_sequence" VALUES('vehicles',4);
INSERT INTO "sqlite_sequence" VALUES('drivers',4);
INSERT INTO "sqlite_sequence" VALUES('transport_orders',4);
INSERT INTO "sqlite_sequence" VALUES('proof_of_deliveries',1);
INSERT INTO "sqlite_sequence" VALUES('fuel_transactions',2);
INSERT INTO "sqlite_sequence" VALUES('cash_vouchers',2);
INSERT INTO "sqlite_sequence" VALUES('dms_documents',3);
INSERT INTO "sqlite_sequence" VALUES('credit_notes',2);
INSERT INTO "sqlite_sequence" VALUES('debit_notes',1);
INSERT INTO "sqlite_sequence" VALUES('accounting_events',2);
INSERT INTO "sqlite_sequence" VALUES('price_list_items',7);
INSERT INTO "sqlite_sequence" VALUES('margin_policies',3);
INSERT INTO "sqlite_sequence" VALUES('bank_accounts',3);
INSERT INTO "sqlite_sequence" VALUES('bank_transactions',4);
INSERT INTO "sqlite_sequence" VALUES('projects',4);
INSERT INTO "sqlite_sequence" VALUES('project_wbs',9);
INSERT INTO "sqlite_sequence" VALUES('project_tasks',9);
COMMIT;
