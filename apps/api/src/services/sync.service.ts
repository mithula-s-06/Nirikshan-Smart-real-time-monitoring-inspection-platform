import { Inspection } from '../models/inspection.model';
import { Project } from '../models/project.model';
import { ChecklistTemplate } from '../models/checklistTemplate.model';
import { calculateHaversineDistance } from '../utils/geo';
import { recordAudit } from './audit.service';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import {
  ISyncActionItem,
  ISyncPullResponse,
  ISyncPushRequest,
  ISyncPushResponse,
  ISyncPushResultItem,
  SyncActionType,
  InspectionStatus,
  AuditAction,
} from '@nirikshan/shared-types';

export class SyncService {
  /**
   * Pulls delta sync package for an inspector
   */
  public static async pullSyncPackage(
    inspectorId: string,
    lastSyncTimestamp?: string,
  ): Promise<ISyncPullResponse> {
    const inspectionQuery: any = {
      inspectorId,
      status: { $nin: [InspectionStatus.CLOSED] },
    };

    if (lastSyncTimestamp) {
      inspectionQuery.updatedAt = { $gte: new Date(lastSyncTimestamp) };
    }

    const assignedInspections = await Inspection.find(inspectionQuery).sort({ updatedAt: -1 });

    const projectIds = Array.from(new Set(assignedInspections.map((i) => i.projectId.toString())));
    const projects = await Project.find({ _id: { $in: projectIds } });

    const checklistTemplates = await ChecklistTemplate.find({ isActive: true });

    return {
      serverTimestamp: new Date(),
      assignedInspections: assignedInspections.map((i) => i.toJSON() as any),
      projects: projects.map((p) => p.toJSON() as any),
      checklistTemplates: checklistTemplates.map((t) => t.toJSON() as any),
    };
  }

