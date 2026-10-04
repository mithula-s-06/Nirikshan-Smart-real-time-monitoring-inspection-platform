import fs from 'fs';
import path from 'path';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { ComplianceRecord } from '../models/complianceRecord.model';
import { FinancialRecord } from '../models/financialRecord.model';
import { CorrectiveAction } from '../models/correctiveAction.model';
import { Beneficiary } from '../models/beneficiary.model';
import { VCSession } from '../models/vcSession.model';
import { Organization } from '../models/organization.model';
import { Project } from '../models/project.model';
import { AnomalyAlert } from '../models/anomalyAlert.model';
import { User } from '../models/user.model';
import {
  ComplianceActionType,
  ComplianceVerificationStatus,
  ComplianceCurrentStatus,
  CorrectiveActionStatus,
  CorrectiveActionPriority,
  BeneficiaryEligibility,
  BeneficiaryVerificationStatus,
  RiskLevel,
  VCSessionStatus,
  UserRole,
  UserStatus,
} from '@nirikshan/shared-types';
import { logger } from '../utils/logger';

export async function seedExtensions() {
  logger.info('Starting Nirikshan Data Model Extensions Seeding...');

  // 1. Ensure Realistic Government Hierarchy Persona Accounts Exist for Scope Validation
  const personas = [
    {
      name: 'Dr. Rajesh Verma (Joint Secretary)',
      email: 'dept.official1@nirikshan.gov.in',
      password: 'Password@123',
      role: UserRole.DOSJE_HQ_OFFICIAL,
      designation: 'Joint Secretary (National Monitoring)',
      status: UserStatus.ACTIVE,
      phoneNumber: '+91-9876543211',
      state: 'National HQ',
      district: 'New Delhi',
    },
    {
      name: 'Smt. K. Meenakshi (State Monitoring Officer)',
      email: 'state.official.tn@nirikshan.gov.in',
      password: 'Password@123',
      role: UserRole.DOSJE_STATE_OFFICIAL,
      designation: 'State Monitoring Officer (Tamil Nadu)',
      status: UserStatus.ACTIVE,
      phoneNumber: '+91-9876543215',
      state: 'Tamil Nadu',
      district: 'Chennai',
    },
    {
      name: 'Shri Ramesh Kulkarni (District Welfare Officer)',
      email: 'district.official.pune@nirikshan.gov.in',
      password: 'Password@123',
      role: UserRole.DOSJE_DISTRICT_OFFICIAL,
      designation: 'District Welfare Officer (Pune)',
      status: UserStatus.ACTIVE,
      phoneNumber: '+91-9876543216',
      state: 'Maharashtra',
      district: 'Pune',
    },
    {
      name: 'Smt. Priya Deshmukh (Project Director)',
      email: 'ngo.admin1@nirikshan.gov.in',
      password: 'Password@123',
      role: UserRole.NGO_ADMIN,
      designation: 'Institution Head (Pragati Vocational)',
      status: UserStatus.ACTIVE,
      phoneNumber: '+91-9876543214',
      state: 'Maharashtra',
      district: 'Pune',
    },
    {
      name: 'Inspector Vikram Sethi (PMU Mobile Team)',
      email: 'inspector1@nirikshan.gov.in',
      password: 'Password@123',
      role: UserRole.PMU_INSPECTOR,
      designation: 'Lead Field Inspector',
      status: UserStatus.ACTIVE,
      phoneNumber: '+91-9876543213',
      state: 'Maharashtra',
      district: 'Pune',
    },
    {
      name: 'Vikas Patil (Scheme Beneficiary)',
      email: 'beneficiary@nirikshan.gov.in',
      password: 'Password@123',
      role: UserRole.BENEFICIARY,
      designation: 'Citizen Beneficiary',
      status: UserStatus.ACTIVE,
      phoneNumber: '+91-9876543299',
      state: 'Maharashtra',
      district: 'Pune',
    },
    {
      name: 'Shri Arun Swaminathan (Audit Director)',
      email: 'auditor@nirikshan.gov.in',
      password: 'Password@123',
      role: UserRole.AUDITOR,
      designation: 'Senior CAG / Ministry Auditor',
      status: UserStatus.ACTIVE,
      phoneNumber: '+91-9876543219',
      state: 'National HQ',
      district: 'New Delhi',
    },
  ];

  for (const p of personas) {
    const existing = await User.findOne({ email: p.email });
    if (!existing) {
      await User.create(p);
      logger.info(`Seeded Persona Account: ${p.email} [${p.role}]`);
    } else {
      existing.role = p.role;
      existing.designation = p.designation;
      existing.state = p.state;
      existing.district = p.district;
      existing.status = p.status;
      await existing.save();
    }
  }

  // 2. Parse & Seed Authentic Ministry NGO Records from blacklist.txt
  const blacklistPath = path.resolve(process.cwd(), '../blacklist.txt');
  let blacklistedCount = 0;
  if (fs.existsSync(blacklistPath)) {
    const rawContent = fs.readFileSync(blacklistPath, 'utf-8');
    const lines = rawContent.split('\n');

    await ComplianceRecord.deleteMany({});

    const complianceDocs = [];
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length < 3) continue;
      const serialPart = parts[0].trim();
      if (serialPart === 'S.No.' || !serialPart) continue;

      const fullNgoName = parts[1].trim();
      const rawAction = parts[2].trim();

      // Extract state heuristic from NGO name/address
      let state = 'National';
      if (/Uttar Pradesh|U\.P\.|UP\b/i.test(fullNgoName)) state = 'Uttar Pradesh';
      else if (/Maharashtra|Mumbai|Pune|Akola|Amravati|Yuvatmal/i.test(fullNgoName)) state = 'Maharashtra';
      else if (/Karnataka|Bangalore|Gulbarga|Bidar/i.test(fullNgoName)) state = 'Karnataka';
      else if (/Andhra Pradesh|A\.P\.|Anantpur|Guntur/i.test(fullNgoName)) state = 'Andhra Pradesh';
      else if (/Orissa|Odisha|Bhubaneshwar|Nayagarh/i.test(fullNgoName)) state = 'Odisha';
      else if (/Rajasthan|Jaipur/i.test(fullNgoName)) state = 'Rajasthan';
      else if (/Tamil Nadu|Chennai|Tittagudi/i.test(fullNgoName)) state = 'Tamil Nadu';
      else if (/Bihar|Gaya/i.test(fullNgoName)) state = 'Bihar';
      else if (/Gujarat|Ahmedabad/i.test(fullNgoName)) state = 'Gujarat';
      else if (/Delhi|New Delhi/i.test(fullNgoName)) state = 'Delhi';
      else if (/Sikkim/i.test(fullNgoName)) state = 'Sikkim';
      else if (/Goa/i.test(fullNgoName)) state = 'Goa';

      // Parse Action Type
      let actionType = ComplianceActionType.BLACKLISTED;
      let currentStatus = ComplianceCurrentStatus.BLACKLISTED;
      if (/recover grants|seize/i.test(rawAction)) {
        actionType = ComplianceActionType.GRANT_RECOVERY;
        currentStatus = ComplianceCurrentStatus.ACTION_REQUIRED;
      } else if (/stopping|stopped|discontinued/i.test(rawAction)) {
        actionType = ComplianceActionType.GRANT_SUSPENDED;
        currentStatus = ComplianceCurrentStatus.GRANT_SUSPENDED;
      } else if (/enquire|enquiry/i.test(rawAction)) {
        actionType = ComplianceActionType.STATE_ENQUIRY;
        currentStatus = ComplianceCurrentStatus.UNDER_REVIEW;
      }

      // Extract Order Number if present
      const orderMatch = rawAction.match(/\{([^}]+)\}|\(([^)]+)\)/);
      const orderNumber = orderMatch ? (orderMatch[1] || orderMatch[2]).trim() : undefined;

      // Extract Scheme if present
      let scheme = 'DoSJE Central Welfare Assistance';
      if (/ADIP/i.test(rawAction)) scheme = 'ADIP Scheme for Divyangjan';
      else if (/Street Children/i.test(rawAction)) scheme = 'Integrated Welfare Scheme for Street Children';
      else if (/Older Person/i.test(rawAction)) scheme = 'Atal Vayo Abhyuday Yojana (Older Persons)';
      else if (/DRUG|DP-I|DP-III/i.test(rawAction)) scheme = 'National Action Plan for Drug Demand Reduction';
      else if (/MC/i.test(rawAction)) scheme = 'Pre-Examination Coaching for Minority & Backward Classes';
      else if (/DD-II|SCD-III/i.test(rawAction)) scheme = 'Special Central Assistance for SC Welfare';

      // Clean display name
      const ngoName = fullNgoName.replace(/^([0-9]+\.\s*)/, '').split(',')[0].trim();

      complianceDocs.push({
        ngoName: ngoName || fullNgoName,
        state,
        district: state === 'National' ? 'HQ' : undefined,
        actionType,
        actionDate: rawAction.match(/[0-9]{2}\.[0-9]{2}\.[0-9]{4}/)?.[0] || 'Historical Record',
        scheme,
        authority: 'Department of Social Justice & Empowerment, Govt. of India',
        orderNumber: orderNumber || 'M-DoSJE/AUDIT/HISTORICAL',
        description: `${rawAction} — Historical Ministry Action Record per Central Monitoring Registry.`,
        sourceDocument: 'DoSJE Official Blacklist Gazette (National Registry Reference)',
        verificationStatus: ComplianceVerificationStatus.VERIFIED,
        currentStatus,
      });
    }

    if (complianceDocs.length > 0) {
      await ComplianceRecord.insertMany(complianceDocs);
      blacklistedCount = complianceDocs.length;
      logger.info(`Successfully seeded ${blacklistedCount} official compliance/blacklist records from blacklist.txt!`);
    }
  }

  // 3. Seed Beneficiary Master Registry
  const projects = await Project.find({}).limit(5);
  const orgs = await Organization.find({}).limit(5);

  if (projects.length > 0 && orgs.length > 0) {
    await Beneficiary.deleteMany({});

    const sampleBeneficiaries = [
      {
        beneficiaryId: 'BEN-2026-PUN-001',
        name: 'Rahul Suresh Shinde',
        dateOfBirth: '2005-04-12',
        age: 21,
        guardianName: 'Suresh Shinde',
        gender: 'MALE',
        category: 'SC',
        address: 'Plot 14, Sant Tukaram Nagar, Pimpri, Pune',
        district: 'Pune',
        state: 'Maharashtra',
        maskedPhone: '98******21',
        phoneHash: '3a884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d1',
        organizationId: orgs[0]._id,
        projectId: projects[0]._id,
        unitId: 'unit_st_jude',
        scheme: 'DDU-GKY Rural Livelihoods Scheme',
        enrollmentStartDate: '2025-06-01',
        enrollmentEndDate: '2026-12-31',
        eligibilityStatus: BeneficiaryEligibility.ELIGIBLE,
        verificationStatus: BeneficiaryVerificationStatus.VERIFIED,
        riskLevel: RiskLevel.LOW,
        totalAttendanceSessions: 42,
        verifiedAttendanceSessions: 40,
        activeAnomaliesCount: 0,
      },
      {
        beneficiaryId: 'BEN-2026-PUN-002',
        name: 'Pooja Anand Kamble',
        dateOfBirth: '2006-08-19',
        age: 20,
        guardianName: 'Anand Kamble',
        gender: 'FEMALE',
        category: 'SC',
        address: 'Bhim Nagar, Hinjawadi Phase 2, Pune',
        district: 'Pune',
        state: 'Maharashtra',
        maskedPhone: '94******44',
        phoneHash: '9b265d6666cfb7f6c6e7a250326071ab6316ec5c0d50731df4cc388277263595',
        organizationId: orgs[0]._id,
        projectId: projects[0]._id,
        unitId: 'unit_st_jude',
        scheme: 'DDU-GKY Rural Livelihoods Scheme',
        enrollmentStartDate: '2025-06-01',
        enrollmentEndDate: '2026-12-31',
        eligibilityStatus: BeneficiaryEligibility.ELIGIBLE,
        verificationStatus: BeneficiaryVerificationStatus.VERIFIED,
        riskLevel: RiskLevel.LOW,
        totalAttendanceSessions: 40,
        verifiedAttendanceSessions: 39,
        activeAnomaliesCount: 0,
      },
      {
        beneficiaryId: 'BEN-2026-PUN-003',
        name: 'Vikas Madhukar Patil',
        dateOfBirth: '2004-11-03',
        age: 22,
        guardianName: 'Madhukar Patil',
        gender: 'MALE',
        category: 'OBC',
        address: 'Chinchwad Station Road, Pune',
        district: 'Pune',
        state: 'Maharashtra',
        maskedPhone: '97******88',
        phoneHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        organizationId: orgs[0]._id,
        projectId: projects[0]._id,
        unitId: 'unit_st_jude',
        scheme: 'DDU-GKY Rural Livelihoods Scheme',
        enrollmentStartDate: '2025-07-15',
        enrollmentEndDate: '2026-12-31',
        eligibilityStatus: BeneficiaryEligibility.UNDER_REVIEW,
        verificationStatus: BeneficiaryVerificationStatus.FAILED,
        riskLevel: RiskLevel.HIGH,
        totalAttendanceSessions: 25,
        verifiedAttendanceSessions: 14,
        activeAnomaliesCount: 2,
      },
      {
        beneficiaryId: 'BEN-2026-PUN-004',
        name: 'Vikash M. Patil',
        dateOfBirth: '2004-11-03',
        age: 22,
        guardianName: 'Madhukar Patil',
        gender: 'MALE',
        category: 'OBC',
        address: 'Chinchwad Station Rd, Near Post Office, Pune',
        district: 'Pune',
        state: 'Maharashtra',
        maskedPhone: '97******88',
        phoneHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        organizationId: orgs[0]._id,
        projectId: projects[0]._id,
        unitId: 'unit_st_jude',
        scheme: 'DDU-GKY Rural Livelihoods Scheme',
        enrollmentStartDate: '2025-08-01',
        enrollmentEndDate: '2026-12-31',
        eligibilityStatus: BeneficiaryEligibility.UNDER_REVIEW,
        verificationStatus: BeneficiaryVerificationStatus.FAILED,
        riskLevel: RiskLevel.HIGH,
        totalAttendanceSessions: 20,
        verifiedAttendanceSessions: 10,
        activeAnomaliesCount: 2,
      },
      {
        beneficiaryId: 'BEN-2026-PUN-005',
        name: 'Sneha Ramesh Gaikwad',
        dateOfBirth: '2005-09-14',
        age: 21,
        guardianName: 'Ramesh Gaikwad',
        gender: 'FEMALE',
        category: 'SC',
        address: 'Wakad Bridge Chowk, Pune',
        district: 'Pune',
        state: 'Maharashtra',
        maskedPhone: '98******33',
        phoneHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        organizationId: orgs[0]._id,
        projectId: projects[0]._id,
        unitId: 'unit_st_jude',
        scheme: 'DDU-GKY Rural Livelihoods Scheme',
        enrollmentStartDate: '2025-06-01',
        enrollmentEndDate: '2026-12-31',
        eligibilityStatus: BeneficiaryEligibility.ELIGIBLE,
        verificationStatus: BeneficiaryVerificationStatus.VERIFIED,
        riskLevel: RiskLevel.LOW,
        totalAttendanceSessions: 44,
        verifiedAttendanceSessions: 42,
        activeAnomaliesCount: 0,
      },
      {
        beneficiaryId: 'BEN-2026-PUN-006',
        name: 'Amit Dinkar Chavan',
        dateOfBirth: '2004-03-22',
        age: 22,
        guardianName: 'Dinkar Chavan',
        gender: 'MALE',
        category: 'OBC',
        address: 'Thergaon Gaonthan, Pune',
        district: 'Pune',
        state: 'Maharashtra',
        maskedPhone: '96******55',
        phoneHash: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
        organizationId: orgs[0]._id,
        projectId: projects[0]._id,
        unitId: 'unit_st_jude',
        scheme: 'DDU-GKY Rural Livelihoods Scheme',
        enrollmentStartDate: '2025-06-15',
        enrollmentEndDate: '2026-12-31',
        eligibilityStatus: BeneficiaryEligibility.ELIGIBLE,
        verificationStatus: BeneficiaryVerificationStatus.VERIFIED,
        riskLevel: RiskLevel.LOW,
        totalAttendanceSessions: 38,
        verifiedAttendanceSessions: 37,
        activeAnomaliesCount: 0,
      },
      {
        beneficiaryId: 'BEN-2026-PUN-007',
        name: 'Kavita Sunil Jadhav',
        dateOfBirth: '2006-01-30',
        age: 20,
        guardianName: 'Sunil Jadhav',
        gender: 'FEMALE',
        category: 'OBC',
        address: 'Dange Chowk, Tathawade, Pune',
        district: 'Pune',
        state: 'Maharashtra',
        maskedPhone: '95******77',
        phoneHash: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
        organizationId: orgs[0]._id,
        projectId: projects[0]._id,
        unitId: 'unit_st_jude',
        scheme: 'DDU-GKY Rural Livelihoods Scheme',
        enrollmentStartDate: '2025-06-01',
        enrollmentEndDate: '2026-12-31',
        eligibilityStatus: BeneficiaryEligibility.ELIGIBLE,
        verificationStatus: BeneficiaryVerificationStatus.VERIFIED,
        riskLevel: RiskLevel.LOW,
        totalAttendanceSessions: 41,
        verifiedAttendanceSessions: 40,
        activeAnomaliesCount: 0,
      },
      {
        beneficiaryId: 'BEN-2026-PUN-008',
        name: 'Pradeep Ashok Waghmare',
        dateOfBirth: '2005-12-11',
        age: 21,
        guardianName: 'Ashok Waghmare',
        gender: 'MALE',
        category: 'SC',
        address: 'Bhosari MIDC Sector 7, Pune',
        district: 'Pune',
        state: 'Maharashtra',
        maskedPhone: '93******99',
        phoneHash: '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
        organizationId: orgs[0]._id,
        projectId: projects[0]._id,
        unitId: 'unit_st_jude',
        scheme: 'DDU-GKY Rural Livelihoods Scheme',
        enrollmentStartDate: '2025-06-01',
        enrollmentEndDate: '2026-12-31',
        eligibilityStatus: BeneficiaryEligibility.ELIGIBLE,
        verificationStatus: BeneficiaryVerificationStatus.VERIFIED,
        riskLevel: RiskLevel.LOW,
        totalAttendanceSessions: 39,
        verifiedAttendanceSessions: 38,
        activeAnomaliesCount: 0,
      },
      {
        beneficiaryId: 'BEN-2026-PUN-009',
        name: 'Rupali Balasaheb More',
        dateOfBirth: '2006-05-08',
        age: 20,
        guardianName: 'Balasaheb More',
        gender: 'FEMALE',
        category: 'EWS',
        address: 'Ravet Pradhikaran, Pune',
        district: 'Pune',
        state: 'Maharashtra',
        maskedPhone: '91******12',
        phoneHash: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
        organizationId: orgs[0]._id,
        projectId: projects[0]._id,
        unitId: 'unit_st_jude',
        scheme: 'DDU-GKY Rural Livelihoods Scheme',
        enrollmentStartDate: '2025-06-01',
        enrollmentEndDate: '2026-12-31',
        eligibilityStatus: BeneficiaryEligibility.ELIGIBLE,
        verificationStatus: BeneficiaryVerificationStatus.VERIFIED,
        riskLevel: RiskLevel.LOW,
        totalAttendanceSessions: 43,
        verifiedAttendanceSessions: 41,
        activeAnomaliesCount: 0,
      },
      {
        beneficiaryId: 'BEN-2026-PUN-010',
        name: 'Sachin Tanaji Salve',
        dateOfBirth: '2005-07-29',
        age: 21,
        guardianName: 'Tanaji Salve',
        gender: 'MALE',
        category: 'SC',
        address: 'Aundh Gaon, Pune',
        district: 'Pune',
        state: 'Maharashtra',
        maskedPhone: '92******66',
        phoneHash: '6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a',
        organizationId: orgs[0]._id,
        projectId: projects[0]._id,
        unitId: 'unit_st_jude',
        scheme: 'DDU-GKY Rural Livelihoods Scheme',
        enrollmentStartDate: '2025-06-01',
        enrollmentEndDate: '2026-12-31',
        eligibilityStatus: BeneficiaryEligibility.ELIGIBLE,
        verificationStatus: BeneficiaryVerificationStatus.VERIFIED,
        riskLevel: RiskLevel.LOW,
        totalAttendanceSessions: 40,
        verifiedAttendanceSessions: 39,
        activeAnomaliesCount: 0,
      },
      {
        beneficiaryId: 'BEN-2026-DEL-015',
        name: 'Anjali Meena',
        dateOfBirth: '2003-02-14',
        age: 23,
        guardianName: 'Ramkishan Meena',
        gender: 'FEMALE',
        category: 'ST',
        address: 'Rohini Sector 16, New Delhi',
        district: 'New Delhi',
        state: 'Delhi',
        maskedPhone: '99******10',
        phoneHash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        organizationId: orgs[1]?._id || orgs[0]._id,
        projectId: projects[1]?._id || projects[0]._id,
        unitId: 'unit_pragati',
        scheme: 'PM-DAKSH Skilling Initiative',
        enrollmentStartDate: '2024-04-01',
        enrollmentEndDate: '2025-03-31',
        eligibilityStatus: BeneficiaryEligibility.INELIGIBLE,
        verificationStatus: BeneficiaryVerificationStatus.VERIFIED,
        riskLevel: RiskLevel.HIGH,
        totalAttendanceSessions: 80,
        verifiedAttendanceSessions: 78,
        activeAnomaliesCount: 1,
      },
    ];

    await Beneficiary.insertMany(sampleBeneficiaries);
    logger.info(`Seeded ${sampleBeneficiaries.length} beneficiary master records.`);

    // 4. Seed Financial Records with Invoices (Including Demo Scenario 3: Burn Mismatch)
    await FinancialRecord.deleteMany({});
    const sampleFinancials = [
      // Demo Scenario 3: High Risk (82% financial burn vs 43% physical progress)
      {
        projectId: projects[0]._id,
        organizationId: orgs[0]._id,
        financialYear: '2025-2026',
        totalSanctionedGrant: 2500000,
        totalDisbursedFunds: 2000000,
        totalExpenditure: 1640000, // 82% burn
        openingBalance: 0,
        closingBalance: 360000,
        verifiedPhysicalProgressPercent: 43, // 43% vs 82%
        financialBurnPercent: 82,
        riskScore: 78,
        anomaliesDetected: [
          'RULE_21_SPENDING_VS_PROJECT_PROGRESS: 82% funds burned against 43% verified milestone completion.',
          'RULE_19_SPENDING_NEAR_DEADLINES: 65% of Q4 expenditure clustered in final 10 days before fiscal closing.',
        ],
        budgetHeads: [
          { name: 'Training Stipends & Allowances', sanctionedAmount: 1000000, utilizedAmount: 920000, headLimit: 1000000 },
          { name: 'Infrastructure & Labs', sanctionedAmount: 800000, utilizedAmount: 420000, headLimit: 800000 },
          { name: 'Course Materials & Consumables', sanctionedAmount: 400000, utilizedAmount: 210000, headLimit: 400000 },
          { name: 'Administrative Overhead', sanctionedAmount: 300000, utilizedAmount: 90000, headLimit: 300000 },
        ],
        invoices: [
          {
            id: 'INV-2026-001',
            invoiceNumber: 'DEL-VEND-8821',
            vendorName: 'Apex Educational Supplies Pvt Ltd',
            vendorGstin: '27AABCA1234F1Z5',
            amount: 420000,
            date: '2026-03-24',
            description: 'Advance supply of computer equipment and networking racks',
            category: 'CAPITAL_ASSETS',
            documentHash: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
            isFlagged: true,
            flagReason: 'Invoice claimed without on-site installation inspection verification.',
          },
          {
            id: 'INV-2026-002',
            invoiceNumber: 'DEL-VEND-8822',
            vendorName: 'Apex Educational Supplies Pvt Ltd',
            vendorGstin: '27AABCA1234F1Z5',
            amount: 380000,
            date: '2026-03-25',
            description: 'Software licenses and lab simulation packages',
            category: 'CONSUMABLES',
            documentHash: 'b2c3d4e5f6a17890abcdef1234567890abcdef1234567890abcdef1234567890',
            isFlagged: true,
            flagReason: 'Consecutive invoice issued on following day splitting procurement ceiling.',
          },
        ],
      },
      // Compliant Financial Record
      {
        projectId: projects[1]?._id || projects[0]._id,
        organizationId: orgs[1]?._id || orgs[0]._id,
        financialYear: '2025-2026',
        totalSanctionedGrant: 1800000,
        totalDisbursedFunds: 1200000,
        totalExpenditure: 740000,
        openingBalance: 0,
        closingBalance: 460000,
        verifiedPhysicalProgressPercent: 62,
        financialBurnPercent: 61.6,
        riskScore: 18,
        anomaliesDetected: [],
        budgetHeads: [
          { name: 'Beneficiary Food & Lodging', sanctionedAmount: 900000, utilizedAmount: 420000, headLimit: 900000 },
          { name: 'Vocational Tools & Kits', sanctionedAmount: 600000, utilizedAmount: 240000, headLimit: 600000 },
          { name: 'Admin Operations', sanctionedAmount: 300000, utilizedAmount: 80000, headLimit: 300000 },
        ],
        invoices: [
          {
            id: 'INV-2026-003',
            invoiceNumber: 'MAH-CAT-412',
            vendorName: 'Sahyadri Caterers & Provisions',
            vendorGstin: '27AAACP9988D1Z8',
            amount: 140000,
            date: '2026-02-15',
            description: 'Monthly mess supplies for 35 hostellers',
            category: 'FOOD_AND_NUTRITION',
            documentHash: 'c3d4e5f6a1b27890abcdef1234567890abcdef1234567890abcdef1234567890',
            isFlagged: false,
          },
        ],
      },
    ];

    await FinancialRecord.insertMany(sampleFinancials);
    logger.info(`Seeded ${sampleFinancials.length} financial intelligence records.`);

    // 5. Seed Corrective Actions
    const alerts = await AnomalyAlert.find({}).limit(3);
    await CorrectiveAction.deleteMany({});

    const sampleActions = [
      {
        actionNumber: 'CA-2026-001',
        title: 'Reconcile Rollcall Verification Deficit & Ghost Beneficiary Burst',
        description: 'Hostel attendance face ratio dropped to 52% on 3 consecutive days. Unit supervisor must submit physical rollcall register and biometric audit.',
        responsibleAuthority: 'National Skill Training Institute Pune (Project Director)',
        organizationId: orgs[0]._id,
        projectId: projects[0]._id,
        anomalyId: alerts[0]?._id,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        priority: CorrectiveActionPriority.HIGH,
        status: CorrectiveActionStatus.IN_PROGRESS,
        evidenceRequired: 'Signed physical attendance logbook scan + geo-tagged date-stamped classroom verification video.',
        officerRemarks: 'Priority DoSJE oversight mission triggered. Field inspection scheduled.',
      },
      {
        actionNumber: 'CA-2026-002',
        title: 'Financial Progress Verification for Disproportionate Advance Claims',
        description: '82% of sanctioned grant utilized against only 43% verified physical milestone completion. Institution must submit work-order completion certificates.',
        responsibleAuthority: 'National Skill Training Institute Pune (Finance Controller)',
        organizationId: orgs[0]._id,
        projectId: projects[0]._id,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        priority: CorrectiveActionPriority.CRITICAL,
        status: CorrectiveActionStatus.OPEN,
        evidenceRequired: 'Chartered Accountant utilization certificate + on-site equipment asset geo-tagged photos.',
      },
      {
        actionNumber: 'CA-2026-003',
        title: 'Clarify CCTV Camera Downtime on Main Gate Feed',
        description: 'Perimeter CCTV Camera CAM-PUN-02 experienced 48 hours continuous downtime during active training hours.',
        responsibleAuthority: 'Security Agency Incharge & Center Head',
        organizationId: orgs[0]._id,
        projectId: projects[0]._id,
        deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Overdue
        priority: CorrectiveActionPriority.MEDIUM,
        status: CorrectiveActionStatus.OVERDUE,
        evidenceRequired: 'ISP uptime diagnostic logs + electrical technician repair receipt.',
      },
    ];

    await CorrectiveAction.insertMany(sampleActions);
    logger.info(`Seeded ${sampleActions.length} corrective action records.`);

    // 6. Seed Virtual Video Conference (VC) Session (Integration Ready)
    await VCSession.deleteMany({});
    const sampleVCSession = [
      {
        sessionCode: 'VC-SURPRISE-2026-091',
        organizationId: orgs[0]._id,
        projectId: projects[0]._id,
        initiatedByOfficerId: (await User.findOne({ role: UserRole.DEPARTMENT_OFFICIAL }))?._id || (await User.findOne({ role: UserRole.SUPER_ADMIN }))?._id,
        projectInchargeName: 'Naveen Kulkarni',
        inchargePhone: '+91-9822990011',
        status: VCSessionStatus.COMPLETED,
        isSurprise: true,
        scheduledTime: new Date(Date.now() - 3 * 3600 * 1000),
        connectedTime: new Date(Date.now() - 3 * 3600 * 1000 + 300000),
        endedTime: new Date(Date.now() - 3 * 3600 * 1000 + 1500000),
        reportedStaffCount: 6,
        verifiedStaffCount: 5,
        reportedBeneficiaryCount: 30,
        verifiedBeneficiaryCount: 22,
        observations: [
          { question: 'Are all registered boarding students present in the main hall?', response: '22 students present in person; 8 stated to be on field training.', isSatisfactory: false },
          { question: 'Is the mess operational and catering meals according to weekly roster?', response: 'Yes, mess pantry inspected on camera; stock registers maintained.', isSatisfactory: true },
          { question: 'Show digital attendance tablet device on live camera feed.', response: 'Staff displayed device with current rollcall timestamp.', isSatisfactory: true },
        ],
        notes: 'Discrepancy noted: 8 missing students without prior absence excuses logged in the portal. Flagged for spot physical inspection.',
        anomalyFlagged: true,
        isIntegrationReady: true,
      },
    ];

    await VCSession.insertMany(sampleVCSession);
    logger.info(`Seeded ${sampleVCSession.length} video conference surveillance spot-checks.`);
  }

  logger.info('Nirikshan Data Model Extensions Seeding completed successfully!');
}

if (require.main === module) {
  connectDatabase()
    .then(() => seedExtensions())
    .then(() => disconnectDatabase())
    .catch((err) => {
      logger.error('Failed to run seed extensions:', err);
      process.exit(1);
    });
}
