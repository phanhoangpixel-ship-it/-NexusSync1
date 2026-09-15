# NEXUSSYNC ERP — M09 SUPPLIERS / SRM
# PHASE B — WAVE 1 CHANGE REPORT
# BACKEND FOUNDATION REMEDIATION

## 1. Files Changed
- `src/routes/masterData.routes.ts`

## 2. API Endpoints Added & Modified
- **`POST /api/suppliers`**: Implemented Supplier creation with transaction atomicity. Validates required payload, checks for uniqueness (`code`), applies default statuses, creates nested objects (Contacts, Bank Accounts) inside a single DB transaction.
- **`PUT /api/suppliers/:id`**: Implemented Supplier update. Supports partial payload updates and completely overwrites (deletes & recreates) child objects (Contacts, Bank Accounts) within a single atomic transaction. Enforces lifecycle state rules (preventing mutation of ARCHIVED suppliers).
- **`DELETE /api/suppliers/:id`**: Implemented soft-delete via state transition to `ARCHIVED`. Rejects mutations if the supplier is already archived.
- **`GET /api/suppliers`**: Refactored to separate mock/seeding logic. Moved the initial mock generation payload to a secondary `POST /api/suppliers/seed` route so normal `GET` requests strictly return authoritative database states without unexpected mutation.
- **`POST /api/suppliers/seed`**: Separated development-oriented seed mechanism.

## 3. RBAC Guards Added
- Every mutation endpoint requires specific M09 backend roles via `requireRole('SUPER_ADMIN', 'MANAGER', 'PROCUREMENT_MANAGER', 'PURCHASING')`.
- All requests extract their actor identity firmly from the authenticated `req.user.id` context and return `401 Unauthorized` instead of defaulting to a hardcoded identity.

## 4. Lifecycle Rules Enforced
- Allowed initial states: `ACTIVE`, `INACTIVE`, `BLOCKED`, `ARCHIVED`.
- Invalid statuses result in HTTP 400.
- Transitioning or mutating an already `ARCHIVED` supplier results in HTTP 409 `INVALID_SUPPLIER_STATUS_TRANSITION`.

## 5. Transaction Boundaries
- Parent-child updates executed entirely using `db.transaction(async (tx) => { ... })`.
- If either the supplier record, contacts, or bank accounts throw a validation/database error, the entire atomic transaction is rolled back safely, leaving no corrupted partial suppliers.

## 6. Idempotency Implementation
- **Mechanism Used**: Enforced via payload fingerprinting & standard schema unique index checking. We reused the `outbox_events` schema strictly as a unique lock for idempotency matching, inserting records with an isolated `IdempotencyRecord_SupplierCreated` type & `PUBLISHED` status to ensure they **do not trigger** the EventBus engine (Wave 1 Restriction compliance).
- **Same key + same payload**: Safe replay returns the previously stored authoritative Supplier object.
- **Same key + different payload**: Returns HTTP 409 `IDEMPOTENCY_CONFLICT`.
- **Concurrent requests**: Defended against using standard SQLite UNIQUE constraints during the outbox event save, guaranteeing only one logical supplier is created.

## 7. Deferred Findings
- M09-FA-002: EventBus `SUPPLIER_CREATED` / `SUPPLIER_UPDATED` deferred to separate eventing wave.
- M09-FA-005 & M09-FA-006: UI Mock data & hardcoded components on `M09SuppliersSRMWorkspace.tsx` have been deferred.
- Search/Pagination: `GET /api/suppliers` retains simplistic response contract as requested.

## 8. Frozen Dependency Verification
- **M08 Purchase Orders**: Unchanged.
- **M10 Strategic Sourcing**: Unchanged.
- **M11 Supplier Management**: Unchanged.
- **M13/M15/M16**: Unchanged.
- **Inventory/Cash Services**: Unchanged.

## 9. Typecheck & Build Result
- **Typecheck Result**: `npx tsc --noEmit` executed successfully on M09 scope. (All unrelated pre-existing TypeScript errors from M08 / M32 persist identically to Phase A, ensuring strictly isolated scoping).
- **Build Result**: `npm run build` PASS.

Wave 1 foundational backend standards successfully enforced.
