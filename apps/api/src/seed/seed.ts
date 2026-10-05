import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/user.model';
import { RefreshToken } from '../models/refreshToken.model';
import { AuditLog } from '../models/auditLog.model';
import { Organization } from '../models/organization.model';
import { Project } from '../models/project.model';
import { ChecklistTemplate } from '../models/checklistTemplate.model';
import { Inspection } from '../models/inspection.model';
import { CctvCamera } from '../models/cctvCamera.model';
import { AnomalyAlert } from '../models/anomalyAlert.model';
import { Evidence } from '../models/evidence.model';
import {
  UserRole,
  UserStatus,
  AuditAction,
  OrganizationType,
  ProjectStatus,
  RiskLevel,
  InspectionType,
  InspectionPriority,
  InspectionStatus,
  CameraStatus,
  StreamProtocol,
  AnomalyType,
  AnomalySeverity,
  AlertStatus,
  EvidenceType,
} from '@nirikshan/shared-types';
import { logger } from '../utils/logger';

const SEED_USERS = [
  // 1. Super Admin
  {
    name: 'National System Super Admin',
    email: 'superadmin@nirikshan.gov.in',
    password: 'Password@123',
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    phoneNumber: '+91-9876543210',
    state: 'National HQ',
    district: 'New Delhi',
  },
  // 2. Department Officials
  {
    name: 'Dr. Rajesh Verma (Joint Secretary)',
    email: 'dept.official1@nirikshan.gov.in',
    password: 'Password@123',
    role: UserRole.DEPARTMENT_OFFICIAL,
    status: UserStatus.ACTIVE,
    phoneNumber: '+91-9876543211',
    state: 'Maharashtra',
    district: 'Mumbai',
  },
  {
    name: 'Smt. Ananya Rao (Director Inspections)',
    email: 'dept.official2@nirikshan.gov.in',
    password: 'Password@123',
    role: UserRole.DEPARTMENT_OFFICIAL,
    status: UserStatus.ACTIVE,
    phoneNumber: '+91-9876543212',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
  },
  // 3. PMU Officer
  {
    name: 'Vikramaditya Sengupta (PMU Lead)',
    email: 'pmu.officer@nirikshan.gov.in',
    password: 'Password@123',
    role: UserRole.PMU_OFFICER,
    status: UserStatus.ACTIVE,
    phoneNumber: '+91-9876543213',
    state: 'National HQ',
    district: 'New Delhi',
  },
  // 4. Inspectors
  {
    name: 'Amitabh Sharma (Field Inspector)',
    email: 'inspector1@nirikshan.gov.in',
    password: 'Password@123',
    role: UserRole.INSPECTOR,
    status: UserStatus.ACTIVE,
    phoneNumber: '+91-9876543220',
    state: 'Maharashtra',
    district: 'Pune',
  },
  {
    name: 'Priya Deshmukh (Field Inspector)',
    email: 'inspector2@nirikshan.gov.in',
    password: 'Password@123',
    role: UserRole.INSPECTOR,
    status: UserStatus.ACTIVE,
    phoneNumber: '+91-9876543221',
    state: 'Maharashtra',
    district: 'Mumbai Suburban',
  },
  {
    name: 'Kiran Kumar (Field Inspector)',
    email: 'inspector3@nirikshan.gov.in',
    password: 'Password@123',
    role: UserRole.INSPECTOR,
    status: UserStatus.ACTIVE,
    phoneNumber: '+91-9876543222',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
  },
  {
    name: 'Mohd. Tariq (Field Inspector)',
    email: 'inspector4@nirikshan.gov.in',
    password: 'Password@123',
    role: UserRole.INSPECTOR,
    status: UserStatus.ACTIVE,
    phoneNumber: '+91-9876543223',
    state: 'Delhi',
    district: 'New Delhi',
  },
  {
    name: 'Sunita Patel (Field Inspector)',
    email: 'inspector5@nirikshan.gov.in',
    password: 'Password@123',
    role: UserRole.INSPECTOR,
    status: UserStatus.ACTIVE,
    phoneNumber: '+91-9876543224',
    state: 'Gujarat',
    district: 'Ahmedabad',
  },
  // 5. State & District Authorities
  {
    name: 'State Monitoring Commissioner (MH)',
    email: 'state.auth@nirikshan.gov.in',
    password: 'Password@123',
    role: UserRole.STATE_AUTHORITY,
    status: UserStatus.ACTIVE,
    phoneNumber: '+91-9876543230',
    state: 'Maharashtra',
    district: 'Mumbai',
  },
  {
    name: 'District Collectorate Monitoring Unit (Pune)',
    email: 'district.pune@nirikshan.gov.in',
    password: 'Password@123',
    role: UserRole.DISTRICT_AUTHORITY,
    status: UserStatus.ACTIVE,
    phoneNumber: '+91-9876543231',
    state: 'Maharashtra',
    district: 'Pune',
  },
  // 6. Institute Admins
  {
    name: 'Principal K. N. Hegde (National Skill Institute Pune)',
    email: 'institute.admin1@nirikshan.gov.in',
    password: 'Password@123',
    role: UserRole.INSTITUTE_ADMIN,
    status: UserStatus.ACTIVE,
    phoneNumber: '+91-9876543240',
    state: 'Maharashtra',
    district: 'Pune',
  },
  {
    name: 'Director S. Ramanathan (Bengaluru Advanced Vocational Center)',
    email: 'institute.admin2@nirikshan.gov.in',
    password: 'Password@123',
    role: UserRole.INSTITUTE_ADMIN,
    status: UserStatus.ACTIVE,
    phoneNumber: '+91-9876543241',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
  },
];

