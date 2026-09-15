# NEXUSSYNC ERP — AGENT GOVERNANCE & ARCHITECTURE DEVELOPMENT RULES

**Mandatory Governance & Architecture Rules Document:**  
`/docs/AI/GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`

All agents and subagents operating on NexusSync ERP must strictly adhere to the 20 Architecture Rules defined in `/docs/AI/GEMINI_ERP_ARCHITECTURE_DEVELOPMENT_RULES.md`.

- **Master Principle**: NexusSync ERP is one integrated enterprise system.
- **Rule 01 - Architecture First**: Map architecture, data flow, and domain authorities before implementing code.
- **Rule 02 - Reuse Before Create**: Maximize reuse of existing entities, services, tables, and endpoints.
- **Rule 03-07 - Authority & Single Writer**: Respect existing single-writer domain authorities (Inventory, Accounting, Costing).
- **Rule 16 - Frozen Scope Protection**: Respect frozen/immutable module baselines.
- **Rule 19 - Confirm Dialog & UI/UX Standards**: Strictly adhere to `/docs/design-specs/UI_UX_ENTERPRISE_DESIGN_STANDARDS_M18_M19.md` for contrast (WCAG AA), table hover, inline editing, and `ConfirmDialog.tsx`.
- **Rule 20 - Full UI/UX Module Replication Protocol**: Follow `/docs/design-specs/UI_UX_MODULE_FULL_REPLICATION_PROTOCOL.md` (Phase 0 to Phase 3) whenever replicating or porting UI design between modules with 100% detail fidelity.