  /**
   * Processes a batch of offline actions recorded on a mobile device
   */
  public static async processSyncBatch(
    inspectorId: string,
    request: ISyncPushRequest,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ISyncPushResponse> {
    const results: ISyncPushResultItem[] = [];
    let successCount = 0;
    let failureCount = 0;

    logger.info(
      { batchId: request.syncBatchId, count: request.actions.length, inspectorId },
      '🔄 Processing Offline Sync Batch...',
    );

    for (const action of request.actions) {
      try {
        const result = await this.executeSyncAction(inspectorId, action);
        results.push(result);
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (err: any) {
        logger.error({ err, actionId: action.id }, 'Sync action processing failed');
        failureCount++;
        results.push({
          actionId: action.id,
          idempotencyKey: action.idempotencyKey,
          actionType: action.actionType,
          inspectionId: action.inspectionId,
          success: false,
          error: err.message || 'Internal action execution failure',
        });
      }
    }

    await recordAudit({
      actorId: inspectorId,
      action: AuditAction.INSPECTION_UPDATED,
      resource: 'OFFLINE_SYNC',
      resourceId: request.syncBatchId,
      details: {
        batchId: request.syncBatchId,
        totalActions: request.actions.length,
        successCount,
        failureCount,
      },
      ipAddress,
      userAgent,
    });

    return {
      syncBatchId: request.syncBatchId,
      processedCount: request.actions.length,
      successCount,
      failureCount,
      results,
      serverTimestamp: new Date(),
    };
  }

  /**
   * Executes a single offline sync operation with conflict management
   */
  private static async executeSyncAction(
    inspectorId: string,
    action: ISyncActionItem,
  ): Promise<ISyncPushResultItem> {
    const inspection = await Inspection.findOne({
      $or: [
        { _id: action.inspectionId.match(/^[0-9a-fA-F]{24}$/) ? action.inspectionId : null },
        { inspectionId: action.inspectionId },
      ],
    });

    if (!inspection) {
      return {
        actionId: action.id,
        idempotencyKey: action.idempotencyKey,
        actionType: action.actionType,
        inspectionId: action.inspectionId,
        success: false,
        error: `Inspection ${action.inspectionId} not found on server`,
      };
    }

    // Conflict Check: If inspection was already approved or closed by admin, Server-Wins
    if ([InspectionStatus.APPROVED, InspectionStatus.CLOSED].includes(inspection.status)) {
      return {
        actionId: action.id,
        idempotencyKey: action.idempotencyKey,
        actionType: action.actionType,
        inspectionId: action.inspectionId,
        success: false,
        conflict: {
          resolved: true,
          strategy: 'SERVER_WINS',
          serverState: { status: inspection.status, updatedAt: inspection.updatedAt },
        },
        message: `Conflict: Inspection is already ${inspection.status}. Server state preserved.`,
      };
    }

    switch (action.actionType) {
      case SyncActionType.STATUS_CHANGE: {
        const { targetStatus, coordinates } = action.payload;

        if (targetStatus === InspectionStatus.ACCEPTED) {
          inspection.status = InspectionStatus.ACCEPTED;
          inspection.acceptedAt = new Date(action.clientTimestamp);
        } else if (targetStatus === InspectionStatus.EN_ROUTE) {
          inspection.status = InspectionStatus.EN_ROUTE;
          inspection.enRouteAt = new Date(action.clientTimestamp);
        } else if (targetStatus === InspectionStatus.ARRIVED) {
          inspection.status = InspectionStatus.ARRIVED;
          inspection.arrivedAt = new Date(action.clientTimestamp);
        } else if (targetStatus === InspectionStatus.IN_PROGRESS) {
          inspection.status = InspectionStatus.IN_PROGRESS;
          inspection.startedAt = new Date(action.clientTimestamp);
          inspection.isLocationVerified = true;
        }

        if (coordinates && Array.isArray(coordinates)) {
          inspection.locationLogs.push({
            timestamp: new Date(action.clientTimestamp),
            coordinates: coordinates as [number, number],
            distanceFromProjectMeters: 0,
            isVerified: true,
            stage: targetStatus === InspectionStatus.IN_PROGRESS ? 'START' : 'ARRIVE',
          });
        }

        await inspection.save();
        return {
          actionId: action.id,
          idempotencyKey: action.idempotencyKey,
          actionType: action.actionType,
          inspectionId: action.inspectionId,
          success: true,
          message: `Status updated to ${targetStatus}`,
        };
      }

      case SyncActionType.LOCATION_LOG: {
        const { coordinates, accuracyMeters, stage } = action.payload;
        if (!coordinates || !Array.isArray(coordinates)) {
          throw new Error('Valid coordinates array is required for location log');
        }

        inspection.locationLogs.push({
          timestamp: new Date(action.clientTimestamp),
          coordinates: coordinates as [number, number],
          accuracyMeters,
          distanceFromProjectMeters: 0,
          isVerified: true,
          stage: stage || 'ARRIVE',
        });

        await inspection.save();
        return {
          actionId: action.id,
          idempotencyKey: action.idempotencyKey,
          actionType: action.actionType,
          inspectionId: action.inspectionId,
          success: true,
          message: 'Location log appended',
        };
      }

      case SyncActionType.CHECKLIST_UPDATE: {
        const { checklistResponses } = action.payload;
        if (checklistResponses && Array.isArray(checklistResponses)) {
          inspection.checklistResponses = checklistResponses;
        }
        await inspection.save();
        return {
          actionId: action.id,
          idempotencyKey: action.idempotencyKey,
          actionType: action.actionType,
          inspectionId: action.inspectionId,
          success: true,
          message: 'Draft checklist items updated',
        };
      }

      case SyncActionType.FULL_SUBMISSION: {
        const { observations, recommendations, checklistResponses } = action.payload;

        if (checklistResponses && Array.isArray(checklistResponses)) {
          inspection.checklistResponses = checklistResponses;

          // Compute compliance score
          let totalScoreItems = 0;
          let compliantItems = 0;
          for (const item of checklistResponses) {
            if (typeof item.value === 'boolean') {
              totalScoreItems++;
              if (item.value === true) compliantItems++;
            }
          }
          inspection.score =
            totalScoreItems > 0 ? Math.round((compliantItems / totalScoreItems) * 100) : 100;
        }

        inspection.observations = observations || inspection.observations;
        inspection.recommendations = recommendations || inspection.recommendations;
        inspection.status = InspectionStatus.SUBMITTED;
        inspection.submittedAt = new Date(action.clientTimestamp);
        inspection.completedAt = new Date(action.clientTimestamp);

        await inspection.save();
        return {
          actionId: action.id,
          idempotencyKey: action.idempotencyKey,
          actionType: action.actionType,
          inspectionId: action.inspectionId,
          success: true,
          message: `Offline inspection successfully submitted with score ${inspection.score}%`,
        };
      }

      default:
        return {
          actionId: action.id,
          idempotencyKey: action.idempotencyKey,
          actionType: action.actionType,
          inspectionId: action.inspectionId,
          success: false,
          error: `Unrecognized sync action type: ${action.actionType}`,
        };
    }
  }
}