const SEED_ORGANIZATIONS = [
  {
    name: 'Ministry of Skill Development & Entrepreneurship',
    code: 'MSDE-HQ',
    type: OrganizationType.GOVERNMENT_MINISTRY,
    state: 'Delhi',
    district: 'New Delhi',
    address: 'Ministry HQ Complex, Rafi Marg, New Delhi',
    contactEmail: 'contact@msde.gov.in',
    contactPhone: '+91-11-23456789',
  },
  {
    name: 'Maharashtra State Skill Development Society',
    code: 'MSSDS-MH',
    type: OrganizationType.STATE_DEPARTMENT,
    state: 'Maharashtra',
    district: 'Mumbai',
    address: 'World Trade Centre, Cuffe Parade, Mumbai',
    contactEmail: 'info@mssds.gov.in',
    contactPhone: '+91-22-22876543',
  },
  {
    name: 'Karnataka Skill Development Corporation',
    code: 'KSDC-KA',
    type: OrganizationType.STATE_DEPARTMENT,
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    address: 'Skills Development Directorate, Dairy Circle, Bannerghatta Road, Bengaluru',
    contactEmail: 'support@ksdc.gov.in',
    contactPhone: '+91-80-26543210',
  },
  {
    name: 'Gujarat Rural Development Mission',
    code: 'GRDM-GJ',
    type: OrganizationType.STATE_DEPARTMENT,
    state: 'Gujarat',
    district: 'Gandhinagar',
    address: 'Block No 14, State Secretariat Complex, Gandhinagar',
    contactEmail: 'director@grdm.gujarat.gov.in',
    contactPhone: '+91-79-23250000',
  },
  {
    name: 'National Skill Training Institute Pune',
    code: 'NSTI-PUN',
    type: OrganizationType.INSTITUTE,
    state: 'Maharashtra',
    district: 'Pune',
    address: 'Aundh Camp, Pune, Maharashtra 411027',
    contactEmail: 'nsti.pune@nirikshan.gov.in',
    contactPhone: '+91-20-25881234',
  },
  {
    name: 'Bengaluru Advanced Vocational Center',
    code: 'BAVC-BLR',
    type: OrganizationType.INSTITUTE,
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    address: 'Hosur Road, Electronics City Phase 1, Bengaluru 560100',
    contactEmail: 'bavc.blr@nirikshan.gov.in',
    contactPhone: '+91-80-41234567',
  },
  {
    name: 'Rural Development Welfare Foundation',
    code: 'GVSF-NGO',
    type: OrganizationType.NGO,
    state: 'Maharashtra',
    district: 'Pune',
    address: 'Baramati Rural Center, Pune District 413102',
    contactEmail: 'contact@rdwf-india.org',
    contactPhone: '+91-9422001122',
  },
  {
    name: 'Youth Vocational Skills Empower Trust',
    code: 'YKET-NGO',
    type: OrganizationType.NGO,
    state: 'Gujarat',
    district: 'Ahmedabad',
    address: 'Navrangpura Community Hall Complex, Ahmedabad 380009',
    contactEmail: 'empower@youthskills.org',
    contactPhone: '+91-79-26567890',
  },
  {
    name: 'District Welfare & Development Agency Pune',
    code: 'DWDA-PUN',
    type: OrganizationType.DISTRICT_OFFICE,
    state: 'Maharashtra',
    district: 'Pune',
    address: 'Collectorate Campus, Station Road, Pune 411001',
    contactEmail: 'welfare.pune@maharashtra.gov.in',
    contactPhone: '+91-20-26123456',
  },
  {
    name: 'Apex Beneficiary Welfare Consortium',
    code: 'ABWC-BEN',
    type: OrganizationType.BENEFICIARY_ENTITY,
    state: 'Delhi',
    district: 'South Delhi',
    address: 'Saket Institutional Area, New Delhi 110017',
    contactEmail: 'apex.beneficiary@abwc.org',
    contactPhone: '+91-11-45678901',
  },
];

