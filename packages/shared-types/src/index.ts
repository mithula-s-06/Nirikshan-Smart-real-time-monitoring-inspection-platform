// ============================================================================
// NIRIKSHAN SHARED DOMAIN TYPES
// ============================================================================

// 1. Role-Based Access Control (RBAC)
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  DEPARTMENT_OFFICIAL = 'DEPARTMENT_OFFICIAL',
  PMU_OFFICER = 'PMU_OFFICER',
  INSPECTOR = 'INSPECTOR',
  STATE_AUTHORITY = 'STATE_AUTHORITY',
  DISTRICT_AUTHORITY = 'DISTRICT_AUTHORITY',
  INSTITUTE_ADMIN = 'INSTITUTE_ADMIN',
  PROJECT_STAFF = 'PROJECT_STAFF',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface IUser {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  organizationId?: string;
  state?: string;
  district?: string;
  avatarUrl?: string;
  lastLoginAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
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
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
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

