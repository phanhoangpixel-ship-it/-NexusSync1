# MASTER WMS ARCHITECTURE AUDIT REPORT
**NexusSync ERP - Phase 26 WMS & Inventory Reconciliation**
**Date:** August 31, 2026
**Author:** Enterprise ERP & Architecture Governance Board

---

## 1. EXECUTIVE SUMMARY
This audit establishes the rigorous architectural boundary and reconciliation framework for modules **M17 through M24** (The WMS & Inventory Suite). 
The primary objective of this audit is to verify that the newly introduced **MASTER WMS WORKSPACE (WS05_MASTER_WMS)** ("Trung Tâm Vận Hành Kho & WMS") successfully unifies the operational user experience **without violating** individual domain ownership, database tables, or authoritative services of M17–M24.

---

## 2. MODULE BOUNDARY & AUTHORITATIVE OWNERSHIP MATRIX

| Module ID | Module Name | Domain & Ownership Authority | Primary Database Tables | Authoritative Service / Engine | Consumers / Downstream |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M17** | Inventory Core | Inventory State & Balance Authority | `inventory_balances`, `stock_ledger` | `InventoryService`, `inventoryService.ts` | M13 (Sales), M08 (Purchase), M20–M24 |
| **M18** | Warehouse Management | Warehouse, Zone, Rack, Bin Structure | `warehouses`, `locations`, `bins` | `warehouseManagementService` | M17, M21, M24 |
| **M19** | Stocktake / Kiểm kê | Blind Count & Variance Authority | `stocktakes`, `stocktake_items` | `stocktakeService` | M20 (Adjustment) |
| **M20** | Stock Adjustment | Adjustment Document & Approval | `stock_adjustments`, `adjustment_items` | `stockAdjustmentService` | M17 (InventoryService.postTransaction) |
| **M21** | Internal Transfers | Inter-warehouse & In-Transit Transfer | `stock_transfers`, `transfer_items` | `transferService` | M17, M18 |
| **M22** | Lots & Batches | Lot / Batch Traceability & FEFO | `lots_batches`, `lot_movements` | `serialEngine.ts`, `lotService` | M17, M24 |
| **M23** | Serials & IMEI | Serial Number Traceability | `serial_numbers`, `serial_ledger` | `serialEngine.ts` | M17, M15 (RMA), M24 |
| **M24** | WMS Extended | Wave Picking, LPN, Dock, Carrier | `wms_wave_picks`, `lpn_boxes` | `wmsExtendedService` | M18, M21, M23 |

---

## 3. ARCHITECTURAL INVARIANTS & GOVERNANCE RULES

1. **Single Writer Principle for Inventory State:** All inventory balance updates (`Physical`, `Allocated`, `Available`) MUST flow through `InventoryService.postTransaction()`. Direct table manipulation (`UPDATE inventory`) outside the authoritative service is strictly flagged as an **Architectural Violation**.
2. **Product Identity Authority:** Products and SKUs are owned exclusively by **M07 (Product Master)**. WMS modules reference `product_id` and `sku` via foreign key reference; they do not create or modify product catalog definitions.
3. **Pricing Authority:** Cost and pricing valuation are owned by **M41 (Commercial Pricing)** and Costing Engine. WMS views display valuation snapshots but do not calculate price overrides.
4. **Zero Domain Collapse:** M17–M24 maintain their distinct backend controllers, API routes (`/api/products`, `/api/warehouses`, `/api/stocktakes`, `/api/stock-adjustments`, `/api/stock-transfers`, `/api/lots`, `/api/serials`, `/api/wms/*`), and database tables.

---

## 4. VERDICT
**Status:** `A — OPERATIONALLY VERIFIED`
All domain boundaries remain intact. Master WMS acts purely as an aggregated operational presentation and task coordination wrapper.