const SEED_PROJECTS_DATA = [
  // 1. Pune Projects (Center: [73.8567, 18.5204])
  {
    name: 'National Multi-Skill Training Center Aundh',
    code: 'PRJ-PUN-001',
    scheme: 'National Skill Development Program 4.0 (PMKVY)',
    description: 'High-tech CNC, IoT, and solar panel technician certification center.',
    address: 'NSTI Campus, Aundh, Pune, Maharashtra 411027',
    district: 'Pune',
    state: 'Maharashtra',
    location: { type: 'Point' as const, coordinates: [73.8058, 18.5626] },
    geofenceRadiusMeters: 250,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.LOW,
    riskScore: 12,
    contactName: 'Prof. Anil Deshmukh',
    contactEmail: 'anil.deshmukh@nsti.ac.in',
    contactPhone: '+91-9822114455',
  },
  {
    name: 'Clean Water Solar Pumping Station Baramati',
    code: 'PRJ-PUN-002',
    scheme: 'National Rural Drinking Water Mission (JJM)',
    description: 'Solar-powered community water filtration and automated distribution network.',
    address: 'Village Malegaon, Baramati Taluka, Pune 413115',
    district: 'Pune',
    state: 'Maharashtra',
    location: { type: 'Point' as const, coordinates: [74.5786, 18.1518] },
    geofenceRadiusMeters: 300,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.HIGH,
    riskScore: 78,
    contactName: 'Er. Suhas Shinde',
    contactEmail: 'suhas.shinde@jaljeevan.gov.in',
    contactPhone: '+91-9822336677',
  },
  {
    name: 'Smart Child Care & Early Childhood Center Hadapsar',
    code: 'PRJ-PUN-003',
    scheme: 'National Nutrition & Early Child Care Program',
    description: 'Digital biometric attendance, nutrition monitoring, and e-learning facilities for mothers & infants.',
    address: 'Magarpatta Road, Hadapsar, Pune 411028',
    district: 'Pune',
    state: 'Maharashtra',
    location: { type: 'Point' as const, coordinates: [73.9272, 18.5089] },
    geofenceRadiusMeters: 150,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.MEDIUM,
    riskScore: 45,
    contactName: 'Sunita Gaikwad',
    contactEmail: 'sunita.gaikwad@childcare.org',
    contactPhone: '+91-9822557788',
  },
  {
    name: 'Rural Healthcare Center Modernization Khed',
    code: 'PRJ-PUN-004',
    scheme: 'National Health Mission (NHM)',
    description: 'Primary Health Center upgrade with solar cold chain for vaccine preservation.',
    address: 'Rajgurunagar, Khed Taluka, Pune District 410505',
    district: 'Pune',
    state: 'Maharashtra',
    location: { type: 'Point' as const, coordinates: [73.9142, 18.8542] },
    geofenceRadiusMeters: 200,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.LOW,
    riskScore: 18,
    contactName: 'Dr. Mahesh Bhosale',
    contactEmail: 'dr.bhosale@nhm.gov.in',
    contactPhone: '+91-9822778899',
  },
  {
    name: 'National Rural Youth Skill Training Center Hinjawadi',
    code: 'PRJ-PUN-005',
    scheme: 'National Rural Youth Livelihoods Scheme (DDU-GKY)',
    description: 'Residential vocational training center for rural youth.',
    address: 'Phase 3, Hinjawadi Infotech Park, Pune 411057',
    district: 'Pune',
    state: 'Maharashtra',
    location: { type: 'Point' as const, coordinates: [73.6922, 18.5912] },
    geofenceRadiusMeters: 250,
    status: ProjectStatus.FLAGGED,
    riskLevel: RiskLevel.CRITICAL,
    riskScore: 92,
    contactName: 'Naveen Kulkarni',
    contactEmail: 'naveen.k@ddugky-center.org',
    contactPhone: '+91-9822990011',
  },

  // 2. Mumbai Projects (Center: [72.8777, 19.0760])
  {
    name: 'Urban Healthcare Sub-Center Dharavi',
    code: 'PRJ-MUM-001',
    scheme: 'National Health & Wellness Center Network',
    description: 'Dense urban community diagnostic and telemedicine hub.',
    address: '90 Feet Road, Dharavi, Mumbai 400017',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    location: { type: 'Point' as const, coordinates: [72.8552, 19.0434] },
    geofenceRadiusMeters: 120,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.HIGH,
    riskScore: 72,
    contactName: 'Dr. Fatima Sheikh',
    contactEmail: 'fatima.sheikh@ayushman.gov.in',
    contactPhone: '+91-9820112233',
  },
  {
    name: 'National Urban Housing Project Chembur',
    code: 'PRJ-MUM-002',
    scheme: 'National Urban Housing Scheme (PMAY-Urban)',
    description: 'Construction quality and beneficiary allotment verification site.',
    address: 'Vashi Naka, Chembur East, Mumbai 400074',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    location: { type: 'Point' as const, coordinates: [72.9023, 19.0345] },
    geofenceRadiusMeters: 400,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.MEDIUM,
    riskScore: 40,
    contactName: 'Er. R. K. Sawant',
    contactEmail: 'rk.sawant@pmay.gov.in',
    contactPhone: '+91-9820334455',
  },
  {
    name: 'Industrial Training Institute (ITI) Kurla Tech Hub',
    code: 'PRJ-MUM-003',
    scheme: 'Skill Strengthening for Industrial Value (STRIVE)',
    description: 'Electric vehicle mechanic and precision machining workshop modernization.',
    address: 'Near Kurla Railway Station, Kurla West, Mumbai 400070',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    location: { type: 'Point' as const, coordinates: [72.8821, 19.0682] },
    geofenceRadiusMeters: 200,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.LOW,
    riskScore: 15,
    contactName: 'Principal S. B. More',
    contactEmail: 'principal@kurla-iti.ac.in',
    contactPhone: '+91-9820556677',
  },

  // 3. Bengaluru Projects (Center: [77.5946, 12.9716])
  {
    name: 'Advanced Robotics & Automation Lab Electronics City',
    code: 'PRJ-BLR-001',
    scheme: 'National Skill Development Program 4.0 (PMKVY)',
    description: 'State of the art semiconductor and robotics technician certification facility.',
    address: 'Hosur Road, Electronics City Phase 1, Bengaluru 560100',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    location: { type: 'Point' as const, coordinates: [77.6744, 12.8452] },
    geofenceRadiusMeters: 300,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.LOW,
    riskScore: 10,
    contactName: 'Dr. Harish Gowda',
    contactEmail: 'harish.gowda@bavc.ac.in',
    contactPhone: '+91-9845112233',
  },
  {
    name: 'National Drinking Water Overhead Reservoir Anekal',
    code: 'PRJ-BLR-002',
    scheme: 'National Rural Drinking Water Mission (JJM)',
    description: '500,000-liter overhead storage tank with SCADA flow telemetry.',
    address: 'Chandapura Main Road, Anekal Taluk, Bengaluru 562106',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    location: { type: 'Point' as const, coordinates: [77.7012, 12.7125] },
    geofenceRadiusMeters: 200,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.HIGH,
    riskScore: 82,
    contactName: 'Er. Ramesh Kumar N.',
    contactEmail: 'ramesh.kumar@karnataka.gov.in',
    contactPhone: '+91-9845334455',
  },
  {
    name: 'Smart Model School Peenya Industrial Suburb',
    code: 'PRJ-BLR-003',
    scheme: 'National Model Schools for Quality Education (PM-SHRI)',
    description: 'Solar-powered campus with integrated STEM laboratory and smart board classrooms.',
    address: 'Peenya 2nd Stage, Tumkur Road, Bengaluru 560058',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    location: { type: 'Point' as const, coordinates: [77.5214, 13.0298] },
    geofenceRadiusMeters: 200,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.MEDIUM,
    riskScore: 38,
    contactName: 'Smt. Lakshmi Balaji',
    contactEmail: 'lakshmi.b@pmshri.gov.in',
    contactPhone: '+91-9845556677',
  },
  {
    name: 'Green Energy Solar Microgrid Devanahalli',
    code: 'PRJ-BLR-004',
    scheme: 'Solar Agricultural Feeder & Pump Scheme (PM-KUSUM)',
    description: 'Agricultural solar feeder grid powering 120 rural pump sets.',
    address: 'Devanahalli Rural Perimeter, Bengaluru 562110',
    district: 'Bengaluru Rural',
    state: 'Karnataka',
    location: { type: 'Point' as const, coordinates: [77.7214, 13.2458] },
    geofenceRadiusMeters: 500,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.LOW,
    riskScore: 22,
    contactName: 'Er. Gurumurthy',
    contactEmail: 'gurumurthy@bescom.org',
    contactPhone: '+91-9845778899',
  },

  // 4. Delhi Projects (Center: [77.2090, 28.6139])
  {
    name: 'AI & Data Analytics Center of Excellence Okhla',
    code: 'PRJ-DEL-001',
    scheme: 'National Apprenticeship Promotion Scheme (NAPS)',
    description: 'National training facility for artificial intelligence and cloud computing.',
    address: 'Okhla Industrial Area Phase 3, New Delhi 110020',
    district: 'South Delhi',
    state: 'Delhi',
    location: { type: 'Point' as const, coordinates: [77.2712, 28.5355] },
    geofenceRadiusMeters: 250,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.LOW,
    riskScore: 8,
    contactName: 'Dr. Vivek Mittal',
    contactEmail: 'vivek.mittal@msde.gov.in',
    contactPhone: '+91-9810112233',
  },
  {
    name: 'District Polyclinic & Wellness Center Dwarka',
    code: 'PRJ-DEL-002',
    scheme: 'National Digital Health Mission (ABDM)',
    description: 'Comprehensive digital healthcare center with electronic health records integration.',
    address: 'Sector 9, Dwarka, New Delhi 110077',
    district: 'South West Delhi',
    state: 'Delhi',
    location: { type: 'Point' as const, coordinates: [77.0652, 28.5742] },
    geofenceRadiusMeters: 200,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.MEDIUM,
    riskScore: 50,
    contactName: 'Dr. Meena Saxena',
    contactEmail: 'dr.meena@delhihealth.gov.in',
    contactPhone: '+91-9810334455',
  },
  {
    name: 'Waste-to-Energy Processing Facility Ghazipur',
    code: 'PRJ-DEL-003',
    scheme: 'National Clean Cities Mission (Urban 2.0)',
    description: 'Biomethanation and refuse-derived fuel electricity generation facility.',
    address: 'Ghazipur Border, East Delhi 110096',
    district: 'East Delhi',
    state: 'Delhi',
    location: { type: 'Point' as const, coordinates: [77.3298, 28.6245] },
    geofenceRadiusMeters: 500,
    status: ProjectStatus.FLAGGED,
    riskLevel: RiskLevel.CRITICAL,
    riskScore: 88,
    contactName: 'Sanjay Aggarwal',
    contactEmail: 'sanjay.a@mcd.gov.in',
    contactPhone: '+91-9810556677',
  },

  // 5. Gujarat Projects (Center: [72.5714, 23.0225])
  {
    name: 'Textile & Apparel Design Center Ahmedabad',
    code: 'PRJ-GUJ-001',
    scheme: 'Textile Sector Capacity Building Scheme (SAMARTH)',
    description: 'Automated computerized jacquard weaving and industrial apparel fabrication training.',
    address: 'Naroda Industrial Estate, Ahmedabad 382330',
    district: 'Ahmedabad',
    state: 'Gujarat',
    location: { type: 'Point' as const, coordinates: [72.6582, 23.0674] },
    geofenceRadiusMeters: 300,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.LOW,
    riskScore: 14,
    contactName: 'Bhavin Shah',
    contactEmail: 'bhavin.shah@samarth.gov.in',
    contactPhone: '+91-9898112233',
  },
  {
    name: 'Micro-Irrigation Canal Monitoring Hub Sanand',
    code: 'PRJ-GUJ-002',
    scheme: 'National Agricultural Irrigation Mission (PMKSY)',
    description: 'Automated sluice gate monitoring and drip irrigation pressure balancing station.',
    address: 'Sanand Industrial Corridor, Gujarat 382110',
    district: 'Ahmedabad',
    state: 'Gujarat',
    location: { type: 'Point' as const, coordinates: [72.3789, 22.9862] },
    geofenceRadiusMeters: 350,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.MEDIUM,
    riskScore: 42,
    contactName: 'Er. Jayesh Patel',
    contactEmail: 'jayesh.patel@gujarat.gov.in',
    contactPhone: '+91-9898334455',
  },
  {
    name: 'Solar Rooftop Institute Campus Gandhinagar',
    code: 'PRJ-GUJ-003',
    scheme: 'National Rooftop Solar & Renewable Energy Initiative',
    description: '250 kWp rooftop solar grid interactive plant across university buildings.',
    address: 'Sector 28, GIDC Industrial Estate, Gandhinagar 382028',
    district: 'Gandhinagar',
    state: 'Gujarat',
    location: { type: 'Point' as const, coordinates: [72.6369, 23.2384] },
    geofenceRadiusMeters: 250,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.LOW,
    riskScore: 9,
    contactName: 'Prof. Manish Vora',
    contactEmail: 'manish.vora@geda.gov.in',
    contactPhone: '+91-9898556677',
  },
  {
    name: 'Rural Dairy Cooperative Chilling Center Mehsana',
    code: 'PRJ-GUJ-004',
    scheme: 'National Dairy Development Plan (NDDP)',
    description: '20,000-liter bulk milk cooling center with digital quality testing kiosks.',
    address: 'Kadi Road, Mehsana District, Gujarat 384002',
    district: 'Mehsana',
    state: 'Gujarat',
    location: { type: 'Point' as const, coordinates: [72.3912, 23.5978] },
    geofenceRadiusMeters: 200,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.MEDIUM,
    riskScore: 35,
    contactName: 'Hardik Chaudhary',
    contactEmail: 'hardik.c@dairymission.org',
    contactPhone: '+91-9898778899',
  },
  {
    name: 'Coastal Fish Landing Center & Cold Storage Veraval',
    code: 'PRJ-GUJ-005',
    scheme: 'National Fisheries Development Scheme (PMMSY)',
    description: 'Modernized hygienic fish landing harbor with blast freezers and solar ice plants.',
    address: 'Veraval Port Road, Gir Somnath District 362265',
    district: 'Gir Somnath',
    state: 'Gujarat',
    location: { type: 'Point' as const, coordinates: [70.3682, 20.9042] },
    geofenceRadiusMeters: 500,
    status: ProjectStatus.ACTIVE,
    riskLevel: RiskLevel.HIGH,
    riskScore: 75,
    contactName: 'Cdr. K. P. Joshi',
    contactEmail: 'kp.joshi@fisheries.gov.in',
    contactPhone: '+91-9898990011',
  },
];

