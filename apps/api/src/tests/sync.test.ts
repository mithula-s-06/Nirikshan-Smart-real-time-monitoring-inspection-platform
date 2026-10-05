import http from 'http';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { seedData } from '../seed/seed';
import { Project } from '../models/project.model';
import { Inspection } from '../models/inspection.model';
import { IdempotencyKey } from '../models/idempotencyKey.model';
import {
  InspectionStatus,
  SyncActionType,
  ISyncPushRequest,
} from '@nirikshan/shared-types';

async function runSyncTests() {
  console.log('🧪 Starting NIRIKSHAN Phase 6: Offline Sync & Idempotency Integration Tests...');
  await connectDatabase();
  await seedData();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(5095, resolve));
  const baseUrl = 'http://localhost:5095/api/v1';

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
    // 1. Log in Super Admin & Inspector
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
    const inspectorId = inspectorData.data.user.id;

    assert(Boolean(adminToken && inspectorToken), 'Authenticated Admin and Inspector for sync tests');

    // Create a dedicated inspection for offline syncing
    let testProject = await Project.findOne({ state: 'Maharashtra' });
    if (!testProject) {
      testProject = await Project.findOne();
    }

    const testInspection = await Inspection.create({
      inspectionId: `INSP-OFFLINE-${Date.now().toString().slice(-6)}`,
      projectId: testProject!._id,
      inspectorId,
      status: InspectionStatus.ASSIGNED,
      type: 'SURPRISE',
      checklistResponses: [
        {
          itemId: 'OFFLINE_ITEM_1',
          category: 'SAFETY',
          question: 'Are site workers equipped with mandatory PPE?',
          type: 'YES_NO',
          value: null,
          photoEvidenceIds: [],
        },
        {
          itemId: 'OFFLINE_ITEM_2',
          category: 'QUALITY',
          question: 'Are concrete test cubes properly water-cured?',
          type: 'YES_NO',
          value: null,
          photoEvidenceIds: [],
        },
      ],
      evidenceIds: [],
    });

    console.log('\n[TEST 1] Delta Sync Pull');
    const pullRes = await fetch(`${baseUrl}/sync/pull`, {
      headers: { Authorization: `Bearer ${inspectorToken}` },
    });
    const pullData: any = await pullRes.json();
    assert(pullRes.status === 200, 'Sync pull returns HTTP 200');
    assert(pullData.data?.assignedInspections?.length >= 1, 'Sync package contains active assigned inspections');
    assert(pullData.data?.projects?.length >= 1, 'Sync package contains required project geodata');
    assert(pullData.data?.checklistTemplates?.length >= 1, 'Sync package contains active checklist templates');

    console.log('\n[TEST 2] Offline Batch Action Push');
    const [projLng, projLat] = testProject!.location.coordinates;
    const batchId = `BATCH_OFFLINE_${Date.now()}`;

    const syncPushPayload: ISyncPushRequest = {
      inspectorId,
      syncBatchId: batchId,
      actions: [
        {
          id: 'ACT_1',
          idempotencyKey: `IDEMP_1_${Date.now()}`,
          actionType: SyncActionType.STATUS_CHANGE,
          inspectionId: testInspection.id,
          payload: { targetStatus: InspectionStatus.ACCEPTED },
          clientTimestamp: new Date().toISOString(),
        },
        {
          id: 'ACT_2',
          idempotencyKey: `IDEMP_2_${Date.now()}`,
          actionType: SyncActionType.STATUS_CHANGE,
          inspectionId: testInspection.id,
          payload: { targetStatus: InspectionStatus.EN_ROUTE },
          clientTimestamp: new Date().toISOString(),
        },
        {
          id: 'ACT_3',
          idempotencyKey: `IDEMP_3_${Date.now()}`,
          actionType: SyncActionType.STATUS_CHANGE,
          inspectionId: testInspection.id,
          payload: {
            targetStatus: InspectionStatus.IN_PROGRESS,
            coordinates: [projLng, projLat],
          },
          clientTimestamp: new Date().toISOString(),
        },
        {
          id: 'ACT_4',
          idempotencyKey: `IDEMP_4_${Date.now()}`,
          actionType: SyncActionType.FULL_SUBMISSION,
          inspectionId: testInspection.id,
          payload: {
            observations: 'Offline inspection conducted in rural zone without cellular signal.',
            recommendations: 'Continue monitoring foundation depth.',
            checklistResponses: [
              {
                itemId: 'OFFLINE_ITEM_1',
                category: 'SAFETY',
                question: 'Are site workers equipped with mandatory PPE?',
                type: 'YES_NO',
                value: true,
              },
              {
                itemId: 'OFFLINE_ITEM_2',
                category: 'QUALITY',
                question: 'Are concrete test cubes properly water-cured?',
                type: 'YES_NO',
                value: true,
              },
            ],
          },
          clientTimestamp: new Date().toISOString(),
        },
      ],
    };

    const pushRes = await fetch(`${baseUrl}/sync/push`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${inspectorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(syncPushPayload),
    });

    const pushData: any = await pushRes.json();
    assert(pushRes.status === 200, 'Batch push returns HTTP 200');
    assert(pushData.data?.successCount === 4, 'All 4 offline actions processed successfully');
    assert(pushData.data?.failureCount === 0, '0 failures reported in sync batch');

    const syncedInspection = await Inspection.findById(testInspection.id);
    assert(syncedInspection?.status === InspectionStatus.SUBMITTED, 'Inspection transitioned to SUBMITTED state');
    assert(syncedInspection?.score === 100, 'Compliance score computed correctly offline (100%)');
    assert(syncedInspection?.isLocationVerified === true, 'Location verification recorded');

    console.log('\n[TEST 3] Server-Side Idempotency Key Replay');
    const testIdempotencyKey = `IDEMP_KEY_TEST_${Date.now()}`;
    const testActionPayload = {
      syncBatchId: `BATCH_${Date.now()}`,
      actions: [
        {
          id: 'ACT_IDEMP_TEST',
          idempotencyKey: `IDEMP_INNER_${Date.now()}`,
          actionType: SyncActionType.LOCATION_LOG,
          inspectionId: testInspection.id,
          payload: { coordinates: [projLng, projLat], stage: 'ARRIVE' },
          clientTimestamp: new Date().toISOString(),
        },
      ],
    };

    // First request with header
    const firstIdempRes = await fetch(`${baseUrl}/sync/push`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${inspectorToken}`,
        'Content-Type': 'application/json',
        'x-idempotency-key': testIdempotencyKey,
      },
      body: JSON.stringify(testActionPayload),
    });
    assert(firstIdempRes.status === 200, 'Initial idempotent request returns HTTP 200');

    // Second request (re-transmission)
    const secondIdempRes = await fetch(`${baseUrl}/sync/push`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${inspectorToken}`,
        'Content-Type': 'application/json',
        'x-idempotency-key': testIdempotencyKey,
      },
      body: JSON.stringify(testActionPayload),
    });
    assert(secondIdempRes.status === 200, 'Replayed idempotent request returns HTTP 200');
    assert(
      secondIdempRes.headers.get('x-idempotent-replay') === 'true',
      'x-idempotent-replay header attached on duplicated transmission',
    );

    console.log('\n[TEST 4] Idempotency Conflict Detection on Mismatched Payload');
    const mismatchedPayload = {
      syncBatchId: `DIFFERENT_BATCH_${Date.now()}`,
      actions: [],
    };
    const conflictRes = await fetch(`${baseUrl}/sync/push`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${inspectorToken}`,
        'Content-Type': 'application/json',
        'x-idempotency-key': testIdempotencyKey,
      },
      body: JSON.stringify(mismatchedPayload),
    });
    assert(conflictRes.status === 409, 'Reusing idempotency key with differing payload rejected with HTTP 409 Conflict');

    console.log('\n[TEST 5] Conflict Resolution: Server-Wins on Approved Inspection');
    // Admin approves inspection on server
    testInspection.status = InspectionStatus.APPROVED;
    await testInspection.save();

    const lateOfflinePayload: ISyncPushRequest = {
      inspectorId,
      syncBatchId: `LATE_BATCH_${Date.now()}`,
      actions: [
        {
          id: 'ACT_LATE_CONFLICT',
          idempotencyKey: `IDEMP_LATE_${Date.now()}`,
          actionType: SyncActionType.STATUS_CHANGE,
          inspectionId: testInspection.id,
          payload: { targetStatus: InspectionStatus.IN_PROGRESS },
          clientTimestamp: new Date().toISOString(),
        },
      ],
    };

    const conflictPushRes = await fetch(`${baseUrl}/sync/push`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${inspectorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lateOfflinePayload),
    });
    const conflictPushData: any = await conflictPushRes.json();
    assert(conflictPushRes.status === 200, 'Push response returns HTTP 200');
    assert(
      conflictPushData.data?.results?.[0]?.conflict?.strategy === 'SERVER_WINS',
      'Conflict resolved using SERVER_WINS strategy for APPROVED inspection',
    );

    // Clean up
    await Inspection.findByIdAndDelete(testInspection.id);
    await IdempotencyKey.deleteMany({ key: testIdempotencyKey });

    console.log('\n=======================================================');
    console.log(`📊 Phase 6 Sync Tests Summary: ${testPassed} Passed, ${testFailed} Failed`);
    console.log('=======================================================');

    if (testFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectDatabase();
  }
}

runSyncTests();
