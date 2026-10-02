import { z } from 'zod';
import {
  UserRole,
  UserStatus,
  OrganizationType,
  ProjectStatus,
  RiskLevel,
  InspectionType,
  InspectionPriority,
  InspectionStatus,
  ChecklistItemType,
  EvidenceType,
  AnomalyType,
  AnomalySeverity,
  AlertStatus,
  SyncActionType,
  CameraStatus,
  StreamProtocol,
} from '@nirikshan/shared-types';

// ==========================================
// AUTH SCHEMAS
// ==========================================
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.nativeEnum(UserRole),
  phoneNumber: z.string().optional(),
  organizationId: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
});

// ==========================================
// GEOLOCATION SCHEMAS
// ==========================================
export const geoPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([
    z.number().min(-180).max(180), // Longitude
    z.number().min(-90).max(90),   // Latitude
  ]),
});

export const gpsVerificationSchema = z.object({
  coordinates: z.tuple([z.number(), z.number()]),
  accuracyMeters: z.number().nonnegative().optional(),
  stage: z.enum(['ACCEPT', 'ARRIVE', 'START', 'SUBMIT']),
});

// ==========================================
// ORGANIZATION SCHEMAS
// ==========================================
export const createOrganizationSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).toUpperCase(),
  type: z.nativeEnum(OrganizationType),
  state: z.string().min(2),
  district: z.string().min(2),
  address: z.string().min(5),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(8),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

// ==========================================
// PROJECT SCHEMAS
// ==========================================
export const createProjectSchema = z.object({
  name: z.string().min(3),
  code: z.string().min(2).toUpperCase(),
  organizationId: z.string(),
  scheme: z.string().min(2),
  description: z.string().default(''),
  address: z.string().min(5),
  district: z.string().min(2),
  state: z.string().min(2),
  location: geoPointSchema,
  geofenceRadiusMeters: z.number().positive().default(200),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.ACTIVE),
  riskLevel: z.nativeEnum(RiskLevel).default(RiskLevel.LOW),
  riskScore: z.number().min(0).max(100).default(10),
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(8),
});

export const updateProjectSchema = createProjectSchema.partial();

export const nearbyProjectsQuerySchema = z.object({
  longitude: z.coerce.number().min(-180).max(180),
  latitude: z.coerce.number().min(-90).max(90),
  maxDistanceMeters: z.coerce.number().positive().default(50000), // default 50km
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ==========================================
// INSPECTION SCHEMAS
// ==========================================
export const createInspectionSchema = z.object({
  projectId: z.string(),
  inspectorId: z.string(),
  type: z.nativeEnum(InspectionType),
  priority: z.nativeEnum(InspectionPriority).default(InspectionPriority.MEDIUM),
  scheduledDate: z.string().optional(),
  assignmentReason: z.string().optional(),
});

export const autoAssignInspectionSchema = z.object({
  state: z.string().optional(),
  district: z.string().optional(),
  type: z.nativeEnum(InspectionType).default(InspectionType.SURPRISE),
  priority: z.nativeEnum(InspectionPriority).default(InspectionPriority.HIGH),
  count: z.number().int().positive().max(20).default(3),
});

export const inspectionLocationActionSchema = z.object({
  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
  ]),
  accuracyMeters: z.number().nonnegative().optional(),
});

export const submitInspectionSchema = z.object({
  observations: z.string().optional(),
  recommendations: z.string().optional(),
  checklistResponses: z.array(
    z.object({
      itemId: z.string(),
      category: z.string(),
      question: z.string(),
      type: z.nativeEnum(ChecklistItemType),
      value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
      comment: z.string().optional(),
      photoEvidenceIds: z.array(z.string()).optional(),
      isCompliant: z.boolean().optional(),
    }),
  ),
  location: z.object({
    coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
    accuracyMeters: z.number().optional(),
  }),
});

