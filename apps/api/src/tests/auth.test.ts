import http from 'http';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { seedData } from '../seed/seed';
import { UserRole } from '@nirikshan/shared-types';

async function runAuthTests() {
  console.log('🧪 Starting NIRIKSHAN Authentication & RBAC Integration Tests...');
  await connectDatabase();
  await seedData();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099/api/v1';

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      testPassed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      testFailed++;
    }
  }

  try {
    // TEST 1: Login with valid credentials
    console.log('\n[TEST 1] Login with valid credentials');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@nirikshan.gov.in',
        password: 'Password@123',
      }),
    });
    const loginData: any = await loginRes.json();
    assert(loginRes.status === 200, 'Login status is 200');
    assert(!!loginData.data.tokens.accessToken, 'Access token is present');
    assert(!!loginData.data.tokens.refreshToken, 'Refresh token is present');
    assert(loginData.data.user.role === UserRole.SUPER_ADMIN, 'User role is SUPER_ADMIN');

    const adminAccessToken = loginData.data.tokens.accessToken;
    const adminRefreshToken = loginData.data.tokens.refreshToken;

    // TEST 2: Login with invalid password
    console.log('\n[TEST 2] Login with invalid password');
    const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@nirikshan.gov.in',
        password: 'WrongPassword!',
      }),
    });
    const badLoginData: any = await badLoginRes.json();
    assert(badLoginRes.status === 401, 'Bad login returns HTTP 401');
    assert(badLoginData.error.code === 'AUTHENTICATION_ERROR', 'Error code is AUTHENTICATION_ERROR');

    // TEST 3: Access /auth/me with Bearer token
    console.log('\n[TEST 3] Access /auth/me with Bearer token');
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    const meData: any = await meRes.json();
    assert(meRes.status === 200, 'Profile query returns HTTP 200');
    assert(meData.data.user.email === 'superadmin@nirikshan.gov.in', 'Profile matches logged-in user');

    // TEST 4: Access /auth/me without token
    console.log('\n[TEST 4] Access /auth/me without token');
    const noTokenRes = await fetch(`${baseUrl}/auth/me`);
    const noTokenData: any = await noTokenRes.json();
    assert(noTokenRes.status === 401, 'Unauthenticated request returns HTTP 401');
    assert(noTokenData.error.code === 'AUTHENTICATION_ERROR', 'Rejects with AUTHENTICATION_ERROR');

    // TEST 5: Refresh token rotation
    console.log('\n[TEST 5] Token refresh rotation');
    const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: adminRefreshToken }),
    });
    const refreshData: any = await refreshRes.json();
    assert(refreshRes.status === 200, 'Refresh returns HTTP 200');
    assert(!!refreshData.data.tokens.accessToken, 'New access token issued');
    assert(refreshData.data.tokens.refreshToken !== adminRefreshToken, 'Refresh token was rotated');

    const rotatedRefreshToken = refreshData.data.tokens.refreshToken;

    // TEST 6: RBAC Authorization - Inspector cannot create users
    console.log('\n[TEST 6] RBAC Authorization Enforcement');
    const inspectorLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'inspector1@nirikshan.gov.in',
        password: 'Password@123',
      }),
    });
    const inspectorData: any = await inspectorLogin.json();
    const inspectorToken = inspectorData.data.tokens.accessToken;

    const forbiddenCreateRes = await fetch(`${baseUrl}/auth/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${inspectorToken}`,
      },
      body: JSON.stringify({
        email: 'new.staff@nirikshan.gov.in',
        password: 'Password@123',
        name: 'Staff Member',
        role: UserRole.PROJECT_STAFF,
      }),
    });
    const forbiddenData: any = await forbiddenCreateRes.json();
    assert(forbiddenCreateRes.status === 403, 'Inspector blocked with HTTP 403 from admin endpoint');
    assert(forbiddenData.error.code === 'AUTHORIZATION_ERROR', 'Error code is AUTHORIZATION_ERROR');

    // TEST 7: Super Admin can create user
    console.log('\n[TEST 7] Super Admin authorized user creation');
    const newStaffEmail = `staff.${Date.now()}@nirikshan.gov.in`;
    const authorizedCreateRes = await fetch(`${baseUrl}/auth/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        email: newStaffEmail,
        password: 'Password@123',
        name: 'Ramesh Patel',
        role: UserRole.PROJECT_STAFF,
        state: 'Maharashtra',
        district: 'Pune',
      }),
    });
    const authorizedData: any = await authorizedCreateRes.json();
    assert(authorizedCreateRes.status === 201, 'Super Admin successfully creates user (HTTP 201)');
    assert(authorizedData.data.user.email === newStaffEmail, 'Created user matches input');

    // TEST 8: Logout and revocation
    console.log('\n[TEST 8] User logout');
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({ refreshToken: rotatedRefreshToken }),
    });
    assert(logoutRes.status === 200, 'Logout returns HTTP 200');

    // TEST 9: Replay Attack Detection - Reusing revoked refresh token should fail
    console.log('\n[TEST 9] Replay Attack Detection on Revoked Refresh Token');
    const replayRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rotatedRefreshToken }),
    });
    const replayData: any = await replayRes.json();
    assert(replayRes.status === 401, 'Replay attack blocked with HTTP 401');
    assert(replayData.error.code === 'AUTHENTICATION_ERROR', 'Replay rejects with AUTHENTICATION_ERROR');

    console.log('\n=======================================================');
    console.log(`📊 Test Summary: ${testPassed} Passed, ${testFailed} Failed`);
    console.log('=======================================================');

    if (testFailed > 0) {
      throw new Error(`${testFailed} tests failed.`);
    }
  } finally {
    server.close();
    await disconnectDatabase();
  }
}

if (require.main === module) {
  runAuthTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Test run failed:', err);
      process.exit(1);
    });
}
