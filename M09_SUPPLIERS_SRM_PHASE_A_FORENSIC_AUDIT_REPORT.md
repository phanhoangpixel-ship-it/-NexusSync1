# NEXUSSYNC ERP — M09 SUPPLIERS / SRM
# PHASE A — FORENSIC AUDIT REPORT

## A. Executive Summary
- **Audit status**: COMPLETED (Read-Only)
- **Production readiness**: NOT READY (Backend APIs missing)
- **Critical count**: 0
- **High count**: 3
- **Medium count**: 2
- **Low count**: 1
- **Info count**: 2

## B. Architecture Map
```text
M09 Supplier Master (Schema: suppliers)
        │
        ├── M08 Purchase Orders (References suppliers.id)
        ├── M10 Strategic Sourcing (References suppliers.id in srm_rfq_suppliers, srm_bids)
        ├── M11 Supplier Management (Integrated via performance fields in suppliers schema)
        └── Finance/AP (No distinct AP table; PO payment_status serves as lightweight AP)
```

## C. Source-of-Truth Matrix

| Domain                | Owner            | Evidence | Status    |
| --------------------- | ---------------- | -------- | --------- |
| Supplier Master       | M09              | `suppliers` table is centralized and referenced globally. No duplicate tables exist. | PASS |
| Purchase Order        | M08              | `purchase_orders` table correctly references `suppliers.id`. | PASS |
| Strategic Sourcing    | M10              | `srm_rfq_suppliers`, `srm_bids` correctly reference `suppliers.id`. | PASS |
| Supplier Relationship | M11              | Supplier scorecard and performance fields (`performanceTier`, `compositeScore`) are integrated into `suppliers` schema. | PASS |
| AP/GL                 | Finance/M08      | No explicit AP invoice table exists; PO `paymentStatus` tracks AP equivalent. No duplicate AP supplier mapping. | PASS |
| Inventory             | Inventory Engine | No inventory writes found originating from M09. | PASS |
| Cash                  | Cash Engine      | No cash writes found originating from M09. | PASS |

## D. Finding Matrix

| ID | Severity | File | Evidence | Root Cause | Risk | Recommendation |
| -- | -------- | ---- | -------- | ---------- | ---- | -------------- |
| M09-FA-001 | HIGH | `masterData.routes.ts` | Missing Supplier CRUD APIs. Only a GET endpoint with seed logic exists. | Module implementation is incomplete on the backend. | UI cannot persist new suppliers or lifecycle changes. | Implement fully compliant CRUD APIs with transaction atomicity for M09. |
| M09-FA-002 | HIGH | `masterData.routes.ts` | Missing outbox events for Supplier events (`SUPPLIER_CREATED`, `SUPPLIER_UPDATED`). | Missing CRUD operations means no EDA boundaries are enforced. | Downstream modules won't be notified of supplier state changes. | Implement EventBus integration in the new Supplier APIs. |
| M09-FA-003 | HIGH | `masterData.routes.ts` | No RBAC validation on backend for Supplier management. | APIs are missing. | Unauthorized users could theoretically manipulate suppliers if APIs were exposed. | Implement strict RBAC guards (`supplier.manage`, `supplier.read`) in new backend routes. |
| M09-FA-004 | MEDIUM | `schema.ts` | `suppliers` table lacks `idempotency_key` or robust deduplication tracking beyond unique `code`. | Standard schema footprint missing idempotency constraint. | Bulk imports or retries could cause conflicts. | Add idempotency constraints or rely on `code` uniqueness handling during implementation. |
| M09-FA-005 | MEDIUM | `M09SuppliersSRMWorkspace.tsx` | UI uses placeholder values for complex scorecard / performance metrics. | M11 SRM capabilities are mocked in UI without backend aggregates. | Misleading UI state. | Connect UI metrics to real database aggregates / M11 engine once built. |
| M09-FA-006 | LOW | `M09SuppliersSRMWorkspace.tsx` | "Đã đồng bộ dữ liệu M09" notification is mocked via `setTimeout`. | UI is not fully integrated with a robust backend service. | Poor UX during actual data delays. | Refactor UI to use `useQuery` or real backend promises. |
| M09-FA-007 | INFO | `schema.ts` | `supplierContacts` and `supplierBankAccounts` tables exist and correctly map back to `suppliers`. | Good architectural design. | N/A | Ensure future CRUD APIs wrap contact and bank updates in single DB transactions. |
| M09-FA-008 | INFO | System | M08, M10, Finance are structurally sound regarding M09. No architectural regressions detected. | N/A | N/A | Proceed with backend implementation without altering downstream schemas. |