export const reviewInspectionSchema = z.object({
  decision: z.enum(['APPROVED', 'ACTION_REQUIRED', 'REJECTED']),
  reviewNotes: z.string().min(5, 'Review notes must be at least 5 characters'),
  actionRequiredDetails: z.string().optional(),
});

export const createChecklistTemplateSchema = z.object({
  name: z.string().min(3),
  code: z.string().min(2).toUpperCase(),
  scheme: z.string().optional(),
  categories: z.array(
    z.object({
      categoryName: z.string(),
      questions: z.array(
        z.object({
          id: z.string(),
          question: z.string(),
          type: z.nativeEnum(ChecklistItemType),
          isRequired: z.boolean().default(true),
          weight: z.number().default(1),
          helpText: z.string().optional(),
        }),
      ),
    }),
  ),
});

export const uploadEvidenceMetadataSchema = z.object({
  type: z.nativeEnum(EvidenceType).default(EvidenceType.PHOTO),
  description: z.string().optional(),
  checklistQuestionId: z.string().optional(),
  tags: z.union([z.array(z.string()), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [val];
      } catch {
        return val.split(',').map((s) => s.trim());
      }
    }
    return val;
  }).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  accuracyMeters: z.coerce.number().nonnegative().optional(),
  devicePlatform: z.string().optional(),
  deviceModel: z.string().optional(),
  osVersion: z.string().optional(),
  appVersion: z.string().optional(),
  capturedTimestamp: z.string().optional(),
});

export const verifyEvidenceHashSchema = z.object({
  expectedSha256Hash: z.string().length(64, 'SHA-256 hash must be exactly 64 hexadecimal characters'),
});

// ==========================================
// OFFLINE SYNC SCHEMAS
// ==========================================
export const syncPullSchema = z.object({
  lastSyncTimestamp: z.string().optional(),
});

export const syncActionItemSchema = z.object({
  id: z.string().min(1, 'Action ID is required'),
  idempotencyKey: z.string().min(1, 'Idempotency key is required'),
  actionType: z.nativeEnum(SyncActionType),
  inspectionId: z.string().min(1, 'Inspection ID is required'),
  payload: z.record(z.any()),
  clientTimestamp: z.string().or(z.date()),
  retryCount: z.number().int().nonnegative().optional().default(0),
});

export const syncPushSchema = z.object({
  syncBatchId: z.string().min(1, 'Sync batch ID is required'),
  actions: z.array(syncActionItemSchema).min(1, 'At least one sync action is required'),
});

// ==========================================
// PAGINATION & QUERY SCHEMAS
// ==========================================
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==========================================
// ANOMALY DETECTION & AI SCHEMAS
// ==========================================
export const analyzeAttendanceSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  inspectionId: z.string().optional(),
  claimedAttendance: z.coerce.number().nonnegative('Claimed attendance must be 0 or greater'),
  observedAttendance: z.coerce.number().nonnegative('Observed attendance must be 0 or greater'),
  historicalAverage: z.coerce.number().nonnegative().optional(),
  date: z.string().optional(),
});

export const analyzeProgressVelocitySchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  reportedPhysicalProgressPct: z.coerce.number().min(0).max(100, 'Progress percentage must be between 0 and 100'),
  disbursedFundsAmount: z.coerce.number().nonnegative('Disbursed funds must be non-negative'),
  sanctionedBudgetAmount: z.coerce.number().positive('Sanctioned budget must be greater than 0'),
  expectedProgressPct: z.coerce.number().min(0).max(100).optional(),
  durationDaysElapsed: z.coerce.number().positive().optional(),
});

export const analyzeDuplicateEvidenceSchema = z.object({
  evidenceId: z.string().min(1, 'Evidence ID is required'),
  sha256Hash: z.string().length(64, 'SHA-256 hash must be 64 characters'),
  projectId: z.string().min(1, 'Project ID is required'),
  inspectionId: z.string().optional(),
});

export const updateAlertStatusSchema = z.object({
  status: z.nativeEnum(AlertStatus),
  resolutionNotes: z.string().max(1000).optional(),
  assignedOfficerId: z.string().optional(),
});

