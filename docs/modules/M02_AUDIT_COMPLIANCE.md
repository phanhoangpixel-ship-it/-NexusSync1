# M02 — Audit Compliance & SHA-256 Chain

**Module ID:** `M02`  
**Module Name:** Security Audit Compliance & Forensic Traceability  
**Business Group:** `06. GOVERNANCE & SYSTEM`  
**Workspace ID:** `WS28_DMS` | **Primary Route:** `/audit`  
**Mounted UI Component:** `src/pages/AuditLog.tsx`  
**Primary API Endpoint:** `GET /api/audit/logs`

---

## 1. Executive Summary & Purpose
M02 provides an immutable, append-only forensic audit trail recording every state mutation, administrative action, and security event across all 42 ERP modules, secured with cryptographic SHA-256 hash chaining.

## 2. Domain Authority Boundaries
- **Exclusive Single-Writer:** Sole authority for inserting and verifying immutable audit logs.
- **Immutability Guarantee:** Records cannot be updated or deleted (`UPDATE` and `DELETE` queries are strictly prohibited on `audit_logs`).

## 3. Data Contracts & Schema
- **Database Tables:** `audit_logs` (id, entity_type, entity_id, action, user_id, timestamp, before_state, after_state, prev_hash, current_hash).
- **APIs:**
  - `GET /api/audit/logs` — Query audit logs with multi-filter (entity, user, date range).
  - `GET /api/audit/logs/:id` — Detail view with full JSON before/after state diff.
  - `POST /api/audit/verify-chain` — Validates SHA-256 hash chain integrity.

## 4. UI/UX Standards
- JSON state inspection drawer with visual color-coded diffing (Green = added, Red = removed).
- Timestamps formatted to microsecond accuracy with `font-mono`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement automated tamper-detection alerts linking directly to M16/M05 EventBus.
- [ ] Add CSV/PDF export for statutory compliance and external audit packs.
