import http from 'http';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { seedData } from '../seed/seed';
import { Project } from '../models/project.model';
import { Inspection } from '../models/inspection.model';
import { Evidence } from '../models/evidence.model';
import { AnomalyAlert } from '../models/anomalyAlert.model';
import {
  AnomalyType,
  AnomalySeverity,
  AlertStatus,
  EvidenceType,
} from '@nirikshan/shared-types';

async function runAnomalyTests() {
  console.log('🧪 Starting NIRIKSHAN Phase 8: AI & Explainable Anomaly Analytics Integration Tests...');
  await connectDatabase();
  await seedData();

  const app = createApp();
  const server = http.createServer(app);

  const TEST_PORT = 5097;
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
    const inspectorId = inspectorData.data.user.id;

    assert(Boolean(adminToken && inspectorToken), 'Authenticated Admin and Inspector for anomaly tests');

    // Fetch projects for testing
    const projects = await Project.find().limit(2);
    assert(projects.length >= 2, 'Found at least 2 test projects in database');
    const projectA = projects[0];
    const projectB = projects[1];

    // =========================================================================
    // [TEST 1] Attendance Analysis: Normal Concordance
    // =========================================================================
    console.log('\n[TEST 1] Attendance Analysis: Normal Workforce Concordance');
    const normalAttRes = await fetch(`${baseUrl}/anomalies/analyze/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${inspectorToken}`,
      },
      body: JSON.stringify({
        projectId: projectA.id,
        claimedAttendance: 50,
        observedAttendance: 48,
        historicalAverage: 47,
      }),
    });
    const normalAttData: any = await normalAttRes.json();
    assert(normalAttRes.status === 200, 'Attendance analysis endpoint returns HTTP 200');
    assert(normalAttData.data.isAnomaly === false, 'Concordant attendance marked as non-anomalous (isAnomaly: false)');
    assert(normalAttData.data.severity === AnomalySeverity.LOW, 'Severity evaluated as LOW');

    // =========================================================================
    // [TEST 2] Attendance Anomaly: Critical Ghost Worker Deficit
    // =========================================================================
    console.log('\n[TEST 2] Attendance Anomaly: Critical Ghost Workforce Mismatch');
    const criticalAttRes = await fetch(`${baseUrl}/anomalies/analyze/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        projectId: projectA.id,
        claimedAttendance: 100,
        observedAttendance: 45, // 55% deficit
        historicalAverage: 90,
      }),
    });
    const criticalAttData: any = await criticalAttRes.json();
    assert(criticalAttRes.status === 200, 'Ghost workforce analysis returns HTTP 200');
    assert(criticalAttData.data.isAnomaly === true, '55% deficit detected as anomaly (isAnomaly: true)');
    assert(criticalAttData.data.severity === AnomalySeverity.CRITICAL, 'Evaluated as CRITICAL severity');
    assert(criticalAttData.data.confidenceScore >= 0.85, 'Confidence score calculated >= 0.85');
    assert(Boolean(criticalAttData.data.alert?.id), 'Automatic AnomalyAlert record created in database');

    const createdAttAlertId = criticalAttData.data.alert.id;

    // =========================================================================
    // [TEST 3] Progress Velocity Analysis: Normal Fiscal-to-Physical Alignment
    // =========================================================================
    console.log('\n[TEST 3] Progress Velocity: Normal Alignment');
    const normalVelRes = await fetch(`${baseUrl}/anomalies/analyze/progress-velocity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        projectId: projectA.id,
        reportedPhysicalProgressPct: 40,
        disbursedFundsAmount: 4200000,
        sanctionedBudgetAmount: 10000000, // 42% disbursed vs 40% physical
      }),
    });
    const normalVelData: any = await normalVelRes.json();
    assert(normalVelRes.status === 200, 'Progress velocity returns HTTP 200');
    assert(normalVelData.data.isAnomaly === false, 'Aligned progress evaluated as non-anomalous');

    // =========================================================================
    // [TEST 4] Progress Velocity Anomaly: Critical Expenditure Velocity Divergence
    // =========================================================================
    console.log('\n[TEST 4] Progress Velocity: Critical Premature Fund Liquidation');
    const criticalVelRes = await fetch(`${baseUrl}/anomalies/analyze/progress-velocity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        projectId: projectA.id,
        reportedPhysicalProgressPct: 15,
        disbursedFundsAmount: 8500000,
        sanctionedBudgetAmount: 10000000, // 85% spent vs 15% physical
      }),
    });
    const criticalVelData: any = await criticalVelRes.json();
    assert(criticalVelRes.status === 200, 'Velocity divergence returns HTTP 200');
    assert(criticalVelData.data.isAnomaly === true, 'Severe velocity divergence flagged as anomaly');
    assert(criticalVelData.data.severity === AnomalySeverity.CRITICAL, 'Evaluated as CRITICAL severity');
    assert(criticalVelData.data.anomalyType === AnomalyType.REPORTING_SPIKE, 'Anomaly type tagged as REPORTING_SPIKE');
    assert(Boolean(criticalVelData.data.alert?.id), 'Reporting spike alert created');

    // =========================================================================
    // [TEST 5 & 6] Duplicate Evidence Image Hash Reuse Detection
    // =========================================================================
    console.log('\n[TEST 5 & 6] Duplicate Evidence Hashing & Fraud Detection');
    const testHash = 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0';

    let testInspection = await Inspection.findOne({ projectId: projectA._id });
    if (!testInspection) {
      testInspection = await Inspection.create({
        inspectionId: 'INSP-ANOMALY-TEST-001',
        projectId: projectA._id,
        inspectorId: inspectorId,
        type: 'SURPRISE',
        status: 'ASSIGNED',
        assignedAt: new Date(),
      });
    }

    // Seed an original evidence in Project A
    const originalEvidence = await Evidence.create({
      projectId: projectA._id,
      inspectionId: testInspection._id,
      capturedBy: inspectorId,
      type: EvidenceType.PHOTO,
      fileUrl: 'http://localhost:5000/uploads/original.jpg',
      fileKey: 'inspections/orig.jpg',
      mimeType: 'image/jpeg',
      fileSize: 102400,
      sha256Hash: testHash,
      isHashVerified: true,
      location: {
        type: 'Point',
        coordinates: [73.8567, 18.5204],
      },
    });

    // Test unique hash (no duplicate)
    const uniqueHashRes = await fetch(`${baseUrl}/anomalies/analyze/duplicate-evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${inspectorToken}`,
      },
      body: JSON.stringify({
        evidenceId: 'EV-NEW-001',
        sha256Hash: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        projectId: projectB.id,
      }),
    });
    const uniqueHashData: any = await uniqueHashRes.json();
    assert(uniqueHashData.data.isAnomaly === false, 'Unique evidence file marked as non-fraudulent');

    // Test cross-project duplicate hash (FRAUD)
    const duplicateHashRes = await fetch(`${baseUrl}/anomalies/analyze/duplicate-evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        evidenceId: 'EV-FRAUD-002',
        sha256Hash: testHash,
        projectId: projectB.id, // Uploaded to Project B but exists in Project A!
      }),
    });
    const duplicateHashData: any = await duplicateHashRes.json();
    assert(duplicateHashRes.status === 200, 'Duplicate evidence analysis returns HTTP 200');
    assert(duplicateHashData.data.isAnomaly === true, 'Recycled photo fraud detected across distinct projects');
    assert(duplicateHashData.data.severity === AnomalySeverity.CRITICAL, 'Evaluated as CRITICAL severity');
    assert(duplicateHashData.data.anomalyType === AnomalyType.DUPLICATE_EVIDENCE, 'Type tagged as DUPLICATE_EVIDENCE');
    assert(Boolean(duplicateHashData.data.alert?.id), 'Duplicate evidence alert created in database');

    const duplicateAlertId = duplicateHashData.data.alert.id;

    // =========================================================================
    // [TEST 7] Query Paginated Alerts List
    // =========================================================================
    console.log('\n[TEST 7] Query Paginated Anomaly Alerts');
    const getAlertsRes = await fetch(`${baseUrl}/anomalies/alerts?limit=10&status=OPEN`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getAlertsData: any = await getAlertsRes.json();
    assert(getAlertsRes.status === 200, 'Alerts listing endpoint returns HTTP 200');
    assert(Array.isArray(getAlertsData.data) && getAlertsData.data.length >= 3, 'Found created alerts in listing');
    assert(getAlertsData.meta?.total >= 3, 'Pagination metadata accurately reports total count');

    // =========================================================================
    // [TEST 8] Get Single Alert by ID
    // =========================================================================
    console.log('\n[TEST 8] Fetch Single Alert Details');
    const singleAlertRes = await fetch(`${baseUrl}/anomalies/alerts/${createdAttAlertId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${inspectorToken}` },
    });
    const singleAlertData: any = await singleAlertRes.json();
    assert(singleAlertRes.status === 200, 'Single alert details returns HTTP 200');
    assert(singleAlertData.data.id === createdAttAlertId, 'Retrieved matching alert ID');
    assert(singleAlertData.data.type === AnomalyType.ATTENDANCE_MISMATCH, 'Correct anomaly type populated');

    // =========================================================================
    // [TEST 9] Alert Workflow Lifecycle: Investigate & Resolve
    // =========================================================================
    console.log('\n[TEST 9] Alert Workflow Status Transitions (OPEN -> INVESTIGATING -> RESOLVED)');
    
    // Step 1: Mark Investigating
    const invRes = await fetch(`${baseUrl}/anomalies/alerts/${createdAttAlertId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: AlertStatus.INVESTIGATING,
        resolutionNotes: 'Special inquiry officer dispatched to cross-verify biometric logs.',
      }),
    });
    const invData: any = await invRes.json();
    assert(invRes.status === 200, 'Status updated to INVESTIGATING with HTTP 200');
    assert(invData.data.status === AlertStatus.INVESTIGATING, 'Alert status reflects INVESTIGATING');

    // Step 2: Mark Resolved
    const resRes = await fetch(`${baseUrl}/anomalies/alerts/${createdAttAlertId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: AlertStatus.RESOLVED,
        resolutionNotes: 'Contractor penalized ₹150,000 for inflated muster rolls. Accurate headcounts restored.',
      }),
    });
    const resData: any = await resRes.json();
    assert(resRes.status === 200, 'Status updated to RESOLVED with HTTP 200');
    assert(resData.data.status === AlertStatus.RESOLVED, 'Alert status reflects RESOLVED');
    assert(Boolean(resData.data.resolvedAt), 'resolvedAt timestamp populated upon resolution');

    // =========================================================================
    // [TEST 10] RBAC Protection: Inspectors Forbidden from Resolving Alerts
    // =========================================================================
    console.log('\n[TEST 10] RBAC Guard: Inspectors Forbidden from Modifying Alert Status');
    const rbacRes = await fetch(`${baseUrl}/anomalies/alerts/${duplicateAlertId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${inspectorToken}`,
      },
      body: JSON.stringify({
        status: AlertStatus.RESOLVED,
        resolutionNotes: 'Attempted resolution by inspector',
      }),
    });
    assert(rbacRes.status === 403, 'Inspector blocked from resolving alert with HTTP 403 Forbidden');

    // Clean up test evidence
    await Evidence.findByIdAndDelete(originalEvidence._id);

  } catch (error: any) {
    console.error('❌ Test execution error:', error);
    assert(false, `Test exception: ${error.message}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectDatabase();
  }

  console.log(`\n=======================================================`);
  console.log(`📊 AI & Anomaly Phase 8 Test Summary: ${testPassed} Passed, ${testFailed} Failed`);
  console.log(`=======================================================`);
  if (testFailed > 0) {
    process.exit(1);
  }
}

runAnomalyTests();