export const getAlertsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.nativeEnum(AlertStatus).optional(),
  severity: z.nativeEnum(AnomalySeverity).optional(),
  type: z.nativeEnum(AnomalyType).optional(),
  projectId: z.string().optional(),
});

// ==========================================
// CCTV & LIVE STREAM SCHEMAS
// ==========================================
export const createCCTVCameraSchema = z.object({
  name: z.string().min(2, 'Camera name must be at least 2 characters'),
  code: z.string().min(2, 'Camera code must be at least 2 characters').toUpperCase(),
  projectId: z.string().min(1, 'Project ID is required'),
  locationDescription: z.string().min(2, 'Location description is required'),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  protocol: z.nativeEnum(StreamProtocol).default(StreamProtocol.HLS),
  rawStreamUrl: z.string().optional(),
  isDemo: z.boolean().default(false),
  resolution: z.string().default('1080p'),
  fps: z.coerce.number().int().positive().default(30),
});

export const updateCCTVCameraSchema = z.object({
  name: z.string().min(2).optional(),
  locationDescription: z.string().min(2).optional(),
  status: z.nativeEnum(CameraStatus).optional(),
  protocol: z.nativeEnum(StreamProtocol).optional(),
  rawStreamUrl: z.string().optional(),
  isDemo: z.boolean().optional(),
  resolution: z.string().optional(),
  fps: z.coerce.number().int().positive().optional(),
});

export const cameraHeartbeatSchema = z.object({
  status: z.nativeEnum(CameraStatus).default(CameraStatus.ONLINE),
  fps: z.coerce.number().int().positive().optional(),
  resolution: z.string().optional(),
  cpuUsagePct: z.coerce.number().min(0).max(100).optional(),
  memoryUsagePct: z.coerce.number().min(0).max(100).optional(),
});

export const generateStreamTokenSchema = z.object({
  ttlSeconds: z.coerce.number().int().positive().max(86400).default(3600),
});

export const getCCTVQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  projectId: z.string().optional(),
  status: z.nativeEnum(CameraStatus).optional(),
  protocol: z.nativeEnum(StreamProtocol).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;
export type AutoAssignInspectionInput = z.infer<typeof autoAssignInspectionSchema>;
export type SubmitInspectionInput = z.infer<typeof submitInspectionSchema>;
export type ReviewInspectionInput = z.infer<typeof reviewInspectionSchema>;
export type GpsVerificationInput = z.infer<typeof gpsVerificationSchema>;
export type CreateChecklistTemplateInput = z.infer<typeof createChecklistTemplateSchema>;
export type UploadEvidenceMetadataInput = z.infer<typeof uploadEvidenceMetadataSchema>;
export type VerifyEvidenceHashInput = z.infer<typeof verifyEvidenceHashSchema>;
export type SyncPullInput = z.infer<typeof syncPullSchema>;
export type SyncActionItemInput = z.infer<typeof syncActionItemSchema>;
export type SyncPushInput = z.infer<typeof syncPushSchema>;
export type AnalyzeAttendanceInput = z.infer<typeof analyzeAttendanceSchema>;
export type AnalyzeProgressVelocityInput = z.infer<typeof analyzeProgressVelocitySchema>;
export type AnalyzeDuplicateEvidenceInput = z.infer<typeof analyzeDuplicateEvidenceSchema>;
export type UpdateAlertStatusInput = z.infer<typeof updateAlertStatusSchema>;
export type GetAlertsQueryInput = z.infer<typeof getAlertsQuerySchema>;
export type CreateCCTVCameraInput = z.infer<typeof createCCTVCameraSchema>;
export type UpdateCCTVCameraInput = z.infer<typeof updateCCTVCameraSchema>;
export type CameraHeartbeatInput = z.infer<typeof cameraHeartbeatSchema>;
export type GenerateStreamTokenInput = z.infer<typeof generateStreamTokenSchema>;
export type GetCCTVQueryInput = z.infer<typeof getCCTVQuerySchema>;


