import { Evidence, IEvidenceDocument } from '../models/evidence.model';
import { Inspection } from '../models/inspection.model';
import { Project } from '../models/project.model';
import { getStorageProvider } from '../storage';
import { calculateHaversineDistance } from '../utils/geo';
import { recordAudit } from './audit.service';
import { emitter } from '../socket/emitter';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { EvidenceType, IEvidence, UserRole, AuditAction } from '@nirikshan/shared-types';
import { UploadEvidenceMetadataInput } from '@nirikshan/validation';

export class EvidenceService {
  /**
   * Uploads and registers an inspection evidence asset with SHA-256 hashing and geoverification
   */
  public static async uploadEvidence(
    inspectionId: string,
    userId: string,
    userRole: UserRole,
    file: Express.Multer.File,
    metadata: UploadEvidenceMetadataInput,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<IEvidenceDocument> {
    if (!file) {
      throw new AppError('No file provided for evidence upload', 400, 'FILE_REQUIRED');
    }

    const inspection = await Inspection.findOne({
      $or: [{ _id: inspectionId.match(/^[0-9a-fA-F]{24}$/) ? inspectionId : null }, { inspectionId }],
    });

    if (!inspection) {
      throw new AppError(`Inspection with ID ${inspectionId} not found`, 404, 'INSPECTION_NOT_FOUND');
    }

    // RBAC check: Inspector must be the assigned officer unless admin/supervisor
    if (
      userRole === UserRole.INSPECTOR &&
      inspection.inspectorId.toString() !== userId
    ) {
      throw new AppError(
        'You are not authorized to upload evidence to an inspection assigned to another officer',
        403,
        'FORBIDDEN_INSPECTION_ACCESS',
      );
    }

    const project = await Project.findById(inspection.projectId);

    // Geolocation verification
    let isLocationVerified = false;
    let distanceFromProjectMeters: number | undefined;
    let locationPoint: { type: 'Point'; coordinates: [number, number] } | undefined;

    if (metadata.longitude !== undefined && metadata.latitude !== undefined) {
      locationPoint = {
        type: 'Point',
        coordinates: [metadata.longitude, metadata.latitude],
      };

      if (project && project.location && project.location.coordinates) {
        const [projLng, projLat] = project.location.coordinates as [number, number];
        distanceFromProjectMeters = calculateHaversineDistance(
          [metadata.longitude, metadata.latitude],
          [projLng, projLat],
        );

        const allowedRadius = project.geofenceRadiusMeters || 200;
        isLocationVerified = distanceFromProjectMeters <= allowedRadius;

        logger.info(
          {
            inspectionId: inspection.id,
            distanceFromProjectMeters,
            allowedRadius,
            isLocationVerified,
          },
          '📍 Evidence GPS Geofence Check computed',
        );
      }
    }

    // Infer evidence type if not explicitly set
    let inferredType = metadata.type || EvidenceType.PHOTO;
    if (file.mimetype.startsWith('video/')) {
      inferredType = EvidenceType.VIDEO;
    } else if (file.mimetype === 'application/pdf' || file.mimetype.includes('word')) {
      inferredType = EvidenceType.DOCUMENT;
    } else if (file.mimetype.startsWith('audio/')) {
      inferredType = EvidenceType.AUDIO;
    }

    // Upload to active storage provider (computes SHA-256 hash automatically)
    const storage = getStorageProvider();
    const uploadResult = await storage.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      `inspections/${inspection.id}`,
    );

    // Create Evidence record
    const evidence = await Evidence.create({
      inspectionId: inspection._id,
      projectId: project?._id,
      capturedBy: userId,
      capturedAt: metadata.capturedTimestamp ? new Date(metadata.capturedTimestamp) : new Date(),
      type: inferredType,
      fileUrl: uploadResult.url,
      fileKey: uploadResult.key,
      mimeType: uploadResult.mimeType,
      fileSize: uploadResult.size,
      sha256Hash: uploadResult.sha256Hash,
      isHashVerified: true,
      location: locationPoint,
      locationAccuracyMeters: metadata.accuracyMeters,
      isLocationVerified,
      distanceFromProjectMeters,
      checklistQuestionId: metadata.checklistQuestionId,
      deviceMetadata: {
        platform: metadata.devicePlatform,
        model: metadata.deviceModel,
        osVersion: metadata.osVersion,
        appVersion: metadata.appVersion,
        capturedTimestamp: metadata.capturedTimestamp ? new Date(metadata.capturedTimestamp) : undefined,
      },
      tags: metadata.tags || [],
      description: metadata.description || '',
    });

    // Link evidence ID to inspection
    if (!inspection.evidenceIds) {
      inspection.evidenceIds = [];
    }
    inspection.evidenceIds.push(evidence.id);

    // If linked to a checklist question item, attach to checklist answer
    if (metadata.checklistQuestionId && inspection.checklistResponses) {
      const checklistItem = inspection.checklistResponses.find(
        (item) => item.itemId === metadata.checklistQuestionId,
      );
      if (checklistItem) {
        if (!checklistItem.photoEvidenceIds) {
          checklistItem.photoEvidenceIds = [];
        }
        checklistItem.photoEvidenceIds.push(evidence.id);
      }
    }

    await inspection.save();

    await recordAudit({
      actorId: userId,
      action: AuditAction.EVIDENCE_UPLOADED,
      resource: 'EVIDENCE',
      resourceId: evidence.id,
      details: {
        inspectionId: inspection.id,
        fileKey: uploadResult.key,
        sha256Hash: uploadResult.sha256Hash,
        fileSize: uploadResult.size,
        type: inferredType,
        isLocationVerified,
      },
      ipAddress,
      userAgent,
    });

    emitter.emitEvidenceUploaded(inspection.id || inspection._id.toString(), evidence.toJSON ? evidence.toJSON() : evidence);

    return evidence;
  }

