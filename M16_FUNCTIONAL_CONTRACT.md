# NEXUSSYNC ERP - M16 FUNCTIONAL CONTRACT

## 1. Functional Scope & Modules
- **POS Terminal**: High-speed catalog search, barcode scanning, quantity UOM adjustment, price tiering, line discounts, customer lookup, hold/resume cart, cancel transaction.
- **Cart & Line Items**: Product details, UOM, pricing, tax calculations, lot/batch/serial/IMEI tracking for serialized items.
- **Payment Engine**: Multi-payment split processing (Cash, Card, Bank Transfer, QR, E-Wallet, Voucher, Credit, COD).
- **Cash & Shift Management**: Shift opening with opening float, cash in/out movements, denomination cash count, expected cash reconciliation, variance approval with Separation of Duties (SoD).
- **Transaction History**: Search, review receipt details, print receipt, void, cancel, and initiate refund via M15 RMA.

## 2. Invariants & Rules
- **Rule #19**: UI utilizes `ConfirmDialog.tsx` exclusively.
- **Inventory Rule**: Direct stock decrement is strictly prohibited; all stock changes go through `InventoryService`.
- **Cash Drawer Rule**: Cash sales automatically record a cash movement assigned to the active shift via `CashMovementService`.
