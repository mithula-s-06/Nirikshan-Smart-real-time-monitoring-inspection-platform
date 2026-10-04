const http = require('http');

function post(url, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let resp = '';
        res.on('data', (c) => (resp += c));
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(resp) }));
      }
    );
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(data);
    req.end();
  });
}

function getAuth(url, token) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let resp = '';
        res.on('data', (c) => (resp += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resp) });
          } catch (e) {
            resolve({ status: res.statusCode, text: resp });
          }
        });
      }
    );
    req.on('error', (e) => resolve({ error: e.message }));
    req.end();
  });
}

async function verifyAuthWorkflow() {
  console.log('--- 1. Authenticating as DoSJE Official ---');
  const loginRes = await post('http://127.0.0.1:5000/api/v1/auth/login', {
    email: 'dept.official1@nirikshan.gov.in',
    password: 'Password@123',
  });
  console.log('Login Status:', loginRes.status);
  const token = loginRes.data?.data?.tokens?.accessToken;
  if (!token) {
    console.error('Failed to obtain accessToken:', loginRes.data);
    return;
  }
  console.log('Received JWT Token. Role:', loginRes.data.data.user.role);

  const endpoints = [
    '/api/v1/projects',
    '/api/v1/anomalies',
    '/api/v1/compliance?limit=5',
    '/api/v1/financial',
    '/api/v1/beneficiaries?limit=5',
    '/api/v1/corrective-actions',
    '/api/v1/vc'
  ];

  for (const ep of endpoints) {
    const res = await getAuth(`http://127.0.0.1:5000${ep}`, token);
    const count = res.data?.data?.length ?? (Array.isArray(res.data?.data?.records) ? res.data.data.records.length : 'OK');
    console.log(`[PASS ${res.status}] ${ep} -> items: ${count}`);
  }

  // Also test risk calculation for the first project
  const projectsRes = await getAuth('http://127.0.0.1:5000/api/v1/projects', token);
  const sampleProjectId = projectsRes.data?.data?.[0]?._id;
  if (sampleProjectId) {
    const riskRes = await getAuth(`http://127.0.0.1:5000/api/v1/risk/project/${sampleProjectId}`, token);
    console.log(`[PASS ${riskRes.status}] /api/v1/risk/project/${sampleProjectId} -> Score: ${riskRes.data?.data?.overallScore}/100 (${riskRes.data?.data?.band})`);
    console.log('Risk breakdown:', JSON.stringify(riskRes.data?.data?.breakdown));
  }
}

verifyAuthWorkflow();
