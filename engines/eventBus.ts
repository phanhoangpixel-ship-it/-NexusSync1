import { EventEmitter } from 'events';
import { db } from '../db';
import { outboxEvents } from '../db/schema';

class EnterpriseEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  /**
   * Emit domain event in-memory and write to outbox_events table
   */
  public emitEvent(eventType: string, payload: any, metadata: any = {}) {
    this.emit(eventType, payload);

    // Asynchronously record into outbox_events for EDA traceability
    Promise.resolve().then(async () => {
      try {
        await db.insert(outboxEvents).values({
          eventId: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          eventType,
          eventVersion: 2,
          aggregateType: metadata.aggregateType || 'COSTING',
          aggregateId: metadata.aggregateId || String(payload.allocationRunId || payload.id || 'N/A'),
          source: metadata.source || 'M42_COSTING_ENGINE',
          actorId: String(metadata.actorId || '1'),
          correlationId: metadata.correlationId || null,
          causationId: metadata.causationId || null,
          payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
          metadata: JSON.stringify(metadata),
          status: 'PUBLISHED',
          retryCount: 0,
          publishedAt: new Date()
        });
      } catch (err) {
        console.warn(`[EventBus] Failed to persist outbox event ${eventType}:`, err);
      }
    });
  }
}

export const eventBus = new EnterpriseEventBus();
export default eventBus;
