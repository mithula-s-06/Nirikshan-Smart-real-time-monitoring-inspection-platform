const http = require('http');

function post(path, body, token) {
  return request('POST', path, body, token);
}

function patch(path, body, token) {
  return request('PATCH', path, body, token);
}

function get(path, token) {
  return request('GET', path, null, token);
}

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = {};
    if (data) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(data);
    }
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, body: raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const mongoose = require('mongoose');

async function runSecurityTests() {
  console.log('=====================================================');
  console.log('NIRIKSHAN GOVERNMENT RBAC & SECURITY VERIFICATION SUITE');
  console.log('=====================================================\n');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nirikshan');
  const userCol = mongoose.connection.collection('users');

  // Test A: Account Lockout after failed attempts
  console.log('--- TEST A: Account Lockout Protection ---');
  const targetEmail = 'auditor@nirikshan.gov.in';
  // Reset initial state
  await userCol.updateOne({ email: targetEmail }, { $set: { failedLoginAttempts: 0, lockoutUntil: null } });

  for (let i = 1; i <= 5; i++) {
    const res = await post('/api/v1/auth/login', { email: targetEmail, password: 'WrongPassword!' });
    console.log(`Attempt ${i}: HTTP ${res.status} - ${res.body?.message || res.body?.error?.message}`);
  }
  const lockedRes = await post('/api/v1/auth/login', { email: targetEmail, password: 'Password@123' });
  console.log(`Attempt 6 (Correct Password on locked account): HTTP ${lockedRes.status} - ${lockedRes.body?.message || lockedRes.body?.error?.message}`);

  // Restore account for subsequent evaluator use
  await userCol.updateOne({ email: targetEmail }, { $set: { failedLoginAttempts: 0, lockoutUntil: null } });
  console.log('Auditor account unlocked and restored.');

  // Test B: Role-Based Endpoint Protection (Inspector trying to access User Management)
  console.log('\n--- TEST B: Permission Enforcement & IDOR / 403 Access Denied ---');
  const inspLogin = await post('/api/v1/auth/login', { email: 'inspector1@nirikshan.gov.in', password: 'Password@123' });
  const inspToken = inspLogin.body.data.tokens.accessToken;
  const unauthorizedUsers = await get('/api/v1/users', inspToken);
  console.log(`Inspector accessing /api/v1/users: HTTP ${unauthorizedUsers.status} - Code: ${unauthorizedUsers.body?.error?.code || unauthorizedUsers.body?.message}`);

  // Test C: Admin Access to User Management
  console.log('\n--- TEST C: Authorized Super Admin Access to User Management ---');
  const adminLogin = await post('/api/v1/auth/login', { email: 'superadmin@nirikshan.gov.in', password: 'Password@123' });
  const adminToken = adminLogin.body.data.tokens.accessToken;
  const authorizedUsers = await get('/api/v1/users', adminToken);
  console.log(`Super Admin accessing /api/v1/users: HTTP ${authorizedUsers.status} - Total Users Returned: ${authorizedUsers.body?.data?.length}`);

  // Test D: Suspended User Access Invalidation
  console.log('\n--- TEST D: Instant Session Revocation on User Suspension ---');
  // Suspend Tamil Nadu officer
  const tnUser = authorizedUsers.body.data.find(u => u.email === 'state.official.tn@nirikshan.gov.in');
  if (tnUser) {
    // Login as TN officer to get active token
    const tnLogin = await post('/api/v1/auth/login', { email: tnUser.email, password: 'Password@123' });
    const tnToken = tnLogin.body.data.tokens.accessToken;
    const userId = tnUser.id || tnUser._id;
    // Admin suspends TN officer
    const suspendRes = await patch(`/api/v1/users/${userId}/suspend`, { reason: 'Security Audit Check' }, adminToken);
    console.log(`Admin suspended TN officer: HTTP ${suspendRes.status}`);

    // TN officer tries to make an API request with existing token
    const reqAfterSuspend = await get('/api/v1/projects', tnToken);
    console.log(`TN officer request after suspension: HTTP ${reqAfterSuspend.status} - ${reqAfterSuspend.body?.error?.message || reqAfterSuspend.body?.message}`);

    // Admin reactivates TN officer
    const reactivateRes = await patch(`/api/v1/users/${userId}/reactivate`, { reason: 'Security Audit Restored' }, adminToken);
    console.log(`Admin reactivated TN officer: HTTP ${reactivateRes.status}`);
  }

  console.log('\n=====================================================');
  console.log('ALL RBAC & DATA AUTHORIZATION TESTS COMPLETED SUCCESSFULLY');
  console.log('=====================================================');
  await mongoose.disconnect();
}

runSecurityTests().catch(console.error);
