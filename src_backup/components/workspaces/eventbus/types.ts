export type M05SubTab = 'stream' | 'outbox' | 'dlq' | 'subscribers';

export type EventStatus = 'PUBLISHED' | 'ACKNOWLEDGED' | 'DLQ_FAILED' | 'PENDING';

export interface EventBusItem {
  id: string;
  topic: string;
  eventType?: string;
  aggregateType?: string;
  aggregateId?: string;
  sourceModule: string;
  actorId?: string;
  payload: any;
  status: EventStatus;
  timestamp: string;
  retryCount: number;
  consumer: string;
  correlationId?: string;
  causationId?: string;
  lastError?: string;
}

export type SubscriberStatus = 'HEALTHY' | 'DEGRADED' | 'FAILED';

export interface EventSubscriber {
  id: string;
  name: string;
  topic: string;
  status: SubscriberStatus;
  lag: number;
  lastHeartbeat?: string;
  consumerGroup?: string;
}

export interface EventFilterCriteria {
  searchTerm: string;
  statusFilter: string;
  sourceFilter: string;
  domainFilter: string;
  timeRange: 'all' | '15m' | '1h' | 'today' | '7d' | '30d' | 'custom';
  startDate?: string;
  endDate?: string;
}
