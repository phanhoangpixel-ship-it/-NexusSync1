const http = require('http');
// In dev, auth is bypassed and defaults to super admin
const payload = JSON.stringify({
  title: 'TEST RFQ POST',
  idempotencyKey: 'test-idemp-key-1'
});

const req = http.request('http://localhost:3000/api/sourcing/rfqs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("POST Response: ", res.statusCode, data);
    
    // Test idempotency
    const req2 = http.request('http://localhost:3000/api/sourcing/rfqs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
      }
    }, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        console.log("Idempotent POST Response: ", res2.statusCode, data2);
        
        // Test GET
        const req3 = http.request('http://localhost:3000/api/sourcing/rfqs', {
          method: 'GET'
        }, (res3) => {
          let data3 = '';
          res3.on('data', chunk => data3 += chunk);
          res3.on('end', () => {
            console.log("GET Response: ", res3.statusCode, data3);
          });
        });
        req3.end();
      });
    });
    req2.write(payload);
    req2.end();
  });
});
req.write(payload);
req.end();