## E. Database Findings
- **Single Source of Truth**: The `suppliers` table is properly designed as the central Source of Truth.
- **Integrity**: Related tables (`supplier_contacts`, `supplier_bank_accounts`) use foreign keys linking to `suppliers.id`.
- **Boundaries**: M08 (`purchase_orders`), M10 (`srm_rfqs`, `srm_bids`) correctly reference `suppliers.id`. No duplicate "Vendor" or "Sourcing Supplier" tables exist.
- **Constraints**: Supplier `code` is strictly `UNIQUE`.

## F. API Findings
- **Missing APIs**: There are no POST, PUT, PATCH, or DELETE endpoints for M09. The only route is `GET /api/suppliers`, which injects seed data if the table is empty.
- **Idempotency**: Cannot be evaluated as mutation endpoints do not exist.

## G. Lifecycle Findings
- The schema defines `status` (`ACTIVE`, `INACTIVE`, `BLOCKED`, `ARCHIVED`), but there is no backend state machine or validation to enforce correct transitions.

## H. RBAC Findings
- The UI contains basic RBAC checks (`M09_READ_ONLY`, `M11_SCORECARD_MANAGE`), but backend validation is entirely missing due to the lack of endpoints.

## I. Idempotency Findings
- No idempotency keys are tracked during supplier creation because creation only happens via hardcoded DB seeding on the `GET` route.

## J. Transaction Findings
- Missing transaction boundaries. When a supplier is created (e.g., via future UI), contacts and bank accounts must be saved atomically. Currently, this logic does not exist.

## K. Audit/EventBus Findings
- No integration with `outbox_events` for M09. Downstream systems cannot react to `SUPPLIER_CREATED` or `SUPPLIER_SUSPENDED`.

## L. UI Findings
- The `M09SuppliersSRMWorkspace.tsx` component is well-structured visually but heavily relies on mocked states or read-only fetches. Action buttons (Save, Update) do not trigger actual backend mutations.

## M. Performance Findings
- The current `GET /api/suppliers` fetches `.all()` without pagination, filtering, or search parameters. This will lead to N+1 or memory issues in production with a large supplier base.

## N. Cross-Module Regression
- Verified: M08 Purchase Orders is untouched.
- Verified: M10 Strategic Sourcing is untouched.
- Verified: Finance/AP boundaries are respected.
- Verified: Inventory/Cash engines are isolated.

## O. Frozen Dependency Integrity
- M08 unchanged.
- M13 unchanged.
- M15 unchanged.
- M16 unchanged.
- CashMovementService unchanged.
- InventoryService unchanged.

## P. Typecheck / Build
- Typecheck (`npx tsc --noEmit`) passes for M09 components. No new errors introduced (Audit is read-only).
- Production build is stable.

## Q. Remediation Priority
1. **P0**: Implement robust `POST /api/suppliers` and `PUT /api/suppliers/:id` with strict RBAC, validation, and Transaction Atomicity (including Contacts/Banks).
2. **P1**: Integrate EventBus (`outbox_events`) to broadcast supplier lifecycle changes.
3. **P2**: Implement pagination, filtering, and search on `GET /api/suppliers`.
4. **P3**: Remove UI mocks and wire frontend forms to the new backend APIs.

## R. Governance Recommendation

`PHASE_A_PASS_WITH_FINDINGS — REMEDIATION_AUTHORIZATION_REQUIRED`

**Reasoning:** The schema architectural boundaries are perfectly intact and correctly designed (One Source of Truth). However, the module is functionally incomplete on the backend. It requires authorization to proceed to Phase B to build the necessary CRUD APIs, state machines, and EventBus integrations without modifying frozen upstream modules.
