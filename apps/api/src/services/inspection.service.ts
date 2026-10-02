import {
  InspectionStatus,
  InspectionType,
  InspectionPriority,
  AuditAction,
  UserRole,
  RiskLevel,
} from '@nirikshan/shared-types';
import { Inspection, IInspectionDocument } from '../models/inspection.model';
import { Project } from '../models/project.model';
import { User } from '../models/user.model';
import { NotFoundError, ValidationError, AuthorizationError, GeoVerificationError } from '../utils/errors';
import { verifyCoordinatesWithinPerimeter } from '../utils/geo';
import { recordAudit } from './audit.service';
import { emitter } from '../socket/emitter';
import { SubmitInspectionInput, ReviewInspectionInput } from '@nirikshan/validation';

export interface GetInspectionsQuery {
  page?: number;
  limit?: number;
  status?: InspectionStatus;
  inspectorId?: string;
  projectId?: string;
  type?: InspectionType;
  priority?: InspectionPriority;
}

export class InspectionService {
  /**
   * Manual creation of an inspection assignment by an official
   */
  public static async createInspection(
    input: any,
    creator?: { id: string; email: string; role: UserRole },
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const project = await Project.findById(input.projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID '${input.projectId}' not found.`);
    }

    const inspector = await User.findById(input.inspectorId);
    if (!inspector || inspector.role !== UserRole.INSPECTOR) {
      throw new ValidationError(`Selected user is not an active inspector.`);
    }

    // Conflict of Interest check
    if (inspector.organizationId && project.organizationId) {
      if (inspector.organizationId.toString() === project.organizationId.toString()) {
        throw new ValidationError('Conflict of Interest: Inspector belongs to the same organization as the project.');
      }
    }

    const timestamp = Date.now().toString().slice(-4);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const inspectionId = `INSP-${new Date().getFullYear()}-${timestamp}-${randomSuffix}`;

    const inspection = await Inspection.create({
      inspectionId,
      projectId: project._id,
      inspectorId: inspector._id,
      assignedBy: creator?.id,
      type: input.type,
      priority: input.priority || InspectionPriority.MEDIUM,
      status: InspectionStatus.ASSIGNED,
      assignedAt: new Date(),
      assignmentReason: input.assignmentReason || 'Direct assignment by department official.',
      auditHistory: [
        {
          stage: 'ASSIGNED',
          timestamp: new Date(),
          actorId: creator?.id,
          comment: 'Direct assignment',
        },
      ],
    });

    if (creator) {
      await recordAudit({
        actorId: creator.id,
        actorEmail: creator.email,
        actorRole: creator.role,
        action: AuditAction.INSPECTION_ASSIGNED,
        resource: 'Inspection',
        resourceId: inspection._id.toString(),
        ipAddress,
        userAgent,
        requestId,
        details: { inspectionId, projectId: project._id.toString(), inspectorId: inspector._id.toString() },
      });
    }

    emitter.emitInspectionAssigned(inspection.toJSON());
    return inspection.toJSON();
  }

  public static async getInspections(query: GetInspectionsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.status) filter.status = query.status;
    if (query.inspectorId) filter.inspectorId = query.inspectorId;
    if (query.projectId) filter.projectId = query.projectId;
    if (query.type) filter.type = query.type;
    if (query.priority) filter.priority = query.priority;

    const [items, total] = await Promise.all([
      Inspection.find(filter)
        .populate('projectId', 'name code scheme state district location geofenceRadiusMeters riskLevel')
        .populate('inspectorId', 'name email phoneNumber')
        .sort({ assignedAt: -1 })
        .skip(skip)
        .limit(limit),
      Inspection.countDocuments(filter),
    ]);

    return {
      items: items.map((i) => i.toJSON()),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async getInspectionById(id: string) {
    const inspection = await Inspection.findById(id)
      .populate('projectId')
      .populate('inspectorId', 'name email phoneNumber organizationId state district')
      .populate('assignedBy', 'name email role')
      .populate('reviewedBy', 'name email role');

    if (!inspection) {
      throw new NotFoundError(`Inspection with ID '${id}' was not found.`);
    }

    return inspection.toJSON();
  }

  /**
   * STEP 1: Inspector accepts assignment
   */
  public static async acceptInspection(id: string, actor: { id: string; email: string; role: UserRole }) {
    const inspection = await Inspection.findById(id);
    if (!inspection) throw new NotFoundError('Inspection not found.');

    if (actor.role === UserRole.INSPECTOR && inspection.inspectorId.toString() !== actor.id) {
      throw new AuthorizationError('You can only accept inspections assigned to you.');
    }

    if (inspection.status !== InspectionStatus.ASSIGNED && inspection.status !== InspectionStatus.CREATED) {
      throw new ValidationError(`Cannot accept inspection from current status '${inspection.status}'.`);
    }

    const oldStatus = inspection.status;
    inspection.status = InspectionStatus.ACCEPTED;
    inspection.acceptedAt = new Date();
    inspection.auditHistory.push({
      stage: 'ACCEPTED',
      timestamp: new Date(),
      actorId: actor.id,
      comment: 'Inspector accepted assignment',
    });

    await inspection.save();
    emitter.emitInspectionStatusChanged(inspection.toJSON(), oldStatus, InspectionStatus.ACCEPTED);
    return inspection.toJSON();
  }

  /**
   * STEP 2: Inspector is en route
   */
  public static async enRouteInspection(id: string, actor: { id: string; email: string; role: UserRole }) {
    const inspection = await Inspection.findById(id);
    if (!inspection) throw new NotFoundError('Inspection not found.');

    if (actor.role === UserRole.INSPECTOR && inspection.inspectorId.toString() !== actor.id) {
      throw new AuthorizationError('You can only update inspections assigned to you.');
    }

    const oldStatus = inspection.status;
    inspection.status = InspectionStatus.EN_ROUTE;
    inspection.enRouteAt = new Date();
    inspection.auditHistory.push({
      stage: 'EN_ROUTE',
      timestamp: new Date(),
      actorId: actor.id,
      comment: 'Inspector marked en route to project site',
    });

    await inspection.save();
    emitter.emitInspectionStatusChanged(inspection.toJSON(), oldStatus, InspectionStatus.EN_ROUTE);
    return inspection.toJSON();
  }

  /**
   * STEP 3: Inspector arrives on site (GPS logged)
   */
  public static async arriveInspection(
    id: string,
    coordinates: [number, number],
    accuracyMeters: number | undefined,
    actor: { id: string; email: string; role: UserRole },
  ) {
    const inspection = await Inspection.findById(id).populate('projectId');
    if (!inspection) throw new NotFoundError('Inspection not found.');

    const project = inspection.projectId as any;
    const projectCoords: [number, number] = project.location.coordinates;

    const geoResult = verifyCoordinatesWithinPerimeter(coordinates, projectCoords, project.geofenceRadiusMeters);

    inspection.locationLogs.push({
      timestamp: new Date(),
      coordinates,
      accuracyMeters,
      distanceFromProjectMeters: geoResult.distanceMeters,
      isVerified: geoResult.isVerified,
      stage: 'ARRIVE',
    });

    const oldStatus = inspection.status;
    inspection.status = InspectionStatus.ARRIVED;
    inspection.arrivedAt = new Date();
    inspection.isLocationVerified = geoResult.isVerified;
    inspection.auditHistory.push({
      stage: 'ARRIVED',
      timestamp: new Date(),
      actorId: actor.id,
      comment: `Arrived on site. Distance: ${geoResult.distanceMeters}m (Verified: ${geoResult.isVerified})`,
    });

    await inspection.save();
    emitter.emitInspectionStatusChanged(inspection.toJSON(), oldStatus, InspectionStatus.ARRIVED);
    return {
      inspection: inspection.toJSON(),
      geoVerification: geoResult,
    };
  }

  /**
   * STEP 4: Inspector starts physical inspection (Strict GPS verification enforced)
   */
  public static async startInspection(
    id: string,
    coordinates: [number, number],
    accuracyMeters: number | undefined,
    actor: { id: string; email: string; role: UserRole },
  ) {
    const inspection = await Inspection.findById(id).populate('projectId');
    if (!inspection) throw new NotFoundError('Inspection not found.');

    const project = inspection.projectId as any;
    const projectCoords: [number, number] = project.location.coordinates;

    // Strict server-side GPS verification
    const geoResult = verifyCoordinatesWithinPerimeter(coordinates, projectCoords, project.geofenceRadiusMeters);

    inspection.locationLogs.push({
      timestamp: new Date(),
      coordinates,
      accuracyMeters,
      distanceFromProjectMeters: geoResult.distanceMeters,
      isVerified: geoResult.isVerified,
      stage: 'START',
    });

    if (!geoResult.isVerified) {
      await inspection.save();
      throw new GeoVerificationError(
        `GPS verification failed: You are ${geoResult.distanceMeters}m away from the project site (allowed geofence radius: ${project.geofenceRadiusMeters}m). You must be on-site to start inspection.`,
        geoResult,
      );
    }

    const oldStatus = inspection.status;
    inspection.status = InspectionStatus.IN_PROGRESS;
    inspection.startedAt = new Date();
    inspection.isLocationVerified = true;
    inspection.auditHistory.push({
      stage: 'IN_PROGRESS',
      timestamp: new Date(),
      actorId: actor.id,
      comment: `Inspection started. GPS verified on-site (${geoResult.distanceMeters}m from centroid).`,
    });

    await inspection.save();

    await recordAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: AuditAction.INSPECTION_STARTED,
      resource: 'Inspection',
      resourceId: inspection._id.toString(),
      details: { inspectionId: inspection.inspectionId, distanceMeters: geoResult.distanceMeters },
    });

    emitter.emitInspectionStatusChanged(inspection.toJSON(), oldStatus, InspectionStatus.IN_PROGRESS);

    return {
      inspection: inspection.toJSON(),
      geoVerification: geoResult,
    };
  }

  /**
   * STEP 5: Inspector submits checklist responses & findings
   */
  public static async submitInspection(
    id: string,
    input: SubmitInspectionInput,
    actor: { id: string; email: string; role: UserRole },
  ) {
    const inspection = await Inspection.findById(id).populate('projectId');
    if (!inspection) throw new NotFoundError('Inspection not found.');

    const project = inspection.projectId as any;
    const projectCoords: [number, number] = project.location.coordinates;

    // Verify submission location
    const geoResult = verifyCoordinatesWithinPerimeter(input.location.coordinates, projectCoords, project.geofenceRadiusMeters);

    inspection.locationLogs.push({
      timestamp: new Date(),
      coordinates: input.location.coordinates,
      accuracyMeters: input.location.accuracyMeters,
      distanceFromProjectMeters: geoResult.distanceMeters,
      isVerified: geoResult.isVerified,
      stage: 'SUBMIT',
    });

    // Calculate score
    const totalItems = input.checklistResponses.length;
    const compliantItems = input.checklistResponses.filter((item) => item.isCompliant !== false).length;
    const calculatedScore = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 100;

    const oldStatus = inspection.status;
    inspection.checklistResponses = input.checklistResponses as any;
    inspection.observations = input.observations;
    inspection.recommendations = input.recommendations;
    inspection.score = calculatedScore;
    inspection.status = InspectionStatus.SUBMITTED;
    inspection.submittedAt = new Date();
    inspection.completedAt = new Date();
    inspection.isLocationVerified = geoResult.isVerified;

    inspection.auditHistory.push({
      stage: 'SUBMITTED',
      timestamp: new Date(),
      actorId: actor.id,
      comment: `Report submitted. Score: ${calculatedScore}%. Verified: ${geoResult.isVerified}.`,
    });

    await inspection.save();

    await recordAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: AuditAction.REPORT_SUBMITTED,
      resource: 'Inspection',
      resourceId: inspection._id.toString(),
      details: { inspectionId: inspection.inspectionId, score: calculatedScore },
    });

    emitter.emitInspectionStatusChanged(inspection.toJSON(), oldStatus, InspectionStatus.SUBMITTED);

    return inspection.toJSON();
  }

  /**
   * STEP 6: Department Official / Authority reviews report
   */
  public static async reviewInspection(
    id: string,
    input: ReviewInspectionInput,
    actor: { id: string; email: string; role: UserRole },
  ) {
    const inspection = await Inspection.findById(id).populate('projectId');
    if (!inspection) throw new NotFoundError('Inspection not found.');

    if (inspection.status !== InspectionStatus.SUBMITTED && inspection.status !== InspectionStatus.UNDER_REVIEW) {
      throw new ValidationError(`Cannot review inspection in status '${inspection.status}'.`);
    }

    const oldStatus = inspection.status;
    const newStatus =
      input.decision === 'APPROVED'
        ? InspectionStatus.APPROVED
        : input.decision === 'ACTION_REQUIRED'
          ? InspectionStatus.ACTION_REQUIRED
          : InspectionStatus.CLOSED;

    inspection.status = newStatus;
    inspection.reviewedAt = new Date();
    inspection.reviewedBy = actor.id as any;
    inspection.reviewNotes = input.reviewNotes;
    inspection.actionRequiredDetails = input.actionRequiredDetails;

    inspection.auditHistory.push({
      stage: newStatus,
      timestamp: new Date(),
      actorId: actor.id,
      comment: `Review Decision: ${input.decision}. Notes: ${input.reviewNotes}`,
    });

    await inspection.save();

    // Update project last inspection date and adjust risk level
    const project = await Project.findById(inspection.projectId);
    if (project) {
      project.lastInspectedAt = new Date();
      if (inspection.score && inspection.score < 60) {
        project.riskLevel = RiskLevel.HIGH;
        project.riskScore = Math.min(100, (project.riskScore || 50) + 20);
      } else if (inspection.score && inspection.score > 85) {
        project.riskLevel = RiskLevel.LOW;
        project.riskScore = Math.max(10, (project.riskScore || 50) - 15);
      }
      await project.save();
    }

    await recordAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: input.decision === 'APPROVED' ? AuditAction.REPORT_APPROVED : AuditAction.REPORT_REJECTED,
      resource: 'Inspection',
      resourceId: inspection._id.toString(),
      details: { inspectionId: inspection.inspectionId, decision: input.decision },
    });

    emitter.emitInspectionStatusChanged(inspection.toJSON(), oldStatus, newStatus);

    return inspection.toJSON();
  }
}
