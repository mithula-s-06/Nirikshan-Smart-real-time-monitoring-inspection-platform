import http from 'http';
import crypto from 'crypto';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { seedData } from '../seed/seed';
import { Project } from '../models/project.model';
import { Inspection } from '../models/inspection.model';
import { Evidence } from '../models/evidence.model';
import { EvidenceType, InspectionStatus, UserRole } from '@nirikshan/shared-types';

async function runEvidenceTests() {
  console.log('🧪 Starting NIRIKSHAN Phase 5: Evidence & Storage Abstraction Integration Tests...');
  await connectDatabase();
  await seedData();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(5096, resolve));
  const baseUrl = 'http://localhost:5096/api/v1';

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
    // 1. Log in Super Admin and Inspector
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

    assert(Boolean(adminToken && inspectorToken), 'Logged in Admin and Inspector successfully');

    // 2. Find or create an inspection for testing
    let testProject = await Project.findOne({ state: 'Maharashtra' });
    if (!testProject) {
      testProject = await Project.findOne();
    }

    const testInspection = await Inspection.create({
      inspectionId: `INSP-EV-${Date.now().toString().slice(-6)}`,
      projectId: testProject!._id,
      inspectorId,
      status: InspectionStatus.IN_PROGRESS,
      type: 'SURPRISE',
      checklistResponses: [
        {
          itemId: 'Q_FOUNDATION',
          category: 'STRUCTURAL',
          question: 'Is foundation reinforcement aligned with approved blueprint?',
          type: 'PHOTO_REQUIRED',
          value: true,
          photoEvidenceIds: [],
        },
      ],
      evidenceIds: [],
    });

    console.log('\n[TEST 1] Upload Photo Evidence with GPS & SHA-256 Hashing');
    const fakeImageBuffer = Buffer.from('FAKE_JPEG_IMAGE_PIXELS_FOR_NIRIKSHAN_SITE_INSPECTION_AUDIT');
    const expectedHash = crypto.createHash('sha256').update(fakeImageBuffer).digest('hex');

    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
    const [projLng, projLat] = testProject!.location.coordinates;

    const formDataParts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="type"\r\n\r\nPHOTO\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nFoundation pillar steel inspection close-up\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="checklistQuestionId"\r\n\r\nQ_FOUNDATION\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="latitude"\r\n\r\n${projLat}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="longitude"\r\n\r\n${projLng}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="accuracyMeters"\r\n\r\n4.5\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="deviceModel"\r\n\r\nPixel 8 Pro\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="devicePlatform"\r\n\r\nAndroid\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="tags"\r\n\r\n["FOUNDATION", "PILLAR", "REINFORCEMENT"]\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="foundation_steel.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
    ];

    const bodyBuffer = Buffer.concat([
      Buffer.from(formDataParts.join('')),
      fakeImageBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const uploadRes = await fetch(`${baseUrl}/inspections/${testInspection.id}/evidence`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${inspectorToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: bodyBuffer,
    });

    const uploadData: any = await uploadRes.json();
    assert(uploadRes.status === 201, 'Evidence upload returns HTTP 201 Created');
    assert(uploadData.data?.evidence?.sha256Hash === expectedHash, 'SHA-256 hash computed correctly on ingestion');
    assert(uploadData.data?.evidence?.isLocationVerified === true, 'Server-side GPS geoverification passed for coordinates within project bounds');
    assert(uploadData.data?.evidence?.mimeType === 'image/jpeg', 'MIME type recorded properly');

    const createdEvidenceId = uploadData.data?.evidence?.id;

    console.log('\n[TEST 2] Linkage to Inspection & Checklist');
    const updatedInspection = await Inspection.findById(testInspection.id);
    assert(
      updatedInspection?.evidenceIds?.includes(createdEvidenceId) === true,
      'Evidence ID automatically appended to inspection.evidenceIds',
    );
    assert(
      updatedInspection?.checklistResponses?.[0]?.photoEvidenceIds?.includes(createdEvidenceId) === true,
      'Evidence linked to specific checklist question item (Q_FOUNDATION)',
    );

    console.log('\n[TEST 3] Cryptographic Tamper-Verification Endpoint');
    const verifyRes = await fetch(`${baseUrl}/evidence/${createdEvidenceId}/verify-hash`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${inspectorToken}` },
    });
    const verifyData: any = await verifyRes.json();
    assert(verifyRes.status === 200, 'Verify-hash returns HTTP 200');
    assert(verifyData.data?.isTamperFree === true, 'Evidence confirmed tamper-free (hash matched storage bytes)');

    console.log('\n[TEST 4] Retrieve Inspection Evidence Roster');
    const listRes = await fetch(`${baseUrl}/inspections/${testInspection.id}/evidence`, {
      headers: { Authorization: `Bearer ${inspectorToken}` },
    });
    const listData: any = await listRes.json();
    assert(listRes.status === 200, 'Inspection evidence query returns HTTP 200');
    assert(listData.data?.evidence?.length >= 1, 'Found uploaded evidence in inspection roster');
    assert(listData.data?.evidence[0]?.capturedBy?.email === 'inspector1@nirikshan.gov.in', 'Evidence populated with capturing inspector metadata');

    console.log('\n[TEST 5] Binary Stream Retrieval');
    const streamRes = await fetch(`${baseUrl}/evidence/${createdEvidenceId}/stream`, {
      headers: { Authorization: `Bearer ${inspectorToken}` },
    });
    const streamedBuffer = Buffer.from(await streamRes.arrayBuffer());
    assert(streamRes.status === 200, 'Streaming evidence returns HTTP 200');
    assert(streamedBuffer.toString() === fakeImageBuffer.toString(), 'Streamed bytes match uploaded buffer exactly');

    console.log('\n[TEST 6] Disallowed File Type Rejection');
    const badBoundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
    const badFileParts = [
      `--${badBoundary}\r\nContent-Disposition: form-data; name="file"; filename="malicious.exe"\r\nContent-Type: application/x-msdownload\r\n\r\n`,
      Buffer.from('EXECUTABLE_BYTES'),
      `\r\n--${badBoundary}--\r\n`,
    ];
    const badBody = Buffer.concat([
      Buffer.from(badFileParts[0]),
      badFileParts[1] as Buffer,
      Buffer.from(badFileParts[2]),
    ]);

    const badUploadRes = await fetch(`${baseUrl}/inspections/${testInspection.id}/evidence`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${inspectorToken}`,
        'Content-Type': `multipart/form-data; boundary=${badBoundary}`,
      },
      body: badBody,
    });
    assert(badUploadRes.status === 400, 'Unsupported file type (.exe) rejected with HTTP 400');

    console.log('\n[TEST 7] Evidence Deletion & Audit Trail');
    const deleteRes = await fetch(`${baseUrl}/evidence/${createdEvidenceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteRes.status === 200, 'Admin can delete evidence with HTTP 200');

    const checkDeleted = await Evidence.findById(createdEvidenceId);
    assert(checkDeleted === null, 'Evidence removed from database');

    const cleanInspection = await Inspection.findById(testInspection.id);
    assert(
      cleanInspection?.evidenceIds?.includes(createdEvidenceId) === false,
      'Evidence ID purged from inspection.evidenceIds',
    );

    // Clean up test inspection
    await Inspection.findByIdAndDelete(testInspection.id);

    console.log('\n=======================================================');
    console.log(`📊 Phase 5 Evidence Tests Summary: ${testPassed} Passed, ${testFailed} Failed`);
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

runEvidenceTests();
