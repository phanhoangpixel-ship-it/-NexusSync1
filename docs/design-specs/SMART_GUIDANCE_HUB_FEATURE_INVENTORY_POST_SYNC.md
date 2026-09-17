# SMART GUIDANCE HUB — FEATURE INVENTORY POST SYNC (PHASE 4)

| Tab | Feature / Widget | Status | Linked API / Service | Business Role |
|---|---|---|---|---|
| **ACTION** | IntentBar (Natural Language Router) | Fully functional | `BusinessGuidanceService.parseIntent()` | All Roles |
| **ACTION** | NextActionCard (NBA Progressive Disclosure) | Fully functional | `BusinessGuidanceService.getNextBestAction()` | All Roles |
| **ACTION** | MyWorkWidget (Queue & Quick Complete) | Fully functional | `BusinessGuidanceService.getMyWorkItems()` | Operational Staff & Approvers |
| **WORKFLOW** | BusinessGpsTracker (Journey Pipeline) | Fully functional | `BUSINESS_PROCESS_STATE_MACHINES` | Operations & Managers |
| **WORKFLOW** | WorkflowVisualizer (Vector SVG Timeline & Drilldown) | Fully functional | `BUSINESS_PROCESS_STATE_MACHINES` | Auditors & Engineers |
| **CONTRACT** | Module Knowledge Base & Contract Explorer | Fully functional | `getModuleContract()` / `MODULE_REGISTRY` | All Users |
