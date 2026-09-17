import { client, db, recreateDatabaseClient } from "./index";
import bcrypt from "bcryptjs";
import { ensureProcessTraceabilityTablesExist } from "../engines/processEngine";
import { OrchestrationEngine } from "../engines/orchestrationEngine";
import * as schema from "./schema";
import { is } from "drizzle-orm";
import { SQLiteTable, getTableConfig } from "drizzle-orm/sqlite-core";
import fs from "fs";
import path from "path";
import { ENTERPRISE_MASTER_PRODUCTS } from "../src/data/enterpriseMaster";

export async function ensureSchemaSynchronized() {
  // Ensure all tables defined in schema.ts are created
  for (const key of Object.keys(schema)) {
    const item = (schema as any)[key];
    if (is(item, SQLiteTable)) {
      try {
        const config = getTableConfig(item);
        const colDefs = config.columns.map(c => {
          let def = `"${c.name}" ${c.getSQLType()}`;
          if (c.primary) def += " PRIMARY KEY";
          if (c.hasAutoIncrement) def += " AUTOINCREMENT";
          if (c.notNull && !c.primary && !c.hasDefault) def += " NOT NULL";
          return def;
        });
        await client.execute(`CREATE TABLE IF NOT EXISTS "${config.name}" (\n  ${colDefs.join(",\n  ")}\n);`);
      } catch (err) {
        // Ignore duplicate/syntax differences
      }
    }
  }

  const migrations = [
    `ALTER TABLE outbox_events ADD COLUMN locked_at INTEGER`,
    `ALTER TABLE outbox_events ADD COLUMN locked_by TEXT`,
    `ALTER TABLE outbox_events ADD COLUMN next_retry_at INTEGER`,
    `ALTER TABLE business_processes ADD COLUMN definition_payload TEXT`,
    `ALTER TABLE employees ADD COLUMN base_salary REAL DEFAULT 15000000`,
    `ALTER TABLE employees ADD COLUMN bank_account TEXT`,
    `ALTER TABLE payrolls ADD COLUMN posted_gl INTEGER DEFAULT 0`,
    `ALTER TABLE payrolls ADD COLUMN sha256_checksum TEXT`,
    `ALTER TABLE payrolls ADD COLUMN approved_by TEXT`,
    `ALTER TABLE payrolls ADD COLUMN approved_at TEXT`,
    `ALTER TABLE payrolls ADD COLUMN notes TEXT`,
    `ALTER TABLE bank_accounts ADD COLUMN account_type TEXT DEFAULT 'SAVINGS'`,
    `ALTER TABLE bank_accounts ADD COLUMN book_balance REAL DEFAULT 0`,
    `ALTER TABLE bank_accounts ADD COLUMN bank_balance REAL DEFAULT 0`,
    `ALTER TABLE bank_transactions ADD COLUMN bank_ref TEXT`,
    `CREATE TABLE IF NOT EXISTS processed_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      consumer TEXT NOT NULL,
      processed_at INTEGER,
      status TEXT NOT NULL DEFAULT 'SUCCESS',
      error TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS processed_events_event_consumer_idx ON processed_events (event_id, consumer)`,
    `CREATE TABLE IF NOT EXISTS dlq_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      consumer TEXT NOT NULL,
      payload TEXT NOT NULL,
      correlation_id TEXT,
      causation_id TEXT,
      failed_at INTEGER,
      retry_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      status TEXT NOT NULL DEFAULT 'UNRESOLVED',
      resolved_by TEXT,
      resolved_at INTEGER
    )`,
    // Performance indexes for high-throughput enterprise scale
    `CREATE INDEX IF NOT EXISTS idx_stock_ledger_prod_wh ON stock_ledger (product_id, warehouse_id)`,
    `CREATE INDEX IF NOT EXISTS idx_stock_ledger_ref ON stock_ledger (reference_no)`,
    `CREATE INDEX IF NOT EXISTS idx_stock_balances_lookup ON stock_balances (product_id, warehouse_id)`,
    `CREATE INDEX IF NOT EXISTS idx_accounting_entries_doc ON accounting_entries (source_document_type, source_reference_no)`,
    `CREATE INDEX IF NOT EXISTS idx_accounting_entries_accounts ON accounting_entries (debit_account, credit_account)`,
    `CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries (entry_date, status)`,
    `CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_lines (account_id, entry_id)`,
    `CREATE INDEX IF NOT EXISTS idx_outbox_events_status_retry ON outbox_events (status, next_retry_at)`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id, created_at)`,
    // M02 SHA-256 Hash Chain and Block Immutability
    `ALTER TABLE audit_logs ADD COLUMN prev_hash TEXT`,
    `ALTER TABLE audit_logs ADD COLUMN sha256_checksum TEXT`,
    `ALTER TABLE audit_logs ADD COLUMN tamper_status TEXT DEFAULT 'VALID'`,
    `ALTER TABLE audit_logs ADD COLUMN masked_fields TEXT`,
    `ALTER TABLE audit_logs ADD COLUMN block_number INTEGER`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_block ON audit_logs (block_number)`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_checksum ON audit_logs (sha256_checksum)`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_module_action ON audit_logs (module, action, created_at)`,
    `CREATE TRIGGER IF NOT EXISTS trg_audit_logs_no_update BEFORE UPDATE ON audit_logs BEGIN SELECT RAISE(FAIL, 'UPDATE operation is strictly prohibited on immutable audit_logs (Rule #03 & Rule #16)'); END;`,
    `CREATE TRIGGER IF NOT EXISTS trg_audit_logs_no_delete BEFORE DELETE ON audit_logs BEGIN SELECT RAISE(FAIL, 'DELETE operation is strictly prohibited on immutable audit_logs (Rule #03 & Rule #16)'); END;`,
    // M18 WMS Spatial & Physical Topology Enhancements
    `ALTER TABLE warehouse_locations ADD COLUMN zone_type TEXT DEFAULT 'GENERAL'`,
    `ALTER TABLE warehouse_locations ADD COLUMN max_weight_capacity REAL DEFAULT 1000.0`,
    `ALTER TABLE warehouse_locations ADD COLUMN current_weight REAL DEFAULT 0.0`,
    `ALTER TABLE warehouse_locations ADD COLUMN max_volume_capacity REAL DEFAULT 5.0`,
    `ALTER TABLE warehouse_locations ADD COLUMN current_volume REAL DEFAULT 0.0`,
    `ALTER TABLE warehouse_locations ADD COLUMN barcode TEXT`,
    `ALTER TABLE warehouse_locations ADD COLUMN aisle_code TEXT`,
    `ALTER TABLE warehouse_locations ADD COLUMN rack_code TEXT`,
    `ALTER TABLE warehouse_locations ADD COLUMN shelf_code TEXT`,
    `ALTER TABLE warehouse_locations ADD COLUMN bin_code TEXT`,
    `ALTER TABLE warehouse_locations ADD COLUMN temperature_min REAL`,
    `ALTER TABLE warehouse_locations ADD COLUMN temperature_max REAL`,
    `ALTER TABLE warehouse_locations ADD COLUMN humidity_max REAL`,
    `ALTER TABLE products ADD COLUMN storage_condition TEXT DEFAULT 'DRY'`,
    `ALTER TABLE products ADD COLUMN unit_weight_kg REAL DEFAULT 1.0`,
    `ALTER TABLE products ADD COLUMN unit_volume_m3 REAL DEFAULT 0.005`,
    // M24 WMS Extended Columns Migration
    `ALTER TABLE wave_picks ADD COLUMN assigned_picker_id INTEGER`,
    `ALTER TABLE wave_picks ADD COLUMN progress TEXT DEFAULT '0%'`,
    `ALTER TABLE wave_picks ADD COLUMN orders_count INTEGER DEFAULT 1`,
    `ALTER TABLE wave_picks ADD COLUMN total_lines INTEGER DEFAULT 1`,
    `ALTER TABLE wave_picks ADD COLUMN zone_code TEXT DEFAULT 'ZONE-A'`,
    `ALTER TABLE wave_picks ADD COLUMN created_at INTEGER`,
    `ALTER TABLE wave_picks ADD COLUMN updated_at INTEGER`,
    `ALTER TABLE wave_pick_items ADD COLUMN product_id INTEGER`,
    `ALTER TABLE wave_pick_items ADD COLUMN product_name TEXT`,
    `ALTER TABLE wave_pick_items ADD COLUMN location_id INTEGER`,
    `ALTER TABLE wave_pick_items ADD COLUMN assigned_bin TEXT`,
    `ALTER TABLE wave_pick_items ADD COLUMN lot_no TEXT`,
    `ALTER TABLE wave_pick_items ADD COLUMN serial_no TEXT`,
    `ALTER TABLE wave_pick_items ADD COLUMN picked_qty INTEGER DEFAULT 0`,
    `ALTER TABLE wave_pick_items ADD COLUMN status TEXT DEFAULT 'PENDING'`,
    `ALTER TABLE wave_pick_items ADD COLUMN created_at INTEGER`,
    `ALTER TABLE lpn ADD COLUMN carton_size TEXT DEFAULT 'Box Medium (40x30x20cm)'`,
    `ALTER TABLE lpn ADD COLUMN weight TEXT DEFAULT '5.0 kg'`,
    `ALTER TABLE lpn ADD COLUMN so_code TEXT`,
    `ALTER TABLE lpn ADD COLUMN status TEXT DEFAULT 'PACKING'`,
    `ALTER TABLE lpn ADD COLUMN warehouse_id INTEGER`,
    `ALTER TABLE lpn ADD COLUMN location_id INTEGER`,
    `ALTER TABLE lpn ADD COLUMN sealed_by_user_id INTEGER`,
    `ALTER TABLE lpn ADD COLUMN sealed_at INTEGER`,
    `ALTER TABLE lpn ADD COLUMN created_at INTEGER`,
    `ALTER TABLE lpn ADD COLUMN updated_at INTEGER`,
    `ALTER TABLE lpn_contents ADD COLUMN product_id INTEGER`,
    `ALTER TABLE lpn_contents ADD COLUMN product_name TEXT`,
    `ALTER TABLE lpn_contents ADD COLUMN lot_no TEXT`,
    `ALTER TABLE lpn_contents ADD COLUMN serial_no TEXT`,
    `ALTER TABLE lpn_contents ADD COLUMN created_at INTEGER`,
    `ALTER TABLE dock_appointments ADD COLUMN warehouse_id INTEGER`,
    `ALTER TABLE dock_appointments ADD COLUMN dock_type TEXT DEFAULT 'INBOUND'`,
    `ALTER TABLE dock_appointments ADD COLUMN po_code TEXT`,
    `ALTER TABLE dock_appointments ADD COLUMN so_code TEXT`,
    `ALTER TABLE dock_appointments ADD COLUMN check_in_time INTEGER`,
    `ALTER TABLE dock_appointments ADD COLUMN check_out_time INTEGER`,
    `ALTER TABLE dock_appointments ADD COLUMN notes TEXT`,
    `ALTER TABLE dock_appointments ADD COLUMN created_at INTEGER`,
    `ALTER TABLE dock_appointments ADD COLUMN updated_at INTEGER`,
    // M10 Strategic Sourcing & RFQ (Phase 1) Foundation
    `CREATE TABLE IF NOT EXISTS sourcing_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Direct Materials',
      estimated_budget REAL NOT NULL DEFAULT 0,
      cost_center TEXT NOT NULL DEFAULT 'CC-PROCUREMENT',
      submission_deadline INTEGER,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      description TEXT,
      cancellation_reason TEXT,
      created_by INTEGER,
      created_at INTEGER,
      updated_at INTEGER
    )`,
    `ALTER TABLE srm_rfqs ADD COLUMN package_id INTEGER`,
    `ALTER TABLE srm_bids ADD COLUMN round_number INTEGER DEFAULT 1`,
    `CREATE INDEX IF NOT EXISTS sourcing_packages_code_idx ON sourcing_packages (package_code)`,
    `CREATE INDEX IF NOT EXISTS sourcing_packages_status_idx ON sourcing_packages (status)`,
    `CREATE INDEX IF NOT EXISTS sourcing_packages_cost_center_idx ON sourcing_packages (cost_center)`,
    `CREATE INDEX IF NOT EXISTS srm_rfqs_package_id_idx ON srm_rfqs (package_id)`,
    `CREATE INDEX IF NOT EXISTS srm_rfqs_status_idx ON srm_rfqs (status)`,
    `CREATE INDEX IF NOT EXISTS srm_rfq_items_rfq_id_idx ON srm_rfq_items (rfq_id)`,
    `CREATE INDEX IF NOT EXISTS srm_rfq_items_product_id_idx ON srm_rfq_items (product_id)`,
    `CREATE INDEX IF NOT EXISTS srm_rfq_suppliers_rfq_id_idx ON srm_rfq_suppliers (rfq_id)`,
    `CREATE INDEX IF NOT EXISTS srm_rfq_suppliers_supplier_id_idx ON srm_rfq_suppliers (supplier_id)`,
    `CREATE INDEX IF NOT EXISTS srm_bids_rfq_id_idx ON srm_bids (rfq_id)`,
    `CREATE INDEX IF NOT EXISTS srm_bids_supplier_id_idx ON srm_bids (supplier_id)`,
    `CREATE INDEX IF NOT EXISTS srm_bids_round_number_idx ON srm_bids (round_number)`,
    `CREATE INDEX IF NOT EXISTS srm_bid_items_bid_id_idx ON srm_bid_items (bid_id)`,
    `CREATE INDEX IF NOT EXISTS srm_bid_items_rfq_item_id_idx ON srm_bid_items (rfq_item_id)`,
    `CREATE INDEX IF NOT EXISTS sourcing_evaluations_rfq_id_idx ON sourcing_evaluations (rfq_id)`,
    `CREATE INDEX IF NOT EXISTS sourcing_evaluations_bid_id_idx ON sourcing_evaluations (bid_id)`,
    `CREATE INDEX IF NOT EXISTS sourcing_awards_rfq_id_idx ON sourcing_awards (rfq_id)`,
    `CREATE INDEX IF NOT EXISTS sourcing_awards_bid_id_idx ON sourcing_awards (bid_id)`,
    `CREATE INDEX IF NOT EXISTS sourcing_awards_supplier_id_idx ON sourcing_awards (supplier_id)`,
    `ALTER TABLE srm_rfqs ADD COLUMN current_round INTEGER DEFAULT 1`,
    `CREATE TABLE IF NOT EXISTS srm_auction_rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rfq_id INTEGER NOT NULL REFERENCES srm_rfqs(id),
      round_number INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      target_reduction_percent REAL DEFAULT 0,
      ceiling_price REAL,
      deadline INTEGER,
      notes TEXT,
      opened_by INTEGER REFERENCES users(id),
      opened_at INTEGER,
      closed_at INTEGER
    )`,
    `CREATE INDEX IF NOT EXISTS srm_auction_rounds_rfq_id_idx ON srm_auction_rounds (rfq_id)`,
    `CREATE INDEX IF NOT EXISTS srm_auction_rounds_round_num_idx ON srm_auction_rounds (round_number)`
  ];

  for (const stmt of migrations) {
    try {
      await client.execute(stmt);
    } catch (e) {
      // Ignore errors for already existing columns / indexes
    }
  }
}

