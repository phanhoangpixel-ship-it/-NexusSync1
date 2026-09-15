# M05 — EventBus Platform & EDA Outbox

**Module ID:** `M05`  
**Module Name:** EventBus Platform & EDA Outbox Pattern  
**Business Group:** `06. GOVERNANCE & SYSTEM`  
**Workspace ID:** `WS26_SERVICEDESK` | **Primary Route:** `/event-bus`  
**Mounted UI Component:** `src/modules/governance/m05-eventbus/components/M05EventBusWorkspace.tsx`  
**Primary API Endpoint:** `GET /api/events/outbox`

---

## 1. Executive Summary & Purpose
M05 is the central Event-Driven Architecture (EDA) backbone of NexusSync ERP. It guarantees at-least-once delivery of domain events using the transactional Outbox pattern, tracks idempotency, and manages Dead Letter Queue (DLQ) quarantines.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Dispatches, monitors, and retries domain events. Does not alter operational records.

## 3. Data Contracts & Schema
- **Database Tables:** `outbox_events`, `processed_events`, `dlq_events`.
- **APIs:**
  - `GET /api/events/outbox` — Active event stream & outbox pending queue.
  - `GET /api/events/summary` — Event throughput and DLQ error counts.
  - `POST /api/events/dlq/:id/retry` — Replays failed event.

## 4. UI/UX Standards
- Real-time pulse indicator, event JSON payload drawer, retry action buttons with loading states.

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement WebSocket live event streaming for zero-latency monitoring.
- [ ] Add batch replay for DLQ items with root-cause categorization.
