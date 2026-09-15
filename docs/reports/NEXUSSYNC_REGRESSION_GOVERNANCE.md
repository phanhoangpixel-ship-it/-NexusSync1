# NEXUSSYNC ERP — REGRESSION GOVERNANCE & GO-FORWARD RULES
**Baseline Version**: 1.0  
**Effective Date**: August 27, 2026

---

## 1. Purpose & Governance Principles
This document defines the permanent regression governance rules for NexusSync ERP. Any future modifications to the codebase, database schemas, APIs, or UI components must adhere strictly to these regression rules to preserve Business Functional Baseline 1.0 and prevent corruption of the Frozen Core.

---

## 2. Change Rules (R01 - R12)

- **RULE R01 (UI-only isolated change)**: Test affected UI feature and immediate sibling components.
- **RULE R02 (Shared UI component)**: Test all known module consumers across the 40 workspaces.
- **RULE R03 (API change)**: Test API endpoint + affected business features and dependent services.
- **RULE R04 (Inventory change)**: MANDATORY test of Inventory + Costing + Accounting + affected supply chain workflows.
- **RULE R05 (Costing change)**: MANDATORY test of Inventory + Costing + COGS + Accounting.
- **RULE R06 (Accounting change)**: MANDATORY test of Accounting + source business transaction.
- **RULE R07 (RBAC change)**: Test UI authorization + API authorization + affected roles.
- **RULE R08 (Database schema change)**: Test migration + data integrity + affected services + dependent modules.
- **RULE R09 (Scheduler change)**: Test scheduler execution + idempotency + affected business service.
- **RULE R10 (Cross-module change)**: Test every impacted business chain across module boundaries.
- **RULE R11 (Frozen Core change)**: MANDATORY architectural review + backup + rollback plan + full 160-feature regression + core invariant verification.
- **RULE R12 (Unknown impact)**: If Code Graph cannot establish a reliable impact boundary: **FULL 160-FEATURE REGRESSION REQUIRED**.

---

## 3. Regression Scope Mapping Table

| Change Area | Affected Module(s) | Required Test Scope | Core Dependencies | Escalation Condition |
| :--- | :--- | :--- | :--- | :--- |
| **Mxx UI Component** | Mxx | Affected Module Features | Local UI State | If component is shared across shells |
| **Mxx API Route** | Mxx | API + Module Features | Business Service | If API mutation affects inventory/GL |
| **InventoryService** | M06, M07, M08, M09, M10, M11 | Inventory + Costing + Accounting | Ledger / Balances | Automatic P0 escalation |
| **Costing Engine** | M13, M14, M15, M21, M27 | Inventory + Costing + COGS + GL | Valuation Engine | Automatic P0 escalation |
| **Accounting Engine** | M23, M24 | Accounting + Source Transactions | Double-entry Ledger | Automatic P0 escalation |
| **Shared Shell (L0-L2)** | All 40 Modules | Full Regression Scan | Global Navigation | Any modification to `DomainWorkspaceShell.tsx` |
| **Auth / RBAC** | All Protected Modules | RBAC Authorization Suite | `AuthorityManager` | Any change to permission rules |

---

## 4. Change → Regression Algorithm
```text
CHANGE REQUEST
      ↓
READ CHANGE REGISTRY
      ↓
READ CODE GRAPH
      ↓
READ FIX MEMORY
      ↓
IDENTIFY CHANGED FILES
      ↓
MAP DEPENDENCIES
      ↓
IDENTIFY FEATURES & TEST CASES (TC-Mxx-Fyy)
      ↓
CHECK FROZEN CORE INVARIANTS
      ↓
SELECT REGRESSION SCOPE
      ↓
EXECUTE TESTS
      ↓
PASS / FAIL
      ↓
UPDATE FIX MEMORY & CHANGE REGISTRY
      ↓
RELEASE BASELINE INCREMENT
```

---

## 5. Frozen Core & UI Baseline Protection
- **Frozen Core Invariants**: `InventoryService`, Costing Engine, Accounting Engine, and core business contracts are immutable unless subjected to Rule R11.
- **UI Baseline 1.0**: The layout and styling established in UI Baseline 1.0 are locked. Any unapproved visual modification constitutes a regression breach.

---
*End of Regression Governance Document.*
