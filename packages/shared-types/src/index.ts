// ============================================================================
// NIRIKSHAN SHARED DOMAIN TYPES
// ============================================================================

// 1. Role-Based Access Control (RBAC) & Government Hierarchy
export enum UserRole {
  // Super Administrator
  SUPER_ADMIN = 'SUPER_ADMIN',
  SYSTEM_SUPER_ADMIN = 'SYSTEM_SUPER_ADMIN',

  // Ministry / National HQ Roles
  DOSJE_HQ_ADMIN = 'DOSJE_HQ_ADMIN',
  DEPARTMENT_OFFICIAL = 'DEPARTMENT_OFFICIAL',
  DOSJE_HQ_OFFICIAL = 'DOSJE_HQ_OFFICIAL',

  // State & District Jurisdictions
  STATE_AUTHORITY = 'STATE_AUTHORITY',
  DOSJE_STATE_OFFICIAL = 'DOSJE_STATE_OFFICIAL',
  DISTRICT_AUTHORITY = 'DISTRICT_AUTHORITY',
  DOSJE_DISTRICT_OFFICIAL = 'DOSJE_DISTRICT_OFFICIAL',

  // Project Management Unit (PMU)
  PMU_OFFICER = 'PMU_OFFICER',
  PMU_MANAGER = 'PMU_MANAGER',
  INSPECTOR = 'INSPECTOR',
  PMU_INSPECTOR = 'PMU_INSPECTOR',

  // Institution / NGO Tier
  INSTITUTE_ADMIN = 'INSTITUTE_ADMIN',
  NGO_ADMIN = 'NGO_ADMIN',
  NGO_PROJECT_MANAGER = 'NGO_PROJECT_MANAGER',
  PROJECT_STAFF = 'PROJECT_STAFF',
  NGO_STAFF = 'NGO_STAFF',

  // Citizen / Recipient
  BENEFICIARY = 'BENEFICIARY',

  // Specialized Audit & Governance
  AUDITOR = 'AUDITOR',
  COMPLIANCE_OFFICER = 'COMPLIANCE_OFFICER',
  FINANCE_OFFICER = 'FINANCE_OFFICER',
  VIEW_ONLY_OFFICIAL = 'VIEW_ONLY_OFFICIAL',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  LOCKED = 'LOCKED',
}

// Data Scope & Jurisdiction Hierarchy
export enum DataScopeLevel {
  NATIONAL = 'NATIONAL',
  STATE = 'STATE',
  DISTRICT = 'DISTRICT',
  ORGANIZATION = 'ORGANIZATION',
  ASSIGNED_INSPECTIONS = 'ASSIGNED_INSPECTIONS',
  SELF = 'SELF',
}

export interface IDataScope {
  level: DataScopeLevel;
  stateIds?: string[];
  districtIds?: string[];
  organizationIds?: string[];
  assignedInspectionIds?: string[];
  beneficiaryId?: string;
}

