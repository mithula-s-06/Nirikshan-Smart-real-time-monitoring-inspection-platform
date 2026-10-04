const http = require('http');

function check(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ url, status: res.statusCode, data: data.slice(0, 120) }));
    }).on('error', (err) => resolve({ url, error: err.message }));
  });
}

async function run() {
  const tests = [
    'http://127.0.0.1:8008/health',
    'http://127.0.0.1:5000/api/v1/health',
    'http://127.0.0.1:5000/api/v1/projects',
    'http://127.0.0.1:5000/api/v1/compliance?limit=2',
    'http://127.0.0.1:5000/api/v1/financial',
    'http://127.0.0.1:5000/api/v1/beneficiaries?limit=2',
    'http://127.0.0.1:5000/api/v1/corrective-actions',
    'http://127.0.0.1:5000/api/v1/vc',
    'http://127.0.0.1:5173/'
  ];

  console.log('=== NIRIKSHAN PLATFORM VERIFICATION PROBE ===');
  for (const t of tests) {
    const r = await check(t);
    if (r.status) {
      console.log(`[PASS ${r.status}] ${t}`);
      console.log(`       Preview: ${r.data.replace(/[\r\n\t]+/g, ' ')}`);
    } else {
      console.log(`[FAIL] ${t} -> ${r.error}`);
    }
  }
  console.log('============================================');
}

run();
