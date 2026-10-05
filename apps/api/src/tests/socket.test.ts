import http from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { seedData } from '../seed/seed';
import { initializeSocketServer } from '../socket/socket.server';
import { emitter } from '../socket/emitter';
import { SocketEvent, UserRole, InspectionStatus, AnomalySeverity, AnomalyType } from '@nirikshan/shared-types';

async function runSocketTests() {
  console.log('🧪 Starting NIRIKSHAN Phase 7: Real-Time Event & Socket.IO Telemetry Tests...');
  await connectDatabase();
  await seedData();

  const app = createApp();
  const server = http.createServer(app);
  const ioServer = initializeSocketServer(server);

  const TEST_PORT = 5096;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
  const baseUrl = `http://localhost:${TEST_PORT}/api/v1`;
  const socketUrl = `http://localhost:${TEST_PORT}`;

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

  const clients: ClientSocket[] = [];

  function createClient(token?: string, extraOptions = {}): ClientSocket {
    const socket = Client(socketUrl, {
      auth: token ? { token } : undefined,
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      ...extraOptions,
    });
    clients.push(socket);
    return socket;
  }

  try {
    // 1. Authenticate to get valid tokens
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@nirikshan.gov.in', password: 'Password@123' }),
    });
    const adminData: any = await adminLoginRes.json();
    const adminToken = adminData.data?.tokens?.accessToken;
    const adminId = adminData.data?.user?.id;

    const inspectorLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'inspector1@nirikshan.gov.in', password: 'Password@123' }),
    });
    const inspectorData: any = await inspectorLoginRes.json();
    const inspectorToken = inspectorData.data?.tokens?.accessToken;
    const inspectorId = inspectorData.data?.user?.id;

    assert(Boolean(adminToken && inspectorToken), 'Obtained valid JWT tokens for Admin and Inspector');

    // 2. Test Unauthenticated Socket Rejection
    const unauthConnected = await new Promise<boolean>((resolve) => {
      const socket = createClient(undefined);
      socket.on('connect', () => resolve(true));
      socket.on('connect_error', () => resolve(false));
    });
    assert(!unauthConnected, 'Socket connection rejected without auth token');

    // 3. Test Invalid Token Socket Rejection
    const invalidTokenConnected = await new Promise<boolean>((resolve) => {
      const socket = createClient('invalid.jwt.token');
      socket.on('connect', () => resolve(true));
      socket.on('connect_error', () => resolve(false));
    });
    assert(!invalidTokenConnected, 'Socket connection rejected with malformed/invalid token');

    // 4. Test Authenticated Connection for Admin & Inspector
    const adminSocket = createClient(adminToken);
    const inspectorSocket = createClient(inspectorToken);

    const [adminConnected, inspectorConnected] = await Promise.all([
      new Promise<boolean>((resolve) => {
        adminSocket.on('connect', () => resolve(true));
        adminSocket.on('connect_error', () => resolve(false));
      }),
      new Promise<boolean>((resolve) => {
        inspectorSocket.on('connect', () => resolve(true));
        inspectorSocket.on('connect_error', () => resolve(false));
      }),
    ]);

    assert(adminConnected, 'Super Admin socket authenticated and connected');
    assert(inspectorConnected, 'Inspector socket authenticated and connected');

    // 5. Test Room Subscription: join:inspection & leave:inspection
    const testInspectionId = 'INSP-TEST-SOCKET-001';
    const joinResult = await new Promise<any>((resolve) => {
      inspectorSocket.emit(SocketEvent.JOIN_INSPECTION, { inspectionId: testInspectionId }, (res: any) => {
        resolve(res);
      });
    });
    assert(joinResult?.success === true && joinResult?.room === `inspection:${testInspectionId}`, 'Inspector joined inspection room');

    // Also have admin join the inspection room
    await new Promise<void>((resolve) => {
      adminSocket.emit(SocketEvent.JOIN_INSPECTION, { inspectionId: testInspectionId }, () => resolve());
    });

    // 6. Test Real-Time GPS Telemetry Streaming (Inspector -> Server -> Admin & Room)
    const gpsPromise = new Promise<any>((resolve) => {
      adminSocket.once(SocketEvent.LOCATION_UPDATE, (data) => {
        resolve(data);
      });
    });

    const gpsPayload = {
      inspectionId: testInspectionId,
      coordinates: [73.8567, 18.5204] as [number, number],
      accuracyMeters: 4.5,
      speedKmh: 12.3,
      headingDeg: 180,
      batteryLevel: 92,
      timestamp: new Date().toISOString(),
    };

    inspectorSocket.emit(SocketEvent.LOCATION_UPDATE, gpsPayload);

    const receivedGps = await Promise.race([
      gpsPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('GPS telemetry timeout')), 3000)),
    ]) as any;

    assert(
      receivedGps &&
      receivedGps.inspectionId === testInspectionId &&
      receivedGps.coordinates[0] === 73.8567 &&
      receivedGps.inspectorId === inspectorId,
      'Real-time GPS telemetry streamed from Inspector and broadcasted to Admin Room',
    );

    // 7. Test Emitter: emitInspectionAssigned
    const assignedPromise = new Promise<any>((resolve) => {
      inspectorSocket.once(SocketEvent.INSPECTION_ASSIGNED, (data) => {
        resolve(data);
      });
    });

    const mockInspection = {
      id: testInspectionId,
      inspectionId: testInspectionId,
      inspectorId: inspectorId,
      status: InspectionStatus.ASSIGNED,
    };

    emitter.emitInspectionAssigned(mockInspection);

    const assignedReceived = await Promise.race([
      assignedPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Assigned event timeout')), 3000)),
    ]) as any;

    assert(
      assignedReceived && assignedReceived.inspection?.id === testInspectionId,
      'Emitter routed inspection:assigned event to specific assigned Inspector',
    );

    // 8. Test Emitter: emitInspectionStatusChanged
    const statusChangePromise = new Promise<any>((resolve) => {
      adminSocket.once(SocketEvent.INSPECTION_STATUS_CHANGED, (data) => {
        resolve(data);
      });
    });

    emitter.emitInspectionStatusChanged(
      mockInspection,
      InspectionStatus.ASSIGNED,
      InspectionStatus.IN_PROGRESS,
    );

    const statusChangeReceived = await Promise.race([
      statusChangePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Status change timeout')), 3000)),
    ]) as any;

    assert(
      statusChangeReceived &&
      statusChangeReceived.newStatus === InspectionStatus.IN_PROGRESS &&
      statusChangeReceived.inspectionId === testInspectionId,
      'Emitter broadcasted inspection:status_changed event to Admin and inspection room',
    );

    // 9. Test Emitter: emitEvidenceUploaded
    const evidencePromise = new Promise<any>((resolve) => {
      adminSocket.once(SocketEvent.EVIDENCE_UPLOADED, (data) => {
        resolve(data);
      });
    });

    const mockEvidence = {
      id: 'EV-TEST-999',
      inspectionId: testInspectionId,
      type: 'PHOTO',
      fileUrl: 'http://localhost:5000/uploads/test.jpg',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    };

    emitter.emitEvidenceUploaded(testInspectionId, mockEvidence);

    const evidenceReceived = await Promise.race([
      evidencePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Evidence event timeout')), 3000)),
    ]) as any;

    assert(
      evidenceReceived && evidenceReceived.evidence?.id === 'EV-TEST-999',
      'Emitter broadcasted evidence:uploaded event to inspection room subscribers',
    );

    // 10. Test Emitter: emitAlertCreated
    const alertPromise = new Promise<any>((resolve) => {
      adminSocket.once(SocketEvent.ALERT_CREATED, (data) => {
        resolve(data);
      });
    });

    const mockAlert = {
      id: 'ALT-1001',
      type: AnomalyType.ATTENDANCE_MISMATCH,
      severity: AnomalySeverity.HIGH,
      message: 'Critical workforce attendance mismatch detected on site',
    };

    emitter.emitAlertCreated(mockAlert);

    const alertReceived = await Promise.race([
      alertPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Alert event timeout')), 3000)),
    ]) as any;

    assert(
      alertReceived && alertReceived.alert?.id === 'ALT-1001',
      'Emitter routed anomaly alert:created event to Super Admin role room',
    );

    // 11. Test leave:inspection room
    const leaveResult = await new Promise<any>((resolve) => {
      inspectorSocket.emit(SocketEvent.LEAVE_INSPECTION, { inspectionId: testInspectionId }, (res: any) => {
        resolve(res);
      });
    });
    assert(leaveResult?.success === true, 'Inspector successfully left inspection room');

  } catch (error: any) {
    console.error('❌ Test execution error:', error);
    assert(false, `Test exception: ${error.message}`);
  } finally {
    // Teardown
    clients.forEach((c) => c.disconnect());
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectDatabase();
  }

  console.log(`\n📊 Socket.IO Phase 7 Test Summary: ${testPassed} Passed, ${testFailed} Failed`);
  if (testFailed > 0) {
    process.exit(1);
  }
}

runSocketTests();
