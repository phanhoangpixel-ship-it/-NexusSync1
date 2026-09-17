# SMART GUIDANCE HUB — FEATURE BASELINE BEFORE SYNC (PHASE -1)

## 1. Overview & Tabs Inventory
The Smart Guidance Hub (`GuidanceModal.tsx`) provides enterprise-wide guidance, intent recognition, Next Best Actions (NBA), workflow visualizers, and module knowledge bases.
- **Tab 1: ACTION** (`📌 1. Hành Động Tiếp Theo`): IntentBar (natural language search & disambiguation), NextActionCard (NBA with progressive disclosure), MyWorkWidget (My Work queue with SLA and quick-complete).
- **Tab 2: WORKFLOW** (`🗺️ 2. Bản Đồ Hành Trình & Tiến Trình`): BusinessGpsTracker (journey tracker and stepper pipeline), WorkflowVisualizer (SVG vector timeline and state machine contract drilldown).
- **Tab 3: CONTRACT** (`📖 3. Tài Liệu & Hướng Dẫn Phân Hệ`): Module-specific knowledge base and architectural guard documentation.

## 2. API Endpoints & Data Contracts
- `BusinessGuidanceService.parseIntent(query, context)`: Client-side rule and intent parser.
- `BusinessGuidanceService.getMyWorkItems(user, branch)`: Retrieves authoritative pending work items.
- `BusinessGuidanceService.getNextBestAction(entityType, state, role)`: Deterministic state machine NBA evaluator.

## 3. User Actions & Business Outcomes
- Natural language search -> Intent routing & disambiguation.
- Progressive disclosure (Beginner, Intermediate, Expert) for NBA.
- Quick Complete / Process action -> triggers `ConfirmDialog` (Rule #19) and navigates to target module.
- Journey tracking across P2P, O2C, Inventory, Returns, Manufacturing.

## 4. RBAC & Validation Rules
- Role-based guidance filtering (`currentUser.role`).
- State machine invariants and business guard checks (`BUSINESS_PROCESS_STATE_MACHINES`).
- Strict adherence to Rule #19 (`ConfirmDialog.tsx` instead of `window.alert`).