  /**
   * Retrieves all evidence for an inspection
   */
  public static async getEvidenceForInspection(
    inspectionId: string,
    type?: EvidenceType,
  ): Promise<IEvidenceDocument[]> {
    const query: any = {
      $or: [{ inspectionId: inspectionId.match(/^[0-9a-fA-F]{24}$/) ? inspectionId : null }],
    };

    if (!query.$or[0].inspectionId) {
      // Find by inspection code first
      const inspection = await Inspection.findOne({ inspectionId });
      if (inspection) {
        query.$or = [{ inspectionId: inspection._id }];
      }
    }

    if (type) {
      query.type = type;
    }

    return Evidence.find(query).sort({ capturedAt: -1 }).populate('capturedBy', 'name email role');
  }

  /**
   * Retrieves single evidence record
   */
  public static async getEvidenceById(evidenceId: string): Promise<IEvidenceDocument> {
    const evidence = await Evidence.findById(evidenceId)
      .populate('capturedBy', 'name email role')
      .populate('inspectionId', 'inspectionId status type')
      .populate('projectId', 'name code state district');

    if (!evidence) {
      throw new AppError(`Evidence record with ID ${evidenceId} not found`, 404, 'EVIDENCE_NOT_FOUND');
    }

    return evidence;
  }

  /**
   * Verifies SHA-256 integrity hash of an evidence file against storage
   */
  public static async verifyEvidenceIntegrity(evidenceId: string): Promise<{
    evidenceId: string;
    isTamperFree: boolean;
    expectedHash: string;
    actualHash?: string;
    verifiedAt: Date;
  }> {
    const evidence = await Evidence.findById(evidenceId);
    if (!evidence) {
      throw new AppError(`Evidence record with ID ${evidenceId} not found`, 404, 'EVIDENCE_NOT_FOUND');
    }

    const storage = getStorageProvider();
    const isTamperFree = await storage.verifyIntegrity(evidence.fileKey, evidence.sha256Hash);

    evidence.isHashVerified = isTamperFree;
    await evidence.save();

    return {
      evidenceId: evidence.id,
      isTamperFree,
      expectedHash: evidence.sha256Hash,
      verifiedAt: new Date(),
    };
  }

  /**
   * Deletes an evidence record and underlying stored asset
   */
  public static async deleteEvidence(
    evidenceId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const evidence = await Evidence.findById(evidenceId);
    if (!evidence) {
      throw new AppError(`Evidence record with ID ${evidenceId} not found`, 404, 'EVIDENCE_NOT_FOUND');
    }

    // Only creator or admin can delete evidence
    if (userRole !== UserRole.SUPER_ADMIN && evidence.capturedBy.toString() !== userId) {
      throw new AppError('Unauthorized to delete this evidence record', 403, 'FORBIDDEN');
    }

    const storage = getStorageProvider();
    await storage.deleteFile(evidence.fileKey);

    // Remove from inspection evidenceIds array
    await Inspection.findByIdAndUpdate(evidence.inspectionId, {
      $pull: { evidenceIds: evidence.id },
    });

    await Evidence.findByIdAndDelete(evidenceId);

    await recordAudit({
      actorId: userId,
      actorRole: userRole,
      action: AuditAction.EVIDENCE_DELETED,
      resource: 'EVIDENCE',
      resourceId: evidenceId,
      details: {
        inspectionId: evidence.inspectionId.toString(),
        fileKey: evidence.fileKey,
      },
    });
  }
}