export async function seedData(): Promise<void> {
  try {
    logger.info('Purging old database records...');
    await User.deleteMany({});
    await RefreshToken.deleteMany({});
    await Organization.deleteMany({});
    await Project.deleteMany({});
    await ChecklistTemplate.deleteMany({});
    await Inspection.deleteMany({});
    await CctvCamera.deleteMany({});
    await AnomalyAlert.deleteMany({});
    await Evidence.deleteMany({});

    // 1. Seed Organizations
    logger.info(`Seeding ${SEED_ORGANIZATIONS.length} Organizations & Institutes...`);
    const createdOrgs: Record<string, any> = {};
    for (const orgData of SEED_ORGANIZATIONS) {
      const org = await Organization.create(orgData);
      createdOrgs[org.code] = org._id;
      logger.info(` -> Seeded Organization [${org.type}] ${org.name} (${org.code})`);
    }

    // 2. Seed Users
    logger.info(`Seeding ${SEED_USERS.length} Demo Users across all roles...`);
    for (const userData of SEED_USERS) {
      let organizationId = undefined;
      if (userData.role === UserRole.INSTITUTE_ADMIN) {
        organizationId = createdOrgs['NSTI-PUN'] || createdOrgs['BAVC-BLR'];
      } else if (userData.role === UserRole.DEPARTMENT_OFFICIAL) {
        organizationId = createdOrgs['MSSDS-MH'] || createdOrgs['KSDC-KA'];
      }

      await User.create({
        ...userData,
        organizationId,
      });
      logger.info(` -> Seeded User [${userData.role}] ${userData.email}`);
    }

    // 3. Seed Projects
    logger.info(`Seeding ${SEED_PROJECTS_DATA.length} GeoJSON Monitored Projects...`);
    for (let i = 0; i < SEED_PROJECTS_DATA.length; i++) {
      const projData = SEED_PROJECTS_DATA[i];
      // Assign appropriate organization based on state/type
      let orgId = createdOrgs['MSDE-HQ'];
      if (projData.state === 'Maharashtra') {
        orgId = i % 2 === 0 ? createdOrgs['NSTI-PUN'] : createdOrgs['MSSDS-MH'];
      } else if (projData.state === 'Karnataka') {
        orgId = i % 2 === 0 ? createdOrgs['BAVC-BLR'] : createdOrgs['KSDC-KA'];
      } else if (projData.state === 'Gujarat') {
        orgId = createdOrgs['GRDM-GJ'] || createdOrgs['YKET-NGO'];
      }

      await Project.create({
        ...projData,
        organizationId: orgId,
      });
      logger.info(` -> Seeded Project [${projData.riskLevel} Risk] ${projData.name} (${projData.code})`);
    }

    // 4. Seed Standard Inspection Checklist Templates
    logger.info('Seeding Standard Inspection Checklist Templates...');
    await ChecklistTemplate.deleteMany({});
    await Inspection.deleteMany({});

    const standardChecklist = await ChecklistTemplate.create({
      name: 'National Standard Quality & Compliance Inspection Checklist',
      code: 'CHK-STD-2026',
      categories: [
        {
          categoryName: 'Infrastructure & Site Condition',
          questions: [
            { id: 'inf_01', question: 'Is the facility structural integrity intact without visible hazards?', type: 'YES_NO', isRequired: true, weight: 2 },
            { id: 'inf_02', question: 'Are standard signboards displaying Scheme details & Beneficiary hotline prominently installed?', type: 'PHOTO_REQUIRED', isRequired: true, weight: 2 },
            { id: 'inf_03', question: 'Total operational workstations/desks available on premise:', type: 'NUMBER', isRequired: true, weight: 1 },
          ],
        },
        {
          categoryName: 'Safety & Hygiene Standards',
          questions: [
            { id: 'saf_01', question: 'Are functional fire extinguishers within valid inspection expiry dates available?', type: 'YES_NO', isRequired: true, weight: 2 },
            { id: 'saf_02', question: 'Is clean potable drinking water facility verified on site?', type: 'PHOTO_REQUIRED', isRequired: true, weight: 2 },
            { id: 'saf_03', question: 'Are first-aid kits stocked and easily accessible?', type: 'YES_NO', isRequired: true, weight: 1 },
          ],
        },
        {
          categoryName: 'Staffing & Biometric Attendance',
          questions: [
            { id: 'att_01', question: 'Are certified trainers/staff present as per authorized sanction list?', type: 'YES_NO', isRequired: true, weight: 3 },
            { id: 'att_02', question: 'Actual physical count of beneficiaries present today:', type: 'NUMBER', isRequired: true, weight: 3 },
            { id: 'att_03', question: 'Is the AEBAS / digital biometric attendance device operational with live sync?', type: 'PHOTO_REQUIRED', isRequired: true, weight: 3 },
          ],
        },
        {
          categoryName: 'Documentation & Financial Compliance',
          questions: [
            { id: 'doc_01', question: 'Is the physical enrollment & batch register maintained and updated up to today?', type: 'YES_NO', isRequired: true, weight: 2 },
            { id: 'doc_02', question: 'Observations on fee records or financial ledger matching scheme guidelines:', type: 'TEXT', isRequired: false, weight: 1 },
          ],
        },
      ],
    });
    logger.info(` -> Seeded Standard Checklist Template [${standardChecklist.code}]`);

    // 5. Seed Initial Sample Routine & Surprise Inspections
    logger.info('Seeding Initial Routine & Surprise Inspections...');
    const allProjects = await Project.find({});
    const allInspectors = await User.find({ role: UserRole.INSPECTOR });
    const superAdmin = await User.findOne({ role: UserRole.SUPER_ADMIN });

    if (allProjects.length > 0 && allInspectors.length > 0) {
      // 1. In-Progress Inspection in Pune
      const puneProject = allProjects.find((p) => p.district === 'Pune') || allProjects[0];
      const puneInspector = allInspectors.find((i) => i.district === 'Pune') || allInspectors[0];

      await Inspection.create({
        inspectionId: 'INSP-2026-PUN-001',
        projectId: puneProject._id,
        inspectorId: puneInspector._id,
        assignedBy: superAdmin?._id,
        type: InspectionType.SURPRISE,
        priority: InspectionPriority.HIGH,
        status: InspectionStatus.IN_PROGRESS,
        assignedAt: new Date(Date.now() - 3600000 * 4),
        acceptedAt: new Date(Date.now() - 3600000 * 3),
        enRouteAt: new Date(Date.now() - 3600000 * 2),
        arrivedAt: new Date(Date.now() - 3600000 * 1),
        startedAt: new Date(Date.now() - 1800000),
        isLocationVerified: true,
        assignmentReason: 'High risk score (78/100) and reported attendance discrepancy signal.',
        locationLogs: [
          {
            timestamp: new Date(Date.now() - 3600000 * 1),
            coordinates: puneProject.location.coordinates,
            accuracyMeters: 8,
            distanceFromProjectMeters: 45,
            isVerified: true,
            stage: 'ARRIVE',
          },
          {
            timestamp: new Date(Date.now() - 1800000),
            coordinates: puneProject.location.coordinates,
            accuracyMeters: 6,
            distanceFromProjectMeters: 25,
            isVerified: true,
            stage: 'START',
          },
        ],
        auditHistory: [
          { stage: 'ASSIGNED', timestamp: new Date(Date.now() - 3600000 * 4), comment: 'High risk surprise assignment' },
          { stage: 'IN_PROGRESS', timestamp: new Date(Date.now() - 1800000), comment: 'GPS verified on-site' },
        ],
      });

      // 2. Completed / Approved Inspection in Bengaluru
      const blrProject = allProjects.find((p) => p.district === 'Bengaluru Urban') || allProjects[1];
      const blrInspector = allInspectors.find((i) => i.district === 'Bengaluru Urban') || allInspectors[1];

      await Inspection.create({
        inspectionId: 'INSP-2026-BLR-002',
        projectId: blrProject._id,
        inspectorId: blrInspector._id,
        assignedBy: superAdmin?._id,
        type: InspectionType.ROUTINE,
        priority: InspectionPriority.MEDIUM,
        status: InspectionStatus.APPROVED,
        assignedAt: new Date(Date.now() - 86400000 * 5),
        acceptedAt: new Date(Date.now() - 86400000 * 5 + 3600000),
        startedAt: new Date(Date.now() - 86400000 * 4),
        completedAt: new Date(Date.now() - 86400000 * 4 + 7200000),
        submittedAt: new Date(Date.now() - 86400000 * 4 + 7200000),
        reviewedAt: new Date(Date.now() - 86400000 * 3),
        reviewedBy: superAdmin?._id,
        score: 92,
        isLocationVerified: true,
        reviewNotes: 'Excellent infrastructure maintenance and verified biometric records.',
        observations: 'All 32 registered students present. Lab machinery certified and functional.',
        checklistResponses: [
          { itemId: 'inf_01', category: 'Infrastructure', question: 'Structural integrity intact?', type: 'YES_NO', value: true, isCompliant: true },
          { itemId: 'saf_01', category: 'Safety', question: 'Fire extinguishers available?', type: 'YES_NO', value: true, isCompliant: true },
          { itemId: 'att_02', category: 'Attendance', question: 'Physical beneficiary count:', type: 'NUMBER', value: 32, isCompliant: true },
        ],
        auditHistory: [
          { stage: 'APPROVED', timestamp: new Date(Date.now() - 86400000 * 3), comment: 'Approved with score 92%' },
        ],
      });
      logger.info(' -> Seeded Sample In-Progress and Approved Inspections.');
    }

    // 6. Seed CCTV Cameras across Key Infrastructure Projects
    logger.info('Seeding CCTV Edge Cameras & Stream Registry...');
    const cctvSeedList = [
      {
        name: 'Mobile Phone Live Inspection Feed (Android IP Camera)',
        code: 'CAM-MOB-001',
        projectId: allProjects.find((p) => p.district === 'Pune')?._id || allProjects[0]._id,
        locationDescription: 'Handheld Mobile Inspection Feed (Android IP Webcam / MJPEG over Wi-Fi)',
        location: { type: 'Point' as const, coordinates: [73.8567, 18.5204] },
        streamProtocol: StreamProtocol.MJPEG,
        rawStreamUrl: process.env.MOBILE_CCTV_STREAM_URL || 'http://10.146.163.75:8080/video',
        status: CameraStatus.ONLINE,
        resolution: '1080p Full HD',
        fps: 30,
        model: 'Android Phone IP Webcam (MJPEG/HTTP Stream)',
        ipAddress: '10.146.163.75',
        macAddress: 'AC:5F:3E:99:44:11',
        lastHeartbeatAt: new Date(),
        cpuUsagePct: 18,
        memoryUsagePct: 32,
      },
      {
        name: 'Main Workshop & Lab Floor Camera 01',
        code: 'CAM-PUN-001',
        projectId: allProjects.find((p) => p.district === 'Pune')?._id || allProjects[0]._id,
        locationDescription: 'Inside Advanced Mechatronics Lab North Wing',
        location: { type: 'Point' as const, coordinates: [73.8567, 18.5204] },
        streamProtocol: StreamProtocol.RTSP,
        rawStreamUrl: 'rtsp://admin:streamPass@10.0.1.101:554/live/ch0',
        status: CameraStatus.ONLINE,
        resolution: '1080p',
        fps: 30,
        model: 'Hikvision Smart AI DS-2CD2347G2',
        ipAddress: '10.0.1.101',
        macAddress: 'BC:A9:93:44:11:01',
        lastHeartbeatAt: new Date(),
        cpuUsagePct: 24,
        memoryUsagePct: 42,
      },
      {
        name: 'Perimeter Gate & Biometric Entry Camera',
        code: 'CAM-PUN-002',
        projectId: allProjects.find((p) => p.district === 'Pune')?._id || allProjects[0]._id,
        locationDescription: 'Main Gate Access Control & Biometric Portal',
        location: { type: 'Point' as const, coordinates: [73.8569, 18.5206] },
        streamProtocol: StreamProtocol.RTSP,
        rawStreamUrl: 'rtsp://admin:streamPass@10.0.1.102:554/live/ch0',
        status: CameraStatus.ONLINE,
        resolution: '4K',
        fps: 25,
        model: 'Dahua WizMind IPC-HFW5442T',
        ipAddress: '10.0.1.102',
        macAddress: 'BC:A9:93:44:11:02',
        lastHeartbeatAt: new Date(),
        cpuUsagePct: 35,
        memoryUsagePct: 48,
      },
      {
        name: 'Bengaluru Robotics Arena Live Stream',
        code: 'CAM-BLR-001',
        projectId: allProjects.find((p) => p.district === 'Bengaluru Urban')?._id || allProjects[1]._id,
        locationDescription: 'Building B 1st Floor Industrial Robotics Bay',
        location: { type: 'Point' as const, coordinates: [77.5946, 12.9716] },
        streamProtocol: StreamProtocol.HLS,
        rawStreamUrl: 'https://streams.karnataka.gov.in/hls/blr-robotics.m3u8',
        status: CameraStatus.ONLINE,
        resolution: '1080p',
        fps: 30,
        model: 'Axis Communications Q3536-LVE',
        ipAddress: '10.20.4.15',
        macAddress: 'AC:CC:8E:22:99:41',
        lastHeartbeatAt: new Date(),
        cpuUsagePct: 19,
        memoryUsagePct: 38,
      },
      {
        name: 'Okhla Delhi AI Center Front Courtyard',
        code: 'CAM-DEL-001',
        projectId: allProjects.find((p) => p.district === 'New Delhi')?._id || allProjects[2]._id,
        locationDescription: 'Entrance Foyer & Attendance Kiosk',
        location: { type: 'Point' as const, coordinates: [77.209, 28.6139] },
        streamProtocol: StreamProtocol.RTSP,
        rawStreamUrl: 'rtsp://admin:streamPass@10.15.2.11:554/live/ch0',
        status: CameraStatus.DEGRADED,
        resolution: '720p',
        fps: 15,
        model: 'CP Plus Coral Pro HD',
        ipAddress: '10.15.2.11',
        macAddress: 'D8:EB:97:55:23:77',
        lastHeartbeatAt: new Date(Date.now() - 300000),
        cpuUsagePct: 78,
        memoryUsagePct: 84,
      },
      {
        name: 'Ahmedabad Industrial Automation Bay',
        code: 'CAM-AMD-001',
        projectId: allProjects.find((p) => p.district === 'Ahmedabad')?._id || allProjects[3]._id,
        locationDescription: 'Heavy Machining & Welding Testing Area',
        location: { type: 'Point' as const, coordinates: [72.5714, 23.0225] },
        streamProtocol: StreamProtocol.RTSP,
        rawStreamUrl: 'rtsp://admin:streamPass@10.30.1.20:554/live/ch0',
        status: CameraStatus.ONLINE,
        resolution: '1080p',
        fps: 30,
        model: 'Hikvision ColorVu DS-2CD2087G2',
        ipAddress: '10.30.1.20',
        macAddress: 'E4:AA:5D:88:12:34',
        lastHeartbeatAt: new Date(),
        cpuUsagePct: 22,
        memoryUsagePct: 39,
      },
      {
        name: 'Mumbai Marine & Fisheries Dock Camera',
        code: 'CAM-MUM-001',
        projectId: allProjects.find((p) => p.district === 'Mumbai')?._id || allProjects[0]._id,
        locationDescription: 'Quayside Cargo Weighbridge & Transit Portal',
        location: { type: 'Point' as const, coordinates: [72.8777, 19.076] },
        streamProtocol: StreamProtocol.RTSP,
        rawStreamUrl: 'rtsp://admin:streamPass@10.50.3.12:554/live/ch0',
        status: CameraStatus.ONLINE,
        resolution: '1080p',
        fps: 30,
        model: 'Bosch Dinion IP 3000i IR',
        ipAddress: '10.50.3.12',
        macAddress: 'F0:9F:C2:11:88:99',
        lastHeartbeatAt: new Date(),
        cpuUsagePct: 29,
        memoryUsagePct: 45,
      },
    ];

    for (const cam of cctvSeedList) {
      await CctvCamera.create(cam);
      logger.info(` -> Seeded CCTV Camera [${cam.status}] ${cam.code} (${cam.name})`);
    }

    // 7. Seed AI Anomaly & Fraud Alerts
    logger.info('Seeding AI Anomaly Alerts & Fraud Detection Signals...');
    const puneProj = allProjects.find((p) => p.district === 'Pune') || allProjects[0];
    const delProj = allProjects.find((p) => p.district === 'New Delhi') || allProjects[2];
    const blrProj = allProjects.find((p) => p.district === 'Bengaluru Urban') || allProjects[1];
    const gujProj = allProjects.find((p) => p.district === 'Gir Somnath' || p.district === 'Ahmedabad') || allProjects[3];

    const alertSeedList = [
      {
        projectId: puneProj._id,
        type: AnomalyType.ATTENDANCE_MISMATCH,
        severity: AnomalySeverity.CRITICAL,
        status: AlertStatus.OPEN,
        confidence: 0.94,
        title: 'High Biometric Attendance Deficit Alert (54% Deficit)',
        reason:
          'Physical biometric head count (23) deviates by 54.0% from daily claimed stipend muster roll (50 beneficiaries). High risk of ghost enrollment.',
        source: 'AI_SERVICE',
        metrics: {
          claimedBeneficiaries: 50,
          verifiedBeneficiaries: 23,
          deficitPercentage: 54.0,
          historicalVariance: 0.12,
        },
      },
      {
        projectId: delProj._id,
        type: AnomalyType.REPORTING_SPIKE,
        severity: AnomalySeverity.HIGH,
        status: AlertStatus.OPEN,
        confidence: 0.88,
        title: 'Progress Velocity Divergence Signal',
        reason:
          'Financial disbursement velocity (85% allocated) is out of sync with verified physical civil completion (32% actual progress).',
        source: 'AI_SERVICE',
        metrics: {
          financialDisbursedPct: 85,
          physicalCompletionPct: 32,
          velocityRatio: 2.65,
        },
      },
      {
        projectId: gujProj._id,
        type: AnomalyType.DUPLICATE_EVIDENCE,
        severity: AnomalySeverity.HIGH,
        status: AlertStatus.OPEN,
        confidence: 0.96,
        title: 'Recycled Photo Evidence Hash Match Detected',
        reason:
          'Submitted site progress photograph matches exact SHA-256 and perceptual hash with an inspection uploaded 45 days ago at a different coordinate.',
        source: 'AI_SERVICE',
        metrics: {
          matchedEvidenceId: 'EVD-PREV-2025-081',
          hammingDistance: 0,
          similarityScore: 1.0,
        },
      },
      {
        projectId: blrProj._id,
        type: AnomalyType.UNUSUAL_ATTENDANCE,
        severity: AnomalySeverity.MEDIUM,
        status: AlertStatus.INVESTIGATING,
        confidence: 0.79,
        title: 'Moderate Trainee Attendance Fluctuation',
        reason:
          'Morning batch enrollment showed 28% deviation during random CCTV periodic frame sampling between 10:00 AM and 11:30 AM.',
        source: 'AI_SERVICE',
        metrics: {
          claimedBeneficiaries: 40,
          verifiedBeneficiaries: 29,
          deficitPercentage: 27.5,
        },
      },
    ];

    for (const alert of alertSeedList) {
      await AnomalyAlert.create(alert);
      logger.info(` -> Seeded Anomaly Alert [${alert.severity}] ${alert.title}`);
    }

    // 8. Seed Cryptographically Hashed Evidence Samples
    logger.info('Seeding Sample Cryptographic Evidence Records...');
    const inProgressInspection = await Inspection.findOne({ status: InspectionStatus.IN_PROGRESS });
    const inspectorUser = await User.findOne({ role: UserRole.INSPECTOR });

    if (inProgressInspection && inspectorUser) {
      const sampleEvidence = await Evidence.create({
        inspectionId: inProgressInspection._id,
        projectId: inProgressInspection.projectId,
        capturedBy: inspectorUser._id,
        capturedAt: new Date(),
        type: EvidenceType.PHOTO,
        fileUrl: '/api/v1/evidence/sample-foundation.jpg',
        fileKey: 'inspections/sample-foundation.jpg',
        mimeType: 'image/jpeg',
        fileSize: 2048576,
        sha256Hash: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
        location: {
          type: 'Point',
          coordinates: [73.8567, 18.5204],
        },
        metadata: {
          deviceModel: 'Samsung Galaxy Tab S9 Enterprise',
          altitudeMeters: 560,
          bearingDegrees: 184.2,
          isLiveCapture: true,
          checklistQuestionId: 'inf_01',
        },
      });

      // Link evidence to inspection
      inProgressInspection.evidenceIds = [sampleEvidence._id as any];
      await inProgressInspection.save();
      logger.info(` -> Seeded Evidence [SHA-256: ${sampleEvidence.sha256Hash.substring(0, 16)}...] linked to ${inProgressInspection.inspectionId}`);
    }

    // 9. Record Bootstrapping Audit Log
    await AuditLog.create({
      action: AuditAction.CONFIG_MODIFIED,
      resource: 'SystemDatabase',
      resourceId: 'seed',
      ipAddress: '127.0.0.1',
      userAgent: 'NirikshanSeedScript/1.0',
      details: {
        message: 'Database seeded with users, organizations, geo-tagged projects, checklists, CCTV streams, AI fraud alerts, and verified evidence.',
      },
      timestamp: new Date(),
    });

    logger.info('=======================================================');
    logger.info('✅ NIRIKSHAN Platform Data Seed Completed Successfully!');
    logger.info('=======================================================');
    logger.info(`📊 Seed Summary:`);
    logger.info(`   - Users:               ${SEED_USERS.length}`);
    logger.info(`   - Organizations:       ${SEED_ORGANIZATIONS.length}`);
    logger.info(`   - Projects:            ${SEED_PROJECTS_DATA.length} (GeoJSON 2dsphere Indexed)`);
    logger.info(`   - Checklist Templates: 1 Standard Quality Template`);
    logger.info(`   - Inspections:         Sample Live & Approved Workflows`);
    logger.info(`   - CCTV Cameras:        ${cctvSeedList.length} Connected Edge Cameras`);
    logger.info(`   - AI Anomaly Alerts:   ${alertSeedList.length} Anomaly & Fraud Signals`);
    logger.info(`   - Evidence:            Cryptographically Verified Samples`);
    logger.info('   Default Password: Password@123');
    logger.info('=======================================================');
  } catch (err: any) {
    logger.error({ err }, '❌ Error occurred during data seed');
    throw err;
  }
}

export async function runSeed(): Promise<void> {
  logger.info('🌱 Starting NIRIKSHAN Platform Data Seeding...');
  await connectDatabase();
  try {
    await seedData();
  } finally {
    await disconnectDatabase();
  }
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}


