const fs = require('fs');
let code = fs.readFileSync('src/routes/sourcing.routes.ts', 'utf8');

code = code.replace(
  "eventId: `EVT-${Date.now()}`, source: 'Sourcing', eventType: 'RFQ_CREATED',",
  "eventId: idempotencyKey, source: 'Sourcing', eventType: 'RFQ_CREATED',"
);

// fix cancel idempotencyKey too
code = code.replace(
  /idempotencyKey: `cancel-\${id}-\${Date\.now()}`,/g,
  ''
);

fs.writeFileSync('src/routes/sourcing.routes.ts', code);
console.log("Fixed.");
