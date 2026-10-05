import http from 'http';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { seedData } from '../seed/seed';
import { InspectionStatus, InspectionType, ChecklistItemType } from '@nirikshan/shared-types';

async function runInspectionTests() {
  console.log('🧪 Starting NIRIKSHAN Inspection Lifecycle & Random Assignment Integration Tests...');
  await connectDatabase();
  await seedData();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(5097, resolve));
  const baseUrl = 'http://localhost:5097/api/v1';

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

    // Fetch a sample project (e.g. Pune project)
    const projectsRes = await fetch(`${baseUrl}/projects?limit=5&state=Maharashtra`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const projectsData: any = await projectsRes.json();
    const targetProject = projectsData.data.projects[0];
    const projectCoords: [number, number] = targetProject.location.coordinates;

    // TEST 1: Weighted Random Inspection Assignment Engine
    console.log('\n[TEST 1] Weighted Random Inspection Assignment Engine');
    const autoAssignRes = await fetch(`${baseUrl}/inspections/auto-assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        state: 'Maharashtra',
        type: InspectionType.SURPRISE,
        count: 2,
      }),
    });
    const autoAssignData: any = await autoAssignRes.json();
    assert(autoAssignRes.status === 201, 'Auto-assignment returns HTTP 201');
    assert(autoAssignData.data.count > 0, 'Generated automated assignments');
    assert(
      autoAssignData.data.assignments.every((a: any) => a.assignmentReason.includes('Weighted score')),
      'Assignments include explainable weighted score breakdown reason',
    );

    // TEST 2: Checklist Templates API
    console.log('\n[TEST 2] Checklist Templates API');
    const checklistRes = await fetch(`${baseUrl}/checklists`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const checklistData: any = await checklistRes.json();
    assert(checklistRes.status === 200, 'Checklist templates query returns HTTP 200');
    assert(checklistData.data.templates.length > 0, 'Found standard checklist templates');

    // TEST 3: Manual Inspection Creation
    console.log('\n[TEST 3] Manual Inspection Assignment Creation');
    const createInspRes = await fetch(`${baseUrl}/inspections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        projectId: targetProject.id,
        inspectorId: inspectorId,
        type: InspectionType.SURPRISE,
        priority: 'HIGH',
        assignmentReason: 'High priority surprise audit on critical facility.',
      }),
    });
    const createInspData: any = await createInspRes.json();
    assert(createInspRes.status === 201, 'Inspection created successfully (HTTP 201)');
    const currentInspectionId = createInspData.data.inspection.id;

    // TEST 4: Inspector Accepts Inspection
    console.log('\n[TEST 4] Inspector Accepts Assignment');
    const acceptRes = await fetch(`${baseUrl}/inspections/${currentInspectionId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${inspectorToken}` },
    });
    const acceptData: any = await acceptRes.json();
    assert(acceptRes.status === 200, 'Accept returns HTTP 200');
    assert(acceptData.data.inspection.status === InspectionStatus.ACCEPTED, 'Status changed to ACCEPTED');

    // TEST 5: Inspector En-Route
    console.log('\n[TEST 5] Inspector En-Route');
    const enRouteRes = await fetch(`${baseUrl}/inspections/${currentInspectionId}/en-route`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${inspectorToken}` },
    });
    const enRouteData: any = await enRouteRes.json();
    assert(enRouteRes.status === 200, 'En-route returns HTTP 200');
    assert(enRouteData.data.inspection.status === InspectionStatus.EN_ROUTE, 'Status changed to EN_ROUTE');

    // TEST 6: Inspector Arrives on Site
    console.log('\n[TEST 6] Inspector Arrives on Site');
    const arriveRes = await fetch(`${baseUrl}/inspections/${currentInspectionId}/arrive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${inspectorToken}`,
      },
      body: JSON.stringify({
        coordinates: projectCoords,
        accuracyMeters: 5,
      }),
    });
    const arriveData: any = await arriveRes.json();
    assert(arriveRes.status === 200, 'Arrive returns HTTP 200');
    assert(arriveData.data.inspection.status === InspectionStatus.ARRIVED, 'Status changed to ARRIVED');

    // TEST 7: GPS Verification Failure (Coordinates far away from project)
    console.log('\n[TEST 7] GPS Verification Failure Enforcement');
    const farCoordinates: [number, number] = [projectCoords[0] + 0.5, projectCoords[1] + 0.5]; // ~70km away
    const failGpsRes = await fetch(`${baseUrl}/inspections/${currentInspectionId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${inspectorToken}`,
      },
      body: JSON.stringify({
        coordinates: farCoordinates,
        accuracyMeters: 10,
      }),
    });
    const failGpsData: any = await failGpsRes.json();
    assert(failGpsRes.status === 400, 'Starting inspection far from site rejected with HTTP 400');
    assert(failGpsData.error.code === 'GEO_VERIFICATION_ERROR', 'Rejection code is GEO_VERIFICATION_ERROR');

    // TEST 8: GPS Verification Success & Start Inspection (On-site coordinates)
    console.log('\n[TEST 8] Authoritative GPS Verification & Start Inspection');
    const startRes = await fetch(`${baseUrl}/inspections/${currentInspectionId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${inspectorToken}`,
      },
      body: JSON.stringify({
        coordinates: projectCoords,
        accuracyMeters: 4,
      }),
    });
    const startData: any = await startRes.json();
    assert(startRes.status === 200, 'Start inspection returns HTTP 200');
    assert(startData.data.inspection.status === InspectionStatus.IN_PROGRESS, 'Status changed to IN_PROGRESS');
    assert(startData.data.inspection.isLocationVerified === true, 'Location marked verified by server');

    // TEST 9: Inspector Submits Findings & Checklist Responses
    console.log('\n[TEST 9] Inspector Submits Inspection Report');
    const submitRes = await fetch(`${baseUrl}/inspections/${currentInspectionId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${inspectorToken}`,
      },
      body: JSON.stringify({
        observations: 'All machinery in good working order. Students present.',
        recommendations: 'Continue monitoring bi-weekly.',
        checklistResponses: [
          {
            itemId: 'inf_01',
            category: 'Infrastructure',
            question: 'Is structural integrity intact?',
            type: ChecklistItemType.YES_NO,
            value: true,
            isCompliant: true,
          },
          {
            itemId: 'saf_01',
            category: 'Safety',
            question: 'Fire extinguishers available and valid?',
            type: ChecklistItemType.YES_NO,
            value: true,
            isCompliant: true,
          },
          {
            itemId: 'att_02',
            category: 'Attendance',
            question: 'Actual beneficiary count:',
            type: ChecklistItemType.NUMBER,
            value: 28,
            isCompliant: true,
          },
        ],
        location: {
          coordinates: projectCoords,
          accuracyMeters: 5,
        },
      }),
    });
    const submitData: any = await submitRes.json();
    assert(submitRes.status === 200, 'Submit inspection returns HTTP 200');
    assert(submitData.data.inspection.status === InspectionStatus.SUBMITTED, 'Status changed to SUBMITTED');
    assert(submitData.data.inspection.score === 100, 'Compliance score calculated correctly (100%)');

    // TEST 10: Department Official Reviews & Approves Report
    console.log('\n[TEST 10] Department Official Reviews & Approves Report');
    const reviewRes = await fetch(`${baseUrl}/inspections/${currentInspectionId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        decision: 'APPROVED',
        reviewNotes: 'Inspection findings verified. High compliance standard confirmed.',
      }),
    });
    const reviewData: any = await reviewRes.json();
    assert(reviewRes.status === 200, 'Review returns HTTP 200');
    assert(reviewData.data.inspection.status === InspectionStatus.APPROVED, 'Status updated to APPROVED');

    console.log('\n=======================================================');
    console.log(`📊 Inspection Tests Summary: ${testPassed} Passed, ${testFailed} Failed`);
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
  runInspectionTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Inspection tests failed:', err);
      process.exit(1);
    });
}
