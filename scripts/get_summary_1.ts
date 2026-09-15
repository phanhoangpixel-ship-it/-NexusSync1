import fetch from 'node-fetch';

async function fetchSummary1() {
  const res = await fetch('http://localhost:3000/api/shift/1/summary', {
    headers: { 'Authorization': 'Bearer dev-token' }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

fetchSummary1().catch(console.error);
