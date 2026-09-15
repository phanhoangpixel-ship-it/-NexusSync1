# NEXUSSYNC ERP — GEMINI AI INSTRUCTIONS & ARCHITECTURE RULES

**Mandatory Governance & Architecture Rules Document:**  
`/docs/AI/GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`

---

## CORE DIRECTIVE: ARCHITECTURE FIRST, NO CODE FIRST

All feature development, module extensions, database changes, and API additions in NexusSync ERP MUST follow the mandatory 20-rule Architecture Development Gate defined in `/docs/AI/GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`.

### Core Mandates:
1. **NexusSync ERP is one integrated enterprise system, not a collection of independent modules.**
2. **Reuse Before Create**: Check existing master data (Products, Customers, Suppliers, Warehouses, Accounts), tables, domain services, APIs, events, and permissions before creating new ones.
3. **No Duplicate Authority**:
   - Inventory Authority: `InventoryService` (`postTransaction()`) is the single writer.
   - Accounting Authority: `AccountingService` / GL is the single writer.
   - Costing Authority: `CostingService` is the single writer.
4. **No Orphan Data or Fake APIs**: Every entity must connect to the enterprise data graph; UI must connect to real domain services and database.
5. **Frozen Modules & Baseline Protection**: Modules marked `FROZEN & IMMUTABLE` cannot be refactored or modified without explicit governance authorization.
6. **Pre-Implementation Impact Analysis**: Complete the mandatory Feature Impact Analysis and Data Graph Check before writing code.
7. **Post-Implementation Verification & Graph Update**: Run full verification (types, build, regression, RBAC, audit) and update architecture docs upon completion.
8. **UI/UX Enterprise Design Standards (Rule #19)**: Strictly follow `/docs/design-specs/UI_UX_ENTERPRISE_DESIGN_STANDARDS_M18_M19.md` for WCAG AA contrast, table hover, inline editing, and `ConfirmDialog.tsx`.
9. **Full UI/UX Module Replication Protocol (Rule #20)**: Execute `/docs/design-specs/UI_UX_MODULE_FULL_REPLICATION_PROTOCOL.md` (Phase 0 Inventory -> Phase 1 Extraction 1.1-1.7 -> Phase 2 Full Spec -> Phase 3 Target Porting -> Verifiable Evidence) whenever replicating design between modules.
