import http from 'http';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { seedData } from '../seed/seed';
import { UserRole, ProjectStatus, RiskLevel } from '@nirikshan/shared-types';

async function runProjectTests() {
  console.log('🧪 Starting NIRIKSHAN Projects & Geospatial Integration Tests...');
  await connectDatabase();
  await seedData();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(5098, resolve));
  const baseUrl = 'http://localhost:5098/api/v1';

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
    // 1. Authenticate Super Admin & Inspector
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@nirikshan.gov.in', password: 'Password@123' }),
    });
    const adminData: any = await adminLoginRes.json();
    const adminToken = adminData.data.tokens.accessToken;

    const inspectorLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'inspector1@nirikshan.gov.in', password: 'Password@123' }),
    });
    const inspectorData: any = await inspectorLoginRes.json();
    const inspectorToken = inspectorData.data.tokens.accessToken;

    // TEST 1: List Projects with pagination & filters
    console.log('\n[TEST 1] List Projects with filters & pagination');
    const listRes = await fetch(`${baseUrl}/projects?limit=5&state=Maharashtra`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData: any = await listRes.json();
    assert(listRes.status === 200, 'Project list status is 200');
    assert(Array.isArray(listData.data.projects), 'Projects array is returned');
    assert(listData.data.projects.length <= 5, 'Pagination limit respected');
    assert(listData.meta.total >= 5, 'Total count returned in metadata');

    const sampleProjectId = listData.data.projects[0].id;
    const sampleOrgId = listData.data.projects[0].organizationId.id || listData.data.projects[0].organizationId;

    // TEST 2: Project Stats Overview
    console.log('\n[TEST 2] Project Stats Overview');
    const statsRes = await fetch(`${baseUrl}/projects/stats/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsData: any = await statsRes.json();
    assert(statsRes.status === 200, 'Stats endpoint returns HTTP 200');
    assert(statsData.data.stats.total >= 20, 'Stats show total >= 20 projects');
    assert(statsData.data.stats.statesCount >= 4, 'Stats show state distribution');

    // TEST 3: Geospatial Proximity Search ($nearSphere on Pune: [73.8567, 18.5204])
    console.log('\n[TEST 3] Geospatial Proximity Search ($nearSphere)');
    const nearbyRes = await fetch(
      `${baseUrl}/projects/nearby?longitude=73.8567&latitude=18.5204&maxDistanceMeters=35000`,
      {
        headers: { Authorization: `Bearer ${inspectorToken}` },
      },
    );
    const nearbyData: any = await nearbyRes.json();
    assert(nearbyRes.status === 200, 'Nearby search returns HTTP 200');
    assert(nearbyData.data.projects.length > 0, 'Found nearby Pune projects');
    assert(
      nearbyData.data.projects.every((p: any) => p.state === 'Maharashtra'),
      'All nearby projects within 35km radius are in Maharashtra',
    );

    // TEST 4: Super Admin creates new project with valid GeoJSON
    console.log('\n[TEST 4] Authorized Project Creation');
    const uniqueCode = `PRJ-TST-${Date.now().toString().slice(-4)}`;
    const createProjectRes = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Solapur Renewable Solar Pumping Station',
        code: uniqueCode,
        organizationId: sampleOrgId,
        scheme: 'PM-KUSUM Solar Irrigation',
        description: 'Solar microgrid testing project.',
        address: 'Solapur MIDC Area, Solapur 413006',
        district: 'Solapur',
        state: 'Maharashtra',
        location: {
          type: 'Point',
          coordinates: [75.9064, 17.6599], // Solapur coordinates
        },
        geofenceRadiusMeters: 200,
        status: ProjectStatus.ACTIVE,
        riskLevel: RiskLevel.MEDIUM,
        riskScore: 30,
        contactName: 'Er. Ganesh Kadam',
        contactEmail: 'ganesh.kadam@solapur.gov.in',
        contactPhone: '+91-9422113355',
      }),
    });
    const createProjectData: any = await createProjectRes.json();
    assert(createProjectRes.status === 201, 'Super Admin creates project (HTTP 201)');
    assert(createProjectData.data.project.code === uniqueCode, 'Created project code matches');

    // TEST 5: Inspector forbidden from creating projects
    console.log('\n[TEST 5] RBAC Enforcement on Project Creation');
    const forbiddenRes = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${inspectorToken}`,
      },
      body: JSON.stringify({
        name: 'Unauthorized Project Attempt',
        code: 'PRJ-UNAUTH',
        organizationId: sampleOrgId,
        scheme: 'Test Scheme',
        address: 'Random Address',
        district: 'Pune',
        state: 'Maharashtra',
        location: { type: 'Point', coordinates: [73.8567, 18.5204] },
        contactName: 'Test',
        contactEmail: 'test@gov.in',
        contactPhone: '+91-9999999999',
      }),
    });
    const forbiddenData: any = await forbiddenRes.json();
    assert(forbiddenRes.status === 403, 'Inspector blocked from creating project (HTTP 403)');
    assert(forbiddenData.error.code === 'AUTHORIZATION_ERROR', 'Rejects with AUTHORIZATION_ERROR');

    // TEST 6: Validation Error on Invalid Coordinates
    console.log('\n[TEST 6] Validation on Invalid GeoJSON Coordinates');
    const invalidGeoRes = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Invalid Coordinates Project',
        code: 'PRJ-INV-GEO',
        organizationId: sampleOrgId,
        scheme: 'Test Scheme',
        address: 'Random Address',
        district: 'Pune',
        state: 'Maharashtra',
        location: {
          type: 'Point',
          coordinates: [290, 18.5204], // Invalid longitude > 180
        },
        contactName: 'Test',
        contactEmail: 'test@gov.in',
        contactPhone: '+91-9999999999',
      }),
    });
    const invalidGeoData: any = await invalidGeoRes.json();
    assert(invalidGeoRes.status === 400, 'Invalid coordinates rejected with HTTP 400');
    assert(invalidGeoData.error.code === 'VALIDATION_ERROR', 'Rejects with VALIDATION_ERROR');

    // TEST 7: Organizations List & Single Query
    console.log('\n[TEST 7] Organizations API');
    const orgsRes = await fetch(`${baseUrl}/organizations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const orgsData: any = await orgsRes.json();
    assert(orgsRes.status === 200, 'Organizations list returns HTTP 200');
    assert(orgsData.data.organizations.length >= 10, 'Found 10+ organizations');

    // TEST 8: Update Project
    console.log('\n[TEST 8] Update Project Details');
    const updateRes = await fetch(`${baseUrl}/projects/${sampleProjectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        riskScore: 65,
        riskLevel: RiskLevel.HIGH,
      }),
    });
    const updateData: any = await updateRes.json();
    assert(updateRes.status === 200, 'Project update returns HTTP 200');
    assert(updateData.data.project.riskLevel === RiskLevel.HIGH, 'Updated risk level to HIGH');
    assert(updateData.data.project.riskScore === 65, 'Updated risk score to 65');

    console.log('\n=======================================================');
    console.log(`📊 Project Tests Summary: ${testPassed} Passed, ${testFailed} Failed`);
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
  runProjectTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Project tests failed:', err);
      process.exit(1);
    });
}
