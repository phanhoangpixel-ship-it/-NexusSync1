const http = require('http');

const req = http.request('http://localhost:3000/api/sourcing/rfqs/RFQ-2026-7206', {
  method: 'DELETE'
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("DELETE Response: ", res.statusCode, data);
  });
});
req.end();