export async function bootstrapDatabase() {
  try {
    // 0. Sanity check database integrity
    try {
      await client.execute(`PRAGMA quick_check;`);
    } catch (checkErr: any) {
      if (checkErr?.code === 'SQLITE_CORRUPT' || checkErr?.message?.includes('SQLITE_CORRUPT') || checkErr?.message?.includes('malformed')) {
        console.warn("⚠️ Detected corrupted SQLite database file! Recreating fresh database...");
        recreateDatabaseClient();
      }
    }

    // 1. Run migrations if tables don't exist
    let checkUsers;
    try {
      checkUsers = await client.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='users'`);
    } catch (usersErr: any) {
      if (usersErr?.code === 'SQLITE_CORRUPT' || usersErr?.message?.includes('SQLITE_CORRUPT') || usersErr?.message?.includes('malformed')) {
        console.warn("⚠️ Detected corrupted SQLite database file! Recreating fresh database...");
        recreateDatabaseClient();
        checkUsers = await client.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='users'`);
      } else {
        throw usersErr;
      }
    }
    if (checkUsers.rows.length === 0) {
      // Auto-generate all SQLite tables defined in schema if migrations are absent
      for (const key of Object.keys(schema)) {
        const item = (schema as any)[key];
        if (is(item, SQLiteTable)) {
          try {
            const config = getTableConfig(item);
            const colDefs = config.columns.map(c => {
              let def = `"${c.name}" ${c.getSQLType()}`;
              if (c.primary) def += " PRIMARY KEY";
              if (c.hasAutoIncrement) def += " AUTOINCREMENT";
              if (c.notNull && !c.primary && !c.hasDefault) def += " NOT NULL";
              return def;
            });
            await client.execute(`CREATE TABLE IF NOT EXISTS "${config.name}" (\n  ${colDefs.join(",\n  ")}\n);`);
          } catch (err) {
            // Ignore minor duplicate/create errors
          }
        }
      }

      const migrationFile0 = path.join(process.cwd(), 'drizzle', '0000_omniscient_nomad.sql');
      if (fs.existsSync(migrationFile0)) {
        const sql0 = fs.readFileSync(migrationFile0, 'utf8');
        const statements0 = sql0.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
        for (const s of statements0) {
          try {
            await client.execute(s);
          } catch (e: any) {
            // Ignore minor duplicate warnings
          }
        }
      }

      const migrationFile1 = path.join(process.cwd(), 'drizzle', '0001_magical_rage.sql');
      if (fs.existsSync(migrationFile1)) {
        const sql1 = fs.readFileSync(migrationFile1, 'utf8');
        const statements1 = sql1.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
        for (const s of statements1) {
          try {
            await client.execute(s);
          } catch (e: any) {
            // Ignore column exists or alter errors
          }
        }
      }
    }

    // 2. Ensure Orchestration tables
    await ensureProcessTraceabilityTablesExist();

    // Ensure schema columns are up-to-date across migrations
    await ensureSchemaSynchronized();

    await OrchestrationEngine.seedDefinitions();

    // 3. Seed Roles
    const rolesList = [
      'SUPER_ADMIN',
      'ADMIN',
      'MANAGER',
      'OPERATOR',
      'SALES',
      'ACCOUNTANT',
      'WAREHOUSE'
    ];
    for (const r of rolesList) {
      await client.execute({
        sql: `INSERT OR IGNORE INTO roles (name) VALUES (?)`,
        args: [r]
      });
    }

    // 4. Seed Standard Permissions
    const standardPerms = [
      // Auth & System
      'system.admin', 'users.read', 'users.write', 'roles.manage', 'settings.manage',
      // Inventory & Stock
      'inventory.read', 'inventory.write', 'stock.view', 'stock.adjust', 'stock.transfer', 'stock.count',
      'goods_issue.create', 'goods_issue.confirm', 'goods_issue.cancel',
      'goods_receipt.create', 'goods_receipt.confirm', 'goods_receipt.cancel',
      'stocktake.create', 'stocktake.count', 'stocktake.recount', 'stocktake.finalize',
      'stock_adjustment.create', 'stock_adjustment.approve', 'stock_adjustment.cancel',
      'lot.create', 'lot.manage', 'serial.create', 'serial.manage',
      // Purchasing & SRM
      'purchase.read', 'purchase.create', 'purchase.approve', 'purchase.cancel',
      'srm.read', 'srm.write', 'supplier.manage',
      // Sales & O2C & POS
      'sales.read', 'sales.create', 'sales.approve', 'sales.fulfill',
      'pos.sell', 'pos.refund', 'pos.manage', 'customer.manage',
      // Finance & Accounting
      'finance:read', 'finance:budget_manage', 'accounting.read', 'accounting.post', 'invoices.manage', 'payments.manage',
      // Manufacturing & EAM & Quality & Subcontracting
      'manufacturing.read', 'manufacturing.write', 'eam.read', 'eam.write', 'eam.wo_create', 'eam.wo_update',
      'quality.read', 'quality.inspect', 'quality.plan_manage',
      'subcontracting.order.view', 'subcontracting.order.create', 'subcontracting.order.approve',
      'commission.read', 'commission.manage'
    ];

    for (const p of standardPerms) {
      await client.execute({
        sql: `INSERT OR IGNORE INTO permissions (code) VALUES (?)`,
        args: [p]
      });
    }

    // Map all permissions to SUPER_ADMIN and ADMIN
    await client.execute(`
      INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.name IN ('SUPER_ADMIN', 'ADMIN')
    `);

    // Map manager permissions
    await client.execute(`
      INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.name = 'MANAGER'
      AND p.code NOT LIKE 'system.%'
    `);

    // 5. Seed Default Admin User
    const superAdminRole = await client.execute(`SELECT id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1`);
    const superAdminRoleId = superAdminRole.rows[0]?.id || 1;

    const passwordHash = bcrypt.hashSync('admin', 10);
    await client.execute({
      sql: `INSERT OR IGNORE INTO users (id, username, password_hash, role_id, status) VALUES (?, ?, ?, ?, ?)`,
      args: [1, 'admin', passwordHash, superAdminRoleId, 'ACTIVE']
    });

    // Also ensure admin user password is up to date if already exists
    await client.execute({
      sql: `UPDATE users SET password_hash = ?, status = 'ACTIVE', role_id = ? WHERE username = 'admin'`,
      args: [passwordHash, superAdminRoleId]
    });

    // 6. Seed Default Warehouse and Locations if none exist
    const whCount = await client.execute(`SELECT count(*) as count FROM warehouses`);
    if (Number(whCount.rows[0]?.count || 0) === 0) {
      await client.execute(`
        INSERT INTO warehouses (id, code, name, type, address, is_active)
        VALUES (1, 'WH-MAIN', 'Kho Tổng Trung Tâm', 'MAIN', 'Số 1 Đại Lộ Thăng Long, Hà Nội', 1)
      `);
      await client.execute(`
        INSERT INTO warehouses (id, code, name, type, address, is_active)
        VALUES (2, 'WH-SOUTH', 'Kho Chi Nhánh Miền Nam', 'BRANCH', 'Khu Công Nghiệp Tân Bình, TP.HCM', 1)
      `);

      // 6.1 Seed Full 5-tier Hierarchy for WH-MAIN if needed
      await client.execute(`
        INSERT OR IGNORE INTO warehouse_locations (id, warehouse_id, code, name, type, parent_id, zone_type, max_weight_capacity, current_weight, max_volume_capacity, current_volume, barcode, is_active, is_picking)
        VALUES 
        -- ZONES (Level 1)
        (10, 1, 'ZONE-DRY', 'Khu Khô Lưu Trữ Tổng Hợp', 'ZONE', NULL, 'DRY', 25000, 12600, 120, 65, 'ZN-WH1-DRY', 1, 1),
        (20, 1, 'ZONE-COLD', 'Khu Kho Lạnh Y Tế & Dược Phẩm (2-8°C)', 'ZONE', NULL, 'COLD', 15000, 6800, 80, 38, 'ZN-WH1-COLD', 1, 1),
        (30, 1, 'ZONE-BULKY', 'Khu Hàng Cồng Kềnh & Pallet Nặng', 'ZONE', NULL, 'BULKY', 50000, 32000, 300, 195, 'ZN-WH1-BULKY', 1, 0),
        (40, 1, 'ZONE-QC', 'Khu Vực Cách Ly KCS / IQC Chờ Thẩm Định', 'ZONE', NULL, 'QUARANTINE', 10000, 1420, 50, 8, 'ZN-WH1-QC', 1, 0),

        -- AISLES (Level 2)
        (100, 1, 'AISLE-A01', 'Dãy Aisle A01 - Kệ Chọn Nhanh', 'AISLE', 10, 'DRY', 12000, 6200, 60, 32, 'AISLE-WH1-A01', 1, 1),
        (101, 1, 'AISLE-A02', 'Dãy Aisle A02 - Kệ Lưu Trữ Phổ Thông', 'AISLE', 10, 'DRY', 13000, 6400, 60, 33, 'AISLE-WH1-A02', 1, 1),
        (200, 1, 'AISLE-C01', 'Dãy Kệ Lạnh Y Tế C01', 'AISLE', 20, 'COLD', 15000, 6800, 80, 38, 'AISLE-WH1-C01', 1, 1),
        (300, 1, 'AISLE-B01', 'Dãy Pallet Nền B01', 'AISLE', 30, 'BULKY', 50000, 32000, 300, 195, 'AISLE-WH1-B01', 1, 0),
        (400, 1, 'AISLE-Q01', 'Dãy Cách Ly KCS Q01', 'AISLE', 40, 'QUARANTINE', 10000, 1420, 50, 8, 'AISLE-WH1-Q01', 1, 0),

        -- RACKS (Level 3)
        (1000, 1, 'RACK-A01-R01', 'Giá Kệ A01-R01 (Tải Trọng Chuẩn)', 'RACK', 100, 'DRY', 6000, 3100, 30, 16, 'RACK-WH1-A01-R01', 1, 1),
        (1001, 1, 'RACK-A01-R02', 'Giá Kệ A01-R02 (Gần Đầy Tải - 94%)', 'RACK', 100, 'DRY', 5000, 4700, 25, 23, 'RACK-WH1-A01-R02', 1, 1),
        (2000, 1, 'RACK-C01-R01', 'Kệ Lạnh C01-R01 (Bảo Quản Thiết Bị)', 'RACK', 200, 'COLD', 7500, 3400, 40, 19, 'RACK-WH1-C01-R01', 1, 1),
        (3000, 1, 'RACK-B01-R01', 'Kệ Heavy-Duty Pallet B01-R01', 'RACK', 300, 'BULKY', 25000, 16000, 150, 98, 'RACK-WH1-B01-R01', 1, 0),
        (4000, 1, 'RACK-Q01-R01', 'Kệ KCS Phân Loại Lỗi Q01-R01', 'RACK', 400, 'QUARANTINE', 5000, 1420, 25, 8, 'RACK-WH1-Q01-R01', 1, 0),

        -- BINS (Level 4/5)
        (10001, 1, 'BIN-A01-01', 'Ô Kệ A01-R01-Tầng 1 (Pick Face)', 'BIN', 1000, 'DRY', 1500, 950, 5.0, 3.2, 'BIN-WH1-A01-01', 1, 1),
        (10002, 1, 'BIN-A01-02', 'Ô Kệ A01-R01-Tầng 2 (Lưu Trữ)', 'BIN', 1000, 'DRY', 1500, 1200, 5.0, 4.0, 'BIN-WH1-A01-02', 1, 1),
        (10003, 1, 'BIN-A01-03', 'Ô Kệ A01-R02-Tầng 1 (Cảnh Báo Quá Tải 96.7%)', 'BIN', 1001, 'DRY', 1500, 1450, 5.0, 4.8, 'BIN-WH1-A01-03', 1, 1),
        (20001, 1, 'BIN-C01-01', 'Ô Kệ Lạnh C01-01 (Monitor Y Tế 2-8°C)', 'BIN', 2000, 'COLD', 1200, 600, 4.0, 2.0, 'BIN-WH1-C01-01', 1, 1),
        (20002, 1, 'BIN-C01-02', 'Ô Kệ Lạnh C01-02 (Máy ECG Y Tế 2-8°C)', 'BIN', 2000, 'COLD', 1200, 750, 4.0, 2.5, 'BIN-WH1-C01-02', 1, 1),
        (30001, 1, 'BIN-B01-P01', 'Vị Trí Pallet Nền B01-P01 (Tải Trọng Lớn)', 'BIN', 3000, 'BULKY', 8000, 5400, 30.0, 22.0, 'BIN-WH1-B01-P01', 1, 0),
        (40001, 1, 'BIN-QA01', 'Ô Cách Ly KCS IQC Chờ Tái Kiểm', 'BIN', 4000, 'QUARANTINE', 2000, 420, 8.0, 2.0, 'BIN-WH1-QA01', 1, 0)
      `);
    }

    // 6.2 Ensure products have storage conditions and unit weights configured
    await client.execute(`
      UPDATE products SET storage_condition = 'COLD', unit_weight_kg = 8.5 WHERE sku = 'SKU-MED-MON' OR name LIKE '%Monitor%' OR name LIKE '%màn hình theo dõi%'
    `);
    await client.execute(`
      UPDATE products SET storage_condition = 'COLD', unit_weight_kg = 5.2 WHERE sku = 'SKU-MED-ECG' OR name LIKE '%ECG%' OR name LIKE '%Điện tim%'
    `);
    await client.execute(`
      UPDATE products SET storage_condition = 'DRY', unit_weight_kg = 0.15 WHERE sku = 'SKU-RAM-16G' OR name LIKE '%RAM%'
    `);
    await client.execute(`
      UPDATE products SET storage_condition = 'DRY', unit_weight_kg = 0.08 WHERE sku = 'SKU-SSD-1TB' OR name LIKE '%SSD%'
    `);
    await client.execute(`
      UPDATE products SET storage_condition = 'BULKY', unit_weight_kg = 45.0 WHERE name LIKE '%Máy siêu âm%' OR name LIKE '%Server%'
    `);

    // 7. Seed Default Categories & Sample Products if none exist
    const categoryNames = Array.from(new Set(ENTERPRISE_MASTER_PRODUCTS.map(p => p.category || 'Chung')));
    for (let i = 0; i < categoryNames.length; i++) {
      await client.execute({
        sql: `INSERT OR IGNORE INTO categories (name) VALUES (?)`,
        args: [categoryNames[i]]
      });
    }

    const allCategoriesRes = await client.execute(`SELECT id, name FROM categories`);
    const categoryMap = new Map((allCategoriesRes.rows as any[]).map(r => [r.name, r.id]));

    const prodCount = await client.execute(`SELECT count(*) as count FROM products`);
    if (Number(prodCount.rows[0]?.count || 0) < ENTERPRISE_MASTER_PRODUCTS.length) {
      for (let i = 0; i < ENTERPRISE_MASTER_PRODUCTS.length; i++) {
        const p = ENTERPRISE_MASTER_PRODUCTS[i];
        const prodId = i + 1;
        const catId = (categoryMap.get(p.category) as number) || 1;
        await client.execute({
          sql: `INSERT OR REPLACE INTO products (id, sku, name, category_id, base_unit, retail_price, cost_price, status, stock_physical, stock_reserved, stock_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [prodId, p.sku, p.name, catId, p.unit, p.retailPrice, p.costPrice, p.status, p.stock, Math.floor(p.stock * 0.1), p.stock - Math.floor(p.stock * 0.1)]
        });

        await client.execute({
          sql: `INSERT OR REPLACE INTO stock_balances (product_id, warehouse_id, location_id, stock_physical, stock_reserved, stock_available) VALUES (?, 1, 1, ?, ?, ?)`,
          args: [prodId, p.stock, Math.floor(p.stock * 0.1), p.stock - Math.floor(p.stock * 0.1)]
        });
      }
    }

    // 8. Seed Work Centers & BOMs if none exist
    const wcCount = await client.execute(`SELECT count(*) as count FROM work_centers`);
    if (Number(wcCount.rows[0]?.count || 0) === 0) {
      await client.execute(`
        INSERT INTO work_centers (id, code, name, capacity, cost_rate_per_hour, status)
        VALUES (1, 'WC-SMT-01', 'Xưởng Bo Mạch SMT Surface-Mount', 120, 350000, 'ACTIVE')
      `);
      await client.execute(`
        INSERT INTO work_centers (id, code, name, capacity, cost_rate_per_hour, status)
        VALUES (2, 'WC-ASSY-02', 'Dây chuyền Lắp ráp & Hoàn thiện', 80, 280000, 'ACTIVE')
      `);
      await client.execute(`
        INSERT INTO work_centers (id, code, name, capacity, cost_rate_per_hour, status)
        VALUES (3, 'WC-QC-03', 'Phòng Thử nghiệm & Kiểm chuẩn QC', 100, 300000, 'ACTIVE')
      `);
    }

    const bomCount = await client.execute(`SELECT count(*) as count FROM boms`);
    if (Number(bomCount.rows[0]?.count || 0) === 0) {
      await client.execute(`
        INSERT INTO boms (id, code, product_id, name, uom, quantity, status, version, notes)
        VALUES (1, 'BOM-LAPTOP-XPS15-V1', 1, 'Định mức sản xuất Laptop Dell XPS 15 Core i7', 'Chiếc', 1, 'ACTIVE', 'V1.0', 'Định mức kỹ thuật tiêu chuẩn lắp ráp máy tính cao cấp')
      `);
      await client.execute(`
        INSERT INTO bom_items (bom_id, material_product_id, quantity, uom, scrap_rate, operation_sequence, warehouse_id)
        VALUES (1, 3, 2, 'Cuộn', 1.5, 10, 1)
      `);
      await client.execute(`
        INSERT INTO bom_items (bom_id, material_product_id, quantity, uom, scrap_rate, operation_sequence, warehouse_id)
        VALUES (1, 4, 2, 'Thanh', 0.5, 20, 1)
      `);
      await client.execute(`
        INSERT INTO bom_items (bom_id, material_product_id, quantity, uom, scrap_rate, operation_sequence, warehouse_id)
        VALUES (1, 5, 1, 'Chiếc', 0.2, 20, 1)
      `);
      await client.execute(`
        INSERT INTO bom_items (bom_id, material_product_id, quantity, uom, scrap_rate, operation_sequence, warehouse_id)
        VALUES (1, 6, 1, 'Bộ', 1.0, 30, 1)
      `);

      await client.execute(`
        INSERT INTO routings (product_id, sequence, operation_name, work_center_id, planned_time_minutes, description)
        VALUES (1, 10, 'Gia công & Hàn chíp SMT', 1, 45, 'Hàn vi điều khiển & mạch nguồn SMT')
      `);
      await client.execute(`
        INSERT INTO routings (product_id, sequence, operation_name, work_center_id, planned_time_minutes, description)
        VALUES (1, 20, 'Lắp ráp mô-đun RAM & SSD', 2, 30, 'Cố định thanh RAM 16GB, SSD 512GB vào khung máy')
      `);
      await client.execute(`
        INSERT INTO routings (product_id, sequence, operation_name, work_center_id, planned_time_minutes, description)
        VALUES (1, 30, 'Đóng vỏ & Kiểm định Burn-in Test', 3, 60, 'Chạy stress test và kiểm tra ngoại quan đạt chuẩn')
      `);
    }

    const moCount = await client.execute(`SELECT count(*) as count FROM manufacturing_orders`);
    if (Number(moCount.rows[0]?.count || 0) === 0) {
      await client.execute(`
        INSERT INTO manufacturing_orders (id, code, product_id, bom_id, bom_version, planned_quantity, produced_quantity, scrap_quantity, uom, warehouse_id, raw_warehouse_id, work_center_id, priority, status, planned_start_date, planned_end_date, notes)
        VALUES (1, 'MO-2026-0010', 1, 1, 'V1.0', 25, 20, 1, 'Chiếc', 1, 1, 2, 'HIGH', 'IN_PROGRESS', '2026-08-25', '2026-08-30', 'Lô sản xuất đơn đặt hàng Doanh nghiệp FPT Telecom')
      `);
      await client.execute(`
        INSERT INTO manufacturing_orders (id, code, product_id, bom_id, bom_version, planned_quantity, produced_quantity, scrap_quantity, uom, warehouse_id, raw_warehouse_id, work_center_id, priority, status, planned_start_date, planned_end_date, notes)
        VALUES (2, 'MO-2026-0011', 1, 1, 'V1.0', 15, 0, 0, 'Chiếc', 1, 1, 1, 'NORMAL', 'RELEASED', '2026-08-28', '2026-09-05', 'Kế hoạch bổ sung kho an toàn Q3')
      `);
      await client.execute(`
        INSERT INTO manufacturing_orders (id, code, product_id, bom_id, bom_version, planned_quantity, produced_quantity, scrap_quantity, uom, warehouse_id, raw_warehouse_id, work_center_id, priority, status, planned_start_date, planned_end_date, notes)
        VALUES (3, 'MO-2026-0012', 1, 1, 'V1.0', 10, 10, 0, 'Chiếc', 1, 1, 2, 'NORMAL', 'COMPLETED', '2026-08-15', '2026-08-20', 'Đã hoàn tất nghiệm thu & nhập kho thành phẩm')
      `);

      // Material reservations & consumptions for MO 1
      await client.execute(`
        INSERT INTO material_reservations (mo_id, material_product_id, required_quantity, reserved_quantity, uom, status)
        VALUES (1, 3, 50, 50, 'Cuộn', 'RESERVED')
      `);
      await client.execute(`
        INSERT INTO material_reservations (mo_id, material_product_id, required_quantity, reserved_quantity, uom, status)
        VALUES (1, 4, 50, 50, 'Thanh', 'RESERVED')
      `);
      await client.execute(`
        INSERT INTO material_reservations (mo_id, material_product_id, required_quantity, reserved_quantity, uom, status)
        VALUES (1, 5, 25, 25, 'Chiếc', 'RESERVED')
      `);
      await client.execute(`
        INSERT INTO material_reservations (mo_id, material_product_id, required_quantity, reserved_quantity, uom, status)
        VALUES (1, 6, 25, 25, 'Bộ', 'RESERVED')
      `);

      await client.execute(`
        INSERT INTO production_costs (mo_id, material_cost, labor_cost, machine_cost, overhead_cost, total_cost, produced_qty, unit_cost, standard_unit_cost, variance)
        VALUES (1, 480000000, 35000000, 28000000, 12000000, 555000000, 20, 27750000, 26000000, 1750000)
      `);
    }

    // 9. Seed Demand Forecasts & Supply Plans (MRP) if none exist
    const planCount = await client.execute(`SELECT count(*) as count FROM supply_plans`);
    if (Number(planCount.rows[0]?.count || 0) === 0) {
      await client.execute(`
        INSERT INTO demand_forecasts (forecast_code, period, product_id, product_name, warehouse_id, historical_avg_demand, forecast_quantity, forecast_method, accuracy_mae, accuracy_mape)
        VALUES ('FST-2026-08', 'MONTHLY', 1, 'Laptop Dell XPS 15', 1, 42, 50, 'EXPONENTIAL_SMOOTHING', 3.2, 4.1)
      `);
      await client.execute(`
        INSERT INTO demand_forecasts (forecast_code, period, product_id, product_name, warehouse_id, historical_avg_demand, forecast_quantity, forecast_method, accuracy_mae, accuracy_mape)
        VALUES ('FST-2026-09', 'MONTHLY', 2, 'Chuột Không Dây Logitech MX Master 3S', 1, 110, 130, 'MOVING_AVERAGE', 5.0, 3.8)
      `);

      await client.execute(`
        INSERT INTO supply_plans (plan_code, product_id, product_name, warehouse_id, current_stock, reserved_stock, incoming_po_qty, incoming_mo_qty, forecast_demand, net_requirement, reorder_point, safety_stock, recommended_purchase_qty, recommended_production_qty, status)
        VALUES ('PLN-2026-001', 1, 'Laptop Dell XPS 15', 1, 45, 5, 0, 25, 50, 0, 20, 10, 0, 15, 'APPROVED')
      `);
      await client.execute(`
        INSERT INTO supply_plans (plan_code, product_id, product_name, warehouse_id, current_stock, reserved_stock, incoming_po_qty, incoming_mo_qty, forecast_demand, net_requirement, reorder_point, safety_stock, recommended_purchase_qty, recommended_production_qty, status)
        VALUES ('PLN-2026-002', 3, 'Vi điều khiển STM32F407 (Cuộn 100 cái)', 1, 80, 50, 20, 0, 70, 20, 40, 20, 50, 0, 'DRAFT')
      `);
      await client.execute(`
        INSERT INTO supply_plans (plan_code, product_id, product_name, warehouse_id, current_stock, reserved_stock, incoming_po_qty, incoming_mo_qty, forecast_demand, net_requirement, reorder_point, safety_stock, recommended_purchase_qty, recommended_production_qty, status)
        VALUES ('PLN-2026-003', 4, 'Thanh RAM DDR4 16GB Crucial', 1, 150, 50, 0, 0, 120, 20, 50, 30, 100, 0, 'DRAFT')
      `);
    }

    // 10. Seed Assets & Maintenance Work Orders if none exist
    const assetCount = await client.execute(`SELECT count(*) as count FROM assets`);
    if (Number(assetCount.rows[0]?.count || 0) === 0) {
      await client.execute(`
        INSERT INTO asset_categories (id, code, name, description)
        VALUES (1, 'CAT-SMT', 'Máy Móc Dây Chuyền SMT', 'Thiết bị tự động gắn linh kiện dán bề mặt')
      `);
      await client.execute(`
        INSERT INTO asset_categories (id, code, name, description)
        VALUES (2, 'CAT-CNC', 'Máy Gia Công Cơ Khí CNC', 'Máy phay cắt khung nhôm chính xác cao')
      `);

      await client.execute(`
        INSERT INTO assets (id, code, name, category_id, category_name, serial_number, model, manufacturer, purchase_date, purchase_cost, book_value, location, status)
        VALUES (1, 'AST-0001', 'Máy Gắn Chíp SMT Tự Động Yamaha YSM20R', 1, 'Máy Móc Dây Chuyền SMT', 'SN-YMH-2024-889', 'YSM20R Dual Beam', 'Yamaha Motor Corp', '2024-03-15', 1850000000, 1520000000, 'Xưởng SMT - Dây chuyền 1', 'ACTIVE')
      `);
      await client.execute(`
        INSERT INTO assets (id, code, name, category_id, category_name, serial_number, model, manufacturer, purchase_date, purchase_cost, book_value, location, status)
        VALUES (2, 'AST-0002', 'Máy Phay Nhôm CNC 5 Trục Fanuc Robodrill', 2, 'Máy Gia Công Cơ Khí CNC', 'SN-FNC-2023-412', 'Robodrill D21LiB5', 'FANUC Japan', '2023-11-20', 1250000000, 980000000, 'Xưởng Cơ Khí Chế Tạo', 'IN_USE')
      `);
      await client.execute(`
        INSERT INTO assets (id, code, name, category_id, category_name, serial_number, model, manufacturer, purchase_date, purchase_cost, book_value, location, status)
        VALUES (3, 'AST-0003', 'Tủ Thử Nghiệm Sốc Nhiệt Khí Hậu ESPEC', 1, 'Máy Móc Dây Chuyền SMT', 'SN-ESP-2025-101', 'Platinous Series', 'ESPEC Corp', '2025-01-10', 450000000, 420000000, 'Phòng Lab QC Test', 'ACTIVE')
      `);

      await client.execute(`
        INSERT INTO maintenance_plans (id, asset_id, plan_code, title, maintenance_type, interval_days, description, last_performed_date, next_due_date)
        VALUES (1, 1, 'PM-SMT-MONTHLY', 'Bảo dưỡng tra dầu & hiệu chuẩn đầu gắp SMT định kỳ', 'PREVENTIVE', 30, 'Vệ sinh quang học camera, tra mỡ trục vít me, cân chỉnh nozzle', '2026-08-01', '2026-08-31')
      `);
      await client.execute(`
        INSERT INTO maintenance_work_orders (id, wo_code, asset_id, asset_name, maintenance_type, priority, description, assigned_technician_name, planned_start, planned_end, status, total_cost, downtime_hours)
        VALUES (1, 'WO-2026-0001', 1, 'Máy Gắn Chíp SMT Tự Động Yamaha YSM20R', 'PREVENTIVE', 'NORMAL', 'Bảo dưỡng định kỳ tháng 8/2026', 'Kỹ thuật viên Trần Văn Hùng', '2026-08-30 08:00', '2026-08-30 12:00', 'ASSIGNED', 3500000, 4.0)
      `);
      await client.execute(`
        INSERT INTO maintenance_work_orders (id, wo_code, asset_id, asset_name, maintenance_type, priority, description, assigned_technician_name, planned_start, planned_end, status, total_cost, downtime_hours)
        VALUES (2, 'WO-2026-0002', 2, 'Máy Phay Nhôm CNC 5 Trục Fanuc Robodrill', 'CORRECTIVE', 'HIGH', 'Thay chổi than động cơ trục chính & lọc dầu', 'Kỹ thuật viên Lê Quốc Tuấn', '2026-08-20 14:00', '2026-08-20 17:30', 'COMPLETED', 7200000, 3.5)
      `);
    }

    // 11. Seed Audit Logs if none exist
    const auditCount = await client.execute(`SELECT count(*) as count FROM audit_logs`);
    if (Number(auditCount.rows[0]?.count || 0) === 0) {
      await client.execute(`
        INSERT INTO audit_logs (id, audit_code, user_id, username, role, module, action, entity_type, entity_id, result, before_data, after_data, created_at)
        VALUES (1, 'AUD-2026-0001', 1, 'admin', 'SUPER_ADMIN', 'INVENTORY', 'CREATE', 'Product', '1', 'SUCCESS', '{"status":"DRAFT"}', '{"status":"ACTIVE","sku":"SKU-LAPTOP-01"}', 1724832000)
      `);
      await client.execute(`
        INSERT INTO audit_logs (id, audit_code, user_id, username, role, module, action, entity_type, entity_id, result, before_data, after_data, created_at)
        VALUES (2, 'AUD-2026-0002', 1, 'admin', 'SUPER_ADMIN', 'MANUFACTURING', 'APPROVE', 'ManufacturingOrder', '1', 'SUCCESS', '{"status":"RELEASED"}', '{"status":"IN_PROGRESS"}', 1724835600)
      `);
      await client.execute(`
        INSERT INTO audit_logs (id, audit_code, user_id, username, role, module, action, entity_type, entity_id, result, before_data, after_data, created_at)
        VALUES (3, 'AUD-2026-0003', 2, 'cfo', 'ACCOUNTANT', 'FINANCE', 'POST', 'Invoice', '102', 'PERMISSION_DENIED', '{"status":"PENDING"}', '{"status":"LOCKED"}', 1724839200)
      `);
    }

    // 12. Seed M36 Logistics & Fleet (Vehicles, Drivers, Transport Orders, POD, Fuel)
    const vehicleCount = await client.execute(`SELECT count(*) as count FROM vehicles`);
    if (Number(vehicleCount.rows[0]?.count || 0) === 0) {
      await client.execute(`
        INSERT INTO vehicles (id, code, plate_number, vehicle_type, capacity_kg, fuel_type, status, mileage_km)
        VALUES (1, 'VEH-001', '29C-882.14', 'TRUCK_5T', 5000, 'DIESEL', 'ACTIVE', 45200)
      `);
      await client.execute(`
        INSERT INTO vehicles (id, code, plate_number, vehicle_type, capacity_kg, fuel_type, status, mileage_km)
        VALUES (2, 'VEH-002', '51D-993.82', 'CONTAINER_20T', 20000, 'DIESEL', 'IN_USE', 112500)
      `);
      await client.execute(`
        INSERT INTO vehicles (id, code, plate_number, vehicle_type, capacity_kg, fuel_type, status, mileage_km)
        VALUES (3, 'VEH-003', '29H-441.05', 'VAN_1.5T', 1500, 'DIESEL', 'ACTIVE', 28400)
      `);
      await client.execute(`
        INSERT INTO vehicles (id, code, plate_number, vehicle_type, capacity_kg, fuel_type, status, mileage_km)
        VALUES (4, 'VEH-004', '60C-552.19', 'COLD_TRUCK_3.5T', 3500, 'DIESEL', 'MAINTENANCE', 84300)
      `);

      await client.execute(`
        INSERT INTO drivers (id, code, full_name, phone, license_number, license_expiry_date, status)
        VALUES (1, 'DRV-001', 'Nguyễn Văn Tài', '0912 334 556', 'FC-992144', '2028-12-31', 'AVAILABLE')
      `);
      await client.execute(`
        INSERT INTO drivers (id, code, full_name, phone, license_number, license_expiry_date, status)
        VALUES (2, 'DRV-002', 'Trần Văn Hùng', '0988 776 655', 'C-881204', '2027-06-30', 'ON_TRIP')
      `);
      await client.execute(`
        INSERT INTO drivers (id, code, full_name, phone, license_number, license_expiry_date, status)
        VALUES (3, 'DRV-003', 'Lê Hoàng Vũ', '0903 221 144', 'C-774129', '2029-01-15', 'AVAILABLE')
      `);
      await client.execute(`
        INSERT INTO drivers (id, code, full_name, phone, license_number, license_expiry_date, status)
        VALUES (4, 'DRV-004', 'Đặng Quốc Tuấn', '0934 551 122', 'B2-551029', '2030-05-20', 'ON_LEAVE')
      `);

      await client.execute(`
        INSERT INTO transport_orders (id, order_code, sales_order_id, customer_name, origin_address, destination_address, weight_kg, volume_cbm, vehicle_id, driver_id, planned_date, status, freight_cost, fuel_cost)
        VALUES (1, 'TRP-2026-001', 101, 'Tập đoàn Viettel Post', 'Kho Tổng HQ Hà Nội (WH-MAIN)', 'Kho Trung tâm Viettel Post Nam Từ Liêm', 3500, 14.5, 1, 1, '2026-08-28', 'DELIVERED', 4500000, 1200000)
      `);
      await client.execute(`
        INSERT INTO transport_orders (id, order_code, sales_order_id, customer_name, origin_address, destination_address, weight_kg, volume_cbm, vehicle_id, driver_id, planned_date, status, freight_cost, fuel_cost)
        VALUES (2, 'TRP-2026-002', 102, 'Công ty Điện máy Nguyễn Kim', 'Kho Chi Nhánh Miền Nam (WH-SOUTH)', 'Showroom Nguyễn Kim Quận 1, TP.HCM', 12000, 45.0, 2, 2, '2026-08-28', 'IN_TRANSIT', 12500000, 3800000)
      `);
      await client.execute(`
        INSERT INTO transport_orders (id, order_code, sales_order_id, customer_name, origin_address, destination_address, weight_kg, volume_cbm, vehicle_id, driver_id, planned_date, status, freight_cost, fuel_cost)
        VALUES (3, 'TRP-2026-003', 103, 'Chuỗi Siêu thị WinMart', 'Kho Tổng HQ Hà Nội (WH-MAIN)', 'WinMart Times City Hai Bà Trưng', 1100, 5.2, 3, 3, '2026-08-29', 'ASSIGNED', 1800000, 450000)
      `);
      await client.execute(`
        INSERT INTO transport_orders (id, order_code, sales_order_id, customer_name, origin_address, destination_address, weight_kg, volume_cbm, vehicle_id, driver_id, planned_date, status, freight_cost, fuel_cost)
        VALUES (4, 'TRP-2026-004', 104, 'Công ty Thực phẩm CP Việt Nam', 'Kho Đông Lạnh Bình Dương', 'Tổng kho CP Hà Nội', 3200, 12.0, 4, 1, '2026-08-30', 'PLANNED', 8900000, 2400000)
      `);

      await client.execute(`
        INSERT INTO proof_of_deliveries (id, transport_order_id, receiver_name, signature_url, photo_url, delivered_at, status, failure_reason, notes)
        VALUES (1, 1, 'Phạm Văn Minh (Trưởng ca kho Viettel)', 'https://signature.api/sig_vt_001.png', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500', '2026-08-28 10:15:00', 'DELIVERED_SUCCESS', NULL, 'Đã bàn giao đủ 120 kiện linh kiện, tem seal niêm phong còn nguyên vẹn.')
      `);

      await client.execute(`
        INSERT INTO fuel_transactions (id, vehicle_id, plate_number, driver_id, fuel_date, liters, price_per_liter, total_amount, mileage_at_refuel)
        VALUES (1, 1, '29C-882.14', 1, '2026-08-27', 85.5, 21500, 1838250, 45120)
      `);
      await client.execute(`
        INSERT INTO fuel_transactions (id, vehicle_id, plate_number, driver_id, fuel_date, liters, price_per_liter, total_amount, mileage_at_refuel)
        VALUES (2, 2, '51D-993.82', 2, '2026-08-27', 210.0, 21500, 4515000, 112350)
      `);
    }

    // Seed Cash Vouchers
    const cvCount = await client.execute(`SELECT COUNT(*) as count FROM cash_vouchers`);
    if (Number(cvCount.rows[0]?.count || 0) === 0) {
      await client.execute(`
        INSERT INTO cash_vouchers (id, voucher_code, voucher_type, partner_type, partner_name, amount, bank_account_id, bank_name, payment_method, status, date, reason, accounting_entry, created_by, approved_by) VALUES
        (1, 'PT-2026-0089', 'RECEIPT', 'CUSTOMER', 'Công ty Cổ phần MISA', 120000000, 1, 'Vietcombank (VCB)', 'BANK_TRANSFER', 'APPROVED', '2026-08-27', 'Thu tiền thanh toán Hóa đơn AR-2026-0042', 'Nợ 1121 / Có 131', 'Kế toán Thu - Nguyễn Văn A', 'CFO - Nguyễn Thị Hương'),
        (2, 'PC-2026-0045', 'PAYMENT', 'SUPPLIER', 'Tập đoàn Điện Lực Việt Nam EVN', 35000000, 2, 'MB Bank (MBB)', 'BANK_TRANSFER', 'APPROVED', '2026-08-26', 'Chi trả tiền điện sản xuất Xưởng CNC Tháng 08/2026', 'Nợ 6427 / Có 1121', 'Kế toán Chi - Lê Thị B', 'CFO - Nguyễn Thị Hương')
      `);
    }

    // Seed DMS Documents
    const dmsCount = await client.execute(`SELECT COUNT(*) as count FROM dms_documents`);
    if (Number(dmsCount.rows[0]?.count || 0) === 0) {
      await client.execute(`
        INSERT INTO dms_documents (id, doc_code, title, category, category_name, version, file_size, format, status, security_level, sha256_hash, signed_by, signed_at, linked_module, ref_doc_no, storage_tier, retention_years, expire_date, workflow_stage, workflow_steps) VALUES
        (1, 'DMS-CON-2026-001', 'Hợp đồng Kinh tế Viettel Post Q3', 'CONTRACT', 'Hợp đồng Kinh tế', 'v1.2', '2.4 MB', 'PDF', 'SIGNED', 'CONFIDENTIAL', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'Hoàng Nam (Admin) - Token HSM CA', '2026-08-27 10:15:00', 'M13 Sales Orders', 'SO-2026-001', 'ACTIVE_VAULT', 10, '2036-08-27', 3, '[{"step":1,"name":"Khởi tạo","status":"COMPLETED"},{"step":2,"name":"Pháp chế duyệt","status":"COMPLETED"},{"step":3,"name":"Ký số CA","status":"COMPLETED"}]'),
        (2, 'DMS-INV-2026-089', 'Hóa đơn Điện tử VAT Samsung', 'INVOICE', 'Hóa đơn GTGT', 'v1.0', '1.1 MB', 'XML', 'APPROVED', 'INTERNAL', 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', 'Tổng cục Thuế MIV', '2026-08-28 09:30:00', 'M08 Purchase Orders', 'PO-2026-089', 'ACTIVE_VAULT', 10, '2036-08-28', 3, '[]'),
        (3, 'DMS-SPE-2026-012', 'Tiêu chuẩn Kỹ thuật Sản phẩm Thép 18mm', 'SPECIFICATION', 'Hồ sơ Kỹ thuật', 'v2.0', '5.8 MB', 'PDF', 'ACTIVE', 'INTERNAL', '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d', 'Phòng R&D', '2026-08-20 14:00:00', 'M06 Innovation R&D', 'SPEC-ST-18', 'COLD_GLACIER', 15, '2041-08-20', 3, '[]')
      `);
    }

    // Seed Credit Notes & Debit Notes
    const cnCount = await client.execute(`SELECT COUNT(*) as count FROM credit_notes`);
    if (Number(cnCount.rows[0]?.count || 0) === 0) {
      await client.execute(`
        INSERT INTO credit_notes (id, credit_note_number, original_invoice_number, customer_name, amount, vat_amount, final_amount, rma_code, reason, status, date, accounting_entry) VALUES
        (1, 'CN-2026-001', 'HD-AR-2026-042', 'Công ty Cổ phần MISA', 15000000, 1500000, 16500000, 'RMA-2026-008', 'Hàng lỗi kỹ thuật đợt giao 25/08 - Giảm trừ công nợ AR', 'APPROVED', '2026-08-27', 'Nợ 5212, Nợ 3331 / Có 131'),
        (2, 'CN-2026-002', 'HD-AR-2026-045', 'Công ty TNHH Phong Vũ', 8000000, 800000, 8800000, 'RMA-2026-012', 'Chiết khấu thương mại do đạt sản lượng Quý 2', 'ISSUED', '2026-08-28', 'Nợ 5211, Nợ 3331 / Có 131')
      `);
    }

    const dnCount = await client.execute(`SELECT COUNT(*) as count FROM debit_notes`);
    if (Number(dnCount.rows[0]?.count || 0) === 0) {
      await client.execute(`
        INSERT INTO debit_notes (id, debit_note_number, original_invoice_number, supplier_name, amount, vat_amount, final_amount, purchase_return_code, reason, status, date, accounting_entry) VALUES
        (1, 'DN-2026-001', 'HD-AP-2026-991', 'Tập đoàn Điện Lực Việt Nam EVN', 5000000, 500000, 5500000, 'PRT-2026-004', 'Trả lại vật tư không đạt chứng chỉ CO/CQ - Giảm nợ AP', 'APPROVED', '2026-08-26', 'Nợ 331 / Có 152, Có 1331')
      `);
    }

    const aeCount = await client.execute(`SELECT COUNT(*) as count FROM accounting_events`);
    if (Number(aeCount.rows[0]?.count || 0) === 0) {
      await client.execute(`
        INSERT INTO accounting_events (id, event_id, source_module, event_type, invoice_number, partner_name, amount, vat_amount, total_amount, accounting_status, gl_journal_id, timestamp, entry_rules) VALUES
        (1, 'FE-2026-0881', 'SALES_O2C', 'INVOICE_ISSUED', 'HD-AR-2026-042', 'Công ty Cổ phần MISA', 120000000, 12000000, 132000000, 'POSTED_TO_GL', 'GL-2026-0912', '2026-08-27 10:15:00', 'Nợ 131: 132M / Có 511: 120M, Có 3331: 12M'),
        (2, 'FE-2026-0882', 'RMA_RETURNS', 'CREDIT_NOTE_ISSUED', 'CN-2026-001', 'Công ty Cổ phần MISA', 15000000, 1500000, 16500000, 'POSTED_TO_GL', 'GL-2026-0915', '2026-08-27 14:30:00', 'Nợ 5212: 15M, Nợ 3331: 1.5M / Có 131: 16.5M')
      `);
    }

    // Seed Pricing Tables
    const plCount = await client.execute(`SELECT COUNT(*) as count FROM price_lists`);
    if (Number(plCount.rows[0]?.count || 0) === 0) {
      await client.execute(`
        INSERT INTO price_lists (id, code, name, type, currency, customer_group_id, valid_from, valid_to, status, priority) VALUES
        ('PL-001', 'RETAIL-STD', 'Bảng giá Bán lẻ Tiêu chuẩn', 'RETAIL', 'VND', NULL, '2026-01-01', '2026-12-31', 'ACTIVE', 1),
        ('PL-002', 'VIP-AGENT', 'Bảng giá Đại lý Cấp VIP', 'WHOLESALE', 'VND', 'VIP', '2026-01-01', '2026-12-31', 'ACTIVE', 10)
      `);

      await client.execute(`
        INSERT INTO price_list_items (price_list_id, product_id, uom_id, min_qty, max_qty, unit_price, currency, valid_from, valid_to) VALUES
        ('PL-001', 'SKU-STEEL-18', 'PCS', 1, 9, 285000, 'VND', '2026-01-01', '2026-12-31'),
        ('PL-001', 'SKU-STEEL-18', 'PCS', 10, 49, 275000, 'VND', '2026-01-01', '2026-12-31'),
        ('PL-001', 'SKU-STEEL-18', 'PCS', 50, 99999, 260000, 'VND', '2026-01-01', '2026-12-31'),
        ('PL-001', 'SKU-CEMENT-PCB40', 'BAG', 1, 9999, 88000, 'VND', '2026-01-01', '2026-12-31'),
        ('PL-001', 'SKU-GYPSUM-12', 'PCS', 1, 9999, 165000, 'VND', '2026-01-01', '2026-12-31'),
        ('PL-002', 'SKU-STEEL-18', 'PCS', 1, 99999, 245000, 'VND', '2026-01-01', '2026-12-31'),
        ('PL-002', 'SKU-CEMENT-PCB40', 'BAG', 1, 99999, 79000, 'VND', '2026-01-01', '2026-12-31')
      `);

      await client.execute(`
        INSERT INTO customer_contract_prices (id, customer_id, product_id, uom_id, contract_price, currency, valid_from, valid_to, contract_code) VALUES
        ('CON-001', 'CUST-HOABINH', 'SKU-STEEL-18', 'PCS', 220000, 'VND', '2026-01-01', '2026-12-31', 'HB-STEEL-2026')
      `);

      await client.execute(`
        INSERT INTO discount_rules (id, code, name, type, value, product_id, valid_from, valid_to, is_active) VALUES
        ('DISC-PROJECT', 'PROJECT-OFFER', 'Chiết khấu Dự án đặc thù', 'PERCENTAGE', 5, 'SKU-STEEL-18', '2026-01-01', '2026-12-31', 1)
      `);

      await client.execute(`
        INSERT INTO promotion_campaigns (id, code, name, category_scope, discount_percentage, min_qty, customer_group_id, valid_from, valid_to, is_active) VALUES
        ('PROM-SUMMER', 'SUMMER-STEEL', 'Chiến dịch Sắt Thép hè 2026', 'CONSTRUCTION_STEEL', 2, 20, 'VIP', '2026-06-01', '2026-08-31', 1)
      `);

      await client.execute(`
        INSERT INTO margin_policies (product_id, target_margin_percent, min_margin_percent) VALUES
        ('SKU-STEEL-18', 20, 12),
        ('SKU-CEMENT-PCB40', 15, 10),
        ('SKU-GYPSUM-12', 25, 15)
      `);
    }

    // Seed Bank Accounts and Bank Statements / Transactions
    const bankAccCount = await client.execute(`SELECT COUNT(*) as count FROM bank_accounts`);
    if (Number(bankAccCount.rows[0]?.count || 0) === 0) {
      await client.execute(`
        INSERT INTO bank_accounts (id, bank_name, account_number, account_name, currency, is_active) VALUES
        (1, 'Vietcombank (VCB) - Chi Nhánh Hoàn Kiếm', '0011004328888', 'CÔNG TY CP NEXUSSYNC ERP', 'VND', 1),
        (2, 'MB Bank (MBB) - Chi Nhánh Mẫu Sơn', '888899992026', 'CÔNG TY CP NEXUSSYNC ERP', 'VND', 1),
        (3, 'Techcombank (TCB) - Chi Nhánh Hà Nội', '1903882716201', 'CÔNG TY CP NEXUSSYNC ERP', 'VND', 1)
      `);

      await client.execute(`
        INSERT INTO bank_transactions (id, bank_account_id, bank_transaction_id, amount, reference, transaction_date, status) VALUES
        (1, 1, 'FT2624098123912', 176000000, 'CT VINTECH CORP THANH TOAN HD INV-AR-UNIFIED-859744', 1787889300000, 'UNMATCHED'),
        (2, 1, 'FT2624098123915', -110000000, 'THANH TOAN TIEN MUA NVL HOADON INV-AP-UNIFIED-859744 MINH PHAT', 1787893800000, 'UNMATCHED'),
        (3, 1, 'FT2624098124001', 65000000, 'CCTY PHONG VU CHUYEN TIEN DAT COC SO-2026-018', 1787907600000, 'UNMATCHED'),
        (4, 1, 'FT2624098124088', -1250000, 'PHI DICH VU QUAN LY TAI KHOAN DOANH NGHIEP THANG 08/2026', 1787913600000, 'UNMATCHED')
      `);
    }

    // Seed M24 WMS Extended (Wave picks, LPNs, Dock Appointments)
    const waveCount = await client.execute(`SELECT COUNT(*) as count FROM wave_picks`);
    if (Number(waveCount.rows[0]?.count || 0) === 0) {
      const nowSec = Math.floor(Date.now() / 1000);
      await client.execute(`
        INSERT INTO wave_picks (id, wave_code, warehouse_id, zone_code, orders_count, total_lines, status, progress, created_at) VALUES
        (1, 'WAVE-2026-001', 1, 'ZONE-A (Linh Kiện)', 3, 4, 'IN_PROGRESS', '50%', ${nowSec}),
        (2, 'WAVE-2026-002', 1, 'ZONE-B (Thành Phẩm)', 2, 2, 'PLANNING', '0%', ${nowSec}),
        (3, 'WAVE-2026-003', 1, 'ZONE-C (Nguyên Liệu)', 5, 8, 'RELEASED_TO_PICKER', '25%', ${nowSec})
      `);

      await client.execute(`
        INSERT INTO wave_pick_items (id, wave_id, product_id, sku, product_name, requested_qty, picked_qty, assigned_bin, status, created_at) VALUES
        (1, 1, 1, 'PRD-001', 'Màn Hình Công Nghiệp LCD 15.6 inch', 10, 10, 'LOC-A-01-01', 'PICKED', ${nowSec}),
        (2, 1, 2, 'PRD-002', 'Bộ Điều Khiển Lập Trình PLC S7-1200', 5, 0, 'LOC-A-01-02', 'PENDING', ${nowSec}),
        (3, 2, 1, 'PRD-001', 'Màn Hình Công Nghiệp LCD 15.6 inch', 20, 0, 'LOC-A-01-01', 'PENDING', ${nowSec})
      `);

      await client.execute(`
        INSERT INTO lpn (id, lpn_code, carton_size, weight, so_code, status, warehouse_id, location_id, created_at) VALUES
        (1, 'LPN-2026-001', 'Euro Pallet (120x80cm)', '245.0 kg', 'SO-2026-0120', 'PACKING', 1, 1, ${nowSec}),
        (2, 'LPN-2026-002', 'Box Medium (40x30x20cm)', '12.5 kg', 'SO-2026-0122', 'PUTAWAY', 1, 2, ${nowSec}),
        (3, 'LPN-2026-003', 'Box Large (60x40x40cm)', '35.0 kg', 'SO-2026-0125', 'SEALED', 1, 1, ${nowSec})
      `);

      await client.execute(`
        INSERT INTO lpn_contents (id, lpn_id, product_id, sku, product_name, quantity, lot_no, created_at) VALUES
        (1, 1, 1, 'PRD-001', 'Màn Hình Công Nghiệp LCD 15.6 inch', 50, 'LOT-LCD-2026-08A', ${nowSec}),
        (2, 2, 2, 'PRD-002', 'Bộ Điều Khiển Lập Trình PLC S7-1200', 10, 'LOT-PLC-2026-03B', ${nowSec})
      `);

      await client.execute(`
        INSERT INTO dock_appointments (id, appointment_code, dock_name, dock_type, carrier, po_code, so_code, time_slot, status, warehouse_id, created_at) VALUES
        (1, 'APT-2026-001', 'Dock Bay 01 (Inbound)', 'INBOUND', 'Giao Hàng Nhanh (GHN Express)', 'PO-2026-0089', NULL, '08:00 - 10:00', 'CHECKED_IN', 1, ${nowSec}),
        (2, 'APT-2026-002', 'Dock Bay 02 (Outbound)', 'OUTBOUND', 'Viettel Post Logistics', NULL, 'SO-2026-0120', '10:30 - 12:00', 'SCHEDULED', 1, ${nowSec}),
        (3, 'APT-2026-003', 'Dock Bay 03 (Heavy Duty)', 'INBOUND', 'DHL Global Forwarding', 'PO-2026-0092', NULL, '14:00 - 16:00', 'SCHEDULED', 1, ${nowSec})
      `);
    }

    console.log("Database successfully bootstrapped and verified.");
  } catch (err) {
    console.error("Error during database bootstrap:", err);
  }
}

