import http from 'http';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { seedData } from '../seed/seed';
import { Project } from '../models/project.model';
import { CCTVCamera } from '../models/cctvCamera.model';
import { AuditLog } from '../models/auditLog.model';
import {
  CameraStatus,
  StreamProtocol,
  AuditAction,
} from '@nirikshan/shared-types';

async function runCCTVTests() {
  console.log('🧪 Starting NIRIKSHAN Phase 9: CCTV Stream Abstraction & Live Feed Tests...');
  await connectDatabase();
  await seedData();

  const app = createApp();
  const server = http.createServer(app);

  const TEST_PORT = 5098;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
  const baseUrl = `http://localhost:${TEST_PORT}/api/v1`;

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
    // 1. Authenticate Admin and Inspector
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

    assert(Boolean(adminToken && inspectorToken), 'Authenticated Admin and Inspector for CCTV tests');

    const testProject = await Project.findOne();
    assert(Boolean(testProject), 'Found active project for CCTV commissioning');
    const projectId = testProject!._id.toString();

    // =========================================================================
    // [TEST 1] Register New CCTV Camera
    // =========================================================================
    console.log('\n[TEST 1] Register New CCTV Camera');
    const uniqueCamCode = `CAM-TEST-${Date.now().toString().slice(-4)}`;
    const createCamRes = await fetch(`${baseUrl}/cctv/cameras`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Main Gate Construction Perimeter Camera 01',
        code: uniqueCamCode,
        projectId,
        locationDescription: 'North-East Perimeter Mast Pillar 4',
        latitude: 18.5204,
        longitude: 73.8567,
        protocol: StreamProtocol.HLS,
        rawStreamUrl: 'rtsp://admin:SecretPass123@192.168.1.100:554/live',
        resolution: '1080p',
        fps: 30,
        isDemo: true,
      }),
    });
    const createCamData: any = await createCamRes.json();
    assert(createCamRes.status === 201, 'Camera registered with HTTP 201');
    assert(createCamData.data.code === uniqueCamCode, 'Camera code assigned correctly');
    assert(createCamData.data.status === CameraStatus.ONLINE, 'Initial status set to ONLINE');
    assert(createCamData.data.rawStreamUrl === undefined, 'Raw camera credentials redacted in public JSON');
    assert(Boolean(createCamData.data.streamPath), 'Secure proxy streamPath generated');

    const createdCameraId = createCamData.data.id;

    // =========================================================================
    // [TEST 2] Duplicate Camera Code Rejection
    // =========================================================================
    console.log('\n[TEST 2] Uniqueness Validation: Duplicate Camera Code Rejection');
    const duplicateCamRes = await fetch(`${baseUrl}/cctv/cameras`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Duplicate Camera',
        code: uniqueCamCode,
        projectId,
        locationDescription: 'South Gate',
      }),
    });
    assert(duplicateCamRes.status === 409, 'Duplicate camera code rejected with HTTP 409 Conflict');

    // =========================================================================
    // [TEST 3] List Cameras with Project Filtering
    // =========================================================================
    console.log('\n[TEST 3] Query CCTV Camera Directory');
    const getCamsRes = await fetch(`${baseUrl}/cctv/cameras?projectId=${projectId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${inspectorToken}` },
    });
    const getCamsData: any = await getCamsRes.json();
    assert(getCamsRes.status === 200, 'Cameras listing endpoint returns HTTP 200');
    assert(Array.isArray(getCamsData.data) && getCamsData.data.length >= 1, 'Returns array of project cameras');
    assert(getCamsData.meta?.total >= 1, 'Pagination metadata accurately returned');

    // =========================================================================
    // [TEST 4] Get Single Camera Details
    // =========================================================================
    console.log('\n[TEST 4] Fetch Camera Details by ID');
    const singleCamRes = await fetch(`${baseUrl}/cctv/cameras/${createdCameraId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${inspectorToken}` },
    });
    const singleCamData: any = await singleCamRes.json();
    assert(singleCamRes.status === 200, 'Single camera details returns HTTP 200');
    assert(singleCamData.data.id === createdCameraId, 'Retrieved matching camera ID');
    assert(singleCamData.data.rawStreamUrl === undefined, 'Raw stream credentials strictly hidden');

    // =========================================================================
    // [TEST 5] Edge Camera Heartbeat Ingestion
    // =========================================================================
    console.log('\n[TEST 5] Edge Camera Heartbeat Telemetry');
    const heartbeatRes = await fetch(`${baseUrl}/cctv/cameras/${createdCameraId}/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${inspectorToken}`,
      },
      body: JSON.stringify({
        status: CameraStatus.ONLINE,
        fps: 29,
        resolution: '1080p',
        cpuUsagePct: 24.5,
        memoryUsagePct: 41.2,
      }),
    });
    const heartbeatData: any = await heartbeatRes.json();
    assert(heartbeatRes.status === 200, 'Heartbeat ingestion returns HTTP 200');
    assert(heartbeatData.data.status === CameraStatus.ONLINE, 'Heartbeat status confirmed ONLINE');
    assert(Boolean(heartbeatData.data.lastHeartbeatAt), 'lastHeartbeatAt updated');

    // =========================================================================
    // [TEST 6] Health Status Transition: ONLINE -> DEGRADED
    // =========================================================================
    console.log('\n[TEST 6] Camera Status Transition to DEGRADED');
    const degradedRes = await fetch(`${baseUrl}/cctv/cameras/${createdCameraId}/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${inspectorToken}`,
      },
      body: JSON.stringify({
        status: CameraStatus.DEGRADED,
        fps: 10,
        cpuUsagePct: 98.0,
      }),
    });
    const degradedData: any = await degradedRes.json();
    assert(degradedRes.status === 200, 'Degraded heartbeat returns HTTP 200');
    assert(degradedData.data.status === CameraStatus.DEGRADED, 'Status transitioned to DEGRADED');

    // =========================================================================
    // [TEST 7] Secure Tokenized Stream Access Generation & Audit Logging
    // =========================================================================
    console.log('\n[TEST 7] Generate Secure Tokenized Stream Access');
    const streamTokenRes = await fetch(`${baseUrl}/cctv/cameras/${createdCameraId}/stream-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${inspectorToken}`,
      },
      body: JSON.stringify({ ttlSeconds: 1800 }),
    });
    const streamTokenData: any = await streamTokenRes.json();
    assert(streamTokenRes.status === 200, 'Stream token generation returns HTTP 200');
    assert(Boolean(streamTokenData.data.token), 'Cryptographic HMAC playback token generated');
    assert(Boolean(streamTokenData.data.playbackUrl), 'Expiring playbackUrl provided for video player');
    assert(Boolean(streamTokenData.data.expiresAt), 'Stream token expiration timestamp attached');

    // Verify audit log recorded for CCTV access
    const cctvAudit = await AuditLog.findOne({
      action: AuditAction.CCTV_ACCESSED,
      resourceId: createdCameraId,
    });
    assert(Boolean(cctvAudit), 'AuditLog recorded for CCTV stream access event');

    // =========================================================================
    // [TEST 8] Live Feed Endpoint Delivery
    // =========================================================================
    console.log('\n[TEST 8] Live Feed Delivery Endpoint');
    const liveFeedRes = await fetch(`${baseUrl}/cctv/cameras/${createdCameraId}/live-feed`, {
      method: 'GET',
    });
    const manifestText = await liveFeedRes.text();
    assert(liveFeedRes.status === 200, 'Live feed returns HTTP 200');
    assert(
      liveFeedRes.headers.get('content-type')?.includes('application/vnd.apple.mpegurl') === true,
      'Content-Type header matches HLS mpegurl specification',
    );
    assert(manifestText.includes('#EXTM3U'), 'Delivers valid HLS M3U playlist format');

    // =========================================================================
    // [TEST 9] Update Camera Settings
    // =========================================================================
    console.log('\n[TEST 9] Update Camera Settings');
    const updateRes = await fetch(`${baseUrl}/cctv/cameras/${createdCameraId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Main Gate PTZ Camera 01 (Upgraded)',
        resolution: '4K',
        fps: 60,
      }),
    });
    const updateData: any = await updateRes.json();
    assert(updateRes.status === 200, 'Camera updated with HTTP 200');
    assert(updateData.data.resolution === '4K', 'Resolution updated to 4K');
    assert(updateData.data.fps === 60, 'FPS updated to 60');

    // =========================================================================
    // [TEST 10] RBAC Guard: Inspectors Forbidden from Deleting Cameras
    // =========================================================================
    console.log('\n[TEST 10] RBAC Guard: Inspectors Forbidden from Deleting Cameras');
    const rbacDelRes = await fetch(`${baseUrl}/cctv/cameras/${createdCameraId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${inspectorToken}` },
    });
    assert(rbacDelRes.status === 403, 'Inspector blocked from deleting camera with HTTP 403 Forbidden');

    // =========================================================================
    // [TEST 11] Admin Deletes Camera Asset
    // =========================================================================
    console.log('\n[TEST 11] Admin Deletes Camera Asset');
    const adminDelRes = await fetch(`${baseUrl}/cctv/cameras/${createdCameraId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminDelRes.status === 200, 'Admin deleted camera with HTTP 200');

    const camInDb = await CCTVCamera.findById(createdCameraId);
    assert(!camInDb, 'Camera purged from database');

  } catch (error: any) {
    console.error('❌ Test execution error:', error);
    assert(false, `Test exception: ${error.message}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectDatabase();
  }

  console.log(`\n=======================================================`);
  console.log(`📊 CCTV Stream Phase 9 Test Summary: ${testPassed} Passed, ${testFailed} Failed`);
  console.log(`=======================================================`);
  if (testFailed > 0) {
    process.exit(1);
  }
}

runCCTVTests();
