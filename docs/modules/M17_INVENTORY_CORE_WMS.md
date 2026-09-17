# M17 — Master WMS & Core Inventory Engine
## Enterprise Architecture & Module Specification

**Module ID:** `M17`  
**Module Name:** Master WMS & Core Inventory Engine (Trung Tâm Quản Lý Kho & Động Cơ Tồn Kho 3 Trạng Thái)  
**Business Group:** `03. WAREHOUSE & LOGISTICS`  
**Workspace ID:** `WS05_MASTER_WMS` | **Primary Route:** `/inventory`  
**Mounted UI Component:** `src/modules/inventory/m17-master-wms/components/MasterWmsWorkspace.tsx`  
**Sub-Components:** `MasterWmsWorkspace.tsx`, `types.ts`, `mockData.ts`  
**Primary API Endpoints:**  
- `GET  /api/inventory/balances` (Query stock balances across warehouses and locations)  
- `GET  /api/inventory/ledger` (Immutable append-only stock movement audit trail)  
- `GET  /api/inventory/movements` (Multi-dimensional movement history)  
- `POST /api/inventory/transactions` (Single-writer postTransaction engine)  
- `POST /api/inventory/reservations` (Reserve stock for orders / allocations)  
- `POST /api/inventory/reservations/:id/release` (Release stock reservation)  
- `POST /api/inventory/transfers` (Atomic internal stock transfers)  
- `POST /api/inventory/transfers/request` (Multi-step transfer: Request)  
- `POST /api/inventory/transfers/:id/approve` (Multi-step transfer: Approve)  
- `POST /api/inventory/transfers/:id/dispatch` (Multi-step transfer: Dispatch to IN_TRANSIT)  
- `POST /api/inventory/transfers/:id/receive` (Multi-step transfer: Receive at destination)  
- `POST /api/inventory/opening-balances` (Opening balance batch import)  
- `POST /api/inventory/stocktakes/:id/start` (Stocktake: Snapshot & Start counting)  
- `POST /api/inventory/stocktakes/:id/record-count` (Stocktake: Record counts & variance)  
- `POST /api/inventory/stocktakes/:id/approve-adjustment` (Stocktake: Approve adjustments)  
- `POST /api/inventory/lots/:id/status` (Update Lot Status: AVAILABLE, QUARANTINED, BLOCKED, EXPIRED)  
- `GET  /api/inventory/traceability/:productId` (Product inventory timeline & trace)  
- `GET  /api/inventory/reconciliation` (3-State invariant audit & integrity report)  
- `POST /api/inventory/allocations/fifo-fefo` (FIFO / FEFO lot picking strategy recommendation)  
- `POST /api/inventory/reservations/expire-sweeper` (Sweep & auto-release expired stock reservations)  
- `GET  /api/inventory/analytics/reorder-alerts` (Reorder point & safety stock threshold alerts)  
- `GET  /api/inventory/analytics/aging` (Inventory aging 4-tier breakdown & valuation)  
- `GET  /api/inventory/analytics/slow-moving` (Slow-moving stock & tied-up capital analysis)  
- `GET  /api/inventory/quarantine-blocked` (Quarantined and blocked stock summary)  
- `GET  /api/inventory/in-transit` (In-transit shipments & cross-warehouse inventory)  
- `GET  /api/inventory/dashboard/advanced` (Advanced operations cockpit metrics & KPIs)  
- `GET  /api/inventory/planning/replenishment-proposals` (Demand forecasting & auto purchase replenishment proposals)  
- `GET  /api/inventory/analytics/abc-analysis` (ABC Pareto inventory classification & capital distribution)  
- `POST /api/inventory/wms/wave-picking` (Wave picking optimization & path-sorted picking tasks)  
- `POST /api/inventory/wms/wave-picking/complete-task` (Complete wave pick task & auto-complete wave)  
- `POST /api/inventory/scanner/scan` (Universal mobile barcode & QR code parser)  
- `POST /api/inventory/offline-queue/enqueue` (Enqueue controlled offline transactions)  
- `POST /api/inventory/offline-queue/process` (Chronological offline queue sync & conflict resolver)  
- `GET  /api/inventory/offline-queue/status` (Offline queue status & conflict diagnostics)  
**Status:** `CERTIFIED & FROZEN BASELINE` (Compliant with Rule #01–#20 & Single-Writer Invariants)

---

## 1. Executive Summary & Purpose

**M17 (Master WMS & Core Inventory)** is the foundational operational inventory engine of NexusSync ERP and holds the **Exclusive Single-Writer Authority** for physical inventory mutations (`InventoryService.postTransaction()`). It maintains strict 3-state inventory accounting:
1. **On Hand (Physical Stock):** Total physical inventory present in warehouses/locations.
2. **Allocated (Reserved Stock):** Stock reserved for pending sales orders (M13), retail POS (M16), or manufacturing allocations (M25).
3. **Available Stock:** Calculated dynamically as `Available = On Hand - Allocated`.

---

## 2. Strict Domain Authority & Non-Authority Boundaries (Rules #01–#07)

⚠️ **CRITICAL ARCHITECTURAL DIRECTIVE: EXCLUSIVE INVENTORY SINGLE WRITER.**
- **Single-Writer Invariant:** `InventoryService.postTransaction()` is the ONLY method permitted to mutate physical, reserved, and available stock balances in the entire ERP.
- **Strict Prohibition:** No other module (Sales M13, POS M16, Purchase M08, Manufacturing M25, Adjustments M20, Invoices M31) may execute direct SQL updates or mutations on inventory balances or ledger tables. All must invoke `InventoryService.postTransaction()`.
- **Negative Stock Guard:** Enforces `On Hand ≥ 0` and `Available ≥ 0`. Any violation triggers an immediate rejection unless explicitly overridden by authorized personnel with `inventory.override_negative_stock` and mandatory audit logging.
- **Audit Parity (M02 Integration):** Every inventory transaction writes an immutable append-only ledger record and generates a cryptographic audit log.

---

## 3. Core Feature Architecture & Functional Groups

### A. Core Inventory Engine (`postTransaction`)
- Atomic database transactions combining ledger append, balance updates, lot/serial validation, and global product cache synchronization.
- Idempotency protection via `idempotencyKey` to prevent duplicate transaction postings.
- Concurrency control preventing race conditions during simultaneous stock issues across multiple terminals.

### B. Reservation & Release Engine
- `reserveStock`: Decrements Available and increments Reserved without altering Physical On Hand.
- `releaseReservation`: Restores Available and decrements Reserved.
- `consumeReserved`: Automatically handles issued reserved stock when orders are fulfilled.

### C. Lot, Serial & FEFO/FIFO Tracking
- Lot tracking with expiration dates, manufacturing dates, and status (`AVAILABLE`, `QUARANTINED`, `BLOCKED`, `EXPIRED`).
- Serial number tracking ensuring 4-dimensional integrity (`productId + warehouseId + locationId + status`).
- FEFO/FIFO issue strategies configured via system parameters (M03).

### D. Advanced Intelligence & Operations Extensions (P3)
- **Demand Forecasting & Auto Replenishment Proposals**: Analyzes historical consumption velocity (`stockLedger` outbound movements) over 30/60/90 days, computes lead-time demand + dynamic safety stock thresholds, and aggregates purchase replenishment proposals by primary supplier for 1-click PO generation.
- **ABC Analysis (Pareto Classification)**: Evaluates enterprise inventory valuation and turnover, categorizing SKUs into Class A (Top 80% capital value), Class B (Next 15%), and Class C (Remaining 5%) with actionable governance guidelines.
- **Wave Picking Optimization**: Batches multiple sales orders into consolidated picking waves, generating picking tasks sequenced alphabetically by warehouse location code to optimize picker transit paths.
- **Universal Mobile Scanner Engine**: Decodes and resolves GS1-128, EAN, SKU, LOT (`LOT:xxx`), SERIAL (`SN:xxx`), and LOCATION (`LOC:xxx`) barcodes with real-time on-hand and availability validation.
- **Controlled Offline Transaction Queue**: Ingests offline transactions with client-side idempotency keys and sequence timestamps. Executes chronological synchronization, enforcing negative stock guards and capturing conflicts (`REJECTED_CONFLICT`) into a diagnostic queue without corrupting ledger invariants.

---

## 4. UI/UX Standards & Enterprise Requirements (Rule #19 & Rule #20)

- **L0 Workspace Banner:** Clean enterprise card with module badge `M17 • MASTER WMS & CORE INVENTORY`, Rule #19 confirmation badge, and Deep-Link to M20 Stock Adjustment Engine.
- **L1 Sub-tabs:** Dedicated views for Balances (`balances`), Ledger (`ledger`), Lot/Serial Drilldown, and Reorder Alerts.
- **Typography & Formatting:** All quantities, valuations, and ledger movements are rendered in `font-mono tabular-nums font-semibold text-right` with standard Vietnamese number separators (`1.500 Cái`, `25.500.000 ₫`).
- **Dark Mode Parity:** Comprehensive `dark:*` styling across all tables, cards, and modals.

---

## 5. Verification & Governance Sign-Off

- **Module Status:** `FROZEN & IMMUTABLE BASELINE`
- **Build Status:** Verified passing `npm run build` / `compile_applet`.
- **Architectural Conformance:** 100% compliant with the 20 Architecture Development Rules of NexusSync ERP.

