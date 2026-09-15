# NEXUSSYNC ERP - M16 POS RETAIL & COUNTER ARCHITECTURE

## 1. Architectural Overview & Domain Boundaries
Module M16 (POS Retail & Counter) acts as the high-speed **POS Transaction Orchestrator** in NexusSync ERP. It bridges frontend touch interactions (barcode scanner, touch screen, cart management, customer selector) with authoritative backend services without duplicating domain rules or business logic.

```
POS UI (React Terminal)
  ↓ (API REST / JSON + Idempotency-Key)
M16 API Express Controllers
  ↓
M16 POS Transaction Orchestrator (SalesEngine / ShiftEngine)
  ↓
Authoritative Domain Services:
  - InventoryService.postTransaction() [Inventory Single Writer]
  - CashMovementService.postMovement() [Cash Ledger Single Writer]
  - ShiftEngine [Shift Attribution Authority]
  - PricingService (M41) [Advanced Pricing & Margin]
  - Central Tax Engine [VAT & Compliance]
  - Audit / EventBus / Outbox [Traceability & Event Sinks]
```

## 2. Core Architectural Principles
1. **Single Writer Authority**: M16 never inserts directly into `inventory_transactions` or `cash_movements`. All inventory changes go through `InventoryService.postTransaction()`. All cash drawer movements go through `CashMovementService.postMovement()`.
2. **Shift Attribution**: Every cash transaction must bind to an active shift ID (`shiftId`). Historical shifts remain isolated and immutable.
3. **Multi-Payment Isolation**: Supports split payments (CASH, CARD, BANK_TRANSFER, QR, E_WALLET, VOUCHER, CREDIT, COD). Only cash payments hit the cashier shift cash drawer.
4. **Zero Frontend Business Calculations**: Expected cash, variance, pricing, and taxes are authoritative calculations from the backend. The UI only displays and captures inputs.
5. **Rule #19 Compliance**: Absolute elimination of browser `alert()` and `confirm()`. All user confirmations are handled via `ConfirmDialog.tsx`.
