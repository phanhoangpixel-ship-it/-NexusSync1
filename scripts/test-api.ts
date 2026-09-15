async function runTests() {
  console.log('Starting System Integration Tests...');
  let passed = 0; let failed = 0;
  const endpoints = [
    { path: '/api/auth/login', method: 'POST', body: { username: 'admin', role: 'SUPER_ADMIN' } },
    { path: '/api/rbac/roles', method: 'GET' }
  ];
  let token = '';
  for (const ep of endpoints) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;
      const reqInit = { method: ep.method, headers };
      if (ep.body) reqInit.body = JSON.stringify(ep.body);
      
      const res = await fetch('http://0.0.0.0:3000' + ep.path, reqInit);
      const data = await res.json();
      if (res.ok) {
        console.log('PASS: ' + ep.path);
        passed++;
        if (data.token) token = data.token;
      } else {
        console.error('FAIL: ' + ep.path, data);
        failed++;
      }
    } catch (e) {
      console.error('ERROR: ' + ep.path, e.message);
      failed++;
    }
  }
  console.log('Summary: ' + passed + ' Passed, ' + failed + ' Failed.');
}
runTests();