// Granular Permissions using resource.action format
export const Permissions = {
  INSTITUTION_READ: 'institution.read',
  INSTITUTION_CREATE: 'institution.create',
  INSTITUTION_UPDATE: 'institution.update',
  INSTITUTION_SUSPEND: 'institution.suspend',
  INSTITUTION_REVIEW: 'institution.review',

  PROJECT_READ: 'project.read',
  PROJECT_CREATE: 'project.create',
  PROJECT_UPDATE: 'project.update',

  BENEFICIARY_READ: 'beneficiary.read',
  BENEFICIARY_CREATE: 'beneficiary.create',
  BENEFICIARY_UPDATE: 'beneficiary.update',
  BENEFICIARY_VERIFY: 'beneficiary.verify',

  ATTENDANCE_READ: 'attendance.read',
  ATTENDANCE_CREATE: 'attendance.create',
  ATTENDANCE_REVIEW: 'attendance.review',
  ATTENDANCE_FINALIZE: 'attendance.finalize',

  INSPECTION_READ: 'inspection.read',
  INSPECTION_CREATE: 'inspection.create',
  INSPECTION_ASSIGN: 'inspection.assign',
  INSPECTION_EXECUTE: 'inspection.execute',
  INSPECTION_REVIEW: 'inspection.review',
  INSPECTION_APPROVE: 'inspection.approve',

  ANOMALY_READ: 'anomaly.read',
  ANOMALY_REVIEW: 'anomaly.review',
  ANOMALY_DISMISS: 'anomaly.dismiss',
  ANOMALY_ESCALATE: 'anomaly.escalate',

  FINANCIAL_READ: 'financial.read',
  FINANCIAL_SUBMIT: 'financial.submit',
  FINANCIAL_REVIEW: 'financial.review',
  FINANCIAL_APPROVE: 'financial.approve',

  COMPLIANCE_READ: 'compliance.read',
  COMPLIANCE_UPDATE: 'compliance.update',
  COMPLIANCE_REVIEW: 'compliance.review',

  CCTV_READ: 'cctv.read',
  CCTV_CONTROL: 'cctv.control',

  VC_CREATE: 'vc.create',
  VC_JOIN: 'vc.join',
  VC_REVIEW: 'vc.review',

  CORRECTIVE_ACTION_CREATE: 'corrective_action.create',
  CORRECTIVE_ACTION_ASSIGN: 'corrective_action.assign',
  CORRECTIVE_ACTION_CLOSE: 'corrective_action.close',

  REPORT_READ: 'report.read',
  REPORT_EXPORT: 'report.export',

  AUDIT_READ: 'audit.read',

  USER_CREATE: 'user.create',
  USER_READ: 'user.read',
  USER_UPDATE: 'user.update',
  USER_DISABLE: 'user.disable',

  SECURITY_MANAGE: 'security.manage',

  // Convenience aliases for UI visibility checks
  INSTITUTION_VIEW: 'institution.read',
  PROJECT_VIEW: 'project.read',
  BENEFICIARY_VIEW: 'beneficiary.read',
  ATTENDANCE_VIEW: 'attendance.read',
  INSPECTION_VIEW: 'inspection.read',
  ANOMALY_VIEW: 'anomaly.read',
  FINANCIAL_VIEW: 'financial.read',
  COMPLIANCE_VIEW: 'compliance.read',
  CCTV_VIEW: 'cctv.read',
  CORRECTIVE_ACTION_VIEW: 'corrective_action.assign',
  REPORT_VIEW: 'report.read',
  AUDIT_VIEW: 'audit.read',
  USER_VIEW: 'user.read',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions] | string;

export interface ITemporaryAccess {
  role: UserRole;
  scope: IDataScope;
  effectiveFrom: Date | string;
  effectiveUntil: Date | string;
  reason: string;
  approvedBy: string;
}

