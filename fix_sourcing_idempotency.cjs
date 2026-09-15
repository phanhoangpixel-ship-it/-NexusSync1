const fs = require('fs');
let code = fs.readFileSync('src/routes/sourcing.routes.ts', 'utf8');

// Fix idempotency check
code = code.replace(
  'outboxEvents.idempotencyKey, idempotencyKey',
  'outboxEvents.eventId, idempotencyKey'
);

// Fix outbox insert
code = code.replace(
  /eventId: `EVT-\${Date\.now()}`, source: 'Sourcing', eventType: 'RFQ_CREATED',/g,
  "eventId: idempotencyKey, source: 'Sourcing', eventType: 'RFQ_CREATED',"
);
// Remove the leftover idempotencyKey from insert since it's now eventId
code = code.replace(/idempotencyKey: idempotencyKey,\n/g, '');

// Also for cancel
code = code.replace(
  /eventId: `EVT-\${Date\.now()}`, source: 'Sourcing', eventType: 'RFQ_CANCELLED',/g,
  "eventId: `cancel-${id}-${Date.now()}`, source: 'Sourcing', eventType: 'RFQ_CANCELLED',"
);
code = code.replace(/idempotencyKey: `cancel-\${id}-\${Date\.now()}`,\n/g, '');

fs.writeFileSync('src/routes/sourcing.routes.ts', code);
console.log("Fixed idempotency in sourcing.routes.ts");
