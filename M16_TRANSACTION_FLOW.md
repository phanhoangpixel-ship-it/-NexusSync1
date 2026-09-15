# NEXUSSYNC ERP - M16 TRANSACTION FLOW

## 1. POS Sale Completion Flow
1. **Product Scan / Search**: Cashier scans barcode or searches catalog.
2. **Cart Assembly**: Items added with quantity, UOM, pricing, and optional lot/serial attributes.
3. **Customer Binding**: Bind walk-in or registered customer from M03.
4. **Payment Processing**: Select payment methods (e.g. Split Cash + QR).
5. **Backend Orchestration**:
   - `SalesEngine` validates pricing and inventory availability.
   - `InventoryService.postTransaction()` posts stock deduction (-qty).
   - If cash payment is involved, `CashMovementService.postMovement()` records cash in drawer tied to `shiftId`.
   - Accounting journal entries and audit logs are recorded.
6. **Receipt Generation**: Transaction completed successfully.