export interface IUser {
  id: string;
  email: string;
  name: string;
  designation?: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  organizationId?: string;
  state?: string;
  district?: string;
  avatarUrl?: string;
  failedLoginAttempts?: number;
  lockoutUntil?: Date | string;
  isMfaEnabled?: boolean;
  temporaryAccess?: ITemporaryAccess;
  lastLoginAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ISession {
  id: string;
  userId: string;
  tokenHash: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo?: string;
  lastActiveAt: Date | string;
  expiresAt: Date | string;
  isValid: boolean;
  revokedAt?: Date | string;
  revokedReason?: string;
  createdAt: Date | string;
}

export interface IAuthMeResponse {
  user: IUser;
  roles: UserRole[];
  permissions: string[];
  scope: IDataScope;
  session?: {
    id: string;
    ipAddress?: string;
    userAgent?: string;
    lastActiveAt: Date | string;
    expiresAt: Date | string;
  };
}

// 2. Geospatial Definitions
export interface IGeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// 3. Organization & Institute
export enum OrganizationType {
  GOVERNMENT_MINISTRY = 'GOVERNMENT_MINISTRY',
  STATE_DEPARTMENT = 'STATE_DEPARTMENT',
  DISTRICT_OFFICE = 'DISTRICT_OFFICE',
  INSTITUTE = 'INSTITUTE',
  NGO = 'NGO',
  BENEFICIARY_ENTITY = 'BENEFICIARY_ENTITY',
}

export interface IOrganization {
  id: string;
  name: string;
  code: string;
  type: OrganizationType;
  state: string;
  district: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// 4. Project Entity
export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  FLAGGED = 'FLAGGED',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface IProject {
  id: string;
  name: string;
  code: string;
  organizationId: string;
  scheme: string;
  description: string;
  address: string;
  district: string;
  state: string;
  location: IGeoPoint;
  geofenceRadiusMeters: number;
  status: ProjectStatus;
  riskLevel: RiskLevel;
  riskScore: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  lastInspectedAt?: Date | string;
  nextEligibleInspectionAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// 5. Inspection System
export enum InspectionType {
  ROUTINE = 'ROUTINE',
  SURPRISE = 'SURPRISE',
  FOLLOW_UP = 'FOLLOW_UP',
  SPECIAL = 'SPECIAL',
}

export enum InspectionPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EMERGENCY = 'EMERGENCY',
}

export enum InspectionStatus {
  CREATED = 'CREATED',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  CLOSED = 'CLOSED',
}

export enum ChecklistItemType {
  YES_NO = 'YES_NO',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  PHOTO_REQUIRED = 'PHOTO_REQUIRED',
}

export interface IChecklistQuestion {
  id: string;
  question: string;
  type: ChecklistItemType;
  isRequired: boolean;
  weight: number;
  helpText?: string;
}

export interface IChecklistCategory {
  categoryName: string;
  questions: IChecklistQuestion[];
}

export interface IChecklistTemplate {
  id: string;
  name: string;
  code: string;
  scheme?: string;
  categories: IChecklistCategory[];
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IChecklistItemAnswer {
  itemId: string;
  category: string;
  question: string;
  type: ChecklistItemType;
  value: string | number | boolean | null;
  comment?: string;
  photoEvidenceIds?: string[];
  isCompliant?: boolean;
}

export interface IInspectionLocationLog {
  timestamp: Date | string;
  coordinates: [number, number];
  accuracyMeters?: number;
  distanceFromProjectMeters: number;
  isVerified: boolean;
  stage: 'ACCEPT' | 'ARRIVE' | 'START' | 'SUBMIT';
}

export interface IInspection {
  id: string;
  inspectionId: string;
  projectId: string;
  inspectorId: string;
  assignedBy?: string;
  type: InspectionType;
  status: InspectionStatus;
  priority: InspectionPriority;
  assignedAt: Date | string;
  acceptedAt?: Date | string;
  enRouteAt?: Date | string;
  arrivedAt?: Date | string;
  startedAt?: Date | string;
  completedAt?: Date | string;
  submittedAt?: Date | string;
  reviewedAt?: Date | string;
  reviewedBy?: string;
  reviewNotes?: string;
  locationLogs: IInspectionLocationLog[];
  isLocationVerified: boolean;
  checklistResponses: IChecklistItemAnswer[];
  observations?: string;
  recommendations?: string;
  actionRequiredDetails?: string;
  anomalyDetected?: boolean;
  score?: number;
  evidenceIds: string[];
  assignmentReason?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// 6. Evidence Entity & Storage Abstraction
export enum EvidenceType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO',
  CCTV_CLIP = 'CCTV_CLIP',
  TEXT = 'TEXT',
}

export interface IEvidence {
  id: string;
  inspectionId: string;
  projectId?: string;
  capturedBy: string;
  capturedAt: Date | string;
  type: EvidenceType;
  fileUrl: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  sha256Hash: string;
  isHashVerified?: boolean;
  location?: IGeoPoint;
  locationAccuracyMeters?: number;
  isLocationVerified?: boolean;
  distanceFromProjectMeters?: number;
  checklistQuestionId?: string;
  deviceMetadata?: {
    platform?: string;
    model?: string;
    osVersion?: string;
    appVersion?: string;
    capturedTimestamp?: Date | string;
  };
  tags?: string[];
  description?: string;
  aiAnalysis?: {
    analyzed: boolean;
    anomalyDetected?: boolean;
    labels?: string[];
    confidence?: number;
    notes?: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IStorageUploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
  sha256Hash: string;
}

export interface IStorageProvider {
  uploadFile(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    folder?: string,
  ): Promise<IStorageUploadResult>;
  getFileStream(key: string): Promise<NodeJS.ReadableStream>;
  getFileBuffer(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
  verifyIntegrity(key: string, expectedHash: string): Promise<boolean>;
}

// 7. CCTV Surveillance
export enum CameraStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  DEGRADED = 'DEGRADED',
  MAINTENANCE = 'MAINTENANCE',
}

export enum StreamProtocol {
  HLS = 'HLS',
  WEBRTC = 'WEBRTC',
  RTSP = 'RTSP',
  DEMO = 'DEMO',
  MJPEG = 'MJPEG',
  HTTP = 'HTTP',
}

export interface ICCTVCamera {
  id: string;
  name: string;
  code: string;
  projectId: string;
  locationDescription: string;
  coordinates?: IGeoPoint;
  status: CameraStatus;
  protocol: StreamProtocol;
  streamPath: string; // Tokenized or relative proxy path, never raw secret credentials
  isDemo: boolean;
  lastHeartbeatAt?: Date | string;
  resolution?: string;
  fps?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// 8. AI & Anomaly Service
export enum AnomalyType {
  ATTENDANCE_MISMATCH = 'ATTENDANCE_MISMATCH',
  REPORTING_SPIKE = 'REPORTING_SPIKE',
  INSPECTION_OVERDUE = 'INSPECTION_OVERDUE',
  DUPLICATE_EVIDENCE = 'DUPLICATE_EVIDENCE',
  CCTV_DOWNTIME = 'CCTV_DOWNTIME',
  UNUSUAL_ATTENDANCE = 'UNUSUAL_ATTENDANCE',
  GPS_SPOOFING_RISK = 'GPS_SPOOFING_RISK',
}

export enum AnomalySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AlertStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export interface IAnomalyAlert {
  id: string;
  projectId: string;
  inspectionId?: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  status: AlertStatus;
  confidence: number; // 0.0 - 1.0
  title: string;
  reason: string;
  source: 'AI_SERVICE' | 'RULE_ENGINE' | 'MANUAL_FLAG';
  metrics?: Record<string, unknown>;
  assignedOfficerId?: string;
  resolvedAt?: Date | string;
  resolutionNotes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// 9. Audit Logging
export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  SESSION_REVOKED = 'SESSION_REVOKED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_REACTIVATED = 'USER_REACTIVATED',
  EXPORT_GENERATED = 'EXPORT_GENERATED',
  SCOPE_MODIFIED = 'SCOPE_MODIFIED',
  SENSITIVE_ACTION_CONFIRMED = 'SENSITIVE_ACTION_CONFIRMED',
  INSPECTION_CREATED = 'INSPECTION_CREATED',
  INSPECTION_ASSIGNED = 'INSPECTION_ASSIGNED',
  INSPECTION_ACCEPTED = 'INSPECTION_ACCEPTED',
  INSPECTION_STARTED = 'INSPECTION_STARTED',
  INSPECTION_UPDATED = 'INSPECTION_UPDATED',
  EVIDENCE_UPLOADED = 'EVIDENCE_UPLOADED',
  EVIDENCE_DELETED = 'EVIDENCE_DELETED',
  REPORT_SUBMITTED = 'REPORT_SUBMITTED',
  REPORT_APPROVED = 'REPORT_APPROVED',
  REPORT_REJECTED = 'REPORT_REJECTED',
  ALERT_CREATED = 'ALERT_CREATED',
  ALERT_RESOLVED = 'ALERT_RESOLVED',
  CCTV_ACCESSED = 'CCTV_ACCESSED',
  VC_STARTED = 'VC_STARTED',
  VC_ENDED = 'VC_ENDED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  CONFIG_MODIFIED = 'CONFIG_MODIFIED',
}

export interface IAuditLog {
  id: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: UserRole;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  details?: Record<string, unknown>;
  timestamp: Date | string;
}

// 10. API Generic Responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    requestId?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

// 11. Real-Time Socket Events
export enum SocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  AUTHENTICATE = 'authenticate',
  AUTHENTICATED = 'authenticated',
  INSPECTION_ASSIGNED = 'inspection:assigned',
  INSPECTION_ACCEPTED = 'inspection:accepted',
  INSPECTION_STARTED = 'inspection:started',
  INSPECTION_SUBMITTED = 'inspection:submitted',
  INSPECTION_STATUS_CHANGED = 'inspection:status_changed',
  LOCATION_UPDATE = 'location:update',
  JOIN_INSPECTION = 'join:inspection',
  LEAVE_INSPECTION = 'leave:inspection',
  EVIDENCE_UPLOADED = 'evidence:uploaded',
  ALERT_CREATED = 'alert:created',
  ALERT_RESOLVED = 'alert:resolved',
  CCTV_STATUS_CHANGED = 'cctv:status_changed',
  NOTIFICATION_NEW = 'notification:new',
  DASHBOARD_UPDATE = 'dashboard:update',
}

// 12. Health Check Details
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptimeSeconds: number;
  timestamp: string;
  environment: string;
  version: string;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'connecting' | 'memory_fallback';
      latencyMs?: number;
    };
    aiService?: {
      status: 'online' | 'offline' | 'unreachable';
      endpoint: string;
    };
    storage?: {
      provider: string;
      status: 'ready' | 'error';
    };
  };
}

// 13. Offline & Sync Synchronization Engine
export enum SyncActionType {
  STATUS_CHANGE = 'STATUS_CHANGE',
  LOCATION_LOG = 'LOCATION_LOG',
  CHECKLIST_UPDATE = 'CHECKLIST_UPDATE',
  EVIDENCE_METADATA = 'EVIDENCE_METADATA',
  FULL_SUBMISSION = 'FULL_SUBMISSION',
}

export interface ISyncActionItem {
  id: string; // Client action UUID
  idempotencyKey: string;
  actionType: SyncActionType;
  inspectionId: string;
  payload: Record<string, any>;
  clientTimestamp: Date | string;
  retryCount?: number;
}

export interface ISyncPullRequest {
  lastSyncTimestamp?: Date | string;
  inspectorId?: string;
}

export interface ISyncPullResponse {
  serverTimestamp: Date | string;
  assignedInspections: IInspection[];
  projects: IProject[];
  checklistTemplates: IChecklistTemplate[];
}

export interface ISyncPushResultItem {
  actionId: string;
  idempotencyKey: string;
  actionType: SyncActionType;
  inspectionId: string;
  success: boolean;
  message?: string;
  error?: string;
  conflict?: {
    resolved: boolean;
    strategy: 'SERVER_WINS' | 'CLIENT_WINS';
    serverState?: unknown;
  };
}

export interface ISyncPushRequest {
  inspectorId: string;
  syncBatchId: string;
  actions: ISyncActionItem[];
}

export interface ISyncPushResponse {
  syncBatchId: string;
  processedCount: number;
  successCount: number;
  failureCount: number;
  results: ISyncPushResultItem[];
  serverTimestamp: Date | string;
}

// 14. Compliance & NGO Historical Actions (blacklist.txt integration)
export enum ComplianceActionType {
  BLACKLISTED = 'BLACKLISTED',
  GRANT_SUSPENDED = 'GRANT_SUSPENDED',
  GRANT_RECOVERY = 'GRANT_RECOVERY',
  ASSET_SEIZURE = 'ASSET_SEIZURE',
  STATE_ENQUIRY = 'STATE_ENQUIRY',
  WARNING_ISSUED = 'WARNING_ISSUED',
  SHOW_CAUSE_NOTICE = 'SHOW_CAUSE_NOTICE',
}

export enum ComplianceVerificationStatus {
  VERIFIED = 'VERIFIED',
  HISTORICAL = 'HISTORICAL',
  CURRENT = 'CURRENT',
  SUPERSEDED = 'SUPERSEDED',
  REQUIRES_REVIEW = 'REQUIRES_REVIEW',
}

export enum ComplianceCurrentStatus {
  ACTIVE = 'ACTIVE',
  UNDER_REVIEW = 'UNDER_REVIEW',
  GRANT_SUSPENDED = 'GRANT_SUSPENDED',
  BLACKLISTED = 'BLACKLISTED',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
}

export interface IComplianceRecord {
  id: string;
  ngoName: string;
  organizationId?: string;
  state: string;
  district?: string;
  actionType: ComplianceActionType;
  actionDate?: string;
  scheme?: string;
  authority: string;
  orderNumber?: string;
  description: string;
  sourceDocument: string;
  verificationStatus: ComplianceVerificationStatus;
  currentStatus: ComplianceCurrentStatus;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// 15. Financial Intelligence & Invoices (Rules 16-22)
export interface IBudgetHead {
  name: string;
  sanctionedAmount: number;
  utilizedAmount: number;
  headLimit: number;
}

export interface IInvoice {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  vendorGstin: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  documentHash: string;
  isFlagged?: boolean;
  flagReason?: string;
}

export interface IFinancialRecord {
  id: string;
  projectId: string;
  organizationId?: string;
  financialYear: string;
  totalSanctionedGrant: number;
  totalDisbursedFunds: number;
  totalExpenditure: number;
  openingBalance: number;
  closingBalance: number;
  verifiedPhysicalProgressPercent: number;
  financialBurnPercent: number;
  budgetHeads: IBudgetHead[];
  invoices: IInvoice[];
  riskScore: number;
  anomaliesDetected: string[];
  lastAuditedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// 16. Corrective Action Lifecycle
export enum CorrectiveActionStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  OVERDUE = 'OVERDUE',
  SUBMITTED = 'SUBMITTED',
  VERIFIED = 'VERIFIED',
  CLOSED = 'CLOSED',
}

export enum CorrectiveActionPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ICorrectiveAction {
  id: string;
  actionNumber: string;
  title: string;
  description: string;
  responsibleAuthority: string;
  organizationId: string;
  projectId?: string;
  inspectionId?: string;
  anomalyId?: string;
  deadline: Date | string;
  priority: CorrectiveActionPriority;
  status: CorrectiveActionStatus;
  evidenceRequired: string;
  submittedEvidenceIds?: string[];
  officerRemarks?: string;
  assignedOfficerId?: string;
  resolvedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// 17. Beneficiary Profile & Integrity Registry (Rules 2-8)
export enum BeneficiaryEligibility {
  ELIGIBLE = 'ELIGIBLE',
  UNDER_REVIEW = 'UNDER_REVIEW',
  INELIGIBLE = 'INELIGIBLE',
}

export enum BeneficiaryVerificationStatus {
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

export interface IBeneficiary {
  id: string;
  beneficiaryId: string;
  name: string;
  dateOfBirth: string;
  age: number;
  guardianName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  category: 'SC' | 'ST' | 'OBC' | 'EWS' | 'GENERAL' | 'PWD';
  address: string;
  district: string;
  state: string;
  maskedPhone: string;
  phoneHash: string;
  organizationId: string;
  projectId: string;
  unitId?: string;
  scheme: string;
  enrollmentStartDate: string;
  enrollmentEndDate?: string;
  eligibilityStatus: BeneficiaryEligibility;
  verificationStatus: BeneficiaryVerificationStatus;
  riskLevel: RiskLevel;
  totalAttendanceSessions?: number;
  verifiedAttendanceSessions?: number;
  activeAnomaliesCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// 18. Video Conferencing (Surprise / Random VC Spot-Check)
export enum VCSessionStatus {
  SCHEDULED = 'SCHEDULED',
  INITIATED = 'INITIATED',
  CONNECTED = 'CONNECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export interface IVCSessionObservation {
  question: string;
  response: string;
  isSatisfactory: boolean;
}

export interface IVCSession {
  id: string;
  sessionCode: string;
  organizationId: string;
  projectId: string;
  initiatedByOfficerId: string;
  projectInchargeName: string;
  inchargePhone?: string;
  status: VCSessionStatus;
  isSurprise: boolean;
  scheduledTime?: Date | string;
  connectedTime?: Date | string;
  endedTime?: Date | string;
  reportedStaffCount: number;
  verifiedStaffCount: number;
  reportedBeneficiaryCount: number;
  verifiedBeneficiaryCount: number;
  observations: IVCSessionObservation[];
  notes: string;
  anomalyFlagged?: boolean;
  recordingUrl?: string;
  isIntegrationReady: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// 19. Explainable Multi-Factor Risk Score Breakdown
export interface IRiskScoreBreakdown {
  overallScore: number; // 0 - 100
  riskBand: RiskLevel;
  calculatedAt: Date | string;
  isDecisionSupportOnly: true;
  categoryBreakdown: {
    beneficiaryIntegrity: { score: number; max: 30; contributingFactors: string[] };
    attendance: { score: number; max: 25; contributingFactors: string[] };
    financial: { score: number; max: 20; contributingFactors: string[] };
    inspection: { score: number; max: 15; contributingFactors: string[] };
    compliance: { score: number; max: 10; contributingFactors: string[] };
  };
  summaryText: string;
}

