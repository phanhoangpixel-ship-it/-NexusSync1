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
  try {
    await client.execute("PRAGMA journal_mode = WAL;");
    await client.execute("PRAGMA busy_timeout = 10000;");
    // Ensure system_config singleton is initialized with CHECK ("id" = 1) constraint
    await client.execute(`CREATE TABLE IF NOT EXISTS "system_config" (
      "id" INTEGER PRIMARY KEY CHECK ("id" = 1),
      "is_initialized" INTEGER NOT NULL DEFAULT 0,
      "app_display_name" TEXT,
      "logo_dms_doc_id" INTEGER REFERENCES "dms_documents"("id"),
      "favicon_dms_doc_id" INTEGER REFERENCES "dms_documents"("id"),
      "login_background_dms_doc_id" INTEGER REFERENCES "dms_documents"("id"),
      "primary_color" TEXT,
      "secondary_color" TEXT,
      "legal_company_name" TEXT,
      "tax_code" TEXT,
      "company_address" TEXT,
      "company_hotline" TEXT,
      "company_email" TEXT,
      "default_language" TEXT DEFAULT 'vi',
      "default_currency" TEXT DEFAULT 'VND',
      "timezone" TEXT DEFAULT 'Asia/Ho_Chi_Minh',
      "date_format" TEXT DEFAULT 'DD/MM/YYYY',
      "fiscal_year_start_month" INTEGER DEFAULT 1,
      "updated_by" INTEGER REFERENCES "users"("id"),
      "updated_at" INTEGER
    );`);
  } catch (_) {}

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
    `ALTER TABLE bank_accounts ADD COLUMN bank_branch TEXT`,
    `ALTER TABLE bank_accounts ADD COLUMN swift_code TEXT`,
    `ALTER TABLE bank_transactions ADD COLUMN bank_ref TEXT`,
    `ALTER TABLE bank_transactions ADD COLUMN match_type TEXT`,
    `ALTER TABLE bank_transactions ADD COLUMN import_checksum TEXT`,
    `ALTER TABLE bank_transactions ADD COLUMN transaction_hash TEXT`,
    `ALTER TABLE bank_transactions ADD COLUMN reconciled_invoice_id INTEGER`,
    `ALTER TABLE bank_transactions ADD COLUMN reconciled_voucher_id INTEGER`,
    `ALTER TABLE bank_transactions ADD COLUMN reconciled_by INTEGER`,
    `ALTER TABLE bank_transactions ADD COLUMN reconciled_at INTEGER`,
    `ALTER TABLE bank_transactions ADD COLUMN partner_name TEXT`,
    `ALTER TABLE bank_transactions ADD COLUMN partner_account TEXT`,
    `ALTER TABLE bank_transactions ADD COLUMN counterparty_bank TEXT`,
    `ALTER TABLE bank_transactions ADD COLUMN virtual_account TEXT`,
    `ALTER TABLE bank_transactions ADD COLUMN notes TEXT`,
    `ALTER TABLE purchase_requisitions ADD COLUMN mrp_result_id INTEGER`,
    `ALTER TABLE projects ADD COLUMN billed_amount REAL DEFAULT 0`,
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
    `ALTER TABLE accounting_entries ADD COLUMN cost_center TEXT`,
    `ALTER TABLE accounting_entries ADD COLUMN department_id INTEGER`,
    `ALTER TABLE accounting_entries ADD COLUMN is_reversal INTEGER DEFAULT 0`,
    `ALTER TABLE accounting_entries ADD COLUMN reversed_entry_id INTEGER`,
    `ALTER TABLE accounting_entries ADD COLUMN reversal_reason TEXT`,
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
    `ALTER TABLE sales_orders ADD COLUMN source_type TEXT`,
    `ALTER TABLE sales_orders ADD COLUMN source_id INTEGER`,
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
    // M34 Financial Consolidation Migrations
    `ALTER TABLE consolidation_runs ADD COLUMN period_id TEXT`,
    `ALTER TABLE consolidation_runs ADD COLUMN revision_no INTEGER DEFAULT 1`,
    `ALTER TABLE consolidation_runs ADD COLUMN idempotency_key TEXT`,
    `ALTER TABLE consolidation_runs ADD COLUMN total_eliminated REAL DEFAULT 0`,
    `ALTER TABLE consolidation_runs ADD COLUMN approved_by TEXT`,
    `ALTER TABLE consolidation_runs ADD COLUMN approved_at INTEGER`,
    `ALTER TABLE consolidation_runs ADD COLUMN locked_at INTEGER`,
    `ALTER TABLE consolidation_runs ADD COLUMN sealed_dms_doc_id INTEGER`,
    `ALTER TABLE consolidation_runs ADD COLUMN notes TEXT`,
    `CREATE INDEX IF NOT EXISTS idx_consolidation_runs_period ON consolidation_runs (period_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_consolidation_run_lines_run ON consolidation_run_lines (run_id)`,
    `CREATE INDEX IF NOT EXISTS idx_elimination_entries_run ON elimination_entries (run_id)`,
    `CREATE INDEX IF NOT EXISTS idx_fx_adjustments_run ON fx_adjustments (run_id)`,
    `CREATE TABLE IF NOT EXISTS dms_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'GENERAL',
      category_name TEXT,
      version TEXT DEFAULT 'v1.0',
      file_size TEXT,
      format TEXT DEFAULT 'PDF',
      status TEXT NOT NULL DEFAULT 'DRAFT',
      security_level TEXT DEFAULT 'INTERNAL',
      sha256_hash TEXT,
      signed_by TEXT,
      signed_at TEXT,
      linked_module TEXT,
      ref_doc_no TEXT,
      storage_tier TEXT DEFAULT 'ACTIVE_VAULT',
      retention_years INTEGER DEFAULT 5,
      expire_date TEXT,
      workflow_stage INTEGER DEFAULT 1,
      workflow_steps TEXT,
      created_at INTEGER,
      entity_type TEXT,
      entity_id TEXT,
      classification TEXT DEFAULT 'INTERNAL',
      retention_class TEXT,
      retention_until INTEGER,
      legal_hold INTEGER DEFAULT 0,
      supersedes_id INTEGER,
      hash_scope TEXT DEFAULT 'FILE_CONTENT',
      size_bytes INTEGER,
      mime_type TEXT,
      idempotency_key TEXT UNIQUE
    )`,
    `ALTER TABLE dms_documents ADD COLUMN entity_type TEXT`,
    `ALTER TABLE dms_documents ADD COLUMN entity_id TEXT`,
    `ALTER TABLE dms_documents ADD COLUMN classification TEXT DEFAULT 'INTERNAL'`,
    `ALTER TABLE dms_documents ADD COLUMN retention_class TEXT`,
    `ALTER TABLE dms_documents ADD COLUMN retention_until INTEGER`,
    `ALTER TABLE dms_documents ADD COLUMN legal_hold INTEGER DEFAULT 0`,
    `ALTER TABLE dms_documents ADD COLUMN supersedes_id INTEGER`,
    `ALTER TABLE dms_documents ADD COLUMN hash_scope TEXT DEFAULT 'FILE_CONTENT'`,
    `ALTER TABLE dms_documents ADD COLUMN size_bytes INTEGER`,
    `ALTER TABLE dms_documents ADD COLUMN mime_type TEXT`,
    `ALTER TABLE dms_documents ADD COLUMN idempotency_key TEXT`,
    `ALTER TABLE dms_documents ADD COLUMN file_content_base64 TEXT`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_dms_idempotency ON dms_documents (idempotency_key)`,
    // M16/M21 SCM Demand Forecast & MPS Tables
    `CREATE TABLE IF NOT EXISTS scm_forecasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      forecast_code TEXT NOT NULL UNIQUE,
      product_id INTEGER NOT NULL,
      product_name TEXT,
      sku TEXT,
      warehouse_id INTEGER,
      period TEXT NOT NULL DEFAULT 'MONTHLY',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      historical_avg_demand REAL DEFAULT 100,
      forecast_quantity REAL NOT NULL,
      actual_sales_quantity REAL DEFAULT 0,
      forecast_method TEXT NOT NULL DEFAULT 'EXPONENTIAL_SMOOTHING',
      accuracy_mae REAL DEFAULT 5,
      accuracy_mape REAL DEFAULT 4.2,
      confidence_level REAL DEFAULT 95.0,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      notes TEXT,
      created_by TEXT DEFAULT 'SCM Planner',
      created_at INTEGER,
      updated_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS mps_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mps_code TEXT NOT NULL UNIQUE,
      product_id INTEGER NOT NULL,
      product_name TEXT,
      sku TEXT,
      warehouse_id INTEGER,
      period TEXT NOT NULL DEFAULT 'WEEKLY',
      period_start_date TEXT NOT NULL,
      period_end_date TEXT NOT NULL,
      forecast_demand REAL NOT NULL DEFAULT 0,
      sales_order_demand REAL NOT NULL DEFAULT 0,
      total_gross_demand REAL NOT NULL DEFAULT 0,
      projected_available_balance REAL NOT NULL DEFAULT 0,
      available_to_promise REAL NOT NULL DEFAULT 0,
      planned_production_qty REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PLANNED',
      is_frozen INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at INTEGER,
      updated_at INTEGER
    )`,
    // M32 Treasury Management (BTC Form 01-TT & 02-TT Compliance)
    `ALTER TABLE cash_vouchers ADD COLUMN voucher_form TEXT DEFAULT '01-TT'`,
    `ALTER TABLE cash_vouchers ADD COLUMN voucher_category TEXT DEFAULT 'DEBT_COLLECTION'`,
    `ALTER TABLE cash_vouchers ADD COLUMN partner_id INTEGER`,
    `ALTER TABLE cash_vouchers ADD COLUMN partner_address TEXT`,
    `ALTER TABLE cash_vouchers ADD COLUMN partner_tax_code TEXT`,
    `ALTER TABLE cash_vouchers ADD COLUMN receiver_or_payer_name TEXT`,
    `ALTER TABLE cash_vouchers ADD COLUMN amount_in_words TEXT`,
    `ALTER TABLE cash_vouchers ADD COLUMN currency TEXT DEFAULT 'VND'`,
    `ALTER TABLE cash_vouchers ADD COLUMN exchange_rate REAL DEFAULT 1`,
    `ALTER TABLE cash_vouchers ADD COLUMN debit_account TEXT DEFAULT '1111'`,
    `ALTER TABLE cash_vouchers ADD COLUMN credit_account TEXT DEFAULT '131'`,
    `ALTER TABLE cash_vouchers ADD COLUMN bank_account_number TEXT`,
    `ALTER TABLE cash_vouchers ADD COLUMN posting_date TEXT`,
    `ALTER TABLE cash_vouchers ADD COLUMN attached_docs_count INTEGER DEFAULT 0`,
    `ALTER TABLE cash_vouchers ADD COLUMN attached_docs_description TEXT`,
    `ALTER TABLE cash_vouchers ADD COLUMN source_module TEXT DEFAULT 'M32'`,
    `ALTER TABLE cash_vouchers ADD COLUMN source_document_type TEXT`,
    `ALTER TABLE cash_vouchers ADD COLUMN source_document_id INTEGER`,
    `ALTER TABLE cash_vouchers ADD COLUMN source_reference_no TEXT`,
    `ALTER TABLE cash_vouchers ADD COLUMN idempotency_key TEXT`,
    `ALTER TABLE cash_vouchers ADD COLUMN accounting_entry_id INTEGER`,
    `ALTER TABLE cash_vouchers ADD COLUMN posted_gl INTEGER DEFAULT 0`,
    `ALTER TABLE cash_vouchers ADD COLUMN director_signature TEXT`,
    `ALTER TABLE cash_vouchers ADD COLUMN chief_accountant_signature TEXT`,
    `ALTER TABLE cash_vouchers ADD COLUMN cashier_signature TEXT`,
    `ALTER TABLE cash_vouchers ADD COLUMN payer_or_receiver_signature TEXT`,
    `ALTER TABLE cash_vouchers ADD COLUMN preparer_signature TEXT`,
    `ALTER TABLE cash_vouchers ADD COLUMN created_by_id INTEGER`,
    `ALTER TABLE cash_vouchers ADD COLUMN approved_by_id INTEGER`,
    `ALTER TABLE cash_vouchers ADD COLUMN approved_at INTEGER`,
    `ALTER TABLE cash_vouchers ADD COLUMN updated_at INTEGER`,
    `CREATE INDEX IF NOT EXISTS idx_cash_vouchers_idempotency ON cash_vouchers (idempotency_key)`,
    `CREATE INDEX IF NOT EXISTS idx_cash_vouchers_type_status ON cash_vouchers (voucher_type, status)`,
    // M06 Innovation R&D Stage-Gate & Handover Enhancements
    `ALTER TABLE rd_projects ADD COLUMN stage TEXT DEFAULT 'DRAFT'`,
    `ALTER TABLE rd_projects ADD COLUMN target_sku TEXT`,
    `ALTER TABLE rd_projects ADD COLUMN registered_product_id INTEGER`,
    `ALTER TABLE rd_projects ADD COLUMN handover_bom_id INTEGER`,
    `ALTER TABLE rd_projects ADD COLUMN handover_mo_id INTEGER`,
    `ALTER TABLE rd_projects ADD COLUMN is_confidential INTEGER DEFAULT 0`,
    `ALTER TABLE rd_projects ADD COLUMN handover_signoff_at TEXT`,
    `ALTER TABLE rd_projects ADD COLUMN handover_signoff_by TEXT`,
    `ALTER TABLE rd_projects ADD COLUMN is_locked INTEGER DEFAULT 0`,
    `CREATE INDEX IF NOT EXISTS idx_rd_formula_versions_project ON rd_formula_versions (project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_rd_sample_evaluations_project ON rd_sample_evaluations (project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_rd_compliance_checks_project ON rd_compliance_checks (project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_rd_handover_checklist_project ON rd_handover_checklist (project_id)`,
    `CREATE TABLE IF NOT EXISTS rd_experiments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      experiment_code TEXT NOT NULL UNIQUE,
      project_id INTEGER REFERENCES rd_projects(id),
      formula_id INTEGER REFERENCES rd_formulas(id),
      formula_version TEXT,
      experiment_name TEXT NOT NULL,
      test_type TEXT NOT NULL,
      sample_size INTEGER NOT NULL DEFAULT 5,
      yield_rate REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PASSED',
      score REAL DEFAULT 0,
      operator_name TEXT NOT NULL,
      notes TEXT,
      conducted_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_rd_experiments_project ON rd_experiments (project_id)`,
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
    `CREATE INDEX IF NOT EXISTS srm_auction_rounds_round_num_idx ON srm_auction_rounds (round_number)`,
    // M15 Returns & RMA Dispositions Foundation (rmaRequests, rmaItems)
    `CREATE TABLE IF NOT EXISTS rma_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rma_number TEXT NOT NULL UNIQUE,
      order_id INTEGER,
      order_code TEXT,
      delivery_code TEXT,
      customer_id INTEGER,
      customer_name TEXT NOT NULL,
      warehouse_id INTEGER,
      product_code TEXT,
      product_name TEXT,
      quantity REAL NOT NULL DEFAULT 1,
      uom TEXT NOT NULL DEFAULT 'Cái',
      lot_serial TEXT,
      reason TEXT NOT NULL,
      requested_resolution TEXT NOT NULL DEFAULT 'REPLACE (Đổi mới sản phẩm)',
      status TEXT NOT NULL DEFAULT 'REQUESTED',
      inspection_result TEXT NOT NULL DEFAULT 'PENDING',
      disposition TEXT NOT NULL DEFAULT 'PENDING',
      financial_status TEXT NOT NULL DEFAULT 'PENDING',
      refund_method TEXT DEFAULT 'CREDIT_NOTE',
      warranty_status TEXT NOT NULL DEFAULT 'VALID',
      return_window_days INTEGER NOT NULL DEFAULT 30,
      fraud_score REAL NOT NULL DEFAULT 0,
      fraud_flags TEXT,
      rtv_reference_code TEXT,
      maintenance_wo_code TEXT,
      refund_channel TEXT NOT NULL DEFAULT 'CREDIT_NOTE_M31',
      total_amount REAL NOT NULL DEFAULT 0,
      refunded_amount REAL NOT NULL DEFAULT 0,
      credit_note_number TEXT,
      inspection_notes TEXT,
      inspected_by INTEGER,
      inspected_at INTEGER,
      approved_by INTEGER,
      approved_at INTEGER,
      completed_at INTEGER,
      rejected_at INTEGER,
      rejection_reason TEXT,
      request_date TEXT NOT NULL,
      notes TEXT,
      metadata TEXT,
      created_by INTEGER,
      created_at INTEGER,
      updated_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS rma_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rma_request_id INTEGER NOT NULL,
      product_id INTEGER,
      product_code TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      uom TEXT NOT NULL DEFAULT 'Cái',
      uom_id INTEGER,
      serial_id INTEGER,
      lot_id INTEGER,
      lot_serial TEXT,
      condition TEXT DEFAULT 'DEFECTIVE',
      unit_price REAL NOT NULL DEFAULT 0,
      original_unit_cost REAL NOT NULL DEFAULT 0,
      subtotal REAL NOT NULL DEFAULT 0,
      reason TEXT,
      disposition TEXT NOT NULL DEFAULT 'PENDING',
      disposition_target TEXT NOT NULL DEFAULT 'RESTOCK',
      inspected_quantity REAL DEFAULT 0,
      restocked_quantity REAL DEFAULT 0,
      scrapped_quantity REAL DEFAULT 0,
      replaced_quantity REAL DEFAULT 0,
      notes TEXT,
      created_at INTEGER
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS rma_requests_number_idx ON rma_requests (rma_number)`,
    `CREATE INDEX IF NOT EXISTS rma_requests_order_id_idx ON rma_requests (order_id)`,
    `CREATE INDEX IF NOT EXISTS rma_requests_order_code_idx ON rma_requests (order_code)`,
    `CREATE INDEX IF NOT EXISTS rma_requests_customer_id_idx ON rma_requests (customer_id)`,
    `CREATE INDEX IF NOT EXISTS rma_requests_warehouse_id_idx ON rma_requests (warehouse_id)`,
    `CREATE INDEX IF NOT EXISTS rma_requests_status_idx ON rma_requests (status)`,
    `CREATE INDEX IF NOT EXISTS rma_requests_inspection_result_idx ON rma_requests (inspection_result)`,
    `CREATE INDEX IF NOT EXISTS rma_requests_disposition_idx ON rma_requests (disposition)`,
    `CREATE INDEX IF NOT EXISTS rma_requests_financial_status_idx ON rma_requests (financial_status)`,
    `CREATE INDEX IF NOT EXISTS rma_requests_date_idx ON rma_requests (request_date)`,
    `CREATE INDEX IF NOT EXISTS rma_requests_warranty_status_idx ON rma_requests (warranty_status)`,
    `CREATE INDEX IF NOT EXISTS rma_requests_rtv_code_idx ON rma_requests (rtv_reference_code)`,
    `CREATE INDEX IF NOT EXISTS rma_requests_maintenance_wo_idx ON rma_requests (maintenance_wo_code)`,
    `CREATE INDEX IF NOT EXISTS rma_requests_refund_channel_idx ON rma_requests (refund_channel)`,
    `CREATE INDEX IF NOT EXISTS rma_requests_fraud_score_idx ON rma_requests (fraud_score)`,
    `CREATE INDEX IF NOT EXISTS rma_items_request_id_idx ON rma_items (rma_request_id)`,
    `CREATE INDEX IF NOT EXISTS rma_items_product_id_idx ON rma_items (product_id)`,
    `CREATE INDEX IF NOT EXISTS rma_items_product_code_idx ON rma_items (product_code)`,
    `CREATE INDEX IF NOT EXISTS rma_items_lot_serial_idx ON rma_items (lot_serial)`,
    `CREATE INDEX IF NOT EXISTS rma_items_serial_id_idx ON rma_items (serial_id)`,
    `CREATE INDEX IF NOT EXISTS rma_items_lot_id_idx ON rma_items (lot_id)`,
    `CREATE INDEX IF NOT EXISTS rma_items_disposition_idx ON rma_items (disposition)`,
    `CREATE INDEX IF NOT EXISTS rma_items_disp_target_idx ON rma_items (disposition_target)`,
    // M15 Phase 02 Schema Migrations (ALTER TABLE on existing DB)
    `ALTER TABLE rma_requests ADD COLUMN warranty_status TEXT DEFAULT 'VALID'`,
    `ALTER TABLE rma_requests ADD COLUMN return_window_days INTEGER DEFAULT 30`,
    `ALTER TABLE rma_requests ADD COLUMN fraud_score REAL DEFAULT 0`,
    `ALTER TABLE rma_requests ADD COLUMN fraud_flags TEXT`,
    `ALTER TABLE rma_requests ADD COLUMN rtv_reference_code TEXT`,
    `ALTER TABLE rma_requests ADD COLUMN maintenance_wo_code TEXT`,
    `ALTER TABLE rma_requests ADD COLUMN refund_channel TEXT DEFAULT 'CREDIT_NOTE_M31'`,
    `ALTER TABLE rma_items ADD COLUMN disposition_target TEXT DEFAULT 'RESTOCK'`,
    `ALTER TABLE rma_items ADD COLUMN serial_id INTEGER`,
    `ALTER TABLE rma_items ADD COLUMN lot_id INTEGER`,
    `ALTER TABLE rma_items ADD COLUMN original_unit_cost REAL DEFAULT 0`,
    // M14 Sales Commission & Dispute Engine Migrations
    `ALTER TABLE commission_plans ADD COLUMN split_commission_enabled INTEGER DEFAULT 0`,
    `ALTER TABLE commission_plans ADD COLUMN manager_override_percent REAL DEFAULT 15.0`,
    `ALTER TABLE commission_plans ADD COLUMN presales_split_percent REAL DEFAULT 10.0`,
    `ALTER TABLE commission_plans ADD COLUMN primary_rep_percent REAL DEFAULT 75.0`,
    `ALTER TABLE commission_plans ADD COLUMN anomaly_threshold_percent REAL DEFAULT 20.0`,
    `ALTER TABLE commission_calculations ADD COLUMN rma_id INTEGER`,
    `ALTER TABLE commission_calculations ADD COLUMN rma_code TEXT`,
    `ALTER TABLE commission_calculations ADD COLUMN calculation_basis TEXT DEFAULT 'REVENUE'`,
    `ALTER TABLE commission_calculations ADD COLUMN revenue_amount REAL DEFAULT 0`,
    `ALTER TABLE commission_calculations ADD COLUMN cogs_amount REAL DEFAULT 0`,
    `ALTER TABLE commission_calculations ADD COLUMN margin_amount REAL DEFAULT 0`,
    `ALTER TABLE commission_calculations ADD COLUMN margin_percent REAL DEFAULT 0`,
    `ALTER TABLE commission_calculations ADD COLUMN is_split INTEGER DEFAULT 0`,
    `ALTER TABLE commission_calculations ADD COLUMN split_role TEXT`,
    `ALTER TABLE commission_calculations ADD COLUMN split_percent REAL DEFAULT 100`,
    `ALTER TABLE commission_calculations ADD COLUMN parent_calculation_id INTEGER`,
    `ALTER TABLE commission_calculations ADD COLUMN parent_sales_rep_id INTEGER`,
    `ALTER TABLE commission_calculations ADD COLUMN is_anomaly INTEGER DEFAULT 0`,
    `ALTER TABLE commission_calculations ADD COLUMN anomaly_reason TEXT`,
    `ALTER TABLE commission_payouts ADD COLUMN payroll_period_id TEXT`,
    `ALTER TABLE commission_payouts ADD COLUMN dms_document_id TEXT`,
    `ALTER TABLE commission_payouts ADD COLUMN dms_sha256_hash TEXT`,
    `CREATE TABLE IF NOT EXISTS commission_disputes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dispute_code TEXT NOT NULL UNIQUE,
      calculation_id INTEGER,
      payout_id INTEGER,
      sales_person_id INTEGER NOT NULL,
      disputed_amount REAL NOT NULL DEFAULT 0,
      expected_amount REAL NOT NULL DEFAULT 0,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      resolution_notes TEXT,
      adjustment_calculation_id INTEGER,
      resolved_by INTEGER,
      resolved_at INTEGER,
      created_by INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_commission_disputes_code ON commission_disputes (dispute_code)`,
    `CREATE INDEX IF NOT EXISTS idx_commission_disputes_salesperson ON commission_disputes (sales_person_id)`,
    `CREATE INDEX IF NOT EXISTS idx_commission_disputes_status ON commission_disputes (status)`,

    // M27 EAM Enterprise Asset Management Upgrade
    `CREATE TABLE IF NOT EXISTS fixed_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category_id INTEGER,
      category_name TEXT,
      asset_type TEXT DEFAULT 'MACHINERY',
      serial_number TEXT,
      model TEXT,
      manufacturer TEXT,
      supplier_id INTEGER,
      supplier_name TEXT,
      purchase_date TEXT,
      purchase_cost REAL NOT NULL DEFAULT 0,
      salvage_value REAL NOT NULL DEFAULT 0,
      useful_life_months INTEGER NOT NULL DEFAULT 60,
      depreciation_method TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
      accumulated_depreciation REAL NOT NULL DEFAULT 0,
      book_value REAL NOT NULL DEFAULT 0,
      monthly_depreciation REAL NOT NULL DEFAULT 0,
      last_depreciation_date TEXT,
      branch_id INTEGER,
      department_id INTEGER,
      location TEXT,
      responsible_employee_id INTEGER,
      responsible_employee_name TEXT,
      gl_asset_account TEXT DEFAULT 'TK 211',
      gl_depreciation_account TEXT DEFAULT 'TK 214',
      gl_expense_account TEXT DEFAULT 'TK 627',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at INTEGER,
      updated_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS asset_hierarchy (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER,
      asset_id INTEGER,
      hierarchy_level TEXT NOT NULL DEFAULT 'MACHINE',
      node_code TEXT NOT NULL,
      node_name TEXT NOT NULL,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS maintenance_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      schedule_code TEXT NOT NULL,
      title TEXT NOT NULL,
      maintenance_type TEXT NOT NULL DEFAULT 'PREVENTIVE',
      frequency_type TEXT DEFAULT 'DAYS',
      interval_days INTEGER DEFAULT 30,
      interval_hours REAL DEFAULT 0,
      description TEXT,
      last_performed_date TEXT,
      next_due_date TEXT,
      assigned_technician TEXT,
      estimated_cost REAL DEFAULT 0,
      estimated_hours REAL DEFAULT 2,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at INTEGER
    )`,
    `ALTER TABLE maintenance_workOrders ADD COLUMN source_module TEXT`,
    `ALTER TABLE maintenance_workOrders ADD COLUMN source_reference_id INTEGER`,
    `ALTER TABLE maintenance_workOrders ADD COLUMN source_reference_code TEXT`,
    `ALTER TABLE maintenance_workOrders ADD COLUMN resolution_notes TEXT`,
    `ALTER TABLE maintenance_workOrders ADD COLUMN actual_hours REAL DEFAULT 0`,
    `ALTER TABLE maintenance_work_orders ADD COLUMN source_module TEXT`,
    `ALTER TABLE maintenance_work_orders ADD COLUMN source_reference_id INTEGER`,
    `ALTER TABLE maintenance_work_orders ADD COLUMN source_reference_code TEXT`,
    `ALTER TABLE maintenance_work_orders ADD COLUMN resolution_notes TEXT`,
    `ALTER TABLE maintenance_work_orders ADD COLUMN actual_hours REAL DEFAULT 0`,
    `CREATE INDEX IF NOT EXISTS idx_fixed_assets_code ON fixed_assets (code)`,
    `CREATE INDEX IF NOT EXISTS idx_asset_hierarchy_parent ON asset_hierarchy (parent_id)`,
    `CREATE INDEX IF NOT EXISTS idx_asset_hierarchy_asset ON asset_hierarchy (asset_id)`,
    `CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_asset ON maintenance_schedules (asset_id)`,

    // M38 IT Service Desk & ITSM SLA Enhancements
    `ALTER TABLE tickets ADD COLUMN type TEXT DEFAULT 'INCIDENT'`,
    `ALTER TABLE tickets ADD COLUMN impact TEXT DEFAULT 'LOW'`,
    `ALTER TABLE tickets ADD COLUMN urgency TEXT DEFAULT 'LOW'`,
    `ALTER TABLE tickets ADD COLUMN requester_id INTEGER`,
    `ALTER TABLE tickets ADD COLUMN requester_name TEXT`,
    `ALTER TABLE tickets ADD COLUMN requester_email TEXT`,
    `ALTER TABLE tickets ADD COLUMN requester_department TEXT`,
    `ALTER TABLE tickets ADD COLUMN asset_id INTEGER`,
    `ALTER TABLE tickets ADD COLUMN asset_code TEXT`,
    `ALTER TABLE tickets ADD COLUMN asset_name TEXT`,
    `ALTER TABLE tickets ADD COLUMN serial_id INTEGER`,
    `ALTER TABLE tickets ADD COLUMN serial_number TEXT`,
    `ALTER TABLE tickets ADD COLUMN sla_policy_id INTEGER`,
    `ALTER TABLE tickets ADD COLUMN response_due_at INTEGER`,
    `ALTER TABLE tickets ADD COLUMN resolve_due_at INTEGER`,
    `ALTER TABLE tickets ADD COLUMN sla_paused_at INTEGER`,
    `ALTER TABLE tickets ADD COLUMN sla_paused_seconds INTEGER DEFAULT 0`,
    `ALTER TABLE tickets ADD COLUMN first_response_at INTEGER`,
    `ALTER TABLE tickets ADD COLUMN resolved_at INTEGER`,
    `ALTER TABLE tickets ADD COLUMN closed_at INTEGER`,
    `ALTER TABLE tickets ADD COLUMN root_cause TEXT`,
    `ALTER TABLE tickets ADD COLUMN resolution_note TEXT`,
    `ALTER TABLE tickets ADD COLUMN source_module TEXT`,
    `ALTER TABLE tickets ADD COLUMN source_id TEXT`,
    `ALTER TABLE tickets ADD COLUMN idempotency_key TEXT`,
    `ALTER TABLE tickets ADD COLUMN parent_ticket_id INTEGER`,
    `ALTER TABLE tickets ADD COLUMN work_order_id INTEGER`,
    `ALTER TABLE tickets ADD COLUMN work_order_code TEXT`,
    `ALTER TABLE tickets ADD COLUMN dms_attachment_ids TEXT`,
    `ALTER TABLE tickets ADD COLUMN warning_75_sent INTEGER DEFAULT 0`,
    `ALTER TABLE tickets ADD COLUMN warning_90_sent INTEGER DEFAULT 0`,
    `ALTER TABLE tickets ADD COLUMN escalation_level INTEGER DEFAULT 0`,
    `ALTER TABLE tickets ADD COLUMN feedback_score INTEGER`,
    `ALTER TABLE tickets ADD COLUMN feedback_comment TEXT`,
    `CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets (ticket_code)`,
    `CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status)`,
    `CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets (priority)`,
    `CREATE INDEX IF NOT EXISTS idx_tickets_requester ON tickets (requester_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets (assigned_agent_id)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_idempotency ON tickets (idempotency_key)`,
    `CREATE INDEX IF NOT EXISTS idx_sla_policies_code ON sla_policies (policy_code)`,
    `CREATE INDEX IF NOT EXISTS idx_ticket_status_history_ticket ON ticket_status_history (ticket_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ticket_access_requests_code ON ticket_access_requests (request_code)`,
    `CREATE INDEX IF NOT EXISTS idx_ticket_access_requests_target ON ticket_access_requests (target_user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ticket_access_requests_status ON ticket_access_requests (status)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_surveys_ticket ON ticket_surveys (ticket_id)`,
    // M03 System Configuration & Branding Migrations (Phase 1)
    `CREATE TABLE IF NOT EXISTS system_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      is_initialized INTEGER NOT NULL DEFAULT 0,
      app_display_name TEXT,
      logo_dms_doc_id INTEGER REFERENCES dms_documents(id),
      favicon_dms_doc_id INTEGER REFERENCES dms_documents(id),
      login_background_dms_doc_id INTEGER REFERENCES dms_documents(id),
      primary_color TEXT,
      secondary_color TEXT,
      legal_company_name TEXT,
      tax_code TEXT,
      company_address TEXT,
      company_hotline TEXT,
      company_email TEXT,
      default_language TEXT DEFAULT 'vi',
      default_currency TEXT DEFAULT 'VND',
      timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
      date_format TEXT DEFAULT 'DD/MM/YYYY',
      fiscal_year_start_month INTEGER DEFAULT 1,
      updated_by INTEGER REFERENCES users(id),
      updated_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS number_series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_type TEXT UNIQUE,
      prefix TEXT,
      next_sequence INTEGER DEFAULT 1,
      reset_frequency TEXT DEFAULT 'YEARLY',
      branch_id INTEGER REFERENCES branches(id)
    )`
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
      'commission.read', 'commission.manage',
      // M06 Innovation R&D & Formulation
      'rd.project.manage', 'rd.experiment.manage', 'rd.confidential.view', 'rd:confidential',
      'rd.sample.evaluate', 'rd.handover.approve'
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
          sql: `INSERT OR REPLACE INTO stock_balances (product_id, warehouse_id, location_id, stock_physical, stock_reserved, stock_available) VALUES (?, 1, 10, ?, ?, ?)`,
          args: [prodId, p.stock, Math.floor(p.stock * 0.1), p.stock - Math.floor(p.stock * 0.1)]
        });
        await client.execute({
          sql: `INSERT OR REPLACE INTO stock_balances (product_id, warehouse_id, location_id, stock_physical, stock_reserved, stock_available) VALUES (?, 1, 1, ?, ?, ?)`,
          args: [prodId, p.stock, Math.floor(p.stock * 0.1), p.stock - Math.floor(p.stock * 0.1)]
        });
      }
    }

    // Ensure all products in the database have stock balances initialized for warehouse 1
    await client.execute(`
      INSERT OR IGNORE INTO stock_balances (product_id, warehouse_id, location_id, stock_physical, stock_reserved, stock_available)
      SELECT p.id, 1, 10, COALESCE(p.stock_physical, 50), COALESCE(p.stock_reserved, 5), COALESCE(p.stock_available, 45)
      FROM products p
      WHERE NOT EXISTS (
        SELECT 1 FROM stock_balances sb WHERE sb.product_id = p.id AND sb.warehouse_id = 1 AND sb.location_id = 10
      )
    `);
    await client.execute(`
      INSERT OR IGNORE INTO stock_balances (product_id, warehouse_id, location_id, stock_physical, stock_reserved, stock_available)
      SELECT p.id, 1, 1, COALESCE(p.stock_physical, 50), COALESCE(p.stock_reserved, 5), COALESCE(p.stock_available, 45)
      FROM products p
      WHERE NOT EXISTS (
        SELECT 1 FROM stock_balances sb WHERE sb.product_id = p.id AND sb.warehouse_id = 1 AND sb.location_id = 1
      )
    `);

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

    // 10b. Seed Fixed Assets, Asset Hierarchy & Maintenance Schedules if none exist
    try {
      const fixedAssetCount = await client.execute(`SELECT count(*) as count FROM fixed_assets`);
      if (Number(fixedAssetCount.rows[0]?.count || 0) === 0) {
        await client.execute(`
          INSERT INTO fixed_assets (id, code, name, category_id, category_name, asset_type, serial_number, model, manufacturer, purchase_date, purchase_cost, salvage_value, useful_life_months, depreciation_method, accumulated_depreciation, book_value, monthly_depreciation, location, responsible_employee_name, gl_asset_account, gl_depreciation_account, gl_expense_account, status)
          VALUES (1, 'AST-0001', 'Máy Gắn Chíp SMT Tự Động Yamaha YSM20R', 1, 'Máy Móc Dây Chuyền SMT', 'MACHINERY', 'SN-YMH-2024-889', 'YSM20R Dual Beam', 'Yamaha Motor Corp', '2024-03-15', 1850000000, 50000000, 60, 'STRAIGHT_LINE', 330000000, 1520000000, 30000000, 'Xưởng SMT - Dây chuyền 1', 'Trần Văn Hùng (Kỹ thuật trưởng)', 'TK 211', 'TK 214', 'TK 627', 'ACTIVE')
        `);
        await client.execute(`
          INSERT INTO fixed_assets (id, code, name, category_id, category_name, asset_type, serial_number, model, manufacturer, purchase_date, purchase_cost, salvage_value, useful_life_months, depreciation_method, accumulated_depreciation, book_value, monthly_depreciation, location, responsible_employee_name, gl_asset_account, gl_depreciation_account, gl_expense_account, status)
          VALUES (2, 'AST-0002', 'Máy Phay Nhôm CNC 5 Trục Fanuc Robodrill', 2, 'Máy Gia Công Cơ Khí CNC', 'MACHINERY', 'SN-FNC-2023-412', 'Robodrill D21LiB5', 'FANUC Japan', '2023-11-20', 1250000000, 50000000, 48, 'STRAIGHT_LINE', 270000000, 980000000, 25000000, 'Xưởng Cơ Khí Chế Tạo', 'Lê Quốc Tuấn (KTV CNC)', 'TK 211', 'TK 214', 'TK 627', 'IN_USE')
        `);
        await client.execute(`
          INSERT INTO fixed_assets (id, code, name, category_id, category_name, asset_type, serial_number, model, manufacturer, purchase_date, purchase_cost, salvage_value, useful_life_months, depreciation_method, accumulated_depreciation, book_value, monthly_depreciation, location, responsible_employee_name, gl_asset_account, gl_depreciation_account, gl_expense_account, status)
          VALUES (3, 'AST-0003', 'Tủ Thử Nghiệm Sốc Nhiệt Khí Hậu ESPEC', 1, 'Máy Móc Dây Chuyền SMT', 'MACHINERY', 'SN-ESP-2025-101', 'Platinous Series', 'ESPEC Corp', '2025-01-10', 450000000, 0, 36, 'STRAIGHT_LINE', 30000000, 420000000, 12500000, 'Phòng Lab QC Test', 'Nguyễn Thu Trang (Trưởng Lab)', 'TK 211', 'TK 214', 'TK 627', 'ACTIVE')
        `);
      }

      const hierarchyCount = await client.execute(`SELECT count(*) as count FROM asset_hierarchy`);
      if (Number(hierarchyCount.rows[0]?.count || 0) === 0) {
        await client.execute(`
          INSERT INTO asset_hierarchy (id, parent_id, asset_id, hierarchy_level, node_code, node_name, location, status, sort_order)
          VALUES (1, NULL, NULL, 'SITE', 'SITE-HCM', 'Nhà Máy Sản Xuất & Trung Tâm Logistics TP.HCM', 'Khu Công Nghệ Cao Quận 9', 'ACTIVE', 1)
        `);
        await client.execute(`
          INSERT INTO asset_hierarchy (id, parent_id, asset_id, hierarchy_level, node_code, node_name, location, status, sort_order)
          VALUES (2, 1, NULL, 'PRODUCTION_LINE', 'LINE-SMT-01', 'Dây Chuyền Bản Mạch Điện Tử SMT 01', 'Khu Vực Phòng Sạch Lầu 2', 'ACTIVE', 2)
        `);
        await client.execute(`
          INSERT INTO asset_hierarchy (id, parent_id, asset_id, hierarchy_level, node_code, node_name, location, status, sort_order)
          VALUES (3, 2, 1, 'MACHINE', 'AST-0001', 'Máy Gắn Chíp SMT Tự Động Yamaha YSM20R', 'Xưởng SMT - Dây chuyền 1', 'ACTIVE', 3)
        `);
        await client.execute(`
          INSERT INTO asset_hierarchy (id, parent_id, asset_id, hierarchy_level, node_code, node_name, location, status, sort_order)
          VALUES (4, 1, NULL, 'PRODUCTION_LINE', 'LINE-CNC-01', 'Xưởng Gia Công Cơ Khí & Khuôn Mẫu', 'Xưởng Cơ Khí A1 Tầng Trệt', 'ACTIVE', 4)
        `);
        await client.execute(`
          INSERT INTO asset_hierarchy (id, parent_id, asset_id, hierarchy_level, node_code, node_name, location, status, sort_order)
          VALUES (5, 4, 2, 'MACHINE', 'AST-0002', 'Máy Phay Nhôm CNC 5 Trục Fanuc Robodrill', 'Xưởng Cơ Khí Chế Tạo', 'ACTIVE', 5)
        `);
        await client.execute(`
          INSERT INTO asset_hierarchy (id, parent_id, asset_id, hierarchy_level, node_code, node_name, location, status, sort_order)
          VALUES (6, 1, NULL, 'PRODUCTION_LINE', 'LAB-QC-01', 'Phòng Thử Nghiệm Kiểm Chuẩn & Thẩm Định', 'Lab QC Trung Tâm', 'ACTIVE', 6)
        `);
        await client.execute(`
          INSERT INTO asset_hierarchy (id, parent_id, asset_id, hierarchy_level, node_code, node_name, location, status, sort_order)
          VALUES (7, 6, 3, 'MACHINE', 'AST-0003', 'Tủ Thử Nghiệm Sốc Nhiệt Khí Hậu ESPEC', 'Phòng Lab QC Test', 'ACTIVE', 7)
        `);
      }

      const scheduleCount = await client.execute(`SELECT count(*) as count FROM maintenance_schedules`);
      if (Number(scheduleCount.rows[0]?.count || 0) === 0) {
        await client.execute(`
          INSERT INTO maintenance_schedules (id, asset_id, schedule_code, title, maintenance_type, frequency_type, interval_days, interval_hours, description, last_performed_date, next_due_date, assigned_technician, estimated_cost, estimated_hours, status)
          VALUES (1, 1, 'PMS-001', 'Bảo dưỡng tra dầu & hiệu chuẩn đầu gắp SMT định kỳ', 'PREVENTIVE', 'DAYS', 30, 240, 'Vệ sinh quang học camera, tra mỡ trục vít me, cân chỉnh nozzle', '2026-08-01', '2026-08-31', 'Trần Văn Hùng', 3500000, 4.0, 'ACTIVE')
        `);
        await client.execute(`
          INSERT INTO maintenance_schedules (id, asset_id, schedule_code, title, maintenance_type, frequency_type, interval_days, interval_hours, description, last_performed_date, next_due_date, assigned_technician, estimated_cost, estimated_hours, status)
          VALUES (2, 2, 'PMS-002', 'Kiểm tra dao phay & cân bằng động trục chính CNC', 'PREVENTIVE', 'DAYS', 15, 120, 'Đo độ đảo trục chính spindle, kiểm tra dầu giải nhiệt và màng lọc', '2026-08-15', '2026-08-30', 'Lê Quốc Tuấn', 2800000, 2.5, 'ACTIVE')
        `);
        await client.execute(`
          INSERT INTO maintenance_schedules (id, asset_id, schedule_code, title, maintenance_type, frequency_type, interval_days, interval_hours, description, last_performed_date, next_due_date, assigned_technician, estimated_cost, estimated_hours, status)
          VALUES (3, 3, 'PMS-003', 'Hiệu chuẩn cảm biến nhiệt & chu trình gas lạnh buồng thử', 'PREVENTIVE', 'DAYS', 90, 720, 'Kiểm tra áp suất gas R404A, hiệu chuẩn sensor nhiệt độ và độ ẩm', '2026-06-01', '2026-09-01', 'Đội Kỹ Thuật Lạnh', 4200000, 3.0, 'ACTIVE')
        `);
      }
    } catch (eamErr) {
      console.warn('EAM seeding notice:', eamErr);
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

    // 13. Seed M15 Returns & RMA Dispositions (rmaRequests, rmaItems)
    const rmaCount = await client.execute(`SELECT COUNT(*) as count FROM rma_requests`);
    if (Number(rmaCount.rows[0]?.count || 0) === 0) {
      const nowSec = Math.floor(Date.now() / 1000);

      // Ensure Master Data: Customers
      const rmaCustomers = [
        { id: 101, name: 'Công ty Cổ phần Thương mại Kỹ thuật Hưng Thịnh', phone: '024 3881 9922', email: 'contact@hungthinh-tech.vn', address: 'Khu Công Nghiệp Đài Tư, Long Biên, Hà Nội' },
        { id: 102, name: 'Tập đoàn Chế tạo Máy & Thiết bị Công nghiệp Hòa Phát', phone: '028 3910 8899', email: 'procurement@hoaphat-machinery.vn', address: 'KCN Phố Nối A, Văn Lâm, Hưng Yên' },
        { id: 103, name: 'Công ty TNHH Cơ điện Lạnh Đông Nam Á', phone: '028 3755 1234', email: 'orders@dongnama-mep.vn', address: 'Lô C12 KCN Tân Tạo, Bình Tân, TP.HCM' },
        { id: 104, name: 'Công ty TNHH Công nghệ Viễn thông Sao Mai', phone: '024 3792 5566', email: 'it@saomai-telecom.vn', address: 'Tòa nhà Sao Mai, Cầu Giấy, Hà Nội' }
      ];
      for (const c of rmaCustomers) {
        await client.execute({
          sql: `INSERT OR IGNORE INTO customers (id, name, phone, email, address) VALUES (?, ?, ?, ?, ?)`,
          args: [c.id, c.name, c.phone, c.email, c.address]
        });
      }

      // Ensure Master Data: Products
      const rmaProducts = [
        { id: 5, sku: 'SKU-ENG-088', name: 'Bơm thủy lực cao áp P-1000', unit: 'Cái', retailPrice: 18500000, costPrice: 14200000 },
        { id: 6, sku: 'SKU-AUT-204', name: 'Cụm cảm biến nhiệt độ đa điểm IoT Sensor v3', unit: 'Bộ', retailPrice: 2450000, costPrice: 1800000 },
        { id: 7, sku: 'SKU-VAL-012', name: 'Van điều áp khí nén 2 chiều SMC-Series', unit: 'Chiếc', retailPrice: 1250000, costPrice: 890000 },
        { id: 8, sku: 'PRD-001', name: 'Laptop Business 14', unit: 'Chiếc', retailPrice: 28500000, costPrice: 22000000 }
      ];
      for (const p of rmaProducts) {
        await client.execute({
          sql: `INSERT OR IGNORE INTO products (id, sku, name, base_unit, retail_price, cost_price, status) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
          args: [p.id, p.sku, p.name, p.unit, p.retailPrice, p.costPrice]
        });
      }

      // Ensure Master Data: Sales Orders
      const rmaOrders = [
        { id: 101, code: 'SO-2026-00120', customerId: 101, totalAmount: 45000000 },
        { id: 102, code: 'SO-2026-00142', customerId: 102, totalAmount: 32000000 },
        { id: 103, code: 'SO-2026-00168', customerId: 103, totalAmount: 15500000 },
        { id: 104, code: 'SO-2026-00195', customerId: 104, totalAmount: 28500000 },
        { id: 105, code: 'SO-2026-00210', customerId: 102, totalAmount: 22000000 }
      ];
      for (const so of rmaOrders) {
        await client.execute({
          sql: `INSERT OR IGNORE INTO sales_orders (id, code, customer_id, warehouse_id, status, payment_status, total_amount, final_amount, created_by) VALUES (?, ?, ?, 1, 'ISSUED', 'PAID', ?, ?, 1)`,
          args: [so.id, so.code, so.customerId, so.totalAmount, so.totalAmount]
        });
      }

      // Seed RMA Requests & Items (Backwards-compatible with INITIAL_RMA_SEED)
      const seedRmas = [
        {
          id: 1,
          rmaNumber: 'RMA-2026-0084',
          orderId: 101,
          orderCode: 'SO-2026-00120',
          deliveryCode: 'DEL-2026-0155',
          customerId: 101,
          customerName: 'Công ty Cổ phần Thương mại Kỹ thuật Hưng Thịnh',
          warehouseId: 1,
          productCode: 'SKU-ENG-088',
          productName: 'Bơm thủy lực cao áp P-1000',
          quantity: 2,
          uom: 'Cái',
          lotSerial: 'LOT-2026-X889',
          reason: 'Áp suất đầu ra không đạt định mức kỹ thuật cam kết',
          requestedResolution: 'REPLACE (Đổi mới sản phẩm)',
          status: 'APPROVED',
          inspectionResult: 'DEFECTIVE',
          disposition: 'REPLACE',
          financialStatus: 'CREDIT_NOTE_ISSUED',
          refundMethod: 'CREDIT_NOTE',
          totalAmount: 37000000,
          refundedAmount: 37000000,
          creditNoteNumber: 'CN-2026-0084',
          inspectionNotes: 'Kiểm tra áp suất đạt 620 bar thay vì 1000 bar danh định. Xác nhận van bypass rò rỉ cơ học.',
          inspectedBy: 1,
          inspectedAt: nowSec - 86400 * 3,
          approvedBy: 1,
          approvedAt: nowSec - 86400 * 2,
          completedAt: null,
          rejectedAt: null,
          rejectionReason: null,
          requestDate: '2026-08-28',
          items: [
            {
              productId: 5,
              productCode: 'SKU-ENG-088',
              productName: 'Bơm thủy lực cao áp P-1000',
              quantity: 2,
              uom: 'Cái',
              lotSerial: 'LOT-2026-X889',
              condition: 'DEFECTIVE',
              unitPrice: 18500000,
              subtotal: 37000000,
              reason: 'Áp suất đầu ra không đạt định mức kỹ thuật cam kết',
              disposition: 'REPLACE',
              inspectedQuantity: 2,
              restockedQuantity: 0,
              scrappedQuantity: 0,
              replacedQuantity: 2
            }
          ]
        },
        {
          id: 2,
          rmaNumber: 'RMA-2026-0085',
          orderId: 102,
          orderCode: 'SO-2026-00142',
          deliveryCode: 'DEL-2026-0180',
          customerId: 102,
          customerName: 'Tập đoàn Chế tạo Máy & Thiết bị Công nghiệp Hòa Phát',
          warehouseId: 1,
          productCode: 'SKU-AUT-204',
          productName: 'Cụm cảm biến nhiệt độ đa điểm IoT Sensor v3',
          quantity: 10,
          uom: 'Bộ',
          lotSerial: 'LOT-2026-S441',
          reason: 'Giao nhầm mã chủng loại cảm biến so với hợp đồng',
          requestedResolution: 'RESTOCK (Nhập kho hoàn trả)',
          status: 'UNDER_REVIEW',
          inspectionResult: 'GOOD',
          disposition: 'RESTOCK',
          financialStatus: 'PENDING',
          refundMethod: 'AR_CREDIT',
          totalAmount: 24500000,
          refundedAmount: 0,
          creditNoteNumber: null,
          inspectionNotes: 'Hàng nguyên seal niêm phong của nhà sản xuất, ngoại quan hoàn hảo, đủ phụ kiện đi kèm.',
          inspectedBy: 1,
          inspectedAt: nowSec - 86400 * 1,
          approvedBy: null,
          approvedAt: null,
          completedAt: null,
          rejectedAt: null,
          rejectionReason: null,
          requestDate: '2026-09-02',
          items: [
            {
              productId: 6,
              productCode: 'SKU-AUT-204',
              productName: 'Cụm cảm biến nhiệt độ đa điểm IoT Sensor v3',
              quantity: 10,
              uom: 'Bộ',
              lotSerial: 'LOT-2026-S441',
              condition: 'GOOD',
              unitPrice: 2450000,
              subtotal: 24500000,
              reason: 'Giao nhầm mã chủng loại cảm biến so với hợp đồng',
              disposition: 'RESTOCK',
              inspectedQuantity: 10,
              restockedQuantity: 0,
              scrappedQuantity: 0,
              replacedQuantity: 0
            }
          ]
        },
        {
          id: 3,
          rmaNumber: 'RMA-2026-0086',
          orderId: 103,
          orderCode: 'SO-2026-00168',
          deliveryCode: 'DEL-2026-0205',
          customerId: 103,
          customerName: 'Công ty TNHH Cơ điện Lạnh Đông Nam Á',
          warehouseId: 1,
          productCode: 'SKU-VAL-012',
          productName: 'Van điều áp khí nén 2 chiều SMC-Series',
          quantity: 5,
          uom: 'Chiếc',
          lotSerial: 'LOT-2026-V112',
          reason: 'Vỏ van bị trầy xước và biến dạng trong quá trình vận chuyển',
          requestedResolution: 'CREDIT (Cấn trừ công nợ / Hoàn tiền)',
          status: 'REQUESTED',
          inspectionResult: 'DAMAGED',
          disposition: 'PENDING',
          financialStatus: 'PENDING',
          refundMethod: 'CREDIT_NOTE',
          totalAmount: 6250000,
          refundedAmount: 0,
          creditNoteNumber: null,
          inspectionNotes: 'Chờ đối soát trách nhiệm đơn vị giao nhận Logistics M36 trước khi quyết định bồi thường.',
          inspectedBy: null,
          inspectedAt: null,
          approvedBy: null,
          approvedAt: null,
          completedAt: null,
          rejectedAt: null,
          rejectionReason: null,
          requestDate: '2026-09-08',
          items: [
            {
              productId: 7,
              productCode: 'SKU-VAL-012',
              productName: 'Van điều áp khí nén 2 chiều SMC-Series',
              quantity: 5,
              uom: 'Chiếc',
              lotSerial: 'LOT-2026-V112',
              condition: 'DAMAGED',
              unitPrice: 1250000,
              subtotal: 6250000,
              reason: 'Vỏ van bị trầy xước và biến dạng trong quá trình vận chuyển',
              disposition: 'PENDING',
              inspectedQuantity: 0,
              restockedQuantity: 0,
              scrappedQuantity: 0,
              replacedQuantity: 0
            }
          ]
        },
        {
          id: 4,
          rmaNumber: 'RMA-2026-0087',
          orderId: 104,
          orderCode: 'SO-2026-00195',
          deliveryCode: 'DEL-2026-0230',
          customerId: 104,
          customerName: 'Công ty TNHH Công nghệ Viễn thông Sao Mai',
          warehouseId: 1,
          productCode: 'PRD-001',
          productName: 'Laptop Business 14',
          quantity: 1,
          uom: 'Chiếc',
          lotSerial: 'SN-NB-2026-9812',
          reason: 'Màn hình chập chờn khi khởi động, cổng Thunderbolt không nhận',
          requestedResolution: 'REPAIR (Bảo hành sửa chữa kỹ thuật)',
          status: 'COMPLETED',
          inspectionResult: 'DEFECTIVE',
          disposition: 'REPAIR',
          financialStatus: 'RECONCILED',
          refundMethod: 'WARRANTY_REPAIR',
          totalAmount: 28500000,
          refundedAmount: 0,
          creditNoteNumber: null,
          inspectionNotes: 'Đã thay bo mạch I/O cổng Thunderbolt và cáp màn hình eDP. Chạy test 48h liên tục ổn định.',
          inspectedBy: 1,
          inspectedAt: nowSec - 86400 * 5,
          approvedBy: 1,
          approvedAt: nowSec - 86400 * 4,
          completedAt: nowSec - 86400 * 1,
          rejectedAt: null,
          rejectionReason: null,
          requestDate: '2026-09-12',
          items: [
            {
              productId: 8,
              productCode: 'PRD-001',
              productName: 'Laptop Business 14',
              quantity: 1,
              uom: 'Chiếc',
              lotSerial: 'SN-NB-2026-9812',
              condition: 'DEFECTIVE',
              unitPrice: 28500000,
              subtotal: 28500000,
              reason: 'Màn hình chập chờn khi khởi động, cổng Thunderbolt không nhận',
              disposition: 'REPAIR',
              inspectedQuantity: 1,
              restockedQuantity: 0,
              scrappedQuantity: 0,
              replacedQuantity: 0
            }
          ]
        },
        {
          id: 5,
          rmaNumber: 'RMA-2026-0088',
          orderId: 105,
          orderCode: 'SO-2026-00210',
          deliveryCode: 'DEL-2026-0255',
          customerId: 102,
          customerName: 'Tập đoàn Chế tạo Máy & Thiết bị Công nghiệp Hòa Phát',
          warehouseId: 1,
          productCode: 'SKU-ENG-088',
          productName: 'Bơm thủy lực cao áp P-1000',
          quantity: 1,
          uom: 'Cái',
          lotSerial: 'LOT-2026-X892',
          reason: 'Hao mòn cơ học vượt giới hạn do sử dụng sai hướng dẫn vận hành',
          requestedResolution: 'REPLACE (Đổi mới sản phẩm)',
          status: 'REJECTED',
          inspectionResult: 'REJECTED',
          disposition: 'SCRAP',
          financialStatus: 'PENDING',
          refundMethod: 'NO_REFUND',
          totalAmount: 18500000,
          refundedAmount: 0,
          creditNoteNumber: null,
          inspectionNotes: 'Phát hiện tạp chất cát lẫn trong buồng dầu gây kẹt piston, từ chối bảo hành theo điều khoản nhà sản xuất.',
          inspectedBy: 1,
          inspectedAt: nowSec - 86400 * 1,
          approvedBy: null,
          approvedAt: null,
          completedAt: null,
          rejectedAt: nowSec - 86400 * 1,
          rejectionReason: 'Khách hàng sử dụng dầu tái chế có lẫn dị vật, vi phạm quy định vận hành của nhà sản xuất.',
          requestDate: '2026-09-15',
          items: [
            {
              productId: 5,
              productCode: 'SKU-ENG-088',
              productName: 'Bơm thủy lực cao áp P-1000',
              quantity: 1,
              uom: 'Cái',
              lotSerial: 'LOT-2026-X892',
              condition: 'SCRAP',
              unitPrice: 18500000,
              subtotal: 18500000,
              reason: 'Hao mòn cơ học vượt giới hạn do sử dụng sai hướng dẫn vận hành',
              disposition: 'SCRAP',
              inspectedQuantity: 1,
              restockedQuantity: 0,
              scrappedQuantity: 1,
              replacedQuantity: 0
            }
          ]
        }
      ];

      for (const r of seedRmas) {
        await client.execute({
          sql: `INSERT INTO rma_requests (
            id, rma_number, order_id, order_code, delivery_code, customer_id, customer_name, warehouse_id,
            product_code, product_name, quantity, uom, lot_serial, reason, requested_resolution,
            status, inspection_result, disposition, financial_status, refund_method,
            total_amount, refunded_amount, credit_note_number, inspection_notes,
            inspected_by, inspected_at, approved_by, approved_at, completed_at, rejected_at, rejection_reason,
            request_date, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            r.id, r.rmaNumber, r.orderId, r.orderCode, r.deliveryCode, r.customerId, r.customerName, r.warehouseId,
            r.productCode, r.productName, r.quantity, r.uom, r.lotSerial, r.reason, r.requestedResolution,
            r.status, r.inspectionResult, r.disposition, r.financialStatus, r.refundMethod,
            r.totalAmount, r.refundedAmount, r.creditNoteNumber, r.inspectionNotes,
            r.inspectedBy, r.inspectedAt, r.approvedBy, r.approvedAt, r.completedAt, r.rejectedAt, r.rejectionReason,
            r.requestDate, 1, nowSec, nowSec
          ]
        });

        for (const it of r.items) {
          await client.execute({
            sql: `INSERT INTO rma_items (
              rma_request_id, product_id, product_code, product_name, quantity, uom, lot_serial,
              condition, unit_price, subtotal, reason, disposition, inspected_quantity,
              restocked_quantity, scrapped_quantity, replaced_quantity, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              r.id, it.productId, it.productCode, it.productName, it.quantity, it.uom, it.lotSerial,
              it.condition, it.unitPrice, it.subtotal, it.reason, it.disposition, it.inspectedQuantity,
              it.restockedQuantity, it.scrappedQuantity, it.replacedQuantity, nowSec
            ]
          });
        }
      }
    }

    // ==========================================
    // SEED M26 SCM & MRP INITIAL DATA
    // ==========================================
    const scmCheck = await client.execute("SELECT count(*) as count FROM scm_forecasts");
    if ((scmCheck.rows[0] as any)?.count === 0) {
      console.log("Seeding M26 SCM & MRP initial data...");
      const scmNow = Math.floor(Date.now() / 1000);

      await client.execute({
        sql: `INSERT INTO scm_forecasts (
          id, forecast_code, product_id, product_name, sku, warehouse_id, period,
          start_date, end_date, historical_avg_demand, forecast_quantity, actual_sales_quantity,
          forecast_method, accuracy_mae, accuracy_mape, confidence_level, status, notes, created_by, created_at, updated_at
        ) VALUES 
        (1, 'FCST-2026-09-001', 1, 'Laptop Business 14', 'PRD-001', 1, 'MONTHLY', '2026-09-01', '2026-09-30', 85, 120, 95, 'EXPONENTIAL_SMOOTHING', 4.8, 4.1, 95.0, 'ACTIVE', 'Dự báo nhu cầu cao điểm doanh nghiệp quý 3/2026', 'SCM Lead Planner', ?, ?),
        (2, 'FCST-2026-09-002', 2, 'Monitor 27"', 'PRD-002', 1, 'MONTHLY', '2026-09-01', '2026-09-30', 60, 90, 55, 'HOLT_WINTERS', 3.5, 3.8, 92.5, 'ACTIVE', 'Mô hình xu hướng Holt-Winters điều chỉnh mùa vụ', 'SCM Lead Planner', ?, ?),
        (3, 'FCST-2026-09-003', 5, 'Bơm thủy lực cao áp P-1000', 'SKU-ENG-088', 1, 'MONTHLY', '2026-09-01', '2026-09-30', 30, 45, 28, 'MOVING_AVERAGE', 2.1, 4.5, 90.0, 'ACTIVE', 'Nhu cầu phụ tùng bơm thủy lực dự phòng', 'SCM Lead Planner', ?, ?),
        (4, 'FCST-2026-09-004', 3, 'Keyboard Mechanical', 'PRD-003', 1, 'MONTHLY', '2026-09-01', '2026-09-30', 110, 150, 120, 'EXPONENTIAL_SMOOTHING', 5.2, 3.5, 95.0, 'ACTIVE', 'Dự báo bàn phím cơ văn phòng', 'SCM Lead Planner', ?, ?)`,
        args: [scmNow, scmNow, scmNow, scmNow, scmNow, scmNow, scmNow, scmNow]
      });

      await client.execute({
        sql: `INSERT INTO mps_schedules (
          id, mps_code, product_id, product_name, sku, warehouse_id, period,
          period_start_date, period_end_date, forecast_demand, sales_order_demand, total_gross_demand,
          projected_available_balance, available_to_promise, planned_production_qty, status, is_frozen, notes, created_at, updated_at
        ) VALUES
        (1, 'MPS-2026-W38-001', 1, 'Laptop Business 14', 'PRD-001', 1, 'WEEKLY', '2026-09-15', '2026-09-21', 30, 25, 30, 15, 20, 40, 'COMMITTED', 1, 'Lịch sản xuất cố định tuần 38 (Frozen Window)', ?, ?),
        (2, 'MPS-2026-W39-002', 2, 'Monitor 27"', 'PRD-002', 1, 'WEEKLY', '2026-09-22', '2026-09-28', 25, 18, 25, 10, 15, 30, 'PLANNED', 0, 'Lịch sản xuất linh hoạt tuần 39 (Liquid Window)', ?, ?),
        (3, 'MPS-2026-W39-003', 5, 'Bơm thủy lực cao áp P-1000', 'SKU-ENG-088', 1, 'WEEKLY', '2026-09-22', '2026-09-28', 12, 10, 12, 5, 8, 15, 'PLANNED', 0, 'Lịch lắp ráp bơm thủy lực công nghiệp', ?, ?)`,
        args: [scmNow, scmNow, scmNow, scmNow, scmNow, scmNow]
      });

      await client.execute({
        sql: `INSERT INTO mrp_runs (
          id, run_code, run_type, planning_horizon_days, warehouse_id, status,
          total_products_analyzed, total_gross_requirements, total_net_requirements,
          total_purchase_suggestions, total_mo_suggestions, total_exceptions, execution_duration_ms,
          triggered_by, parameters, created_at
        ) VALUES (
          1, 'MRP-20260921-001', 'regenerative', 90, 1, 'COMPLETED',
          5, 405, 205, 3, 2, 2, 342,
          'SCM Lead Planner', '{"runType":"regenerative","planningHorizonDays":90,"warehouseId":1}', ?
        )`,
        args: [scmNow]
      });

      await client.execute({
        sql: `INSERT INTO mrp_results (
          id, run_id, product_id, sku, product_name, product_type, level, parent_product_id, parent_sku,
          warehouse_id, gross_requirement, scheduled_receipts, on_hand_stock, reserved_stock, safety_stock,
          net_requirement, planned_order_receipt, planned_order_release, lead_time_days, suggested_action,
          suggested_order_qty, required_date, release_date, status, created_at
        ) VALUES
        (1, 1, 1, 'PRD-001', 'Laptop Business 14', 'FINISHED_GOOD', 0, NULL, NULL, 1, 120, 20, 50, 10, 10, 40, 40, 40, 5, 'CREATE_MO', 40, '2026-10-05', '2026-09-30', 'PROPOSED', ?),
        (2, 1, 2, 'PRD-002', 'Monitor 27"', 'FINISHED_GOOD', 0, NULL, NULL, 1, 90, 15, 45, 5, 10, 30, 30, 30, 4, 'CREATE_MO', 30, '2026-10-05', '2026-10-01', 'PROPOSED', ?),
        (3, 1, 3, 'PRD-003', 'Keyboard Mechanical', 'RAW_MATERIAL', 1, 1, 'PRD-001', 1, 150, 30, 60, 20, 20, 80, 100, 100, 7, 'CREATE_PR', 100, '2026-09-28', '2026-09-21', 'PR_CREATED', ?),
        (4, 1, 4, 'PRD-004', 'Wireless Mouse', 'RAW_MATERIAL', 1, 1, 'PRD-001', 1, 90, 20, 55, 15, 15, 35, 50, 50, 3, 'CREATE_PR', 50, '2026-09-28', '2026-09-25', 'PR_CREATED', ?),
        (5, 1, 5, 'SKU-ENG-088', 'Bơm thủy lực cao áp P-1000', 'RAW_MATERIAL', 0, NULL, NULL, 1, 45, 10, 20, 5, 10, 20, 20, 20, 10, 'CREATE_PR', 20, '2026-10-10', '2026-09-30', 'PROPOSED', ?)`,
        args: [scmNow, scmNow, scmNow, scmNow, scmNow]
      });

      await client.execute({
        sql: `INSERT INTO mrp_exceptions (
          id, run_id, product_id, sku, product_name, exception_type, severity, message, shortage_qty,
          days_past_due, suggested_remediation, is_resolved, resolved_by, resolved_at, created_at
        ) VALUES
        (1, 1, 3, 'PRD-003', 'Keyboard Mechanical', 'CRITICAL_STOCKOUT', 'CRITICAL', 'Cảnh báo thiếu hụt nghiêm trọng: SKU PRD-003 tồn khả dụng (40) không đủ bù đắp nhu cầu sản xuất (150).', 80, 0, 'Phát hành PR đặt mua hàng nhanh với NCC ưu tiên', 0, NULL, NULL, ?),
        (2, 1, 4, 'PRD-004', 'Wireless Mouse', 'LEAD_TIME_VIOLATION', 'HIGH', 'Vi phạm Lead Time: Thời gian giao hàng (7 ngày) sát ngày yêu cầu lắp ráp.', 35, 2, 'Đàm phán với NCC để rút ngắn Lead Time hoặc điều chuyển kho', 0, NULL, NULL, ?)`,
        args: [scmNow, scmNow]
      });
    }

    const prCheck = await client.execute("SELECT count(*) as count FROM purchase_requisitions");
    if ((prCheck.rows[0] as any)?.count === 0) {
      const scmNow = Math.floor(Date.now() / 1000);
      await client.execute({
        sql: `INSERT INTO purchase_requisitions (
          id, pr_number, mrp_run_id, mrp_result_id, product_id, sku, product_name, quantity, uom,
          estimated_unit_cost, estimated_total_amount, suggested_supplier_id, suggested_supplier_name,
          warehouse_id, required_date, priority, status, delegated_po_id, delegated_po_code, delegated_at, delegated_by,
          requested_by, approval_notes, created_at, updated_at
        ) VALUES
        (1, 'PR-2026-0001', 1, 3, 3, 'PRD-003', 'Keyboard Mechanical', 100, 'Cái', 450000, 45000000, 1, 'Công ty TNHH Thiết bị Công nghệ Minh Quân', 1, '2026-09-28', 'HIGH', 'PENDING', NULL, NULL, NULL, NULL, 'MRP Engine', 'Nhu cầu lắp ráp Laptop Business 14 đợt 1', ?, ?),
        (2, 'PR-2026-0002', 1, 4, 4, 'PRD-004', 'Wireless Mouse', 50, 'Cái', 250000, 12500000, 1, 'Công ty TNHH Thiết bị Công nghệ Minh Quân', 1, '2026-09-28', 'NORMAL', 'CONVERTED_TO_PO', 1, 'PO-2026-0001', ?, 'SCM Engine (Delegated to M08)', 'MRP Engine', 'Đã ủy quyền thành công sang M08', ?, ?),
        (3, 'PR-2026-0003', 1, 5, 5, 'SKU-ENG-088', 'Bơm thủy lực cao áp P-1000', 20, 'Cái', 18500000, 370000000, 2, 'Công ty Cổ phần Thép & Chế tạo Máy Nam Định', 1, '2026-10-10', 'URGENT', 'PENDING', NULL, NULL, NULL, NULL, 'MRP Engine', 'Dự phòng phụ tùng cho khách hàng Hòa Phát', ?, ?)`,
        args: [scmNow, scmNow, scmNow, scmNow, scmNow, scmNow]
      });
    }

    // ==========================================
    // SEED M38 IT SERVICE DESK & SLA POLICIES
    // ==========================================
    const m38Perms = [
      'servicedesk:read', 'servicedesk:write', 'servicedesk.ticket.manage',
      'servicedesk.sla.manage', 'servicedesk.access.approve', 'servicedesk.access.fulfill'
    ];
    for (const p of m38Perms) {
      await client.execute({
        sql: `INSERT OR IGNORE INTO permissions (code) VALUES (?)`,
        args: [p]
      });
    }
    await client.execute(`
      INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.name IN ('SUPER_ADMIN', 'ADMIN') AND p.code LIKE 'servicedesk%'
    `);

    const slaCheck = await client.execute("SELECT count(*) as count FROM sla_policies");
    if ((slaCheck.rows[0] as any)?.count === 0) {
      console.log("Seeding M38 default SLA policies...");
      const m38Now = Math.floor(Date.now() / 1000);
      await client.execute({
        sql: `INSERT INTO sla_policies (
          id, policy_code, policy_name, priority, response_hours, resolution_hours,
          warning_75_threshold_pct, warning_90_threshold_pct, business_hours_only,
          escalation_target_role_id, description, is_active, created_at, updated_at
        ) VALUES
        (1, 'SLA-P1', 'P1 - URGENT (Khẩn cấp: Tê liệt hệ thống/POS/Kho)', 'URGENT', 0.25, 2.0, 75.0, 90.0, 0, 'IT_LEAD', 'Cam kết phản hồi 15 phút, xử lý trong 2 giờ. Hỗ trợ 24/7/365.', 1, ?, ?),
        (2, 'SLA-P2', 'P2 - HIGH (Ưu tiên cao: Gián đoạn một phần nghiệp vụ)', 'HIGH', 0.5, 4.0, 75.0, 90.0, 1, 'IT_SUPPORT_TIER2', 'Cam kết phản hồi 30 phút, xử lý trong 4 giờ hành chính.', 1, ?, ?),
        (3, 'SLA-P3', 'P3 - NORMAL (Bình thường: Sự cố cá nhân/Lỗi ứng dụng)', 'NORMAL', 2.0, 8.0, 75.0, 90.0, 1, 'IT_SUPPORT_TIER1', 'Cam kết phản hồi 2 giờ, xử lý trong 8 giờ hành chính (1 ngày làm việc).', 1, ?, ?),
        (4, 'SLA-P4', 'P4 - LOW (Thấp: Yêu cầu cấp quyền/Tư vấn/Tài liệu)', 'LOW', 4.0, 24.0, 75.0, 90.0, 1, 'IT_SUPPORT_TIER1', 'Cam kết phản hồi 4 giờ, hoàn tất trong 24 giờ hành chính (3 ngày làm việc).', 1, ?, ?)`,
        args: [m38Now, m38Now, m38Now, m38Now, m38Now, m38Now, m38Now, m38Now]
      });
    }

    // ==========================================
    // SEED M40 EHS SAFETY & ENVIRONMENT
    // ==========================================
    const m40Perms = [
      'ehs:read', 'ehs:write', 'ehs.incident.manage', 'ehs.audit.manage',
      'ehs.capa.manage', 'ehs.permit.approve', 'ehs.environmental.manage'
    ];
    for (const p of m40Perms) {
      await client.execute({
        sql: `INSERT OR IGNORE INTO permissions (code) VALUES (?)`,
        args: [p]
      });
    }
    await client.execute(`
      INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.name IN ('SUPER_ADMIN', 'ADMIN') AND p.code LIKE 'ehs%'
    `);

    const ehsFireCheck = await client.execute("SELECT count(*) as count FROM ehs_fire_equipment");
    if ((ehsFireCheck.rows[0] as any)?.count === 0) {
      console.log("Seeding M40 EHS Safety, Fire Equipment, JSA, and Audits...");
      const nowTs = Math.floor(Date.now() / 1000);
      
      // 1. Fire Safety Equipment (with 1 overdue item FE-WH01-003 for Golden Test Verification!)
      await client.execute({
        sql: `INSERT INTO ehs_fire_equipment (
          id, equipment_code, name, type, warehouse_id, warehouse_name,
          specific_location, last_inspection_date, expiry_date, weight_kg,
          pressure_status, status, related_asset_id, created_at, updated_at
        ) VALUES
        (1, 'FE-WH01-001', 'Bình bột chữa cháy ABC 4kg', 'FIRE_EXTINGUISHER_ABC', 1, 'Kho Tổng Logistics M17 - Dãy C', 'Cột B-12 Cửa xuất kho', '2026-06-15', '2026-12-15', 4.0, 'NORMAL', 'READY', 1, ?, ?),
        (2, 'FE-WH01-002', 'Bình khí CO2 chữa cháy 5kg', 'FIRE_EXTINGUISHER_CO2', 1, 'Kho Tổng Logistics M17 - Dãy C', 'Khu vực Tủ điện chính', '2026-05-10', '2026-11-10', 5.0, 'NORMAL', 'READY', 2, ?, ?),
        (3, 'FE-WH01-003', 'Bình bột chữa cháy xe đẩy 35kg', 'FIRE_EXTINGUISHER_ABC', 1, 'Kho Tổng Logistics M17 - Dãy C', 'Cụm kho Hóa chất & Dung môi', '2026-02-01', '2026-08-01', 35.0, 'LOW', 'EXPIRED', NULL, ?, ?),
        (4, 'FE-WH02-001', 'Họng tiếp nước cứu hỏa DN65', 'HYDRANT', 2, 'Kho Chi nhánh Miền Nam', 'Vách ngoài cổng 1', '2026-04-10', '2026-10-10', NULL, 'NORMAL', 'READY', NULL, ?, ?)`,
        args: [nowTs, nowTs, nowTs, nowTs, nowTs, nowTs, nowTs, nowTs]
      });

      // 2. Incidents
      await client.execute({
        sql: `INSERT INTO ehs_incidents (
          id, incident_number, title, incident_type, severity, warehouse_id, warehouse_name,
          location_detail, incident_date, reported_by_name, description, immediate_action,
          root_cause, status, created_at, updated_at
        ) VALUES
        (1, 'EHS-INC-2026-0001', 'Tràn đổ dung môi hữu cơ tại kho hóa chất', 'ENVIRONMENTAL_SPILL', 'HIGH', 1, 'Kho Tổng Logistics M17 - Dãy C', 'Khu vực lưu trữ dung môi phụ gia', '2026-08-28', 'Nguyễn Văn An (EHS Lead)', 'Bục van xả bồn chứa dung môi 200L làm tràn khoảng 15L ra sàn thao tác.', 'Cô lập bán kính 15m, rải cát hấp thụ và thu gom vào thùng chứa rác nguy hại.', 'Zoăng cao su van xả bị lão hóa do nhiệt độ môi trường cao.', 'INVESTIGATING', ?, ?),
        (2, 'EHS-INC-2026-0002', 'Chập điện cục bộ tại máy mài CNC số 4', 'ELECTRICAL_HAZARD', 'CRITICAL', 1, 'Kho Tổng Logistics M17 - Dãy C', 'Xưởng Cơ khí Chế tạo - Line CNC 1', '2026-08-27', 'Trần Thị Bích (Safety Officer)', 'Chập phóng điện tia lửa tại cụm rơ le nguồn máy CNC.', 'Ngắt cầu dao tổng, dập tắt tia lửa bằng bình CO2 và gắn thẻ LOTO.', 'Dây cáp nguồn bị chuột cắn hở lõi đồng.', 'CLOSED', ?, ?),
        (3, 'EHS-INC-2026-0003', 'Suýt rơi pallet linh kiện từ xe nâng cao', 'NEAR_MISS', 'MEDIUM', 1, 'Kho Tổng Logistics M17 - Dãy C', 'Dãy kệ cao A4 - Kho phụ tùng', '2026-08-25', 'Lê Hoàng Nam (Warehouse Supervisor)', 'Pallet bị nghiêng 30 độ khi nâng lên tầng 4 do đóng gói lệch tâm.', 'Hạ pallet xuống sàn, tái quấn màng PE cố định và kiểm tra xe nâng.', 'Nhân viên bốc dỡ chưa tuân thủ quy cách xếp hàng so le.', 'OPEN', ?, ?)`,
        args: [nowTs, nowTs, nowTs, nowTs, nowTs, nowTs]
      });

      // 3. JSA Risk Assessments
      await client.execute({
        sql: `INSERT INTO ehs_risk_assessments (
          id, assessment_code, job_title, work_area, warehouse_id, warehouse_name,
          severity_score, probability_score, risk_score, risk_level, hazards_json,
          control_measures, assessed_by, review_date, status, created_at, updated_at
        ) VALUES
        (1, 'JSA-2026-0001', 'Vận hành xe nâng bốc xếp hàng trên cao (>4m)', 'Kho hàng Logistics Tổng', 1, 'Kho Tổng Logistics M17 - Dãy C', 4, 3, 12, 'HIGH', '["Rơi đổ hàng hóa từ trên cao", "Va chạm người đi bộ", "Lật xe nâng do quá tải"]', 'Bắt buộc kiểm tra xe đầu ca, trang bị mũ bảo hộ cấp 2, cấm người đi bộ vào luồng xe nâng đang nâng hàng.', 'Nguyễn Văn An (EHS Lead)', '2026-12-31', 'ACTIVE', ?, ?),
        (2, 'JSA-2026-0002', 'Hàn cắt kim loại và bảo trì lò nhiệt (Hot Work)', 'Khu vực Xưởng Bảo dưỡng Cơ điện', 1, 'Kho Tổng Logistics M17 - Dãy C', 5, 4, 20, 'EXTREME', '["Bỏng nhiệt", "Hỏa hoạn do xỉ hàn văng", "Ngạt khí độc"]', 'Bắt buộc xin Giấy phép Hot Work EHS, bố trí người canh lửa (Fire Watch) kèm 02 bình CO2, cách ly vật liệu dễ cháy 10m.', 'Phạm Minh Đức (Safety Inspector)', '2026-11-30', 'ACTIVE', ?, ?),
        (3, 'JSA-2026-0003', 'Chiết rót hóa chất tẩy rửa công nghiệp', 'Trạm pha chế & tẩy rửa', 1, 'Kho Tổng Logistics M17 - Dãy C', 3, 2, 6, 'MEDIUM', '["Bắn hóa chất vào mắt/da", "Hít phải hơi độc hữu cơ"]', 'Trang bị kính chống hóa chất, găng tay cao su nitrile, làm việc dưới chụp hút khí cục bộ.', 'Trần Thị Bích (Safety Officer)', '2026-12-15', 'ACTIVE', ?, ?)`,
        args: [nowTs, nowTs, nowTs, nowTs, nowTs, nowTs]
      });

      // 4. CAPAs
      await client.execute({
        sql: `INSERT INTO ehs_capas (
          id, capa_number, source_ref_type, source_ref_id, source_ref_code, title,
          action_type, root_cause_summary, action_plan, assigned_to_name,
          warehouse_id, warehouse_name, due_date, status, created_at, updated_at
        ) VALUES
        (1, 'EHS-CAPA-2026-0001', 'INCIDENT', 1, 'EHS-INC-2026-0001', 'Thay thế toàn bộ zoăng chịu hóa chất và lắp khay hứng chống tràn', 'CORRECTIVE', 'Zoăng cao su thông thường không chịu được dung môi.', 'Đặt hàng zoăng PTFE chuyên dụng và lắp khay hứng tràn composite 250L.', 'Trần Quốc Bảo (Bảo trì cơ điện)', 1, 'Kho Tổng Logistics M17 - Dãy C', '2026-09-30', 'IN_PROGRESS', ?, ?),
        (2, 'EHS-CAPA-2026-0002', 'AUDIT', 1, 'EHS-AUD-2026-0001', 'Nạp sạc và dán tem kiểm định lại cụm bình chữa cháy quá hạn', 'CORRECTIVE', 'Cụm bình FE-WH01-003 quá hạn kiểm định từ 01/08/2026.', 'Liên hệ đơn vị PCCC được cấp phép mang bình đi nạp bột và cấp tem mới.', 'Nguyễn Hoàng Nam (Thủ kho)', 1, 'Kho Tổng Logistics M17 - Dãy C', '2026-10-05', 'OPEN', ?, ?)`,
        args: [nowTs, nowTs, nowTs, nowTs]
      });

      // 5. Environmental Records
      await client.execute({
        sql: `INSERT INTO ehs_environmental_records (
          id, record_number, record_type, warehouse_id, warehouse_name, parameter_name,
          measured_value, standard_threshold, unit, compliance_status, recorded_date,
          notes, recorded_by, created_at
        ) VALUES
        (1, 'ENV-2026-0001', 'WASTE_WATER', 1, 'Kho Tổng Logistics M17 - Dãy C', 'COD (Nhu cầu oxy hóa học)', 65.4, 75.0, 'mg/L', 'COMPLIANT', '2026-09-20', 'Đạt quy chuẩn QCVN 40:2011/BTNMT Cột A', 'Ban Môi trường ISO 14001', ?),
        (2, 'ENV-2026-0002', 'WASTE_WATER', 1, 'Kho Tổng Logistics M17 - Dãy C', 'pH nước thải sau xử lý', 7.2, 8.5, 'pH', 'COMPLIANT', '2026-09-20', 'Trong giới hạn cho phép 6.0 - 9.0', 'Ban Môi trường ISO 14001', ?),
        (3, 'ENV-2026-0003', 'EXHAUST_GAS', 1, 'Kho Tổng Logistics M17 - Dãy C', 'Bụi tổng TSP ống khói lò', 185.0, 200.0, 'mg/Nm3', 'COMPLIANT', '2026-09-18', 'Đo đạc định kỳ Quý 3/2026', 'Trung tâm Quan trắc Môi trường', ?),
        (4, 'ENV-2026-0004', 'HAZARDOUS_WASTE', 1, 'Kho Tổng Logistics M17 - Dãy C', 'Chất thải dính dầu mỡ (Mã 19 12 03)', 120.0, 100.0, 'kg', 'EXCEEDED', '2026-09-22', 'Vượt định mức lưu chứa tạm thời quá 100kg, cần chuyển giao cho bên thu gom', 'Ban Môi trường ISO 14001', ?)`,
        args: [nowTs, nowTs, nowTs, nowTs]
      });

      // 6. Safety Permits (LOTO & Hot Work)
      await client.execute({
        sql: `INSERT INTO ehs_safety_permits (
          id, permit_number, permit_type, target_asset_id, target_asset_code, target_asset_name,
          warehouse_id, warehouse_name, area_location, description, valid_from, valid_to,
          applicant_name, approver_name, loto_tag_number, status, created_at, updated_at
        ) VALUES
        (1, 'PMT-2026-0001', 'LOTO_ISOLATION', 1, 'AST-0001', 'Máy phay CNC 5 trục Haas VF-2', 1, 'Kho Tổng Logistics M17 - Dãy C', 'Xưởng Cơ khí Line 1', 'Khóa cách ly điện 3 pha và xả áp suất khí nén để thay trục chính spindle.', '2026-09-24', '2026-09-26', 'Nguyễn Kỹ Thuật (EAM Team)', 'Nguyễn Văn An (EHS Lead)', 'LOTO-TAG-2026-088', 'ACTIVE', ?, ?),
        (2, 'PMT-2026-0002', 'HOT_WORK', NULL, NULL, NULL, 1, 'Kho Tổng Logistics M17 - Dãy C', 'Mái che ngoài trời kho A', 'Hàn gia cố khung sắt giàn mái kho.', '2026-09-25', '2026-09-25', 'Lê Thợ Hàn (Đội Cơ khí)', 'Trần Thị Bích (Safety Officer)', NULL, 'APPROVED', ?, ?)`,
        args: [nowTs, nowTs, nowTs, nowTs]
      });

      // 7. Site Scope
      await client.execute({
        sql: `INSERT OR REPLACE INTO ehs_site_scope (
          id, warehouse_id, warehouse_name, safety_officer_name, audit_frequency_days,
          emergency_contact, is_active, updated_at
        ) VALUES
        (1, 1, 'Kho Tổng Logistics M17 - Dãy C', 'Nguyễn Văn An (EHS Lead)', 30, '0903-114-115 (Đội PCCC Cơ sở)', 1, ?),
        (2, 2, 'Kho Chi nhánh Miền Nam', 'Trần Thị Bích (Safety Officer)', 30, '0908-999-888', 1, ?)`,
        args: [nowTs, nowTs]
      });
    }

    console.log("Database successfully bootstrapped and verified.");
  } catch (err) {
    console.error("Error during database bootstrap:", err);
  }
}

